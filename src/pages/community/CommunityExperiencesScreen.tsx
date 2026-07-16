import { SecureImage } from '../../components/common/SecureImage';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SEO } from '../../components/SEO';
import { ArrowLeft, MessageSquare, ThumbsUp, User, X, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRealtimeCollection } from '../../hooks/useRealtimeCollection';
import { useAuthStore } from '../../store/useAuthStore';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useGoBack } from "../../hooks/useGoBack";

export const CommunityExperiencesScreen = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { user, userData } = useAuthStore();
  const { data: allExperiences, loading } = useRealtimeCollection<any>('experiences');
  const [showModal, setShowModal] = useState(false);
  const [newExpText, setNewExpText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Only show approved experiences
  const experiences = allExperiences
    .filter(exp => exp.status === 'approved' || exp.userId === user?.uid)
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  const handlePostExperience = async () => {
    if (!user) {
      alert("Please login to share your experience.");
      return;
    }
    if (!newExpText.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'experiences'), {
        userId: user.uid,
        name: user.displayName || userData?.name || 'Devotee',
        avatar: user.photoURL || userData?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName || 'Devotee'}`,
        text: newExpText.trim(),
        likes: 0,
        replies: 0,
        status: 'approved',
        createdAt: serverTimestamp()
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setShowModal(false);
        setNewExpText('');
      }, 2000);
    } catch (e) {
      console.error(e);
      alert('Failed to post experience.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-900 transition-colors pb-20">
      <SEO title="Community Experiences | Hari Pathshala" description="Read inspiring spiritual experiences from our community." />
      
      <header className="pt-12 pb-4 px-6 sticky top-0 z-20 flex justify-between items-center bg-orange-50/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={() => goBack()} className="p-2 bg-white dark:bg-slate-800 rounded-full text-brown-dark dark:text-white shadow-sm border border-orange-100 dark:border-slate-700">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold font-sans text-brown-dark dark:text-white">Experiences</h1>
        </div>
      </header>

      <div className="px-6 space-y-4">
        {/* Write experience CTA */}
        <div 
          onClick={() => setShowModal(true)}
          className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-orange-100 dark:border-slate-700 flex items-center gap-4 cursor-pointer hover:border-saffron-dark transition-colors"
        >
          <div className="w-10 h-10 bg-orange-100 dark:bg-slate-700 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
            <SecureImage src={user?.photoURL || userData?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.displayName || 'Bhakt'}`} alt="You" className="w-full h-full rounded-full object-cover" />
          </div>
          <p className="text-sm text-brown-light dark:text-slate-400 font-medium">Share your spiritual experience...</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-4 border-saffron border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Experience Cards */}
        {experiences.map(exp => (
          <motion.div 
            key={exp.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-orange-100 dark:border-slate-700"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <SecureImage src={exp?.avatar || "/logo.png"} alt={exp?.name || "User"} className="w-10 h-10 rounded-full object-cover shrink-0 bg-orange-100 dark:bg-slate-700" />
                <div>
                  <h3 className="font-bold text-brown-dark dark:text-white text-sm">{exp?.name || "User"}</h3>
                  <p className="text-[10px] text-brown-light dark:text-slate-400">
                    {exp.createdAt?.seconds ? new Date(exp.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                  </p>
                </div>
              </div>
              {exp.status === 'pending' && (
                <span className="text-[10px] font-bold text-orange-500 bg-orange-50 dark:bg-slate-700 px-2 py-1 rounded-md">Pending Approval</span>
              )}
            </div>
            
            <p className="text-sm text-brown-dark dark:text-slate-300 leading-relaxed font-mukta mb-4 whitespace-pre-line">
              {exp.text}
            </p>
            
            <div className="flex items-center gap-6 border-t border-orange-50 dark:border-slate-700 pt-3">
              <button className="flex items-center gap-1.5 text-brown-light dark:text-slate-400 hover:text-saffron-dark transition-colors">
                <ThumbsUp size={16} />
                <span className="text-xs font-medium">{exp.likes || 0}</span>
              </button>
              <button className="flex items-center gap-1.5 text-brown-light dark:text-slate-400 hover:text-saffron-dark transition-colors">
                <MessageSquare size={16} />
                <span className="text-xs font-medium">{exp.replies || 0}</span>
              </button>
            </div>
          </motion.div>
        ))}

        {!loading && experiences.length === 0 && (
          <div className="text-center py-10 text-brown-light dark:text-slate-400">
            <p>No experiences shared yet. Be the first!</p>
          </div>
        )}
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative"
            >
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-2 bg-orange-50 dark:bg-slate-700 text-brown-dark dark:text-white rounded-full hover:bg-orange-100 transition">
                <X size={20} />
              </button>
              <h2 className="text-xl font-bold font-sans text-brown-dark dark:text-white mb-4">Share Experience</h2>
              
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <CheckCircle size={48} className="text-green-500 mb-4" />
                  <p className="font-bold text-brown-dark dark:text-white">Experience Submitted</p>
                  <p className="text-sm text-brown-light dark:text-slate-400 mt-2 text-center">Your experience has been shared.</p>
                </div>
              ) : (
                <>
                  <textarea 
                    value={newExpText}
                    onChange={(e) => setNewExpText(e.target.value)}
                    placeholder="Describe how Hari Pathshala has impacted your spiritual journey..."
                    className="w-full bg-orange-50 dark:bg-slate-700/50 border-none outline-none rounded-2xl p-4 text-sm font-medium text-brown-dark dark:text-white resize-none h-32 focus:ring-2 focus:ring-saffron"
                    autoFocus
                  />
                  <button 
                    onClick={handlePostExperience}
                    disabled={!newExpText.trim() || submitting}
                    className="w-full mt-4 py-3 bg-gradient-to-r from-saffron to-saffron-dark text-white font-bold rounded-xl shadow-md disabled:opacity-50 active:scale-95 transition-transform flex justify-center items-center h-12"
                  >
                    {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Submit for Approval'}
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
