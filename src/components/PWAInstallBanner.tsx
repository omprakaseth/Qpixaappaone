import { motion, AnimatePresence } from 'motion/react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useState, useEffect } from 'react';

export function PWAInstallBanner() {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-dismissed');
    if (isInstallable && !isInstalled && !dismissed) {
      setIsVisible(true);
    }
  }, [isInstallable, isInstalled]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-dismissed', Date.now().toString());
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-4 right-4 z-[60] md:max-w-md md:left-auto"
        >
          <div className="bg-[#09090b] border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                <img src="/android-chrome-192x192.png" alt="Qpixa" className="w-8 h-8 rounded-lg" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Install Qpixa App</h3>
                <p className="text-white/50 text-xs">Better experience on your home screen</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={promptInstall}
                className="bg-white text-black px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-transform"
              >
                <Download size={14} /> Install
              </button>
              <button 
                onClick={handleDismiss}
                className="p-2 text-white/40 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
