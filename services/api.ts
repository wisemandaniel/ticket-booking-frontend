import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'http://192.168.1.45:3000/api/v1';

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

export const profileService = {
  getProfile: () => api.get('/profile/me'),
  updateProfile: async (data: any): Promise<any> => {
    try {
      console.log('Sending update:', data); // Debug log
      const response = await api.patch('/profile/update', data);
      console.log('Update response:', response.data); // Debug log
      return response.data;
    } catch (error) {
      console.error('Update error:', error);
      throw error;
    }
  },
};

export const saveAuthToken = async (token: any) => {
  await SecureStore.setItemAsync('auth_token', token);
};

export const removeAuthToken = async () => {
  await SecureStore.deleteItemAsync('auth_token');
};

export default api;