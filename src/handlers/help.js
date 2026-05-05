import { backKeyboard, helpKeyboard } from './keyboards.js';

export const helpCategories = {
  help_user: ['User Commands', '<b>Playback:</b>\n• <code>/play [song]</code> — Play a track\n• <code>/vplay [song]</code> — Play as video\n\n<b>Utilities:</b>\n• <code>/start</code> — Start the bot\n• <code>/privacy</code> — View privacy policy\n• <code>/queue</code> — Show current queue'],
  help_admin: ['Admin Commands', '<b>Controls:</b>\n• <code>/skip</code> — Skip current track\n• <code>/pause</code> — Pause playback\n• <code>/resume</code> — Resume playback\n• <code>/seek [sec]</code> — Seek marker\n\n<b>Queue:</b>\n• <code>/remove [x]</code> — Remove a track\n• <code>/loop [0-10]</code> — Set loop count'],
  help_devs: ['Developer Commands', '<b>System:</b>\n• <code>/stats</code> — Show usage statistics\n• <code>/av</code> — Active voice chats'],
  help_owner: ['Owner Commands', '<b>Maintenance:</b>\n• <code>/broadcast [text]</code> — Broadcast message\n• <code>/logger</code> — Show logger chat\n• <code>/settings</code> — Chat settings'],
  help_playlist: ['Playlist Commands', '<b>Management:</b>\n• <code>/createplaylist [name]</code> — Create playlist\n• <code>/deleteplaylist [id]</code> — Delete playlist\n• <code>/addtoplaylist [id] [url]</code> — Add track\n• <code>/removefromplaylist [id] [trackId]</code> — Remove track\n• <code>/playlistinfo [id]</code> — Show playlist\n• <code>/myplaylists</code> — List playlists'],
};

export async function startHandler(ctx) {
  const name = ctx.from?.first_name ?? 'User';
  const botName = ctx.me.first_name;
  await ctx.reply(`Hello ${name},\n\nI am ${botName}, a JavaScript Telegram music player.\n\n<b>Supported platforms:</b> YouTube, Spotify, Apple Music, JioSaavn, SoundCloud.\n\nUse the buttons below to explore available commands.`, {
    parse_mode: 'HTML',
    reply_markup: helpKeyboard(),
  });
}

export async function helpCallback(ctx) {
  const data = ctx.callbackQuery.data;
  if (data === 'help_all') {
    await ctx.answerCallbackQuery('Opening help menu...');
    await ctx.editMessageText('Choose a help category:', { reply_markup: helpKeyboard() });
    return;
  }
  const category = helpCategories[data];
  if (!category) {
    await ctx.answerCallbackQuery({ text: 'Unknown help category.', show_alert: true });
    return;
  }
  const [title, content] = category;
  await ctx.answerCallbackQuery(title);
  await ctx.editMessageText(`<b>${title}</b>\n\n${content}\n\n<i>Use the button below to go back.</i>`, {
    parse_mode: 'HTML',
    reply_markup: backKeyboard(),
  });
}
