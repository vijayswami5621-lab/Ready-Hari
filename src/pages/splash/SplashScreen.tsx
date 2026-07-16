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

  useEffect(() => {
    let isMounted = true;

    const performPreload = async () => {
      // Set a hard maximum timeout of 2000ms (2 seconds)
      const maxTimeout = new Promise((resolve) => setTimeout(resolve, 2000));

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

      // Wait for either preloading to finish or the 2.0s maximum timer
      await Promise.race([preloadPromise, maxTimeout]);

      if (isMounted) {
        setSplashComplete(true);
      }
    };

    performPreload();

    return () => {
      isMounted = false;
    };
  }, [settingsLoading, authLoading, user, setSplashComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-orange-500 via-[#FF6B00] to-[#CC5200] text-white overflow-hidden">
      {/* Decorative ambient glowing orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-300/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="flex flex-col items-center p-4 max-w-sm text-center relative z-10"
      >
        {/* Logo Container with rotating pulse ring */}
        <div className="relative mb-8">
          <motion.div 
            className="absolute inset-0 rounded-full bg-white/20 blur-md"
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-4 border-white/90 overflow-hidden p-1 relative z-10">
            <img
              src="/logo.png"
              alt="Hari Pathshala Logo"
              className="w-full h-full object-contain rounded-full"
            />
          </div>
        </div>
        
        {/* App Title */}
        <motion.h1
          initial={{ letterSpacing: "0.05em", opacity: 0 }}
          animate={{ letterSpacing: "0.1em", opacity: 1 }}
          transition={{ delay: 0.3, duration: 1 }}
          className="text-4xl font-extrabold font-devanagari tracking-wider mb-2 drop-shadow-lg text-amber-50"
        >
          हरि पाठशाला
        </motion.h1>
        
        {/* App Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          transition={{ delay: 0.6, duration: 1 }}
          className="text-lg font-mukta font-medium tracking-widest text-orange-100 drop-shadow-md mb-2"
        >
          भक्ति • प्रेम • श्री सीताराम
        </motion.p>

        {/* Version label in footer */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1, duration: 1 }}
          className="text-xs font-mono tracking-widest uppercase mt-4 block"
        >
          v1.0.0
        </motion.span>
      </motion.div>
    </div>
  );
};
