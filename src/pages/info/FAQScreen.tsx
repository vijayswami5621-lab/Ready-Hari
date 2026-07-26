import React, { useState } from "react";
import { SEO } from "../../components/SEO";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, HelpCircle, ChevronDown, User, Shield, CreditCard, 
  Truck, ShoppingBag, BookOpen, Sparkles, AlertTriangle, Key, Search, Info
} from "lucide-react";
import { useGoBack } from "../../hooks/useGoBack";
import { Footer } from "../../components/common/Footer";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  items: FAQItem[];
}

export const FAQScreen = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedIndex, setExpandedIndex] = useState<string | null>(null);

  const faqData: FAQCategory[] = [
    {
      id: "account",
      title: "Account & Profile",
      icon: User,
      items: [
        {
          question: "How do I create an account on Hari Pathshala?",
          answer: "You can create an account by clicking the 'Register' button on the login screen. Enter your name, email address, password, and active mobile number. Once registered, you can complete your profile settings, track your course progress, and save bookmarks."
        },
        {
          question: "Can I use Hari Pathshala without logging in?",
          answer: "While key informative and legal pages are publicly accessible, most of the core features—including AI Guru chat, chanting logs, progress tracking, and participating in the spiritual quizzes—require a secure, authenticated account to persist your progress and secure personal notes."
        },
        {
          question: "How do I request deletion of my account and personal data?",
          answer: "We honor your privacy rights fully. To delete your account, visit Profile > Settings > Account Deletion, or write to our support team at haripathshala@gmail.com with your registered email. All your personal data, including chat history and statistics, will be permanently purged within 30 days in compliance with our data safety policy."
        }
      ]
    },
    {
      id: "login",
      title: "Login & Security",
      icon: Key,
      items: [
        {
          question: "I forgot my password. How can I reset it?",
          answer: "On the login screen, click the 'Forgot Password' link. Enter your registered email address, and we will send you a secure password reset link. Follow the instructions in the email to establish a new password."
        },
        {
          question: "Can I log in using multiple devices simultaneously?",
          answer: "Yes, you can log in on multiple devices (such as your phone, computer, and tablet) using the same credentials. Your progress, including chanting history, bookmarks, and purchased courses, will synchronize across all devices in real-time."
        },
        {
          question: "How does Hari Pathshala secure my login credentials?",
          answer: "We use Firebase Authentication, an industry-standard secure authentication service from Google. Your passwords are never stored in plain text; they are encrypted and salted. We do not have direct access to your password."
        }
      ]
    },
    {
      id: "payments",
      title: "Payments & Razorpay",
      icon: CreditCard,
      items: [
        {
          question: "What payment methods do you support?",
          answer: "We support a wide array of 100% secure payment methods through Razorpay, our trusted payment gateway partner. This includes UPI (Google Pay, PhonePe, Paytm), Netbanking, major Credit & Debit cards (Visa, Mastercard, RuPay), and select wallets."
        },
        {
          question: "Are my payment card details saved on your servers?",
          answer: "No, absolutely not. Hari Pathshala never collects, stores, or processes any card or bank account details. All transactions are securely offloaded to Razorpay, which is PCI-DSS compliant and uses state-of-the-art bank-grade encryption to process your payments."
        },
        {
          question: "What should I do if a payment fails but the money is debited?",
          answer: "In rare cases of transaction timeouts, the debited money is safely held by your bank and automatically refunded within 3-5 business days. You can also contact our support team at haripathshala@gmail.com with the Razorpay payment ID or screenshot, and we will verify the status instantly."
        }
      ]
    },
    {
      id: "orders",
      title: "Orders & Purchases",
      icon: ShoppingBag,
      items: [
        {
          question: "How do I check the status of my order?",
          answer: "You can track your physical orders (such as scriptures, puja items, or printed books) by visiting Profile > My Orders. Once dispatched, we also upload a live shipping tracking link, which you can click to see the real-time shipping status."
        },
        {
          question: "Can I cancel my order after it has been placed?",
          answer: "You can request order cancellation within 12 hours of placement, provided the shipment has not been picked up or dispatched by our logistics partners. Once dispatched, orders cannot be cancelled."
        },
        {
          question: "Do you provide tax invoices for purchases?",
          answer: "Yes, every digital and physical order is accompanied by a professional tax invoice in PDF format. You can download this directly from the Order Details page inside the app."
        }
      ]
    },
    {
      id: "shipping",
      title: "Shipping & Delivery",
      icon: Truck,
      items: [
        {
          question: "How long does shipping take?",
          answer: "We dispatch orders within 24-48 business hours. Delivery usually takes 3 to 5 business days for metro cities, and up to 5-7 business days for regional or rural addresses across India."
        },
        {
          question: "What are your shipping charges?",
          answer: "We offer Free Shipping on all orders above ₹499. For orders below ₹499, a nominal shipping charge of ₹40 to ₹60 is applied to cover courier and handling costs."
        },
        {
          question: "Do you ship internationally?",
          answer: "Currently, our store only fulfills orders within India. We are working on expanding our logistics to support global spiritual seekers in the near future."
        }
      ]
    },
    {
      id: "store",
      title: "Divine Store",
      icon: ShoppingBag,
      items: [
        {
          question: "Are the books and items sold on Hari Pathshala authentic?",
          answer: "Yes, 100%. All scriptures, books, and spiritual accessories are sourced directly from authentic publishers (like Gita Press, Gorakhpur) and genuine craft centers. We maintain strict quality checks to preserve sacred purity."
        },
        {
          question: "Can I buy digital PDFs and offline downloads?",
          answer: "Yes, we offer various free and premium spiritual PDFs and study guides. Once purchased or unlocked, they are stored securely in your 'My Downloads' folder for offline reading."
        }
      ]
    },
    {
      id: "courses",
      title: "Courses & Certificates",
      icon: BookOpen,
      items: [
        {
          question: "How do I enroll in a course on Hari Pathshala?",
          answer: "Simply visit the Adhyayan or Store section, browse our curated spiritual courses, and tap 'Enroll'. Free courses unlock instantly, while premium courses unlock upon successful payment completion."
        },
        {
          question: "Do you provide certificates upon course completion?",
          answer: "Yes, many of our formal courses (including Bhagavad Gita recitation and Vedic History) offer verifiable completion certificates once you finish all lessons and pass the final evaluation quiz."
        }
      ]
    },
    {
      id: "aiguru",
      title: "AI Guru Guidance",
      icon: Sparkles,
      items: [
        {
          question: "What is AI Guru and how does it work?",
          answer: "AI Guru is an advanced, custom spiritual assistant powered by Gemini models and trained strictly on authentic, verified translations of Sanatan scriptures. It answers your questions, explains verses, and provides traditional commentary safely."
        },
        {
          question: "Are the answers provided by AI Guru scripturally accurate?",
          answer: "We employ strict prompt constraints and groundings to ensure AI Guru does not hallucinate, write modern interpretations, or mix scriptures. Every response cites the original verse numbers. However, it is an assistant; for deep personal initiation, consultation with traditional acharyas is recommended."
        }
      ]
    },
    {
      id: "adhyayan",
      title: "Adhyayan (Scriptures)",
      icon: BookOpen,
      items: [
        {
          question: "Which scriptures are available in the Adhyayan section?",
          answer: "We host comprehensive, verse-by-verse editions of the Srimad Bhagavad Gita, Ramcharitmanas, Vedic Suktas, Upanishads, and popular devotional prayers. Most include authentic audio recitations and meaning guides."
        },
        {
          question: "Can I bookmark individual verses for daily chanting?",
          answer: "Absolutely! Simply tap the 'Bookmark' or 'Add to Daily Chants' icon next to any verse. You can access all your saved verses directly from your profile tab."
        }
      ]
    },
    {
      id: "privacy",
      title: "Privacy & Data",
      icon: Shield,
      items: [
        {
          question: "Is my personal chanting and prayer data private?",
          answer: "Yes. Your personal notes, chanting streaks, progress tracking, and bookmarks are strictly private and bound to your account. We never sell, rent, or share your spiritual tracking data with any third-party advertisers."
        },
        {
          question: "How can I export a copy of my data?",
          answer: "You can request a complete export of your user data (such as chanting logs and quiz history) by contacting us at support@haripathshala.online. We will deliver a clean JSON/CSV export within 14 working days."
        }
      ]
    },
    {
      id: "refunds",
      title: "Refunds & Cancellations",
      icon: AlertTriangle,
      items: [
        {
          question: "What is your refund policy for physical goods?",
          answer: "We offer a 7-day return and exchange policy for physical goods if the product is delivered damaged, defective, or incorrect. To request a refund, email support@haripathshala.online with the order ID and unboxing photos/videos."
        },
        {
          question: "Are payments for digital courses and PDFs refundable?",
          answer: "Since digital courses and downloadable PDFs grant immediate lifetime access and consumption, all payments for digital content are non-refundable. We advise checking free preview lessons before purchasing."
        }
      ]
    }
  ];

  // Filters based on query and active category
  const filteredCategories = faqData.map((cat) => {
    const matchedItems = cat.items.filter(
      (item) =>
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...cat, items: matchedItems };
  }).filter(
    (cat) => 
      (activeCategory === "all" || cat.id === activeCategory) && 
      cat.items.length > 0
  );

  const toggleExpand = (id: string) => {
    setExpandedIndex(expandedIndex === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-900 transition-colors pb-10">
      <SEO
        title="Help & FAQ | Hari Pathshala"
        description="Find answers to all your questions about our Divine Store, Payments, Courses, AI Guru, Chanting, Shipping and Refund Policies."
      />

      {/* Header */}
      <header className="px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-orange-100/50 dark:border-slate-800/50 sticky top-0 z-30 flex items-center gap-4">
        <button
          onClick={() => goBack()}
          className="p-2 -ml-2 text-brown-dark dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-full transition"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold font-sans text-brown-dark dark:text-white flex items-center gap-2">
          <HelpCircle size={20} className="text-saffron-dark" /> Help & Support FAQ
        </h1>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-orange-500/10 via-saffron/5 to-amber-500/5 dark:from-orange-500/5 dark:via-slate-900 dark:to-slate-900 py-12 px-6 text-center border-b border-orange-100/30 dark:border-slate-800/50">
        <div className="max-w-2xl mx-auto space-y-4">
          <span className="bg-saffron/10 dark:bg-saffron/20 text-saffron-dark dark:text-saffron text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            Knowledge Base
          </span>
          <h2 className="text-3xl font-black text-brown-dark dark:text-white font-sans tracking-tight">
            How can we assist you today?
          </h2>
          <p className="text-sm text-brown-light dark:text-slate-400 max-w-md mx-auto">
            Find answers, learn about Razorpay transactions, trace shipping times, or master scripture search options.
          </p>

          {/* Search Box */}
          <div className="relative max-w-md mx-auto pt-3">
            <Search size={18} className="absolute left-4 top-[25px] text-brown-light dark:text-slate-400" />
            <input
              type="text"
              placeholder="Search questions or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-orange-100 dark:border-slate-700 rounded-full py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-saffron/50 dark:text-white shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* Main Layout Container */}
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Table of Contents / Sidebar (Category filters) */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-2xl p-4 sticky top-24 shadow-sm">
            <h3 className="text-xs font-black text-brown-light dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1">
              <Info size={14} /> Categories
            </h3>
            <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-hide">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-left whitespace-nowrap transition-all w-full cursor-pointer ${
                  activeCategory === "all"
                    ? "bg-saffron text-white shadow-sm"
                    : "text-brown-light dark:text-slate-400 hover:bg-orange-50/50 dark:hover:bg-slate-800/50"
                }`}
              >
                All Help Topics
              </button>
              {faqData.map((cat) => {
                const CatIcon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold text-left whitespace-nowrap transition-all w-full cursor-pointer flex items-center gap-2 ${
                      activeCategory === cat.id
                        ? "bg-saffron text-white shadow-sm"
                        : "text-brown-light dark:text-slate-400 hover:bg-orange-50/50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <CatIcon size={14} />
                    {cat.title}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* FAQ Accordions Section */}
        <div className="lg:col-span-3 space-y-8">
          <div className="flex items-center justify-between border-b border-orange-100/30 dark:border-slate-800/50 pb-3">
            <span className="text-xs font-black text-brown-light dark:text-slate-500 uppercase tracking-wider">
              Showing {filteredCategories.reduce((acc, cat) => acc + cat.items.length, 0)} Results
            </span>
            <span className="text-xs font-medium text-brown-light dark:text-slate-400">
              Last updated: {new Date().toLocaleDateString()}
            </span>
          </div>

          {filteredCategories.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-orange-100 dark:border-slate-800">
              <HelpCircle size={40} className="text-saffron-dark mx-auto mb-3 animate-pulse" />
              <h4 className="text-base font-bold text-brown-dark dark:text-white">No Matching FAQs</h4>
              <p className="text-xs text-brown-light dark:text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                We couldn't find any questions matching your keywords. Please try another phrase or contact our Support Center directly.
              </p>
            </div>
          ) : (
            filteredCategories.map((category) => {
              const CatIcon = category.icon;
              return (
                <div key={category.id} className="space-y-4" id={`faq-cat-${category.id}`}>
                  <h3 className="text-sm font-black font-sans text-brown-dark dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <CatIcon size={16} className="text-saffron" />
                    {category.title}
                  </h3>
                  
                  <div className="space-y-3">
                    {category.items.map((item, idx) => {
                      const collapseId = `${category.id}-${idx}`;
                      const isExpanded = expandedIndex === collapseId;
                      
                      return (
                        <div
                          key={idx}
                          className="bg-white dark:bg-slate-900 border border-orange-100 dark:border-slate-800 rounded-2xl overflow-hidden transition-all duration-300 shadow-[0_2px_8px_rgba(255,153,51,0.02)]"
                        >
                          <button
                            onClick={() => toggleExpand(collapseId)}
                            className="w-full py-4 px-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                            aria-expanded={isExpanded}
                          >
                            <span className="font-sans font-bold text-sm text-brown-dark dark:text-slate-100 leading-snug">
                              {item.question}
                            </span>
                            <motion.span
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                              className="text-brown-light dark:text-slate-400 shrink-0"
                            >
                              <ChevronDown size={18} />
                            </motion.span>
                          </button>

                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                              >
                                <div className="px-5 pb-5 pt-1 text-sm text-brown-light dark:text-slate-300 leading-relaxed border-t border-orange-50/50 dark:border-slate-800/40">
                                  {item.answer}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      <Footer />
    </div>
  );
};
