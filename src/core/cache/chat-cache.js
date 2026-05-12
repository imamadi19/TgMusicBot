export class ChatCache {
  #chats = new Map();

  #get(chatId) {
    const key = String(chatId);
    if (!this.#chats.has(key)) {
      this.#chats.set(key, { queue: [], loop: 0, paused: false, muted: false, speed: 1, youtubeSelections: new Map() });
    }
    return this.#chats.get(key);
  }

  addSong(chatId, track) {
    const data = this.#get(chatId);
    data.queue.push(track);
    return data.queue.length;
  }

  addSongAt(chatId, track, index = 1) {
    const data = this.#get(chatId);
    const safeIndex = Math.max(0, Math.min(Number(index) || 0, data.queue.length));
    data.queue.splice(safeIndex, 0, track);
    return data.queue.length;
  }

  addSongs(chatId, tracks) {
    const data = this.#get(chatId);
    data.queue.push(...tracks);
    return data.queue.length;
  }

  getQueue(chatId) {
    return [...this.#get(chatId).queue];
  }

  getQueueLength(chatId) {
    return this.#get(chatId).queue.length;
  }

  current(chatId) {
    return this.#get(chatId).queue[0] ?? null;
  }

  getTrackIfExists(chatId, trackId) {
    return this.#get(chatId).queue.find((track) => track.trackId === trackId) ?? null;
  }

  remove(chatId, index) {
    const data = this.#get(chatId);
    if (index < 0 || index >= data.queue.length) return null;
    return data.queue.splice(index, 1)[0] ?? null;
  }

  shift(chatId) {
    return this.#get(chatId).queue.shift() ?? null;
  }

  clear(chatId) {
    this.#chats.delete(String(chatId));
  }

  setYouTubeSelection(chatId, messageId, selection) {
    const data = this.#get(chatId);
    data.youtubeSelections.set(String(messageId), { ...selection, createdAt: Date.now() });
  }

  getYouTubeSelection(chatId, messageId) {
    return this.#get(chatId).youtubeSelections.get(String(messageId)) ?? null;
  }

  deleteYouTubeSelection(chatId, messageId) {
    this.#get(chatId).youtubeSelections.delete(String(messageId));
  }

  chats() {
    return [...this.#chats.entries()].map(([chatId, data]) => ({ chatId, ...data, queue: [...data.queue] }));
  }

  setLoop(chatId, count) {
    this.#get(chatId).loop = Math.max(0, Math.min(10, Number(count) || 0));
    return this.#get(chatId).loop;
  }

  getLoop(chatId) {
    return this.#get(chatId).loop;
  }

  setPaused(chatId, paused) {
    this.#get(chatId).paused = Boolean(paused);
  }

  isPaused(chatId) {
    return this.#get(chatId).paused;
  }

  setMuted(chatId, muted) {
    this.#get(chatId).muted = Boolean(muted);
  }

  isMuted(chatId) {
    return this.#get(chatId).muted;
  }

  setSpeed(chatId, speed) {
    const parsed = Number(speed);
    this.#get(chatId).speed = Number.isFinite(parsed) ? Math.max(0.25, Math.min(4, parsed)) : 1;
    return this.#get(chatId).speed;
  }
}

export const chatCache = new ChatCache();
