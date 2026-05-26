import { createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { config } from '../../config/index.js';
import { parseDuration } from '../../utils/duration.js';

const SEARCH_ENDPOINTS = Object.freeze({
  youtube: 'https://api.nexray.eu.cc/search/youtube',
  spotify: 'https://api.nexray.eu.cc/search/spotify',
  soundcloud: 'https://api.nexray.eu.cc/search/soundcloud',
  apple_music: 'https://api.nexray.eu.cc/search/applemusic',
});
const YTMP3_ENDPOINT = 'https://api.nexray.eu.cc/downloader/v1/ytmp3';
const YTMP4_ENDPOINT = 'https://api.nexray.eu.cc/downloader/v1/ytmp4';
const YTMP4_RESOLUTION = '360';
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
  const url = new URL(SEARCH_ENDPOINTS.youtube);
  url.searchParams.set('q', input);
  const payload = await fetchJson(url);
  if (payload.status === false) throw new Error(payload.message || 'search failed');

  const items = Array.isArray(payload.result) ? payload.result : [];
  return items
    .map(trackFromResult)
    .filter(Boolean)
    .slice(0, limit);
}

function normalizeDurationSeconds(item) {
  const raw = Number(item.duration ?? item.duration_seconds ?? item.seconds ?? item.durationSec ?? 0);
  if (Number.isFinite(raw) && raw > 0) return raw > 5000 ? Math.round(raw / 1000) : Math.round(raw);
  const rawMs = Number(item.durationMs ?? item.duration_ms ?? 0);
  if (Number.isFinite(rawMs) && rawMs > 0) return Math.round(rawMs / 1000);
  return parseDuration(item.durationText ?? item.duration_text ?? item.length ?? item.duration_string);
}

function normalizeSearchTrack(item, platform) {
  const name = safeText(item.title || item.name || item.songName);
  const url = safeText(item.url || item.link || item.permalink);
  if (!name || !url) return null;
  const thumbnail = safeText(item.thumbnail || item.image || item.cover || item.artwork || item.image_url);
  const artist = safeText(item.artist || item.author || item.channel);
  const channel = safeText(item.channel || item.author || item.artist);
  return {
    trackId: safeText(item.trackId || item.id || url, url),
    name,
    title: name,
    url,
    duration: normalizeDurationSeconds(item),
    thumbnail: /^https?:\/\//i.test(thumbnail) ? thumbnail : '',
    platform,
    artist,
    channel,
    views: safeText(item.views),
    uploadAt: safeText(item.uploadAt || item.upload_at),
  };
}

export async function searchNexRayByService(service, input, limit = MAX_SEARCH_RESULTS) {
  const endpoint = SEARCH_ENDPOINTS[String(service ?? '').toLowerCase().replace(/\s+/g, '_')];
  if (!endpoint) throw new Error('unsupported service');
  const url = new URL(endpoint);
  url.searchParams.set('q', input);
  const payload = await fetchJson(url);
  if (payload.status === false) throw new Error(payload.message || 'search failed');
  const results = Array.isArray(payload.result) ? payload.result : (Array.isArray(payload.results) ? payload.results : []);
  const platformMap = { spotify: 'Spotify', soundcloud: 'SoundCloud', apple_music: 'Apple Music' };
  if (service === 'spotify') return results.map((item) => normalizeSpotifyTrack(item)).filter(Boolean).slice(0, limit);
  return results.map((item) => normalizeSearchTrack(item, platformMap[service] || 'YouTube')).filter(Boolean).slice(0, limit);
}



export function isSpotifyUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value.trim());
    return url.hostname.toLowerCase() == 'open.spotify.com';
  } catch {
    return false;
  }
}

export function parseSpotifyUrl(value) {
  if (!isSpotifyUrl(value)) return null;
  const url = new URL(value);
  const parts = url.pathname.split('/').filter(Boolean);
  const offset = parts[0]?.startsWith('intl-') ? 1 : 0;
  const entityType = parts[offset] || '';
  const spotifyId = parts[offset + 1] || '';
  const canonicalUrl = spotifyId && entityType ? `https://open.spotify.com/${entityType}/${spotifyId}` : value;
  return { entityType, spotifyId, isTrack: entityType === 'track' && Boolean(spotifyId), canonicalUrl, originalUrl: value };
}

function normalizeSpotifyArtists(item) {
  const arr = Array.isArray(item.artists) ? item.artists : [];
  const names = arr.map((a) => safeText(a?.name || a)).filter(Boolean);
  if (names.length) return names;
  const one = safeText(item.artist || item.author);
  return one ? [one] : [];
}

export function normalizeSpotifyTrack(item, sourceUrl = '') {
  if (!item || typeof item !== 'object') return null;
  const name = safeText(item.title || item.name || item.songName || item.trackName);
  if (!name) return null;
  const spotifyUrl = safeText(sourceUrl || item.url || item.link);
  const parsed = parseSpotifyUrl(spotifyUrl);
  const spotifyId = safeText(item.spotifyId || item.id || parsed?.spotifyId || '');
  const artists = normalizeSpotifyArtists(item);
  return {
    trackId: spotifyId ? `spotify:${spotifyId.replace(/^spotify:/, '')}` : `spotify:${name}`,
    spotifyId,
    name,
    title: name,
    artist: artists[0] || '',
    artists,
    album: safeText(item.album || item.albumName),
    releaseDate: safeText(item.releaseDate || item.release_date || item.year),
    duration: normalizeDurationSeconds(item),
    explicit: typeof item.explicit === 'boolean' ? item.explicit : null,
    popularity: Number.isFinite(Number(item.popularity)) ? Number(item.popularity) : null,
    thumbnail: normalizeArtwork(item),
    sourceUrl: spotifyUrl,
    displayUrl: spotifyUrl,
    playbackUrl: '',
    platform: 'Spotify',
    playbackPlatform: '',
    sourceType: 'spotify',
    url: spotifyUrl,
  };
}

export function isSpotifyTrack(track) {
  return Boolean(track) && (track.platform === 'Spotify' || track.sourceType === 'spotify');
}

async function fetchSpotifyOEmbed(urlValue) {
  const url = new URL('https://open.spotify.com/oembed');
  url.searchParams.set('url', urlValue);
  return fetchJson(url);
}

export async function resolveSpotifyTrackMetadata(value) {
  const parsed = parseSpotifyUrl(value);
  if (!parsed) throw new Error('Not a Spotify URL');
  if (!parsed.isTrack) return { trackLinkRequired: true, tracks: [], parsed };

  const tryQueries = [value, parsed.canonicalUrl, parsed.spotifyId].filter(Boolean);
  for (const query of tryQueries) {
    try {
      const list = await searchNexRayByService('spotify', query, 10);
      const normalized = list.map((it) => normalizeSpotifyTrack(it, parsed.canonicalUrl)).filter(Boolean);
      if (normalized.length) return { tracks: [normalized[0]], parsed };
    } catch {}
  }

  const oembed = await fetchSpotifyOEmbed(parsed.canonicalUrl);
  const title = safeText(oembed?.title);
  const thumb = safeText(oembed?.thumbnail_url);
  const baseTrack = normalizeSpotifyTrack({ id: parsed.spotifyId, title, artist: title.split(' - ').slice(1).join(' - '), thumbnail: thumb, url: parsed.canonicalUrl }, parsed.canonicalUrl);

  if (title) {
    try {
      const list = await searchNexRayByService('spotify', title, 10);
      const normalized = list.map((it) => normalizeSpotifyTrack(it, parsed.canonicalUrl)).filter(Boolean);
      if (normalized.length) return { tracks: [normalized[0]], parsed };
    } catch {}
  }
  return { tracks: baseTrack ? [baseTrack] : [], parsed };
}

export async function resolveSpotifyPlaybackTrack(track, searchFn = searchNexRayYouTube) {
  if (!isSpotifyTrack(track) || track.playbackUrl) return track;
  const query = `${track.title || track.name} ${track.artist || ''} official audio`.trim();
  const results = await searchFn(query, 8);
  const badWords = /(remix|karaoke|slowed|reverb|cover|live|instrumental)/i;
  const needleTitle = String(track.title || track.name || '').toLowerCase();
  const needleArtist = String(track.artist || '').toLowerCase();
  const best = results.filter((r)=>r?.url).sort((a,b)=>{
    const score=(x)=>{const t=String(x.title||x.name||'').toLowerCase();let s=0;if(t.includes(needleTitle))s+=3;if(needleArtist&&t.includes(needleArtist))s+=2;if(badWords.test(t))s-=3;return s;};
    return score(b)-score(a);
  })[0];
  if (!best) throw new Error('SPOTIFY_PLAYBACK_NOT_FOUND');
  track.playbackUrl = best.url;
  track.playbackPlatform = 'YouTube';
  return track;
}
export function isAppleMusicUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value.trim());
    return url.hostname.toLowerCase().includes('music.apple.com');
  } catch {
    return false;
  }
}

export function parseAppleMusicUrl(value) {
  if (!isAppleMusicUrl(value)) return null;
  const url = new URL(value);
  const parts = url.pathname.split('/').filter(Boolean);
  const storefront = parts[0] || '';
  const kind = parts[1] || '';
  const songId = url.searchParams.get('i') || '';
  const albumId = parts.at(-1) || '';
  return { storefront, kind, songId, albumId, isTrackLink: Boolean(songId), originalUrl: value };
}

function normalizeArtwork(item) {
  const raw = safeText(item.artwork?.url || item.artworkUrl100 || item.artwork || item.thumbnail || item.image || item.cover);
  if (!raw) return '';
  const replaced = raw.replace('{w}', '1200').replace('{h}', '1200');
  return /^https?:\/\//i.test(replaced) ? replaced : '';
}

export function normalizeAppleMusicTrack(item, sourceUrl = '') {
  if (!item || typeof item !== 'object') return null;
  const name = safeText(item.title || item.name || item.trackName || item.songName);
  const artist = safeText(item.artist || item.artistName || item.author);
  if (!name || !artist) return null;
  const trackIdRaw = safeText(item.id || item.trackId || item.songId);
  const trackId = trackIdRaw ? `apple:${trackIdRaw.replace(/^apple:/, '')}` : `apple:${name}:${artist}`;
  const source = safeText(sourceUrl || item.url || item.link);
  const duration = normalizeDurationSeconds(item);
  return {
    trackId,
    name,
    title: name,
    artist,
    album: safeText(item.album || item.collectionName),
    releaseDate: safeText(item.releaseDate || item.release_date || item.year),
    genre: safeText(item.genre || item.primaryGenreName),
    duration,
    thumbnail: normalizeArtwork(item),
    sourceUrl: source,
    displayUrl: source,
    playbackUrl: '',
    platform: 'Apple Music',
    playbackPlatform: '',
    sourceType: 'apple_music',
    url: source,
  };
}

export async function resolveAppleMusicUrlMetadata(value) {
  const parsed = parseAppleMusicUrl(value);
  if (!parsed) throw new Error('Not an Apple Music URL');
  if (!parsed.isTrackLink) return { trackRequired: true, tracks: [] };
  const query = parsed.songId;
  const url = new URL(SEARCH_ENDPOINTS.apple_music);
  url.searchParams.set('q', query);
  const payload = await fetchJson(url);
  const results = Array.isArray(payload.result) ? payload.result : (Array.isArray(payload.results) ? payload.results : []);
  const tracks = results.map((item) => normalizeAppleMusicTrack(item, value)).filter(Boolean);
  return { tracks, parsed };
}

export async function resolveAppleMusicPlayback(track, searchFn = searchNexRayYouTube) {
  if (!track || (track.platform !== 'Apple Music' && track.sourceType !== 'apple_music')) return track;
  if (track.playbackUrl) return track;
  const query = `${track.title || track.name} ${track.artist || ''} official audio`.trim();
  const results = await searchFn(query, 8);
  const badWords = /(remix|karaoke|slowed|reverb|cover|live|instrumental)/i;
  const titleNeedle = String(track.title || track.name || '').toLowerCase();
  const artistNeedle = String(track.artist || '').toLowerCase();
  const ranked = results.filter((r) => r?.url).sort((a, b) => {
    const score = (x) => {
      const t = String(x.title || x.name || '').toLowerCase();
      let s = 0;
      if (titleNeedle && t.includes(titleNeedle)) s += 3;
      if (artistNeedle && t.includes(artistNeedle)) s += 2;
      if (badWords.test(t)) s -= 3;
      return s;
    };
    return score(b) - score(a);
  });
  const best = ranked[0];
  if (!best) throw new Error('APPLE_MUSIC_PLAYBACK_NOT_FOUND');
  track.playbackUrl = best.url;
  track.playbackPlatform = 'YouTube';
  return track;
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
