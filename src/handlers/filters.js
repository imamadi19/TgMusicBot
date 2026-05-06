import { getAdmins, getCachedAdmins } from '../core/cache/admin-cache.js';
import { isAuthUser } from '../core/db/auth.js';
import { ADMIN_MODE, getAdminMode, getPlayMode } from '../core/db/chat-settings.js';
import { getUserLanguage } from '../core/db/user-settings.js';
import { t } from '../i18n/index.js';

function isPrivate(ctx) {
  return ctx.chat?.type === 'private';
}

function isPrivilegedStatus(status) {
  return ['creator', 'administrator'].includes(status);
}

function canInviteUsers(member) {
  if (member?.status === 'creator') return true;
  if (member?.status !== 'administrator') return false;
  return Boolean(member?.can_invite_users);
}

async function getBotId(ctx) {
  return Number(ctx.me?.id ?? (await ctx.api.getMe()).id);
}

export async function checkBotAdmin(ctx, replyErr) {
  const language = await getUserLanguage(ctx.from?.id);
  const botId = await getBotId(ctx);
  let botStatus;

  try {
    botStatus = await ctx.api.getChatMember(ctx.chat.id, botId);
  } catch (error) {
    const message = String(error?.description ?? error?.message ?? error).toLowerCase();
    if (message.includes('not an admin') || message.includes('member not found')) {
      await replyErr(t(language, 'filters.botNotAdmin'));
    } else {
      console.warn('getChatMember bot admin error', error);
      await replyErr(t(language, 'filters.botAdminVerifyFailed'));
    }
    return false;
  }

  if (!isPrivilegedStatus(botStatus?.status)) {
    await replyErr(t(language, 'filters.botNotAdminReload'));
    return false;
  }

  if (!canInviteUsers(botStatus)) {
    await replyErr(t(language, 'filters.botMissingInvite'));
    return false;
  }

  return true;
}

async function isUserAdminOrAuth(ctx, userId) {
  if (await isAuthUser(ctx.chat.id, userId)) return true;

  const cachedAdmins = getCachedAdmins(ctx.chat.id);
  if (cachedAdmins?.some((admin) => Number(admin.userId) === Number(userId))) return true;

  const admins = await getAdmins(ctx.api, ctx.chat.id);
  return admins.some((admin) => Number(admin.userId) === Number(userId));
}

export async function adminMode(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  if (isPrivate(ctx)) return false;

  const botOk = await checkBotAdmin(ctx, (message) => ctx.reply(message));
  if (!botOk) return false;

  const mode = await getAdminMode(ctx.chat.id);
  if (mode === ADMIN_MODE.everyone) return true;
  if (mode === ADMIN_MODE.admins) {
    if (await isUserAdminOrAuth(ctx, ctx.from?.id)) return true;
    await ctx.reply(t(language, 'filters.adminRequired'));
    return false;
  }

  await ctx.reply(t(language, 'filters.notAuthorized'));
  return false;
}

export async function adminModeCallback(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  if (isPrivate(ctx)) return false;

  const botOk = await checkBotAdmin(ctx, (message) => ctx.answerCallbackQuery({ text: message, show_alert: true }));
  if (!botOk) return false;

  const mode = await getAdminMode(ctx.chat.id);
  if (mode === ADMIN_MODE.everyone) return true;
  if (mode === ADMIN_MODE.admins) {
    if (await isUserAdminOrAuth(ctx, ctx.from?.id)) return true;
    await ctx.answerCallbackQuery({ text: t(language, 'filters.adminActionRequired'), show_alert: true });
    return false;
  }

  await ctx.answerCallbackQuery({ text: t(language, 'filters.actionNotAuthorized'), show_alert: true });
  return false;
}

export async function playMode(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  if (isPrivate(ctx)) return false;

  const botOk = await checkBotAdmin(ctx, (message) => ctx.reply(message));
  if (!botOk) return false;

  const locked = await getPlayMode(ctx.chat.id);
  if (!locked) return true;

  if (await isUserAdminOrAuth(ctx, ctx.from?.id)) return true;
  await ctx.reply(t(language, 'filters.playModeAdminOnly'));
  return false;
}
