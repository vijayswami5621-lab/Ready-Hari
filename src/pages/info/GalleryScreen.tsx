import { SecureImage } from "../../components/common/SecureImage";
import React from "react";
import { motion } from "motion/react";
import { SEO } from "../../components/SEO";
import { ArrowLeft, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRealtimeCollection } from "../../hooks/useRealtimeCollection";
import { useGoBack } from "../../hooks/useGoBack";

export const GalleryScreen = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { data: dbGallery, loading } = useRealtimeCollection<any>("gallery");

  const gallery = dbGallery;

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-900 transition-colors pb-24">
      <SEO
        title="Gallery | Hari Pathshala"
        description="Glimpses of Hari Pathshala."
      />

      <header className="px-4 py-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-30 shadow-sm flex items-center gap-3 border-b border-orange-50 dark:border-slate-800">
        <button
          onClick={() => goBack()}
          className="p-2 -ml-2 text-brown-dark dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-full transition"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold font-sans text-brown-dark dark:text-white">
          Gallery
        </h1>
      </header>

      <div className="p-4 grid grid-cols-2 gap-3">
        {gallery.map((item: any, idx: number) => (
          <motion.div
            key={item.id || idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="aspect-square bg-brown-light dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm relative group cursor-pointer"
          >
            <SecureImage
              src={
                item.url ||
                item.image ||
                `https://picsum.photos/seed/gallery${idx}/400/400`
              }
              alt={item.title || `Gallery ${idx}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ImageIcon
                className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md"
                size={24}
              />
            </div>
            {item.title && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 text-white text-[10px] font-bold text-center opacity-0 group-hover:opacity-100 transition-opacity">
                {item.title}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
