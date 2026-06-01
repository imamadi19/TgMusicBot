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
import { getCachedLyrics, getLyricsCacheInfo, clearLyricsCacheForTrack, lyricsCacheKey } from '../core/lyrics/lyrics-cache.js';
import { normalizeLyricsMetadata } from '../core/lyrics/track-metadata.js';
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
    let lyricsAvailableText = t(language, 'lyrics.noCache');

    if (activeTrack) {
      currentTrackText = activeTrack.title || activeTrack.name || 'Unknown Track';

      // Enhanced cache info check to avoid calling getLyrics (which does slow fetches)
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
        // Trigger a background prefetch so subsequent status check has data
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

      // Construct detailed candidates, queries, and scored results message
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

    // Clear cache first
    clearLyricsCacheForTrack(activeTrack);

    try {
      const result = await getLyrics(activeTrack);

      // Restart lyrics runner if it is currently running to pick up refreshed lyrics
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

  // 7. Default lookup check (when no arguments are provided): /lyrics
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
