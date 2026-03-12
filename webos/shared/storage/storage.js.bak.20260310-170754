const PREFIX = 'iptv.';

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function removeByPrefix(prefix) {
  const keys = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const k = localStorage.key(i);
    if (k && k.startsWith(prefix)) keys.push(k);
  }
  keys.forEach((k) => localStorage.removeItem(k));
}

export const storage = {
  getSession() {
    return readJson('session', null);
  },

  setSession(session) {
    if (!session) {
      localStorage.removeItem(PREFIX + 'session');
      return;
    }
    writeJson('session', session);
  },

  clearSession() {
    localStorage.removeItem(PREFIX + 'session');
  },

  getSettings() {
    return readJson('settings', {
      streamPreference: 'hls-first',
      advancedBaseUrl: '',
    });
  },

  setSettings(partial) {
    const current = this.getSettings();
    writeJson('settings', { ...current, ...partial });
  },

  getFavorites() {
    return readJson('favorites', []);
  },

  toggleFavorite(item) {
    const current = this.getFavorites();
    const id = String(item.id);
    const idx = current.findIndex((x) => String(x.id) === id && x.type === item.type);
    if (idx >= 0) current.splice(idx, 1);
    else current.unshift(item);
    writeJson('favorites', current.slice(0, 500));
  },

  getRecents() {
    return readJson('recents', []);
  },

  addRecent(item) {
    const itemKey = String(item.key || `${item.type || item.kind || 'item'}:${item.id}`);
    const current = this.getRecents().filter((x) => String(x.key || `${x.type || x.kind || 'item'}:${x.id}`) !== itemKey);
    current.unshift({ ...item, key: itemKey, watchedAt: Date.now() });
    writeJson('recents', current.slice(0, 200));
  },

  getContinueWatching() {
    return readJson('continue_watching', []);
  },

  getContinueWatchingItem(key) {
    return this.getContinueWatching().find((x) => String(x.key) === String(key)) || null;
  },

  saveContinueWatching(item) {
    const list = this.getContinueWatching().filter((x) => String(x.key) !== String(item.key));
    list.unshift({ ...item, watchedAt: Date.now() });
    writeJson('continue_watching', list.slice(0, 200));
  },

  removeContinueWatching(key) {
    const list = this.getContinueWatching().filter((x) => String(x.key) !== String(key));
    writeJson('continue_watching', list);
  },

  getLastLive(maxAgeMs = 30 * 24 * 60 * 60 * 1000) {
    const payload = readJson('last_live', null);
    if (!payload) return null;
    if (payload.watchedAt && Date.now() - payload.watchedAt > maxAgeMs) {
      localStorage.removeItem(PREFIX + 'last_live');
      return null;
    }
    return payload;
  },

  setLastLive(payload) {
    writeJson('last_live', { ...payload, watchedAt: payload?.watchedAt || Date.now() });
  },

  clearLastLive() {
    localStorage.removeItem(PREFIX + 'last_live');
  },

  getXmltv(maxAgeMs = 12 * 60 * 60 * 1000) {
    const payload = readJson('xmltv', null);
    if (!payload) return null;
    if (payload.savedAt && Date.now() - payload.savedAt > maxAgeMs) {
      localStorage.removeItem(PREFIX + 'xmltv');
      return null;
    }
    return payload.data || null;
  },

  setXmltv(data) {
    return writeJson('xmltv', { savedAt: Date.now(), data });
  },

  getCache(key) {
    const payload = readJson(`cache.${key}`, null);
    if (!payload) return null;
    if (payload.expiresAt && Date.now() > payload.expiresAt) {
      localStorage.removeItem(PREFIX + `cache.${key}`);
      return null;
    }
    return payload.value;
  },

  setCache(key, value, ttlMs = 5 * 60 * 1000) {
    const payload = { expiresAt: Date.now() + ttlMs, value };
    try {
      localStorage.setItem(PREFIX + `cache.${key}`, JSON.stringify(payload));
      return true;
    } catch {
      removeByPrefix(PREFIX + 'cache.');
      try {
        localStorage.setItem(PREFIX + `cache.${key}`, JSON.stringify(payload));
        return true;
      } catch {
        return false;
      }
    }
  },

  clearCache() {
    removeByPrefix(PREFIX + 'cache.');
    localStorage.removeItem(PREFIX + 'xmltv');
  },
};
