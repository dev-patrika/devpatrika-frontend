import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Globe, 
  Clock, 
  ExternalLink,
  BookOpen,
  FilterX,
  Bookmark,
  Share2,
  BookOpenCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { newsService } from '@/services/newsService';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Skeleton from '@/components/ui/Skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

const Feed = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Local bookmarks state
  const [bookmarks, setBookmarks] = useState(() => {
    return JSON.parse(localStorage.getItem('bookmarked_news') || '[]');
  });

  // Filter mode: 'all' or 'bookmarks'
  const [filterMode, setFilterMode] = useState('all');

  // Selected news item for details modal
  const [selectedNews, setSelectedNews] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Sync category state when URL changes
  useEffect(() => {
    const catParam = searchParams.get('category');
    if (catParam) {
      setCategory(catParam);
      setFilterMode('all');
    }
  }, [searchParams]);

  // Fetch news list from backend
  const { data: news = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['news', category, debouncedQuery],
    queryFn: () => newsService.getNews({
      category: category || undefined,
      q: debouncedQuery || undefined,
      limit: 60
    })
  });

  // Direct URL linking hook (e.g. ?news_id=123)
  const urlNewsId = searchParams.get('news_id');

  useEffect(() => {
    if (urlNewsId && news.length > 0) {
      const match = news.find(n => n.id.toString() === urlNewsId);
      if (match) {
        setSelectedNews(match);
        setIsModalOpen(true);
      }
    }
  }, [urlNewsId, news]);

  // Fetch related articles
  const { data: related = [], isLoading: relatedLoading } = useQuery({
    queryKey: ['news', 'related', selectedNews?.id],
    queryFn: () => newsService.getRelatedNews(selectedNews.id),
    enabled: !!selectedNews?.id
  });

  const categories = [
    { value: '', label: 'All Feeds' },
    { value: 'AI', label: 'AI & ML' },
    { value: 'Web Dev', label: 'Web Dev' },
    { value: 'Cybersecurity', label: 'Security' },
    { value: 'Startups', label: 'Startups' },
    { value: 'Open Source', label: 'Open Source' },
    { value: 'Cloud/DevOps', label: 'Cloud/DevOps' }
  ];

  const handleCategorySelect = (val) => {
    setCategory(val);
    setFilterMode('all');
    if (val) {
      setSearchParams({ category: val });
    } else {
      setSearchParams({});
    }
  };

  const handleOpenDetails = (item) => {
    setSelectedNews(item);
    setIsModalOpen(true);
    setSearchParams(prev => {
      prev.set('news_id', item.id);
      return prev;
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNews(null);
    setSearchParams(prev => {
      prev.delete('news_id');
      return prev;
    });
  };

  // Toggle bookmark in localStorage
  const handleToggleBookmark = (e, item) => {
    e.stopPropagation();
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
  const handleShareStory = (e, item) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/feed?news_id=${item.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Shareable link copied to clipboard!');
  };

  // Calculate estimated reading time
  const getReadingTime = (text) => {
    if (!text) return '1 min read';
    const words = text.split(/\s+/).length;
    const minutes = Math.max(1, Math.round(words / 180));
    return `${minutes} min read`;
  };

  // Format summaries content
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
              <h4 key={idx} className="text-zinc-150 font-bold text-xs mt-4 uppercase tracking-wider text-primary">
                {trimmed.replace(/^###\s*/, '')}
              </h4>
            );
          }
          if (trimmed.startsWith('##')) {
            return (
              <h3 key={idx} className="text-zinc-100 font-bold text-sm mt-5 uppercase border-b border-zinc-900 pb-1.5">
                {trimmed.replace(/^##\s*/, '')}
              </h3>
            );
          }
          return trimmed ? <p key={idx} className="my-1.5">{trimmed}</p> : null;
        })}
      </div>
    );
  };

  // Filter list by selected filterMode
  const displayedNews = filterMode === 'bookmarks' ? bookmarks : news;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search and filter header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-zinc-950/60 p-4 rounded-xl border border-zinc-900 glass-panel">
        
        {/* Category list + bookmark filter toggle */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleCategorySelect(cat.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                category === cat.value && filterMode === 'all'
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-emerald-500/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-zinc-900 border border-zinc-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
          
          <div className="h-6 w-[1px] bg-zinc-900 mx-2 hidden sm:block" />

          {/* Bookmarks Toggle button */}
          <button
            onClick={() => {
              setFilterMode(filterMode === 'bookmarks' ? 'all' : 'bookmarks');
              setCategory('');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
              filterMode === 'bookmarks'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-zinc-900 border border-zinc-900'
            }`}
          >
            <Bookmark className="h-3.5 w-3.5" /> Bookmarked ({bookmarks.length})
          </button>
        </div>

        {/* Search input field */}
        <div className="w-full xl:w-80">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search news titles..."
            leftIcon={<Search className="h-4 w-4" />}
            className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary text-sm"
          />
        </div>
      </div>

      {/* Grid listing */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Card className="glass-panel border-zinc-900 p-6 space-y-4">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-16 w-full" />
          </Card>
          <Card className="glass-panel border-zinc-900 p-6 space-y-4">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-16 w-full" />
          </Card>
        </div>
      ) : isError ? (
        <div className="text-center py-12 bg-zinc-950/30 rounded-xl border border-zinc-900 flex flex-col items-center gap-3">
          <FilterX className="h-8 w-8 text-red-500" />
          <p className="text-muted-foreground text-sm">Error connecting to News Feed API.</p>
          <Button variant="outline" size="sm" onClick={refetch}>Retry Connection</Button>
        </div>
      ) : displayedNews.length === 0 ? (
        <div className="text-center py-20 bg-zinc-950/30 rounded-xl border border-zinc-900 flex flex-col items-center gap-3">
          <BookOpenCheck className="h-8 w-8 text-zinc-650" />
          <p className="text-muted-foreground text-sm font-semibold">No news items found.</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            {filterMode === 'bookmarks' ? 'You haven\'t bookmarked any articles yet.' : 'Try triggering ingestion feeds or resetting filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedNews.map((item) => {
            const isBookmarked = bookmarks.some(b => b.id === item.id);
            return (
              <Card
                key={item.id}
                onClick={() => handleOpenDetails(item)}
                className="glass-panel border-zinc-900 hover:border-zinc-800 cursor-pointer transition-all flex flex-col justify-between group h-64 hover:shadow-lg hover:shadow-emerald-500/[0.01]"
              >
                <CardHeader className="p-5 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider bg-zinc-950 border-zinc-800 text-zinc-400">
                      {item.category || 'AI'}
                    </Badge>
                    <span className="text-[9px] text-muted-foreground font-mono flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {getReadingTime(item.summary)}
                    </span>
                  </div>
                  <CardTitle className="text-sm font-bold text-zinc-200 mt-2.5 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-5 pt-0 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mt-1">
                    {item.summary ? item.summary.replace(/^[#*-\s]+/mg, '').slice(0, 140) : item.raw_content ? item.raw_content.slice(0, 140) : 'No summary details compiled.'}
                  </p>
                  
                  <div className="mt-4 pt-4 border-t border-zinc-900/60 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" /> {item.source}
                    </span>
                    
                    {/* Share & Bookmark trigger buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleShareStory(e, item)}
                        className="p-1 hover:text-foreground text-muted-foreground rounded transition-colors"
                        title="Copy Share Link"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleToggleBookmark(e, item)}
                        className={`p-1 rounded transition-colors ${
                          isBookmarked ? 'text-indigo-400 hover:text-indigo-300' : 'text-muted-foreground hover:text-foreground'
                        }`}
                        title={isBookmarked ? 'Remove Bookmark' : 'Add Bookmark'}
                      >
                        <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? 'fill-indigo-400' : ''}`} />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Details modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedNews?.title || 'Article Intel'}
        size="lg"
      >
        {selectedNews && (
          <div className="space-y-6">
            {/* Meta row */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-zinc-900 pb-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 uppercase font-mono px-3">
                  {selectedNews.category || 'AI'}
                </Badge>
                <span className="text-muted-foreground flex items-center gap-1.5 font-mono">
                  <Globe className="h-3.5 w-3.5" /> {selectedNews.source}
                </span>
                <span className="text-muted-foreground flex items-center gap-1.5 font-mono">
                  <Clock className="h-3.5 w-3.5" /> {new Date(selectedNews.published_at).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => handleShareStory(e, selectedNews)}
                  className="h-8 border-zinc-800 text-xs px-2.5"
                >
                  <Share2 className="h-3.5 w-3.5 mr-1.5" /> Share
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => handleToggleBookmark(e, selectedNews)}
                  className={`h-8 border-zinc-800 text-xs px-2.5 ${
                    bookmarks.some(b => b.id === selectedNews.id) ? 'text-indigo-400 border-indigo-500/20' : ''
                  }`}
                >
                  <Bookmark className={`h-3.5 w-3.5 mr-1.5 ${bookmarks.some(b => b.id === selectedNews.id) ? 'fill-indigo-400' : ''}`} /> 
                  {bookmarks.some(b => b.id === selectedNews.id) ? 'Saved' : 'Save'}
                </Button>
              </div>
            </div>

            {/* AI Summary */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <BookOpen className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">AI Analysis Brief</span>
              </div>
              <div className="bg-zinc-900/30 p-5 rounded-lg border border-zinc-900/80">
                {formatSummary(selectedNews.summary)}
              </div>
            </div>

            {/* Raw Context extracts */}
            {selectedNews.raw_content && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Context Extract</span>
                <div className="max-h-40 overflow-y-auto bg-zinc-950 p-4 rounded border border-zinc-900 text-xs text-muted-foreground font-mono leading-relaxed">
                  {selectedNews.raw_content}
                </div>
              </div>
            )}

            {/* Source Reference Links */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-900">
              <a
                href={selectedNews.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Go to original publication <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Related recommendations */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 block">Related Technical Intel</span>
              {relatedLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : related.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No related entries cataloged.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {related.map((relItem) => (
                    <div
                      key={relItem.id}
                      onClick={() => {
                        setSelectedNews(relItem);
                        setSearchParams(prev => {
                          prev.set('news_id', relItem.id);
                          return prev;
                        });
                      }}
                      className="p-3 bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 rounded-lg cursor-pointer transition-colors flex flex-col justify-between h-24"
                    >
                      <span className="text-[10px] font-semibold text-zinc-300 line-clamp-2 leading-snug">
                        {relItem.title}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-mono flex items-center gap-1 mt-2">
                        <Clock className="h-2.5 w-2.5" /> {getReadingTime(relItem.summary)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Feed;
