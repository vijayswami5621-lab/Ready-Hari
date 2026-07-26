import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { db } from "../firebase/config";
import { doc, setDoc } from "firebase/firestore";
import { Capacitor } from "@capacitor/core";

const navigate = (path: string) => {
  if ((window as any).router) {
    (window as any).router.navigate(path);
  } else {
    window.location.href = path;
  }
};

export function usePushNotifications() {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user || !user.uid) return;

    const initializeNotifications = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          // Native Android / iOS Push Notifications
          const { PushNotifications } = await import("@capacitor/push-notifications");

          let permStatus = await PushNotifications.checkPermissions();
          
          if (permStatus.receive === "prompt") {
            permStatus = await PushNotifications.requestPermissions();
          }

          if (permStatus.receive === "granted") {
            // Register with Apple / Google to receive push via APNS/FCM
            await PushNotifications.register();

            // Handle successful registration and get the FCM Token
            await PushNotifications.addListener("registration", async (token) => {
              console.log("[Native Push] Token successfully registered: ", token.value);
              try {
                // Save to dedicated subcollection users/{userId}/fcm_tokens/{tokenId}
                const tokenRef = doc(db, "users", user.uid, "fcm_tokens", token.value);
                await setDoc(
                  tokenRef,
                  {
                    token: token.value,
                    platform: "android",
                    lastActive: new Date(),
                    updatedAt: new Date(),
                  },
                  { merge: true }
                );
                
                // Also send to backend to ensure server registry has it
                await fetch("/api/notifications/register-token", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    userId: user.uid,
                    token: token.value,
                    platform: "android",
                  }),
                }).catch((e) => console.warn("[FCM API Register Sync Failed]:", e.message));

                console.log("[Native Push] Saved FCM Token in Firestore & Sync Endpoint");
              } catch (dbErr: any) {
                console.error("[Native Push] Error saving token to Firestore:", dbErr.message);
              }
            });

            await PushNotifications.addListener("registrationError", (error) => {
              console.error("[Native Push Error] Registration failed: ", error);
            });

            // Foreground Notification Received
            await PushNotifications.addListener(
              "pushNotificationReceived",
              (notification) => {
                console.log("[Native Push] Foreground notification received: ", notification);
                // The presentation option is already alert, sound, badge, which will natively show it!
              }
            );

            // Handle Deep Linking / Click Action
            await PushNotifications.addListener(
              "pushNotificationActionPerformed",
              (action) => {
                console.log("[Native Push Click] Notification clicked: ", action);
                const data = action.notification.data;
                const link = data?.link || data?.click_action;
                if (link) {
                  console.log("[Native Push Deep Link] Navigating to: ", link);
                  navigate(link);
                }
              }
            );
          } else {
            console.warn("[Native Push] Permission denied for push notifications.");
          }
        } else {
          // Web Browser Push Notifications via Firebase Cloud Messaging
          const { getMessaging, getToken, onMessage } = await import("firebase/messaging");
          const { app } = await import("../firebase/config");

          // Only proceed if browser supports push notifications
          if ("Notification" in window && "serviceWorker" in navigator) {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
              const messaging = getMessaging(app);

              // Get web push token
              const tokenValue = await getToken(messaging, {
                // Standard FCM public VAPID key or auto-fallback
                vapidKey: "BFL0O_0YQzW4H_S19MhW-f18b3YVp8D4p_16M2U7J39C6BwL-xR8yA",
              }).catch(async (e) => {
                console.warn("[Web Push] Failed to fetch token using VAPID key. Retrying with default registration...", e.message);
                return await getToken(messaging);
              });

              if (tokenValue) {
                console.log("[Web Push] Got token: ", tokenValue);
                const tokenRef = doc(db, "users", user.uid, "fcm_tokens", tokenValue);
                await setDoc(
                  tokenRef,
                  {
                    token: tokenValue,
                    platform: "web",
                    lastActive: new Date(),
                    updatedAt: new Date(),
                  },
                  { merge: true }
                );

                // Send to backend registry as well
                await fetch("/api/notifications/register-token", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    userId: user.uid,
                    token: tokenValue,
                    platform: "web",
                  }),
                }).catch((e) => console.warn("[FCM API Register Web Sync Failed]:", e.message));

                console.log("[Web Push] Saved FCM Token to Firestore and registered on backend");

                // Handle Foreground messaging
                onMessage(messaging, (payload) => {
                  console.log("[Web Push] Foreground notification received: ", payload);
                  
                  // Show native browser notification in foreground
                  const notificationTitle = payload.notification?.title || "Hari Pathshala";
                  const notificationOptions = {
                    body: payload.notification?.body || "",
                    icon: "/logo.png",
                    badge: "/logo.png",
                    data: payload.data || {},
                  };

                  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.ready.then((reg) => {
                      reg.showNotification(notificationTitle, notificationOptions);
                    });
                  } else {
                    new Notification(notificationTitle, notificationOptions);
                  }
                });
              }
            } else {
              console.warn("[Web Push] Permission denied for push notifications.");
            }
          }
        }
      } catch (err: any) {
        console.error("[Push Notifications Initialization Error]:", err.message);
      }
    };

    initializeNotifications();
  }, [user, navigate]);
}
