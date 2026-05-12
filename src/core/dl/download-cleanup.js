import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../../config/index.js';

const COOKIE_FILE_NAME = 'yt-dlp-cookies.txt';

export async function cleanupOldDownloads({ now = Date.now() } = {}) {
  const ttlMs = Math.max(0, Number(config.downloadRetentionHours) || 0) * 60 * 60 * 1000;
  if (!ttlMs) return { removed: 0, scanned: 0 };

  await fs.mkdir(config.downloadsDir, { recursive: true });
  const entries = await fs.readdir(config.downloadsDir, { withFileTypes: true });
  let removed = 0;
  let scanned = 0;

  await Promise.all(entries.map(async (entry) => {
    if (!entry.isFile() || entry.name === COOKIE_FILE_NAME) return;
    scanned += 1;
    const filePath = path.join(config.downloadsDir, entry.name);
    try {
      const stats = await fs.stat(filePath);
      if ((now - stats.mtimeMs) >= ttlMs) {
        await fs.rm(filePath, { force: true });
        removed += 1;
      }
    } catch {
      // ignore files that disappear while scanning
    }
  }));

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
