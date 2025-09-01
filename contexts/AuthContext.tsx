import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

const baseUrl = 'https://ticket-booking-backend-dquw.onrender.com';

interface User {
  id: string;
  legalBusinessName: string;
  whatsappNumber: string;
  role: string;
  isVerified: boolean;
  phoneNumber?: string;
  idCardNumber?: string;
  idPhoto?: string;
  fullName?: string;
}

interface AuthError {
  message: string;
  suggestions?: string[];
  actions?: Array<{ text: string; path: string }>;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  register: (credentials: { fullName: string; email: string; password: string }) => Promise<void>;
  updatedUser: (userData: User) => Promise<void>;
  fetchUserProfile: () => Promise<User>;
  resetError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  const saveAuthData = useCallback(async (token: string, userData: User) => {
    // console.log('saving auth data:', {token, userData});
    // console.log('stringified auth data:', {token, userData: JSON.stringify(userData)});
    
    try {
      await Promise.all([
        await SecureStore.setItemAsync('auth_token', token),
        await SecureStore.setItemAsync('user_data', JSON.stringify(userData))
      ]);
    } catch (err) {
      // console.log('Failed to save auth data:', err);
      throw new Error('Failed to save authentication data');
    }
  }, []);

  const clearAuthData = useCallback(async () => {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync('auth_token'),
        SecureStore.deleteItemAsync('user_data')
      ]);
    } catch (err) {
      console.error('Error clearing auth data:', err);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const [token, userDataString] = await Promise.all([
        SecureStore.getItemAsync('auth_token'),
        SecureStore.getItemAsync('user_data')
      ]);
      
      if (token && userDataString) {
        const userData = JSON.parse(userDataString);
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error('Auth check error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const signIn = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Login failed');
      }

      if (!result.token || !result.data.user) {
        throw new Error('Invalid response from server');
      }

      await saveAuthData(result.token, result.data.user);
      setUser(result.data.user);
      setIsAuthenticated(true);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await clearAuthData();
      setUser(null);
      setIsAuthenticated(false);
      router.replace('/(auth)/login');
    } catch (err: any) {
      setError(err.message || 'Logout failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: { fullName: string; email: string; password: string }) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }
      
       
      console.log('Signnup response:', data.data.user);

      await saveAuthData(data.token, data.data.user);
      setUser(data.user);
      setIsAuthenticated(true);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserProfile = useCallback(async (): Promise<User> => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${baseUrl}/api/v1/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch profile');
      }

      await SecureStore.setItemAsync('user_data', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error('Profile fetch error:', error);
      throw error;
    }
  }, []);

  const updatedUser = useCallback(async (userData: User) => {
    try {
      setUser(userData);
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Update user error:', error);
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      user,
      error,
      signIn,
      signOut,
      register,
      updatedUser,
      fetchUserProfile,
      resetError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};