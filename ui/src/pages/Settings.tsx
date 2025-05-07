import { useState } from 'react';
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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Alert
} from '@mui/material';
import { 
  Save as SaveIcon,
  Refresh as ResetIcon,
  Person as PersonIcon,
  VpnKey as KeyIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  Api as ApiIcon
} from '@mui/icons-material';

const Settings = () => {
  const [apiSettings, setApiSettings] = useState({
    apiUrl: 'http://localhost:8000',
    n8nUrl: 'http://localhost:5678',
    webhookId: 'abc123xyz456'
  });
  
  const [userSettings, setUserSettings] = useState({
    darkMode: false,
    language: 'tr',
    notificationsEnabled: true
  });
  
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const handleApiSettingChange = (name: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setApiSettings({
      ...apiSettings,
      [name]: event.target.value
    });
  };
  
  const handleUserSettingChange = (name: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserSettings({
      ...userSettings,
      [name]: name === 'darkMode' || name === 'notificationsEnabled' 
        ? event.target.checked 
        : event.target.value
    });
  };
  
  const handleSaveSettings = () => {
    // Simüle edilmiş kaydetme işlemi
    setSaveSuccess(true);
    
    // 3 saniye sonra başarı mesajını kaldır
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };
  
  // Örnek kullanıcılar
  const users = [
    { id: 'U001', name: 'Admin Kullanıcı', email: 'admin@example.com', role: 'Admin' },
    { id: 'U002', name: 'Planlama Sorumlusu', email: 'planlama@example.com', role: 'Planlamacı' },
    { id: 'U003', name: 'Departman Yöneticisi', email: 'departman@example.com', role: 'Görüntüleyici' }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Ayarlar
      </Typography>
      
      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Ayarlar başarıyla kaydedildi!
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              API Entegrasyon Ayarları
            </Typography>
            
            <TextField
              fullWidth
              label="Optimizasyon API URL"
              value={apiSettings.apiUrl}
              onChange={handleApiSettingChange('apiUrl')}
              margin="normal"
            />
            
            <TextField
              fullWidth
              label="n8n URL"
              value={apiSettings.n8nUrl}
              onChange={handleApiSettingChange('n8nUrl')}
              margin="normal"
            />
            
            <TextField
              fullWidth
              label="Webhook ID"
              value={apiSettings.webhookId}
              onChange={handleApiSettingChange('webhookId')}
              margin="normal"
            />
            
            <Box sx={{ mt: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<ApiIcon />}
              >
                API Bağlantısını Test Et
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Kullanıcı Arayüzü Ayarları
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={userSettings.darkMode}
                  onChange={handleUserSettingChange('darkMode')}
                />
              }
              label="Karanlık Mod"
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel id="language-select-label">Dil</InputLabel>
              <Select
                labelId="language-select-label"
                value={userSettings.language}
                label="Dil"
                onChange={(e) => setUserSettings({...userSettings, language: e.target.value})}
              >
                <MenuItem value="tr">Türkçe</MenuItem>
                <MenuItem value="en">English</MenuItem>
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch
                  checked={userSettings.notificationsEnabled}
                  onChange={handleUserSettingChange('notificationsEnabled')}
                />
              }
              label="Bildirimleri Etkinleştir"
            />
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Kullanıcı Yönetimi
            </Typography>
            
            <List>
              {users.map((user) => (
                <ListItem
                  key={user.id}
                  secondaryAction={
                    <IconButton edge="end" aria-label="delete">
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemIcon>
                    <PersonIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={user.name}
                    secondary={`${user.email} - ${user.role}`}
                  />
                </ListItem>
              ))}
            </List>
            
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              sx={{ mt: 2 }}
            >
              Yeni Kullanıcı Ekle
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Sistem Bilgileri
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body1">
                  Uygulama Sürümü: <strong>0.1.0</strong>
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body1">
                  API Sürümü: <strong>0.2.0</strong>
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body1">
                  n8n Sürümü: <strong>1.91.2</strong>
                </Typography>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="body1">
              Son Güncelleme: <strong>2023-05-08 12:30:45</strong>
            </Typography>
            <Typography variant="body1">
              Sunucu Durumu: <strong style={{ color: 'green' }}>Çalışıyor</strong>
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<SaveIcon />}
              onClick={handleSaveSettings}
              size="large"
            >
              Tüm Ayarları Kaydet
            </Button>
            
            <Button 
              variant="outlined" 
              color="secondary" 
              startIcon={<ResetIcon />}
              size="large"
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
