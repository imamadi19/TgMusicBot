/**
 * Command and callback handlers for /lyrics.
 */

import { commandArgs, htmlEscape } from '../utils/telegram.js';
import { getUserLanguage } from '../core/db/user-settings.js';
import { t } from '../i18n/index.js';
import { voicePlayer } from '../core/player/player.js';
import { getLyricsEnabled, setLyricsEnabled, getLyricsProvider } from '../core/db/chat-settings.js';
import { startLyricsForChat, stopLyricsForChat, getLyricsStatus } from '../core/lyrics/lyrics-runner.js';
import { getLyrics, prefetchLyrics } from '../core/lyrics/lrclib.js';
import { getCachedLyrics, getLyricsCacheInfo, clearLyricsCacheForTrack, lyricsCacheKey } from '../core/lyrics/lyrics-cache.js';
import { normalizeLyricsMetadata } from '../core/lyrics/track-metadata.js';
import { config } from '../config/index.js';
import { isUserAdminOrAuth } from './filters.js';
import { isPremiumActive } from '../core/db/premium.js';
import { secondsToClock } from '../utils/duration.js';

// Button styling helper (matches styledCallbackButton pattern from keyboards.js)
function styledCallbackButton(text, callbackData, style) {
  return {
    text,
    callback_data: callbackData,
    style,
  };
}

function rawKeyboard(rows) {
  return {
    inline_keyboard: rows,
  };
}

// 1. Keyboard layout generator
export function lyricsPanelKeyboard(language, options = {}) {
  const hasActiveTrack = options.hasActiveTrack ?? false;

  if (!hasActiveTrack) {
    return rawKeyboard([
      [
        styledCallbackButton(t(language, 'buttons.lyricsOnNext'), 'lyrics_on', 'success')
      ],
      [
        styledCallbackButton(`❌ ${t(language, 'buttons.close')}`, 'lyrics_close', 'danger')
      ]
    ]);
  }

  // Row 1: [▶️ Nyalakan] [⏹ Matikan]
  // Row 2: [🔄 Refresh] [🧹 Clear Cache]
  // Row 3: [🔁 Clear + Refresh]
  // Row 4: [❌ Tutup]
  return rawKeyboard([
    [
      styledCallbackButton(`▶️ ${t(language, 'buttons.lyricsOn')}`, 'lyrics_on', 'success'),
      styledCallbackButton(`⏹ ${t(language, 'buttons.lyricsOff')}`, 'lyrics_off', 'danger')
    ],
    [
      styledCallbackButton(`🔄 ${t(language, 'buttons.lyricsRefresh')}`, 'lyrics_refresh', 'primary'),
      styledCallbackButton(`🧹 ${t(language, 'buttons.lyricsClearCache')}`, 'lyrics_clearcache', 'danger')
    ],
    [
      styledCallbackButton(`🔁 ${t(language, 'buttons.lyricsClearRefresh')}`, 'lyrics_clear_refresh', 'danger')
    ],
    [
      styledCallbackButton(`❌ ${t(language, 'buttons.close')}`, 'lyrics_close', 'danger')
    ]
  ]);
}

// 2. Panel status text builder
export async function buildLyricsPanelText(ctx, language) {
  const chatId = ctx.chat.id;
  const activeTrack = voicePlayer.activeTrack(chatId);

  if (!activeTrack) {
    return `🎤 <b>${t(language, 'lyrics.panelTitle')}</b>\n\n${t(language, 'lyrics.noActiveTrack')}`;
  }

  const enabled = await getLyricsEnabled(chatId);
  const provider = await getLyricsProvider(chatId);
  const cacheInfo = getLyricsCacheInfo(activeTrack);
  const title = htmlEscape(activeTrack.title || activeTrack.name || 'Unknown Track');

  let cacheText = t(language, 'lyrics.unknown');
  let syncedText = t(language, 'lyrics.unknown');
  let linesCount = 0;

  if (cacheInfo && !cacheInfo.isExpired) {
    const item = cacheInfo.item;
    if (item.status === 'synced') {
      cacheText = t(language, 'lyrics.cacheSynced');
    } else if (item.status === 'plainOnly') {
      cacheText = t(language, 'lyrics.cachePlainOnly');
    } else if (item.status === 'notFound') {
      cacheText = t(language, 'lyrics.cacheNotFound');
    } else {
      cacheText = item.status;
    }
    syncedText = item.synced ? t(language, 'lyrics.available') : t(language, 'lyrics.notAvailable');
    linesCount = item.lines?.length || 0;
  }

  const statusText = enabled ? t(language, 'lyrics.statusEnabled') : t(language, 'lyrics.statusDisabled');

  return `🎤 <b>${t(language, 'lyrics.panelTitle')}</b>\n\n` +
         `🎵 <b>${t(language, 'lyrics.track')}:</b> ${title}\n` +
         `🔌 <b>${t(language, 'lyrics.provider')}:</b> ${provider.toUpperCase()}\n` +
         `📌 <b>${t(language, 'lyrics.statusLabel')}:</b> ${statusText}\n` +
         `📦 <b>${t(language, 'lyrics.cache')}:</b> ${cacheText}\n` +
         `🎼 <b>${t(language, 'lyrics.synced')}:</b> ${syncedText}\n` +
         `⏱ <b>${t(language, 'lyrics.lines')}:</b> ${linesCount}\n\n` +
         `${t(language, 'lyrics.chooseAction')}`;
}

// 3. Callback alert helper
export async function safeAnswerCallback(ctx, text = '', options = {}) {
  try {
    await ctx.answerCallbackQuery({ text, ...options });
  } catch (e) {
    // ignore
  }
}

// 4. Panel edit helper
export async function editLyricsPanel(ctx, text, keyboard) {
  const replyMarkup = keyboard;
  try {
    if (ctx.callbackQuery && ctx.callbackQuery.message) {
      const message = ctx.callbackQuery.message;
      if (message.text !== undefined) {
        await ctx.editMessageText(text, {
          parse_mode: 'HTML',
          reply_markup: replyMarkup
        });
        return;
      } else if (message.caption !== undefined) {
        await ctx.editMessageCaption({
          caption: text,
          parse_mode: 'HTML',
          reply_markup: replyMarkup
        });
        return;
      }
    }
  } catch (e) {
    console.warn('Failed to edit lyrics panel:', e);
  }

  // Fallback: send new reply
  try {
    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: replyMarkup
    });
  } catch (e) {
    console.error('Failed fallback reply for lyrics panel:', e);
  }
}

// 5. Panel delete helper
export async function deleteLyricsPanel(ctx) {
  try {
    await ctx.deleteMessage();
  } catch (e) {
    try {
      await ctx.editMessageReplyMarkup({ reply_markup: undefined });
    } catch (err) {
      // ignore
    }
  }
}

// 6. Permission check helper for panel interactions
export async function checkLyricsPermission(ctx, activeTrack) {
  const userId = ctx.from?.id;
  if (!userId) return false;

  // PM is open to everyone
  if (ctx.chat?.type === 'private') {
    return true;
  }

  // Owner/Devs bypass
  if (userId === config.ownerId || config.devs.includes(userId)) {
    return true;
  }

  // Requester of the active track (if data requester is available)
  if (activeTrack) {
    const requesterId = activeTrack.userId ?? activeTrack.requesterId ?? activeTrack.requestedById;
    if (requesterId && userId === Number(requesterId)) {
      return true;
    }
  }

  // Premium User
  try {
    const isPremium = await isPremiumActive('user', userId);
    if (isPremium) return true;
  } catch (e) {
    // Ignore DB error
  }

  // Admin or Auth status
  try {
    return await isUserAdminOrAuth(ctx, userId);
  } catch (e) {
    return false;
  }
}

// Command Handler for /lyrics
export async function lyricsHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const chatId = ctx.chat.id;
  const arg = commandArgs(ctx).trim().toLowerCase();

  // Permission validation helper for fallback legacy commands
  const checkPermission = async () => {
    const userId = ctx.from?.id;
    if (!userId) return false;

    // Owner and devs bypass checks
    if (userId === config.ownerId || config.devs.includes(userId)) {
      return true;
    }

    // Allowed to toggle in PM
    if (ctx.chat?.type === 'private') {
      return true;
    }

    // Check Premium status
    try {
      const isPremium = await isPremiumActive('user', userId);
      if (isPremium) return true;
    } catch (e) {
      // Ignore database or check error
    }

    // Check Admin or Auth status
    try {
      return await isUserAdminOrAuth(ctx, userId);
    } catch (e) {
      return false;
    }
  };

  const activeTrack = voicePlayer.activeTrack(chatId);

  // Default lookup check (when no arguments are provided): /lyrics panel
  if (!arg) {
    const text = await buildLyricsPanelText(ctx, language);
    const keyboard = lyricsPanelKeyboard(language, { hasActiveTrack: !!activeTrack });
    await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: keyboard
    });
    return;
  }

  // 1. Activate lyrics: /lyrics on
  if (arg === 'on') {
    if (!(await checkPermission())) {
      await ctx.reply(t(language, 'lyrics.adminOnly'));
      return;
    }

    await setLyricsEnabled(chatId, true);

    if (!activeTrack) {
      await ctx.reply(`${t(language, 'lyrics.enabled')}\n\n${t(language, 'lyrics.willStartNext')}`);
      return;
    }

    const infoMsg = await ctx.reply(t(language, 'lyrics.fetching'));
    const result = await startLyricsForChat(chatId, ctx, activeTrack);

    if (result.success) {
      await ctx.api.editMessageText(chatId, infoMsg.message_id, `${t(language, 'lyrics.enabled')}\n${t(language, 'lyrics.started')}`);
    } else {
      let errorMsg = t(language, 'lyrics.notFound');
      if (result.message === 'plainOnly') {
        errorMsg = t(language, 'lyrics.plainOnly');
      } else if (result.message === 'error') {
        errorMsg = t(language, 'lyrics.error', { error: result.error });
      }
      await ctx.api.editMessageText(chatId, infoMsg.message_id, `${t(language, 'lyrics.enabled')}\n\n⚠️ ${errorMsg}`);
    }
    return;
  }

  // 2. Deactivate lyrics: /lyrics off
  if (arg === 'off') {
    if (!(await checkPermission())) {
      await ctx.reply(t(language, 'lyrics.adminOnly'));
      return;
    }

    await setLyricsEnabled(chatId, false);
    stopLyricsForChat(chatId);
    await ctx.reply(`${t(language, 'lyrics.disabled')}\n${t(language, 'lyrics.stopped')}`);
    return;
  }

  // 3. Status check: /lyrics status
  if (arg === 'status') {
    const isEnabled = await getLyricsEnabled(chatId);
    const provider = await getLyricsProvider(chatId);
    const runnerStatus = getLyricsStatus(chatId);

    let currentTrackText = t(language, 'playback.nothingPlaying');
    let lyricsAvailableText = t(language, 'lyrics.noCache');

    if (activeTrack) {
      currentTrackText = activeTrack.title || activeTrack.name || 'Unknown Track';

      const cacheInfo = getLyricsCacheInfo(activeTrack);
      if (cacheInfo && !cacheInfo.isExpired) {
        const item = cacheInfo.item;
        if (item.status === 'synced') {
          lyricsAvailableText = t(language, 'lyrics.syncedAvailable');
        } else if (item.status === 'plainOnly') {
          lyricsAvailableText = t(language, 'lyrics.plainOnly');
        } else if (item.status === 'notFound') {
          lyricsAvailableText = `${t(language, 'lyrics.notFound')} (Cache: ${cacheInfo.ageSeconds}s yang lalu)`;
        } else {
          lyricsAvailableText = `${t(language, 'lyrics.notFound')} (Cache: ${item.status}, ${cacheInfo.ageSeconds}s yang lalu)`;
        }
      } else {
        lyricsAvailableText = t(language, 'lyrics.noCache');
        prefetchLyrics(activeTrack).catch(() => {});
      }
    }

    const lastSentLine = runnerStatus.active && runnerStatus.lastSentText
      ? `\n• Baris terakhir dikirim: <code>${htmlEscape(runnerStatus.lastSentText)}</code>`
      : '';

    let runnerDetails = '';
    if (runnerStatus.active) {
      runnerDetails = `\n• ${t(language, 'lyrics.currentPosition')}: <code>${secondsToClock(runnerStatus.currentPosition)}</code>` +
        `\n• ${t(language, 'lyrics.linesLoaded')}: <code>${runnerStatus.totalLines}</code>` +
        `\n• Baris: <code>${runnerStatus.lastSentIndex + 1}/${runnerStatus.totalLines}</code>`;
      if (runnerStatus.syncOffsetMs !== 0) {
        runnerDetails += `\n• ${t(language, 'lyrics.syncOffset')}: <code>${runnerStatus.syncOffsetMs}ms</code>`;
      }
    }

    const response = `<b>ℹ️ ${t(language, 'lyrics.status')}</b>\n` +
      `• Status: <b>${isEnabled ? t(language, 'lyrics.statusEnabled') : t(language, 'lyrics.statusDisabled')}</b>\n` +
      `• ${t(language, 'lyrics.provider')}: <code>${provider.toUpperCase()}</code>\n` +
      `• ${t(language, 'lyrics.currentTrack')}: <i>${htmlEscape(currentTrackText)}</i>\n` +
      `• ${lyricsAvailableText}${runnerDetails}${lastSentLine}`;

    await ctx.reply(response, { parse_mode: 'HTML' });
    return;
  }

  // 4. Test debug helper: /lyrics test
  if (arg === 'test') {
    const userId = ctx.from?.id;
    if (userId !== config.ownerId && !config.devs.includes(userId)) {
      await ctx.reply(t(language, 'devs.devOnly'));
      return;
    }

    if (!activeTrack) {
      await ctx.reply(t(language, 'lyrics.noActiveTrack'));
      return;
    }

    const testMsg = await ctx.reply(`🔍 [Test] Mengambil lirik untuk: <b>${htmlEscape(activeTrack.title || activeTrack.name)}</b>`, { parse_mode: 'HTML' });
    try {
      const cacheBefore = getLyricsCacheInfo(activeTrack);
      const cacheStatusBefore = cacheBefore && !cacheBefore.isExpired ? 'HIT' : 'MISS';

      const lyricsResult = await getLyrics(activeTrack);
      if (!lyricsResult) {
        await ctx.api.editMessageText(chatId, testMsg.message_id, '❌ Tidak ada lirik yang ditemukan (null response)');
        return;
      }

      const meta = normalizeLyricsMetadata(activeTrack);

      const summary = `<b>ℹ️ ${t(language, 'lyrics.debugTitle')}</b>\n` +
        `• Raw Title: <code>${htmlEscape(meta.rawTitle)}</code>\n` +
        `• Normalized Title: <code>${htmlEscape(meta.title)}</code>\n` +
        `• Artist: <code>${htmlEscape(meta.artist)}</code>\n` +
        `• Duration: <code>${meta.durationSeconds}s</code>\n` +
        `• Cache Key: <code>${htmlEscape(cacheBefore?.key || lyricsCacheKey(activeTrack))}</code>\n` +
        `• Cache Status: <b>${cacheStatusBefore}</b>\n` +
        `• Status: <b>${lyricsResult.status}</b>\n` +
        `• Synced: <b>${lyricsResult.synced}</b>\n` +
        `• Lines Loaded: <b>${lyricsResult.lines?.length || 0}</b>\n` +
        `• Source ID: <code>${lyricsResult.sourceId}</code>\n` +
        `• Reason: <i>${htmlEscape(lyricsResult.reason || 'None')}</i>`;

      await ctx.api.editMessageText(chatId, testMsg.message_id, summary, { parse_mode: 'HTML' });

      let details = `Candidates:\n`;
      meta.candidates.forEach((c, idx) => {
        details += `${idx + 1}. [${c.reason}] "${c.artist}" - "${c.title}"\n`;
      });

      if (lyricsResult.debug?.triedUrls && lyricsResult.debug.triedUrls.length > 0) {
        details += `\nTried Queries:\n`;
        lyricsResult.debug.triedUrls.forEach((u, idx) => {
          details += `${idx + 1}. [${u.type}] ${u.url}\n`;
        });
      }

      if (lyricsResult.debug?.scoredResults && lyricsResult.debug.scoredResults.length > 0) {
        details += `\nScored Results (Top 5):\n`;
        lyricsResult.debug.scoredResults.slice(0, 5).forEach((sr, idx) => {
          details += `${idx + 1}. [Score: ${sr.score}] id: ${sr.result.id} | artist: "${sr.result.artistName}" | title: "${sr.result.trackName}" | duration: ${sr.result.duration}s | synced: ${!!sr.result.syncedLyrics}\n`;
        });
      }

      let detailedMsg = `<code>${details}</code>`;
      if (detailedMsg.length > 3500) {
        detailedMsg = detailedMsg.substring(0, 3500) + '...\n(truncated)</code>';
      }

      await ctx.reply(detailedMsg, { parse_mode: 'HTML' });
    } catch (e) {
      await ctx.api.editMessageText(chatId, testMsg.message_id, `❌ Test error: ${htmlEscape(e.message)}`, { parse_mode: 'HTML' });
    }
    return;
  }

  // 5. Clear cache helper: /lyrics clearcache
  if (arg === 'clearcache') {
    if (!(await checkPermission())) {
      await ctx.reply(t(language, 'lyrics.adminOnly'));
      return;
    }

    if (!activeTrack) {
      await ctx.reply(t(language, 'lyrics.noActiveTrack'));
      return;
    }

    const cleared = clearLyricsCacheForTrack(activeTrack);
    if (cleared) {
      await ctx.reply(t(language, 'lyrics.cacheCleared'));
    } else {
      await ctx.reply(t(language, 'lyrics.noCache'));
    }
    return;
  }

  // 6. Refresh helper: /lyrics refresh
  if (arg === 'refresh') {
    if (!(await checkPermission())) {
      await ctx.reply(t(language, 'lyrics.adminOnly'));
      return;
    }

    if (!activeTrack) {
      await ctx.reply(t(language, 'lyrics.noActiveTrack'));
      return;
    }

    const infoMsg = await ctx.reply(t(language, 'lyrics.refreshing'));

    clearLyricsCacheForTrack(activeTrack);

    try {
      const result = await getLyrics(activeTrack);

      const runnerStatus = getLyricsStatus(chatId);
      if (runnerStatus.active) {
        stopLyricsForChat(chatId);
        await startLyricsForChat(chatId, ctx, activeTrack);
      }

      if (result) {
        let statusText = t(language, 'lyrics.notFound');
        if (result.synced) {
          statusText = t(language, 'lyrics.syncedAvailable');
        } else if (result.plainLyrics) {
          statusText = t(language, 'lyrics.plainOnly');
        }
        await ctx.api.editMessageText(chatId, infoMsg.message_id, `✅ ${t(language, 'lyrics.cacheCleared')}\n\n• ${t(language, 'lyrics.currentTrack')}: <i>${htmlEscape(activeTrack.title || activeTrack.name)}</i>\n• Hasil: <b>${statusText}</b>`, { parse_mode: 'HTML' });
      } else {
        await ctx.api.editMessageText(chatId, infoMsg.message_id, `❌ Gagal mengambil lirik baru.`);
      }
    } catch (e) {
      await ctx.api.editMessageText(chatId, infoMsg.message_id, `❌ Error: ${htmlEscape(e.message)}`, { parse_mode: 'HTML' });
    }
    return;
  }
}

// Callback query handlers
export async function lyricsOnCallbackHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  const activeTrack = voicePlayer.activeTrack(chatId);

  if (!(await checkLyricsPermission(ctx, activeTrack))) {
    await safeAnswerCallback(ctx, t(language, 'lyrics.permissionDenied'), { show_alert: true });
    return;
  }

  await setLyricsEnabled(chatId, true);

  if (activeTrack) {
    const cacheInfo = getLyricsCacheInfo(activeTrack);
    if (cacheInfo && !cacheInfo.isExpired && cacheInfo.item.synced) {
      await startLyricsForChat(chatId, ctx, activeTrack);
    }
  }

  await safeAnswerCallback(ctx, t(language, 'lyrics.enabled'));

  const text = await buildLyricsPanelText(ctx, language);
  const keyboard = lyricsPanelKeyboard(language, { hasActiveTrack: !!activeTrack });
  await editLyricsPanel(ctx, text, keyboard);
}

export async function lyricsOffCallbackHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  const activeTrack = voicePlayer.activeTrack(chatId);

  if (!(await checkLyricsPermission(ctx, activeTrack))) {
    await safeAnswerCallback(ctx, t(language, 'lyrics.permissionDenied'), { show_alert: true });
    return;
  }

  await setLyricsEnabled(chatId, false);
  stopLyricsForChat(chatId);

  await safeAnswerCallback(ctx, t(language, 'lyrics.disabled'));

  const text = await buildLyricsPanelText(ctx, language);
  const keyboard = lyricsPanelKeyboard(language, { hasActiveTrack: !!activeTrack });
  await editLyricsPanel(ctx, text, keyboard);
}

export async function lyricsRefreshCallbackHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  const activeTrack = voicePlayer.activeTrack(chatId);

  if (!(await checkLyricsPermission(ctx, activeTrack))) {
    await safeAnswerCallback(ctx, t(language, 'lyrics.permissionDenied'), { show_alert: true });
    return;
  }

  if (!activeTrack) {
    await safeAnswerCallback(ctx, t(language, 'lyrics.noActiveTrack'), { show_alert: true });
    const text = await buildLyricsPanelText(ctx, language);
    const keyboard = lyricsPanelKeyboard(language, { hasActiveTrack: false });
    await editLyricsPanel(ctx, text, keyboard);
    return;
  }

  await safeAnswerCallback(ctx, t(language, 'lyrics.refreshing'));

  const refreshingText = `🎤 <b>${t(language, 'lyrics.panelTitle')}</b>\n\n` +
    `🎵 <b>${t(language, 'lyrics.track')}:</b> ${htmlEscape(activeTrack.title || activeTrack.name)}\n` +
    `🔄 <i>${t(language, 'lyrics.refreshing')}</i>`;
  const keyboard = lyricsPanelKeyboard(language, { hasActiveTrack: true });
  await editLyricsPanel(ctx, refreshingText, keyboard);

  clearLyricsCacheForTrack(activeTrack);

  try {
    const result = await getLyrics(activeTrack);

    const isEnabled = await getLyricsEnabled(chatId);
    if (isEnabled && result?.synced) {
      stopLyricsForChat(chatId);
      await startLyricsForChat(chatId, ctx, activeTrack);
    }

    await safeAnswerCallback(ctx, t(language, 'lyrics.refreshDone'));
  } catch (e) {
    console.error('Lyrics refresh failed:', e);
    await safeAnswerCallback(ctx, `Error: ${e.message}`, { show_alert: true });
  }

  const text = await buildLyricsPanelText(ctx, language);
  await editLyricsPanel(ctx, text, keyboard);
}

export async function lyricsClearCacheCallbackHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  const activeTrack = voicePlayer.activeTrack(chatId);

  if (!(await checkLyricsPermission(ctx, activeTrack))) {
    await safeAnswerCallback(ctx, t(language, 'lyrics.permissionDenied'), { show_alert: true });
    return;
  }

  if (!activeTrack) {
    await safeAnswerCallback(ctx, t(language, 'lyrics.noActiveTrack'), { show_alert: true });
    const text = await buildLyricsPanelText(ctx, language);
    const keyboard = lyricsPanelKeyboard(language, { hasActiveTrack: false });
    await editLyricsPanel(ctx, text, keyboard);
    return;
  }

  clearLyricsCacheForTrack(activeTrack);

  await safeAnswerCallback(ctx, t(language, 'lyrics.cacheCleared'));

  const text = await buildLyricsPanelText(ctx, language);
  const keyboard = lyricsPanelKeyboard(language, { hasActiveTrack: true });
  await editLyricsPanel(ctx, text, keyboard);
}

export async function lyricsClearRefreshCallbackHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  const activeTrack = voicePlayer.activeTrack(chatId);

  if (!(await checkLyricsPermission(ctx, activeTrack))) {
    await safeAnswerCallback(ctx, t(language, 'lyrics.permissionDenied'), { show_alert: true });
    return;
  }

  if (!activeTrack) {
    await safeAnswerCallback(ctx, t(language, 'lyrics.noActiveTrack'), { show_alert: true });
    const text = await buildLyricsPanelText(ctx, language);
    const keyboard = lyricsPanelKeyboard(language, { hasActiveTrack: false });
    await editLyricsPanel(ctx, text, keyboard);
    return;
  }

  await safeAnswerCallback(ctx, t(language, 'lyrics.refreshing'));

  const refreshingText = `🎤 <b>${t(language, 'lyrics.panelTitle')}</b>\n\n` +
    `🎵 <b>${t(language, 'lyrics.track')}:</b> ${htmlEscape(activeTrack.title || activeTrack.name)}\n` +
    `🔄 <i>${t(language, 'lyrics.refreshing')}</i>`;
  const keyboard = lyricsPanelKeyboard(language, { hasActiveTrack: true });
  await editLyricsPanel(ctx, refreshingText, keyboard);

  clearLyricsCacheForTrack(activeTrack);

  try {
    const result = await getLyrics(activeTrack);

    const isEnabled = await getLyricsEnabled(chatId);
    if (isEnabled && result?.synced) {
      stopLyricsForChat(chatId);
      await startLyricsForChat(chatId, ctx, activeTrack);
    }

    await safeAnswerCallback(ctx, t(language, 'lyrics.refreshDone'));
  } catch (e) {
    console.error('Lyrics clear + refresh failed:', e);
    await safeAnswerCallback(ctx, `Error: ${e.message}`, { show_alert: true });
  }

  const text = await buildLyricsPanelText(ctx, language);
  await editLyricsPanel(ctx, text, keyboard);
}

export async function lyricsCloseCallbackHandler(ctx) {
  await deleteLyricsPanel(ctx);
  await safeAnswerCallback(ctx);
}
