import React from "react";
import { SEO } from "../../components/SEO";
import { ArrowLeft, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRealtimeCollection } from "../../hooks/useRealtimeCollection";
import { useGoBack } from "../../hooks/useGoBack";

export const PrivacyPolicyScreen = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { data: pages, loading } = useRealtimeCollection<any>("pages");
  const page = pages?.find((p) => p.id === "privacy" || p.slug === "privacy");

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-900 transition-colors pb-24">
      <SEO
        title={(page?.title || "Privacy Policy") + " | Hari Pathshala"}
        description="Privacy Policy."
      />

      <header className="px-4 py-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-30 shadow-sm flex items-center gap-3 border-b border-orange-50 dark:border-slate-800">
        <button
          onClick={() => goBack()}
          className="p-2 -ml-2 text-brown-dark dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-full transition"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold font-sans text-brown-dark dark:text-white flex items-center gap-2">
          <Shield size={18} /> {page?.title || "Privacy Policy"}
        </h1>
      </header>

      <div className="p-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-orange-100 dark:border-slate-700 prose prose-sm dark:prose-invert prose-orange max-w-none">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 not-prose">
              <div className="w-8 h-8 border-4 border-saffron border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm text-brown-light dark:text-slate-400">
                Loading your content...
              </p>
            </div>
          ) : page?.content ? (
            <div dangerouslySetInnerHTML={{ __html: page.content }}></div>
          ) : (
            <>
              <p className="text-brown-light dark:text-slate-300 font-bold mb-4">
                Your privacy is critically important to us.
              </p>

              <h2 className="text-brown-dark dark:text-white">
                1. Information We Collect
              </h2>
              <p className="text-brown-light dark:text-slate-300">
                We only collect information about you if we have a reason to do
                so—for example, to provide our Services, to communicate with
                you, or to make our Services better. This includes basic profile
                information and usage data like watch history and chanting
                statistics.
              </p>

              <h2 className="text-brown-dark dark:text-white">
                2. How We Use Information
              </h2>
              <p className="text-brown-light dark:text-slate-300">
                We use the information we collect to provide and maintain our
                services, to improve user experience, and to personalize content
                based on your spiritual journey.
              </p>

              <h2 className="text-brown-dark dark:text-white">
                3. Data Security
              </h2>
              <p className="text-brown-light dark:text-slate-300">
                We implement industry-standard security measures to protect your
                personal information. Your chanting data and personal notes are
                kept strictly confidential.
              </p>

              <h2 className="text-brown-dark dark:text-white">
                4. Third-Party Services
              </h2>
              <p className="text-brown-light dark:text-slate-300">
                We may use third-party services for analytics and payment
                processing. These services have their own privacy policies
                addressing how they use such information.
              </p>

              <p className="text-xs text-brown-light dark:text-slate-400 mt-8">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
