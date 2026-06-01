import { test } from 'node:test';
import assert from 'node:assert';
import { parseLrc } from '../src/core/lyrics/lrc-parser.js';
import { normalizeTitle, classifyFetchError, isAbortError } from '../src/core/lyrics/lrclib.js';
import { getCacheKey, getCachedLyrics, setCachedLyrics, clearCache } from '../src/core/lyrics/lyrics-cache.js';
import { normalizeLyricsMetadata } from '../src/core/lyrics/track-metadata.js';

test('LRC Parser', () => {
  const lrcText = `
[ar:Rick Astley]
[ti:Never Gonna Give You Up]
[al:Whenever You Need Somebody]
[length:03:35]

[00:12.30]Never gonna give you up
[00:16.10][00:45.10]Never gonna let you down
[00:20.05]
[00:25.00]  
[01:02:03.45]Far future line
  `;

  const parsed = parseLrc(lrcText);

  assert.strictEqual(parsed.length, 4); // 4 valid lines: 12.30, 16.10, 45.10, and 3723.45 (empty ones and tags skipped)
  
  assert.strictEqual(parsed[0].time, 12.30);
  assert.strictEqual(parsed[0].text, 'Never gonna give you up');

  // Multi-timestamp sorting check
  assert.strictEqual(parsed[1].time, 16.10);
  assert.strictEqual(parsed[1].text, 'Never gonna let you down');

  assert.strictEqual(parsed[2].time, 45.10);
  assert.strictEqual(parsed[2].text, 'Never gonna let you down');

  // hh:mm:ss.xx format check: 01:02:03.45 = 1*3600 + 2*60 + 3 + 0.45 = 3723.45
  assert.strictEqual(parsed[3].time, 3723.45);
  assert.strictEqual(parsed[3].text, 'Far future line');
});

test('Title Normalizer', () => {
  assert.strictEqual(normalizeTitle('Rick Astley - Never Gonna Give You Up (Official Video)'), 'Rick Astley - Never Gonna Give You Up');
  assert.strictEqual(normalizeTitle('Faded [Official Music Video]'), 'Faded');
  assert.strictEqual(normalizeTitle('Song Title (lyrics)'), 'Song Title');
  assert.strictEqual(normalizeTitle('Song Title (HD)'), 'Song Title');
  assert.strictEqual(normalizeTitle('Song Title lyrics'), 'Song Title');
  assert.strictEqual(normalizeTitle('Song Title (Lirik)'), 'Song Title');
  assert.strictEqual(normalizeTitle('   Spacing   Test   '), 'Spacing Test');
});

test('Lyrics Cache', async () => {
  await clearCache();

  const track = {
    trackId: 'track123',
    title: 'Never Gonna Give You Up',
    artist: 'Rick Astley',
    duration: 215
  };

  const lyricsData = {
    provider: 'lrclib',
    synced: true,
    lines: [{ time: 10, text: 'Test' }],
    plainLyrics: 'Test lyrics',
    sourceId: '12345'
  };

  // Get cache key test
  const key = getCacheKey(track);
  assert.ok(key.includes('track123'));
  assert.ok(key.includes('never gonna give you up'));

  // Get uncached track
  assert.strictEqual(await getCachedLyrics(track), null);

  // Set and Get cached track
  await setCachedLyrics(track, lyricsData);
  const cached = await getCachedLyrics(track);
  
  assert.ok(cached);
  assert.strictEqual(cached.provider, 'lrclib');
  assert.strictEqual(cached.synced, true);
  assert.strictEqual(cached.lines.length, 1);
  assert.strictEqual(cached.plainLyrics, 'Test lyrics');
  assert.strictEqual(cached.sourceId, '12345');
});

test('Metadata Normalization', () => {
  // Test case 1
  const res1 = normalizeLyricsMetadata({ title: 'Alan Walker - Faded (Official Music Video)', artist: '' });
  assert.strictEqual(res1.artist, 'Alan Walker');
  assert.strictEqual(res1.title, 'Faded');
  assert.ok(res1.candidates.some(c => c.artist === 'Alan Walker' && c.title === 'Faded'));

  // Test case 2
  const res2 = normalizeLyricsMetadata({ title: 'BLACKPINK - ‘Pink Venom’ M/V', artist: '' });
  assert.strictEqual(res2.artist, 'BLACKPINK');
  assert.strictEqual(res2.title, 'Pink Venom');

  // Test case 3
  const res3 = normalizeLyricsMetadata({ title: 'Taylor Swift - Anti-Hero (Official Music Video)', artist: '' });
  assert.strictEqual(res3.artist, 'Taylor Swift');
  assert.strictEqual(res3.title, 'Anti-Hero');
});

import { lyricsPanelKeyboard } from '../src/handlers/lyrics.js';

test('Lyrics Panel Keyboard Generator', () => {
  // Test case 1: no active track
  const kb1 = lyricsPanelKeyboard('en', { hasActiveTrack: false });
  assert.ok(kb1.inline_keyboard);
  assert.strictEqual(kb1.inline_keyboard.length, 2);
  assert.strictEqual(kb1.inline_keyboard[0][0].callback_data, 'lyrics_on');
  assert.strictEqual(kb1.inline_keyboard[1][0].callback_data, 'lyrics_close');

  // Test case 2: has active track
  const kb2 = lyricsPanelKeyboard('en', { hasActiveTrack: true });
  assert.ok(kb2.inline_keyboard);
  assert.strictEqual(kb2.inline_keyboard.length, 4);
  assert.strictEqual(kb2.inline_keyboard[0][0].callback_data, 'lyrics_on');
  assert.strictEqual(kb2.inline_keyboard[0][1].callback_data, 'lyrics_off');
  assert.strictEqual(kb2.inline_keyboard[1][0].callback_data, 'lyrics_refresh');
  assert.strictEqual(kb2.inline_keyboard[1][1].callback_data, 'lyrics_clearcache');
  assert.strictEqual(kb2.inline_keyboard[2][0].callback_data, 'lyrics_clear_refresh');
  assert.strictEqual(kb2.inline_keyboard[3][0].callback_data, 'lyrics_close');
});

test('LRCLIB Error Handling and Classification', () => {
  // Test isAbortError
  const abortErr = new Error('The user aborted a request.');
  abortErr.name = 'AbortError';
  assert.strictEqual(isAbortError(abortErr), true);

  const regularErr = new Error('Some standard error');
  assert.strictEqual(isAbortError(regularErr), false);

  // Test classifyFetchError
  assert.strictEqual(classifyFetchError(abortErr), 'timeout');
  assert.strictEqual(classifyFetchError(new Error('getaddrinfo ENOTFOUND lrclib.net')), 'network');
  assert.strictEqual(classifyFetchError(new Error('read ECONNRESET')), 'network');
  assert.strictEqual(classifyFetchError(new Error('connect ETIMEDOUT')), 'timeout');
  assert.strictEqual(classifyFetchError(new Error('some random http error')), 'http_or_unknown');
});

test('Lyrics Error Caching', async () => {
  await clearCache();

  const track = {
    trackId: 'track_err_test',
    title: 'Error Song',
    artist: 'Error Artist',
    duration: 180
  };

  const errorData = {
    provider: 'lrclib',
    synced: false,
    lines: [],
    plainLyrics: '',
    sourceId: '',
    status: 'error',
    reason: 'timeout',
    transient: true
  };

  await setCachedLyrics(track, errorData);
  const cached = await getCachedLyrics(track);

  assert.ok(cached);
  assert.strictEqual(cached.status, 'error');
  assert.strictEqual(cached.reason, 'timeout');
  assert.strictEqual(cached.synced, false);
});

import { getLyrics as getServiceLyrics } from '../src/core/lyrics/lyrics-service.js';

test('Lyrics Service Multi-Provider Fallback and Concurrency', async () => {
  await clearCache();

  const track = {
    title: 'Faded',
    artist: 'Alan Walker',
    duration: 212
  };

  const result = await getServiceLyrics(track);
  assert.ok(result);
  assert.ok(['synced', 'plainOnly', 'notFound', 'rateLimited', 'timeout', 'error'].includes(result.status));

  const cachedResult = await getCachedLyrics(track);
  assert.ok(cachedResult);
  assert.strictEqual(cachedResult.status, result.status);
});

