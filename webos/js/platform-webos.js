(function initPlatform() {
  const keyMap = {
    37: 'ArrowLeft',
    38: 'ArrowUp',
    39: 'ArrowRight',
    40: 'ArrowDown',
    13: 'Enter',
    461: 'Back',
    33: 'ChannelUp',
    34: 'ChannelDown',
    457: 'Info',
    403: 'Favorite',
    404: 'Search',
  };

  const video = document.getElementById('video');
  let hls = null;
  let callbacks = {};

  const state = {
    candidates: [],
    activeUrl: null,
    opts: {},
    item: null,
    isLive: false,
    reconnectAttempt: 0,
    reconnecting: false,
    reconnectTimer: null,
    playbackStarted: false,
  };

  function clearReconnectTimer() {
    if (state.reconnectTimer) {
      clearTimeout(state.reconnectTimer);
      state.reconnectTimer = null;
    }
  }

  function destroyHls() {
    if (hls) {
      try { hls.destroy(); } catch {}
      hls = null;
    }
  }

  function stopMedia() {
    clearReconnectTimer();
    destroyHls();
    try { video.pause(); } catch {}
    try { video.removeAttribute('src'); } catch {}
    try { video.load(); } catch {}
    state.playbackStarted = false;
  }

  function fire(name, payload = {}) {
    try {
      callbacks?.[name]?.(payload);
    } catch (err) {
      console.warn(`[webOS] callback ${name} falhou`, err);
    }
  }

  function mapKeyEvent(input) {
    const keyCode = typeof input === 'number' ? input : input?.keyCode;
    return keyMap[keyCode] || (typeof input === 'object' ? input?.key : null) || null;
  }

  async function playNative(url) {
    destroyHls();
    video.src = url;
    await video.play();
  }

  async function playWithHlsJs(url) {
    if (!window.Hls?.isSupported()) throw new Error('hls.js indisponível');
    destroyHls();

    await new Promise((resolve, reject) => {
      hls = new window.Hls();
      hls.attachMedia(video);
      hls.once(window.Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(url);
      });

      hls.once(window.Hls.Events.MANIFEST_PARSED, async () => {
        try {
          await video.play();
          resolve();
        } catch (err) {
          reject(err);
        }
      });

      hls.on(window.Hls.Events.ERROR, (_, data) => {
        if (!data?.fatal) return;
        reject(new Error(data?.details || 'fatal hls error'));
      });
    });
  }

  async function tryCandidates(candidates) {
    const [first, second] = candidates;
    const errors = [];

    if (first) {
      try {
        await playNative(first);
        state.activeUrl = first;
        return;
      } catch (err) {
        errors.push(err);
      }

      try {
        await playWithHlsJs(first);
        state.activeUrl = first;
        return;
      } catch (err) {
        errors.push(err);
      }
    }

    if (second) {
      try {
        await playNative(second);
        state.activeUrl = second;
        return;
      } catch (err) {
        errors.push(err);
      }
    }

    throw errors[errors.length - 1] || new Error('nenhuma candidate reproduziu');
  }

  function getMaxReconnectAttempts() {
    const val = Number(state.opts?.maxReconnectAttempts ?? 0);
    return Number.isFinite(val) ? Math.max(0, val) : 0;
  }

  function scheduleReconnect(reason = 'unknown') {
    if (!state.isLive || !state.candidates.length) return;
    if (state.reconnecting) return;

    const max = getMaxReconnectAttempts();
    if (state.reconnectAttempt >= max) {
      fire('onError', { reason, attempt: state.reconnectAttempt, max, item: state.item, isLive: state.isLive });
      return;
    }

    state.reconnecting = true;
    state.reconnectAttempt += 1;

    fire('onTryReconnect', {
      reason,
      attempt: state.reconnectAttempt,
      max,
      item: state.item,
      isLive: state.isLive,
    });

    clearReconnectTimer();
    state.reconnectTimer = setTimeout(async () => {
      try {
        await tryCandidates(state.candidates);
      } catch (err) {
        state.reconnecting = false;
        scheduleReconnect(err?.message || reason);
        return;
      }
      state.reconnecting = false;
      state.reconnectTimer = null;
    }, 900);
  }

  async function play(candidates, metaOrOpts = {}) {
    state.candidates = Array.isArray(candidates) ? candidates.filter(Boolean) : [];
    state.opts = metaOrOpts || {};
    state.item = state.opts.item || null;
    state.isLive = !!state.opts.isLive;
    state.reconnectAttempt = 0;
    state.reconnecting = false;
    state.playbackStarted = false;

    clearReconnectTimer();

    if (!state.candidates.length) {
      fire('onError', { reason: 'empty-candidates', item: state.item, isLive: state.isLive });
      return;
    }

    try {
      await tryCandidates(state.candidates);
    } catch (err) {
      fire('onError', {
        reason: err?.message || 'play-failed',
        attempt: state.reconnectAttempt,
        max: getMaxReconnectAttempts(),
        item: state.item,
        isLive: state.isLive,
      });
      scheduleReconnect('initial-play-failed');
    }
  }

  function stop() {
    stopMedia();
    state.reconnectAttempt = 0;
    state.reconnecting = false;
  }

  function getPlaybackState() {
    return {
      currentTime: Number(video.currentTime || 0),
      duration: Number.isFinite(video.duration) ? video.duration : 0,
      isLive: state.isLive,
      canSeek: Number.isFinite(video.duration) && !state.isLive,
      paused: !!video.paused,
    };
  }

  function seekBy(seconds) {
    if (!Number.isFinite(video.duration) || state.isLive) return getPlaybackState();
    const next = Math.max(0, Math.min(video.duration, (video.currentTime || 0) + Number(seconds || 0)));
    video.currentTime = next;
    return getPlaybackState();
  }

  function togglePause() {
    if (video.paused) {
      video.play().catch(() => {});
      return false;
    }
    video.pause();
    return true;
  }

  function setCallbacks(cb = {}) {
    callbacks = cb;
  }

  video.addEventListener('playing', () => {
    if (!state.playbackStarted) {
      state.playbackStarted = true;
      fire('onPlayStarted', { item: state.item, isLive: state.isLive });
    }
  });

  video.addEventListener('ended', () => {
    fire('onEnded', { item: state.item, isLive: state.isLive });
    scheduleReconnect('ended');
  });

  video.addEventListener('error', () => {
    scheduleReconnect('video-error');
    if (!state.isLive) fire('onError', { reason: 'video-error', item: state.item, isLive: state.isLive });
  });

  video.addEventListener('stalled', () => {
    scheduleReconnect('stalled');
  });

  video.addEventListener('waiting', () => {
    if (!state.isLive) return;
    scheduleReconnect('waiting');
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    if (!state.activeUrl || !video.paused) return;
    video.play().catch(() => {
      scheduleReconnect('resume-play-failed');
    });
  });

  const adapter = {
    keyMap,
    mapKeyEvent,
    play,
    stop,
    getPlaybackState,
    seekBy,
    togglePause,
    setCallbacks,
  };

  window.createPlatformWebOS = function createPlatformWebOS() {
    return adapter;
  };

  window.__platformAdapter__ = adapter;
})();
