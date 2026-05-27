import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../../config/index.js';
import { isUrl } from '../../utils/telegram.js';
import { parseDuration } from '../../utils/duration.js';
import { isAppleMusicUrl, isSpotifyUrl, resolveAppleMusicUrlMetadata, resolveSpotifyTrackMetadata, searchNexRayByService, searchNexRayYouTube } from './nexray.js';
import { downloadViaPlatformProvider, isPlatformTrackRequiringProvider } from './platform-downloader.js';

const SUPPORTED_HOSTS = ['youtube.com', 'youtu.be', 'open.spotify.com', 'music.apple.com', 'soundcloud.com'];
const INVALID_PLAYLIST_TITLE_PATTERNS = [/^\[private video\]$/i, /^\[deleted video\]$/i, /\b(private|deleted|unavailable|blocked|age[-\s]?restricted)\b/i];

function isSupportedHost(host, supportedHost) {
  return host === supportedHost || host.endsWith(`.${supportedHost}`);
}
const MAX_ERROR_LENGTH = 700;

function isValidHttpUrl(value) {
  if (!value) return false;
  try {
    const parsed = new URL(String(value).trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function bestThumbnail(entry, fallback = '') {
  if (isValidHttpUrl(entry?.thumbnail)) return entry.thumbnail;
  if (Array.isArray(entry?.thumbnails)) {
    for (const candidate of [...entry.thumbnails].reverse()) {
      if (isValidHttpUrl(candidate?.url)) return candidate.url;
    }
  }
  return isValidHttpUrl(fallback) ? fallback : '';
}

function timeoutSignal(timeoutMs) {
  const value = Number(timeoutMs);
  return Number.isFinite(value) && value > 0 ? AbortSignal.timeout(value) : undefined;
}

function shortenError(message) {
  const text = String(message ?? '').replace(/\s+/g, ' ').trim();
  if (text.includes("Sign in to confirm you're not a bot")) {
    return 'YouTube meminta login/cookies. Isi COOKIES_PATH dengan file cookies YouTube yang valid, lalu coba lagi.';
  }
  if (text.includes('No supported JavaScript runtime could be found')) {
    return 'yt-dlp butuh JavaScript runtime untuk extractor YouTube. Install deno/node runtime yang didukung atau update yt-dlp.';
  }

  return text.length > MAX_ERROR_LENGTH ? `${text.slice(0, MAX_ERROR_LENGTH)}…` : text;
}

async function cookieArgs() {
  if (config.cookiesPath.length > 0) return ['--cookies', config.cookiesPath[0]];
  if (config.cookiesUrl.length === 0) return [];

  const cookieUrl = config.cookiesUrl[0];
  const cookieFile = path.join(config.downloadsDir, 'yt-dlp-cookies.txt');
  const response = await fetch(cookieUrl, { signal: timeoutSignal(config.requestTimeoutMs) });
  if (!response.ok) throw new Error(`Failed to fetch cookies: ${response.status} ${response.statusText}`);
  await fs.writeFile(cookieFile, await response.text(), { mode: 0o600 });
  return ['--cookies', cookieFile];
}

async function ytDlpBaseArgs({ allowPlaylist = false } = {}) {
  const playlistArgs = allowPlaylist ? [] : ['--no-playlist'];
  return [...playlistArgs, '--js-runtimes', 'node', ...(await cookieArgs())];
}

async function ytDlpInfoArgs({ allowPlaylist = false } = {}) {
  const args = ['--dump-single-json', ...(await ytDlpBaseArgs({ allowPlaylist }))];
  if (allowPlaylist) {
    args.push('--ignore-errors', '--no-abort-on-error', '--flat-playlist');
  }
  return args;
}

function run(command, args, { timeoutMs = config.ytdlpTimeoutMs } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let settled = false;
    const timeout = Number(timeoutMs) > 0
      ? setTimeout(() => {
        if (settled) return;
        settled = true;
        if (!child.killed) child.kill('SIGTERM');
        setTimeout(() => {
          if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
        }, 5000).unref?.();
        reject(new Error(`${command} timeout setelah ${Math.round(timeoutMs / 1000)} detik. Coba ulangi lagu/link lain atau naikkan YTDLP_TIMEOUT_MS.`));
      }, timeoutMs)
      : null;
    timeout?.unref?.();
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => {
      if (settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);
      reject(error);
    });
    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);
      if (code === 0) resolve(stdout);
      else reject(new Error(shortenError(stderr || `${command} exited with code ${code}`)));
    });
  });
}

export class Downloader {
  constructor(input, { defaultService = config.defaultService } = {}) {
    this.input = input;
    this.defaultService = defaultService;
  }

  isUrl() {
    return isUrl(this.input);
  }

  isValid() {
    if (!this.isUrl()) return true;
    const host = new URL(this.input).hostname.toLowerCase().replace(/^www\./, '');
    return SUPPORTED_HOSTS.some((supported) => isSupportedHost(host, supported));
  }

  async getInfo(options = {}) {
    const { mode = 'auto', allowPlaylist = false } = options;
    const shouldSearch = mode === 'request' || (mode === 'auto' && !this.isUrl());
    if (shouldSearch) {
      const service = String(this.defaultService).toLowerCase().replace(/\s+/g, '_');
      if (service.includes('youtube')) {
        try {
          const results = await searchNexRayYouTube(this.input);
          if (results.length > 0) return { platform: 'YouTube', results, selectionRequired: true };
        } catch (error) {
          console.warn('API YouTube search failed, falling back to yt-dlp:', error.message);
        }
      } else if (['spotify', 'soundcloud', 'apple_music'].includes(service)) {
        const results = await searchNexRayByService(service, this.input);
        return { platform: this.defaultService, results, selectionRequired: true };
      }
    }

    if (this.isUrl() && isSpotifyUrl(this.input)) {
      const resolved = await resolveSpotifyTrackMetadata(this.input);
      if (resolved.trackLinkRequired) return { platform: 'Spotify', results: [], trackLinkRequired: true, selectionRequired: false };
      return { platform: 'Spotify', results: resolved.tracks, selectionRequired: resolved.tracks.length > 1 };
    }

    if (this.isUrl() && isAppleMusicUrl(this.input)) {
      const resolved = await resolveAppleMusicUrlMetadata(this.input);
      if (resolved.trackRequired) return { platform: 'Apple Music', results: [], trackLinkRequired: true, selectionRequired: false };
      return { platform: 'Apple Music', results: resolved.tracks, selectionRequired: resolved.tracks.length > 1 };
    }

    const query = this.isUrl() ? this.input : `ytsearch10:${this.input}`;
    const output = await run('yt-dlp', [...(await ytDlpInfoArgs({ allowPlaylist })), query]);
    const parsed = JSON.parse(output);
    const entries = parsed.entries ?? [parsed];
    return {
      platform: this.detectPlatform(),
      results: entries.filter(Boolean).map((entry) => this.#trackFromEntry(entry)),
    };
  }

  async validatePlaylistItem(item, { isVideo = false } = {}) {
    const baseTitle = String(item?.name ?? '').trim();
    const baseUrl = String(item?.url ?? '').trim();
    if (!baseTitle || !baseUrl || !isUrl(baseUrl)) return null;
    if (INVALID_PLAYLIST_TITLE_PATTERNS.some((pattern) => pattern.test(baseTitle))) return null;
    if (this.detectPlatformFor(baseUrl) !== 'YouTube') return item;

    const output = await run('yt-dlp', [...(await ytDlpInfoArgs({ allowPlaylist: false })), baseUrl]);
    const entry = JSON.parse(output);
    if (!entry || typeof entry !== 'object') return null;
    if (entry._type === 'error' || entry.is_unavailable) return null;

    const title = String(entry.title ?? '').trim();
    const url = String(entry.webpage_url ?? entry.original_url ?? entry.url ?? '').trim();
    if (!title || !url || !isUrl(url)) return null;
    if (INVALID_PLAYLIST_TITLE_PATTERNS.some((pattern) => pattern.test(title))) return null;
    if (entry.availability && String(entry.availability).toLowerCase() !== 'public') return null;
    if (entry.age_limit && Number(entry.age_limit) >= 18) return null;

    return {
      ...item,
      trackId: String(entry.id ?? item.trackId ?? url),
      name: title,
      url,
      duration: Number(entry.duration) || parseDuration(entry.duration_string) || item.duration || 0,
      thumbnail: bestThumbnail(entry, item.thumbnail),
      platform: item.platform ?? this.detectPlatformFor(url),
      isVideo,
    };
  }


  async directStreamUrl(track, isVideo = false) {
    const args = [
      ...(await ytDlpBaseArgs()),
      '-f', isVideo ? 'bv*+ba/best' : 'bestaudio/best',
      '-g',
      track?.url ?? this.input,
    ];
    const output = await run('yt-dlp', args);
    const lines = output.split('\n').map((line) => line.trim()).filter(Boolean);
    return lines.at(-1) ?? '';
  }

  async download(track, isVideo = false) {
    if (isPlatformTrackRequiringProvider(track)) {
      return downloadViaPlatformProvider(track, isVideo);
    }
    // Direct stream URLs from yt-dlp (-g) are often short-lived for video
    // and can fail in PyTgCalls/FFmpeg with NoVideoSourceFound.
    // Keep direct mode for audio only, and always download video to a local file.
    if (config.streamDirect && !isVideo) {
      const streamUrl = await this.directStreamUrl(track, false);
      if (streamUrl) return streamUrl;
    }

    /*if (isVideo && platform === 'YouTube') {
      try {
        return await downloadNexRayYtMp4(track ?? { url: this.input });
      } catch (error) {
        console.warn('NexRay YouTube video download failed, falling back to yt-dlp:', error.message);
      }
    }

    if (!isVideo && platform === 'YouTube') {
      try {
        return await downloadNexRayYtMp3(track ?? { url: this.input });
      } catch (error) {
        console.warn('NexRay YouTube download failed, trying Ndikz API:', error.message);
        try {
          return await downloadNdikzYtMp3(track ?? { url: this.input });
        } catch (fallbackError) {
          console.warn('Ndikz YouTube download failed, falling back to yt-dlp:', fallbackError.message);
        }
      }
    }*/

    const outputTemplate = path.join(config.downloadsDir, '%(id)s.%(ext)s');
    const args = [
      ...(await ytDlpBaseArgs()),
      '-o', outputTemplate,
      '--print', 'after_move:filepath',
    ];
    if (!isVideo) args.push('-x', '--audio-format', 'mp3');
    args.push(track?.url ?? this.input);
    const output = await run('yt-dlp', args);
    return output.trim().split('\n').at(-1);
  }

  detectPlatform() {
    return this.detectPlatformFor(this.input);
  }

  detectPlatformFor(value) {
    if (!isUrl(value)) return this.defaultService;
    const host = new URL(value).hostname;
    if (host.includes('spotify')) return 'Spotify';
    if (host.includes('apple')) return 'Apple Music';
    if (host.includes('soundcloud')) return 'SoundCloud';
    return 'YouTube';
  }

  #trackFromEntry(entry) {
    return {
      trackId: String(entry.id ?? entry.url ?? this.input),
      name: entry.title ?? this.input,
      url: entry.webpage_url ?? entry.original_url ?? entry.url ?? this.input,
      duration: Number(entry.duration) || parseDuration(entry.duration_string),
      thumbnail: entry.thumbnail ?? '',
      platform: this.detectPlatform(),
    };
  }
}
