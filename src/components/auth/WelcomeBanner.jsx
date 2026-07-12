import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

/**
 * A slide-in welcome banner that appears on the RIGHT side of the screen
 * when a user first visits the site. Dismissable, and only shows once per session.
 * Like Medium / LinkedIn's "Sign up to read more" prompts.
 */
const WelcomeBanner = () => {
  const { isAuthenticated, setAuthModalOpen } = useAuthStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if already logged in
    if (isAuthenticated) return;

    // Check if we already showed it this session
    const dismissed = sessionStorage.getItem('welcome_banner_dismissed');
    if (dismissed) return;

    // Show after a small delay so user sees the page first
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem('welcome_banner_dismissed', 'true');
  };

  const handleSignIn = () => {
    handleDismiss();
    setAuthModalOpen(true);
  };

  // Don't render if user is authenticated
  if (isAuthenticated) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-6 right-6 z-50 w-[340px] max-w-[calc(100vw-2rem)]"
        >
          <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950/30 border border-zinc-700/50 rounded-2xl p-6 shadow-2xl shadow-black/40 backdrop-blur-xl">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-full transition-colors"
            >
              <X size={16} />
            </button>

            {/* Icon */}
            <div className="w-10 h-10 bg-emerald-500/15 rounded-xl flex items-center justify-center mb-4 ring-1 ring-emerald-500/20">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>

            {/* Content */}
            <h3 className="text-[15px] font-bold text-zinc-100 mb-1.5">
              Welcome to Dev Patrika!
            </h3>
            <p className="text-[13px] text-zinc-400 leading-relaxed mb-5">
              Sign in to read full articles, chat with AI, and get personalized weekly reports.
            </p>

            {/* CTA */}
            <button
              onClick={handleSignIn}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-4 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-900/30"
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Subtle link */}
            <p className="text-center text-[11px] text-zinc-600 mt-3">
              Browse headlines without signing in
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeBanner;
