import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  buttonText?: string;
  buttonAction?: () => void;
  buttonPath?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon: Icon, 
  title, 
  message, 
  buttonText, 
  buttonAction,
  buttonPath 
}) => {
  const navigate = useNavigate();

  const handleAction = () => {
    if (buttonAction) {
      buttonAction();
    } else if (buttonPath) {
      navigate(buttonPath);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-8 text-center min-h-[50vh]"
    >
      <div className="w-24 h-24 bg-orange-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 relative">
        <div className="absolute inset-0 bg-saffron-dark/10 rounded-full animate-ping opacity-75"></div>
        <Icon size={48} className="text-saffron-dark relative z-10" />
      </div>
      
      <h2 className="text-xl font-bold font-sans text-brown-dark dark:text-white mb-2">
        {title}
      </h2>
      
      <p className="text-sm text-brown-light dark:text-slate-400 max-w-xs mb-8">
        {message}
      </p>

      {buttonText && (
        <button 
          onClick={handleAction}
          className="bg-saffron-dark text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-saffron transition-colors"
        >
          {buttonText}
        </button>
      )}
    </motion.div>
  );
};
