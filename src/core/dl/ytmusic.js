import YTMusic from 'ytmusic-api';
import { parseDuration } from '../../utils/duration.js';

let clientPromise;

async function getClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const client = new YTMusic();
      await client.initialize();
      return client;
    })();
  }
  return clientPromise;
}

function firstThumbnail(item) {
  const thumbnail = item.thumbnail ?? item.thumbnails;
  if (typeof thumbnail === 'string') return thumbnail;
  if (Array.isArray(thumbnail)) return thumbnail.at(-1)?.url ?? thumbnail[0]?.url ?? '';
  return thumbnail?.url ?? '';
}

function artistNames(item) {
  const artists = item.artists ?? item.artist;
  if (typeof artists === 'string') return artists;
  if (Array.isArray(artists)) {
    return artists
      .map((artist) => (typeof artist === 'string' ? artist : artist?.name))
      .filter(Boolean)
      .join(', ');
  }
  return artists?.name ?? '';
}

function durationSeconds(item) {
  if (Number.isFinite(item.duration)) return Number(item.duration);
  if (Number.isFinite(item.durationSeconds)) return Number(item.durationSeconds);
  if (typeof item.duration === 'string') return parseDuration(item.duration);
  if (typeof item.durationText === 'string') return parseDuration(item.durationText);
  return 0;
}

function videoIdFor(item) {
  return item.videoId ?? item.video_id ?? item.id ?? item.video?.id ?? item.video?.videoId ?? '';
}

function trackFromItem(item, fallbackInput) {
  const videoId = videoIdFor(item);
  if (!videoId) return null;

  const title = item.name ?? item.title ?? fallbackInput;
  const artists = artistNames(item);
  const name = artists && !title.includes(artists) ? `${title} — ${artists}` : title;

  return {
    trackId: String(videoId),
    name,
    url: `https://music.youtube.com/watch?v=${videoId}`,
    duration: durationSeconds(item),
    thumbnail: firstThumbnail(item),
    platform: 'YouTube Music',
  };
}

export async function searchYouTubeMusic(input, limit = 10) {
  const client = await getClient();
  const results = await client.search(input);
  return results
    .map((item) => trackFromItem(item, input))
    .filter(Boolean)
    .slice(0, limit);
}
