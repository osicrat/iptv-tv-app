/* js/platform-tizen.js (NON-MODULE)
 * Samsung Tizen platform bridge:
 * - Exports a global factory: window.createPlatformTizen()
 * - Uses webapis.avplay when available (recommended for Live)
 * - Live reconnect with candidate failover and retry cycle
 */

(function () {
  'use strict';

  var KEY = {
    ENTER: 13,
    UP: 38,
    DOWN: 40,
    LEFT: 37,
    RIGHT: 39,
    ESC: 27,
    BACK: 10009,
    PLAY: 415,
    PAUSE: 19,
    PLAY_PAUSE: 10252,
    STOP: 413,
    FF: 417,
    REW: 412,
    CH_UP: 427,
    CH_DOWN: 428,
    INFO: 457,
  };

  function log() {
    try { console.log.apply(console, ['[TIZEN]'].concat([].slice.call(arguments))); } catch (e) {}
  }

  function safe(fn) {
    try { return fn(); } catch (e) { return undefined; }
  }

  function hasAvplay() {
    return typeof window !== 'undefined' && window.webapis && window.webapis.avplay;
  }

  function mapKey(ev) {
    var code = ev.keyCode;
    switch (code) {
      case KEY.BACK:
      case KEY.ESC: return 'Back';
      case KEY.UP: return 'Up';
      case KEY.DOWN: return 'Down';
      case KEY.LEFT: return 'Left';
      case KEY.RIGHT: return 'Right';
      case KEY.ENTER: return 'Enter';
      case KEY.CH_UP: return 'ChannelUp';
      case KEY.CH_DOWN: return 'ChannelDown';
      case KEY.INFO: return 'Info';
      case KEY.PLAY: return 'Play';
      case KEY.PAUSE: return 'Pause';
      case KEY.PLAY_PAUSE: return 'PlayPause';
      case KEY.FF: return 'FastForward';
      case KEY.REW: return 'Rewind';
      case KEY.STOP: return 'Stop';
      default: return null;
    }
  }

  document.addEventListener('keydown', function (ev) {
    if (ev && ev.keyCode === KEY.BACK) ev.preventDefault();
  }, true);

  function createPlatformTizen() {
    var callbacks = {
      onEnded: null,
      onPlayStarted: null,
      onTryReconnect: null,
      onError: null,
    };

    var tryList = [];
    var tryIdx = 0;
    var currentMeta = null;
    var currentOpts = {};
    var reconnectAttempts = 0;
    var reconnectTimer = null;
    var stallWatchTimer = null;
    var lastPlaybackTick = 0;
    var lastPlaybackMarkAt = 0;
    var currentUrl = '';

    function av() { return window.webapis.avplay; }

    function emit(name, payload) {
      if (callbacks && typeof callbacks[name] === 'function') {
        safe(function () { callbacks[name](payload || {}); });
      }
    }

    function setAvplayActive(active) {
      var html = document.documentElement;
      var body = document.body;
      if (!html || !body) return;
      html.classList.toggle('avplay-active', !!active);
      body.classList.toggle('avplay-active', !!active);
    }

    function clearReconnectTimer() {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    }

    function clearStallWatchTimer() {
      if (stallWatchTimer) {
        clearInterval(stallWatchTimer);
        stallWatchTimer = null;
      }
    }

    function hardStopAvplay() {
      clearReconnectTimer();
      clearStallWatchTimer();
      if (!hasAvplay()) return;
      safe(function () { av().stop(); });
      safe(function () { av().close(); });
      setAvplayActive(false);
    }

    function setRect() {
      safe(function () { av().setDisplayRect(0, 0, 1920, 1080); });
      safe(function () { av().setDisplayMethod('PLAYER_DISPLAY_MODE_FULL_SCREEN'); });
    }

    function maxReconnects() {
      var value = Number(currentOpts && currentOpts.maxReconnectAttempts);
      return Number.isFinite(value) && value > 0 ? value : 0;
    }

    function resetTry(list) {
      tryList = Array.isArray(list) ? list.filter(Boolean) : [];
      tryIdx = 0;
    }

    function scheduleReconnect(reason) {
      if (!currentOpts || !currentOpts.isLive) return false;
      if (!tryList.length) return false;
      if (reconnectAttempts >= maxReconnects()) return false;

      reconnectAttempts += 1;
      var attempt = reconnectAttempts;
      var max = maxReconnects();
      emit('onTryReconnect', {
        attempt: attempt,
        max: max,
        reason: reason,
        item: currentMeta,
        url: currentUrl,
      });

      clearReconnectTimer();
      reconnectTimer = setTimeout(function () {
        reconnectTimer = null;
        resetTry(tryList);
        if (tryList.length) openAndPlay(tryList[0]);
      }, Math.min(4500, 1200 + ((attempt - 1) * 900)));
      return true;
    }

    function handleFailure(reason) {
      var beforeIdx = tryIdx;
      var nextUrl = (beforeIdx + 1 < tryList.length) ? tryList[beforeIdx + 1] : '';
      log('[DSDBG] handleFailure start', {
        reason: reason,
        tryIdxBefore: beforeIdx,
        tryListLength: tryList.length,
        nextUrl: nextUrl || null,
      });
      log('failure:', reason, 'candidate', tryIdx + 1, '/', tryList.length);
      hardStopAvplay();
      tryIdx += 1;
      log('[DSDBG] handleFailure after increment', {
        reason: reason,
        tryIdxAfter: tryIdx,
        willTryNext: tryIdx < tryList.length,
        nextUrl: (tryIdx < tryList.length) ? tryList[tryIdx] : null,
      });

      if (tryIdx < tryList.length) {
        log('[DSDBG] handleFailure next candidate', {
          reason: reason,
          nextTryIdx: tryIdx,
          nextUrl: tryList[tryIdx],
          tryListLength: tryList.length,
        });
        openAndPlay(tryList[tryIdx]);
        return;
      }

      if (scheduleReconnect(reason)) return;

      emit('onError', {
        reason: reason,
        item: currentMeta,
        url: currentUrl,
        attempts: reconnectAttempts,
      });
    }

        function startStallWatch() {
      clearStallWatchTimer();
      lastPlaybackTick = 0;
      lastPlaybackMarkAt = Date.now();

      stallWatchTimer = setInterval(function () {
        if (!hasAvplay()) return;
        if (!currentOpts || !currentOpts.isLive) return;

        var state = safe(function () { return av().getState && av().getState(); }) || '';
        if (state !== 'PLAYING') return;

        var pos = safe(function () { return av().getCurrentTime(); }) || 0;
        var now = Date.now();

        if (pos > 0 && pos !== lastPlaybackTick) {
          lastPlaybackTick = pos;
          lastPlaybackMarkAt = now;
          return;
        }

        if ((now - lastPlaybackMarkAt) >= 3500) {
          log('stall watchdog detected freeze');
          clearStallWatchTimer();
          handleFailure('stall watchdog');
        }
      }, 1000);
    }

    function setListener() {
      safe(function () {
        av().setListener({
          onbufferingstart: function () { log('buffer start'); },
          onbufferingcomplete: function () { log('buffer complete'); },
          onstreamcompleted: function () {
            log('[DSDBG] onstreamcompleted', {
              currentUrl: currentUrl,
              isLive: !!(currentOpts && currentOpts.isLive),
              tryIdx: tryIdx,
              tryListLength: tryList.length,
            });
            log('stream completed');
            if (currentOpts && currentOpts.isLive) {
              handleFailure('stream completed');
              return;
            }
            emit('onEnded', currentMeta || {});
          },
          onerror: function (e) {
            log('[DSDBG] onerror', {
              error: e,
              currentUrl: currentUrl,
              tryIdx: tryIdx,
              tryListLength: tryList.length,
            });
            log('avplay error', e);
            handleFailure('avplay error: ' + e);
          },
        });
      });
    }

    function openAndPlay(url) {
      if (!hasAvplay()) return;
      currentUrl = String(url || '');
      if (!currentUrl) return;

      var urlNoQuery = currentUrl.split('?')[0];
      var mExt = /\.([a-z0-9]+)$/i.exec(urlNoQuery);
      log('[DSDBG] openAndPlay start', {
        url: currentUrl,
        tryIdx: tryIdx,
        tryListLength: tryList.length,
        hasLivePath: currentUrl.indexOf('/live/') !== -1,
        extension: mExt ? mExt[1].toLowerCase() : null,
      });
      log('open', currentUrl);
      hardStopAvplay();
      setListener();
      safe(function () { av().setTimeoutForBuffering(10); });
      safe(function () { av().setBufferingParam('PLAYER_BUFFER_FOR_PLAY', 'PLAYER_BUFFER_SIZE_IN_SECOND', 6); });
      safe(function () { av().setBufferingParam('PLAYER_BUFFER_FOR_RESUME', 'PLAYER_BUFFER_SIZE_IN_SECOND', 8); });

      try {
        av().open(currentUrl);
      } catch (errOpen) {
        log('[DSDBG] open fail', {
          error: errOpen,
          url: currentUrl,
          tryIdx: tryIdx,
          tryListLength: tryList.length,
        });
        log('open fail', errOpen);
        handleFailure('open fail: ' + errOpen);
        return;
      }

      setRect();
      safe(function () { av().setStreamingProperty('ADAPTIVE_INFO', 'FIXED_MAX_RESOLUTION=1920X1080'); });

      try {
        av().prepareAsync(
          function () {
            log('[DSDBG] prepareAsync success', { url: currentUrl, tryIdx: tryIdx, tryListLength: tryList.length });
            safe(function () { av().play(); });
            log('[DSDBG] avplay play() called', { url: currentUrl, tryIdx: tryIdx });
            setAvplayActive(true);
            reconnectAttempts = 0;
            startStallWatch();
            emit('onPlayStarted', {
              item: currentMeta,
              url: currentUrl,
              isLive: !!(currentOpts && currentOpts.isLive),
            });
            log('[DSDBG] play ok', { url: currentUrl, tryIdx: tryIdx, tryListLength: tryList.length });
            log('play ok');
          },
          function (err) {
            log('[DSDBG] prepareAsync fail', {
              error: err,
              url: currentUrl,
              tryIdx: tryIdx,
              tryListLength: tryList.length,
            });
            log('prepareAsync fail', err);
            handleFailure('prepareAsync fail: ' + err);
          }
        );
      } catch (errPrepare) {
        log('[DSDBG] prepareAsync throw', {
          error: errPrepare,
          url: currentUrl,
          tryIdx: tryIdx,
          tryListLength: tryList.length,
        });
        log('prepareAsync throw', errPrepare);
        handleFailure('prepareAsync throw: ' + errPrepare);
      }
    }

    function play(candidates, opts) {
      currentOpts = opts || {};
      currentMeta = currentOpts.item || null;
      reconnectAttempts = 0;
      currentUrl = '';

      var list = Array.isArray(candidates) ? candidates.filter(Boolean) : [];
      var isDirectStream = !!(currentMeta && (currentMeta.stream_source || currentMeta.streamSource));

      log('[DSDBG] play start', {
        isDirectStream: isDirectStream,
        candidatesReceived: list.length,
        stream_source: currentMeta && currentMeta.stream_source,
        streamSource: currentMeta && currentMeta.streamSource,
        stream_id: currentMeta && currentMeta.stream_id,
        name: currentMeta && currentMeta.name,
        container_extension: currentMeta && currentMeta.container_extension,
      });

      if (isDirectStream && list.length) {
        var directFirst = [];
        var rest = [];

        list.forEach(function (url) {
          if (!url) return;
          var s = String(url);

          if (/^https?:\/\//i.test(s) && s.indexOf('/live/') === -1) directFirst.push(s);
          else rest.push(s);
        });

        list = directFirst.concat(rest);
      }

      log('[DSDBG] before resetTry', { listLength: list.length, tryListLength: tryList.length, tryIdx: tryIdx, finalList: list });
      resetTry(list);
      log('[DSDBG] after resetTry', { listLength: list.length, tryListLength: tryList.length, tryIdx: tryIdx });

      if (hasAvplay()) {
        if (!tryList.length) return;
        openAndPlay(tryList[0]);
        return;
      }

      var video = document.getElementById('video');
      if (!video || !list.length) return;
      video.src = list[0];
      safe(function () { video.play(); });
      setAvplayActive(false);
      emit('onPlayStarted', {
        item: currentMeta,
        url: list[0],
        isLive: !!(currentOpts && currentOpts.isLive),
      });
    }

    function stop() {
      currentMeta = null;
      currentOpts = {};
      reconnectAttempts = 0;
      currentUrl = '';
      hardStopAvplay();
      var video = document.getElementById('video');
      if (video) {
        safe(function () { video.pause(); });
        safe(function () { video.removeAttribute('src'); video.load(); });
      }
    }

    function getPlaybackState() {
      if (hasAvplay()) {
        var dur = safe(function () { return av().getDuration(); }) || 0;
        var pos = safe(function () { return av().getCurrentTime(); }) || 0;
        var state = safe(function () { return av().getState && av().getState(); }) || '';
        var isLive = dur === 0;
        return {
          currentTime: pos / 1000,
          duration: dur / 1000,
          isLive: isLive,
          canSeek: !isLive && dur > 0,
          paused: state === 'PAUSED',
        };
      }

      var video = document.getElementById('video');
      if (!video) return { currentTime: 0, duration: 0, isLive: false, canSeek: false, paused: false };
      var d = Number.isFinite(video.duration) ? video.duration : 0;
      var t = Number.isFinite(video.currentTime) ? video.currentTime : 0;
      var live = !d || d === Infinity;
      return { currentTime: t, duration: d || 0, isLive: live, canSeek: !live && d > 0, paused: !!video.paused };
    }

    function seekBy(seconds) {
      if (hasAvplay()) {
        var st = getPlaybackState();
        if (!st.canSeek) return st;
        var target = Math.max(0, (st.currentTime + seconds) * 1000);
        safe(function () { av().seekTo(target); });
        return getPlaybackState();
      }

      var video = document.getElementById('video');
      if (!video) return getPlaybackState();
      safe(function () { video.currentTime = Math.max(0, video.currentTime + seconds); });
      return getPlaybackState();
    }

    function togglePause() {
      if (hasAvplay()) {
        var state = safe(function () { return av().getState && av().getState(); });
        if (state === 'PLAYING') {
          safe(function () { av().pause(); });
          return false;
        }
        safe(function () { av().play(); });
        return true;
      }

      var video = document.getElementById('video');
      if (!video) return false;
      if (video.paused) { safe(function () { video.play(); }); return true; }
      safe(function () { video.pause(); });
      return false;
    }

    function setCallbacks(cb) {
      callbacks = cb || callbacks;
    }

    return {
      play: play,
      stop: stop,
      getPlaybackState: getPlaybackState,
      seekBy: seekBy,
      togglePause: togglePause,
      setCallbacks: setCallbacks,
      mapKeyEvent: mapKey,
    };
  }

  window.createPlatformTizen = createPlatformTizen;
  window.__tizenPlatformFactory = createPlatformTizen;
  window.__platformAdapter__ = window.createPlatformTizen();

  log('platform-tizen loaded (non-module)');
})();






