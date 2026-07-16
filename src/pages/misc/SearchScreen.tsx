import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { SEO } from '../../components/SEO';
import { ArrowLeft, Search, Video, ShoppingBag, Calendar, Quote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRealtimeCollection } from '../../hooks/useRealtimeCollection';
import { useGoBack } from "../../hooks/useGoBack";

export const SearchScreen = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [query, setQuery] = useState('');

  const { data: quotes } = useRealtimeCollection<any>('quotes');
  const { data: videos } = useRealtimeCollection<any>('videos');
  const { data: products } = useRealtimeCollection<any>('products');
  const { data: events } = useRealtimeCollection<any>('events');

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    const results: any[] = [];

    quotes.forEach(q => {
      if (q.text?.toLowerCase().includes(lowerQuery) || q.meaning?.toLowerCase().includes(lowerQuery)) {
        results.push({ type: 'quote', data: q, icon: Quote, color: 'text-purple-500' });
      }
    });

    videos.forEach(v => {
      if (v.title?.toLowerCase().includes(lowerQuery) || v.description?.toLowerCase().includes(lowerQuery)) {
        results.push({ type: 'video', data: v, icon: Video, color: 'text-red-500' });
      }
    });

    products.forEach(p => {
      if (p.name?.toLowerCase().includes(lowerQuery) || p.description?.toLowerCase().includes(lowerQuery)) {
        results.push({ type: 'product', data: p, icon: ShoppingBag, color: 'text-orange-500' });
      }
    });

    events.forEach(e => {
      if (e.title?.toLowerCase().includes(lowerQuery) || e.description?.toLowerCase().includes(lowerQuery)) {
        results.push({ type: 'event', data: e, icon: Calendar, color: 'text-blue-500' });
      }
    });

    return results;
  }, [query, quotes, videos, products, events]);

  const handleResultClick = (result: any) => {
    if (result.type === 'video') {
      navigate(`/adhyayan/video/${result.data.id}`);
    } else if (result.type === 'product') {
      navigate(`/store/product/${result.data.id}`);
    } else if (result.type === 'event') {
      navigate(`/events`);
    } else if (result.type === 'quote') {
      navigate(`/`);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-900 transition-colors pb-24">
      <SEO title="Global Search | Hari Pathshala" description="Search across all spiritual content." />
      
      <header className="px-4 py-4 sticky top-0 z-30 shadow-sm flex items-center justify-between bg-white dark:bg-slate-900 border-b border-orange-50 dark:border-slate-800">
        <div className="flex items-center gap-3 w-full">
          <button onClick={() => goBack()} className="p-2 -ml-2 text-brown-dark dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-full transition">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 relative">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search quotes, videos, products..."
              className="w-full bg-orange-50 dark:bg-slate-800 border-none outline-none rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-brown-dark dark:text-white"
              autoFocus
            />
            <Search size={16} className="absolute left-3 top-3 text-brown-light dark:text-slate-400" />
          </div>
        </div>
      </header>

      <div className="p-6">
        {!query.trim() ? (
          <div className="text-center text-brown-light dark:text-slate-400 mt-10">
            <Search size={40} className="mx-auto mb-4 opacity-50" />
            <p>Start typing to search across Hari Pathshala</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center text-brown-light dark:text-slate-400 mt-10">
            <p>No results found for "{query}"</p>
          </div>
        ) : (
          <div className="space-y-3">
            {searchResults.map((result, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => handleResultClick(result)}
                className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-orange-100 dark:border-slate-700 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className={`p-3 rounded-xl bg-orange-50 dark:bg-slate-700/50 ${result.color}`}>
                  <result.icon size={20} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-bold text-brown-dark dark:text-white text-sm truncate">
                    {result.type === 'quote' ? result.data.text : result.data.title || result.data?.name || "Result"}
                  </h3>
                  <p className="text-xs text-brown-light dark:text-slate-400 truncate mt-1">
                    {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
