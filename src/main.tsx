import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const isLocalHost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Register the service worker in all environments. On localhost, sw.js skips app-shell
// caching but still enables Web Push for reminder testing.
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (isLocalHost && 'caches' in window) {
      caches.keys()
        .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
        .catch((err) => {
          console.error('PWA cache cleanup failed: ', err);
        });
    }

    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('PWA Service Worker registered with scope: ', registration.scope);
      })
      .catch((err) => {
        console.error('PWA Service Worker registration failed: ', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
