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
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Folder as FolderIcon,
  Description as FileIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  CloudUpload as UploadIcon,
  Help as HelpIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { api } from '../services/api';

// Veri seti ve konfigürasyon tipleri
interface Dataset {
  id: string;
  name: string;
  path: string;
}

interface Configuration {
  id: string;
  name: string;
  path: string;
}

// Yüklenen dosya bilgisi
interface UploadedFile {
  fileType: string;
  fileName: string; // Gerçek dosya adı
  uploadDate: Date;
  status: 'success' | 'error';
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// TabPanel yerine doğrudan koşullu render kullanacağız

const DatasetConfig = () => {
  // State tanımlamaları
  const [tabValue, setTabValue] = useState(0);
  const [selectedDataset, setSelectedDataset] = useState('');
  const [selectedConfig, setSelectedConfig] = useState('');
  const [configContent, setConfigContent] = useState('');

  // API verilerini tutacak state'ler
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [configs, setConfigs] = useState<Configuration[]>([]);

  // Yüklenen dosyaları veri setine göre takip etmek için state (dataset -> fileType -> UploadedFile)
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, Record<string, UploadedFile>>>({});

  // Yükleme ve hata durumları için state'ler
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // API'den veri setlerini ve konfigürasyonları çek
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Veri setlerini çek
        const datasetsResponse = await api.getDatasets();
        setDatasets(datasetsResponse);

        // İlk veri setini seç (eğer varsa)
        if (datasetsResponse.length > 0 && !selectedDataset) {
          setSelectedDataset(datasetsResponse[0].id);
        }

        // Konfigürasyonları çek
        const configsResponse = await api.getConfigurations();
        setConfigs(configsResponse);

        // İlk konfigürasyonu seç (eğer varsa)
        if (configsResponse.length > 0 && !selectedConfig) {
          setSelectedConfig(configsResponse[0].id);
        }

        // LocalStorage'dan yüklenen dosya bilgilerini yükle
        try {
          const savedFiles = localStorage.getItem('uploadedFiles');
          if (savedFiles) {
            const parsedFiles = JSON.parse(savedFiles);
            // Tarih string'lerini Date objelerine dönüştür (nested structure için)
            Object.keys(parsedFiles).forEach(datasetKey => {
              if (parsedFiles[datasetKey] && typeof parsedFiles[datasetKey] === 'object') {
                Object.keys(parsedFiles[datasetKey]).forEach(fileTypeKey => {
                  if (parsedFiles[datasetKey][fileTypeKey]?.uploadDate) {
                    parsedFiles[datasetKey][fileTypeKey].uploadDate = new Date(parsedFiles[datasetKey][fileTypeKey].uploadDate);
                  }
                });
              }
            });
            setUploadedFiles(parsedFiles);
          }
        } catch (storageErr) {
          console.error('LocalStorage okuma hatası:', storageErr);
        }
      } catch (err) {
        console.error('Veri çekme hatası:', err);
        setError('Veri setleri ve konfigürasyonlar yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Seçilen konfigürasyon değiştiğinde içeriğini çek
  useEffect(() => {
    const fetchConfigContent = async () => {
      if (!selectedConfig) return;

      setLoading(true);
      try {
        const content = await api.getConfigurationContent(selectedConfig);
        setConfigContent(content);
      } catch (err) {
        console.error('Konfigürasyon içeriği çekme hatası:', err);
        setError('Konfigürasyon içeriği yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchConfigContent();
  }, [selectedConfig]);

  // Konfigürasyon içeriğini kaydet
  const handleSaveConfig = async () => {
    setLoading(true);
    try {
      await api.saveConfigurationContent(selectedConfig, configContent);

      setSnackbar({
        open: true,
        message: 'Konfigürasyon başarıyla kaydedildi',
        severity: 'success'
      });
    } catch (err) {
      console.error('Konfigürasyon kaydetme hatası:', err);
      setSnackbar({
        open: true,
        message: 'Konfigürasyon kaydedilirken bir hata oluştu',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Dosya türüne göre insan tarafından okunabilir isim döndürür
  const getReadableFileName = (fileType: string): string => {
    const fileTypeMap: Record<string, string> = {
      'employees.csv': 'Çalışanlar',
      'shifts.csv': 'Vardiyalar',
      'skills.csv': 'Yetkinlikler',
      'availability.csv': 'Uygunluklar',
      'preferences.csv': 'Tercihler'
    };

    return fileTypeMap[fileType] || fileType;
  };

  // Seçili veri seti için dosya durumunu döndürür
  const getFileStatus = (fileType: string): UploadedFile | null => {
    return uploadedFiles[selectedDataset]?.[fileType] || null;
  };

  // Yüklenen dosya bilgilerini localStorage'a kaydet
  const saveUploadedFilesToLocalStorage = (files: Record<string, Record<string, UploadedFile>>) => {
    try {
      localStorage.setItem('uploadedFiles', JSON.stringify(files));
    } catch (err) {
      console.error('LocalStorage kaydetme hatası:', err);
    }
  };

  // Dosya yükleme işlevi
  const handleFileUpload = (fileType: string) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv';

    fileInput.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      if (!target.files || target.files.length === 0) return;

      const file = target.files[0];
      setLoading(true);

      try {
        const response = await api.uploadFile(selectedDataset, fileType, file);

        // Yeni dosya bilgisini veri setine göre oluştur
        const newUploadedFiles = {
          ...uploadedFiles,
          [selectedDataset]: {
            ...uploadedFiles[selectedDataset],
            [fileType]: {
              fileType,
              fileName: file.name, // Gerçek dosya adını kaydet
              uploadDate: new Date(),
              status: 'success' as 'success'
            }
          }
        };

        // State'i güncelle
        setUploadedFiles(newUploadedFiles);

        // LocalStorage'a kaydet
        saveUploadedFilesToLocalStorage(newUploadedFiles);

        const readableFileName = getReadableFileName(fileType);

        setSnackbar({
          open: true,
          message: response.message || `${readableFileName} dosyası başarıyla yüklendi`,
          severity: 'success'
        });
      } catch (err) {
        console.error('Dosya yükleme hatası:', err);

        // Hata durumunda da dosya bilgisini veri setine göre güncelle
        const newUploadedFiles = {
          ...uploadedFiles,
          [selectedDataset]: {
            ...uploadedFiles[selectedDataset],
            [fileType]: {
              fileType,
              fileName: file.name, // Gerçek dosya adını kaydet
              uploadDate: new Date(),
              status: 'error' as 'error'
            }
          }
        };

        // State'i güncelle
        setUploadedFiles(newUploadedFiles);

        // LocalStorage'a kaydet
        saveUploadedFilesToLocalStorage(newUploadedFiles);

        const readableFileName = getReadableFileName(fileType);

        setSnackbar({
          open: true,
          message: err instanceof Error ? err.message : `${readableFileName} dosyası yüklenirken bir hata oluştu`,
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    // Dosya seçme dialog'unu aç
    fileInput.click();
  };

  // Snackbar'ı kapat
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  return (
    <Box>
      {/* Snackbar bildirimi */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Box sx={{ mb: 5, textAlign: 'center', position: 'relative' }}>
        <Box sx={{
          maxWidth: '800px',
          mx: 'auto',
          mb: 4,
          pb: 3,
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
        }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom component="div">
            Veri Kaynakları ve Kural Yönetimi
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }} component="div">
            Kurumunuza özel veri kaynaklarını ve çizelgeleme kurallarını yönetin
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
            <Chip
              icon={<InfoIcon />}
              label="Bu sayfa, sistem yöneticileri için tasarlanmıştır"
              color="primary"
              variant="outlined"
            />
            <Tooltip title="Veri kaynaklarını ve çizelgeleme kurallarını güncellemek için bu sayfayı kullanabilirsiniz. Yapılan değişiklikler, çizelgeleme sonuçlarını doğrudan etkileyecektir.">
              <Chip
                icon={<HelpIcon />}
                label="Yardım"
                color="secondary"
                variant="outlined"
                onClick={() => {
                  setSnackbar({
                    open: true,
                    message: 'Yardım: Veri kaynaklarını ve çizelgeleme kurallarını güncellemek için bu sayfayı kullanabilirsiniz.',
                    severity: 'info'
                  });
                }}
              />
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* Hata mesajı */}
      {error && (
        <Box sx={{ mb: 4 }}>
          <Alert severity="error">
            {error}
          </Alert>
        </Box>
      )}

      {/* Yükleniyor göstergesi */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <CircularProgress />
        </Box>
      )}

      <Box sx={{
        borderRadius: 2,
        bgcolor: 'background.paper',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        mb: 4
      }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="veri yönetimi sekmeleri"
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              py: 2,
              fontWeight: 600,
              fontSize: '1rem'
            },
            '& .Mui-selected': {
              color: 'primary.main',
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0'
            }
          }}
        >
          <Tab label="Kurumsal Veri Kaynakları" />
          <Tab label="Çizelgeleme Kuralları" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Box sx={{ padding: '24px' }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
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
                  Kurumsal Veri Kaynakları
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                  Çizelgeleme için kullanılacak veri kaynaklarını seçin
                </Typography>
              </Box>

              <List sx={{ p: 0 }}>
                {datasets.map((dataset, index) => (
                  <ListItem
                    key={dataset.id}
                    onClick={() => setSelectedDataset(dataset.id)}
                    sx={{
                      cursor: 'pointer',
                      py: 2,
                      px: 3,
                      borderBottom: index < datasets.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                      bgcolor: selectedDataset === dataset.id ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                      '&:hover': {
                        bgcolor: selectedDataset === dataset.id ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0,0,0,0.02)'
                      }
                    }}
                  >
                    <ListItemIcon>
                      <FolderIcon sx={{ color: 'primary.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography variant="subtitle1" fontWeight="600">{dataset.name}</Typography>}
                      secondary={
                        <Chip
                          size="small"
                          label={dataset.id === "hastane" ? "Sağlık Kurumu" : "Çağrı Merkezi"}
                          color={dataset.id === "hastane" ? "success" : "info"}
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      }
                      secondaryTypographyProps={{ component: 'div' }}
                    />
                  </ListItem>
                ))}
              </List>

              <Box sx={{ p: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<InfoIcon />}
                  fullWidth
                  sx={{
                    borderRadius: 2,
                    py: 1.2,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                  }}
                  onClick={() => {
                    setSnackbar({
                      open: true,
                      message: 'Yeni veri kaynağı eklemek için sistem yöneticinize başvurun',
                      severity: 'info'
                    });
                  }}
                >
                  Veri Kaynakları Hakkında Bilgi
                </Button>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              height: '100%',
              overflow: 'hidden'
            }}>
              <Box sx={{
                p: 3,
                background: `linear-gradient(45deg, rgba(25, 118, 210, 0.05), rgba(25, 118, 210, 0.02))`,
                borderBottom: '1px solid rgba(0,0,0,0.05)'
              }}>
                <Typography variant="h6" fontWeight="bold">
                  {datasets.find(d => d.id === selectedDataset)?.name || 'Veri Seti'} Veri Dosyaları
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Çizelgeleme için gerekli veri dosyalarını güncelleyin
                </Typography>
              </Box>

              <Box sx={{ p: 3 }}>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Veri Dosyaları Hakkında
                  </Typography>
                  <Typography variant="body2">
                    Bu bölümde, çizelgeleme algoritmasının kullanacağı veri dosyalarını güncelleyebilirsiniz.
                    Dosyaları güncellemek için "Yükle" butonuna tıklayın ve bilgisayarınızdan ilgili CSV dosyasını seçin.
                  </Typography>
                </Alert>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Chip
                    label={selectedDataset === "hastane" ? "Sağlık Kurumu" : "Çağrı Merkezi"}
                    color={selectedDataset === "hastane" ? "success" : "info"}
                    sx={{ mr: 2 }}
                  />
                  <Typography variant="h6" fontWeight="600">
                    {datasets.find(d => d.id === selectedDataset)?.name || 'Veri Seti'}
                  </Typography>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{
                      p: 3,
                      borderRadius: 2,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      mb: 3,
                      border: '1px solid rgba(25, 118, 210, 0.1)',
                      bgcolor: 'rgba(25, 118, 210, 0.02)'
                    }}>
                      <Typography variant="h6" fontWeight="600" gutterBottom color="primary">
                        Temel Veri Dosyaları
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                        Çizelgeleme için gerekli temel veri dosyaları
                  </Typography>

                      <Box sx={{ mt: 2 }}>
                      <Card sx={{
                        p: 2,
                        borderRadius: 2,
                        boxShadow: 'none',
                        border: '1px solid rgba(0,0,0,0.08)',
                          mb: 2,
                          transition: 'all 0.2s',
                          '&:hover': {
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            borderColor: 'primary.main'
                          }
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <FileIcon sx={{ color: 'primary.main', mr: 1.5 }} />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle2" fontWeight="600">
                                Çalışanlar
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Çalışan bilgileri, roller ve departmanlar
                            </Typography>
                          </Box>
                            {getFileStatus('employees.csv')?.status === 'success' ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <Button
                              variant="outlined"
                              size="small"
                              color="success"
                              startIcon={<CheckCircleIcon />}
                              sx={{ borderRadius: 2, mb: 1 }}
                              onClick={() => handleFileUpload('employees.csv')}
                            >
                              Yüklendi
                            </Button>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              {getFileStatus('employees.csv')?.fileName || 'employees.csv'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              {getFileStatus('employees.csv')?.uploadDate?.toLocaleDateString('tr-TR')}
                            </Typography>
                          </Box>
                            ) : (
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<UploadIcon />}
                                sx={{ borderRadius: 2 }}
                                onClick={() => handleFileUpload('employees.csv')}
                              >
                                Yükle
                              </Button>
                            )}
                        </Box>
                      </Card>

                      <Card sx={{
                        p: 2,
                        borderRadius: 2,
                        boxShadow: 'none',
                        border: '1px solid rgba(0,0,0,0.08)',
                          mb: 2,
                          transition: 'all 0.2s',
                          '&:hover': {
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            borderColor: 'primary.main'
                          }
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <FileIcon sx={{ color: 'primary.main', mr: 1.5 }} />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle2" fontWeight="600">
                                Vardiyalar
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Vardiya tanımları ve zaman aralıkları
                            </Typography>
                          </Box>
                            {getFileStatus('shifts.csv')?.status === 'success' ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <Button
                              variant="outlined"
                              size="small"
                              color="success"
                              startIcon={<CheckCircleIcon />}
                              sx={{ borderRadius: 2, mb: 1 }}
                              onClick={() => handleFileUpload('shifts.csv')}
                            >
                              Yüklendi
                            </Button>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              {getFileStatus('shifts.csv')?.fileName || 'shifts.csv'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              {getFileStatus('shifts.csv')?.uploadDate?.toLocaleDateString('tr-TR')}
                            </Typography>
                          </Box>
                            ) : (
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<UploadIcon />}
                                sx={{ borderRadius: 2 }}
                                onClick={() => handleFileUpload('shifts.csv')}
                              >
                                Yükle
                              </Button>
                            )}
                        </Box>
                      </Card>
                      </Box>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card sx={{
                      p: 3,
                      borderRadius: 2,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      mb: 3,
                      border: '1px solid rgba(103, 58, 183, 0.1)',
                      bgcolor: 'rgba(103, 58, 183, 0.02)'
                    }}>
                      <Typography variant="h6" fontWeight="600" gutterBottom sx={{ color: '#673ab7' }}>
                        Ek Veri Dosyaları
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Çizelgeleme kalitesini artıran ek veri dosyaları
                      </Typography>

                      <Box sx={{ mt: 2 }}>
                      <Card sx={{
                        p: 2,
                        borderRadius: 2,
                        boxShadow: 'none',
                          border: '1px solid rgba(0,0,0,0.08)',
                          mb: 2,
                          transition: 'all 0.2s',
                          '&:hover': {
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            borderColor: '#673ab7'
                          }
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <FileIcon sx={{ color: '#673ab7', mr: 1.5 }} />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle2" fontWeight="600">
                                Yetkinlikler
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Çalışan yetkinlikleri ve uzmanlık alanları
                            </Typography>
                          </Box>
                            {getFileStatus('skills.csv')?.status === 'success' ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <Button
                              variant="outlined"
                              size="small"
                              color="success"
                              startIcon={<CheckCircleIcon />}
                              sx={{ borderRadius: 2, mb: 1, borderColor: '#673ab7', color: '#673ab7' }}
                              onClick={() => handleFileUpload('skills.csv')}
                            >
                              Yüklendi
                            </Button>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              {getFileStatus('skills.csv')?.fileName || 'skills.csv'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              {getFileStatus('skills.csv')?.uploadDate?.toLocaleDateString('tr-TR')}
                            </Typography>
                          </Box>
                            ) : (
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<UploadIcon />}
                                sx={{ borderRadius: 2, bgcolor: '#673ab7', '&:hover': { bgcolor: '#5e35b1' } }}
                                onClick={() => handleFileUpload('skills.csv')}
                              >
                                Yükle
                              </Button>
                            )}
                        </Box>
                      </Card>

                      <Card sx={{
                        p: 2,
                        borderRadius: 2,
                        boxShadow: 'none',
                        border: '1px solid rgba(0,0,0,0.08)',
                          mb: 2,
                          transition: 'all 0.2s',
                          '&:hover': {
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            borderColor: '#673ab7'
                          }
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <FileIcon sx={{ color: '#673ab7', mr: 1.5 }} />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle2" fontWeight="600">
                                Uygunluklar
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Çalışan uygunluk bilgileri ve izinler
                            </Typography>
                          </Box>
                            {getFileStatus('availability.csv')?.status === 'success' ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <Button
                              variant="outlined"
                              size="small"
                              color="success"
                              startIcon={<CheckCircleIcon />}
                              sx={{ borderRadius: 2, mb: 1, borderColor: '#673ab7', color: '#673ab7' }}
                              onClick={() => handleFileUpload('availability.csv')}
                            >
                              Yüklendi
                            </Button>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              {getFileStatus('availability.csv')?.fileName || 'availability.csv'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              {getFileStatus('availability.csv')?.uploadDate?.toLocaleDateString('tr-TR')}
                            </Typography>
                          </Box>
                            ) : (
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<UploadIcon />}
                                sx={{ borderRadius: 2, bgcolor: '#673ab7', '&:hover': { bgcolor: '#5e35b1' } }}
                                onClick={() => handleFileUpload('availability.csv')}
                              >
                                Yükle
                              </Button>
                            )}
                        </Box>
                      </Card>

                      <Card sx={{
                        p: 2,
                        borderRadius: 2,
                        boxShadow: 'none',
                        border: '1px solid rgba(0,0,0,0.08)',
                          transition: 'all 0.2s',
                          '&:hover': {
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            borderColor: '#673ab7'
                          }
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <FileIcon sx={{ color: '#673ab7', mr: 1.5 }} />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle2" fontWeight="600">
                                Tercihler
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Çalışan vardiya tercihleri
                            </Typography>
                          </Box>
                            {getFileStatus('preferences.csv')?.status === 'success' ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <Button
                              variant="outlined"
                              size="small"
                              color="success"
                              startIcon={<CheckCircleIcon />}
                              sx={{ borderRadius: 2, mb: 1, borderColor: '#673ab7', color: '#673ab7' }}
                              onClick={() => handleFileUpload('preferences.csv')}
                            >
                              Yüklendi
                            </Button>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              {getFileStatus('preferences.csv')?.fileName || 'preferences.csv'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              {getFileStatus('preferences.csv')?.uploadDate?.toLocaleDateString('tr-TR')}
                            </Typography>
                          </Box>
                            ) : (
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<UploadIcon />}
                                sx={{ borderRadius: 2, bgcolor: '#673ab7', '&:hover': { bgcolor: '#5e35b1' } }}
                                onClick={() => handleFileUpload('preferences.csv')}
                              >
                                Yükle
                              </Button>
                            )}
                          </Box>
                        </Card>
                        </Box>
                      </Card>
                    </Grid>
                  </Grid>

                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                  <Card sx={{
                    p: 3,
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    border: '1px solid rgba(0,0,0,0.05)',
                    width: '100%',
                    bgcolor: 'rgba(76, 175, 80, 0.05)'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <InfoIcon sx={{ color: 'success.main', mr: 1.5 }} />
                      <Typography variant="subtitle1" fontWeight="600" color="success.main">
                        Veri Dosyaları Hakkında Bilgi
                      </Typography>
                    </Box>
                    <Typography variant="body2" paragraph>
                      Veri dosyalarını güncelledikten sonra, çizelgeleme işlemi sırasında yeni veriler otomatik olarak kullanılacaktır.
                      Dosya formatları hakkında daha fazla bilgi için sistem yöneticinize başvurun.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button
                    variant="contained"
                        color="success"
                        startIcon={<InfoIcon />}
                    sx={{
                      borderRadius: 2,
                      py: 1.2,
                      px: 3
                    }}
                        onClick={() => {
                          setSnackbar({
                            open: true,
                            message: 'Veri dosyaları başarıyla güncellendi. Çizelgeleme işlemi sırasında yeni veriler kullanılacaktır.',
                            severity: 'success'
                          });
                        }}
                      >
                        Veri Dosyaları Hakkında Yardım
                  </Button>
                    </Box>
                  </Card>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
        </Box>
      )}

      {tabValue === 1 && (
        <Box sx={{ padding: '24px' }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Card sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              height: '100%',
              overflow: 'hidden'
            }}>
              <Box sx={{
                p: 3,
                background: `linear-gradient(45deg, rgba(103, 58, 183, 0.8), rgba(103, 58, 183, 0.6))`,
                color: 'white'
              }}>
                <Typography variant="h6" fontWeight="bold">
                  Çizelgeleme Kuralları
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                  Kurumunuza özel çizelgeleme kurallarını yönetin
                </Typography>
              </Box>

              <List sx={{ p: 0 }}>
                {configs.map((config, index) => (
                  <ListItem
                    key={config.id}
                    onClick={() => setSelectedConfig(config.id)}
                    sx={{
                      cursor: 'pointer',
                      py: 2,
                      px: 3,
                      borderBottom: index < configs.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                      bgcolor: selectedConfig === config.id ? 'rgba(103, 58, 183, 0.08)' : 'transparent',
                      '&:hover': {
                        bgcolor: selectedConfig === config.id ? 'rgba(103, 58, 183, 0.12)' : 'rgba(0,0,0,0.02)'
                      }
                    }}
                  >
                    <ListItemIcon>
                      <FileIcon sx={{ color: '#673ab7' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography variant="subtitle1" fontWeight="600">{config.name}</Typography>}
                      secondary={
                        <Chip
                          size="small"
                          label={config.id.includes("hospital") ? "Sağlık Kurumu" : "Çağrı Merkezi"}
                          color={config.id.includes("hospital") ? "success" : "info"}
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      }
                      secondaryTypographyProps={{ component: 'div' }}
                    />
                  </ListItem>
                ))}
              </List>

              <Box sx={{ p: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<InfoIcon />}
                  fullWidth
                  sx={{
                    borderRadius: 2,
                    py: 1.2,
                    bgcolor: '#673ab7',
                    '&:hover': {
                      bgcolor: '#5e35b1'
                    },
                    boxShadow: '0 4px 10px rgba(103, 58, 183, 0.3)'
                  }}
                  onClick={() => {
                    setSnackbar({
                      open: true,
                      message: 'Kural setleri hakkında bilgi almak için sistem yöneticinize başvurun',
                      severity: 'info'
                    });
                  }}
                >
                  Kural Setleri Hakkında Bilgi
                </Button>
              </Box>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card sx={{
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              height: '100%',
              overflow: 'hidden'
            }}>
              <Box sx={{
                p: 3,
                background: `linear-gradient(45deg, rgba(103, 58, 183, 0.05), rgba(103, 58, 183, 0.02))`,
                borderBottom: '1px solid rgba(0,0,0,0.05)'
              }}>
                <Typography variant="h6" fontWeight="bold">
                  {configs.find(c => c.id === selectedConfig)?.name || 'Konfigürasyon'} Kuralları
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Çizelgeleme kurallarını ve optimizasyon parametrelerini düzenleyin
                </Typography>
              </Box>

              <Box sx={{ p: 3 }}>
                <Alert severity="info" sx={{ mb: 4 }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Kural Dosyası Hakkında
                  </Typography>
                  <Typography variant="body2">
                    Bu dosya, çizelgeleme algoritmasının kullanacağı tüm kuralları ve parametreleri içerir.
                    Minimum personel gereksinimleri, vardiya kısıtlamaları ve optimizasyon hedefleri burada tanımlanır.
                  </Typography>
                </Alert>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Chip
                    label={selectedConfig.includes("hospital") ? "Sağlık Kurumu" : "Çağrı Merkezi"}
                    color={selectedConfig.includes("hospital") ? "success" : "info"}
                    sx={{ mr: 2 }}
                  />
                  <Typography variant="h6" fontWeight="600">
                    {configs.find(c => c.id === selectedConfig)?.name || 'Konfigürasyon'}
                  </Typography>
                </Box>

                <Card sx={{
                  p: 3,
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  mb: 4,
                  border: '1px solid rgba(103, 58, 183, 0.1)',
                  bgcolor: 'rgba(103, 58, 183, 0.02)'
                }}>
                  <Typography variant="subtitle1" fontWeight="600" gutterBottom sx={{ color: '#673ab7' }}>
                    Kural Tanımları (YAML)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Aşağıdaki metin alanında kuralları düzenleyebilirsiniz. Değişiklikleri kaydetmek için "Kuralları Kaydet" butonuna tıklayın.
                  </Typography>

                <TextField
                  fullWidth
                  multiline
                  rows={16}
                    value={configContent || 'Konfigürasyon yükleniyor...'}
                    onChange={(e) => setConfigContent(e.target.value)}
                  variant="outlined"
                  InputProps={{
                    sx: {
                      borderRadius: 2,
                      fontFamily: 'monospace'
                    }
                  }}
                  sx={{ mb: 3 }}
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    sx={{
                      borderRadius: 2,
                      py: 1.2,
                      px: 3,
                      bgcolor: '#673ab7',
                      '&:hover': {
                        bgcolor: '#5e35b1'
                      },
                      boxShadow: '0 4px 10px rgba(103, 58, 183, 0.3)'
                    }}
                      onClick={handleSaveConfig}
                  >
                    Kuralları Kaydet
                  </Button>
                  <Button
                    variant="outlined"
                      startIcon={<InfoIcon />}
                    sx={{
                      borderRadius: 2,
                      py: 1.2,
                        px: 3,
                        color: '#673ab7',
                        borderColor: '#673ab7'
                      }}
                      onClick={() => {
                        setSnackbar({
                          open: true,
                          message: 'Kural setlerini silmek için sistem yöneticinize başvurun',
                          severity: 'info'
                        });
                      }}
                    >
                      Yardım
                  </Button>
                </Box>
                </Card>

                <Card sx={{
                  p: 3,
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  border: '1px solid rgba(0,0,0,0.05)',
                  bgcolor: 'rgba(76, 175, 80, 0.05)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <InfoIcon sx={{ color: 'success.main', mr: 1.5 }} />
                    <Typography variant="subtitle1" fontWeight="600" color="success.main">
                      Kural Tanımları Hakkında Bilgi
                    </Typography>
                  </Box>
                  <Typography variant="body2" paragraph>
                    Kural tanımlarını güncelledikten sonra, çizelgeleme işlemi sırasında yeni kurallar otomatik olarak kullanılacaktır.
                    YAML formatı ve kural tanımları hakkında daha fazla bilgi için sistem yöneticinize başvurun.
                  </Typography>
                </Card>
              </Box>
            </Card>
          </Grid>
        </Grid>
        </Box>
      )}
    </Box>
  );
};

export default DatasetConfig;
