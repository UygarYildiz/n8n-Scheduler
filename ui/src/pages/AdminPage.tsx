import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Snackbar,
  Alert,
  Divider,
  CircularProgress,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Person,
  Business,
  Schedule,
  Analytics,
  ExitToApp,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AdminPanelSettings as AdminIcon,
  Group as GroupIcon,
  Security as SecurityIcon,
  Refresh as RefreshIcon,
  ToggleOff as ToggleOffIcon,
  ToggleOn as ToggleOnIcon,
  Assessment as ReportIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { 
  adminService, 
  AdminUser, 
  AdminStats, 
  CreateUserRequest, 
  UpdateUserRequest 
} from '../services/adminService';

const AdminPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { canManageUsers, getUserRoleColor, isAdmin } = usePermissions();
  const navigate = useNavigate();

  // State tanımlamaları
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [organizations, setOrganizations] = useState<Array<{ id: number; name: string; type: string }>>([]);
  const [roles, setRoles] = useState<Array<{ id: number; name: string; display_name: string }>>([]);
  const [loading, setLoading] = useState(true);

  // Dialog ve notification state'leri
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });

  // Yeni kullanıcı form state'i
  const [newUser, setNewUser] = useState<CreateUserRequest>({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    organization_id: undefined,
    role_id: undefined
  });

  // Veri yükleme
  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, statsData, orgsData, rolesData] = await Promise.all([
        adminService.getAllUsers(),
        adminService.getAdminStats(),
        adminService.getOrganizations(),
        adminService.getRoles()
      ]);

      setUsers(usersData.users);
      setStats(statsData);
      setOrganizations(orgsData);
      setRoles(rolesData);
    } catch (error) {
      console.error('Data loading error:', error);
      setSnackbar({
        open: true,
        message: 'Veriler yüklenirken hata oluştu',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  // Yeni kullanıcı ekle
  const handleAddUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.first_name || !newUser.last_name || !newUser.password) {
      setSnackbar({ 
        open: true, 
        message: 'Tüm zorunlu alanları doldurun!', 
        severity: 'error' 
      });
      return;
    }

    try {
      await adminService.createUser(newUser);
      await loadData(); // Verileri yenile
      
      setNewUser({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        organization_id: undefined,
        role_id: undefined
      });
      setUserDialogOpen(false);
      
      setSnackbar({ 
        open: true, 
        message: 'Kullanıcı başarıyla eklendi!', 
        severity: 'success' 
      });
    } catch (error: any) {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.detail || 'Kullanıcı eklenirken hata oluştu', 
        severity: 'error' 
      });
    }
  };

  // Kullanıcıyı düzenle
  const handleEditUser = (userItem: AdminUser) => {
    setEditingUser(userItem);
    setNewUser({
      username: userItem.username,
      email: userItem.email,
      password: '', // Şifre boş bırakılır
      first_name: userItem.first_name,
      last_name: userItem.last_name,
      organization_id: userItem.organization?.id,
      role_id: userItem.role?.id
    });
    setUserDialogOpen(true);
  };

  // Kullanıcı düzenlemeyi kaydet
  const handleSaveEditUser = async () => {
    if (!editingUser || !newUser.username || !newUser.email || !newUser.first_name || !newUser.last_name) {
      setSnackbar({ 
        open: true, 
        message: 'Tüm zorunlu alanları doldurun!', 
        severity: 'error' 
      });
      return;
    }

    try {
      const updateData: UpdateUserRequest = {
        username: newUser.username,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        organization_id: newUser.organization_id,
        role_id: newUser.role_id
      };

      // Şifre girilmişse ekle
      if (newUser.password) {
        updateData.password = newUser.password;
      }

      await adminService.updateUser(editingUser.id, updateData);
      await loadData(); // Verileri yenile

      setEditingUser(null);
      setNewUser({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        organization_id: undefined,
        role_id: undefined
      });
      setUserDialogOpen(false);
      
      setSnackbar({ 
        open: true, 
        message: 'Kullanıcı bilgileri güncellendi!', 
        severity: 'success' 
      });
    } catch (error: any) {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.detail || 'Kullanıcı güncellenirken hata oluştu', 
        severity: 'error' 
      });
    }
  };

  // Kullanıcıyı sil
  const handleDeleteUser = (userItem: AdminUser) => {
    setUserToDelete(userItem);
    setDeleteDialogOpen(true);
  };

  // Kullanıcı silmeyi onayla
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await adminService.deleteUser(userToDelete.id);
      await loadData(); // Verileri yenile
      
      setUserToDelete(null);
      setDeleteDialogOpen(false);
      
      setSnackbar({ 
        open: true, 
        message: 'Kullanıcı başarıyla silindi!', 
        severity: 'success' 
      });
    } catch (error: any) {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.detail || 'Kullanıcı silinirken hata oluştu', 
        severity: 'error' 
      });
    }
  };

  // Kullanıcı durumunu değiştir
  const handleToggleUserStatus = async (userItem: AdminUser) => {
    try {
      await adminService.toggleUserStatus(userItem.id);
      await loadData(); // Verileri yenile
      
      const statusText = userItem.is_active ? 'deaktive edildi' : 'aktive edildi';
      setSnackbar({ 
        open: true, 
        message: `Kullanıcı ${statusText}!`, 
        severity: 'success' 
      });
    } catch (error: any) {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.detail || 'Kullanıcı durumu değiştirilirken hata oluştu', 
        severity: 'error' 
      });
    }
  };

  // Rol rengini getir
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return '#f44336';
      case 'org_admin': return '#ff9800';
      case 'manager': return '#2196f3';
      case 'planner': return '#4caf50';
      case 'staff': return '#9c27b0';
      default: return '#9e9e9e';
    }
  };

  // Tarih formatla
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Hiç';
    try {
      return new Date(dateString).toLocaleString('tr-TR');
    } catch {
      return 'Bilinmiyor';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Header */}
      <Box sx={{ mb: 5, textAlign: 'center', position: 'relative' }}>
        <Box sx={{
          maxWidth: '800px',
          mx: 'auto',
          mb: 4,
          pb: 4,
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
        }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h4" fontWeight="bold">
              Yönetici Paneli
            </Typography>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadData}
              disabled={loading}
            >
              Yenile
            </Button>
          </Box>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
            Kullanıcı yönetimi, kurum istatistikleri ve operasyonel kontroller
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
            <Chip
              icon={<AdminIcon />}
              label="Kurum Yöneticisi"
              color="primary"
              variant="outlined"
            />
            <Chip
              icon={<SecurityIcon />}
              label="Yetkilendirilmiş Erişim"
              color="success"
              variant="outlined"
            />
          </Box>
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Yönetici Profil Kartı */}
        <Grid item xs={12} md={4}>
          <Card sx={{
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            height: '100%'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ 
                  bgcolor: 'primary.main', 
                  mr: 2, 
                  width: 56, 
                  height: 56 
                }}>
                  <Person fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="600">
                    {user?.full_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    @{user?.username}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  E-posta
                </Typography>
                <Typography variant="body1" fontWeight="500">
                  {user?.email}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Rol
                </Typography>
                <Chip 
                  label={user?.role?.display_name} 
                  color="primary" 
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Kurum
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Business sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body1" fontWeight="500">
                    {user?.organization?.name}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Kurum Tipi
                </Typography>
                <Chip 
                  label={user?.organization?.type === 'hastane' ? 'Hastane' : 'Çağrı Merkezi'} 
                  variant="outlined"
                  size="small"
                />
              </Box>

              <Button
                fullWidth
                variant="outlined"
                color="error"
                startIcon={<ExitToApp />}
                onClick={handleLogout}
                sx={{ 
                  mt: 2,
                  borderRadius: 2,
                  py: 1.5
                }}
              >
                Güvenli Çıkış
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Yönetim İstatistikleri */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Paper sx={{ 
                p: 3, 
                textAlign: 'center',
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              }}>
                <GroupIcon sx={{ fontSize: 48, mb: 1, opacity: 0.9 }} />
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  {stats?.user_stats.total_users || 0}
                </Typography>
                <Typography variant="h6" gutterBottom>
                  Toplam Kullanıcı
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {stats?.user_stats.active_users || 0} aktif kullanıcı
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Paper sx={{ 
                p: 3, 
                textAlign: 'center',
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white'
              }}>
                <SecurityIcon sx={{ fontSize: 48, mb: 1, opacity: 0.9 }} />
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  {stats?.user_stats.admin_users || 0}
                </Typography>
                <Typography variant="h6" gutterBottom>
                  Yönetici
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Sistem yöneticisi sayısı
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Card sx={{
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
              }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Sistem Durumu
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main">
                          ✓
                        </Typography>
                        <Typography variant="body2">
                          API Bağlantısı
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main">
                          ✓
                        </Typography>
                        <Typography variant="body2">
                          Veritabanı
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main">
                          ✓
                        </Typography>
                        <Typography variant="body2">
                          Authentication
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h4" color="success.main">
                          {stats?.active_sessions || 0}
                        </Typography>
                        <Typography variant="body2">
                          Aktif Oturum
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Hızlı Eylemler */}
        <Grid item xs={12}>
          <Card sx={{
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Hızlı Eylemler
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setEditingUser(null);
                      setNewUser({
                        username: '',
                        email: '',
                        password: '',
                        first_name: '',
                        last_name: '',
                        organization_id: undefined,
                        role_id: undefined
                      });
                      setUserDialogOpen(true);
                    }}
                    sx={{ 
                      py: 2,
                      borderRadius: 2,
                      textTransform: 'none'
                    }}
                  >
                    Yeni Kullanıcı Ekle
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<ReportIcon />}
                    onClick={() => {
                      setSnackbar({ 
                        open: true, 
                        message: 'Raporlar sayfasına yönlendiriliyor...', 
                        severity: 'success' 
                      });
                      setTimeout(() => navigate('/results'), 500);
                    }}
                    sx={{ 
                      py: 2,
                      borderRadius: 2,
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: 'rgba(33, 150, 243, 0.04)',
                        borderColor: 'primary.main'
                      }
                    }}
                  >
                    Raporları Görüntüle
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<TrendingUpIcon />}
                    onClick={() => {
                      setSnackbar({ 
                        open: true, 
                        message: 'Dashboard sayfasına yönlendiriliyor...', 
                        severity: 'success' 
                      });
                      setTimeout(() => navigate('/dashboard'), 500);
                    }}
                    sx={{ 
                      py: 2,
                      borderRadius: 2,
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: 'rgba(76, 175, 80, 0.04)',
                        borderColor: 'success.main'
                      }
                    }}
                  >
                    Performans Analizi
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Schedule />}
                    onClick={() => {
                      setSnackbar({ 
                        open: true, 
                        message: 'Vardiya planları sayfasına yönlendiriliyor...', 
                        severity: 'success' 
                      });
                      setTimeout(() => navigate('/schedule-view'), 500);
                    }}
                    sx={{ 
                      py: 2,
                      borderRadius: 2,
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: 'rgba(255, 152, 0, 0.04)',
                        borderColor: 'warning.main'
                      }
                    }}
                  >
                    Vardiya Planları
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Kullanıcı Yönetimi */}
        <Grid item xs={12}>
          <Card sx={{
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
          }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ 
                p: 3, 
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{
                    bgcolor: 'white',
                    color: '#4facfe',
                    mr: 2
                  }}>
                    <GroupIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      Kullanıcı Yönetimi
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Toplam {users.length} kullanıcı • {users.filter(u => u.is_active).length} aktif
                    </Typography>
                  </Box>
                </Box>
                {canManageUsers() && (
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setEditingUser(null);
                      setNewUser({
                        username: '',
                        email: '',
                        password: '',
                        first_name: '',
                        last_name: '',
                        organization_id: undefined,
                        role_id: undefined
                      });
                      setUserDialogOpen(true);
                    }}
                    sx={{ 
                      bgcolor: 'white',
                      color: '#4facfe',
                      borderRadius: 2,
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.9)'
                      }
                    }}
                  >
                    Yeni Kullanıcı
                  </Button>
                )}
              </Box>
              
              <List sx={{ p: 0 }}>
                {users.map((userItem, index) => (
                  <ListItem
                    key={userItem.id}
                    sx={{ 
                      borderBottom: index < users.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                      py: 2,
                      px: 3,
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }
                    }}
                    secondaryAction={
                      canManageUsers() ? (
                        <Box>
                          <Tooltip title={userItem.is_active ? 'Deaktive Et' : 'Aktive Et'}>
                            <IconButton 
                              edge="end" 
                              onClick={() => handleToggleUserStatus(userItem)}
                              sx={{ mr: 1 }}
                              color={userItem.is_active ? 'warning' : 'success'}
                            >
                              {userItem.is_active ? <ToggleOnIcon /> : <ToggleOffIcon />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Düzenle">
                            <IconButton 
                              edge="end" 
                              onClick={() => handleEditUser(userItem)}
                              sx={{ mr: 1 }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Sil">
                            <IconButton 
                              edge="end" 
                              onClick={() => handleDeleteUser(userItem)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ) : null
                    }
                  >
                    <ListItemIcon>
                      <Avatar sx={{ 
                        bgcolor: getRoleColor(userItem.role?.name || ''),
                        width: 48,
                        height: 48
                      }}>
                        {userItem.first_name.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                          <Typography variant="subtitle1" fontWeight="600">
                            {userItem.full_name}
                          </Typography>
                          <Chip 
                            label={userItem.role?.display_name || 'Rol Yok'} 
                            size="small" 
                            sx={{ 
                              bgcolor: getRoleColor(userItem.role?.name || ''), 
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }} 
                          />
                          <Chip 
                            label={userItem.is_active ? 'Aktif' : 'Pasif'} 
                            size="small" 
                            color={userItem.is_active ? 'success' : 'error'}
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            📧 {userItem.email} • @{userItem.username}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            🏢 {userItem.organization?.name || 'Kurum Yok'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            📅 Kayıt: {formatDate(userItem.created_at)} • Son giriş: {formatDate(userItem.last_session)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
                {users.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography variant="body1" color="text.secondary" textAlign="center">
                          Henüz kullanıcı bulunmuyor
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Kullanıcı Ekleme/Düzenleme Dialog */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
              {editingUser ? <EditIcon fontSize="small" /> : <AddIcon fontSize="small" />}
            </Avatar>
            {editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                autoFocus
                margin="dense"
                label="Ad"
                fullWidth
                variant="outlined"
                value={newUser.first_name}
                onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Soyad"
                fullWidth
                variant="outlined"
                value={newUser.last_name}
                onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="Kullanıcı Adı"
                fullWidth
                variant="outlined"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="E-posta"
                type="email"
                fullWidth
                variant="outlined"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label={editingUser ? "Yeni Şifre (boş bırakılabilir)" : "Şifre"}
                type="password"
                fullWidth
                variant="outlined"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                helperText={editingUser ? "Şifre değiştirmek istemiyorsanız boş bırakın" : ""}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="dense">
                <InputLabel>Kurum</InputLabel>
                <Select
                  value={newUser.organization_id || ''}
                  label="Kurum"
                  onChange={(e) => setNewUser({ ...newUser, organization_id: e.target.value as number })}
                >
                  {organizations.map((org) => (
                    <MenuItem key={org.id} value={org.id}>
                      {org.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="dense">
                <InputLabel>Rol</InputLabel>
                <Select
                  value={newUser.role_id || ''}
                  label="Rol"
                  onChange={(e) => setNewUser({ ...newUser, role_id: e.target.value as number })}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%', 
                          bgcolor: getRoleColor(role.name) 
                        }} />
                        {role.display_name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button onClick={() => setUserDialogOpen(false)} sx={{ borderRadius: 2 }}>
            İptal
          </Button>
          <Button 
            onClick={editingUser ? handleSaveEditUser : handleAddUser}
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            {editingUser ? 'Güncelle' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Kullanıcı Silme Onay Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ bgcolor: 'error.main', width: 32, height: 32 }}>
              <DeleteIcon fontSize="small" />
            </Avatar>
            Kullanıcıyı Sil
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>"{userToDelete?.full_name}"</strong> kullanıcısını silmek istediğinizden emin misiniz? 
            Bu işlem geri alınamaz ve kullanıcının tüm verileri silinecektir.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ borderRadius: 2 }}>
            İptal
          </Button>
          <Button 
            onClick={confirmDeleteUser} 
            color="error" 
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            Sil
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPage; 