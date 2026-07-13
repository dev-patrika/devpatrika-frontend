import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  BookOpen, 
  Search, 
  Plus, 
  FileText, 
  Calendar,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  History,
  GitBranch,
  Info,
  Layers,
  Activity,
  Bookmark,
  Users,
  Award,
  Sparkles,
  SearchIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { wikiService } from '@/services/wikiService';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Skeleton from '@/components/ui/Skeleton';
import Badge from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

const DevWiki = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const suggestionsRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [activeTab, setActiveTab] = useState('definition'); // definition, timeline, references
  
  // Custom term generation modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTermName, setNewTermName] = useState('');

  // Load term list
  const { data: terms = [], isLoading: termsLoading, isError } = useQuery({
    queryKey: ['wiki', 'list'],
    queryFn: () => wikiService.getWikiEntries()
  });

  const urlTerm = searchParams.get('term');

  // Select term from URL parameter
  useEffect(() => {
    if (urlTerm && terms.length > 0) {
      const match = terms.find(t => t.term.toLowerCase() === urlTerm.toLowerCase());
      if (match) {
        setSelectedTerm(match);
      }
    } else if (terms.length > 0 && !selectedTerm) {
      setSelectedTerm(terms[0]);
    }
  }, [urlTerm, terms, selectedTerm]);

  // Load technology evolution timeline on-demand
  const { data: timelineData, isLoading: timelineLoading } = useQuery({
    queryKey: ['wiki', 'timeline', selectedTerm?.term],
    queryFn: () => wikiService.getWikiTimeline(selectedTerm.term),
    enabled: !!selectedTerm?.term && activeTab === 'timeline'
  });

  // Submit manual term generation request
  const generateMutation = useMutation({
    mutationFn: wikiService.generateWikiEntry,
    onSuccess: (data) => {
      toast.success(data.detail || 'Wiki generation scheduled in background!');
      setIsCreateModalOpen(false);
      setNewTermName('');
      queryClient.invalidateQueries({ queryKey: ['wiki', 'list'] });
    },
    onError: (err) => {
      const msg = err.response?.data?.detail || 'Failed to submit wiki request.';
      toast.error(msg);
    }
  });

  const handleSelectTerm = (term) => {
    setSelectedTerm(term);
    setSearchParams({ term: term.term });
    setSearchQuery('');
    setSearchFocused(false);
  };

  const handleCreateTermSubmit = (e) => {
    e.preventDefault();
    if (!newTermName.trim()) {
      toast.error('Term name cannot be blank.');
      return;
    }
    generateMutation.mutate(newTermName.trim());
  };

  // Click outside suggestions list to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter list of terms based on search box
  const filteredTerms = terms.filter(t => 
    t.term.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Parse links from wiki entry
  const getLinks = (termObj) => {
    if (!termObj) return [];
    try {
      if (typeof termObj.related_links === 'string') {
        return JSON.parse(termObj.related_links || '[]');
      }
      return termObj.related_links || [];
    } catch {
      return [];
    }
  };

  // Generate dynamic tags based on glossary content
  const getConceptTags = (term) => {
    if (!term) return [];
    const text = (term.term + ' ' + term.definition).toLowerCase();
    const tags = [];
    
    if (text.includes('agent') || text.includes('orchestrator') || text.includes('graph')) {
      tags.push('Agentic AI');
    }
    if (text.includes('react') || text.includes('frontend') || text.includes('ui') || text.includes('css')) {
      tags.push('Frontend Dev');
    }
    if (text.includes('state') || text.includes('store') || text.includes('context')) {
      tags.push('State Management');
    }
    if (text.includes('database') || text.includes('vector') || text.includes('embeddings') || text.includes('chroma')) {
      tags.push('Data Storage');
    }
    if (text.includes('api') || text.includes('web') || text.includes('async') || text.includes('fastapi')) {
      tags.push('API & Backend');
    }
    
    if (tags.length === 0) tags.push('Developer Utility');
    return tags;
  };

  const getAbsoluteUrl = (url) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  const formatWikiContent = (text) => {
    if (!text) return '';
    const lines = text.split('\n');
    return (
      <div className="space-y-3 font-sans text-xs leading-relaxed text-foreground/80 text-justify">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
            return (
              <li key={idx} className="ml-4 list-disc pl-1 marker:text-primary">
                {renderInlineFormatting(trimmed.replace(/^[*-]\s*/, ''))}
              </li>
            );
          }
          return trimmed ? <p key={idx}>{renderInlineFormatting(line)}</p> : null;
        })}
      </div>
    );
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

  const parseChatTable = (tableLines, tableKey) => {
    if (tableLines.length < 2) return null;
    
    const rows = tableLines.map(line => {
      return line.split('|').map(cell => cell.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
    });

    const isSeparator = rows[1]?.every(cell => /^:-*-:?$|^-+$/.test(cell));
    if (!isSeparator) return null;

    const headers = rows[0];
    const bodyRows = rows.slice(2);

    return (
      <div key={tableKey} className="overflow-x-auto my-3 rounded-xl border border-border bg-muted/20">
        <table className="w-full border-collapse text-left text-[10px] font-sans">
          <thead>
            <tr className="bg-muted/80 border-b border-border">
              {headers.map((h, i) => (
                <th key={i} className="p-2 font-extrabold text-foreground uppercase tracking-wider text-[8.5px]">
                  {renderInlineFormatting(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {bodyRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-muted/10 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="p-2 text-muted-foreground leading-normal align-top">
                    {renderInlineFormatting(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const parseTimelineMarkdown = (markdown) => {
    if (!markdown) return [];
    if (Array.isArray(markdown)) return markdown;
    if (typeof markdown !== 'string') return [];
    
    const sections = markdown.split(/(?=###?\s+Phase|##?\s+Phase)/gi);
    const milestones = [];
    
    sections.forEach((section) => {
      const lines = section.trim().split('\n');
      if (lines.length === 0 || !lines[0]) return;
      
      const titleLine = lines[0].replace(/^[#\s*]+/, '').trim();
      const details = lines.slice(1).join('\n').trim();
      
      let year = 'STAGE';
      let title = titleLine;
      
      const match = titleLine.match(/Phase\s+(\d+):\s*(.*)/i);
      if (match) {
        title = match[2];
        year = `PHASE ${match[1]}`;
      } else {
        const fallbackMatch = titleLine.match(/Phase\s+(\d+)/i);
        if (fallbackMatch) {
          year = `PHASE ${fallbackMatch[1]}`;
        }
      }
      
      if (title) {
        milestones.push({
          year,
          event: title,
          details
        });
      }
    });
    
    return milestones;
  };

  const formatTimelineDetails = (detailsText) => {
    if (!detailsText) return null;
    
    const parts = detailsText.split(/(```[\s\S]*?```)/g);

    return (
      <div className="space-y-3 mt-2 text-[11px] leading-relaxed text-muted-foreground font-sans">
        {parts.map((part, idx) => {
          if (part.startsWith('```') && part.endsWith('```')) {
            const match = part.match(/```(\w*)\n([\s\S]*?)```/);
            const lang = match ? match[1] : 'code';
            const code = match ? match[2] : part.slice(3, -3);
            return (
              <div key={idx} className="border border-border rounded-xl overflow-hidden bg-muted/30 font-mono text-[9px] my-2 shadow-sm">
                <div className="flex items-center justify-between px-3 py-1 bg-muted/50 border-b border-border text-[8px] text-muted-foreground uppercase font-bold tracking-wider">
                  <span>{lang || 'code'}</span>
                </div>
                <pre className="p-2.5 overflow-x-auto text-foreground select-all leading-relaxed whitespace-pre-wrap">{code}</pre>
              </div>
            );
          } else {
            const lines = part.split('\n');
            const elements = [];
            let currentTableLines = [];

            const flushTable = () => {
              if (currentTableLines.length > 0) {
                const tableKey = `table-${idx}-${elements.length}`;
                const tableElement = parseChatTable(currentTableLines, tableKey);
                if (tableElement) {
                  elements.push(tableElement);
                } else {
                  currentTableLines.forEach((tLine, tlIdx) => {
                    elements.push(
                      <p key={`fb-${idx}-${elements.length}-${tlIdx}`} className="my-1 leading-relaxed">
                        {renderInlineFormatting(tLine)}
                      </p>
                    );
                  });
                }
                currentTableLines = [];
              }
            };

            lines.forEach((line, lineIdx) => {
              const trimmed = line.trim();
              if (trimmed.startsWith('|')) {
                currentTableLines.push(line);
              } else {
                flushTable();
                if (!trimmed || trimmed === '---' || trimmed === '...') return;

                if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
                  const content = trimmed.replace(/^[*-]\s*/, '');
                  elements.push(
                    <li key={`li-${lineIdx}`} className="ml-3 list-disc pl-0.5 marker:text-primary/70">
                      {renderInlineFormatting(content)}
                    </li>
                  );
                } else if (trimmed.startsWith('###')) {
                  elements.push(
                    <h4 key={`h4-${lineIdx}`} className="text-primary font-bold text-[10px] mt-3 uppercase tracking-wider font-mono">
                      {renderInlineFormatting(trimmed.replace(/^###\s*/, ''))}
                    </h4>
                  );
                } else if (trimmed.startsWith('##')) {
                  elements.push(
                    <h3 key={`h3-${lineIdx}`} className="text-foreground font-bold text-xs mt-4 uppercase border-b border-border pb-1">
                      {renderInlineFormatting(trimmed.replace(/^##\s*/, ''))}
                    </h3>
                  );
                } else if (trimmed.startsWith('**') && trimmed.includes(':**')) {
                  const parts = trimmed.split(/:\*\*\s*(.*)/s);
                  if (parts.length >= 2) {
                    const label = parts[0].replace(/^\*\*|\*\*$/g, '');
                    const val = parts[1];
                    elements.push(
                      <div key={`lbl-${lineIdx}`} className="mt-3 first:mt-0 space-y-1">
                        <span className="inline-block font-mono text-[8.5px] font-bold text-primary bg-primary/5 px-2 py-0.5 border border-primary/20 rounded-md uppercase tracking-wider">
                          {label}
                        </span>
                        <p className="text-[11px] text-muted-foreground leading-relaxed pl-0.5">
                          {renderInlineFormatting(val)}
                        </p>
                      </div>
                    );
                  }
                } else {
                  elements.push(
                    <p key={`p-${lineIdx}`} className="my-1 leading-relaxed">
                      {renderInlineFormatting(trimmed)}
                    </p>
                  );
                }
              }
            });

            flushTable();

            return <div key={idx} className="space-y-1.5">{elements}</div>;
          }
        })}
      </div>
    );
  };

  const renderTimelineProgress = (timeline) => {
    if (!timeline || timeline.length === 0) {
      return <p className="text-xs text-muted-foreground italic pl-2">No historical milestone recorded.</p>;
    }
    return (
      <div className="space-y-4 relative pl-4 border-l-2 border-primary/25 py-2 font-sans text-xs select-none">
        {timeline.map((item, idx) => (
          <div key={idx} className="relative group/time">
            <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-background ring-4 ring-background group-hover/time:scale-110 transition-all" />
            <div className="bg-muted/40 border border-border p-3.5 rounded-xl space-y-1 hover:border-primary/20 transition-all">
              <span className="font-mono text-[9px] font-bold text-primary block">{item.year || 'MILESTONE'}</span>
              <p className="font-serif italic text-foreground text-xs leading-snug">{item.event}</p>
              {item.details && formatTimelineDetails(item.details)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. SEARCH-FIRST SECTION */}
      <section className="w-full max-w-2xl mx-auto text-center px-4 pt-4 relative">
        <h2 className="font-serif text-4xl md:text-5xl font-black tracking-tight text-foreground mb-3">Dev Wiki</h2>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto mb-6">
          The definitive index of modern developer primitives, architectural patterns, and emerging tech stacks.
        </p>
        
        {/* Search pill container */}
        <div className="relative group max-w-lg mx-auto" ref={suggestionsRef}>
          <div className="absolute inset-y-0 left-4.5 flex items-center pointer-events-none text-muted-foreground z-10">
            <Search className="h-4.5 w-4.5" />
          </div>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            placeholder="Search concept, framework, or pattern..."
            className="w-full pl-12 pr-12 py-3 bg-card border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-full transition-all text-xs text-foreground placeholder:text-muted-foreground/60 shadow-sm"
          />
          <kbd className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:inline-flex h-5 select-none items-center gap-0.5 rounded-full border border-border bg-muted px-2 font-mono text-[9px] font-medium text-muted-foreground">
            Ctrl K
          </kbd>

          {/* Suggestions Dropdown */}
          {searchFocused && filteredTerms.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-2xl shadow-lg border border-border overflow-hidden z-50 text-left animate-slide-up">
              <div className="p-1.5 space-y-0.5 max-h-60 overflow-y-auto">
                <div className="px-3.5 py-1.5 text-[8.5px] font-mono font-bold text-muted-foreground uppercase tracking-widest border-b border-border/40">Glossary Suggestions</div>
                {filteredTerms.slice(0, 8).map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTerm(t)}
                    className="px-3.5 py-2.5 hover:bg-muted/60 cursor-pointer flex items-center justify-between group/item rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[16px] text-muted-foreground group-hover/item:text-primary">schema</span>
                      <span className="text-xs font-semibold text-foreground group-hover/item:text-primary transition-colors">{t.term}</span>
                    </div>
                    <span className="font-mono text-[8px] font-bold bg-muted px-2 py-0.5 border border-border rounded-full text-muted-foreground group-hover/item:text-primary">CONCEPT</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 2. TWO-COLUMN LAYOUT */}
      {selectedTerm ? (
        <section className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          
          {/* Left Column: Concept details and Adoption cycle */}
          <div className="space-y-6">
            
            {/* Concept Card */}
            <Card className="bg-card border-border p-6 rounded-2xl shadow-sm relative space-y-5">
              <div className="flex justify-between items-start">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 select-none">
                    <span className="bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-full font-label-sm text-[9px] uppercase font-bold tracking-wider">
                      Core Primitive
                    </span>
                    <span className="text-[9px] font-mono text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Updated: {new Date(selectedTerm.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="font-serif text-2xl md:text-3xl font-black text-foreground">
                    {selectedTerm.term}
                  </h3>
                </div>
                
                <button className="text-muted-foreground hover:text-primary transition-colors cursor-pointer select-none">
                  <Bookmark className="h-5 w-5" />
                </button>
              </div>

              {/* Tab Navigation headers */}
              <div className="flex border-b border-border/60 select-none">
                {[
                  { id: 'definition', label: 'Definition', icon: FileText },
                  { id: 'timeline', label: 'Evolution Timeline', icon: GitBranch },
                  { id: 'references', label: 'References & Links', icon: ExternalLink }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-4.5 py-2.5 border-b-2 text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                        activeTab === tab.id
                          ? 'border-primary text-primary bg-primary/5 font-bold'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content rendering */}
              <div className="min-h-36">
                {activeTab === 'definition' && (
                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 font-mono select-none">
                        <Layers className="h-3.5 w-3.5" /> Glossary Definition
                      </span>
                      <div className="bg-muted/40 p-4.5 rounded-xl border border-border">
                        {formatWikiContent(selectedTerm.definition)}
                      </div>
                    </div>

                    {selectedTerm.why_trending && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 font-mono select-none">
                          <TrendingUp className="h-3.5 w-3.5" /> Why Curation is Trending
                        </span>
                        <div className="bg-muted/40 p-4.5 rounded-xl border border-border">
                          {formatWikiContent(selectedTerm.why_trending)}
                        </div>
                      </div>
                    )}

                    {/* Concept classification tags */}
                    <div className="space-y-1.5 pt-1.5 select-none">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 font-mono">
                        <Activity className="h-3.5 w-3.5 text-primary" /> Classification Tags
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {getConceptTags(selectedTerm).map((tag, i) => (
                          <span key={i} className="bg-muted px-2.5 py-0.5 rounded-full border border-border text-[9px] font-mono text-foreground font-semibold">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'timeline' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary font-mono text-[10px] uppercase font-bold select-none">
                      <History className="h-3.5 w-3.5" /> Historical Progression Timeline
                    </div>
                    {timelineLoading ? (
                      <div className="space-y-3 pl-6 py-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : (
                      renderTimelineProgress(parseTimelineMarkdown(timelineData?.timeline))
                    )}
                  </div>
                )}

                {activeTab === 'references' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-primary font-mono text-[10px] uppercase font-bold select-none">
                      <ExternalLink className="h-3.5 w-3.5" /> Ecosystem References
                    </div>
                    
                    {getLinks(selectedTerm).length === 0 ? (
                      <p className="text-xs text-muted-foreground italic pl-2 font-sans">No references attached to this term.</p>
                    ) : (
                      <ul className="space-y-2.5">
                        {getLinks(selectedTerm).map((url, i) => (
                          <li key={i} className="flex items-center gap-2.5 text-xs bg-muted/40 p-3.5 rounded-xl border border-border">
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <a
                              href={getAbsoluteUrl(url)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-foreground hover:text-primary hover:underline break-all font-mono text-[11px]"
                            >
                              {url}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* ADOPTION CYCLE VISUALIZATION */}
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm overflow-hidden relative select-none">
              <h4 className="font-serif font-black text-lg text-foreground mb-6">Adoption Cycle Scale</h4>
              <div className="relative pt-6 pb-8">
                {/* Connecting timeline axis */}
                <div className="absolute top-[38px] left-[15%] right-[15%] h-[1.5px] bg-border" />
                <div className="relative flex justify-between">
                  {/* Stage 1: Announcement */}
                  <div className="flex flex-col items-center text-center w-1/3 space-y-3.5">
                    <div className="w-5 h-5 rounded-full bg-card border border-primary/40 z-10 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                    </div>
                    <div>
                      <span className="font-serif italic font-bold text-xs text-foreground block">Announcement</span>
                      <span className="font-mono text-[8.5px] text-muted-foreground block mt-0.5">Academic / Preprints</span>
                    </div>
                  </div>
                  
                  {/* Stage 2: Community */}
                  <div className="flex flex-col items-center text-center w-1/3 space-y-2.5">
                    <div className="w-7 h-7 rounded-full bg-card border-2 border-primary z-10 flex items-center justify-center shadow-sm">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                    </div>
                    <div>
                      <span className="font-serif italic font-bold text-xs text-primary block">Community Integration</span>
                      <span className="font-mono text-[8.5px] text-primary/80 block mt-0.5">OSS & Emerging Tech</span>
                      <div className="mt-2.5 mx-auto px-2 py-1 bg-primary/10 border border-primary/20 text-primary rounded-lg text-[9px] font-sans font-bold max-w-[140px]">
                        Peak Dev Momentum
                      </div>
                    </div>
                  </div>

                  {/* Stage 3: Enterprise */}
                  <div className="flex flex-col items-center text-center w-1/3 space-y-3.5">
                    <div className="w-5 h-5 rounded-full bg-muted border border-border z-10" />
                    <div>
                      <span className="font-serif italic font-bold text-xs text-muted-foreground block">Enterprise Standard</span>
                      <span className="font-mono text-[8.5px] text-muted-foreground block mt-0.5">Production Adoption</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sidebar metadata & Curation request */}
          <aside className="space-y-6">
            
            {/* Related terms/trends list */}
            <div className="bg-muted/30 p-5 rounded-2xl border border-border select-none">
              <h5 className="font-mono text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Related Trends</h5>
              <div className="space-y-4">
                <div className="flex items-start gap-3 group cursor-pointer">
                  <div className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary/20 transition-all">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-serif font-bold text-foreground leading-normal">Privacy Tech Stack</p>
                    <p className="font-mono text-[9px] text-primary font-bold">High momentum</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 group cursor-pointer">
                  <div className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary/20 transition-all">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-serif font-bold text-foreground leading-normal">Orchestrator SDKs</p>
                    <p className="font-mono text-[9px] text-muted-foreground font-bold">Moderate interest</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contributors Section */}
            <div className="bg-card p-5 rounded-2xl border border-border shadow-sm select-none">
              <h5 className="font-mono text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Ecosystem Edits</h5>
              <div className="space-y-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-serif text-[10px] font-bold">JD</div>
                  <span className="text-xs text-foreground font-sans">Jordan D. <span className="text-muted-foreground text-[10px] font-mono font-semibold">(12 edits)</span></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-muted border border-border text-foreground/80 flex items-center justify-center font-serif text-[10px] font-bold">AM</div>
                  <span className="text-xs text-foreground font-sans">Alex M. <span className="text-muted-foreground text-[10px] font-mono font-semibold">(8 edits)</span></span>
                </div>
              </div>
            </div>

            {/* Request Curation Button Card */}
            <div className="bg-muted/40 border border-border p-5 rounded-2xl space-y-4 shadow-sm select-none">
              <h5 className="font-serif font-black text-sm text-foreground">Curation Agent</h5>
              <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                Trigger our LangChain agent pipeline to scrape, index, and vectorize a new technical primitive in Chroma DB.
              </p>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full bg-primary hover:bg-primary/95 text-white py-2 rounded-xl text-xs font-bold transition-all active:scale-98 shadow-sm flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4 shrink-0" /> Request Curation
              </button>
            </div>
          </aside>

        </section>
      ) : (
        <div className="text-center py-20 bg-muted/20 rounded-2xl border border-border max-w-md mx-auto">
          <BookOpen className="h-10 w-10 text-primary mb-3 mx-auto animate-pulse" />
          <p className="text-sm font-semibold">No wiki entry selected.</p>
          <p className="text-xs text-muted-foreground max-w-xs mt-1 mx-auto font-sans leading-relaxed">
            Search for a concept above or click suggestions to view architectural breakdowns.
          </p>
        </div>
      )}

      {/* Manual term request modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Request Curation Worker"
        size="md"
      >
        <form onSubmit={handleCreateTermSubmit} className="space-y-4">
          <div className="space-y-1.5 flex flex-col gap-1 select-none">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
              Technology Term Name
            </label>
            <Input
              value={newTermName}
              onChange={(e) => setNewTermName(e.target.value)}
              placeholder="e.g., LlamaIndex, Dify, LangGraph"
              required
              className="bg-card border-border text-xs h-9 rounded-xl focus-visible:ring-primary"
            />
            <div className="flex gap-2.5 p-3.5 bg-muted/40 border border-border rounded-xl mt-2 text-[10px] text-muted-foreground leading-relaxed font-sans">
              <Info className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
              <span>
                This schedules a LangChain AI worker in the background to fetch documents, curate definition milestones, extract ecosystem reference URLs, and index it inside Chroma DB vector repository.
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3.5 border-t border-border select-none">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
              className="h-8 border-border text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={generateMutation.isPending}
              className="h-8 text-xs rounded-xl bg-primary text-white"
            >
              Submit Curation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DevWiki;
