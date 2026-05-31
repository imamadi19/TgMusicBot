import path from 'node:path';
import { chatCache } from './chat-cache.js';

const activeFiles = new Set();

export function markFileActive(filePath) {
  if (filePath) activeFiles.add(path.resolve(filePath));
}

export function unmarkFileActive(filePath) {
  if (filePath) activeFiles.delete(path.resolve(filePath));
}

export function isFileActive(filePath) {
  if (!filePath) return false;
  return activeFiles.has(path.resolve(filePath));
}

export function isFileCurrentlyInUse(filePath, activeCalls = []) {
  if (!filePath) return false;
  const resolved = path.resolve(filePath);
  if (isFileActive(resolved)) return true;

  // Check queues
  if (chatCache && typeof chatCache.chats === 'function') {
    for (const chat of chatCache.chats()) {
      for (const track of chat.queue || []) {
        if (track.filePath && path.resolve(track.filePath) === resolved) {
          return true;
        }
      }
    }
  }

  // Check activeCalls passed from outside to avoid circular dependency
  for (const call of activeCalls) {
    if (call.track?.filePath && path.resolve(call.track.filePath) === resolved) {
      return true;
    }
  }

  return false;
}
