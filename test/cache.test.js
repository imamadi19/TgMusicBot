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
