import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../../config/index.js';
import { Downloader } from './downloader.js';

const downloadPromises = new WeakMap();
const COOKIE_FILE_NAME = 'yt-dlp-cookies.txt';

function trackLabel(track) {
  return track?.name ?? track?.title ?? track?.url ?? 'unknown track';
}

function isManagedDownloadPath(filePath) {
  const value = String(filePath ?? '').trim();
  if (!value) return false;
  const resolvedFile = path.resolve(value);
  const resolvedDownloadsDir = path.resolve(config.downloadsDir);
  return (
    path.basename(resolvedFile) !== COOKIE_FILE_NAME
    && resolvedFile.startsWith(`${resolvedDownloadsDir}${path.sep}`)
  );
}

export async function deleteTrackDownload(track) {
  if (!track) return false;
  const pendingDownload = downloadPromises.get(track);
  if (pendingDownload && !track.filePath) {
    await pendingDownload.catch(() => null);
  }

  const filePath = track.filePath;
  if (!isManagedDownloadPath(filePath)) return false;
  await fs.rm(filePath, { force: true });
  if (track.filePath === filePath) track.filePath = '';
  downloadPromises.delete(track);
  return true;
}

export function cleanupTrackDownload(track, context = {}) {
  deleteTrackDownload(track).catch((error) => {
    const chatInfo = context.chatId ? ` untuk chat ${context.chatId}` : '';
    console.warn(`Gagal hapus download ${trackLabel(track)}${chatInfo}`, error);
  });
}

export function cleanupTrackDownloads(tracks, context = {}) {
  for (const track of Array.isArray(tracks) ? tracks.filter(Boolean) : []) {
    cleanupTrackDownload(track, context);
  }
}

export async function ensureTrackDownloaded(track, isVideo = Boolean(track?.isVideo)) {
  if (!track) throw new Error('Track tidak tersedia untuk diunduh.');
  if (track.filePath) return track.filePath;

  let downloadPromise = downloadPromises.get(track);
  if (!downloadPromise) {
    downloadPromise = (async () => {
      const downloader = new Downloader(track.url);
      const filePath = await downloader.download(track, isVideo);
      track.filePath = filePath;
      return filePath;
    })();
    downloadPromises.set(track, downloadPromise);
  }

  try {
    return await downloadPromise;
  } catch (error) {
    if (downloadPromises.get(track) === downloadPromise) downloadPromises.delete(track);
    if (!track.filePath) track.filePath = '';
    throw error;
  }
}

export function preloadTrack(track, isVideo = Boolean(track?.isVideo), context = {}) {
  ensureTrackDownloaded(track, isVideo).catch((error) => {
    const chatInfo = context.chatId ? ` untuk chat ${context.chatId}` : '';
    console.warn(`Gagal preload ${trackLabel(track)}${chatInfo}`, error);
  });
}

export function preloadTracks(tracks, context = {}) {
  const queue = Array.isArray(tracks) ? tracks.filter(Boolean) : [];
  if (queue.length === 0) return;

  Promise.resolve().then(async () => {
    for (const track of queue) {
      await ensureTrackDownloaded(track, Boolean(track.isVideo));
    }
  }).catch((error) => {
    const chatInfo = context.chatId ? ` untuk chat ${context.chatId}` : '';
    console.warn(`Gagal preload queue${chatInfo}`, error);
  });
}
