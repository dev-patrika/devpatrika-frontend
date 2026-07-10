import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Trash2, 
  Sun, 
  Moon, 
  Server, 
  Cpu, 
  ShieldCheck,
  Wrench,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useUIStore } from '@/store/uiStore';
import { useChatStore } from '@/store/chatStore';
import { chatService } from '@/services/chatService';
import { healthService } from '@/services/healthService';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';

const Settings = () => {
  const { theme, toggleTheme } = useUIStore();
  const { clearHistory, sessions } = useChatStore();

  // Load backend models
  const { data: models = [], isLoading: modelsLoading } = useQuery({
    queryKey: ['ai', 'models'],
    queryFn: chatService.getChatModels
  });

  // Load health check
  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['backendHealth'],
    queryFn: healthService.checkHealth
  });

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to delete all persistent chat conversations and sessions? This cannot be undone.')) {
      clearHistory();
      toast.success('Persistent chat memories cleared successfully.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in select-none">
      {/* Page Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold font-serif tracking-tight text-foreground flex items-center gap-2.5">
          <Wrench className="h-7 w-7 text-primary" /> Platform Configurations
        </h1>
        <p className="text-xs text-muted-foreground mt-1.5 font-sans leading-relaxed">
          Manage local cache buffers, review connected backend runtimes, and edit visual layouts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Client settings */}
        <div className="space-y-6">
          {/* Appearance setting */}
          <Card className="bg-card border-border shadow-sm p-5 rounded-2xl space-y-4">
            <div className="space-y-1">
              <h3 className="text-xs font-bold font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                {theme === 'dark' ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />}
                Appearance Theme
              </h3>
              <p className="text-[11px] text-muted-foreground font-sans">Toggle user interface colors</p>
            </div>
            <div className="flex items-center justify-between border-t border-border/40 pt-3.5 mt-2">
              <span className="text-xs text-foreground/80 font-sans">Default to developer pitch dark mode</span>
              <button
                onClick={toggleTheme}
                className="h-8.5 px-4 bg-card border border-border hover:bg-muted/50 text-xs font-bold rounded-xl transition-all cursor-pointer select-none active:scale-98"
              >
                {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
              </button>
            </div>
          </Card>

          {/* Database Cache settings */}
          <Card className="bg-card border-border shadow-sm p-5 rounded-2xl space-y-4">
            <div className="space-y-1">
              <h3 className="text-xs font-bold font-mono text-primary uppercase tracking-widest flex items-center gap-1.5">
                <Trash2 className="h-4 w-4" />
                Data Purging & Cache
              </h3>
              <p className="text-[11px] text-muted-foreground font-sans">Clear chat memory databases</p>
            </div>
            <div className="space-y-4 border-t border-border/40 pt-3.5 mt-2">
              <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                Clearing history removes all custom session names and RAG messages saved in your browser's LocalStorage buffer.
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-primary font-mono font-bold bg-primary/5 px-2 py-0.5 border border-primary/20 rounded-full">
                  Active Local Threads: {sessions.length}
                </span>
                <button
                  onClick={handleClearHistory}
                  disabled={sessions.length === 0}
                  className="h-8.5 px-4 bg-primary hover:bg-primary/95 text-white disabled:bg-muted text-xs font-bold rounded-xl transition-all cursor-pointer select-none active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
                >
                  Purge Cache Memory
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Server configurations */}
        <div className="space-y-6">
          {/* Health Service Connection */}
          <Card className="bg-card border-border shadow-sm p-5 rounded-2xl space-y-4">
            <div className="space-y-1">
              <h3 className="text-xs font-bold font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Server className="h-4 w-4 text-primary" />
                FastAPI Health Status
              </h3>
              <p className="text-[11px] text-muted-foreground font-sans">Connected endpoint server metrics</p>
            </div>
            <div className="space-y-2.5 border-t border-border/40 pt-3.5 mt-2 text-xs font-sans">
              <div className="flex justify-between items-center py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Status</span>
                {healthLoading ? (
                  <Skeleton className="h-4 w-12" />
                ) : healthData?.status === 'ok' ? (
                  <span className="bg-primary/10 border border-primary/25 text-primary text-[8.5px] font-bold font-mono uppercase px-2 py-0.5 rounded-full select-none">Online</span>
                ) : (
                  <span className="bg-red-500/10 border border-red-500/25 text-red-500 text-[8.5px] font-bold font-mono uppercase px-2 py-0.5 rounded-full select-none">Offline</span>
                )}
              </div>
              
              <div className="flex justify-between items-center py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Database Connection</span>
                {healthLoading ? (
                  <Skeleton className="h-4 w-12" />
                ) : healthData?.database === 'connected' ? (
                  <span className="text-foreground font-semibold flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4 text-primary" /> SQLite Active
                  </span>
                ) : (
                  <span className="text-red-500">Disconnected</span>
                )}
              </div>

              <div className="flex justify-between items-center py-1.5">
                <span className="text-muted-foreground">API Proxy Target</span>
                <span className="font-mono text-[9.5px] text-foreground bg-muted px-2 py-0.5 border border-border rounded-md">
                  {import.meta.env.VITE_API_URL || '/api proxy ➔ http://127.0.0.1:8000'}
                </span>
              </div>
            </div>
          </Card>

          {/* Available LLM models checklist */}
          <Card className="bg-card border-border shadow-sm p-5 rounded-2xl space-y-4">
            <div className="space-y-1">
              <h3 className="text-xs font-bold font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Cpu className="h-4 w-4 text-primary" />
                Active LLM Models
              </h3>
              <p className="text-[11px] text-muted-foreground font-sans">Available AI providers on the backend</p>
            </div>
            <div className="space-y-3.5 border-t border-border/40 pt-3.5 mt-2">
              {modelsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                </div>
              ) : models.length === 0 ? (
                <p className="text-xs text-muted-foreground italic font-sans">No active models detected. Ensure GROQ_API_KEY and GEMINI_API_KEY are configured in the backend `.env` file.</p>
              ) : (
                <div className="space-y-2">
                  {models.map((m) => (
                    <div key={m.model} className="flex items-center justify-between text-xs p-2 bg-muted/40 rounded-xl border border-border">
                      <span className="font-mono font-bold text-foreground">{m.model}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9.5px] text-muted-foreground font-semibold font-mono">{m.provider}</span>
                        {m.status === 'active' ? (
                          <span className="bg-primary/10 border border-primary/25 text-primary text-[8px] font-bold font-mono px-1.5 py-0.2 rounded-full uppercase">Active</span>
                        ) : (
                          <span className="bg-muted border border-border text-muted-foreground text-[8px] font-bold font-mono px-1.5 py-0.2 rounded-full uppercase">Inactive</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
