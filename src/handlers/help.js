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
import { queueHandler } from './playback.js';


async function editOrReplyCallbackMessage(ctx, text, options = {}) {
  const currentMessage = ctx.callbackQuery?.message;
  if (currentMessage?.text) {
    await ctx.editMessageText(text, options);
    return;
  }
  if (currentMessage?.caption) {
    await ctx.editMessageCaption({ caption: text, ...options });
    return;
  }
  await ctx.reply(text, options);
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

export async function startHandler(ctx) {
  const isPrivate = ctx.chat?.type === 'private';
  const language = await getUserLanguage(ctx.from?.id);

  if (isPrivate) {
    const name = firstName(ctx);
    const escapedName = htmlEscape(name);
    
    const text = `🎧 <b>Welcome to TgMusicBot</b>\n\n` +
      `Hai, <b>${escapedName}</b>!\n` +
      `Aku bisa bantu memutar musik dan video ke voice chat grup Telegram.\n\n` +
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

    const localStartImage = path.resolve('src/core/db/logo.jpg');
    const startImage = config.startImg || (fs.existsSync(localStartImage) ? localStartImage : '');
    
    const options = {
      parse_mode: 'HTML',
      reply_markup: privateStartKeyboard(language),
    };

    await sendStartMessage(ctx, text, startImage, options);
  } else {
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
        console.error('Failed to get group status for start handler:', error);
      }
    }

    const text = `🎶 <b>TgMusicBot aktif di grup ini!</b>\n\n` +
      `Siap memutar musik ke voice chat.\n` +
      `Gunakan:\n\n` +
      `<code>/play nama lagu</code>\n` +
      `<code>/vplay nama video</code>\n` +
      `<code>/queue</code>\n` +
      `<code>/skip</code>\n` +
      `<code>/stop</code>\n\n` +
      `📌 <b>Status grup:</b>\n` +
      `• Queue limit: <b>${queueLimit}</b>\n` +
      `• DJ Mode: <b>${djMode}</b>\n` +
      `• Preset: <b>${audioPreset}</b>\n` +
      `• Premium: <b>${premiumStatus}</b>\n\n` +
      `Tips:\n` +
      `Mulai voice chat dulu sebelum memutar lagu.`;

    const groupStartImage = config.groupStartImg || config.startImg;

    const options = {
      parse_mode: 'HTML',
      reply_markup: groupStartKeyboard(language),
    };

    await sendStartMessage(ctx, text, groupStartImage, options);
  }
}

export async function startSetupHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const text = `🚀 <b>Panduan Setup TgMusicBot</b>\n\n` +
    `1. <b>Tambahkan Bot ke Grup:</b>\n` +
    `   Undang bot ini ke grup Anda sebagai Administrator dengan izin mengundang pengguna.\n\n` +
    `2. <b>Tambahkan Assistant:</b>\n` +
    `   Tambahkan akun Assistant/Userbot ke dalam grup agar dapat bergabung ke voice chat.\n\n` +
    `3. <b>Aktifkan Obrolan Obrolan Suara:</b>\n` +
    `   Mulai Obrolan Suara (Voice Chat / Video Chat) di grup Anda.\n\n` +
    `4. <b>Mulai Memutar:</b>\n` +
    `   Ketik <code>/play judul lagu</code> atau masukkan tautan/link lagu untuk memutar musik.`;
  
  await ctx.answerCallbackQuery();
  await editOrReplyCallbackMessage(ctx, text, {
    parse_mode: 'HTML',
    reply_markup: backToStartKeyboard(language),
  });
}

export async function startFeaturesHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const text = `🎵 <b>Fitur Musik TgMusicBot</b>\n\n` +
    `• <b>Multi-Platform Playback:</b> Mendukung pemutaran dari YouTube, Spotify, Apple Music, dan SoundCloud.\n` +
    `• <b>Video Streaming:</b> Dukungan penuh pemutaran video menggunakan perintah <code>/vplay</code>.\n` +
    `• <b>Playlist Kustom:</b> Buat playlist musik pribadi Anda yang tersimpan aman di database.\n` +
    `• <b>Premium Audio Preset:</b> Pilihan efek suara (normal, bass booster, nightcore, vaporwave).\n` +
    `• <b>DJ Mode Kontrol:</b> Batasi kendali skip/stop/seek hanya untuk Admin/DJ grup.\n` +
    `• <b>Queue Management:</b> Pengaturan daftar putar yang fleksibel dengan fitur memindahkan posisi antrean lagu.`;
  
  await ctx.answerCallbackQuery();
  await editOrReplyCallbackMessage(ctx, text, {
    parse_mode: 'HTML',
    reply_markup: backToStartKeyboard(language),
  });
}

export async function startPlaylistHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const text = `🎼 <b>Fitur Playlist Pribadi</b>\n\n` +
    `Gunakan perintah-perintah berikut langsung di chat:\n\n` +
    `• <code>/cplist [nama]</code> — Membuat playlist baru\n` +
    `• <code>/addtoplaylist [id/nama] [url]</code> — Menambahkan lagu/url ke playlist\n` +
    `• <code>/myplaylists</code> — Menampilkan daftar playlist pribadi Anda\n` +
    `• <code>/deleteplaylist [id]</code> — Menghapus playlist`;
  
  await ctx.answerCallbackQuery();
  await editOrReplyCallbackMessage(ctx, text, {
    parse_mode: 'HTML',
    reply_markup: backToStartKeyboard(language),
  });
}

export async function startPremiumHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const text = `🌟 <b>Fitur Premium TgMusicBot</b> 🌟\n\n` +
    `1. <b>Batas Antrean Premium:</b> Meningkatkan batas antrean lagu dari 10 menjadi ${config.premiumQueueLimit} lagu.\n` +
    `2. <b>Pemindahan Antrean (<code>/qmove &lt;dari&gt; &lt;ke&gt;</code>):</b> Memindahkan urutan lagu dalam antrean secara instan (posisi >= 2).\n` +
    `3. <b>Preset Audio Premium (<code>/setpreset &lt;nama&gt;</code>):</b> Mengubah efek preset audio: <code>normal</code>, <code>bass</code>, <code>nightcore</code>, atau <code>vaporwave</code>.\n` +
    `4. <b>Premium DJ Mode (<code>/djmode on/off</code>):</b> Membatasi kontrol playback sensitif hanya untuk admin, user terotorisasi, atau user premium.\n` +
    `5. <b>Premium Profile & Info (<code>/premiuminfo</code> & <code>/premiumprofile</code>):</b> Informasi premium lengkap user dan grup Anda.`;
  
  await ctx.answerCallbackQuery();
  await editOrReplyCallbackMessage(ctx, text, {
    parse_mode: 'HTML',
    reply_markup: backToStartKeyboard(language),
  });
}

export async function groupPlayHintHandler(ctx) {
  await ctx.answerCallbackQuery();
  await ctx.reply(`Gunakan perintah berikut untuk memutar musik:\n<code>/play judul lagu atau tautan</code>`, { parse_mode: 'HTML' });
}

export async function groupVplayHintHandler(ctx) {
  await ctx.answerCallbackQuery();
  await ctx.reply(`Gunakan perintah berikut untuk memutar video:\n<code>/vplay judul video atau tautan</code>`, { parse_mode: 'HTML' });
}

export async function groupQueueHintHandler(ctx) {
  await ctx.answerCallbackQuery();
  await queueHandler(ctx);
}

export async function groupSkipHintHandler(ctx) {
  await ctx.answerCallbackQuery();
  await ctx.reply(`Gunakan perintah <code>/skip</code> untuk melewati lagu yang sedang diputar.`, { parse_mode: 'HTML' });
}

export async function groupDjmodeHintHandler(ctx) {
  await ctx.answerCallbackQuery();
  await ctx.reply(`Gunakan perintah <code>/djmode on</code> atau <code>/djmode off</code> untuk mengaktifkan/menonaktifkan DJ mode di grup ini.`, { parse_mode: 'HTML' });
}

export async function startHomeHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const isPrivate = ctx.chat?.type === 'private';

  if (isPrivate) {
    const name = firstName(ctx);
    const escapedName = htmlEscape(name);
    
    const text = `🎧 <b>Welcome to TgMusicBot</b>\n\n` +
      `Hai, <b>${escapedName}</b>!\n` +
      `Aku bisa bantu memutar musik dan video ke voice chat grup Telegram.\n\n` +
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

    const options = {
      parse_mode: 'HTML',
      reply_markup: privateStartKeyboard(language),
    };

    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery();
      await editOrReplyCallbackMessage(ctx, text, options);
      return;
    }
    await sendStartMessage(ctx, text, config.startImg || path.resolve('src/core/db/logo.jpg'), options);
  } else {
    await startHandler(ctx);
  }
}


export async function languageMenuHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const text = `${t(language, 'language.current', { language: languageName(language) })}\n\n${t(language, 'language.choose')}`;
  const options = { parse_mode: 'HTML', reply_markup: languageKeyboard() };
  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery(t(language, 'buttons.chooseLanguage'));
    await editOrReplyCallbackMessage(ctx, text, options);
    return;
  }
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
  await ctx.answerCallbackQuery(t(selected, 'language.saved', { language: languageName(selected) }));
  await editOrReplyCallbackMessage(ctx, `${t(selected, 'language.saved', { language: languageName(selected) })}\n\n${t(selected, 'start.text', { name: ctx.from?.first_name ?? t(selected, 'general.user'), botName: ctx.me.first_name })}`, {
    parse_mode: 'HTML',
    reply_markup: mainKeyboard(selected),
  });
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
