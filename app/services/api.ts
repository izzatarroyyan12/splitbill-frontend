import axios from 'axios';
import { User, Bill, AuthResponse } from '../types';
import { handleApiError } from '../utils/error';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-render-app.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
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

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Auth
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { username, password });
    const { access_token, user } = response.data;
    localStorage.setItem('token', access_token);
    return response.data;
  },

  register: async (username: string, password: string, email: string): Promise<User> => {
    const response = await api.post('/auth/register', { username, password, email });
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Balance
  addBalance: async (amount: number): Promise<{ message: string; new_balance: number }> => {
    const response = await api.post('/auth/balance', { amount });
    return response.data;
  },

  // Bills
  createBill: async (billData: Omit<Bill, '_id' | 'created_at' | 'updated_at'>): Promise<Bill> => {
    const response = await api.post('/bills', billData);
    return response.data;
  },

  getBills: async (): Promise<Bill[]> => {
    const response = await api.get('/bills');
    return response.data;
  },

  getBill: async (billId: string): Promise<Bill> => {
    const response = await api.get(`/bills/${billId}`);
    return response.data;
  },

  payBill: async (billId: string): Promise<{ message: string }> => {
    const response = await api.post(`/bills/${billId}/pay`);
    return response.data;
  },

  markParticipantAsPaid: async (billId: string, participantIndex: number): Promise<{ message: string }> => {
    const response = await api.post(`/bills/${billId}/participants/${participantIndex}/pay`);
    return response.data;
  },

  // Error handling helper
  handleError: handleApiError
}; 