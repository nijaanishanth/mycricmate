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
  is_superuser: boolean;
  is_available: boolean;
  weekly_availability: Record<string, string[]> | null;
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

// Player availability API
export const playerApi = {
  getWeeklyAvailability: () =>
    api.get<{ schedule: Record<string, string[]> }>('/players/me/availability/weekly'),

  setWeeklyAvailability: (schedule: Record<string, string[]>) =>
    api.put<{ message: string; schedule: Record<string, string[]>; is_available: boolean }>(
      '/players/me/availability/weekly',
      { schedule }
    ),

  discoverPlayers: (skip = 0, limit = 20) =>
    api.get<DiscoverPlayerCard[]>(`/players/discover?skip=${skip}&limit=${limit}`),

  discoverTeams: (skip = 0, limit = 20) =>
    api.get<DiscoverTeamCard[]>(`/players/discover/teams?skip=${skip}&limit=${limit}`),

  /** Player swipes right on a team. Returns { matched, team_id, captain_id, team_name } */
  swipeRightOnTeam: (teamId: string) =>
    api.post<{ matched: boolean; team_id: string; captain_id: string | null; team_name: string }>(
      `/players/teams/${teamId}/swipe-right`, {}
    ),

  /** Captain swipes right on a player. Returns { matched, player_id, player_name } */
  swipeRightOnPlayer: (playerId: string) =>
    api.post<{ matched: boolean; player_id: string; player_name: string }>(
      `/players/players/${playerId}/swipe-right`, {}
    ),
};

// Discovery card types
export interface DiscoverPlayerCard {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  city?: string | null;
  playing_role?: string | null;
  batting_style?: string | null;
  bowling_style?: string | null;
  experience_years?: number | null;
  preferred_formats: string[];
  is_available: boolean;
}

export interface DiscoverTeamCard {
  id: string;
  name: string;
  logo_url?: string | null;
  city?: string | null;
  home_ground?: string | null;
  description?: string | null;
  preferred_formats: string[];
  current_player_count: number;
  max_players: number;
  captain_name?: string | null;
  captain_id?: string | null;
}

// ── Admin types ───────────────────────────────────────────────────────────────

export interface AdminStats {
  total_users: number;
  active_users: number;
  banned_users: number;
  total_teams: number;
  active_teams: number;
  total_tournaments: number;
  new_users_this_month: number;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name?: string | null;
  city?: string | null;
  roles: string[];
  playing_role?: string | null;
  is_active: boolean;
  is_verified: boolean;
  is_superuser: boolean;
  created_at: string;
  last_login?: string | null;
}

export interface AdminTeam {
  id: string;
  name: string;
  city?: string | null;
  home_ground?: string | null;
  captain_name?: string | null;
  captain_email?: string | null;
  current_player_count: number;
  max_players: number;
  is_active: boolean;
  is_squad_full: boolean;
  created_at: string;
}

export interface AdminUserUpdate {
  is_active?: boolean;
  is_verified?: boolean;
  is_superuser?: boolean;
}

export interface AdminTeamUpdate {
  is_active?: boolean;
  is_squad_full?: boolean;
}

// Admin API
export const adminApi = {
  getStats: () =>
    api.get<AdminStats>('/admin/stats'),

  listUsers: (search?: string, skip = 0, limit = 100) => {
    const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
    if (search) params.set('search', search);
    return api.get<AdminUser[]>(`/admin/users?${params}`);
  },

  updateUser: (userId: string, data: AdminUserUpdate) =>
    api.patch<AdminUser>(`/admin/users/${userId}`, data),

  deleteUser: (userId: string) =>
    api.delete<void>(`/admin/users/${userId}`),

  listTeams: (search?: string, skip = 0, limit = 100) => {
    const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
    if (search) params.set('search', search);
    return api.get<AdminTeam[]>(`/admin/teams?${params}`);
  },

  updateTeam: (teamId: string, data: AdminTeamUpdate) =>
    api.patch<AdminTeam>(`/admin/teams/${teamId}`, data),

  deleteTeam: (teamId: string) =>
    api.delete<void>(`/admin/teams/${teamId}`),
};

// ── Chat types ────────────────────────────────────────────────────────────────

export interface ChatParticipant {
  id: string;
  full_name?: string | null;
  avatar_url?: string | null;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  other_user: ChatParticipant;
  last_message?: ChatMessage | null;
  unread_count: number;
  updated_at: string;
}

// Chat API
export const chatApi = {
  listConversations: () =>
    api.get<Conversation[]>('/chat/conversations'),

  getOrCreateConversation: (otherUserId: string) =>
    api.post<Conversation>(`/chat/conversations?other_user_id=${otherUserId}`, {}),

  getMessages: (conversationId: string, skip = 0, limit = 50) =>
    api.get<ChatMessage[]>(`/chat/conversations/${conversationId}/messages?skip=${skip}&limit=${limit}`),

  sendMessage: (conversationId: string, content: string) =>
    api.post<ChatMessage>(`/chat/conversations/${conversationId}/messages`, { content }),

  getUnreadCount: () =>
    api.get<{ unread_count: number }>('/chat/unread-count'),
};
