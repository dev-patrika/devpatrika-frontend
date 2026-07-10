import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Newspaper, 
  BookOpen, 
  Github, 
  Clock, 
  Globe, 
  ArrowRight,
  Send,
  Sparkles,
  User,
  Cpu,
  Info,
  Copy,
  Plus,
  RefreshCcw,
  ExternalLink,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  Edit2,
  Trash2,
  Check,
  X,
  History,
  Sidebar as SidebarIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useChatStore } from '@/store/chatStore';
import { chatService } from '@/services/chatService';
import { newsService } from '@/services/newsService';
import { githubService } from '@/services/githubService';
import { reportService } from '@/services/reportService';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';
import Badge from '@/components/ui/Badge';

const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Chat Store states
  const { 
    sessions, 
    activeSessionId, 
    selectedModel, 
    chatHistories, 
    setSelectedModel, 
    setActiveSessionId, 
    createNewSession, 
    addMessage,
    updateLastMessage,
    renameSession,
    deleteSession,
    clearHistory
  } = useChatStore();

  const [inputMessage, setInputMessage] = useState('');
  const [hoveredCitation, setHoveredCitation] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasStartedChatting, setHasStartedChatting] = useState(false);
  const [greeting, setGreeting] = useState('Good morning');
  const [showHistorySidebar, setShowHistorySidebar] = useState(true);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  // Dynamic greetings
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Fetch available AI models from backend
  const { data: models = [], isLoading: modelsLoading } = useQuery({
    queryKey: ['ai', 'models'],
    queryFn: chatService.getChatModels
  });

  // Load preview data for the tiles
  const { data: news = [], isLoading: newsLoading } = useQuery({
    queryKey: ['news', 'dashboard-preview'],
    queryFn: () => newsService.getNews({ limit: 2 })
  });

  const { data: repos = [], isLoading: reposLoading } = useQuery({
    queryKey: ['github', 'dashboard-preview'],
    queryFn: githubService.getTrendingRepos
  });

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['reports', 'dashboard-preview'],
    queryFn: reportService.getWeeklyReports
  });

  const activeMessages = chatHistories[activeSessionId] || [];

  // Automatically create a new session if none exists
  useEffect(() => {
    if (!activeSessionId) {
      if (sessions.length > 0) {
        setActiveSessionId(sessions[0].id);
      } else {
        createNewSession();
      }
    }
  }, [activeSessionId, sessions, createNewSession, setActiveSessionId]);

  // Set chat state on load if messages already exist in thread
  useEffect(() => {
    if (activeMessages.length > 0) {
      setHasStartedChatting(true);
    } else {
      setHasStartedChatting(false);
    }
  }, [activeSessionId, activeMessages.length]);

  // Handle parent scrolling prevention on chat mode
  useEffect(() => {
    const mainElement = document.querySelector('main');
    if (mainElement) {
      if (hasStartedChatting) {
        mainElement.classList.remove('overflow-y-auto');
        mainElement.classList.add('overflow-hidden');
      } else {
        mainElement.classList.remove('overflow-hidden');
        mainElement.classList.add('overflow-y-auto');
      }
    }
    
    return () => {
      if (mainElement) {
        mainElement.classList.remove('overflow-hidden');
        mainElement.classList.add('overflow-y-auto');
      }
    };
  }, [hasStartedChatting]);

  // Auto-scroll chat window to bottom on new messages and stream updates
  const lastMessageContent = activeMessages[activeMessages.length - 1]?.content || '';
  useEffect(() => {
    if (hasStartedChatting && chatContainerRef.current) {
      const timer = setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [lastMessageContent, hasStartedChatting, chatContainerRef.current]);

  // Send message streaming logic
  const handleSendMessageStream = async (userText) => {
    setIsStreaming(true);
    setHasStartedChatting(true);

    try {
      let currentSessionId = activeSessionId;
      if (!currentSessionId) {
        currentSessionId = createNewSession();
      }

      // Push User message locally
      addMessage(currentSessionId, {
        role: 'user',
        content: userText
      });

      // Push an empty assistant message to update
      addMessage(currentSessionId, {
        role: 'assistant',
        content: '',
        citations: []
      });

      const response = await chatService.streamChatMessage({
        model: selectedModel,
        session_id: currentSessionId,
        message: userText
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '');
              try {
                const data = JSON.parse(dataStr);
                if (data.type === 'text') {
                  updateLastMessage(currentSessionId, data.content);
                } else if (data.type === 'citations') {
                  updateLastMessage(currentSessionId, '', data.citations);
                } else if (data.type === 'error') {
                  toast.error(data.content);
                  updateLastMessage(currentSessionId, '\n\n*Error:* ' + data.content);
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      }
    } catch (err) {
      toast.error('Failed to connect to AI engine.');
      updateLastMessage(activeSessionId, '\n\n*Error:* Connection failed.');
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isStreaming) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    handleSendMessageStream(userText);
  };

  const handleSuggestionClick = (suggestionText) => {
    if (isStreaming) return;
    handleSendMessageStream(suggestionText);
  };

  const handleNewChat = () => {
    createNewSession();
    setHasStartedChatting(false);
    setInputMessage('');
  };

  const handleStartRename = (s) => {
    setRenamingId(s.id);
    setRenameValue(s.title);
  };

  const handleSaveRename = (id) => {
    if (!renameValue.trim()) return;
    renameSession(id, renameValue.trim());
    setRenamingId(null);
    toast.success('Conversation renamed.');
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Custom parser to split by markdown blocks and render them beautifully
  const renderInlineFormatting = (text, citations = [], showCursor = false) => {
    if (!text) return '';
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\[\d+\])/g);
    return parts.map((part, idx) => {
      const isLastPart = idx === parts.length - 1;
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-bold text-zinc-100">
            {part.slice(2, -2)}
            {isLastPart && showCursor && (
              <span className="inline-block w-1.5 h-3.5 bg-primary ml-1 animate-pulse rounded-sm align-middle" />
            )}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={idx} className="italic text-zinc-300">
            {part.slice(1, -1)}
            {isLastPart && showCursor && (
              <span className="inline-block w-1.5 h-3.5 bg-primary ml-1 animate-pulse rounded-sm align-middle" />
            )}
          </em>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={idx} className="bg-zinc-900 px-1.5 py-0.5 rounded text-xs text-primary font-mono">
            {part.slice(1, -1)}
            {isLastPart && showCursor && (
              <span className="inline-block w-1.5 h-3.5 bg-primary ml-1 animate-pulse rounded-sm align-middle" />
            )}
          </code>
        );
      }
      const citeMatch = part.match(/^\[(\d+)\]$/);
      if (citeMatch) {
        const citeNum = parseInt(citeMatch[1], 10);
        const source = citations.find(c => c.id === citeNum) || 
                       citations.find(c => c.number === citeNum) ||
                       citations[citeNum - 1];
        if (source) {
          return (
            <span key={idx}>
              <span
                onMouseEnter={() => setHoveredCitation(source)}
                onMouseLeave={() => setHoveredCitation(null)}
                className="inline-flex items-center justify-center bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded px-1 py-0.5 mx-0.5 text-[9px] font-bold font-mono align-super cursor-pointer select-none transition-colors"
              >
                [{citeNum}]
              </span>
              {isLastPart && showCursor && (
                <span className="inline-block w-1.5 h-3.5 bg-primary ml-1 animate-pulse rounded-sm align-middle" />
              )}
            </span>
          );
        }
      }
      return (
        <span key={idx}>
          {part}
          {isLastPart && showCursor && (
            <span className="inline-block w-1.5 h-3.5 bg-primary ml-1 animate-pulse rounded-sm align-middle" />
          )}
        </span>
      );
    });
  };

  const parseMarkdownTable = (tableLines, tableKey, citations = []) => {
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
                  {renderInlineFormatting(h, citations)}
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
                          {renderInlineFormatting(line, citations)}
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

  const renderMessageContent = (text, citations = [], showCursor = false) => {
    if (!text) return null;
    const parts = text.split(/(```[\s\S]*?```)/g);

    return (
      <div className="space-y-4 font-sans text-sm text-zinc-300 leading-relaxed max-w-3xl">
        {parts.map((part, idx) => {
          const isLastPart = idx === parts.length - 1;
          if (part.startsWith('```') && part.endsWith('```')) {
            const match = part.match(/```(\w*)\n([\s\S]*?)```/);
            const lang = match ? match[1] : 'code';
            const code = match ? match[2] : part.slice(3, -3);

            return (
              <div key={idx} className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950 font-mono text-xs my-2.5 shadow-sm">
                <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  <span>{lang || 'code'}</span>
                  <button
                    onClick={() => handleCopyText(code)}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    <Copy className="h-3 w-3" /> Copy Code
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-zinc-300 select-all leading-relaxed whitespace-pre-wrap">{code}</pre>
              </div>
            );
          } else {
            const lines = part.split('\n');
            const elements = [];
            let currentTableLines = [];

            const flushTable = () => {
              if (currentTableLines.length > 0) {
                const tableKey = `table-${idx}-${elements.length}`;
                const tableElement = parseMarkdownTable(currentTableLines, tableKey, citations);
                if (tableElement) {
                  elements.push(tableElement);
                } else {
                  currentTableLines.forEach((tLine, tlIdx) => {
                    const isLastLine = isLastPart && currentTableLines.length - 1 === tlIdx;
                    elements.push(
                      <p key={`fb-${idx}-${elements.length}`} className="my-1.5">
                        {renderInlineFormatting(tLine, citations, showCursor && isLastLine)}
                      </p>
                    );
                  });
                }
                currentTableLines = [];
              }
            };

            lines.forEach((line, lIdx) => {
              const trimmed = line.trim();
              if (trimmed.startsWith('|')) {
                currentTableLines.push(line);
              } else {
                flushTable();

                if (!trimmed) return;
                
                const isLastLine = isLastPart && lines.length - 1 === lIdx;

                if (trimmed.startsWith('---') || trimmed.replace(/^[*-]\s*/, '').startsWith('---')) {
                  elements.push(<hr key={`hr-${idx}-${elements.length}`} className="border-zinc-900 my-4" />);
                } else if (trimmed.startsWith('# ')) {
                  elements.push(
                    <h1 key={`h1-${idx}-${elements.length}`} className="text-xl font-extrabold text-foreground border-b border-zinc-900 pb-2 mt-6 font-mono tracking-tight">
                      {trimmed.replace(/^#\s+/, '')}
                    </h1>
                  );
                } else if (trimmed.startsWith('## ')) {
                  elements.push(
                    <h2 key={`h2-${idx}-${elements.length}`} className="text-lg font-bold text-zinc-150 border-b border-zinc-900/60 pb-1 mt-5 font-mono tracking-tight">
                      {trimmed.replace(/^##\s+/, '')}
                    </h2>
                  );
                } else if (trimmed.startsWith('### ')) {
                  elements.push(
                    <h3 key={`h3-${idx}-${elements.length}`} className="text-base font-bold text-primary mt-4 font-mono tracking-tight">
                      {trimmed.replace(/^###\s+/, '')}
                    </h3>
                  );
                } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                  elements.push(
                    <li key={`li-${idx}-${elements.length}`} className="ml-5 list-disc pl-1 text-zinc-300 marker:text-primary">
                      {renderInlineFormatting(trimmed.replace(/^[*-]\s+/, ''), citations, showCursor && isLastLine)}
                    </li>
                  );
                } else {
                  elements.push(
                    <p key={`p-${idx}-${elements.length}`} className="my-1.5">
                      {renderInlineFormatting(line, citations, showCursor && isLastLine)}
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

  const suggestions = [
    "What trending tools were indexed recently?",
    "Explain Rust cargo-nextest architecture",
    "Show me latest Artificial Intelligence news",
    "What is the Databricks coding agent benchmark?"
  ];

  return (
    <div className="h-[calc(100vh-10rem)] md:h-[calc(100vh-11.5rem)] flex flex-col relative overflow-hidden">
      {/* Vercel Grid background effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10 opacity-30" />

      {/* Main Container - switch layouts smoothly */}
      <div className={`flex-1 flex flex-col justify-center min-h-0 relative transition-all duration-500 ease-in-out ${
        hasStartedChatting ? 'justify-start w-full' : 'justify-center max-w-4xl mx-auto w-full'
      }`}>
        
        {/* LANDING PAGE - Greeting and Status */}
        {!hasStartedChatting && (
          <div className="text-center space-y-4 mb-10 transition-all duration-500">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950 border border-zinc-850 text-[10px] font-bold font-mono uppercase tracking-widest text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Automated Engine Active
            </div>
            
            <div className="space-y-1">
              <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-550 bg-clip-text text-transparent">
                {greeting}, Developer
              </h1>
              <p className="text-zinc-400 text-sm font-semibold tracking-wide">
                What can I help you with today?
              </p>
            </div>
          </div>
        )}

        {/* ACTIVE CONVERSATION ROOM SPLIT VIEW */}
        {hasStartedChatting && (
          <div className="flex-1 flex gap-5 min-h-0 overflow-hidden w-full">
            
            {/* COLLAPSIBLE CONVERSATIONS HISTORY SIDEBAR */}
            {showHistorySidebar && (
              <div className="hidden md:flex w-60 border border-zinc-900 bg-zinc-950/20 rounded-2xl flex-col overflow-hidden glass-panel shrink-0 animate-fade-in min-h-0">
                <div className="p-3.5 border-b border-zinc-900 flex items-center justify-between bg-card/10">
                  <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                    <History className="h-3.5 w-3.5 text-primary animate-pulse" /> History
                  </h3>
                  <button
                    onClick={createNewSession}
                    className="p-1 rounded hover:bg-zinc-800 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    title="New Chat Session"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
                  {sessions.length === 0 ? (
                    <div className="text-center py-12 text-[10px] text-zinc-500 italic">
                      No past conversations.
                    </div>
                  ) : (
                    sessions.map((s) => (
                      <div
                        key={s.id}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-all group border ${
                          activeSessionId === s.id
                            ? 'bg-primary/10 text-primary border-primary/20 font-bold'
                            : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-foreground border-transparent'
                        }`}
                      >
                        {renamingId === s.id ? (
                          <div className="flex items-center gap-1 w-full">
                            <input
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(s.id)}
                              className="bg-zinc-900 text-foreground border border-zinc-800 rounded px-1.5 py-0.5 text-[10px] w-full focus:outline-none focus:border-primary font-mono"
                              autoFocus
                            />
                            <button onClick={() => handleSaveRename(s.id)} className="text-primary hover:text-emerald-400 cursor-pointer">
                              <Check className="h-3 w-3" />
                            </button>
                            <button onClick={() => setRenamingId(null)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => setActiveSessionId(s.id)}
                              className="flex-1 text-[11px] truncate text-left font-sans mr-2 cursor-pointer"
                            >
                              {s.title}
                            </button>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleStartRename(s)}
                                className="p-1 text-muted-foreground hover:text-foreground rounded cursor-pointer"
                                title="Rename Session"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm('Delete this conversation thread?')) {
                                    deleteSession(s.id);
                                    toast.success('Session deleted.');
                                  }
                                }}
                                className="p-1 text-muted-foreground hover:text-red-400 rounded cursor-pointer"
                                title="Delete Session"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
                
                {sessions.length > 0 && (
                  <div className="p-3 border-t border-zinc-900 bg-card/10">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (window.confirm('Clear all conversation histories?')) {
                          clearHistory();
                          setHasStartedChatting(false);
                          toast.success('Cleared all histories.');
                        }
                      }}
                      className="w-full text-[10px] text-muted-foreground border-zinc-900 hover:border-red-950/40 hover:bg-red-950/10 hover:text-red-400 py-1.5"
                    >
                      Clear All History
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* DOCKED ACTIVE CHAT AREA */}
            <div className="flex-1 border border-zinc-900 bg-zinc-950/40 rounded-2xl flex flex-col overflow-hidden glass-panel relative min-h-0">
              
              {/* CHAT AREA HEADER */}
              <div className="px-4 py-3 border-b border-zinc-900 flex items-center justify-between shrink-0 bg-background/25 backdrop-blur-sm z-10">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setShowHistorySidebar(!showHistorySidebar)}
                    className="p-1.5 rounded-lg border border-zinc-850 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-primary transition-colors hidden md:block cursor-pointer"
                    title={showHistorySidebar ? "Hide History" : "Show History"}
                  >
                    <SidebarIcon className="h-4 w-4" />
                  </button>
                  <Sparkles className="h-5 w-5 text-primary" />
                  <div>
                    <h2 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">devBot Assistant</h2>
                    <p className="text-[9px] text-muted-foreground">Conversational memory active.</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Model Selector */}
                  <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1">
                    <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="bg-transparent text-zinc-350 focus:outline-none text-[10px] font-semibold cursor-pointer"
                    >
                      {modelsLoading ? (
                        <option>Loading...</option>
                      ) : models.length === 0 ? (
                        <option value="openai/gpt-oss-120b">openai/gpt-oss-120b</option>
                      ) : (
                        models.map(m => (
                          <option key={m.model} value={m.model} className="bg-zinc-950 text-zinc-300">
                            {m.provider} - {m.model}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* New Chat */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNewChat}
                    className="h-8 border-zinc-800 text-[10px] text-muted-foreground hover:text-primary transition-all font-mono"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> New Chat
                  </Button>
                </div>
              </div>

              {/* MESSAGES CONTAINER */}
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {activeMessages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center py-20 text-xs text-muted-foreground italic">
                    Initializing RAG context...
                  </div>
                ) : (
                  activeMessages.map((msg) => (
                    <div 
                      key={msg.id}
                      className={`flex gap-4 p-4 rounded-xl border border-zinc-900/60 group relative ${
                        msg.role === 'user' 
                          ? 'bg-zinc-900/20' 
                          : 'bg-emerald-500/[0.005] border-emerald-500/5'
                      }`}
                    >
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border ${
                        msg.role === 'user'
                          ? 'bg-zinc-900 border-zinc-800 text-zinc-300'
                          : 'bg-primary/10 border-primary/20 text-primary'
                      }`}>
                        {msg.role === 'user' ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                      </div>

                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider font-mono">
                            {msg.role === 'user' ? 'Developer' : 'Intelligence Agent'}
                          </div>
                          
                          <button
                            onClick={() => handleCopyText(msg.content)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground rounded transition-opacity"
                            title="Copy Response"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {renderMessageContent(
                          msg.content, 
                          msg.citations, 
                          isStreaming && msg.role === 'assistant' && msg === activeMessages[activeMessages.length - 1]
                        )}

                        {/* Citations Footer */}
                        {msg.citations?.length > 0 && (
                          <div className="pt-3 border-t border-zinc-900/80 space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest font-mono">
                              <BookOpen className="h-3.5 w-3.5 text-primary" /> Sources & References
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {msg.citations.map((cite) => (
                                <div
                                  key={cite.id || cite.number}
                                  className="p-2 bg-zinc-900/30 rounded border border-zinc-900 hover:border-zinc-800 flex items-center justify-between text-[10px]"
                                >
                                  <span className="text-zinc-300 truncate pr-2 font-sans">
                                    <span className="font-bold text-primary mr-1">[{cite.id || cite.number}]</span>
                                    {cite.title || 'Source Reference'}
                                  </span>
                                  <a
                                    href={cite.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-muted-foreground hover:text-primary transition-colors"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {/* Thinking Spinner */}
                {isStreaming && activeMessages.length > 0 && activeMessages[activeMessages.length - 1].content === "" && (
                  <div className="flex gap-4 p-4 rounded-xl border border-zinc-900/60 bg-emerald-500/[0.005]">
                    <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4 animate-spin" />
                    </div>
                    <div className="space-y-3 flex-1">
                      <div className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider font-mono">
                        Intelligence Agent
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* DOCKED INPUT AREA */}
              <div className="w-full px-4 border-t border-zinc-900 py-4 bg-zinc-950/40 shrink-0">
                <form 
                  onSubmit={handleSendMessage} 
                  className={`max-w-2xl mx-auto rounded-2xl border bg-zinc-950/65 backdrop-blur-md shadow-xl transition-all duration-300 ${
                    isStreaming ? 'border-primary/20' : 'border-zinc-850 hover:border-zinc-700'
                  }`}
                >
                  <div className="p-3 pb-1">
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      rows={2}
                      placeholder={isStreaming ? "AI is processing answer..." : "Ask devBot anything..."}
                      disabled={isStreaming}
                      className="w-full bg-transparent border-0 text-foreground text-sm focus:outline-none resize-none placeholder-zinc-500 leading-relaxed font-sans px-1"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-900/60 bg-zinc-900/10">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Enter to send, Shift+Enter for new line
                      </span>
                      
                      <Button
                        type="submit"
                        disabled={isStreaming || !inputMessage.trim()}
                        variant="primary"
                        size="icon"
                        className="h-8.5 w-8.5 rounded-xl shrink-0 transition-transform active:scale-95 cursor-pointer"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* UNIFIED INPUT BOX AREA (LANDING PAGE ONLY) */}
        {!hasStartedChatting && (
          <div className="w-full px-4">
            <form 
              onSubmit={handleSendMessage} 
              className={`max-w-2xl mx-auto rounded-2xl border bg-zinc-950/65 backdrop-blur-md shadow-xl transition-all duration-300 ${
                isStreaming ? 'border-primary/20' : 'border-zinc-850 hover:border-zinc-700'
              }`}
            >
              <div className="p-3 pb-1">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  rows={3}
                  placeholder={isStreaming ? "AI is processing answer..." : "Ask devBot anything..."}
                  disabled={isStreaming}
                  className="w-full bg-transparent border-0 text-foreground text-sm focus:outline-none resize-none placeholder-zinc-500 leading-relaxed font-sans px-1"
                />
              </div>
              
              <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-900/60 bg-zinc-900/10">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 select-none">
                      <Cpu className="h-3 w-3 text-primary animate-pulse" />
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="bg-transparent text-zinc-350 focus:outline-none text-[10px] font-bold cursor-pointer"
                      >
                        {modelsLoading ? (
                          <option>Loading...</option>
                        ) : models.length === 0 ? (
                          <option value="openai/gpt-oss-120b">openai/gpt-oss-120b</option>
                        ) : (
                          models.map(m => (
                            <option key={m.model} value={m.model} className="bg-zinc-950 text-zinc-300">
                              {m.provider} - {m.model}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                    
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Enter to send, Shift+Enter for new line
                    </span>
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={isStreaming || !inputMessage.trim()}
                    variant="primary"
                    size="icon"
                    className="h-8.5 w-8.5 rounded-xl shrink-0 transition-transform active:scale-95 cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </form>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-2xl mx-auto">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestionClick(s)}
                  className="text-[10px] px-3.5 py-1.5 rounded-full bg-zinc-900/40 hover:bg-zinc-900/90 border border-zinc-850 hover:border-zinc-700 transition-all text-zinc-350 cursor-pointer hover:text-foreground font-medium"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Hover Citation Popover */}
        {hoveredCitation && (
          <div className="absolute bottom-24 left-6 right-6 p-3 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl text-xs z-20 flex gap-2.5 animate-slide-up">
            <Info className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="font-bold text-zinc-200 truncate">{hoveredCitation.title || 'Source Context Reference'}</div>
              <div className="text-[10px] text-muted-foreground truncate font-mono mt-0.5">{hoveredCitation.url}</div>
            </div>
            <a
              href={hoveredCitation.url}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-primary hover:underline shrink-0 self-center flex items-center gap-1"
            >
              Open <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* BOTTOM THREE NAVIGATION PREVIEW TILES (LANDING PAGE ONLY) */}
        {!hasStartedChatting && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full transition-all duration-500 ease-in-out select-none">
            
            {/* Tile 1: Daily Feed */}
            <div 
              onClick={() => navigate('/feed')}
              className="group p-5 bg-zinc-950/40 hover:bg-zinc-900/30 border border-zinc-900 hover:border-emerald-500/25 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/[0.02]"
            >
              <div className="flex items-center gap-3.5 mb-3.5">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-300 transition-colors">
                  <Newspaper className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-200">Daily Feed</h3>
                  <p className="text-[10px] text-muted-foreground">Aggregated tech news & summaries</p>
                </div>
              </div>
              <div className="space-y-2 border-t border-zinc-900/60 pt-3">
                {newsLoading ? (
                  <Skeleton className="h-8 w-full" />
                ) : news.length === 0 ? (
                  <div className="text-[10px] text-zinc-500 italic">No news feeds found.</div>
                ) : (
                  news.map(n => (
                    <div key={n.id} className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-zinc-300 group-hover:text-primary transition-colors truncate">
                        {n.title}
                      </span>
                      <span className="text-[8px] font-mono text-muted-foreground">
                        {n.source} • {new Date(n.published_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-zinc-400 group-hover:text-primary transition-all">
                <span>Browse feed</span>
                <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Tile 2: GitHub Radar */}
            <div 
              onClick={() => navigate('/github')}
              className="group p-5 bg-zinc-950/40 hover:bg-zinc-900/30 border border-zinc-900 hover:border-teal-500/25 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/[0.02]"
            >
              <div className="flex items-center gap-3.5 mb-3.5">
                <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 group-hover:bg-teal-500/20 group-hover:text-teal-300 transition-colors">
                  <Github className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-200">GitHub Radar</h3>
                  <p className="text-[10px] text-muted-foreground">Trending repositories insight</p>
                </div>
              </div>
              <div className="space-y-2 border-t border-zinc-900/60 pt-3">
                {reposLoading ? (
                  <Skeleton className="h-8 w-full" />
                ) : repos.length === 0 ? (
                  <div className="text-[10px] text-zinc-500 italic">No trending repos found.</div>
                ) : (
                  repos.slice(0, 2).map(r => (
                    <div key={r.id} className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-zinc-300 group-hover:text-teal-400 transition-colors truncate">
                        {r.repo_name}
                      </span>
                      <span className="text-[8px] font-mono text-muted-foreground truncate">
                        ★ {(r.stars_count || 0).toLocaleString()} • GitHub Repository
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-zinc-400 group-hover:text-teal-400 transition-all">
                <span>View trends</span>
                <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Tile 3: Weekly Reports */}
            <div 
              onClick={() => navigate('/reports')}
              className="group p-5 bg-zinc-950/40 hover:bg-zinc-900/30 border border-zinc-900 hover:border-amber-500/25 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/[0.02]"
            >
              <div className="flex items-center gap-3.5 mb-3.5">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 group-hover:text-amber-300 transition-colors">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-200">Weekly Reports</h3>
                  <p className="text-[10px] text-muted-foreground">Compiled digest reports</p>
                </div>
              </div>
              <div className="space-y-2 border-t border-zinc-900/60 pt-3">
                {reportsLoading ? (
                  <Skeleton className="h-8 w-full" />
                ) : reports.length === 0 ? (
                  <div className="text-[10px] text-zinc-500 italic">No reports compiled yet.</div>
                ) : (
                  reports.slice(0, 1).map(rep => (
                    <div key={rep.id} className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-zinc-300 group-hover:text-amber-450 transition-colors truncate">
                        {rep.title}
                      </span>
                      <span className="text-[8px] font-mono text-muted-foreground">
                        Compiled on {new Date(rep.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-zinc-400 group-hover:text-amber-455 transition-all">
                <span>View digests</span>
                <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
