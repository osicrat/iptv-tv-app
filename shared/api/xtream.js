import { storage } from '../storage/storage.js';
import { DEFAULT_BASE_URL } from '../utils/constants.js';

function normalizeBaseUrl(input) {
  let base = String(input || '').trim();
  if (!base) return '';
  if (!/^https?:\/\//i.test(base)) base = 'https://' + base;
  base = base.replace(/^http:\/\//i, 'https://');
  base = base.replace(/\/+$/, '');
  base = base.replace(/:443$/i, '');
  return base;
}

function withParams(baseUrl, username, password, extra = {}) {
  const url = new URL(`${baseUrl}/player_api.php`);
  url.searchParams.set('username', username);
  url.searchParams.set('password', password);
  Object.entries(extra).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function requestJson(url, timeoutMs = 15000) {
  const hasAbort = typeof AbortController !== 'undefined';

  if (hasAbort) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        signal: ctrl.signal,
        redirect: 'follow',
        mode: 'cors',
        credentials: 'omit',
      });

      const ct = (res.headers.get('content-type') || '').toLowerCase();
      const bodyText = await res.text().catch(() => '');

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} | URL: ${url} | BODY: ${(bodyText || '').slice(0, 200)}`);
      }

      if (ct.includes('application/json')) return JSON.parse(bodyText);

      try {
        return JSON.parse(bodyText);
      } catch {
        throw new Error(`Resposta não-JSON | URL: ${url} | BODY: ${(bodyText || '').slice(0, 200)}`);
      }
    } catch (e) {
      if (e && e.name === 'AbortError') throw new Error(`Timeout (${timeoutMs}ms) | URL: ${url}`);
      throw new Error(`Falha no fetch | URL: ${url} | Motivo: ${e?.message || e}`);
    } finally {
      clearTimeout(timer);
    }
  }

  // fallback sem AbortController
  try {
    const res = await Promise.race([
      fetch(url, { method: 'GET', cache: 'no-store', redirect: 'follow' }),
      sleep(timeoutMs).then(() => {
        throw new Error(`Timeout (${timeoutMs}ms) | URL: ${url}`);
      }),
    ]);
    if (!res.ok) throw new Error(`HTTP ${res.status} | URL: ${url}`);
    return await res.json();
  } catch (e) {
    throw new Error(`Falha no fetch | URL: ${url} | Motivo: ${e?.message || e}`);
  }
}

function dedupeUrls(list) {
  const seen = new Set();
  const out = [];
  for (const value of list || []) {
    const u = String(value || '').trim();
    if (!u || seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  return out;
}

function parsePossibleJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  const t = value.trim();
  if (!t) return [];
  if (t.startsWith('[') && t.endsWith(']')) {
    try {
      const parsed = JSON.parse(t);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function extractDirectSources(item) {
  if (!item || typeof item !== 'object') return [];

  const sources = [];

  const directSource = item.direct_source || item.directSource || '';
  if (typeof directSource === 'string' && directSource.trim()) sources.push(directSource.trim());

  const streamSource = item.stream_source || item.streamSource;
  if (Array.isArray(streamSource)) {
    sources.push(...streamSource);
  } else if (typeof streamSource === 'string' && streamSource.trim()) {
    const parsed = parsePossibleJsonArray(streamSource);
    if (parsed.length) sources.push(...parsed);
    else if (/^https?:\/\//i.test(streamSource.trim())) sources.push(streamSource.trim());
  }

  return dedupeUrls(sources);
}

export class XtreamClient {
  constructor(session, settings = {}) {
    this.username = session.username;
    this.password = session.password;
    const rawBase = settings.advancedBaseUrl || session.baseUrl || DEFAULT_BASE_URL;
    this.baseUrl = normalizeBaseUrl(rawBase);
    this.settings = settings;

    if (!this.baseUrl) throw new Error('Base URL vazia');
    if (!this.username) throw new Error('Usuário vazio');
    if (!this.password) throw new Error('Senha vazia');
  }

  async validate() {
    return await requestJson(withParams(this.baseUrl, this.username, this.password));
  }

  xmltvUrl() {
    const base = this.baseUrl.replace(/\/+$/, '');
    const u = encodeURIComponent(this.username);
    const p = encodeURIComponent(this.password);
    return `${base}/xmltv.php?username=${u}&password=${p}`;
  }

  async cached(key, loader, ttlMs = 5 * 60 * 1000) {
    const cached = storage.getCache(key);
    if (cached) return cached;

    const data = await loader();
    try { storage.setCache(key, data, ttlMs); } catch {}
    return data;
  }

  getLiveCategories() {
    return this.cached(
      'live_categories',
      () => requestJson(withParams(this.baseUrl, this.username, this.password, { action: 'get_live_categories' }), 15000),
      10 * 60 * 1000
    );
  }

  getLiveStreams() {
    return this.cached(
      'live_streams',
      () => requestJson(withParams(this.baseUrl, this.username, this.password, { action: 'get_live_streams' }), 20000),
      10 * 60 * 1000
    );
  }

  getVodCategories() {
    return this.cached(
      'vod_categories',
      () => requestJson(withParams(this.baseUrl, this.username, this.password, { action: 'get_vod_categories' }), 15000),
      10 * 60 * 1000
    );
  }

  getVodStreams() {
    return requestJson(withParams(this.baseUrl, this.username, this.password, { action: 'get_vod_streams' }), 20000);
  }

  getSeriesCategories() {
    return this.cached(
      'series_categories',
      () => requestJson(withParams(this.baseUrl, this.username, this.password, { action: 'get_series_categories' }), 15000),
      10 * 60 * 1000
    );
  }

  getSeries() {
    return requestJson(withParams(this.baseUrl, this.username, this.password, { action: 'get_series' }), 20000);
  }

  fetchSeriesInfo(seriesId) {
    return requestJson(
      withParams(this.baseUrl, this.username, this.password, {
        action: 'get_series_info',
        series_id: String(seriesId),
      }),
      20000
    );
  }

  buildStreamCandidates(type, itemOrId, ext = 'mp4') {
    const base = this.baseUrl.replace(/\/+$/, '');
    const u = encodeURIComponent(this.username);
    const p = encodeURIComponent(this.password);
    const cleanExt = (ext || 'mp4').replace(/^\./, '');
    const item = itemOrId && typeof itemOrId === 'object' ? itemOrId : null;
    const id = item ? (item.stream_id || item.id || item.series_id) : itemOrId;

    const directSources = extractDirectSources(item);

    if (type === 'live') {
      const proxied =
        (this.settings.streamPreference || 'hls-first') === 'hls-first'
          ? [`${base}/live/${u}/${p}/${id}.m3u8`, `${base}/live/${u}/${p}/${id}.ts`]
          : [`${base}/live/${u}/${p}/${id}.ts`, `${base}/live/${u}/${p}/${id}.m3u8`];

      // ✅ CRÍTICO PARA TIZEN: tenta proxied primeiro (m3u8/ts), depois direct
      return dedupeUrls([...proxied, ...directSources]);
    }

    if (type === 'vod') {
      return dedupeUrls([
        ...directSources,
        `${base}/movie/${u}/${p}/${id}.${cleanExt}`,
        `${base}/movie/${u}/${p}/${id}.m3u8`,
      ]);
    }

    if (type === 'series') {
      return dedupeUrls([
        ...directSources,
        `${base}/series/${u}/${p}/${id}.${cleanExt}`,
        `${base}/series/${u}/${p}/${id}.m3u8`,
      ]);
    }

    return dedupeUrls(directSources);
  }
}
