import type { User } from '@/types';

export interface LoginPayload {
  emailOrUsername: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  username: string;
  email: string;
  password: string;
}

export interface AuthLoginResponse {
  token: string;
  user: User;
}

export interface AuthRegisterResponse {
  token: string;
  user: User;
}

export type AuthMeResponse = User;
