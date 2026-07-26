import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, BookOpen, Settings, Plus, Edit3, Trash2, Save, X, 
  ChevronUp, ChevronDown, Eye, EyeOff, Sparkles, AlertCircle, 
  Check, FileText, FileDown, Layers, HelpCircle, RefreshCw, LogIn,
  Heading, Hash, HelpCircle as HelpIcon, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { doc, setDoc, deleteDoc, getDoc, collection } from 'firebase/firestore';
import { useRealtimeCollection } from '../../hooks/useRealtimeCollection';
import { scriptureData, Scripture, Chapter, Verse } from './scriptureData';
import { useAuthStore } from '../../store/useAuthStore';
import { SEO } from '../../components/SEO';

export const ScripturesAdminScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // Realtime scriptures from Firestore
  const { data: dbScriptures, loading: loadingScriptures } = useRealtimeCollection<any>('adhyayan_scriptures');

  // Merged list of scriptures (DB scriptures override static ones)
  const [scriptures, setScriptures] = useState<any[]>([]);
  
  // Active states
  const [selectedScriptureId, setSelectedScriptureId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  
  // Edit modals/forms
  const [isEditingScripture, setIsEditingScripture] = useState(false);
  const [scriptureForm, setScriptureForm] = useState<any>({
    id: '',
    title: '',
    description: '',
    coverImage: '',
    introduction: '',
    history: '',
    importance: '',
    badge: 'नया ग्रंथ',
    tag: 'साधना',
    bgGradient: 'from-orange-500 via-amber-500 to-yellow-500',
    author: 'वेद व्यास',
    readingTime: '30 mins',
    difficulty: 'Intermediate',
    language: 'Sanskrit • हिन्दी',
    chapters: []
  });

  const [isEditingChapter, setIsEditingChapter] = useState(false);
  const [chapterForm, setChapterForm] = useState<any>({
    id: '',
    number: 1,
    name: '',
    title: '',
    totalVerses: 0,
    isHidden: false
  });

  const [isEditingVerse, setIsEditingVerse] = useState(false);
  const [verseForm, setVerseForm] = useState<any>({
    id: '',
    number: 1,
    original: '',
    wordMeaning: '',
    hindi: '',
    english: '',
    explanation: '',
    notes: '',
    references: '',
    quizAvailable: true
  });

  // Premium Admin State for Question Bank & SRE Diagnostics
  const [generatingChapters, setGeneratingChapters] = useState(false);
  const [generatingBank, setGeneratingBank] = useState(false);
  const [bankLanguage, setBankLanguage] = useState("Hindi");

  const [loadingHealth, setLoadingHealth] = useState(false);
  const [healthData, setHealthData] = useState<any>(null);

  const [loadingLogs, setLoadingLogs] = useState(false);
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [logSeverityFilter, setLogSeverityFilter] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState<any>(null);
  
  // Tab control
  const [activeAdminTab, setActiveAdminTab] = useState<"scriptures" | "diagnostics" | "logs">("scriptures");

  const [chapterVerses, setChapterVerses] = useState<Verse[]>([]);
  const [loadingVerses, setLoadingVerses] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Merge static & Firestore scriptures
  useEffect(() => {
    const mergedMap = new Map<string, any>();
    
    // Add static scriptures first
    Object.keys(scriptureData).forEach(key => {
      mergedMap.set(key, { ...scriptureData[key], isStatic: true });
    });

    // Override or add from DB
    dbScriptures.forEach(item => {
      mergedMap.set(item.id, { ...item, isStatic: false });
    });

    setScriptures(Array.from(mergedMap.values()));
  }, [dbScriptures]);

  // Fetch Chapter Verses from Firestore when Scripture/Chapter selected
  useEffect(() => {
    if (!selectedScriptureId || !selectedChapterId) {
      setChapterVerses([]);
      return;
    }

    const fetchVerses = async () => {
      setLoadingVerses(true);
      try {
        const docId = `${selectedScriptureId}_${selectedChapterId}`;
        const ref = doc(db, 'adhyayan_scripture_chapters', docId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setChapterVerses(data.verses || []);
        } else {
          // If not in DB, check if we can copy from static fallback
          const staticScripture = scriptureData[selectedScriptureId];
          const staticChapter = staticScripture?.chapters.find(c => c.id === selectedChapterId);
          if (staticChapter && staticChapter.verses) {
            setChapterVerses(staticChapter.verses);
          } else {
            setChapterVerses([]);
          }
        }
      } catch (err: any) {
        console.error("Error loading verses:", err);
      } finally {
        setLoadingVerses(false);
      }
    };

    fetchVerses();
  }, [selectedScriptureId, selectedChapterId]);

  const activeScripture = scriptures.find(s => s.id === selectedScriptureId);
  const activeChapter = activeScripture?.chapters?.find((c: any) => c.id === selectedChapterId);

  // --- PREMIUM ADMIN FUNCTIONS ---
  const handleGenerateChapters = async () => {
    if (!selectedScriptureId) {
      flashError("Please select a scripture first.");
      return;
    }
    setGeneratingChapters(true);
    try {
      const res = await fetch("/api/admin/quiz/generate-chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: selectedScriptureId,
          subjectName: activeScripture?.title
        })
      });
      const data = await res.json();
      if (res.ok) {
        flashSuccess(`Successfully generated ${data.count} chapters!`);
        // Refresh page/scriptures
        setTimeout(() => window.location.reload(), 1500);
      } else {
        flashError(data.error || "Failed to generate chapters structure.");
      }
    } catch (err: any) {
      flashError(err.message || "Failed to connect to server.");
    } finally {
      setGeneratingChapters(false);
    }
  };

  const handleGenerateQuestionBank = async (specificChapterId?: string) => {
    if (!selectedScriptureId) {
      flashError("Please select a scripture first.");
      return;
    }
    setGeneratingBank(true);
    try {
      const res = await fetch("/api/admin/quiz/generate-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: selectedScriptureId,
          chapterId: specificChapterId || selectedChapterId || undefined,
          language: bankLanguage
        })
      });
      const data = await res.json();
      if (res.ok) {
        const successes = data.results?.filter((r: any) => r.status.includes("Successfully")) || [];
        const skipped = data.results?.filter((r: any) => r.status.includes("Already")) || [];
        flashSuccess(`Bank generation complete! Generated: ${successes.length}, Skipped: ${skipped.length}`);
      } else {
        flashError(data.error || "Failed to generate question bank.");
      }
    } catch (err: any) {
      flashError(err.message || "Failed to connect to server.");
    } finally {
      setGeneratingBank(false);
    }
  };

  const handleFetchHealthCheck = async () => {
    setLoadingHealth(true);
    try {
      const res = await fetch("/api/admin/health-check");
      const data = await res.json();
      if (res.ok) {
        setHealthData(data);
        flashSuccess("System health check complete.");
      } else {
        flashError("Failed to fetch diagnostics.");
      }
    } catch (err: any) {
      flashError(err.message || "Failed to fetch diagnostics.");
    } finally {
      setLoadingHealth(false);
    }
  };

  const handleFetchErrorLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch("/api/admin/error-logs");
      const data = await res.json();
      if (res.ok) {
        setErrorLogs(data.logs || []);
        flashSuccess("Loaded unexpected error logs.");
      } else {
        flashError("Failed to load logs.");
      }
    } catch (err: any) {
      flashError(err.message || "Failed to load logs.");
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleClearErrorLogs = async () => {
    if (!window.confirm("Are you sure you want to clear/purge all logged errors?")) return;
    setLoadingLogs(true);
    try {
      const res = await fetch("/api/admin/error-logs/clear", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setErrorLogs([]);
        setSelectedLog(null);
        flashSuccess("All error logs purged successfully.");
      } else {
        flashError("Failed to clear logs.");
      }
    } catch (err: any) {
      flashError(err.message || "Failed to clear logs.");
    } finally {
      setLoadingLogs(false);
    }
  };

  // Utility to clear messages
  const flashSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const flashError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 4000);
  };

  // --- SCRIPTURE ACTIONS ---
  const handleOpenNewScripture = () => {
    setScriptureForm({
      id: '',
      title: '',
      description: '',
      coverImage: 'https://images.unsplash.com/photo-1609137144814-6663fcf63473?auto=format&fit=crop&w=800&q=80',
      introduction: '',
      history: '',
      importance: '',
      badge: 'नया ग्रंथ',
      tag: 'साधना',
      bgGradient: 'from-orange-500 via-amber-500 to-yellow-500',
      author: 'वेद व्यास',
      readingTime: '30 mins',
      difficulty: 'Intermediate',
      language: 'Sanskrit • हिन्दी',
      chapters: []
    });
    setIsEditingScripture(true);
  };

  const handleOpenEditScripture = (s: any) => {
    setScriptureForm({ ...s });
    setIsEditingScripture(true);
  };

  const handleSaveScripture = async () => {
    if (!scriptureForm.id || !scriptureForm.title) {
      flashError("Scripture ID and Title are required.");
      return;
    }

    try {
      const cleanId = scriptureForm.id.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const docRef = doc(db, 'adhyayan_scriptures', cleanId);
      
      const payload = {
        ...scriptureForm,
        id: cleanId,
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(docRef, payload, { merge: true });
      setIsEditingScripture(false);
      setSelectedScriptureId(cleanId);
      flashSuccess(`Scripture "${scriptureForm.title}" saved successfully.`);
    } catch (err: any) {
      flashError(`Failed to save scripture: ${err.message}`);
    }
  };

  const handleDeleteScripture = async (sId: string) => {
    if (!window.confirm("Are you sure you want to delete this scripture? This will remove its metadata from Firestore.")) return;

    try {
      await deleteDoc(doc(db, 'adhyayan_scriptures', sId));
      if (selectedScriptureId === sId) {
        setSelectedScriptureId(null);
        setSelectedChapterId(null);
      }
      flashSuccess("Scripture deleted successfully.");
    } catch (err: any) {
      flashError(`Failed to delete scripture: ${err.message}`);
    }
  };

  // --- CHAPTER ACTIONS ---
  const handleOpenNewChapter = () => {
    const nextNum = activeScripture?.chapters?.length 
      ? Math.max(...activeScripture.chapters.map((c: any) => c.number || 0)) + 1 
      : 1;

    setChapterForm({
      id: `chapter_${nextNum}`,
      number: nextNum,
      name: `अध्याय ${nextNum} - `,
      title: '',
      totalVerses: 0,
      isHidden: false
    });
    setIsEditingChapter(true);
  };

  const handleOpenEditChapter = (ch: any) => {
    setChapterForm({ ...ch });
    setIsEditingChapter(true);
  };

  const handleSaveChapter = async () => {
    if (!chapterForm.id || !chapterForm.name) {
      flashError("Chapter ID and Name are required.");
      return;
    }

    try {
      const updatedChapters = activeScripture.chapters ? [...activeScripture.chapters] : [];
      const idx = updatedChapters.findIndex((c: any) => c.id === chapterForm.id);
      
      if (idx >= 0) {
        updatedChapters[idx] = { ...updatedChapters[idx], ...chapterForm };
      } else {
        updatedChapters.push(chapterForm);
      }

      // Sort chapters by number
      updatedChapters.sort((a, b) => a.number - b.number);

      const docRef = doc(db, 'adhyayan_scriptures', selectedScriptureId!);
      await setDoc(docRef, { chapters: updatedChapters }, { merge: true });

      setIsEditingChapter(false);
      setSelectedChapterId(chapterForm.id);
      flashSuccess(`Chapter saved.`);
    } catch (err: any) {
      flashError(`Failed to save chapter: ${err.message}`);
    }
  };

  const handleDeleteChapter = async (chId: string) => {
    if (!window.confirm("Are you sure you want to delete this chapter? This will remove it from the scripture chapter list.")) return;

    try {
      const updatedChapters = activeScripture.chapters.filter((c: any) => c.id !== chId);
      const docRef = doc(db, 'adhyayan_scriptures', selectedScriptureId!);
      await setDoc(docRef, { chapters: updatedChapters }, { merge: true });
      
      // Also clean up chapter verses document
      const versesDocId = `${selectedScriptureId}_${chId}`;
      await deleteDoc(doc(db, 'adhyayan_scripture_chapters', versesDocId));

      if (selectedChapterId === chId) {
        setSelectedChapterId(null);
      }
      flashSuccess("Chapter deleted.");
    } catch (err: any) {
      flashError(`Failed to delete chapter: ${err.message}`);
    }
  };

  const handleMoveChapter = async (idx: number, direction: 'up' | 'down') => {
    const list = [...activeScripture.chapters];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    // Swap positions
    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;

    // Renumber
    const renumbered = list.map((item, index) => ({
      ...item,
      number: index + 1
    }));

    try {
      const docRef = doc(db, 'adhyayan_scriptures', selectedScriptureId!);
      await setDoc(docRef, { chapters: renumbered }, { merge: true });
      flashSuccess("Chapters reordered successfully.");
    } catch (err: any) {
      flashError(`Failed to reorder: ${err.message}`);
    }
  };

  // --- VERSE ACTIONS ---
  const handleOpenNewVerse = () => {
    const nextNum = chapterVerses.length 
      ? Math.max(...chapterVerses.map(v => v.number)) + 1 
      : 1;

    setVerseForm({
      id: `${selectedChapterId}_${nextNum}`,
      number: nextNum,
      original: '',
      wordMeaning: '',
      hindi: '',
      english: '',
      explanation: '',
      notes: '',
      references: '',
      quizAvailable: true
    });
    setIsEditingVerse(true);
  };

  const handleOpenEditVerse = (v: any) => {
    setVerseForm({ ...v });
    setIsEditingVerse(true);
  };

  const handleSaveVerse = async () => {
    if (!verseForm.original) {
      flashError("Verse Sanskrit/original text is required.");
      return;
    }

    try {
      const updatedVerses = [...chapterVerses];
      const idx = updatedVerses.findIndex(v => v.number === verseForm.number);
      
      const payloadVerse = {
        ...verseForm,
        id: verseForm.id || `${selectedChapterId}_${verseForm.number}`
      };

      if (idx >= 0) {
        updatedVerses[idx] = payloadVerse;
      } else {
        updatedVerses.push(payloadVerse);
      }

      updatedVerses.sort((a, b) => a.number - b.number);

      const versesDocId = `${selectedScriptureId}_${selectedChapterId}`;
      const versesDocRef = doc(db, 'adhyayan_scripture_chapters', versesDocId);
      
      await setDoc(versesDocRef, {
        subjectId: selectedScriptureId,
        chapterId: selectedChapterId,
        verses: updatedVerses,
        totalVersesCount: updatedVerses.length,
        updatedAt: new Date().toISOString()
      });

      // Update the totalVerses count inside the scripture metadata too
      const updatedChapters = activeScripture.chapters.map((c: any) => {
        if (c.id === selectedChapterId) {
          return { ...c, totalVerses: updatedVerses.length };
        }
        return c;
      });
      await setDoc(doc(db, 'adhyayan_scriptures', selectedScriptureId!), { chapters: updatedChapters }, { merge: true });

      setChapterVerses(updatedVerses);
      setIsEditingVerse(false);
      flashSuccess("Verse saved successfully.");
    } catch (err: any) {
      flashError(`Failed to save verse: ${err.message}`);
    }
  };

  const handleDeleteVerse = async (vNumber: number) => {
    if (!window.confirm("Are you sure you want to delete this verse?")) return;

    try {
      const updatedVerses = chapterVerses.filter(v => v.number !== vNumber);
      const versesDocId = `${selectedScriptureId}_${selectedChapterId}`;
      const versesDocRef = doc(db, 'adhyayan_scripture_chapters', versesDocId);
      
      await setDoc(versesDocRef, {
        verses: updatedVerses,
        totalVersesCount: updatedVerses.length,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Update totalVerses inside the scripture metadata
      const updatedChapters = activeScripture.chapters.map((c: any) => {
        if (c.id === selectedChapterId) {
          return { ...c, totalVerses: updatedVerses.length };
        }
        return c;
      });
      await setDoc(doc(db, 'adhyayan_scriptures', selectedScriptureId!), { chapters: updatedChapters }, { merge: true });

      setChapterVerses(updatedVerses);
      flashSuccess("Verse deleted successfully.");
    } catch (err: any) {
      flashError(`Failed to delete verse: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 pb-16">
      <SEO title="प्रशासक पैनल - धर्मग्रंथ प्रबंधन | Hari Pathshala" description="Admin Console to manage scriptures, chapters, verses and study syllabus." />

      {/* HEADER */}
      <div className="sticky top-0 z-30 px-6 py-4 bg-white/70 dark:bg-slate-900/40 border-b border-orange-100/50 dark:border-slate-900/60 backdrop-blur-2xl shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/adhyayan')}
            className="p-2.5 rounded-full bg-orange-100/40 dark:bg-slate-900 hover:bg-orange-100 text-amber-900 dark:text-amber-200 transition"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-orange-600 block">System Administrator</span>
            <h1 className="text-xl font-bold font-serif text-amber-950 dark:text-amber-100 flex items-center gap-2">
              ⚙️ प्रशासक पैनल <span className="text-xs bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded-full dark:text-orange-400">Scriptures Workstation</span>
            </h1>
          </div>
        </div>
        <div className="text-xs font-bold text-slate-400">Hari Pathshala Realtime Core</div>
      </div>

      {/* ADMIN TABS SWITCHER */}
      <div className="px-4 md:px-6 max-w-7xl mx-auto pt-6">
        <div className="flex items-center gap-2 border-b border-orange-100/50 dark:border-slate-800 pb-px">
          <button
            onClick={() => setActiveAdminTab("scriptures")}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 relative -bottom-px flex items-center gap-2 ${
              activeAdminTab === "scriptures"
                ? "border-orange-500 text-orange-600 dark:text-orange-400 font-extrabold"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800"
            }`}
          >
            📚 Scriptures & Chapters
          </button>
          <button
            onClick={() => {
              setActiveAdminTab("diagnostics");
              handleFetchHealthCheck();
            }}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 relative -bottom-px flex items-center gap-2 ${
              activeAdminTab === "diagnostics"
                ? "border-orange-500 text-orange-600 dark:text-orange-400 font-extrabold"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800"
            }`}
          >
            🩺 SRE Diagnostics & Health
          </button>
          <button
            onClick={() => {
              setActiveAdminTab("logs");
              handleFetchErrorLogs();
            }}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 relative -bottom-px flex items-center gap-2 ${
              activeAdminTab === "logs"
                ? "border-orange-500 text-orange-600 dark:text-orange-400 font-extrabold"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800"
            }`}
          >
            🤖 Gemini Self-Healing Logs
          </button>
        </div>
      </div>

      {activeAdminTab === "scriptures" && (
        <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* FLASH NOTIFICATIONS */}
        <AnimatePresence>
          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="lg:col-span-12 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-600"
            >
              <Check size={16} /> {successMessage}
            </motion.div>
          )}
          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="lg:col-span-12 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-2 text-xs font-bold text-rose-500"
            >
              <AlertCircle size={16} /> {errorMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* COLUMN 1: SCRIPTURES & CHAPTERS DIRECTORY */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* SCRIPTURES PANEL */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-orange-100/60 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-amber-800/60 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
                <BookOpen size={14} className="text-orange-500" /> धर्मग्रंथ (Scriptures)
              </h3>
              <button 
                onClick={handleOpenNewScripture}
                className="p-1.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition flex items-center gap-1 text-[10px] font-black"
                title="Add New Scripture"
              >
                <Plus size={12} /> जोड़ें (Add)
              </button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 hide-scrollbar">
              {scriptures.map(s => {
                const isSelected = s.id === selectedScriptureId;
                return (
                  <div 
                    key={s.id}
                    onClick={() => {
                      setSelectedScriptureId(s.id);
                      setSelectedChapterId(null);
                    }}
                    className={`p-3 rounded-2xl border text-xs cursor-pointer flex items-center justify-between group transition-all ${
                      isSelected 
                        ? 'bg-gradient-to-r from-orange-500/10 to-amber-500/5 border-orange-300 text-amber-950 dark:text-amber-100 font-bold' 
                        : 'bg-white dark:bg-slate-900 border-orange-100/40 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-orange-50/20'
                    }`}
                  >
                    <div className="space-y-0.5 truncate pr-2">
                      <div className="font-serif font-black text-sm">{s.title}</div>
                      <div className="text-[10px] text-slate-400 font-medium">ID: {s.id} • {s.chapters?.length || 0} Chs</div>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenEditScripture(s); }}
                        className="p-1 hover:bg-orange-100 rounded-lg text-orange-600"
                        title="Edit Details"
                      >
                        <Edit3 size={12} />
                      </button>
                      {!s.isStatic && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteScripture(s.id); }}
                          className="p-1 hover:bg-rose-100 rounded-lg text-rose-500"
                          title="Delete Scripture"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CHAPTERS PANEL (Visible if Scripture selected) */}
          {selectedScriptureId && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-orange-100/60 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-amber-800/60 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Layers size={14} className="text-orange-500" /> अध्याय सूची (Chapters)
                </h3>
                <button 
                  onClick={handleOpenNewChapter}
                  className="p-1.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition flex items-center gap-1 text-[10px] font-black"
                >
                  <Plus size={12} /> अध्याय जोड़ें
                </button>
              </div>

              {/* Permanent Question Bank & AI Chapters Seeding */}
              <div className="bg-gradient-to-br from-amber-500/5 to-orange-500/10 dark:from-slate-800/30 dark:to-orange-500/5 rounded-2xl p-4 border border-orange-200/50 dark:border-slate-800 space-y-3">
                <div className="text-[11px] font-black uppercase text-amber-900 dark:text-amber-200 tracking-wider flex items-center gap-1.5">
                  ✨ Smart AI Generation Suite
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Generate the chapter structure automatically, or generate the permanent Question Bank (25 high-quality MCQs per chapter) stored securely in scripture-specific collections.
                </p>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    disabled={generatingChapters}
                    onClick={handleGenerateChapters}
                    className="w-full py-1.5 px-3 bg-white dark:bg-slate-900 hover:bg-orange-50/50 dark:hover:bg-slate-800 text-orange-700 dark:text-orange-300 text-[10px] font-bold rounded-xl border border-orange-200 dark:border-slate-800 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {generatingChapters ? (
                      "Initializing Chapter Structure..."
                    ) : (
                      "Seed / Generate Chapters Structure"
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <select
                      value={bankLanguage}
                      onChange={(e) => setBankLanguage(e.target.value)}
                      className="text-[10px] p-1.5 rounded-lg border border-orange-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold outline-none"
                    >
                      <option value="Hindi">हिन्दी (Hindi)</option>
                      <option value="English">English</option>
                    </select>

                    <button
                      disabled={generatingBank}
                      onClick={() => handleGenerateQuestionBank()}
                      className="flex-1 py-1.5 px-3 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-bold rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {generatingBank ? (
                        "Generating Question Bank..."
                      ) : (
                        "Generate Question Bank"
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 hide-scrollbar">
                {activeScripture?.chapters?.length === 0 ? (
                  <p className="text-[11px] text-slate-400 text-center py-4">No chapters created yet. Click above to add one.</p>
                ) : (
                  activeScripture?.chapters?.map((ch: any, idx: number) => {
                    const isSelected = ch.id === selectedChapterId;
                    return (
                      <div 
                        key={ch.id}
                        onClick={() => setSelectedChapterId(ch.id)}
                        className={`p-3 rounded-2xl border text-xs cursor-pointer flex items-center justify-between group transition-all ${
                          isSelected 
                            ? 'bg-gradient-to-r from-orange-500/10 to-amber-500/5 border-orange-300 text-amber-950 dark:text-amber-100 font-bold' 
                            : 'bg-white dark:bg-slate-900 border-orange-100/40 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-orange-50/20'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className="w-5 h-5 bg-orange-500/10 text-orange-600 text-[10px] font-black rounded-md flex items-center justify-center shrink-0">
                            {ch.number}
                          </span>
                          <div className="truncate">
                            <div className="font-bold font-serif">{ch.name}</div>
                            <div className="text-[9px] text-slate-400">{ch.title || 'No subtitle'} • {ch.totalVerses || ch.verses?.length || 0} Verses</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Reordering */}
                          <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity mr-1 shrink-0">
                            <button 
                              disabled={idx === 0}
                              onClick={(e) => { e.stopPropagation(); handleMoveChapter(idx, 'up'); }}
                              className="p-0.5 text-slate-400 hover:text-orange-500 disabled:opacity-30"
                            >
                              <ChevronUp size={10} />
                            </button>
                            <button 
                              disabled={idx === activeScripture.chapters.length - 1}
                              onClick={(e) => { e.stopPropagation(); handleMoveChapter(idx, 'down'); }}
                              className="p-0.5 text-slate-400 hover:text-orange-500 disabled:opacity-30"
                            >
                              <ChevronDown size={10} />
                            </button>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleOpenEditChapter(ch); }}
                              className="p-1 hover:bg-orange-100 rounded-lg text-orange-600"
                              title="Edit"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteChapter(ch.id); }}
                              className="p-1 hover:bg-rose-100 rounded-lg text-rose-500"
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

        </div>

        {/* COLUMN 2: WORKSPACE (VERSES MANAGEMENT) */}
        <div className="lg:col-span-8 space-y-6">
          
          {selectedScriptureId && selectedChapterId ? (
            <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-orange-100/60 dark:border-slate-800 shadow-sm space-y-6">
              
              {/* Workspace Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-orange-100/50 dark:border-slate-800 pb-4 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase bg-orange-500/10 text-orange-600 px-2.5 py-1 rounded-full">Active Workspace</span>
                    <span className="text-xs font-bold text-slate-400">/{selectedScriptureId}/{selectedChapterId}</span>
                  </div>
                  <h2 className="text-lg font-black font-serif text-amber-950 dark:text-amber-100 leading-tight">
                    {activeChapter?.name || 'Chapter'}
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">{activeChapter?.title || 'No chapter description'}</p>
                </div>

                <button 
                  onClick={handleOpenNewVerse}
                  className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs rounded-full flex items-center justify-center gap-2 shadow-sm"
                >
                  <Plus size={14} /> श्लोक जोड़ें (Add Verse)
                </button>
              </div>

              {/* Verses Table/Grid */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase text-amber-800/60 dark:text-slate-400 tracking-wider">
                  श्लोक एवं व्याख्या (Sanskrit Verses & Interpretations)
                </h3>

                {loadingVerses ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <RefreshCw className="animate-spin text-orange-500" size={24} />
                    <p className="text-xs text-slate-400 font-bold mt-2">श्लोक लोड हो रहे हैं...</p>
                  </div>
                ) : chapterVerses.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-orange-200 dark:border-slate-800 rounded-3xl p-6">
                    <HelpCircle className="mx-auto text-orange-400 mb-2" size={28} />
                    <h4 className="text-xs font-black text-slate-500">इस अध्याय में कोई श्लोक नहीं है।</h4>
                    <p className="text-[10px] text-slate-400 mt-1">शास्त्र पाठन के लिए ऊपर 'श्लोक जोड़ें' बटन पर क्लिक करके पहला श्लोक बनाएं।</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 hide-scrollbar">
                    {chapterVerses.map(v => (
                      <div 
                        key={v.number}
                        className="p-4 bg-[#FAF7F2]/50 dark:bg-slate-900/60 border border-orange-100/40 dark:border-slate-850 rounded-2xl flex flex-col justify-between hover:border-orange-200 transition-all group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-black text-orange-600 bg-orange-50 dark:bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-100/40">
                            श्लोक {v.number}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleOpenEditVerse(v)}
                              className="p-1.5 hover:bg-orange-100 rounded-lg text-orange-600"
                              title="Edit Verse"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button 
                              onClick={() => handleDeleteVerse(v.number)}
                              className="p-1.5 hover:bg-rose-100 rounded-lg text-rose-500"
                              title="Delete Verse"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="font-serif text-sm font-bold text-amber-950 dark:text-amber-100 leading-relaxed whitespace-pre-line">
                            {v.original}
                          </p>
                          <p className="text-[11px] text-amber-900/80 dark:text-amber-200/70 font-semibold leading-relaxed">
                            <strong className="text-[10px] uppercase text-orange-600 block mb-0.5">अनुवाद:</strong>
                            {v.hindi}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-orange-100/60 dark:border-slate-800 shadow-sm text-center py-20 flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-orange-50 dark:bg-slate-950 border border-orange-100 dark:border-slate-800 rounded-full flex items-center justify-center text-orange-500 shadow-sm">
                <Settings size={28} />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-base font-bold font-serif text-amber-950 dark:text-amber-100">धर्मग्रंथ संपादन मंच (Syllabus Workstation)</h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  बाएं पैनल से प्रबंधन के लिए कोई धर्मग्रंथ चुनें, फिर उसका अध्याय चुनें। आप नया धर्मग्रंथ भी बना सकते हैं।
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={handleOpenNewScripture}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-full flex items-center gap-1.5"
                >
                  <Plus size={14} /> नया ग्रंथ जोड़ें
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
      )}

      {/* DIAGNOSTICS SUB-SCREEN */}
      {activeAdminTab === "diagnostics" && (
        <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-orange-100/60 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-orange-100/50 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[9px] font-black uppercase bg-orange-500/10 text-orange-600 px-2.5 py-1 rounded-full">System Diagnostics</span>
                <h2 className="text-lg font-bold font-serif text-amber-950 dark:text-amber-100 mt-2">🩺 SRE Health & Diagnostics</h2>
                <p className="text-xs text-slate-500 mt-1">Realtime connectivity, API validation, and Firebase collection health status.</p>
              </div>
              <button
                disabled={loadingHealth}
                onClick={handleFetchHealthCheck}
                className="py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {loadingHealth ? "Analyzing..." : "Run Diagnostics Check"}
              </button>
            </div>

            {loadingHealth && (
              <div className="py-12 text-center text-xs text-slate-400 font-bold animate-pulse">
                Running diagnostic queries across Firestore, Auth, Gemini, and third-party systems...
              </div>
            )}

            {!loadingHealth && healthData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Firebase Connectivity */}
                <div className="p-5 rounded-2xl border border-orange-100/60 dark:border-slate-800 bg-orange-50/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">🔥 Firestore & Firebase Auth</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${healthData.firebase?.status === "CONNECTED" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>
                      {healthData.firebase?.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 space-y-1">
                    <div>Latency: {healthData.firebase?.latencyMs}ms</div>
                    <div>Database ID: {healthData.firebase?.databaseId || "(default)"}</div>
                    <div>Environment: production</div>
                  </div>
                </div>

                {/* Gemini AI Core */}
                <div className="p-5 rounded-2xl border border-orange-100/60 dark:border-slate-800 bg-orange-50/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">🧠 Gemini AI Engine</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${healthData.gemini?.status === "READY" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>
                      {healthData.gemini?.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 space-y-1">
                    <div>Response Time: {healthData.gemini?.responseTimeMs}ms</div>
                    <div>SRE Core Integration: Active</div>
                    <div>Self-Healing Engine: Ready</div>
                  </div>
                </div>

                {/* Razorpay Gateway */}
                <div className="p-5 rounded-2xl border border-orange-100/60 dark:border-slate-800 bg-orange-50/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">💳 Razorpay Gateway</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${healthData.razorpay?.status === "READY" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
                      {healthData.razorpay?.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 space-y-1">
                    <div>Key Configured: {healthData.razorpay?.hasKey ? "Yes" : "No"}</div>
                    <div>Secret Configured: {healthData.razorpay?.hasSecret ? "Yes" : "No"}</div>
                  </div>
                </div>

                {/* Shiprocket Delivery */}
                <div className="p-5 rounded-2xl border border-orange-100/60 dark:border-slate-800 bg-orange-50/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">🚚 Shiprocket COD</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${healthData.shiprocket?.status === "READY" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
                      {healthData.shiprocket?.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 space-y-1">
                    <div>Token: {healthData.shiprocket?.hasToken ? "Configured" : "Not Configured"}</div>
                    <div>COD Verification: Shiprocket Direct API</div>
                  </div>
                </div>

                {/* Collections Health check */}
                {healthData.collectionsHealth && (
                  <div className="p-5 rounded-2xl border border-orange-100/60 dark:border-slate-800 bg-orange-50/10 space-y-3 md:col-span-2">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200">📁 Firestore Collections Audit</div>
                    <div className="grid grid-cols-2 gap-4 pt-1">
                      {Object.keys(healthData.collectionsHealth).map((colName) => {
                        const stat = healthData.collectionsHealth[colName];
                        return (
                          <div key={colName} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-orange-100/40 text-[10px] flex items-center justify-between">
                            <span className="font-mono text-slate-500">{colName}</span>
                            <span className="font-black text-amber-950 dark:text-amber-200">{stat.count} docs</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SRE AI SELF-HEALING LOGS SUB-SCREEN */}
      {activeAdminTab === "logs" && (
        <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-orange-100/60 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-orange-100/50 dark:border-slate-800 pb-4 gap-4">
              <div>
                <span className="text-[9px] font-black uppercase bg-orange-500/10 text-orange-600 px-2.5 py-1 rounded-full">SRE Self-Healing logs</span>
                <h2 className="text-lg font-bold font-serif text-amber-950 dark:text-amber-100 mt-2">🤖 Gemini SRE Diagnostic Center</h2>
                <p className="text-xs text-slate-500 mt-1">SRE AI system catches, logs, and analyzes unexpected runtime errors, providing smart solutions.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={loadingLogs}
                  onClick={handleFetchErrorLogs}
                  className="py-2 px-4 bg-orange-100 dark:bg-slate-800 hover:bg-orange-200 text-orange-700 dark:text-orange-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  Refresh Logs
                </button>
                <button
                  disabled={loadingLogs || errorLogs.length === 0}
                  onClick={handleClearErrorLogs}
                  className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  Purge & Clear Logs
                </button>
              </div>
            </div>

            {/* Filters bar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <input
                type="text"
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                placeholder="Search error messages, file names, stack traces..."
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none"
              />
              <select
                value={logSeverityFilter}
                onChange={(e) => setLogSeverityFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none font-bold"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical Only</option>
                <option value="WARNING">Warning Only</option>
                <option value="INFO">Info Only</option>
              </select>
            </div>

            {loadingLogs && (
              <div className="py-12 text-center text-xs text-slate-400 font-bold animate-pulse">
                Fetching error logs database...
              </div>
            )}

            {!loadingLogs && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* List */}
                <div className="lg:col-span-5 space-y-2 max-h-[550px] overflow-y-auto pr-1">
                  {errorLogs.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs font-medium">No system errors logged. Your full-stack environment is running with 100% SRE stability!</div>
                  ) : (
                    errorLogs
                      .filter(log => {
                        if (logSeverityFilter !== "ALL" && log.severity !== logSeverityFilter) return false;
                        if (!logSearchQuery) return true;
                        const q = logSearchQuery.toLowerCase();
                        return (
                          log.errorMessage?.toLowerCase().includes(q) ||
                          log.context?.toLowerCase().includes(q) ||
                          log.aiDiagnosis?.toLowerCase().includes(q)
                        );
                      })
                      .map((log) => {
                        const isSelected = selectedLog?.id === log.id;
                        return (
                          <div
                            key={log.id}
                            onClick={() => setSelectedLog(log)}
                            className={`p-4 rounded-2xl border text-xs cursor-pointer text-left transition-all space-y-2 ${
                              isSelected
                                ? "bg-gradient-to-r from-orange-500/10 to-amber-500/5 border-orange-300 dark:border-orange-500/40"
                                : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:bg-orange-50/10"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${log.severity === "CRITICAL" ? "bg-rose-500/10 text-rose-600" : log.severity === "WARNING" ? "bg-amber-500/10 text-amber-600" : "bg-blue-500/10 text-blue-600"}`}>
                                {log.severity}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ""}
                              </span>
                            </div>
                            <div className="font-bold text-amber-950 dark:text-amber-100 truncate">{log.errorMessage}</div>
                            <div className="text-[10px] text-slate-500 truncate">Context: {log.context}</div>
                          </div>
                        );
                      })
                  )}
                </div>

                {/* Detail view */}
                <div className="lg:col-span-7">
                  {selectedLog ? (
                    <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 space-y-4 text-left">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                        <div className="font-bold text-amber-950 dark:text-amber-100">Error Inspection: #{selectedLog.id?.substring(0, 8)}</div>
                        <span className="text-[10px] text-slate-400">{selectedLog.timestamp ? new Date(selectedLog.timestamp).toLocaleString() : ""}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-black text-slate-400">Error Message</div>
                        <div className="p-3 bg-red-500/5 border border-red-500/10 text-rose-700 font-mono rounded-xl text-xs break-all whitespace-pre-wrap leading-relaxed">{selectedLog.errorMessage}</div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-black text-slate-400">Context Identifier</div>
                        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-slate-600 dark:text-slate-300 rounded-xl text-xs">{selectedLog.context}</div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-black text-orange-600">🧠 Gemini SRE AI Diagnosis & Resolution</div>
                        <div className="p-4 bg-orange-500/5 border border-orange-500/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs leading-relaxed space-y-2">
                          <div className="font-semibold text-orange-700 dark:text-orange-300">Root Cause & Auto-Healing Plan:</div>
                          <div className="whitespace-pre-line">{selectedLog.aiDiagnosis || "No auto-diagnosis logs generated."}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-24 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs font-medium">
                      Select an error log from the left sidebar to inspect details and Gemini diagnostics.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- DIALOGS / EDITING MODALS --- */}
      <AnimatePresence>
        
        {/* SCRIPTURE MODAL */}
        {isEditingScripture && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[32px] border border-orange-100 dark:border-slate-800 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6"
            >
              <div className="flex justify-between items-center pb-3 border-b dark:border-slate-800">
                <h3 className="text-base font-bold font-serif text-amber-950 dark:text-amber-100">
                  {scriptureForm.isStatic ? 'View Scripture Details' : scriptureForm.createdAt ? 'Edit Scripture Details' : 'Add New Scripture'}
                </h3>
                <button onClick={() => setIsEditingScripture(false)} className="p-2 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Unique ID (lowercase/underscore)</label>
                  <input 
                    type="text"
                    disabled={!!scriptureForm.createdAt || scriptureForm.isStatic}
                    placeholder="e.g. bhagavad_gita, shiv_puran, vedas"
                    value={scriptureForm.id}
                    onChange={(e) => setScriptureForm({ ...scriptureForm, id: e.target.value })}
                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none font-semibold text-amber-950 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Title (English & Hindi)</label>
                  <input 
                    type="text"
                    disabled={scriptureForm.isStatic}
                    placeholder="e.g. Bhagavad Gita (श्रीमद्भगवद्गीता)"
                    value={scriptureForm.title}
                    onChange={(e) => setScriptureForm({ ...scriptureForm, title: e.target.value })}
                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none font-semibold text-amber-950 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Short Description</label>
                  <textarea 
                    rows={2}
                    disabled={scriptureForm.isStatic}
                    placeholder="Brief overview of the scripture lessons"
                    value={scriptureForm.description}
                    onChange={(e) => setScriptureForm({ ...scriptureForm, description: e.target.value })}
                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none font-semibold text-amber-950 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Cover Image URL</label>
                  <input 
                    type="text"
                    disabled={scriptureForm.isStatic}
                    placeholder="Unsplash image URL"
                    value={scriptureForm.coverImage}
                    onChange={(e) => setScriptureForm({ ...scriptureForm, coverImage: e.target.value })}
                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none font-semibold text-amber-950 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Detailed Introduction (Devanagari Hindi)</label>
                  <textarea 
                    rows={3}
                    disabled={scriptureForm.isStatic}
                    placeholder="A beautiful detailed introduction to lead inside readers screen"
                    value={scriptureForm.introduction}
                    onChange={(e) => setScriptureForm({ ...scriptureForm, introduction: e.target.value })}
                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none font-semibold text-amber-950 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Author (e.g. गोस्वामी तुलसीदास)</label>
                  <input 
                    type="text"
                    disabled={scriptureForm.isStatic}
                    value={scriptureForm.author}
                    onChange={(e) => setScriptureForm({ ...scriptureForm, author: e.target.value })}
                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none font-semibold text-amber-950 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Difficulty (e.g. Beginner, Intermediate)</label>
                  <input 
                    type="text"
                    disabled={scriptureForm.isStatic}
                    value={scriptureForm.difficulty}
                    onChange={(e) => setScriptureForm({ ...scriptureForm, difficulty: e.target.value })}
                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none font-semibold text-amber-950 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Language</label>
                  <input 
                    type="text"
                    disabled={scriptureForm.isStatic}
                    value={scriptureForm.language}
                    onChange={(e) => setScriptureForm({ ...scriptureForm, language: e.target.value })}
                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none font-semibold text-amber-950 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Reading Time (e.g. 15 mins/chapter)</label>
                  <input 
                    type="text"
                    disabled={scriptureForm.isStatic}
                    value={scriptureForm.readingTime}
                    onChange={(e) => setScriptureForm({ ...scriptureForm, readingTime: e.target.value })}
                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none font-semibold text-amber-950 dark:text-white"
                  />
                </div>

              </div>

              {!scriptureForm.isStatic && (
                <div className="flex gap-3 justify-end pt-3 border-t dark:border-slate-800">
                  <button 
                    onClick={() => setIsEditingScripture(false)}
                    className="px-5 py-2.5 bg-neutral-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveScripture}
                    className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                  >
                    <Save size={14} /> Save Changes
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* CHAPTER MODAL */}
        {isEditingChapter && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[32px] border border-orange-100 dark:border-slate-800 p-6 max-w-md w-full space-y-6"
            >
              <div className="flex justify-between items-center pb-3 border-b dark:border-slate-800">
                <h3 className="text-base font-bold font-serif text-amber-950 dark:text-amber-100">
                  {chapterForm.id && activeScripture.chapters.find((c: any) => c.id === chapterForm.id) ? 'Edit Chapter' : 'Add New Chapter'}
                </h3>
                <button onClick={() => setIsEditingChapter(false)} className="p-2 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Chapter ID (e.g. chapter_1, ayodhya_kand)</label>
                  <input 
                    type="text"
                    disabled={!!activeScripture.chapters.find((c: any) => c.id === chapterForm.id)}
                    value={chapterForm.id}
                    onChange={(e) => setChapterForm({ ...chapterForm, id: e.target.value })}
                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none font-semibold text-amber-950 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Sanskrit/Hindi Name (e.g. अध्याय १ - अर्जुनविषादयोग)</label>
                  <input 
                    type="text"
                    placeholder="अध्याय १ - अर्जुनविषादयोग"
                    value={chapterForm.name}
                    onChange={(e) => setChapterForm({ ...chapterForm, name: e.target.value })}
                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none font-semibold text-amber-950 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Subtitle/English Title (e.g. Grief of Arjuna)</label>
                  <input 
                    type="text"
                    placeholder="Grief of Arjuna"
                    value={chapterForm.title}
                    onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none font-semibold text-amber-950 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-400 uppercase tracking-wider block">Sequence Number</label>
                    <input 
                      type="number"
                      value={chapterForm.number}
                      onChange={(e) => setChapterForm({ ...chapterForm, number: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none font-semibold text-amber-950 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-400 uppercase tracking-wider block">Total Verses count</label>
                    <input 
                      type="number"
                      value={chapterForm.totalVerses}
                      onChange={(e) => setChapterForm({ ...chapterForm, totalVerses: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none font-semibold text-amber-950 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="checkbox"
                    id="isHidden"
                    checked={chapterForm.isHidden || false}
                    onChange={(e) => setChapterForm({ ...chapterForm, isHidden: e.target.checked })}
                    className="rounded border-orange-200 text-orange-500 focus:ring-orange-500"
                  />
                  <label htmlFor="isHidden" className="font-bold text-slate-600 dark:text-slate-300">Hide this chapter from reading list</label>
                </div>

              </div>

              <div className="flex gap-3 justify-end pt-3 border-t dark:border-slate-800">
                <button 
                  onClick={() => setIsEditingChapter(false)}
                  className="px-5 py-2.5 bg-neutral-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveChapter}
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <Save size={14} /> Save Chapter
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* VERSE MODAL */}
        {isEditingVerse && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[32px] border border-orange-100 dark:border-slate-800 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6"
            >
              <div className="flex justify-between items-center pb-3 border-b dark:border-slate-800">
                <h3 className="text-base font-bold font-serif text-amber-950 dark:text-amber-100">
                  {chapterVerses.find(v => v.number === verseForm.number) ? `Edit Verse ${verseForm.number}` : `Add New Verse`}
                </h3>
                <button onClick={() => setIsEditingVerse(false)} className="p-2 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Verse Number</label>
                  <input 
                    type="number"
                    value={verseForm.number}
                    onChange={(e) => setVerseForm({ ...verseForm, number: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none font-semibold text-amber-950 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Verse ID (e.g. 1_1)</label>
                  <input 
                    type="text"
                    value={verseForm.id}
                    onChange={(e) => setVerseForm({ ...verseForm, id: e.target.value })}
                    placeholder="Leave empty to auto-generate"
                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none font-semibold text-amber-950 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Original Sanskrit / Shloka Text</label>
                  <textarea 
                    rows={3}
                    placeholder="धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः..."
                    value={verseForm.original}
                    onChange={(e) => setVerseForm({ ...verseForm, original: e.target.value })}
                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none font-semibold text-amber-950 dark:text-white whitespace-pre-line font-serif text-sm"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Word Meanings (Devanagari Hindi)</label>
                  <textarea 
                    rows={2}
                    placeholder="मामकाः — मेरे (पुत्रों); पाण्डवाः — पाण्डु के पुत्रों ने..."
                    value={verseForm.wordMeaning}
                    onChange={(e) => setVerseForm({ ...verseForm, wordMeaning: e.target.value })}
                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none font-semibold text-amber-950 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Hindi Meaning / Translation</label>
                  <textarea 
                    rows={2}
                    placeholder="Simple Hindi translation of the verse..."
                    value={verseForm.hindi}
                    onChange={(e) => setVerseForm({ ...verseForm, hindi: e.target.value })}
                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none font-semibold text-amber-950 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">English Translation</label>
                  <textarea 
                    rows={2}
                    placeholder="Simple English translation of the verse..."
                    value={verseForm.english}
                    onChange={(e) => setVerseForm({ ...verseForm, english: e.target.value })}
                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none font-semibold text-amber-950 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Detailed Explanation / Commentary (Devanagari Hindi)</label>
                  <textarea 
                    rows={4}
                    placeholder="Detailed spiritual breakdown and advice for daily life lessons..."
                    value={verseForm.explanation}
                    onChange={(e) => setVerseForm({ ...verseForm, explanation: e.target.value })}
                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none font-semibold text-amber-950 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Notes & References</label>
                  <input 
                    type="text"
                    placeholder="e.g. आदि शंकराचार्य भाष्य, अध्याय १"
                    value={verseForm.notes}
                    onChange={(e) => setVerseForm({ ...verseForm, notes: e.target.value })}
                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl outline-none font-semibold text-amber-950 dark:text-white"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2 col-span-2">
                  <input 
                    type="checkbox"
                    id="quizAvailable"
                    checked={verseForm.quizAvailable || false}
                    onChange={(e) => setVerseForm({ ...verseForm, quizAvailable: e.target.checked })}
                    className="rounded border-orange-200 text-orange-500 focus:ring-orange-500"
                  />
                  <label htmlFor="quizAvailable" className="font-bold text-slate-600 dark:text-slate-300">Enable quiz questions for this verse</label>
                </div>

              </div>

              <div className="flex gap-3 justify-end pt-3 border-t dark:border-slate-800">
                <button 
                  onClick={() => setIsEditingVerse(false)}
                  className="px-5 py-2.5 bg-neutral-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveVerse}
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <Save size={14} /> Save Verse
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </AnimatePresence>

    </div>
  );
};
