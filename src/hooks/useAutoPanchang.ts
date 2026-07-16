import { useState, useEffect, useRef } from "react";
import { syncTodayPanchang, getDeviceLocation, PanchangData } from "../services/panchangService";
import { getISTDateInfo } from "../services/naamJapService";

export const useAutoPanchang = () => {
  const [panchang, setPanchang] = useState<PanchangData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentDateRef = useRef<string>(getISTDateInfo().dateStr);

  useEffect(() => {
    let isMounted = true;

    const loadPanchang = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const todayStr = getISTDateInfo().dateStr;
        currentDateRef.current = todayStr;

        // Fetch location (has native GPS check & fast reverse-geocode)
        const location = await getDeviceLocation();
        if (!isMounted) return;

        const data = await syncTodayPanchang(location);
        if (isMounted) {
          if (data) {
            setPanchang(data);
          } else {
            setError("Today's Panchang is temporarily unavailable.");
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Today's Panchang is temporarily unavailable.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPanchang();

    // Auto refresh past midnight in IST (checks every 30 seconds)
    const interval = setInterval(() => {
      const todayStr = getISTDateInfo().dateStr;
      if (currentDateRef.current !== todayStr) {
        console.log(`[useAutoPanchang] Midnight detected in IST! Refreshing from ${currentDateRef.current} to ${todayStr}`);
        loadPanchang();
      }
    }, 30000);

    // Auto refresh when tab/app regains focus on a new day
    const handleFocus = () => {
      const todayStr = getISTDateInfo().dateStr;
      if (currentDateRef.current !== todayStr) {
        console.log(`[useAutoPanchang] App focus detected new day in IST! Refreshing to ${todayStr}`);
        loadPanchang();
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return { panchang, loading, error };
};
