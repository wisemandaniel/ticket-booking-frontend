import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'https://ticket-booking-backend-dquw.onrender.com/api/v1';

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
      console.log('Sending update:', data);
      const response = await api.patch('/profile/update', data);
      console.log('Update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Update error:', error);
      throw error;
    }
  },
};

export const agencyService = {
  // Get all agencies
  getAllAgencies: () => api.get('/agencies'),
  
  // Get a single agency by ID
  getAgencyById: (id: string) => api.get(`/agencies/${id}`),
  
  // Create a new agency (admin only)
  createAgency: (data: {
    name: string;
    locations: string[];
    destinations: string[];
    contactInfo: {
      phone: string;
      email?: string;
      address?: string;
    };
  }) => api.post('/agencies', data),
  
  // Update an agency (admin or agency owner)
  updateAgency: (id: string, data: any) => api.patch(`/agencies/${id}`, data),
  
  // Delete an agency (admin only)
  deleteAgency: (id: string) => api.delete(`/agencies/${id}`),
  
  // Get buses for a specific agency
  getAgencyBuses: (agencyId: string) => api.get(`/agencies/${agencyId}/buses`),
  
  // Search agencies by location or destination
  searchAgencies: (params: {
    location?: string;
    destination?: string;
    name?: string;
  }) => api.get('/agencies/search', { params }),
  
  // Get popular agencies (sorted by number of buses or bookings)
  getPopularAgencies: (limit: number = 5) => api.get('/agencies/popular', { params: { limit } }),
};

export const bookingsService = {
  getDashboardStats: (userId: string) => api.get(`/bookings/stats/${userId}`),
  getTravelHistory: (userId: string) => api.get(`/bookings/history/${userId}`),
  getUpcomingTrips: (userId: string) => api.get(`/bookings/upcoming/${userId}`),
  createBooking: async (data: any) => {
    try {
      console.log('Sending booking data:', JSON.stringify(data, null, 2));
      const response = await api.post('/bookings', data);
      console.log('Booking created successfully:', response.data);
      return response;
    } catch (error: any) {
      console.error('Booking creation API error:', error.response?.data || error.message);
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