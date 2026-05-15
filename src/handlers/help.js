import { getUserLanguage, setUserLanguage } from '../core/db/user-settings.js';
import fs from 'node:fs';
import path from 'node:path';
import { InputFile } from 'grammy';
import { isSupportedLanguage, languageName, t } from '../i18n/index.js';
import { backKeyboard, helpKeyboard, languageKeyboard, mainKeyboard } from './keyboards.js';
import { config } from '../config/index.js';

function helpCategories(language) {
  return {
    help_user: [t(language, 'help.userTitle'), t(language, 'help.userContent')],
    help_admin: [t(language, 'help.adminTitle'), t(language, 'help.adminContent')],
    help_devs: [t(language, 'help.devTitle'), t(language, 'help.devContent')],
    help_owner: [t(language, 'help.ownerTitle'), t(language, 'help.ownerContent')],
    help_playlist: [t(language, 'help.playlistTitle'), t(language, 'help.playlistContent')],
  };
}

export async function startHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const name = ctx.from?.first_name ?? t(language, 'general.user');
  const botName = ctx.me.first_name;
  const caption = t(language, 'start.text', { name, botName });
  const localStartImage = path.resolve('src/core/db/logo.jpg');
  const startImage = config.startImg || (fs.existsSync(localStartImage) ? localStartImage : '');
  const options = {
    parse_mode: 'HTML',
    reply_markup: mainKeyboard(language),
  };
  if (startImage) {
    const photo = startImage.startsWith('http') ? startImage : new InputFile(startImage);
    await ctx.replyWithPhoto(photo, { caption, ...options });
    return;
  }
  await ctx.reply(caption, options);
}

export async function languageMenuHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const text = `${t(language, 'language.current', { language: languageName(language) })}\n\n${t(language, 'language.choose')}`;
  const options = { parse_mode: 'HTML', reply_markup: languageKeyboard() };
  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery(t(language, 'buttons.chooseLanguage'));
    const currentMessage = ctx.callbackQuery.message;
    if (currentMessage?.text) {
      await ctx.editMessageText(text, options);
      return;
    }
    if (currentMessage?.caption) {
      await ctx.editMessageCaption({ caption: text, ...options });
      return;
    }
    if (!currentMessage) {
      await ctx.reply(text, options);
      return;
    }
    await ctx.reply(text, options);
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
  await ctx.editMessageText(`${t(selected, 'language.saved', { language: languageName(selected) })}\n\n${t(selected, 'start.text', { name: ctx.from?.first_name ?? t(selected, 'general.user'), botName: ctx.me.first_name })}`, {
    parse_mode: 'HTML',
    reply_markup: mainKeyboard(selected),
  });
}

export async function helpCallback(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const data = ctx.callbackQuery.data;
  if (data === 'help_all') {
    await ctx.answerCallbackQuery(t(language, 'general.openingHelp'));
    await ctx.editMessageText(t(language, 'general.chooseHelp'), { reply_markup: helpKeyboard(language) });
    return;
  }
  const category = helpCategories(language)[data];
  if (!category) {
    await ctx.answerCallbackQuery({ text: t(language, 'general.unknownHelp'), show_alert: true });
    return;
  }
  const [title, content] = category;
  await ctx.answerCallbackQuery(title);
  await ctx.editMessageText(`<b>${title}</b>\n\n${content}\n\n<i>${t(language, 'general.useBack')}</i>`, {
    parse_mode: 'HTML',
    reply_markup: backKeyboard(language),
  });
}
