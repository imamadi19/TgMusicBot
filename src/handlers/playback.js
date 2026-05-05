import { chatCache } from '../core/cache/chat-cache.js';
import { Downloader } from '../core/dl/downloader.js';
import { voicePlayer } from '../core/player/player.js';
import { getPlaylist } from '../core/db/playlists.js';
import { config } from '../config/index.js';
import { commandArgs, firstName, htmlEscape, isUrl } from '../utils/telegram.js';
import { secondsToClock } from '../utils/duration.js';
import { controlKeyboard, supportKeyboard } from './keyboards.js';

const MAX_QUEUE = 10;

function formatTrack(track, queueLength = 1) {
  return `<u><b>${queueLength > 1 ? `Added to queue: ${queueLength}` : 'Now playing'}</b></u>\n\n<b>Title:</b> <a href="${htmlEscape(track.url)}">${htmlEscape(track.name)}</a>\n\n<b>Duration:</b> ${secondsToClock(track.duration)}\n<b>Requested by:</b> ${htmlEscape(track.user)}`;
}

async function editStatus(ctx, message, text, options = {}) {
  return ctx.api.editMessageText(ctx.chat.id, message.message_id, text, options);
}

async function queueAndMaybePlay(ctx, statusMessage, track, isVideo) {
  const chatId = ctx.chat.id;
  const saveTrack = { ...track, user: firstName(ctx), isVideo, filePath: '', platform: track.platform ?? config.defaultService };
  if (chatCache.getTrackIfExists(chatId, saveTrack.trackId)) {
    await editStatus(ctx, statusMessage, 'Track already in queue or playing.');
    return;
  }
  const length = chatCache.addSong(chatId, saveTrack);
  if (length > 1) {
    await editStatus(ctx, statusMessage, formatTrack(saveTrack, length), { parse_mode: 'HTML', reply_markup: controlKeyboard(), disable_web_page_preview: true });
    return;
  }

  const downloader = new Downloader(saveTrack.url);
  try {
    saveTrack.filePath = await downloader.download(saveTrack, isVideo);
  } catch (error) {
    chatCache.shift(chatId);
    await editStatus(ctx, statusMessage, `Download failed: ${error.message}`);
    return;
  }
  await voicePlayer.play(chatId, saveTrack);
  await editStatus(ctx, statusMessage, formatTrack(saveTrack), { parse_mode: 'HTML', reply_markup: controlKeyboard(), disable_web_page_preview: true });
}

export async function playHandler(ctx, isVideo = false) {
  const chatId = ctx.chat.id;
  if (chatCache.getQueueLength(chatId) > MAX_QUEUE) {
    await ctx.reply('Queue is full (max 10 tracks). Use /end to clear.');
    return;
  }

  const input = commandArgs(ctx);
  if (!input) {
    await ctx.reply('<b>Usage:</b>\n/play [song or URL]\n\n<b>Supported Platforms:</b>\n- YouTube\n- Spotify\n- JioSaavn\n- Apple Music\n- SoundCloud', {
      parse_mode: 'HTML',
      reply_markup: supportKeyboard(),
    });
    return;
  }

  const status = await ctx.reply(input.startsWith('tgpl_') ? '🔍 Searching playlist...' : '🔍 Searching and downloading...');

  if (input.startsWith('tgpl_')) {
    const playlist = await getPlaylist(input);
    if (!playlist) {
      await editStatus(ctx, status, '❌ Playlist not found.');
      return;
    }
    if (!playlist.songs?.length) {
      await editStatus(ctx, status, '❌ Playlist is empty.');
      return;
    }
    const remaining = MAX_QUEUE - chatCache.getQueueLength(chatId);
    const tracks = playlist.songs.slice(0, remaining).map((track) => ({ ...track, user: firstName(ctx), isVideo }));
    const length = chatCache.addSongs(chatId, tracks);
    await editStatus(ctx, status, `✅ Added ${tracks.length} track(s) from playlist. Queue length: ${length}.`, { reply_markup: controlKeyboard() });
    if (length === tracks.length) await voicePlayer.play(chatId, tracks[0]);
    return;
  }

  const downloader = new Downloader(input);
  if (isUrl(input) && !downloader.isValid()) {
    await editStatus(ctx, status, 'Invalid URL or unsupported platform.\n\nSupported: YouTube, Spotify, JioSaavn, Apple Music, SoundCloud.');
    return;
  }

  let info;
  try {
    info = await downloader.getInfo();
  } catch (error) {
    await editStatus(ctx, status, `❌ Error fetching track info: ${error.message}`);
    return;
  }

  const [track] = info.results ?? [];
  if (!track) {
    await editStatus(ctx, status, 'No tracks found.');
    return;
  }
  await queueAndMaybePlay(ctx, status, track, isVideo);
}

export async function queueHandler(ctx) {
  const queue = chatCache.getQueue(ctx.chat.id);
  if (queue.length === 0) {
    await ctx.reply('Queue is empty.');
    return;
  }
  const lines = queue.map((track, index) => `${index + 1}. ${track.name} (${secondsToClock(track.duration)}) — ${track.user}`);
  await ctx.reply(`<b>Queue:</b>\n${htmlEscape(lines.join('\n'))}`, { parse_mode: 'HTML' });
}

export async function skipHandler(ctx) {
  const { skipped, next } = voicePlayer.skip(ctx.chat.id);
  if (!skipped) await ctx.reply('Nothing is playing.');
  else if (next) await ctx.reply(`Skipped: ${skipped.name}\nNow playing: ${next.name}`);
  else await ctx.reply(`Skipped: ${skipped.name}\nQueue ended.`);
}

export async function stopHandler(ctx) {
  voicePlayer.stop(ctx.chat.id);
  await ctx.reply('Stopped playback and cleared queue.');
}

export async function pauseHandler(ctx) {
  voicePlayer.pause(ctx.chat.id);
  await ctx.reply('Paused playback.');
}

export async function resumeHandler(ctx) {
  voicePlayer.resume(ctx.chat.id);
  await ctx.reply('Resumed playback.');
}

export async function removeHandler(ctx) {
  const index = Number.parseInt(commandArgs(ctx), 10) - 1;
  if (!Number.isInteger(index)) {
    await ctx.reply('Usage: /remove [queue number]');
    return;
  }
  const removed = chatCache.remove(ctx.chat.id, index);
  await ctx.reply(removed ? `Removed: ${removed.name}` : 'Invalid queue number.');
}

export async function loopHandler(ctx) {
  const count = chatCache.setLoop(ctx.chat.id, commandArgs(ctx));
  await ctx.reply(`Loop count set to ${count}.`);
}

export async function muteHandler(ctx) {
  chatCache.setMuted(ctx.chat.id, true);
  await ctx.reply('Muted playback.');
}

export async function unmuteHandler(ctx) {
  chatCache.setMuted(ctx.chat.id, false);
  await ctx.reply('Unmuted playback.');
}

export async function speedHandler(ctx) {
  const speed = chatCache.setSpeed(ctx.chat.id, commandArgs(ctx));
  await ctx.reply(`Playback speed set to ${speed}x.`);
}

export async function activeVcHandler(ctx) {
  const active = voicePlayer.activeCalls();
  await ctx.reply(active.length ? active.map(({ chatId, track }) => `${chatId}: ${track.name}`).join('\n') : 'No active voice chats.');
}
