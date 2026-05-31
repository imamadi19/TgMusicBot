import crypto from 'node:crypto';

class SearchCache {
  #cache = new Map();

  constructor() {
    const interval = setInterval(() => {
      const now = Date.now();
      for (const [token, state] of this.#cache.entries()) {
        if (now - state.createdAt > 5 * 60 * 1000) { // 5 minutes TTL
          this.#cache.delete(token);
        }
      }
    }, 60000);
    if (typeof interval.unref === 'function') {
      interval.unref();
    }
  }

  save(state) {
    const token = crypto.randomBytes(4).toString('hex');
    this.#cache.set(token, {
      ...state,
      createdAt: Date.now(),
    });
    return token;
  }

  get(token) {
    const state = this.#cache.get(token);
    if (!state) return null;
    if (Date.now() - state.createdAt > 5 * 60 * 1000) {
      this.#cache.delete(token);
      return null;
    }
    return state;
  }

  delete(token) {
    this.#cache.delete(token);
  }
}

export const searchCache = new SearchCache();
