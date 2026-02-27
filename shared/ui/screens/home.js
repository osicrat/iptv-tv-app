import { TABS } from '../../utils/constants.js';
import { el, renderList, renderTabs, showToast } from '../components.js';

export function createHomeScreen({ root, state, services }) {
  const tabsNode = el('div', { className: 'tabs' });
  const left = el('div', { className: 'pane pane-left' });
  const right = el('div', { className: 'pane pane-right' });
  const overlay = el('div', { className: 'player-overlay hidden' });
  root.innerHTML = '';
  root.append(tabsNode, el('div', { className: 'panes' }, [left, right]), overlay);

  const ui = {
    focusList: 'left',
    leftIndex: 0,
    rightIndex: 0,
    query: '',
    isTabLoading: false,
  };

  async function loadTab(tab) {
    ui.isTabLoading = true;
    state.activeTab = tab;
    ui.leftIndex = 0;
    ui.rightIndex = 0;
    ui.focusList = 'left';
    renderTabs(tabsNode, TABS, tab);

    try {
      if (tab === 'Live') {
        state.liveCategories = await services.client.getLiveCategories();
        state.liveStreams = await services.client.getLiveStreams();
        renderLive();
      } else if (tab === 'VOD') {
        state.vodCategories = await services.client.getVodCategories();
        state.vodStreams = await services.client.getVodStreams();
        renderVod();
      } else if (tab === 'Séries') {
        state.seriesCategories = await services.client.getSeriesCategories();
        state.series = await services.client.getSeries();
        renderSeries();
      } else if (tab === 'EPG') {
        await services.ensureEpg();
        renderEpg();
      } else if (tab === 'Favoritos') {
        renderFavorites();
      } else if (tab === 'Recentes') {
        renderRecents();
      } else {
        renderConfig();
      }
    } finally {
      ui.isTabLoading = false;
    }
  }

  function currentCategoryId() {
    const cat = (state.liveCategories || [])[ui.leftIndex];
    return cat?.category_id;
  }

  function renderLive() {
    renderList(left, state.liveCategories || [], ui.leftIndex, (c) => c.category_name);
    const filtered = (state.liveStreams || [])
      .filter((s) => !currentCategoryId() || s.category_id === currentCategoryId())
      .filter((s) => s.name?.toLowerCase().includes(ui.query.toLowerCase()));
    state.currentRightItems = filtered;
    renderList(right, filtered, ui.rightIndex, (s) => s.name);
  }

  function renderVod() {
    renderList(left, state.vodCategories || [], ui.leftIndex, (c) => c.category_name);
    const cat = (state.vodCategories || [])[ui.leftIndex]?.category_id;
    const filtered = (state.vodStreams || []).filter((s) => !cat || s.category_id === cat);
    state.currentRightItems = filtered;
    renderList(right, filtered, ui.rightIndex, (s) => s.name);
  }

  function renderSeries() {
    renderList(left, state.seriesCategories || [], ui.leftIndex, (c) => c.category_name);
    const cat = (state.seriesCategories || [])[ui.leftIndex]?.category_id;
    const filtered = (state.series || []).filter((s) => !cat || s.category_id === cat);
    state.currentRightItems = filtered;
    renderList(right, filtered, ui.rightIndex, (s) => s.name);
  }

  function renderEpg() {
    const channels = state.liveStreams || [];
    renderList(left, channels, ui.leftIndex, (c) => c.name);
    const channel = channels[ui.leftIndex];
    const day = channel ? services.epg.day(channel) : [];
    state.currentRightItems = day;
    renderList(right, day, ui.rightIndex, (p) => `${p.startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ${p.title}`);
  }

  function renderFavorites() {
    const favs = services.storage.getFavorites();
    state.currentRightItems = favs;
    left.innerHTML = '<h3>Itens favoritos</h3>';
    renderList(right, favs, ui.rightIndex, (f) => `${f.type.toUpperCase()} · ${f.name}`);
  }

  function renderRecents() {
    const recents = services.storage.getRecents();
    state.currentRightItems = recents;
    left.innerHTML = '<h3>Assistidos recentemente</h3>';
    renderList(right, recents, ui.rightIndex, (f) => `${new Date(f.watchedAt).toLocaleString()} · ${f.name}`);
  }

  function renderConfig() {
    left.innerHTML = '';
    right.innerHTML = '';
    const settings = services.storage.getSettings();
    const prefBtn = el('button', { className: 'tv-button' }, `Stream: ${settings.streamPreference}`);
    prefBtn.onclick = () => {
      const next = settings.streamPreference === 'hls-first' ? 'ts-first' : 'hls-first';
      services.storage.setSettings({ streamPreference: next });
      showToast(`Preferência alterada para ${next}`);
      loadTab('Config');
    };
    const baseInput = el('input', { className: 'tv-input', value: settings.advancedBaseUrl || '', placeholder: 'Base URL avançada (oculta)' });
    const saveBase = el('button', { className: 'tv-button' }, 'Salvar URL avançada');
    saveBase.onclick = () => {
      services.storage.setSettings({ advancedBaseUrl: baseInput.value.trim() });
      showToast('URL avançada salva');
    };
    const clearCache = el('button', { className: 'tv-button' }, 'Limpar cache');
    clearCache.onclick = () => {
      services.storage.clearCache();
      showToast('Cache limpo');
    };
    const account = services.session.accountInfo || {};
    right.append(
      el('div', { className: 'card' }, [
        prefBtn,
        baseInput,
        saveBase,
        clearCache,
        el('p', {}, `Status: ${account.status || '-'}`),
        el('p', {}, `Expira em: ${account.exp_date || '-'}`),
      ]),
    );
  }

  async function openCurrent() {
    const item = state.currentRightItems?.[ui.rightIndex];
    if (!item) return;
    if (state.activeTab === 'Live') {
      const candidates = services.client.buildStreamCandidates('live', item.stream_id);
      services.play(item, candidates, { isLive: true });
    } else if (state.activeTab === 'VOD') {
      const candidates = services.client.buildStreamCandidates('vod', item.stream_id, item.container_extension || 'mp4');
      services.play(item, candidates, { isLive: false });
    } else if (state.activeTab === 'Séries') {
      const info = await services.client.fetchSeriesInfo(item.series_id);
      const episodes = Object.values(info.episodes || {}).flat();
      if (!episodes.length) return showToast('Sem episódios');
      const episode = episodes[0];
      const candidates = services.client.buildStreamCandidates('series', episode.id, episode.container_extension || 'mp4');
      services.play({ ...episode, name: `${item.name} - ${episode.title}` }, candidates, { isLive: false });
    }
  }

  function rerender() {
    if (state.activeTab === 'Live') renderLive();
    else if (state.activeTab === 'VOD') renderVod();
    else if (state.activeTab === 'Séries') renderSeries();
    else if (state.activeTab === 'EPG') renderEpg();
    else if (state.activeTab === 'Favoritos') renderFavorites();
    else if (state.activeTab === 'Recentes') renderRecents();
    else renderConfig();
  }

  function onKey(key) {
    if (TABS.includes(key)) return loadTab(key);
    if (key === 'ArrowLeft') ui.focusList = 'left';
    if (key === 'ArrowRight') ui.focusList = 'right';
    if (key === 'ArrowUp') {
      if (ui.focusList === 'left') ui.leftIndex = Math.max(0, ui.leftIndex - 1);
      else ui.rightIndex = Math.max(0, ui.rightIndex - 1);
    }
    if (key === 'ArrowDown') {
      if (ui.focusList === 'left') ui.leftIndex += 1;
      else ui.rightIndex += 1;
    }
    if (key === 'Enter' && ui.focusList === 'right' && !ui.isTabLoading) openCurrent();
    if (key === 'Search') {
      ui.query = prompt('Buscar canal:') || '';
    }
    if (key === 'Favorite') {
      const item = state.currentRightItems?.[ui.rightIndex];
      if (item) {
        services.storage.toggleFavorite({ id: item.stream_id || item.id || item.series_id, type: state.activeTab.toLowerCase(), name: item.name || item.title });
        showToast('Favorito atualizado');
      }
    }
    rerender();
  }

  loadTab('Live');
  return { onKey, showOverlay(content) { overlay.textContent = content; overlay.classList.remove('hidden'); }, hideOverlay() { overlay.classList.add('hidden'); } };
}
