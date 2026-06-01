import { chatCache } from '../core/cache/chat-cache.js';
import { Downloader } from '../core/dl/downloader.js';
import { cleanupTrackDownload, cleanupTrackDownloads, ensureTrackDownloaded, preloadTrack, preloadTracks } from '../core/dl/queue-downloads.js';
import { requesterKey, voicePlayer } from '../core/player/player.js';
import { getPlaylist } from '../core/db/playlists.js';
import { searchCache } from '../core/cache/search-cache.js';
import { InlineKeyboard } from 'grammy';
import { isPremiumActive } from '../core/db/premium.js';
import { getQueueLimitForContext } from './premium.js';
import { getPremiumSettings } from '../core/db/premium-settings.js';
import { getUserDefaultService, getUserLanguage } from '../core/db/user-settings.js';
import { config } from '../config/index.js';
import { t } from '../i18n/index.js';
import { commandArgs, htmlEscape, isUrl } from '../utils/telegram.js';
import { firstName } from '../utils/extras.js';
import { secondsToClock } from '../utils/duration.js';
import { completedProgressKeyboard, controlKeyboard, supportKeyboard, searchSelectionKeyboard } from './keyboards.js';
import { playMode, isUserAdminOrAuth, enforceDjModeControl } from './filters.js';
import { isAuthUser } from '../core/db/auth.js';
import { getLyricsEnabled } from '../core/db/chat-settings.js';
import { startLyricsForChatIfEnabled, stopLyricsForChat, resyncLyricsForChat, sameTrackLoose } from '../core/lyrics/lyrics-runner.js';
import { prefetchLyrics } from '../core/lyrics/lyrics-service.js';

const MAX_QUEUE = 10;
const ASSISTANT_INVITE_EXPIRE_SECONDS = 60 * 60;
const PROGRESS_UPDATE_INTERVAL_MS = 10000;
const PANEL_EDIT_MIN_INTERVAL_MS = 1200;

const progressUpdaters = new Map();
const playbackPanels = new Map();
const chatTasks = new Map();
const panelEditTasks = new Map();
const panelEditLastAt = new Map();
const recentPlayRequests = new Map();
const FREE_PLAY_COOLDOWN_MS = 5000;

const progressUpdateRunning = new Map();
const progressPauseUntil = new Map();
const lyricsRetryState = new Map();
const lyricsPrefetchTasks = new Map();

function appendUniqueInviteLink(links, link) {
  const value = String(link ?? '').trim();
  if (value && !links.includes(value)) links.push(value);
}


function enqueueChatTask(chatId, label, task) {
  const key = String(chatId);
  const previous = chatTasks.get(key) ?? Promise.resolve();
  const next = previous
    .catch(() => {})
    .then(task)
    .catch((error) => console.warn(`${label} gagal untuk chat ${key}`, error))
    .finally(() => {
      if (chatTasks.get(key) === next) chatTasks.delete(key);
    });
  chatTasks.set(key, next);
  return next;
}

async function ensureDownloaded(track, isVideo) {
  return ensureTrackDownloaded(track, isVideo);
}

export async function createAssistantInviteLinks(ctx) {
  const links = [];

  try {
    const expireDate = Math.floor(Date.now() / 1000) + ASSISTANT_INVITE_EXPIRE_SECONDS;
    const invite = await ctx.api.createChatInviteLink(ctx.chat.id, {
      name: 'TgMusicBot assistant auto-join',
      expire_date: expireDate,
    });
    appendUniqueInviteLink(links, invite.invite_link);
  } catch (error) {
    console.warn(`Failed to create assistant invite link for chat ${ctx.chat?.id}`, error);
  }

  try {
    const chat = await ctx.api.getChat(ctx.chat.id);
    appendUniqueInviteLink(links, chat?.invite_link);
    if (chat?.username) appendUniqueInviteLink(links, `https://t.me/${chat.username}`);
  } catch (error) {
    console.warn(`Failed to fetch fallback group invite link for chat ${ctx.chat?.id}`, error);
  }

  return links;
}

async function startQueuedTrack(ctx, track, isVideo) {
  await ensureDownloaded(track, isVideo);
  return voicePlayer.play(ctx.chat.id, track, { inviteLinks: await createAssistantInviteLinks(ctx) });
}

async function startCachedTrack(chatId, track) {
  await ensureDownloaded(track, Boolean(track.isVideo));
  return voicePlayer.play(chatId, track, { reuseActive: true });
}

function stopProgressUpdater(chatId) {
  const key = String(chatId);
  const timer = progressUpdaters.get(key);
  if (timer) clearInterval(timer);
  progressUpdaters.delete(key);
}

function panelKey(chatId, track) {
  return `${String(chatId)}:${String(track?.trackId ?? track?.url ?? track?.name ?? '')}`;
}

function panelMessageKey(panel) {
  return `${String(panel?.chatId ?? '')}:${String(panel?.messageId ?? '')}`;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterSeconds(error) {
  const retryAfter = Number(error?.parameters?.retry_after);
  if (Number.isFinite(retryAfter) && retryAfter > 0) return retryAfter;
  const description = String(error?.description ?? error?.message ?? '');
  const matched = description.match(/retry after\s+(\d+)/i);
  return matched ? Number(matched[1]) : 0;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTelegramRetry(label, task, maxRetries = 2, chatId = '') {
  let attempts = 0;
  while (true) {
    try {
      return await task();
    } catch (error) {
      const retryAfter = parseRetryAfterSeconds(error);
      const isRateLimit = retryAfter > 0 || error.code === 429 || String(error.message).includes('retry after') || String(error.description).includes('retry after');
      
      if (isRateLimit) {
        const actualRetryAfter = retryAfter > 0 ? retryAfter : 5;
        console.log(`[playback] Telegram rate limited ${label} chat=${chatId} retryAfter=${actualRetryAfter}s`);
        
        if (attempts < maxRetries) {
          attempts++;
          const waitMs = actualRetryAfter * 1000 + 250;
          await sleep(waitMs);
          continue;
        }
      }
      throw error;
    }
  }
}

function enqueuePanelEdit(panel, task) {
  const key = panelMessageKey(panel);
  if (!key || !panel?.messageId) return task();
  const previous = panelEditTasks.get(key) ?? Promise.resolve();
  const next = previous
    .catch(() => {})
    .then(async () => {
      const lastAt = panelEditLastAt.get(key) ?? 0;
      const waitMs = Math.max(0, PANEL_EDIT_MIN_INTERVAL_MS - (Date.now() - lastAt));
      if (waitMs > 0) await delay(waitMs);
      const result = await task();
      panelEditLastAt.set(key, Date.now());
      return result;
    })
    .finally(() => {
      if (panelEditTasks.get(key) === next) panelEditTasks.delete(key);
    });
  panelEditTasks.set(key, next);
  return next;
}

export function rememberPlaybackPanel(ctx, message, language, track) {
  const chatId = ctx.chat?.id;
  if (!chatId || !message?.message_id || !track) return;
  playbackPanels.set(panelKey(chatId, track), {
    api: ctx.api,
    chatId,
    messageId: message.message_id,
    language,
    track,
    prefersCaption: Boolean(message.photo?.length || message.video || message.audio || message.document || message.animation),
  });
}

function forgetPlaybackPanel(chatId, track) {
  playbackPanels.delete(panelKey(chatId, track));
}

async function editPanelMarkup(panel, replyMarkup) {
  if (!panel?.api || !panel?.messageId) return false;
  return enqueuePanelEdit(panel, async () => {
    try {
      await withTelegramRetry('editPanelMarkup', () =>
        panel.api.editMessageReplyMarkup(panel.chatId, panel.messageId, { reply_markup: replyMarkup })
      , 2, panel.chatId);
      return true;
    } catch (error) {
      const description = String(error?.description ?? error?.message ?? error).toLowerCase();
      if (description.includes('message is not modified')) return true;
      if (!String(error.message).includes('retry after') && !String(error.description).includes('retry after')) {
        console.warn(`Failed to edit playback controls for chat ${panel.chatId}`, error);
      }
      return false;
    }
  });
}

async function setPlaybackPanelState(chatId, track, state = 'playing', { activeTrack = null, completed = false } = {}) {
  const panel = playbackPanels.get(panelKey(chatId, track));
  if (!panel) return false;
  panel.track = track;
  const replyMarkup = (completed || state === 'stopped')
    ? completedProgressKeyboard(track)
    : controlKeyboard(panel.language, state, activeTrack ?? track);
  const edited = await editPanelTextAndMarkup(panel, formatTrack(panel.language, track, 1, state), replyMarkup);
  if (completed) forgetPlaybackPanel(chatId, track);
  return edited;
}

async function markPlaybackPanelCompleted(chatId, track, withText = false) {
  if (withText) return setPlaybackPanelState(chatId, track, 'completed', { completed: true });
  const panel = playbackPanels.get(panelKey(chatId, track));
  if (!panel) return false;
  const edited = await editPanelMarkup(panel, completedProgressKeyboard(track));
  forgetPlaybackPanel(chatId, track);
  return edited;
}

export async function markPlaybackPanelStatus(chatId, track, state = 'playing', activeTrack = null) {
  return setPlaybackPanelState(chatId, track, state, { activeTrack });
}

async function activatePlaybackPanel(chatId, track, activeTrack) {
  const panel = playbackPanels.get(panelKey(chatId, track));
  if (!panel) return false;
  const text = formatTrack(panel.language, track, 1, 'playing');
  const replyMarkup = controlKeyboard(panel.language, '', activeTrack);
  const thumbnail = youtubeThumbnail(track);

  const deleteOldPanel = async () => {
    if (panel.messageId && typeof panel.api.deleteMessage === 'function') {
      try {
        await withTelegramRetry('deleteMessage', () => panel.api.deleteMessage(panel.chatId, panel.messageId), 2, panel.chatId);
      } catch (error) {
        const desc = String(error?.description ?? error?.message ?? '').toLowerCase();
        if (!desc.includes('message to delete not found') && !desc.includes('message can\'t be deleted')) {
          console.warn(`Failed to delete old playback panel for chat ${panel.chatId}: ${error.message}`);
        }
      }
    }
  };

  const sendNewPanel = async () => {
    return await withTelegramRetry('sendPlaybackPanel', () => {
      return thumbnail
        ? panel.api.sendPhoto(panel.chatId, thumbnail, {
          caption: String(text).slice(0, 1024),
          parse_mode: 'HTML',
          reply_markup: replyMarkup,
        })
        : panel.api.sendMessage(panel.chatId, text, {
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          reply_markup: replyMarkup,
        });
    }, 2, panel.chatId);
  };

  const sentMessage = await sendNewPanel().catch((error) => {
    if (!String(error.message).includes('retry after') && !String(error.description).includes('retry after')) {
      console.warn(`Failed to send new playback panel for chat ${panel.chatId}`, error);
    }
    return null;
  });

  if (!sentMessage?.message_id) return false;

  await deleteOldPanel();

  const oldKey = panelKey(chatId, track);
  playbackPanels.set(oldKey, {
    ...panel,
    messageId: sentMessage.message_id,
    track,
    prefersCaption: Boolean(sentMessage.photo?.length),
  });
  startProgressUpdater({ chat: { id: panel.chatId }, api: panel.api }, { message_id: sentMessage.message_id }, panel.language);
  return true;
}

async function editPanelTextAndMarkup(panel, text, replyMarkup) {
  if (!panel?.api || !panel?.messageId) return false;
  const safeText = String(text ?? '').slice(0, 4096);
  const safeCaption = safeText.slice(0, 1024);

  const editText = () => panel.api.editMessageText(panel.chatId, panel.messageId, safeText, {
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
    disable_web_page_preview: true,
  });
  const editCaption = () => panel.api.editMessageCaption(panel.chatId, panel.messageId, {
    caption: safeCaption,
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
  });

  return enqueuePanelEdit(panel, async () => {
    try {
      if (panel.prefersCaption) {
        await withTelegramRetry('editCaption', editCaption, 2, panel.chatId);
      } else {
        await withTelegramRetry('editText', editText, 2, panel.chatId);
      }
      return true;
    } catch (error) {
      const description = String(error?.description ?? error?.message ?? error).toLowerCase();
      if (description.includes('message is not modified')) return true;

      try {
        if (panel.prefersCaption || description.includes('there is no text in the message')) {
          await withTelegramRetry('editCaptionFallback', editCaption, 2, panel.chatId);
          panel.prefersCaption = true;
        } else {
          await withTelegramRetry('editTextFallback', editText, 2, panel.chatId);
          panel.prefersCaption = false;
        }
        return true;
      } catch (fallbackError) {
        const fallbackDescription = String(fallbackError?.description ?? fallbackError?.message ?? fallbackError).toLowerCase();
        if (fallbackDescription.includes('message is not modified')) return true;
        if (!String(fallbackError.message).includes('retry after') && !String(fallbackError.description).includes('retry after')) {
          console.warn(`Failed to edit playback panel for chat ${panel.chatId}`, {
            primaryError: error.message,
            fallbackError: fallbackError.message,
          });
        }
        return false;
      }
    }
  });
}

export async function updatePlaybackPanelsForAdvance(chatId, finished, next, activeTrack) {
  const completed = await markPlaybackPanelCompleted(chatId, finished, !next);
  if (!next) {
    stopProgressUpdater(chatId);
    return { completed, activated: false };
  }
  const activated = await activatePlaybackPanel(chatId, next, activeTrack);
  return { completed, activated };
}

function startProgressUpdaterFromPanel(panel) {
  if (!panel?.api || !panel?.messageId) return;
  startProgressUpdater({ chat: { id: panel.chatId }, api: panel.api }, { message_id: panel.messageId }, panel.language);
}

function startProgressUpdater(ctx, message, language) {
  const chatId = ctx.chat?.id;
  if (!chatId || !message?.message_id) return;
  const key = String(chatId);
  stopProgressUpdater(key);

  const timer = setInterval(async () => {
    const pauseUntil = progressPauseUntil.get(key) ?? 0;
    if (Date.now() < pauseUntil) {
      return;
    }

    if (progressUpdateRunning.get(key)) {
      return;
    }

    const activeTrack = voicePlayer.activeTrack(key);
    if (!activeTrack) {
      if (chatCache.getQueueLength(key) === 0) stopProgressUpdater(key);
      return;
    }
    if (chatCache.isPaused(key)) return;

    const pKey = panelKey(chatId, activeTrack);
    const panel = playbackPanels.get(pKey);
    if (panel) {
      const msgKey = panelMessageKey(panel);
      const lastAt = panelEditLastAt.get(msgKey) ?? 0;
      if (Date.now() - lastAt < PANEL_EDIT_MIN_INTERVAL_MS) {
        return;
      }
    }

    progressUpdateRunning.set(key, true);

    try {
      await withTelegramRetry('progressUpdate', async () => {
        await ctx.api.editMessageReplyMarkup(chatId, message.message_id, {
          reply_markup: controlKeyboard(language, '', activeTrack),
        });
      }, 1, chatId);
    } catch (error) {
      const retryAfter = parseRetryAfterSeconds(error);
      const isRateLimit = retryAfter > 0 || error.code === 429 || String(error.message).includes('retry after') || String(error.description).includes('retry after');
      
      if (isRateLimit) {
        const actualRetryAfter = retryAfter > 0 ? retryAfter : 5;
        progressPauseUntil.set(key, Date.now() + (actualRetryAfter * 1000));
        await sleep(actualRetryAfter * 1000);
      } else {
        const description = String(error?.description ?? error?.message ?? error).toLowerCase();
        if (!description.includes('message is not modified')) {
          console.warn(`Failed to refresh playback progress for chat ${key}`, error);
        }
      }
    } finally {
      progressUpdateRunning.set(key, false);
    }
  }, PROGRESS_UPDATE_INTERVAL_MS);

  timer.unref?.();
  progressUpdaters.set(key, timer);
}

function prepareAssistantJoin(ctx) {
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  if (voicePlayer.activeTrack(chatId) || chatCache.getQueueLength(chatId) > 0) return;
  createAssistantInviteLinks(ctx)
    .then((inviteLinks) => voicePlayer.joinChat(chatId, { inviteLinks }))
    .catch((error) => console.warn(`Assistant gagal join awal untuk chat ${chatId}`, error));
}

function cleanupInactiveChatDownloads() {
  for (const { chatId, queue } of chatCache.chats()) {
    if (!queue?.length) continue;
    if (voicePlayer.activeTrack(chatId)) continue;
    cleanupTrackDownloads(queue, { chatId });
  }
}

function markPlayRequest(chatId, userId) {
  recentPlayRequests.set(`${chatId}:${userId}`, Date.now());
}

function getPlayCooldownLeft(chatId, userId) {
  const last = recentPlayRequests.get(`${chatId}:${userId}`) ?? 0;
  return Math.max(0, FREE_PLAY_COOLDOWN_MS - (Date.now() - last));
}

async function queueLimitFor(ctx) {
  return getQueueLimitForContext(ctx);
}

async function isPremiumRequester(ctx) {
  const [chatPremium, userPremium] = await Promise.all([
    isPremiumActive('chat', Number(ctx.chat?.id)),
    isPremiumActive('user', Number(ctx.from?.id)),
  ]);
  return chatPremium || userPremium;
}

async function checkDjMode(ctx) {
  return enforceDjModeControl(ctx);
}

export function startLyricsAuto(chatId, api, track, reason = 'unknown') {
  if (!track) return;
  startLyricsForChatIfEnabled(chatId, api, track, { silent: true, reason })
    .then((result) => {
      if (!result?.success) {
        const errType = result?.error || result?.message;
        const retryableErrors = ['timeout', 'providerError', 'apiUnavailable', 'rateLimited', 'error', 'network'];
        if (retryableErrors.includes(errType)) {
          scheduleLyricsAutoRetry(chatId, api, track, reason, errType);
        }
      }
    })
    .catch((error) => {
      scheduleLyricsAutoRetry(chatId, api, track, reason, error?.message || 'unknown');
    });
}

function scheduleLyricsAutoRetry(chatId, api, track, reason, lastMessage) {
  const key = String(chatId);
  const state = lyricsRetryState.get(key) || { trackId: track.trackId || track.name, attempts: 0 };
  
  const currentTrackId = track.trackId || track.name;
  if (state.trackId !== currentTrackId) {
    state.trackId = currentTrackId;
    state.attempts = 0;
  }
  
  if (state.attempts >= 2) {
    if (config.lyricsDebug) {
      console.log(`[lyrics] auto-next lyrics retry limit reached (2) for chat=${chatId}`);
    }
    lyricsRetryState.delete(key);
    return;
  }
  
  state.attempts++;
  
  const delayMs = state.attempts === 1 ? 5000 : 12000;
  
  console.log(`[lyrics] auto-next lyrics retry scheduled reason=${lastMessage} delay=${delayMs}ms attempt=${state.attempts} chat=${chatId}`);
  
  if (state.timeoutId) {
    clearTimeout(state.timeoutId);
  }
  
  state.timeoutId = setTimeout(async () => {
    try {
      const enabled = await getLyricsEnabled(chatId);
      if (!enabled) {
        if (config.lyricsDebug) {
          console.log(`[lyrics] retry cancelled, lyrics disabled for chat=${chatId}`);
        }
        lyricsRetryState.delete(key);
        return;
      }
      
      const activeTrack = voicePlayer.activeTrack(chatId);
      if (!activeTrack || !sameTrackLoose(activeTrack, track)) {
        if (config.lyricsDebug) {
          console.log(`[lyrics] retry cancelled, active track changed or no active track for chat=${chatId}`);
        }
        lyricsRetryState.delete(key);
        return;
      }
      
      startLyricsForChatIfEnabled(chatId, api, track, { silent: true, reason })
        .then(result => {
          if (!result?.success) {
            const errType = result?.error || result?.message;
            const retryableErrors = ['timeout', 'providerError', 'apiUnavailable', 'rateLimited', 'error', 'network'];
            if (retryableErrors.includes(errType)) {
              scheduleLyricsAutoRetry(chatId, api, track, reason, errType);
            } else {
              lyricsRetryState.delete(key);
            }
          } else {
            lyricsRetryState.delete(key);
          }
        })
        .catch(error => {
          scheduleLyricsAutoRetry(chatId, api, track, reason, error.message);
        });
    } catch (err) {
      console.warn(`[lyrics] retry error for chat=${chatId}:`, err);
      lyricsRetryState.delete(key);
    }
  }, delayMs);
  
  lyricsRetryState.set(key, state);
}

function scheduleLyricsPrefetch(chatId, track) {
  const key = String(chatId);
  const state = lyricsPrefetchTasks.get(key) || { running: false, nextTrack: null };
  
  if (state.running) {
    state.nextTrack = track;
    lyricsPrefetchTasks.set(key, state);
    return;
  }
  
  state.running = true;
  lyricsPrefetchTasks.set(key, state);
  
  const runPrefetch = async (currentTrack) => {
    try {
      if (config.lyricsDebug) {
        console.log(`[lyrics] prefetch running for chat=${chatId} track=${currentTrack?.name || currentTrack?.title}`);
      }
      await prefetchLyrics(currentTrack);
    } catch (error) {
      if (config.lyricsDebug) {
        console.error(`[lyrics] prefetch failed for track ${currentTrack?.name || currentTrack?.title}:`, error);
      }
    } finally {
      const currentState = lyricsPrefetchTasks.get(key);
      if (currentState && currentState.nextTrack) {
        const next = currentState.nextTrack;
        currentState.nextTrack = null;
        runPrefetch(next);
      } else {
        if (currentState) {
          currentState.running = false;
        }
      }
    }
  };
  
  runPrefetch(track);
}

async function shouldPrefetchLyrics(chatId) {
  if (!config.lyricsPrefetch) return false;
  if (!config.lyricsPrefetchOnlyWhenEnabled) return true;
  return await getLyricsEnabled(chatId);
}

function maybePrefetchLyrics(chatId, track) {
  shouldPrefetchLyrics(chatId)
    .then((should) => {
      if (!should || !track) return;
      scheduleLyricsPrefetch(chatId, track);
    })
    .catch((err) => {
      if (config.lyricsDebug) {
        console.error(`[lyrics] shouldPrefetchLyrics error:`, err);
      }
    });
}

export function prefetchNextLyrics(chatId) {
  shouldPrefetchLyrics(chatId)
    .then((should) => {
      if (!should) return;
      const queue = chatCache.getQueue(chatId);
      const next = queue?.[1];
      if (next) {
        scheduleLyricsPrefetch(chatId, next);
      }
    })
    .catch((err) => {
      if (config.lyricsDebug) {
        console.error(`[lyrics] prefetchNextLyrics shouldPrefetch check error:`, err);
      }
    });
}

voicePlayer.onTrackEnd(async ({ chatId, finished, next }) => {
  if (!next) {
    stopLyricsForChat(chatId, 'queue-ended');
    await updatePlaybackPanelsForAdvance(chatId, finished, null, null);
    cleanupTrackDownload(finished, { chatId });
    return;
  }

  stopLyricsForChat(chatId, 'track-end');

  try {
    const activeTrack = await startCachedTrack(chatId, next);
    next.startedAt = activeTrack?.startedAt;

    const panelUpdatePromise = updatePlaybackPanelsForAdvance(chatId, finished, next, activeTrack).catch((err) => {
      console.warn(`[playback] panel update failed for auto-next in chat ${chatId}:`, err.message);
    });

    const lyricsTrack = activeTrack 
      ? { 
          ...next, 
          ...activeTrack, 
          title: activeTrack.title || activeTrack.name || next.title || next.name,
          name: activeTrack.name || activeTrack.title || next.name || next.title,
          url: activeTrack.url || activeTrack.sourceUrl || next.url || next.sourceUrl,
          user: next.user, 
          userId: next.userId 
        } 
      : next;

    startLyricsAuto(chatId, null, lyricsTrack, 'auto-next');

    prefetchNextLyrics(chatId);

    await panelUpdatePromise;

    if (finished?.trackId !== next?.trackId) cleanupTrackDownload(finished, { chatId });
  } catch (error) {
    stopLyricsForChat(chatId, 'auto-next-error');
    const failedNext = chatCache.shift(chatId);
    cleanupTrackDownload(failedNext, { chatId });
    if (chatCache.getQueueLength(chatId) === 0) {
      stopProgressUpdater(chatId);
      voicePlayer.stop(chatId);
    }
    console.warn(`Failed to auto-start next track for chat ${chatId}`, error);
  }
});

function formatError(error, language = 'en') {
  const raw = String(error?.message ?? error ?? 'Unknown error').replace(/\s+/g, ' ').trim();
  if (raw.startsWith('PLATFORM_DOWNLOADER_NOT_CONFIGURED:spotify')) return htmlEscape(t(language, 'playback.spotifyDownloaderNotConfigured'));
  if (raw.startsWith('PLATFORM_DOWNLOADER_NOT_CONFIGURED:apple_music')) return htmlEscape(t(language, 'playback.appleMusicDownloaderNotConfigured'));
  const shortened = raw.length > 280 ? `${raw.slice(0, 277)}...` : raw;
  return htmlEscape(shortened);
}


function isVoiceChatInactiveError(error) {
  const message = String(error?.message ?? error).toLowerCase();
  return [
    'no active group call',
    'groupcallnotmodified',
    'voice_adapter_error: the userbot is not in a call',
    'userbot is not in a call',
    'not in a call',
    'voice/video chat grup belum aktif',
    'voice call belum aktif',
  ].some((marker) => message.includes(marker));
}

function playbackHeading(language, state = 'playing', queueLength = 1) {
  if (queueLength > 1) return t(language, 'playback.addedToQueue', { count: queueLength });
  const fromKey = (key, fallback) => {
    const value = t(language, key);
    return value === key ? fallback : value;
  };
  if (state === 'paused') return fromKey('callbacks.paused', 'Paused');
  if (state === 'completed') return fromKey('playback.queueEnded', 'Music finished');
  if (state === 'stopped') return fromKey('callbacks.playbackStopped', 'Music stopped');
  if (state === 'skipped') return fromKey('callbacks.trackSkipped', 'Music skipped');
  return `${t(language, 'playback.nowPlaying')}.`;
}

function formatTrack(language, track, queueLength = 1, state = 'playing') {
  if (track?.platform === 'Spotify' || track?.sourceType === 'spotify') {
    return `🟢 <b>${t(language, 'playback.spotifyNowPlaying')}</b>\n\n🎵 <a href="${htmlEscape(track.displayUrl || track.sourceUrl || track.url)}">${htmlEscape(track.name)}</a>\n${track.artist ? `👤 ${htmlEscape(track.artist)}\n` : ''}${track.album ? `💿 ${htmlEscape(track.album)}\n` : ''}⏱ ${secondsToClock(track.duration)}\n🙋 ${t(language, 'playback.requestedBy')}: ${htmlEscape(track.user)}`;
  }
  if (track?.platform === 'Apple Music' || track?.sourceType === 'apple_music') {
    return `🍎 <b>${t(language, 'playback.appleMusicNowPlaying')}</b>\n\n🎵 <a href="${htmlEscape(track.displayUrl || track.sourceUrl || track.url)}">${htmlEscape(track.name)}</a>\n👤 ${htmlEscape(track.artist || '-')}\n${track.album ? `💿 ${htmlEscape(track.album)}\n` : ''}⏱ ${secondsToClock(track.duration)}\n🙋 ${t(language, 'playback.requestedBy')}: ${htmlEscape(track.user)}`;
  }
  if (track?.platform === 'SoundCloud' || track?.sourceType === 'soundcloud') {
    return `🟠 <b>${t(language, 'playback.soundcloudNowPlaying')}</b>\n\n🎵 <a href="${htmlEscape(track.displayUrl || track.sourceUrl || track.url)}">${htmlEscape(track.name)}</a>\n${track.artist ? `👤 ${htmlEscape(track.artist)}\n` : ''}⏱ ${secondsToClock(track.duration)}\n🙋 ${t(language, 'playback.requestedBy')}: ${htmlEscape(track.user)}`;
  }
  const heading = playbackHeading(language, state, queueLength);
  const preset = track.audioPreset ? `\n<b>Preset:</b> ${htmlEscape(track.audioPreset)}` : '';
  return `<u><b>${heading}</b></u>\n\n<b>${t(language, 'playback.title')}:</b> <a href="${htmlEscape(track.url)}">${htmlEscape(track.name)}</a>\n\n<b>${t(language, 'playback.duration')}:</b> ${secondsToClock(track.duration)}\n<b>${t(language, 'playback.requestedBy')}:</b> ${htmlEscape(track.user)}${preset}`;
}

function captionEditOptions(text, options = {}) {
  const { disable_web_page_preview: _disableWebPagePreview, link_preview_options: _linkPreviewOptions, ...captionOptions } = options;
  return { caption: text, ...captionOptions };
}

async function editStatus(ctx, message, text, options = {}) {
  const safeText = String(text ?? '').trim() || '⚠️ Unable to update status.';
  try {
    return await ctx.api.editMessageText(ctx.chat.id, message.message_id, safeText.slice(0, 4096), options);
  } catch (error) {
    try {
      return await ctx.api.editMessageCaption(ctx.chat.id, message.message_id, captionEditOptions(safeText.slice(0, 1024), options));
    } catch (captionError) {
      throw captionError;
    }
  }
}

function selectedTrackIndex(tracks, index = 0) {
  const total = Math.max(1, tracks.length);
  return Math.max(0, Math.min(Number.parseInt(index, 10) || 0, total - 1));
}

function youtubeThumbnail(track) {
  const value = String(track?.thumbnail ?? '').trim();
  if (/^https?:\/\//i.test(value)) return value;
  const trackId = String(track?.trackId ?? '').trim();
  if (/^[\w-]{11}$/.test(trackId)) {
    return `https://img.youtube.com/vi/${trackId}/hqdefault.jpg`;
  }
  return '';
}

function formatYouTubeSearchResult(language, track, index, total) {
  const channel = track.channel || track.channelUrl || '-';
  const lines = [
    `🎵 <b>${t(language, 'playback.chooseTrack')}</b> (${index + 1}/${total})`,
    '',
    `<b>${t(language, 'playback.title')}:</b> ${htmlEscape(track.title ?? track.name)}`,
    `<b>${t(language, 'playback.channel')}:</b> ${htmlEscape(channel)}`,
    `<b>${t(language, 'playback.duration')}:</b> ${secondsToClock(track.duration)}`,
  ];
  if (track.views) lines.push(`<b>${t(language, 'playback.views')}:</b> ${htmlEscape(track.views)}`);
  if (track.uploadAt) lines.push(`<b>${t(language, 'playback.upload')}:</b> ${htmlEscape(track.uploadAt)}`);
  lines.push(`<b>${t(language, 'playback.url')}:</b> <a href="${htmlEscape(track.url)}">${htmlEscape(track.url)}</a>`);
  return lines.join('\n');
}


function formatAppleMusicSearchResult(language, track, index, total) {
  const lines = [
    `🍎 <b>${t(language, 'playback.appleMusicDiscovery')}</b>  •  <code>${index + 1}/${total}</code>`,
    '━━━━━━━━━━━━━━━━━━',
    '',
    `🎵 <b>${htmlEscape(track.title ?? track.name ?? '-')}</b>`,
    `👤 ${htmlEscape(track.artist ?? '-')}`,
  ];
  if (track.album) lines.push(`💿 ${htmlEscape(track.album)}`);
  if (track.releaseDate || track.duration) lines.push(`📅 ${htmlEscape(track.releaseDate || '-')}   •   ⏱ ${secondsToClock(track.duration || 0)}`);
  if (track.genre) lines.push(`🎼 ${htmlEscape(track.genre)}`);
  lines.push('', '━━━━━━━━━━━━━━━━━━', `<i>${t(language, 'playback.appleMusicSelectHint')}</i>`);
  if (track.displayUrl || track.sourceUrl) lines.push(`🔗 <a href="${htmlEscape(track.displayUrl || track.sourceUrl)}">${t(language, 'playback.appleMusicOpen')}</a>`);
  return lines.join('\n');
}

function formatSpotifySearchResult(language, track, index, total) {
  const lines = [
    `🟢 <b>${t(language, 'playback.spotifyDiscovery')}</b>  •  <code>${index + 1}/${total}</code>`,
    '━━━━━━━━━━━━━━━━━━',
    '',
    `🎵 <b>${htmlEscape(track.title ?? track.name ?? '-')}</b>`,
  ];
  if (track.artist) lines.push(`👤 ${htmlEscape(track.artist)}`);
  if (track.album) lines.push(`💿 ${htmlEscape(track.album)}`);
  if (track.releaseDate || track.duration) lines.push(`📅 ${htmlEscape(track.releaseDate || '-')}   •   ⏱ ${secondsToClock(track.duration || 0)}`);
  lines.push('', '━━━━━━━━━━━━━━━━━━', `<i>${t(language, 'playback.spotifySelectHint')}</i>`);
  if (track.displayUrl || track.sourceUrl) lines.push(`🔗 <a href="${htmlEscape(track.displayUrl || track.sourceUrl)}">${t(language, 'playback.spotifyOpen')}</a>`);
  return lines.join('\n');
}

function formatSoundCloudSearchResult(language, track, index, total) {
  const lines = [
    `🟠 <b>${t(language, 'playback.soundcloudDiscovery')}</b>  •  <code>${index + 1}/${total}</code>`,
    '━━━━━━━━━━━━━━━━━━',
    '',
    `🎵 <b>${htmlEscape(track.title ?? track.name ?? '-')}</b>`,
  ];
  if (track.artist || track.channel) lines.push(`👤 ${htmlEscape(track.artist || track.channel)}`);
  lines.push(`⏱ ${secondsToClock(track.duration || 0)}`);
  lines.push('', '━━━━━━━━━━━━━━━━━━', `<i>${t(language, 'playback.soundcloudSelectHint')}</i>`);
  if (track.url) lines.push(`🔗 <a href="${htmlEscape(track.url)}">${t(language, 'playback.soundcloudOpen')}</a>`);
  return lines.join('\n');
}

function formatSearchSelection(language, tracks, index = 0) {
  const safeIndex = selectedTrackIndex(tracks, index);
  const track = tracks[safeIndex];
  if (track?.platform === 'Apple Music' || track?.sourceType === 'apple_music') return formatAppleMusicSearchResult(language, track, safeIndex, tracks.length);
  if (track?.platform === 'Spotify' || track?.sourceType === 'spotify') return formatSpotifySearchResult(language, track, safeIndex, tracks.length);
  if (track?.platform === 'SoundCloud' || track?.sourceType === 'soundcloud') return formatSoundCloudSearchResult(language, track, safeIndex, tracks.length);
  return formatYouTubeSearchResult(language, track, safeIndex, tracks.length);
}


function searchServiceLabel(service) {
  const normalized = String(service ?? '').toLowerCase();
  if (normalized.includes('spotify')) return 'Spotify';
  if (normalized.includes('soundcloud')) return 'SoundCloud';
  if (normalized.includes('apple')) return 'Apple Music';
  return 'YouTube';
}
async function sendSelectionPhoto(ctx, statusMessage, thumbnail, caption) {
  try {
    const message = await ctx.replyWithPhoto(thumbnail, { caption, parse_mode: 'HTML' });
    await ctx.api.deleteMessage(ctx.chat.id, statusMessage.message_id).catch(() => {});
    return message;
  } catch (error) {
    console.warn('Failed to send search thumbnail photo, falling back to text selection:', error.message);
    return statusMessage;
  }
}

async function sendPlaybackPhoto(ctx, statusMessage, track, caption, options = {}) {
  const { deleteStatusMessage = true, ...sendOptions } = options;
  const thumbnail = youtubeThumbnail(track);
  if (!thumbnail) return null;
  try {
    const message = await ctx.replyWithPhoto(thumbnail, { caption, parse_mode: 'HTML', ...captionEditOptions(caption, sendOptions) });
    if (deleteStatusMessage && statusMessage?.message_id) {
      await ctx.api.deleteMessage(ctx.chat.id, statusMessage.message_id).catch(() => {});
    }
    return message;
  } catch (error) {
    console.warn('Failed to send playback thumbnail photo, falling back to status edit:', error.message);
    return null;
  }
}

async function updateSearchSelectionMessage(ctx, token, selection, newIndex) {
  const messageId = ctx.callbackQuery?.message?.message_id;
  const chatId = ctx.chat.id;
  const safeIndex = selectedTrackIndex(selection.results, newIndex);
  selection.page = safeIndex;

  const caption = formatSearchSelection(selection.language, selection.results, safeIndex);
  const thumbnail = youtubeThumbnail(selection.results[safeIndex]);
  const keyboard = searchSelectionKeyboard(token, selection.results, safeIndex);

  if (selection.hasPhoto && thumbnail) {
    try {
      await ctx.api.editMessageMedia(chatId, messageId, {
        type: 'photo',
        media: thumbnail,
        caption,
        parse_mode: 'HTML',
      }, {
        reply_markup: keyboard,
      });
      return;
    } catch (error) {
      console.warn('Failed to edit search message media, falling back to recreate:', error.message);
    }
  }

  if (!selection.hasPhoto && !thumbnail) {
    try {
      await ctx.api.editMessageText(chatId, messageId, caption, {
        parse_mode: 'HTML',
        reply_markup: keyboard,
        disable_web_page_preview: true,
      });
      return;
    } catch (error) {
      console.warn('Failed to edit search message text:', error.message);
    }
  }

  try {
    if (messageId) {
      await ctx.api.deleteMessage(chatId, messageId).catch(() => {});
    }

    let newMessage;
    if (thumbnail) {
      newMessage = await ctx.replyWithPhoto(thumbnail, {
        caption,
        parse_mode: 'HTML',
        reply_markup: keyboard,
      });
      selection.hasPhoto = true;
    } else {
      newMessage = await ctx.reply(caption, {
        parse_mode: 'HTML',
        reply_markup: keyboard,
        disable_web_page_preview: true,
      });
      selection.hasPhoto = false;
    }
  } catch (error) {
    console.error('Failed to recreate search message:', error);
  }
}

async function showSearchSelection(ctx, statusMessage, tracks, isVideo, language, index = 0) {
  const safeIndex = selectedTrackIndex(tracks, index);
  const caption = formatSearchSelection(language, tracks, safeIndex);
  const thumbnail = youtubeThumbnail(tracks[safeIndex]);

  const state = {
    chatId: ctx.chat.id,
    userId: ctx.from?.id,
    isVideo,
    results: tracks,
    page: safeIndex,
    language,
    hasPhoto: false,
  };
  const token = searchCache.save(state);

  const selectionMessage = thumbnail
    ? await sendSelectionPhoto(ctx, statusMessage, thumbnail, caption)
    : statusMessage;
  const hasPhoto = selectionMessage.message_id !== statusMessage.message_id && Boolean(thumbnail);
  state.hasPhoto = hasPhoto;

  const keyboard = searchSelectionKeyboard(token, tracks, safeIndex);

  if (hasPhoto) {
    await ctx.api.editMessageCaption(ctx.chat.id, selectionMessage.message_id, {
      caption,
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
    return;
  }

  await editStatus(ctx, selectionMessage, caption, {
    parse_mode: 'HTML',
    reply_markup: keyboard,
    disable_web_page_preview: true,
  });
}

async function queueAndMaybePlay(ctx, statusMessage, track, isVideo, language, defaultService = config.defaultService) {
  const chatId = ctx.chat.id;
  const resolvedService = track.platform ?? track.defaultService ?? defaultService ?? config.defaultService;
  const saveTrack = {
    ...track,
    user: firstName(ctx),
    userId: ctx.from?.id,
    isVideo,
    filePath: '',
    platform: track.platform ?? resolvedService,
    defaultService: track.defaultService ?? resolvedService,
  };
  const premiumSettings = await getPremiumSettings(chatId);
  saveTrack.audioPreset = premiumSettings.audioPreset;
  if (chatCache.getTrackIfExists(chatId, saveTrack.trackId)) {
    await editStatus(ctx, statusMessage, t(language, 'playback.duplicate'));
    return;
  }
  const premiumRequester = await isPremiumRequester(ctx);
  const length = premiumRequester && chatCache.getQueueLength(chatId) > 0
    ? chatCache.addSongAt(chatId, saveTrack, 1)
    : chatCache.addSong(chatId, saveTrack);
  if (length > 1) {
    preloadTrack(saveTrack, isVideo, { chatId });
    maybePrefetchLyrics(chatId, saveTrack);
    const queueCaption = formatTrack(language, saveTrack, length);
    const queueMessage = await sendPlaybackPhoto(ctx, statusMessage, saveTrack, queueCaption, { disable_web_page_preview: true })
      ?? await editStatus(ctx, statusMessage, queueCaption, { parse_mode: 'HTML', disable_web_page_preview: true });
    rememberPlaybackPanel(ctx, queueMessage ?? statusMessage, language, saveTrack);
    return;
  }

  try {
    await ensureDownloaded(saveTrack, isVideo);
  } catch (error) {
    chatCache.shift(chatId);
    await editStatus(ctx, statusMessage, t(language, 'playback.downloadFailed', { error: formatError(error, language) }));
    return;
  }
  let activeTrack;
  try {
    activeTrack = await startQueuedTrack(ctx, saveTrack, isVideo);
    saveTrack.startedAt = activeTrack?.startedAt || saveTrack.startedAt;
  } catch (error) {
    chatCache.shift(chatId);
    if (isVoiceChatInactiveError(error)) {
      await editStatus(ctx, statusMessage, t(language, 'playback.voiceChatInactiveWarning'));
      return;
    }
    await editStatus(ctx, statusMessage, t(language, 'playback.voiceFailed', { error: formatError(error, language) }));
    return;
  }
  const playbackCaption = formatTrack(language, saveTrack);
  const playbackMarkup = controlKeyboard(language, '', saveTrack);
  const playbackMessage = await sendPlaybackPhoto(ctx, statusMessage, saveTrack, playbackCaption, { reply_markup: playbackMarkup, disable_web_page_preview: true })
    ?? await editStatus(ctx, statusMessage, playbackCaption, { parse_mode: 'HTML', reply_markup: playbackMarkup, disable_web_page_preview: true });
  rememberPlaybackPanel(ctx, playbackMessage ?? statusMessage, language, saveTrack);
  startProgressUpdater(ctx, playbackMessage ?? statusMessage, language);

  // Auto-start lyrics for first track and prefetch next
  const lyricsTrack = activeTrack 
    ? { 
        ...saveTrack, 
        ...activeTrack, 
        title: activeTrack.title || activeTrack.name || saveTrack.title || saveTrack.name,
        name: activeTrack.name || activeTrack.title || saveTrack.name || saveTrack.title,
        url: activeTrack.url || activeTrack.sourceUrl || saveTrack.url || saveTrack.sourceUrl,
        user: saveTrack.user, 
        userId: saveTrack.userId 
      } 
    : saveTrack;
  startLyricsAuto(chatId, ctx.api, lyricsTrack, 'first-track');
  prefetchNextLyrics(chatId);
}

async function sendPlaylistQueuePanels(ctx, tracks, language, queueStartLength, fallbackMessage) {
  const sentMessages = [];
  for (const [index, queuedTrack] of tracks.entries()) {
    const queuePosition = queueStartLength + index + 1;
    const caption = formatTrack(language, queuedTrack, queuePosition);
    const sent = await sendPlaybackPhoto(ctx, fallbackMessage, queuedTrack, caption, { disable_web_page_preview: true, deleteStatusMessage: false })
      ?? await ctx.reply(caption, { parse_mode: 'HTML', disable_web_page_preview: true }).catch(() => null);
    if (sent) rememberPlaybackPanel(ctx, sent, language, queuedTrack);
    sentMessages.push(sent);
  }
  return sentMessages;
}

function isBlockedPlaylistTitle(title) {
  const value = String(title ?? '').trim();
  if (!value) return true;
  return /\[(deleted|private)\s+video\]|\b(deleted|private|unavailable|blocked|age[-\s]?restricted)\b/i.test(value);
}

function normalizePlaylistCandidate(item) {
  if (!item || typeof item !== 'object') return null;
  const name = String(item.name ?? item.title ?? '').trim();
  if (isBlockedPlaylistTitle(name)) return null;
  const url = String(item.url ?? '').trim();
  const trackId = String(item.trackId ?? item.id ?? '').trim();
  const resolvedUrl = url || (trackId ? `https://www.youtube.com/watch?v=${trackId}` : '');
  if (!resolvedUrl || !isUrl(resolvedUrl)) return null;
  if (!/youtube\.com|youtu\.be/i.test(resolvedUrl)) return null;
  return { ...item, name, trackId: trackId || resolvedUrl, url: resolvedUrl };
}

async function validatePlaylistCandidates(downloader, items, chatId, isVideo, remaining) {
  const validTracks = [];
  const seenTrackIds = new Set();
  let skippedCount = 0;
  let index = 0;
  const concurrency = 2;
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (true) {
      if (validTracks.length >= remaining) return;
      const currentIndex = index;
      index += 1;
      if (currentIndex >= items.length) return;
      const candidate = items[currentIndex];
      const normalized = normalizePlaylistCandidate(candidate);
      if (!normalized) {
        skippedCount += 1;
        continue;
      }
      if (seenTrackIds.has(normalized.trackId) || chatCache.getTrackIfExists(chatId, normalized.trackId)) {
        skippedCount += 1;
        continue;
      }
      try {
        const validated = await downloader.validatePlaylistItem(normalized, { isVideo });
        if (!validated?.trackId || !validated?.name || !validated?.url || isBlockedPlaylistTitle(validated.name) || !isUrl(validated.url)) {
          skippedCount += 1;
          continue;
        }
        if (seenTrackIds.has(validated.trackId) || chatCache.getTrackIfExists(chatId, validated.trackId) || validTracks.length >= remaining) {
          skippedCount += 1;
          continue;
        }
        seenTrackIds.add(validated.trackId);
        validTracks.push(validated);
      } catch (error) {
        skippedCount += 1;
        console.warn(`Playlist item skipped in chat ${chatId}:`, error?.message ?? error);
      }
    }
  });
  await Promise.all(workers);
  return { validTracks, skippedCount };
}

async function processPlayRequest(ctx, status, input, isVideo, language, defaultService) {
  const chatId = ctx.chat.id;
  const queueLimit = await queueLimitFor(ctx);
  if (chatCache.getQueueLength(chatId) >= queueLimit) {
    await editStatus(ctx, status, t(language, 'playback.queueFull', { max: queueLimit }));
    return;
  }

  if (input.startsWith('tgpl_')) {
    const playlist = await getPlaylist(input);
    if (!playlist) {
      await editStatus(ctx, status, t(language, 'playback.playlistNotFound'));
      return;
    }
    if (!playlist.songs?.length) {
      await editStatus(ctx, status, t(language, 'playback.playlistEmpty'));
      return;
    }
    const remaining = queueLimit - chatCache.getQueueLength(chatId);
    const tracks = playlist.songs.slice(0, remaining).map((track) => {
      const resolvedService = track.platform ?? track.defaultService ?? defaultService ?? config.defaultService;
      return {
        ...track,
        user: firstName(ctx),
        userId: ctx.from?.id,
        isVideo,
        filePath: track.filePath ?? '',
        platform: track.platform ?? resolvedService,
        defaultService: track.defaultService ?? resolvedService,
      };
    });
    if (tracks.length === 0) {
      await editStatus(ctx, status, t(language, 'playback.queueFull', { max: queueLimit }));
      return;
    }
    const queueBefore = chatCache.getQueueLength(chatId);
    const queueWasEmpty = queueBefore === 0;
    const length = chatCache.addSongs(chatId, tracks);
    preloadTracks(queueWasEmpty ? tracks.slice(1) : tracks, { chatId });
    // Prefetch lyrics for all queued playlist tracks
    for (const tr of tracks) maybePrefetchLyrics(chatId, tr);
    const playlistSummary = t(language, 'playback.addedPlaylistTracks', { count: tracks.length, length });
    await editStatus(ctx, status, playlistSummary, { parse_mode: 'HTML', disable_web_page_preview: true });
    const [firstTrackMessage] = await sendPlaylistQueuePanels(ctx, tracks, language, queueBefore, status);
    if (queueWasEmpty) {
      let activeTrack;
      try {
        activeTrack = await startQueuedTrack(ctx, tracks[0], isVideo);
        tracks[0].startedAt = activeTrack?.startedAt || tracks[0].startedAt;
        if (firstTrackMessage) {
          const playbackCaption = formatTrack(language, tracks[0]);
          const playbackMarkup = controlKeyboard(language, '', tracks[0]);
          const playbackMessage = await sendPlaybackPhoto(ctx, firstTrackMessage, tracks[0], playbackCaption, { reply_markup: playbackMarkup, disable_web_page_preview: true })
            ?? await editStatus(ctx, firstTrackMessage, playbackCaption, { parse_mode: 'HTML', reply_markup: playbackMarkup, disable_web_page_preview: true });
          rememberPlaybackPanel(ctx, playbackMessage ?? firstTrackMessage, language, tracks[0]);
          startProgressUpdater(ctx, playbackMessage ?? firstTrackMessage, language);
        }
        // Auto-start lyrics for playlist first track
        const lyricsTrack = activeTrack 
          ? { 
              ...tracks[0], 
              ...activeTrack, 
              title: activeTrack.title || activeTrack.name || tracks[0].title || tracks[0].name,
              name: activeTrack.name || activeTrack.title || tracks[0].name || tracks[0].title,
              url: activeTrack.url || activeTrack.sourceUrl || tracks[0].url || tracks[0].sourceUrl,
              user: tracks[0].user, 
              userId: tracks[0].userId 
            } 
          : tracks[0];
        startLyricsAuto(chatId, ctx.api, lyricsTrack, 'playlist-first-track');
        prefetchNextLyrics(chatId);
      } catch (error) {
        chatCache.shift(chatId);
        if (isVoiceChatInactiveError(error)) {
          await ctx.reply(t(language, 'playback.voiceChatInactiveWarning'));
          return;
        }
        await ctx.reply(t(language, 'playback.voiceFailed', { error: formatError(error, language) }));
      }
    }
    return;
  }

  const parsedMode = /^url\s+/i.test(input)
    ? 'url'
    : (/^request\s+/i.test(input) ? 'request' : 'auto');
  const normalizedInput = parsedMode === 'auto' ? input : input.replace(/^(url|request)\s+/i, '').trim();
  if (!normalizedInput) {
    await editStatus(ctx, status, t(language, 'playback.playUsage'));
    return;
  }

  const downloader = new Downloader(normalizedInput, { defaultService });
  if ((parsedMode === 'url' || isUrl(normalizedInput)) && !downloader.isValid()) {
    await editStatus(ctx, status, t(language, 'playback.invalidUrl'));
    return;
  }

  const looksLikePlaylistUrl = downloader.isUrl() && /[?&]list=/.test(normalizedInput);

  let info;
  try {
    info = await downloader.getInfo({ mode: parsedMode, allowPlaylist: parsedMode === 'url' || looksLikePlaylistUrl });
  } catch (error) {
    const serviceLabel = searchServiceLabel(defaultService);
    if (!isUrl(normalizedInput) && !String(defaultService).toLowerCase().includes('youtube')) {
      await editStatus(ctx, status, `Gagal mencari lagu di ${serviceLabel}. Coba lagi nanti atau pilih layanan lain.`);
    } else {
      await editStatus(ctx, status, t(language, 'playback.fetchError', { error: formatError(error, language) }));
    }
    return;
  }

  if (info.trackLinkRequired && info.platform === 'Spotify') {
    await editStatus(ctx, status, t(language, 'playback.spotifyTrackLinkRequired'));
    return;
  }
  const results = info.results ?? [];
  const [track] = results;
  if (!track) {
    if (!isUrl(normalizedInput) && !String(defaultService).toLowerCase().includes('youtube')) {
      await editStatus(ctx, status, `Tidak ada hasil ditemukan di ${searchServiceLabel(defaultService)}.`);
    } else {
      await editStatus(ctx, status, t(language, 'playback.noTracks'));
    }
    return;
  }

  if (!isUrl(normalizedInput) && !input.startsWith('tgpl_')) {
    await showSearchSelection(ctx, status, results, isVideo, language);
    return;
  }

  if ((parsedMode === 'url' || looksLikePlaylistUrl) && results.length > 1) {
    const queueLimitAfter = await queueLimitFor(ctx);
    const remaining = queueLimitAfter - chatCache.getQueueLength(chatId);
    const maxScan = Math.min(results.length, Math.max((remaining * 3), remaining + 5), 50);
    const candidates = results.slice(0, Math.max(0, maxScan));
    const { validTracks, skippedCount } = await validatePlaylistCandidates(downloader, candidates, chatId, isVideo, Math.max(0, remaining));
    const tracks = validTracks.map((validated) => ({
      ...validated,
      user: firstName(ctx),
      userId: ctx.from?.id,
      isVideo,
      filePath: '',
      platform: validated.platform ?? defaultService,
      defaultService: validated.defaultService ?? validated.platform ?? defaultService ?? config.defaultService,
    }));
    if (tracks.length === 0) {
      const message = remaining <= 0
        ? t(language, 'playback.queueFull', { max: queueLimitAfter })
        : 'Tidak ada video yang bisa diputar dari playlist ini.';
      await editStatus(ctx, status, message);
      return;
    }
    const queueBefore = chatCache.getQueueLength(chatId);
    const queueWasEmpty = queueBefore === 0;
    const length = chatCache.addSongs(chatId, tracks);
    preloadTracks(queueWasEmpty ? tracks.slice(1) : tracks, { chatId });
    // Prefetch lyrics for all URL playlist tracks
    for (const tr of tracks) maybePrefetchLyrics(chatId, tr);
    const notScannedCount = Math.max(0, results.length - candidates.length);
    const skipSummary = `${skippedCount > 0 ? `\n${skippedCount} item dilewati karena tidak tersedia/duplikat.` : ''}${notScannedCount > 0 ? '\nBeberapa item playlist tidak dicek agar proses tetap ringan.' : ''}`;
    const playlistSummary = `${t(language, 'playback.addedPlaylistTracks', { count: tracks.length, length })}${skipSummary}`;
    await editStatus(ctx, status, playlistSummary, { parse_mode: 'HTML', disable_web_page_preview: true });
    const [firstTrackMessage] = await sendPlaylistQueuePanels(ctx, tracks, language, queueBefore, status);
    if (queueWasEmpty) {
      let activeTrack;
      try {
        await ensureDownloaded(tracks[0], isVideo);
        activeTrack = await startQueuedTrack(ctx, tracks[0], isVideo);
        tracks[0].startedAt = activeTrack?.startedAt || tracks[0].startedAt;
        if (firstTrackMessage) {
          const playbackCaption = formatTrack(language, tracks[0]);
          const playbackMarkup = controlKeyboard(language, '', tracks[0]);
          const playbackMessage = await sendPlaybackPhoto(ctx, firstTrackMessage, tracks[0], playbackCaption, { reply_markup: playbackMarkup, disable_web_page_preview: true })
            ?? await editStatus(ctx, firstTrackMessage, playbackCaption, { parse_mode: 'HTML', reply_markup: playbackMarkup, disable_web_page_preview: true });
          rememberPlaybackPanel(ctx, playbackMessage ?? firstTrackMessage, language, tracks[0]);
          startProgressUpdater(ctx, playbackMessage ?? firstTrackMessage, language);
        }
        // Auto-start lyrics for URL playlist first track
        const lyricsTrack = activeTrack 
          ? { 
              ...tracks[0], 
              ...activeTrack, 
              title: activeTrack.title || activeTrack.name || tracks[0].title || tracks[0].name,
              name: activeTrack.name || activeTrack.title || tracks[0].name || tracks[0].title,
              url: activeTrack.url || activeTrack.sourceUrl || tracks[0].url || tracks[0].sourceUrl,
              user: tracks[0].user, 
              userId: tracks[0].userId 
            } 
          : tracks[0];
        startLyricsAuto(chatId, ctx.api, lyricsTrack, 'url-playlist-first-track');
        prefetchNextLyrics(chatId);
      } catch (error) {
        chatCache.shift(chatId);
        if (isVoiceChatInactiveError(error)) {
          await ctx.reply(t(language, 'playback.voiceChatInactiveWarning'));
          return;
        }
        await ctx.reply(t(language, 'playback.voiceFailed', { error: formatError(error, language) }));
      }
    }
    return;
  }
  if (info.selectionRequired && results.length > 1) {
    await showSearchSelection(ctx, status, results, isVideo, language);
    return;
  }
  await queueAndMaybePlay(ctx, status, track, isVideo, language, defaultService);
}

export async function playHandler(ctx, isVideo = false) {
  const language = await getUserLanguage(ctx.from?.id);
  if (!(await playMode(ctx))) return;
  const chatId = ctx.chat.id;
  const premiumSettings = await getPremiumSettings(chatId);
  if (premiumSettings.djMode) {
    const isOwner = Number(ctx.from?.id) === Number(config.ownerId) || config.devs.includes(Number(ctx.from?.id));
    const auth = await isAuthUser(chatId, ctx.from?.id);
    if (!isOwner && !auth) {
      await ctx.reply('DJ mode is enabled: only owner/dev/auth users can add tracks.');
      return;
    }
  }
  const premiumRequester = await isPremiumRequester(ctx);
  if (!premiumRequester) {
    const cooldownLeft = getPlayCooldownLeft(chatId, ctx.from?.id);
    if (cooldownLeft > 0) {
      await ctx.reply(`Please wait ${Math.ceil(cooldownLeft / 1000)}s before sending another /play request.`);
      return;
    }
  }
  const queueLimit = await queueLimitFor(ctx);
  if (chatCache.getQueueLength(chatId) >= queueLimit) {
    await ctx.reply(t(language, 'playback.queueFull', { max: queueLimit }));
    return;
  }

  const input = commandArgs(ctx);
  if (!input) {
    await ctx.reply(t(language, 'playback.playUsage'), {
      parse_mode: 'HTML',
      reply_markup: supportKeyboard(language),
    });
    return;
  }
  cleanupInactiveChatDownloads();
  markPlayRequest(chatId, ctx.from?.id);
  const status = await ctx.reply(input.startsWith('tgpl_') ? t(language, 'playback.searchingPlaylist') : t(language, 'playback.searchingDownload'));
  const defaultService = await getUserDefaultService(ctx.from?.id);
  prepareAssistantJoin(ctx);
  enqueueChatTask(chatId, 'Proses /play', () => processPlayRequest(ctx, status, input, isVideo, language, defaultService));
}

export async function queueHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const queue = chatCache.getQueue(ctx.chat.id);
  if (queue.length === 0) {
    await ctx.reply(t(language, 'playback.queueEmpty'));
    return;
  }

  const previewTracks = queue.slice(0, MAX_QUEUE);
  const hiddenCount = Math.max(0, queue.length - previewTracks.length);
  const lines = previewTracks.map((track, index) => {
    const title = htmlEscape(track.name);
    const duration = secondsToClock(track.duration);
    const requester = htmlEscape(track.user || '-');
    return `${index + 1}. <a href="${htmlEscape(track.url)}">${title}</a> (${duration}) — ${requester}`;
  });
  if (hiddenCount > 0) {
    lines.push('');
    lines.push(`… +${hiddenCount} lagu lagi`);
  }

  const text = `<b>${t(language, 'playback.queueTitle')}</b> (${previewTracks.length}/${queue.length})\n\n${lines.join('\n')}`;
  const thumbnail = youtubeThumbnail(previewTracks[0]);
  if (thumbnail) {
    await ctx.replyWithPhoto(thumbnail, { caption: text.slice(0, 1024), parse_mode: 'HTML' });
    return;
  }
  await ctx.reply(text, { parse_mode: 'HTML', disable_web_page_preview: true });
}


export async function skipHandler(ctx) {
  if (!(await checkDjMode(ctx))) return;
  const language = await getUserLanguage(ctx.from?.id);
  const queuedNext = chatCache.getQueue(ctx.chat.id)[1] ?? null;
  try {
    if (queuedNext) await ensureDownloaded(queuedNext, queuedNext.isVideo);
  } catch (error) {
    await ctx.reply(t(language, 'playback.voiceFailed', { error: formatError(error, language) }));
    return;
  }

  // Stop lyrics for the current track before skipping
  stopLyricsForChat(ctx.chat.id, 'manual-skip');

  const { skipped, next, activeTrack: reusedTrack } = await voicePlayer.skip(ctx.chat.id, { reuseActive: true });
  if (!skipped) {
    await ctx.reply(t(language, 'playback.nothingPlaying'));
    return;
  }
  if (!next) {
    await updatePlaybackPanelsForAdvance(ctx.chat.id, skipped, null, null);
    await markPlaybackPanelStatus(ctx.chat.id, skipped, 'skipped').catch(() => {});
    cleanupTrackDownload(skipped, { chatId: ctx.chat.id });
    await ctx.reply(t(language, 'playback.skippedEnded', { skipped: skipped.name }));
    return;
  }
  try {
    const activeTrack = reusedTrack ?? await startQueuedTrack(ctx, next, next.isVideo);
    await updatePlaybackPanelsForAdvance(ctx.chat.id, skipped, next, activeTrack);
    cleanupTrackDownload(skipped, { chatId: ctx.chat.id });
    await ctx.reply(t(language, 'playback.skippedNow', { skipped: skipped.name, next: next.name }));

    // Auto-start lyrics for the new track and prefetch next
    const lyricsTrack = activeTrack 
      ? { 
          ...next, 
          ...activeTrack, 
          title: activeTrack.title || activeTrack.name || next.title || next.name,
          name: activeTrack.name || activeTrack.title || next.name || next.title,
          url: activeTrack.url || activeTrack.sourceUrl || next.url || next.sourceUrl,
          user: next.user, 
          userId: next.userId 
        } 
      : next;
    startLyricsAuto(ctx.chat.id, ctx.api, lyricsTrack, 'manual-skip');
    prefetchNextLyrics(ctx.chat.id);
  } catch (error) {
    stopLyricsForChat(ctx.chat.id, 'manual-skip-error');
    const failedNext = chatCache.shift(ctx.chat.id);
    cleanupTrackDownload(failedNext, { chatId: ctx.chat.id });
    if (isVoiceChatInactiveError(error)) {
      await ctx.reply(t(language, 'playback.voiceChatInactiveWarning'));
      return;
    }
    await ctx.reply(t(language, 'playback.voiceFailed', { error: formatError(error, language) }));
  }
}

export async function stopHandler(ctx) {
  if (!(await checkDjMode(ctx))) return;
  const language = await getUserLanguage(ctx.from?.id);
  const queue = chatCache.getQueue(ctx.chat.id);
  const queuedCurrent = queue[0] ?? null;
  const queuedNext = queue[1] ?? null;
  const currentRequester = requesterKey(queuedCurrent);
  const nextRequester = requesterKey(queuedNext);
  try {
    if (queuedNext && currentRequester && nextRequester && currentRequester !== nextRequester) await ensureDownloaded(queuedNext, queuedNext.isVideo);
  } catch (error) {
    await ctx.reply(t(language, 'playback.voiceFailed', { error: formatError(error, language) }));
    return;
  }

  // Stop lyrics before stopping playback
  stopLyricsForChat(ctx.chat.id, 'manual-stop');

  const { stopped, next, activeTrack: reusedTrack, cleared } = await voicePlayer.stopOrAdvance(ctx.chat.id, { reuseActive: true });
  if (cleared || !next) {
    stopProgressUpdater(ctx.chat.id);
    cleanupTrackDownloads(queue, { chatId: ctx.chat.id });
    if (queuedCurrent ?? stopped) await markPlaybackPanelStatus(ctx.chat.id, queuedCurrent ?? stopped, 'stopped').catch(() => {});
    await ctx.reply(t(language, 'playback.stopped'));
    return;
  }

  try {
    const activeTrack = reusedTrack ?? await startQueuedTrack(ctx, next, next.isVideo);
    await updatePlaybackPanelsForAdvance(ctx.chat.id, stopped, next, activeTrack);
    cleanupTrackDownload(stopped, { chatId: ctx.chat.id });
    await ctx.reply(t(language, 'playback.skippedNow', { skipped: stopped.name, next: next.name }));

    // Auto-start lyrics for the new track
    const lyricsTrack = activeTrack 
      ? { 
          ...next, 
          ...activeTrack, 
          title: activeTrack.title || activeTrack.name || next.title || next.name,
          name: activeTrack.name || activeTrack.title || next.name || next.title,
          url: activeTrack.url || activeTrack.sourceUrl || next.url || next.sourceUrl,
          user: next.user, 
          userId: next.userId 
        } 
      : next;
    startLyricsAuto(ctx.chat.id, ctx.api, lyricsTrack, 'manual-stop-advance');
    prefetchNextLyrics(ctx.chat.id);
  } catch (error) {
    stopLyricsForChat(ctx.chat.id, 'manual-stop-error');
    const failedNext = chatCache.shift(ctx.chat.id);
    cleanupTrackDownload(failedNext, { chatId: ctx.chat.id });
    if (isVoiceChatInactiveError(error)) {
      await ctx.reply(t(language, 'playback.voiceChatInactiveWarning'));
      return;
    }
    await ctx.reply(t(language, 'playback.voiceFailed', { error: formatError(error, language) }));
  }
}

export async function pauseHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const current = chatCache.current(ctx.chat.id);
  const paused = await voicePlayer.pause(ctx.chat.id);
  if (!paused || !current) {
    await ctx.reply(t(language, 'playback.nothingPlaying'));
    return;
  }
  if (current) await markPlaybackPanelStatus(ctx.chat.id, current, 'paused', current);
  await ctx.reply(t(language, 'playback.paused'));
}

export async function resumeHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const current = chatCache.current(ctx.chat.id);
  const resumed = await voicePlayer.resume(ctx.chat.id);
  if (!resumed || !current) {
    await ctx.reply(t(language, 'playback.nothingPlaying'));
    return;
  }
  if (current) await markPlaybackPanelStatus(ctx.chat.id, current, 'playing', current);
  await ctx.reply(t(language, 'playback.resumed'));
}

export async function removeHandler(ctx) {
  if (!(await checkDjMode(ctx))) return;
  const language = await getUserLanguage(ctx.from?.id);
  const index = Number.parseInt(commandArgs(ctx), 10) - 1;
  if (!Number.isInteger(index)) {
    await ctx.reply(t(language, 'playback.removeUsage'));
    return;
  }
  const removed = chatCache.remove(ctx.chat.id, index);
  if (removed) cleanupTrackDownload(removed, { chatId: ctx.chat.id });
  await ctx.reply(removed ? t(language, 'playback.removed', { name: removed.name }) : t(language, 'playback.invalidQueue'));
}

export async function loopHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const count = chatCache.setLoop(ctx.chat.id, commandArgs(ctx));
  const current = chatCache.current(ctx.chat.id);
  if (current) current.loopRemaining = count;
  await ctx.reply(t(language, 'playback.loopSet', { count }));
}


export function parseSeekValue(input) {
  const value = String(input || '').trim();
  if (!value) return null;
  const sign = value.startsWith('+') ? 1 : value.startsWith('-') ? -1 : 0;
  const raw = sign ? value.slice(1) : value;
  if (!raw) return null;
  if (raw.includes(':')) {
    const parts = raw.split(':').map((part) => Number(part));
    if (parts.some((part) => !Number.isFinite(part) || part < 0)) return null;
    const seconds = parts.reduce((acc, part) => acc * 60 + part, 0);
    return { absolute: sign === 0, seconds: sign === 0 ? seconds : sign * seconds };
  }
  const seconds = Number(raw);
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  return { absolute: sign === 0, seconds: sign === 0 ? seconds : sign * seconds };
}

export async function muteHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  if (!chatCache.current(ctx.chat.id)) {
    await ctx.reply(t(language, 'playback.nothingPlaying'));
    return;
  }
  const muted = await voicePlayer.mute(ctx.chat.id);
  if (!muted) {
    await ctx.reply(t(language, 'playback.voiceFailed', { error: 'Mute tidak didukung atau gagal di voice adapter.' }));
    return;
  }
  await ctx.reply(t(language, 'playback.muted'));
}

export async function unmuteHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  if (!chatCache.current(ctx.chat.id)) {
    await ctx.reply(t(language, 'playback.nothingPlaying'));
    return;
  }
  const unmuted = await voicePlayer.unmute(ctx.chat.id);
  if (!unmuted) {
    await ctx.reply(t(language, 'playback.voiceFailed', { error: 'Unmute tidak didukung atau gagal di voice adapter.' }));
    return;
  }
  await ctx.reply(t(language, 'playback.unmuted'));
}


export async function seekHandler(ctx) {
  if (!(await checkDjMode(ctx))) return;
  const language = await getUserLanguage(ctx.from.id);
  const active = voicePlayer.activeTrack(ctx.chat.id) ?? chatCache.current(ctx.chat.id);
  if (!active) {
    await ctx.reply(t(language, 'playback.noActive'));
    return;
  }
  const parsed = parseSeekValue(commandArgs(ctx));
  if (!parsed) {
    await ctx.reply(t(language, 'playback.seekUsage'));
    return;
  }
  const currentElapsed = active.startedAt ? Math.max(0, Math.floor((Date.now() - new Date(active.startedAt).getTime()) / 1000)) : 0;
  const target = parsed.absolute ? parsed.seconds : currentElapsed + parsed.seconds;
  const duration = Number(active.duration) || 0;
  if (target < 0 || (duration > 0 && target > duration)) {
    await ctx.reply(t(language, 'playback.seekOutOfRange'));
    return;
  }
  const updated = await voicePlayer.seek(ctx.chat.id, target);
  if (!updated) {
    await ctx.reply(t(language, 'playback.voiceFailed', { error: 'Gagal memindahkan posisi playback.' }));
    return;
  }

  // Resync lyrics runner position after seek
  resyncLyricsForChat(ctx.chat.id);

  await ctx.reply(t(language, 'playback.seeked', { position: secondsToClock(target) }));
}

export async function volumeHandler(ctx) {
  if (!(await checkDjMode(ctx))) return;
  const language = await getUserLanguage(ctx.from.id);
  const value = Number(commandArgs(ctx));
  if (!Number.isFinite(value)) {
    await ctx.reply(t(language, 'playback.volumeUsage'));
    return;
  }
  const { applied, saved, volume } = await voicePlayer.setVolume(ctx.chat.id, value);
  if (!applied && !saved) {
    await ctx.reply(t(language, 'playback.voiceFailed', { error: 'Gagal menerapkan volume pada stream aktif.' }));
    return;
  }
  await ctx.reply(t(language, 'playback.volumeSet', { volume }));
}

export async function shuffleHandler(ctx) {
  if (!(await checkDjMode(ctx))) return;
  const language = await getUserLanguage(ctx.from.id);
  if (chatCache.getQueueLength(ctx.chat.id) <= 2) {
    await ctx.reply(t(language, 'playback.shuffleNotEnough'));
    return;
  }
  chatCache.shuffleUpcoming(ctx.chat.id);
  await ctx.reply(t(language, 'playback.shuffleDone'));
}
export async function speedHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const requestedSpeed = Number(commandArgs(ctx));
  if (!Number.isFinite(requestedSpeed)) {
    await ctx.reply('Gunakan: /speed <angka 0.25 - 4>');
    return;
  }
  const speed = await voicePlayer.setSpeed(ctx.chat.id, requestedSpeed);
  if (!speed) {
    if (!chatCache.current(ctx.chat.id)) {
      await ctx.reply(t(language, 'playback.nothingPlaying'));
      return;
    }
    await ctx.reply(t(language, 'playback.voiceFailed', { error: 'Speed tidak didukung atau gagal di voice adapter.' }));
    return;
  }
  await ctx.reply(t(language, 'playback.speedSet', { speed }));
}


export async function searchSelectionPageHandler(ctx) {
  const data = ctx.callbackQuery?.data ?? '';
  const [, token, pageText] = data.split(':');
  const selection = searchCache.get(token);
  if (!selection) {
    await ctx.answerCallbackQuery({ text: 'Hasil pencarian sudah kedaluwarsa. Jalankan /play lagi.' }).catch(() => {});
    await ctx.editMessageText('Hasil pencarian sudah kedaluwarsa. Jalankan /play lagi.').catch(() => {});
    return;
  }

  if (selection.userId && selection.userId !== ctx.from?.id) {
    await ctx.answerCallbackQuery({ text: 'Hanya requester yang bisa memilih hasil ini.' }).catch(() => {});
    return;
  }

  const page = Number.parseInt(pageText, 10) || 0;
  const totalResults = selection.results?.length ?? 0;
  const maxPage = Math.max(0, totalResults - 1);
  const boundedPage = Math.max(0, Math.min(page, maxPage));

  await ctx.answerCallbackQuery().catch(() => {});
  await updateSearchSelectionMessage(ctx, token, selection, boundedPage);
}

export async function searchSelectionPickHandler(ctx) {
  const data = ctx.callbackQuery?.data ?? '';
  const [, token, indexText] = data.split(':');
  const selection = searchCache.get(token);
  if (!selection) {
    await ctx.answerCallbackQuery({ text: 'Hasil pencarian sudah kedaluwarsa. Jalankan /play lagi.' }).catch(() => {});
    await ctx.editMessageText('Hasil pencarian sudah kedaluwarsa. Jalankan /play lagi.').catch(() => {});
    return;
  }

  if (selection.userId && selection.userId !== ctx.from?.id) {
    await ctx.answerCallbackQuery({ text: 'Hanya requester yang bisa memilih hasil ini.' }).catch(() => {});
    return;
  }

  const index = Number.parseInt(indexText, 10);
  const totalResults = selection.results?.length ?? 0;
  if (Number.isNaN(index) || index < 0 || index >= totalResults) {
    await ctx.answerCallbackQuery({ text: 'Pilihan tidak valid.' }).catch(() => {});
    return;
  }
  const track = selection.results[index];
  if (!track) {
    await ctx.answerCallbackQuery({ text: 'Pilihan tidak valid.' }).catch(() => {});
    return;
  }

  const chatId = ctx.chat?.id;
  if (chatId) {
    const queueLimit = await getQueueLimitForContext(ctx);
    if (chatCache.getQueueLength(chatId) >= queueLimit) {
      await ctx.answerCallbackQuery({ text: `Antrean penuh! Maksimal ${queueLimit} lagu.` }).catch(() => {});
      const statusMessage = ctx.callbackQuery.message;
      await editStatus(ctx, statusMessage, `Gagal memutar: Antrean penuh! Maksimal ${queueLimit} lagu.`).catch(() => {});
      return;
    }
  }

  searchCache.delete(token);
  await ctx.answerCallbackQuery({ text: `Dipilih: ${track.name}` }).catch(() => {});

  let statusMessage = ctx.callbackQuery.message;
  if (selection.hasPhoto) {
    try {
      await ctx.api.deleteMessage(ctx.chat.id, statusMessage.message_id).catch(() => {});
      statusMessage = await ctx.reply(`Dipilih: ${htmlEscape(track.name)}`, { parse_mode: 'HTML' });
    } catch (e) {
      console.warn('Failed to delete selection photo and send text status:', e.message);
    }
  } else {
    await editStatus(ctx, statusMessage, `Dipilih: ${htmlEscape(track.name)}`, { parse_mode: 'HTML' }).catch(() => {});
  }

  const defaultService = await getUserDefaultService(ctx.from?.id);
  enqueueChatTask(ctx.chat.id, 'Proses pilihan search', () => queueAndMaybePlay(ctx, statusMessage, track, Boolean(selection.isVideo), selection.language, defaultService));
}

async function safeDeleteSearchMessage(ctx, fallbackText) {
  try {
    await ctx.deleteMessage();
    return true;
  } catch (error) {
    console.warn('Failed to delete search message:', error.message);
    try {
      const currentMessage = ctx.callbackQuery?.message;
      if (currentMessage) {
        if (currentMessage.text) {
          await ctx.editMessageText(fallbackText, { reply_markup: undefined });
        } else {
          await ctx.editMessageCaption({ caption: fallbackText, reply_markup: undefined });
        }
      }
    } catch (editError) {
      console.warn('Fallback edit failed:', editError.message);
    }
    return false;
  }
}

export async function searchSelectionCancelHandler(ctx) {
  const data = ctx.callbackQuery?.data ?? '';
  const [, token] = data.split(':');
  const selection = searchCache.get(token);

  if (!selection) {
    await safeDeleteSearchMessage(ctx, 'Hasil pencarian sudah kedaluwarsa.');
    await ctx.answerCallbackQuery({ text: 'Hasil pencarian sudah kedaluwarsa.' }).catch(() => {});
    return;
  }

  if (selection.userId && selection.userId !== ctx.from?.id) {
    await ctx.answerCallbackQuery({ text: 'Hanya requester yang bisa menutup hasil ini.' }).catch(() => {});
    return;
  }

  searchCache.delete(token);
  
  await safeDeleteSearchMessage(ctx, 'Pencarian ditutup.');
  await ctx.answerCallbackQuery({ text: 'Pencarian ditutup.' }).catch(() => {});
}


export const __appleTestHooks = { formatSearchSelection, formatYouTubeSearchResult, formatAppleMusicSearchResult, formatSpotifySearchResult, formatSoundCloudSearchResult, formatTrack };
