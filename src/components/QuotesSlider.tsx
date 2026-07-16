import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, Heart, Bookmark, ChevronRight, Copy, Check, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SecureImage } from './common/SecureImage';
import { useAuthStore } from '../store/useAuthStore';
import { db } from '../firebase/config';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc, onSnapshot } from 'firebase/firestore';

interface QuotesSliderProps {
  quotes: any[];
  title?: string;
  onShare: (quote: any) => void;
}

export const QuotesSlider: React.FC<QuotesSliderProps> = ({ quotes, title, onShare }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userLikes, setUserLikes] = useState<string[]>([]);
  const [userBookmarks, setUserBookmarks] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    let unsubscribe: () => void;
    if (user && user.uid) {
      const userRef = doc(db, 'users', user.uid);
      unsubscribe = onSnapshot(userRef, (userDoc) => {
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserLikes(data.likedQuotes || []);
          setUserBookmarks(data.bookmarkedQuotes || []);
        }
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Auto slide every 15 seconds for fluid experience
  useEffect(() => {
    if (!quotes || quotes.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % quotes.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [quotes]);

  const handleLike = async (quoteId: string) => {
    if (!user || !user.uid) return;
    const userRef = doc(db, 'users', user.uid);
    try {
      if (userLikes.includes(quoteId)) {
        setUserLikes(prev => prev.filter(id => id !== quoteId));
        await setDoc(userRef, { likedQuotes: arrayRemove(quoteId) }, { merge: true });
      } else {
        setUserLikes(prev => [...prev, quoteId]);
        await setDoc(userRef, { likedQuotes: arrayUnion(quoteId) }, { merge: true });
      }
    } catch (e) {
      try {
        await setDoc(userRef, { likedQuotes: [quoteId] }, { merge: true });
        setUserLikes(prev => [...prev, quoteId]);
      } catch(err) {}
    }
  };

  const handleBookmark = async (quoteId: string) => {
    if (!user || !user.uid) return;
    const userRef = doc(db, 'users', user.uid);
    try {
      if (userBookmarks.includes(quoteId)) {
        setUserBookmarks(prev => prev.filter(id => id !== quoteId));
        await setDoc(userRef, { bookmarkedQuotes: arrayRemove(quoteId) }, { merge: true });
      } else {
        setUserBookmarks(prev => [...prev, quoteId]);
        await setDoc(userRef, { bookmarkedQuotes: arrayUnion(quoteId) }, { merge: true });
      }
    } catch (e) {
      try {
        await setDoc(userRef, { bookmarkedQuotes: [quoteId] }, { merge: true });
        setUserBookmarks(prev => [...prev, quoteId]);
      } catch(err) {}
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!quotes || quotes.length === 0) return null;

  const quote = quotes[currentIndex] || quotes[0] || {};

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-end mb-1">
        <h2 className="text-lg font-bold font-sans tracking-tight text-brown-dark dark:text-white flex items-center gap-2">
          <Sparkles className="text-saffron animate-pulse" size={18} />
          {title || 'Daily Divine Wisdom'}
        </h2>
      </div>

      <div className="relative group rounded-[30px] p-[2px] bg-gradient-to-br from-amber-400 via-saffron to-amber-600 shadow-[0_15px_30px_rgba(255,153,51,0.15)] dark:shadow-[0_15px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_40px_rgba(255,153,51,0.25)] transition-all duration-500 overflow-hidden">
        
        {/* Divine background glow */}
        <div className="absolute -inset-10 bg-gradient-to-br from-saffron/20 via-transparent to-amber-500/20 rounded-[40px] blur-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

        <div className="relative rounded-[28px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md overflow-hidden p-6 md:p-8 flex flex-col justify-between min-h-[300px]">
          
          {/* Faded Lotus Illustration Background Watermark */}
          <div className="absolute right-[-20px] bottom-[-20px] w-64 h-64 text-orange-500/5 dark:text-saffron/10 pointer-events-none select-none z-0">
            <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
              <path d="M50 15 C45 35, 20 40, 10 50 C30 50, 45 42, 50 25 C55 42, 70 50, 90 50 C80 40, 55 35, 50 15 Z" />
              <path d="M50 25 C45 45, 15 50, 5 65 C25 65, 45 55, 50 35 C55 35, 75 55, 95 65 C85 50, 55 45, 50 25 Z" />
              <path d="M50 35 C42 60, 5 65, 0 85 C20 85, 42 75, 50 50 C58 75, 80 85, 100 85 C95 65, 58 60, 50 35 Z" />
              <circle cx="50" cy="85" r="5" />
            </svg>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={quote.id || currentIndex}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative z-10 flex flex-col justify-between h-full flex-1"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  {quote.category ? (
                    <span className="bg-gradient-to-r from-orange-500/10 to-saffron/10 dark:from-saffron/20 dark:to-orange-500/10 text-saffron-dark dark:text-saffron-light text-[10px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider border border-saffron/10">
                      ✨ {quote.category}
                    </span>
                  ) : <div />}
                  <span className="font-mono text-xs text-brown-light/40 dark:text-slate-500">
                    Sutra {currentIndex + 1}/{quotes.length}
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Sanskrit/Devanagari text */}
                  <p className="font-devanagari text-xl md:text-2xl font-bold text-brown-dark dark:text-white leading-relaxed text-center drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] dark:drop-shadow-none">
                    {quote.text}
                  </p>
                  
                  {/* Meaning */}
                  {quote.meaning && (
                    <p className="font-mukta text-sm md:text-base text-brown-light/90 dark:text-slate-300 text-center leading-relaxed italic max-w-lg mx-auto">
                      "{quote.meaning}"
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs md:text-sm font-semibold text-saffron-dark dark:text-saffron-light text-center tracking-wide uppercase">
                  — {quote.source || 'Ancient Scripture'} —
                </p>

                {/* Custom Action Bar */}
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-orange-100/50 dark:border-slate-800/80">
                  <div className="flex gap-2">
                    {/* Like button */}
                    <button 
                      onClick={() => handleLike(quote.id)} 
                      className={`p-2.5 rounded-full transition-all duration-300 transform active:scale-95 flex items-center justify-center ${
                        userLikes.includes(quote.id) 
                          ? 'bg-red-500 text-white shadow-md shadow-red-500/20' 
                          : 'bg-orange-50/50 dark:bg-slate-800 text-brown-light dark:text-slate-400 hover:bg-orange-100/80 hover:text-red-500'
                      }`}
                      title="Favorite"
                    >
                      <Heart size={16} fill={userLikes.includes(quote.id) ? "currentColor" : "none"} />
                    </button>

                    {/* Bookmark Button */}
                    <button 
                      onClick={() => handleBookmark(quote.id)} 
                      className={`p-2.5 rounded-full transition-all duration-300 transform active:scale-95 flex items-center justify-center ${
                        userBookmarks.includes(quote.id) 
                          ? 'bg-saffron text-white shadow-md shadow-saffron/20' 
                          : 'bg-orange-50/50 dark:bg-slate-800 text-brown-light dark:text-slate-400 hover:bg-orange-100/80 hover:text-saffron'
                      }`}
                      title="Bookmark"
                    >
                      <Bookmark size={16} fill={userBookmarks.includes(quote.id) ? "currentColor" : "none"} />
                    </button>

                    {/* Copy Button */}
                    <button 
                      onClick={() => handleCopy(quote.text)} 
                      className="p-2.5 bg-orange-50/50 dark:bg-slate-800 text-brown-light dark:text-slate-400 hover:bg-orange-100/80 hover:text-saffron-dark rounded-full transition-all transform active:scale-95 flex items-center justify-center"
                      title="Copy Quote"
                    >
                      {copied ? <Check size={16} className="text-green-500 animate-scale" /> : <Copy size={16} />}
                    </button>

                    {/* Share Button */}
                    <button 
                      onClick={() => onShare(quote)} 
                      className="p-2.5 bg-orange-50/50 dark:bg-slate-800 text-brown-light dark:text-slate-400 hover:bg-orange-100/80 hover:text-saffron-dark rounded-full transition-all transform active:scale-95 flex items-center justify-center"
                      title="Share beautifully"
                    >
                      <Share2 size={16} />
                    </button>
                  </div>

                  {/* Animated Page Indicators */}
                  <div className="flex gap-1.5 items-center">
                    {quotes.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`transition-all duration-500 rounded-full h-1.5 ${
                          idx === currentIndex 
                            ? 'w-4 bg-saffron' 
                            : 'w-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300'
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <Link 
        to="/quotes" 
        className="w-full py-3.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-saffron-dark dark:text-saffron-light font-bold rounded-2xl shadow-sm border border-orange-100/60 dark:border-slate-700/60 flex items-center justify-center gap-2 hover:bg-orange-50 dark:hover:bg-slate-800 transition-all duration-300 text-sm hover:shadow-[0_10px_20px_rgba(255,153,51,0.05)] transform active:scale-[0.99]"
      >
        Explore All Wisdom & Sutras <ChevronRight size={16} className="animate-pulse" />
      </Link>
    </section>
  );
};
