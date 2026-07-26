import React from "react";
import { SEO } from "../../components/SEO";
import { ArrowLeft, AlertCircle, FileText, Bookmark, Info } from "lucide-react";
import { useGoBack } from "../../hooks/useGoBack";
import { Footer } from "../../components/common/Footer";

export const CopyrightPolicyScreen = () => {
  const goBack = useGoBack();
  const lastUpdated = new Date().toLocaleDateString();

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-900 transition-colors pb-10">
      <SEO
        title="Copyright Policy | Hari Pathshala"
        description="Intellectual property and copyright policies of Hari Pathshala, including DMCA notices, digital rights management, and user submission guidelines."
      />

      <header className="px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-orange-100/50 dark:border-slate-800/50 sticky top-0 z-30 flex items-center gap-4">
        <button
          onClick={() => goBack()}
          className="p-2 -ml-2 text-brown-dark dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-full transition"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold font-sans text-brown-dark dark:text-white flex items-center gap-2">
          <FileText size={20} className="text-saffron-dark" /> Copyright Policy
        </h1>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-500/10 via-saffron/5 to-amber-500/5 dark:from-orange-500/5 dark:via-slate-900 dark:to-slate-900 py-12 px-6 text-center border-b border-orange-100/30 dark:border-slate-800/50">
        <div className="max-w-3xl mx-auto space-y-4">
          <span className="bg-saffron/10 dark:bg-saffron/20 text-saffron-dark dark:text-saffron text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            Intellectual Property
          </span>
          <h2 className="text-3xl font-black text-brown-dark dark:text-white font-sans tracking-tight">
            Protecting Spiritual & Creative Works
          </h2>
          <p className="text-sm text-brown-light dark:text-slate-400 max-w-lg mx-auto">
            Understanding digital copyrights, licensing of spiritual commentary, translations, and user submission frameworks.
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
              <li><a href="#intro" className="hover:text-saffron block py-1">• 1. Scope & Foundation</a></li>
              <li><a href="#ownership" className="hover:text-saffron block py-1">• 2. Proprietary App Content</a></li>
              <li><a href="#user-submissions" className="hover:text-saffron block py-1">• 3. User Submissions & License</a></li>
              <li><a href="#prohibited" className="hover:text-saffron block py-1">• 4. Prohibited Reuse & Copying</a></li>
              <li><a href="#dmca" className="hover:text-saffron block py-1">• 5. DMCA & Copyright Act Notices</a></li>
              <li><a href="#licensing" className="hover:text-saffron block py-1">• 6. Commercial and Non-Comm Licensing</a></li>
              <li><a href="#contact" className="hover:text-saffron block py-1">• 7. Copyright Agent Contacts</a></li>
            </ul>
          </div>
        </div>

        {/* Content Body */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 p-8 rounded-3xl shadow-sm space-y-8 text-brown-dark dark:text-slate-200">
          
          <div className="flex items-center justify-between border-b border-orange-50 dark:border-slate-800/80 pb-4">
            <span className="text-xs bg-orange-100 dark:bg-slate-800 text-saffron-dark dark:text-saffron font-black px-3 py-1 rounded-full uppercase tracking-wider">
              Document Ref: HP-CP-2026
            </span>
            <span className="text-xs text-brown-light dark:text-slate-400">
              Last Updated: {lastUpdated}
            </span>
          </div>

          {/* Section 1 */}
          <section id="intro" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">1.</span> Scope & Foundation
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              Welcome to Hari Pathshala. This Copyright Policy outlines the rules, boundaries, and legal provisions protecting all materials on our platform. The platform is operated by Hari Pathshala, located at Kaladera, Jaipur, Rajasthan, India. All content, designs, animations, databases, custom code, sound recordings, translations, and illustrations are protected by the Copyright Act, 1957 of India, as well as international copyright laws, treaties, and Digital Millennium Copyright Act (DMCA) standards.
            </p>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              Spiritual works and Vedic scriptures themselves (such as Bhagavad Gita, Upanishads, and original Sanskrit Shlokas) reside in the public domain under traditional heritage. However, the custom typography, translations, phonetic transliterations, synthetic or recorded audios, illustrations, commentaries, quiz databases, AI Guru training alignments, and interactive elements created by Hari Pathshala represent proprietary creative intellectual property and are protected under copyright.
            </p>
          </section>

          {/* Section 2 */}
          <section id="ownership" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">2.</span> Proprietary App Content
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              Except where explicitly stated, all creative elements delivered via the Hari Pathshala app, website, or offline guides are the sole and exclusive intellectual property of Hari Pathshala. This includes:
            </p>
            <ul className="space-y-2 text-sm text-brown-light dark:text-slate-300 list-disc pl-5">
              <li><strong>Audio Assets:</strong> Recitations of Dohas, Shlokas, and mantras produced specifically by our sound engineers and pandits.</li>
              <li><strong>Literary Work:</strong> Custom translations, spiritual interpretations, modern Hindi/English meanings, and blog articles written by our content panel.</li>
              <li><strong>Art & Graphics:</strong> Background graphics, visual preset banners, custom UI designs, logos, typography combinations, and brand coloring.</li>
              <li><strong>Databases:</strong> The proprietary compilation of questions, scoring formulas, answers, and verification certificates in the Spiritual Quiz module.</li>
              <li><strong>Technology:</strong> The underlying React, Tailwind, and Node.js source code, databases, database schemas, prompt engineering strategies, and the algorithmic logic of the AI Guru.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section id="user-submissions" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">3.</span> User Submissions & License
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              Users may post text, reviews, comments, or chanting logs on certain public sections of Hari Pathshala. You retain all of your ownership rights in your user submissions.
            </p>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              However, by submitting content (such as public comments, feedback, or forum discussions) to Hari Pathshala, you grant us a worldwide, non-exclusive, royalty-free, perpetual, sublicensable, and transferable license to use, reproduce, distribute, prepare derivative works of, display, and perform your submissions in connection with the platform's spiritual and educational missions. You warrant that you own or have the necessary licenses and consents to post such content and that doing so does not infringe upon third-party intellectual property rights.
            </p>
          </section>

          {/* Section 4 */}
          <section id="prohibited" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">4.</span> Prohibited Reuse & Copying
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              You are strictly forbidden from performing the following actions without express written authorization from the founders of Hari Pathshala:
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex gap-2.5 items-start">
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-brown-light dark:text-slate-300">
                  Using web scrapers, automated spiders, scrapers, or scripts to bulk-download Shlokas, translations, audio recordings, or quiz databases from the platform.
                </p>
              </div>
              <div className="flex gap-2.5 items-start">
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-brown-light dark:text-slate-300">
                  Uploading our audio files, recitation guides, or course lectures to external video hosting services (such as YouTube or Facebook) for monetization or commercial promotion.
                </p>
              </div>
              <div className="flex gap-2.5 items-start">
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-brown-light dark:text-slate-300">
                  Decompiling, reverse-engineering, or repackaging our mobile APKs, web bundles, or AI Guru endpoints to create cloned applications.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section id="dmca" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">5.</span> DMCA & Copyright Act Notices
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              If you are a copyright owner or an agent thereof and believe that any content hosted on Hari Pathshala infringes upon your copyright under the Indian Copyright Act, 1957 or DMCA, you may submit a formal notification.
            </p>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              Your takedown notice must include the following information in writing:
            </p>
            <ul className="space-y-2 text-sm text-brown-light dark:text-slate-300 list-disc pl-5">
              <li>A physical or electronic signature of a person authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.</li>
              <li>Identification of the copyrighted work claimed to have been infringed, or, if multiple copyrighted works at a single online site are covered by a single notification, a representative list of such works.</li>
              <li>Identification of the material that is claimed to be infringing or to be the subject of infringing activity and that is to be removed or access to which is to be disabled, and information reasonably sufficient to permit us to locate the material (e.g., direct URL paths).</li>
              <li>Information reasonably sufficient to permit us to contact you, such as an address, telephone number, and email.</li>
              <li>A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.</li>
              <li>A statement that the information in the notification is accurate, and under penalty of perjury, that you are authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section id="licensing" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">6.</span> Commercial & Non-Commercial Licensing
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              Hari Pathshala is dedicated to spreading Sanatan wisdom. Non-commercial, educational use of our text translations is generally permitted, provided you supply a clear backlink attribution to <strong>haripathshala.online</strong>.
            </p>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              Any commercial reuse, packaging in physical books, inclusion in paid educational courses, or broadcasting of our proprietary audio recitations requires a formal licensing agreement. Please contact our licensing board to discuss partnerships.
            </p>
          </section>

          {/* Section 7 */}
          <section id="contact" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">7.</span> Copyright Agent Contacts
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              All copyright takedown inquiries, intellectual property licensing proposals, and copyright compliance issues should be sent directly to our designated compliance desk:
            </p>
            <div className="p-4 bg-orange-50/50 dark:bg-slate-800/40 rounded-2xl border border-orange-100/50 dark:border-slate-800/50 text-sm space-y-1 text-brown-light dark:text-slate-300">
              <p><strong>Designated Agent:</strong> Intellectual Property Compliance Board, Hari Pathshala</p>
              <p><strong>Office Address:</strong> Panchmukhi Hanuman Mandir, Kaladera, Jaipur, Rajasthan, India - 303701</p>
              <p><strong>Email Address:</strong> haripathshala@gmail.com / support@haripathshala.online</p>
              <p><strong>Active Hotline:</strong> +91 96105 79423</p>
            </div>
          </section>

        </div>

      </div>

      <Footer />
    </div>
  );
};
