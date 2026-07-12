import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const AuthGuard = ({ children }) => {
  const { isAuthenticated, setAuthModalOpen } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <div className="relative w-full h-full min-h-[calc(100vh-6rem)]">
        {/* Blurred background content */}
        <div className="w-full h-full blur-[6px] brightness-[0.4] select-none pointer-events-none">
          {children}
        </div>
        
        {/* Overlay Card - Styled exactly like the Modal */}
        <div className="absolute inset-0 flex items-center justify-center z-10 px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center max-w-md w-full text-center p-8 bg-[#09090b] border border-zinc-800 rounded-2xl shadow-2xl"
          >
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800">
              <Lock className="w-7 h-7 text-emerald-500" />
            </div>
            
            <h2 className="text-xl font-semibold text-zinc-100 font-inter mb-3">
              Sign in to Dev Patrika
            </h2>
            <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
              Join the developer community to read exclusive news, chat with AI, and access weekly reports.
            </p>
            
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Sign in to Continue
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
