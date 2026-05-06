import { clearAdminCache, getAdmins } from '../core/cache/admin-cache.js';
import { TtlCache } from '../core/cache/ttl-cache.js';
import { getUserLanguage } from '../core/db/user-settings.js';
import { t } from '../i18n/index.js';
import { secondsToClock } from '../utils/duration.js';

export const RELOAD_ADMIN_COOLDOWN_MS = 3 * 60 * 1000;

const reloadRateLimit = new TtlCache(RELOAD_ADMIN_COOLDOWN_MS, 60 * 1000);

function rateLimitKey(chatId) {
  return `reload:${chatId}`;
}

function remainingCooldownSeconds(lastUsed) {
  return Math.ceil(Math.max(0, RELOAD_ADMIN_COOLDOWN_MS - (Date.now() - lastUsed)) / 1000);
}

export async function reloadAdminCacheHandler(ctx) {
  const language = await getUserLanguage(ctx.from?.id);

  if (ctx.chat?.type === 'private') {
    await ctx.reply(t(language, 'admin.groupOnly'));
    return;
  }

  const key = rateLimitKey(ctx.chat.id);
  const lastUsed = reloadRateLimit.get(key);
  if (lastUsed) {
    const remaining = remainingCooldownSeconds(lastUsed);
    await ctx.reply(t(language, 'admin.reloadWait', { time: secondsToClock(remaining) }));
    return;
  }

  reloadRateLimit.set(key, Date.now());
  const reply = await ctx.reply(t(language, 'admin.reloadStarted'));

  try {
    clearAdminCache(ctx.chat.id);
    const admins = await getAdmins(ctx.api, ctx.chat.id, { force: true });
    await ctx.api.editMessageText(
      ctx.chat.id,
      reply.message_id,
      t(language, 'admin.reloadSuccess', { count: admins.length }),
    );
  } catch (error) {
    clearAdminCache(ctx.chat.id);
    await ctx.api.editMessageText(
      ctx.chat.id,
      reply.message_id,
      t(language, 'admin.reloadFailed', { error: error?.message ?? error }),
    );
  }
}
