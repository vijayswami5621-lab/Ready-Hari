import React from "react";
import { SEO } from "../../components/SEO";
import { ArrowLeft, ShieldCheck, HelpCircle, Bookmark, FileText } from "lucide-react";
import { useGoBack } from "../../hooks/useGoBack";
import { Footer } from "../../components/common/Footer";

export const DataSafetyScreen = () => {
  const goBack = useGoBack();
  const lastUpdated = new Date().toLocaleDateString();

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-900 transition-colors pb-10">
      <SEO
        title="Data Safety | Hari Pathshala"
        description="Learn about our rigorous data safety standards, transit encryption, database security, and user control features built to protect your private spiritual workspace."
      />

      <header className="px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-orange-100/50 dark:border-slate-800/50 sticky top-0 z-30 flex items-center gap-4">
        <button
          onClick={() => goBack()}
          className="p-2 -ml-2 text-brown-dark dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-full transition"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold font-sans text-brown-dark dark:text-white flex items-center gap-2">
          <ShieldCheck size={20} className="text-saffron-dark" /> Data Safety
        </h1>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-500/10 via-saffron/5 to-amber-500/5 dark:from-orange-500/5 dark:via-slate-900 dark:to-slate-900 py-12 px-6 text-center border-b border-orange-100/30 dark:border-slate-800/50">
        <div className="max-w-3xl mx-auto space-y-4">
          <span className="bg-saffron/10 dark:bg-saffron/20 text-saffron-dark dark:text-saffron text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            Data Privacy
          </span>
          <h2 className="text-3xl font-black text-brown-dark dark:text-white font-sans tracking-tight">
            Protecting Your Spiritual Profile
          </h2>
          <p className="text-sm text-brown-light dark:text-slate-400 max-w-lg mx-auto">
            Review how your profile, chanting logs, quiz performance, and payment transactions are secured with industry-standard encryption.
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
              <li><a href="#intro" className="hover:text-saffron block py-1">• 1. Our Commitment</a></li>
              <li><a href="#encryption" className="hover:text-saffron block py-1">• 2. Encryption & Transit Safety</a></li>
              <li><a href="#collected" className="hover:text-saffron block py-1">• 3. Data We Collect</a></li>
              <li><a href="#usage" className="hover:text-saffron block py-1">• 4. How Data is Utilized</a></li>
              <li><a href="#sharing" className="hover:text-saffron block py-1">• 5. Strict Non-Sharing Policy</a></li>
              <li><a href="#rights" className="hover:text-saffron block py-1">• 6. User Rights & Data Export</a></li>
              <li><a href="#gdpr" className="hover:text-saffron block py-1">• 7. International Compliance Standards</a></li>
            </ul>
          </div>
        </div>

        {/* Content Body */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 p-8 rounded-3xl shadow-sm space-y-8 text-brown-dark dark:text-slate-200">
          
          <div className="flex items-center justify-between border-b border-orange-50 dark:border-slate-800/80 pb-4">
            <span className="text-xs bg-orange-100 dark:bg-slate-800 text-saffron-dark dark:text-saffron font-black px-3 py-1 rounded-full uppercase tracking-wider">
              Document Ref: HP-DS-2026
            </span>
            <span className="text-xs text-brown-light dark:text-slate-400">
              Last Updated: {lastUpdated}
            </span>
          </div>

          {/* Section 1 */}
          <section id="intro" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">1.</span> Our Commitment to Data Safety
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              At Hari Pathshala, we believe that spiritual learning is a deeply personal and sacred endeavor. We are fully committed to protecting your personal data, spiritual logs, and profile credentials with modern data security standards.
            </p>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              Our engineering systems are designed to provide absolute confidentiality. We treat your search queries, bookmark choices, and chanting progress with the utmost sensitivity. We never utilize your spiritual data to build advertising profiles, nor do we sell your contact information to third-party telemarketing networks.
            </p>
          </section>

          {/* Section 2 */}
          <section id="encryption" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">2.</span> Encryption & Transit Safety
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              To guarantee that your information remains impenetrable to malicious attackers, we implement high-level encryption standards across our full-stack architecture:
            </p>
            <ul className="space-y-2 text-sm text-brown-light dark:text-slate-300 list-disc pl-5">
              <li><strong>Data in Transit:</strong> All communication between your device (mobile app/web browser) and our cloud servers is encrypted using Secure Sockets Layer (SSL) and Transport Layer Security (TLS 1.3) protocols. This prevents eavesdropping or tampering.</li>
              <li><strong>Data at Rest:</strong> All user profiles, progress logs, and bookmarks are stored in Google Cloud's Firestore databases, which are protected with AES-256 server-side encryption.</li>
              <li><strong>Password Hashing:</strong> User login credentials are managed via Firebase Authentication, which secures accounts using advanced salted, cryptographic hashing algorithms. We do not store passwords in plain text, and our staff cannot read your password.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section id="collected" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">3.</span> Data We Collect
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              We only collect data that is strictly necessary to run the platform and deliver customized spiritual features:
            </p>
            <ul className="space-y-2 text-sm text-brown-light dark:text-slate-300 list-decimal pl-5">
              <li><strong>Profile Information:</strong> Name, email address, phone number, and a profile photo (optional).</li>
              <li><strong>Sadhana & Chanting Logs:</strong> Your daily chanting streaks, bookmarks, notes, and scripture reading progress.</li>
              <li><strong>E-Commerce Records:</strong> Delivery address, billing address, phone number, and purchase history (needed to deliver books and scriptures).</li>
              <li><strong>Quiz Performance:</strong> Answers, scores, and completion timestamps in our Spiritual Quiz Arena (needed to generate and verify your certificates).</li>
              <li><strong>API Interactions:</strong> Interactions with our AI Guru (needed to process responses and maintain conversation context).</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section id="usage" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">4.</span> How Your Data is Utilized
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              Your data is strictly processed to optimize your learning and engagement with Sanatan scriptures:
            </p>
            <ul className="space-y-2 text-sm text-brown-light dark:text-slate-300 list-disc pl-5">
              <li>To synchronize your reading progress, chanting bookmarks, and streaks in real-time across your phone, tablet, and computer.</li>
              <li>To answer your custom spiritual questions via AI Guru, maintaining context during your session.</li>
              <li>To print, package, and ship books and items bought from our Divine Store, and send tracking links.</li>
              <li>To generate verifiable, cryptographic completion certificates for our scripture courses.</li>
              <li>To secure our servers from malicious DDoS attacks, spam registrations, and platform abuse.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section id="sharing" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">5.</span> Strict Non-Sharing Policy
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300 font-bold">
              Hari Pathshala does not sell, rent, or trade your personal data to any corporate marketing agencies. We do not share your chanting history or spiritual profile with anyone.
            </p>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              We only share relevant parts of your data with highly trusted, PCI-compliant third-party providers who are absolutely necessary to process your transactions:
            </p>
            <ul className="space-y-2 text-sm text-brown-light dark:text-slate-300 list-disc pl-5">
              <li><strong>Razorpay:</strong> To process secure payments (card details are processed directly on Razorpay's bank-grade platform; we never see them).</li>
              <li><strong>Logistics Partners:</strong> Your delivery address and phone number are shared with trusted courier services to deliver physical orders.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section id="rights" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">6.</span> User Rights & Data Export
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              We empower you with complete sovereignty over your digital footprint. At any time, you can:
            </p>
            <ul className="space-y-2 text-sm text-brown-light dark:text-slate-300 list-disc pl-5">
              <li>Request an export of your personal profile, chanting records, and course logs.</li>
              <li>Update or edit your email, name, delivery addresses, and phone numbers.</li>
              <li>Request the permanent and irrevocable deletion of your account and all associated data. See our Account Deletion Policy for details.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section id="gdpr" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">7.</span> Compliance Standards
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              We operate in full compliance with the Digital Personal Data Protection (DPDP) Act, 2023 of India, and align with international standards such as GDPR and CCPA.
            </p>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              If you have any questions, concerns, or requests regarding data safety, data practices, or privacy rights, please write directly to our designated Data Protection Officer (DPO) at <strong>support@haripathshala.online</strong>.
            </p>
          </section>

        </div>

      </div>

      <Footer />
    </div>
  );
};
