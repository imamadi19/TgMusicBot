import os from 'node:os';
import { performance } from 'node:perf_hooks';
import { getUserDefaultService, getUserLanguage, isSupportedDefaultService, normalizeDefaultService, setUserDefaultService } from '../core/db/user-settings.js';
import { isSupportedLanguage, languageName, t } from '../i18n/index.js';
import { htmlEscape, isOwner } from '../utils/telegram.js';
import { config } from '../config/index.js';
import { serviceSettingsKeyboard, settingsDashboardKeyboard, settingsBackKeyboard, settingsLanguageKeyboard } from './keyboards.js';
import { firstName } from '../utils/extras.js';
import { isPremiumActive } from '../core/db/premium.js';
import { getPremiumSettings } from '../core/db/premium-settings.js';
import { setUserLanguage } from '../core/db/user-settings.js';

const startedAt = performance.now();

// ==========================================
// GENERAL HANDLERS (ping, stats, privacy, shell, noop)
// ==========================================

export async function pingHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const start = performance.now();
  const message = await ctx.reply(t(language, 'misc.pinging'));
  await ctx.api.editMessageText(ctx.chat.id, message.message_id, t(language, 'misc.pong', { ms: Math.round(performance.now() - start) }));
}

export async function statsHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const uptime = Math.floor((performance.now() - startedAt) / 1000);
  const memory = process.memoryUsage();
  await ctx.reply(t(language, 'misc.stats', { uptime, memory: Math.round(memory.rss / 1024 / 1024), cpu: os.cpus().length, node: process.version }));
}

function supportLink() {
  const support = config.supportGroup || 'Support Group';
  if (/^https?:\/\//i.test(support)) return `<a href="${htmlEscape(support)}">Support Group</a>`;
  if (support.startsWith('@')) return `<a href="https://t.me/${htmlEscape(support.slice(1))}">Support Group</a>`;
  return htmlEscape(support);
}

export async function privacyHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const botName = htmlEscape(ctx.me?.first_name ?? 'TgMusicBot');
  await ctx.reply(t(language, 'misc.privacy', { botName, support: supportLink() }), {
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  });
}

export async function shellHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  if (!isOwner(ctx.from.id, config)) {
    await ctx.reply(t(language, 'misc.ownerShell'));
    return;
  }
  await ctx.reply(t(language, 'misc.shellDisabled'));
}

export async function noopHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  await ctx.reply(t(language, 'misc.noop'));
}

// ==========================================
// SETTINGS PANEL HELPERS
// ==========================================

async function safeAnswerCallback(ctx, text = '', options = {}) {
  try {
    if (text) await ctx.answerCallbackQuery({ text, ...options });
    else await ctx.answerCallbackQuery();
  } catch {}
}

async function editSettingsPanel(ctx, text, options = {}) {
  const message = ctx.callbackQuery?.message;
  const finalOptions = {
    parse_mode: 'HTML',
    ...options,
  };

  try {
    if (message?.caption !== undefined) {
      await ctx.editMessageCaption({
        caption: String(text).slice(0, 1024),
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

  try {
    await ctx.reply(text, finalOptions);
    return false;
  } catch {
    return false;
  }
}

async function deleteSettingsPanel(ctx) {
  try {
    await ctx.deleteMessage();
    return true;
  } catch {
    try {
      await ctx.editMessageReplyMarkup({ reply_markup: undefined });
      return false;
    } catch {
      return false;
    }
  }
}

// ==========================================
// SETTINGS TEXT BUILDERS
// ==========================================

async function buildPrivateSettingsText(ctx, language) {
  const name = htmlEscape(firstName(ctx));
  const currentService = await getUserDefaultService(ctx.from?.id);
  const langDisplay = languageName(language);

  return [
    `⚙️ <b>${t(language, 'settings.private.title')}</b>`,
    '',
    t(language, 'settings.private.description'),
    '',
    `👤 <b>${t(language, 'settings.labels.user')}:</b> ${name}`,
    `🌐 <b>${t(language, 'settings.labels.language')}:</b> ${langDisplay}`,
    `🎧 <b>${t(language, 'settings.labels.defaultService')}:</b> ${currentService}`,
    '',
    t(language, 'settings.chooseMenu'),
  ].join('\n');
}

async function buildGroupSettingsText(ctx, language) {
  const chatId = ctx.chat?.id;
  const chatTitle = htmlEscape(ctx.chat?.title || 'Group');
  const currentService = await getUserDefaultService(ctx.from?.id);
  const langDisplay = languageName(language);

  let premiumStatus = 'inactive';
  let queueLimit = 10;
  let djMode = 'OFF';
  let audioPreset = 'normal';

  if (chatId) {
    try {
      const chatPremium = await isPremiumActive('chat', chatId);
      premiumStatus = chatPremium ? 'Active' : 'inactive';
      queueLimit = chatPremium ? config.premiumQueueLimit : 10;

      const settings = await getPremiumSettings(chatId);
      djMode = settings.djMode ? 'ON' : 'OFF';
      audioPreset = settings.audioPreset || 'normal';
    } catch {
      premiumStatus = 'inactive';
      queueLimit = 10;
      djMode = 'OFF';
      audioPreset = 'normal';
    }
  }

  return [
    `⚙️ <b>${t(language, 'settings.group.title')}</b>`,
    '',
    t(language, 'settings.group.description'),
    '',
    `👥 <b>${t(language, 'settings.labels.group')}:</b> ${chatTitle}`,
    `🌐 <b>${t(language, 'settings.labels.language')}:</b> ${langDisplay}`,
    `🎧 <b>${t(language, 'settings.labels.defaultService')}:</b> ${currentService}`,
    `🎚 <b>${t(language, 'settings.labels.audioPreset')}:</b> ${audioPreset}`,
    `🎧 <b>${t(language, 'settings.labels.djMode')}:</b> ${djMode}`,
    `⭐ <b>${t(language, 'settings.labels.premium')}:</b> ${premiumStatus}`,
    `📜 <b>${t(language, 'settings.labels.queueLimit')}:</b> ${queueLimit}`,
    '',
    t(language, 'settings.chooseMenu'),
  ].join('\n');
}

// ==========================================
// SETTINGS DASHBOARD HANDLER
// ==========================================

export async function settingsHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const isPrivate = ctx.chat?.type === 'private';
  const text = isPrivate
    ? await buildPrivateSettingsText(ctx, language)
    : await buildGroupSettingsText(ctx, language);

  const keyboard = settingsDashboardKeyboard(language, ctx.chat?.type);

  if (ctx.callbackQuery) {
    await safeAnswerCallback(ctx, t(language, 'buttons.settings'));
    await editSettingsPanel(ctx, text, { reply_markup: keyboard });
    return;
  }

  await ctx.reply(text, {
    parse_mode: 'HTML',
    reply_markup: keyboard,
  });
}

// ==========================================
// SETTINGS CLOSE
// ==========================================

export async function settingsCloseHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  await safeAnswerCallback(ctx, t(language, 'settings.closed'));
  await deleteSettingsPanel(ctx);
}

// ==========================================
// SETTINGS SERVICE SUBMENU
// ==========================================

export async function settingsServiceHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const currentService = await getUserDefaultService(ctx.from?.id);

  await safeAnswerCallback(ctx);

  const text = [
    `🎧 <b>${t(language, 'settings.service.title')}</b>`,
    '',
    t(language, 'settings.service.description'),
    '',
    `${t(language, 'settings.service.current')}: <b>${currentService}</b>`,
  ].join('\n');

  await editSettingsPanel(ctx, text, {
    reply_markup: serviceSettingsKeyboard(currentService, language),
  });
}

export async function serviceSelectHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  const callback = String(ctx.callbackQuery?.data ?? '');
  const requestedService = normalizeDefaultService(callback.replace(/^service_/, ''));

  if (!isSupportedDefaultService(requestedService)) {
    await safeAnswerCallback(ctx, t(language, 'settings.service.unsupported'), { show_alert: true });
    return;
  }

  const currentService = await getUserDefaultService(ctx.from?.id);
  if (currentService === requestedService) {
    await safeAnswerCallback(ctx, t(language, 'settings.service.alreadySelected', { service: requestedService }));
    return;
  }

  const savedService = await setUserDefaultService(ctx.from?.id, requestedService);

  await safeAnswerCallback(ctx, t(language, 'settings.service.selected', { service: savedService }));

  const text = [
    `🎧 <b>${t(language, 'settings.service.title')}</b>`,
    '',
    t(language, 'settings.service.description'),
    '',
    `${t(language, 'settings.service.current')}: <b>${savedService}</b>`,
  ].join('\n');

  await editSettingsPanel(ctx, text, {
    reply_markup: serviceSettingsKeyboard(savedService, language),
  });
}

// ==========================================
// SETTINGS LANGUAGE
// ==========================================

export async function settingsLanguageHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  await safeAnswerCallback(ctx, t(language, 'buttons.chooseLanguage'));

  const text = `${t(language, 'language.current', { language: languageName(language) })}\n\n${t(language, 'language.choose')}`;

  await editSettingsPanel(ctx, text, {
    reply_markup: settingsLanguageKeyboard(language),
  });
}

export async function settingsLanguageSelectHandler(ctx) {
  const selected = String(ctx.callbackQuery?.data ?? '').replace('settings_lang_', '');
  const currentLanguage = await getUserLanguage(ctx.from?.id);

  if (!isSupportedLanguage(selected)) {
    await safeAnswerCallback(ctx, t(currentLanguage, 'language.invalid'), { show_alert: true });
    return;
  }

  await setUserLanguage(ctx.from?.id, selected);
  await safeAnswerCallback(ctx, t(selected, 'language.saved', { language: languageName(selected) }));

  // Return to settings dashboard with new language
  const isPrivate = ctx.chat?.type === 'private';
  const text = isPrivate
    ? await buildPrivateSettingsText(ctx, selected)
    : await buildGroupSettingsText(ctx, selected);

  await editSettingsPanel(ctx, text, {
    reply_markup: settingsDashboardKeyboard(selected, ctx.chat?.type),
  });
}

// ==========================================
// SETTINGS HELP
// ==========================================

export async function settingsHelpHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  await safeAnswerCallback(ctx);

  const text = [
    `📖 <b>${t(language, 'settings.help.title')}</b>`,
    '',
    t(language, 'settings.help.content'),
  ].join('\n');

  await editSettingsPanel(ctx, text, {
    reply_markup: settingsBackKeyboard(language),
  });
}

// ==========================================
// SETTINGS PRESET HINT (group only)
// ==========================================

export async function settingsPresetHintHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  await safeAnswerCallback(ctx);

  const isPrivate = ctx.chat?.type === 'private';

  if (isPrivate) {
    const text = [
      `🎚 <b>${t(language, 'settings.preset.title')}</b>`,
      '',
      t(language, 'settings.groupOnly'),
    ].join('\n');

    await editSettingsPanel(ctx, text, {
      reply_markup: settingsBackKeyboard(language),
    });
    return;
  }

  let audioPreset = 'normal';
  try {
    const settings = await getPremiumSettings(ctx.chat?.id);
    audioPreset = settings.audioPreset || 'normal';
  } catch {}

  const text = [
    `🎚 <b>${t(language, 'settings.preset.title')}</b>`,
    '',
    t(language, 'settings.preset.content'),
    '',
    '<code>/setpreset normal</code>',
    '<code>/setpreset bass</code>',
    '<code>/setpreset nightcore</code>',
    '<code>/setpreset vaporwave</code>',
    '',
    `${t(language, 'settings.preset.current')}: <b>${audioPreset}</b>`,
  ].join('\n');

  await editSettingsPanel(ctx, text, {
    reply_markup: settingsBackKeyboard(language),
  });
}

// ==========================================
// SETTINGS DJ MODE HINT (group only)
// ==========================================

export async function settingsDjModeHintHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  await safeAnswerCallback(ctx);

  const isPrivate = ctx.chat?.type === 'private';

  if (isPrivate) {
    const text = [
      `🎧 <b>${t(language, 'settings.djMode.title')}</b>`,
      '',
      t(language, 'settings.groupOnly'),
    ].join('\n');

    await editSettingsPanel(ctx, text, {
      reply_markup: settingsBackKeyboard(language),
    });
    return;
  }

  let djMode = 'OFF';
  try {
    const settings = await getPremiumSettings(ctx.chat?.id);
    djMode = settings.djMode ? 'ON' : 'OFF';
  } catch {}

  const text = [
    `🎧 <b>${t(language, 'settings.djMode.title')}</b>`,
    '',
    t(language, 'settings.djMode.content'),
    '',
    '<code>/djmode on</code>',
    '<code>/djmode off</code>',
    '',
    `${t(language, 'settings.djMode.current')}: <b>${djMode}</b>`,
  ].join('\n');

  await editSettingsPanel(ctx, text, {
    reply_markup: settingsBackKeyboard(language),
  });
}

// ==========================================
// SETTINGS PREMIUM INFO
// ==========================================

export async function settingsPremiumInfoHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  await safeAnswerCallback(ctx);

  const isPrivate = ctx.chat?.type === 'private';

  if (isPrivate) {
    const text = [
      `⭐ <b>${t(language, 'settings.premium.title')}</b>`,
      '',
      t(language, 'settings.premium.content'),
    ].join('\n');

    await editSettingsPanel(ctx, text, {
      reply_markup: settingsBackKeyboard(language),
    });
    return;
  }

  let premiumStatus = 'inactive';
  let queueLimit = 10;

  try {
    const chatPremium = await isPremiumActive('chat', ctx.chat?.id);
    premiumStatus = chatPremium ? 'Active' : 'inactive';
    queueLimit = chatPremium ? config.premiumQueueLimit : 10;
  } catch {}

  const text = [
    `⭐ <b>${t(language, 'settings.premium.title')}</b>`,
    '',
    `Premium: <b>${premiumStatus}</b>`,
    `${t(language, 'settings.labels.queueLimit')}: <b>${queueLimit}</b>`,
    '',
    t(language, 'settings.premium.content'),
  ].join('\n');

  await editSettingsPanel(ctx, text, {
    reply_markup: settingsBackKeyboard(language),
  });
}
