import { SecureImage } from '../../components/common/SecureImage';
import React from 'react';
import { motion } from 'motion/react';
import { SEO } from '../../components/SEO';
import { ArrowLeft, Calendar, MapPin, Clock, Share2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRealtimeCollection } from '../../hooks/useRealtimeCollection';
import { EmptyState } from '../../components/EmptyState';
import { NotFoundScreen } from './NotFoundScreen';
import { useGoBack } from '../../hooks/useGoBack';
import { useShareContent } from '../../hooks/useShareContent';

export const EventsScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const goBack = useGoBack();
  const { shareContent } = useShareContent();
  const { data: events, loading } = useRealtimeCollection<any>('events');

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-900 transition-colors pb-20">
      <SEO title="Upcoming Events | Hari Pathshala" description="Upcoming Events page for Hari Pathshala." />
      
      <header className="pt-12 pb-4 px-6 sticky top-0 z-20 flex justify-between items-center bg-orange-50/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={() => goBack()} className="p-2 bg-white dark:bg-slate-800 rounded-full text-brown-dark dark:text-white shadow-sm border border-orange-100 dark:border-slate-700">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold font-sans text-brown-dark dark:text-white">Upcoming Events</h1>
        </div>
        <button onClick={() => shareContent({ title: "Upcoming Events", urlPath: '/events' })} className="p-2 bg-white dark:bg-slate-800 rounded-full text-brown-dark dark:text-white shadow-sm border border-orange-100 dark:border-slate-700">
          <Share2 size={20} />
        </button>
      </header>

      <div className="px-6 mt-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-saffron border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : events.length === 0 ? (
          <EmptyState 
            icon={Calendar}
            title="No Upcoming Events"
            message="There are no upcoming events at the moment. Please check back later."
          />
        ) : (
          <div className="space-y-4">
            {events.map((event: any, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                key={event.id || i}
                className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-md border border-orange-100 dark:border-slate-700"
              >
                {event.image && (
                  <div className="w-full h-48 bg-orange-100 dark:bg-slate-700">
                    <SecureImage src={event.image} alt={event.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-5">
                  <h3 className="font-bold text-lg text-brown-dark dark:text-white mb-2">{event.title}</h3>
                  <p className="text-sm text-brown-light dark:text-slate-400 mb-4">{event.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs font-medium text-brown-dark/70 dark:text-slate-300">
                      <Calendar size={14} className="text-saffron-dark" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-brown-dark/70 dark:text-slate-300">
                      <Clock size={14} className="text-saffron-dark" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-brown-dark/70 dark:text-slate-300">
                      <MapPin size={14} className="text-saffron-dark" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="flex-1 bg-saffron-dark text-white font-bold py-3 rounded-xl shadow-md hover:bg-saffron transition-colors">
                      Register Now
                    </button>
                    <button onClick={() => shareContent({ title: event.title, urlPath: `/event/${event.id}` })} className="px-4 bg-orange-50 dark:bg-slate-700 text-brown-dark dark:text-white font-bold py-3 rounded-xl shadow-sm border border-orange-100 dark:border-slate-600 hover:bg-orange-100 dark:hover:bg-slate-600 transition-colors">
                      <Share2 size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
