import { User } from '../types/index.js';

export const setAuthData = (token: string, user: User) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('azatech_token', token);
    localStorage.setItem('azatech_user', JSON.stringify(user));
  }
};

export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('azatech_token');
  }
  return null;
};

export const getAuthUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem('azatech_user');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
  }
  return null;
};

export const clearAuth = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('azatech_token');
    localStorage.removeItem('azatech_user');
  }
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};
