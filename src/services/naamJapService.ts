import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, writeBatch } from "firebase/firestore";
import { db } from "../firebase/config";

export interface NaamJapDoc {
  uid: string;
  userName: string;
  profileImage: string;

  todayCount: number;
  weeklyCount: number;
  monthlyCount: number;
  yearlyCount: number;
  lifetimeCount: number;

  todayMala: number;
  weeklyMala: number;
  monthlyMala: number;
  yearlyMala: number;
  lifetimeMala: number;

  currentStreak: number;
  longestStreak: number;

  lastTapAt: any;
  lastActiveDate: string | null; // YYYY-MM-DD in IST
  lastActiveWeek?: string | null; // YYYY-Www in IST
  lastActiveMonth?: string | null; // YYYY-MM in IST
  lastActiveYear?: string | null; // YYYY in IST

  updatedAt: any;
  createdAt: any;
}

// Get accurate current date/time info in India Standard Time (IST, UTC+5:30)
export function getISTDateInfo() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istOffset = 5.5 * 3600000;
  const istTime = new Date(utc + istOffset);

  const year = istTime.getFullYear();
  const month = istTime.getMonth(); // 0-11
  const date = istTime.getDate();

  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
  const weekNo = getWeekNumber(istTime);

  return {
    dateStr,
    weekStr: `${year}-W${String(weekNo).padStart(2, "0")}`,
    monthStr: `${year}-${String(month + 1).padStart(2, "0")}`,
    yearStr: `${year}`,
  };
}

function getWeekNumber(d: Date): number {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

// Calculate the number of days between two YYYY-MM-DD strings
export function daysBetween(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Get yesterday's date in IST
export function getISTYesterday(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = d.getMonth();
  const date = d.getDate();
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
}

// Automatically initialize a user's Naam Jap document to 0
export async function initializeUserNaamJap(uid: string, userName: string, profileImage: string): Promise<void> {
  if (!uid) return;
  try {
    const docRef = doc(db, "naamJap", uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      const { dateStr, weekStr, monthStr, yearStr } = getISTDateInfo();
      const initialDoc: NaamJapDoc = {
        uid,
        userName: userName || "Devotee",
        profileImage: profileImage || "",
        todayCount: 0,
        weeklyCount: 0,
        monthlyCount: 0,
        yearlyCount: 0,
        lifetimeCount: 0,
        todayMala: 0,
        weeklyMala: 0,
        monthlyMala: 0,
        yearlyMala: 0,
        lifetimeMala: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastTapAt: null,
        lastActiveDate: dateStr,
        lastActiveWeek: weekStr,
        lastActiveMonth: monthStr,
        lastActiveYear: yearStr,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(docRef, initialDoc);
      console.log(`[NaamJap] Initialized document for user ${uid}`);
    }
  } catch (error) {
    console.error("[NaamJap] Error in initializeUserNaamJap:", error);
  }
}

// Update Naam Jap counts with IST date resetting and streaks
export async function updateNaamJapCount(
  uid: string,
  userName: string,
  profileImage: string,
  incrementCount: number,
  incrementMala?: number // kept for legacy signature compatibility, but unused
): Promise<void> {
  if (!uid) return;

  const retryLimit = 3;
  let attempt = 0;

  while (attempt < retryLimit) {
    try {
      const docRef = doc(db, "naamJap", uid);
      const docSnap = await getDoc(docRef);

      const { dateStr, weekStr, monthStr, yearStr } = getISTDateInfo();
      let currentData: Partial<NaamJapDoc> = {};

      if (docSnap.exists()) {
        currentData = docSnap.data() as NaamJapDoc;
      }

      // 1. Resolve values or fallback to default 0
      const prevTodayCount = currentData.todayCount || 0;
      const prevWeeklyCount = currentData.weeklyCount || 0;
      const prevMonthlyCount = currentData.monthlyCount || 0;
      const prevYearlyCount = currentData.yearlyCount || 0;
      const prevLifetimeCount = currentData.lifetimeCount || 0;

      let currentStreak = currentData.currentStreak || 0;
      let longestStreak = currentData.longestStreak || 0;

      const dbLastActiveDate = currentData.lastActiveDate || null;
      const dbLastActiveWeek = currentData.lastActiveWeek || null;
      const dbLastActiveMonth = currentData.lastActiveMonth || null;
      const dbLastActiveYear = currentData.lastActiveYear || null;

      // 2. Daily resetting and streak logic
      let nextTodayCount = prevTodayCount + incrementCount;

      if (dbLastActiveDate !== dateStr) {
        // Date changed! Reset today's counts
        nextTodayCount = incrementCount;

        // Calculate streak change
        if (dbLastActiveDate) {
          const yesterdayStr = getISTYesterday(dateStr);
          if (dbLastActiveDate === yesterdayStr) {
            // Consecutive day!
            currentStreak = currentStreak + 1;
          } else {
            // Gap in chanting, streak resets
            currentStreak = 1;
          }
        } else {
          // First active day
          currentStreak = 1;
        }
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        // Same day, if current streak is somehow 0, make it 1
        if (currentStreak === 0) {
          currentStreak = 1;
          longestStreak = Math.max(longestStreak, currentStreak);
        }
      }

      const nextTodayMala = Math.floor(nextTodayCount / 108);

      // 3. Weekly resets
      let nextWeeklyCount = prevWeeklyCount + incrementCount;
      if (dbLastActiveWeek !== weekStr) {
        nextWeeklyCount = incrementCount;
      }
      const nextWeeklyMala = Math.floor(nextWeeklyCount / 108);

      // 4. Monthly resets
      let nextMonthlyCount = prevMonthlyCount + incrementCount;
      if (dbLastActiveMonth !== monthStr) {
        nextMonthlyCount = incrementCount;
      }
      const nextMonthlyMala = Math.floor(nextMonthlyCount / 108);

      // 5. Yearly resets
      let nextYearlyCount = prevYearlyCount + incrementCount;
      if (dbLastActiveYear !== yearStr) {
        nextYearlyCount = incrementCount;
      }
      const nextYearlyMala = Math.floor(nextYearlyCount / 108);

      // 6. Lifetime accumulation
      const nextLifetimeCount = prevLifetimeCount + incrementCount;
      const nextLifetimeMala = Math.floor(nextLifetimeCount / 108);

      // Ensure longest streak is bounded correctly
      longestStreak = Math.max(longestStreak, currentStreak);

      const updatedPayload: NaamJapDoc = {
        uid,
        userName: userName || currentData.userName || "Devotee",
        profileImage: profileImage || currentData.profileImage || "",

        todayCount: nextTodayCount,
        weeklyCount: nextWeeklyCount,
        monthlyCount: nextMonthlyCount,
        yearlyCount: nextYearlyCount,
        lifetimeCount: nextLifetimeCount,

        todayMala: nextTodayMala,
        weeklyMala: nextWeeklyMala,
        monthlyMala: nextMonthlyMala,
        yearlyMala: nextYearlyMala,
        lifetimeMala: nextLifetimeMala,

        currentStreak,
        longestStreak,

        lastTapAt: new Date().toISOString(),
        lastActiveDate: dateStr,
        lastActiveWeek: weekStr,
        lastActiveMonth: monthStr,
        lastActiveYear: yearStr,

        updatedAt: serverTimestamp(),
        createdAt: currentData.createdAt || serverTimestamp()
      };

      // Write user document
      await setDoc(docRef, updatedPayload, { merge: true });

      // Save local backup for instant offline loading and backup protection
      localStorage.setItem(`naam_jap_local_backup_${uid}`, JSON.stringify(updatedPayload));

      // 7. Sync with Global Leaderboard immediately
      const leadRef = doc(db, "quiz_global_leaderboard", uid);
      await setDoc(leadRef, {
        uid,
        userId: uid,
        displayName: userName || currentData.userName || "Devotee",
        userName: userName || currentData.userName || "Devotee",
        photoURL: profileImage || currentData.profileImage || "",
        profileImage: profileImage || currentData.profileImage || "",
        naamJapCount: nextLifetimeCount,
        totalMala: nextLifetimeMala,
        lastActivity: "Naam Jap",
        updatedAt: new Date().toISOString()
      }, { merge: true });

      console.log(`[NaamJap] Saved: Count +${incrementCount}. Lifetime: ${nextLifetimeCount}`);
      return; // Success!

    } catch (error) {
      attempt++;
      console.warn(`[NaamJap] Error on attempt ${attempt}/${retryLimit}:`, error);
      if (attempt >= retryLimit) {
        // Save to local backup to avoid losing any progress when offline/failed
        const localBackupKey = `naam_jap_local_pending_${uid}`;
        const existingPending = localStorage.getItem(localBackupKey);
        let pending = { count: 0, mala: 0 };
        if (existingPending) {
          try { pending = JSON.parse(existingPending); } catch (e) {}
        }
        pending.count += incrementCount;
        pending.mala += incrementMala;
        localStorage.setItem(localBackupKey, JSON.stringify(pending));
        console.error("[NaamJap] Maximum retries reached. Progress saved locally as pending sync.");
      } else {
        // Wait 200ms before retrying
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  }
}

// Automatically sync pending offline counts when network resumes
export async function syncPendingNaamJap(uid: string, userName: string, profileImage: string): Promise<void> {
  if (!uid) return;
  const localBackupKey = `naam_jap_local_pending_${uid}`;
  const pendingStr = localStorage.getItem(localBackupKey);
  if (pendingStr) {
    try {
      const pending = JSON.parse(pendingStr);
      if (pending.count > 0 || pending.mala > 0) {
        console.log(`[NaamJap] Syncing offline pending counts: ${pending.count} Jap, ${pending.mala} Malas`);
        localStorage.removeItem(localBackupKey);
        await updateNaamJapCount(uid, userName, profileImage, pending.count, pending.mala);
      }
    } catch (error) {
      console.error("[NaamJap] Failed to sync pending offline progress:", error);
    }
  }
}
