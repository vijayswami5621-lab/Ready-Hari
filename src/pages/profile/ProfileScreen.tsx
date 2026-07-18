import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { useShareContent } from "../../hooks/useShareContent";
import { motion } from "motion/react";
import {
  User,
  Settings,
  ShoppingBag,
  Heart,
  Download,
  Bookmark,
  History,
  Bell,
  Info,
  Shield,
  HelpCircle,
  Phone,
  Star,
  Share2,
  LogOut,
  ChevronRight,
  Edit3,
} from "lucide-react";
import { auth, db } from "../../firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
import { getISTDateInfo } from "../../services/naamJapService";
import { signOut } from "firebase/auth";
import { SEO } from "../../components/SEO";
import { useRealtimeCollection } from "../../hooks/useRealtimeCollection";
import { SecureImage } from "../../components/common/SecureImage";
import { useAppSettings } from "../../contexts/AppSettingsContext";

const getIcon = (iconName: string) => {
  switch (iconName?.toLowerCase()) {
    case "edit3":
      return Edit3;
    case "shoppingbag":
      return ShoppingBag;
    case "heart":
      return Heart;
    case "download":
      return Download;
    case "bookmark":
      return Bookmark;
    case "history":
      return History;
    case "star":
      return Star;
    case "bell":
      return Bell;
    case "settings":
      return Settings;
    case "info":
      return Info;
    case "shield":
      return Shield;
    case "phone":
      return Phone;
    default:
      return ChevronRight;
  }
};

export const ProfileScreen = () => {
  const navigate = useNavigate();
  const { user, userData, logout } = useAuthStore();
  const { shareContent } = useShareContent();
  const { navigationItems, settings, officialDetails } = useAppSettings();

  const userName = user?.displayName || userData?.name || "Bhakt";
  const userEmail = user?.email || "bhakt@example.com";
  const profileImg =
    user?.photoURL ||
    userData?.profileImage ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`;

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [stats, setStats] = useState({
    allTimeScore: 0,
    totalXP: 0,
    totalPlayed: 0,
    accuracy: 0,
    streak: 0,
    longestStreak: 0,
    rank: 0,
    correct: 0,
    wrong: 0,
    skipped: 0
  });

  const [naamJapStats, setNaamJapStats] = useState({
    todayCount: 0,
    weeklyCount: 0,
    monthlyCount: 0,
    yearlyCount: 0,
    lifetimeCount: 0,
    todayMala: 0,
    lifetimeMala: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: ""
  });

  React.useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "userStats", user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setStats({
          allTimeScore: data.quizAllTimeScore || 0,
          totalXP: data.quizTotalXP || 0,
          totalPlayed: data.quizTotalPlayed || 0,
          accuracy: data.quizAccuracy || 0,
          streak: data.quizStreak || 0,
          longestStreak: data.quizLongestStreak || 0,
          rank: data.quizRank || 0,
          correct: data.quizTotalCorrect || 0,
          wrong: data.quizTotalWrong || 0,
          skipped: data.quizTotalSkipped || 0
        });
      }
    }, (err) => console.warn("Error subscribing to userStats in profile:", err));
    return unsub;
  }, [user]);

  React.useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "naamJap", user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const { dateStr, weekStr, monthStr, yearStr } = getISTDateInfo();

        const isToday = data.lastActiveDate === dateStr;
        const isThisWeek = data.lastActiveWeek === weekStr;
        const isThisMonth = data.lastActiveMonth === monthStr;
        const isThisYear = data.lastActiveYear === yearStr;

        setNaamJapStats({
          todayCount: isToday ? (data.todayCount || 0) : 0,
          weeklyCount: isThisWeek ? (data.weeklyCount || 0) : 0,
          monthlyCount: isThisMonth ? (data.monthlyCount || 0) : 0,
          yearlyCount: isThisYear ? (data.yearlyCount || 0) : 0,
          lifetimeCount: data.lifetimeCount || 0,
          todayMala: isToday ? (data.todayMala || 0) : 0,
          lifetimeMala: data.lifetimeMala || 0,
          currentStreak: data.currentStreak || 0,
          longestStreak: data.longestStreak || 0,
          lastActiveDate: data.lastActiveDate || "Never"
        });
      } else {
        setNaamJapStats({
          todayCount: 0,
          weeklyCount: 0,
          monthlyCount: 0,
          yearlyCount: 0,
          lifetimeCount: 0,
          todayMala: 0,
          lifetimeMala: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDate: "Never"
        });
      }
    }, (err) => console.warn("Error subscribing to naamJap stats in profile:", err));
    return unsub;
  }, [user]);

  // Fetch admin settings for Share/Rate app content
  const { data: remoteSettings } = useRealtimeCollection<any>("settings");
  const appSettings = remoteSettings.length > 0 ? remoteSettings[0] : null;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logout();
      navigate("/auth/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleShareApp = async () => {
    await shareContent({
      title: "Hari Pathshala App",
      urlPath: '/'
    });
  };

  const handleRateApp = () => {
    const playStoreUrl =
      appSettings?.appUrl ||
      "https://play.google.com/store/apps/details?id=com.haripathshala.app";
    window.open(playStoreUrl, "_blank");
  };

  const dynamicProfileItems = useMemo(() => {
    return navigationItems.filter((n) => n.type === "profile");
  }, [navigationItems]);

  const menuGroups = [
    {
      title: "My Account",
      items: [
        {
          icon: Edit3,
          label: "Edit Profile",
          path: "/profile/edit",
          color: "text-blue-500",
          featureKey: "editProfile",
        },
        {
          icon: ShoppingBag,
          label: "My Orders",
          path: "/profile/orders",
          color: "text-orange-500",
          featureKey: "orders",
        },
        {
          icon: Heart,
          label: "Wishlist",
          path: "/profile/wishlist",
          color: "text-red-500",
          featureKey: "wishlist",
        },
      ],
    },
    {
      title: "Library",
      items: [
        {
          icon: Download,
          label: "Downloads",
          path: "/profile/downloads",
          color: "text-green-500",
          featureKey: "downloads",
        },
        {
          icon: Bookmark,
          label: "Bookmarks",
          path: "/profile/bookmarks",
          color: "text-purple-500",
          featureKey: "savedQuotes",
        },
        {
          icon: History,
          label: "Watch History",
          path: "/profile/history",
          color: "text-amber-500",
          featureKey: "history",
        },
      ],
    },
    {
      title: "Spiritual Progress",
      items: [
        {
          icon: History,
          label: "Naam Jap History",
          path: "/chanting",
          color: "text-orange-500",
          featureKey: "naamJap",
        },
        {
          icon: HelpCircle,
          label: "Spiritual Quiz",
          path: "/quiz",
          color: "text-amber-500",
          featureKey: "spiritualQuiz",
        }
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          icon: Bell,
          label: "Notifications",
          path: "/profile/notifications",
          color: "text-rose-500",
          featureKey: "notifications",
        },
        {
          icon: Settings,
          label: "Settings",
          path: "/profile/settings",
          color: "text-slate-500",
          featureKey: "settings",
        },
      ],
    },
    {
      title: "About & Support",
      items: [
        {
          icon: Info,
          label: `About ${officialDetails?.organizationName || "Hari Pathshala"}`,
          path: "/profile/about",
          color: "text-saffron",
          featureKey: "about",
        },
        {
          icon: Shield,
          label: "Privacy Policy",
          path: "/profile/privacy",
          color: "text-teal-500",
          featureKey: "privacy",
        },
        {
          icon: Phone,
          label: "Contact Us",
          path: "/profile/contact",
          color: "text-indigo-500",
          featureKey: "contact",
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col min-h-full bg-orange-50 dark:bg-slate-900 transition-colors">
      <SEO
        title="Profile | Hari Pathshala"
        description="Manage your account, orders, and preferences."
      />
      {/* HEADER / PROFILE CARD */}
      <div className="relative pt-12 pb-6 px-6 bg-gradient-to-b from-saffron to-saffron-dark rounded-b-3xl shadow-lg overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
        {settings?.appLogo && (
          <div className="absolute top-4 right-4 w-10 h-10 aspect-square bg-white rounded-full p-1 shadow-md flex items-center justify-center overflow-hidden z-20 shrink-0">
            <SecureImage
              src={settings.appLogo}
              alt="Logo"
              imageClassName="object-contain"
              className="w-full h-full"
            />
          </div>
        )}
        <div className="relative z-10 flex flex-col items-center mt-4 text-white">
          <div className="relative">
            <div className="w-24 h-24 aspect-square bg-white p-1 rounded-full shadow-xl">
              <SecureImage
                src={profileImg}
                alt="Profile"
                className="w-full h-full rounded-full object-cover shrink-0"
              />
            </div>
            <button
              onClick={() => navigate("/profile/edit")}
              className="absolute bottom-0 right-0 bg-white text-saffron-dark p-1.5 rounded-full shadow-md hover:bg-orange-50 transition"
            >
              <Edit3 size={16} />
            </button>
          </div>
          <h1 className="text-2xl font-bold font-sans mt-3">{userName}</h1>
          <p className="text-white/80 text-sm font-mukta">{userEmail}</p>
          <div className="mt-4 flex gap-4">
            <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 shadow-sm">
              <Star size={14} className="fill-golden text-golden" /> Devotee
            </div>
            <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm">
              Joined 2026
            </div>
          </div>
        </div>
      </div>

      {/* SPIRITUAL SCORECARD - SINGLE UNIFIED SUMMARY CARD */}
      <div className="px-4 -mt-5 relative z-20">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-orange-100 dark:border-slate-800 shadow-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black uppercase tracking-wider text-saffron flex items-center gap-1.5">
              🏆 Real-time Spiritual Scorecard
            </h4>
            <button 
              onClick={() => navigate("/quiz")}
              className="text-[10px] font-black uppercase tracking-wider text-amber-600 hover:text-amber-700 bg-amber-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg transition"
            >
              View Details &rarr;
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* XP */}
            <div className="bg-amber-50/50 dark:bg-slate-850 p-2.5 rounded-2xl text-center border border-amber-100/30">
              <span className="text-[9px] text-neutral-400 dark:text-slate-500 block uppercase font-bold tracking-wider">Total XP</span>
              <span className="text-sm font-black text-amber-600 dark:text-amber-400 block mt-0.5">{stats.totalXP}</span>
            </div>
            {/* All-Time Score */}
            <div className="bg-amber-50/50 dark:bg-slate-850 p-2.5 rounded-2xl text-center border border-amber-100/30">
              <span className="text-[9px] text-neutral-400 dark:text-slate-500 block uppercase font-bold tracking-wider">Score</span>
              <span className="text-sm font-black text-brown-dark dark:text-white block mt-0.5">{stats.allTimeScore}</span>
            </div>
            {/* Accuracy */}
            <div className="bg-amber-50/50 dark:bg-slate-850 p-2.5 rounded-2xl text-center border border-amber-100/30">
              <span className="text-[9px] text-neutral-400 dark:text-slate-500 block uppercase font-bold tracking-wider">Accuracy</span>
              <span className="text-sm font-black text-green-600 dark:text-green-400 block mt-0.5">{stats.accuracy}%</span>
            </div>
            {/* Total Quizzes */}
            <div className="bg-amber-50/50 dark:bg-slate-850 p-2.5 rounded-2xl text-center border border-amber-100/30">
              <span className="text-[9px] text-neutral-400 dark:text-slate-500 block uppercase font-bold tracking-wider">Quizzes</span>
              <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 block mt-0.5">{stats.totalPlayed}</span>
            </div>
            {/* Rank */}
            <div className="bg-amber-50/50 dark:bg-slate-850 p-2.5 rounded-2xl text-center border border-amber-100/30">
              <span className="text-[9px] text-neutral-400 dark:text-slate-500 block uppercase font-bold tracking-wider">Global Rank</span>
              <span className="text-sm font-black text-orange-600 dark:text-orange-400 block mt-0.5">#{stats.rank || '1'}</span>
            </div>
            {/* Streak */}
            <div className="bg-amber-50/50 dark:bg-slate-850 p-2.5 rounded-2xl text-center border border-amber-100/30">
              <span className="text-[9px] text-neutral-400 dark:text-slate-500 block uppercase font-bold tracking-wider">Streak</span>
              <span className="text-sm font-black text-red-500 block mt-0.5">{stats.streak}🔥</span>
            </div>
          </div>
        </div>
      </div>

      {/* REAL-TIME NAAM JAP STATISTICS CARD */}
      <div className="px-4 mt-4 relative z-20">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-orange-100 dark:border-slate-800 shadow-xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black uppercase tracking-wider text-saffron flex items-center gap-1.5">
              📿 Real-time Naam Jap Statistics
            </h4>
            <button 
              onClick={() => navigate("/chanting")}
              className="text-[10px] font-black uppercase tracking-wider text-amber-600 hover:text-amber-700 bg-amber-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg transition"
            >
              Start Chanting &rarr;
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Today's Count */}
            <div className="bg-orange-50/50 dark:bg-slate-850 p-2.5 rounded-2xl text-center border border-orange-100/30">
              <span className="text-[9px] text-neutral-400 dark:text-slate-500 block uppercase font-bold tracking-wider">Today's Jap</span>
              <span className="text-sm font-black text-brown-dark dark:text-white block mt-0.5">{naamJapStats.todayCount}</span>
            </div>
            {/* Today's Mala */}
            <div className="bg-orange-50/50 dark:bg-slate-850 p-2.5 rounded-2xl text-center border border-orange-100/30">
              <span className="text-[9px] text-neutral-400 dark:text-slate-500 block uppercase font-bold tracking-wider">Today's Mala</span>
              <span className="text-sm font-black text-saffron block mt-0.5">{naamJapStats.todayMala}</span>
            </div>
            {/* Weekly Count */}
            <div className="bg-orange-50/50 dark:bg-slate-850 p-2.5 rounded-2xl text-center border border-orange-100/30">
              <span className="text-[9px] text-neutral-400 dark:text-slate-500 block uppercase font-bold tracking-wider">Weekly Jap</span>
              <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 block mt-0.5">{naamJapStats.weeklyCount}</span>
            </div>
            {/* Monthly Count */}
            <div className="bg-orange-50/50 dark:bg-slate-850 p-2.5 rounded-2xl text-center border border-orange-100/30">
              <span className="text-[9px] text-neutral-400 dark:text-slate-500 block uppercase font-bold tracking-wider">Monthly Jap</span>
              <span className="text-sm font-black text-violet-600 dark:text-violet-400 block mt-0.5">{naamJapStats.monthlyCount}</span>
            </div>
            {/* Yearly Count */}
            <div className="bg-orange-50/50 dark:bg-slate-850 p-2.5 rounded-2xl text-center border border-orange-100/30">
              <span className="text-[9px] text-neutral-400 dark:text-slate-500 block uppercase font-bold tracking-wider">Yearly Jap</span>
              <span className="text-sm font-black text-teal-600 dark:text-teal-400 block mt-0.5">{naamJapStats.yearlyCount}</span>
            </div>
            {/* Lifetime Count */}
            <div className="bg-orange-50/50 dark:bg-slate-850 p-2.5 rounded-2xl text-center border border-orange-100/30">
              <span className="text-[9px] text-neutral-400 dark:text-slate-500 block uppercase font-bold tracking-wider">Lifetime Jap</span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">{naamJapStats.lifetimeCount}</span>
            </div>
            {/* Lifetime Mala */}
            <div className="bg-orange-50/50 dark:bg-slate-850 p-2.5 rounded-2xl text-center border border-orange-100/30">
              <span className="text-[9px] text-neutral-400 dark:text-slate-500 block uppercase font-bold tracking-wider">Lifetime Mala</span>
              <span className="text-sm font-black text-amber-600 dark:text-amber-400 block mt-0.5">{naamJapStats.lifetimeMala}</span>
            </div>
            {/* Current Streak */}
            <div className="bg-orange-50/50 dark:bg-slate-850 p-2.5 rounded-2xl text-center border border-orange-100/30">
              <span className="text-[9px] text-neutral-400 dark:text-slate-500 block uppercase font-bold tracking-wider">Current Streak</span>
              <span className="text-sm font-black text-red-500 block mt-0.5">{naamJapStats.currentStreak}🔥</span>
            </div>
            {/* Longest Streak */}
            <div className="bg-orange-50/50 dark:bg-slate-850 p-2.5 rounded-2xl text-center border border-orange-100/30">
              <span className="text-[9px] text-neutral-400 dark:text-slate-500 block uppercase font-bold tracking-wider">Longest Streak</span>
              <span className="text-sm font-black text-rose-500 block mt-0.5">{naamJapStats.longestStreak}🏆</span>
            </div>
          </div>
          <div className="text-center pt-1 border-t border-orange-50 dark:border-slate-800">
            <span className="text-[10px] text-neutral-400 dark:text-slate-500 font-sans block">
              📅 Last Active Date: <strong className="text-brown-dark dark:text-slate-300 font-bold">{naamJapStats.lastActiveDate}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* MENU LIST */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {dynamicProfileItems.length > 0 ? (
          <div>
            <h3 className="px-2 text-xs font-bold text-brown-light/70 dark:text-slate-400 uppercase tracking-wider mb-2">
              My Menu
            </h3>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-orange-100 dark:border-slate-700 overflow-hidden">
              {dynamicProfileItems.map((item, i) => {
                const Icon = getIcon(item.icon);
                return (
                  <div key={item.id}>
                    <button
                      onClick={() => navigate(item.destination)}
                      className="w-full flex items-center justify-between p-4 hover:bg-orange-50 dark:hover:bg-slate-700/50 transition-colors active:bg-orange-100 dark:active:bg-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-xl bg-orange-50 dark:bg-slate-700/50 text-saffron-dark`}
                        >
                          <Icon size={18} />
                        </div>
                        <span className="font-medium text-sm text-brown-dark dark:text-slate-200">
                          {item.name}
                        </span>
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-brown-light/50 dark:text-slate-500"
                      />
                    </button>
                    {i < dynamicProfileItems.length - 1 && (
                      <div className="h-px bg-orange-50 dark:bg-slate-700 mx-4"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          menuGroups.map((group, idx) => (
            <div key={idx}>
              <h3 className="px-2 text-xs font-bold text-brown-light/70 dark:text-slate-400 uppercase tracking-wider mb-2">
                {group.title}
              </h3>
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-orange-100 dark:border-slate-700 overflow-hidden">
                {group.items
                  .filter(
                    (item) =>
                      (settings?.features as any)?.[item.featureKey] !== false,
                  )
                  .map((item, i, arr) => (
                    <div key={i}>
                      <button
                        onClick={() => navigate(item.path)}
                        className="w-full flex items-center justify-between p-4 hover:bg-orange-50 dark:hover:bg-slate-700/50 transition-colors active:bg-orange-100 dark:active:bg-slate-700"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-xl bg-orange-50 dark:bg-slate-700/50 ${item.color}`}
                          >
                            <item.icon size={18} />
                          </div>
                          <span className="font-medium text-sm text-brown-dark dark:text-slate-200">
                            {item.label}
                          </span>
                        </div>
                        <ChevronRight
                          size={16}
                          className="text-brown-light/50 dark:text-slate-500"
                        />
                      </button>
                      {item.featureKey === 'spiritualQuiz' && (
                        <div className="px-4 pb-4 pt-1 flex flex-wrap gap-2">
                          <button
                            onClick={() => navigate('/quiz', { state: { activeTab: 'history' } })}
                            className="bg-orange-50/60 hover:bg-orange-100 dark:bg-slate-700/50 dark:hover:bg-slate-750 text-[10px] font-bold text-brown-dark dark:text-slate-300 py-1.5 px-3 rounded-full border border-orange-100/30 transition active:scale-95 flex items-center gap-1"
                          >
                            📜 Quiz History
                          </button>
                          <button
                            onClick={() => navigate('/quiz', { state: { activeTab: 'achievements' } })}
                            className="bg-orange-50/60 hover:bg-orange-100 dark:bg-slate-700/50 dark:hover:bg-slate-750 text-[10px] font-bold text-brown-dark dark:text-slate-300 py-1.5 px-3 rounded-full border border-orange-100/30 transition active:scale-95 flex items-center gap-1"
                          >
                            🏆 Achievements
                          </button>
                          <button
                            onClick={() => navigate('/quiz', { state: { activeTab: 'leaderboard' } })}
                            className="bg-orange-50/60 hover:bg-orange-100 dark:bg-slate-700/50 dark:hover:bg-slate-750 text-[10px] font-bold text-brown-dark dark:text-slate-300 py-1.5 px-3 rounded-full border border-orange-100/30 transition active:scale-95 flex items-center gap-1"
                          >
                            📊 Leaderboard
                          </button>
                          <button
                            onClick={() => navigate('/quiz', { state: { activeTab: 'certificates' } })}
                            className="bg-orange-50/60 hover:bg-orange-100 dark:bg-slate-700/50 dark:hover:bg-slate-750 text-[10px] font-bold text-brown-dark dark:text-slate-300 py-1.5 px-3 rounded-full border border-orange-100/30 transition active:scale-95 flex items-center gap-1"
                          >
                            🎓 My Certificates
                          </button>
                        </div>
                      )}
                      {i < arr.length - 1 && (
                        <div className="h-px bg-orange-50 dark:bg-slate-700 mx-4"></div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))
        )}

        {/* LOGOUT & OTHER ACTIONS */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-orange-100 dark:border-slate-700 overflow-hidden mt-4">
          <button
            onClick={handleShareApp}
            className="w-full flex items-center justify-between p-4 hover:bg-orange-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-50 dark:bg-slate-700/50 text-blue-500">
                <Share2 size={18} />
              </div>
              <span className="font-medium text-sm text-brown-dark dark:text-slate-200">
                Share App
              </span>
            </div>
            <ChevronRight
              size={16}
              className="text-brown-light/50 dark:text-slate-500"
            />
          </button>
          <div className="h-px bg-orange-50 dark:bg-slate-700 mx-4"></div>
          <button
            onClick={handleRateApp}
            className="w-full flex items-center justify-between p-4 hover:bg-orange-50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-50 dark:bg-slate-700/50 text-yellow-500">
                <Star size={18} />
              </div>
              <span className="font-medium text-sm text-brown-dark dark:text-slate-200">
                Rate App
              </span>
            </div>
            <ChevronRight
              size={16}
              className="text-brown-light/50 dark:text-slate-500"
            />
          </button>
          <div className="h-px bg-orange-50 dark:bg-slate-700 mx-4"></div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center p-4 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-500"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-500">
                <LogOut size={18} />
              </div>
              <span className="font-bold text-sm">Logout</span>
            </div>
          </button>
        </div>

        <div className="text-center mt-8 pb-4 text-xs text-brown-light/50 dark:text-slate-500">
          <p>
            {settings?.appName || "Hari Pathshala"} App Version{" "}
            {settings?.appVersion || "1.0.0"}
          </p>
          <p className="mt-1">{settings?.appTagline || "Made with Bhakti"}</p>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold font-sans text-brown-dark dark:text-white mb-2 text-center">
              Logout
            </h2>
            <p className="text-brown-light dark:text-slate-300 text-center text-sm mb-6">
              Are you sure you want to log out of your account?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 bg-orange-50 dark:bg-slate-700 text-brown-dark dark:text-white font-bold rounded-xl active:scale-95 transition-transform"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl active:scale-95 transition-transform shadow-md shadow-red-500/20"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
