import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase/config";
import { motion } from "motion/react";
import { Mail, Lock, LogIn } from "lucide-react";
import { SEO } from "../../components/SEO";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import { SecureImage } from "../../components/common/SecureImage";

export const LoginScreen = () => {
  const { settings } = useAppSettings();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";
  const { setUser } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      // Wait for App.tsx's onAuthStateChanged to update the store before redirect?
      // Actually, onAuthStateChanged sets the store, but navigation happens immediately.
      // App router checks store state, so maybe we shouldn't navigate here if we rely on App router?
      // Well, when `setUser` is called, `isAuthenticated` becomes true, and router redirects.
      navigate(from);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col justify-center px-6 relative overflow-hidden dark:bg-slate-900 transition-colors duration-300">
      <SEO
        title="Login | Hari Pathshala"
        description="Login to your Hari Pathshala account."
      />
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-saffron-light rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-golden rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 z-10 w-full max-w-md mx-auto"
      >
        <div className="text-center mb-8 flex flex-col items-center">
          {settings?.appLogo && (
            <div className="w-20 h-20 aspect-square bg-white p-1 rounded-full shadow-md mb-4 flex items-center justify-center overflow-hidden shrink-0">
              <SecureImage
                src={settings.appLogo}
                alt="Logo"
                imageClassName="object-contain"
                className="w-full h-full"
              />
            </div>
          )}
          <h1 className="text-3xl font-bold font-devanagari text-brown-dark">
            हरि पाठशाला
          </h1>
          <p className="text-brown-light font-medium mt-2">Welcome Back!</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
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
          <div>
            <label className="block text-sm font-medium text-brown-dark mb-1">
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-light/50"
                size={20}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-white/50 border border-white/40 focus:border-saffron focus:ring-2 focus:ring-saffron/20 rounded-xl outline-none transition-all"
                placeholder="Enter your password"
              />
            </div>
            <div className="flex justify-end mt-2">
              <Link
                to="/auth/forgot-password"
                className="text-sm text-saffron-dark font-medium hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-saffron to-saffron-dark text-white font-bold rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all flex justify-center items-center gap-2"
          >
            {loading ? (
              <span className="animate-pulse">Signing In...</span>
            ) : (
              <>
                <LogIn size={20} /> Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-brown-light">
          Don't have an account?{" "}
          <Link
            to="/auth/register" state={{ from }}
            className="text-saffron-dark font-bold hover:underline"
          >
            Register here
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
