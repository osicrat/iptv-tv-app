import { bootstrap } from './ui/screens/app.js';

function resolvePlatform() {
  if (window.__platformAdapter__) return window.__platformAdapter__;

  let adapter = null;

  if (typeof window.__tizenPlatformFactory === 'function') {
    try {
      adapter = window.__tizenPlatformFactory();
    } catch (err) {
      console.error('[BOOT] falha ao criar adapter Tizen via __tizenPlatformFactory:', err);
    }
  }

  if (!adapter && typeof window.createPlatformTizen === 'function') {
    try {
      adapter = window.createPlatformTizen();
    } catch (err) {
      console.error('[BOOT] falha ao criar adapter Tizen via createPlatformTizen:', err);
    }
  }

  window.__platformAdapter__ = adapter || null;
  console.log('[BOOT] platform adapter:', adapter ? 'ok' : 'null');
  return window.__platformAdapter__;
}

bootstrap({ platform: resolvePlatform() });
