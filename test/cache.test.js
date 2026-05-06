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
