import test from 'node:test';
import assert from 'node:assert/strict';
import { ChatCache } from '../src/core/cache/chat-cache.js';
import { parseSeekValue } from '../src/handlers/playback.js';

test('seek parser supports seconds, mm:ss, hh:mm:ss and signed offsets', () => {
  assert.deepEqual(parseSeekValue('90'), { absolute: true, seconds: 90 });
  assert.deepEqual(parseSeekValue('01:30'), { absolute: true, seconds: 90 });
  assert.deepEqual(parseSeekValue('1:01:30'), { absolute: true, seconds: 3690 });
  assert.deepEqual(parseSeekValue('+30'), { absolute: false, seconds: 30 });
  assert.deepEqual(parseSeekValue('-10'), { absolute: false, seconds: -10 });
});

test('seek parser rejects invalid positions', () => {
  assert.equal(parseSeekValue(''), null);
  assert.equal(parseSeekValue('abc'), null);
  assert.equal(parseSeekValue('-'), null);
  assert.equal(parseSeekValue('1:-2'), null);
});

test('volume is clamped to 0-200 and defaults to 100', () => {
  const cache = new ChatCache();
  assert.equal(cache.getVolume('c1'), 100);
  assert.equal(cache.setVolume('c1', -10), 0);
  assert.equal(cache.setVolume('c1', 250), 200);
  assert.equal(cache.setVolume('c1', 80), 80);
});

test('shuffleUpcoming keeps current track and preserves upcoming members', () => {
  const cache = new ChatCache();
  const tracks = ['now', 'a', 'b', 'c'].map((id) => ({ trackId: id }));
  cache.addSongs('chat', tracks);
  const before = cache.getQueue('chat');
  cache.shuffleUpcoming('chat');
  const after = cache.getQueue('chat');
  assert.equal(after[0].trackId, 'now');
  assert.equal(after.length, before.length);
  assert.deepEqual(after.slice(1).map((x) => x.trackId).sort(), before.slice(1).map((x) => x.trackId).sort());
});
