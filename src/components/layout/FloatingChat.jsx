import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  MessageSquare, 
  Plus, 
  Send, 
  Trash2, 
  Sparkles, 
  User, 
  Cpu, 
  BookOpen, 
  ExternalLink,
  Copy,
  X,
  Edit2,
  Check,
  History,
  ChevronLeft,
  Minus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { chatService } from '@/services/chatService';
import Skeleton from '@/components/ui/Skeleton';

const FloatingChat = () => {
  const {
    sessions,
    activeSessionId,
    selectedModel,
    chatHistories,
    setSelectedModel,
    setActiveSessionId,
    createNewSession,
    deleteSession,
    addMessage,
    updateLastMessage,
    clearHistory,
    renameSession
  } = useChatStore();

  const { isAuthenticated, setAuthModalOpen } = useAuthStore();
  const { showConfirm } = useUIStore();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [hoveredCitation, setHoveredCitation] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Fetch available AI models
  const { data: models = [], isLoading: modelsLoading } = useQuery({
    queryKey: ['ai', 'models'],
    queryFn: chatService.getChatModels
  });

  // Auto-create session if none exists
  useEffect(() => {
    if (isOpen && !activeSessionId) {
      if (sessions.length > 0) {
        setActiveSessionId(sessions[0].id);
      } else {
        createNewSession();
      }
    }
  }, [isOpen, activeSessionId, sessions, createNewSession, setActiveSessionId]);

  const activeMessages = chatHistories[activeSessionId] || [];

  // Auto-scroll on new messages
  const lastMessageContent = activeMessages[activeMessages.length - 1]?.content || '';
  useEffect(() => {
    if (isOpen && chatContainerRef.current) {
      const timer = setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [lastMessageContent, isOpen]);

  // Streaming send
  const handleSendMessageStream = async (userText) => {
    setIsStreaming(true);
    try {
      let currentSessionId = activeSessionId;
      if (!currentSessionId) {
        currentSessionId = createNewSession();
      }

      addMessage(currentSessionId, { role: 'user', content: userText });
      addMessage(currentSessionId, { role: 'assistant', content: '', citations: [] });

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
              } catch (e) { /* ignore parse errors */ }
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

  const handleNewChat = () => {
    createNewSession();
    setShowHistory(false);
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
    toast.success('Renamed.');
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Inline formatting renderer
  const renderInlineFormatting = (text, citations = [], showCursor = false) => {
    if (!text) return '';
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\[\d+\])/g);
    return parts.map((part, idx) => {
      const isLastPart = idx === parts.length - 1;
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-bold text-zinc-950">
            {part.slice(2, -2)}
            {isLastPart && showCursor && <span className="inline-block w-1.5 h-3.5 bg-primary ml-1 animate-pulse rounded-sm align-middle" />}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={idx} className="italic text-zinc-800">
            {part.slice(1, -1)}
            {isLastPart && showCursor && <span className="inline-block w-1.5 h-3.5 bg-primary ml-1 animate-pulse rounded-sm align-middle" />}
          </em>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={idx} className="bg-muted px-1 py-0.5 rounded text-[10px] text-primary font-mono border border-border">
            {part.slice(1, -1)}
            {isLastPart && showCursor && <span className="inline-block w-1.5 h-3.5 bg-primary ml-1 animate-pulse rounded-sm align-middle" />}
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
                className="inline-flex items-center justify-center bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded px-1 py-0.5 mx-0.5 text-[8px] font-bold font-mono align-super cursor-pointer select-none transition-colors"
              >
                [{citeNum}]
              </span>
              {isLastPart && showCursor && <span className="inline-block w-1.5 h-3.5 bg-primary ml-1 animate-pulse rounded-sm align-middle" />}
            </span>
          );
        }
      }
      return (
        <span key={idx}>
          {part}
          {isLastPart && showCursor && <span className="inline-block w-1.5 h-3.5 bg-primary ml-1 animate-pulse rounded-sm align-middle" />}
        </span>
      );
    });
  };

  // Message content renderer
  const renderMessageContent = (text, citations = [], showCursor = false) => {
    if (!text) return null;
    const parts = text.split(/(```[\s\S]*?```)/g);

    return (
      <div className="space-y-3 font-sans text-xs text-zinc-900 leading-relaxed">
        {parts.map((part, idx) => {
          const isLastPart = idx === parts.length - 1;
          if (part.startsWith('```') && part.endsWith('```')) {
            const match = part.match(/```(\w*)\n([\s\S]*?)```/);
            const lang = match ? match[1] : 'code';
            const code = match ? match[2] : part.slice(3, -3);
            return (
              <div key={idx} className="border border-border rounded-xl overflow-hidden bg-muted/30 font-mono text-[10px] my-2 shadow-sm">
                <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b border-border text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
                  <span>{lang || 'code'}</span>
                  <button onClick={() => handleCopyText(code)} className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer">
                    <Copy className="h-2.5 w-2.5" /> Copy
                  </button>
                </div>
                <pre className="p-3 overflow-x-auto text-zinc-950 select-all leading-relaxed whitespace-pre-wrap">{code}</pre>
              </div>
            );
          } else {
            const lines = part.split('\n');
            return (
              <div key={idx} className="space-y-1.5">
                {lines.map((line, lIdx) => {
                  const trimmed = line.trim();
                  if (!trimmed || trimmed === '---') return null;
                  const isLastLine = isLastPart && lines.length - 1 === lIdx;

                  if (trimmed.startsWith('### ')) {
                    return <h4 key={lIdx} className="text-primary font-bold text-xs mt-2 font-serif">{trimmed.replace(/^###\s*/, '')}</h4>;
                  }
                  if (trimmed.startsWith('## ')) {
                    return <h3 key={lIdx} className="text-zinc-950 font-bold text-xs mt-3 font-serif border-b border-border pb-1">{trimmed.replace(/^##\s*/, '')}</h3>;
                  }
                  if (trimmed.startsWith('# ')) {
                    return <h2 key={lIdx} className="text-zinc-950 font-bold text-sm mt-3 font-serif">{trimmed.replace(/^#\s*/, '')}</h2>;
                  }
                  if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                    return (
                      <li key={lIdx} className="ml-4 list-disc pl-1 text-zinc-900 marker:text-primary">
                        {renderInlineFormatting(trimmed.replace(/^[*-]\s+/, ''), citations, showCursor && isLastLine)}
                      </li>
                    );
                  }
                  return (
                    <p key={lIdx} className="my-1">
                      {renderInlineFormatting(line, citations, showCursor && isLastLine)}
                    </p>
                  );
                })}
              </div>
            );
          }
        })}
      </div>
    );
  };

  return (
    <>
      {/* FLOATING BUBBLE BUTTON */}
      {!isOpen && (
        <button
          onClick={() => {
            if (!isAuthenticated) {
              setAuthModalOpen(true);
              return;
            }
            setIsOpen(true);
          }}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer group"
          title="Open devBot Chat"
        >
          <Sparkles className="h-6 w-6 group-hover:rotate-12 transition-transform" />
          {/* Notification dot */}
          {activeMessages.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-white border-2 border-primary flex items-center justify-center">
              <span className="text-[7px] font-bold text-primary">{activeMessages.length > 9 ? '9+' : activeMessages.length}</span>
            </span>
          )}
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-20" />
        </button>
      )}

      {/* CHAT PANEL */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[420px] h-[620px] max-h-[calc(100vh-3rem)] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden animate-fade-in select-none">
          
          {/* HEADER */}
          <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              {showHistory && (
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              <div className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-foreground font-serif tracking-tight">devBot</h2>
                <div className="flex items-center gap-1">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                  </span>
                  <p className="text-[8px] text-muted-foreground font-mono uppercase tracking-wider">Online</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  showHistory ? 'border-primary/20 bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-primary hover:bg-primary/10'
                }`}
                title="Chat History"
              >
                <History className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleNewChat}
                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                title="New Chat"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                title="Close Chat"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Model Selector Bar */}
          <div className="px-4 py-2 border-b border-border/50 bg-muted/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5">
              <Cpu className="h-3 w-3 text-primary animate-pulse" />
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-transparent text-primary focus:outline-none text-[10px] font-bold cursor-pointer"
              >
                {modelsLoading ? (
                  <option>Loading...</option>
                ) : models.length === 0 ? (
                  <option value="openai/gpt-oss-120b">openai/gpt-oss-120b</option>
                ) : (
                  models.map(m => (
                    <option key={m.model} value={m.model} className="bg-card text-foreground">
                      {m.provider} - {m.model}
                    </option>
                  ))
                )}
              </select>
            </div>
            <span className="text-[9px] text-muted-foreground font-mono">
              {activeMessages.length} msgs
            </span>
          </div>

          {/* BODY */}
          <div className="flex-1 min-h-0 relative overflow-hidden">
            
            {/* HISTORY PANEL */}
            {showHistory && (
              <div className="absolute inset-0 z-10 bg-card flex flex-col animate-fade-in">
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                  {sessions.length === 0 ? (
                    <div className="text-center py-16 text-[10px] text-muted-foreground italic font-serif">
                      No conversations yet.
                    </div>
                  ) : (
                    sessions.map((s) => (
                      <div
                        key={s.id}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group border ${
                          activeSessionId === s.id
                            ? 'bg-primary/8 border-primary/20 shadow-sm'
                            : 'border-transparent hover:bg-muted/50 hover:border-border'
                        }`}
                      >
                        {renamingId === s.id ? (
                          <div className="flex items-center gap-1 w-full">
                            <input
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(s.id)}
                              className="bg-background text-foreground border border-border rounded-lg px-2 py-1 text-[10px] w-full focus:outline-none focus:border-primary font-sans"
                              autoFocus
                            />
                            <button onClick={() => handleSaveRename(s.id)} className="text-primary hover:text-primary/80 cursor-pointer p-0.5">
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setRenamingId(null)} className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => { setActiveSessionId(s.id); setShowHistory(false); }}
                              className="flex-1 min-w-0 text-left mr-2 cursor-pointer"
                            >
                              <div className={`text-[11px] truncate font-sans ${
                                activeSessionId === s.id ? 'text-primary font-bold' : 'text-foreground/80'
                              }`}>
                                {s.title}
                              </div>
                              <div className="text-[8px] text-muted-foreground font-mono mt-0.5">
                                {new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </button>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleStartRename(s)} className="p-1 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/10 cursor-pointer transition-colors" title="Rename">
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => { if (window.confirm('Delete?')) { deleteSession(s.id); toast.success('Deleted.'); } }}
                                className="p-1 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 cursor-pointer transition-colors"
                                title="Delete"
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
                  <div className="p-3 border-t border-border">
                    <button
                      onClick={() => { if (window.confirm('Clear all history?')) { clearHistory(); toast.success('Cleared.'); } }}
                      className="w-full h-7 border border-border hover:bg-destructive/8 text-muted-foreground hover:text-destructive rounded-xl text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" /> Clear All
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* MESSAGES */}
            <div ref={chatContainerRef} className="h-full overflow-y-auto p-4 space-y-3">
              {activeMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 select-none py-12">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-primary/50" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground font-serif">Ask devBot anything</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed max-w-[240px]">
                      Analyze codebase files, get summaries, or query your knowledge base.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-1.5 mt-2 max-w-[300px]">
                    {['Latest AI news', 'Trending repos', 'Explain Rust cargo-nextest'].map(s => (
                      <button
                        key={s}
                        onClick={() => { setInputMessage(''); handleSendMessageStream(s); }}
                        className="text-[9px] px-2.5 py-1 rounded-full bg-muted hover:bg-primary/10 border border-border hover:border-primary/20 text-muted-foreground hover:text-primary font-bold cursor-pointer transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                activeMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 group ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role !== 'user' && (
                      <div className="h-7 w-7 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-1">
                        <Sparkles className="h-3.5 w-3.5" />
                      </div>
                    )}

                    <div className={`max-w-[82%] rounded-2xl border transition-all ${
                      msg.role === 'user'
                        ? 'bg-primary/10 border-primary/20 text-zinc-950 rounded-br-md px-3.5 py-2.5'
                        : 'bg-muted/30 border-border text-zinc-900 rounded-bl-md px-3.5 py-3 shadow-sm'
                    }`}>
                      {msg.role === 'user' ? (
                        <p className="text-xs leading-relaxed font-sans font-semibold">{msg.content}</p>
                      ) : (
                        <>
                          {renderMessageContent(
                            msg.content,
                            msg.citations,
                            isStreaming && msg.role === 'assistant' && msg === activeMessages[activeMessages.length - 1]
                          )}
                          
                          {msg.citations?.length > 0 && (
                            <div className="pt-2 mt-2 border-t border-border space-y-1">
                              <div className="text-[8px] font-bold text-primary uppercase tracking-widest font-mono flex items-center gap-1">
                                <BookOpen className="h-3 w-3" /> Sources
                              </div>
                              {msg.citations.map((cite) => (
                                <a
                                  key={cite.id || cite.number}
                                  href={cite.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block text-[9px] text-muted-foreground hover:text-primary truncate transition-colors"
                                >
                                  <span className="font-bold text-primary mr-1">[{cite.id || cite.number}]</span>
                                  {cite.title || 'Source'}
                                </a>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {msg.content && (
                        <button
                          onClick={() => handleCopyText(msg.content)}
                          className="opacity-0 group-hover:opacity-100 mt-1.5 text-[8px] text-muted-foreground hover:text-primary flex items-center gap-0.5 transition-all cursor-pointer"
                        >
                          <Copy className="h-2.5 w-2.5" /> Copy
                        </button>
                      )}
                    </div>

                    {msg.role === 'user' && (
                      <div className="h-7 w-7 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground shrink-0 mt-1">
                        <User className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                ))
              )}

              {isStreaming && activeMessages.length > 0 && activeMessages[activeMessages.length - 1].content === "" && (
                <div className="flex gap-2.5">
                  <div className="h-7 w-7 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Sparkles className="h-3.5 w-3.5 animate-spin" />
                  </div>
                  <div className="bg-muted/30 border border-border rounded-2xl rounded-bl-md px-3.5 py-3 space-y-2 max-w-[82%]">
                    <Skeleton className="h-3 w-40 rounded" />
                    <Skeleton className="h-3 w-32 rounded" />
                    <Skeleton className="h-3 w-24 rounded" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* INPUT AREA */}
          <div className="px-3 py-3 border-t border-border bg-muted/10 shrink-0">
            <form onSubmit={handleSendMessage} className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  rows={1}
                  placeholder={isStreaming ? "Thinking..." : "Ask anything..."}
                  disabled={isStreaming}
                  className="w-full bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl text-xs text-zinc-950 placeholder-zinc-500 focus:outline-none resize-none px-3 py-2.5 leading-relaxed max-h-20 overflow-y-auto"
                  style={{ minHeight: '38px' }}
                />
              </div>
              <button
                type="submit"
                disabled={!inputMessage.trim() || isStreaming}
                className="h-[38px] w-[38px] bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-white rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:pointer-events-none shrink-0"
              >
                {isStreaming ? (
                  <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </button>
            </form>
            <p className="text-[8px] text-zinc-600 text-center mt-1.5 font-mono">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChat;
