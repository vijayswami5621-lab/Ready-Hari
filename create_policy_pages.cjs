const fs = require('fs');
const path = require('path');

const refundCode = `import React from "react";
import { SEO } from "../../components/SEO";
import { ArrowLeft, RefreshCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGoBack } from "../../hooks/useGoBack";

export const RefundPolicyScreen = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-900 transition-colors pb-24">
      <SEO
        title="Refund Policy | Hari Pathshala"
        description="Refund Policy of Hari Pathshala."
      />
      <header className="px-4 py-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-30 shadow-sm flex items-center gap-3 border-b border-orange-50 dark:border-slate-800">
        <button
          onClick={() => goBack()}
          className="p-2 -ml-2 text-brown-dark dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-full transition"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold font-sans text-brown-dark dark:text-white flex items-center gap-2">
          <RefreshCcw size={18} /> Refund Policy
        </h1>
      </header>
      <div className="p-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-orange-100 dark:border-slate-700 prose prose-sm dark:prose-invert prose-orange max-w-none">
          <h2 className="text-brown-dark dark:text-white">1. Refunds</h2>
          <p className="text-brown-light dark:text-slate-300">We offer a 7-day refund policy for damaged or incorrect items. Please contact our support team to initiate a refund.</p>
          <h2 className="text-brown-dark dark:text-white">2. Cancellations</h2>
          <p className="text-brown-light dark:text-slate-300">Orders can be cancelled before they are shipped. Once shipped, the order cannot be cancelled.</p>
        </div>
      </div>
    </div>
  );
};
`;

const shippingCode = `import React from "react";
import { SEO } from "../../components/SEO";
import { ArrowLeft, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGoBack } from "../../hooks/useGoBack";

export const ShippingPolicyScreen = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-900 transition-colors pb-24">
      <SEO
        title="Shipping Policy | Hari Pathshala"
        description="Shipping Policy of Hari Pathshala."
      />
      <header className="px-4 py-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-30 shadow-sm flex items-center gap-3 border-b border-orange-50 dark:border-slate-800">
        <button
          onClick={() => goBack()}
          className="p-2 -ml-2 text-brown-dark dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-full transition"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold font-sans text-brown-dark dark:text-white flex items-center gap-2">
          <Truck size={18} /> Shipping Policy
        </h1>
      </header>
      <div className="p-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-orange-100 dark:border-slate-700 prose prose-sm dark:prose-invert prose-orange max-w-none">
          <h2 className="text-brown-dark dark:text-white">1. Processing Time</h2>
          <p className="text-brown-light dark:text-slate-300">All orders are processed within 1-2 business days.</p>
          <h2 className="text-brown-dark dark:text-white">2. Delivery Time</h2>
          <p className="text-brown-light dark:text-slate-300">Usually 3-5 business days depending on your location within India.</p>
        </div>
      </div>
    </div>
  );
};
`;

fs.writeFileSync(path.resolve('src/pages/info/RefundPolicyScreen.tsx'), refundCode);
fs.writeFileSync(path.resolve('src/pages/info/ShippingPolicyScreen.tsx'), shippingCode);

let routesContent = fs.readFileSync(path.resolve('src/routes/index.tsx'), 'utf8');

const importTarget = `import { ContactScreen } from '../pages/info/ContactScreen';`;
const importReplacement = `import { ContactScreen } from '../pages/info/ContactScreen';
import { RefundPolicyScreen } from '../pages/info/RefundPolicyScreen';
import { ShippingPolicyScreen } from '../pages/info/ShippingPolicyScreen';`;

const routeTarget = `  { path: '/profile/privacy', element: <ProtectedRoute><PrivacyPolicyScreen /></ProtectedRoute> },`;
const routeReplacement = `  { path: '/profile/privacy', element: <ProtectedRoute><PrivacyPolicyScreen /></ProtectedRoute> },
  { path: '/info/refunds', element: <ProtectedRoute><RefundPolicyScreen /></ProtectedRoute> },
  { path: '/info/shipping', element: <ProtectedRoute><ShippingPolicyScreen /></ProtectedRoute> },`;

routesContent = routesContent.replace(importTarget, importReplacement).replace(routeTarget, routeReplacement);
fs.writeFileSync(path.resolve('src/routes/index.tsx'), routesContent);
