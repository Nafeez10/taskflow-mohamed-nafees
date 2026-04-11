import { type ReactNode, useState, useEffect, useCallback } from 'react';
import { StorageKeys } from '@/enum/StorageKeys';
import type { User } from '@/types';
import { AuthContext } from './AuthContext';
import { useCurrentUser } from '@/api/routes/AuthAPI';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // refreshTrigger is a minimalist pattern to force a re-render
  // when the underlying localStorage changes without storing the JWT in state.
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { user, isLoading, mutate: mutateUser } = useCurrentUser();

  const refresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    // Sync session across tabs — if the token is changed in another tab,
    // we trigger a re-render here to update our SWR hook.
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === StorageKeys.TOKEN) {
        refresh();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refresh]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem(StorageKeys.TOKEN, newToken);
    // 1. Force context re-render so useCurrentUser sees the new token
    refresh();
    // 2. Optimistically update the user data
    mutateUser(newUser, false);
  };

  const logout = () => {
    localStorage.removeItem(StorageKeys.TOKEN);
    refresh();
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
      {/* key={refreshTrigger} ensures the SWR hook inside children re-evaluates if needed */}
      <div key={refreshTrigger} className="contents">
        {children}
      </div>
    </AuthContext.Provider>
  );
};
