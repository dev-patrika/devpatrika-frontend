import api from './api';

export const wikiService = {
  getWikiEntries: async (q) => {
    const params = {};
    if (q) params.q = q;
    const response = await api.get('/wiki', { params });
    return response.data;
  },

  getWikiEntry: async (term) => {
    const response = await api.get(`/wiki/${encodeURIComponent(term)}`);
    return response.data;
  },

  generateWikiEntry: async (term) => {
    const response = await api.post('/wiki/generate', null, {
      params: { term }
    });
    return response.data;
  },

  getWikiTimeline: async (term) => {
    const response = await api.get(`/wiki/${encodeURIComponent(term)}/timeline`);
    return response.data;
  }
};
