(function initPlatform() {
  const keyMap = {
    37: 'ArrowLeft', 38: 'ArrowUp', 39: 'ArrowRight', 40: 'ArrowDown',
    13: 'Enter', 461: 'Back', 33: 'ChannelUp', 34: 'ChannelDown',
    457: 'Info', 403: 'Favorite', 404: 'Search',
  };

  const video = document.getElementById('video');
  let hls = null;
  let lastCandidates = [];

  async function playWithFallback(candidates) {
    lastCandidates = candidates;
    const [first, second] = candidates;
    video.src = first;
    try {
      await video.play();
    } catch {
      if (window.Hls?.isSupported()) {
        hls?.destroy?.();
        hls = new window.Hls();
        hls.attachMedia(video);
        hls.loadSource(first);
      } else if (second) {
        video.src = second;
        try {
          await video.play();
        } catch {
          alert('Falha ao reproduzir TS. Tente HLS-first em Config.');
        }
      }
    }
  }

  window.__platformAdapter__ = {
    keyMap,
    play(candidates) { playWithFallback(candidates); },
    back(fallback) {
      video.pause();
      fallback();
    },
    channel(step) {
      console.log('zapping', step, lastCandidates[0]);
    },
  };
})();
