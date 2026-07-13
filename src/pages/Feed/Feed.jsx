import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  BookOpenCheck,
  Newspaper
} from 'lucide-react';
import toast from 'react-hot-toast';
import { newsService } from '@/services/newsService';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

const parseNewsSummary = (summary) => {
  if (!summary) return { overview: 'No summary details compiled.', skills: '' };
  
  let overview = '';
  const overviewMatch = summary.match(/\*\*Overview\*\*([\s\S]*?)(?=\*\*Skills to Learn\*\*|\[Read Full Article\]|$)/i);
  if (overviewMatch) {
    overview = overviewMatch[1].trim();
  } else {
    overview = summary.replace(/\*\*Overview\*\*/gi, '').trim();
  }
  
  let skills = '';
  const skillsMatch = summary.match(/\*\*Skills to Learn\*\*([\s\S]*?)(?=\[Read Full Article\]|$)/i);
  if (skillsMatch) {
    skills = skillsMatch[1].trim();
  }
  
  const cleanText = (txt) => {
    return txt
      .replace(/^[#*-\s]+/g, '')
      .replace(/[#*-\s]+$/g, '')
      .trim();
  };

  return {
    overview: cleanText(overview) || 'No summary details compiled.',
    skills: cleanText(skills)
  };
};

const Feed = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Local bookmarks state
  const [bookmarks, setBookmarks] = useState(() => {
    return JSON.parse(localStorage.getItem('bookmarked_news') || '[]');
  });

  // Filter mode: 'all' or 'bookmarks'
  const [filterMode, setFilterMode] = useState('all');

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
    navigate(`/news/${item.id}`);
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
    const shareUrl = `${window.location.origin}/news/${item.id}`;
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

  // Filter list by selected filterMode
  const displayedNews = filterMode === 'bookmarks' ? bookmarks : news;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-border pb-6">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold font-serif tracking-tight text-foreground flex items-center gap-2.5">
            <Newspaper className="h-7 w-7 text-primary" /> Daily News Feed
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl font-sans">
            Curated updates from the developer ecosystem, mapped categories, and deep architectural impact reports.
          </p>
        </div>
        
        {/* Right Header Stats Info Box */}
        <div className="flex gap-3.5 shrink-0 select-none">
          <div className="bg-muted px-4 py-2 rounded-xl border border-border">
            <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">Total Stories</span>
            <span className="text-sm font-bold font-serif text-primary">{news.length > 0 ? news.length + '+' : '1.4k+'}</span>
          </div>
          <div className="bg-muted px-4 py-2 rounded-xl border border-border">
            <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">Top Category</span>
            <span className="text-sm font-bold font-serif">AI & ML</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-muted/30 p-3.5 rounded-2xl border border-border select-none">
        
        {/* Category list + bookmark filter toggle */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleCategorySelect(cat.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                category === cat.value && filterMode === 'all'
                  ? 'bg-primary text-white shadow-sm font-bold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 bg-card border border-border'
              }`}
            >
              {cat.label}
            </button>
          ))}
          
          <div className="h-6 w-[1px] bg-border mx-2 hidden sm:block" />

          {/* Bookmarks Toggle button */}
          <button
            onClick={() => {
              setFilterMode(filterMode === 'bookmarks' ? 'all' : 'bookmarks');
              setCategory('');
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 cursor-pointer ${
              filterMode === 'bookmarks'
                ? 'bg-primary text-white shadow-sm font-bold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 bg-card border border-border'
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
            leftIcon={<Search className="h-3.5 w-3.5 text-muted-foreground" />}
            className="bg-card border-border focus-visible:ring-primary text-xs h-8.5 rounded-xl"
          />
        </div>
      </div>

      {/* Grid listing */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Card className="bg-card border-border p-5 space-y-4 rounded-2xl h-60">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-16 w-full" />
          </Card>
          <Card className="bg-card border-border p-5 space-y-4 rounded-2xl h-60">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-16 w-full" />
          </Card>
        </div>
      ) : isError ? (
        <div className="text-center py-12 bg-muted/20 rounded-2xl border border-border flex flex-col items-center gap-3">
          <FilterX className="h-8 w-8 text-red-500" />
          <p className="text-muted-foreground text-sm font-semibold">Error connecting to News Feed API.</p>
          <Button variant="outline" size="sm" onClick={refetch}>Retry Connection</Button>
        </div>
      ) : displayedNews.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 rounded-2xl border border-border flex flex-col items-center gap-3">
          <BookOpenCheck className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground text-sm font-bold">No news items found.</p>
          <p className="text-xs text-muted-foreground max-w-sm font-sans">
            {filterMode === 'bookmarks' ? "You haven't bookmarked any articles yet." : 'Try triggering ingestion feeds or resetting filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedNews.map((item) => {
            const isBookmarked = bookmarks.some(b => b.id === item.id);
            const { overview, skills } = parseNewsSummary(item.summary);
            return (
              <Card
                key={item.id}
                onClick={() => handleOpenDetails(item)}
                className="bg-card hover:bg-muted/10 border-border hover:border-primary/20 cursor-pointer transition-all flex flex-col justify-between group overflow-hidden shadow-sm hover:shadow-md p-5 rounded-2xl h-60"
              >
                <div className="space-y-2.5">
                  {/* Category and Reading Time */}
                  <div className="flex items-center justify-between gap-2 shrink-0">
                    <span className="bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-full text-[9px] font-bold font-sans uppercase">
                      {item.category || 'AI'}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-mono flex items-center gap-0.5">
                      <Clock className="h-3 w-3" /> {getReadingTime(item.summary)}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-sm font-bold font-serif text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2">
                    {item.title}
                  </h2>
                  
                  {/* Summary Overview */}
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-sans">
                    {overview}
                  </p>

                  {/* Skills to Learn Box */}
                  {skills && (
                    <div className="p-2 bg-muted/40 rounded-xl border border-border text-[10px] leading-relaxed text-foreground animate-fade-in shrink-0">
                      <span className="font-serif italic font-bold text-[9.5px] block text-primary mb-0.5">Skills to Learn</span>
                      <p className="line-clamp-1 text-zinc-650 font-sans leading-snug">
                        {skills}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Footer details & actions */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono border-t border-border/40 pt-2.5 mt-1.5 shrink-0">
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3 text-primary" /> {item.source}
                  </span>
                  
                  {/* Share & Bookmark actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleShareStory(e, item)}
                      className="p-1 hover:text-primary text-muted-foreground rounded transition-colors"
                      title="Copy Share Link"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleToggleBookmark(e, item)}
                      className={`p-1 rounded transition-colors ${
                        isBookmarked ? 'text-primary hover:text-primary/80' : 'text-muted-foreground hover:text-primary'
                      }`}
                      title={isBookmarked ? 'Remove Bookmark' : 'Add Bookmark'}
                    >
                      <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? 'fill-primary' : ''}`} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Feed;
