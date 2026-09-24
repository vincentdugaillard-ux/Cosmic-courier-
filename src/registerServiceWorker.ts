// Automatic Service Worker Registration for Cosmic Courier PWA

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // In development or preview environments, register the service worker
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('[PWA] Service Worker registered successfully with scope:', registration.scope);

          // Check for service worker updates
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('[PWA] New content is available; please refresh.');
                  } else {
                    console.log('[PWA] Content is cached for offline use.');
                  }
                }
              };
            }
          };
        })
        .catch((error) => {
          console.warn('[PWA] Service Worker registration failed:', error);
        });
    });
  }
}
