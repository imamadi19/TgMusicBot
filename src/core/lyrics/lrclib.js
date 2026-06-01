/**
 * LRCLIB API service to fetch lyrics.
 * Features: configurable timeout, in-flight request deduplication,
 * scored search result matching, prefetch support.
 */

import { config } from '../../config/index.js';
import { parseLrc } from './lrc-parser.js';
import { getCachedLyrics, setCachedLyrics, lyricsCacheKey } from './lyrics-cache.js';
import { normalizeLyricsMetadata, normalizeForMatch, normalizeTitle } from './track-metadata.js';
export { normalizeTitle };

const LRCLIB_BASE = 'https://lrclib.net';
const USER_AGENT = 'TgMusicBot/1.0.0 (https://github.com/imamadi19/TgMusicBot)';

/** In-flight request deduplication map: cacheKey -> Promise */
const inFlightRequests = new Map();

function debugLog(...args) {
  if (config.lyricsDebug) console.log('[lyrics]', ...args);
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
    score += 120;
  } else if (resultTitle.includes(normalizedQueryTitle) || normalizedQueryTitle.includes(resultTitle)) {
    score += 60;
  }

  // Artist match
  if (queryArtist) {
    const resultArtist = normalizeForMatch(result.artistName || '');
    const normalizedQueryArtist = normalizeForMatch(queryArtist);
    if (resultArtist === normalizedQueryArtist) {
      score += 100;
    } else if (resultArtist.includes(normalizedQueryArtist) || normalizedQueryArtist.includes(resultArtist)) {
      score += 50;
    }
  }

  // Duration match (within 3 seconds)
  if (queryDuration > 0 && result.duration > 0) {
    const diff = Math.abs(queryDuration - result.duration);
    if (diff <= 3) {
      score += 80;
    } else if (diff <= 8) {
      score += 40;
    }
  }

  // Synced lyrics availability (strongly preferred)
  if (result.syncedLyrics) {
    score += 300;
  } else if (result.plainLyrics) {
    score += 20;
  }

  // Penalize if title/artist totally unrelated
  const titleMatch = resultTitle.includes(normalizedQueryTitle) || normalizedQueryTitle.includes(resultTitle);
  if (!titleMatch) {
    score -= 100;
  }

  if (queryArtist) {
    const resultArtist = normalizeForMatch(result.artistName || '');
    const normalizedQueryArtist = normalizeForMatch(queryArtist);
    const artistMatch = resultArtist.includes(normalizedQueryArtist) || normalizedQueryArtist.includes(resultArtist);
    if (!artistMatch) {
      score -= 100;
    }
  }

  // Penalize karaoke/remix/live if original query not remix/live
  const isQueryRemix = normalizedQueryTitle.includes('remix');
  const isQueryLive = normalizedQueryTitle.includes('live');
  const isQueryKaraoke = normalizedQueryTitle.includes('karaoke');

  const isResultRemix = resultTitle.includes('remix') || (result.trackName || '').toLowerCase().includes('remix');
  const isResultLive = resultTitle.includes('live') || (result.trackName || '').toLowerCase().includes('live');
  const isResultKaraoke = resultTitle.includes('karaoke') || (result.trackName || '').toLowerCase().includes('karaoke');

  if (isResultRemix && !isQueryRemix) score -= 30;
  if (isResultLive && !isQueryLive) score -= 30;
  if (isResultKaraoke && !isQueryKaraoke) score -= 30;

  return score;
}

/**
 * Internal fetch function that does the actual LRCLIB API calls.
 * @param {object} track
 * @returns {Promise<object|null>}
 */
async function fetchLyricsInternal(track) {
  const meta = normalizeLyricsMetadata(track);
  if (!meta.rawTitle.trim()) return null;

  let bestPlainFallback = null;
  const triedUrls = [];
  let apiCallsSucceeded = 0;

  // 1. Try exact lookup for each candidate: /api/get
  for (const candidate of meta.candidates) {
    if (!candidate.title) continue;

    try {
      const params = new URLSearchParams();
      params.append('track_name', candidate.title);
      if (candidate.artist) params.append('artist_name', candidate.artist);
      if (meta.album) params.append('album_name', meta.album);
      if (meta.durationSeconds > 0) params.append('duration', String(meta.durationSeconds));

      const url = `${LRCLIB_BASE}/api/get?${params.toString()}`;
      triedUrls.push({ type: 'exact', url, candidate });

      debugLog('exact lookup trying:', url, `(reason: ${candidate.reason})`);

      const result = await fetchJson(url);
      apiCallsSucceeded++;

      if (result) {
        const parsedLines = result.syncedLyrics ? parseLrc(result.syncedLyrics) : [];
        if (result.syncedLyrics && parsedLines.length > 0) {
          debugLog('Exact match found with synced lyrics via /api/get, id:', result.id);
          const finalResult = {
            provider: 'lrclib',
            synced: true,
            lines: parsedLines,
            plainLyrics: result.plainLyrics || '',
            sourceId: String(result.id || ''),
            fetchedAt: Date.now(),
            status: 'synced',
            reason: `exact-match-synced (${candidate.reason})`,
            debug: { triedUrls, candidate, meta }
          };
          setCachedLyrics(track, finalResult);
          return finalResult;
        } else if (result.instrumental) {
          debugLog('Exact match found as instrumental via /api/get, id:', result.id);
          const finalResult = {
            provider: 'lrclib',
            synced: false,
            lines: [],
            plainLyrics: '[Instrumental]',
            sourceId: String(result.id || ''),
            fetchedAt: Date.now(),
            status: 'plainOnly',
            reason: `exact-match-instrumental (${candidate.reason})`,
            debug: { triedUrls, candidate, meta }
          };
          setCachedLyrics(track, finalResult);
          return finalResult;
        } else if (result.plainLyrics) {
          debugLog('Exact match plain-only found via /api/get, saving as fallback, id:', result.id);
          if (!bestPlainFallback) {
            bestPlainFallback = {
              result,
              candidate,
              parsedLines
            };
          }
        }
      }
    } catch (error) {
      console.warn(`LRCLIB exact lookup failed for candidate "${candidate.artist} - ${candidate.title}": ${error.message}`);
    }
  }

  // 2. Fallback to search if no exact synced match found: /api/search
  const searchQueries = [];
  const primaryCandidate = meta.candidates.find(c => c.reason === 'normalized-primary') || meta.candidates[0];

  if (primaryCandidate && primaryCandidate.artist) {
    searchQueries.push(`${primaryCandidate.artist} - ${primaryCandidate.title}`);
    searchQueries.push(`${primaryCandidate.artist} ${primaryCandidate.title}`);
  }

  for (const c of meta.candidates) {
    if (c.artist && c.title) {
      searchQueries.push(`${c.artist} - ${c.title}`);
      searchQueries.push(`${c.artist} ${c.title}`);
    }
  }

  if (primaryCandidate) {
    searchQueries.push(primaryCandidate.title);
  }
  searchQueries.push(meta.debug.rawTitleCleaned);

  const uniqueQueries = [...new Set(searchQueries.filter(Boolean))];
  const allSearchResults = new Map();

  for (const query of uniqueQueries) {
    try {
      const searchParams = new URLSearchParams();
      searchParams.append('q', query);
      const url = `${LRCLIB_BASE}/api/search?${searchParams.toString()}`;
      triedUrls.push({ type: 'search', url, query });

      debugLog('search trying query:', url);

      const results = await fetchJson(url);
      apiCallsSucceeded++;

      if (Array.isArray(results)) {
        for (const item of results) {
          if (item && item.id) {
            allSearchResults.set(item.id, item);
          }
        }
      }
    } catch (error) {
      console.warn(`LRCLIB search query failed for "${query}": ${error.message}`);
    }
  }

  // Verify that communications were successful
  if (apiCallsSucceeded === 0) {
    throw new Error('LRCLIB API is unreachable or all requests timed out.');
  }

  // 3. Score search results
  const scoredResults = [];
  for (const result of allSearchResults.values()) {
    const score = scoreResult(result, meta.title, meta.artist, meta.durationSeconds);
    scoredResults.push({ result, score });
  }

  scoredResults.sort((a, b) => b.score - a.score);

  if (config.lyricsDebug && scoredResults.length > 0) {
    console.log('[lyrics] Top scored search results:');
    scoredResults.slice(0, 5).forEach((sr, idx) => {
      console.log(`  ${idx + 1}. [Score: ${sr.score}] "${sr.result.artistName}" - "${sr.result.trackName}" (Duration: ${sr.result.duration}s, Synced: ${!!sr.result.syncedLyrics}, ID: ${sr.result.id})`);
    });
  }

  // 4. Selection
  let chosenResult = null;
  let selectionReason = '';

  // Synced results with score >= 250 are considered reasonable synced matches
  const reasonableSyncedResults = scoredResults.filter(sr => sr.result.syncedLyrics && sr.score >= 250);

  if (reasonableSyncedResults.length > 0) {
    chosenResult = reasonableSyncedResults[0].result;
    selectionReason = `best-synced-search (score: ${reasonableSyncedResults[0].score})`;
  } else if (bestPlainFallback) {
    chosenResult = bestPlainFallback.result;
    selectionReason = `exact-plain-fallback`;
  } else if (scoredResults.length > 0) {
    const bestSearch = scoredResults[0];
    if (bestSearch.score >= 100) {
      chosenResult = bestSearch.result;
      selectionReason = `best-search-fallback (score: ${bestSearch.score})`;
    }
  }

  if (!chosenResult) {
    debugLog('No lyrics found for:', meta.rawTitle);
    const emptyResult = {
      provider: 'lrclib',
      synced: false,
      lines: [],
      plainLyrics: '',
      sourceId: '',
      fetchedAt: Date.now(),
      status: 'notFound',
      reason: 'no-matching-results',
      debug: { triedUrls, meta, scoredResults: scoredResults.slice(0, 5) }
    };
    setCachedLyrics(track, emptyResult);
    return emptyResult;
  }

  if (chosenResult.instrumental) {
    const instrumentalResult = {
      provider: 'lrclib',
      synced: false,
      lines: [],
      plainLyrics: '[Instrumental]',
      sourceId: String(chosenResult.id || ''),
      fetchedAt: Date.now(),
      status: 'plainOnly',
      reason: selectionReason + ' (instrumental)',
      debug: { triedUrls, meta, scoredResults: scoredResults.slice(0, 5) }
    };
    setCachedLyrics(track, instrumentalResult);
    return instrumentalResult;
  }

  const hasSynced = Boolean(chosenResult.syncedLyrics);
  const parsedLines = hasSynced ? parseLrc(chosenResult.syncedLyrics) : [];

  const finalResult = {
    provider: 'lrclib',
    synced: hasSynced && parsedLines.length > 0,
    lines: parsedLines,
    plainLyrics: chosenResult.plainLyrics || '',
    sourceId: String(chosenResult.id || ''),
    fetchedAt: Date.now(),
    status: hasSynced && parsedLines.length > 0 ? 'synced' : 'plainOnly',
    reason: selectionReason,
    debug: { triedUrls, meta, scoredResults: scoredResults.slice(0, 5) }
  };

  setCachedLyrics(track, finalResult);
  debugLog('cached lyrics, synced:', finalResult.synced, 'lines:', finalResult.lines.length, 'reason:', selectionReason);
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
