import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, BookOpen, Search, Settings, Volume2, Bookmark, 
  Highlighter, Edit3, Sparkles, ChevronLeft, ChevronRight, 
  Menu, X, Type, Sun, Moon, Info, CheckCircle2, Play, Pause,
  Share2, Save, FileText, BrainCircuit, RefreshCw, Layers,
  Trophy, FileDown, ShieldCheck, Award, Heart, HelpCircle,
  Compass, List, ExternalLink, MessageSquare, Download, Check, Clock, Eye
} from 'lucide-react';
import { SEO } from '../../components/SEO';
import { scriptureData, Verse, Chapter, Scripture } from './scriptureData';
import { useAuthStore } from '../../store/useAuthStore';
import { db } from '../../firebase/config';
import { doc, setDoc, getDoc, collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import Markdown from 'react-markdown';
import { toPng } from 'html-to-image';
import confetti from 'canvas-confetti';
import { getAppOrigin, generateShareLink } from '../../utils/urlHelper';

export const ScriptureReaderScreen = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [scripture, setScripture] = useState<any>(() => {
    return scriptureData[id || 'bhagavad_gita'] || scriptureData.bhagavad_gita;
  });

  // Dynamic scripture fetching from Firestore
  useEffect(() => {
    const staticData = scriptureData[id || 'bhagavad_gita'] || scriptureData.bhagavad_gita;
    setScripture(staticData);

    const fetchDynamicScripture = async () => {
      try {
        if (!id) return;
        const ref = doc(db, 'adhyayan_scriptures', id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const dbData = snap.data();
          setScripture((prev: any) => ({
            ...prev,
            ...dbData,
            chapters: dbData.chapters || prev.chapters || []
          }));
        }
      } catch (err) {
        console.error("Failed to load dynamic scripture details:", err);
      }
    };
    fetchDynamicScripture();
  }, [id]);

  // Active Main Tabs: 'video' | 'reading'
  const [activeTab, setActiveTab] = useState<'video' | 'reading'>('reading');
  
  // Chapter View state: null means showing book info/chapter list, non-null means reading a chapter
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  
  // Selected Chapter View Tabs: 'read' | 'philosophy' | 'quiz-certificate'
  const [chapterTab, setChapterTab] = useState<'read' | 'philosophy' | 'quiz-certificate'>('read');
  
  // Verse Reading state (when inside selected chapter)
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const pendingVerseIndexRef = useRef<number | null>(null);

  // Layout & Styling Control
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'sepia'>('sepia');
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl' | 'xxl'>('lg');
  const [lineHeight, setLineHeight] = useState<'compact' | 'normal' | 'spacious'>('normal');
  const [readingWidth, setReadingWidth] = useState<'narrow' | 'medium' | 'wide' | 'full'>('medium');
  const [isAutoScrollActive, setIsAutoScrollActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sequentialLearning, setSequentialLearning] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Verse Search
  const [verseSearchQuery, setVerseSearchQuery] = useState('');
  const [verseSearchResults, setVerseSearchResults] = useState<any[]>([]);
  const [isSearchingVerses, setIsSearchingVerses] = useState(false);

  // Copy and Share Feedback States
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // Audio / Chanting Recitation States
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Personalization / User History States (from Firestore)
  const [bookmarks, setBookmarks] = useState<string[]>([]); // "scriptureId_verseId"
  const [highlights, setHighlights] = useState<string[]>([]); // "scriptureId_verseId"
  const [notes, setNotes] = useState<Record<string, string>>({}); // verseId -> note
  const [activeNoteText, setActiveNoteText] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Reading Time Tracker (Simulated in local storage/session)
  const [readingTime, setReadingTime] = useState<number>(0);

  // Video Tab States
  const [videos, setVideos] = useState<any[]>([]);
  const [continueWatching, setContinueWatching] = useState<any>(null);

  // Dynamic Scripture Loading / Generation states
  const [chapterVerses, setChapterVerses] = useState<Verse[]>([]);
  const [totalVersesInChapter, setTotalVersesInChapter] = useState<number>(0);
  const [versesPage, setVersesPage] = useState<number>(1);
  const [isLoadingVerses, setIsLoadingVerses] = useState<boolean>(false);
  const [hasMoreVerses, setHasMoreVerses] = useState<boolean>(true);

  // Firestore Reactive Stats & Progress Listeners
  const [chapterCertificates, setChapterCertificates] = useState<Record<string, any>>({});
  const [readingProgressDocs, setReadingProgressDocs] = useState<Record<string, any>>({});
  
  // AI Teaching Material cache & generation states
  const [selectedAIContentType, setSelectedAIContentType] = useState<string>('summary');
  const [aiContent, setAiContent] = useState<any>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Certificate Modal & Rendering states
  const [showCertModal, setShowCertModal] = useState<any>(null); // holds the cert payload to render
  const [isExporting, setIsExporting] = useState(false);
  const certificateRef = useRef<HTMLDivElement | null>(null);

  // Active reading position calculations
  const activeVerse = chapterVerses.find(v => v.number === (currentVerseIndex + 1)) 
    || selectedChapter?.verses?.find(v => v.number === (currentVerseIndex + 1)) 
    || (chapterVerses.length > 0 ? chapterVerses[0] : (selectedChapter?.verses && selectedChapter.verses[0]));
  const currentVerseGlobalId = activeVerse ? `${scripture.id}_${activeVerse.id}` : '';

  // Track Reading Time
  useEffect(() => {
    const interval = setInterval(() => {
      setReadingTime(prev => {
        const updated = prev + 1;
        localStorage.setItem(`hp_reading_time_${scripture.id}`, updated.toString());
        return updated;
      });
    }, 60000); // every minute

    const saved = localStorage.getItem(`hp_reading_time_${scripture.id}`);
    if (saved) setReadingTime(parseInt(saved, 10));

    return () => clearInterval(interval);
  }, [scripture.id]);

  // Fetch bookmarks, highlights, and notes on mount
  useEffect(() => {
    if (!user) return;
    const fetchUserData = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setBookmarks(data.bookmarks || []);
          setHighlights(data.highlights || []);
          setNotes(data.scriptureNotes || {});
        }
      } catch (err) {
        console.error('Error fetching reader details:', err);
      }
    };
    fetchUserData();
  }, [user]);

  // Listen to verified Certificates earned by the user
  useEffect(() => {
    if (!user) return;
    const certRef = collection(db, 'userStats', user.uid, 'certificates');
    const unsub = onSnapshot(certRef, (snap) => {
      const certs: Record<string, any> = {};
      snap.forEach(doc => {
        const d = doc.data();
        if (d.subjectId && d.chapterId) {
          certs[`${d.subjectId}_${d.chapterId}`] = d;
        }
      });
      setChapterCertificates(certs);
    });
    return unsub;
  }, [user]);

  // Listen to Reading Progress docs per chapter
  useEffect(() => {
    if (!user) return;
    const progRef = collection(db, 'userStats', user.uid, 'reading_progress');
    const unsub = onSnapshot(progRef, (snap) => {
      const progs: Record<string, any> = {};
      snap.forEach(doc => {
        progs[doc.id] = doc.data();
      });
      setReadingProgressDocs(progs);
    });
    return unsub;
  }, [user]);

  // Fetch relevant videos and continue watching progress
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const snap = await getDocs(collection(db, 'videos'));
        const list: any[] = [];
        snap.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() });
        });
        
        // Filter videos matching scripture title or id
        const filtered = list.filter(v => 
          (v.categoryId && v.categoryId === scripture.id) ||
          (v.category && v.category === scripture.id) ||
          (v.title && v.title.toLowerCase().includes(scripture.id.replace('_', ' '))) ||
          (v.description && v.description.toLowerCase().includes(scripture.id.replace('_', ' '))) ||
          (scripture.id === 'bhagavad_gita' && v.title && v.title.toLowerCase().includes('gita')) ||
          (scripture.id === 'ramcharitmanas' && v.title && v.title.toLowerCase().includes('ramcharitmanas'))
        );
        setVideos(filtered);

        // Resume watchlist from localStorage
        const savedProgress = localStorage.getItem(`hp_video_progress_${scripture.id}`);
        if (savedProgress) {
          const parsed = JSON.parse(savedProgress);
          const matchedVideo = filtered.find(v => v.id === parsed.videoId);
          if (matchedVideo) {
            setContinueWatching({
              video: matchedVideo,
              percent: parsed.percent,
              time: parsed.time
            });
          }
        }
      } catch (err) {
        console.error("Error fetching videos:", err);
      }
    };
    fetchVideos();
  }, [scripture.id]);

  // Fetch/Generate authentic verses for the selected chapter dynamically
  const loadChapterVerses = async (chapter: Chapter, pageNum: number, append: boolean = false) => {
    setIsLoadingVerses(true);
    try {
      const response = await fetch('/api/adhyayan/chapter-verses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: scripture.id,
          chapterId: chapter.id,
          page: pageNum
        })
      });
      const data = await response.json();
      if (response.ok) {
        const newVerses = data.verses || [];
        setTotalVersesInChapter(data.totalVersesCount || 47);
        if (append) {
          setChapterVerses(prev => {
            const merged = [...prev];
            for (const nv of newVerses) {
              if (!merged.find(v => v.number === nv.number)) {
                merged.push(nv);
              }
            }
            return merged.sort((a, b) => a.number - b.number);
          });
        } else {
          setChapterVerses(newVerses);
        }
        setHasMoreVerses(newVerses.length > 0 && (pageNum * 10) < data.totalVersesCount);
      }
    } catch (err) {
      console.error("Failed to load chapter verses:", err);
    } finally {
      setIsLoadingVerses(false);
    }
  };

  // Trigger loading when chapter changes
  useEffect(() => {
    if (selectedChapter) {
      setVersesPage(1);
      setChapterVerses([]);
      const tVerses = selectedChapter.totalVerses || selectedChapter.verses.length || 47;
      setTotalVersesInChapter(tVerses);
      
      const targetIndex = pendingVerseIndexRef.current !== null ? pendingVerseIndexRef.current : 0;
      pendingVerseIndexRef.current = null; // Reset
      
      setCurrentVerseIndex(targetIndex);
      
      const targetPage = Math.floor(targetIndex / 10) + 1;
      setVersesPage(targetPage);
      loadChapterVerses(selectedChapter, targetPage, false);
      
      setAiContent(null);
      setAiError(null);
    }
  }, [selectedChapter]);

  // Trigger loading next pages/specific page dynamically when currentVerseIndex changes
  useEffect(() => {
    if (!selectedChapter) return;
    const verseNum = currentVerseIndex + 1;
    const alreadyLoaded = chapterVerses.some(v => v.number === verseNum);
    if (!alreadyLoaded && !isLoadingVerses) {
      const pageNum = Math.floor(currentVerseIndex / 10) + 1;
      setVersesPage(pageNum);
      loadChapterVerses(selectedChapter, pageNum, true);
    }
  }, [currentVerseIndex, selectedChapter, chapterVerses, isLoadingVerses]);

  // Auto Scroll Effect
  useEffect(() => {
    if (!isAutoScrollActive) return;
    const scrollInterval = setInterval(() => {
      window.scrollBy({ top: 1, behavior: 'smooth' });
    }, 45); // highly customized smooth slow scroll
    return () => clearInterval(scrollInterval);
  }, [isAutoScrollActive]);

  // Verse Instant Server-side & Local Search Effect
  useEffect(() => {
    if (!verseSearchQuery.trim()) {
      setVerseSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearchingVerses(true);
      try {
        const response = await fetch('/api/adhyayan/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: verseSearchQuery,
            subjectId: scripture.id
          })
        });
        const data = await response.json();
        if (response.ok) {
          setVerseSearchResults(data.results || []);
        }
      } catch (err) {
        console.error("Verse search failed:", err);
      } finally {
        setIsSearchingVerses(false);
      }
    }, 350); // 350ms debounce

    return () => clearTimeout(delayDebounce);
  }, [verseSearchQuery, scripture.id]);

  // Trigger loading next pages
  const loadMoreVerses = () => {
    if (selectedChapter && !isLoadingVerses && hasMoreVerses) {
      const nextPage = versesPage + 1;
      setVersesPage(nextPage);
      loadChapterVerses(selectedChapter, nextPage, true);
    }
  };

  // Track / mark currently viewed verse as read
  useEffect(() => {
    if (!user || !selectedChapter || !activeVerse) return;
    
    const markVerseAsRead = async () => {
      const docId = `${scripture.id}_${selectedChapter.id}`;
      const existingProg = readingProgressDocs[docId];
      const readList = existingProg?.readVerses || [];
      if (!readList.includes(activeVerse.number)) {
        const updatedList = [...readList, activeVerse.number];
        const isCompleted = updatedList.length >= totalVersesInChapter;
        
        await setDoc(doc(db, 'userStats', user.uid, 'reading_progress', docId), {
          id: docId,
          scriptureId: scripture.id,
          chapterId: selectedChapter.id,
          readVerses: updatedList,
          isReadingCompleted: isCompleted,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        // If completed for the first time, celebrate!
        if (isCompleted && !existingProg?.isReadingCompleted) {
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 }
          });
        }
      }
    };

    markVerseAsRead();
  }, [user, selectedChapter, activeVerse, totalVersesInChapter, readingProgressDocs]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  // Handle TTS Chanting Recitation
  const handleToggleRecitation = async () => {
    if (!activeVerse) return;
    if (isAudioPlaying) {
      audioRef.current?.pause();
      setIsAudioPlaying(false);
      return;
    }

    if (audioBase64) {
      audioRef.current?.play();
      setIsAudioPlaying(true);
      return;
    }

    setIsAudioLoading(true);
    try {
      const response = await fetch('/api/adhyayan/generate-recitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: activeVerse.original,
          verseId: activeVerse.id
        })
      });
      const data = await response.json();
      if (data.audio) {
        setAudioBase64(data.audio);
        const audioUrl = `data:audio/wav;base64,${data.audio}`;
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
        } else {
          audioRef.current = new Audio(audioUrl);
        }
        audioRef.current.play();
        setIsAudioPlaying(true);
        audioRef.current.onended = () => setIsAudioPlaying(false);
      }
    } catch (err) {
      console.error('Chanting Recitation generation failed:', err);
    } finally {
      setIsAudioLoading(false);
    }
  };

  // Handle Bookmarks
  const handleToggleBookmark = async () => {
    if (!user || !activeVerse) return;
    const verseId = `${scripture.id}_${activeVerse.id}`;
    const userRef = doc(db, 'users', user.uid);
    let updated;
    if (bookmarks.includes(verseId)) {
      updated = bookmarks.filter(id => id !== verseId);
      await setDoc(userRef, { bookmarks: updated }, { merge: true });
    } else {
      updated = [...bookmarks, verseId];
      await setDoc(userRef, { bookmarks: updated }, { merge: true });
    }
    setBookmarks(updated);
  };

  // Handle Highlights
  const handleToggleHighlight = async () => {
    if (!user || !activeVerse) return;
    const verseId = `${scripture.id}_${activeVerse.id}`;
    const userRef = doc(db, 'users', user.uid);
    let updated;
    if (highlights.includes(verseId)) {
      updated = highlights.filter(id => id !== verseId);
      await setDoc(userRef, { highlights: updated }, { merge: true });
    } else {
      updated = [...highlights, verseId];
      await setDoc(userRef, { highlights: updated }, { merge: true });
    }
    setHighlights(updated);
  };

  // Handle Notes
  const handleSaveNote = async () => {
    if (!user || !activeVerse) return;
    const verseId = `${scripture.id}_${activeVerse.id}`;
    const updatedNotes = { ...notes, [verseId]: activeNoteText };
    setNotes(updatedNotes);
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, { scriptureNotes: updatedNotes }, { merge: true });
    setShowNoteModal(false);
  };

  // Generate Philosophy Material via Gemini
  const handleGenerateAIPhilosophy = async (type: string) => {
    if (!selectedChapter || !activeVerse) return;
    setSelectedAIContentType(type);
    setIsGeneratingAI(true);
    setAiError(null);
    setAiContent(null);

    try {
      const response = await fetch('/api/adhyayan/ai-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: scripture.id,
          chapterId: selectedChapter.id,
          verseId: activeVerse.id,
          contentType: type,
          verseText: activeVerse.original,
          hindiMeaning: activeVerse.hindi
        })
      });
      const data = await response.json();
      if (response.ok) {
        setAiContent(data.content);
      } else {
        setAiError(data.error || 'Failed to generate spiritual material.');
      }
    } catch (err) {
      setAiError('Connection failed. Please try again.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Certificate Downloaders
  const handleDownloadPNG = async () => {
    if (!certificateRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(certificateRef.current, {
        quality: 1.0,
        pixelRatio: 2.0,
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      link.download = `HariPathshala_Certificate_${showCertModal.chapter.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export certificate PNG', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!certificateRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(certificateRef.current, {
        quality: 1.0,
        pixelRatio: 2.0,
        backgroundColor: '#ffffff'
      });
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('landscape', 'px', [800, 560]);
      pdf.addImage(dataUrl, 'PNG', 0, 0, 800, 560);
      pdf.save(`HariPathshala_Certificate_${showCertModal.chapter.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('Failed to export certificate PDF', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyVerse = () => {
    if (!activeVerse) return;
    const textToCopy = `श्रीमद्भगवद्गीता - ${selectedChapter?.name || ''}\nश्लोक ${activeVerse.number}:\n\n${activeVerse.original}\n\nशब्दार्थ:\n${activeVerse.wordMeaning}\n\nअनुवाद (Hindi):\n${activeVerse.hindi}\n\nTranslation (English):\n${activeVerse.english}\n\n- Hari Pathshala`;
    navigator.clipboard.writeText(textToCopy);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleShareVerse = async () => {
    if (!activeVerse) return;
    const shareText = `श्रीमद्भगवद्गीता - ${selectedChapter?.name || ''}\nश्लोक ${activeVerse.number}:\n${activeVerse.original}\n\n${activeVerse.hindi}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Verse ${activeVerse.number} - ${selectedChapter?.name}`,
          text: shareText,
          url: window.location.href
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  const handleNextVerse = () => {
    setAudioBase64(null);
    if (currentVerseIndex < totalVersesInChapter - 1) {
      setCurrentVerseIndex(prev => prev + 1);
    } else {
      if (selectedChapter) {
        const nextChapterNum = selectedChapter.number + 1;
        const nextChapter = scripture.chapters.find(c => c.number === nextChapterNum);
        if (nextChapter) {
          pendingVerseIndexRef.current = 0;
          setSelectedChapter(nextChapter);
        }
      }
    }
  };

  const handlePrevVerse = () => {
    setAudioBase64(null);
    if (currentVerseIndex > 0) {
      setCurrentVerseIndex(prev => prev - 1);
    } else {
      if (selectedChapter) {
        const prevChapterNum = selectedChapter.number - 1;
        const prevChapter = scripture.chapters.find(c => c.number === prevChapterNum);
        if (prevChapter) {
          const lastIndex = (prevChapter.totalVerses || prevChapter.verses.length || 47) - 1;
          pendingVerseIndexRef.current = lastIndex;
          setSelectedChapter(prevChapter);
        }
      }
    }
  };

  // Filter book's chapters/verses based on search query
  const filteredChapters = scripture.chapters.filter(ch => 
    ch.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    ch.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const themeClasses = () => {
    if (themeMode === 'sepia') return 'bg-[#FAF6EE] text-[#433422] border-[#EADFC9]';
    if (themeMode === 'dark') return 'bg-slate-950 text-slate-100 border-slate-800';
    return 'bg-white text-slate-900 border-slate-200';
  };

  const textClasses = () => {
    if (fontSize === 'sm') return 'text-sm';
    if (fontSize === 'md') return 'text-base';
    if (fontSize === 'lg') return 'text-lg';
    if (fontSize === 'xl') return 'text-xl';
    return 'text-2xl';
  };

  const lineHeightClass = () => {
    if (lineHeight === 'compact') return 'leading-normal';
    if (lineHeight === 'spacious') return 'leading-loose';
    return 'leading-relaxed';
  };

  const readingWidthClass = () => {
    if (readingWidth === 'narrow') return 'max-w-md mx-auto';
    if (readingWidth === 'wide') return 'max-w-4xl mx-auto';
    if (readingWidth === 'full') return 'max-w-full';
    return 'max-w-2xl mx-auto'; // medium
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeMode === 'dark' ? 'bg-slate-950' : 'bg-orange-50/20'}`}>
      <SEO title={`${scripture.title} | Hari Pathshala`} description={scripture.description} />

      {/* TOP HEADER */}
      <header className={`px-4 py-3.5 flex items-center justify-between border-b sticky top-0 z-40 backdrop-blur-md ${themeMode === 'dark' ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-orange-100'}`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => selectedChapter ? setSelectedChapter(null) : navigate('/adhyayan')} 
            className="p-2 rounded-full hover:bg-neutral-200/50 dark:hover:bg-slate-800 transition-colors text-brown-dark dark:text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-saffron-dark">Adhyayan Academy</span>
            <h1 className="text-base font-bold text-brown-dark dark:text-white leading-tight font-devanagari">
              {selectedChapter ? selectedChapter.name : scripture.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Mode Toggle */}
          <button 
            onClick={() => setThemeMode(prev => prev === 'sepia' ? 'light' : prev === 'light' ? 'dark' : 'sepia')}
            className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-slate-800 text-neutral-600 dark:text-slate-300 transition-colors"
            title="Toggle Theme"
          >
            {themeMode === 'dark' ? <Sun size={20} /> : themeMode === 'light' ? <Moon size={20} /> : <Layers size={20} />}
          </button>

          {/* Chapter Sidebar Toggle (only visible when in chapter reader) */}
          {selectedChapter && (
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-slate-800 text-neutral-600 dark:text-slate-300 transition-colors">
              <Menu size={20} />
            </button>
          )}
        </div>
      </header>

      {/* SCRIPTURE INDEX SCREEN (selectedChapter === null) */}
      {!selectedChapter ? (
        <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
          
          <AnimatePresence mode="wait">
            <motion.div 
                key="reading-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Book Details Column */}
                <div className="space-y-6 lg:col-span-1">
                  <div className="bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden border dark:border-slate-800 shadow-sm p-6 space-y-6">
                    {/* Beautiful cover image */}
                    <div className="aspect-[3/4] rounded-2xl overflow-hidden relative shadow-lg">
                      <img src={scripture.coverImage} alt={scripture.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5">
                        <span className="text-orange-400 font-bold text-xs uppercase tracking-widest mb-1">Authentic Book</span>
                        <h2 className="text-xl font-bold text-white font-devanagari">{scripture.title}</h2>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3.5 bg-orange-50/40 dark:bg-slate-950 p-4 rounded-2xl border border-orange-100/30 dark:border-slate-800">
                      <div className="space-y-0.5 text-center border-r dark:border-slate-800">
                        <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Chapters</span>
                        <p className="text-lg font-extrabold text-brown-dark dark:text-white">{scripture.chapters.length}</p>
                      </div>
                      <div className="space-y-0.5 text-center">
                        <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Reading Time</span>
                        <p className="text-lg font-extrabold text-saffron">{readingTime} Mins</p>
                      </div>
                    </div>

                    {/* Author & Introduction */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-saffron rounded-full" />
                        <h4 className="font-bold text-sm text-brown-dark dark:text-white font-devanagari">ग्रन्थ परिचय (Introduction)</h4>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-slate-400 leading-relaxed font-mukta">
                        {scripture.introduction}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Chapter List Column */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Search and Language bar */}
                  <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border dark:border-slate-800 shadow-sm justify-between items-center">
                    <div className="flex items-center bg-neutral-100 dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border dark:border-slate-800 w-full sm:max-w-md gap-2">
                      <Search size={18} className="text-neutral-400 shrink-0" />
                      <input 
                        type="text" 
                        placeholder="अध्याय खोजें (Search chapters)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none outline-none text-xs w-full dark:text-white"
                      />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-extrabold uppercase text-neutral-400 tracking-wider">Language:</span>
                      <select className="bg-neutral-100 dark:bg-slate-950 border dark:border-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold text-brown-dark dark:text-white outline-none">
                        <option>हिन्दी / Sanskrit</option>
                        <option>English</option>
                      </select>
                    </div>
                  </div>

                  {/* Chapters List */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-base text-brown-dark dark:text-white font-devanagari flex items-center gap-2">
                      <List size={20} className="text-saffron" />
                      अध्याय सूची (Chapters Table of Contents)
                    </h3>

                    {filteredChapters.map((ch, idx) => {
                      const progressId = `${scripture.id}_${ch.id}`;
                      const progress = readingProgressDocs[progressId];
                      const readCount = progress?.readVerses?.length || 0;
                      
                      // Using dynamic chapter verses total, or fall back to static chapter definition total
                      const totalVerses = ch.verses.length;
                      const percentRead = totalVerses > 0 ? Math.min(Math.round((readCount / totalVerses) * 100), 100) : 0;
                      
                      const cert = chapterCertificates[progressId];

                      return (
                        <div 
                          key={ch.id}
                          onClick={() => setSelectedChapter(ch)}
                          className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:border-saffron/40 hover:shadow-md transition-all cursor-pointer flex justify-between items-center group relative overflow-hidden"
                        >
                          <div className="space-y-2.5 flex-1 pr-6">
                            <div className="flex items-center gap-2.5">
                              <span className="w-7 h-7 bg-orange-100/50 dark:bg-slate-800 text-saffron text-xs font-black rounded-lg flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <div>
                                <h4 className="font-bold text-sm text-brown-dark dark:text-white font-devanagari group-hover:text-saffron transition-colors">
                                  {ch.name}
                                </h4>
                                <p className="text-xs text-neutral-400 tracking-wide font-medium">{ch.title}</p>
                              </div>
                            </div>

                            {/* Chapter progress bar */}
                            <div className="space-y-1 w-full max-w-sm">
                              <div className="flex justify-between text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                                <span>Reading Progress</span>
                                <span>{readCount} / {totalVerses} Verses ({percentRead}%)</span>
                              </div>
                              <div className="w-full h-1 bg-neutral-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-saffron rounded-full transition-all duration-300"
                                  style={{ width: `${percentRead}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {/* Certificate Status Badges */}
                            {cert ? (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowCertModal(cert);
                                }}
                                className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-amber-600 text-white font-bold text-[10px] rounded-xl shadow-sm hover:brightness-105 flex items-center gap-1.5 transition-all"
                              >
                                <Award size={13} />
                                Certificate Earned
                              </button>
                            ) : percentRead === 100 ? (
                              <span className="px-2.5 py-1 bg-yellow-500/10 text-yellow-600 text-[10px] font-extrabold rounded-lg border border-yellow-500/20">
                                Quiz Pending
                              </span>
                            ) : null}

                            <ChevronRight size={18} className="text-neutral-400 group-hover:text-saffron transition-colors" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
          </AnimatePresence>
        </main>
      ) : (
        /* CHAPTER WRITER WORKSPACE (selectedChapter !== null) */
        <main className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
          {/* HORIZONTAL CHAPTER SELECTOR */}
          <div className="w-full bg-orange-50/40 dark:bg-slate-900 border border-orange-100/50 dark:border-slate-800 p-3 rounded-[28px] overflow-x-auto scrollbar-none flex items-center gap-2 shadow-sm">
            <div className="flex items-center gap-2 shrink-0 border-r dark:border-slate-800 pr-3 mr-1 text-xs font-black text-brown-dark dark:text-orange-400">
              <Compass size={14} className="text-saffron shrink-0" />
              <span className="whitespace-nowrap">अध्याय (Chapters):</span>
            </div>
            {scripture.chapters.map((ch) => {
              const isCurrent = ch.id === selectedChapter.id;
              const progressId = `${scripture.id}_${ch.id}`;
              const progressDoc = readingProgressDocs[progressId];
              const tVerses = ch.totalVerses || ch.verses.length || 47;
              const readCount = progressDoc?.readVerses?.length || 0;
              const isCompleted = progressDoc?.isReadingCompleted || (readCount >= tVerses);

              return (
                <button
                  key={ch.id}
                  onClick={() => {
                    setSelectedChapter(ch);
                  }}
                  className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all border ${
                    isCurrent
                      ? 'bg-saffron text-white border-saffron shadow-sm'
                      : isCompleted
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border-emerald-100 dark:border-emerald-900/30'
                      : 'bg-white dark:bg-slate-850 text-neutral-600 dark:text-slate-300 border-neutral-200 dark:border-slate-800 hover:bg-neutral-50 dark:hover:bg-slate-850'
                  }`}
                >
                  <span>Ch {ch.number}</span>
                  {isCompleted && <CheckCircle2 size={12} className="text-emerald-500 fill-emerald-500/10" />}
                </button>
              );
            })}
          </div>

          {/* Chapter view top controls and tabs */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b dark:border-slate-800 pb-4">
            <button 
              onClick={() => setSelectedChapter(null)}
              className="flex items-center gap-1.5 text-xs font-bold text-saffron hover:text-saffron-dark transition-colors self-start"
            >
              <ArrowLeft size={16} /> ग्रंथ सूची (Back to Scripture)
            </button>

            {/* View selectors */}
            <div className="flex bg-neutral-200/50 dark:bg-slate-800 p-1 rounded-2xl">
              {[
                { id: 'read', label: 'शास्त्र पाठन (Read Verses)', icon: BookOpen },
                { id: 'philosophy', label: 'दर्शन सार (AI Analysis)', icon: Sparkles },
                { id: 'quiz-certificate', label: 'मूल्यांकन (Quiz & Progress)', icon: Trophy },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setChapterTab(t.id as any);
                    if (t.id === 'philosophy' && !aiContent && !isGeneratingAI) {
                      handleGenerateAIPhilosophy('summary');
                    }
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
                    chapterTab === t.id
                      ? t.id === 'philosophy' 
                        ? 'bg-saffron text-white shadow' 
                        : 'bg-white dark:bg-slate-700 text-brown-dark dark:text-white shadow'
                      : 'text-neutral-500 hover:text-neutral-700 dark:text-slate-400'
                  }`}
                >
                  <t.icon size={14} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* INNER READ TAB */}
            {chapterTab === 'read' && (
              <motion.div 
                key="read-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className={`grid grid-cols-1 lg:grid-cols-3 gap-6 relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-slate-950 overflow-y-auto p-6 md:p-12' : ''}`}
              >
                {/* Immersive View Header if Fullscreen */}
                {isFullscreen && (
                  <div className="lg:col-span-3 flex justify-between items-center pb-4 border-b dark:border-slate-800 mb-4">
                    <div className="flex items-center gap-3">
                      <BookOpen className="text-saffron" size={24} />
                      <div>
                        <h2 className="font-extrabold text-lg text-brown-dark dark:text-white font-devanagari">{selectedChapter.title}</h2>
                        <p className="text-xs text-neutral-400">Immersive Reading Mode</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsFullscreen(false)}
                      className="px-4 py-2 bg-saffron text-white rounded-xl text-xs font-bold hover:bg-saffron-dark transition-all flex items-center gap-1.5"
                    >
                      <X size={14} /> Exit Immersive View
                    </button>
                  </div>
                )}

                {/* Verse Sidebar Index (left column) */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-[32px] border dark:border-slate-800 p-5 space-y-4 shadow-sm h-fit max-h-[600px] overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-neutral-400 uppercase tracking-widest">Select Verse</h4>
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                      <span>Sequential:</span>
                      <button
                        onClick={() => setSequentialLearning(!sequentialLearning)}
                        className={`w-8 h-4 rounded-full p-0.5 transition-all ${sequentialLearning ? 'bg-saffron' : 'bg-neutral-300 dark:bg-slate-700'}`}
                      >
                        <div className={`w-3 h-3 bg-white rounded-full transition-all ${sequentialLearning ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>

                  {/* Sidebar Verse Search */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={14} />
                    <input
                      type="text"
                      placeholder="Search verse (e.g. 15, कर्म, duty)..."
                      value={verseSearchQuery}
                      onChange={(e) => setVerseSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-neutral-50 dark:bg-slate-950 border dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:border-saffron/50 text-neutral-800 dark:text-white"
                    />
                    {verseSearchQuery && (
                      <button 
                        onClick={() => setVerseSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Search Results / Verse Grid */}
                  {verseSearchQuery.trim() !== '' ? (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                      {isSearchingVerses ? (
                        <div className="text-center py-6 text-xs text-neutral-400 flex items-center justify-center gap-1.5">
                          <RefreshCw size={12} className="animate-spin" /> Searching spiritual verses...
                        </div>
                      ) : verseSearchResults.length === 0 ? (
                        <div className="text-center py-6 text-xs text-neutral-400">
                          No matching verses found. Try another term or verse number!
                        </div>
                      ) : (
                        verseSearchResults.map((res: any) => {
                          const isCurrent = res.chapterId === selectedChapter.id && currentVerseIndex === (res.number - 1);
                          return (
                            <button
                              key={`${res.chapterId}_${res.number}`}
                              onClick={() => {
                                const targetCh = scripture.chapters.find(c => c.id === res.chapterId);
                                if (targetCh) {
                                  if (targetCh.id !== selectedChapter.id) {
                                    pendingVerseIndexRef.current = res.number - 1;
                                    setSelectedChapter(targetCh);
                                  } else {
                                    setCurrentVerseIndex(res.number - 1);
                                  }
                                }
                                setVerseSearchQuery('');
                              }}
                              className={`w-full text-left p-2.5 rounded-xl text-xs transition-all border ${
                                isCurrent 
                                  ? 'bg-saffron text-white border-saffron' 
                                  : 'bg-neutral-50 dark:bg-slate-950 hover:bg-neutral-100 border-neutral-100 dark:border-slate-900 text-neutral-700 dark:text-slate-300'
                              }`}
                            >
                              <div className="flex justify-between font-bold mb-1">
                                <span>Ch {res.chapterNumber || 1} • Verse {res.number}</span>
                              </div>
                              <p className="line-clamp-2 font-devanagari text-neutral-500 dark:text-slate-400 select-none">
                                {res.original || res.hindi}
                              </p>
                            </button>
                          );
                        })
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-5 gap-2.5">
                      {Array.from({ length: totalVersesInChapter || selectedChapter.verses.length }).map((_, idx) => {
                        const verseNum = idx + 1;
                        const progressId = `${scripture.id}_${selectedChapter.id}`;
                        const isRead = readingProgressDocs[progressId]?.readVerses?.includes(verseNum);

                        // Sequential lock check
                        const isLocked = sequentialLearning && verseNum > 1 && !readingProgressDocs[progressId]?.readVerses?.includes(verseNum - 1);

                        return (
                          <button
                            key={idx}
                            disabled={isLocked}
                            onClick={() => {
                              setCurrentVerseIndex(idx);
                              setAudioBase64(null); // Reset loaded audio
                            }}
                            className={`h-11 rounded-xl font-bold text-sm transition-all relative flex flex-col items-center justify-center ${
                              currentVerseIndex === idx
                                ? 'bg-saffron text-white shadow-md'
                                : isLocked
                                ? 'bg-neutral-100/50 dark:bg-slate-900/30 text-neutral-300 dark:text-slate-700 cursor-not-allowed border border-dashed border-neutral-200 dark:border-slate-800'
                                : isRead
                                ? 'bg-orange-50 dark:bg-orange-950/20 text-saffron border border-orange-100 dark:border-orange-900/30'
                                : 'bg-neutral-100 dark:bg-slate-800 text-neutral-600 dark:text-slate-300 hover:bg-neutral-200'
                            }`}
                            title={isLocked ? "🔒 Read previous verses to unlock this one" : `Verse ${verseNum}`}
                          >
                            <span>{verseNum}</span>
                            {isLocked ? (
                              <span className="text-[9px] text-neutral-300 dark:text-slate-700 absolute bottom-0.5">🔒</span>
                            ) : isRead ? (
                              <span className="absolute bottom-1 w-1 h-1 bg-saffron rounded-full" />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Load More button for paginated verses */}
                  {hasMoreVerses && !verseSearchQuery && (
                    <button 
                      onClick={loadMoreVerses}
                      disabled={isLoadingVerses}
                      className="w-full mt-4 py-2 bg-orange-100/50 hover:bg-orange-100 text-saffron font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      {isLoadingVerses ? 'Loading...' : 'Load More Verses ➕'}
                    </button>
                  )}
                </div>

                {/* Main Interactive Reader (right columns) */}
                <div className="lg:col-span-2 space-y-4">
                  
                  {/* Preferences Panel */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-[24px] border dark:border-slate-800 shadow-sm gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Font Size selectors */}
                      <div className="flex items-center gap-1.5">
                        <Type size={14} className="text-neutral-500 shrink-0" />
                        <div className="flex gap-1 bg-neutral-100 dark:bg-slate-950 p-1 rounded-lg">
                          {(['sm', 'md', 'lg', 'xl', 'xxl'] as const).map(sz => (
                            <button 
                              key={sz}
                              onClick={() => setFontSize(sz)}
                              className={`px-2.5 py-1 rounded font-bold text-[10px] transition-colors ${
                                fontSize === sz 
                                  ? 'bg-saffron text-white shadow-sm' 
                                  : 'text-neutral-600 dark:text-slate-300 hover:bg-neutral-200'
                              }`}
                            >
                              {sz.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Line Height Selector */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-neutral-400">LINE:</span>
                        <div className="flex gap-1 bg-neutral-100 dark:bg-slate-950 p-1 rounded-lg">
                          {(['compact', 'normal', 'spacious'] as const).map(lh => (
                            <button
                              key={lh}
                              onClick={() => setLineHeight(lh)}
                              className={`px-2 py-0.5 rounded text-[9px] font-black uppercase transition-colors ${
                                lineHeight === lh
                                  ? 'bg-saffron text-white shadow-sm'
                                  : 'text-neutral-500 hover:text-neutral-700 dark:text-slate-400'
                              }`}
                            >
                              {lh}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Reading Width Selector */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-neutral-400">WIDTH:</span>
                        <div className="flex gap-1 bg-neutral-100 dark:bg-slate-950 p-1 rounded-lg">
                          {(['narrow', 'medium', 'wide', 'full'] as const).map(w => (
                            <button
                              key={w}
                              onClick={() => setReadingWidth(w)}
                              className={`px-2 py-0.5 rounded text-[9px] font-black uppercase transition-colors ${
                                readingWidth === w
                                  ? 'bg-saffron text-white shadow-sm'
                                  : 'text-neutral-500 hover:text-neutral-700 dark:text-slate-400'
                              }`}
                            >
                              {w}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end md:self-auto">
                      {/* Auto Scroll Toggle */}
                      <button
                        onClick={() => setIsAutoScrollActive(!isAutoScrollActive)}
                        className={`p-2 rounded-xl border text-xs font-black transition-all flex items-center gap-1 ${
                          isAutoScrollActive
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm animate-pulse'
                            : 'bg-neutral-50 dark:bg-slate-800 border-neutral-200 dark:border-slate-700 text-neutral-500 hover:text-neutral-700 dark:text-slate-300'
                        }`}
                        title="Auto-Scroll"
                      >
                        <Clock size={14} />
                        <span className="hidden sm:inline">Auto Scroll</span>
                      </button>

                      {/* Fullscreen Reading Toggle */}
                      <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className={`p-2 rounded-xl border text-xs font-black transition-all flex items-center gap-1 ${
                          isFullscreen
                            ? 'bg-saffron text-white border-saffron shadow-sm'
                            : 'bg-neutral-50 dark:bg-slate-800 border-neutral-200 dark:border-slate-700 text-neutral-500 hover:text-neutral-700 dark:text-slate-300'
                        }`}
                        title="Immersive/Fullscreen View"
                      >
                        <Eye size={14} />
                        <span className="hidden sm:inline">Immersive</span>
                      </button>

                      {/* Bookmark Toggle */}
                      <button 
                        onClick={handleToggleBookmark}
                        className={`p-2 rounded-xl border transition-colors ${
                          bookmarks.includes(currentVerseGlobalId) 
                            ? 'bg-saffron/10 border-saffron text-saffron' 
                            : 'bg-neutral-50 dark:bg-slate-800 border-neutral-200 dark:border-slate-700 text-neutral-500 hover:text-neutral-700 dark:text-slate-300'
                        }`}
                        title="Bookmark Verse"
                      >
                        <Bookmark size={14} className={bookmarks.includes(currentVerseGlobalId) ? 'fill-saffron' : ''} />
                      </button>

                      {/* Highlight Toggle */}
                      <button 
                        onClick={handleToggleHighlight}
                        className={`p-2 rounded-xl border transition-colors ${
                          highlights.includes(currentVerseGlobalId) 
                            ? 'bg-yellow-400/20 border-yellow-400 text-yellow-600 dark:text-yellow-400' 
                            : 'bg-neutral-50 dark:bg-slate-800 border-neutral-200 dark:border-slate-700 text-neutral-500 hover:text-neutral-700 dark:text-slate-300'
                        }`}
                        title="Highlight Verse"
                      >
                        <Highlighter size={14} />
                      </button>

                      {/* Note Modal Toggle */}
                      <button 
                        onClick={() => {
                          setActiveNoteText(notes[currentVerseGlobalId] || '');
                          setShowNoteModal(true);
                        }}
                        className="p-2 rounded-xl border bg-neutral-50 dark:bg-slate-800 border-neutral-200 dark:border-slate-700 text-neutral-500 hover:text-neutral-700 dark:text-slate-300 transition-colors"
                        title="Add Notes"
                      >
                        <Edit3 size={14} />
                      </button>

                      {/* Chanting Recitation Button */}
                      <button 
                        onClick={handleToggleRecitation}
                        disabled={isAudioLoading}
                        className={`p-2 rounded-xl border transition-colors ${
                          isAudioPlaying 
                            ? 'bg-orange-500 text-white border-orange-500' 
                            : 'bg-neutral-50 dark:bg-slate-800 border-neutral-200 dark:border-slate-700 text-neutral-500 hover:text-neutral-700 dark:text-slate-300'
                        }`}
                        title="Play Recitation"
                      >
                        {isAudioLoading ? (
                          <div className="w-[14px] h-[14px] border-2 border-saffron border-t-transparent rounded-full animate-spin"></div>
                        ) : isAudioPlaying ? (
                          <Pause size={14} />
                        ) : (
                          <Volume2 size={14} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Feedbacks for Copy/Share */}
                  <AnimatePresence>
                    {copySuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-black rounded-xl border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-1.5"
                      >
                        <CheckCircle2 size={14} /> श्लोक सफलतापूर्वक कॉपी किया गया! (Verse content copied with translation details!)
                      </motion.div>
                    )}
                    {shareSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-xs font-black rounded-xl border border-blue-100 dark:border-blue-900/30 flex items-center gap-1.5"
                      >
                        <CheckCircle2 size={14} /> श्लोक लिंक कॉपी किया गया! दोस्तों के साथ साझा करें। (Verse Link Copied! Share it with family and friends.)
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ACTIVE VERSE CARD DISPLAY */}
                  {activeVerse ? (
                    <motion.div 
                      key={currentVerseIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`border rounded-3xl p-6 lg:p-8 shadow-sm flex flex-col space-y-6 relative overflow-hidden ${themeClasses()}`}
                    >
                      <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-saffron to-orange-600 opacity-70" />
                      <div className="absolute top-0 bottom-0 right-0 w-1 bg-gradient-to-b from-saffron to-orange-600 opacity-70" />

                      <div className="flex justify-between items-center text-xs border-b pb-3 border-neutral-200/50 dark:border-slate-800">
                        <span className="font-bold tracking-wider uppercase text-saffron-dark">{selectedChapter.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold font-mono px-2.5 py-1 bg-neutral-200/40 dark:bg-slate-800 rounded-lg">Verse {activeVerse.number}</span>
                          
                          {/* Copy Action Button */}
                          <button
                            onClick={handleCopyVerse}
                            className="p-1.5 rounded-lg bg-neutral-100 dark:bg-slate-800 text-neutral-500 hover:text-neutral-700 dark:hover:text-white transition-colors border dark:border-slate-700"
                            title="Copy Shloka with meanings"
                          >
                            <FileText size={12} />
                          </button>

                          {/* Share Action Button */}
                          <button
                            onClick={handleShareVerse}
                            className="p-1.5 rounded-lg bg-neutral-100 dark:bg-slate-800 text-neutral-500 hover:text-neutral-700 dark:hover:text-white transition-colors border dark:border-slate-700"
                            title="Share/Copy Link"
                          >
                            <Share2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Core Verse Read Container with font size, line height and width customized */}
                      <div className={`space-y-6 ${readingWidthClass()}`}>
                        {/* Shloka/Sanskrit Box */}
                        <div className="text-center py-6 px-4 bg-orange-500/5 dark:bg-orange-500/10 rounded-2xl border border-orange-500/10 relative">
                          <p className={`font-bold font-devanagari text-brown-dark dark:text-orange-400 whitespace-pre-line select-text ${textClasses() === 'text-sm' ? 'text-lg' : textClasses() === 'text-base' ? 'text-xl' : textClasses() === 'text-lg' ? 'text-2xl' : textClasses() === 'text-xl' ? 'text-3xl' : 'text-4xl'} ${lineHeightClass()}`}>
                            {activeVerse.original}
                          </p>
                          {highlights.includes(currentVerseGlobalId) && (
                            <div className="absolute inset-0 bg-yellow-400/10 pointer-events-none rounded-2xl border border-yellow-400/30" />
                          )}
                        </div>

                        {/* Word-by-Word Meaning */}
                        <div className="space-y-1.5 pt-2">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-saffron-dark">शब्दार्थ (Word Meaning)</span>
                          <p className={`font-devanagari ${textClasses()} ${lineHeightClass()} text-neutral-600 dark:text-slate-300`}>
                            {activeVerse.wordMeaning}
                          </p>
                        </div>

                        {/* Hindi Translation */}
                        <div className="space-y-1.5 pt-2">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-saffron-dark">हिंदी अनुवाद (Hindi Meaning)</span>
                          <p className={`font-devanagari font-semibold ${textClasses()} ${lineHeightClass()} text-neutral-900 dark:text-white`}>
                            {activeVerse.hindi}
                          </p>
                        </div>

                        {/* English Translation */}
                        <div className="space-y-1.5 pt-2">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-saffron-dark">English Translation</span>
                          <p className={`font-serif italic ${textClasses()} ${lineHeightClass()} text-neutral-800 dark:text-slate-200`}>
                            {activeVerse.english}
                          </p>
                        </div>

                        {/* Detailed Explanation */}
                        <div className="space-y-1.5 pt-2 border-t border-neutral-200/50 dark:border-slate-800">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-saffron-dark">विस्तृत व्याख्या (Explanation)</span>
                          <p className={`font-mukta text-neutral-700 dark:text-slate-300 ${textClasses()} ${lineHeightClass()}`}>
                            {activeVerse.explanation}
                          </p>
                        </div>
                      </div>

                      {/* User Personal Notes */}
                      {notes[currentVerseGlobalId] && (
                        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-2xl border border-yellow-200/50 dark:border-yellow-900/30 space-y-1 relative">
                          <span className="text-[10px] font-bold text-yellow-700 dark:text-yellow-500 uppercase tracking-wider flex items-center gap-1">
                            <Edit3 size={12} /> आपका नोट्स (Your Note)
                          </span>
                          <p className="text-sm font-mukta text-neutral-800 dark:text-slate-200">{notes[currentVerseGlobalId]}</p>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <div className="text-center py-12 text-neutral-400">
                      <p>Loading verse details...</p>
                    </div>
                  )}

                  {/* Navigating verses */}
                  <div className="flex items-center justify-between gap-4">
                    <button
                      disabled={currentVerseIndex === 0 && selectedChapter.number === 1}
                      onClick={handlePrevVerse}
                      className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-900 dark:text-white border border-neutral-200 dark:border-slate-800 py-3.5 rounded-2xl font-bold hover:bg-neutral-50 dark:hover:bg-slate-850 disabled:opacity-50 transition-colors"
                    >
                      <ChevronLeft size={18} />
                      पिछला श्लोक (Prev)
                    </button>

                    <button
                      disabled={currentVerseIndex === (totalVersesInChapter || selectedChapter.verses.length) - 1 && selectedChapter.number === scripture.chapters.length}
                      onClick={handleNextVerse}
                      className="flex-1 flex items-center justify-center gap-2 bg-saffron text-white py-3.5 rounded-2xl font-bold shadow hover:bg-saffron-dark disabled:opacity-50 transition-colors"
                    >
                      अगला श्लोक (Next)
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* INNER PHILOSOPHY (AI) TAB */}
            {chapterTab === 'philosophy' && (
              <motion.div 
                key="philosophy-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6"
              >
                {/* Selector actions */}
                <div className="flex items-center justify-between flex-wrap gap-4 border-b dark:border-slate-800 pb-4">
                  <div>
                    <h4 className="font-bold text-sm text-brown-dark dark:text-white font-devanagari">💡 श्लोक का दर्शन सार (Philosophical Essence)</h4>
                    <span className="text-[10px] text-neutral-400">Dynamic AI teachings specifically personalized for the selected verse</span>
                  </div>
                  <div className="flex bg-neutral-100 dark:bg-slate-950 p-1 rounded-xl">
                    {[
                      { id: 'summary', name: '📖 विस्तृत भावार्थ (Summary)', icon: FileText },
                      { id: 'flashcards', name: '🃏 फ्लैशकार्ड्स (Cards)', icon: Layers },
                      { id: 'mindmap', name: '🧠 ज्ञान मानचित्र (Mind Map)', icon: BrainCircuit },
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => handleGenerateAIPhilosophy(t.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                          selectedAIContentType === t.id
                            ? 'bg-saffron/10 text-saffron'
                            : 'text-neutral-500 hover:text-neutral-700 dark:text-slate-400'
                        }`}
                      >
                        <t.icon size={13} />
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main philosophical contents */}
                <div className="border border-neutral-100 dark:border-slate-850 bg-neutral-50/50 dark:bg-slate-950/20 rounded-2xl p-4 lg:p-6 min-h-[300px] flex flex-col justify-center">
                  <AnimatePresence mode="wait">
                    {isGeneratingAI && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center gap-4 text-center py-12"
                      >
                        <div className="relative">
                          <div className="w-12 h-12 border-4 border-saffron border-t-transparent rounded-full animate-spin"></div>
                          <Sparkles className="absolute inset-0 m-auto text-saffron animate-pulse" size={18} />
                        </div>
                        <div className="space-y-1 max-w-xs">
                          <h4 className="font-bold text-sm text-neutral-800 dark:text-white">सद्गुरु वाणी उद्घाटित हो रही है...</h4>
                          <p className="text-xs text-neutral-400">हम इस पावन श्लोक का गहराई से विश्लेषण कर रहे हैं। कृपया प्रतीक्षा करें।</p>
                        </div>
                      </motion.div>
                    )}

                    {aiError && !isGeneratingAI && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center text-center py-12 gap-3"
                      >
                        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center text-red-500 font-bold">!</div>
                        <p className="text-sm text-red-500 font-medium max-w-xs">{aiError}</p>
                        <button 
                          onClick={() => handleGenerateAIPhilosophy(selectedAIContentType)}
                          className="flex items-center gap-2 text-xs bg-saffron text-white font-bold px-4 py-2 rounded-xl hover:bg-saffron-dark transition-colors mt-2"
                        >
                          <RefreshCw size={14} /> पुनः प्रयास करें
                        </button>
                      </motion.div>
                    )}

                    {aiContent && !isGeneratingAI && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4 text-neutral-700 dark:text-slate-200"
                      >
                        {selectedAIContentType === 'summary' && (
                          <div className="markdown-body font-mukta prose dark:prose-invert max-w-none">
                            <Markdown>{aiContent}</Markdown>
                          </div>
                        )}

                        {selectedAIContentType === 'mindmap' && (
                          <div className="space-y-4">
                            <h4 className="font-bold text-sm text-neutral-800 dark:text-white flex items-center gap-2">
                              <BrainCircuit size={18} className="text-saffron" /> श्लोक ज्ञान मानचित्र (Knowledge pillars)
                            </h4>
                            <div className="grid md:grid-cols-2 gap-4">
                              {Array.isArray(aiContent) ? aiContent.map((node: any, idx: number) => (
                                <div key={idx} className="p-4 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl space-y-2 shadow-sm">
                                  <span className="text-[10px] font-bold text-saffron-dark uppercase tracking-wider">{node.concept || `Pillar ${idx+1}`}</span>
                                  <h5 className="font-bold text-sm text-neutral-850 dark:text-white font-devanagari">{node.title}</h5>
                                  <p className="text-xs text-neutral-500 dark:text-slate-400 leading-relaxed">{node.description}</p>
                                </div>
                              )) : (
                                <div className="p-4 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl shadow-sm col-span-2">
                                  <p className="text-sm text-neutral-600 dark:text-slate-300 font-mukta">{aiContent}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {selectedAIContentType === 'flashcards' && (
                          <div className="flex flex-col items-center gap-4 py-4">
                            {Array.isArray(aiContent) && aiContent.length > 0 ? (
                              <div className="w-full max-w-md space-y-3">
                                {aiContent.map((card: any, idx: number) => (
                                  <div 
                                    key={idx}
                                    className="p-5 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl shadow-sm hover:border-saffron/40 transition-all space-y-2"
                                  >
                                    <span className="text-[9px] font-black text-saffron-dark uppercase tracking-wider">Card {idx + 1}</span>
                                    <h4 className="font-bold text-sm text-neutral-800 dark:text-white font-devanagari">प्रश्न: {card.question}</h4>
                                    <p className="text-xs text-neutral-500 dark:text-slate-400 italic">उत्तर: {card.answer}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-neutral-500">No flashcards available</p>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* INNER QUIZ-CERTIFICATE TAB */}
            {chapterTab === 'quiz-certificate' && (
              <motion.div 
                key="quiz-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Adhyayan Progress Checklist */}
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[32px] p-6 shadow-sm space-y-6">
                  <div>
                    <h3 className="font-bold text-base text-brown-dark dark:text-white font-devanagari">📈 स्वाध्याय प्रगति समीक्षा (Chapter Completion Checklist)</h3>
                    <p className="text-xs text-neutral-400">Complete both tasks below to unlock your completion certificate!</p>
                  </div>

                  <div className="space-y-4">
                    {/* Reading Checkbox */}
                    {(() => {
                      const progId = `${scripture.id}_${selectedChapter.id}`;
                      const progress = readingProgressDocs[progId];
                      const readCount = progress?.readVerses?.length || 0;
                      const isReadComplete = progress?.isReadingCompleted || false;

                      return (
                        <div className="p-4 bg-orange-50/20 dark:bg-slate-950 rounded-2xl border dark:border-slate-850 flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <h4 className="font-bold text-sm text-brown-dark dark:text-white flex items-center gap-1.5">
                              <BookOpen size={16} className="text-saffron" />
                              शास्त्र पठन (Read all verses)
                            </h4>
                            <p className="text-xs text-neutral-400">You must read every verse in correct sequential order.</p>
                            <span className="text-[10px] font-black text-saffron uppercase">{readCount} / {totalVersesInChapter} verses read</span>
                          </div>
                          <div>
                            {isReadComplete ? (
                              <div className="w-9 h-9 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-sm">
                                <Check size={18} />
                              </div>
                            ) : (
                              <div className="w-9 h-9 bg-neutral-100 dark:bg-slate-800 text-neutral-400 rounded-full flex items-center justify-center border dark:border-slate-700">
                                <Clock size={16} />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Quiz Checkbox */}
                    {(() => {
                      const progId = `${scripture.id}_${selectedChapter.id}`;
                      const cert = chapterCertificates[progId];

                      return (
                        <div className="p-4 bg-orange-50/20 dark:bg-slate-950 rounded-2xl border dark:border-slate-850 flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <h4 className="font-bold text-sm text-brown-dark dark:text-white flex items-center gap-1.5">
                              <Trophy size={16} className="text-saffron" />
                              मूल्यांकन परीक्षा (Chapter Quiz)
                            </h4>
                            <p className="text-xs text-neutral-400">Pass the official chapter assessment with 70% accuracy or higher.</p>
                            {cert && (
                              <span className="text-[10px] font-black text-emerald-500 uppercase">Exam Passed: {cert.percentage}% Accuracy</span>
                            )}
                          </div>
                          <div>
                            {cert ? (
                              <div className="w-9 h-9 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-sm">
                                <Check size={18} />
                              </div>
                            ) : (
                              <div className="w-9 h-9 bg-neutral-100 dark:bg-slate-800 text-neutral-400 rounded-full flex items-center justify-center border dark:border-slate-700">
                                <Clock size={16} />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Play quiz button */}
                  <div className="pt-2">
                    {chapterCertificates[`${scripture.id}_${selectedChapter.id}`] ? (
                      <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl text-center">
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Excellent! You have successfully completed the spiritual syllabus for this chapter!</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => navigate(`/quiz/play/chapter_play_${scripture.id}_chapter_${selectedChapter.number}`)}
                        className="w-full bg-gradient-to-r from-saffron to-orange-500 text-white font-extrabold py-3.5 rounded-2xl text-xs hover:brightness-105 active:scale-95 shadow-md shadow-saffron/10 flex items-center justify-center gap-2 transition"
                      >
                        <Trophy size={14} />
                        ✍️ परीक्षा प्रश्नोत्तरी आरंभ करें (Start Chapter Quiz)
                      </button>
                    )}
                  </div>
                </div>

                {/* Completion Certificate Card */}
                <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[32px] p-6 shadow-sm flex flex-col justify-between space-y-6">
                  <div className="text-center space-y-4 py-4">
                    <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white text-2xl mx-auto shadow border border-white">
                      📜
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-base text-brown-dark dark:text-white font-devanagari">शास्त्रीय योग्यता प्रमाणपत्र (Study Certificate)</h3>
                      <p className="text-xs text-neutral-400 max-w-xs mx-auto">Earn and download a secure cryptographic certificate verification for completing this chapter.</p>
                    </div>
                  </div>

                  {chapterCertificates[`${scripture.id}_${selectedChapter.id}`] ? (
                    <button
                      onClick={() => setShowCertModal(chapterCertificates[`${scripture.id}_${selectedChapter.id}`])}
                      className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-white font-black rounded-2xl text-xs shadow-md shadow-amber-500/20 hover:brightness-105 transition"
                    >
                      🎓 View & Download Earned Certificate
                    </button>
                  ) : (
                    <div className="bg-neutral-50 dark:bg-slate-950 p-4 rounded-2xl border dark:border-slate-850 text-center">
                      <p className="text-xs text-neutral-500">Completion certificate is currently locked. Finish your reading and quiz checklist to unlock!</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      )}

      {/* NOTE WRITING MODAL */}
      <AnimatePresence>
        {showNoteModal && activeVerse && (
          <>
            <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={() => setShowNoteModal(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 bg-white dark:bg-slate-900 rounded-3xl z-50 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center border-b pb-3 dark:border-slate-800">
                <h3 className="font-bold text-lg text-brown-dark dark:text-white flex items-center gap-2">
                  <Edit3 size={18} className="text-saffron" /> स्वाध्याय नोट्स लिखें
                </h3>
                <button onClick={() => setShowNoteModal(false)} className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-slate-850 dark:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-saffron-dark uppercase tracking-widest">{selectedChapter?.name} • श्लोक {activeVerse.number}</span>
                <p className="text-xs font-devanagari text-neutral-500 italic line-clamp-2">{activeVerse.original}</p>
              </div>

              <textarea
                value={activeNoteText}
                onChange={(e) => setActiveNoteText(e.target.value)}
                placeholder="इस श्लोक पर अपने व्यक्तिगत विचार, शंकाएं या नोट्स लिखें..."
                className="w-full h-36 p-3 text-sm bg-neutral-50 dark:bg-slate-950 border border-neutral-200 dark:border-slate-800 focus:border-saffron focus:ring-1 focus:ring-saffron rounded-2xl outline-none resize-none dark:text-white"
              />

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowNoteModal(false)}
                  className="flex-1 py-3 text-sm font-bold bg-neutral-100 dark:bg-slate-800 text-neutral-700 dark:text-slate-300 rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  रद्द करें (Cancel)
                </button>
                <button 
                  onClick={handleSaveNote}
                  className="flex-1 py-3 text-sm font-bold bg-saffron text-white rounded-xl hover:bg-saffron-dark shadow-md shadow-saffron/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save size={16} /> सहेजें (Save)
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* VERIFIED STUDY CERTIFICATE RENDER MODAL */}
      <AnimatePresence>
        {showCertModal && (
          <>
            <div className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm" onClick={() => setShowCertModal(null)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl p-6 bg-white dark:bg-slate-900 rounded-[36px] z-50 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b pb-3 dark:border-slate-800">
                <h3 className="font-bold text-lg text-brown-dark dark:text-white flex items-center gap-2 font-devanagari">
                  <Award size={20} className="text-amber-500" /> सुप्रतिष्ठित स्वाध्याय प्रमाण-पत्र
                </h3>
                <button onClick={() => setShowCertModal(null)} className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-slate-850 dark:text-white">
                  <X size={20} />
                </button>
              </div>

              {/* Secure Web/PDF Certificate Template */}
              <div className="overflow-x-auto flex justify-center py-4 bg-neutral-100/40 dark:bg-slate-950 p-4 rounded-2xl">
                <div 
                  ref={certificateRef}
                  className="w-[800px] h-[560px] bg-[#fffdf9] text-amber-950 border-[16px] border-[#D4AF37] rounded-2xl p-10 relative overflow-hidden flex flex-col justify-between shadow-xl select-none shrink-0"
                  style={{ fontFamily: '"Georgia", serif' }}
                >
                  {/* Filigree Background Grid */}
                  <div className="absolute inset-0 bg-[radial-gradient(#d4af37_0.6px,transparent_0.6px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
                  <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-amber-500/30" />
                  <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-amber-500/30" />
                  <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-amber-500/30" />
                  <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-amber-500/30" />

                  {/* Cert Header */}
                  <div className="flex justify-between items-start relative z-10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#FF6B00] to-[#FFA726] flex items-center justify-center text-white text-xl shadow-md border border-white">
                        🕉
                      </div>
                      <div className="text-left font-sans">
                        <h4 className="text-xs font-black tracking-widest text-[#FF6B00] m-0">HARI PATHSHALA</h4>
                        <p className="text-[9px] font-bold text-amber-800 tracking-wider m-0">SANATAN VEDIC ACADEMY</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right font-sans">
                        <p className="text-[8px] font-black tracking-widest text-amber-800 uppercase">OFFICIALLY REGISTERED</p>
                        <p className="text-[10px] font-mono text-neutral-500">HP-CERT-{showCertModal.id.replace('HP-CERT-', '')}</p>
                      </div>
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 border-2 border-white shadow flex flex-col items-center justify-center text-white shrink-0">
                        <ShieldCheck size={20} />
                        <span className="text-[6px] font-black tracking-widest mt-0.5">VERIFIED</span>
                      </div>
                    </div>
                  </div>

                  {/* Cert Main content */}
                  <div className="text-center space-y-4 relative z-10 max-w-2xl mx-auto">
                    <h1 className="text-3xl font-serif font-black tracking-wide text-amber-900 m-0 leading-tight">
                      CERTIFICATE OF WISDOM
                    </h1>
                    <p className="text-[11px] italic text-amber-800/80 font-serif m-0">
                      is honorably presented to
                    </p>

                    <div className="flex items-center justify-center gap-4 py-1">
                      <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37] overflow-hidden shrink-0 shadow bg-white flex items-center justify-center text-lg">
                        {user?.photoURL ? (
                          <img src={user.photoURL} alt="User Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <span>👤</span>
                        )}
                      </div>
                      <h2 className="text-2xl font-serif font-extrabold text-amber-950 tracking-wide border-b border-amber-300 pb-1 min-w-[200px]">
                        {showCertModal.userName || user?.displayName || 'Devout Seeker'}
                      </h2>
                    </div>

                    <p className="text-xs text-amber-950/90 leading-relaxed font-sans max-w-xl mx-auto m-0">
                      को गहन ज्ञान, निरंतर निष्ठा और असाधारण शास्त्रीय योग्यता का प्रदर्शन करते हुए <strong className="text-orange-700">{showCertModal.quizName || `${scripture.title} - ${selectedChapter?.name}`}</strong> की मूल्यांकन परीक्षा को <strong className="text-green-600">{showCertModal.percentage}%</strong> उत्तीर्ण प्रतिशत के साथ सफलतापूर्वक पूर्ण करने हेतु।
                    </p>
                  </div>

                  {/* Cert Footer with Signatures & QR */}
                  <div className="flex justify-between items-end relative z-10 border-t border-amber-200/60 pt-6 font-sans">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-white p-1 rounded-lg border border-amber-200 shrink-0">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(generateShareLink(`/quiz/result/${showCertModal.id}`))}`}
                          alt="QR Verification"
                          className="w-full h-full"
                        />
                      </div>
                      <div className="text-left text-[9px] text-neutral-500 space-y-0.5">
                        <p className="font-bold text-amber-800 uppercase tracking-wider">VERIFY CREDENTIALS</p>
                        <p className="font-mono text-[8px]">ID: {showCertModal.id}</p>
                        <p className="text-amber-600 hover:underline">{getAppOrigin().replace("https://", "").replace("http://", "")}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 text-center bg-amber-50/60 border border-amber-200/50 p-2 rounded-xl">
                      <div>
                        <span className="text-[7px] text-neutral-400 uppercase tracking-widest block">Accuracy</span>
                        <span className="text-[11px] font-extrabold text-green-600 block">{showCertModal.percentage}%</span>
                      </div>
                      <div>
                        <span className="text-[7px] text-neutral-400 uppercase tracking-widest block">Total Score</span>
                        <span className="text-[11px] font-extrabold text-amber-800 block">{showCertModal.score} Pts</span>
                      </div>
                    </div>

                    <div className="flex gap-6">
                      <div className="text-center text-[10px] space-y-0.5">
                        <div className="h-5 flex items-end justify-center font-serif italic text-amber-700 font-bold text-xs">
                          Sri Hari Dasa
                        </div>
                        <div className="w-20 border-t border-amber-300 mx-auto" />
                        <p className="text-[8px] text-neutral-400 uppercase tracking-widest">BOARD OF TRUSTEES</p>
                      </div>
                      <div className="text-center text-[10px] space-y-0.5">
                        <div className="h-5 flex items-end justify-center font-serif italic text-amber-700 font-bold text-xs">
                          Vyasacharya
                        </div>
                        <div className="w-20 border-t border-amber-300 mx-auto" />
                        <p className="text-[8px] text-neutral-400 uppercase tracking-widest">PRINCIPAL GURU</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button 
                  onClick={handleDownloadPNG}
                  disabled={isExporting}
                  className="flex-1 py-3.5 bg-neutral-100 dark:bg-slate-800 hover:bg-neutral-200 dark:hover:bg-slate-700 text-neutral-700 dark:text-slate-300 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Download size={14} /> Download Certificate Image (PNG)
                </button>
                <button 
                  onClick={handleDownloadPDF}
                  disabled={isExporting}
                  className="flex-1 py-3.5 bg-gradient-to-r from-amber-400 to-amber-600 hover:brightness-105 text-white rounded-2xl text-xs font-black shadow transition flex items-center justify-center gap-1.5"
                >
                  <FileDown size={14} /> Download Certificate PDF Document
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CHAPTER DRAWER INDEX (sidebar) */}
      <AnimatePresence>
        {sidebarOpen && selectedChapter && (
          <>
            <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-white dark:bg-slate-900 z-50 shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-base text-brown-dark dark:text-white font-devanagari">📋 अनुक्रमणिका (Index)</h3>
                <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-slate-800 dark:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {scripture.chapters.map((ch, idx) => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setSelectedChapter(ch);
                      setSidebarOpen(false);
                      setAudioBase64(null);
                    }}
                    className={`w-full text-left p-3 rounded-2xl font-bold text-xs transition-all ${
                      selectedChapter.id === ch.id
                        ? 'bg-saffron/10 text-saffron border border-saffron/35'
                        : 'bg-neutral-50 dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-750 dark:text-slate-300'
                    }`}
                  >
                    <span className="block text-[10px] uppercase text-neutral-400 tracking-wider">Chapter {idx + 1}</span>
                    <span className="font-devanagari text-xs">{ch.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
