import { chatCache } from '../core/cache/chat-cache.js';
import { Downloader } from '../core/dl/downloader.js';
import { addSongToPlaylist, createPlaylist, listPlaylists } from '../core/db/playlists.js';
import { getUserLanguage } from '../core/db/user-settings.js';
import { voicePlayer } from '../core/player/player.js';
import { config } from '../config/index.js';
import { t } from '../i18n/index.js';
import { secondsToClock } from '../utils/duration.js';
import { htmlEscape } from '../utils/telegram.js';
import { adminModeCallback } from './filters.js';
import { controlKeyboard } from './keyboards.js';

function actionFromData(data = '') {
  return data.replace(/^(?:vcplay_|play_)/, '');
}

function callbackUserName(ctx) {
  return ctx.from?.first_name || ctx.from?.username || t('en', 'general.user');
}

function formatTrackStatus(language, track, statusKey, emoji = '▶') {
  const prefix = emoji ? `${emoji} ` : '';
  return `${prefix}${t(language, statusKey)}\n\n<b>${t(language, 'callbacks.track')}:</b> <a href="${htmlEscape(track.url)}">${htmlEscape(track.name)}</a>\n<b>${t(language, 'playback.duration')}:</b> ${secondsToClock(track.duration)}\n<b>${t(language, 'playback.requestedBy')}:</b> ${htmlEscape(track.user)}`;
}

async function answer(ctx, text) {
  await ctx.answerCallbackQuery({ text }).catch(() => {});
}

async function editPlaybackMessage(ctx, text, language, state = '') {
  await ctx.editMessageText(text, {
    parse_mode: 'HTML',
    reply_markup: controlKeyboard(language, state),
    disable_web_page_preview: true,
  }).catch(async () => {
    await ctx.api.editMessageText(ctx.chat.id, ctx.callbackQuery.message.message_id, text, {
      parse_mode: 'HTML',
      reply_markup: controlKeyboard(language, state),
      disable_web_page_preview: true,
    }).catch(() => {});
  });
}

async function ensureDownloaded(track) {
  if (track.filePath) return track.filePath;
  const downloader = new Downloader(track.url);
  track.filePath = await downloader.download(track, Boolean(track.isVideo));
  return track.filePath;
}

async function startNextTrack(chatId, next) {
  await ensureDownloaded(next);
  return voicePlayer.play(chatId, next);
}

async function addCurrentTrackToPlaylist(ctx, language, currentTrack) {
  let playlists = await listPlaylists(ctx.from.id);
  let playlist = playlists[0];

  if (!playlist) {
    playlist = await createPlaylist(ctx.from.id, t(language, 'callbacks.defaultPlaylistName'));
    playlists = [playlist];
  }

  const song = {
    url: currentTrack.url,
    name: currentTrack.name,
    trackId: currentTrack.trackId,
    duration: currentTrack.duration,
    platform: currentTrack.platform ?? config.defaultService,
  };

  const updated = await addSongToPlaylist(ctx.from.id, playlist.playlistId, song);
  if (!updated) throw new Error('playlist not found');

  await answer(ctx, t(language, 'callbacks.addedToPlaylist', { song: song.name, playlist: playlists[0].name }));
}

export async function vcPlayCallbackHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const data = ctx.callbackQuery?.data ?? '';

  if (data.includes('settings_')) {
    await answer(ctx, t(language, 'callbacks.settingsIgnored'));
    return;
  }

  const action = actionFromData(data);
  if (action === 'close') {
    await answer(ctx, t(language, 'callbacks.closingPanel'));
    await ctx.deleteMessage().catch(() => {});
    return;
  }

  if (!(await adminModeCallback(ctx))) {
    await answer(ctx, t(language, 'auth.adminOnly'));
    return;
  }

  const chatId = ctx.chat.id;
  const currentTrack = chatCache.current(chatId);
  if (!currentTrack) {
    await answer(ctx, t(language, 'callbacks.noActivePlayback'));
    await editPlaybackMessage(ctx, t(language, 'callbacks.noActivePlayback'), language);
    return;
  }

  const userName = htmlEscape(callbackUserName(ctx));

  try {
    switch (action) {
      case 'skip': {
        const { skipped, next } = voicePlayer.skip(chatId);
        if (!skipped) {
          await answer(ctx, t(language, 'callbacks.noActivePlayback'));
          return;
        }
        if (!next) {
          await answer(ctx, t(language, 'callbacks.trackSkipped'));
          await ctx.deleteMessage().catch(() => {});
          return;
        }
        await startNextTrack(chatId, next);
        await answer(ctx, t(language, 'callbacks.trackSkipped'));
        await ctx.deleteMessage().catch(() => {});
        return;
      }
      case 'stop': {
        voicePlayer.stop(chatId);
        await answer(ctx, t(language, 'callbacks.playbackStopped'));
        await editPlaybackMessage(ctx, `${t(language, 'callbacks.playbackStopped')}\n${t(language, 'callbacks.requestedBy', { user: userName })}`, language);
        return;
      }
      case 'pause': {
        voicePlayer.pause(chatId);
        await answer(ctx, t(language, 'callbacks.playbackPaused'));
        const text = `${formatTrackStatus(language, currentTrack, 'callbacks.paused', '⏸')}\n\n${t(language, 'callbacks.pausedBy', { user: userName })}`;
        await editPlaybackMessage(ctx, text, language, 'pause');
        return;
      }
      case 'resume': {
        voicePlayer.resume(chatId);
        await answer(ctx, t(language, 'callbacks.playbackResumed'));
        const text = `${formatTrackStatus(language, currentTrack, 'callbacks.nowPlaying', '▶')}\n\n${t(language, 'callbacks.resumedBy', { user: userName })}`;
        await editPlaybackMessage(ctx, text, language, 'resume');
        return;
      }
      case 'mute': {
        chatCache.setMuted(chatId, true);
        await answer(ctx, t(language, 'callbacks.playbackMuted'));
        const text = `${formatTrackStatus(language, currentTrack, 'callbacks.muted', '')}\n\n${t(language, 'callbacks.mutedBy', { user: userName })}`;
        await editPlaybackMessage(ctx, text, language, 'mute');
        return;
      }
      case 'unmute': {
        chatCache.setMuted(chatId, false);
        await answer(ctx, t(language, 'callbacks.playbackUnmuted'));
        const text = `${formatTrackStatus(language, currentTrack, 'callbacks.nowPlaying', '▶')}\n\n${t(language, 'callbacks.unmutedBy', { user: userName })}`;
        await editPlaybackMessage(ctx, text, language, 'unmute');
        return;
      }
      case 'add_to_list': {
        await addCurrentTrackToPlaylist(ctx, language, currentTrack);
        return;
      }
      default: {
        const text = formatTrackStatus(language, currentTrack, 'callbacks.nowPlaying', '▶');
        await editPlaybackMessage(ctx, text, language, 'resume');
      }
    }
  } catch (error) {
    console.warn('Playback callback failed', error);
    await answer(ctx, t(language, 'callbacks.actionFailed'));
    await editPlaybackMessage(ctx, t(language, 'callbacks.actionFailed'), language);
  }
}
