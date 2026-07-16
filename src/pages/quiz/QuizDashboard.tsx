import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useRealtimeCollection } from '../../hooks/useRealtimeCollection';
import { 
  Trophy, BookOpen, Star, Clock, Search, Filter, Play, 
  Award, Sparkles, Flame, History, CheckCircle2, ChevronRight, AlertCircle,
  ArrowLeft, Calendar, BarChart2, ShieldCheck, Download, Share2, Medal, X, QrCode
} from 'lucide-react';
import { doc, onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Subject, Quiz, QuizHistory, LeaderboardEntry, Achievement, Certificate } from './types';
import { seedQuizDatabase } from './quizSeeder';
import { motion, AnimatePresence } from 'motion/react';
import { useGoBack } from '../../hooks/useGoBack';
import { SUBJECT_CHAPTERS } from './chaptersConfig';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import confetti from 'canvas-confetti';

export const QuizDashboard = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const location = useLocation();
  const { user, userData } = useAuthStore();
  
  // Search & Filter state persisted via localStorage
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem('hari_quiz_search') || '');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>(() => localStorage.getItem('hari_quiz_difficulty') || 'all');
  const [selectedStatus, setSelectedStatus] = useState<string>(() => localStorage.getItem('hari_quiz_status') || 'all');
  const [sortBy, setSortBy] = useState<string>(() => localStorage.getItem('hari_quiz_sort') || 'newest');
  
  // Active User Tab (Admin tab is completely removed as requested)
  const [activeTab, setActiveTab] = useState<'subjects' | 'leaderboard' | 'history' | 'achievements' | 'certificates'>(() => {
    const saved = localStorage.getItem('hari_quiz_active_tab');
    if (saved === 'admin') return 'subjects';
    return (saved as any) || 'subjects';
  });

  // Selected Achievement Detail Modal
  const [selectedBadge, setSelectedBadge] = useState<any>(null);

  // Sync state changes to localStorage
  useEffect(() => {
    localStorage.setItem('hari_quiz_search', searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    localStorage.setItem('hari_quiz_difficulty', selectedDifficulty);
  }, [selectedDifficulty]);

  useEffect(() => {
    localStorage.setItem('hari_quiz_status', selectedStatus);
  }, [selectedStatus]);

  useEffect(() => {
    localStorage.setItem('hari_quiz_sort', sortBy);
  }, [sortBy]);

  useEffect(() => {
    localStorage.setItem('hari_quiz_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (location.state && (location.state as any).activeTab) {
      const tab = (location.state as any).activeTab;
      if (tab !== 'admin') {
        setActiveTab(tab);
      }
    }
  }, [location]);

  // Load Firestore Realtime data
  const { data: dbSubjects, loading: loadingSubjects } = useRealtimeCollection<Subject>('quiz_subjects');
  const { data: dbQuizzes, loading: loadingQuizzes } = useRealtimeCollection<Quiz>('quiz_quizzes');

  // Trigger Seeder if subjects collection is empty
  useEffect(() => {
    if (!loadingSubjects && dbSubjects.length === 0) {
      seedQuizDatabase();
    }
  }, [loadingSubjects, dbSubjects]);

  // User-specific states
  const [userQuizStats, setUserQuizStats] = useState({
    allTimeScore: 0,
    totalXP: 0,
    totalPlayed: 0,
    totalCorrect: 0,
    totalWrong: 0,
    totalSkipped: 0,
    accuracy: 0,
    currentStreak: 0,
    longestStreak: 0,
    badges: [] as string[]
  });

  const [history, setHistory] = useState<QuizHistory[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [inProgressQuizzes, setInProgressQuizzes] = useState<any[]>([]);

  // Listen to user quiz states, history, achievements, certificates
  useEffect(() => {
    if (!user) return;

    // 1. Listen to userStats main document
    const userStatsRef = doc(db, 'userStats', user.uid);
    const unsubStats = onSnapshot(userStatsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserQuizStats({
          allTimeScore: data.quizAllTimeScore || 0,
          totalXP: data.quizTotalXP || 0,
          totalPlayed: data.quizTotalPlayed || 0,
          totalCorrect: data.quizTotalCorrect || 0,
          totalWrong: data.quizTotalWrong || 0,
          totalSkipped: data.quizTotalSkipped || 0,
          accuracy: data.quizAccuracy || 0,
          currentStreak: data.quizStreak || 0,
          longestStreak: data.quizLongestStreak || 0,
          badges: data.badges || []
        });
      }
    }, (err) => console.error("Error loading user quiz stats", err));

    // 2. Listen to history subcollection
    const historyRef = collection(db, 'userStats', user.uid, 'quiz_history');
    const qHistory = query(historyRef, orderBy('completedAt', 'desc'));
    const unsubHistory = onSnapshot(qHistory, (snap) => {
      const items: QuizHistory[] = [];
      snap.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as QuizHistory);
      });
      setHistory(items);
    }, (err) => console.error("Error loading quiz history", err));

    // 3. Listen to achievements subcollection
    const achRef = collection(db, 'userStats', user.uid, 'achievements');
    const unsubAchievements = onSnapshot(achRef, (snap) => {
      const items: Achievement[] = [];
      snap.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as Achievement);
      });
      setAchievements(items);
    }, (err) => console.error("Error loading achievements", err));

    // 4. Listen to certificates subcollection
    const certRef = collection(db, 'userStats', user.uid, 'certificates');
    const unsubCertificates = onSnapshot(certRef, (snap) => {
      const items: Certificate[] = [];
      snap.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as Certificate);
      });
      setCertificates(items);
    }, (err) => console.error("Error loading certificates", err));

    // 5. Listen to current quiz progress (in-progress quizzes)
    const progRef = collection(db, 'userStats', user.uid, 'quiz_progress');
    const qProg = query(progRef, where('isCompleted', '==', false));
    const unsubProgress = onSnapshot(qProg, (snap) => {
      const items: any[] = [];
      snap.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setInProgressQuizzes(items);
    }, (err) => console.error("Error loading in-progress quizzes", err));

    // 6. Listen to global leaderboard (top 100)
    const leadRef = collection(db, 'quiz_global_leaderboard');
    const qLead = query(leadRef, orderBy('score', 'desc'), limit(100));
    const unsubLeaderboard = onSnapshot(qLead, (snap) => {
      const items: LeaderboardEntry[] = [];
      const seenUids = new Set<string>();
      snap.forEach(doc => {
        const data = doc.data();
        const uid = doc.id || data.uid || data.userId;
        if (uid && !seenUids.has(uid)) {
          seenUids.add(uid);
          items.push({ id: uid, ...data } as LeaderboardEntry);
        }
      });
      // Sort on client side
      items.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return (a.timeTaken || 0) - (b.timeTaken || 0);
      });
      setLeaderboard(items);
    }, (err) => console.error("Error loading leaderboard", err));

    return () => {
      unsubStats();
      unsubHistory();
      unsubAchievements();
      unsubCertificates();
      unsubProgress();
      unsubLeaderboard();
    };
  }, [user]);

  // Derived count stats
  const totalQuestionsCount = useMemo(() => {
    return dbSubjects.reduce((acc, sub) => acc + (sub.questionsCount || 0), 0);
  }, [dbSubjects]);

  // Today's Quiz (Active daily quiz marked by Admin)
  const todayQuiz = useMemo(() => {
    return dbQuizzes.find(q => q.isPublished && q.isTodayQuiz);
  }, [dbQuizzes]);

  // Filter & Search Logic for Subjects
  const filteredSubjects = useMemo(() => {
    return dbSubjects.filter(sub => {
      const matchSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          sub.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchDifficulty = selectedDifficulty === 'all' || sub.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();
      
      const hasCompletedQuizOfSubject = history.some(h => h.subjectId === sub.id && h.percentage >= 50);
      const matchStatus = selectedStatus === 'all' || 
                          (selectedStatus === 'completed' && hasCompletedQuizOfSubject) ||
                          (selectedStatus === 'incomplete' && !hasCompletedQuizOfSubject);

      return matchSearch && matchDifficulty && matchStatus;
    }).sort((a, b) => {
      if (sortBy === 'newest') return 1;
      return b.quizzesCount - a.quizzesCount; // popular
    });
  }, [dbSubjects, searchTerm, selectedDifficulty, selectedStatus, sortBy, history]);

  // Resume or start quiz
  const handleStartQuiz = (quizId: string) => {
    navigate(`/quiz/play/${quizId}`);
  };

  const completedQuizIds = useMemo(() => new Set(history.map(h => h.quizId)), [history]);

  // Sparkle celebration on badge click
  const triggerCelebration = (badge: any) => {
    setSelectedBadge(badge);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF6B00', '#FFA726', '#D4AF37']
    });
  };

  // Recharts Chart Data (last 7 completed quiz entries with non-zero dates)
  const chartData = useMemo(() => {
    const sortedHist = [...history]
      .reverse()
      .filter(h => h.completedAt)
      .slice(-7);
    return sortedHist.map((h, i) => {
      const date = h.completedAt?.seconds 
        ? new Date(h.completedAt.seconds * 1000).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})
        : new Date(h.completedAt || Date.now()).toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
      return {
        name: date,
        Score: h.score,
        Accuracy: h.percentage,
        XP: h.percentage >= 50 ? 100 : 20
      };
    });
  }, [history]);

  // Get dynamic icons/illustrations for spiritual subjects
  const getSubjectIllustration = (id: string) => {
    switch(id) {
      case 'bhagavad_gita': return { emoji: '📖', gradient: 'from-[#FF6B00]/20 to-[#FFA726]/10', border: 'border-[#FF6B00]/30' };
      case 'hanuman_chalisa': return { emoji: '📿', gradient: 'from-[#FFA726]/20 to-[#D4AF37]/10', border: 'border-[#FFA726]/30' };
      case 'ramcharitmanas': return { emoji: '🏹', gradient: 'from-[#CC5200]/20 to-[#FF6B00]/10', border: 'border-[#CC5200]/30' };
      case 'ramayana': return { emoji: '🏹', gradient: 'from-[#FF6B00]/20 to-[#D4AF37]/10', border: 'border-[#FF6B00]/30' };
      case 'mahabharata': return { emoji: '🛡️', gradient: 'from-amber-600/20 to-amber-500/10', border: 'border-amber-600/30' };
      case 'shiv_puran': return { emoji: '🔱', gradient: 'from-blue-600/10 to-indigo-500/10', border: 'border-blue-500/20' };
      case 'vishnu_puran': return { emoji: '🐚', gradient: 'from-[#D4AF37]/20 to-[#FFF7ED]', border: 'border-[#D4AF37]/30' };
      case 'bhagavatam': return { emoji: '🍯', gradient: 'from-yellow-500/20 to-orange-400/10', border: 'border-yellow-500/30' };
      case 'vedas': return { emoji: '📜', gradient: 'from-orange-500/20 to-amber-500/10', border: 'border-orange-500/30' };
      case 'upanishads': return { emoji: '🕯️', gradient: 'from-yellow-600/20 to-[#FFF7ED]', border: 'border-yellow-600/30' };
      default: return { emoji: '✨', gradient: 'from-[#FF6B00]/10 to-[#FFA726]/5', border: 'border-[#FF6B00]/20' };
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#2E241B] pb-24 font-sans select-none">
      
      {/* Premium Spiritual Minimalist Header */}
      <header className="relative pt-10 pb-20 px-6 bg-gradient-to-b from-[#FFF7ED] to-[#FFFDF8] border-b border-[#EFE7DB]/60 overflow-hidden shrink-0">
        {/* Soft background mandala ornament */}
        <div className="absolute top-[-50px] right-[-50px] w-56 h-56 rounded-full bg-[#FF6B00]/5 border border-[#FF6B00]/10 flex items-center justify-center pointer-events-none animate-spin-slow">
          <div className="w-40 h-40 rounded-full border border-dashed border-[#FF6B00]/20" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => goBack('/')}
              className="flex items-center gap-2 bg-white hover:bg-[#FFF7ED] border border-[#EFE7DB] text-[#2E241B] px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-300 shadow-sm hover:scale-102 active:scale-98"
            >
              <ArrowLeft size={14} className="text-[#FF6B00]" />
              <span>मुख्य पृष्ठ</span>
            </button>
            
            <div className="flex items-center gap-2 bg-gradient-to-r from-[#FF6B00]/10 to-[#FFA726]/10 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#FF6B00] border border-[#FF6B00]/20 animate-pulse">
              <Sparkles size={14} className="text-[#FF6B00]" />
              <span className="font-mukta">ज्ञानं परमं बलम्</span>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-sans text-[#2E241B] flex items-center gap-3">
                Hari Pathshala Quiz
              </h1>
              <p className="text-[#786D63] text-sm md:text-base max-w-xl font-mukta leading-relaxed">
                सनातन धर्म, वेद, और उपनिषदों के दिव्य ज्ञान का स्वाध्याय करें। सुंदर अंतराफलक, सूक्ष्म एनिमेशन और प्रामाणिक ग्रंथों पर आधारित प्रश्नोत्तरी।
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 -mt-10 relative z-20 space-y-8">
        
        {/* 1. HEADER STATS CARD GRID */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { 
              label: 'Daily Streak', 
              value: userQuizStats.currentStreak, 
              unit: 'Days', 
              icon: <Flame size={20} className="text-[#FF6B00]" />, 
              desc: 'Continuous play log',
              color: 'from-[#FF6B00] to-[#FFA726]'
            },
            { 
              label: 'Total Played', 
              value: userQuizStats.totalPlayed, 
              unit: 'Quizzes', 
              icon: <BookOpen size={20} className="text-[#FFA726]" />, 
              desc: 'Wisdom rounds played',
              color: 'from-[#FFA726] to-[#D4AF37]'
            },
            { 
              label: 'Average Accuracy', 
              value: userQuizStats.accuracy, 
              unit: '%', 
              icon: <Trophy size={20} className="text-[#D4AF37]" />, 
              desc: 'Scripture alignment accuracy',
              color: 'from-[#D4AF37] to-[#FF6B00]'
            }
          ].map((stat, idx) => (
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              key={stat.label}
              className="bg-white border border-[#EFE7DB] rounded-[24px] p-5 shadow-[0_4px_20px_rgba(239,231,219,0.3)] flex flex-col justify-between relative overflow-hidden group"
            >
              {/* Corner accent glow */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#FF6B00]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="flex items-center justify-between">
                <span className="text-[10px] md:text-xs text-[#786D63] font-bold uppercase tracking-wider">{stat.label}</span>
                <div className="w-8 h-8 rounded-full bg-[#FFF7ED] flex items-center justify-center shadow-inner">
                  {stat.icon}
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl md:text-4xl font-black tracking-tight text-[#2E241B]">
                    {stat.value}
                  </span>
                  <span className="text-xs font-bold text-[#786D63]">{stat.unit}</span>
                </div>
                <p className="text-[9px] text-[#786D63]/80 mt-1 line-clamp-1 font-mukta">{stat.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 2. DAILY CHALLENGE BANNER CARD */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative bg-white border-2 border-[#FF6B00]/20 rounded-[28px] p-6 md:p-8 overflow-hidden shadow-[0_12px_40px_rgba(255,107,0,0.04)] flex flex-col md:flex-row gap-6 items-center justify-between"
        >
          {/* Subtle spiritual backglow */}
          <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-[#FF6B00]/5 rounded-full blur-3xl pointer-events-none" />
          
          {/* Left: Metadata Details */}
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-2">
              <span className="bg-[#FF6B00]/10 text-[#FF6B00] text-[10px] uppercase font-black px-3 py-1 rounded-full border border-[#FF6B00]/20">
                DAILY SCRIPTURE CHALLENGE
              </span>
              <span className="bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-black px-3 py-1 rounded-full border border-[#D4AF37]/20 flex items-center gap-1">
                ⭐ +100 XP
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF6B00]/10 to-[#FFA726]/10 flex items-center justify-center text-4xl shadow-inner border border-[#FF6B00]/20 animate-pulse">
                🕉
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-[#2E241B]">Daily Challenge</h2>
                <h3 className="text-sm font-semibold text-[#FF6B00] font-mukta">मिश्रित आध्यात्मिक प्रश्नोत्तरी (Mixed Spiritual Quiz)</h3>
              </div>
            </div>
            
            <p className="text-xs text-[#786D63] leading-relaxed max-w-md font-mukta">
              दिन की एक विशेष प्रश्नोत्तरी। कुरुक्षेत्र संवाद, रामायण, और पुराणों के २५ दिव्य प्रश्नों के माध्यम से आज की अपनी मानसिक गतिशीलता को मापें।
            </p>

            <div className="grid grid-cols-4 gap-2 pt-2">
              {[
                { label: 'Time Limit', val: '10 Mins' },
                { label: 'Questions', val: '15 Qs' },
                { label: 'Level', val: 'Medium' },
                { label: 'Reward', val: '+100 XP' }
              ].map(badge => (
                <div key={badge.label} className="bg-[#FFFDF8] border border-[#EFE7DB] rounded-xl p-2 text-center shadow-sm">
                  <span className="text-[8px] text-[#786D63] uppercase block font-bold tracking-wider">{badge.label}</span>
                  <span className="text-xs font-bold text-[#2E241B] block mt-0.5">{badge.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Scripture Floating Illustration and CTA */}
          <div className="flex flex-col items-center justify-center shrink-0 w-full md:w-auto gap-4">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="w-28 h-28 rounded-full bg-[#FFF7ED] border border-[#FF6B00]/20 flex items-center justify-center text-5xl shadow-md"
            >
              📜
            </motion.div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleStartQuiz('ai_mixed')}
              className="w-full md:w-48 bg-gradient-to-r from-[#FF6B00] to-[#FFA726] text-white py-3.5 px-6 rounded-2xl font-extrabold text-sm shadow-md shadow-[#FF6B00]/20 transition-all duration-300 flex items-center justify-center gap-2 hover:brightness-105"
            >
              <Play size={16} className="fill-white" />
              <span>प्रारम्भ करें (Start Quiz)</span>
            </motion.button>
          </div>
        </motion.div>

        {/* 3. MODERN CONTENT TABS */}
        <div className="bg-white p-1.5 rounded-[22px] border border-[#EFE7DB] flex gap-1 overflow-x-auto no-scrollbar scroll-smooth shadow-sm">
          {([
            { id: 'subjects', label: 'Subjects', icon: <BookOpen size={14} /> },
            { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy size={14} /> },
            { id: 'history', label: 'History', icon: <History size={14} /> },
            { id: 'achievements', label: 'Achievements', icon: <Award size={14} /> },
            { id: 'certificates', label: 'Certificates', icon: <Medal size={14} /> }
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all duration-300 capitalize flex items-center justify-center gap-2 shrink-0 ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-[#FF6B00] to-[#FFA726] text-white shadow-md' 
                  : 'text-[#786D63] hover:bg-[#FFF7ED] hover:text-[#FF6B00]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 4. CURRENT TAB PANEL RENDERER */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            
            {/* ==================== SUBJECTS TAB ==================== */}
            {activeTab === 'subjects' && (
              <div className="space-y-6">
                
                {/* Search & Filter Section */}
                <div className="bg-white p-4 rounded-[24px] border border-[#EFE7DB] shadow-sm flex flex-col md:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3.5 top-3.5 text-[#786D63]/70" size={16} />
                    <input 
                      type="text" 
                      placeholder="विषय या ग्रंथ खोजें (Search Scriptures, Vedas...)"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-[#FFFDF8] border border-[#EFE7DB] rounded-xl py-3 pl-11 pr-4 text-xs font-medium focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] text-[#2E241B]"
                    />
                  </div>
                  
                  {/* Select Filters */}
                  <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5">
                    <select
                      value={selectedDifficulty}
                      onChange={(e) => setSelectedDifficulty(e.target.value)}
                      className="bg-[#FFFDF8] text-xs font-bold text-[#2E241B] border border-[#EFE7DB] rounded-xl py-2.5 px-3 focus:outline-none cursor-pointer"
                    >
                      <option value="all">सभी कठिनाई (All Levels)</option>
                      <option value="beginner">शुरुआती (Beginner)</option>
                      <option value="intermediate">मध्यम (Intermediate)</option>
                      <option value="advanced">उच्च (Advanced)</option>
                    </select>

                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="bg-[#FFFDF8] text-xs font-bold text-[#2E241B] border border-[#EFE7DB] rounded-xl py-2.5 px-3 focus:outline-none cursor-pointer"
                    >
                      <option value="all">सभी परीक्षाएँ (All Quizzes)</option>
                      <option value="completed">पूर्ण (Completed)</option>
                      <option value="incomplete">अपूर्ण (Incomplete)</option>
                    </select>

                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-[#FFFDF8] text-xs font-bold text-[#2E241B] border border-[#EFE7DB] rounded-xl py-2.5 px-3 focus:outline-none cursor-pointer"
                    >
                      <option value="newest">नवीनतम (Newest First)</option>
                      <option value="popular">लोकप्रिय (Popular First)</option>
                    </select>
                  </div>
                </div>

                {/* Grid Lists */}
                {loadingSubjects ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((n) => (
                      <div key={n} className="h-60 bg-[#EFE7DB]/30 animate-pulse rounded-[24px]" />
                    ))}
                  </div>
                ) : filteredSubjects.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-[28px] border border-[#EFE7DB] p-8 space-y-4">
                    <div className="w-20 h-20 bg-[#FFF7ED] rounded-full flex items-center justify-center mx-auto text-4xl">🛕</div>
                    <div>
                      <h3 className="font-bold text-lg text-[#2E241B]">Aligning Divine Chapters...</h3>
                      <p className="text-xs text-[#786D63] mt-1 font-mukta">
                        हमारे आध्यात्मिक ग्रंथ और शोध अध्याय वर्तमान में संकलित हो रहे हैं। नई ज्ञान परीक्षाएँ शीघ्र ही उपलब्ध होंगी।
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredSubjects.map((sub, idx) => {
                      const style = getSubjectIllustration(sub.id);
                      const subjectQuizzes = dbQuizzes.filter(q => q.subjectId === sub.id && q.isPublished);
                      const completedQuizzesCount = subjectQuizzes.filter(q => completedQuizIds.has(q.id)).length;
                      
                      // Dynamically calculate completion %
                      const completionPercent = subjectQuizzes.length > 0 
                        ? Math.round((completedQuizzesCount / subjectQuizzes.length) * 100) 
                        : 0;

                      return (
                        <motion.div 
                          whileHover={{ y: -5, scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          key={sub.id}
                          onClick={() => navigate(`/quiz/subject/${sub.id}`)}
                          className="bg-white rounded-[24px] border border-[#EFE7DB]/80 shadow-[0_4px_16px_rgba(239,231,219,0.2)] overflow-hidden flex flex-col justify-between hover:shadow-md cursor-pointer transition-all duration-300"
                        >
                          <div className="p-6 space-y-4">
                            {/* Card top elements: Large Illustration Icon & Progress Ring */}
                            <div className="flex items-center justify-between">
                              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${style.gradient} border ${style.border} flex items-center justify-center text-3xl shadow-inner`}>
                                {style.emoji}
                              </div>
                              
                              {/* Progress Ring */}
                              <div className="relative w-12 h-12 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                  <circle cx="24" cy="24" r="18" stroke="#FEE8D6" strokeWidth="3" fill="transparent" />
                                  <circle 
                                    cx="24" 
                                    cy="24" 
                                    r="18" 
                                    stroke="#FF6B00" 
                                    strokeWidth="3.5" 
                                    fill="transparent" 
                                    strokeDasharray={2 * Math.PI * 18}
                                    strokeDashoffset={2 * Math.PI * 18 * (1 - completionPercent / 100)}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <span className="absolute text-[10px] font-black text-[#FF6B00]">{completionPercent}%</span>
                              </div>
                            </div>

                            {/* Title & Description */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-base text-[#2E241B] leading-tight font-sans">
                                  {sub.name}
                                </h3>
                              </div>
                              <p className="text-xs text-[#786D63] font-mukta leading-relaxed line-clamp-2">
                                {sub.description}
                              </p>
                            </div>
                          </div>

                          {/* Footer Stats Line */}
                          <div className="bg-[#FFFDF8] border-t border-[#EFE7DB] px-6 py-4 flex items-center justify-between text-[11px] text-[#786D63] font-bold">
                            <span className="bg-[#FFF7ED] text-[#FF6B00] px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                              {sub.difficulty}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <BookOpen size={12} className="text-[#FF6B00]" />
                                {subjectQuizzes.length} Quizzes
                              </span>
                              <span className="flex items-center gap-1">
                                <Star size={12} className="text-[#D4AF37] fill-[#D4AF37]" />
                                {sub.questionsCount || 25} Qs
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ==================== LEADERBOARD TAB ==================== */}
            {activeTab === 'leaderboard' && (
              <div className="bg-white border border-[#EFE7DB] rounded-[28px] p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-[#EFE7DB] pb-4">
                  <div>
                    <h3 className="font-bold text-lg text-[#2E241B] flex items-center gap-2 font-sans">
                      <Trophy className="text-[#D4AF37]" size={20} /> Realtime Global Standings
                    </h3>
                    <p className="text-xs text-[#786D63] mt-1 font-mukta">परीक्षाएँ पूर्ण करें और शीर्ष पायदान पर मुकुट धारण करें।</p>
                  </div>
                  <span className="text-[10px] font-black bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20 px-3 py-1 rounded-full animate-pulse uppercase">
                    ● Realtime updates
                  </span>
                </div>

                {leaderboard.length === 0 ? (
                  <div className="text-center py-16 p-8 space-y-3 bg-white rounded-[28px]">
                    <Trophy size={48} className="mx-auto text-[#FF6B00]/30 animate-pulse" />
                    <h4 className="font-bold text-[#2E241B]">Vedic Honors Opening Soon</h4>
                    <p className="text-xs text-[#786D63] font-mukta">अंक तालिका का स्वर्ण मुकुट सुशोभित होने के लिए तैयार है। अपनी पहली परीक्षा पूर्ण करके अपनी स्थिति अंकित करें!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* PODIUM TOP 3 USERS */}
                    <div className="flex flex-col sm:flex-row items-end justify-center gap-4 sm:gap-6 pt-10 pb-6 border-b border-[#EFE7DB]/60">
                      
                      {/* SECOND PLACE */}
                      {leaderboard[1] && (
                        <div className="flex flex-col items-center order-2 sm:order-1">
                          <div className="relative">
                            <img 
                              src={leaderboard[1].profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leaderboard[1].userName}`} 
                              alt={leaderboard[1].userName} 
                              className="w-16 h-16 rounded-full border-4 border-slate-300 shadow-inner"
                            />
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-300 text-slate-800 text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow">
                              2
                            </div>
                          </div>
                          <div className="text-center mt-2">
                            <h4 className="font-black text-sm text-[#2E241B] max-w-[120px] truncate">{leaderboard[1].userName}</h4>
                            <span className="text-xs font-bold text-[#FF6B00]">{leaderboard[1].score} pts</span>
                          </div>
                          <div className="w-24 h-16 bg-[#F1F3F5] border border-slate-200 rounded-t-xl mt-3 flex items-center justify-center shadow-inner">
                            <span className="text-slate-400 text-2xl font-black">🥈</span>
                          </div>
                        </div>
                      )}

                      {/* FIRST PLACE */}
                      {leaderboard[0] && (
                        <div className="flex flex-col items-center order-1 sm:order-2">
                          <div className="relative">
                            {/* Animated Crown */}
                            <motion.span
                              animate={{ y: [-4, 0, -4] }}
                              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                              className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl"
                            >
                              👑
                            </motion.span>
                            <img 
                              src={leaderboard[0].profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leaderboard[0].userName}`} 
                              alt={leaderboard[0].userName} 
                              className="w-20 h-20 rounded-full border-4 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/10"
                            />
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-white text-[11px] font-black px-2 py-0.5 rounded-full border border-white shadow">
                              #1
                            </div>
                          </div>
                          <div className="text-center mt-3">
                            <h4 className="font-black text-base text-[#2E241B] max-w-[140px] truncate flex items-center gap-1">
                              {leaderboard[0].userName}
                            </h4>
                            <span className="text-sm font-black text-[#D4AF37]">{leaderboard[0].score} pts</span>
                          </div>
                          <div className="w-28 h-24 bg-gradient-to-b from-[#FFF3D6] to-[#FFEBB5] border border-[#FFE08A] rounded-t-2xl mt-3 flex flex-col items-center justify-center shadow-md">
                            <span className="text-[#D4AF37] text-3xl font-black">🥇</span>
                            <span className="text-[9px] uppercase font-black text-[#CC5200] mt-1">Crown Master</span>
                          </div>
                        </div>
                      )}

                      {/* THIRD PLACE */}
                      {leaderboard[2] && (
                        <div className="flex flex-col items-center order-3">
                          <div className="relative">
                            <img 
                              src={leaderboard[2].profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${leaderboard[2].userName}`} 
                              alt={leaderboard[2].userName} 
                              className="w-14 h-14 rounded-full border-4 border-amber-600 shadow-inner"
                            />
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow">
                              3
                            </div>
                          </div>
                          <div className="text-center mt-2">
                            <h4 className="font-black text-sm text-[#2E241B] max-w-[110px] truncate">{leaderboard[2].userName}</h4>
                            <span className="text-xs font-bold text-[#FF6B00]">{leaderboard[2].score} pts</span>
                          </div>
                          <div className="w-22 h-12 bg-[#FCF5F2] border border-amber-100 rounded-t-xl mt-3 flex items-center justify-center shadow-inner">
                            <span className="text-amber-700 text-2xl font-black">🥉</span>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* REST OF STANDINGS LIST */}
                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                      {leaderboard.slice(3).map((entry, index) => {
                        const isMe = entry.userId === user?.uid;
                        return (
                          <div 
                            key={entry.id} 
                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                              isMe 
                                ? 'bg-[#FF6B00]/5 border-[#FF6B00] shadow-sm' 
                                : 'bg-[#FFFDF8] border-[#EFE7DB]/60 hover:bg-[#FFF7ED]/30'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 font-black text-xs text-[#786D63] text-center">#{index + 4}</span>
                              <img 
                                src={entry.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.userName}`} 
                                alt={entry.userName} 
                                className="w-9 h-9 rounded-full object-cover border border-[#EFE7DB] shrink-0"
                              />
                              <div>
                                <h4 className="font-bold text-xs text-[#2E241B] flex items-center gap-1.5">
                                  {entry.userName}
                                  {isMe && <span className="text-[8px] bg-[#FF6B00] text-white px-1.5 py-0.2 rounded-md font-black">YOU</span>}
                                </h4>
                                <span className="text-[9px] text-[#786D63] block font-mukta">{entry.percentage}% Avg Accuracy</span>
                              </div>
                            </div>

                            <span className="text-xs font-extrabold text-[#FF6B00] bg-[#FFF7ED] px-3 py-1 rounded-full border border-[#FF6B00]/20">
                              {entry.score} Pts
                            </span>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* ==================== HISTORY TAB ==================== */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                
                {/* Statistics Chart Panel */}
                {history.length > 0 && (
                  <div className="bg-white border border-[#EFE7DB] rounded-[28px] p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                      <BarChart2 size={16} className="text-[#FF6B00]" />
                      <h4 className="font-bold text-xs uppercase tracking-wider text-[#2E241B]">Weekly स्वाध्याय (Progress Tracking)</h4>
                    </div>
                    
                    {/* Area Chart of scores */}
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#FF6B00" stopOpacity={0.01}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" stroke="#786D63" fontSize={9} tickLine={false} />
                          <YAxis stroke="#786D63" fontSize={9} tickLine={false} />
                          <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px', border: '1px solid #EFE7DB', backgroundColor: '#FFFDF8' }} />
                          <Area type="monotone" dataKey="Score" stroke="#FF6B00" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* List entries as a vertical elegant timeline */}
                {history.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-[28px] border border-[#EFE7DB] p-8 space-y-3">
                    <History size={48} className="mx-auto text-[#FF6B00]/30 animate-pulse" />
                    <h4 className="font-bold text-[#2E241B]">Embark on Your Spiritual Quest</h4>
                    <p className="text-xs text-[#786D63] max-w-sm mx-auto font-mukta">
                      अभी तक आपका परीक्षा इतिहास रिक्त है। उपनिषदों और दिव्य शास्त्रों का स्वाध्याय आरम्भ करने के लिए ऊपर "प्रारम्भ करें" पर क्लिक करें!
                    </p>
                  </div>
                ) : (
                  <div className="relative pl-6 border-l-2 border-[#EFE7DB] ml-3 space-y-6">
                    {history.map((h, i) => {
                      const date = h.completedAt?.seconds 
                        ? new Date(h.completedAt.seconds * 1000).toLocaleDateString(undefined, {month: 'long', day: 'numeric', year: 'numeric'})
                        : new Date(h.completedAt || Date.now()).toLocaleDateString(undefined, {month: 'long', day: 'numeric', year: 'numeric'});
                      
                      const isPass = h.percentage >= 50;

                      return (
                        <div key={h.id} className="relative">
                          {/* Timeline dot */}
                          <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-4 border-white shadow ${isPass ? 'bg-green-500' : 'bg-red-400'}`} />
                          
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white border border-[#EFE7DB]/80 rounded-[22px] p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
                          >
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="bg-[#FFF7ED] text-[#FF6B00] text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                                  {h.subjectName}
                                </span>
                                <span className="text-[9px] text-[#786D63] font-bold flex items-center gap-1">
                                  <Calendar size={10} />
                                  {date}
                                </span>
                              </div>
                              <h3 className="font-bold text-sm text-[#2E241B] leading-tight font-sans">
                                {h.quizName}
                              </h3>
                              <p className="text-[10px] text-[#786D63] font-mukta">
                                Accuracy: <span className="font-bold">{h.percentage}%</span> • Duration: <span className="font-bold">{h.timeTaken} seconds</span>
                              </p>
                            </div>

                            <div className="flex items-center gap-4 justify-between md:justify-end border-t md:border-t-0 border-[#EFE7DB]/60 pt-3 md:pt-0 shrink-0">
                              <div className="text-right">
                                <span className="text-base font-black text-[#FF6B00] block">{h.score} Pts</span>
                                <span className={`text-[10px] font-black uppercase ${isPass ? 'text-green-500' : 'text-red-500'}`}>
                                  {isPass ? 'सफल (PASS)' : 'असफल (FAIL)'}
                                </span>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => navigate(`/quiz/result/${h.id}`)}
                                  className="bg-[#FFF7ED] hover:bg-[#FF6B00]/10 text-[#FF6B00] font-bold px-3.5 py-2 rounded-xl text-xs transition border border-[#FF6B00]/10"
                                >
                                  स्वाध्याय (Review)
                                </button>
                                {h.certificateId && (
                                  <button
                                    onClick={() => navigate(`/quiz/result/${h.id}?cert=1`)}
                                    className="bg-gradient-to-r from-[#FF6B00] to-[#FFA726] text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-sm hover:brightness-105 transition"
                                  >
                                    प्रमाण पत्र (Certificate)
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ==================== ACHIEVEMENTS TAB ==================== */}
            {activeTab === 'achievements' && (
              <div className="bg-white border border-[#EFE7DB] rounded-[28px] p-6 shadow-sm space-y-6">
                <div className="border-b border-[#EFE7DB] pb-4">
                  <h3 className="font-bold text-lg text-[#2E241B] font-sans">Achievements & Trophy Gallery</h3>
                  <p className="text-xs text-[#786D63] mt-1 font-mukta">विभिन्न ग्रंथ स्वाध्याय पूर्ण करके अनमोल आध्यात्मिक बैज अर्जित करें।</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { id: 'beginner', title: '📖 Beginner Seeker', desc: 'Score 50%+ in any spiritual quiz', req: 'Complete 1 Quiz play', reward: 'Beginner Badge' },
                    { id: 'devotee', title: '📿 Loyal Devotee', desc: 'Complete 5 quizzes successfully', req: 'Play 5 Quizzes', reward: 'Devotion Badge' },
                    { id: 'gita_scholar', title: '🔥 Gita Scholar', desc: 'Score 90%+ on any Gita quiz', req: '90%+ in Bhagavad Gita', reward: 'Elite Scripture Scholar' },
                    { id: 'ramcharitmanas_reader', title: '🏹 Manas Pathak', desc: 'Complete Ramcharitmanas quiz', req: 'Complete Ramcharitmanas', reward: 'Ram Bhakta Badge' },
                    { id: 'quiz_champion', title: '🏆 Quiz Champion', desc: 'Achieve #1 in any leaderboard', req: 'Rank #1 overall', reward: 'Golden Crown Badge' },
                    { id: 'perfect_score', title: '💯 Perfect Score', desc: 'Score 100% in any quiz', req: '100% Quiz score', reward: 'Absolute Perfection' },
                    { id: 'daily_learner', title: '⭐ Daily Learner', desc: 'Complete today\'s daily quiz', req: 'Play Today\'s Quiz', reward: 'Daily Dedication' },
                    { id: 'streak_7', title: '🎯 7 Day Streak', desc: 'Maintain 7 day daily quiz streak', req: '7 Day Streak', reward: 'Streak Master' },
                    { id: 'streak_30', title: '👑 Supreme Master', desc: 'Maintain 30 day daily quiz streak', req: '30 Day Streak', reward: 'Divine Sage Badge' }
                  ].map((badge) => {
                    const isUnlocked = achievements.some(a => a.achievementId === badge.id) || 
                                       (badge.id === 'beginner' && history.length >= 1) || 
                                       (badge.id === 'devotee' && history.length >= 5) ||
                                       (badge.id === 'perfect_score' && history.some(h => h.percentage === 100)) ||
                                       (badge.id === 'daily_learner' && history.some(h => h.quizId === todayQuiz?.id));
                    
                    return (
                      <motion.div 
                        whileHover={{ y: -4, scale: 1.02 }}
                        onClick={() => triggerCelebration({...badge, isUnlocked})}
                        key={badge.id}
                        className={`p-5 rounded-[24px] border text-center flex flex-col justify-between space-y-4 cursor-pointer transition-all duration-300 ${
                          isUnlocked 
                            ? 'bg-[#FFF7ED]/40 border-[#FF6B00]/20 shadow-[0_4px_12px_rgba(255,107,0,0.02)]' 
                            : 'bg-slate-50/50 border-slate-100 opacity-40 select-none'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="text-4xl filter drop-shadow">
                            {badge.id === 'beginner' ? '📖' :
                             badge.id === 'devotee' ? '📿' :
                             badge.id === 'gita_scholar' ? '🔥' :
                             badge.id === 'ramcharitmanas_reader' ? '🏹' :
                             badge.id === 'quiz_champion' ? '🏆' :
                             badge.id === 'perfect_score' ? '💯' :
                             badge.id === 'daily_learner' ? '⭐' : '👑'}
                          </div>
                          
                          <h4 className="font-bold text-xs text-[#2E241B] leading-tight font-sans">
                            {badge.title}
                          </h4>
                          <p className="text-[10px] text-[#786D63]/90 leading-relaxed font-mukta">
                            {badge.desc}
                          </p>
                        </div>

                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-full w-max mx-auto border ${
                          isUnlocked 
                            ? 'bg-green-500/10 text-green-700 border-green-500/20' 
                            : 'bg-slate-200 text-slate-500 border-transparent'
                        }`}>
                          {isUnlocked ? 'UNLOCKED' : badge.req}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ==================== CERTIFICATES TAB ==================== */}
            {activeTab === 'certificates' && (
              <div className="bg-white border border-[#EFE7DB] rounded-[28px] p-6 shadow-sm space-y-6">
                <div className="border-b border-[#EFE7DB] pb-4">
                  <h3 className="font-bold text-lg text-[#2E241B] font-sans">Spiritual Study Credentials</h3>
                  <p className="text-xs text-[#786D63] mt-1 font-mukta">योग्य परीक्षाओं में ६०%+ स्कोर अर्जित करके प्रामाणिक डिजिटल प्रमाण पत्र प्राप्त करें।</p>
                </div>

                {certificates.length === 0 && !history.some(h => h.percentage >= 60) ? (
                  <div className="text-center py-16 p-8 space-y-3 bg-white rounded-[28px]">
                    <Award size={48} className="mx-auto text-[#D4AF37]/40 animate-bounce" />
                    <h4 className="font-bold text-[#2E241B]">Wisdom Credentials Await</h4>
                    <p className="text-xs text-[#786D63] font-mukta">
                      ६०%+ प्रतिशत के साथ किसी भी अध्याय परीक्षा को उत्तीर्ण करें और श्री हरि पाठशाला से आधिकारिक सनातन डिजिटल प्रमाण पत्र प्राप्त करें।
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {(() => {
                      const certMap = new Map<string, any>();
                      history.filter(h => h.percentage >= 60 && !h.quizId.startsWith('chapter_play_')).forEach(h => {
                        certMap.set(h.quizId, {
                          id: h.certificateId || `HP-CERT-${h.id.slice(0, 6).toUpperCase()}`,
                          quizId: h.quizId,
                          quizName: h.quizName,
                          userName: user?.displayName || userData?.name || 'साधक',
                          score: h.score,
                          percentage: h.percentage,
                          completedAt: h.completedAt,
                          historyId: h.id
                        });
                      });
                      certificates.forEach(c => {
                        certMap.set(c.quizId, {
                          id: c.id,
                          quizId: c.quizId,
                          quizName: c.quizName,
                          userName: c.userName,
                          score: c.score,
                          percentage: c.percentage,
                          completedAt: c.completedAt,
                          historyId: history.find(h => h.quizId === c.quizId)?.id || ""
                        });
                      });
                      return Array.from(certMap.values());
                    })().map((cert: any, i: number) => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        key={cert.id} 
                        className="relative bg-gradient-to-br from-amber-50/50 to-orange-50/20 rounded-[24px] border-2 border-[#D4AF37]/30 p-6 flex flex-col justify-between shadow-[0_6px_24px_rgba(212,175,55,0.06)] group overflow-hidden"
                      >
                        {/* Golden embossed certificate emblem */}
                        <div className="absolute top-0 right-6 w-9 h-12 bg-gradient-to-b from-[#D4AF37] to-[#B89020] rounded-b-lg shadow flex items-center justify-center text-white text-sm font-bold border-x border-b border-white/20">
                          🕉
                        </div>

                        <div className="space-y-3 pr-8">
                          <span className="text-[8px] tracking-widest uppercase font-black text-[#D4AF37]">HARI PATHSHALA CREDENTIAL</span>
                          <h3 className="font-sans font-bold text-[#2E241B] text-base leading-snug">{cert.quizName}</h3>
                          
                          <div className="text-[10px] text-[#786D63] space-y-0.5 border-l-2 border-[#D4AF37] pl-3">
                            <p>Recipient: <strong className="text-[#2E241B]">{cert.userName}</strong></p>
                            <p>Passing Grade: <strong className="text-[#2E241B]">{cert.percentage}%</strong></p>
                            <p>Certificate ID: <span className="font-mono">{cert.id}</span></p>
                          </div>
                        </div>

                        <button
                          onClick={() => navigate(`/quiz/result/${cert.historyId}?cert=1`)}
                          className="w-full mt-6 bg-[#2E241B] hover:bg-black text-white font-extrabold py-3 px-4 rounded-xl text-xs shadow transition-all duration-300 flex items-center justify-center gap-1.5"
                        >
                          <Medal size={14} className="text-[#D4AF37]" />
                          <span>प्रमाण पत्र देखें (View Certificate)</span>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>

      </main>

      {/* ==================== ACHIEVEMENT DETAIL CELEBRATION MODAL ==================== */}
      <AnimatePresence>
        {selectedBadge && (
          <div className="fixed inset-0 bg-[#2E241B]/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#FFFDF8] border-2 border-[#D4AF37] w-full max-w-sm rounded-[32px] p-6 text-center shadow-2xl relative overflow-hidden space-y-6"
            >
              {/* Sparkle pattern backglow */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none" />
              <button 
                onClick={() => setSelectedBadge(null)}
                className="absolute top-4 right-4 text-[#786D63] hover:text-[#2E241B] p-1.5 rounded-full hover:bg-[#FFF7ED] transition"
              >
                <X size={18} />
              </button>

              <div className="space-y-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#FFF3D6] to-[#FFEBB5] border border-[#D4AF37] flex items-center justify-center mx-auto text-5xl shadow-md">
                  {selectedBadge.id === 'beginner' ? '📖' :
                   selectedBadge.id === 'devotee' ? '📿' :
                   selectedBadge.id === 'gita_scholar' ? '🔥' :
                   selectedBadge.id === 'ramcharitmanas_reader' ? '🏹' :
                   selectedBadge.id === 'quiz_champion' ? '🏆' :
                   selectedBadge.id === 'perfect_score' ? '💯' :
                   selectedBadge.id === 'daily_learner' ? '⭐' : '👑'}
                </div>
                
                <div>
                  <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${
                    selectedBadge.isUnlocked 
                      ? 'bg-green-500/10 text-green-700 border-green-500/20' 
                      : 'bg-slate-100 text-slate-500 border-transparent'
                  }`}>
                    {selectedBadge.isUnlocked ? 'Unlocked Achievement' : 'Locked Badge'}
                  </span>
                  
                  <h3 className="text-xl font-black text-[#2E241B] mt-3 font-sans">{selectedBadge.title}</h3>
                  <p className="text-xs text-[#786D63] mt-1 font-mukta leading-relaxed">{selectedBadge.desc}</p>
                </div>
              </div>

              <div className="border-t border-[#EFE7DB] pt-4 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#786D63] font-bold">Requirement:</span>
                  <span className="text-[#2E241B] font-bold">{selectedBadge.req}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#786D63] font-bold">Earned Reward:</span>
                  <span className="text-[#FF6B00] font-bold">{selectedBadge.reward}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedBadge(null)}
                className="w-full bg-[#FF6B00] hover:bg-[#CC5200] text-white py-3.5 px-4 rounded-xl text-xs font-black transition shadow-md shadow-[#FF6B00]/20"
              >
                धन्यवाद (Understood)
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
