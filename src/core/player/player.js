import { chatCache } from '../cache/chat-cache.js';

export class VoicePlayer {
  #active = new Map();

  async play(chatId, track) {
    this.#active.set(String(chatId), { ...track, startedAt: new Date() });
    return this.#active.get(String(chatId));
  }

  pause(chatId) {
    chatCache.setPaused(chatId, true);
  }

  resume(chatId) {
    chatCache.setPaused(chatId, false);
  }

  stop(chatId) {
    this.#active.delete(String(chatId));
    chatCache.clear(chatId);
  }

  skip(chatId) {
    const skipped = chatCache.shift(chatId);
    const next = chatCache.current(chatId);
    if (next) this.#active.set(String(chatId), { ...next, startedAt: new Date() });
    else this.#active.delete(String(chatId));
    return { skipped, next };
  }

  activeCalls() {
    return [...this.#active.entries()].map(([chatId, track]) => ({ chatId, track }));
  }
}

export const voicePlayer = new VoicePlayer();
