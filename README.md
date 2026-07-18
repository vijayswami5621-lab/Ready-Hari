# Hari Pathshala – Production Ready Developer Guide & Android Studio Export

Hari Pathshala is a high-performance, full-stack spiritual ecosystem comprised of an educational learning platform (**Adhyayan**), a specialized e-commerce store with integrated logistics (**Spiritual Store**), an AI spiritual guide (**AI Guru**), custom quiz engines, and an advanced **Admin CMS**.

This project is built using **React 19, TypeScript, and Vite** on the frontend, and is fully optimized for **Capacitor Android** to run as a native mobile application.

---

## 1. PROJECT STRUCTURE

The codebase is organized into a clean, professional, and modular structure matching industry-standard patterns:

```text
hari-pathshala/
├── android/                         # Capacitor-generated Native Android Studio Project
├── public/                          # Static assets, Web App Manifest, SEO sitemap
├── src/                             # React Frontend Source Code
│   ├── components/                  # Shared/Reusable UI components
│   ├── contexts/                    # Shared context providers (e.g. AppSettings)
│   ├── firebase/                    # Firebase configuration
│   │     └── config.ts              # Initialization of Auth, Firestore, and Analytics
│   ├── hooks/                       # Custom utility React hooks
│   ├── layouts/                     # Page wrappers (e.g., BottomNavigation, AdminLayout)
│   ├── pages/                       # Feature pages (auth, adhyayan, store, quiz, admin)
│   ├── routes/                      # Route definitions and page routers
│   ├── services/                    # Shared core business logic/API wrappers
│   │     ├── apiService.ts          # Server API endpoints (Razorpay, Shiprocket, AI Guru)
│   │     ├── naamJapService.ts      # Chanting mechanics, offline tracking, and leaderboards
│   │     ├── panchangService.ts     # Ephemeris-based lunar calculations
│   │     └── razorpayService.ts     # Frontend Razorpay Checkout script loaders
│   ├── store/                       # Zustand store modules for global state
│   ├── styles/                      # Core styles and Tailwind configurations
│   ├── utils/                       # Helper functions and math utilities
│   ├── App.tsx                      # Root Application Component
│   ├── index.css                    # Entry point for global CSS using Tailwind
│   └── main.tsx                     # React application entry point
├── assets/                          # App Icons and Splash Screen templates
├── server.ts                        # Secure Full-Stack Express Server (Proxy backend)
├── capacitor.config.ts              # Capacitor build & plugin configuration
├── package.json                     # Dependency manifests & NPM scripts
└── vite.config.ts                   # Vite compilation and PWA plugin setup
```

---

## 2. PRODUCTION BUILD COMMANDS

To build the application for local testing, browser previews, or production hosting, run the following commands sequentially:

```bash
# 1. Install all required dependencies
npm install

# 2. Build the production React frontend & compile the server CJS bundle
npm run build

# 3. Synchronize Web Assets and Plugins to the Native Android Platform
npx cap sync android

# 4. Open the Project in Android Studio
npx cap open android
```

---

## 3. ANDROID BUILD PROCESS

Once you have synced the web assets (`npx cap sync android`) and opened the project in Android Studio, follow these steps to build the APK/AAB:

### A. Gradle Synchronization
When Android Studio launches, it will automatically initiate a Gradle sync using the pre-configured wrappers. Wait for the sync to complete. If any plugins need updating, Android Studio will guide you through its UI.

### B. Building a Debug APK
1. In Android Studio, select **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
2. Once the build finishes, click **Locate** in the notification bubble to retrieve `app-debug.apk`.
3. This is ready for installation on any emulator or physical Android device.

### C. Building a Release APK / App Bundle (AAB)
1. Select **Build > Generate Signed Bundle / APK...**
2. Choose **Android App Bundle** (preferred for Play Store deployment) or **APK**, then click **Next**.
3. Create a new Keystore or select your existing release signing key.
4. Set the build variant to `release`.
5. Click **Finish**. Android Studio will compile, optimize, and sign the release package.

---

## 4. BACKEND ARCHITECTURE & SECURITY

To guarantee security, **Hari Pathshala** uses a strict separation of responsibilities between client and server layers.

### Frontend Responsibilities
- User Interface layout, routing, forms, and animation (`motion`).
- Realtime Firestore database synchronization (updates, counts, leaderboard).
- Secure client-side state management using **Zustand** stores.

### Backend / Server Responsibilities (`server.ts`)
- **Razorpay order creation**: Secures the payment sequence using secret credentials.
- **Razorpay verification**: Cryptographically verifies the payment signature using SHA-256 webhooks or direct backend checks.
- **Shiprocket Integration**: Handles Shiprocket authentication, serviceability checks, automated shipment creation, and tracking queries using protected API keys.
- **AI Guru Interaction**: Proxies Gemini LLM requests server-side so that API keys are never exposed in client source code.

---

## 5. ENVIRONMENT VARIABLES

The environment utilizes standard `.env` configuration. Public variables are prefixed with `VITE_` to compile cleanly into the frontend code. Secret parameters must **never** be prefix-exposed.

### Client-Safe Variables (`.env` or `.env.example`)
```env
# Firebase Public Web Configurations
VITE_FIREBASE_API_KEY=AIzaSyBMlQAwq...
VITE_FIREBASE_AUTH_DOMAIN=official-hari.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=official-hari
VITE_FIREBASE_STORAGE_BUCKET=official-hari.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=320780984737
VITE_FIREBASE_APP_ID=1:320780984737:android:26d892ed88c7f4122cabe0

# Image Hosting & Payment Client Tokens
VITE_IMGBB_API_KEY=your_imgbb_key
VITE_RAZORPAY_KEY=rzp_live_T91BWZao0CJ2Bi
```

### Server-Only Secret Variables (Stored securely on Cloud Run / Backend host environment)
```env
# Deepmind / Google Gemini API Engine
GEMINI_API_KEY=your_gemini_api_key

# Payment & Carrier Logistics Secret Tokens
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
SHIPROCKET_EMAIL=swamiajay9783@gmail.com
SHIPROCKET_PASSWORD=your_shiprocket_secure_password
```

---

## 6. FIRESTORE DATABASE COLLECTIONS

The application relies on highly organized Firestore collections. They are synchronized in real-time or updated directly by server events:

- `users`: User metadata, profile pictures, and active role configurations (such as `isAdmin`).
- `products`: Spiritual store items, categories, pricing, stock levels, and detail descriptions.
- `orders`: E-commerce orders linked to a `uid` with line items, shipment IDs, and receipt markers.
- `payments`: Historic payment logs and transaction state metadata.
- `shipments`: Courier, pricing, and packaging updates.
- `naamJap`: Realtime spiritual chanting counts, streaks, and timestamps.
- `quiz_global_leaderboard`: High-performance global leaderboard compiling chanting and quiz completion rankings.
- `quotes`: Spiritual quotes of the day.
- `videos`: Course and scripture-related video content.
- `categories`: Spiritual store grouping classifications.
- `settings`: Global application configurations (e.g. `/settings/payment` or `/settings/shipping`).

---

## 7. FINAL QUALITY ASSURANCE MATRIX

Before shipping, the code undergoes high-standards quality checking:
- `npm run build` succeeds cleanly.
- `npm run lint` (`tsc --noEmit`) validates successfully without any TypeScript compilation errors.
- Web assets and plugins sync perfectly (`npx cap sync android`) into the native package.
- All secret API keys are kept strictly out of frontend source code and managed entirely on the backend server (`server.ts`).
