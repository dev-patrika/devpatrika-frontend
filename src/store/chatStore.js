import { create } from 'zustand';

export const useChatStore = create((set, get) => ({
  sessions: JSON.parse(localStorage.getItem('chat_sessions') || '[]'), // List of session objects: { id, title, createdAt }
  activeSessionId: localStorage.getItem('active_session_id') || '',
  selectedModel: localStorage.getItem('selected_model') || 'openai/gpt-oss-120b',
  chatHistories: JSON.parse(localStorage.getItem('chat_histories') || '{}'), // Maps sessionId to array of message objects

  setSelectedModel: (model) => {
    localStorage.setItem('selected_model', model);
    set({ selectedModel: model });
  },

  setActiveSessionId: (sessionId) => {
    localStorage.setItem('active_session_id', sessionId);
    set({ activeSessionId: sessionId });
  },

  createNewSession: () => {
    const newId = `session_${Date.now()}`;
    const newSession = {
      id: newId,
      title: `Conversation ${get().sessions.length + 1}`,
      createdAt: new Date().toISOString()
    };
    
    const updatedSessions = [newSession, ...get().sessions];
    const updatedHistories = {
      ...get().chatHistories,
      [newId]: []
    };

    localStorage.setItem('chat_sessions', JSON.stringify(updatedSessions));
    localStorage.setItem('chat_histories', JSON.stringify(updatedHistories));
    localStorage.setItem('active_session_id', newId);

    set({
      sessions: updatedSessions,
      chatHistories: updatedHistories,
      activeSessionId: newId
    });

    return newId;
  },

  deleteSession: (sessionId) => {
    const updatedSessions = get().sessions.filter(s => s.id !== sessionId);
    const updatedHistories = { ...get().chatHistories };
    delete updatedHistories[sessionId];

    localStorage.setItem('chat_sessions', JSON.stringify(updatedSessions));
    localStorage.setItem('chat_histories', JSON.stringify(updatedHistories));

    let nextActiveId = get().activeSessionId;
    if (nextActiveId === sessionId) {
      nextActiveId = updatedSessions.length > 0 ? updatedSessions[0].id : '';
      localStorage.setItem('active_session_id', nextActiveId);
    }

    set({
      sessions: updatedSessions,
      chatHistories: updatedHistories,
      activeSessionId: nextActiveId
    });
  },

  addMessage: (sessionId, message) => {
    const history = get().chatHistories[sessionId] || [];
    const updatedHistory = [...history, {
      id: `msg_${Date.now()}`,
      role: message.role, // 'user' or 'assistant'
      content: message.content,
      citations: message.citations || [],
      createdAt: new Date().toISOString()
    }];

    const updatedHistories = {
      ...get().chatHistories,
      [sessionId]: updatedHistory
    };

    // Auto-update title if it's the first message
    let updatedSessions = [...get().sessions];
    if (history.length === 0 && message.role === 'user') {
      const summaryText = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
      updatedSessions = updatedSessions.map(s => 
        s.id === sessionId ? { ...s, title: summaryText } : s
      );
      localStorage.setItem('chat_sessions', JSON.stringify(updatedSessions));
    }

    localStorage.setItem('chat_histories', JSON.stringify(updatedHistories));
    set({
      chatHistories: updatedHistories,
      sessions: updatedSessions
    });
  },

  renameSession: (sessionId, title) => {
    const updatedSessions = get().sessions.map(s => 
      s.id === sessionId ? { ...s, title } : s
    );
    localStorage.setItem('chat_sessions', JSON.stringify(updatedSessions));
    set({ sessions: updatedSessions });
  },

  clearHistory: () => {
    localStorage.removeItem('chat_sessions');
    localStorage.removeItem('chat_histories');
    localStorage.removeItem('active_session_id');
    set({
      sessions: [],
      activeSessionId: '',
      chatHistories: {}
    });
  }
}));
