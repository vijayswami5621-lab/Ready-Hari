import React from "react";
import { SEO } from "../../components/SEO";
import { ArrowLeft, Users, Shield, BookOpen, AlertCircle, Bookmark } from "lucide-react";
import { useGoBack } from "../../hooks/useGoBack";
import { Footer } from "../../components/common/Footer";

export const CommunityGuidelinesScreen = () => {
  const goBack = useGoBack();
  const lastUpdated = new Date().toLocaleDateString();

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-900 transition-colors pb-10">
      <SEO
        title="Community Guidelines | Hari Pathshala"
        description="Community guidelines and behavioral standards for Hari Pathshala users, ensuring respectful, pure, and inclusive spiritual learning environment."
      />

      <header className="px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-orange-100/50 dark:border-slate-800/50 sticky top-0 z-30 flex items-center gap-4">
        <button
          onClick={() => goBack()}
          className="p-2 -ml-2 text-brown-dark dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-full transition"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold font-sans text-brown-dark dark:text-white flex items-center gap-2">
          <Users size={20} className="text-saffron-dark" /> Community Guidelines
        </h1>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-500/10 via-saffron/5 to-amber-500/5 dark:from-orange-500/5 dark:via-slate-900 dark:to-slate-900 py-12 px-6 text-center border-b border-orange-100/30 dark:border-slate-800/50">
        <div className="max-w-3xl mx-auto space-y-4">
          <span className="bg-saffron/10 dark:bg-saffron/20 text-saffron-dark dark:text-saffron text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            Dharma & Conduct
          </span>
          <h2 className="text-3xl font-black text-brown-dark dark:text-white font-sans tracking-tight">
            Nurturing a Sacred Space for Seekers
          </h2>
          <p className="text-sm text-brown-light dark:text-slate-400 max-w-lg mx-auto">
            Our guidelines are rooted in the timeless principles of Sanatan Dharma: Satya (Truth), Ahimsa (Non-violence), and Shaucha (Purity).
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
              <li><a href="#principles" className="hover:text-saffron block py-1">• 2. Core Spiritual Principles</a></li>
              <li><a href="#conduct" className="hover:text-saffron block py-1">• 3. Code of Conduct</a></li>
              <li><a href="#forbidden" className="hover:text-saffron block py-1">• 4. Prohibited Behavior</a></li>
              <li><a href="#purity" className="hover:text-saffron block py-1">• 5. Maintaining Scripture Purity</a></li>
              <li><a href="#reporting" className="hover:text-saffron block py-1">• 6. Reporting & Enforcement</a></li>
              <li><a href="#legal" className="hover:text-saffron block py-1">• 7. Legal Boundaries</a></li>
            </ul>
          </div>
        </div>

        {/* Content Body */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 p-8 rounded-3xl shadow-sm space-y-8 text-brown-dark dark:text-slate-200">
          
          <div className="flex items-center justify-between border-b border-orange-50 dark:border-slate-800/80 pb-4">
            <span className="text-xs bg-orange-100 dark:bg-slate-800 text-saffron-dark dark:text-saffron font-black px-3 py-1 rounded-full uppercase tracking-wider">
              Document Ref: HP-CG-2026
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
              Welcome to Hari Pathshala. Our platform is a dedicated digital sanctuary engineered to facilitate spiritual learning, interactive scriptural studies, chanting meditation, and respectful community dialogues around Sanatan Dharma. To preserve the holiness, safety, and inclusive essence of this environment, we require all participants—including students, teachers, creators, and spiritual seekers—to abide by these Community Guidelines.
            </p>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              By accessing, registering on, or interacting with any feature of the Hari Pathshala app or website, you solemnly agree to read, understand, and strictly uphold these standards of conduct. These guidelines exist alongside our Terms and Conditions and Privacy Policy. Violation of these guidelines may lead to content moderation, suspension of features, or permanent termination of your account.
            </p>
          </section>

          {/* Section 2 */}
          <section id="principles" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">2.</span> Core Spiritual Principles
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              Our community standards are not merely administrative restrictions, but are directly aligned with traditional Yamas and Niyamas of Vedic wisdom:
            </p>
            <ul className="space-y-2 text-sm text-brown-light dark:text-slate-300 list-disc pl-5">
              <li><strong>Satya (Truth & Authenticity):</strong> Be truthful, authentic, and honest in all your profile representations, forum discussions, and spiritual queries. Avoid quoting out of context or spreading fabricated textual translations.</li>
              <li><strong>Ahimsa (Non-violence):</strong> Maintain complete non-violence in thought, word, and speech (Manasa, Vacha, Karmana). Avoid aggressive debates, harsh tones, abusive vocabulary, and emotional coercion.</li>
              <li><strong>Shaucha (Purity):</strong> Cultivate cleanliness and purity in interaction. Keep discussion forums, comments, and profile content free from vulgarity, inappropriate media, and commercial greed.</li>
              <li><strong>Swadhyaya (Self-study & Reflection):</strong> Approach scriptures with humility and a sincere desire to learn. Engage in self-reflection and dialogue with traditional Acharyas rather than launching egoistic arguments.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section id="conduct" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">3.</span> Code of Conduct
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              In your daily interactions on the Hari Pathshala platform, you are highly encouraged to:
            </p>
            <ul className="space-y-2 text-sm text-brown-light dark:text-slate-300 list-decimal pl-5">
              <li>Treat every user with equal dignity, regardless of their nationality, background, level of scriptural education, age, or gender.</li>
              <li>Use helpful, supportive, and encouraging language in community voice boards and experience sharing circles.</li>
              <li>Share authentic, personal experiences of your spiritual path (sadhana, chanting, scriptural reading) to inspire others, keeping self-aggrandizement to a minimum.</li>
              <li>Engage with the AI Guru respectfully, utilizing the assistant to learn authentic meanings rather than attempting to trigger political, controversial, or sensitive non-spiritual debates.</li>
              <li>Cite original scripture book name, chapter, and verse references whenever sharing translations or explanations in general comment sections.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section id="forbidden" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">4.</span> Prohibited Behavior
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              To safeguard the sanctity of our digital temple, we enforce a zero-tolerance policy against the following behaviors:
            </p>
            <div className="space-y-3.5 pt-2">
              <div className="flex gap-2.5 items-start">
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-brown-light dark:text-slate-300">
                  <strong>Hate Speech & Sectarianism:</strong> Do not post or share content that promotes hatred, discrimination, disparaging remarks, or violence against any religion, sect, caste, nationality, gender, or community. Inter-sectarian trolling or targeting is strictly forbidden.
                </p>
              </div>
              <div className="flex gap-2.5 items-start">
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-brown-light dark:text-slate-300">
                  <strong>Harassment, Bullying & Stalking:</strong> Defamation, threatening comments, personal attacks, sending unwanted personal messages, and seeking private personal coordinates of other users are ground for immediate and permanent ban.
                </p>
              </div>
              <div className="flex gap-2.5 items-start">
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-brown-light dark:text-slate-300">
                  <strong>Spam & Commercial Promotion:</strong> Posting repetitive links, self-promotion of unrelated websites, selling non-approved spiritual services, marketing multi-level schemes, and using community feeds for fundraising without direct permission are strictly prohibited.
                </p>
              </div>
              <div className="flex gap-2.5 items-start">
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-brown-light dark:text-slate-300">
                  <strong>Explicit, Vulgar, or Sensational Content:</strong> Any form of sexually explicit media, profanity, violent graphics, political commentary, or controversial memes is incompatible with Hari Pathshala and will be removed instantly.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section id="purity" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">5.</span> Maintaining Scripture Purity
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              The primary purpose of Hari Pathshala is to provide authentic, undistorted scripture education.
            </p>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              Do not modify original Sanskrit Shlokas, Devanagari texts, or widely recognized transliterations to fit personal theories or modern political ideologies. When using quotes or participating in discussion, rely upon recognized spiritual authors, acharyas, or commentaries. If you identify any typo, missing verse, or translation error in our Adhyayan (Scriptures) repository, please do not post angry public comments. Instead, report it directly to our scriptural validation board at haripathshala@gmail.com, and our traditional scholars will review and correct it.
            </p>
          </section>

          {/* Section 6 */}
          <section id="reporting" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">6.</span> Reporting & Enforcement
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              We employ a blended moderation system utilizing automated NLP keyword triggers, designated community moderators, and responsive user report options:
            </p>
            <ul className="space-y-2 text-sm text-brown-light dark:text-slate-300 list-disc pl-5">
              <li><strong>Reporting:</strong> If you witness any violation of these guidelines in comment feeds, community voice channels, or user profiles, please tap the 'Report' button or email support@haripathshala.online.</li>
              <li><strong>Investigation:</strong> Our compliance team reviews all reports within 12-24 hours. Reports are handled with absolute confidentiality.</li>
              <li><strong>Actions:</strong> Depending on the severity of the infraction, we may issue a formal warning, temporarily mute account features, remove the offending content, or permanently terminate account access. Decisions made by our moderation team are final and binding.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section id="legal" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">7.</span> Legal Boundaries
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              In addition to spiritual ethics, users must strictly comply with local and international laws. Do not upload copyrighted PDFs, audios, or videos without explicit permission from the copyright owner. Do not participate in discussions that promote illegal activities, drug abuse, self-harm, or terrorism.
            </p>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300 font-bold">
              Hari Pathshala is fully committed to cooperating with legal authorities and law enforcement in cases where community safety is compromised or local laws are breached.
            </p>
          </section>

        </div>

      </div>

      <Footer />
    </div>
  );
};
