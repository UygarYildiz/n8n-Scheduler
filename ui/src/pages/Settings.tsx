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
  LinearProgress
} from '@mui/material';
import { 
  Save as SaveIcon,
  Refresh as ResetIcon,
  Person as PersonIcon,
  Api as ApiIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Language as LanguageIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Info as InfoIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

interface ApiSettings {
  apiUrl: string;
  n8nUrl: string;
  webhookId: string;
  timeout: number;
  retryAttempts: number;
}

interface UserPreferences {
  darkMode: boolean;
  language: 'tr' | 'en';
  notificationsEnabled: boolean;
  autoSave: boolean;
  compactView: boolean;
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

const Settings = () => {
  // State tanımlamaları
  const [apiSettings, setApiSettings] = useState<ApiSettings>({
    apiUrl: 'http://localhost:8000',
    n8nUrl: 'http://localhost:5678',
    webhookId: 'optimization-webhook-001',
    timeout: 30000,
    retryAttempts: 3
  });
  
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    darkMode: false,
    language: 'tr',
    notificationsEnabled: true,
    autoSave: true,
    compactView: false
  });

  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    appVersion: '1.2.3',
    apiVersion: '2.1.0',
    n8nVersion: '1.91.2',
    lastUpdate: '2024-01-15 09:00:00',
    serverStatus: 'online',
    uptime: '15 gün 6 saat',
    memoryUsage: 68.5,
    activeUsers: 12
  });
  
  // Dialog ve notification state'leri
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testingApi, setTestingApi] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Sayfa yüklendiğinde ayarları localStorage'dan yükle
  useEffect(() => {
    loadSettingsFromStorage();
    fetchSystemInfo();
  }, []);

  // LocalStorage'dan ayarları yükle
  const loadSettingsFromStorage = () => {
    try {
      const savedApiSettings = localStorage.getItem('apiSettings');
      const savedUserPreferences = localStorage.getItem('userPreferences');

      if (savedApiSettings) {
        setApiSettings(JSON.parse(savedApiSettings));
      }

      if (savedUserPreferences) {
        const prefs = JSON.parse(savedUserPreferences);
        setUserPreferences(prefs);
        
        // Theme'i uygula
        if (prefs.darkMode) {
          document.body.classList.add('dark-mode');
        }
      }
    } catch (error) {
      console.error('Ayarlar yüklenirken hata:', error);
    }
  };

  // Ayarları localStorage'a kaydet
  const saveSettingsToStorage = () => {
    try {
      localStorage.setItem('apiSettings', JSON.stringify(apiSettings));
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
      // Gerçek API çağrısı simülasyonu
      // const info = await api.getSystemInfo();
      // if (info) {
      //   setSystemInfo(info);
      // }
    } catch (error) {
      console.error('Sistem bilgileri alınamadı:', error);
    }
  };

  // API bağlantısını test et
  const testApiConnection = async () => {
    setTestingApi(true);
    setApiTestResult(null);

    try {
      // API endpoint'ini test et
      const response = await fetch(`${apiSettings.apiUrl}/health`, {
        method: 'GET'
      });

      if (response.ok) {
        setApiTestResult({ 
          success: true, 
          message: 'API bağlantısı başarılı! Tüm endpoint\'ler erişilebilir.' 
        });
      } else {
        setApiTestResult({ 
          success: false, 
          message: `API yanıt vermedi. Status: ${response.status}` 
        });
      }
    } catch (error) {
      setApiTestResult({ 
        success: false, 
        message: `Bağlantı hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}` 
      });
    } finally {
      setTestingApi(false);
    }
  };

  // n8n webhook'unu test et
  const testN8nWebhook = async () => {
    setTestingApi(true);
    try {
      const response = await fetch(`${apiSettings.n8nUrl}/webhook-test/${apiSettings.webhookId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });

      if (response.ok) {
        setSnackbar({ 
          open: true, 
          message: 'n8n webhook testi başarılı!', 
          severity: 'success' 
        });
      } else {
        setSnackbar({ 
          open: true, 
          message: 'n8n webhook testi başarısız!', 
          severity: 'error' 
        });
      }
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: 'n8n bağlantı hatası!', 
        severity: 'error' 
      });
    } finally {
      setTestingApi(false);
    }
  };

  // API ayarları değiştir
  const handleApiSettingChange = (name: keyof ApiSettings) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = name === 'timeout' || name === 'retryAttempts' 
      ? parseInt(event.target.value) || 0 
      : event.target.value;
    
    setApiSettings({
      ...apiSettings,
      [name]: value
    });
  };

  // Kullanıcı tercihleri değiştir
  const handleUserPreferenceChange = (name: keyof UserPreferences) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    
    const newPrefs = {
      ...userPreferences,
      [name]: value
    };
    
    setUserPreferences(newPrefs);

    // Dark mode değişimini anında uygula
    if (name === 'darkMode') {
      if (value) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    }

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
    setApiSettings({
      apiUrl: 'http://localhost:8000',
      n8nUrl: 'http://localhost:5678',
      webhookId: 'optimization-webhook-001',
      timeout: 30000,
      retryAttempts: 3
    });

    setUserPreferences({
      darkMode: false,
      language: 'tr',
      notificationsEnabled: true,
      autoSave: true,
      compactView: false
    });

    // Dark mode'u kapat
    document.body.classList.remove('dark-mode');

    // LocalStorage'ı temizle
    localStorage.removeItem('apiSettings');
    localStorage.removeItem('userPreferences');

    setSnackbar({ 
      open: true, 
      message: 'Ayarlar varsayılana sıfırlandı!', 
      severity: 'success' 
    });
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
            Sistem Ayarları
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
            API bağlantıları, kullanıcı tercihleri ve sistem konfigürasyonu
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
            <Chip
              icon={<SettingsIcon />}
              label="Sistem Konfigürasyonu"
              color="primary"
              variant="outlined"
            />
            <Chip
              icon={<SecurityIcon />}
              label="Güvenli Bağlantı"
              color="success"
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
        {/* API Entegrasyon Ayarları */}
        <Grid item xs={12} lg={6}>
          <Card sx={{
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            height: '100%'
          }}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: '#1976d2' }}>
                  <ApiIcon />
                </Avatar>
              }
              title="API Entegrasyon Ayarları"
              subheader="Optimizasyon ve n8n bağlantı konfigürasyonu"
            />
            
            <CardContent>
              <TextField
                fullWidth
                label="Optimizasyon API URL"
                value={apiSettings.apiUrl}
                onChange={handleApiSettingChange('apiUrl')}
                margin="normal"
                variant="outlined"
                helperText="Çizelgeleme optimizasyonu için kullanılacak API adresi"
              />
              
              <TextField
                fullWidth
                label="n8n Workflow URL"
                value={apiSettings.n8nUrl}
                onChange={handleApiSettingChange('n8nUrl')}
                margin="normal"
                variant="outlined"
                helperText="n8n automation platform adresi"
              />
              
              <TextField
                fullWidth
                label="Webhook Identifier"
                value={apiSettings.webhookId}
                onChange={handleApiSettingChange('webhookId')}
                margin="normal"
                variant="outlined"
                helperText="Optimizasyon webhook'u için benzersiz tanımlayıcı"
              />

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Timeout (ms)"
                    type="number"
                    value={apiSettings.timeout}
                    onChange={handleApiSettingChange('timeout')}
                    variant="outlined"
                    helperText="İstek zaman aşımı süresi"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Yeniden Deneme"
                    type="number"
                    value={apiSettings.retryAttempts}
                    onChange={handleApiSettingChange('retryAttempts')}
                    variant="outlined"
                    helperText="Başarısız isteklerde tekrar sayısı"
                  />
                </Grid>
              </Grid>
              
              {/* API Test Sonucu */}
              {apiTestResult && (
                <Alert 
                  severity={apiTestResult.success ? "success" : "error"} 
                  sx={{ mt: 3, borderRadius: 2 }}
                  icon={apiTestResult.success ? <CheckCircleIcon /> : <ErrorIcon />}
                >
                  <Typography variant="subtitle2" fontWeight="600">
                    {apiTestResult.success ? 'Bağlantı Başarılı' : 'Bağlantı Hatası'}
                  </Typography>
                  <Typography variant="body2">
                    {apiTestResult.message}
                  </Typography>
                </Alert>
              )}

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button 
                  variant="contained" 
                  startIcon={testingApi ? <CircularProgress size={20} color="inherit" /> : <ApiIcon />}
                  onClick={testApiConnection}
                  disabled={testingApi}
                  sx={{ borderRadius: 2 }}
                >
                  {testingApi ? 'Test Ediliyor...' : 'API Test Et'}
                </Button>
                
                <Button 
                  variant="outlined" 
                  startIcon={testingApi ? <CircularProgress size={20} color="inherit" /> : <ApiIcon />}
                  onClick={testN8nWebhook}
                  disabled={testingApi}
                  sx={{ borderRadius: 2 }}
                >
                  n8n Test Et
                </Button>
              </Box>
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
              subheader="Kişiselleştirme ve arayüz ayarları"
            />
            
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={userPreferences.darkMode}
                      onChange={handleUserPreferenceChange('darkMode')}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {userPreferences.darkMode ? <DarkModeIcon /> : <LightModeIcon />}
                      <Typography>Karanlık Tema</Typography>
                    </Box>
                  }
                />
              </Box>
              
              <FormControl fullWidth margin="normal">
                <InputLabel id="language-select-label">Dil Seçimi</InputLabel>
                <Select
                  labelId="language-select-label"
                  value={userPreferences.language}
                  label="Dil Seçimi"
                  onChange={(e) => handleUserPreferenceChange('language')({ target: { value: e.target.value, type: 'text' } } as any)}
                  startAdornment={<LanguageIcon sx={{ mr: 1, color: 'action.active' }} />}
                >
                  <MenuItem value="tr">🇹🇷 Türkçe</MenuItem>
                  <MenuItem value="en">🇺🇸 English</MenuItem>
                </Select>
              </FormControl>
              
              <Box sx={{ mt: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={userPreferences.notificationsEnabled}
                      onChange={handleUserPreferenceChange('notificationsEnabled')}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <NotificationsIcon />
                      <Typography>Bildirimleri Etkinleştir</Typography>
                    </Box>
                  }
                />
              </Box>

              <Box sx={{ mt: 2 }}>
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
            </CardContent>
          </Card>
        </Grid>
        
        {/* Sistem Bilgileri */}
        <Grid item xs={12}>
          <Card sx={{
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
          }}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: '#ff5722' }}>
                  <InfoIcon />
                </Avatar>
              }
              title="Sistem Bilgileri ve Durum"
              subheader="Sunucu durumu, performans metrikleri ve sürüm bilgileri"
            />
            
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
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

                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 3, borderRadius: 2, bgcolor: 'rgba(76, 175, 80, 0.05)' }}>
                    <Typography variant="h6" fontWeight="600" gutterBottom sx={{ color: '#4caf50' }}>
                      Sunucu Durumu
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

                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 3, borderRadius: 2, bgcolor: 'rgba(255, 152, 0, 0.05)' }}>
                    <Typography variant="h6" fontWeight="600" gutterBottom sx={{ color: '#ff9800' }}>
                      Performans
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box>
                        <Typography variant="body2" gutterBottom>
                          <strong>Bellek Kullanımı:</strong> {systemInfo.memoryUsage.toFixed(1)}%
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={systemInfo.memoryUsage} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            bgcolor: 'rgba(255, 152, 0, 0.1)',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: systemInfo.memoryUsage > 80 ? '#f44336' : systemInfo.memoryUsage > 60 ? '#ff9800' : '#4caf50'
                            }
                          }}
                        />
                      </Box>
                      <Typography variant="body2">
                        <strong>Son Güncelleme:</strong> {systemInfo.lastUpdate}
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
              Tüm Ayarları Kaydet
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
