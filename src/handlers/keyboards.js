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

export function controlKeyboard(language = 'en', state = '') {
  const pauseOrResume = state === 'pause'
    ? [t(language, 'buttons.resume'), 'play_resume']
    : [t(language, 'buttons.pause'), 'play_pause'];
  const muteOrUnmute = state === 'mute'
    ? [t(language, 'buttons.unmute'), 'play_unmute']
    : [t(language, 'buttons.mute'), 'play_mute'];

  return new InlineKeyboard()
    .text(pauseOrResume[0], pauseOrResume[1]).text(t(language, 'buttons.skip'), 'play_skip').row()
    .text(t(language, 'buttons.stop'), 'play_stop').text(muteOrUnmute[0], muteOrUnmute[1]).row()
    .text(t(language, 'buttons.addToPlaylist'), 'play_add_to_list').text(t(language, 'buttons.close'), 'vcplay_close');
}

export function youtubeSelectionKeyboard(messageId, tracks, index = 0) {
  const keyboard = new InlineKeyboard();
  const total = Math.max(1, tracks.length);
  const safeIndex = Math.max(0, Math.min(index, total - 1));

  if (total > 1) {
    const previous = safeIndex === 0 ? total - 1 : safeIndex - 1;
    const next = safeIndex === total - 1 ? 0 : safeIndex + 1;
    keyboard
      .text('⬅️', `ytpage:${messageId}:${previous}`)
      .text('➡️', `ytpage:${messageId}:${next}`)
      .row();
  }

  return keyboard.text('✅ Select', `ytpick:${messageId}:${safeIndex}`);
}
