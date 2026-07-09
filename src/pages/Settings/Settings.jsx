import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Trash2, 
  Sun, 
  Moon, 
  Server, 
  Cpu, 
  ShieldCheck 
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
    <div className="space-y-6 max-w-4xl animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Platform Configurations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage local cache buffers, review connected backend runtimes, and edit visual layouts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Client settings */}
        <div className="space-y-6">
          {/* Appearance setting */}
          <Card className="glass-panel border-zinc-900">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                {theme === 'dark' ? <Moon className="h-4.5 w-4.5 text-indigo-400" /> : <Sun className="h-4.5 w-4.5 text-amber-400" />}
                Appearance Theme
              </CardTitle>
              <CardDescription>Toggle user interface colors</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-xs text-zinc-300">Default to developer pitch dark mode</span>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="h-8 border-zinc-800"
              >
                {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
              </Button>
            </CardContent>
          </Card>

          {/* Database Cache settings */}
          <Card className="glass-panel border-zinc-900">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2 text-red-400">
                <Trash2 className="h-4.5 w-4.5" />
                Data Purging & Cache
              </CardTitle>
              <CardDescription>Clear chat memory databases</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Clearing history removes all custom session names and RAG messages saved in your browser's LocalStorage buffer.
              </p>
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-zinc-300 font-mono">
                  Active Local Threads: {sessions.length}
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearHistory}
                  disabled={sessions.length === 0}
                  className="h-8"
                >
                  Purge Cache Memory
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Server configurations */}
        <div className="space-y-6">
          {/* Health Service Connection */}
          <Card className="glass-panel border-zinc-900">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                <Server className="h-4.5 w-4.5 text-primary" />
                FastAPI Health Status
              </CardTitle>
              <CardDescription>Connected endpoint server metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-zinc-900/60">
                <span className="text-zinc-400">Status</span>
                {healthLoading ? (
                  <Skeleton className="h-4 w-12" />
                ) : healthData?.status === 'ok' ? (
                  <Badge variant="success">Online</Badge>
                ) : (
                  <Badge variant="danger">Offline</Badge>
                )}
              </div>
              
              <div className="flex justify-between items-center py-1.5 border-b border-zinc-900/60">
                <span className="text-zinc-400">Database Connection</span>
                {healthLoading ? (
                  <Skeleton className="h-4 w-12" />
                ) : healthData?.database === 'connected' ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" /> SQLite Active
                  </span>
                ) : (
                  <span className="text-red-400">Disconnected</span>
                )}
              </div>

              <div className="flex justify-between items-center py-1.5">
                <span className="text-zinc-400">API Proxy Target</span>
                <span className="font-mono text-[10px] text-zinc-300">
                  {import.meta.env.VITE_API_URL || '/api proxy ➔ http://127.0.0.1:8000'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Available LLM models checklist */}
          <Card className="glass-panel border-zinc-900">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                <Cpu className="h-4.5 w-4.5 text-indigo-400" />
                Active LLM Models
              </CardTitle>
              <CardDescription>Available AI providers on the backend</CardDescription>
            </CardHeader>
            <CardContent>
              {modelsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                </div>
              ) : models.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No active models detected. Ensure GROQ_API_KEY and GEMINI_API_KEY are configured in the backend `.env` file.</p>
              ) : (
                <div className="space-y-2.5">
                  {models.map((m) => (
                    <div key={m.model} className="flex items-center justify-between text-xs p-2 bg-zinc-900/30 rounded border border-zinc-900">
                      <span className="font-mono font-bold text-zinc-300">{m.model}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground font-semibold">{m.provider}</span>
                        {m.status === 'active' ? (
                          <Badge variant="success" className="text-[8px] px-1 py-0">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[8px] px-1 py-0 text-zinc-500 border-zinc-800">Inactive</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
