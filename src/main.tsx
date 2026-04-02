import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

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
    <App />
  </StrictMode>,
);
