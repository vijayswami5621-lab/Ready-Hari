import React, { useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, useRouteError } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { RefreshCw, Home as HomeIcon } from 'lucide-react';
import { getApiUrl } from '../utils/apiHelper';

const GlobalErrorBoundary = () => {
  const error = useRouteError();
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error("Route error caught by GlobalErrorBoundary:", error);
    }
    fetch(getApiUrl('/api/log-error'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: (error as Error)?.message || String(error), stack: (error as Error)?.stack })
    }).catch(() => {});
  }, [error]);

  const handleReset = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 mb-6 rounded-full bg-white dark:bg-slate-800 p-2 shadow-lg border-2 border-orange-100 dark:border-slate-700 flex items-center justify-center overflow-hidden">
        <img src="/logo.png" alt="Hari Pathshala" className="w-full h-full object-contain" />
      </div>
      
      <h1 className="text-2xl font-bold font-sans text-brown-dark dark:text-white mb-2">
        Something went wrong.
      </h1>
      <p className="text-brown-light dark:text-slate-400 mb-8 max-w-sm text-sm">
        {(error as Error)?.message || "We encountered an unexpected error. Don't worry, your spiritual journey is safe."}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
        <button
          onClick={handleReset}
          className="flex-1 flex items-center justify-center gap-2 bg-saffron text-white py-3 px-6 rounded-xl font-bold shadow-md hover:bg-saffron-dark transition-colors cursor-pointer"
        >
          <RefreshCw size={18} />
          Retry
        </button>
        <button
          onClick={handleGoHome}
          className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-brown-dark dark:text-white py-3 px-6 rounded-xl font-bold shadow-sm border border-orange-200 dark:border-slate-700 hover:bg-orange-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
        >
          <HomeIcon size={18} />
          Home
        </button>
      </div>
    </div>
  );
};
import { useAuthStore } from '../store/useAuthStore';
import { SplashScreen } from '../pages/splash/SplashScreen';
import { OnboardingScreen } from '../pages/onboarding/OnboardingScreen';
import { MainLayout } from '../layouts/MainLayout';
import { HomeScreen } from '../pages/home/HomeScreen';
import { ChantingScreen } from '../pages/chanting/ChantingScreen';
import { CommunityExperiencesScreen } from '../pages/community/CommunityExperiencesScreen';
import { CommunityVoiceScreen } from '../pages/community/CommunityVoiceScreen';
import { AdhyayanScreen } from '../pages/adhyayan/AdhyayanScreen';
import { CategoryDetailsScreen } from '../pages/adhyayan/CategoryDetailsScreen';
import { VideoPlayerScreen } from '../pages/adhyayan/VideoPlayerScreen';
import { ScriptureReaderScreen } from '../pages/adhyayan/ScriptureReaderScreen';
import { AIGuruScreen } from '../pages/aiguru/AIGuruScreen';
import { LoginScreen } from '../pages/auth/LoginScreen';
import { StoreScreen } from '../pages/store/StoreScreen';
import { ProductDetailsScreen } from '../pages/store/ProductDetailsScreen';
import { CartScreen } from '../pages/store/CartScreen';
import { RegisterScreen } from '../pages/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../pages/auth/ForgotPasswordScreen';
import { ProfileScreen } from '../pages/profile/ProfileScreen';
import { SettingsScreen } from '../pages/profile/SettingsScreen';
import { EditProfileScreen } from '../pages/profile/EditProfileScreen';
import { NotificationsScreen } from '../pages/profile/NotificationsScreen';

// New Pages
import { AboutScreen } from '../pages/info/AboutScreen';
import { FounderScreen } from '../pages/info/FounderScreen';
import { MissionScreen } from '../pages/info/MissionScreen';
import { PrivacyPolicyScreen } from '../pages/info/PrivacyPolicyScreen';
import { TermsScreen } from '../pages/info/TermsScreen';
import { ContactScreen } from '../pages/info/ContactScreen';
import { RefundPolicyScreen } from '../pages/info/RefundPolicyScreen';
import { ShippingPolicyScreen } from '../pages/info/ShippingPolicyScreen';
import { GalleryScreen } from '../pages/info/GalleryScreen';
import { FAQScreen } from '../pages/info/FAQScreen';
import { CommunityGuidelinesScreen } from '../pages/info/CommunityGuidelinesScreen';
import { CopyrightPolicyScreen } from '../pages/info/CopyrightPolicyScreen';
import { DisclaimerScreen } from '../pages/info/DisclaimerScreen';
import { DataSafetyScreen } from '../pages/info/DataSafetyScreen';
import { CookiePolicyScreen } from '../pages/info/CookiePolicyScreen';
import { UserAgreementScreen } from '../pages/info/UserAgreementScreen';
import { AccountDeletionScreen } from '../pages/info/AccountDeletionScreen';
import { CheckoutScreen } from '../pages/store/CheckoutScreen';
import { OrderSuccessScreen } from '../pages/store/OrderSuccessScreen';
import { TrackOrderScreen } from '../pages/store/TrackOrderScreen';
import { OrdersScreen } from '../pages/profile/OrdersScreen';
import { WishlistScreen } from '../pages/profile/WishlistScreen';
import { DownloadsScreen } from '../pages/profile/DownloadsScreen';
import { HistoryScreen } from '../pages/profile/HistoryScreen';
import { BookmarksScreen } from '../pages/profile/BookmarksScreen';
import { PDFViewerScreen } from '../pages/adhyayan/PDFViewerScreen';
import { SearchScreen } from '../pages/misc/SearchScreen';
import { PanchangScreen } from '../pages/misc/PanchangScreen';
import { EventsScreen } from '../pages/misc/EventsScreen';
import { BlogScreen } from '../pages/misc/BlogScreen';
import { QuotesScreen } from '../pages/info/QuotesScreen';
import { PublicQuoteScreen } from '../pages/info/PublicQuoteScreen';
import { NotFoundScreen } from '../pages/misc/NotFoundScreen';
import { ContentResolver } from '../pages/misc/ContentResolver';

// Spiritual Quiz Pages
import { QuizDashboard } from '../pages/quiz/QuizDashboard';
import { SubjectDetail } from '../pages/quiz/SubjectDetail';
import { QuizPlay } from '../pages/quiz/QuizPlay';
import { QuizResult } from '../pages/quiz/QuizResult';
import { SpiritualLeaderboard } from '../pages/quiz/SpiritualLeaderboard';
import { PublicUserProfile } from '../pages/quiz/PublicUserProfile';
import { useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Clipboard } from '@capacitor/clipboard';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { hasCompletedOnboarding } = useAppStore();
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-orange-50/20 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-saffron border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-neutral-500 mt-4 font-bold font-sans">Connecting to Hari Pathshala...</p>
      </div>
    );
  }
  
  if (!hasCompletedOnboarding) return <Navigate to="/onboarding" state={{ from: location.pathname + location.search }} replace />;
  if (!isAuthenticated) return <Navigate to="/auth/login" state={{ from: location.pathname + location.search }} replace />;
  return <>{children}</>;
};

const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
  const { hasCompletedOnboarding } = useAppStore();
  const location = useLocation();
  const from = location.state?.from || "/";
  if (hasCompletedOnboarding) return <Navigate to={from} replace />;
  return <>{children}</>;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { hasCompletedOnboarding } = useAppStore();
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();
  const from = location.state?.from || "/";
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-orange-50/20 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-saffron border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!hasCompletedOnboarding) return <Navigate to="/onboarding" state={{ from: location.pathname + location.search }} replace />;
  if (isAuthenticated) return <Navigate to={from} replace />;
  return <>{children}</>;
};

const router = createBrowserRouter([
  {
    path: '/onboarding',
    element: <OnboardingRoute><OnboardingScreen /></OnboardingRoute>,
    errorElement: <GlobalErrorBoundary />,
  },
  {
    path: '/auth/login',
    element: <AuthRoute><LoginScreen /></AuthRoute>,
    errorElement: <GlobalErrorBoundary />,
  },
  {
    path: '/auth/register',
    element: <AuthRoute><RegisterScreen /></AuthRoute>,
    errorElement: <GlobalErrorBoundary />,
  },
  {
    path: '/auth/forgot-password',
    element: <AuthRoute><ForgotPasswordScreen /></AuthRoute>,
    errorElement: <GlobalErrorBoundary />,
  },
  {
    path: '/',
    element: <ProtectedRoute><MainLayout /></ProtectedRoute>,
    errorElement: <GlobalErrorBoundary />,
    children: [
      { index: true, element: <HomeScreen /> },
      { path: 'chanting', element: <ChantingScreen /> },
      { path: 'community/experiences', element: <CommunityExperiencesScreen /> },
      { path: 'community/voice', element: <CommunityVoiceScreen /> },
      { path: 'adhyayan', element: <AdhyayanScreen /> },
      { path: 'aiguru', element: <AIGuruScreen /> },
      { path: 'store', element: <StoreScreen /> },
      { path: 'profile', element: <ProfileScreen /> },
    ],
  },
  { path: '/profile/settings', element: <ProtectedRoute><SettingsScreen /></ProtectedRoute> },
  { path: '/profile/edit', element: <ProtectedRoute><EditProfileScreen /></ProtectedRoute> },
  { path: '/profile/notifications', element: <ProtectedRoute><NotificationsScreen /></ProtectedRoute> },
  { path: '/profile/about', element: <AboutScreen /> },
  { path: '/profile/orders', element: <ProtectedRoute><OrdersScreen /></ProtectedRoute> },
  { path: '/profile/downloads', element: <ProtectedRoute><DownloadsScreen /></ProtectedRoute> },
  { path: '/profile/history', element: <ProtectedRoute><HistoryScreen /></ProtectedRoute> },
  { path: '/profile/bookmarks', element: <ProtectedRoute><BookmarksScreen /></ProtectedRoute> },
  { path: '/profile/wishlist', element: <ProtectedRoute><WishlistScreen /></ProtectedRoute> },
  { path: '/profile/privacy', element: <PrivacyPolicyScreen /> },
  { path: '/info/refunds', element: <RefundPolicyScreen /> },
  { path: '/info/shipping', element: <ShippingPolicyScreen /> },
  { path: '/profile/contact', element: <ContactScreen /> },
  { path: '/info/founder', element: <FounderScreen /> },
  { path: '/info/mission', element: <MissionScreen /> },
  { path: '/info/terms', element: <TermsScreen /> },
  { path: '/info/gallery', element: <GalleryScreen /> },

  // Public Compliance & Support Routes
  { path: '/info/faq', element: <FAQScreen /> },
  { path: '/info/community-guidelines', element: <CommunityGuidelinesScreen /> },
  { path: '/info/copyright', element: <CopyrightPolicyScreen /> },
  { path: '/info/disclaimer', element: <DisclaimerScreen /> },
  { path: '/info/data-safety', element: <DataSafetyScreen /> },
  { path: '/info/cookie-policy', element: <CookiePolicyScreen /> },
  { path: '/info/user-agreement', element: <UserAgreementScreen /> },
  { path: '/info/account-deletion', element: <AccountDeletionScreen /> },
  { path: '/adhyayan/category/:id', element: <ProtectedRoute><CategoryDetailsScreen /></ProtectedRoute> },
  { path: '/adhyayan/video/:id', element: <ProtectedRoute><VideoPlayerScreen /></ProtectedRoute> },
  { path: '/adhyayan/pdf/:id', element: <ProtectedRoute><PDFViewerScreen /></ProtectedRoute> },
  { path: '/adhyayan/scripture/:id', element: <ProtectedRoute><ScriptureReaderScreen /></ProtectedRoute> },
  { path: '/store/product/:id', element: <ProtectedRoute><ProductDetailsScreen /></ProtectedRoute> },
  { path: '/store/cart', element: <ProtectedRoute><CartScreen /></ProtectedRoute> },
  { path: '/store/checkout', element: <ProtectedRoute><CheckoutScreen /></ProtectedRoute> },
  { path: '/store/order-success', element: <ProtectedRoute><OrderSuccessScreen /></ProtectedRoute> },
  { path: '/store/track-order/:id', element: <ProtectedRoute><TrackOrderScreen /></ProtectedRoute> },
  { path: '/search', element: <ProtectedRoute><SearchScreen /></ProtectedRoute> },
  { path: '/panchang', element: <ProtectedRoute><PanchangScreen /></ProtectedRoute> },
  { path: '/events', element: <ProtectedRoute><EventsScreen /></ProtectedRoute> },
  { path: '/blog', element: <ProtectedRoute><BlogScreen /></ProtectedRoute> },
  { path: '/quotes', element: <ProtectedRoute><QuotesScreen /></ProtectedRoute> },
  
  // Spiritual Quiz Routes
  { path: '/quiz', element: <ProtectedRoute><QuizDashboard /></ProtectedRoute> },
  { path: '/quiz/leaderboard', element: <ProtectedRoute><SpiritualLeaderboard /></ProtectedRoute> },
  { path: '/quiz/user/:userId', element: <ProtectedRoute><PublicUserProfile /></ProtectedRoute> },
  { path: '/quiz/subject/:subjectId', element: <ProtectedRoute><SubjectDetail /></ProtectedRoute> },
  { path: '/quiz/play/:quizId', element: <ProtectedRoute><QuizPlay /></ProtectedRoute> },
  { path: '/quiz/result/:sessionId', element: <ProtectedRoute><QuizResult /></ProtectedRoute> },
  
  // Aliases for clean sharing URLs
  { path: '/product/:id', element: <ProtectedRoute><ProductDetailsScreen /></ProtectedRoute> },
  { path: '/video/:id', element: <ProtectedRoute><VideoPlayerScreen /></ProtectedRoute> },
  { path: '/reel/:id', element: <ProtectedRoute><VideoPlayerScreen /></ProtectedRoute> },
  { path: '/category/:id', element: <ProtectedRoute><CategoryDetailsScreen /></ProtectedRoute> },
  { path: '/event/:id', element: <ProtectedRoute><EventsScreen /></ProtectedRoute> },
  { path: '/quote/:id', element: <PublicQuoteScreen /> },

  { path: '/open/:id', element: <ContentResolver /> },
  { path: '*', element: <NotFoundScreen /> },
]);

export const AppRouter = () => {
  const { isSplashComplete } = useAppStore();
  const { isLoading: authLoading } = useAuthStore();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      
    const checkClipboardForContentId = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          const { type, value } = await Clipboard.read();
          if (type === 'text/plain' && value) {
            const match = value.match(/Content ID:\s*([A-Za-z0-9_-]{10,30})/i);
            if (match && match[1]) {
              const docId = match[1];
              // To prevent infinite loop if they keep the clipboard same, we should use a session storage flag
              const lastOpened = sessionStorage.getItem('lastOpenedDocId');
              if (lastOpened !== docId) {
                sessionStorage.setItem('lastOpenedDocId', docId);
                router.navigate('/open/' + docId);
              }
            }
          }
        }
      } catch (e) {
        console.error('Clipboard read error', e);
      }
    };
    checkClipboardForContentId();
    
    // Also listen to app state changes to check clipboard when resuming
    if (Capacitor.isNativePlatform()) {
      CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          checkClipboardForContentId();
        }
      });
    }

      CapacitorApp.addListener('appUrlOpen', (data) => {
        try {
          
          const url = new URL(data.url);
          if (url.searchParams.has('id')) {
            router.navigate('/open/' + url.searchParams.get('id'));
          } else if (url.pathname && url.pathname.length > 5 && !url.pathname.includes('/')) {
             // likely just an ID in the URL root
             router.navigate('/open/' + url.pathname.replace('/', ''));
          } else if (url.pathname) {

            router.navigate(url.pathname + url.search);
          }
        } catch (e) {
          console.error('Deep link error', e);
        }
      });

      // Handle native back button on Android safely
      CapacitorApp.addListener('backButton', () => {
        const path = window.location.pathname;
        if (path === '/' || path === '/login' || !window.history.state || window.history.state.idx === 0) {
          CapacitorApp.exitApp();
        } else {
          window.history.back();
        }
      });
    }
  }, []);

  if (!isSplashComplete || authLoading) {
    return <SplashScreen />;
  }

  return <RouterProvider router={router} />;
};
