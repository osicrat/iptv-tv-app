window.Hls = window.Hls || class {
  static isSupported() { return !!window.MediaSource; }
  attachMedia(video) { this.video = video; }
  loadSource(url) { if (this.video) { this.video.src = url; this.video.play?.(); } }
  on() {}
  destroy() {}
};
