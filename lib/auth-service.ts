// Authentication Service - Backend API Integration
// Connects to the Express backend server for account management

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  emailVerified: boolean;
  role: 'user' | 'developer' | 'admin';
  createdAt: Date;
  lastLogin: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  avatar?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Storage keys
const AUTH_STORAGE_KEY = 'indiflow_auth';
const USER_STORAGE_KEY = 'indiflow_user_data';

// API base URL - connects to the backend server
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Helper to get auth headers
function getAuthHeaders(): HeadersInit {
  const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
  if (storedAuth) {
    try {
      const tokens = JSON.parse(storedAuth);
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.accessToken}`,
      };
    } catch {
      // Invalid stored auth
    }
  }
  return {
    'Content-Type': 'application/json',
  };
}

// Helper to make API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    const data = await response.json();
    return data as ApiResponse<T>;
  } catch (error) {
    console.error('[Auth API] Request failed:', error);
    // Fall back to localStorage-based auth if backend is unavailable
    return { success: false, error: 'Server unavailable. Using offline mode.' };
  }
}

// Parse user dates from API response
function parseUser(userData: any): User {
  return {
    ...userData,
    role: userData.role || 'user',
    createdAt: new Date(userData.createdAt),
    lastLogin: new Date(userData.lastLogin),
  };
}

// Fallback localStorage functions for offline mode
function getStoredUsers(): Record<string, { user: User; passwordHash: string }> {
  try {
    const stored = localStorage.getItem('indiflow_users_db');
    if (stored) {
      const parsed = JSON.parse(stored);
      const result: Record<string, { user: User; passwordHash: string }> = {};
      for (const [key, value] of Object.entries(parsed)) {
        const entry = value as { user: any; passwordHash: string };
        result[key] = {
          user: {
            ...entry.user,
            createdAt: new Date(entry.user.createdAt),
            lastLogin: new Date(entry.user.lastLogin),
          },
          passwordHash: entry.passwordHash,
        };
      }
      return result;
    }
  } catch (e) {
    console.error('Failed to load users from storage:', e);
  }
  return {};
}

function saveStoredUsers(users: Record<string, { user: User; passwordHash: string }>) {
  localStorage.setItem('indiflow_users_db', JSON.stringify(users));
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

const generateId = () => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Authentication Service
 * Primary: Connects to backend API
 * Fallback: Uses localStorage when backend is unavailable
 */
export const authService = {
  /**
   * Sign up a new user
   * Backend: POST /api/auth/signup
   */
  async signup(data: SignupData): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    // Validation
    if (!data.email || !data.password || !data.name) {
      return { success: false, error: 'All fields are required' };
    }

    if (data.password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { success: false, error: 'Invalid email address' };
    }

    // Try backend API first
    const response = await apiCall<{ user: any; tokens: any }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.success && response.data) {
      const user = parseUser(response.data.user);
      const tokens: AuthTokens = {
        ...response.data.tokens,
        expiresAt: new Date(response.data.tokens.expiresAt),
      };

      // Store auth state
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        ...tokens,
        expiresAt: tokens.expiresAt.toISOString(),
      }));
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

      console.log('[Auth] User registered via backend:', user.id);
      return { success: true, data: { user, tokens }, message: response.message };
    }

    // Fallback to localStorage if backend unavailable
    if (response.error === 'Server unavailable. Using offline mode.') {
      console.log('[Auth] Backend unavailable, using offline mode');

      const users = getStoredUsers();
      const existingUser = Object.values(users).find(u => u.user.email === data.email.toLowerCase());
      if (existingUser) {
        return { success: false, error: 'An account with this email already exists' };
      }

      const now = new Date();
      const user: User = {
        id: generateId(),
        email: data.email.toLowerCase(),
        name: data.name,
        phone: data.phone,
        emailVerified: false,
        role: 'user',
        createdAt: now,
        lastLogin: now,
      };

      const tokens: AuthTokens = {
        accessToken: `access_${generateId()}`,
        refreshToken: `refresh_${generateId()}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      users[user.id] = { user, passwordHash: simpleHash(data.password) };
      saveStoredUsers(users);

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        ...tokens,
        expiresAt: tokens.expiresAt.toISOString(),
      }));
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

      console.log('[Auth] User registered offline:', user.id);
      return { success: true, data: { user, tokens }, message: 'Account created (offline mode)' };
    }

    return response as ApiResponse<{ user: User; tokens: AuthTokens }>;
  },

  /**
   * Log in an existing user
   * Backend: POST /api/auth/login
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    if (!credentials.email || !credentials.password) {
      return { success: false, error: 'Email and password are required' };
    }

    // Try backend API first
    const response = await apiCall<{ user: any; tokens: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      const user = parseUser(response.data.user);
      const tokens: AuthTokens = {
        ...response.data.tokens,
        expiresAt: new Date(response.data.tokens.expiresAt),
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        ...tokens,
        expiresAt: tokens.expiresAt.toISOString(),
      }));
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

      console.log('[Auth] User logged in via backend:', user.id);
      return { success: true, data: { user, tokens }, message: response.message };
    }

    // Fallback to localStorage
    if (response.error === 'Server unavailable. Using offline mode.') {
      console.log('[Auth] Backend unavailable, using offline mode');

      const users = getStoredUsers();
      const userEntry = Object.values(users).find(
        u => u.user.email === credentials.email.toLowerCase()
      );

      if (!userEntry) {
        return { success: false, error: 'Invalid email or password' };
      }

      if (userEntry.passwordHash !== simpleHash(credentials.password)) {
        return { success: false, error: 'Invalid email or password' };
      }

      userEntry.user.lastLogin = new Date();
      saveStoredUsers(users);

      const tokens: AuthTokens = {
        accessToken: `access_${generateId()}`,
        refreshToken: `refresh_${generateId()}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        ...tokens,
        expiresAt: tokens.expiresAt.toISOString(),
      }));
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userEntry.user));

      console.log('[Auth] User logged in offline:', userEntry.user.id);
      return { success: true, data: { user: userEntry.user, tokens }, message: 'Login successful (offline mode)' };
    }

    return response as ApiResponse<{ user: User; tokens: AuthTokens }>;
  },

  /**
   * Log out current user
   * Backend: POST /api/auth/logout
   */
  async logout(): Promise<ApiResponse<void>> {
    // Try backend first
    await apiCall<void>('/api/auth/logout', { method: 'POST' });

    // Always clear local storage
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);

    return { success: true, message: 'Logged out successfully' };
  },

  /**
   * Get current authenticated user
   * Backend: GET /api/auth/me
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!storedUser || !storedAuth) {
      return { success: false, error: 'Not authenticated' };
    }

    // Try to refresh from backend
    const response = await apiCall<any>('/api/auth/me');

    if (response.success && response.data) {
      const user = parseUser(response.data);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      return { success: true, data: user };
    }

    // Fallback to cached user
    try {
      const user = JSON.parse(storedUser);
      user.createdAt = new Date(user.createdAt);
      user.lastLogin = new Date(user.lastLogin);
      return { success: true, data: user };
    } catch (e) {
      return { success: false, error: 'Invalid session' };
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!storedAuth) return false;

    try {
      const tokens = JSON.parse(storedAuth);
      return new Date(tokens.expiresAt) > new Date();
    } catch {
      return false;
    }
  },

  /**
   * Update user profile
   * Backend: PATCH /api/user/profile
   */
  async updateProfile(data: UpdateProfileData): Promise<ApiResponse<User>> {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (!storedUser) {
      return { success: false, error: 'Not authenticated' };
    }

    // Try backend first
    const response = await apiCall<any>('/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });

    if (response.success && response.data) {
      const user = parseUser(response.data);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      return { success: true, data: user, message: response.message };
    }

    // Fallback to localStorage
    if (response.error === 'Server unavailable. Using offline mode.') {
      try {
        const user = JSON.parse(storedUser);
        const updatedUser = { ...user, ...data };

        const users = getStoredUsers();
        if (users[user.id]) {
          users[user.id].user = updatedUser;
          saveStoredUsers(users);
        }

        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));

        updatedUser.createdAt = new Date(updatedUser.createdAt);
        updatedUser.lastLogin = new Date(updatedUser.lastLogin);

        return { success: true, data: updatedUser, message: 'Profile updated (offline mode)' };
      } catch (e) {
        return { success: false, error: 'Failed to update profile' };
      }
    }

    return response as ApiResponse<User>;
  },

  /**
   * Change password
   * Backend: POST /api/user/change-password
   */
  async changePassword(data: ChangePasswordData): Promise<ApiResponse<void>> {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (!storedUser) {
      return { success: false, error: 'Not authenticated' };
    }

    // Try backend first
    const response = await apiCall<void>('/api/user/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.success) {
      return response;
    }

    // Fallback to localStorage
    if (response.error === 'Server unavailable. Using offline mode.') {
      try {
        const user = JSON.parse(storedUser);
        const users = getStoredUsers();

        if (!users[user.id]) {
          return { success: false, error: 'User not found' };
        }

        if (users[user.id].passwordHash !== simpleHash(data.currentPassword)) {
          return { success: false, error: 'Current password is incorrect' };
        }

        if (data.newPassword.length < 8) {
          return { success: false, error: 'New password must be at least 8 characters' };
        }

        users[user.id].passwordHash = simpleHash(data.newPassword);
        saveStoredUsers(users);

        return { success: true, message: 'Password changed (offline mode)' };
      } catch (e) {
        return { success: false, error: 'Failed to change password' };
      }
    }

    return response;
  },

  /**
   * Request password reset
   * Backend: POST /api/auth/forgot-password
   */
  async forgotPassword(data: ResetPasswordData): Promise<ApiResponse<void>> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { success: false, error: 'Invalid email address' };
    }

    const response = await apiCall<void>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.success) {
      return response;
    }

    // Always return success message for security
    return {
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
    };
  },

  /**
   * Delete user account
   * Backend: DELETE /api/user/account
   */
  async deleteAccount(password: string): Promise<ApiResponse<void>> {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (!storedUser) {
      return { success: false, error: 'Not authenticated' };
    }

    // Try backend first
    const response = await apiCall<void>('/api/user/account', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });

    if (response.success) {
      // Clear all local data
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem('indiflow_user_profile');
      localStorage.removeItem('indiflow_user_settings');
      localStorage.removeItem('indiflow_saved_locations');
      localStorage.removeItem('indiflow_saved_routes');
      localStorage.removeItem('indiflow_onboarding');
      return response;
    }

    // Fallback to localStorage
    if (response.error === 'Server unavailable. Using offline mode.') {
      try {
        const user = JSON.parse(storedUser);
        const users = getStoredUsers();

        if (!users[user.id]) {
          return { success: false, error: 'User not found' };
        }

        if (users[user.id].passwordHash !== simpleHash(password)) {
          return { success: false, error: 'Password is incorrect' };
        }

        delete users[user.id];
        saveStoredUsers(users);

        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem('indiflow_user_profile');
        localStorage.removeItem('indiflow_user_settings');
        localStorage.removeItem('indiflow_saved_locations');
        localStorage.removeItem('indiflow_saved_routes');
        localStorage.removeItem('indiflow_onboarding');

        return { success: true, message: 'Account deleted (offline mode)' };
      } catch (e) {
        return { success: false, error: 'Failed to delete account' };
      }
    }

    return response;
  },

  /**
   * Refresh authentication tokens
   * Backend: POST /api/auth/refresh
   */
  async refreshTokens(): Promise<ApiResponse<AuthTokens>> {
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!storedAuth) {
      return { success: false, error: 'No refresh token' };
    }

    try {
      const currentTokens = JSON.parse(storedAuth);

      const response = await apiCall<any>('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: currentTokens.refreshToken }),
      });

      if (response.success && response.data) {
        const tokens: AuthTokens = {
          ...response.data,
          expiresAt: new Date(response.data.expiresAt),
        };

        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
          ...tokens,
          expiresAt: tokens.expiresAt.toISOString(),
        }));

        return { success: true, data: tokens };
      }

      // Fallback: generate new tokens locally
      if (response.error === 'Server unavailable. Using offline mode.') {
        const tokens: AuthTokens = {
          accessToken: `access_${generateId()}`,
          refreshToken: `refresh_${generateId()}`,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        };

        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
          ...tokens,
          expiresAt: tokens.expiresAt.toISOString(),
        }));

        return { success: true, data: tokens };
      }

      return response as ApiResponse<AuthTokens>;
    } catch {
      return { success: false, error: 'Failed to refresh tokens' };
    }
  },

  /**
   * Get the API base URL (for debugging)
   */
  getApiBaseUrl(): string {
    return API_BASE_URL;
  },
};

export default authService;
