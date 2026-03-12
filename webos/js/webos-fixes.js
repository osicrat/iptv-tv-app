(function () {
  if (window.__ETV_WEBOS_RECOVERY_FIX_V2__) return;
  window.__ETV_WEBOS_RECOVERY_FIX_V2__ = true;

  function patchHls() {
    if (!window.Hls || window.Hls.__etvPatchedForWebOSBuffer) return;

    var OriginalHls = window.Hls;

    function PatchedHls(userConfig) {
      var defaults = {
        enableWorker: false,
        lowLatencyMode: false,

        initialLiveManifestSize: 6,
        liveSyncDurationCount: 6,
        liveMaxLatencyDurationCount: 12,
        liveSyncMode: 'buffered',

        backBufferLength: 30,
        maxBufferLength: 45,
        maxMaxBufferLength: 90,

        manifestLoadingMaxRetry: 8,
        levelLoadingMaxRetry: 8,
        fragLoadingMaxRetry: 8,

        manifestLoadingRetryDelay: 1500,
        levelLoadingRetryDelay: 1500,
        fragLoadingRetryDelay: 1500,

        appendErrorMaxRetry: 8
      };

      var merged = {};
      var k;

      for (k in defaults) merged[k] = defaults[k];
      userConfig = userConfig || {};
      for (k in userConfig) merged[k] = userConfig[k];

      var hls = new OriginalHls(merged);
      var lastRecoverAt = 0;

      try {
        hls.on(OriginalHls.Events.ERROR, function (evt, data) {
          if (!data || !data.fatal) return;

          var now = Date.now();
          if ((now - lastRecoverAt) < 3000) return;
          lastRecoverAt = now;

          if (data.type === OriginalHls.ErrorTypes.NETWORK_ERROR) {
            try { hls.startLoad(); } catch (e1) {}
            return;
          }

          if (data.type === OriginalHls.ErrorTypes.MEDIA_ERROR) {
            try { hls.recoverMediaError(); } catch (e2) {}
            return;
          }
        });
      } catch (e3) {}

      return hls;
    }

    PatchedHls.prototype = OriginalHls.prototype;

    try {
      var names = Object.getOwnPropertyNames(OriginalHls);
      for (var i = 0; i < names.length; i++) {
        var name = names[i];
        if (name === 'prototype' || name === 'length' || name === 'name') continue;
        var desc = Object.getOwnPropertyDescriptor(OriginalHls, name);
        if (desc) {
          try { Object.defineProperty(PatchedHls, name, desc); } catch (e4) {}
        }
      }
    } catch (e5) {}

    PatchedHls.__etvPatchedForWebOSBuffer = true;
    window.Hls = PatchedHls;
  }

  function patchVideo(video) {
    if (!video || video.__etvRecoveryPatched) return;
    video.__etvRecoveryPatched = true;

    try { video.preload = 'auto'; } catch (e1) {}
    try { video.setAttribute('playsinline', 'playsinline'); } catch (e2) {}
    try { video.setAttribute('webkit-playsinline', 'webkit-playsinline'); } catch (e3) {}

    var lastTime = -1;
    var lastAdvanceAt = Date.now();
    var recovering = false;

    function markAdvance() {
      var t = 0;
      try { t = Number(video.currentTime || 0); } catch (e) { t = 0; }

      if (t !== lastTime) {
        lastTime = t;
        lastAdvanceAt = Date.now();
        recovering = false;
      }
    }

    function tryRecover(reason) {
      if (recovering) return;
      recovering = true;

      try { console.log('[ETV][webOS] video recover:', reason); } catch (e1) {}

      try { video.pause(); } catch (e2) {}
      try { video.load(); } catch (e3) {}

      setTimeout(function () {
        try {
          var p = video.play();
          if (p && p.catch) {
            p.catch(function () {});
          }
        } catch (e4) {}
      }, 250);
    }

    video.addEventListener('playing', markAdvance, false);
    video.addEventListener('timeupdate', markAdvance, false);
    video.addEventListener('loadeddata', markAdvance, false);
    video.addEventListener('canplay', markAdvance, false);
    video.addEventListener('progress', markAdvance, false);

    video.addEventListener('error', function () {
      tryRecover('error');
    }, false);

    video.addEventListener('stalled', function () {
      tryRecover('stalled');
    }, false);

    video.addEventListener('suspend', function () {
      setTimeout(function () {
        if (!video.paused && !video.ended) {
          tryRecover('suspend');
        }
      }, 1200);
    }, false);

    setInterval(function () {
      if (!document.body.contains(video)) return;
      if (video.paused || video.ended) return;

      var ready = 0;
      try { ready = video.readyState || 0; } catch (e1) { ready = 0; }

      var elapsed = Date.now() - lastAdvanceAt;

      if (ready <= 2 && elapsed >= 3500) {
        tryRecover('no-progress-readystate');
        return;
      }

      if (elapsed >= 5000) {
        tryRecover('no-progress-time');
      }
    }, 1000);
  }

  function scan() {
    patchHls();

    var videos = document.querySelectorAll('video');
    for (var i = 0; i < videos.length; i++) {
      patchVideo(videos[i]);
    }
  }

  scan();
  setInterval(scan, 1000);
})();
