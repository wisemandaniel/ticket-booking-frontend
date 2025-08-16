import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/api';

const baseUrl = 'http://192.168.1.45:3000'

// Types
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

interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
  suggestions?: string[];
  actions?: Array<{ text: string; path: string }>;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  [key: string]: any;
}

interface ResetPasswordData {
  whatsappNumber: string;
  newPassword: string;
  confirmPassword: string;
}

interface VerifyOtpData {
  whatsappNumber: string;
  otp: string;
  isPasswordChange?: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  isLoading: boolean;
  otpSent: boolean;
  otpLoading: boolean;
  user: User | null;  
  updatedUser: (userData: User) => Promise<void>;
  error: string | null;
  errorDetails: AuthError | null;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  verifyOtp: (data: VerifyOtpData) => Promise<{ success: boolean; error?: any }>;
  resetError: () => void;
  forgotPassword: (whatsappNumber: string, isPasswordChange?: boolean) => Promise<void>;
  resetPassword: (data: ResetPasswordData) => Promise<{ success: boolean }>;
  saveAuthData: (token: string, user: User) => Promise<void>
  fetchUserProfile: () => Promise<User>;
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

  // Helper Functions
  const resetError = useCallback(() => {
    setError(null);
    setErrorDetails(null);
  }, []);

 const saveAuthData = useCallback(async (token: string, userData: User) => {
  try {
    // Store both token and user data asynchronously
    await Promise.all([
      SecureStore.setItemAsync('auth_token', token),
      SecureStore.setItemAsync('user_data', JSON.stringify(userData)),
      SecureStore.setItemAsync('auth_timestamp', Date.now().toString())
    ]);
  } catch (err) {
    console.error('Failed to save auth data:', err);
    throw new Error('Failed to save authentication data');
  }
}, []);

  const clearAuthData = useCallback(async () => {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync('auth_token'),
        SecureStore.deleteItemAsync('user_data'),
        SecureStore.deleteItemAsync('auth_timestamp')
      ]);
    } catch (err) {
      console.error('Error clearing auth data:', err);
    }
  }, []);

  const validateToken = useCallback(async (): Promise<boolean> => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const timestamp = await SecureStore.getItemAsync('auth_timestamp');
      return !!token && !!timestamp;
    } catch {
      return false;
    }
  }, []);

  const handleAuthError = useCallback((error: any, defaultMessage: string) => {
    console.error('Auth error:', error);
    
    if (error.response?.data) {
      const { message, suggestions, actions } = error.response.data;
      setError(message || defaultMessage);
      setErrorDetails({
        message: message || defaultMessage,
        suggestions: suggestions || ['Please try again'],
        actions: actions || []
      });
    } else {
      setError(error.message || 'Network error. Please try again.');
      setErrorDetails({
        message: 'Network error',
        suggestions: ['Check your internet connection', 'Try again later'],
        actions: []
      });
    }
  }, []);

  const handleNavigation = useCallback((path: string, params?: Record<string, any>) => {
    resetError();
    router.replace({ pathname: path, params });
  }, [resetError]);

  // Auth Methods
  const checkAuth = useCallback(async () => {
    try {
      const [hasToken, userDataString] = await Promise.all([
        validateToken(),
        SecureStore.getItemAsync('user_data')
      ]);
      
      if (hasToken && userDataString) {
        const userData = JSON.parse(userDataString);
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (err) {
      handleAuthError(err, 'Failed to check authentication status');
    } finally {
      setIsLoading(false);
    }
  }, [validateToken, handleAuthError]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // In AuthContext.tsx
const signIn = async (credentials: { email: string; password: string }) => {
  setIsLoading(true);
  resetError();
  
  try {
    const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const result = await response.json();

    console.log('user: ', result);
    
    console.log('token: ', result);

    if (!response.ok) {
      throw new Error(result.message || 'Login failed');
    }

    if (!result.token || !result.data.user) {
      throw new Error('Invalid response from server');
    }

    // Save auth data and update state
    await saveAuthData(result.token, result.data.user);
    setUser(result.data.user);
    setIsAuthenticated(true);
    
    // Navigate after successful auth
    router.replace('/(tabs)');
    
  } catch (err: any) {
    setError(err.message || 'Login failed');
    setErrorDetails({
      message: 'Authentication error',
      suggestions: ['Please check your credentials and try again'],
      actions: []
    });
    throw err; // Re-throw to allow component handling
  } finally {
    setIsLoading(false);
  }
};

  const signOut = async () => {
    setIsLoading(true);
    resetError();
    
    try {
      await clearAuthData();
      setUser(null);
      setIsAuthenticated(false);
      handleNavigation('/(auth)/login');
    } catch (err: any) {
      handleAuthError(err, 'Logout failed');
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

      // Store token securely
      await SecureStore.setItemAsync('authToken', data.token);
      setIsAuthenticated(true);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (data: VerifyOtpData) => {
    setIsLoading(true);
    resetError();
    
    try {
      const response = await authService.verifyOtp(data);
      
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'OTP verification failed');
      }

      if (data.isPasswordChange) {
        return { success: true };
      }

      if (!response.data.token || !response.data.user) {
        throw new Error('Authentication data missing');
      }

      await saveAuthData(response.data.token, response.data.user);
      setUser(response.data.user);
      setIsAuthenticated(true);
      handleNavigation('/(tabs)');
      return { success: true };
      
    } catch (err: any) {
      handleAuthError(err, 'OTP verification failed');
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (whatsappNumber: string, isPasswordChange: boolean = false) => {
    setOtpLoading(true);
    resetError();
    
    try {
      const response = await authService.forgotPassword({ whatsappNumber });
      
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to send OTP');
      }

      setOtpSent(true);
      handleNavigation('/verify-otp', { 
        whatsappNumber,
        isPasswordChange: String(isPasswordChange) 
      });
      
    } catch (err: any) {
      handleAuthError(err, 'Failed to send OTP');
      setOtpSent(false);
    } finally {
      setOtpLoading(false);
    }
  };

  const resetPassword = async (data: ResetPasswordData) => {
    setIsLoading(true);
    resetError();
    
    try {
      const response = await authService.resetPassword(data);
      
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Password reset failed');
      }

      return { success: true };
      
    } catch (err: any) {
      handleAuthError(err, 'Password reset failed');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const updatedUser = useCallback(async (userData: User) => {
    try {
      // Update state
      setUser(userData);
      
      // Update SecureStore if needed
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  }, []);

  // Context Value
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
    resetPassword,
    updatedUser,
    saveAuthData,
    setIsAuthenticated,
  };

  return (
    <AuthContext.Provider value={contextValue}>
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