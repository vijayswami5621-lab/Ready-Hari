import { SecureImage } from '../../components/common/SecureImage';
import React from 'react';
import { motion } from 'motion/react';
import { SEO } from '../../components/SEO';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRealtimeCollection } from '../../hooks/useRealtimeCollection';
import { useGoBack } from "../../hooks/useGoBack";

export const BlogScreen = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { data: blogs, loading } = useRealtimeCollection<any>('blogs');

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-900 transition-colors pb-24">
      <SEO title="Spiritual Blog | Hari Pathshala" description="Read insightful spiritual articles and blogs." />
      
      <header className="px-4 py-4 sticky top-0 z-30 shadow-sm flex items-center justify-between bg-white dark:bg-slate-900 border-b border-orange-50 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button onClick={() => goBack()} className="p-2 -ml-2 text-brown-dark dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-full transition">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold font-sans text-brown-dark dark:text-white">Spiritual Blog</h1>
        </div>
      </header>

      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-saffron border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : blogs.length === 0 ? (
           <div className="text-center py-20 text-brown-light dark:text-slate-400">
             <p>No blog posts published yet.</p>
           </div>
        ) : (
          <div className="space-y-6">
            {blogs.map((blog, idx) => (
              <motion.div 
                key={blog.id || idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-orange-100 dark:border-slate-700 hover:shadow-md transition-shadow cursor-pointer"
              >
                {blog.image && (
                  <div className="w-full aspect-video bg-orange-100 dark:bg-slate-700">
                    <SecureImage src={blog.image} alt={blog.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center gap-4 text-xs font-medium text-brown-light dark:text-slate-400 mb-3">
                    <span className="flex items-center gap-1.5"><Calendar size={14} /> {blog.date || 'Recent'}</span>
                    <span className="flex items-center gap-1.5"><User size={14} /> {blog.author || 'Admin'}</span>
                  </div>
                  <h2 className="text-lg font-bold text-brown-dark dark:text-white mb-2 font-sans">{blog.title}</h2>
                  <p className="text-sm text-brown-light dark:text-slate-300 font-mukta line-clamp-3 leading-relaxed">
                    {blog.excerpt || blog.content}
                  </p>
                  <button className="mt-4 text-saffron-dark font-bold text-sm hover:underline">Read Full Article &rarr;</button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
