import { type ReactNode } from 'react';
import { StorageKeys } from '@/enum/StorageKeys';
import type { User } from '@/types';
import { AuthContext } from './AuthContext';
import { useCurrentUser } from '@/api/routes/AuthAPI';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoading, mutate: mutateUser } = useCurrentUser();

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem(StorageKeys.TOKEN, newToken);
    // Optimistically update the user data from login response
    mutateUser(newUser, false);
  };

  const logout = () => {
    localStorage.removeItem(StorageKeys.TOKEN);
    mutateUser(undefined, false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
