import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayRemove,
  arrayUnion,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuthStore } from "../../store/useAuthStore";
import { ArrowLeft, Bookmark, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { SEO } from "../../components/SEO";
import { useRealtimeCollection } from "../../hooks/useRealtimeCollection";
import { EmptyState } from "../../components/EmptyState";
import { useGoBack } from "../../hooks/useGoBack";

export const BookmarksScreen = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { user } = useAuthStore();
  const [userBookmarks, setUserBookmarks] = useState<string[]>([]);
  const { data: dbQuotes, loading } = useRealtimeCollection<any>("quotes");

  useEffect(() => {
    let unsubscribe: () => void;
    if (user) {
      const userRef = doc(db, "users", user.uid);
      unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserBookmarks(docSnap.data().bookmarks || []);
        }
      });
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  const bookmarkedQuotes = dbQuotes.filter((q) => userBookmarks.includes(q.id));

  return (
    <div className="flex flex-col min-h-screen bg-orange-50 dark:bg-slate-900 transition-colors pb-24">
      <SEO
        title="Bookmarks | Hari Pathshala"
        description="Bookmarks page for Hari Pathshala."
      />

      <header className="px-4 py-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-30 shadow-sm flex items-center gap-3">
        <button
          onClick={() => goBack()}
          className="p-2 -ml-2 text-brown-dark dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-full transition"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-bold font-sans text-brown-dark dark:text-white">
            Bookmarks
          </h1>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-saffron border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : bookmarkedQuotes.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title="No Bookmarks Yet"
            message="You haven't bookmarked any quotes or content yet."
            buttonText="Explore Quotes"
            buttonAction={() => navigate("/quotes")}
          />
        ) : (
          <div className="grid gap-4">
            {bookmarkedQuotes.map((quote) => (
              <motion.div
                key={quote.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-orange-100 dark:border-slate-700 relative"
              >
                <Bookmark
                  className="absolute top-4 right-4 text-saffron-dark fill-saffron-dark"
                  size={20}
                />
                <p className="text-brown-dark dark:text-slate-200 font-medium pr-8">
                  {quote.text}
                </p>
                {quote.author && (
                  <p className="text-xs text-brown-light dark:text-slate-400 mt-2 font-bold">
                    — {quote.author}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
