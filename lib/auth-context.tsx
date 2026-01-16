// Authentication Context - React context for managing auth state
import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authService, type User, type LoginCredentials, type SignupData, type UpdateProfileData } from './auth-service';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextType {
  user: User | null;
  status: AuthStatus;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  signup: (data: SignupData) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  deleteAccount: (password: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      if (authService.isAuthenticated()) {
        const result = await authService.getCurrentUser();
        if (result.success && result.data) {
          setUser(result.data);
          setStatus('authenticated');
        } else {
          setStatus('unauthenticated');
        }
      } else {
        setStatus('unauthenticated');
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    setError(null);
    const result = await authService.login(credentials);

    if (result.success && result.data) {
      setUser(result.data.user);
      setStatus('authenticated');
      return true;
    } else {
      setError(result.error || 'Login failed');
      return false;
    }
  }, []);

  const signup = useCallback(async (data: SignupData): Promise<boolean> => {
    setError(null);
    const result = await authService.signup(data);

    if (result.success && result.data) {
      setUser(result.data.user);
      setStatus('authenticated');
      return true;
    } else {
      setError(result.error || 'Signup failed');
      return false;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await authService.logout();
    setUser(null);
    setStatus('unauthenticated');
    setError(null);
  }, []);

  const updateProfile = useCallback(async (data: UpdateProfileData): Promise<boolean> => {
    setError(null);
    const result = await authService.updateProfile(data);

    if (result.success && result.data) {
      setUser(result.data);
      return true;
    } else {
      setError(result.error || 'Failed to update profile');
      return false;
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<boolean> => {
    setError(null);
    const result = await authService.changePassword({ currentPassword, newPassword });

    if (result.success) {
      return true;
    } else {
      setError(result.error || 'Failed to change password');
      return false;
    }
  }, []);

  const deleteAccount = useCallback(async (password: string): Promise<boolean> => {
    setError(null);
    const result = await authService.deleteAccount(password);

    if (result.success) {
      setUser(null);
      setStatus('unauthenticated');
      return true;
    } else {
      setError(result.error || 'Failed to delete account');
      return false;
    }
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<boolean> => {
    setError(null);
    const result = await authService.forgotPassword({ email });

    if (result.success) {
      return true;
    } else {
      setError(result.error || 'Failed to send reset email');
      return false;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    status,
    isLoading: status === 'loading',
    error,
    login,
    signup,
    logout,
    updateProfile,
    changePassword,
    deleteAccount,
    forgotPassword,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
