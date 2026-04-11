import axios from 'axios';
import { toast } from 'sonner';
import { StorageKeys } from '@/enum/StorageKeys';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000',
  headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem(StorageKeys.TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const url = error.config?.url || '';

      // 1. Handle Network Errors (Server down / Offline)
      if (!error.response && !error.status) {
        toast.error('Network unreachable. Please check your connection or server status.');
      }
      // 2. Handle Authentication Errors
      else if (status === 401) {
        if (!url.includes('/auth/login')) {
          localStorage.removeItem(StorageKeys.TOKEN);
          toast.error('Session expired. Please log in again.');
          // Use a slight delay to allow the toast to be seen before redirect
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
        }
      }
      // 3. Handle Other API Errors
      else {
        const message = error.response?.data?.message || 'Something went wrong. Please try again.';
        // Only show generic toasts for non-GET requests to avoid noisy errors on page load
        if (error.config?.method !== 'get') {
          toast.error(message);
        }
      }
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
