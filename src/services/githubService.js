import api from './api';

export const githubService = {
  getTrendingRepos: async () => {
    const response = await api.get('/github/trending');
    return response.data;
  }
};
