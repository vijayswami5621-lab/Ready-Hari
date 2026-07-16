import { SecureImage } from "../../components/common/SecureImage";
import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { SEO } from "../../components/SEO";
import { ArrowLeft, Download, Play } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { EmptyState } from "../../components/EmptyState";
import { useAuthStore } from "../../store/useAuthStore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useRealtimeCollection } from "../../hooks/useRealtimeCollection";
import { useGoBack } from "../../hooks/useGoBack";

export const DownloadsScreen = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { user } = useAuthStore();
  const [userDownloads, setUserDownloads] = useState<string[]>([]);
  const { data: dbVideos, loading } = useRealtimeCollection<any>("videos");

  useEffect(() => {
    const fetchUserStats = async () => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          setUserDownloads(docSnap.data().downloadedVideos || []);
        }
      }
    };
    fetchUserStats();
  }, [user]);

  const downloadedVideos = dbVideos.filter((v) => userDownloads.includes(v.id));

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-900 transition-colors pb-20">
      <SEO
        title="Downloads | Hari Pathshala"
        description="Downloads page for Hari Pathshala."
      />

      <header className="pt-12 pb-4 px-6 sticky top-0 z-20 flex justify-between items-center bg-orange-50/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => goBack()}
            className="p-2 bg-white dark:bg-slate-800 rounded-full text-brown-dark dark:text-white shadow-sm border border-orange-100 dark:border-slate-700"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold font-sans text-brown-dark dark:text-white">
            Downloads
          </h1>
        </div>
      </header>

      <div className="px-6 mt-4">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="w-8 h-8 border-4 border-saffron border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : downloadedVideos.length === 0 ? (
          <EmptyState
            icon={Download}
            title="No Downloads Yet"
            message="You haven't downloaded any videos or notes yet. Download content to watch and study offline."
            buttonText="Explore Adhyayan"
            buttonPath="/adhyayan"
          />
        ) : (
          <div className="space-y-4">
            <p className="text-xs font-bold text-brown-light dark:text-slate-400 uppercase tracking-wider mb-2">
              Available Offline
            </p>
            {downloadedVideos.map((vid: any) => (
              <div
                key={vid.id}
                onClick={() => navigate(`/adhyayan/video/${vid.id}`)}
                className="flex gap-4 cursor-pointer group bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-orange-100 dark:border-slate-700"
              >
                <div className="relative w-36 aspect-video bg-brown-light dark:bg-slate-700 rounded-xl overflow-hidden shrink-0">
                  <SecureImage
                    src={
                      vid.thumbnail ||
                      `https://picsum.photos/seed/rel${vid.id}/400/225`
                    }
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    alt="Thumb"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center pl-1 shadow-lg">
                      <Play
                        className="text-saffron-dark fill-saffron-dark"
                        size={16}
                      />
                    </div>
                  </div>
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                    {vid.duration || "0:00"}
                  </div>
                </div>
                <div className="flex-1 py-1">
                  <h4 className="font-bold text-sm text-brown-dark dark:text-white line-clamp-2 leading-snug group-hover:text-saffron-dark transition-colors">
                    {vid.title}
                  </h4>
                  <p className="text-[10px] text-brown-light dark:text-slate-400 mt-1">
                    {vid.speaker || "Swami Ji"} • 100% Downloaded
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
