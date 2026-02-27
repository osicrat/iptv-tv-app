import { CACHE_TTL } from '../utils/constants.js';
import { storage } from '../storage/storage.js';

function parseXmltv(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
  const programmes = [...doc.querySelectorAll('programme')].map((node) => ({
    channel: node.getAttribute('channel') || '',
    start: node.getAttribute('start') || '',
    stop: node.getAttribute('stop') || '',
    title: node.querySelector('title')?.textContent || 'Sem título',
  }));
  return programmes;
}

function toDate(xmltvDate) {
  const compact = xmltvDate.slice(0, 14);
  const y = compact.slice(0, 4);
  const m = compact.slice(4, 6);
  const d = compact.slice(6, 8);
  const hh = compact.slice(8, 10);
  const mm = compact.slice(10, 12);
  const ss = compact.slice(12, 14);
  return new Date(`${y}-${m}-${d}T${hh}:${mm}:${ss}`);
}

export async function loadXmltv(client) {
  const cached = storage.getXmltv(CACHE_TTL.XMLTV);
  if (cached) return cached;
  const res = await fetch(client.xmltvUrl());
  const text = await res.text();
  const parsed = parseXmltv(text);
  storage.setXmltv(parsed);
  return parsed;
}

export function buildEpgIndex(programmes, channels = []) {
  const index = new Map();
  const byName = new Map(channels.map((c) => [c.name?.toLowerCase(), c]));

  programmes.forEach((p) => {
    if (!index.has(p.channel)) index.set(p.channel, []);
    index.get(p.channel).push({ ...p, startDate: toDate(p.start), stopDate: toDate(p.stop) });
  });

  return {
    nowNext(channel) {
      const now = new Date();
      const byId = index.get(channel.epg_channel_id || channel.tvg_id || '') || [];
      const byFallback = byName.get(channel.name?.toLowerCase())
        ? index.get(byName.get(channel.name?.toLowerCase()).epg_channel_id || '') || []
        : [];
      const list = byId.length ? byId : byFallback;
      const currentIdx = list.findIndex((p) => p.startDate <= now && p.stopDate > now);
      return {
        now: currentIdx >= 0 ? list[currentIdx] : null,
        next: currentIdx >= 0 ? list[currentIdx + 1] || null : list[0] || null,
      };
    },
    day(channel) {
      return index.get(channel.epg_channel_id || channel.tvg_id || '') || [];
    },
  };
}
