import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore } from '../../store/useAppStore';
import { 
  Bell, Share2, Download, Moon, Sun, Calendar, ChevronRight, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SEO } from '../../components/SEO';
import { useRealtimeCollection } from '../../hooks/useRealtimeCollection';
import { useAutoPanchang } from '../../hooks/useAutoPanchang';
import { Link, useNavigate } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { doc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { getISTDateInfo } from '../../services/naamJapService';
import { SecureImage } from '../../components/common/SecureImage';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { HomeSectionRenderer } from '../../components/home/HomeSectionRenderer';

class SectionErrorBoundary extends React.Component<{ children: React.ReactNode, sectionTitle: string }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error(`Error in section [${this.props.sectionTitle}]:`, error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-5 bg-white dark:bg-slate-900 rounded-[28px] border border-red-100 dark:border-red-950/40 text-center space-y-2 py-8">
          <p className="text-xl">⚠️</p>
          <p className="text-xs font-bold text-red-600 dark:text-red-400">Unable to load {this.props.sectionTitle}</p>
          <button 
            onClick={() => this.setState({ hasError: false })} 
            className="text-[10px] bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-950/40 dark:text-red-300 font-bold px-3 py-1.5 rounded-xl transition"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const HomeScreen = () => {
  const { user, userData } = useAuthStore();
  const { isDarkMode, toggleDarkMode } = useAppStore();
  const navigate = useNavigate();
  const userName = user?.displayName || userData?.name || 'Bhakt';
  const profileImg = user?.photoURL || userData?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`;
  
  const { homepageSections, settings } = useAppSettings();

  const handleToggleDarkMode = async () => {
    toggleDarkMode();
    const newTheme = !isDarkMode;
    if (user && user.uid) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { settings: { isDarkMode: newTheme } }, { merge: true });
      } catch (error) {
        console.error("Error saving theme preference:", error);
      }
    }
  };

  // Realtime Collections with robust background syncing
  const { data: dbQuotes, loading: loadingQuotes } = useRealtimeCollection<any>('quotes');
  const { data: dbVideos, loading: loadingVideos } = useRealtimeCollection<any>('videos');
  const { data: dbProducts, loading: loadingProducts } = useRealtimeCollection<any>('products');
  const { data: dbCategories, loading: loadingCategories } = useRealtimeCollection<any>('categories');
  const { panchang: autoPanchang, loading: loadingPanchang } = useAutoPanchang();
  const { data: dbTestimonials } = useRealtimeCollection<any>('testimonials');
  const { data: dbEvents } = useRealtimeCollection<any>('events');
  
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedQuoteForShare, setSelectedQuoteForShare] = useState<any>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [userLikes, setUserLikes] = useState<string[]>([]);
  const [userBookmarks, setUserBookmarks] = useState<string[]>([]);

  // Leaderboard state & smooth infinite scrolling logic
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [userCertificatesCount, setUserCertificatesCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = collection(db, 'quiz_global_leaderboard');
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as any));
      list.sort((a, b) => {
        const scoreDiff = (b.score || 0) - (a.score || 0);
        if (scoreDiff !== 0) return scoreDiff;
        return (b.xp || 0) - (a.xp || 0);
      });
      setLeaderboardData(list);
      setLeaderboardLoading(false);
    }, (err) => {
      console.warn("Home screen global leaderboard subscription failed:", err);
      setLeaderboardLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const certsRef = collection(db, 'userStats', user.uid, 'certificates');
    const unsub = onSnapshot(certsRef, (snap) => {
      setUserCertificatesCount(snap.size);
    }, (err) => {
      console.warn("Home screen certificates counter subscription failed:", err);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || leaderboardData.length === 0 || isPaused) return;

    let animationFrameId: number;
    const scrollSpeed = 0.55;

    const scroll = () => {
      if (!container) return;
      container.scrollTop += scrollSpeed;
      
      const halfHeight = container.scrollHeight / 2;
      if (container.scrollTop >= halfHeight) {
        container.scrollTop = 0;
      }
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, [leaderboardData, isPaused]);

  // AI Guru Local Input
  const [aiGuruInput, setAiGuruInput] = useState("");

  // Time of Day Spiritual Greeting
  const spiritualGreeting = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return { text: "शुभ प्रभात", sub: "May your morning be filled with peace." };
    if (hours < 17) return { text: "जय सियाराम", sub: "Have a blessed and mindful afternoon." };
    return { text: "शुभ संध्या", sub: "May the divine light guide your evening." };
  }, []);

  // Today's calculated Lucky Color & Devata based on weekdays
  const vedicMetadata = useMemo(() => {
    const day = new Date().getDay();
    const data = [
      { color: "Saffron / Red", name: "Sun God / Surya Dev", colorHex: "#FF4500", devata: "Lord Rama" },
      { color: "Milky White", name: "Chandra Dev", colorHex: "#F0F8FF", devata: "Lord Shiva" },
      { color: "Bright Red", name: "Mangal Dev", colorHex: "#E53E3E", devata: "Lord Hanuman" },
      { color: "Pista Green", name: "Budh Dev", colorHex: "#48BB78", devata: "Lord Ganesha" },
      { color: "Golden Yellow", name: "Guru Dev", colorHex: "#ECC94B", devata: "Lord Vishnu" },
      { color: "Cream / White", name: "Shukra Dev", colorHex: "#FFFDF0", devata: "Goddess Lakshmi" },
      { color: "Royal Blue / Black", name: "Shani Dev", colorHex: "#1A202C", devata: "Lord Shani / Hanuman" },
    ];
    return data[day] || data[0];
  }, []);

  useEffect(() => {
    let unsubscribe: () => void;
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserLikes(docSnap.data().likedQuotes || []);
          setUserBookmarks(docSnap.data().bookmarks || []);
        }
      }, (err) => {
        console.warn("Home screen user likes/bookmarks subscription failed:", err);
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  const [chantingStats, setChantingStats] = useState(() => {
    try {
      if (user) {
        const stored = localStorage.getItem(`hp_cache_naamJap_${user.uid}`);
        if (stored) {
          const data = JSON.parse(stored);
          const { dateStr } = getISTDateInfo();
          const isToday = data.lastActiveDate === dateStr;
          return {
            todayJap: isToday ? (data.todayCount || 0) : 0,
            lifetimeJap: data.lifetimeCount || 0,
            streak: data.currentStreak || 0
          };
        }
      }
    } catch (e) {
      console.warn("Error parsing cached chanting stats", e);
    }
    return {
      todayJap: 0,
      lifetimeJap: 0,
      streak: 0
    };
  });

  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, 'naamJap', user.uid);

    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const { dateStr } = getISTDateInfo();
        const isToday = data.lastActiveDate === dateStr;
        
        setChantingStats({
          todayJap: isToday ? (data.todayCount || 0) : 0,
          lifetimeJap: data.lifetimeCount || 0,
          streak: data.currentStreak || 0
        });
      } else {
        setChantingStats({
          todayJap: 0,
          lifetimeJap: 0,
          streak: 0
        });
      }
    }, (err) => {
      console.warn("Home screen chanting stats subscription failed:", err);
    });

    return () => {
      unsub();
    };
  }, [user]);

  const [quizHomeStats, setQuizHomeStats] = useState(() => {
    try {
      if (user) {
        const stored = localStorage.getItem(`hp_cache_userStats_${user.uid}`);
        if (stored) {
          const data = JSON.parse(stored);
          return {
            todayQuizName: "भगवद् गीता प्रश्नोत्तरी",
            todayQuizId: "",
            totalSubjects: 4,
            totalQuestions: 19,
            lastScore: data.quizLastScore || 0,
            currentStreak: data.quizStreak || 0,
            overallScore: data.quizAllTimeScore || 0
          };
        }
      }
    } catch (e) {
      console.warn("Error parsing cached quiz stats", e);
    }
    return {
      todayQuizName: "भगवद् गीता प्रश्नोत्तरी",
      todayQuizId: "",
      totalSubjects: 4,
      totalQuestions: 19,
      lastScore: 0,
      currentStreak: 0,
      overallScore: 0
    };
  });

  useEffect(() => {
    if (!user) return;

    const mainStatsRef = doc(db, 'userStats', user.uid);
    const unsubUserStats = onSnapshot(mainStatsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setQuizHomeStats(prev => ({
          ...prev,
          currentStreak: data.quizStreak || 0,
          lastScore: data.quizLastScore || 0,
          overallScore: data.quizAllTimeScore || 0
        }));
      }
    }, (err) => console.warn("Error loading userStats in home:", err));

    const unsubSubjects = onSnapshot(collection(db, 'quiz_subjects'), (snap) => {
      setQuizHomeStats(prev => ({
        ...prev,
        totalSubjects: snap.size || 4
      }));
    }, (err) => console.warn("Error loading quiz_subjects in home:", err));

    const unsubQuizzes = onSnapshot(collection(db, 'quiz_quizzes'), (snap) => {
      const todayQ = snap.docs.find(d => d.data().isTodayQuiz && d.data().isPublished);
      if (todayQ) {
        setQuizHomeStats(prev => ({
          ...prev,
          todayQuizName: todayQ.data().name,
          todayQuizId: todayQ.id
        }));
      }
    }, (err) => console.warn("Error loading quiz_quizzes in home:", err));

    const unsubQuestions = onSnapshot(collection(db, 'quiz_questions'), (snap) => {
      setQuizHomeStats(prev => ({
        ...prev,
        totalQuestions: snap.size || 19
      }));
    }, (err) => console.warn("Error loading quiz_questions in home:", err));

    return () => {
      unsubUserStats();
      unsubSubjects();
      unsubQuizzes();
      unsubQuestions();
    };
  }, [user]);

  const userRankInfo = useMemo(() => {
    if (!user) return null;
    const index = leaderboardData.findIndex(item => item.id === user.uid);
    const inTop100 = index !== -1;
    const rankNum = index !== -1 ? index + 1 : 245;
    const userRow = inTop100 ? leaderboardData[index] : null;

    return {
      rank: rankNum,
      xp: userRow?.xp || quizHomeStats.overallScore || 0,
      badge: userRow?.badge || 'Sadhak',
    };
  }, [user, leaderboardData, quizHomeStats]);

  const handleShareQuote = (quote: any) => {
    setSelectedQuoteForShare(quote);
    setShowShareModal(true);
  };

  const downloadQuoteImage = async () => {
    if (!shareCardRef.current) return;
    setIsGeneratingImage(true);
    try {
      const dataUrl = await toPng(shareCardRef.current, {
        pixelRatio: 2, 
        backgroundColor: 'transparent',
        fontEmbedCSS: '', 
      });
      const link = document.createElement('a');
      link.download = `haripathshala-quote-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      
      if (navigator.share) {
        try {
          const config: any = settings?.shareConfig || { baseUrl: 'https://haripathshala.online', defaultTitle: 'Hari Pathshala', defaultMessage: 'Check this out!', socialCaption: '', footerMessage: '' };
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], 'quote.png', { type: 'image/png' });
          
          const appUrl = config.appUrl || 'https://play.google.com/store/apps/details?id=com.haripathshala';
          const quoteUrl = selectedQuoteForShare ? `\nContent ID:\n${selectedQuoteForShare.id}` : '';
          const combinedText = `🌿 Hari Pathshala\n\n${config.defaultMessage || ''}\n\n📲 Install Hari Pathshala:\n${appUrl}\n${quoteUrl}\n\n${config.socialCaption || '🙏 Jai Siyaram'}`.trim();
          
          await navigator.share({
            title: config.defaultTitle,
            text: combinedText,
            files: [file]
          });
        } catch (e) {
          console.log('Native sharing failed or cancelled', e);
        }
      }
      setShowShareModal(false);
    } catch (error) {
      console.error('Failed to generate image', error);
      alert('Failed to generate shareable image.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleAskGuru = (text: string) => {
    if (!text.trim()) return;
    navigate(`/aiguru?prompt=${encodeURIComponent(text)}`);
  };

  const containerVariants: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
  };

  // Fallbacks and caching arrays
  const quotes = dbQuotes;
  const videos = dbVideos;
  const products = dbProducts;
  const categories = dbCategories;
  const testimonials = dbTestimonials;
  const events = dbEvents;

  return (
    <div className="flex flex-col min-h-full bg-gradient-to-b from-orange-50 via-amber-50/20 to-orange-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 transition-colors duration-500 relative overflow-hidden pb-10">
      <SEO title="Home | Hari Pathshala" description="Your spiritual journey begins here with Hari Pathshala." />

      {/* ================= BACKGROUND SACRED GRAPHICS ================= */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] text-saffron/5 dark:text-saffron/[0.03] pointer-events-none select-none z-0">
        <svg viewBox="0 0 100 100" className="w-full h-full animate-[spin_240s_linear_infinite]">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.3" />
          <g transform="translate(50,50)">
            {[...Array(24)].map((_, i) => (
              <g key={i} transform={`rotate(${i * 15})`}>
                <path d="M0,-40 C3,-30 6,-30 0,-15 C-6,-30 -3,-30 0,-40 Z" fill="currentColor" opacity="0.8"/>
                <path d="M0,-25 C2,-20 4,-20 0,-5 C-4,-20 -2,-20 0,-25 Z" fill="currentColor" opacity="0.4"/>
                <circle cx="0" cy="-42" r="1" fill="currentColor" />
              </g>
            ))}
          </g>
          <path d="M50,15 A35,35 0 0,0 50,85 A35,35 0 0,0 50,15" fill="none" stroke="currentColor" strokeWidth="0.2" />
        </svg>
      </div>

      <div className="absolute top-[500px] left-[-50px] w-56 h-56 text-saffron/5 dark:text-saffron/[0.02] pointer-events-none select-none">
        <svg viewBox="0 0 120 120" className="w-full h-full animate-[pulse_10s_ease-in-out_infinite]">
          <path d="M60,10 C50,45 10,50 0,70 C35,70 50,55 60,30 C70,55 85,70 120,70 C110,50 70,45 60,10 Z" fill="currentColor" />
        </svg>
      </div>
      <div className="absolute top-[1100px] right-[-50px] w-64 h-64 text-orange-500/5 dark:text-saffron/[0.01] pointer-events-none select-none">
        <svg viewBox="0 0 120 120" className="w-full h-full animate-[pulse_12s_ease-in-out_infinite]">
          <path d="M60,10 C50,45 10,50 0,70 C35,70 50,55 60,30 C70,55 85,70 120,70 C110,50 70,45 60,10 Z" fill="currentColor" />
        </svg>
      </div>

      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
        <div className="absolute top-[200px] left-[15%] w-3 h-3 rounded-full bg-saffron-light/20 blur-sm animate-pulse" />
        <div className="absolute top-[350px] right-[10%] w-4 h-4 rounded-full bg-golden/20 blur-[2px] animate-bounce" style={{ animationDuration: '6s' }} />
        <div className="absolute top-[800px] left-[8%] w-2 h-2 rounded-full bg-orange-accent/30 blur-[1px] animate-pulse" />
        <div className="absolute top-[1300px] right-[12%] w-5 h-5 rounded-full bg-saffron/15 blur-sm animate-bounce" style={{ animationDuration: '8s' }} />
      </div>

      {/* ================= STICKY PREMIUM HEADER ================= */}
      <header className="px-5 pt-8 pb-4 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl sticky top-0 z-30 border-b border-orange-100/40 dark:border-slate-800/40 shadow-[0_4px_30px_rgba(255,153,51,0.02)] transition-all duration-300">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          
          <div 
            className="flex items-center gap-3.5 cursor-pointer group" 
            onClick={() => navigate('/profile')} 
            role="button"
          >
            <div className="relative">
              <div className="absolute inset-[-2px] rounded-full bg-gradient-to-r from-amber-400 via-saffron to-orange-accent animate-spin-slow opacity-80 group-hover:opacity-100 transition-opacity" style={{ animationDuration: '12s' }} />
              <SecureImage src={profileImg} alt="Profile" className="w-11 h-11 rounded-full object-cover shrink-0 relative z-10 border-2 border-orange-50 dark:border-slate-900 shadow-md" />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 z-20"></span>
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-saffron-dark dark:text-saffron-light">
                  {spiritualGreeting.text}
                </span>
                <span className="animate-wiggle text-xs">🙏</span>
              </div>
              <h1 className="text-base font-bold font-sans tracking-tight text-brown-dark dark:text-white leading-tight flex items-center gap-1 group-hover:text-saffron transition-colors">
                {userName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button 
              onClick={handleToggleDarkMode}
              className="p-2.5 bg-orange-50/80 dark:bg-slate-800 rounded-full text-brown-dark dark:text-saffron-light hover:bg-orange-100 dark:hover:bg-slate-700 transition-all duration-300 transform active:scale-90 border border-orange-100/50 dark:border-slate-700/50 shadow-sm"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun size={18} className="animate-pulse" /> : <Moon size={18} />}
            </button>

            <button 
              onClick={() => navigate('/profile/notifications')} 
              className="p-2.5 bg-orange-50/80 dark:bg-slate-800 rounded-full text-brown-dark dark:text-white hover:bg-orange-100 dark:hover:bg-slate-700 transition-all duration-300 transform active:scale-90 border border-orange-100/50 dark:border-slate-700/50 relative shadow-sm"
              aria-label="View Notifications"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN SCROLLABLE BODY ================= */}
      <div className="px-5 pt-4 space-y-8 flex-1 max-w-xl mx-auto w-full z-10 relative">
        
        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="show"
          className="space-y-8"
        >
          
          {/* ================= HERO BANNER ================= */}
          <motion.div
            variants={itemVariants}
            className="relative rounded-[32px] overflow-hidden bg-gradient-to-r from-orange-600 via-saffron to-amber-500 shadow-xl border border-orange-400/20 text-white p-6 md:p-8 flex flex-col justify-between min-h-[180px] group"
          >
            <div className="absolute inset-0 bg-radial-gradient from-white/10 via-transparent to-transparent opacity-80 group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
            
            <div className="absolute right-[-20px] bottom-[-20px] w-48 h-48 opacity-15 text-white pointer-events-none select-none">
              <svg viewBox="0 0 100 100" className="w-full h-full animate-[spin_120s_linear_infinite]">
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                <g transform="translate(50,50)">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <path key={i} d="M0,-30 C2,-20 4,-20 0,-5 C-4,-20 -2,-20 0,-30 Z" fill="currentColor" transform={`rotate(${i * 30})`} id={`mandala-petal-${i}`} />
                  ))}
                </g>
              </svg>
            </div>

            <div className="relative z-10 space-y-3 max-w-[75%]">
              <span className="bg-white/20 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border border-white/10 shadow-sm inline-block" id="banner-badge">
                🔱 JAI SIYARAM
              </span>
              <h2 className="text-xl md:text-2xl font-black font-sans leading-tight text-white drop-shadow-md" id="banner-title">
                अपनी आध्यात्मिक पाठशाला में स्वागत है
              </h2>
              <p className="text-xs text-white/90 font-mukta leading-relaxed drop-shadow-sm" id="banner-desc">
                "ज्ञानं परमं बलम्" — Discover authentic Hindu scriptures, spiritual courses, daily panchang, and divine products.
              </p>
            </div>

            <div className="relative z-10 pt-4 flex gap-3">
              <button
                id="banner-btn-quiz"
                onClick={() => navigate('/quiz')}
                className="px-4 py-2 bg-white text-saffron-dark font-sans font-bold text-xs rounded-xl shadow-md hover:bg-orange-50 active:scale-95 transition"
              >
                Start Daily Quiz
              </button>
              <button
                id="banner-btn-adhyayan"
                onClick={() => navigate('/adhyayan')}
                className="px-4 py-2 bg-saffron-dark/40 text-white font-sans font-bold text-xs rounded-xl border border-white/20 hover:bg-saffron-dark/60 active:scale-95 transition"
              >
                Explore Scripture
              </button>
            </div>
          </motion.div>

          {homepageSections.map(section => {
            if (!section.show) return null;
            
            return (
              <SectionErrorBoundary sectionTitle={section.title || section.type} key={section.id}>
                <HomeSectionRenderer
                  section={section}
                  quotes={quotes}
                  videos={videos}
                  products={products}
                  categories={categories}
                  panchang={autoPanchang}
                  testimonials={testimonials}
                  events={events}
                  aiGuruInput={aiGuruInput}
                  setAiGuruInput={setAiGuruInput}
                  handleAskGuru={handleAskGuru}
                  chantingStats={chantingStats}
                  quizHomeStats={quizHomeStats}
                  userRankInfo={userRankInfo}
                  leaderboardLoading={leaderboardLoading}
                  leaderboardData={leaderboardData}
                  scrollContainerRef={scrollContainerRef}
                  setIsPaused={setIsPaused}
                  isPaused={isPaused}
                  profileImg={profileImg}
                  userName={userName}
                  userCertificatesCount={userCertificatesCount}
                  handleShareQuote={handleShareQuote}
                  loadingQuotes={loadingQuotes}
                  loadingVideos={loadingVideos}
                  loadingCategories={loadingCategories}
                  loadingProducts={loadingProducts}
                  loadingPanchang={loadingPanchang}
                  user={user}
                />
              </SectionErrorBoundary>
            );
          })}

        </motion.div>
      </div>

      {/* ================= SHARE QUOTE MODAL (Optimized for gorgeous previews) ================= */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/75 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-[30px] overflow-hidden shadow-2xl w-full max-w-sm border border-orange-100 dark:border-slate-700"
            >
              <div ref={shareCardRef} className="relative bg-gradient-to-br from-[#FF4500] to-[#E65100] p-6 text-white min-h-[380px] flex flex-col justify-between overflow-hidden rounded-[24px]" id="share-card-preview">
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff_0.6px,transparent_0.6px)] [background-size:16px_16px] opacity-[0.05] pointer-events-none" />
                <div className="absolute top-4 left-4 w-10 h-10 border-t-2 border-l-2 opacity-20 border-white" />
                <div className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 opacity-20 border-white" />
                <div className="absolute bottom-4 left-4 w-10 h-10 border-b-2 border-l-2 opacity-20 border-white" />
                <div className="absolute bottom-4 right-4 w-10 h-10 border-b-2 border-r-2 opacity-20 border-white" />
                
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[120px] font-bold opacity-[0.04] pointer-events-none select-none z-0">
                  🕉
                </div>

                <div className="flex justify-between items-center relative z-10 w-full mb-3 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2 shrink-0">
                    <img 
                      src="/logo.png" 
                      alt="Hari Pathshala Logo" 
                      className="w-8 h-8 rounded-full object-cover shadow-sm border border-white/30 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-left flex flex-col justify-center">
                      <h4 className="text-[9px] font-black tracking-widest leading-none m-0 uppercase text-white">
                        HARI PATHSHALA
                      </h4>
                      <p className="text-[6px] font-bold tracking-wider leading-none mt-1 uppercase text-orange-100">
                        SANATAN VEDIC ACADEMY
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 py-0.5 px-2 rounded-full border border-white/15 bg-white/10 backdrop-blur-md shrink-0">
                    <SecureImage src={profileImg} className="w-4 h-4 aspect-square shrink-0 rounded-full border border-white/20 shadow-sm" alt="user" />
                    <div className="text-left flex flex-col justify-center max-w-[65px]">
                      <span className="text-[7px] font-black tracking-wide truncate leading-none text-white">
                        {userName}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-center py-4 relative z-10 flex-1 flex flex-col justify-center items-center space-y-3 w-full">
                  <span className="text-2xl leading-none opacity-20 font-serif text-white">“</span>
                  <h3 className="font-bold text-lg font-devanagari leading-relaxed text-white drop-shadow-sm px-3">
                    {selectedQuoteForShare?.text}
                  </h3>
                  {selectedQuoteForShare?.meaning && (
                    <p className="text-[10px] opacity-80 leading-relaxed font-mukta italic text-orange-50 px-3">
                      {selectedQuoteForShare?.meaning}
                    </p>
                  )}
                  <span className="text-2xl leading-none opacity-20 font-serif text-white">”</span>
                  
                  <div className="inline-flex items-center justify-center gap-1.5 px-3.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-widest shadow-sm border border-white/20 bg-white/10">
                    <span>—</span>
                    <span>{selectedQuoteForShare?.source || "Hari Pathshala"}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center relative z-10 border-t border-white/15 pt-3 w-full mt-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-white p-0.5 rounded-lg shadow-sm border border-neutral-100 shrink-0">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://haripathshala.online/quotes?id=${selectedQuoteForShare?.id}`)}`}
                        alt="Scan QR"
                        className="w-8 h-8"
                      />
                    </div>
                    <div className="text-left space-y-0.5">
                      <p className="text-[8px] font-black uppercase tracking-wider leading-none text-white">
                        HARI PATHSHALA APP
                      </p>
                      <p className="text-[5.5px] font-semibold leading-none text-orange-100">
                        Scan to view quote online
                      </p>
                      <p className="text-[7px] font-bold tracking-tight pt-0.5 leading-none text-white">
                        haripathshala.online
                      </p>
                    </div>
                  </div>

                  <div className="text-right space-y-0.5">
                    <p className="text-[6.5px] font-bold text-orange-100">Instagram: @hari_pathshala</p>
                    <p className="text-[6.5px] font-bold text-orange-100">YouTube: Hari Pathshala</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 space-y-2">
                <button 
                  onClick={downloadQuoteImage} 
                  disabled={isGeneratingImage}
                  className="w-full py-3.5 bg-gradient-to-r from-saffron to-orange-accent text-white rounded-xl font-bold hover:shadow-lg hover:brightness-105 active:scale-98 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 text-xs"
                >
                  {isGeneratingImage ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Download size={18} />}
                  {isGeneratingImage ? 'Generating Image...' : 'Save & Share Image'}
                </button>
                <button 
                  onClick={() => setShowShareModal(false)} 
                  className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-xs"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
