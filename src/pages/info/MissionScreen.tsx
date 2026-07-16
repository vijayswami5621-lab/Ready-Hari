import React from "react";
import { motion } from "motion/react";
import { SEO } from "../../components/SEO";
import { ArrowLeft, Target, Heart, BookOpen, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRealtimeCollection } from "../../hooks/useRealtimeCollection";
import { useGoBack } from "../../hooks/useGoBack";

export const MissionScreen = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { data: pages, loading } = useRealtimeCollection<any>("pages");
  const page = pages?.find((p) => p.id === "mission" || p.slug === "mission");

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-900 transition-colors pb-24">
      <SEO
        title={(page?.title || "Our Mission") + " | Hari Pathshala"}
        description="The mission and vision of Hari Pathshala."
      />

      <header className="px-4 py-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-30 shadow-sm flex items-center gap-3 border-b border-orange-50 dark:border-slate-800">
        <button
          onClick={() => goBack()}
          className="p-2 -ml-2 text-brown-dark dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-full transition"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold font-sans text-brown-dark dark:text-white">
          {page?.title || "Our Mission"}
        </h1>
      </header>

      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-8 h-8 border-4 border-saffron border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-brown-light dark:text-slate-400">
              Loading your content...
            </p>
          </div>
        ) : page?.content ? (
          <div
            className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-orange-100 dark:border-slate-700 prose prose-sm dark:prose-invert prose-orange max-w-none"
            dangerouslySetInnerHTML={{ __html: page.content }}
          ></div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-orange-100 dark:border-slate-700 text-center mb-6"
            >
              <div className="w-16 h-16 bg-orange-100 dark:bg-slate-700 text-saffron-dark rounded-full flex items-center justify-center mx-auto mb-4">
                <Target size={32} />
              </div>
              <h2 className="text-2xl font-bold text-brown-dark dark:text-white font-sans mb-3">
                Our Vision
              </h2>
              <p className="text-brown-light dark:text-slate-300 font-mukta leading-relaxed">
                To make the timeless wisdom of Sanatan Dharma accessible to
                everyone, everywhere, fostering a global community of
                spiritually awakened individuals.
              </p>
            </motion.div>

            <div className="space-y-4">
              {[
                {
                  icon: BookOpen,
                  title: "Preserve Knowledge",
                  desc: "Digitizing and sharing ancient scriptures, texts, and teachings for future generations.",
                },
                {
                  icon: Heart,
                  title: "Inspire Devotion",
                  desc: "Providing tools and guidance for daily spiritual practices like Naam Jap and meditation.",
                },
                {
                  icon: Users,
                  title: "Build Community",
                  desc: "Connecting seekers and devotees worldwide to support each other on their spiritual journey.",
                },
              ].map((item, idx) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-orange-100 dark:border-slate-700 flex gap-4"
                >
                  <div className="w-12 h-12 bg-orange-50 dark:bg-slate-700 text-saffron rounded-xl flex items-center justify-center shrink-0">
                    <item.icon size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-brown-dark dark:text-white mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-brown-light dark:text-slate-400 font-mukta">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
