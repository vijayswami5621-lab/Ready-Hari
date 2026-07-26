import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { SEO } from '../../components/SEO';

export const ContentResolver = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const resolveContent = async () => {

      if (!id) {
        setError(true);
        setLoading(false);
        return;
      }
      
      const staticRoutes: Record<string, string> = {
        panchang: '/panchang',
        events: '/events',
        store: '/store',
        adhyayan: '/adhyayan',
        quotes: '/quotes',
        community: '/community/experiences',
        profile: '/profile',
        aiguru: '/aiguru',
        chanting: '/chanting',
        'naam-jap': '/chanting',
        'naam_jap': '/chanting'
      };
      
      if (staticRoutes[id.toLowerCase()]) {
        return navigate(staticRoutes[id.toLowerCase()], { replace: true });
      }

      
      try {
        
        // Try products
        const productSnap = await getDoc(doc(db, 'products', id));
        if (productSnap.exists()) {
          return navigate(`/store/product/${id}`, { replace: true });
        }
        
        // Try videos
        const videoSnap = await getDoc(doc(db, 'videos', id));
        if (videoSnap.exists()) {
          return navigate(`/adhyayan/video/${id}`, { replace: true });
        }
        
        // Try quotes
        const quoteSnap = await getDoc(doc(db, 'quotes', id));
        if (quoteSnap.exists()) {
          return navigate(`/quotes?id=${id}`, { replace: true }); // Or whatever quote route
        }
        
        // Try events
        const eventSnap = await getDoc(doc(db, 'events', id));
        if (eventSnap.exists()) {
          return navigate(`/events?id=${id}`, { replace: true });
        }
        
        // Try courses / categories
        const catSnap = await getDoc(doc(db, 'categories', id));
        if (catSnap.exists()) {
          return navigate(`/adhyayan/category/${id}`, { replace: true });
        }

        // Try orders
        const orderSnap = await getDoc(doc(db, 'orders', id));
        if (orderSnap.exists()) {
          return navigate(`/store/track-order/${id}`, { replace: true });
        }

        // If not found in any
        setError(true);
      } catch (err) {
        console.error("Failed to resolve document ID", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    
    resolveContent();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6">
        <SEO title="Resolving Content | Hari Pathshala" description="Opening spiritual content on Hari Pathshala." />
        <div className="w-12 h-12 border-4 border-saffron border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-brown-light dark:text-slate-400 font-medium">Opening content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-orange-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
        <SEO title="Content Not Found | Hari Pathshala" description="Spiritual content not found on Hari Pathshala." />
        <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm mb-6 border border-orange-100 dark:border-slate-700">
          <span className="text-4xl">🔍</span>
        </div>
        <h1 className="text-2xl font-bold font-sans text-brown-dark dark:text-white mb-2">Content Not Available</h1>
        <p className="text-brown-light dark:text-slate-400 mb-8 max-w-sm">
          The content you are looking for might have been removed or the ID is incorrect.
        </p>
        <button
          onClick={() => navigate('/', { replace: true })}
          className="px-6 py-3 bg-saffron text-white font-bold rounded-xl shadow-md hover:bg-orange-600 transition-colors"
        >
          Go to Home
        </button>
      </div>
    );
  }

  return null;
};
