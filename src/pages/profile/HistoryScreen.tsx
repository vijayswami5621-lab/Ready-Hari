import { SecureImage } from "../../components/common/SecureImage";
import React from "react";
import { motion } from "motion/react";
import { SEO } from "../../components/SEO";
import { ArrowLeft, Clock, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGoBack } from "../../hooks/useGoBack";

export const HistoryScreen = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-900 transition-colors pb-24">
      <SEO
        title="Watch History | Hari Pathshala"
        description="Your recently watched videos."
      />

      <header className="px-4 py-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-30 shadow-sm flex items-center gap-3 border-b border-orange-50 dark:border-slate-800">
        <button
          onClick={() => goBack()}
          className="p-2 -ml-2 text-brown-dark dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-full transition"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold font-sans text-brown-dark dark:text-white">
          Watch History
        </h1>
      </header>

      <div className="p-4 space-y-4">
        {[1, 2, 3].map((item, idx) => (
          <motion.div
            key={item}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex gap-3 bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-orange-100 dark:border-slate-700 cursor-pointer group"
          >
            <div className="relative w-32 aspect-video bg-brown-light dark:bg-slate-700 rounded-xl overflow-hidden shrink-0">
              <SecureImage
                src={`https://picsum.photos/seed/hist${item}/400/225`}
                alt="Thumbnail"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/10 transition-all">
                <Play className="text-white/80 fill-white/80" size={16} />
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
                <div
                  className="h-full bg-saffron"
                  style={{ width: `${Math.random() * 80 + 10}%` }}
                ></div>
              </div>
            </div>

            <div className="flex-1 py-1">
              <h3 className="font-bold text-sm text-brown-dark dark:text-white line-clamp-2 leading-tight">
                Bhagavad Gita Discourse {item}
              </h3>
              <p className="text-[10px] text-brown-light dark:text-slate-400 mt-1">
                Swami Ji
              </p>
              <div className="flex items-center gap-1 text-[10px] text-brown-light dark:text-slate-400 mt-2">
                <Clock size={12} /> <span>Watched {item} days ago</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
