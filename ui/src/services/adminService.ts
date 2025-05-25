import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Axios default headers for UTF-8
axios.defaults.headers.common['Accept'] = 'application/json; charset=utf-8';
axios.defaults.headers.common['Content-Type'] = 'application/json; charset=utf-8';

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  organization: {
    id: number;
    name: string;
    type: string;
  } | null;
  role: {
    id: number;
    name: string;
    display_name: string;
  } | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  last_session: string | null;
}

export interface UsersResponse {
  users: AdminUser[];
  total_count: number;
  active_count: number;
}

export interface AdminStats {
  user_stats: {
    total_users: number;
    active_users: number;
    admin_users: number;
    recent_users: number;
  };
  role_distribution: Array<{
    role: string;
    count: number;
  }>;
  organization_distribution: Array<{
    organization: string;
    count: number;
  }>;
  active_sessions: number;
  timestamp: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  organization_id?: number;
  role_id?: number;
}

export interface UpdateUserRequest {
  username: string;
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  organization_id?: number;
  role_id?: number;
}

export const adminService = {
  // Tüm kullanıcıları getir
  async getAllUsers(): Promise<UsersResponse> {
    const response = await axios.get(`${API_BASE_URL}/auth/users`);
    return response.data;
  },

  // Yeni kullanıcı oluştur
  async createUser(userData: CreateUserRequest): Promise<AdminUser> {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
    return response.data;
  },

  // Kullanıcı güncelle
  async updateUser(userId: number, userData: UpdateUserRequest): Promise<AdminUser> {
    const response = await axios.put(`${API_BASE_URL}/auth/users/${userId}`, userData);
    return response.data;
  },

  // Kullanıcı sil
  async deleteUser(userId: number): Promise<{ message: string }> {
    const response = await axios.delete(`${API_BASE_URL}/auth/users/${userId}`);
    return response.data;
  },

  // Kullanıcı durumunu değiştir (aktif/pasif)
  async toggleUserStatus(userId: number): Promise<{ message: string }> {
    const response = await axios.patch(`${API_BASE_URL}/auth/users/${userId}/toggle-status`);
    return response.data;
  },

  // Admin istatistikleri
  async getAdminStats(): Promise<AdminStats> {
    const response = await axios.get(`${API_BASE_URL}/auth/admin/stats`);
    return response.data;
  },

  // Organizasyonları getir
  async getOrganizations(): Promise<Array<{ id: number; name: string; type: string }>> {
    const response = await axios.get(`${API_BASE_URL}/auth/organizations`);
    return response.data;
  },

  // Rolleri getir
  async getRoles(): Promise<Array<{ id: number; name: string; display_name: string }>> {
    const response = await axios.get(`${API_BASE_URL}/auth/roles`);
    return response.data;
  }
}; 