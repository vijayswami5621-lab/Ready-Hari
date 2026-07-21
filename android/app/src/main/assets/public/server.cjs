var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_config = require("dotenv/config");
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_genai = require("@google/genai");
var import_razorpay = __toESM(require("razorpay"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var import_axios = __toESM(require("axios"), 1);
var import_app = require("firebase/app");
var import_lite = require("firebase/firestore/lite");
var getEnvVar = (key, fallback) => {
  const val = process.env[key];
  if (!val || val === "undefined" || val === "null") return fallback;
  return val;
};
var firebaseConfig = {
  apiKey: getEnvVar("VITE_FIREBASE_API_KEY", "AIzaSyBMlQAwq-VxiP0LhXM08FJsHmf_kjRDfVY"),
  authDomain: getEnvVar("VITE_FIREBASE_AUTH_DOMAIN", "official-hari.firebaseapp.com"),
  projectId: getEnvVar("VITE_FIREBASE_PROJECT_ID", "official-hari"),
  storageBucket: getEnvVar("VITE_FIREBASE_STORAGE_BUCKET", "official-hari.firebasestorage.app"),
  messagingSenderId: getEnvVar("VITE_FIREBASE_MESSAGING_SENDER_ID", "320780984737"),
  appId: getEnvVar("VITE_FIREBASE_APP_ID", "1:320780984737:android:26d892ed88c7f4122cabe0")
};
var firebaseApp = (0, import_app.initializeApp)(firebaseConfig);
var db = (0, import_lite.getFirestore)(firebaseApp);
var docCache = /* @__PURE__ */ new Map();
var CACHE_TTL = 15 * 60 * 1e3;
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
async function getDoc(docRef) {
  const path2 = docRef.path;
  const now = Date.now();
  const cached = docCache.get(path2);
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return {
      exists: () => cached.exists,
      data: () => cached.data
    };
  }
  try {
    const snap = await (0, import_lite.getDoc)(docRef);
    docCache.set(path2, {
      data: snap.exists() ? snap.data() : null,
      exists: snap.exists(),
      timestamp: now
    });
    return snap;
  } catch (error) {
    console.warn(`[Firestore Cache Warning] Failed to fetch document at ${path2}:`, error.message || error);
    if (cached) {
      console.log(`[Firestore Cache] Using expired cached version for ${path2}`);
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
var apiServices = {
  ai_chat: {
    id: "ai_chat",
    name: "AI Guru Chat Service",
    enabled: true,
    keys: [],
    currentKeyIndex: 0,
    dailyLimit: 2e3,
    callsCount: 0,
    errorsCount: 0
  },
  ai_quiz: {
    id: "ai_quiz",
    name: "Quiz Generator Service",
    enabled: true,
    keys: [],
    currentKeyIndex: 0,
    dailyLimit: 1500,
    callsCount: 0,
    errorsCount: 0
  },
  ai_quote: {
    id: "ai_quote",
    name: "Quote / Sutra Service",
    enabled: true,
    keys: [],
    currentKeyIndex: 0,
    dailyLimit: 3e3,
    callsCount: 0,
    errorsCount: 0
  },
  ai_scripture: {
    id: "ai_scripture",
    name: "Scripture Explainer Service",
    enabled: true,
    keys: [],
    currentKeyIndex: 0,
    dailyLimit: 1500,
    callsCount: 0,
    errorsCount: 0
  },
  panchang: {
    id: "panchang",
    name: "Vedic Panchang Service",
    enabled: true,
    keys: [{ key: process.env.FREEASTROAPI_KEY || "11ccbe1efa55e242577b191f7cabee889763db18d621f2e1018c458df2de1472", status: "active", errorCount: 0 }],
    currentKeyIndex: 0,
    dailyLimit: 500,
    callsCount: 0,
    errorsCount: 0
  },
  payment: {
    id: "payment",
    name: "Razorpay Gateway",
    enabled: true,
    keys: [{ key: process.env.RAZORPAY_LIVE_KEY_ID || "rzp_live_T91BWZao0CJ2Bi", status: "active", errorCount: 0 }],
    currentKeyIndex: 0,
    dailyLimit: 1e4,
    callsCount: 0,
    errorsCount: 0
  },
  shipping: {
    id: "shipping",
    name: "Shiprocket Logistics",
    enabled: true,
    keys: [{ key: process.env.SHIPROCKET_EMAIL || "swamiajay9783@gmail.com", status: "active", errorCount: 0 }],
    currentKeyIndex: 0,
    dailyLimit: 2e3,
    callsCount: 0,
    errorsCount: 0
  }
};
function initServiceKeys() {
  const defaultKey = process.env.GEMINI_API_KEY || "AIzaSy_fake_default_key_to_prevent_crash_hp";
  const chatKeys = [
    process.env.GEMINI_API_KEY_CHAT,
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_SECONDARY
  ].filter((k) => !!k && k.trim() !== "");
  apiServices.ai_chat.keys = (chatKeys.length ? chatKeys : [defaultKey]).map((k) => ({ key: k, status: "active", errorCount: 0 }));
  const quizKeys = [
    process.env.GEMINI_API_KEY_QUIZ,
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_SECONDARY
  ].filter((k) => !!k && k.trim() !== "");
  apiServices.ai_quiz.keys = (quizKeys.length ? quizKeys : [defaultKey]).map((k) => ({ key: k, status: "active", errorCount: 0 }));
  const quoteKeys = [
    process.env.GEMINI_API_KEY_QUOTE,
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_SECONDARY
  ].filter((k) => !!k && k.trim() !== "");
  apiServices.ai_quote.keys = (quoteKeys.length ? quoteKeys : [defaultKey]).map((k) => ({ key: k, status: "active", errorCount: 0 }));
  const scriptureKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_SECONDARY
  ].filter((k) => !!k && k.trim() !== "");
  apiServices.ai_scripture.keys = (scriptureKeys.length ? scriptureKeys : [defaultKey]).map((k) => ({ key: k, status: "active", errorCount: 0 }));
}
initServiceKeys();
var apiLogs = [];
function addApiLog(serviceId, key, status, latency, error) {
  const entry = {
    id: "log_" + Math.random().toString(36).substr(2, 9),
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    serviceId,
    keyMasked: key ? key.substring(0, 6) + "..." + key.substring(key.length - 4) : "N/A",
    status,
    latency,
    error
  };
  apiLogs.push(entry);
  if (apiLogs.length > 100) apiLogs.shift();
}
function getServiceApiKey(serviceId) {
  const service = apiServices[serviceId];
  if (!service) throw new Error(`Unknown service: ${serviceId}`);
  if (!service.enabled) throw new Error(`Service ${service.name} is currently disabled.`);
  const keysCount = service.keys.length;
  for (let i = 0; i < keysCount; i++) {
    const idx = (service.currentKeyIndex + i) % keysCount;
    const keyInfo = service.keys[idx];
    if (keyInfo && keyInfo.status === "active") {
      service.currentKeyIndex = idx;
      keyInfo.lastUsed = Date.now();
      return keyInfo.key;
    }
  }
  let recoveredAny = false;
  for (const k of service.keys) {
    if (k.status === "cooldown") {
      k.status = "active";
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
function reportServiceSuccess(serviceId, key, latency) {
  const service = apiServices[serviceId];
  if (service) {
    service.callsCount++;
    addApiLog(serviceId, key, "success", latency);
  }
}
var selfHealingLogs = [];
setInterval(() => {
  try {
    const memory = process.memoryUsage();
    const heapUsedMB = memory.heapUsed / 1024 / 1024;
    if (heapUsedMB > 450) {
      const sizeBefore = docCache.size;
      docCache.clear();
      selfHealingLogs.push({
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        action: "Cache Eviction (High RAM)",
        status: "recovered",
        details: `RAM Heap is high: ${heapUsedMB.toFixed(1)}MB. Flushed local cache of size ${sizeBefore} to avoid leak.`
      });
    }
    for (const [sId, service] of Object.entries(apiServices)) {
      let recovered = 0;
      for (const k of service.keys) {
        if (k.status === "cooldown" && k.lastUsed && Date.now() - k.lastUsed > 5 * 60 * 1e3) {
          k.status = "active";
          k.errorCount = 0;
          recovered++;
        }
      }
      if (recovered > 0) {
        selfHealingLogs.push({
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          action: "Automatic Cooldown Release",
          status: "recovered",
          details: `Unlocked ${recovered} keys in [${sId}] service after 5-minute cooldown.`
        });
      }
    }
  } catch (err) {
    console.error("[Background Self-Healing Error]", err);
  }
}, 6e4);
async function generateContentWithRetry(aiInstance, params, maxRetries = 4, serviceId = "ai_scripture") {
  let attempt = 0;
  let delay = 300;
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
    const resolvedAi = new import_genai.GoogleGenAI({ apiKey });
    const modelToUse = uniqueModels[currentModelIndex % uniqueModels.length];
    try {
      console.log(`[Gemini API] Call to [Service: ${serviceId}] with model=${modelToUse} (Attempt ${attempt + 1}/${maxRetries})`);
      const response = await resolvedAi.models.generateContent({
        ...params,
        model: modelToUse
      });
      const latency = Date.now() - startTime;
      reportServiceSuccess(serviceId, apiKey, latency);
      return response;
    } catch (error) {
      attempt++;
      const errorMsg = error?.message || String(error);
      const isQuotaExceeded = errorMsg.toLowerCase().includes("quota") || errorMsg.toLowerCase().includes("exceeded your current quota") || errorMsg.toLowerCase().includes("limit: 20") || errorMsg.toLowerCase().includes("billing") || errorMsg.toLowerCase().includes("exhausted");
      const isTransient = !isQuotaExceeded && (errorMsg.includes("503") || errorMsg.includes("429") || errorMsg.includes("UNAVAILABLE") || errorMsg.includes("high demand"));
      const service = apiServices[serviceId];
      if (service) {
        service.errorsCount++;
        service.lastErrorMsg = errorMsg;
        addApiLog(serviceId, apiKey, "failed", 0, errorMsg);
        const keyInfo = service.keys.find((k) => k.key === apiKey);
        if (keyInfo) {
          if (isQuotaExceeded) {
            keyInfo.status = "cooldown";
            keyInfo.errorCount = 2;
            service.currentKeyIndex = (service.currentKeyIndex + 1) % service.keys.length;
          } else {
            keyInfo.errorCount++;
            if (keyInfo.errorCount >= 2) {
              keyInfo.status = "cooldown";
              service.currentKeyIndex = (service.currentKeyIndex + 1) % service.keys.length;
            }
          }
        }
      }
      console.warn(`[Gemini API Warning] [Service: ${serviceId}] Attempt ${attempt} failed with error:`, errorMsg);
      if ((isTransient || isQuotaExceeded) && attempt < maxRetries) {
        if (isQuotaExceeded) {
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
function getScriptureName(subjectId) {
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
function getFallbackQuestions(subjectId, chapterId, language) {
  const isEnglish = language === "English";
  const scripture = getScriptureName(subjectId);
  const qList = [];
  const gitaTemplates = [
    {
      textHindi: "\u0936\u094D\u0930\u0940\u092E\u0926\u094D\u092D\u0917\u0935\u0926\u094D\u0917\u0940\u0924\u093E \u092E\u0947\u0902 \u0915\u0941\u0932 \u0915\u093F\u0924\u0928\u0947 \u0905\u0927\u094D\u092F\u093E\u092F \u0914\u0930 \u0936\u094D\u0932\u094B\u0915 \u0939\u0948\u0902?",
      textEnglish: "How many chapters and verses are there in the Shrimad Bhagavad Gita?",
      optionsHindi: ["18 \u0905\u0927\u094D\u092F\u093E\u092F \u0914\u0930 700 \u0936\u094D\u0932\u094B\u0915", "16 \u0905\u0927\u094D\u092F\u093E\u092F \u0914\u0930 500 \u0936\u094D\u0932\u094B\u0915", "20 \u0905\u0927\u094D\u092F\u093E\u092F \u0914\u0930 800 \u0936\u094D\u0932\u094B\u0915", "12 \u0905\u0927\u094D\u092F\u093E\u092F \u0914\u0930 1000 \u0936\u094D\u0932\u094B\u0915"],
      optionsEnglish: ["18 Chapters and 700 Verses", "16 Chapters and 500 Verses", "20 Chapters and 800 Verses", "12 Chapters and 1000 Verses"],
      correctHindi: "18 \u0905\u0927\u094D\u092F\u093E\u092F \u0914\u0930 700 \u0936\u094D\u0932\u094B\u0915",
      correctEnglish: "18 Chapters and 700 Verses",
      explanationHindi: "\u092D\u0917\u0935\u0926\u094D\u0917\u0940\u0924\u093E \u092E\u0947\u0902 \u0915\u0941\u0932 18 \u0905\u0927\u094D\u092F\u093E\u092F \u0914\u0930 700 \u0936\u094D\u0932\u094B\u0915 \u0939\u0948\u0902, \u091C\u094B \u092E\u0939\u093E\u092D\u093E\u0930\u0924 \u0915\u0947 \u092D\u0940\u0937\u094D\u092E \u092A\u0930\u094D\u0935 \u0915\u093E \u0939\u093F\u0938\u094D\u0938\u093E \u0939\u0948\u0902\u0964",
      explanationEnglish: "The Bhagavad Gita consists of 18 chapters and 700 verses, which are part of the Bhishma Parva of Mahabharata.",
      ref: "Bhagavad Gita"
    },
    {
      textHindi: "\u092D\u0917\u0935\u0926\u094D\u0917\u0940\u0924\u093E \u0915\u093E \u0909\u092A\u0926\u0947\u0936 \u092D\u0917\u0935\u093E\u0928 \u0936\u094D\u0930\u0940 \u0915\u0943\u0937\u094D\u0923 \u0928\u0947 \u0915\u0941\u0930\u0941\u0915\u094D\u0937\u0947\u0924\u094D\u0930 \u0915\u0947 \u092E\u0948\u0926\u093E\u0928 \u092E\u0947\u0902 \u0915\u093F\u0938\u0947 \u0926\u093F\u092F\u093E \u0925\u093E?",
      textEnglish: "To whom did Lord Krishna deliver the Bhagavad Gita on the battlefield of Kurukshetra?",
      optionsHindi: ["\u0905\u0930\u094D\u091C\u0941\u0928", "\u092F\u0941\u0927\u093F\u0937\u094D\u0920\u093F\u0930", "\u092D\u0940\u0937\u094D\u092E", "\u0915\u0930\u094D\u0923"],
      optionsEnglish: ["Arjuna", "Yudhishthira", "Bhishma", "Karna"],
      correctHindi: "\u0905\u0930\u094D\u091C\u0941\u0928",
      correctEnglish: "Arjuna",
      explanationHindi: "\u092D\u0917\u0935\u093E\u0928 \u0936\u094D\u0930\u0940 \u0915\u0943\u0937\u094D\u0923 \u0928\u0947 \u0905\u0930\u094D\u091C\u0941\u0928 \u0915\u0947 \u092E\u094B\u0939 \u0914\u0930 \u0935\u093F\u0937\u093E\u0926 \u0915\u094B \u0926\u0942\u0930 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u0915\u0941\u0930\u0941\u0915\u094D\u0937\u0947\u0924\u094D\u0930 \u0915\u0947 \u092F\u0941\u0926\u094D\u0927 \u092E\u0948\u0926\u093E\u0928 \u092E\u0947\u0902 \u0909\u0928\u094D\u0939\u0947\u0902 \u0905\u092E\u0930 \u091C\u094D\u091E\u093E\u0928 \u0926\u093F\u092F\u093E \u0925\u093E\u0964",
      explanationEnglish: "Lord Krishna imparted this eternal wisdom to Arjuna to dispel his attachments and despair on the battlefield.",
      ref: "Bhagavad Gita 1.1"
    },
    {
      textHindi: "\u0917\u0940\u0924\u093E \u0915\u0947 \u0926\u0942\u0938\u0930\u0947 \u0905\u0927\u094D\u092F\u093E\u092F \u092E\u0947\u0902 \u0906\u0924\u094D\u092E\u093E \u0915\u0947 \u092C\u093E\u0930\u0947 \u092E\u0947\u0902 \u0915\u094D\u092F\u093E \u0915\u0939\u093E \u0917\u092F\u093E \u0939\u0948?",
      textEnglish: "According to Chapter 2 of the Gita, what is the nature of the soul?",
      optionsHindi: ["\u092F\u0939 \u0905\u092E\u0930 \u0914\u0930 \u0905\u0935\u093F\u0928\u093E\u0936\u0940 \u0939\u0948", "\u092F\u0939 \u0928\u0936\u094D\u0935\u0930 \u0939\u0948", "\u0907\u0938\u0947 \u0936\u0938\u094D\u0924\u094D\u0930 \u0915\u093E\u091F \u0938\u0915\u0924\u0947 \u0939\u0948\u0902", "\u092F\u0939 \u0928\u0937\u094D\u091F \u0915\u0940 \u091C\u093E \u0938\u0915\u0924\u0940 \u0939\u0948"],
      optionsEnglish: ["It is immortal and indestructible", "It is mortal and perishes", "It can be cut by weapons", "It can be destroyed"],
      correctHindi: "\u092F\u0939 \u0905\u092E\u0930 \u0914\u0930 \u0905\u0935\u093F\u0928\u093E\u0936\u0940 \u0939\u0948",
      correctEnglish: "It is immortal and indestructible",
      explanationHindi: "\u0917\u0940\u0924\u093E \u0915\u0947 \u0926\u0942\u0938\u0930\u0947 \u0905\u0927\u094D\u092F\u093E\u092F \u0915\u0947 \u0905\u0928\u0941\u0938\u093E\u0930 \u0906\u0924\u094D\u092E\u093E \u0905\u092E\u0930, \u0905\u091C\u0928\u094D\u092E\u093E \u0914\u0930 \u0905\u0935\u093F\u0928\u093E\u0936\u0940 \u0939\u0948\u0964 \u0907\u0938\u0947 \u0928 \u0924\u094B \u0936\u0938\u094D\u0924\u094D\u0930 \u0915\u093E\u091F \u0938\u0915\u0924\u0947 \u0939\u0948\u0902 \u0914\u0930 \u0928 \u0939\u0940 \u0905\u0917\u094D\u0928\u093F \u091C\u0932\u093E \u0938\u0915\u0924\u0940 \u0939\u0948\u0964",
      explanationEnglish: "According to Chapter 2, the soul is immortal, unborn, and indestructible. It cannot be cut by weapons nor burned by fire.",
      ref: "Bhagavad Gita 2.18"
    },
    {
      textHindi: "'\u0915\u0930\u094D\u092E\u0923\u094D\u092F\u0947\u0935\u093E\u0927\u093F\u0915\u093E\u0930\u0938\u094D\u0924\u0947 \u092E\u093E \u092B\u0932\u0947\u0937\u0941 \u0915\u0926\u093E\u091A\u0928' \u0936\u094D\u0932\u094B\u0915 \u092D\u0917\u0935\u0926\u094D\u0917\u0940\u0924\u093E \u0915\u0947 \u0915\u093F\u0938 \u0905\u0927\u094D\u092F\u093E\u092F \u092E\u0947\u0902 \u0939\u0948?",
      textEnglish: "In which chapter of the Bhagavad Gita is the famous verse 'Karmanye Vadhikaraste...' found?",
      optionsHindi: ["\u0905\u0927\u094D\u092F\u093E\u092F 2", "\u0905\u0927\u094D\u092F\u093E\u092F 18", "\u0905\u0927\u094D\u092F\u093E\u092F 12", "\u0905\u0927\u094D\u092F\u093E\u092F 15"],
      optionsEnglish: ["Chapter 2", "Chapter 18", "Chapter 12", "Chapter 15"],
      correctHindi: "\u0905\u0927\u094D\u092F\u093E\u092F 2",
      correctEnglish: "Chapter 2",
      explanationHindi: "\u092F\u0939 \u092A\u094D\u0930\u0938\u093F\u0926\u094D\u0927 \u0936\u094D\u0932\u094B\u0915 \u0928\u093F\u0937\u094D\u0915\u093E\u092E \u0915\u0930\u094D\u092E\u092F\u094B\u0917 \u0915\u093E \u0906\u0927\u093E\u0930 \u0939\u0948 \u0914\u0930 \u0917\u0940\u0924\u093E \u0915\u0947 \u0926\u0942\u0938\u0930\u0947 \u0905\u0927\u094D\u092F\u093E\u092F (\u0936\u094D\u0932\u094B\u0915 47) \u092E\u0947\u0902 \u0906\u0924\u093E \u0939\u0948\u0964",
      explanationEnglish: "This famous verse on Nishkama Karma is the 47th verse of Chapter 2.",
      ref: "Bhagavad Gita 2.47"
    },
    {
      textHindi: "\u092D\u0917\u0935\u0926\u094D\u0917\u0940\u0924\u093E \u0915\u0947 \u0905\u0928\u0941\u0938\u093E\u0930 \u092E\u0928 \u0915\u094B \u0935\u0936 \u092E\u0947\u0902 \u0915\u0930\u0928\u0947 \u0915\u093E \u0915\u094D\u092F\u093E \u0909\u092A\u093E\u092F \u0939\u0948?",
      textEnglish: "According to the Bhagavad Gita, what is the way to control the mind?",
      optionsHindi: ["\u0905\u092D\u094D\u092F\u093E\u0938 \u0914\u0930 \u0935\u0948\u0930\u093E\u0917\u094D\u092F", "\u0915\u0947\u0935\u0932 \u092D\u094B\u091C\u0928 \u0915\u093E \u0924\u094D\u092F\u093E\u0917", "\u0938\u0902\u0938\u093E\u0930 \u0938\u0947 \u092A\u0932\u093E\u092F\u0928", "\u0938\u094B\u0928\u093E \u092C\u0902\u0926 \u0915\u0930\u0928\u093E"],
      optionsEnglish: ["Practice (Abhyasa) and Detachment (Vairagya)", "Only fasting", "Running away from the world", "Stopping sleep"],
      correctHindi: "\u0905\u092D\u094D\u092F\u093E\u0938 \u0914\u0930 \u0935\u0948\u0930\u093E\u0917\u094D\u092F",
      correctEnglish: "Practice (Abhyasa) and Detachment (Vairagya)",
      explanationHindi: "\u092D\u0917\u0935\u093E\u0928 \u0915\u0943\u0937\u094D\u0923 \u091B\u0920\u0947 \u0905\u0927\u094D\u092F\u093E\u092F \u0915\u0947 35\u0935\u0947\u0902 \u0936\u094D\u0932\u094B\u0915 \u092E\u0947\u0902 \u0915\u0939\u0924\u0947 \u0939\u0948\u0902 \u0915\u093F \u0905\u092D\u094D\u092F\u093E\u0938 \u0914\u0930 \u0935\u0948\u0930\u093E\u0917\u094D\u092F \u0926\u094D\u0935\u093E\u0930\u093E \u091A\u0902\u091A\u0932 \u092E\u0928 \u0915\u094B \u0935\u0936 \u092E\u0947\u0902 \u0915\u093F\u092F\u093E \u091C\u093E \u0938\u0915\u0924\u093E \u0939\u0948\u0964",
      explanationEnglish: "In Chapter 6, Verse 35, Lord Krishna explains that the restless mind can be controlled through constant practice and detachment.",
      ref: "Bhagavad Gita 6.35"
    }
  ];
  const ramcharitmanasTemplates = [
    {
      textHindi: "\u0930\u093E\u092E\u091A\u0930\u093F\u0924\u092E\u093E\u0928\u0938 \u092E\u0947\u0902 \u0915\u0941\u0932 \u0915\u093F\u0924\u0928\u0947 \u0915\u093E\u0923\u094D\u0921 (\u0905\u0927\u094D\u092F\u093E\u092F) \u0939\u0948\u0902?",
      textEnglish: "How many Kandas (chapters) are there in Ramcharitmanas?",
      optionsHindi: ["7 \u0915\u093E\u0923\u094D\u0921", "6 \u0915\u093E\u0923\u094D\u0921", "8 \u0915\u093E\u0923\u094D\u0921", "5 \u0915\u093E\u0923\u094D\u0921"],
      optionsEnglish: ["7 Kandas", "6 Kandas", "8 Kandas", "5 Kandas"],
      correctHindi: "7 \u0915\u093E\u0923\u094D\u0921",
      correctEnglish: "7 Kandas",
      explanationHindi: "\u0930\u093E\u092E\u091A\u0930\u093F\u0924\u092E\u093E\u0928\u0938 \u092E\u0947\u0902 \u0915\u0941\u0932 \u0938\u093E\u0924 \u0915\u093E\u0923\u094D\u0921 \u0939\u0948\u0902: \u092C\u093E\u0932, \u0905\u092F\u094B\u0927\u094D\u092F\u093E, \u0905\u0930\u0923\u094D\u092F, \u0915\u093F\u0937\u094D\u0915\u093F\u0902\u0927\u093E, \u0938\u0941\u0902\u0926\u0930, \u0932\u0902\u0915\u093E \u0914\u0930 \u0909\u0924\u094D\u0924\u0930 \u0915\u093E\u0923\u094D\u0921\u0964",
      explanationEnglish: "There are seven Kandas in Ramcharitmanas: Bala, Ayodhya, Aranya, Kishkindha, Sundar, Lanka, and Uttar Kanda.",
      ref: "Ramcharitmanas"
    },
    {
      textHindi: "\u0917\u094B\u0938\u094D\u0935\u093E\u092E\u0940 \u0924\u0941\u0932\u0938\u0940\u0926\u093E\u0938 \u091C\u0940 \u0928\u0947 \u0930\u093E\u092E\u091A\u0930\u093F\u0924\u092E\u093E\u0928\u0938 \u0915\u0940 \u0930\u091A\u0928\u093E \u092E\u0941\u0916\u094D\u092F \u0930\u0942\u092A \u0938\u0947 \u0915\u093F\u0938 \u092D\u093E\u0937\u093E \u092E\u0947\u0902 \u0915\u0940?",
      textEnglish: "In which language did Goswami Tulsidas compose Ramcharitmanas?",
      optionsHindi: ["\u0905\u0935\u0927\u0940", "\u0938\u0902\u0938\u094D\u0915\u0943\u0924", "\u092C\u094D\u0930\u091C", "\u092E\u0948\u0925\u093F\u0932\u0940"],
      optionsEnglish: ["Awadhi", "Sanskrit", "Braj", "Maithili"],
      correctHindi: "\u0905\u0935\u0927\u0940",
      correctEnglish: "Awadhi",
      explanationHindi: "\u0930\u093E\u092E\u091A\u0930\u093F\u0924\u092E\u093E\u0928\u0938 \u0915\u0940 \u0930\u091A\u0928\u093E \u0917\u094B\u0938\u094D\u0935\u093E\u092E\u0940 \u0924\u0941\u0932\u0938\u0940\u0926\u093E\u0938 \u091C\u0940 \u0928\u0947 \u0905\u0935\u0927\u0940 \u092D\u093E\u0937\u093E \u092E\u0947\u0902 \u0915\u0940 \u0925\u0940, \u0924\u093E\u0915\u093F \u0930\u093E\u092E-\u0915\u0925\u093E \u091C\u0928-\u0938\u093E\u0927\u093E\u0930\u0923 \u0924\u0915 \u092A\u0939\u0941\u0902\u091A\u0947\u0964",
      explanationEnglish: "Goswami Tulsidas composed the epic Ramcharitmanas in the Awadhi language to make Lord Rama's story accessible to the general public.",
      ref: "Ramcharitmanas"
    },
    {
      textHindi: "\u0930\u093E\u092E\u091A\u0930\u093F\u0924\u092E\u093E\u0928\u0938 \u0915\u093E \u0938\u0930\u094D\u0935\u092A\u094D\u0930\u0925\u092E \u0914\u0930 \u0938\u092C\u0938\u0947 \u092C\u0921\u093C\u093E \u0915\u093E\u0923\u094D\u0921 \u0915\u094C\u0928 \u0938\u093E \u0939\u0948?",
      textEnglish: "Which is the first and largest Kanda of Ramcharitmanas?",
      optionsHindi: ["\u092C\u093E\u0932\u0915\u093E\u0923\u094D\u0921", "\u0905\u092F\u094B\u0927\u094D\u092F\u093E\u0915\u093E\u0923\u094D\u0921", "\u0938\u0941\u0928\u094D\u0926\u0930\u0915\u093E\u0923\u094D\u0921", "\u0932\u0902\u0915\u093E\u0915\u093E\u0923\u094D\u0921"],
      optionsEnglish: ["Bala Kanda", "Ayodhya Kanda", "Sundar Kanda", "Lanka Kanda"],
      correctHindi: "\u092C\u093E\u0932\u0915\u093E\u0923\u094D\u0921",
      correctEnglish: "Bala Kanda",
      explanationHindi: "\u092C\u093E\u0932\u0915\u093E\u0923\u094D\u0921 \u0930\u093E\u092E\u091A\u0930\u093F\u0924\u092E\u093E\u0928\u0938 \u0915\u093E \u092A\u0939\u0932\u093E \u0914\u0930 \u0938\u092C\u0938\u0947 \u092C\u0921\u093C\u093E \u0915\u093E\u0923\u094D\u0921 \u0939\u0948, \u091C\u093F\u0938\u092E\u0947\u0902 \u0930\u093E\u092E-\u091C\u0928\u094D\u092E \u0914\u0930 \u092C\u093E\u0932 \u0932\u0940\u0932\u093E\u090F\u0902 \u0939\u0948\u0902\u0964",
      explanationEnglish: "Bala Kanda is the first and largest Kanda of Ramcharitmanas, describing the birth and childhood of Lord Rama.",
      ref: "Bala Kanda"
    },
    {
      textHindi: "\u0930\u093E\u092E\u091A\u0930\u093F\u0924\u092E\u093E\u0928\u0938 \u0915\u0947 \u0905\u0928\u0941\u0938\u093E\u0930, \u0932\u0915\u094D\u0937\u094D\u092E\u0923 \u091C\u0940 \u0915\u094B \u0915\u093F\u0938\u0915\u093E \u0905\u0935\u0924\u093E\u0930 \u092E\u093E\u0928\u093E \u091C\u093E\u0924\u093E \u0939\u0948?",
      textEnglish: "According to Ramcharitmanas, Lakshmana is considered an incarnation of whom?",
      optionsHindi: ["\u0936\u0947\u0937\u0928\u093E\u0917", "\u092D\u0917\u0935\u093E\u0928 \u0935\u093F\u0937\u094D\u0923\u0941", "\u092D\u0930\u0924", "\u092A\u0935\u0928\u0926\u0947\u0935"],
      optionsEnglish: ["Sheshnag", "Lord Vishnu", "Bharata", "Pawandev"],
      correctHindi: "\u0936\u0947\u0937\u0928\u093E\u0917",
      correctEnglish: "Sheshnag",
      explanationHindi: "\u0932\u0915\u094D\u0937\u094D\u092E\u0923 \u091C\u0940 \u0915\u094B \u092A\u093E\u0924\u093E\u0932 \u0932\u094B\u0915 \u0915\u0947 \u0938\u094D\u0935\u093E\u092E\u0940 \u0936\u0947\u0937\u0928\u093E\u0917 \u0915\u093E \u0905\u0935\u0924\u093E\u0930 \u092E\u093E\u0928\u093E \u091C\u093E\u0924\u093E \u0939\u0948\u0964",
      explanationEnglish: "Lakshmana is considered the incarnation of Sheshnag, the king of serpents.",
      ref: "Ramcharitmanas"
    },
    {
      textHindi: "\u0930\u093E\u092E\u091A\u0930\u093F\u0924\u092E\u093E\u0928\u0938 \u0915\u0947 \u0905\u0928\u0941\u0938\u093E\u0930 \u092D\u0917\u0935\u093E\u0928 \u0936\u093F\u0935 \u0928\u0947 \u092F\u0939 \u0915\u0925\u093E \u0938\u0930\u094D\u0935\u092A\u094D\u0930\u0925\u092E \u0915\u093F\u0938\u0947 \u0938\u0941\u0928\u093E\u0908 \u0925\u0940?",
      textEnglish: "According to Ramcharitmanas, to whom did Lord Shiva first narrate this story?",
      optionsHindi: ["\u092E\u093E\u0924\u093E \u092A\u093E\u0930\u094D\u0935\u0924\u0940", "\u0915\u093E\u0915\u092D\u0941\u0936\u0941\u0923\u094D\u0921\u093F", "\u092F\u093E\u091C\u094D\u091E\u0935\u0932\u094D\u0915\u094D\u092F", "\u0924\u0941\u0932\u0938\u0940\u0926\u093E\u0938"],
      optionsEnglish: ["Goddess Parvati", "Kakbhushundi", "Yajnavalkya", "Tulsidas"],
      correctHindi: "\u092E\u093E\u0924\u093E \u092A\u093E\u0930\u094D\u0935\u0924\u0940",
      correctEnglish: "Goddess Parvati",
      explanationHindi: "\u092D\u0917\u0935\u093E\u0928 \u0936\u093F\u0935 \u0928\u0947 \u0930\u093E\u092E\u091A\u0930\u093F\u0924\u092E\u093E\u0928\u0938 \u0915\u0940 \u092A\u093E\u0935\u0928 \u0915\u0925\u093E \u0938\u092C\u0938\u0947 \u092A\u0939\u0932\u0947 \u092E\u093E\u0924\u093E \u092A\u093E\u0930\u094D\u0935\u0924\u0940 \u0915\u094B \u0938\u0941\u0928\u093E\u0908 \u0925\u0940\u0964",
      explanationEnglish: "Lord Shiva first narrated this sacred story of Lord Rama to Goddess Parvati.",
      ref: "Ramcharitmanas"
    }
  ];
  const valmikiTemplates = [
    {
      textHindi: "\u0935\u093E\u0932\u094D\u092E\u0940\u0915\u093F \u0930\u093E\u092E\u093E\u092F\u0923 \u0915\u0940 \u0930\u091A\u0928\u093E \u092E\u0942\u0932\u0924\u0903 \u0915\u093F\u0938 \u092D\u093E\u0937\u093E \u092E\u0947\u0902 \u0939\u0941\u0908 \u0939\u0948?",
      textEnglish: "In which language was Valmiki Ramayana originally composed?",
      optionsHindi: ["\u0938\u0902\u0938\u094D\u0915\u0943\u0924", "\u0905\u0935\u0927\u0940", "\u092A\u093E\u0932\u0940", "\u092A\u094D\u0930\u093E\u0915\u0943\u0924"],
      optionsEnglish: ["Sanskrit", "Awadhi", "Pali", "Prakrit"],
      correctHindi: "\u0938\u0902\u0938\u094D\u0915\u0943\u0924",
      correctEnglish: "Sanskrit",
      explanationHindi: "\u092E\u0939\u0930\u094D\u0937\u093F \u0935\u093E\u0932\u094D\u092E\u0940\u0915\u093F \u0926\u094D\u0935\u093E\u0930\u093E \u0930\u091A\u093F\u0924 \u0930\u093E\u092E\u093E\u092F\u0923 \u092E\u0942\u0932\u0924\u0903 \u0938\u0902\u0938\u094D\u0915\u0943\u0924 \u092D\u093E\u0937\u093E \u0915\u0947 \u0905\u0928\u0941\u0937\u094D\u091F\u0941\u092A \u091B\u0902\u0926 \u092E\u0947\u0902 \u0930\u091A\u093F\u0924 \u0906\u0926\u093F \u0915\u093E\u0935\u094D\u092F \u0939\u0948\u0964",
      explanationEnglish: "The Valmiki Ramayana is the original epic written in Sanskrit language.",
      ref: "Valmiki Ramayana"
    },
    {
      textHindi: "\u0935\u093E\u0932\u094D\u092E\u0940\u0915\u093F \u0930\u093E\u092E\u093E\u092F\u0923 \u0915\u0947 \u0905\u0928\u0941\u0938\u093E\u0930 \u0936\u094D\u0930\u0940\u0930\u093E\u092E \u0915\u0947 \u0915\u0941\u0932 \u0915\u093E \u0915\u094D\u092F\u093E \u0928\u093E\u092E \u0925\u093E?",
      textEnglish: "According to Valmiki Ramayana, what was the name of Rama's dynasty?",
      optionsHindi: ["\u0907\u0915\u094D\u0937\u094D\u0935\u093E\u0915\u0941 \u0935\u0902\u0936 (\u0938\u0942\u0930\u094D\u092F\u0935\u0902\u0936)", "\u091A\u0928\u094D\u0926\u094D\u0930\u0935\u0902\u0936", "\u0915\u0941\u0930\u0941\u0935\u0902\u0936", "\u092F\u0926\u0941\u0935\u0902\u0936"],
      optionsEnglish: ["Ikshvaku Dynasty (Suryavansh)", "Chandravansh", "Kuruvansh", "Yaduvansh"],
      correctHindi: "\u0907\u0915\u094D\u0937\u094D\u0935\u093E\u0915\u0941 \u0935\u0902\u0936 (\u0938\u0942\u0930\u094D\u092F\u0935\u0902\u0936)",
      correctEnglish: "Ikshvaku Dynasty (Suryavansh)",
      explanationHindi: "\u092D\u0917\u0935\u093E\u0928 \u0936\u094D\u0930\u0940\u0930\u093E\u092E \u0907\u0915\u094D\u0937\u094D\u0935\u093E\u0915\u0941 \u0915\u0941\u0932 (\u0938\u0942\u0930\u094D\u092F\u0935\u0902\u0936) \u0915\u0947 \u092A\u094D\u0930\u0924\u093E\u092A\u0940 \u0930\u093E\u091C\u093E \u0925\u0947\u0964",
      explanationEnglish: "Lord Rama belonged to the prestigious Ikshvaku (Suryavansh) lineage.",
      ref: "Valmiki Ramayana"
    },
    {
      textHindi: "\u0935\u093E\u0932\u094D\u092E\u0940\u0915\u093F \u0930\u093E\u092E\u093E\u092F\u0923 \u092E\u0947\u0902 \u0915\u0941\u0932 \u0915\u093F\u0924\u0928\u0947 \u0936\u094D\u0932\u094B\u0915 \u0938\u0902\u0915\u0932\u093F\u0924 \u0939\u0948\u0902?",
      textEnglish: "How many verses (shlokas) are there in Valmiki Ramayana?",
      optionsHindi: ["24,000 \u0936\u094D\u0932\u094B\u0915", "18,000 \u0936\u094D\u0932\u094B\u0915", "10,000 \u0936\u094D\u0932\u094B\u0915", "100,000 \u0936\u094D\u0932\u094B\u0915"],
      optionsEnglish: ["24,000 Verses", "18,000 Verses", "10,000 Verses", "100,000 Verses"],
      correctHindi: "24,000 \u0936\u094D\u0932\u094B\u0915",
      correctEnglish: "24,000 Verses",
      explanationHindi: "\u0935\u093E\u0932\u094D\u092E\u0940\u0915\u093F \u0930\u093E\u092E\u093E\u092F\u0923 \u092E\u0947\u0902 \u0915\u0941\u0932 24,000 \u0936\u094D\u0932\u094B\u0915, 500 \u0938\u0930\u094D\u0917 \u0914\u0930 7 \u0915\u093E\u0923\u094D\u0921 \u0939\u0948\u0902\u0964",
      explanationEnglish: "Valmiki Ramayana contains 24,000 verses, 500 sargas, and 7 Kandas.",
      ref: "Valmiki Ramayana"
    },
    {
      textHindi: "\u092E\u0939\u0930\u094D\u0937\u093F \u0935\u093E\u0932\u094D\u092E\u0940\u0915\u093F \u0915\u093E \u092A\u0942\u0930\u094D\u0935 \u0928\u093E\u092E (\u092E\u0942\u0932 \u0928\u093E\u092E) \u0915\u094D\u092F\u093E \u0925\u093E?",
      textEnglish: "What was the original name of Sage Valmiki before he became a sage?",
      optionsHindi: ["\u0930\u0924\u094D\u0928\u093E\u0915\u0930", "\u0938\u093F\u0926\u094D\u0927\u093E\u0930\u094D\u0925", "\u0926\u0947\u0935\u0930\u0924", "\u0935\u093E\u0932\u094D\u092E\u0940"],
      optionsEnglish: ["Ratnakar", "Siddhartha", "Devarat", "Valmi"],
      correctHindi: "\u0930\u0924\u094D\u0928\u093E\u0915\u0930",
      correctEnglish: "Ratnakar",
      explanationHindi: "\u092E\u0939\u0930\u094D\u0937\u093F \u0935\u093E\u0932\u094D\u092E\u0940\u0915\u093F \u0915\u093E \u092A\u0942\u0930\u094D\u0935 \u0928\u093E\u092E \u0930\u0924\u094D\u0928\u093E\u0915\u0930 \u0925\u093E, \u091C\u094B \u092C\u093E\u0926 \u092E\u0947\u0902 '\u092E\u0930\u093E-\u092E\u0930\u093E' \u0915\u0947 \u091C\u093E\u092A \u0938\u0947 \u092E\u0939\u0930\u094D\u0937\u093F \u092C\u0928\u0947\u0964",
      explanationEnglish: "Valmiki's original name was Ratnakar, who later transformed into a sage.",
      ref: "Valmiki Ramayana"
    },
    {
      textHindi: "\u0930\u093E\u091C\u093E \u0926\u0936\u0930\u0925 \u0915\u0940 \u0909\u0938 \u092A\u0941\u0924\u094D\u0930\u0940 \u0915\u093E \u0915\u094D\u092F\u093E \u0928\u093E\u092E \u0925\u093E \u091C\u094B \u0936\u094D\u0930\u0940\u0930\u093E\u092E \u0915\u0940 \u092C\u0921\u093C\u0940 \u092C\u0939\u0928 \u0925\u0940\u0902?",
      textEnglish: "What was the name of King Dasharatha's daughter who was Lord Rama's elder sister?",
      optionsHindi: ["\u0936\u093E\u0928\u094D\u0924\u093E", "\u0909\u0930\u094D\u092E\u093F\u0932\u093E", "\u092E\u0928\u094D\u0926\u094B\u0926\u0930\u0940", "\u0936\u094D\u0930\u0941\u0924\u0915\u0940\u0930\u094D\u0924\u093F"],
      optionsEnglish: ["Shanta", "Urmila", "Mandodari", "Shrutakirti"],
      correctHindi: "\u0936\u093E\u0928\u094D\u0924\u093E",
      correctEnglish: "Shanta",
      explanationHindi: "\u0930\u093E\u091C\u093E \u0926\u0936\u0930\u0925 \u0914\u0930 \u0915\u094C\u0936\u0932\u094D\u092F\u093E \u0915\u0940 \u092A\u0941\u0924\u094D\u0930\u0940 \u0936\u093E\u0928\u094D\u0924\u093E \u0925\u0940\u0902, \u091C\u093F\u0928\u094D\u0939\u0947\u0902 \u0905\u0902\u0917\u0926\u0947\u0936 \u0915\u0947 \u0930\u093E\u091C\u093E \u0930\u094B\u092E\u092A\u093E\u0926 \u0928\u0947 \u0917\u094B\u0926 \u0932\u093F\u092F\u093E \u0925\u093E\u0964",
      explanationEnglish: "Shanta was the daughter of Dasharatha and Kausalya, later adopted by King Romapada.",
      ref: "Valmiki Ramayana"
    }
  ];
  const radhaTemplates = [
    {
      textHindi: "\u0930\u093E\u0927\u093E \u0915\u0943\u092A\u093E \u0915\u091F\u093E\u0915\u094D\u0937 \u0938\u094D\u0924\u094B\u0924\u094D\u0930 \u0915\u093F\u0938 \u0926\u0947\u0935\u0940 \u0915\u094B \u0938\u092E\u0930\u094D\u092A\u093F\u0924 \u0939\u0948?",
      textEnglish: "To which Goddess is the Radha Kripa Kataksh Stotram dedicated?",
      optionsHindi: ["\u0936\u094D\u0930\u0940 \u0930\u093E\u0927\u093E \u0930\u093E\u0928\u0940", "\u092E\u093E\u0924\u093E \u0926\u0941\u0930\u094D\u0917\u093E", "\u092E\u093E\u0924\u093E \u0932\u0915\u094D\u0937\u094D\u092E\u0940", "\u092E\u093E\u0924\u093E \u0938\u0930\u0938\u094D\u0935\u0924\u0940"],
      optionsEnglish: ["Shri Radha Rani", "Goddess Durga", "Goddess Lakshmi", "Goddess Saraswati"],
      correctHindi: "\u0936\u094D\u0930\u0940 \u0930\u093E\u0927\u093E \u0930\u093E\u0928\u0940",
      correctEnglish: "Shri Radha Rani",
      explanationHindi: "\u092F\u0939 \u0938\u094D\u0924\u094B\u0924\u094D\u0930 \u092C\u0930\u0938\u093E\u0928\u0947 \u0915\u0940 \u0905\u0927\u093F\u0937\u094D\u0920\u093E\u0924\u094D\u0930\u0940 \u0926\u0947\u0935\u0940 \u0936\u094D\u0930\u0940 \u0930\u093E\u0927\u093E \u0930\u093E\u0928\u0940 \u0915\u0940 \u0915\u0943\u092A\u093E \u092A\u094D\u0930\u093E\u092A\u094D\u0924\u093F \u0915\u0947 \u0932\u093F\u090F \u0917\u093E\u092F\u093E \u091C\u093E\u0924\u093E \u0939\u0948\u0964",
      explanationEnglish: "This stotram is dedicated to gaining the mercy and side-glance of Sri Radha Rani.",
      ref: "Radha Kripa Kataksh"
    },
    {
      textHindi: "\u0930\u093E\u0927\u093E \u0915\u0943\u092A\u093E \u0915\u091F\u093E\u0915\u094D\u0937 \u0938\u094D\u0924\u094B\u0924\u094D\u0930 \u0915\u0947 \u0930\u091A\u092F\u093F\u0924\u093E \u0915\u094C\u0928 \u092E\u093E\u0928\u0947 \u091C\u093E\u0924\u0947 \u0939\u0948\u0902?",
      textEnglish: "Who is traditionally considered the composer of Radha Kripa Kataksh?",
      optionsHindi: ["\u092D\u0917\u0935\u093E\u0928 \u0936\u093F\u0935", "\u0936\u094D\u0930\u0940 \u0915\u0943\u0937\u094D\u0923", "\u0926\u0947\u0935\u0930\u094D\u0937\u093F \u0928\u093E\u0930\u0926", "\u0936\u0902\u0915\u0930\u093E\u091A\u093E\u0930\u094D\u092F"],
      optionsEnglish: ["Lord Shiva", "Lord Krishna", "Devarshi Narada", "Adi Shankaracharya"],
      correctHindi: "\u092D\u0917\u0935\u093E\u0928 \u0936\u093F\u0935",
      correctEnglish: "Lord Shiva",
      explanationHindi: "\u0924\u0902\u0924\u094D\u0930 \u0936\u093E\u0938\u094D\u0924\u094D\u0930 \u0915\u0947 \u0905\u0928\u0941\u0938\u093E\u0930 \u0907\u0938 \u0926\u093F\u0935\u094D\u092F \u0938\u094D\u0924\u094B\u0924\u094D\u0930 \u0915\u0940 \u0930\u091A\u0928\u093E \u0938\u094D\u0935\u092F\u0902 \u0926\u0947\u0935\u093E\u0927\u093F\u0926\u0947\u0935 \u092E\u0939\u093E\u0926\u0947\u0935 (\u0936\u093F\u0935) \u0928\u0947 \u0936\u094D\u0930\u0940 \u0930\u093E\u0927\u093E \u0915\u0940 \u0938\u094D\u0924\u0941\u0924\u093F \u092E\u0947\u0902 \u0915\u0940 \u0939\u0948\u0964",
      explanationEnglish: "According to scriptures, this divine stotram was composed by Lord Shiva.",
      ref: "Radha Kripa Kataksh"
    },
    {
      textHindi: "\u0930\u093E\u0927\u093E \u0915\u0943\u092A\u093E \u0915\u091F\u093E\u0915\u094D\u0937 \u092E\u0947\u0902 '\u0915\u091F\u093E\u0915\u094D\u0937' \u0936\u092C\u094D\u0926 \u0915\u093E \u0906\u0927\u094D\u092F\u093E\u0924\u094D\u092E\u093F\u0915 \u0905\u0930\u094D\u0925 \u0915\u094D\u092F\u093E \u0939\u0948?",
      textEnglish: "What is the spiritual meaning of 'Kataksh' in Radha Kripa Kataksh?",
      optionsHindi: ["\u0915\u0943\u092A\u093E \u0926\u0943\u0937\u094D\u091F\u093F (\u0924\u093F\u0930\u091B\u0940 \u091A\u093F\u0924\u0935\u0928)", "\u0915\u094D\u0930\u094B\u0927", "\u0928\u093F\u0902\u0926\u093E", "\u0936\u0938\u094D\u0924\u094D\u0930"],
      optionsEnglish: ["Merciful Side Glance", "Anger", "Criticism", "Weapon"],
      correctHindi: "\u0915\u0943\u092A\u093E \u0926\u0943\u0937\u094D\u091F\u093F (\u0924\u093F\u0930\u091B\u0940 \u091A\u093F\u0924\u0935\u0928)",
      correctEnglish: "Merciful Side Glance",
      explanationHindi: "\u0915\u091F\u093E\u0915\u094D\u0937 \u0915\u093E \u0905\u0930\u094D\u0925 \u0939\u0948 \u0915\u0943\u092A\u093E \u092D\u0930\u0940 \u0924\u093F\u0930\u091B\u0940 \u091A\u093F\u0924\u0935\u0928 \u092F\u093E \u0915\u0930\u0941\u0923\u093E\u092E\u092F\u0940 \u0926\u0943\u0937\u094D\u091F\u093F, \u091C\u094B \u092D\u0915\u094D\u0924\u094B\u0902 \u0915\u0947 \u0938\u093E\u0930\u0947 \u0915\u0937\u094D\u091F \u0939\u0930 \u0932\u0947\u0924\u0940 \u0939\u0948\u0964",
      explanationEnglish: "Kataksh means a merciful, compassionate glance from Radha Rani's eyes.",
      ref: "Radha Kripa Kataksh"
    },
    {
      textHindi: "\u0936\u094D\u0930\u0940 \u0930\u093E\u0927\u093E \u0930\u093E\u0928\u0940 \u0915\u093E \u092A\u094D\u0930\u093E\u0915\u091F\u094D\u092F \u0938\u094D\u0925\u093E\u0928 \u092C\u0930\u0938\u093E\u0928\u0947 \u0915\u0947 \u092A\u093E\u0938 \u0915\u093F\u0938 \u0917\u094D\u0930\u093E\u092E \u0915\u094B \u092E\u093E\u0928\u093E \u091C\u093E\u0924\u093E \u0939\u0948?",
      textEnglish: "Which village near Barsana is considered the birthplace of Shri Radha Rani?",
      optionsHindi: ["\u0930\u093E\u0935\u0932 \u0917\u094D\u0930\u093E\u092E", "\u092E\u0925\u0941\u0930\u093E", "\u0935\u0943\u0928\u094D\u0926\u093E\u0935\u0928", "\u0926\u094D\u0935\u093E\u0930\u0915\u093E"],
      optionsEnglish: ["Rawal Village", "Mathura", "Vrindavan", "Dwarka"],
      correctHindi: "\u0930\u093E\u0935\u0932 \u0917\u094D\u0930\u093E\u092E",
      correctEnglish: "Rawal Village",
      explanationHindi: "\u0936\u094D\u0930\u0940 \u0930\u093E\u0927\u093E \u091C\u0940 \u0915\u093E \u092A\u094D\u0930\u093E\u0915\u091F\u094D\u092F \u092C\u0930\u0938\u093E\u0928\u0947 \u0915\u0947 \u0928\u093F\u0915\u091F \u0930\u093E\u0935\u0932 \u0917\u094D\u0930\u093E\u092E \u092E\u0947\u0902 \u092E\u093E\u0924\u093E \u0915\u0940\u0930\u094D\u0924\u093F \u0914\u0930 \u0935\u0943\u0937\u092D\u093E\u0928\u0941 \u091C\u0940 \u0915\u0947 \u092F\u0939\u093E\u0901 \u0939\u0941\u0906 \u0925\u093E\u0964",
      explanationEnglish: "Sri Radha Rani manifested in Rawal village near Barsana.",
      ref: "Radha Kripa Kataksh"
    },
    {
      textHindi: "\u0907\u0938 \u0938\u094D\u0924\u094B\u0924\u094D\u0930 \u0915\u093E \u092A\u093E\u0920 \u0915\u0930\u0928\u0947 \u0938\u0947 \u0938\u093E\u0927\u0915 \u0915\u094B \u0915\u093F\u0938\u0915\u0940 \u092A\u0930\u092E \u092D\u0915\u094D\u0924\u093F \u092A\u094D\u0930\u093E\u092A\u094D\u0924 \u0939\u094B\u0924\u0940 \u0939\u0948?",
      textEnglish: "Reciting this stotram grants the devotee whose ultimate devotion?",
      optionsHindi: ["\u0930\u093E\u0927\u093E-\u0915\u0943\u0937\u094D\u0923 \u0915\u0940 \u092F\u0941\u0917\u0932 \u092D\u0915\u094D\u0924\u093F", "\u0915\u0947\u0935\u0932 \u0927\u0928", "\u0936\u0915\u094D\u0924\u093F", "\u092E\u094B\u0915\u094D\u0937"],
      optionsEnglish: ["Yugal Devotion of Radha-Krishna", "Only wealth", "Power", "Salvation"],
      correctHindi: "\u0930\u093E\u0927\u093E-\u0915\u0943\u0937\u094D\u0923 \u0915\u0940 \u092F\u0941\u0917\u0932 \u092D\u0915\u094D\u0924\u093F",
      correctEnglish: "Yugal Devotion of Radha-Krishna",
      explanationHindi: "\u0930\u093E\u0927\u093E \u0915\u0943\u092A\u093E \u0915\u091F\u093E\u0915\u094D\u0937 \u0915\u093E \u0928\u093F\u092F\u092E\u093F\u0924 \u092A\u093E\u0920 \u0915\u0930\u0928\u0947 \u0938\u0947 \u0936\u094D\u0930\u0940 \u0915\u0943\u0937\u094D\u0923 \u0914\u0930 \u0936\u094D\u0930\u0940 \u0930\u093E\u0927\u093E \u0915\u0940 \u0905\u0928\u0928\u094D\u092F \u0928\u093F\u0915\u0941\u0902\u091C \u092D\u0915\u094D\u0924\u093F \u092A\u094D\u0930\u093E\u092A\u094D\u0924 \u0939\u094B\u0924\u0940 \u0939\u0948\u0964",
      explanationEnglish: "Regular recitation of Radha Kripa Kataksh bestows the highest devotion of Radha and Krishna.",
      ref: "Radha Kripa Kataksh"
    }
  ];
  const hanumanTemplates = [
    {
      textHindi: "\u0939\u0928\u0941\u092E\u093E\u0928 \u091A\u093E\u0932\u0940\u0938\u093E \u092E\u0947\u0902 \u0915\u0941\u0932 \u0915\u093F\u0924\u0928\u0940 \u091A\u094C\u092A\u093E\u0907\u092F\u093E\u0902 (stanzas) \u0938\u0902\u0915\u0932\u093F\u0924 \u0939\u0948\u0902?",
      textEnglish: "How many chaupais (stanzas) are there in Hanuman Chalisa?",
      optionsHindi: ["40 \u091A\u094C\u092A\u093E\u0907\u092F\u093E\u0902", "30 \u091A\u094C\u092A\u093E\u0907\u092F\u093E\u0902", "50 \u091A\u094C\u092A\u093E\u0907\u092F\u093E\u0902", "108 \u091A\u094C\u092A\u093E\u0907\u092F\u093E\u0902"],
      optionsEnglish: ["40 Chaupais", "30 Chaupais", "50 Chaupais", "108 Chaupais"],
      correctHindi: "40 \u091A\u094C\u092A\u093E\u0907\u092F\u093E\u0902",
      correctEnglish: "40 Chaupais",
      explanationHindi: "'\u091A\u093E\u0932\u0940\u0938\u093E' \u0936\u092C\u094D\u0926 \u091A\u093E\u0932\u0940\u0938 (40) \u0938\u0947 \u092C\u0928\u093E \u0939\u0948, \u0915\u094D\u092F\u094B\u0902\u0915\u093F \u0907\u0938\u092E\u0947\u0902 \u091A\u093E\u0932\u0940\u0938 \u092E\u0941\u0916\u094D\u092F \u091A\u094C\u092A\u093E\u0907\u092F\u093E\u0902 \u0939\u0948\u0902\u0964",
      explanationEnglish: "The word 'Chalisa' is derived from 'chalis' (40), indicating forty verses.",
      ref: "Hanuman Chalisa"
    },
    {
      textHindi: "\u0939\u0928\u0941\u092E\u093E\u0928 \u091A\u093E\u0932\u0940\u0938\u093E \u0915\u093E \u092A\u094D\u0930\u093E\u0930\u0902\u092D \u0915\u093F\u0928 \u092A\u094D\u0930\u0938\u093F\u0926\u094D\u0927 \u0917\u0941\u0930\u0941 \u0935\u0902\u0926\u0928\u093E \u0915\u0947 \u0926\u094B\u0939\u094B\u0902 \u0938\u0947 \u0939\u094B\u0924\u093E \u0939\u0948?",
      textEnglish: "With which famous couplets (dohas) does the Hanuman Chalisa begin?",
      optionsHindi: ["\u0936\u094D\u0930\u0940\u0917\u0941\u0930\u0941 \u091A\u0930\u0928 \u0938\u0930\u094B\u091C \u0930\u091C...", "\u091C\u092F \u0939\u0928\u0941\u092E\u093E\u0928 \u091C\u094D\u091E\u093E\u0928 \u0917\u0941\u0928 \u0938\u093E\u0917\u0930...", "\u0930\u093E\u092E \u0926\u0942\u0924 \u0905\u0924\u0941\u0932\u093F\u0924 \u092C\u0932 \u0927\u093E\u092E\u093E...", "\u092A\u094D\u0930\u092D\u0941 \u091A\u0930\u093F\u0924\u094D\u0930 \u0938\u0941\u0928\u093F\u092C\u0947 \u0915\u094B \u0930\u0938\u093F\u092F\u093E..."],
      optionsEnglish: ["Shri Guru Charan Saroj Raja...", "Jai Hanuman Gyan Gun Sagar...", "Ram Doot Dixit Bal Dhama...", "Prabhu Charitra Sunibe Ko Rasiya..."],
      correctHindi: "\u0936\u094D\u0930\u0940\u0917\u0941\u0930\u0941 \u091A\u0930\u0928 \u0938\u0930\u094B\u091C \u0930\u091C...",
      correctEnglish: "Shri Guru Charan Saroj Raja...",
      explanationHindi: "\u0939\u0928\u0941\u092E\u093E\u0928 \u091A\u093E\u0932\u0940\u0938\u093E \u0915\u0940 \u0936\u0941\u0930\u0941\u0906\u0924 '\u0936\u094D\u0930\u0940\u0917\u0941\u0930\u0941 \u091A\u0930\u0928 \u0938\u0930\u094B\u091C \u0930\u091C \u0928\u093F\u091C \u092E\u0928\u0941 \u092E\u0941\u0915\u0941\u0930\u0941 \u0938\u0941\u0927\u093E\u0930\u093F' \u0926\u094B\u0939\u0947 \u0938\u0947 \u0939\u094B\u0924\u0940 \u0939\u0948\u0964",
      explanationEnglish: "The Hanuman Chalisa starts with the doha 'Shri Guru Charan Saroj Raja...' invoking the Guru.",
      ref: "Hanuman Chalisa"
    },
    {
      textHindi: "\u0939\u0928\u0941\u092E\u093E\u0928 \u091C\u0940 \u0915\u0947 \u092E\u093E\u0924\u093E-\u092A\u093F\u0924\u093E \u0915\u093E \u0928\u093E\u092E \u0915\u094D\u092F\u093E \u0939\u0948?",
      textEnglish: "What are the names of Hanuman's parents?",
      optionsHindi: ["\u0905\u0902\u091C\u0928\u0940 \u0914\u0930 \u0915\u0947\u0938\u0930\u0940", "\u0915\u094C\u0936\u0932\u094D\u092F\u093E \u0914\u0930 \u0926\u0936\u0930\u0925", "\u0938\u0941\u092E\u093F\u0924\u094D\u0930\u093E \u0914\u0930 \u0915\u0947\u0938\u0930\u0940", "\u0905\u0902\u091C\u0928\u0940 \u0914\u0930 \u0935\u093E\u092F\u0941\u0926\u0947\u0935"],
      optionsEnglish: ["Anjani and Kesari", "Kausalya and Dasharatha", "Sumitra and Kesari", "Anjani and Vayudev"],
      correctHindi: "\u0905\u0902\u091C\u0928\u0940 \u0914\u0930 \u0915\u0947\u0938\u0930\u0940",
      correctEnglish: "Anjani and Kesari",
      explanationHindi: "\u0939\u0928\u0941\u092E\u093E\u0928 \u091C\u0940 \u0915\u094B \u0905\u0902\u091C\u0928\u0940\u092A\u0941\u0924\u094D\u0930 \u0914\u0930 \u0915\u0947\u0938\u0930\u0940\u0928\u0902\u0926\u0928 \u0915\u0939\u093E \u091C\u093E\u0924\u093E \u0939\u0948, \u0938\u093E\u0925 \u0939\u0940 \u0935\u0947 \u092A\u0935\u0928\u092A\u0941\u0924\u094D\u0930 \u092D\u0940 \u0939\u0948\u0902\u0964",
      explanationEnglish: "Hanuman's parents are Mother Anjana (Anjani) and King Kesari. He is also the spiritual son of Vayu Dev.",
      ref: "Hanuman Chalisa"
    },
    {
      textHindi: "\u0939\u0928\u0941\u092E\u093E\u0928 \u091A\u093E\u0932\u0940\u0938\u093E \u0915\u0947 \u0905\u0928\u0941\u0938\u093E\u0930 \u0939\u0928\u0941\u092E\u093E\u0928 \u091C\u0940 \u0928\u0947 \u0905\u0936\u094B\u0915 \u0935\u093E\u091F\u093F\u0915\u093E \u092E\u0947\u0902 \u0938\u0940\u0924\u093E \u091C\u0940 \u0915\u094B \u0915\u093F\u0938\u0915\u0940 \u0905\u0902\u0917\u0942\u0920\u0940 \u0926\u0940 \u0925\u0940?",
      textEnglish: "According to Hanuman Chalisa, whose ring did Hanuman give to Sita in Ashok Vatika?",
      optionsHindi: ["\u0930\u093E\u092E\u091A\u0928\u094D\u0926\u094D\u0930 \u091C\u0940 \u0915\u0940", "\u0932\u0915\u094D\u0937\u094D\u092E\u0923 \u091C\u0940 \u0915\u0940", "\u0930\u093E\u0935\u0923 \u0915\u0940", "\u0938\u0941\u0917\u094D\u0930\u0940\u0935 \u0915\u0940"],
      optionsEnglish: ["Lord Ramachandra's", "Lakshmana's", "Ravana's", "Sugriva's"],
      correctHindi: "\u0930\u093E\u092E\u091A\u0928\u094D\u0926\u094D\u0930 \u091C\u0940 \u0915\u0940",
      correctEnglish: "Lord Ramachandra's",
      explanationHindi: "'\u092A\u094D\u0930\u092D\u0941 \u092E\u0941\u0926\u094D\u0930\u093F\u0915\u093E \u092E\u0947\u0932\u093F \u092E\u0941\u0916 \u092E\u093E\u0939\u0940\u0902' \u0915\u0947 \u0905\u0928\u0941\u0938\u093E\u0930 \u0939\u0928\u0941\u092E\u093E\u0928 \u091C\u0940 \u0936\u094D\u0930\u0940 \u0930\u093E\u092E \u0915\u0940 \u0905\u0902\u0917\u0942\u0920\u0940 \u0932\u0947\u0915\u0930 \u0938\u092E\u0941\u0926\u094D\u0930 \u0932\u093E\u0902\u0918 \u0917\u090F \u0925\u0947\u0964",
      explanationEnglish: "Hanuman carried Sri Ram's signet ring in his mouth across the ocean.",
      ref: "Hanuman Chalisa"
    },
    {
      textHindi: "\u0905\u0937\u094D\u091F \u0938\u093F\u0926\u094D\u0927\u093F \u0928\u0935 \u0928\u093F\u0927\u093F \u0915\u0947 \u0926\u093E\u0924\u093E' \u0939\u0928\u0941\u092E\u093E\u0928 \u091C\u0940 \u0915\u094B \u092F\u0939 \u0935\u0930\u0926\u093E\u0928 \u0915\u093F\u0938\u0928\u0947 \u0926\u093F\u092F\u093E \u0925\u093E?",
      textEnglish: "Who granted Hanuman the boon of being 'giver of eight siddhis and nine nidhis'?",
      optionsHindi: ["\u092E\u093E\u0924\u093E \u091C\u093E\u0928\u0915\u0940 (\u0938\u0940\u0924\u093E)", "\u0936\u094D\u0930\u0940 \u0930\u093E\u092E", "\u092D\u0917\u0935\u093E\u0928 \u0936\u093F\u0935", "\u092C\u094D\u0930\u0939\u094D\u092E\u093E \u091C\u0940"],
      optionsEnglish: ["Mother Janaki (Sita)", "Lord Rama", "Lord Shiva", "Lord Brahma"],
      correctHindi: "\u092E\u093E\u0924\u093E \u091C\u093E\u0928\u0915\u0940 (\u0938\u0940\u0924\u093E)",
      correctEnglish: "Mother Janaki (Sita)",
      explanationHindi: "\u092E\u093E\u0924\u093E \u091C\u093E\u0928\u0915\u0940 \u0928\u0947 \u092A\u094D\u0930\u0938\u0928\u094D\u0928 \u0939\u094B\u0915\u0930 \u0939\u0928\u0941\u092E\u093E\u0928 \u091C\u0940 \u0915\u094B \u0905\u0937\u094D\u091F \u0938\u093F\u0926\u094D\u0927\u093F \u0914\u0930 \u0928\u0935 \u0928\u093F\u0927\u093F \u0915\u093E \u0938\u094D\u0935\u093E\u092E\u0940 \u0939\u094B\u0928\u0947 \u0915\u093E \u0935\u0930\u0926\u093E\u0928 \u0926\u093F\u092F\u093E \u0925\u093E\u0964",
      explanationEnglish: "Mother Sita blessed Hanuman with these powers in Lanka.",
      ref: "Hanuman Chalisa"
    }
  ];
  const vishnuTemplates = [
    {
      textHindi: "\u0935\u093F\u0937\u094D\u0923\u0941 \u0938\u0939\u0938\u094D\u0930\u0928\u093E\u092E \u0915\u093E \u0909\u092A\u0926\u0947\u0936 \u092E\u0939\u093E\u092D\u093E\u0930\u0924 \u0915\u0947 \u0915\u093F\u0938 \u092A\u0930\u094D\u0935 \u092E\u0947\u0902 \u0926\u093F\u092F\u093E \u0917\u092F\u093E \u0939\u0948?",
      textEnglish: "In which Parva of Mahabharata is Vishnu Sahasranama delivered?",
      optionsHindi: ["\u0905\u0928\u0941\u0936\u093E\u0938\u0928 \u092A\u0930\u094D\u0935", "\u092D\u0940\u0937\u094D\u092E \u092A\u0930\u094D\u0935", "\u0936\u093E\u0902\u0924\u093F \u092A\u0930\u094D\u0935", "\u0935\u0928 \u092A\u0930\u094D\u0935"],
      optionsEnglish: ["Anushasana Parva", "Bhishma Parva", "Shanti Parva", "Vana Parva"],
      correctHindi: "\u0905\u0928\u0941\u0936\u093E\u0938\u0928 \u092A\u0930\u094D\u0935",
      correctEnglish: "Anushasana Parva",
      explanationHindi: "\u092F\u0941\u0927\u093F\u0937\u094D\u0920\u093F\u0930 \u0915\u0947 \u0927\u0930\u094D\u092E \u0938\u0902\u092C\u0902\u0927\u0940 \u092A\u094D\u0930\u0936\u094D\u0928\u094B\u0902 \u0915\u093E \u0909\u0924\u094D\u0924\u0930 \u0926\u0947\u0924\u0947 \u0939\u0941\u090F \u092D\u0940\u0937\u094D\u092E \u092A\u093F\u0924\u093E\u092E\u0939 \u0928\u0947 \u0905\u0928\u0941\u0936\u093E\u0938\u0928 \u092A\u0930\u094D\u0935 \u092E\u0947\u0902 \u092F\u0939 \u0909\u092A\u0926\u0947\u0936 \u0926\u093F\u092F\u093E \u0925\u093E\u0964",
      explanationEnglish: "Bhishma Pitamah spoke the 1000 names of Vishnu in the Anushasana Parva of Mahabharata.",
      ref: "Vishnu Sahasranama"
    },
    {
      textHindi: "\u0935\u093F\u0937\u094D\u0923\u0941 \u0938\u0939\u0938\u094D\u0930\u0928\u093E\u092E \u092E\u0947\u0902 \u092D\u0917\u0935\u093E\u0928 \u0935\u093F\u0937\u094D\u0923\u0941 \u0915\u0947 \u0915\u093F\u0924\u0928\u0947 \u0928\u093E\u092E\u094B\u0902 \u0915\u093E \u0915\u0940\u0930\u094D\u0924\u0928 \u0939\u0948?",
      textEnglish: "How many names of Lord Vishnu are chanted in Vishnu Sahasranama?",
      optionsHindi: ["1000 \u0928\u093E\u092E", "108 \u0928\u093E\u092E", "500 \u0928\u093E\u092E", "10000 \u0928\u093E\u092E"],
      optionsEnglish: ["1000 Names", "108 Names", "500 Names", "10000 Names"],
      correctHindi: "1000 \u0928\u093E\u092E",
      correctEnglish: "1000 Names",
      explanationHindi: "'\u0938\u0939\u0938\u094D\u0930' \u0915\u093E \u0905\u0930\u094D\u0925 \u0939\u0948 \u0939\u091C\u093E\u0930, \u0907\u0938\u0932\u093F\u090F \u0907\u0938\u092E\u0947\u0902 \u092D\u0917\u0935\u093E\u0928 \u0935\u093F\u0937\u094D\u0923\u0941 \u0915\u0947 1000 \u0915\u0932\u094D\u092F\u093E\u0923\u0915\u093E\u0930\u0940 \u0928\u093E\u092E\u094B\u0902 \u0915\u093E \u0935\u0930\u094D\u0923\u0928 \u0939\u0948\u0964",
      explanationEnglish: "'Sahasra' means thousand; hence, it contains 1000 names of Vishnu.",
      ref: "Vishnu Sahasranama"
    },
    {
      textHindi: "\u092F\u0941\u0927\u093F\u0937\u094D\u0920\u093F\u0930 \u0915\u094B \u0935\u093F\u0937\u094D\u0923\u0941 \u0938\u0939\u0938\u094D\u0930\u0928\u093E\u092E \u0915\u093E \u0909\u092A\u0926\u0947\u0936 \u092C\u093E\u0923\u094B\u0902 \u0915\u0940 \u0936\u092F\u094D\u092F\u093E \u092A\u0930 \u0932\u0947\u091F\u0947 \u0939\u0941\u090F \u0915\u093F\u0938\u0928\u0947 \u0926\u093F\u092F\u093E \u0925\u093E?",
      textEnglish: "Who delivered the Vishnu Sahasranama to Yudhishthira while lying on a bed of arrows?",
      optionsHindi: ["\u092D\u0940\u0937\u094D\u092E \u092A\u093F\u0924\u093E\u092E\u0939", "\u0936\u094D\u0930\u0940 \u0915\u0943\u0937\u094D\u0923", "\u0935\u0947\u0926 \u0935\u094D\u092F\u093E\u0938", "\u0926\u094D\u0930\u094B\u0923\u093E\u091A\u093E\u0930\u094D\u092F"],
      optionsEnglish: ["Bhishma Pitamah", "Lord Krishna", "Veda Vyasa", "Dronacharya"],
      correctHindi: "\u092D\u0940\u0937\u094D\u092E \u092A\u093F\u0924\u093E\u092E\u0939",
      correctEnglish: "Bhishma Pitamah",
      explanationHindi: "\u092C\u093E\u0923\u094B\u0902 \u0915\u0940 \u0936\u092F\u094D\u092F\u093E \u092A\u0930 \u0932\u0947\u091F\u0947 \u092D\u0940\u0937\u094D\u092E \u0928\u0947 \u092F\u0941\u0927\u093F\u0937\u094D\u0920\u093F\u0930 \u0915\u094B \u092A\u0930\u092E \u0915\u0932\u094D\u092F\u093E\u0923\u0915\u093E\u0930\u0940 \u092E\u093E\u0930\u094D\u0917 \u0915\u0947 \u0930\u0942\u092A \u092E\u0947\u0902 \u0935\u093F\u0937\u094D\u0923\u0941 \u0938\u0939\u0938\u094D\u0930\u0928\u093E\u092E \u0938\u0941\u0928\u093E\u092F\u093E \u0925\u093E\u0964",
      explanationEnglish: "Bhishma Pitamah narrated it from his bed of arrows.",
      ref: "Vishnu Sahasranama"
    },
    {
      textHindi: "\u0935\u093F\u0937\u094D\u0923\u0941 \u0938\u0939\u0938\u094D\u0930\u0928\u093E\u092E \u0915\u0947 \u0905\u0928\u0941\u0938\u093E\u0930 \u092C\u094D\u0930\u0939\u094D\u092E\u093E\u0902\u0921 \u0915\u0947 \u092A\u0930\u092E \u0915\u093E\u0930\u0923 \u0914\u0930 \u0930\u0915\u094D\u0937\u0915 \u0915\u094C\u0928 \u0939\u0948\u0902?",
      textEnglish: "According to Vishnu Sahasranama, who is the ultimate cause and protector of the universe?",
      optionsHindi: ["\u092D\u0917\u0935\u093E\u0928 \u0935\u093F\u0937\u094D\u0923\u0941", "\u0907\u0902\u0926\u094D\u0930 \u0926\u0947\u0935", "\u0935\u0930\u0941\u0923 \u0926\u0947\u0935", "\u092F\u092E\u0930\u093E\u091C"],
      optionsEnglish: ["Lord Vishnu", "Lord Indra", "Lord Varuna", "Lord Yamaraja"],
      correctHindi: "\u092D\u0917\u0935\u093E\u0928 \u0935\u093F\u0937\u094D\u0923\u0941",
      correctEnglish: "Lord Vishnu",
      explanationHindi: "\u0907\u0938 \u0938\u094D\u0924\u094B\u0924\u094D\u0930 \u092E\u0947\u0902 \u092D\u0917\u0935\u093E\u0928 \u0935\u093F\u0937\u094D\u0923\u0941 \u0915\u094B \u091C\u0917\u0924 \u0915\u0940 \u0938\u0943\u0937\u094D\u091F\u093F, \u092A\u093E\u0932\u0928 \u0914\u0930 \u0938\u0902\u0939\u093E\u0930 \u0915\u093E \u092A\u0930\u092E \u0915\u093E\u0930\u0923 \u092C\u0924\u093E\u092F\u093E \u0917\u092F\u093E \u0939\u0948\u0964",
      explanationEnglish: "Lord Vishnu is glorified as the supreme sustainer of the universe.",
      ref: "Vishnu Sahasranama"
    },
    {
      textHindi: "\u0935\u093F\u0937\u094D\u0923\u0941 \u0938\u0939\u0938\u094D\u0930\u0928\u093E\u092E \u0915\u093E \u092A\u093E\u0920 \u0915\u0930\u0928\u0947 \u0938\u0947 \u0915\u093F\u0938 \u092B\u0932 \u0915\u0940 \u092A\u094D\u0930\u093E\u092A\u094D\u0924\u093F \u0939\u094B\u0924\u0940 \u0939\u0948?",
      textEnglish: "What benefit is obtained by reciting Vishnu Sahasranama?",
      optionsHindi: ["\u092A\u093E\u092A\u094B\u0902 \u0915\u093E \u0928\u093E\u0936 \u0914\u0930 \u092E\u093E\u0928\u0938\u093F\u0915 \u0936\u093E\u0902\u0924\u093F", "\u092D\u094C\u0924\u093F\u0915 \u0905\u0939\u0902\u0915\u093E\u0930", "\u0915\u0947\u0935\u0932 \u0927\u0928", "\u0936\u093E\u0930\u0940\u0930\u093F\u0915 \u092C\u0932"],
      optionsEnglish: ["Destruction of sins and mental peace", "Material ego", "Only wealth", "Physical strength"],
      correctHindi: "\u092A\u093E\u092A\u094B\u0902 \u0915\u093E \u0928\u093E\u0936 \u0914\u0930 \u092E\u093E\u0928\u0938\u093F\u0915 \u0936\u093E\u0902\u0924\u093F",
      correctEnglish: "Destruction of sins and mental peace",
      explanationHindi: "\u0907\u0938\u0915\u0947 \u092A\u093E\u0920 \u0938\u0947 \u092D\u092F, \u0936\u094B\u0915, \u0930\u094B\u0917 and \u092A\u093E\u092A\u094B\u0902 \u0938\u0947 \u092E\u0941\u0915\u094D\u0924\u093F \u092E\u093F\u0932\u0924\u0940 \u0939\u0948 \u0924\u0925\u093E \u092E\u0928 \u0936\u093E\u0902\u0924 \u0939\u094B\u0924\u093E \u0939\u0948\u0964",
      explanationEnglish: "Reciting it frees the mind from fear, grief, and sins.",
      ref: "Vishnu Sahasranama"
    }
  ];
  const shivTemplates = [
    {
      textHindi: "\u0936\u093F\u0935 \u092E\u0939\u093F\u092E\u094D\u0928 \u0938\u094D\u0924\u094B\u0924\u094D\u0930 \u0915\u0947 \u0930\u091A\u092F\u093F\u0924\u093E \u0915\u094C\u0928 \u0939\u0948\u0902?",
      textEnglish: "Who is the composer of Shiv Mahimna Stotra?",
      optionsHindi: ["\u0917\u0902\u0927\u0930\u094D\u0935\u0930\u093E\u091C \u092A\u0941\u0937\u094D\u092A\u0926\u0902\u0924", "\u0930\u093E\u0935\u0923", "\u0906\u0926\u093F \u0936\u0902\u0915\u0930\u093E\u091A\u093E\u0930\u094D\u092F", "\u0935\u0947\u0926 \u0935\u094D\u092F\u093E\u0938"],
      optionsEnglish: ["Gandharvaraj Pushpadanta", "Ravana", "Adi Shankaracharya", "Veda Vyasa"],
      correctHindi: "\u0917\u0902\u0927\u0930\u094D\u0935\u0930\u093E\u091C \u092A\u0941\u0937\u094D\u092A\u0926\u0902\u0924",
      correctEnglish: "Gandharvaraj Pushpadanta",
      explanationHindi: "\u0936\u093F\u0935 \u092E\u0939\u093F\u092E\u094D\u0928 \u0938\u094D\u0924\u094B\u0924\u094D\u0930 \u0915\u0940 \u0930\u091A\u0928\u093E \u092D\u0917\u0935\u093E\u0928 \u0936\u093F\u0935 \u0915\u0947 \u0905\u0928\u0928\u094D\u092F \u092D\u0915\u094D\u0924 \u0917\u0902\u0927\u0930\u094D\u0935 \u092A\u0941\u0937\u094D\u092A\u0926\u0902\u0924 \u0928\u0947 \u0915\u0940 \u0925\u0940\u0964",
      explanationEnglish: "Composed by the Gandharva king Pushpadanta.",
      ref: "Shiv Mahimna Stotra"
    },
    {
      textHindi: "\u092A\u0941\u0937\u094D\u092A\u0926\u0902\u0924 \u0928\u0947 \u0936\u093F\u0935 \u091C\u0940 \u0915\u0947 \u0915\u094D\u0930\u094B\u0927 \u0938\u0947 \u092C\u091A\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u0907\u0938 \u0938\u094D\u0924\u094B\u0924\u094D\u0930 \u0915\u0940 \u0930\u091A\u0928\u093E \u0915\u094D\u092F\u094B\u0902 \u0915\u0940 \u0925\u0940?",
      textEnglish: "Why did Pushpadanta compose this stotram to escape Shiva's wrath?",
      optionsHindi: ["\u0930\u093E\u091C\u093E \u0915\u0947 \u092C\u0917\u0940\u091A\u0947 \u0938\u0947 \u092B\u0942\u0932 \u091A\u0941\u0930\u093E\u0928\u0947 \u0915\u0947 \u0915\u093E\u0930\u0923 \u0936\u0915\u094D\u0924\u093F\u092F\u093E\u0902 \u0916\u094B \u091C\u093E\u0928\u0947 \u092A\u0930", "\u092F\u0941\u0926\u094D\u0927 \u0939\u093E\u0930\u0928\u0947 \u092A\u0930", "\u0936\u093F\u0935 \u091C\u0940 \u0915\u093E \u0905\u092A\u092E\u093E\u0928 \u0915\u0930\u0928\u0947 \u092A\u0930", "\u0924\u092A\u0938\u094D\u092F\u093E \u092D\u0902\u0917 \u0939\u094B\u0928\u0947 \u092A\u0930"],
      optionsEnglish: ["For losing powers after stealing flowers from the king's garden", "For losing a battle", "For insulting Shiva", "For breaking penance"],
      correctHindi: "\u0930\u093E\u091C\u093E \u0915\u0947 \u092C\u0917\u0940\u091A\u0947 \u0938\u0947 \u092B\u0942\u0932 \u091A\u0941\u0930\u093E\u0928\u0947 \u0915\u0947 \u0915\u093E\u0930\u0923 \u0936\u0915\u094D\u0924\u093F\u092F\u093E\u0902 \u0916\u094B \u091C\u093E\u0928\u0947 \u092A\u0930",
      correctEnglish: "For losing powers after stealing flowers from the king's garden",
      explanationHindi: "\u0930\u093E\u091C\u093E \u091A\u093F\u0924\u094D\u0930\u0930\u0925 \u0915\u0947 \u092C\u0917\u0940\u091A\u0947 \u0938\u0947 \u0936\u093F\u0935-\u092A\u0942\u091C\u093E \u0915\u0947 \u092B\u0942\u0932 \u091A\u0941\u0930\u093E\u0928\u0947 \u092A\u0930 \u092A\u0941\u0937\u094D\u092A\u0926\u0902\u0924 \u0928\u0947 \u0905\u0928\u091C\u093E\u0928\u0947 \u092E\u0947\u0902 \u0936\u093F\u0935-\u0928\u093F\u0930\u094D\u092E\u093E\u0932\u0940 \u0915\u093E \u0909\u0932\u094D\u0932\u0902\u0918\u0928 \u0915\u093F\u092F\u093E, \u091C\u093F\u0938\u0938\u0947 \u0909\u0938\u0915\u0940 \u0936\u0915\u094D\u0924\u093F\u092F\u093E\u0902 \u091A\u0932\u0940 \u0917\u0908\u0902\u0964",
      explanationEnglish: "He stepped on sacred leaves while stealing flowers, losing his flying powers, and prayed to Shiva to regain them.",
      ref: "Shiv Mahimna Stotra"
    },
    {
      textHindi: "\u0936\u093F\u0935 \u092E\u0939\u093F\u092E\u094D\u0928 \u0938\u094D\u0924\u094B\u0924\u094D\u0930 \u092E\u0947\u0902 \u092E\u0941\u0916\u094D\u092F \u0930\u0942\u092A \u0938\u0947 \u0915\u093F\u0938\u0915\u0940 \u092E\u0939\u093F\u092E\u093E \u0915\u093E \u0917\u093E\u0928 \u0939\u0948?",
      textEnglish: "Whose glory is primarily sung in Shiv Mahimna Stotra?",
      optionsHindi: ["\u092D\u0917\u0935\u093E\u0928 \u0936\u093F\u0935", "\u092D\u0917\u0935\u093E\u0928 \u0935\u093F\u0937\u094D\u0923\u0941", "\u092D\u0917\u0935\u093E\u0928 \u0917\u0923\u0947\u0936", "\u0907\u0902\u0926\u094D\u0930 \u0926\u0947\u0935"],
      optionsEnglish: ["Lord Shiva", "Lord Vishnu", "Lord Ganesh", "Lord Indra"],
      correctHindi: "\u092D\u0917\u0935\u093E\u0928 \u0936\u093F\u0935",
      correctEnglish: "Lord Shiva",
      explanationHindi: "\u0907\u0938\u092E\u0947\u0902 \u092D\u0917\u0935\u093E\u0928 \u0936\u093F\u0935 \u0915\u0947 \u0905\u0928\u0941\u092A\u092E \u0938\u094C\u0902\u0926\u0930\u094D\u092F, \u0936\u0915\u094D\u0924\u093F \u0914\u0930 \u0915\u0943\u092A\u093E \u0915\u093E \u0938\u0917\u0941\u0923-\u0928\u093F\u0930\u094D\u0917\u0941\u0923 \u0930\u0942\u092A \u092E\u0947\u0902 \u0917\u093E\u0928 \u0915\u093F\u092F\u093E \u0917\u092F\u093E \u0939\u0948\u0964",
      explanationEnglish: "Glorifies the supreme form and grace of Lord Shiva.",
      ref: "Shiv Mahimna Stotra"
    },
    {
      textHindi: "\u0907\u0938 \u0938\u094D\u0924\u094B\u0924\u094D\u0930 \u092E\u0947\u0902 \u0936\u093F\u0935 \u091C\u0940 \u0915\u0947 \u0915\u093F\u0938 \u0928\u0940\u0932\u0947 \u0915\u0902\u0920 \u0935\u093E\u0932\u0947 \u0930\u0942\u092A \u0915\u093E \u0935\u0930\u094D\u0923\u0928 \u0939\u0948?",
      textEnglish: "Which blue-throated form of Shiva is described in this stotram?",
      optionsHindi: ["\u0928\u0940\u0932\u0915\u0902\u0920 (\u0935\u093F\u0937 \u092A\u093E\u0928)", "\u091A\u0902\u0926\u094D\u0930\u0936\u0947\u0916\u0930", "\u0917\u0902\u0917\u093E\u0927\u0930", "\u092E\u0939\u093E\u0915\u093E\u0932"],
      optionsEnglish: ["Neelkanth (consuming poison)", "Chandrashekhar", "Gangadhar", "Mahakal"],
      correctHindi: "\u0928\u0940\u0932\u0915\u0902\u0920 (\u0935\u093F\u0937 \u092A\u093E\u0928)",
      correctEnglish: "Neelkanth (consuming poison)",
      explanationHindi: "\u0938\u092E\u0941\u0926\u094D\u0930 \u092E\u0902\u0925\u0928 \u0915\u0947 \u0938\u092E\u092F \u0935\u093F\u0937 \u092A\u0940\u0915\u0930 \u0938\u0943\u0937\u094D\u091F\u093F \u0915\u0940 \u0930\u0915\u094D\u0937\u093E \u0915\u0930\u0928\u0947 \u0935\u093E\u0932\u0947 \u0936\u093F\u0935 \u0915\u0947 \u0928\u0940\u0932\u0915\u0902\u0920 \u0938\u094D\u0935\u0930\u0942\u092A \u0915\u0940 \u092E\u0939\u093F\u092E\u093E \u0907\u0938\u092E\u0947\u0902 \u0935\u0930\u094D\u0923\u093F\u0924 \u0939\u0948\u0964",
      explanationEnglish: "Praises Shiva for drinking the Halahala poison to save the world.",
      ref: "Shiv Mahimna Stotra"
    },
    {
      textHindi: "\u0936\u093F\u0935 \u092E\u0939\u093F\u092E\u094D\u0928 \u0938\u094D\u0924\u094B\u0924\u094D\u0930 \u092E\u0947\u0902 \u0915\u0941\u0932 \u0915\u093F\u0924\u0928\u0947 \u0936\u094D\u0932\u094B\u0915 \u0939\u0948\u0902?",
      textEnglish: "How many verses are there in Shiv Mahimna Stotra?",
      optionsHindi: ["43 \u0936\u094D\u0932\u094B\u0915", "31 \u0936\u094D\u0932\u094B\u0915", "108 \u0936\u094D\u0932\u094B\u0915", "51 \u0936\u094D\u0932\u094B\u0915"],
      optionsEnglish: ["43 Verses", "31 Verses", "108 Verses", "51 Verses"],
      correctHindi: "43 \u0936\u094D\u0932\u094B\u0915",
      correctEnglish: "43 Verses",
      explanationHindi: "\u0907\u0938 \u0926\u093F\u0935\u094D\u092F \u0938\u094D\u0924\u094B\u0924\u094D\u0930 \u092E\u0947\u0902 \u0915\u0941\u0932 43 \u0936\u094D\u0932\u094B\u0915 \u0939\u0948\u0902, \u091C\u094B \u092D\u0917\u0935\u093E\u0928 \u0936\u093F\u0935 \u0915\u0940 \u0938\u094D\u0924\u0941\u0924\u093F \u092E\u0947\u0902 \u0917\u093E\u090F \u091C\u093E\u0924\u0947 \u0939\u0948\u0902\u0964",
      explanationEnglish: "It contains 43 beautifully structured verses.",
      ref: "Shiv Mahimna Stotra"
    }
  ];
  const durgaTemplates = [
    {
      textHindi: "\u0926\u0941\u0930\u094D\u0917\u093E \u0938\u092A\u094D\u0924\u0936\u0924\u0940 \u0915\u093F\u0938 \u092E\u0939\u093E\u092A\u0941\u0930\u093E\u0923 \u0915\u093E \u0905\u0902\u0936 \u0939\u0948?",
      textEnglish: "Durga Saptashati is a part of which Mahapurana?",
      optionsHindi: ["\u092E\u093E\u0930\u094D\u0915\u0923\u094D\u0921\u0947\u092F \u092A\u0941\u0930\u093E\u0923", "\u0935\u093F\u0937\u094D\u0923\u0941 \u092A\u0941\u0930\u093E\u0923", "\u0936\u093F\u0935 \u092A\u0941\u0930\u093E\u0923", "\u092D\u093E\u0917\u0935\u0924 \u092A\u0941\u0930\u093E\u0923"],
      optionsEnglish: ["Markandeya Purana", "Vishnu Purana", "Shiva Purana", "Bhavata Purana"],
      correctHindi: "\u092E\u093E\u0930\u094D\u0915\u0923\u094D\u0921\u0947\u092F \u092A\u0941\u0930\u093E\u0923",
      correctEnglish: "Markandeya Purana",
      explanationHindi: "\u0926\u0941\u0930\u094D\u0917\u093E \u0938\u092A\u094D\u0924\u0936\u0924\u0940 \u092E\u093E\u0930\u094D\u0915\u0923\u094D\u0921\u0947\u092F \u092A\u0941\u0930\u093E\u0923 \u0915\u0947 \u0926\u0947\u0935\u0940 \u092E\u0939\u093E\u0924\u094D\u092E\u094D\u092F \u0916\u0902\u0921 \u0915\u093E \u0939\u093F\u0938\u094D\u0938\u093E \u0939\u0948\u0964",
      explanationEnglish: "It is the Devi Mahatmya section of the Markandeya Purana.",
      ref: "Durga Saptashati"
    },
    {
      textHindi: "\u0926\u0941\u0930\u094D\u0917\u093E \u0938\u092A\u094D\u0924\u0936\u0924\u0940 \u092E\u0947\u0902 \u0915\u0941\u0932 \u0915\u093F\u0924\u0928\u0947 \u092E\u0902\u0924\u094D\u0930 \u0914\u0930 \u0936\u094D\u0932\u094B\u0915 \u0938\u0902\u0915\u0932\u093F\u0924 \u0939\u0948\u0902?",
      textEnglish: "How many mantras/verses are there in Durga Saptashati?",
      optionsHindi: ["700 \u092E\u0928\u094D\u0924\u094D\u0930", "108 \u092E\u0928\u094D\u0924\u094D\u0930", "1000 \u092E\u0928\u094D\u0924\u094D\u0930", "500 \u092E\u0928\u094D\u0924\u094D\u0930"],
      optionsEnglish: ["700 Mantras", "108 Mantras", "1000 Mantras", "500 Mantras"],
      correctHindi: "700 \u092E\u0928\u094D\u0924\u094D\u0930",
      correctEnglish: "700 Mantras",
      explanationHindi: "'\u0938\u092A\u094D\u0924\u0936\u0924\u0940' \u0928\u093E\u092E \u0938\u093E\u0924 \u0938\u094C (700) \u0936\u094D\u0932\u094B\u0915\u094B\u0902 \u0914\u0930 \u092E\u0902\u0924\u094D\u0930\u094B\u0902 \u0915\u0947 \u0938\u0902\u0915\u0932\u0928 \u0915\u0947 \u0915\u093E\u0930\u0923 \u092A\u0921\u093C\u093E \u0939\u0948\u0964",
      explanationEnglish: "Named 'Saptashati' because it comprises 700 verses/mantras.",
      ref: "Durga Saptashati"
    },
    {
      textHindi: "\u0926\u0941\u0930\u094D\u0917\u093E \u0938\u092A\u094D\u0924\u0936\u0924\u0940 \u0915\u0947 \u0905\u0928\u0941\u0938\u093E\u0930 \u0926\u0947\u0935\u0940 \u0928\u0947 \u0915\u093F\u0938 \u092E\u0939\u093F\u0937 \u0930\u0942\u092A\u0940 \u0905\u0938\u0941\u0930 \u0915\u093E \u0935\u0927 \u0915\u093F\u092F\u093E \u0925\u093E?",
      textEnglish: "According to Durga Saptashati, which buffalo-demon did the Goddess slay?",
      optionsHindi: ["\u092E\u0939\u093F\u0937\u093E\u0938\u0941\u0930", "\u0930\u0915\u094D\u0924\u092C\u0940\u091C", "\u0936\u0941\u0902\u092D", "\u0928\u093F\u0936\u0941\u0902\u092D"],
      optionsEnglish: ["Mahishasura", "Raktabeeja", "Shumbha", "Nishumbha"],
      correctHindi: "\u092E\u0939\u093F\u0937\u093E\u0938\u0941\u0930",
      correctEnglish: "Mahishasura",
      explanationHindi: "\u092E\u0939\u093F\u0937\u093E\u0938\u0941\u0930 \u0915\u093E \u092E\u0930\u094D\u0926\u0928 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0915\u093E\u0930\u0923 \u092D\u0917\u0935\u0924\u0940 \u0915\u094B '\u092E\u0939\u093F\u0937\u093E\u0938\u0941\u0930\u092E\u0930\u094D\u0926\u093F\u0928\u0940' \u0915\u0939\u093E \u0917\u092F\u093E\u0964",
      explanationEnglish: "Slaying Mahishasura earned the Mother Goddess the title Mahishasurmardini.",
      ref: "Durga Saptashati"
    },
    {
      textHindi: "\u0926\u0941\u0930\u094D\u0917\u093E \u0938\u092A\u094D\u0924\u0936\u0924\u0940 \u092E\u0947\u0902 \u0906\u0926\u093F \u0936\u0915\u094D\u0924\u093F \u0915\u0947 \u0915\u093F\u0924\u0928\u0947 \u092A\u094D\u0930\u092E\u0941\u0916 \u091A\u0930\u093F\u0924\u094D\u0930\u094B\u0902 (\u092D\u093E\u0917\u094B\u0902) \u0915\u093E \u0935\u0930\u094D\u0923\u0928 \u0939\u0948?",
      textEnglish: "How many main parts (charitras) of Adi Shakti are described in Durga Saptashati?",
      optionsHindi: ["\u0924\u0940\u0928 \u091A\u0930\u093F\u0924\u094D\u0930 (\u092A\u094D\u0930\u0925\u092E, \u092E\u0927\u094D\u092F\u092E, \u0909\u0924\u094D\u0924\u092E)", "\u091A\u093E\u0930 \u091A\u0930\u093F\u0924\u094D\u0930", "\u0926\u094B \u091A\u0930\u093F\u0924\u094D\u0930", "\u0938\u093E\u0924 \u091A\u0930\u093F\u0924\u094D\u0930"],
      optionsEnglish: ["Three parts (Prathama, Madhyama, Uttara)", "Four parts", "Two parts", "Seven parts"],
      correctHindi: "\u0924\u0940\u0928 \u091A\u0930\u093F\u0924\u094D\u0930 (\u092A\u094D\u0930\u0925\u092E, \u092E\u0927\u094D\u092F\u092E, \u0909\u0924\u094D\u0924\u092E)",
      correctEnglish: "Three parts (Prathama, Madhyama, Uttara)",
      explanationHindi: "\u0907\u0938\u092E\u0947\u0902 \u092E\u0939\u093E\u0915\u093E\u0932\u0940, \u092E\u0939\u093E\u0932\u0915\u094D\u0937\u094D\u092E\u0940 \u0914\u0930 \u092E\u0939\u093E\u0938\u0930\u0938\u094D\u0935\u0924\u0940 \u0938\u094D\u0935\u0930\u0942\u092A\u094B\u0902 \u0915\u0947 \u0924\u0940\u0928 \u092E\u0941\u0916\u094D\u092F \u091A\u0930\u093F\u0924\u094D\u0930\u094B\u0902 \u0915\u093E \u0917\u093E\u0928 \u0939\u0948\u0964",
      explanationEnglish: "It is divided into three distinct sections honoring Mahakali, Mahalakshmi, and Mahasaraswati.",
      ref: "Durga Saptashati"
    },
    {
      textHindi: "\u0930\u093E\u091C\u093E \u0938\u0941\u0930\u0925 \u0914\u0930 \u0938\u092E\u093E\u0927\u093F \u0935\u0948\u0936\u094D\u092F \u0928\u0947 \u0915\u093F\u0938\u0938\u0947 \u092D\u0917\u0935\u0924\u0940 \u0926\u0941\u0930\u094D\u0917\u093E \u0915\u0940 \u0906\u0930\u093E\u0927\u0928\u093E \u0915\u0940 \u0936\u093F\u0915\u094D\u0937\u093E \u0932\u0940 \u0925\u0940?",
      textEnglish: "From whom did King Suratha and Samadhi Vaishya learn the worship of Goddess Durga?",
      optionsHindi: ["\u092E\u0947\u0927\u093E \u090B\u0937\u093F", "\u0935\u0936\u093F\u0937\u094D\u0920 \u090B\u0937\u093F", "\u0928\u093E\u0930\u0926 \u092E\u0941\u0928\u093F", "\u0935\u094D\u092F\u093E\u0938 \u091C\u0940"],
      optionsEnglish: ["Sage Medha", "Sage Vashistha", "Sage Narada", "Sage Vyasa"],
      correctHindi: "\u092E\u0947\u0927\u093E \u090B\u0937\u093F",
      correctEnglish: "Sage Medha",
      explanationHindi: "\u092E\u0947\u0927\u093E \u090B\u0937\u093F \u0928\u0947 \u0939\u0940 \u0909\u0928 \u0926\u094B\u0928\u094B\u0902 \u0915\u094B \u0906\u0926\u093F \u0936\u0915\u094D\u0924\u093F \u0915\u0940 \u092E\u0939\u093F\u092E\u093E \u0938\u0941\u0928\u093E\u0915\u0930 \u0926\u0947\u0935\u0940 \u0906\u0930\u093E\u0927\u0928\u093E \u0915\u093E \u0909\u092A\u0926\u0947\u0936 \u0926\u093F\u092F\u093E \u0925\u093E\u0964",
      explanationEnglish: "Sage Medha guided King Suratha and Vaishya Samadhi to worship Durga.",
      ref: "Durga Saptashati"
    }
  ];
  const sunderTemplates = [
    {
      textHindi: "\u0938\u0941\u0928\u094D\u0926\u0930\u0915\u093E\u0923\u094D\u0921 \u0915\u093F\u0938 \u092E\u0941\u0916\u094D\u092F \u092E\u0939\u093E\u0915\u093E\u0935\u094D\u092F \u0915\u093E \u0938\u0930\u094D\u0935\u093E\u0927\u093F\u0915 \u0932\u094B\u0915\u092A\u094D\u0930\u093F\u092F \u092D\u093E\u0917 \u0939\u0948?",
      textEnglish: "Sundarkand is the most popular part of which major epic?",
      optionsHindi: ["\u0930\u093E\u092E\u091A\u0930\u093F\u0924\u092E\u093E\u0928\u0938 / \u0930\u093E\u092E\u093E\u092F\u0923", "\u092E\u0939\u093E\u092D\u093E\u0930\u0924", "\u0936\u094D\u0930\u0940\u092E\u0926\u094D\u092D\u0917\u0935\u0926\u094D\u0917\u0940\u0924\u093E", "\u0936\u093F\u0935 \u092A\u0941\u0930\u093E\u0923"],
      optionsEnglish: ["Ramcharitmanas / Ramayana", "Mahabharata", "Bhagavad Gita", "Shiva Purana"],
      correctHindi: "\u0930\u093E\u092E\u091A\u0930\u093F\u0924\u092E\u093E\u0928\u0938 / \u0930\u093E\u092E\u093E\u092F\u0923",
      correctEnglish: "Ramcharitmanas / Ramayana",
      explanationHindi: "\u0938\u0941\u0928\u094D\u0926\u0930\u0915\u093E\u0923\u094D\u0921 \u0930\u093E\u092E\u091A\u0930\u093F\u0924\u092E\u093E\u0928\u0938 \u0915\u093E \u092A\u093E\u0902\u091A\u0935\u093E\u0902 \u0905\u0927\u094D\u092F\u093E\u092F (\u0915\u093E\u0923\u094D\u0921) \u0939\u0948, \u091C\u094B \u0939\u0928\u0941\u092E\u093E\u0928 \u091C\u0940 \u0915\u0940 \u0932\u0902\u0915\u093E \u092F\u093E\u0924\u094D\u0930\u093E \u092A\u0930 \u0906\u0927\u093E\u0930\u093F\u0924 \u0939\u0948\u0964",
      explanationEnglish: "Sundarkand is the 5th chapter of Ramcharitmanas/Ramayana, depicting Hanuman's heroic deeds.",
      ref: "Sundarkand"
    },
    {
      textHindi: "\u0938\u0941\u0928\u094D\u0926\u0930\u0915\u093E\u0923\u094D\u0921 \u0915\u0947 \u092E\u0941\u0916\u094D\u092F \u0928\u093E\u092F\u0915 \u0915\u094C\u0928 \u0939\u0948\u0902?",
      textEnglish: "Who is the main protagonist/hero of Sundarkand?",
      optionsHindi: ["\u0939\u0928\u0941\u092E\u093E\u0928 \u091C\u0940", "\u0936\u094D\u0930\u0940 \u0930\u093E\u092E", "\u0932\u0915\u094D\u0937\u094D\u092E\u0923", "\u0930\u093E\u0935\u0923"],
      optionsEnglish: ["Hanuman Ji", "Lord Rama", "Lakshmana", "Ravana"],
      correctHindi: "\u0939\u0928\u0941\u092E\u093E\u0928 \u091C\u0940",
      correctEnglish: "Hanuman Ji",
      explanationHindi: "\u092A\u0942\u0930\u0947 \u0938\u0941\u0928\u094D\u0926\u0930\u0915\u093E\u0923\u094D\u0921 \u092E\u0947\u0902 \u0939\u0928\u0941\u092E\u093E\u0928 \u091C\u0940 \u0915\u0947 \u092A\u0930\u093E\u0915\u094D\u0930\u092E, \u092C\u0941\u0926\u094D\u0927\u093F \u0914\u0930 \u0930\u093E\u092E\u092D\u0915\u094D\u0924\u093F \u0915\u0940 \u0915\u0925\u093E \u0935\u0930\u094D\u0923\u093F\u0924 \u0939\u0948\u0964",
      explanationEnglish: "Hanuman is the central hero of this chapter, exemplifying valour and devotion.",
      ref: "Sundarkand"
    },
    {
      textHindi: "\u0932\u0902\u0915\u093E \u092E\u0947\u0902 \u0938\u0940\u0924\u093E \u091C\u0940 \u0915\u093F\u0938 \u0935\u093E\u091F\u093F\u0915\u093E \u092E\u0947\u0902 \u092C\u0902\u0926\u0940 \u0925\u0940\u0902?",
      textEnglish: "In which garden was Sita kept captive in Lanka?",
      optionsHindi: ["\u0905\u0936\u094B\u0915 \u0935\u093E\u091F\u093F\u0915\u093E", "\u092E\u0927\u0941\u0935\u0928", "\u092A\u0902\u091A\u0935\u091F\u0940", "\u0928\u0902\u0926\u0928\u0935\u0928"],
      optionsEnglish: ["Ashok Vatika", "Madhuvan", "Panchavati", "Nandanvan"],
      correctHindi: "\u0905\u0936\u094B\u0915 \u0935\u093E\u091F\u093F\u0915\u093E",
      correctEnglish: "Ashok Vatika",
      explanationHindi: "\u0938\u0940\u0924\u093E \u091C\u0940 \u0930\u093E\u0935\u0923 \u0915\u0947 \u092E\u0939\u0932 \u0915\u0947 \u092A\u093E\u0938 \u0938\u094D\u0925\u093F\u0924 \u0905\u0936\u094B\u0915 \u0935\u093E\u091F\u093F\u0915\u093E (\u0905\u0936\u094B\u0915 \u0935\u0928) \u092E\u0947\u0902 \u092C\u0948\u0920\u0940 \u0925\u0940\u0902\u0964",
      explanationEnglish: "Sita was kept in the Ashok Vatika under heavy guard.",
      ref: "Sundarkand"
    },
    {
      textHindi: "\u0939\u0928\u0941\u092E\u093E\u0928 \u091C\u0940 \u0928\u0947 \u0938\u092E\u0941\u0926\u094D\u0930 \u0932\u093E\u0902\u0918\u0924\u0947 \u0938\u092E\u092F \u092E\u093E\u0930\u094D\u0917 \u092E\u0947\u0902 \u0938\u092C\u0938\u0947 \u092A\u0939\u0932\u0947 \u0915\u093F\u0938 \u092A\u0930\u094D\u0935\u0924 \u0915\u094B \u0935\u093F\u0936\u094D\u0930\u093E\u092E \u0926\u0947\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u0938\u094D\u092A\u0930\u094D\u0936 \u0915\u093F\u092F\u093E \u0925\u093E?",
      textEnglish: "Which mountain did Hanuman touch first to offer rest while crossing the ocean?",
      optionsHindi: ["\u092E\u0948\u0928\u093E\u0915 \u092A\u0930\u094D\u0935\u0924", "\u0938\u0941\u092E\u0947\u0930\u0941 \u092A\u0930\u094D\u0935\u0924", "\u0939\u093F\u092E\u093E\u0932\u092F", "\u0917\u093F\u0930\u0928\u093E\u0930"],
      optionsEnglish: ["Mainak Mountain", "Sumeru Mountain", "Himalaya", "Girnar"],
      correctHindi: "\u092E\u0948\u0928\u093E\u0915 \u092A\u0930\u094D\u0935\u0924",
      correctEnglish: "Mainak Mountain",
      explanationHindi: "\u0938\u092E\u0941\u0926\u094D\u0930 \u0915\u0947 \u0905\u0928\u0941\u0930\u094B\u0927 \u092A\u0930 \u092E\u0948\u0928\u093E\u0915 \u092A\u0930\u094D\u0935\u0924 \u0939\u0928\u0941\u092E\u093E\u0928 \u091C\u0940 \u0915\u094B \u0935\u093F\u0936\u094D\u0930\u093E\u092E \u0926\u0947\u0928\u0947 \u0939\u0947\u0924\u0941 \u092A\u094D\u0930\u0915\u091F \u0939\u0941\u0906 \u0925\u093E\u0964",
      explanationEnglish: "Mainak mountain rose from the ocean to offer Hanuman a resting place.",
      ref: "Sundarkand"
    },
    {
      textHindi: "\u0932\u0902\u0915\u093E \u092E\u0947\u0902 \u0939\u0928\u0941\u092E\u093E\u0928 \u091C\u0940 \u0915\u0940 \u092D\u0947\u0902\u091F \u0915\u093F\u0938 \u0930\u093E\u092E\u092D\u0915\u094D\u0924 \u0930\u093E\u0915\u094D\u0937\u0938 \u0938\u0947 \u0939\u0941\u0908 \u0925\u0940?",
      textEnglish: "Which Rama-devoted demon did Hanuman meet in Lanka?",
      optionsHindi: ["\u0935\u093F\u092D\u0940\u0937\u0923", "\u0915\u0941\u0902\u092D\u0915\u0930\u094D\u0923", "\u092E\u0947\u0918\u0928\u093E\u0926", "\u0924\u094D\u0930\u093F\u091C\u091F\u093E"],
      optionsEnglish: ["Vibhishana", "Kumbhakarna", "Meghanada", "Trijata"],
      correctHindi: "\u0935\u093F\u092D\u0940\u0937\u0923",
      correctEnglish: "Vibhishana",
      explanationHindi: "\u0939\u0928\u0941\u092E\u093E\u0928 \u091C\u0940 \u0928\u0947 \u0935\u093F\u092D\u0940\u0937\u0923 \u0915\u0947 \u0918\u0930 \u092A\u0930 \u0924\u0941\u0932\u0938\u0940 \u0915\u093E \u092A\u094C\u0927\u093E \u0914\u0930 \u0930\u093E\u092E \u0928\u093E\u092E \u0905\u0902\u0915\u093F\u0924 \u0926\u0947\u0916 \u0909\u0928\u0938\u0947 \u092D\u0947\u0902\u091F \u0915\u0940 \u0925\u0940\u0964",
      explanationEnglish: "Hanuman met Vibhishana, Ravana's younger brother, who was a devotee of Sri Ram.",
      ref: "Sundarkand"
    }
  ];
  const mahabharataTemplates = [
    {
      textHindi: "\u092E\u0939\u093E\u092D\u093E\u0930\u0924 \u0915\u0947 \u0930\u091A\u092F\u093F\u0924\u093E \u0915\u094C\u0928 \u0939\u0948\u0902?",
      textEnglish: "Who is the composer of Mahabharata?",
      optionsHindi: ["\u092E\u0939\u0930\u094D\u0937\u093F \u0935\u0947\u0926\u0935\u094D\u092F\u093E\u0938", "\u092E\u0939\u0930\u094D\u0937\u093F \u0935\u093E\u0932\u094D\u092E\u0940\u0915\u093F", "\u0938\u0902\u0924 \u0924\u0941\u0932\u0938\u0940\u0926\u093E\u0938", "\u0915\u093E\u0932\u0940\u0926\u093E\u0938"],
      optionsEnglish: ["Sage Vedavyasa", "Sage Valmiki", "Saint Tulsidas", "Kalidasa"],
      correctHindi: "\u092E\u0939\u0930\u094D\u0937\u093F \u0935\u0947\u0926\u0935\u094D\u092F\u093E\u0938",
      correctEnglish: "Sage Vedavyasa",
      explanationHindi: "\u092E\u0939\u093E\u092D\u093E\u0930\u0924 \u092E\u0939\u093E\u0915\u093E\u0935\u094D\u092F \u0915\u0940 \u0930\u091A\u0928\u093E \u092E\u0939\u0930\u094D\u0937\u093F \u0915\u0943\u0937\u094D\u0923\u0926\u094D\u0935\u0948\u092A\u093E\u092F\u0928 \u0935\u0947\u0926\u0935\u094D\u092F\u093E\u0938 \u091C\u0940 \u0928\u0947 \u0915\u0940 \u0925\u0940\u0964",
      explanationEnglish: "The Mahabharata was composed by Sage Krishna Dwaipayana Vedavyasa.",
      ref: "Mahabharata"
    },
    {
      textHindi: "\u092E\u0939\u093E\u092D\u093E\u0930\u0924 \u092E\u0947\u0902 \u0915\u0941\u0932 \u0915\u093F\u0924\u0928\u0947 \u092A\u0930\u094D\u0935 (\u0905\u0927\u094D\u092F\u093E\u092F \u0938\u092E\u0942\u0939) \u0939\u0948\u0902?",
      textEnglish: "How many Parvas (books/chapters) are there in Mahabharata?",
      optionsHindi: ["18 \u092A\u0930\u094D\u0935", "12 \u092A\u0930\u094D\u0935", "10 \u092A\u0930\u094D\u0935", "24 \u092A\u0930\u094D\u0935"],
      optionsEnglish: ["18 Parvas", "12 Parvas", "10 Parvas", "24 Parvas"],
      correctHindi: "18 \u092A\u0930\u094D\u0935",
      correctEnglish: "18 Parvas",
      explanationHindi: "\u092E\u0939\u093E\u092D\u093E\u0930\u0924 \u092E\u0947\u0902 \u0915\u0941\u0932 18 \u092A\u0930\u094D\u0935 \u0939\u0948\u0902, \u091C\u0948\u0938\u0947 \u0906\u0926\u093F \u092A\u0930\u094D\u0935, \u0938\u092D\u093E \u092A\u0930\u094D\u0935, \u092D\u0940\u0937\u094D\u092E \u092A\u0930\u094D\u0935 \u0906\u0926\u093F\u0964",
      explanationEnglish: "The Mahabharata is divided into 18 Parvas (books), including Adi Parva, Sabha Parva, Bhishma Parva, etc.",
      ref: "Mahabharata"
    },
    {
      textHindi: "\u092D\u0940\u0937\u094D\u092E \u092A\u093F\u0924\u093E\u092E\u0939 \u0915\u093E \u0935\u093E\u0938\u094D\u0924\u0935\u093F\u0915/\u092E\u0942\u0932 \u0928\u093E\u092E \u0915\u094D\u092F\u093E \u0925\u093E?",
      textEnglish: "What was the original birth name of Bhishma Pitamah?",
      optionsHindi: ["\u0926\u0947\u0935\u0935\u094D\u0930\u0924", "\u0915\u0930\u094D\u0923", "\u0936\u093E\u0928\u094D\u0924\u0928\u0941", "\u091A\u093F\u0924\u094D\u0930\u093E\u0902\u0917\u0926"],
      optionsEnglish: ["Devavrata", "Karna", "Shantanu", "Chitrangada"],
      correctHindi: "\u0926\u0947\u0935\u0935\u094D\u0930\u0924",
      correctEnglish: "Devavrata",
      explanationHindi: "\u092D\u0940\u0937\u094D\u092E \u092A\u093F\u0924\u093E\u092E\u0939 \u0930\u093E\u091C\u093E \u0936\u093E\u0928\u094D\u0924\u0928\u0941 \u0914\u0930 \u0926\u0947\u0935\u0940 \u0917\u0902\u0917\u093E \u0915\u0947 \u092A\u0941\u0924\u094D\u0930 \u0925\u0947, \u091C\u093F\u0928\u0915\u093E \u092E\u0942\u0932 \u0928\u093E\u092E \u0926\u0947\u0935\u0935\u094D\u0930\u0924 \u0925\u093E\u0964",
      explanationEnglish: "Bhishma's original name was Devavrata, the son of King Shantanu and Goddess Ganga.",
      ref: "Mahabharata"
    },
    {
      textHindi: "\u092F\u0941\u0927\u093F\u0937\u094D\u0920\u093F\u0930, \u092D\u0940\u092E \u0914\u0930 \u0905\u0930\u094D\u091C\u0941\u0928 \u0915\u0940 \u092E\u093E\u0924\u093E \u0915\u093E \u0915\u094D\u092F\u093E \u0928\u093E\u092E \u0925\u093E?",
      textEnglish: "What was the name of the mother of Yudhishthira, Bhima, and Arjuna?",
      optionsHindi: ["\u0915\u0941\u0902\u0924\u0940", "\u092E\u093E\u0926\u094D\u0930\u0940", "\u0917\u093E\u0902\u0927\u093E\u0930\u0940", "\u0938\u0924\u094D\u092F\u0935\u0924\u0940"],
      optionsEnglish: ["Kunti", "Madri", "Gandhari", "Satyavati"],
      correctHindi: "\u0915\u0941\u0902\u0924\u0940",
      correctEnglish: "Kunti",
      explanationHindi: "\u092E\u0939\u093E\u0930\u093E\u091C \u092A\u093E\u0923\u094D\u0921\u0941 \u0915\u0940 \u091C\u094D\u092F\u0947\u0937\u094D\u0920 \u092A\u0924\u094D\u0928\u0940 \u0915\u0941\u0902\u0924\u0940 \u0928\u0947 \u0927\u0930\u094D\u092E\u0930\u093E\u091C, \u092A\u0935\u0928 \u0926\u0947\u0935 \u0914\u0930 \u0907\u0902\u0926\u094D\u0930 \u0915\u0947 \u0905\u0902\u0936 \u0938\u0947 \u092F\u0941\u0927\u093F\u0937\u094D\u0920\u093F\u0930, \u092D\u0940\u092E \u0914\u0930 \u0905\u0930\u094D\u091C\u0941\u0928 \u0915\u094B \u091C\u0928\u094D\u092E \u0926\u093F\u092F\u093E \u0925\u093E\u0964",
      explanationEnglish: "Kunti was the senior queen of King Pandu who gave birth to Yudhishthira, Bhima, and Arjuna.",
      ref: "Mahabharata"
    },
    {
      textHindi: "\u092E\u0939\u093E\u092D\u093E\u0930\u0924 \u092F\u0941\u0926\u094D\u0927 \u092E\u0947\u0902 \u091A\u0915\u094D\u0930\u0935\u094D\u092F\u0942\u0939 \u092D\u0947\u0926\u0928\u0947 \u0915\u0947 \u0926\u094C\u0930\u093E\u0928 \u0915\u093F\u0938 \u0935\u0940\u0930 \u092F\u094B\u0926\u094D\u0927\u093E \u0928\u0947 \u0935\u0940\u0930\u0917\u0924\u093F \u092A\u094D\u0930\u093E\u092A\u094D\u0924 \u0915\u0940 \u0925\u0940?",
      textEnglish: "Which brave warrior achieved martyrdom while breaking the Chakravyuha in the Mahabharata war?",
      optionsHindi: ["\u0905\u092D\u093F\u092E\u0928\u094D\u092F\u0941", "\u0918\u091F\u094B\u0924\u094D\u0915\u091A", "\u0932\u0915\u094D\u0937\u094D\u092E\u0923 \u0915\u0941\u092E\u093E\u0930", "\u0926\u094D\u0930\u0941\u092A\u0926"],
      optionsEnglish: ["Abhimanyu", "Ghatotkacha", "Lakshmana Kumara", "Drupada"],
      correctHindi: "\u0905\u092D\u093F\u092E\u0928\u094D\u092F\u0941",
      correctEnglish: "Abhimanyu",
      explanationHindi: "\u0905\u0930\u094D\u091C\u0941\u0928 \u0915\u0947 \u092A\u0941\u0924\u094D\u0930 \u0935\u0940\u0930 \u0905\u092D\u093F\u092E\u0928\u094D\u092F\u0941 \u0928\u0947 \u0915\u0941\u0930\u0941\u0915\u094D\u0937\u0947\u0924\u094D\u0930 \u092F\u0941\u0926\u094D\u0927 \u0915\u0947 13\u0935\u0947\u0902 \u0926\u093F\u0928 \u0926\u094D\u0930\u094B\u0923\u093E\u091A\u093E\u0930\u094D\u092F \u0926\u094D\u0935\u093E\u0930\u093E \u0930\u091A\u093F\u0924 \u091A\u0915\u094D\u0930\u0935\u094D\u092F\u0942\u0939 \u092E\u0947\u0902 \u092A\u094D\u0930\u0935\u0947\u0936 \u0915\u0930 \u0936\u094C\u0930\u094D\u092F\u092A\u0942\u0930\u094D\u0935\u0915 \u0932\u0921\u093C\u0924\u0947 \u0939\u0941\u090F \u0935\u0940\u0930\u0917\u0924\u093F \u092A\u094D\u0930\u093E\u092A\u094D\u0924 \u0915\u0940 \u0925\u0940\u0964",
      explanationEnglish: "Abhimanyu, the son of Arjuna, heroically entered and fought in the Chakravyuha on the 13th day of the war.",
      ref: "Mahabharata"
    }
  ];
  const shivPuranTemplates = [
    {
      textHindi: "\u0936\u093F\u0935 \u092A\u0941\u0930\u093E\u0923 \u0915\u0947 \u0905\u0928\u0941\u0938\u093E\u0930 \u092D\u0917\u0935\u093E\u0928 \u0936\u093F\u0935 \u0915\u093E \u092E\u0941\u0916\u094D\u092F \u0935\u093E\u0939\u0928 \u0915\u094C\u0928 \u0939\u0948?",
      textEnglish: "According to Shiva Purana, who is the primary vehicle (vahana) of Lord Shiva?",
      optionsHindi: ["\u0928\u0902\u0926\u0940 (\u092C\u0948\u0932)", "\u0917\u0930\u0941\u0921\u093C (\u091A\u0940\u0932)", "\u0938\u093F\u0902\u0939 (\u0936\u0947\u0930)", "\u092E\u092F\u0942\u0930 (\u092E\u094B\u0930)"],
      optionsEnglish: ["Nandi (Bull)", "Garuda (Eagle)", "Lion", "Peacock"],
      correctHindi: "\u0928\u0902\u0926\u0940 (\u092C\u0948\u0932)",
      correctEnglish: "Nandi (Bull)",
      explanationHindi: "\u092D\u0917\u0935\u093E\u0928 \u0936\u093F\u0935 \u0915\u0947 \u0935\u093E\u0939\u0928 \u0928\u0902\u0926\u0940 (\u092C\u0948\u0932) \u0939\u0948\u0902, \u091C\u094B \u0927\u0930\u094D\u092E, \u092C\u0932 \u0914\u0930 \u0928\u093F\u0937\u094D\u0920\u093E \u0915\u0947 \u092A\u094D\u0930\u0924\u0940\u0915 \u0939\u0948\u0902\u0964",
      explanationEnglish: "Nandi, the sacred bull, is Lord Shiva's mount, representing righteousness and devotion.",
      ref: "Shiva Purana"
    },
    {
      textHindi: "\u092D\u093E\u0930\u0924 \u0935\u0930\u094D\u0937 \u092E\u0947\u0902 \u0915\u0941\u0932 \u0915\u093F\u0924\u0928\u0947 \u092A\u094D\u0930\u092E\u0941\u0916 \u091C\u094D\u092F\u094B\u0924\u093F\u0930\u094D\u0932\u093F\u0902\u0917 \u0938\u094D\u0925\u093E\u092A\u093F\u0924 \u0939\u0948\u0902?",
      textEnglish: "How many major Jyotirlingas are established across India?",
      optionsHindi: ["12", "10", "108", "7"],
      optionsEnglish: ["12", "10", "108", "7"],
      correctHindi: "12",
      correctEnglish: "12",
      explanationHindi: "\u092D\u093E\u0930\u0924 \u092E\u0947\u0902 \u0915\u0941\u0932 12 \u0938\u094D\u0935\u092F\u0902\u092D\u0942 \u091C\u094D\u092F\u094B\u0924\u093F\u0930\u094D\u0932\u093F\u0902\u0917 \u0939\u0948\u0902, \u091C\u093F\u0928\u092E\u0947\u0902 \u0938\u094B\u092E\u0928\u093E\u0925, \u0915\u0947\u0926\u093E\u0930\u0928\u093E\u0925, \u0915\u093E\u0936\u0940 \u0935\u093F\u0936\u094D\u0935\u0928\u093E\u0925 \u0914\u0930 \u092E\u0939\u093E\u0915\u093E\u0932\u0947\u0936\u094D\u0935\u0930 \u0936\u093E\u092E\u093F\u0932 \u0939\u0948\u0902\u0964",
      explanationEnglish: "There are 12 self-manifested Jyotirlingas in India, such as Somnath, Kedarnath, and Kashi Vishwanath.",
      ref: "Shiva Purana"
    },
    {
      textHindi: "\u092E\u093E\u0924\u093E \u092A\u093E\u0930\u094D\u0935\u0924\u0940 \u0915\u093F\u0938 \u092E\u0939\u093E\u0928 \u092A\u0930\u094D\u0935\u0924\u0930\u093E\u091C \u0915\u0940 \u092A\u0941\u0924\u094D\u0930\u0940 \u0925\u0940\u0902?",
      textEnglish: "Goddess Parvati was the daughter of which great mountain king?",
      optionsHindi: ["\u0939\u093F\u092E\u093E\u0932\u092F (\u0939\u093F\u092E\u0935\u093E\u0928)", "\u0935\u093F\u0902\u0927\u094D\u092F\u093E\u091A\u0932", "\u0938\u0941\u092E\u0947\u0930\u0941", "\u0915\u0948\u0932\u093E\u0936"],
      optionsEnglish: ["Himavan (Himalaya)", "Vindhyachal", "Sumeru", "Kailash"],
      correctHindi: "\u0939\u093F\u092E\u093E\u0932\u092F (\u0939\u093F\u092E\u0935\u093E\u0928)",
      correctEnglish: "Himavan (Himalaya)",
      explanationHindi: "\u092E\u093E\u0924\u093E \u092A\u093E\u0930\u094D\u0935\u0924\u0940 \u092A\u0930\u094D\u0935\u0924\u0930\u093E\u091C \u0939\u093F\u092E\u0935\u093E\u0928 (\u0939\u093F\u092E\u093E\u0932\u092F) \u0914\u0930 \u0930\u093E\u0928\u0940 \u092E\u0948\u0928\u093E \u0915\u0940 \u092A\u0941\u0924\u094D\u0930\u0940 \u0925\u0940\u0902, \u0907\u0938\u0932\u093F\u090F \u0909\u0928\u094D\u0939\u0947\u0902 \u0936\u0948\u0932\u092A\u0941\u0924\u094D\u0930\u0940 \u0914\u0930 \u0939\u0947\u092E\u0935\u0924\u0940 \u092D\u0940 \u0915\u0939\u093E \u091C\u093E\u0924\u093E \u0939\u0948\u0964",
      explanationEnglish: "Goddess Parvati was the daughter of the mountain king Himavan and Queen Maina.",
      ref: "Shiva Purana"
    },
    {
      textHindi: "\u092D\u0917\u0935\u093E\u0928 \u0936\u093F\u0935 \u0914\u0930 \u092E\u093E\u0924\u093E \u092A\u093E\u0930\u094D\u0935\u0924\u0940 \u0915\u0947 \u091C\u094D\u092F\u0947\u0937\u094D\u0920 \u092A\u0941\u0924\u094D\u0930 \u0915\u093E \u0915\u094D\u092F\u093E \u0928\u093E\u092E \u0939\u0948 \u091C\u093F\u0928\u094D\u0939\u094B\u0902\u0928\u0947 \u0924\u093E\u0930\u0915\u093E\u0938\u0941\u0930 \u0915\u093E \u0935\u0927 \u0915\u093F\u092F\u093E \u0925\u093E?",
      textEnglish: "What is the name of Shiva and Parvati's elder son who slayed the demon Tarakasura?",
      optionsHindi: ["\u0915\u093E\u0930\u094D\u0924\u093F\u0915\u0947\u092F (\u0938\u094D\u0915\u0902\u0926)", "\u0917\u0923\u0947\u0936", "\u0905\u0936\u094B\u0915 \u0938\u0941\u0902\u0926\u0930\u0940", "\u091C\u0932\u0902\u0927\u0930"],
      optionsEnglish: ["Kartikeya (Skanda)", "Ganesha", "Ashoka Sundari", "Jalandhara"],
      correctHindi: "\u0915\u093E\u0930\u094D\u0924\u093F\u0915\u0947\u092F (\u0938\u094D\u0915\u0902\u0926)",
      correctEnglish: "Kartikeya (Skanda)",
      explanationHindi: "\u092D\u0917\u0935\u093E\u0928 \u0936\u093F\u0935 \u0914\u0930 \u092A\u093E\u0930\u094D\u0935\u0924\u0940 \u0915\u0947 \u092C\u0921\u093C\u0947 \u092A\u0941\u0924\u094D\u0930 \u0915\u093E\u0930\u094D\u0924\u093F\u0915\u0947\u092F (\u0938\u094D\u0915\u0902\u0926) \u0939\u0948\u0902, \u091C\u093F\u0928\u094D\u0939\u094B\u0902\u0928\u0947 \u0926\u0947\u0935\u0924\u093E\u0913\u0902 \u0915\u0947 \u0938\u0947\u0928\u093E\u092A\u0924\u093F \u092C\u0928\u0915\u0930 \u0924\u093E\u0930\u0915\u093E\u0938\u0941\u0930 \u0915\u093E \u0905\u0902\u0924 \u0915\u093F\u092F\u093E \u0925\u093E\u0964",
      explanationEnglish: "Kartikeya (also known as Skanda or Murugan) is the elder son of Shiva who defeated Tarakasura.",
      ref: "Shiva Purana"
    },
    {
      textHindi: "\u0936\u093F\u0935\u0930\u093E\u0924\u094D\u0930\u093F \u0915\u093E \u092A\u093E\u0935\u0928 \u0935\u094D\u0930\u0924 \u0915\u093F\u0938 \u0939\u093F\u0902\u0926\u0942 \u092E\u0939\u0940\u0928\u0947 \u0915\u0947 \u0915\u0943\u0937\u094D\u0923 \u092A\u0915\u094D\u0937 \u0915\u0940 \u091A\u0924\u0941\u0930\u094D\u0926\u0936\u0940 \u0915\u094B \u092E\u0928\u093E\u092F\u093E \u091C\u093E\u0924\u093E \u0939\u0948?",
      textEnglish: "The auspicious fast of Maha Shivratri is celebrated on the Chaturdashi of Krishna Paksha in which Hindu month?",
      optionsHindi: ["\u092B\u093E\u0932\u094D\u0917\u0941\u0928", "\u0915\u093E\u0930\u094D\u0924\u093F\u0915", "\u0938\u093E\u0935\u0928", "\u0906\u0936\u094D\u0935\u093F\u0928"],
      optionsEnglish: ["Phalguna", "Kartika", "Shravana", "Ashvina"],
      correctHindi: "\u092B\u093E\u0932\u094D\u0917\u0941\u0928",
      correctEnglish: "Phalguna",
      explanationHindi: "\u092B\u093E\u0932\u094D\u0917\u0941\u0928 \u092E\u093E\u0938 \u0915\u0947 \u0915\u0943\u0937\u094D\u0923 \u092A\u0915\u094D\u0937 \u0915\u0940 \u091A\u0924\u0941\u0930\u094D\u0926\u0936\u0940 \u0924\u093F\u0925\u093F \u0915\u094B \u0936\u093F\u0935 \u0914\u0930 \u092A\u093E\u0930\u094D\u0935\u0924\u0940 \u0915\u0947 \u092A\u093E\u0935\u0928 \u0935\u093F\u0935\u093E\u0939 \u0915\u0947 \u0909\u092A\u0932\u0915\u094D\u0937\u094D\u092F \u092E\u0947\u0902 \u092E\u0939\u093E\u0936\u093F\u0935\u0930\u093E\u0924\u094D\u0930\u093F \u092E\u0928\u093E\u0908 \u091C\u093E\u0924\u0940 \u0939\u0948\u0964",
      explanationEnglish: "Maha Shivratri is celebrated in the month of Phalguna on Krishna Paksha Chaturdashi.",
      ref: "Shiva Purana"
    }
  ];
  const vishnuPuranTemplates = [
    {
      textHindi: "\u0935\u093F\u0937\u094D\u0923\u0941 \u092A\u0941\u0930\u093E\u0923 \u0915\u0947 \u0905\u0928\u0941\u0938\u093E\u0930 \u092D\u0917\u0935\u093E\u0928 \u0935\u093F\u0937\u094D\u0923\u0941 \u0915\u0947 \u092A\u094D\u0930\u092E\u0941\u0916 \u0915\u0941\u0932 \u0915\u093F\u0924\u0928\u0947 \u092E\u0941\u0916\u094D\u092F \u0905\u0935\u0924\u093E\u0930 (\u0926\u0936\u093E\u0935\u0924\u093E\u0930) \u092E\u093E\u0928\u0947 \u0917\u090F \u0939\u0948\u0902?",
      textEnglish: "According to Vishnu Purana, how many primary incarnations (Dashavatara) of Lord Vishnu are recognized?",
      optionsHindi: ["10", "12", "24", "4"],
      optionsEnglish: ["10", "12", "24", "4"],
      correctHindi: "10",
      correctEnglish: "10",
      explanationHindi: "\u092D\u0917\u0935\u093E\u0928 \u0935\u093F\u0937\u094D\u0923\u0941 \u0915\u0947 10 \u092E\u0941\u0916\u094D\u092F \u0905\u0935\u0924\u093E\u0930 (\u0926\u0936\u093E\u0935\u0924\u093E\u0930) \u092E\u093E\u0928\u0947 \u0917\u090F \u0939\u0948\u0902, \u091C\u093F\u0928\u092E\u0947\u0902 \u092E\u0924\u094D\u0938\u094D\u092F, \u0915\u0942\u0930\u094D\u092E, \u0935\u0930\u093E\u0939 \u0938\u0947 \u0932\u0947\u0915\u0930 \u092D\u093E\u0935\u0940 \u0915\u0932\u094D\u0915\u093F \u0905\u0935\u0924\u093E\u0930 \u0936\u093E\u092E\u093F\u0932 \u0939\u0948\u0902\u0964",
      explanationEnglish: "The ten primary incarnations of Lord Vishnu are known as the Dashavatara.",
      ref: "Vishnu Purana"
    },
    {
      textHindi: "\u092D\u0917\u0935\u093E\u0928 \u0935\u093F\u0937\u094D\u0923\u0941 \u0915\u0947 \u092A\u0930\u092E \u092D\u0915\u094D\u0924 \u092C\u093E\u0932\u0915 \u092A\u094D\u0930\u0939\u094D\u0932\u093E\u0926 \u0915\u0947 \u092A\u093F\u0924\u093E \u0915\u093E \u0915\u094D\u092F\u093E \u0928\u093E\u092E \u0925\u093E?",
      textEnglish: "What was the name of the father of the child devotee Prahlada?",
      optionsHindi: ["\u0939\u093F\u0930\u0923\u094D\u092F\u0915\u0936\u093F\u092A\u0941", "\u0939\u093F\u0930\u0923\u094D\u092F\u093E\u0915\u094D\u0937", "\u0930\u093E\u0935\u0923", "\u0915\u0902\u0938"],
      optionsEnglish: ["Hiranyakashipu", "Hiranyaksha", "Ravana", "Kansa"],
      correctHindi: "\u0939\u093F\u0930\u0923\u094D\u092F\u0915\u0936\u093F\u092A\u0941",
      correctEnglish: "Hiranyakashipu",
      explanationHindi: "\u092C\u093E\u0932\u0915 \u092A\u094D\u0930\u0939\u094D\u0932\u093E\u0926 \u0915\u0947 \u092A\u093F\u0924\u093E \u0926\u0948\u0924\u094D\u092F\u0930\u093E\u091C \u0939\u093F\u0930\u0923\u094D\u092F\u0915\u0936\u093F\u092A\u0941 \u0925\u0947, \u091C\u093F\u0928\u0915\u093E \u0935\u0927 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u092D\u0917\u0935\u093E\u0928 \u0935\u093F\u0937\u094D\u0923\u0941 \u0928\u0947 \u0928\u0943\u0938\u093F\u0902\u0939 \u0905\u0935\u0924\u093E\u0930 \u0932\u093F\u092F\u093E \u0925\u093E\u0964",
      explanationEnglish: "Prahlada's father was the demon king Hiranyakashipu, who was slain by Vishnu in Narasimha avatara.",
      ref: "Vishnu Purana"
    },
    {
      textHindi: "\u092D\u0917\u0935\u093E\u0928 \u0935\u093F\u0937\u094D\u0923\u0941 \u0915\u0947 \u0909\u0938 \u092A\u093E\u0935\u0928 \u0935\u093E\u0939\u0928 \u0915\u093E \u0928\u093E\u092E \u0915\u094D\u092F\u093E \u0939\u0948 \u091C\u094B \u092A\u0915\u094D\u0937\u0940\u0930\u093E\u091C \u0915\u0939\u0932\u093E\u0924\u0947 \u0939\u0948\u0902?",
      textEnglish: "What is the name of Lord Vishnu's sacred mount who is known as the king of birds?",
      optionsHindi: ["\u0917\u0930\u0941\u0921\u093C", "\u0928\u0902\u0926\u0940", "\u0936\u0947\u0937\u0928\u093E\u0917", "\u0910\u0930\u093E\u0935\u0924"],
      optionsEnglish: ["Garuda", "Nandi", "Sheshnag", "Airavata"],
      correctHindi: "\u0917\u0930\u0941\u0921\u093C",
      correctEnglish: "Garuda",
      explanationHindi: "\u092D\u0917\u0935\u093E\u0928 \u0935\u093F\u0937\u094D\u0923\u0941 \u0915\u093E \u092A\u093E\u0935\u0928 \u0935\u093E\u0939\u0928 \u0917\u0930\u0941\u0921\u093C \u0926\u0947\u0935 \u0939\u0948\u0902, \u091C\u094B \u092A\u0915\u094D\u0937\u093F\u092F\u094B\u0902 \u0915\u0947 \u0930\u093E\u091C\u093E \u0914\u0930 \u0924\u0940\u0935\u094D\u0930 \u0917\u0924\u093F \u0915\u0947 \u092A\u094D\u0930\u0924\u0940\u0915 \u0939\u0948\u0902\u0964",
      explanationEnglish: "Garuda, the divine king of birds, serves as the vehicle of Lord Vishnu.",
      ref: "Vishnu Purana"
    },
    {
      textHindi: "\u092D\u0917\u0935\u093E\u0928 \u0935\u093F\u0937\u094D\u0923\u0941 \u0915\u0947 \u0939\u093E\u0925 \u092E\u0947\u0902 \u0938\u0941\u0936\u094B\u092D\u093F\u0924 \u091A\u0915\u094D\u0930 \u0915\u093E \u0915\u094D\u092F\u093E \u0928\u093E\u092E \u0939\u0948?",
      textEnglish: "What is the name of the divine discus (chakra) held by Lord Vishnu?",
      optionsHindi: ["\u0938\u0941\u0926\u0930\u094D\u0936\u0928 \u091A\u0915\u094D\u0930", "\u092A\u093F\u0928\u093E\u0915", "\u0915\u093E\u0932\u091A\u0915\u094D\u0930", "\u0935\u091C\u094D\u0930"],
      optionsEnglish: ["Sudarshana Chakra", "Pinaka", "Kalachakra", "Vajra"],
      correctHindi: "\u0938\u0941\u0926\u0930\u094D\u0936\u0928 \u091A\u0915\u094D\u0930",
      correctEnglish: "Sudarshana Chakra",
      explanationHindi: "\u092D\u0917\u0935\u093E\u0928 \u0935\u093F\u0937\u094D\u0923\u0941 \u0915\u0947 \u0939\u093E\u0925 \u092E\u0947\u0902 \u0938\u0941\u0936\u094B\u092D\u093F\u0924 \u091A\u0915\u094D\u0930 \u0938\u0941\u0926\u0930\u094D\u0936\u0928 \u091A\u0915\u094D\u0930 \u0915\u0939\u0932\u093E\u0924\u093E \u0939\u0948, \u091C\u094B \u092C\u094D\u0930\u0939\u094D\u092E\u093E\u0902\u0921 \u0915\u093E \u0905\u092E\u094B\u0918 \u0936\u0938\u094D\u0924\u094D\u0930 \u0939\u0948\u0964",
      explanationEnglish: "The Sudarshana Chakra is the spinning, disc-like weapon held by Lord Vishnu.",
      ref: "Vishnu Purana"
    },
    {
      textHindi: "\u092D\u0917\u0935\u093E\u0928 \u0935\u093F\u0937\u094D\u0923\u0941 \u0915\u0940 \u0905\u0930\u094D\u0927\u093E\u0902\u0917\u093F\u0928\u0940 \u0914\u0930 \u0927\u0928-\u0910\u0936\u094D\u0935\u0930\u094D\u092F \u0915\u0940 \u0905\u0927\u093F\u0937\u094D\u0920\u093E\u0924\u094D\u0930\u0940 \u0926\u0947\u0935\u0940 \u0915\u094C\u0928 \u0939\u0948\u0902?",
      textEnglish: "Who is Lord Vishnu's consort and the goddess of wealth and prosperity?",
      optionsHindi: ["\u0926\u0947\u0935\u0940 \u0932\u0915\u094D\u0937\u094D\u092E\u0940", "\u0926\u0947\u0935\u0940 \u0938\u0930\u0938\u094D\u0935\u0924\u0940", "\u0926\u0947\u0935\u0940 \u092A\u093E\u0930\u094D\u0935\u0924\u0940", "\u0926\u0947\u0935\u0940 \u0917\u093E\u092F\u0924\u094D\u0930\u0940"],
      optionsEnglish: ["Goddess Lakshmi", "Goddess Saraswati", "Goddess Parvati", "Goddess Gayatri"],
      correctHindi: "\u0926\u0947\u0935\u0940 \u0932\u0915\u094D\u0937\u094D\u092E\u0940",
      correctEnglish: "Goddess Lakshmi",
      explanationHindi: "\u092D\u0917\u0935\u093E\u0928 \u0935\u093F\u0937\u094D\u0923\u0941 \u0915\u0940 \u0905\u0930\u094D\u0927\u093E\u0902\u0917\u093F\u0928\u0940 \u091C\u0917\u0928\u094D\u092E\u093E\u0924\u093E \u092E\u0939\u093E\u0932\u0915\u094D\u0937\u094D\u092E\u0940 \u0939\u0948\u0902, \u091C\u094B \u0938\u0943\u0937\u094D\u091F\u093F \u0915\u0940 \u092A\u093E\u0932\u0928 \u0936\u0915\u094D\u0924\u093F \u0914\u0930 \u0910\u0936\u094D\u0935\u0930\u094D\u092F \u0915\u0940 \u0926\u0947\u0935\u0940 \u0939\u0948\u0902\u0964",
      explanationEnglish: "Goddess Lakshmi is the divine consort of Vishnu, presiding over wealth and abundance.",
      ref: "Vishnu Purana"
    }
  ];
  const bhagavatamTemplates = [
    {
      textHindi: "\u0936\u094D\u0930\u0940\u092E\u0926\u094D\u092D\u093E\u0917\u0935\u0924 \u092E\u0939\u093E\u092A\u0941\u0930\u093E\u0923 \u092E\u0947\u0902 \u0915\u0941\u0932 \u0915\u093F\u0924\u0928\u0947 \u0938\u094D\u0915\u0902\u0927 (\u092D\u093E\u0917) \u0939\u0948\u0902?",
      textEnglish: "How many Cantos (Skandhas) are there in Srimad Bhagavatam?",
      optionsHindi: ["12 \u0938\u094D\u0915\u0902\u0927", "18 \u0938\u094D\u0915\u0902\u0927", "10 \u0938\u094D\u0915\u0902\u0927", "7 \u0938\u094D\u0915\u0902\u0927"],
      optionsEnglish: ["12 Cantos", "18 Cantos", "10 Cantos", "7 Cantos"],
      correctHindi: "12 \u0938\u094D\u0915\u0902\u0927",
      correctEnglish: "12 Cantos",
      explanationHindi: "\u0936\u094D\u0930\u0940\u092E\u0926\u094D\u092D\u093E\u0917\u0935\u0924 \u092E\u0947\u0902 \u0915\u0941\u0932 12 \u0938\u094D\u0915\u0902\u0927 \u0914\u0930 18,000 \u0936\u094D\u0932\u094B\u0915 \u0939\u0948\u0902, \u091C\u094B \u092D\u0915\u094D\u0924\u093F \u0930\u0938 \u0938\u0947 \u092A\u0930\u093F\u092A\u0942\u0930\u094D\u0923 \u0939\u0948\u0902\u0964",
      explanationEnglish: "Srimad Bhagavatam consists of 12 Cantos (Skandhas) and contains approximately 18,000 verses.",
      ref: "Srimad Bhagavatam"
    },
    {
      textHindi: "\u092E\u0939\u093E\u0930\u093E\u091C \u092A\u0930\u0940\u0915\u094D\u0937\u093F\u0924 \u0915\u094B \u0938\u093E\u0924 \u0926\u093F\u0928\u094B\u0902 \u092E\u0947\u0902 \u092E\u0941\u0915\u094D\u0924\u093F \u0926\u093F\u0932\u093E\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u0936\u094D\u0930\u0940\u092E\u0926\u094D\u092D\u093E\u0917\u0935\u0924 \u0915\u0925\u093E \u0915\u093E \u0936\u094D\u0930\u0935\u0923 \u0915\u093F\u0938\u0928\u0947 \u0915\u0930\u093E\u092F\u093E \u0925\u093E?",
      textEnglish: "Who narrated the Srimad Bhagavatam to King Parikshit to grant him liberation in seven days?",
      optionsHindi: ["\u0936\u0941\u0915\u0926\u0947\u0935 \u091C\u0940", "\u0938\u0942\u0924 \u091C\u0940", "\u0928\u093E\u0930\u0926 \u092E\u0941\u0928\u093F", "\u0935\u094D\u092F\u093E\u0938 \u0926\u0947\u0935"],
      optionsEnglish: ["Shukadeva Goswami", "Suta Goswami", "Narada Muni", "Vyasa Dev"],
      correctHindi: "\u0936\u0941\u0915\u0926\u0947\u0935 \u091C\u0940",
      correctEnglish: "Shukadeva Goswami",
      explanationHindi: "\u0935\u094D\u092F\u093E\u0938 \u092A\u0941\u0924\u094D\u0930 \u092A\u0930\u092E \u091C\u094D\u091E\u093E\u0928\u0940 \u0936\u094D\u0930\u0940 \u0936\u0941\u0915\u0926\u0947\u0935 \u091C\u0940 \u0928\u0947 \u0917\u0902\u0917\u093E \u0924\u091F \u092A\u0930 \u092E\u0939\u093E\u0930\u093E\u091C \u092A\u0930\u0940\u0915\u094D\u0937\u093F\u0924 \u0915\u094B \u092D\u093E\u0917\u0935\u0924 \u0915\u0925\u093E \u0938\u0941\u0928\u093E\u0908 \u0925\u0940\u0964",
      explanationEnglish: "Sage Shukadeva, the son of Vyasa, narrated this supreme scripture to King Parikshit on the banks of Ganga.",
      ref: "Srimad Bhagavatam"
    },
    {
      textHindi: "\u0936\u094D\u0930\u0940\u092E\u0926\u094D\u092D\u093E\u0917\u0935\u0924 \u0915\u0947 \u0915\u093F\u0938 \u0938\u094D\u0915\u0902\u0927 \u092E\u0947\u0902 \u092D\u0917\u0935\u093E\u0928 \u0936\u094D\u0930\u0940\u0915\u0943\u0937\u094D\u0923 \u0915\u0947 \u092C\u093E\u0932\u094D\u092F\u0915\u093E\u0932 \u0914\u0930 \u0930\u093E\u0938\u0932\u0940\u0932\u093E \u0915\u093E \u0935\u093F\u0938\u094D\u0924\u0943\u0924 \u0935\u0930\u094D\u0923\u0928 \u0939\u0948?",
      textEnglish: "Which Canto of Bhagavatam contains the detailed pastimes of Lord Krishna's childhood and Rasa Leela?",
      optionsHindi: ["\u0926\u0936\u092E \u0938\u094D\u0915\u0902\u0927 (Canto 10)", "\u092A\u094D\u0930\u0925\u092E \u0938\u094D\u0915\u0902\u0927", "\u0926\u094D\u0935\u093E\u0926\u0936 \u0938\u094D\u0915\u0902\u0927", "\u092A\u0902\u091A\u092E \u0938\u094D\u0915\u0902\u0927"],
      optionsEnglish: ["Canto 10", "Canto 1", "Canto 12", "Canto 5"],
      correctHindi: "\u0926\u0936\u092E \u0938\u094D\u0915\u0902\u0927 (Canto 10)",
      correctEnglish: "Canto 10",
      explanationHindi: "\u0936\u094D\u0930\u0940\u092E\u0926\u094D\u092D\u093E\u0917\u0935\u0924 \u0915\u093E \u0926\u0936\u092E \u0938\u094D\u0915\u0902\u0927 \u092A\u0942\u0930\u094D\u0923 \u0930\u0942\u092A \u0938\u0947 \u092D\u0917\u0935\u093E\u0928 \u0936\u094D\u0930\u0940\u0915\u0943\u0937\u094D\u0923 \u0915\u0940 \u092C\u093E\u0932 \u0932\u0940\u0932\u093E\u0913\u0902, \u092E\u093E\u0916\u0928\u091A\u094B\u0930\u0940, \u0914\u0930 \u092E\u0939\u093E\u0930\u093E\u0938 \u092A\u0930 \u0906\u0927\u093E\u0930\u093F\u0924 \u0939\u0948\u0964",
      explanationEnglish: "The 10th Canto is the heart of Bhagavatam, dedicated entirely to the pastimes of Lord Krishna.",
      ref: "Srimad Bhagavatam Canto 10"
    },
    {
      textHindi: "\u092D\u0917\u0935\u093E\u0928 \u0936\u094D\u0930\u0940\u0915\u0943\u0937\u094D\u0923 \u0915\u0947 \u0909\u0938 \u092A\u0930\u092E \u092E\u093F\u0924\u094D\u0930 \u0915\u093E \u0915\u094D\u092F\u093E \u0928\u093E\u092E \u0925\u093E \u091C\u094B \u0905\u0924\u094D\u092F\u0902\u0924 \u0928\u093F\u0930\u094D\u0927\u0928 \u092C\u094D\u0930\u093E\u0939\u094D\u092E\u0923 \u0925\u0947 \u0914\u0930 \u0938\u0902\u0926\u0940\u092A\u0928\u093F \u0906\u0936\u094D\u0930\u092E \u092E\u0947\u0902 \u0938\u0939\u092A\u093E\u0920\u0940 \u0925\u0947?",
      textEnglish: "What was the name of Lord Krishna's poor Brahmin childhood friend and classmate at Sandipani Ashram?",
      optionsHindi: ["\u0938\u0941\u0926\u093E\u092E\u093E", "\u0909\u0926\u094D\u0927\u0935", "\u0905\u0915\u094D\u0930\u0942\u0930", "\u0905\u0930\u094D\u091C\u0941\u0928"],
      optionsEnglish: ["Sudama", "Uddhava", "Akrura", "Arjuna"],
      correctHindi: "\u0938\u0941\u0926\u093E\u092E\u093E",
      correctEnglish: "Sudama",
      explanationHindi: "\u0915\u0943\u0937\u094D\u0923 \u0915\u0947 \u092A\u0930\u092E \u0938\u0916\u093E \u0938\u0941\u0926\u093E\u092E\u093E \u0925\u0947, \u091C\u093F\u0928\u0915\u0940 \u0926\u0940\u0928\u0926\u0936\u093E \u0926\u0947\u0916\u0915\u0930 \u0926\u094D\u0935\u093E\u0930\u0915\u093E\u0927\u0940\u0936 \u0936\u094D\u0930\u0940\u0915\u0943\u0937\u094D\u0923 \u0928\u0947 \u0909\u0928\u0915\u0947 \u0906\u0902\u0938\u0941\u0913\u0902 \u0938\u0947 \u092A\u0948\u0930 \u0927\u094B\u090F \u0925\u0947\u0964",
      explanationEnglish: "Sudama was Lord Krishna's beloved classmate whose humble devotion moved Krishna to wash his feet with tears.",
      ref: "Srimad Bhagavatam"
    },
    {
      textHindi: "\u092D\u0917\u0935\u093E\u0928 \u0936\u094D\u0930\u0940\u0915\u0943\u0937\u094D\u0923 \u0915\u0947 \u092A\u0930\u092E \u091C\u094D\u091E\u093E\u0928\u0940 \u0938\u0916\u093E \u0914\u0930 \u0926\u0942\u0924 \u0915\u093E \u0915\u094D\u092F\u093E \u0928\u093E\u092E \u0925\u093E \u091C\u093F\u0928\u094D\u0939\u0947\u0902 \u0915\u0943\u0937\u094D\u0923 \u0928\u0947 \u0917\u094B\u092A\u093F\u092F\u094B\u0902 \u0915\u094B \u0938\u093E\u0902\u0924\u094D\u0935\u0928\u093E \u0926\u0947\u0928\u0947 \u0939\u0947\u0924\u0941 \u0935\u0943\u0902\u0926\u093E\u0935\u0928 \u092D\u0947\u091C\u093E \u0925\u093E?",
      textEnglish: "What was the name of Lord Krishna's wise friend and messenger whom he sent to Vrindavan to console the Gopis?",
      optionsHindi: ["\u0909\u0926\u094D\u0927\u0935", "\u0938\u0941\u0926\u093E\u092E\u093E", "\u0905\u0915\u094D\u0930\u0942\u0930", "\u092C\u0932\u0930\u093E\u092E"],
      optionsEnglish: ["Uddhava", "Sudama", "Akrura", "Balarama"],
      correctHindi: "\u0909\u0926\u094D\u0927\u0935",
      correctEnglish: "Uddhava",
      explanationHindi: "\u0936\u094D\u0930\u0940\u0915\u0943\u0937\u094D\u0923 \u0915\u0947 \u091C\u094D\u091E\u093E\u0928\u0940 \u0938\u0916\u093E \u0909\u0926\u094D\u0927\u0935 \u0925\u0947, \u091C\u093F\u0928\u094D\u0939\u0947\u0902 \u091C\u094D\u091E\u093E\u0928 \u0915\u093E \u0905\u092D\u093F\u092E\u093E\u0928 \u0926\u0942\u0930 \u0915\u0930\u0928\u0947 \u0914\u0930 \u092A\u094D\u0930\u0947\u092E \u0915\u093E \u092A\u093E\u0920 \u0938\u0940\u0916\u0928\u0947 \u0939\u0947\u0924\u0941 \u0915\u0943\u0937\u094D\u0923 \u0928\u0947 \u092C\u094D\u0930\u091C \u092D\u0947\u091C\u093E \u0925\u093E\u0964",
      explanationEnglish: "Uddhava, the wise disciple of Brihaspati and friend of Krishna, was sent to Vrindavan with a message for the Gopis.",
      ref: "Srimad Bhagavatam Canto 10"
    }
  ];
  const vedasTemplates = [
    {
      textHindi: "\u0938\u0902\u0938\u093E\u0930 \u0915\u0947 \u0938\u092C\u0938\u0947 \u092A\u094D\u0930\u093E\u091A\u0940\u0928\u0924\u092E \u0932\u093F\u0916\u093F\u0924 \u0917\u094D\u0930\u0902\u0925 \u0915\u093E \u0915\u094D\u092F\u093E \u0928\u093E\u092E \u0939\u0948?",
      textEnglish: "What is the name of the oldest written scripture in the world?",
      optionsHindi: ["\u090B\u0917\u094D\u0935\u0947\u0926", "\u0938\u093E\u092E\u0935\u0947\u0926", "\u092F\u091C\u0941\u0930\u094D\u0935\u0947\u0926", "\u0905\u0925\u0930\u094D\u0935\u0935\u0947\u0926"],
      optionsEnglish: ["Rigveda", "Samaveda", "Yajurveda", "Atharvaveda"],
      correctHindi: "\u090B\u0917\u094D\u0935\u0947\u0926",
      correctEnglish: "Rigveda",
      explanationHindi: "\u090B\u0917\u094D\u0935\u0947\u0926 \u0915\u094B \u092E\u093E\u0928\u0935 \u0938\u092D\u094D\u092F\u0924\u093E \u0914\u0930 \u0938\u0928\u093E\u0924\u0928 \u0927\u0930\u094D\u092E \u0915\u093E \u092A\u094D\u0930\u093E\u091A\u0940\u0928\u0924\u092E \u0906\u0926\u093F \u0917\u094D\u0930\u0902\u0925 \u092E\u093E\u0928\u093E \u091C\u093E\u0924\u093E \u0939\u0948\u0964",
      explanationEnglish: "The Rigveda is universally recognized as the oldest sacred text in human history.",
      ref: "Rigveda"
    },
    {
      textHindi: "\u0938\u0928\u093E\u0924\u0928 \u0927\u0930\u094D\u092E \u0915\u0947 \u0906\u0927\u093E\u0930\u092D\u0942\u0924 \u0915\u0941\u0932 \u0915\u093F\u0924\u0928\u0947 \u0935\u0947\u0926 \u0939\u0948\u0902?",
      textEnglish: "How many Vedas are there in Sanatan Dharma?",
      optionsHindi: ["4 \u0935\u0947\u0926", "3 \u0935\u0947\u0926", "108 \u0935\u0947\u0926", "18 \u0935\u0947\u0926"],
      optionsEnglish: ["4 Vedas", "3 Vedas", "108 Vedas", "18 Vedas"],
      correctHindi: "4 \u0935\u0947\u0926",
      correctEnglish: "4 Vedas",
      explanationHindi: "\u0935\u0947\u0926 \u091A\u093E\u0930 \u0939\u0948\u0902: \u090B\u0917\u094D\u0935\u0947\u0926, \u092F\u091C\u0941\u0930\u094D\u0935\u0947\u0926, \u0938\u093E\u092E\u0935\u0947\u0926 \u0914\u0930 \u0905\u0925\u0930\u094D\u0935\u0935\u0947\u0926\u0964 \u0907\u0928\u094D\u0939\u0947\u0902 '\u0938\u0902\u0939\u093F\u0924\u093E' \u092D\u0940 \u0915\u0939\u093E \u091C\u093E\u0924\u093E \u0939\u0948\u0964",
      explanationEnglish: "The four Vedas are Rigveda, Yajurveda, Samaveda, and Atharvaveda.",
      ref: "Vedas"
    },
    {
      textHindi: "\u092D\u093E\u0930\u0924\u0940\u092F \u0936\u093E\u0938\u094D\u0924\u094D\u0930\u0940\u092F \u0938\u0902\u0917\u0940\u0924 \u0914\u0930 \u0938\u094D\u0935\u0930\u094B\u0902 \u0915\u093E \u092E\u0942\u0932 \u0915\u093F\u0938 \u0935\u0947\u0926 \u0915\u094B \u092E\u093E\u0928\u093E \u091C\u093E\u0924\u093E \u0939\u0948?",
      textEnglish: "Which Veda is considered the foundational source of Indian classical music and melodies?",
      optionsHindi: ["\u0938\u093E\u092E\u0935\u0947\u0926", "\u090B\u0917\u094D\u0935\u0947\u0926", "\u092F\u091C\u0941\u0930\u094D\u0935\u0947\u0926", "\u0905\u0925\u0930\u094D\u0935\u0935\u0947\u0926"],
      optionsEnglish: ["Samaveda", "Rigveda", "Yajurveda", "Atharvaveda"],
      correctHindi: "\u0938\u093E\u092E\u0935\u0947\u0926",
      correctEnglish: "Samaveda",
      explanationHindi: "\u0938\u093E\u092E\u0935\u0947\u0926 \u092E\u0947\u0902 \u092F\u091C\u094D\u091E\u094B\u0902 \u0915\u0947 \u0938\u092E\u092F \u0917\u093E\u090F \u091C\u093E\u0928\u0947 \u0935\u093E\u0932\u0947 \u092E\u0902\u0924\u094D\u0930\u094B\u0902 \u0915\u093E \u0938\u0902\u0915\u0932\u0928 \u0939\u0948, \u091C\u094B \u092D\u093E\u0930\u0924\u0940\u092F \u0938\u0902\u0917\u0940\u0924 \u0915\u093E \u091C\u0928\u0915 \u0939\u0948\u0964",
      explanationEnglish: "The Samaveda consists of melodies and chants, serving as the root of Indian music science.",
      ref: "Samaveda"
    },
    {
      textHindi: "\u092A\u094D\u0930\u0938\u093F\u0926\u094D\u0927 \u0917\u093E\u092F\u0924\u094D\u0930\u0940 \u092E\u0902\u0924\u094D\u0930 '\u0950 \u092D\u0942\u0930\u094D\u092D\u0941\u0935\u0903 \u0938\u094D\u0935\u0903' \u090B\u0917\u094D\u0935\u0947\u0926 \u0915\u0947 \u0915\u093F\u0938 \u092E\u0902\u0921\u0932 \u0938\u0947 \u0932\u093F\u092F\u093E \u0917\u092F\u093E \u0939\u0948?",
      textEnglish: "The famous Gayatri Mantra is found in which Mandala of the Rigveda?",
      optionsHindi: ["\u0924\u0943\u0924\u0940\u092F \u092E\u0902\u0921\u0932 (3rd Mandala)", "\u092A\u094D\u0930\u0925\u092E \u092E\u0902\u0921\u0932", "\u0926\u0938\u0935\u093E\u0902 \u092E\u0902\u0921\u0932", "\u0928\u094C\u0935\u093E\u0902 \u092E\u0902\u0921\u0932"],
      optionsEnglish: ["3rd Mandala", "1st Mandala", "10th Mandala", "9th Mandala"],
      correctHindi: "\u0924\u0943\u0924\u0940\u092F \u092E\u0902\u0921\u0932 (3rd Mandala)",
      correctEnglish: "3rd Mandala",
      explanationHindi: "\u0917\u093E\u092F\u0924\u094D\u0930\u0940 \u092E\u0902\u0924\u094D\u0930 \u090B\u0917\u094D\u0935\u0947\u0926 \u0915\u0947 \u0924\u0943\u0924\u0940\u092F \u092E\u0902\u0921\u0932 \u0915\u0947 \u096C\u0968\u0935\u0947\u0902 \u0938\u0942\u0915\u094D\u0924 \u0915\u093E \u0967\u0966\u0935\u093E\u0902 \u092E\u0902\u0924\u094D\u0930 \u0939\u0948, \u091C\u093F\u0938\u0915\u0947 \u0930\u091A\u092F\u093F\u0924\u093E \u092E\u0939\u0930\u094D\u0937\u093F \u0935\u093F\u0936\u094D\u0935\u093E\u092E\u093F\u0924\u094D\u0930 \u0939\u0948\u0902\u0964",
      explanationEnglish: "The Gayatri Mantra was revealed by Sage Vishwamitra and is situated in the 3rd Mandala of Rigveda.",
      ref: "Rigveda 3.62.10"
    },
    {
      textHindi: "\u0906\u092F\u0941\u0930\u094D\u0935\u0947\u0926, \u091C\u0921\u093C\u0940-\u092C\u0942\u091F\u093F\u092F\u094B\u0902, \u0926\u0948\u0928\u093F\u0915 \u0935\u093F\u091C\u094D\u091E\u093E\u0928 \u0914\u0930 \u0917\u0943\u0939-\u0935\u093E\u0938\u094D\u0924\u0941 \u0915\u093E \u0935\u0930\u094D\u0923\u0928 \u0935\u093F\u0936\u0947\u0937 \u0930\u0942\u092A \u0938\u0947 \u0915\u093F\u0938 \u0935\u0947\u0926 \u092E\u0947\u0902 \u092E\u093F\u0932\u0924\u093E \u0939\u0948?",
      textEnglish: "The description of Ayurveda, herbal medicines, house construction, and daily sciences is primarily found in which Veda?",
      optionsHindi: ["\u0905\u0925\u0930\u094D\u0935\u0935\u0947\u0926", "\u090B\u0917\u094D\u0935\u0947\u0926", "\u092F\u091C\u0941\u0930\u094D\u0935\u0947\u0926", "\u0938\u093E\u092E\u0935\u0947\u0926"],
      optionsEnglish: ["Atharvaveda", "Rigveda", "Yajurveda", "Samaveda"],
      correctHindi: "\u0905\u0925\u0930\u094D\u0935\u0935\u0947\u0926",
      correctEnglish: "Atharvaveda",
      explanationHindi: "\u0905\u0925\u0930\u094D\u0935\u0935\u0947\u0926 \u092E\u0947\u0902 \u091C\u0921\u093C\u0940-\u092C\u0942\u091F\u093F\u092F\u094B\u0902, \u0906\u092F\u0941\u0930\u094D\u0935\u0947\u0926, \u0936\u093E\u0902\u0924\u093F \u0915\u0930\u094D\u092E \u0914\u0930 \u0932\u094B\u0915 \u0915\u0932\u094D\u092F\u093E\u0923\u0915\u093E\u0930\u0940 \u0932\u094C\u0915\u093F\u0915 \u0935\u093F\u0937\u092F\u094B\u0902 \u0915\u093E \u0935\u0930\u094D\u0923\u0928 \u0939\u0948\u0964",
      explanationEnglish: "The Atharvaveda contains details on daily life, sciences, medicine (Ayurveda), and societal ethics.",
      ref: "Atharvaveda"
    }
  ];
  const upanishadsTemplates = [
    {
      textHindi: "\u0909\u092A\u0928\u093F\u0937\u0926 \u0915\u093E \u0936\u093E\u092C\u094D\u0926\u093F\u0915 \u0905\u0930\u094D\u0925 \u0915\u094D\u092F\u093E \u0939\u094B\u0924\u093E \u0939\u0948?",
      textEnglish: "What is the literal meaning of the word 'Upanishad'?",
      optionsHindi: ["\u0917\u0941\u0930\u0941 \u0915\u0947 \u0938\u092E\u0940\u092A \u0936\u094D\u0930\u0926\u094D\u0927\u093E\u092A\u0942\u0930\u094D\u0935\u0915 \u092C\u0948\u0920\u0928\u093E", "\u0908\u0936\u094D\u0935\u0930 \u0915\u0940 \u0938\u094D\u0924\u0941\u0924\u093F \u0915\u0930\u0928\u093E", "\u091C\u0902\u0917\u0932 \u092E\u0947\u0902 \u091C\u093E\u0915\u0930 \u0924\u092A\u0938\u094D\u092F\u093E \u0915\u0930\u0928\u093E", "\u0917\u094D\u0930\u0902\u0925\u094B\u0902 \u0915\u093E \u092A\u093E\u0920 \u0915\u0930\u0928\u093E"],
      optionsEnglish: ["To sit down devotedly near the teacher", "To praise the Lord", "To meditate in forests", "To recite holy books"],
      correctHindi: "\u0917\u0941\u0930\u0941 \u0915\u0947 \u0938\u092E\u0940\u092A \u0936\u094D\u0930\u0926\u094D\u0927\u093E\u092A\u0942\u0930\u094D\u0935\u0915 \u092C\u0948\u0920\u0928\u093E",
      correctEnglish: "To sit down devotedly near the teacher",
      explanationHindi: "\u0909\u092A\u0928\u093F\u0937\u0926 \u0915\u093E \u0905\u0930\u094D\u0925 \u0939\u0948 '\u0909\u092A' (\u0938\u092E\u0940\u092A) '\u0928\u093F' (\u0936\u094D\u0930\u0926\u094D\u0927\u093E\u092A\u0942\u0930\u094D\u0935\u0915) '\u0937\u0926' (\u092C\u0948\u0920\u0928\u093E) - \u0905\u0930\u094D\u0925\u093E\u0924\u094D \u0906\u0924\u094D\u092E\u091C\u094D\u091E\u093E\u0928 \u0915\u0947 \u0932\u093F\u090F \u0917\u0941\u0930\u0941 \u0915\u0947 \u091A\u0930\u0923\u094B\u0902 \u092E\u0947\u0902 \u092C\u0948\u0920\u0928\u093E\u0964",
      explanationEnglish: "Upanishad literally means sitting down devotedly near a spiritual preceptor to receive sacred wisdom.",
      ref: "Upanishads"
    },
    {
      textHindi: "\u092D\u093E\u0930\u0924 \u0915\u0947 \u0930\u093E\u091C\u0915\u0940\u092F \u092A\u094D\u0930\u0924\u0940\u0915 \u092A\u0930 \u0905\u0902\u0915\u093F\u0924 \u0938\u0942\u0924\u094D\u0930 '\u0938\u0924\u094D\u092F\u092E\u0947\u0935 \u091C\u092F\u0924\u0947' \u0915\u093F\u0938 \u0909\u092A\u0928\u093F\u0937\u0926 \u0938\u0947 \u0932\u093F\u092F\u093E \u0917\u092F\u093E \u0939\u0948?",
      textEnglish: "The national motto of India 'Satyameva Jayate' (Truth alone triumphs) is taken from which Upanishad?",
      optionsHindi: ["\u092E\u0941\u0923\u094D\u0921\u0915 \u0909\u092A\u0928\u093F\u0937\u0926 (Mundaka Upanishad)", "\u0915\u0920 \u0909\u092A\u0928\u093F\u0937\u0926", "\u092E\u093E\u0923\u094D\u0921\u0942\u0915\u094D\u092F \u0909\u092A\u0928\u093F\u0937\u0926", "\u0908\u0936\u093E\u0935\u093E\u0938\u094D\u092F \u0909\u092A\u0928\u093F\u0937\u0926"],
      optionsEnglish: ["Mundaka Upanishad", "Katha Upanishad", "Mandukya Upanishad", "Ishavasya Upanishad"],
      correctHindi: "\u092E\u0941\u0923\u094D\u0921\u0915 \u0909\u092A\u0928\u093F\u0937\u0926 (Mundaka Upanishad)",
      correctEnglish: "Mundaka Upanishad",
      explanationHindi: "\u0938\u0924\u094D\u092F\u092E\u0947\u0935 \u091C\u092F\u0924\u0947 \u092E\u0941\u0923\u094D\u0921\u0915 \u0909\u092A\u0928\u093F\u0937\u0926 \u0915\u0947 \u0924\u0940\u0938\u0930\u0947 \u092E\u0941\u0923\u094D\u0921\u0915 \u0915\u0947 \u092A\u094D\u0930\u0925\u092E \u0916\u0902\u0921 \u0915\u093E \u091B\u0920\u093E \u092E\u0902\u0924\u094D\u0930 \u0939\u0948\u0964",
      explanationEnglish: "'Satyameva Jayate' is a sacred mantra from Mundaka Upanishad, signifying the ultimate victory of truth.",
      ref: "Mundaka Upanishad"
    },
    {
      textHindi: "\u092F\u092E\u0930\u093E\u091C \u0914\u0930 \u092C\u093E\u0932\u0915 \u0928\u091A\u093F\u0915\u0947\u0924\u093E \u0915\u0947 \u092C\u0940\u091A \u0939\u0941\u0906 \u0905\u092E\u0930 \u0906\u0924\u094D\u092E\u093E \u0915\u093E \u0938\u0902\u0935\u093E\u0926 \u0915\u093F\u0938 \u0909\u092A\u0928\u093F\u0937\u0926 \u092E\u0947\u0902 \u0935\u0930\u094D\u0923\u093F\u0924 \u0939\u0948?",
      textEnglish: "The dialogue between Lord Yama (Death) and the child Nachiketa regarding the secret of the soul is in which Upanishad?",
      optionsHindi: ["\u0915\u0920 \u0909\u092A\u0928\u093F\u0937\u0926 (Katha Upanishad)", "\u0915\u0947\u0928 \u0909\u092A\u0928\u093F\u0937\u0926", "\u0924\u0948\u0924\u094D\u0924\u093F\u0930\u0940\u092F \u0909\u092A\u0928\u093F\u0937\u0926", "\u091B\u093E\u0928\u094D\u0926\u094B\u0917\u094D\u092F \u0909\u092A\u0928\u093F\u0937\u0926"],
      optionsEnglish: ["Katha Upanishad", "Kena Upanishad", "Taittiriya Upanishad", "Chandogya Upanishad"],
      correctHindi: "\u0915\u0920 \u0909\u092A\u0928\u093F\u0937\u0926 (Katha Upanishad)",
      correctEnglish: "Katha Upanishad",
      explanationHindi: "\u0915\u0920 \u0909\u092A\u0928\u093F\u0937\u0926 \u092E\u0947\u0902 \u0928\u091A\u093F\u0915\u0947\u0924\u093E \u0915\u0947 \u0924\u0940\u0928 \u0935\u0930\u0926\u093E\u0928\u094B\u0902 \u0914\u0930 \u092F\u092E\u0930\u093E\u091C \u0926\u094D\u0935\u093E\u0930\u093E \u0926\u093F\u090F \u0917\u090F \u0906\u0924\u094D\u092E\u093E \u0915\u0947 \u0905\u092E\u0930\u0924\u094D\u0935 \u0915\u0947 \u091C\u094D\u091E\u093E\u0928 \u0915\u093E \u0905\u0928\u0941\u092A\u092E \u092A\u094D\u0930\u0938\u0902\u0917 \u0939\u0948\u0964",
      explanationEnglish: "The Katha Upanishad contains the legendary conversation where Yama explains the nature of the Self to Nachiketa.",
      ref: "Katha Upanishad"
    },
    {
      textHindi: "\u0909\u092A\u0928\u093F\u0937\u0926\u094B\u0902 \u0915\u093E \u092E\u0941\u0916\u094D\u092F \u0935\u093F\u0937\u092F \u0915\u094D\u092F\u093E \u0939\u0948 \u091C\u093F\u0938\u0915\u0947 \u0915\u093E\u0930\u0923 \u0907\u0928\u094D\u0939\u0947\u0902 '\u0935\u0947\u0926\u093E\u0902\u0924' \u092D\u0940 \u0915\u0939\u093E \u091C\u093E\u0924\u093E \u0939\u0948?",
      textEnglish: "What is the primary subject matter of Upanishads, due to which they are also called 'Vedanta'?",
      optionsHindi: ["\u092C\u094D\u0930\u0939\u094D\u092E\u0935\u093F\u0926\u094D\u092F\u093E \u090F\u0935\u0902 \u0906\u0924\u094D\u092E\u091C\u094D\u091E\u093E\u0928", "\u092F\u091C\u094D\u091E \u0905\u0928\u0941\u0937\u094D\u0920\u093E\u0928 \u0914\u0930 \u0915\u0930\u094D\u092E\u0915\u093E\u0902\u0921", "\u0926\u0947\u0935\u0940-\u0926\u0947\u0935\u0924\u093E\u0913\u0902 \u0915\u0940 \u092A\u0942\u091C\u093E", "\u0907\u0924\u093F\u0939\u093E\u0938 \u0914\u0930 \u0935\u0902\u0936\u093E\u0935\u0932\u0940"],
      optionsEnglish: ["Brahmavidya and Self-Knowledge", "Rituals and Sacrifices", "Deity worship", "History and genealogy"],
      correctHindi: "\u092C\u094D\u0930\u0939\u094D\u092E\u0935\u093F\u0926\u094D\u092F\u093E \u090F\u0935\u0902 \u0906\u0924\u094D\u092E\u091C\u094D\u091E\u093E\u0928",
      correctEnglish: "Brahmavidya and Self-Knowledge",
      explanationHindi: "\u0909\u092A\u0928\u093F\u0937\u0926 \u0935\u0947\u0926\u094B\u0902 \u0915\u0947 \u0905\u0902\u0924\u093F\u092E \u092D\u093E\u0917 \u0939\u0948\u0902 (\u0935\u0947\u0926\u093E\u0902\u0924) \u091C\u093F\u0928\u0915\u093E \u092A\u0930\u092E \u0932\u0915\u094D\u0937\u094D\u092F \u0906\u0924\u094D\u092E\u093E \u0914\u0930 \u092A\u0930\u092E\u093E\u0924\u094D\u092E\u093E \u0915\u0947 \u090F\u0915\u0924\u094D\u0935 (\u092C\u094D\u0930\u0939\u094D\u092E\u091C\u094D\u091E\u093E\u0928) \u0915\u093E \u092A\u094D\u0930\u0924\u093F\u092A\u093E\u0926\u0928 \u0915\u0930\u0928\u093E \u0939\u0948\u0964",
      explanationEnglish: "Upanishads mark the culmination of Vedic wisdom, focusing purely on metaphysical reality and Self-realization.",
      ref: "Upanishads"
    },
    {
      textHindi: "\u092A\u094D\u0930\u0938\u093F\u0926\u094D\u0927 \u0936\u093E\u0902\u0924\u093F \u092A\u093E\u0920 '\u0905\u0938\u0924\u094B \u092E\u093E \u0938\u0926\u094D\u0917\u092E\u092F, \u0924\u092E\u0938\u094B \u092E\u093E \u091C\u094D\u092F\u094B\u0924\u093F\u0930\u094D\u0917\u092E\u092F' \u0915\u093F\u0938 \u0909\u092A\u0928\u093F\u0937\u0926 \u0938\u0947 \u0932\u093F\u092F\u093E \u0917\u092F\u093E \u0939\u0948?",
      textEnglish: "The famous peace prayer 'Asato Ma Sadgamaya...' is extracted from which Upanishad?",
      optionsHindi: ["\u092C\u0943\u0939\u0926\u093E\u0930\u0923\u094D\u092F\u0915 \u0909\u092A\u0928\u093F\u0937\u0926", "\u091B\u093E\u0928\u094D\u0926\u094B\u0917\u094D\u092F \u0909\u092A\u0928\u093F\u0937\u0926", "\u0936\u094D\u0935\u0947\u0924\u093E\u0936\u094D\u0935\u0924\u0930 \u0909\u092A\u0928\u093F\u0937\u0926", "\u0924\u0948\u0924\u094D\u0924\u093F\u0930\u0940\u092F \u0909\u092A\u0928\u093F\u0937\u0926"],
      optionsEnglish: ["Brihadaranyaka Upanishad", "Chandogya Upanishad", "Shvetashvatara Upanishad", "Taittiriya Upanishad"],
      correctHindi: "\u092C\u0943\u0939\u0926\u093E\u0930\u0923\u094D\u092F\u0915 \u0909\u092A\u0928\u093F\u0937\u0926",
      correctEnglish: "Brihadaranyaka Upanishad",
      explanationHindi: "\u092F\u0939 \u092E\u0902\u0924\u094D\u0930 \u092C\u0943\u0939\u0926\u093E\u0930\u0923\u094D\u092F\u0915 \u0909\u092A\u0928\u093F\u0937\u0926 (1.3.28) \u0938\u0947 \u0932\u093F\u092F\u093E \u0917\u092F\u093E \u0939\u0948, \u091C\u093F\u0938\u0915\u093E \u0905\u0930\u094D\u0925 \u0939\u0948 '\u092E\u0941\u091D\u0947 \u0905\u0938\u0924\u094D\u092F \u0938\u0947 \u0938\u0924\u094D\u092F \u0915\u0940 \u0913\u0930, \u0905\u0902\u0927\u0915\u093E\u0930 \u0938\u0947 \u092A\u094D\u0930\u0915\u093E\u0936 \u0915\u0940 \u0913\u0930 \u0932\u0947 \u091A\u0932\u094B\u0964'",
      explanationEnglish: "This sacred chant is from the Brihadaranyaka Upanishad, praying for transition from untruth to truth, and darkness to light.",
      ref: "Brihadaranyaka Upanishad"
    }
  ];
  const saintsTemplates = [
    {
      textHindi: "\u0905\u0926\u094D\u0935\u0948\u0924 \u0935\u0947\u0926\u093E\u0902\u0924 \u0926\u0930\u094D\u0936\u0928 \u0915\u0947 \u092A\u0941\u0928\u0930\u0941\u0926\u094D\u0927\u093E\u0930\u0915 \u0914\u0930 \u091A\u093E\u0930 \u0926\u093F\u0936\u093E\u0913\u0902 \u092E\u0947\u0902 \u091A\u093E\u0930 \u092A\u0940\u0920\u094B\u0902 \u0915\u0947 \u0938\u0902\u0938\u094D\u0925\u093E\u092A\u0915 \u0915\u094C\u0928 \u0925\u0947?",
      textEnglish: "Who was the rejuvenator of Advaita Vedanta and founder of the four sacred monasteries (Peethas)?",
      optionsHindi: ["\u0906\u0926\u093F \u0936\u0902\u0915\u0930\u093E\u091A\u093E\u0930\u094D\u092F", "\u0930\u093E\u092E\u093E\u0928\u0941\u091C\u093E\u091A\u093E\u0930\u094D\u092F", "\u092E\u0927\u094D\u0935\u093E\u091A\u093E\u0930\u094D\u092F", "\u0938\u0902\u0924 \u0915\u092C\u0940\u0930"],
      optionsEnglish: ["Adi Shankaracharya", "Ramanujacharya", "Madhvacharya", "Saint Kabir"],
      correctHindi: "\u0906\u0926\u093F \u0936\u0902\u0915\u0930\u093E\u091A\u093E\u0930\u094D\u092F",
      correctEnglish: "Adi Shankaracharya",
      explanationHindi: "\u0906\u0926\u093F\u0917\u0941\u0930\u0941 \u0936\u0902\u0915\u0930\u093E\u091A\u093E\u0930\u094D\u092F \u091C\u0940 \u0928\u0947 \u0905\u0926\u094D\u0935\u0948\u0924 \u092E\u0924 \u0915\u093E \u092A\u094D\u0930\u091A\u093E\u0930 \u0915\u093F\u092F\u093E \u0914\u0930 \u092D\u093E\u0930\u0924 \u0915\u0940 \u091A\u093E\u0930\u094B\u0902 \u0926\u093F\u0936\u093E\u0913\u0902 (\u092C\u0926\u094D\u0930\u0940\u0928\u093E\u0925, \u0926\u094D\u0935\u093E\u0930\u0915\u093E, \u092A\u0941\u0930\u0940, \u0936\u094D\u0930\u0943\u0902\u0917\u0947\u0930\u0940) \u092E\u0947\u0902 \u091A\u093E\u0930 \u092A\u0940\u0920 \u0938\u094D\u0925\u093E\u092A\u093F\u0924 \u0915\u093F\u090F\u0964",
      explanationEnglish: "Adi Shankaracharya established the four cardinal monastic centers to preserve Vedic culture.",
      ref: "Saints & Gurus"
    },
    {
      textHindi: "Swami Vivekananda \u0915\u0947 \u092A\u0930\u092E \u092A\u0942\u091C\u094D\u092F \u0906\u0927\u094D\u092F\u093E\u0924\u094D\u092E\u093F\u0915 \u0917\u0941\u0930\u0941 \u0915\u094C\u0928 \u0925\u0947 \u091C\u093F\u0928\u0915\u0947 \u0928\u093E\u092E \u092A\u0930 \u092C\u0947\u0932\u0942\u0930 \u092E\u0920 \u0915\u0940 \u0938\u094D\u0925\u093E\u092A\u0928\u093E \u0939\u0941\u0908?",
      textEnglish: "Who was the highly revered spiritual master of Swami Vivekananda, in whose name Belur Math was founded?",
      optionsHindi: ["\u0936\u094D\u0930\u0940 \u0930\u093E\u092E\u0915\u0943\u0937\u094D\u0923 \u092A\u0930\u092E\u0939\u0902\u0938", "\u0938\u094D\u0935\u093E\u092E\u0940 \u0926\u092F\u093E\u0928\u0902\u0926 \u0938\u0930\u0938\u094D\u0935\u0924\u0940", "\u092A\u0930\u092E\u0939\u0902\u0938 \u092F\u094B\u0917\u093E\u0928\u0902\u0926", "\u0924\u0948\u0932\u0917 \u0938\u094D\u0935\u093E\u092E\u0940"],
      optionsEnglish: ["Sri Ramakrishna Paramahamsa", "Swami Dayananda Saraswati", "Paramahansa Yogananda", "Trailanga Swami"],
      correctHindi: "\u0936\u094D\u0930\u0940 \u0930\u093E\u092E\u0915\u0943\u0937\u094D\u0923 \u092A\u0930\u092E\u0939\u0902\u0938",
      correctEnglish: "Sri Ramakrishna Paramahamsa",
      explanationHindi: "\u0935\u093F\u0935\u0947\u0915\u093E\u0928\u0902\u0926 \u0915\u0947 \u0917\u0941\u0930\u0941 \u0926\u0915\u094D\u0937\u093F\u0923\u0947\u0936\u094D\u0935\u0930 \u0915\u0947 \u0938\u0902\u0924 \u0936\u094D\u0930\u0940 \u0930\u093E\u092E\u0915\u0943\u0937\u094D\u0923 \u092A\u0930\u092E\u0939\u0902\u0938 \u091C\u0940 \u0925\u0947, \u091C\u093F\u0928\u094D\u0939\u094B\u0902\u0928\u0947 \u092D\u0915\u094D\u0924\u093F \u0914\u0930 \u0938\u092E\u093E\u0927\u093F \u0915\u093E \u0938\u093E\u0915\u094D\u0937\u093E\u0924\u094D \u0909\u0926\u093E\u0939\u0930\u0923 \u092A\u094D\u0930\u0938\u094D\u0924\u0941\u0924 \u0915\u093F\u092F\u093E\u0964",
      explanationEnglish: "Sri Ramakrishna Paramahamsa was the spiritual mentor of Swami Vivekananda who taught the synthesis of all faiths.",
      ref: "Saints & Gurus"
    },
    {
      textHindi: "\u092E\u0927\u094D\u092F\u0915\u093E\u0932\u0940\u0928 \u0938\u0902\u0924 \u092E\u0940\u0930\u093E\u092C\u093E\u0908 \u0915\u093F\u0938 \u0906\u0930\u093E\u0927\u094D\u092F \u0926\u0947\u0935 \u0915\u0940 \u0905\u0928\u0928\u094D\u092F \u0914\u0930 \u092D\u093E\u0935\u092A\u0942\u0930\u094D\u0923 \u0938\u093E\u0927\u093F\u0915\u093E \u0925\u0940\u0902?",
      textEnglish: "The medieval saint Meerabai was an ecstatic devotee of which Lord?",
      optionsHindi: ["\u0936\u094D\u0930\u0940 \u0915\u0943\u0937\u094D\u0923", "\u0936\u094D\u0930\u0940 \u0930\u093E\u092E", "\u092D\u0917\u0935\u093E\u0928 \u0936\u093F\u0935", "\u0939\u0928\u0941\u092E\u093E\u0928 \u091C\u0940"],
      optionsEnglish: ["Lord Krishna", "Lord Rama", "Lord Shiva", "Hanuman Ji"],
      correctHindi: "\u0936\u094D\u0930\u0940 \u0915\u0943\u0937\u094D\u0923",
      correctEnglish: "Lord Krishna",
      explanationHindi: "\u092E\u0940\u0930\u093E\u092C\u093E\u0908 \u0936\u094D\u0930\u0940 \u0915\u0943\u0937\u094D\u0923 \u0915\u094B \u0939\u0940 \u0905\u092A\u0928\u093E \u0938\u092C \u0915\u0941\u091B (\u0917\u093F\u0930\u0927\u0930 \u0917\u094B\u092A\u093E\u0932) \u092E\u093E\u0928\u0915\u0930 \u092A\u0926 \u0914\u0930 \u092D\u091C\u0928\u094B\u0902 \u0915\u0947 \u092E\u093E\u0927\u094D\u092F\u092E \u0938\u0947 \u0909\u0928\u0915\u0940 \u092D\u0915\u094D\u0924\u093F \u092E\u0947\u0902 \u0932\u0940\u0928 \u0930\u0939\u0924\u0940 \u0925\u0940\u0902\u0964",
      explanationEnglish: "Meerabai was a Rajput princess who renounced royal life to sing ecstatic praises of Lord Krishna.",
      ref: "Saints & Gurus"
    },
    {
      textHindi: "\u091B\u0924\u094D\u0930\u092A\u0924\u093F \u0936\u093F\u0935\u093E\u091C\u0940 \u092E\u0939\u093E\u0930\u093E\u091C \u0915\u0947 \u0906\u0927\u094D\u092F\u093E\u0924\u094D\u092E\u093F\u0915 \u092E\u093E\u0930\u094D\u0917\u0926\u0930\u094D\u0936\u0915 \u0914\u0930 '\u0926\u093E\u0938\u092C\u094B\u0927' \u0915\u0947 \u0930\u091A\u092F\u093F\u0924\u093E \u0915\u094C\u0928 \u0938\u0947 \u092E\u0939\u093E\u0928 \u0938\u092E\u0930\u094D\u0925 \u0938\u0902\u0924 \u0925\u0947?",
      textEnglish: "Who was the spiritual guide of Chhatrapati Shivaji Maharaj and composer of the spiritual text 'Dasbodh'?",
      optionsHindi: ["\u0938\u092E\u0930\u094D\u0925 \u0930\u093E\u092E\u0926\u093E\u0938", "\u0938\u0902\u0924 \u091C\u094D\u091E\u093E\u0928\u0947\u0936\u094D\u0935\u0930", "\u0938\u0902\u0924 \u0924\u0941\u0915\u093E\u0930\u093E\u092E", "\u0938\u0902\u0924 \u090F\u0915\u0928\u093E\u0925"],
      optionsEnglish: ["Samarth Ramdas", "Saint Dnyaneshwar", "Saint Tukaram", "Saint Eknath"],
      correctHindi: "\u0938\u092E\u0930\u094D\u0925 \u0930\u093E\u092E\u0926\u093E\u0938",
      correctEnglish: "Samarth Ramdas",
      explanationHindi: "\u092E\u0939\u093E\u0930\u093E\u0937\u094D\u091F\u094D\u0930 \u0915\u0947 \u092E\u0939\u093E\u0928 \u0938\u092E\u0930\u094D\u0925 \u0917\u0941\u0930\u0941 \u0930\u093E\u092E\u0926\u093E\u0938 \u091C\u0940 \u0936\u093F\u0935\u093E\u091C\u0940 \u092E\u0939\u093E\u0930\u093E\u091C \u0915\u0947 \u0917\u0941\u0930\u0941 \u0925\u0947, \u091C\u093F\u0928\u094D\u0939\u094B\u0902\u0928\u0947 '\u0926\u093E\u0938\u092C\u094B\u0927' \u0914\u0930 '\u092E\u0928\u093E\u091A\u0947 \u0936\u094D\u0932\u094B\u0915' \u0915\u0940 \u0930\u091A\u0928\u093E \u0915\u0940\u0964",
      explanationEnglish: "Samarth Ramdas was the highly revered Marathi saint who served as the preceptor of Shivaji Maharaj.",
      ref: "Saints & Gurus"
    },
    {
      textHindi: "\u092E\u0939\u093E\u0924\u094D\u092E\u093E \u0917\u093E\u0902\u0927\u0940 \u0915\u093E \u0905\u0924\u094D\u092F\u0902\u0924 \u092A\u094D\u0930\u093F\u092F \u092D\u091C\u0928 '\u0935\u0948\u0937\u094D\u0923\u0935 \u091C\u0928 \u0924\u094B \u0924\u0947\u0928\u0947 \u0915\u0939\u093F\u092F\u0947' \u0915\u0947 \u092E\u0942\u0932 \u0930\u091A\u092F\u093F\u0924\u093E \u0915\u094C\u0928 \u0938\u0947 \u0917\u0941\u091C\u0930\u093E\u0924\u0940 \u0938\u0902\u0924 \u0925\u0947?",
      textEnglish: "Who was the original composer of Mahatma Gandhi's favorite bhajan 'Vaishnava Jana To'?",
      optionsHindi: ["\u0928\u0930\u0938\u093F\u0902\u0939 \u092E\u0947\u0939\u0924\u093E", "\u0938\u0902\u0924 \u091C\u094D\u091E\u093E\u0928\u0947\u0936\u094D\u0935\u0930", "\u0938\u0902\u0924 \u0915\u092C\u0940\u0930", "\u091A\u0948\u0924\u0928\u094D\u092F \u092E\u0939\u093E\u092A\u094D\u0930\u092D\u0941"],
      optionsEnglish: ["Narsinh Mehta", "Saint Dnyaneshwar", "Saint Kabir", "Chaitanya Mahaprabhu"],
      correctHindi: "\u0928\u0930\u0938\u093F\u0902\u0939 \u092E\u0947\u0939\u0924\u093E",
      correctEnglish: "Narsinh Mehta",
      explanationHindi: "\u092D\u0915\u094D\u0924\u093F\u0915\u093E\u0932\u0940\u0928 \u0917\u0941\u091C\u0930\u093E\u0924\u0940 \u0915\u0935\u093F \u0938\u0902\u0924 \u0928\u0930\u0938\u093F\u0902\u0939 \u092E\u0947\u0939\u0924\u093E (\u0928\u0930\u0938\u0940 \u092D\u0917\u0924) \u0928\u0947 \u0907\u0938 \u092A\u093E\u0935\u0928 \u092D\u091C\u0928 \u0915\u0940 \u0930\u091A\u0928\u093E \u0915\u0940 \u0925\u0940, \u091C\u093F\u0938\u092E\u0947\u0902 \u0938\u091A\u094D\u091A\u0947 \u092D\u0915\u094D\u0924 \u0915\u0947 \u0932\u0915\u094D\u0937\u0923 \u092C\u0924\u093E\u090F \u0917\u090F \u0939\u0948\u0902\u0964",
      explanationEnglish: "The 15th-century poet-saint Narsinh Mehta composed this beautiful devotional hymn.",
      ref: "Saints & Gurus"
    }
  ];
  const templesTemplates = [
    {
      textHindi: "\u0909\u0924\u094D\u0924\u0930\u093E\u0916\u0902\u0921 \u0915\u0947 \u0917\u0922\u093C\u0935\u093E\u0932 \u0939\u093F\u092E\u093E\u0932\u092F \u092E\u0947\u0902 \u0938\u094D\u0925\u093F\u0924 \u0915\u0947\u0926\u093E\u0930\u0928\u093E\u0925 \u091C\u094D\u092F\u094B\u0924\u093F\u0930\u094D\u0932\u093F\u0902\u0917 \u092E\u0902\u0926\u093F\u0930 \u0915\u093F\u0938 \u0928\u0926\u0940 \u0915\u0947 \u0928\u093F\u0915\u091F \u0938\u094D\u0925\u093E\u092A\u093F\u0924 \u0939\u0948?",
      textEnglish: "The sacred Kedarnath Jyotirlinga temple in Uttarakhand is situated near which river?",
      optionsHindi: ["\u092E\u0902\u0926\u093E\u0915\u093F\u0928\u0940 \u0928\u0926\u0940", "\u0905\u0932\u0915\u0928\u0902\u0926\u093E \u0928\u0926\u0940", "\u092D\u093E\u0917\u0940\u0930\u0925\u0940 \u0928\u0926\u0940", "\u092F\u092E\u0941\u0928\u093E"],
      optionsEnglish: ["Mandakini River", "Alaknanda River", "Bhagirathi River", "Yamuna"],
      correctHindi: "\u092E\u0902\u0926\u093E\u0915\u093F\u0928\u0940 \u0928\u0926\u0940",
      correctEnglish: "Mandakini River",
      explanationHindi: "\u0915\u0947\u0926\u093E\u0930\u0928\u093E\u0925 \u092E\u0902\u0926\u093F\u0930 \u092E\u0902\u0926\u093E\u0915\u093F\u0928\u0940 \u0928\u0926\u0940 \u0915\u0947 \u0924\u091F \u092A\u0930 \u0938\u094D\u0925\u093F\u0924 \u0939\u0948, \u091C\u094B \u092D\u0917\u0935\u093E\u0928 \u0936\u093F\u0935 \u0915\u093E \u0905\u0924\u094D\u092F\u0902\u0924 \u092E\u0939\u093F\u092E\u093E\u092E\u092F \u0927\u093E\u092E \u0939\u0948\u0964",
      explanationEnglish: "Kedarnath temple is located on the bank of the Mandakini river amidst the majestic Himalayas.",
      ref: "Sacred Temples"
    },
    {
      textHindi: "\u092D\u093E\u0930\u0924 \u0915\u0947 \u0926\u0915\u094D\u0937\u093F\u0923\u0924\u092E \u091B\u094B\u0930 \u0930\u093E\u092E\u0947\u0936\u094D\u0935\u0930\u092E \u0926\u094D\u0935\u0940\u092A \u092A\u0930 \u0938\u094D\u0925\u093E\u092A\u093F\u0924 \u091C\u094D\u092F\u094B\u0924\u093F\u0930\u094D\u0932\u093F\u0902\u0917 \u092E\u0902\u0926\u093F\u0930 \u0915\u093E \u0915\u094D\u092F\u093E \u0928\u093E\u092E \u0939\u0948 \u091C\u093F\u0938\u0915\u0940 \u0938\u094D\u0925\u093E\u092A\u0928\u093E \u0938\u094D\u0935\u092F\u0902 \u092A\u094D\u0930\u092D\u0941 \u0936\u094D\u0930\u0940 \u0930\u093E\u092E \u0928\u0947 \u0915\u0940 \u0925\u0940?",
      textEnglish: "What is the name of the Jyotirlinga temple on Rameswaram island which was established by Lord Rama himself?",
      optionsHindi: ["\u0930\u093E\u092E\u0928\u093E\u0925\u0938\u094D\u0935\u093E\u092E\u0940 \u092E\u0902\u0926\u093F\u0930", "\u092E\u0932\u094D\u0932\u093F\u0915\u093E\u0930\u094D\u091C\u0941\u0928", "\u0938\u094B\u092E\u0928\u093E\u0925", "\u092D\u0940\u092E\u093E\u0936\u0902\u0915\u0930"],
      optionsEnglish: ["Ramanathaswamy Temple", "Mallikarjuna", "Somnath", "Bhimashankar"],
      correctHindi: "\u0930\u093E\u092E\u0928\u093E\u0925\u0938\u094D\u0935\u093E\u092E\u0940 \u092E\u0902\u0926\u093F\u0930",
      correctEnglish: "Ramanathaswamy Temple",
      explanationHindi: "\u0930\u093E\u092E\u0947\u0936\u094D\u0935\u0930\u092E \u092E\u0947\u0902 \u0938\u094D\u0925\u093E\u092A\u093F\u0924 \u0930\u093E\u092E\u0928\u093E\u0925\u0938\u094D\u0935\u093E\u092E\u0940 \u092E\u0902\u0926\u093F\u0930 \u092E\u0947\u0902 \u0938\u094D\u0925\u093E\u092A\u093F\u0924 \u0936\u093F\u0935\u0932\u093F\u0902\u0917 \u0915\u0940 \u092A\u0942\u091C\u093E \u0932\u0902\u0915\u093E \u0935\u093F\u091C\u092F \u0938\u0947 \u092A\u0942\u0930\u094D\u0935 \u092D\u0917\u0935\u093E\u0928 \u0936\u094D\u0930\u0940 \u0930\u093E\u092E \u0928\u0947 \u092C\u093E\u0932\u0942 \u0938\u0947 \u092C\u0928\u093E\u0915\u0930 \u0915\u0940 \u0925\u0940\u0964",
      explanationEnglish: "The Ramanathaswamy Temple houses one of the 12 Jyotirlingas, established by Lord Rama.",
      ref: "Sacred Temples"
    },
    {
      textHindi: "\u0913\u0921\u093F\u0936\u093E \u0915\u0947 \u0924\u091F\u0940\u092F \u0928\u0917\u0930 \u092A\u0941\u0930\u0940 \u092E\u0947\u0902 \u0938\u094D\u0925\u093E\u092A\u093F\u0924 \u091C\u0917\u0928\u094D\u0928\u093E\u0925 \u092E\u0902\u0926\u093F\u0930 \u0915\u093F\u0938 \u092D\u0917\u0935\u093E\u0928 \u0915\u094B \u092A\u0942\u0930\u094D\u0923\u0924\u0903 \u0938\u092E\u0930\u094D\u092A\u093F\u0924 \u0939\u0948?",
      textEnglish: "The world-famous Jagannath Temple in Puri is dedicated to which form of the Supreme Lord?",
      optionsHindi: ["\u0936\u094D\u0930\u0940 \u0915\u0943\u0937\u094D\u0923, \u092C\u0932\u092D\u0926\u094D\u0930 \u0914\u0930 \u0938\u0941\u092D\u0926\u094D\u0930\u093E", "\u0936\u094D\u0930\u0940 \u0930\u093E\u092E \u0914\u0930 \u0932\u0915\u094D\u0937\u094D\u092E\u0923", "\u092D\u0917\u0935\u093E\u0928 \u0936\u093F\u0935", "\u0935\u093F\u0937\u094D\u0923\u0941 \u0914\u0930 \u0932\u0915\u094D\u0937\u094D\u092E\u0940"],
      optionsEnglish: ["Lord Krishna, Balabhadra, and Subhadra", "Lord Rama and Lakshmana", "Lord Shiva", "Vishnu and Lakshmi"],
      correctHindi: "\u0936\u094D\u0930\u0940 \u0915\u0943\u0937\u094D\u0923, \u092C\u0932\u092D\u0926\u094D\u0930 \u0914\u0930 \u0938\u0941\u092D\u0926\u094D\u0930\u093E",
      correctEnglish: "Lord Krishna, Balabhadra, and Subhadra",
      explanationHindi: "\u091C\u0917\u0928\u094D\u0928\u093E\u0925 \u092A\u0941\u0930\u0940 \u0927\u093E\u092E \u092E\u0947\u0902 \u092D\u0917\u0935\u093E\u0928 \u0915\u0943\u0937\u094D\u0923 (\u091C\u0917\u0928\u094D\u0928\u093E\u0925), \u0909\u0928\u0915\u0947 \u092C\u0921\u093C\u0947 \u092D\u093E\u0908 \u092C\u0932\u092D\u0926\u094D\u0930 \u0914\u0930 \u092C\u0939\u0928 \u0938\u0941\u092D\u0926\u094D\u0930\u093E \u0915\u0940 \u0915\u093E\u0937\u094D\u0920 \u0915\u0940 \u092E\u0942\u0930\u094D\u0924\u093F\u092F\u093E\u0901 \u0938\u094D\u0925\u093E\u092A\u093F\u0924 \u0939\u0948\u0902\u0964",
      explanationEnglish: "Puri Jagannath temple worships Lord Krishna along with his siblings Balabhadra and Subhadra in wooden deities.",
      ref: "Sacred Temples"
    },
    {
      textHindi: "\u0913\u0921\u093F\u0936\u093E \u0915\u0947 \u0915\u094B\u0923\u093E\u0930\u094D\u0915 \u092E\u0947\u0902 \u0938\u094D\u0925\u093F\u0924 \u0938\u0942\u0930\u094D\u092F \u092E\u0902\u0926\u093F\u0930 \u0915\u0940 \u0935\u093E\u0938\u094D\u0924\u0941\u0915\u0932\u093E \u0915\u093F\u0938 \u0935\u093F\u0936\u093F\u0937\u094D\u091F \u0930\u0942\u092A \u092E\u0947\u0902 \u092C\u0928\u0940 \u0939\u0941\u0908 \u0939\u0948?",
      textEnglish: "The Sun Temple in Konark, Odisha is uniquely built in the architectural shape of what?",
      optionsHindi: ["\u090F\u0915 \u0935\u093F\u0936\u093E\u0932 \u0930\u0925 (A massive chariot)", "\u090F\u0915 \u0915\u092E\u0932 \u0915\u093E \u092B\u0942\u0932", "\u090F\u0915 \u0924\u094D\u0930\u093F\u0936\u0942\u0932", "\u090F\u0915 \u0928\u094C\u0915\u093E"],
      optionsEnglish: ["A massive chariot", "A lotus flower", "A trident", "A boat"],
      correctHindi: "\u090F\u0915 \u0935\u093F\u0936\u093E\u0932 \u0930\u0925 (A massive chariot)",
      correctEnglish: "A massive chariot",
      explanationHindi: "\u0915\u094B\u0923\u093E\u0930\u094D\u0915 \u0915\u093E \u0938\u0942\u0930\u094D\u092F \u092E\u0902\u0926\u093F\u0930 \u0938\u093E\u0924 \u0918\u094B\u0921\u093C\u094B\u0902 \u0914\u0930 24 \u092A\u0939\u093F\u092F\u094B\u0902 \u0935\u093E\u0932\u0947 \u0938\u0942\u0930\u094D\u092F \u0926\u0947\u0935 \u0915\u0947 \u0935\u093F\u0936\u093E\u0932 \u0930\u0925 \u0915\u0947 \u0930\u0942\u092A \u092E\u0947\u0902 \u0928\u0915\u094D\u0915\u093E\u0936\u0940\u0926\u093E\u0930 \u092A\u0924\u094D\u0925\u0930\u094B\u0902 \u0938\u0947 \u092C\u0928\u093E \u0939\u0948\u0964",
      explanationEnglish: "The temple is conceptualized as a colossal chariot of the Sun God, decorated with stone wheels and horses.",
      ref: "Sacred Temples"
    },
    {
      textHindi: "\u0938\u0902\u0938\u093E\u0930 \u0915\u0940 \u0938\u092C\u0938\u0947 \u092A\u094D\u0930\u093E\u091A\u0940\u0928 \u091C\u0940\u0935\u093F\u0924 \u0938\u093E\u0902\u0938\u094D\u0915\u0943\u0924\u093F\u0915 \u0928\u0917\u0930\u0940 \u0935\u093E\u0930\u093E\u0923\u0938\u0940 \u092E\u0947\u0902 \u0938\u094D\u0925\u093E\u092A\u093F\u0924 \u092A\u094D\u0930\u0927\u093E\u0928 \u0936\u093F\u0935 \u092E\u0902\u0926\u093F\u0930 \u0915\u093E \u0915\u094D\u092F\u093E \u0928\u093E\u092E \u0939\u0948?",
      textEnglish: "What is the name of the primary Shiva temple in Varanasi, one of the oldest living cities in the world?",
      optionsHindi: ["\u0915\u093E\u0936\u0940 \u0935\u093F\u0936\u094D\u0935\u0928\u093E\u0925 \u092E\u0902\u0926\u093F\u0930", "\u092E\u0915\u093E\u0932\u0947\u0936\u094D\u0935\u0930", "\u0924\u094D\u0930\u092F\u092E\u094D\u092C\u0915\u0947\u0936\u094D\u0935\u0930", "\u0918\u0943\u0937\u094D\u0923\u0947\u0936\u094D\u0935\u0930"],
      optionsEnglish: ["Kashi Vishwanath Temple", "Mahakaleshwar", "Trimbakeshwar", "Grishneshwar"],
      correctHindi: "\u0915\u093E\u0936\u0940 \u0935\u093F\u0936\u094D\u0935\u0928\u093E\u0925 \u092E\u0902\u0926\u093F\u0930",
      correctEnglish: "Kashi Vishwanath Temple",
      explanationHindi: "\u0935\u093E\u0930\u093E\u0923\u0938\u0940 (\u0915\u093E\u0936\u0940) \u092E\u0947\u0902 \u0917\u0902\u0917\u093E \u0928\u0926\u0940 \u0915\u0947 \u092A\u0936\u094D\u091A\u093F\u092E\u0940 \u0924\u091F \u092A\u0930 \u0938\u094D\u0925\u093E\u092A\u093F\u0924 \u0915\u093E\u0936\u0940 \u0935\u093F\u0936\u094D\u0935\u0928\u093E\u0925 \u091C\u094D\u092F\u094B\u0924\u093F\u0930\u094D\u0932\u093F\u0902\u0917 \u0936\u093F\u0935 \u0915\u093E \u092A\u0930\u092E \u092A\u093E\u0935\u0928 \u0928\u093F\u0935\u093E\u0938 \u092E\u093E\u0928\u093E \u091C\u093E\u0924\u093E \u0939\u0948\u0964",
      explanationEnglish: "Kashi Vishwanath Temple is the spiritual crown of Varanasi, housing the sacred Jyotirlinga of Lord Shiva.",
      ref: "Sacred Temples"
    }
  ];
  const cultureTemplates = [
    {
      textHindi: "\u0938\u0928\u093E\u0924\u0928 \u091C\u0940\u0935\u0928 \u0936\u0948\u0932\u0940 \u0915\u0947 \u0905\u0928\u0941\u0938\u093E\u0930 \u092E\u093E\u0928\u0935 \u091C\u0940\u0935\u0928 \u0915\u0947 \u091A\u093E\u0930 \u092A\u0941\u0930\u0941\u0937\u093E\u0930\u094D\u0925 \u0915\u094C\u0928 \u0938\u0947 \u0939\u0948\u0902?",
      textEnglish: "According to Sanatan lifestyle, what are the four goals/pursuits (Purusharthas) of human life?",
      optionsHindi: ["\u0927\u0930\u094D\u092E, \u0905\u0930\u094D\u0925, \u0915\u093E\u092E, \u092E\u094B\u0915\u094D\u0937", "\u0938\u0924\u094D\u092F, \u0905\u0939\u093F\u0902\u0938\u093E, \u0924\u092A, \u0926\u093E\u0928", "\u092C\u094D\u0930\u0939\u094D\u092E\u091A\u0930\u094D\u092F, \u0917\u0943\u0939\u0938\u094D\u0925, \u0935\u093E\u0928\u092A\u094D\u0930\u0938\u094D\u0925, \u0938\u0902\u0928\u094D\u092F\u093E\u0938", "\u090B\u0917\u094D\u0935\u0947\u0926, \u092F\u091C\u0941\u0930\u094D\u0935\u0947\u0926, \u0938\u093E\u092E\u0935\u0947\u0926, \u0905\u0925\u0930\u094D\u0935\u0935\u0947\u0926"],
      optionsEnglish: ["Dharma, Artha, Kama, Moksha", "Satya, Ahimsa, Tapa, Dana", "Brahmacharya, Grihastha, Vanaprastha, Sanyasa", "Rigveda, Yajurveda, Samaveda, Atharvaveda"],
      correctHindi: "\u0927\u0930\u094D\u092E, \u0905\u0930\u094D\u0925, \u0915\u093E\u092E, \u092E\u094B\u0915\u094D\u0937",
      correctEnglish: "Dharma, Artha, Kama, Moksha",
      explanationHindi: "\u0938\u0928\u093E\u0924\u0928 \u0927\u0930\u094D\u092E \u0915\u0947 \u0905\u0928\u0941\u0938\u093E\u0930 \u091C\u0940\u0935\u0928 \u0915\u0947 \u091A\u093E\u0930 \u092E\u0941\u0916\u094D\u092F \u0909\u0926\u094D\u0926\u0947\u0936\u094D\u092F \u0939\u0948\u0902: \u0927\u0930\u094D\u092E (\u0928\u0948\u0924\u093F\u0915\u0924\u093E), \u0905\u0930\u094D\u0925 (\u0938\u0902\u0938\u093E\u0927\u0928), \u0915\u093E\u092E (\u0915\u093E\u092E\u0928\u093E\u090F\u0902) \u0914\u0930 \u092E\u094B\u0915\u094D\u0937 (\u092E\u0941\u0915\u094D\u0924\u093F)\u0964",
      explanationEnglish: "The four Purusharthas define the comprehensive framework of a balanced, prosperous, and liberated life.",
      ref: "Indian Culture"
    },
    {
      textHindi: "\u0939\u093F\u0902\u0926\u0942 \u0938\u0902\u0938\u094D\u0915\u0943\u0924\u093F \u0915\u0947 \u0905\u0928\u0941\u0938\u093E\u0930 \u092E\u0928\u0941\u0937\u094D\u092F \u0915\u0947 \u091C\u0928\u094D\u092E \u0938\u0947 \u092E\u0943\u0924\u094D\u092F\u0941 \u0924\u0915 \u0915\u0941\u0932 \u0915\u093F\u0924\u0928\u0947 \u092E\u0941\u0916\u094D\u092F \u0938\u0902\u0938\u094D\u0915\u093E\u0930 (\u0938\u0902\u0938\u094D\u0915\u093E\u0930 \u0938\u093F\u0926\u094D\u0927\u093E\u0902\u0924) \u092E\u093E\u0928\u0947 \u0917\u090F \u0939\u0948\u0902?",
      textEnglish: "According to Hindu culture, how many primary life sacraments (Sanskaras) are performed from birth to death?",
      optionsHindi: ["16 (\u0937\u094B\u0921\u0936 \u0938\u0902\u0938\u094D\u0915\u093E\u0930)", "10", "12", "108"],
      optionsEnglish: ["16 (Shodasha Sanskaras)", "10", "12", "108"],
      correctHindi: "16 (\u0937\u094B\u0921\u0936 \u0938\u0902\u0938\u094D\u0915\u093E\u0930)",
      correctEnglish: "16 (Shodasha Sanskaras)",
      explanationHindi: "\u092E\u093E\u0928\u0935 \u091C\u0940\u0935\u0928 \u0915\u094B \u0936\u0941\u0926\u094D\u0927, \u0938\u0941\u0938\u0902\u0938\u094D\u0915\u0943\u0924 \u0914\u0930 \u0909\u0928\u094D\u0928\u0924 \u092C\u0928\u093E\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u0917\u0930\u094D\u092D\u0927\u093E\u0928 \u0938\u0947 \u0905\u0902\u0924\u094D\u092F\u0947\u0937\u094D\u091F\u093F (\u092E\u0943\u0924\u094D\u092F\u0941) \u0924\u0915 \u0915\u0941\u0932 16 \u092E\u0941\u0916\u094D\u092F \u0938\u0902\u0938\u094D\u0915\u093E\u0930 \u0915\u093F\u090F \u091C\u093E\u0924\u0947 \u0939\u0948\u0902\u0964",
      explanationEnglish: "The Shodasha Sanskaras are 16 fundamental stages and rituals that sanctify a human journey in Vedic tradition.",
      ref: "Indian Culture"
    },
    {
      textHindi: "\u0935\u0948\u0926\u093F\u0915 \u0935\u0930\u094D\u0923\u093E\u0936\u094D\u0930\u092E \u0935\u094D\u092F\u0935\u0938\u094D\u0925\u093E \u0915\u0947 \u0905\u0902\u0924\u0930\u094D\u0917\u0924 \u091C\u0940\u0935\u0928 \u0915\u0947 \u092A\u094D\u0930\u0925\u092E 25 \u0935\u0930\u094D\u0937\u094B\u0902 \u0915\u0940 \u0905\u0935\u0927\u093F \u0915\u093F\u0938 \u0906\u0936\u094D\u0930\u092E \u0915\u0947 \u0905\u0927\u0940\u0928 \u092E\u093E\u0928\u0940 \u0917\u0908 \u0939\u0948?",
      textEnglish: "Under the Vedic Ashrama system, which stage of life is prescribed for the first 25 years of age?",
      optionsHindi: ["\u092C\u094D\u0930\u0939\u094D\u092E\u091A\u0930\u094D\u092F \u0906\u0936\u094D\u0930\u092E", "\u0917\u0943\u0939\u0938\u094D\u0925 \u0906\u0936\u094D\u0930\u092E", "\u0935\u093E\u0928\u092A\u094D\u0930\u0938\u094D\u0925 \u0906\u0936\u094D\u0930\u092E", "\u0938\u0902\u0928\u094D\u092F\u093E\u0938 \u0906\u0936\u094D\u0930\u092E"],
      optionsEnglish: ["Brahmacharya Ashrama", "Grihastha Ashrama", "Vanaprastha Ashrama", "Sanyasa Ashrama"],
      correctHindi: "\u092C\u094D\u0930\u0939\u094D\u092E\u091A\u0930\u094D\u092F \u0906\u0936\u094D\u0930\u092E",
      correctEnglish: "Brahmacharya Ashrama",
      explanationHindi: "\u091C\u0940\u0935\u0928 \u0915\u0947 \u092A\u094D\u0930\u0925\u092E \u0968\u096B \u0935\u0930\u094D\u0937 \u0936\u093F\u0915\u094D\u0937\u093E, \u0938\u0902\u092F\u092E \u0914\u0930 \u091A\u0930\u093F\u0924\u094D\u0930 \u0928\u093F\u0930\u094D\u092E\u093E\u0923 \u0939\u0947\u0924\u0941 \u092C\u094D\u0930\u0939\u094D\u092E\u091A\u0930\u094D\u092F \u0906\u0936\u094D\u0930\u092E \u0915\u0947 \u0905\u0902\u0924\u0930\u094D\u0917\u0924 \u0917\u0941\u0930\u0941 \u0915\u0947 \u0938\u093E\u0928\u094D\u0928\u093F\u0927\u094D\u092F \u092E\u0947\u0902 \u0935\u094D\u092F\u0924\u0940\u0924 \u0939\u094B\u0924\u0947 \u0925\u0947\u0964",
      explanationEnglish: "Brahmacharya is the student stage of life, dedicated to learning, celibacy, and character development.",
      ref: "Indian Culture"
    },
    {
      textHindi: "\u092E\u0939\u093E\u0924\u094D\u092E\u093E \u0917\u093E\u0902\u0927\u0940 \u0914\u0930 \u090B\u0937\u093F\u092F\u094B\u0902 \u0926\u094D\u0935\u093E\u0930\u093E \u092A\u094D\u0930\u0924\u093F\u092A\u093E\u0926\u093F\u0924 '\u0905\u0939\u093F\u0902\u0938\u093E' \u0915\u093E \u0935\u093E\u0938\u094D\u0924\u0935\u093F\u0915 \u0914\u0930 \u0926\u093E\u0930\u094D\u0936\u0928\u093F\u0915 \u0905\u0930\u094D\u0925 \u0915\u094D\u092F\u093E \u0939\u0948?",
      textEnglish: "What is the true and philosophical meaning of 'Ahims\u0101' as propounded by sages?",
      optionsHindi: ["\u092E\u0928, \u0935\u091A\u0928 \u0914\u0930 \u0915\u0930\u094D\u092E \u0938\u0947 \u0915\u093F\u0938\u0940 \u0915\u094B \u0915\u0937\u094D\u091F \u0928 \u0926\u0947\u0928\u093E", "\u0915\u0947\u0935\u0932 \u0936\u093E\u0930\u0940\u0930\u093F\u0915 \u091A\u094B\u091F \u0928 \u092A\u0939\u0941\u0902\u091A\u093E\u0928\u093E", "\u092F\u0941\u0926\u094D\u0927 \u0938\u0947 \u092D\u093E\u0917 \u091C\u093E\u0928\u093E", "\u0915\u092E\u091C\u094B\u0930 \u092C\u0928\u0947 \u0930\u0939\u0928\u093E"],
      optionsEnglish: ["To not cause harm by thoughts, words, or actions", "Only avoiding physical injury", "Fleeing from battle", "Staying weak and passive"],
      correctHindi: "\u092E\u0928, \u0935\u091A\u0928 \u0914\u0930 \u0915\u0930\u094D\u092E \u0938\u0947 \u0915\u093F\u0938\u0940 \u0915\u094B \u0915\u0937\u094D\u091F \u0928 \u0926\u0947\u0928\u093E",
      correctEnglish: "To not cause harm by thoughts, words, or actions",
      explanationHindi: "\u0935\u093E\u0938\u094D\u0924\u0935\u093F\u0915 \u0905\u0939\u093F\u0902\u0938\u093E \u092E\u0928, \u0935\u093E\u0923\u0940 \u0914\u0930 \u0936\u093E\u0930\u0940\u0930\u093F\u0915 \u0938\u094D\u0924\u0930 \u092A\u0930 \u0915\u093F\u0938\u0940 \u092D\u0940 \u091C\u0940\u0935 \u0915\u094B \u091A\u094B\u091F \u0928 \u092A\u0939\u0941\u0902\u091A\u093E\u0928\u0947 \u0915\u093E \u0915\u0930\u0941\u0923\u093E\u092E\u092F \u0938\u093F\u0926\u094D\u0927\u093E\u0902\u0924 \u0939\u0948\u0964",
      explanationEnglish: "Ahims\u0101 is a positive virtue of active harmlessness and universal compassion in thoughts, speech, and deeds.",
      ref: "Indian Culture"
    },
    {
      textHindi: "\u092E\u0939\u094B\u092A\u0928\u093F\u0937\u0926 \u0915\u093E \u092A\u094D\u0930\u0938\u093F\u0926\u094D\u0927 \u0935\u093E\u0915\u094D\u092F '\u0935\u0938\u0941\u0927\u0948\u0935 \u0915\u0941\u091F\u0941\u092E\u094D\u092C\u0915\u092E\u094D' \u0938\u0902\u092A\u0942\u0930\u094D\u0923 \u0935\u093F\u0936\u094D\u0935 \u0915\u0947 \u092C\u093E\u0930\u0947 \u092E\u0947\u0902 \u0915\u094D\u092F\u093E \u0926\u0943\u0937\u094D\u091F\u093F\u0915\u094B\u0923 \u0930\u0916\u0924\u093E \u0939\u0948?",
      textEnglish: "What perspective does the Upanishadic phrase 'Vasudhaiva Kutumbakam' hold towards the world?",
      optionsHindi: ["\u0938\u0902\u092A\u0942\u0930\u094D\u0923 \u0935\u093F\u0936\u094D\u0935 \u0939\u0940 \u0939\u092E\u093E\u0930\u093E \u092A\u0930\u093F\u0935\u093E\u0930 \u0939\u0948", "\u0915\u0947\u0935\u0932 \u0905\u092A\u0928\u093E \u0926\u0947\u0936 \u0936\u094D\u0930\u0947\u0937\u094D\u0920 \u0939\u0948", "\u0938\u0902\u0938\u093E\u0930 \u0926\u0941\u0916\u094B\u0902 \u0915\u093E \u0918\u0930 \u0939\u0948", "\u092D\u094C\u0924\u093F\u0915 \u0938\u0902\u092A\u0926\u093E \u0938\u092C \u0915\u0941\u091B \u0939\u0948"],
      optionsEnglish: ["The entire world is one single family", "Only one's nation is supreme", "The world is full of sorrow", "Material wealth is everything"],
      correctHindi: "\u0938\u0902\u092A\u0942\u0930\u094D\u0923 \u0935\u093F\u0936\u094D\u0935 \u0939\u0940 \u0939\u092E\u093E\u0930\u093E \u092A\u0930\u093F\u0935\u093E\u0930 \u0939\u0948",
      correctEnglish: "The entire world is one single family",
      explanationHindi: "'\u0935\u0938\u0941\u0927\u093E \u090F\u0935 \u0915\u0941\u091F\u0941\u092E\u094D\u092C\u0915\u092E\u094D' \u0915\u093E \u0905\u0930\u094D\u0925 \u0939\u0948 \u092A\u0943\u0925\u094D\u0935\u0940 \u0915\u0947 \u0938\u092E\u0938\u094D\u0924 \u092A\u094D\u0930\u093E\u0923\u0940 \u0939\u092E\u093E\u0930\u0947 \u092A\u0930\u093F\u0935\u093E\u0930 \u0915\u0947 \u0938\u0926\u0938\u094D\u092F \u0939\u0948\u0902, \u091C\u094B \u0938\u0928\u093E\u0924\u0928 \u0938\u0902\u0938\u094D\u0915\u0943\u0924\u093F \u0915\u0940 \u0909\u0926\u093E\u0930\u0924\u093E \u0926\u0930\u094D\u0936\u093E\u0924\u093E \u0939\u0948\u0964",
      explanationEnglish: "This golden maxim declares that the whole cosmos is interconnected as one unified, harmonious family.",
      ref: "Indian Culture"
    }
  ];
  const festivalsTemplates = [
    {
      textHindi: "\u0926\u0940\u092A\u094B\u0902 \u0915\u093E \u092A\u093E\u0935\u0928 \u0909\u0924\u094D\u0938\u0935 \u0926\u0940\u092A\u093E\u0935\u0932\u0940 \u0915\u093F\u0938 \u0939\u093F\u0902\u0926\u0942 \u0924\u093F\u0925\u093F \u0915\u094B \u0939\u0930\u094D\u0937\u094B\u0932\u094D\u0932\u093E\u0938 \u0915\u0947 \u0938\u093E\u0925 \u092E\u0928\u093E\u092F\u093E \u091C\u093E\u0924\u093E \u0939\u0948?",
      textEnglish: "Diwali, the festival of lights, is celebrated on which Hindu lunar calendar day?",
      optionsHindi: ["\u0915\u093E\u0930\u094D\u0924\u093F\u0915 \u0905\u092E\u093E\u0935\u0938\u094D\u092F\u093E (Kartika Amavasya)", "\u0915\u093E\u0930\u094D\u0924\u093F\u0915 \u092A\u0942\u0930\u094D\u0923\u093F\u092E\u093E", "\u0906\u0936\u094D\u0935\u093F\u0928 \u092A\u0942\u0930\u094D\u0923\u093F\u092E\u093E", "\u092B\u093E\u0932\u094D\u0917\u0941\u0928 \u0905\u092E\u093E\u0935\u0938\u094D\u092F\u093E"],
      optionsEnglish: ["Kartika Amavasya", "Kartika Purnima", "Ashvina Purnima", "Phalguna Amavasya"],
      correctHindi: "\u0915\u093E\u0930\u094D\u0924\u093F\u0915 \u0905\u092E\u093E\u0935\u0938\u094D\u092F\u093E (Kartika Amavasya)",
      correctEnglish: "Kartika Amavasya",
      explanationHindi: "\u0915\u093E\u0930\u094D\u0924\u093F\u0915 \u092E\u093E\u0938 \u0915\u0940 \u0905\u092E\u093E\u0935\u0938\u094D\u092F\u093E \u0915\u0947 \u0917\u0939\u0928 \u0905\u0902\u0927\u0915\u093E\u0930 \u0915\u094B \u092E\u093F\u091F\u093E\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u092A\u094D\u0930\u092D\u0941 \u0936\u094D\u0930\u0940 \u0930\u093E\u092E \u0915\u0947 \u0905\u092F\u094B\u0927\u094D\u092F\u093E \u0906\u0917\u092E\u0928 \u0915\u0940 \u0938\u094D\u092E\u0943\u0924\u093F \u092E\u0947\u0902 \u0926\u0940\u092A \u091C\u0932\u093E\u090F \u091C\u093E\u0924\u0947 \u0939\u0948\u0902\u0964",
      explanationEnglish: "Diwali falls on the darkest night (Amavasya) of Kartika month to welcome Lord Rama back to Ayodhya.",
      ref: "Festivals & Vrats"
    },
    {
      textHindi: "\u092E\u0915\u0930 \u0938\u0902\u0915\u094D\u0930\u093E\u0902\u0924\u093F \u0915\u093E \u092A\u093E\u0935\u0928 \u092A\u0930\u094D\u0935 \u0916\u0917\u094B\u0932\u0940\u092F \u0930\u0942\u092A \u0938\u0947 \u0938\u0942\u0930\u094D\u092F \u0915\u0947 \u0915\u093F\u0938 \u0930\u093E\u0936\u093F \u092E\u0947\u0902 \u092A\u094D\u0930\u0935\u0947\u0936 \u0915\u0930\u0928\u0947 \u092A\u0930 \u092E\u0928\u093E\u092F\u093E \u091C\u093E\u0924\u093E \u0939\u0948?",
      textEnglish: "Astronomically, the festival of Makara Sankranti marks the entry of the Sun into which zodiac sign?",
      optionsHindi: ["\u092E\u0915\u0930 \u0930\u093E\u0936\u093F (Capricorn)", "\u092E\u0947\u0937 \u0930\u093E\u0936\u093F", "\u0927\u0928\u0941 \u0930\u093E\u0936\u093F", "\u0915\u0930\u094D\u0915 \u0930\u093E\u0936\u093F"],
      optionsEnglish: ["Capricorn (Makara)", "Aries (Mesha)", "Sagittarius (Dhanu)", "Cancer (Karka)"],
      correctHindi: "\u092E\u0915\u0930 \u0930\u093E\u0936\u093F (Capricorn)",
      correctEnglish: "Capricorn (Makara)",
      explanationHindi: "\u0938\u0942\u0930\u094D\u092F \u0915\u0947 \u0927\u0928\u0941 \u0930\u093E\u0936\u093F \u0938\u0947 \u092E\u0915\u0930 \u0930\u093E\u0936\u093F \u092E\u0947\u0902 \u092A\u094D\u0930\u0935\u0947\u0936 \u0915\u0930\u0928\u0947 \u0915\u0940 \u0924\u093F\u0925\u093F \u0915\u094B \u092E\u0915\u0930 \u0938\u0902\u0915\u094D\u0930\u093E\u0902\u0924\u093F \u0915\u0939\u0924\u0947 \u0939\u0948\u0902, \u091C\u093F\u0938\u0938\u0947 \u0938\u0942\u0930\u094D\u092F \u0909\u0924\u094D\u0924\u0930\u093E\u092F\u0923 \u0939\u094B\u0924\u0947 \u0939\u0948\u0902\u0964",
      explanationEnglish: "Makara Sankranti marks the winter solstice when the sun begins its northward movement (Uttarayana) entering Capricorn.",
      ref: "Festivals & Vrats"
    },
    {
      textHindi: "\u0936\u093E\u0930\u0926\u0940\u092F \u0914\u0930 \u091A\u0948\u0924\u094D\u0930 \u0928\u0935\u0930\u093E\u0924\u094D\u0930\u093F \u092E\u0947\u0902 \u0928\u094C \u0926\u093F\u0928\u094B\u0902 \u0924\u0915 \u092E\u093E\u0901 \u0926\u0941\u0930\u094D\u0917\u093E \u0915\u0947 \u0915\u093F\u0924\u0928\u0947 \u092A\u093E\u0935\u0928 \u0930\u0942\u092A\u094B\u0902 \u0915\u0940 \u0906\u0930\u093E\u0927\u0928\u093E \u0915\u0940 \u091C\u093E\u0924\u0940 \u0939\u0948?",
      textEnglish: "How many sacred forms of Goddess Durga are worshipped during the nine nights of Navratri?",
      optionsHindi: ["9 \u0930\u0942\u092A (\u0928\u0935\u0926\u0941\u0930\u094D\u0917\u093E)", "10 \u0930\u0942\u092A", "7 \u0930\u0942\u092A", "3 \u0930\u0942\u092A"],
      optionsEnglish: ["9 Forms (Navadurga)", "10 Forms", "7 Forms", "3 Forms"],
      correctHindi: "9 \u0930\u0942\u092A (\u0928\u0935\u0926\u0941\u0930\u094D\u0917\u093E)",
      correctEnglish: "9 Forms (Navadurga)",
      explanationHindi: "\u0928\u0935\u0930\u093E\u0924\u094D\u0930\u093F \u092E\u0947\u0902 \u092E\u093E\u0901 \u0936\u0948\u0932\u092A\u0941\u0924\u094D\u0930\u0940, \u092C\u094D\u0930\u0939\u094D\u092E\u091A\u093E\u0930\u093F\u0923\u0940, \u091A\u0902\u0926\u094D\u0930\u0918\u0902\u091F\u093E \u0938\u0947 \u0932\u0947\u0915\u0930 \u0938\u093F\u0926\u094D\u0927\u093F\u0926\u093E\u0924\u094D\u0930\u0940 \u0924\u0915 \u0928\u094C \u0926\u093F\u0935\u094D\u092F \u0930\u0942\u092A\u094B\u0902 (\u0928\u0935\u0926\u0941\u0930\u094D\u0917\u093E) \u0915\u0940 \u092A\u0942\u091C\u093E \u0939\u094B\u0924\u0940 \u0939\u0948\u0964",
      explanationEnglish: "The festival of Navratri celebrates the nine distinct, powerful aspects of the Divine Mother Durga.",
      ref: "Festivals & Vrats"
    },
    {
      textHindi: "\u092D\u0917\u0935\u093E\u0928 \u0936\u094D\u0930\u0940\u0915\u0943\u0937\u094D\u0923 \u0915\u0947 \u092A\u093E\u0935\u0928 \u092A\u094D\u0930\u093E\u0915\u091F\u094D\u092F \u0909\u0924\u094D\u0938\u0935 \u0915\u094B \u0915\u093F\u0938 \u0928\u093E\u092E \u0938\u0947 \u092A\u0942\u0930\u0947 \u0926\u0947\u0936 \u092E\u0947\u0902 \u092E\u0928\u093E\u092F\u093E \u091C\u093E\u0924\u093E \u0939\u0948?",
      textEnglish: "By what name is the divine birth festival of Lord Krishna celebrated across India?",
      optionsHindi: ["\u0915\u0943\u0937\u094D\u0923 \u091C\u0928\u094D\u092E\u093E\u0937\u094D\u091F\u092E\u0940 (Janmashtami)", "\u0930\u093E\u092E\u0928\u0935\u092E\u0940", "\u0939\u0928\u0941\u092E\u093E\u0928 \u091C\u092F\u0902\u0924\u0940", "\u0917\u0941\u0930\u0941 \u092A\u0942\u0930\u094D\u0923\u093F\u092E\u093E"],
      optionsEnglish: ["Krishna Janmashtami", "Rama Navami", "Hanuman Jayanti", "Guru Purnima"],
      correctHindi: "\u0915\u0943\u0937\u094D\u0923 \u091C\u0928\u094D\u092E\u093E\u0937\u094D\u091F\u092E\u0940 (Janmashtami)",
      correctEnglish: "Krishna Janmashtami",
      explanationHindi: "\u092D\u093E\u0926\u094D\u0930\u092A\u0926 \u092E\u093E\u0938 \u0915\u0947 \u0915\u0943\u0937\u094D\u0923 \u092A\u0915\u094D\u0937 \u0915\u0940 \u0905\u0937\u094D\u091F\u092E\u0940 \u0924\u093F\u0925\u093F \u0915\u094B \u0930\u094B\u0939\u093F\u0923\u0940 \u0928\u0915\u094D\u0937\u0924\u094D\u0930 \u092E\u0947\u0902 \u092E\u0927\u094D\u092F\u0930\u093E\u0924\u094D\u0930\u093F \u092D\u0917\u0935\u093E\u0928 \u0936\u094D\u0930\u0940 \u0915\u0943\u0937\u094D\u0923 \u0915\u093E \u091C\u0928\u094D\u092E \u0915\u0902\u0938 \u0915\u0947 \u0915\u093E\u0930\u093E\u0917\u093E\u0930 \u092E\u0947\u0902 \u0939\u0941\u0906 \u0925\u093E\u0964",
      explanationEnglish: "Krishna Janmashtami marks the birth of Lord Krishna in Mathura on the eighth day of Bhadrapada dark fortnight.",
      ref: "Festivals & Vrats"
    },
    {
      textHindi: "\u0917\u0902\u0917\u093E \u0926\u0936\u0939\u0930\u093E \u0915\u093E \u092A\u093E\u0935\u0928 \u0924\u094D\u092F\u094B\u0939\u093E\u0930 \u0915\u093F\u0938 \u0926\u0947\u0935\u0940 \u0915\u0947 \u0938\u094D\u0935\u0930\u094D\u0917 \u0938\u0947 \u092A\u0943\u0925\u094D\u0935\u0940 \u092A\u0930 \u0905\u0935\u0924\u0930\u0923 \u0915\u0947 \u0909\u092A\u0932\u0915\u094D\u0937\u094D\u092F \u092E\u0947\u0902 \u092E\u0928\u093E\u092F\u093E \u091C\u093E\u0924\u093E \u0939\u0948?",
      textEnglish: "The auspicious festival of Ganga Dussehra is celebrated to mark the descent of which river Goddess to Earth?",
      optionsHindi: ["\u092E\u093E\u0901 \u0917\u0902\u0917\u093E", "\u092E\u093E\u0901 \u092F\u092E\u0941\u0928\u093E", "\u092E\u093E\u0901 \u0938\u0930\u0938\u094D\u0935\u0924\u0940", "\u092E\u093E\u0901 \u0928\u0930\u094D\u092E\u0926\u093E"],
      optionsEnglish: ["Goddess Ganga", "Goddess Yamuna", "Goddess Saraswati", "Goddess Narmada"],
      correctHindi: "\u092E\u093E\u0901 \u0917\u0902\u0917\u093E",
      correctEnglish: "Goddess Ganga",
      explanationHindi: "\u091C\u094D\u092F\u0947\u0937\u094D\u0920 \u0936\u0941\u0915\u094D\u0932 \u0926\u0936\u092E\u0940 \u0915\u094B \u0930\u093E\u091C\u093E \u092D\u0917\u0940\u0930\u0925 \u0915\u0940 \u0918\u094B\u0930 \u0924\u092A\u0938\u094D\u092F\u093E \u0915\u0947 \u092B\u0932\u0938\u094D\u0935\u0930\u0942\u092A \u092E\u093E\u0901 \u0917\u0902\u0917\u093E \u0915\u093E \u0938\u094D\u0935\u0930\u094D\u0917 \u0932\u094B\u0915 \u0938\u0947 \u092A\u0943\u0925\u094D\u0935\u0940 \u092A\u0930 \u092A\u093E\u0935\u0928 \u0905\u0935\u0924\u0930\u0923 \u0939\u0941\u0906 \u0925\u093E\u0964",
      explanationEnglish: "Gengadevi descended from heaven to earth on this day to purify and liberate the ancestors of King Bhagiratha.",
      ref: "Festivals & Vrats"
    }
  ];
  const yogaTemplates = [
    {
      textHindi: "\u092F\u094B\u0917 \u0936\u093E\u0938\u094D\u0924\u094D\u0930 \u0915\u0947 \u0938\u0930\u094D\u0935\u094B\u0924\u094D\u0915\u0943\u0937\u094D\u091F \u0917\u094D\u0930\u0902\u0925 '\u092F\u094B\u0917\u0938\u0942\u0924\u094D\u0930' \u0915\u0947 \u0930\u091A\u092F\u093F\u0924\u093E \u0915\u094C\u0928 \u0938\u0947 \u092E\u0939\u093E\u0928 \u092E\u0939\u0930\u094D\u0937\u093F \u0939\u0948\u0902?",
      textEnglish: "Who is the great sage behind the foundational scripture 'Yoga Sutras'?",
      optionsHindi: ["\u092E\u0939\u0930\u094D\u0937\u093F \u092A\u0924\u0902\u091C\u0932\u093F", "\u092E\u0939\u0930\u094D\u0937\u093F \u0915\u092A\u093F\u0932", "\u092E\u0939\u0930\u094D\u0937\u093F \u0915\u0923\u093E\u0926", "\u092E\u0939\u0930\u094D\u0937\u093F \u0935\u094D\u092F\u093E\u0938"],
      optionsEnglish: ["Maharishi Patanjali", "Maharishi Kapila", "Maharishi Kanada", "Maharishi Vyasa"],
      correctHindi: "\u092E\u0939\u0930\u094D\u0937\u093F \u092A\u0924\u0902\u091C\u0932\u093F",
      correctEnglish: "Maharishi Patanjali",
      explanationHindi: "\u092E\u0939\u0930\u094D\u0937\u093F \u092A\u0924\u0902\u091C\u0932\u093F \u0928\u0947 \u092E\u0928 \u0915\u0947 \u0928\u093F\u0917\u094D\u0930\u0939 \u0914\u0930 \u0927\u094D\u092F\u093E\u0928 \u0938\u093E\u0927\u0928\u093E \u0915\u0947 \u0932\u093F\u090F 196 \u092F\u094B\u0917\u0938\u0942\u0924\u094D\u0930\u094B\u0902 \u0915\u0940 \u0930\u091A\u0928\u093E \u0915\u0940 \u0925\u0940\u0964",
      explanationEnglish: "Sage Patanjali systemized the science of Yoga into 196 aphorisms known as Patanjali Yoga Sutras.",
      ref: "Yoga Science"
    },
    {
      textHindi: "\u092E\u0939\u0930\u094D\u0937\u093F \u092A\u0924\u0902\u091C\u0932\u093F \u0926\u094D\u0935\u093E\u0930\u093E \u092A\u094D\u0930\u0924\u093F\u092A\u093E\u0926\u093F\u0924 \u0905\u0937\u094D\u091F\u093E\u0902\u0917 \u092F\u094B\u0917 \u0915\u0947 \u0915\u0941\u0932 \u0915\u093F\u0924\u0928\u0947 \u0905\u0902\u0917 (\u0938\u094B\u092A\u093E\u0928) \u0939\u0948\u0902?",
      textEnglish: "How many limbs make up the system of Ashtanga Yoga as defined by Patanjali?",
      optionsHindi: ["8 \u0905\u0902\u0917", "5 \u0905\u0902\u0917", "10 \u0905\u0902\u0917", "12 \u0905\u0902\u0917"],
      optionsEnglish: ["8 Limbs", "5 Limbs", "10 Limbs", "12 Limbs"],
      correctHindi: "8 \u0905\u0902\u0917",
      correctEnglish: "8 Limbs",
      explanationHindi: "\u0905\u0937\u094D\u091F\u093E\u0902\u0917 \u092F\u094B\u0917 \u0915\u0947 \u0906\u0920 \u0905\u0902\u0917 \u0939\u0948\u0902: \u092F\u092E, \u0928\u093F\u092F\u092E, \u0906\u0938\u0928, \u092A\u094D\u0930\u093E\u0923\u093E\u092F\u093E\u092E, \u092A\u094D\u0930\u0924\u094D\u092F\u093E\u0939\u093E\u0930, \u0927\u093E\u0930\u0923\u093E, \u0927\u094D\u092F\u093E\u0928 \u0914\u0930 \u0938\u092E\u093E\u0927\u093F\u0964",
      explanationEnglish: "Ashtanga Yoga literally means the eight-limbed path to self-control and spiritual liberation.",
      ref: "Yoga Science"
    },
    {
      textHindi: "\u0905\u0937\u094D\u091F\u093E\u0902\u0917 \u092F\u094B\u0917 \u0915\u093E \u0938\u0930\u094D\u0935\u092A\u094D\u0930\u0925\u092E\u0924\u092E \u0905\u0902\u0917 \u0915\u094C\u0928 \u0938\u093E \u0939\u0948 \u091C\u094B \u0938\u093E\u092E\u093E\u091C\u093F\u0915 \u0928\u0948\u0924\u093F\u0915\u0924\u093E \u0914\u0930 \u0906\u091A\u0930\u0923 \u0938\u0947 \u0938\u0902\u092C\u0902\u0927\u093F\u0924 \u0939\u0948?",
      textEnglish: "What is the very first limb of Ashtanga Yoga which deals with ethical guidelines?",
      optionsHindi: ["\u092F\u092E (Yama)", "\u0928\u093F\u092F\u092E (Niyama)", "\u0906\u0938\u0928 (Asana)", "\u092A\u094D\u0930\u093E\u0923\u093E\u092F\u093E\u092E (Pranayama)"],
      optionsEnglish: ["Yama", "Niyama", "Asana", "Pranayama"],
      correctHindi: "\u092F\u092E (Yama)",
      correctEnglish: "Yama",
      explanationHindi: "\u092A\u0939\u0932\u093E \u0905\u0902\u0917 \u092F\u092E \u0939\u0948, \u091C\u093F\u0938\u0915\u0947 \u0905\u0902\u0924\u0930\u094D\u0917\u0924 \u092A\u093E\u0902\u091A \u0938\u093E\u092E\u093E\u091C\u093F\u0915 \u0935\u094D\u0930\u0924 \u0906\u0924\u0947 \u0939\u0948\u0902: \u0905\u0939\u093F\u0902\u0938\u093E, \u0938\u0924\u094D\u092F, \u0905\u0938\u094D\u0924\u0947\u092F, \u092C\u094D\u0930\u0939\u094D\u092E\u091A\u0930\u094D\u092F \u0914\u0930 \u0905\u092A\u0930\u093F\u0917\u094D\u0930\u0939\u0964",
      explanationEnglish: "Yama is the first limb of yoga, representing five social restraints: non-violence, truth, non-stealing, celibacy, and non-covetousness.",
      ref: "Yoga Science"
    },
    {
      textHindi: "\u0936\u094D\u0935\u093E\u0938 \u0914\u0930 \u092A\u094D\u0930\u0936\u094D\u0935\u093E\u0938 \u0915\u0940 \u0917\u0924\u093F \u0915\u094B \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u093F\u0924 \u0935 \u0938\u0902\u0924\u0941\u0932\u093F\u0924 \u0915\u0930\u0928\u0947 \u0915\u0940 \u0915\u094D\u0930\u093F\u092F\u093E \u0915\u094B \u092F\u094B\u0917 \u092E\u0947\u0902 \u0915\u094D\u092F\u093E \u0915\u0939\u0924\u0947 \u0939\u0948\u0902?",
      textEnglish: "What is the science of breath regulation and control of life-force in Yoga called?",
      optionsHindi: ["\u092A\u094D\u0930\u093E\u0923\u093E\u092F\u093E\u092E", "\u092A\u094D\u0930\u0924\u094D\u092F\u093E\u0939\u093E\u0930", "\u0927\u093E\u0930\u0923\u093E", "\u0906\u0938\u0928"],
      optionsEnglish: ["Pranayama", "Pratyahara", "Dharana", "Asana"],
      correctHindi: "\u092A\u094D\u0930\u093E\u0923\u093E\u092F\u093E\u092E",
      correctEnglish: "Pranayama",
      explanationHindi: "\u092A\u094D\u0930\u093E\u0923 (\u091C\u0940\u0935\u0928 \u090A\u0930\u094D\u091C\u093E) \u0914\u0930 \u0906\u092F\u093E\u092E (\u0935\u093F\u0938\u094D\u0924\u093E\u0930/\u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923) \u092E\u093F\u0932\u0915\u0930 \u092A\u094D\u0930\u093E\u0923\u093E\u092F\u093E\u092E \u0915\u0939\u0932\u093E\u0924\u093E \u0939\u0948, \u091C\u094B \u092E\u0928 \u0915\u094B \u0938\u094D\u0925\u093F\u0930 \u0915\u0930\u0924\u093E \u0939\u0948\u0964",
      explanationEnglish: "Pranayama is the fourth limb of Ashtanga Yoga, focusing on respiratory control to calm the mind.",
      ref: "Yoga Science"
    },
    {
      textHindi: "\u0905\u0937\u094D\u091F\u093E\u0902\u0917 \u092F\u094B\u0917 \u0915\u0940 \u0935\u0939 \u0905\u0902\u0924\u093F\u092E \u091A\u0930\u092E \u0905\u0935\u0938\u094D\u0925\u093E \u0915\u094C\u0928 \u0938\u0940 \u0939\u0948 \u091C\u093F\u0938\u092E\u0947\u0902 \u091C\u0940\u0935\u093E\u0924\u094D\u092E\u093E \u092A\u0930\u092E\u093E\u0924\u094D\u092E\u093E \u092E\u0947\u0902 \u0932\u0940\u0928 \u0939\u094B \u091C\u093E\u0924\u0940 \u0939\u0948?",
      textEnglish: "What is the final, supreme limb of Ashtanga Yoga where the individual consciousness merges with the Divine?",
      optionsHindi: ["\u0938\u092E\u093E\u0927\u093F (Samadhi)", "\u0927\u094D\u092F\u093E\u0928 (Dhyana)", "\u0927\u093E\u0930\u0923\u093E (Dharana)", "\u092A\u094D\u0930\u0924\u094D\u092F\u093E\u0939\u093E\u0930 (Pratyahara)"],
      optionsEnglish: ["Samadhi", "Dhyana", "Dharana", "Pratyahara"],
      correctHindi: "\u0938\u092E\u093E\u0927\u093F (Samadhi)",
      correctEnglish: "Samadhi",
      explanationHindi: "\u0905\u0937\u094D\u091F\u093E\u0902\u0917 \u092F\u094B\u0917 \u0915\u093E \u0906\u0920\u0935\u093E\u0902 \u0914\u0930 \u0905\u0902\u0924\u093F\u092E \u0938\u094B\u092A\u093E\u0928 \u0938\u092E\u093E\u0927\u093F \u0939\u0948, \u091C\u0939\u093E\u0902 \u0926\u094D\u0935\u0948\u0924 \u0938\u092E\u093E\u092A\u094D\u0924 \u0939\u094B \u091C\u093E\u0924\u093E \u0939\u0948 \u0914\u0930 \u092A\u0942\u0930\u094D\u0923 \u0936\u093E\u0902\u0924\u093F \u092E\u093F\u0932\u0924\u0940 \u0939\u0948\u0964",
      explanationEnglish: "Samadhi is the ultimate state of spiritual absorption and complete liberation of the soul.",
      ref: "Yoga Science"
    }
  ];
  const meditationTemplates = [
    {
      textHindi: "\u092E\u093E\u0928\u0935 \u0936\u0930\u0940\u0930 \u0915\u0947 \u0938\u0942\u0915\u094D\u0937\u094D\u092E \u0924\u0902\u0924\u094D\u0930 \u092E\u0947\u0902 \u0930\u0940\u0922\u093C \u0915\u0947 \u0906\u0927\u093E\u0930 \u092A\u0930 \u0915\u094C\u0928 \u0938\u093E \u090A\u0930\u094D\u091C\u093E \u091A\u0915\u094D\u0930 (\u092A\u094D\u0930\u0925\u092E \u091A\u0915\u094D\u0930) \u0938\u094D\u0925\u093F\u0924 \u0939\u0948?",
      textEnglish: "In the subtle energy system of the human body, which chakra is located at the base of the spine?",
      optionsHindi: ["\u092E\u0942\u0932\u093E\u0927\u093E\u0930 \u091A\u0915\u094D\u0930 (Muladhara)", "\u0938\u094D\u0935\u093E\u0927\u093F\u0937\u094D\u0920\u093E\u0928 \u091A\u0915\u094D\u0930", "\u092E\u0923\u093F\u092A\u0941\u0930 \u091A\u0915\u094D\u0930", "\u0905\u0928\u093E\u0939\u0924 \u091A\u0915\u094D\u0930"],
      optionsEnglish: ["Muladhara Chakra (Root)", "Svadhisthana Chakra", "Manipura Chakra", "Anahata Chakra"],
      correctHindi: "\u092E\u0942\u0932\u093E\u0927\u093E\u0930 \u091A\u0915\u094D\u0930 (Muladhara)",
      correctEnglish: "Muladhara Chakra (Root)",
      explanationHindi: "\u0930\u0940\u0922\u093C \u0915\u0947 \u0938\u092C\u0938\u0947 \u0928\u093F\u091A\u0932\u0947 \u0939\u093F\u0938\u094D\u0938\u0947 \u092E\u0947\u0902 \u092E\u0942\u0932\u093E\u0927\u093E\u0930 \u091A\u0915\u094D\u0930 (\u091A\u093E\u0930 \u092A\u0902\u0916\u0941\u0921\u093C\u0940 \u0935\u093E\u0932\u093E \u0915\u092E\u0932) \u0938\u094D\u0925\u093F\u0924 \u0939\u0948, \u091C\u094B \u092A\u0943\u0925\u094D\u0935\u0940 \u0924\u0924\u094D\u0935 \u0915\u093E \u092A\u094D\u0930\u0924\u0940\u0915 \u0939\u0948\u0964",
      explanationEnglish: "The Muladhara (Root) Chakra resides at the base of the spine, governing stability and physical foundation.",
      ref: "Meditation & Dhyana"
    },
    {
      textHindi: "\u092E\u093E\u0928\u0935 \u0936\u0930\u0940\u0930 \u092E\u0947\u0902 \u0915\u0941\u0932 \u0915\u093F\u0924\u0928\u0947 \u092E\u0941\u0916\u094D\u092F \u0906\u0927\u094D\u092F\u093E\u0924\u094D\u092E\u093F\u0915 \u090A\u0930\u094D\u091C\u093E \u0915\u0947\u0902\u0926\u094D\u0930 (\u091A\u0915\u094D\u0930) \u0930\u0940\u0922\u093C \u0915\u0947 \u0938\u092E\u093E\u0928\u093E\u0902\u0924\u0930 \u0938\u094D\u0925\u093F\u0924 \u0939\u0948\u0902?",
      textEnglish: "How many primary spiritual energy centers (Chakras) are situated along the spinal cord?",
      optionsHindi: ["7", "108", "12", "5"],
      optionsEnglish: ["7", "108", "12", "5"],
      correctHindi: "7",
      correctEnglish: "7",
      explanationHindi: "\u0938\u0942\u0915\u094D\u0937\u094D\u092E \u0936\u0930\u0940\u0930 \u092E\u0947\u0902 \u092E\u0941\u0916\u094D\u092F \u0930\u0942\u092A \u0938\u0947 \u0938\u093E\u0924 \u091A\u0915\u094D\u0930 \u0939\u0948\u0902: \u092E\u0942\u0932\u093E\u0927\u093E\u0930, \u0938\u094D\u0935\u093E\u0927\u093F\u0937\u094D\u0920\u093E\u0928, \u092E\u0923\u093F\u092A\u0941\u0930, \u0905\u0928\u093E\u0939\u0924, \u0935\u093F\u0936\u0941\u0926\u094D\u0927, \u0906\u091C\u094D\u091E\u093E \u0914\u0930 \u0938\u0939\u0938\u094D\u0930\u093E\u0930\u0964",
      explanationEnglish: "There are 7 primary chakras representing different stages of consciousness in the human subtle system.",
      ref: "Meditation & Dhyana"
    },
    {
      textHindi: "\u092E\u0938\u094D\u0924\u0915 \u0915\u0947 \u0936\u093F\u0916\u0930 \u092A\u0930 (\u092C\u094D\u0930\u0939\u094D\u092E\u0930\u0902\u0927\u094D\u0930 \u092E\u0947\u0902) \u0938\u094D\u0925\u093F\u0924 \u0939\u091C\u093E\u0930 \u092A\u0902\u0916\u0941\u0921\u093C\u093F\u092F\u094B\u0902 \u0935\u093E\u0932\u0947 \u0926\u093F\u0935\u094D\u092F \u091A\u0915\u094D\u0930 \u0915\u093E \u0915\u094D\u092F\u093E \u0928\u093E\u092E \u0939\u0948?",
      textEnglish: "What is the name of the thousand-petalled divine chakra located at the crown of the head?",
      optionsHindi: ["\u0938\u0939\u0938\u094D\u0930\u093E\u0930 \u091A\u0915\u094D\u0930 (Sahasrara)", "\u0906\u091C\u094D\u091E\u093E \u091A\u0915\u094D\u0930", "\u0935\u093F\u0936\u0941\u0926\u094D\u0927 \u091A\u0915\u094D\u0930", "\u0905\u0928\u093E\u0939\u0924 \u091A\u0915\u094D\u0930"],
      optionsEnglish: ["Sahasrara Chakra (Crown)", "Ajna Chakra", "Vishuddha Chakra", "Anahata Chakra"],
      correctHindi: "\u0938\u0939\u0938\u094D\u0930\u093E\u0930 \u091A\u0915\u094D\u0930 (Sahasrara)",
      correctEnglish: "Sahasrara Chakra (Crown)",
      explanationHindi: "\u092E\u0938\u094D\u0924\u093F\u0937\u094D\u0915 \u0915\u0947 \u0936\u0940\u0930\u094D\u0937 \u092D\u093E\u0917 \u092A\u0930 \u0938\u0939\u0938\u094D\u0930\u093E\u0930 \u091A\u0915\u094D\u0930 \u0938\u094D\u0925\u093F\u0924 \u0939\u0948, \u091C\u094B \u0905\u0928\u0902\u0924 \u0936\u093E\u0902\u0924\u093F \u0914\u0930 \u092A\u0930\u092E\u093E\u0924\u094D\u092E\u093E \u0938\u0947 \u092A\u0942\u0930\u094D\u0923 \u092E\u093F\u0932\u0928 \u0915\u093E \u092C\u093F\u0902\u0926\u0941 \u0939\u0948\u0964",
      explanationEnglish: "The Sahasrara (Crown) Chakra is the destination of spiritual ascent, representing cosmic unity.",
      ref: "Meditation & Dhyana"
    },
    {
      textHindi: "\u092D\u0942\u092E\u0927\u094D\u092F (\u0926\u094B\u0928\u094B\u0902 \u092D\u094C\u0939\u094B\u0902 \u0915\u0947 \u092C\u0940\u091A) \u092E\u0947\u0902 \u0938\u094D\u0925\u093F\u0924 \u091A\u0915\u094D\u0930 \u0915\u093E \u0915\u094D\u092F\u093E \u0928\u093E\u092E \u0939\u0948 \u091C\u093F\u0938\u0947 \u0924\u0940\u0938\u0930\u093E \u0928\u0947\u0924\u094D\u0930 \u092F\u093E \u0935\u093F\u0935\u0947\u0915 \u0915\u093E \u0915\u0947\u0902\u0926\u094D\u0930 \u092D\u0940 \u0915\u0939\u0924\u0947 \u0939\u0948\u0902?",
      textEnglish: "What is the name of the chakra located between the eyebrows, often called the third eye or intuition center?",
      optionsHindi: ["\u0906\u091C\u094D\u091E\u093E \u091A\u0915\u094D\u0930 (Ajna Chakra)", "\u0935\u093F\u0936\u0941\u0926\u094D\u0927 \u091A\u0915\u094D\u0930", "\u0905\u0928\u093E\u0939\u0924 \u091A\u0915\u094D\u0930", "\u092E\u0923\u093F\u092A\u0941\u0930 \u091A\u0915\u094D\u0930"],
      optionsEnglish: ["Ajna Chakra (Third Eye)", "Vishuddha Chakra", "Anahata Chakra", "Manipura Chakra"],
      correctHindi: "\u0906\u091C\u094D\u091E\u093E \u091A\u0915\u094D\u0930 (Ajna Chakra)",
      correctEnglish: "Ajna Chakra (Third Eye)",
      explanationHindi: "\u0926\u094B\u0928\u094B\u0902 \u092D\u094C\u0939\u094B\u0902 \u0915\u0947 \u092E\u0927\u094D\u092F \u0906\u091C\u094D\u091E\u093E \u091A\u0915\u094D\u0930 (\u0926\u094B \u092A\u0902\u0916\u0941\u0921\u093C\u0940 \u0935\u093E\u0932\u093E) \u0938\u094D\u0925\u093F\u0924 \u0939\u0948, \u091C\u094B \u092E\u0928 \u0915\u0940 \u090F\u0915\u093E\u0917\u094D\u0930\u0924\u093E \u0914\u0930 \u0935\u093F\u0935\u0947\u0915 \u0915\u093E \u092E\u0941\u0916\u094D\u092F \u0938\u094D\u0925\u093E\u0928 \u0939\u0948\u0964",
      explanationEnglish: "The Ajna Chakra is situated between the eyebrows, acting as the seed of intuition, wisdom, and focus.",
      ref: "Meditation & Dhyana"
    },
    {
      textHindi: "\u0938\u0928\u093E\u0924\u0928 \u092A\u0930\u0902\u092A\u0930\u093E \u092E\u0947\u0902 \u0927\u094D\u092F\u093E\u0928 \u0914\u0930 \u090F\u0915\u093E\u0917\u094D\u0930\u0924\u093E \u0915\u0947 \u0932\u093F\u090F \u0915\u093F\u0938 \u0905\u0928\u093E\u0926\u093F \u0927\u094D\u0935\u0928\u093F (\u092E\u0902\u0924\u094D\u0930\u0930\u093E\u091C) \u0915\u094B \u0938\u0930\u094D\u0935\u094B\u0924\u094D\u0924\u092E \u092E\u093E\u0928\u093E \u0917\u092F\u093E \u0939\u0948?",
      textEnglish: "In Sanatan tradition, which primordial sound (Mantra) is considered supreme for meditation and chanting?",
      optionsHindi: ["\u0950 (\u092A\u094D\u0930\u0923\u0935 - Om)", "\u0939\u094D\u0930\u0940\u0902", "\u0915\u094D\u0932\u0940\u0902", "\u0938\u094B\u093D\u0939\u092E\u094D"],
      optionsEnglish: ["Om (Pranava)", "Hreem", "Kleem", "Soham"],
      correctHindi: "\u0950 (\u092A\u094D\u0930\u0923\u0935 - Om)",
      correctEnglish: "Om (Pranava)",
      explanationHindi: "\u0950 (\u0913\u092E\u094D/\u092A\u094D\u0930\u0923\u0935) \u0938\u0943\u0937\u094D\u091F\u093F \u0915\u0940 \u0905\u0928\u093E\u0926\u093F \u0914\u0930 \u0905\u0928\u093E\u0939\u0924 \u0927\u094D\u0935\u0928\u093F \u0939\u0948, \u091C\u094B \u0927\u094D\u092F\u093E\u0928 \u0932\u0917\u093E\u0928\u0947 \u0914\u0930 \u092E\u093E\u0928\u0938\u093F\u0915 \u0936\u093E\u0902\u0924\u093F \u092A\u093E\u0928\u0947 \u0915\u093E \u0905\u091A\u0942\u0915 \u0938\u093E\u0927\u0928 \u0939\u0948\u0964",
      explanationEnglish: "Om is the sacred primordial vibration of the cosmos, representing the supreme Absolute.",
      ref: "Meditation & Dhyana"
    }
  ];
  const sanskritTemplates = [
    {
      textHindi: "\u0926\u0947\u0935\u0935\u093E\u0923\u0940 \u0915\u0939\u0940 \u091C\u093E\u0928\u0947 \u0935\u093E\u0932\u0940 \u0938\u0902\u0938\u094D\u0915\u0943\u0924 \u092D\u093E\u0937\u093E \u092E\u0941\u0916\u094D\u092F \u0930\u0942\u092A \u0938\u0947 \u0915\u093F\u0938 \u0932\u093F\u092A\u093F \u092E\u0947\u0902 \u0932\u093F\u0916\u0940 \u091C\u093E\u0924\u0940 \u0939\u0948?",
      textEnglish: "The Sanskrit language, known as the language of Gods, is primarily written in which script?",
      optionsHindi: ["\u0926\u0947\u0935\u0928\u093E\u0917\u0930\u0940 (Devanagari)", "\u092C\u094D\u0930\u093E\u0939\u094D\u092E\u0940", "\u0936\u093E\u0930\u0926\u093E", "\u0917\u0941\u0930\u0941\u092E\u0941\u0916\u0940"],
      optionsEnglish: ["Devanagari", "Brahmi", "Sharada", "Gurmukhi"],
      correctHindi: "\u0926\u0947\u0935\u0928\u093E\u0917\u0930\u0940 (Devanagari)",
      correctEnglish: "Devanagari",
      explanationHindi: "\u0938\u0902\u0938\u093E\u0930 \u0915\u0940 \u0938\u0930\u094D\u0935\u093E\u0927\u093F\u0915 \u0935\u0948\u091C\u094D\u091E\u093E\u0928\u093F\u0915 \u0932\u093F\u092A\u093F \u0926\u0947\u0935\u0928\u093E\u0917\u0930\u0940 \u092E\u0947\u0902 \u0939\u0940 \u092E\u0941\u0916\u094D\u092F\u0924\u0903 \u0938\u0902\u0938\u094D\u0915\u0943\u0924 \u092D\u093E\u0937\u093E \u0915\u093E \u0932\u0947\u0916\u0928 \u0915\u093E\u0930\u094D\u092F \u0939\u094B\u0924\u093E \u0939\u0948\u0964",
      explanationEnglish: "Sanskrit is primarily recorded and published in the highly structured Devanagari script.",
      ref: "Sanskrit & Shlokas"
    },
    {
      textHindi: "\u0938\u0902\u0938\u093E\u0930 \u0915\u0947 \u092A\u094D\u0930\u0925\u092E \u0935\u094D\u092F\u0935\u0938\u094D\u0925\u093F\u0924 \u0935\u094D\u092F\u093E\u0915\u0930\u0923 \u0917\u094D\u0930\u0902\u0925 '\u0905\u0937\u094D\u091F\u093E\u0927\u094D\u092F\u093E\u092F\u0940' \u0915\u0947 \u092E\u0939\u093E\u0928 \u0930\u091A\u092F\u093F\u0924\u093E \u0915\u094C\u0928 \u0939\u0948\u0902?",
      textEnglish: "Who is the legendary composer of the world's first systematic grammar textbook 'Ashtadhyayi'?",
      optionsHindi: ["\u092E\u0939\u0930\u094D\u0937\u093F \u092A\u093E\u0923\u093F\u0928\u093F", "\u092E\u0939\u0930\u094D\u0937\u093F \u092A\u0924\u0902\u091C\u0932\u093F", "\u092E\u0939\u0930\u094D\u0937\u093F \u092F\u093E\u0938\u094D\u0915", "\u092E\u0939\u0930\u094D\u0937\u093F \u0935\u094D\u092F\u093E\u0938"],
      optionsEnglish: ["Maharishi Panini", "Maharishi Patanjali", "Maharishi Yaska", "Maharishi Vyasa"],
      correctHindi: "\u092E\u0939\u0930\u094D\u0937\u093F \u092A\u093E\u0923\u093F\u0928\u093F",
      correctEnglish: "Maharishi Panini",
      explanationHindi: "\u092E\u0939\u0930\u094D\u0937\u093F \u092A\u093E\u0923\u093F\u0928\u093F \u0928\u0947 \u0938\u0902\u0938\u094D\u0915\u0943\u0924 \u0935\u094D\u092F\u093E\u0915\u0930\u0923 \u0915\u094B \u0938\u0942\u0924\u094D\u0930\u092C\u0926\u094D\u0927 \u0915\u0930\u0924\u0947 \u0939\u0941\u090F \u096E \u0905\u0927\u094D\u092F\u093E\u092F\u094B\u0902 \u0935\u093E\u0932\u0940 \u0905\u0937\u094D\u091F\u093E\u0927\u094D\u092F\u093E\u092F\u0940 \u0915\u0940 \u0930\u091A\u0928\u093E \u0915\u0940\u0964",
      explanationEnglish: "Sage Panini composed the Ashtadhyayi, introducing the most advanced grammatical rules for Sanskrit.",
      ref: "Sanskrit & Shlokas"
    },
    {
      textHindi: "\u0938\u0902\u0938\u094D\u0915\u0943\u0924 \u0938\u093E\u0939\u093F\u0924\u094D\u092F \u0915\u093E '\u0906\u0926\u093F\u0915\u093E\u0935\u094D\u092F' (\u092A\u094D\u0930\u0925\u092E \u092E\u0939\u093E\u0915\u093E\u0935\u094D\u092F) \u0915\u093F\u0938 \u0917\u094D\u0930\u0902\u0925 \u0915\u094B \u092E\u093E\u0928\u093E \u091C\u093E\u0924\u093E \u0939\u0948?",
      textEnglish: "Which sacred text is universally revered as the 'Adi Kavya' (the first epic poem) in Sanskrit literature?",
      optionsHindi: ["\u0935\u093E\u0932\u094D\u092E\u0940\u0915\u093F \u0930\u093E\u092E\u093E\u092F\u0923", "\u092E\u0939\u093E\u092D\u093E\u0930\u0924", "\u0930\u0918\u0941\u0935\u0902\u0936\u092E", "\u0936\u094D\u0930\u0940\u092E\u0926\u094D\u092D\u0917\u0935\u0926\u094D\u0917\u0940\u0924\u093E"],
      optionsEnglish: ["Valmiki Ramayana", "Mahabharata", "Raghuvansham", "Bhagavad Gita"],
      correctHindi: "\u0935\u093E\u0932\u094D\u092E\u0940\u0915\u093F \u0930\u093E\u092E\u093E\u092F\u0923",
      correctEnglish: "Valmiki Ramayana",
      explanationHindi: "\u092E\u0939\u0930\u094D\u0937\u093F \u0935\u093E\u0932\u094D\u092E\u0940\u0915\u093F \u0926\u094D\u0935\u093E\u0930\u093E \u0930\u091A\u093F\u0924 \u0930\u093E\u092E\u093E\u092F\u0923 \u0915\u094B \u0938\u0902\u0938\u094D\u0915\u0943\u0924 \u0915\u093E \u092A\u094D\u0930\u0925\u092E \u092E\u0939\u093E\u0915\u093E\u0935\u094D\u092F \u0914\u0930 \u0935\u093E\u0932\u094D\u092E\u0940\u0915\u093F \u091C\u0940 \u0915\u094B \u0906\u0926\u093F\u0915\u0935\u093F \u092E\u093E\u0928\u093E \u091C\u093E\u0924\u093E \u0939\u0948\u0964",
      explanationEnglish: "The Valmiki Ramayana is hailed as the Adi Kavya because it was the first composed epic in Sanskrit.",
      ref: "Sanskrit & Shlokas"
    },
    {
      textHindi: "'\u0938\u0902\u0938\u094D\u0915\u0943\u0924' \u0936\u092C\u094D\u0926 \u0915\u093E \u0935\u093E\u0938\u094D\u0924\u0935\u093F\u0915 \u0905\u0930\u094D\u0925 \u0915\u094D\u092F\u093E \u0939\u094B\u0924\u093E \u0939\u0948?",
      textEnglish: "What is the true and literal meaning of the word 'Sanskrit'?",
      optionsHindi: ["\u092A\u0930\u093F\u0937\u094D\u0915\u0943\u0924, \u0936\u0941\u0926\u094D\u0927 \u0914\u0930 \u0938\u0941\u0938\u0902\u0938\u094D\u0915\u0943\u0924", "\u0926\u0947\u0935\u0924\u093E\u0913\u0902 \u0926\u094D\u0935\u093E\u0930\u093E \u092C\u094B\u0932\u0940 \u091C\u093E\u0928\u0947 \u0935\u093E\u0932\u0940", "\u0905\u0924\u094D\u092F\u0902\u0924 \u0915\u0920\u093F\u0928 \u092D\u093E\u0937\u093E", "\u092A\u094D\u0930\u093E\u091A\u0940\u0928 \u092C\u094B\u0932\u0940"],
      optionsEnglish: ["Refined, purified, and polished", "Spoken by deities", "Extremely difficult language", "Ancient dialect"],
      correctHindi: "\u092A\u0930\u093F\u0937\u094D\u0915\u0943\u0924, \u0936\u0941\u0926\u094D\u0927 and \u0938\u0941\u0938\u0902\u0938\u094D\u0915\u0943\u0924",
      correctEnglish: "Refined, purified, and polished",
      explanationHindi: "\u0938\u0902\u0938\u094D\u0915\u0943\u0924 \u0915\u093E \u0905\u0930\u094D\u0925 \u0939\u0948 '\u0938\u092E\u094D' (\u092D\u0932\u0940\u092D\u093E\u0902\u0924\u093F) + '\u0915\u0943\u0924' (\u0915\u0940 \u0939\u0941\u0908), \u0905\u0930\u094D\u0925\u093E\u0924\u094D \u091C\u094B \u092A\u0942\u0930\u094D\u0923 \u0930\u0942\u092A \u0938\u0947 \u0936\u0941\u0926\u094D\u0927 \u0914\u0930 \u0935\u094D\u092F\u093E\u0915\u0930\u0923 \u0938\u092E\u094D\u092E\u0924 \u0939\u094B\u0964",
      explanationEnglish: "Sanskrit literally translates to refined, systematic, purified, and intellectually polished language.",
      ref: "Sanskrit & Shlokas"
    },
    {
      textHindi: "\u0938\u0902\u0938\u093E\u0930 \u0915\u0947 \u0915\u0932\u094D\u092F\u093E\u0923 \u0939\u0947\u0924\u0941 \u092A\u094D\u0930\u0938\u093F\u0926\u094D\u0927 \u092A\u094D\u0930\u093E\u0930\u094D\u0925\u0928\u093E '\u0938\u0930\u094D\u0935\u0947 \u092D\u0935\u0928\u094D\u0924\u0941 \u0938\u0941\u0916\u093F\u0928\u0903' \u0915\u093F\u0938 \u092A\u094D\u0930\u093E\u091A\u0940\u0928 \u0909\u092A\u0928\u093F\u0937\u0926 \u0938\u0947 \u0932\u0940 \u0917\u0908 \u0939\u0948?",
      textEnglish: "The universal peace prayer 'Sarve Bhavantu Sukhinah' is part of which ancient Upanishadic tradition?",
      optionsHindi: ["\u092C\u0943\u0939\u0926\u093E\u0930\u0923\u094D\u092F\u0915 \u0909\u092A\u0928\u093F\u0937\u0926", "\u0915\u0920 \u0909\u092A\u0928\u093F\u0937\u0926", "\u092E\u093E\u0923\u094D\u0921\u0942\u0915\u094D\u092F \u0909\u092A\u0928\u093F\u0937\u0926", "\u0908\u0936 \u0909\u092A\u0928\u093F\u0937\u0926"],
      optionsEnglish: ["Brihadaranyaka Upanishad", "Katha Upanishad", "Mandukya Upanishad", "Isha Upanishad"],
      correctHindi: "\u092C\u0943\u0939\u0926\u093E\u0930\u0923\u094D\u092F\u0915 \u0909\u092A\u0928\u093F\u0937\u0926",
      correctEnglish: "Brihadaranyaka Upanishad",
      explanationHindi: "\u092F\u0939 \u0936\u093E\u0902\u0924\u093F \u092A\u093E\u0920 \u092C\u0943\u0939\u0926\u093E\u0930\u0923\u094D\u092F\u0915 \u0909\u092A\u0928\u093F\u0937\u0926 \u092A\u0930\u0902\u092A\u0930\u093E \u0938\u0947 \u091C\u0941\u0921\u093C\u093E \u0939\u0948, \u091C\u094B '\u0938\u092D\u0940 \u0938\u0941\u0916\u0940 \u0914\u0930 \u0928\u0940\u0930\u094B\u0917\u0940 \u0930\u0939\u0947\u0902' \u0915\u093E \u092A\u093E\u0935\u0928 \u0938\u0902\u0926\u0947\u0936 \u0926\u0947\u0924\u093E \u0939\u0948\u0964",
      explanationEnglish: "This ancient prayer for universal happiness and well-being belongs to the Brihadaranyaka Upanishad.",
      ref: "Sanskrit & Shlokas"
    }
  ];
  const generalTemplates = [
    {
      textHindi: "\u0938\u0928\u093E\u0924\u0928 \u0927\u0930\u094D\u092E \u0915\u0947 \u0905\u0902\u0924\u0930\u094D\u0917\u0924 '\u0924\u094D\u0930\u093F\u0926\u0947\u0935' \u0915\u0940 \u0938\u0902\u0915\u0932\u094D\u092A\u0928\u093E \u0915\u093F\u0928 \u0924\u0940\u0928 \u092A\u094D\u0930\u092E\u0941\u0916 \u0926\u0947\u0935\u0924\u093E\u0913\u0902 \u0915\u093E \u092A\u094D\u0930\u0924\u093F\u0928\u093F\u0927\u093F\u0924\u094D\u0935 \u0915\u0930\u0924\u0940 \u0939\u0948?",
      textEnglish: "Under Sanatan Dharma, the concept of 'Trideva' represents which three principal deities?",
      optionsHindi: ["\u092C\u094D\u0930\u0939\u094D\u092E\u093E, \u0935\u093F\u0937\u094D\u0923\u0941, \u092E\u0939\u0947\u0936 (\u0936\u093F\u0935)", "\u0930\u093E\u092E, \u0915\u0943\u0937\u094D\u0923, \u0939\u0928\u0941\u092E\u093E\u0928", "\u0907\u0902\u0926\u094D\u0930, \u0935\u0930\u0941\u0923, \u0905\u0917\u094D\u0928\u093F", "\u0917\u0923\u0947\u0936, \u0915\u093E\u0930\u094D\u0924\u093F\u0915\u0947\u092F, \u0936\u093F\u0935"],
      optionsEnglish: ["Brama, Vishnu, and Mahesh (Shiva)", "Rama, Krishna, and Hanuman", "Indra, Varuna, and Agni", "Ganesha, Kartikeya, and Shiva"],
      correctHindi: "\u092C\u094D\u0930\u0939\u094D\u092E\u093E, \u0935\u093F\u0937\u094D\u0923\u0941, \u092E\u0939\u0947\u0936 (\u0936\u093F\u0935)",
      correctEnglish: "Brahma, Vishnu, and Mahesh (Shiva)",
      explanationHindi: "\u0924\u094D\u0930\u093F\u0926\u0947\u0935 \u0938\u0943\u0937\u094D\u091F\u093F \u0915\u0940 \u0924\u0940\u0928 \u092A\u094D\u0930\u0915\u094D\u0930\u093F\u092F\u093E\u0913\u0902 \u0915\u0947 \u0938\u094D\u0935\u093E\u092E\u0940 \u0939\u0948\u0902: \u092C\u094D\u0930\u0939\u094D\u092E\u093E (\u0938\u0943\u0937\u094D\u091F\u093F \u0915\u0930\u094D\u0924\u093E), \u0935\u093F\u0937\u094D\u0923\u0941 (\u092A\u093E\u0932\u0928 \u0915\u0930\u094D\u0924\u093E) \u0914\u0930 \u092E\u0939\u0947\u0936 (\u0938\u0902\u0939\u093E\u0930 \u0915\u0930\u094D\u0924\u093E)\u0964",
      explanationEnglish: "The Trimurti/Trideva consists of Brahma the Creator, Vishnu the Preserver, and Shiva the Destroyer.",
      ref: "General Spiritual Knowledge"
    },
    {
      textHindi: "\u0938\u0928\u093E\u0924\u0928 \u0927\u0930\u094D\u092E \u0915\u0947 \u0905\u091F\u0932 '\u0915\u0930\u094D\u092E \u0938\u093F\u0926\u094D\u0927\u093E\u0902\u0924' \u0915\u0947 \u0905\u0928\u0941\u0938\u093E\u0930 \u092E\u0928\u0941\u0937\u094D\u092F \u0915\u094B \u092A\u094D\u0930\u093E\u092A\u094D\u0924 \u0939\u094B\u0928\u0947 \u0935\u093E\u0932\u0947 \u0938\u0941\u0916-\u0926\u0941\u0916 \u0915\u093E \u092E\u0941\u0916\u094D\u092F \u0915\u093E\u0930\u0923 \u0915\u094D\u092F\u093E \u0939\u0948?",
      textEnglish: "According to the immutable 'Law of Karma' in Sanatan Dharma, what is the primary cause of joy and sorrow?",
      optionsHindi: ["\u092E\u0928\u0941\u0937\u094D\u092F \u0915\u0947 \u0938\u094D\u0935\u092F\u0902 \u0915\u0947 \u092A\u0942\u0930\u094D\u0935 \u0914\u0930 \u0935\u0930\u094D\u0924\u092E\u093E\u0928 \u0915\u0930\u094D\u092E", "\u0917\u094D\u0930\u0939\u094B\u0902 \u0915\u0940 \u091A\u093E\u0932", "\u092D\u093E\u0917\u094D\u092F \u0915\u093E \u0905\u091A\u093E\u0928\u0915 \u092C\u0926\u0932\u0928\u093E", "\u0905\u0928\u094D\u092F \u0935\u094D\u092F\u0915\u094D\u0924\u093F\u092F\u094B\u0902 \u0915\u093E \u0935\u094D\u092F\u0935\u0939\u093E\u0930"],
      optionsEnglish: ["One's own past and present actions", "The planetary transits", "Sudden changes in luck/destiny", "The behavior of other people"],
      correctHindi: "\u092E\u0928\u0941\u0937\u094D\u092F \u0915\u0947 \u0938\u094D\u0935\u092F\u0902 \u0915\u0947 \u092A\u0942\u0930\u094D\u0935 \u0914\u0930 \u0935\u0930\u094D\u0924\u092E\u093E\u0928 \u0915\u0930\u094D\u092E",
      correctEnglish: "One's own past and present actions",
      explanationHindi: "\u0915\u0930\u094D\u092E \u0938\u093F\u0926\u094D\u0927\u093E\u0902\u0924 \u0915\u0947 \u0905\u0928\u0941\u0938\u093E\u0930 '\u091C\u0948\u0938\u093E \u092C\u094B\u0913\u0917\u0947, \u0935\u0948\u0938\u093E \u0915\u093E\u091F\u094B\u0917\u0947' - \u0905\u0930\u094D\u0925\u093E\u0924\u094D \u0939\u0930 \u0915\u094D\u0930\u093F\u092F\u093E \u0915\u0940 \u0938\u092E\u093E\u0928 \u0914\u0930 \u0935\u093F\u092A\u0930\u0940\u0924 \u092A\u094D\u0930\u0924\u093F\u0915\u094D\u0930\u093F\u092F\u093E \u0939\u094B\u0924\u0940 \u0939\u0948\u0964",
      explanationEnglish: "The Law of Karma dictates that every individual is solely responsible for their actions and experiences.",
      ref: "General Spiritual Knowledge"
    },
    {
      textHindi: "\u0939\u093F\u0902\u0926\u0942 \u0918\u0930\u094B\u0902 \u0915\u0947 \u092A\u094D\u0930\u0935\u0947\u0936 \u0926\u094D\u0935\u093E\u0930 \u092A\u0930 \u092C\u0928\u093E\u092F\u093E \u091C\u093E\u0928\u0947 \u0935\u093E\u0932\u093E \u0915\u0932\u094D\u092F\u093E\u0923, \u0936\u093E\u0902\u0924\u093F \u0914\u0930 \u0938\u092E\u0943\u0926\u094D\u0927\u093F \u0915\u093E \u092A\u093E\u0935\u0928 \u0926\u093F\u0935\u094D\u092F \u092A\u094D\u0930\u0924\u0940\u0915 \u0915\u094C\u0928 \u0938\u093E \u0939\u0948?",
      textEnglish: "Which sacred divine symbol of peace, auspiciousness, and prosperity is drawn on Hindu entrances?",
      optionsHindi: ["\u0938\u094D\u0935\u0938\u094D\u0924\u093F\u0915 (Swastika)", "\u0924\u094D\u0930\u093F\u0936\u0942\u0932", "\u0936\u0902\u0916", "\u0915\u092E\u0932"],
      optionsEnglish: ["Swastika", "Trishul", "Shankha", "Lotus"],
      correctHindi: "\u0938\u094D\u0935\u0938\u094D\u0924\u093F\u0915 (Swastika)",
      correctEnglish: "Swastika",
      explanationHindi: "\u0938\u094D\u0935\u0938\u094D\u0924\u093F\u0915 '\u0938\u0941' (\u0936\u0941\u092D) + '\u0905\u0938\u094D\u0924\u093F' (\u0915\u0932\u094D\u092F\u093E\u0923/\u0905\u0938\u094D\u0924\u093F\u0924\u094D\u0935) \u0915\u093E \u092A\u094D\u0930\u0924\u0940\u0915 \u0939\u0948, \u091C\u094B \u091A\u093E\u0930\u094B\u0902 \u0926\u093F\u0936\u093E\u0913\u0902 \u0938\u0947 \u0915\u0932\u094D\u092F\u093E\u0923 \u0915\u094B \u0906\u0915\u0930\u094D\u0937\u093F\u0924 \u0915\u0930\u0924\u093E \u0939\u0948\u0964",
      explanationEnglish: "The Swastika is an ancient Vedic symbol representing solar energy, peace, and spiritual fortune.",
      ref: "General Spiritual Knowledge"
    },
    {
      textHindi: "\u0906\u0927\u094D\u092F\u093E\u0924\u094D\u092E\u093F\u0915 \u092E\u093E\u0928\u094D\u092F\u0924\u093E\u0913\u0902 \u0915\u0947 \u0905\u0928\u0941\u0938\u093E\u0930 \u092A\u0930\u092E \u092A\u093E\u0935\u0928 \u092A\u0924\u093F\u0924\u092A\u093E\u0935\u0928\u0940 \u0917\u0902\u0917\u093E \u0928\u0926\u0940 \u0915\u093E \u092A\u0943\u0925\u094D\u0935\u0940 \u092A\u0930 \u0905\u0935\u0924\u0930\u0923 \u0915\u093F\u0938\u0915\u0947 \u092E\u0938\u094D\u0924\u0915 \u092A\u0930 \u0939\u0941\u0906 \u0925\u093E?",
      textEnglish: "According to spiritual traditions, on whose head did the celestial River Ganga first land during her descent?",
      optionsHindi: ["\u092D\u0917\u0935\u093E\u0928 \u0936\u093F\u0935 \u0915\u0940 \u091C\u091F\u093E\u0913\u0902 \u092E\u0947\u0902", "\u092D\u0917\u0935\u093E\u0928 \u0935\u093F\u0937\u094D\u0923\u0941 \u0915\u0947 \u091A\u0930\u0923\u094B\u0902 \u092E\u0947\u0902", "\u0930\u093E\u091C\u093E \u092D\u0917\u0940\u0930\u0925 \u0915\u0947 \u0930\u0925 \u092A\u0930", "\u0939\u093F\u092E\u093E\u0932\u092F \u0915\u0947 \u0936\u093F\u0916\u0930\u094B\u0902 \u092A\u0930"],
      optionsEnglish: ["Lord Shiva's matted hair", "Lord Vishnu's feet", "King Bhagiratha's chariot", "The peaks of Himalayas"],
      correctHindi: "\u092D\u0917\u0935\u093E\u0928 \u0936\u093F\u0935 \u0915\u0940 \u091C\u091F\u093E\u0913\u0902 \u092E\u0947\u0902",
      correctEnglish: "Lord Shiva's matted hair",
      explanationHindi: "\u0917\u0902\u0917\u093E \u0915\u0947 \u0924\u0940\u0935\u094D\u0930 \u0935\u0947\u0917 \u0915\u094B \u092A\u0943\u0925\u094D\u0935\u0940 \u0938\u0939\u0928 \u0928\u0939\u0940\u0902 \u0915\u0930 \u0938\u0915\u0924\u0940 \u0925\u0940, \u0907\u0938\u0932\u093F\u090F \u092D\u0917\u0935\u093E\u0928 \u0936\u093F\u0935 \u0928\u0947 \u0909\u0928\u094D\u0939\u0947\u0902 \u0905\u092A\u0928\u0940 \u091C\u091F\u093E\u0913\u0902 \u092E\u0947\u0902 \u0930\u094B\u0915\u0915\u0930 \u0936\u093E\u0902\u0924 \u0915\u093F\u092F\u093E \u0925\u093E\u0964",
      explanationEnglish: "Lord Shiva absorbed the intense force of descending Ganga in his locks to save the Earth from destruction.",
      ref: "General Spiritual Knowledge"
    },
    {
      textHindi: "\u0915\u093F\u0938 \u0905\u0928\u0941\u092A\u092E \u0927\u0930\u094D\u092E\u0917\u094D\u0930\u0902\u0925 \u0915\u094B \u0938\u0902\u092A\u0942\u0930\u094D\u0923 \u0909\u092A\u0928\u093F\u0937\u0926\u094B\u0902 \u0914\u0930 \u0935\u0947\u0926\u094B\u0902 \u0915\u093E \u0905\u092E\u0942\u0932\u094D\u092F \u0928\u093F\u091A\u094B\u0921\u093C (\u0938\u093E\u0930) \u092E\u093E\u0928\u093E \u0917\u092F\u093E \u0939\u0948?",
      textEnglish: "Which unparalleled scripture is recognized as the supreme summary (nectar) of all Vedas and Upanishads?",
      optionsHindi: ["\u0936\u094D\u0930\u0940\u092E\u0926\u094D\u092D\u0917\u0935\u0926\u094D\u0917\u0940\u0924\u093E (Bhagavad Gita)", "\u0930\u093E\u092E\u091A\u0930\u093F\u0924\u092E\u093E\u0928\u0938", "\u0936\u093F\u0935 \u092A\u0941\u0930\u093E\u0923", "\u092E\u0928\u0941\u0938\u094D\u092E\u0943\u0924\u093F"],
      optionsEnglish: ["Bhagavad Gita", "Ramcharitmanas", "Shiva Purana", "Manusmriti"],
      correctHindi: "\u0936\u094D\u0930\u0940\u092E\u0926\u094D\u092D\u0917\u0935\u0926\u094D\u0917\u0940\u0924\u093E (Bhagavad Gita)",
      correctEnglish: "Bhagavad Gita",
      explanationHindi: "\u0917\u0940\u0924\u093E \u0915\u094B '\u0917\u0940\u0924\u094B\u092A\u0928\u093F\u0937\u0926' \u092D\u0940 \u0915\u0939\u0924\u0947 \u0939\u0948\u0902, \u091C\u093F\u0938\u0947 \u0938\u092D\u0940 \u0909\u092A\u0928\u093F\u0937\u0926 \u0930\u0942\u092A\u0940 \u0917\u093E\u092F\u094B\u0902 \u0915\u0947 \u0926\u0941\u0917\u094D\u0927 \u0930\u0942\u092A\u0940 \u0905\u092E\u0943\u0924 \u0938\u093E\u0930 \u0915\u0947 \u0930\u0942\u092A \u092E\u0947\u0902 \u091C\u093E\u0928\u093E \u091C\u093E\u0924\u093E \u0939\u0948\u0964",
      explanationEnglish: "The Bhagavad Gita is hailed as the essence of Upanishadic literature, containing direct words of Lord Krishna.",
      ref: "General Spiritual Knowledge"
    }
  ];
  function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  let templates = gitaTemplates;
  const normalizedSubject = (subjectId || "").toLowerCase();
  if (normalizedSubject.includes("ramcharitmanas") || normalizedSubject.includes("manas") || scripture === "Ramcharitmanas") {
    templates = ramcharitmanasTemplates;
  } else if (normalizedSubject.includes("valmiki") || normalizedSubject.includes("ramayan") || scripture === "Valmiki Ramayan") {
    templates = valmikiTemplates;
  } else if (normalizedSubject.includes("radha") || normalizedSubject.includes("kataksh") || scripture === "Radha Kripa Kataksh") {
    templates = radhaTemplates;
  } else if (normalizedSubject.includes("hanuman_chalisa") || normalizedSubject.includes("chalisa") || scripture === "Hanuman Chalisa") {
    templates = hanumanTemplates;
  } else if (normalizedSubject.includes("vishnu_sahasranama") || normalizedSubject.includes("sahasranama") || scripture === "Vishnu Sahasranama") {
    templates = vishnuTemplates;
  } else if (normalizedSubject.includes("shiva_mahimna") || normalizedSubject.includes("mahimna") || scripture === "Shiv Mahimna Stotra") {
    templates = shivTemplates;
  } else if (normalizedSubject.includes("durga_saptashati") || normalizedSubject.includes("saptashati") || scripture === "Durga Saptashati") {
    templates = durgaTemplates;
  } else if (normalizedSubject.includes("sunderkand") || normalizedSubject.includes("sundarkand") || scripture === "Sundarkand") {
    templates = sunderTemplates;
  } else if (normalizedSubject.includes("mahabharata") || normalizedSubject.includes("bharat")) {
    templates = mahabharataTemplates;
  } else if (normalizedSubject.includes("shiv_puran")) {
    templates = shivPuranTemplates;
  } else if (normalizedSubject.includes("vishnu_puran")) {
    templates = vishnuPuranTemplates;
  } else if (normalizedSubject.includes("bhagavatam") || normalizedSubject.includes("bhagwat")) {
    templates = bhagavatamTemplates;
  } else if (normalizedSubject.includes("vedas") || normalizedSubject.includes("ved")) {
    templates = vedasTemplates;
  } else if (normalizedSubject.includes("upanishads") || normalizedSubject.includes("upanishad")) {
    templates = upanishadsTemplates;
  } else if (normalizedSubject.includes("saints") || normalizedSubject.includes("guru")) {
    templates = saintsTemplates;
  } else if (normalizedSubject.includes("temples") || normalizedSubject.includes("temple")) {
    templates = templesTemplates;
  } else if (normalizedSubject.includes("indian_culture") || normalizedSubject.includes("culture")) {
    templates = cultureTemplates;
  } else if (normalizedSubject.includes("festivals") || normalizedSubject.includes("vrat")) {
    templates = festivalsTemplates;
  } else if (normalizedSubject.includes("yoga")) {
    templates = yogaTemplates;
  } else if (normalizedSubject.includes("meditation") || normalizedSubject.includes("dhyan")) {
    templates = meditationTemplates;
  } else if (normalizedSubject.includes("sanskrit")) {
    templates = sanskritTemplates;
  } else if (normalizedSubject.includes("general_spiritual") || normalizedSubject.includes("general")) {
    templates = generalTemplates;
  }
  const shuffledTemplates = shuffleArray(templates);
  for (let i = 0; i < 25; i++) {
    const template = shuffledTemplates[i % shuffledTemplates.length];
    const idxStr = i + 1;
    const qText = isEnglish ? template.textEnglish : template.textHindi;
    const originalOptions = isEnglish ? template.optionsEnglish : template.optionsHindi;
    const shuffledOptions = shuffleArray(originalOptions);
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
      options: shuffledOptions,
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
function validateAndCleanQuestions(questions, defaultSubject, defaultChapter, defaultLanguage, defaultDifficulty, recentQuestionTexts = []) {
  if (!Array.isArray(questions)) return [];
  const seenTexts = /* @__PURE__ */ new Set();
  const cleaned = [];
  const normalizedRecentTexts = (recentQuestionTexts || []).map(
    (t) => String(t).toLowerCase().replace(/[^a-zA-Z0-9\u0900-\u097F]/g, "")
  ).filter(Boolean);
  for (const q of questions) {
    if (!q || typeof q !== "object") continue;
    let text = typeof q.text === "string" ? q.text.trim() : "";
    if (!text) {
      text = typeof q.question === "string" ? q.question.trim() : "";
    }
    if (!text) continue;
    const normalizedText = text.toLowerCase().replace(/[^a-zA-Z0-9\u0900-\u097F]/g, "");
    if (seenTexts.has(normalizedText)) continue;
    let isHistoricalDuplicate = false;
    for (const recentNorm of normalizedRecentTexts) {
      if (normalizedText === recentNorm || normalizedText.includes(recentNorm) || recentNorm.includes(normalizedText)) {
        isHistoricalDuplicate = true;
        break;
      }
    }
    if (isHistoricalDuplicate) {
      console.log(`[Deduplication Rule] Permanent quiz deduplicator triggered! Rejecting repeat question: "${text.substring(0, 60)}..."`);
      continue;
    }
    seenTexts.add(normalizedText);
    let options = [];
    if (Array.isArray(q.options)) {
      options = q.options.map((opt) => String(opt).trim()).filter(Boolean);
    }
    const type = typeof q.type === "string" ? q.type.toLowerCase() : "mcq";
    if (type === "true_false") {
      if (options.length < 2) {
        options = defaultLanguage === "English" ? ["True", "False"] : ["\u0938\u0924\u094D\u092F", "\u0905\u0938\u0924\u094D\u092F"];
      } else {
        options = options.slice(0, 2);
      }
    } else {
      if (options.length < 4) {
        continue;
      } else {
        options = options.slice(0, 4);
      }
    }
    let correctAnswer = typeof q.correctAnswer === "string" ? q.correctAnswer.trim() : "";
    if (!correctAnswer && typeof q.answer === "string") {
      correctAnswer = q.answer.trim();
    }
    if (!options.includes(correctAnswer)) {
      const matchedOpt = options.find((opt) => opt.toLowerCase() === correctAnswer.toLowerCase());
      if (matchedOpt) {
        correctAnswer = matchedOpt;
      } else {
        correctAnswer = options[0];
      }
    }
    let explanation = typeof q.explanation === "string" ? q.explanation.trim() : "";
    if (!explanation) {
      explanation = defaultLanguage === "English" ? `This question checks your knowledge of ${defaultSubject}. Please refer to the corresponding scriptures.` : `\u092F\u0939 \u092A\u094D\u0930\u0936\u094D\u0928 ${defaultSubject} \u0915\u0947 \u092C\u093E\u0930\u0947 \u092E\u0947\u0902 \u0906\u092A\u0915\u0947 \u091C\u094D\u091E\u093E\u0928 \u0915\u093E \u092A\u0930\u0940\u0915\u094D\u0937\u0923 \u0915\u0930\u0924\u093E. \u0915\u0943\u092A\u092F\u093E \u0938\u0902\u092C\u0902\u0927\u093F\u0924 \u0917\u094D\u0930\u0902\u0925\u094B\u0902 \u0915\u093E \u0938\u0902\u0926\u0930\u094D\u092D \u0932\u0947\u0902\u0964`;
    }
    let scriptureRef = typeof q.scriptureRef === "string" ? q.scriptureRef.trim() : "";
    if (!scriptureRef && typeof q.reference === "string") {
      scriptureRef = q.reference.trim();
    }
    if (!scriptureRef) {
      scriptureRef = defaultSubject;
    }
    const difficulty = typeof q.difficulty === "string" && q.difficulty ? q.difficulty.trim() : defaultDifficulty;
    const subject = typeof q.subject === "string" && q.subject ? q.subject.trim() : defaultSubject;
    const chapter = typeof q.chapter === "string" && q.chapter ? q.chapter.trim() : defaultChapter;
    const language = typeof q.language === "string" && q.language ? q.language.trim() : defaultLanguage;
    const aiVersion = typeof q.aiVersion === "string" && q.aiVersion ? q.aiVersion.trim() : "v1.0";
    const currentScripture = getScriptureName(defaultSubject);
    const scriptureKeywords = {
      "Bhagavad Gita": ["gita", "geeta", "shrimad bhagavad gita", "\u0915\u0943\u0937\u094D\u0923", "\u0905\u0930\u094D\u091C\u0941\u0928", "arjuna", "krishna", "kuru", "\u0915\u0941\u0930\u0941"],
      "Ramcharitmanas": ["manas", "ramcharitmanas", "\u0924\u0941\u0932\u0938\u0940\u0926\u093E\u0938", "\u0930\u093E\u092E\u091A\u0930\u093F\u0924\u092E\u093E\u0928\u0938", "\u0932\u0915\u094D\u0937\u094D\u092E\u0923", "\u0938\u0940\u0924\u093E", "\u0939\u0928\u0941\u092E\u093E\u0928", "\u0930\u093E\u092E", "tulsidas", "lakshman", "sita", "hanuman", "rama"],
      "Valmiki Ramayan": ["valmiki", "ramayan", "\u0935\u093E\u0932\u094D\u092E\u0940\u0915\u093F", "\u0930\u093E\u092E\u093E\u092F\u0923", "\u0907\u0915\u094D\u0937\u094D\u0935\u093E\u0915\u0941", "ikshvaku", "shanta", "\u0936\u093E\u0928\u094D\u0924\u093E"],
      "Radha Kripa Kataksh": ["radha", "kataksh", "\u0930\u093E\u0927\u093E", "\u0915\u091F\u093E\u0915\u094D\u0937", "\u0935\u0943\u0937\u092D\u093E\u0928\u0941", "vrisbhanu", "barsana", "\u092C\u0930\u0938\u093E\u0928\u093E"],
      "Hanuman Chalisa": ["chalisa", "\u091A\u093E\u0932\u0940\u0938\u093E", "\u0939\u0928\u0941\u092E\u093E\u0928", "\u0905\u0902\u091C\u0928\u0940", "\u0915\u0947\u0938\u0930\u0940", "siddhis", "nidhis", "\u0938\u093F\u0926\u094D\u0927\u093F", "\u0928\u093F\u0927\u093F"],
      "Vishnu Sahasranama": ["sahasranama", "\u0938\u0939\u0938\u094D\u0930\u0928\u093E\u092E", "\u092D\u0940\u0937\u094D\u092E", "\u092F\u0941\u0927\u093F\u0937\u094D\u0920\u093F\u0930", "vishnu", "\u0935\u093F\u0937\u094D\u0923\u0941", "bhishma", "yudhishthir"],
      "Shiv Mahimna Stotra": ["mahimna", "\u092E\u0939\u093F\u092E\u094D\u0928", "\u092A\u0941\u0937\u094D\u092A\u0926\u0902\u0924", "pushpadanta", "\u0936\u093F\u0935", "shiva", "shankar"],
      "Durga Saptashati": ["saptashati", "\u0938\u092A\u094D\u0924\u0936\u0924\u0940", "\u092E\u0939\u093F\u0937\u093E\u0938\u0941\u0930", "mahishasura", "\u0926\u0941\u0930\u094D\u0917\u093E", "durga", "\u092E\u0947\u0927\u093E", "medha"],
      "Sundarkand": ["sundarkand", "sunderkand", "\u0938\u0941\u0928\u094D\u0926\u0930\u0915\u093E\u0923\u094D\u0921", "\u0938\u0941\u0902\u0926\u0930\u0915\u093E\u0902\u0921", "\u0905\u0936\u094B\u0915 \u0935\u093E\u091F\u093F\u0915\u093E", "ashok vatika", "\u0935\u093F\u092D\u0940\u0937\u0923", "vibhishan", "\u092E\u0948\u0928\u093E\u0915", "mainak"]
    };
    const allScriptureNames = Object.keys(scriptureKeywords);
    const otherScriptureNames = allScriptureNames.filter((name) => name !== currentScripture);
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
      type: type === "true_false" ? "true_false" : "mcq",
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
  const app = (0, import_express.default)();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
  app.use(import_express.default.json());
  app.post("/api/generate-quote", async (req, res) => {
    try {
      const { topic } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API Key is not configured." });
      }
      const ai = new import_genai.GoogleGenAI({ apiKey });
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
      }, 2, "ai_quote");
      let rawText = response.text || "{}";
      const quote = JSON.parse(rawText);
      res.json({ quote });
    } catch (error) {
      console.warn("AI generate-quote error, using fallback instead:", error?.message || error);
      const fallbacks = [
        { hindi: "\u0915\u0930\u094D\u092E\u0923\u094D\u092F\u0947\u0935\u093E\u0927\u093F\u0915\u093E\u0930\u0938\u094D\u0924\u0947 \u092E\u093E \u092B\u0932\u0947\u0937\u0941 \u0915\u0926\u093E\u091A\u0928\u0964 \u092E\u093E \u0915\u0930\u094D\u092E\u092B\u0932\u0939\u0947\u0924\u0941\u0930\u094D\u092D\u0942\u0930\u094D\u092E\u093E \u0924\u0947 \u0938\u0919\u094D\u0917\u094B\u093D\u0938\u094D\u0924\u094D\u0935\u0915\u0930\u094D\u092E\u0923\u093F\u0965", english: "You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions.", source: "Bhagavad Gita 2.47" },
        { hindi: "\u092F\u0926\u093E \u092F\u0926\u093E \u0939\u093F \u0927\u0930\u094D\u092E\u0938\u094D\u092F \u0917\u094D\u0932\u093E\u0928\u093F\u0930\u094D\u092D\u0935\u0924\u093F \u092D\u093E\u0930\u0924\u0964 \u0905\u092D\u094D\u092F\u0941\u0924\u094D\u0925\u093E\u0928\u092E\u0927\u0930\u094D\u092E\u0938\u094D\u092F \u0924\u0926\u093E\u0924\u094D\u092E\u093E\u0928\u0902 \u0938\u0943\u091C\u093E\u092E\u094D\u092F\u0939\u092E\u094D\u0965", english: "Whenever and wherever there is a decline in religious practice, O descendant of Bharata, and a predominant rise of irreligion\u2014at that time I descend Myself.", source: "Bhagavad Gita 4.7" },
        { hindi: "\u092A\u0930\u093F\u0924\u094D\u0930\u093E\u0923\u093E\u092F \u0938\u093E\u0927\u0942\u0928\u093E\u0902 \u0935\u093F\u0928\u093E\u0936\u093E\u092F \u091A \u0926\u0941\u0937\u094D\u0915\u0943\u0924\u093E\u092E\u094D\u0964 \u0927\u0930\u094D\u092E\u0938\u0902\u0938\u094D\u0925\u093E\u092A\u0928\u093E\u0930\u094D\u0925\u093E\u092F \u0938\u092E\u094D\u092D\u0935\u093E\u092E\u093F \u092F\u0941\u0917\u0947 \u092F\u0941\u0917\u0947\u0965", english: "To deliver the pious and to annihilate the miscreants, as well as to reestablish the principles of religion, I Myself appear, millennium after millennium.", source: "Bhagavad Gita 4.8" },
        { hindi: "\u0924\u0947\u0937\u093E\u0902 \u0938\u0924\u0924\u092F\u0941\u0915\u094D\u0924\u093E\u0928\u093E\u0902 \u092D\u091C\u0924\u093E\u0902 \u092A\u094D\u0930\u0940\u0924\u093F\u092A\u0942\u0930\u094D\u0935\u0915\u092E\u094D\u0964 \u0926\u0926\u093E\u092E\u093F \u092C\u0941\u0926\u094D\u0927\u093F\u092F\u094B\u0917\u0902 \u0924\u0902 \u092F\u0947\u0928 \u092E\u093E\u092E\u0941\u092A\u092F\u093E\u0928\u094D\u0924\u093F \u0924\u0947\u0965", english: "To those who are constantly devoted to serving Me with love, I give the understanding by which they can come to Me.", source: "Bhagavad Gita 10.10" }
      ];
      const quote = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      res.json({ quote });
    }
  });
  const aiGuruMemoryCache = /* @__PURE__ */ new Map();
  function normalizeQuery(str) {
    return (str || "").toLowerCase().replace(/[?,.!\s\u0964\u0970]/g, "").trim();
  }
  function findPartialCacheMatch(normalized) {
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
      if (aiGuruMemoryCache.has(normalized)) {
        console.log(`[AI Guru Cache] Memory Cache HIT for: "${message}"`);
        return res.json({ reply: aiGuruMemoryCache.get(normalized) });
      }
      try {
        const cacheSnap = await (0, import_lite.getDocs)((0, import_lite.query)((0, import_lite.collection)(db, "ai_guru_cache"), (0, import_lite.orderBy)("timestamp", "desc")));
        for (const doc2 of cacheSnap.docs) {
          const data = doc2.data();
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
      const ai = new import_genai.GoogleGenAI({ apiKey });
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
      const response = await generateContentWithRetry(ai, {
        contents,
        config: {
          systemInstruction,
          temperature: 0.7
        }
      }, 4, "ai_chat");
      const replyText = response.text;
      aiGuruMemoryCache.set(normalized, replyText);
      try {
        await (0, import_lite.addDoc)((0, import_lite.collection)(db, "ai_guru_cache"), {
          message,
          reply: replyText,
          timestamp: (0, import_lite.serverTimestamp)()
        });
      } catch (err) {
        console.warn("[AI Guru Cache] Saving to Firestore cache failed:", err);
      }
      res.json({ reply: replyText });
    } catch (error) {
      console.error("AI Chat Error on primary 'ai_chat' service, trying backup 'ai_scripture'...", error?.message || error);
      try {
        const backupApiKey = process.env.GEMINI_API_KEY;
        if (backupApiKey) {
          const backupAi = new import_genai.GoogleGenAI({ apiKey: backupApiKey });
          const response = await generateContentWithRetry(backupAi, {
            contents: [
              ...Array.isArray(req.body.history) ? req.body.history : [],
              { role: "user", parts: [{ text: req.body.message }] }
            ],
            config: {
              systemInstruction: `You are "AI Guru", the official spiritual companion for the Hari Pathshala app. Keep answers warm, respectful, and short.`,
              temperature: 0.7
            }
          }, 4, "ai_scripture");
          if (response && response.text) {
            console.log("[AI Guru Backup Success] Resolved chat request via backup 'ai_scripture' service.");
            return res.json({ reply: response.text });
          }
        }
      } catch (backupError) {
        console.error("AI Chat Backup 'ai_scripture' service also failed:", backupError?.message || backupError);
      }
      const partialReply = findPartialCacheMatch(normalizeQuery(req.body.message || ""));
      if (partialReply) {
        return res.json({ reply: partialReply });
      }
      res.json({ reply: "AI Guru is temporarily unavailable. Please try again shortly. (AI \u0917\u0941\u0930\u0941 \u0935\u0930\u094D\u0924\u092E\u093E\u0928 \u092E\u0947\u0902 \u0905\u0938\u094D\u0925\u093E\u092F\u0940 \u0930\u0942\u092A \u0938\u0947 \u0905\u0928\u0941\u092A\u0932\u092C\u094D\u0927 \u0939\u0948\u0964 \u0915\u0943\u092A\u092F\u093E \u0915\u0941\u091B \u0938\u092E\u092F \u092C\u093E\u0926 \u092A\u0941\u0928\u0903 \u092A\u094D\u0930\u092F\u093E\u0938 \u0915\u0930\u0947\u0902\u0964)" });
    }
  });
  function getCachedGuruResponse(message) {
    const msg = (message || "").toLowerCase().trim();
    const cleanMsg = msg.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?🙏|]/g, "").trim();
    const greetings = [
      "hello",
      "hi",
      "hey",
      "namaste",
      "pranam",
      "radhe radhe",
      "hare krishna",
      "pranama",
      "shubh prabhat",
      "shubh sandhya",
      "\u092A\u094D\u0930\u0923\u093E\u092E",
      "\u0928\u092E\u0938\u094D\u0924\u0947",
      "\u0930\u093E\u0927\u0947 \u0930\u093E\u0927\u0947",
      "\u0939\u0930\u0947 \u0915\u0943\u0937\u094D\u0923",
      "\u091C\u092F \u0936\u094D\u0930\u0940 \u0915\u0943\u0937\u094D\u0923\u093E",
      "\u091C\u092F \u0938\u093F\u092F\u093E\u0930\u093E\u092E",
      "\u0930\u093E\u092E \u0930\u093E\u092E",
      "\u0938\u0941\u092A\u094D\u0930\u092D\u093E\u0924"
    ];
    if (greetings.includes(cleanMsg) || greetings.some((g) => cleanMsg === g)) {
      return "\u0930\u093E\u0927\u0947 \u0930\u093E\u0927\u0947! \u{1F64F} \u092E\u0948\u0902 \u0939\u0930\u093F \u092A\u093E\u0920\u0936\u093E\u0932\u093E \u0915\u093E AI \u0917\u0941\u0930\u0941 \u0939\u0942\u0901\u0964 \u092E\u0948\u0902 \u092D\u0917\u0935\u0926\u094D\u0917\u0940\u0924\u093E, \u0930\u093E\u092E\u091A\u0930\u093F\u0924\u092E\u093E\u0928\u0938, \u0935\u0947\u0926, \u0909\u092A\u0928\u093F\u0937\u0926, \u0914\u0930 \u0905\u0928\u094D\u092F \u0906\u0927\u094D\u092F\u093E\u0924\u094D\u092E\u093F\u0915 \u0935\u093F\u0937\u092F\u094B\u0902 \u092A\u0930 \u0906\u092A\u0915\u093E \u092E\u093E\u0930\u094D\u0917\u0926\u0930\u094D\u0936\u0928 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u092F\u0939\u093E\u0901 \u0939\u0942\u0901\u0964 \u0906\u092A \u092E\u0941\u091D\u0938\u0947 \u0905\u092A\u0928\u0947 \u091C\u0940\u0935\u0928 \u0915\u0940 \u0938\u092E\u0938\u094D\u092F\u093E\u0913\u0902 \u092F\u093E \u0936\u093E\u0938\u094D\u0924\u094D\u0930\u094B\u0902 \u0938\u0947 \u0938\u0902\u092C\u0902\u0927\u093F\u0924 \u0915\u094B\u0908 \u092D\u0940 \u092A\u094D\u0930\u0936\u094D\u0928 \u092A\u0942\u091B \u0938\u0915\u0924\u0947 \u0939\u0948\u0902\u0964 \u092E\u0948\u0902 \u0906\u092A\u0915\u0940 \u0915\u093F\u0938 \u092A\u094D\u0930\u0915\u093E\u0930 \u0938\u0939\u093E\u092F\u0924\u093E \u0915\u0930\u0942\u0901?";
    }
    if (cleanMsg.includes("who are you") || cleanMsg.includes("who is ai guru") || cleanMsg.includes("introduce yourself") || cleanMsg.includes("\u0924\u0941\u092E \u0915\u094C\u0928 \u0939\u094B") || cleanMsg.includes("\u0915\u094C\u0928 \u0939\u094B") || cleanMsg.includes("\u0905\u092A\u0928\u093E \u092A\u0930\u093F\u091A\u092F")) {
      return "\u092A\u094D\u0930\u0923\u093E\u092E! \u{1F64F} \u092E\u0948\u0902 \u0939\u0930\u093F \u092A\u093E\u0920\u0936\u093E\u0932\u093E \u0915\u093E 'AI \u0917\u0941\u0930\u0941' (\u0906\u0927\u094D\u092F\u093E\u0924\u094D\u092E\u093F\u0915 \u0938\u0939\u093E\u092F\u0915) \u0939\u0942\u0901\u0964 \u092E\u0947\u0930\u093E \u0927\u094D\u092F\u0947\u092F \u0938\u0928\u093E\u0924\u0928 \u0927\u0930\u094D\u092E \u0915\u0947 \u0917\u094D\u0930\u0902\u0925\u094B\u0902 (\u091C\u0948\u0938\u0947 \u092D\u0917\u0935\u0926\u094D\u0917\u0940\u0924\u093E, \u0930\u093E\u092E\u091A\u0930\u093F\u0924\u092E\u093E\u0928\u0938, \u0909\u092A\u0928\u093F\u0937\u0926) \u0915\u0947 \u0926\u093F\u0935\u094D\u092F \u091C\u094D\u091E\u093E\u0928 \u0915\u094B \u0905\u0924\u094D\u092F\u0902\u0924 \u0938\u0930\u0932 \u0914\u0930 \u0935\u094D\u092F\u093E\u0935\u0939\u093E\u0930\u093F\u0915 \u0930\u0942\u092A \u092E\u0947\u0902 \u0906\u092A \u0924\u0915 \u092A\u0939\u0941\u0901\u091A\u093E\u0928\u093E \u0939\u0948\u0964 \u0906\u092A \u092E\u0941\u091D\u0938\u0947 \u091C\u0940\u0935\u0928 \u0915\u0940 \u091A\u0941\u0928\u094C\u0924\u093F\u092F\u094B\u0902, \u092E\u093E\u0928\u0938\u093F\u0915 \u0936\u093E\u0902\u0924\u093F, \u0927\u094D\u092F\u093E\u0928, \u092D\u0915\u094D\u0924\u093F \u0914\u0930 \u0928\u0948\u0924\u093F\u0915 \u092E\u0942\u0932\u094D\u092F\u094B\u0902 \u092A\u0930 \u091A\u0930\u094D\u091A\u093E \u0915\u0930 \u0938\u0915\u0924\u0947 \u0939\u0948\u0902\u0964";
    }
    if (cleanMsg.includes("how can you help") || cleanMsg.includes("what can you do") || cleanMsg.includes("\u0924\u0941\u092E \u0915\u094D\u092F\u093E \u0915\u0930 \u0938\u0915\u0924\u0947 \u0939\u094B") || cleanMsg.includes("\u092E\u0947\u0930\u0940 \u092E\u0926\u0926 \u0915\u0948\u0938\u0947")) {
      return "\u092E\u0948\u0902 \u0906\u092A\u0915\u0940 \u0915\u0908 \u092A\u094D\u0930\u0915\u093E\u0930 \u0938\u0947 \u0938\u0939\u093E\u092F\u0924\u093E \u0915\u0930 \u0938\u0915\u0924\u093E \u0939\u0942\u0901:\n\n1. **\u0936\u093E\u0938\u094D\u0924\u094D\u0930\u094B\u0902 \u0915\u093E \u091C\u094D\u091E\u093E\u0928**: \u092D\u0917\u0935\u0926\u094D\u0917\u0940\u0924\u093E, \u0930\u093E\u092E\u091A\u0930\u093F\u0924\u092E\u093E\u0928\u0938, \u0935\u0947\u0926\u094B\u0902 \u0914\u0930 \u0909\u092A\u0928\u093F\u0937\u0926\u094B\u0902 \u0915\u0947 \u0936\u094D\u0932\u094B\u0915\u094B\u0902 \u0914\u0930 \u091A\u094C\u092A\u093E\u0907\u092F\u094B\u0902 \u0915\u093E \u0905\u0930\u094D\u0925 \u0935 \u0935\u094D\u092F\u093E\u0916\u094D\u092F\u093E\u0964\n2. **\u091C\u0940\u0935\u0928 \u0915\u0940 \u0938\u092E\u0938\u094D\u092F\u093E\u0913\u0902 \u0915\u093E \u0938\u092E\u093E\u0927\u093E\u0928**: \u092E\u093E\u0928\u0938\u093F\u0915 \u0924\u0928\u093E\u0935, \u0928\u093F\u0930\u094D\u0923\u092F \u0932\u0947\u0928\u0947 \u092E\u0947\u0902 \u0905\u0938\u092E\u0902\u091C\u0938, \u0906\u0924\u094D\u092E\u0935\u093F\u0936\u094D\u0935\u093E\u0938 \u0915\u0940 \u0915\u092E\u0940, \u0914\u0930 \u0930\u093F\u0936\u094D\u0924\u094B\u0902 \u092E\u0947\u0902 \u0938\u0941\u0927\u093E\u0930 \u0915\u0947 \u0932\u093F\u090F \u0906\u0927\u094D\u092F\u093E\u0924\u094D\u092E\u093F\u0915 \u092E\u093E\u0930\u094D\u0917\u0926\u0930\u094D\u0936\u0928\u0964\n3. **\u092D\u0915\u094D\u0924\u093F \u0914\u0930 \u0938\u093E\u0927\u0928\u093E**: \u092E\u0902\u0924\u094D\u0930 \u091C\u093E\u092A, \u0927\u094D\u092F\u093E\u0928 (Meditation), \u0914\u0930 \u0926\u0948\u0928\u093F\u0915 \u0938\u093E\u0927\u0928\u093E \u0915\u0940 \u0938\u0939\u0940 \u0935\u093F\u0927\u093F\u0964\n4. **\u0928\u0948\u0924\u093F\u0915 \u090F\u0935\u0902 \u0928\u0948\u0924\u093F\u0915 \u092E\u0942\u0932\u094D\u092F**: \u091C\u0940\u0935\u0928 \u092E\u0947\u0902 \u0938\u0915\u093E\u0930\u093E\u0924\u094D\u092E\u0915\u0924\u093E, \u0938\u0926\u093E\u091A\u093E\u0930, \u0914\u0930 \u091A\u0930\u093F\u0924\u094D\u0930 \u0928\u093F\u0930\u094D\u092E\u093E\u0923 \u0915\u0947 \u0909\u092A\u093E\u092F\u0964\n\n\u0906\u092A \u092E\u0941\u091D\u0938\u0947 \u092C\u0947\u091D\u093F\u091D\u0915 \u0915\u094B\u0908 \u092D\u0940 \u0906\u0927\u094D\u092F\u093E\u0924\u094D\u092E\u093F\u0915 \u092F\u093E \u091C\u0940\u0935\u0928 \u0938\u0947 \u091C\u0941\u0921\u093C\u093E \u092A\u094D\u0930\u0936\u094D\u0928 \u092A\u0942\u091B \u0938\u0915\u0924\u0947 \u0939\u0948\u0902\u0964";
    }
    if (cleanMsg.includes("hari pathshala") || cleanMsg.includes("\u0939\u0930\u093F \u092A\u093E\u0920\u0936\u093E\u0932\u093E") || cleanMsg.includes("website") || cleanMsg.includes("instagram")) {
      return "\u0939\u0930\u093F \u092A\u093E\u0920\u0936\u093E\u0932\u093E (Hari Pathshala) \u090F\u0915 \u0905\u0917\u094D\u0930\u0923\u0940 \u0906\u0927\u094D\u092F\u093E\u0924\u094D\u092E\u093F\u0915 \u0936\u0948\u0915\u094D\u0937\u0923\u093F\u0915 \u092E\u0902\u091A \u0939\u0948 \u091C\u093F\u0938\u0915\u093E \u0909\u0926\u094D\u0926\u0947\u0936\u094D\u092F \u0938\u0928\u093E\u0924\u0928 \u0927\u0930\u094D\u092E \u0915\u0947 \u0905\u092E\u0942\u0932\u094D\u092F \u091C\u094D\u091E\u093E\u0928 \u0915\u094B \u0906\u0927\u0941\u0928\u093F\u0915 \u092A\u0940\u0922\u093C\u0940 \u0915\u0947 \u0932\u093F\u090F \u0938\u0941\u0932\u092D \u0914\u0930 \u092C\u094B\u0927\u0917\u092E\u094D\u092F \u092C\u0928\u093E\u0928\u093E \u0939\u0948\u0964\n\n- **\u0906\u0927\u093F\u0915\u093E\u0930\u093F\u0915 \u0935\u0947\u092C\u0938\u093E\u0907\u091F**: [haripathshala.online](https://haripathshala.online)\n- **\u0907\u0902\u0938\u094D\u091F\u093E\u0917\u094D\u0930\u093E\u092E**: [@hari_pathshala](https://instagram.com/hari_pathshala)\n\n\u0939\u092E\u0938\u0947 \u091C\u0941\u0921\u093C\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u0914\u0930 \u0926\u0948\u0928\u093F\u0915 \u0906\u0927\u094D\u092F\u093E\u0924\u094D\u092E\u093F\u0915 \u091C\u094D\u091E\u093E\u0928 \u092A\u094D\u0930\u093E\u092A\u094D\u0924 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F \u0906\u092A \u0939\u092E\u093E\u0930\u0940 \u0935\u0947\u092C\u0938\u093E\u0907\u091F \u092A\u0930 \u091C\u093E \u0938\u0915\u0924\u0947 \u0939\u0948\u0902 \u092F\u093E \u0907\u0902\u0938\u094D\u091F\u093E\u0917\u094D\u0930\u093E\u092E \u092A\u0930 \u0939\u092E\u0947\u0902 \u092B\u0949\u0932\u094B \u0915\u0930 \u0938\u0915\u0924\u0947 \u0939\u0948\u0902\u0964 \u0930\u093E\u0927\u0947 \u0930\u093E\u0927\u0947! \u{1F64F}";
    }
    return null;
  }
  app.post("/api/scripture/verse", async (req, res) => {
    try {
      const { subjectId, chapterId, verseId } = req.body;
      if (!subjectId || !chapterId || !verseId) {
        return res.status(400).json({ error: "Missing subjectId, chapterId, or verseId." });
      }
      const docId = `${subjectId}_${chapterId}_${verseId}`.toLowerCase();
      const verseDocRef = (0, import_lite.doc)(db, "scripture_verses", docId);
      try {
        const verseSnap = await getDoc(verseDocRef);
        if (verseSnap.exists()) {
          return res.json(verseSnap.data());
        }
      } catch (dbErr) {
        console.warn("[Scripture Verse DB Read Warning] Firestore getDoc failed, generating via AI:", dbErr.message || dbErr);
      }
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API Key is not configured." });
      }
      const ai = new import_genai.GoogleGenAI({ apiKey });
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
      }, 4, "ai_scripture");
      const rawText = aiResponse.text || "{}";
      const parsed = JSON.parse(rawText);
      try {
        await (0, import_lite.setDoc)(verseDocRef, {
          ...parsed,
          subjectId,
          chapterId,
          verseId,
          lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
        });
      } catch (saveErr) {
        console.warn("[Scripture Verse DB Save Warning] Failed to cache verse content:", saveErr.message || saveErr);
      }
      return res.json(parsed);
    } catch (err) {
      console.error("Scripture Verse API failure:", err);
      res.status(500).json({ error: "Failed to retrieve scripture verse." });
    }
  });
  app.post("/api/scripture/chapter-study", async (req, res) => {
    try {
      const { subjectId, chapterId } = req.body;
      if (!subjectId || !chapterId) {
        return res.status(400).json({ error: "Missing subjectId or chapterId." });
      }
      const docId = `${subjectId}_${chapterId}`.toLowerCase();
      const chapStudyRef = (0, import_lite.doc)(db, "scripture_chapters", docId);
      try {
        const chapSnap = await getDoc(chapStudyRef);
        if (chapSnap.exists()) {
          return res.json(chapSnap.data());
        }
      } catch (dbErr) {
        console.warn("[Scripture Chapter DB Read Warning] Firestore getDoc failed, generating via AI:", dbErr.message || dbErr);
      }
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API Key is not configured." });
      }
      const ai = new import_genai.GoogleGenAI({ apiKey });
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
      }, 4, "ai_scripture");
      const rawText = aiResponse.text || "{}";
      const parsed = JSON.parse(rawText);
      try {
        await (0, import_lite.setDoc)(chapStudyRef, {
          ...parsed,
          subjectId,
          chapterId,
          lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
        });
      } catch (saveErr) {
        console.warn("[Scripture Chapter DB Save Warning] Failed to cache chapter content:", saveErr.message || saveErr);
      }
      return res.json(parsed);
    } catch (err) {
      console.error("Scripture Chapter API failure:", err);
      res.status(500).json({ error: "Failed to retrieve chapter study material." });
    }
  });
  app.post("/api/shipping/calculate", async (req, res) => {
    try {
      const { pincode, weight = 0.5 } = req.body;
      let shippingConfigDoc = null;
      try {
        shippingConfigDoc = await getDoc((0, import_lite.doc)(db, "settings", "shipping"));
      } catch (err) {
      }
      const shippingData = shippingConfigDoc && shippingConfigDoc.exists() ? shippingConfigDoc.data() : {};
      const email = shippingData.shiprocketEmail || process.env.SHIPROCKET_EMAIL || "";
      const password = shippingData.shiprocketPassword || process.env.SHIPROCKET_PASSWORD || "";
      if (!email || !password) {
        console.warn("[Shiprocket API] Credentials not configured. Returning successful standard free fallback.");
        return res.json({
          serviceable: true,
          shippingFee: 0,
          courierName: "Standard Courier (Fallback)",
          etd: "3-5 \u0926\u093F\u0928",
          transitTime: "3-5",
          codAvailable: true,
          mode: "fallback"
        });
      }
      const runWithRetry = async (fn, retries = 3, delay = 1e3) => {
        try {
          return await fn();
        } catch (error) {
          if (retries <= 1) throw error;
          console.warn(`[Shiprocket API] Request failed, retrying in ${delay}ms... Error: ${error.message}`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          return runWithRetry(fn, retries - 1, delay * 1.5);
        }
      };
      try {
        console.log(`[Shiprocket API] Authenticating with ${email}`);
        const authRes = await runWithRetry(() => import_axios.default.post("https://apiv2.shiprocket.in/v1/external/auth/login", {
          email,
          password
        }), 3, 1e3);
        const token = authRes.data?.token;
        if (!token) {
          throw new Error("Failed to retrieve token from Shiprocket response");
        }
        const pickupPincode = "303801";
        console.log(`[Shiprocket API] Checking serviceability from ${pickupPincode} to ${pincode} (weight: ${weight})`);
        let prepaidError = null;
        let codError = null;
        const [prepaidRes, codRes] = await Promise.all([
          runWithRetry(() => import_axios.default.get(`https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=${pickupPincode}&delivery_postcode=${pincode}&weight=${weight}&cod=0`, {
            headers: { Authorization: `Bearer ${token}` }
          }), 3, 800).catch((e) => {
            prepaidError = e;
            console.warn("Prepaid check failed or unserviceable:", e.response?.data || e.message);
            return null;
          }),
          runWithRetry(() => import_axios.default.get(`https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=${pickupPincode}&delivery_postcode=${pincode}&weight=${weight}&cod=1`, {
            headers: { Authorization: `Bearer ${token}` }
          }), 3, 800).catch((e) => {
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
          const cheapest = couriers.reduce((prev, curr) => prev.rate < curr.rate ? prev : curr);
          return res.json({
            serviceable: true,
            shippingFee: Math.round(cheapest.rate),
            courierName: cheapest.courier_name || cheapest.name || "Standard Courier",
            etd: cheapest.etd || cheapest.estimated_delivery_date || "",
            transitTime: cheapest.estimated_delivery_days || "3-5",
            codAvailable: !!hasCod,
            mode: "live"
          });
        } else {
          console.log("[Shiprocket API] No couriers returned or pincode unserviceable. Returning successful standard free fallback.");
          return res.json({
            serviceable: true,
            shippingFee: 0,
            courierName: "Standard Courier (Fallback)",
            etd: "3-5 \u0926\u093F\u0928",
            transitTime: "3-5",
            codAvailable: true,
            mode: "fallback"
          });
        }
      } catch (err) {
        console.error("Shiprocket authentication or execution failed, returning fallback shipping:", err.response?.data || err.message);
        return res.json({
          serviceable: true,
          shippingFee: 0,
          courierName: "Standard Courier (Fallback)",
          etd: "3-5 \u0926\u093F\u0928",
          transitTime: "3-5",
          codAvailable: true,
          mode: "fallback"
        });
      }
    } catch (error) {
      console.error("Shipping calculate error, returning fallback shipping:", error);
      res.json({
        serviceable: true,
        shippingFee: 0,
        courierName: "Standard Courier (Fallback)",
        etd: "3-5 \u0926\u093F\u0928",
        transitTime: "3-5",
        codAvailable: true,
        mode: "fallback"
      });
    }
  });
  app.post("/api/payment/create-order", async (req, res) => {
    try {
      const { amount, currency = "INR" } = req.body;
      let configDoc = null;
      try {
        configDoc = await getDoc((0, import_lite.doc)(db, "settings", "payment"));
      } catch (err) {
        console.warn("Failed to fetch payment settings from Firestore, using env vars:", err);
      }
      let mode = "test";
      let key_id = process.env.RAZORPAY_TEST_KEY_ID || "";
      let key_secret = process.env.RAZORPAY_TEST_KEY_SECRET || "";
      const liveKeyId = process.env.RAZORPAY_LIVE_KEY_ID || process.env.VITE_RAZORPAY_KEY || "";
      const liveKeySecret = process.env.RAZORPAY_LIVE_KEY_SECRET || "";
      const hasValidLiveKeys = liveKeyId && liveKeySecret;
      if (configDoc && configDoc.exists()) {
        const data = configDoc.data();
        const isLiveMode = data.enabled === true && data.onlinePayment === true && data.testMode === false && typeof data.keyId === "string" && data.keyId.startsWith("rzp_live_");
        if (isLiveMode) {
          mode = "live";
          key_id = data.keyId;
          key_secret = data.keySecret || liveKeySecret || "";
        } else {
          mode = "test";
          key_id = data.testMode === true || typeof data.keyId === "string" && data.keyId.startsWith("rzp_test_") ? data.keyId : process.env.RAZORPAY_TEST_KEY_ID || "";
          key_secret = data.keySecret || process.env.RAZORPAY_TEST_KEY_SECRET || "";
        }
      } else if (hasValidLiveKeys) {
        mode = "live";
        key_id = liveKeyId;
        key_secret = liveKeySecret;
      }
      if (!key_id || !key_secret) {
        return res.status(400).json({ error: "Payment configuration is incomplete. Please try again later or contact support." });
      }
      const rzp = new import_razorpay.default({ key_id, key_secret });
      const options = {
        amount: Math.round(amount * 100),
        // amount in paise
        currency,
        receipt: `rcpt_${Date.now()}`
      };
      try {
        const order = await rzp.orders.create(options);
        res.json({ orderId: order.id, amount: order.amount, currency: order.currency, mode });
      } catch (err) {
        const errMsg = err?.error?.description || err?.message || (typeof err === "object" ? JSON.stringify(err) : String(err)) || "Unknown Razorpay error";
        console.error("Razorpay API call failed:", errMsg);
        res.status(400).json({ error: `\u092D\u0941\u0917\u0924\u093E\u0928 \u0911\u0930\u094D\u0921\u0930 \u0928\u093F\u0930\u094D\u092E\u093E\u0923 \u0935\u093F\u092B\u0932: ${errMsg}` });
      }
    } catch (error) {
      const errMsg = error?.error?.description || error?.message || (typeof error === "object" ? JSON.stringify(error) : String(error)) || "Failed to create Razorpay order";
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
        orderData,
        // order details passed from frontend
        cart
      } = req.body;
      let configDoc = null;
      try {
        configDoc = await getDoc((0, import_lite.doc)(db, "settings", "payment"));
      } catch (err) {
        console.warn("Failed to fetch payment settings, using env vars:", err);
      }
      let mode = "test";
      let key_id = process.env.RAZORPAY_TEST_KEY_ID || "";
      let key_secret = process.env.RAZORPAY_TEST_KEY_SECRET || "";
      const liveKeySecret = process.env.RAZORPAY_LIVE_KEY_SECRET;
      const liveKeyId = process.env.RAZORPAY_LIVE_KEY_ID;
      const hasValidLiveKeys = liveKeyId && liveKeySecret && liveKeyId && liveKeySecret;
      if (configDoc && configDoc.exists()) {
        const data = configDoc.data();
        const isLiveMode = data.enabled === true && data.onlinePayment === true && data.testMode === false && typeof data.keyId === "string" && data.keyId.startsWith("rzp_live_");
        if (isLiveMode) {
          mode = "live";
          key_id = data.keyId;
          key_secret = data.keySecret || liveKeySecret || "";
        } else {
          mode = "test";
          key_id = data.testMode === true || typeof data.keyId === "string" && data.keyId.startsWith("rzp_test_") ? data.keyId : process.env.RAZORPAY_TEST_KEY_ID || "";
          key_secret = data.keySecret || process.env.RAZORPAY_TEST_KEY_SECRET || "";
        }
      } else if (hasValidLiveKeys) {
        mode = "live";
        key_id = liveKeyId;
        key_secret = liveKeySecret;
      }
      let isValid = false;
      const isCod = orderData?.paymentMethod === "cod";
      if (isCod) {
        isValid = true;
      } else {
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = import_crypto.default.createHmac("sha256", key_secret).update(body.toString()).digest("hex");
        isValid = expectedSignature === razorpay_signature;
      }
      if (!isValid) {
        return res.status(400).json({ error: "Invalid payment signature" });
      }
      if (!isCod && razorpay_payment_id) {
        try {
          const q = (0, import_lite.query)((0, import_lite.collection)(db, "orders"), (0, import_lite.where)("paymentId", "==", razorpay_payment_id));
          const snap = await (0, import_lite.getDocs)(q);
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
      const batch = (0, import_lite.writeBatch)(db);
      const newOrderRef = (0, import_lite.doc)((0, import_lite.collection)(db, "orders"));
      const finalOrderData = {
        ...orderData,
        id: newOrderRef.id,
        paymentId: isCod ? "COD" : razorpay_payment_id,
        razorpayOrderId: isCod ? "COD" : razorpay_order_id,
        status: "Confirmed",
        deliveryStatus: "Pending",
        createdAt: (0, import_lite.serverTimestamp)(),
        paymentMode: isCod ? "cod" : mode,
        total: orderData.totalAmount || orderData.subtotal || 0
      };
      let shippingDoc = null;
      try {
        shippingDoc = await getDoc((0, import_lite.doc)(db, "settings", "shipping"));
      } catch (err) {
        console.warn("Failed to fetch shipping settings, using env vars:", err);
      }
      const shippingData = shippingDoc && shippingDoc.exists() ? shippingDoc.data() : {};
      const email = shippingData.shiprocketEmail || process.env.SHIPROCKET_EMAIL || "";
      const password = shippingData.shiprocketPassword || process.env.SHIPROCKET_PASSWORD || "";
      let trackingNumber = "";
      let courierName = "";
      let labelUrl = "";
      let shiprocketOrderId = "";
      let shiprocketShipmentId = "";
      if (email && password) {
        try {
          const authRes = await import_axios.default.post("https://apiv2.shiprocket.in/v1/external/auth/login", {
            email,
            password
          });
          const token = authRes.data.token;
          const srOrderPayload = {
            order_id: newOrderRef.id,
            order_date: (/* @__PURE__ */ new Date()).toISOString(),
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
            order_items: cart.map((item) => ({
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
          const createOrderRes = await import_axios.default.post("https://apiv2.shiprocket.in/v1/external/orders/create/adhoc", srOrderPayload, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (createOrderRes.data && createOrderRes.data.shipment_id) {
            shiprocketOrderId = createOrderRes.data.order_id;
            shiprocketShipmentId = createOrderRes.data.shipment_id;
            let courierId = void 0;
            try {
              const courierRes = await import_axios.default.get(`https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=303801&delivery_postcode=${orderData.shippingAddress.pincode}&weight=${shippingData.packageWeight || 0.5}&cod=${isCod ? 1 : 0}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (courierRes.data && courierRes.data.data && courierRes.data.data.available_courier_companies && courierRes.data.data.available_courier_companies.length > 0) {
                const couriers = courierRes.data.data.available_courier_companies;
                const cheapest = couriers.reduce((prev, curr) => prev.rate < curr.rate ? prev : curr);
                courierId = cheapest.courier_company_id;
                courierName = cheapest.courier_name || cheapest.name;
              }
            } catch (cErr) {
              console.warn("Failed to find cheapest courier, letting Shiprocket assign default:", cErr);
            }
            const awbPayload = { shipment_id: createOrderRes.data.shipment_id };
            if (courierId) {
              awbPayload.courier_id = courierId;
            }
            const awbRes = await import_axios.default.post("https://apiv2.shiprocket.in/v1/external/courier/assign/awb", awbPayload, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (awbRes.data && awbRes.data.response && awbRes.data.response.data) {
              trackingNumber = awbRes.data.response.data.awb_code;
              courierName = awbRes.data.response.data.courier_name || courierName;
            }
            try {
              const labelRes = await import_axios.default.post("https://apiv2.shiprocket.in/v1/external/courier/generate/label", {
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
            try {
              await import_axios.default.post("https://apiv2.shiprocket.in/v1/external/courier/generate/pickup", {
                shipment_id: [createOrderRes.data.shipment_id]
              }, {
                headers: { Authorization: `Bearer ${token}` }
              });
            } catch (pErr) {
              console.warn("Failed to schedule pickup:", pErr);
            }
          }
        } catch (srErr) {
          console.error("Shiprocket integration failed. Proceeding without live tracking:", srErr.response?.data || srErr.message);
        }
      } else {
        console.warn("Shiprocket credentials are not configured. Proceeding without live tracking.");
      }
      const invoiceNumber = `HP-${Date.now().toString().slice(-6)}`;
      const invoiceUrl = `${req.protocol}://${req.get("host")}/invoice/${newOrderRef.id}`;
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
      for (const item of cart) {
        if (item.productId) {
          const productRef = (0, import_lite.doc)(db, "products", item.productId);
          batch.set(productRef, { stock: (0, import_lite.increment)(-item.quantity) }, { merge: true });
        }
      }
      const paymentLogRef = (0, import_lite.doc)((0, import_lite.collection)(db, "paymentLogs"));
      batch.set(paymentLogRef, {
        orderId: newOrderRef.id,
        userId: orderData.userId,
        amount: orderData.totalAmount || orderData.subtotal || 0,
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        status: "Success",
        createdAt: (0, import_lite.serverTimestamp)()
      });
      await batch.commit();
      res.json({ success: true, orderId: newOrderRef.id, trackingNumber, invoiceUrl, invoiceNumber });
    } catch (error) {
      console.error("Razorpay Verify Error:", error);
      res.status(500).json({ error: error.message || "Failed to verify payment" });
    }
  });
  app.post("/api/panchang", async (req, res) => {
    const {
      year = (/* @__PURE__ */ new Date()).getFullYear(),
      month = (/* @__PURE__ */ new Date()).getMonth() + 1,
      day = (/* @__PURE__ */ new Date()).getDate(),
      hour = 12,
      minute = 0,
      lat = 28.6139,
      lng = 77.209,
      tz_str = "Asia/Kolkata"
    } = req.body || {};
    try {
      let apiKey = process.env.FREEASTROAPI_KEY || "1a8a3f8e21799e9c562165708555d21c4b8b85e00817d71cf3ad4b4be622ffc0";
      try {
        const configDocRef = (0, import_lite.doc)(db, "api_config", "panchang");
        const configDocSnap = await getDoc(configDocRef);
        if (configDocSnap.exists()) {
          const configData = configDocSnap.data();
          if (configData && configData.apiKey) {
            apiKey = configData.apiKey;
          }
        } else {
          await (0, import_lite.setDoc)(configDocRef, {
            apiKey: "1a8a3f8e21799e9c562165708555d21c4b8b85e00817d71cf3ad4b4be622ffc0",
            provider: "FreeAstroAPI",
            updatedAt: (0, import_lite.serverTimestamp)()
          });
        }
      } catch (errConfig) {
        console.warn("Could not retrieve FreeAstroAPI key from Firestore, using fallback key:", errConfig);
      }
      const payload = {
        year,
        month,
        day,
        hour,
        minute,
        lat,
        lng,
        tz_str
      };
      const response = await import_axios.default.post("https://api.freeastroapi.com/api/v2/vedic/panchang", payload, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey
        },
        timeout: 8e3
      });
      if (!response.data || response.data.status === "fail" || response.data.status === "error" || response.data.error) {
        throw new Error(response.data?.error || "Panchang API returned non-success status");
      }
      res.json(response.data);
    } catch (error) {
      console.warn("[Panchang API Warning - Falling back to date-derived Panchang calculations]", error?.message || error);
      const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dateObj = new Date(year, month - 1, day);
      const weekdayName = weekdays[dateObj.getDay()] || "Monday";
      const tithiIndex = (day + month * 2) % 15;
      const tithis = ["Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shasthi", "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima"];
      const pakshaVal = day % 30 < 15 ? "Shukla" : "Krishna";
      const tithiVal = pakshaVal === "Krishna" && tithiIndex === 14 ? "Amavasya" : tithis[tithiIndex];
      const nakshatras = [
        "Ashwini",
        "Bharani",
        "Krittika",
        "Rohini",
        "Mrigashira",
        "Ardra",
        "Punarvasu",
        "Pushya",
        "Ashlesha",
        "Magha",
        "Purva Phalguni",
        "Uttara Phalguni",
        "Hasta",
        "Chitra",
        "Svati",
        "Vishakha",
        "Anuradha",
        "Jyeshtha",
        "Mula",
        "Purva Ashadha",
        "Uttara Ashadha",
        "Shravana",
        "Dhanishta",
        "Shatabhisha",
        "Purva Bhadrapada",
        "Uttara Bhadrapada",
        "Revati"
      ];
      const nakshatraVal = nakshatras[(day + month * 3) % 27];
      const yogas = [
        "Vishkumbha",
        "Priti",
        "Ayushman",
        "Saubhagya",
        "Shobhana",
        "Atiganda",
        "Sukarma",
        "Dhriti",
        "Shula",
        "Ganda",
        "Vriddhi",
        "Dhruva",
        "Vyaghata",
        "Harshana",
        "Vajra",
        "Siddhi",
        "Vyatipata",
        "Variyan",
        "Parigha",
        "Shiva",
        "Siddha",
        "Sadhya",
        "Shubha",
        "Shukla",
        "Brahma",
        "Indra",
        "Vaidhriti"
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
  async function preGenerateChapterQuestions(subjectId, chapterId, chapterName, selectedLang) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return;
    const ai = new import_genai.GoogleGenAI({ apiKey });
    let validatedQuestions = [];
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
        }, 2, "ai_quiz");
        const rawText = aiResponse.text || "{}";
        const parsed = JSON.parse(rawText);
        if (parsed && Array.isArray(parsed.questions)) {
          const cleaned = validateAndCleanQuestions(parsed.questions, subjectId, chapterId, selectedLang, "Medium");
          if (cleaned.length >= 25) {
            validatedQuestions = cleaned.slice(0, 25);
            break;
          }
        }
      } catch (err) {
        console.warn(`[AI Chapter Bank BG Warning] Attempt ${attempts} failed:`, err?.message);
      }
    }
    if (validatedQuestions.length < 25) {
      validatedQuestions = getFallbackQuestions(subjectId, chapterId, selectedLang);
    }
    const batch = (0, import_lite.writeBatch)(db);
    validatedQuestions.forEach((q, idx) => {
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
      batch.set((0, import_lite.doc)(db, "quiz_questions", qId), finalQ);
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
    let chapters = [];
    try {
      try {
        const chapRef = (0, import_lite.collection)(db, "quiz_chapters");
        const q = (0, import_lite.query)(chapRef, (0, import_lite.where)("subjectId", "==", cleanSubjectId));
        const snap = await (0, import_lite.getDocs)(q);
        if (!snap.empty) {
          snap.forEach((d) => {
            chapters.push({ id: d.id, ...d.data() });
          });
          chapters.sort((a, b) => (a.number || 0) - (b.number || 0));
          return res.json({ chapters });
        }
      } catch (dbErr) {
        console.warn("[AI Chapters Warning] Firestore query failed (possible Quota Exceeded):", dbErr.message || dbErr);
        if (localChapters && Array.isArray(localChapters) && localChapters.length > 0) {
          console.log("[AI Chapters Fallback] Returning local config chapters due to database error.");
          return res.json({ chapters: localConfigMap(localChapters, cleanSubjectId) });
        }
      }
      if (localChapters && Array.isArray(localChapters) && localChapters.length > 0) {
        console.log(`[AI Chapters] Seeding/Resolving ${localChapters.length} local chapters for subjectId=${cleanSubjectId}`);
        chapters = localConfigMap(localChapters, cleanSubjectId);
        try {
          const batch = (0, import_lite.writeBatch)(db);
          chapters.forEach((chap) => {
            batch.set((0, import_lite.doc)(db, "quiz_chapters", chap.id), chap);
          });
          await batch.commit();
        } catch (dbErr) {
          console.warn("[AI Chapters Warning] Could not persist seeded chapters to Firestore (possible Quota Exceeded):", dbErr.message || dbErr);
        }
      } else {
        console.log(`[AI Chapters] Generating chapters via Gemini for subjectId=${cleanSubjectId}`);
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          return res.status(500).json({ error: "Gemini API Key is not configured." });
        }
        const ai = new import_genai.GoogleGenAI({ apiKey });
        const prompt = `You are a world-class scholar of Sanatan Dharma and Vedic literature.
Generate a structured, authentic list of chapters for the subject: "${cleanSubjectName}" (ID: ${cleanSubjectId}).
Create between 5 to 10 chapters that logically structure the teachings of this subject.

Respond ONLY with a JSON object matching this exact schema:
{
  "chapters": [
    {
      "number": 1,
      "nameEnglish": "Chapter Name in English",
      "nameHindi": "\u0905\u0927\u094D\u092F\u093E\u092F \u0915\u093E \u0928\u093E\u092E \u0939\u093F\u0902\u0926\u0940 \u092E\u0947\u0902",
      "descriptionEnglish": "A brief, highly informative description of this chapter's spiritual teachings in English",
      "descriptionHindi": "\u0907\u0938 \u0905\u0927\u094D\u092F\u093E\u092F \u0915\u0940 \u0906\u0927\u094D\u092F\u093E\u0924\u094D\u092E\u093F\u0915 \u0936\u093F\u0915\u094D\u0937\u093E\u0913\u0902 \u0915\u093E \u0939\u093F\u0902\u0926\u0940 \u092E\u0947\u0902 \u090F\u0915 \u0938\u0902\u0915\u094D\u0937\u093F\u092A\u094D\u0924, \u091C\u094D\u091E\u093E\u0928\u0935\u0930\u094D\u0927\u0915 \u0935\u093F\u0935\u0930\u0923"
    }
  ]
}`;
        const response = await generateContentWithRetry(ai, {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            temperature: 0.7,
            responseMimeType: "application/json"
          }
        }, 2, "ai_quiz");
        const rawText = response.text || "{}";
        const parsed = JSON.parse(rawText);
        if (parsed && Array.isArray(parsed.chapters)) {
          chapters = parsed.chapters.map((c, index) => {
            const num = c.number || index + 1;
            const chapId = `${cleanSubjectId}_chapter_${num}`;
            return {
              id: chapId,
              chapterId: `chapter_${num}`,
              subjectId: cleanSubjectId,
              number: num,
              nameEnglish: c.nameEnglish || `Chapter ${num}`,
              nameHindi: c.nameHindi || `\u0905\u0927\u094D\u092F\u093E\u092F ${num}`,
              descriptionEnglish: c.descriptionEnglish || "",
              descriptionHindi: c.descriptionHindi || ""
            };
          });
          try {
            const batch = (0, import_lite.writeBatch)(db);
            chapters.forEach((chap) => {
              batch.set((0, import_lite.doc)(db, "quiz_chapters", chap.id), chap);
            });
            await batch.commit();
          } catch (dbErr) {
            console.warn("[AI Chapters Warning] Could not persist Gemini-generated chapters to Firestore (possible Quota Exceeded):", dbErr.message || dbErr);
          }
        } else {
          throw new Error("Failed to parse chapters from Gemini response");
        }
      }
      chapters.sort((a, b) => (a.number || 0) - (b.number || 0));
      return res.json({ chapters });
    } catch (error) {
      console.error("[AI Chapters] Get or Create Chapters Error:", error);
      if (localChapters && Array.isArray(localChapters) && localChapters.length > 0) {
        return res.json({ chapters: localConfigMap(localChapters, cleanSubjectId) });
      }
      return res.status(500).json({ error: error.message || "Unknown error" });
    }
  });
  function localConfigMap(localChapters, cleanSubjectId) {
    return localChapters.map((c) => {
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
  async function generateAndSaveQuestionsBackground(subjectId, chapterId, chapterName, selectedLang, force = false, lessonId = "") {
    const statusId = lessonId ? `${subjectId}_${chapterId}_${lessonId}_${selectedLang}` : `${subjectId}_${chapterId}_${selectedLang}`;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      await (0, import_lite.setDoc)((0, import_lite.doc)(db, "quiz_generation_status", statusId), {
        id: statusId,
        subjectId,
        chapterId,
        language: selectedLang,
        status: "Failed",
        errorMessage: "Gemini API key is missing",
        lastGeneratedTime: (/* @__PURE__ */ new Date()).toISOString()
      }, { merge: true });
      return;
    }
    await (0, import_lite.setDoc)((0, import_lite.doc)(db, "quiz_generation_status", statusId), {
      id: statusId,
      subjectId,
      chapterId,
      language: selectedLang,
      status: "Generating",
      totalQuestions: 25,
      lastGeneratedTime: (/* @__PURE__ */ new Date()).toISOString()
    }, { merge: true });
    let validatedQuestions = [];
    let attempts = 0;
    const maxAttempts = 3;
    const ai = new import_genai.GoogleGenAI({ apiKey });
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
        }, 2, "ai_quiz");
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
      } catch (err) {
        console.warn(`[AI Bank BG Error] Attempt ${attempts} failed:`, err?.message || err);
        const isQuotaExceeded = err?.message?.toLowerCase().includes("quota") || err?.message?.toLowerCase().includes("exceeded your current quota") || err?.message?.toLowerCase().includes("limit: 20") || err?.message?.toLowerCase().includes("billing");
        if (isQuotaExceeded) {
          console.warn("[AI Bank BG Error] Quota exceeded. Breaking out of retry loop to avoid log spam.");
          break;
        }
      }
    }
    if (validatedQuestions.length < 25) {
      console.log(`[AI Bank BG] Using fallback questions for ${subjectId}/${chapterId} (${selectedLang})`);
      const fallbackQs = getFallbackQuestions(subjectId, chapterId, selectedLang);
      validatedQuestions = [...validatedQuestions, ...fallbackQs].slice(0, 25);
    }
    try {
      if (force) {
        const qRef = (0, import_lite.collection)(db, "quiz_questions");
        let qQuery = (0, import_lite.query)(qRef, (0, import_lite.where)("subjectId", "==", subjectId), (0, import_lite.where)("chapterId", "==", chapterId), (0, import_lite.where)("language", "==", selectedLang));
        if (lessonId) {
          qQuery = (0, import_lite.query)(qRef, (0, import_lite.where)("subjectId", "==", subjectId), (0, import_lite.where)("chapterId", "==", chapterId), (0, import_lite.where)("lessonId", "==", lessonId), (0, import_lite.where)("language", "==", selectedLang));
        }
        const snap = await (0, import_lite.getDocs)(qQuery);
        const delBatch = (0, import_lite.writeBatch)(db);
        snap.forEach((docSnap) => {
          delBatch.delete((0, import_lite.doc)(db, "quiz_questions", docSnap.id));
        });
        await delBatch.commit();
      }
      const batch = (0, import_lite.writeBatch)(db);
      validatedQuestions.forEach((q, idx) => {
        const qId = lessonId ? `chapter_q_${subjectId}_${chapterId}_${lessonId}_${selectedLang.toLowerCase()}_${idx}_${Date.now()}` : `chapter_q_${subjectId}_${chapterId}_${selectedLang.toLowerCase()}_${idx}_${Date.now()}`;
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
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          generatedBy: "Gemini",
          verified: false,
          status: "Published",
          verifiedStatus: "Unverified",
          sourceType: "AI Generated"
        };
        batch.set((0, import_lite.doc)(db, "quiz_questions", qId), finalQ);
      });
      await batch.commit();
      await (0, import_lite.setDoc)((0, import_lite.doc)(db, "quiz_generation_status", statusId), {
        id: statusId,
        subjectId,
        chapterId,
        language: selectedLang,
        status: "Completed",
        totalQuestions: 25,
        generatedCount: validatedQuestions.length,
        lastGeneratedTime: (/* @__PURE__ */ new Date()).toISOString()
      }, { merge: true });
      console.log(`[AI Bank BG] Completed generation successfully for ${subjectId}/${chapterId} (${selectedLang}). Saved ${validatedQuestions.length} questions.`);
    } catch (saveErr) {
      console.error(`[AI Bank BG Save Error] Failed to save questions for ${subjectId}/${chapterId}:`, saveErr);
      await (0, import_lite.setDoc)((0, import_lite.doc)(db, "quiz_generation_status", statusId), {
        id: statusId,
        subjectId,
        chapterId,
        language: selectedLang,
        status: "Failed",
        errorMessage: saveErr.message || "Firestore write error",
        lastGeneratedTime: (/* @__PURE__ */ new Date()).toISOString()
      }, { merge: true });
    }
  }
  app.post("/api/quiz/pre-generate", async (req, res) => {
    try {
      const { userId, subjectId } = req.body;
      if (!userId || !subjectId) {
        return res.status(400).json({ error: "userId and subjectId are required." });
      }
      res.json({ status: "processing" });
      (async () => {
        try {
          console.log(`[AI Quiz Cache] Starting background pre-generation for userId=${userId}, subjectId=${subjectId}`);
          await generateNextQuizToCache(userId, subjectId);
          console.log(`[AI Quiz Cache] Background pre-generation completed for userId=${userId}, subjectId=${subjectId}`);
        } catch (err) {
          console.error("[AI Quiz Cache] Background pre-generation failed:", err);
        }
      })();
    } catch (error) {
      console.error("[AI Quiz Cache] Pre-generate error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  async function expandQuestionBankForChapter(subjectId, chapterId, language) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return [];
    const ai = new import_genai.GoogleGenAI({ apiKey });
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
      }, 3, "ai_quiz");
      const parsed = JSON.parse(response.text || "{}");
      if (parsed && Array.isArray(parsed.questions)) {
        const cleaned = validateAndCleanQuestions(parsed.questions, subjectId, chapterId, language, "Intermediate");
        const batch = (0, import_lite.writeBatch)(db);
        const savedQuestions = [];
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
          batch.set((0, import_lite.doc)(db, "quiz_questions", qId), finalQ);
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
    let type = null;
    let subjectId = null;
    let subjectName = null;
    let userId = null;
    let targetSubjectId = null;
    let cleanSubject = null;
    try {
      const body = req.body || {};
      type = body.type;
      subjectId = body.subjectId;
      subjectName = body.subjectName;
      userId = body.userId;
      targetSubjectId = type === "mixed" ? "ai_mixed" : subjectId;
      cleanSubject = subjectName || targetSubjectId || "Sanatan Dharma";
      if (type === "chapter") {
        const { chapterId, chapterName, language } = req.body;
        const selectedLang = language || "Hindi";
        if (!subjectId || !chapterId) {
          return res.status(400).json({ error: "Missing subjectId or chapterId" });
        }
        const qRef = (0, import_lite.collection)(db, "quiz_questions");
        const qQuery = (0, import_lite.query)(
          qRef,
          (0, import_lite.where)("subjectId", "==", subjectId),
          (0, import_lite.where)("chapterId", "==", chapterId),
          (0, import_lite.where)("language", "==", selectedLang)
        );
        let questions = [];
        try {
          const snapQuestions = await (0, import_lite.getDocs)(qQuery);
          questions = snapQuestions.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        } catch (dbErr) {
          console.warn("[AI Chapter Bank Warning] Firestore getDocs failed (possible Quota Exceeded), using fallback questions:", dbErr.message || dbErr);
        }
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
      const todayStr = (/* @__PURE__ */ new Date()).toLocaleDateString("en-CA");
      const quizzesRef = (0, import_lite.collection)(db, "quiz_quizzes");
      let adminQuizDoc = null;
      if (type === "mixed") {
        const qAdmin = (0, import_lite.query)(quizzesRef, (0, import_lite.where)("isPublished", "==", true), (0, import_lite.where)("type", "==", "mixed"));
        const snapAdmin = await (0, import_lite.getDocs)(qAdmin);
        if (userId) {
          const histRef = (0, import_lite.collection)(db, "userStats", userId, "quiz_history");
          const histSnap = await (0, import_lite.getDocs)(histRef);
          const completedIds = histSnap.docs.map((d) => d.data().quizId);
          adminQuizDoc = snapAdmin.docs.find((d) => !completedIds.includes(d.id));
        } else {
          adminQuizDoc = snapAdmin.docs[0];
        }
      } else if (subjectId) {
        const qAdmin = (0, import_lite.query)(quizzesRef, (0, import_lite.where)("isPublished", "==", true), (0, import_lite.where)("subjectId", "==", subjectId));
        const snapAdmin = await (0, import_lite.getDocs)(qAdmin);
        if (userId) {
          const histRef = (0, import_lite.collection)(db, "userStats", userId, "quiz_history");
          const histSnap = await (0, import_lite.getDocs)(histRef);
          const completedIds = histSnap.docs.map((d) => d.data().quizId);
          adminQuizDoc = snapAdmin.docs.find((d) => !completedIds.includes(d.id));
        } else {
          adminQuizDoc = snapAdmin.docs[0];
        }
      }
      if (adminQuizDoc) {
        const quizData = { id: adminQuizDoc.id, ...adminQuizDoc.data() };
        const qQuestions = (0, import_lite.query)((0, import_lite.collection)(db, "quiz_questions"), (0, import_lite.where)("quizId", "==", adminQuizDoc.id));
        const snapQuestions = await (0, import_lite.getDocs)(qQuestions);
        let questions = snapQuestions.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (questions.length < 10) {
          const extraNeeded = 10 - questions.length;
          const extra = await generateExtraQuestions(adminQuizDoc.id, subjectId || "ai_mixed", quizData.name || "Quiz", extraNeeded, questions.map((q) => q.text || ""));
          questions = [...questions, ...extra];
        }
        return res.json({ quiz: quizData, questions });
      }
      targetSubjectId = type === "mixed" ? "ai_mixed" : subjectId;
      if (userId && targetSubjectId) {
        const cacheId = `${userId}_${targetSubjectId}`;
        const cacheSnap = await getDoc((0, import_lite.doc)(db, "quiz_ai_cache", cacheId));
        if (cacheSnap.exists() && cacheSnap.data().status === "ready") {
          const cacheData = cacheSnap.data();
          const cachedQuizId = cacheData.quizId;
          const promotedQuiz = {
            id: cachedQuizId,
            subjectId: targetSubjectId,
            name: cacheData.quizName || `AI Quiz`,
            description: cacheData.quizDescription || `A personalized spiritual wisdom practice session.`,
            coverImage: "https://images.unsplash.com/photo-1608958416719-792f44053351?auto=format&fit=crop&w=800&q=80",
            type: type || (targetSubjectId === "ai_mixed" ? "mixed" : "subject"),
            timeLimit: 180,
            questionsCount: 10,
            points: 100,
            isPublished: true,
            isTodayQuiz: false,
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          };
          const batch2 = (0, import_lite.writeBatch)(db);
          batch2.set((0, import_lite.doc)(db, "quiz_quizzes", cachedQuizId), promotedQuiz);
          const questionsList = cacheData.questions.map((q, idx) => {
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
            batch2.set((0, import_lite.doc)(db, "quiz_questions", qId), finalQ);
            return finalQ;
          });
          batch2.update((0, import_lite.doc)(db, "quiz_ai_cache", cacheId), { status: "completed" });
          await batch2.commit();
          return res.json({ quiz: promotedQuiz, questions: questionsList });
        }
      }
      if (userId && targetSubjectId) {
        await generateNextQuizToCache(userId, targetSubjectId);
        const cacheId = `${userId}_${targetSubjectId}`;
        const cacheSnap = await getDoc((0, import_lite.doc)(db, "quiz_ai_cache", cacheId));
        if (cacheSnap.exists()) {
          const cacheData = cacheSnap.data();
          const cachedQuizId = cacheData.quizId;
          const promotedQuiz = {
            id: cachedQuizId,
            subjectId: targetSubjectId,
            name: cacheData.quizName || `AI Quiz`,
            description: cacheData.quizDescription || `A personalized spiritual wisdom practice session.`,
            coverImage: "https://images.unsplash.com/photo-1608958416719-792f44053351?auto=format&fit=crop&w=800&q=80",
            type: type || (targetSubjectId === "ai_mixed" ? "mixed" : "subject"),
            timeLimit: 180,
            questionsCount: 10,
            points: 100,
            isPublished: true,
            isTodayQuiz: false,
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          };
          const batch2 = (0, import_lite.writeBatch)(db);
          batch2.set((0, import_lite.doc)(db, "quiz_quizzes", cachedQuizId), promotedQuiz);
          const questionsList = cacheData.questions.map((q, idx) => {
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
            batch2.set((0, import_lite.doc)(db, "quiz_questions", qId), finalQ);
            return finalQ;
          });
          batch2.update((0, import_lite.doc)(db, "quiz_ai_cache", cacheId), { status: "completed" });
          await batch2.commit();
          return res.json({ quiz: promotedQuiz, questions: questionsList });
        }
      }
      const ai = new import_genai.GoogleGenAI({ apiKey });
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
      let generatedData = null;
      try {
        const aiResponse = await generateContentWithRetry(ai, {
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            temperature: 0.7,
            responseMimeType: "application/json"
          }
        }, 2, "ai_quiz");
        let rawText = aiResponse.text || "{}";
        generatedData = JSON.parse(rawText);
      } catch (aiErr) {
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
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      const batch = (0, import_lite.writeBatch)(db);
      batch.set((0, import_lite.doc)(db, "quiz_quizzes", randId), fallbackQuiz);
      const parsedQuestions = Array.isArray(generatedData.questions) ? generatedData.questions : [];
      const fallbackQuestions = parsedQuestions.map((q, idx) => {
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
        batch.set((0, import_lite.doc)(db, "quiz_questions", qId), finalQ);
        return finalQ;
      });
      await batch.commit();
      return res.json({ quiz: fallbackQuiz, questions: fallbackQuestions });
    } catch (error) {
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
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      const fallbackQs = getFallbackQuestions(targetSubjectId || "ai_mixed", "General", "Hindi").slice(0, 10).map((q, idx) => {
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
        const batch = (0, import_lite.writeBatch)(db);
        batch.set((0, import_lite.doc)(db, "quiz_quizzes", randId), fallbackQuiz);
        fallbackQs.forEach((q) => batch.set((0, import_lite.doc)(db, "quiz_questions", q.id), q));
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
    } catch (error) {
      console.error("Error generating extra questions route:", error);
      return res.status(500).json({ error: error.message || "Failed to generate additional questions." });
    }
  });
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
      let orderDoc = null;
      let orderId = "";
      if (awb) {
        const q = (0, import_lite.query)((0, import_lite.collection)(db, "orders"), (0, import_lite.where)("trackingNumber", "==", awb));
        const qSnap = await (0, import_lite.getDocs)(q);
        if (!qSnap.empty) {
          orderDoc = qSnap.docs[0];
          orderId = qSnap.docs[0].id;
        }
      }
      if (!orderDoc && shipmentId) {
        const q = (0, import_lite.query)((0, import_lite.collection)(db, "orders"), (0, import_lite.where)("shiprocketShipmentId", "==", String(shipmentId)));
        const qSnap = await (0, import_lite.getDocs)(q);
        if (!qSnap.empty) {
          orderDoc = qSnap.docs[0];
          orderId = qSnap.docs[0].id;
        }
      }
      if (orderDoc) {
        const statusMap = {
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
        const updates = {
          deliveryStatus: mappedStatus
        };
        if (mappedStatus === "Delivered") {
          updates.status = "Delivered";
        }
        await (0, import_lite.updateDoc)((0, import_lite.doc)(db, "orders", orderId), updates);
        console.log(`Successfully updated order ${orderId} status to ${mappedStatus}`);
        return res.json({ success: true, message: "Order status updated successfully" });
      }
      return res.status(404).json({ error: "Order not found" });
    } catch (error) {
      console.error("Webhook processing failed:", error);
      res.status(500).json({ error: error.message || "Webhook processing failed" });
    }
  });
  app.get("/invoice/:orderId", async (req, res) => {
    try {
      const { orderId } = req.params;
      const orderDoc = await getDoc((0, import_lite.doc)(db, "orders", orderId));
      if (!orderDoc.exists()) {
        return res.status(404).send("<h1 style='text-align:center;font-family:sans-serif;margin-top:100px;'>\u0906\u0926\u0947\u0936 \u0928\u0939\u0940\u0902 \u092E\u093F\u0932\u093E | Order Not Found</h1>");
      }
      const order = orderDoc.data();
      const companyName = "Hari Pathshala";
      const website = "haripathshala.online";
      const invoiceNumber = order.invoiceNumber || `HP-${orderId.slice(0, 6).toUpperCase()}`;
      let orderDate = "N/A";
      if (order.createdAt?.seconds) {
        orderDate = new Date(order.createdAt.seconds * 1e3).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "long",
          day: "numeric"
        });
      } else if (order.createdAt) {
        orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "long",
          day: "numeric"
        });
      }
      const subtotal = order.subtotal || order.totalAmount || 0;
      const shippingFee = order.shippingFee || 0;
      const totalAmount = order.totalAmount || order.total || 0;
      const itemsHtml = (order.items || []).map((item) => `
        <tr class="border-b border-orange-50/50">
          <td class="py-3 px-4 font-medium text-neutral-800 text-sm">${item.title || item.name || "Product"}</td>
          <td class="py-3 px-4 text-center text-neutral-600 text-sm">${item.productId || item.id || "N/A"}</td>
          <td class="py-3 px-4 text-right text-neutral-600 text-sm">\u20B9${item.price}</td>
          <td class="py-3 px-4 text-center text-neutral-600 text-sm">${item.quantity}</td>
          <td class="py-3 px-4 text-right font-bold text-neutral-800 text-sm">\u20B9${item.price * item.quantity}</td>
        </tr>
      `).join("");
      const invoiceUrl = `${req.protocol}://${req.get("host")}/invoice/${orderId}`;
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
            Jaipur, Rajasthan \u2013 303801, India
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
          ` : ""}
        </div>
      </div>

      <!-- Price breakdown -->
      <div class="w-full md:w-80 space-y-2 flex flex-col justify-center">
        <div class="flex justify-between text-neutral-500 text-sm font-medium">
          <span>Subtotal</span>
          <span>\u20B9${subtotal}</span>
        </div>
        <div class="flex justify-between text-neutral-500 text-sm font-medium">
          <span>Shipping Charges</span>
          <span class="${shippingFee === 0 ? "text-green-600 font-bold" : ""}">
            ${shippingFee === 0 ? "FREE" : `+ \u20B9${shippingFee}`}
          </span>
        </div>
        <div class="flex justify-between font-display font-bold text-lg text-neutral-800 pt-3 border-t border-orange-100 mt-2">
          <span>Grand Total</span>
          <span class="text-amber-600">\u20B9${totalAmount}</span>
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
    } catch (error) {
      console.error("Failed to render invoice:", error);
      res.status(500).send("<h1>Failed to render invoice</h1>");
    }
  });
  const recitationCache = /* @__PURE__ */ new Map();
  const adhyayanAICache = /* @__PURE__ */ new Map();
  app.post("/api/adhyayan/generate-recitation", async (req, res) => {
    try {
      const { text, verseId } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text is required for chanting recitation" });
      }
      const cacheKey = verseId || text;
      if (recitationCache.has(cacheKey)) {
        console.log(`[TTS Cache] Serving cached recitation for verseId=${verseId}`);
        return res.json({ audio: recitationCache.get(cacheKey) });
      }
      const apiKey = getServiceApiKey("ai_scripture");
      const ai = new import_genai.GoogleGenAI({ apiKey });
      console.log(`[TTS Recitation] Generating chanting for text...`);
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
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
      recitationCache.set(cacheKey, base64Audio);
      res.json({ audio: base64Audio });
    } catch (error) {
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
      const firestoreDocRef = (0, import_lite.doc)(db, "adhyayan_scripture_chapters", docId);
      let existingChapterData = null;
      try {
        const firestoreSnap = await (0, import_lite.getDoc)(firestoreDocRef);
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
      let versesInRange = [];
      if (existingChapterData && Array.isArray(existingChapterData.verses)) {
        versesInRange = existingChapterData.verses.filter((v) => v.number >= startVerse && v.number <= endVerse);
      }
      if (versesInRange.length === expectedLength || existingChapterData && existingChapterData.totalVersesCount && startVerse > existingChapterData.totalVersesCount) {
        return res.json({
          verses: versesInRange.sort((a, b) => a.number - b.number),
          totalVersesCount: existingChapterData.totalVersesCount || 47
        });
      }
      console.log(`[Chapter Verses] Generating verses ${startVerse} to ${endVerse} for ${docId}...`);
      const apiKey = getServiceApiKey("ai_scripture");
      const ai = new import_genai.GoogleGenAI({ apiKey });
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
        model: "gemini-3.5-flash",
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
      let generatedData = null;
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
      let allVerses = existingChapterData && Array.isArray(existingChapterData.verses) ? [...existingChapterData.verses] : [];
      for (const newV of generatedData.verses) {
        const idx = allVerses.findIndex((v) => v.number === newV.number);
        if (idx >= 0) {
          allVerses[idx] = newV;
        } else {
          allVerses.push(newV);
        }
      }
      allVerses.sort((a, b) => a.number - b.number);
      const totalVersesCount = generatedData.totalVersesCount || existingChapterData?.totalVersesCount || 47;
      try {
        await (0, import_lite.setDoc)(firestoreDocRef, {
          subjectId,
          chapterId,
          verses: allVerses,
          totalVersesCount,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      } catch (fsErr) {
        console.warn("[Chapter Verses DB Warning] Failed to write updated verses:", fsErr);
      }
      const finalVersesInRange = allVerses.filter((v) => v.number >= startVerse && v.number <= endVerse);
      res.json({
        verses: finalVersesInRange,
        totalVersesCount
      });
    } catch (error) {
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
      if (adhyayanAICache.has(docId)) {
        console.log(`[AI Content Cache] Serving in-memory cached content for ${docId}`);
        return res.json({ content: adhyayanAICache.get(docId) });
      }
      try {
        const firestoreDocRef = (0, import_lite.doc)(db, "adhyayan_ai_content", docId);
        const firestoreSnap = await (0, import_lite.getDoc)(firestoreDocRef);
        if (firestoreSnap.exists()) {
          const data = firestoreSnap.data();
          console.log(`[AI Content DB] Serving Firestore cached content for ${docId}`);
          adhyayanAICache.set(docId, data.content);
          return res.json({ content: data.content });
        }
      } catch (fsErr) {
        console.warn("[AI Content DB Warning] Firestore read error:", fsErr);
      }
      const apiKey = getServiceApiKey("ai_scripture");
      const ai = new import_genai.GoogleGenAI({ apiKey });
      let prompt = "";
      let responseMimeType = "text/plain";
      let responseSchema = void 0;
      if (contentType === "summary") {
        prompt = `You are a highly revered Vedic scripture scholar and spiritual guide. Analyze this Sanskrit Shloka from ${subjectId} (Chapter: ${chapterId}, Verse: ${verseId}):
Original: "${verseText}"
Hindi Translation: "${hindiMeaning}"

Write a highly detailed, visually clean, and deeply inspiring spiritual explanation and summary of this verse in Hindi.
Divide your response into these sections:
1. **\u0917\u0942\u0922\u093C \u092D\u093E\u0935\u093E\u0930\u094D\u0925 (Inner Spiritual Meaning)**: Explain the subtle depth of the verse.
2. **\u0935\u094D\u092F\u093E\u0935\u0939\u093E\u0930\u093F\u0915 \u091C\u0940\u0935\u0928 \u0938\u0942\u0924\u094D\u0930 (Daily Life Lessons)**: Provide 3 concrete, practical life lessons for modern youth and families.
3. **\u0938\u0926\u094D\u0917\u0941\u0930\u0941 \u0938\u0902\u0926\u0947\u0936 (Divine Guru Message)**: A direct personal blessing/motivational quote inspired by the verse.

Output exclusively in gorgeous, readable Markdown (using bold headers, lists, and quotes). Never rewrite or mix scriptures.`;
      } else if (contentType === "flashcards") {
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
      } else if (contentType === "mindmap") {
        prompt = `Analyze this Sanskrit Shloka and translation:
Original: "${verseText}"
Translation: "${hindiMeaning}"

Extract exactly 4 core philosophical concepts or spiritual pillars taught in this verse. For each concept, provide:
1. concept: A short, concise title in Hindi (1-3 words) e.g., "\u0928\u093F\u0937\u094D\u0915\u093E\u092E \u0915\u0930\u094D\u092E"
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
      } else if (contentType === "quiz") {
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
        model: "gemini-3.5-flash",
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
      try {
        const firestoreDocRef = (0, import_lite.doc)(db, "adhyayan_ai_content", docId);
        (0, import_lite.setDoc)(firestoreDocRef, {
          subjectId,
          chapterId,
          verseId,
          contentType,
          content: generatedContent,
          generatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }).catch((err) => console.warn("[AI Content DB Warning] Failed to write generated content:", err));
      } catch (err) {
        console.warn("[AI Content DB Warning] Failed to initiate database write:", err);
      }
      adhyayanAICache.set(docId, generatedContent);
      res.json({ content: generatedContent });
    } catch (error) {
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
      const results = [];
      const collRef = (0, import_lite.collection)(db, "adhyayan_scripture_chapters");
      const q = (0, import_lite.query)(collRef, (0, import_lite.where)("subjectId", "==", subjectId));
      try {
        const querySnap = await (0, import_lite.getDocs)(q);
        querySnap.forEach((snapDoc) => {
          const data = snapDoc.data();
          if (Array.isArray(data.verses)) {
            for (const v of data.verses) {
              const numStr = String(v.number);
              const dottedNumStr = `${data.chapterId.replace("chapter_", "")}.${v.number}`;
              if (numStr === normalizedQuery || dottedNumStr === normalizedQuery || v.original?.toLowerCase().includes(normalizedQuery) || v.wordMeaning?.toLowerCase().includes(normalizedQuery) || v.hindi?.toLowerCase().includes(normalizedQuery) || v.english?.toLowerCase().includes(normalizedQuery) || v.explanation?.toLowerCase().includes(normalizedQuery)) {
                results.push({
                  chapterId: data.chapterId,
                  chapterNumber: Number(data.chapterId.replace("chapter_", "")),
                  verse: v
                });
              }
            }
          }
        });
      } catch (dbErr) {
        console.warn("[Search DB Warning] Firestore collection search failed:", dbErr);
      }
      results.sort((a, b) => {
        if (a.chapterNumber !== b.chapterNumber) {
          return a.chapterNumber - b.chapterNumber;
        }
        return a.verse.number - b.verse.number;
      });
      res.json({ results: results.slice(0, 30) });
    } catch (error) {
      console.error("[Search Error] Failed to search scripture verses:", error);
      res.status(500).json({ error: "Failed to search verses: " + error.message });
    }
  });
  app.post("/api/log-error", (req, res) => {
    import_fs.default.writeFileSync("client-error.log", JSON.stringify(req.body));
    res.json({ ok: true });
  });
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    seedDohasIfEmpty().catch((err) => console.error("Error during doha pre-seeding:", err));
  });
}
async function seedDohasIfEmpty() {
  try {
    const dohasSnap = await (0, import_lite.getDocs)((0, import_lite.collection)(db, "dohas"));
    if (!dohasSnap.empty) {
      console.log("[Doha Seeder] Dohas are already seeded.");
      return;
    }
    console.log("[Doha Seeder] Seeding beautiful Ramcharitmanas Dohas to database...");
    const famousDohas = [
      {
        id: "doha_1",
        text: "\u092E\u0902\u0917\u0932 \u092D\u0935\u0928 \u0905\u092E\u0902\u0917\u0932 \u0939\u093E\u0930\u0940\u0964\n\u0926\u094D\u0930\u0935\u0939\u0941 \u0938\u0941\u0926\u0938\u0930\u0925 \u0905\u091C\u093F\u0930 \u092C\u093F\u0939\u093E\u0930\u0940\u0965",
        meaning: "May the home of blessings and the destroyer of all evils, Lord Rama, who plays in the courtyard of King Dasaratha, be pleased with me and bless me.",
        source: "Ramcharitmanas",
        kand: "Bal Kand"
      },
      {
        id: "doha_2",
        text: "\u092C\u0902\u0926\u0909 \u0917\u0941\u0930\u0941 \u092A\u0926 \u092A\u0926\u0941\u092E \u092A\u0930\u093E\u0917\u093E\u0964\n\u0938\u0941\u0930\u0941\u091A\u093F \u0938\u0941\u092C\u093E\u0938 \u0938\u0930\u0938 \u0905\u0928\u0941\u0930\u093E\u0917\u093E\u0965",
        meaning: "I bow to the lotus feet of the Guru, which are full of spiritual fragrance, sweet taste, and divine love.",
        source: "Ramcharitmanas",
        kand: "Bal Kand"
      },
      {
        id: "doha_3",
        text: "\u0939\u0930\u093F \u0905\u0928\u0902\u0924 \u0939\u0930\u093F \u0915\u0925\u093E \u0905\u0928\u0902\u0924\u093E\u0964\n\u0915\u0939\u0939\u093F\u0902 \u0938\u0941\u0928\u0939\u093F\u0902 \u092C\u0939\u0941\u092C\u093F\u0927\u093F \u0938\u092C \u0938\u0902\u0924\u093E\u0965",
        meaning: "God is infinite, and His divine stories are infinite. Saints sing and hear them in various ways.",
        source: "Ramcharitmanas",
        kand: "Bal Kand"
      },
      {
        id: "doha_4",
        text: "\u0927\u0940\u0930\u091C \u0927\u0930\u092E \u092E\u093F\u0924\u094D\u0930 \u0905\u0930\u0941 \u0928\u093E\u0930\u0940\u0964\n\u0906\u092A\u0926 \u0915\u093E\u0932 \u092A\u0930\u093F\u0916\u093F\u0905\u0939\u093F\u0902 \u091A\u093E\u0930\u0940\u0965",
        meaning: "Patience, righteous conduct, a true friend, and a spouse\u2014these four are tested only during times of adversity.",
        source: "Ramcharitmanas",
        kand: "Aranya Kand"
      },
      {
        id: "doha_5",
        text: "\u0939\u094B\u0907\u0939\u093F \u0938\u094B\u0908 \u091C\u094B \u0930\u093E\u092E \u0930\u091A\u093F \u0930\u093E\u0916\u093E\u0964\n\u0915\u094B \u0915\u0930\u093F \u0924\u0930\u0915 \u092C\u095D\u093E\u0935\u0948 \u0938\u093E\u0916\u093E\u0965",
        meaning: "Only that will happen which Lord Rama has destined. Why should anyone expand arguments and doubts?",
        source: "Ramcharitmanas",
        kand: "Bal Kand"
      },
      {
        id: "doha_6",
        text: "\u0938\u093F\u092F \u0930\u093E\u092E \u092E\u092F \u0938\u092C \u091C\u0917 \u091C\u093E\u0928\u0940\u0964\n\u0915\u0930\u0939\u0941\u0902 \u092A\u094D\u0930\u0928\u093E\u092E \u091C\u094B\u0930\u093F \u091C\u0941\u0917 \u092A\u093E\u0928\u0940\u0965",
        meaning: "Knowing that the entire universe is filled with the divine presence of Sita and Rama, I bow to all with folded hands.",
        source: "Ramcharitmanas",
        kand: "Bal Kand"
      },
      {
        id: "doha_7",
        text: "\u092C\u093F\u0928\u093E \u0938\u0924\u0938\u0902\u0917 \u092C\u093F\u092C\u0947\u0915 \u0928 \u0939\u094B\u0908\u0964\n\u0930\u093E\u092E \u0915\u0943\u092A\u093E \u092C\u093F\u0928\u0941 \u0938\u0941\u0932\u092D \u0928 \u0938\u094B\u0908\u0965",
        meaning: "Without the company of saints, wisdom cannot arise; and such association is not obtainable without the grace of Lord Rama.",
        source: "Ramcharitmanas",
        kand: "Bal Kand"
      },
      {
        id: "doha_8",
        text: "\u091C\u093E\u0915\u0940 \u0930\u0939\u0940 \u092D\u093E\u0935\u0928\u093E \u091C\u0948\u0938\u0940\u0964\n\u092A\u094D\u0930\u092D\u0941 \u092E\u0942\u0930\u0924\u093F \u0926\u0947\u0916\u0940 \u0924\u093F\u0928 \u0924\u0948\u0938\u0940\u0965",
        meaning: "Whatever sentiment or devotion one held in their heart, they perceived the Lord's divine form in that exact likeness.",
        source: "Ramcharitmanas",
        kand: "Bal Kand"
      }
    ];
    const batch = (0, import_lite.writeBatch)(db);
    famousDohas.forEach((doha) => {
      const docRef = (0, import_lite.doc)(db, "dohas", doha.id);
      batch.set(docRef, doha);
    });
    await batch.commit();
    console.log("[Doha Seeder] 8 high-quality Ramcharitmanas Dohas successfully seeded.");
  } catch (err) {
    console.error("[Doha Seeder Error] Failed to seed Dohas:", err);
  }
}
startServer();
async function generateNextQuizToCache(userId, subjectId) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key is missing");
  const historyRef = (0, import_lite.collection)(db, "userStats", userId, "quiz_history");
  const historySnap = await (0, import_lite.getDocs)(historyRef);
  const completedQuizIds = [];
  let totalScore = 0;
  let totalCompleted = 0;
  historySnap.forEach((docSnap) => {
    const data = docSnap.data();
    totalCompleted++;
    totalScore += data.percentage || 0;
    if (data.quizId) completedQuizIds.push(data.quizId);
  });
  const recentQuizIds = completedQuizIds.slice(0, 15);
  const answeredQuestionTexts = [];
  for (const qId of recentQuizIds) {
    const questionsQuery = (0, import_lite.query)((0, import_lite.collection)(db, "quiz_questions"), (0, import_lite.where)("quizId", "==", qId));
    const questionsSnap = await (0, import_lite.getDocs)(questionsQuery);
    questionsSnap.forEach((d) => {
      const txt = d.data().text || d.data().question;
      if (txt) answeredQuestionTexts.push(txt);
    });
  }
  const lowScoringHistory = historySnap.docs.map((d) => d.data()).filter((h) => h.percentage < 70);
  const lowScoringSubjects = lowScoringHistory.map((h) => h.subjectName || h.quizName);
  let calculatedDifficulty = "Intermediate";
  if (totalCompleted > 0) {
    const avgAccuracy = totalScore / totalCompleted;
    if (avgAccuracy >= 85) {
      calculatedDifficulty = "Advanced";
    } else if (avgAccuracy < 60) {
      calculatedDifficulty = "Beginner";
    }
  }
  const ai = new import_genai.GoogleGenAI({ apiKey });
  let subjectDetail = "";
  if (subjectId === "ai_mixed") {
    subjectDetail = "a balanced mix of subjects from Sanatan Dharma (Ramcharitmanas, Bhagavad Gita, Hanuman Chalisa, Mahabharat, Vedas, Upanishads, Hindu Dharma, Panchang, Festivals, Saints, Temples)";
  } else {
    const subSnap = await getDoc((0, import_lite.doc)(db, "quiz_subjects", subjectId));
    const subName = subSnap.exists() ? subSnap.data().name || subjectId : subjectId;
    subjectDetail = `specifically on "${subName}"`;
  }
  const prompt = `Generate exactly 10 high-quality, authentic spiritual multiple-choice questions (MCQ or True/False) in highly respectful and clear Hindi language.
Target Subject: ${subjectDetail}.
Adapted Difficulty Level: ${calculatedDifficulty}.

PERSONALIZED LEARNING ADAPTATIONS:
- EXCLUDE the following questions which the user has already answered (avoid duplicates/repetition):
${answeredQuestionTexts.map((t) => `- ${t}`).join("\n")}

- REMEDIAL PRACTICE FOCUS:
${lowScoringSubjects.length > 0 ? `The user recently struggled with the following topics: ${lowScoringSubjects.join(", ")}. Please include 2-3 extra practice questions on these concepts with helpful, encouraging explanations to aid learning.` : "Ensure general balanced distribution."}

Each question should be spiritually accurate and challenging according to the scriptures.
Return ONLY a valid JSON object matching this exact schema:
{
  "quiz": {
    "name": "${subjectId === "ai_mixed" ? "AI Mixed Wisdom Challenge" : "AI Scripture Practice"}",
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
  let validatedQuestions = [];
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
      }, 2, "ai_quiz");
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
    } catch (err) {
      console.warn(`[AI Quiz Cache Warning] Attempt ${attempts} failed:`, err?.message);
      const isQuotaExceeded = err?.message?.toLowerCase().includes("quota") || err?.message?.toLowerCase().includes("exceeded your current quota") || err?.message?.toLowerCase().includes("limit: 20") || err?.message?.toLowerCase().includes("billing");
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
  while (validatedQuestions.length < 10) {
    const clone = { ...validatedQuestions[0], text: validatedQuestions[0].text + " (Practice)" };
    validatedQuestions.push(clone);
  }
  const cacheId = `${userId}_${subjectId}`;
  const nextQuizId = `ai_cache_${subjectId}_${Date.now()}`;
  await (0, import_lite.setDoc)((0, import_lite.doc)(db, "quiz_ai_cache", cacheId), {
    userId,
    quizId: nextQuizId,
    subjectId,
    questions: validatedQuestions,
    quizName: subjectId === "ai_mixed" ? "AI Mixed Wisdom Challenge" : "AI Scripture Practice",
    quizDescription: "An intelligent spiritual practice session custom-tailored to your learning progress.",
    difficulty: calculatedDifficulty,
    generatedTime: (/* @__PURE__ */ new Date()).toISOString(),
    status: "ready"
  });
}
async function generateExtraQuestions(quizId, subjectId, quizName, count, existingTexts) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return [];
  try {
    const ai = new import_genai.GoogleGenAI({ apiKey });
    const prompt = `Generate exactly ${count} high-quality, authentic spiritual multiple-choice questions (MCQ or True/False) in highly respectful and clear Hindi language to supplement an existing quiz named "${quizName}" on subject "${subjectId}".
EXCLUDE the following questions which are already in this quiz:
${existingTexts.map((t) => `- ${t}`).join("\n")}

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
    let validatedQuestions = [];
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
        }, 2, "ai_quiz");
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
      } catch (aiErr) {
        console.warn(`[AI Extra Qs Warning] Attempt ${attempts} failed:`, aiErr?.message);
        const isQuotaExceeded = aiErr?.message?.toLowerCase().includes("quota") || aiErr?.message?.toLowerCase().includes("exceeded your current quota") || aiErr?.message?.toLowerCase().includes("limit: 20") || aiErr?.message?.toLowerCase().includes("billing");
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
    const batch = (0, import_lite.writeBatch)(db);
    const result = validatedQuestions.map((q, idx) => {
      const qId = `q_extra_${quizId}_${Date.now()}_${idx}`;
      const finalQ = {
        id: qId,
        quizId,
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
      batch.set((0, import_lite.doc)(db, "quiz_questions", qId), finalQ);
      return finalQ;
    });
    await batch.commit();
    return result;
  } catch (err) {
    console.error("Failed to generate extra questions:", err);
    return [];
  }
}
//# sourceMappingURL=server.cjs.map
