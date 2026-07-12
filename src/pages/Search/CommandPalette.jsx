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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Search container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-2xl bg-[#09090b] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[60vh]"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 border-b border-zinc-800 bg-zinc-900/20">
              <Search className="h-5 w-5 text-emerald-500 mr-3" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search across feed, wiki glossary, repos, weekly reports..."
                className="w-full h-14 bg-transparent text-zinc-100 placeholder:text-zinc-500 focus:outline-none text-base"
              />
              {loading && (
                <svg className="animate-spin h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
            </div>

            {/* Results scrollable window */}
            <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-zinc-800">
              {!query.trim() && (
                <div className="py-16 text-center text-zinc-500 text-sm flex flex-col items-center gap-3">
                  <Search className="h-8 w-8 text-zinc-800" />
                  Type terms to search stories, libraries, definitions, and GitHub trends.
                </div>
              )}

              {query.trim() && flatItems.length === 0 && !loading && (
                <div className="py-16 text-center text-zinc-500 text-sm flex flex-col items-center gap-3">
                  <Search className="h-8 w-8 text-zinc-800" />
                  No results matching "{query}" found in current indices.
                </div>
              )}

              {flatItems.length > 0 && (
                <div className="space-y-6">
                  {/* News category */}
                  {results.news?.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase px-3 py-1.5 flex items-center gap-1.5">
                        <Newspaper className="h-3.5 w-3.5" /> Daily News
                      </div>
                      <div className="mt-1 space-y-1">
                        {results.news.map((item) => {
                          const flatIdx = flatItems.findIndex(f => f.type === 'news' && f.id === item.id);
                          const isSel = flatIdx === selectedIndex;
                          return (
                            <div
                              key={item.id}
                              onClick={() => handleSelect(flatItems[flatIdx])}
                              onMouseEnter={() => setSelectedIndex(flatIdx)}
                              className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium cursor-pointer transition-colors ${
                                isSel ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-400 hover:bg-zinc-900 border border-transparent'
                              }`}
                            >
                              <span className="truncate pr-4">{item.title}</span>
                              {isSel && (
                                <span className="flex items-center gap-1.5 text-[11px] opacity-80 text-emerald-500 shrink-0">
                                  Select <CornerDownLeft className="h-3 w-3" />
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
                      <div className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase px-3 py-1.5 flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5" /> Dev Wiki Glossary
                      </div>
                      <div className="mt-1 space-y-1">
                        {results.wiki.map((item) => {
                          const flatIdx = flatItems.findIndex(f => f.type === 'wiki' && f.term === item.term);
                          const isSel = flatIdx === selectedIndex;
                          return (
                            <div
                              key={item.term}
                              onClick={() => handleSelect(flatItems[flatIdx])}
                              onMouseEnter={() => setSelectedIndex(flatIdx)}
                              className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium cursor-pointer transition-colors ${
                                isSel ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-400 hover:bg-zinc-900 border border-transparent'
                              }`}
                            >
                              <span className="font-mono">{item.term}</span>
                              {isSel && (
                                <span className="flex items-center gap-1.5 text-[11px] opacity-80 text-emerald-500 shrink-0">
                                  Wiki entry <CornerDownLeft className="h-3 w-3" />
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
                      <div className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase px-3 py-1.5 flex items-center gap-1.5">
                        <Github className="h-3.5 w-3.5" /> GitHub Trending
                      </div>
                      <div className="mt-1 space-y-1">
                        {results.github_radar.map((item) => {
                          const flatIdx = flatItems.findIndex(f => f.type === 'github' && f.url === item.repo_url);
                          const isSel = flatIdx === selectedIndex;
                          return (
                            <div
                              key={item.repo_url}
                              onClick={() => handleSelect(flatItems[flatIdx])}
                              onMouseEnter={() => setSelectedIndex(flatIdx)}
                              className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium cursor-pointer transition-colors ${
                                isSel ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-400 hover:bg-zinc-900 border border-transparent'
                              }`}
                            >
                              <span>{item.repo_name}</span>
                              {isSel && (
                                <span className="flex items-center gap-1.5 text-[11px] opacity-80 text-emerald-500 shrink-0">
                                  Open repo <ArrowRight className="h-3 w-3" />
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
            <div className="h-12 px-5 border-t border-zinc-800 bg-zinc-950/50 flex items-center justify-between text-[11px] text-zinc-500 font-medium">
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-1.5"><span className="bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 text-zinc-400">↑↓</span> Navigate</span>
                <span className="flex items-center gap-1.5"><span className="bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 text-zinc-400">↵</span> Select</span>
                <span className="flex items-center gap-1.5"><span className="bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 text-zinc-400">ESC</span> Close</span>
              </div>
              <div className="text-zinc-600">
                Unified Search
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
