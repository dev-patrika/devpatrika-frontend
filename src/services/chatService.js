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
  }
};
