import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Github, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AuthModal = () => {
  const { authModalOpen, setAuthModalOpen, setToken, setUser } = useAuthStore();
  const [step, setStep] = useState('email'); // 'email' or 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setAuthModalOpen(false);
    // Reset state after animation completes
    setTimeout(() => {
      setStep('email');
      setEmail('');
      setOtp('');
      setLoading(false);
    }, 300);
  };

  const handleGoogleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    window.location.href = `${apiUrl}/auth/google/login`;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    try {
      await api.post('/auth/otp/request', { email });
      toast.success('OTP sent to your email!');
      setStep('otp');
    } catch (error) {
      // Error is handled by api interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/otp/verify', { email, otp });
      setToken(response.data.access_token);
      
      // Fetch user profile immediately
      const userRes = await api.get('/auth/me');
      setUser(userRes.data);
      
      toast.success('Successfully logged in!');
      handleClose();
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {authModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#09090b] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl pointer-events-auto flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-800/50">
                <h2 className="text-xl font-semibold text-zinc-100 font-inter">
                  Sign in to Dev Patrika
                </h2>
                <button
                  onClick={handleClose}
                  className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {step === 'email' ? (
                    <motion.div
                      key="email-step"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-6"
                    >
                      <p className="text-sm text-zinc-400">
                        Join the developer community to read exclusive news, chat with AI, and access weekly reports.
                      </p>

                      <div className="space-y-3">
                        <button
                          onClick={handleGoogleLogin}
                          className="w-full flex items-center justify-center gap-3 bg-white text-black py-2.5 px-4 rounded-xl font-medium hover:bg-zinc-200 transition-colors"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              fill="#4285F4"
                            />
                            <path
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              fill="#34A853"
                            />
                            <path
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                              fill="#FBBC05"
                            />
                            <path
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                              fill="#EA4335"
                            />
                          </svg>
                          Continue with Google
                        </button>
                        
                        <button
                          disabled
                          className="w-full flex items-center justify-center gap-3 bg-[#24292e] text-white py-2.5 px-4 rounded-xl font-medium opacity-60 cursor-not-allowed"
                        >
                          <Github className="w-5 h-5" />
                          Continue with GitHub (Coming soon)
                        </button>
                      </div>

                      <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-zinc-800"></div>
                        <span className="flex-shrink-0 mx-4 text-zinc-500 text-xs uppercase tracking-wider font-semibold">
                          Or continue with email
                        </span>
                        <div className="flex-grow border-t border-zinc-800"></div>
                      </div>

                      <form onSubmit={handleSendOtp} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-zinc-300">Email Address</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="you@example.com"
                              className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-100 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-zinc-600"
                              required
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={loading || !email}
                          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-4 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Magic Code'}
                        </button>
                      </form>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="otp-step"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 mb-2">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-medium text-zinc-100">Check your email</h3>
                        <p className="text-sm text-zinc-400">
                          We've sent a 6-digit verification code to <br />
                          <span className="font-medium text-zinc-200">{email}</span>
                        </p>
                      </div>

                      <form onSubmit={handleVerifyOtp} className="space-y-4 pt-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-zinc-300">Verification Code</label>
                          <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-100 text-center text-2xl tracking-[0.5em] font-mono rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-zinc-700"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={loading || otp.length !== 6}
                          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-4 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Sign In'}
                          {!loading && <ArrowRight className="w-4 h-4" />}
                        </button>
                      </form>

                      <div className="text-center">
                        <button
                          onClick={() => setStep('email')}
                          className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
                        >
                          &larr; Back to email input
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
