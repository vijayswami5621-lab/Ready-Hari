import React from "react";
import { SEO } from "../../components/SEO";
import { ArrowLeft, ScrollText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useRealtimeCollection } from "../../hooks/useRealtimeCollection";
import { useGoBack } from "../../hooks/useGoBack";

export const TermsScreen = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { data: pages, loading } = useRealtimeCollection<any>("pages");
  const page = pages?.find((p) => p.id === "terms" || p.slug === "terms");

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-900 transition-colors pb-24">
      <SEO
        title={(page?.title || "Terms & Conditions") + " | Hari Pathshala"}
        description="Terms and Conditions of use."
      />

      <header className="px-4 py-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-30 shadow-sm flex items-center gap-3 border-b border-orange-50 dark:border-slate-800">
        <button
          onClick={() => goBack()}
          className="p-2 -ml-2 text-brown-dark dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-full transition"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold font-sans text-brown-dark dark:text-white flex items-center gap-2">
          <ScrollText size={18} /> {page?.title || "Terms & Conditions"}
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
              <h2 className="text-brown-dark dark:text-white">
                1. Acceptance of Terms
              </h2>
              <p className="text-brown-light dark:text-slate-300">
                By accessing and using Hari Pathshala, you accept and agree to
                be bound by the terms and provision of this agreement.
              </p>

              <h2 className="text-brown-dark dark:text-white">
                2. Use of Content
              </h2>
              <p className="text-brown-light dark:text-slate-300">
                All spiritual content, including videos, texts, and audio
                provided on this platform is for educational and spiritual
                purposes. You may not modify, publish, transmit, participate in
                the transfer or sale, create derivative works, or in any way
                exploit, any of the content, in whole or in part.
              </p>

              <h2 className="text-brown-dark dark:text-white">
                3. User Account
              </h2>
              <p className="text-brown-light dark:text-slate-300">
                To access certain features of the platform, you may be required
                to create an account. You are responsible for maintaining the
                confidentiality of your account and password.
              </p>

              <h2 className="text-brown-dark dark:text-white">
                4. Community Guidelines
              </h2>
              <p className="text-brown-light dark:text-slate-300">
                Users must maintain decorum and respect when participating in
                community discussions. Any form of hate speech, disrespect
                towards any religion, or inappropriate content will lead to
                immediate account termination.
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
