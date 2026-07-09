import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Newspaper, BookOpen, Github, ArrowRight, CornerDownLeft } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { searchService } from '@/services/searchService';

const CommandPalette = () => {
  const { searchOpen, setSearchOpen } = useUIStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ news: [], wiki: [], github_radar: [] });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Handle Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, setSearchOpen]);

  // Focus input when palette opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults({ news: [], wiki: [], github_radar: [] });
      setSelectedIndex(0);
    }
  }, [searchOpen]);

  // Query API when query text changes
  useEffect(() => {
    if (!query.trim()) {
      setResults({ news: [], wiki: [], github_radar: [] });
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchService.unifiedSearch(query);
        setResults(data.results || { news: [], wiki: [], github_radar: [] });
        setSelectedIndex(0);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  // Flattened items for easy arrow key index calculation
  const getFlattenedItems = () => {
    const list = [];
    results.news.forEach(item => list.push({ type: 'news', id: item.id, title: item.title, item }));
    results.wiki.forEach(item => list.push({ type: 'wiki', term: item.term, title: item.term, item }));
    results.github_radar.forEach(item => list.push({ type: 'github', url: item.repo_url, title: item.repo_name, item }));
    return list;
  };

  const flatItems = getFlattenedItems();

  const handleSelect = useCallback((flatItem) => {
    setSearchOpen(false);
    if (flatItem.type === 'news') {
      navigate(`/feed?news_id=${flatItem.id}`);
    } else if (flatItem.type === 'wiki') {
      navigate(`/wiki?term=${encodeURIComponent(flatItem.term)}`);
    } else if (flatItem.type === 'github') {
      window.open(flatItem.url, '_blank');
    }
  }, [navigate, setSearchOpen]);

  // Keyboard navigation within search results
  useEffect(() => {
    const handleNavigation = (e) => {
      if (!searchOpen || flatItems.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % flatItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSelect(flatItems[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleNavigation);
    return () => window.removeEventListener('keydown', handleNavigation);
  }, [searchOpen, flatItems, selectedIndex, handleSelect]);

  return (
    <AnimatePresence>
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSearchOpen(false)}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
          />

          {/* Search container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl bg-zinc-950/90 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden z-10 flex flex-col max-h-[60vh] glass-panel"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 border-b border-zinc-800">
              <Search className="h-4 w-4 text-muted-foreground mr-3" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search across feed, wiki glossary, repos, weekly reports..."
                className="w-full h-12 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {loading && (
                <svg className="animate-spin h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
            </div>

            {/* Results scrollable window */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
              {!query.trim() && (
                <div className="py-12 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                  <Search className="h-6 w-6 text-zinc-700" />
                  Type terms to search stories, libraries, definitions, and GitHub trends.
                </div>
              )}

              {query.trim() && flatItems.length === 0 && !loading && (
                <div className="py-12 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                  <Search className="h-6 w-6 text-zinc-700" />
                  No results matching "{query}" found in current indices.
                </div>
              )}

              {flatItems.length > 0 && (
                <div className="space-y-4">
                  {/* News category */}
                  {results.news?.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase px-3 py-1 flex items-center gap-1.5">
                        <Newspaper className="h-3 w-3" /> Daily News
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {results.news.map((item) => {
                          const flatIdx = flatItems.findIndex(f => f.type === 'news' && f.id === item.id);
                          const isSel = flatIdx === selectedIndex;
                          return (
                            <div
                              key={item.id}
                              onClick={() => handleSelect(flatItems[flatIdx])}
                              onMouseEnter={() => setSelectedIndex(flatIdx)}
                              className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                                isSel ? 'bg-primary/10 text-primary border border-primary/20' : 'text-zinc-400 hover:bg-zinc-900/50 border border-transparent'
                              }`}
                            >
                              <span className="truncate pr-4">{item.title}</span>
                              {isSel && (
                                <span className="flex items-center gap-1 text-[10px] opacity-70">
                                  Select <CornerDownLeft className="h-2.5 w-2.5" />
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Wiki category */}
                  {results.wiki?.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase px-3 py-1 flex items-center gap-1.5">
                        <BookOpen className="h-3 w-3" /> Dev Wiki Glossary
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {results.wiki.map((item) => {
                          const flatIdx = flatItems.findIndex(f => f.type === 'wiki' && f.term === item.term);
                          const isSel = flatIdx === selectedIndex;
                          return (
                            <div
                              key={item.term}
                              onClick={() => handleSelect(flatItems[flatIdx])}
                              onMouseEnter={() => setSelectedIndex(flatIdx)}
                              className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                                isSel ? 'bg-primary/10 text-primary border border-primary/20' : 'text-zinc-400 hover:bg-zinc-900/50 border border-transparent'
                              }`}
                            >
                              <span className="font-mono">{item.term}</span>
                              {isSel && (
                                <span className="flex items-center gap-1 text-[10px] opacity-70">
                                  Wiki entry <CornerDownLeft className="h-2.5 w-2.5" />
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* GitHub Radar category */}
                  {results.github_radar?.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase px-3 py-1 flex items-center gap-1.5">
                        <Github className="h-3 w-3" /> GitHub Trending
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {results.github_radar.map((item) => {
                          const flatIdx = flatItems.findIndex(f => f.type === 'github' && f.url === item.repo_url);
                          const isSel = flatIdx === selectedIndex;
                          return (
                            <div
                              key={item.repo_url}
                              onClick={() => handleSelect(flatItems[flatIdx])}
                              onMouseEnter={() => setSelectedIndex(flatIdx)}
                              className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                                isSel ? 'bg-primary/10 text-primary border border-primary/20' : 'text-zinc-400 hover:bg-zinc-900/50 border border-transparent'
                              }`}
                            >
                              <span>{item.repo_name}</span>
                              {isSel && (
                                <span className="flex items-center gap-1 text-[10px] opacity-70">
                                  Open repo <ArrowRight className="h-2.5 w-2.5" />
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer keyboard helpers */}
            <div className="h-10 px-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between text-[10px] text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>ESC Close</span>
              </div>
              <div>
                <span>Unified Search</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
