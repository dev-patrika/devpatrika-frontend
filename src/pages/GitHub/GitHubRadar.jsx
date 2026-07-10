import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Github, 
  Star, 
  ExternalLink, 
  Search, 
  Sparkles,
  ArrowUpDown,
  FilterX,
  Activity
} from 'lucide-react';
import { githubService } from '@/services/githubService';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import Badge from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

const GitHubRadar = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('stars-desc'); // stars-desc, stars-asc, name-asc
  const [timeframe, setTimeframe] = useState('24h');

  // Load trending repos from backend
  const { data: repos = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['github', 'trending'],
    queryFn: githubService.getTrendingRepos
  });

  const detectLanguage = (repo) => {
    const text = ((repo.repo_name || '') + ' ' + (repo.description || '')).toLowerCase();
    if (text.includes('typescript') || text.includes('ts ')) return 'TypeScript';
    if (text.includes('javascript') || text.includes('js ') || text.includes('react')) return 'JavaScript';
    if (text.includes('python') || text.includes('py ') || text.includes('django')) return 'Python';
    if (text.includes('rust ') || text.includes('cargo') || text.includes('rs ')) return 'Rust';
    if (text.includes('golang') || text.includes('go ') || text.includes('go-')) return 'Go';
    if (text.includes('css ') || text.includes('tailwind') || text.includes('sass')) return 'CSS';
    if (text.includes('cpp') || text.includes('c++')) return 'C++';
    if (text.includes('shell') || text.includes('bash')) return 'Shell';
    return 'Not Available';
  };

  const handleSortChange = () => {
    if (sortBy === 'stars-desc') setSortBy('stars-asc');
    else if (sortBy === 'stars-asc') setSortBy('name-asc');
    else setSortBy('stars-desc');
  };

  const formatStars = (count) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
  };

  // Client-side filtering & sorting
  const filteredRepos = repos
    .filter(repo => 
      repo.repo_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'stars-desc') return b.stars_count - a.stars_count;
      if (sortBy === 'stars-asc') return a.stars_count - b.stars_count;
      return a.repo_name.localeCompare(b.repo_name);
    });

  // Calculate stats from loaded repos
  const totalStars = repos.reduce((acc, curr) => acc + (curr.stars_count || 0), 0);
  const formattedTotalStars = totalStars >= 1000000 
    ? (totalStars / 1000000).toFixed(1) + 'M+' 
    : (totalStars / 1000).toFixed(0) + 'k+';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-border pb-6">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold font-serif tracking-tight text-foreground flex items-center gap-2.5">
            <Github className="h-7 w-7 text-primary" /> GitHub Radar
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
            Real-time intelligence on emerging software architectures, trending repositories, and the underlying shifts in the developer ecosystem.
          </p>
        </div>
        
        {/* Right Header Stats Info Box */}
        <div className="flex gap-3.5 shrink-0 select-none">
          <div className="bg-muted px-4 py-2 rounded-xl border border-border">
            <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">Global Stars</span>
            <span className="text-sm font-bold font-serif text-primary">{repos.length > 0 ? formattedTotalStars : '1.2M+'}</span>
          </div>
          <div className="bg-muted px-4 py-2 rounded-xl border border-border">
            <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">Trending Langs</span>
            <span className="text-sm font-bold font-serif">Rust, TS, Go</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/30 p-3.5 rounded-2xl border border-border select-none">
        
        {/* Timeframe selector */}
        <div className="flex gap-1.5 bg-muted p-1 rounded-full border border-border w-full md:w-auto">
          {['Last 24h', 'Week', 'Month'].map((t) => {
            const code = t === 'Last 24h' ? '24h' : t;
            return (
              <button
                key={t}
                onClick={() => setTimeframe(code)}
                className={`flex-1 md:flex-none px-3.5 py-1 text-[10px] font-bold font-sans rounded-full transition-all cursor-pointer ${
                  timeframe === code 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* Sort Trigger */}
        <div className="flex flex-col sm:flex-row items-center justify-between w-full md:w-auto gap-4">
          <div className="w-full sm:w-60">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search repositories..."
              leftIcon={<Search className="h-3.5 w-3.5" />}
              className="bg-card border-border focus-visible:ring-primary text-xs h-8.5 rounded-xl"
            />
          </div>

          <div className="flex items-center justify-center w-full sm:w-auto gap-1.5 bg-card border border-border rounded-xl px-3 py-1.5 text-[10px] font-bold shrink-0">
            <span className="text-muted-foreground uppercase tracking-wider font-mono">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-foreground focus:outline-none cursor-pointer pr-1"
            >
              <option value="stars-desc" className="bg-background text-foreground">Velocity</option>
              <option value="stars-asc" className="bg-background text-foreground">Lowest Stars</option>
              <option value="name-asc" className="bg-background text-foreground">Alphabetical</option>
            </select>
          </div>
        </div>

      </div>

      {/* Main Repos Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Card className="bg-card border-border p-5 space-y-4 rounded-2xl h-60">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-16 w-full" />
          </Card>
          <Card className="bg-card border-border p-5 space-y-4 rounded-2xl h-60">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-16 w-full" />
          </Card>
        </div>
      ) : isError ? (
        <div className="text-center py-12 bg-muted/20 rounded-2xl border border-border flex flex-col items-center gap-3">
          <FilterX className="h-8 w-8 text-red-500" />
          <p className="text-muted-foreground text-sm font-semibold">Error connecting to GitHub Radar API.</p>
          <Button variant="outline" size="sm" onClick={refetch}>Retry Connection</Button>
        </div>
      ) : filteredRepos.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 rounded-2xl border border-border flex flex-col items-center gap-3">
          <Github className="h-8 w-8 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground text-sm font-bold">No repositories matched.</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            Try adjusting your search query or run index updates.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRepos.map((repo) => {
            const detectedLang = detectLanguage(repo);
            return (
              <Card 
                key={repo.id}
                onClick={() => navigate(`/github/${repo.id}`)}
                className="bg-card hover:bg-muted/10 border-border hover:border-primary/20 cursor-pointer transition-all flex flex-col justify-between group overflow-hidden shadow-sm hover:shadow-md p-5 rounded-2xl h-60"
              >
                <div className="space-y-2.5">
                  {/* Header Title & Stars */}
                  <div className="flex justify-between items-start gap-3">
                    <h2 className="text-sm font-bold font-serif text-foreground group-hover:text-primary transition-colors leading-snug truncate pr-2">
                      {repo.repo_name}
                    </h2>
                    <span className="bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-full text-[9px] font-bold font-sans flex items-center gap-0.5 shrink-0">
                      ★ {formatStars(repo.stars_count)}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-sans">
                    {repo.description || 'No description listed.'}
                  </p>

                  {/* Why it matters Box */}
                  {repo.why_it_matters_summary && (
                    <div className="p-2 bg-muted/40 rounded-xl border border-border text-[10px] leading-relaxed text-foreground animate-fade-in">
                      <span className="font-serif italic font-bold text-[9.5px] block text-primary mb-0.5">Why it matters</span>
                      <p className="line-clamp-2 text-zinc-650 font-sans leading-snug">
                        {repo.why_it_matters_summary.replace(/^(Why it matters:?\s*|###\s*Why it matters:?\s*)/i, '')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Metadata */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono border-t border-border/40 pt-2.5 mt-1.5 shrink-0">
                  <div className="flex items-center gap-2">
                    {detectedLang !== 'Not Available' && (
                      <span className="bg-muted px-2.5 py-0.5 rounded-full border border-border text-[9px]">
                        {detectedLang}
                      </span>
                    )}
                    <span className="bg-muted px-2.5 py-0.5 rounded-full border border-border text-[9px]">
                      {repo.forks_count || '0'} F
                    </span>
                  </div>
                  
                  <span className="opacity-60 text-[9px]">
                    {new Date(repo.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GitHubRadar;
