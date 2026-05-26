import test from 'node:test';
import assert from 'node:assert/strict';
import { Downloader } from '../src/core/dl/downloader.js';
import { t } from '../src/i18n/index.js';
import { languages } from '../src/i18n/languages.js';
import { __appleTestHooks } from '../src/handlers/playback.js';
import { isSpotifyUrl, parseSpotifyUrl, normalizeSpotifyTrack, resolveSpotifyPlaybackTrack, isSpotifyTrack } from '../src/core/dl/nexray.js';

test('spotify track URLs are detected and parsed', () => {
  const url = 'https://open.spotify.com/intl-id/track/4uLU6hMCjMI75M1A2tKUQC?si=abc';
  assert.equal(isSpotifyUrl(url), true);
  const parsed = parseSpotifyUrl(url);
  assert.equal(parsed.entityType, 'track');
  assert.equal(parsed.spotifyId, '4uLU6hMCjMI75M1A2tKUQC');
  assert.equal(parsed.isTrack, true);
  assert.equal(parsed.canonicalUrl, 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC');
});

test('spotify normalizer maps metadata model', () => {
  const raw = {
    id: '4uLU6hMCjMI75M1A2tKUQC',
    title: 'Never Gonna Give You Up',
    artist: 'Rick Astley',
    artists: [{ name: 'Rick Astley' }],
    album: 'Whenever You Need Somebody',
    releaseDate: '1987-07-27',
    duration: 212000,
    thumbnail: 'https://i.scdn.co/image/ab67616d0000b273',
    explicit: false,
    popularity: 83,
    url: 'https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC',
  };
  const track = normalizeSpotifyTrack(raw, raw.url);
  assert.equal(track.trackId, 'spotify:4uLU6hMCjMI75M1A2tKUQC');
  assert.equal(track.spotifyId, '4uLU6hMCjMI75M1A2tKUQC');
  assert.equal(track.platform, 'Spotify');
  assert.equal(track.sourceType, 'spotify');
  assert.equal(track.displayUrl, raw.url);
  assert.equal(track.duration, 212);
  assert.deepEqual(track.artists, ['Rick Astley']);
});

test('spotify resolver preserves displayUrl and fills playbackUrl', async () => {
  const track = normalizeSpotifyTrack({ id: 'x', title: 'Song', artist: 'Singer', url: 'https://open.spotify.com/track/x' }, 'https://open.spotify.com/track/x');
  await resolveSpotifyPlaybackTrack(track, async () => [{ title: 'Singer - Song (Official Audio)', url: 'https://youtube.com/watch?v=abc12345678' }]);
  assert.equal(track.playbackUrl, 'https://youtube.com/watch?v=abc12345678');
  assert.equal(track.displayUrl, 'https://open.spotify.com/track/x');
  assert.equal(isSpotifyTrack(track), true);
});

test('spotify caption format is non-youtube style', () => {
  const caption = __appleTestHooks.formatSearchSelection('en', [{ platform: 'Spotify', sourceType: 'spotify', title: 'Song', artist: 'Singer', album: 'Album', duration: 180, displayUrl: 'https://open.spotify.com/track/x' }], 0);
  assert.match(caption, /Spotify Discovery/);
  assert.doesNotMatch(caption, /Channel|Views|Upload/i);
});

test('spotify i18n keys exist for all languages', () => {
  for (const lang of languages.map((l) => l.code)) {
    assert.notEqual(t(lang, 'playback.spotifyDiscovery'), 'playback.spotifyDiscovery');
    assert.notEqual(t(lang, 'playback.spotifyResolving'), 'playback.spotifyResolving');
  }
});

test('downloader accepts spotify url as supported host', () => {
  const d = new Downloader('https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC');
  assert.equal(d.isValid(), true);
});
