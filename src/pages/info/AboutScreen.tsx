import React from "react";
import { motion } from "motion/react";
import { SEO } from "../../components/SEO";
import { ArrowLeft, Target, Eye, BookOpen, Users, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRealtimeCollection } from "../../hooks/useRealtimeCollection";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import { SecureImage } from "../../components/common/SecureImage";
import { useGoBack } from "../../hooks/useGoBack";

export const AboutScreen = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { settings } = useAppSettings();
  const { data: pages, loading } = useRealtimeCollection<any>("pages");
  const aboutPage = pages?.find((p) => p.id === "about" || p.slug === "about");

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-900 transition-colors">
      <SEO
        title={(aboutPage?.title || "About Us") + " | Hari Pathshala"}
        description="Learn about the mission and vision of Hari Pathshala."
      />

      <header className="pt-12 pb-6 px-6 bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-20 flex items-center">
        <button
          onClick={() => goBack()}
          className="mr-4 p-2 bg-orange-50 dark:bg-slate-700 rounded-full text-brown-dark dark:text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold font-sans text-brown-dark dark:text-white">
          {aboutPage?.title || "About Us"}
        </h1>
      </header>

      <div className="p-6 space-y-8 pb-20">
        <div className="text-center flex flex-col items-center">
          <div className="w-24 h-24 aspect-square bg-white rounded-full mx-auto mb-4 flex items-center justify-center p-2 shadow-md overflow-hidden shrink-0">
            {settings?.appLogo ? (
              <SecureImage
                src={settings.appLogo}
                alt="Hari Pathshala"
                imageClassName="object-contain"
                className="w-full h-full"
              />
            ) : (
              <BookOpen size={40} className="text-saffron-dark" />
            )}
          </div>
          <h2 className="text-2xl font-bold font-devanagari text-brown-dark dark:text-white mb-2">
            हरि पाठशाला
          </h2>
          <p className="text-brown-light dark:text-slate-400 font-mukta">
            Your Gateway to Spiritual Enlightenment
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-8 h-8 border-4 border-saffron border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-brown-light dark:text-slate-400">
              Loading your content...
            </p>
          </div>
        ) : aboutPage?.content ? (
          <div
            className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-orange-100 dark:border-slate-700 text-sm text-brown-dark dark:text-slate-300 leading-relaxed font-mukta prose dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: aboutPage.content }}
          ></div>
        ) : (
          <>
            <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-orange-100 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <Target className="text-saffron-dark" size={24} />
                <h3 className="text-lg font-bold text-brown-dark dark:text-white">
                  Our Mission
                </h3>
              </div>
              <p className="text-sm text-brown-dark dark:text-slate-300 leading-relaxed font-mukta">
                To provide authentic, accessible, and free spiritual education
                to every seeker worldwide. We strive to preserve and promote the
                eternal wisdom of Sanatan Dharma, making scriptures like
                Bhagavad Gita and Ramcharitmanas understandable for the modern
                generation.
              </p>
            </section>

            <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-orange-100 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="text-saffron-dark" size={24} />
                <h3 className="text-lg font-bold text-brown-dark dark:text-white">
                  Our Vision
                </h3>
              </div>
              <p className="text-sm text-brown-dark dark:text-slate-300 leading-relaxed font-mukta">
                A world where individuals live with inner peace, purpose, and
                spiritual awareness, guided by the timeless principles of Bhakti
                and Dharma. We envision a global community united by divine love
                and knowledge.
              </p>
            </section>

            <section className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-orange-100 dark:border-slate-700 text-center">
                <Users className="text-saffron-dark mx-auto mb-3" size={28} />
                <h4 className="font-bold text-brown-dark dark:text-white mb-1">
                  Community
                </h4>
                <p className="text-xs text-brown-light dark:text-slate-400">
                  Join thousands of daily seekers.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-orange-100 dark:border-slate-700 text-center">
                <Heart className="text-saffron-dark mx-auto mb-3" size={28} />
                <h4 className="font-bold text-brown-dark dark:text-white mb-1">
                  Free For All
                </h4>
                <p className="text-xs text-brown-light dark:text-slate-400">
                  Knowledge should have no price tag.
                </p>
              </div>
            </section>

            <section className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-orange-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-brown-dark dark:text-white mb-4">
                The Story Behind Hari Pathshala
              </h3>
              <p className="text-sm text-brown-dark dark:text-slate-300 leading-relaxed font-mukta mb-4">
                Born from a deep desire to reconnect people with their spiritual
                roots, Hari Pathshala started as a small initiative to share
                daily verses from the Bhagavad Gita. Over time, it has evolved
                into a comprehensive digital ashram.
              </p>
              <p className="text-sm text-brown-dark dark:text-slate-300 leading-relaxed font-mukta">
                Today, we offer categorized Adhyayan (study) modules, daily
                Panchang updates, a curated devotional store, and a vibrant
                community of practitioners—all designed to support your daily
                Sadhana (spiritual practice).
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  );
};
