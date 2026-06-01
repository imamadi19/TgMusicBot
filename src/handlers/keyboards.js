import { config } from '../config/index.js';
import { languages, t } from '../i18n/index.js';
import { SUPPORTED_DEFAULT_SERVICES, normalizeDefaultService } from '../core/db/user-settings.js';

function styledCallbackButton(text, callbackData, style) {
  return {
    text,
    callback_data: callbackData,
    style,
  };
}

function styledUrlButton(text, url, style) {
  return {
    text,
    url,
    style,
  };
}

function rawKeyboard(rows) {
  return {
    inline_keyboard: rows,
  };
}

export function supportKeyboard(language = 'en') {
  const row = [];
  if (config.supportGroup) {
    row.push(styledUrlButton(t(language, 'buttons.support'), config.supportGroup, 'primary'));
  }
  if (config.supportChannel) {
    row.push(styledUrlButton(t(language, 'buttons.channel'), config.supportChannel, 'primary'));
  }
  return rawKeyboard(row.length ? [row] : []);
}

// Legacy keyboard; do not use for active /start flow.
export function mainKeyboard(language = 'en') {
  const botUsername = String(config.botUsername || 'TgMusikGlobalBot').replace(/^@+/, '');
  const addToGroupUrl = `https://t.me/${botUsername}?startgroup=true`;
  return rawKeyboard([
    [
      styledUrlButton(`➕ ${t(language, 'buttons.addToGroup')}`, addToGroupUrl, 'success')
    ],
    [
      styledCallbackButton(`${t(language, 'buttons.help')}`, 'help_all', 'primary')
    ],
    [
      styledUrlButton(`${t(language, 'buttons.support')}`, config.supportGroup || 'https://t.me', 'primary'),
      styledUrlButton(`${t(language, 'buttons.channel')}`, config.supportChannel || 'https://t.me', 'primary')
    ],
    [
      styledCallbackButton(t(language, 'buttons.language'), 'language_menu', 'primary'),
      styledCallbackButton(t(language, 'buttons.settings'), 'settings_menu', 'primary')
    ]
  ]);
}

export function helpKeyboard(language = 'en') {
  return rawKeyboard([
    [
      styledCallbackButton(t(language, 'buttons.user'), 'help_user', 'primary'),
      styledCallbackButton(t(language, 'buttons.admin'), 'help_admin', 'primary')
    ],
    [
      styledCallbackButton(t(language, 'buttons.playlist'), 'help_playlist', 'primary'),
      styledCallbackButton(t(language, 'buttons.owner'), 'help_owner', 'primary')
    ],
    [
      styledCallbackButton(t(language, 'buttons.developer'), 'help_devs', 'primary')
    ],
    [
      styledCallbackButton(t(language, 'buttons.language'), 'language_menu', 'primary')
    ],
    [
      styledCallbackButton(t(language, 'buttons.back'), 'start_home', 'primary'),
      styledCallbackButton(`❌ ${t(language, 'buttons.close')}`, 'start_close', 'danger')
    ]
  ]);
}

export function backKeyboard(language = 'en') {
  return rawKeyboard([
    [
      styledCallbackButton(t(language, 'buttons.back'), 'help_all', 'primary')
    ]
  ]);
}

export function serviceSettingsKeyboard(currentService, language = 'en') {
  const activeService = normalizeDefaultService(currentService) || SUPPORTED_DEFAULT_SERVICES.youtube;
  
  const ytStyle = activeService === SUPPORTED_DEFAULT_SERVICES.youtube ? 'success' : 'primary';
  const spotStyle = activeService === SUPPORTED_DEFAULT_SERVICES.spotify ? 'success' : 'primary';
  const appleStyle = activeService === SUPPORTED_DEFAULT_SERVICES.apple_music ? 'success' : 'primary';
  const scStyle = activeService === SUPPORTED_DEFAULT_SERVICES.soundcloud ? 'success' : 'primary';

  return rawKeyboard([
    [
      styledCallbackButton(`${activeService === SUPPORTED_DEFAULT_SERVICES.youtube ? '✅ ' : ''}${SUPPORTED_DEFAULT_SERVICES.youtube}`, 'service_youtube', ytStyle)
    ],
    [
      styledCallbackButton(`${activeService === SUPPORTED_DEFAULT_SERVICES.spotify ? '✅ ' : ''}${SUPPORTED_DEFAULT_SERVICES.spotify}`, 'service_spotify', spotStyle),
      styledCallbackButton(`${activeService === SUPPORTED_DEFAULT_SERVICES.apple_music ? '✅ ' : ''}${SUPPORTED_DEFAULT_SERVICES.apple_music}`, 'service_apple_music', appleStyle)
    ],
    [
      styledCallbackButton(`${activeService === SUPPORTED_DEFAULT_SERVICES.soundcloud ? '✅ ' : ''}${SUPPORTED_DEFAULT_SERVICES.soundcloud}`, 'service_soundcloud', scStyle)
    ],
    [
      styledCallbackButton(`⬅️ ${t(language, 'buttons.back')}`, 'settings_home', 'primary'),
      styledCallbackButton(`❌ ${t(language, 'buttons.close')}`, 'settings_close', 'danger')
    ]
  ]);
}

export function languageKeyboard(language = 'en', options = {}) {
  const prefix = options.prefix || 'lang_';
  const rows = [];
  let currentRow = [];
  
  languages.forEach((lang, index) => {
    currentRow.push(styledCallbackButton(`${lang.flag} ${lang.nativeName}`, `${prefix}${lang.code}`, 'primary'));
    if (index % 2 === 1) {
      rows.push(currentRow);
      currentRow = [];
    }
  });
  
  if (currentRow.length > 0) {
    rows.push(currentRow);
  }
  
  if (options && options.includeBack) {
    const backCb = options.backCallback || 'start_home';
    const closeCb = options.closeCallback || 'start_close';
    rows.push([
      styledCallbackButton(`⬅️ ${t(language, 'buttons.back')}`, backCb, 'primary'),
      styledCallbackButton(`❌ ${t(language, 'buttons.close')}`, closeCb, 'danger')
    ]);
  }
  
  return rawKeyboard(rows);
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

export function progressKeyboard(track = {}, style = 'primary') {
  return rawKeyboard([
    [
      styledCallbackButton(progressLabel(track), 'play_progress', style)
    ]
  ]);
}

export function completedProgressKeyboard(track = {}) {
  const duration = Math.max(0, Math.floor(Number(track.duration) || 0));
  const completedAt = new Date(Date.now() - duration * 1000);
  return progressKeyboard({ ...track, remainingMs: 0, timerEndsAt: null, startedAt: completedAt }, 'danger');
}

export function controlKeyboard(language = 'en', state = '', track = {}) {
  return rawKeyboard([
    [
      styledCallbackButton(progressLabel(track), 'play_progress', 'primary')
    ],
    [
      styledCallbackButton('▷', 'play_resume', 'success'),
      styledCallbackButton('Ⅱ', 'play_pause', 'primary'),
      styledCallbackButton('↻', 'play_replay', 'success'),
      styledCallbackButton('▸▸', 'play_skip', 'danger'),
      styledCallbackButton('▢', 'play_stop', 'danger')
    ]
  ]);
}

export function searchSelectionKeyboard(messageId, tracks, index = 0) {
  const total = Math.max(1, tracks.length);
  const safeIndex = Math.max(0, Math.min(index, total - 1));
  const rows = [];

  if (total > 1) {
    const previous = safeIndex === 0 ? total - 1 : safeIndex - 1;
    const next = safeIndex === total - 1 ? 0 : safeIndex + 1;
    rows.push([
      styledCallbackButton('⬅️ Prev', `searchpage:${messageId}:${previous}`, 'primary'),
      styledCallbackButton('Next ➡️', `searchpage:${messageId}:${next}`, 'primary')
    ]);
  }

  rows.push([
    styledCallbackButton('✅ Select', `searchpick:${messageId}:${safeIndex}`, 'success'),
    styledCallbackButton('❌ Cancel', `searchcancel:${messageId}`, 'danger')
  ]);

  return rawKeyboard(rows);
}

export const youtubeSelectionKeyboard = searchSelectionKeyboard;

export function privateStartKeyboard(language = 'en') {
  const botUsername = String(config.botUsername || 'TgMusikGlobalBot').replace(/^@+/, '');
  const addToGroupUrl = `https://t.me/${botUsername}?startgroup=true`;

  const rows = [
    [
      styledUrlButton(t(language, 'buttons.addToGroup'), addToGroupUrl, 'success')
    ],
    [
      styledCallbackButton(t(language, 'buttons.setupGuide'), 'start_setup', 'primary'),
      styledCallbackButton(t(language, 'buttons.musicFeatures'), 'start_features', 'primary')
    ],
    [
      styledCallbackButton(t(language, 'buttons.myPlaylists'), 'start_playlist', 'primary'),
      styledCallbackButton(t(language, 'buttons.premium'), 'start_premium', 'success')
    ],
    [
      styledCallbackButton(`🌐 ${t(language, 'buttons.chooseLanguage')}`, 'language_menu', 'primary'),
      styledCallbackButton(`⚙️ ${t(language, 'buttons.settings')}`, 'settings_menu', 'primary')
    ]
  ];

  const supportUrl = config.supportGroup;
  const channelUrl = config.supportChannel;
  if (supportUrl || channelUrl) {
    const urlRow = [];
    if (supportUrl) {
      urlRow.push(styledUrlButton(t(language, 'buttons.support'), supportUrl, 'primary'));
    }
    if (channelUrl) {
      urlRow.push(styledUrlButton(t(language, 'buttons.channel'), channelUrl, 'primary'));
    }
    rows.push(urlRow);
  }

  rows.push([
    styledCallbackButton(`❌ ${t(language, 'buttons.close')}`, 'start_close', 'danger')
  ]);

  return rawKeyboard(rows);
}

export function groupStartKeyboard(language = 'en') {
  return rawKeyboard([
    [
      styledCallbackButton(t(language, 'buttons.playMusic'), 'group_play_hint', 'success'),
      styledCallbackButton(t(language, 'buttons.playVideo'), 'group_vplay_hint', 'success')
    ],
    [
      styledCallbackButton(t(language, 'buttons.queue'), 'group_queue_hint', 'primary'),
      styledCallbackButton(t(language, 'buttons.skip'), 'group_skip_hint', 'danger')
    ],
    [
      styledCallbackButton(`⚙️ ${t(language, 'buttons.groupSettings')}`, 'settings_menu', 'primary'),
      styledCallbackButton(t(language, 'buttons.djMode'), 'group_djmode_hint', 'primary')
    ],
    [
      styledCallbackButton(t(language, 'buttons.help'), 'help_all', 'primary'),
      styledCallbackButton(t(language, 'buttons.premium'), 'start_premium', 'success')
    ],
    [
      styledCallbackButton(`❌ ${t(language, 'buttons.close')}`, 'start_close', 'danger')
    ]
  ]);
}

export function backToStartKeyboard(language = 'en') {
  return rawKeyboard([
    [
      styledCallbackButton(`⬅️ ${t(language, 'buttons.back')}`, 'start_home', 'primary'),
      styledCallbackButton(`❌ ${t(language, 'buttons.close')}`, 'start_close', 'danger')
    ]
  ]);
}

export function settingsDashboardKeyboard(language = 'en', chatType = 'private') {
  const isPrivate = chatType === 'private';
  const rows = [
    [
      styledCallbackButton(`🎧 ${t(language, 'buttons.defaultService')}`, 'settings_service', 'primary')
    ]
  ];

  if (!isPrivate) {
    rows.push([
      styledCallbackButton(`🎚 ${t(language, 'buttons.audioPreset')}`, 'settings_preset', 'primary'),
      styledCallbackButton(`🎧 ${t(language, 'buttons.djMode')}`, 'settings_djmode', 'primary')
    ]);
  }

  if (!isPrivate) {
    rows.push([
      styledCallbackButton(`🌐 ${t(language, 'buttons.chooseLanguage')}`, 'settings_language', 'primary'),
      styledCallbackButton(`⭐ ${t(language, 'buttons.premiumInfo')}`, 'settings_premium', 'success')
    ]);
  } else {
    rows.push([
      styledCallbackButton(`🌐 ${t(language, 'buttons.chooseLanguage')}`, 'settings_language', 'primary'),
      styledCallbackButton(`📖 ${t(language, 'buttons.help')}`, 'settings_help', 'primary')
    ]);
    rows.push([
      styledCallbackButton(`⭐ ${t(language, 'buttons.premiumInfo')}`, 'settings_premium', 'success')
    ]);
  }

  rows.push([
    styledCallbackButton(`❌ ${t(language, 'buttons.close')}`, 'settings_close', 'danger')
  ]);

  return rawKeyboard(rows);
}

export function settingsBackKeyboard(language = 'en') {
  return rawKeyboard([
    [
      styledCallbackButton(`⬅️ ${t(language, 'buttons.back')}`, 'settings_home', 'primary'),
      styledCallbackButton(`❌ ${t(language, 'buttons.close')}`, 'settings_close', 'danger')
    ]
  ]);
}

export function settingsLanguageKeyboard(language = 'en') {
  return languageKeyboard(language, {
    includeBack: true,
    backCallback: 'settings_home',
    closeCallback: 'settings_close',
    prefix: 'settings_lang_',
  });
}
