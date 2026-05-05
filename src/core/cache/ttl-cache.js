export class TtlCache {
  #data = new Map();
  #timer;

  constructor(ttlMs = 60_000, sweepMs = 60_000) {
    this.ttlMs = ttlMs;
    this.#timer = setInterval(() => this.evictExpired(), sweepMs);
    this.#timer.unref?.();
  }

  set(key, value, ttlMs = this.ttlMs) {
    this.#data.set(String(key), { value, expiresAt: Date.now() + ttlMs });
  }

  get(key) {
    const item = this.#data.get(String(key));
    if (!item) return undefined;
    if (Date.now() > item.expiresAt) {
      this.#data.delete(String(key));
      return undefined;
    }
    return item.value;
  }

  delete(key) {
    this.#data.delete(String(key));
  }

  clear() {
    this.#data.clear();
  }

  size() {
    return this.#data.size;
  }

  evictExpired() {
    const now = Date.now();
    for (const [key, item] of this.#data.entries()) {
      if (now > item.expiresAt) this.#data.delete(key);
    }
  }

  close() {
    clearInterval(this.#timer);
  }
}
