import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Globe, Instagram, Youtube, HelpCircle, Shield, FileText, RefreshCw, Truck } from 'lucide-react';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { getAppOrigin } from '../../utils/urlHelper';

export const Footer = () => {
  const { officialDetails } = useAppSettings();
  const currentYear = new Date().getFullYear();
  const websiteUrl = getAppOrigin();

  return (
    <footer id="global-footer" className="bg-white dark:bg-slate-950 border-t border-orange-100 dark:border-slate-800 pt-16 pb-8 px-6 mt-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        
        {/* Brand Section */}
        <div className="space-y-4" id="footer-brand">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-saffron p-1 shadow-md border border-white dark:border-slate-800">
              <img src="/logo.png" alt="Hari Pathshala Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="font-sans font-black text-lg text-brown-dark dark:text-white tracking-tight">
                {officialDetails?.organizationName || "Hari Pathshala"}
              </h3>
              <p className="text-xs font-bold text-saffron-dark dark:text-saffron">
                {officialDetails?.tagline || "ज्ञान • भक्ति • संस्कार"}
              </p>
            </div>
          </div>
          
          <p className="text-sm text-brown-light dark:text-slate-400 leading-relaxed max-w-sm">
            Preserving and sharing the eternal spiritual wisdom of Sanatan Dharma through modern digital technology. Dive deep into authentic scriptures, connect with our AI Guru, and join our global community of seekers.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <a 
              href="https://www.instagram.com/hari_pathshala" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-orange-50 dark:bg-slate-900 border border-orange-100/50 dark:border-slate-800 flex items-center justify-center text-brown-dark dark:text-slate-300 hover:bg-saffron hover:text-white dark:hover:bg-saffron dark:hover:text-white transition-all shadow-sm"
              aria-label="Instagram"
            >
              <Instagram size={18} />
            </a>
            <a 
              href="https://youtube.com/@hari_pathshala" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-orange-50 dark:bg-slate-900 border border-orange-100/50 dark:border-slate-800 flex items-center justify-center text-brown-dark dark:text-slate-300 hover:bg-saffron hover:text-white dark:hover:bg-saffron dark:hover:text-white transition-all shadow-sm"
              aria-label="YouTube"
            >
              <Youtube size={18} />
            </a>
            <a 
              href={websiteUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-orange-50 dark:bg-slate-900 border border-orange-100/50 dark:border-slate-800 flex items-center justify-center text-brown-dark dark:text-slate-300 hover:bg-saffron hover:text-white dark:hover:bg-saffron dark:hover:text-white transition-all shadow-sm"
              aria-label="Website"
            >
              <Globe size={18} />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-4" id="footer-quick-links">
          <h4 className="font-sans font-bold text-sm text-brown-dark dark:text-white uppercase tracking-wider">
            Explore Dharma
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/" className="text-brown-light dark:text-slate-400 hover:text-saffron dark:hover:text-saffron transition-colors flex items-center gap-2">
                • Home Sanctuary
              </Link>
            </li>
            <li>
              <Link to="/adhyayan" className="text-brown-light dark:text-slate-400 hover:text-saffron dark:hover:text-saffron transition-colors flex items-center gap-2">
                • Adhyayan (Scriptures)
              </Link>
            </li>
            <li>
              <Link to="/aiguru" className="text-brown-light dark:text-slate-400 hover:text-saffron dark:hover:text-saffron transition-colors flex items-center gap-2">
                • AI Guru Guidance
              </Link>
            </li>
            <li>
              <Link to="/quiz" className="text-brown-light dark:text-slate-400 hover:text-saffron dark:hover:text-saffron transition-colors flex items-center gap-2">
                • Spiritual Quiz Arena
              </Link>
            </li>
            <li>
              <Link to="/store" className="text-brown-light dark:text-slate-400 hover:text-saffron dark:hover:text-saffron transition-colors flex items-center gap-2">
                • Divine Store
              </Link>
            </li>
            <li>
              <Link to="/panchang" className="text-brown-light dark:text-slate-400 hover:text-saffron dark:hover:text-saffron transition-colors flex items-center gap-2">
                • Vedic Panchang
              </Link>
            </li>
            <li>
              <Link to="/blog" className="text-brown-light dark:text-slate-400 hover:text-saffron dark:hover:text-saffron transition-colors flex items-center gap-2">
                • Wisdom Blog
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal & Compliance (Razorpay Requirement) */}
        <div className="space-y-4" id="footer-legal-links">
          <h4 className="font-sans font-bold text-sm text-brown-dark dark:text-white uppercase tracking-wider">
            Legal & Compliance
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/profile/privacy" className="text-brown-light dark:text-slate-400 hover:text-saffron dark:hover:text-saffron transition-colors flex items-center gap-2">
                <Shield size={14} className="text-saffron" /> Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/info/terms" className="text-brown-light dark:text-slate-400 hover:text-saffron dark:hover:text-saffron transition-colors flex items-center gap-2">
                <FileText size={14} className="text-saffron" /> Terms & Conditions
              </Link>
            </li>
            <li>
              <Link to="/info/refunds" className="text-brown-light dark:text-slate-400 hover:text-saffron dark:hover:text-saffron transition-colors flex items-center gap-2">
                <RefreshCw size={14} className="text-saffron" /> Refund & Cancellation
              </Link>
            </li>
            <li>
              <Link to="/info/shipping" className="text-brown-light dark:text-slate-400 hover:text-saffron dark:hover:text-saffron transition-colors flex items-center gap-2">
                <Truck size={14} className="text-saffron" /> Shipping & Delivery
              </Link>
            </li>
            <li>
              <Link to="/profile/contact" className="text-brown-light dark:text-slate-400 hover:text-saffron dark:hover:text-saffron transition-colors flex items-center gap-2">
                <Mail size={14} className="text-saffron" /> Contact Us
              </Link>
            </li>
            <li>
              <Link to="/profile/about" className="text-brown-light dark:text-slate-400 hover:text-saffron dark:hover:text-saffron transition-colors flex items-center gap-2">
                <HelpCircle size={14} className="text-saffron" /> About Hari Pathshala
              </Link>
            </li>
            <li>
              <Link to="/info/faq" className="text-brown-light dark:text-slate-400 hover:text-saffron dark:hover:text-saffron transition-colors flex items-center gap-2">
                <HelpCircle size={14} className="text-saffron" /> Help & FAQs
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact info & App download */}
        <div className="space-y-4" id="footer-contact">
          <h4 className="font-sans font-bold text-sm text-brown-dark dark:text-white uppercase tracking-wider">
            Contact Sanctuary
          </h4>
          
          <div className="space-y-3 text-sm text-brown-light dark:text-slate-400">
            <div className="flex gap-2">
              <MapPin size={16} className="text-saffron shrink-0 mt-0.5" />
              <span>Panchmukhi Hanuman Mandir, Guwardi Petrol Pump ke Samne, Kaladera, Jaipur, Rajasthan - 303701</span>
            </div>
            <div className="flex gap-2">
              <Phone size={16} className="text-saffron shrink-0" />
              <a href="tel:+919610579423" className="hover:text-saffron transition-colors">+91 96105 79423</a>
            </div>
            <div className="flex gap-2">
              <Mail size={16} className="text-saffron shrink-0" />
              <a href="mailto:haripathshala@gmail.com" className="hover:text-saffron transition-colors break-all">haripathshala@gmail.com</a>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-xs font-bold text-brown-dark dark:text-slate-300 mb-2">Get the Mobile App</p>
            <div className="flex gap-2">
              <a 
                href="https://play.google.com/store/apps/details?id=com.haripathshala.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:scale-[1.02] active:scale-95 transition-all"
              >
                <img src="/google_play.png" alt="Get it on Google Play" className="h-9 w-auto object-contain rounded-md" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                {/* Fallback stylized badge if image doesn't load */}
                <div className="bg-slate-900 text-white rounded-lg px-3 py-1.5 flex items-center gap-1.5 border border-slate-700 shadow-sm text-left">
                  <div className="w-4 h-4 bg-saffron rounded-full"></div>
                  <div>
                    <p className="text-[7px] uppercase text-slate-400 font-bold tracking-wider leading-none">Get it on</p>
                    <p className="text-[10px] font-sans font-black leading-none">Google Play</p>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* Compliance Policies Row (Additional Compliance requirement) */}
      <div className="max-w-7xl mx-auto border-t border-orange-100/50 dark:border-slate-800/50 mt-12 pt-8 flex flex-wrap gap-4 items-center justify-between text-xs text-brown-light dark:text-slate-500">
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link to="/info/community-guidelines" className="hover:text-saffron transition-colors">Community Guidelines</Link>
          <Link to="/info/copyright" className="hover:text-saffron transition-colors">Copyright Policy</Link>
          <Link to="/info/disclaimer" className="hover:text-saffron transition-colors">Disclaimer</Link>
          <Link to="/info/data-safety" className="hover:text-saffron transition-colors">Data Safety</Link>
          <Link to="/info/cookie-policy" className="hover:text-saffron transition-colors">Cookie Policy</Link>
          <Link to="/info/user-agreement" className="hover:text-saffron transition-colors">User Agreement</Link>
          <Link to="/info/account-deletion" className="hover:text-saffron transition-colors">Account Deletion Policy</Link>
        </div>
        <div className="pt-2 sm:pt-0">
          <span className="bg-orange-50 dark:bg-slate-900 border border-orange-100 dark:border-slate-800 text-saffron-dark dark:text-saffron px-2.5 py-1 rounded-full font-bold">
            Version 1.4.2
          </span>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="max-w-7xl mx-auto border-t border-orange-100/30 dark:border-slate-800/30 mt-6 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-brown-light dark:text-slate-500">
        <p>© {currentYear} {officialDetails?.organizationName || "Hari Pathshala"}. All Rights Reserved.</p>
        <p className="font-medium">Sanskrit: <span className="text-saffron font-bold">धर्मो रक्षति रक्षितः</span> (Dharma protects those who protect it)</p>
      </div>
    </footer>
  );
};
