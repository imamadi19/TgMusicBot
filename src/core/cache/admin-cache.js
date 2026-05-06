import { TtlCache } from './ttl-cache.js';

export const ADMIN_CACHE_TTL_MS = 30 * 60 * 1000;

const adminCache = new TtlCache(ADMIN_CACHE_TTL_MS, 5 * 60 * 1000);

function normalizeAdmin(member) {
  const user = member?.user ?? {};
  return {
    userId: Number(user.id),
    username: user.username ?? '',
    firstName: user.first_name ?? '',
    status: member?.status ?? '',
    canManageChat: Boolean(member?.can_manage_chat),
    canManageVideoChats: Boolean(member?.can_manage_video_chats),
    isAnonymous: Boolean(member?.is_anonymous),
  };
}

function cacheKey(chatId) {
  return `admins:${chatId}`;
}

export function clearAdminCache(chatId) {
  adminCache.delete(cacheKey(chatId));
}

export function clearAllAdminCache() {
  adminCache.clear();
}

export function getCachedAdmins(chatId) {
  return adminCache.get(cacheKey(chatId)) ?? null;
}

export async function getAdmins(api, chatId, { force = false } = {}) {
  if (!force) {
    const cached = getCachedAdmins(chatId);
    if (cached) return cached;
  }

  const admins = (await api.getChatAdministrators(chatId)).map(normalizeAdmin);
  adminCache.set(cacheKey(chatId), admins);
  return admins;
}

export function isAdminCached(chatId, userId) {
  const admins = getCachedAdmins(chatId);
  if (!admins) return false;
  return admins.some((admin) => Number(admin.userId) === Number(userId));
}

export function closeAdminCache() {
  adminCache.close();
}
