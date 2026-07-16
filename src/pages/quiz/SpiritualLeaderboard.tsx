import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { 
  Trophy, ArrowLeft, Search, Star, Flame, Sparkles, Activity, ShieldAlert, Crown, ArrowUpRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { getISTDateInfo } from '../../services/naamJapService';

export const SpiritualLeaderboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [leaderboardType, setLeaderboardType] = useState<'quiz' | 'naam_jap'>('quiz');
  
  // Dynamic static fallback generator
  const fallbackData = useMemo(() => {
    const { dateStr, weekStr, monthStr, yearStr } = getISTDateInfo();
    const globalList = [
      { id: 'devotee_arjun', userId: 'devotee_arjun', userName: 'Arjuna (अर्जुन)', score: 980, xp: 9800, accuracy: 98, currentStreak: 12, longestStreak: 15, overallScore: 980, overallAccuracy: 98, totalXP: 9800, profileImage: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=150&q=80', completedAt: new Date().toISOString() },
      { id: 'devotee_vidur', userId: 'devotee_vidur', userName: 'Vidura (विदुर)', score: 850, xp: 8500, accuracy: 92, currentStreak: 8, longestStreak: 10, overallScore: 850, overallAccuracy: 92, totalXP: 8500, profileImage: 'https://images.unsplash.com/photo-1590073844006-33379778ae09?auto=format&fit=crop&w=150&q=80', completedAt: new Date().toISOString() },
      { id: 'devotee_radha', userId: 'devotee_radha', userName: 'Radha Priya (राधा प्रिया)', score: 720, xp: 7200, accuracy: 95, currentStreak: 15, longestStreak: 20, overallScore: 720, overallAccuracy: 95, totalXP: 7200, profileImage: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?auto=format&fit=crop&w=150&q=80', completedAt: new Date().toISOString() },
      { id: 'devotee_sadhak', userId: 'devotee_sadhak', userName: 'Sadhak (साधक)', score: 540, xp: 5400, accuracy: 88, currentStreak: 5, longestStreak: 7, overallScore: 540, overallAccuracy: 88, totalXP: 5400, profileImage: '', completedAt: new Date().toISOString() }
    ];

    if (user) {
      try {
        const cached = localStorage.getItem(`hp_cache_userStats_${user.uid}`);
        if (cached) {
          const uStats = JSON.parse(cached);
          globalList.push({
            id: user.uid,
            userId: user.uid,
            userName: user.displayName || 'You (आप)',
            score: uStats.quizAllTimeScore || 0,
            xp: uStats.quizTotalXP || 0,
            accuracy: uStats.quizAccuracy || 100,
            currentStreak: uStats.quizStreak || 0,
            longestStreak: uStats.quizLongestStreak || 0,
            overallScore: uStats.quizAllTimeScore || 0,
            overallAccuracy: uStats.quizAccuracy || 100,
            totalXP: uStats.quizTotalXP || 0,
            profileImage: user.photoURL || '',
            completedAt: new Date().toISOString()
          });
        } else {
          globalList.push({
            id: user.uid,
            userId: user.uid,
            userName: user.displayName || 'You (आप)',
            score: 0,
            xp: 0,
            accuracy: 100,
            currentStreak: 0,
            longestStreak: 0,
            overallScore: 0,
            overallAccuracy: 100,
            totalXP: 0,
            profileImage: user.photoURL || '',
            completedAt: new Date().toISOString()
          });
        }
      } catch (e) {
        console.warn("Error parsing user stats for leaderboard fallback:", e);
      }
    }

    const naamJapList: any[] = [
      { id: 'devotee_arjun', userName: 'Arjuna (अर्जुन)', todayCount: 1080, todayMala: 10, weeklyCount: 7560, weeklyMala: 70, monthlyCount: 32400, monthlyMala: 300, lifetimeCount: 45000, lifetimeMala: 416, currentStreak: 12, longestStreak: 15, lastActiveDate: dateStr, lastActiveWeek: weekStr, lastActiveMonth: monthStr, lastActiveYear: yearStr, profileImage: '' },
      { id: 'devotee_vidur', userName: 'Vidura (विदुर)', todayCount: 540, todayMala: 5, weeklyCount: 3780, weeklyMala: 35, monthlyCount: 16200, monthlyMala: 150, lifetimeCount: 32000, lifetimeMala: 296, currentStreak: 8, longestStreak: 10, lastActiveDate: dateStr, lastActiveWeek: weekStr, lastActiveMonth: monthStr, lastActiveYear: yearStr, profileImage: '' },
      { id: 'devotee_radha', userName: 'Radha Priya (राधा प्रिया)', todayCount: 1620, todayMala: 15, weeklyCount: 11340, weeklyMala: 105, monthlyCount: 48600, monthlyMala: 450, lifetimeCount: 64000, lifetimeMala: 592, currentStreak: 15, longestStreak: 20, lastActiveDate: dateStr, lastActiveWeek: weekStr, lastActiveMonth: monthStr, lastActiveYear: yearStr, profileImage: '' }
    ];

    if (user) {
      try {
        const cached = localStorage.getItem(`hp_cache_naamJap_${user.uid}`);
        if (cached) {
          const nStats = JSON.parse(cached);
          const isToday = nStats.lastActiveDate === dateStr;
          naamJapList.push({
            id: user.uid,
            userName: user.displayName || 'You (आप)',
            todayCount: isToday ? (nStats.todayCount || 0) : 0,
            todayMala: isToday ? (nStats.todayMala || 0) : 0,
            weeklyCount: nStats.weeklyCount || 0,
            weeklyMala: nStats.weeklyMala || 0,
            monthlyCount: nStats.monthlyCount || 0,
            monthlyMala: nStats.monthlyMala || 0,
            lifetimeCount: nStats.lifetimeCount || 0,
            lifetimeMala: nStats.lifetimeMala || 0,
            currentStreak: nStats.currentStreak || 0,
            longestStreak: nStats.longestStreak || 0,
            lastActiveDate: nStats.lastActiveDate || dateStr,
            lastActiveWeek: nStats.lastActiveWeek || weekStr,
            lastActiveMonth: nStats.lastActiveMonth || monthStr,
            lastActiveYear: nStats.lastActiveYear || yearStr,
            profileImage: user.photoURL || ''
          });
        } else {
          naamJapList.push({
            id: user.uid,
            userName: user.displayName || 'You (आप)',
            todayCount: 0,
            todayMala: 0,
            weeklyCount: 0,
            weeklyMala: 0,
            monthlyCount: 0,
            monthlyMala: 0,
            lifetimeCount: 0,
            lifetimeMala: 0,
            currentStreak: 0,
            longestStreak: 0,
            lastActiveDate: dateStr,
            lastActiveWeek: weekStr,
            lastActiveMonth: monthStr,
            lastActiveYear: yearStr,
            profileImage: user.photoURL || ''
          });
        }
      } catch (e) {
        console.warn("Error parsing naam jap stats for leaderboard fallback:", e);
      }
    }

    return { globalList, naamJapList };
  }, [user]);

  // Quiz Leaderboard States
  const [globalEntries, setGlobalEntries] = useState<any[]>(fallbackData.globalList);
  const [quizCompletions, setQuizCompletions] = useState<any[]>(fallbackData.globalList);
  
  // Naam Jap Leaderboard States
  const [naamJapEntries, setNaamJapEntries] = useState<any[]>(fallbackData.naamJapList);
  
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [timeFilter, setTimeFilter] = useState<'all_time' | 'today' | 'this_week' | 'this_month'>('all_time');
  const [subjectFilter, setSubjectFilter] = useState<string>('global'); // 'global' or subjectId
  const [searchQuery, setSearchQuery] = useState('');

  // Android Back Button Support
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const backListener = CapacitorApp.addListener('backButton', () => {
      navigate('/quiz');
    });
    return () => {
      backListener.then(l => l.remove());
    };
  }, [navigate]);

  // Fetch real-time Quiz and Chanting datasets
  useEffect(() => {
    setLoading(true);

    const unsubGlobal = onSnapshot(collection(db, 'quiz_global_leaderboard'), (snap) => {
      const items: any[] = [];
      const seenUids = new Set<string>();
      snap.forEach(d => {
        const data = d.data();
        const uid = d.id || data.uid || data.userId;
        if (uid && !seenUids.has(uid)) {
          seenUids.add(uid);
          items.push({ id: uid, ...data });
        }
      });
      if (items.length > 0) {
        setGlobalEntries(items);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error loading global quiz stats:", err);
      setLoading(false);
    });

    const unsubCompletions = onSnapshot(collection(db, 'quiz_global_leaderboard'), (snap) => {
      const items: any[] = [];
      const seenUids = new Set<string>();
      snap.forEach(d => {
        const data = d.data();
        const uid = d.id || data.uid || data.userId;
        if (uid && !seenUids.has(uid)) {
          seenUids.add(uid);
          items.push({ id: uid, ...data });
        }
      });
      if (items.length > 0) {
        setQuizCompletions(items);
      }
    }, (err) => {
      console.error("Error loading quiz completions:", err);
    });

    const unsubNaamJap = onSnapshot(collection(db, 'naamJap'), (snap) => {
      const items: any[] = [];
      snap.forEach((d) => {
        items.push({ id: d.id, ...d.data() });
      });
      if (items.length > 0) {
        setNaamJapEntries(items);
      }
    }, (err) => {
      console.error("Error loading Naam Jap list:", err);
    });

    return () => {
      unsubGlobal();
      unsubCompletions();
      unsubNaamJap();
    };
  }, []);

  // Dynamic Ranking Engine for Quiz
  const rankedQuizEntries = useMemo(() => {
    let baseList: any[] = [];

    if (timeFilter === 'all_time' && subjectFilter === 'global') {
      baseList = globalEntries;
    } else {
      const userMap: Record<string, any> = {};

      quizCompletions.forEach(c => {
        if (subjectFilter !== 'global') {
          if (subjectFilter.startsWith('type_')) {
            const typeKey = subjectFilter.replace('type_', '');
            if (c.type !== typeKey) return;
          } else {
            if (c.subjectId !== subjectFilter && c.quizId !== subjectFilter) return;
          }
        }

        const now = new Date();
        const compDate = new Date(c.completedAt);
        if (timeFilter === 'today') {
          if (now.toLocaleDateString('en-CA') !== compDate.toLocaleDateString('en-CA')) return;
        } else if (timeFilter === 'this_week') {
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (compDate < oneWeekAgo) return;
        } else if (timeFilter === 'this_month') {
          const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (compDate < oneMonthAgo) return;
        }

        const uid = c.userId || c.uid;
        if (!uid) return;
        if (!userMap[uid]) {
          userMap[uid] = {
            userId: uid,
            userName: c.userName || c.displayName || 'Devotee',
            profileImage: c.profileImage || c.photoURL || '',
            score: 0,
            xp: 0,
            correctAnswers: 0,
            wrongAnswers: 0,
            skippedQuestions: 0,
            totalQuizzes: 0,
            totalTimeTaken: 0,
            longestStreak: 1,
            currentStreak: 1,
            completedAt: c.completedAt
          };
        }

        userMap[uid].score += (c.score || 0);
        userMap[uid].xp += (c.xp || 0);
        userMap[uid].correctAnswers += (c.correctCount || c.correctAnswers || 0);
        userMap[uid].wrongAnswers += (c.wrongCount || c.wrongAnswers || 0);
        userMap[uid].skippedQuestions += (c.skippedCount || c.skippedQuestions || 0);
        userMap[uid].totalQuizzes += 1;
        userMap[uid].totalTimeTaken += (c.timeTaken || 0);
        if (c.completedAt > userMap[uid].completedAt) {
          userMap[uid].completedAt = c.completedAt;
        }
      });

      baseList = Object.values(userMap).map((u: any) => {
        const totalQ = u.correctAnswers + u.wrongAnswers + u.skippedQuestions;
        u.accuracy = totalQ > 0 ? Math.round((u.correctAnswers / totalQ) * 100) : 0;
        
        const master = globalEntries.find(g => g.userId === u.userId || g.uid === u.userId);
        if (master) {
          u.longestStreak = master.longestStreak || 1;
          u.currentStreak = master.currentStreak || 1;
        }
        return u;
      });
    }

    const sorted = [...baseList].sort((a, b) => {
      const scoreA = a.overallScore || a.score || 0;
      const scoreB = b.overallScore || b.score || 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      
      const xpA = a.totalXP || a.xp || 0;
      const xpB = b.totalXP || b.xp || 0;
      if (xpB !== xpA) return xpB - xpA;
      
      return (a.totalTimeTaken || 0) - (b.totalTimeTaken || 0);
    });

    return sorted.map((entry, idx) => ({
      rank: idx + 1,
      userId: entry.userId || entry.id,
      userName: entry.userName || entry.displayName || 'Spiritual Aspirant',
      profileImage: entry.profileImage || entry.photoURL || '',
      score: entry.overallScore || entry.score || 0,
      xp: entry.totalXP || entry.xp || 0,
      accuracy: entry.overallAccuracy || entry.accuracy || 100,
      currentStreak: entry.currentStreak || 0,
      longestStreak: entry.longestStreak || 0,
      badge: getBadgeTitle(entry.overallScore || entry.score || 0)
    }));
  }, [globalEntries, quizCompletions, timeFilter, subjectFilter]);

  // Dynamic Ranking Engine for Naam Jap (Beads counts)
  const rankedNaamJapEntries = useMemo(() => {
    return [...naamJapEntries].map((entry) => {
      let activeCount = entry.lifetimeCount || 0;
      let activeMala = entry.lifetimeMala || 0;

      if (timeFilter === 'today') {
        activeCount = entry.todayCount || 0;
        activeMala = entry.todayMala || 0;
      } else if (timeFilter === 'this_week') {
        activeCount = entry.weeklyCount || 0;
        activeMala = entry.weeklyMala || 0;
      } else if (timeFilter === 'this_month') {
        activeCount = entry.monthlyCount || 0;
        activeMala = entry.monthlyMala || 0;
      }

      return {
        userId: entry.userId || entry.id,
        userName: entry.userName || 'Chanter (साधक)',
        profileImage: entry.profileImage || '',
        activeCount,
        activeMala,
        currentStreak: entry.currentStreak || 0,
        longestStreak: entry.longestStreak || 0,
        badge: getNaamJapBadge(activeCount)
      };
    }).sort((a, b) => b.activeCount - a.activeCount)
      .map((entry, idx) => ({ rank: idx + 1, ...entry }));
  }, [naamJapEntries, timeFilter]);

  // Derived filter logic for Search Box
  const filteredFinalEntries = useMemo(() => {
    const list = leaderboardType === 'quiz' ? rankedQuizEntries : rankedNaamJapEntries;
    if (!searchQuery.trim()) return list;
    return list.filter(e => e.userName.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [leaderboardType, rankedQuizEntries, rankedNaamJapEntries, searchQuery]);

  // Top 3 Podium Extraction
  const top3 = useMemo(() => filteredFinalEntries.slice(0, 3), [filteredFinalEntries]);
  const runnersUp = useMemo(() => filteredFinalEntries.slice(3), [filteredFinalEntries]);

  // Current user's standing statistics
  const myPosition = useMemo(() => {
    if (!user) return null;
    return filteredFinalEntries.find(e => e.userId === user.uid) || null;
  }, [filteredFinalEntries, user]);

  const getAvatar = (url: string, name: string) => {
    return url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
  };

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#2E241B] pb-32 font-sans select-none">
      
      {/* Header Banner */}
      <header className="relative pt-10 pb-20 px-6 bg-gradient-to-b from-[#FFF7ED] to-[#FFFDF8] border-b border-[#EFE7DB]/60 overflow-hidden shrink-0">
        <div className="absolute top-[-50px] right-[-50px] w-56 h-56 rounded-full bg-[#FF6B00]/5 border border-[#FF6B00]/10 flex items-center justify-center pointer-events-none animate-spin-slow">
          <div className="w-40 h-40 rounded-full border border-dashed border-[#FF6B00]/20" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate('/quiz')}
              className="flex items-center gap-2 bg-white hover:bg-[#FFF7ED] border border-[#EFE7DB] text-[#2E241B] px-4 py-2 rounded-2xl text-xs font-bold transition duration-300 shadow-sm"
            >
              <ArrowLeft size={14} className="text-[#FF6B00]" />
              <span>स्वाध्याय डैशबोर्ड</span>
            </button>
            
            <div className="flex items-center gap-2 bg-[#FF6B00]/10 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#FF6B00] border border-[#FF6B00]/20">
              <Star size={14} className="text-[#FF6B00] fill-[#FF6B00]" />
              <span className="font-mukta">साधना मार्ग</span>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#2E241B] flex items-center gap-3">
              <Trophy size={32} className="text-[#D4AF37]" /> Spiritual Standings
            </h1>
            <p className="text-[#786D63] text-xs md:text-sm max-w-xl font-mukta leading-relaxed">
              सच्चे ज्ञान और सतत साधना से युक्त साधकों की वैश्विक अंक तालिका। स्वाध्याय और नाम जप के माध्यम से उच्च सोपानों को प्राप्त करें।
            </p>
          </div>
        </div>
      </header>

      {/* Main Grid content */}
      <main className="max-w-4xl mx-auto px-4 -mt-10 relative z-20 space-y-6">
        
        {/* Double selector tabs: Quiz vs Naam Jap */}
        <div className="grid grid-cols-2 gap-2 bg-white p-1.5 rounded-[22px] border border-[#EFE7DB] shadow-sm">
          <button
            onClick={() => { setLeaderboardType('quiz'); setSubjectFilter('global'); }}
            className={`py-3.5 px-4 rounded-xl text-xs font-black transition duration-300 flex items-center justify-center gap-2 ${
              leaderboardType === 'quiz'
                ? 'bg-gradient-to-r from-[#FF6B00] to-[#FFA726] text-white shadow-md'
                : 'text-[#786D63] hover:text-[#FF6B00] hover:bg-[#FFF7ED]'
            }`}
          >
            <Sparkles size={14} />
            <span>Quiz Leaderboard (ज्ञान स्वाध्याय)</span>
          </button>
          <button
            onClick={() => { setLeaderboardType('naam_jap'); setSubjectFilter('global'); }}
            className={`py-3.5 px-4 rounded-xl text-xs font-black transition duration-300 flex items-center justify-center gap-2 ${
              leaderboardType === 'naam_jap'
                ? 'bg-gradient-to-r from-[#FF6B00] to-[#FFA726] text-white shadow-md'
                : 'text-[#786D63] hover:text-[#FF6B00] hover:bg-[#FFF7ED]'
            }`}
          >
            <Activity size={14} />
            <span>Chanting Standings (नाम जप साधना)</span>
          </button>
        </div>

        {/* Dynamic Filters Section */}
        <div className="bg-white rounded-[24px] border border-[#EFE7DB] p-4 shadow-sm flex flex-col md:flex-row gap-3">
          {/* Search box */}
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-3.5 text-[#786D63]/70" size={16} />
            <input 
              type="text" 
              placeholder="साधक का नाम खोजें (Search Devotee Name...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FFFDF8] border border-[#EFE7DB] rounded-xl py-3 pl-11 pr-4 text-xs font-medium focus:outline-none focus:border-[#FF6B00] text-[#2E241B]"
            />
          </div>

          <div className="flex gap-2">
            {/* Time filters */}
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="bg-[#FFFDF8] text-xs font-bold text-[#2E241B] border border-[#EFE7DB] rounded-xl py-2.5 px-4 focus:outline-none cursor-pointer"
            >
              <option value="all_time">सर्वकालिक (All Time)</option>
              <option value="today">आज (Today)</option>
              <option value="this_week">इस सप्ताह (Weekly)</option>
              <option value="this_month">इस माह (Monthly)</option>
            </select>

            {/* Quiz Subject specific filters */}
            {leaderboardType === 'quiz' && (
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="bg-[#FFFDF8] text-xs font-bold text-[#2E241B] border border-[#EFE7DB] rounded-xl py-2.5 px-4 focus:outline-none cursor-pointer"
              >
                <option value="global">समग्र विषय (Overall Standings)</option>
                <option value="bhagavad_gita">श्रीमद्भगवद्गीता (Bhagavad Gita)</option>
                <option value="ramcharitmanas">श्रीरामचरितमानस (Ramcharitmanas)</option>
                <option value="hanuman_chalisa">हनुमान चालीसा (Hanuman Chalisa)</option>
                <option value="shiv_puran">शिव महापुराण (Shiv Mahapuran)</option>
              </select>
            )}
          </div>
        </div>

        {/* PODIUM DISPLAY (TOP 3) */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-10 h-10 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : filteredFinalEntries.length === 0 ? (
          <div className="text-center py-16 bg-white border border-[#EFE7DB] rounded-[28px] p-8 space-y-3">
            <ShieldAlert size={48} className="text-[#EFE7DB] mx-auto" />
            <h4 className="font-bold text-[#2E241B]">No Records Found</h4>
            <p className="text-xs text-[#786D63]">दिए गए फिल्टर के अनुरूप कोई डेटा प्राप्त नहीं हुआ।</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Real Podium graphics */}
            <div className="flex flex-col md:flex-row items-end justify-center gap-6 pt-12 pb-6 border-b border-[#EFE7DB]/60">
              
              {/* RANK 2 */}
              {top3[1] && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-[#EFE7DB] rounded-[28px] p-6 text-center w-full md:w-60 shadow-sm relative flex flex-col justify-between h-72 group"
                >
                  <span className="absolute top-4 right-4 bg-slate-100 text-[#786D63] text-[9px] font-black px-2.5 py-1 rounded-full uppercase border border-slate-200">
                    🥈 Rank 2
                  </span>
                  
                  <div className="space-y-3 mt-4">
                    <img 
                      src={getAvatar(top3[1].profileImage, top3[1].userName)} 
                      alt={top3[1].userName} 
                      className="w-16 h-16 rounded-full object-cover border-4 border-slate-300 mx-auto"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-[#2E241B] truncate">{top3[1].userName}</h4>
                      <span className="text-[9px] font-black text-[#FF6B00] bg-[#FFF7ED] border border-[#FF6B00]/10 px-2 py-0.5 rounded uppercase mt-1 inline-block">
                        {top3[1].badge}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-[#EFE7DB]/60 pt-4 flex items-center justify-around text-xs mt-4">
                    <div>
                      <span className="text-[9px] text-[#786D63] block uppercase font-bold">
                        {leaderboardType === 'quiz' ? 'Score' : 'Beads'}
                      </span>
                      <strong className="text-[#2E241B]">
                        {leaderboardType === 'quiz' ? (top3[1] as any).score : (top3[1] as any).activeCount}
                      </strong>
                    </div>
                    <div className="w-[1px] bg-[#EFE7DB] h-6" />
                    <div>
                      <span className="text-[9px] text-[#786D63] block uppercase font-bold">Streak</span>
                      <strong className="text-[#FF6B00]">{top3[1].currentStreak}🔥</strong>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* RANK 1 (CROWNED CENTER) */}
              {top3[0] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border-2 border-[#D4AF37] rounded-[32px] p-6 text-center w-full md:w-64 shadow-md relative flex flex-col justify-between h-80"
                >
                  <span className="absolute top-4 right-4 bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-black px-3 py-1 rounded-full uppercase border border-[#D4AF37]/20 flex items-center gap-1">
                    <Crown size={10} className="fill-[#D4AF37]" />
                    <span>Rank 1</span>
                  </span>

                  <div className="space-y-3 mt-4 relative">
                    <motion.div
                      animate={{ y: [-3, 1, -3] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl"
                    >
                      👑
                    </motion.div>
                    <img 
                      src={getAvatar(top3[0].profileImage, top3[0].userName)} 
                      alt={top3[0].userName} 
                      className="w-20 h-20 rounded-full object-cover border-4 border-[#D4AF37] mx-auto shadow"
                    />
                    <div>
                      <h4 className="font-extrabold text-base text-[#2E241B] truncate">{top3[0].userName}</h4>
                      <span className="text-[9px] font-black text-white bg-[#D4AF37] px-3 py-0.5 rounded-full uppercase mt-1 inline-block">
                        {top3[0].badge}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-[#EFE7DB]/60 pt-4 flex items-center justify-around text-xs mt-4 bg-gradient-to-r from-amber-50/50 to-orange-50/10 p-3 rounded-2xl">
                    <div>
                      <span className="text-[9px] text-[#786D63] block uppercase font-bold">
                        {leaderboardType === 'quiz' ? 'Score' : 'Beads'}
                      </span>
                      <strong className="text-[#2E241B] text-sm">
                        {leaderboardType === 'quiz' ? (top3[0] as any).score : (top3[0] as any).activeCount}
                      </strong>
                    </div>
                    <div className="w-[1px] bg-[#EFE7DB] h-6" />
                    <div>
                      <span className="text-[9px] text-[#786D63] block uppercase font-bold">Streak</span>
                      <strong className="text-[#FF6B00] text-sm">{top3[0].currentStreak}🔥</strong>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* RANK 3 */}
              {top3[2] && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white border border-[#EFE7DB] rounded-[28px] p-6 text-center w-full md:w-60 shadow-sm relative flex flex-col justify-between h-72 group"
                >
                  <span className="absolute top-4 right-4 bg-amber-50 text-amber-800 text-[9px] font-black px-2.5 py-1 rounded-full uppercase border border-amber-100">
                    🥉 Rank 3
                  </span>

                  <div className="space-y-3 mt-4">
                    <img 
                      src={getAvatar(top3[2].profileImage, top3[2].userName)} 
                      alt={top3[2].userName} 
                      className="w-16 h-16 rounded-full object-cover border-4 border-amber-600/30 mx-auto"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-[#2E241B] truncate">{top3[2].userName}</h4>
                      <span className="text-[9px] font-black text-[#FF6B00] bg-[#FFF7ED] border border-[#FF6B00]/10 px-2 py-0.5 rounded uppercase mt-1 inline-block">
                        {top3[2].badge}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-[#EFE7DB]/60 pt-4 flex items-center justify-around text-xs mt-4">
                    <div>
                      <span className="text-[9px] text-[#786D63] block uppercase font-bold">
                        {leaderboardType === 'quiz' ? 'Score' : 'Beads'}
                      </span>
                      <strong className="text-[#2E241B]">
                        {leaderboardType === 'quiz' ? (top3[2] as any).score : (top3[2] as any).activeCount}
                      </strong>
                    </div>
                    <div className="w-[1px] bg-[#EFE7DB] h-6" />
                    <div>
                      <span className="text-[9px] text-[#786D63] block uppercase font-bold">Streak</span>
                      <strong className="text-[#FF6B00]">{top3[2].currentStreak}🔥</strong>
                    </div>
                  </div>
                </motion.div>
              )}

            </div>

            {/* RUNNERS UP STANDINGS LIST */}
            <div className="space-y-2 pt-4">
              {runnersUp.map((entry, idx) => {
                const isMe = entry.userId === user?.uid;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    key={entry.userId}
                    className={`flex items-center justify-between p-4 bg-white rounded-2xl border transition-all duration-300 ${
                      isMe 
                        ? 'border-[#FF6B00] bg-[#FF6B00]/5 shadow-sm' 
                        : 'border-[#EFE7DB]/60 hover:bg-[#FFF7ED]/30'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-6 text-center font-black text-xs text-[#786D63]">#{entry.rank}</span>
                      
                      <div className="relative">
                        <img 
                          src={getAvatar(entry.profileImage, entry.userName)} 
                          alt={entry.userName} 
                          className="w-10 h-10 rounded-full border border-[#EFE7DB] object-cover"
                        />
                        {entry.currentStreak >= 3 && (
                          <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[8px] font-black px-1 py-0.2 rounded-full">
                            🔥 {entry.currentStreak}
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-extrabold text-xs md:text-sm text-[#2E241B] flex items-center gap-1.5">
                          {entry.userName}
                          {isMe && <span className="text-[8px] bg-[#FF6B00] text-white px-1.5 py-0.2 rounded-md font-black">YOU</span>}
                        </h4>
                        <span className="text-[9px] text-[#786D63] font-bold bg-[#FFF7ED] border border-[#FF6B00]/10 px-2 py-0.2 rounded mt-1 inline-block uppercase">
                          {entry.badge}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <span className="text-[8px] uppercase font-black text-[#786D63] block">
                          {leaderboardType === 'quiz' ? 'Score' : 'Beads'}
                        </span>
                        <strong className="text-xs md:text-sm text-[#2E241B]">
                          {leaderboardType === 'quiz' ? (entry as any).score : (entry as any).activeCount}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[8px] uppercase font-black text-[#786D63] block">Streak</span>
                        <strong className="text-xs md:text-sm text-[#FF6B00]">{entry.currentStreak} Days</strong>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

          </div>
        )}

      </main>

      {/* Floating Active Profile bottom summary */}
      {myPosition && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#EFE7DB] py-4 px-6 z-40 shadow-2xl">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B00] to-[#FFA726] text-white rounded-xl flex flex-col items-center justify-center font-black shadow-sm">
                <span className="text-[8px] uppercase block opacity-75">Rank</span>
                <span className="text-xs font-mono -mt-0.5">#{myPosition.rank}</span>
              </div>
              <div>
                <h4 className="font-sans font-extrabold text-xs md:text-sm text-[#2E241B]">My Personal Standings</h4>
                <p className="text-[10px] text-[#786D63] font-bold">Streak: {myPosition.currentStreak} Days</p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-right">
              <div>
                <span className="text-[8px] uppercase font-black text-[#786D63]/80 block">
                  {leaderboardType === 'quiz' ? 'Quiz Score' : 'Mala Beads'}
                </span>
                <strong className="text-sm md:text-base text-[#FF6B00]">
                  {leaderboardType === 'quiz' ? (myPosition as any).score : (myPosition as any).activeCount}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Global helper metrics
const getBadgeTitle = (score: number) => {
  if (score >= 1000) return 'Divine Sage (महर्षि)';
  if (score >= 500) return 'Scripture Scholar (विद्वान)';
  if (score >= 200) return 'Faithful Seeker (जिज्ञासु)';
  return 'Beginner Aspirant (साधक)';
};

const getNaamJapBadge = (count: number) => {
  if (count >= 10000) return 'Maha Chanter (महा-जपी)';
  if (count >= 5000) return 'Siddha Sadhak (सिद्ध साधक)';
  if (count >= 1000) return 'Regular Chanter (नित्य साधक)';
  return 'Aspirant (साधक)';
};
