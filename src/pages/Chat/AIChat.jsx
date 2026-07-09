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
  XCircle
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
    clearHistory,
    renameSession
  } = useChatStore();

  const [inputMessage, setInputMessage] = useState('');
  const [hoveredCitation, setHoveredCitation] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
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

  // Send message mutation (calls backend RAG chatbot)
  const chatMutation = useMutation({
    mutationFn: chatService.sendChatMessage,
    onSuccess: (data) => {
      addMessage(activeSessionId, {
        role: 'assistant',
        content: data.response,
        citations: data.citations || []
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.detail || 'Failed to get AI response. Verify API keys in backend env.';
      toast.error(msg);
      addMessage(activeSessionId, {
        role: 'assistant',
        content: `*Error:* Failed to complete request: ${msg}`
      });
    }
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || chatMutation.isPending) return;

    const userText = inputMessage.trim();
    setInputMessage('');

    // Push User message locally
    addMessage(activeSessionId, {
      role: 'user',
      content: userText
    });

    // Invoke API call
    chatMutation.mutate({
      model: selectedModel,
      session_id: activeSessionId,
      message: userText
    });
  };

  // Trigger regeneration using the last human message
  const handleRegenerate = () => {
    if (chatMutation.isPending || activeMessages.length === 0) return;
    
    // Find last user message in active thread
    const userMsgs = activeMessages.filter(m => m.role === 'user');
    if (userMsgs.length === 0) return;
    
    const lastUserText = userMsgs[userMsgs.length - 1].content;
    
    // Invoke API call
    chatMutation.mutate({
      model: selectedModel,
      session_id: activeSessionId,
      message: lastUserText
    });
  };

  // Clear current thread messages locally
  const handleClearThread = () => {
    if (window.confirm('Clear all messages in the active conversation?')) {
      // Clear histories by writing empty array to current activeSessionId
      const updatedHistories = {
        ...chatHistories,
        [activeSessionId]: []
      };
      localStorage.setItem('chat_histories', JSON.stringify(updatedHistories));
      // Trigger Zustand state update (Zustand will auto-sync on reload, but let's refresh locally)
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

  // Custom parser to split by code blocks and render them in copy cards
  const renderMessageContent = (text, citations = []) => {
    if (!text) return null;
    
    // Regex split code blocks ```code```
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
            // Parse inline citations like [1]
            const subparts = part.split(/(\[\d+\])/g);
            return (
              <p key={idx} className="whitespace-pre-line text-sm leading-relaxed text-zinc-200 font-sans">
                {subparts.map((sub, sIdx) => {
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
                  return sub;
                })}
              </p>
            );
          }
        })}
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex gap-6 animate-fade-in">
      {/* Left panel: Chat Sessions */}
      <div className="w-full md:w-64 border border-zinc-900 bg-zinc-950/40 rounded-xl flex flex-col overflow-hidden glass-panel shrink-0">
        <div className="p-4 border-b border-zinc-900 flex items-center justify-between bg-card/30">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4" /> Channels
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={createNewSession}
            className="h-7 px-2 border-zinc-800 hover:border-primary text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> New Thread
          </Button>
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
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-md transition-all group border ${
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
                      className="bg-zinc-900 text-foreground border border-zinc-800 rounded px-1.5 py-0.5 text-xs w-full focus:outline-none focus:border-primary font-mono"
                    />
                    <button onClick={() => handleSaveRename(s.id)} className="text-primary hover:text-emerald-400">
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
                      className="flex-1 text-xs truncate text-left font-sans mr-2"
                    >
                      {s.title}
                    </button>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartRename(s)}
                        className="p-1 text-muted-foreground hover:text-foreground rounded"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => deleteSession(s.id)}
                        className="p-1 text-muted-foreground hover:text-red-400 rounded"
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

        {/* Reset button footer */}
        {sessions.length > 0 && (
          <div className="p-3 border-t border-zinc-900 bg-card/10">
            <Button
              variant="outline"
              size="sm"
              onClick={clearHistory}
              className="w-full text-xs text-muted-foreground border-zinc-900 hover:border-red-900/40 hover:bg-red-950/10 hover:text-red-400"
            >
              Clear Histories
            </Button>
          </div>
        )}
      </div>

      {/* Right panel: Active Chat Room */}
      <div className="flex-1 border border-zinc-900 bg-zinc-950/40 rounded-xl flex flex-col overflow-hidden glass-panel relative">
        {/* Chat settings Header */}
        <div className="px-6 py-4 border-b border-zinc-900 bg-card/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-sm font-bold text-foreground tracking-tight">AI Assistant Chat</h2>
              <p className="text-[10px] text-muted-foreground">Conversational RAG grounded in crawled news & vector wiki index.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5">
            {/* Clear conversation */}
            {activeMessages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearThread}
                className="h-8 border-zinc-800 text-[10px] text-muted-foreground hover:text-red-400"
              >
                <XCircle className="h-3.5 w-3.5 mr-1" /> Clear Thread
              </Button>
            )}

            {/* Model selector dropdown */}
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-2.5 py-1 focus:outline-none focus:border-primary text-xs"
              >
                {modelsLoading ? (
                  <option>Loading models...</option>
                ) : models.length === 0 ? (
                  <option value="openai/gpt-oss-120b">openai/gpt-oss-120b</option>
                ) : (
                  models.map(m => (
                    <option key={m.model} value={m.model} disabled={m.status === 'inactive'}>
                      {m.provider} - {m.model} {m.status === 'inactive' ? '(inactive)' : ''}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Message feed scroll container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
          {activeMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8">
              <Sparkles className="h-10 w-10 text-primary mb-3 animate-pulse" />
              <h3 className="text-sm font-semibold text-zinc-200">How can I assist your developer intelligence searches?</h3>
              <p className="text-xs max-w-sm mt-1 leading-relaxed">
                Ask queries like "Explain LangGraph architecture", "What trending Python tools were index recently?", or "Summarize recent Cybersecurity leaks".
              </p>
            </div>
          ) : (
            activeMessages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex gap-4 p-4 rounded-xl border border-zinc-900/60 group relative ${
                  msg.role === 'user' 
                    ? 'bg-zinc-900/30' 
                    : 'bg-emerald-500/[0.01] border-emerald-500/5'
                }`}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border ${
                  msg.role === 'user'
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-300'
                    : 'bg-primary/10 border-primary/20 text-primary'
                }`}>
                  {msg.role === 'user' ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                </div>

                <div className="flex-1 space-y-3 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                      {msg.role === 'user' ? 'Developer' : 'Intelligence Agent'}
                    </div>
                    
                    {/* Copy message button */}
                    <button
                      onClick={() => handleCopyText(msg.content)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground rounded transition-opacity"
                      title="Copy response"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {renderMessageContent(msg.content, msg.citations)}

                  {/* Message footer citation section */}
                  {msg.citations?.length > 0 && (
                    <div className="pt-3 border-t border-zinc-900/80 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <BookOpen className="h-3.5 w-3.5 text-primary" /> Sources & Citations
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

                  {/* Regenerate trigger at bottom of assistant message */}
                  {msg.role === 'assistant' && msg === activeMessages[activeMessages.length - 1] && (
                    <div className="flex pt-2">
                      <button
                        onClick={handleRegenerate}
                        disabled={chatMutation.isPending}
                        className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-primary transition-colors"
                      >
                        <RotateCcw className="h-3 w-3" /> Regenerate Response
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Thinking spinner loader */}
          {chatMutation.isPending && (
            <div className="flex gap-4 p-4 rounded-xl border border-zinc-900/60 bg-emerald-500/[0.01]">
              <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 animate-spin" />
              </div>
              <div className="space-y-3 flex-1">
                <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
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

        {/* Hover Citation Overlay Dialog */}
        {hoveredCitation && (
          <div className="absolute bottom-20 left-6 right-6 p-3 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl text-xs z-20 flex gap-2.5 animate-slide-up">
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

        {/* Input send message area */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-900 bg-card/25 shrink-0 flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={chatMutation.isPending ? "AI is processing answer..." : "Ask the developer assistant..."}
            disabled={chatMutation.isPending}
            className="bg-zinc-900 border-zinc-800 text-sm focus-visible:ring-primary flex-1"
          />
          <Button
            type="submit"
            disabled={chatMutation.isPending || !inputMessage.trim()}
            variant="primary"
            size="icon"
            className="h-9 w-9"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;
