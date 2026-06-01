/**
 * Command handler for /lyrics.
 */

import { commandArgs, htmlEscape } from '../utils/telegram.js';
import { getUserLanguage } from '../core/db/user-settings.js';
import { t } from '../i18n/index.js';
import { voicePlayer } from '../core/player/player.js';
import { getLyricsEnabled, setLyricsEnabled, getLyricsProvider } from '../core/db/chat-settings.js';
import { startLyricsForChat, stopLyricsForChat, getLyricsStatus } from '../core/lyrics/lyrics-runner.js';
import { getLyrics, prefetchLyrics } from '../core/lyrics/lrclib.js';
import { getCachedLyrics } from '../core/lyrics/lyrics-cache.js';
import { config } from '../config/index.js';
import { isUserAdminOrAuth } from './filters.js';
import { isPremiumActive } from '../core/db/premium.js';
import { secondsToClock } from '../utils/duration.js';

export async function lyricsHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const chatId = ctx.chat.id;
  const arg = commandArgs(ctx).trim().toLowerCase();

  // Permission validation helper
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
    let lyricsAvailableText = t(language, 'lyrics.notFound');

    if (activeTrack) {
      currentTrackText = activeTrack.title || activeTrack.name || 'Unknown Track';
      
      // Use cache-first approach to avoid slow fetches on status check
      const cachedResult = getCachedLyrics(activeTrack);
      if (cachedResult) {
        if (cachedResult.synced) {
          lyricsAvailableText = t(language, 'lyrics.syncedAvailable');
        } else if (cachedResult.plainLyrics) {
          lyricsAvailableText = t(language, 'lyrics.plainOnly');
        }
      } else {
        lyricsAvailableText = t(language, 'lyrics.waitingForCache');
        // Trigger a background prefetch so next status check has data
        prefetchLyrics(activeTrack).catch(() => {});
      }
    }

    const lastSentLine = runnerStatus.active && runnerStatus.lastSentText 
      ? `\n• Last line sent: <code>${htmlEscape(runnerStatus.lastSentText)}</code>` 
      : '';

    // Enhanced status with runner details
    let runnerDetails = '';
    if (runnerStatus.active) {
      runnerDetails = `\n• ${t(language, 'lyrics.currentPosition')}: <code>${secondsToClock(runnerStatus.currentPosition)}</code>` +
        `\n• ${t(language, 'lyrics.linesLoaded')}: <code>${runnerStatus.totalLines}</code>` +
        `\n• Line: <code>${runnerStatus.lastSentIndex + 1}/${runnerStatus.totalLines}</code>`;
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

    const testMsg = await ctx.reply(`🔍 [Test] Fetching lyrics for: <b>${htmlEscape(activeTrack.title || activeTrack.name)}</b>`, { parse_mode: 'HTML' });
    try {
      const lyricsResult = await getLyrics(activeTrack);
      if (!lyricsResult) {
        await ctx.api.editMessageText(chatId, testMsg.message_id, '❌ No lyrics found (null response)');
        return;
      }

      const details = `<b>[Test] Lyrics Result</b>\n` +
        `• Synced: <b>${lyricsResult.synced}</b>\n` +
        `• Lines: <b>${lyricsResult.lines?.length || 0}</b>\n` +
        `• Plain Lyrics: <b>${lyricsResult.plainLyrics ? 'Yes' : 'No'}</b>\n` +
        `• Source ID: <code>${lyricsResult.sourceId}</code>\n` +
        `• Cache Fetched At: <code>${new Date(lyricsResult.fetchedAt).toLocaleString()}</code>`;

      await ctx.api.editMessageText(chatId, testMsg.message_id, details, { parse_mode: 'HTML' });

      if (lyricsResult.lines?.length > 0) {
        const sampleLines = lyricsResult.lines.slice(0, 3).map(l => `[${l.time}s] ${l.text}`).join('\n');
        await ctx.reply(`<b>[Test] Sample lines:</b>\n<code>${htmlEscape(sampleLines)}</code>`, { parse_mode: 'HTML' });
      }
    } catch (e) {
      await ctx.api.editMessageText(chatId, testMsg.message_id, `❌ Test error: ${htmlEscape(e.message)}`, { parse_mode: 'HTML' });
    }
    return;
  }

  // 5. Default lookup check (when no arguments are provided): /lyrics
  if (!activeTrack) {
    await ctx.reply(t(language, 'lyrics.noActiveTrack'));
    return;
  }

  const checkMsg = await ctx.reply(t(language, 'lyrics.fetching'));
  try {
    const lyricsResult = await getLyrics(activeTrack);
    if (lyricsResult?.synced) {
      await ctx.api.editMessageText(chatId, checkMsg.message_id, t(language, 'lyrics.syncedAvailable'));
    } else {
      await ctx.api.editMessageText(chatId, checkMsg.message_id, t(language, 'lyrics.notFound'));
    }
  } catch (error) {
    await ctx.api.editMessageText(chatId, checkMsg.message_id, t(language, 'lyrics.error', { error: error.message }));
  }
}
