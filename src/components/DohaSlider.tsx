import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, ChevronLeft, ChevronRight, Volume2, Bookmark, Check, Sparkles } from 'lucide-react';
import { useRealtimeCollection } from '../hooks/useRealtimeCollection';
import { useAuthStore } from '../store/useAuthStore';
import { db } from '../firebase/config';
import { doc, arrayUnion, arrayRemove, setDoc, onSnapshot } from 'firebase/firestore';

export const DohaSlider = ({ title }: { title?: string }) => {
  const { data: dohas, loading } = useRealtimeCollection<any>('dohas');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userBookmarks, setUserBookmarks] = useState<string[]>([]);
  const { user } = useAuthStore();

  useEffect(() => {
    let unsubscribe: () => void;
    if (user && user.uid) {
      const userRef = doc(db, 'users', user.uid);
      unsubscribe = onSnapshot(userRef, (userDoc) => {
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserBookmarks(data.bookmarkedDohas || []);
        }
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    if (!dohas || dohas.length <= 1) return;
    const interval = setInterval(() => {
      if (!isSpeaking) {
        setCurrentIndex((prev) => (prev + 1) % dohas.length);
      }
    }, 25000); // Gentle scrolling interval
    return () => clearInterval(interval);
  }, [dohas, isSpeaking]);

  const defaultDoha = {
    id: "default_doha_1",
    text: "मंगल भवन अमंगल हारी।\nद्रवहु सुदसरथ अजिर बिहारी॥",
    meaning: "May the Lord who is the abode of blessings and destroyer of sorrows, shower His grace."
  };

  const currentDoha = dohas && dohas.length > 0 ? (dohas[currentIndex] || dohas[0] || defaultDoha) : defaultDoha;

  const handleNext = () => {
    if (!dohas || dohas.length === 0) return;
    stopSpeech();
    setCurrentIndex((prev) => (prev + 1) % dohas.length);
  };

  const handlePrev = () => {
    if (!dohas || dohas.length === 0) return;
    stopSpeech();
    setCurrentIndex((prev) => (prev - 1 + dohas.length) % dohas.length);
  };

  const handleBookmark = async (dohaId: string) => {
    if (!user || !user.uid) {
      alert("Please login to bookmark Dohas");
      return;
    }
    const userRef = doc(db, 'users', user.uid);
    try {
      if (userBookmarks.includes(dohaId)) {
        setUserBookmarks(prev => prev.filter(id => id !== dohaId));
        await setDoc(userRef, { bookmarkedDohas: arrayRemove(dohaId) }, { merge: true });
      } else {
        setUserBookmarks(prev => [...prev, dohaId]);
        await setDoc(userRef, { bookmarkedDohas: arrayUnion(dohaId) }, { merge: true });
      }
    } catch (e) {
      try {
        await setDoc(userRef, { bookmarkedDohas: [dohaId] }, { merge: true });
        setUserBookmarks(prev => [...prev, dohaId]);
      } catch(err) {}
    }
  };

  const speakDoha = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }

      const textToSpeak = currentDoha?.text || '';
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      
      // Try setting a Hindi voice if available
      const voices = window.speechSynthesis.getVoices();
      const hindiVoice = voices.find(voice => voice.lang.includes('hi') || voice.lang.includes('in'));
      if (hindiVoice) {
        utterance.voice = hindiVoice;
      }
      utterance.rate = 0.8; // Elegant slower pronunciation
      utterance.pitch = 0.95; // Warm spiritual tone

      utterance.onend = () => {
        setIsSpeaking(false);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text to speech is not supported in your browser.");
    }
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="relative rounded-[30px] p-[2px] bg-gradient-to-br from-amber-200 via-yellow-600 to-amber-700 shadow-xl overflow-hidden group">
      
      {/* Background Soft Divine Aura */}
      <div className="absolute -inset-10 bg-radial-gradient from-amber-100/10 via-transparent to-transparent opacity-60 pointer-events-none" />

      {/* Scripture Manuscript Parchment Design */}
      <div className="relative rounded-[28px] bg-gradient-to-b from-[#FFFDF5] to-[#F5F0E1] dark:from-slate-900 dark:to-slate-950 p-6 md:p-8 overflow-hidden">
        
        {/* Subtle Paper Texture Border */}
        <div className="absolute inset-3 border border-[#EBE3CC] dark:border-slate-800 pointer-events-none rounded-[22px] z-0" />
        <div className="absolute inset-4 border-2 border-dashed border-[#D2C59D]/40 dark:border-slate-700/40 pointer-events-none rounded-[20px] z-0" />

        <div className="relative z-10">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-gradient-to-br from-amber-500/10 to-amber-600/20 rounded-xl">
                <Book className="text-amber-700 dark:text-amber-400" size={18} />
              </span>
              <h3 className="font-bold text-sm md:text-base font-sans tracking-tight text-amber-900 dark:text-amber-200 uppercase">
                {title || 'Ramcharitmanas Doha'}
              </h3>
            </div>
            
            <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-900/5 dark:bg-amber-400/10 rounded-full border border-amber-900/10 dark:border-amber-400/20 text-[10px] font-bold text-amber-800 dark:text-amber-300">
              <Sparkles size={10} className="text-amber-600 dark:text-amber-400 animate-spin" /> Sanatan Doha
            </span>
          </div>

          <div className="min-h-[140px] flex items-center justify-center py-2 px-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.4 }}
                className="w-full text-center space-y-4"
              >
                {/* Devanagari Sanskrit Scripture */}
                <p className="font-devanagari text-lg md:text-2xl font-bold text-amber-950 dark:text-amber-100 whitespace-pre-line leading-relaxed drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)] dark:drop-shadow-none tracking-wide">
                  {currentDoha?.text}
                </p>

                {/* English / Hindi Meaning */}
                <p className="font-mukta text-xs md:text-sm text-[#5C4D29] dark:text-slate-300 leading-relaxed max-w-lg mx-auto italic border-t border-amber-900/5 dark:border-slate-800 pt-3">
                  {currentDoha?.meaning}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls Bar */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#EBE3CC] dark:border-slate-800">
            <div className="flex items-center gap-1">
              <button 
                onClick={handlePrev} 
                className="p-2 bg-amber-900/5 dark:bg-slate-800 hover:bg-amber-900/10 dark:hover:bg-slate-700 text-amber-900 dark:text-amber-400 rounded-full transition active:scale-90"
                title="Previous"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={handleNext} 
                className="p-2 bg-amber-900/5 dark:bg-slate-800 hover:bg-amber-900/10 dark:hover:bg-slate-700 text-amber-900 dark:text-amber-400 rounded-full transition active:scale-90"
                title="Next"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Middle Action Buttons */}
            <div className="flex gap-2">
              {/* Play Audio Button */}
              <button 
                onClick={speakDoha}
                className={`p-2.5 rounded-full transition-all duration-300 transform active:scale-90 flex items-center gap-2 ${
                  isSpeaking 
                    ? 'bg-amber-600 text-white shadow-md animate-pulse shadow-amber-600/20' 
                    : 'bg-amber-900/5 dark:bg-slate-800 text-amber-900 dark:text-amber-400 hover:bg-amber-900/10 dark:hover:bg-slate-700'
                }`}
                title="Listen Doha"
              >
                <Volume2 size={16} className={isSpeaking ? 'animate-bounce' : ''} />
                {isSpeaking && <span className="text-[10px] font-bold uppercase tracking-wider pr-1">Playing</span>}
              </button>

              {/* Bookmark Button */}
              <button 
                onClick={() => handleBookmark(currentDoha.id)}
                className={`p-2.5 rounded-full transition-all duration-300 transform active:scale-90 flex items-center justify-center ${
                  userBookmarks.includes(currentDoha.id) 
                    ? 'bg-amber-700 text-white shadow-md shadow-amber-700/20' 
                    : 'bg-amber-900/5 dark:bg-slate-800 text-amber-900 dark:text-amber-400 hover:bg-amber-900/10 dark:hover:bg-slate-700'
                }`}
                title="Bookmark"
              >
                <Bookmark size={16} fill={userBookmarks.includes(currentDoha.id) ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Pagination Dots indicator */}
            {dohas && dohas.length > 1 && (
              <div className="flex gap-1 items-center">
                {dohas.map((_, idx) => (
                  <button 
                    key={idx}
                    onClick={() => { stopSpeech(); setCurrentIndex(idx); }}
                    className={`transition-all duration-300 rounded-full h-1 ${
                      idx === currentIndex ? 'w-3 bg-amber-700' : 'w-1 bg-[#D2C59D] dark:bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
