export function bindRemote(handler, platform) {
  const map = platform?.keyMap || {};
  document.addEventListener('keydown', (ev) => {
    const code = map[ev.keyCode] || ev.key;
    handler(code, ev);
  });
}
