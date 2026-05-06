import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import ErrorBoundary from './components/ErrorBoundary';

// Register PWA Service Worker
if ('serviceWorker' in navigator) {
  registerSW({ immediate: true });
}

// Initialize theme
const mode = localStorage.getItem('qpixa-theme') || 'dark';
const root = document.documentElement;
let effectiveTheme = mode;

if (mode === 'system') {
  effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

if (effectiveTheme === 'dark') {
  root.classList.add('dark');
} else {
  root.classList.remove('dark');
}

import { HelmetProvider } from 'react-helmet-async';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </HelmetProvider>
  </StrictMode>,
);

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              const toast = document.createElement('div');
              toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 bg-[#09090b] text-white px-4 py-3 rounded-xl shadow-lg z-[9999] flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 border border-white/10';
              toast.innerHTML = `
                <span class="text-sm font-medium">Update available</span>
                <button onclick="window.location.reload()" class="bg-white/20 px-2 py-1 rounded text-xs font-bold ring-1 ring-white/10">Refresh</button>
              `;
              document.body.appendChild(toast);
              setTimeout(() => toast.remove(), 10000);
            }
          };
        }
      };
    }).catch(() => {
      // Silently fail
    });
  });
}
