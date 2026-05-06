import { addAuthUser, getAuthUsers, isAuthUser, removeAuthUser } from '../core/db/auth.js';
import { getUserLanguage } from '../core/db/user-settings.js';
import { t } from '../i18n/index.js';
import { htmlEscape } from '../utils/telegram.js';
import { resolveTargetUserId } from '../utils/extras.js';
import { adminMode } from './filters.js';

function isPrivate(ctx) {
  return ctx.chat?.type === 'private';
}

function isPrivilegedMember(member) {
  return ['creator', 'administrator'].includes(member?.status);
}

async function ensureGroupAdmin(ctx, language) {
  if (isPrivate(ctx)) {
    await ctx.reply(t(language, 'auth.groupOnly'));
    return false;
  }

  try {
    const member = await ctx.api.getChatMember(ctx.chat.id, ctx.from.id);
    if (isPrivilegedMember(member)) return true;
  } catch (error) {
    console.warn('getChatMember error', error);
    await ctx.reply(t(language, 'auth.adminVerifyFailed'));
    return false;
  }

  await ctx.reply(t(language, 'auth.adminOnly'));
  return false;
}

export async function getTargetUserId(ctx) {
  return resolveTargetUserId(ctx);
}

export async function authListHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  if (!(await adminMode(ctx))) return;

  const users = await getAuthUsers(ctx.chat.id);
  if (users.length === 0) {
    await ctx.reply(t(language, 'auth.none'));
    return;
  }

  const lines = users.map((userId) => `• <a href="tg://user?id=${userId}">${htmlEscape(userId)}</a>`);
  await ctx.reply(`${t(language, 'auth.listTitle')}\n\n${lines.join('\n')}`, { parse_mode: 'HTML' });
}

export async function addAuthHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  if (!(await ensureGroupAdmin(ctx, language))) return;

  let userId;
  try {
    userId = await getTargetUserId(ctx);
  } catch (error) {
    await ctx.reply(t(language, 'auth.targetRequired'));
    return;
  }

  if (await isAuthUser(ctx.chat.id, userId)) {
    await ctx.reply(t(language, 'auth.already'));
    return;
  }

  try {
    await addAuthUser(ctx.chat.id, userId);
  } catch (error) {
    console.error('Failed to add authorized user', error);
    await ctx.reply(t(language, 'auth.addFailed'));
    return;
  }

  await ctx.reply(t(language, 'auth.added', { userId }));
}

export async function removeAuthHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);
  if (!(await ensureGroupAdmin(ctx, language))) return;

  let userId;
  try {
    userId = await getTargetUserId(ctx);
  } catch (error) {
    await ctx.reply(t(language, 'auth.targetRequired'));
    return;
  }

  if (!(await isAuthUser(ctx.chat.id, userId))) {
    await ctx.reply(t(language, 'auth.notAuthorized'));
    return;
  }

  try {
    await removeAuthUser(ctx.chat.id, userId);
  } catch (error) {
    console.error('Failed to remove authorized user', error);
    await ctx.reply(t(language, 'auth.removeFailed'));
    return;
  }

  await ctx.reply(t(language, 'auth.removed', { userId }));
}
