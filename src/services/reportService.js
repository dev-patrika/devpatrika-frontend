import api from './api';

export const reportService = {
  getWeeklyReports: async () => {
    const response = await api.get('/reports/weekly');
    return response.data;
  },

  getWeeklyReport: async (id) => {
    const response = await api.get(`/reports/weekly/${id}`);
    return response.data;
  },

  compileWeeklyReport: async () => {
    const response = await api.post('/reports/weekly/compile');
    return response.data;
  }
};
