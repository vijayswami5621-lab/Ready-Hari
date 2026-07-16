import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  Tag,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useStoreState } from "../../store/useStoreState";
import { SecureImage } from "../../components/common/SecureImage";
import { useGoBack } from "../../hooks/useGoBack";

export const CartScreen = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { cart, removeFromCart, updateQuantity } = useStoreState();
  const [loading, setLoading] = useState(false);

  const subtotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
  const gst = subtotal * 0.05; // 5% GST
  const shipping = subtotal > 500 ? 0 : 50;
  const total = subtotal + gst + shipping;

  const handleCheckout = () => {
    navigate("/store/checkout");
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-orange-50 dark:bg-slate-900 overflow-hidden">
      {/* HEADER */}
      <header className="px-6 py-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-30 shadow-sm flex items-center gap-4">
        <button
          onClick={() => goBack()}
          className="text-brown-dark dark:text-white"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold font-sans text-brown-dark dark:text-white">
          Your Cart
        </h1>
      </header>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto p-6 pb-32">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-orange-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <ShoppingCart size={40} className="text-saffron-dark" />
            </div>
            <h2 className="text-lg font-bold text-brown-dark dark:text-white">
              Your cart is empty
            </h2>
            <p className="text-sm text-brown-light dark:text-slate-400 mt-2">
              Add items to start shopping
            </p>
            <button
              onClick={() => navigate("/store")}
              className="mt-6 px-6 py-2 bg-saffron text-white font-bold rounded-lg shadow-md hover:bg-saffron-dark transition"
            >
              Explore Store
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* CART ITEMS */}
            <div className="space-y-4">
              <AnimatePresence>
                {cart.map((item) => (
                  <motion.div
                    key={item.productId}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, height: 0, margin: 0 }}
                    className="glass-card dark:glass-card-dark p-3 flex gap-4 relative overflow-hidden"
                  >
                    <div className="w-20 h-20 bg-orange-50 dark:bg-slate-700 rounded-xl overflow-hidden shrink-0">
                      <SecureImage
                        src={item.image || ""}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 py-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-brown-dark dark:text-white line-clamp-1">
                          {item.title}
                        </h3>
                        <p className="text-saffron-dark font-bold mt-1">
                          ₹{item.price}
                        </p>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center gap-3 bg-orange-50 dark:bg-slate-800 px-2 py-1 rounded-lg border border-orange-100 dark:border-slate-700">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                Math.max(1, item.quantity - 1),
                              )
                            }
                            className="text-brown-light hover:text-saffron transition"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-xs font-bold w-4 text-center dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity + 1)
                            }
                            className="text-brown-light hover:text-saffron transition"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-brown-light hover:text-red-500 transition p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* COUPON CODE */}
            <div className="glass-card dark:glass-card-dark p-4 flex gap-3 items-center">
              <Tag size={20} className="text-saffron" />
              <input
                type="text"
                placeholder="Apply Coupon Code"
                className="flex-1 bg-transparent border-none outline-none text-sm dark:text-white"
              />
              <button className="text-saffron-dark text-xs font-bold">
                APPLY
              </button>
            </div>

            {/* BILL DETAILS */}
            <div className="glass-card dark:glass-card-dark p-5">
              <h3 className="font-bold font-sans text-brown-dark dark:text-white mb-4">
                Bill Details
              </h3>
              <div className="space-y-3 text-sm text-brown-light dark:text-slate-300 border-b border-orange-100 dark:border-slate-700 pb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5%)</span>
                  <span>₹{gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span
                    className={
                      shipping === 0 ? "text-green-600 font-medium" : ""
                    }
                  >
                    {shipping === 0 ? "FREE" : `₹${shipping}`}
                  </span>
                </div>
              </div>
              <div className="flex justify-between mt-4 font-bold text-brown-dark dark:text-white text-lg">
                <span>Grand Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2 mt-4 text-[10px] text-green-600 bg-green-50 dark:bg-green-900/30 p-2 rounded-lg">
                <ShieldCheck size={14} /> Safe and secure payments
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CHECKOUT BAR */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 w-full px-6 py-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-orange-100 dark:border-slate-800 z-40 flex justify-between items-center">
          <div>
            <p className="text-[10px] text-brown-light dark:text-slate-400">
              Total Amount
            </p>
            <p className="text-xl font-bold text-brown-dark dark:text-white leading-none">
              ₹{total.toFixed(2)}
            </p>
          </div>
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-1/2 py-3.5 bg-gradient-to-r from-saffron to-saffron-dark text-white font-bold rounded-xl shadow-lg active:scale-95 transition-transform"
          >
            {loading ? "Processing..." : "Proceed to Pay"}
          </button>
        </div>
      )}
    </div>
  );
};
