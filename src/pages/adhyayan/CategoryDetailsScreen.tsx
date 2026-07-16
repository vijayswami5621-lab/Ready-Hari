import { SecureImage } from '../../components/common/SecureImage';
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Play, Clock, Eye, Download, FileText, Video as VideoIcon, ListVideo, Shuffle } from 'lucide-react';
import { motion } from 'motion/react';
import { useRealtimeCollection } from '../../hooks/useRealtimeCollection';
import { EmptyState } from '../../components/EmptyState';
import { getVideoThumbnail } from '../../utils/videoUtils';
import { autoFetchVideoMetadata } from '../../utils/metadataFetcher';
import { useGoBack } from '../../hooks/useGoBack';
import { useShareContent } from '../../hooks/useShareContent';
import { NotFoundScreen } from "../misc/NotFoundScreen";

export const CategoryDetailsScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { shareContent } = useShareContent();
  const [sortBy, setSortBy] = useState('Newest');

  const { data: dbCategories, loading: catLoading } = useRealtimeCollection<any>('categories');
  const { data: dbVideos, loading } = useRealtimeCollection<any>('videos');

  const category = dbCategories.find(c => c.id === id);


  
  // Filter videos for this category
  const categoryVideos = dbVideos.filter(v => 
    (v.categoryId === id || v.category === id) && 
    v.publishStatus !== 'draft' && 
    v.isActive !== false
  );

  useEffect(() => {
    // Automatically trigger metadata fetch for missing durations
    categoryVideos.forEach(video => {
      if (!video.duration || video.duration === '0:00') {
        autoFetchVideoMetadata(video);
      }
    });
  }, [categoryVideos]);

  const coverImage = category?.image || (categoryVideos.length > 0 ? (categoryVideos[0].thumbnailUrl || getVideoThumbnail(categoryVideos[0])) : `https://picsum.photos/seed/${id}/800/400`);

  // Calculate total duration
  const totalDurationStr = useMemo(() => {
    let totalSeconds = 0;
    categoryVideos.forEach(v => {
      if (v.duration) {
        const parts = v.duration.split(':').map(Number);
        if (parts.length === 3) totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
        else if (parts.length === 2) totalSeconds += parts[0] * 60 + parts[1];
      }
    });
    if (totalSeconds === 0) return '0 Minutes';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) return `${h} Hours ${m} Minutes`;
    return `${m} Minutes`;
  }, [categoryVideos]);

  // Sorting logic
  const sortedVideos = [...categoryVideos].sort((a, b) => {
    if (sortBy === 'Newest') return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    if (sortBy === 'Oldest') return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
    if (sortBy === 'Popular') return (b.views || 0) - (a.views || 0);
    if (sortBy === 'A-Z') return (a.title || '').localeCompare(b.title || '');
    return 0;
  });

  if (catLoading) {
    return (
      <div className="min-h-screen bg-orange-50 dark:bg-slate-900 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-saffron border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!category) {
    return <NotFoundScreen />;
  }





  return (
    <div className="flex flex-col h-[100dvh] bg-orange-50 dark:bg-slate-900 transition-colors overflow-hidden">
      {/* HEADER BANNER */}
      <div className="relative h-64 shrink-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-orange-50 dark:to-slate-900 z-10 pointer-events-none"></div>
        <SecureImage 
          src={coverImage} 
          alt={category?.name || "Category"} 
          className="w-full h-full object-cover"
        />
        
        {/* Navigation & Content Overlay */}
        <div className="absolute inset-0 z-20 flex flex-col p-6">
          <button 
            onClick={() => goBack()}
            className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          
          <button 
            onClick={() => shareContent({ title: category?.name, urlPath: '/category/' + category?.id })}
            className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors ml-auto -mt-10"
          >
            <Share2 size={20} />
          </button>
          
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-auto">
            <div className="flex items-center gap-3 text-white/90 text-xs font-medium mb-2">
              <span className="bg-white/20 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1"><ListVideo size={14} /> {categoryVideos.length} Videos</span>
              <span className="bg-white/20 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1"><Clock size={14} /> {totalDurationStr}</span>
            </div>
            <h1 className="text-3xl font-bold font-sans text-white drop-shadow-md">{category?.name || "Category"}</h1>
            <p className="text-white/80 text-sm mt-1 line-clamp-2">{category?.description}</p>
            
            {categoryVideos.length > 0 && (
              <div className="flex gap-3 mt-4">
                <button 
                  onClick={() => navigate(`/adhyayan/video/${categoryVideos[0].id}`)}
                  className="flex-1 bg-white text-black py-2.5 rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition"
                >
                  <Play size={16} className="fill-black" /> Play All
                </button>
                <button 
                  onClick={() => navigate(`/adhyayan/video/${categoryVideos[Math.floor(Math.random() * categoryVideos.length)].id}`)}
                  className="flex-1 bg-white/20 backdrop-blur-md text-white py-2.5 rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/30 transition"
                >
                  <Shuffle size={16} /> Shuffle
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* SORT & FILTER OPTIONS */}
      <div className="px-6 py-3 bg-white dark:bg-slate-800 border-b border-orange-100 dark:border-slate-700 flex items-center gap-2 overflow-x-auto shrink-0 hide-scrollbar">
        {['Newest', 'Oldest', 'Popular', 'A-Z'].map((sort) => (
          <button 
            key={sort}
            onClick={() => setSortBy(sort)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              sortBy === sort ? 'bg-saffron text-white shadow-sm' : 'bg-orange-50 dark:bg-slate-700 text-brown-light dark:text-slate-300 hover:bg-orange-100 dark:hover:bg-slate-600'
            }`}
          >
            {sort}
          </button>
        ))}
      </div>

      {/* VIDEOS LIST */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-24">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-saffron border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : sortedVideos.length === 0 ? (
          <EmptyState 
            icon={VideoIcon}
            title="No Videos Found"
            message="There are currently no videos available in this category."
          />
        ) : (
          sortedVideos.map((video: any, index: number) => (
            <motion.div 
              key={video.id || index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onClick={() => navigate(`/adhyayan/video/${video.id || index}`)}
              className="bg-white dark:bg-slate-800 rounded-2xl flex gap-3 p-3 cursor-pointer shadow-sm border border-orange-100 dark:border-slate-700 hover:shadow-md transition-all group"
            >
              <div className="relative w-36 aspect-video bg-brown-light dark:bg-slate-700 rounded-xl overflow-hidden shrink-0">
                <SecureImage src={getVideoThumbnail(video)} className="w-full h-full object-cover" alt={video.title} />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/10 transition-all">
                  <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center pl-0.5 shadow-md">
                    <Play className="text-saffron-dark fill-saffron-dark" size={14} />
                  </div>
                </div>
                <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                  {video.duration || '0:00'}
                </div>
              </div>
              
              <div className="flex flex-col justify-between py-1 flex-1">
                <div>
                  <h3 className="font-bold text-sm text-brown-dark dark:text-white leading-tight line-clamp-2">{video.title}</h3>
                  <p className="text-[10px] text-brown-light dark:text-slate-400 mt-1">{video.speaker || 'Swami Ji'}</p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3 text-[10px] text-brown-light dark:text-slate-400">
                    <span className="flex items-center gap-1"><Eye size={12} /> {video.views || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {video.pdfUrl && <span className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-1 rounded-md" title="PDF Notes available"><FileText size={12} /></span>}
                    {video.allowDownload && <span className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-1 rounded-md" title="Download allowed"><Download size={12} /></span>}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
