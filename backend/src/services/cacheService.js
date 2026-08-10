const env = require("../config/env");

class MemoryCacheService {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    const record = this.store.get(key);

    if (!record) {
      return null;
    }

    if (record.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }

    return record.value;
  }

  set(key, value, ttlSeconds = env.cacheTtlSeconds) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  delete(key) {
    this.store.delete(key);
  }
}

module.exports = new MemoryCacheService();
