import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'https://sum-up-backend.onrender.com/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface VerifyOtpParams {
  whatsappNumber: string;
  otp: string;
  isPasswordChange?: boolean;
}

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: (data: any) => api.post('/auth/register', data),
  verifyOtp: (data: VerifyOtpParams) => api.post('/auth/verify-otp', data),
  login: (data: any) => api.post('/auth/login', data),
  forgotPassword: (data: any) => api.post('/auth/forgot-password', data),
  resetPassword: (data: any) => api.put('/auth/reset-password', data),
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => api.get('/auth/logout'),
};

export const saveAuthToken = async (token: any) => {
  await SecureStore.setItemAsync('auth_token', token);
};

export const removeAuthToken = async () => {
  await SecureStore.deleteItemAsync('auth_token');
};

export default api;