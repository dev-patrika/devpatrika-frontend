import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import Layout from '@/components/layout/Layout';
import LoadingPage from '@/components/layout/LoadingPage';
import AuthModal from '@/components/auth/AuthModal';
import AuthGuard from '@/components/auth/AuthGuard';
import WelcomeBanner from '@/components/auth/WelcomeBanner';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';

// Lazy-loaded page components for optimization & bundle splitting
const Dashboard = lazy(() => import('@/pages/Dashboard/Dashboard'));
const Feed = lazy(() => import('@/pages/Feed/Feed'));
const GitHubRadar = lazy(() => import('@/pages/GitHub/GitHubRadar'));
const DevWiki = lazy(() => import('@/pages/Wiki/DevWiki'));
const WeeklyReports = lazy(() => import('@/pages/Reports/WeeklyReports'));
const AIChat = lazy(() => import('@/pages/Chat/AIChat'));
const Settings = lazy(() => import('@/pages/Settings/Settings'));
const NewsDetail = lazy(() => import('@/pages/News/NewsDetail'));
const GitHubDetail = lazy(() => import('@/pages/GitHub/GitHubDetail'));
const LoginSuccess = lazy(() => import('@/pages/Auth/LoginSuccess'));
const Contact = lazy(() => import('@/pages/Contact/Contact'));

// Set up TanStack Query Client with V5 specifications
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes cache stale
      gcTime: 10 * 60 * 1000,    // 10 minutes garbage collection
    },
  },
});

function App() {
  const { token, setUser } = useAuthStore();

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  React.useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch (err) {
          console.error('Session validation failed on startup:', err);
        }
      }
    };
    initializeAuth();
  }, [token, setUser]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Global Auth Modal — triggered from anywhere via authStore */}
        <AuthModal />
        {/* First-visit welcome banner — slides in from right */}
        <WelcomeBanner />
        {/* Global Confirm Modal for replacing native window.confirm */}
        <ConfirmModal />
        
        <Suspense fallback={<LoadingPage />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              {/* PUBLIC: Feed headlines are free to browse */}
              <Route index element={<Feed />} />
              <Route path="feed" element={<Navigate to="/" replace />} />
              <Route path="github" element={<GitHubRadar />} />
              <Route path="wiki" element={<DevWiki />} />
              <Route path="reports" element={<WeeklyReports />} />
              <Route path="contact" element={<Contact />} />
              <Route path="login/success" element={<LoginSuccess />} />
              
              {/* PROTECTED: Reading full articles requires sign-in */}
              <Route path="news/:id" element={
                <AuthGuard>
                  <NewsDetail />
                </AuthGuard>
              } />
              <Route path="github/:id" element={
                <AuthGuard>
                  <GitHubDetail />
                </AuthGuard>
              } />
              <Route path="chat" element={
                <AuthGuard>
                  <AIChat />
                </AuthGuard>
              } />
              <Route path="settings" element={
                <AuthGuard>
                  <Settings />
                </AuthGuard>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
      
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(9, 9, 11, 0.95)',
            border: '1px solid rgba(63, 63, 70, 0.4)',
            color: '#f4f4f5',
            fontSize: '12px',
            fontWeight: '600',
            borderRadius: '8px',
            padding: '10px 16px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#09090b',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#09090b',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;

