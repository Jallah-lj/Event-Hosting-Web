import axios, { AxiosError, AxiosResponse } from 'axios';

// Use environment variable, or fallback to production URL, or local development
const envApiUrl = (import.meta as any).env.VITE_API_URL;
let rawBaseUrl = envApiUrl;

// Determine the correct API base URL based on the environment
if (window.location.hostname === 'localhost') {
  // Local development
  rawBaseUrl = envApiUrl && envApiUrl.startsWith('http') ? envApiUrl : 'http://localhost:5000/api';
} else {
  // Production / Preview environments
  // Use VITE_API_URL if it's an absolute URL, otherwise fallback to the production Render URL
  rawBaseUrl = envApiUrl && envApiUrl.startsWith('http') ? envApiUrl : 'https://event-hosting-web.onrender.com/api';
}

// Robustness: Ensure the URL ends with /api if it doesn't already
if (rawBaseUrl && !rawBaseUrl.endsWith('/api') && !rawBaseUrl.endsWith('/api/')) {
  rawBaseUrl = rawBaseUrl.endsWith('/') ? `${rawBaseUrl}api` : `${rawBaseUrl}/api`;
}

const API_BASE_URL = rawBaseUrl;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth state
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Optionally redirect to login
      window.location.href = '/auth/signin';
    }
    return Promise.reject(error);
  }
);

export default api;

// Helper to extract error message
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error || error.message || 'An error occurred';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};
