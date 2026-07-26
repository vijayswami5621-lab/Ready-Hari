importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBMlQAwq-VxiP0LhXM08FJsHmf_kjRDfVY",
  authDomain: "official-hari.firebaseapp.com",
  projectId: "official-hari",
  storageBucket: "official-hari.firebasestorage.app",
  messagingSenderId: "320780984737",
  appId: "1:320780984737:android:26d892ed88c7f4122cabe0"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Hari Pathshala';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: '/logo.png',
    badge: '/logo.png',
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link;
  if (link) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === link && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(link);
        }
      })
    );
  }
});
