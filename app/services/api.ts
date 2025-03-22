import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import {
  User,
  Bill,
  AuthResponse,
  PaymentConfirmationData,
  PaymentResponse,
  ExternalPaymentResponse,
  LoginRequest,
  RegisterRequest,
  AddBalanceRequest,
  AddBalanceResponse,
  CreateBillRequest,
  ApiError,
  ApiResponse,
  MarkParticipantAsPaidRequest
} from '../types';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // Log request details
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      headers: {
        ...config.headers,
        Authorization: token ? 'Bearer [REDACTED]' : undefined
      }
    });

    // Add token to request headers if it exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Handle preflight requests
    if (config.method?.toUpperCase() === 'OPTIONS') {
      config.headers['Access-Control-Request-Method'] = config.method;
      config.headers['Access-Control-Request-Headers'] = 'Content-Type,Authorization';
    }

    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      statusText: response.statusText
    });
    return response;
  },
  (error: AxiosError<ApiError>) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      console.log('Unauthorized access, clearing token');
      localStorage.removeItem('token');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Handle API errors
const handleApiError = (error: any): never => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    const errorMessage = error.response.data?.error || error.response.data?.message || 'An error occurred';
    throw new Error(errorMessage);
  } else if (error.request) {
    // The request was made but no response was received
    console.error('Network Error:', error);
    throw new Error('Network error: Unable to connect to server');
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('Request Error:', error);
    throw new Error('Error setting up the request');
  }
};

// Retry mechanism for failed requests
const retryRequest = async (fn: () => Promise<any>, retries = 2, delay = 500): Promise<any> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && error.message === 'Network Error') { // Only retry network errors
      console.log(`Retrying request... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(fn, retries - 1, delay * 1.5);
    }
    throw error;
  }
};

export const apiService = {
  // Auth
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await retryRequest(() => 
        api.post('/auth/login', {
          username: credentials.username.trim(),
          password: credentials.password
        })
      );
      
      const { access_token, user } = response.data;
      if (!access_token) {
        throw new Error('No access token received from server');
      }
      if (!user) {
        throw new Error('No user data received from server');
      }

      localStorage.setItem('token', access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      return { token: access_token, user };
    } catch (error) {
      console.error('Login Error:', error);
      if (error.message === 'Network Error') {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      }
      throw handleApiError(error);
    }
  },

  register: async (data: RegisterRequest): Promise<void> => {
    try {
      await retryRequest(() => 
        api.post('/auth/register', {
          username: data.username,
          password: data.password
        })
      );
    } catch (error) {
      console.error('Registration Error:', error);
      throw handleApiError(error);
    }
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    }
  },

  getProfile: async (): Promise<User> => {
    try {
      const response = await retryRequest(() => api.get('/auth/profile'));
      return response.data;
    } catch (error) {
      console.error('Get Profile Error:', error);
      throw handleApiError(error);
    }
  },

  // Balance
  addBalance: async (data: AddBalanceRequest): Promise<AddBalanceResponse> => {
    try {
      const response = await retryRequest(() => api.post('/auth/balance', data));
      return response.data;
    } catch (error) {
      console.error('Add Balance Error:', error);
      throw handleApiError(error);
    }
  },

  // Bills
  getBills: async (): Promise<Bill[]> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await retryRequest(() => api.get('/bills'));
      if (!response.data) {
        throw new Error('No data received from server');
      }
      return response.data;
    } catch (error) {
      console.error('Get Bills Error:', error);
      throw handleApiError(error);
    }
  },

  createBill: async (billData: CreateBillRequest): Promise<Bill> => {
    try {
      const response = await retryRequest(() => api.post('/bills', billData));
      return response.data;
    } catch (error) {
      console.error('Create Bill Error:', error);
      throw handleApiError(error);
    }
  },

  getBill: async (billId: string): Promise<Bill> => {
    try {
      const response = await retryRequest(() => api.get(`/bills/${billId}`));
      return response.data;
    } catch (error) {
      console.error('Get Bill Error:', error);
      throw handleApiError(error);
    }
  },

  payBill: async (data: PaymentConfirmationData): Promise<PaymentResponse> => {
    try {
      const response = await retryRequest(() => 
        api.post(`/bills/${data.billId}/pay`, {
          password: data.password
        })
      );
      return response.data;
    } catch (error) {
      console.error('Pay Bill Error:', error);
      throw handleApiError(error);
    }
  },

  markParticipantAsPaid: async (data: MarkParticipantAsPaidRequest): Promise<ExternalPaymentResponse> => {
    try {
      const response = await retryRequest(() => 
        api.post(`/bills/${data.billId}/participants/${data.participantIndex}/pay`)
      );
      return response.data;
    } catch (error) {
      console.error('Mark Participant As Paid Error:', error);
      throw handleApiError(error);
    }
  }
}; 