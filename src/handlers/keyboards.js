import { InlineKeyboard } from 'grammy';
import { config } from '../config/index.js';
import { languages, t } from '../i18n/index.js';

export function supportKeyboard(language = 'en') {
  const keyboard = new InlineKeyboard();
  if (config.supportGroup) keyboard.url(t(language, 'buttons.support'), config.supportGroup);
  if (config.supportChannel) keyboard.url(t(language, 'buttons.channel'), config.supportChannel);
  return keyboard;
}

export function mainKeyboard(language = 'en') {
  return new InlineKeyboard()
    .text(t(language, 'buttons.help'), 'help_all')
    .text(t(language, 'buttons.language'), 'language_menu')
    .row()
    .text(t(language, 'buttons.settings'), 'settings_menu');
}

export function helpKeyboard(language = 'en') {
  return new InlineKeyboard()
    .text(t(language, 'buttons.user'), 'help_user').text(t(language, 'buttons.admin'), 'help_admin').row()
    .text(t(language, 'buttons.playlist'), 'help_playlist').text(t(language, 'buttons.owner'), 'help_owner').row()
    .text(t(language, 'buttons.developer'), 'help_devs').row()
    .text(t(language, 'buttons.language'), 'language_menu');
}

export function backKeyboard(language = 'en') {
  return new InlineKeyboard().text(t(language, 'buttons.back'), 'help_all');
}

export function languageKeyboard() {
  const keyboard = new InlineKeyboard();
  languages.forEach((language, index) => {
    keyboard.text(`${language.flag} ${language.nativeName}`, `lang_${language.code}`);
    if (index % 2 === 1) keyboard.row();
  });
  return keyboard;
}

export function controlKeyboard(language = 'en') {
  return new InlineKeyboard()
    .text(t(language, 'buttons.pause'), 'vcplay_pause').text(t(language, 'buttons.skip'), 'vcplay_skip').row()
    .text(t(language, 'buttons.stop'), 'vcplay_stop');
}
