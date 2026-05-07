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

function clock(totalSeconds = 0) {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

const PROGRESS_BAR_WIDTH = 12;

function progressBar(elapsed, duration) {
  if (!duration) return '◉'.padEnd(PROGRESS_BAR_WIDTH, '━');
  const ratio = Math.max(0, Math.min(1, elapsed / duration));
  const position = Math.round(ratio * (PROGRESS_BAR_WIDTH - 1));
  return Array.from({ length: PROGRESS_BAR_WIDTH }, (_, index) => (index === position ? '◉' : '━')).join('');
}

export function progressLabel(track = {}) {
  const duration = Math.max(0, Math.floor(Number(track.duration) || 0));
  const startedAt = track.startedAt ? new Date(track.startedAt).getTime() : 0;
  const pausedRemaining = Number(track.remainingMs);
  const pausedElapsed = duration && Number.isFinite(pausedRemaining) && !track.timerEndsAt
    ? Math.max(0, duration - Math.ceil(pausedRemaining / 1000))
    : null;
  const elapsed = pausedElapsed ?? (startedAt ? Math.max(0, Math.floor((Date.now() - startedAt) / 1000)) : 0);
  const safeElapsed = duration ? Math.min(elapsed, duration) : elapsed;
  const remaining = duration ? Math.max(0, duration - safeElapsed) : 0;
  return `${clock(safeElapsed)} | ${progressBar(safeElapsed, duration)} | -${clock(remaining)}`;
}

export function progressKeyboard(track = {}) {
  return new InlineKeyboard().text(progressLabel(track), 'play_progress');
}

export function controlKeyboard(language = 'en', state = '', track = {}) {
  return progressKeyboard(track).row()
    .text('▷', 'play_resume')
    .text('Ⅱ', 'play_pause')
    .text('↻', 'play_replay')
    .text('▸▸▏', 'play_skip')
    .text('▢', 'play_stop');
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
