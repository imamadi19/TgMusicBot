import sys
with open('/root/bott/src/handlers/playlists.js', 'r') as f:
    content = f.read()

bad = """  const playlist = await getPlaylist(playlistId);
  if (!playlist) {
  if (!playlist || playlist.ownerId !== ctx.from.id) {
    await ctx.reply(t(language, 'playlist.notFound'));
    return;
  }
  await ctx.reply(`<b>${htmlEscape(playlist.name)}</b>\\nID: <code>${playlist.playlistId}</code>\\n\\n${htmlEscape(songs)}`, { parse_mode: 'HTML' });
}"""

good = """  const playlist = await getPlaylist(playlistId);
  if (!playlist || playlist.ownerId !== ctx.from.id) {
    await ctx.reply(t(language, 'playlist.notFound'));
    return;
  }
  const songs = playlist.songs?.map((song, index) => `${index + 1}. ${song.name} (${song.trackId})`).join('\\n') || t(language, 'playlist.empty');
  await ctx.reply(`<b>${htmlEscape(playlist.name)}</b>\\nID: <code>${playlist.playlistId}</code>\\n\\n${htmlEscape(songs)}`, { parse_mode: 'HTML' });
}"""

content = content.replace(bad, good)

with open('/root/bott/src/handlers/playlists.js', 'w') as f:
    f.write(content)
