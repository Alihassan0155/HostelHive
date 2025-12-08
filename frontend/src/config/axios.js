import axios from 'axios';
import { auth } from './firebase.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error('Error getting token:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Only handle 401 if not already on login page and not during auth initialization
      const isLoginPage = window.location.pathname === '/login';
      const isAuthEndpoint = error.config?.url?.includes('/auth/me');
      
      if (!isLoginPage && !isAuthEndpoint) {
        // Unauthorized - clear auth
        try {
          await auth.signOut();
          // Only redirect if not already going to login
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        } catch (signOutError) {
          console.error('Error signing out:', signOutError);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

