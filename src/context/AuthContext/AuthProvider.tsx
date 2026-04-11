import { useState, type ReactNode } from 'react';
import { StorageKeys } from '@/enum/StorageKeys';
import type { User } from '@/types';
import { AuthContext } from './AuthContext';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(StorageKeys.USER);
    return stored ? (JSON.parse(stored) as User) : null;
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem(StorageKeys.TOKEN));

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem(StorageKeys.TOKEN, newToken);
    localStorage.setItem(StorageKeys.USER, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem(StorageKeys.TOKEN);
    localStorage.removeItem(StorageKeys.USER);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};
