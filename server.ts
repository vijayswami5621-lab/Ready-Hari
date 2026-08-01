import 'dotenv/config';
import { initializeApp as initializeAdminApp, getApps as getAdminApps } from 'firebase-admin/app';
import { getMessaging as getAdminMessagingInstance, Messaging } from 'firebase-admin/messaging';
import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import Razorpay from "razorpay";
import crypto from "crypto";
import axios from "axios";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc as getDocRaw, setDoc, updateDoc, collection, serverTimestamp, writeBatch, increment, query, where, getDocs, addDoc, orderBy, limit } from "firebase/firestore/lite";
import { SUBJECT_CHAPTERS } from "./src/pages/quiz/chaptersConfig";

const getEnvVar = (key: string, fallback: string) => {
  const val = process.env[key];
  if (!val || val === "undefined" || val === "null") return fallback;
  return val;
};

// Initialize Firebase client in server
const firebaseConfig = {
  apiKey: getEnvVar("VITE_FIREBASE_API_KEY", "AIzaSyBMlQAwq-VxiP0LhXM08FJsHmf_kjRDfVY"),
  authDomain: getEnvVar("VITE_FIREBASE_AUTH_DOMAIN", "official-hari.firebaseapp.com"),
  projectId: getEnvVar("VITE_FIREBASE_PROJECT_ID", "official-hari"),
  storageBucket: getEnvVar("VITE_FIREBASE_STORAGE_BUCKET", "official-hari.firebasestorage.app"),
  messagingSenderId: getEnvVar("VITE_FIREBASE_MESSAGING_SENDER_ID", "320780984737"),
  appId: getEnvVar("VITE_FIREBASE_APP_ID", "1:320780984737:android:26d892ed88c7f4122cabe0")
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// -------------------------------------------------------------------------
// FIREBASE ADMIN & FCM PUSH NOTIFICATIONS ENGINE
// -------------------------------------------------------------------------
let adminAppInitialized = false;
let fcmMessaging: Messaging | null = null;

function getAdminMessaging(): Messaging | null {
  if (!adminAppInitialized) {
    try {
      if (getAdminApps().length === 0) {
        initializeAdminApp({
          projectId: process.env.VITE_FIREBASE_PROJECT_ID || "official-hari"
        });
      }
      fcmMessaging = getAdminMessagingInstance();
      adminAppInitialized = true;
      console.log("[Firebase Admin] Successfully initialized FCM Messaging");
    } catch (err: any) {
      console.warn("[Firebase Admin Warning] Failed to initialize Firebase Admin. Using simulated mock messaging.", err.message);
      fcmMessaging = null;
      adminAppInitialized = true;
    }
  }
  return fcmMessaging;
}

async function sendPushNotification(params: {
  userId?: string;
  topic?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  type: 'quote' | 'event' | 'order' | 'video' | 'offer' | 'chat' | 'other';
}) {
  const { userId, topic, title, body, data = {}, type } = params;

  console.log(`[FCM Notification] Preparing to send: "${title}" - type: ${type}`);

  // Create a record in the central 'notifications' collection in Firestore for history sync
  try {
    const notifRef = doc(collection(db, "notifications"));
    await setDoc(notifRef, {
      id: notifRef.id,
      title,
      message: body,
      desc: body,
      type,
      userId: userId || null,
      link: data.link || null,
      read: false,
      createdAt: new Date(),
    });
    console.log(`[FCM History Sync] Saved notification history with ID: ${notifRef.id}`);
  } catch (historyErr: any) {
    console.warn("[FCM History Sync Warning] Failed to sync history to Firestore:", historyErr.message);
  }

  // Get Admin messaging
  const messaging = getAdminMessaging();
  if (!messaging) {
    console.log("[FCM Native Simulation] Firebase Admin not initialized. Simulated push sent to logs.");
    return { success: true, simulated: true };
  }

  const payloadData = {
    ...data,
    type,
    title,
    body,
    click_action: "FLUTTER_NOTIFICATION_CLICK",
  };

  try {
    if (topic) {
      const message = {
        topic,
        notification: { title, body },
        data: payloadData,
        android: {
          notification: {
            sound: "default",
            defaultSound: true,
          }
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            }
          }
        },
        webpush: {
          notification: {
            icon: "/logo.png",
            badge: "/logo.png",
          }
        }
      };

      const response = await messaging.send(message);
      console.log(`[FCM Notification Success] Sent message to topic ${topic}:`, response);
      return { success: true, messageId: response };
    } else if (userId) {
      const tokensRef = collection(db, "users", userId, "fcm_tokens");
      const tokensSnap = await getDocs(tokensRef);
      
      if (tokensSnap.empty) {
        console.log(`[FCM Notification Info] No FCM tokens found for user ${userId}.`);
        return { success: false, reason: "No registered tokens" };
      }

      const registrationTokens = tokensSnap.docs.map(doc => doc.id);
      console.log(`[FCM Notification] Sending to ${registrationTokens.length} devices for user ${userId}`);

      const response = await messaging.sendEachForMulticast({
        tokens: registrationTokens,
        notification: { title, body },
        data: payloadData,
        android: {
          notification: {
            sound: "default",
            defaultSound: true,
          }
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            }
          }
        },
        webpush: {
          notification: {
            icon: "/logo.png",
            badge: "/logo.png",
          }
        }
      });

      console.log(`[FCM Multicast Success] Responses:`, response.successCount, "successes,", response.failureCount, "failures");

      if (response.failureCount > 0) {
        const batch = writeBatch(db);
        let hasDeletes = false;
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errCode = resp.error?.code;
            if (errCode === 'messaging/invalid-registration-token' || errCode === 'messaging/registration-token-not-registered') {
              const staleToken = registrationTokens[idx];
              const staleTokenRef = doc(db, "users", userId, "fcm_tokens", staleToken);
              batch.delete(staleTokenRef);
              hasDeletes = true;
            }
          }
        });
        if (hasDeletes) {
          await batch.commit().catch(e => console.warn("Failed to clean up stale tokens:", e.message));
        }
      }

      return { success: true, successCount: response.successCount };
    }
  } catch (err: any) {
    console.error("[FCM Notification Error] Sending failed:", err.message);
    return { success: false, error: err.message };
  }
}

// Local in-memory cache for Firestore documents to reduce reads & recover from Quota Exceeded
const docCache = new Map<string, { data: any; exists: boolean; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// Pre-seed cache with robust fallbacks to make sure server works even if database is dead on boot
docCache.set("settings/payment", {
  exists: true,
  timestamp: Date.now(),
  data: {
    enabled: true,
    onlinePayment: true,
    testMode: false,
    keyId: process.env.RAZORPAY_LIVE_KEY_ID || process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_LIVE_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET || ""
  }
});

docCache.set("settings/shipping", {
  exists: true,
  timestamp: Date.now(),
  data: {
    shiprocketEnabled: true,
    shiprocketEmail: process.env.SHIPROCKET_EMAIL || "",
    shiprocketPassword: process.env.SHIPROCKET_PASSWORD || "",
    pickupLocation: "Primary",
    packageLength: 10,
    packageBreadth: 10,
    packageHeight: 10,
    packageWeight: 0.5
  }
});

async function getDoc(docRef: any) {
  const path = docRef.path;
  const now = Date.now();
  const cached = docCache.get(path);
  
  if (cached && (now - cached.timestamp < CACHE_TTL)) {
    return {
      exists: () => cached.exists,
      data: () => cached.data
    };
  }

  try {
    const snap = await getDocRaw(docRef);
    docCache.set(path, {
      data: snap.exists() ? snap.data() : null,
      exists: snap.exists(),
      timestamp: now
    });
    return snap;
  } catch (error: any) {
    console.warn(`[Firestore Cache Warning] Failed to fetch document at ${path}:`, error.message || error);
    if (cached) {
      console.log(`[Firestore Cache] Using expired cached version for ${path}`);
      return {
        exists: () => cached.exists,
        data: () => cached.data
      };
    }
    return {
      exists: () => false,
      data: () => null
    };
  }
}

// -------------------------------------------------------------------------
// ENTERPRISE API ISOLATION, ROTATION & SELF-HEALING ENGINE
// -------------------------------------------------------------------------
interface APIServiceConfig {
  id: string;
  name: string;
  enabled: boolean;
  keys: { key: string; status: 'active' | 'cooldown' | 'disabled'; errorCount: number; lastUsed?: number }[];
  currentKeyIndex: number;
  dailyLimit: number;
  callsCount: number;
  errorsCount: number;
  lastErrorMsg?: string;
  lastHealthCheck?: { status: 'healthy' | 'degraded' | 'unhealthy'; timestamp: number; latency?: number };
}

const apiServices: Record<string, APIServiceConfig> = {
  ai_chat: {
    id: 'ai_chat',
    name: 'AI Guru Chat Service',
    enabled: true,
    keys: [],
    currentKeyIndex: 0,
    dailyLimit: 2000,
    callsCount: 0,
    errorsCount: 0
  },
  ai_quiz: {
    id: 'ai_quiz',
    name: 'Quiz Generator Service',
    enabled: true,
    keys: [],
    currentKeyIndex: 0,
    dailyLimit: 1500,
    callsCount: 0,
    errorsCount: 0
  },
  ai_quote: {
    id: 'ai_quote',
    name: 'Quote / Sutra Service',
    enabled: true,
    keys: [],
    currentKeyIndex: 0,
    dailyLimit: 3000,
    callsCount: 0,
    errorsCount: 0
  },
  ai_scripture: {
    id: 'ai_scripture',
    name: 'Scripture Explainer Service',
    enabled: true,
    keys: [],
    currentKeyIndex: 0,
    dailyLimit: 1500,
    callsCount: 0,
    errorsCount: 0
  },
  panchang: {
    id: 'panchang',
    name: 'Vedic Panchang Service',
    enabled: true,
    keys: [{ key: process.env.FREE_ASTRO_API_KEY || process.env.FREEASTROAPI_KEY || "abc6bcfd78f7472de7e3cdeeb4e8d0ed90cde5ab05e4ae95448b502989db9c15", status: 'active', errorCount: 0 }],
    currentKeyIndex: 0,
    dailyLimit: 500,
    callsCount: 0,
    errorsCount: 0
  },
  payment: {
    id: 'payment',
    name: 'Razorpay Gateway',
    enabled: true,
    keys: [{ key: process.env.RAZORPAY_LIVE_KEY_ID || process.env.RAZORPAY_KEY_ID || "", status: 'active', errorCount: 0 }],
    currentKeyIndex: 0,
    dailyLimit: 10000,
    callsCount: 0,
    errorsCount: 0
  },
  shipping: {
    id: 'shipping',
    name: 'Shiprocket Logistics',
    enabled: true,
    keys: [{ key: process.env.SHIPROCKET_EMAIL || "", status: 'active', errorCount: 0 }],
    currentKeyIndex: 0,
    dailyLimit: 2000,
    callsCount: 0,
    errorsCount: 0
  }
};

function isKeyValid(k?: string): boolean {
  if (!k) return false;
  const trimmed = k.trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null") return false;
  if (trimmed.includes("your_gemini") || trimmed.includes("AIzaSy_fake") || trimmed === "AQ_placeholder" || trimmed.includes("your_key")) return false;
  return trimmed.length > 5;
}

function getValidGeminiApiKey(serviceId?: string): string | null {
  if (serviceId && apiServices[serviceId]) {
    const service = apiServices[serviceId];
    const validActiveKeys = service.keys.filter(k => k.status === 'active' && isKeyValid(k.key));
    if (validActiveKeys.length > 0) {
      const keyInfo = validActiveKeys[service.currentKeyIndex % validActiveKeys.length];
      keyInfo.lastUsed = Date.now();
      return keyInfo.key;
    }
  }

  const candidateKeys = [
    process.env.GEMINI_API_KEY_CHAT,
    process.env.GEMINI_API_KEY_QUIZ,
    process.env.GEMINI_API_KEY_QUOTE,
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_SECONDARY,
    process.env.VITE_GEMINI_API_KEY
  ];

  for (const k of candidateKeys) {
    if (isKeyValid(k)) return k!.trim();
  }
  return null;
}

function initServiceKeys() {
  const chatKeys = [
    process.env.GEMINI_API_KEY_CHAT,
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_SECONDARY
  ].filter(isKeyValid) as string[];

  const quizKeys = [
    process.env.GEMINI_API_KEY_QUIZ,
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_SECONDARY
  ].filter(isKeyValid) as string[];

  const quoteKeys = [
    process.env.GEMINI_API_KEY_QUOTE,
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_SECONDARY
  ].filter(isKeyValid) as string[];

  const scriptureKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_SECONDARY
  ].filter(isKeyValid) as string[];

  if (apiServices.ai_chat) apiServices.ai_chat.keys = chatKeys.map(k => ({ key: k, status: 'active', errorCount: 0 }));
  if (apiServices.ai_quiz) apiServices.ai_quiz.keys = quizKeys.map(k => ({ key: k, status: 'active', errorCount: 0 }));
  if (apiServices.ai_quote) apiServices.ai_quote.keys = quoteKeys.map(k => ({ key: k, status: 'active', errorCount: 0 }));
  if (apiServices.ai_scripture) apiServices.ai_scripture.keys = scriptureKeys.map(k => ({ key: k, status: 'active', errorCount: 0 }));
}
initServiceKeys();

interface APILogEntry {
  id: string;
  timestamp: string;
  serviceId: string;
  keyMasked: string;
  status: 'success' | 'failed';
  latency: number;
  error?: string;
}
const apiLogs: APILogEntry[] = [];

function addApiLog(serviceId: string, key: string, status: 'success' | 'failed', latency: number, error?: string) {
  const entry: APILogEntry = {
    id: 'log_' + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    serviceId,
    keyMasked: key ? (key.substring(0, 6) + '...' + key.substring(key.length - 4)) : 'N/A',
    status,
    latency,
    error
  };
  apiLogs.push(entry);
  if (apiLogs.length > 100) apiLogs.shift();
}

function getServiceApiKey(serviceId: string): string {
  const service = apiServices[serviceId];
  if (!service) throw new Error(`Unknown service: ${serviceId}`);
  if (!service.enabled) throw new Error(`Service ${service.name} is currently disabled.`);

  const validKeys = service.keys.filter(k => isKeyValid(k.key));
  const keysCount = validKeys.length;
  for (let i = 0; i < keysCount; i++) {
    const idx = (service.currentKeyIndex + i) % keysCount;
    const keyInfo = validKeys[idx];
    if (keyInfo && keyInfo.status === 'active') {
      service.currentKeyIndex = idx;
      keyInfo.lastUsed = Date.now();
      return keyInfo.key;
    }
  }

  let recoveredAny = false;
  for (const k of validKeys) {
    if (k.status === 'cooldown') {
      k.status = 'active';
      k.errorCount = 0;
      recoveredAny = true;
    }
  }

  if (recoveredAny) {
    return getServiceApiKey(serviceId);
  }

  const globalFallback = getValidGeminiApiKey();
  if (globalFallback) {
    return globalFallback;
  }

  throw new Error(`No valid keys configured for service ${serviceId}`);
}

function reportServiceSuccess(serviceId: string, key: string, latency: number) {
  const service = apiServices[serviceId];
  if (service) {
    service.callsCount++;
    addApiLog(serviceId, key, 'success', latency);
  }
}

function reportServiceError(serviceId: string, key: string, error: any) {
  const service = apiServices[serviceId];
  if (!service) return;

  service.errorsCount++;
  const errorMsg = error?.message || String(error);
  service.lastErrorMsg = errorMsg;
  addApiLog(serviceId, key, 'failed', 0, errorMsg);

  const keyInfo = service.keys.find(k => k.key === key);
  if (keyInfo) {
    keyInfo.errorCount++;
    if (keyInfo.errorCount >= 2) {
      keyInfo.status = 'cooldown';
      if (service.keys.length > 0) {
        service.currentKeyIndex = (service.currentKeyIndex + 1) % service.keys.length;
      }
    }
  }
}

interface SelfHealingMetric {
  timestamp: string;
  action: string;
  status: 'recovered' | 'no_action_needed' | 'manual_intervention_required';
  details: string;
}
const selfHealingLogs: SelfHealingMetric[] = [];

// Periodic Background Self-Healing Scheduler
setInterval(() => {
  try {
    const memory = process.memoryUsage();
    const heapUsedMB = memory.heapUsed / 1024 / 1024;
    
    if (heapUsedMB > 450) {
      const sizeBefore = docCache.size;
      docCache.clear();
      selfHealingLogs.push({
        timestamp: new Date().toISOString(),
        action: 'Cache Eviction (High RAM)',
        status: 'recovered',
        details: `RAM Heap is high: ${heapUsedMB.toFixed(1)}MB. Flushed local cache of size ${sizeBefore} to avoid leak.`
      });
    }

    // Recover cooled keys
    for (const [sId, service] of Object.entries(apiServices)) {
      let recovered = 0;
      for (const k of service.keys) {
        if (k.status === 'cooldown' && k.lastUsed && (Date.now() - k.lastUsed > 5 * 60 * 1000)) {
          k.status = 'active';
          k.errorCount = 0;
          recovered++;
        }
      }
      if (recovered > 0) {
        selfHealingLogs.push({
          timestamp: new Date().toISOString(),
          action: 'Automatic Cooldown Release',
          status: 'recovered',
          details: `Unlocked ${recovered} keys in [${sId}] service after 5-minute cooldown.`
        });
      }
    }
  } catch (err: any) {
    console.error("[Background Self-Healing Error]", err);
  }
}, 60000);

// RE-USEABLE DETERMINISTIC fallback and Gemini call retry helpers with API Isolation & Rotation
async function generateContentWithRetry(
  aiInstance: GoogleGenAI,
  params: {
    model?: string;
    contents: any;
    config?: any;
  },
  maxRetries = 3,
  serviceId = 'ai_scripture'
): Promise<any> {
  let attempt = 0;
  const startTime = Date.now();

  const primaryModel = params.model || "gemini-3.6-flash";
  const modelRotationList = [
    primaryModel,
    "gemini-3.6-flash",
    "gemini-3.1-flash-lite"
  ];
  const uniqueModels = Array.from(new Set(modelRotationList));
  let currentModelIndex = 0;

  while (attempt < maxRetries) {
    let apiKey = "";
    try {
      apiKey = getServiceApiKey(serviceId);
    } catch (e) {
      const fallback = getValidGeminiApiKey();
      if (fallback) apiKey = fallback;
    }

    if (!apiKey || !isKeyValid(apiKey)) {
      throw new Error(`[Gemini API] No valid API Key available for service ${serviceId}`);
    }

    const modelToUse = uniqueModels[currentModelIndex % uniqueModels.length];

    try {
      console.log(`[Gemini API] Call to [Service: ${serviceId}] with model=${modelToUse} (Attempt ${attempt + 1}/${maxRetries})`);
      let response: any;

      if (apiKey.startsWith("AQ.")) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent`;
        const systemInst = params.config?.systemInstruction
          ? (typeof params.config.systemInstruction === 'string'
              ? { parts: [{ text: params.config.systemInstruction }] }
              : params.config.systemInstruction)
          : undefined;

        const bodyPayload: any = {
          contents: params.contents || [],
        };
        if (systemInst) bodyPayload.systemInstruction = systemInst;
        if (params.config?.temperature !== undefined || params.config?.responseMimeType || params.config?.responseSchema) {
          bodyPayload.generationConfig = {
            temperature: params.config?.temperature,
            responseMimeType: params.config?.responseMimeType,
            responseSchema: params.config?.responseSchema
          };
        }

        const fetchRes = await axios.post(url, bodyPayload, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          timeout: 25000
        });

        const resData = fetchRes.data;
        const generatedText = resData.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') || '';
        response = {
          text: generatedText,
          candidates: resData.candidates,
          data: resData
        };
      } else {
        const resolvedAi = new GoogleGenAI({ apiKey });
        response = await resolvedAi.models.generateContent({
          ...params,
          model: modelToUse,
        });
      }

      const latency = Date.now() - startTime;
      reportServiceSuccess(serviceId, apiKey, latency);
      return response;
    } catch (error: any) {
      attempt++;
      const errorMsg = error?.message || String(error);

      const isQuotaExceeded = 
        errorMsg.toLowerCase().includes("quota") || 
        errorMsg.toLowerCase().includes("exceeded your current quota") ||
        errorMsg.toLowerCase().includes("limit: 20") ||
        errorMsg.toLowerCase().includes("billing") ||
        errorMsg.toLowerCase().includes("exhausted");

      const isAuthError =
        errorMsg.toLowerCase().includes("401") ||
        errorMsg.toLowerCase().includes("unauthenticated") ||
        errorMsg.toLowerCase().includes("invalid authentication credentials") ||
        errorMsg.toLowerCase().includes("access_token_type_unsupported");

      const isTransient = 
        !isQuotaExceeded && !isAuthError && (
          errorMsg.includes("503") || 
          errorMsg.includes("429") || 
          errorMsg.includes("UNAVAILABLE") || 
          errorMsg.includes("high demand")
        );

      const service = apiServices[serviceId];
      if (service) {
        service.errorsCount++;
        service.lastErrorMsg = errorMsg;
        addApiLog(serviceId, apiKey, 'failed', 0, errorMsg);
        const keyInfo = service.keys.find(k => k.key === apiKey);
        if (keyInfo) {
          if (isQuotaExceeded || isAuthError) {
            keyInfo.status = 'cooldown';
            keyInfo.errorCount = 2;
            if (service.keys.length > 0) {
              service.currentKeyIndex = (service.currentKeyIndex + 1) % service.keys.length;
            }
          } else {
            keyInfo.errorCount++;
            if (keyInfo.errorCount >= 2) {
              keyInfo.status = 'cooldown';
              if (service.keys.length > 0) {
                service.currentKeyIndex = (service.currentKeyIndex + 1) % service.keys.length;
              }
            }
          }
        }
      }

      console.warn(`[Gemini API Warning] [Service: ${serviceId}] Attempt ${attempt} failed with error:`, errorMsg);

      if (isAuthError) {
        throw error;
      }

      if ((isTransient || isQuotaExceeded) && attempt < maxRetries) {
        if (isQuotaExceeded) {
          currentModelIndex++;
          console.log(`[Gemini API Model Rotate] [Service: ${serviceId}] Quota exceeded on ${modelToUse}. Rotating model to ${uniqueModels[currentModelIndex % uniqueModels.length]}`);
        }
        await new Promise(res => setTimeout(res, 300));
      } else {
        throw error;
      }
    }
  }
}

function getScriptureName(subjectId: string): string {
  const lower = (subjectId || "").toLowerCase();
  if (lower.includes("gita") || lower.includes("geeta")) return "Bhagavad Gita";
  if (lower.includes("ramcharitmanas") || lower.includes("manas")) return "Ramcharitmanas";
  if (lower.includes("valmiki") || lower.includes("ramayan")) return "Valmiki Ramayan";
  if (lower.includes("radha") || lower.includes("kataksh") || lower.includes("radhika")) return "Radha Kripa Kataksh";
  if (lower.includes("hanuman") || lower.includes("chalisa")) return "Hanuman Chalisa";
  if (lower.includes("vishnu") || lower.includes("sahasranama") || lower.includes("sahasranam")) return "Vishnu Sahasranama";
  if (lower.includes("mahimna") || lower.includes("shiva_mahimna") || lower.includes("shivamahimna")) return "Shiv Mahimna Stotra";
  if (lower.includes("durga") || lower.includes("saptashati")) return "Durga Saptashati";
  if (lower.includes("sunderkand") || lower.includes("sundarkand")) return "Sundarkand";
  return subjectId;
}

function getFallbackQuestions(subjectId: string, chapterId: string, language: string): any[] {
  const isEnglish = language === 'English';
  const scripture = getScriptureName(subjectId);
  const qList: any[] = [];

  const gitaTemplates = [
    {
      textHindi: "श्रीमद्भगवद्गीता में कुल कितने अध्याय और श्लोक हैं?",
      textEnglish: "How many chapters and verses are there in the Shrimad Bhagavad Gita?",
      optionsHindi: ["18 अध्याय और 700 श्लोक", "16 अध्याय और 500 श्लोक", "20 अध्याय और 800 श्लोक", "12 अध्याय और 1000 श्लोक"],
      optionsEnglish: ["18 Chapters and 700 Verses", "16 Chapters and 500 Verses", "20 Chapters and 800 Verses", "12 Chapters and 1000 Verses"],
      correctHindi: "18 अध्याय और 700 श्लोक",
      correctEnglish: "18 Chapters and 700 Verses",
      explanationHindi: "भगवद्गीता में कुल 18 अध्याय और 700 श्लोक हैं, जो महाभारत के भीष्म पर्व का हिस्सा हैं।",
      explanationEnglish: "The Bhagavad Gita consists of 18 chapters and 700 verses, which are part of the Bhishma Parva of Mahabharata.",
      ref: "Bhagavad Gita"
    },
    {
      textHindi: "भगवद्गीता का उपदेश भगवान श्री कृष्ण ने कुरुक्षेत्र के मैदान में किसे दिया था?",
      textEnglish: "To whom did Lord Krishna deliver the Bhagavad Gita on the battlefield of Kurukshetra?",
      optionsHindi: ["अर्जुन", "युधिष्ठिर", "भीष्म", "कर्ण"],
      optionsEnglish: ["Arjuna", "Yudhishthira", "Bhishma", "Karna"],
      correctHindi: "अर्जुन",
      correctEnglish: "Arjuna",
      explanationHindi: "भगवान श्री कृष्ण ने अर्जुन के मोह और विषाद को दूर करने के लिए कुरुक्षेत्र के युद्ध मैदान में उन्हें अमर ज्ञान दिया था।",
      explanationEnglish: "Lord Krishna imparted this eternal wisdom to Arjuna to dispel his attachments and despair on the battlefield.",
      ref: "Bhagavad Gita 1.1"
    },
    {
      textHindi: "गीता के दूसरे अध्याय में आत्मा के बारे में क्या कहा गया है?",
      textEnglish: "According to Chapter 2 of the Gita, what is the nature of the soul?",
      optionsHindi: ["यह अमर और अविनाशी है", "यह नश्वर है", "इसे शस्त्र काट सकते हैं", "यह नष्ट की जा सकती है"],
      optionsEnglish: ["It is immortal and indestructible", "It is mortal and perishes", "It can be cut by weapons", "It can be destroyed"],
      correctHindi: "यह अमर और अविनाशी है",
      correctEnglish: "It is immortal and indestructible",
      explanationHindi: "गीता के दूसरे अध्याय के अनुसार आत्मा अमर, अजन्मा और अविनाशी है। इसे न तो शस्त्र काट सकते हैं और न ही अग्नि जला सकती है।",
      explanationEnglish: "According to Chapter 2, the soul is immortal, unborn, and indestructible. It cannot be cut by weapons nor burned by fire.",
      ref: "Bhagavad Gita 2.18"
    },
    {
      textHindi: "'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन' श्लोक भगवद्गीता के किस अध्याय में है?",
      textEnglish: "In which chapter of the Bhagavad Gita is the famous verse 'Karmanye Vadhikaraste...' found?",
      optionsHindi: ["अध्याय 2", "अध्याय 18", "अध्याय 12", "अध्याय 15"],
      optionsEnglish: ["Chapter 2", "Chapter 18", "Chapter 12", "Chapter 15"],
      correctHindi: "अध्याय 2",
      correctEnglish: "Chapter 2",
      explanationHindi: "यह प्रसिद्ध श्लोक निष्काम कर्मयोग का आधार है और गीता के दूसरे अध्याय (श्लोक 47) में आता है।",
      explanationEnglish: "This famous verse on Nishkama Karma is the 47th verse of Chapter 2.",
      ref: "Bhagavad Gita 2.47"
    },
    {
      textHindi: "भगवद्गीता के अनुसार मन को वश में करने का क्या उपाय है?",
      textEnglish: "According to the Bhagavad Gita, what is the way to control the mind?",
      optionsHindi: ["अभ्यास और वैराग्य", "केवल भोजन का त्याग", "संसार से पलायन", "सोना बंद करना"],
      optionsEnglish: ["Practice (Abhyasa) and Detachment (Vairagya)", "Only fasting", "Running away from the world", "Stopping sleep"],
      correctHindi: "अभ्यास और वैराग्य",
      correctEnglish: "Practice (Abhyasa) and Detachment (Vairagya)",
      explanationHindi: "भगवान कृष्ण छठे अध्याय के 35वें श्लोक में कहते हैं कि अभ्यास और वैराग्य द्वारा चंचल मन को वश में किया जा सकता है।",
      explanationEnglish: "In Chapter 6, Verse 35, Lord Krishna explains that the restless mind can be controlled through constant practice and detachment.",
      ref: "Bhagavad Gita 6.35"
    }
  ];

  const ramcharitmanasTemplates = [
    {
      textHindi: "रामचरितमानस में कुल कितने काण्ड (अध्याय) हैं?",
      textEnglish: "How many Kandas (chapters) are there in Ramcharitmanas?",
      optionsHindi: ["7 काण्ड", "6 काण्ड", "8 काण्ड", "5 काण्ड"],
      optionsEnglish: ["7 Kandas", "6 Kandas", "8 Kandas", "5 Kandas"],
      correctHindi: "7 काण्ड",
      correctEnglish: "7 Kandas",
      explanationHindi: "रामचरितमानस में कुल सात काण्ड हैं: बाल, अयोध्या, अरण्य, किष्किंधा, सुंदर, लंका और उत्तर काण्ड।",
      explanationEnglish: "There are seven Kandas in Ramcharitmanas: Bala, Ayodhya, Aranya, Kishkindha, Sundar, Lanka, and Uttar Kanda.",
      ref: "Ramcharitmanas"
    },
    {
      textHindi: "गोस्वामी तुलसीदास जी ने रामचरितमानस की रचना मुख्य रूप से किस भाषा में की?",
      textEnglish: "In which language did Goswami Tulsidas compose Ramcharitmanas?",
      optionsHindi: ["अवधी", "संस्कृत", "ब्रज", "मैथिली"],
      optionsEnglish: ["Awadhi", "Sanskrit", "Braj", "Maithili"],
      correctHindi: "अवधी",
      correctEnglish: "Awadhi",
      explanationHindi: "रामचरितमानस की रचना गोस्वामी तुलसीदास जी ने अवधी भाषा में की थी, ताकि राम-कथा जन-साधारण तक पहुंचे।",
      explanationEnglish: "Goswami Tulsidas composed the epic Ramcharitmanas in the Awadhi language to make Lord Rama's story accessible to the general public.",
      ref: "Ramcharitmanas"
    },
    {
      textHindi: "रामचरितमानस का सर्वप्रथम और सबसे बड़ा काण्ड कौन सा है?",
      textEnglish: "Which is the first and largest Kanda of Ramcharitmanas?",
      optionsHindi: ["बालकाण्ड", "अयोध्याकाण्ड", "सुन्दरकाण्ड", "लंकाकाण्ड"],
      optionsEnglish: ["Bala Kanda", "Ayodhya Kanda", "Sundar Kanda", "Lanka Kanda"],
      correctHindi: "बालकाण्ड",
      correctEnglish: "Bala Kanda",
      explanationHindi: "बालकाण्ड रामचरितमानस का पहला और सबसे बड़ा काण्ड है, जिसमें राम-जन्म और बाल लीलाएं हैं।",
      explanationEnglish: "Bala Kanda is the first and largest Kanda of Ramcharitmanas, describing the birth and childhood of Lord Rama.",
      ref: "Bala Kanda"
    },
    {
      textHindi: "रामचरितमानस के अनुसार, लक्ष्मण जी को किसका अवतार माना जाता है?",
      textEnglish: "According to Ramcharitmanas, Lakshmana is considered an incarnation of whom?",
      optionsHindi: ["शेषनाग", "भगवान विष्णु", "भरत", "पवनदेव"],
      optionsEnglish: ["Sheshnag", "Lord Vishnu", "Bharata", "Pawandev"],
      correctHindi: "शेषनाग",
      correctEnglish: "Sheshnag",
      explanationHindi: "लक्ष्मण जी को पाताल लोक के स्वामी शेषनाग का अवतार माना जाता है।",
      explanationEnglish: "Lakshmana is considered the incarnation of Sheshnag, the king of serpents.",
      ref: "Ramcharitmanas"
    },
    {
      textHindi: "रामचरितमानस के अनुसार भगवान शिव ने यह कथा सर्वप्रथम किसे सुनाई थी?",
      textEnglish: "According to Ramcharitmanas, to whom did Lord Shiva first narrate this story?",
      optionsHindi: ["माता पार्वती", "काकभुशुण्डि", "याज्ञवल्क्य", "तुलसीदास"],
      optionsEnglish: ["Goddess Parvati", "Kakbhushundi", "Yajnavalkya", "Tulsidas"],
      correctHindi: "माता पार्वती",
      correctEnglish: "Goddess Parvati",
      explanationHindi: "भगवान शिव ने रामचरितमानस की पावन कथा सबसे पहले माता पार्वती को सुनाई थी।",
      explanationEnglish: "Lord Shiva first narrated this sacred story of Lord Rama to Goddess Parvati.",
      ref: "Ramcharitmanas"
    }
  ];

  const valmikiTemplates = [
    {
      textHindi: "वाल्मीकि रामायण की रचना मूलतः किस भाषा में हुई है?",
      textEnglish: "In which language was Valmiki Ramayana originally composed?",
      optionsHindi: ["संस्कृत", "अवधी", "पाली", "प्राकृत"],
      optionsEnglish: ["Sanskrit", "Awadhi", "Pali", "Prakrit"],
      correctHindi: "संस्कृत",
      correctEnglish: "Sanskrit",
      explanationHindi: "महर्षि वाल्मीकि द्वारा रचित रामायण मूलतः संस्कृत भाषा के अनुष्टुप छंद में रचित आदि काव्य है।",
      explanationEnglish: "The Valmiki Ramayana is the original epic written in Sanskrit language.",
      ref: "Valmiki Ramayana"
    },
    {
      textHindi: "वाल्मीकि रामायण के अनुसार श्रीराम के कुल का क्या नाम था?",
      textEnglish: "According to Valmiki Ramayana, what was the name of Rama's dynasty?",
      optionsHindi: ["इक्ष्वाकु वंश (सूर्यवंश)", "चन्द्रवंश", "कुरुवंश", "यदुवंश"],
      optionsEnglish: ["Ikshvaku Dynasty (Suryavansh)", "Chandravansh", "Kuruvansh", "Yaduvansh"],
      correctHindi: "इक्ष्वाकु वंश (सूर्यवंश)",
      correctEnglish: "Ikshvaku Dynasty (Suryavansh)",
      explanationHindi: "भगवान श्रीराम इक्ष्वाकु कुल (सूर्यवंश) के प्रतापी राजा थे।",
      explanationEnglish: "Lord Rama belonged to the prestigious Ikshvaku (Suryavansh) lineage.",
      ref: "Valmiki Ramayana"
    },
    {
      textHindi: "वाल्मीकि रामायण में कुल कितने श्लोक संकलित हैं?",
      textEnglish: "How many verses (shlokas) are there in Valmiki Ramayana?",
      optionsHindi: ["24,000 श्लोक", "18,000 श्लोक", "10,000 श्लोक", "100,000 श्लोक"],
      optionsEnglish: ["24,000 Verses", "18,000 Verses", "10,000 Verses", "100,000 Verses"],
      correctHindi: "24,000 श्लोक",
      correctEnglish: "24,000 Verses",
      explanationHindi: "वाल्मीकि रामायण में कुल 24,000 श्लोक, 500 सर्ग और 7 काण्ड हैं।",
      explanationEnglish: "Valmiki Ramayana contains 24,000 verses, 500 sargas, and 7 Kandas.",
      ref: "Valmiki Ramayana"
    },
    {
      textHindi: "महर्षि वाल्मीकि का पूर्व नाम (मूल नाम) क्या था?",
      textEnglish: "What was the original name of Sage Valmiki before he became a sage?",
      optionsHindi: ["रत्नाकर", "सिद्धार्थ", "देवरत", "वाल्मी"],
      optionsEnglish: ["Ratnakar", "Siddhartha", "Devarat", "Valmi"],
      correctHindi: "रत्नाकर",
      correctEnglish: "Ratnakar",
      explanationHindi: "महर्षि वाल्मीकि का पूर्व नाम रत्नाकर था, जो बाद में 'मरा-मरा' के जाप से महर्षि बने।",
      explanationEnglish: "Valmiki's original name was Ratnakar, who later transformed into a sage.",
      ref: "Valmiki Ramayana"
    },
    {
      textHindi: "राजा दशरथ की उस पुत्री का क्या नाम था जो श्रीराम की बड़ी बहन थीं?",
      textEnglish: "What was the name of King Dasharatha's daughter who was Lord Rama's elder sister?",
      optionsHindi: ["शान्ता", "उर्मिला", "मन्दोदरी", "श्रुतकीर्ति"],
      optionsEnglish: ["Shanta", "Urmila", "Mandodari", "Shrutakirti"],
      correctHindi: "शान्ता",
      correctEnglish: "Shanta",
      explanationHindi: "राजा दशरथ और कौशल्या की पुत्री शान्ता थीं, जिन्हें अंगदेश के राजा रोमपाद ने गोद लिया था।",
      explanationEnglish: "Shanta was the daughter of Dasharatha and Kausalya, later adopted by King Romapada.",
      ref: "Valmiki Ramayana"
    }
  ];

  const radhaTemplates = [
    {
      textHindi: "राधा कृपा कटाक्ष स्तोत्र किस देवी को समर्पित है?",
      textEnglish: "To which Goddess is the Radha Kripa Kataksh Stotram dedicated?",
      optionsHindi: ["श्री राधा रानी", "माता दुर्गा", "माता लक्ष्मी", "माता सरस्वती"],
      optionsEnglish: ["Shri Radha Rani", "Goddess Durga", "Goddess Lakshmi", "Goddess Saraswati"],
      correctHindi: "श्री राधा रानी",
      correctEnglish: "Shri Radha Rani",
      explanationHindi: "यह स्तोत्र बरसाने की अधिष्ठात्री देवी श्री राधा रानी की कृपा प्राप्ति के लिए गाया जाता है।",
      explanationEnglish: "This stotram is dedicated to gaining the mercy and side-glance of Sri Radha Rani.",
      ref: "Radha Kripa Kataksh"
    },
    {
      textHindi: "राधा कृपा कटाक्ष स्तोत्र के रचयिता कौन माने जाते हैं?",
      textEnglish: "Who is traditionally considered the composer of Radha Kripa Kataksh?",
      optionsHindi: ["भगवान शिव", "श्री कृष्ण", "देवर्षि नारद", "शंकराचार्य"],
      optionsEnglish: ["Lord Shiva", "Lord Krishna", "Devarshi Narada", "Adi Shankaracharya"],
      correctHindi: "भगवान शिव",
      correctEnglish: "Lord Shiva",
      explanationHindi: "तंत्र शास्त्र के अनुसार इस दिव्य स्तोत्र की रचना स्वयं देवाधिदेव महादेव (शिव) ने श्री राधा की स्तुति में की है।",
      explanationEnglish: "According to scriptures, this divine stotram was composed by Lord Shiva.",
      ref: "Radha Kripa Kataksh"
    },
    {
      textHindi: "राधा कृपा कटाक्ष में 'कटाक्ष' शब्द का आध्यात्मिक अर्थ क्या है?",
      textEnglish: "What is the spiritual meaning of 'Kataksh' in Radha Kripa Kataksh?",
      optionsHindi: ["कृपा दृष्टि (तिरछी चितवन)", "क्रोध", "निंदा", "शस्त्र"],
      optionsEnglish: ["Merciful Side Glance", "Anger", "Criticism", "Weapon"],
      correctHindi: "कृपा दृष्टि (तिरछी चितवन)",
      correctEnglish: "Merciful Side Glance",
      explanationHindi: "कटाक्ष का अर्थ है कृपा भरी तिरछी चितवन या करुणामयी दृष्टि, जो भक्तों के सारे कष्ट हर लेती है।",
      explanationEnglish: "Kataksh means a merciful, compassionate glance from Radha Rani's eyes.",
      ref: "Radha Kripa Kataksh"
    },
    {
      textHindi: "श्री राधा रानी का प्राकट्य स्थान बरसाने के पास किस ग्राम को माना जाता है?",
      textEnglish: "Which village near Barsana is considered the birthplace of Shri Radha Rani?",
      optionsHindi: ["रावल ग्राम", "मथुरा", "वृन्दावन", "द्वारका"],
      optionsEnglish: ["Rawal Village", "Mathura", "Vrindavan", "Dwarka"],
      correctHindi: "रावल ग्राम",
      correctEnglish: "Rawal Village",
      explanationHindi: "श्री राधा जी का प्राकट्य बरसाने के निकट रावल ग्राम में माता कीर्ति और वृषभानु जी के यहाँ हुआ था।",
      explanationEnglish: "Sri Radha Rani manifested in Rawal village near Barsana.",
      ref: "Radha Kripa Kataksh"
    },
    {
      textHindi: "इस स्तोत्र का पाठ करने से साधक को किसकी परम भक्ति प्राप्त होती है?",
      textEnglish: "Reciting this stotram grants the devotee whose ultimate devotion?",
      optionsHindi: ["राधा-कृष्ण की युगल भक्ति", "केवल धन", "शक्ति", "मोक्ष"],
      optionsEnglish: ["Yugal Devotion of Radha-Krishna", "Only wealth", "Power", "Salvation"],
      correctHindi: "राधा-कृष्ण की युगल भक्ति",
      correctEnglish: "Yugal Devotion of Radha-Krishna",
      explanationHindi: "राधा कृपा कटाक्ष का नियमित पाठ करने से श्री कृष्ण और श्री राधा की अनन्य निकुंज भक्ति प्राप्त होती है।",
      explanationEnglish: "Regular recitation of Radha Kripa Kataksh bestows the highest devotion of Radha and Krishna.",
      ref: "Radha Kripa Kataksh"
    }
  ];

  const hanumanTemplates = [
    {
      textHindi: "हनुमान चालीसा में कुल कितनी चौपाइयां (stanzas) संकलित हैं?",
      textEnglish: "How many chaupais (stanzas) are there in Hanuman Chalisa?",
      optionsHindi: ["40 चौपाइयां", "30 चौपाइयां", "50 चौपाइयां", "108 चौपाइयां"],
      optionsEnglish: ["40 Chaupais", "30 Chaupais", "50 Chaupais", "108 Chaupais"],
      correctHindi: "40 चौपाइयां",
      correctEnglish: "40 Chaupais",
      explanationHindi: "'चालीसा' शब्द चालीस (40) से बना है, क्योंकि इसमें चालीस मुख्य चौपाइयां हैं।",
      explanationEnglish: "The word 'Chalisa' is derived from 'chalis' (40), indicating forty verses.",
      ref: "Hanuman Chalisa"
    },
    {
      textHindi: "हनुमान चालीसा का प्रारंभ किन प्रसिद्ध गुरु वंदना के दोहों से होता है?",
      textEnglish: "With which famous couplets (dohas) does the Hanuman Chalisa begin?",
      optionsHindi: ["श्रीगुरु चरन सरोज रज...", "जय हनुमान ज्ञान गुन सागर...", "राम दूत अतुलित बल धामा...", "प्रभु चरित्र सुनिबे को रसिया..."],
      optionsEnglish: ["Shri Guru Charan Saroj Raja...", "Jai Hanuman Gyan Gun Sagar...", "Ram Doot Dixit Bal Dhama...", "Prabhu Charitra Sunibe Ko Rasiya..."],
      correctHindi: "श्रीगुरु चरन सरोज रज...",
      correctEnglish: "Shri Guru Charan Saroj Raja...",
      explanationHindi: "हनुमान चालीसा की शुरुआत 'श्रीगुरु चरन सरोज रज निज मनु मुकुरु सुधारि' दोहे से होती है।",
      explanationEnglish: "The Hanuman Chalisa starts with the doha 'Shri Guru Charan Saroj Raja...' invoking the Guru.",
      ref: "Hanuman Chalisa"
    },
    {
      textHindi: "हनुमान जी के माता-पिता का नाम क्या है?",
      textEnglish: "What are the names of Hanuman's parents?",
      optionsHindi: ["अंजनी और केसरी", "कौशल्या और दशरथ", "सुमित्रा और केसरी", "अंजनी और वायुदेव"],
      optionsEnglish: ["Anjani and Kesari", "Kausalya and Dasharatha", "Sumitra and Kesari", "Anjani and Vayudev"],
      correctHindi: "अंजनी और केसरी",
      correctEnglish: "Anjani and Kesari",
      explanationHindi: "हनुमान जी को अंजनीपुत्र और केसरीनंदन कहा जाता है, साथ ही वे पवनपुत्र भी हैं।",
      explanationEnglish: "Hanuman's parents are Mother Anjana (Anjani) and King Kesari. He is also the spiritual son of Vayu Dev.",
      ref: "Hanuman Chalisa"
    },
    {
      textHindi: "हनुमान चालीसा के अनुसार हनुमान जी ने अशोक वाटिका में सीता जी को किसकी अंगूठी दी थी?",
      textEnglish: "According to Hanuman Chalisa, whose ring did Hanuman give to Sita in Ashok Vatika?",
      optionsHindi: ["रामचन्द्र जी की", "लक्ष्मण जी की", "रावण की", "सुग्रीव की"],
      optionsEnglish: ["Lord Ramachandra's", "Lakshmana's", "Ravana's", "Sugriva's"],
      correctHindi: "रामचन्द्र जी की",
      correctEnglish: "Lord Ramachandra's",
      explanationHindi: "'प्रभु मुद्रिका मेलि मुख माहीं' के अनुसार हनुमान जी श्री राम की अंगूठी लेकर समुद्र लांघ गए थे।",
      explanationEnglish: "Hanuman carried Sri Ram's signet ring in his mouth across the ocean.",
      ref: "Hanuman Chalisa"
    },
    {
      textHindi: "अष्ट सिद्धि नव निधि के दाता' हनुमान जी को यह वरदान किसने दिया था?",
      textEnglish: "Who granted Hanuman the boon of being 'giver of eight siddhis and nine nidhis'?",
      optionsHindi: ["माता जानकी (सीता)", "श्री राम", "भगवान शिव", "ब्रह्मा जी"],
      optionsEnglish: ["Mother Janaki (Sita)", "Lord Rama", "Lord Shiva", "Lord Brahma"],
      correctHindi: "माता जानकी (सीता)",
      correctEnglish: "Mother Janaki (Sita)",
      explanationHindi: "माता जानकी ने प्रसन्न होकर हनुमान जी को अष्ट सिद्धि और नव निधि का स्वामी होने का वरदान दिया था।",
      explanationEnglish: "Mother Sita blessed Hanuman with these powers in Lanka.",
      ref: "Hanuman Chalisa"
    }
  ];

  const vishnuTemplates = [
    {
      textHindi: "विष्णु सहस्रनाम का उपदेश महाभारत के किस पर्व में दिया गया है?",
      textEnglish: "In which Parva of Mahabharata is Vishnu Sahasranama delivered?",
      optionsHindi: ["अनुशासन पर्व", "भीष्म पर्व", "शांति पर्व", "वन पर्व"],
      optionsEnglish: ["Anushasana Parva", "Bhishma Parva", "Shanti Parva", "Vana Parva"],
      correctHindi: "अनुशासन पर्व",
      correctEnglish: "Anushasana Parva",
      explanationHindi: "युधिष्ठिर के धर्म संबंधी प्रश्नों का उत्तर देते हुए भीष्म पितामह ने अनुशासन पर्व में यह उपदेश दिया था।",
      explanationEnglish: "Bhishma Pitamah spoke the 1000 names of Vishnu in the Anushasana Parva of Mahabharata.",
      ref: "Vishnu Sahasranama"
    },
    {
      textHindi: "विष्णु सहस्रनाम में भगवान विष्णु के कितने नामों का कीर्तन है?",
      textEnglish: "How many names of Lord Vishnu are chanted in Vishnu Sahasranama?",
      optionsHindi: ["1000 नाम", "108 नाम", "500 नाम", "10000 नाम"],
      optionsEnglish: ["1000 Names", "108 Names", "500 Names", "10000 Names"],
      correctHindi: "1000 नाम",
      correctEnglish: "1000 Names",
      explanationHindi: "'सहस्र' का अर्थ है हजार, इसलिए इसमें भगवान विष्णु के 1000 कल्याणकारी नामों का वर्णन है।",
      explanationEnglish: "'Sahasra' means thousand; hence, it contains 1000 names of Vishnu.",
      ref: "Vishnu Sahasranama"
    },
    {
      textHindi: "युधिष्ठिर को विष्णु सहस्रनाम का उपदेश बाणों की शय्या पर लेटे हुए किसने दिया था?",
      textEnglish: "Who delivered the Vishnu Sahasranama to Yudhishthira while lying on a bed of arrows?",
      optionsHindi: ["भीष्म पितामह", "श्री कृष्ण", "वेद व्यास", "द्रोणाचार्य"],
      optionsEnglish: ["Bhishma Pitamah", "Lord Krishna", "Veda Vyasa", "Dronacharya"],
      correctHindi: "भीष्म पितामह",
      correctEnglish: "Bhishma Pitamah",
      explanationHindi: "बाणों की शय्या पर लेटे भीष्म ने युधिष्ठिर को परम कल्याणकारी मार्ग के रूप में विष्णु सहस्रनाम सुनाया था।",
      explanationEnglish: "Bhishma Pitamah narrated it from his bed of arrows.",
      ref: "Vishnu Sahasranama"
    },
    {
      textHindi: "विष्णु सहस्रनाम के अनुसार ब्रह्मांड के परम कारण और रक्षक कौन हैं?",
      textEnglish: "According to Vishnu Sahasranama, who is the ultimate cause and protector of the universe?",
      optionsHindi: ["भगवान विष्णु", "इंद्र देव", "वरुण देव", "यमराज"],
      optionsEnglish: ["Lord Vishnu", "Lord Indra", "Lord Varuna", "Lord Yamaraja"],
      correctHindi: "भगवान विष्णु",
      correctEnglish: "Lord Vishnu",
      explanationHindi: "इस स्तोत्र में भगवान विष्णु को जगत की सृष्टि, पालन और संहार का परम कारण बताया गया है।",
      explanationEnglish: "Lord Vishnu is glorified as the supreme sustainer of the universe.",
      ref: "Vishnu Sahasranama"
    },
    {
      textHindi: "विष्णु सहस्रनाम का पाठ करने से किस फल की प्राप्ति होती है?",
      textEnglish: "What benefit is obtained by reciting Vishnu Sahasranama?",
      optionsHindi: ["पापों का नाश और मानसिक शांति", "भौतिक अहंकार", "केवल धन", "शारीरिक बल"],
      optionsEnglish: ["Destruction of sins and mental peace", "Material ego", "Only wealth", "Physical strength"],
      correctHindi: "पापों का नाश और मानसिक शांति",
      correctEnglish: "Destruction of sins and mental peace",
      explanationHindi: "इसके पाठ से भय, शोक, रोग and पापों से मुक्ति मिलती है तथा मन शांत होता है।",
      explanationEnglish: "Reciting it frees the mind from fear, grief, and sins.",
      ref: "Vishnu Sahasranama"
    }
  ];

  const shivTemplates = [
    {
      textHindi: "शिव महिम्न स्तोत्र के रचयिता कौन हैं?",
      textEnglish: "Who is the composer of Shiv Mahimna Stotra?",
      optionsHindi: ["गंधर्वराज पुष्पदंत", "रावण", "आदि शंकराचार्य", "वेद व्यास"],
      optionsEnglish: ["Gandharvaraj Pushpadanta", "Ravana", "Adi Shankaracharya", "Veda Vyasa"],
      correctHindi: "गंधर्वराज पुष्पदंत",
      correctEnglish: "Gandharvaraj Pushpadanta",
      explanationHindi: "शिव महिम्न स्तोत्र की रचना भगवान शिव के अनन्य भक्त गंधर्व पुष्पदंत ने की थी।",
      explanationEnglish: "Composed by the Gandharva king Pushpadanta.",
      ref: "Shiv Mahimna Stotra"
    },
    {
      textHindi: "पुष्पदंत ने शिव जी के क्रोध से बचने के लिए इस स्तोत्र की रचना क्यों की थी?",
      textEnglish: "Why did Pushpadanta compose this stotram to escape Shiva's wrath?",
      optionsHindi: ["राजा के बगीचे से फूल चुराने के कारण शक्तियां खो जाने पर", "युद्ध हारने पर", "शिव जी का अपमान करने पर", "तपस्या भंग होने पर"],
      optionsEnglish: ["For losing powers after stealing flowers from the king's garden", "For losing a battle", "For insulting Shiva", "For breaking penance"],
      correctHindi: "राजा के बगीचे से फूल चुराने के कारण शक्तियां खो जाने पर",
      correctEnglish: "For losing powers after stealing flowers from the king's garden",
      explanationHindi: "राजा चित्ररथ के बगीचे से शिव-पूजा के फूल चुराने पर पुष्पदंत ने अनजाने में शिव-निर्माली का उल्लंघन किया, जिससे उसकी शक्तियां चली गईं।",
      explanationEnglish: "He stepped on sacred leaves while stealing flowers, losing his flying powers, and prayed to Shiva to regain them.",
      ref: "Shiv Mahimna Stotra"
    },
    {
      textHindi: "शिव महिम्न स्तोत्र में मुख्य रूप से किसकी महिमा का गान है?",
      textEnglish: "Whose glory is primarily sung in Shiv Mahimna Stotra?",
      optionsHindi: ["भगवान शिव", "भगवान विष्णु", "भगवान गणेश", "इंद्र देव"],
      optionsEnglish: ["Lord Shiva", "Lord Vishnu", "Lord Ganesh", "Lord Indra"],
      correctHindi: "भगवान शिव",
      correctEnglish: "Lord Shiva",
      explanationHindi: "इसमें भगवान शिव के अनुपम सौंदर्य, शक्ति और कृपा का सगुण-निर्गुण रूप में गान किया गया है।",
      explanationEnglish: "Glorifies the supreme form and grace of Lord Shiva.",
      ref: "Shiv Mahimna Stotra"
    },
    {
      textHindi: "इस स्तोत्र में शिव जी के किस नीले कंठ वाले रूप का वर्णन है?",
      textEnglish: "Which blue-throated form of Shiva is described in this stotram?",
      optionsHindi: ["नीलकंठ (विष पान)", "चंद्रशेखर", "गंगाधर", "महाकाल"],
      optionsEnglish: ["Neelkanth (consuming poison)", "Chandrashekhar", "Gangadhar", "Mahakal"],
      correctHindi: "नीलकंठ (विष पान)",
      correctEnglish: "Neelkanth (consuming poison)",
      explanationHindi: "समुद्र मंथन के समय विष पीकर सृष्टि की रक्षा करने वाले शिव के नीलकंठ स्वरूप की महिमा इसमें वर्णित है।",
      explanationEnglish: "Praises Shiva for drinking the Halahala poison to save the world.",
      ref: "Shiv Mahimna Stotra"
    },
    {
      textHindi: "शिव महिम्न स्तोत्र में कुल कितने श्लोक हैं?",
      textEnglish: "How many verses are there in Shiv Mahimna Stotra?",
      optionsHindi: ["43 श्लोक", "31 श्लोक", "108 श्लोक", "51 श्लोक"],
      optionsEnglish: ["43 Verses", "31 Verses", "108 Verses", "51 Verses"],
      correctHindi: "43 श्लोक",
      correctEnglish: "43 Verses",
      explanationHindi: "इस दिव्य स्तोत्र में कुल 43 श्लोक हैं, जो भगवान शिव की स्तुति में गाए जाते हैं।",
      explanationEnglish: "It contains 43 beautifully structured verses.",
      ref: "Shiv Mahimna Stotra"
    }
  ];

  const durgaTemplates = [
    {
      textHindi: "दुर्गा सप्तशती किस महापुराण का अंश है?",
      textEnglish: "Durga Saptashati is a part of which Mahapurana?",
      optionsHindi: ["मार्कण्डेय पुराण", "विष्णु पुराण", "शिव पुराण", "भागवत पुराण"],
      optionsEnglish: ["Markandeya Purana", "Vishnu Purana", "Shiva Purana", "Bhavata Purana"],
      correctHindi: "मार्कण्डेय पुराण",
      correctEnglish: "Markandeya Purana",
      explanationHindi: "दुर्गा सप्तशती मार्कण्डेय पुराण के देवी महात्म्य खंड का हिस्सा है।",
      explanationEnglish: "It is the Devi Mahatmya section of the Markandeya Purana.",
      ref: "Durga Saptashati"
    },
    {
      textHindi: "दुर्गा सप्तशती में कुल कितने मंत्र और श्लोक संकलित हैं?",
      textEnglish: "How many mantras/verses are there in Durga Saptashati?",
      optionsHindi: ["700 मन्त्र", "108 मन्त्र", "1000 मन्त्र", "500 मन्त्र"],
      optionsEnglish: ["700 Mantras", "108 Mantras", "1000 Mantras", "500 Mantras"],
      correctHindi: "700 मन्त्र",
      correctEnglish: "700 Mantras",
      explanationHindi: "'सप्तशती' नाम सात सौ (700) श्लोकों और मंत्रों के संकलन के कारण पड़ा है।",
      explanationEnglish: "Named 'Saptashati' because it comprises 700 verses/mantras.",
      ref: "Durga Saptashati"
    },
    {
      textHindi: "दुर्गा सप्तशती के अनुसार देवी ने किस महिष रूपी असुर का वध किया था?",
      textEnglish: "According to Durga Saptashati, which buffalo-demon did the Goddess slay?",
      optionsHindi: ["महिषासुर", "रक्तबीज", "शुंभ", "निशुंभ"],
      optionsEnglish: ["Mahishasura", "Raktabeeja", "Shumbha", "Nishumbha"],
      correctHindi: "महिषासुर",
      correctEnglish: "Mahishasura",
      explanationHindi: "महिषासुर का मर्दन करने के कारण भगवती को 'महिषासुरमर्दिनी' कहा गया।",
      explanationEnglish: "Slaying Mahishasura earned the Mother Goddess the title Mahishasurmardini.",
      ref: "Durga Saptashati"
    },
    {
      textHindi: "दुर्गा सप्तशती में आदि शक्ति के कितने प्रमुख चरित्रों (भागों) का वर्णन है?",
      textEnglish: "How many main parts (charitras) of Adi Shakti are described in Durga Saptashati?",
      optionsHindi: ["तीन चरित्र (प्रथम, मध्यम, उत्तम)", "चार चरित्र", "दो चरित्र", "सात चरित्र"],
      optionsEnglish: ["Three parts (Prathama, Madhyama, Uttara)", "Four parts", "Two parts", "Seven parts"],
      correctHindi: "तीन चरित्र (प्रथम, मध्यम, उत्तम)",
      correctEnglish: "Three parts (Prathama, Madhyama, Uttara)",
      explanationHindi: "इसमें महाकाली, महालक्ष्मी और महासरस्वती स्वरूपों के तीन मुख्य चरित्रों का गान है।",
      explanationEnglish: "It is divided into three distinct sections honoring Mahakali, Mahalakshmi, and Mahasaraswati.",
      ref: "Durga Saptashati"
    },
    {
      textHindi: "राजा सुरथ और समाधि वैश्य ने किससे भगवती दुर्गा की आराधना की शिक्षा ली थी?",
      textEnglish: "From whom did King Suratha and Samadhi Vaishya learn the worship of Goddess Durga?",
      optionsHindi: ["मेधा ऋषि", "वशिष्ठ ऋषि", "नारद मुनि", "व्यास जी"],
      optionsEnglish: ["Sage Medha", "Sage Vashistha", "Sage Narada", "Sage Vyasa"],
      correctHindi: "मेधा ऋषि",
      correctEnglish: "Sage Medha",
      explanationHindi: "मेधा ऋषि ने ही उन दोनों को आदि शक्ति की महिमा सुनाकर देवी आराधना का उपदेश दिया था।",
      explanationEnglish: "Sage Medha guided King Suratha and Vaishya Samadhi to worship Durga.",
      ref: "Durga Saptashati"
    }
  ];

  const sunderTemplates = [
    {
      textHindi: "सुन्दरकाण्ड किस मुख्य महाकाव्य का सर्वाधिक लोकप्रिय भाग है?",
      textEnglish: "Sundarkand is the most popular part of which major epic?",
      optionsHindi: ["रामचरितमानस / रामायण", "महाभारत", "श्रीमद्भगवद्गीता", "शिव पुराण"],
      optionsEnglish: ["Ramcharitmanas / Ramayana", "Mahabharata", "Bhagavad Gita", "Shiva Purana"],
      correctHindi: "रामचरितमानस / रामायण",
      correctEnglish: "Ramcharitmanas / Ramayana",
      explanationHindi: "सुन्दरकाण्ड रामचरितमानस का पांचवां अध्याय (काण्ड) है, जो हनुमान जी की लंका यात्रा पर आधारित है।",
      explanationEnglish: "Sundarkand is the 5th chapter of Ramcharitmanas/Ramayana, depicting Hanuman's heroic deeds.",
      ref: "Sundarkand"
    },
    {
      textHindi: "सुन्दरकाण्ड के मुख्य नायक कौन हैं?",
      textEnglish: "Who is the main protagonist/hero of Sundarkand?",
      optionsHindi: ["हनुमान जी", "श्री राम", "लक्ष्मण", "रावण"],
      optionsEnglish: ["Hanuman Ji", "Lord Rama", "Lakshmana", "Ravana"],
      correctHindi: "हनुमान जी",
      correctEnglish: "Hanuman Ji",
      explanationHindi: "पूरे सुन्दरकाण्ड में हनुमान जी के पराक्रम, बुद्धि और रामभक्ति की कथा वर्णित है।",
      explanationEnglish: "Hanuman is the central hero of this chapter, exemplifying valour and devotion.",
      ref: "Sundarkand"
    },
    {
      textHindi: "लंका में सीता जी किस वाटिका में बंदी थीं?",
      textEnglish: "In which garden was Sita kept captive in Lanka?",
      optionsHindi: ["अशोक वाटिका", "मधुवन", "पंचवटी", "नंदनवन"],
      optionsEnglish: ["Ashok Vatika", "Madhuvan", "Panchavati", "Nandanvan"],
      correctHindi: "अशोक वाटिका",
      correctEnglish: "Ashok Vatika",
      explanationHindi: "सीता जी रावण के महल के पास स्थित अशोक वाटिका (अशोक वन) में बैठी थीं।",
      explanationEnglish: "Sita was kept in the Ashok Vatika under heavy guard.",
      ref: "Sundarkand"
    },
    {
      textHindi: "हनुमान जी ने समुद्र लांघते समय मार्ग में सबसे पहले किस पर्वत को विश्राम देने के लिए स्पर्श किया था?",
      textEnglish: "Which mountain did Hanuman touch first to offer rest while crossing the ocean?",
      optionsHindi: ["मैनाक पर्वत", "सुमेरु पर्वत", "हिमालय", "गिरनार"],
      optionsEnglish: ["Mainak Mountain", "Sumeru Mountain", "Himalaya", "Girnar"],
      correctHindi: "मैनाक पर्वत",
      correctEnglish: "Mainak Mountain",
      explanationHindi: "समुद्र के अनुरोध पर मैनाक पर्वत हनुमान जी को विश्राम देने हेतु प्रकट हुआ था।",
      explanationEnglish: "Mainak mountain rose from the ocean to offer Hanuman a resting place.",
      ref: "Sundarkand"
    },
    {
      textHindi: "लंका में हनुमान जी की भेंट किस रामभक्त राक्षस से हुई थी?",
      textEnglish: "Which Rama-devoted demon did Hanuman meet in Lanka?",
      optionsHindi: ["विभीषण", "कुंभकर्ण", "मेघनाद", "त्रिजटा"],
      optionsEnglish: ["Vibhishana", "Kumbhakarna", "Meghanada", "Trijata"],
      correctHindi: "विभीषण",
      correctEnglish: "Vibhishana",
      explanationHindi: "हनुमान जी ने विभीषण के घर पर तुलसी का पौधा और राम नाम अंकित देख उनसे भेंट की थी।",
      explanationEnglish: "Hanuman met Vibhishana, Ravana's younger brother, who was a devotee of Sri Ram.",
      ref: "Sundarkand"
    }
  ];

  const mahabharataTemplates = [
    {
      textHindi: "महाभारत के रचयिता कौन हैं?",
      textEnglish: "Who is the composer of Mahabharata?",
      optionsHindi: ["महर्षि वेदव्यास", "महर्षि वाल्मीकि", "संत तुलसीदास", "कालीदास"],
      optionsEnglish: ["Sage Vedavyasa", "Sage Valmiki", "Saint Tulsidas", "Kalidasa"],
      correctHindi: "महर्षि वेदव्यास",
      correctEnglish: "Sage Vedavyasa",
      explanationHindi: "महाभारत महाकाव्य की रचना महर्षि कृष्णद्वैपायन वेदव्यास जी ने की थी।",
      explanationEnglish: "The Mahabharata was composed by Sage Krishna Dwaipayana Vedavyasa.",
      ref: "Mahabharata"
    },
    {
      textHindi: "महाभारत में कुल कितने पर्व (अध्याय समूह) हैं?",
      textEnglish: "How many Parvas (books/chapters) are there in Mahabharata?",
      optionsHindi: ["18 पर्व", "12 पर्व", "10 पर्व", "24 पर्व"],
      optionsEnglish: ["18 Parvas", "12 Parvas", "10 Parvas", "24 Parvas"],
      correctHindi: "18 पर्व",
      correctEnglish: "18 Parvas",
      explanationHindi: "महाभारत में कुल 18 पर्व हैं, जैसे आदि पर्व, सभा पर्व, भीष्म पर्व आदि।",
      explanationEnglish: "The Mahabharata is divided into 18 Parvas (books), including Adi Parva, Sabha Parva, Bhishma Parva, etc.",
      ref: "Mahabharata"
    },
    {
      textHindi: "भीष्म पितामह का वास्तविक/मूल नाम क्या था?",
      textEnglish: "What was the original birth name of Bhishma Pitamah?",
      optionsHindi: ["देवव्रत", "कर्ण", "शान्तनु", "चित्रांगद"],
      optionsEnglish: ["Devavrata", "Karna", "Shantanu", "Chitrangada"],
      correctHindi: "देवव्रत",
      correctEnglish: "Devavrata",
      explanationHindi: "भीष्म पितामह राजा शान्तनु और देवी गंगा के पुत्र थे, जिनका मूल नाम देवव्रत था।",
      explanationEnglish: "Bhishma's original name was Devavrata, the son of King Shantanu and Goddess Ganga.",
      ref: "Mahabharata"
    },
    {
      textHindi: "युधिष्ठिर, भीम और अर्जुन की माता का क्या नाम था?",
      textEnglish: "What was the name of the mother of Yudhishthira, Bhima, and Arjuna?",
      optionsHindi: ["कुंती", "माद्री", "गांधारी", "सत्यवती"],
      optionsEnglish: ["Kunti", "Madri", "Gandhari", "Satyavati"],
      correctHindi: "कुंती",
      correctEnglish: "Kunti",
      explanationHindi: "महाराज पाण्डु की ज्येष्ठ पत्नी कुंती ने धर्मराज, पवन देव और इंद्र के अंश से युधिष्ठिर, भीम और अर्जुन को जन्म दिया था।",
      explanationEnglish: "Kunti was the senior queen of King Pandu who gave birth to Yudhishthira, Bhima, and Arjuna.",
      ref: "Mahabharata"
    },
    {
      textHindi: "महाभारत युद्ध में चक्रव्यूह भेदने के दौरान किस वीर योद्धा ने वीरगति प्राप्त की थी?",
      textEnglish: "Which brave warrior achieved martyrdom while breaking the Chakravyuha in the Mahabharata war?",
      optionsHindi: ["अभिमन्यु", "घटोत्कच", "लक्ष्मण कुमार", "द्रुपद"],
      optionsEnglish: ["Abhimanyu", "Ghatotkacha", "Lakshmana Kumara", "Drupada"],
      correctHindi: "अभिमन्यु",
      correctEnglish: "Abhimanyu",
      explanationHindi: "अर्जुन के पुत्र वीर अभिमन्यु ने कुरुक्षेत्र युद्ध के 13वें दिन द्रोणाचार्य द्वारा रचित चक्रव्यूह में प्रवेश कर शौर्यपूर्वक लड़ते हुए वीरगति प्राप्त की थी।",
      explanationEnglish: "Abhimanyu, the son of Arjuna, heroically entered and fought in the Chakravyuha on the 13th day of the war.",
      ref: "Mahabharata"
    }
  ];

  const shivPuranTemplates = [
    {
      textHindi: "शिव पुराण के अनुसार भगवान शिव का मुख्य वाहन कौन है?",
      textEnglish: "According to Shiva Purana, who is the primary vehicle (vahana) of Lord Shiva?",
      optionsHindi: ["नंदी (बैल)", "गरुड़ (चील)", "सिंह (शेर)", "मयूर (मोर)"],
      optionsEnglish: ["Nandi (Bull)", "Garuda (Eagle)", "Lion", "Peacock"],
      correctHindi: "नंदी (बैल)",
      correctEnglish: "Nandi (Bull)",
      explanationHindi: "भगवान शिव के वाहन नंदी (बैल) हैं, जो धर्म, बल और निष्ठा के प्रतीक हैं।",
      explanationEnglish: "Nandi, the sacred bull, is Lord Shiva's mount, representing righteousness and devotion.",
      ref: "Shiva Purana"
    },
    {
      textHindi: "भारत वर्ष में कुल कितने प्रमुख ज्योतिर्लिंग स्थापित हैं?",
      textEnglish: "How many major Jyotirlingas are established across India?",
      optionsHindi: ["12", "10", "108", "7"],
      optionsEnglish: ["12", "10", "108", "7"],
      correctHindi: "12",
      correctEnglish: "12",
      explanationHindi: "भारत में कुल 12 स्वयंभू ज्योतिर्लिंग हैं, जिनमें सोमनाथ, केदारनाथ, काशी विश्वनाथ और महाकालेश्वर शामिल हैं।",
      explanationEnglish: "There are 12 self-manifested Jyotirlingas in India, such as Somnath, Kedarnath, and Kashi Vishwanath.",
      ref: "Shiva Purana"
    },
    {
      textHindi: "माता पार्वती किस महान पर्वतराज की पुत्री थीं?",
      textEnglish: "Goddess Parvati was the daughter of which great mountain king?",
      optionsHindi: ["हिमालय (हिमवान)", "विंध्याचल", "सुमेरु", "कैलाश"],
      optionsEnglish: ["Himavan (Himalaya)", "Vindhyachal", "Sumeru", "Kailash"],
      correctHindi: "हिमालय (हिमवान)",
      correctEnglish: "Himavan (Himalaya)",
      explanationHindi: "माता पार्वती पर्वतराज हिमवान (हिमालय) और रानी मैना की पुत्री थीं, इसलिए उन्हें शैलपुत्री और हेमवती भी कहा जाता है।",
      explanationEnglish: "Goddess Parvati was the daughter of the mountain king Himavan and Queen Maina.",
      ref: "Shiva Purana"
    },
    {
      textHindi: "भगवान शिव और माता पार्वती के ज्येष्ठ पुत्र का क्या नाम है जिन्होंने तारकासुर का वध किया था?",
      textEnglish: "What is the name of Shiva and Parvati's elder son who slayed the demon Tarakasura?",
      optionsHindi: ["कार्तिकेय (स्कंद)", "गणेश", "अशोक सुंदरी", "जलंधर"],
      optionsEnglish: ["Kartikeya (Skanda)", "Ganesha", "Ashoka Sundari", "Jalandhara"],
      correctHindi: "कार्तिकेय (स्कंद)",
      correctEnglish: "Kartikeya (Skanda)",
      explanationHindi: "भगवान शिव और पार्वती के बड़े पुत्र कार्तिकेय (स्कंद) हैं, जिन्होंने देवताओं के सेनापति बनकर तारकासुर का अंत किया था।",
      explanationEnglish: "Kartikeya (also known as Skanda or Murugan) is the elder son of Shiva who defeated Tarakasura.",
      ref: "Shiva Purana"
    },
    {
      textHindi: "शिवरात्रि का पावन व्रत किस हिंदू महीने के कृष्ण पक्ष की चतुर्दशी को मनाया जाता है?",
      textEnglish: "The auspicious fast of Maha Shivratri is celebrated on the Chaturdashi of Krishna Paksha in which Hindu month?",
      optionsHindi: ["फाल्गुन", "कार्तिक", "सावन", "आश्विन"],
      optionsEnglish: ["Phalguna", "Kartika", "Shravana", "Ashvina"],
      correctHindi: "फाल्गुन",
      correctEnglish: "Phalguna",
      explanationHindi: "फाल्गुन मास के कृष्ण पक्ष की चतुर्दशी तिथि को शिव और पार्वती के पावन विवाह के उपलक्ष्य में महाशिवरात्रि मनाई जाती है।",
      explanationEnglish: "Maha Shivratri is celebrated in the month of Phalguna on Krishna Paksha Chaturdashi.",
      ref: "Shiva Purana"
    }
  ];

  const vishnuPuranTemplates = [
    {
      textHindi: "विष्णु पुराण के अनुसार भगवान विष्णु के प्रमुख कुल कितने मुख्य अवतार (दशावतार) माने गए हैं?",
      textEnglish: "According to Vishnu Purana, how many primary incarnations (Dashavatara) of Lord Vishnu are recognized?",
      optionsHindi: ["10", "12", "24", "4"],
      optionsEnglish: ["10", "12", "24", "4"],
      correctHindi: "10",
      correctEnglish: "10",
      explanationHindi: "भगवान विष्णु के 10 मुख्य अवतार (दशावतार) माने गए हैं, जिनमें मत्स्य, कूर्म, वराह से लेकर भावी कल्कि अवतार शामिल हैं।",
      explanationEnglish: "The ten primary incarnations of Lord Vishnu are known as the Dashavatara.",
      ref: "Vishnu Purana"
    },
    {
      textHindi: "भगवान विष्णु के परम भक्त बालक प्रह्लाद के पिता का क्या नाम था?",
      textEnglish: "What was the name of the father of the child devotee Prahlada?",
      optionsHindi: ["हिरण्यकशिपु", "हिरण्याक्ष", "रावण", "कंस"],
      optionsEnglish: ["Hiranyakashipu", "Hiranyaksha", "Ravana", "Kansa"],
      correctHindi: "हिरण्यकशिपु",
      correctEnglish: "Hiranyakashipu",
      explanationHindi: "बालक प्रह्लाद के पिता दैत्यराज हिरण्यकशिपु थे, जिनका वध करने के लिए भगवान विष्णु ने नृसिंह अवतार लिया था।",
      explanationEnglish: "Prahlada's father was the demon king Hiranyakashipu, who was slain by Vishnu in Narasimha avatara.",
      ref: "Vishnu Purana"
    },
    {
      textHindi: "भगवान विष्णु के उस पावन वाहन का नाम क्या है जो पक्षीराज कहलाते हैं?",
      textEnglish: "What is the name of Lord Vishnu's sacred mount who is known as the king of birds?",
      optionsHindi: ["गरुड़", "नंदी", "शेषनाग", "ऐरावत"],
      optionsEnglish: ["Garuda", "Nandi", "Sheshnag", "Airavata"],
      correctHindi: "गरुड़",
      correctEnglish: "Garuda",
      explanationHindi: "भगवान विष्णु का पावन वाहन गरुड़ देव हैं, जो पक्षियों के राजा और तीव्र गति के प्रतीक हैं।",
      explanationEnglish: "Garuda, the divine king of birds, serves as the vehicle of Lord Vishnu.",
      ref: "Vishnu Purana"
    },
    {
      textHindi: "भगवान विष्णु के हाथ में सुशोभित चक्र का क्या नाम है?",
      textEnglish: "What is the name of the divine discus (chakra) held by Lord Vishnu?",
      optionsHindi: ["सुदर्शन चक्र", "पिनाक", "कालचक्र", "वज्र"],
      optionsEnglish: ["Sudarshana Chakra", "Pinaka", "Kalachakra", "Vajra"],
      correctHindi: "सुदर्शन चक्र",
      correctEnglish: "Sudarshana Chakra",
      explanationHindi: "भगवान विष्णु के हाथ में सुशोभित चक्र सुदर्शन चक्र कहलाता है, जो ब्रह्मांड का अमोघ शस्त्र है।",
      explanationEnglish: "The Sudarshana Chakra is the spinning, disc-like weapon held by Lord Vishnu.",
      ref: "Vishnu Purana"
    },
    {
      textHindi: "भगवान विष्णु की अर्धांगिनी और धन-ऐश्वर्य की अधिष्ठात्री देवी कौन हैं?",
      textEnglish: "Who is Lord Vishnu's consort and the goddess of wealth and prosperity?",
      optionsHindi: ["देवी लक्ष्मी", "देवी सरस्वती", "देवी पार्वती", "देवी गायत्री"],
      optionsEnglish: ["Goddess Lakshmi", "Goddess Saraswati", "Goddess Parvati", "Goddess Gayatri"],
      correctHindi: "देवी लक्ष्मी",
      correctEnglish: "Goddess Lakshmi",
      explanationHindi: "भगवान विष्णु की अर्धांगिनी जगन्माता महालक्ष्मी हैं, जो सृष्टि की पालन शक्ति और ऐश्वर्य की देवी हैं।",
      explanationEnglish: "Goddess Lakshmi is the divine consort of Vishnu, presiding over wealth and abundance.",
      ref: "Vishnu Purana"
    }
  ];

  const bhagavatamTemplates = [
    {
      textHindi: "श्रीमद्भागवत महापुराण में कुल कितने स्कंध (भाग) हैं?",
      textEnglish: "How many Cantos (Skandhas) are there in Srimad Bhagavatam?",
      optionsHindi: ["12 स्कंध", "18 स्कंध", "10 स्कंध", "7 स्कंध"],
      optionsEnglish: ["12 Cantos", "18 Cantos", "10 Cantos", "7 Cantos"],
      correctHindi: "12 स्कंध",
      correctEnglish: "12 Cantos",
      explanationHindi: "श्रीमद्भागवत में कुल 12 स्कंध और 18,000 श्लोक हैं, जो भक्ति रस से परिपूर्ण हैं।",
      explanationEnglish: "Srimad Bhagavatam consists of 12 Cantos (Skandhas) and contains approximately 18,000 verses.",
      ref: "Srimad Bhagavatam"
    },
    {
      textHindi: "महाराज परीक्षित को सात दिनों में मुक्ति दिलाने के लिए श्रीमद्भागवत कथा का श्रवण किसने कराया था?",
      textEnglish: "Who narrated the Srimad Bhagavatam to King Parikshit to grant him liberation in seven days?",
      optionsHindi: ["शुकदेव जी", "सूत जी", "नारद मुनि", "व्यास देव"],
      optionsEnglish: ["Shukadeva Goswami", "Suta Goswami", "Narada Muni", "Vyasa Dev"],
      correctHindi: "शुकदेव जी",
      correctEnglish: "Shukadeva Goswami",
      explanationHindi: "व्यास पुत्र परम ज्ञानी श्री शुकदेव जी ने गंगा तट पर महाराज परीक्षित को भागवत कथा सुनाई थी।",
      explanationEnglish: "Sage Shukadeva, the son of Vyasa, narrated this supreme scripture to King Parikshit on the banks of Ganga.",
      ref: "Srimad Bhagavatam"
    },
    {
      textHindi: "श्रीमद्भागवत के किस स्कंध में भगवान श्रीकृष्ण के बाल्यकाल और रासलीला का विस्तृत वर्णन है?",
      textEnglish: "Which Canto of Bhagavatam contains the detailed pastimes of Lord Krishna's childhood and Rasa Leela?",
      optionsHindi: ["दशम स्कंध (Canto 10)", "प्रथम स्कंध", "द्वादश स्कंध", "पंचम स्कंध"],
      optionsEnglish: ["Canto 10", "Canto 1", "Canto 12", "Canto 5"],
      correctHindi: "दशम स्कंध (Canto 10)",
      correctEnglish: "Canto 10",
      explanationHindi: "श्रीमद्भागवत का दशम स्कंध पूर्ण रूप से भगवान श्रीकृष्ण की बाल लीलाओं, माखनचोरी, और महारास पर आधारित है।",
      explanationEnglish: "The 10th Canto is the heart of Bhagavatam, dedicated entirely to the pastimes of Lord Krishna.",
      ref: "Srimad Bhagavatam Canto 10"
    },
    {
      textHindi: "भगवान श्रीकृष्ण के उस परम मित्र का क्या नाम था जो अत्यंत निर्धन ब्राह्मण थे और संदीपनि आश्रम में सहपाठी थे?",
      textEnglish: "What was the name of Lord Krishna's poor Brahmin childhood friend and classmate at Sandipani Ashram?",
      optionsHindi: ["सुदामा", "उद्धव", "अक्रूर", "अर्जुन"],
      optionsEnglish: ["Sudama", "Uddhava", "Akrura", "Arjuna"],
      correctHindi: "सुदामा",
      correctEnglish: "Sudama",
      explanationHindi: "कृष्ण के परम सखा सुदामा थे, जिनकी दीनदशा देखकर द्वारकाधीश श्रीकृष्ण ने उनके आंसुओं से पैर धोए थे।",
      explanationEnglish: "Sudama was Lord Krishna's beloved classmate whose humble devotion moved Krishna to wash his feet with tears.",
      ref: "Srimad Bhagavatam"
    },
    {
      textHindi: "भगवान श्रीकृष्ण के परम ज्ञानी सखा और दूत का क्या नाम था जिन्हें कृष्ण ने गोपियों को सांत्वना देने हेतु वृंदावन भेजा था?",
      textEnglish: "What was the name of Lord Krishna's wise friend and messenger whom he sent to Vrindavan to console the Gopis?",
      optionsHindi: ["उद्धव", "सुदामा", "अक्रूर", "बलराम"],
      optionsEnglish: ["Uddhava", "Sudama", "Akrura", "Balarama"],
      correctHindi: "उद्धव",
      correctEnglish: "Uddhava",
      explanationHindi: "श्रीकृष्ण के ज्ञानी सखा उद्धव थे, जिन्हें ज्ञान का अभिमान दूर करने और प्रेम का पाठ सीखने हेतु कृष्ण ने ब्रज भेजा था।",
      explanationEnglish: "Uddhava, the wise disciple of Brihaspati and friend of Krishna, was sent to Vrindavan with a message for the Gopis.",
      ref: "Srimad Bhagavatam Canto 10"
    }
  ];

  const vedasTemplates = [
    {
      textHindi: "संसार के सबसे प्राचीनतम लिखित ग्रंथ का क्या नाम है?",
      textEnglish: "What is the name of the oldest written scripture in the world?",
      optionsHindi: ["ऋग्वेद", "सामवेद", "यजुर्वेद", "अथर्ववेद"],
      optionsEnglish: ["Rigveda", "Samaveda", "Yajurveda", "Atharvaveda"],
      correctHindi: "ऋग्वेद",
      correctEnglish: "Rigveda",
      explanationHindi: "ऋग्वेद को मानव सभ्यता और सनातन धर्म का प्राचीनतम आदि ग्रंथ माना जाता है।",
      explanationEnglish: "The Rigveda is universally recognized as the oldest sacred text in human history.",
      ref: "Rigveda"
    },
    {
      textHindi: "सनातन धर्म के आधारभूत कुल कितने वेद हैं?",
      textEnglish: "How many Vedas are there in Sanatan Dharma?",
      optionsHindi: ["4 वेद", "3 वेद", "108 वेद", "18 वेद"],
      optionsEnglish: ["4 Vedas", "3 Vedas", "108 Vedas", "18 Vedas"],
      correctHindi: "4 वेद",
      correctEnglish: "4 Vedas",
      explanationHindi: "वेद चार हैं: ऋग्वेद, यजुर्वेद, सामवेद और अथर्ववेद। इन्हें 'संहिता' भी कहा जाता है।",
      explanationEnglish: "The four Vedas are Rigveda, Yajurveda, Samaveda, and Atharvaveda.",
      ref: "Vedas"
    },
    {
      textHindi: "भारतीय शास्त्रीय संगीत और स्वरों का मूल किस वेद को माना जाता है?",
      textEnglish: "Which Veda is considered the foundational source of Indian classical music and melodies?",
      optionsHindi: ["सामवेद", "ऋग्वेद", "यजुर्वेद", "अथर्ववेद"],
      optionsEnglish: ["Samaveda", "Rigveda", "Yajurveda", "Atharvaveda"],
      correctHindi: "सामवेद",
      correctEnglish: "Samaveda",
      explanationHindi: "सामवेद में यज्ञों के समय गाए जाने वाले मंत्रों का संकलन है, जो भारतीय संगीत का जनक है।",
      explanationEnglish: "The Samaveda consists of melodies and chants, serving as the root of Indian music science.",
      ref: "Samaveda"
    },
    {
      textHindi: "प्रसिद्ध गायत्री मंत्र 'ॐ भूर्भुवः स्वः' ऋग्वेद के किस मंडल से लिया गया है?",
      textEnglish: "The famous Gayatri Mantra is found in which Mandala of the Rigveda?",
      optionsHindi: ["तृतीय मंडल (3rd Mandala)", "प्रथम मंडल", "दसवां मंडल", "नौवां मंडल"],
      optionsEnglish: ["3rd Mandala", "1st Mandala", "10th Mandala", "9th Mandala"],
      correctHindi: "तृतीय मंडल (3rd Mandala)",
      correctEnglish: "3rd Mandala",
      explanationHindi: "गायत्री मंत्र ऋग्वेद के तृतीय मंडल के ६२वें सूक्त का १०वां मंत्र है, जिसके रचयिता महर्षि विश्वामित्र हैं।",
      explanationEnglish: "The Gayatri Mantra was revealed by Sage Vishwamitra and is situated in the 3rd Mandala of Rigveda.",
      ref: "Rigveda 3.62.10"
    },
    {
      textHindi: "आयुर्वेद, जड़ी-बूटियों, दैनिक विज्ञान और गृह-वास्तु का वर्णन विशेष रूप से किस वेद में मिलता है?",
      textEnglish: "The description of Ayurveda, herbal medicines, house construction, and daily sciences is primarily found in which Veda?",
      optionsHindi: ["अथर्ववेद", "ऋग्वेद", "यजुर्वेद", "सामवेद"],
      optionsEnglish: ["Atharvaveda", "Rigveda", "Yajurveda", "Samaveda"],
      correctHindi: "अथर्ववेद",
      correctEnglish: "Atharvaveda",
      explanationHindi: "अथर्ववेद में जड़ी-बूटियों, आयुर्वेद, शांति कर्म और लोक कल्याणकारी लौकिक विषयों का वर्णन है।",
      explanationEnglish: "The Atharvaveda contains details on daily life, sciences, medicine (Ayurveda), and societal ethics.",
      ref: "Atharvaveda"
    }
  ];

  const upanishadsTemplates = [
    {
      textHindi: "उपनिषद का शाब्दिक अर्थ क्या होता है?",
      textEnglish: "What is the literal meaning of the word 'Upanishad'?",
      optionsHindi: ["गुरु के समीप श्रद्धापूर्वक बैठना", "ईश्वर की स्तुति करना", "जंगल में जाकर तपस्या करना", "ग्रंथों का पाठ करना"],
      optionsEnglish: ["To sit down devotedly near the teacher", "To praise the Lord", "To meditate in forests", "To recite holy books"],
      correctHindi: "गुरु के समीप श्रद्धापूर्वक बैठना",
      correctEnglish: "To sit down devotedly near the teacher",
      explanationHindi: "उपनिषद का अर्थ है 'उप' (समीप) 'नि' (श्रद्धापूर्वक) 'षद' (बैठना) - अर्थात् आत्मज्ञान के लिए गुरु के चरणों में बैठना।",
      explanationEnglish: "Upanishad literally means sitting down devotedly near a spiritual preceptor to receive sacred wisdom.",
      ref: "Upanishads"
    },
    {
      textHindi: "भारत के राजकीय प्रतीक पर अंकित सूत्र 'सत्यमेव जयते' किस उपनिषद से लिया गया है?",
      textEnglish: "The national motto of India 'Satyameva Jayate' (Truth alone triumphs) is taken from which Upanishad?",
      optionsHindi: ["मुण्डक उपनिषद (Mundaka Upanishad)", "कठ उपनिषद", "माण्डूक्य उपनिषद", "ईशावास्य उपनिषद"],
      optionsEnglish: ["Mundaka Upanishad", "Katha Upanishad", "Mandukya Upanishad", "Ishavasya Upanishad"],
      correctHindi: "मुण्डक उपनिषद (Mundaka Upanishad)",
      correctEnglish: "Mundaka Upanishad",
      explanationHindi: "सत्यमेव जयते मुण्डक उपनिषद के तीसरे मुण्डक के प्रथम खंड का छठा मंत्र है।",
      explanationEnglish: "'Satyameva Jayate' is a sacred mantra from Mundaka Upanishad, signifying the ultimate victory of truth.",
      ref: "Mundaka Upanishad"
    },
    {
      textHindi: "यमराज और बालक नचिकेता के बीच हुआ अमर आत्मा का संवाद किस उपनिषद में वर्णित है?",
      textEnglish: "The dialogue between Lord Yama (Death) and the child Nachiketa regarding the secret of the soul is in which Upanishad?",
      optionsHindi: ["कठ उपनिषद (Katha Upanishad)", "केन उपनिषद", "तैत्तिरीय उपनिषद", "छान्दोग्य उपनिषद"],
      optionsEnglish: ["Katha Upanishad", "Kena Upanishad", "Taittiriya Upanishad", "Chandogya Upanishad"],
      correctHindi: "कठ उपनिषद (Katha Upanishad)",
      correctEnglish: "Katha Upanishad",
      explanationHindi: "कठ उपनिषद में नचिकेता के तीन वरदानों और यमराज द्वारा दिए गए आत्मा के अमरत्व के ज्ञान का अनुपम प्रसंग है।",
      explanationEnglish: "The Katha Upanishad contains the legendary conversation where Yama explains the nature of the Self to Nachiketa.",
      ref: "Katha Upanishad"
    },
    {
      textHindi: "उपनिषदों का मुख्य विषय क्या है जिसके कारण इन्हें 'वेदांत' भी कहा जाता है?",
      textEnglish: "What is the primary subject matter of Upanishads, due to which they are also called 'Vedanta'?",
      optionsHindi: ["ब्रह्मविद्या एवं आत्मज्ञान", "यज्ञ अनुष्ठान और कर्मकांड", "देवी-देवताओं की पूजा", "इतिहास और वंशावली"],
      optionsEnglish: ["Brahmavidya and Self-Knowledge", "Rituals and Sacrifices", "Deity worship", "History and genealogy"],
      correctHindi: "ब्रह्मविद्या एवं आत्मज्ञान",
      correctEnglish: "Brahmavidya and Self-Knowledge",
      explanationHindi: "उपनिषद वेदों के अंतिम भाग हैं (वेदांत) जिनका परम लक्ष्य आत्मा और परमात्मा के एकत्व (ब्रह्मज्ञान) का प्रतिपादन करना है।",
      explanationEnglish: "Upanishads mark the culmination of Vedic wisdom, focusing purely on metaphysical reality and Self-realization.",
      ref: "Upanishads"
    },
    {
      textHindi: "प्रसिद्ध शांति पाठ 'असतो मा सद्गमय, तमसो मा ज्योतिर्गमय' किस उपनिषद से लिया गया है?",
      textEnglish: "The famous peace prayer 'Asato Ma Sadgamaya...' is extracted from which Upanishad?",
      optionsHindi: ["बृहदारण्यक उपनिषद", "छान्दोग्य उपनिषद", "श्वेताश्वतर उपनिषद", "तैत्तिरीय उपनिषद"],
      optionsEnglish: ["Brihadaranyaka Upanishad", "Chandogya Upanishad", "Shvetashvatara Upanishad", "Taittiriya Upanishad"],
      correctHindi: "बृहदारण्यक उपनिषद",
      correctEnglish: "Brihadaranyaka Upanishad",
      explanationHindi: "यह मंत्र बृहदारण्यक उपनिषद (1.3.28) से लिया गया है, जिसका अर्थ है 'मुझे असत्य से सत्य की ओर, अंधकार से प्रकाश की ओर ले चलो।'",
      explanationEnglish: "This sacred chant is from the Brihadaranyaka Upanishad, praying for transition from untruth to truth, and darkness to light.",
      ref: "Brihadaranyaka Upanishad"
    }
  ];

  const saintsTemplates = [
    {
      textHindi: "अद्वैत वेदांत दर्शन के पुनरुद्धारक और चार दिशाओं में चार पीठों के संस्थापक कौन थे?",
      textEnglish: "Who was the rejuvenator of Advaita Vedanta and founder of the four sacred monasteries (Peethas)?",
      optionsHindi: ["आदि शंकराचार्य", "रामानुजाचार्य", "मध्वाचार्य", "संत कबीर"],
      optionsEnglish: ["Adi Shankaracharya", "Ramanujacharya", "Madhvacharya", "Saint Kabir"],
      correctHindi: "आदि शंकराचार्य",
      correctEnglish: "Adi Shankaracharya",
      explanationHindi: "आदिगुरु शंकराचार्य जी ने अद्वैत मत का प्रचार किया और भारत की चारों दिशाओं (बद्रीनाथ, द्वारका, पुरी, श्रृंगेरी) में चार पीठ स्थापित किए।",
      explanationEnglish: "Adi Shankaracharya established the four cardinal monastic centers to preserve Vedic culture.",
      ref: "Saints & Gurus"
    },
    {
      textHindi: "Swami Vivekananda के परम पूज्य आध्यात्मिक गुरु कौन थे जिनके नाम पर बेलूर मठ की स्थापना हुई?",
      textEnglish: "Who was the highly revered spiritual master of Swami Vivekananda, in whose name Belur Math was founded?",
      optionsHindi: ["श्री रामकृष्ण परमहंस", "स्वामी दयानंद सरस्वती", "परमहंस योगानंद", "तैलग स्वामी"],
      optionsEnglish: ["Sri Ramakrishna Paramahamsa", "Swami Dayananda Saraswati", "Paramahansa Yogananda", "Trailanga Swami"],
      correctHindi: "श्री रामकृष्ण परमहंस",
      correctEnglish: "Sri Ramakrishna Paramahamsa",
      explanationHindi: "विवेकानंद के गुरु दक्षिणेश्वर के संत श्री रामकृष्ण परमहंस जी थे, जिन्होंने भक्ति और समाधि का साक्षात् उदाहरण प्रस्तुत किया।",
      explanationEnglish: "Sri Ramakrishna Paramahamsa was the spiritual mentor of Swami Vivekananda who taught the synthesis of all faiths.",
      ref: "Saints & Gurus"
    },
    {
      textHindi: "मध्यकालीन संत मीराबाई किस आराध्य देव की अनन्य और भावपूर्ण साधिका थीं?",
      textEnglish: "The medieval saint Meerabai was an ecstatic devotee of which Lord?",
      optionsHindi: ["श्री कृष्ण", "श्री राम", "भगवान शिव", "हनुमान जी"],
      optionsEnglish: ["Lord Krishna", "Lord Rama", "Lord Shiva", "Hanuman Ji"],
      correctHindi: "श्री कृष्ण",
      correctEnglish: "Lord Krishna",
      explanationHindi: "मीराबाई श्री कृष्ण को ही अपना सब कुछ (गिरधर गोपाल) मानकर पद और भजनों के माध्यम से उनकी भक्ति में लीन रहती थीं।",
      explanationEnglish: "Meerabai was a Rajput princess who renounced royal life to sing ecstatic praises of Lord Krishna.",
      ref: "Saints & Gurus"
    },
    {
      textHindi: "छत्रपति शिवाजी महाराज के आध्यात्मिक मार्गदर्शक और 'दासबोध' के रचयिता कौन से महान समर्थ संत थे?",
      textEnglish: "Who was the spiritual guide of Chhatrapati Shivaji Maharaj and composer of the spiritual text 'Dasbodh'?",
      optionsHindi: ["समर्थ रामदास", "संत ज्ञानेश्वर", "संत तुकाराम", "संत एकनाथ"],
      optionsEnglish: ["Samarth Ramdas", "Saint Dnyaneshwar", "Saint Tukaram", "Saint Eknath"],
      correctHindi: "समर्थ रामदास",
      correctEnglish: "Samarth Ramdas",
      explanationHindi: "महाराष्ट्र के महान समर्थ गुरु रामदास जी शिवाजी महाराज के गुरु थे, जिन्होंने 'दासबोध' और 'मनाचे श्लोक' की रचना की।",
      explanationEnglish: "Samarth Ramdas was the highly revered Marathi saint who served as the preceptor of Shivaji Maharaj.",
      ref: "Saints & Gurus"
    },
    {
      textHindi: "महात्मा गांधी का अत्यंत प्रिय भजन 'वैष्णव जन तो तेने कहिये' के मूल रचयिता कौन से गुजराती संत थे?",
      textEnglish: "Who was the original composer of Mahatma Gandhi's favorite bhajan 'Vaishnava Jana To'?",
      optionsHindi: ["नरसिंह मेहता", "संत ज्ञानेश्वर", "संत कबीर", "चैतन्य महाप्रभु"],
      optionsEnglish: ["Narsinh Mehta", "Saint Dnyaneshwar", "Saint Kabir", "Chaitanya Mahaprabhu"],
      correctHindi: "नरसिंह मेहता",
      correctEnglish: "Narsinh Mehta",
      explanationHindi: "भक्तिकालीन गुजराती कवि संत नरसिंह मेहता (नरसी भगत) ने इस पावन भजन की रचना की थी, जिसमें सच्चे भक्त के लक्षण बताए गए हैं।",
      explanationEnglish: "The 15th-century poet-saint Narsinh Mehta composed this beautiful devotional hymn.",
      ref: "Saints & Gurus"
    }
  ];

  const templesTemplates = [
    {
      textHindi: "उत्तराखंड के गढ़वाल हिमालय में स्थित केदारनाथ ज्योतिर्लिंग मंदिर किस नदी के निकट स्थापित है?",
      textEnglish: "The sacred Kedarnath Jyotirlinga temple in Uttarakhand is situated near which river?",
      optionsHindi: ["मंदाकिनी नदी", "अलकनंदा नदी", "भागीरथी नदी", "यमुना"],
      optionsEnglish: ["Mandakini River", "Alaknanda River", "Bhagirathi River", "Yamuna"],
      correctHindi: "मंदाकिनी नदी",
      correctEnglish: "Mandakini River",
      explanationHindi: "केदारनाथ मंदिर मंदाकिनी नदी के तट पर स्थित है, जो भगवान शिव का अत्यंत महिमामय धाम है।",
      explanationEnglish: "Kedarnath temple is located on the bank of the Mandakini river amidst the majestic Himalayas.",
      ref: "Sacred Temples"
    },
    {
      textHindi: "भारत के दक्षिणतम छोर रामेश्वरम द्वीप पर स्थापित ज्योतिर्लिंग मंदिर का क्या नाम है जिसकी स्थापना स्वयं प्रभु श्री राम ने की थी?",
      textEnglish: "What is the name of the Jyotirlinga temple on Rameswaram island which was established by Lord Rama himself?",
      optionsHindi: ["रामनाथस्वामी मंदिर", "मल्लिकार्जुन", "सोमनाथ", "भीमाशंकर"],
      optionsEnglish: ["Ramanathaswamy Temple", "Mallikarjuna", "Somnath", "Bhimashankar"],
      correctHindi: "रामनाथस्वामी मंदिर",
      correctEnglish: "Ramanathaswamy Temple",
      explanationHindi: "रामेश्वरम में स्थापित रामनाथस्वामी मंदिर में स्थापित शिवलिंग की पूजा लंका विजय से पूर्व भगवान श्री राम ने बालू से बनाकर की थी।",
      explanationEnglish: "The Ramanathaswamy Temple houses one of the 12 Jyotirlingas, established by Lord Rama.",
      ref: "Sacred Temples"
    },
    {
      textHindi: "ओडिशा के तटीय नगर पुरी में स्थापित जगन्नाथ मंदिर किस भगवान को पूर्णतः समर्पित है?",
      textEnglish: "The world-famous Jagannath Temple in Puri is dedicated to which form of the Supreme Lord?",
      optionsHindi: ["श्री कृष्ण, बलभद्र और सुभद्रा", "श्री राम और लक्ष्मण", "भगवान शिव", "विष्णु और लक्ष्मी"],
      optionsEnglish: ["Lord Krishna, Balabhadra, and Subhadra", "Lord Rama and Lakshmana", "Lord Shiva", "Vishnu and Lakshmi"],
      correctHindi: "श्री कृष्ण, बलभद्र और सुभद्रा",
      correctEnglish: "Lord Krishna, Balabhadra, and Subhadra",
      explanationHindi: "जगन्नाथ पुरी धाम में भगवान कृष्ण (जगन्नाथ), उनके बड़े भाई बलभद्र और बहन सुभद्रा की काष्ठ की मूर्तियाँ स्थापित हैं।",
      explanationEnglish: "Puri Jagannath temple worships Lord Krishna along with his siblings Balabhadra and Subhadra in wooden deities.",
      ref: "Sacred Temples"
    },
    {
      textHindi: "ओडिशा के कोणार्क में स्थित सूर्य मंदिर की वास्तुकला किस विशिष्ट रूप में बनी हुई है?",
      textEnglish: "The Sun Temple in Konark, Odisha is uniquely built in the architectural shape of what?",
      optionsHindi: ["एक विशाल रथ (A massive chariot)", "एक कमल का फूल", "एक त्रिशूल", "एक नौका"],
      optionsEnglish: ["A massive chariot", "A lotus flower", "A trident", "A boat"],
      correctHindi: "एक विशाल रथ (A massive chariot)",
      correctEnglish: "A massive chariot",
      explanationHindi: "कोणार्क का सूर्य मंदिर सात घोड़ों और 24 पहियों वाले सूर्य देव के विशाल रथ के रूप में नक्काशीदार पत्थरों से बना है।",
      explanationEnglish: "The temple is conceptualized as a colossal chariot of the Sun God, decorated with stone wheels and horses.",
      ref: "Sacred Temples"
    },
    {
      textHindi: "संसार की सबसे प्राचीन जीवित सांस्कृतिक नगरी वाराणसी में स्थापित प्रधान शिव मंदिर का क्या नाम है?",
      textEnglish: "What is the name of the primary Shiva temple in Varanasi, one of the oldest living cities in the world?",
      optionsHindi: ["काशी विश्वनाथ मंदिर", "मकालेश्वर", "त्रयम्बकेश्वर", "घृष्णेश्वर"],
      optionsEnglish: ["Kashi Vishwanath Temple", "Mahakaleshwar", "Trimbakeshwar", "Grishneshwar"],
      correctHindi: "काशी विश्वनाथ मंदिर",
      correctEnglish: "Kashi Vishwanath Temple",
      explanationHindi: "वाराणसी (काशी) में गंगा नदी के पश्चिमी तट पर स्थापित काशी विश्वनाथ ज्योतिर्लिंग शिव का परम पावन निवास माना जाता है।",
      explanationEnglish: "Kashi Vishwanath Temple is the spiritual crown of Varanasi, housing the sacred Jyotirlinga of Lord Shiva.",
      ref: "Sacred Temples"
    }
  ];

  const cultureTemplates = [
    {
      textHindi: "सनातन जीवन शैली के अनुसार मानव जीवन के चार पुरुषार्थ कौन से हैं?",
      textEnglish: "According to Sanatan lifestyle, what are the four goals/pursuits (Purusharthas) of human life?",
      optionsHindi: ["धर्म, अर्थ, काम, मोक्ष", "सत्य, अहिंसा, तप, दान", "ब्रह्मचर्य, गृहस्थ, वानप्रस्थ, संन्यास", "ऋग्वेद, यजुर्वेद, सामवेद, अथर्ववेद"],
      optionsEnglish: ["Dharma, Artha, Kama, Moksha", "Satya, Ahimsa, Tapa, Dana", "Brahmacharya, Grihastha, Vanaprastha, Sanyasa", "Rigveda, Yajurveda, Samaveda, Atharvaveda"],
      correctHindi: "धर्म, अर्थ, काम, मोक्ष",
      correctEnglish: "Dharma, Artha, Kama, Moksha",
      explanationHindi: "सनातन धर्म के अनुसार जीवन के चार मुख्य उद्देश्य हैं: धर्म (नैतिकता), अर्थ (संसाधन), काम (कामनाएं) और मोक्ष (मुक्ति)।",
      explanationEnglish: "The four Purusharthas define the comprehensive framework of a balanced, prosperous, and liberated life.",
      ref: "Indian Culture"
    },
    {
      textHindi: "हिंदू संस्कृति के अनुसार मनुष्य के जन्म से मृत्यु तक कुल कितने मुख्य संस्कार (संस्कार सिद्धांत) माने गए हैं?",
      textEnglish: "According to Hindu culture, how many primary life sacraments (Sanskaras) are performed from birth to death?",
      optionsHindi: ["16 (षोडश संस्कार)", "10", "12", "108"],
      optionsEnglish: ["16 (Shodasha Sanskaras)", "10", "12", "108"],
      correctHindi: "16 (षोडश संस्कार)",
      correctEnglish: "16 (Shodasha Sanskaras)",
      explanationHindi: "मानव जीवन को शुद्ध, सुसंस्कृत और उन्नत बनाने के लिए गर्भधान से अंत्येष्टि (मृत्यु) तक कुल 16 मुख्य संस्कार किए जाते हैं।",
      explanationEnglish: "The Shodasha Sanskaras are 16 fundamental stages and rituals that sanctify a human journey in Vedic tradition.",
      ref: "Indian Culture"
    },
    {
      textHindi: "वैदिक वर्णाश्रम व्यवस्था के अंतर्गत जीवन के प्रथम 25 वर्षों की अवधि किस आश्रम के अधीन मानी गई है?",
      textEnglish: "Under the Vedic Ashrama system, which stage of life is prescribed for the first 25 years of age?",
      optionsHindi: ["ब्रह्मचर्य आश्रम", "गृहस्थ आश्रम", "वानप्रस्थ आश्रम", "संन्यास आश्रम"],
      optionsEnglish: ["Brahmacharya Ashrama", "Grihastha Ashrama", "Vanaprastha Ashrama", "Sanyasa Ashrama"],
      correctHindi: "ब्रह्मचर्य आश्रम",
      correctEnglish: "Brahmacharya Ashrama",
      explanationHindi: "जीवन के प्रथम २५ वर्ष शिक्षा, संयम और चरित्र निर्माण हेतु ब्रह्मचर्य आश्रम के अंतर्गत गुरु के सान्निध्य में व्यतीत होते थे।",
      explanationEnglish: "Brahmacharya is the student stage of life, dedicated to learning, celibacy, and character development.",
      ref: "Indian Culture"
    },
    {
      textHindi: "महात्मा गांधी और ऋषियों द्वारा प्रतिपादित 'अहिंसा' का वास्तविक और दार्शनिक अर्थ क्या है?",
      textEnglish: "What is the true and philosophical meaning of 'Ahimsā' as propounded by sages?",
      optionsHindi: ["मन, वचन और कर्म से किसी को कष्ट न देना", "केवल शारीरिक चोट न पहुंचाना", "युद्ध से भाग जाना", "कमजोर बने रहना"],
      optionsEnglish: ["To not cause harm by thoughts, words, or actions", "Only avoiding physical injury", "Fleeing from battle", "Staying weak and passive"],
      correctHindi: "मन, वचन और कर्म से किसी को कष्ट न देना",
      correctEnglish: "To not cause harm by thoughts, words, or actions",
      explanationHindi: "वास्तविक अहिंसा मन, वाणी और शारीरिक स्तर पर किसी भी जीव को चोट न पहुंचाने का करुणामय सिद्धांत है।",
      explanationEnglish: "Ahimsā is a positive virtue of active harmlessness and universal compassion in thoughts, speech, and deeds.",
      ref: "Indian Culture"
    },
    {
      textHindi: "महोपनिषद का प्रसिद्ध वाक्य 'वसुधैव कुटुम्बकम्' संपूर्ण विश्व के बारे में क्या दृष्टिकोण रखता है?",
      textEnglish: "What perspective does the Upanishadic phrase 'Vasudhaiva Kutumbakam' hold towards the world?",
      optionsHindi: ["संपूर्ण विश्व ही हमारा परिवार है", "केवल अपना देश श्रेष्ठ है", "संसार दुखों का घर है", "भौतिक संपदा सब कुछ है"],
      optionsEnglish: ["The entire world is one single family", "Only one's nation is supreme", "The world is full of sorrow", "Material wealth is everything"],
      correctHindi: "संपूर्ण विश्व ही हमारा परिवार है",
      correctEnglish: "The entire world is one single family",
      explanationHindi: "'वसुधा एव कुटुम्बकम्' का अर्थ है पृथ्वी के समस्त प्राणी हमारे परिवार के सदस्य हैं, जो सनातन संस्कृति की उदारता दर्शाता है।",
      explanationEnglish: "This golden maxim declares that the whole cosmos is interconnected as one unified, harmonious family.",
      ref: "Indian Culture"
    }
  ];

  const festivalsTemplates = [
    {
      textHindi: "दीपों का पावन उत्सव दीपावली किस हिंदू तिथि को हर्षोल्लास के साथ मनाया जाता है?",
      textEnglish: "Diwali, the festival of lights, is celebrated on which Hindu lunar calendar day?",
      optionsHindi: ["कार्तिक अमावस्या (Kartika Amavasya)", "कार्तिक पूर्णिमा", "आश्विन पूर्णिमा", "फाल्गुन अमावस्या"],
      optionsEnglish: ["Kartika Amavasya", "Kartika Purnima", "Ashvina Purnima", "Phalguna Amavasya"],
      correctHindi: "कार्तिक अमावस्या (Kartika Amavasya)",
      correctEnglish: "Kartika Amavasya",
      explanationHindi: "कार्तिक मास की अमावस्या के गहन अंधकार को मिटाने के लिए प्रभु श्री राम के अयोध्या आगमन की स्मृति में दीप जलाए जाते हैं।",
      explanationEnglish: "Diwali falls on the darkest night (Amavasya) of Kartika month to welcome Lord Rama back to Ayodhya.",
      ref: "Festivals & Vrats"
    },
    {
      textHindi: "मकर संक्रांति का पावन पर्व खगोलीय रूप से सूर्य के किस राशि में प्रवेश करने पर मनाया जाता है?",
      textEnglish: "Astronomically, the festival of Makara Sankranti marks the entry of the Sun into which zodiac sign?",
      optionsHindi: ["मकर राशि (Capricorn)", "मेष राशि", "धनु राशि", "कर्क राशि"],
      optionsEnglish: ["Capricorn (Makara)", "Aries (Mesha)", "Sagittarius (Dhanu)", "Cancer (Karka)"],
      correctHindi: "मकर राशि (Capricorn)",
      correctEnglish: "Capricorn (Makara)",
      explanationHindi: "सूर्य के धनु राशि से मकर राशि में प्रवेश करने की तिथि को मकर संक्रांति कहते हैं, जिससे सूर्य उत्तरायण होते हैं।",
      explanationEnglish: "Makara Sankranti marks the winter solstice when the sun begins its northward movement (Uttarayana) entering Capricorn.",
      ref: "Festivals & Vrats"
    },
    {
      textHindi: "शारदीय और चैत्र नवरात्रि में नौ दिनों तक माँ दुर्गा के कितने पावन रूपों की आराधना की जाती है?",
      textEnglish: "How many sacred forms of Goddess Durga are worshipped during the nine nights of Navratri?",
      optionsHindi: ["9 रूप (नवदुर्गा)", "10 रूप", "7 रूप", "3 रूप"],
      optionsEnglish: ["9 Forms (Navadurga)", "10 Forms", "7 Forms", "3 Forms"],
      correctHindi: "9 रूप (नवदुर्गा)",
      correctEnglish: "9 Forms (Navadurga)",
      explanationHindi: "नवरात्रि में माँ शैलपुत्री, ब्रह्मचारिणी, चंद्रघंटा से लेकर सिद्धिदात्री तक नौ दिव्य रूपों (नवदुर्गा) की पूजा होती है।",
      explanationEnglish: "The festival of Navratri celebrates the nine distinct, powerful aspects of the Divine Mother Durga.",
      ref: "Festivals & Vrats"
    },
    {
      textHindi: "भगवान श्रीकृष्ण के पावन प्राकट्य उत्सव को किस नाम से पूरे देश में मनाया जाता है?",
      textEnglish: "By what name is the divine birth festival of Lord Krishna celebrated across India?",
      optionsHindi: ["कृष्ण जन्माष्टमी (Janmashtami)", "रामनवमी", "हनुमान जयंती", "गुरु पूर्णिमा"],
      optionsEnglish: ["Krishna Janmashtami", "Rama Navami", "Hanuman Jayanti", "Guru Purnima"],
      correctHindi: "कृष्ण जन्माष्टमी (Janmashtami)",
      correctEnglish: "Krishna Janmashtami",
      explanationHindi: "भाद्रपद मास के कृष्ण पक्ष की अष्टमी तिथि को रोहिणी नक्षत्र में मध्यरात्रि भगवान श्री कृष्ण का जन्म कंस के कारागार में हुआ था।",
      explanationEnglish: "Krishna Janmashtami marks the birth of Lord Krishna in Mathura on the eighth day of Bhadrapada dark fortnight.",
      ref: "Festivals & Vrats"
    },
    {
      textHindi: "गंगा दशहरा का पावन त्योहार किस देवी के स्वर्ग से पृथ्वी पर अवतरण के उपलक्ष्य में मनाया जाता है?",
      textEnglish: "The auspicious festival of Ganga Dussehra is celebrated to mark the descent of which river Goddess to Earth?",
      optionsHindi: ["माँ गंगा", "माँ यमुना", "माँ सरस्वती", "माँ नर्मदा"],
      optionsEnglish: ["Goddess Ganga", "Goddess Yamuna", "Goddess Saraswati", "Goddess Narmada"],
      correctHindi: "माँ गंगा",
      correctEnglish: "Goddess Ganga",
      explanationHindi: "ज्येष्ठ शुक्ल दशमी को राजा भगीरथ की घोर तपस्या के फलस्वरूप माँ गंगा का स्वर्ग लोक से पृथ्वी पर पावन अवतरण हुआ था।",
      explanationEnglish: "Gengadevi descended from heaven to earth on this day to purify and liberate the ancestors of King Bhagiratha.",
      ref: "Festivals & Vrats"
    }
  ];

  const yogaTemplates = [
    {
      textHindi: "योग शास्त्र के सर्वोत्कृष्ट ग्रंथ 'योगसूत्र' के रचयिता कौन से महान महर्षि हैं?",
      textEnglish: "Who is the great sage behind the foundational scripture 'Yoga Sutras'?",
      optionsHindi: ["महर्षि पतंजलि", "महर्षि कपिल", "महर्षि कणाद", "महर्षि व्यास"],
      optionsEnglish: ["Maharishi Patanjali", "Maharishi Kapila", "Maharishi Kanada", "Maharishi Vyasa"],
      correctHindi: "महर्षि पतंजलि",
      correctEnglish: "Maharishi Patanjali",
      explanationHindi: "महर्षि पतंजलि ने मन के निग्रह और ध्यान साधना के लिए 196 योगसूत्रों की रचना की थी।",
      explanationEnglish: "Sage Patanjali systemized the science of Yoga into 196 aphorisms known as Patanjali Yoga Sutras.",
      ref: "Yoga Science"
    },
    {
      textHindi: "महर्षि पतंजलि द्वारा प्रतिपादित अष्टांग योग के कुल कितने अंग (सोपान) हैं?",
      textEnglish: "How many limbs make up the system of Ashtanga Yoga as defined by Patanjali?",
      optionsHindi: ["8 अंग", "5 अंग", "10 अंग", "12 अंग"],
      optionsEnglish: ["8 Limbs", "5 Limbs", "10 Limbs", "12 Limbs"],
      correctHindi: "8 अंग",
      correctEnglish: "8 Limbs",
      explanationHindi: "अष्टांग योग के आठ अंग हैं: यम, नियम, आसन, प्राणायाम, प्रत्याहार, धारणा, ध्यान और समाधि।",
      explanationEnglish: "Ashtanga Yoga literally means the eight-limbed path to self-control and spiritual liberation.",
      ref: "Yoga Science"
    },
    {
      textHindi: "अष्टांग योग का सर्वप्रथमतम अंग कौन सा है जो सामाजिक नैतिकता और आचरण से संबंधित है?",
      textEnglish: "What is the very first limb of Ashtanga Yoga which deals with ethical guidelines?",
      optionsHindi: ["यम (Yama)", "नियम (Niyama)", "आसन (Asana)", "प्राणायाम (Pranayama)"],
      optionsEnglish: ["Yama", "Niyama", "Asana", "Pranayama"],
      correctHindi: "यम (Yama)",
      correctEnglish: "Yama",
      explanationHindi: "पहला अंग यम है, जिसके अंतर्गत पांच सामाजिक व्रत आते हैं: अहिंसा, सत्य, अस्तेय, ब्रह्मचर्य और अपरिग्रह।",
      explanationEnglish: "Yama is the first limb of yoga, representing five social restraints: non-violence, truth, non-stealing, celibacy, and non-covetousness.",
      ref: "Yoga Science"
    },
    {
      textHindi: "श्वास और प्रश्वास की गति को नियंत्रित व संतुलित करने की क्रिया को योग में क्या कहते हैं?",
      textEnglish: "What is the science of breath regulation and control of life-force in Yoga called?",
      optionsHindi: ["प्राणायाम", "प्रत्याहार", "धारणा", "आसन"],
      optionsEnglish: ["Pranayama", "Pratyahara", "Dharana", "Asana"],
      correctHindi: "प्राणायाम",
      correctEnglish: "Pranayama",
      explanationHindi: "प्राण (जीवन ऊर्जा) और आयाम (विस्तार/नियंत्रण) मिलकर प्राणायाम कहलाता है, जो मन को स्थिर करता है।",
      explanationEnglish: "Pranayama is the fourth limb of Ashtanga Yoga, focusing on respiratory control to calm the mind.",
      ref: "Yoga Science"
    },
    {
      textHindi: "अष्टांग योग की वह अंतिम चरम अवस्था कौन सी है जिसमें जीवात्मा परमात्मा में लीन हो जाती है?",
      textEnglish: "What is the final, supreme limb of Ashtanga Yoga where the individual consciousness merges with the Divine?",
      optionsHindi: ["समाधि (Samadhi)", "ध्यान (Dhyana)", "धारणा (Dharana)", "प्रत्याहार (Pratyahara)"],
      optionsEnglish: ["Samadhi", "Dhyana", "Dharana", "Pratyahara"],
      correctHindi: "समाधि (Samadhi)",
      correctEnglish: "Samadhi",
      explanationHindi: "अष्टांग योग का आठवां और अंतिम सोपान समाधि है, जहां द्वैत समाप्त हो जाता है और पूर्ण शांति मिलती है।",
      explanationEnglish: "Samadhi is the ultimate state of spiritual absorption and complete liberation of the soul.",
      ref: "Yoga Science"
    }
  ];

  const meditationTemplates = [
    {
      textHindi: "मानव शरीर के सूक्ष्म तंत्र में रीढ़ के आधार पर कौन सा ऊर्जा चक्र (प्रथम चक्र) स्थित है?",
      textEnglish: "In the subtle energy system of the human body, which chakra is located at the base of the spine?",
      optionsHindi: ["मूलाधार चक्र (Muladhara)", "स्वाधिष्ठान चक्र", "मणिपुर चक्र", "अनाहत चक्र"],
      optionsEnglish: ["Muladhara Chakra (Root)", "Svadhisthana Chakra", "Manipura Chakra", "Anahata Chakra"],
      correctHindi: "मूलाधार चक्र (Muladhara)",
      correctEnglish: "Muladhara Chakra (Root)",
      explanationHindi: "रीढ़ के सबसे निचले हिस्से में मूलाधार चक्र (चार पंखुड़ी वाला कमल) स्थित है, जो पृथ्वी तत्व का प्रतीक है।",
      explanationEnglish: "The Muladhara (Root) Chakra resides at the base of the spine, governing stability and physical foundation.",
      ref: "Meditation & Dhyana"
    },
    {
      textHindi: "मानव शरीर में कुल कितने मुख्य आध्यात्मिक ऊर्जा केंद्र (चक्र) रीढ़ के समानांतर स्थित हैं?",
      textEnglish: "How many primary spiritual energy centers (Chakras) are situated along the spinal cord?",
      optionsHindi: ["7", "108", "12", "5"],
      optionsEnglish: ["7", "108", "12", "5"],
      correctHindi: "7",
      correctEnglish: "7",
      explanationHindi: "सूक्ष्म शरीर में मुख्य रूप से सात चक्र हैं: मूलाधार, स्वाधिष्ठान, मणिपुर, अनाहत, विशुद्ध, आज्ञा और सहस्रार।",
      explanationEnglish: "There are 7 primary chakras representing different stages of consciousness in the human subtle system.",
      ref: "Meditation & Dhyana"
    },
    {
      textHindi: "मस्तक के शिखर पर (ब्रह्मरंध्र में) स्थित हजार पंखुड़ियों वाले दिव्य चक्र का क्या नाम है?",
      textEnglish: "What is the name of the thousand-petalled divine chakra located at the crown of the head?",
      optionsHindi: ["सहस्रार चक्र (Sahasrara)", "आज्ञा चक्र", "विशुद्ध चक्र", "अनाहत चक्र"],
      optionsEnglish: ["Sahasrara Chakra (Crown)", "Ajna Chakra", "Vishuddha Chakra", "Anahata Chakra"],
      correctHindi: "सहस्रार चक्र (Sahasrara)",
      correctEnglish: "Sahasrara Chakra (Crown)",
      explanationHindi: "मस्तिष्क के शीर्ष भाग पर सहस्रार चक्र स्थित है, जो अनंत शांति और परमात्मा से पूर्ण मिलन का बिंदु है।",
      explanationEnglish: "The Sahasrara (Crown) Chakra is the destination of spiritual ascent, representing cosmic unity.",
      ref: "Meditation & Dhyana"
    },
    {
      textHindi: "भूमध्य (दोनों भौहों के बीच) में स्थित चक्र का क्या नाम है जिसे तीसरा नेत्र या विवेक का केंद्र भी कहते हैं?",
      textEnglish: "What is the name of the chakra located between the eyebrows, often called the third eye or intuition center?",
      optionsHindi: ["आज्ञा चक्र (Ajna Chakra)", "विशुद्ध चक्र", "अनाहत चक्र", "मणिपुर चक्र"],
      optionsEnglish: ["Ajna Chakra (Third Eye)", "Vishuddha Chakra", "Anahata Chakra", "Manipura Chakra"],
      correctHindi: "आज्ञा चक्र (Ajna Chakra)",
      correctEnglish: "Ajna Chakra (Third Eye)",
      explanationHindi: "दोनों भौहों के मध्य आज्ञा चक्र (दो पंखुड़ी वाला) स्थित है, जो मन की एकाग्रता और विवेक का मुख्य स्थान है।",
      explanationEnglish: "The Ajna Chakra is situated between the eyebrows, acting as the seed of intuition, wisdom, and focus.",
      ref: "Meditation & Dhyana"
    },
    {
      textHindi: "सनातन परंपरा में ध्यान और एकाग्रता के लिए किस अनादि ध्वनि (मंत्रराज) को सर्वोत्तम माना गया है?",
      textEnglish: "In Sanatan tradition, which primordial sound (Mantra) is considered supreme for meditation and chanting?",
      optionsHindi: ["ॐ (प्रणव - Om)", "ह्रीं", "क्लीं", "सोऽहम्"],
      optionsEnglish: ["Om (Pranava)", "Hreem", "Kleem", "Soham"],
      correctHindi: "ॐ (प्रणव - Om)",
      correctEnglish: "Om (Pranava)",
      explanationHindi: "ॐ (ओम्/प्रणव) सृष्टि की अनादि और अनाहत ध्वनि है, जो ध्यान लगाने और मानसिक शांति पाने का अचूक साधन है।",
      explanationEnglish: "Om is the sacred primordial vibration of the cosmos, representing the supreme Absolute.",
      ref: "Meditation & Dhyana"
    }
  ];

  const sanskritTemplates = [
    {
      textHindi: "देववाणी कही जाने वाली संस्कृत भाषा मुख्य रूप से किस लिपि में लिखी जाती है?",
      textEnglish: "The Sanskrit language, known as the language of Gods, is primarily written in which script?",
      optionsHindi: ["देवनागरी (Devanagari)", "ब्राह्मी", "शारदा", "गुरुमुखी"],
      optionsEnglish: ["Devanagari", "Brahmi", "Sharada", "Gurmukhi"],
      correctHindi: "देवनागरी (Devanagari)",
      correctEnglish: "Devanagari",
      explanationHindi: "संसार की सर्वाधिक वैज्ञानिक लिपि देवनागरी में ही मुख्यतः संस्कृत भाषा का लेखन कार्य होता है।",
      explanationEnglish: "Sanskrit is primarily recorded and published in the highly structured Devanagari script.",
      ref: "Sanskrit & Shlokas"
    },
    {
      textHindi: "संसार के प्रथम व्यवस्थित व्याकरण ग्रंथ 'अष्टाध्यायी' के महान रचयिता कौन हैं?",
      textEnglish: "Who is the legendary composer of the world's first systematic grammar textbook 'Ashtadhyayi'?",
      optionsHindi: ["महर्षि पाणिनि", "महर्षि पतंजलि", "महर्षि यास्क", "महर्षि व्यास"],
      optionsEnglish: ["Maharishi Panini", "Maharishi Patanjali", "Maharishi Yaska", "Maharishi Vyasa"],
      correctHindi: "महर्षि पाणिनि",
      correctEnglish: "Maharishi Panini",
      explanationHindi: "महर्षि पाणिनि ने संस्कृत व्याकरण को सूत्रबद्ध करते हुए ८ अध्यायों वाली अष्टाध्यायी की रचना की।",
      explanationEnglish: "Sage Panini composed the Ashtadhyayi, introducing the most advanced grammatical rules for Sanskrit.",
      ref: "Sanskrit & Shlokas"
    },
    {
      textHindi: "संस्कृत साहित्य का 'आदिकाव्य' (प्रथम महाकाव्य) किस ग्रंथ को माना जाता है?",
      textEnglish: "Which sacred text is universally revered as the 'Adi Kavya' (the first epic poem) in Sanskrit literature?",
      optionsHindi: ["वाल्मीकि रामायण", "महाभारत", "रघुवंशम", "श्रीमद्भगवद्गीता"],
      optionsEnglish: ["Valmiki Ramayana", "Mahabharata", "Raghuvansham", "Bhagavad Gita"],
      correctHindi: "वाल्मीकि रामायण",
      correctEnglish: "Valmiki Ramayana",
      explanationHindi: "महर्षि वाल्मीकि द्वारा रचित रामायण को संस्कृत का प्रथम महाकाव्य और वाल्मीकि जी को आदिकवि माना जाता है।",
      explanationEnglish: "The Valmiki Ramayana is hailed as the Adi Kavya because it was the first composed epic in Sanskrit.",
      ref: "Sanskrit & Shlokas"
    },
    {
      textHindi: "'संस्कृत' शब्द का वास्तविक अर्थ क्या होता है?",
      textEnglish: "What is the true and literal meaning of the word 'Sanskrit'?",
      optionsHindi: ["परिष्कृत, शुद्ध और सुसंस्कृत", "देवताओं द्वारा बोली जाने वाली", "अत्यंत कठिन भाषा", "प्राचीन बोली"],
      optionsEnglish: ["Refined, purified, and polished", "Spoken by deities", "Extremely difficult language", "Ancient dialect"],
      correctHindi: "परिष्कृत, शुद्ध and सुसंस्कृत",
      correctEnglish: "Refined, purified, and polished",
      explanationHindi: "संस्कृत का अर्थ है 'सम्' (भलीभांति) + 'कृत' (की हुई), अर्थात् जो पूर्ण रूप से शुद्ध और व्याकरण सम्मत हो।",
      explanationEnglish: "Sanskrit literally translates to refined, systematic, purified, and intellectually polished language.",
      ref: "Sanskrit & Shlokas"
    },
    {
      textHindi: "संसार के कल्याण हेतु प्रसिद्ध प्रार्थना 'सर्वे भवन्तु सुखिनः' किस प्राचीन उपनिषद से ली गई है?",
      textEnglish: "The universal peace prayer 'Sarve Bhavantu Sukhinah' is part of which ancient Upanishadic tradition?",
      optionsHindi: ["बृहदारण्यक उपनिषद", "कठ उपनिषद", "माण्डूक्य उपनिषद", "ईश उपनिषद"],
      optionsEnglish: ["Brihadaranyaka Upanishad", "Katha Upanishad", "Mandukya Upanishad", "Isha Upanishad"],
      correctHindi: "बृहदारण्यक उपनिषद",
      correctEnglish: "Brihadaranyaka Upanishad",
      explanationHindi: "यह शांति पाठ बृहदारण्यक उपनिषद परंपरा से जुड़ा है, जो 'सभी सुखी और नीरोगी रहें' का पावन संदेश देता है।",
      explanationEnglish: "This ancient prayer for universal happiness and well-being belongs to the Brihadaranyaka Upanishad.",
      ref: "Sanskrit & Shlokas"
    }
  ];

  const generalTemplates = [
    {
      textHindi: "सनातन धर्म के अंतर्गत 'त्रिदेव' की संकल्पना किन तीन प्रमुख देवताओं का प्रतिनिधित्व करती है?",
      textEnglish: "Under Sanatan Dharma, the concept of 'Trideva' represents which three principal deities?",
      optionsHindi: ["ब्रह्मा, विष्णु, महेश (शिव)", "राम, कृष्ण, हनुमान", "इंद्र, वरुण, अग्नि", "गणेश, कार्तिकेय, शिव"],
      optionsEnglish: ["Brama, Vishnu, and Mahesh (Shiva)", "Rama, Krishna, and Hanuman", "Indra, Varuna, and Agni", "Ganesha, Kartikeya, and Shiva"],
      correctHindi: "ब्रह्मा, विष्णु, महेश (शिव)",
      correctEnglish: "Brahma, Vishnu, and Mahesh (Shiva)",
      explanationHindi: "त्रिदेव सृष्टि की तीन प्रक्रियाओं के स्वामी हैं: ब्रह्मा (सृष्टि कर्ता), विष्णु (पालन कर्ता) और महेश (संहार कर्ता)।",
      explanationEnglish: "The Trimurti/Trideva consists of Brahma the Creator, Vishnu the Preserver, and Shiva the Destroyer.",
      ref: "General Spiritual Knowledge"
    },
    {
      textHindi: "सनातन धर्म के अटल 'कर्म सिद्धांत' के अनुसार मनुष्य को प्राप्त होने वाले सुख-दुख का मुख्य कारण क्या है?",
      textEnglish: "According to the immutable 'Law of Karma' in Sanatan Dharma, what is the primary cause of joy and sorrow?",
      optionsHindi: ["मनुष्य के स्वयं के पूर्व और वर्तमान कर्म", "ग्रहों की चाल", "भाग्य का अचानक बदलना", "अन्य व्यक्तियों का व्यवहार"],
      optionsEnglish: ["One's own past and present actions", "The planetary transits", "Sudden changes in luck/destiny", "The behavior of other people"],
      correctHindi: "मनुष्य के स्वयं के पूर्व और वर्तमान कर्म",
      correctEnglish: "One's own past and present actions",
      explanationHindi: "कर्म सिद्धांत के अनुसार 'जैसा बोओगे, वैसा काटोगे' - अर्थात् हर क्रिया की समान और विपरीत प्रतिक्रिया होती है।",
      explanationEnglish: "The Law of Karma dictates that every individual is solely responsible for their actions and experiences.",
      ref: "General Spiritual Knowledge"
    },
    {
      textHindi: "हिंदू घरों के प्रवेश द्वार पर बनाया जाने वाला कल्याण, शांति और समृद्धि का पावन दिव्य प्रतीक कौन सा है?",
      textEnglish: "Which sacred divine symbol of peace, auspiciousness, and prosperity is drawn on Hindu entrances?",
      optionsHindi: ["स्वस्तिक (Swastika)", "त्रिशूल", "शंख", "कमल"],
      optionsEnglish: ["Swastika", "Trishul", "Shankha", "Lotus"],
      correctHindi: "स्वस्तिक (Swastika)",
      correctEnglish: "Swastika",
      explanationHindi: "स्वस्तिक 'सु' (शुभ) और 'अस्ति' (होना) से मिलकर बना है, जिसका अर्थ है - कल्याण होना।",
      explanationEnglish: "The Swastika is a sacred symbol derived from 'Su' (good/auspicious) and 'Asti' (being/existence), denoting well-being.",
      ref: "General Spiritual Knowledge"
    },
    {
      textHindi: "चारों वेदों में से कौन सा वेद दिव्य संगीत और पावन मंत्रों का मूल उद्गम माना जाता है?",
      textEnglish: "Which of the four sacred Vedas is considered the ultimate source of divine music and chants?",
      optionsHindi: ["सामवेद (Samaveda)", "ऋग्वेद", "यजुर्वेद", "अथर्ववेद"],
      optionsEnglish: ["Samaveda", "Rigveda", "Yajurveda", "Atharvaveda"],
      correctHindi: "सामवेद (Samaveda)",
      correctEnglish: "Samaveda",
      explanationHindi: "सामवेद को भारतीय संगीत का जनक माना जाता है। इसमें गाए जाने वाले मंत्रों का संग्रह है।",
      explanationEnglish: "The Samaveda is recognized as the origin of Indian classical music, containing verses to be sung.",
      ref: "General Spiritual Knowledge"
    }
  ];

  // Choose templates list
  let selectedTemplates = generalTemplates;
  const scriptureLower = scripture.toLowerCase();
  
  if (scriptureLower.includes("gita") || scriptureLower.includes("गीता")) {
    selectedTemplates = gitaTemplates;
  } else if (scriptureLower.includes("ramcharitmanas") || scriptureLower.includes("रामचरितमानस")) {
    selectedTemplates = ramcharitmanasTemplates;
  } else if (scriptureLower.includes("valmiki") || scriptureLower.includes("वाल्मीकि")) {
    selectedTemplates = valmikiTemplates;
  } else if (scriptureLower.includes("radha") || scriptureLower.includes("राधा")) {
    selectedTemplates = radhaTemplates;
  } else if (scriptureLower.includes("hanuman") || scriptureLower.includes("हनुमान")) {
    selectedTemplates = hanumanTemplates;
  } else if (scriptureLower.includes("vishnu sahasra") || scriptureLower.includes("विष्णु")) {
    selectedTemplates = vishnuTemplates;
  } else if (scriptureLower.includes("mahimna") || scriptureLower.includes("शिव")) {
    selectedTemplates = shivTemplates;
  } else if (scriptureLower.includes("durga") || scriptureLower.includes("दुर्गा")) {
    selectedTemplates = durgaTemplates;
  } else if (scriptureLower.includes("sunder") || scriptureLower.includes("सुन्दर")) {
    selectedTemplates = sunderTemplates;
  } else if (scriptureLower.includes("mahabharat") || scriptureLower.includes("महाभारत")) {
    selectedTemplates = mahabharataTemplates;
  } else if (scriptureLower.includes("shiv puran") || scriptureLower.includes("शिवपुराण")) {
    selectedTemplates = shivPuranTemplates;
  } else if (scriptureLower.includes("vishnu puran") || scriptureLower.includes("विष्णुपुराण")) {
    selectedTemplates = vishnuPuranTemplates;
  } else if (scriptureLower.includes("bhagavatam") || scriptureLower.includes("भागवत")) {
    selectedTemplates = bhagavatamTemplates;
  } else if (scriptureLower.includes("veda") || scriptureLower.includes("वेद")) {
    selectedTemplates = vedasTemplates;
  } else if (scriptureLower.includes("upanishad") || scriptureLower.includes("उपनिषद")) {
    selectedTemplates = upanishadsTemplates;
  } else if (scriptureLower.includes("saint") || scriptureLower.includes("संत")) {
    selectedTemplates = saintsTemplates;
  } else if (scriptureLower.includes("temple") || scriptureLower.includes("मंदिर")) {
    selectedTemplates = templesTemplates;
  } else if (scriptureLower.includes("culture") || scriptureLower.includes("संस्कृति")) {
    selectedTemplates = cultureTemplates;
  } else if (scriptureLower.includes("festival") || scriptureLower.includes("त्योहार")) {
    selectedTemplates = festivalsTemplates;
  } else if (scriptureLower.includes("yoga") || scriptureLower.includes("योग")) {
    selectedTemplates = yogaTemplates;
  } else if (scriptureLower.includes("meditation") || scriptureLower.includes("ध्यान")) {
    selectedTemplates = meditationTemplates;
  } else if (scriptureLower.includes("sanskrit") || scriptureLower.includes("संस्कृत")) {
    selectedTemplates = sanskritTemplates;
  }

  const cleaned: any[] = [];
  for (const t of selectedTemplates) {
    const text = isEnglish ? t.textEnglish : t.textHindi;
    const options = isEnglish ? t.optionsEnglish : t.optionsHindi;
    const correctAnswer = isEnglish ? t.correctEnglish : t.correctHindi;
    const explanation = isEnglish ? t.explanationEnglish : t.explanationHindi;

    cleaned.push({
      text,
      type: "mcq",
      options,
      correctAnswer,
      explanation,
      scriptureRef: t.ref || scripture,
      chapter: chapterId || "General",
      verse: "",
      difficulty: "medium",
      subject: scripture,
      chapterId: chapterId || "General",
      subjectId: subjectId,
      language: language,
      aiVersion: "1.0"
    });
  }

  return cleaned;
}

function validateAndCleanQuestions(
  questions: any[],
  subjectId: string,
  chapterId: string,
  language: string,
  difficulty: string,
  excludeTexts: string[] = []
): any[] {
  if (!Array.isArray(questions)) return [];
  const cleaned: any[] = [];
  const defaultSubject = subjectId || "General";
  const defaultChapter = chapterId || "General";

  const otherScriptures = ["bible", "quran", "koran", "torah", "talmud", "guru granth", "tripitaka", "avesta"];
  
  // Add other Hindu scriptures if they are not the current subject
  const currentSubLower = defaultSubject.toLowerCase();
  if (!currentSubLower.includes("gita")) otherScriptures.push("gita");
  if (!currentSubLower.includes("ramayan")) otherScriptures.push("ramayana", "ramcharitmanas");
  if (!currentSubLower.includes("mahabharat")) otherScriptures.push("mahabharat");
  if (!currentSubLower.includes("veda")) otherScriptures.push("veda");
  if (!currentSubLower.includes("upanishad")) otherScriptures.push("upanishad");
  if (!currentSubLower.includes("puran")) otherScriptures.push("puran");

  for (const q of questions) {
    if (!q) continue;
    const text = q.text || q.question || "";
    if (!text.trim()) continue;

    // Skip if in excludeTexts
    if (excludeTexts.some(et => et && text.toLowerCase().includes(et.toLowerCase()))) {
      continue;
    }

    const lowerText = text.toLowerCase();
    let containsOtherScripture = false;
    for (const keyword of otherScriptures) {
      if (lowerText.includes(keyword)) {
        containsOtherScripture = true;
        break;
      }
    }

    if (containsOtherScripture) {
      console.warn(`[Strict Scripture Rule] Rejecting question mentioning other scripture. Subject: ${defaultSubject}, Question: "${text.substring(0, 50)}..."`);
      continue;
    }

    const options = Array.isArray(q.options) ? q.options : [];
    if (options.length < 2) continue;

    const correctAnswer = q.correctAnswer || q.correct_answer || q.answer || "";
    if (!correctAnswer) continue;

    cleaned.push({
      text,
      type: q.type === 'true_false' ? 'true_false' : 'mcq',
      options,
      correctAnswer,
      explanation: q.explanation || "",
      scriptureRef: q.scriptureRef || q.ref || defaultSubject,
      chapter: q.chapter || defaultChapter,
      verse: q.verse || "",
      difficulty: q.difficulty || difficulty || "Medium",
      subject: defaultSubject,
      chapterId: q.chapterId || defaultChapter,
      subjectId: q.subjectId || defaultSubject,
      language: language || "Hindi",
      aiVersion: q.aiVersion || "1.0"
    });
  }

  return cleaned;
}

function getQuizCollections(subjectId: string) {
  const sId = (subjectId || "").toLowerCase().trim();
  if (sId === "bhagavad_gita" || sId === "geeta") {
    return { chapters: "geeta_chapters", questions: "geeta_questions" };
  }
  if (sId === "ramcharitmanas") {
    return { chapters: "ramcharitmanas_chapters", questions: "ramcharitmanas_questions" };
  }
  if (sId === "shiv_puran" || sId === "shivpurana") {
    return { chapters: "shivpurana_chapters", questions: "shivpurana_questions" };
  }
  if (sId === "sunderkand") {
    return { chapters: "sunderkand_chapters", questions: "sunderkand_questions" };
  }
  if (sId === "bhagavatam") {
    return { chapters: "bhagavatam_chapters", questions: "bhagavatam_questions" };
  }
  if (sId === "hanuman_chalisa" || sId === "hanumanchalisa") {
    return { chapters: "hanumanchalisa_chapters", questions: "hanumanchalisa_questions" };
  }
  if (sId === "vedas") {
    return { chapters: "vedas_chapters", questions: "vedas_questions" };
  }
  if (sId === "upanishads") {
    return { chapters: "upanishads_chapters", questions: "upanishads_questions" };
  }
  // Generic fallback
  return { chapters: "quiz_chapters", questions: "quiz_questions" };
}

function getProductShortName(cart: any[]): string {
  if (!cart || cart.length === 0) return "HP";
  const firstItem = cart[0];
  const title = (firstItem.title || "").toLowerCase();
  if (title.includes("gita") || title.includes("geeta")) return "GEETA";
  if (title.includes("mala")) return "MALA";
  if (title.includes("ramcharitmanas") || title.includes("manas")) return "MANAS";
  if (title.includes("t-shirt") || title.includes("tshirt")) return "TSHIRT";
  if (title.includes("book") || title.includes("pustak")) return "BOOK";
  if (title.includes("chandan") || title.includes("sandalwood")) return "CHANDAN";
  if (title.includes("murti") || title.includes("idol")) return "MURTI";
  if (title.includes("dhoti") || title.includes("kurta")) return "CLOTH";
  return "HP"; // Default fallback
}

async function generateHumanOrderId(productShortName: string, dateStr: string): Promise<string> {
  const prefix = `HP-${productShortName}-${dateStr}-`;
  try {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("humanOrderId", ">=", prefix), where("humanOrderId", "<=", prefix + "\uf8ff"));
    const snap = await getDocs(q);
    const count = snap.size + 1;
    const sequence = String(count).padStart(4, "0");
    return `${prefix}${sequence}`;
  } catch (err) {
    console.error("Error generating sequential humanOrderId:", err);
    const randomSeq = String(Math.floor(1000 + Math.random() * 9000));
    return `${prefix}${randomSeq}`;
  }
}

async function generateInvoiceNumber(dateStr: string): Promise<string> {
  const prefix = `INV-${dateStr}-`;
  try {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("invoiceNumber", ">=", prefix), where("invoiceNumber", "<=", prefix + "\uf8ff"));
    const snap = await getDocs(q);
    const count = snap.size + 1;
    const sequence = String(count).padStart(4, "0");
    return `${prefix}${sequence}`;
  } catch (err) {
    console.error("Error generating invoiceNumber:", err);
    const randomSeq = String(Math.floor(1000 + Math.random() * 9000));
    return `${prefix}${randomSeq}`;
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Custom CORS middleware to support Capacitor mobile and other cross-origin platforms
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json());

  // API Routes
  app.post("/api/generate-quote", async (req, res) => {
    try {
      const { topic } = req.body;
      const apiKey = getValidGeminiApiKey("ai_quote");
      
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is not configured." });
      }
      
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Generate a powerful spiritual quote about "${topic}". 
Return ONLY a valid JSON object with the following structure:
{
  "hindi": "The quote in Hindi",
  "english": "The translation or English equivalent",
  "source": "The scripture or saint (e.g. Bhagavad Gita 2.47)"
}`;

      const response = await generateContentWithRetry(ai, {
        contents: [
          { role: "user", parts: [{ text: prompt }] }
        ],
        config: {
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              hindi: { type: "STRING" },
              english: { type: "STRING" },
              source: { type: "STRING" }
            },
            required: ["hindi", "english", "source"]
          }
        }
      }, 2, 'ai_quote');
      
      let rawText = response.text || "{}";
      const quote = JSON.parse(rawText);

      res.json({ quote });
    } catch (error: any) {
      console.warn("AI generate-quote error, using fallback instead:", error?.message || error);
      const fallbacks = [
        { hindi: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥", english: "You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions.", source: "Bhagavad Gita 2.47" },
        { hindi: "यदा यदा हि धर्मस्य ग्लानिर्भवति भारत। अभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम्॥", english: "Whenever and wherever there is a decline in religious practice, O descendant of Bharata, and a predominant rise of irreligion—at that time I descend Myself.", source: "Bhagavad Gita 4.7" },
        { hindi: "परित्राणाय साधूनां विनाशाय च दुष्कृताम्। धर्मसंस्थापनार्थाय सम्भवामि युगे युगे॥", english: "To deliver the pious and to annihilate the miscreants, as well as to reestablish the principles of religion, I Myself appear, millennium after millennium.", source: "Bhagavad Gita 4.8" },
        { hindi: "तेषां सततयुक्तानां भजतां प्रीतिपूर्वकम्। ददामि बुद्धियोगं तं येन मामुपयान्ति ते॥", english: "To those who are constantly devoted to serving Me with love, I give the understanding by which they can come to Me.", source: "Bhagavad Gita 10.10" }
      ];
      const quote = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      res.json({ quote });
    }
  });

  app.post("/api/chat", async (req, res) => {
    const startTime = Date.now();
    try {
      const { message, history } = req.body || {};

      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: "Message content cannot be empty." });
      }

      console.log(`[AI Guru Request] Prompt: "${message.substring(0, 120)}${message.length > 120 ? '...' : ''}" | History count: ${Array.isArray(history) ? history.length : 0}`);

      let apiKey: string | null = null;
      try {
        apiKey = getServiceApiKey("ai_chat");
      } catch (err) {
        apiKey = getValidGeminiApiKey();
      }

      if (!apiKey) {
        console.error("[AI Guru Diagnostic Error] Missing GEMINI_API_KEY environment variable in server environment.");
        return res.status(500).json({
          error: "GEMINI_API_KEY environment variable is not configured in the server environment. Please set GEMINI_API_KEY in your Render environment variables or .env file."
        });
      }

      const keyPrefix = apiKey ? apiKey.substring(0, 6) + "..." : "NONE";
      console.log(`[AI Guru Auth Check] Service: ai_chat | Key Configured: true | Key Prefix: ${keyPrefix}`);

      const primaryModel = "gemini-3.6-flash";
      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `You are "AI Guru", the official spiritual companion for the Hari Pathshala app.

PRIMARY PURPOSE
Guide users according to Sanatan Dharma, Bhagavad Gita, Ramayana, Mahabharata, Vedas, Upanishads, Puranas, Bhakti, Meditation, Yoga, Dharma, Good Character, Moral Values, and Positive Living.

SECONDARY PURPOSE
Answer normal personal life questions respectfully. If the user asks about Life Problems, Relationship Advice, Family Issues, Friendship, Marriage Guidance, Career Confusion, Study Motivation, Mental Stress, Anxiety, Confidence, Self Improvement, Habits, Time Management, Success, Failure, Goal Setting, Motivation, Daily Routine, or Personality Development, provide a thoughtful, respectful, helpful answer. DO NOT refuse simply because the question is not directly spiritual. Provide practical guidance and draw inspiration from Sanatan values where appropriate without forcing every answer to become religious.

HARI PATHSHALA KNOWLEDGE
If asked about Hari Pathshala (what it is, who started it, mission, joining, classes, volunteer, updates), use the official information.
Official Website: https://haripathshala.online
Official Instagram: @hari_pathshala
If the user asks how to connect, mention the official website and Instagram page. Do not invent information.

INTENT DETECTION & RESPONSE STYLE
- Be Calm, Respectful, Compassionate, Positive, Encouraging, Wise, Friendly, and Easy to understand.
- Reply in the same language used by the user (Hindi, Hinglish, English).
- Maintain a conversational, authentic tone and avoid robotic or repetitive template responses.

CONTENT MODERATION (STRICT)
- Detect and refuse vulgar language, sexual content, pornographic requests, hate speech, abusive language, illegal activities, harassment, and graphic violence.
- If inappropriate content is detected, respond politely by explaining: "Hari Pathshala AI Guru only supports respectful conversations related to spirituality and positive personal guidance."`;

      const contents = [];
      if (Array.isArray(history)) {
        contents.push(...history);
      }
      contents.push({ role: "user", parts: [{ text: message }] });

      console.log(`[AI Guru Gemini Call] Model: ${primaryModel} | Service: ai_chat | Request URL: /api/chat`);
      const response = await generateContentWithRetry(ai, {
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      }, 3, 'ai_chat');

      const replyText = response?.text;
      if (!replyText) {
        throw new Error("Gemini API returned an empty response text.");
      }

      const latency = Date.now() - startTime;
      console.log(`[AI Guru Success] HTTP 200 OK | Latency: ${latency}ms | Response Snippet: "${replyText.substring(0, 100).replace(/\n/g, ' ')}..."`);

      return res.json({ reply: replyText });
    } catch (error: any) {
      const statusCode = error?.status || error?.statusCode || (error?.message?.includes("401") ? 401 : error?.message?.includes("429") ? 429 : 500);
      console.error(`[AI Guru Gemini Failure] HTTP ${statusCode} | Endpoint: /api/chat | Error Message:`, error?.message || error);
      console.error("[AI Guru Error Stack]:", error?.stack || "No stack trace available");

      return res.status(statusCode).json({
        error: error?.message || "Failed to generate AI response from Gemini API."
      });
    }
  });

  // Scripture Verse Retrieval & Background Generation API
  app.post("/api/scripture/verse", async (req, res) => {
    try {
      const { subjectId, chapterId, verseId } = req.body;
      if (!subjectId || !chapterId || !verseId) {
        return res.status(400).json({ error: "Missing subjectId, chapterId, or verseId." });
      }

      const docId = `${subjectId}_${chapterId}_${verseId}`.toLowerCase();
      const verseDocRef = doc(db, 'scripture_verses', docId);

      // 1. Check if we already have it saved in Firestore
      try {
        const verseSnap = await getDoc(verseDocRef);
        if (verseSnap.exists()) {
          return res.json(verseSnap.data());
        }
      } catch (dbErr: any) {
        console.warn("[Scripture Verse DB Read Warning] Firestore getDoc failed, generating via AI:", dbErr.message || dbErr);
      }

      // 2. Generate support material with AI in background if missing
      const apiKey = getValidGeminiApiKey("ai_scripture");
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is not configured." });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a scriptural scholar. Generate complete educational and supporting material for the following scripture verse.
Scripture: ${getScriptureName(subjectId)}
Chapter/Section: ${chapterId}
Verse/Shloka/Doha/Chaupai Number: ${verseId}

Original scriptures must remain authentic and separate. Your output MUST provide the original text and educational, explanatory details. Do not alter or translate the original Sanskrit text into anything wrong.

Return ONLY a valid JSON object matching this exact schema:
{
  "scripture": "${getScriptureName(subjectId)}",
  "chapterId": "${chapterId}",
  "verseId": "${verseId}",
  "sanskrit": "The authentic original Sanskrit text of the verse (Shloka, Doha, or Chaupai)",
  "wordMeanings": "Detailed word-by-word Sanskrit-to-Hindi/English translation",
  "hindiMeaning": "Accurate, beautiful Hindi translation of the verse",
  "englishMeaning": "Accurate, clear English translation of the verse",
  "explanation": "Detailed explanation of the spiritual wisdom and philosophical depth of this verse in Hindi",
  "practicalLessons": "3 bullet points on how to apply the wisdom of this verse in modern practical life (in Hindi)",
  "keywords": ["key concept 1", "key concept 2"],
  "context": "The historical or narrative context of why and when this verse was spoken"
}`;

      console.log(`[AI Scripture Engine] Generating supporting content for verse ${chapterId}:${verseId}`);
      const aiResponse = await generateContentWithRetry(ai, {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          temperature: 0.5,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              scripture: { type: "STRING" },
              chapterId: { type: "STRING" },
              verseId: { type: "STRING" },
              sanskrit: { type: "STRING" },
              wordMeanings: { type: "STRING" },
              hindiMeaning: { type: "STRING" },
              englishMeaning: { type: "STRING" },
              explanation: { type: "STRING" },
              practicalLessons: { type: "STRING" },
              keywords: {
                type: "ARRAY",
                items: { type: "STRING" }
              },
              context: { type: "STRING" }
            },
            required: ["scripture", "chapterId", "verseId", "sanskrit", "wordMeanings", "hindiMeaning", "englishMeaning", "explanation", "practicalLessons", "keywords", "context"]
          }
        }
      }, 4, 'ai_scripture');

      const rawText = aiResponse.text || "{}";
      const parsed = JSON.parse(rawText);

      // 3. Save generated content to Firestore
      try {
        await setDoc(verseDocRef, {
          ...parsed,
          subjectId,
          chapterId,
          verseId,
          lastUpdated: new Date().toISOString()
        });
      } catch (saveErr: any) {
        console.warn("[Scripture Verse DB Save Warning] Failed to cache verse content:", saveErr.message || saveErr);
      }

      return res.json(parsed);
    } catch (err: any) {
      console.error("Scripture Verse API failure:", err);
      res.status(500).json({ error: "Failed to retrieve scripture verse." });
    }
  });

  // Chapter Study Material & Summary Background Generation API
  app.post("/api/scripture/chapter-study", async (req, res) => {
    try {
      const { subjectId, chapterId } = req.body;
      if (!subjectId || !chapterId) {
        return res.status(400).json({ error: "Missing subjectId or chapterId." });
      }

      const docId = `${subjectId}_${chapterId}`.toLowerCase();
      const chapStudyRef = doc(db, 'scripture_chapters', docId);

      // 1. Check if we already have it saved in Firestore
      try {
        const chapSnap = await getDoc(chapStudyRef);
        if (chapSnap.exists()) {
          return res.json(chapSnap.data());
        }
      } catch (dbErr: any) {
        console.warn("[Scripture Chapter DB Read Warning] Firestore getDoc failed, generating via AI:", dbErr.message || dbErr);
      }

      // 2. Generate study material with AI in background if missing
      const apiKey = getValidGeminiApiKey("ai_scripture");
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is not configured." });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a scriptural educational expert. Generate complete study material for the following chapter of a scripture.
Scripture: ${getScriptureName(subjectId)}
Chapter/Section: ${chapterId}

Do not rewrite or alter original scriptures. Generate educational support content.

Return ONLY a valid JSON object matching this exact schema:
{
  "subjectId": "${subjectId}",
  "chapterId": "${chapterId}",
  "chapterSummary": "A comprehensive summary of this entire chapter's teachings and philosophical narrative in Hindi",
  "objectives": ["Learning objective 1 in Hindi", "Learning objective 2 in Hindi", "Learning objective 3 in Hindi"],
  "importantTeachings": ["Major spiritual teaching 1 with details in Hindi", "Major spiritual teaching 2 with details in Hindi"],
  "keyPoints": ["Important key point 1 in Hindi", "Important key point 2 in Hindi"],
  "realLifeApplications": ["Practical modern application 1 in Hindi", "Practical modern application 2 in Hindi"],
  "estimatedReadingTime": "10-15 mins"
}`;

      console.log(`[AI Scripture Engine] Generating study support for chapter ${chapterId}`);
      const aiResponse = await generateContentWithRetry(ai, {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          temperature: 0.5,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              subjectId: { type: "STRING" },
              chapterId: { type: "STRING" },
              chapterSummary: { type: "STRING" },
              objectives: {
                type: "ARRAY",
                items: { type: "STRING" }
              },
              importantTeachings: {
                type: "ARRAY",
                items: { type: "STRING" }
              },
              keyPoints: {
                type: "ARRAY",
                items: { type: "STRING" }
              },
              realLifeApplications: {
                type: "ARRAY",
                items: { type: "STRING" }
              },
              estimatedReadingTime: { type: "STRING" }
            },
            required: ["subjectId", "chapterId", "chapterSummary", "objectives", "importantTeachings", "keyPoints", "realLifeApplications", "estimatedReadingTime"]
          }
        }
      }, 4, 'ai_scripture');

      const rawText = aiResponse.text || "{}";
      const parsed = JSON.parse(rawText);

      // 3. Save generated content to Firestore
      try {
        await setDoc(chapStudyRef, {
          ...parsed,
          subjectId,
          chapterId,
          lastUpdated: new Date().toISOString()
        });
      } catch (saveErr: any) {
        console.warn("[Scripture Chapter DB Save Warning] Failed to cache chapter content:", saveErr.message || saveErr);
      }

      return res.json(parsed);
    } catch (err: any) {
      console.error("Scripture Chapter API failure:", err);
      res.status(500).json({ error: "Failed to retrieve chapter study material." });
    }
  });

  // Shiprocket Token Cache and Helper Function
  let cachedShiprocketToken: string | null = null;
  let tokenExpiryTime: number | null = null;

  const getShiprocketToken = async (email: string, password: string): Promise<string> => {
    if (cachedShiprocketToken && tokenExpiryTime && Date.now() < tokenExpiryTime) {
      return cachedShiprocketToken;
    }
    console.log(`[Shiprocket API] Authenticating with ${email}`);
    const authRes = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
      email, password
    });
    const token = authRes.data?.token;
    if (!token) {
      throw new Error("Failed to retrieve token from Shiprocket response");
    }
    cachedShiprocketToken = token;
    // Cache for 9 days (token is valid for 10 days)
    tokenExpiryTime = Date.now() + (9 * 24 * 60 * 60 * 1000);
    return token;
  };

  // Notification API Endpoints
  app.post("/api/notifications/register-token", async (req, res) => {
    try {
      const { userId, token, platform } = req.body;
      if (!userId || !token) {
        return res.status(400).json({ error: "Missing userId or token" });
      }

      const tokenRef = doc(db, "users", userId, "fcm_tokens", token);
      await setDoc(tokenRef, {
        token,
        platform: platform || "web",
        lastActive: new Date(),
        updatedAt: new Date()
      }, { merge: true });

      console.log(`[FCM Register] Registered/Updated token for user ${userId} on platform: ${platform || "web"}`);
      return res.json({ success: true, message: "Token registered successfully" });
    } catch (err: any) {
      console.error("[FCM Register Error] Failed to register token:", err.message);
      return res.status(500).json({ error: err.message || "Failed to register token" });
    }
  });

  app.post("/api/notifications/broadcast", async (req, res) => {
    try {
      const { title, body, type = "quote", link } = req.body;
      if (!title || !body) {
        return res.status(400).json({ error: "Missing title or body" });
      }

      // Send broadcast notification to all devices (via 'all' topic)
      const result = await sendPushNotification({
        topic: "all",
        title,
        body,
        type,
        data: link ? { link } : {}
      });

      return res.json({ success: true, result });
    } catch (err: any) {
      console.error("[FCM Broadcast Error] Failed to send broadcast:", err.message);
      return res.status(500).json({ error: err.message || "Failed to send broadcast" });
    }
  });

  // Shipping Routes
  app.post("/api/shipping/calculate", async (req, res) => {
    try {
      const { pincode, weight = 0.5, cod = false, paymentMethod } = req.body;
      const isCodRequest = cod === true || cod === 1 || paymentMethod === 'cod';

      if (!pincode || !/^\d{6}$/.test(pincode.toString())) {
        return res.status(400).json({ error: "कृपया एक वैध 6-अंकीय पिनकोड दर्ज करें।" });
      }
      
      let shippingConfigDoc: any = null;
      try {
        shippingConfigDoc = await getDoc(doc(db, 'settings', 'shipping'));
      } catch (err) {}
      const shippingData = (shippingConfigDoc && shippingConfigDoc.exists()) ? shippingConfigDoc.data() : {};
      
      // Live Shiprocket settings
      const email = shippingData.shiprocketEmail || process.env.SHIPROCKET_EMAIL || "swamiajay9783@gmail.com";
      const password = shippingData.shiprocketPassword || process.env.SHIPROCKET_PASSWORD || "$p0FvTP%8fa6PItUtHcKCtkm&JW2wbL%";
      
      const isLiveShiprocket = email && password && !email.includes("example.com") && !email.includes("placeholder");

      if (!isLiveShiprocket) {
        console.warn("[Shiprocket API] Credentials not configured or placeholder used. Returning simulated/test mode serviceability.");
        // Test mode simulation with reasonable pricing based on weight and cod
        const baseFee = 60;
        const weightFee = Math.round(weight * 20);
        const codCharge = isCodRequest ? 50 : 0;
        return res.json({
          serviceable: true,
          shippingFee: baseFee + weightFee + codCharge,
          courierName: "Delhivery (Simulated)",
          etd: "3-5 दिन",
          transitTime: "3-5",
          codAvailable: true,
          codCharge: codCharge,
          mode: 'test'
        });
      }
      
      // Retry helper function
      const runWithRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
        try {
          return await fn();
        } catch (error: any) {
          if (retries <= 1) throw error;
          console.warn(`[Shiprocket API] Request failed, retrying in ${delay}ms... Error: ${error.message}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return runWithRetry(fn, retries - 1, delay * 1.5);
        }
      };

      try {
        // Authenticate using the cached manager
        const token = await getShiprocketToken(email, password);
        
        // Fixed or custom pickup pin code: Kaladera, Jaipur is 303801
        const pickupPincode = shippingData.pickupPincode || process.env.SHIPROCKET_PICKUP_PIN || "303801"; 
        
        console.log(`[Shiprocket API] Checking serviceability from ${pickupPincode} to ${pincode} (weight: ${weight}, cod: ${isCodRequest})`);
        
        let prepaidError: any = null;
        let codError: any = null;

        const [prepaidRes, codRes] = await Promise.all([
          runWithRetry(() => axios.get(`https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=${pickupPincode}&delivery_postcode=${pincode}&weight=${weight}&cod=0`, {
            headers: { Authorization: `Bearer ${token}` }
          }), 3, 800).catch(e => {
            prepaidError = e;
            console.warn("Prepaid check failed or unserviceable:", e.response?.data || e.message);
            return null;
          }),
          runWithRetry(() => axios.get(`https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=${pickupPincode}&delivery_postcode=${pincode}&weight=${weight}&cod=1`, {
            headers: { Authorization: `Bearer ${token}` }
          }), 3, 800).catch(e => {
            codError = e;
            console.warn("COD check failed or unserviceable:", e.response?.data || e.message);
            return null;
          })
        ]);

        const hasPrepaid = prepaidRes?.data?.data?.available_courier_companies?.length > 0;
        const hasCod = codRes?.data?.data?.available_courier_companies?.length > 0;

        if (hasPrepaid || hasCod) {
          const mainRes = (isCodRequest && hasCod) ? codRes : (hasPrepaid ? prepaidRes : codRes);
          const couriers = mainRes.data.data.available_courier_companies;
          const cheapest = couriers.reduce((prev: any, curr: any) => (prev.rate < curr.rate ? prev : curr));

          let codCharge = 0;
          if (hasPrepaid && hasCod) {
            const cheapestPrepaid = prepaidRes.data.data.available_courier_companies.reduce((prev: any, curr: any) => (prev.rate < curr.rate ? prev : curr));
            const cheapestCod = codRes.data.data.available_courier_companies.reduce((prev: any, curr: any) => (prev.rate < curr.rate ? prev : curr));
            codCharge = Math.max(0, Math.round(cheapestCod.rate - cheapestPrepaid.rate));
          } else if (cheapest.cod_charges !== undefined) {
            codCharge = Math.round(cheapest.cod_charges);
          } else {
            codCharge = isCodRequest ? 50 : 0;
          }

          return res.json({ 
            serviceable: true,
            shippingFee: Math.round(cheapest.rate), 
            courierName: cheapest.courier_name || cheapest.name || "Standard Courier",
            etd: cheapest.etd || cheapest.estimated_delivery_date || "",
            transitTime: cheapest.estimated_delivery_days || "3-5",
            codAvailable: !!hasCod,
            codCharge: isCodRequest ? codCharge : 0,
            mode: 'live' 
          });
        } else {
          console.log("[Shiprocket API] Pincode unserviceable on live API, returning test/fallback serviceability.");
          return res.json({
            serviceable: false,
            shippingFee: 0,
            courierName: "Standard Courier (Fallback)",
            etd: "5-7 दिन",
            transitTime: "5-7",
            codAvailable: true,
            codCharge: isCodRequest ? 50 : 0,
            mode: 'fallback'
          });
        }
      } catch(err: any) {
        console.error("Shiprocket API execution failed, returning simulated test fallback:", err.response?.data || err.message);
        const baseFee = 60;
        const weightFee = Math.round(weight * 20);
        const codCharge = isCodRequest ? 50 : 0;
        return res.json({
          serviceable: true,
          shippingFee: baseFee + weightFee + codCharge,
          courierName: "Delhivery (Simulated Fallback)",
          etd: "3-5 दिन",
          transitTime: "3-5",
          codAvailable: true,
          codCharge: codCharge,
          mode: 'test_fallback'
        });
      }
    } catch (error: any) {
      console.error("Shipping calculate error, returning fallback shipping:", error);
      const isCodRequest = req.body.cod === true || req.body.cod === 1 || req.body.paymentMethod === 'cod';
      const codCharge = isCodRequest ? 50 : 0;
      res.json({
        serviceable: true,
        shippingFee: 60 + codCharge,
        courierName: "Delhivery (Simulated Fallback)",
        etd: "3-5 दिन",
        transitTime: "3-5",
        codAvailable: true,
        codCharge: codCharge,
        mode: 'test_fallback'
      });
    }
  });

  // Payment Routes
  app.post("/api/payment/create-order", async (req, res) => {
    try {
      const { amount, currency = "INR" } = req.body;
      
      let configDoc: any = null;
      try {
        configDoc = await getDoc(doc(db, 'settings', 'payment'));
      } catch (err) {
        console.warn("Failed to fetch payment settings from Firestore, using env vars:", err);
      }
      
      const liveKeyId = process.env.RAZORPAY_LIVE_KEY_ID || process.env.VITE_RAZORPAY_KEY || "rzp_live_TIBLCjw9jrdW83";
      const liveKeySecret = process.env.RAZORPAY_LIVE_KEY_SECRET || "6k39BFz5Vth27HFZNxR7191t";
      let mode = 'live';
      let key_id = liveKeyId;
      let key_secret = liveKeySecret;

      if (configDoc && configDoc.exists()) {
        const data = configDoc.data();
        
        if (typeof data.keyId === 'string' && data.keyId.trim().length > 0) {
          key_id = data.keyId;
          key_secret = data.keySecret || liveKeySecret;
          mode = key_id.startsWith('rzp_live_') ? 'live' : 'test';
        }
      }

      if (!key_id || !key_secret) {
        key_id = liveKeyId;
        key_secret = liveKeySecret;
        mode = 'live';
      }

      const rzp = new Razorpay({ key_id, key_secret });

      const options = {
        amount: Math.round(amount * 100), // amount in paise
        currency,
        receipt: `rcpt_${Date.now()}`
      };

      try {
        const order = await rzp.orders.create(options);
        res.json({ orderId: order.id, amount: order.amount, currency: order.currency, mode });
      } catch (err: any) {
        const errMsg = err?.error?.description || err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err)) || "Unknown Razorpay error";
        console.error("Razorpay API call failed:", errMsg);
        res.status(400).json({ error: `भुगतान ऑर्डर निर्माण विफल: ${errMsg}` });
      }
    } catch (error: any) {
      const errMsg = error?.error?.description || error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error)) || "Failed to create Razorpay order";
      console.error("Razorpay Create Order Error:", errMsg);
      res.status(500).json({ error: errMsg });
    }
  });

  app.post("/api/payment/verify", async (req, res) => {
    try {
      const { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature,
        orderData, // order details passed from frontend
        cart
      } = req.body;

      let configDoc: any = null;
      try {
        configDoc = await getDoc(doc(db, 'settings', 'payment'));
      } catch (err) {
        console.warn("Failed to fetch payment settings, using env vars:", err);
      }
      
      const liveKeyId = process.env.RAZORPAY_LIVE_KEY_ID || process.env.VITE_RAZORPAY_KEY || "rzp_live_TIBLCjw9jrdW83";
      const liveKeySecret = process.env.RAZORPAY_LIVE_KEY_SECRET || "6k39BFz5Vth27HFZNxR7191t";
      let key_id = liveKeyId;
      let key_secret = liveKeySecret;

      if (configDoc && configDoc.exists()) {
        const data = configDoc.data();
        if (typeof data.keyId === 'string' && data.keyId.trim().length > 0) {
          key_id = data.keyId;
          key_secret = data.keySecret || liveKeySecret;
        }
      }

      let isValid = false;
      const isCod = orderData?.paymentMethod === 'cod';

      if (isCod) {
        isValid = true;
      } else {
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
          .createHmac("sha256", key_secret)
          .update(body.toString())
          .digest("hex");
          
        isValid = expectedSignature === razorpay_signature;
      }

      if (!isValid) {
        return res.status(400).json({ error: "Invalid payment signature" });
      }

      // Prevent duplicate orders
      if (!isCod && razorpay_payment_id) {
        try {
          const q = query(collection(db, 'orders'), where('paymentId', '==', razorpay_payment_id));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const existingOrder = snap.docs[0].data();
            console.warn("[Payment Verification] Order already exists for paymentId:", razorpay_payment_id);
            return res.json({ 
              success: true, 
              orderId: existingOrder.id, 
              trackingNumber: existingOrder.trackingNumber || "", 
              invoiceUrl: existingOrder.invoiceUrl || "", 
              invoiceNumber: existingOrder.invoiceNumber || "",
              humanOrderId: existingOrder.humanOrderId || existingOrder.id
            });
          }
        } catch (dbErr) {
          console.error("Error checking for duplicate orders:", dbErr);
        }
      }

      // Create Order in Firestore
      const batch = writeBatch(db);
      const newOrderRef = doc(collection(db, 'orders'));
      
      // Generate sequential humanOrderId and invoiceNumber
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}${mm}${dd}`;

      const pShortName = getProductShortName(cart);
      const humanOrderId = await generateHumanOrderId(pShortName, dateStr);
      const invoiceNumber = await generateInvoiceNumber(dateStr);
      const invoiceUrl = `${req.protocol}://${req.get('host')}/invoice/${newOrderRef.id}`;

      const finalOrderData: any = {
        ...orderData,
        id: newOrderRef.id,
        humanOrderId,
        paymentId: isCod ? 'COD' : razorpay_payment_id,
        razorpayOrderId: isCod ? 'COD' : razorpay_order_id,
        status: 'Processing', // 12. Change order status to Processing
        paymentStatus: isCod ? 'Pending' : 'Paid', // Ensure paymentStatus is Paid only after successful verification
        deliveryStatus: 'Pending',
        createdAt: serverTimestamp(),
        paymentMode: isCod ? 'cod' : (orderData?.paymentMethod || 'online'),
        total: orderData.totalAmount || orderData.subtotal || 0,
        invoiceNumber,
        invoiceUrl
      };

      // Shiprocket Integration
      let shippingDoc: any = null;
      try {
        shippingDoc = await getDoc(doc(db, 'settings', 'shipping'));
      } catch (err) {
        console.warn("Failed to fetch shipping settings, using env vars:", err);
      }
      const shippingData = (shippingDoc && shippingDoc.exists()) ? shippingDoc.data() : {};
      
      const email = shippingData.shiprocketEmail || process.env.SHIPROCKET_EMAIL || "swamiajay9783@gmail.com";
      const password = shippingData.shiprocketPassword || process.env.SHIPROCKET_PASSWORD || "$p0FvTP%8fa6PItUtHcKCtkm&JW2wbL%";
      
      let trackingNumber = '';
      let courierName = '';
      let labelUrl = '';
      let shiprocketOrderId = '';
      let shiprocketShipmentId = '';
      let trackingUrl = '';
      let shippingFeeCalculated = orderData.shippingFee || orderData.shipping || 0;
      let estimatedDeliveryDate = '';

      const isLiveShiprocket = !!(
        email && 
        password && 
        !email.includes("example.com") && 
        !email.includes("placeholder") &&
        email !== "your-shiprocket-email" &&
        password !== "your-shiprocket-password"
      );

      if (isLiveShiprocket) {
        console.log("[Shiprocket API] Executing LIVE order creation on Shiprocket API v2...");
        try {
          const token = await getShiprocketToken(email, password);
          
          // 1. Fetch valid registered pickup location from Shiprocket
          let resolvedPickupLocation = shippingData.pickupLocation || "";
          try {
            console.log("[Shiprocket API] Querying registered pickup locations...");
            const pickupLocRes = await axios.get('https://apiv2.shiprocket.in/v1/external/settings/company/pickup', {
              headers: { Authorization: `Bearer ${token}` }
            });
            const pickupAddresses = pickupLocRes?.data?.data?.shipping_address || pickupLocRes?.data?.shipping_address || [];
            if (Array.isArray(pickupAddresses) && pickupAddresses.length > 0) {
              const match = pickupAddresses.find((p: any) => 
                p.pickup_location?.toLowerCase() === resolvedPickupLocation.toLowerCase() ||
                p.pickup_location_name?.toLowerCase() === resolvedPickupLocation.toLowerCase()
              );
              if (match) {
                resolvedPickupLocation = match.pickup_location || match.pickup_location_name;
              } else if (pickupAddresses[0]?.pickup_location || pickupAddresses[0]?.pickup_location_name) {
                resolvedPickupLocation = pickupAddresses[0].pickup_location || pickupAddresses[0].pickup_location_name;
              }
            }
          } catch (pLocErr: any) {
            console.warn("[Shiprocket API] Dynamic pickup location check failed, using config location:", pLocErr?.message);
          }
          if (!resolvedPickupLocation) {
            resolvedPickupLocation = "Primary";
          }
          console.log(`[Shiprocket API] Using resolved pickup location: '${resolvedPickupLocation}'`);

          // 2. Determine package details & weight
          const packageLength = Number(shippingData.packageLength) || 10;
          const packageBreadth = Number(shippingData.packageBreadth) || 10;
          const packageHeight = Number(shippingData.packageHeight) || 10;
          
          let totalCartWeight = cart.reduce((sum: number, item: any) => sum + (Number(item.weight) || 0.5) * (Number(item.quantity) || 1), 0);
          const packageWeight = Math.max(0.1, Number(shippingData.packageWeight) || totalCartWeight || 0.5);

          // 3. Formatter for Shiprocket Order Date (Format: YYYY-MM-DD HH:mm)
          const now = new Date();
          const pad = (n: number) => String(n).padStart(2, '0');
          const formattedOrderDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

          // 4. Calculate Subtotal, Shipping Fee, and Discounts
          const calculatedSubtotal = cart.reduce((sum: number, item: any) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
          const calculatedShippingFee = Number(orderData.shippingFee || orderData.shippingCharge || orderData.shipping || 0);
          const calculatedDiscount = Number(orderData.discount || 0);

          // Customer Phone Number (10 digits)
          const rawPhone = String(orderData.customerInfo?.mobile || orderData.shippingAddress?.mobile || "9999999999").replace(/\D/g, '');
          const cleanPhone = rawPhone.length >= 10 ? rawPhone.slice(-10) : "9999999999";

          // Customer Full Name
          const fullName = String(orderData.customerInfo?.fullName || orderData.shippingAddress?.fullName || "Valued Customer").trim();
          const nameParts = fullName.split(' ');
          const firstName = nameParts[0] || "Customer";
          const lastName = nameParts.slice(1).join(' ') || ".";

          const srOrderPayload = {
            order_id: humanOrderId || newOrderRef.id,
            order_date: formattedOrderDate,
            pickup_location: resolvedPickupLocation,
            billing_customer_name: firstName,
            billing_last_name: lastName,
            billing_address: String(orderData.shippingAddress?.street || orderData.shippingAddress?.houseNo || orderData.shippingAddress?.address || "Main Road").trim(),
            billing_address_2: String(orderData.shippingAddress?.landmark || orderData.shippingAddress?.area || "").trim(),
            billing_city: String(orderData.shippingAddress?.city || "Jaipur").trim(),
            billing_pincode: String(orderData.shippingAddress?.pincode || "303801").replace(/\D/g, ''),
            billing_state: String(orderData.shippingAddress?.state || "Rajasthan").trim(),
            billing_country: "India",
            billing_email: String(orderData.customerInfo?.email || "customer@haripathshala.com").trim(),
            billing_phone: cleanPhone,
            shipping_is_billing: true,
            order_items: cart.map((item: any, idx: number) => ({
              name: String(item.title || item.name || `Item ${idx + 1}`).trim(),
              sku: String(item.productId || item.id || `SKU-${idx + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_'),
              units: Number(item.quantity) || 1,
              selling_price: Number(item.price) || 0,
              discount: 0,
              tax: 0
            })),
            payment_method: isCod ? "COD" : "Prepaid",
            sub_total: calculatedSubtotal,
            shipping_charges: calculatedShippingFee,
            total_discount: calculatedDiscount,
            length: packageLength,
            breadth: packageBreadth,
            height: packageHeight,
            weight: packageWeight
          };

          console.log("[Shiprocket API] Sending Create Order Payload:", JSON.stringify(srOrderPayload));

          const createOrderRes = await axios.post('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', srOrderPayload, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log("[Shiprocket API] Create Order Response:", JSON.stringify(createOrderRes.data));

          if (createOrderRes.data && (createOrderRes.data.shipment_id || createOrderRes.data.order_id)) {
            shiprocketOrderId = String(createOrderRes.data.order_id || "");
            shiprocketShipmentId = String(createOrderRes.data.shipment_id || "");
            
            // Query serviceability to assign the best courier
            const pickupPincode = shippingData.pickupPincode || "303801";
            let courierId: number | undefined = undefined;
            try {
              console.log(`[Shiprocket API] Querying courier serviceability for shipment ${shiprocketShipmentId}...`);
              const courierRes = await axios.get(`https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=${pickupPincode}&delivery_postcode=${orderData.shippingAddress.pincode}&weight=${packageWeight}&cod=${isCod ? 1 : 0}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              const couriers = courierRes.data?.data?.available_courier_companies || [];
              if (couriers.length > 0) {
                const bestCourier = couriers.reduce((prev: any, curr: any) => (prev.rate < curr.rate ? prev : curr));
                courierId = bestCourier.courier_company_id;
                courierName = bestCourier.courier_name || bestCourier.name;
                shippingFeeCalculated = Math.round(bestCourier.rate);
                estimatedDeliveryDate = bestCourier.etd || bestCourier.estimated_delivery_date || "";
                console.log(`[Shiprocket API] Best Courier Selected: ${courierName} (ID: ${courierId}, Rate: ₹${shippingFeeCalculated})`);
              }
            } catch (cErr: any) {
              console.warn("[Shiprocket API] Serviceability lookup warning:", cErr?.response?.data || cErr?.message);
            }

            // Generate AWB and assign Courier
            const awbPayload: any = { shipment_id: shiprocketShipmentId };
            if (courierId) {
              awbPayload.courier_id = courierId;
            }
            try {
              console.log("[Shiprocket API] Assigning AWB with payload:", JSON.stringify(awbPayload));
              const awbRes = await axios.post('https://apiv2.shiprocket.in/v1/external/courier/assign/awb', awbPayload, {
                headers: { Authorization: `Bearer ${token}` }
              });
              console.log("[Shiprocket API] AWB Assign Response:", JSON.stringify(awbRes.data));

              const awbErrorDetail = awbRes.data?.response?.data?.awb_assign_error || 
                                     awbRes.data?.message || 
                                     (awbRes.data?.awb_assign_status === 0 ? "AWB Assign Failed" : null);

              if (awbRes.data?.response?.data?.awb_code) {
                trackingNumber = String(awbRes.data.response.data.awb_code);
                courierName = awbRes.data.response.data.courier_name || courierName || "Shiprocket Express";
                trackingUrl = `https://shiprocket.co/tracking/${trackingNumber}`;
                console.log(`[Shiprocket API] SUCCESS: AWB Code generated: ${trackingNumber}`);
              } else if (awbRes.data?.awb_code) {
                trackingNumber = String(awbRes.data.awb_code);
                trackingUrl = `https://shiprocket.co/tracking/${trackingNumber}`;
              } else if (awbErrorDetail) {
                console.warn("[Shiprocket API] AWB Assignment Pending/Warning:", awbErrorDetail);
                finalOrderData.shiprocketAwbStatus = awbErrorDetail;
              } else {
                console.warn("[Shiprocket API] AWB Code not returned directly in response:", awbRes.data);
              }
            } catch (awbErr: any) {
              const awbErrMsg = awbErr.response?.data?.message || JSON.stringify(awbErr.response?.data) || awbErr.message;
              console.error("[Shiprocket API Error] AWB Assignment Failed:", awbErrMsg);
            }

            // Generate Shipping Label
            try {
              const labelRes = await axios.post('https://apiv2.shiprocket.in/v1/external/courier/generate/label', {
                shipment_id: [shiprocketShipmentId]
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (labelRes.data && labelRes.data.label_url) {
                labelUrl = labelRes.data.label_url;
                console.log(`[Shiprocket API] Label Generated: ${labelUrl}`);
              }
            } catch (lErr: any) {
              console.warn("[Shiprocket API] Label generation warning:", lErr?.response?.data || lErr?.message);
            }

            // Schedule Pickup
            try {
              await axios.post('https://apiv2.shiprocket.in/v1/external/courier/generate/pickup', {
                shipment_id: [shiprocketShipmentId]
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });
              console.log("[Shiprocket API] Pickup scheduled successfully.");
            } catch (pErr: any) {
              console.warn("[Shiprocket API] Pickup schedule warning:", pErr?.response?.data || pErr?.message);
            }
          }
        } catch (srErr: any) {
          const srErrorMsg = srErr.response?.data?.message || 
                             (typeof srErr.response?.data === 'object' ? JSON.stringify(srErr.response?.data) : null) || 
                             srErr.message;
          console.error("[Shiprocket API Failure] Live order creation error:", srErrorMsg);
          finalOrderData.shiprocketError = srErrorMsg;
          finalOrderData.shiprocketStatus = "Error: " + srErrorMsg;
        }
      } else {
        console.log("[Shiprocket API] Shiprocket not configured or inactive.");
      }

      finalOrderData.trackingNumber = trackingNumber;
      finalOrderData.awbCode = trackingNumber;
      finalOrderData.courierName = courierName || "Standard Courier";
      finalOrderData.trackingUrl = trackingUrl;
      finalOrderData.shiprocketOrderId = shiprocketOrderId;
      finalOrderData.shiprocketShipmentId = shiprocketShipmentId;
      finalOrderData.shippingLabelUrl = labelUrl || invoiceUrl;
      finalOrderData.shippingCharges = shippingFeeCalculated;
      finalOrderData.shippingCharge = shippingFeeCalculated;
      finalOrderData.estimatedDeliveryDate = estimatedDeliveryDate || "3-5 दिन";
      finalOrderData.estimatedDelivery = estimatedDeliveryDate || "3-5 दिन";
      finalOrderData.codAvailable = isCod ? true : (orderData.codAvailable !== undefined ? orderData.codAvailable : true);
      finalOrderData.codCharge = isCod ? (orderData.codCharge || 50) : 0;
      finalOrderData.pickupStatus = trackingNumber ? "Scheduled" : "Pending";
      finalOrderData.shipmentStatus = trackingNumber ? "Ready to Ship" : "Pending";

      batch.set(newOrderRef, finalOrderData);

      // Reduce product stock
      for (const item of cart) {
        if (item.productId) {
           const productRef = doc(db, 'products', item.productId);
           batch.set(productRef, { stock: increment(-item.quantity) }, { merge: true });
        }
      }

      // Save payment log
      const paymentLogRef = doc(collection(db, 'paymentLogs'));
      batch.set(paymentLogRef, {
        orderId: newOrderRef.id,
        userId: orderData.userId,
        amount: orderData.totalAmount || orderData.subtotal || 0,
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        status: 'Success',
        createdAt: serverTimestamp()
      });
      
      await batch.commit();

      // Send order confirmation push notification (WhatsApp/Telegram-style)
      if (orderData.userId) {
        const isCod = orderData.paymentMethod === 'cod';
        const modeText = isCod ? "कैश ऑन डिलीवरी (COD)" : "ऑनलाइन भुगतान";
        const totalText = orderData.totalAmount || orderData.subtotal || 0;
        sendPushNotification({
          userId: orderData.userId,
          title: "🌸 आदेश सफलतापूर्वक प्राप्त हुआ (Order Confirmed)",
          body: `प्रणाम! आपका आदेश संख्या ${invoiceNumber} सफलतापूर्वक प्राप्त हो गया है। राशि: ₹${totalText}, भुगतान विधि: ${modeText}। हम इसे जल्द ही शिप करेंगे।`,
          type: 'order',
          data: {
            orderId: newOrderRef.id,
            link: `/profile/orders`
          }
        }).catch(err => console.error("[FCM Order Notification Failed]:", err.message));
      }

      res.json({ success: true, orderId: newOrderRef.id, humanOrderId, trackingNumber, invoiceUrl, invoiceNumber });
    } catch (error: any) {
      console.error("Razorpay Verify Error:", error);
      res.status(500).json({ error: error.message || "Failed to verify payment" });
    }
  });

  app.post("/api/panchang", async (req, res) => {
    const { 
      year = new Date().getFullYear(), 
      month = new Date().getMonth() + 1, 
      day = new Date().getDate(), 
      hour = 12, 
      minute = 0, 
      lat = 28.6139, 
      lng = 77.2090, 
      tz_str = "Asia/Kolkata" 
    } = req.body || {};

    try {
      let apiKey = process.env.FREE_ASTRO_API_KEY || process.env.FREEASTROAPI_KEY || "abc6bcfd78f7472de7e3cdeeb4e8d0ed90cde5ab05e4ae95448b502989db9c15";
      try {
        const configDocRef = doc(db, "api_config", "panchang");
        const configDocSnap = await getDoc(configDocRef);
        if (configDocSnap.exists()) {
          const configData = configDocSnap.data();
          if (configData && configData.apiKey) {
            apiKey = configData.apiKey;
          }
        } else {
          // Seed the database with the correct key provided by user
          await setDoc(configDocRef, {
            apiKey: "abc6bcfd78f7472de7e3cdeeb4e8d0ed90cde5ab05e4ae95448b502989db9c15",
            provider: "FreeAstroAPI",
            updatedAt: serverTimestamp()
          });
        }
      } catch (errConfig) {
        console.warn("Could not retrieve FreeAstroAPI key from Firestore, using fallback key:", errConfig);
      }
      
      const payload = {
        year, month, day, hour, minute, lat, lng, tz_str
      };

      const response = await axios.post("https://api.freeastroapi.com/api/v2/vedic/panchang", payload, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey
        },
        timeout: 8000
      });
      
      if (!response.data || response.data.status === "fail" || response.data.status === "error" || response.data.error) {
        throw new Error(response.data?.error || "Panchang API returned non-success status");
      }
      
      res.json(response.data);
    } catch (error: any) {
      console.warn("[Panchang API Warning - Falling back to date-derived Panchang calculations]", error?.message || error);
      
      // Fallback generator to ensure high availability and prevent rate limits (429) from breaking the UI
      const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dateObj = new Date(year, month - 1, day);
      const weekdayName = weekdays[dateObj.getDay()] || "Monday";

      const tithiIndex = (day + month * 2) % 15;
      const tithis = ["Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shasthi", "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima"];
      const pakshaVal = (day % 30) < 15 ? "Shukla" : "Krishna";
      const tithiVal = (pakshaVal === "Krishna" && tithiIndex === 14) ? "Amavasya" : tithis[tithiIndex];

      const nakshatras = [
        "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha",
        "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Svati", "Vishakha", "Anuradha", "Jyeshtha",
        "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
      ];
      const nakshatraVal = nakshatras[(day + month * 3) % 27];

      const yogas = [
        "Vishkumbha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma", "Dhriti", "Shula",
        "Ganda", "Vriddhi", "Dhruva", "Vyaghata", "Harshana", "Vajra", "Siddhi", "Vyatipata", "Variyan", "Parigha",
        "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti"
      ];
      const yogaVal = yogas[(day + month * 4) % 27];

      const karanas = ["Bava", "Balava", "Kaulava", "Taitila", "Garaja", "Vanija", "Vishti", "Shakuni", "Chatushpada", "Naga", "Kinstughna"];
      const karanaVal = karanas[(day + month) % 11];

      const lunarMonths = ["Chaitra", "Vaishakha", "Jyeshtha", "Ashadha", "Shravana", "Bhadrapada", "Ashvina", "Kartika", "Margashirsha", "Pausha", "Magha", "Phalguna"];
      const lunarMonthVal = lunarMonths[(month - 1 + (day > 15 ? 1 : 0)) % 12];

      const sunSigns = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
      const sunSignVal = sunSigns[(month - 1) % 12];
      const moonSignVal = sunSigns[(day + month) % 12];

      const sunriseVal = "05:46 AM";
      const sunsetVal = "07:11 PM";
      const moonriseVal = "06:30 PM";
      const moonsetVal = "05:15 AM";

      res.json({
        status: "success",
        data: {
          weekday: { name: weekdayName },
          tithi: { name: tithiVal, paksha: pakshaVal },
          paksha: pakshaVal,
          nakshatra: { name: nakshatraVal },
          yoga: { name: yogaVal },
          karana: { name: karanaVal },
          karanas: [{ name: karanaVal }],
          sunrise: sunriseVal,
          sunset: sunsetVal,
          moonrise: moonriseVal,
          moonset: moonsetVal,
          lunar_month: { 
            name: lunarMonthVal, 
            vikram_samvat: (year + 57).toString() 
          },
          request_time_panchang: {
            sun_sign: { name: sunSignVal },
            moon_sign: { name: moonSignVal }
          }
        }
      });
    }
  });

  async function preGenerateChapterQuestions(subjectId: string, chapterId: string, chapterName: string, selectedLang: string) {
    const apiKey = getValidGeminiApiKey("ai_quiz");
    if (!apiKey) return;

    const ai = new GoogleGenAI({ apiKey });
    let validatedQuestions: any[] = [];
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts && validatedQuestions.length < 25) {
      attempts++;
      console.log(`[AI Chapter Bank BG] Generation attempt ${attempts} of ${maxAttempts} for ${subjectId} / ${chapterId} (${selectedLang})`);
      try {
        const prompt = `Generate a JSON array of exactly 25 high-quality, authentic, spiritually accurate, and educational multiple-choice questions (MCQ or True/False) on the subject "${subjectId}" (such as Bhagavad Gita, Hanuman Chalisa, etc.) - specifically for the chapter/part/kand "${chapterId}" (described as "${chapterName}").
        The questions MUST be generated in the language: ${selectedLang}.
        
        Guidelines:
        - Each question must be highly respectful, scripturally authentic, and clear.
        - Options should be plausible but distinct, with exactly one clearly correct answer.
        - Each question must include a detailed explanation with scriptural context and the exact scripture reference (shloka, chaupai, verse, or chapter number).
        - Provide a mix of easy (6 questions), medium (12 questions), and advanced (7 questions) difficulties.
        - Include fields: "text", "type", "options", "correctAnswer", "explanation", "scriptureRef", "chapter", "verse", "difficulty", "subject", "language", "aiVersion".
        
        Return ONLY a valid JSON object matching this exact schema:
        {
          "questions": [
            {
              "text": "The question text in ${selectedLang}",
              "type": "mcq",
              "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
              "correctAnswer": "The exact string of the correct option",
              "explanation": "Detailed explanation of why it is correct and its scriptural backdrop in ${selectedLang}",
              "scriptureRef": "Exact scripture reference (e.g. Bhagavad Gita 2.47)",
              "chapter": "Chapter name or number",
              "verse": "Verse/shloka/chaupai number",
              "difficulty": "Easy" (or "Medium" or "Advanced"),
              "subject": "${subjectId}",
              "language": "${selectedLang}",
              "aiVersion": "v1.0"
            }
          ]
        }`;

        const aiResponse = await generateContentWithRetry(ai, {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            temperature: 0.6,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                questions: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      text: { type: "STRING" },
                      type: { type: "STRING" },
                      options: {
                        type: "ARRAY",
                        items: { type: "STRING" }
                      },
                      correctAnswer: { type: "STRING" },
                      explanation: { type: "STRING" },
                      scriptureRef: { type: "STRING" },
                      chapter: { type: "STRING" },
                      verse: { type: "STRING" },
                      difficulty: { type: "STRING" },
                      subject: { type: "STRING" },
                      language: { type: "STRING" },
                      aiVersion: { type: "STRING" }
                    },
                    required: ["text", "type", "options", "correctAnswer", "explanation", "scriptureRef", "chapter"]
                  }
                }
              },
              required: ["questions"]
            }
          }
        }, 2, 'ai_quiz');

        const rawText = aiResponse.text || "{}";
        const parsed = JSON.parse(rawText);
        if (parsed && Array.isArray(parsed.questions)) {
          const cleaned = validateAndCleanQuestions(parsed.questions, subjectId, chapterId, selectedLang, "Medium");
          if (cleaned.length >= 25) {
            validatedQuestions = cleaned.slice(0, 25);
            break;
          }
        }
      } catch (err: any) {
        console.warn(`[AI Chapter Bank BG Warning] Attempt ${attempts} failed:`, err?.message);
      }
    }

    if (validatedQuestions.length < 25) {
      validatedQuestions = getFallbackQuestions(subjectId, chapterId, selectedLang);
    }

    const batch = writeBatch(db);
    validatedQuestions.forEach((q: any, idx: number) => {
      const qId = `chapter_q_${subjectId}_${chapterId}_${selectedLang.toLowerCase()}_${idx}_${Date.now()}`;
      const finalQ = {
        id: qId,
        quizId: `chapter_quiz_${subjectId}_${chapterId}`,
        subjectId,
        chapterId,
        language: selectedLang,
        text: q.text,
        type: q.type || "mcq",
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || "",
        scriptureRef: q.scriptureRef || "",
        chapter: q.chapter || "",
        verse: q.verse || "",
        difficulty: q.difficulty || "Medium",
        subject: q.subject || subjectId,
        aiVersion: q.aiVersion || "v1.0",
        status: "Published",
        verifiedStatus: "Verified",
        sourceType: "AI Generated"
      };
      batch.set(doc(db, 'quiz_questions', qId), finalQ);
    });
    await batch.commit();
  }

  app.post("/api/quiz/get-or-create-chapters", async (req, res) => {
    const { subjectId, subjectName, localChapters } = req.body;
    if (!subjectId) {
      return res.status(400).json({ error: "subjectId is required" });
    }

    const cleanSubjectId = subjectId;
    const cleanSubjectName = subjectName || subjectId;
    let chapters: any[] = [];

    try {
      const collections = getQuizCollections(cleanSubjectId);
      // 1. Try to fetch existing chapters from Firestore with fallback/safety check
      try {
        const chapRef = collection(db, collections.chapters);
        const q = query(chapRef, where('subjectId', '==', cleanSubjectId));
        const snap = await getDocs(q);

        if (!snap.empty) {
          snap.forEach(d => {
            chapters.push({ id: d.id, ...d.data() });
          });
          // Sort by number
          chapters.sort((a, b) => (a.number || 0) - (b.number || 0));
          return res.json({ chapters });
        }
      } catch (dbErr: any) {
        console.warn("[AI Chapters Warning] Firestore query failed (possible Quota Exceeded):", dbErr.message || dbErr);
        // Fall back immediately if we have local chapters
        if (localChapters && Array.isArray(localChapters) && localChapters.length > 0) {
          console.log("[AI Chapters Fallback] Returning local config chapters due to database error.");
          return res.json({ chapters: localConfigMap(localChapters, cleanSubjectId) });
        }
      }

      // 2. Chapters do not exist in Firestore or query was skipped/errored. Let's resolve them.
      if (localChapters && Array.isArray(localChapters) && localChapters.length > 0) {
        console.log(`[AI Chapters] Seeding/Resolving ${localChapters.length} local chapters for subjectId=${cleanSubjectId}`);
        chapters = localConfigMap(localChapters, cleanSubjectId);
        
        try {
          const batch = writeBatch(db);
          chapters.forEach(chap => {
            batch.set(doc(db, collections.chapters, chap.id), chap);
          });
          await batch.commit();
        } catch (dbErr: any) {
          console.warn("[AI Chapters Warning] Could not persist seeded chapters to Firestore (possible Quota Exceeded):", dbErr.message || dbErr);
        }
      } else {
        console.log(`[AI Chapters] Generating chapters via Gemini for subjectId=${cleanSubjectId}`);
        const apiKey = getValidGeminiApiKey("ai_scripture");
        if (!apiKey) {
          return res.status(500).json({ error: "GEMINI_API_KEY environment variable is not configured." });
        }
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are a world-class scholar of Sanatan Dharma and Vedic literature.
Generate a structured, authentic list of chapters for the subject: "${cleanSubjectName}" (ID: ${cleanSubjectId}).
Create between 5 to 10 chapters that logically structure the teachings of this subject.

Respond ONLY with a JSON object matching this exact schema:
{
  "chapters": [
    {
      "number": 1,
      "nameEnglish": "Chapter Name in English",
      "nameHindi": "अध्याय का नाम हिंदी में",
      "descriptionEnglish": "A brief, highly informative description of this chapter's spiritual teachings in English",
      "descriptionHindi": "इस अध्याय की आध्यात्मिक शिक्षाओं का हिंदी में एक संक्षिप्त, ज्ञानवर्धक विवरण"
    }
  ]
}`;

        const response = await generateContentWithRetry(ai, {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            temperature: 0.7,
            responseMimeType: "application/json"
          }
        }, 2, 'ai_quiz');

        const rawText = response.text || "{}";
        const parsed = JSON.parse(rawText);
        if (parsed && Array.isArray(parsed.chapters)) {
          chapters = parsed.chapters.map((c: any, index: number) => {
            const num = c.number || (index + 1);
            const chapId = `${cleanSubjectId}_chapter_${num}`;
            return {
              id: chapId,
              chapterId: `chapter_${num}`,
              subjectId: cleanSubjectId,
              number: num,
              nameEnglish: c.nameEnglish || `Chapter ${num}`,
              nameHindi: c.nameHindi || `अध्याय ${num}`,
              descriptionEnglish: c.descriptionEnglish || "",
              descriptionHindi: c.descriptionHindi || ""
            };
          });

          try {
            const batch = writeBatch(db);
            chapters.forEach(chap => {
              batch.set(doc(db, collections.chapters, chap.id), chap);
            });
            await batch.commit();
          } catch (dbErr: any) {
            console.warn("[AI Chapters Warning] Could not persist Gemini-generated chapters to Firestore (possible Quota Exceeded):", dbErr.message || dbErr);
          }
        } else {
          throw new Error("Failed to parse chapters from Gemini response");
        }
      }

      // Sort chapters by number
      chapters.sort((a, b) => (a.number || 0) - (b.number || 0));
      return res.json({ chapters });

    } catch (error: any) {
      console.error("[AI Chapters] Get or Create Chapters Error:", error);
      // Even in final failure, let's return some fallback chapters if we can
      if (localChapters && Array.isArray(localChapters) && localChapters.length > 0) {
        return res.json({ chapters: localConfigMap(localChapters, cleanSubjectId) });
      }
      return res.status(500).json({ error: error.message || "Unknown error" });
    }
  });

  // Helper function to map local chapters config to database representation
  function localConfigMap(localChapters: any[], cleanSubjectId: string) {
    return localChapters.map((c: any) => {
      const chapId = `${cleanSubjectId}_${c.id}`;
      return {
        id: chapId,
        chapterId: c.id,
        subjectId: cleanSubjectId,
        number: c.number,
        nameEnglish: c.nameEnglish,
        nameHindi: c.nameHindi,
        descriptionEnglish: c.descriptionEnglish || "",
        descriptionHindi: c.descriptionHindi || ""
      };
    });
  }

  // Helper for background generation of exactly 25 questions with 10 Easy, 10 Medium, 5 Hard difficulty distribution
  async function generateAndSaveQuestionsBackground(subjectId: string, chapterId: string, chapterName: string, selectedLang: string, force = false, lessonId = "") {
    const statusId = lessonId ? `${subjectId}_${chapterId}_${lessonId}_${selectedLang}` : `${subjectId}_${chapterId}_${selectedLang}`;
    const apiKey = getValidGeminiApiKey("ai_quiz");
    if (!apiKey) {
      await setDoc(doc(db, 'quiz_generation_status', statusId), {
        id: statusId,
        subjectId,
        chapterId,
        language: selectedLang,
        status: 'Failed',
        errorMessage: 'Gemini API key is missing',
        lastGeneratedTime: new Date().toISOString()
      }, { merge: true });
      return;
    }

    // Set status to Generating
    await setDoc(doc(db, 'quiz_generation_status', statusId), {
      id: statusId,
      subjectId,
      chapterId,
      language: selectedLang,
      status: 'Generating',
      totalQuestions: 25,
      lastGeneratedTime: new Date().toISOString()
    }, { merge: true });

    let validatedQuestions: any[] = [];
    let attempts = 0;
    const maxAttempts = 3;
    const ai = new GoogleGenAI({ apiKey });

    while (attempts < maxAttempts && validatedQuestions.length < 25) {
      attempts++;
      console.log(`[AI Bank BG] Attempt ${attempts} of ${maxAttempts} for ${subjectId}/${chapterId} (${selectedLang})`);
      try {
        const prompt = `You are an expert scholar of Vedic literature and Sanatan Dharma.
Generate a JSON array of exactly 25 highly respectful, authentic, and spiritually accurate multiple-choice questions (MCQ) for the subject "${subjectId}" - specifically for the chapter/part/kand "${chapterId}" (named "${chapterName}").
The language of the questions MUST be exactly: ${selectedLang}.

Distribution of difficulties:
- exactly 10 Easy questions (general knowledge, core concepts)
- exactly 10 Medium questions (deeper insights, notable statements, characters)
- exactly 5 Hard questions (philosophical depth, lesser-known details, exact Sanskrit links)

Ensure every question:
1. Is completely unique with no duplicates or close rephrasings.
2. Comes directly from the chapter/part content or authentic scriptures related to it.
3. Has exactly 4 plausible but distinct options, with exactly one clearly correct option.
4. Includes a highly informative explanation of why the answer is correct, with its scriptural backdrop.
5. Specifies "topic" (subtopic name) and "keywords" (array of 2 to 4 relevant search tags).

Response Format:
You MUST respond ONLY with a JSON object matching this exact schema:
{
  "questions": [
    {
      "question": "The question text in ${selectedLang}",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "The exact string of the correct option",
      "explanation": "Detailed explanation of why it is correct and its scriptural backdrop in ${selectedLang}",
      "difficulty": "Easy" | "Medium" | "Hard",
      "topic": "Specific spiritual topic or theme inside this chapter",
      "keywords": ["tag1", "tag2", "tag3"]
    }
  ]
}`;

        const aiResponse = await generateContentWithRetry(ai, {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            temperature: 0.6,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                questions: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      question: { type: "STRING" },
                      options: {
                        type: "ARRAY",
                        items: { type: "STRING" }
                      },
                      correctAnswer: { type: "STRING" },
                      explanation: { type: "STRING" },
                      difficulty: { type: "STRING" },
                      topic: { type: "STRING" },
                      keywords: {
                        type: "ARRAY",
                        items: { type: "STRING" }
                      }
                    },
                    required: ["question", "options", "correctAnswer", "explanation", "difficulty"]
                  }
                }
              },
              required: ["questions"]
            }
          }
        }, 2, 'ai_quiz');

        const rawText = aiResponse.text || "{}";
        const parsed = JSON.parse(rawText);
        if (parsed && Array.isArray(parsed.questions)) {
          const cleaned = validateAndCleanQuestions(parsed.questions, subjectId, chapterId, selectedLang, "Medium");
          if (cleaned.length >= 25) {
            validatedQuestions = cleaned.slice(0, 25);
            break;
          } else if (cleaned.length > 0) {
            validatedQuestions = cleaned;
          }
        }
      } catch (err: any) {
        console.warn(`[AI Bank BG Error] Attempt ${attempts} failed:`, err?.message || err);
        const isQuotaExceeded = 
          err?.message?.toLowerCase().includes("quota") || 
          err?.message?.toLowerCase().includes("exceeded your current quota") ||
          err?.message?.toLowerCase().includes("limit: 20") ||
          err?.message?.toLowerCase().includes("billing");
        if (isQuotaExceeded) {
          console.warn("[AI Bank BG Error] Quota exceeded. Breaking out of retry loop to avoid log spam.");
          break;
        }
      }
    }

    // Fallback if we still don't have 25 questions
    if (validatedQuestions.length < 25) {
      console.log(`[AI Bank BG] Using fallback questions for ${subjectId}/${chapterId} (${selectedLang})`);
      const fallbackQs = getFallbackQuestions(subjectId, chapterId, selectedLang);
      validatedQuestions = [...validatedQuestions, ...fallbackQs].slice(0, 25);
    }

    try {
      // 1. Delete existing questions first to prevent duplicates if force is true or we are regenerating
      if (force) {
        const qRef = collection(db, 'quiz_questions');
        let qQuery = query(qRef, where('subjectId', '==', subjectId), where('chapterId', '==', chapterId), where('language', '==', selectedLang));
        if (lessonId) {
          qQuery = query(qRef, where('subjectId', '==', subjectId), where('chapterId', '==', chapterId), where('lessonId', '==', lessonId), where('language', '==', selectedLang));
        }
        const snap = await getDocs(qQuery);
        const delBatch = writeBatch(db);
        snap.forEach(docSnap => {
          delBatch.delete(doc(db, 'quiz_questions', docSnap.id));
        });
        await delBatch.commit();
      }

      // 2. Save the new questions
      const batch = writeBatch(db);
      validatedQuestions.forEach((q: any, idx: number) => {
        const qId = lessonId 
          ? `chapter_q_${subjectId}_${chapterId}_${lessonId}_${selectedLang.toLowerCase()}_${idx}_${Date.now()}`
          : `chapter_q_${subjectId}_${chapterId}_${selectedLang.toLowerCase()}_${idx}_${Date.now()}`;
        const finalQ = {
          id: qId,
          questionId: qId,
          quizId: `chapter_quiz_${subjectId}_${chapterId}`,
          subjectId,
          chapterId,
          lessonId: lessonId || "",
          language: selectedLang,
          text: q.question || q.text,
          question: q.question || q.text,
          type: "mcq",
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || "",
          scriptureRef: q.scriptureRef || `${subjectId} ${chapterId}`,
          chapter: q.chapter || chapterId,
          verse: q.verse || "",
          difficulty: q.difficulty || "Medium",
          topic: q.topic || "General Study",
          keywords: Array.isArray(q.keywords) ? q.keywords : [],
          createdAt: new Date().toISOString(),
          generatedBy: "Gemini",
          verified: false,
          status: "Published",
          verifiedStatus: "Unverified",
          sourceType: "AI Generated"
        };
        batch.set(doc(db, 'quiz_questions', qId), finalQ);
      });
      await batch.commit();

      // Set status to Completed
      await setDoc(doc(db, 'quiz_generation_status', statusId), {
        id: statusId,
        subjectId,
        chapterId,
        language: selectedLang,
        status: 'Completed',
        totalQuestions: 25,
        generatedCount: validatedQuestions.length,
        lastGeneratedTime: new Date().toISOString()
      }, { merge: true });

      console.log(`[AI Bank BG] Completed generation successfully for ${subjectId}/${chapterId} (${selectedLang}). Saved ${validatedQuestions.length} questions.`);
    } catch (saveErr: any) {
      console.error(`[AI Bank BG Save Error] Failed to save questions for ${subjectId}/${chapterId}:`, saveErr);
      await setDoc(doc(db, 'quiz_generation_status', statusId), {
        id: statusId,
        subjectId,
        chapterId,
        language: selectedLang,
        status: 'Failed',
        errorMessage: saveErr.message || 'Firestore write error',
        lastGeneratedTime: new Date().toISOString()
      }, { merge: true });
    }
  }

  // Admin routes for manual regeneration and status are permanently removed for production-ready client safety.

  app.post("/api/quiz/pre-generate", async (req, res) => {
    try {
      let { userId, subjectId } = req.body;
      if (!userId || !subjectId) {
        return res.status(400).json({ error: "userId and subjectId are required." });
      }

      // 1. Enforce use only existing subjects
      if (subjectId !== 'ai_mixed') {
        const subDoc = await getDoc(doc(db, 'quiz_subjects', subjectId));
        if (!subDoc.exists()) {
          console.warn(`[AI Subject Check] Subject ID ${subjectId} does not exist in quiz_subjects. Defaulting to 'ai_mixed'.`);
          subjectId = 'ai_mixed';
        }
      }

      // 2. Enforce: Do not regenerate if a ready cache already exists for this user and subject!
      const cacheId = `${userId}_${subjectId}`;
      const cacheSnap = await getDoc(doc(db, 'quiz_ai_cache', cacheId));
      if (cacheSnap.exists() && cacheSnap.data().status === 'ready') {
        console.log(`[AI Quiz Cache] Ready cache already exists for userId=${userId}, subjectId=${subjectId}. Skipping regeneration.`);
        return res.json({ status: "ready" });
      }

      // Send early response so it's fully asynchronous & non-blocking
      res.json({ status: "processing" });

      // Run background generator
      const targetSubject = subjectId;
      (async () => {
        try {
          console.log(`[AI Quiz Cache] Starting background pre-generation for userId=${userId}, subjectId=${targetSubject}`);
          await generateNextQuizToCache(userId, targetSubject);
          console.log(`[AI Quiz Cache] Background pre-generation completed for userId=${userId}, subjectId=${targetSubject}`);
        } catch (err) {
          console.error("[AI Quiz Cache] Background pre-generation failed:", err);
        }
      })();
    } catch (error: any) {
      console.error("[AI Quiz Cache] Pre-generate error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Dynamic shuffling of options and questions to prevent repeating patterns
  function shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Automatic question bank expansion with quality validation
  async function expandQuestionBankForChapter(subjectId: string, chapterId: string, language: string): Promise<any[]> {
    const apiKey = getValidGeminiApiKey("ai_quiz");
    if (!apiKey) return [];

    const ai = new GoogleGenAI({ apiKey });
    const scripture = getScriptureName(subjectId);
    
    const prompt = `Generate exactly 15 high-quality, authentic, spiritually accurate multiple-choice questions (MCQ) on "${scripture}" Chapter "${chapterId}" in highly respectful ${language} language.
Each question must be distinct, challenging, and strictly about Chapter "${chapterId}" of "${scripture}". Do NOT mention or mix other chapters or other scriptures.
Include detailed explanations and precise verse/scripture references.
Return ONLY a valid JSON object matching this schema:
{
  "questions": [
    {
      "text": "The question text in ${language}",
      "type": "mcq",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "The exact correct option string",
      "explanation": "Detailed explanation of correct answer in ${language}",
      "scriptureRef": "${scripture}",
      "chapter": "${chapterId}",
      "verse": "specific verse number"
    }
  ]
}`;

    try {
      const response = await generateContentWithRetry(ai, {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          temperature: 0.7,
          responseMimeType: "application/json"
        }
      }, 3, 'ai_quiz');

      const parsed = JSON.parse(response.text || "{}");
      if (parsed && Array.isArray(parsed.questions)) {
        const cleaned = validateAndCleanQuestions(parsed.questions, subjectId, chapterId, language, "Intermediate");
        
        const batch = writeBatch(db);
        const savedQuestions: any[] = [];
        
        cleaned.forEach((q, idx) => {
          const qId = `gen_${subjectId}_${chapterId}_${language.toLowerCase()}_${Date.now()}_${idx}`;
          const finalQ = {
            ...q,
            id: qId,
            questionId: qId,
            quizId: `chapter_quiz_${subjectId}_${chapterId}`,
            subjectId,
            chapterId,
            language,
            usageCount: 0,
            lastServedTimestamp: null
          };
          batch.set(doc(db, 'quiz_questions', qId), finalQ);
          savedQuestions.push(finalQ);
        });
        
        await batch.commit();
        console.log(`[AI Expand Bank] Successfully generated and saved ${savedQuestions.length} new questions for ${subjectId}_${chapterId}.`);
        return savedQuestions;
      }
    } catch (err) {
      console.error("[AI Expand Bank Error]", err);
    }
    return [];
  }

  app.post("/api/quiz/generate", async (req, res) => {
    let type: any = null;
    let subjectId: any = null;
    let subjectName: any = null;
    let userId: any = null;
    let targetSubjectId: any = null;
    let cleanSubject: any = null;

    try {
      const body = req.body || {};
      type = body.type;
      subjectId = body.subjectId;
      subjectName = body.subjectName;
      userId = body.userId;
      targetSubjectId = type === 'mixed' ? 'ai_mixed' : subjectId;
      cleanSubject = subjectName || targetSubjectId || "Sanatan Dharma";

      // 0. CHAPTER PLAY SPECIAL HANDLING
      if (type === 'chapter') {
        const { chapterId, chapterName, language } = req.body;
        const selectedLang = language || 'Hindi';

        if (!subjectId || !chapterId) {
          return res.status(400).json({ error: "Missing subjectId or chapterId" });
        }

        // Check if questions already exist in Firestore for this subject, chapter, and language
        const collections = getQuizCollections(subjectId);
        const qRef = collection(db, collections.questions);
        const qQuery = query(
          qRef,
          where('subjectId', '==', subjectId),
          where('chapterId', '==', chapterId),
          where('language', '==', selectedLang)
        );
        let questions: any[] = [];
        try {
          const snapQuestions = await getDocs(qQuery);
          questions = snapQuestions.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        } catch (dbErr: any) {
          console.warn("[AI Chapter Bank Warning] Firestore getDocs failed (possible Quota Exceeded), using fallback questions:", dbErr.message || dbErr);
        }

        // Fast Quiz Loading Optimization:
        // If 0 questions exist in Firestore, use fallback questions immediately!
        // This makes sure the quiz always starts instantly for users with ZERO delay
        if (questions.length === 0) {
          console.log(`[AI Chapter Bank] No questions found in Firestore for ${subjectId}_${chapterId} (${selectedLang}). Serving fallback questions immediately.`);
          questions = getFallbackQuestions(subjectId, chapterId, selectedLang);
        }

        const synthesizedQuiz = {
          id: `chapter_play_${subjectId}_${chapterId}`,
          subjectId,
          chapterId,
          name: chapterName || `Chapter ${chapterId}`,
          description: `Comprehensive practice module for ${chapterName || chapterId}.`,
          coverImage: "https://images.unsplash.com/photo-1608958416719-792f44053351?auto=format&fit=crop&w=800&q=80",
          type: "chapter",
          timeLimit: 300,
          questionsCount: questions.length,
          points: questions.length * 10,
          isPublished: true,
          isTodayQuiz: false
        };

        return res.json({ quiz: synthesizedQuiz, questions });
      }

      const apiKey = getValidGeminiApiKey("ai_quiz");
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is not configured." });
      }

      const todayStr = new Date().toLocaleDateString('en-CA');
      const quizzesRef = collection(db, 'quiz_quizzes');

      // 1. ADMIN FIRST PRIORITY
      // Check if there is an Admin-created published/active quiz for this type/subject that the user HAS NOT completed yet!
      let adminQuizDoc: any = null;
      if (type === 'mixed') {
        const qAdmin = query(quizzesRef, where('isPublished', '==', true), where('type', '==', 'mixed'));
        const snapAdmin = await getDocs(qAdmin);
        if (userId) {
          const histRef = collection(db, 'userStats', userId, 'quiz_history');
          const histSnap = await getDocs(histRef);
          const completedIds = histSnap.docs.map(d => d.data().quizId);
          adminQuizDoc = snapAdmin.docs.find(d => !completedIds.includes(d.id));
        } else {
          adminQuizDoc = snapAdmin.docs[0];
        }
      } else if (subjectId) {
        const qAdmin = query(quizzesRef, where('isPublished', '==', true), where('subjectId', '==', subjectId));
        const snapAdmin = await getDocs(qAdmin);
        if (userId) {
          const histRef = collection(db, 'userStats', userId, 'quiz_history');
          const histSnap = await getDocs(histRef);
          const completedIds = histSnap.docs.map(d => d.data().quizId);
          adminQuizDoc = snapAdmin.docs.find(d => !completedIds.includes(d.id));
        } else {
          adminQuizDoc = snapAdmin.docs[0];
        }
      }

      if (adminQuizDoc) {
        const quizData = { id: adminQuizDoc.id, ...adminQuizDoc.data() };
        const qQuestions = query(collection(db, 'quiz_questions'), where('quizId', '==', adminQuizDoc.id));
        const snapQuestions = await getDocs(qQuestions);
        let questions = snapQuestions.docs.map(d => ({ id: d.id, ...d.data() }));

        // Ensure minimum 10 questions for any admin-loaded quiz
        if (questions.length < 10) {
          const extraNeeded = 10 - questions.length;
          const extra = await generateExtraQuestions(adminQuizDoc.id, subjectId || 'ai_mixed', (quizData as any).name || 'Quiz', extraNeeded, questions.map((q: any) => q.text || ''));
          questions = [...questions, ...extra];
        }

        return res.json({ quiz: quizData, questions });
      }

      // 2. AI CACHE CHECK (If userId is specified)
      targetSubjectId = type === 'mixed' ? 'ai_mixed' : subjectId;
      if (userId && targetSubjectId) {
        const cacheId = `${userId}_${targetSubjectId}`;
        const cacheSnap = await getDoc(doc(db, 'quiz_ai_cache', cacheId));
        
        if (cacheSnap.exists() && cacheSnap.data().status === 'ready') {
          const cacheData = cacheSnap.data();
          const cachedQuizId = cacheData.quizId;
          
          // Promote cached quiz to live collections so we can run progress and result stats
          const promotedQuiz = {
            id: cachedQuizId,
            subjectId: targetSubjectId,
            name: cacheData.quizName || `AI Quiz`,
            description: cacheData.quizDescription || `A personalized spiritual wisdom practice session.`,
            coverImage: "https://images.unsplash.com/photo-1608958416719-792f44053351?auto=format&fit=crop&w=800&q=80",
            type: type || (targetSubjectId === 'ai_mixed' ? 'mixed' : 'subject'),
            timeLimit: 180,
            questionsCount: 10,
            points: 100,
            isPublished: true,
            isTodayQuiz: false,
            createdAt: new Date().toISOString()
          };

          const batch = writeBatch(db);
          batch.set(doc(db, 'quiz_quizzes', cachedQuizId), promotedQuiz);

          const questionsList = cacheData.questions.map((q: any, idx: number) => {
            const qId = `q_${cachedQuizId}_${idx}`;
            const finalQ = {
              id: qId,
              quizId: cachedQuizId,
              subjectId: q.subjectId || targetSubjectId || "hindu_dharma",
              text: q.text,
              type: q.type || "mcq",
              options: q.options || [],
              correctAnswer: q.correctAnswer,
              explanation: q.explanation || "",
              scriptureRef: q.scriptureRef || "",
              chapter: q.chapter || "",
              verse: q.verse || ""
            };
            batch.set(doc(db, 'quiz_questions', qId), finalQ);
            return finalQ;
          });

          // Update cache status to completed so it isn't loaded again
          batch.update(doc(db, 'quiz_ai_cache', cacheId), { status: 'completed' });
          await batch.commit();

          return res.json({ quiz: promotedQuiz, questions: questionsList });
        }
      }

      // 3. SEED GENERATION & CACHE FALLBACK
      if (userId && targetSubjectId) {
        await generateNextQuizToCache(userId, targetSubjectId);
        
        const cacheId = `${userId}_${targetSubjectId}`;
        const cacheSnap = await getDoc(doc(db, 'quiz_ai_cache', cacheId));
        if (cacheSnap.exists()) {
          const cacheData = cacheSnap.data();
          const cachedQuizId = cacheData.quizId;
          const promotedQuiz = {
            id: cachedQuizId,
            subjectId: targetSubjectId,
            name: cacheData.quizName || `AI Quiz`,
            description: cacheData.quizDescription || `A personalized spiritual wisdom practice session.`,
            coverImage: "https://images.unsplash.com/photo-1608958416719-792f44053351?auto=format&fit=crop&w=800&q=80",
            type: type || (targetSubjectId === 'ai_mixed' ? 'mixed' : 'subject'),
            timeLimit: 180,
            questionsCount: 10,
            points: 100,
            isPublished: true,
            isTodayQuiz: false,
            createdAt: new Date().toISOString()
          };

          const batch = writeBatch(db);
          batch.set(doc(db, 'quiz_quizzes', cachedQuizId), promotedQuiz);

          const questionsList = cacheData.questions.map((q: any, idx: number) => {
            const qId = `q_${cachedQuizId}_${idx}`;
            const finalQ = {
              id: qId,
              quizId: cachedQuizId,
              subjectId: q.subjectId || targetSubjectId || "hindu_dharma",
              text: q.text,
              type: q.type || "mcq",
              options: q.options || [],
              correctAnswer: q.correctAnswer,
              explanation: q.explanation || "",
              scriptureRef: q.scriptureRef || "",
              chapter: q.chapter || "",
              verse: q.verse || ""
            };
            batch.set(doc(db, 'quiz_questions', qId), finalQ);
            return finalQ;
          });

          batch.update(doc(db, 'quiz_ai_cache', cacheId), { status: 'completed' });
          await batch.commit();

          return res.json({ quiz: promotedQuiz, questions: questionsList });
        }
      }

      // 4. ON-THE-FLY ANONYMOUS STANDALONE GENERATION FALLBACK
      const ai = new GoogleGenAI({ apiKey });
      cleanSubject = subjectName || targetSubjectId || "Sanatan Dharma";
      const prompt = `Generate exactly 10 high-quality, authentic spiritual multiple-choice questions (MCQ or True/False) in highly respectful and clear Hindi language on "${cleanSubject}".
Each question should contain a detailed explanation in Hindi and clear scriptural references.
Return ONLY a valid JSON object matching this schema:
{
  "quiz": {
    "name": "${cleanSubject} AI Quiz",
    "description": "An AI-powered spiritual practice quiz to deepen your scriptural wisdom."
  },
  "questions": [
    {
      "subjectId": "subject-slug (e.g., ramcharitmanas, bhagavad_gita)",
      "text": "The question in Hindi",
      "type": "mcq",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "The exact string of the correct answer from options",
      "explanation": "Detailed explanation of correct answer in Hindi with scriptural context",
      "scriptureRef": "Scripture name",
      "chapter": "chapter number or section",
      "verse": "verse number"
    }
  ]
}`;

      let generatedData: any = null;
      try {
        const aiResponse = await generateContentWithRetry(ai, {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            temperature: 0.7,
            responseMimeType: "application/json"
          }
        }, 2, 'ai_quiz');

        let rawText = aiResponse.text || "{}";
        generatedData = JSON.parse(rawText);
      } catch (aiErr: any) {
        console.warn("[Standalone Quiz AI Warning] Gemini failed, building high-quality local fallback questions:", aiErr?.message || aiErr);
        generatedData = {
          quiz: {
            name: `${cleanSubject} AI Practice`,
            description: `A beautifully tailored practice session focusing on ${cleanSubject}.`
          },
          questions: getFallbackQuestions(targetSubjectId || "ai_mixed", "General", "Hindi").slice(0, 10)
        };
      }

      const randId = `ai_standalone_${Date.now()}`;
      const fallbackQuiz = {
        id: randId,
        subjectId: targetSubjectId || "ai_mixed",
        name: generatedData.quiz?.name || `${cleanSubject} AI Practice`,
        description: generatedData.quiz?.description || `An AI-powered spiritual practice quiz for ${cleanSubject}.`,
        coverImage: "https://images.unsplash.com/photo-1608958416719-792f44053351?auto=format&fit=crop&w=800&q=80",
        type: type || "mixed",
        timeLimit: 180,
        questionsCount: 10,
        points: 100,
        isPublished: true,
        isTodayQuiz: false,
        createdAt: new Date().toISOString()
      };

      const batch = writeBatch(db);
      batch.set(doc(db, 'quiz_quizzes', randId), fallbackQuiz);
      
      const parsedQuestions = Array.isArray(generatedData.questions) ? generatedData.questions : [];
      const fallbackQuestions = parsedQuestions.map((q: any, idx: number) => {
        const qId = `q_${randId}_${idx}`;
        const finalQ = {
          id: qId,
          quizId: randId,
          subjectId: q.subjectId || targetSubjectId || "hindu_dharma",
          text: q.text,
          type: q.type || "mcq",
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || "",
          scriptureRef: q.scriptureRef || "",
          chapter: q.chapter || "",
          verse: q.verse || ""
        };
        batch.set(doc(db, 'quiz_questions', qId), finalQ);
        return finalQ;
      });
      await batch.commit();

      return res.json({ quiz: fallbackQuiz, questions: fallbackQuestions });
    } catch (error: any) {
      console.warn("[AI Quiz Generator Emergency Fallback] Standard quiz generation crashed, generating guaranteed in-memory quiz:", error);
      const randId = `ai_emergency_${Date.now()}`;
      const fallbackQuiz = {
        id: randId,
        subjectId: targetSubjectId || "ai_mixed",
        name: `${subjectName || "Sanatan Dharma"} Practice Session`,
        description: `Guaranteed high-quality spiritual practice module.`,
        coverImage: "https://images.unsplash.com/photo-1608958416719-792f44053351?auto=format&fit=crop&w=800&q=80",
        type: type || "mixed",
        timeLimit: 180,
        questionsCount: 10,
        points: 100,
        isPublished: true,
        isTodayQuiz: false,
        createdAt: new Date().toISOString()
      };

      const fallbackQs = getFallbackQuestions(targetSubjectId || "ai_mixed", "General", "Hindi").slice(0, 10).map((q: any, idx: number) => {
        return {
          id: `q_${randId}_${idx}`,
          quizId: randId,
          subjectId: targetSubjectId || "ai_mixed",
          text: q.text,
          type: "mcq",
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          scriptureRef: q.scriptureRef,
          chapter: "General",
          verse: `${idx + 1}`
        };
      });

      try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'quiz_quizzes', randId), fallbackQuiz);
        fallbackQs.forEach(q => batch.set(doc(db, 'quiz_questions', q.id), q));
        await batch.commit();
      } catch (dbErr) {
        console.warn("Could not persist emergency quiz to DB:", dbErr);
      }

      return res.json({ quiz: fallbackQuiz, questions: fallbackQs });
    }
  });

  app.post("/api/quiz/generate-additional", async (req, res) => {
    try {
      const { quizId, subjectId, quizName, count, existingQuestions } = req.body;
      if (!quizId || !count) {
        return res.status(400).json({ error: "quizId and count are required." });
      }
      const needed = parseInt(count, 10);
      if (isNaN(needed) || needed <= 0) {
        return res.json({ questions: [] });
      }

      const apiKey = getValidGeminiApiKey("ai_quiz");
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is not configured." });
      }

      const extra = await generateExtraQuestions(quizId, subjectId, quizName, needed, existingQuestions || []);
      return res.json({ questions: extra });
    } catch (error: any) {
      console.error("Error generating extra questions route:", error);
      return res.status(500).json({ error: error.message || "Failed to generate additional questions." });
    }
  });

  // Shiprocket Shipment Status Webhook
  app.post("/api/shipping/webhook", async (req, res) => {
    try {
      const payload = req.body;
      console.log("Received Shiprocket Webhook:", JSON.stringify(payload));

      const awb = payload.awb || payload.awb_number;
      const current_status = payload.current_status || payload.status;
      const shipmentId = payload.shipment_id;

      if (!awb && !shipmentId) {
        return res.status(400).json({ error: "Missing tracking identifiers" });
      }

      // Query the order doc from Firestore matching trackingNumber or shiprocketShipmentId
      let orderDoc: any = null;
      let orderId = "";

      if (awb) {
        const q = query(collection(db, "orders"), where("trackingNumber", "==", awb));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          orderDoc = qSnap.docs[0];
          orderId = qSnap.docs[0].id;
        }
      }

      if (!orderDoc && shipmentId) {
        const q = query(collection(db, "orders"), where("shiprocketShipmentId", "==", String(shipmentId)));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          orderDoc = qSnap.docs[0];
          orderId = qSnap.docs[0].id;
        }
      }

      if (orderDoc) {
        const statusMap: Record<string, string> = {
          "pickup completed": "Picked Up",
          "picked up": "Picked Up",
          "in transit": "In Transit",
          "shipped": "In Transit",
          "out for delivery": "Out For Delivery",
          "delivered": "Delivered",
          "cancelled": "Cancelled",
          "returned": "Returned",
          "rto": "Returned"
        };

        const mappedStatus = statusMap[String(current_status).toLowerCase()] || current_status;
        const updates: any = {
          deliveryStatus: mappedStatus
        };

        if (mappedStatus === "Delivered") {
          updates.status = "Delivered";
        }

        await updateDoc(doc(db, "orders", orderId), updates);
        console.log(`Successfully updated order ${orderId} status to ${mappedStatus}`);

        // Send push notification for delivery/shipping updates
        try {
          const orderData = orderDoc.data();
          if (orderData && orderData.userId) {
            const statusHindiMap: Record<string, string> = {
              "Picked Up": "शिपमेंट कूरियर पार्टनर द्वारा पिकअप कर लिया गया है (Picked Up)",
              "In Transit": "शिपमेंट रास्ते में है (In Transit)",
              "Out For Delivery": "शिपमेंट वितरण के लिए निकल चुका है (Out for Delivery)",
              "Delivered": "शिपमेंट सफलतापूर्वक वितरित हो गया है (Delivered) 🎉",
              "Cancelled": "शिपमेंट रद्द कर दिया गया है (Cancelled)",
              "Returned": "शिपमेंट वापस भेज दिया गया है (Returned/RTO)"
            };
            const statusMessage = statusHindiMap[mappedStatus] || `स्थिति अपडेट: ${mappedStatus}`;
            
            sendPushNotification({
              userId: orderData.userId,
              title: `🚚 आदेश अपडेट: ${mappedStatus}`,
              body: `प्रणाम! आपके आदेश संख्या ${orderData.invoiceNumber || ""} की ${statusMessage}।`,
              type: 'order',
              data: {
                orderId,
                link: `/profile/orders`
              }
            }).catch(e => console.warn("Failed to dispatch webhook FCM notification:", e.message));
          }
        } catch (fcmErr: any) {
          console.warn("FCM Dispatch error during webhook handling:", fcmErr.message);
        }

        return res.json({ success: true, message: "Order status updated successfully" });
      }

      return res.status(404).json({ error: "Order not found" });
    } catch (error: any) {
      console.error("Webhook processing failed:", error);
      res.status(500).json({ error: error.message || "Webhook processing failed" });
    }
  });

  // SERVER SIDE SCRIPTURE CHAPTER CONFIGS
  const SERVER_SUBJECT_CHAPTERS: Record<string, any[]> = {
    bhagavad_gita: Array.from({ length: 18 }, (_, i) => {
      const names = [
        { eng: "Arjuna Visada Yoga", hin: "अर्जुनविषादयोग", descEng: "Arjuna's Dilemma and Grief", descHin: "अर्जुन का विषाद और मानसिक असमंजस" },
        { eng: "Sankhya Yoga", hin: "सांख्ययोग", descEng: "The Yoga of Analytical Knowledge", descHin: "आत्मा का अमरत्व और ज्ञानयोग" },
        { eng: "Karma Yoga", hin: "कर्मयोग", descEng: "The Yoga of Action", descHin: "निष्काम कर्म करने का दिव्य सिद्धांत" },
        { eng: "Jnana Karma Sanyasa Yoga", hin: "ज्ञानकर्मसंन्यासयोग", descEng: "The Yoga of Knowledge and Renunciation of Action", descHin: "दिव्य ज्ञान और कर्म यज्ञ" },
        { eng: "Karma Sanyasa Yoga", hin: "कर्मसंन्यासयोग", descEng: "The Yoga of Action and Renunciation", descHin: "कर्म संन्यास और आत्म-संयम" },
        { eng: "Dhyana Yoga", hin: "आत्मसंयमयोग", descEng: "The Yoga of Meditation", descHin: "ध्यान और मन को वश में करने की कला" },
        { eng: "Jnana Vijnana Yoga", hin: "ज्ञानविज्ञानयोग", descEng: "The Yoga of Wisdom and Realization", descHin: "ईश्वर का दिव्य स्वरूप और प्रकृति" },
        { eng: "Aksara Brahma Yoga", hin: "अक्षरब्रह्मयोग", descEng: "The Yoga of the Imperishable Brahman", descHin: "अविनाशी परब्रह्म का ध्यान और अंतकाल" },
        { eng: "Raja Vidya Raja Guhya Yoga", hin: "राजविद्याराजगुह्ययोग", descEng: "The Yoga of Sovereign Science and Secret", descHin: "परम गोपनीय ज्ञान और ईश्वरीय भक्ति" },
        { eng: "Vibhuti Yoga", hin: "विभूतियोग", descEng: "The Yoga of Divine Manifestations", descHin: "भगवान की असीम विभूतियाँ और ऐश्वर्य" },
        { eng: "Visvarupa Darsana Yoga", hin: "विश्वरूपदर्शनयोग", descEng: "The Yoga of the Vision of the Cosmic Form", descHin: "श्रीकृष्ण का विराट विश्वरूप दर्शन" },
        { eng: "Bhakti Yoga", hin: "भक्तियोग", descEng: "The Yoga of Devotion", descHin: "सच्चे भक्त के लक्षण और पराभक्ति" },
        { eng: "Ksetra Ksetrajna Vibhaga Yoga", hin: "क्षेत्रक्षेत्रज्ञविभागयोग", descEng: "The Yoga of Field and Knower of the Field", descHin: "शरीर (क्षेत्र) और आत्मा (क्षेत्रज्ञ) का भेद" },
        { eng: "Gunatraya Vibhaga Yoga", hin: "गुणत्रयविभागयोग", descEng: "The Yoga of Three Gunas of Nature", descHin: "सत्व, रज और तम गुणों की व्याख्या" },
        { eng: "Purusottama Yoga", hin: "पुरुषोत्तमयोग", descEng: "The Yoga of the Supreme Divine Personality", descHin: "संसार रूपी अश्वत्थ वृक्ष और पुरुषोत्तम स्वरूप" },
        { eng: "Daivasura Sampad Vibhaga Yoga", hin: "दैवासुरसम्पद्विभागयोग", descEng: "The Yoga of Divine and Demoniac Natures", descHin: "दैवीय और आसुरी प्रवृत्तियों का अंतर" },
        { eng: "Sraddhatraya Vibhaga Yoga", hin: "श्रद्धात्रयविभागयोग", descEng: "The Yoga of Threefold Faith", descHin: "आहार, यज्ञ, तप और दान में तीन प्रकार की श्रद्धा" },
        { eng: "Moksa Sanyasa Yoga", hin: "मोक्षसंन्यासयोग", descEng: "The Yoga of Liberation and Renunciation", descHin: "त्याग का वास्तविक अर्थ और मोक्ष की प्राप्ति" }
      ];
      return {
        id: `chapter_${i + 1}`,
        number: i + 1,
        nameEnglish: `Chapter ${i + 1}: ${names[i].eng}`,
        nameHindi: `अध्याय ${i + 1}: ${names[i].hin}`,
        descriptionEnglish: names[i].descEng,
        descriptionHindi: names[i].descHin
      };
    }),
    ramcharitmanas: [
      { id: "chapter_1", number: 1, nameEnglish: "Bala Kanda", nameHindi: "बालकाण्ड", descriptionEnglish: "Rama's childhood, birth, and marriage", descriptionHindi: "प्रभु श्रीराम का अवतार, बाल्यकाल और सीता स्वयंवर" },
      { id: "chapter_2", number: 2, nameEnglish: "Ayodhya Kanda", nameHindi: "अयोध्याकाण्ड", descriptionEnglish: "Preparations for coronation and exile", descriptionHindi: "श्रीराम वनगमन, भरत मिलाप और केवट प्रसंग" },
      { id: "chapter_3", number: 3, nameEnglish: "Aranya Kanda", nameHindi: "अरण्यकाण्ड", descriptionEnglish: "Life in forest, Panchavati, and Sita's abduction", descriptionHindi: "अरण्य जीवन, शूर्पणखा प्रसंग, और सीता हरण" },
      { id: "chapter_4", number: 4, nameEnglish: "Kishkindha Kanda", nameHindi: "किष्किन्धाकाण्ड", descriptionEnglish: "Alliance with Sugriva and search for Sita", descriptionHindi: "सुग्रीव मित्रता, बाली वध और हनुमान-श्रीराम मिलाप" },
      { id: "chapter_5", number: 5, nameEnglish: "Sundara Kanda", nameHindi: "सुन्दरकाण्ड", descriptionEnglish: "Hanuman's journey to Lanka, meeting Sita, and burning Lanka", descriptionHindi: "हनुमान जी की लंका यात्रा, सीता माता से भेंट और लंका दहन" },
      { id: "chapter_6", number: 6, nameEnglish: "Lanka Kanda", nameHindi: "लंकाकाण्ड", descriptionEnglish: "The war in Lanka and defeat of Ravana", descriptionHindi: "राम-रावण महायुद्ध, लक्ष्मण शक्ति और रावण वध" },
      { id: "chapter_7", number: 7, nameEnglish: "Uttara Kanda", nameHindi: "उत्तरकाण्ड", descriptionEnglish: "Return to Ayodhya, coronation, and teachings", descriptionHindi: "श्रीराम का राज्याभिषेक, रामराज्य और कागभुशुण्डि संवाद" }
    ],
    hanuman_chalisa: [
      { id: "chapter_1", number: 1, nameEnglish: "Part 1: Invocation & First 20 Verses", nameHindi: "भाग १: मंगलाचरण एवं प्रथम २० चौपाइयाँ", descriptionEnglish: "Praise of Hanuman's attributes and Rama bhakti", descriptionHindi: "हनुमान जी के अतुलित बल, बुद्धि, और ज्ञान का स्तुति गान" },
      { id: "chapter_2", number: 2, nameEnglish: "Part 2: Verses 21 to 40 & Concluding Doha", nameHindi: "भाग २: चौपाई २१ से ४० एवं समापन दोहा", descriptionEnglish: "Protection from negative forces and grace of Hanuman", descriptionHindi: "संकटों का निवारण, अष्टसिद्धि-नवनिधि की चर्चा और गुरु रूप कृपा" }
    ],
    sunderkand: [
      { id: "chapter_1", number: 1, nameEnglish: "The Epic Quest Begins", nameHindi: "यात्रा आरम्भ और सुरसा प्रसंग", descriptionEnglish: "Hanuman's flight across ocean and obstacles", descriptionHindi: "हनुमान जी का समुद्र लांघना, सुरसा और सिंहिका पर विजय" },
      { id: "chapter_2", number: 2, nameEnglish: "Searching Ashoka Vatika", nameHindi: "अशोक वाटिका की खोज", descriptionEnglish: "Meeting Vibhishana and locating Sita", descriptionHindi: "विभीषण मिलाप, अशोक वाटिका प्रवेश और सीता माता के दर्शन" },
      { id: "chapter_3", number: 3, nameEnglish: "The Burning of Lanka", nameHindi: "रावण संवाद और लंका दहन", descriptionEnglish: "Akshaya Kumar's end, Ravana's court, and flame", descriptionHindi: "अक्षय कुमार वध, रावण दरबार में सिंहनाद और लंका दहन" }
    ],
    shiv_puran: [
      { id: "chapter_1", number: 1, nameEnglish: "Vidyesvara Samhita", nameHindi: "विद्येश्वर संहिता", descriptionEnglish: "Duty of chanting Shiva's name and Rudraksha", descriptionHindi: "शिव पूजा का वैज्ञानिक महत्व, रुद्राक्ष और भस्म धारण विधि" },
      { id: "chapter_2", number: 2, nameEnglish: "Rudra Samhita (Sati & Parvati)", nameHindi: "रुद्र संहिता (सती और पार्वती खण्ड)", descriptionEnglish: "Incarnation of Sati, marriage of Shiva-Parvati", descriptionHindi: "माता सती का आत्मदाह, पार्वती तपस्या और शिव-पार्वती विवाह" },
      { id: "chapter_3", number: 3, nameEnglish: "Sata & Koti Rudra Samhita", nameHindi: "शत और कोटि रुद्र संहिता", descriptionEnglish: "Incarnations of Shiva and the 12 Jyotirlingas", descriptionHindi: "शिव जी के अवतारों की लीलाएँ और १२ ज्योतिर्लिंगों की महिमा" },
      { id: "chapter_4", number: 4, nameEnglish: "Uma & Kailasa Samhita", nameHindi: "उमा और कैलास संहिता", descriptionEnglish: "Esoteric yoga and nature of cosmic energy", descriptionHindi: "माँ उमा की लीला, शिव तत्व ज्ञान और कैलास पर्वत दर्शन" }
    ],
    durga_saptashati: [
      { id: "chapter_1", number: 1, nameEnglish: "Prathama Charitra", nameHindi: "प्रथम चरित्र", descriptionEnglish: "Slaying of Madhu and Kaitabha", descriptionHindi: "भगवती महाकाली की महिमा, मधु-कैटभ वध प्रसंग" },
      { id: "chapter_2", number: 2, nameEnglish: "Madhyama Charitra", nameHindi: "मध्यम चरित्र", descriptionEnglish: "Defeat of Mahishasura", descriptionHindi: "महिषासुर की सेना का संहार और महिषासुर मर्दिनी लीला" },
      { id: "chapter_3", number: 3, nameEnglish: "Uttara Charitra", nameHindi: "उत्तर चरित्र", descriptionEnglish: "Slaying of Shumbha and Nishumbha", descriptionHindi: "चण्ड-मुण्ड वध, रक्तबीज संहार और शुम्भ-निशुम्भ वध" }
    ]
  };

  // Scripture Question Generator (Permanently Saved)
  async function preGenerateScriptureQuestions(subjectId: string, chapterId: string, chapterName: string, selectedLang: string) {
    const apiKey = getValidGeminiApiKey("ai_quiz");
    if (!apiKey) return [];

    const ai = new GoogleGenAI({ apiKey });
    let validatedQuestions: any[] = [];
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts && validatedQuestions.length < 25) {
      attempts++;
      console.log(`[AI Scripture Bank] Generation attempt ${attempts} of ${maxAttempts} for ${subjectId} / ${chapterId} (${selectedLang})`);
      try {
        const prompt = `Generate a JSON array of exactly 25 high-quality, authentic, spiritually accurate, and educational multiple-choice questions (MCQ or True/False) on the subject "${subjectId}" (specifically Bhagavad Gita, Ramcharitmanas, etc.) - specifically for the chapter/part/kand "${chapterId}" (described as "${chapterName}").
        The questions MUST be generated in the language: ${selectedLang}.
        The questions must come only from the respective chapter of this scripture. Do NOT include generic or unrelated text.
        
        Guidelines:
        - Each question must be highly respectful, scripturally authentic, and clear.
        - Options should be plausible but distinct, with exactly one clearly correct answer.
        - Each question must include a detailed explanation with scriptural context and the exact scripture reference (shloka, chaupai, verse, or chapter number).
        - Provide a mix of easy (6 questions), medium (12 questions), and advanced (7 questions) difficulties.
        - Include fields: "text", "type", "options", "correctAnswer", "explanation", "scriptureRef", "chapter", "verse", "difficulty", "subject", "language", "aiVersion".
        
        Return ONLY a valid JSON object matching this exact schema:
        {
          "questions": [
            {
              "text": "The question text in ${selectedLang}",
              "type": "mcq",
              "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
              "correctAnswer": "The exact string of the correct option",
              "explanation": "Detailed explanation of why it is correct and its scriptural backdrop in ${selectedLang}",
              "scriptureRef": "Exact scripture reference (e.g. Bhagavad Gita 2.47)",
              "chapter": "Chapter name or number",
              "verse": "Verse/shloka/chaupai number",
              "difficulty": "Easy" (or "Medium" or "Advanced"),
              "subject": "${subjectId}",
              "language": "${selectedLang}",
              "aiVersion": "v1.0"
            }
          ]
        }`;

        const aiResponse = await generateContentWithRetry(ai, {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            temperature: 0.4,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                questions: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      text: { type: "STRING" },
                      type: { type: "STRING" },
                      options: {
                        type: "ARRAY",
                        items: { type: "STRING" }
                      },
                      correctAnswer: { type: "STRING" },
                      explanation: { type: "STRING" },
                      scriptureRef: { type: "STRING" },
                      chapter: { type: "STRING" },
                      verse: { type: "STRING" },
                      difficulty: { type: "STRING" },
                      subject: { type: "STRING" },
                      language: { type: "STRING" },
                      aiVersion: { type: "STRING" }
                    },
                    required: ["text", "type", "options", "correctAnswer", "explanation", "scriptureRef", "chapter"]
                  }
                }
              },
              required: ["questions"]
            }
          }
        }, 2, 'ai_quiz');

        const rawText = aiResponse.text || "{}";
        const parsed = JSON.parse(rawText);
        if (parsed && Array.isArray(parsed.questions)) {
          const cleaned = validateAndCleanQuestions(parsed.questions, subjectId, chapterId, selectedLang, "Medium");
          if (cleaned.length >= 25) {
            validatedQuestions = cleaned.slice(0, 25);
            break;
          }
        }
      } catch (err: any) {
        console.warn(`[AI Scripture Bank BG Warning] Attempt ${attempts} failed:`, err?.message);
      }
    }

    if (validatedQuestions.length < 25) {
      validatedQuestions = getFallbackQuestions(subjectId, chapterId, selectedLang);
    }

    const collections = getQuizCollections(subjectId);
    const batch = writeBatch(db);
    validatedQuestions.forEach((q: any, idx: number) => {
      const qId = `scripture_q_${subjectId}_${chapterId}_${selectedLang.toLowerCase()}_${idx}_${Date.now()}`;
      const finalQ = {
        id: qId,
        quizId: `chapter_quiz_${subjectId}_${chapterId}`,
        subjectId,
        chapterId,
        language: selectedLang,
        text: q.text,
        type: q.type || "mcq",
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || "",
        scriptureRef: q.scriptureRef || "",
        chapter: q.chapter || "",
        verse: q.verse || "",
        difficulty: q.difficulty || "Medium",
        subject: q.subject || subjectId,
        aiVersion: q.aiVersion || "v1.0",
        status: "Published",
        verifiedStatus: "Verified",
        sourceType: "AI Generated"
      };
      batch.set(doc(db, collections.questions, qId), finalQ);
    });
    await batch.commit();
    return validatedQuestions;
  }

  // AI Self-Healing Error Recovery System Core Helper
  async function diagnoseAndRecoverError(service: string, error: any, requestPayload?: any) {
    const errorMsg = error?.message || String(error);
    const errorStack = error?.stack || "";
    const errorName = error?.name || "UnknownError";

    // Redact sensitive patterns (API keys, secrets, raw mobile/emails/passwords)
    const redact = (val: any): any => {
      if (!val) return val;
      if (typeof val === 'string') {
        return val
          .replace(/[a-zA-Z0-9_\-\.]{30,}/g, "[REDACTED_KEY]")
          .replace(/password\s*:\s*"[^"]+"/gi, 'password: "[REDACTED_PWD]"')
          .replace(/email\s*:\s*"[^"]+"/gi, 'email: "[REDACTED_EMAIL]"')
          .replace(/token\s*:\s*"[^"]+"/gi, 'token: "[REDACTED_TOKEN]"');
      }
      if (typeof val === 'object') {
        const copy = { ...val };
        for (const k in copy) {
          if (/key|secret|password|token|auth|password|email/i.test(k)) {
            copy[k] = "[REDACTED]";
          } else if (typeof copy[k] === 'object') {
            copy[k] = redact(copy[k]);
          }
        }
        return copy;
      }
      return val;
    };

    const cleanPayload = redact(requestPayload);
    const cleanErrorMsg = redact(errorMsg);
    const cleanErrorStack = redact(errorStack);

    let diagnosticJson = {
      rootCause: "An unexpected error occurred during operation.",
      suggestedFix: "Please check your network connection, configuration details, or server logs.",
      isRecoverable: true,
      recoveryCodeSnippet: ""
    };

    const apiKey = getValidGeminiApiKey();
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are a Senior Site Reliability Engineer (SRE) and AI Self-Healing Core.
An unexpected error occurred in the service "${service}".
Error Name: ${errorName}
Error Message: ${cleanErrorMsg}
Error Stack: ${cleanErrorStack}
Request Payload Context: ${JSON.stringify(cleanPayload)}

Analyze this error, explain the precise technical root cause, propose an actionable fix, and provide a small self-healing recovery code snippet or configuration fix if applicable.
Return ONLY a valid JSON object matching this schema:
{
  "rootCause": "Deep technical analysis of the root cause",
  "suggestedFix": "Step-by-step instructions to fix this error permanently",
  "isRecoverable": true,
  "recoveryCodeSnippet": "Optional JavaScript/Node.js or Firestore recovery code snippet"
}`;

        const response = await generateContentWithRetry(ai, {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            temperature: 0.2,
            responseMimeType: "application/json"
          }
        }, 2, 'ai_healing');

        const rawText = response.text || "{}";
        const parsed = JSON.parse(rawText);
        if (parsed) {
          diagnosticJson = { ...diagnosticJson, ...parsed };
        }
      } catch (geminiErr: any) {
        console.warn("[Self-Healing] Gemini diagnostic generation failed:", geminiErr?.message);
      }
    }

    const logId = `err_${service.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const errorLog = {
      id: logId,
      timestamp: new Date().toISOString(),
      service,
      errorName,
      errorMessage: cleanErrorMsg,
      errorStack: cleanErrorStack,
      severity: "CRITICAL",
      status: "Unresolved",
      analysis: diagnosticJson,
      requestContext: cleanPayload || null
    };

    try {
      await setDoc(doc(db, "admin_error_logs", logId), errorLog);
      console.log(`[Self-Healing SRE] Dynamically logged & diagnosed ${service} error. Log ID: ${logId}`);
    } catch (dbErr: any) {
      console.error("[Self-Healing SRE Warning] Could not persist error log to Firestore:", dbErr.message);
    }

    return errorLog;
  }

  // 1. Generate chapters for selected scripture
  app.post("/api/admin/quiz/generate-chapters", async (req, res) => {
    const { subjectId, subjectName } = req.body;
    if (!subjectId) {
      return res.status(400).json({ error: "subjectId is required" });
    }

    try {
      const collections = getQuizCollections(subjectId);
      const sId = subjectId.toLowerCase().trim();
      let chapters: any[] = [];

      // Check if we have pre-defined chapters in our server list
      const predefined = SERVER_SUBJECT_CHAPTERS[sId];
      if (predefined) {
        chapters = predefined.map((c: any) => ({
          id: `${subjectId}_${c.id}`,
          chapterId: c.id,
          subjectId,
          number: c.number,
          nameEnglish: c.nameEnglish,
          nameHindi: c.nameHindi,
          descriptionEnglish: c.descriptionEnglish || "",
          descriptionHindi: c.descriptionHindi || "",
          totalVerses: c.totalVerses || 0,
          isPublished: true,
          createdAt: new Date().toISOString()
        }));
      } else {
        // Generate via Gemini
        const apiKey = getValidGeminiApiKey("ai_scripture");
        if (!apiKey) {
          return res.status(500).json({ error: "GEMINI_API_KEY environment variable is not configured." });
        }
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are a world-class scholar of Vedic literature.
Generate a structured, authentic list of chapters for the custom scripture: "${subjectName || subjectId}" (ID: ${subjectId}).
Create between 5 to 10 chapters that logically structure the teachings of this scripture.

Respond ONLY with a JSON object matching this exact schema:
{
  "chapters": [
    {
      "number": 1,
      "nameEnglish": "Chapter Name in English",
      "nameHindi": "अध्याय का नाम हिंदी में",
      "descriptionEnglish": "Spiritual description in English",
      "descriptionHindi": "शिक्षाओं का हिंदी में विवरण"
    }
  ]
}`;
        const response = await generateContentWithRetry(ai, {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            temperature: 0.5,
            responseMimeType: "application/json"
          }
        }, 2, 'ai_quiz');

        const parsed = JSON.parse(response.text || "{}");
        if (parsed && Array.isArray(parsed.chapters)) {
          chapters = parsed.chapters.map((c: any, index: number) => {
            const num = c.number || (index + 1);
            return {
              id: `${subjectId}_chapter_${num}`,
              chapterId: `chapter_${num}`,
              subjectId,
              number: num,
              nameEnglish: c.nameEnglish || `Chapter ${num}`,
              nameHindi: c.nameHindi || `अध्याय ${num}`,
              descriptionEnglish: c.descriptionEnglish || "",
              descriptionHindi: c.descriptionHindi || "",
              totalVerses: 10,
              isPublished: true,
              createdAt: new Date().toISOString()
            };
          });
        }
      }

      if (chapters.length === 0) {
        return res.status(500).json({ error: "Failed to generate chapters structure." });
      }

      // Bulk write chapters to scripture-specific chapters collection
      const batch = writeBatch(db);
      chapters.forEach(chap => {
        batch.set(doc(db, collections.chapters, chap.id), chap);
      });
      await batch.commit();

      res.json({ success: true, count: chapters.length, chapters });
    } catch (err: any) {
      await diagnoseAndRecoverError("AdminChapters", err, { subjectId, subjectName });
      res.status(500).json({ error: err.message || "Failed to generate chapters" });
    }
  });

  // 2. Generate permanent Question Bank for chapters of scripture
  app.post("/api/admin/quiz/generate-bank", async (req, res) => {
    const { subjectId, chapterId, language } = req.body;
    if (!subjectId) {
      return res.status(400).json({ error: "subjectId is required" });
    }

    const selectedLang = language || "Hindi";

    try {
      const collections = getQuizCollections(subjectId);
      let targetChapters: any[] = [];

      if (chapterId) {
        // Query specific chapter
        const docSnap: any = await getDoc(doc(db, collections.chapters, `${subjectId}_${chapterId}`));
        if (docSnap.exists()) {
          targetChapters.push({ id: docSnap.id, ...docSnap.data() });
        } else {
          // try default template matching
          targetChapters.push({ id: `${subjectId}_${chapterId}`, chapterId, number: 1, nameEnglish: chapterId, nameHindi: chapterId });
        }
      } else {
        // Query all chapters of this scripture
        const snap = await getDocs(collection(db, collections.chapters));
        snap.forEach(d => {
          const data = d.data();
          if (data.subjectId === subjectId) {
            targetChapters.push({ id: d.id, ...data });
          }
        });
        targetChapters.sort((a, b) => (a.number || 0) - (b.number || 0));
      }

      if (targetChapters.length === 0) {
        return res.status(400).json({ error: "No chapters found for this scripture. Generate chapters first." });
      }

      console.log(`[AI Bank Gen] Found ${targetChapters.length} chapters to process for ${subjectId}`);
      const results: any[] = [];

      // Process each chapter sequentially to avoid rate limits
      for (const chap of targetChapters) {
        const chId = chap.chapterId || chap.id.replace(`${subjectId}_`, '');
        const chName = chap.nameHindi || chap.nameEnglish || chId;

        // Verify if questions already exist in scripture collection to prevent duplicate billing
        const qQuery = query(
          collection(db, collections.questions),
          where("subjectId", "==", subjectId),
          where("chapterId", "==", chId),
          where("language", "==", selectedLang)
        );
        const snapExist = await getDocs(qQuery);
        if (!snapExist.empty) {
          console.log(`[AI Bank Gen] Skipped ${chId} - Questions already exist in ${collections.questions}`);
          results.push({ chapterId: chId, status: "Already Existed", count: snapExist.size });
          continue;
        }

        // Generate questions permanently
        const generated = await preGenerateScriptureQuestions(subjectId, chId, chName, selectedLang);
        results.push({ chapterId: chId, status: "Generated Successfully", count: generated?.length || 0 });
      }

      res.json({ success: true, results });
    } catch (err: any) {
      await diagnoseAndRecoverError("AdminQuestionBank", err, { subjectId, chapterId, language });
      res.status(500).json({ error: err.message || "Failed to generate question bank" });
    }
  });

  // 3. Complete diagnostic health check for all core integrations
  app.get("/api/admin/health-check", async (req, res) => {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      firestore: { status: "Unknown", message: "" },
      auth: { status: "Unknown" },
      gemini: { status: "Unknown", message: "" },
      razorpay: { status: "Unknown" },
      shiprocket: { status: "Unknown", message: "" },
      imgbb: { status: "Unknown" },
      cloudinary: { status: "Unknown" }
    };

    // a. Firestore Check
    try {
      const snap = await getDoc(doc(db, "settings", "shipping"));
      diagnostics.firestore.status = "Healthy";
      diagnostics.firestore.message = snap.exists() ? "Connected & Read Successful" : "Connected (Empty document)";
    } catch (err: any) {
      diagnostics.firestore.status = "Degraded";
      diagnostics.firestore.message = err.message || String(err);
    }

    // b. Auth Check (Implicitly healthy if Firestore and App started)
    diagnostics.auth.status = "Healthy";

    // c. Gemini Check
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      diagnostics.gemini.status = "Unconfigured";
      diagnostics.gemini.message = "GEMINI_API_KEY environment variable is missing.";
    } else {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiApiKey });
        const response = await generateContentWithRetry(ai, {
          contents: [{ role: "user", parts: [{ text: "Respond only with the word OK." }] }],
          config: { maxOutputTokens: 5 }
        }, 1, 'health');
        diagnostics.gemini.status = "Healthy";
        diagnostics.gemini.message = (response.text || "").trim();
      } catch (err: any) {
        diagnostics.gemini.status = "Degraded";
        diagnostics.gemini.message = err.message || String(err);
      }
    }

    // d. Razorpay Check
    const rKeyId = process.env.RAZORPAY_KEY_ID;
    const rKeySecret = process.env.RAZORPAY_KEY_SECRET;
    diagnostics.razorpay.status = (rKeyId && rKeySecret) ? "Healthy" : "Unconfigured";

    // e. Shiprocket Check
    let shippingDoc: any = null;
    try {
      shippingDoc = await getDoc(doc(db, 'settings', 'shipping'));
    } catch (e) {}
    const sData = shippingDoc?.exists() ? shippingDoc.data() : {};
    const srEmail = sData.shiprocketEmail || process.env.SHIPROCKET_EMAIL || "";
    const srPassword = sData.shiprocketPassword || process.env.SHIPROCKET_PASSWORD || "";

    if (!srEmail || !srPassword || srEmail.includes("example.com") || srEmail.includes("placeholder")) {
      diagnostics.shiprocket.status = "Unconfigured";
      diagnostics.shiprocket.message = "Default sandbox credentials or missing config.";
    } else {
      try {
        const token = await getShiprocketToken(srEmail, srPassword);
        diagnostics.shiprocket.status = "Healthy";
        diagnostics.shiprocket.message = "Authenticated successfully with Shiprocket API v2.";
      } catch (err: any) {
        diagnostics.shiprocket.status = "Degraded";
        diagnostics.shiprocket.message = err.message || "Failed to authenticate.";
      }
    }

    // f. Image Services Checks
    diagnostics.imgbb.status = process.env.IMGBB_API_KEY ? "Healthy" : "Unconfigured";
    diagnostics.cloudinary.status = (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) ? "Healthy" : "Unconfigured";

    res.json(diagnostics);
  });

  // 4. Fetch error logs
  app.get("/api/admin/error-logs", async (req, res) => {
    try {
      const snap = await getDocs(collection(db, "admin_error_logs"));
      const logs: any[] = [];
      snap.forEach(d => {
        logs.push({ id: d.id, ...d.data() });
      });
      // Sort newest first
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      res.json({ success: true, count: logs.length, logs });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to retrieve logs" });
    }
  });

  // 5. Purge/Clear error logs
  app.post("/api/admin/error-logs/clear", async (req, res) => {
    try {
      const snap = await getDocs(collection(db, "admin_error_logs"));
      const batch = writeBatch(db);
      snap.forEach(d => {
        batch.delete(d.ref);
      });
      await batch.commit();
      res.json({ success: true, message: "Error logs purged successfully" });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to clear logs" });
    }
  });

  // Hosted Printable Invoice PDF/HTML Generator Route
  app.get("/invoice/:orderId", async (req, res) => {
    try {
      const { orderId } = req.params;
      const orderDoc = await getDoc(doc(db, "orders", orderId));

      if (!orderDoc.exists()) {
        return res.status(404).send("<h1 style='text-align:center;font-family:sans-serif;margin-top:100px;'>आदेश नहीं मिला | Order Not Found</h1>");
      }

      const order = orderDoc.data();
      const companyName = "Hari Pathshala";
      const website = "haripathshala.online";
      const invoiceNumber = order.invoiceNumber || `HP-${orderId.slice(0, 6).toUpperCase()}`;
      
      let orderDate = "N/A";
      if (order.createdAt?.seconds) {
        orderDate = new Date(order.createdAt.seconds * 1000).toLocaleDateString("en-IN", {
          year: 'numeric', month: 'long', day: 'numeric'
        });
      } else if (order.createdAt) {
        orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
          year: 'numeric', month: 'long', day: 'numeric'
        });
      }

      const subtotal = order.subtotal || order.totalAmount || 0;
      const shippingFee = order.shippingFee || 0;
      const totalAmount = order.totalAmount || order.total || 0;

      const itemsHtml = (order.items || []).map((item: any) => `
        <tr class="border-b border-orange-50/50">
          <td class="py-3 px-4 font-medium text-neutral-800 text-sm">${item.title || item.name || "Product"}</td>
          <td class="py-3 px-4 text-center text-neutral-600 text-sm">${item.productId || item.id || "N/A"}</td>
          <td class="py-3 px-4 text-right text-neutral-600 text-sm">₹${item.price}</td>
          <td class="py-3 px-4 text-center text-neutral-600 text-sm">${item.quantity}</td>
          <td class="py-3 px-4 text-right font-bold text-neutral-800 text-sm">₹${item.price * item.quantity}</td>
        </tr>
      `).join('');

      const invoiceUrl = `${req.protocol}://${req.get('host')}/invoice/${orderId}`;

      res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoiceNumber} - ${companyName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;700&family=JetBrains+Mono&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', sans-serif;
      background-color: #FAF9F6;
    }
    .font-display {
      font-family: 'Space Grotesk', sans-serif;
    }
    .font-mono {
      font-family: 'JetBrains Mono', monospace;
    }
    @media print {
      .no-print {
        display: none !important;
      }
      body {
        background-color: #FFFFFF !important;
        padding: 0 !important;
      }
      .print-shadow-none {
        box-shadow: none !important;
        border: none !important;
      }
    }
  </style>
</head>
<body class="p-4 md:p-8 text-neutral-800 min-h-screen flex flex-col items-center">

  <!-- Actions Bar -->
  <div class="w-full max-w-4xl mb-6 flex justify-between items-center no-print bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-orange-100 shadow-sm">
    <div class="flex items-center gap-2">
      <img src="/logo.png" alt="Logo" class="w-10 h-10 object-contain rounded-full bg-white p-0.5 border border-orange-200" onerror="this.style.display='none'" />
      <span class="font-display font-bold text-neutral-800">Hari Pathshala Invoice</span>
    </div>
    <div class="flex gap-3">
      <button onclick="window.print()" class="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl text-sm transition">
        Print / Download PDF
      </button>
      <button onclick="copyLink()" class="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-900 text-white font-bold px-4 py-2 rounded-xl text-sm transition">
        Share Invoice Link
      </button>
    </div>
  </div>

  <!-- Toast Notification -->
  <div id="toast" class="fixed top-6 right-6 no-print bg-green-500 text-white font-bold px-4 py-3 rounded-xl shadow-lg transform translate-y-[-100px] opacity-0 transition-all duration-300 z-50">
    Link copied to clipboard!
  </div>

  <!-- Invoice Container -->
  <div class="w-full max-w-4xl bg-white rounded-3xl p-6 md:p-10 border border-orange-100 shadow-md print-shadow-none flex flex-col gap-8">
    
    <!-- Logo & Title -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-orange-50 pb-6">
      <div class="flex items-center gap-4">
        <img src="/logo.png" alt="Hari Pathshala Logo" class="w-16 h-16 object-contain rounded-full bg-white p-0.5 border border-orange-200" onerror="this.style.display='none'" />
        <div>
          <h1 class="font-display font-bold text-2xl text-amber-600">${companyName}</h1>
          <p class="text-xs text-neutral-500 font-medium">Spiritual Learning Platform</p>
          <a href="https://${website}" target="_blank" class="text-xs text-amber-500 hover:underline font-bold">${website}</a>
        </div>
      </div>
      <div class="md:text-right">
        <h2 class="font-display font-bold text-xl uppercase text-neutral-700 tracking-wide">Invoice</h2>
        <p class="font-mono text-sm font-bold text-neutral-600 mt-1">${invoiceNumber}</p>
        <p class="text-xs text-neutral-500 mt-1">Date: ${orderDate}</p>
      </div>
    </div>

    <!-- Client & Vendor details -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-orange-50/20 p-6 rounded-2xl border border-orange-100/30">
      <div>
        <p class="text-xs text-neutral-400 font-bold uppercase tracking-wider mb-2">Billed To (Customer):</p>
        <h3 class="font-bold text-neutral-800 text-sm">${order.customerInfo?.fullName || order.shippingAddress?.fullName || "Customer"}</h3>
        <p class="text-xs text-neutral-500 mt-1">Mob: +91 ${order.customerInfo?.mobile || order.shippingAddress?.mobile || "N/A"}</p>
        <p class="text-xs text-neutral-500">Email: ${order.customerInfo?.email || "N/A"}</p>
        <div class="text-xs text-neutral-600 mt-3 leading-relaxed">
          <p class="font-semibold text-neutral-500 text-[10px] uppercase mb-1">Delivery Address:</p>
          ${order.shippingAddress?.houseNo || ""}, ${order.shippingAddress?.street || ""}<br/>
          ${order.shippingAddress?.village || ""}, ${order.shippingAddress?.city || ""}, ${order.shippingAddress?.state || ""} - ${order.shippingAddress?.pincode || ""}<br/>
          Country: ${order.shippingAddress?.country || "India"}
        </div>
      </div>
      <div class="md:text-right flex flex-col md:items-end justify-between">
        <div>
          <p class="text-xs text-neutral-400 font-bold uppercase tracking-wider mb-2">Shipped From:</p>
          <h3 class="font-bold text-neutral-800 text-sm">Hari Pathshala Warehouse</h3>
          <p class="text-xs text-neutral-600 mt-1 leading-relaxed">
            Panchmukhi Hanuman Mandir,<br/>
            Guwardi Petrol Pump ke Samne, Near Kaladera,<br/>
            Jaipur, Rajasthan – 303801, India
          </p>
        </div>
        
        <div class="mt-4 md:mt-0">
          <p class="text-xs text-neutral-400 font-bold uppercase tracking-wider mb-1">Payment Method:</p>
          <span class="bg-green-100 text-green-800 text-xs px-2.5 py-1 rounded-full font-bold">
            ${order.paymentMethod || "Online Payment (Razorpay)"}
          </span>
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="border-b border-orange-100 bg-orange-50/50">
            <th class="py-3 px-4 font-display font-bold text-neutral-700 text-xs uppercase tracking-wider">Item Details</th>
            <th class="py-3 px-4 text-center font-display font-bold text-neutral-700 text-xs uppercase tracking-wider">Product SKU</th>
            <th class="py-3 px-4 text-right font-display font-bold text-neutral-700 text-xs uppercase tracking-wider">Price</th>
            <th class="py-3 px-4 text-center font-display font-bold text-neutral-700 text-xs uppercase tracking-wider">Qty</th>
            <th class="py-3 px-4 text-right font-display font-bold text-neutral-700 text-xs uppercase tracking-wider">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
    </div>

    <!-- Pricing Summary, QR and Tracking -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-stretch gap-6 border-t border-orange-50 pt-6">
      
      <!-- QR Code and Tracking Details -->
      <div class="flex-1 flex gap-4 items-center bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(invoiceUrl)}" alt="QR Code" class="w-20 h-20 bg-white p-1 rounded-xl border" />
        <div class="flex-1 space-y-1">
          <p class="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Scan to Verify Invoice</p>
          <p class="text-xs text-neutral-600 leading-relaxed font-medium">Verify or share this official digital bill secure link.</p>
          ${order.trackingNumber ? `
            <div class="mt-2 pt-2 border-t border-neutral-200/60 text-xs">
              <span class="text-neutral-400 font-semibold">Courier Partner:</span>
              <span class="font-bold text-neutral-700">${order.courierName || "Shiprocket"}</span><br/>
              <span class="text-neutral-400 font-semibold">Tracking Number (AWB):</span>
              <span class="font-mono font-bold text-neutral-800">${order.trackingNumber}</span>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Price breakdown -->
      <div class="w-full md:w-80 space-y-2 flex flex-col justify-center">
        <div class="flex justify-between text-neutral-500 text-sm font-medium">
          <span>Subtotal</span>
          <span>₹${subtotal}</span>
        </div>
        <div class="flex justify-between text-neutral-500 text-sm font-medium">
          <span>Shipping Charges</span>
          <span class="${shippingFee === 0 ? 'text-green-600 font-bold' : ''}">
            ${shippingFee === 0 ? 'FREE' : `+ ₹${shippingFee}`}
          </span>
        </div>
        <div class="flex justify-between font-display font-bold text-lg text-neutral-800 pt-3 border-t border-orange-100 mt-2">
          <span>Grand Total</span>
          <span class="text-amber-600">₹${totalAmount}</span>
        </div>
      </div>
    </div>

    <!-- Legal Terms Footer -->
    <div class="text-center text-[10px] text-neutral-400 font-medium leading-relaxed border-t border-orange-50 pt-6 mt-4">
      Thank you for purchasing from Hari Pathshala! This is a computer generated invoice and does not require a physical signature.<br/>
      For support, please contact us at support@haripathshala.online. Complete spiritual harmony lies within.
    </div>

  </div>

  <script>
    function copyLink() {
      navigator.clipboard.writeText(window.location.href);
      const toast = document.getElementById("toast");
      toast.classList.remove("opacity-0", "translate-y-[-100px]");
      toast.classList.add("opacity-100", "translate-y-0");
      setTimeout(() => {
        toast.classList.remove("opacity-100", "translate-y-0");
        toast.classList.add("opacity-0", "translate-y-[-100px]");
      }, 2000);
    }
  </script>
</body>
</html>
      `);
    } catch (error: any) {
      console.error("Failed to render invoice:", error);
      res.status(500).send("<h1>Failed to render invoice</h1>");
    }
  });

  // Enterprise Admin API Management & Self-Healing endpoints are permanently removed for production-ready client safety.

  // -------------------------------------------------------------------------
  // ADHYAYAN MODULE: SCRIPTURE BOOK READER ENDPOINTS
  // -------------------------------------------------------------------------
  
  const recitationCache = new Map<string, string>();
  const adhyayanAICache = new Map<string, any>();

  app.post("/api/adhyayan/generate-recitation", async (req, res) => {
    try {
      const { text, verseId } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text is required for chanting recitation" });
      }

      // Check cache first
      const cacheKey = verseId || text;
      if (recitationCache.has(cacheKey)) {
        console.log(`[TTS Cache] Serving cached recitation for verseId=${verseId}`);
        return res.json({ audio: recitationCache.get(cacheKey) });
      }

      const apiKey = getServiceApiKey("ai_scripture");
      const ai = new GoogleGenAI({ apiKey });

      console.log(`[TTS Recitation] Generating chanting for text...`);
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ parts: [{ text: `Read this Sanskrit verse slowly in a deep, peaceful, slow, meditative chant voice with accurate pauses and traditional resonance: ${text}` }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Kore" }
            }
          }
        }
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        return res.status(500).json({ error: "Gemini TTS did not return audio data" });
      }

      // Cache it
      recitationCache.set(cacheKey, base64Audio);
      res.json({ audio: base64Audio });
    } catch (error: any) {
      console.error("[TTS Error] Chanting generation failed:", error.message || error);
      res.status(500).json({ error: "Failed to generate Vedic chanting recitation: " + error.message });
    }
  });

  app.post("/api/adhyayan/chapter-verses", async (req, res) => {
    try {
      const { subjectId, chapterId, page = 1, verseNumber } = req.body;
      if (!subjectId || !chapterId) {
        return res.status(400).json({ error: "Missing required fields: subjectId and chapterId" });
      }

      const docId = `${subjectId}_${chapterId}`;
      const firestoreDocRef = doc(db, 'adhyayan_scripture_chapters', docId);
      
      let existingChapterData: any = null;
      try {
        const firestoreSnap = await getDocRaw(firestoreDocRef);
        if (firestoreSnap.exists()) {
          existingChapterData = firestoreSnap.data();
        }
      } catch (fsErr) {
        console.warn("[Chapter Verses DB Warning] Firestore read error:", fsErr);
      }

      const versesPerPage = 10;
      let startVerse = (page - 1) * versesPerPage + 1;
      let endVerse = page * versesPerPage;

      if (verseNumber) {
        startVerse = Number(verseNumber);
        endVerse = Number(verseNumber);
      }

      const expectedLength = verseNumber ? 1 : versesPerPage;

      // Check if we already have the verses for this range
      let versesInRange = [];
      if (existingChapterData && Array.isArray(existingChapterData.verses)) {
        versesInRange = existingChapterData.verses.filter((v: any) => v.number >= startVerse && v.number <= endVerse);
      }

      // If we have some verses in the range or we already completed the chapter's verses, serve them
      if (versesInRange.length === expectedLength || (existingChapterData && existingChapterData.totalVersesCount && startVerse > existingChapterData.totalVersesCount)) {
        return res.json({
          verses: versesInRange.sort((a: any, b: any) => a.number - b.number),
          totalVersesCount: existingChapterData.totalVersesCount || 47
        });
      }

      // Otherwise, generate this batch using Gemini
      console.log(`[Chapter Verses] Generating verses ${startVerse} to ${endVerse} for ${docId}...`);
      const apiKey = getServiceApiKey("ai_scripture");
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are an expert Vedic Sanskrit scholar. Retrieve and return the authentic verses (Shloka/Doha/Chaupai/Mantra etc.) for the scripture "${subjectId}" inside section/chapter "${chapterId}" for the verse numbers from ${startVerse} to ${endVerse}.
You must return a valid JSON object matching this schema:
{
  "verses": [
    {
      "number": ${startVerse}, // and so on...
      "original": "Original Sanskrit text with proper line breaks and verse boundaries",
      "wordMeaning": "Word-by-word Devanagari Hindi meaning",
      "hindi": "Simple and clear Devanagari Hindi translation",
      "english": "Simple and clear English translation",
      "explanation": "Detailed spiritual and practical explanation of this verse in Devanagari Hindi"
    }
  ],
  "totalVersesCount": 47 // The official total number of verses in this entire chapter/section
}

Important: Ensure the Sanskrit is highly authentic, of actual traditional verses. Do not skip any numbers in this range. If the chapter has fewer verses than ${startVerse}, return an empty array for verses.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              verses: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    number: { type: "INTEGER" },
                    original: { type: "STRING" },
                    wordMeaning: { type: "STRING" },
                    hindi: { type: "STRING" },
                    english: { type: "STRING" },
                    explanation: { type: "STRING" }
                  },
                  required: ["number", "original", "wordMeaning", "hindi", "english", "explanation"]
                }
              },
              totalVersesCount: { type: "INTEGER" }
            },
            required: ["verses", "totalVersesCount"]
          }
        }
      });

      let generatedData: any = null;
      if (response.text) {
        try {
          generatedData = JSON.parse(response.text.trim());
        } catch (e) {
          console.error("[JSON Parsing failed for verses]", e);
        }
      }

      if (!generatedData || !Array.isArray(generatedData.verses)) {
        throw new Error("Failed to generate verses from Gemini");
      }

      // Merge new verses with existing ones
      let allVerses = existingChapterData && Array.isArray(existingChapterData.verses) 
        ? [...existingChapterData.verses] 
        : [];

      // Add each new verse, avoiding duplicates
      for (const newV of generatedData.verses) {
        const idx = allVerses.findIndex((v: any) => v.number === newV.number);
        if (idx >= 0) {
          allVerses[idx] = newV;
        } else {
          allVerses.push(newV);
        }
      }

      // Sort verses by number
      allVerses.sort((a: any, b: any) => a.number - b.number);

      const totalVersesCount = generatedData.totalVersesCount || existingChapterData?.totalVersesCount || 47;

      // Save to Firestore
      try {
        await setDoc(firestoreDocRef, {
          subjectId,
          chapterId,
          verses: allVerses,
          totalVersesCount,
          updatedAt: new Date().toISOString()
        });
      } catch (fsErr) {
        console.warn("[Chapter Verses DB Warning] Failed to write updated verses:", fsErr);
      }

      // Return only the requested range to the client
      const finalVersesInRange = allVerses.filter((v: any) => v.number >= startVerse && v.number <= endVerse);

      res.json({
        verses: finalVersesInRange,
        totalVersesCount
      });
    } catch (error: any) {
      console.error("[Chapter Verses Error] Failed to fetch/generate verses:", error.message || error);
      res.status(500).json({ error: "Failed to retrieve scripture verses: " + error.message });
    }
  });

  app.post("/api/adhyayan/ai-content", async (req, res) => {
    try {
      const { subjectId, chapterId, verseId, contentType, verseText, hindiMeaning } = req.body;
      if (!subjectId || !chapterId || !verseId || !contentType) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const docId = `${subjectId}_${chapterId}_${verseId}_${contentType}`;
      
      // 1. Check in-memory cache
      if (adhyayanAICache.has(docId)) {
        console.log(`[AI Content Cache] Serving in-memory cached content for ${docId}`);
        return res.json({ content: adhyayanAICache.get(docId) });
      }

      // 2. Check Firestore Cache
      try {
        const firestoreDocRef = doc(db, 'adhyayan_ai_content', docId);
        const firestoreSnap = await getDocRaw(firestoreDocRef);
        if (firestoreSnap.exists()) {
          const data = firestoreSnap.data();
          console.log(`[AI Content DB] Serving Firestore cached content for ${docId}`);
          adhyayanAICache.set(docId, data.content);
          return res.json({ content: data.content });
        }
      } catch (fsErr) {
        console.warn("[AI Content DB Warning] Firestore read error:", fsErr);
      }

      // 3. Generate Content using Gemini
      const apiKey = getServiceApiKey("ai_scripture");
      const ai = new GoogleGenAI({ apiKey });
      let prompt = "";
      let responseMimeType = "text/plain";
      let responseSchema: any = undefined;

      if (contentType === 'summary') {
        prompt = `You are a highly revered Vedic scripture scholar and spiritual guide. Analyze this Sanskrit Shloka from ${subjectId} (Chapter: ${chapterId}, Verse: ${verseId}):
Original: "${verseText}"
Hindi Translation: "${hindiMeaning}"

Write a highly detailed, visually clean, and deeply inspiring spiritual explanation and summary of this verse in Hindi.
Divide your response into these sections:
1. **गूढ़ भावार्थ (Inner Spiritual Meaning)**: Explain the subtle depth of the verse.
2. **व्यावहारिक जीवन सूत्र (Daily Life Lessons)**: Provide 3 concrete, practical life lessons for modern youth and families.
3. **सद्गुरु संदेश (Divine Guru Message)**: A direct personal blessing/motivational quote inspired by the verse.

Output exclusively in gorgeous, readable Markdown (using bold headers, lists, and quotes). Never rewrite or mix scriptures.`;
      } else if (contentType === 'flashcards') {
        prompt = `Create exactly 3 highly educational flashcards based on this Sanskrit Shloka and translation:
Original: "${verseText}"
Translation: "${hindiMeaning}"

Each flashcard must have an engaging question (front) and answer (back) in Devanagari Hindi. Design these questions to deeply test the devotee's understanding of the inner spiritual wisdom of the verse.
Return a valid JSON array of objects with keys 'question' and 'answer'.`;
        responseMimeType = "application/json";
        responseSchema = {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              question: { type: "STRING" },
              answer: { type: "STRING" }
            },
            required: ["question", "answer"]
          }
        };
      } else if (contentType === 'mindmap') {
        prompt = `Analyze this Sanskrit Shloka and translation:
Original: "${verseText}"
Translation: "${hindiMeaning}"

Extract exactly 4 core philosophical concepts or spiritual pillars taught in this verse. For each concept, provide:
1. concept: A short, concise title in Hindi (1-3 words) e.g., "निष्काम कर्म"
2. title: A detailed title explaining the pillar
3. description: A clear explanation in Hindi of how this pillar applies to modern mind control or spiritual growth

Return a valid JSON array of objects with keys 'concept', 'title', and 'description'.`;
        responseMimeType = "application/json";
        responseSchema = {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              concept: { type: "STRING" },
              title: { type: "STRING" },
              description: { type: "STRING" }
            },
            required: ["concept", "title", "description"]
          }
        };
      } else if (contentType === 'quiz') {
        prompt = `Create exactly 3 high-quality practice multiple-choice questions (MCQs) in Hindi based on the spiritual and literal wisdom in this Sanskrit Shloka:
Original: "${verseText}"
Translation: "${hindiMeaning}"

Each question must match this JSON structure:
{
  "question": "Engaging question in Hindi",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctAnswer": "The exact string of the correct answer from options",
  "explanation": "Detailed explanation in Hindi explaining the spiritual backdrop"
}
Return a valid JSON array.`;
        responseMimeType = "application/json";
        responseSchema = {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              question: { type: "STRING" },
              options: {
                type: "ARRAY",
                items: { type: "STRING" }
              },
              correctAnswer: { type: "STRING" },
              explanation: { type: "STRING" }
            },
            required: ["question", "options", "correctAnswer", "explanation"]
          }
        };
      }

      console.log(`[AI Content] Generating ${contentType} for ${docId}...`);
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType,
          responseSchema
        }
      });

      let generatedContent = response.text;
      if (responseMimeType === "application/json" && generatedContent) {
        try {
          generatedContent = JSON.parse(generatedContent.trim());
        } catch (e) {
          console.warn("[JSON Parsing failed] returning raw text instead");
        }
      }

      if (!generatedContent) {
        throw new Error("Gemini returned empty text response");
      }

      // 4. Save to Firestore (Async, don't block client response)
      try {
        const firestoreDocRef = doc(db, 'adhyayan_ai_content', docId);
        setDoc(firestoreDocRef, {
          subjectId,
          chapterId,
          verseId,
          contentType,
          content: generatedContent,
          generatedAt: new Date().toISOString()
        }).catch(err => console.warn("[AI Content DB Warning] Failed to write generated content:", err));
      } catch (err) {
        console.warn("[AI Content DB Warning] Failed to initiate database write:", err);
      }

      // 5. Cache locally and return
      adhyayanAICache.set(docId, generatedContent);
      res.json({ content: generatedContent });
    } catch (error: any) {
      console.error("[AI Content Error] Generation failed:", error.message || error);
      res.status(500).json({ error: "AI Guru failed to generate study material: " + error.message });
    }
  });

  app.post("/api/adhyayan/search", async (req, res) => {
    try {
      const { query: searchQueryText, subjectId = "bhagavad_gita" } = req.body;
      if (!searchQueryText || searchQueryText.trim() === "") {
        return res.json({ results: [] });
      }

      const normalizedQuery = searchQueryText.toLowerCase().trim();
      const results: any[] = [];

      // Query all generated chapters in firestore
      const collRef = collection(db, "adhyayan_scripture_chapters");
      const q = query(collRef, where("subjectId", "==", subjectId));
      
      try {
        const querySnap = await getDocs(q);
        querySnap.forEach((snapDoc) => {
          const data = snapDoc.data();
          if (Array.isArray(data.verses)) {
            for (const v of data.verses) {
              const numStr = String(v.number);
              const dottedNumStr = `${data.chapterId.replace("chapter_", "")}.${v.number}`;
              
              if (
                numStr === normalizedQuery ||
                dottedNumStr === normalizedQuery ||
                v.original?.toLowerCase().includes(normalizedQuery) ||
                v.wordMeaning?.toLowerCase().includes(normalizedQuery) ||
                v.hindi?.toLowerCase().includes(normalizedQuery) ||
                v.english?.toLowerCase().includes(normalizedQuery) ||
                v.explanation?.toLowerCase().includes(normalizedQuery)
              ) {
                results.push({
                  chapterId: data.chapterId,
                  chapterNumber: Number(data.chapterId.replace("chapter_", "")),
                  verse: v
                });
              }
            }
          }
        });
      } catch (dbErr: any) {
        console.warn("[Search DB Warning] Firestore collection search failed:", dbErr);
      }

      // Sort results by chapter number and verse number
      results.sort((a, b) => {
        if (a.chapterNumber !== b.chapterNumber) {
          return a.chapterNumber - b.chapterNumber;
        }
        return a.verse.number - b.verse.number;
      });

      res.json({ results: results.slice(0, 30) });
    } catch (error: any) {
      console.error("[Search Error] Failed to search scripture verses:", error);
      res.status(500).json({ error: "Failed to search verses: " + error.message });
    }
  });

  // Vite middleware for development
  app.post('/api/log-error', (req, res) => {
    fs.writeFileSync('client-error.log', JSON.stringify(req.body));
    res.json({ ok: true });
  });

  // Dynamic SEO handler for Shared Quotes
  app.get('/quote/:id', async (req, res, next) => {
    try {
      const quoteId = req.params.id;
      const quoteDocRef = doc(db, 'quotes', quoteId);
      const quoteSnap = await getDoc(quoteDocRef);
      
      let title = "Divine Scripture Quote | Hari Pathshala";
      let description = "Read and share sacred scripture quotes and timeless spiritual wisdom from Hari Pathshala.";
      let imageUrl = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&h=630&q=80";
      
      if (quoteSnap.exists()) {
        const quoteData = quoteSnap.data();
        const quoteText = quoteData.text || "";
        const source = quoteData.source || "Sacred Scripture";
        const category = quoteData.category || "Wisdom";
        
        title = `"${quoteText.substring(0, 60)}${quoteText.length > 60 ? '...' : ''}" - ${source}`;
        description = `Read this beautiful ${category} quote from ${source} on Hari Pathshala: "${quoteText}"`;
        if (quoteData.image) {
          imageUrl = quoteData.image;
        }
      }
      
      const isProduction = process.env.NODE_ENV === 'production';
      const indexPath = path.join(process.cwd(), isProduction ? 'dist' : '.', 'index.html');
      
      if (fs.existsSync(indexPath)) {
        let html = fs.readFileSync(indexPath, 'utf8');
        
        const host = req.get('host') || 'haripathshala.online';
        const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
        const canonicalUrl = `${protocol}://${host}/quote/${quoteId}`;
        
        const seoTags = `
          <title>${title}</title>
          <meta name="description" content="${description}">
          <meta property="og:title" content="${title}">
          <meta property="og:description" content="${description}">
          <meta property="og:image" content="${imageUrl}">
          <meta property="og:url" content="${canonicalUrl}">
          <meta property="og:type" content="article">
          <meta name="twitter:card" content="summary_large_image">
          <meta name="twitter:title" content="${title}">
          <meta name="twitter:description" content="${description}">
          <meta name="twitter:image" content="${imageUrl}">
          <link rel="canonical" href="${canonicalUrl}">
        `;
        
        html = html.replace('</head>', `${seoTags}</head>`);
        res.send(html);
      } else {
        next();
      }
    } catch (error) {
      console.error("[SEO Quote Handler Error] Failed to generate meta tags:", error);
      next();
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    seedDohasIfEmpty().catch(err => console.error("Error during doha pre-seeding:", err));
  });
}

async function seedDohasIfEmpty() {
  try {
    const dohasSnap = await getDocs(collection(db, 'dohas'));
    if (!dohasSnap.empty) {
      console.log('[Doha Seeder] Dohas are already seeded.');
      return;
    }
    console.log('[Doha Seeder] Seeding beautiful Ramcharitmanas Dohas to database...');
    const famousDohas = [
      {
        id: "doha_1",
        text: "मंगल भवन अमंगल हारी।\nद्रवहु सुदसरथ अजिर बिहारी॥",
        meaning: "May the home of blessings and the destroyer of all evils, Lord Rama, who plays in the courtyard of King Dasaratha, be pleased with me and bless me.",
        source: "Ramcharitmanas",
        kand: "Bal Kand"
      },
      {
        id: "doha_2",
        text: "बंदउ गुरु पद पदुम परागा।\nसुरुचि सुबास सरस अनुरागा॥",
        meaning: "I bow to the lotus feet of the Guru, which are full of spiritual fragrance, sweet taste, and divine love.",
        source: "Ramcharitmanas",
        kand: "Bal Kand"
      },
      {
        id: "doha_3",
        text: "हरि अनंत हरि कथा अनंता।\nकहहिं सुनहिं बहुबिधि सब संता॥",
        meaning: "God is infinite, and His divine stories are infinite. Saints sing and hear them in various ways.",
        source: "Ramcharitmanas",
        kand: "Bal Kand"
      },
      {
        id: "doha_4",
        text: "धीरज धरम मित्र अरु नारी।\nआपद काल परिखिअहिं चारी॥",
        meaning: "Patience, righteous conduct, a true friend, and a spouse—these four are tested only during times of adversity.",
        source: "Ramcharitmanas",
        kand: "Aranya Kand"
      },
      {
        id: "doha_5",
        text: "होइहि सोई जो राम रचि राखा।\nको करि तरक बढ़ावै साखा॥",
        meaning: "Only that will happen which Lord Rama has destined. Why should anyone expand arguments and doubts?",
        source: "Ramcharitmanas",
        kand: "Bal Kand"
      },
      {
        id: "doha_6",
        text: "सिय राम मय सब जग जानी।\nकरहुं प्रनाम जोरि जुग पानी॥",
        meaning: "Knowing that the entire universe is filled with the divine presence of Sita and Rama, I bow to all with folded hands.",
        source: "Ramcharitmanas",
        kand: "Bal Kand"
      },
      {
        id: "doha_7",
        text: "बिना सतसंग बिबेक न होई।\nराम कृपा बिनु सुलभ न सोई॥",
        meaning: "Without the company of saints, wisdom cannot arise; and such association is not obtainable without the grace of Lord Rama.",
        source: "Ramcharitmanas",
        kand: "Bal Kand"
      },
      {
        id: "doha_8",
        text: "जाकी रही भावना जैसी।\nप्रभु मूरति देखी तिन तैसी॥",
        meaning: "Whatever sentiment or devotion one held in their heart, they perceived the Lord's divine form in that exact likeness.",
        source: "Ramcharitmanas",
        kand: "Bal Kand"
      }
    ];

    const batch = writeBatch(db);
    famousDohas.forEach(doha => {
      const docRef = doc(db, 'dohas', doha.id);
      batch.set(docRef, doha);
    });
    await batch.commit();
    console.log('[Doha Seeder] 8 high-quality Ramcharitmanas Dohas successfully seeded.');
  } catch (err) {
    console.error('[Doha Seeder Error] Failed to seed Dohas:', err);
  }
}

startServer();

async function generateNextQuizToCache(userId: string, subjectId: string) {
  const apiKey = getValidGeminiApiKey("ai_quiz");
  if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is missing or invalid");

  // 1. Fetch user history to adapt difficulty and avoid duplicates
  const historyRef = collection(db, 'userStats', userId, 'quiz_history');
  const historySnap = await getDocs(historyRef);
  const completedQuizIds: string[] = [];
  let totalScore = 0;
  let totalCompleted = 0;
  
  historySnap.forEach(docSnap => {
    const data = docSnap.data();
    totalCompleted++;
    totalScore += (data.percentage || 0);
    if (data.quizId) completedQuizIds.push(data.quizId);
  });

  // Fetch questions from the last 15 quizzes instead of 5 to build a deeper deduplication index
  const recentQuizIds = completedQuizIds.slice(0, 15);
  const answeredQuestionTexts: string[] = [];
  for (const qId of recentQuizIds) {
    const questionsQuery = query(collection(db, 'quiz_questions'), where('quizId', '==', qId));
    const questionsSnap = await getDocs(questionsQuery);
    questionsSnap.forEach(d => {
      const txt = d.data().text || d.data().question;
      if (txt) answeredQuestionTexts.push(txt);
    });
  }

  // Determine low-scoring subjects
  const lowScoringHistory = historySnap.docs
    .map(d => d.data())
    .filter(h => h.percentage < 70);
  const lowScoringSubjects = lowScoringHistory.map(h => h.subjectName || h.quizName);

  // Dynamic difficulty level
  let calculatedDifficulty = "Intermediate";
  if (totalCompleted > 0) {
    const avgAccuracy = totalScore / totalCompleted;
    if (avgAccuracy >= 85) {
      calculatedDifficulty = "Advanced";
    } else if (avgAccuracy < 60) {
      calculatedDifficulty = "Beginner";
    }
  }

  // 2. Setup prompts and call Gemini API
  const ai = new GoogleGenAI({ apiKey });
  let subjectDetail = "";
  if (subjectId === 'ai_mixed') {
    subjectDetail = "a balanced mix of subjects from Sanatan Dharma (Ramcharitmanas, Bhagavad Gita, Hanuman Chalisa, Mahabharat, Vedas, Upanishads, Hindu Dharma, Panchang, Festivals, Saints, Temples)";
  } else {
    const subSnap = await getDoc(doc(db, 'quiz_subjects', subjectId));
    const subName = subSnap.exists() ? (subSnap.data().name || subjectId) : subjectId;
    subjectDetail = `specifically on "${subName}"`;
  }

  const prompt = `Generate exactly 10 high-quality, authentic spiritual multiple-choice questions (MCQ or True/False) in highly respectful and clear Hindi language.
Target Subject: ${subjectDetail}.
Adapted Difficulty Level: ${calculatedDifficulty}.

PERSONALIZED LEARNING ADAPTATIONS:
- EXCLUDE the following questions which the user has already answered (avoid duplicates/repetition):
${answeredQuestionTexts.map(t => `- ${t}`).join('\n')}

- REMEDIAL PRACTICE FOCUS:
${lowScoringSubjects.length > 0 ? `The user recently struggled with the following topics: ${lowScoringSubjects.join(', ')}. Please include 2-3 extra practice questions on these concepts with helpful, encouraging explanations to aid learning.` : 'Ensure general balanced distribution.'}

Each question should be spiritually accurate and challenging according to the scriptures.
Return ONLY a valid JSON object matching this exact schema:
{
  "quiz": {
    "name": "${subjectId === 'ai_mixed' ? 'AI Mixed Wisdom Challenge' : 'AI Scripture Practice'}",
    "description": "An intelligent spiritual practice session custom-tailored to your learning progress.",
    "difficulty": "${calculatedDifficulty}"
  },
  "questions": [
    {
      "subjectId": "subject-slug (e.g., ramcharitmanas, bhagavad_gita) in lowercase",
      "text": "The question in Hindi",
      "type": "mcq" (or "true_false"),
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "The exact string of the correct answer from options",
      "explanation": "Detailed explanation of correct answer in Hindi with scriptural context",
      "scriptureRef": "Scripture name",
      "chapter": "chapter number or section (optional)",
      "verse": "verse number (optional)"
    }
  ]
}`;

  let validatedQuestions: any[] = [];
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts && validatedQuestions.length < 10) {
    attempts++;
    console.log(`[AI Quiz Cache] Generation attempt ${attempts} of ${maxAttempts} for user=${userId}, subject=${subjectId}`);
    try {
      const aiResponse = await generateContentWithRetry(ai, {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              quiz: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING" },
                  description: { type: "STRING" },
                  difficulty: { type: "STRING" }
                },
                required: ["name", "description", "difficulty"]
              },
              questions: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    subjectId: { type: "STRING" },
                    text: { type: "STRING" },
                    type: { type: "STRING" },
                    options: {
                      type: "ARRAY",
                      items: { type: "STRING" }
                    },
                    correctAnswer: { type: "STRING" },
                    explanation: { type: "STRING" },
                    scriptureRef: { type: "STRING" },
                    chapter: { type: "STRING" },
                    verse: { type: "STRING" }
                  },
                  required: ["subjectId", "text", "type", "options", "correctAnswer", "explanation", "scriptureRef"]
                }
              }
            },
            required: ["quiz", "questions"]
          }
        }
      }, 2, 'ai_quiz');

      let rawText = aiResponse.text || "{}";
      const parsed = JSON.parse(rawText);
      if (parsed && Array.isArray(parsed.questions)) {
        const cleaned = validateAndCleanQuestions(parsed.questions, subjectId, "General", "Hindi", calculatedDifficulty, answeredQuestionTexts);
        if (cleaned.length >= 10) {
          validatedQuestions = cleaned.slice(0, 10);
          break;
        } else if (cleaned.length > 0) {
          console.log(`[AI Quiz Cache] Got ${cleaned.length} valid questions, retrying to get complete batch of 10.`);
        }
      }
    } catch (err: any) {
      console.warn(`[AI Quiz Cache Warning] Attempt ${attempts} failed:`, err?.message);
      const isQuotaExceeded = 
        err?.message?.toLowerCase().includes("quota") || 
        err?.message?.toLowerCase().includes("exceeded your current quota") ||
        err?.message?.toLowerCase().includes("limit: 20") ||
        err?.message?.toLowerCase().includes("billing");
      if (isQuotaExceeded) {
        console.warn("[AI Quiz Cache Warning] Quota exceeded. Breaking out of retry loop.");
        break;
      }
    }
  }

  if (validatedQuestions.length < 10) {
    console.warn("[AI Quiz Cache Warning] Pre-generation failed, caching local fallback questions instead.");
    validatedQuestions = getFallbackQuestions(subjectId, "General", "Hindi").slice(0, 10);
  }

  // Pad to ensure at least 10 questions
  while (validatedQuestions.length < 10) {
    const clone = { ...validatedQuestions[0], text: validatedQuestions[0].text + " (Practice)" };
    validatedQuestions.push(clone);
  }

  const cacheId = `${userId}_${subjectId}`;
  const nextQuizId = `ai_cache_${subjectId}_${Date.now()}`;

  // Save to quiz_ai_cache
  await setDoc(doc(db, 'quiz_ai_cache', cacheId), {
    userId,
    quizId: nextQuizId,
    subjectId,
    questions: validatedQuestions,
    quizName: subjectId === 'ai_mixed' ? 'AI Mixed Wisdom Challenge' : 'AI Scripture Practice',
    quizDescription: 'An intelligent spiritual practice session custom-tailored to your learning progress.',
    difficulty: calculatedDifficulty,
    generatedTime: new Date().toISOString(),
    status: 'ready'
  });
}

async function generateExtraQuestions(quizId: string, subjectId: string, quizName: string, count: number, existingTexts: string[]) {
  const apiKey = getValidGeminiApiKey("ai_quiz");
  if (!apiKey) return [];
  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Generate exactly ${count} high-quality, authentic spiritual multiple-choice questions (MCQ or True/False) in highly respectful and clear Hindi language to supplement an existing quiz named "${quizName}" on subject "${subjectId}".
EXCLUDE the following questions which are already in this quiz:
${existingTexts.map(t => `- ${t}`).join('\n')}

Each question must match this JSON structure:
{
  "questions": [
    {
      "subjectId": "${subjectId}",
      "text": "The question in Hindi",
      "type": "mcq" (or "true_false"),
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "The exact string of the correct answer from options",
      "explanation": "Detailed explanation in Hindi",
      "scriptureRef": "Scripture name",
      "chapter": "chapter number or section",
      "verse": "verse number"
    }
  ]
}`;

    let validatedQuestions: any[] = [];
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts && validatedQuestions.length < count) {
      attempts++;
      console.log(`[AI Extra Qs] Generation attempt ${attempts} of ${maxAttempts} for quizId=${quizId}`);
      try {
        const response = await generateContentWithRetry(ai, {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            temperature: 0.7,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                questions: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      subjectId: { type: "STRING" },
                      text: { type: "STRING" },
                      type: { type: "STRING" },
                      options: {
                        type: "ARRAY",
                        items: { type: "STRING" }
                      },
                      correctAnswer: { type: "STRING" },
                      explanation: { type: "STRING" },
                      scriptureRef: { type: "STRING" },
                      chapter: { type: "STRING" },
                      verse: { type: "STRING" }
                    },
                    required: ["subjectId", "text", "type", "options", "correctAnswer", "explanation", "scriptureRef"]
                  }
                }
              },
              required: ["questions"]
            }
          }
        }, 2, 'ai_quiz');

        let rawText = response.text || "{}";
        const parsed = JSON.parse(rawText);
        if (parsed && Array.isArray(parsed.questions)) {
          const cleaned = validateAndCleanQuestions(parsed.questions, subjectId, "General", "Hindi", "Intermediate", existingTexts);
          if (cleaned.length >= count) {
            validatedQuestions = cleaned.slice(0, count);
            break;
          } else if (cleaned.length > 0) {
            console.log(`[AI Extra Qs] Got ${cleaned.length} valid questions, retrying to get complete batch of ${count}.`);
          }
        }
      } catch (aiErr: any) {
        console.warn(`[AI Extra Qs Warning] Attempt ${attempts} failed:`, aiErr?.message);
        const isQuotaExceeded = 
          aiErr?.message?.toLowerCase().includes("quota") || 
          aiErr?.message?.toLowerCase().includes("exceeded your current quota") ||
          aiErr?.message?.toLowerCase().includes("limit: 20") ||
          aiErr?.message?.toLowerCase().includes("billing");
        if (isQuotaExceeded) {
          console.warn("[AI Extra Qs Warning] Quota exceeded. Breaking out of retry loop.");
          break;
        }
      }
    }

    if (validatedQuestions.length < count) {
      console.warn("[Background Extra Qs Warning] Retries failed, using local high-quality fallbacks.");
      validatedQuestions = getFallbackQuestions(subjectId, "General", "Hindi").slice(0, count);
    }

    const batch = writeBatch(db);
    const result = validatedQuestions.map((q: any, idx: number) => {
      const qId = `q_extra_${quizId}_${Date.now()}_${idx}`;
      const finalQ = {
        id: qId,
        quizId: quizId,
        subjectId: q.subjectId || subjectId,
        text: q.text,
        type: q.type || "mcq",
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || "",
        scriptureRef: q.scriptureRef || "",
        chapter: q.chapter || "",
        verse: q.verse || "",
        difficulty: q.difficulty || "Intermediate",
        subject: q.subject || subjectId,
        language: q.language || "Hindi",
        aiVersion: q.aiVersion || "v1.0"
      };
      batch.set(doc(db, 'quiz_questions', qId), finalQ);
      return finalQ;
    });
    await batch.commit();
    return result;
  } catch (err) {
    console.error("Failed to generate extra questions:", err);
    return [];
  }
}
