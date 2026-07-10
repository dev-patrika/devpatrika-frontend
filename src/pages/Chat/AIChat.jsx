import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
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
  Info,
  Edit2,
  Check,
  X,
  RotateCcw,
  Copy,
  XCircle,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useChatStore } from '@/store/chatStore';
import { chatService } from '@/services/chatService';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Skeleton from '@/components/ui/Skeleton';

const AIChat = () => {
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

  const [inputMessage, setInputMessage] = useState('');
  const [hoveredCitation, setHoveredCitation] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch available AI models from backend
  const { data: models = [], isLoading: modelsLoading } = useQuery({
    queryKey: ['ai', 'models'],
    queryFn: chatService.getChatModels
  });

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

  const activeMessages = chatHistories[activeSessionId] || [];

  // Auto-scroll chat window to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length]);

  // Send message using streaming
  const handleSendMessageStream = async (userText) => {
    setIsStreaming(true);

    try {
      // Push User message locally
      addMessage(activeSessionId, {
        role: 'user',
        content: userText
      });

      // Push an empty assistant message to update
      addMessage(activeSessionId, {
        role: 'assistant',
        content: '',
        citations: []
      });

      const response = await chatService.streamChatMessage({
        model: selectedModel,
        session_id: activeSessionId,
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
                  updateLastMessage(activeSessionId, data.content);
                } else if (data.type === 'citations') {
                  updateLastMessage(activeSessionId, '', data.citations);
                } else if (data.type === 'error') {
                  toast.error(data.content);
                  updateLastMessage(activeSessionId, '\n\n*Error:* ' + data.content);
                }
              } catch (e) {
                // Ignore parse errors for incomplete chunks
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

  // Trigger regeneration using the last human message
  const handleRegenerate = () => {
    if (isStreaming || activeMessages.length === 0) return;
    
    // Find last user message in active thread
    const userMsgs = activeMessages.filter(m => m.role === 'user');
    if (userMsgs.length === 0) return;
    
    const lastUserText = userMsgs[userMsgs.length - 1].content;
    handleSendMessageStream(lastUserText);
  };

  // Clear current thread messages locally
  const handleClearThread = () => {
    if (window.confirm('Clear all messages in the active conversation?')) {
      const updatedHistories = {
        ...chatHistories,
        [activeSessionId]: []
      };
      localStorage.setItem('chat_histories', JSON.stringify(updatedHistories));
      useChatStore.setState({ chatHistories: updatedHistories });
      toast.success('Conversation messages cleared.');
    }
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

  const renderInlineFormatting = (text) => {
    if (!text) return '';
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={idx} className="italic text-muted-foreground">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={idx} className="bg-muted px-1.5 py-0.5 rounded text-[10px] text-primary font-mono">{part.slice(1, -1)}</code>;
      }
      return <span key={idx}>{part}</span>;
    });
  };

  // Custom parser to split by code blocks and render them in copy cards
  const renderMessageContent = (text, citations = []) => {
    if (!text) return null;
    
    // Split by code blocks ```code```
    const parts = text.split(/(```[\s\S]*?```)/g);

    return (
      <div className="space-y-4">
        {parts.map((part, idx) => {
          if (part.startsWith('```') && part.endsWith('```')) {
            // Code block
            const match = part.match(/```(\w*)\n([\s\S]*?)```/);
            const lang = match ? match[1] : 'code';
            const code = match ? match[2] : part.slice(3, -3);

            return (
              <div key={idx} className="border border-border rounded-xl overflow-hidden bg-card font-mono text-xs my-2.5 shadow-sm">
                <div className="flex items-center justify-between px-4 py-2 bg-muted border-b border-border text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  <span>{lang || 'code'}</span>
                  <button
                    onClick={() => handleCopyText(code)}
                    className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer select-none text-[9px] font-bold"
                  >
                    <Copy className="h-3 w-3" /> Copy Code
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-foreground select-all leading-relaxed whitespace-pre-wrap">{code}</pre>
              </div>
            );
          } else {
            // Split block by newlines to render subheadings, bold labels, list items, and paragraph breaks cleanly
            const lines = part.split('\n');
            return (
              <div key={idx} className="space-y-2 text-xs leading-relaxed text-foreground/80 font-sans text-justify">
                {lines.map((line, lIdx) => {
                  const trimmed = line.trim();
                  if (!trimmed || trimmed === '---' || trimmed === '...') return null;

                  const parseCitations = (content) => {
                    const subparts = content.split(/(\[\d+\])/g);
                    return subparts.map((sub, sIdx) => {
                      const citeMatch = sub.match(/^\[(\d+)\]$/);
                      if (citeMatch) {
                        const citeNum = parseInt(citeMatch[1], 10);
                        const source = citations.find(c => c.id === citeNum) || 
                                       citations.find(c => c.number === citeNum) ||
                                       citations[citeNum - 1];
                        
                        if (source) {
                          return (
                            <span
                              key={sIdx}
                              onMouseEnter={() => setHoveredCitation(source)}
                              onMouseLeave={() => setHoveredCitation(null)}
                              className="inline-flex items-center justify-center bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded px-1 py-0.5 mx-0.5 text-[9px] font-bold font-mono align-super cursor-pointer select-none transition-colors"
                            >
                              [{citeNum}]
                            </span>
                          );
                        }
                      }
                      return renderInlineFormatting(sub);
                    });
                  };

                  if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
                    const content = trimmed.replace(/^[*-]\s*/, '');
                    return (
                      <li key={lIdx} className="ml-4 list-disc pl-1 marker:text-primary">
                        {parseCitations(content)}
                      </li>
                    );
                  }

                  if (trimmed.startsWith('###')) {
                    return (
                      <h4 key={lIdx} className="text-primary font-bold text-xs mt-3 uppercase tracking-wider font-mono">
                        {parseCitations(trimmed.replace(/^###\s*/, ''))}
                      </h4>
                    );
                  }
                  if (trimmed.startsWith('##')) {
                    return (
                      <h3 key={lIdx} className="text-foreground font-bold text-sm mt-4 uppercase border-b border-border pb-1">
                        {parseCitations(trimmed.replace(/^##\s*/, ''))}
                      </h3>
                    );
                  }

                  if (trimmed.startsWith('**') && trimmed.includes(':**')) {
                    const parts = trimmed.split(/:\*\*\s*(.*)/s);
                    if (parts.length >= 2) {
                      const label = parts[0].replace(/^\*\*|\*\*$/g, '');
                      const val = parts[1];
                      return (
                        <div key={lIdx} className="mt-3 first:mt-0 space-y-1">
                          <span className="inline-block font-mono text-[8.5px] font-bold text-primary bg-primary/5 px-2 py-0.5 border border-primary/20 rounded-md uppercase tracking-wider">
                            {label}
                          </span>
                          <p className="text-xs text-foreground/80 leading-relaxed pl-0.5">
                            {parseCitations(val)}
                          </p>
                        </div>
                      );
                    }
                  }

                  return (
                    <p key={lIdx} className="my-1.5 leading-relaxed">
                      {parseCitations(trimmed)}
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
    <div className="h-[calc(100vh-10rem)] flex gap-6 animate-fade-in">
      {/* Left panel: Chat Sessions */}
      <div className="w-full md:w-64 border border-border bg-muted/20 rounded-2xl flex flex-col overflow-hidden shrink-0 select-none">
        <div className="p-4 border-b border-border flex items-center justify-between bg-card">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 font-mono">
            <MessageSquare className="h-4 w-4 text-primary" /> Channels
          </h3>
          <button
            onClick={createNewSession}
            className="h-7 px-2.5 border border-border bg-card hover:bg-muted/50 text-[10px] font-bold uppercase rounded-xl flex items-center gap-1 cursor-pointer transition-all"
          >
            <Plus className="h-3.5 w-3.5" /> New Thread
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-xs text-zinc-500 italic">
              No threads started.
            </div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                className={`flex items-center justify-between px-2.5 py-2.5 rounded-xl transition-all group border ${
                  activeSessionId === s.id
                    ? 'bg-primary/10 text-primary border-primary/20 font-bold'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground border-transparent'
                }`}
              >
                {renamingId === s.id ? (
                  <div className="flex items-center gap-1 w-full">
                    <input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(s.id)}
                      className="bg-card text-foreground border border-border rounded px-1.5 py-0.5 text-xs w-full focus:outline-none focus:border-primary font-sans"
                    />
                    <button onClick={() => handleSaveRename(s.id)} className="text-primary hover:text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </button>
                    <button onClick={() => setRenamingId(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setActiveSessionId(s.id)}
                      className="flex-1 text-xs truncate text-left font-sans mr-2 cursor-pointer"
                    >
                      {s.title}
                    </button>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartRename(s)}
                        className="p-1 text-muted-foreground hover:text-foreground rounded cursor-pointer"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => deleteSession(s.id)}
                        className="p-1 text-muted-foreground hover:text-red-500 rounded cursor-pointer"
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

        {/* Clear buffer button */}
        <div className="p-3 border-t border-border bg-card">
          <button
            onClick={handleClearThread}
            disabled={activeMessages.length === 0}
            className="w-full h-8 border border-border hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Clear History
          </button>
        </div>
      </div>

      {/* Right panel: Active chat log */}
      <div className="flex-1 border border-border bg-card rounded-2xl flex flex-col overflow-hidden relative shadow-sm">
        
        {/* Chat Header Status */}
        <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-4 bg-muted/10 select-none">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">devBot Assistant</h3>
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            <span className="text-[10px] text-muted-foreground font-mono uppercase font-bold">Model Engine:</span>
            {modelsLoading ? (
              <Skeleton className="h-5 w-20" />
            ) : (
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-card border border-border text-[11px] font-bold font-mono text-primary rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-primary shrink-0 cursor-pointer"
              >
                {models.map(m => (
                  <option key={m.model} value={m.model}>{m.model}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
          {activeMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8 max-w-sm mx-auto space-y-3.5 select-none">
              <Cpu className="h-9 w-9 text-primary animate-pulse" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground font-serif">Ask devBot anything</p>
                <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                  Analyze codebase files, request developer summaries, or execute RAG queries grounded in Chroma vector indexes.
                </p>
              </div>
            </div>
          ) : (
            activeMessages.map((msg, i) => {
              const isUser = msg.role === 'user';
              return (
                <div key={i} className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {/* Avatar Icon */}
                  {!isUser && (
                    <div className="h-8.5 w-8.5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 select-none">
                      <Cpu className="h-4.5 w-4.5" />
                    </div>
                  )}

                  {/* Bubble content */}
                  <div className={`p-4 rounded-2xl max-w-[85%] border shadow-sm ${
                    isUser
                      ? 'bg-primary/5 border-primary/15 text-foreground rounded-tr-none'
                      : 'bg-muted/30 border-border text-foreground rounded-tl-none'
                  }`}>
                    {renderMessageContent(msg.content, msg.citations)}
                  </div>

                  {isUser && (
                    <div className="h-8.5 w-8.5 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground shrink-0 select-none">
                      <User className="h-4.5 w-4.5 text-primary" />
                    </div>
                  )}
                </div>
              );
            })
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Citation Tooltip Info Box */}
        {hoveredCitation && (
          <div className="absolute bottom-18 left-6 right-6 p-4 bg-card border border-primary/20 rounded-xl shadow-lg z-30 flex items-start gap-3.5 animate-slide-up select-none">
            <BookOpen className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <span className="bg-primary/15 text-primary px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase">
                Grounded Reference Source
              </span>
              <p className="text-xs font-bold text-foreground truncate">{hoveredCitation.title || 'Source reference'}</p>
              <p className="text-[10px] text-muted-foreground line-clamp-2 leading-normal">{hoveredCitation.snippet || hoveredCitation.content}</p>
              {hoveredCitation.url && (
                <a
                  href={hoveredCitation.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline pt-1"
                >
                  Inspect document <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <XCircle className="h-4.5 w-4.5 text-muted-foreground hover:text-foreground cursor-pointer shrink-0" onClick={() => setHoveredCitation(null)} />
          </div>
        )}

        {/* Input Panel Form */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-muted/10 flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isStreaming ? "Streaming response..." : "Ask developer bot concept..."}
              disabled={isStreaming}
              className="w-full pl-4 pr-10 py-3 bg-card border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-xl text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            />
            {isStreaming && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
                <span className="animate-spin h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full"></span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!inputMessage.trim() || isStreaming}
            className="h-9 px-4.5 bg-primary hover:bg-primary/95 disabled:bg-muted text-white rounded-xl flex items-center justify-center transition-all cursor-pointer select-none active:scale-98 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;
