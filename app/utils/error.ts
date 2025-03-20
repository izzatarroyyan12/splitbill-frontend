import { ApiError } from '../types';

export const handleApiError = (error: any): string => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  return 'An unexpected error occurred';
};

export const isApiError = (error: any): error is ApiError => {
  return (
    error &&
    (typeof error.error === 'string' ||
      typeof error.message === 'string' ||
      typeof error.status === 'number')
  );
}; 