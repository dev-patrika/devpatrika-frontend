import api from './api';

export const githubService = {
  getTrendingRepos: async () => {
    const response = await api.get('/github/trending');
    return response.data;
  },

  getRepoDetails: async (repoId) => {
    const response = await api.get(`/github/repo/${repoId}`);
    return response.data;
  }
};
