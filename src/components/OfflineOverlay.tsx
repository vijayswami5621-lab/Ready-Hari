import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, RefreshCw } from 'lucide-react';

export const OfflineOverlay = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {!isOnline && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-orange-50/95 dark:bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl max-w-sm w-full border border-orange-100 dark:border-slate-700"
            >
              <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-800 p-2 shadow-lg border-2 border-orange-100 dark:border-slate-700 flex items-center justify-center overflow-hidden mx-auto mb-6"><img src="/logo.png" alt="Hari Pathshala" className="w-full h-full object-contain" /></div>
              <h2 className="text-2xl font-bold font-sans text-brown-dark dark:text-white mb-2">You're offline.</h2>
              <p className="text-sm text-brown-light dark:text-slate-400 font-mukta mb-8 leading-relaxed">
                Please check your internet connection. We'll automatically reconnect when you're back online.
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-3.5 bg-orange-100 dark:bg-slate-700 text-brown-dark dark:text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-200 dark:hover:bg-slate-600 transition-colors"
              >
                <RefreshCw size={18} /> Try Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reconnected Toast */}
      <AnimatePresence>
        {showReconnected && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-safe pt-4 left-0 right-0 z-[101] flex justify-center pointer-events-none"
          >
            <div className="bg-green-500 text-white px-6 py-3 rounded-full shadow-lg font-bold text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span> Back Online
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
