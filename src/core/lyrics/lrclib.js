/**
 * LRCLIB API service to fetch lyrics.
 * Features: configurable timeout, in-flight request deduplication,
 * scored search result matching, prefetch support.
 */

import { config } from '../../config/index.js';
import { parseLrc } from './lrc-parser.js';
import { getCachedLyrics, setCachedLyrics, lyricsCacheKey, clearLyricsCacheForTrack } from './lyrics-cache.js';
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
 * @param {object} result - LRCLIB search result
 * @param {string} queryTitle - normalized title
 * @param {string} queryArtist - artist string
 * @param {number} queryDuration - duration in seconds
 * @returns {number}
 */
function scoreResult(result, queryTitle, queryArtist, queryDuration) {
  let score = 0;

  const resultTitle = normalizeForMatch(result.trackName || result.name || '');
  const normalizedQueryTitle = normalizeForMatch(queryTitle);
  const resultArtist = normalizeForMatch(result.artistName || '');
  const normalizedQueryArtist = normalizeForMatch(queryArtist);

  // Title match
  if (resultTitle === normalizedQueryTitle) {
    score += 120;
  } else if (resultTitle.includes(normalizedQueryTitle) || normalizedQueryTitle.includes(resultTitle)) {
    score += 60;
  } else {
    // unrelated title penalty: -80
    score -= 80;
  }

  // Artist match
  if (normalizedQueryArtist && normalizedQueryArtist.length >= 2) {
    if (resultArtist === normalizedQueryArtist) {
      score += 100;
    } else if (resultArtist.includes(normalizedQueryArtist) || normalizedQueryArtist.includes(resultArtist)) {
      score += 50;
    } else {
      // artist mismatch penalty only if queryArtist is present and long enough
      score -= 100;
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
 * Calculates similarity score (0.0 to 1.0) based on title match and word overlap.
 */
function titleSimilarity(title1, title2) {
  const t1 = normalizeForMatch(title1);
  const t2 = normalizeForMatch(title2);
  if (!t1 || !t2) return 0;
  if (t1 === t2) return 1.0;
  if (t1.includes(t2) || t2.includes(t1)) return 0.8;
  
  // Word overlap
  const words1 = t1.split(/\s+/).filter(w => w.length > 1);
  const words2 = t2.split(/\s+/).filter(w => w.length > 1);
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const intersection = words1.filter(w => words2.includes(w));
  const overlap = intersection.length / Math.max(words1.length, words2.length);
  return overlap;
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

    // Helper to do exact get with optional duration
    const tryGet = async (useDuration) => {
      const params = new URLSearchParams();
      params.append('track_name', candidate.title);
      if (candidate.artist) params.append('artist_name', candidate.artist);
      if (meta.album) params.append('album_name', meta.album);
      if (useDuration && meta.durationSeconds > 0) {
        params.append('duration', String(meta.durationSeconds));
      }

      const url = `${LRCLIB_BASE}/api/get?${params.toString()}`;
      triedUrls.push({ type: 'exact', url, candidate, useDuration });
      debugLog('exact lookup trying:', url, `(reason: ${candidate.reason}, duration: ${useDuration})`);
      return fetchJson(url);
    };

    let result = null;
    try {
      result = await tryGet(true);
      if (!result && meta.durationSeconds > 0) {
        // Retry without duration
        result = await tryGet(false);
      }
    } catch (error) {
      console.warn(`LRCLIB exact lookup error: ${error.message}`);
    }

    if (result) {
      apiCallsSucceeded++;
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
          debug: {
            meta,
            triedUrls: triedUrls.map(u => ({ type: u.type, url: u.url })),
            searchQueries: [],
            topResults: [],
            chosenResult: {
              id: result.id,
              artistName: result.artistName,
              trackName: result.trackName,
              duration: result.duration,
              hasSynced: true
            },
            reason: `exact-match-synced (${candidate.reason})`,
            cacheKey: lyricsCacheKey(track)
          }
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
          debug: {
            meta,
            triedUrls: triedUrls.map(u => ({ type: u.type, url: u.url })),
            searchQueries: [],
            topResults: [],
            chosenResult: {
              id: result.id,
              artistName: result.artistName,
              trackName: result.trackName,
              duration: result.duration,
              hasSynced: false
            },
            reason: `exact-match-instrumental (${candidate.reason})`,
            cacheKey: lyricsCacheKey(track)
          }
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

  const syncedResults = scoredResults.filter(sr => sr.result.syncedLyrics);
  const reasonableSynced = syncedResults.filter(sr => sr.score >= 150);

  if (reasonableSynced.length > 0) {
    chosenResult = reasonableSynced[0].result;
    selectionReason = `best-synced-search (score: ${reasonableSynced[0].score})`;
  } else if (syncedResults.length > 0) {
    const bestSimilaritySynced = syncedResults
      .map(sr => ({ ...sr, similarity: titleSimilarity(sr.result.trackName, meta.title) }))
      .filter(sr => sr.similarity >= 0.4)
      .sort((a, b) => b.similarity - a.similarity || b.score - a.score);

    if (bestSimilaritySynced.length > 0) {
      chosenResult = bestSimilaritySynced[0].result;
      selectionReason = `low-confidence-synced (similarity: ${bestSimilaritySynced[0].similarity.toFixed(2)}, score: ${bestSimilaritySynced[0].score})`;
    }
  }

  if (!chosenResult && bestPlainFallback) {
    chosenResult = bestPlainFallback.result;
    selectionReason = `exact-plain-fallback`;
  }

  if (!chosenResult && scoredResults.length > 0) {
    const bestSearch = scoredResults[0];
    if (bestSearch.score >= 40) {
      chosenResult = bestSearch.result;
      selectionReason = `best-search-fallback (score: ${bestSearch.score})`;
    }
  }

  // Build compact debug info representation
  const topResultsDebug = scoredResults.slice(0, 5).map(sr => ({
    score: sr.score,
    id: sr.result.id,
    artistName: sr.result.artistName,
    trackName: sr.result.trackName,
    duration: sr.result.duration,
    hasSynced: !!sr.result.syncedLyrics
  }));

  const chosenResultDebug = chosenResult ? {
    id: chosenResult.id,
    artistName: chosenResult.artistName,
    trackName: chosenResult.trackName,
    duration: chosenResult.duration,
    hasSynced: !!chosenResult.syncedLyrics
  } : null;

  const debugObject = {
    meta,
    triedUrls: triedUrls.map(u => ({ type: u.type, url: u.url })),
    searchQueries: uniqueQueries,
    topResults: topResultsDebug,
    chosenResult: chosenResultDebug,
    reason: selectionReason,
    cacheKey: lyricsCacheKey(track)
  };

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
      debug: debugObject
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
      debug: debugObject
    };
    setCachedLyrics(track, instrumentalResult);
    return instrumentalResult;
  }

  const hasSynced = Boolean(chosenResult.syncedLyrics);
  const parsedLines = hasSynced ? parseLrc(chosenResult.syncedLyrics) : [];
  const isLowConfidence = selectionReason.startsWith('low-confidence-synced');

  const finalResult = {
    provider: 'lrclib',
    synced: hasSynced && parsedLines.length > 0,
    lines: parsedLines,
    plainLyrics: chosenResult.plainLyrics || '',
    sourceId: String(chosenResult.id || ''),
    fetchedAt: Date.now(),
    status: isLowConfidence ? 'lowConfidence' : (hasSynced && parsedLines.length > 0 ? 'synced' : 'plainOnly'),
    reason: selectionReason,
    debug: debugObject
  };

  setCachedLyrics(track, finalResult);
  debugLog('cached lyrics, synced:', finalResult.synced, 'lines:', finalResult.lines.length, 'reason:', selectionReason);
  return finalResult;
}

/**
 * Fetches lyrics for a track with in-flight deduplication.
 * First checks cache, then tries LRCLIB API.
 * @param {object} track
 * @param {object} [options]
 * @returns {Promise<object|null>} The lyric data object
 */
export async function getLyrics(track, options = {}) {
  if (!track) return null;

  const forceRefresh = Boolean(options.forceRefresh);
  const bypassNotFoundCache = Boolean(options.bypassNotFoundCache);

  if (forceRefresh) {
    clearLyricsCacheForTrack(track);
  }

  // 1. Check in-memory cache
  if (!forceRefresh) {
    const cached = getCachedLyrics(track);
    if (cached) {
      if (cached.status === 'notFound' && bypassNotFoundCache) {
        debugLog('cache hit but bypassing notFound cache for:', track.title || track.name);
      } else {
        debugLog('cache hit for:', track.title || track.name);
        return cached;
      }
    }
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
 * Forces a refresh of the lyrics for a track by clearing the cache first.
 * @param {object} track
 * @returns {Promise<object|null>}
 */
export async function refreshLyrics(track) {
  return getLyrics(track, { forceRefresh: true });
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
