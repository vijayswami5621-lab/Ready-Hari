import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../../firebase/config";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { initializeUserNaamJap } from "../../services/naamJapService";
import { motion } from "motion/react";
import { User, Mail, Lock, UserPlus, Image as ImageIcon } from "lucide-react";
import axios from "axios";
import { SEO } from "../../components/SEO";
import { useAppSettings } from "../../contexts/AppSettingsContext";
import { SecureImage } from "../../components/common/SecureImage";

export const RegisterScreen = () => {
  const { settings } = useAppSettings();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [agree, setAgree] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";
  const { setUser } = useAuthStore();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(e.target.files[0]);
    }
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        console.warn("Invalid file type, bypassing compression:", file.type);
        return resolve(file);
      }

      if (file.size <= 500 * 1024) {
        return resolve(file);
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_DIM = 1200;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve(file);
          }
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return resolve(file);
              }
              const compressedFile = new File([blob], file.name.substring(0, file.name.lastIndexOf('.')) + '.jpg', {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            0.8
          );
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  const uploadToImgBB = async (file: File) => {
    let apiKey = "";
    try {
      const configDocRef = doc(db, "api_config", "imgbb");
      const configDocSnap = await getDoc(configDocRef);
      if (configDocSnap.exists()) {
        const configData = configDocSnap.data();
        if (configData && configData.apiKey) {
          apiKey = configData.apiKey;
        }
      } else {
        apiKey = "5a0318eba0e6f6f0a4a8601d0006396a";
        await setDoc(configDocRef, {
          apiKey: apiKey,
          provider: "ImgBB",
          updatedAt: new Date().toISOString()
        });
      }
    } catch (errConfig) {
      console.warn("Could not retrieve ImgBB key from Firestore, using fallback:", errConfig);
      apiKey = "5a0318eba0e6f6f0a4a8601d0006396a";
    }

    const fallbackUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=" + encodeURIComponent(email || "Bhakt");

    if (!apiKey) {
      return fallbackUrl;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert("Invalid image format! Only JPG, JPEG, PNG, and WEBP are supported.");
      return fallbackUrl;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Image is too large! Maximum allowed size is 10MB.");
      return fallbackUrl;
    }

    let fileToUpload = file;
    try {
      fileToUpload = await compressImage(file);
    } catch (compressErr) {
      console.warn("Compression failed, uploading original file:", compressErr);
    }

    const formData = new FormData();
    formData.append("image", fileToUpload);

    try {
      const res = await axios.post(
        `https://api.imgbb.com/1/upload?key=${apiKey}`,
        formData,
      );
      const directUrl = res?.data?.data?.image?.url || res?.data?.data?.url;
      if (!directUrl) {
        throw new Error("Invalid response, missing image URL.");
      }
      return directUrl;
    } catch (err) {
      console.error("ImgBB upload failed", err);
      return fallbackUrl;
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!agree) {
      setError("Please accept the Privacy Policy");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      let photoURL = "";
      if (profileImage) {
        photoURL = await uploadToImgBB(profileImage);
      } else {
        photoURL = "https://api.dicebear.com/7.x/avataaars/svg?seed=" + email;
      }

      await updateProfile(user, { displayName: name, photoURL });

      // Save to Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name,
        email,
        profileImage: photoURL,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        role: "user",
        status: "active",
      });

      // Initialize Naam Jap stats
      await initializeUserNaamJap(user.uid, name, photoURL);

      navigate(from);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col justify-center py-10 px-6 relative overflow-y-auto dark:bg-slate-900 transition-colors duration-300">
      <SEO
        title="Register | Hari Pathshala"
        description="Create an account and start your spiritual journey with Hari Pathshala."
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 z-10 w-full max-w-md mx-auto my-auto"
      >
        <div className="text-center mb-6 flex flex-col items-center">
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
          <h2 className="text-2xl font-bold font-sans text-brown-dark">
            Create Account
          </h2>
          <p className="text-brown-light text-sm mt-1">
            Start your spiritual journey
          </p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-brown-dark mb-1">
              Full Name
            </label>
            <div className="relative">
              <User
                className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-light/50"
                size={18}
              />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-white/40 focus:border-saffron focus:ring-2 focus:ring-saffron/20 rounded-xl outline-none transition-all text-sm"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-brown-dark mb-1">
              Email
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-light/50"
                size={18}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-white/40 focus:border-saffron focus:ring-2 focus:ring-saffron/20 rounded-xl outline-none transition-all text-sm"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-brown-dark mb-1">
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-light/50"
                size={18}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-white/40 focus:border-saffron focus:ring-2 focus:ring-saffron/20 rounded-xl outline-none transition-all text-sm"
                placeholder="Create password"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-brown-dark mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-brown-light/50"
                size={18}
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-white/50 border border-white/40 focus:border-saffron focus:ring-2 focus:ring-saffron/20 rounded-xl outline-none transition-all text-sm"
                placeholder="Confirm password"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-brown-dark mb-1">
              Profile Image (Optional)
            </label>
            <div className="relative flex items-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full text-sm text-brown-light file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-saffron/10 file:text-saffron-dark hover:file:bg-saffron/20 transition-all"
              />
            </div>
          </div>

          <div className="flex items-start mt-2">
            <input
              type="checkbox"
              id="agree"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-1 mr-2 accent-saffron"
            />
            <label htmlFor="agree" className="text-xs text-brown-light">
              I accept the Privacy Policy and Terms of Service
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 bg-gradient-to-r from-saffron to-saffron-dark text-white font-bold rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all flex justify-center items-center gap-2"
          >
            {loading ? (
              <span className="animate-pulse">Registering...</span>
            ) : (
              <>
                <UserPlus size={18} /> Register
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-brown-light">
          Already have an account?{" "}
          <Link
            to="/auth/login" state={{ from }}
            className="text-saffron-dark font-bold hover:underline"
          >
            Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
