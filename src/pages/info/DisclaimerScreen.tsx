import React from "react";
import { SEO } from "../../components/SEO";
import { ArrowLeft, AlertTriangle, Info, Bookmark, FileText } from "lucide-react";
import { useGoBack } from "../../hooks/useGoBack";
import { Footer } from "../../components/common/Footer";

export const DisclaimerScreen = () => {
  const goBack = useGoBack();
  const lastUpdated = new Date().toLocaleDateString();

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-900 transition-colors pb-10">
      <SEO
        title="Disclaimer | Hari Pathshala"
        description="Legal disclaimers, limits of liability, and guidelines regarding spiritual guidance, AI Guru predictions, course contents, and third-party links."
      />

      <header className="px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-orange-100/50 dark:border-slate-800/50 sticky top-0 z-30 flex items-center gap-4">
        <button
          onClick={() => goBack()}
          className="p-2 -ml-2 text-brown-dark dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-full transition"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold font-sans text-brown-dark dark:text-white flex items-center gap-2">
          <AlertTriangle size={20} className="text-saffron-dark" /> Legal Disclaimer
        </h1>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-500/10 via-saffron/5 to-amber-500/5 dark:from-orange-500/5 dark:via-slate-900 dark:to-slate-900 py-12 px-6 text-center border-b border-orange-100/30 dark:border-slate-800/50">
        <div className="max-w-3xl mx-auto space-y-4">
          <span className="bg-saffron/10 dark:bg-saffron/20 text-saffron-dark dark:text-saffron text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            Terms of Use
          </span>
          <h2 className="text-3xl font-black text-brown-dark dark:text-white font-sans tracking-tight">
            Important Legal Disclosures & Limits
          </h2>
          <p className="text-sm text-brown-light dark:text-slate-400 max-w-lg mx-auto">
            Please read these disclaimers carefully to understand the boundaries of our spiritual commentary, AI responses, and product representations.
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
              <li><a href="#intro" className="hover:text-saffron block py-1">• 1. General Information</a></li>
              <li><a href="#spiritual" className="hover:text-saffron block py-1">• 2. Spiritual & Commentary Disclaimer</a></li>
              <li><a href="#ai-guru" className="hover:text-saffron block py-1">• 3. AI Guru Guidance Scope</a></li>
              <li><a href="#commerce" className="hover:text-saffron block py-1">• 4. E-Commerce & Product Standards</a></li>
              <li><a href="#external" className="hover:text-saffron block py-1">• 5. Third-Party Links & API Data</a></li>
              <li><a href="#liability" className="hover:text-saffron block py-1">• 6. Limitation of Liability</a></li>
              <li><a href="#indemnity" className="hover:text-saffron block py-1">• 7. Indemnification</a></li>
            </ul>
          </div>
        </div>

        {/* Content Body */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 p-8 rounded-3xl shadow-sm space-y-8 text-brown-dark dark:text-slate-200">
          
          <div className="flex items-center justify-between border-b border-orange-50 dark:border-slate-800/80 pb-4">
            <span className="text-xs bg-orange-100 dark:bg-slate-800 text-saffron-dark dark:text-saffron font-black px-3 py-1 rounded-full uppercase tracking-wider">
              Document Ref: HP-LD-2026
            </span>
            <span className="text-xs text-brown-light dark:text-slate-400">
              Last Updated: {lastUpdated}
            </span>
          </div>

          {/* Section 1 */}
          <section id="intro" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">1.</span> General Information
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              The information provided by Hari Pathshala ('we', 'us', or 'our') on our mobile application and web portal (located at <strong>haripathshala.online</strong>) is for general educational, personal enrichment, and spiritual study purposes only. All content on the platform is provided in good faith. However, we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any scripture translations, interpretations, or AI-generated results.
            </p>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              By using our application, you explicitly acknowledge that your reliance on any information, courses, or guides provided in our ecosystem is strictly and solely at your own risk.
            </p>
          </section>

          {/* Section 2 */}
          <section id="spiritual" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">2.</span> Spiritual & Commentary Disclaimer
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              Hari Pathshala hosts traditional scriptures of Sanatan Dharma (such as the Srimad Bhagavad Gita, Upanishads, and Vedic Suktas) and respective commentary lines from widely recognized ancient acharyas. Spiritual lessons and translations are historical, philosophical, and devotional in nature.
            </p>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              These teachings must not be construed as clinical mental health therapies, medical diagnostics, psychological treatment, or structural solutions to clinical conditions. If you are experiencing psychological distress, severe depression, or clinical conditions, you are strongly urged to consult with a licensed healthcare practitioner or certified clinical therapist immediately.
            </p>
          </section>

          {/* Section 3 */}
          <section id="ai-guru" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">3.</span> AI Guru Guidance Scope
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              Our AI Guru is an automated natural language processing model powered by Google Gemini SDK. It is trained to parse scripture structures and produce logical answers matching Sanatan philosophy.
            </p>
            <div className="p-4 bg-orange-50/50 dark:bg-slate-800/40 rounded-2xl border border-orange-100/50 dark:border-slate-800/50 text-sm space-y-2 text-brown-light dark:text-slate-300">
              <p className="flex gap-2 items-start font-bold">
                <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                No Professional Advice:
              </p>
              <p>
                The AI Guru does not provide professional financial, legal, medical, psychiatric, career, or real estate advice. Any answer suggesting life actions represents philosophical interpretations of ancient texts and must be verified by your own intellect and traditional human mentors.
              </p>
              <p className="flex gap-2 items-start font-bold pt-1">
                <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                Algorithmic Limits:
              </p>
              <p>
                Natural Language Processing models can occasionally hallucinate, misinterpret contexts, or provide incorrect verse alignments. Hari Pathshala does not guarantee the scriptural accuracy of AI Guru's synthesized chats and is not liable for any spiritual decisions or actions taken based on AI chat outputs.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section id="commerce" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">4.</span> E-Commerce & Product Standards
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              Our Divine Store lists physical books, scriptures, wooden chanting beads, and puja items. Product images are photographed under professional lighting and may slightly differ in actual wood color or cover print version.
            </p>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              All books represent standard publications from reputed publishers (like Gita Press). Any spiritual effects, blessings, or astrological alignments attributed to wearing specific beads (such as Rudraksha or Tulsi Kanthi Mala) are rooted in faith and traditional practices. Hari Pathshala does not claim or guarantee any physical, physiological, or scientific benefits from wearing or using our spiritual items.
            </p>
          </section>

          {/* Section 5 */}
          <section id="external" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">5.</span> Third-Party Links & API Data
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              The platform contains links to external websites, social media channels, and third-party services (such as Youtube recitation clips, external blogs, or maps). We do not control, verify, or monitor the content safety or data privacy policies of these external websites.
            </p>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              Furthermore, certain Vedic Panchang or astronomical details are populated via dynamic external APIs. While we implement quality checking, astronomical alignments and planetary calculations can slightly vary across regional Hindu calendars (Samvatsara). We are not responsible for any calendar or regional ritual discrepancies.
            </p>
          </section>

          {/* Section 6 */}
          <section id="liability" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">6.</span> Limitation of Liability
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300 font-bold text-red-500/90">
              IN NO EVENT SHALL HARI PATHSHALA, ITS FOUNDERS, EMPLOYEES, PARTNERS, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, LOST REVENUE, DATA LOSS, OR OTHER DAMAGES ARISING FROM YOUR USE OF THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              OUR TOTAL LIABILITY TO YOU FOR ANY CAUSE WHATSOEVER, AND REGARDLESS OF THE FORM OF THE ACTION, WILL AT ALL TIMES BE LIMITED TO THE AMOUNT PAID, IF ANY, BY YOU TO US FOR OUR SERVICES DURING THE SIX (6) MONTHS PRIOR TO THE CAUSE OF ACTION ARISING.
            </p>
          </section>

          {/* Section 7 */}
          <section id="indemnity" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-saffron">7.</span> Indemnification
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              You agree to defend, indemnify, and hold harmless Hari Pathshala and its founders and staff from and against any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of or in any way connected with your breach of our terms, your user submissions, your misuse of our spiritual contents, or your violation of any third-party intellectual property rights.
            </p>
          </section>

        </div>

      </div>

      <Footer />
    </div>
  );
};
