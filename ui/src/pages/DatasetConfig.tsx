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
  IconButton
} from '@mui/material';
import {
  Folder as FolderIcon,
  Description as FileIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const DatasetConfig = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedDataset, setSelectedDataset] = useState('hastane');
  const [selectedConfig, setSelectedConfig] = useState('hospital_test_config.yaml');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const datasets = [
    { id: 'hastane', name: 'Hastane Veri Seti', path: '/veri_kaynaklari/hastane' },
    { id: 'cagri_merkezi', name: 'Çağrı Merkezi Veri Seti', path: '/veri_kaynaklari/cagri_merkezi' }
  ];

  const configs = [
    { id: 'hospital_test_config.yaml', name: 'Hastane Konfigürasyonu', path: '/configs/hospital_test_config.yaml' },
    { id: 'cagri_merkezi_config.yaml', name: 'Çağrı Merkezi Konfigürasyonu', path: '/configs/cagri_merkezi_config.yaml' }
  ];

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
            Veri Kaynakları ve Kural Yönetimi
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
            Kurumunuza özel veri kaynaklarını ve çizelgeleme kurallarını yönetin
          </Typography>
        </Box>
      </Box>

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

      <TabPanel value={tabValue} index={0}>
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
                    secondaryAction={
                      <IconButton edge="end" aria-label="edit" sx={{ color: 'primary.main' }}>
                        <EditIcon />
                      </IconButton>
                    }
                    selected={selectedDataset === dataset.id}
                    onClick={() => setSelectedDataset(dataset.id)}
                    sx={{
                      cursor: 'pointer',
                      py: 2,
                      px: 3,
                      borderBottom: index < datasets.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                      '&.Mui-selected': {
                        bgcolor: 'rgba(25, 118, 210, 0.08)',
                        '&:hover': {
                          bgcolor: 'rgba(25, 118, 210, 0.12)'
                        }
                      },
                      '&:hover': {
                        bgcolor: 'rgba(0,0,0,0.02)'
                      }
                    }}
                  >
                    <ListItemIcon>
                      <FolderIcon sx={{ color: 'primary.main' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography variant="subtitle1" fontWeight="600">{dataset.name}</Typography>}
                      secondary={dataset.path}
                    />
                  </ListItem>
                ))}
              </List>

              <Box sx={{ p: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  fullWidth
                  sx={{
                    borderRadius: 2,
                    py: 1.2,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                  }}
                >
                  Yeni Veri Kaynağı Ekle
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
                  {datasets.find(d => d.id === selectedDataset)?.name} Detayları
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Veri kaynağı bilgilerini düzenleyin ve dosyaları yönetin
                </Typography>
              </Box>

              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Veri Kaynağı Adı"
                      value={datasets.find(d => d.id === selectedDataset)?.name}
                      variant="outlined"
                      InputProps={{
                        sx: { borderRadius: 2 }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Veri Kaynağı Yolu"
                      value={datasets.find(d => d.id === selectedDataset)?.path}
                      variant="outlined"
                      InputProps={{
                        sx: { borderRadius: 2 }
                      }}
                    />
                  </Grid>
                </Grid>

                <Box sx={{
                  mt: 4,
                  p: 3,
                  bgcolor: 'rgba(0,0,0,0.02)',
                  borderRadius: 3,
                  border: '1px solid rgba(0,0,0,0.05)'
                }}>
                  <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                    Veri Dosyaları
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Çizelgeleme için gerekli veri dosyalarını yükleyin veya güncelleyin
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Card sx={{
                        p: 2,
                        borderRadius: 2,
                        boxShadow: 'none',
                        border: '1px solid rgba(0,0,0,0.08)',
                        mb: 2
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <FileIcon sx={{ color: 'primary.main', mr: 1.5 }} />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle2" fontWeight="600">
                              employees.csv
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Çalışan bilgileri, roller ve departmanlar
                            </Typography>
                          </Box>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<UploadIcon />}
                            sx={{ borderRadius: 2 }}
                          >
                            Yükle
                          </Button>
                        </Box>
                      </Card>

                      <Card sx={{
                        p: 2,
                        borderRadius: 2,
                        boxShadow: 'none',
                        border: '1px solid rgba(0,0,0,0.08)',
                        mb: 2
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <FileIcon sx={{ color: 'primary.main', mr: 1.5 }} />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle2" fontWeight="600">
                              shifts.csv
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Vardiya tanımları ve zaman aralıkları
                            </Typography>
                          </Box>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<UploadIcon />}
                            sx={{ borderRadius: 2 }}
                          >
                            Yükle
                          </Button>
                        </Box>
                      </Card>

                      <Card sx={{
                        p: 2,
                        borderRadius: 2,
                        boxShadow: 'none',
                        border: '1px solid rgba(0,0,0,0.08)'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <FileIcon sx={{ color: 'primary.main', mr: 1.5 }} />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle2" fontWeight="600">
                              skills.csv
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Çalışan yetkinlikleri ve uzmanlık alanları
                            </Typography>
                          </Box>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<UploadIcon />}
                            sx={{ borderRadius: 2 }}
                          >
                            Yükle
                          </Button>
                        </Box>
                      </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Card sx={{
                        p: 2,
                        borderRadius: 2,
                        boxShadow: 'none',
                        border: '1px solid rgba(0,0,0,0.08)',
                        mb: 2
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <FileIcon sx={{ color: 'primary.main', mr: 1.5 }} />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle2" fontWeight="600">
                              availability.csv
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Çalışan uygunluk bilgileri ve izinler
                            </Typography>
                          </Box>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<UploadIcon />}
                            sx={{ borderRadius: 2 }}
                          >
                            Yükle
                          </Button>
                        </Box>
                      </Card>

                      <Card sx={{
                        p: 2,
                        borderRadius: 2,
                        boxShadow: 'none',
                        border: '1px solid rgba(0,0,0,0.08)',
                        mb: 2
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <FileIcon sx={{ color: 'primary.main', mr: 1.5 }} />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle2" fontWeight="600">
                              preferences.csv
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Çalışan vardiya tercihleri
                            </Typography>
                          </Box>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<UploadIcon />}
                            sx={{ borderRadius: 2 }}
                          >
                            Yükle
                          </Button>
                        </Box>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>

                <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    sx={{
                      borderRadius: 2,
                      py: 1.2,
                      px: 3,
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                    }}
                  >
                    Değişiklikleri Kaydet
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    sx={{
                      borderRadius: 2,
                      py: 1.2,
                      px: 3
                    }}
                  >
                    Tüm Dosyaları Yükle
                  </Button>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
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
                    secondaryAction={
                      <IconButton edge="end" aria-label="edit" sx={{ color: '#673ab7' }}>
                        <EditIcon />
                      </IconButton>
                    }
                    selected={selectedConfig === config.id}
                    onClick={() => setSelectedConfig(config.id)}
                    sx={{
                      cursor: 'pointer',
                      py: 2,
                      px: 3,
                      borderBottom: index < configs.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                      '&.Mui-selected': {
                        bgcolor: 'rgba(103, 58, 183, 0.08)',
                        '&:hover': {
                          bgcolor: 'rgba(103, 58, 183, 0.12)'
                        }
                      },
                      '&:hover': {
                        bgcolor: 'rgba(0,0,0,0.02)'
                      }
                    }}
                  >
                    <ListItemIcon>
                      <FileIcon sx={{ color: '#673ab7' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography variant="subtitle1" fontWeight="600">{config.name}</Typography>}
                      secondary={config.path}
                    />
                  </ListItem>
                ))}
              </List>

              <Box sx={{ p: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
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
                >
                  Yeni Kural Seti Ekle
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
                  {configs.find(c => c.id === selectedConfig)?.name} Kuralları
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Çizelgeleme kurallarını ve optimizasyon parametrelerini düzenleyin
                </Typography>
              </Box>

              <Box sx={{ p: 3 }}>
                <Box sx={{
                  mb: 4,
                  p: 3,
                  bgcolor: 'rgba(103, 58, 183, 0.03)',
                  borderRadius: 3,
                  border: '1px solid rgba(103, 58, 183, 0.1)'
                }}>
                  <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                    Kural Dosyası Hakkında
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Bu dosya, çizelgeleme algoritmasının kullanacağı tüm kuralları ve parametreleri içerir.
                    Minimum personel gereksinimleri, vardiya kısıtlamaları ve optimizasyon hedefleri burada tanımlanır.
                  </Typography>
                </Box>

                <TextField
                  fullWidth
                  multiline
                  rows={16}
                  label="Kural Tanımları (YAML)"
                  defaultValue={`institution_id: "hospital_a"
institution_name: "Hastane A"
problem_type: "shift_scheduling"

optimization_core:
  solver_time_limit_seconds: 60
  objective_weights:
    minimize_understaffing: 100
    minimize_overstaffing: 1
    maximize_preferences: 2
    balance_workload: 3
    maximize_shift_coverage: 50

rules:
  min_staffing_requirements:
    - shift_pattern: "*Acil*"
      role: "Doktor"
      department: "Acil"
      min_count: 2
      penalty_if_violated: 500

    - shift_pattern: "*Kardiyoloji*"
      role: "Doktor"
      department: "Kardiyoloji"
      min_count: 1
      penalty_if_violated: 300
`}
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
                  >
                    Kuralları Kaydet
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    sx={{
                      borderRadius: 2,
                      py: 1.2,
                      px: 3
                    }}
                  >
                    Kural Setini Sil
                  </Button>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default DatasetConfig;
