import { spawn } from 'node:child_process';
import path from 'node:path';
import { config } from '../../config/index.js';
import { isUrl } from '../../utils/telegram.js';
import { parseDuration } from '../../utils/duration.js';

const SUPPORTED_HOSTS = ['youtube.com', 'youtu.be', 'open.spotify.com', 'saavn', 'jiosaavn.com', 'music.apple.com', 'soundcloud.com'];

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
      else reject(new Error(stderr || `${command} exited with code ${code}`));
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
    const query = this.isUrl() ? this.input : `ytsearch10:${this.input}`;
    const output = await run('yt-dlp', ['--dump-single-json', '--no-playlist', query]);
    const parsed = JSON.parse(output);
    const entries = parsed.entries ?? [parsed];
    return {
      platform: this.detectPlatform(),
      results: entries.filter(Boolean).map((entry) => this.#trackFromEntry(entry)),
    };
  }

  async download(track, isVideo = false) {
    const outputTemplate = path.join(config.downloadsDir, '%(id)s.%(ext)s');
    const args = [
      '--no-playlist',
      '-o', outputTemplate,
      '--print', 'after_move:filepath',
    ];
    if (!isVideo) args.push('-x', '--audio-format', 'mp3');
    args.push(track.url);
    const output = await run('yt-dlp', args);
    return output.trim().split('\n').at(-1);
  }

  detectPlatform() {
    if (!this.isUrl()) return config.defaultService;
    const host = new URL(this.input).hostname;
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
