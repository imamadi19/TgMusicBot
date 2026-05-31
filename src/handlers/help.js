import { getUserLanguage, setUserLanguage } from '../core/db/user-settings.js';
import fs from 'node:fs';
import path from 'node:path';
import { InputFile } from 'grammy';
import { isSupportedLanguage, languageName, t } from '../i18n/index.js';
import { backKeyboard, helpKeyboard, languageKeyboard, mainKeyboard, privateStartKeyboard, groupStartKeyboard, backToStartKeyboard } from './keyboards.js';
import { config } from '../config/index.js';
import { firstName } from '../utils/extras.js';
import { htmlEscape } from '../utils/telegram.js';
import { isPremiumActive } from '../core/db/premium.js';
import { getPremiumSettings } from '../core/db/premium-settings.js';

// ==========================================
// 1. HELPERS
// ==========================================

export async function safeAnswerCallback(ctx, text = '', options = {}) {
  try {
    await ctx.answerCallbackQuery(text ? { text, ...options } : undefined);
  } catch {}
}

export function isPhotoMessage(message) {
  return Boolean(message?.photo || message?.caption);
}

export async function editStartPanel(ctx, text, options = {}) {
  const message = ctx.callbackQuery?.message;
  const finalOptions = {
    parse_mode: 'HTML',
    ...options,
  };

  try {
    if (message?.caption !== undefined) {
      // Panel berupa photo/banner
      const caption = String(text).slice(0, 1024);
      await ctx.editMessageCaption({
        caption,
        ...finalOptions,
      });
      return true;
    }

    if (message?.text !== undefined) {
      await ctx.editMessageText(text, finalOptions);
      return true;
    }
  } catch (error) {
    const desc = String(error?.description || error?.message || '').toLowerCase();
    if (desc.includes('message is not modified')) return true;
  }

  // fallback terakhir saja
  try {
    await ctx.reply(text, finalOptions);
    return false;
  } catch {
    return false;
  }
}

export async function deleteStartPanel(ctx) {
  try {
    await ctx.deleteMessage();
    return true;
  } catch {
    try {
      await ctx.editMessageReplyMarkup({ reply_markup: undefined });
      return false;
    } catch {
      try {
        await editStartPanel(ctx, 'Menu ditutup.', { reply_markup: undefined });
        return false;
      } catch {
        return false;
      }
    }
  }
}

// Keep for compatibility
async function editOrReplyCallbackMessage(ctx, text, options = {}) {
  return editStartPanel(ctx, text, options);
}

function helpCategories(language) {
  return {
    help_user: [t(language, 'help.userTitle'), t(language, 'help.userContent')],
    help_admin: [t(language, 'help.adminTitle'), t(language, 'help.adminContent')],
    help_devs: [t(language, 'help.devTitle'), t(language, 'help.devContent')],
    help_owner: [t(language, 'help.ownerTitle'), t(language, 'help.ownerContent')],
    help_playlist: [t(language, 'help.playlistTitle'), t(language, 'help.playlistContent')],
  };
}

async function sendStartMessage(ctx, text, image, options) {
  if (image) {
    try {
      const photo = image.startsWith('http') ? image : new InputFile(image);
      await ctx.replyWithPhoto(photo, { caption: text, ...options });
      return;
    } catch (err) {
      console.error('Failed to send start image:', err);
    }
  }
  await ctx.reply(text, options);
}

// ==========================================
// 2. TEXT BUILDERS
// ==========================================

export async function buildPrivateStartText(ctx, language) {
  const name = firstName(ctx);
  const escapedName = htmlEscape(name);

  if (String(language).startsWith('id')) {
    return `🎧 <b>Selamat datang di TgMusicBot</b>\n\n` +
      `Hai, <b>${escapedName}</b>!\n` +
      `Aku bisa membantu memutar musik dan video ke voice chat grup Telegram.\n\n` +
      `🚀 <b>Cara mulai:</b>\n` +
      `1. Tambahkan bot ke grup\n` +
      `2. Tambahkan assistant/userbot ke grup\n` +
      `3. Aktifkan voice chat\n` +
      `4. Ketik <code>/play nama lagu</code>\n\n` +
      `✨ <b>Fitur utama:</b>\n` +
      `• Audio & video playback\n` +
      `• YouTube / Spotify / Apple Music / SoundCloud\n` +
      `• Playlist pribadi\n` +
      `• Queue control\n` +
      `• Premium audio preset\n` +
      `• DJ mode untuk grup\n\n` +
      `Pilih menu di bawah:`;
  } else {
    return `🎧 <b>Welcome to TgMusicBot</b>\n\n` +
      `Hi, <b>${escapedName}</b>!\n` +
      `I can help play music and videos in Telegram group voice chats.\n\n` +
      `🚀 <b>How to start:</b>\n` +
      `1. Add the bot to your group\n` +
      `2. Add the assistant/userbot to the group\n` +
      `3. Start the voice chat\n` +
      `4. Type <code>/play song name</code>\n\n` +
      `✨ <b>Main features:</b>\n` +
      `• Audio & video playback\n` +
      `• YouTube / Spotify / Apple Music / SoundCloud\n` +
      `• Personal playlists\n` +
      `• Queue control\n` +
      `• Premium audio presets\n` +
      `• DJ mode for groups\n\n` +
      `Choose a menu below:`;
  }
}

export async function buildGroupStartText(ctx, language) {
  const chatId = ctx.chat?.id;
  let chatPremium = false;
  let premiumStatus = 'inactive';
  let queueLimit = 10;
  let djMode = 'OFF';
  let audioPreset = 'normal';

  if (chatId) {
    try {
      chatPremium = await isPremiumActive('chat', chatId);
      premiumStatus = chatPremium ? 'Active' : 'inactive';
      queueLimit = chatPremium ? config.premiumQueueLimit : 10;

      const settings = await getPremiumSettings(chatId);
      djMode = settings.djMode ? 'ON' : 'OFF';
      audioPreset = settings.audioPreset || 'normal';
    } catch (error) {
      console.error('Failed to get group status for start text builder:', error);
      // Fallback
      premiumStatus = 'inactive';
      queueLimit = 10;
      djMode = 'OFF';
      audioPreset = 'normal';
    }
  }

  if (String(language).startsWith('id')) {
    return `🎶 <b>TgMusicBot aktif di grup ini!</b>\n\n` +
      `Siap memutar musik ke voice chat.\n\n` +
      `📌 <b>Status grup:</b>\n` +
      `• Queue limit: <b>${queueLimit}</b>\n` +
      `• DJ Mode: <b>${djMode}</b>\n` +
      `• Preset: <b>${audioPreset}</b>\n` +
      `• Premium: <b>${premiumStatus}</b>\n\n` +
      `Gunakan tombol di bawah untuk bantuan cepat.`;
  } else {
    return `🎶 <b>TgMusicBot is active in this group!</b>\n\n` +
      `Ready to play music in voice chat.\n\n` +
      `📌 <b>Group status:</b>\n` +
      `• Queue limit: <b>${queueLimit}</b>\n` +
      `• DJ Mode: <b>${djMode}</b>\n` +
      `• Preset: <b>${audioPreset}</b>\n` +
      `• Premium: <b>${premiumStatus}</b>\n\n` +
      `Use the buttons below for quick help.`;
  }
}

// ==========================================
// 3. COMMAND HANDLER
// ==========================================

export async function startHandler(ctx) {
  const isPrivate = ctx.chat?.type === 'private';
  const language = await getUserLanguage(ctx.from?.id);

  if (isPrivate) {
    const text = await buildPrivateStartText(ctx, language);
    const localStartImage = path.resolve('src/core/db/logo.jpg');
    const startImage = config.startImg || (fs.existsSync(localStartImage) ? localStartImage : '');

    const options = {
      parse_mode: 'HTML',
      reply_markup: privateStartKeyboard(language),
    };

    await sendStartMessage(ctx, text, startImage, options);
  } else {
    const text = await buildGroupStartText(ctx, language);
    const groupStartImage = config.groupStartImg || config.startImg;

    const options = {
      parse_mode: 'HTML',
      reply_markup: groupStartKeyboard(language),
    };

    await sendStartMessage(ctx, text, groupStartImage, options);
  }
}

// ==========================================
// 4. CALLBACK HANDLERS
// ==========================================

export async function startHomeHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const isPrivate = ctx.chat?.type === 'private';

  await safeAnswerCallback(ctx);

  if (isPrivate) {
    const text = await buildPrivateStartText(ctx, language);
    await editStartPanel(ctx, text, {
      reply_markup: privateStartKeyboard(language),
    });
  } else {
    const text = await buildGroupStartText(ctx, language);
    await editStartPanel(ctx, text, {
      reply_markup: groupStartKeyboard(language),
    });
  }
}

export async function startCloseHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const closeText = String(language).startsWith('id') ? 'Ditutup.' : 'Closed.';
  await safeAnswerCallback(ctx, closeText);
  await deleteStartPanel(ctx);
}

export async function startSettingsHintHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  await safeAnswerCallback(ctx);

  let text;
  if (String(language).startsWith('id')) {
    text = `⚙️ <b>Pengaturan</b>\n\n` +
      `Gunakan perintah <code>/settings</code> untuk membuka menu pengaturan bot.`;
  } else {
    text = `⚙️ <b>Settings</b>\n\n` +
      `Use the <code>/settings</code> command to open the bot settings menu.`;
  }

  await editStartPanel(ctx, text, {
    reply_markup: backToStartKeyboard(language),
  });
}

export async function startSetupHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  await safeAnswerCallback(ctx);

  let text;
  if (String(language).startsWith('id')) {
    text = `🚀 <b>Panduan Setup TgMusicBot</b>\n\n` +
      `1. <b>Tambahkan bot ke grup</b>\n` +
      `Jadikan bot admin jika grup membatasi pesan/command.\n\n` +
      `2. <b>Tambahkan assistant</b>\n` +
      `Assistant/userbot harus ada di grup agar bisa join voice chat.\n\n` +
      `3. <b>Aktifkan voice chat</b>\n` +
      `Mulai voice chat/video chat di grup.\n\n` +
      `4. <b>Putar lagu</b>\n` +
      `Gunakan <code>/play judul lagu</code>.`;
  } else {
    text = `🚀 <b>TgMusicBot Setup Guide</b>\n\n` +
      `1. <b>Add the bot to your group</b>\n` +
      `Promote the bot to admin if the group restricts messages/commands.\n\n` +
      `2. <b>Add the assistant</b>\n` +
      `The assistant/userbot must be in the group to join the voice chat.\n\n` +
      `3. <b>Start the voice chat</b>\n` +
      `Start the voice chat/video chat in the group.\n\n` +
      `4. <b>Play a song</b>\n` +
      `Use <code>/play song title</code>.`;
  }

  await editStartPanel(ctx, text, {
    reply_markup: backToStartKeyboard(language),
  });
}

export async function startFeaturesHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  await safeAnswerCallback(ctx);

  let text;
  if (String(language).startsWith('id')) {
    text = `🎵 <b>Fitur Musik</b>\n\n` +
      `• Audio & video playback\n` +
      `• YouTube / Spotify / Apple Music / SoundCloud\n` +
      `• Queue control\n` +
      `• Playlist pribadi\n` +
      `• Premium audio preset\n` +
      `• DJ mode untuk grup`;
  } else {
    text = `🎵 <b>Music Features</b>\n\n` +
      `• Audio & video playback\n` +
      `• YouTube / Spotify / Apple Music / SoundCloud\n` +
      `• Queue control\n` +
      `• Personal playlists\n` +
      `• Premium audio presets\n` +
      `• DJ mode for groups`;
  }

  await editStartPanel(ctx, text, {
    reply_markup: backToStartKeyboard(language),
  });
}

export async function startPlaylistHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  await safeAnswerCallback(ctx);

  let text;
  if (String(language).startsWith('id')) {
    text = `🎼 <b>Playlist Pribadi</b>\n\n` +
      `Gunakan:\n` +
      `<code>/cplist nama</code>\n` +
      `<code>/addtoplaylist id/url</code>\n` +
      `<code>/myplaylists</code>\n` +
      `<code>/deleteplaylist id</code>`;
  } else {
    text = `🎼 <b>Personal Playlists</b>\n\n` +
      `Use:\n` +
      `<code>/cplist name</code>\n` +
      `<code>/addtoplaylist id/url</code>\n` +
      `<code>/myplaylists</code>\n` +
      `<code>/deleteplaylist id</code>`;
  }

  await editStartPanel(ctx, text, {
    reply_markup: backToStartKeyboard(language),
  });
}

export async function startPremiumHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  await safeAnswerCallback(ctx);

  let text;
  if (String(language).startsWith('id')) {
    text = `⭐ <b>Premium</b>\n\n` +
      `• Queue limit lebih besar\n` +
      `• /qmove untuk memindahkan antrean\n` +
      `• /setpreset normal/bass/nightcore/vaporwave\n` +
      `• /djmode on/off\n` +
      `• /premiuminfo untuk melihat status`;
  } else {
    text = `⭐ <b>Premium</b>\n\n` +
      `• Larger queue limits\n` +
      `• /qmove to move queue items\n` +
      `• /setpreset normal/bass/nightcore/vaporwave\n` +
      `• /djmode on/off\n` +
      `• /premiuminfo to check status`;
  }

  await editStartPanel(ctx, text, {
    reply_markup: backToStartKeyboard(language),
  });
}

export async function groupPlayHintHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  await safeAnswerCallback(ctx);

  let text;
  if (String(language).startsWith('id')) {
    text = `▶️ <b>Putar Musik</b>\n\n` +
      `Gunakan:\n` +
      `<code>/play judul lagu</code>\n\n` +
      `Contoh:\n` +
      `<code>/play faded alan walker</code>\n\n` +
      `Tips:\n` +
      `Mulai voice chat dulu sebelum memutar lagu.`;
  } else {
    text = `▶️ <b>Play Music</b>\n\n` +
      `Use:\n` +
      `<code>/play song title</code>\n\n` +
      `Example:\n` +
      `<code>/play faded alan walker</code>\n\n` +
      `Tip:\n` +
      `Start the voice chat before playing music.`;
  }

  await editStartPanel(ctx, text, {
    reply_markup: backToStartKeyboard(language),
  });
}

export async function groupVplayHintHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  await safeAnswerCallback(ctx);

  let text;
  if (String(language).startsWith('id')) {
    text = `🎬 <b>Putar Video</b>\n\n` +
      `Gunakan:\n` +
      `<code>/vplay judul video</code>\n\n` +
      `Contoh:\n` +
      `<code>/vplay faded alan walker official video</code>\n\n` +
      `Tips:\n` +
      `Mulai video chat/voice chat dulu sebelum memutar video.`;
  } else {
    text = `🎬 <b>Play Video</b>\n\n` +
      `Use:\n` +
      `<code>/vplay video title</code>\n\n` +
      `Example:\n` +
      `<code>/vplay faded alan walker official video</code>\n\n` +
      `Tip:\n` +
      `Start the voice chat / video chat before playing video.`;
  }

  await editStartPanel(ctx, text, {
    reply_markup: backToStartKeyboard(language),
  });
}

export async function groupQueueHintHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  await safeAnswerCallback(ctx);

  let text;
  if (String(language).startsWith('id')) {
    text = `📜 <b>Queue</b>\n\n` +
      `Gunakan:\n` +
      `<code>/queue</code>\n\n` +
      `Command ini menampilkan daftar lagu yang sedang antre di grup.`;
  } else {
    text = `📜 <b>Queue</b>\n\n` +
      `Use:\n` +
      `<code>/queue</code>\n\n` +
      `This command displays the list of songs currently in the group queue.`;
  }

  await editStartPanel(ctx, text, {
    reply_markup: backToStartKeyboard(language),
  });
}

export async function groupSkipHintHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  await safeAnswerCallback(ctx);

  let text;
  if (String(language).startsWith('id')) {
    text = `⏭ <b>Skip</b>\n\n` +
      `Gunakan:\n` +
      `<code>/skip</code>\n\n` +
      `Command ini melewati lagu yang sedang diputar.\n` +
      `Jika DJ Mode aktif, hanya admin/auth/premium user yang bisa memakai kontrol ini.`;
  } else {
    text = `⏭ <b>Skip</b>\n\n` +
      `Use:\n` +
      `<code>/skip</code>\n\n` +
      `This command skips the currently playing song.\n` +
      `If DJ Mode is active, only admin/auth/premium users can use this control.`;
  }

  await editStartPanel(ctx, text, {
    reply_markup: backToStartKeyboard(language),
  });
}

export async function groupDjmodeHintHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  await safeAnswerCallback(ctx);

  let text;
  if (String(language).startsWith('id')) {
    text = `🎧 <b>DJ Mode</b>\n\n` +
      `Gunakan:\n` +
      `<code>/djmode on</code>\n` +
      `<code>/djmode off</code>\n\n` +
      `Saat aktif, kontrol seperti skip, stop, seek, volume, shuffle, dan qmove hanya bisa dipakai admin/auth/premium user.`;
  } else {
    text = `🎧 <b>DJ Mode</b>\n\n` +
      `Use:\n` +
      `<code>/djmode on</code>\n` +
      `<code>/djmode off</code>\n\n` +
      `When active, controls like skip, stop, seek, volume, shuffle, and qmove can only be used by admin/auth/premium users.`;
  }

  await editStartPanel(ctx, text, {
    reply_markup: backToStartKeyboard(language),
  });
}

export async function languageMenuHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const text = `${t(language, 'language.current', { language: languageName(language) })}\n\n${t(language, 'language.choose')}`;
  
  if (ctx.callbackQuery) {
    await safeAnswerCallback(ctx, t(language, 'buttons.chooseLanguage'));
    const options = {
      parse_mode: 'HTML',
      reply_markup: languageKeyboard(language, { includeBack: true }),
    };
    await editStartPanel(ctx, text, options);
    return;
  }

  const options = { parse_mode: 'HTML', reply_markup: languageKeyboard(language) };
  await ctx.reply(text, options);
}

export async function languageSelectHandler(ctx) {
  const selected = ctx.callbackQuery.data.replace('lang_', '');
  const currentLanguage = await getUserLanguage(ctx.from?.id);
  if (!isSupportedLanguage(selected)) {
    await ctx.answerCallbackQuery({ text: t(currentLanguage, 'language.invalid'), show_alert: true });
    return;
  }
  await setUserLanguage(ctx.from?.id, selected);

  const savedText = String(selected).startsWith('id') ? 'Bahasa disimpan.' : 'Language saved.';
  await safeAnswerCallback(ctx, savedText);

  // Check if callback originates from the start panel
  const message = ctx.callbackQuery?.message;
  const replyMarkup = message?.reply_markup;
  const hasStartHome = replyMarkup?.inline_keyboard?.some(row =>
    row.some(button => button.callback_data === 'start_home')
  );

  if (hasStartHome) {
    const isPrivate = ctx.chat?.type === 'private';
    if (isPrivate) {
      const text = await buildPrivateStartText(ctx, selected);
      await editStartPanel(ctx, text, {
        reply_markup: privateStartKeyboard(selected),
      });
    } else {
      const text = await buildGroupStartText(ctx, selected);
      await editStartPanel(ctx, text, {
        reply_markup: groupStartKeyboard(selected),
      });
    }
  } else {
    // Fallback/standard behavior
    await editOrReplyCallbackMessage(ctx, `${t(selected, 'language.saved', { language: languageName(selected) })}\n\n${t(selected, 'start.text', { name: ctx.from?.first_name ?? t(selected, 'general.user'), botName: ctx.me.first_name })}`, {
      parse_mode: 'HTML',
      reply_markup: mainKeyboard(selected),
    });
  }
}

export async function helpCallback(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const data = ctx.callbackQuery.data;
  if (data === 'help_all') {
    await ctx.answerCallbackQuery(t(language, 'general.openingHelp'));
    await editOrReplyCallbackMessage(ctx, t(language, 'general.chooseHelp'), { reply_markup: helpKeyboard(language) });
    return;
  }
  const category = helpCategories(language)[data];
  if (!category) {
    await ctx.answerCallbackQuery({ text: t(language, 'general.unknownHelp'), show_alert: true });
    return;
  }
  const [title, content] = category;
  await ctx.answerCallbackQuery(title);
  await editOrReplyCallbackMessage(ctx, `<b>${title}</b>\n\n${content}\n\n<i>${t(language, 'general.useBack')}</i>`, {
    parse_mode: 'HTML',
    reply_markup: backKeyboard(language),
  });
}
