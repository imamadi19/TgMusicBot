/**
 * In-memory cache for lyrics.
 * TTL is configurable via config. Supports shorter TTL for not-found results.
 */

import { config } from '../../config/index.js';

const CACHE_TTL_MS = () => (config.lyricsCacheTtlHours ?? 24) * 60 * 60 * 1000;
const NOT_FOUND_TTL_MS = () => (config.lyricsNotFoundCacheTtlMinutes ?? 5) * 60 * 1000;
const ERROR_TTL_MS = 60 * 1000; // 1 minute for temporary errors

// Map to hold cache items: key -> cacheObject
const cache = new Map();

/**
 * Generates a stable unique cache key for a track.
 * Priority: trackId > normalized source URL > normalized title+artist+duration
 * @param {object} track
 * @returns {string}
 */
export function lyricsCacheKey(track) {
  if (!track) return '';

  let id = '';
  if (track.trackId) {
    id = String(track.trackId).trim();
  } else {
    const url = String(track.url || track.sourceUrl || '').trim();
    if (url) {
      try {
        const parsed = new URL(url);
        if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
          const videoId = parsed.searchParams.get('v') || parsed.pathname.replace('/', '');
          if (videoId) id = videoId;
        } else {
          id = parsed.href;
        }
      } catch {
        id = url;
      }
    }
  }

  const title = (track.title || track.name || '').trim().toLowerCase();
  const artist = (track.artist || '').trim().toLowerCase();
  let duration = '';
  if (track.duration) {
    if (typeof track.duration === 'number') {
      duration = String(Math.round(track.duration));
    } else {
      duration = String(track.duration).trim();
    }
  }

  // Concatenate id, title, artist, and duration for full specificity and backward compatibility
  return `key:${id}_${title}_${artist}_${duration}`;
}

// Keep backward-compatible alias
export const getCacheKey = lyricsCacheKey;

/**
 * Gets cached lyrics for a track.
 * @param {object} track
 * @returns {object|null} cache item or null if expired/not found
 */
export function getCachedLyrics(track) {
  const key = lyricsCacheKey(track);
  if (!key) return null;

  const item = cache.get(key);
  if (!item) return null;

  const now = Date.now();
  // Determine TTL based on status
  let ttl = CACHE_TTL_MS();
  if (item.status === 'notFound' || (item.synced === false && item.lines.length === 0 && !item.plainLyrics)) {
    ttl = NOT_FOUND_TTL_MS();
  } else if (item.status === 'error') {
    ttl = ERROR_TTL_MS;
  }

  if (now - item.fetchedAt > ttl) {
    cache.delete(key);
    return null;
  }

  return item;
}

/**
 * Sets cached lyrics for a track.
 * @param {object} track
 * @param {object} lyricsData
 */
export function setCachedLyrics(track, lyricsData) {
  const key = lyricsCacheKey(track);
  if (!key) return;

  let status = lyricsData.status;
  if (!status) {
    if (lyricsData.synced) {
      status = 'synced';
    } else if (lyricsData.plainLyrics && lyricsData.plainLyrics !== '[Instrumental]') {
      status = 'plainOnly';
    } else if (lyricsData.plainLyrics === '[Instrumental]') {
      status = 'plainOnly';
    } else {
      status = 'notFound';
    }
  }

  cache.set(key, {
    provider: lyricsData.provider || 'lrclib',
    synced: Boolean(lyricsData.synced),
    lines: lyricsData.lines || [],
    plainLyrics: lyricsData.plainLyrics || '',
    sourceId: String(lyricsData.sourceId || ''),
    fetchedAt: Date.now(),
    status,
    reason: lyricsData.reason || '',
    debug: lyricsData.debug || null
  });

  // Simple routine to clean up expired items to prevent memory leak
  cleanupExpired();
}

/**
 * Removes expired cache entries.
 */
function cleanupExpired() {
  const now = Date.now();
  for (const [key, item] of cache.entries()) {
    let ttl = CACHE_TTL_MS();
    if (item.status === 'notFound') {
      ttl = NOT_FOUND_TTL_MS();
    } else if (item.status === 'error') {
      ttl = ERROR_TTL_MS;
    }
    if (now - item.fetchedAt > ttl) {
      cache.delete(key);
    }
  }
}

/**
 * Clears lyrics cache for a specific track.
 * @param {object} track
 * @returns {boolean}
 */
export function clearLyricsCacheForTrack(track) {
  const key = lyricsCacheKey(track);
  if (!key) return false;
  return cache.delete(key);
}

/**
 * Gets cache info for a track (useful for status commands without side effects)
 * @param {object} track
 * @returns {object|null}
 */
export function getLyricsCacheInfo(track) {
  const key = lyricsCacheKey(track);
  if (!key) return null;

  const item = cache.get(key);
  if (!item) return null;

  const now = Date.now();
  let ttl = CACHE_TTL_MS();
  if (item.status === 'notFound' || (item.synced === false && item.lines.length === 0 && !item.plainLyrics)) {
    ttl = NOT_FOUND_TTL_MS();
  } else if (item.status === 'error') {
    ttl = ERROR_TTL_MS;
  }

  const isExpired = now - item.fetchedAt > ttl;
  return {
    key,
    item,
    isExpired,
    ttl,
    ageSeconds: Math.round((now - item.fetchedAt) / 1000)
  };
}

/**
 * Clears the lyrics cache.
 */
export function clearLyricsCache() {
  cache.clear();
}

/**
 * Legacy clearCache export for backward compatibility
 */
export function clearCache() {
  cache.clear();
}
