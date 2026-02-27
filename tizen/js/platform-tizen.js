(function initPlatform() {
  const keyMap = {
    37: 'ArrowLeft', 38: 'ArrowUp', 39: 'ArrowRight', 40: 'ArrowDown',
    13: 'Enter', 10009: 'Back', 427: 'ChannelUp', 428: 'ChannelDown',
    457: 'Info', 403: 'Favorite', 404: 'Search',
  };

  let lastCandidates = [];
  const video = document.getElementById('video');

  function openUrl(url) {
    if (window.webapis?.avplay) {
      const av = window.webapis.avplay;
      av.stop();
      av.open(url);
      av.prepareAsync(() => av.play());
    } else {
      video.src = url;
      video.play();
    }
  }

  window.__platformAdapter__ = {
    keyMap,
    play(candidates) {
      lastCandidates = candidates;
      openUrl(candidates[0]);
    },
    back(fallback) {
      if (window.webapis?.avplay) window.webapis.avplay.stop();
      fallback();
    },
    channel(step) {
      if (!lastCandidates.length) return;
      console.log('Channel step', step);
    },
  };
})();
