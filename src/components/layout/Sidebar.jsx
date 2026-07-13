import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  LayoutDashboard, 
  Newspaper, 
  Github, 
  BookOpen, 
  FileText, 
  MessageSquare, 
  Settings, 
  Sun, 
  Moon, 
  Terminal,
  Activity,
  ChevronLeft,
  ChevronRight,
  Mail
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { healthService } from '@/services/healthService';
import Button from '../ui/Button';

const Sidebar = () => {
  const { theme, toggleTheme, sidebarOpen, setSidebarOpen } = useUIStore();
  const location = useLocation();

  // Periodically poll backend status
  const { data: healthData, isError, isLoading } = useQuery({
    queryKey: ['backendHealth'],
    queryFn: healthService.checkHealth,
    refetchInterval: 15000, // every 15s
    retry: false
  });

  const navItems = [
    { name: 'devBot', path: '/', icon: MessageSquare },
    { name: 'Daily Feed', path: '/feed', icon: Newspaper },
    { name: 'GitHub Radar', path: '/github', icon: Github },
    { name: 'Dev Wiki', path: '/wiki', icon: BookOpen },
    { name: 'Dev Patrika Weekly', path: '/reports', icon: FileText },
    { name: 'Contact Us', path: '/contact', icon: Mail },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside 
      className={`h-screen border-r border-border bg-card/60 backdrop-blur-md transition-all duration-300 flex flex-col z-20 ${
        sidebarOpen ? 'w-64' : 'w-16'
      }`}
    >
      {/* Brand logo header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="p-1.5 rounded-md bg-primary/10 text-primary border border-primary/20 shrink-0">
            <Terminal className="h-5 w-5" />
          </div>
          {sidebarOpen && (
            <span className="font-bold tracking-tight text-foreground text-sm uppercase">
              Dev Patrika
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-zinc-800 hidden sm:flex"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation section */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all group relative
                ${isActive 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }
              `}
            >
              <Icon className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-primary' : ''}`} />
              {sidebarOpen && <span>{item.name}</span>}
              {!sidebarOpen && (
                <div className="absolute left-14 bg-popover border border-border text-foreground px-2 py-1 rounded-md text-xs font-semibold scale-0 group-hover:scale-100 origin-left transition-all shadow-md pointer-events-none whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer controls & Connection health status */}
      <div className="p-3 border-t border-border bg-card/30 space-y-3">
        {/* Connection status */}
        <div className={`flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'} px-2`}>
          {sidebarOpen && (
            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Activity className="h-3 w-3" />
              Engine Connection
            </span>
          )}
          
          <div className="relative flex h-2.5 w-2.5">
            {isLoading ? (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            ) : isError || !healthData || healthData.status !== 'ok' ? (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            ) : (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              isLoading 
                ? 'bg-amber-500' 
                : isError || !healthData || healthData.status !== 'ok'
                  ? 'bg-red-500' 
                  : 'bg-emerald-500'
            }`}></span>
          </div>
        </div>

        {/* Theme and details */}
        <div className="flex items-center justify-between gap-1">
          {sidebarOpen && (
            <span className="text-xs text-muted-foreground px-2 font-mono">
              v0.5.0-beta
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="w-full h-8 flex items-center justify-center gap-2 hover:bg-zinc-800 text-muted-foreground hover:text-foreground"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-4 w-4 text-amber-400" />
                {sidebarOpen && <span className="text-xs font-medium">Light Mode</span>}
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-indigo-400" />
                {sidebarOpen && <span className="text-xs font-medium">Dark Mode</span>}
              </>
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
