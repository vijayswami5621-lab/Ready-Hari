# Hari Pathshala

Hari Pathshala is a comprehensive spiritual ecosystem comprising a learning platform, e-commerce store, AI spiritual guru, and an admin CMS.

## Features
- **User Authentication**: Secure signup and login via Firebase Auth.
- **Home Dashboard**: Daily quotes, mini panchang, and latest updates.
- **Adhyayan (Learning)**: Browse and watch spiritual courses and videos.
- **Spiritual Store**: Shop for authentic Puja items, Rudraksha, Malas, and idols. Features cart and checkout functionality.
- **AI Guru**: Ask spiritual questions and get answers.
- **Profile & Settings**: Manage user profile, order history, and dark mode preferences.
- **Admin CMS**: Fully functional admin dashboard to manage users, quotes, live sessions, blogs, products, orders, courses, media, coupons, and push notifications.

## Technologies
- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide Icons, Motion (Framer Motion)
- **State Management**: Zustand, React Query
- **Routing**: React Router DOM
- **Backend & Database**: Firebase (Auth, Firestore)
- **File Uploads**: ImgBB
- **PWA & SEO**: Vite PWA plugin, React Helmet Async

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- Firebase Project
- ImgBB Account (for image uploads)

### Environment Variables
Create a `.env` file in the root directory and add the following:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_IMGBB_API_KEY=your_imgbb_api_key
```

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Build for production: `npm run build`

## Architecture & Folder Structure
- `src/components`: Reusable UI components.
- `src/layouts`: Layout wrappers (e.g., BottomNavigation, AdminLayout).
- `src/pages`: Feature-based pages (auth, home, admin, store, etc.).
- `src/store`: Zustand stores for global state.
- `src/firebase`: Firebase configuration and initialization.
- `src/routes`: Application routing setup.
- `public`: Static assets, manifest, sitemap, and robots.txt for PWA/SEO.

## PWA Capabilities
This application is fully PWA-ready, meaning it can be installed on Android, iOS, and Desktop devices directly from the browser, offering an app-like experience with offline capabilities.

## Admin Panel Access
Users with `isAdmin: true` in their Firestore user document will see the Admin Panel accessible via the Profile screen or by directly visiting `/admin`.

## Deployment
This app can be easily deployed to modern static hosting services like Vercel, Netlify, or Firebase Hosting. Simply configure the build command to `npm run build` and publish the `dist` directory.
