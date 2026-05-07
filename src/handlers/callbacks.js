import { chatCache } from '../core/cache/chat-cache.js';
import { Downloader } from '../core/dl/downloader.js';
import { addSongToPlaylist, createPlaylist, listPlaylists } from '../core/db/playlists.js';
import { getUserLanguage } from '../core/db/user-settings.js';
import { voicePlayer } from '../core/player/player.js';
import { config } from '../config/index.js';
import { t } from '../i18n/index.js';
import { adminModeCallback } from './filters.js';
import { controlKeyboard, progressLabel } from './keyboards.js';

function actionFromData(data = '') {
  return data.replace(/^(?:vcplay_|play_)/, '');
}

async function answer(ctx, text, { showAlert = true } = {}) {
  await ctx.answerCallbackQuery({ text, show_alert: showAlert }).catch(() => {});
}

async function editPlaybackControls(ctx, language, state = '', track = null) {
  const active = track ?? voicePlayer.activeTrack(ctx.chat.id) ?? chatCache.current(ctx.chat.id);
  const options = { reply_markup: controlKeyboard(language, state, active) };
  await ctx.editMessageReplyMarkup(options).catch(async () => {
    await ctx.api.editMessageReplyMarkup(ctx.chat.id, ctx.callbackQuery.message.message_id, options).catch(() => {});
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
    return;
  }

  try {
    switch (action) {
      case 'progress': {
        const activeTrack = voicePlayer.activeTrack(chatId) ?? currentTrack;
        await answer(ctx, progressLabel(activeTrack));
        await editPlaybackControls(ctx, language, '', activeTrack);
        return;
      }
      case 'skip': {
        const { skipped, next } = voicePlayer.skip(chatId);
        if (!skipped) {
          await answer(ctx, t(language, 'callbacks.noActivePlayback'));
          return;
        }
        if (!next) {
          await answer(ctx, t(language, 'callbacks.trackSkipped'));
          return;
        }
        const activeTrack = await startNextTrack(chatId, next);
        await answer(ctx, t(language, 'callbacks.trackSkipped'));
        await editPlaybackControls(ctx, language, '', activeTrack);
        return;
      }
      case 'stop': {
        if (!voicePlayer.stop(chatId)) {
          await answer(ctx, t(language, 'callbacks.noActivePlayback'));
          return;
        }
        await answer(ctx, t(language, 'callbacks.playbackStopped'));
        return;
      }
      case 'pause': {
        if (!voicePlayer.pause(chatId)) {
          await answer(ctx, t(language, 'callbacks.noActivePlayback'));
          return;
        }
        await answer(ctx, t(language, 'callbacks.playbackPaused'));
        await editPlaybackControls(ctx, language, 'pause');
        return;
      }
      case 'resume': {
        if (!voicePlayer.resume(chatId)) {
          await answer(ctx, t(language, 'callbacks.noActivePlayback'));
          return;
        }
        await answer(ctx, t(language, 'callbacks.playbackResumed'));
        await editPlaybackControls(ctx, language, 'resume');
        return;
      }
      case 'replay': {
        await ensureDownloaded(currentTrack);
        const activeTrack = await voicePlayer.play(chatId, { ...currentTrack });
        await answer(ctx, t(language, 'callbacks.playbackResumed'));
        await editPlaybackControls(ctx, language, '', activeTrack);
        return;
      }
      case 'mute': {
        chatCache.setMuted(chatId, true);
        await answer(ctx, t(language, 'callbacks.playbackMuted'));
        await editPlaybackControls(ctx, language, 'mute');
        return;
      }
      case 'unmute': {
        chatCache.setMuted(chatId, false);
        await answer(ctx, t(language, 'callbacks.playbackUnmuted'));
        await editPlaybackControls(ctx, language, 'unmute');
        return;
      }
      case 'add_to_list': {
        await addCurrentTrackToPlaylist(ctx, language, currentTrack);
        return;
      }
      default: {
        await editPlaybackControls(ctx, language, 'resume');
      }
    }
  } catch (error) {
    console.warn('Playback callback failed', error);
    await answer(ctx, t(language, 'callbacks.actionFailed'));
    await editPlaybackControls(ctx, language);
  }
}
