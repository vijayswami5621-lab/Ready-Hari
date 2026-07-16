import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { SEO } from '../../components/SEO';
import { 
  ArrowLeft, Calendar, Sun, Moon, Info, Clock, AlertCircle, Share2, 
  Compass, Sparkles, Copy, Check, ShieldCheck, Heart 
} from 'lucide-react';
import { useShareContent } from '../../hooks/useShareContent';
import { useAutoPanchang } from '../../hooks/useAutoPanchang';
import { useGoBack } from "../../hooks/useGoBack";
import { getISTDateInfo } from '../../services/naamJapService';

export const PanchangScreen = () => {
  const goBack = useGoBack();
  const { shareContent } = useShareContent();
  const { panchang, loading, error } = useAutoPanchang();
  const [copied, setCopied] = useState(false);
  const { dateStr } = getISTDateInfo();

  // Convert "YYYY-MM-DD" to readable Hindi/English format
  const getReadableISTDate = () => {
    const d = new Date();
    return d.toLocaleDateString('hi-IN', { 
      weekday: 'long', 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const handleCopyMantra = (mantra: string) => {
    try {
      navigator.clipboard.writeText(mantra);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Failed to copy", err);
    }
  };

  const handleSharePanchang = () => {
    if (!panchang) return;
    const text = `✨ *हरि पाठशाला - दैनिक पञ्चाङ्ग* ✨
📅 दिनांक: ${panchang.date} (${panchang.weekday})
🕉️ तिथि: ${panchang.tithi} (समाप्ति: ${panchang.tithiEndTime})
🌓 पक्ष: ${panchang.paksha}
⭐ नक्षत्र: ${panchang.nakshatra} (समाप्ति: ${panchang.nakshatraEndTime})
💫 योग: ${panchang.yoga} (समाप्ति: ${panchang.yogaEndTime})
🤝 करण: ${panchang.karana} (समाप्ति: ${panchang.karanaEndTime})

🌅 सूर्योदय: ${panchang.sunrise} | 🌇 सूर्यास्त: ${panchang.sunset}
🌙 चन्द्रोदय: ${panchang.moonrise} | 🌗 चन्द्रास्त: ${panchang.moonset}
⏱️ दिन मान: ${panchang.dayDuration} | रात्रि मान: ${panchang.nightDuration}

🌺 पर्व/उत्सव: ${panchang.festival !== 'None' ? panchang.festival : 'कोई विशेष पर्व नहीं'}
🙏 आज का व्रत: ${panchang.vrat !== 'None' ? panchang.vrat : 'कोई विशेष व्रत नहीं'}
📢 विशेष दिन: ${panchang.specialDay}

🕉️ *आज का महामंत्र:*
"${panchang.mantra}"

📲 *हरि पाठशाला ऐप डाउनलोड करें और नित्य पञ्चाङ्ग एवं आध्यात्मिक ज्ञान प्राप्त करें।*`;

    shareContent({
      title: "Hari Pathshala Panchang",
      text: text,
      urlPath: '/panchang'
    });
  };

  const renderSkeleton = () => (
    <div className="space-y-6 animate-pulse px-6 py-4">
      {/* Header Banner Skeleton */}
      <div className="h-28 bg-orange-100/50 dark:bg-slate-800 rounded-[30px]"></div>
      
      {/* Bento Cards Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-64 bg-orange-100/50 dark:bg-slate-800 rounded-3xl"></div>
        <div className="h-64 bg-orange-100/50 dark:bg-slate-800 rounded-3xl"></div>
      </div>
      
      <div className="h-44 bg-orange-100/50 dark:bg-slate-800 rounded-3xl"></div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="h-40 bg-orange-100/50 dark:bg-slate-800 rounded-2xl"></div>
        <div className="h-40 bg-orange-100/50 dark:bg-slate-800 rounded-2xl"></div>
      </div>
    </div>
  );

  const renderError = () => (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-4">
        <AlertCircle size={32} />
      </div>
      <h3 className="font-bold text-brown-dark dark:text-white mb-2">Today's Panchang is temporarily unavailable</h3>
      <p className="text-sm text-brown-light dark:text-slate-400 max-w-sm">
        Please check your internet connection or try again shortly. Our Vedic systems are calculating the planetary alignments.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-950 transition-colors pb-24">
      <SEO title="Today's Panchang | Hari Pathshala" description="100% Accurate Hindu Panchang, Tithi, Nakshatra, and Shubh Muhurats." />
      
      {/* Stick Header */}
      <header className="pt-12 pb-4 px-6 sticky top-0 z-30 flex items-center bg-orange-50/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-orange-100/30 dark:border-slate-800/30">
        <button 
          onClick={() => goBack()} 
          className="p-2.5 bg-white dark:bg-slate-900 rounded-full text-brown-dark dark:text-white shadow-sm border border-orange-100/50 dark:border-slate-800/80 hover:bg-orange-50 transition active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="ml-4">
          <h1 className="text-lg font-bold font-sans text-brown-dark dark:text-white leading-tight">श्री हरि पञ्चाङ्ग</h1>
          <p className="text-[10px] text-brown-light dark:text-slate-400 font-extrabold uppercase tracking-widest">Vedic Ephemeris</p>
        </div>
        
        {panchang && (
          <button 
            onClick={handleSharePanchang} 
            className="ml-auto p-2.5 bg-white dark:bg-slate-900 rounded-full text-brown-dark dark:text-white shadow-sm border border-orange-100/50 dark:border-slate-800/80 hover:bg-orange-50 transition active:scale-95 flex items-center justify-center gap-1.5"
            title="Share Panchang"
          >
            <Share2 size={18} className="text-saffron-dark dark:text-saffron" />
          </button>
        )}
      </header>

      {loading && renderSkeleton()}
      
      {!loading && error && !panchang && renderError()}

      {!loading && panchang && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.4 }}
          className="px-6 mt-4 space-y-6"
        >
          {/* 1. Festival & Vrat Alert Banner */}
          {((panchang.festival && panchang.festival !== "None") || (panchang.vrat && panchang.vrat !== "None")) && (
            <div className="flex flex-col gap-3">
              {panchang.festival && panchang.festival !== "None" && (
                <div className="bg-gradient-to-r from-saffron-dark to-saffron text-white p-5 rounded-[28px] shadow-md flex items-center gap-4 relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                    <Sparkles size={24} className="text-yellow-200" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-80">आज का विशेष पर्व / उत्सव</p>
                    <h2 className="text-base font-bold leading-snug">{panchang.festival}</h2>
                  </div>
                </div>
              )}
              {panchang.vrat && panchang.vrat !== "None" && (
                <div className="bg-gradient-to-r from-amber-600 to-orange-500 text-white p-5 rounded-[28px] shadow-md flex items-center gap-4 relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                    <Calendar size={24} className="text-orange-200" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-80">आज का व्रत / उपवास</p>
                    <h2 className="text-base font-bold leading-snug">{panchang.vrat}</h2>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Primary Element Grid Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-orange-100/60 dark:border-slate-800/80 relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-5 dark:opacity-10 translate-x-4 -translate-y-4">
              <Compass size={180} className="text-saffron" />
            </div>
            
            <div className="flex justify-between items-center border-b border-orange-50 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Compass size={18} className="text-saffron-dark dark:text-saffron" />
                <h3 className="font-bold text-sm text-brown-dark dark:text-white font-sans">आज के मुख्य पञ्चाङ्ग अंग</h3>
              </div>
              <span className="text-[10px] bg-orange-100/50 dark:bg-slate-800 text-saffron-dark dark:text-saffron font-bold px-2.5 py-1 rounded-full uppercase">
                {panchang.weekday}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-start py-1 border-b border-orange-50/50 dark:border-slate-800/50">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 dark:text-slate-500 uppercase block tracking-wider">तिथि (Tithi)</span>
                  <span className="text-sm font-bold text-brown-dark dark:text-slate-200">{panchang.tithi}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-extrabold px-2 py-0.5 rounded">
                    समाप्ति काल
                  </span>
                  <span className="text-xs font-bold text-brown-light dark:text-slate-400 block mt-0.5">{panchang.tithiEndTime}</span>
                </div>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-orange-50/50 dark:border-slate-800/50">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 dark:text-slate-500 uppercase block tracking-wider">पक्ष (Paksha)</span>
                  <span className="text-sm font-bold text-brown-dark dark:text-slate-200">{panchang.paksha}</span>
                </div>
                <span className="text-xs font-bold text-brown-light dark:text-slate-400">
                  चन्द्र दिवस: #{panchang.lunarDayNumber}
                </span>
              </div>

              <div className="flex justify-between items-start py-1 border-b border-orange-50/50 dark:border-slate-800/50">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 dark:text-slate-500 uppercase block tracking-wider">नक्षत्र (Nakshatra)</span>
                  <span className="text-sm font-bold text-brown-dark dark:text-slate-200">{panchang.nakshatra}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-extrabold px-2 py-0.5 rounded">
                    समाप्ति काल
                  </span>
                  <span className="text-xs font-bold text-brown-light dark:text-slate-400 block mt-0.5">{panchang.nakshatraEndTime}</span>
                </div>
              </div>

              <div className="flex justify-between items-start py-1 border-b border-orange-50/50 dark:border-slate-800/50">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 dark:text-slate-500 uppercase block tracking-wider">योग (Yoga)</span>
                  <span className="text-sm font-bold text-brown-dark dark:text-slate-200">{panchang.yoga}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-extrabold px-2 py-0.5 rounded">
                    समाप्ति काल
                  </span>
                  <span className="text-xs font-bold text-brown-light dark:text-slate-400 block mt-0.5">{panchang.yogaEndTime}</span>
                </div>
              </div>

              <div className="flex justify-between items-start py-1">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 dark:text-slate-500 uppercase block tracking-wider">करण (Karana)</span>
                  <span className="text-sm font-bold text-brown-dark dark:text-slate-200">{panchang.karana}</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-extrabold px-2 py-0.5 rounded">
                    समाप्ति काल
                  </span>
                  <span className="text-xs font-bold text-brown-light dark:text-slate-400 block mt-0.5">{panchang.karanaEndTime}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Astronomical and Months Grid */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-orange-100/60 dark:border-slate-800/80">
            <h3 className="font-bold text-sm text-brown-dark dark:text-white border-b border-orange-50 dark:border-slate-800 pb-2.5 mb-4 font-sans">
              वैदिक संवत एवं मास विवरण
            </h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <p className="text-[9px] text-neutral-400 dark:text-slate-500 uppercase font-bold tracking-wider">विक्रम संवत (Vikram Samvat)</p>
                <p className="text-xs font-extrabold text-brown-dark dark:text-slate-200">{panchang.vikramSamvat}</p>
              </div>
              <div>
                <p className="text-[9px] text-neutral-400 dark:text-slate-500 uppercase font-bold tracking-wider">शक संवत (Shaka Samvat)</p>
                <p className="text-xs font-extrabold text-brown-dark dark:text-slate-200">{panchang.shakaSamvat}</p>
              </div>
              <div>
                <p className="text-[9px] text-neutral-400 dark:text-slate-500 uppercase font-bold tracking-wider">अमान्त मास (Amanta Month)</p>
                <p className="text-xs font-extrabold text-brown-dark dark:text-slate-200">{panchang.amantaMonth}</p>
              </div>
              <div>
                <p className="text-[9px] text-neutral-400 dark:text-slate-500 uppercase font-bold tracking-wider">पूर्णिमान्त मास (Purnimanta Month)</p>
                <p className="text-xs font-extrabold text-brown-dark dark:text-slate-200">{panchang.purnimantaMonth}</p>
              </div>
              <div>
                <p className="text-[9px] text-neutral-400 dark:text-slate-500 uppercase font-bold tracking-wider">अयन (Ayan)</p>
                <p className="text-xs font-extrabold text-brown-dark dark:text-slate-200">{panchang.ayan}</p>
              </div>
              <div>
                <p className="text-[9px] text-neutral-400 dark:text-slate-500 uppercase font-bold tracking-wider">ऋतु (Ritu)</p>
                <p className="text-xs font-extrabold text-brown-dark dark:text-slate-200">{panchang.ritu}</p>
              </div>
              <div>
                <p className="text-[9px] text-neutral-400 dark:text-slate-500 uppercase font-bold tracking-wider">सौर मास (Solar Month)</p>
                <p className="text-xs font-extrabold text-brown-dark dark:text-slate-200">{panchang.solarMonth}</p>
              </div>
              <div>
                <p className="text-[9px] text-neutral-400 dark:text-slate-500 uppercase font-bold tracking-wider">स्थान (Location)</p>
                <p className="text-xs font-extrabold text-brown-dark dark:text-slate-200">{panchang.city}</p>
              </div>
            </div>
          </div>

          {/* 4. Sun & Moon Timings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 shadow-sm border border-orange-100/60 dark:border-slate-800/80">
              <div className="flex items-center gap-2 mb-3 text-orange-500">
                <Sun size={18} />
                <h3 className="font-bold text-brown-dark dark:text-white text-xs">सूर्य विवरण</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[9px] text-neutral-400 dark:text-slate-500 uppercase font-bold block">सूर्य राशि</span>
                  <span className="font-bold text-brown-dark dark:text-slate-200">{panchang.sunSign}</span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-400 dark:text-slate-500 uppercase font-bold block">सूर्योदय</span>
                  <span className="font-bold text-brown-dark dark:text-slate-200">{panchang.sunrise}</span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-400 dark:text-slate-500 uppercase font-bold block">सूर्यास्त</span>
                  <span className="font-bold text-brown-dark dark:text-slate-200">{panchang.sunset}</span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-400 dark:text-slate-500 uppercase font-bold block">दिन मान (Day Duration)</span>
                  <span className="font-bold text-brown-dark dark:text-slate-200">{panchang.dayDuration}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 shadow-sm border border-orange-100/60 dark:border-slate-800/80">
              <div className="flex items-center gap-2 mb-3 text-indigo-500">
                <Moon size={18} />
                <h3 className="font-bold text-brown-dark dark:text-white text-xs">चन्द्र विवरण</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[9px] text-neutral-400 dark:text-slate-500 uppercase font-bold block">चन्द्र राशि</span>
                  <span className="font-bold text-brown-dark dark:text-slate-200">{panchang.moonSign}</span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-400 dark:text-slate-500 uppercase font-bold block">चन्द्रोदय</span>
                  <span className="font-bold text-brown-dark dark:text-slate-200">{panchang.moonrise}</span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-400 dark:text-slate-500 uppercase font-bold block">चन्द्रास्त</span>
                  <span className="font-bold text-brown-dark dark:text-slate-200">{panchang.moonset}</span>
                </div>
                <div>
                  <span className="text-[9px] text-neutral-400 dark:text-slate-500 uppercase font-bold block">रात्रि मान (Night Duration)</span>
                  <span className="font-bold text-brown-dark dark:text-slate-200">{panchang.nightDuration}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Auspicious and Inauspicious Muhurats */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-orange-100/60 dark:border-slate-800/80 space-y-4">
            <div className="flex items-center gap-2 mb-1 text-brown-dark dark:text-white border-b border-orange-50 dark:border-slate-800 pb-2.5">
               <Clock size={18} className="text-saffron-dark dark:text-saffron" />
               <h3 className="font-bold text-sm font-sans">वैदिक मुहूर्त एवं काल विवरण</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Auspicious Group */}
              <div className="space-y-3.5">
                <h4 className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 border-b border-emerald-50 dark:border-emerald-950 pb-1.5 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                  शुभ मुहूर्त (Auspicious)
                </h4>
                
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-xs font-bold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">अभिजीत मुहूर्त</span>
                  <span className="text-xs font-extrabold text-brown-dark dark:text-slate-200 bg-emerald-50/50 dark:bg-emerald-950/20 px-2 py-1 rounded-lg">
                    {panchang.abhijitMuhurat}
                  </span>
                </div>

                <div className="flex justify-between items-center py-0.5">
                  <span className="text-xs font-bold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">ब्रह्म मुहूर्त</span>
                  <span className="text-xs font-extrabold text-brown-dark dark:text-slate-200 bg-emerald-50/50 dark:bg-emerald-950/20 px-2 py-1 rounded-lg">
                    {panchang.brahmaMuhurat}
                  </span>
                </div>

                <div className="flex justify-between items-center py-0.5">
                  <span className="text-xs font-bold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">गोधूलि मुहूर्त</span>
                  <span className="text-xs font-extrabold text-brown-dark dark:text-slate-200 bg-emerald-50/50 dark:bg-emerald-950/20 px-2 py-1 rounded-lg">
                    {panchang.godhuliMuhurat}
                  </span>
                </div>

                <div className="flex justify-between items-center py-0.5">
                  <span className="text-xs font-bold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">विजया मुहूर्त</span>
                  <span className="text-xs font-extrabold text-brown-dark dark:text-slate-200 bg-emerald-50/50 dark:bg-emerald-950/20 px-2 py-1 rounded-lg">
                    {panchang.vijayaMuhurat}
                  </span>
                </div>

                <div className="flex justify-between items-center py-0.5">
                  <span className="text-xs font-bold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">अमृत काल (Kalam)</span>
                  <span className="text-xs font-extrabold text-brown-dark dark:text-slate-200 bg-emerald-50/50 dark:bg-emerald-950/20 px-2 py-1 rounded-lg">
                    {panchang.amritKalam}
                  </span>
                </div>
              </div>

              {/* Inauspicious Group */}
              <div className="space-y-3.5">
                <h4 className="text-[11px] font-extrabold text-red-600 dark:text-red-400 border-b border-red-50 dark:border-red-950 pb-1.5 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  अशुभ मुहूर्त (Inauspicious)
                </h4>
                
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-xs font-bold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">राहु काल</span>
                  <span className="text-xs font-extrabold text-brown-dark dark:text-slate-200 bg-red-50/50 dark:bg-red-950/20 px-2 py-1 rounded-lg">
                    {panchang.rahuKaal}
                  </span>
                </div>

                <div className="flex justify-between items-center py-0.5">
                  <span className="text-xs font-bold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">यमगण्ड काल</span>
                  <span className="text-xs font-extrabold text-brown-dark dark:text-slate-200 bg-red-50/50 dark:bg-red-950/20 px-2 py-1 rounded-lg">
                    {panchang.yamaganda}
                  </span>
                </div>

                <div className="flex justify-between items-center py-0.5">
                  <span className="text-xs font-bold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">गुलिका काल</span>
                  <span className="text-xs font-extrabold text-brown-dark dark:text-slate-200 bg-red-50/50 dark:bg-red-950/20 px-2 py-1 rounded-lg">
                    {panchang.gulikaKaal}
                  </span>
                </div>

                <div className="flex justify-between items-center py-0.5">
                  <span className="text-xs font-bold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">दुर्मुहूर्त काल</span>
                  <span className="text-xs font-extrabold text-brown-dark dark:text-slate-200 bg-red-50/50 dark:bg-red-950/20 px-2 py-1 rounded-lg">
                    {panchang.durMuhurat}
                  </span>
                </div>

                <div className="flex justify-between items-center py-0.5">
                  <span className="text-xs font-bold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">वर्ज्यम् काल</span>
                  <span className="text-xs font-extrabold text-brown-dark dark:text-slate-200 bg-red-50/50 dark:bg-red-950/20 px-2 py-1 rounded-lg">
                    {panchang.varjyam}
                  </span>
                </div>

                <div className="flex justify-between items-center py-0.5">
                  <span className="text-xs font-bold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">निशिता मुहूर्त</span>
                  <span className="text-xs font-extrabold text-brown-dark dark:text-slate-200 bg-red-50/50 dark:bg-red-950/20 px-2 py-1 rounded-lg">
                    {panchang.nishitaMuhurat}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 6. Special Advice or Guidance */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-orange-100/60 dark:border-slate-800/80 space-y-4">
            <div className="flex items-center gap-2 text-saffron-dark dark:text-saffron">
              <Info size={18} />
              <h3 className="font-bold text-sm font-sans">आज का विशेष आध्यात्मिक संदेश</h3>
            </div>
            <p className="text-xs font-semibold text-neutral-500 dark:text-slate-400 leading-relaxed uppercase tracking-wider border-b border-orange-50/50 dark:border-slate-800 pb-2">
              🕉️ {panchang.specialDay}
            </p>
            <p className="text-sm font-bold text-brown-dark dark:text-slate-300 leading-relaxed">
              {panchang.devotionalMessage}
            </p>
          </div>

          {/* 7. Recommended Daily Mantra Card */}
          <div className="bg-gradient-to-b from-orange-100/40 to-orange-200/20 dark:from-slate-900 dark:to-slate-950 p-6 rounded-[32px] border border-orange-200/50 dark:border-slate-800/80 relative overflow-hidden text-center">
            <div className="absolute left-1/2 -translate-x-1/2 -top-12 w-28 h-28 bg-saffron/10 rounded-full blur-2xl"></div>
            <p className="text-[9px] font-bold text-saffron-dark dark:text-saffron uppercase tracking-widest mb-2.5">आज का दैनिक महामंत्र</p>
            <p className="text-base font-extrabold text-brown-dark dark:text-white leading-relaxed mb-4 font-serif">
              "{panchang.mantra}"
            </p>
            
            <button
              onClick={() => handleCopyMantra(panchang.mantra)}
              className="mx-auto flex items-center gap-1.5 bg-white dark:bg-slate-800 text-xs font-bold px-4 py-2 rounded-full text-brown-dark dark:text-slate-200 shadow-sm hover:bg-orange-50 active:scale-95 transition"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-500 animate-bounce" />
                  <span className="text-emerald-500 font-extrabold">कॉपी कर लिया गया है!</span>
                </>
              ) : (
                <>
                  <Copy size={14} className="text-saffron-dark dark:text-saffron" />
                  <span>मंत्र कॉपी करें</span>
                </>
              )}
            </button>
          </div>

          {/* Secure & Verification badge */}
          <div className="flex flex-col items-center justify-center gap-1 pb-12 pt-2 text-center opacity-85">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={14} />
              <span>100% Verified Vedic Calculations (IST)</span>
            </div>
            <p className="text-[9px] text-neutral-400 dark:text-slate-500">
              Hari Pathshala systems continuously monitor planetary vectors for accuracy.
            </p>
          </div>

        </motion.div>
      )}
    </div>
  );
};
