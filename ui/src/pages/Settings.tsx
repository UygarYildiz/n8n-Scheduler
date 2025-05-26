import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Card, 
  CardContent, 
  CardHeader,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar,
  Chip,
  Avatar,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import { 
  Save as SaveIcon,
  Refresh as ResetIcon,
  Person as PersonIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';

interface UserPreferences {
  autoSave: boolean;
  compactView: boolean;
  autoRefresh: boolean;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface SystemInfo {
  appVersion: string;
  apiVersion: string;
  n8nVersion: string;
  lastUpdate: string;
  serverStatus: 'online' | 'offline' | 'maintenance';
  uptime: string;
  memoryUsage: number;
  activeUsers: number;
}

interface SystemApiResponse {
  app_version?: string;
  api_version?: string;
  n8n_version?: string;
  uptime?: string;
  memory_usage?: number;
  active_users?: number;
  database_status?: string;
}

interface HealthApiResponse {
  version?: string;
  api_version?: string;
  status?: string;
  uptime?: string;
}

interface OptimizationApiResponse {
  timestamp?: string;
  status?: string;
}

const Settings = () => {
  // State tanımlamaları
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    autoSave: true,
    compactView: false,
    autoRefresh: true
  });

  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    appVersion: 'Yükleniyor...',
    apiVersion: 'Yükleniyor...',
    n8nVersion: 'Yükleniyor...',
    lastUpdate: 'Yükleniyor...',
    serverStatus: 'offline',
    uptime: 'Yükleniyor...',
    memoryUsage: 0,
    activeUsers: 0
  });
  
  // Dialog ve notification state'leri
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // Şifre değiştirme state'leri
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Sayfa yüklendiğinde ayarları localStorage'dan yükle
  useEffect(() => {
    loadSettingsFromStorage();
    fetchSystemInfo();
    
    // Auto-refresh etkinse periyodik olarak sistem durumunu kontrol et
    if (userPreferences.autoRefresh) {
      const interval = setInterval(fetchSystemInfo, 30000); // 30 saniyede bir
      return () => clearInterval(interval);
    }
  }, [userPreferences.autoRefresh]);

  // LocalStorage'dan ayarları yükle
  const loadSettingsFromStorage = () => {
    try {
      const savedUserPreferences = localStorage.getItem('userPreferences');

      if (savedUserPreferences) {
        const prefs = JSON.parse(savedUserPreferences);
        setUserPreferences(prev => ({
          ...prev,
          ...prefs
        }));
      }
    } catch (error) {
      console.error('Ayarlar yüklenirken hata:', error);
    }
  };

  // Ayarları localStorage'a kaydet
  const saveSettingsToStorage = () => {
    try {
      localStorage.setItem('userPreferences', JSON.stringify(userPreferences));
      return true;
    } catch (error) {
      console.error('Ayarlar kaydedilirken hata:', error);
      return false;
    }
  };

  // Sistem bilgilerini API'den al
  const fetchSystemInfo = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // Ana API health check
      const healthResponse = await fetch('http://localhost:8000/health', {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (healthResponse.ok) {
        const healthData: HealthApiResponse = await healthResponse.json();
        
        // Health endpoint'inden gelen verileri kullan
        const currentTime = new Date().toLocaleString('tr-TR');
        const randomMemory = Math.floor(Math.random() * 30) + 40; // 40-70% arası
        
        setSystemInfo(prev => ({ 
          ...prev, 
          appVersion: healthData.version || '1.0.0',
          apiVersion: healthData.api_version || '1.0.0',
          n8nVersion: '1.91.2',
          serverStatus: healthData.status === 'healthy' ? 'online' : 'offline',
          uptime: healthData.uptime || 'Bilinmiyor',
          memoryUsage: randomMemory,
          activeUsers: 1,
          lastUpdate: currentTime
        }));
      }
    } catch (error) {
      console.error('Sistem bilgileri alınamadı:', error);
    }
  };

  // Kullanıcı tercihleri değiştir
  const handleUserPreferenceChange = (name: keyof UserPreferences) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    
    const newPrefs = {
      ...userPreferences,
      [name]: value
    };
    
    setUserPreferences(newPrefs);

    // Auto-save etkinse anında kaydet
    if (userPreferences.autoSave) {
      localStorage.setItem('userPreferences', JSON.stringify(newPrefs));
    }
  };

  // Tüm ayarları kaydet
  const handleSaveAllSettings = () => {
    const success = saveSettingsToStorage();
    if (success) {
      setSaveSuccess(true);
      setSnackbar({ 
        open: true, 
        message: 'Tüm ayarlar başarıyla kaydedildi!', 
        severity: 'success' 
      });
      
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setSnackbar({ 
        open: true, 
        message: 'Ayarlar kaydedilirken hata oluştu!', 
        severity: 'error' 
      });
    }
  };

  // Ayarları varsayılana sıfırla
  const handleResetSettings = () => {
    // Varsayılan değerleri geri yükle
    setUserPreferences({
      autoSave: true,
      compactView: false,
      autoRefresh: true
    });

    // LocalStorage'ı temizle
    localStorage.removeItem('userPreferences');

    setSnackbar({ 
      open: true, 
      message: 'Ayarlar varsayılana sıfırlandı!', 
      severity: 'success' 
    });
  };

  // Şifre değiştirme fonksiyonları
  const handlePasswordChange = (field: keyof PasswordChangeData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handlePasswordSubmit = async () => {
    // Validasyon
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setSnackbar({
        open: true,
        message: 'Lütfen tüm alanları doldurun!',
        severity: 'error'
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSnackbar({
        open: true,
        message: 'Yeni şifreler eşleşmiyor!',
        severity: 'error'
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setSnackbar({
        open: true,
        message: 'Yeni şifre en az 6 karakter olmalıdır!',
        severity: 'error'
      });
      return;
    }

    setPasswordLoading(true);
    
    try {
      // Gerçek API çağrısı
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setSnackbar({
          open: true,
          message: 'Oturum süresi dolmuş. Lütfen tekrar giriş yapın.',
          severity: 'error'
        });
        return;
      }

      const response = await fetch('http://localhost:8000/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Başarılı
        setSnackbar({
          open: true,
          message: data.message || 'Şifre başarıyla değiştirildi!',
          severity: 'success'
        });
        
        // Formu temizle ve kapat
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowPasswordForm(false);
      } else {
        // Hata
        setSnackbar({
          open: true,
          message: data.detail || 'Şifre değiştirirken hata oluştu!',
          severity: 'error'
        });
      }
      
    } catch (error) {
      console.error('Şifre değiştirme hatası:', error);
      setSnackbar({
        open: true,
        message: 'Sunucuya bağlanırken hata oluştu!',
        severity: 'error'
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Server status rengini getir
  const getServerStatusColor = (status: SystemInfo['serverStatus']) => {
    switch (status) {
      case 'online': return '#4caf50';
      case 'offline': return '#f44336';
      case 'maintenance': return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 5, textAlign: 'center', position: 'relative' }}>
        <Box sx={{
          maxWidth: '800px',
          mx: 'auto',
          mb: 4,
          pb: 3,
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
        }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Kullanıcı Ayarları
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
            Kişisel tercihler ve sistem bilgileri
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
            <Chip
              icon={<SettingsIcon />}
              label="Kişiselleştirme"
              color="primary"
              variant="outlined"
            />
          </Box>
        </Box>
      </Box>

      {/* Success Alert */}
      {saveSuccess && (
        <Alert 
          severity="success" 
          sx={{ 
            mb: 4, 
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)' 
          }}
        >
          <Typography variant="subtitle1" fontWeight="600">
            Ayarlar başarıyla kaydedildi!
          </Typography>
          <Typography variant="body2">
            Tüm değişiklikler sisteme uygulandı ve yerel depolamaya kaydedildi.
          </Typography>
        </Alert>
      )}

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
      
      <Grid container spacing={4}>
        
        {/* Şifre Değiştirme */}
        <Grid item xs={12} lg={6}>
          <Card sx={{
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            height: '100%'
          }}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: '#f44336' }}>
                  <LockIcon />
                </Avatar>
              }
              title="Şifre Değiştirme"
              subheader="Hesap güvenliği için şifrenizi güncelleyin"
            />
            
            <CardContent>
              {!showPasswordForm ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Hesap güvenliğiniz için şifrenizi düzenli olarak değiştirmenizi öneririz.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => setShowPasswordForm(true)}
                    startIcon={<LockIcon />}
                    sx={{
                      bgcolor: '#f44336',
                      '&:hover': {
                        bgcolor: '#d32f2f'
                      }
                    }}
                  >
                    Şifre Değiştir
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <TextField
                    fullWidth
                    label="Mevcut Şifre"
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange('currentPassword')}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => togglePasswordVisibility('current')}
                            edge="end"
                          >
                            {showPasswords.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Yeni Şifre"
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange('newPassword')}
                    helperText="En az 6 karakter olmalıdır"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => togglePasswordVisibility('new')}
                            edge="end"
                          >
                            {showPasswords.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Yeni Şifre (Tekrar)"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange('confirmPassword')}
                    error={passwordData.confirmPassword !== '' && passwordData.newPassword !== passwordData.confirmPassword}
                    helperText={passwordData.confirmPassword !== '' && passwordData.newPassword !== passwordData.confirmPassword ? 'Şifreler eşleşmiyor' : ''}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => togglePasswordVisibility('confirm')}
                            edge="end"
                          >
                            {showPasswords.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        });
                      }}
                      sx={{ flex: 1 }}
                    >
                      İptal
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handlePasswordSubmit}
                      disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                      startIcon={passwordLoading ? <CircularProgress size={20} /> : <LockIcon />}
                      sx={{
                        flex: 1,
                        bgcolor: '#f44336',
                        '&:hover': {
                          bgcolor: '#d32f2f'
                        }
                      }}
                    >
                      {passwordLoading ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Kullanıcı Arayüzü Ayarları */}
        <Grid item xs={12} lg={6}>
          <Card sx={{
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            height: '100%'
          }}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: '#9c27b0' }}>
                  <PersonIcon />
                </Avatar>
              }
              title="Kullanıcı Tercihleri"
              subheader="Kişiselleştirme ve davranış ayarları"
            />
            
            <CardContent>
              <Box sx={{ mt: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={userPreferences.autoSave}
                      onChange={handleUserPreferenceChange('autoSave')}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StorageIcon />
                      <Typography>Otomatik Kaydetme</Typography>
                    </Box>
                  }
                />
              </Box>

              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={userPreferences.compactView}
                      onChange={handleUserPreferenceChange('compactView')}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SpeedIcon />
                      <Typography>Kompakt Görünüm</Typography>
                    </Box>
                  }
                />
              </Box>

              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={userPreferences.autoRefresh}
                      onChange={handleUserPreferenceChange('autoRefresh')}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SettingsIcon />
                      <Typography>Otomatik Durum Güncellemesi</Typography>
                    </Box>
                  }
                />
              </Box>


            </CardContent>
          </Card>
        </Grid>

        {/* Sistem Bilgileri */}
        <Grid item xs={12} lg={6}>
          <Card sx={{
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            height: '100%'
          }}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: '#ff5722' }}>
                  <InfoIcon />
                </Avatar>
              }
              title="Sistem Bilgileri"
              subheader="Sürüm bilgileri ve performans durumu"
            />
            
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, borderRadius: 2, bgcolor: 'rgba(33, 150, 243, 0.05)' }}>
                    <Typography variant="h6" fontWeight="600" gutterBottom sx={{ color: '#1976d2' }}>
                      Sürüm Bilgileri
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2">
                        <strong>Uygulama:</strong> v{systemInfo.appVersion}
                      </Typography>
                      <Typography variant="body2">
                        <strong>API:</strong> v{systemInfo.apiVersion}
                      </Typography>
                      <Typography variant="body2">
                        <strong>n8n:</strong> v{systemInfo.n8nVersion}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Paper sx={{ p: 3, borderRadius: 2, bgcolor: 'rgba(76, 175, 80, 0.05)' }}>
                    <Typography variant="h6" fontWeight="600" gutterBottom sx={{ color: '#4caf50' }}>
                      Sistem Durumu
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box 
                          sx={{ 
                            width: 12, 
                            height: 12, 
                            borderRadius: '50%', 
                            bgcolor: getServerStatusColor(systemInfo.serverStatus)
                          }} 
                        />
                        <Typography variant="body2">
                          <strong>Durum:</strong> {systemInfo.serverStatus === 'online' ? 'Çevrimiçi' : systemInfo.serverStatus === 'offline' ? 'Çevrimdışı' : 'Bakım'}
                        </Typography>
                      </Box>
                      <Typography variant="body2">
                        <strong>Çalışma Süresi:</strong> {systemInfo.uptime}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Aktif Kullanıcı:</strong> {systemInfo.activeUsers}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>


              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Kaydet ve Sıfırla Butonları */}
        <Grid item xs={12}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 3, 
            mt: 4,
            p: 3,
            borderRadius: 3,
            bgcolor: 'rgba(0,0,0,0.02)',
            border: '1px solid rgba(0,0,0,0.05)'
          }}>
            <Button 
              variant="contained" 
              size="large"
              startIcon={<SaveIcon />}
              onClick={handleSaveAllSettings}
              sx={{ 
                px: 4, 
                py: 1.5, 
                borderRadius: 3,
                boxShadow: '0 4px 14px rgba(25, 118, 210, 0.3)'
              }}
            >
              Ayarları Kaydet
            </Button>
            
            <Button 
              variant="outlined" 
              size="large"
              startIcon={<ResetIcon />}
              onClick={handleResetSettings}
              sx={{ 
                px: 4, 
                py: 1.5, 
                borderRadius: 3
              }}
            >
              Varsayılanlara Sıfırla
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;
