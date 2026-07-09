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
  FilterX
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

  // Load trending repos from backend
  const { data: repos = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['github', 'trending'],
    queryFn: githubService.getTrendingRepos
  });

  const getLanguageColor = (lang) => {
    if (!lang) return 'bg-zinc-650';
    const colors = {
      javascript: 'bg-yellow-450',
      typescript: 'bg-blue-400',
      python: 'bg-sky-500',
      go: 'bg-cyan-400',
      rust: 'bg-orange-500',
      c: 'bg-gray-400',
      'c++': 'bg-pink-500',
      html: 'bg-red-400',
      css: 'bg-purple-400',
      java: 'bg-amber-600',
      shell: 'bg-lime-400'
    };
    return colors[lang.toLowerCase()] || 'bg-zinc-400';
  };

  // Estimate language from description/name keywords
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-tight text-foreground flex items-center gap-2">
            <Github className="h-6 w-6 text-primary" /> Open Source Radar
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Tracking daily trending repositories and summarizing structural impacts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono bg-zinc-900 border-zinc-800 text-zinc-400">
            Realtime DB Stats Only
          </Badge>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-zinc-950/60 p-4 rounded-xl border border-zinc-900 glass-panel">
        <div className="w-full sm:flex-1">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by repo name or keyword..."
            leftIcon={<Search className="h-4 w-4" />}
            className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary text-sm"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleSortChange}
            className="flex-1 sm:flex-none h-9 text-xs border-zinc-800"
          >
            <ArrowUpDown className="h-3.5 w-3.5 mr-2" />
            Sort: {sortBy === 'stars-desc' ? 'Stars (High)' : sortBy === 'stars-asc' ? 'Stars (Low)' : 'Name'}
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-panel border-zinc-900 p-6 space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-16 w-full" />
          </Card>
          <Card className="glass-panel border-zinc-900 p-6 space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-16 w-full" />
          </Card>
        </div>
      ) : isError ? (
        <div className="text-center py-12 bg-zinc-950/30 rounded-xl border border-zinc-900 flex flex-col items-center gap-3">
          <FilterX className="h-8 w-8 text-red-500" />
          <p className="text-muted-foreground text-sm">Error connecting to GitHub Radar API.</p>
          <Button variant="outline" size="sm" onClick={refetch}>Retry Connection</Button>
        </div>
      ) : filteredRepos.length === 0 ? (
        <div className="text-center py-20 bg-zinc-950/30 rounded-xl border border-zinc-900 flex flex-col items-center gap-3">
          <Github className="h-8 w-8 text-zinc-650 animate-pulse" />
          <p className="text-muted-foreground text-sm font-semibold">No repositories tracked.</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            Run the pipeline inside Settings or Dashboard to scrape and index trending GitHub projects.
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
                className="glass-panel border-zinc-900 hover:border-zinc-800 cursor-pointer transition-all flex flex-col justify-between group overflow-hidden h-44 hover:shadow-lg hover:shadow-emerald-500/[0.01]"
              >
                <div className="p-5 space-y-2.5 flex-1">
                  {/* Title */}
                  <h2 className="text-sm font-bold font-mono tracking-tight text-zinc-200 group-hover:text-primary transition-colors truncate">
                    {repo.repo_name}
                  </h2>

                  {/* Description - 1 Line clamp */}
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-1">
                    {repo.description || 'No description listed.'}
                  </p>
                </div>

                {/* Footer Metadata */}
                <div className="px-5 py-3 bg-zinc-950/60 border-t border-zinc-900/60 flex items-center justify-between text-[9px] text-muted-foreground font-mono">
                  <div className="flex items-center gap-3">
                    {/* Stars */}
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" /> {formatStars(repo.stars_count)}
                    </span>
                    
                    {/* Language dot */}
                    {detectedLang !== 'Not Available' && (
                      <span className="flex items-center gap-1">
                        <span className={`h-2 w-2 rounded-full ${getLanguageColor(detectedLang)}`} />
                        {detectedLang}
                      </span>
                    )}
                  </div>

                  <span className="opacity-60">
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
