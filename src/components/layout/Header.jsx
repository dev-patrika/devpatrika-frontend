import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import logoImg from '@/assets/logo_dpatrika.png';

const Header = () => {
  const location = useLocation();
  const { setSearchOpen } = useUIStore();
  const { isAuthenticated, user, setAuthModalOpen, logout } = useAuthStore();

  const navItems = [
    { name: 'Daily Feed', path: '/' },
    { name: 'GitHub Radar', path: '/github' },
    { name: 'Dev Wiki', path: '/wiki' },
    { name: 'Dev Patrika Weekly', path: '/reports' },
    { name: 'Contact Us', path: '/contact' },
    { name: 'Settings', path: '/settings' },
  ];

  return (
    <header className="h-20 border-b border-border/60 bg-background/80 backdrop-blur-md px-6 md:px-8 flex items-center justify-between sticky top-0 z-40 select-none shrink-0">
      {/* Left section: Logo + Floating Nav Pill */}
      <div className="flex items-center gap-6 md:gap-10">
        {/* Brand logo */}
        <NavLink to="/" className="flex items-center select-none shrink-0">
          <img src={logoImg} alt="Dev Patrika Logo" className="h-14 w-auto object-contain shrink-0" />
        </NavLink>

        {/* Floating pill navigation (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1 bg-card border border-border p-1 rounded-full shadow-sm">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all duration-250 cursor-pointer ${
                  isActive 
                    ? 'bg-primary text-white shadow-sm font-bold scale-102' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Swipeable navigation (Mobile/Tablet) */}
        <nav className="flex lg:hidden items-center gap-2 overflow-x-auto max-w-[200px] sm:max-w-[400px] scrollbar-none shrink-0 py-1 pr-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all shrink-0 ${
                  isActive 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Right section: Search bar & Auth */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Search button trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="hidden sm:flex items-center justify-between w-36 md:w-56 h-8.5 px-3 rounded-full bg-card border border-border text-muted-foreground hover:text-foreground text-xs hover:border-zinc-400 transition-all select-none"
        >
          <span className="flex items-center gap-1.5 truncate">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">Search index...</span>
          </span>
          <kbd className="hidden md:inline-flex h-5 select-none items-center gap-0.5 rounded-full border border-border bg-muted px-2 font-mono text-[9px] font-medium text-muted-foreground">
            Ctrl K
          </kbd>
        </button>

        {/* Auth Section */}
        {isAuthenticated ? (
          <div className="flex items-center gap-3 pl-2 sm:border-l border-border/60">
            <div className="flex items-center gap-2">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full border border-border" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
              )}
              <div className="hidden lg:flex flex-col">
                <span className="text-[11px] font-bold text-foreground leading-tight truncate max-w-[100px]">
                  {user?.name || 'Developer'}
                </span>
                <span className="text-[9px] text-muted-foreground leading-tight truncate max-w-[100px]">
                  {user?.email}
                </span>
              </div>
            </div>
            <button 
              onClick={logout}
              className="text-xs text-zinc-500 hover:text-rose-400 transition-colors font-medium ml-1"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="pl-2 sm:border-l border-border/60 flex items-center">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="bg-zinc-100 hover:bg-white text-zinc-900 px-4 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105 active:scale-95"
            >
              Sign In
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
