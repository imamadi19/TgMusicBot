import { test } from 'node:test';
import assert from 'node:assert';
import { parseLrc } from '../src/core/lyrics/lrc-parser.js';
import { normalizeTitle } from '../src/core/lyrics/lrclib.js';
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

test('Lyrics Cache', () => {
  clearCache();

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
  assert.strictEqual(getCachedLyrics(track), null);

  // Set and Get cached track
  setCachedLyrics(track, lyricsData);
  const cached = getCachedLyrics(track);
  
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
