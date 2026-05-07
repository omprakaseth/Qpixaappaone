import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </HelmetProvider>
  </StrictMode>,
);
