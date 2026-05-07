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
let effectiveTheme = 'dark';
try {
  const mode = localStorage.getItem('qpixa-theme') || 'dark';
  const root = document.documentElement;
  effectiveTheme = mode;

  if (mode === 'system') {
    effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  if (effectiveTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
} catch (e) {
  console.warn('Storage access restricted, defaulting to dark theme:', e);
  document.documentElement.classList.add('dark');
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
