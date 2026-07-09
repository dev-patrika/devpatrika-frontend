import api from './api';

export const searchService = {
  unifiedSearch: async (q) => {
    const response = await api.get('/search', {
      params: { q }
    });
    return response.data;
  }
};
