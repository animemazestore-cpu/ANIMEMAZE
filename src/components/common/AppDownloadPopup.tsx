import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Download } from 'lucide-react';

// Hardcoded download URL - easy to edit
const DOWNLOAD_URL = 'https://download937.mediafire.com/l5nh72o2m2jgFT9Uyco1jevFQAU91DCLXuZXN-MvKSNzQi0piHNYFrcZAYcQfRH86C_P6riKJr7l36uIhbxkIQCHSuRNzlqAlR0OFh3bf896k3E_QdlKFF9IsazzeZ1stuJT2WIjteBYCt9YWIQIP9rYWZbuDUO2qR7OEPa6RAVCD_E/b4ypqciqjpjzv7u/app-debug.apk';

export const AppDownloadPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Show popup after 3 seconds on every page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleDownload = () => {
    window.open(DOWNLOAD_URL, '_blank');
    handleClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleOverlayClick}
        >
          {/* Dark blurred overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Popup card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 z-10"
              aria-label="Close popup"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            {/* Content */}
            <div className="p-8">
              {/* Phone illustration */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-purple-700 rounded-3xl flex items-center justify-center shadow-lg">
                    <Smartphone className="w-12 h-12 text-white" />
                  </div>
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-purple-500/30 blur-2xl rounded-3xl -z-10" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-center text-gray-900 mb-3">
                📱 Download the AnimeMaze App
              </h2>

              {/* Subtitle */}
              <p className="text-center text-gray-600 mb-8 leading-relaxed">
                Enjoy a faster shopping experience, exclusive app-only offers, instant order tracking, quicker checkout, and push notifications.
              </p>

              {/* Buttons */}
              <div className="space-y-3">
                {/* Download button */}
                <button
                  onClick={handleDownload}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg flex items-center justify-center gap-3 group"
                >
                  <Download className="w-5 h-5 group-hover:animate-bounce" />
                  <span>Download App</span>
                </button>

                {/* Maybe Later button */}
                <button
                  onClick={handleClose}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-2xl transition-all duration-300"
                >
                  Maybe Later
                </button>
              </div>

              {/* Google Play badge hint */}
              <div className="flex items-center justify-center gap-2 mt-6 text-sm text-gray-500">
                <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">
                  <Download className="w-3 h-3 text-gray-600" />
                </div>
                <span>Available on Google Play</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
