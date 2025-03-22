'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginRequest, RegisterRequest, AddBalanceRequest } from '../types';
import { apiService } from '../services/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  addBalance: (data: AddBalanceRequest) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication...');
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.log('No token found');
          setLoading(false);
          if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
            router.push('/login');
          }
          return;
        }

        console.log('Token found, refreshing user...');
        const user = await refreshUser();
        
        if (!user) {
          console.log('No user data received, redirecting to login...');
          localStorage.removeItem('token');
          router.push('/login');
        } else {
          console.log('User authenticated:', user);
          if (window.location.pathname === '/login' || window.location.pathname === '/register') {
            router.push('/dashboard');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('token');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      setLoading(true);
      console.log('Attempting login...', credentials);
      
      const response = await apiService.login(credentials);
      console.log('Login successful:', response);
      
      setUser(response.user);
      toast.success('Login successful!');
      
      // Use replace instead of push to prevent back navigation to login
      router.replace('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      setUser(null);
      localStorage.removeItem('token');
      
      // Show a more user-friendly error message
      if (error.message.includes('Unable to connect to server')) {
        toast.error('Unable to connect to server. Please check your internet connection.');
      } else if (error.message.includes('Invalid credentials')) {
        toast.error('Invalid username or password');
      } else {
        toast.error(error.message || 'Login failed');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      setLoading(true);
      console.log('Attempting registration...', data);
      await apiService.register(data);
      console.log('Registration successful');
      toast.success('Registration successful! Please log in.');
      router.push('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      console.log('Logging out...');
      await apiService.logout();
      setUser(null);
      console.log('Logout successful');
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error(error.message || 'Logout failed');
    } finally {
      setLoading(false);
      setUser(null);
      localStorage.removeItem('token');
    }
  };

  const refreshUser = async () => {
    try {
      console.log('Refreshing user data...');
      const user = await apiService.getProfile();
      console.log('User data refreshed:', user);
      setUser(user);
      return user;
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
      return null;
    }
  };

  const addBalance = async (data: AddBalanceRequest) => {
    try {
      setLoading(true);
      console.log('Adding balance...', data);
      const response = await apiService.addBalance(data);
      console.log('Balance added successfully:', response);
      await refreshUser();
      toast.success('Balance added successfully!');
    } catch (error: any) {
      console.error('Add balance error:', error);
      toast.error(error.message || 'Failed to add balance');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        addBalance
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 