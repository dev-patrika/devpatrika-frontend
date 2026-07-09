import api from './api';

export const newsService = {
  getNews: async ({ category, q, limit = 20 } = {}) => {
    const params = {};
    if (category) params.category = category;
    if (q) params.q = q;
    if (limit) params.limit = limit;
    
    const response = await api.get('/news', { params });
    return response.data;
  },

  triggerIngest: async () => {
    const response = await api.post('/news/ingest');
    return response.data;
  },

  triggerProcess: async () => {
    const response = await api.post('/news/process');
    return response.data;
  },

  getRelatedNews: async (newsId) => {
    const response = await api.get(`/news/${newsId}/related`);
    return response.data;
  }
};
