import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Quiz, Question, QuizHistory } from './types';
import { 
  ArrowLeft, RefreshCw, Award, CheckCircle, XCircle, Share2, 
  Copy, Check, FileDown, BookOpen, MessageSquare, Compass, ShieldCheck,
  Minimize2, Sparkles, Star
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { motion, AnimatePresence } from 'motion/react';
import { useGoBack } from '../../hooks/useGoBack';

export const QuizResult = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { user } = useAuthStore();

  const [historyEntry, setHistoryEntry] = useState<QuizHistory | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  
  const showCertInitially = searchParams.get('cert') === '1';
  const [showCertificate, setShowCertificate] = useState(showCertInitially);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  const [showMenu, setShowMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [certScale, setCertScale] = useState(1);

  const certLang = (historyEntry?.language || 'Hindi') as 'Hindi' | 'English';
  const trans = {
    title: certLang === 'Hindi' ? "आध्यात्मिक ज्ञान का प्रमाण पत्र" : "Certificate of Spiritual Wisdom",
    subTitle: certLang === 'Hindi' 
      ? `"न हि ज्ञानेन सदृशं पवित्रमिह विद्यते" (इस संसार में ज्ञान के समान पवित्र करने वाला कुछ भी नहीं है)`
      : `"न हि ज्ञानेन सदृशं पवित्रमिह विद्यते" (In this world, there is nothing as purifying as knowledge)`,
    presentedTo: certLang === 'Hindi' ? "यह सम्मान पत्र गौरवपूर्वक प्रस्तुत किया जाता है" : "This honors credential is proudly presented to",
    defaultName: certLang === 'Hindi' ? "समर्पित साधक" : "Devoted Seeker",
    accuracyLabel: certLang === 'Hindi' ? "सटीकता" : "Accuracy",
    scoreLabel: certLang === 'Hindi' ? "अंक" : "Score",
    boardOfTrustees: certLang === 'Hindi' ? "न्यासी मंडल" : "Board of Trustees",
    principalGuru: certLang === 'Hindi' ? "प्रधान गुरु" : "Principal Guru",
    verifyCredentials: certLang === 'Hindi' ? "प्रमाण पत्र सत्यापन" : "VERIFY CREDENTIALS",
    verified: certLang === 'Hindi' ? "सत्यापित" : "VERIFIED",
    officiallyRegistered: certLang === 'Hindi' ? "आधिकारिक तौर पर पंजीकृत" : "OFFICIALLY REGISTERED"
  };

  useEffect(() => {
    if (!showCertificate || !containerRef.current) return;
    const updateScale = () => {
      const containerWidth = containerRef.current?.getBoundingClientRect().width || 0;
      if (containerWidth > 0) {
        const scale = Math.min(containerWidth / 800, 1.0);
        setCertScale(scale);
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(containerRef.current);
    window.addEventListener('resize', updateScale);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [showCertificate]);

  const handleDownloadPDF = async () => {
    if (!certificateRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(certificateRef.current, {
        quality: 1.0,
        pixelRatio: 2.2,
        backgroundColor: '#ffffff'
      });
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('landscape', 'px', [800, 560]);
      pdf.addImage(dataUrl, 'PNG', 0, 0, 800, 560);
      pdf.save(`HariPathshala_Certificate_${historyEntry?.quizName.replace(/\s+/g, '_') || 'Wisdom'}.pdf`);
    } catch (err) {
      console.error('Failed to export certificate PDF', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPNG = async () => {
    if (!certificateRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(certificateRef.current, {
        quality: 1.0,
        pixelRatio: 2.2,
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      link.download = `HariPathshala_Certificate_${historyEntry?.quizName.replace(/\s+/g, '_') || 'Wisdom'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export certificate PNG', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async (platform: 'whatsapp' | 'telegram' | 'facebook' | 'twitter' | 'native') => {
    const shareUrl = `https://haripathshala.online/quiz/result/${sessionId}`;
    const text = `🔱 I completed the "${historyEntry?.quizName || 'Spiritual Quiz'}" on Hari Pathshala with a score of ${historyEntry?.percentage || 0}% and earned a Certificate of Wisdom! Check it out here:`;
    
    if (platform === 'native') {
      if (navigator.share && certificateRef.current) {
        setIsExporting(true);
        try {
          const dataUrl = await toPng(certificateRef.current, {
            quality: 1.0,
            pixelRatio: 2.2,
            backgroundColor: '#ffffff'
          });
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          const file = new File([blob], `HariPathshala_Certificate_${historyEntry?.quizName.replace(/\s+/g, '_') || 'Wisdom'}.png`, { type: 'image/png' });

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'Hari Pathshala Certificate of Wisdom',
              text: text,
              files: [file]
            });
            setIsExporting(false);
            return;
          }
        } catch (err) {
          console.error("Native image share failed, using fallback text share:", err);
        } finally {
          setIsExporting(false);
        }
      }

      if (navigator.share) {
        navigator.share({
          title: 'Hari Pathshala Certificate of Wisdom',
          text: text,
          url: shareUrl
        }).catch(err => console.log(err));
      } else {
        handleCopyLink();
      }
      return;
    }

    let url = '';
    if (platform === 'whatsapp') {
      url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + shareUrl)}`;
    } else if (platform === 'telegram') {
      url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
    } else if (platform === 'facebook') {
      url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    } else if (platform === 'twitter') {
      url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text + ' ' + shareUrl)}`;
    }

    window.open(url, '_blank');
  };

  useEffect(() => {
    if (!sessionId || !user) return;

    setLoading(true);

    const loadResultData = async () => {
      try {
        const histSnap = await getDoc(doc(db, 'userStats', user.uid, 'quiz_history', sessionId));
        if (!histSnap.exists()) {
          setLoading(false);
          return;
        }
        const histData = histSnap.id ? { id: histSnap.id, ...histSnap.data() } as QuizHistory : null;
        if (!histData) return;
        
        if (histData.percentage >= 60 && !histData.certificateId) {
          histData.certificateId = `HP-CERT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        }
        
        setHistoryEntry(histData);
        if (histData.certificateId) {
          setShowCertificate(true);
        }

        const quizSnap = await getDoc(doc(db, 'quiz_quizzes', histData.quizId));
        if (quizSnap.exists()) {
          setQuiz({ id: quizSnap.id, ...quizSnap.data() } as Quiz);
        }

        const qRef = collection(db, 'quiz_questions');
        const qQuery = query(qRef, where('quizId', '==', histData.quizId));
        const qSnap = await getDocs(qQuery);
        const questionsList: Question[] = [];
        qSnap.forEach(docSnap => {
          questionsList.push({ id: docSnap.id, ...docSnap.data() } as Question);
        });
        setQuestions(questionsList);

        setLoading(false);
      } catch (error) {
        console.error("Error loading play result:", error);
        setLoading(false);
      }
    };

    loadResultData();
  }, [sessionId, user]);

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/quiz/result/${sessionId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFDF8] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-[#786D63] mt-4 font-bold font-sans">Compiling wisdom scorecard...</p>
      </div>
    );
  }

  if (!historyEntry) {
    return (
      <div className="min-h-screen bg-[#FFFDF8] flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#FFF7ED] border border-[#FF6B00]/20 flex items-center justify-center text-3xl animate-pulse">
          🔱
        </div>
        <div className="space-y-2">
          <h3 className="font-sans font-black text-lg text-[#2E241B]">Aligning Score Record...</h3>
          <p className="text-xs text-[#786D63] max-w-sm mx-auto font-mukta leading-relaxed">
            Your devotion has been registered in the sacred logs. Connecting to spiritual analytics to prepare your personalized scripture scorecard...
          </p>
        </div>
        <div className="flex justify-center gap-2 items-center text-xs text-[#FF6B00] font-bold">
          <div className="w-4 h-4 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin"></div>
          <span>Syncing sacred results...</span>
        </div>
        <button 
          onClick={() => goBack('/quiz')}
          className="bg-gradient-to-r from-[#FF6B00] to-[#FFA726] text-white font-extrabold py-3.5 px-6 rounded-2xl text-xs shadow-md shadow-[#FF6B00]/20"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const isPassed = historyEntry.percentage >= 60;

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#2E241B] pb-32 font-sans select-none">
      
      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#EFE7DB]/60 py-4 px-6 flex justify-between items-center shadow-sm">
        <button
          onClick={() => goBack('/quiz')}
          className="flex items-center gap-2 text-xs font-black text-[#786D63] hover:text-[#FF6B00] transition"
        >
          <ArrowLeft size={16} className="text-[#FF6B00]" />
          <span>मुख्य पृष्ठ पर जाएँ</span>
        </button>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleCopyLink}
            className="p-2.5 bg-white border border-[#EFE7DB] hover:bg-[#FFF7ED] text-[#2E241B] rounded-xl transition flex items-center gap-1.5 text-xs font-bold shadow-sm"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-[#FF6B00]" />}
            <span>{copied ? 'Copied!' : 'Copy link'}</span>
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 pt-24 space-y-8">

        <AnimatePresence mode="wait">
          {showCertificate && historyEntry.certificateId ? (
            
            // CERTIFICATE FRAME WITH THEME DESIGN
            <motion.div 
              key="cert"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6"
            >
              <div 
                ref={containerRef}
                className="w-full overflow-hidden flex justify-center py-4 relative bg-white/60 rounded-[32px] border border-[#EFE7DB] p-4"
                style={{ height: `${580 * certScale}px` }}
              >
                <div 
                  style={{ 
                    transform: `scale(${certScale})`, 
                    transformOrigin: 'top center',
                    width: '800px',
                    height: '560px'
                  }}
                  className="shrink-0"
                >
                  <div 
                    ref={certificateRef}
                    className="w-[800px] h-[560px] bg-[#fffdf9] text-amber-950 border-[16px] border-[#D4AF37] rounded-2xl p-10 relative overflow-hidden flex flex-col justify-between shadow-xl select-none"
                    style={{ fontFamily: '"Georgia", serif' }}
                  >
                    {/* Filigree Grid */}
                    <div className="absolute inset-0 bg-[radial-gradient(#d4af37_0.6px,transparent_0.6px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
                    <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-amber-500/30" />
                    <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-amber-500/30" />
                    <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-amber-500/30" />
                    <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-amber-500/30" />

                    {/* Top row */}
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
                          <p className="text-[8px] font-black tracking-widest text-amber-800 uppercase">{trans.officiallyRegistered}</p>
                          <p className="text-[10px] font-mono text-neutral-500">HP-CERT-{(historyEntry.certificateId || "").replace('HP-CERT-', '')}</p>
                        </div>
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 border-2 border-white shadow flex flex-col items-center justify-center text-white shrink-0">
                          <ShieldCheck size={20} />
                          <span className="text-[6px] font-black tracking-widest mt-0.5">{trans.verified}</span>
                        </div>
                      </div>
                    </div>

                    {/* Main content */}
                    <div className="text-center space-y-4 relative z-10 max-w-2xl mx-auto">
                      <h1 className="text-3xl font-serif font-black tracking-wide text-amber-900 m-0 leading-tight">
                        {trans.title}
                      </h1>
                      
                      <p className="text-[11px] italic text-amber-800/80 font-serif m-0">
                        {trans.subTitle}
                      </p>

                      <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-sans font-black m-0 pt-1">
                        {trans.presentedTo}
                      </p>

                      <div className="flex items-center justify-center gap-4 py-1">
                        <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37] overflow-hidden shrink-0 shadow bg-white flex items-center justify-center text-lg">
                          {user?.photoURL ? (
                            <img src={user.photoURL} alt="Aspirant avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <span>👤</span>
                          )}
                        </div>
                        <h2 className="text-2xl font-serif font-extrabold text-amber-950 tracking-wide border-b border-amber-300 pb-1 min-w-[200px]">
                          {historyEntry.userDisplayName || user?.displayName || trans.defaultName}
                        </h2>
                      </div>

                      <p className="text-xs text-amber-950/90 leading-relaxed font-sans max-w-xl mx-auto m-0">
                        {certLang === 'Hindi' ? (
                          <>
                            को गहन ज्ञान, निरंतर निष्ठा और असाधारण शास्त्रीय योग्यता का प्रदर्शन करते हुए <strong className="text-orange-700">{historyEntry.quizName}</strong> की मूल्यांकन परीक्षा को <strong className="text-green-600">{historyEntry.percentage}%</strong> उत्तीर्ण प्रतिशत के साथ सफलतापूर्वक पूर्ण करने हेतु।
                          </>
                        ) : (
                          <>
                            for demonstrating deep wisdom, consistent sincerity, and exceptional scriptural knowledge in successfully completing the assessment on <strong className="text-orange-700">{historyEntry.quizName}</strong> with an absolute passing grade of <strong className="text-green-600">{historyEntry.percentage}%</strong>.
                          </>
                        )}
                      </p>
                    </div>

                    {/* Footer signatures & verification info */}
                    <div className="flex justify-between items-end relative z-10 border-t border-amber-200/60 pt-6 font-sans">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-white p-1 rounded-lg border border-amber-200 shrink-0">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://haripathshala.online/quiz/result/${sessionId}`)}`}
                            alt="QR Verification"
                            className="w-full h-full"
                          />
                        </div>
                        <div className="text-left text-[9px] text-neutral-500 space-y-0.5">
                          <p className="font-bold text-amber-800 uppercase tracking-wider">{trans.verifyCredentials}</p>
                          <p className="font-mono text-[8px]">ID: {historyEntry.certificateId}</p>
                          <p className="text-amber-600 hover:underline">haripathshala.online</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 text-center bg-amber-50/60 border border-amber-200/50 p-2 rounded-xl">
                        <div>
                          <span className="text-[7px] text-neutral-400 uppercase tracking-widest block">{trans.accuracyLabel}</span>
                          <span className="text-[11px] font-extrabold text-green-600 block">{historyEntry.percentage}%</span>
                        </div>
                        <div>
                          <span className="text-[7px] text-neutral-400 uppercase tracking-widest block">{trans.scoreLabel}</span>
                          <span className="text-[11px] font-extrabold text-amber-800 block">{historyEntry.score} Pts</span>
                        </div>
                      </div>

                      <div className="flex gap-6">
                        <div className="text-center text-[10px] space-y-0.5">
                          <div className="h-5 flex items-end justify-center font-serif italic text-amber-700 font-bold text-xs">
                            Sri Hari Dasa
                          </div>
                          <div className="w-20 border-t border-amber-300 mx-auto" />
                          <p className="text-[8px] text-neutral-400 uppercase tracking-widest">{trans.boardOfTrustees}</p>
                        </div>
                        <div className="text-center text-[10px] space-y-0.5">
                          <div className="h-5 flex items-end justify-center font-serif italic text-amber-700 font-bold text-xs">
                            Vyasacharya
                          </div>
                          <div className="w-20 border-t border-amber-300 mx-auto" />
                          <p className="text-[8px] text-neutral-400 uppercase tracking-widest">{trans.principalGuru}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Share & Download Options buttons row */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex-1 py-3.5 bg-white border border-[#EFE7DB] hover:bg-[#FFF7ED] text-[#2E241B] font-extrabold rounded-2xl text-xs transition flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                >
                  <Award size={14} className="text-[#FF6B00]" />
                  <span>⋮ Options Menu</span>
                </button>

                <button
                  onClick={() => {
                    const nextId = historyEntry.subjectId && historyEntry.subjectId !== 'ai_mixed' 
                      ? `ai_subject_${historyEntry.subjectId}` 
                      : 'ai_mixed';
                    navigate(`/quiz/play/${nextId}`);
                  }}
                  className="flex-[2] py-3.5 bg-gradient-to-r from-[#FF6B00] to-[#FFA726] hover:brightness-105 text-white font-black rounded-2xl text-xs transition flex items-center justify-center gap-2 shadow-md shadow-[#FF6B00]/20 active:scale-95"
                >
                  <Sparkles size={14} className="fill-white" />
                  <span>प्रगति जारी रखें (Next Quiz)</span>
                </button>
              </div>

              {showMenu && (
                <div className="bg-white border border-[#EFE7DB] rounded-[24px] p-4 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    onClick={handleDownloadPNG}
                    className="p-3 bg-[#FFFDF8] border border-[#EFE7DB] hover:bg-[#FFF7ED] text-xs font-bold rounded-xl flex flex-col items-center justify-center gap-2 transition text-[#2E241B]"
                  >
                    <FileDown size={18} className="text-[#FF6B00]" />
                    <span>Download PNG</span>
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="p-3 bg-[#FFFDF8] border border-[#EFE7DB] hover:bg-[#FFF7ED] text-xs font-bold rounded-xl flex flex-col items-center justify-center gap-2 transition text-[#2E241B]"
                  >
                    <FileDown size={18} className="text-[#FF6B00]" />
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={() => handleShare('native')}
                    className="p-3 bg-[#FFFDF8] border border-[#EFE7DB] hover:bg-[#FFF7ED] text-xs font-bold rounded-xl flex flex-col items-center justify-center gap-2 transition text-[#2E241B]"
                  >
                    <Share2 size={18} className="text-[#FF6B00]" />
                    <span>Share Externally</span>
                  </button>
                  <button
                    onClick={() => setShowCertificate(false)}
                    className="p-3 bg-[#FFFDF8] border border-[#EFE7DB] hover:bg-[#FFF7ED] text-xs font-bold rounded-xl flex flex-col items-center justify-center gap-2 transition text-[#2E241B]"
                  >
                    <BookOpen size={18} className="text-[#FF6B00]" />
                    <span>View Analytics</span>
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            
            // SCORE STATISTICS BOARD
            <motion.div 
              key="scoreboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="bg-white border border-[#EFE7DB]/80 rounded-[32px] p-8 text-center shadow-[0_4px_24px_rgba(239,231,219,0.15)] space-y-5">
                <div className="flex justify-center">
                  {isPassed ? (
                    <div className="w-20 h-20 rounded-full bg-green-50 text-green-500 flex items-center justify-center shadow-inner">
                      <CheckCircle size={44} className="fill-current text-white" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-red-50 text-red-500 flex items-center justify-center shadow-inner">
                      <XCircle size={44} className="fill-current text-white" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h2 className="font-sans font-extrabold text-2xl text-[#2E241B] leading-tight">
                    {isPassed ? 'शानदार प्रदर्शन, प्रिय साधक!' : 'निरंतर अभ्यास करते रहें!'}
                  </h2>
                  <p className="text-xs text-[#786D63] font-medium font-mukta leading-relaxed max-w-sm mx-auto">
                    आपने <strong className="text-[#FF6B00]">{historyEntry.quizName}</strong> की मूल्यांकन परीक्षा में <strong className="text-[#FF6B00]">{historyEntry.percentage}%</strong> अंक प्राप्त किए हैं।
                  </p>
                </div>

                {/* Score breakdown metrics */}
                <div className="grid grid-cols-3 gap-4 bg-[#FFFDF8] border border-[#EFE7DB]/60 p-5 rounded-2xl max-w-md mx-auto">
                  <div className="text-center">
                    <span className="text-[9px] uppercase font-black text-[#786D63] block">Correct</span>
                    <span className="text-base font-extrabold text-green-500 mt-1 block">{historyEntry.correctCount} Qs</span>
                  </div>
                  <div className="w-[1px] bg-[#EFE7DB] h-8 self-center mx-auto" />
                  <div className="text-center">
                    <span className="text-[9px] uppercase font-black text-[#786D63] block">Wrong</span>
                    <span className="text-base font-extrabold text-red-500 mt-1 block">{historyEntry.wrongCount} Qs</span>
                  </div>
                  <div className="w-[1px] bg-[#EFE7DB] h-8 self-center mx-auto" />
                  <div className="text-center">
                    <span className="text-[9px] uppercase font-black text-[#786D63] block">Total Points</span>
                    <span className="text-base font-extrabold text-[#FF6B00] mt-1 block">{historyEntry.score} Pts</span>
                  </div>
                </div>

                {historyEntry.certificateId && (
                  <button
                    onClick={() => setShowCertificate(true)}
                    className="w-full bg-gradient-to-r from-[#FF6B00] to-[#FFA726] hover:brightness-105 text-white font-extrabold py-3.5 px-6 rounded-2xl text-xs shadow-md shadow-[#FF6B00]/10 transition flex items-center justify-center gap-2 max-w-xs mx-auto active:scale-95"
                  >
                    <Award size={16} />
                    <span>View Study Certificate</span>
                  </button>
                )}
              </div>

              {/* Standard actions block */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    const nextId = historyEntry.subjectId && historyEntry.subjectId !== 'ai_mixed' 
                      ? `ai_subject_${historyEntry.subjectId}` 
                      : 'ai_mixed';
                    navigate(`/quiz/play/${nextId}`);
                  }}
                  className="py-3.5 bg-gradient-to-r from-[#FF6B00] to-[#FFA726] hover:brightness-105 text-white font-black rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <Sparkles size={14} className="fill-white" />
                  <span>प्रगति जारी रखें (Next Quiz)</span>
                </button>
                <button
                  onClick={() => navigate(`/quiz/play/${historyEntry.quizId}`)}
                  className="py-3.5 bg-white border border-[#EFE7DB] hover:bg-[#FFF7ED] text-[#FF6B00] font-black rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <RefreshCw size={14} />
                  <span>पुनः परीक्षा दें (Replay)</span>
                </button>
                <button
                  onClick={() => goBack('/quiz')}
                  className="py-3.5 bg-white border border-[#EFE7DB] hover:bg-neutral-50 text-[#786D63] font-black rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>डैशबोर्ड (Dashboard)</span>
                </button>
              </div>

              {/* DETAILED ANSWER REVIEW SHEETS */}
              <div className="space-y-4">
                <h3 className="font-sans font-extrabold text-sm text-[#2E241B] flex items-center gap-2 px-1">
                  <BookOpen size={18} className="text-[#FF6B00]" />
                  <span>विस्तृत उत्तर कुंजी समीक्षा (Detailed Answer Keys)</span>
                </h3>

                {questions.map((q, idx) => {
                  const evalAns = historyEntry.answers[q.id] || { selected: '', isCorrect: false };
                  const isCorrect = evalAns.isCorrect;
                  const isSkipped = !evalAns.selected || (Array.isArray(evalAns.selected) && evalAns.selected.length === 0);

                  return (
                    <div 
                      key={q.id}
                      className="bg-white border border-[#EFE7DB]/80 rounded-[24px] p-5 shadow-sm space-y-4"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black bg-[#FFF7ED] text-[#FF6B00] border border-[#FF6B00]/10 px-2 py-0.5 rounded uppercase">
                            प्रश्नोत्तरी {idx + 1}
                          </span>
                          <h4 className="font-sans font-bold text-xs md:text-sm text-[#2E241B] leading-relaxed pt-1">
                            {q.text}
                          </h4>
                        </div>

                        <div className="shrink-0 mt-0.5">
                          {isSkipped ? (
                            <span className="text-[9px] bg-neutral-100 text-neutral-500 font-black px-2.5 py-1 rounded-full uppercase">
                              SKIPPED
                            </span>
                          ) : isCorrect ? (
                            <span className="text-[9px] bg-green-500/10 text-green-600 border border-green-500/20 font-black px-2.5 py-1 rounded-full flex items-center gap-1 uppercase">
                              ✓ CORRECT
                            </span>
                          ) : (
                            <span className="text-[9px] bg-red-500/10 text-red-600 border border-red-500/20 font-black px-2.5 py-1 rounded-full flex items-center gap-1 uppercase">
                              ✗ WRONG
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#FFFDF8] border border-[#EFE7DB]/60 p-3.5 rounded-xl text-xs">
                        <div>
                          <span className="text-[9px] uppercase font-black text-[#786D63] block">Your Selection</span>
                          <span className={`font-bold mt-1 block leading-tight ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                            {Array.isArray(evalAns.selected) ? evalAns.selected.join(', ') : (evalAns.selected || 'No option selected')}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-black text-[#786D63] block">Scriptural Truth</span>
                          <span className="font-bold text-green-600 mt-1 block leading-tight">
                            {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer}
                          </span>
                        </div>
                      </div>

                      {(q.scriptureRef || q.chapter) && (
                        <div className="flex gap-1 items-center text-[10px] text-[#FF6B00] font-black uppercase">
                          <Compass size={11} />
                          <span>
                            {q.scriptureRef} {q.chapter ? `• Chapter ${q.chapter}` : ''} {q.verse ? `, Verse ${q.verse}` : ''}
                          </span>
                        </div>
                      )}

                      <div className="bg-[#FFF7ED]/30 rounded-xl p-3 text-xs leading-relaxed border-l-2 border-[#FF6B00] space-y-1">
                        <strong className="text-[9px] text-[#2E241B] flex items-center gap-1 uppercase font-black">
                          <MessageSquare size={12} className="text-[#FF6B00]" /> 
                          <span>विवेचना (Explanation)</span>
                        </strong>
                        <p className="text-[#786D63] font-mukta">
                          {q.explanation || 'Explanation not available.'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
