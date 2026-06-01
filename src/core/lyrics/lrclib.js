/**
 * LRCLIB API service to fetch lyrics.
 * Features: configurable timeout, in-flight request deduplication,
 * scored search result matching, prefetch support.
 */

import { config } from '../../config/index.js';
import { parseLrc } from './lrc-parser.js';
import { getCachedLyrics, setCachedLyrics, lyricsCacheKey } from './lyrics-cache.js';

const LRCLIB_BASE = 'https://lrclib.net';
const USER_AGENT = 'TgMusicBot/1.0.0 (https://github.com/imamadi19/TgMusicBot)';

/** In-flight request deduplication map: cacheKey -> Promise */
const inFlightRequests = new Map();

function debugLog(...args) {
  if (config.lyricsDebug) console.log('[lyrics]', ...args);
}

/**
 * Normalizes track title to improve lyrics search matching on LRCLIB.
 * @param {string} title
 * @returns {string}
 */
export function normalizeTitle(title) {
  if (!title) return '';
  let normalized = title;
  
  // Remove text in parentheses/brackets representing video types or extra details
  normalized = normalized.replace(/[\(\[](official\s+video|official\s+music\s+video|official|music\s+video|lyric\s+video|lyrics|audio|hd|visualizer|lirik|official\s+audio|remix|cover)[\)\]]/gi, '');
  
  // Remove common trailing tags
  normalized = normalized.replace(/\s*(video|lyrics|lyric|audio|hd|official|visualizer|mv|lirik)\s*$/gi, '');
  
  // Remove double spaces and trim
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

/**
 * Helper to make a JSON fetch request with configurable timeout.
 * @param {string} url
 * @returns {Promise<any>}
 */
async function fetchJson(url) {
  const timeoutMs = config.lyricsFetchTimeoutMs ?? 5000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`LRCLIB HTTP error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Normalize a string for fuzzy comparison.
 * @param {string} str
 * @returns {string}
 */
function normalizeForMatch(str) {
  return String(str || '').trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
}

/**
 * Score a search result against the query criteria.
 * Higher score = better match.
 * @param {object} result - LRCLIB search result
 * @param {string} queryTitle - normalized title
 * @param {string} queryArtist - artist string
 * @param {number} queryDuration - duration in seconds
 * @returns {number}
 */
function scoreResult(result, queryTitle, queryArtist, queryDuration) {
  let score = 0;

  // Title match
  const resultTitle = normalizeForMatch(result.trackName || result.name || '');
  const normalizedQueryTitle = normalizeForMatch(queryTitle);
  if (resultTitle === normalizedQueryTitle) {
    score += 100;
  } else if (resultTitle.includes(normalizedQueryTitle) || normalizedQueryTitle.includes(resultTitle)) {
    score += 50;
  }

  // Artist match
  if (queryArtist) {
    const resultArtist = normalizeForMatch(result.artistName || '');
    const normalizedQueryArtist = normalizeForMatch(queryArtist);
    if (resultArtist === normalizedQueryArtist) {
      score += 80;
    } else if (resultArtist.includes(normalizedQueryArtist) || normalizedQueryArtist.includes(resultArtist)) {
      score += 40;
    }
  }

  // Duration match (within 3 seconds)
  if (queryDuration > 0 && result.duration > 0) {
    const diff = Math.abs(queryDuration - result.duration);
    if (diff <= 3) {
      score += 60;
    } else if (diff <= 10) {
      score += 30;
    }
  }

  // Synced lyrics availability (strongly preferred)
  if (result.syncedLyrics) {
    score += 200;
  } else if (result.plainLyrics) {
    score += 20;
  }

  return score;
}

/**
 * Internal fetch function that does the actual LRCLIB API calls.
 * @param {object} track
 * @returns {Promise<object|null>}
 */
async function fetchLyricsInternal(track) {
  const rawTitle = track.title || track.name || '';
  if (!rawTitle.trim()) return null;

  const title = normalizeTitle(rawTitle);
  const artist = (track.artist || '').trim();
  const album = (track.album || '').trim();
  
  // Duration normalization (convert to seconds)
  let durationSeconds = 0;
  if (track.duration) {
    if (typeof track.duration === 'number') {
      durationSeconds = Math.round(track.duration);
    } else if (typeof track.duration === 'string') {
      const parts = track.duration.split(':');
      if (parts.length === 2) {
        durationSeconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      } else if (parts.length === 3) {
        durationSeconds = parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
      } else {
        durationSeconds = parseInt(track.duration, 10) || 0;
      }
    }
  }

  let lyricsData = null;

  // Try exact lookup first: /api/get
  try {
    const params = new URLSearchParams();
    params.append('track_name', title);
    if (artist) params.append('artist_name', artist);
    if (album) params.append('album_name', album);
    if (durationSeconds > 0) params.append('duration', String(durationSeconds));

    const url = `${LRCLIB_BASE}/api/get?${params.toString()}`;
    debugLog('exact lookup:', url);
    const result = await fetchJson(url);

    if (result) {
      lyricsData = result;
      debugLog('exact match found, id:', result.id);
    }
  } catch (error) {
    console.warn(`LRCLIB /api/get lookup failed, attempting fallback search: ${error.message}`);
  }

  // If no match or missing syncedLyrics, fallback to search: /api/search
  if (!lyricsData || (!lyricsData.syncedLyrics && !lyricsData.instrumental)) {
    try {
      const searchParams = new URLSearchParams();
      const queryStr = artist ? `${artist} - ${title}` : title;
      searchParams.append('q', queryStr);

      const url = `${LRCLIB_BASE}/api/search?${searchParams.toString()}`;
      debugLog('search:', url);
      const searchResults = await fetchJson(url);

      if (Array.isArray(searchResults) && searchResults.length > 0) {
        // Score all results and pick the best one
        const scored = searchResults
          .map(item => ({ item, score: scoreResult(item, title, artist, durationSeconds) }))
          .sort((a, b) => b.score - a.score);

        debugLog('search results:', scored.length, 'best score:', scored[0]?.score);

        const bestMatch = scored[0];
        if (bestMatch && bestMatch.item.syncedLyrics) {
          lyricsData = bestMatch.item;
        } else if (!lyricsData) {
          // No exact match had synced, take best search result even if plain only
          lyricsData = scored.find(s => s.item.syncedLyrics)?.item || scored[0]?.item || null;
        }
      }
    } catch (error) {
      console.warn(`LRCLIB /api/search lookup failed: ${error.message}`);
    }
  }

  if (!lyricsData) {
    debugLog('no lyrics found for:', rawTitle);
    const emptyResult = {
      provider: 'lrclib',
      synced: false,
      lines: [],
      plainLyrics: '',
      sourceId: '',
      fetchedAt: Date.now()
    };
    setCachedLyrics(track, emptyResult);
    return emptyResult;
  }

  // If instrumental, it doesn't have lyrics
  if (lyricsData.instrumental) {
    const instrumentalResult = {
      provider: 'lrclib',
      synced: false,
      lines: [],
      plainLyrics: '[Instrumental]',
      sourceId: String(lyricsData.id || ''),
      fetchedAt: Date.now()
    };
    setCachedLyrics(track, instrumentalResult);
    return instrumentalResult;
  }

  // Parse synchronized lyrics if available
  const hasSynced = Boolean(lyricsData.syncedLyrics);
  const parsedLines = hasSynced ? parseLrc(lyricsData.syncedLyrics) : [];

  const finalResult = {
    provider: 'lrclib',
    synced: hasSynced && parsedLines.length > 0,
    lines: parsedLines,
    plainLyrics: lyricsData.plainLyrics || '',
    sourceId: String(lyricsData.id || ''),
    fetchedAt: Date.now()
  };

  setCachedLyrics(track, finalResult);
  debugLog('cached lyrics, synced:', finalResult.synced, 'lines:', finalResult.lines.length);
  return finalResult;
}

/**
 * Fetches lyrics for a track with in-flight deduplication.
 * First checks cache, then tries LRCLIB API.
 * @param {object} track
 * @returns {Promise<object|null>} The lyric data object
 */
export async function getLyrics(track) {
  if (!track) return null;

  // 1. Check in-memory cache
  const cached = getCachedLyrics(track);
  if (cached) {
    debugLog('cache hit for:', track.title || track.name);
    return cached;
  }

  const key = lyricsCacheKey(track);
  if (!key) return null;

  // 2. Check if there's an in-flight request for the same track
  if (inFlightRequests.has(key)) {
    debugLog('deduped in-flight request for:', track.title || track.name);
    return inFlightRequests.get(key);
  }

  // 3. Create new fetch promise with deduplication
  const fetchPromise = fetchLyricsInternal(track)
    .catch(error => {
      console.error(`Failed to fetch lyrics for track:`, error);
      return null;
    })
    .finally(() => {
      inFlightRequests.delete(key);
    });

  inFlightRequests.set(key, fetchPromise);
  return fetchPromise;
}

/**
 * Prefetch lyrics for a track (fire-and-forget, safe).
 * Returns the promise but does not throw.
 * @param {object} track
 * @returns {Promise<object|null>}
 */
export async function prefetchLyrics(track) {
  try {
    debugLog('prefetch started for:', track?.title || track?.name);
    return await getLyrics(track);
  } catch (error) {
    debugLog('prefetch failed for:', track?.title || track?.name, error?.message);
    return null;
  }
}
