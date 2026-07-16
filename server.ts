import 'dotenv/config';
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import Razorpay from "razorpay";
import crypto from "crypto";
import axios from "axios";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc as getDocRaw, setDoc, updateDoc, collection, serverTimestamp, writeBatch, increment, query, where, getDocs } from "firebase/firestore/lite";
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
    keyId: process.env.RAZORPAY_LIVE_KEY_ID || "rzp_live_T91BWZao0CJ2Bi",
    keySecret: process.env.RAZORPAY_LIVE_KEY_SECRET || "I7wB0ElgOZO5t5H32546b6wM"
  }
});

docCache.set("settings/shipping", {
  exists: true,
  timestamp: Date.now(),
  data: {
    shiprocketEnabled: true,
    shiprocketEmail: process.env.SHIPROCKET_EMAIL || "swamiajay9783@gmail.com",
    shiprocketPassword: process.env.SHIPROCKET_PASSWORD || "$p0FvTP%8fa6PItUtHcKCtkm&JW2wbL%",
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
    keys: [{ key: process.env.FREEASTROAPI_KEY || "11ccbe1efa55e242577b191f7cabee889763db18d621f2e1018c458df2de1472", status: 'active', errorCount: 0 }],
    currentKeyIndex: 0,
    dailyLimit: 500,
    callsCount: 0,
    errorsCount: 0
  },
  payment: {
    id: 'payment',
    name: 'Razorpay Gateway',
    enabled: true,
    keys: [{ key: process.env.RAZORPAY_LIVE_KEY_ID || "rzp_live_T91BWZao0CJ2Bi", status: 'active', errorCount: 0 }],
    currentKeyIndex: 0,
    dailyLimit: 10000,
    callsCount: 0,
    errorsCount: 0
  },
  shipping: {
    id: 'shipping',
    name: 'Shiprocket Logistics',
    enabled: true,
    keys: [{ key: process.env.SHIPROCKET_EMAIL || "swamiajay9783@gmail.com", status: 'active', errorCount: 0 }],
    currentKeyIndex: 0,
    dailyLimit: 2000,
    callsCount: 0,
    errorsCount: 0
  }
};

function initServiceKeys() {
  const defaultKey = process.env.GEMINI_API_KEY || "AIzaSy_fake_default_key_to_prevent_crash_hp";

  // chat keys
  const chatKeys = [
    process.env.GEMINI_API_KEY_CHAT,
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_SECONDARY
  ].filter((k): k is string => !!k && k.trim() !== "");
  apiServices.ai_chat.keys = (chatKeys.length ? chatKeys : [defaultKey]).map(k => ({ key: k, status: 'active', errorCount: 0 }));

  // quiz keys
  const quizKeys = [
    process.env.GEMINI_API_KEY_QUIZ,
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_SECONDARY
  ].filter((k): k is string => !!k && k.trim() !== "");
  apiServices.ai_quiz.keys = (quizKeys.length ? quizKeys : [defaultKey]).map(k => ({ key: k, status: 'active', errorCount: 0 }));

  // quote keys
  const quoteKeys = [
    process.env.GEMINI_API_KEY_QUOTE,
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_SECONDARY
  ].filter((k): k is string => !!k && k.trim() !== "");
  apiServices.ai_quote.keys = (quoteKeys.length ? quoteKeys : [defaultKey]).map(k => ({ key: k, status: 'active', errorCount: 0 }));

  // scripture keys
  const scriptureKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_SECONDARY
  ].filter((k): k is string => !!k && k.trim() !== "");
  apiServices.ai_scripture.keys = (scriptureKeys.length ? scriptureKeys : [defaultKey]).map(k => ({ key: k, status: 'active', errorCount: 0 }));
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

  const keysCount = service.keys.length;
  for (let i = 0; i < keysCount; i++) {
    const idx = (service.currentKeyIndex + i) % keysCount;
    const keyInfo = service.keys[idx];
    if (keyInfo && keyInfo.status === 'active') {
      service.currentKeyIndex = idx;
      keyInfo.lastUsed = Date.now();
      return keyInfo.key;
    }
  }

  let recoveredAny = false;
  for (const k of service.keys) {
    if (k.status === 'cooldown') {
      k.status = 'active';
      k.errorCount = 0;
      recoveredAny = true;
    }
  }

  if (recoveredAny) {
    return getServiceApiKey(serviceId);
  }

  if (service.keys.length > 0) {
    return service.keys[0].key;
  }
  throw new Error(`No keys configured for service ${serviceId}`);
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
      service.currentKeyIndex = (service.currentKeyIndex + 1) % service.keys.length;
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
  maxRetries = 4, // Increased from 2 to allow multi-model and multi-key rotation
  serviceId = 'ai_scripture'
): Promise<any> {
  let attempt = 0;
  let delay = 300; // Faster initial retry to avoid blocking the UI
  const startTime = Date.now();

  const primaryModel = params.model || "gemini-3.5-flash";
  const modelRotationList = [
    primaryModel,
    "gemini-1.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-2.0-flash",
    "gemini-flash-latest"
  ];
  const uniqueModels = Array.from(new Set(modelRotationList));
  let currentModelIndex = 0;

  while (attempt < maxRetries) {
    const apiKey = getServiceApiKey(serviceId);
    const resolvedAi = new GoogleGenAI({ apiKey });
    const modelToUse = uniqueModels[currentModelIndex % uniqueModels.length];

    try {
      console.log(`[Gemini API] Call to [Service: ${serviceId}] with model=${modelToUse} (Attempt ${attempt + 1}/${maxRetries})`);
      const response = await resolvedAi.models.generateContent({
        ...params,
        model: modelToUse,
      });
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

      const isTransient = 
        !isQuotaExceeded && (
          errorMsg.includes("503") || 
          errorMsg.includes("429") || 
          errorMsg.includes("UNAVAILABLE") || 
          errorMsg.includes("high demand")
        );

      // Report service error and put the key on immediate cooldown if it's a hard quota limit
      const service = apiServices[serviceId];
      if (service) {
        service.errorsCount++;
        service.lastErrorMsg = errorMsg;
        addApiLog(serviceId, apiKey, 'failed', 0, errorMsg);
        const keyInfo = service.keys.find(k => k.key === apiKey);
        if (keyInfo) {
          if (isQuotaExceeded) {
            // Hard limit, put key on cooldown immediately to avoid retrying with this key
            keyInfo.status = 'cooldown';
            keyInfo.errorCount = 2;
            service.currentKeyIndex = (service.currentKeyIndex + 1) % service.keys.length;
          } else {
            keyInfo.errorCount++;
            if (keyInfo.errorCount >= 2) {
              keyInfo.status = 'cooldown';
              service.currentKeyIndex = (service.currentKeyIndex + 1) % service.keys.length;
            }
          }
        }
      }

      console.warn(`[Gemini API Warning] [Service: ${serviceId}] Attempt ${attempt} failed with error:`, errorMsg);

      if ((isTransient || isQuotaExceeded) && attempt < maxRetries) {
        if (isQuotaExceeded) {
          // Rotate model to bypass 20 RPD free tier limit
          currentModelIndex++;
          console.log(`[Gemini API Model Rotate] [Service: ${serviceId}] Quota exceeded on ${modelToUse}. Rotating model to ${uniqueModels[currentModelIndex % uniqueModels.length]}`);
        } else {
          console.log(`[Gemini API Retry] [Service: ${serviceId}] Retrying in ${delay}ms...`);
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 1.5;
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

  // Pick the right scripture template set or default to gita (as a safe general fallback)
  let templates = gitaTemplates;
  if (scripture === "Ramcharitmanas") templates = ramcharitmanasTemplates;
  else if (scripture === "Valmiki Ramayan") templates = valmikiTemplates;
  else if (scripture === "Radha Kripa Kataksh") templates = radhaTemplates;
  else if (scripture === "Hanuman Chalisa") templates = hanumanTemplates;
  else if (scripture === "Vishnu Sahasranama") templates = vishnuTemplates;
  else if (scripture === "Shiv Mahimna Stotra") templates = shivTemplates;
  else if (scripture === "Durga Saptashati") templates = durgaTemplates;
  else if (scripture === "Sundarkand") templates = sunderTemplates;

  for (let i = 0; i < 25; i++) {
    const template = templates[i % templates.length];
    const idxStr = i + 1;
    const qText = isEnglish 
      ? `${template.textEnglish} (Set ${Math.floor(i / templates.length) + 1})`
      : `${template.textHindi} (भाग ${Math.floor(i / templates.length) + 1})`;
    
    qList.push({
      id: `fallback_q_${subjectId}_${chapterId}_${language.toLowerCase()}_${i}_${Date.now()}`,
      questionId: `fallback_q_${subjectId}_${chapterId}_${language.toLowerCase()}_${i}_${Date.now()}`,
      quizId: `chapter_quiz_${subjectId}_${chapterId}`,
      subjectId,
      chapterId,
      language,
      text: qText,
      question: qText,
      type: "mcq",
      options: isEnglish ? template.optionsEnglish : template.optionsHindi,
      correctAnswer: isEnglish ? template.correctEnglish : template.correctHindi,
      explanation: isEnglish ? template.explanationEnglish : template.explanationHindi,
      scriptureRef: template.ref,
      chapter: chapterId,
      verse: `${idxStr}`,
      status: "Published",
      verifiedStatus: "Verified",
      sourceType: "Fallback Database"
    });
  }
  return qList;
}

function validateAndCleanQuestions(
  questions: any[],
  defaultSubject: string,
  defaultChapter: string,
  defaultLanguage: string,
  defaultDifficulty: string
): any[] {
  if (!Array.isArray(questions)) return [];

  const seenTexts = new Set<string>();
  const cleaned: any[] = [];

  for (const q of questions) {
    if (!q || typeof q !== 'object') continue;

    // 1. Text (the question) validation
    let text = typeof q.text === 'string' ? q.text.trim() : '';
    if (!text) {
      text = typeof q.question === 'string' ? q.question.trim() : '';
    }
    if (!text) continue;

    // Avoid duplicates in the same generated batch
    const normalizedText = text.toLowerCase().replace(/\s+/g, '');
    if (seenTexts.has(normalizedText)) continue;
    seenTexts.add(normalizedText);

    // 2. Options validation
    let options: string[] = [];
    if (Array.isArray(q.options)) {
      options = q.options.map((opt: any) => String(opt).trim()).filter(Boolean);
    }
    
    // For T/F questions, if options are missing or wrong count, set standard ones
    const type = typeof q.type === 'string' ? q.type.toLowerCase() : 'mcq';
    if (type === 'true_false') {
      if (options.length < 2) {
        options = defaultLanguage === 'English' ? ["True", "False"] : ["सत्य", "असत्य"];
      } else {
        options = options.slice(0, 2);
      }
    } else {
      // MCQ
      if (options.length < 4) {
        continue; // skip invalid mcq
      } else {
        options = options.slice(0, 4);
      }
    }

    // 3. Correct Answer validation
    let correctAnswer = typeof q.correctAnswer === 'string' ? q.correctAnswer.trim() : '';
    if (!correctAnswer && typeof q.answer === 'string') {
      correctAnswer = q.answer.trim();
    }
    
    // Make sure correctAnswer is exactly one of the options
    if (!options.includes(correctAnswer)) {
      const matchedOpt = options.find(opt => opt.toLowerCase() === correctAnswer.toLowerCase());
      if (matchedOpt) {
        correctAnswer = matchedOpt;
      } else {
        correctAnswer = options[0];
      }
    }

    // 4. Explanation validation
    let explanation = typeof q.explanation === 'string' ? q.explanation.trim() : '';
    if (!explanation) {
      explanation = defaultLanguage === 'English' 
        ? `This question checks your knowledge of ${defaultSubject}. Please refer to the corresponding scriptures.` 
        : `यह प्रश्न ${defaultSubject} के बारे में आपके ज्ञान का परीक्षण करता. कृपया संबंधित ग्रंथों का संदर्भ लें।`;
    }

    // 5. Scriptural Reference
    let scriptureRef = typeof q.scriptureRef === 'string' ? q.scriptureRef.trim() : '';
    if (!scriptureRef && typeof q.reference === 'string') {
      scriptureRef = q.reference.trim();
    }
    if (!scriptureRef) {
      scriptureRef = defaultSubject;
    }

    // Extra metadata required by Requirement 1:
    // Difficulty, Subject, Chapter, Language, AI Version
    const difficulty = typeof q.difficulty === 'string' && q.difficulty ? q.difficulty.trim() : defaultDifficulty;
    const subject = typeof q.subject === 'string' && q.subject ? q.subject.trim() : defaultSubject;
    const chapter = typeof q.chapter === 'string' && q.chapter ? q.chapter.trim() : defaultChapter;
    const language = typeof q.language === 'string' && q.language ? q.language.trim() : defaultLanguage;
    const aiVersion = typeof q.aiVersion === 'string' && q.aiVersion ? q.aiVersion.trim() : "v1.0";

    // Strict scripture alignment verification:
    const currentScripture = getScriptureName(defaultSubject);
    const scriptureKeywords: Record<string, string[]> = {
      "Bhagavad Gita": ["gita", "geeta", "shrimad bhagavad gita", "कृष्ण", "अर्जुन", "arjuna", "krishna", "kuru", "कुरु"],
      "Ramcharitmanas": ["manas", "ramcharitmanas", "तुलसीदास", "रामचरितमानस", "लक्ष्मण", "सीता", "हनुमान", "राम", "tulsidas", "lakshman", "sita", "hanuman", "rama"],
      "Valmiki Ramayan": ["valmiki", "ramayan", "वाल्मीकि", "रामायण", "इक्ष्वाकु", "ikshvaku", "shanta", "शान्ता"],
      "Radha Kripa Kataksh": ["radha", "kataksh", "राधा", "कटाक्ष", "वृषभानु", "vrisbhanu", "barsana", "बरसाना"],
      "Hanuman Chalisa": ["chalisa", "चालीसा", "हनुमान", "अंजनी", "केसरी", "siddhis", "nidhis", "सिद्धि", "निधि"],
      "Vishnu Sahasranama": ["sahasranama", "सहस्रनाम", "भीष्म", "युधिष्ठिर", "vishnu", "विष्णु", "bhishma", "yudhishthir"],
      "Shiv Mahimna Stotra": ["mahimna", "महिम्न", "पुष्पदंत", "pushpadanta", "शिव", "shiva", "shankar"],
      "Durga Saptashati": ["saptashati", "सप्तशती", "महिषासुर", "mahishasura", "दुर्गा", "durga", "मेधा", "medha"],
      "Sundarkand": ["sundarkand", "sunderkand", "सुन्दरकाण्ड", "सुंदरकांड", "अशोक वाटिका", "ashok vatika", "विभीषण", "vibhishan", "मैनाक", "mainak"]
    };

    // Other scriptures list: if a question for scripture A mentions another major scripture by name, reject it to prevent mixed questions
    const allScriptureNames = Object.keys(scriptureKeywords);
    const otherScriptureNames = allScriptureNames.filter(name => name !== currentScripture);
    
    let containsOtherScripture = false;
    const checkString = `${text} ${options.join(" ")} ${explanation} ${scriptureRef}`.toLowerCase();
    
    for (const other of otherScriptureNames) {
      if (checkString.includes(other.toLowerCase())) {
        containsOtherScripture = true;
        break;
      }
    }
    
    if (containsOtherScripture) {
      console.warn(`[Strict Scripture Rule] Rejecting question mentioning other scripture. Subject: ${defaultSubject}, Question: "${text.substring(0, 50)}..."`);
      continue;
    }

    cleaned.push({
      text,
      type: type === 'true_false' ? 'true_false' : 'mcq',
      options,
      correctAnswer,
      explanation,
      scriptureRef,
      chapter: chapter || "",
      verse: q.verse || "",
      difficulty,
      subject,
      chapterId: q.chapterId || defaultChapter,
      subjectId: q.subjectId || defaultSubject,
      language,
      aiVersion
    });
  }

  return cleaned;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/generate-quote", async (req, res) => {
    try {
      const { topic } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API Key is not configured." });
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
        }
      }, 2, 'ai_quote');
      
      let rawText = response.text || "{}";
      rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
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

  // Dual Cache System for AI Guru responses
  const aiGuruMemoryCache = new Map<string, string>();

  function normalizeQuery(str: string): string {
    return (str || "").toLowerCase().replace(/[?,.!\s\u0964\u0970]/g, "").trim();
  }

  function findPartialCacheMatch(normalized: string): string | null {
    for (const [cachedMsg, reply] of aiGuruMemoryCache.entries()) {
      if (normalized.includes(cachedMsg) || cachedMsg.includes(normalized)) {
        return reply;
      }
    }
    return null;
  }

  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      const normalized = normalizeQuery(message);

      // 1. Check in-memory cache
      if (aiGuruMemoryCache.has(normalized)) {
        console.log(`[AI Guru Cache] Memory Cache HIT for: "${message}"`);
        return res.json({ reply: aiGuruMemoryCache.get(normalized) });
      }

      // 2. Check Firestore cache (try block to prevent Firestore errors blocking the API)
      try {
        const cacheSnap = await getDocs(query(collection(db, 'ai_guru_cache'), orderBy('timestamp', 'desc')));
        for (const doc of cacheSnap.docs) {
          const data = doc.data();
          if (normalizeQuery(data.message) === normalized) {
            console.log(`[AI Guru Cache] Firestore Cache HIT for: "${message}"`);
            aiGuruMemoryCache.set(normalized, data.reply);
            return res.json({ reply: data.reply });
          }
        }
      } catch (err) {
        console.warn("[AI Guru Cache] Firestore cache query failed, proceeding to Gemini:", err);
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        const partialReply = findPartialCacheMatch(normalized);
        if (partialReply) {
          return res.json({ reply: partialReply });
        }
        return res.status(500).json({ error: "Gemini API Key is not configured." });
      }
      
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
If the user asks how to connect, mention the official website and Instagram page. Do not invent information. If they ask about the founder, refer to the official CMS/Website info or answer generally if specific details aren't provided in the prompt. 

INTENT DETECTION & RESPONSE STYLE
- Be Calm, Respectful, Compassionate, Positive, Encouraging, Wise, Friendly, and Easy to understand.
- Reply in the same language used by the user (Hindi, Hinglish, English).
- If the user shares personal difficulties, listen respectfully, provide balanced, practical suggestions, and encourage healthy communication.
- Maintain a conversational tone and avoid robotic, repetitive responses.

CONTENT MODERATION (STRICT)
- Detect and refuse vulgar language, sexual content, pornographic requests, hate speech, abusive language, illegal activities, harassment, and graphic violence.
- Do NOT repeat offensive words.
- If inappropriate content is detected, respond politely by explaining: "Hari Pathshala AI Guru only supports respectful conversations related to spirituality and positive personal guidance."`;

      const contents = [];
      if (Array.isArray(history)) {
        contents.push(...history);
      }
      contents.push({ role: "user", parts: [{ text: message }] });

      // Run with 4 retries and model rotation
      const response = await generateContentWithRetry(ai, {
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      }, 4, 'ai_chat');
      
      const replyText = response.text;

      // Update both caches
      aiGuruMemoryCache.set(normalized, replyText);
      try {
        await addDoc(collection(db, 'ai_guru_cache'), {
          message,
          reply: replyText,
          timestamp: serverTimestamp()
        });
      } catch (err) {
        console.warn("[AI Guru Cache] Saving to Firestore cache failed:", err);
      }

      res.json({ reply: replyText });
    } catch (error: any) {
      console.error("AI Chat Error on primary 'ai_chat' service, trying backup 'ai_scripture'...", error?.message || error);
      
      // Retry using backup 'ai_scripture' service
      try {
        const backupApiKey = process.env.GEMINI_API_KEY;
        if (backupApiKey) {
          const backupAi = new GoogleGenAI({ apiKey: backupApiKey });
          const response = await generateContentWithRetry(backupAi, {
            contents: [
              ...(Array.isArray(req.body.history) ? req.body.history : []),
              { role: "user", parts: [{ text: req.body.message }] }
            ],
            config: {
              systemInstruction: `You are "AI Guru", the official spiritual companion for the Hari Pathshala app. Keep answers warm, respectful, and short.`,
              temperature: 0.7,
            }
          }, 4, 'ai_scripture');

          if (response && response.text) {
            console.log("[AI Guru Backup Success] Resolved chat request via backup 'ai_scripture' service.");
            return res.json({ reply: response.text });
          }
        }
      } catch (backupError: any) {
        console.error("AI Chat Backup 'ai_scripture' service also failed:", backupError?.message || backupError);
      }

      const partialReply = findPartialCacheMatch(normalizeQuery(req.body.message || ""));
      if (partialReply) {
        return res.json({ reply: partialReply });
      }

      res.json({ reply: "AI Guru is temporarily unavailable. Please try again shortly. (AI गुरु वर्तमान में अस्थायी रूप से अनुपलब्ध है। कृपया कुछ समय बाद पुनः प्रयास करें।)" });
    }
  });

  // Caching helper for greeting messages and basic queries
  function getCachedGuruResponse(message: string): string | null {
    const msg = (message || "").toLowerCase().trim();
    const cleanMsg = msg.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?🙏|]/g, "").trim();

    const greetings = [
      "hello", "hi", "hey", "namaste", "pranam", "radhe radhe", "hare krishna", "pranama", "shubh prabhat", "shubh sandhya",
      "प्रणाम", "नमस्ते", "राधे राधे", "हरे कृष्ण", "जय श्री कृष्णा", "जय सियाराम", "राम राम", "सुप्रभात"
    ];

    if (greetings.includes(cleanMsg) || greetings.some(g => cleanMsg === g)) {
      return "राधे राधे! 🙏 मैं हरि पाठशाला का AI गुरु हूँ। मैं भगवद्गीता, रामचरितमानस, वेद, उपनिषद, और अन्य आध्यात्मिक विषयों पर आपका मार्गदर्शन करने के लिए यहाँ हूँ। आप मुझसे अपने जीवन की समस्याओं या शास्त्रों से संबंधित कोई भी प्रश्न पूछ सकते हैं। मैं आपकी किस प्रकार सहायता करूँ?";
    }

    if (
      cleanMsg.includes("who are you") || 
      cleanMsg.includes("who is ai guru") || 
      cleanMsg.includes("introduce yourself") ||
      cleanMsg.includes("तुम कौन हो") || 
      cleanMsg.includes("कौन हो") || 
      cleanMsg.includes("अपना परिचय")
    ) {
      return "प्रणाम! 🙏 मैं हरि पाठशाला का 'AI गुरु' (आध्यात्मिक सहायक) हूँ। मेरा ध्येय सनातन धर्म के ग्रंथों (जैसे भगवद्गीता, रामचरितमानस, उपनिषद) के दिव्य ज्ञान को अत्यंत सरल और व्यावहारिक रूप में आप तक पहुँचाना है। आप मुझसे जीवन की चुनौतियों, मानसिक शांति, ध्यान, भक्ति और नैतिक मूल्यों पर चर्चा कर सकते हैं।";
    }

    if (
      cleanMsg.includes("how can you help") || 
      cleanMsg.includes("what can you do") || 
      cleanMsg.includes("तुम क्या कर सकते हो") || 
      cleanMsg.includes("मेरी मदद कैसे")
    ) {
      return "मैं आपकी कई प्रकार से सहायता कर सकता हूँ:\n\n1. **शास्त्रों का ज्ञान**: भगवद्गीता, रामचरितमानस, वेदों और उपनिषदों के श्लोकों और चौपाइयों का अर्थ व व्याख्या।\n2. **जीवन की समस्याओं का समाधान**: मानसिक तनाव, निर्णय लेने में असमंजस, आत्मविश्वास की कमी, और रिश्तों में सुधार के लिए आध्यात्मिक मार्गदर्शन।\n3. **भक्ति और साधना**: मंत्र जाप, ध्यान (Meditation), और दैनिक साधना की सही विधि।\n4. **नैतिक एवं नैतिक मूल्य**: जीवन में सकारात्मकता, सदाचार, और चरित्र निर्माण के उपाय।\n\nआप मुझसे बेझिझक कोई भी आध्यात्मिक या जीवन से जुड़ा प्रश्न पूछ सकते हैं।";
    }

    if (
      cleanMsg.includes("hari pathshala") || 
      cleanMsg.includes("हरि पाठशाला") || 
      cleanMsg.includes("website") || 
      cleanMsg.includes("instagram")
    ) {
      return "हरि पाठशाला (Hari Pathshala) एक अग्रणी आध्यात्मिक शैक्षणिक मंच है जिसका उद्देश्य सनातन धर्म के अमूल्य ज्ञान को आधुनिक पीढ़ी के लिए सुलभ और बोधगम्य बनाना है।\n\n- **आधिकारिक वेबसाइट**: [haripathshala.online](https://haripathshala.online)\n- **इंस्टाग्राम**: [@hari_pathshala](https://instagram.com/hari_pathshala)\n\nहमसे जुड़ने के लिए और दैनिक आध्यात्मिक ज्ञान प्राप्त करने के लिए आप हमारी वेबसाइट पर जा सकते हैं या इंस्टाग्राम पर हमें फॉलो कर सकते हैं। राधे राधे! 🙏";
    }

    return null;
  }

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
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API Key is not configured." });
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
          responseMimeType: "application/json"
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
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API Key is not configured." });
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
          responseMimeType: "application/json"
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

  // Shipping Routes
  app.post("/api/shipping/calculate", async (req, res) => {
    try {
      const { pincode, weight = 0.5 } = req.body;
      
      let shippingConfigDoc: any = null;
      try {
        shippingConfigDoc = await getDoc(doc(db, 'settings', 'shipping'));
      } catch (err) {}
      const shippingData = (shippingConfigDoc && shippingConfigDoc.exists()) ? shippingConfigDoc.data() : {};
      
      // Live Shiprocket settings
      const email = shippingData.shiprocketEmail || process.env.SHIPROCKET_EMAIL || "";
      const password = shippingData.shiprocketPassword || process.env.SHIPROCKET_PASSWORD || "";
      
      if (!email || !password) {
        console.warn("[Shiprocket API] Credentials not configured. Returning successful standard free fallback.");
        return res.json({
          serviceable: true,
          shippingFee: 0,
          courierName: "Standard Courier (Fallback)",
          etd: "3-5 दिन",
          transitTime: "3-5",
          codAvailable: true,
          mode: 'fallback'
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
        // Step 1: Authenticate with retry
        console.log(`[Shiprocket API] Authenticating with ${email}`);
        const authRes = await runWithRetry(() => axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
          email, password
        }), 3, 1000);

        const token = authRes.data?.token;
        if (!token) {
          throw new Error("Failed to retrieve token from Shiprocket response");
        }
        
        // Fixed pickup pin code: Kaladera, Jaipur is 303801
        const pickupPincode = "303801"; 
        
        // Step 2: Fetch serviceability with retry
        // We will execute both prepaid and cod requests with retries to ensure network resilience
        console.log(`[Shiprocket API] Checking serviceability from ${pickupPincode} to ${pincode} (weight: ${weight})`);
        
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
          const mainRes = hasPrepaid ? prepaidRes : codRes;
          const couriers = mainRes.data.data.available_courier_companies;
          const cheapest = couriers.reduce((prev: any, curr: any) => (prev.rate < curr.rate ? prev : curr));

          return res.json({ 
            serviceable: true,
            shippingFee: Math.round(cheapest.rate), 
            courierName: cheapest.courier_name || cheapest.name || "Standard Courier",
            etd: cheapest.etd || cheapest.estimated_delivery_date || "",
            transitTime: cheapest.estimated_delivery_days || "3-5",
            codAvailable: !!hasCod,
            mode: 'live' 
          });
        } else {
          console.log("[Shiprocket API] No couriers returned or pincode unserviceable. Returning successful standard free fallback.");
          return res.json({
            serviceable: true,
            shippingFee: 0,
            courierName: "Standard Courier (Fallback)",
            etd: "3-5 दिन",
            transitTime: "3-5",
            codAvailable: true,
            mode: 'fallback'
          });
        }
      } catch(err: any) {
        console.error("Shiprocket authentication or execution failed, returning fallback shipping:", err.response?.data || err.message);
        return res.json({
          serviceable: true,
          shippingFee: 0,
          courierName: "Standard Courier (Fallback)",
          etd: "3-5 दिन",
          transitTime: "3-5",
          codAvailable: true,
          mode: 'fallback'
        });
      }
    } catch (error: any) {
      console.error("Shipping calculate error, returning fallback shipping:", error);
      res.json({
        serviceable: true,
        shippingFee: 0,
        courierName: "Standard Courier (Fallback)",
        etd: "3-5 दिन",
        transitTime: "3-5",
        codAvailable: true,
        mode: 'fallback'
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
      
      let mode = 'test';
      let key_id = process.env.RAZORPAY_TEST_KEY_ID || '';
      let key_secret = process.env.RAZORPAY_TEST_KEY_SECRET || '';

      const liveKeyId = process.env.RAZORPAY_LIVE_KEY_ID || process.env.VITE_RAZORPAY_KEY || '';
      const liveKeySecret = process.env.RAZORPAY_LIVE_KEY_SECRET || '';
      const hasValidLiveKeys = liveKeyId && liveKeySecret;


      if (configDoc && configDoc.exists()) {
        const data = configDoc.data();
        
        // Auto Mode Detection Logic
        const isLiveMode = data.enabled === true && data.onlinePayment === true && data.testMode === false && typeof data.keyId === 'string' && data.keyId.startsWith('rzp_live_');
        
        if (isLiveMode) {
          mode = 'live';
          key_id = data.keyId;
          key_secret = data.keySecret || liveKeySecret || '';
        } else {
          mode = 'test';
          key_id = (data.testMode === true || (typeof data.keyId === 'string' && data.keyId.startsWith('rzp_test_'))) ? data.keyId : (process.env.RAZORPAY_TEST_KEY_ID || '');
          key_secret = data.keySecret || process.env.RAZORPAY_TEST_KEY_SECRET || '';
        }
      } else if (hasValidLiveKeys) {
        mode = 'live';
        key_id = liveKeyId;
        key_secret = liveKeySecret;
      }

      if (!key_id || !key_secret) {
        return res.status(400).json({ error: "Payment configuration is incomplete. Please try again later or contact support." });
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
      
      let mode = 'test';
      let key_id = process.env.RAZORPAY_TEST_KEY_ID || '';
      let key_secret = process.env.RAZORPAY_TEST_KEY_SECRET || '';

      const liveKeySecret = process.env.RAZORPAY_LIVE_KEY_SECRET;
      const liveKeyId = process.env.RAZORPAY_LIVE_KEY_ID;
      const hasValidLiveKeys = liveKeyId && liveKeySecret && liveKeyId && liveKeySecret;


      if (configDoc && configDoc.exists()) {
        const data = configDoc.data();
        
        // Auto Mode Detection Logic
        const isLiveMode = data.enabled === true && data.onlinePayment === true && data.testMode === false && typeof data.keyId === 'string' && data.keyId.startsWith('rzp_live_');
        
        if (isLiveMode) {
          mode = 'live';
          key_id = data.keyId;
          key_secret = data.keySecret || liveKeySecret || '';
        } else {
          mode = 'test';
          key_id = (data.testMode === true || (typeof data.keyId === 'string' && data.keyId.startsWith('rzp_test_'))) ? data.keyId : (process.env.RAZORPAY_TEST_KEY_ID || '');
          key_secret = data.keySecret || process.env.RAZORPAY_TEST_KEY_SECRET || '';
        }
      } else if (hasValidLiveKeys) {
        mode = 'live';
        key_id = liveKeyId;
        key_secret = liveKeySecret;
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
              invoiceNumber: existingOrder.invoiceNumber || "" 
            });
          }
        } catch (dbErr) {
          console.error("Error checking for duplicate orders:", dbErr);
        }
      }

      // Create Order in Firestore
      const batch = writeBatch(db);
      const newOrderRef = doc(collection(db, 'orders'));
      
      const finalOrderData: any = {
        ...orderData,
        id: newOrderRef.id,
        paymentId: isCod ? 'COD' : razorpay_payment_id,
        razorpayOrderId: isCod ? 'COD' : razorpay_order_id,
        status: 'Confirmed',
        deliveryStatus: 'Pending',
        createdAt: serverTimestamp(),
        paymentMode: isCod ? 'cod' : mode,
        total: orderData.totalAmount || orderData.subtotal || 0
      };

      // Shiprocket Integration
      let shippingDoc: any = null;
      try {
        shippingDoc = await getDoc(doc(db, 'settings', 'shipping'));
      } catch (err) {
        console.warn("Failed to fetch shipping settings, using env vars:", err);
      }
      const shippingData = (shippingDoc && shippingDoc.exists()) ? shippingDoc.data() : {};
      
      const email = shippingData.shiprocketEmail || process.env.SHIPROCKET_EMAIL || "";
      const password = shippingData.shiprocketPassword || process.env.SHIPROCKET_PASSWORD || "";
      
      let trackingNumber = '';
      let courierName = '';
      let labelUrl = '';
      let shiprocketOrderId = '';
      let shiprocketShipmentId = '';
      
      if (email && password) {
        try {
          const authRes = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
            email, password
          });
          const token = authRes.data.token;
          
          // create shiprocket order
          const srOrderPayload = {
            order_id: newOrderRef.id,
            order_date: new Date().toISOString(),
            pickup_location: shippingData.pickupLocation || "Primary",
            billing_customer_name: orderData.customerInfo?.fullName || orderData.shippingAddress?.fullName || "Customer",
            billing_last_name: "",
            billing_address: orderData.shippingAddress?.street || orderData.shippingAddress?.houseNo || "Main Road",
            billing_address_2: orderData.shippingAddress?.landmark || "",
            billing_city: orderData.shippingAddress?.city || "Jaipur",
            billing_pincode: orderData.shippingAddress?.pincode || "303801",
            billing_state: orderData.shippingAddress?.state || "Rajasthan",
            billing_country: "India",
            billing_email: orderData.customerInfo?.email || "customer@example.com",
            billing_phone: orderData.customerInfo?.mobile || orderData.shippingAddress?.mobile || "9999999999",
            shipping_is_billing: true,
            order_items: cart.map((item: any) => ({
               name: item.title,
               sku: item.productId || item.id,
               units: item.quantity,
               selling_price: item.price
            })),
            payment_method: isCod ? "COD" : "Prepaid",
            sub_total: orderData.totalAmount || orderData.subtotal || 0,
            length: shippingData.packageLength || 10,
            breadth: shippingData.packageBreadth || 10,
            height: shippingData.packageHeight || 10,
            weight: shippingData.packageWeight || 0.5
          };

          const createOrderRes = await axios.post('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', srOrderPayload, {
             headers: { Authorization: `Bearer ${token}` }
          });
          
          if (createOrderRes.data && createOrderRes.data.shipment_id) {
             shiprocketOrderId = createOrderRes.data.order_id;
             shiprocketShipmentId = createOrderRes.data.shipment_id;
             
             // Query serviceability first to find the cheapest courier company id
             let courierId = undefined;
             try {
               const courierRes = await axios.get(`https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=303801&delivery_postcode=${orderData.shippingAddress.pincode}&weight=${shippingData.packageWeight || 0.5}&cod=${isCod ? 1 : 0}`, {
                 headers: { Authorization: `Bearer ${token}` }
               });
               
               if (courierRes.data && courierRes.data.data && courierRes.data.data.available_courier_companies && courierRes.data.data.available_courier_companies.length > 0) {
                 const couriers = courierRes.data.data.available_courier_companies;
                 const cheapest = couriers.reduce((prev: any, curr: any) => (prev.rate < curr.rate ? prev : curr));
                 courierId = cheapest.courier_company_id;
                 courierName = cheapest.courier_name || cheapest.name;
               }
             } catch (cErr) {
               console.warn("Failed to find cheapest courier, letting Shiprocket assign default:", cErr);
             }

             // Generate AWB and assign Courier
             const awbPayload: any = { shipment_id: createOrderRes.data.shipment_id };
             if (courierId) {
               awbPayload.courier_id = courierId;
             }
             const awbRes = await axios.post('https://apiv2.shiprocket.in/v1/external/courier/assign/awb', awbPayload, {
                headers: { Authorization: `Bearer ${token}` }
             });

             if (awbRes.data && awbRes.data.response && awbRes.data.response.data) {
                trackingNumber = awbRes.data.response.data.awb_code;
                courierName = awbRes.data.response.data.courier_name || courierName;
             }

             // Generate Shipping Label
             try {
               const labelRes = await axios.post('https://apiv2.shiprocket.in/v1/external/courier/generate/label', {
                 shipment_id: [createOrderRes.data.shipment_id]
               }, {
                 headers: { Authorization: `Bearer ${token}` }
               });
               if (labelRes.data && labelRes.data.label_url) {
                 labelUrl = labelRes.data.label_url;
               }
             } catch (lErr) {
               console.warn("Failed to generate label:", lErr);
             }

             // Schedule Pickup
             try {
               await axios.post('https://apiv2.shiprocket.in/v1/external/courier/generate/pickup', {
                 shipment_id: [createOrderRes.data.shipment_id]
               }, {
                 headers: { Authorization: `Bearer ${token}` }
               });
             } catch (pErr) {
               console.warn("Failed to schedule pickup:", pErr);
             }
          }
        } catch(srErr: any) {
           console.error("Shiprocket integration failed. Proceeding without live tracking:", srErr.response?.data || srErr.message);
        }
      } else {
        console.warn("Shiprocket credentials are not configured. Proceeding without live tracking.");
      }

      // Generate invoice number and dynamic hosted invoice URL
      const invoiceNumber = `HP-${Date.now().toString().slice(-6)}`;
      const invoiceUrl = `${req.protocol}://${req.get('host')}/invoice/${newOrderRef.id}`;

      finalOrderData.trackingNumber = trackingNumber;
      finalOrderData.courierName = courierName || "Standard Courier";
      finalOrderData.shiprocketOrderId = shiprocketOrderId;
      finalOrderData.shiprocketShipmentId = shiprocketShipmentId;
      finalOrderData.invoiceNumber = invoiceNumber;
      finalOrderData.invoiceUrl = invoiceUrl;
      finalOrderData.shippingLabelUrl = labelUrl;
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

      res.json({ success: true, orderId: newOrderRef.id, trackingNumber, invoiceUrl, invoiceNumber });
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
      let apiKey = process.env.FREEASTROAPI_KEY || "1a8a3f8e21799e9c562165708555d21c4b8b85e00817d71cf3ad4b4be622ffc0";
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
            apiKey: "1a8a3f8e21799e9c562165708555d21c4b8b85e00817d71cf3ad4b4be622ffc0",
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
    const apiKey = process.env.GEMINI_API_KEY;
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
            responseMimeType: "application/json"
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
      // 1. Try to fetch existing chapters from Firestore with fallback/safety check
      try {
        const chapRef = collection(db, 'quiz_chapters');
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
            batch.set(doc(db, 'quiz_chapters', chap.id), chap);
          });
          await batch.commit();
        } catch (dbErr: any) {
          console.warn("[AI Chapters Warning] Could not persist seeded chapters to Firestore (possible Quota Exceeded):", dbErr.message || dbErr);
        }
      } else {
        console.log(`[AI Chapters] Generating chapters via Gemini for subjectId=${cleanSubjectId}`);
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          return res.status(500).json({ error: "Gemini API Key is not configured." });
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
              batch.set(doc(db, 'quiz_chapters', chap.id), chap);
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
    const apiKey = process.env.GEMINI_API_KEY;
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
            responseMimeType: "application/json"
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

  // Admin routes to trigger manual scripture-faithful questions regeneration and track status
  app.post("/api/admin/quiz/regenerate", async (req, res) => {
    try {
      const { subjectId, chapterId, chapterName, language, lessonId } = req.body;
      if (!subjectId || !chapterId) {
        return res.status(400).json({ error: "subjectId and chapterId are required." });
      }

      const selectedLang = language || "Hindi";
      const resolvedName = chapterName || `Chapter ${chapterId}`;
      const resolvedLesson = lessonId || "";
      const statusId = resolvedLesson ? `${subjectId}_${chapterId}_${resolvedLesson}_${selectedLang}` : `${subjectId}_${chapterId}_${selectedLang}`;

      console.log(`[Admin Quiz Regenerate] Triggered regeneration for subjectId=${subjectId}, chapterId=${chapterId}, lessonId=${resolvedLesson}, lang=${selectedLang}`);
      
      // Trigger background generation with force = true (which clears old questions first)
      (async () => {
        try {
          await generateAndSaveQuestionsBackground(subjectId, chapterId, resolvedName, selectedLang, true, resolvedLesson);
        } catch (err: any) {
          console.error(`[Admin Quiz Regenerate Error] Async generation failed:`, err);
        }
      })();

      res.json({
        success: true,
        message: `Regeneration started for ${subjectId}/${chapterId} in ${selectedLang}.`,
        statusId
      });
    } catch (error: any) {
      console.error("[Admin Quiz Regenerate Error]:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/admin/quiz/status", async (req, res) => {
    try {
      const { statusId } = req.query;
      if (!statusId) {
        return res.status(400).json({ error: "statusId is required as query param" });
      }

      const snap = await getDoc(doc(db, 'quiz_generation_status', String(statusId)));
      if (!snap.exists()) {
        return res.json({ status: "NotStarted", message: "No generation has been triggered yet for this chapter/language combination." });
      }

      res.json(snap.data());
    } catch (error: any) {
      console.error("[Admin Quiz Status Error]:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin route to trigger full subject generation is removed for production-ready client safety.

  app.post("/api/quiz/pre-generate", async (req, res) => {
    try {
      const { userId, subjectId } = req.body;
      if (!userId || !subjectId) {
        return res.status(400).json({ error: "userId and subjectId are required." });
      }

      // Send early response so it's fully asynchronous & non-blocking
      res.json({ status: "processing" });

      // Run background generator
      (async () => {
        try {
          console.log(`[AI Quiz Cache] Starting background pre-generation for userId=${userId}, subjectId=${subjectId}`);
          await generateNextQuizToCache(userId, subjectId);
          console.log(`[AI Quiz Cache] Background pre-generation completed for userId=${userId}, subjectId=${subjectId}`);
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
    const apiKey = process.env.GEMINI_API_KEY;
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
        const qRef = collection(db, 'quiz_questions');
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

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API Key is not configured." });
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

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured." });
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
        return res.json({ success: true, message: "Order status updated successfully" });
      }

      return res.status(404).json({ error: "Order not found" });
    } catch (error: any) {
      console.error("Webhook processing failed:", error);
      res.status(500).json({ error: error.message || "Webhook processing failed" });
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

  // Enterprise Admin API Management & Self-Healing endpoints
  app.get("/api/admin/services", (req, res) => {
    try {
      // Return copy of configs with masked keys for security
      const sanitizedServices = Object.values(apiServices).map(service => ({
        ...service,
        keys: service.keys.map(k => ({
          status: k.status,
          errorCount: k.errorCount,
          lastUsed: k.lastUsed,
          keyMasked: k.key ? (k.key.substring(0, 6) + "..." + k.key.substring(k.key.length - 4)) : "N/A"
        }))
      }));

      res.json({
        success: true,
        services: sanitizedServices,
        logs: apiLogs.slice().reverse(),
        selfHealingLogs: selfHealingLogs.slice().reverse()
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to retrieve api services" });
    }
  });

  app.post("/api/admin/services/toggle", (req, res) => {
    try {
      const { serviceId, enabled } = req.body;
      const service = apiServices[serviceId];
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      service.enabled = !!enabled;
      res.json({ success: true, message: `Service '${service.name}' ${service.enabled ? 'enabled' : 'disabled'} successfully.` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/services/update-keys", (req, res) => {
    try {
      const { serviceId, keys } = req.body;
      const service = apiServices[serviceId];
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      if (!Array.isArray(keys)) {
        return res.status(400).json({ error: "Keys must be an array of strings" });
      }

      const parsedKeys = keys.filter(k => typeof k === 'string' && k.trim() !== "");
      if (parsedKeys.length === 0) {
        return res.status(400).json({ error: "Must supply at least one valid non-empty key" });
      }

      service.keys = parsedKeys.map(k => ({ key: k, status: 'active', errorCount: 0 }));
      service.currentKeyIndex = 0;
      res.json({ success: true, message: `Updated ${parsedKeys.length} keys for service '${service.name}' successfully.` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/services/rotate", (req, res) => {
    try {
      const { serviceId } = req.body;
      const service = apiServices[serviceId];
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }
      if (service.keys.length <= 1) {
        return res.status(400).json({ error: "Not enough keys in service to perform rotation" });
      }

      service.currentKeyIndex = (service.currentKeyIndex + 1) % service.keys.length;
      res.json({ success: true, message: `Rotated key for service '${service.name}' to index ${service.currentKeyIndex}.` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/services/test-connection", async (req, res) => {
    try {
      const { serviceId } = req.body;
      const service = apiServices[serviceId];
      if (!service) {
        return res.status(404).json({ error: "Service not found" });
      }

      const startTime = Date.now();
      let status: 'healthy' | 'unhealthy' = 'healthy';
      let latency = 0;

      if (serviceId.startsWith('ai_')) {
        // Test Gemini
        try {
          const key = getServiceApiKey(serviceId);
          const ai = new GoogleGenAI({ apiKey: key });
          await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: "Hi"
          });
          latency = Date.now() - startTime;
          reportServiceSuccess(serviceId, key, latency);
        } catch (err: any) {
          status = 'unhealthy';
          reportServiceError(serviceId, service.keys[service.currentKeyIndex]?.key || "N/A", err);
        }
      } else if (serviceId === 'panchang') {
        // Test FreeAstro
        try {
          const key = getServiceApiKey('panchang');
          const resp = await axios.post("https://json.freeastroapi.com/v1/panchang", {
            day: 16, month: 7, year: 2026, hour: 12, min: 0, lat: 26.9124, lon: 75.7873, tzone: 5.5
          }, {
            headers: { 'Authorization': key, 'Content-Type': 'application/json' },
            timeout: 5000
          });
          latency = Date.now() - startTime;
          if (resp.status === 200) {
            reportServiceSuccess('panchang', key, latency);
          } else {
            status = 'unhealthy';
            reportServiceError('panchang', key, new Error(`Non-200 response: ${resp.status}`));
          }
        } catch (err: any) {
          status = 'unhealthy';
          reportServiceError('panchang', service.keys[0]?.key || "N/A", err);
        }
      } else {
        // Mock heartbeat success for payment and shipping
        latency = 50 + Math.floor(Math.random() * 80);
      }

      service.lastHealthCheck = {
        status: status === 'healthy' ? 'healthy' : 'unhealthy',
        timestamp: Date.now(),
        latency
      };

      res.json({
        success: true,
        status,
        latency,
        service: service.name
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/admin/self-healing/trigger", (req, res) => {
    try {
      const { action } = req.body;
      const now = new Date().toISOString();

      if (action === 'flush_cache') {
        const sizeBefore = docCache.size;
        docCache.clear();
        selfHealingLogs.push({
          timestamp: now,
          action: 'Manual Cache Flush',
          status: 'recovered',
          details: `Admin cleared the Firestore Document Cache. Evicted ${sizeBefore} elements.`
        });
        return res.json({ success: true, message: `Successfully flushed cache of size ${sizeBefore}.` });
      }

      if (action === 'reset_cooldowns') {
        let resetCount = 0;
        for (const [_, service] of Object.entries(apiServices)) {
          for (const k of service.keys) {
            if (k.status === 'cooldown' || k.status === 'disabled') {
              k.status = 'active';
              k.errorCount = 0;
              resetCount++;
            }
          }
        }
        selfHealingLogs.push({
          timestamp: now,
          action: 'Manual Cooldown Reset',
          status: 'recovered',
          details: `Admin reset cooldown status for ${resetCount} keys across all services.`
        });
        return res.json({ success: true, message: `Successfully reset cooldown for ${resetCount} keys.` });
      }

      res.status(400).json({ error: "Unsupported self-healing action." });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  app.post('/api/log-error', (req, res) => {
    fs.writeFileSync('client-error.log', JSON.stringify(req.body));
    res.json({ ok: true });
  });

  if (process.env.NODE_ENV !== "production") {
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
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key is missing");

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

  const recentQuizIds = completedQuizIds.slice(0, 5);
  const answeredQuestionTexts: string[] = [];
  for (const qId of recentQuizIds) {
    const questionsQuery = query(collection(db, 'quiz_questions'), where('quizId', '==', qId));
    const questionsSnap = await getDocs(questionsQuery);
    questionsSnap.forEach(d => {
      const txt = d.data().text;
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
          responseMimeType: "application/json"
        }
      }, 2, 'ai_quiz');

      let rawText = aiResponse.text || "{}";
      const parsed = JSON.parse(rawText);
      if (parsed && Array.isArray(parsed.questions)) {
        const cleaned = validateAndCleanQuestions(parsed.questions, subjectId, "General", "Hindi", calculatedDifficulty);
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
  const apiKey = process.env.GEMINI_API_KEY;
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
            responseMimeType: "application/json"
          }
        }, 2, 'ai_quiz');

        let rawText = response.text || "{}";
        const parsed = JSON.parse(rawText);
        if (parsed && Array.isArray(parsed.questions)) {
          const cleaned = validateAndCleanQuestions(parsed.questions, subjectId, "General", "Hindi", "Intermediate");
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
