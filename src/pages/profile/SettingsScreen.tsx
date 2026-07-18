import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Moon,
  Sun,
  Bell,
  Download,
  Monitor,
  Globe,
  Shield,
  Smartphone,
  Settings as SettingsIcon,
  Info,
  X,
  Save,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useQueryClient } from "@tanstack/react-query";
import { db } from "../../firebase/config";
import { doc, setDoc } from "firebase/firestore";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import { SecureImage } from "../../components/common/SecureImage";
import { useGoBack } from "../../hooks/useGoBack";

export const SettingsScreen = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { settings, officialDetails } = useAppSettings();

  const {
    isDarkMode,
    toggleDarkMode,
    pushNotifications,
    togglePushNotifications,
    videoQuality,
    setVideoQuality,
    downloadQuality,
    setDownloadQuality,
    language,
    setLanguage,
  } = useAppStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const handleToggleDarkMode = async () => {
    toggleDarkMode();
    const newTheme = !isDarkMode;
    if (user && user.uid) {
      try {
        const userRef = doc(db, "users", user.uid);
        await setDoc(
          userRef,
          { settings: { isDarkMode: newTheme } },
          { merge: true },
        );
      } catch (error) {
        console.error("Error saving theme preference:", error);
      }
    }
  };

  const handleClearCache = () => {
    queryClient.clear();
    alert("Cache cleared successfully!");
  };

  const SettingsSection = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="mb-6">
      <h3 className="px-2 text-xs font-bold text-brown-light/70 dark:text-slate-400 uppercase tracking-wider mb-2">
        {title}
      </h3>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-orange-100 dark:border-slate-700 overflow-hidden">
        {children}
      </div>
    </div>
  );

  const SettingsItem = ({
    icon: Icon,
    title,
    subtitle,
    rightElement,
    onClick,
  }: any) => (
    <div
      className="flex items-center justify-between p-4 border-b border-orange-50 dark:border-slate-700 last:border-0 hover:bg-orange-50 dark:hover:bg-slate-700/50 transition-colors"
      onClick={onClick}
      role={onClick ? "button" : "presentation"}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-orange-50 dark:bg-slate-700/50 text-brown-dark dark:text-slate-300">
          <Icon size={18} />
        </div>
        <div>
          <h4 className="font-medium text-sm text-brown-dark dark:text-slate-200">
            {title}
          </h4>
          {subtitle && (
            <p className="text-xs text-brown-light dark:text-slate-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div>{rightElement}</div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-orange-50 dark:bg-slate-900 transition-colors">
      <header className="px-4 py-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-30 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => goBack()}
            className="p-2 -ml-2 text-brown-dark dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-full transition"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold font-sans text-brown-dark dark:text-white">
            Settings
          </h1>
        </div>
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
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-12">
        <SettingsSection title="Appearance">
          <SettingsItem
            icon={isDarkMode ? Moon : Sun}
            title="Dark Mode"
            subtitle="Toggle application theme"
            onClick={handleToggleDarkMode}
            rightElement={
              <button
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${isDarkMode ? "bg-saffron" : "bg-slate-300"}`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow-md absolute transition-transform ${isDarkMode ? "translate-x-7" : "translate-x-1"}`}
                ></div>
              </button>
            }
          />
        </SettingsSection>

        <SettingsSection title="Video & Audio">
          <SettingsItem
            icon={Smartphone}
            title="Default Video Quality"
            subtitle={`${videoQuality} (Recommended)`}
            onClick={() => {
              const q =
                videoQuality === "Auto"
                  ? "720p"
                  : videoQuality === "720p"
                    ? "1080p"
                    : "Auto";
              setVideoQuality(q as any);
            }}
            rightElement={
              <span className="text-saffron text-sm font-bold cursor-pointer">
                {videoQuality}
              </span>
            }
          />
          <SettingsItem
            icon={Download}
            title="Download Quality"
            subtitle={downloadQuality}
            onClick={() => {
              const q = downloadQuality === "720p" ? "1080p" : "720p";
              setDownloadQuality(q as any);
            }}
            rightElement={
              <span className="text-saffron text-sm font-bold cursor-pointer">
                {downloadQuality}
              </span>
            }
          />
        </SettingsSection>

        <SettingsSection title="Notifications">
          <SettingsItem
            icon={Bell}
            title="Push Notifications"
            subtitle="Receive daily quotes and updates"
            onClick={togglePushNotifications}
            rightElement={
              <button
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${pushNotifications ? "bg-saffron" : "bg-slate-300"}`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow-md absolute transition-transform ${pushNotifications ? "translate-x-7" : "translate-x-1"}`}
                ></div>
              </button>
            }
          />
        </SettingsSection>

        <SettingsSection title="General">
          <SettingsItem
            icon={Globe}
            title="App Language"
            subtitle={language}
            onClick={() =>
              setLanguage(language === "English" ? "Hindi" : "English")
            }
            rightElement={
              <span className="text-saffron text-sm font-bold cursor-pointer">
                {language}
              </span>
            }
          />
          <SettingsItem
            icon={Shield}
            title="Clear Cache"
            subtitle="Free up storage space"
            onClick={handleClearCache}
            rightElement={
              <button className="text-xs bg-orange-100 dark:bg-slate-700 text-brown-dark dark:text-white px-3 py-1.5 rounded-lg font-bold">
                Clear
              </button>
            }
          />
          <SettingsItem
            icon={Info}
            title={`About ${officialDetails.organizationName}`}
            subtitle={`${officialDetails.organizationName} - ${officialDetails.tagline}`}
            onClick={() => navigate("/profile/about")}
            rightElement={
              <span className="text-xs text-saffron font-bold">View</span>
            }
          />
        </SettingsSection>
      </div>
    </div>
  );
};
