import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Alert, Typography, Button } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions, PAGE_PERMISSIONS } from '../hooks/usePermissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredPage?: keyof typeof PAGE_PERMISSIONS;
  showAccessDenied?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  requiredPage,
  showAccessDenied = false
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { hasRole, canAccessPage, getUserRoleDisplayName } = usePermissions();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  let hasAccess = true;
  
  if (requiredRole && !hasRole(requiredRole)) {
    hasAccess = false;
  }
  
  if (requiredPage && !canAccessPage(requiredPage)) {
    hasAccess = false;
  }

  // Show access denied page or redirect
  if (!hasAccess) {
    if (showAccessDenied) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
          p={3}
        >
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3, 
              maxWidth: 500,
              borderRadius: 2 
            }}
          >
            <Typography variant="h6" gutterBottom>
              Erişim Reddedildi
            </Typography>
            <Typography variant="body2" paragraph>
              Bu sayfaya erişim yetkiniz bulunmamaktadır.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Mevcut rolünüz: <strong>{getUserRoleDisplayName()}</strong>
            </Typography>
          </Alert>
          <Button 
            variant="contained" 
            onClick={() => window.history.back()}
            sx={{ borderRadius: 2 }}
          >
            Geri Dön
          </Button>
        </Box>
      );
    }
    
    // Redirect to dashboard by default
    return <Navigate to="/dashboard" replace />;
  }

  // Render children if authenticated and authorized
  return <>{children}</>;
};

export default ProtectedRoute; 