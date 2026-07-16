import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { 
  ArrowLeft, Trophy, Award, BookOpen, Star, Flame, Clock, 
  Sparkles, ShieldCheck, HelpCircle 
} from 'lucide-react';
import { motion } from 'motion/react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export const PublicUserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [globalRank, setGlobalRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Android Back button listener support
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const backListener = CapacitorApp.addListener('backButton', () => {
      navigate('/quiz/leaderboard');
    });
    return () => {
      backListener.then(l => l.remove());
    };
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);

    const loadProfile = async () => {
      try {
        // 1. Fetch user's public stats
        const statsRef = doc(db, 'userStats', userId);
        const statsSnap = await getDoc(statsRef);
        if (statsSnap.exists()) {
          setProfileData(statsSnap.data());
        } else {
          // Try fetching from the global leaderboard fallback
          const leadRef = doc(db, 'quiz_global_leaderboard', userId);
          const leadSnap = await getDoc(leadRef);
          if (leadSnap.exists()) {
            const data = leadSnap.data();
            setProfileData({
              quizAllTimeScore: data.score || 0,
              quizTotalXP: data.xp || 0,
              quizTotalPlayed: data.totalQuizzes || 0,
              quizTotalCorrect: data.correctAnswers || 0,
              quizTotalWrong: data.wrongAnswers || 0,
              quizTotalSkipped: data.skippedQuestions || 0,
              quizAccuracy: data.accuracy || 0,
              quizStreak: data.currentStreak || 0,
              quizLongestStreak: data.longestStreak || 1,
              badges: data.badges || [],
              userName: data.userName || 'Devotee',
              profileImage: data.profileImage || ''
            });
          }
        }

        // 2. Fetch Achievements
        const achsRef = collection(db, 'userStats', userId, 'achievements');
        const achsSnap = await getDocs(achsRef);
        const achList: any[] = [];
        achsSnap.forEach(docSnap => {
          achList.push({ id: docSnap.id, ...docSnap.data() });
        });
        setAchievements(achList);

        // 3. Fetch Certificates
        const certsRef = collection(db, 'userStats', userId, 'certificates');
        const certsSnap = await getDocs(certsRef);
        const certList: any[] = [];
        certsSnap.forEach(docSnap => {
          certList.push({ id: docSnap.id, ...docSnap.data() });
        });
        setCertificates(certList);

        // 4. Determine Global Rank dynamically
        const allLeadSnap = await getDocs(collection(db, 'quiz_global_leaderboard'));
        const items: any[] = [];
        allLeadSnap.forEach(docSnap => {
          items.push({ id: docSnap.id, ...docSnap.data() });
        });

        const sorted = [...items].sort((a, b) => {
          if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
          if ((b.accuracy || 0) !== (a.accuracy || 0)) return (b.accuracy || 0) - (a.accuracy || 0);
          if ((b.correctAnswers || 0) !== (a.correctAnswers || 0)) return (b.correctAnswers || 0) - (a.correctAnswers || 0);
          if ((a.wrongAnswers || 0) !== (b.wrongAnswers || 0)) return (a.wrongAnswers || 0) - (b.wrongAnswers || 0);
          const avgTimeA = (a.totalTimeTaken || 0) / (a.totalQuizzes || 1);
          const avgTimeB = (b.totalTimeTaken || 0) / (b.totalQuizzes || 1);
          if (avgTimeA !== avgTimeB) return avgTimeA - avgTimeB;
          return (b.longestStreak || 0) - (a.longestStreak || 0);
        });

        const idx = sorted.findIndex(item => item.id === userId);
        if (idx !== -1) {
          setGlobalRank(idx + 1);
        }

      } catch (err) {
        console.error("Error loading public profile details:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  const getAvatar = (photoURL?: string, name?: string) => {
    if (photoURL && photoURL.trim().length > 0) return photoURL;
    const initials = (name || 'Devotee').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:%23f97316;stop-opacity:1" />
          <stop offset="100%" style="stop-color:%23eab308;stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(%23avatarGrad)" stroke="%23fef08a" stroke-width="2"/>
      <text x="50%" y="54%" font-family="'Inter', sans-serif" font-weight="800" font-size="32" fill="%23ffffff" dominant-baseline="middle" text-anchor="middle">
        ${initials}
      </text>
    </svg>`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-orange-50/10 dark:bg-slate-950">
        <div className="w-10 h-10 border-4 border-saffron border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-neutral-500 mt-3 font-bold">Unlocking devotee profile...</p>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-orange-50/10 dark:bg-slate-950 p-6 flex flex-col items-center justify-center text-center">
        <HelpCircle size={48} className="text-orange-400 mb-2" />
        <h2 className="text-lg font-bold text-brown-dark dark:text-white">Profile Not Found</h2>
        <p className="text-xs text-neutral-500 max-w-xs mt-1">This user has not completed any quizzes yet or does not exist.</p>
        <button
          onClick={() => navigate('/quiz/leaderboard')}
          className="mt-4 px-5 py-2 bg-saffron text-white text-xs font-bold rounded-xl"
        >
          Back to Leaderboard
        </button>
      </div>
    );
  }

  const name = profileData.userName || 'Spiritual Devotee';
  const imgUrl = getAvatar(profileData.profileImage, name);
  const score = profileData.quizAllTimeScore || 0;
  const xp = profileData.quizTotalXP || 0;
  const totalQuizzes = profileData.quizTotalPlayed || 0;
  const correct = profileData.quizTotalCorrect || 0;
  const wrong = profileData.quizTotalWrong || 0;
  const skipped = profileData.quizTotalSkipped || 0;
  const accuracy = profileData.quizAccuracy || 0;
  const streak = profileData.quizStreak || 0;
  const longestStreak = profileData.quizLongestStreak || 1;
  const badges = profileData.badges || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/10 to-neutral-50 dark:from-slate-900 dark:to-slate-950 text-neutral-800 dark:text-neutral-100 pb-16">
      
      {/* AppBar navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-orange-100/50 dark:border-slate-800/50 py-4 px-4 flex items-center justify-between shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold text-brown-light hover:text-brown-dark dark:text-slate-400 dark:hover:text-white transition"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="font-sans font-extrabold text-sm text-brown-dark dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
          ⚜ Devotee Public Profile
        </h1>
        <div className="w-16" />
      </nav>

      {/* Main Body */}
      <main className="max-w-3xl mx-auto px-4 pt-20 space-y-6">
        
        {/* Profile Card Header */}
        <div className="bg-white dark:bg-slate-900 border border-orange-100/60 dark:border-slate-850 p-6 rounded-[32px] text-center shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/5 to-transparent pointer-events-none rounded-full" />
          
          <div className="relative w-24 h-24 mx-auto mb-3">
            <img 
              src={imgUrl} 
              alt={name} 
              className="w-24 h-24 rounded-full object-cover border-4 border-amber-100/80 shadow-md mx-auto"
            />
            {globalRank && globalRank <= 3 && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-3xl">👑</span>
            )}
          </div>

          <h2 className="text-xl font-sans font-extrabold text-brown-dark dark:text-white flex items-center justify-center gap-1.5 leading-tight">
            {name}
            <ShieldCheck size={18} className="text-green-500 fill-green-500/10" />
          </h2>

          <div className="flex flex-wrap gap-1.5 justify-center mt-2.5">
            {globalRank && (
              <span className="bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                🏆 Rank #{globalRank}
              </span>
            )}
            <span className="bg-orange-50 dark:bg-slate-800 text-brown-dark dark:text-amber-400 text-[10px] font-black px-3 py-1 rounded-full uppercase">
              🔥 Streak: {streak} Days
            </span>
          </div>

          {/* Badges container */}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center mt-4 border-t border-orange-50 dark:border-slate-800/60 pt-4">
              {badges.map((badge: string, bIdx: number) => (
                <span key={bIdx} className="bg-amber-50 dark:bg-slate-850 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-3 py-1 rounded-lg border border-amber-100/50">
                  🏅 {badge}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Realtime Statistics Single Summary Grid */}
        <div className="bg-white dark:bg-slate-900 border border-orange-100/60 dark:border-slate-850 p-6 rounded-[32px] shadow-sm space-y-4">
          <h3 className="font-sans font-bold text-sm text-brown-dark dark:text-slate-200 flex items-center gap-1.5">
            📊 Devotee Spiritual Stats
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            
            <div className="p-3 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-orange-50/20 text-center">
              <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">All-Time Score</span>
              <span className="text-lg font-black text-saffron mt-1 block">{score} Pts</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-orange-50/20 text-center">
              <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">Total XP</span>
              <span className="text-lg font-black text-amber-500 mt-1 block">{xp} XP</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-orange-50/20 text-center">
              <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">Overall Accuracy</span>
              <span className="text-lg font-black text-green-500 mt-1 block">{accuracy}%</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-orange-50/20 text-center">
              <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">Quizzes Attempted</span>
              <span className="text-lg font-black text-brown-dark dark:text-white mt-1 block">{totalQuizzes}</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-orange-50/20 text-center">
              <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">Correct Answers</span>
              <span className="text-lg font-black text-emerald-600 mt-1 block">{correct}</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-orange-50/20 text-center">
              <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">Longest Streak</span>
              <span className="text-lg font-black text-amber-500 mt-1 block">{longestStreak} Days</span>
            </div>
          </div>
        </div>

        {/* Achievements Earned List */}
        <div className="bg-white dark:bg-slate-900 border border-orange-100/60 dark:border-slate-850 p-6 rounded-[32px] shadow-sm space-y-4">
          <h3 className="font-sans font-bold text-sm text-brown-dark dark:text-slate-200 flex items-center gap-1.5">
            🏆 Achievements Earned ({achievements.length})
          </h3>
          {achievements.length === 0 ? (
            <p className="text-xs text-neutral-400 text-center py-4">No achievements unlocked yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {achievements.map((ach) => (
                <div key={ach.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                    <Award size={20} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-brown-dark dark:text-white truncate">{ach.name}</h4>
                    <p className="text-[10px] text-neutral-500 truncate mt-0.5">{ach.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Certificates Section */}
        <div className="bg-white dark:bg-slate-900 border border-orange-100/60 dark:border-slate-850 p-6 rounded-[32px] shadow-sm space-y-4">
          <h3 className="font-sans font-bold text-sm text-brown-dark dark:text-slate-200 flex items-center gap-1.5">
            🎓 Earned Certificates ({certificates.length})
          </h3>
          {certificates.length === 0 ? (
            <p className="text-xs text-neutral-400 text-center py-4">No certificate of wisdom earned yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {certificates.map((cert) => (
                <div key={cert.id} className="p-3.5 bg-gradient-to-br from-amber-50 to-white dark:from-slate-950 dark:to-slate-900 rounded-2xl border border-amber-200/50 flex flex-col justify-between h-28">
                  <div>
                    <h4 className="font-sans font-bold text-xs text-amber-900 dark:text-amber-300 truncate">{cert.quizName || 'Wisdom Certificate'}</h4>
                    <span className="text-[9px] uppercase font-bold text-amber-700 bg-amber-100 dark:bg-slate-800 dark:text-amber-400 px-2 py-0.5 rounded mt-1.5 inline-block">
                      {cert.subjectName || 'Spiritual'}
                    </span>
                  </div>
                  <div className="flex justify-between items-end border-t border-orange-100/30 pt-2 text-[10px] text-neutral-500">
                    <span>Score: <strong>{cert.score}%</strong></span>
                    <span>Earned {new Date(cert.completedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
};
