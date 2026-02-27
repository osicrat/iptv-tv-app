import { CACHE_TTL, DEFAULT_BASE_URL } from '../utils/constants.js';
import { storage } from '../storage/storage.js';

function withParams(baseUrl, username, password, extra = {}) {
  const url = new URL(`${baseUrl}/player_api.php`);
  url.searchParams.set('username', username);
  url.searchParams.set('password', password);
  Object.entries(extra).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

async function requestJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export class XtreamClient {
  constructor(session, settings) {
    this.username = session.username;
    this.password = session.password;
    this.baseUrl = settings.advancedBaseUrl || session.baseUrl || DEFAULT_BASE_URL;
    this.settings = settings;
  }

  validate() {
    return requestJson(withParams(this.baseUrl, this.username, this.password));
  }

  async cached(action, ttl = CACHE_TTL.SHORT, cacheKey = action) {
    const key = `${this.username}.${cacheKey}`;
    const cached = storage.getCache(key, ttl);
    if (cached) return cached;
    const data = await requestJson(withParams(this.baseUrl, this.username, this.password, { action }));
    storage.setCache(key, data);
    return data;
  }

  getLiveCategories() { return this.cached('get_live_categories'); }
  getLiveStreams() { return this.cached('get_live_streams'); }
  getVodCategories() { return this.cached('get_vod_categories'); }
  getVodStreams() { return this.cached('get_vod_streams'); }
  getSeriesCategories() { return this.cached('get_series_categories'); }
  getSeries() { return this.cached('get_series'); }
  async fetchSeriesInfo(seriesId) {
    return requestJson(withParams(this.baseUrl, this.username, this.password, { action: 'get_series_info', series_id: seriesId }));
  }

  streamUrl(type, streamId, extension = 'm3u8') {
    const pathMap = { live: 'live', vod: 'movie', series: 'series' };
    return `${this.baseUrl}/${pathMap[type]}/${this.username}/${this.password}/${streamId}.${extension}`;
  }

  buildStreamCandidates(type, streamId, containerExtension = 'mp4') {
    const pref = this.settings.streamPreference || 'hls-first';
    const hls = this.streamUrl(type, streamId, 'm3u8');
    const ts = this.streamUrl(type, streamId, type === 'vod' ? containerExtension : 'ts');
    return pref === 'ts-first' ? [ts, hls] : [hls, ts];
  }

  xmltvUrl() {
    return `${this.baseUrl}/xmltv.php?username=${encodeURIComponent(this.username)}&password=${encodeURIComponent(this.password)}`;
  }
}
