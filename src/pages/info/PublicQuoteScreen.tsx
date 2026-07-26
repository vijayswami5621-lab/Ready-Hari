import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { toPng } from "html-to-image";
import QRCode from "qrcode";
import { motion, AnimatePresence } from "motion/react";
import { SEO } from "../../components/SEO";
import { 
  ArrowLeft, Share2, Download, Copy, Check, Smartphone, 
  Sparkles, BookOpen, User, Tag, HelpCircle, FileText, Play
} from "lucide-react";
import { getAppOrigin, isNativeApp } from "../../utils/urlHelper";
import { Share as CapacitorShare } from "@capacitor/share";
import { Clipboard as CapacitorClipboard } from "@capacitor/clipboard";

// Premium theme choices for card customization
const PRESETS = {
  saffron: {
    bg: "bg-gradient-to-br from-[#FF9933] via-[#FF5500] to-[#CC3300]",
    cardBg: "bg-white/10 backdrop-blur-md border border-white/20",
    textPrimary: "text-white",
    textSecondary: "text-orange-100",
    quoteText: "text-amber-50 font-serif font-bold drop-shadow-md",
    badge: "bg-white/15 text-[#FFF5EB] border border-white/20",
    logoBg: "bg-gradient-to-br from-amber-400 to-amber-600 text-white",
    watermark: "text-white/5",
    qrBg: "bg-white p-1 rounded-xl shadow-md",
    divider: "border-white/10"
  },
  gold: {
    bg: "bg-gradient-to-br from-[#B8860B] via-[#996515] to-[#4A3203]",
    cardBg: "bg-black/20 backdrop-blur-md border border-white/10",
    textPrimary: "text-amber-50",
    textSecondary: "text-amber-200",
    quoteText: "text-white font-serif font-bold drop-shadow-sm",
    badge: "bg-amber-500/10 text-amber-200 border border-amber-500/20",
    logoBg: "bg-white text-amber-950",
    watermark: "text-white/5",
    qrBg: "bg-white p-1 rounded-xl shadow-md",
    divider: "border-white/10"
  },
  classic: {
    bg: "bg-[#FCFBF7] border-4 border-[#D4AF37]/30",
    cardBg: "bg-white border border-[#D4AF37]/20 shadow-inner",
    textPrimary: "text-slate-850",
    textSecondary: "text-slate-500",
    quoteText: "text-[#3D2513] font-serif font-bold",
    badge: "bg-amber-500/10 text-amber-900 border border-amber-500/20",
    logoBg: "bg-gradient-to-br from-amber-500 to-amber-700 text-white",
    watermark: "text-[#D4AF37]/5",
    qrBg: "bg-white p-1 border border-orange-100 rounded-xl",
    divider: "border-slate-100"
  },
  night: {
    bg: "bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#020617]",
    cardBg: "bg-white/5 backdrop-blur-sm border border-white/10",
    textPrimary: "text-slate-100",
    textSecondary: "text-slate-400",
    quoteText: "text-amber-200 font-serif font-bold drop-shadow-md",
    badge: "bg-amber-500/10 text-[#E2C063] border border-[#D4AF37]/20",
    logoBg: "bg-gradient-to-br from-amber-400 to-amber-600 text-white",
    watermark: "text-white/5",
    qrBg: "bg-white p-1 rounded-xl shadow-md",
    divider: "border-white/5"
  }
};

export const PublicQuoteScreen = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);

  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<keyof typeof PRESETS>("saffron");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const liveUrl = `${getAppOrigin()}/quote/${id}`;

  useEffect(() => {
    const fetchQuote = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const docRef = doc(db, "quotes", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setQuote({ id: docSnap.id, ...docSnap.data() });
        } else {
          setQuote(null);
        }
      } catch (err) {
        console.error("Error fetching quote:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuote();
  }, [id]);

  useEffect(() => {
    if (id) {
      QRCode.toDataURL(
        liveUrl,
        {
          margin: 1,
          width: 250,
          color: {
            dark: "#1E293B",
            light: "#FFFFFF"
          }
        },
        (err, url) => {
          if (!err) setQrCodeUrl(url);
        }
      );
    }
  }, [id, liveUrl]);

  const handleCopyLink = async () => {
    try {
      if (isNativeApp()) {
        await CapacitorClipboard.write({ string: liveUrl });
      } else {
        await navigator.clipboard.writeText(liveUrl);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current || exporting) return;
    setExporting(true);
    try {
      // Small delay to ensure render completion
      await new Promise(r => setTimeout(r, 150));
      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 3, // Premium quality 1080+ px rendering
        style: {
          transform: "scale(1)",
          transformOrigin: "top left"
        }
      });
      const link = document.createElement("a");
      link.download = `haripathshala-quote-${id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error generating image", err);
    } finally {
      setExporting(false);
    }
  };

  const handleNativeShare = async () => {
    if (!quote) return;
    const shareText = `🔱 *Divine Wisdom from Hari Pathshala* 🔱\n\n"${quote.text}"\n\n📖 Scripture: *${quote.source || "Holy Scripture"}*\n${quote.chapter ? `📍 Chapter: ${quote.chapter}` : ""}${quote.verse ? `, Verse: ${quote.verse}` : ""}\n\nRead & listen to complete explanation here: ${liveUrl}`;
    
    try {
      if (isNativeApp()) {
        await CapacitorShare.share({
          title: "Divine Wisdom | Hari Pathshala",
          text: shareText,
          url: liveUrl,
          dialogTitle: "Share with Seekers"
        });
      } else if (navigator.share) {
        await navigator.share({
          title: "Divine Wisdom | Hari Pathshala",
          text: shareText,
          url: liveUrl
        });
      } else {
        handleCopyLink();
      }
    } catch (err) {
      console.error("Error sharing", err);
    }
  };

  const handleOpenInApp = () => {
    // Attempting Capacitor App Opening or Clipboard copy trick
    const deepLinkUrl = `haripathshala://quote/${id}`;
    
    if (isNativeApp()) {
      window.location.href = deepLinkUrl;
    } else {
      // Set clipboard helper for native app to detect on load
      CapacitorClipboard.write({ string: `Content ID: ${id}` }).then(() => {
        // Fallback info or prompt
        window.location.href = deepLinkUrl;
        setTimeout(() => {
          alert("If you have Hari Pathshala App installed, it will open now. If not, you can copy the ID to your clipboard to open inside the app.");
        }, 1500);
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-saffron border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-sans font-bold text-brown-dark dark:text-slate-300">Retrieving Divine Wisdom...</p>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-orange-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-800 p-4 shadow-md mb-6 border border-orange-100 dark:border-slate-700 flex items-center justify-center">
          <HelpCircle size={48} className="text-saffron-dark animate-bounce" />
        </div>
        <h1 className="text-2xl font-black text-brown-dark dark:text-white font-sans mb-2">Quote Not Found</h1>
        <p className="text-sm text-brown-light dark:text-slate-400 max-w-sm mb-8 leading-relaxed">
          The quote link you followed may have expired or is incorrect. Check back with the sharer or explore more quotes in our sanctuary.
        </p>
        <button
          onClick={() => navigate("/")}
          className="bg-saffron text-white font-sans font-black py-3 px-8 rounded-full shadow-lg hover:bg-saffron-dark transition-all cursor-pointer flex items-center gap-2"
        >
          <ArrowLeft size={18} /> Open Hari Pathshala
        </button>
      </div>
    );
  }

  const selectedStyle = PRESETS[theme];

  return (
    <div className="min-h-screen bg-orange-50/40 dark:bg-slate-950 transition-colors pb-24 font-sans">
      <SEO
        title={`"${quote.text?.substring(0, 50)}..." - ${quote.source || "Holy Scriptures"}`}
        description={`Read and share this beautiful quote from ${quote.source || "Holy Scriptures"} on Hari Pathshala.`}
        image={quote.image}
      />

      {/* Public Header */}
      <header className="px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-orange-100/50 dark:border-slate-800/50 sticky top-0 z-30 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="p-2.5 bg-orange-50 dark:bg-slate-800 text-brown-dark dark:text-white rounded-full transition shadow-sm border border-orange-100/20"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          <span className="font-sans font-black text-sm text-brown-dark dark:text-white tracking-tight">HARI PATHSHALA</span>
        </div>
        <button
          onClick={handleOpenInApp}
          className="bg-saffron/10 dark:bg-saffron/20 hover:bg-saffron/20 text-saffron-dark dark:text-saffron font-bold text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1 transition"
        >
          <Smartphone size={14} /> Open in App
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-2 gap-10">
        
        {/* Left Column: Visual Quote Card */}
        <div className="flex flex-col items-center gap-5">
          <div className="w-full flex justify-between items-center mb-1">
            <span className="text-xs font-black text-brown-light dark:text-slate-400 uppercase tracking-widest">Share Preview</span>
            
            {/* Theme Presets */}
            <div className="flex gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-full border border-orange-100 dark:border-slate-800 shadow-sm">
              {Object.keys(PRESETS).map((key) => (
                <button
                  key={key}
                  onClick={() => setTheme(key as keyof typeof PRESETS)}
                  className={`w-5 h-5 rounded-full transition border-2 ${
                    theme === key ? "border-saffron scale-110" : "border-transparent"
                  }`}
                  style={{
                    background: 
                      key === "saffron" ? "#FF9933" :
                      key === "gold" ? "#B8860B" :
                      key === "classic" ? "#FCFBF7" : "#0F172A"
                  }}
                  title={`Preset ${key}`}
                />
              ))}
            </div>
          </div>

          {/* Renderable Quote Card Context (Export Ratio 4:5 - Optimized for social) */}
          <div 
            ref={cardRef} 
            className={`w-full aspect-[4/5] ${selectedStyle.bg} rounded-[32px] p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl transition-all duration-300 border-2 border-white/5`}
          >
            {/* Background Watermark */}
            <div className={`absolute -right-20 -bottom-20 font-devanagari font-black text-[180px] leading-none ${selectedStyle.watermark} select-none pointer-events-none rotate-[-12deg]`}>
              ॐ
            </div>

            {/* Card Header: Branding */}
            <div className="flex items-center justify-between w-full relative z-10">
              <div className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-xl ${selectedStyle.logoBg} p-1 shadow flex items-center justify-center`}>
                  <img src="/logo.png" alt="Branding" className="w-full h-full object-contain brightness-0 invert" />
                </div>
                <div>
                  <h4 className={`font-sans font-black text-[11px] leading-tight tracking-wider ${selectedStyle.textPrimary}`}>
                    HARI PATHSHALA
                  </h4>
                  <p className={`text-[8px] font-bold tracking-widest uppercase ${selectedStyle.textSecondary}`}>
                    ज्ञान • भक्ति • संस्कार
                  </p>
                </div>
              </div>
              {quote.category && (
                <span className={`px-2.5 py-1 text-[9px] font-bold rounded-full uppercase tracking-wider ${selectedStyle.badge}`}>
                  {quote.category}
                </span>
              )}
            </div>

            {/* Card Body: Quote Content */}
            <div className="my-auto space-y-4 relative z-10 py-4">
              <span className={`text-4xl font-serif font-black leading-none ${selectedStyle.textSecondary} opacity-40 select-none block`}>“</span>
              <p className={`font-devanagari text-xl sm:text-2xl font-bold leading-relaxed tracking-wide text-center px-4 ${selectedStyle.quoteText}`}>
                {quote.text}
              </p>
              <div className="flex justify-end pr-2">
                <span className={`text-4xl font-serif font-black leading-none ${selectedStyle.textSecondary} opacity-40 select-none block rotate-180`}>“</span>
              </div>
              
              {/* Meaning section on the card */}
              {quote.meaning && (
                <div className={`p-4 rounded-2xl ${selectedStyle.cardBg} border border-white/5`}>
                  <p className={`text-[10px] uppercase font-black tracking-widest ${selectedStyle.textSecondary} mb-1 flex items-center gap-1`}>
                    <Sparkles size={10} /> भावार्थ
                  </p>
                  <p className={`text-[12px] leading-relaxed font-devanagari ${selectedStyle.textPrimary}`}>
                    {quote.meaning}
                  </p>
                </div>
              )}
            </div>

            {/* Card Footer: Metadata and QR */}
            <div className={`pt-4 border-t ${selectedStyle.divider} flex justify-between items-end relative z-10 w-full`}>
              <div className="space-y-1">
                <p className={`text-[10px] font-black tracking-wider ${selectedStyle.textSecondary} uppercase`}>
                  Quote Source
                </p>
                <h5 className={`font-sans font-black text-[13px] leading-tight ${selectedStyle.textPrimary}`}>
                  {quote.source || "Sacred Scripture"}
                </h5>
                {(quote.chapter || quote.verse) && (
                  <p className={`text-[9px] font-bold ${selectedStyle.textSecondary}`}>
                    {quote.chapter ? `Chapter ${quote.chapter}` : ""}{quote.verse ? ` • Verse ${quote.verse}` : ""}
                  </p>
                )}
                <p className={`text-[8px] font-medium tracking-wide ${selectedStyle.textSecondary} pt-1`}>
                  haripathshala.online
                </p>
              </div>

              {qrCodeUrl && (
                <div className="flex flex-col items-center gap-1">
                  <div className={selectedStyle.qrBg}>
                    <img src={qrCodeUrl} alt="Scan to explore" className="w-14 h-14" />
                  </div>
                  <span className={`text-[7px] font-black uppercase tracking-wider ${selectedStyle.textSecondary}`}>Scan to Open</span>
                </div>
              )}
            </div>
          </div>

          <p className="text-[10px] text-brown-light dark:text-slate-500 font-bold tracking-wide mt-1 text-center">
            * Generated automatically inside high-performance sandbox render engine.
          </p>
        </div>

        {/* Right Column: Dynamic Quote metadata and actions */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="space-y-1">
              <span className="bg-saffron/10 dark:bg-saffron/20 text-saffron-dark dark:text-saffron text-[10px] px-3 py-1 rounded-full font-sans font-black uppercase tracking-wider">
                Divine Wisdom
              </span>
              <h1 className="text-3xl font-black font-sans text-brown-dark dark:text-white tracking-tight pt-2">
                {quote.source || "Holy Scriptures"} Wisdom
              </h1>
              <p className="text-sm text-brown-light dark:text-slate-400">
                Dive deep into the original Sanskrit verse, translations, and authentic interpretations of Sanatan Dharma.
              </p>
            </div>

            {/* Details Cards */}
            <div className="bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-start gap-3">
                <BookOpen size={20} className="text-saffron shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black uppercase text-brown-light dark:text-slate-400">Scripture Name</h4>
                  <p className="text-sm font-bold text-brown-dark dark:text-white font-sans mt-0.5">
                    {quote.source || "Holy Scripture"}
                  </p>
                </div>
              </div>

              {(quote.chapter || quote.verse) && (
                <div className="flex items-start gap-3">
                  <Tag size={20} className="text-saffron shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black uppercase text-brown-light dark:text-slate-400">Location Reference</h4>
                    <p className="text-sm font-bold text-brown-dark dark:text-white font-sans mt-0.5">
                      {quote.chapter ? `Chapter ${quote.chapter}` : ""}{quote.verse ? `, Verse ${quote.verse}` : ""}
                    </p>
                  </div>
                </div>
              )}

              {quote.author && (
                <div className="flex items-start gap-3">
                  <User size={20} className="text-saffron shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black uppercase text-brown-light dark:text-slate-400">Speaker / Author</h4>
                    <p className="text-sm font-bold text-brown-dark dark:text-white font-sans mt-0.5">
                      {quote.author}
                    </p>
                  </div>
                </div>
              )}

              {quote.meaning && (
                <div className="flex items-start gap-3 border-t border-orange-100/30 dark:border-slate-800/50 pt-4">
                  <Sparkles size={20} className="text-saffron shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black uppercase text-brown-light dark:text-slate-400">Bhagwad Interpretation (Meaning)</h4>
                    <p className="text-sm leading-relaxed text-brown-dark dark:text-slate-200 font-devanagari mt-1">
                      {quote.meaning}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Center */}
          <div className="space-y-3 pt-4">
            <h3 className="text-xs font-black text-brown-light dark:text-slate-400 uppercase tracking-widest pl-1">Actions</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleDownloadImage}
                disabled={exporting}
                className="bg-saffron text-white py-3.5 px-4 rounded-2xl shadow-md font-sans font-black text-sm hover:bg-saffron-dark transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <Download size={18} />
                {exporting ? "Generating..." : "Save Image"}
              </button>

              <button
                onClick={handleNativeShare}
                className="bg-white dark:bg-slate-900 text-brown-dark dark:text-white py-3.5 px-4 rounded-2xl border border-orange-100 dark:border-slate-800 shadow-sm font-sans font-black text-sm hover:bg-orange-50/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Share2 size={18} className="text-saffron" />
                Share Quote
              </button>
            </div>

            <button
              onClick={handleCopyLink}
              className="w-full bg-white dark:bg-slate-900 text-brown-dark dark:text-white border border-orange-100 dark:border-slate-800 py-3.5 rounded-2xl shadow-sm font-sans font-black text-sm hover:bg-orange-50/50 dark:hover:bg-slate-800/50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check size={18} className="text-green-500" />
                  Link Copied Successfully
                </>
              ) : (
                <>
                  <Copy size={18} className="text-saffron" />
                  Copy Live Quote Link
                </>
              )}
            </button>

            {/* Direct Deep Link button */}
            <div className="bg-orange-50/60 dark:bg-slate-900/40 p-4 rounded-2xl border border-orange-100/50 dark:border-slate-800/50 text-center space-y-2 mt-4">
              <p className="text-xs text-brown-light dark:text-slate-400 font-bold leading-relaxed">
                Want to read comments, chant, and listen to authentic audio recitation?
              </p>
              <button
                onClick={handleOpenInApp}
                className="w-full bg-brown-dark hover:bg-brown-light dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-sans font-black text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Smartphone size={14} /> Open Free in Mobile App
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};
