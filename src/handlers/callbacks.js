import { chatCache } from '../core/cache/chat-cache.js';
import { cleanupTrackDownload, cleanupTrackDownloads, ensureTrackDownloaded } from '../core/dl/queue-downloads.js';
import { addSongToPlaylist, createPlaylist, listPlaylists } from '../core/db/playlists.js';
import { getUserLanguage } from '../core/db/user-settings.js';
import { requesterKey, voicePlayer } from '../core/player/player.js';
import { config } from '../config/index.js';
import { t } from '../i18n/index.js';
import { controlKeyboard, progressLabel } from './keyboards.js';

const requesterOnlyActions = new Set(['skip', 'stop', 'pause', 'resume', 'replay', 'mute', 'unmute']);

function actionFromData(data = '') {
  return data.replace(/^(?:vcplay_|play_)/, '').split(':', 1)[0];
}

function isTrackRequester(ctx, track) {
  const requesterId = Number(track?.userId ?? track?.requesterId ?? track?.requestedById);
  if (!Number.isFinite(requesterId) || requesterId <= 0) return true;
  return requesterId === Number(ctx.from?.id);
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
  return ensureTrackDownloaded(track, Boolean(track.isVideo));
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

  const chatId = ctx.chat.id;
  const currentTrack = chatCache.current(chatId);
  if (!currentTrack) {
    await answer(ctx, t(language, 'callbacks.noActivePlayback'));
    return;
  }

  if (requesterOnlyActions.has(action) && !isTrackRequester(ctx, currentTrack)) {
    await answer(ctx, t(language, 'callbacks.requesterOnly'));
    return;
  }

  try {
    switch (action) {
      case 'progress': {
        const activeTrack = voicePlayer.activeTrack(chatId) ?? currentTrack;
        await answer(ctx, progressLabel(activeTrack), { showAlert: false });
        return;
      }
      case 'skip': {
        const queuedNext = chatCache.getQueue(chatId)[1] ?? null;
        if (queuedNext) await ensureDownloaded(queuedNext);
        const { skipped, next, activeTrack: reusedTrack } = await voicePlayer.skip(chatId, { reuseActive: true });
        if (!skipped) {
          await answer(ctx, t(language, 'callbacks.noActivePlayback'));
          return;
        }
        if (!next) {
          cleanupTrackDownload(skipped, { chatId });
          await answer(ctx, t(language, 'callbacks.trackSkipped'));
          return;
        }
        const activeTrack = reusedTrack ?? await startNextTrack(chatId, next);
        cleanupTrackDownload(skipped, { chatId });
        await answer(ctx, t(language, 'callbacks.trackSkipped'));
        await editPlaybackControls(ctx, language, '', activeTrack);
        return;
      }
      case 'stop': {
        const queue = chatCache.getQueue(chatId);
        const queuedCurrent = queue[0] ?? null;
        const queuedNext = queue[1] ?? null;
        const currentRequester = requesterKey(queuedCurrent);
        const nextRequester = requesterKey(queuedNext);
        if (queuedNext && currentRequester && nextRequester && currentRequester !== nextRequester) await ensureDownloaded(queuedNext);
        const { stopped, next, activeTrack: reusedTrack, cleared, hadPlayback } = await voicePlayer.stopOrAdvance(chatId, { reuseActive: true });
        if (cleared || !next) {
          if (!hadPlayback && !stopped) {
            await answer(ctx, t(language, 'callbacks.noActivePlayback'));
            return;
          }
          cleanupTrackDownloads(queue, { chatId });
          await answer(ctx, t(language, 'callbacks.playbackStopped'));
          return;
        }
        const activeTrack = reusedTrack ?? await startNextTrack(chatId, next);
        cleanupTrackDownload(stopped, { chatId });
        await answer(ctx, t(language, 'callbacks.trackSkipped'));
        await editPlaybackControls(ctx, language, '', activeTrack);
        return;
      }
      case 'pause': {
        if (!(await voicePlayer.pause(chatId))) {
          await answer(ctx, t(language, 'callbacks.noActivePlayback'));
          return;
        }
        await answer(ctx, t(language, 'callbacks.playbackPaused'));
        await editPlaybackControls(ctx, language, 'pause');
        return;
      }
      case 'resume': {
        if (!(await voicePlayer.resume(chatId))) {
          await answer(ctx, t(language, 'callbacks.noActivePlayback'));
          return;
        }
        await answer(ctx, t(language, 'callbacks.playbackResumed'));
        await editPlaybackControls(ctx, language, 'resume');
        return;
      }
      case 'replay': {
        await ensureDownloaded(currentTrack);
        const activeTrack = await voicePlayer.replay(chatId, currentTrack)
          ?? await voicePlayer.play(chatId, { ...currentTrack, startedAt: undefined });
        currentTrack.startedAt = activeTrack?.startedAt;
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
