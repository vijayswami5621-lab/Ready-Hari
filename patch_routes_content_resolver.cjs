const fs = require('fs');
const path = require('path');

const routesPath = path.join(__dirname, 'src/routes/index.tsx');
let content = fs.readFileSync(routesPath, 'utf8');

if (!content.includes('import { ContentResolver }')) {
  content = content.replace("import { NotFoundScreen } from '../pages/misc/NotFoundScreen';", "import { NotFoundScreen } from '../pages/misc/NotFoundScreen';\nimport { ContentResolver } from '../pages/misc/ContentResolver';");
}

if (!content.includes("{ path: '/open/:id', element: <ContentResolver /> }")) {
  content = content.replace("{ path: '*', element: <NotFoundScreen /> },", "{ path: '/open/:id', element: <ContentResolver /> },\n  { path: '*', element: <NotFoundScreen /> },");
}

// Add Clipboard checking in AppRouter
if (!content.includes('import { Clipboard } from "@capacitor/clipboard";')) {
  content = content.replace("import { Capacitor } from '@capacitor/core';", "import { Capacitor } from '@capacitor/core';\nimport { Clipboard } from '@capacitor/clipboard';");
}

const clipboardCheck = `
    const checkClipboardForContentId = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          const { type, value } = await Clipboard.read();
          if (type === 'text/plain' && value) {
            const match = value.match(/Content ID:\\s*([A-Za-z0-9_-]{10,30})/i);
            if (match && match[1]) {
              const docId = match[1];
              // To prevent infinite loop if they keep the clipboard same, we should use a session storage flag
              const lastOpened = sessionStorage.getItem('lastOpenedDocId');
              if (lastOpened !== docId) {
                sessionStorage.setItem('lastOpenedDocId', docId);
                router.navigate('/open/' + docId);
              }
            }
          }
        }
      } catch (e) {
        console.error('Clipboard read error', e);
      }
    };
    checkClipboardForContentId();
    
    // Also listen to app state changes to check clipboard when resuming
    if (Capacitor.isNativePlatform()) {
      CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          checkClipboardForContentId();
        }
      });
    }
`;

if (!content.includes('checkClipboardForContentId')) {
  content = content.replace("CapacitorApp.addListener('appUrlOpen', (data) => {", clipboardCheck + "\n      CapacitorApp.addListener('appUrlOpen', (data) => {");
}

// Add deep link doc id fallback
const deepLinkFallback = `
          const url = new URL(data.url);
          if (url.searchParams.has('id')) {
            router.navigate('/open/' + url.searchParams.get('id'));
          } else if (url.pathname && url.pathname.length > 5 && !url.pathname.includes('/')) {
             // likely just an ID in the URL root
             router.navigate('/open/' + url.pathname.replace('/', ''));
          } else if (url.pathname) {
`;

if (content.includes('const url = new URL(data.url);\n          if (url.pathname) {')) {
  content = content.replace("const url = new URL(data.url);\n          if (url.pathname) {", deepLinkFallback);
}

fs.writeFileSync(routesPath, content);
console.log("Patched routes/index.tsx");
