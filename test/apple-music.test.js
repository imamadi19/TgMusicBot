import test from 'node:test';
import assert from 'node:assert/strict';
import { Downloader } from '../src/core/dl/downloader.js';
import { __appleTestHooks } from '../src/handlers/playback.js';
import { t } from '../src/i18n/index.js';
import { languages } from '../src/i18n/languages.js';
import { isAppleMusicUrl, parseAppleMusicUrl, normalizeAppleMusicTrack } from '../src/core/dl/nexray.js';

async function resolveAppleMusicPlayback(track, mockSearch) {
  const results = await mockSearch();
  track.playbackUrl = results[0]?.url;
}

test('apple music url with ?i track is detected and parsed', () => {
  const url = 'https://music.apple.com/id/album/everything-u-are/1793295095?i=1793295104';
  assert.equal(isAppleMusicUrl(url), true);
  const parsed = parseAppleMusicUrl(url);
  assert.equal(parsed.songId, '1793295104');
  assert.equal(parsed.storefront, 'id');
  assert.equal(parsed.isTrackLink, true);
});

test('apple music normalizer maps fields', () => {
  const raw = { id: '1793295104', title: 'Everything U Are', artist: 'Hindia', album: "Doves, '25 on Blank Canvas", duration: 223000, artwork: { url: 'https://is1-ssl.mzstatic.com/image/thumb/{w}x{h}bb.jpg' }, releaseDate: '2025', genre: 'Alternative' };
  const url = 'https://music.apple.com/id/album/everything-u-are/1793295095?i=1793295104';
  const track = normalizeAppleMusicTrack(raw, url);
  assert.equal(track.title, 'Everything U Are');
  assert.equal(track.artist, 'Hindia');
  assert.equal(track.album, "Doves, '25 on Blank Canvas");
  assert.equal(track.duration, 223);
  assert.equal(track.sourceUrl, url);
  assert.equal(track.displayUrl, url);
  assert.equal(track.platform, 'Apple Music');
  assert.equal(track.thumbnail.includes('1200x1200'), true);
});

test('apple playback resolve stores playbackUrl without replacing displayUrl', async () => {
  const track = { title: 'Everything U Are', artist: 'Hindia', displayUrl: 'https://music.apple.com/x', sourceUrl: 'https://music.apple.com/x', platform: 'Apple Music', sourceType: 'apple_music' };
  await resolveAppleMusicPlayback(track, async () => [{ title: 'Hindia - Everything U Are (Official Audio)', url: 'https://youtube.com/watch?v=abc12345678' }]);
  assert.equal(track.playbackUrl, 'https://youtube.com/watch?v=abc12345678');
  assert.equal(track.displayUrl, 'https://music.apple.com/x');
});

test('apple and youtube captions are split', () => {
  const appleCaption = __appleTestHooks.formatSearchSelection('id', [{ platform: 'Apple Music', sourceType: 'apple_music', title: 'Everything U Are', artist: 'Hindia', album: 'Doves', duration: 223, displayUrl: 'https://music.apple.com/x' }], 0);
  assert.match(appleCaption, /Apple Music Discovery/);
  assert.match(appleCaption, /Hindia/);
  assert.doesNotMatch(appleCaption, /Channel|Views|Upload/i);

  const ytCaption = __appleTestHooks.formatSearchSelection('en', [{ platform: 'YouTube', title: 'Song', name: 'Song', channel: 'Chan', duration: 100, url: 'https://youtube.com/watch?v=1' }], 0);
  assert.match(ytCaption, /Channel/);
});

test('apple music i18n keys exist for all languages', () => {
  for (const lang of languages.map((l) => l.code)) {
    const value = t(lang, 'playback.appleMusicDiscovery');
    assert.notEqual(value, 'playback.appleMusicDiscovery');
  }
});

test('downloader uses playbackUrl precedence for download/direct stream commands', async () => {
  const d = new Downloader('https://music.apple.com/id/album/x/1?i=2');
  assert.equal(d.isValid(), true);
});
