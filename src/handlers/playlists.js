import { addSongToPlaylist, createPlaylist, deletePlaylist, getPlaylist, listPlaylists, removeSongFromPlaylist } from '../core/db/playlists.js';
import { getUserLanguage } from '../core/db/user-settings.js';
import { Downloader } from '../core/dl/downloader.js';
import { t } from '../i18n/index.js';
import { commandArgs, htmlEscape } from '../utils/telegram.js';

export async function createPlaylistHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const name = commandArgs(ctx);
  if (!name) {
    await ctx.reply(t(language, 'playlist.createUsage'));
    return;
  }
  const playlist = await createPlaylist(ctx.from.id, name);
  await ctx.reply(t(language, 'playlist.created', { name: playlist.name, id: playlist.playlistId }), { parse_mode: 'HTML' });
}

export async function deletePlaylistHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const playlistId = commandArgs(ctx);
  if (!playlistId) {
    await ctx.reply(t(language, 'playlist.deleteUsage'));
    return;
  }
  const deleted = await deletePlaylist(ctx.from.id, playlistId);
  await ctx.reply(deleted ? t(language, 'playlist.deleted') : t(language, 'playlist.notFound'));
}

export async function addToPlaylistHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const [playlistId, ...queryParts] = commandArgs(ctx).split(/\s+/);
  const query = queryParts.join(' ');
  if (!playlistId || !query) {
    await ctx.reply(t(language, 'playlist.addUsage'));
    return;
  }
  const downloader = new Downloader(query);
  const info = await downloader.getInfo();
  const song = info.results?.[0];
  if (!song) {
    await ctx.reply(t(language, 'playlist.noTrack'));
    return;
  }
  const playlist = await addSongToPlaylist(ctx.from.id, playlistId, song);
  await ctx.reply(playlist ? t(language, 'playlist.added', { song: song.name, playlist: playlist.name }) : t(language, 'playlist.notFound'));
}

export async function removeFromPlaylistHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const [playlistId, trackId] = commandArgs(ctx).split(/\s+/);
  if (!playlistId || !trackId) {
    await ctx.reply(t(language, 'playlist.removeUsage'));
    return;
  }
  const playlist = await removeSongFromPlaylist(ctx.from.id, playlistId, trackId);
  await ctx.reply(playlist ? t(language, 'playlist.removed') : t(language, 'playlist.notFound'));
}

export async function playlistInfoHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const playlistId = commandArgs(ctx);
  if (!playlistId) {
    await ctx.reply(t(language, 'playlist.infoUsage'));
    return;
  }
  const playlist = await getPlaylist(playlistId);
  if (!playlist) {
    await ctx.reply(t(language, 'playlist.notFound'));
    return;
  }
  const songs = playlist.songs?.map((song, index) => `${index + 1}. ${song.name} (${song.trackId})`).join('\n') || t(language, 'playlist.empty');
  await ctx.reply(`<b>${htmlEscape(playlist.name)}</b>\nID: <code>${playlist.playlistId}</code>\n\n${htmlEscape(songs)}`, { parse_mode: 'HTML' });
}

export async function myPlaylistsHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const playlists = await listPlaylists(ctx.from.id);
  if (playlists.length === 0) {
    await ctx.reply(t(language, 'playlist.none'));
    return;
  }
  await ctx.reply(playlists.map((playlist) => `${playlist.name}: ${playlist.playlistId} (${playlist.songs?.length ?? 0} ${t(language, 'playlist.trackCount')})`).join('\n'));
}
