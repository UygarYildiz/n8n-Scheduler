import { useAuth } from '../contexts/AuthContext';

// Rol hiyerarşisi ve yetkiler
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ORG_ADMIN: 'org_admin', 
  MANAGER: 'manager',
  PLANNER: 'planner',
  STAFF: 'staff'
} as const;

// Sayfa erişim yetkileri
export const PAGE_PERMISSIONS = {
  DASHBOARD: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.MANAGER, ROLES.PLANNER, ROLES.STAFF],
  ADMIN_PANEL: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN],
  USER_MANAGEMENT: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN],
  DATASET_CONFIG: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.MANAGER],
  OPTIMIZATION_PARAMS: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.MANAGER, ROLES.PLANNER],
  RESULTS: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.MANAGER, ROLES.PLANNER, ROLES.STAFF],
  SCHEDULE_VIEW: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.MANAGER, ROLES.PLANNER, ROLES.STAFF],
  SETTINGS: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.MANAGER],
  SESSION_MANAGEMENT: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.MANAGER, ROLES.PLANNER, ROLES.STAFF]
} as const;

// İşlem yetkileri
export const ACTION_PERMISSIONS = {
  CREATE_USER: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN],
  EDIT_USER: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN],
  DELETE_USER: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN],
  RUN_OPTIMIZATION: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.MANAGER, ROLES.PLANNER],
  EDIT_SCHEDULE: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.MANAGER, ROLES.PLANNER],
  VIEW_REPORTS: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.MANAGER, ROLES.PLANNER, ROLES.STAFF],
  EXPORT_DATA: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.MANAGER, ROLES.PLANNER],
  SYSTEM_SETTINGS: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN]
} as const;

export const usePermissions = () => {
  const { user } = useAuth();

  const hasRole = (requiredRole: string): boolean => {
    if (!user?.role?.name) return false;
    return user.role.name === requiredRole;
  };

  const hasAnyRole = (requiredRoles: readonly string[]): boolean => {
    if (!user?.role?.name) return false;
    return requiredRoles.includes(user.role.name);
  };

  const canAccessPage = (page: keyof typeof PAGE_PERMISSIONS): boolean => {
    return hasAnyRole(PAGE_PERMISSIONS[page]);
  };

  const canPerformAction = (action: keyof typeof ACTION_PERMISSIONS): boolean => {
    return hasAnyRole(ACTION_PERMISSIONS[action]);
  };

  const isAdmin = (): boolean => {
    return hasAnyRole([ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN]);
  };

  const isSuperAdmin = (): boolean => {
    return hasRole(ROLES.SUPER_ADMIN);
  };

  const canManageUsers = (): boolean => {
    return canPerformAction('CREATE_USER');
  };

  const canRunOptimization = (): boolean => {
    return canPerformAction('RUN_OPTIMIZATION');
  };

  const canEditSchedule = (): boolean => {
    return canPerformAction('EDIT_SCHEDULE');
  };

  const canAccessSystemSettings = (): boolean => {
    return canPerformAction('SYSTEM_SETTINGS');
  };

  const getUserRoleDisplayName = (): string => {
    if (!user?.role?.display_name) return 'Bilinmiyor';
    return user.role.display_name;
  };

  const getUserRoleColor = (): string => {
    switch (user?.role?.name) {
      case ROLES.SUPER_ADMIN:
        return '#d32f2f'; // Kırmızı
      case ROLES.ORG_ADMIN:
        return '#f57c00'; // Turuncu
      case ROLES.MANAGER:
        return '#1976d2'; // Mavi
      case ROLES.PLANNER:
        return '#388e3c'; // Yeşil
      case ROLES.STAFF:
        return '#7b1fa2'; // Mor
      default:
        return '#757575'; // Gri
    }
  };

  return {
    user,
    hasRole,
    hasAnyRole,
    canAccessPage,
    canPerformAction,
    isAdmin,
    isSuperAdmin,
    canManageUsers,
    canRunOptimization,
    canEditSchedule,
    canAccessSystemSettings,
    getUserRoleDisplayName,
    getUserRoleColor
  };
}; 