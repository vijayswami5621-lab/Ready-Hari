import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, QueryConstraint } from 'firebase/firestore';
import { db } from '../firebase/config';
import * as fallbacks from '../utils/offlineFallbackData';

// Global memory cache to share collections across active hook instances
const globalMemoryCache: Record<string, any[]> = {};

function getStaticFallbackForCollection(collectionName: string): any[] {
  switch (collectionName) {
    case 'quiz_subjects':
      return fallbacks.fallbackSubjects;
    case 'quiz_quizzes':
      return fallbacks.fallbackQuizzes;
    case 'quotes':
      return fallbacks.fallbackQuotes;
    case 'dohas':
      return fallbacks.fallbackDohas;
    case 'videos':
      return fallbacks.fallbackVideos;
    case 'categories':
      return fallbacks.fallbackCategories;
    case 'products':
      return fallbacks.fallbackProducts;
    case 'app_settings':
      return fallbacks.fallbackAppSettings;
    case 'homepage_sections':
      return fallbacks.fallbackHomepageSections;
    case 'navigation':
      return fallbacks.fallbackNavigation;
    case 'blogs':
      return fallbacks.fallbackBlogs;
    case 'events':
      return fallbacks.fallbackEvents;
    case 'testimonials':
      return fallbacks.fallbackTestimonials;
    case 'founder':
      return [fallbacks.fallbackFounder];
    case 'pages':
      return [fallbacks.fallbackPages];
    default:
      return [];
  }
}

export function useRealtimeCollection<T>(collectionName: string, queryConstraints: QueryConstraint[] = []) {
  // Track constraints securely
  const constraintsString = JSON.stringify(queryConstraints.map(c => c.type));
  const cacheKey = `${collectionName}_${constraintsString}`;

  // Offline-First: Try memory cache first, then localStorage, then static fallbacks
  const getInitialData = (): T[] => {
    if (globalMemoryCache[cacheKey] && globalMemoryCache[cacheKey].length > 0) {
      return globalMemoryCache[cacheKey];
    }
    try {
      const stored = localStorage.getItem(`hp_cache_${cacheKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          globalMemoryCache[cacheKey] = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.warn(`Error reading local cache for ${cacheKey}:`, e);
    }
    
    // Fall back to high-quality static assets immediately to prevent empty/blank states
    const staticFallback = getStaticFallbackForCollection(collectionName);
    if (staticFallback.length > 0) {
      globalMemoryCache[cacheKey] = staticFallback;
      return staticFallback as unknown as T[];
    }
    return [];
  };

  const initialData = getInitialData();
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(initialData.length === 0);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: () => void;

    const setupListener = () => {
      try {
        const q = queryConstraints.length > 0 
          ? query(collection(db, collectionName), ...queryConstraints)
          : query(collection(db, collectionName));

        unsubscribe = onSnapshot(q, 
          (snapshot) => {
            if (!isMounted) return;
            const items: T[] = [];
            snapshot.forEach((doc) => {
              items.push({ id: doc.id, ...doc.data() } as T);
            });

            // If empty (e.g. cold start) but we have fallbacks, let's keep the fallbacks or merge
            const finalItems = items.length > 0 ? items : (getStaticFallbackForCollection(collectionName) as unknown as T[]);

            // Update memory and disk cache
            globalMemoryCache[cacheKey] = finalItems;
            try {
              localStorage.setItem(`hp_cache_${cacheKey}`, JSON.stringify(finalItems));
            } catch (e) {
              console.warn(`Error writing local cache for ${cacheKey}:`, e);
            }

            setData(finalItems);
            setLoading(false);
            setError(null);
          },
          (err) => {
            if (!isMounted) return;
            console.warn(`Realtime collection ${collectionName} error (falling back to local cache):`, err);
            
            // On error (e.g., Quota Exceeded), recover cleanly using fallbacks
            const fallbackVal = getStaticFallbackForCollection(collectionName) as unknown as T[];
            if (fallbackVal.length > 0) {
              setData(fallbackVal);
            }
            
            setError(err);
            setLoading(false);
          }
        );
      } catch (err: any) {
        if (!isMounted) return;
        console.warn(`Realtime collection ${collectionName} exception (falling back to static):`, err);
        const fallbackVal = getStaticFallbackForCollection(collectionName) as unknown as T[];
        if (fallbackVal.length > 0) {
          setData(fallbackVal);
        }
        setError(err);
        setLoading(false);
      }
    };

    setupListener();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [collectionName, constraintsString]);

  return { data, loading, error };
}
