import axios, { AxiosError, AxiosResponse } from 'axios';

// Get API URL from environment variables
const envApiUrl = (import.meta as any).env.VITE_API_URL;

/**
 * Determine the API Base URL.
 * Priority:
 * 1. VITE_API_URL environment variable
 * 2. If on localhost, fallback to local backend
 * 3. Default to relative /api (works if served from same origin or proxied)
 */
const getBaseUrl = () => {
  if (envApiUrl) {
    return envApiUrl;
  }

  if (window.location.hostname === 'localhost') {
    return 'http://localhost:5000/api';
  }

  // Fallback for the known production deployment if no env var is provided
  // This helps when deploying to platforms where env vars might be missed in initial setup
  if (window.location.hostname.includes('vercel.app')) {
    return 'https://event-hosting-web.onrender.com/api';
  }

  return '/api';
};

let API_BASE_URL = getBaseUrl();

// Robustness: Ensure the URL ends with /api if it doesn't already
if (API_BASE_URL && !API_BASE_URL.endsWith('/api') && !API_BASE_URL.endsWith('/api/')) {
  API_BASE_URL = API_BASE_URL.endsWith('/') ? `${API_BASE_URL}api` : `${API_BASE_URL}/api`;
}

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
