import React from "react";
import { SEO } from "../../components/SEO";
import { ArrowLeft, Cookie, HelpCircle, Bookmark, FileText } from "lucide-react";
import { useGoBack } from "../../hooks/useGoBack";
import { Footer } from "../../components/common/Footer";

export const CookiePolicyScreen = () => {
  const goBack = useGoBack();
  const lastUpdated = new Date().toLocaleDateString();

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-900 transition-colors pb-10">
      <SEO
        title="Cookie Policy | Hari Pathshala"
        description="Learn about our cookie policy, how we use local storage, session variables, and third-party tracking states to provide persistent profiles and secure shopping carts."
      />

      <header className="px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-orange-100/50 dark:border-slate-800/50 sticky top-0 z-30 flex items-center gap-4">
        <button
          onClick={() => goBack()}
          className="p-2 -ml-2 text-brown-dark dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-full transition"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold font-sans text-brown-dark dark:text-white flex items-center gap-2">
          <Cookie size={20} className="text-saffron-dark" /> Cookie Policy
        </h1>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-500/10 via-saffron/5 to-amber-500/5 dark:from-orange-500/5 dark:via-slate-900 dark:to-slate-900 py-12 px-6 text-center border-b border-orange-100/30 dark:border-slate-800/50">
        <div className="max-w-3xl mx-auto space-y-4">
          <span className="bg-saffron/10 dark:bg-saffron/20 text-saffron-dark dark:text-saffron text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            Web Technology
          </span>
          <h2 className="text-3xl font-black text-brown-dark dark:text-white font-sans tracking-tight">
            How We Use Cookies & Local Storage
          </h2>
          <p className="text-sm text-brown-light dark:text-slate-400 max-w-lg mx-auto">
            Understanding cookies, local tokens, session tokens, and cache systems to facilitate a seamless spiritual study workspace.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Table of Contents Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-2xl p-4 sticky top-24 shadow-sm">
            <h3 className="text-xs font-black text-brown-light dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1">
              <Bookmark size={14} /> Contents
            </h3>
            <ul className="space-y-2 text-xs font-bold text-brown-light dark:text-slate-400">
              <li><a href="#intro" className="hover:text-saffron block py-1">• 1. Introduction</a></li>
              <li><a href="#definition" className="hover:text-saffron block py-1">• 2. What are Cookies?</a></li>
              <li><a href="#use" className="hover:text-saffron block py-1">• 3. Why We Use Cookies</a></li>
              <li><a href="#categories" className="hover:text-saffron block py-1">• 4. Categories of Cookies We Use</a></li>
              <li><a href="#localstorage" className="hover:text-saffron block py-1">• 5. Local Storage & Mobile State</a></li>
              <li><a href="#control" className="hover:text-saffron block py-1">• 6. Managing Cookie Choices</a></li>
              <li><a href="#updates" className="hover:text-saffron block py-1">• 7. Revisions & Support Desk</a></li>
            </ul>
          </div>
        </div>

        {/* Content Body */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 p-8 rounded-3xl shadow-sm space-y-8 text-brown-dark dark:text-slate-200">
          
          <div className="flex items-center justify-between border-b border-orange-50 dark:border-slate-800/80 pb-4">
            <span className="text-xs bg-orange-100 dark:bg-slate-800 text-saffron-dark dark:text-saffron font-black px-3 py-1 rounded-full uppercase tracking-wider">
              Document Ref: HP-CK-2026
            </span>
            <span className="text-xs text-brown-light dark:text-slate-400">
              Last Updated: {lastUpdated}
            </span>
          </div>

          {/* Section 1 */}
          <section id="intro" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">1.</span> Introduction
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              This Cookie Policy explain how Hari Pathshala uses cookies, local storage key-value parameters, and other similar web tracking technologies on our website (<strong>haripathshala.online</strong>) and inside our mobile application.
            </p>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              We design our digital temple to protect your data. We do not use third-party advertising cookie trackers to pitch irrelevant consumer products to you. This policy clarifies the necessary technical tokens required to run our spiritual courses, secure payments, and store personalized settings safely.
            </p>
          </section>

          {/* Section 2 */}
          <section id="definition" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">2.</span> What are Cookies?
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              Cookies are small text files sent by a website and stored by your internet browser onto your computer's hard drive or mobile device. They act as a memory log, allowing the website to recognize your device during a visit (session cookies) or across multiple visits (persistent cookies).
            </p>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              In addition to traditional browser cookies, our web application uses local storage, session storage, and browser IndexedDB caches to store state variables, routing histories, and user preference markers.
            </p>
          </section>

          {/* Section 3 */}
          <section id="use" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">3.</span> Why We Use Cookies
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              Cookies and local parameters are essential to enable core capabilities in our full-stack application. We use them for:
            </p>
            <ul className="space-y-2 text-sm text-brown-light dark:text-slate-300 list-disc pl-5">
              <li><strong>Authentication:</strong> Keeping you securely logged into your account as you navigate different sections of the scripture portal.</li>
              <li><strong>State Consistency:</strong> Remembering the verses you last read, your chanting logs, and active quiz sessions so you don't lose progress.</li>
              <li><strong>Shopping Cart:</strong> Retaining scriptures, beads, and books added to your shopping cart before you proceed to check out via Razorpay.</li>
              <li><strong>Visual Preferences:</strong> Storing your preferred theme choice (Dark Mode vs Light Mode) and font scaling size for Sanskrit shlokas.</li>
              <li><strong>Platform Security:</strong> Recognizing rapid-fire automated script logins and blocking malicious access triggers.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section id="categories" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">4.</span> Categories of Cookies We Use
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              We group cookies and local keys into three distinct functional categories:
            </p>
            <ul className="space-y-3 text-sm text-brown-light dark:text-slate-300 list-disc pl-5">
              <li>
                <strong>Strictly Necessary Cookies:</strong> These are vital to run basic features of our portal. They enable page navigation, user login sessions, secure checkout, and cross-site scripting guards. Without these, the website cannot function correctly.
              </li>
              <li>
                <strong>Functional & Preference Cookies:</strong> These enable enhanced personalization, such as saving your Sanskrit font sizes, remembering translation language preferences, and caching audio player tracks.
              </li>
              <li>
                <strong>Performance & Analytical Cookies:</strong> We use lightweight first-party analytics to measure aggregate visits, identify slow-loading pages, and diagnose routing bugs. We do not link these metrics to your personal identity.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section id="localstorage" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">5.</span> Local Storage & Mobile State
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              On mobile devices running via our Capacitor Android wrapper, standard web cookies are less common. Instead, we rely heavily on <strong>Local Storage</strong> and secure device keychains to preserve your active state.
            </p>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              This includes saving the JSON Web Token (JWT) needed to authenticate API queries, the sound files cache, and localized calendar sync keys. These values are securely isolated inside your phone's sandbox and are never accessed by other applications.
            </p>
          </section>

          {/* Section 6 */}
          <section id="control" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">6.</span> Managing Cookie Choices
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              You possess complete control over cookies and trackers. You can adjust your browser settings to:
            </p>
            <ul className="space-y-2 text-sm text-brown-light dark:text-slate-300 list-disc pl-5">
              <li>Block all or select categories of cookies.</li>
              <li>Receive notifications whenever a new cookie is set.</li>
              <li>Wipe all existing cookies and local storage parameters from your browser history.</li>
            </ul>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              Please note that blocking strictly necessary cookies will render you unable to log in, sync your chanting records, or complete payments on our platform.
            </p>
          </section>

          {/* Section 7 */}
          <section id="updates" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">7.</span> Revisions & Support Desk
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              We may revise this Cookie Policy occasionally to align with technical modifications or updated regulations under the DPDP Act. We encourage you to review this page periodically.
            </p>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              If you have any questions or require support managing your cookies or storage data, please contact our support desk at <strong>support@haripathshala.online</strong>.
            </p>
          </section>

        </div>

      </div>

      <Footer />
    </div>
  );
};
