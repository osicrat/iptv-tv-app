import { bootstrap } from './ui/screens/app.js';

function resolvePlatform() {
  if (window.__platformAdapter__) return window.__platformAdapter__;

  let adapter = null;

  if (typeof window.createPlatformWebOS === 'function') {
    try {
      adapter = window.createPlatformWebOS();
    } catch (err) {
      console.error('[BOOT] falha ao criar adapter webOS via createPlatformWebOS:', err);
    }
  }

  if (!adapter && typeof window.__webosPlatformFactory === 'function') {
    try {
      adapter = window.__webosPlatformFactory();
    } catch (err) {
      console.error('[BOOT] falha ao criar adapter webOS via __webosPlatformFactory:', err);
    }
  }

  window.__platformAdapter__ = adapter || null;
  console.log('[BOOT] platform adapter:', adapter ? 'ok' : 'null');
  return window.__platformAdapter__;
}

bootstrap({ platform: resolvePlatform() });
