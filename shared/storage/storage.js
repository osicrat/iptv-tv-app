import { STORAGE_KEYS } from '../utils/constants.js';
import { obfuscate, deobfuscate } from '../utils/crypto.js';

function now() {
  return Date.now();
}

function readJson(key, fallback = null) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  getSession() {
    const session = readJson(STORAGE_KEYS.SESSION, null);
    if (!session) return null;
    return { ...session, password: deobfuscate(session.passwordObf || '') };
  },
  setSession({ username, password, baseUrl, accountInfo }) {
    writeJson(STORAGE_KEYS.SESSION, {
      username,
      passwordObf: obfuscate(password),
      baseUrl,
      accountInfo,
      updatedAt: now(),
    });
  },
  clearSession() {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  },
  getSettings() {
    return readJson(STORAGE_KEYS.SETTINGS, { streamPreference: 'hls-first', advancedBaseUrl: '' });
  },
  setSettings(settings) {
    const current = this.getSettings();
    writeJson(STORAGE_KEYS.SETTINGS, { ...current, ...settings });
  },
  getFavorites() {
    return readJson(STORAGE_KEYS.FAVORITES, []);
  },
  toggleFavorite(item) {
    const favorites = this.getFavorites();
    const idx = favorites.findIndex((f) => f.id === item.id && f.type === item.type);
    if (idx >= 0) favorites.splice(idx, 1);
    else favorites.unshift({ ...item, addedAt: now() });
    writeJson(STORAGE_KEYS.FAVORITES, favorites.slice(0, 500));
    return idx < 0;
  },
  getRecents() {
    return readJson(STORAGE_KEYS.RECENTS, []);
  },
  addRecent(item) {
    const recents = this.getRecents().filter((r) => !(r.id === item.id && r.type === item.type));
    recents.unshift({ ...item, watchedAt: now() });
    writeJson(STORAGE_KEYS.RECENTS, recents.slice(0, 200));
  },
  setCache(key, data) {
    writeJson(`${STORAGE_KEYS.CACHE_PREFIX}${key}`, { data, expiresAt: now() });
  },
  getCache(key, ttlMs) {
    const payload = readJson(`${STORAGE_KEYS.CACHE_PREFIX}${key}`, null);
    if (!payload) return null;
    if (now() - payload.expiresAt > ttlMs) return null;
    return payload.data;
  },
  setXmltv(data) {
    writeJson(STORAGE_KEYS.XMLTV, { data, savedAt: now() });
  },
  getXmltv(ttlMs) {
    const payload = readJson(STORAGE_KEYS.XMLTV, null);
    if (!payload) return null;
    if (now() - payload.savedAt > ttlMs) return null;
    return payload.data;
  },
  clearCache() {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(STORAGE_KEYS.CACHE_PREFIX) || k === STORAGE_KEYS.XMLTV)
      .forEach((k) => localStorage.removeItem(k));
  },
};
