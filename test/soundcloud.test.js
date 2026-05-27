import test from 'node:test';
import assert from 'node:assert/strict';
import { Downloader } from '../src/core/dl/downloader.js';
import { __appleTestHooks } from '../src/handlers/playback.js';
import { t } from '../src/i18n/index.js';
import { languages } from '../src/i18n/languages.js';

test('soundcloud search caption uses SoundCloud template (not YouTube fields)', () => {
  const caption = __appleTestHooks.formatSearchSelection('en', [{
    platform: 'SoundCloud',
    sourceType: 'soundcloud',
    title: 'Dream Track',
    artist: 'Indie Artist',
    duration: 205,
    url: 'https://soundcloud.com/artist/dream-track',
  }], 0);
  assert.match(caption, /SoundCloud Discovery/);
  assert.match(caption, /Indie Artist/);
  assert.doesNotMatch(caption, /Channel|Views|Upload/i);
});

test('soundcloud now-playing caption keeps source URL and branding', () => {
  const caption = __appleTestHooks.formatTrack('en', {
    platform: 'SoundCloud',
    sourceType: 'soundcloud',
    name: 'Dream Track',
    artist: 'Indie Artist',
    duration: 205,
    url: 'https://soundcloud.com/artist/dream-track',
    user: 'tester',
  });
  assert.match(caption, /SoundCloud Now Playing/);
  assert.match(caption, /https:\/\/soundcloud\.com\/artist\/dream-track/);
  assert.doesNotMatch(caption, /Now playing\./i);
});

test('soundcloud i18n keys resolve for all languages', () => {
  for (const lang of languages.map((l) => l.code)) {
    assert.notEqual(t(lang, 'playback.soundcloudDiscovery'), 'playback.soundcloudDiscovery');
    assert.notEqual(t(lang, 'playback.soundcloudNowPlaying'), 'playback.soundcloudNowPlaying');
  }
});

test('downloader accepts soundcloud URL as supported host', () => {
  const d = new Downloader('https://soundcloud.com/artist/dream-track');
  assert.equal(d.isValid(), true);
});
