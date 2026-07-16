import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRealtimeCollection } from '../hooks/useRealtimeCollection';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface PaymentSettings {
  enabled: boolean;
  onlinePayment: boolean;
  testMode: boolean;
  keyId: string;
  paymentMode: string;
  razorpayTestKeyId: string;
  razorpayLiveKeyId: string;
  paymentEnabled: boolean;
  upiEnabled: boolean;
  gpayEnabled: boolean;
  phonepeEnabled: boolean;
  paytmEnabled: boolean;
  bhimEnabled: boolean;
  merchantUpiId: string;
  merchantName: string;
}

export interface ShippingSettings {
  shiprocketEnabled: boolean;
  shiprocketEmail?: string;
  shiprocketPassword?: string;
  freeShippingEnabled?: boolean;
  freeShippingThreshold?: number;
}

interface AppSettings {
  appName: string;
  appUrl?: string;
  appLogo: string;
  splashLogo: string;
  splashBackground: string;
  appVersion: string;
  appTagline: string;
  themeColors: {
    primary: string;
    secondary: string;
    accent: string;
    golden: string;
    orange: string;
    textDark: string;
    textLight: string;
  };
  fonts: {
    sans: string;
    mukta: string;
    devanagari: string;
  };
  features: {
    maintenanceMode: boolean;
    announcementBar: {
      enabled: boolean;
      text: string;
      link: string;
      bgColor: string;
      textColor: string;
    };
    downloads: boolean;
    wishlist: boolean;
    savedQuotes: boolean;
    naamJap: boolean;
    community: boolean;
  };
  shareConfig?: {
    baseUrl: string;
    appUrl: string;
    shareEnabled: boolean;
    deepLinkEnabled: boolean;
    defaultTitle: string;
    defaultDescription: string;
    footerMessage: string;
    defaultMessage: string;
    socialCaption: string;
  };
  buttons: any[]; // dynamic buttons
}

interface HomepageSection {
  id: string;
  type: string; // 'hero', 'daily_quote', 'panchang', 'latest_videos', 'featured_products', 'founder_message', 'upcoming_events', 'community', 'testimonials', etc.
  title: string;
  subtitle?: string;
  show: boolean;
  displayOrder: number;
  [key: string]: any;
}

interface NavigationItem {
  id: string;
  name: string;
  icon: string;
  destination: string;
  show: boolean;
  displayOrder: number;
  type: 'bottom' | 'drawer' | 'profile' | 'quick_action' | 'floating';
}

interface AppSettingsContextType {
  settings: AppSettings | null;
  homepageSections: HomepageSection[];
  navigationItems: NavigationItem[];
  paymentSettings: PaymentSettings;
  shippingSettings: ShippingSettings;
  loading: boolean;
}

export const getFallbackPaymentSettings = (): PaymentSettings => {
  const envKey = import.meta.env.VITE_RAZORPAY_KEY || 
                 import.meta.env.VITE_RAZORPAY_LIVE_KEY_ID || 
                 "rzp_live_T91BWZao0CJ2Bi";
  return {
    enabled: true,
    onlinePayment: true,
    testMode: false,
    keyId: envKey,
    paymentMode: "live",
    razorpayTestKeyId: "",
    razorpayLiveKeyId: envKey,
    paymentEnabled: true,
    upiEnabled: true,
    gpayEnabled: true,
    phonepeEnabled: true,
    paytmEnabled: true,
    bhimEnabled: true,
    merchantUpiId: "",
    merchantName: "Hari Pathshala",
  };
};

export const getFallbackShippingSettings = (): ShippingSettings => {
  return {
    shiprocketEnabled: true,
    shiprocketEmail: import.meta.env.VITE_SHIPROCKET_EMAIL || "swamiajay9783@gmail.com",
    shiprocketPassword: import.meta.env.VITE_SHIPROCKET_PASSWORD || "$p0FvTP%8fa6PItUtHcKCtkm&JW2wbL%",
    freeShippingEnabled: false,
    freeShippingThreshold: 999999,
  };
};

const defaultSettings: AppSettings = {
  appName: 'Hari Pathshala',
  appUrl: 'https://play.google.com/store/apps/details?id=com.haripathshala',
  appLogo: '/logo.png',
  splashLogo: '/logo.png',
  splashBackground: '',
  appVersion: '1.0.0',
  appTagline: 'Your Spiritual Journey Begins Here',
  themeColors: {
    primary: '#FF9933',
    secondary: '#FFB366',
    accent: '#CC7A29',
    golden: '#FFD700',
    orange: '#FF5722',
    textDark: '#3E2723',
    textLight: '#5D4037',
  },
  fonts: {
    sans: '"Poppins", sans-serif',
    mukta: '"Mukta", sans-serif',
    devanagari: '"Noto Sans Devanagari", sans-serif',
  },
  features: {
    maintenanceMode: false,
    announcementBar: {
      enabled: false,
      text: '',
      link: '',
      bgColor: '#FF9933',
      textColor: '#FFFFFF',
    },
    downloads: true,
    wishlist: true,
    savedQuotes: true,
    naamJap: true,
    community: true,
  },
  shareConfig: {
    baseUrl: 'https://haripathshala.online',
    appUrl: 'https://play.google.com/store/apps/details?id=com.haripathshala.app',
    shareEnabled: true,
    deepLinkEnabled: true,
    defaultTitle: 'Hari Pathshala - Spiritual Education',
    defaultDescription: 'Discover inner peace with premium spiritual courses and authentic Puja items.',
    footerMessage: 'Download Hari Pathshala app for more.',
    defaultMessage: 'Check this out on Hari Pathshala!',
    socialCaption: 'Jai Siyaram 🙏',
  },
  buttons: [],
};

const defaultHomepageSections: HomepageSection[] = [
  { id: 'daily_quote', type: 'daily_quote', title: 'Daily Divine Wisdom', show: true, displayOrder: 1 },
  { id: 'daily_chanting', type: 'daily_chanting', title: 'Daily Ram Naam', subtitle: 'Start your daily chanting practice', show: true, displayOrder: 2 },
  { id: 'panchang', type: 'panchang', title: "Today's Panchang", show: true, displayOrder: 3 },
  { id: 'latest_videos', type: 'latest_videos', title: 'Latest Adhyayan', show: true, displayOrder: 4 },
  { id: 'spiritual_categories', type: 'spiritual_categories', title: 'Explore Path', show: true, displayOrder: 5 },
  { id: 'mission', type: 'mission', title: 'Our Mission', subtitle: 'Spreading the divine wisdom of Sanatan Dharma to every household, making spiritual education free, accessible, and life-changing.', show: true, displayOrder: 6 },
  { id: 'doha', type: 'doha', title: 'Ramcharitmanas Doha', show: true, displayOrder: 7 },
  { id: 'featured_quote', type: 'featured_quote', title: 'Featured Quote', show: true, displayOrder: 8 },
  { id: 'featured_products', type: 'featured_products', title: 'Devotional Store', show: true, displayOrder: 9 },
  { id: 'community', type: 'community', title: 'Community', show: true, displayOrder: 11 },
  { id: 'upcoming_events', type: 'upcoming_events', title: 'Upcoming Event', show: true, displayOrder: 12 },
  { id: 'testimonials', type: 'testimonials', title: 'What Devotees Say', show: true, displayOrder: 13 },
  { id: 'faq', type: 'faq', title: 'Frequently Asked Questions', show: true, displayOrder: 14 },
  { id: 'quick_links', type: 'quick_links', title: 'Quick Links', show: true, displayOrder: 15 },
  { id: 'footer', type: 'footer', title: 'Footer', show: true, displayOrder: 16 },
];

const AppSettingsContext = createContext<AppSettingsContextType>({
  settings: defaultSettings,
  homepageSections: defaultHomepageSections,
  navigationItems: [],
  paymentSettings: getFallbackPaymentSettings(),
  shippingSettings: getFallbackShippingSettings(),
  loading: true,
});

export const AppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: dbSettings, loading: loadingSettings } = useRealtimeCollection<any>('app_settings');
  const { data: dbHomepage, loading: loadingHomepage } = useRealtimeCollection<HomepageSection>('homepage_sections');
  const { data: dbNavigation, loading: loadingNavigation } = useRealtimeCollection<NavigationItem>('navigation');

  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [homepageSections, setHomepageSections] = useState<HomepageSection[]>(defaultHomepageSections);
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(getFallbackPaymentSettings());
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>(getFallbackShippingSettings());
  const [loadingPayment, setLoadingPayment] = useState(true);
  const [loadingShipping, setLoadingShipping] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingPayment(false);
      setLoadingShipping(false);
    }, 1200);

    const unsubPayment = onSnapshot(
      doc(db, "settings", "payment"),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPaymentSettings((prev) => ({
            ...prev,
            ...data,
            keyId: data.keyId || prev.keyId,
          }));
        } else {
          setPaymentSettings(getFallbackPaymentSettings());
        }
        setLoadingPayment(false);
      },
      (error) => {
        console.warn("Payment settings Firestore listener failed, using env fallbacks:", error);
        setPaymentSettings(getFallbackPaymentSettings());
        setLoadingPayment(false);
      }
    );

    const unsubShipping = onSnapshot(
      doc(db, "settings", "shipping"),
      (docSnap) => {
        if (docSnap.exists()) {
          setShippingSettings((prev) => ({
            ...prev,
            ...docSnap.data(),
          }));
        } else {
          setShippingSettings(getFallbackShippingSettings());
        }
        setLoadingShipping(false);
      },
      (error) => {
        console.warn("Shipping settings Firestore listener failed, using env fallbacks:", error);
        setShippingSettings(getFallbackShippingSettings());
        setLoadingShipping(false);
      }
    );

    return () => {
      clearTimeout(timer);
      unsubPayment();
      unsubShipping();
    };
  }, []);

  useEffect(() => {
    if (dbSettings && dbSettings.length > 0) {
      const globalConfig = dbSettings.find((s: any) => s.id === 'global_config') || dbSettings[0];
      if (globalConfig) {
        setSettings((prev) => ({
          ...prev,
          ...globalConfig,
          appLogo: '/logo.png',
          splashLogo: '/logo.png',
          themeColors: { ...prev.themeColors, ...globalConfig.themeColors },
          fonts: { ...prev.fonts, ...globalConfig.fonts },
          features: { ...prev.features, ...globalConfig.features },
          shareConfig: globalConfig.shareConfig ? { ...prev.shareConfig, ...globalConfig.shareConfig } : prev.shareConfig,
        }));
      }
    }
  }, [dbSettings]);

  useEffect(() => {
    if (dbHomepage && dbHomepage.length > 0) {
      // Map both by type and id for full flexibility
      const dbMap = new Map<string, HomepageSection>();
      dbHomepage.forEach(s => {
        if (s.type) dbMap.set(s.type, s);
        if (s.id) dbMap.set(s.id, s);
      });

      const merged = defaultHomepageSections.map(defSection => {
        const dbSection = dbMap.get(defSection.type) || dbMap.get(defSection.id);
        if (dbSection) {
          return {
            ...defSection,
            ...dbSection,
            // If show/isVisible is explicitly false in the db, then hide it; otherwise show it
            show: dbSection.show !== false && (dbSection as any).isVisible !== false,
            displayOrder: dbSection.displayOrder ?? (dbSection as any).order ?? defSection.displayOrder
          };
        }
        return defSection;
      });

      const sorted = merged.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setHomepageSections(sorted);
    } else {
      setHomepageSections(defaultHomepageSections);
    }
  }, [dbHomepage]);

  useEffect(() => {
    if (dbNavigation) {
      setNavigationItems(dbNavigation.filter(n => n.show !== false).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)));
    }
  }, [dbNavigation]);

  useEffect(() => {
    // Apply CSS Variables to root
    const root = document.documentElement;
    const colors = settings.themeColors;
    if (colors.primary) root.style.setProperty('--theme-primary', colors.primary);
    if (colors.secondary) root.style.setProperty('--theme-secondary', colors.secondary);
    if (colors.accent) root.style.setProperty('--theme-accent', colors.accent);
    if (colors.golden) root.style.setProperty('--theme-golden', colors.golden);
    if (colors.orange) root.style.setProperty('--theme-orange', colors.orange);
    if (colors.textDark) root.style.setProperty('--theme-text-dark', colors.textDark);
    if (colors.textLight) root.style.setProperty('--theme-text-light', colors.textLight);

    const fonts = settings.fonts;
    if (fonts.sans) root.style.setProperty('--theme-font-sans', fonts.sans);
    if (fonts.mukta) root.style.setProperty('--theme-font-mukta', fonts.mukta);
    if (fonts.devanagari) root.style.setProperty('--theme-font-devanagari', fonts.devanagari);
  }, [settings]);

  return (
    <AppSettingsContext.Provider
      value={{
        settings,
        homepageSections,
        navigationItems,
        paymentSettings,
        shippingSettings,
        loading: loadingSettings || loadingHomepage || loadingNavigation || loadingPayment || loadingShipping,
      }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => useContext(AppSettingsContext);
