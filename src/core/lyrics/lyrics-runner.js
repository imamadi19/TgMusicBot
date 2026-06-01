/**
 * Lyrics runner scheduler.
 * Sends lyric lines as Telegram messages at appropriate timestamps.
 * Features: sync offset, correct start position, immediate first tick,
 * rate-limit-aware skipping, resync on seek, auto-next integration.
 */

import { config } from '../../config/index.js';
import { voicePlayer } from '../player/player.js';
import { chatCache } from '../cache/chat-cache.js';
import { getLyrics } from './lrclib.js';
import { getCachedLyrics } from './lyrics-cache.js';

const activeRunners = new Map();
let globalBotApi = null;

function debugLog(...args) {
  if (config.lyricsDebug) console.log('[lyrics-runner]', ...args);
}

/**
 * Sets the global Bot API instance.
 * @param {any} api
 */
export function setGlobalBotApi(api) {
  globalBotApi = api;
}

/**
 * HTML Escaper helper.
 * @param {string} str
 * @returns {string}
 */
function htmlEscape(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Calculate the current playback position in seconds, adjusted by sync offset.
 * Offset semantics: LYRICS_SYNC_OFFSET_MS negative = lyrics appear earlier (advance).
 * Formula: elapsed = rawMs - syncOffset
 * So offset=-1500 means elapsed is rawMs+1500, lyrics appear 1.5s earlier.
 * @param {object} activeTrack
 * @returns {number} position in seconds
 */
function playbackPositionSeconds(activeTrack) {
  if (!activeTrack?.startedAt) return 0;
  const startedMs = new Date(activeTrack.startedAt).getTime();
  const rawMs = Date.now() - startedMs;
  const syncOffset = config.lyricsSyncOffsetMs ?? 0;
  // elapsed = rawMs - syncOffset
  // offset=-1500: elapsed = rawMs + 1500 (lyrics advance)
  // offset=+1500: elapsed = rawMs - 1500 (lyrics delay)
  const adjustedMs = rawMs - syncOffset;
  return Math.max(0, adjustedMs / 1000);
}

/**
 * Find the initial lastSentIndex based on current playback position.
 * Sets the index so that lines already passed are skipped.
 * @param {Array<{time: number, text: string}>} lines
 * @param {number} currentPositionSeconds
 * @returns {number} The index of the last line that should be considered "already sent"
 */
function findInitialLastSentIndex(lines, currentPositionSeconds) {
  const graceSeconds = config.lyricsStartGraceSeconds ?? 1.5;
  const threshold = currentPositionSeconds - graceSeconds;

  if (threshold <= 0) return -1;

  let lastIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time < threshold) {
      lastIndex = i;
    } else {
      break;
    }
  }
  return lastIndex;
}

/**
 * Combines adjacent lyric lines if they are too close in time.
 * @param {Array<{time: number, text: string}>} lines
 * @param {number} startIndex
 * @returns {{text: string, nextIndex: number}}
 */
function getLyricTextAndNextIndex(lines, startIndex) {
  const maxLineLength = config.lyricsMaxLineLength ?? 300;
  let text = lines[startIndex].text;
  let nextIndex = startIndex;

  // Combine subsequent lines if timestamp gap is < 1.5 seconds
  while (nextIndex + 1 < lines.length) {
    const gap = lines[nextIndex + 1].time - lines[nextIndex].time;
    if (gap >= 0 && gap < 1.5) {
      const nextText = lines[nextIndex + 1].text;
      if (nextText && (text + '\n' + nextText).length <= maxLineLength) {
        text = text + '\n' + nextText;
        nextIndex++;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return { text, nextIndex };
}

/**
 * The periodic tick handler for a chat's lyrics runner.
 * @param {string} chatId
 */
async function runTick(chatId) {
  const key = String(chatId);
  const runner = activeRunners.get(key);
  if (!runner) return;

  // 1. Check if the track is still active in player
  const activeTrack = voicePlayer.activeTrack(chatId);
  if (!activeTrack) {
    debugLog('no active track, stopping runner for', key);
    stopLyricsForChat(chatId);
    return;
  }

  // Ensure it is the same track
  const isSameTrack = 
    (activeTrack.trackId && activeTrack.trackId === runner.track.trackId) ||
    (activeTrack.url && activeTrack.url === runner.track.url) ||
    (activeTrack.name && activeTrack.name === runner.track.name);

  if (!isSameTrack) {
    debugLog('track changed, stopping runner for', key);
    stopLyricsForChat(chatId);
    return;
  }

  // 2. Skip if playback is paused
  if (chatCache.isPaused(chatId)) {
    return;
  }

  // 3. Calculate current playback position with sync offset
  if (!activeTrack.startedAt) return;
  const elapsedSeconds = playbackPositionSeconds(activeTrack);

  // 4. Find the matching lyric line index for current position
  let targetIndex = -1;
  for (let i = 0; i < runner.lines.length; i++) {
    if (runner.lines[i].time <= elapsedSeconds) {
      targetIndex = i;
    } else {
      break;
    }
  }

  // 5. Send lyric if we have a new line
  if (targetIndex !== -1 && targetIndex > runner.lastSentIndex) {
    const now = Date.now();
    const minInterval = config.lyricsMinSendIntervalMs ?? 1200;

    // Rate limit check
    if (now - runner.lastSentTimeMs < minInterval) {
      // Rate limited: update lastSentIndex to skip old lines,
      // but keep one behind so we send the latest on next allowed tick
      if (targetIndex > runner.lastSentIndex + 1) {
        runner.lastSentIndex = targetIndex - 1;
        debugLog('rate limited, advancing lastSentIndex to', runner.lastSentIndex);
      }
      return;
    }

    // Skip old threshold: if target line is way behind current position,
    // find the most recent line instead
    const skipThreshold = config.lyricsSkipOldLineThresholdSeconds ?? 3;
    if (elapsedSeconds - runner.lines[targetIndex].time > skipThreshold && targetIndex > runner.lastSentIndex + 1) {
      // Jump to the latest relevant line
      debugLog('skipping old lines, jumping from', runner.lastSentIndex, 'to', targetIndex);
    }

    const { text, nextIndex } = getLyricTextAndNextIndex(runner.lines, targetIndex);
    
    // Update state before calling network API to prevent race condition on slow network
    runner.lastSentIndex = nextIndex;
    runner.lastSentTimeMs = now;
    runner.lastSentText = text;

    if (!text.trim()) {
      return;
    }

    const escapedText = htmlEscape(text);
    const messageText = `♪ ${escapedText}`;

    debugLog(`[${key}] sending line ${targetIndex} at ${elapsedSeconds.toFixed(1)}s: "${text.slice(0, 50)}..."`);

    // TODO: send lyrics through assistant voice chat messages if supported by Pyrogram/PyTgCalls.
    runner.api.sendMessage(chatId, messageText, { parse_mode: 'HTML' })
      .catch((error) => {
        console.warn(`Lyrics runner failed to send message to chat ${chatId}: ${error.message}`);
        // Terminate runner if chat is inaccessible or bot is kicked
        if (error.message.includes('chat not found') || error.message.includes('forbidden')) {
          stopLyricsForChat(chatId);
        }
      });
  }
}

/**
 * Starts the lyrics runner for a chat.
 * @param {string|number} chatId
 * @param {any} ctxOrApi
 * @param {object} track
 * @param {object} [options={}]
 * @param {boolean} [options.silent=false] - If true, don't return user-facing messages for not-found
 * @param {boolean} [options.preferCache=false] - If true, only use cached lyrics (don't fetch)
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function startLyricsForChat(chatId, ctxOrApi, track, options = {}) {
  const key = String(chatId);
  const { silent = false, preferCache = false } = options;
  
  // Stop existing runner first
  stopLyricsForChat(key);

  const api = ctxOrApi?.api || ctxOrApi || globalBotApi;
  if (!api) {
    return { success: false, message: 'Bot API instance is not available' };
  }

  try {
    let lyricsResult;
    
    if (preferCache) {
      // Try cache first, fall back to fetch
      lyricsResult = getCachedLyrics(track);
      if (!lyricsResult) {
        debugLog('no cache for preferCache, fetching for', track.title || track.name);
        lyricsResult = await getLyrics(track);
      }
    } else {
      lyricsResult = await getLyrics(track);
    }

    if (!lyricsResult || !lyricsResult.synced || lyricsResult.lines.length === 0) {
      if (silent) {
        debugLog('no synced lyrics (silent mode), skipping for', track.title || track.name);
        return { success: false, message: 'notFound' };
      }
      return { 
        success: false, 
        message: lyricsResult?.plainLyrics ? 'plainOnly' : 'notFound'
      };
    }

    // Calculate initial position from active track
    const activeTrack = voicePlayer.activeTrack(chatId);
    const currentPosition = activeTrack ? playbackPositionSeconds(activeTrack) : 0;
    const initialLastSentIndex = findInitialLastSentIndex(lyricsResult.lines, currentPosition);

    debugLog(`starting runner for ${key}, position: ${currentPosition.toFixed(1)}s, initialIndex: ${initialLastSentIndex}, totalLines: ${lyricsResult.lines.length}`);

    const runner = {
      chatId: key,
      api,
      track,
      lines: lyricsResult.lines,
      lastSentIndex: initialLastSentIndex,
      lastSentTimeMs: 0,
      lastSentText: '',
      provider: lyricsResult.provider || 'lrclib',
      sourceId: lyricsResult.sourceId || '',
      startedAt: Date.now(),
      timer: null
    };

    activeRunners.set(key, runner);

    // Immediately run the first tick (don't wait for interval)
    await runTick(key).catch(err => console.error(`Error in initial lyrics tick for chat ${key}:`, err));

    // Set up recurring tick interval
    const tickInterval = config.lyricsTickIntervalMs ?? 300;
    runner.timer = setInterval(() => {
      runTick(key).catch(err => console.error(`Error in lyrics tick for chat ${key}:`, err));
    }, tickInterval);

    return { success: true };
  } catch (error) {
    console.error(`Failed to start lyrics runner for chat ${key}:`, error);
    return { success: false, message: 'error', error: error.message };
  }
}

/**
 * Starts lyrics for a chat only if lyrics are enabled for that chat.
 * Used for auto-start scenarios (auto-next, first play, etc.)
 * @param {string|number} chatId
 * @param {any} api
 * @param {object} track
 * @returns {Promise<void>}
 */
export async function startLyricsForChatIfEnabled(chatId, api, track) {
  try {
    const { getLyricsEnabled } = await import('../db/chat-settings.js');
    const enabled = await getLyricsEnabled(chatId);
    if (!enabled) return;
    await startLyricsForChat(chatId, api, track, { silent: true, preferCache: true });
  } catch (error) {
    debugLog('startLyricsForChatIfEnabled error:', error?.message);
  }
}

/**
 * Stops the lyrics runner for a chat.
 * @param {string|number} chatId
 * @returns {boolean} True if a runner was stopped
 */
export function stopLyricsForChat(chatId) {
  const key = String(chatId);
  const runner = activeRunners.get(key);
  if (runner) {
    debugLog('stopping runner for', key);
    if (runner.timer) {
      clearInterval(runner.timer);
    }
    activeRunners.delete(key);
    return true;
  }
  return false;
}

/**
 * Resync the lyrics runner position after a seek operation.
 * @param {string|number} chatId
 */
export function resyncLyricsForChat(chatId) {
  const key = String(chatId);
  const runner = activeRunners.get(key);
  if (!runner) return;

  const activeTrack = voicePlayer.activeTrack(chatId);
  if (!activeTrack) return;

  const pos = playbackPositionSeconds(activeTrack);
  const newIndex = findInitialLastSentIndex(runner.lines, pos);
  debugLog(`resync for ${key}: position=${pos.toFixed(1)}s, oldIndex=${runner.lastSentIndex}, newIndex=${newIndex}`);
  runner.lastSentIndex = newIndex;
  runner.lastSentTimeMs = 0; // Allow immediate send after resync
}

/**
 * Gets the lyrics runner status for a chat.
 * @param {string|number} chatId
 * @returns {object} Status object
 */
export function getLyricsStatus(chatId) {
  const key = String(chatId);
  const runner = activeRunners.get(key);
  if (runner) {
    const activeTrack = voicePlayer.activeTrack(chatId);
    const currentPosition = activeTrack ? playbackPositionSeconds(activeTrack) : 0;
    return {
      active: true,
      track: runner.track,
      lastSentText: runner.lastSentText,
      lastSentIndex: runner.lastSentIndex,
      currentPosition: Math.round(currentPosition * 10) / 10,
      totalLines: runner.lines.length,
      provider: runner.provider,
      sourceId: runner.sourceId,
      startedAt: runner.startedAt,
      syncOffsetMs: config.lyricsSyncOffsetMs ?? 0
    };
  }
  return {
    active: false,
    track: null,
    lastSentText: null,
    lastSentIndex: -1,
    currentPosition: 0,
    totalLines: 0,
    provider: null,
    sourceId: null,
    startedAt: null,
    syncOffsetMs: config.lyricsSyncOffsetMs ?? 0
  };
}
