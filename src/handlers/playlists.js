import { addSongToPlaylist, createPlaylist, deletePlaylist, getPlaylist, listPlaylists, removeSongFromPlaylist } from '../core/db/playlists.js';
import { Downloader } from '../core/dl/downloader.js';
import { commandArgs, htmlEscape } from '../utils/telegram.js';

export async function createPlaylistHandler(ctx) {
  const name = commandArgs(ctx);
  if (!name) {
    await ctx.reply('Usage: /createplaylist [name]');
    return;
  }
  const playlist = await createPlaylist(ctx.from.id, name);
  await ctx.reply(`✅ Playlist created.\nName: ${playlist.name}\nID: <code>${playlist.playlistId}</code>`, { parse_mode: 'HTML' });
}

export async function deletePlaylistHandler(ctx) {
  const playlistId = commandArgs(ctx);
  if (!playlistId) {
    await ctx.reply('Usage: /deleteplaylist [playlist id]');
    return;
  }
  const deleted = await deletePlaylist(ctx.from.id, playlistId);
  await ctx.reply(deleted ? '✅ Playlist deleted.' : '❌ Playlist not found.');
}

export async function addToPlaylistHandler(ctx) {
  const [playlistId, ...queryParts] = commandArgs(ctx).split(/\s+/);
  const query = queryParts.join(' ');
  if (!playlistId || !query) {
    await ctx.reply('Usage: /addtoplaylist [playlist id] [song or URL]');
    return;
  }
  const downloader = new Downloader(query);
  const info = await downloader.getInfo();
  const song = info.results?.[0];
  if (!song) {
    await ctx.reply('No track found.');
    return;
  }
  const playlist = await addSongToPlaylist(ctx.from.id, playlistId, song);
  await ctx.reply(playlist ? `✅ Added ${song.name} to ${playlist.name}.` : '❌ Playlist not found.');
}

export async function removeFromPlaylistHandler(ctx) {
  const [playlistId, trackId] = commandArgs(ctx).split(/\s+/);
  if (!playlistId || !trackId) {
    await ctx.reply('Usage: /removefromplaylist [playlist id] [track id]');
    return;
  }
  const playlist = await removeSongFromPlaylist(ctx.from.id, playlistId, trackId);
  await ctx.reply(playlist ? '✅ Track removed.' : '❌ Playlist not found.');
}

export async function playlistInfoHandler(ctx) {
  const playlistId = commandArgs(ctx);
  if (!playlistId) {
    await ctx.reply('Usage: /playlistinfo [playlist id]');
    return;
  }
  const playlist = await getPlaylist(playlistId);
  if (!playlist) {
    await ctx.reply('❌ Playlist not found.');
    return;
  }
  const songs = playlist.songs?.map((song, index) => `${index + 1}. ${song.name} (${song.trackId})`).join('\n') || 'Empty';
  await ctx.reply(`<b>${htmlEscape(playlist.name)}</b>\nID: <code>${playlist.playlistId}</code>\n\n${htmlEscape(songs)}`, { parse_mode: 'HTML' });
}

export async function myPlaylistsHandler(ctx) {
  const playlists = await listPlaylists(ctx.from.id);
  if (playlists.length === 0) {
    await ctx.reply('You do not have playlists yet.');
    return;
  }
  await ctx.reply(playlists.map((playlist) => `${playlist.name}: ${playlist.playlistId} (${playlist.songs?.length ?? 0} tracks)`).join('\n'));
}
