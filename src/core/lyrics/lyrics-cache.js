/**
 * In-memory cache for lyrics.
 * TTL is configurable via config. Supports shorter TTL for not-found results.
 */

import { config } from '../../config/index.js';

const CACHE_TTL_MS = () => (config.lyricsCacheTtlHours ?? 24) * 60 * 60 * 1000;
const NOT_FOUND_TTL_MS = 60 * 60 * 1000; // 1 hour for empty/not-found results

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

  // 1. Use trackId if available (most stable)
  if (track.trackId) {
    return `tid:${String(track.trackId).trim()}`;
  }

  // 2. Use normalized source URL
  const url = String(track.url || track.sourceUrl || '').trim();
  if (url) {
    try {
      const parsed = new URL(url);
      // Remove tracking params for YouTube
      if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
        const videoId = parsed.searchParams.get('v') || parsed.pathname.replace('/', '');
        if (videoId) return `tid:${videoId}`;
      }
      return `url:${parsed.href}`;
    } catch {
      return `url:${url}`;
    }
  }

  // 3. Fallback to title + artist + duration
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
  return `meta:${title}|${artist}|${duration}`;
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
  // Use shorter TTL for not-found/empty results
  const ttl = (item.synced === false && item.lines.length === 0 && !item.plainLyrics)
    ? NOT_FOUND_TTL_MS
    : CACHE_TTL_MS();

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

  cache.set(key, {
    provider: lyricsData.provider || 'lrclib',
    synced: Boolean(lyricsData.synced),
    lines: lyricsData.lines || [],
    plainLyrics: lyricsData.plainLyrics || '',
    sourceId: String(lyricsData.sourceId || ''),
    fetchedAt: Date.now()
  });

  // Simple routine to clean up expired items to prevent memory leak
  cleanupExpired();
}

/**
 * Removes expired cache entries.
 */
function cleanupExpired() {
  const now = Date.now();
  const maxTtl = CACHE_TTL_MS();
  for (const [key, item] of cache.entries()) {
    if (now - item.fetchedAt > maxTtl) {
      cache.delete(key);
    }
  }
}

/**
 * Clears the lyrics cache.
 */
export function clearCache() {
  cache.clear();
}
