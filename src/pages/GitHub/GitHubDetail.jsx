import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Github, 
  Star, 
  Clock, 
  ArrowLeft,
  Sparkles,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { githubService } from '@/services/githubService';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';

const GitHubDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch repository details from backend
  const { data: repo, isLoading, isError } = useQuery({
    queryKey: ['github', 'repo', id],
    queryFn: () => githubService.getRepoDetails(id),
    enabled: !!id
  });

  const getLanguageColor = (lang) => {
    if (!lang) return 'bg-zinc-500';
    const colors = {
      javascript: 'bg-yellow-500',
      typescript: 'bg-blue-400',
      python: 'bg-sky-500',
      go: 'bg-cyan-400',
      rust: 'bg-orange-500',
      c: 'bg-gray-400',
      'c++': 'bg-pink-500',
      html: 'bg-red-400',
      css: 'bg-purple-400',
      java: 'bg-amber-600',
      shell: 'bg-lime-450'
    };
    return colors[lang.toLowerCase()] || 'bg-zinc-400';
  };

  const detectLanguage = (repoData) => {
    if (!repoData) return 'Not Available';
    const text = ((repoData.repo_name || '') + ' ' + (repoData.description || '')).toLowerCase();
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

  const formatStars = (count) => {
    if (!count) return '0';
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count.toString();
  };

  const renderInlineFormatting = (text) => {
    if (!text) return '';
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-extrabold text-foreground">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={idx} className="italic text-muted-foreground">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={idx} className="bg-muted px-1.5 py-0.5 rounded text-[10px] text-primary font-mono">{part.slice(1, -1)}</code>;
      }
      if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
        const match = part.match(/\[(.*?)\]\((.*?)\)/);
        if (match) {
          const [_, linkText, linkUrl] = match;
          return (
            <a
              key={idx}
              href={linkUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-0.5 font-bold cursor-pointer"
            >
              {linkText}
            </a>
          );
        }
      }
      return <span key={idx}>{part}</span>;
    });
  };

  // Format the assessment brief markdown-like structure
  const formatAssessment = (text) => {
    if (!text) return 'No AI assessment compiled yet.';
    
    const lines = text.split('\n');
    return (
      <div className="space-y-4 text-foreground/80 text-xs leading-relaxed font-sans text-justify">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return null;

          if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
            return (
              <li key={idx} className="ml-4 list-disc pl-1 marker:text-primary">
                {renderInlineFormatting(trimmed.replace(/^[*-]\s*/, ''))}
              </li>
            );
          }

          if (trimmed.startsWith('**') && trimmed.includes(':**')) {
            const parts = trimmed.split(/:\*\*\s*(.*)/s);
            if (parts.length >= 2) {
              const label = parts[0].replace(/^\*\*|\*\*$/g, '');
              const val = parts[1];
              return (
                <div key={idx} className="mt-3 first:mt-0 space-y-1">
                  <span className="inline-block font-mono text-[8.5px] font-bold text-primary bg-primary/5 px-2 py-0.5 border border-primary/20 rounded-md uppercase tracking-wider">
                    {label}
                  </span>
                  <p className="text-xs text-foreground/80 leading-relaxed pl-0.5">
                    {renderInlineFormatting(val)}
                  </p>
                </div>
              );
            }
          }

          return (
            <p key={idx} className="my-1.5">
              {renderInlineFormatting(trimmed)}
            </p>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-4 animate-pulse">
        <div className="h-6 w-24 bg-muted rounded" />
        <div className="h-10 w-3/4 bg-muted rounded" />
        <div className="h-24 w-full bg-muted rounded" />
        <div className="h-64 w-full bg-muted rounded mt-6" />
      </div>
    );
  }

  if (isError || !repo) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 space-y-4">
        <h2 className="text-xl font-bold font-serif text-foreground">Failed to Load Repository</h2>
        <p className="text-xs text-muted-foreground font-sans">The requested repository details could not be retrieved.</p>
        <Button variant="primary" onClick={() => navigate('/github')}>
          Return to Radar
        </Button>
      </div>
    );
  }

  const detectedLang = detectLanguage(repo);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/github')} 
        className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors group cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Radar
      </button>

      {/* Detail Card Header */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black font-serif text-foreground leading-tight tracking-tight">
            {repo.repo_name}
          </h1>

          <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed font-sans text-justify">
            {repo.description || 'No description listed by the author.'}
          </p>
        </div>

        {/* Metadata Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-muted/30">
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-mono">
            <span className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-primary fill-primary/20" /> {formatStars(repo.stars_count)} Stars
            </span>

            {detectedLang !== 'Not Available' && (
              <span className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${getLanguageColor(detectedLang)}`} />
                {detectedLang}
              </span>
            )}

            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" /> Tracked {new Date(repo.created_at).toLocaleDateString()}
            </span>
          </div>

          <div>
            <a
              href={repo.repo_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl transition-all shadow-sm cursor-pointer select-none active:scale-98"
            >
              <Github className="h-4 w-4" /> Visit GitHub Repo <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* AI Significance Assessment */}
        {repo.why_it_matters_summary && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2 text-primary font-mono text-[10px] uppercase font-bold">
              <Sparkles className="h-4.5 w-4.5" /> AI Significance Assessment
            </div>
            <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border shadow-sm">
              {formatAssessment(repo.why_it_matters_summary)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GitHubDetail;
