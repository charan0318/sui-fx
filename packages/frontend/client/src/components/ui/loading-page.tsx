
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import suiFxLoadingVideo from '@/components/background/sui_fx_loading.mp4';

interface LoadingPageProps {
  onComplete?: () => void;
  duration?: number;
}

export const LoadingPage: React.FC<LoadingPageProps> = ({ 
  onComplete, 
  duration = 3000 
}) => {
  useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [onComplete, duration]);

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        >
          <source src={suiFxLoadingVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
      </div>
      {/* Bottom Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <p className="text-gray-500 font-inter text-sm text-center">
          Built with 🤍 from ch04niverse
        </p>
      </motion.div>
    </div>
  );
};
