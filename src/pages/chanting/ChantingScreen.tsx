import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SEO } from '../../components/SEO';
import { 
  ArrowLeft, Activity, Sparkles, Clock, Flame, Trophy, Hash, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { db } from '../../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { useGoBack } from "../../hooks/useGoBack";
import { updateNaamJapCount, getISTDateInfo } from '../../services/naamJapService';

export const ChantingScreen = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { user, userData } = useAuthStore();

  // Real-time document state loaded from Firestore
  const [dbData, setDbData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Local counter representing Today's total count for responsive 0ms visual feedback
  const [localTodayCount, setLocalTodayCount] = useState(0);

  // Animation triggers
  const [pulseBead, setPulseBead] = useState(false);
  const [completionMsg, setCompletionMsg] = useState<string | null>(null);
  const [particles, setParticles] = useState<any[]>([]);

  // References for tracking pending increments and debounce
  const pendingTapsRef = useRef(0);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dbDataRef = useRef<any>(null);

  dbDataRef.current = dbData;

  const { dateStr } = getISTDateInfo();

  // Play custom synthesized offline-safe click sound
  const playClickSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (err) {
      console.warn("Audio Context error:", err);
    }
  };

  // 1. Subscribe to real-time naamJap document
  useEffect(() => {
    if (!user) return;

    const docRef = doc(db, 'naamJap', user.uid);
    const unsub = onSnapshot(docRef, (snap) => {
      setLoading(false);
      if (snap.exists()) {
        const data = snap.data();
        setDbData(data);

        // If there are no pending unsynced taps, align the local display with DB
        if (pendingTapsRef.current === 0) {
          const isToday = data.lastActiveDate === dateStr;
          setLocalTodayCount(isToday ? (data.todayCount || 0) : 0);
        }
      } else {
        setDbData(null);
        if (pendingTapsRef.current === 0) {
          setLocalTodayCount(0);
        }
      }
    }, (err) => {
      console.warn("naamJap document subscribe failed, using local/cached count", err);
      setLoading(false);
    });

    return () => {
      unsub();
      // On unmount, flush any remaining taps immediately
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      if (pendingTapsRef.current > 0 && user) {
        const tapsToSync = pendingTapsRef.current;
        pendingTapsRef.current = 0;

        updateNaamJapCount(
          user.uid,
          user.displayName || userData?.name || "Devotee",
          user.photoURL || userData?.profileImage || "",
          tapsToSync
        ).catch(err => console.error("Unmount sync failed:", err));
      }
    };
  }, [user, dateStr]);

  // 2. Queue / Debounce Sync to Firestore
  const queueSync = (uid: string, tapsIncrement: number) => {
    pendingTapsRef.current += tapsIncrement;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      const tapsToSync = pendingTapsRef.current;
      if (tapsToSync === 0) return;
      pendingTapsRef.current = 0;

      try {
        await updateNaamJapCount(
          uid,
          user?.displayName || userData?.name || "Devotee",
          user?.photoURL || userData?.profileImage || "",
          tapsToSync
        );
      } catch (error) {
        console.error("Failed to sync Naam Jap taps:", error);
        pendingTapsRef.current += tapsToSync;
      }
    }, 800); // 800ms debounce
  };

  // 3. Bead and Mala calculation for today's count
  const todayMala = Math.floor(localTodayCount / 108);
  const beadCount = localTodayCount > 0 && localTodayCount % 108 === 0 ? 108 : localTodayCount % 108;

  // Progress ring dimensions (Radius 54)
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progressPercentage = Math.round((beadCount / 108) * 100);
  const strokeDashoffset = circumference - (beadCount / 108) * circumference;

  // 4. Handle Bead Tapping (+1 Bead)
  const handleChant = () => {
    if (!user) return;

    playClickSound();

    // Android vibration feedback
    if (window.navigator && window.navigator.vibrate) {
      if ((localTodayCount + 1) % 108 === 0) {
        window.navigator.vibrate([100, 50, 100]); // Vibrational milestone for a full mala
      } else {
        window.navigator.vibrate(20); // Soft vibration for bead click
      }
    }

    // Visual animation triggers
    setPulseBead(true);
    setTimeout(() => setPulseBead(false), 150);

    const prevCount = localTodayCount;
    const nextCount = prevCount + 1;

    // Check for Mala completed
    if (nextCount > 0 && nextCount % 108 === 0) {
      const currentCompletedCount = Math.floor(nextCount / 108);
      setCompletionMsg(`🎉 Completed ${currentCompletedCount} Mala!`);
      setTimeout(() => setCompletionMsg(null), 3500);
    }

    // Update local UI immediately (0ms latency feedback)
    setLocalTodayCount(nextCount);

    // Spawn beautiful floating devotions
    const elements = ['✨', '🌸', '🪔', '🧡', '🙏', '📿', '🌟'];
    const countToSpawn = 4;
    const spawned = Array.from({ length: countToSpawn }).map((_, idx) => ({
      id: Date.now() + Math.random() + idx,
      x: (Math.random() - 0.5) * 160,
      y: (Math.random() - 0.5) * 60,
      emoji: elements[Math.floor(Math.random() * elements.length)],
      angle: (Math.random() - 0.5) * 50,
      delay: Math.random() * 0.08
    }));
    setParticles(prev => [...prev, ...spawned].slice(-24));

    // Queue sync to firestore
    queueSync(user.uid, 1);
  };

  // Computed data from real-time database record
  const resolvedStats = useMemo(() => {
    if (!dbData) return {
      todayCount: 0,
      todayMala: 0,
      lifetimeCount: 0,
      lifetimeMala: 0,
      currentStreak: 0,
      longestStreak: 0,
    };

    const isToday = dbData.lastActiveDate === dateStr;

    // Use localTodayCount as primary so it updates in real time, but fallback to DB
    const displayTodayCount = localTodayCount;
    const displayTodayMala = Math.floor(displayTodayCount / 108);

    // Calculate lifetime based on current local pending additions to ensure real-time accuracy
    const displayLifetimeCount = (dbData.lifetimeCount || 0) + (displayTodayCount - (isToday ? (dbData.todayCount || 0) : 0));
    const displayLifetimeMala = Math.floor(displayLifetimeCount / 108);

    return {
      todayCount: displayTodayCount,
      todayMala: displayTodayMala,
      lifetimeCount: displayLifetimeCount,
      lifetimeMala: displayLifetimeMala,
      currentStreak: dbData.currentStreak || 0,
      longestStreak: dbData.longestStreak || 0,
    };
  }, [dbData, dateStr, localTodayCount]);

  // Friendly formatting of last updated time
  const lastUpdatedStr = useMemo(() => {
    if (!dbData) return "Never";
    const ts = dbData.updatedAt || dbData.lastTapAt;
    if (!ts) return "Just now";
    
    let dateObj: Date;
    if (ts.toDate) {
      dateObj = ts.toDate();
    } else if (ts.seconds) {
      dateObj = new Date(ts.seconds * 1000);
    } else {
      dateObj = new Date(ts);
    }
    
    if (isNaN(dateObj.getTime())) return "Just now";
    
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  }, [dbData]);

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-950 transition-colors pb-24">
      <SEO title="Naam Jap Sadhana | Hari Pathshala" description="Continue today's Naam Jap and track your spiritual progress." />
      
      {/* 1. STICKY GLASS HEADER */}
      <header className="pt-12 pb-4 px-6 sticky top-0 z-20 flex justify-between items-center bg-orange-50/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-orange-100/30 dark:border-slate-900/40">
        <div className="flex items-center gap-3">
          <button onClick={() => goBack()} className="p-2 bg-white dark:bg-slate-800 rounded-full text-brown-dark dark:text-white shadow-sm border border-orange-100 dark:border-slate-700 transition active:scale-95 cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold font-sans text-brown-dark dark:text-white leading-tight">Naam Jap</h1>
            <p className="text-[10px] text-saffron-dark font-bold font-sans tracking-wide uppercase">Naam Jap Sadhana</p>
          </div>
        </div>
      </header>

      <div className="px-5 space-y-5 max-w-xl mx-auto mt-4">
        
        {/* COMPLETION FLOATING TOAST */}
        <AnimatePresence>
          {completionMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-full shadow-lg font-bold text-sm flex items-center gap-2"
            >
              <Sparkles size={16} className="animate-spin" />
              <span>{completionMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* 2. PREMIUM MAIN DEVOTIONAL TAP CARD */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-orange-100 dark:border-slate-850 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-50/30 via-transparent to-transparent dark:from-orange-950/5 pointer-events-none"></div>
          
          <p className="text-[10px] font-extrabold text-saffron-dark dark:text-saffron uppercase tracking-widest mb-3">Today's Devotion</p>
          
          {/* Progress indicators */}
          <div className="text-center mb-5">
            <span className="text-4xl font-black text-brown-dark dark:text-white font-sans tracking-tight block">
              {beadCount} / 108
            </span>
            <span className="text-[10px] font-bold text-brown-light dark:text-slate-400 uppercase tracking-wider block mt-1">
              Progress: {progressPercentage}%
            </span>
          </div>

          {/* 3. CHANTING INTERACTIVE PROGRESS CIRCLE */}
          <div className="relative w-48 h-48 flex items-center justify-center my-2">
            <svg className="absolute w-full h-full -rotate-90">
              {/* Tracker Track */}
              <circle
                cx="96"
                cy="96"
                r={radius}
                className="stroke-orange-50 dark:stroke-slate-800"
                strokeWidth="8"
                fill="transparent"
              />
              {/* Dynamic Progress Stroke */}
              <motion.circle
                cx="96"
                cy="96"
                r={radius}
                className="stroke-saffron"
                strokeWidth="8"
                strokeLinecap="round"
                fill="transparent"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset }}
                transition={{ type: "spring", stiffness: 60, damping: 15 }}
              />
            </svg>

            {/* Spiritual Particles Overlay */}
            <AnimatePresence>
              {particles.map((p) => (
                <motion.span
                  key={p.id}
                  initial={{ opacity: 1, scale: 0.2, x: 0, y: 0, rotate: 0 }}
                  animate={{ 
                    opacity: [1, 1, 0], 
                    scale: [0.5, 1.4, 0.8], 
                    x: p.x, 
                    y: -140 + p.y, 
                    rotate: p.angle * 5 
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: p.delay }}
                  onAnimationComplete={() => {
                    setParticles(prev => prev.filter(item => item.id !== p.id));
                  }}
                  className="absolute text-xl pointer-events-none select-none z-30"
                >
                  {p.emoji}
                </motion.span>
              ))}
            </AnimatePresence>

            {/* Tap Button Bead */}
            <motion.button 
              whileTap={{ scale: 0.92 }}
              onClick={handleChant}
              animate={{ scale: pulseBead ? 1.08 : 1 }}
              className="w-34 h-34 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-xl flex flex-col items-center justify-center border-4 border-amber-500 focus:outline-none relative z-10 transition-shadow cursor-pointer animate-none"
            >
              <span className="text-3xl font-devanagari select-none">🟤</span>
              <span className="text-xs font-sans font-black tracking-wider uppercase mt-1 select-none">TAP BEAD</span>
            </motion.button>
          </div>

          <p className="text-xs text-brown-light dark:text-slate-400 font-medium font-sans select-none mt-4">
            राम-नाम का स्मरण करें। हर बार माला फेरने पर टैप करें।
          </p>
        </div>

        {/* 4. STATISTICS DISPLAY PANEL (CONTAINING EXACTLY THE 7 REQUESTED STATS) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-orange-100 dark:border-slate-850 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-orange-100/50 dark:border-slate-800 pb-2.5">
            <Activity size={16} className="text-saffron" />
            <h3 className="text-xs font-black uppercase tracking-wider text-brown-dark dark:text-white">Naam Jap Statistics</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* 1. Today's Beads */}
            <div className="bg-orange-50/30 dark:bg-slate-950/40 p-4 rounded-2xl border border-orange-100/10">
              <span className="text-[10px] font-extrabold text-brown-light dark:text-slate-400 uppercase tracking-wider block">Today's Beads</span>
              <span className="text-xl font-black text-brown-dark dark:text-white font-sans block mt-1">
                {resolvedStats.todayCount.toLocaleString()}
              </span>
            </div>

            {/* 2. Today's Mala (Auto Calculated) */}
            <div className="bg-orange-50/30 dark:bg-slate-950/40 p-4 rounded-2xl border border-orange-100/10">
              <span className="text-[10px] font-extrabold text-brown-light dark:text-slate-400 uppercase tracking-wider block">Today's Mala</span>
              <span className="text-xl font-black text-saffron dark:text-saffron-light font-sans block mt-1">
                {resolvedStats.todayMala}
              </span>
            </div>

            {/* 3. Lifetime Beads */}
            <div className="bg-orange-50/30 dark:bg-slate-950/40 p-4 rounded-2xl border border-orange-100/10">
              <span className="text-[10px] font-extrabold text-brown-light dark:text-slate-400 uppercase tracking-wider block">Lifetime Beads</span>
              <span className="text-xl font-black text-brown-dark dark:text-white font-sans block mt-1">
                {resolvedStats.lifetimeCount.toLocaleString()}
              </span>
            </div>

            {/* 4. Lifetime Mala (Auto Calculated) */}
            <div className="bg-orange-50/30 dark:bg-slate-950/40 p-4 rounded-2xl border border-orange-100/10">
              <span className="text-[10px] font-extrabold text-brown-light dark:text-slate-400 uppercase tracking-wider block">Lifetime Mala</span>
              <span className="text-xl font-black text-saffron dark:text-saffron-light font-sans block mt-1">
                {resolvedStats.lifetimeMala}
              </span>
            </div>

            {/* 5. Current Streak */}
            <div className="bg-orange-50/30 dark:bg-slate-950/40 p-4 rounded-2xl border border-orange-100/10">
              <span className="text-[10px] font-extrabold text-brown-light dark:text-slate-400 uppercase tracking-wider block">Current Streak</span>
              <span className="text-xl font-black text-red-600 dark:text-red-400 font-sans block mt-1">
                🔥 {resolvedStats.currentStreak} Days
              </span>
            </div>

            {/* 6. Longest Streak */}
            <div className="bg-orange-50/30 dark:bg-slate-950/40 p-4 rounded-2xl border border-orange-100/10">
              <span className="text-[10px] font-extrabold text-brown-light dark:text-slate-400 uppercase tracking-wider block">Longest Streak</span>
              <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-sans block mt-1">
                🏆 {resolvedStats.longestStreak} Days
              </span>
            </div>
          </div>

          {/* 7. Last Updated */}
          <div className="bg-orange-50/30 dark:bg-slate-950/40 p-4 rounded-2xl border border-orange-100/10 flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-brown-light dark:text-slate-400 uppercase tracking-wider">Last Updated</span>
            <span className="text-xs font-black text-neutral-600 dark:text-neutral-300 font-mono">
              📅 {lastUpdatedStr}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
