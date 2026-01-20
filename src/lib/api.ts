// API Configuration and Service
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Token management
const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const tokenManager = {
  getAccessToken: () => localStorage.getItem(TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clearTokens: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

// API Client with automatic token refresh
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = tokenManager.getAccessToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 - try to refresh token
      if (response.status === 401 && tokenManager.getRefreshToken()) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry original request with new token
          const newToken = tokenManager.getAccessToken();
          if (newToken) {
            headers['Authorization'] = `Bearer ${newToken}`;
            const retryResponse = await fetch(url, {
              ...options,
              headers,
            });
            return this.handleResponse<T>(retryResponse);
          }
        }
        // Refresh failed, clear tokens and redirect to login
        tokenManager.clearTokens();
        window.location.href = '/login';
        throw new Error('Session expired');
      }

      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: response.statusText,
      }));
      throw new Error(error.detail || 'Request failed');
    }

    // Handle empty responses
    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        tokenManager.setTokens(data.access_token, data.refresh_token);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient(API_URL);

// Type definitions
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  city?: string;
  discovery_radius: number;
  latitude?: string;
  longitude?: string;
  roles: string[];
  batting_style?: string;
  bowling_style?: string;
  playing_role?: string;
  experience_years?: number;
  preferred_formats: string[];
  auth_provider: string;
  is_verified: boolean;
  is_active: boolean;
  profile_visible: boolean;
  created_at: string;
  last_login?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name?: string;
  roles?: string[];
}

export interface GoogleOAuthData {
  code: string;
  redirect_uri: string;
}

export interface UserUpdate {
  full_name?: string;
  phone?: string;
  city?: string;
  discovery_radius?: number;
  latitude?: string;
  longitude?: string;
  avatar_url?: string;
  roles?: string[];
  batting_style?: string;
  bowling_style?: string;
  playing_role?: string;
  experience_years?: number;
  preferred_formats?: string[];
  profile_visible?: boolean;
}

export interface OnboardingData {
  roles: string[];
  city: string;
  latitude?: string;
  longitude?: string;
  discovery_radius: number;
}

// Auth API
export const authApi = {
  register: (data: RegisterData) =>
    api.post<TokenResponse>('/auth/register', data),

  login: (credentials: LoginCredentials) =>
    api.post<TokenResponse>('/auth/login', credentials),

  googleAuth: (data: GoogleOAuthData) =>
    api.post<TokenResponse>('/auth/google', data),

  logout: () => {
    const refreshToken = tokenManager.getRefreshToken();
    if (refreshToken) {
      // Don't clear tokens before the API call - let the caller handle it
      return api.post('/auth/logout', { refresh_token: refreshToken }).catch(() => {
        // Ignore logout errors - token might already be invalid
      });
    }
    return Promise.resolve();
  },

  getCurrentUser: () => api.get<User>('/auth/me'),

  getGoogleAuthUrl: (redirectUri: string) =>
    api.get<{ url: string }>(`/auth/google/url?redirect_uri=${redirectUri}`),
};

// User API
export const userApi = {
  getProfile: () => api.get<User>('/users/me'),

  updateProfile: (data: UserUpdate) => api.put<User>('/users/me', data),

  completeOnboarding: (data: OnboardingData) =>
    api.post<User>('/users/me/onboarding', data),

  getUserById: (userId: string) => api.get<User>(`/users/${userId}`),

  toggleVisibility: (visible: boolean) =>
    api.patch<User>(`/users/me/visibility?profile_visible=${visible}`),

  deleteAccount: () => api.delete('/users/me'),
};
