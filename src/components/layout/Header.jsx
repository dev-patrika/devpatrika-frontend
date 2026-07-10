import React from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Home } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

const Header = () => {
  const location = useLocation();
  const { setSearchOpen } = useUIStore();

  // Get human-friendly title from pathname
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'devBot';
    if (path === '/feed') return 'Daily News Feed';
    if (path === '/github') return 'GitHub Radar';
    if (path === '/wiki') return 'Developer Wiki';
    if (path === '/reports') return 'Weekly Digests';
    if (path === '/chat') return 'AI Chatbot';
    if (path === '/settings') return 'Platform Settings';
    return 'Dev Patrika';
  };

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
