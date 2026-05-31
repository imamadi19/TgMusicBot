import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { constants } from 'node:fs';
import { config } from '../../config/index.js';
import { isDatabaseConnected, db } from '../db/mongo.js';
import { voicePlayer } from '../player/player.js';

let version = '1.0.0';
try {
  const pkg = JSON.parse(fsSync.readFileSync(path.resolve('package.json'), 'utf8'));
  version = pkg.version || '1.0.0';
} catch {}

async function checkDirectoryWritable(dirPath) {
  try {
    await fs.access(dirPath, constants.F_OK | constants.W_OK);
    return { exists: true, writable: true };
  } catch {
    try {
      const stats = await fs.stat(dirPath);
      return { exists: true, writable: false };
    } catch {
      return { exists: false, writable: false };
    }
  }
}

export async function handleHealthRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  res.setHeader('Content-Type', 'application/json');

  if (pathname === '/' || pathname === '') {
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true, service: 'TgMusicBot JS' }));
    return;
  }

  if (pathname === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      ok: true,
      service: 'TgMusicBot JS',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      version: version,
      node: process.version,
    }));
    return;
  }

  if (pathname === '/ready') {
    let dbConnected = false;
    if (isDatabaseConnected()) {
      try {
        await db().command({ ping: 1 });
        dbConnected = true;
      } catch {
        dbConnected = false;
      }
    }

    const dirStatus = await checkDirectoryWritable(config.downloadsDir);
    const activeChats = typeof voicePlayer !== 'undefined' && typeof voicePlayer.activeCalls === 'function'
      ? voicePlayer.activeCalls().length
      : 0;

    const ready = dbConnected && dirStatus.exists && dirStatus.writable;
    const statusCode = ready ? 200 : 503;

    res.writeHead(statusCode);
    res.end(JSON.stringify({
      ok: ready,
      service: 'TgMusicBot JS',
      database: {
        connected: dbConnected,
      },
      downloads: {
        path: config.downloadsDir,
        exists: dirStatus.exists,
        writable: dirStatus.writable,
      },
      player: {
        activeChats: activeChats,
      },
    }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not Found' }));
}
