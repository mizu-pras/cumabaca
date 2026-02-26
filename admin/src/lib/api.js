import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3100';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor for handling 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login on 401 if NOT already on login page
    // and NOT attempting to login (login endpoint)
    const isLoginEndpoint = error.config?.url?.includes('/admin/auth/login');
    const isOnLoginPage = window.location.pathname === '/login';

    if (error.response?.status === 401 && !isLoginEndpoint && !isOnLoginPage) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
