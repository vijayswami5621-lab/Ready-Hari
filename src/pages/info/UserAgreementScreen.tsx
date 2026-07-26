import React from "react";
import { SEO } from "../../components/SEO";
import { ArrowLeft, UserCheck, HelpCircle, Bookmark, FileText } from "lucide-react";
import { useGoBack } from "../../hooks/useGoBack";
import { Footer } from "../../components/common/Footer";

export const UserAgreementScreen = () => {
  const goBack = useGoBack();
  const lastUpdated = new Date().toLocaleDateString();

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-900 transition-colors pb-10">
      <SEO
        title="User Agreement | Hari Pathshala"
        description="Review the complete User Agreement and terms of service of Hari Pathshala, covering registration requirements, shopping policies, and user behavior rules."
      />

      <header className="px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-orange-100/50 dark:border-slate-800/50 sticky top-0 z-30 flex items-center gap-4">
        <button
          onClick={() => goBack()}
          className="p-2 -ml-2 text-brown-dark dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-full transition"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold font-sans text-brown-dark dark:text-white flex items-center gap-2">
          <UserCheck size={20} className="text-saffron-dark" /> User Agreement
        </h1>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-500/10 via-saffron/5 to-amber-500/5 dark:from-orange-500/5 dark:via-slate-900 dark:to-slate-900 py-12 px-6 text-center border-b border-orange-100/30 dark:border-slate-800/50">
        <div className="max-w-3xl mx-auto space-y-4">
          <span className="bg-saffron/10 dark:bg-saffron/20 text-saffron-dark dark:text-saffron text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            Terms of Service
          </span>
          <h2 className="text-3xl font-black text-brown-dark dark:text-white font-sans tracking-tight">
            User Agreement & Service Terms
          </h2>
          <p className="text-sm text-brown-light dark:text-slate-400 max-w-lg mx-auto">
            Please read this contract carefully. By using our services, you agree to these mutual rules and responsibilities.
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
              <li><a href="#eligibility" className="hover:text-saffron block py-1">• 2. Eligibility & Registration</a></li>
              <li><a href="#conduct" className="hover:text-saffron block py-1">• 3. Account Responsibilities</a></li>
              <li><a href="#intellectual" className="hover:text-saffron block py-1">• 4. Intellectual Property Rights</a></li>
              <li><a href="#purchases" className="hover:text-saffron block py-1">• 5. Purchases & Merchant Terms</a></li>
              <li><a href="#content" className="hover:text-saffron block py-1">• 6. User-Generated Submissions</a></li>
              <li><a href="#disputes" className="hover:text-saffron block py-1">• 7. Dispute Resolution & Governing Law</a></li>
            </ul>
          </div>
        </div>

        {/* Content Body */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 p-8 rounded-3xl shadow-sm space-y-8 text-brown-dark dark:text-slate-200">
          
          <div className="flex items-center justify-between border-b border-orange-50 dark:border-slate-800/80 pb-4">
            <span className="text-xs bg-orange-100 dark:bg-slate-800 text-saffron-dark dark:text-saffron font-black px-3 py-1 rounded-full uppercase tracking-wider">
              Document Ref: HP-UA-2026
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
              Welcome to Hari Pathshala. This User Agreement ('Agreement') is a legally binding contract between you ('User', 'your', or 'you') and Hari Pathshala ('we', 'us', 'our', or 'Hari Pathshala'), governing your access to and use of our mobile application, web application (located at <strong>haripathshala.online</strong>), and all services, e-commerce modules, APIs, courses, and AI Guru assistants.
            </p>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              By registering an account, making a purchase, or navigating any part of our platform, you acknowledge that you have read, understood, and solemnly agreed to be bound by all the terms of this User Agreement. If you do not agree to these terms, you are forbidden from accessing our services.
            </p>
          </section>

          {/* Section 2 */}
          <section id="eligibility" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">2.</span> Eligibility & Registration
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              To create an account and access the core interactive features of our platform, you must be at least 13 years of age. If you are under 18 years of age, you represent that you have received parental or legal guardian consent to register and use our platform.
            </p>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              You agree to provide accurate, current, and complete information during registration (such as email, mobile number, and name) and keep this profile updated. Registering under false names, using proxy coordinates to bypass local regulations, or setting up multiple duplicate accounts is strictly forbidden.
            </p>
          </section>

          {/* Section 3 */}
          <section id="conduct" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">3.</span> Account Responsibilities & Security
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              You are solely responsible for maintaining the confidentiality of your login credentials (username and password) and for all activities that occur under your account. You agree to notify our security desk immediately of any unauthorized use of your credentials or any security breach.
            </p>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              We reserve the right, at our absolute discretion, to monitor user interactions, modify profile handles, temporarily suspend features, or permanently terminate accounts if we identify violations of our Community Guidelines or identify malicious behaviors that compromise database performance or user safety.
            </p>
          </section>

          {/* Section 4 */}
          <section id="intellectual" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">4.</span> Intellectual Property Rights
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              The platform, including all custom graphics, branding, sound files, translations, scripture databases, commentaries, AI Guru prompts, and application source code, represents the exclusive intellectual property of Hari Pathshala.
            </p>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              We grant you a limited, non-exclusive, non-transferable, revocable license to access our platform for personal, non-commercial spiritual education. Any bulk scraping, automated data mining, commercial reproduction of our translations, or redistribution of our audio recitations without written permission is strictly prohibited and subject to legal action under the Indian Copyright Act, 1957.
            </p>
          </section>

          {/* Section 5 */}
          <section id="purchases" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">5.</span> Purchases, Store & Razorpay Terms
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              When buying physical books, scriptures, puja accessories, or enrolling in paid spiritual courses via our Divine Store, you agree that:
            </p>
            <ul className="space-y-2 text-sm text-brown-light dark:text-slate-300 list-disc pl-5">
              <li>Your purchases are securely processed through Razorpay, our third-party payment gateway. You agree to comply with Razorpay's terms of service during payments.</li>
              <li>You will pay all listed costs, including applicable taxes and shipping charges.</li>
              <li>All physical goods will be shipped in compliance with our Shipping & Delivery Policy.</li>
              <li>All refunds, returns, or order cancellations are strictly governed by our Refund & Cancellation Policy.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section id="content" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">6.</span> User-Generated Submissions
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              If you post any comment, feedback, review, or sadhana notes in public forums on Hari Pathshala, you grant us an unconditional, perpetual, royalty-free, worldwide license to display, translate, host, or distribute your content in connection with our spiritual propagation efforts.
            </p>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              You warrant that your submissions do not infringe on any third-party copyrights, violate anyone's privacy, or promote hatred or sect-based trolling. Offensive content will be deleted without warning, and the author's account may be restricted.
            </p>
          </section>

          {/* Section 7 */}
          <section id="disputes" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">7.</span> Dispute Resolution & Governing Law
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              This Agreement, your access to our services, and all transactions shall be governed by and construed in accordance with the laws of India, without regard to conflict of law principles.
            </p>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300 font-bold">
              Any dispute, controversy, claim, or difference arising out of or in connection with this agreement shall be submitted to the exclusive jurisdiction of the competent courts in Jaipur, Rajasthan, India.
            </p>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              If you have any feedback or seek resolution to complaints, we invite you to email our compliance desk at <strong>support@haripathshala.online</strong> before taking formal actions, and we will work sincerely to resolve your issues within 14 business days.
            </p>
          </section>

        </div>

      </div>

      <Footer />
    </div>
  );
};
