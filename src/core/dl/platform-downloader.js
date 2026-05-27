import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../../config/index.js';

const PLATFORM_KEYS = Object.freeze({
  spotify: 'spotify',
  apple_music: 'apple_music',
});

function normalizePlatform(track) {
  const sourceType = String(track?.sourceType ?? '').toLowerCase();
  if (sourceType === PLATFORM_KEYS.spotify) return PLATFORM_KEYS.spotify;
  if (sourceType === PLATFORM_KEYS.apple_music) return PLATFORM_KEYS.apple_music;

  const platform = String(track?.platform ?? '').toLowerCase();
  if (platform === 'spotify') return PLATFORM_KEYS.spotify;
  if (platform === 'apple music') return PLATFORM_KEYS.apple_music;
  return '';
}

function providerConfigFor(platformKey) {
  const key = platformKey === PLATFORM_KEYS.spotify ? 'spotify' : (platformKey === PLATFORM_KEYS.apple_music ? 'appleMusic' : '');
  if (!key) return null;

  const providers = config.platformDownloadProviders ?? {};
  const provider = providers[key] ?? {};
  const enabled = Boolean(provider.enabled) && String(provider.url ?? '').trim().length > 0;
  return { key, enabled, url: String(provider.url ?? '').trim(), token: String(provider.token ?? '').trim() };
}

async function requestProviderDownload(platformKey, track, isVideo) {
  const provider = providerConfigFor(platformKey);
  if (!provider?.enabled) throw new Error(`PLATFORM_DOWNLOADER_NOT_CONFIGURED:${platformKey}`);

  const response = await fetch(provider.url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(provider.token ? { authorization: `Bearer ${provider.token}` } : {}),
    },
    body: JSON.stringify({
      platform: platformKey,
      isVideo: Boolean(isVideo),
      track,
    }),
  });
  if (!response.ok) throw new Error(`PLATFORM_DOWNLOADER_REQUEST_FAILED:${platformKey}:${response.status}`);

  const payload = await response.json();
  const filePath = String(payload?.filePath ?? payload?.path ?? '').trim();
  if (!filePath) throw new Error(`PLATFORM_DOWNLOADER_INVALID_RESPONSE:${platformKey}`);

  const resolved = path.resolve(filePath);
  await fs.access(resolved);
  return resolved;
}

export function isPlatformTrackRequiringProvider(track) {
  return Boolean(normalizePlatform(track));
}

export function platformDownloaderErrorCode(error) {
  const message = String(error?.message ?? '');
  if (message.startsWith('PLATFORM_DOWNLOADER_NOT_CONFIGURED:spotify')) return 'spotify';
  if (message.startsWith('PLATFORM_DOWNLOADER_NOT_CONFIGURED:apple_music')) return 'apple_music';
  return '';
}

export async function downloadViaPlatformProvider(track, isVideo = false) {
  const platformKey = normalizePlatform(track);
  if (!platformKey) return '';
  return requestProviderDownload(platformKey, track, isVideo);
}
