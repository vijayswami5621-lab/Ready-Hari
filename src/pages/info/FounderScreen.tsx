import React from "react";
import { motion } from "motion/react";
import { SEO } from "../../components/SEO";
import { ArrowLeft, Globe, Instagram } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import { SecureImage } from "../../components/common/SecureImage";
import { useGoBack } from "../../hooks/useGoBack";

export const FounderScreen = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { officialDetails } = useAppSettings();

  const founder = {
    name: officialDetails?.founderName || "Ajay Swami (Amar Das)",
    title: officialDetails?.founderDesignation || "Founder & CEO, Hari Pathshala",
    image: officialDetails?.founderPhoto || "/founder.png",
    bio: officialDetails?.founderMessage || "Dedicated to making the timeless wisdom of Sanatan Dharma accessible through modern technology while preserving the authenticity of our sacred scriptures.",
  };

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-900 transition-colors pb-24">
      <SEO
        title={`${founder.name} | Our Founder`}
        description={`Learn more about ${founder.name}, the visionary founder of Hari Pathshala.`}
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm border border-orange-100 dark:border-slate-700"
        >
          <div className="w-full aspect-[4/3] bg-orange-100 dark:bg-slate-700 relative">
            <SecureImage
              src={founder.image}
              alt={founder.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>
            <div className="absolute bottom-6 left-6 right-6">
              <h2 className="text-2xl font-bold text-white font-sans">
                {founder.name}
              </h2>
              <p className="text-saffron-light font-bold text-sm mt-1">
                {founder.title}
              </p>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <h3 className="font-bold text-brown-dark dark:text-white mb-3 flex items-center gap-2">
                <span className="w-6 h-px bg-saffron-dark inline-block"></span>{" "}
                Message & Vision
              </h3>
              <p className="text-sm text-brown-light dark:text-slate-300 font-mukta leading-relaxed whitespace-pre-line">
                {founder.bio}
              </p>
            </div>

            {officialDetails && (
              <div className="pt-4 border-t border-orange-100 dark:border-slate-700 flex flex-col gap-3">
                <h4 className="text-xs font-bold text-neutral-400 dark:text-slate-500 uppercase tracking-wider">
                  Connect with our founder & organization
                </h4>
                <div className="flex flex-wrap gap-4">
                  {officialDetails.website && (
                    <a
                      href={officialDetails.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-saffron hover:text-saffron-dark font-medium transition"
                    >
                      <Globe size={16} />
                      Website
                    </a>
                  )}
                  {officialDetails.instagram && (
                    <a
                      href={officialDetails.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-saffron hover:text-saffron-dark font-medium transition"
                    >
                      <Instagram size={16} />
                      Instagram
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
