import useSWR from 'swr';
import axiosInstance from '@/api/axios/axiosInstance';
import { swrFetcher } from '@/api/swrFetcher';
import { StorageKeys } from '@/enum/StorageKeys';
import type {
  LoginPayload,
  RegisterPayload,
  AuthLoginResponse,
  AuthRegisterResponse,
  AuthMeResponse,
} from './types';

export const AuthAPI = {
  login: (data: LoginPayload) =>
    axiosInstance.post<AuthLoginResponse>('/auth/login', data).then((response) => response.data),

  register: (data: RegisterPayload) =>
    axiosInstance
      .post<AuthRegisterResponse>('/auth/register', data)
      .then((response) => response.data),
};

export const useCurrentUser = () => {
  const token = localStorage.getItem(StorageKeys.TOKEN);
  const { data, error, isLoading, mutate } = useSWR<AuthMeResponse>(
    token ? '/auth/me' : null,
    swrFetcher,
  );
  return { user: data ?? null, error, isLoading, mutate };
};

export type {
  LoginPayload,
  RegisterPayload,
  AuthLoginResponse,
  AuthRegisterResponse,
  AuthMeResponse,
};
