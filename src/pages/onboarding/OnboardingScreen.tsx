import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../../store/useAppStore';
import { BookOpen, Video, Heart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SEO } from '../../components/SEO';

const onboardingData = [
  {
    id: 1,
    title: "Welcome to Hari Pathshala",
    description: "Bhagavad Gita • Ramcharitmanas • Sanskrit • Bhakti • Daily Sadhana",
    icon: BookOpen,
    sanskrit: "धर्मो रक्षति रक्षितः",
    translation: "Dharma protects those who protect it."
  },
  {
    id: 2,
    title: "Daily Learning",
    description: "Videos • AI Guru • Store • Quotes • Meditation",
    icon: Video,
    sanskrit: "योगः कर्मसु कौशलम्",
    translation: "Yoga is excellence and mindfulness in actions."
  },
  {
    id: 3,
    title: "Start Spiritual Journey",
    description: "Join us and elevate your spiritual growth.",
    icon: Heart,
    sanskrit: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन",
    translation: "You have a right to perform your duty, but not to its fruits."
  }
];

export const OnboardingScreen = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { completeOnboarding } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      completeOnboarding();
      navigate('/auth/login', { state: { from } });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 transition-colors duration-300 relative overflow-hidden">
      <SEO title="Welcome | Hari Pathshala" description="Start your spiritual journey with Hari Pathshala." />
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-orange-100 dark:bg-orange-900/20 blur-3xl opacity-60"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-yellow-100 dark:bg-yellow-900/20 blur-3xl opacity-60"></div>

      <div className="flex-1 flex items-center justify-center relative z-10 px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center"
          >
            <div className="w-48 h-48 bg-gradient-to-br from-orange-200 to-yellow-100 rounded-full flex items-center justify-center mb-6 shadow-xl border-4 border-white">
              {React.createElement(onboardingData[currentIndex].icon, { size: 80, className: "text-[#FF9933]" })}
            </div>

            {/* Premium Sanskrit Verse */}
            <div className="mb-6 px-5 py-3 bg-orange-50/60 dark:bg-slate-800/40 rounded-2xl border border-orange-100/30 dark:border-slate-800 max-w-xs">
              <p className="text-base font-black font-devanagari text-[#E65100] dark:text-orange-400 tracking-wide select-none">
                " {onboardingData[currentIndex].sanskrit} "
              </p>
              <p className="text-[11px] font-sans font-medium text-[#616161] dark:text-slate-400 leading-normal mt-1.5">
                {onboardingData[currentIndex].translation}
              </p>
            </div>

            <h2 className="text-2xl font-black font-sans text-[#212121] dark:text-white mb-2">
              {onboardingData[currentIndex].title}
            </h2>
            <p className="text-sm text-[#616161] dark:text-slate-300 font-sans max-w-xs leading-relaxed">
              {onboardingData[currentIndex].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="pb-12 px-8 flex flex-col items-center relative z-10">
        <div className="flex space-x-2 mb-8">
          {onboardingData.map((_, idx) => (
            <div
              key={idx}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                currentIndex === idx ? 'w-8 bg-[#FF9933]' : 'w-2.5 bg-orange-200'
              }`}
            ></div>
          ))}
        </div>
        <button
          onClick={handleNext}
          className="w-full max-w-sm py-4 bg-gradient-to-r from-[#FF9933] to-[#CC7A29] text-white rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform"
        >
          {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
        </button>
      </div>
    </div>
  );
};
