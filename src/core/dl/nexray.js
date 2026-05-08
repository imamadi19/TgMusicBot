import { createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { config } from '../../config/index.js';
import { parseDuration } from '../../utils/duration.js';

const SEARCH_ENDPOINT = 'https://api.nexray.eu.cc/search/youtube';
const YTMP3_ENDPOINT = 'https://api.nexray.eu.cc/downloader/v1/ytmp3';
const YTMP4_ENDPOINT = 'https://api.nexray.eu.cc/downloader/v1/ytmp4';
const YTMP4_RESOLUTION = '1080';
const NDIKZ_YTMP3_ENDPOINT = 'https://ndikz-api.vercel.app/download/ytmp3';
const MAX_SEARCH_RESULTS = 50;

function timeoutSignal(timeoutMs) {
  const value = Number(timeoutMs);
  return Number.isFinite(value) && value > 0 ? AbortSignal.timeout(value) : undefined;
}

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
  };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { accept: 'application/json' },
    signal: timeoutSignal(config.requestTimeoutMs),
  });
  if (!response.ok) throw new Error(`API error: ${response.status} ${response.statusText}`);
  return response.json();
}

export async function searchNexRayYouTube(input, limit = MAX_SEARCH_RESULTS) {
  const url = new URL(SEARCH_ENDPOINT);
  url.searchParams.set('q', input);
  const payload = await fetchJson(url);
  if (payload.status === false) throw new Error(payload.message || 'search failed');

  const items = Array.isArray(payload.result) ? payload.result : [];
  return items
    .map(trackFromResult)
    .filter(Boolean)
    .slice(0, limit);
}

function isYouTubeUrl(url) {
  return url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be');
}

function isLikelyAudioDownloadUrl(value) {
  if (typeof value !== 'string' || !/^https?:\/\//i.test(value)) return false;
  try {
    const url = new URL(value);
    if (isYouTubeUrl(url)) return false;
    if (/\.(?:mp3|m4a|aac|opus|ogg|wav)(?:$|[?#])/i.test(url.pathname)) return true;
    return /(download|audio|media|cdn|dl)/i.test(value);
  } catch {
    return false;
  }
}

function isLikelyVideoDownloadUrl(value) {
  if (typeof value !== 'string' || !/^https?:\/\//i.test(value)) return false;
  try {
    const url = new URL(value);
    if (isYouTubeUrl(url)) return false;
    if (/\.(?:mp4|m4v|webm|mkv|mov)(?:$|[?#])/i.test(url.pathname)) return true;
    return /(download|video|media|cdn|dl)/i.test(value);
  } catch {
    return false;
  }
}

function collectUrls(value, predicate, urls = []) {
  if (predicate(value)) urls.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectUrls(item, predicate, urls));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => collectUrls(item, predicate, urls));
  return urls;
}

export function extractAudioDownloadUrl(payload) {
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
    ...collectUrls(payload, isLikelyAudioDownloadUrl),
  ].filter(isLikelyAudioDownloadUrl);
  return candidates[0] ?? '';
}

export function extractVideoDownloadUrl(payload) {
  const candidates = [
    payload?.result?.download_url,
    payload?.result?.downloadUrl,
    payload?.result?.download,
    payload?.result?.video,
    payload?.result?.mp4,
    payload?.result?.url,
    payload?.download_url,
    payload?.downloadUrl,
    payload?.download,
    payload?.video,
    payload?.mp4,
    payload?.url,
    ...collectUrls(payload, isLikelyVideoDownloadUrl),
  ].filter(isLikelyVideoDownloadUrl);
  return candidates[0] ?? '';
}

function audioExtensionFromContentType(contentType) {
  if (/mpeg|mp3/i.test(contentType)) return 'mp3';
  if (/mp4|m4a/i.test(contentType)) return 'm4a';
  if (/ogg|opus/i.test(contentType)) return 'opus';
  if (/wav/i.test(contentType)) return 'wav';
  return 'mp3';
}

function videoExtensionFromContentType(contentType) {
  if (/webm/i.test(contentType)) return 'webm';
  if (/matroska|mkv/i.test(contentType)) return 'mkv';
  if (/quicktime|mov/i.test(contentType)) return 'mov';
  return 'mp4';
}

function safeFileBase(track) {
  return String(track?.trackId || track?.id || Date.now()).replace(/[^\w.-]+/g, '_').slice(0, 80) || String(Date.now());
}

async function downloadYtMediaFromApi(track, endpoint, label, { resolution, extractDownloadUrl, extensionFromContentType }) {
  const targetUrl = normalizeYouTubeUrl(track?.url || track?.trackId);
  if (!targetUrl) throw new Error('Missing YouTube URL for download');

  const apiUrl = new URL(endpoint);
  apiUrl.searchParams.set('url', targetUrl);
  if (resolution) apiUrl.searchParams.set('resolusi', resolution);
  const payload = await fetchJson(apiUrl);
  if (payload.status === false) throw new Error(payload.message || `${label} download failed`);

  const downloadUrl = extractDownloadUrl(payload);
  if (!downloadUrl) throw new Error(`${label} response did not include a media download URL`);

  const response = await fetch(downloadUrl, { signal: timeoutSignal(config.downloadTimeoutMs) });
  if (!response.ok) throw new Error(`Media download failed: ${response.status} ${response.statusText}`);

  const contentType = response.headers.get('content-type') ?? '';
  const filePath = path.join(config.downloadsDir, `${safeFileBase(track)}.${extensionFromContentType(contentType)}`);
  await fs.mkdir(config.downloadsDir, { recursive: true });
  if (!response.body) throw new Error('Media download returned an empty response body');
  await pipeline(Readable.fromWeb(response.body), createWriteStream(filePath));
  return filePath;
}

export async function downloadNexRayYtMp3(track) {
  return downloadYtMediaFromApi(track, YTMP3_ENDPOINT, 'NexRay API', {
    extractDownloadUrl: extractAudioDownloadUrl,
    extensionFromContentType: audioExtensionFromContentType,
  });
}

export async function downloadNexRayYtMp4(track, resolution = YTMP4_RESOLUTION) {
  return downloadYtMediaFromApi(track, YTMP4_ENDPOINT, 'NexRay API', {
    resolution,
    extractDownloadUrl: extractVideoDownloadUrl,
    extensionFromContentType: videoExtensionFromContentType,
  });
}

export async function downloadNdikzYtMp3(track) {
  return downloadYtMediaFromApi(track, NDIKZ_YTMP3_ENDPOINT, 'Ndikz API', {
    extractDownloadUrl: extractAudioDownloadUrl,
    extensionFromContentType: audioExtensionFromContentType,
  });
}

export { normalizeYouTubeUrl };
