import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { doc, getDoc, collection, query, where, getDocs, setDoc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import * as fallbacks from '../../utils/offlineFallbackData';
import { Quiz, Question, QuizProgress, QuizHistory, LeaderboardEntry } from './types';
import { SUBJECT_CHAPTERS } from './chaptersConfig';
import { 
  ArrowLeft, Clock, Award, ChevronRight, ChevronLeft, Bookmark, 
  Volume2, HelpCircle, AlertCircle, Sparkles, AlertTriangle, Compass 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useHaptics } from '../../hooks/useHaptics';
import { useGoBack } from '../../hooks/useGoBack';

export const QuizPlay = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { user, userData } = useAuthStore();
  const haptics = useHaptics();

  // Loaders & database states
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Quiz progression states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string | string[]>>({});
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(120); // standard fallback
  const [baseCompletedCount, setBaseCompletedCount] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Real-time progressive feedback for Chapters
  const currentRoundAnsweredCount = React.useMemo(() => {
    return questions.filter(q => selectedAnswers[q.id] !== undefined && selectedAnswers[q.id] !== null && (!Array.isArray(selectedAnswers[q.id]) || (selectedAnswers[q.id] as string[]).length > 0)).length;
  }, [questions, selectedAnswers]);

  const overallChapterProgress = React.useMemo(() => {
    if (!quizId || !quizId.startsWith('chapter_play_')) return null;
    const count = Math.min(baseCompletedCount + currentRoundAnsweredCount, 25);
    return {
      count,
      percent: Math.round((count / 25) * 100)
    };
  }, [quizId, baseCompletedCount, currentRoundAnsweredCount]);

  // Intercept and prevent back navigation/gesture to avoid progress loss
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      window.history.pushState(null, '', window.location.href);
      setShowExitConfirm(true);
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleConfirmExit = () => {
    window.removeEventListener('popstate', () => {});
    goBack('/quiz');
  };

  // Load quiz, questions, and existing saved progress
  useEffect(() => {
    if (!quizId || !user) return;

    setLoading(true);

    // Strict 4-second loading timeout to prevent getting stuck forever on slow/dead API/Firestore
    const loadingTimeout = setTimeout(() => {
      console.warn("[QuizPlay Timeout] Quiz loading exceeded 4 seconds, force-activating fallbacks.");
      
      const parsedSubjectId = 'hindu_dharma';
      const finalQuizId = quizId || 'ai_mixed';
      const fallbackQuizObj = {
        id: finalQuizId,
        subjectId: parsedSubjectId,
        name: 'Divine Wisdom Challenge',
        description: 'An adaptive scriptural practice session to deepen your wisdom.',
        coverImage: "https://images.unsplash.com/photo-1608958416719-792f44053351?auto=format&fit=crop&w=800&q=80",
        type: "mixed",
        timeLimit: 120,
        questionsCount: 10,
        points: 100,
        isPublished: true,
        isTodayQuiz: false
      } as unknown as Quiz;

      const selectedLang = localStorage.getItem('hari_quiz_language') || 'Hindi';
      const fbQs = fallbacks.fallbackQuestions.slice(0, 10).map((q, i) => ({
        id: `fallback_timeout_${i}`,
        questionId: `fallback_timeout_${i}`,
        quizId: finalQuizId,
        subjectId: parsedSubjectId,
        chapterId: "General",
        language: selectedLang,
        text: q.text,
        type: "mcq",
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || "",
        scriptureRef: q.scriptureRef || "",
        chapter: "General",
        verse: `${i + 1}`
      })) as unknown as Question[];

      setQuiz(fallbackQuizObj);
      setTimeLeft(120);
      setQuestions(fbQs);
      setLoading(false);
    }, 4000);

    const loadQuizData = async () => {
      try {
        let quizData: Quiz | null = null;
        let questionsList: Question[] = [];
        let finalQuizId = quizId;

        const isChapterPlay = quizId.startsWith('chapter_play_');

        if (isChapterPlay) {
          const parts = quizId.substring("chapter_play_".length).split("_chapter_");
          const subjectId = parts[0];
          const chapterId = `chapter_${parts[1]}`;
          
          let chapterName = `Chapter ${chapterId}`;
          const chaptersList = SUBJECT_CHAPTERS[subjectId] || [];
          const chapterObj = chaptersList.find(c => c.id === chapterId);
          if (chapterObj) {
            chapterName = chapterObj.nameEnglish;
          } else {
            try {
              const chapSnap = await getDoc(doc(db, 'quiz_chapters', `${subjectId}_${chapterId}`));
              if (chapSnap.exists()) {
                chapterName = chapSnap.data().nameEnglish;
              }
            } catch (e) {
              console.warn("Failed to fetch dynamic chapter name:", e);
            }
          }
          
          let response: Response | null = null;
          try {
            response = await fetch('/api/quiz/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'chapter',
                subjectId,
                chapterId,
                chapterName,
                language: localStorage.getItem('hari_quiz_language') || 'Hindi',
                userId: user.uid
              })
            });
          } catch (fetchErr) {
            console.warn("Network error during chapter generation, using client fallback:", fetchErr);
          }

          if (response && response.ok) {
            const result = await response.json();
            quizData = result.quiz as Quiz;
            questionsList = result.questions as Question[];
          } else {
            console.warn("AI chapter generation endpoint failed or was unreachable. Synthesizing client-side fallback quiz.");
            quizData = {
              id: `chapter_play_${subjectId}_${chapterId}`,
              subjectId,
              chapterId,
              name: chapterName || `Chapter ${chapterId}`,
              description: `Comprehensive practice module for ${chapterName || chapterId}.`,
              coverImage: "https://images.unsplash.com/photo-1608958416719-792f44053351?auto=format&fit=crop&w=800&q=80",
              type: "chapter",
              timeLimit: 300,
              questionsCount: 10,
              points: 100,
              isPublished: true,
              isTodayQuiz: false
            } as unknown as Quiz;

            const selectedLang = localStorage.getItem('hari_quiz_language') || 'Hindi';
            let matchingFallbacks = fallbacks.fallbackQuestions.filter(q => q.subjectId === subjectId);
            if (matchingFallbacks.length === 0) {
              matchingFallbacks = fallbacks.fallbackQuestions;
            }

            questionsList = matchingFallbacks.map((q, i) => ({
              id: `fallback_q_${subjectId}_${chapterId}_${selectedLang.toLowerCase()}_${i}`,
              questionId: `fallback_q_${subjectId}_${chapterId}_${selectedLang.toLowerCase()}_${i}`,
              quizId: `chapter_quiz_${subjectId}_${chapterId}`,
              subjectId,
              chapterId,
              language: selectedLang,
              text: q.text,
              type: "mcq",
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation || "",
              scriptureRef: q.scriptureRef || "",
              chapter: chapterId,
              verse: `${i + 1}`
            })) as unknown as Question[];
          }
          finalQuizId = quizData.id;

          let completedQuestionsCount = 0;
          try {
            const chapProgRef = doc(db, 'userStats', user.uid, 'chapter_progress', `${subjectId}_${chapterId}`);
            const chapProgSnap = await getDoc(chapProgRef);
            completedQuestionsCount = chapProgSnap.exists() ? (chapProgSnap.data().completedQuestionsCount || 0) : 0;
            if (completedQuestionsCount >= 25) {
              completedQuestionsCount = 0;
              await setDoc(chapProgRef, { completedQuestionsCount: 0, isCompleted: false }, { merge: true });
              await setDoc(doc(db, 'userStats', user.uid, 'quiz_progress', finalQuizId), {
                isCompleted: false,
                selectedAnswers: {},
                bookmarks: [],
                currentQuestionIndex: 0,
                lastActive: serverTimestamp()
              }, { merge: true });
            }
          } catch (dbErr) {
            console.warn("Could not load chapter progress:", dbErr);
          }

          const roundStartIdx = Math.floor(completedQuestionsCount / 10) * 10;
          setBaseCompletedCount(roundStartIdx);
          questionsList = questionsList.slice(roundStartIdx, roundStartIdx + 10);
        } else if (quizId === 'ai_mixed' || quizId.startsWith('ai_subject_')) {
          const userSelectedLang = localStorage.getItem('hari_quiz_language') || 'Hindi';
          let reqBody: any = {
            language: userSelectedLang,
            userId: user.uid
          };
          if (quizId === 'ai_mixed') {
            reqBody.type = 'mixed';
          } else {
            const parsedSubjectId = quizId.replace('ai_subject_', '');
            reqBody.type = 'subject';
            reqBody.subjectId = parsedSubjectId;
          }

          let response: Response | null = null;
          try {
            response = await fetch('/api/quiz/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(reqBody)
            });
          } catch (fetchErr) {
            console.warn("Network error during AI generation:", fetchErr);
          }

          if (response && response.ok) {
            const result = await response.json();
            quizData = result.quiz as Quiz;
            questionsList = result.questions as Question[];
          } else {
            const parsedSubjectId = quizId.startsWith('ai_subject_') ? quizId.replace('ai_subject_', '') : 'ai_mixed';
            quizData = {
              id: quizId,
              subjectId: parsedSubjectId,
              name: quizId === 'ai_mixed' ? "Mixed Spiritual Practice" : `${parsedSubjectId.replace(/_/g, ' ').toUpperCase()} Practice Session`,
              description: "High-quality offline fallback practice module.",
              coverImage: "https://images.unsplash.com/photo-1608958416719-792f44053351?auto=format&fit=crop&w=800&q=80",
              type: quizId === 'ai_mixed' ? "mixed" : "subject",
              timeLimit: 180,
              questionsCount: 10,
              points: 100,
              isPublished: true,
              isTodayQuiz: false
            } as unknown as Quiz;

            let matchingFallbacks = fallbacks.fallbackQuestions;
            if (quizId.startsWith('ai_subject_')) {
              matchingFallbacks = fallbacks.fallbackQuestions.filter(q => q.subjectId === parsedSubjectId);
              if (matchingFallbacks.length === 0) {
                matchingFallbacks = fallbacks.fallbackQuestions;
              }
            }

            questionsList = matchingFallbacks.slice(0, 10).map((q, i) => ({
              id: `fallback_ai_${parsedSubjectId}_${i}`,
              questionId: `fallback_ai_${parsedSubjectId}_${i}`,
              quizId: quizId,
              subjectId: parsedSubjectId,
              chapterId: "General",
              language: userSelectedLang,
              text: q.text,
              type: "mcq",
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation || "",
              scriptureRef: q.scriptureRef || "",
              chapter: "General",
              verse: `${i + 1}`
            })) as unknown as Question[];
          }
          finalQuizId = quizData.id;
        } else {
          try {
            const quizSnap = await getDoc(doc(db, 'quiz_quizzes', quizId));
            if (quizSnap.exists()) {
              quizData = { id: quizSnap.id, ...quizSnap.data() } as Quiz;
            } else {
              const fb = fallbacks.fallbackQuizzes.find(q => q.id === quizId);
              if (fb) quizData = fb as unknown as Quiz;
            }
          } catch (e) {
            const fb = fallbacks.fallbackQuizzes.find(q => q.id === quizId);
            if (fb) quizData = fb as unknown as Quiz;
          }

          if (!quizData) {
            quizData = {
              id: quizId || 'ai_mixed',
              subjectId: 'hindu_dharma',
              name: 'Divine Wisdom Session',
              description: 'A personalized spiritual practice to deepen your scriptural wisdom.',
              coverImage: "https://images.unsplash.com/photo-1608958416719-792f44053351?auto=format&fit=crop&w=800&q=80",
              type: "mixed",
              timeLimit: 180,
              questionsCount: 10,
              points: 100,
              isPublished: true,
              isTodayQuiz: false
            } as unknown as Quiz;
          }

          try {
            const qRef = collection(db, 'quiz_questions');
            const qQuery = query(qRef, where('quizId', '==', quizId));
            const qSnap = await getDocs(qQuery);
            qSnap.forEach(docSnap => {
              questionsList.push({ id: docSnap.id, ...docSnap.data() } as Question);
            });
          } catch (e) {
            console.warn("Questions fetch issue:", e);
          }

          if (questionsList.length === 0) {
            const fbQs = fallbacks.fallbackQuestions.filter(q => q.quizId === quizId || q.subjectId === quizData?.subjectId);
            if (fbQs.length > 0) {
              questionsList = fbQs as unknown as Question[];
            } else {
              questionsList = fallbacks.fallbackQuestions.slice(0, 10) as unknown as Question[];
            }
          }
        }

        if (quizData && questionsList.length < 10) {
          const countNeeded = 10 - questionsList.length;
          try {
            const extraRes = await fetch('/api/quiz/generate-additional', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                quizId: finalQuizId,
                subjectId: quizData.subjectId || 'hindu_dharma',
                quizName: quizData.name,
                count: countNeeded,
                existingQuestions: questionsList.map(q => q.text)
              })
            });
            if (extraRes.ok) {
              const extraData = await extraRes.json();
              if (Array.isArray(extraData.questions)) {
                questionsList = [...questionsList, ...extraData.questions];
              }
            }
          } catch (e) {
            console.error("Failed to generate additional questions:", e);
          }
        }

        // Post-load guaranteed fallback if questions are still empty
        if (!questionsList || questionsList.length === 0) {
          console.warn("[QuizPlay] Empty questions list loaded, resolving with fallbacks.");
          const parsedSubjectId = (quizData && quizData.subjectId) || 'hindu_dharma';
          let fbQs = fallbacks.fallbackQuestions.filter(q => q.subjectId === parsedSubjectId);
          if (fbQs.length === 0) {
            fbQs = fallbacks.fallbackQuestions;
          }
          const selectedLang = localStorage.getItem('hari_quiz_language') || 'Hindi';
          questionsList = fbQs.slice(0, 10).map((q, i) => ({
            id: `fallback_q_safe_${parsedSubjectId}_${selectedLang.toLowerCase()}_${i}`,
            questionId: `fallback_q_safe_${parsedSubjectId}_${selectedLang.toLowerCase()}_${i}`,
            quizId: finalQuizId || 'ai_mixed',
            subjectId: parsedSubjectId,
            chapterId: "General",
            language: selectedLang,
            text: q.text,
            type: "mcq",
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || "",
            scriptureRef: q.scriptureRef || "",
            chapter: "General",
            verse: `${i + 1}`
          })) as unknown as Question[];
        }

        clearTimeout(loadingTimeout);

        setQuiz(quizData);
        setTimeLeft((quizData && quizData.timeLimit) || 120);
        setQuestions(questionsList);

        const progRef = doc(db, 'userStats', user.uid, 'quiz_progress', finalQuizId);
        const progSnap = await getDoc(progRef);
        if (progSnap.exists()) {
          const progData = progSnap.data() as QuizProgress;
          if (progData.isCompleted) {
            setSelectedAnswers({});
            setBookmarks([]);
            setCurrentIndex(0);
          } else {
            setSelectedAnswers(progData.selectedAnswers || {});
            setBookmarks(progData.bookmarks || []);
            if (progData.currentQuestionIndex < questionsList.length) {
              setCurrentIndex(progData.currentQuestionIndex);
            }
          }
        }

        setLoading(false);
      } catch (error) {
        clearTimeout(loadingTimeout);
        console.error("Error loading play quiz data:", error);
        setLoading(false);
      }
    };

    loadQuizData();
  }, [quizId, user]);

  useEffect(() => {
    if (loading || !quiz || isSubmitting) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmitQuiz(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, quiz, isSubmitting]);

  const saveProgressToFirestore = async (
    updatedAnswers: Record<string, string | string[]>,
    updatedBookmarks: string[],
    newIndex: number
  ) => {
    const activeQuizId = quiz ? quiz.id : quizId;
    if (!user || !activeQuizId) return;
    try {
      const progRef = doc(db, 'userStats', user.uid, 'quiz_progress', activeQuizId);
      await setDoc(progRef, {
        id: activeQuizId,
        quizId: activeQuizId,
        currentQuestionIndex: newIndex,
        selectedAnswers: updatedAnswers,
        bookmarks: updatedBookmarks,
        isCompleted: false,
        lastActive: serverTimestamp()
      }, { merge: true });

      if (activeQuizId.startsWith('chapter_play_')) {
        const parts = activeQuizId.substring("chapter_play_".length).split("_chapter_");
        const subjectId = parts[0];
        const chapterId = `chapter_${parts[1]}`;
        const currentRoundAnsweredCount = questions.filter(q => updatedAnswers[q.id] !== undefined && updatedAnswers[q.id] !== null && (!Array.isArray(updatedAnswers[q.id]) || (updatedAnswers[q.id] as string[]).length > 0)).length;
        const totalCompleted = Math.min(baseCompletedCount + currentRoundAnsweredCount, 25);
        
        const chapProgRef = doc(db, 'userStats', user.uid, 'chapter_progress', `${subjectId}_${chapterId}`);
        await setDoc(chapProgRef, {
          completedQuestionsCount: totalCompleted,
          lastActive: serverTimestamp()
        }, { merge: true });
      }
    } catch (error) {
      console.error("Autosave failed:", error);
    }
  };

  const currentQuestion = questions[currentIndex];

  const handleSelectOption = (option: string) => {
    if (!currentQuestion) return;
    haptics?.hapticSelection?.();

    const questionId = currentQuestion.id;
    let newAnswers = { ...selectedAnswers };

    if (currentQuestion.type === 'multiple_correct') {
      const currentSelection = (selectedAnswers[questionId] as string[]) || [];
      if (currentSelection.includes(option)) {
        newAnswers[questionId] = currentSelection.filter(item => item !== option);
      } else {
        newAnswers[questionId] = [...currentSelection, option];
      }
    } else {
      newAnswers[questionId] = option;
    }

    setSelectedAnswers(newAnswers);
    saveProgressToFirestore(newAnswers, bookmarks, currentIndex);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      const newIdx = currentIndex + 1;
      setCurrentIndex(newIdx);
      saveProgressToFirestore(selectedAnswers, bookmarks, newIdx);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const newIdx = currentIndex - 1;
      setCurrentIndex(newIdx);
      saveProgressToFirestore(selectedAnswers, bookmarks, newIdx);
    }
  };

  const handleToggleBookmark = () => {
    if (!currentQuestion) return;
    const questionId = currentQuestion.id;
    let newBookmarks = [...bookmarks];

    if (newBookmarks.includes(questionId)) {
      newBookmarks = newBookmarks.filter(id => id !== questionId);
    } else {
      newBookmarks.push(questionId);
    }

    setBookmarks(newBookmarks);
    saveProgressToFirestore(selectedAnswers, newBookmarks, currentIndex);
  };

  const handleSubmitQuiz = async (timedOut = false) => {
    if (isSubmitting || !user || !quiz) return;
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      let correctCount = 0;
      let wrongCount = 0;
      let skippedCount = 0;
      const evaluationAnswers: Record<string, { selected: string | string[]; isCorrect: boolean }> = {};

      questions.forEach((q) => {
        const selected = selectedAnswers[q.id];
        if (!selected || (Array.isArray(selected) && selected.length === 0)) {
          skippedCount++;
          evaluationAnswers[q.id] = { selected: selected || '', isCorrect: false };
        } else {
          let isCorrect = false;
          if (Array.isArray(q.correctAnswer)) {
            const selArray = Array.isArray(selected) ? selected : [selected];
            isCorrect = q.correctAnswer.length === selArray.length && 
                        q.correctAnswer.every(val => selArray.includes(val));
          } else {
            isCorrect = String(selected).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
          }

          if (isCorrect) {
            correctCount++;
          } else {
            wrongCount++;
          }

          evaluationAnswers[q.id] = { selected, isCorrect };
        }
      });

      const percentage = Math.round((correctCount / questions.length) * 100);
      const calculatedScore = Math.round((correctCount / questions.length) * quiz.points);

      const isChapterPlay = quiz.id.startsWith('chapter_play_');
      let sessionId = `PLAY-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      let certificateId: string | null = null;
      let historyPayload: QuizHistory;

      if (isChapterPlay) {
        const parts = quiz.id.substring("chapter_play_".length).split("_chapter_");
        const subjectId = parts[0];
        const chapterId = `chapter_${parts[1]}`;

        const subSnap = await getDoc(doc(db, 'quiz_subjects', subjectId));
        const subName = subSnap.exists() ? (subSnap.data().name || subjectId) : 'Spiritual Subject';

        const chapProgRef = doc(db, 'userStats', user.uid, 'chapter_progress', `${subjectId}_${chapterId}`);
        const chapProgSnap = await getDoc(chapProgRef);

        const roundNum = Math.floor(baseCompletedCount / 10) + 1;
        sessionId = `PLAY-${subjectId.toUpperCase()}-${chapterId.toUpperCase()}-R${roundNum}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

        historyPayload = {
          id: sessionId,
          userId: user.uid,
          subjectId: subjectId,
          subjectName: subName,
          quizId: quiz.id,
          quizName: `${quiz.name} - Round ${roundNum}`,
          completedAt: new Date().toISOString(),
          score: calculatedScore,
          percentage,
          timeTaken: quiz.timeLimit - timeLeft,
          totalQuestions: questions.length,
          correctCount,
          wrongCount,
          skippedCount,
          answers: evaluationAnswers,
          certificateId: null,
          language: localStorage.getItem('hari_quiz_language') || 'Hindi',
          userDisplayName: user.displayName || 'Devoted Seeker'
        };
        await setDoc(doc(db, 'userStats', user.uid, 'quiz_history', sessionId), historyPayload);

        const newCompletedCount = Math.min(baseCompletedCount + questions.length, 25);
        const isChapterFullyCompleted = newCompletedCount >= 25;

        const prevCorrect = chapProgSnap.exists() && baseCompletedCount > 0 ? (chapProgSnap.data().correctCount || 0) : 0;
        const prevTotalScore = chapProgSnap.exists() && baseCompletedCount > 0 ? (chapProgSnap.data().totalScore || 0) : 0;
        const prevTimeTaken = chapProgSnap.exists() && baseCompletedCount > 0 ? (chapProgSnap.data().timeTaken || 0) : 0;
        const prevAttemptsCount = chapProgSnap.exists() ? (chapProgSnap.data().attemptsCount || 0) : 0;
        const prevBestAccuracy = chapProgSnap.exists() ? (chapProgSnap.data().bestAccuracy || 0) : 0;
        const prevHighestScore = chapProgSnap.exists() ? (chapProgSnap.data().highestScore || 0) : 0;

        const newCorrect = prevCorrect + correctCount;
        const roundTimeTaken = quiz.timeLimit - timeLeft;
        const newTimeTaken = prevTimeTaken + roundTimeTaken;
        const newTotalScore = prevTotalScore + calculatedScore;
        const overallAccuracy = Math.round((newCorrect / 25) * 100);

        await setDoc(chapProgRef, {
          id: `${subjectId}_${chapterId}`,
          subjectId,
          chapterId,
          chapterName: quiz.name,
          completedQuestionsCount: newCompletedCount,
          isCompleted: isChapterFullyCompleted,
          correctCount: newCorrect,
          totalQuestions: 25,
          totalScore: newTotalScore,
          timeTaken: newTimeTaken,
          lastActive: serverTimestamp(),
          attemptsCount: prevAttemptsCount + (isChapterFullyCompleted ? 1 : 0),
          bestAccuracy: isChapterFullyCompleted ? Math.max(prevBestAccuracy, overallAccuracy) : prevBestAccuracy,
          highestScore: isChapterFullyCompleted ? Math.max(prevHighestScore, newTotalScore) : prevHighestScore
        }, { merge: true });

        if (isChapterFullyCompleted && overallAccuracy >= 60) {
          certificateId = `HP-CERT-${subjectId.toUpperCase()}-${chapterId.toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
          
          const certQuery = query(
            collection(db, 'certificates'),
            where('userId', '==', user.uid),
            where('subjectId', '==', subjectId),
            where('chapterId', '==', chapterId)
          );
          const certSnap = await getDocs(certQuery);
          if (!certSnap.empty) {
            certificateId = certSnap.docs[0].id;
          } else {
            const timeSpent = quiz.timeLimit - timeLeft;
            const certPayload = {
              id: certificateId,
              certificateId: certificateId,
              certificateNumber: certificateId,
              userId: user.uid,
              uid: user.uid,
              quizId: `chapter_play_${subjectId}_${chapterId}`,
              quizName: `${subName} - ${quiz.name}`,
              subjectId,
              subject: subName,
              subjectName: subName,
              chapterId,
              chapter: quiz.name || chapterId,
              userName: user.displayName || userData?.name || 'Devotee',
              score: newTotalScore,
              percentage: overallAccuracy,
              accuracy: overallAccuracy,
              completionTime: timeSpent,
              timeTaken: timeSpent,
              generatedDate: new Date().toLocaleDateString('en-CA'),
              completionDate: new Date().toLocaleDateString('en-CA'),
              completedAt: new Date().toISOString(),
              createdTime: new Date().toISOString(),
              pngUrl: "",
              pdfUrl: "",
              certificateImageUrl: "",
              rank: 1,
              status: "issued"
            };

            await setDoc(doc(db, 'userStats', user.uid, 'certificates', certificateId), certPayload);
            await setDoc(doc(db, 'certificates', certificateId), certPayload);

            historyPayload.certificateId = certificateId;
            await setDoc(doc(db, 'userStats', user.uid, 'quiz_history', sessionId), historyPayload);
          }
        }
      } else {
        certificateId = percentage >= 60 
          ? `HP-CERT-${Math.random().toString(36).substr(2, 9).toUpperCase()}` 
          : null;

        historyPayload = {
          id: sessionId,
          userId: user.uid,
          subjectId: quiz.subjectId,
          subjectName: quiz.name || 'Spiritual Quiz',
          quizId: quiz.id,
          quizName: quiz.name,
          completedAt: new Date().toISOString(),
          score: calculatedScore,
          percentage,
          timeTaken: quiz.timeLimit - timeLeft,
          totalQuestions: questions.length,
          correctCount,
          wrongCount,
          skippedCount,
          answers: evaluationAnswers,
          certificateId: certificateId || null,
          language: localStorage.getItem('hari_quiz_language') || 'Hindi',
          userDisplayName: user.displayName || 'Devoted Seeker'
        };
        await setDoc(doc(db, 'userStats', user.uid, 'quiz_history', sessionId), historyPayload);

        if (certificateId) {
          const timeSpent = quiz.timeLimit - timeLeft;
          const certPayload = {
            id: certificateId,
            certificateId: certificateId,
            certificateNumber: certificateId,
            userId: user.uid,
            uid: user.uid,
            quizId: quiz.id,
            quizName: quiz.name,
            subjectId: quiz.subjectId || 'hindu_dharma',
            subject: quiz.subjectId || 'hindu_dharma',
            subjectName: quiz.name || 'Spiritual',
            chapterId: "General",
            chapter: "General Quiz",
            userName: user.displayName || userData?.name || 'Devotee',
            score: calculatedScore,
            percentage,
            accuracy: percentage,
            completionTime: timeSpent,
            timeTaken: timeSpent,
            generatedDate: new Date().toLocaleDateString('en-CA'),
            completionDate: new Date().toLocaleDateString('en-CA'),
            completedAt: new Date().toISOString(),
            createdTime: new Date().toISOString(),
            pngUrl: "",
            pdfUrl: "",
            certificateImageUrl: "",
            rank: 1,
            status: "issued"
          };

          await setDoc(doc(db, 'userStats', user.uid, 'certificates', certificateId), certPayload);
          await setDoc(doc(db, 'certificates', certificateId), certPayload);
        }
      }

      const progRef = doc(db, 'userStats', user.uid, 'quiz_progress', quiz.id);
      await setDoc(progRef, { isCompleted: true }, { merge: true });

      const historyRef = collection(db, 'userStats', user.uid, 'quiz_history');
      const histSnap = await getDocs(historyRef);
      const allHistory: QuizHistory[] = [];
      histSnap.forEach(d => {
        allHistory.push({ id: d.id, ...d.data() } as QuizHistory);
      });

      if (!allHistory.some(h => h.id === sessionId)) {
        allHistory.push(historyPayload);
      }

      let quizAllTimeScore = 0;
      let quizTotalCorrect = 0;
      let quizTotalWrong = 0;
      let quizTotalSkipped = 0;
      let quizTotalQuestions = 0;
      let totalTimeTaken = 0;

      allHistory.forEach(h => {
        quizAllTimeScore += (h.score || 0);
        quizTotalCorrect += (h.correctCount || 0);
        quizTotalWrong += (h.wrongCount || 0);
        quizTotalSkipped += (h.skippedCount || 0);
        quizTotalQuestions += (h.totalQuestions || 0);
        totalTimeTaken += (h.timeTaken || 0);
      });

      const quizTotalPlayed = allHistory.length;
      const quizAccuracy = quizTotalQuestions > 0 ? Math.round((quizTotalCorrect / quizTotalQuestions) * 100) : 0;
      const quizTotalXP = quizAllTimeScore * 10;

      const uniqueDates = Array.from(new Set(allHistory.map(h => {
        try {
          return new Date(h.completedAt).toLocaleDateString('en-CA');
        } catch (e) {
          return '';
        }
      }).filter(Boolean))).sort();

      let quizStreak = 0;
      let quizLongestStreak = 0;

      if (uniqueDates.length > 0) {
        const todayStr = new Date().toLocaleDateString('en-CA');
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toLocaleDateString('en-CA');

        const hasToday = uniqueDates.includes(todayStr);
        const hasYesterday = uniqueDates.includes(yesterdayStr);

        if (hasToday || hasYesterday) {
          let currentRefDate = hasToday ? new Date() : yesterday;
          let active = true;
          while (active) {
            const checkStr = currentRefDate.toLocaleDateString('en-CA');
            if (uniqueDates.includes(checkStr)) {
              quizStreak++;
              currentRefDate.setDate(currentRefDate.getDate() - 1);
            } else {
              active = false;
            }
          }
        }

        let tempStreak = 0;
        let prevTime: number | null = null;
        uniqueDates.forEach(dStr => {
          const curTime = new Date(dStr).getTime();
          if (prevTime === null) {
            tempStreak = 1;
          } else {
            const diffDays = Math.round((curTime - prevTime) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
              tempStreak++;
            } else if (diffDays > 1) {
              if (tempStreak > quizLongestStreak) {
                quizLongestStreak = tempStreak;
              }
              tempStreak = 1;
            }
          }
          prevTime = curTime;
        });
        if (tempStreak > quizLongestStreak) {
          quizLongestStreak = tempStreak;
        }
      }

      const currentHighestScore = allHistory.length > 0 
        ? Math.max(...allHistory.map(h => h.score || 0)) 
        : calculatedScore;

      const userStatsRef = doc(db, 'userStats', user.uid);
      const aggregatedStats = {
        quizAllTimeScore,
        quizTotalXP,
        quizTotalPlayed,
        quizTotalCorrect,
        quizTotalWrong,
        quizTotalSkipped,
        quizAccuracy,
        quizStreak,
        quizLongestStreak,
        quizLastScore: percentage,
        quizLastPlayDate: new Date().toLocaleDateString('en-CA'),
        quizLastPlayTime: serverTimestamp()
      };
      await setDoc(userStatsRef, aggregatedStats, { merge: true });

      const globalLeaderboardRef = doc(db, 'quiz_global_leaderboard', user.uid);
      const globalLeaderboardSnap = await getDoc(globalLeaderboardRef);

      const userLeaderboardPayload = {
        uid: user.uid,
        userId: user.uid,
        displayName: user.displayName || userData?.name || 'Devotee',
        userName: user.displayName || userData?.name || 'Devotee',
        photoURL: user.photoURL || userData?.profileImage || '',
        profileImage: user.photoURL || userData?.profileImage || '',
        overallScore: quizAllTimeScore,
        score: quizAllTimeScore,
        totalXP: quizTotalXP,
        xp: quizTotalXP,
        totalCorrect: quizTotalCorrect,
        correctAnswers: quizTotalCorrect,
        totalWrong: quizTotalWrong,
        wrongAnswers: quizTotalWrong,
        totalSkipped: quizTotalSkipped,
        skippedQuestions: quizTotalSkipped,
        totalQuizCompleted: quizTotalPlayed,
        totalQuizzes: quizTotalPlayed,
        overallAccuracy: quizAccuracy,
        accuracy: quizAccuracy,
        averageTime: quizTotalPlayed > 0 ? Math.round(totalTimeTaken / quizTotalPlayed) : 0,
        currentStreak: quizStreak,
        longestStreak: quizLongestStreak,
        highestScore: currentHighestScore,
        currentRank: 1,
        badge: '📿 Spiritual Seeker',
        badges: ['📿 Spiritual Seeker'],
        updatedAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
      };

      if (globalLeaderboardSnap.exists()) {
        await setDoc(globalLeaderboardRef, userLeaderboardPayload, { merge: true });
      } else {
        await setDoc(globalLeaderboardRef, userLeaderboardPayload);
      }
      
      await setDoc(doc(db, 'quiz_leaderboard', user.uid), userLeaderboardPayload, { merge: true });

      try {
        const globalLeadSnap = await getDocs(collection(db, 'quiz_global_leaderboard'));
        const allLeadEntries: any[] = [];
        globalLeadSnap.forEach(d => {
          if (d.id !== user.uid) {
            allLeadEntries.push({ id: d.id, ...d.data() });
          }
        });
        allLeadEntries.push({ id: user.uid, ...userLeaderboardPayload });

        allLeadEntries.sort((a, b) => {
          const scoreA = a.overallScore || a.score || 0;
          const scoreB = b.overallScore || b.score || 0;
          if (scoreB !== scoreA) return scoreB - scoreA;
          
          const accA = a.overallAccuracy || a.accuracy || 0;
          const accB = b.overallAccuracy || b.accuracy || 0;
          if (accB !== accA) return accB - accA;

          const xpA = a.totalXP || a.xp || 0;
          const xpB = b.totalXP || b.xp || 0;
          if (xpB !== xpA) return xpB - xpA;

          return (a.averageTime || 0) - (b.averageTime || 0);
        });

        const updatePromises = allLeadEntries.map(async (entry, index) => {
          const rank = index + 1;
          let badge = '📿 Spiritual Seeker';
          if (rank === 1) {
            badge = '👑 Spiritual Champion';
          } else if (rank === 2) {
            badge = '🥈 Divine Scholar';
          } else if (rank === 3) {
            badge = '🥉 Bhakti Master';
          } else if (rank <= 10) {
            badge = '⭐ Knowledge Star';
          }

          const updatedEntry = {
            ...entry,
            currentRank: rank,
            rank: rank,
            badge: badge,
            badges: [badge],
            updatedAt: new Date().toISOString()
          };

          await setDoc(doc(db, 'quiz_global_leaderboard', entry.id), updatedEntry);
          await setDoc(doc(db, 'quiz_leaderboard', entry.id), updatedEntry);
        });

        await Promise.all(updatePromises);
      } catch (err) {
        console.error("Global leaderboard calculation error:", err);
      }

      fetch('/api/quiz/pre-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          subjectId: quiz.subjectId || 'ai_mixed'
        })
      }).catch(err => console.error("Background pre-generation failed:", err));

      if (percentage >= 60) {
        navigate(`/quiz/result/${sessionId}?cert=1`);
      } else {
        navigate(`/quiz/result/${sessionId}`);
      }

    } catch (error) {
      console.error("Evaluation/Submission failed:", error);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFDF8] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-[#786D63] mt-4 font-bold font-sans">Preparing question papers...</p>
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#FFFDF8] flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#FFF7ED] border border-[#FF6B00]/20 flex items-center justify-center text-3xl animate-pulse">
          📖
        </div>
        <div className="space-y-2">
          <h3 className="font-sans font-black text-lg text-[#2E241B]">Aligning Divine Wisdom...</h3>
          <p className="text-xs text-[#786D63] max-w-sm mx-auto font-mukta leading-relaxed">
            The scriptural verses and spiritual exercises are currently synchronizing. Please wait while the wisdom structure is aligned for your study.
          </p>
        </div>
        <div className="flex justify-center gap-2 items-center text-xs text-[#FF6B00] font-bold">
          <div className="w-4 h-4 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
          <span>Receiving sacred teachings...</span>
        </div>
      </div>
    );
  }

  const progressPercent = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;
  const isSelected = (option: string) => {
    const currentSel = selectedAnswers[currentQuestion.id];
    if (!currentSel) return false;
    if (Array.isArray(currentSel)) return currentSel.includes(option);
    return currentSel === option;
  };

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#2E241B] pb-24 font-sans select-none">
      
      {/* Play Navigation header */}
      <nav className="fixed top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#EFE7DB]/60 py-4 px-6 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowExitConfirm(true)}
            className="p-2 hover:bg-[#FFF7ED] text-[#2E241B] rounded-full transition"
          >
            <ArrowLeft size={18} className="text-[#FF6B00]" />
          </button>
          <span className="font-sans font-extrabold text-xs text-[#2E241B] max-w-[150px] md:max-w-xs truncate font-mukta">
            {quiz.name}
          </span>
        </div>

        {/* Floating countdown clock */}
        <div className="flex items-center gap-2 bg-[#FFF7ED] border border-[#FF6B00]/10 px-4 py-2 rounded-2xl">
          <Clock size={14} className={timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-[#FF6B00]'} />
          <span className={`text-xs font-mono font-black ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-[#2E241B]'}`}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </span>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 pt-24 space-y-6">
        
        {/* Progress meters card */}
        <div className="bg-white rounded-[24px] border border-[#EFE7DB] p-5 shadow-sm space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-[#786D63]">
              <span className="font-extrabold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FF6B00]" /> 
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="font-black text-[#2E241B]">{progressPercent}%</span>
            </div>
            <div className="h-2 bg-[#FFFDF8] border border-[#EFE7DB] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#FF6B00] to-[#FFA726] rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {overallChapterProgress && (
            <div className="pt-3 border-t border-[#EFE7DB]/60 flex items-center justify-between text-[11px] font-bold text-[#786D63] font-mukta">
              <span>Overall Chapter Progress:</span>
              <span className="text-[#FF6B00] font-black">{overallChapterProgress.count}/25 Questions ({overallChapterProgress.percent}%)</span>
            </div>
          )}
        </div>

        {/* ACTIVE QUESTION CARD */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-[28px] border border-[#EFE7DB] p-6 md:p-8 shadow-sm space-y-6"
          >
            {/* Header meta */}
            <div className="flex justify-between items-center">
              <span className="bg-[#FFF7ED] text-[#FF6B00] border border-[#FF6B00]/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                {currentQuestion.type === 'multiple_correct' ? 'Multiple Choice (Select All)' : 'Single Choice'}
              </span>

              <button
                onClick={handleToggleBookmark}
                className="p-2 bg-[#FFFDF8] border border-[#EFE7DB] rounded-xl hover:bg-[#FFF7ED] text-[#786D63] transition"
              >
                <Bookmark 
                  size={16} 
                  className={bookmarks.includes(currentQuestion.id) ? 'fill-[#FF6B00] text-[#FF6B00]' : 'text-[#786D63]'} 
                />
              </button>
            </div>

            {/* Question Text */}
            <div className="space-y-4">
              <h2 className="text-base md:text-lg font-black text-[#2E241B] leading-relaxed">
                {currentQuestion.text}
              </h2>

              {currentQuestion.scriptureRef && (
                <div className="flex items-center gap-1.5 text-[10px] font-black text-[#FF6B00] bg-[#FFF7ED] px-2.5 py-1 rounded border border-[#FF6B00]/10 w-fit uppercase">
                  <Compass size={12} />
                  <span>{currentQuestion.scriptureRef}</span>
                </div>
              )}
            </div>

            {/* Answer Options list */}
            <div className="grid grid-cols-1 gap-3.5 pt-2">
              {currentQuestion.options.map((option, idx) => {
                const active = isSelected(option);
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(option)}
                    className={`w-full p-4.5 rounded-2xl text-left text-xs md:text-sm font-bold transition duration-200 border flex items-center justify-between group active:scale-99 ${
                      active
                        ? 'bg-[#FFF7ED] border-[#FF6B00] text-[#FF6B00] shadow-sm'
                        : 'bg-white border-[#EFE7DB] text-[#2E241B] hover:border-[#FF6B00]/40'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 pr-2">
                      <span className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 border ${
                        active 
                          ? 'bg-[#FF6B00] text-white border-transparent' 
                          : 'bg-[#FFFDF8] text-[#786D63] border-[#EFE7DB]'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="leading-relaxed">{option}</span>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      active ? 'border-[#FF6B00] bg-[#FF6B00]' : 'border-[#EFE7DB]'
                    }`}>
                      {active && <span className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* BOTTOM ACTION BUTTONS ROW */}
        <div className="flex justify-between items-center gap-3">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`py-3.5 px-5 bg-white border border-[#EFE7DB] text-[#786D63] font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition ${
              currentIndex === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#FFF7ED]'
            }`}
          >
            <ChevronLeft size={16} />
            <span>Prev</span>
          </button>

          {currentIndex === questions.length - 1 ? (
            <button
              onClick={() => handleSubmitQuiz(false)}
              disabled={isSubmitting}
              className="py-3.5 px-8 bg-gradient-to-r from-[#FF6B00] to-[#FFA726] text-white font-extrabold rounded-2xl text-xs flex items-center gap-1.5 shadow-md shadow-[#FF6B00]/20 active:scale-95 hover:brightness-105 transition"
            >
              <Award size={16} />
              <span>{isSubmitting ? 'Evaluating...' : 'Submit Answers'}</span>
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="py-3.5 px-6 bg-white border border-[#EFE7DB] text-[#FF6B00] font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 hover:bg-[#FFF7ED] transition"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          )}
        </div>

      </main>

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[28px] border border-[#EFE7DB] max-w-sm w-full p-6 text-center space-y-4 shadow-xl"
            >
              <AlertTriangle size={40} className="mx-auto text-[#FF6B00] animate-pulse" />
              <div className="space-y-1">
                <h4 className="font-extrabold text-base text-[#2E241B]">Quit Practice Session?</h4>
                <p className="text-xs text-[#786D63] leading-relaxed font-mukta">परीक्षा बीच में छोड़ने से प्रगति रुक जाएगी। क्या आप सचमुच बाहर निकलना चाहते हैं?</p>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="py-3 bg-neutral-100 hover:bg-neutral-200 text-[#786D63] font-bold rounded-xl text-xs"
                >
                  Stay & Play
                </button>
                <button
                  onClick={handleConfirmExit}
                  className="py-3 bg-[#FF6B00] text-white font-extrabold rounded-xl text-xs hover:brightness-105"
                >
                  Quit Quiz
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
