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

test('control keyboard exposes moving progress and transport controls', async () => {
  const { completedProgressKeyboard, controlKeyboard, progressKeyboard, progressLabel } = await import('../src/handlers/keyboards.js');

  assert.equal(progressLabel({ duration: 100, remainingMs: 50000 }), '00:50 | ━━━━━━◉━━━━━ | -00:50');
  assert.match(progressLabel({ duration: 100, startedAt: new Date(Date.now() - 9500).toISOString() }), /^00:09 \| ━◉/);

  const rows = controlKeyboard('en', '', { duration: 65 }).inline_keyboard;
  assert.equal(rows[0][0].callback_data, 'play_progress');
  assert.equal(rows[0][0].text, '00:00 | ◉━━━━━━━━━━━ | -01:05');
  assert.deepEqual(rows[1].map((button) => button.callback_data), ['play_resume', 'play_pause', 'play_replay', 'play_skip', 'play_stop']);
  assert.deepEqual(rows[1].map((button) => button.text), ['▷', 'Ⅱ', '↻', '▸▸▏', '▢']);

  const progressRows = progressKeyboard({ duration: 65 }).inline_keyboard;
  assert.equal(progressRows.length, 1);
  assert.equal(progressRows[0][0].callback_data, 'play_progress');

  const completedRows = completedProgressKeyboard({ duration: 65 }).inline_keyboard;
  assert.equal(completedRows.length, 1);
  assert.equal(completedRows[0][0].text, '01:05 | ━━━━━━━━━━━◉ | -00:00');
});


test('playback control callbacks do not require group administrator status', async () => {
  const { chatCache } = await import('../src/core/cache/chat-cache.js');
  const { vcPlayCallbackHandler } = await import('../src/handlers/callbacks.js');
  const { voicePlayer } = await import('../src/core/player/player.js');
  const chatId = -9100;
  const answers = [];
  let pauseChatId = null;
  const originalPause = voicePlayer.pause;

  chatCache.clear(chatId);
  chatCache.addSong(chatId, { trackId: 'pause-test', name: 'Pause Test', duration: 65, url: 'https://example.com/pause-test', userId: 321 });
  voicePlayer.pause = async (targetChatId) => {
    pauseChatId = targetChatId;
    return true;
  };

  try {
    await vcPlayCallbackHandler({
      chat: { id: chatId, type: 'supergroup' },
      from: { id: 321 },
      callbackQuery: { data: 'play_pause', message: { message_id: 10 } },
      async answerCallbackQuery(payload) { answers.push(payload); },
      async editMessageReplyMarkup() {},
      api: {
        async getChatMember() { throw new Error('admin lookup should not be required for playback controls'); },
        async editMessageReplyMarkup() {},
      },
    });
  } finally {
    voicePlayer.pause = originalPause;
    chatCache.clear(chatId);
  }

  assert.equal(pauseChatId, chatId);
  assert.equal(answers[0]?.text, 'Playback paused.');
});


test('playback control callbacks are limited to the track requester', async () => {
  const { chatCache } = await import('../src/core/cache/chat-cache.js');
  const { vcPlayCallbackHandler } = await import('../src/handlers/callbacks.js');
  const { voicePlayer } = await import('../src/core/player/player.js');
  const chatId = -9101;
  const answers = [];
  let pauseCalled = false;
  const originalPause = voicePlayer.pause;

  chatCache.clear(chatId);
  chatCache.addSong(chatId, { trackId: 'requester-test', name: 'Requester Test', duration: 65, url: 'https://example.com/requester-test', userId: 111 });
  voicePlayer.pause = async () => {
    pauseCalled = true;
    return true;
  };

  try {
    await vcPlayCallbackHandler({
      chat: { id: chatId, type: 'supergroup' },
      from: { id: 222 },
      callbackQuery: { data: 'play_pause', message: { message_id: 11 } },
      async answerCallbackQuery(payload) { answers.push(payload); },
      async editMessageReplyMarkup() { throw new Error('non-requester must not edit playback controls'); },
      api: {
        async getChatMember() { throw new Error('admin lookup should not be required for playback controls'); },
        async editMessageReplyMarkup() { throw new Error('non-requester must not edit playback controls'); },
      },
    });
  } finally {
    voicePlayer.pause = originalPause;
    chatCache.clear(chatId);
  }

  assert.equal(pauseCalled, false);
  assert.equal(answers[0]?.text, 'Only the user who requested this track can use these buttons.');
});

test('progress callback only answers progress without restoring controls on old panels', async () => {
  const { chatCache } = await import('../src/core/cache/chat-cache.js');
  const { vcPlayCallbackHandler } = await import('../src/handlers/callbacks.js');
  const chatId = -9102;
  const answers = [];

  chatCache.clear(chatId);
  chatCache.addSong(chatId, { trackId: 'progress-test', name: 'Progress Test', duration: 65, url: 'https://example.com/progress-test', userId: 111 });

  try {
    await vcPlayCallbackHandler({
      chat: { id: chatId, type: 'supergroup' },
      from: { id: 222 },
      callbackQuery: { data: 'play_progress', message: { message_id: 12 } },
      async answerCallbackQuery(payload) { answers.push(payload); },
      async editMessageReplyMarkup() { throw new Error('progress button must not restore transport controls'); },
      api: {
        async editMessageReplyMarkup() { throw new Error('progress button must not restore transport controls'); },
      },
    });
  } finally {
    chatCache.clear(chatId);
  }

  assert.match(answers[0]?.text, /^00:00 \| ◉/);
  assert.equal(answers[0]?.show_alert, false);
});


test('youtube selection keyboard uses carousel navigation with top result selected first', async () => {
  const { youtubeSelectionKeyboard } = await import('../src/handlers/keyboards.js');
  const tracks = [{ name: 'A' }, { name: 'B' }, { name: 'C' }];

  const first = youtubeSelectionKeyboard(99, tracks).inline_keyboard;
  assert.deepEqual(first.map((row) => row.map((button) => button.callback_data)), [
    ['ytpage:99:2', 'ytpage:99:1'],
    ['ytpick:99:0'],
  ]);

  const middle = youtubeSelectionKeyboard(99, tracks, 1).inline_keyboard;
  assert.deepEqual(middle.map((row) => row.map((button) => button.callback_data)), [
    ['ytpage:99:0', 'ytpage:99:2'],
    ['ytpick:99:1'],
  ]);
});


test('downloader URL validation only allows exact supported hosts or subdomains', async () => {
  const { Downloader } = await import('../src/core/dl/downloader.js');

  assert.equal(new Downloader('https://youtube.com/watch?v=abc').isValid(), true);
  assert.equal(new Downloader('https://music.youtube.com/watch?v=abc').isValid(), true);
  assert.equal(new Downloader('https://open.spotify.com/track/abc').isValid(), true);
  assert.equal(new Downloader('https://example-youtube.com/watch?v=abc').isValid(), false);
  assert.equal(new Downloader('https://youtube.com.evil.example/watch?v=abc').isValid(), false);
  assert.equal(new Downloader('https://evilopen.spotify.com/track/abc').isValid(), false);
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



test('stop advances to next requester but clears same requester queue', async () => {
  const { chatCache } = await import('../src/core/cache/chat-cache.js');
  const { requesterKey, voicePlayer } = await import('../src/core/player/player.js');
  const differentChat = -9001;
  const sameChat = -9002;

  chatCache.clear(differentChat);
  chatCache.clear(sameChat);
  assert.equal(requesterKey({ userId: 10, user: 'Alice' }), 'id:10');

  chatCache.addSong(differentChat, { trackId: 'a', name: 'A', userId: 10 });
  chatCache.addSong(differentChat, { trackId: 'b', name: 'B', userId: 20 });
  const advanced = await voicePlayer.stopOrAdvance(differentChat);
  assert.equal(advanced.cleared, false);
  assert.equal(advanced.stopped.trackId, 'a');
  assert.equal(advanced.next.trackId, 'b');
  assert.equal(chatCache.current(differentChat).trackId, 'b');

  chatCache.addSong(sameChat, { trackId: 'c', name: 'C', userId: 10 });
  chatCache.addSong(sameChat, { trackId: 'd', name: 'D', userId: 10 });
  const cleared = await voicePlayer.stopOrAdvance(sameChat);
  assert.equal(cleared.cleared, true);
  assert.equal(chatCache.getQueueLength(sameChat), 0);

  chatCache.clear(differentChat);
  chatCache.clear(sameChat);
});

test('voice adapter shell wrapper ignores control signals in shell', async () => {
  const { adapterShellCommand } = await import('../src/core/player/player.js');
  assert.equal(adapterShellCommand(), "trap '' USR1 USR2; python3 scripts/pytgcalls_adapter.py");
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

test('Ndikz ytmp3 response exposes direct download URL', async () => {
  const { extractAudioDownloadUrl } = await import('../src/core/dl/nexray.js');
  const payload = {
    status: true,
    creator: 'Ndikz',
    title: 'Khifnu - Merindumu lagi Official Music Video',
    download: 'https://ydl.ymcdn.org/api/v1/download/f5fdb3bd707fcb0498742e4c5d548e10/G8KvOPxuoiE',
  };

  assert.equal(
    extractAudioDownloadUrl(payload),
    'https://ydl.ymcdn.org/api/v1/download/f5fdb3bd707fcb0498742e4c5d548e10/G8KvOPxuoiE',
  );
});

test('download cleanup only removes managed downloaded files', async () => {
  const fs = await import('node:fs/promises');
  const os = await import('node:os');
  const path = await import('node:path');
  const { config } = await import('../src/config/index.js');
  const { deleteTrackDownload } = await import('../src/core/dl/queue-downloads.js');

  const originalDownloadsDir = config.downloadsDir;
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'tgmb-download-cleanup-'));
  const downloadsDir = path.join(tempRoot, 'downloads');
  await fs.mkdir(downloadsDir, { recursive: true });
  config.downloadsDir = downloadsDir;

  try {
    const managedPath = path.join(downloadsDir, 'track.mp3');
    const outsidePath = path.join(tempRoot, 'outside.mp3');
    const cookiePath = path.join(downloadsDir, 'yt-dlp-cookies.txt');
    await fs.writeFile(managedPath, 'audio');
    await fs.writeFile(outsidePath, 'outside');
    await fs.writeFile(cookiePath, 'cookies');

    const managedTrack = { name: 'managed', filePath: managedPath };
    assert.equal(await deleteTrackDownload(managedTrack), true);
    assert.equal(managedTrack.filePath, '');
    await assert.rejects(fs.access(managedPath));

    assert.equal(await deleteTrackDownload({ name: 'outside', filePath: outsidePath }), false);
    await fs.access(outsidePath);

    assert.equal(await deleteTrackDownload({ name: 'cookies', filePath: cookiePath }), false);
    await fs.access(cookiePath);
  } finally {
    config.downloadsDir = originalDownloadsDir;
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});
