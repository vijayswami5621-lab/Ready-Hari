import { SecureImage } from "../../components/common/SecureImage";
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  User,
  Phone,
  MapPin,
  Map,
  CheckCircle,
  Edit3,
} from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/config";
import axios from "axios";
import { useImageCacheStore } from "../../store/useImageCacheStore";
import { useGoBack } from "../../hooks/useGoBack";

export const EditProfileScreen = () => {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { user, userData, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    displayName: user?.displayName || userData?.name || "",
    phone: userData?.phone || "",
    city: userData?.city || "",
    state: userData?.state || "",
    bio: userData?.bio || "Jai Shree Ram. Devotee of Lord Krishna.",
  });

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
    let apiKey = import.meta.env.VITE_IMGBB_API_KEY || "";
    if (!apiKey) {
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
        console.warn("Could not retrieve ImgBB key from Firestore:", errConfig);
      }
    }

    if (!apiKey) {
      apiKey = "5a0318eba0e6f6f0a4a8601d0006396a";
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert("Invalid image format! Only JPG, JPEG, PNG, and WEBP are supported.");
      return null;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Image is too large! Maximum allowed size is 10MB.");
      return null;
    }

    let fileToUpload = file;
    try {
      fileToUpload = await compressImage(file);
    } catch (compressErr) {
      console.warn("Compression failed, uploading original file:", compressErr);
    }

    const uploadData = new FormData();
    uploadData.append("image", fileToUpload);

    try {
      const response = await window.fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: "POST",
        body: uploadData,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }
      
      const resData = await response.json();
      const directUrl = resData?.data?.image?.url || resData?.data?.url;
      if (!directUrl) {
        throw new Error("Invalid response, missing image URL.");
      }
      return directUrl;
    } catch (err: any) {
      console.error("ImgBB upload failed", err);
      alert(`Image upload failed: ${err.message || "Please try again."}`);
      return null;
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    try {
      let finalPhotoUrl = user.photoURL || userData?.profileImage;

      if (selectedFile) {
        const uploadedUrl = await uploadToImgBB(selectedFile);
        if (uploadedUrl) {
          finalPhotoUrl = uploadedUrl;
        }
      }

      // 1. Update Firebase Auth Profile
      if (
        auth.currentUser &&
        (formData.displayName !== user.displayName ||
          finalPhotoUrl !== user.photoURL)
      ) {
        await updateProfile(auth.currentUser, {
          displayName: formData.displayName,
          photoURL: finalPhotoUrl,
        });
      }

      // 2. Update Firestore User Document
      const userRef = doc(db, "users", user.uid);
      const newUserData = {
        ...userData,
        name: formData.displayName,
        phone: formData.phone,
        city: formData.city,
        state: formData.state,
        bio: formData.bio,
        profileImage: finalPhotoUrl,
        updatedAt: new Date(),
      };

      await setDoc(userRef, newUserData, { merge: true });

      // 3. Update local store
      setUser(auth.currentUser, newUserData);
      useImageCacheStore.setState({ globalCacheBuster: Date.now() });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        navigate("/profile");
      }, 1500);
    } catch (e) {
      console.error("Error updating profile:", e);
      alert("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const currentProfileImg =
    previewImage ||
    user?.photoURL ||
    userData?.profileImage ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.displayName || "Bhakt"}`;

  return (
    <div className="flex flex-col h-[100dvh] bg-white dark:bg-slate-900 transition-colors">
      <header className="px-4 py-4 sticky top-0 z-30 shadow-sm flex items-center justify-between bg-white dark:bg-slate-900 border-b border-orange-50 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => goBack()}
            className="p-2 -ml-2 text-brown-dark dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-full transition"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold font-sans text-brown-dark dark:text-white">
            Edit Profile
          </h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 pb-24">
        <div className="flex flex-col items-center mb-8 relative">
          <div
            className="w-24 h-24 aspect-square rounded-full border-4 border-orange-50 dark:border-slate-800 shadow-sm relative cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <SecureImage
              src={currentProfileImg}
              alt="Profile"
              className="w-full h-full rounded-full object-cover shrink-0"
            />
            <button className="absolute bottom-0 right-0 p-2 bg-saffron text-white rounded-full shadow-md hover:bg-saffron-dark transition">
              <Camera size={14} />
            </button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageChange}
          />
          <p className="text-xs text-brown-light dark:text-slate-400 mt-3 font-medium">
            Tap to change profile picture
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-brown-light dark:text-slate-400 ml-1">
              Full Name
            </label>
            <div className="flex items-center bg-orange-50/50 dark:bg-slate-800 border border-orange-100 dark:border-slate-700 rounded-xl px-4 py-3 focus-within:border-saffron focus-within:ring-2 focus-within:ring-saffron/20 transition-all">
              <User
                size={18}
                className="text-brown-light/60 dark:text-slate-500 mr-3"
              />
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                className="bg-transparent border-none outline-none w-full text-sm font-medium text-brown-dark dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-brown-light dark:text-slate-400 ml-1">
              Phone Number
            </label>
            <div className="flex items-center bg-orange-50/50 dark:bg-slate-800 border border-orange-100 dark:border-slate-700 rounded-xl px-4 py-3 focus-within:border-saffron focus-within:ring-2 focus-within:ring-saffron/20 transition-all">
              <Phone
                size={18}
                className="text-brown-light/60 dark:text-slate-500 mr-3"
              />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91"
                className="bg-transparent border-none outline-none w-full text-sm font-medium text-brown-dark dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-brown-light dark:text-slate-400 ml-1">
                City
              </label>
              <div className="flex items-center bg-orange-50/50 dark:bg-slate-800 border border-orange-100 dark:border-slate-700 rounded-xl px-4 py-3 focus-within:border-saffron focus-within:ring-2 focus-within:ring-saffron/20 transition-all">
                <MapPin
                  size={18}
                  className="text-brown-light/60 dark:text-slate-500 mr-3"
                />
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Vrindavan"
                  className="bg-transparent border-none outline-none w-full text-sm font-medium text-brown-dark dark:text-white"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-brown-light dark:text-slate-400 ml-1">
                State
              </label>
              <div className="flex items-center bg-orange-50/50 dark:bg-slate-800 border border-orange-100 dark:border-slate-700 rounded-xl px-4 py-3 focus-within:border-saffron focus-within:ring-2 focus-within:ring-saffron/20 transition-all">
                <Map
                  size={18}
                  className="text-brown-light/60 dark:text-slate-500 mr-3"
                />
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="UP"
                  className="bg-transparent border-none outline-none w-full text-sm font-medium text-brown-dark dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-brown-light dark:text-slate-400 ml-1">
              Spiritual Bio
            </label>
            <div className="flex items-start bg-orange-50/50 dark:bg-slate-800 border border-orange-100 dark:border-slate-700 rounded-xl px-4 py-3 focus-within:border-saffron focus-within:ring-2 focus-within:ring-saffron/20 transition-all">
              <Edit3
                size={18}
                className="text-brown-light/60 dark:text-slate-500 mr-3 mt-0.5 shrink-0"
              />
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                className="bg-transparent border-none outline-none w-full text-sm font-medium text-brown-dark dark:text-white resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 w-full px-6 py-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-orange-50 dark:border-slate-800 z-40">
        <button
          onClick={handleSave}
          disabled={loading || success}
          className={`w-full py-3.5 flex items-center justify-center rounded-xl font-bold text-white transition-all shadow-md active:scale-95 ${success ? "bg-green-500" : "bg-gradient-to-r from-saffron to-saffron-dark"}`}
        >
          {success ? (
            <span className="flex items-center gap-2">
              <CheckCircle size={18} /> Profile Updated
            </span>
          ) : loading ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </div>
  );
};
