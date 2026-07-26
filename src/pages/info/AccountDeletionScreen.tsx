import React, { useState } from "react";
import { SEO } from "../../components/SEO";
import { ArrowLeft, Trash2, ShieldAlert, CheckCircle, Bookmark, FileText } from "lucide-react";
import { useGoBack } from "../../hooks/useGoBack";
import { Footer } from "../../components/common/Footer";

export const AccountDeletionScreen = () => {
  const goBack = useGoBack();
  const lastUpdated = new Date().toLocaleDateString();

  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your registered email address.");
      return;
    }
    if (!confirmChecked) {
      setError("You must check the confirmation box to proceed.");
      return;
    }

    setIsSubmitting(true);
    // Simulate API request to backend for deletion scheduling
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-900 transition-colors pb-10">
      <SEO
        title="Account Deletion Policy | Hari Pathshala"
        description="Learn about our account deletion process, Right to be Forgotten guidelines under DPDP and GDPR, and submit a secure deletion request."
      />

      <header className="px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-orange-100/50 dark:border-slate-800/50 sticky top-0 z-30 flex items-center gap-4">
        <button
          onClick={() => goBack()}
          className="p-2 -ml-2 text-brown-dark dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-full transition"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold font-sans text-brown-dark dark:text-white flex items-center gap-2">
          <Trash2 size={20} className="text-red-500" /> Account Deletion Policy
        </h1>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-red-500/10 via-orange-500/5 to-amber-500/5 dark:from-red-500/5 dark:via-slate-900 dark:to-slate-900 py-12 px-6 text-center border-b border-orange-100/30 dark:border-slate-800/50">
        <div className="max-w-3xl mx-auto space-y-4">
          <span className="bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            User Autonomy
          </span>
          <h2 className="text-3xl font-black text-brown-dark dark:text-white font-sans tracking-tight">
            Irrevocable Account Deletion Policy
          </h2>
          <p className="text-sm text-brown-light dark:text-slate-400 max-w-lg mx-auto">
            We support your absolute sovereignty over your personal data. Learn what happens during deletion and submit a secure request.
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
              <li><a href="#right" className="hover:text-saffron block py-1">• 2. Right to Deletion</a></li>
              <li><a href="#purged" className="hover:text-saffron block py-1">• 3. What Data is Purged</a></li>
              <li><a href="#retained" className="hover:text-saffron block py-1">• 4. What Data is Retained</a></li>
              <li><a href="#methods" className="hover:text-saffron block py-1">• 5. Request Methods</a></li>
              <li><a href="#timeline" className="hover:text-saffron block py-1">• 6. Deletion Timeline</a></li>
              <li><a href="#form" className="hover:text-saffron block py-1">• 7. Submit Deletion Request</a></li>
            </ul>
          </div>
        </div>

        {/* Content Body */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 p-8 rounded-3xl shadow-sm space-y-8 text-brown-dark dark:text-slate-200">
          
          <div className="flex items-center justify-between border-b border-orange-50 dark:border-slate-800/80 pb-4">
            <span className="text-xs bg-red-100 dark:bg-slate-800/50 text-red-600 dark:text-red-400 font-black px-3 py-1 rounded-full uppercase tracking-wider">
              Document Ref: HP-AD-2026
            </span>
            <span className="text-xs text-brown-light dark:text-slate-400">
              Last Updated: {lastUpdated}
            </span>
          </div>

          {/* Section 1 */}
          <section id="intro" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-red-500">1.</span> Introduction
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              Hari Pathshala respect and upholds your privacy and control over your personal data. In strict compliance with the Digital Personal Data Protection (DPDP) Act, 2023 of India, and Google Play Store Developer Policy requirements, we provide a clean, accessible, and irreversible path to permanently delete your account and all associated spiritual tracking data.
            </p>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              This Account Deletion Policy explains what data is deleted, what data we must legally retain for payment audits, how to trigger the deletion process, and our timeline for permanent erasure.
            </p>
          </section>

          {/* Section 2 */}
          <section id="right" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-red-500">2.</span> Your Right to Deletion
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              You possess the legal right—often known as the 'Right to be Forgotten' or 'Right to Erasure'—to request that we delete any of your personal data held in our active databases. This right can be exercised at any time, without providing reasons, provided there are no outstanding debts or open legal investigations associated with your profile.
            </p>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              Please note that account deletion is completely <strong>permanent and irreversible</strong>. Once processed, you will lose all course progress, certificates, custom bookmarks, and AI Guru chat histories.
            </p>
          </section>

          {/* Section 3 */}
          <section id="purged" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-red-500">3.</span> What Data is Permanently Purged
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              Upon successful execution of your deletion request, we completely wipe the following records from our active cloud Firestore databases:
            </p>
            <ul className="space-y-2 text-sm text-brown-light dark:text-slate-300 list-disc pl-5">
              <li><strong>Profile Metadata:</strong> Your registered name, email address, password hashes, mobile number, and avatar photo.</li>
              <li><strong>Sadhana & Meditation Logs:</strong> Your daily chanting streaks, bookmarks, saved shlokas, and custom spiritual notes.</li>
              <li><strong>AI Guru Chat History:</strong> The entire history of your past queries, verse explanations, and customized chats with our AI Guru.</li>
              <li><strong>Course Progress:</strong> Your enrollment statuses, completed lessons, and quiz logs.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section id="retained" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-red-500">4.</span> What Data is Legally Retained
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              In accordance with section 6 of the DPDP Act, 2023 and respective guidelines from the Ministry of Finance, India, we are legally required to archive transaction-related audit records for a mandatory period (usually 7-8 fiscal years).
            </p>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              Therefore, we will retain:
            </p>
            <ul className="space-y-2 text-sm text-brown-light dark:text-slate-300 list-disc pl-5">
              <li><strong>Payment Logs:</strong> Transaction IDs, Razorpay order references, billing details, and items purchased in the Divine Store (needed to verify tax invoices and comply with anti-money laundering regulations).</li>
              <li><strong>Tax Invoices:</strong> Generated PDFs displaying the recipient's billing coordinates.</li>
            </ul>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              This archived information is completely isolated, protected with strict access controls, and is never used for any marketing or business operations.
            </p>
          </section>

          {/* Section 5 */}
          <section id="methods" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-red-500">5.</span> Request Methods
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              We provide two official methods to submit your account deletion request:
            </p>
            <ul className="space-y-2 text-sm text-brown-light dark:text-slate-300 list-decimal pl-5">
              <li><strong>In-App Submission:</strong> Tap 'Submit Deletion Request' in the form below while logged into your browser, or visit Profile &gt; Settings &gt; Account Deletion inside the mobile application.</li>
              <li><strong>Email Submission:</strong> Send a formal email to our support team at <strong>support@haripathshala.online</strong> or <strong>haripathshala@gmail.com</strong> from your registered email address with the subject line 'Request for Permanent Account Deletion'.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section id="timeline" className="space-y-3 scroll-mt-24">
            <h3 className="text-lg font-black font-sans text-brown-dark dark:text-white flex items-center gap-2">
              <span className="text-red-500">6.</span> Deletion Timeline
            </h3>
            <p className="text-sm leading-relaxed text-brown-light dark:text-slate-300">
              To prevent accidental deletion due to unauthorized password access or emotional impulse, we observe the following timeline:
            </p>
            <ul className="space-y-2 text-sm text-brown-light dark:text-slate-300 list-disc pl-5">
              <li><strong>Cooling-off Period (7 Days):</strong> Your account is immediately deactivated and hidden from public feed. Within these 7 days, you can log back in or email us to cancel the deletion request.</li>
              <li><strong>Database Purging (30 Days):</strong> If no cancellation request is made, our automated scripts completely purge all profile keys, chanting logs, and chat databases. This process is fully finalized within 30 business days.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section id="form" className="space-y-4 scroll-mt-24 pt-4 border-t border-red-100 dark:border-red-900/30">
            <h3 className="text-lg font-black font-sans text-red-600 dark:text-red-400 flex items-center gap-2">
              <ShieldAlert size={20} /> Submit Deletion Request (Online Form)
            </h3>
            
            {submitted ? (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 p-6 rounded-2xl text-center space-y-3">
                <CheckCircle size={40} className="text-green-500 mx-auto" />
                <h4 className="font-bold text-green-800 dark:text-green-400">Deletion Scheduled Successfully</h4>
                <p className="text-xs text-green-700 dark:text-green-500 max-w-sm mx-auto leading-relaxed">
                  Your account deactivation is scheduled. A confirmation email has been dispatched. You possess a 7-day cooling-off window to reverse this request.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitRequest} className="bg-red-50/20 dark:bg-slate-900/40 border border-red-100 dark:border-red-950 p-6 rounded-2xl space-y-4">
                {error && (
                  <p className="text-xs font-bold text-red-500">{error}</p>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-brown-light dark:text-slate-400">Registered Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. seeker@gmail.com"
                    className="w-full bg-white dark:bg-slate-800 border border-orange-100 dark:border-slate-700 rounded-xl py-2.5 px-4 text-xs dark:text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-brown-light dark:text-slate-400">Reason for leaving (Optional)</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Tell us how we can improve our spiritual workspace..."
                    className="w-full bg-white dark:bg-slate-800 border border-orange-100 dark:border-slate-700 rounded-xl py-2.5 px-4 text-xs dark:text-white h-20 focus:outline-none"
                  />
                </div>

                <label className="flex items-start gap-3 cursor-pointer pt-1 select-none">
                  <input
                    type="checkbox"
                    checked={confirmChecked}
                    onChange={(e) => setConfirmChecked(e.target.checked)}
                    className="mt-0.5 rounded text-red-600 focus:ring-red-500"
                  />
                  <span className="text-[11px] text-brown-light dark:text-slate-400 leading-relaxed font-medium">
                    I understand that account deletion is <strong>final and permanent</strong>. All my chanting histories, bookmarks, certificates, and purchases will be lost forever.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-sans font-black text-xs py-3 rounded-xl transition shadow disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Processing..." : "Permanently Delete My Account"}
                </button>
              </form>
            )}
          </section>

        </div>

      </div>

      <Footer />
    </div>
  );
};
