import test from 'node:test';
import assert from 'node:assert/strict';
import { ChatCache } from '../src/core/cache/chat-cache.js';
import { TtlCache } from '../src/core/cache/ttl-cache.js';

test('chat cache preserves queue flow', () => {
  const cache = new ChatCache();
  assert.equal(cache.addSong(1, { trackId: 'a', name: 'A' }), 1);
  assert.equal(cache.addSong(1, { trackId: 'b', name: 'B' }), 2);
  assert.equal(cache.getQueueLength(1), 2);
  assert.equal(cache.current(1).trackId, 'a');
  assert.equal(cache.remove(1, 1).trackId, 'b');
  assert.equal(cache.shift(1).trackId, 'a');
  assert.equal(cache.getQueueLength(1), 0);
});

test('ttl cache expires values', async () => {
  const cache = new TtlCache(10, 10);
  cache.set('key', 'value');
  assert.equal(cache.get('key'), 'value');
  await new Promise((resolve) => setTimeout(resolve, 25));
  assert.equal(cache.get('key'), undefined);
  cache.close();
});

test('admin cache fetches, stores, and clears normalized admins', async () => {
  const {
    clearAdminCache,
    getAdmins,
    getCachedAdmins,
  } = await import('../src/core/cache/admin-cache.js');
  let calls = 0;
  const api = {
    async getChatAdministrators() {
      calls += 1;
      return [
        { status: 'creator', user: { id: 10, first_name: 'Owner', username: 'owner' } },
        { status: 'administrator', user: { id: 20, first_name: 'Admin' }, can_manage_chat: true },
      ];
    },
  };

  clearAdminCache(-100);
  const first = await getAdmins(api, -100);
  assert.equal(calls, 1);
  assert.deepEqual(first.map((admin) => admin.userId), [10, 20]);
  assert.equal(first[1].canManageChat, true);

  const second = await getAdmins(api, -100);
  assert.equal(calls, 1);
  assert.equal(second, first);
  assert.equal(getCachedAdmins(-100), first);

  clearAdminCache(-100);
  await getAdmins(api, -100);
  assert.equal(calls, 2);
});

test('broadcast options and targets mirror Go handler flags', async () => {
  const { buildTargets, getFloodWait, parseBroadcastOptions } = await import('../src/handlers/broadcast.js');

  assert.deepEqual(parseBroadcastOptions('-user -copy'), { copyMode: true, mode: 'user' });
  assert.deepEqual(parseBroadcastOptions('-chat'), { copyMode: false, mode: 'chat' });
  assert.deepEqual(parseBroadcastOptions(''), { copyMode: false, mode: 'both' });

  assert.deepEqual(buildTargets([-100, -200], [10, 20], 'chat'), [-100, -200]);
  assert.deepEqual(buildTargets([-100], [10, 20], 'user'), [10, 20]);
  assert.deepEqual(buildTargets([-100], [10], 'both'), [-100, 10]);

  assert.equal(getFloodWait({ parameters: { retry_after: 3 } }), 3);
  assert.equal(getFloodWait({ message: 'Too Many Requests: retry after 7' }), 7);
  assert.equal(getFloodWait(new Error('boom')), 0);
});

test('control keyboard exposes callback actions from Go flow', async () => {
  const { controlKeyboard } = await import('../src/handlers/keyboards.js');

  const normal = controlKeyboard('en').inline_keyboard.flat().map((button) => button.callback_data);
  assert.deepEqual(normal, ['play_pause', 'play_skip', 'play_stop', 'play_mute', 'play_add_to_list', 'vcplay_close']);

  const paused = controlKeyboard('en', 'pause').inline_keyboard.flat().map((button) => button.callback_data);
  assert.equal(paused[0], 'play_resume');

  const muted = controlKeyboard('en', 'mute').inline_keyboard.flat().map((button) => button.callback_data);
  assert.equal(muted[3], 'play_unmute');
});

test('new auth broadcast callback keys are localized beyond English', async () => {
  const { languages } = await import('../src/i18n/languages.js');
  const { t } = await import('../src/i18n/index.js');
  const keys = ['buttons.resume', 'buttons.mute', 'callbacks.noActivePlayback', 'auth.listTitle', 'broadcast.started', 'devs.devOnly', 'filters.adminRequired'];

  for (const { code } of languages) {
    if (code === 'en') continue;
    for (const key of keys) {
      assert.notEqual(t(code, key), t('en', key), `${code}.${key} should not fall back to English`);
    }
  }
});

test('dev active voice chat formatter includes queue and current track', async () => {
  const { ChatCache } = await import('../src/core/cache/chat-cache.js');
  const { formatActiveVoiceChats } = await import('../src/handlers/devs.js');
  const cache = new ChatCache();
  cache.addSong(-100, { name: 'Song', url: 'https://example.com/song', duration: 65 });

  const text = formatActiveVoiceChats([{ chatId: -100, track: { name: 'Song', url: 'https://example.com/song', duration: 65 } }], cache);
  assert.match(text, /Active Voice Chats/);
  assert.match(text, /Queue Size:<\/b> 1/);
  assert.match(text, /Song/);
});

test('extras helpers match Go utility behavior', async () => {
  const { getFormattedDuration, plural, resolveTargetUserId, senderId } = await import('../src/utils/extras.js');

  assert.equal(plural(1, 'day'), '1 day');
  assert.equal(plural(2, 'day'), '2 days');
  assert.equal(getFormattedDuration((30 * 24 * 3600) + (7 * 24 * 3600) + 65), '1 month 1 week 1 minute 5 seconds');
  assert.equal(senderId({ from: { id: 123 } }), 123);

  await assert.rejects(
    resolveTargetUserId({ from: { id: 10 }, message: { text: '/auth 10' }, api: {} }),
    /cannot perform action on yourself/,
  );
  assert.equal(await resolveTargetUserId({ from: { id: 10 }, message: { text: '/auth 20' }, api: {} }), 20);
});

test('filters check bot admin invite permission and play mode gates users', async () => {
  const { checkBotAdmin } = await import('../src/handlers/filters.js');
  const replies = [];
  const baseCtx = {
    from: { id: 99 },
    chat: { id: -100, type: 'supergroup' },
    me: { id: 777 },
    api: { async getChatMember() { return { status: 'administrator', can_invite_users: true }; } },
  };

  assert.equal(await checkBotAdmin(baseCtx, (message) => replies.push(message)), true);
  assert.deepEqual(replies, []);

  const deniedCtx = { ...baseCtx, api: { async getChatMember() { return { status: 'administrator', can_invite_users: false }; } } };
  assert.equal(await checkBotAdmin(deniedCtx, (message) => replies.push(message)), false);
  assert.match(replies.at(-1), /invite users/);
});

test('assistant invite links fall back to existing group links', async () => {
  const { createAssistantInviteLinks } = await import('../src/handlers/playback.js');
  const calls = [];
  const ctx = {
    chat: { id: -100 },
    api: {
      async createChatInviteLink(chatId, options) {
        calls.push({ chatId, options });
        return { invite_link: 'https://t.me/+fresh' };
      },
      async getChat(chatId) {
        calls.push({ chatId, getChat: true });
        return { invite_link: 'https://t.me/+permanent', username: 'public_group' };
      },
    },
  };

  assert.deepEqual(await createAssistantInviteLinks(ctx), [
    'https://t.me/+fresh',
    'https://t.me/+permanent',
    'https://t.me/public_group',
  ]);
  assert.equal(calls[0].chatId, -100);
  assert.equal(calls[0].options.name, 'TgMusicBot assistant auto-join');
  assert.equal('member_limit' in calls[0].options, false);
  assert.equal(calls[1].getChat, true);
});

test('assistant invite links use group link when bot-created invite fails', async () => {
  const { createAssistantInviteLinks } = await import('../src/handlers/playback.js');
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    const ctx = {
      chat: { id: -100 },
      api: {
        async createChatInviteLink() { throw new Error('not enough rights'); },
        async getChat() { return { invite_link: 'https://t.me/+fallback' }; },
      },
    };

    assert.deepEqual(await createAssistantInviteLinks(ctx), ['https://t.me/+fallback']);
  } finally {
    console.warn = originalWarn;
  }
});

test('helpers extract urls and Telegram media metadata', async () => {
  const { coalesce, getFile, getUrl, isValidMedia, truncate } = await import('../src/utils/helpers.js');

  assert.equal(getUrl({ text: 'listen https://example.com/a', entities: [{ type: 'url', offset: 7, length: 21 }] }), 'https://example.com/a');
  assert.equal(getUrl({ text: 'click here', entities: [{ type: 'text_link', offset: 0, length: 5, url: 'https://example.com/b' }] }), 'https://example.com/b');
  assert.equal(getUrl({ reply_to_message: { caption: 'reply https://example.com/c', caption_entities: [{ type: 'url', offset: 6, length: 21 }] } }, { isReply: true }), 'https://example.com/c');

  assert.equal(isValidMedia({ audio: { file_id: 'a' } }), true);
  assert.equal(isValidMedia({ document: { file_id: 'd', mime_type: 'video/mp4' } }), true);
  assert.equal(isValidMedia({ document: { file_id: 'd', mime_type: 'application/pdf' } }), false);

  assert.deepEqual(getFile({ voice: { file_id: 'v' } }), { file: { file_id: 'v' }, name: 'voice_note.ogg' });
  assert.deepEqual(getFile({ document: { file_id: 'd', file_name: 'track.mp3' } }), { file: { file_id: 'd', file_name: 'track.mp3' }, name: 'track.mp3' });
  assert.equal(coalesce('', 'fallback'), 'fallback');
  assert.equal(coalesce('value', 'fallback'), 'value');
  assert.equal(truncate('abcdef', 3), 'abc');
});
