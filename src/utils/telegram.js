export const telegramMessageRegex = /https?:\/\/t\.me\/(?:c\/)?([\w_]+|\d+)\/(\d+)/i;

export function commandArgs(ctx) {
  const text = ctx.message?.text
    ?? ctx.message?.caption
    ?? ctx.channelPost?.text
    ?? ctx.channelPost?.caption
    ?? ctx.editedMessage?.text
    ?? ctx.editedMessage?.caption
    ?? ctx.editedChannelPost?.text
    ?? ctx.editedChannelPost?.caption
    ?? '';
  return text.replace(/^\/\w+(?:@\w+)?\s*/u, '').trim();
}

export function isOwner(userId, config) {
  return Number(userId) === Number(config.ownerId) || config.devs.includes(Number(userId));
}

export function htmlEscape(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function isUrl(value = '') {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}
