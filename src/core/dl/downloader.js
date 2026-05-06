import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../../config/index.js';
import { isUrl } from '../../utils/telegram.js';
import { parseDuration } from '../../utils/duration.js';
import { downloadNexRayYtMp3, searchNexRayYouTube } from './nexray.js';

const SUPPORTED_HOSTS = ['youtube.com', 'youtu.be', 'open.spotify.com', 'saavn', 'jiosaavn.com', 'music.apple.com', 'soundcloud.com'];
const MAX_ERROR_LENGTH = 700;

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
  const response = await fetch(cookieUrl);
  if (!response.ok) throw new Error(`Failed to fetch cookies: ${response.status} ${response.statusText}`);
  await fs.writeFile(cookieFile, await response.text(), { mode: 0o600 });
  return ['--cookies', cookieFile];
}

async function ytDlpBaseArgs() {
  return ['--no-playlist', '--js-runtimes', 'node', ...(await cookieArgs())];
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(shortenError(stderr || `${command} exited with code ${code}`)));
    });
  });
}

export class Downloader {
  constructor(input) {
    this.input = input;
  }

  isUrl() {
    return isUrl(this.input);
  }

  isValid() {
    if (!this.isUrl()) return true;
    const host = new URL(this.input).hostname.replace(/^www\./, '');
    return SUPPORTED_HOSTS.some((supported) => host.includes(supported));
  }

  async getInfo() {
    if (!this.isUrl() && config.defaultService.toLowerCase().includes('youtube')) {
      try {
        const results = await searchNexRayYouTube(this.input);
        if (results.length > 0) return { platform: 'YouTube', results, selectionRequired: true };
      } catch (error) {
        console.warn('API YouTube search failed, falling back to yt-dlp:', error.message);
      }
    }

    const query = this.isUrl() ? this.input : `ytsearch10:${this.input}`;
    const output = await run('yt-dlp', ['--dump-single-json', ...(await ytDlpBaseArgs()), query]);
    const parsed = JSON.parse(output);
    const entries = parsed.entries ?? [parsed];
    return {
      platform: this.detectPlatform(),
      results: entries.filter(Boolean).map((entry) => this.#trackFromEntry(entry)),
    };
  }

  async download(track, isVideo = false) {
    if (!isVideo && this.detectPlatformFor(track?.url ?? this.input) === 'YouTube') {
      try {
        return await downloadNexRayYtMp3(track ?? { url: this.input });
      } catch (error) {
        console.warn('API YouTube download failed, falling back to yt-dlp:', error.message);
      }
    }

    const outputTemplate = path.join(config.downloadsDir, '%(id)s.%(ext)s');
    const args = [
      ...(await ytDlpBaseArgs()),
      '-o', outputTemplate,
      '--print', 'after_move:filepath',
    ];
    if (!isVideo) args.push('-x', '--audio-format', 'mp3');
    args.push(track.url);
    const output = await run('yt-dlp', args);
    return output.trim().split('\n').at(-1);
  }

  detectPlatform() {
    return this.detectPlatformFor(this.input);
  }

  detectPlatformFor(value) {
    if (!isUrl(value)) return config.defaultService;
    const host = new URL(value).hostname;
    if (host.includes('spotify')) return 'Spotify';
    if (host.includes('saavn')) return 'JioSaavn';
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
