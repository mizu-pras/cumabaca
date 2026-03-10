import api from './api';

// Languages API
export const languagesApi = {
  getAll: (params = {}) => api.get('/admin/languages', { params }),
  getById: (id) => api.get(`/admin/languages/${id}`),
  create: (data) => api.post('/admin/languages', data),
  update: (id, data) => api.put(`/admin/languages/${id}`, data),
  delete: (id) => api.delete(`/admin/languages/${id}`),
};

// Websites API
export const websitesApi = {
  getAll: (params = {}) => api.get('/admin/websites', { params }),
  getById: (id) => api.get(`/admin/websites/${id}`),
  create: (data) => api.post('/admin/websites', data),
  update: (id, data) => api.put(`/admin/websites/${id}`, data),
  delete: (id) => api.delete(`/admin/websites/${id}`),
  syncComics: (id, page = 1) => api.post(`/admin/websites/${id}/sync-comics?page=${page}`),
};

// Komiks API
export const komiksApi = {
  getAll: (params = {}) => api.get('/admin/komiks', { params }),
  getById: (id) => api.get(`/admin/komiks/${id}`),
  getWebsites: (id) => api.get(`/admin/komiks/${id}/websites`),
  create: (data) => api.post('/admin/komiks', data),
  update: (id, data) => api.put(`/admin/komiks/${id}`, data),
  delete: (id) => api.delete(`/admin/komiks/${id}`),
};

// Komik-Websites API
export const komikWebsitesApi = {
  getAll: (params = {}) => api.get('/admin/komik-websites', { params }),
  getById: (id) => api.get(`/admin/komik-websites/${id}`),
  create: (data) => api.post('/admin/komik-websites', data),
  update: (id, data) => api.put(`/admin/komik-websites/${id}`, data),
  delete: (id) => api.delete(`/admin/komik-websites/${id}`),
  scrapeChapters: (id) => api.post(`/admin/komik-websites/${id}/scrape-chapters`),
  getChapters: (id) => api.get(`/admin/komik-websites/${id}/chapters`),
};

// Scrape API
export const scrapeApi = {
  syncAll: () => api.post('/admin/scrape/sync'),
};
