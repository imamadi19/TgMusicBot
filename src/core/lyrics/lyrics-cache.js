/**
 * Persistent and In-Memory Cache for Lyrics.
 * If MongoDB is connected, it uses MongoDB. Else, falls back to in-memory cache.
 * TTL is determined dynamically based on the lyrics status.
 */

import { config } from '../../config/index.js';
import { isDatabaseConnected, db } from '../db/mongo.js';

// In-memory cache fallback map
const memoryCache = new Map();

function getTtlMs(status, synced, linesCount, plainLyrics) {
  if (status === 'synced') {
    return (config.lyricsCacheSyncedDays ?? 30) * 24 * 60 * 60 * 1000;
  }
  if (status === 'plainOnly') {
    return (config.lyricsCachePlainDays ?? 7) * 24 * 60 * 60 * 1000;
  }
  if (status === 'notFound') {
    return (config.lyricsNotFoundCacheTtlMinutes ?? 15) * 60 * 1000;
  }
  if (status === 'error' || status === 'rateLimited' || status === 'timeout') {
    return (config.lyricsErrorCacheTtlMinutes ?? 1) * 60 * 1000;
  }
  if (status === 'lowConfidence') {
    return 1 * 24 * 60 * 60 * 1000; // 1 day
  }
  
  // Dynamic fallback
  if (synced && linesCount > 0) {
    return (config.lyricsCacheSyncedDays ?? 30) * 24 * 60 * 60 * 1000;
  }
  if (plainLyrics) {
    return (config.lyricsCachePlainDays ?? 7) * 24 * 60 * 60 * 1000;
  }
  return (config.lyricsNotFoundCacheTtlMinutes ?? 15) * 60 * 1000;
}

function getCollection() {
  if (isDatabaseConnected()) {
    try {
      const col = db().collection('lyrics_cache');
      // Create indexes in the background
      col.createIndex({ key: 1 }, { unique: true }).catch(() => {});
      col.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 }).catch(() => {});
      return col;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Generates a stable unique cache key for a track.
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

  return `key:${id}_${title}_${artist}_${duration}`;
}

export const getCacheKey = lyricsCacheKey;

/**
 * Gets cached lyrics for a track.
 */
export async function getCachedLyrics(track) {
  const key = lyricsCacheKey(track);
  if (!key) return null;

  const now = Date.now();
  const col = getCollection();

  if (col) {
    try {
      const doc = await col.findOne({ key });
      if (doc) {
        if (doc.expireAt && now > doc.expireAt) {
          await col.deleteOne({ key });
          return null;
        }
        return doc.value;
      }
    } catch (e) {
      if (config.lyricsDebug) {
        console.error('[lyrics-cache] MongoDB get error, falling back to memory:', e.message);
      }
    }
  }

  // Memory fallback
  const item = memoryCache.get(key);
  if (!item) return null;

  const ttl = getTtlMs(item.status, item.synced, item.lines?.length || 0, item.plainLyrics);
  if (now - item.fetchedAt > ttl) {
    memoryCache.delete(key);
    return null;
  }

  return item;
}

/**
 * Sets cached lyrics for a track.
 */
export async function setCachedLyrics(track, lyricsData) {
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

  const now = Date.now();
  const linesCount = lyricsData.lines?.length || 0;
  const ttl = getTtlMs(status, Boolean(lyricsData.synced), linesCount, lyricsData.plainLyrics);

  const value = {
    provider: lyricsData.provider || 'unknown',
    synced: Boolean(lyricsData.synced),
    lines: lyricsData.lines || [],
    plainLyrics: lyricsData.plainLyrics || '',
    sourceId: String(lyricsData.sourceId || ''),
    fetchedAt: now,
    status,
    reason: lyricsData.reason || '',
    debug: lyricsData.debug || null
  };

  const col = getCollection();
  if (col) {
    try {
      const expireAt = new Date(now + ttl);
      await col.updateOne(
        { key },
        { $set: { key, value, expireAt } },
        { upsert: true }
      );
      // Also update memory cache to keep in sync
      memoryCache.set(key, value);
      return;
    } catch (e) {
      if (config.lyricsDebug) {
        console.error('[lyrics-cache] MongoDB set error:', e.message);
      }
    }
  }

  // Memory fallback
  memoryCache.set(key, value);

  // Clean up memory cache
  cleanupExpiredMemory();
}

/**
 * Removes expired cache entries from memory.
 */
function cleanupExpiredMemory() {
  const now = Date.now();
  for (const [key, item] of memoryCache.entries()) {
    const ttl = getTtlMs(item.status, item.synced, item.lines?.length || 0, item.plainLyrics);
    if (now - item.fetchedAt > ttl) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Clears lyrics cache for a specific track.
 */
export async function clearLyricsCacheForTrack(track) {
  const key = lyricsCacheKey(track);
  if (!key) return false;

  memoryCache.delete(key);

  const col = getCollection();
  if (col) {
    try {
      const res = await col.deleteOne({ key });
      return res.deletedCount > 0;
    } catch (e) {
      if (config.lyricsDebug) {
        console.error('[lyrics-cache] MongoDB delete error:', e.message);
      }
    }
  }

  return true;
}

/**
 * Gets cache info for a track.
 */
export async function getLyricsCacheInfo(track) {
  const key = lyricsCacheKey(track);
  if (!key) return null;

  const now = Date.now();
  let item = null;

  const col = getCollection();
  if (col) {
    try {
      const doc = await col.findOne({ key });
      if (doc) {
        item = doc.value;
      }
    } catch (e) {
      if (config.lyricsDebug) {
        console.error('[lyrics-cache] MongoDB info error:', e.message);
      }
    }
  }

  if (!item) {
    item = memoryCache.get(key);
  }

  if (!item) return null;

  const ttl = getTtlMs(item.status, item.synced, item.lines?.length || 0, item.plainLyrics);
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
 * Clears the entire lyrics cache.
 */
export async function clearLyricsCache() {
  memoryCache.clear();
  const col = getCollection();
  if (col) {
    try {
      await col.deleteMany({});
    } catch (e) {
      if (config.lyricsDebug) {
        console.error('[lyrics-cache] MongoDB clear error:', e.message);
      }
    }
  }
}

/**
 * Legacy clearCache export for backward compatibility.
 */
export async function clearCache() {
  await clearLyricsCache();
}
