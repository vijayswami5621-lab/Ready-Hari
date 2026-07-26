import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useAppStore } from "../../store/useAppStore";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import { useAuthStore } from "../../store/useAuthStore";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/config";
import { syncTodayPanchang, getDeviceLocation } from "../../services/panchangService";

export const SplashScreen = () => {
  const { setSplashComplete } = useAppStore();
  const { settings, loading: settingsLoading } = useAppSettings();
  const { isLoading: authLoading, user } = useAuthStore();

  const preloadAppContent = async (userId?: string) => {
    // Detect location automatically
    const detectedLocation = await getDeviceLocation();
    
    const preloadCollection = async (collectionName: string) => {
      try {
        const snap = await getDocs(collection(db, collectionName));
        const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (items.length > 0) {
          localStorage.setItem(`hp_cache_${collectionName}_[]`, JSON.stringify(items));
        }
      } catch (e) {
        console.warn(`Preloading collection ${collectionName} failed:`, e);
      }
    };

    const collectionsToPreload = [
      "quotes",
      "dohas",
      "videos",
      "categories",
      "products",
      "quiz_subjects",
      "quiz_quizzes",
      "quiz_global_leaderboard",
      "homepage_sections",
      "navigation",
      "blogs",
      "events",
      "testimonials",
      "app_settings"
    ];

    const tasks: Promise<any>[] = [
      syncTodayPanchang(detectedLocation).catch(e => console.warn("Panchang sync during splash failed:", e)),
      ...collectionsToPreload.map(col => preloadCollection(col))
    ];

    if (userId) {
      tasks.push(
        getDoc(doc(db, "userStats", userId))
          .then((snap) => {
            if (snap.exists()) {
              localStorage.setItem(`hp_cache_userStats_${userId}`, JSON.stringify(snap.data()));
            }
          })
          .catch((e) => console.warn("UserStats prefetch failed:", e)),
        getDoc(doc(db, "naamJap", userId))
          .then((snap) => {
            if (snap.exists()) {
              localStorage.setItem(`hp_cache_naamJap_${userId}`, JSON.stringify(snap.data()));
            }
          })
          .catch((e) => console.warn("NaamJap prefetch failed:", e)),
        getDocs(collection(db, "userStats", userId, "certificates"))
          .then((snap) => {
            const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            localStorage.setItem(`hp_cache_certificates_${userId}`, JSON.stringify(items));
          })
          .catch((e) => console.warn("Certificates prefetch failed:", e)),
        getDocs(collection(db, "userStats", userId, "achievements"))
          .then((snap) => {
            const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            localStorage.setItem(`hp_cache_achievements_${userId}`, JSON.stringify(items));
          })
          .catch((e) => console.warn("Achievements prefetch failed:", e)),
        getDocs(collection(db, "userStats", userId, "quiz_progress"))
          .then((snap) => {
            const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            localStorage.setItem(`hp_cache_quiz_progress_${userId}`, JSON.stringify(items));
          })
          .catch((e) => console.warn("Quiz progress prefetch failed:", e)),
        getDocs(collection(db, "userStats", userId, "quiz_history"))
          .then((snap) => {
            const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            localStorage.setItem(`hp_cache_quiz_history_${userId}`, JSON.stringify(items));
          })
          .catch((e) => console.warn("Quiz history prefetch failed:", e))
      );
    }
    
    await Promise.all(tasks);
  };

  const [isExiting, setIsExiting] = useState(false);
  interface Particle {
    id: number;
    x: number;
    size: number;
    delay: number;
    duration: number;
  }
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate glowing spiritual particles
    const generated: Particle[] = Array.from({ length: 22 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percentage x-axis
      size: Math.random() * 4 + 3, // 3px to 7px
      delay: Math.random() * 2,
      duration: Math.random() * 3 + 4, // 4s to 7s
    }));
    setParticles(generated);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const performPreload = async () => {
      const startTime = Date.now();
      
      const preloadPromise = (async () => {
        try {
          // 1. Wait for settings context and auth to finish loading
          let checks = 0;
          while ((settingsLoading || authLoading) && checks < 20) {
            if (!isMounted) return;
            await new Promise((resolve) => setTimeout(resolve, 50));
            checks++;
          }

          // 2. Preload app content and user stats in parallel
          const currentUserId = user?.uid || auth.currentUser?.uid;
          await preloadAppContent(currentUserId);
        } catch (err) {
          console.warn("Preload error ignored:", err);
        }
      })();

      // Wait for preloading
      await preloadPromise;

      // Force minimum duration of 2.6 seconds so users can experience the divine animations
      const elapsed = Date.now() - startTime;
      const minDuration = 2600;
      if (elapsed < minDuration) {
        await new Promise((resolve) => setTimeout(resolve, minDuration - elapsed));
      }

      if (isMounted) {
        setIsExiting(true);
      }
    };

    performPreload();

    return () => {
      isMounted = false;
    };
  }, [settingsLoading, authLoading, user]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ 
        opacity: isExiting ? 0 : 1,
        y: isExiting ? -30 : 0
      }}
      transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
      onAnimationComplete={() => {
        if (isExiting) {
          setSplashComplete(true);
        }
      }}
      className="fixed inset-0 z-50 flex flex-col justify-between bg-gradient-to-b from-[#1F0700] via-[#5C1A00] to-[#993300] text-white overflow-hidden select-none"
    >
      {/* Sacred Glow Particles floating upwards */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ y: "105vh", x: `${p.x}vw`, opacity: 0 }}
            animate={{ 
              y: "-10vh",
              opacity: [0, 0.7, 0.7, 0],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute rounded-full bg-gradient-to-tr from-amber-300 to-yellow-100 shadow-[0_0_8px_rgba(253,224,71,0.6)]"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
            }}
          />
        ))}
      </div>

      {/* Decorative ambient light rays rotating behind */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-25">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="w-[180%] h-[180%] bg-[radial-gradient(circle,rgba(251,191,36,0.15)_0%,transparent_60%)] flex items-center justify-center"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <div 
              key={i} 
              className="absolute w-1 md:w-2 h-full bg-gradient-to-t from-transparent via-amber-400/10 to-transparent"
              style={{ transform: `rotate(${i * 30}deg)` }}
            />
          ))}
        </motion.div>
      </div>

      {/* Temple bell Left */}
      <motion.div 
        className="absolute left-[8%] top-0 origin-top flex flex-col items-center pointer-events-none z-10"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
        animate={{ rotate: [-4, 4, -4] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-[1.5px] h-20 md:h-28 bg-gradient-to-b from-amber-700 via-yellow-500 to-amber-300" />
        <svg className="w-10 h-10 text-yellow-400 drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a3 3 0 0 0-3 3v1.17c-1.74.52-3 2.1-3 4v5.33l-1.33 2.67A1 1 0 0 0 5.56 19h12.88a1 1 0 0 0 .89-1.5l-1.33-2.67V10.17c0-1.9-1.26-3.48-3-4V5a3 3 0 0 0-3-3zm0 19a3 3 0 0 1-3-3h6a3 3 0 0 1-3 3z" />
        </svg>
      </motion.div>

      {/* Temple bell Right */}
      <motion.div 
        className="absolute right-[8%] top-0 origin-top flex flex-col items-center pointer-events-none z-10"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
        animate={{ rotate: [4, -4, 4] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
      >
        <div className="w-[1.5px] h-24 md:h-36 bg-gradient-to-b from-amber-700 via-yellow-500 to-amber-300" />
        <svg className="w-11 h-11 text-yellow-400 drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a3 3 0 0 0-3 3v1.17c-1.74.52-3 2.1-3 4v5.33l-1.33 2.67A1 1 0 0 0 5.56 19h12.88a1 1 0 0 0 .89-1.5l-1.33-2.67V10.17c0-1.9-1.26-3.48-3-4V5a3 3 0 0 0-3-3zm0 19a3 3 0 0 1-3-3h6a3 3 0 0 1-3 3z" />
        </svg>
      </motion.div>

      {/* Main content - perfectly centered vertically and safe layout */}
      <div 
        className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 text-center"
        style={{
          paddingTop: "calc(max(3rem, env(safe-area-inset-top)) + 1rem)",
          paddingBottom: "calc(max(3rem, env(safe-area-inset-bottom)) + 1rem)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ 
            opacity: 1, 
            scale: [1, 1.04, 1],
          }}
          transition={{
            opacity: { duration: 1.2, ease: "easeOut" },
            scale: { duration: 5, repeat: Infinity, ease: "easeInOut" }
          }}
          className="relative mb-6 mt-8 md:mt-12"
        >
          {/* Subtle divine golden glow behind logo */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 blur-2xl opacity-45 animate-pulse" />
          <div className="w-32 h-32 md:w-36 md:h-36 bg-white rounded-full flex items-center justify-center shadow-[0_12px_40px_rgba(0,0,0,0.35)] border-4 border-yellow-400/90 overflow-hidden p-1.5 relative z-10">
            <img
              src="/logo.png"
              alt="Hari Pathshala Logo"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
        </motion.div>
        
        {/* App Title */}
        <motion.h1
          initial={{ letterSpacing: "0.02em", opacity: 0, y: 15 }}
          animate={{ letterSpacing: "0.08em", opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 1, ease: "easeOut" }}
          className="text-4xl md:text-5xl font-extrabold tracking-wider mb-2 drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] bg-gradient-to-b from-white via-amber-50 to-yellow-100 bg-clip-text text-transparent font-serif"
        >
          हरि पाठशाला
        </motion.h1>
        
        {/* Sanskrit tagline */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="text-lg md:text-xl font-medium tracking-widest text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] mb-4 font-serif"
        >
          ज्ञान • भक्ति • संस्कार
        </motion.p>

        {/* Premium welcome line requested */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="text-sm md:text-base font-light italic text-orange-50 tracking-wider max-w-xs mx-auto drop-shadow-sm font-sans"
        >
          "Welcome to your spiritual journey"
        </motion.p>
      </div>

      {/* Temple silhouette at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 w-full pointer-events-none z-0 overflow-hidden">
        <svg className="w-full h-44 md:h-56 text-[#1A0500] fill-currentColor" viewBox="0 0 1000 300" preserveAspectRatio="none">
          {/* Background hills */}
          <path d="M0 250 Q150 215 300 240 T600 235 T900 248 T1000 260 L1000 300 L0 300 Z" opacity="0.3" />
          
          {/* Secondary Left shikhar */}
          <path d="M220 300 L220 200 Q250 160 270 200 L270 300 Z" opacity="0.6" />
          {/* Secondary Right shikhar */}
          <path d="M730 300 L730 200 Q750 160 770 200 L770 300 Z" opacity="0.6" />
          
          {/* Central Mandir structure */}
          {/* Main Spire (Shikhar) */}
          <path d="M410 300 L440 180 Q500 50 500 40 Q500 50 560 180 L590 300 Z" />
          {/* Kalash dome */}
          <circle cx="500" cy="30" r="5" />
          <path d="M500 25 L500 10" stroke="currentColor" strokeWidth="2" />
          {/* Sacred Saffron Flag */}
          <path d="M500 10 L530 16 L500 22 Z" fill="#FF6B00" />
          
          {/* Roof layers */}
          <path d="M380 300 L430 190 L570 190 L620 300 Z" opacity="0.85" />
          <path d="M420 190 L455 120 L545 120 L580 190 Z" opacity="0.95" />
          
          {/* Base slab */}
          <rect x="0" y="275" width="1000" height="25" />
        </svg>
      </div>

      {/* Small footer brand signature */}
      <div 
        className="relative z-10 w-full text-center pb-4 text-xs font-mono tracking-widest text-amber-500/50"
        style={{ paddingBottom: "calc(max(1rem, env(safe-area-inset-bottom)) + 0.5rem)" }}
      >
        HARI PATHSHALA • v1.0.0
      </div>
    </motion.div>
  );
};
