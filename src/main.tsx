import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import ErrorBoundary from './components/ErrorBoundary';

// Register PWA Service Worker
if ('serviceWorker' in navigator) {
  registerSW({ immediate: true });
}

// Initialize theme
const mode = localStorage.getItem('qpixa-theme') || 'light';
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
