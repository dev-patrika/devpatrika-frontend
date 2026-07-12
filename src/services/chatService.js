import api from './api';

export const chatService = {
  getChatModels: async () => {
    const response = await api.get('/ai/models');
    return response.data;
  },

  sendChatMessage: async ({ model, session_id, message }) => {
    const response = await api.post('/ai/chat', {
      model,
      session_id,
      message
    });
    return response.data;
  },

  streamChatMessage: async ({ model, session_id, message }) => {
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    const response = await fetch(`${baseUrl}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model, session_id, message })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  },

  sendChatMessageStream: async ({ model, session_id, message }) => {
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    const response = await fetch(`${baseUrl}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model, session_id, message })
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  }
};
