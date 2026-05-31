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
    if (text) {
      await ctx.answerCallbackQuery({ text, ...options });
    } else {
      await ctx.answerCallbackQuery();
    }
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
        await editStartPanel(ctx, t(await getUserLanguage(ctx.from?.id), 'start.closed'), { reply_markup: undefined });
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
  const name = htmlEscape(firstName(ctx));
  return [
    `🎧 <b>${t(language, 'start.private.title')}</b>`,
    '',
    t(language, 'start.private.greeting', { name }),
    t(language, 'start.private.description'),
    '',
    `🚀 <b>${t(language, 'start.private.stepsTitle')}</b>`,
    `1. ${t(language, 'start.private.stepAddBot')}`,
    `2. ${t(language, 'start.private.stepAddAssistant')}`,
    `3. ${t(language, 'start.private.stepStartVoice')}`,
    `4. ${t(language, 'start.private.stepPlay')}`,
    '',
    `✨ <b>${t(language, 'start.private.featuresTitle')}</b>`,
    `• ${t(language, 'start.private.featurePlayback')}`,
    `• ${t(language, 'start.private.featurePlatforms')}`,
    `• ${t(language, 'start.private.featurePlaylist')}`,
    `• ${t(language, 'start.private.featureQueue')}`,
    `• ${t(language, 'start.private.featurePremiumPreset')}`,
    `• ${t(language, 'start.private.featureDjMode')}`,
    '',
    t(language, 'start.private.chooseMenu'),
  ].join('\n');
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

  return [
    `🎶 <b>${t(language, 'start.group.title')}</b>`,
    '',
    t(language, 'start.group.description'),
    '',
    `📌 <b>${t(language, 'start.group.statusTitle')}</b>`,
    `• ${t(language, 'start.group.queueLimit', { limit: queueLimit })}`,
    `• ${t(language, 'start.group.djMode', { djMode })}`,
    `• ${t(language, 'start.group.preset', { preset: audioPreset })}`,
    `• ${t(language, 'start.group.premium', { premium: premiumStatus })}`,
    '',
    t(language, 'start.group.quickHelp'),
  ].join('\n');
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
  await safeAnswerCallback(ctx, t(language, 'start.closed'));
  await deleteStartPanel(ctx);
}

export async function startSettingsHintHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  await safeAnswerCallback(ctx);

  const text = `⚙️ <b>${t(language, 'start.settings.title')}</b>\n\n${t(language, 'start.settings.content')}`;

  await editStartPanel(ctx, text, {
    reply_markup: backToStartKeyboard(language),
  });
}

export async function startSetupHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  await safeAnswerCallback(ctx);

  const text = `🚀 <b>${t(language, 'start.setup.title')}</b>\n\n${t(language, 'start.setup.content')}`;

  await editStartPanel(ctx, text, {
    reply_markup: backToStartKeyboard(language),
  });
}

export async function startFeaturesHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  await safeAnswerCallback(ctx);

  const text = `🎵 <b>${t(language, 'start.features.title')}</b>\n\n${t(language, 'start.features.content')}`;

  await editStartPanel(ctx, text, {
    reply_markup: backToStartKeyboard(language),
  });
}

export async function startPlaylistHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  await safeAnswerCallback(ctx);

  const text = `🎼 <b>${t(language, 'start.playlist.title')}</b>\n\n${t(language, 'start.playlist.content')}`;

  await editStartPanel(ctx, text, {
    reply_markup: backToStartKeyboard(language),
  });
}

export async function startPremiumHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  await safeAnswerCallback(ctx);

  const text = `⭐ <b>${t(language, 'start.premium.title')}</b>\n\n${t(language, 'start.premium.content')}`;

  await editStartPanel(ctx, text, {
    reply_markup: backToStartKeyboard(language),
  });
}

export async function groupPlayHintHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  await safeAnswerCallback(ctx);

  const text = `▶️ <b>${t(language, 'start.groupPlay.title')}</b>\n\n${t(language, 'start.groupPlay.content')}`;

  await editStartPanel(ctx, text, {
    reply_markup: backToStartKeyboard(language),
  });
}

export async function groupVplayHintHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  await safeAnswerCallback(ctx);

  const text = `🎬 <b>${t(language, 'start.groupVideo.title')}</b>\n\n${t(language, 'start.groupVideo.content')}`;

  await editStartPanel(ctx, text, {
    reply_markup: backToStartKeyboard(language),
  });
}

export async function groupQueueHintHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  await safeAnswerCallback(ctx);

  const text = `📜 <b>${t(language, 'start.groupQueue.title')}</b>\n\n${t(language, 'start.groupQueue.content')}`;

  await editStartPanel(ctx, text, {
    reply_markup: backToStartKeyboard(language),
  });
}

export async function groupSkipHintHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  await safeAnswerCallback(ctx);

  const text = `⏭ <b>${t(language, 'start.groupSkip.title')}</b>\n\n${t(language, 'start.groupSkip.content')}`;

  await editStartPanel(ctx, text, {
    reply_markup: backToStartKeyboard(language),
  });
}

export async function groupDjmodeHintHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  await safeAnswerCallback(ctx);

  const text = `🎧 <b>${t(language, 'start.groupDjMode.title')}</b>\n\n${t(language, 'start.groupDjMode.content')}`;

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

  await safeAnswerCallback(ctx, t(selected, 'language.saved', { language: languageName(selected) }));

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
