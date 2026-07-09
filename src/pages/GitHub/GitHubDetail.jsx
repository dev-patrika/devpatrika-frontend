import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Github, 
  Star, 
  Clock, 
  ArrowLeft,
  Sparkles,
  ExternalLink
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

  // Format the assessment brief markdown-like structure
  const formatAssessment = (text) => {
    if (!text) return 'No AI assessment compiled yet.';
    
    // Split by common sections if they exist, or render as paragraphs
    const lines = text.split('\n');
    return (
      <div className="space-y-4 text-zinc-300 text-sm leading-relaxed font-sans">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('**Overview**') || trimmed.startsWith('**Key Details**') || trimmed.startsWith('**Community & Traction**')) {
            // Find colon and highlight section label
            const colonIndex = trimmed.indexOf(':');
            if (colonIndex !== -1) {
              const label = trimmed.slice(0, colonIndex + 1);
              const rest = trimmed.slice(colonIndex + 1);
              return (
                <p key={idx} className="my-2.5">
                  <span className="text-primary font-bold">{label}</span>
                  {rest}
                </p>
              );
            }
          }
          if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
            return (
              <li key={idx} className="ml-4 list-disc pl-1 marker:text-primary">
                {trimmed.replace(/^[*-]\s*/, '')}
              </li>
            );
          }
          return trimmed ? <p key={idx} className="my-1.5">{trimmed}</p> : null;
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-4 animate-pulse">
        <div className="h-6 w-24 bg-zinc-900 rounded" />
        <div className="h-10 w-3/4 bg-zinc-900 rounded" />
        <div className="h-24 w-full bg-zinc-900 rounded" />
        <div className="h-64 w-full bg-zinc-900 rounded mt-6" />
      </div>
    );
  }

  if (isError || !repo) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-zinc-200">Failed to Load Repository</h2>
        <p className="text-sm text-muted-foreground">The requested repository details could not be retrieved.</p>
        <Button variant="outline" onClick={() => navigate('/github')}>
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
        className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Radar
      </button>

      {/* Detail Card Header */}
      <div className="space-y-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-150 leading-tight tracking-tight font-mono">
          {repo.repo_name}
        </h1>

        <p className="text-sm text-zinc-400 leading-relaxed font-sans">
          {repo.description || 'No description listed by the author.'}
        </p>

        {/* Metadata Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-zinc-900 bg-zinc-950/60 glass-panel">
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-mono">
            <span className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /> {formatStars(repo.stars_count)} Stars
            </span>

            {detectedLang !== 'Not Available' && (
              <span className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${getLanguageColor(detectedLang)}`} />
                {detectedLang}
              </span>
            )}

            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Tracked {new Date(repo.created_at).toLocaleDateString()}
            </span>
          </div>

          <div>
            <a
              href={repo.repo_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              <Github className="h-4 w-4" /> Visit GitHub Repo <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* AI Significance Assessment */}
        {repo.why_it_matters_summary && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-4.5 w-4.5" />
              <span className="text-xs font-extrabold uppercase tracking-wider font-mono">AI Significance Assessment</span>
            </div>
            <div className="bg-zinc-950/40 p-6 sm:p-8 rounded-xl border border-zinc-900/80 shadow-md">
              {formatAssessment(repo.why_it_matters_summary)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GitHubDetail;
