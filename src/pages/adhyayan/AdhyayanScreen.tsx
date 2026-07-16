import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Mic, BookOpen, Video, Heart, Music, Sparkles, PlayCircle, ListVideo } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { useRealtimeCollection } from '../../hooks/useRealtimeCollection';
import { EmptyState } from '../../components/EmptyState';
import { SecureImage } from '../../components/common/SecureImage';
import { getVideoThumbnail } from '../../utils/videoUtils';

export const AdhyayanScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const { data: dbCategories, loading: loadingCategories } = useRealtimeCollection<any>('categories');
  const { data: dbVideos } = useRealtimeCollection<any>('videos');

  // fallback data if DB is empty but we don't want to show blank

  const categories = dbCategories.length > 0 ? dbCategories.map(cat => {
     const catVideos = dbVideos.filter(v => 
        (v.categoryId === cat.id || v.category === cat.id) && 
        v.publishStatus !== 'draft' && 
        v.isActive !== false
     ).sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
     
     const count = catVideos.length;
     const coverImage = cat.image || (catVideos.length > 0 ? getVideoThumbnail(catVideos[0]) : null);
     
     return { ...cat, videoCount: count, coverImage };
  }) : [];

  return (
    <div className="flex flex-col min-h-full bg-orange-50 dark:bg-slate-900 transition-colors">
      <SEO title="Adhyayan | Hari Pathshala" description="Learn Bhagavad Gita, Ramcharitmanas, and Sanskrit." />
      {/* PAGE HEADER */}
      <div className="relative pt-12 pb-6 px-6 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl sticky top-0 z-30 shadow-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-saffron/10 to-transparent"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold font-devanagari text-brown-dark dark:text-white mb-1 flex items-center gap-2">
            📖 अध्ययन
          </h1>
          <p className="text-xs font-mukta text-brown-light dark:text-slate-400">Bhagavad Gita • Ramcharitmanas • Sanskrit • Daily Sadhana</p>
          
          {/* SEARCH */}
          <div className="mt-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brown-light/50 dark:text-slate-500" size={20} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Videos, PDF, Shlokas..."
              className="w-full pl-12 pr-12 py-3.5 bg-white dark:bg-slate-800 border border-white/60 dark:border-slate-700 shadow-sm focus:border-saffron focus:ring-2 focus:ring-saffron/20 rounded-2xl outline-none transition-all text-sm font-medium dark:text-white"
            />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-saffron-dark hover:text-saffron transition-colors">
              <Mic size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {loadingCategories ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-saffron border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : categories.length === 0 ? (
          <EmptyState 
            icon={BookOpen}
            title="No Categories Yet"
            message="No videos are available in this category yet. New videos will appear here as soon as they are published."
          />
        ) : (
          <div className="flex flex-col gap-5">
            {categories.map((cat: any, index: number) => (
              <motion.div
                key={cat.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/adhyayan/category/${cat.id}`)}
                className="relative overflow-hidden rounded-2xl aspect-[16/9] shadow-md cursor-pointer group bg-slate-800"
              >
                {cat?.coverImage || "/logo.png" ? (
                  <SecureImage src={cat?.coverImage || "/logo.png"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={cat?.name || "Category"} />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-400 to-saffron-dark opacity-90 group-hover:scale-105 transition-transform duration-500"></div>
                )}
                
                {/* YOUTUBE PLAYLIST STYLE OVERLAY */}
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center border-l border-white/10 z-10 group-hover:bg-saffron/90 transition-colors duration-300">
                  <span className="text-white font-bold text-2xl mb-1">{cat.videoCount || 0}</span>
                  <ListVideo className="text-white/80 group-hover:text-white mb-2" size={24} />
                  <div className="bg-black/40 px-2 py-1 rounded text-[10px] text-white/90 uppercase tracking-wider font-bold">Videos</div>
                  
                  {/* Play All Hover State */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20">
                    <div className="flex flex-col items-center gap-2">
                       <PlayCircle size={32} className="text-white fill-white/20" />
                       <span className="text-xs text-white font-bold uppercase tracking-wider">Play All</span>
                    </div>
                  </div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none z-0"></div>
                
                <div className="absolute bottom-0 left-0 right-1/3 p-4 z-10 flex flex-col justify-end">
                  <h3 className="text-white font-bold text-xl font-sans leading-tight shadow-black drop-shadow-md mb-1">{cat?.name || "Category"}</h3>
                  {cat.description && (
                    <p className="text-white/80 text-xs line-clamp-1">{cat.description}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
