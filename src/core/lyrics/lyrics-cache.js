/**
 * In-memory cache for lyrics.
 * TTL is 24 hours by default, configurable via env.
 */

const TTL_HOURS = parseInt(process.env.LYRICS_CACHE_TTL_HOURS || '24', 10);
const CACHE_TTL_MS = TTL_HOURS * 60 * 60 * 1000;

// Map to hold cache items: key -> cacheObject
const cache = new Map();

/**
 * Generates a unique cache key for a track.
 * Uses trackId/url first, then falls back to title + artist + duration.
 * @param {object} track
 * @returns {string}
 */
export function getCacheKey(track) {
  if (!track) return '';
  const id = track.trackId || track.url || '';
  const title = (track.title || track.name || '').trim().toLowerCase();
  const artist = (track.artist || '').trim().toLowerCase();
  // Duration can be a string or number, normalize to integer seconds if possible
  let duration = '';
  if (track.duration) {
    if (typeof track.duration === 'number') {
      duration = Math.round(track.duration);
    } else {
      // duration can be "mm:ss" or seconds as string
      duration = String(track.duration).trim();
    }
  }
  return `${id}_${title}_${artist}_${duration}`;
}

/**
 * Gets cached lyrics for a track.
 * @param {object} track
 * @returns {object|null} cache item or null if expired/not found
 */
export function getCachedLyrics(track) {
  const key = getCacheKey(track);
  if (!key) return null;

  const item = cache.get(key);
  if (!item) return null;

  const now = Date.now();
  if (now - item.fetchedAt > CACHE_TTL_MS) {
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
  const key = getCacheKey(track);
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
  for (const [key, item] of cache.entries()) {
    if (now - item.fetchedAt > CACHE_TTL_MS) {
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
