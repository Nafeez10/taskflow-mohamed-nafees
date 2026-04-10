import type { User } from '@/types';

// ── Payload Types (sent to API) ───────────────────────────────────────────────

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

// ── Response Types (received from API) ───────────────────────────────────────

export interface AuthLoginResponse {
  token: string;
  user: User;
}

export interface AuthRegisterResponse {
  token: string;
  user: User;
}

export type AuthMeResponse = User;
