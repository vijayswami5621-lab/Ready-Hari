import { SecureImage } from '../../components/common/SecureImage';
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { SEO } from '../../components/SEO';
import { ArrowLeft, MessageCircle, Heart, User, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRealtimeCollection } from '../../hooks/useRealtimeCollection';
import { useAuthStore } from '../../store/useAuthStore';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useGoBack } from "../../hooks/useGoBack";

export const CommunityVoiceScreen = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { user, userData } = useAuthStore();
  const { data: allVoices, loading } = useRealtimeCollection<any>('community_posts');
  const [newPostText, setNewPostText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Only show approved posts or posts by current user
  const voices = allVoices
    .filter(v => v.status === 'approved' || v.userId === user?.uid)
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  const handlePost = async () => {
    if (!user) {
      alert("Please login to post.");
      return;
    }
    if (!newPostText.trim()) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'community_posts'), {
        userId: user.uid,
        name: user.displayName || userData?.name || 'Devotee',
        avatar: user.photoURL || userData?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName || 'Devotee'}`,
        text: newPostText.trim(),
        likes: 0,
        comments: 0,
        status: 'approved',
        createdAt: serverTimestamp()
      });
      setNewPostText('');
      alert('Post submitted!');
    } catch (e) {
      console.error(e);
      alert('Failed to submit post.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-900 transition-colors pb-20">
      <SEO title="Community Voice | Hari Pathshala" description="Community Social Wall" />
      
      <header className="pt-12 pb-4 px-6 sticky top-0 z-20 flex justify-between items-center bg-orange-50/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={() => goBack()} className="p-2 bg-white dark:bg-slate-800 rounded-full text-brown-dark dark:text-white shadow-sm border border-orange-100 dark:border-slate-700">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold font-sans text-brown-dark dark:text-white">Community Voice</h1>
        </div>
      </header>

      <div className="px-6 space-y-4">
        {/* Write post CTA */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-orange-100 dark:border-slate-700 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 dark:bg-slate-700 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
              {user ? (
                <SecureImage src={user.photoURL || userData?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName}`} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={16} className="text-saffron-dark" />
              )}
            </div>
            <input 
              type="text" 
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full bg-transparent text-sm focus:outline-none dark:text-white"
            />
          </div>
          <div className="flex justify-end">
            <button 
              onClick={handlePost}
              disabled={!newPostText.trim() || submitting}
              className="bg-saffron-dark text-white px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Send size={14} />} Post
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-4 border-saffron border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Voice Cards */}
        {voices.map(voice => (
          <motion.div 
            key={voice.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-orange-100 dark:border-slate-700"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <SecureImage src={voice?.avatar || "/logo.png"} alt={voice?.name || "User"} className="w-10 h-10 rounded-full object-cover shrink-0 bg-orange-100 dark:bg-slate-700" />
                <div>
                  <h3 className="font-bold text-brown-dark dark:text-white text-sm">{voice?.name || "User"}</h3>
                  <p className="text-[10px] text-brown-light dark:text-slate-400">
                    {voice.createdAt?.seconds ? new Date(voice.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                  </p>
                </div>
              </div>
              {voice.status === 'pending' && (
                <span className="text-[10px] font-bold text-orange-500 bg-orange-50 dark:bg-slate-700 px-2 py-1 rounded-md">Pending Approval</span>
              )}
            </div>
            
            <p className="text-sm text-brown-dark dark:text-slate-300 leading-relaxed font-mukta mb-4">
              {voice.text}
            </p>
            
            <div className="flex items-center gap-6 border-t border-orange-50 dark:border-slate-700 pt-3">
              <button className="flex items-center gap-1.5 text-brown-light dark:text-slate-400 hover:text-red-500 transition-colors">
                <Heart size={16} />
                <span className="text-xs font-medium">{voice.likes || 0}</span>
              </button>
              <button className="flex items-center gap-1.5 text-brown-light dark:text-slate-400 hover:text-saffron-dark transition-colors">
                <MessageCircle size={16} />
                <span className="text-xs font-medium">{voice.comments || 0}</span>
              </button>
            </div>
          </motion.div>
        ))}

        {!loading && voices.length === 0 && (
          <div className="text-center py-10 text-brown-light dark:text-slate-400">
            <p>No posts yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
