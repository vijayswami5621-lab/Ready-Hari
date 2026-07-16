import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { doc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Subject } from './types';
import { SUBJECT_CHAPTERS, Chapter } from './chaptersConfig';
import { fallbackSubjects } from '../../utils/offlineFallbackData';
import { seedQuizDatabase } from './quizSeeder';
import { 
  ArrowLeft, Clock, BookOpen, Play, CheckCircle2, AlertCircle, Sparkles, Trophy, Globe, Compass, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useGoBack } from '../../hooks/useGoBack';

export const SubjectDetail = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { user } = useAuthStore();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [chapterProgress, setChapterProgress] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [chapters, setChapters] = useState<any[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(true);

  // Preserve language filter using localStorage
  const [language, setLanguage] = useState<'Hindi' | 'English'>(() => {
    return (localStorage.getItem('hari_quiz_language') as 'Hindi' | 'English') || 'Hindi';
  });

  // Save selected language to localStorage
  const handleLanguageChange = (lang: 'Hindi' | 'English') => {
    setLanguage(lang);
    localStorage.setItem('hari_quiz_language', lang);
  };

  useEffect(() => {
    if (!subjectId) return;

    setLoading(true);

    const resolveFallbackSubject = () => {
      // Offline-First: Try memory, localStorage, and static fallbacks
      let localSub: any = null;
      try {
        const cachedSubjectsStr = localStorage.getItem('hp_cache_quiz_subjects_[]');
        if (cachedSubjectsStr) {
          const parsed = JSON.parse(cachedSubjectsStr);
          localSub = parsed.find((s: any) => s.id === subjectId);
        }
      } catch (e) {
        console.warn("Error parsing cached subjects:", e);
      }
      if (!localSub) {
        localSub = fallbackSubjects.find(s => s.id === subjectId);
      }
      if (localSub) {
        setSubject(localSub as Subject);
      }
    };

    // 3-second Max loading constraint to prevent infinite loading screens
    const loadingTimeout = setTimeout(() => {
      console.warn(`[SubjectDetail] Loading timed out for ${subjectId}. Resolving with fallbacks immediately.`);
      resolveFallbackSubject();
      setLoading(false);
      // Automatically attempt to seed Firestore in the background
      seedQuizDatabase().catch(e => console.warn("Background database seeding failed:", e));
    }, 3000);

    // 1. Fetch Subject doc
    const subRef = doc(db, 'quiz_subjects', subjectId);
    const unsubSubject = onSnapshot(subRef, (snap) => {
      clearTimeout(loadingTimeout);
      if (snap.exists()) {
        setSubject({ id: snap.id, ...snap.data() } as Subject);
        setLoading(false);
      } else {
        console.warn(`[SubjectDetail] Subject ${subjectId} not found in Firestore. Resolving with fallback and seeding.`);
        resolveFallbackSubject();
        setLoading(false);
        seedQuizDatabase().catch(e => console.warn("Background database seeding failed:", e));
      }
    }, (err) => {
      clearTimeout(loadingTimeout);
      console.error("[SubjectDetail] Error loading subject details from Firestore, reverting to fallback:", err);
      resolveFallbackSubject();
      setLoading(false);
    });

    // 2. Fetch User chapter progress for this subject
    let unsubProgress = () => {};
    if (user) {
      const progRef = collection(db, 'userStats', user.uid, 'chapter_progress');
      const qProg = query(progRef, where('subjectId', '==', subjectId));
      unsubProgress = onSnapshot(qProg, (snap) => {
        const progressMap: Record<string, any> = {};
        snap.forEach(doc => {
          const data = doc.data();
          progressMap[data.chapterId] = { id: doc.id, ...data };
        });
        setChapterProgress(progressMap);
      });
    }

    return () => {
      clearTimeout(loadingTimeout);
      unsubSubject();
      unsubProgress();
    };
  }, [subjectId, user]);

  // Fetch chapters list with background sync
  useEffect(() => {
    if (!subjectId) return;

    const localConfigChapters = SUBJECT_CHAPTERS[subjectId] || [];
    const cachedStr = localStorage.getItem(`hari_chapters_${subjectId}`);
    if (cachedStr) {
      try {
        const parsed = JSON.parse(cachedStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChapters(parsed);
          setChaptersLoading(false);
        } else {
          setChapters(localConfigChapters);
          setChaptersLoading(false);
        }
      } catch (e) {
        setChapters(localConfigChapters);
        setChaptersLoading(false);
      }
    } else {
      setChapters(localConfigChapters);
      setChaptersLoading(false);
    }

    const refreshChaptersBackground = async (retryCount = 0) => {
      try {
        const localChapters = SUBJECT_CHAPTERS[subjectId] || [];
        const response = await fetch('/api/quiz/get-or-create-chapters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subjectId,
            subjectName: subject?.name || subjectId,
            localChapters
          })
        });
        if (response.ok) {
          const result = await response.json();
          if (Array.isArray(result.chapters) && result.chapters.length > 0) {
            setChapters(result.chapters);
            localStorage.setItem(`hari_chapters_${subjectId}`, JSON.stringify(result.chapters));
          }
        } else if (retryCount < 2 && localConfigChapters.length === 0) {
          setTimeout(() => {
            refreshChaptersBackground(retryCount + 1);
          }, Math.pow(2, retryCount) * 1000);
        }
      } catch (err) {
        console.warn("Silent chapters refresh status:", err);
        if (retryCount < 2 && localConfigChapters.length === 0) {
          setTimeout(() => {
            refreshChaptersBackground(retryCount + 1);
          }, Math.pow(2, retryCount) * 1000);
        }
      }
    };

    refreshChaptersBackground();
  }, [subjectId, subject?.name]);

  const handleStartChapter = (chapterId: string) => {
    navigate(`/quiz/play/chapter_play_${subjectId}_${chapterId}`);
  };

  const getSpiritualDecoration = (id: string) => {
    switch(id) {
      case 'bhagavad_gita': return { emoji: '📖', banner: 'from-[#FF6B00]/10 via-[#FFA726]/5 to-[#FFFDF8]', glow: 'shadow-[#FF6B00]/10' };
      case 'hanuman_chalisa': return { emoji: '📿', banner: 'from-[#FFA726]/10 via-[#D4AF37]/5 to-[#FFFDF8]', glow: 'shadow-[#FFA726]/10' };
      case 'ramcharitmanas': return { emoji: '🏹', banner: 'from-[#CC5200]/10 via-[#FF6B00]/5 to-[#FFFDF8]', glow: 'shadow-[#CC5200]/10' };
      case 'ramayana': return { emoji: '🏹', banner: 'from-[#FF6B00]/10 via-[#D4AF37]/5 to-[#FFFDF8]', glow: 'shadow-[#FF6B00]/10' };
      case 'mahabharata': return { emoji: '🛡️', banner: 'from-amber-600/10 via-amber-500/5 to-[#FFFDF8]', glow: 'shadow-amber-500/10' };
      case 'shiv_puran': return { emoji: '🔱', banner: 'from-blue-600/5 via-indigo-500/5 to-[#FFFDF8]', glow: 'shadow-blue-500/10' };
      default: return { emoji: '✨', banner: 'from-orange-50/20 via-neutral-50 to-[#FFFDF8]', glow: 'shadow-orange-500/5' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFDF8] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-[#786D63] mt-4 font-bold font-sans">Wisdom structure aligning...</p>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen bg-[#FFFDF8] flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#FFF7ED] border border-[#FF6B00]/20 flex items-center justify-center text-3xl animate-pulse">
          📖
        </div>
        <div className="space-y-2">
          <h3 className="font-sans font-black text-lg text-[#2E241B]">Aligning Divine Scriptures...</h3>
          <p className="text-xs text-[#786D63] max-w-sm mx-auto font-mukta leading-relaxed">
            The sacred scriptural passages and wisdom modules are currently aligning. Our spiritual scholars are synchronizing the chapters and verses... Please wait.
          </p>
        </div>
        <div className="flex justify-center gap-2 items-center text-xs text-[#FF6B00] font-bold">
          <div className="w-4 h-4 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
          <span>Refining sacred content...</span>
        </div>
        <button 
          onClick={() => navigate('/quiz')}
          className="bg-gradient-to-r from-[#FF6B00] to-[#FFA726] text-white font-extrabold py-3.5 px-6 rounded-2xl text-xs shadow-md shadow-[#FF6B00]/20"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const decor = getSpiritualDecoration(subject.id);

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#2E241B] pb-24 font-sans select-none">
      
      {/* Subject Header Banner */}
      <div className={`relative pt-12 pb-24 px-6 bg-gradient-to-b ${decor.banner} border-b border-[#EFE7DB]/60 overflow-hidden`}>
        {/* Soft background mandala ornament */}
        <div className="absolute top-[-30px] right-[-30px] w-48 h-48 rounded-full bg-[#FF6B00]/5 border border-[#FF6B00]/10 flex items-center justify-center pointer-events-none animate-spin-slow">
          <div className="w-32 h-32 rounded-full border border-dashed border-[#FF6B00]/20" />
        </div>

        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="flex justify-between items-center">
            <button 
              onClick={() => goBack('/quiz')}
              className="flex items-center gap-2 bg-white hover:bg-[#FFF7ED] border border-[#EFE7DB] text-[#2E241B] px-4 py-2 rounded-2xl text-xs font-bold transition duration-300 shadow-sm"
            >
              <ArrowLeft size={14} className="text-[#FF6B00]" />
              <span>मुख्य पृष्ठ</span>
            </button>

            <span className="bg-[#FF6B00]/10 text-[#FF6B00] text-[9px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full border border-[#FF6B00]/20">
              {subject.difficulty}
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-6 pt-4">
            <div className={`w-20 h-20 rounded-3xl bg-white border border-[#EFE7DB] flex items-center justify-center text-4xl shadow-md ${decor.glow} shrink-0`}>
              {decor.emoji}
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#2E241B]">
                {subject.name}
              </h1>
              <p className="text-xs md:text-sm text-[#786D63] font-mukta max-w-2xl leading-relaxed">
                {subject.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Info Panel */}
      <main className="max-w-4xl mx-auto px-4 -mt-10 relative z-20 space-y-8">
        
        {/* Subheader info bar & Language Selector */}
        <div className="bg-white rounded-[24px] p-5 border border-[#EFE7DB]/80 shadow-[0_4px_20px_rgba(239,231,219,0.2)] flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex gap-6 items-center w-full sm:w-auto justify-around sm:justify-start">
            <div className="text-center sm:text-left">
              <span className="text-[10px] uppercase font-black text-[#786D63]/70 block">Total Chapters</span>
              <span className="text-sm font-extrabold text-[#2E241B] flex items-center gap-1.5 justify-center mt-1">
                <BookOpen size={14} className="text-[#FF6B00]" />
                {chapters.length} Sections
              </span>
            </div>
            <div className="w-[1px] bg-[#EFE7DB] h-8 hidden sm:block" />
            <div className="text-center sm:text-left">
              <span className="text-[10px] uppercase font-black text-[#786D63]/70 block">Level</span>
              <span className="text-sm font-extrabold text-[#2E241B] flex items-center gap-1.5 justify-center mt-1">
                <Trophy size={14} className="text-[#D4AF37]" />
                {subject.difficulty}
              </span>
            </div>
          </div>

          {/* Language Toggle Selector */}
          <div className="flex items-center gap-1 bg-[#FFFDF8] p-1 rounded-xl border border-[#EFE7DB] w-full sm:w-auto">
            <button
              onClick={() => handleLanguageChange('Hindi')}
              className={`flex-1 sm:flex-initial py-2 px-4 rounded-lg text-xs font-bold transition flex items-center gap-1.5 justify-center ${
                language === 'Hindi'
                  ? 'bg-[#FF6B00] text-white shadow-sm'
                  : 'text-[#786D63] hover:text-[#FF6B00]'
              }`}
            >
              <Globe size={12} />
              हिंदी (Hindi)
            </button>
            <button
              onClick={() => handleLanguageChange('English')}
              className={`flex-1 sm:flex-initial py-2 px-4 rounded-lg text-xs font-bold transition flex items-center gap-1.5 justify-center ${
                language === 'English'
                  ? 'bg-[#FF6B00] text-white shadow-sm'
                  : 'text-[#786D63] hover:text-[#FF6B00]'
              }`}
            >
              <Globe size={12} />
              English
            </button>
          </div>
        </div>

        {/* Chapter List */}
        <div className="space-y-6">
          <h2 className="font-sans font-extrabold text-lg text-[#2E241B] px-1 flex items-center gap-2">
            <Compass size={20} className="text-[#FF6B00]" />
            <span>अध्याय सूची और प्रगति (Chapter Progress)</span>
          </h2>

          {chaptersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-64 bg-[#EFE7DB]/30 animate-pulse rounded-[24px]" />
              ))}
            </div>
          ) : chapters.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-[28px] border border-[#EFE7DB] p-8 space-y-4">
              <Sparkles size={40} className="mx-auto text-[#FF6B00] animate-pulse" />
              <div>
                <h3 className="font-sans font-bold text-sm text-[#2E241B]">Chapters Loading...</h3>
                <p className="text-xs text-[#786D63] mt-1 max-w-sm mx-auto">गहन अध्ययन के लिए अध्यायों की संरचना तैयार की जा रही है।</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {chapters.map((chapter, idx) => {
                const progress = chapterProgress[chapter.id];
                const isCompleted = progress?.isCompleted === true;
                const isInProgress = progress && !isCompleted;
                
                const totalQuestions = progress?.totalQuestions || 25;
                const completedQuestions = progress?.completedQuestionsCount || 0;
                const completionPercentage = Math.min(Math.round((completedQuestions / totalQuestions) * 100), 100);

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ y: -4, scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    key={chapter.id}
                    className="bg-white rounded-[24px] border border-[#EFE7DB]/80 p-5 shadow-[0_4px_16px_rgba(239,231,219,0.15)] flex flex-col justify-between hover:shadow-md transition-all duration-300"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] uppercase font-black text-[#FF6B00] bg-[#FFF7ED] px-2.5 py-1 rounded-md border border-[#FF6B00]/10">
                          {language === 'Hindi' ? `खण्ड ${chapter.number}` : `Part ${chapter.number}`}
                        </span>

                        {isCompleted && (
                          <span className="flex items-center gap-1 text-[9px] font-black text-green-600 bg-green-500/10 border border-green-500/20 px-2.5 py-0.5 rounded-full uppercase">
                            <CheckCircle2 size={10} className="fill-current text-white" />
                            {language === 'Hindi' ? 'पूर्ण' : 'Completed'}
                          </span>
                        )}

                        {isInProgress && (
                          <span className="flex items-center gap-1 text-[9px] font-black text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full uppercase">
                            <Clock size={10} />
                            {language === 'Hindi' ? 'प्रगति पर' : 'In Progress'}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-sans font-bold text-sm md:text-base text-[#2E241B] leading-tight">
                          {language === 'Hindi' ? chapter.nameHindi : chapter.nameEnglish}
                        </h3>
                        <p className="text-[11px] text-[#786D63] leading-relaxed line-clamp-2 font-mukta">
                          {language === 'Hindi' ? chapter.descriptionHindi : chapter.descriptionEnglish}
                        </p>
                      </div>
                    </div>

                    {/* Progress details */}
                    <div className="mt-6 pt-4 border-t border-[#EFE7DB]/60 space-y-4">
                      {(isInProgress || isCompleted) && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-[9px] font-black text-[#786D63]/80 uppercase">
                            <span>Chapter Progress</span>
                            <span>{completedQuestions}/{totalQuestions} Qs ({completionPercentage}%)</span>
                          </div>
                          <div className="w-full h-1.5 bg-[#FFFDF8] border border-[#EFE7DB] rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${isCompleted ? 'bg-green-500' : 'bg-[#FF6B00]'}`}
                              style={{ width: `${completionPercentage}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {isCompleted && (
                        <div className="flex justify-between items-center text-[10px] font-bold text-[#786D63]">
                          <span className="uppercase text-[9px]">YOUR GRADE</span>
                          <span className="text-green-600">
                            {progress.correctCount} Correct • {progress.totalScore} Pts
                          </span>
                        </div>
                      )}

                      {/* Dynamic CTA button */}
                      <button
                        onClick={() => handleStartChapter(chapter.id)}
                        className={`w-full py-3 rounded-xl font-extrabold text-xs transition duration-300 flex items-center justify-center gap-1.5 shadow-sm ${
                          isCompleted 
                            ? 'bg-[#FFF7ED] text-[#FF6B00] hover:bg-[#FF6B00]/10 border border-[#FF6B00]/10' 
                            : isInProgress
                            ? 'bg-amber-500 text-white hover:bg-amber-600'
                            : 'bg-gradient-to-r from-[#FF6B00] to-[#FFA726] text-white hover:brightness-105'
                        }`}
                      >
                        <Play size={11} className={isCompleted ? "" : "fill-white"} />
                        <span>
                          {isCompleted 
                            ? (language === 'Hindi' ? 'पुनः परीक्षा लें (Re-take)' : 'Re-take Chapter') 
                            : isInProgress 
                            ? (language === 'Hindi' ? 'प्रगति जारी रखें' : 'Resume Quiz') 
                            : (language === 'Hindi' ? 'प्रारम्भ करें (Start)' : 'Start Quiz')}
                        </span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
