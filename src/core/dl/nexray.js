import { createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { config } from '../../config/index.js';
import { parseDuration } from '../../utils/duration.js';

const SEARCH_ENDPOINT = 'https://api.nexray.eu.cc/search/youtube';
const YTMP3_ENDPOINT = 'https://api.nexray.eu.cc/downloader/v1/ytmp3';
const MAX_SEARCH_RESULTS = 50;

function safeText(value, fallback = '') {
  return String(value ?? fallback).trim();
}

function normalizeYouTubeUrl(urlOrId) {
  const value = safeText(urlOrId);
  if (!value) return '';
  if (/^[\w-]{11}$/.test(value)) return `https://youtube.com/watch?v=${value}`;

  try {
    const url = new URL(value);
    if (url.hostname.includes('youtu.be')) {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id ? `https://youtube.com/watch?v=${id}` : value;
    }
    const id = url.searchParams.get('v');
    return id ? `https://youtube.com/watch?v=${id}` : value;
  } catch {
    return value;
  }
}

function trackFromResult(item) {
  const id = safeText(item.id);
  const url = normalizeYouTubeUrl(item.url || id);
  if (!id && !url) return null;

  const title = safeText(item.title, url || id);
  const channel = safeText(item.channel);
  return {
    trackId: id || url,
    name: title,
    title,
    channel,
    channelUrl: safeText(item.channel_url),
    url,
    duration: Number(item.seconds) || parseDuration(item.duration),
    durationText: safeText(item.duration),
    views: safeText(item.views),
    uploadAt: safeText(item.upload_at),
    thumbnail: safeText(item.image_url),
    platform: 'YouTube',
    source: 'NexRay',
  };
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`NexRay API error: ${response.status} ${response.statusText}`);
  return response.json();
}

export async function searchNexRayYouTube(input, limit = MAX_SEARCH_RESULTS) {
  const url = new URL(SEARCH_ENDPOINT);
  url.searchParams.set('q', input);
  const payload = await fetchJson(url);
  if (payload.status === false) throw new Error(payload.message || 'NexRay search failed');

  const items = Array.isArray(payload.result) ? payload.result : [];
  return items
    .map(trackFromResult)
    .filter(Boolean)
    .slice(0, limit);
}

function isLikelyDownloadUrl(value) {
  if (typeof value !== 'string' || !/^https?:\/\//i.test(value)) return false;
  try {
    const url = new URL(value);
    if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) return false;
    if (/\.(?:mp3|m4a|aac|opus|ogg|wav)(?:$|[?#])/i.test(url.pathname)) return true;
    return /(download|audio|media|cdn|dl)/i.test(value);
  } catch {
    return false;
  }
}

function collectUrls(value, urls = []) {
  if (isLikelyDownloadUrl(value)) urls.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectUrls(item, urls));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => collectUrls(item, urls));
  return urls;
}

function firstKnownUrl(payload) {
  const candidates = [
    payload?.result?.download_url,
    payload?.result?.downloadUrl,
    payload?.result?.download,
    payload?.result?.audio,
    payload?.result?.url,
    payload?.download_url,
    payload?.downloadUrl,
    payload?.download,
    payload?.audio,
    payload?.url,
    ...collectUrls(payload),
  ].filter(isLikelyDownloadUrl);
  return candidates[0] ?? '';
}

function extensionFromContentType(contentType) {
  if (/mpeg|mp3/i.test(contentType)) return 'mp3';
  if (/mp4|m4a/i.test(contentType)) return 'm4a';
  if (/ogg|opus/i.test(contentType)) return 'opus';
  if (/wav/i.test(contentType)) return 'wav';
  return 'mp3';
}

function safeFileBase(track) {
  return String(track?.trackId || track?.id || Date.now()).replace(/[^\w.-]+/g, '_').slice(0, 80) || String(Date.now());
}

export async function downloadNexRayYtMp3(track) {
  const targetUrl = normalizeYouTubeUrl(track?.url || track?.trackId);
  if (!targetUrl) throw new Error('Missing YouTube URL for NexRay download');

  const apiUrl = new URL(YTMP3_ENDPOINT);
  apiUrl.searchParams.set('url', targetUrl);
  const payload = await fetchJson(apiUrl);
  if (payload.status === false) throw new Error(payload.message || 'NexRay download failed');

  const downloadUrl = firstKnownUrl(payload);
  if (!downloadUrl) throw new Error('NexRay response did not include an audio download URL');

  const response = await fetch(downloadUrl);
  if (!response.ok) throw new Error(`Audio download failed: ${response.status} ${response.statusText}`);

  const contentType = response.headers.get('content-type') ?? '';
  const filePath = path.join(config.downloadsDir, `${safeFileBase(track)}.${extensionFromContentType(contentType)}`);
  await fs.mkdir(config.downloadsDir, { recursive: true });
  if (!response.body) throw new Error('Audio download returned an empty response body');
  await pipeline(Readable.fromWeb(response.body), createWriteStream(filePath));
  return filePath;
}

export { normalizeYouTubeUrl };
