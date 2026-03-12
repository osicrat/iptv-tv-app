export function bindRemote(handler, platform) {
  document.addEventListener('keydown', (ev) => {
    const mapped =
      typeof platform?.mapKeyEvent === 'function'
        ? platform.mapKeyEvent(ev)
        : (platform?.keyMap?.[ev.keyCode] || null);

    const code = mapped || ev.key;
    handler(code, ev);
  });
}
