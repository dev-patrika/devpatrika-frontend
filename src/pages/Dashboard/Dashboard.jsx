import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Newspaper, 
  BookOpen, 
  Github, 
  Clock, 
  Globe, 
  ArrowRight,
  RefreshCcw,
  Database,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { newsService } from '@/services/newsService';
import { githubService } from '@/services/githubService';
import { wikiService } from '@/services/wikiService';
import { reportService } from '@/services/reportService';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import Badge from '@/components/ui/Badge';

const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Load News
  const { data: news = [], isLoading: newsLoading } = useQuery({
    queryKey: ['news', 'all'],
    queryFn: () => newsService.getNews({ limit: 100 })
  });

  // Load GitHub Repos
  const { data: repos = [], isLoading: reposLoading } = useQuery({
    queryKey: ['github', 'trending'],
    queryFn: githubService.getTrendingRepos
  });

  // Load Wiki glossary
  const { data: wiki = [], isLoading: wikiLoading } = useQuery({
    queryKey: ['wiki', 'list'],
    queryFn: () => wikiService.getWikiEntries()
  });

  // Load compiled weekly digests
  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['reports', 'list'],
    queryFn: reportService.getWeeklyReports
  });

  // Manual crawl triggers
  const crawlMutation = useMutation({
    mutationFn: newsService.triggerIngest,
    onSuccess: (data) => {
      toast.success(data.detail || 'Feeds crawling started in background.');
      queryClient.invalidateQueries({ queryKey: ['news'] });
    }
  });

  // Manual weekly compiler
  const compileMutation = useMutation({
    mutationFn: reportService.compileWeeklyReport,
    onSuccess: (data) => {
      toast.success(`Weekly report compiled: ${data.title}`);
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (err) => {
      const msg = err.response?.data?.detail || 'Compilation failed. Ensure SQLite has news articles.';
      toast.error(msg);
    }
  });

  // Ingestion and compilation relative timestamps (grounded in DB)
  const getLastIngestionTime = () => {
    if (news.length === 0) return 'Not Available';
    try {
      const dates = news.map(n => new Date(n.created_at));
      const latest = new Date(Math.max(...dates));
      return formatDistanceToNow(latest, { addSuffix: true });
    } catch {
      return 'Not Available';
    }
  };

  const getLastCompilationTime = () => {
    if (reports.length === 0) return 'Not Available';
    try {
      const dates = reports.map(r => new Date(r.created_at));
      const latest = new Date(Math.max(...dates));
      return formatDistanceToNow(latest, { addSuffix: true });
    } catch {
      return 'Not Available';
    }
  };

  // Category counts metrics
  const categoryCounts = news.reduce((acc, curr) => {
    const cat = curr.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const totalNews = news.length;

  const categories = [
    { name: 'AI', color: 'text-emerald-400 stroke-emerald-500 bg-emerald-500/10' },
    { name: 'Web Dev', color: 'text-blue-400 stroke-blue-500 bg-blue-500/10' },
    { name: 'Cybersecurity', color: 'text-red-400 stroke-red-500 bg-red-500/10' },
    { name: 'Startups', color: 'text-amber-400 stroke-amber-500 bg-amber-500/10' },
    { name: 'Open Source', color: 'text-purple-400 stroke-purple-500 bg-purple-500/10' },
    { name: 'Cloud/DevOps', color: 'text-teal-400 stroke-teal-500 bg-teal-500/10' }
  ];

  const getTrendIcon = (direction) => {
    if (direction === 'up') return <TrendingUp className="h-4.5 w-4.5 text-emerald-400" />;
    if (direction === 'down') return <TrendingDown className="h-4.5 w-4.5 text-red-400" />;
    return <Minus className="h-4.5 w-4.5 text-zinc-500" />;
  };

  const isDataLoading = newsLoading || reposLoading || wikiLoading || reportsLoading;

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Vercel Grid background effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10 opacity-30 h-96" />

      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-450 bg-clip-text text-transparent">
            Developer Intelligence Radar
          </h1>
          <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
            Real-time feed analytics, AI wiki curation, and community radar tracking.
          </p>
        </div>
        <div className="flex gap-2.5">
          <Button
            variant="outline"
            className="neon-border-hover text-xs border-zinc-800"
            onClick={() => crawlMutation.mutate()}
            isLoading={crawlMutation.isPending}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Ingest Feeds
          </Button>
          <Button
            variant="secondary"
            className="neon-border-indigo-hover text-xs"
            onClick={() => compileMutation.mutate()}
            isLoading={compileMutation.isPending}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Compile Report
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Summarized Stories', count: totalNews, desc: 'Daily tech crawl feed', icon: Newspaper, color: 'text-emerald-400' },
          { title: 'Wiki glossary', count: wiki.length, desc: 'Indexed technical definitions', icon: BookOpen, color: 'text-indigo-400' },
          { title: 'GitHub Radar', count: repos.length, desc: 'Trending repositories', icon: Github, color: 'text-teal-400' },
          { title: 'AI Reports', count: reports.length, desc: 'Compiled intelligence digests', icon: Clock, color: 'text-amber-400' }
        ].map((kpi, idx) => (
          <Card key={idx} className="glass-panel border-zinc-900 hover:border-zinc-800 transition-all hover:translate-y-[-2px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-5">
              <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {kpi.title}
              </CardTitle>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent className="p-5 pt-0">
              {isDataLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-3xl font-extrabold font-mono tracking-tight text-foreground">{kpi.count}</div>
              )}
              <p className="text-[10px] text-muted-foreground mt-1.5">{kpi.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main split dashboard layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2-Span): Visual Metrics & Recent feed */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tech Category allocation chart */}
          <Card className="glass-panel border-zinc-900">
            <CardHeader className="p-6">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-350 flex items-center gap-2">
                <Layers className="h-4.5 w-4.5 text-primary" /> Category Distribution
              </CardTitle>
              <CardDescription>Percentage split of summarized tech feeds</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {isDataLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : totalNews === 0 ? (
                <div className="text-center py-10 text-xs text-muted-foreground italic border border-zinc-900/60 rounded-lg">
                  No data to analyze. Run feed ingest to populate database.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  {/* Styled SVG Gauges */}
                  <div className="space-y-4">
                    {categories.slice(0, 3).map((cat) => {
                      const count = categoryCounts[cat.name] || 0;
                      const pct = totalNews > 0 ? Math.round((count / totalNews) * 100) : 0;
                      return (
                        <div key={cat.name} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-zinc-300">{cat.name}</span>
                            <span className="font-mono text-muted-foreground">{pct}%</span>
                          </div>
                          <div className="w-full bg-zinc-900 border border-zinc-800 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-full rounded-full ${cat.color.split(' ')[0]}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-4">
                    {categories.slice(3).map((cat) => {
                      const count = categoryCounts[cat.name] || 0;
                      const pct = totalNews > 0 ? Math.round((count / totalNews) * 100) : 0;
                      return (
                        <div key={cat.name} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-zinc-300">{cat.name}</span>
                            <span className="font-mono text-muted-foreground">{pct}%</span>
                          </div>
                          <div className="w-full bg-zinc-900 border border-zinc-800 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-full rounded-full ${cat.color.split(' ')[0]}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Ingestion Alerts */}
          <Card className="glass-panel border-zinc-900">
            <CardHeader className="flex flex-row items-center justify-between p-6">
              <div>
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-350 flex items-center gap-2">
                  <Activity className="h-4.5 w-4.5 text-emerald-400" /> Ingestion Activity Log
                </CardTitle>
                <CardDescription>Latest raw alerts analyzed by AI</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/feed')}
              >
                Feed Archive <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {isDataLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : news.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-6">Ecosystem index empty.</p>
              ) : (
                <div className="divide-y divide-zinc-900">
                  {news.slice(0, 4).map((item) => (
                    <div 
                      key={item.id} 
                      className="py-3 flex items-center justify-between group cursor-pointer"
                      onClick={() => navigate(`/feed?news_id=${item.id}`)}
                    >
                      <div className="flex flex-col gap-0.5 min-w-0 pr-4">
                        <span className="text-xs font-bold text-zinc-200 truncate group-hover:text-primary transition-colors">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-2 font-mono">
                          <Globe className="h-3 w-3" /> {item.source} • {new Date(item.published_at).toLocaleDateString()}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[9px] uppercase font-mono tracking-wider bg-zinc-950 border-zinc-800 text-zinc-400 shrink-0">
                        {item.category || 'AI'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Database Stats, Timestamps, and Trending Concepts */}
        <div className="space-y-6">
          {/* Engine Status & DB Statistics */}
          <Card className="glass-panel border-zinc-900">
            <CardHeader className="p-6">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-350 flex items-center gap-2">
                <Database className="h-4.5 w-4.5 text-indigo-400" /> Database Statistics
              </CardTitle>
              <CardDescription>SQLite persistent row indexes</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-3.5 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-zinc-900/60 font-mono">
                <span className="text-zinc-400">Last crawled ingest</span>
                <span className="text-zinc-355 font-semibold text-[10px]">
                  {getLastIngestionTime()}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-zinc-900/60 font-mono">
                <span className="text-zinc-400">Last report compiled</span>
                <span className="text-zinc-355 font-semibold text-[10px]">
                  {getLastCompilationTime()}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-zinc-900/60 font-mono">
                <span className="text-zinc-400">Wiki terms vector indexed</span>
                <span className="text-primary font-bold">{wiki.length} terms</span>
              </div>
              <div className="flex justify-between items-center py-1.5 font-mono">
                <span className="text-zinc-400">Radar GitHub Repos</span>
                <span className="text-teal-400 font-bold">{repos.length} repos</span>
              </div>
            </CardContent>
          </Card>

          {/* Trending Tech Radar */}
          <Card className="glass-panel border-zinc-900">
            <CardHeader className="p-6">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-350 flex items-center gap-2">
                <TrendingUp className="h-4.5 w-4.5 text-teal-400" /> Trending Tech Radar
              </CardTitle>
              <CardDescription>Glossary terms mention trajectory</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-3">
              {isDataLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : wiki.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-6">No glossary terms created.</p>
              ) : (
                wiki.slice(0, 5).map((term) => (
                  <div 
                    key={term.id}
                    className="p-3 bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 rounded-lg flex items-center justify-between cursor-pointer transition-colors group"
                    onClick={() => navigate(`/wiki?term=${encodeURIComponent(term.term)}`)}
                  >
                    <div className="flex flex-col gap-0.5 min-w-0 pr-3">
                      <span className="text-xs font-bold text-zinc-200 font-mono group-hover:text-primary transition-colors">
                        {term.term}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate">
                        {term.definition}
                      </span>
                    </div>
                    {getTrendIcon(term.why_trending.toLowerCase().includes('popular') || term.why_trending.toLowerCase().includes('increasing') ? 'up' : 'stable')}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
