import React from "react";
import { motion } from "motion/react";
import { SEO } from "../../components/SEO";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRealtimeCollection } from "../../hooks/useRealtimeCollection";
import { SecureImage } from "../../components/common/SecureImage";
import { useGoBack } from "../../hooks/useGoBack";

export const FounderScreen = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { data: dbFounder, loading } = useRealtimeCollection<any>("founder");

  const founder =
    dbFounder.length > 0
      ? dbFounder[0]
      : {
          name: "Swami Ji",
          title: "Founder, Hari Pathshala",
          image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Swami",
          bio: "Dedicated to spreading the divine wisdom of Sanatan Dharma.",
          longBio:
            "Swami Ji has spent decades studying and teaching the core texts of Sanatan Dharma. His vision is to make spiritual education free, accessible, and life-changing for everyone.",
        };

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-900 transition-colors pb-24">
      <SEO
        title="Our Founder | Hari Pathshala"
        description="Our Founder page for Hari Pathshala."
      />

      <div className="px-6 pt-12 pb-6 flex items-center gap-4">
        <button
          onClick={() => goBack()}
          className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-brown-dark dark:text-white shadow-sm border border-orange-100 dark:border-slate-700"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold font-devanagari text-brown-dark dark:text-white">
          Our Founder
        </h1>
      </div>

      <div className="px-6 pb-6">
        {loading && !dbFounder.length ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-saffron border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-brown-light dark:text-slate-400">
              Loading your content...
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm border border-orange-100 dark:border-slate-700"
          >
            <div className="w-full aspect-[4/3] bg-orange-100 dark:bg-slate-700 relative">
              <SecureImage
                src={founder?.image || "/logo.png"}
                alt={founder?.name || "Founder"}
                className="w-full h-full object-cover"
                cacheBuster={
                  founder.updatedAt?.toMillis
                    ? founder.updatedAt.toMillis()
                    : Date.now()
                }
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <h2 className="text-2xl font-bold text-white font-sans">
                  {founder?.name || "Founder"}
                </h2>
                <p className="text-saffron-light font-bold text-sm mt-1">
                  {founder.title || "Founder, Hari Pathshala"}
                </p>
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-bold text-brown-dark dark:text-white mb-3 flex items-center gap-2">
                <span className="w-6 h-px bg-saffron-dark inline-block"></span>{" "}
                Life & Vision
              </h3>
              <p className="text-sm text-brown-light dark:text-slate-300 font-mukta leading-relaxed whitespace-pre-line">
                {founder.longBio || founder.bio}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
