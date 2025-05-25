import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export interface SessionInfo {
  id: number;
  token_jti: string;
  user_id: number;
  username: string;
  full_name?: string;
  organization?: string;
  role?: string;
  created_at: string;
  expires_at: string;
  duration?: string;
  is_current?: boolean;
  user_agent?: string;
  ip_address?: string;
}

export interface SessionsResponse {
  sessions: SessionInfo[];
  total_count: number;
  user_id?: number;
  active_users?: number;
}

export interface SessionStats {
  active_sessions: number;
  active_users: number;
  today_sessions: number;
  expired_sessions: number;
  timestamp: string;
}

export const sessionService = {
  // Kullanıcının kendi oturumlarını getir
  async getUserSessions(userId?: number): Promise<SessionsResponse> {
    const params = userId ? { user_id: userId } : {};
    const response = await axios.get(`${API_BASE_URL}/auth/sessions`, { params });
    return response.data;
  },

  // Tüm aktif oturumları getir (admin only)
  async getAllSessions(): Promise<SessionsResponse> {
    const response = await axios.get(`${API_BASE_URL}/auth/sessions/all`);
    return response.data;
  },

  // Belirli bir oturumu sonlandır
  async revokeSession(sessionId: number): Promise<{ message: string }> {
    const response = await axios.delete(`${API_BASE_URL}/auth/sessions/${sessionId}`);
    return response.data;
  },

  // Kullanıcının tüm oturumlarını sonlandır (admin only)
  async revokeAllUserSessions(userId: number): Promise<{ message: string }> {
    const response = await axios.delete(`${API_BASE_URL}/auth/sessions/user/${userId}/all`);
    return response.data;
  },

  // Oturum istatistikleri (admin only)
  async getSessionStats(): Promise<SessionStats> {
    const response = await axios.get(`${API_BASE_URL}/auth/sessions/stats`);
    return response.data;
  }
}; 