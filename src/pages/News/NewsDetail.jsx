import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Globe, 
  Clock, 
  ExternalLink,
  BookOpen,
  ArrowLeft,
  Bookmark,
  Share2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { newsService } from '@/services/newsService';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';

const NewsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Local bookmarks state
  const [bookmarks, setBookmarks] = useState(() => {
    return JSON.parse(localStorage.getItem('bookmarked_news') || '[]');
  });

  // Fetch target article details
  const { data: newsItem, isLoading, isError } = useQuery({
    queryKey: ['news', id],
    queryFn: () => newsService.getNewsItem(id),
    enabled: !!id
  });

  // Fetch related articles
  const { data: related = [], isLoading: relatedLoading } = useQuery({
    queryKey: ['news', 'related', id],
    queryFn: () => newsService.getRelatedNews(id),
    enabled: !!id
  });

  // Toggle bookmark in localStorage
  const handleToggleBookmark = (item) => {
    let updated;
    if (bookmarks.some(b => b.id === item.id)) {
      updated = bookmarks.filter(b => b.id !== item.id);
      toast.success('Removed bookmark');
    } else {
      updated = [...bookmarks, item];
      toast.success('Bookmarked story');
    }
    setBookmarks(updated);
    localStorage.setItem('bookmarked_news', JSON.stringify(updated));
  };

  // Copy shareable link
  const handleShareStory = (item) => {
    const shareUrl = `${window.location.origin}/news/${item.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Shareable link copied to clipboard!');
  };

  // Estimate reading time
  const getReadingTime = (text) => {
    if (!text) return '1 min read';
    const words = text.split(/\s+/).length;
    const minutes = Math.max(1, Math.round(words / 180));
    return `${minutes} min read`;
  };

  // Format summary markdown
  const formatSummary = (summaryText) => {
    if (!summaryText) return 'No AI summary generated yet. Run the AI pipeline to analyze.';
    
    const lines = summaryText.split('\n');
    return (
      <div className="space-y-4 text-zinc-300 text-sm leading-relaxed font-sans">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
            return (
              <li key={idx} className="ml-4 list-disc pl-1 marker:text-primary">
                {trimmed.replace(/^[*-]\s*/, '')}
              </li>
            );
          }
          if (trimmed.startsWith('###')) {
            return (
              <h4 key={idx} className="text-zinc-100 font-bold text-xs mt-4 uppercase tracking-wider text-primary">
                {trimmed.replace(/^###\s*/, '')}
              </h4>
            );
          }
          if (trimmed.startsWith('##')) {
            return (
              <h3 key={idx} className="text-zinc-50 font-bold text-sm mt-5 uppercase border-b border-zinc-900 pb-1.5 text-zinc-200">
                {trimmed.replace(/^##\s*/, '')}
              </h3>
            );
          }
          return trimmed ? <p key={idx} className="my-1.5">{trimmed}</p> : null;
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto p-4 animate-pulse">
        <div className="h-6 w-24 bg-zinc-900 rounded" />
        <div className="h-10 w-3/4 bg-zinc-900 rounded" />
        <div className="h-6 w-1/2 bg-zinc-900 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2 h-96 bg-zinc-900 rounded" />
          <div className="h-96 bg-zinc-900 rounded" />
        </div>
      </div>
    );
  }

  if (isError || !newsItem) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-zinc-200">Failed to Load Article</h2>
        <p className="text-sm text-muted-foreground">The requested article could not be retrieved from the database.</p>
        <Button variant="outline" onClick={() => navigate('/feed')}>
          Return to Feed
        </Button>
      </div>
    );
  }

  const isBookmarked = bookmarks.some(b => b.id === newsItem.id);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* Back Header */}
      <button 
        onClick={() => navigate('/feed')} 
        className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Feed
      </button>

      {/* Main Container */}
      <div className="space-y-6">
        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-150 leading-tight tracking-tight">
          {newsItem.title}
        </h1>

        {/* Metadata Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-zinc-900 bg-zinc-950/60 glass-panel">
          <div className="flex flex-wrap items-center gap-3.5 text-xs text-muted-foreground">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 uppercase font-mono px-3">
              {newsItem.category || 'AI'}
            </Badge>
            <span className="flex items-center gap-1.5 font-mono">
              <Globe className="h-3.5 w-3.5" /> {newsItem.source}
            </span>
            <span className="flex items-center gap-1.5 font-mono">
              <Clock className="h-3.5 w-3.5" /> {new Date(newsItem.published_at).toLocaleDateString()}
            </span>
            <span className="font-mono">{getReadingTime(newsItem.summary)}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShareStory(newsItem)}
              className="h-8 border-zinc-800 text-xs px-3 bg-zinc-900/50"
            >
              <Share2 className="h-3.5 w-3.5 mr-1.5" /> Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggleBookmark(newsItem)}
              className={`h-8 border-zinc-800 text-xs px-3 bg-zinc-900/50 ${
                isBookmarked ? 'text-indigo-400 border-indigo-500/20' : ''
              }`}
            >
              <Bookmark className={`h-3.5 w-3.5 mr-1.5 ${isBookmarked ? 'fill-indigo-400' : ''}`} /> 
              {isBookmarked ? 'Saved' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left panel: AI Analysis */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <BookOpen className="h-4 w-4" />
              <span className="text-xs font-extrabold uppercase tracking-wider font-mono">AI Analysis Brief</span>
            </div>
            <div className="bg-zinc-950/40 p-6 sm:p-8 rounded-xl border border-zinc-900/80 shadow-md">
              {formatSummary(newsItem.summary)}
            </div>

            {/* Source Reference Link */}
            <div className="pt-4 flex justify-end">
              <a
                href={newsItem.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5"
              >
                Go to original publication <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Right panel: Context & Related */}
          <div className="space-y-6">
            {/* Raw Context */}
            {newsItem.raw_content && (
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono block">Context Extract</span>
                <div className="max-h-60 overflow-y-auto bg-zinc-950/80 p-4 rounded-xl border border-zinc-900 text-xs text-muted-foreground font-mono leading-relaxed scrollbar-thin">
                  {newsItem.raw_content}
                </div>
              </div>
            )}

            {/* Related recommendations */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 block font-mono">Related Technical Intel</span>
              {relatedLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : related.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No related entries cataloged.</p>
              ) : (
                <div className="space-y-3">
                  {related.map((relItem) => (
                    <div
                      key={relItem.id}
                      onClick={() => navigate(`/news/${relItem.id}`)}
                      className="p-4 bg-zinc-950/20 hover:bg-zinc-900/50 border border-zinc-900 hover:border-zinc-800 rounded-xl cursor-pointer transition-all flex flex-col justify-between h-28 group"
                    >
                      <span className="text-[11px] font-semibold text-zinc-300 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {relItem.title}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-mono flex items-center gap-1 mt-3">
                        <Clock className="h-3 w-3" /> {getReadingTime(relItem.summary)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsDetail;
