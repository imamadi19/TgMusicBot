/**
 * LRCLIB API service to fetch lyrics.
 */

import { parseLrc } from './lrc-parser.js';
import { getCachedLyrics, setCachedLyrics } from './lyrics-cache.js';

const LRCLIB_BASE = 'https://lrclib.net';
const USER_AGENT = 'TgMusicBot/1.0.0 (https://github.com/imamadi19/TgMusicBot)';
const FETCH_TIMEOUT_MS = 10000;

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
 * Helper to make a JSON fetch request with timeout.
 * @param {string} url
 * @returns {Promise<any>}
 */
async function fetchJson(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

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
 * Fetches lyrics for a track, first checking cache, then trying LRCLIB API.
 * Uses exact match endpoint (/api/get) and falls back to search endpoint (/api/search).
 * @param {object} track
 * @returns {Promise<object|null>} The lyric data object
 */
export async function getLyrics(track) {
  if (!track) return null;

  // 1. Check in-memory cache
  const cached = getCachedLyrics(track);
  if (cached) {
    return cached;
  }

  const rawTitle = track.title || track.name || '';
  if (!rawTitle.trim()) {
    return null;
  }

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
    const result = await fetchJson(url);

    if (result) {
      lyricsData = result;
    }
  } catch (error) {
    console.warn(`LRCLIB /api/get lookup failed, attempting fallback search: ${error.message}`);
  }

  // If no match or missing syncedLyrics, fallback to search: /api/search
  if (!lyricsData || (!lyricsData.syncedLyrics && !lyricsData.instrumental)) {
    try {
      const searchParams = new URLSearchParams();
      // Prepare a search query 'q' which is flexible
      const queryStr = artist ? `${artist} - ${title}` : title;
      searchParams.append('q', queryStr);

      const url = `${LRCLIB_BASE}/api/search?${searchParams.toString()}`;
      const searchResults = await fetchJson(url);

      if (Array.isArray(searchResults) && searchResults.length > 0) {
        // Find first item with synced lyrics
        const matched = searchResults.find(item => item.syncedLyrics);
        if (matched) {
          lyricsData = matched;
        } else if (!lyricsData) {
          // If no synced lyrics, fallback to the first item with plain lyrics as reference
          lyricsData = searchResults[0];
        }
      }
    } catch (error) {
      console.warn(`LRCLIB /api/search lookup failed: ${error.message}`);
    }
  }

  if (!lyricsData) {
    // Cache the failure so we don't spam the API for non-existing lyrics
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
  return finalResult;
}
