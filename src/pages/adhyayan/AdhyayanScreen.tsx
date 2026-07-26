import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Mic, MicOff, BookOpen, Video, Heart, Music, Sparkles, 
  PlayCircle, ListVideo, Bell, Play, Flame, Bookmark, Clock, 
  ChevronRight, Download, CheckCircle, TrendingUp, HelpCircle,
  Share2, Volume2, Award, Zap, Settings, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { useRealtimeCollection } from '../../hooks/useRealtimeCollection';
import { EmptyState } from '../../components/EmptyState';
import { SecureImage } from '../../components/common/SecureImage';
import { getVideoThumbnail } from '../../utils/videoUtils';

export const AdhyayanScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('सभी');
  const [isListening, setIsListening] = useState(false);
  const [bookmarkedItems, setBookmarkedItems] = useState<string[]>([]);
  const [dailyProgress, setDailyProgress] = useState(45); // e.g. 45 mins out of 60 mins target
  const [streak, setStreak] = useState(12); // Daily sadhana streak
  const [showNotification, setShowNotification] = useState(false);
  
  const navigate = useNavigate();
  const recognitionRef = useRef<any>(null);

  const { data: dbCategories, loading: loadingCategories } = useRealtimeCollection<any>('categories');
  const { data: dbVideos } = useRealtimeCollection<any>('videos');
  const { data: dbScriptures } = useRealtimeCollection<any>('adhyayan_scriptures');
  const { data: dbPlaylists } = useRealtimeCollection<any>('adhyayan_playlists');
  const { data: dbPdfs } = useRealtimeCollection<any>('adhyayan_pdfs');

  const [scriptures, setScriptures] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [pdfs, setPdfs] = useState<any[]>([]);

  // Load bookmarks
  useEffect(() => {
    const saved = localStorage.getItem('adhyayan_bookmarks');
    if (saved) {
      try {
        setBookmarkedItems(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Merge static scriptures with Firestore dynamic scriptures
  useEffect(() => {
    const mergedMap = new Map<string, any>();
    
    // Default static scriptures
    const POPULAR_STUDY_BOOKS = [
      {
        id: 'bhagavad_gita',
        title: 'Bhagavad Gita',
        hindiTitle: 'श्रीमद्भगवद्गीता',
        desc: 'श्रीकृष्ण-अर्जुन दिव्य संवाद एवं संपूर्ण जीवन दर्शन',
        bgGradient: 'from-orange-500 via-amber-500 to-yellow-500',
        chapterProgress: 'अध्याय 4 / 18',
        readingProgress: 72,
        lastOpened: 'कल खोला गया',
        badge: 'सर्वप्रिय',
        tag: 'गीता'
      },
      {
        id: 'ramcharitmanas',
        title: 'Ramcharitmanas',
        hindiTitle: 'श्रीरामचरितमानस',
        desc: 'गोस्वामी तुलसीदास कृत मर्यादा पुरुषोत्तम राम की पावन गाथा',
        bgGradient: 'from-rose-500 via-orange-500 to-amber-500',
        chapterProgress: 'अयोध्याकाण्ड - दोहा 45',
        readingProgress: 35,
        lastOpened: '3 दिन पहले',
        badge: 'भक्ति रस',
        tag: 'रामचरितमानस'
      },
      {
        id: 'sundarkand',
        title: 'Sundarkand',
        hindiTitle: 'सुन्दरकाण्ड',
        desc: 'हनुमान जी की महिमा, पुरुषार्थ और भक्ति का पावन प्रसंग',
        bgGradient: 'from-amber-600 via-orange-500 to-red-500',
        chapterProgress: 'दोहा 12 / 60',
        readingProgress: 20,
        lastOpened: 'आज सुबह',
        badge: 'संकटमोचन',
        tag: 'साधना'
      },
      {
        id: 'shiv_puran',
        title: 'Shiva Purana',
        hindiTitle: 'शिव पुराण',
        desc: 'भगवान शिव की महिमा, अवतारों और महात्म्य का दिव्य ग्रंथ',
        bgGradient: 'from-indigo-600 via-purple-600 to-pink-500',
        chapterProgress: 'विद्येश्वर संहिता',
        readingProgress: 15,
        lastOpened: 'पिछले सप्ताह',
        badge: 'महाकाल',
        tag: 'साधना'
      }
    ];

    POPULAR_STUDY_BOOKS.forEach(book => {
      mergedMap.set(book.id, book);
    });

    if (dbScriptures && dbScriptures.length > 0) {
      dbScriptures.forEach((item: any) => {
        mergedMap.set(item.id, {
          id: item.id,
          title: item.title,
          hindiTitle: item.title.includes('(') ? item.title.split('(')[0].trim() : item.title,
          desc: item.description || item.introduction || 'पावन धर्मग्रंथ का स्वाध्याय करें।',
          bgGradient: item.bgGradient || 'from-orange-500 via-amber-500 to-yellow-500',
          chapterProgress: `0 / ${item.chapters?.length || 0} Chs`,
          readingProgress: 0,
          lastOpened: 'नया ग्रंथ',
          badge: item.badge || 'नया',
          tag: item.tag || 'साधना'
        });
      });
    }

    setScriptures(Array.from(mergedMap.values()));
  }, [dbScriptures]);

  // Handle dynamic playlists
  useEffect(() => {
    // Default playlists matching fallback requirements
    const FALLBACK_PLAYLISTS = [
      {
        id: 'daily_gita_path',
        name: 'Daily Gita Path',
        hindiName: 'दैनिक गीता पाठ',
        desc: 'हर दिन एक अध्याय का सस्वर पाठ और सरल हिंदी व्याख्या',
        videoCount: 18,
        duration: '12.5 घंटे',
        cover: 'https://images.unsplash.com/photo-1609137144814-633094406248?w=400&auto=format&fit=crop&q=80',
        updatedBadge: 'हाल ही में अपडेट',
        bgTheme: 'from-amber-500/20 to-orange-500/20'
      },
      {
        id: 'ramcharitmanas_complete',
        name: 'Ramcharitmanas Complete',
        hindiName: 'श्रीरामचरितमानस संपूर्ण पाठ',
        desc: 'सात कांडों का संगीतमय चौपाई पाठ अर्थ सहित',
        videoCount: 42,
        duration: '35 घंटे',
        cover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
        updatedBadge: 'लोकप्रिय',
        bgTheme: 'from-red-500/20 to-rose-500/20'
      },
      {
        id: 'hanuman_chalisa_collection',
        name: 'Hanuman Chalisa Collection',
        hindiName: 'हनुमान चालीसा संग्रह',
        desc: 'विभिन्न शास्त्रीय एवं मधुर रागों में चालीसा का संकलन',
        videoCount: 8,
        duration: '2 घंटे',
        cover: 'https://images.unsplash.com/photo-1590073844006-33379778ae09?w=400&auto=format&fit=crop&q=80',
        updatedBadge: 'नया संकलन',
        bgTheme: 'from-orange-500/20 to-yellow-500/20'
      },
      {
        id: 'sundarkand_path',
        name: 'Sundarkand Path',
        hindiName: 'सुन्दरकाण्ड संगीतमय पाठ',
        desc: 'भक्तों के लिए कल्याणकारी श्री सुन्दरकाण्ड का पाठ',
        videoCount: 12,
        duration: '8 घंटे',
        cover: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&auto=format&fit=crop&q=80',
        updatedBadge: 'अनुशंसित',
        bgTheme: 'from-yellow-600/20 to-amber-600/20'
      },
      {
        id: 'krishna_bhajans',
        name: 'Krishna Bhajans',
        hindiName: 'मधुर कृष्ण भजन',
        desc: 'मन को शांति प्रदान करने वाले दिव्य कृष्ण संकीर्तन',
        videoCount: 25,
        duration: '15 घंटे',
        cover: 'https://images.unsplash.com/photo-1561055657-b9e0bf0fa360?w=400&auto=format&fit=crop&q=80',
        updatedBadge: 'ट्रेंडिंग',
        bgTheme: 'from-blue-500/20 to-indigo-500/20'
      },
      {
        id: 'sanskrit_learning',
        name: 'Sanskrit Learning',
        hindiName: 'सरल संस्कृत संभाषण',
        desc: 'देवभाषा संस्कृत बोलना और व्याकरण सीखने की क्रमिक कक्षाएं',
        videoCount: 30,
        duration: '22 घंटे',
        cover: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&auto=format&fit=crop&q=80',
        updatedBadge: 'शिक्षाप्रद',
        bgTheme: 'from-emerald-500/20 to-teal-500/20'
      }
    ];

    if (dbPlaylists && dbPlaylists.length > 0) {
      setPlaylists(dbPlaylists);
    } else {
      setPlaylists(FALLBACK_PLAYLISTS);
    }
  }, [dbPlaylists]);

  // Handle dynamic PDFs/Books
  useEffect(() => {
    setPdfs(dbPdfs || []);
  }, [dbPdfs]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'hi-IN';

      rec.onstart = () => setIsListening(true);
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsListening(false);
      };
      rec.onerror = (err: any) => {
        console.warn("Speech recognition error:", err);
        setIsListening(false);
      };
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  const toggleVoiceSearch = () => {
    if (!recognitionRef.current) {
      alert("Voice search is not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const toggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = bookmarkedItems.includes(id) 
      ? bookmarkedItems.filter(item => item !== id)
      : [...bookmarkedItems, id];
    setBookmarkedItems(updated);
    localStorage.setItem('adhyayan_bookmarks', JSON.stringify(updated));
  };

  // Static Categories matching requirements
  const CATEGORY_TABS = [
    'सभी', 'गीता', 'रामचरितमानस', 'संस्कृत', 'साधना', 'PDF / पुस्तकें', 'वेद', 'उपनिषद', 'स्तोत्र', 'भजन'
  ];

  // Dynamic Categories from Firestore to match
  const processedCategories = dbCategories.length > 0 ? dbCategories.map(cat => {
    const catVideos = dbVideos.filter(v => 
      (v.categoryId === cat.id || v.category === cat.id) && 
      v.publishStatus !== 'draft' && 
      v.isActive !== false
    ).sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    
    const count = catVideos.length;
    const coverImage = cat.image || (catVideos.length > 0 ? getVideoThumbnail(catVideos[0]) : null);
    
    return { ...cat, videoCount: count, coverImage };
  }) : [];

  // Filtering Logic
  const filteredPopularBooks = scriptures.filter(book => {
    // 1. Filter by category tab
    if (selectedCategory !== 'सभी') {
      const categoryMapping: Record<string, string> = {
        'गीता': 'गीता',
        'रामचरितमानस': 'रामचरितमानस',
        'साधना': 'साधना',
        'संस्कृत': 'संस्कृत'
      };
      const expectedTag = categoryMapping[selectedCategory];
      if (expectedTag && book.tag !== expectedTag) return false;
      if (!expectedTag && selectedCategory !== 'सभी') return false; // Non-matching tab
    }
    // 2. Filter by Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTitle = book.title?.toLowerCase().includes(q) || book.hindiTitle?.includes(q);
      const matchDesc = book.desc?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    return true;
  });

  const filteredCategories = processedCategories.filter(cat => {
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return cat.name?.toLowerCase().includes(q) || cat.description?.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredPlaylists = playlists.filter(pl => {
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return pl.name?.toLowerCase().includes(q) || pl.hindiName?.includes(q) || pl.desc?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="flex flex-col min-h-full bg-[#FAF7F2] dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <SEO title="📖 अध्ययन (Study) | Hari Pathshala" description="Learn Bhagavad Gita, Ramcharitmanas, Vedic scriptures, and practice Daily Sadhana." />

      {/* HEADER SECTION WITH PREMIUM GLASSMORPHISM */}
      <div className="relative pt-8 pb-5 px-6 bg-white/70 dark:bg-slate-900/40 border-b border-orange-100/50 dark:border-slate-900/60 backdrop-blur-2xl sticky top-0 z-30 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-400/5 to-amber-500/5 pointer-events-none" />
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl md:text-3xl font-black font-serif text-amber-950 dark:text-amber-100 flex items-center gap-2 tracking-tight"
            >
              📖 अध्ययन <span className="text-xs bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded-full dark:text-orange-400">Study Hub</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-xs font-semibold text-amber-800/80 dark:text-amber-200/60 tracking-wide"
            >
              Bhagavad Gita • Ramcharitmanas • Sanskrit • Daily Sadhana
            </motion.p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/misc/search')}
              className="p-2.5 rounded-full bg-orange-100/40 dark:bg-slate-900 hover:bg-orange-100 dark:hover:bg-slate-800 text-amber-900 dark:text-amber-200 transition relative"
              title="Global Search"
            >
              <Search size={18} strokeWidth={2.5} />
            </button>
            <button 
              onClick={() => navigate('/adhyayan/admin')}
              className="p-2.5 rounded-full bg-amber-500/10 dark:bg-slate-900 hover:bg-amber-500/20 dark:hover:bg-slate-800 text-amber-600 dark:text-amber-400 transition"
              title="Admin Workstation"
            >
              <Settings size={18} strokeWidth={2.5} />
            </button>
            <button 
              onClick={() => setShowNotification(!showNotification)}
              className="p-2.5 rounded-full bg-orange-100/40 dark:bg-slate-900 hover:bg-orange-100 dark:hover:bg-slate-800 text-amber-900 dark:text-amber-200 transition relative"
              title="Daily Sadhana Reminders"
            >
              <Bell size={18} strokeWidth={2.5} className="animate-[swing_2s_ease-in-out_infinite]" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-orange-500 rounded-full border border-white dark:border-slate-950" />
            </button>
          </div>
        </div>

        {/* Dynamic Notification Popover */}
        <AnimatePresence>
          {showNotification && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-6 top-20 w-80 bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-2xl p-4 shadow-xl z-50 text-xs text-slate-600 dark:text-slate-300"
            >
              <div className="flex items-center gap-2 font-bold text-amber-950 dark:text-amber-100 mb-2 pb-2 border-b border-orange-100/60 dark:border-slate-800">
                <Sparkles size={14} className="text-orange-500" /> दैनिक अमृत ज्ञान (Daily Inspiration)
              </div>
              <p className="leading-relaxed">
                "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन..." आज भगवद्गीता के अध्याय 2 के श्लोक 47 का स्वाध्याय करें और अपने चित्त को निर्मल करें।
              </p>
              <button 
                onClick={() => { setShowNotification(false); navigate('/adhyayan/scripture/bhagavad_gita'); }}
                className="mt-3 w-full py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold text-center rounded-xl"
              >
                स्वाध्याय प्रारंभ करें
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PREMIUM SEARCH BAR WITH VOICE SUPPORT */}
        <div className="mt-5 relative max-w-2xl mx-auto">
          <div className="bg-white dark:bg-slate-900/90 border border-orange-200/60 dark:border-slate-800 rounded-2xl pl-4 pr-12 py-3 flex items-center shadow-sm relative focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-400/10 transition-all">
            <Search className="text-orange-400 mr-2.5 shrink-0" size={18} strokeWidth={2.5} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Videos, PDFs, Shlokas, Chapters, Playlists..."
              className="w-full bg-transparent border-none outline-none text-xs md:text-sm font-semibold text-amber-950 dark:text-white"
            />
            <button 
              onClick={toggleVoiceSearch}
              className={`absolute right-2 p-2 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-slate-800'}`}
              title={isListening ? "सुन रहे हैं... बंद करने के लिए क्लिक करें" : "आवाज द्वारा खोजें (Voice Search)"}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          </div>

          {/* Quick suggestion tags */}
          <div className="flex items-center gap-2 mt-2 px-1 overflow-x-auto hide-scrollbar">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-0.5 whitespace-nowrap">
              <TrendingUp size={10} /> खोजें:
            </span>
            {['श्रीमद्भगवद्गीता', 'सुन्दरकाण्ड', 'संस्कृत', 'शिव पुराण', 'भजन'].map(tag => (
              <button
                key={tag}
                onClick={() => setSearchQuery(tag)}
                className="text-[10px] font-bold px-2.5 py-1 bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-200 border border-orange-100/60 dark:border-slate-800 rounded-full hover:border-orange-300 whitespace-nowrap transition cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-8 max-w-7xl mx-auto w-full">
        
        {/* PREMIUM HORIZONTAL CATEGORIES WITH SLIDING AMBIENT EFFECT */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-widest text-amber-800/60 dark:text-slate-400 font-black">स्वाध्याय श्रेणियां (Categories)</h3>
            <span className="text-[10px] font-bold text-orange-500 animate-pulse">स्वाध्याय अमृत</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedCategory(tab)}
                className={`px-4.5 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer border whitespace-nowrap ${
                  selectedCategory === tab
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-transparent shadow-md shadow-orange-500/15 transform scale-105'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-orange-100/50 dark:border-slate-800 hover:bg-orange-50/50 dark:hover:bg-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* TODAY'S SADHANA - PROGRESS CARD */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950 via-[#271509] to-[#120701] p-5 md:p-6 text-white border border-yellow-500/20 shadow-xl">
          {/* Decorative halo */}
          <div className="absolute right-0 top-0 w-44 h-44 bg-gradient-to-br from-yellow-500/10 to-orange-500/0 rounded-full blur-2xl pointer-events-none" />
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center relative z-10">
            {/* Left Column: Progress Info */}
            <div className="md:col-span-8 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-extrabold uppercase tracking-widest bg-yellow-500/20 text-yellow-300 border border-yellow-500/20 px-2.5 py-0.5 rounded-full">
                  दैनिक साधना (Daily Goal)
                </span>
                <span className="flex items-center gap-1 text-xs font-black text-orange-400">
                  <Flame size={14} className="fill-orange-500 text-orange-500" /> {streak} दिवसीय स्ट्रीक!
                </span>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xl font-bold font-serif text-yellow-200">आज का आध्यात्मिक लक्ष्य (Today's Sadhana)</h3>
                <p className="text-xs text-slate-300 font-medium">60 मिनट स्वाध्याय, भगवद्गीता पाठ एवं माला जाप। लक्ष्य पूर्ण करने के निकट हैं!</p>
              </div>

              {/* Progress Bar Info */}
              <div className="grid grid-cols-3 gap-2.5 pt-1.5">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 text-center">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">आज का समय</span>
                  <span className="text-sm font-black text-yellow-300">{dailyProgress} मिनट</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 text-center">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">दैनिक लक्ष्य</span>
                  <span className="text-sm font-black text-slate-200">60 मिनट</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 text-center">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">शेष समय</span>
                  <span className="text-sm font-black text-orange-400">15 मिनट</span>
                </div>
              </div>
            </div>

            {/* Right Column: Progress Circle Indicator */}
            <div className="md:col-span-4 flex flex-col items-center justify-center space-y-3.5 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-white/10">
              <div className="relative w-24 h-24 flex items-center justify-center">
                {/* SVG Circular Progress */}
                <svg className="absolute w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="42" className="text-white/10" strokeWidth="6" fill="transparent" stroke="currentColor" />
                  <circle 
                    cx="48" 
                    cy="48" 
                    r="42" 
                    className="text-yellow-400" 
                    strokeWidth="6" 
                    fill="transparent" 
                    strokeDasharray={2 * Math.PI * 42}
                    strokeDashoffset={2 * Math.PI * 42 * (1 - dailyProgress / 60)}
                    strokeLinecap="round"
                    stroke="currentColor" 
                  />
                </svg>
                <div className="text-center z-10">
                  <span className="text-xl font-black text-yellow-300">{Math.round((dailyProgress / 60) * 100)}%</span>
                  <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">पूर्ण</span>
                </div>
              </div>

              <button 
                onClick={() => {
                  setDailyProgress(60);
                  alert("साधना पूर्ण! आपकी श्रद्धा और भक्ति को प्रणाम। ॐ शांति।");
                }}
                className="px-5 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-amber-950 text-xs font-black rounded-full transition-all duration-300 transform active:scale-95 shadow-lg"
              >
                साधना जारी रखें
              </button>
            </div>
          </div>
        </div>

        {/* POPULAR STUDY SECTION (Horizontal Scriptures Slider) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-serif text-amber-950 dark:text-amber-100 flex items-center gap-2">
                📖 लोकप्रिय स्वाध्याय (Popular Study)
              </h2>
              <p className="text-xs text-slate-400 font-medium">सुलभ एवं पवित्र धर्मग्रंथों का स्वाध्याय सीधे प्रारंभ करें</p>
            </div>
            <span className="text-[10px] font-black text-orange-500 tracking-wider uppercase bg-orange-500/10 px-2.5 py-1 rounded-full">
              4 प्रमुख ग्रंथ
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredPopularBooks.length === 0 ? (
              <p className="col-span-full text-center text-xs text-slate-400 font-medium py-6 bg-white dark:bg-slate-900 rounded-3xl border border-orange-100 dark:border-slate-800">
                कोई ग्रंथ नहीं मिला। कृपया अपनी श्रेणी बदलें।
              </p>
            ) : (
              filteredPopularBooks.map((book) => (
                <div 
                  key={book.id}
                  onClick={() => navigate(`/adhyayan/scripture/${book.id}`)}
                  className="bg-white dark:bg-slate-900 border border-orange-100/60 dark:border-slate-800 rounded-3xl p-5 shadow-sm relative overflow-hidden group hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[220px]"
                >
                  {/* Glassmorphic premium gradient accent cover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${book.bgGradient} opacity-[0.03] group-hover:opacity-[0.06] transition-all duration-300`} />
                  
                  {/* Mandala design element */}
                  <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full border border-orange-400/10 group-hover:scale-125 transition-transform duration-500" />

                  {/* Header info */}
                  <div className="flex items-center justify-between gap-2 relative z-10">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-500/10 px-2.5 py-0.5 rounded-full">
                      {book.badge}
                    </span>
                    <button 
                      onClick={(e) => toggleBookmark(book.id, e)}
                      className="p-1.5 rounded-full hover:bg-orange-100/50 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 transition"
                      title="Bookmark Book"
                    >
                      <Bookmark size={14} className={bookmarkedItems.includes(book.id) ? 'fill-red-500 text-red-500' : ''} />
                    </button>
                  </div>

                  {/* Content details */}
                  <div className="space-y-1.5 relative z-10 pt-4">
                    <span className="text-[9px] font-bold tracking-widest uppercase text-slate-400 block">{book.title}</span>
                    <h3 className="text-lg font-black font-serif text-amber-950 dark:text-amber-100">{book.hindiTitle}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2 leading-relaxed">{book.desc}</p>
                  </div>

                  {/* Progress Section */}
                  <div className="pt-3 border-t border-orange-100/50 dark:border-slate-800 relative z-10 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-bold">{book.lastOpened}</span>
                      <span className="text-orange-500 font-black">{book.chapterProgress}</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-orange-100/40 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500" 
                        style={{ width: `${book.readingProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* NEW SECTION — PLAYLIST (Hidden if empty) */}
        {filteredPlaylists.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-serif text-amber-950 dark:text-amber-100 flex items-center gap-2">
                  <Music size={20} className="text-orange-500" /> दिव्य प्लेलिस्ट (Devotional Playlist)
                </h2>
                <p className="text-xs text-slate-400 font-medium">दैनिक श्रवण, उपासना और साधना के लिए संगीतमय प्लेलिस्ट</p>
              </div>
            </div>

            <div className="flex items-center gap-5 overflow-x-auto hide-scrollbar pb-3">
              {filteredPlaylists.map((pl) => (
                <div 
                  key={pl.id}
                  onClick={() => navigate(`/adhyayan/category/${pl.id}`)}
                  className="min-w-[260px] md:min-w-[280px] bg-white dark:bg-slate-900 border border-orange-100/60 dark:border-slate-800 rounded-3xl p-4 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Background Tint matching brand */}
                  <div className={`absolute inset-0 bg-gradient-to-b ${pl.bgTheme || 'from-amber-500/10 to-orange-500/10'} opacity-10 pointer-events-none`} />

                  {/* Cover Image & Hover play action */}
                  <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-slate-800 mb-3.5">
                    <SecureImage src={pl.cover} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" alt={pl.name} referrerPolicy="no-referrer" />
                    
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-11 h-11 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                        <Play size={18} fill="white" className="ml-1" />
                      </div>
                    </div>

                    {/* Playlist Badge overlay */}
                    <span className="absolute top-2 left-2 text-[8px] font-extrabold uppercase tracking-widest text-white bg-black/60 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-sm">
                      {pl.updatedBadge || 'लोकप्रिय'}
                    </span>

                    <span className="absolute bottom-2 right-2 text-[8px] font-extrabold bg-orange-500 text-white px-2 py-0.5 rounded-md shadow">
                      प्लेलिस्ट
                    </span>
                  </div>

                  {/* Playlist Info */}
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">{pl.name}</h3>
                      <button 
                        onClick={(e) => toggleBookmark(pl.id, e)}
                        className="text-slate-300 hover:text-red-500 p-1 rounded-full transition"
                      >
                        <Bookmark size={14} className={bookmarkedItems.includes(pl.id) ? 'fill-red-500 text-red-500' : ''} />
                      </button>
                    </div>
                    <h4 className="text-base font-black font-serif text-amber-950 dark:text-amber-100 leading-tight">{pl.hindiName}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{pl.desc}</p>
                  </div>

                  {/* Footer specs */}
                  <div className="mt-3.5 pt-3 border-t border-orange-100/50 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold text-slate-400">
                    <span className="flex items-center gap-1"><ListVideo size={12} className="text-orange-500" /> {pl.videoCount} व्याख्यान</span>
                    <span className="flex items-center gap-1"><Clock size={12} className="text-orange-500" /> {pl.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DYNAMIC PDFs/BOOKS SECTION (Hidden if empty) */}
        {pdfs.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-serif text-amber-950 dark:text-amber-100 flex items-center gap-2">
                  <BookOpen size={20} className="text-orange-500" /> पावन पुस्तकें एवं PDFs (PDFs & Books)
                </h2>
                <p className="text-xs text-slate-400 font-medium">शास्त्रों की सुंदर डिजिटल प्रतियां एवं अध्ययन पुस्तकें</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {pdfs.map((pdf: any) => (
                <div 
                  key={pdf.id}
                  onClick={() => navigate(`/adhyayan/pdf/${pdf.id}`)}
                  className="bg-white dark:bg-slate-900 border border-orange-100/60 dark:border-slate-800 rounded-3xl p-4.5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex gap-4 items-center group relative overflow-hidden"
                >
                  <div className="w-16 h-20 bg-orange-100/50 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                    <FileText className="text-orange-500" size={24} />
                  </div>
                  <div className="space-y-1 truncate">
                    <span className="text-[9px] font-bold text-orange-600 bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded-full">{pdf.author || 'संपादक'}</span>
                    <h3 className="text-sm font-black font-serif text-amber-950 dark:text-amber-100 truncate">{pdf.title}</h3>
                    <p className="text-xs text-slate-400 font-medium truncate">{pdf.description || 'पुस्तक का स्वाध्याय करें'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STUDY VIDEOS & LECTURES SECTION (Hidden if empty) */}
        {filteredCategories.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-serif text-amber-950 dark:text-amber-100 flex items-center gap-2">
                  🎥 स्वाध्याय व्याख्यान (Study Videos)
                </h2>
                <p className="text-xs text-slate-400 font-medium">वीडियो के माध्यम से वैदिक विषयों और व्याख्यानों का अध्ययन करें</p>
              </div>
            </div>

            {loadingCategories ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-400 font-bold mt-2">व्याख्यान लोड हो रहे हैं...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCategories.map((cat: any, index: number) => (
                  <motion.div
                    key={cat.id || index}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => navigate(`/adhyayan/category/${cat.id}`)}
                    className="bg-white dark:bg-slate-900 border border-orange-100/60 dark:border-slate-800 rounded-3xl p-4.5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                  >
                    <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-slate-800 mb-4">
                      {cat?.coverImage || "/logo.png" ? (
                        <SecureImage src={cat?.coverImage || "/logo.png"} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" alt={cat?.name || "Category"} referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-400 to-amber-500 opacity-95 group-hover:scale-105 transition-transform duration-500"></div>
                      )}
                      
                      {/* Custom glassmorphic play button overlay */}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="flex flex-col items-center gap-1.5">
                           <PlayCircle size={36} className="text-white fill-white/20" />
                           <span className="text-[10px] text-white font-extrabold uppercase tracking-widest">व्याख्यान देखें</span>
                        </div>
                      </div>

                      {/* Videos count badge overlay */}
                      <span className="absolute bottom-2.5 right-2.5 text-[9px] font-black uppercase tracking-widest text-white bg-black/75 px-2.5 py-0.5 rounded-full border border-white/10 backdrop-blur-md flex items-center gap-1">
                        <ListVideo size={10} className="text-orange-500" /> {cat.videoCount || 0} व्याख्यान
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-black font-serif text-amber-950 dark:text-amber-100 group-hover:text-orange-600 transition-colors">{cat?.name || "Category"}</h3>
                      {cat.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{cat.description}</p>
                      )}
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-orange-100/50 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-1">
                        <Zap size={10} className="fill-orange-500" /> पाठ्य सामग्री उपलब्ध
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">
                        अध्ययन करें <ChevronRight size={12} className="text-orange-500" />
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
