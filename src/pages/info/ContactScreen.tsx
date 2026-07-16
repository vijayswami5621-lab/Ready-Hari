import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Mail, Phone, MapPin, Send, Clock, Globe, HelpCircle, Package, AlertCircle } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { SEO } from '../../components/SEO';
import { useAuthStore } from '../../store/useAuthStore';

export const ContactScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const goBack = () => navigate(-1);
  const [formData, setFormData] = useState({
    name: user?.displayName || "",
    mobile: (user as any)?.phone || user?.phoneNumber || "",
    email: user?.email || "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'contacts'), {
        ...formData,
        userId: user?.uid || null,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setFormData({ ...formData, subject: "", message: "" });
      }, 5000);
    } catch (err) {
      console.error("Error submitting contact form", err);
    } finally {
      setLoading(false);
    }
  };

  const faqs = [
    { q: "Orders: How can I track my order?", a: "You can track your order in the 'Orders' section or click the WhatsApp button on your order details page." },
    { q: "Payments: Are my payments secure?", a: "Yes, we use Razorpay for secure 100% encrypted online transactions." },
    { q: "Shipping: How long does delivery take?", a: "Usually 3-5 business days depending on your location." },
    { q: "Returns & Refunds: What is the refund policy?", a: "We offer a 7-day refund policy for damaged or incorrect items." },
    { q: "Account: How can I update my profile?", a: "Visit the Profile tab and click on Edit Profile." },
    { q: "AI Guru: What is the AI Guru?", a: "It's our spiritual assistant that can answer your queries about scriptures." },
    { q: "Hari Pathshala: What is your mission?", a: "To spread spiritual education and authentic Hindu scriptures globally." }
  ];

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-900 transition-colors pb-20">
      <SEO
        title="Contact & Shipment Support | Hari Pathshala"
        description="Get help and support from Hari Pathshala."
      />
      <header className="pt-12 pb-6 px-6 bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-20 flex items-center">
        <button
          onClick={() => goBack()}
          className="mr-4 p-2 bg-orange-50 dark:bg-slate-700 rounded-full text-brown-dark dark:text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold font-sans text-brown-dark dark:text-white">
          Support Center
        </h1>
      </header>

      <div className="p-6 space-y-8 max-w-3xl mx-auto">
        <div className="flex flex-col items-center text-center space-y-4 pt-4">
          <img src="/logo.png" alt="Hari Pathshala Logo" className="w-24 h-24 object-contain drop-shadow-md rounded-full bg-white p-1 border-2 border-white" />
          <h2 className="text-2xl font-bold text-brown-dark dark:text-white">Hari Pathshala Support</h2>
          <p className="text-sm text-brown-light dark:text-slate-400 max-w-md">
            We are here to assist you with orders, spiritual guidance, and technical help. Average Response Time: 2-4 Hours.
          </p>
        </div>

        {/* Company Info */}
        <section className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-orange-100 dark:border-slate-700">
          <h3 className="font-bold text-lg text-brown-dark dark:text-white mb-4 border-b border-orange-100 dark:border-slate-700 pb-2">Company Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
             <div className="flex items-center gap-3">
               <Globe className="text-saffron-dark shrink-0" size={18} />
               <div>
                 <p className="text-brown-light dark:text-slate-400 text-xs">Website</p>
                 <p className="font-medium text-brown-dark dark:text-white">www.haripathshala.online</p>
               </div>
             </div>
             <div className="flex items-center gap-3">
               <Mail className="text-saffron-dark shrink-0" size={18} />
               <div>
                 <p className="text-brown-light dark:text-slate-400 text-xs">Official & Support Email</p>
                 <p className="font-medium text-brown-dark dark:text-white">haripathshala@gmail.com</p>
               </div>
             </div>
             <div className="flex items-center gap-3">
               <Phone className="text-saffron-dark shrink-0" size={18} />
               <div>
                 <p className="text-brown-light dark:text-slate-400 text-xs">Contact Number</p>
                 <p className="font-medium text-brown-dark dark:text-white">+91 9610579423</p>
               </div>
             </div>
             <div className="flex items-center gap-3">
               <MessageCircle className="text-saffron-dark shrink-0" size={18} />
               <div>
                 <p className="text-brown-light dark:text-slate-400 text-xs">WhatsApp Number</p>
                 <p className="font-medium text-brown-dark dark:text-white">+91 9610579423</p>
               </div>
             </div>
             <div className="flex items-center gap-3">
               <Clock className="text-saffron-dark shrink-0" size={18} />
               <div>
                 <p className="text-brown-light dark:text-slate-400 text-xs">Business Hours</p>
                 <p className="font-medium text-brown-dark dark:text-white">Mon-Sat: 9 AM - 6 PM</p>
               </div>
             </div>
             <div className="flex items-center gap-3">
               <div className="w-5 flex justify-center text-saffron-dark shrink-0"><span className="font-bold">IG</span></div>
               <div>
                 <p className="text-brown-light dark:text-slate-400 text-xs">Instagram</p>
                 <p className="font-medium text-brown-dark dark:text-white">@haripathshala</p>
               </div>
             </div>
             <div className="flex items-center gap-3">
               <div className="w-5 flex justify-center text-red-500 shrink-0"><span className="font-bold">YT</span></div>
               <div>
                 <p className="text-brown-light dark:text-slate-400 text-xs">YouTube</p>
                 <p className="font-medium text-brown-dark dark:text-white">Hari Pathshala</p>
               </div>
             </div>
          </div>
        </section>

        {/* Shipping Support section */}
        <section className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-orange-100 dark:border-slate-700">
           <div className="flex items-center gap-2 mb-4 border-b border-orange-100 dark:border-slate-700 pb-2">
             <Package className="text-saffron-dark" size={20} />
             <h3 className="font-bold text-lg text-brown-dark dark:text-white">Shipping & Order Support</h3>
           </div>
           <p className="text-sm text-brown-light dark:text-slate-400 mb-6">
             Need help with your delivery? Track your order, report delivery issues, damaged products, or request shipment updates here.
           </p>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button onClick={() => navigate('/orders')} className="bg-orange-50 dark:bg-slate-700 p-3 rounded-xl flex flex-col items-center gap-2 text-center hover:bg-orange-100 dark:hover:bg-slate-600 transition-colors">
                <MapPin size={24} className="text-saffron-dark" />
                <span className="text-xs font-bold text-brown-dark dark:text-white">Track Order</span>
              </button>
              <a href="https://wa.me/919610579423?text=Hi,%20I%20need%20help%20with%20my%20order." target="_blank" rel="noopener noreferrer" className="bg-green-50 dark:bg-green-900/30 p-3 rounded-xl flex flex-col items-center gap-2 text-center hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors">
                <MessageCircle size={24} className="text-green-600" />
                <span className="text-xs font-bold text-green-700 dark:text-green-400">WhatsApp Support</span>
              </a>
              <a href="mailto:haripathshala@gmail.com?subject=Order%20Support" className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl flex flex-col items-center gap-2 text-center hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                <Mail size={24} className="text-blue-600" />
                <span className="text-xs font-bold text-blue-700 dark:text-blue-400">Email Support</span>
              </a>
              <a href="tel:+919610579423" className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-xl flex flex-col items-center gap-2 text-center hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors">
                <Phone size={24} className="text-purple-600" />
                <span className="text-xs font-bold text-purple-700 dark:text-purple-400">Call Support</span>
              </a>
           </div>
        </section>

        {/* FAQs */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="text-saffron-dark" size={20} />
            <h3 className="text-lg font-bold text-brown-dark dark:text-white">Frequently Asked Questions</h3>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-orange-50 dark:border-slate-700">
                <h4 className="font-bold text-sm text-brown-dark dark:text-white mb-2">{faq.q}</h4>
                <p className="text-sm text-brown-light dark:text-slate-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Map */}
        <section className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-orange-100 dark:border-slate-700">
           <div className="flex items-center gap-2 mb-4 border-b border-orange-100 dark:border-slate-700 pb-2">
             <MapPin className="text-saffron-dark" size={20} />
             <h3 className="font-bold text-lg text-brown-dark dark:text-white">Our Location</h3>
           </div>
           <p className="text-sm font-medium text-brown-dark dark:text-white mb-4">
             Panchmukhi Hanuman Mandir, Guwardi Petrol Pump ke Samne, Kaladera, Jaipur, Rajasthan
           </p>
           <div className="w-full h-48 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 mb-4">
             <iframe 
               title="Hari Pathshala Location"
               width="100%" 
               height="100%" 
               style={{ border: 0 }} 
               loading="lazy" 
               allowFullScreen 
               src="https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY_PLACEHOLDER&q=Panchmukhi+Hanuman+Mandir,+Kaladera,+Jaipur,+Rajasthan"
             ></iframe>
             {/* Note: since there's no Maps API key provided, the iframe might show an error, so we overlay a map link just in case */}
           </div>
           <a 
             href="https://www.google.com/maps/search/?api=1&query=Panchmukhi+Hanuman+Mandir,+Guwardi+Petrol+Pump+ke+Samne,+Kaladera,+Jaipur,+Rajasthan" 
             target="_blank" rel="noopener noreferrer"
             className="w-full bg-orange-50 dark:bg-slate-700 text-saffron-dark font-bold py-3 rounded-xl text-center block hover:bg-orange-100 dark:hover:bg-slate-600 transition-colors"
           >
             Get Directions
           </a>
        </section>

        {/* Contact Form */}
        <section className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-orange-100 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-6">
            <Mail className="text-saffron-dark" size={20} />
            <h3 className="text-lg font-bold text-brown-dark dark:text-white">
              Leave a Message
            </h3>
          </div>
          {submitted ? (
            <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-4 rounded-xl text-center font-medium flex items-center justify-center gap-2">
              <AlertCircle size={20} />
              Message sent successfully! We will get back to you soon.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-brown-light dark:text-slate-400 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-orange-50 dark:bg-slate-900 border border-orange-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-saffron-dark dark:text-white"
                    placeholder="Ram Kumar"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-brown-light dark:text-slate-400 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full bg-orange-50 dark:bg-slate-900 border border-orange-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-saffron-dark dark:text-white"
                    placeholder="+91 0000000000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-brown-light dark:text-slate-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-orange-50 dark:bg-slate-900 border border-orange-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-saffron-dark dark:text-white"
                  placeholder="ram@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brown-light dark:text-slate-400 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full bg-orange-50 dark:bg-slate-900 border border-orange-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-saffron-dark dark:text-white"
                  placeholder="e.g. Order Issue, General Inquiry"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-brown-light dark:text-slate-400 mb-1">
                  Message
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-orange-50 dark:bg-slate-900 border border-orange-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-saffron-dark dark:text-white resize-none"
                  placeholder="How can we help you?"
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brown-dark text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-brown-light flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {loading ? "Sending..." : <><Send size={18} /> Send Message</>}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
};
