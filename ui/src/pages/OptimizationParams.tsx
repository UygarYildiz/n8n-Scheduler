import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
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
  Slider,
  FormGroup,
  FormControlLabel,
  Switch,
  Divider,
  Alert,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  IconButton,

  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Save as SaveIcon,
  Refresh as ResetIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckCircleIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';

const OptimizationParams = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState('hastane');
  // Seçilen veri setine göre uygun kural setini otomatik olarak seç
  const [selectedConfig, setSelectedConfig] = useState(() => {
    // Varsayılan veri seti 'hastane' olduğu için, varsayılan kural seti 'hospital_test_config.yaml' olmalı
    return 'hospital_test_config.yaml';
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Hedef fonksiyon ağırlıkları
  const [weights, setWeights] = useState({
    minimize_understaffing: 100,
    minimize_overstaffing: 1,
    maximize_preferences: 2,
    balance_workload: 3,
    maximize_shift_coverage: 50
  });

  // Çözücü parametreleri
  const [solverParams, setSolverParams] = useState({
    time_limit: 60,
    use_mip: false
  });

  const handleWeightChange = (name: string) => (event: Event, newValue: number | number[]) => {
    setWeights({
      ...weights,
      [name]: newValue as number
    });
  };

  const handleSolverParamChange = (name: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSolverParams({
      ...solverParams,
      [name]: name === 'use_mip' ? event.target.checked : Number(event.target.value)
    });
  };



  const handleOptimizationStart = async () => {
    setLoading(true);
    setSuccess(false);
    setError(false);
    setResultMessage('');

    try {
      // Optimizasyon başlatılırken kullanılacak parametreleri konsola yazdır
      console.log('Optimizasyon Başlatılıyor:');
      console.log('Seçilen Veri Seti:', selectedDataset);
      console.log('Seçilen Konfigürasyon:', selectedConfig);
      console.log('Çözücü Parametreleri:', solverParams);

      // API üzerinden n8n webhook'unu tetikle - ağırlıklar konfigürasyondan gelecek
      const result = await api.startOptimization(
        selectedDataset,
        selectedConfig,
        'config-based', // Konfigürasyon dosyasından değerler kullanılacak
        weights, // Mevcut weights kullanılacak ama konfigürasyondan override edilecek
        solverParams
      );

      console.log('Optimizasyon Sonucu:', result);

      // Sonucu kontrol et
      if (result && result.status) {
        // Başarılı sonuç
        setSuccess(true);

        // Çözüm durumuna göre mesaj oluştur
        if (result.status === 'OPTIMAL') {
          setResultMessage('Optimal çözüm bulundu! Çizelge başarıyla oluşturuldu.');
        } else if (result.status === 'FEASIBLE') {
          setResultMessage('Uygun bir çözüm bulundu, ancak optimal olmayabilir. Çizelge oluşturuldu.');
        } else {
          setResultMessage(`Çizelge oluşturuldu. Çözüm durumu: ${result.status}`);
        }

        // Sonuçlar artık backend tarafından otomatik olarak database'e kaydediliyor
        if (result.solution && result.solution.assignments) {
          console.log('Optimizasyon sonuçları backend tarafından database\'e kaydedildi:', {
            status: result.status,
            assignmentsCount: result.solution.assignments.length,
            datasetType: selectedDataset === 'cagri_merkezi' ? 'cagri_merkezi' : 'hastane'
          });
        }

        // Başarılı sonuç için dialog göster
        setShowSuccessDialog(true);
      } else {
        // Başarısız sonuç
        setError(true);
        setResultMessage('Çizelge oluşturma işlemi tamamlandı ancak sonuç alınamadı.');

        // Bildirim mesajını 5 saniye sonra kaldır
        setTimeout(() => {
          setError(false);
          setResultMessage('');
        }, 5000);
      }
    } catch (error) {
      console.error('Optimizasyon başlatma hatası:', error);
      // Hata durumunda kullanıcıya bildirim göster
      setError(true);
      setResultMessage('Çizelge oluşturma sırasında bir hata oluştu. Lütfen tekrar deneyin.');

      // Hata mesajını 5 saniye sonra kaldır
      setTimeout(() => {
        setError(false);
        setResultMessage('');
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  // Veri setleri ve konfigürasyon dosyaları için state tanımlamaları
  const [datasets, setDatasets] = useState([
    { id: 'hastane', name: 'Hastane Veri Seti' },
    { id: 'cagri_merkezi', name: 'Çağrı Merkezi Veri Seti' }
  ]);

  const [configs, setConfigs] = useState([
    { id: 'hospital_test_config.yaml', name: 'Hastane Konfigürasyonu' },
    { id: 'cagri_merkezi_config.yaml', name: 'Çağrı Merkezi Konfigürasyonu' }
  ]);

  // Sayfa yüklendiğinde veri setleri ve konfigürasyon dosyalarını API'den al
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Veri setlerini al
        const datasetsData = await api.getDatasets();
        setDatasets(datasetsData);

        // Konfigürasyon dosyalarını al
        const configsData = await api.getConfigurations();
        setConfigs(configsData);
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
      }
    };

    fetchData();
  }, []);

  // Başarılı çizelgeleme sonrası dialog'u kapat
  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false);
    setSuccess(false);
    setResultMessage('');
  };

  // Çizelge görüntüleme sayfasına git
  const handleViewSchedule = () => {
    setShowSuccessDialog(false);
    setSuccess(false);
    setResultMessage('');
    navigate('/schedule-view');
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
            Optimizasyon
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
            Konfigürasyona göre çizelge oluşturun
          </Typography>
        </Box>
      </Box>

      {/* Başarılı çizelgeleme sonrası dialog */}
      <Dialog
        open={showSuccessDialog}
        onClose={handleCloseSuccessDialog}
        aria-labelledby="success-dialog-title"
        aria-describedby="success-dialog-description"
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxWidth: 500
          }
        }}
      >
        <DialogTitle id="success-dialog-title" sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon sx={{ color: 'success.main' }} />
            <Typography variant="h6" fontWeight="bold">
              Çizelge Başarıyla Oluşturuldu
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="success-dialog-description" sx={{ mb: 2 }}>
            {resultMessage}
          </DialogContentText>
          <DialogContentText>
            Oluşturulan çizelgeyi görüntülemek için "Çizelgeyi Görüntüle" butonuna tıklayabilirsiniz.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleCloseSuccessDialog}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Kapat
          </Button>
          <Button
            onClick={handleViewSchedule}
            variant="contained"
            startIcon={<CalendarIcon />}
            sx={{ borderRadius: 2 }}
            autoFocus
          >
            Çizelgeyi Görüntüle
          </Button>
        </DialogActions>
      </Dialog>

      {success && (
        <Alert
          severity="success"
          variant="filled"
          sx={{
            mb: 4,
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)',
            '& .MuiAlert-icon': {
              fontSize: '1.5rem'
            }
          }}
        >
          <Typography variant="subtitle1" fontWeight="600">
            Çizelge oluşturma işlemi başarılı!
          </Typography>
          <Typography variant="body2">
            {resultMessage || 'Çizelge başarıyla oluşturuldu. Sonuçları Sonuçlar sayfasından görüntüleyebilirsiniz.'}
          </Typography>
        </Alert>
      )}

      {error && (
        <Alert
          severity="error"
          variant="filled"
          sx={{
            mb: 4,
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(211, 47, 47, 0.2)',
            '& .MuiAlert-icon': {
              fontSize: '1.5rem'
            }
          }}
        >
          <Typography variant="subtitle1" fontWeight="600">
            Çizelge oluşturma işlemi başarısız!
          </Typography>
          <Typography variant="body2">
            {resultMessage || 'Çizelge oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.'}
          </Typography>
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <Card sx={{
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            height: '100%',
            overflow: 'hidden'
          }}>
            <Box sx={{
              p: 3,
              background: `linear-gradient(45deg, rgba(25, 118, 210, 0.8), rgba(25, 118, 210, 0.6))`,
              color: 'white'
            }}>
              <Typography variant="h6" fontWeight="bold">
                Çizelge Oluşturulacak Kurum
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                Çizelge oluşturmak istediğiniz kurumu seçin
              </Typography>
            </Box>

            <Box sx={{ p: 3 }}>
              <Box sx={{
                mb: 4,
                p: 3,
                bgcolor: 'rgba(25, 118, 210, 0.03)',
                borderRadius: 3,
                border: '1px solid rgba(25, 118, 210, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}>
                <BusinessIcon sx={{ color: 'primary.main', fontSize: '2rem' }} />
                <Box>
                  <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                    Kurum Seçimi
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Seçtiğiniz kuruma ait çalışan ve vardiya bilgileri kullanılarak çizelge oluşturulacaktır.
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2} sx={{ mb: 4 }}>
                {datasets.map((dataset) => (
                  <Grid item xs={12} sm={6} key={dataset.id}>
                    <Card
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: selectedDataset === dataset.id ? '2px solid #1976d2' : '1px solid rgba(0,0,0,0.08)',
                        boxShadow: selectedDataset === dataset.id ? '0 4px 12px rgba(25, 118, 210, 0.15)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: '#1976d2',
                          boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)'
                        }
                      }}
                      onClick={() => {
                        setSelectedDataset(dataset.id);
                        // Kurum seçimine göre uygun kural setini otomatik olarak seç
                        if (dataset.id === 'hastane') {
                          setSelectedConfig('hospital_test_config.yaml');
                        } else if (dataset.id === 'cagri_merkezi') {
                          setSelectedConfig('cagri_merkezi_config.yaml');
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <BusinessIcon sx={{
                          color: selectedDataset === dataset.id ? 'primary.main' : 'text.secondary',
                          fontSize: '2rem',
                          mr: 2
                        }} />
                        <Box>
                          <Typography variant="subtitle1" fontWeight="600">
                            {dataset.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {dataset.id === 'hastane' ? 'Sağlık personeli çizelgeleme' : 'Müşteri temsilcisi çizelgeleme'}
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Box sx={{
                p: 3,
                bgcolor: 'rgba(25, 118, 210, 0.03)',
                borderRadius: 3,
                border: '1px solid rgba(25, 118, 210, 0.1)'
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight="600">
                    Seçilen Kural Seti
                  </Typography>
                  <Tooltip title="Kural seti, çizelgeleme sırasında uygulanacak kısıtları ve gereksinimleri içerir">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" sx={{ color: 'primary.main' }} />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Box sx={{
                  p: 2,
                  bgcolor: 'rgba(25, 118, 210, 0.05)',
                  borderRadius: 2,
                  border: '1px solid rgba(25, 118, 210, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}>
                  <CheckCircleIcon sx={{ color: 'primary.main' }} />
                  <Box>
                    <Typography variant="subtitle2" fontWeight="600">
                      {configs.find(c => c.id === selectedConfig)?.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Seçilen kuruma uygun kural seti otomatik olarak ayarlandı
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="text"
                  startIcon={<SettingsIcon />}
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  sx={{ color: 'text.secondary' }}
                >
                  {showAdvanced ? 'Gelişmiş Ayarları Gizle' : 'Gelişmiş Ayarlar'}
                </Button>
              </Box>

              {showAdvanced && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                    Webhook URL (Gelişmiş)
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Bu URL, n8n veya diğer sistemlerden çizelgeleme sürecini başlatmak için kullanılabilir
                  </Typography>
                  <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    value={`/webhook/optimization?veriSeti=${selectedDataset}&kurallar=${selectedConfig}`}
                    InputProps={{
                      readOnly: true,
                      sx: {
                        borderRadius: 2,
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        bgcolor: 'rgba(0,0,0,0.02)'
                      }
                    }}
                  />
                </Box>
              )}
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            height: '100%',
            overflow: 'hidden'
          }}>
            <Box sx={{
              p: 3,
              background: `linear-gradient(45deg, rgba(76, 175, 80, 0.8), rgba(76, 175, 80, 0.6))`,
              color: 'white'
            }}>
              <Typography variant="h6" fontWeight="bold">
                Konfigürasyon Durumu
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                Mevcut çizelgeleme ayarları ve kuralları
              </Typography>
            </Box>

            <Box sx={{ p: 3 }}>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  📋 Konfigürasyon Kontrol Paneli
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Çizelgeleme kuralları ve optimizasyon hedefleri önceden tanımlanmıştır. 
                  Değişiklik yapmak istiyorsanız konfigürasyon sayfasını kullanın.
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<SettingsIcon />}
                  onClick={() => navigate('/dataset-config')}
                  sx={{ 
                    bgcolor: 'primary.main',
                    '&:hover': { bgcolor: 'primary.dark' }
                  }}
                >
                  Konfigürasyonu Düzenle
                </Button>
              </Alert>

              <Box sx={{
                p: 3,
                borderRadius: 3,
                border: '1px solid rgba(76, 175, 80, 0.2)',
                bgcolor: 'rgba(76, 175, 80, 0.03)',
                mb: 3
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CheckCircleIcon sx={{ color: '#4caf50', mr: 1 }} />
                  <Typography variant="subtitle2" fontWeight="600">
                    Aktif Konfigürasyon
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  <strong>Kural Seti:</strong> {configs.find(c => c.id === selectedConfig)?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Durum:</strong> Çizelgeleme için hazır ✅
                </Typography>
              </Box>

              {showAdvanced && (
                <>
                  <Divider sx={{ my: 3 }}>
                    <Typography variant="caption" color="text.secondary">
                      Gelişmiş Çözücü Ayarları
                    </Typography>
                  </Divider>

                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                      Maksimum İşlem Süresi
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                      Çizelge hesaplama süresi limiti (saniye)
                    </Typography>

                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={9}>
                        <Slider
                          value={solverParams.time_limit}
                          onChange={(e, newValue) => setSolverParams({...solverParams, time_limit: newValue as number})}
                          min={10}
                          max={300}
                          step={10}
                          marks={[
                            { value: 10, label: '10s' },
                            { value: 60, label: '1dk' },
                            { value: 180, label: '3dk' },
                            { value: 300, label: '5dk' }
                          ]}
                          sx={{
                            color: '#4caf50',
                            '& .MuiSlider-thumb': {
                              width: 16,
                              height: 16,
                              '&:hover, &.Mui-focusVisible': {
                                boxShadow: '0 0 0 8px rgba(76, 175, 80, 0.16)'
                              }
                            },
                            '& .MuiSlider-rail': {
                              opacity: 0.3
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={3}>
                        <TextField
                          value={solverParams.time_limit}
                          onChange={handleSolverParamChange('time_limit')}
                          type="number"
                          variant="outlined"
                          size="small"
                          InputProps={{
                            inputProps: { min: 10, max: 3600 },
                            endAdornment: <Typography variant="caption" sx={{ ml: 1 }}>sn</Typography>,
                            sx: { borderRadius: 2 }
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  <Box sx={{
                    p: 3,
                    borderRadius: 3,
                    border: '1px solid rgba(76, 175, 80, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="600">
                        Gelişmiş Optimizasyon
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Daha kapsamlı arama algoritması (daha yavaş)
                      </Typography>
                    </Box>
                    <Switch
                      checked={solverParams.use_mip}
                      onChange={handleSolverParamChange('use_mip')}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#4caf50',
                          '&:hover': {
                            backgroundColor: 'rgba(76, 175, 80, 0.08)'
                          }
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#4caf50'
                        }
                      }}
                    />
                  </Box>
                </>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Çizelgeleme Öncelikleri kartı kaldırıldı */}

        <Grid item xs={12}>
          <Card sx={{
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            p: 4,
            textAlign: 'center',
            background: `linear-gradient(to bottom, rgba(255,255,255,0), rgba(76, 175, 80, 0.05))`,
          }}>
            <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Çizelge Oluşturmaya Hazırsınız
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Seçtiğiniz kurum için önceden tanımlanmış konfigürasyon kullanılarak çizelge oluşturulacak.
              </Typography>

              <Box sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: 'rgba(76, 175, 80, 0.08)',
                mb: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}>
                <Box sx={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  bgcolor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <InfoIcon sx={{ color: '#4caf50' }} />
                </Box>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                    Özet Bilgi
                  </Typography>
                  <Typography variant="body2">
                    <strong>Kurum:</strong> {datasets.find(d => d.id === selectedDataset)?.name} &nbsp;|&nbsp;
                    <strong>Kural Seti:</strong> {configs.find(c => c.id === selectedConfig)?.name} &nbsp;|&nbsp;
                    <strong>Çözücü Süresi:</strong> {solverParams.time_limit} saniye
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <StartIcon />}
                  onClick={handleOptimizationStart}
                  disabled={loading}
                  size="large"
                  sx={{
                    py: 2,
                    px: 6,
                    borderRadius: 3,
                    fontSize: '1.1rem',
                    background: `linear-gradient(45deg, ${loading ? '#9e9e9e' : '#4caf50'}, ${loading ? '#bdbdbd' : '#66bb6a'})`,
                    boxShadow: loading ? 'none' : '0 4px 14px rgba(76, 175, 80, 0.4)',
                    '&:hover': {
                      boxShadow: '0 6px 20px rgba(76, 175, 80, 0.6)'
                    },
                    minWidth: '220px'
                  }}
                >
                  {loading ? (
                    <>
                      <span style={{ marginRight: '8px' }}>İşleniyor</span>
                      <CircularProgress size={20} color="inherit" />
                    </>
                  ) : (
                    'Çizelge Oluştur'
                  )}
                </Button>
              </Box>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button
                  variant="text"
                  startIcon={<SaveIcon />}
                  size="small"
                  sx={{ color: 'text.secondary' }}
                >
                  Ayarları Kaydet
                </Button>

                <Button
                  variant="text"
                  startIcon={<ResetIcon />}
                  size="small"
                  sx={{ color: 'text.secondary' }}
                >
                  Varsayılanlara Dön
                </Button>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OptimizationParams;
