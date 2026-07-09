import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import Layout from '@/components/layout/Layout';
import LoadingPage from '@/components/layout/LoadingPage';

// Lazy-loaded page components for optimization & bundle splitting
const Dashboard = lazy(() => import('@/pages/Dashboard/Dashboard'));
const Feed = lazy(() => import('@/pages/Feed/Feed'));
const GitHubRadar = lazy(() => import('@/pages/GitHub/GitHubRadar'));
const DevWiki = lazy(() => import('@/pages/Wiki/DevWiki'));
const WeeklyReports = lazy(() => import('@/pages/Reports/WeeklyReports'));
const AIChat = lazy(() => import('@/pages/Chat/AIChat'));
const Settings = lazy(() => import('@/pages/Settings/Settings'));

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
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<LoadingPage />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="feed" element={<Feed />} />
              <Route path="github" element={<GitHubRadar />} />
              <Route path="wiki" element={<DevWiki />} />
              <Route path="reports" element={<WeeklyReports />} />
              <Route path="chat" element={<AIChat />} />
              <Route path="settings" element={<Settings />} />
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
