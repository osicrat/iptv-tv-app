import { CACHE_TTL } from '../utils/constants.js';
import { storage } from '../storage/storage.js';

function parseXmltv(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, 'text/xml');

  const channels = [...doc.querySelectorAll('channel')].map((node) => ({
    id: node.getAttribute('id') || '',
    displayNames: [...node.querySelectorAll('display-name')]
      .map((n) => (n.textContent || '').trim())
      .filter(Boolean),
  }));

  const programmes = [...doc.querySelectorAll('programme')].map((node) => ({
    channel: node.getAttribute('channel') || '',
    start: node.getAttribute('start') || '',
    stop: node.getAttribute('stop') || '',
    title: node.querySelector('title')?.textContent?.trim() || 'Sem título',
    desc: node.querySelector('desc')?.textContent?.trim() || '',
  }));

  return { channels, programmes };
}

function toDate(xmltvDate) {
  const compact = (xmltvDate || '').slice(0, 14);
  if (compact.length < 14) return new Date(NaN);

  const y = compact.slice(0, 4);
  const m = compact.slice(4, 6);
  const d = compact.slice(6, 8);
  const hh = compact.slice(8, 10);
  const mm = compact.slice(10, 12);
  const ss = compact.slice(12, 14);

  return new Date(`${y}-${m}-${d}T${hh}:${mm}:${ss}`);
}

function normalizeName(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function sortProgrammes(list = []) {
  return [...list].sort((a, b) => a.startDate - b.startDate);
}

export async function loadXmltv(client) {
  const cached = storage.getXmltv(CACHE_TTL.XMLTV);
  if (cached) return cached;

  const res = await fetch(client.xmltvUrl());
  if (!res.ok) throw new Error(`Falha ao carregar XMLTV: HTTP ${res.status}`);

  const text = await res.text();
  const parsed = parseXmltv(text);
  storage.setXmltv(parsed, CACHE_TTL.XMLTV);
  return parsed;
}

export function buildEpgIndex(raw, liveChannels = []) {
  const payload = Array.isArray(raw)
    ? { channels: [], programmes: raw }
    : { channels: raw?.channels || [], programmes: raw?.programmes || [] };

  const byId = new Map();
  const idsByNormalizedName = new Map();

  payload.channels.forEach((channel) => {
    const allNames = [channel.id, ...(channel.displayNames || [])]
      .map(normalizeName)
      .filter(Boolean);

    allNames.forEach((name) => {
      if (!idsByNormalizedName.has(name)) idsByNormalizedName.set(name, new Set());
      idsByNormalizedName.get(name).add(channel.id);
    });
  });

  payload.programmes.forEach((programme) => {
    const enriched = {
      ...programme,
      startDate: toDate(programme.start),
      stopDate: toDate(programme.stop),
    };

    if (!byId.has(programme.channel)) byId.set(programme.channel, []);
    byId.get(programme.channel).push(enriched);
  });

  for (const [key, list] of byId.entries()) {
    byId.set(key, sortProgrammes(list));
  }

  function resolveChannelIds(channel) {
    const directIds = [
      channel?.epg_channel_id,
      channel?.tvg_id,
      channel?.xmltv_id,
      channel?.channel_id,
    ]
      .map((value) => String(value || '').trim())
      .filter(Boolean);

    const normalizedNames = [
      channel?.name,
      channel?.stream_display_name,
      channel?.title,
    ]
      .map(normalizeName)
      .filter(Boolean);

    const resolved = new Set(directIds);

    normalizedNames.forEach((name) => {
      const matches = idsByNormalizedName.get(name);
      if (matches) {
        matches.forEach((id) => resolved.add(id));
      }
    });

    return [...resolved];
  }

  function programmesFor(channel) {
    const ids = resolveChannelIds(channel);
    const list = ids.flatMap((id) => byId.get(id) || []);
    return sortProgrammes(list);
  }

  return {
    nowNext(channel) {
      const now = new Date();
      const list = programmesFor(channel);
      const currentIdx = list.findIndex((p) => p.startDate <= now && p.stopDate > now);

      return {
        now: currentIdx >= 0 ? list[currentIdx] : null,
        next: currentIdx >= 0 ? list[currentIdx + 1] || null : list[0] || null,
      };
    },

    day(channel) {
      return programmesFor(channel);
    },

    debugMatch(channel) {
      return resolveChannelIds(channel);
    },

    liveChannelsCount: liveChannels.length,
  };
}
