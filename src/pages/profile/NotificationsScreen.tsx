import { SecureImage } from "../../components/common/SecureImage";
import { useGoBack } from "../../hooks/useGoBack";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  Calendar,
  Video,
  Package,
  Gift,
  Heart,
} from "lucide-react";
import { motion } from "motion/react";
import { EmptyState } from "../../components/EmptyState";
import { useRealtimeCollection } from "../../hooks/useRealtimeCollection";
import { db } from "../../firebase/config";
import {
  doc,
  updateDoc,
  writeBatch,
  collection,
  getDocs,
} from "firebase/firestore";
import { SEO } from "../../components/SEO";
import { formatDistanceToNow } from "date-fns";
import { useAuthStore } from "../../store/useAuthStore";
import { useAppSettings } from "../../contexts/AppSettingsContext";

export const NotificationsScreen = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { user } = useAuthStore();
  const { settings } = useAppSettings();

  // Realtime listener for notifications - we'd normally filter by userId,
  // but for global app notifications we might just fetch all and mark read locally
  // For now, let's just listen to a 'notifications' collection
  const { data: dbNotifications, loading } =
    useRealtimeCollection<any>("notifications");
  const notifications =
    dbNotifications;

  // We should also check for user specific notifications if applicable
  const [markingRead, setMarkingRead] = useState(false);

  const getIcon = (type: string) => {
    switch (type) {
      case "quote":
        return Bell;
      case "event":
        return Calendar;
      case "order":
        return Package;
      case "video":
        return Video;
      case "offer":
        return Gift;
      default:
        return Bell;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case "quote":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
      case "event":
        return "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400";
      case "order":
        return "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400";
      case "video":
        return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400";
      case "offer":
        return "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const notifRef = doc(db, "notifications", id);
      await updateDoc(notifRef, { read: true });
    } catch (e) {
      console.error("Error marking as read", e);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!notifications.length || markingRead) return;
    setMarkingRead(true);
    try {
      const batch = writeBatch(db);
      notifications
        .filter((n) => !n.read)
        .forEach((notif) => {
          const notifRef = doc(db, "notifications", notif.id);
          batch.update(notifRef, { read: true });
        });
      await batch.commit();
    } catch (e) {
      console.error("Error marking all as read", e);
    } finally {
      setMarkingRead(false);
    }
  };

  const sortedNotifications = [...notifications].sort((a, b) => {
    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
    return timeB - timeA;
  });

  return (
    <div className="flex flex-col min-h-screen bg-orange-50 dark:bg-slate-900 transition-colors pb-20">
      <SEO
        title="Notifications | Hari Pathshala"
        description="Your notifications"
      />

      <header className="pt-12 pb-4 px-6 sticky top-0 z-30 flex items-center justify-between bg-orange-50/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => goBack()}
            className="p-2 bg-white dark:bg-slate-800 rounded-full text-brown-dark dark:text-white shadow-sm border border-orange-100 dark:border-slate-700"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            {settings?.appLogo && (
              <div className="w-8 h-8 aspect-square rounded-full shadow-sm overflow-hidden bg-white p-0.5 flex items-center justify-center shrink-0">
                <SecureImage
                  src={settings.appLogo}
                  alt="Logo"
                  imageClassName="object-contain"
                  className="w-full h-full"
                />
              </div>
            )}
            <h1 className="text-xl font-bold font-sans text-brown-dark dark:text-white">
              Notifications
            </h1>
          </div>
        </div>
        {sortedNotifications.some((n) => !n.read) && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={markingRead}
            className="text-xs font-bold text-saffron-dark disabled:opacity-50"
          >
            Mark all read
          </button>
        )}
      </header>

      <div className="flex-1 p-6">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-8 h-8 border-4 border-saffron border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : sortedNotifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No Notifications"
            message="You don't have any notifications yet. New updates, events and announcements will appear here."
          />
        ) : (
          <div className="space-y-3">
            {sortedNotifications.map((notif, index) => {
              const Icon = getIcon(notif.type);
              const colorClass = getColor(notif.type);

              const timeDisplay = notif.createdAt?.toMillis
                ? formatDistanceToNow(notif.createdAt.toMillis(), {
                    addSuffix: true,
                  })
                : "Just now";

              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={notif.id}
                  onClick={() => {
                    if (!notif.read) handleMarkAsRead(notif.id);
                    if (notif.link) navigate(notif.link);
                  }}
                  className={`p-4 rounded-2xl flex gap-4 cursor-pointer transition-colors ${notif.read ? "bg-white dark:bg-slate-800 border border-orange-50 dark:border-slate-700" : "bg-orange-100/50 dark:bg-slate-800/80 border border-orange-200 dark:border-slate-600 shadow-sm"}`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}
                  >
                    {notif.image ? (
                      <SecureImage
                        src={notif.image}
                        alt={notif.title}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <Icon size={20} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3
                        className={`text-sm font-bold ${notif.read ? "text-brown-dark/80 dark:text-slate-300" : "text-brown-dark dark:text-white"}`}
                      >
                        {notif.title}
                      </h3>
                      <span className="text-[10px] text-brown-light/60 dark:text-slate-500 whitespace-nowrap ml-2">
                        {timeDisplay}
                      </span>
                    </div>
                    <p
                      className={`text-xs leading-relaxed ${notif.read ? "text-brown-light dark:text-slate-400" : "text-brown-dark/80 dark:text-slate-300 font-medium"}`}
                    >
                      {notif.desc || notif.message}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
