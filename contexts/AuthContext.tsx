import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/api';

interface User {
  id: string;
  legalBusinessName: string;
  whatsappNumber: string;
  role: string;
  isVerified: boolean;
}

interface AuthError {
  message: string;
  suggestions?: string[];
  actions?: Array<{ text: string; path: string }>;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  otpSent?: boolean;
  otpLoading?: boolean;
  user: User | null;
  error: string | null;
  errorDetails: AuthError | null;
  signIn: (whatsappNumber: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  register: (userData: any) => Promise<void>;
  verifyOtp: (whatsappNumber: string, otp: string) => Promise<{ success: boolean; error?: any }>;
  resetError: () => void;
  forgotPassword: (whatsappNumber: string, isPasswordChange?: boolean) => Promise<void>;
  resetPassword: (whatsappNumber: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<AuthError | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  // Check authentication state on app startup
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        const userDataString = await SecureStore.getItemAsync('user_data');
        
        if (token && userDataString) {
          const userData = JSON.parse(userDataString);
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (err) {
        setError('Failed to check authentication status');
        setErrorDetails({
          message: 'Failed to load user data',
          suggestions: ['Try restarting the app']
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const resetError = useCallback(() => {
    setError(null);
    setErrorDetails(null);
  }, []);

  const saveAuthData = useCallback(async (token: string, userData: User) => {
    try {
      await SecureStore.setItemAsync('auth_token', token);
      await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
    } catch (err) {
      throw new Error('Failed to save authentication data');
    }
  }, []);

  const clearAuthData = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('user_data');
    } catch (err) {
      console.error('Error clearing auth data:', err);
    }
  }, []);

  const handleAuthAction = useCallback((path: string) => {
    switch (path) {
      case '/login':
        resetError();
        router.replace('/(auth)/login');
        break;
      case '/register':
        router.push('/(auth)/signup');
        break;
      case '/forgot-password':
        router.push('/(auth)/forgot-password');
        break;
      case '/verify-otp':
        router.push('/');
        break;
      case '/support':
        router.push('/(auth)/support');
        break;
      default:
        resetError();
    }
  }, [resetError]);

  const forgotPassword = async (whatsappNumber: string, isPasswordChange: boolean = false) => {
    setOtpLoading(true);
    resetError();
    
    try {
      const response = await authService.forgotPassword({ whatsappNumber });
      setOtpSent(true);
    } catch (err: any) {
      setOtpSent(false);
      
      if (err.response?.data) {
        const { message, suggestions, actions } = err.response.data;
        setError(message || 'Failed to send OTP');
        setErrorDetails({
          message: message || 'Failed to send OTP',
          suggestions: suggestions || ['Please try again'],
          actions: actions || []
        });
      } else {
        setError(err.message || 'Network error. Please try again.');
        setErrorDetails({
          message: 'Network error',
          suggestions: ['Check your internet connection', 'Try again later'],
          actions: []
        });
      }
    } finally {
      setOtpLoading(false);
    }
  };

  // contexts/AuthContext.tsx
const resetPassword = async (whatsappNumber: string, newPassword: string, confirmPassword: string) => {
  setIsLoading(true);
  resetError();
  
  try {
    const response = await authService.resetPassword({ 
      whatsappNumber, 
      newPassword,
      confirmPassword 
    });

    if (response.success) {
      // Password reset successful
      return { success: true };
    } else {
      // Handle API error response
      setError(response.message || 'Password reset failed');
      setErrorDetails({
        message: response.message || 'Password reset failed',
        suggestions: response.suggestions || ['Please try again'],
        actions: response.actions || []
      });
      return { success: false };
    }
  } catch (err: any) {
    if (err.response?.data) {
      const { message, suggestions, actions } = err.response.data;
      setError(message || 'Password reset failed');
      setErrorDetails({
        message: message || 'Password reset failed',
        suggestions: suggestions || ['Please try again'],
        actions: actions || []
      });
    } else {
      setError(err.message || 'Network error. Please try again.');
      setErrorDetails({
        message: 'Network error',
        suggestions: ['Check your internet connection', 'Try again later'],
        actions: []
      });
    }
    return { success: false };
  } finally {
    setIsLoading(false);
  }
};

  const signIn = async (whatsappNumber: string, password: string) => {
    setIsLoading(true);
    resetError();
    
    try {
      const response = await authService.login({ whatsappNumber, password });     
      
      if (response.data.success) {
        await saveAuthData(response.data.token, response.data.user);
        setUser(response.data.user);
        setIsAuthenticated(true);
        router.replace('/(tabs)');
        return;
      }

      // Handle error responses from backend
      const { error: errorType, message, suggestions, actions } = response.data;
      
      setError(message || 'Login failed');
      setErrorDetails({
        message: message || 'Login failed',
        suggestions: suggestions || ['Please try again'],
        actions: actions || []
      });

    } catch (err: any) {
      if (err.response?.data) {
        const { message, suggestions, actions } = err.response.data;
        setError(message || 'Login failed');
        setErrorDetails({
          message: message || 'Login failed',
          suggestions: suggestions || ['Please try again'],
          actions: actions || []
        });
      } else {
        setError(err.message || 'Network error. Please try again.');
        setErrorDetails({
          message: 'Network error',
          suggestions: ['Check your internet connection', 'Try again later'],
          actions: []
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    resetError();
    
    try {
      const response = await authService.register(userData);
      
      // Redirect to OTP verification
      router.push({
        pathname: '/',
        params: { whatsappNumber: userData.whatsappNumber }
      });
    } catch (err: any) {
      if (err.response?.data) {
        const { message, suggestions, actions } = err.response.data;
        setError(message || 'Registration failed');
        setErrorDetails({
          message: message || 'Registration failed',
          suggestions: suggestions || ['Please try again'],
          actions: actions || []
        });
      } else {
        setError(err.message || 'Registration failed. Please try again.');
        setErrorDetails({
          message: 'Network error',
          suggestions: ['Check your internet connection', 'Try again later'],
          actions: []
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (whatsappNumber: string, otp: string, isPasswordChange: boolean = true) => {
    setIsLoading(true);
    resetError();
    
    try {
      const response = await authService.verifyOtp({ 
        whatsappNumber, 
        otp,
        isPasswordChange 
      });
      
      if (isPasswordChange) {
        // For password reset, just return success without authenticating
        return { success: true };
      } else {
        // Regular OTP verification flow
        await saveAuthData(response.data.token, response.data.user);
        setUser(response.data.user);
        setIsAuthenticated(true);
        router.replace('/(tabs)');
        return { success: true };
      }
    } catch (err: any) {
      if (err.response?.data) {
        const { message, suggestions, actions } = err.response.data;
        setError(message || 'OTP verification failed');
        setErrorDetails({
          message: message || 'OTP verification failed',
          suggestions: suggestions || [
            'Check the code we sent',
            'Request a new code if expired'
          ],
          actions: actions || []
        });
      } else {
        setError(err.message || 'OTP verification failed. Please try again.');
        setErrorDetails({
          message: 'Network error',
          suggestions: ['Check your internet connection', 'Try again later'],
          actions: []
        });
      }
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    resetError();
    
    try {
      await authService.logout();
      await clearAuthData();
      setUser(null);
      setIsAuthenticated(false);
      router.replace('/(auth)/login');
    } catch (err: any) {
      if (err.response?.data) {
        setError(err.response.data.message || 'Logout failed');
      } else {
        setError(err.message || 'Logout failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: AuthContextType = {
    isAuthenticated,
    isLoading,
    otpSent,
    otpLoading,
    user,
    error,
    errorDetails,
    signIn,
    signOut,
    register,
    verifyOtp,
    resetError,
    forgotPassword,
    resetPassword
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};