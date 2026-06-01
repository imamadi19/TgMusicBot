/**
 * Lyrics runner scheduler.
 * Sends lyric lines as Telegram messages at appropriate timestamps.
 */

import { voicePlayer } from '../player/player.js';
import { chatCache } from '../cache/chat-cache.js';
import { getLyrics } from './lrclib.js';

const activeRunners = new Map();
let globalBotApi = null;

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
 * Combines adjacent lyric lines if they are too close in time.
 * @param {Array<{time: number, text: string}>} lines
 * @param {number} startIndex
 * @returns {{text: string, nextIndex: number}}
 */
function getLyricTextAndNextIndex(lines, startIndex) {
  let text = lines[startIndex].text;
  let nextIndex = startIndex;

  // Combine subsequent lines if timestamp gap is < 1.5 seconds
  while (nextIndex + 1 < lines.length) {
    const gap = lines[nextIndex + 1].time - lines[nextIndex].time;
    if (gap >= 0 && gap < 1.5) {
      const nextText = lines[nextIndex + 1].text;
      if (nextText && (text + '\n' + nextText).length <= 300) {
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
    stopLyricsForChat(chatId);
    return;
  }

  // Ensure it is the same track
  const isSameTrack = 
    (activeTrack.trackId && activeTrack.trackId === runner.track.trackId) ||
    (activeTrack.url && activeTrack.url === runner.track.url) ||
    (activeTrack.name && activeTrack.name === runner.track.name);

  if (!isSameTrack) {
    stopLyricsForChat(chatId);
    return;
  }

  // 2. Skip if playback is paused
  if (chatCache.isPaused(chatId)) {
    return;
  }

  // 3. Calculate current playback position
  if (!activeTrack.startedAt) return;
  const elapsedSeconds = (Date.now() - new Date(activeTrack.startedAt).getTime()) / 1000;

  // 4. Find the matching lyric line index
  let targetIndex = -1;
  for (let i = 0; i < runner.lines.length; i++) {
    if (runner.lines[i].time <= elapsedSeconds) {
      targetIndex = i;
    } else {
      break;
    }
  }

  // 5. Send lyric if we have a new line
  if (targetIndex !== -1 && targetIndex !== runner.lastSentIndex) {
    const now = Date.now();
    // Rate limit: minimal interval of 1.5 seconds between Telegram messages
    if (now - runner.lastSentTimeMs < 1500) {
      return; // Skip and wait for the next tick
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
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function startLyricsForChat(chatId, ctxOrApi, track) {
  const key = String(chatId);
  
  // Stop existing runner first
  stopLyricsForChat(key);

  const api = ctxOrApi?.api || ctxOrApi || globalBotApi;
  if (!api) {
    return { success: false, message: 'Bot API instance is not available' };
  }

  try {
    const lyricsResult = await getLyrics(track);
    if (!lyricsResult || !lyricsResult.synced || lyricsResult.lines.length === 0) {
      return { 
        success: false, 
        message: lyricsResult?.plainLyrics ? 'plainOnly' : 'notFound'
      };
    }

    const runner = {
      chatId: key,
      api,
      track,
      lines: lyricsResult.lines,
      lastSentIndex: -1,
      lastSentTimeMs: 0,
      lastSentText: '',
      timer: null
    };

    activeRunners.set(key, runner);
    runner.timer = setInterval(() => {
      runTick(key).catch(err => console.error(`Error in lyrics tick for chat ${key}:`, err));
    }, 500);

    return { success: true };
  } catch (error) {
    console.error(`Failed to start lyrics runner for chat ${key}:`, error);
    return { success: false, message: 'error', error: error.message };
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
    if (runner.timer) {
      clearInterval(runner.timer);
    }
    activeRunners.delete(key);
    return true;
  }
  return false;
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
    return {
      active: true,
      track: runner.track,
      lastSentText: runner.lastSentText
    };
  }
  return {
    active: false,
    track: null,
    lastSentText: null
  };
}
