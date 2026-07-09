import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  Search, 
  RefreshCw, 
  Cpu, 
  FilePlus2,
  Home
} from 'lucide-react';
import { newsService } from '@/services/newsService';
import { reportService } from '@/services/reportService';
import { useUIStore } from '@/store/uiStore';
import Button from '../ui/Button';

const Header = () => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { setSearchOpen } = useUIStore();
  const [isCompiling, setIsCompiling] = useState(false);

  // Get human-friendly title from pathname
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path === '/feed') return 'Daily News Feed';
    if (path === '/github') return 'GitHub Radar';
    if (path === '/wiki') return 'Developer Wiki';
    if (path === '/reports') return 'Weekly Digests';
    if (path === '/chat') return 'AI Chatbot';
    if (path === '/settings') return 'Platform Settings';
    return 'Dev Patrika';
  };

  // Crawl feeds loader
  const ingestMutation = useMutation({
    mutationFn: newsService.triggerIngest,
    onSuccess: (data) => {
      toast.success(data.detail || 'Ingestion scheduled in background.');
      queryClient.invalidateQueries({ queryKey: ['news'] });
    },
    onError: () => {
      toast.error('Failed to trigger ingestion.');
    }
  });

  // Process pending elements through LLM loader
  const processMutation = useMutation({
    mutationFn: newsService.triggerProcess,
    onSuccess: (data) => {
      toast.success(data.detail || 'AI summarization engine scheduled.');
      queryClient.invalidateQueries({ queryKey: ['news'] });
    },
    onError: () => {
      toast.error('Failed to trigger AI processing.');
    }
  });

  // Compile weekly reports loader
  const compileMutation = useMutation({
    mutationFn: reportService.compileWeeklyReport,
    onMutate: () => {
      setIsCompiling(true);
    },
    onSuccess: (data) => {
      toast.success(`Weekly digest compiled successfully! Title: ${data.title}`);
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setIsCompiling(false);
    },
    onError: (err) => {
      const msg = err.response?.data?.detail || 'Failed to compile weekly report (insufficient news or rate limit).';
      toast.error(msg);
      setIsCompiling(false);
    }
  });

  return (
    <header className="h-16 border-b border-border bg-background/50 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10">
      {/* Breadcrumb title */}
      <div className="flex items-center gap-2">
        <Home className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground text-sm">/</span>
        <span className="text-sm font-semibold text-foreground tracking-tight">
          {getPageTitle()}
        </span>
      </div>

      {/* Action buttons & Unified Search prompt */}
      <div className="flex items-center gap-3">
        {/* Search button trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center justify-between w-48 sm:w-64 h-9 px-3 rounded-md bg-zinc-900 border border-border text-muted-foreground hover:text-foreground text-xs hover:border-zinc-700 transition-all"
        >
          <span className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5" />
            Search index...
          </span>
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-zinc-950 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            Ctrl K
          </kbd>
        </button>
      </div>
    </header>
  );
};

export default Header;
