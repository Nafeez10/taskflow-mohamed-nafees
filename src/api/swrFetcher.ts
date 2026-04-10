import axiosInstance from '@/api/axios/axiosInstance';
import type { AxiosRequestConfig } from 'axios';

export const swrFetcher = async (url: string, config?: AxiosRequestConfig) => {
  const response = await axiosInstance.get(url, { ...config });
  return response.data;
};
