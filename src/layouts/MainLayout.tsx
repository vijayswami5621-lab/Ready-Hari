import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, BookOpen, Sparkles, ShoppingBag, User, Heart, MessageSquare, Video, Activity, Search, Bookmark } from 'lucide-react';
import { useHaptics } from '../hooks/useHaptics';
import { useAppSettings } from '../contexts/AppSettingsContext';
import { motion } from 'motion/react';

const getIcon = (iconName: string) => {
  if (!iconName) return Home;
  switch (iconName.toLowerCase()) {
    case 'home': return Home;
    case 'bookopen': return BookOpen;
    case 'sparkles': return Sparkles;
    case 'shoppingbag': return ShoppingBag;
    case 'user': return User;
    case 'heart': return Heart;
    case 'messagesquare': return MessageSquare;
    case 'video': return Video;
    case 'activity': return Activity;
    case 'search': return Search;
    case 'bookmark': return Bookmark;
    default: return Home;
  }
};

export const MainLayout = () => {
  const { hapticSelection } = useHaptics();
  const { navigationItems } = useAppSettings();

  const defaultNavItems = [
    { name: 'Home', path: '/', icon: 'home' },
    { name: 'Adhyayan', path: '/adhyayan', icon: 'bookopen' },
    { name: 'AI Guru', path: '/aiguru', icon: 'sparkles' },
    { name: 'Store', path: '/store', icon: 'shoppingbag' },
    { name: 'Profile', path: '/profile', icon: 'user' },
  ];

  const bottomNavItems = navigationItems.filter(n => n.type === 'bottom').length > 0 
    ? navigationItems.filter(n => n.type === 'bottom') 
    : defaultNavItems;

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-orange-50 dark:bg-slate-900 relative overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </div>

      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-md h-16 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-white/30 dark:border-white/5 rounded-full shadow-[0_12px_40px_rgba(255,153,51,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)] flex items-center justify-around px-3 z-40">
        {bottomNavItems.map((item) => {
          const Icon = getIcon(item.icon);
          return (
            <NavLink
              key={item.name}
              to={item.destination || (item as any).path}
              onClick={() => hapticSelection()}
              className="relative flex flex-col items-center justify-center w-14 h-12 rounded-full transition-all duration-300"
            >
              {({ isActive }) => (
                <div className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-300 ${isActive ? 'text-saffron-dark dark:text-saffron' : 'text-brown-light dark:text-slate-400 hover:text-saffron'}`}>
                  {isActive && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute inset-0 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-slate-800 dark:to-slate-850 rounded-full -z-10 border border-orange-100/50 dark:border-slate-700/50"
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    />
                  )}
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[9px] font-bold mt-0.5 tracking-tight">{item.name}</span>
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

