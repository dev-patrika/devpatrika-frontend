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
  Share2,
  Calendar,
  Layers,
  FileText
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

  // Format summary markdown
  const formatSummary = (summaryText) => {
    if (!summaryText) return 'No AI summary generated yet. Run the AI pipeline to analyze.';
    
    // Check if summary has no content (only headers are present)
    const cleaned = summaryText.replace(/\*\*(Overview|Key Details|Community & Traction|Skills to Learn)\*\*/gi, '').replace(/\s+/g, '');
    if (cleaned.length === 0) {
      return (
        <p className="text-xs text-muted-foreground italic text-center py-6 select-none">
          No detailed AI analysis has been compiled for this article yet. Run the AI curation pipeline to analyze.
        </p>
      );
    }
    
    const lines = summaryText.split('\n');
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
          if (trimmed.startsWith('###')) {
            return (
              <h4 key={idx} className="text-primary font-bold text-xs mt-4 uppercase tracking-wider font-mono">
                {renderInlineFormatting(trimmed.replace(/^###\s*/, ''))}
              </h4>
            );
          }
          if (trimmed.startsWith('##')) {
            return (
              <h3 key={idx} className="text-foreground font-bold text-sm mt-5 uppercase border-b border-border pb-1.5">
                {renderInlineFormatting(trimmed.replace(/^##\s*/, ''))}
              </h3>
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
      <div className="space-y-6 max-w-5xl mx-auto p-4 animate-pulse">
        <div className="h-6 w-24 bg-muted rounded" />
        <div className="h-10 w-3/4 bg-muted rounded" />
        <div className="h-6 w-1/2 bg-muted rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2 h-96 bg-muted rounded" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (isError || !newsItem) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 space-y-4">
        <h2 className="text-xl font-bold font-serif text-foreground">Failed to Load Article</h2>
        <p className="text-xs text-muted-foreground">The requested article could not be retrieved from the database.</p>
        <Button variant="primary" onClick={() => navigate('/feed')}>
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
        className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors group cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Feed
      </button>

      {/* Main Container */}
      <div className="space-y-6">
        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black font-serif text-foreground leading-tight tracking-tight">
          {newsItem.title}
        </h1>

        {/* Metadata Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-muted/30">
          <div className="flex flex-wrap items-center gap-3.5 text-xs text-muted-foreground">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 uppercase font-mono px-3">
              {newsItem.category || 'AI'}
            </Badge>
            <span className="flex items-center gap-1.5 font-mono">
              <Globe className="h-3.5 w-3.5 text-primary" /> {newsItem.source}
            </span>
            <span className="flex items-center gap-1.5 font-mono">
              <Calendar className="h-3.5 w-3.5 text-primary" /> {new Date(newsItem.published_at).toLocaleDateString()}
            </span>
            <span className="font-mono bg-muted border border-border px-2 py-0.5 rounded text-[10px] font-bold text-muted-foreground">
              {getReadingTime(newsItem.summary)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShareStory(newsItem)}
              className="h-8 border-border text-xs px-3 bg-card hover:bg-muted/50 cursor-pointer"
            >
              <Share2 className="h-3.5 w-3.5 mr-1.5 text-primary" /> Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggleBookmark(newsItem)}
              className={`h-8 border-border text-xs px-3 bg-card hover:bg-muted/50 cursor-pointer ${
                isBookmarked ? 'text-primary border-primary/20 bg-primary/5 font-bold' : ''
              }`}
            >
              <Bookmark className={`h-3.5 w-3.5 mr-1.5 ${isBookmarked ? 'fill-primary text-primary' : 'text-primary'}`} /> 
              {isBookmarked ? 'Saved' : 'Save'}
            </Button>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left panel: AI Analysis */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 text-primary font-mono text-[10px] uppercase font-bold">
              <BookOpen className="h-4 w-4" /> AI Analysis Brief
            </div>
            <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border shadow-sm">
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
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono block">Context Extract</span>
                <div className="max-h-60 overflow-y-auto bg-muted/30 p-4 rounded-xl border border-border text-xs text-muted-foreground font-mono leading-relaxed scrollbar-thin">
                  {newsItem.raw_content}
                </div>
              </div>
            )}

            {/* Related recommendations */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block font-mono">Related Technical Intel</span>
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
                      className="p-4.5 bg-card hover:bg-muted/10 border border-border hover:border-primary/20 rounded-2xl cursor-pointer transition-all flex flex-col justify-between h-28 group"
                    >
                      <span className="text-xs font-bold font-serif text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {relItem.title}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-mono flex items-center gap-1 mt-3">
                        <Clock className="h-3 w-3 text-primary" /> {getReadingTime(relItem.summary)}
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
