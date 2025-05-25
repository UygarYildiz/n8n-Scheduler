import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// Audit Log Types
export interface AuditLog {
  id: number;
  action: string;
  description: string;
  user_id: number | null;
  target_user_id: number | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  created_at: string;
  user: {
    username: string;
    full_name: string;
  } | null;
  target_user: {
    username: string;
    full_name: string;
  } | null;
}

export interface AuditLogResponse {
  logs: AuditLog[];
  total_count: number;
  limit: number;
  offset: number;
}

export interface AuditAction {
  value: string;
  name: string;
  description: string;
}

export interface AuditActionsResponse {
  actions: AuditAction[];
  total_count: number;
}

export interface AuditStats {
  period_days: number;
  total_logs: number;
  successful_logs: number;
  failed_logs: number;
  success_rate: number;
  action_distribution: {
    action: string;
    description: string;
    count: number;
  }[];
  top_users: {
    user_id: number;
    username: string;
    log_count: number;
  }[];
  timestamp: string;
}

class AuditService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json; charset=utf-8'
    };
  }

  async getAuditLogs(params: {
    limit?: number;
    offset?: number;
    user_id?: number;
    action?: string;
    success?: boolean;
  } = {}): Promise<AuditLogResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    if (params.user_id) queryParams.append('user_id', params.user_id.toString());
    if (params.action) queryParams.append('action', params.action);
    if (params.success !== undefined) queryParams.append('success', params.success.toString());

    const response = await axios.get(
      `${API_BASE_URL}/auth/audit-logs?${queryParams.toString()}`,
      { headers: this.getAuthHeaders() }
    );
    
    return response.data;
  }

  async getAuditActions(): Promise<AuditActionsResponse> {
    const response = await axios.get(
      `${API_BASE_URL}/auth/audit-logs/actions`,
      { headers: this.getAuthHeaders() }
    );
    
    return response.data;
  }

  async getAuditStats(days: number = 7): Promise<AuditStats> {
    const response = await axios.get(
      `${API_BASE_URL}/auth/audit-logs/stats?days=${days}`,
      { headers: this.getAuthHeaders() }
    );
    
    return response.data;
  }

  // Helper methods
  getActionColor(action: string): 'success' | 'error' | 'warning' | 'info' | 'default' {
    const actionColors: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
      'login_success': 'success',
      'login_failed': 'error',
      'logout': 'info',
      'logout_all': 'warning',
      'session_revoked': 'warning',
      'user_created': 'success',
      'user_updated': 'info',
      'user_deleted': 'error',
      'user_status_changed': 'warning',
      'password_changed': 'info',
      'profile_updated': 'info',
      'admin_access': 'warning'
    };
    
    return actionColors[action] || 'default';
  }

  getActionIcon(action: string): string {
    const actionIcons: Record<string, string> = {
      'login_success': '🔓',
      'login_failed': '🚫',
      'logout': '🚪',
      'logout_all': '🚪',
      'session_revoked': '⏹️',
      'user_created': '👤',
      'user_updated': '✏️',
      'user_deleted': '🗑️',
      'user_status_changed': '🔄',
      'password_changed': '🔑',
      'profile_updated': '📝',
      'admin_access': '⚡'
    };
    
    return actionIcons[action] || '📋';
  }

  formatLogDetails(log: AuditLog): string {
    if (!log.details) return '';
    
    try {
      const details = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
      
      // Özel formatlamalar
      if (log.action === 'user_updated' && details.changes) {
        const changes = Object.keys(details.changes);
        return `Değiştirilen alanlar: ${changes.join(', ')}`;
      }
      
      if (log.action === 'login_failed' && details.reason) {
        return `Sebep: ${details.reason}`;
      }
      
      if (log.action === 'session_revoked' && details.session_id) {
        return `Oturum ID: ${details.session_id}`;
      }
      
      // Genel detay formatı
      const relevantKeys = ['username', 'reason', 'session_id', 'new_status'];
      const relevantDetails = relevantKeys
        .filter(key => details[key] !== undefined)
        .map(key => `${key}: ${details[key]}`)
        .join(', ');
      
      return relevantDetails || JSON.stringify(details);
    } catch {
      return String(log.details);
    }
  }
}

export const auditService = new AuditService(); 