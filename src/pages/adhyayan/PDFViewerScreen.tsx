import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { SEO } from '../../components/SEO';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRealtimeCollection } from '../../hooks/useRealtimeCollection';
import { useGoBack } from "../../hooks/useGoBack";

export const PDFViewerScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { data: dbVideos, loading } = useRealtimeCollection<any>('videos');
  
  const video = dbVideos.find(v => v.id === id);
  const pdfUrl = video?.pdfUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/example.pdf'; // Example PDF

  const handleDownload = () => {
    window.open(pdfUrl, '_blank');
  };

  return (
    <div className="flex flex-col h-screen bg-orange-50 dark:bg-slate-900 transition-colors">
      <SEO title="Study Notes | Hari Pathshala" description="Read study notes and PDFs." />
      
      <header className="px-4 py-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-30 shadow-sm flex items-center justify-between border-b border-orange-50 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button onClick={() => goBack()} className="p-2 -ml-2 text-brown-dark dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-full transition">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold font-sans text-brown-dark dark:text-white truncate max-w-[200px]">
            {video?.title ? `Notes: ${video.title}` : 'Study Notes'}
          </h1>
        </div>
        <button 
          onClick={handleDownload}
          className="p-2 bg-orange-100 dark:bg-slate-800 text-brown-dark dark:text-white rounded-full hover:bg-orange-200 dark:hover:bg-slate-700 transition"
        >
          <Download size={20} />
        </button>
      </header>

      <div className="flex-1 bg-white dark:bg-slate-800 overflow-hidden relative">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-8 h-8 border-4 border-saffron border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <iframe 
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`}
            title="PDF Viewer"
            className="w-full h-full border-none"
          />
        )}
      </div>
    </div>
  );
};
