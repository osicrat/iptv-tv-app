import { renderLogin } from './login.js';
import { createHomeScreen } from './home.js';
import { storage } from '../../storage/storage.js';
import { XtreamClient } from '../../api/xtream.js';
import { bindRemote } from '../../utils/remote.js';
import { loadXmltv, buildEpgIndex } from '../../epg/xmltv.js';
import { DEFAULT_BASE_URL } from '../../utils/constants.js';

export function bootstrap({ platform }) {
  const root = document.getElementById('app');
  const state = { activeTab: 'Live' };

  async function login({ username, password, baseUrl }) {
    const session = { username, password, baseUrl: baseUrl || DEFAULT_BASE_URL };
    const settings = storage.getSettings();
    const client = new XtreamClient(session, settings);
    const account = await client.validate();
    storage.setSession({ ...session, accountInfo: account.user_info || {} });
    startApp();
  }

  async function startApp() {
    const session = storage.getSession();
    if (!session?.username || !session?.password) {
      renderLogin(root, login);
      return;
    }

    const services = {
      storage,
      session,
      client: new XtreamClient(session, storage.getSettings()),
      epg: { nowNext: () => ({}), day: () => [] },
      async ensureEpg() {
        const raw = await loadXmltv(this.client);
        this.epg = buildEpgIndex(raw, state.liveStreams || []);
      },
      play(item, candidates, opts) {
        storage.addRecent({ id: item.stream_id || item.id, type: opts.isLive ? 'live' : 'vod', name: item.name || item.title });
        platform.play(candidates, { item, ...opts, epg: this.epg.nowNext(item) });
      },
      stopPlayback() {
        platform.stop?.();
      },
    };

    const home = createHomeScreen({ root, state, services });
    bindRemote((key) => {
      if (key === 'Back') return home.onKey('Back');
      if (key === 'ChannelUp') return platform.channel(1);
      if (key === 'ChannelDown') return platform.channel(-1);
      if (key === 'Info') return home.showOverlay(new Date().toLocaleTimeString());
      if (key === 'FavoriteLong') return home.onKey('Favorite');
      home.onKey(key);
    }, platform);
  }

  startApp();
}
