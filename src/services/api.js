import axios from 'axios';
import { mockUser } from './mockData';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const mockAuthResponse = (userData = mockUser) => Promise.resolve({
  data: {
    success: true,
    message: 'Mode demo aktif.',
    data: {
      user: userData,
      token: 'mock-token-development',
      onboarding: {
        completed: true,
        next_step: 'dashboard',
      },
    },
  },
});

// Auth endpoints
export const authAPI = {
  register: (data) => {
    if (USE_MOCKS) {
      return mockAuthResponse({
        ...mockUser,
        id: Date.now(),
        full_name: data.full_name,
        name: data.full_name,
        email: data.email,
        phone: data.phone,
      });
    }

    return api.post('/auth/register', data);
  },
  login: (data) => {
    if (USE_MOCKS) {
      return mockAuthResponse({
        ...mockUser,
        email: data.email,
      });
    }

    return api.post('/auth/login', data);
  },
  googleLogin: (credential) => {
    if (USE_MOCKS) {
      return mockAuthResponse({
        ...mockUser,
        email: 'user.google@example.com',
        full_name: 'Google Test User',
      });
    }
    return api.post('/auth/google', { credential });
  },
  forgotPassword: (email) => {
    if (USE_MOCKS) {
      return Promise.resolve({
        data: {
          success: true,
          message: 'Jika email terdaftar, link reset password akan dikirim.'
        }
      });
    }
    return api.post('/auth/forgot-password', { email });
  },
  resetPassword: (token, password) => {
    if (USE_MOCKS) {
      return mockAuthResponse();
    }
    return api.post('/auth/reset-password', { token, password });
  },
  health: () => {
    if (USE_MOCKS) {
      return Promise.resolve({
        data: {
          success: true,
          message: 'Mode demo aktif.',
          database: 'mock',
        },
      });
    }

    return api.get('/health');
  },
};

export default api;
