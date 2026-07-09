import React, { useState, useEffect } from 'react';
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
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import { wikiService } from '@/services/wikiService';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Skeleton from '@/components/ui/Skeleton';
import Badge from '@/components/ui/Badge';

const DevWiki = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
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
  };

  const handleCreateTermSubmit = (e) => {
    e.preventDefault();
    if (!newTermName.trim()) {
      toast.error('Term name cannot be blank.');
      return;
    }
    generateMutation.mutate(newTermName.trim());
  };

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
    
    // Fallback tag
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

  const renderInlineFormatting = (text) => {
    if (!text) return '';
    // Split by bold (**), italics (*), and inline code (`)
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-bold text-zinc-150">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={idx} className="italic text-zinc-300">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={idx} className="bg-zinc-900 px-1.5 py-0.5 rounded text-xs text-primary font-mono">{part.slice(1, -1)}</code>;
      }
      return <span key={idx}>{part}</span>;
    });
  };

  const parseMarkdownTable = (tableLines, tableKey) => {
    if (tableLines.length < 2) return null;
    
    const rows = tableLines.map(line => {
      return line.split('|').map(cell => cell.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
    });

    const isSeparator = rows[1]?.every(cell => /^:-*-:?$|^-+$/.test(cell));
    if (!isSeparator) return null;

    const headers = rows[0];
    const bodyRows = rows.slice(2);

    return (
      <div key={tableKey} className="overflow-x-auto my-4 rounded-xl border border-zinc-900 shadow-lg bg-zinc-950/40">
        <table className="w-full border-collapse text-left text-xs font-sans">
          <thead>
            <tr className="bg-zinc-900/80 border-b border-zinc-800">
              {headers.map((h, i) => (
                <th key={i} className="p-4 font-bold text-zinc-150 uppercase tracking-wider text-[10px]">
                  {renderInlineFormatting(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900/60">
            {bodyRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-zinc-900/20 transition-colors">
                {row.map((cell, cIdx) => {
                  const cellLines = cell.split(/<br\s*\/?>/i);
                  return (
                    <td key={cIdx} className="p-4 text-zinc-300 leading-relaxed align-top">
                      {cellLines.map((line, lIdx) => (
                        <div key={lIdx} className="my-1">
                          {renderInlineFormatting(line)}
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const formatWikiContent = (text) => {
    if (!text) return null;
    
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return (
      <div className="space-y-3.5 text-zinc-300 text-sm leading-relaxed font-sans">
        {parts.map((part, idx) => {
          if (part.startsWith('```') && part.endsWith('```')) {
            const match = part.match(/```(\w*)\n([\s\S]*?)```/);
            const lang = match ? match[1] : 'code';
            const code = match ? match[2] : part.slice(3, -3);
            
            return (
              <div key={idx} className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950 font-mono text-xs my-3 shadow-sm">
                <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  <span>{lang || 'code'}</span>
                </div>
                <pre className="p-4 overflow-x-auto text-zinc-300 select-all leading-relaxed whitespace-pre">{code}</pre>
              </div>
            );
          } else {
            const lines = part.split('\n');
            const elements = [];
            let currentTableLines = [];

            const flushTable = () => {
              if (currentTableLines.length > 0) {
                const tableKey = `table-${idx}-${elements.length}`;
                const tableElement = parseMarkdownTable(currentTableLines, tableKey);
                if (tableElement) {
                  elements.push(tableElement);
                } else {
                  currentTableLines.forEach((tLine) => {
                    elements.push(
                      <p key={`fb-${idx}-${elements.length}`} className="my-1.5">
                        {renderInlineFormatting(tLine)}
                      </p>
                    );
                  });
                }
                currentTableLines = [];
              }
            };

            lines.forEach((line) => {
              const trimmed = line.trim();
              if (trimmed.startsWith('|')) {
                currentTableLines.push(line);
              } else {
                flushTable();

                if (!trimmed) return;
                
                if (trimmed.startsWith('---') || trimmed.replace(/^[*-]\s*/, '').startsWith('---')) {
                  elements.push(<hr key={`hr-${idx}-${elements.length}`} className="border-zinc-900 my-4" />);
                } else if (trimmed.startsWith('###')) {
                  elements.push(
                    <h4 key={`h4-${idx}-${elements.length}`} className="text-zinc-150 font-bold text-xs mt-4 uppercase tracking-wider text-primary">
                      {trimmed.replace(/^###\s*/, '')}
                    </h4>
                  );
                } else if (trimmed.startsWith('##')) {
                  elements.push(
                    <h3 key={`h3-${idx}-${elements.length}`} className="text-zinc-100 font-bold text-sm mt-5 uppercase border-b border-zinc-900/60 pb-1.5 text-zinc-200">
                      {trimmed.replace(/^##\s*/, '')}
                    </h3>
                  );
                } else if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
                  elements.push(
                    <li key={`li-${idx}-${elements.length}`} className="ml-4 list-disc pl-1 marker:text-primary">
                      {renderInlineFormatting(trimmed.replace(/^[*-]\s*/, ''))}
                    </li>
                  );
                } else {
                  elements.push(
                    <p key={`p-${idx}-${elements.length}`} className="my-1.5">
                      {renderInlineFormatting(line)}
                    </p>
                  );
                }
              }
            });

            flushTable();

            return <div key={idx} className="space-y-2">{elements}</div>;
          }
        })}
      </div>
    );
  };

  // Convert timeline markdown into visual progression cards
  const renderTimelineProgress = (md) => {
    if (!md) return <p className="text-xs text-muted-foreground">Generating timeline content...</p>;

    if (md.includes('|')) {
      return formatWikiContent(md);
    }
    
    // Simple parser to extract Phase blocks
    const blocks = [];
    const lines = md.split('\n');
    let currentBlock = null;

    lines.forEach(line => {
      const trimmed = line.trim();
      
      const phaseMatch = trimmed.match(/(?:Phase\s+(\d+)|Phase\s+(\d+)\s*:|###\s+(?:Phase\s+\d+|\d+\.\s+Phase\s+\d+))/i) || 
                         trimmed.match(/\*\*(Phase\s+\d+|Phase\s+\d+\s*:|Phase\s+\d+)\*\*/i);
      
      if (phaseMatch || trimmed.startsWith('###') || (trimmed.startsWith('1.') || trimmed.startsWith('2.') || trimmed.startsWith('3.') || trimmed.startsWith('4.'))) {
        if (currentBlock) {
          blocks.push(currentBlock);
        }
        currentBlock = {
          title: trimmed.replace(/^[#\s\d.*]+|[*#:]+$/g, ''),
          content: []
        };
      } else if (trimmed && currentBlock) {
        currentBlock.content.push(trimmed);
      }
    });
    
    if (currentBlock) {
      blocks.push(currentBlock);
    }

    if (blocks.length === 0) {
      return (
        <div className="space-y-3 font-sans text-sm text-zinc-300">
          {lines.map((l, i) => l.trim() ? <p key={i}>{l}</p> : null)}
        </div>
      );
    }

    return (
      <div className="relative border-l border-zinc-800 ml-4 pl-6 space-y-6 py-2">
        {blocks.map((block, idx) => (
          <div key={idx} className="relative group">
            {/* Pulsing indicator node */}
            <div className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-950 border border-primary text-primary group-hover:scale-110 transition-transform shadow-md">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold font-mono text-primary bg-primary/5 border border-primary/10 px-1.5 py-0.5 rounded">
                0{idx + 1}
              </span>
              <h4 className="text-sm font-bold text-zinc-100 font-mono tracking-tight group-hover:text-primary transition-colors">
                {block.title}
              </h4>
            </div>
            
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed font-sans max-w-2xl bg-zinc-900/40 p-3.5 rounded-lg border border-zinc-900 shadow-sm">
              {block.content.join(' ')}
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col md:flex-row gap-6 animate-fade-in">
      {/* Left panel: Terms list */}
      <div className="w-full md:w-80 border border-zinc-900 bg-zinc-950/40 rounded-xl flex flex-col overflow-hidden glass-panel shrink-0">
        <div className="p-4 border-b border-zinc-900 space-y-3 bg-card/30">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" /> Glossary
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="h-7 px-2 border-zinc-800 hover:border-primary text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Request Term
            </Button>
          </div>

          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search terms..."
            leftIcon={<Search className="h-3.5 w-3.5" />}
            className="bg-zinc-900/80 border-zinc-800 text-xs h-8"
          />
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {termsLoading ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : isError ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              Error connecting to API.
            </div>
          ) : filteredTerms.length === 0 ? (
            <div className="text-center py-12 text-xs text-zinc-500">
              No matching terms found.
            </div>
          ) : (
            filteredTerms.map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelectTerm(t)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-mono transition-all text-left group ${
                  selectedTerm?.id === t.id
                    ? 'bg-primary/10 text-primary border border-primary/20 font-bold'
                    : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-foreground border border-transparent'
                }`}
              >
                <span>{t.term}</span>
                <ChevronRight className={`h-3.5 w-3.5 text-zinc-600 transition-transform group-hover:translate-x-0.5 ${
                  selectedTerm?.id === t.id ? 'text-primary' : ''
                }`} />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel: Details view */}
      <div className="flex-1 border border-zinc-900 bg-zinc-950/40 rounded-xl flex flex-col overflow-hidden glass-panel">
        {selectedTerm ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header info */}
            <div className="p-6 border-b border-zinc-900 bg-card/20 shrink-0">
              <h2 className="text-2xl font-bold font-mono tracking-tight text-foreground">{selectedTerm.term}</h2>
              <p className="text-xs text-muted-foreground font-mono mt-1 flex items-center gap-1.5">
                <Calendar className="h-3 w-3" /> Indexed {new Date(selectedTerm.created_at).toLocaleDateString()}
              </p>
            </div>

            {/* Tab navigation headers */}
            <div className="flex border-b border-zinc-900 bg-zinc-950 shrink-0">
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
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 text-xs font-semibold tracking-wide transition-all ${
                      activeTab === tab.id
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-zinc-900/30'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Scrollable Detail Body */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              {activeTab === 'definition' && (
                <div className="space-y-6">
                  {/* Definition */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5" /> Glossary Definition
                    </span>
                    <div className="bg-zinc-900/30 p-5 rounded-xl border border-zinc-900/80 shadow-md">
                      {formatWikiContent(selectedTerm.definition)}
                    </div>
                  </div>
 
                  {/* Why Trending */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Why It's Trending</span>
                    </div>
                    <div className="bg-zinc-900/30 p-5 rounded-xl border border-zinc-900/80 shadow-md">
                      {formatWikiContent(selectedTerm.why_trending)}
                    </div>
                  </div>

                  {/* Concept tags system */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <Activity className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Classification Tags</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getConceptTags(selectedTerm).map((tag, i) => (
                        <Badge key={i} variant="outline" className="bg-zinc-900 text-zinc-300 border-zinc-800 font-mono text-[9px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <History className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Historical Progression Timeline</span>
                  </div>
                  {timelineLoading ? (
                    <div className="space-y-3 pl-6 py-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : (
                    renderTimelineProgress(timelineData?.timeline)
                  )}
                </div>
              )}

              {activeTab === 'references' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <ExternalLink className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Ecosystem References</span>
                  </div>
                  
                  {getLinks(selectedTerm).length === 0 ? (
                    <p className="text-xs text-muted-foreground italic pl-2">No references attached to this term.</p>
                  ) : (
                    <ul className="space-y-2.5">
                      {getLinks(selectedTerm).map((url, i) => (
                        <li key={i} className="flex items-center gap-2.5 text-xs bg-zinc-900/40 p-3 rounded-lg border border-zinc-900">
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                          <a
                            href={getAbsoluteUrl(url)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-zinc-300 hover:text-primary hover:underline break-all"
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
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <BookOpen className="h-10 w-10 text-zinc-700 mb-2" />
            <p className="text-sm font-semibold">No wiki entry selected.</p>
            <p className="text-xs max-w-xs mt-1">
              Select an indexed concept from the left panel glossary list or request new generation.
            </p>
          </div>
        )}
      </div>

      {/* Manual term request modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Request Wiki Curation"
        size="md"
      >
        <form onSubmit={handleCreateTermSubmit} className="space-y-4">
          <div className="space-y-1.5 flex flex-col gap-1">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
              Technology Term Name
            </label>
            <Input
              value={newTermName}
              onChange={(e) => setNewTermName(e.target.value)}
              placeholder="e.g., LlamaIndex, Dify, LangGraph"
              required
              className="bg-zinc-900 border-zinc-800 text-sm"
            />
            <div className="flex gap-2 p-3 bg-zinc-900/40 border border-zinc-900 rounded-lg mt-2 text-[10px] text-muted-foreground leading-relaxed">
              <Info className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
              <span>
                This triggers a LangChain worker agent in the background to scrape documents, compile descriptions, determine trends, extract related URLs, and vectorize it inside Chroma DB.
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-900">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={generateMutation.isPending}
            >
              Submit Curation Worker
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DevWiki;
