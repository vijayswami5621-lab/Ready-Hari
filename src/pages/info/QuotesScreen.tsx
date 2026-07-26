import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SEO } from "../../components/SEO";
import { ArrowLeft, Search, Heart, Bookmark, Share2, Download, X, Copy, Check, Sparkles } from "lucide-react";
import { toPng } from "html-to-image";
import { useNavigate, useParams } from "react-router-dom";
import { useRealtimeCollection } from "../../hooks/useRealtimeCollection";
import { SecureImage } from "../../components/common/SecureImage";
import { useAuthStore } from "../../store/useAuthStore";
import { db } from "../../firebase/config";
import { getAppOrigin, generateShareLink } from "../../utils/urlHelper";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import { useGoBack } from "../../hooks/useGoBack";
import { useShareContent } from "../../hooks/useShareContent";
import { NotFoundScreen } from "../misc/NotFoundScreen";

const themeStyles = {
  bhagwa: {
    bg: "bg-gradient-to-b from-[#FF4500] via-[#FF6A00] to-[#E65100]",
    border: "border-white/15",
    textPrimary: "text-white",
    textSecondary: "text-orange-100",
    quoteText: "text-amber-50 font-serif font-bold",
    capsule: "bg-white/15 border-white/20 text-[#FFF5EB]",
    watermark: "text-white/5",
    logoBg: "bg-gradient-to-br from-amber-400 to-amber-600 text-white",
    divider: "border-white/15",
    socialText: "text-orange-100",
    headerUserBg: "bg-white/10 border-white/15 text-white"
  },
  white: {
    bg: "bg-[#FCFBF7] border-2 border-[#D4AF37]/35",
    border: "border-[#D4AF37]/20",
    textPrimary: "text-slate-850",
    textSecondary: "text-slate-500",
    quoteText: "text-slate-900 font-serif font-bold",
    capsule: "bg-amber-500/10 border border-amber-500/20 text-amber-850",
    watermark: "text-[#D4AF37]/5",
    logoBg: "bg-gradient-to-br from-amber-500 to-amber-700 text-white",
    divider: "border-slate-200",
    socialText: "text-slate-600",
    headerUserBg: "bg-slate-100 border-slate-250 text-slate-800"
  },
  dark: {
    bg: "bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#020617]",
    border: "border-white/10",
    textPrimary: "text-slate-100",
    textSecondary: "text-slate-400",
    quoteText: "text-[#FFFDF0] font-serif font-bold drop-shadow-md",
    capsule: "bg-amber-500/10 border border-[#D4AF37]/30 text-[#E2C063]",
    watermark: "text-white/4",
    logoBg: "bg-gradient-to-br from-amber-400 to-amber-600 text-white",
    divider: "border-white/10",
    socialText: "text-slate-400",
    headerUserBg: "bg-white/5 border-white/10 text-slate-200"
  },
  gold: {
    bg: "bg-gradient-to-b from-[#B8860B] via-[#996515] to-[#553C08]",
    border: "border-white/15",
    textPrimary: "text-white",
    textSecondary: "text-amber-100",
    quoteText: "text-white font-serif font-bold drop-shadow",
    capsule: "bg-black/20 border border-white/20 text-amber-100",
    watermark: "text-white/5",
    logoBg: "bg-white text-amber-900",
    divider: "border-white/15",
    socialText: "text-amber-100",
    headerUserBg: "bg-white/10 border-white/15 text-white"
  },
  night: {
    bg: "bg-gradient-to-b from-[#0A1128] via-[#001F54] to-[#03071E]",
    border: "border-white/10",
    textPrimary: "text-slate-100",
    textSecondary: "text-blue-200",
    quoteText: "text-amber-50 font-serif font-bold",
    capsule: "bg-white/10 border border-white/15 text-blue-100",
    watermark: "text-[#93C5FD]/4",
    logoBg: "bg-gradient-to-br from-amber-400 to-amber-600 text-white",
    divider: "border-white/10",
    socialText: "text-blue-200",
    headerUserBg: "bg-white/5 border-white/10 text-slate-100"
  }
};

export const QuotesScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const goBack = useGoBack();
  const { shareContent } = useShareContent();
  const { data: dbQuotes, loading } = useRealtimeCollection<any>("quotes");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [userLikes, setUserLikes] = useState<string[]>([]);
  const [userBookmarks, setUserBookmarks] = useState<string[]>([]);
  const [sharingQuote, setSharingQuote] = useState<any | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  const [selectedTheme, setSelectedTheme] = useState<"bhagwa" | "white" | "dark" | "gold" | "night">("bhagwa");
  const [aspectRatio, setAspectRatio] = useState<"square" | "portrait" | "story">("portrait");

  useEffect(() => {
    let unsubscribe: () => void;
    if (user && user.uid) {
      const userRef = doc(db, "users", user.uid);
      unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserLikes(data.likedQuotes || []);
          setUserBookmarks(data.bookmarkedQuotes || []);
        }
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  const handleLike = async (quoteId: string) => {
    if (!user || !user.uid) return;
    const userRef = doc(db, "users", user.uid);
    try {
      if (userLikes.includes(quoteId)) {
        setUserLikes((prev) => prev.filter((id) => id !== quoteId));
        await setDoc(
          userRef,
          { likedQuotes: arrayRemove(quoteId) },
          { merge: true },
        );
      } else {
        setUserLikes((prev) => [...prev, quoteId]);
        await setDoc(
          userRef,
          { likedQuotes: arrayUnion(quoteId) },
          { merge: true },
        );
      }
    } catch (e) {
      try {
        await setDoc(userRef, { likedQuotes: [quoteId] }, { merge: true });
        setUserLikes((prev) => [...prev, quoteId]);
      } catch (err) {}
    }
  };

  const handleBookmark = async (quoteId: string) => {
    if (!user || !user.uid) return;
    const userRef = doc(db, "users", user.uid);
    try {
      if (userBookmarks.includes(quoteId)) {
        setUserBookmarks((prev) => prev.filter((id) => id !== quoteId));
        await setDoc(
          userRef,
          { bookmarkedQuotes: arrayRemove(quoteId) },
          { merge: true },
        );
      } else {
        setUserBookmarks((prev) => [...prev, quoteId]);
        await setDoc(
          userRef,
          { bookmarkedQuotes: arrayUnion(quoteId) },
          { merge: true },
        );
      }
    } catch (e) {
      try {
        await setDoc(userRef, { bookmarkedQuotes: [quoteId] }, { merge: true });
        setUserBookmarks((prev) => [...prev, quoteId]);
      } catch (err) {}
    }
  };

  const handleShare = (quote: any) => {
    setSharingQuote(quote);
  };

  const handleCopyQuoteText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const getDimensions = () => {
    switch (aspectRatio) {
      case "square": return { width: "360px", height: "360px" };
      case "portrait": return { width: "360px", height: "450px" };
      case "story": return { width: "360px", height: "640px" };
      default: return { width: "360px", height: "450px" };
    }
  };

  const getQuoteFontSize = (text: string) => {
    const len = text.length;
    if (aspectRatio === "story") {
      if (len < 50) return "text-3xl font-black";
      if (len < 100) return "text-2xl font-black";
      if (len < 180) return "text-xl font-bold";
      return "text-lg font-bold";
    } else if (aspectRatio === "portrait") {
      if (len < 50) return "text-2xl font-black";
      if (len < 100) return "text-xl font-black";
      if (len < 180) return "text-lg font-bold";
      return "text-base font-bold";
    } else { // square 1:1
      if (len < 50) return "text-xl font-extrabold";
      if (len < 100) return "text-lg font-extrabold";
      if (len < 180) return "text-base font-bold";
      return "text-sm font-bold";
    }
  };

  const getThemeBgColor = () => {
    switch (selectedTheme) {
      case "white": return "#FCFBF7";
      case "dark": return "#0F172A";
      case "bhagwa": return "#E65100";
      case "gold": return "#553C08";
      case "night": return "#03071E";
      default: return "#ffffff";
    }
  };

  const handleDownloadShareImage = async () => {
    if (!shareCardRef.current || !sharingQuote || isExporting) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(shareCardRef.current, {
        quality: 1.0,
        pixelRatio: 3,
        backgroundColor: getThemeBgColor()
      });
      const link = document.createElement('a');
      link.download = `HariPathshala_Quote_${sharingQuote.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export quote image', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleNativeShareImage = async () => {
    if (!shareCardRef.current || !sharingQuote || isExporting) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(shareCardRef.current, {
        quality: 1.0,
        pixelRatio: 3,
        backgroundColor: getThemeBgColor()
      });
      const text = `🔱 Divine Quote of Wisdom from Hari Pathshala:\n\n"${sharingQuote.text}"\n\n- ${sharingQuote.source || 'Holy Scriptures'}`;
      const shareUrl = generateShareLink(`/quote/${sharingQuote.id}`);
      
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `HariPathshala_Quote_${sharingQuote.id}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Hari Pathshala Quote of Wisdom',
          text: `${text}\n\nRead more at: ${shareUrl}`,
          files: [file]
        });
      } else if (navigator.share) {
        await navigator.share({
          title: 'Hari Pathshala Quote of Wisdom',
          text: text,
          url: shareUrl
        });
      } else {
        navigator.clipboard.writeText(`${text}\n\nRead more at: ${shareUrl}`);
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2000);
      }
    } catch (err) {
      console.error("Native image share failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const categories = [
    "All",
    ...Array.from(new Set(dbQuotes.map((q) => q.category).filter(Boolean))),
  ];

  const filteredQuotes = dbQuotes.filter((q) => {
    if (id && q.id !== id) return false;
    const matchesSearch =
      q.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.source?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || q.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (!loading && id && filteredQuotes.length === 0) {
    return <NotFoundScreen />;
  }

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-900 transition-colors pb-20">
      <SEO
        title="Divine Quotes | Hari Pathshala"
        description="Read and share divine quotes and wisdom."
      />

      <header className="pt-12 pb-4 px-6 sticky top-0 z-20 flex flex-col gap-4 bg-orange-50/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center">
          <button
            onClick={() => goBack()}
            className="p-2 bg-white dark:bg-slate-800 rounded-full text-brown-dark dark:text-white shadow-sm border border-orange-100 dark:border-slate-700 mr-4"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold font-sans text-brown-dark dark:text-white leading-tight">
            All Quotes
          </h1>
        </div>

        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-brown-light dark:text-slate-400"
          />
          <input
            type="text"
            placeholder="Search quotes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border-none rounded-full py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-saffron-light dark:text-white shadow-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat: any) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-saffron-dark text-white"
                  : "bg-white dark:bg-slate-800 text-brown-dark dark:text-slate-300 border border-orange-100 dark:border-slate-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      <div className="px-6 space-y-4 pt-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-saffron border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredQuotes.length > 0 ? (
          <div className="columns-1 md:columns-2 gap-4 space-y-4">
            {filteredQuotes.map((quote: any, i: number) => (
              <motion.div
                key={quote.id || i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-orange-100 dark:border-slate-700 overflow-hidden break-inside-avoid inline-block w-full"
              >
                {quote.image && (
                  <div className="w-full h-40 bg-slate-100 dark:bg-slate-700">
                    <SecureImage
                      src={quote.image}
                      className="w-full h-full object-cover"
                      alt="Quote"
                    />
                  </div>
                )}
                <div className="p-5">
                  {quote.category && (
                    <span className="bg-orange-100 dark:bg-slate-700 text-saffron-dark text-[10px] px-2 py-1 rounded-md mb-2 inline-block font-bold uppercase tracking-wider">
                      {quote.category}
                    </span>
                  )}
                  <p className="font-devanagari text-lg font-medium text-brown-dark dark:text-white mb-2 leading-relaxed">
                    {quote.text}
                  </p>
                  <p className="text-xs font-bold text-saffron-dark mb-4">
                    - {quote.source || "Anonymous"}
                  </p>

                  <div className="flex justify-between items-center border-t border-orange-100 dark:border-slate-700 pt-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLike(quote.id)}
                        className={`p-2 rounded-full transition-colors ${userLikes.includes(quote.id) ? "bg-red-500 text-white" : "bg-orange-50 dark:bg-slate-700 hover:bg-orange-100"}`}
                      >
                        <Heart size={14} />
                      </button>
                      <button
                        onClick={() => handleBookmark(quote.id)}
                        className={`p-2 rounded-full transition-colors ${userBookmarks.includes(quote.id) ? "bg-saffron text-white" : "bg-orange-50 dark:bg-slate-700 hover:bg-orange-100"}`}
                      >
                        <Bookmark size={14} />
                      </button>
                    </div>
                    <button
                      onClick={() => handleShare(quote)}
                      className="p-2 bg-orange-50 dark:bg-slate-700 rounded-full hover:bg-orange-100 transition-colors text-brown-dark dark:text-white"
                    >
                      <Share2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-3xl border border-orange-100 dark:border-slate-700">
            <p className="text-brown-light dark:text-slate-400 font-medium">
              No quotes found
            </p>
          </div>
        )}
      </div>

      {/* Premium Quote Share Image Modal */}
      <AnimatePresence>
        {sharingQuote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-[32px] p-6 max-w-lg w-full shadow-2xl space-y-5 relative overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={() => setSharingQuote(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-orange-50 dark:bg-slate-800 hover:bg-orange-100 text-brown-dark dark:text-white transition z-10"
              >
                <X size={18} />
              </button>

              <div className="text-center">
                <h3 className="font-sans font-bold text-lg text-brown-dark dark:text-white flex items-center justify-center gap-1.5">
                  <Sparkles size={18} className="text-saffron animate-pulse" />
                  Redesign Share Card
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">Customize and share a premium devotional post instantly</p>
              </div>

              {/* ASPECT RATIO SELECTOR */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase block text-center">
                  Select Post Format
                </label>
                <div className="flex gap-2">
                  {[
                    { id: "square", label: "Square (1:1)", desc: "1080 x 1080" },
                    { id: "portrait", label: "Portrait (4:5)", desc: "1080 x 1350" },
                    { id: "story", label: "Story (9:16)", desc: "1080 x 1920" }
                  ].map((aspect) => (
                    <button
                      key={aspect.id}
                      onClick={() => setAspectRatio(aspect.id as any)}
                      className={`px-3 py-1.5 rounded-xl border flex flex-col items-center justify-center transition text-center flex-1 min-w-[80px] ${
                        aspectRatio === aspect.id
                          ? "border-saffron bg-orange-50/50 dark:bg-orange-950/20 text-saffron font-bold shadow-sm"
                          : "border-neutral-200 dark:border-slate-800 text-neutral-600 dark:text-slate-400 hover:bg-neutral-50 dark:hover:bg-slate-850"
                      }`}
                    >
                      <span className="text-[10px] leading-none">{aspect.label}</span>
                      <span className="text-[7px] opacity-70 mt-1 leading-none">{aspect.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* COLOR THEME SELECTOR */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase block text-center">
                  Select Visual Theme
                </label>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    { id: "bhagwa", label: "Bhagwa", color: "bg-gradient-to-br from-[#FF4500] to-[#E65100]" },
                    { id: "white", label: "White", color: "bg-[#FCFBF7] border border-neutral-350" },
                    { id: "dark", label: "Dark", color: "bg-gradient-to-br from-[#0F172A] to-[#020617]" },
                    { id: "gold", label: "Gold", color: "bg-gradient-to-br from-[#B8860B] to-[#553C08]" },
                    { id: "night", label: "Night Blue", color: "bg-gradient-to-br from-[#0A1128] to-[#03071E]" }
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedTheme(theme.id as any)}
                      className={`px-2.5 py-1.5 rounded-full flex items-center gap-1.5 border transition ${
                        selectedTheme === theme.id
                          ? "border-saffron bg-orange-50/50 dark:bg-orange-950/20 text-saffron font-bold"
                          : "border-transparent text-neutral-600 dark:text-slate-400 hover:bg-neutral-50 dark:hover:bg-slate-850"
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${theme.color} shrink-0`} />
                      <span className="text-[10px] pr-0.5">{theme.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Container with fixed height box and responsive preview scale */}
              <div className="flex flex-col items-center justify-center">
                <div className="h-[340px] w-full flex items-center justify-center overflow-hidden bg-neutral-150 dark:bg-slate-950 rounded-2xl border border-neutral-200 dark:border-slate-800 relative py-4">
                  <div className={`transform origin-center transition-all duration-300 ${
                    aspectRatio === "square" ? "scale-75" : aspectRatio === "portrait" ? "scale-[0.63]" : "scale-[0.45]"
                  }`}>
                    <div
                      ref={shareCardRef}
                      style={getDimensions()}
                      className={`relative rounded-2xl p-6 overflow-hidden flex flex-col justify-between shadow-2xl select-none transition-all duration-300 ${themeStyles[selectedTheme].bg}`}
                    >
                      {/* Filigree / Ornaments / Texture (Bhagwa / Temple Gold / Night Blue) */}
                      {selectedTheme !== "white" && (
                        <>
                          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_0.6px,transparent_0.6px)] [background-size:16px_16px] opacity-[0.04] pointer-events-none" />
                          <div className={`absolute top-4 left-4 w-10 h-10 border-t-2 border-l-2 opacity-20 ${themeStyles[selectedTheme].border}`} />
                          <div className={`absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 opacity-20 ${themeStyles[selectedTheme].border}`} />
                          <div className={`absolute bottom-4 left-4 w-10 h-10 border-b-2 border-l-2 opacity-20 ${themeStyles[selectedTheme].border}`} />
                          <div className={`absolute bottom-4 right-4 w-10 h-10 border-b-2 border-r-2 opacity-20 ${themeStyles[selectedTheme].border}`} />
                        </>
                      )}

                      {/* Filigree for White Theme (Elegant gold borders) */}
                      {selectedTheme === "white" && (
                        <>
                          <div className="absolute inset-2.5 border border-[#D4AF37]/25 rounded-xl pointer-events-none" />
                          <div className="absolute top-4 left-4 w-8 h-8 border-t border-l border-[#D4AF37]/30" />
                          <div className="absolute top-4 right-4 w-8 h-8 border-t border-r border-[#D4AF37]/30" />
                          <div className="absolute bottom-4 left-4 w-8 h-8 border-b border-l border-[#D4AF37]/30" />
                          <div className="absolute bottom-4 right-4 w-8 h-8 border-b border-r border-[#D4AF37]/30" />
                        </>
                      )}

                      {/* Watermark symbol - 🕉 - light opacity behind text */}
                      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[140px] font-bold pointer-events-none select-none z-0 transition-all duration-300 ${themeStyles[selectedTheme].watermark}`}>
                        🕉
                      </div>

                      {/* Header Row */}
                      <div className="flex justify-between items-center relative z-10 w-full mb-3">
                        <div className="flex items-center gap-2.5 shrink-0">
                          <img 
                            src="/logo.png" 
                            alt="Hari Pathshala Logo" 
                            className="w-9 h-9 rounded-full object-cover shadow-md border border-white/40 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="text-left flex flex-col justify-center">
                            <h4 className={`text-[10px] font-black tracking-widest leading-none m-0 uppercase ${themeStyles[selectedTheme].textPrimary}`}>
                              HARI PATHSHALA
                            </h4>
                            <p className={`text-[6.5px] font-bold tracking-wider leading-none mt-1 uppercase ${themeStyles[selectedTheme].textSecondary}`}>
                              SANATAN VEDIC ACADEMY
                            </p>
                          </div>
                        </div>

                        {/* User Profile Info */}
                        <div className={`flex items-center gap-1.5 py-1 px-2.5 rounded-full border backdrop-blur-md max-w-[150px] shrink-0 transition-all ${themeStyles[selectedTheme].headerUserBg}`}>
                          {/* Profile Avatar or Monogram */}
                          {user?.photoURL ? (
                            <img 
                              src={user.photoURL} 
                              alt="Profile" 
                              className="w-5 h-5 rounded-full object-cover border border-white/20 shrink-0" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] border shrink-0 ${
                              selectedTheme === "white" 
                                ? "bg-amber-100 border-amber-300 text-amber-800" 
                                : "bg-white/10 border-white/20 text-white"
                            }`}>
                              {(user?.displayName || "Sadhak").charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="text-left flex flex-col justify-center min-w-0 max-w-[65px]">
                            <span className="text-[7.5px] font-black tracking-wide truncate leading-none">
                              {user?.displayName || "Sadhak"}
                            </span>
                            <span className="text-[5.5px] opacity-70 tracking-wider mt-0.5 leading-none font-semibold">
                              {new Date().toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Central Quote Section */}
                      <div className="text-center py-4 relative z-10 flex-1 flex flex-col justify-center items-center space-y-4 w-full">
                        <span className={`text-3xl leading-none opacity-20 font-serif ${themeStyles[selectedTheme].textPrimary}`}>“</span>
                        <p className={`font-devanagari leading-relaxed tracking-wide text-center px-4 transition-all duration-300 drop-shadow-sm ${getQuoteFontSize(sharingQuote.text)} ${themeStyles[selectedTheme].textPrimary}`}>
                          {sharingQuote.text}
                        </p>
                        <span className={`text-3xl leading-none opacity-20 font-serif ${themeStyles[selectedTheme].textPrimary}`}>”</span>
                        
                        <div className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest shadow-sm border transition-all ${themeStyles[selectedTheme].capsule}`}>
                          <span>—</span>
                          <span>{sharingQuote.source || "Hari Pathshala"}</span>
                        </div>
                      </div>

                      {/* Bottom Footer Section */}
                      <div className={`flex justify-between items-center relative z-10 border-t pt-3 w-full mt-3 ${themeStyles[selectedTheme].divider}`}>
                        <div className="flex items-center gap-2">
                          <div className="bg-white p-0.5 rounded-lg shadow-sm border border-neutral-100 shrink-0">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(generateShareLink(`/quotes?id=${sharingQuote.id}`))}`}
                              alt="Scan QR"
                              className="w-10 h-10"
                            />
                          </div>
                          <div className="text-left space-y-0.5">
                            <p className={`text-[8px] font-black uppercase tracking-wider leading-none ${themeStyles[selectedTheme].textPrimary}`}>
                              HARI PATHSHALA APP
                            </p>
                            <p className={`text-[6px] font-semibold leading-none ${themeStyles[selectedTheme].socialText}`}>
                              Scan to view quote online
                            </p>
                            <p className={`text-[7px] font-bold tracking-tight pt-1 leading-none ${themeStyles[selectedTheme].textPrimary}`}>
                              {getAppOrigin().replace("https://", "").replace("http://", "")}
                            </p>
                          </div>
                        </div>

                        <div className="text-right space-y-1">
                          <div className={`flex items-center justify-end gap-1 text-[7px] font-bold tracking-wide ${themeStyles[selectedTheme].socialText}`}>
                            <span className="opacity-75">YouTube:</span>
                            <span className={`font-extrabold ${themeStyles[selectedTheme].textPrimary}`}>Hari Pathshala</span>
                          </div>
                          <div className={`flex items-center justify-end gap-1 text-[7px] font-bold tracking-wide ${themeStyles[selectedTheme].socialText}`}>
                            <span className="opacity-75">Instagram:</span>
                            <span className={`font-extrabold ${themeStyles[selectedTheme].textPrimary}`}>@hari_pathshala</span>
                          </div>
                          <div className={`flex items-center justify-end gap-1 text-[7px] font-bold tracking-wide ${themeStyles[selectedTheme].socialText}`}>
                            <span className="opacity-75">Facebook:</span>
                            <span className={`font-extrabold ${themeStyles[selectedTheme].textPrimary}`}>Hari Pathshala</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleDownloadShareImage}
                  disabled={isExporting}
                  className="py-3 px-4 bg-orange-50 dark:bg-slate-800 hover:bg-orange-100 text-brown-dark dark:text-white font-bold rounded-2xl text-xs transition flex items-center justify-center gap-2 border border-orange-100 dark:border-slate-750 disabled:opacity-50"
                >
                  <Download size={14} />
                  <span>Download PNG</span>
                </button>
                <button
                  onClick={handleNativeShareImage}
                  disabled={isExporting}
                  className="py-3 px-4 bg-gradient-to-r from-saffron to-amber-500 hover:from-saffron-dark hover:to-amber-600 text-white font-extrabold rounded-2xl text-xs transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                >
                  <Share2 size={14} />
                  <span>Share Card</span>
                </button>
              </div>

              <div className="flex gap-2 justify-center items-center">
                <button
                  onClick={() => handleCopyQuoteText(sharingQuote.text)}
                  className="text-[10px] text-neutral-400 font-bold hover:text-saffron flex items-center gap-1 transition"
                >
                  {copiedText ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
                  {copiedText ? "Copied Text!" : "Copy Quote Text"}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
