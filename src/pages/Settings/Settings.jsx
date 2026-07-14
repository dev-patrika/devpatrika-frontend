import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Trash2, 
  Moon, 
  Cpu, 
  Wifi,
  WifiOff,
  Wrench,
  Clock,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useUIStore } from '@/store/uiStore';
import { useChatStore } from '@/store/chatStore';
import { chatService } from '@/services/chatService';
import { healthService } from '@/services/healthService';
import { Card } from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';

const Settings = () => {
  const { showConfirm } = useUIStore();
  const { clearHistory, sessions } = useChatStore();



  // Load health check
  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['backendHealth'],
    queryFn: healthService.checkHealth,
    refetchInterval: 30000, // Auto-refresh every 30s
  });

  const isServerOnline = healthData?.status === 'ok';

  const handleClearHistory = async () => {
    const confirmed = await showConfirm(
      'Clear Chat History?',
      'This will remove all your saved conversations and chat sessions from this browser. You won\'t be able to recover them.'
    );
    if (confirmed) {
      clearHistory();
      toast.success('All conversations cleared successfully.');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in select-none">
      {/* Page Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold font-serif tracking-tight text-foreground flex items-center gap-2.5">
          <Wrench className="h-7 w-7 text-primary" /> Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-1.5 font-sans leading-relaxed">
          Manage your preferences and view system status.
        </p>
      </div>

      {/* Server Status Bar */}
      <Card className="bg-card border-border shadow-sm p-4 rounded-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {healthLoading ? (
              <Skeleton className="h-9 w-9 rounded-full" />
            ) : isServerOnline ? (
              <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Wifi className="h-4.5 w-4.5 text-emerald-500" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <WifiOff className="h-4.5 w-4.5 text-red-500" />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-foreground font-sans">
                {healthLoading ? 'Checking...' : isServerOnline ? 'Server is Active' : 'Server is Offline'}
              </p>
              <p className="text-[10px] text-muted-foreground font-sans">
                {healthLoading ? 'Verifying connection' : isServerOnline ? 'All systems running normally' : 'Unable to reach the backend server'}
              </p>
            </div>
          </div>
          {!healthLoading && (
            <span className={`text-[9px] font-bold font-mono uppercase px-2.5 py-1 rounded-full select-none ${
              isServerOnline 
                ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-500' 
                : 'bg-red-500/10 border border-red-500/25 text-red-500'
            }`}>
              {isServerOnline ? '● Connected' : '● Disconnected'}
            </span>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Night Mode — Coming Soon */}
        <Card className="bg-card border-border shadow-sm p-5 rounded-2xl space-y-4 relative overflow-hidden">
          <div className="space-y-1">
            <h3 className="text-xs font-bold font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <Moon className="h-4 w-4 text-primary" />
              Night Mode
            </h3>
            <p className="text-[11px] text-muted-foreground font-sans">Switch between light and dark themes</p>
          </div>
          <div className="flex items-center justify-between border-t border-border/40 pt-3.5 mt-2">
            <span className="text-xs text-muted-foreground/60 font-sans italic">Dark mode customization</span>
            <span className="text-[9px] font-bold font-mono uppercase px-3 py-1.5 rounded-full bg-primary/8 border border-primary/20 text-primary flex items-center gap-1 select-none">
              <Sparkles className="h-3 w-3" />
              Coming Soon
            </span>
          </div>
        </Card>

        {/* Clear Conversations */}
        <Card className="bg-card border-border shadow-sm p-5 rounded-2xl space-y-4">
          <div className="space-y-1">
            <h3 className="text-xs font-bold font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-primary" />
              Conversations
            </h3>
            <p className="text-[11px] text-muted-foreground font-sans">Manage your chat history</p>
          </div>
          <div className="space-y-3 border-t border-border/40 pt-3.5 mt-2">
            <p className="text-xs text-muted-foreground leading-relaxed font-sans">
              Clear all saved conversations from this device. This frees up space but cannot be undone.
            </p>
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-sans">
                  {sessions.length} {sessions.length === 1 ? 'conversation' : 'conversations'} saved
                </span>
              </div>
              <button
                onClick={handleClearHistory}
                disabled={sessions.length === 0}
                className="h-8 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/30 disabled:bg-muted disabled:text-muted-foreground disabled:border-border text-[11px] font-semibold rounded-xl transition-all cursor-pointer select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5"
              >
                <Trash2 className="h-3 w-3" />
                Clear All
              </button>
            </div>
          </div>
        </Card>
      </div>

    </div>
  );
};

export default Settings;
