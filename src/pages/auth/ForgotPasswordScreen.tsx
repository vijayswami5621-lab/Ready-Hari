import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase/config";
import { motion } from "motion/react";
import { Mail, ArrowLeft, KeyRound } from "lucide-react";
import { SEO } from "../../components/SEO";

export const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent! Check your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col justify-center px-6 relative dark:bg-slate-900 transition-colors duration-300">
      <SEO
        title="Forgot Password | Hari Pathshala"
        description="Reset your Hari Pathshala account password."
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 z-10 w-full max-w-md mx-auto"
      >
        <Link
          to="/auth/login"
          className="inline-flex items-center text-brown-light hover:text-saffron-dark mb-6 transition-colors"
        >
          <ArrowLeft size={18} className="mr-1" /> Back to Login
        </Link>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-saffron/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound size={32} className="text-saffron-dark" />
          </div>
          <h2 className="text-2xl font-bold font-sans text-brown-dark">
            Reset Password
          </h2>
          <p className="text-brown-light text-sm mt-2">
            Enter your email to receive a reset link
          </p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        {message && (
          <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4 text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-brown-dark mb-1">
              Email
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-light/50"
                size={20}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/40 focus:border-saffron focus:ring-2 focus:ring-saffron/20 rounded-xl outline-none transition-all"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-saffron to-saffron-dark text-white font-bold rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all"
          >
            {loading ? (
              <span className="animate-pulse">Sending...</span>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
