import axiosInstance from '@/api/axios/axiosInstance';
import type { User } from '@/types';
import type { UserLookupResponse } from './types';

// ── Mutations (called imperatively) ──────────────────────────────────────────

export const UsersAPI = {
  /**
   * Look up a single user by email address.
   * Returns the user if found, or throws with error code "no_account" if not.
   * Used by the contributor-add flow before committing the addition.
   */
  lookup: (identifier: string) =>
    axiosInstance
      .get<UserLookupResponse>(`/users/lookup?identifier=${encodeURIComponent(identifier)}`)
      .then((r) => r.data),

  search: (query: string) =>
    axiosInstance
      .get<User[]>(`/users/search?q=${encodeURIComponent(query)}`)
      .then((r) => r.data),
};

export type { UserLookupResponse };
