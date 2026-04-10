import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { Download, X, Smartphone, Share } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
      return;
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt after a short delay
      setTimeout(() => {
        if (!localStorage.getItem('pwa-prompt-dismissed')) {
          setShowPrompt(true);
        }
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For iOS, we can't detect beforeinstallprompt, so we show it manually
    if (isIOSDevice && !localStorage.getItem('pwa-prompt-dismissed')) {
      setTimeout(() => setShowPrompt(true), 5000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      // iOS doesn't support deferredPrompt, just show instructions
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    // Don't show again for 7 days
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-4 right-4 z-[100] md:left-auto md:right-4 md:bottom-4 md:w-80"
      >
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-4 overflow-hidden relative">
          <button 
            onClick={dismissPrompt}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-secondary transition-colors"
          >
            <X size={16} className="text-muted-foreground" />
          </button>

          <div className="flex items-start gap-4">
            <Logo size={48} />
            <div className="flex-1 pr-4">
              <h3 className="text-sm font-bold text-foreground">Install Qpixa</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Install on your home screen for a better experience.
              </p>
            </div>
          </div>

          <div className="mt-4">
            {isIOS ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-secondary/50 p-2 rounded-lg">
                  <Smartphone size={12} />
                  <span>Tap <Share size={10} className="inline mx-0.5" /> then "Add to Home Screen"</span>
                </div>
              </div>
            ) : (
              <button
                onClick={handleInstall}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Download size={14} /> Install Now
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
