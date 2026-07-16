import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

export const NotFoundScreen = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <img src="/logo.png" alt="Hari Pathshala Logo" className="w-24 h-24 object-contain drop-shadow-md rounded-full bg-white p-2 mb-6" />
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Content Not Found</h1>
      <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-sm">
        The link you followed may be broken, or the content has been removed.
      </p>
      <button
        onClick={() => navigate("/")}
        className="px-6 py-3 bg-saffron-dark text-white rounded-xl font-bold flex items-center justify-center gap-2"
      >
        <Home size={20} />
        Return to Home
      </button>
    </div>
  );
};
