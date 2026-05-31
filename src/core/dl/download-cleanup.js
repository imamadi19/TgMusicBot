import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../../config/index.js';
import { isFileCurrentlyInUse } from '../cache/active-files.js';
import { voicePlayer } from '../player/player.js';

const COOKIE_FILE_NAME = 'yt-dlp-cookies.txt';

export async function cleanupOldDownloads({ now = Date.now() } = {}) {
  const maxAgeHours = process.env.DOWNLOAD_CACHE_MAX_AGE_HOURS !== undefined
    ? (Number(config.downloadCacheMaxAgeHours) ?? 24)
    : (Number(config.downloadRetentionHours) ?? 24);
  const ttlMs = maxAgeHours * 60 * 60 * 1000;
  const maxSizeMb = Number(config.downloadCacheMaxSizeMb) ?? 2048;
  const maxSizeBytes = maxSizeMb * 1024 * 1024;

  await fs.mkdir(config.downloadsDir, { recursive: true });
  const entries = await fs.readdir(config.downloadsDir, { withFileTypes: true });

  let removed = 0;
  let scanned = 0;
  const filesList = [];

  for (const entry of entries) {
    if (!entry.isFile() || entry.name === COOKIE_FILE_NAME) continue;
    scanned += 1;
    const filePath = path.join(config.downloadsDir, entry.name);
    try {
      const stats = await fs.stat(filePath);
      filesList.push({
        path: filePath,
        name: entry.name,
        size: stats.size,
        mtimeMs: stats.mtimeMs,
      });
    } catch {
      // ignore files that disappear while scanning
    }
  }

  // Get current active calls to check if file is in use
  const activeCalls = typeof voicePlayer !== 'undefined' && typeof voicePlayer.activeCalls === 'function' 
    ? voicePlayer.activeCalls() 
    : [];

  // 1. Delete files older than max age, EXCEPT those in use
  const remainingFiles = [];
  for (const file of filesList) {
    if (isFileCurrentlyInUse(file.path, activeCalls)) {
      remainingFiles.push(file);
      continue;
    }

    if ((now - file.mtimeMs) >= ttlMs) {
      try {
        await fs.rm(file.path, { force: true });
        removed += 1;
        console.log(`[Cache Cleanup] Removed expired file: ${file.name} (Age: ${((now - file.mtimeMs) / 3600000).toFixed(1)}h)`);
      } catch (err) {
        console.warn(`[Cache Cleanup] Failed to remove expired file ${file.name}`, err);
        remainingFiles.push(file);
      }
    } else {
      remainingFiles.push(file);
    }
  }

  // 2. Check total size. If > max size, delete oldest files first, EXCEPT those in use
  let totalSize = remainingFiles.reduce((sum, f) => sum + f.size, 0);
  if (totalSize > maxSizeBytes) {
    console.log(`[Cache Cleanup] Directory size (${(totalSize / 1024 / 1024).toFixed(1)} MB) exceeds limit (${maxSizeMb} MB). Cleaning oldest files.`);
    // Sort by mtimeMs ascending (oldest first)
    remainingFiles.sort((a, b) => a.mtimeMs - b.mtimeMs);

    for (const file of remainingFiles) {
      if (totalSize <= maxSizeBytes) break;
      if (isFileCurrentlyInUse(file.path, activeCalls)) continue;

      try {
        await fs.rm(file.path, { force: true });
        totalSize -= file.size;
        removed += 1;
        console.log(`[Cache Cleanup] Size limit exceeded. Removed oldest file: ${file.name} (Size: ${(file.size / 1024 / 1024).toFixed(1)} MB)`);
      } catch (err) {
        console.warn(`[Cache Cleanup] Failed to remove ${file.name} during size cleanup`, err);
      }
    }
  }

  return { removed, scanned };
}

export function scheduleDownloadCleanup() {
  const intervalMs = Math.max(1, Number(config.downloadCleanupIntervalMinutes) || 0) * 60 * 1000;
  if (!intervalMs) return () => {};

  const run = () => cleanupOldDownloads().catch((error) => console.warn('Download cleanup failed', error));
  run();
  const timer = setInterval(run, intervalMs);
  timer.unref?.();
  return () => clearInterval(timer);
}
