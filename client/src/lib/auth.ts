import { trpc } from './trpc';

export function getLoginUrl() {
  return '/login';
}

export function useAuth() {
  const { data: user, isLoading } = trpc.auth.me.useQuery();
  
  return {
    user,
    loading: isLoading,
    isAuthenticated: !!user,
  };
}

export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('auth_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('auth_token');
}
