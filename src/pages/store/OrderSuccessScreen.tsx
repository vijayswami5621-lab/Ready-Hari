import React from "react";
import { motion } from "motion/react";
import { SEO } from "../../components/SEO";
import { CheckCircle2, Package, ArrowRight, Truck } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import { SecureImage } from "../../components/common/SecureImage";

export const OrderSuccessScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useAppSettings();
  const state = location.state as { orderId?: string; humanOrderId?: string; paymentId?: string };

  const orderId =
    state?.humanOrderId ||
    state?.orderId ||
    `HP${Math.floor(100000 + Math.random() * 900000)}`;
  const paymentId =
    state?.paymentId ||
    `pay_${Math.floor(10000000 + Math.random() * 90000000)}`;

  // Estimated delivery date (3-5 days from now)
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 4);
  const formattedDeliveryDate = deliveryDate.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-900 transition-colors flex flex-col items-center justify-center p-6 text-center">
      <SEO
        title="Order Success | Hari Pathshala"
        description="Order placed successfully."
      />

      {settings?.appLogo && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-20 h-20 aspect-square bg-white rounded-full p-2 shadow-md mb-8 flex items-center justify-center overflow-hidden shrink-0"
        >
          <SecureImage
            src={settings.appLogo}
            alt="Hari Pathshala"
            imageClassName="object-contain"
            className="w-full h-full"
          />
        </motion.div>
      )}

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-500/20"
      >
        <CheckCircle2 size={48} />
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-2xl font-bold font-sans text-brown-dark dark:text-white mb-2"
      >
        Payment Successful!
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-sm text-brown-light dark:text-slate-400 mb-8 max-w-sm"
      >
        Your order has been confirmed and is being processed. Thank you for
        shopping with Hari Pathshala.
      </motion.p>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-orange-100 dark:border-slate-700 w-full max-w-sm mb-8 text-left space-y-4"
      >
        <div className="flex justify-between border-b border-orange-50 dark:border-slate-700 pb-3">
          <span className="text-xs text-brown-light dark:text-slate-400">
            Order Number
          </span>
          <span className="text-sm font-bold text-brown-dark dark:text-white">
            {orderId.toUpperCase()}
          </span>
        </div>
        <div className="flex justify-between border-b border-orange-50 dark:border-slate-700 pb-3">
          <span className="text-xs text-brown-light dark:text-slate-400">
            Transaction ID
          </span>
          <span className="text-sm font-bold text-brown-dark dark:text-white">
            {paymentId}
          </span>
        </div>
        <div className="flex justify-between pt-1">
          <span className="text-xs text-brown-light dark:text-slate-400">
            Est. Delivery
          </span>
          <span className="text-sm font-bold text-green-600 dark:text-green-400">
            {formattedDeliveryDate}
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-3 w-full max-w-sm"
      >
        <button
          onClick={() => navigate("/profile/orders")}
          className="w-full bg-saffron text-white py-3.5 rounded-xl font-bold shadow-md shadow-saffron/20 flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Package size={18} /> View My Orders
        </button>
        <button
          onClick={() => navigate("/store/track-order/" + orderId)}
          className="w-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Truck size={18} /> Track Shipment
        </button>
        <button
          onClick={() => navigate("/store")}
          className="w-full bg-white dark:bg-slate-800 text-brown-dark dark:text-white py-3.5 rounded-xl font-bold border border-orange-100 dark:border-slate-700 flex items-center justify-center gap-2 hover:bg-orange-50 dark:hover:bg-slate-700 active:scale-95 transition-transform"
        >
          Continue Shopping <ArrowRight size={18} />
        </button>
      </motion.div>
    </div>
  );
};
