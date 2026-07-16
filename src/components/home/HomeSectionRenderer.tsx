import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Sparkles, Send, Video, ChevronRight, Play, BookOpen, Book, 
  ShoppingBag, Star, Users, MessageSquare, Heart, ExternalLink, ArrowRight, Calendar
} from 'lucide-react';
import { SecureImage } from '../common/SecureImage';
import { QuotesSlider } from '../QuotesSlider';
import { DohaSlider } from '../DohaSlider';
import { getVideoThumbnail } from '../../utils/videoUtils';
import { QuoteSkeleton, PanchangSkeleton, CategoryListSkeleton, VideoListSkeleton, ProductGridSkeleton } from '../Skeleton';
import { useRealtimeCollection } from '../../hooks/useRealtimeCollection';

interface HomeSectionRendererProps {
  section: {
    id: string;
    type: string;
    title?: string;
    subtitle?: string;
    show?: boolean;
    displayOrder?: number;
  };
  quotes: any[];
  videos: any[];
  products: any[];
  categories: any[];
  panchang: any;
  testimonials: any[];
  events: any[];
  aiGuruInput: string;
  setAiGuruInput: (val: string) => void;
  handleAskGuru: (text: string) => void;
  chantingStats: {
    todayJap: number;
    lifetimeJap: number;
    streak: number;
  };
  quizHomeStats: {
    todayQuizName: string;
    overallScore: number;
    currentStreak: number;
  };
  userRankInfo: {
    rank: number;
    xp: number;
    badge: string;
  } | null;
  leaderboardLoading: boolean;
  leaderboardData: any[];
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  setIsPaused: (val: boolean) => void;
  isPaused: boolean;
  profileImg: string;
  userName: string;
  userCertificatesCount: number;
  handleShareQuote: (quote: any) => void;
  loadingQuotes: boolean;
  loadingVideos: boolean;
  loadingCategories: boolean;
  loadingProducts: boolean;
  loadingPanchang: boolean;
  user: any;
}

const itemVariants: any = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
};

export const HomeSectionRenderer: React.FC<HomeSectionRendererProps> = ({
  section,
  quotes,
  videos,
  products,
  categories,
  panchang,
  testimonials,
  events,
  aiGuruInput,
  setAiGuruInput,
  handleAskGuru,
  chantingStats,
  quizHomeStats,
  userRankInfo,
  leaderboardLoading,
  leaderboardData,
  scrollContainerRef,
  setIsPaused,
  isPaused,
  profileImg,
  userName,
  userCertificatesCount,
  handleShareQuote,
  loadingQuotes,
  loadingVideos,
  loadingCategories,
  loadingProducts,
  loadingPanchang,
  user
}) => {

  switch (section.type) {
    // 1. DAILY SUTRA / DIVINE WISDOM
    case 'daily_quote':
      if (loadingQuotes) return <QuoteSkeleton />;
      return (
        <motion.div variants={itemVariants}>
          <QuotesSlider 
            quotes={quotes} 
            title={section.title || 'DAILY DIVINE SUTRA'} 
            onShare={handleShareQuote} 
          />
        </motion.div>
      );

    // 1b. DAILY MALA JAP CARD
    case 'daily_chanting':
      return (
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5.5 border border-orange-100 dark:border-slate-850 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-orange-200/15 to-transparent dark:from-orange-950/5 pointer-events-none rounded-bl-full" />
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-saffron bg-saffron/10 dark:bg-saffron/5 px-2 py-0.5 rounded-md">
                  📿 NAAM JAP SADHANA
                </span>
                <h3 className="font-sans font-extrabold text-sm text-brown-dark dark:text-white mt-1.5">
                  Your Chanting Progress
                </h3>
              </div>
              <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/20 px-2.5 py-1 rounded-full border border-red-100/40">
                <span className="text-xs">🔥</span>
                <span className="font-mono text-[10px] font-black text-red-600 dark:text-red-400">
                  {chantingStats.streak} Days
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-850/60 text-center">
                <span className="text-[8px] font-black uppercase tracking-wider text-neutral-400 block">Today's Counts</span>
                <span className="text-base font-black text-brown-dark dark:text-white mt-1 block font-sans">
                  📿 {chantingStats.todayJap}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-850/60 text-center">
                <span className="text-[8px] font-black uppercase tracking-wider text-neutral-400 block">Lifetime Jap</span>
                <span className="text-base font-black text-orange-600 dark:text-orange-400 mt-1 block font-sans">
                  ⚡ {chantingStats.lifetimeJap}
                </span>
              </div>
            </div>

            <Link 
              to="/chanting" 
              className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-saffron to-orange-accent hover:shadow-[0_6px_20px_rgba(255,153,51,0.25)] text-white text-xs font-extrabold rounded-2xl transition duration-300 transform active:scale-[0.98]"
            >
              Enter Naam Jap Room <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>
      );

    // 2. DAILY VEDIC PANCHANG
    case 'panchang':
      if (loadingPanchang) return <PanchangSkeleton />;
      return (
        <motion.section variants={itemVariants} className="space-y-3">
          <div className="flex justify-between items-end mb-1">
            <h2 className="text-lg font-bold font-sans tracking-tight text-brown-dark dark:text-white flex items-center gap-2">
              <Calendar size={18} className="text-saffron-dark dark:text-saffron-light"/> 
              {section.title || "Today's Panchang"}
            </h2>
            <Link to="/panchang" className="text-xs text-saffron-dark dark:text-saffron-light font-bold flex items-center hover:translate-x-0.5 transition-transform">
              Complete Panchang <ChevronRight size={14} className="ml-0.5"/>
            </Link>
          </div>

          <div className="bg-gradient-to-br from-orange-50/70 via-amber-50/40 to-orange-50/70 dark:from-slate-900/60 dark:via-slate-900/40 dark:to-slate-900/60 backdrop-blur-md rounded-[28px] p-5.5 border border-orange-100/60 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="absolute -bottom-10 -right-10 w-28 h-28 bg-saffron/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex justify-between items-start border-b border-orange-100/40 dark:border-slate-800/60 pb-3 mb-4.5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-saffron-dark dark:text-saffron-light bg-saffron/10 dark:bg-saffron/5 px-2.5 py-1 rounded-md">
                  🗓️ {panchang?.weekday || "Monday"}
                </span>
                <p className="text-[10px] text-brown-light/60 dark:text-slate-400 mt-2 font-medium font-sans">
                  Vikram Samvat {panchang?.vikramSamvat || "2081"}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-950/25 px-2.5 py-1 rounded-md">
                  🌟 {panchang?.paksha || "Shukla"} Paksha
                </span>
                <p className="text-xs font-black text-brown-dark dark:text-white mt-2 font-mukta">
                  {panchang?.tithi || "Pratipada"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-[11px] font-medium text-brown-light dark:text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-sm">🌙</span>
                <div className="flex flex-col">
                  <span className="text-[9px] text-neutral-400 font-bold uppercase">Nakshatra</span>
                  <span className="font-sans font-bold text-brown-dark dark:text-white truncate">{panchang?.nakshatra || "Ashwini"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">🧘</span>
                <div className="flex flex-col">
                  <span className="text-[9px] text-neutral-400 font-bold uppercase">Yog</span>
                  <span className="font-sans font-bold text-brown-dark dark:text-white truncate">{panchang?.yoga || "Siddha"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">☀️</span>
                <div className="flex flex-col">
                  <span className="text-[9px] text-neutral-400 font-bold uppercase">Sunrise</span>
                  <span className="font-sans font-bold text-brown-dark dark:text-white">{panchang?.sunrise || "05:43 AM"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">🌇</span>
                <div className="flex flex-col">
                  <span className="text-[9px] text-neutral-400 font-bold uppercase">Sunset</span>
                  <span className="font-sans font-bold text-brown-dark dark:text-white">{panchang?.sunset || "07:12 PM"}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      );

    // 3. AI GURU
    case 'aiguru_banner':
    case 'faq':
      return (
        <motion.section variants={itemVariants} className="space-y-3">
          <div className="flex justify-between items-end mb-1">
            <h2 className="text-lg font-bold font-sans tracking-tight text-brown-dark dark:text-white flex items-center gap-2">
              <Sparkles className="text-saffron" size={18} />
              Talk with AI Guru
            </h2>
          </div>

          <div className="relative rounded-[28px] p-[2px] bg-gradient-to-br from-indigo-500 via-purple-500 to-saffron shadow-lg overflow-hidden group">
            <div className="absolute -inset-10 bg-radial-gradient from-purple-500/15 via-transparent to-transparent blur-xl pointer-events-none" />

            <div className="relative rounded-[26px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-5 md:p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="absolute inset-0 bg-saffron/30 rounded-full animate-ping opacity-60"></div>
                  <div className="w-12 h-12 bg-gradient-to-tr from-saffron to-purple-600 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 relative z-10 shadow-md">
                    <Sparkles className="text-white animate-pulse" size={22} />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-slate-900 z-20"></span>
                </div>

                <div>
                  <h3 className="font-bold text-sm md:text-base text-brown-dark dark:text-white flex items-center gap-1.5 leading-tight">
                    AI Guru Spiritual Assistant
                    <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-300 rounded-full font-bold">2.0</span>
                  </h3>
                  <p className="text-xs text-brown-light/80 dark:text-slate-400 mt-0.5">Ask questions about Bhagavad Gita, Vedas, or daily spiritual guidance.</p>
                </div>
              </div>

              <div className="relative flex items-center">
                <input 
                  type="text" 
                  placeholder="Ask: What is the true path to devotion?"
                  value={aiGuruInput}
                  onChange={(e) => setAiGuruInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskGuru(aiGuruInput)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 rounded-2xl py-3 pl-4 pr-12 text-xs font-medium focus:outline-none focus:border-saffron focus:ring-1 focus:ring-saffron dark:text-white shadow-inner transition-colors"
                />
                <button 
                  onClick={() => handleAskGuru(aiGuruInput)}
                  className="absolute right-2 p-2 bg-gradient-to-r from-saffron to-orange-accent text-white rounded-xl hover:shadow-md active:scale-95 transition"
                >
                  <Send size={14} />
                </button>
              </div>

              <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                {[
                  "Explain Gita Ch-2", 
                  "Today's Spiritual Advice", 
                  "How to practice peace?",
                  "Vedic Chanting guides"
                ].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleAskGuru(chip)}
                    className="px-3 py-1.5 bg-orange-100/40 dark:bg-slate-800 hover:bg-saffron/10 dark:hover:bg-slate-700/80 text-brown-dark dark:text-slate-300 rounded-full text-[10px] font-bold border border-orange-100/50 dark:border-slate-800 whitespace-nowrap transition-colors"
                  >
                    💡 {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.section>
      );

    // 4. LATEST ADHYAYAN
    case 'latest_videos':
      if (loadingVideos) return <VideoListSkeleton />;
      return (
        <motion.section variants={itemVariants} className="space-y-3">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-lg font-bold font-sans tracking-tight text-brown-dark dark:text-white flex items-center gap-2">
              <Video size={18} className="text-saffron-dark dark:text-saffron-light"/> 
              {section.title || 'Latest Adhyayan'}
            </h2>
            <Link to="/adhyayan" className="text-xs text-saffron-dark dark:text-saffron-light font-bold flex items-center hover:translate-x-0.5 transition-transform">
              See All <ChevronRight size={14} className="ml-0.5"/>
            </Link>
          </div>

          <div className="flex gap-4.5 overflow-x-auto pb-4 snap-x hide-scrollbar">
            {videos.slice(0, 4).map((vid: any) => (
              <div 
                key={vid.id} 
                className="min-w-[260px] max-w-[260px] snap-center group relative cursor-pointer"
              >
                <Link to={`/adhyayan/video/${vid.id}`} className="block">
                  <div className="relative rounded-[22px] overflow-hidden aspect-video bg-brown-light dark:bg-slate-800 shadow-md group-hover:shadow-[0_12px_24px_rgba(255,153,51,0.15)] group-hover:-translate-y-1.5 transition-all duration-300 border border-orange-100/40 dark:border-slate-700">
                    <SecureImage src={getVideoThumbnail(vid)} alt="Thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex flex-col justify-between p-3">
                      <div className="self-start">
                        <span className="bg-saffron/95 text-white text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-widest border border-white/20">
                          {vid.category || "Scripture"}
                        </span>
                      </div>

                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-11 h-11 bg-white/95 dark:bg-slate-900/90 rounded-full flex items-center justify-center pl-1 shadow-lg group-hover:scale-110 group-hover:bg-saffron group-hover:text-white transition-all duration-300">
                          <Play className="text-saffron group-hover:text-white fill-current transition-colors" size={16} />
                        </div>
                      </div>

                      <div className="flex justify-between items-end text-[10px] text-white/90">
                        <span className="bg-black/40 px-2 py-0.5 rounded-md font-mono">{vid.duration || "10:00"}</span>
                        <span className="opacity-90 font-medium">Click to study</span>
                      </div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                      <div className="h-full bg-saffron w-[45%]" />
                    </div>
                  </div>

                  <h3 className="font-bold text-sm text-brown-dark dark:text-white mt-2.5 line-clamp-2 leading-tight group-hover:text-saffron transition-colors">
                    {vid.title}
                  </h3>
                </Link>
              </div>
            ))}
          </div>
        </motion.section>
      );

    // 5. EXPLORE PATHWAYS CATEGORIES
    case 'spiritual_categories':
      if (loadingCategories) return <CategoryListSkeleton />;
      return (
        <motion.section variants={itemVariants} className="space-y-3">
          <div className="flex justify-between items-end mb-1">
            <h2 className="text-lg font-bold font-sans tracking-tight text-brown-dark dark:text-white flex items-center gap-2">
              <BookOpen size={18} className="text-saffron-dark dark:text-saffron-light"/> 
              {section.title || 'Explore Spiritual Path'}
            </h2>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {categories.slice(0, 4).map((cat: any, i: number) => {
              const bgColors = [
                'bg-orange-100/40 border-orange-200/50 dark:bg-slate-800 text-saffron-dark',
                'bg-amber-100/40 border-amber-200/50 dark:bg-slate-800 text-amber-700',
                'bg-yellow-100/40 border-yellow-200/50 dark:bg-slate-800 text-yellow-700',
                'bg-red-100/40 border-red-200/50 dark:bg-slate-800 text-red-600'
              ];
              return (
                <Link 
                  to={`/adhyayan/category/${cat.id}`} 
                  key={cat.id} 
                  className="flex flex-col items-center group"
                >
                  <div className={`w-16 h-16 rounded-[22px] ${bgColors[i % bgColors.length]} flex items-center justify-center shadow-sm mb-2.5 hover:scale-110 active:scale-95 transition-all duration-300 border`}>
                    <Book size={24} className="group-hover:rotate-6 transition-transform" />
                  </div>
                  <span className="text-[10px] font-bold text-center text-brown-dark dark:text-slate-300 leading-tight group-hover:text-saffron transition-colors">
                    {cat?.name || "Category"}
                  </span>
                </Link>
              );
            })}
          </div>
        </motion.section>
      );

    // 6. MISSION CARD
    case 'mission':
      return (
        <motion.section variants={itemVariants}>
          <div className="bg-gradient-to-br from-[#2E1A05] via-[#1F1001] to-[#2E1A05] dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 rounded-[30px] p-6 text-white text-center shadow-xl border border-amber-900/40 relative overflow-hidden group">
            <div className="absolute top-[-40px] right-[-40px] w-36 h-36 bg-saffron/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
            <div className="absolute bottom-[-40px] left-[-40px] w-36 h-36 bg-orange-500/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />

            <div className="relative z-10 space-y-4">
              <div className="inline-block p-2 bg-white/5 rounded-2xl border border-white/10 mb-1">
                <Sparkles className="text-amber-400" size={20} />
              </div>
              
              <h3 className="text-xl font-bold font-sans tracking-tight text-amber-200">
                {section.title || 'Our Devotional Mission'}
              </h3>
              <p className="text-xs md:text-sm font-mukta opacity-80 leading-relaxed max-w-sm mx-auto">
                {section.subtitle || 'Spreading the divine wisdom of Sanatan Dharma to every household, making spiritual education free, authentic, and life-changing.'}
              </p>
              
              <div className="pt-2">
                <Link 
                  to="/info/mission" 
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-saffron hover:shadow-[0_8px_20px_rgba(255,153,51,0.3)] text-[#1F1001] px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 transform active:scale-95 shadow-md"
                >
                  Read Our Vision <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </motion.section>
      );

    // 7. RAMCHARITMANAS DOHA
    case 'doha':
      return (
        <motion.section variants={itemVariants}>
          <DohaSlider title={section.title} />
        </motion.section>
      );

    // 8. STORE / DEVOTIONAL ITEMS
    case 'featured_products':
      if (loadingProducts) return <ProductGridSkeleton />;
      return (
        <motion.section variants={itemVariants} className="space-y-3">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-lg font-bold font-sans tracking-tight text-brown-dark dark:text-white flex items-center gap-2">
              <ShoppingBag size={18} className="text-saffron-dark dark:text-saffron-light"/> 
              {section.title || 'Devotional Store'}
            </h2>
            <Link to="/store" className="text-xs text-saffron-dark dark:text-saffron-light font-bold flex items-center hover:translate-x-0.5 transition-transform">
              Explore Shop <ChevronRight size={14} className="ml-0.5"/>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {products.slice(0, 4).map((item: any) => (
              <div 
                key={item.id} 
                className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-3.5 rounded-[24px] shadow-sm border border-orange-100/60 dark:border-slate-800 flex flex-col h-full justify-between hover:shadow-[0_12px_24px_rgba(255,153,51,0.06)] hover:-translate-y-1 transition-all duration-300 group"
              >
                <div>
                  <div className="aspect-square bg-slate-50 dark:bg-slate-950 rounded-2xl overflow-hidden mb-3 relative border border-orange-100/20">
                    <SecureImage src={item.image} alt="Product" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    
                    {item.originalPrice && item.originalPrice > item.price && (
                      <div className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-orange-accent text-white text-[8px] font-extrabold px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wider z-10">
                        Save {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}%
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-xs text-brown-dark dark:text-white line-clamp-2 leading-tight group-hover:text-saffron transition-colors">
                    {item?.name || item?.title || "Sadhana Item"}
                  </h3>
                  
                  <div className="flex text-amber-500 gap-0.5 my-1.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={10} fill="currentColor" />
                    ))}
                    <span className="text-[9px] text-brown-light/40 dark:text-slate-500 font-mono pl-1">(5.0)</span>
                  </div>
                </div>

                <div className="mt-2.5">
                  <div className="flex items-baseline justify-between mb-2">
                    <p className="text-saffron-dark dark:text-saffron-light font-extrabold text-sm font-mono">
                      ₹{item.price}
                    </p>
                    {item.originalPrice && item.originalPrice > item.price && (
                      <p className="text-[10px] text-brown-light/40 dark:text-slate-500 line-through font-mono">
                        ₹{item.originalPrice}
                      </p>
                    )}
                  </div>

                  <Link 
                    to={`/store/product/${item.id}`} 
                    className="block w-full py-2 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-slate-800 dark:to-slate-800 text-saffron-dark dark:text-saffron-light hover:from-saffron hover:to-orange-accent hover:text-white text-center text-[10px] font-extrabold rounded-xl border border-orange-100/50 dark:border-slate-700 transition-all shadow-sm"
                  >
                    Buy Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      );

    // 9. SANGHA / COMMUNITY
    case 'community':
      return (
        <motion.section variants={itemVariants} className="space-y-3">
          <div className="flex justify-between items-end mb-1">
            <h2 className="text-lg font-bold font-sans tracking-tight text-brown-dark dark:text-white flex items-center gap-2">
              <Users size={18} className="text-saffron-dark dark:text-saffron-light"/> 
              {section.title || 'Devotee Sangha (Community)'}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Link 
              to="/community/voice" 
              className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-5 rounded-[24px] shadow-sm border border-orange-100/60 dark:border-slate-800 flex flex-col items-center justify-center text-center group hover:border-saffron-dark hover:shadow-[0_12px_24px_rgba(255,153,51,0.05)] transition-all duration-300"
            >
              <div className="w-11 h-11 bg-orange-100/40 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-inner text-saffron-dark">
                <MessageSquare size={18} className="text-saffron-dark dark:text-saffron-light" />
              </div>
              <h3 className="font-bold text-brown-dark dark:text-white text-xs">Community Voice</h3>
              <p className="text-[10px] text-brown-light/60 dark:text-slate-400 mt-1 leading-snug">Discuss holy scriptures & sadhana</p>
            </Link>

            <Link 
              to="/community/experiences" 
              className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-5 rounded-[24px] shadow-sm border border-orange-100/60 dark:border-slate-800 flex flex-col items-center justify-center text-center group hover:border-saffron-dark hover:shadow-[0_12px_24px_rgba(255,153,51,0.05)] transition-all duration-300"
            >
              <div className="w-11 h-11 bg-red-100/40 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-inner text-red-500">
                <Heart size={18} className="text-red-500 dark:text-red-400" />
              </div>
              <h3 className="font-bold text-brown-dark dark:text-white text-xs">Divine Miracles</h3>
              <p className="text-[10px] text-brown-light/60 dark:text-slate-400 mt-1 leading-snug">Read inspiring spiritual stories</p>
            </Link>
          </div>
        </motion.section>
      );

    // 10. QUICK LINKS
    case 'quick_links':
      return (
        <motion.section variants={itemVariants} className="grid grid-cols-2 gap-4">
          <a href="https://haripathshala.online" target="_blank" rel="noopener noreferrer" className="block w-full group">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-[22px] shadow-sm border border-orange-100/60 dark:border-slate-800 flex flex-col items-center justify-center text-center hover:border-saffron-dark hover:shadow-[0_10px_20px_rgba(255,153,51,0.04)] transition-all duration-300">
              <div className="w-10 h-10 bg-orange-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform text-saffron-dark">
                <ExternalLink size={18} />
              </div>
              <h3 className="font-bold text-brown-dark dark:text-white text-xs">Official Portal</h3>
              <p className="text-[10px] text-brown-light/50 dark:text-slate-500 mt-0.5">Visit Online Hub</p>
            </div>
          </a>

          <a href="https://wa.me/919610579423" target="_blank" rel="noopener noreferrer" className="block w-full group">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-[22px] shadow-sm border border-orange-100/60 dark:border-slate-800 flex flex-col items-center justify-center text-center hover:border-green-500 hover:shadow-[0_10px_20px_rgba(34,197,94,0.08)] transition-all duration-300">
              <div className="w-10 h-10 bg-green-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform text-green-600">
                <MessageSquare size={18} />
              </div>
              <h3 className="font-bold text-brown-dark dark:text-white text-xs">Satsang Sangha</h3>
              <p className="text-[10px] text-brown-light/50 dark:text-slate-500 mt-0.5">Join WhatsApp Community</p>
            </div>
          </a>
        </motion.section>
      );

    // 11. FOOTER (With Leaderboard inside)
    case 'footer':
      return (
        <React.Fragment>
          {/* DIVINE LEADERBOARD */}
          <motion.div variants={itemVariants} className="mt-12 space-y-4 text-left">
            <div className="flex justify-between items-end px-1">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-saffron bg-saffron/10 dark:bg-saffron/5 px-2.5 py-1 rounded-md">
                  🏆 DIVINE LEADERBOARD
                </span>
                <h3 className="font-sans font-extrabold text-xl text-brown-dark dark:text-white mt-2 flex items-center gap-2">
                  Spiritual Champions
                </h3>
              </div>
              <span className="text-xs text-neutral-400 font-medium font-sans">
                Realtime Updates
              </span>
            </div>

            {user && userRankInfo && (
              <div className="bg-gradient-to-br from-saffron/10 via-amber-500/10 to-orange-600/15 dark:from-saffron/20 dark:via-amber-500/10 dark:to-orange-950/20 rounded-3xl p-5 border border-saffron/30 dark:border-saffron/20 shadow-sm relative overflow-hidden">
                <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-saffron/10 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center gap-3.5 border-b border-orange-100/40 dark:border-slate-800/60 pb-3.5 mb-4">
                  <div className="relative">
                    <SecureImage src={profileImg} alt="User avatar" className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-900 shadow" />
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-400 to-amber-600 text-white font-sans text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-sm">
                      {userRankInfo.rank}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-brown-dark dark:text-white flex items-center gap-1.5">
                      {userName}
                      <span className="bg-saffron/10 text-saffron text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider scale-90">
                        {userRankInfo.badge}
                      </span>
                    </h4>
                    <p className="text-[10px] text-neutral-500 dark:text-slate-400 mt-0.5">Your current devotional progress across the applet</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 xs:grid-cols-4 gap-2 text-center">
                  <div className="bg-white/50 dark:bg-slate-900/40 p-2.5 rounded-2xl border border-orange-100/20 dark:border-slate-800/40">
                    <span className="text-[8px] font-extrabold uppercase tracking-widest text-neutral-400 block">Your Rank</span>
                    <span className="text-sm font-black text-brown-dark dark:text-white font-sans mt-1 block">{userRankInfo.rank}</span>
                  </div>
                  <div className="bg-white/50 dark:bg-slate-900/40 p-2.5 rounded-2xl border border-orange-100/20 dark:border-slate-800/40">
                    <span className="text-[8px] font-extrabold uppercase tracking-widest text-neutral-400 block">Total XP</span>
                    <span className="text-sm font-black text-orange-600 dark:text-orange-400 font-sans mt-1 block">⚡ {userRankInfo.xp}</span>
                  </div>
                  <div className="bg-white/50 dark:bg-slate-900/40 p-2.5 rounded-2xl border border-orange-100/20 dark:border-slate-800/40">
                    <span className="text-[8px] font-extrabold uppercase tracking-widest text-neutral-400 block">Certificates</span>
                    <span className="text-sm font-black text-brown-dark dark:text-white font-sans mt-1 block">📜 {userCertificatesCount}</span>
                  </div>
                  <div className="bg-white/50 dark:bg-slate-900/40 p-2.5 rounded-2xl border border-orange-100/20 dark:border-slate-800/40">
                    <span className="text-[8px] font-extrabold uppercase tracking-widest text-neutral-400 block">Naam Jap</span>
                    <span className="text-sm font-black text-brown-dark dark:text-white font-sans mt-1 block">📿 {chantingStats.lifetimeJap}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-orange-100 dark:border-slate-850 p-4 shadow-sm">
              {leaderboardLoading ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-2">
                  <div className="w-8 h-8 border-4 border-saffron border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-neutral-500 font-medium">Seeking Sadhaks...</p>
                </div>
              ) : leaderboardData.length === 0 ? (
                <div className="text-center py-10 text-neutral-400 font-medium text-xs">
                  No players in global leaderboard yet. Be the first one!
                </div>
              ) : (
                <div 
                  ref={scrollContainerRef}
                  className="h-[300px] overflow-y-hidden cursor-pointer"
                  onTouchStart={() => setIsPaused(true)}
                  onTouchEnd={() => setIsPaused(false)}
                  onMouseEnter={() => setIsPaused(true)}
                  onMouseLeave={() => setIsPaused(false)}
                >
                  <div className="space-y-2 pb-2">
                    {[...leaderboardData.slice(0, 100), ...leaderboardData.slice(0, 100)].map((item, idx) => {
                      const realIndex = idx % leaderboardData.slice(0, 100).length;
                      const rank = realIndex + 1;
                      const isCurrentUser = user && item.id === user.uid;
                      
                      return (
                        <div 
                          key={`${item.id}-${idx}`}
                          className={`flex items-center justify-between p-3 rounded-2xl transition-all duration-350 ${
                            isCurrentUser 
                              ? 'bg-gradient-to-r from-orange-100 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/20 border border-saffron/30 animate-pulse' 
                              : 'bg-orange-50/20 dark:bg-slate-950/30 hover:bg-orange-50/50 dark:hover:bg-slate-950/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 flex items-center justify-center font-black font-sans text-xs">
                              {rank === 1 ? (
                                <span className="text-lg">👑</span>
                              ) : rank === 2 ? (
                                <span className="text-neutral-400 font-bold font-sans">#2</span>
                              ) : rank === 3 ? (
                                <span className="text-amber-700 font-bold font-sans">#3</span>
                              ) : (
                                <span className="text-neutral-400 font-bold font-sans">#{rank}</span>
                              )}
                            </div>

                            <div className="w-9 h-9 rounded-full overflow-hidden border border-orange-100 dark:border-slate-800 bg-orange-100/50 flex items-center justify-center">
                              {item.profileImage || item.photoURL ? (
                                <img src={item.profileImage || item.photoURL} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <span className="text-xs text-neutral-400 font-bold">{item.name?.charAt(0).toUpperCase() || 'S'}</span>
                              )}
                            </div>

                            <div className="text-left">
                              <h5 className={`text-xs font-bold font-sans flex items-center gap-1.5 ${isCurrentUser ? 'text-orange-900 dark:text-orange-200' : 'text-brown-dark dark:text-white'}`}>
                                {item.name || 'Sadhak'}
                                {item.badge && (
                                  <span className="bg-saffron/10 text-saffron text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                    {item.badge}
                                  </span>
                                )}
                              </h5>
                              <p className="text-[9px] text-neutral-400 mt-0.5">Level {item.level || 1} • {item.badge || 'Sadhak'} • 📿 {item.naamJap || item.lifetimeJap || item.japCount || 0}</p>
                            </div>
                          </div>

                          <div className="text-right flex flex-col justify-center">
                            <span className="text-xs font-black text-brown-dark dark:text-white font-sans">⚡ {item.xp || 0} <span className="text-[8px] text-neutral-400 font-bold uppercase font-sans">XP</span></span>
                            <span className="text-[9px] text-neutral-400 font-bold mt-0.5">Score: {item.score || 0}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-[9px] text-neutral-400 text-center font-sans">
              ☝️ Touch & hold the leaderboard to freeze scrolling and examine participants.
            </p>
          </motion.div>

          <motion.footer className="text-center pt-10 pb-20 border-t border-orange-100/50 dark:border-slate-800/80 mt-12 w-full">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-850 p-2.5 mb-4 shadow-md border border-orange-100/50 dark:border-slate-800 relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-saffron/20 to-amber-100/20 scale-0 group-hover:scale-100 transition-transform duration-500 rounded-full" />
                <img src="/logo.png" alt="Hari Pathshala Logo" className="w-full h-full object-contain relative z-10" />
              </div>
              
              <h3 className="font-devanagari font-extrabold text-2xl text-brown-dark dark:text-white tracking-wide">
                हरि पाठशाला
              </h3>
              <p className="text-xs text-brown-light/80 dark:text-slate-400 mt-2 font-mukta max-w-xs px-4 leading-relaxed italic">
                "Spiritual Education & Authentic Hindu Scriptures. Connecting modern souls to their divine roots."
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-8 px-4 text-xs font-bold text-brown-light/70 dark:text-slate-400">
              <Link to="/profile/contact" className="hover:text-saffron">Contact</Link>
              <span>•</span>
              <Link to="/profile/about" className="hover:text-saffron">About</Link>
              <span>•</span>
              <Link to="/profile/privacy" className="hover:text-saffron">Privacy</Link>
              <span>•</span>
              <Link to="/info/terms" className="hover:text-saffron">Terms</Link>
              <span>•</span>
              <Link to="/info/refunds" className="hover:text-saffron">Refunds</Link>
            </div>

            <div className="flex justify-center gap-4.5 mt-8">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-brown-light/80 dark:text-slate-400 hover:text-saffron hover:shadow-md transition-all">
                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="18" width="18" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-brown-light/80 dark:text-slate-400 hover:text-red-500 hover:shadow-md transition-all">
                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M21.582,6.186c-0.23-0.86-0.908-1.538-1.768-1.768C18.254,4,12,4,12,4S5.746,4,4.186,4.418 c-0.86,0.23-1.538,0.908-1.768,1.768C2,7.746,2,12,2,12s0,4.254,0.418,5.814c0.23,0.86,0.908,1.538,1.768,1.768 C5.746,20,12,20,12,20s6.254,0,7.814-0.418c0.86-0.23,1.538-0.908,1.768-1.768C22,16.254,22,12,22,12S22,7.746,21.582,6.186z M10,15V9l5.2,3L10,15z"></path></svg>
              </a>
            </div>

            <p className="text-[9px] text-brown-light/40 dark:text-slate-500 mt-6 px-4">
              &copy; {new Date().getFullYear()} Hari Pathshala. Handcrafted with devotion 🙏
            </p>
          </motion.footer>
        </React.Fragment>
      );

    case 'upcoming_events': {
      const visibleEvents = events && events.length > 0 ? events : [
        {
          id: 'event_1',
          title: 'Srimad Bhagavad Gita Chanting Session',
          dateTime: 'Every Sunday, 5:00 PM IST',
          location: 'Online Zoom / Hari Pathshala App',
          coverImage: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&w=800&q=80',
          description: 'Learn correct Sanskrit pronunciation, swaras, and inner spiritual meanings of Bhagavad Gita verses.'
        }
      ];
      return (
        <motion.section variants={itemVariants} className="space-y-3">
          <div className="flex justify-between items-end mb-1">
            <h2 className="text-lg font-bold font-sans tracking-tight text-brown-dark dark:text-white flex items-center gap-2">
              <Calendar size={18} className="text-saffron-dark dark:text-saffron-light"/> 
              {section.title || 'Upcoming Spiritual Events'}
            </h2>
          </div>

          <div className="space-y-4">
            {visibleEvents.slice(0, 2).map((event: any) => (
              <div key={event.id} className="bg-white dark:bg-slate-900 rounded-[28px] overflow-hidden border border-orange-100 dark:border-slate-850 shadow-sm flex flex-col">
                <div className="h-40 relative">
                  <SecureImage src={event.coverImage || event.image} alt={event.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent flex items-end p-4">
                    <span className="bg-saffron text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Live Satsang
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <h3 className="font-sans font-extrabold text-sm text-brown-dark dark:text-white leading-snug">
                    {event.title}
                  </h3>
                  
                  <p className="text-[11px] text-brown-light/80 dark:text-slate-400 font-mukta leading-relaxed line-clamp-2">
                    {event.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[10px] text-neutral-500 dark:text-slate-400 font-bold border-t border-orange-50 dark:border-slate-850 pt-3">
                    <div className="flex items-center gap-1.5">
                      <span>⏰</span>
                      <span className="truncate">{event.dateTime || event.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>📍</span>
                      <span className="truncate">{event.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      );
    }

    case 'testimonials': {
      const visibleTestimonials = testimonials && testimonials.length > 0 ? testimonials : [
        {
          id: 't1',
          name: 'Vijay Swami',
          role: 'Daily Sadhak',
          text: 'The daily Panchang and Ram Naam chanting features have completely transformed my daily spiritual routine. Thank you, Hari Pathshala!'
        },
        {
          id: 't2',
          name: 'Aarti Sharma',
          role: 'Gita Student',
          text: 'The AI Guru answers all my complex scriptural queries within seconds. The level of detail and authenticity is unmatched!'
        }
      ];
      return (
        <motion.section variants={itemVariants} className="space-y-3">
          <div className="flex justify-between items-end mb-1">
            <h2 className="text-lg font-bold font-sans tracking-tight text-brown-dark dark:text-white flex items-center gap-2">
              <MessageSquare size={18} className="text-saffron-dark dark:text-saffron-light"/> 
              {section.title || 'What Devotees Say'}
            </h2>
          </div>

          <div className="flex gap-4.5 overflow-x-auto pb-3 snap-x hide-scrollbar">
            {visibleTestimonials.map((t: any) => (
              <div 
                key={t.id} 
                className="min-w-[260px] max-w-[260px] snap-center bg-white dark:bg-slate-900 rounded-[24px] p-5 border border-orange-100/60 dark:border-slate-850 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex text-amber-500 gap-0.5 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={10} fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-[11px] text-brown-light/80 dark:text-slate-300 font-medium italic leading-relaxed font-mukta">
                    "{t.text}"
                  </p>
                </div>

                <div className="flex items-center gap-2.5 mt-4 pt-3 border-t border-orange-50 dark:border-slate-850">
                  <div className="w-7 h-7 rounded-full bg-orange-100/50 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-saffron-dark">
                    {(t.name || 'Bhakt').charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-brown-dark dark:text-white">{t.name || 'Devotee'}</h4>
                    <p className="text-[8px] text-neutral-400 font-semibold">{t.role || 'Sadhak'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      );
    }

    default:
      return null;
  }
};
