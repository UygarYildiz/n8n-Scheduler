import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  Avatar,
  LinearProgress,
  Divider,
  useTheme,
  alpha,
  Stack,
  List
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Assessment as ReportIcon,
  CalendarMonth as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckCircleIcon,
  Speed as SpeedIcon,
  Bolt as BoltIcon,
  Settings as SettingsIcon,
  Dataset as DatasetIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  // Örnek metrik verileri
  const metrics = {
    understaffing: 0,
    overstaffing: 2,
    coverageRatio: 98,
    skillCoverage: 95,
    preferenceScore: 85,
    workloadBalance: 92
  };

  return (
    <Box>
      <Box sx={{ mb: 5, textAlign: 'center', position: 'relative' }}>
        <Box sx={{
          maxWidth: '800px',
          mx: 'auto',
          mb: 4,
          pb: 4,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Yönetici Kontrol Paneli
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
            Vardiya çizelgeleme ve personel optimizasyonu için kurumsal yönetim merkezi
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<StartIcon />}
              onClick={() => navigate('/optimization-params')}
              sx={{
                px: 3,
                py: 1.5,
                borderRadius: 2,
                backgroundColor: theme.palette.primary.main,
                boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                  boxShadow: `0 6px 20px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
                }
              }}
            >
              Yeni Çizelge Oluştur
            </Button>

            <Button
              variant="outlined"
              startIcon={<CalendarIcon />}
              onClick={() => navigate('/schedule-view')}
              sx={{
                px: 3,
                py: 1.5,
                borderRadius: 2,
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                '&:hover': {
                  borderColor: theme.palette.primary.dark,
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                }
              }}
            >
              Mevcut Çizelgeleri Görüntüle
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Kurumsal Performans Göstergeleri */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h5" fontWeight="600" gutterBottom sx={{ mb: 3, textAlign: 'center' }}>
          Kurumsal Performans Göstergeleri
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              height: '100%',
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Avatar sx={{
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    color: theme.palette.success.main,
                    width: 56,
                    height: 56,
                    mx: 'auto',
                    mb: 2
                  }}>
                    <PeopleIcon fontSize="large" />
                  </Avatar>
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    Personel Verimliliği
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography variant="h3" fontWeight="bold" color={theme.palette.success.main}>
                    {metrics.coverageRatio}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Minimum personel gereksinimlerinin karşılanma oranı
                  </Typography>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={metrics.coverageRatio}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: theme.palette.success.main
                    },
                    mb: 1.5
                  }}
                />

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUpIcon sx={{ color: theme.palette.success.main, fontSize: 16, mr: 0.5 }} />
                  <Typography variant="body2" fontWeight="medium" color="success.main">
                    %5 artış (önceki döneme göre)
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              height: '100%',
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Avatar sx={{
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    color: theme.palette.info.main,
                    width: 56,
                    height: 56,
                    mx: 'auto',
                    mb: 2
                  }}>
                    <CheckCircleIcon fontSize="large" />
                  </Avatar>
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    Yetkinlik Uyumu
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography variant="h3" fontWeight="bold" color={theme.palette.info.main}>
                    {metrics.skillCoverage}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Gerekli yetkinliklerin doğru personelle eşleşme oranı
                  </Typography>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={metrics.skillCoverage}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: theme.palette.info.main
                    },
                    mb: 1.5
                  }}
                />

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUpIcon sx={{ color: theme.palette.success.main, fontSize: 16, mr: 0.5 }} />
                  <Typography variant="body2" fontWeight="medium" color="success.main">
                    %2 artış (önceki döneme göre)
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              height: '100%',
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Avatar sx={{
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    color: theme.palette.warning.main,
                    width: 56,
                    height: 56,
                    mx: 'auto',
                    mb: 2
                  }}>
                    <TimeIcon fontSize="large" />
                  </Avatar>
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    Çalışan Memnuniyeti
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography variant="h3" fontWeight="bold" color={theme.palette.warning.main}>
                    {metrics.preferenceScore}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Çalışan tercihlerinin karşılanma oranı
                  </Typography>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={metrics.preferenceScore}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: theme.palette.warning.main
                    },
                    mb: 1.5
                  }}
                />

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUpIcon sx={{ color: theme.palette.success.main, fontSize: 16, mr: 0.5 }} />
                  <Typography variant="body2" fontWeight="medium" color="success.main">
                    %8 artış (önceki döneme göre)
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{
              height: '100%',
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Avatar sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    width: 56,
                    height: 56,
                    mx: 'auto',
                    mb: 2
                  }}>
                    <SpeedIcon fontSize="large" />
                  </Avatar>
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    İş Yükü Dengesi
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography variant="h3" fontWeight="bold" color={theme.palette.primary.main}>
                    {metrics.workloadBalance}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Çalışanlar arasında iş yükü dağılımının dengesi
                  </Typography>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={metrics.workloadBalance}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: theme.palette.primary.main
                    },
                    mb: 1.5
                  }}
                />

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUpIcon sx={{ color: theme.palette.success.main, fontSize: 16, mr: 0.5 }} />
                  <Typography variant="body2" fontWeight="medium" color="success.main">
                    %3 artış (önceki döneme göre)
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Özet Raporlar ve Sistem Durumu */}
      <Typography variant="h5" fontWeight="600" gutterBottom sx={{ mb: 3, textAlign: 'center' }}>
        Özet Raporlar ve Sistem Durumu
      </Typography>

      <Grid container spacing={4}>
        {/* Son Çizelgeleme Raporu */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            borderRadius: 3,
            height: '100%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            overflow: 'hidden'
          }}>
            <Box sx={{
              p: 3,
              background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.8)}, ${alpha(theme.palette.primary.main, 0.6)})`,
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{
                  bgcolor: 'white',
                  color: theme.palette.primary.main,
                  mr: 2
                }}>
                  <BoltIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="bold">Son Çizelgeleme Raporu</Typography>
              </Box>
              <Chip
                label="BAŞARILI"
                sx={{
                  fontWeight: 'bold',
                  borderRadius: 2,
                  bgcolor: 'white',
                  color: theme.palette.success.main
                }}
              />
            </Box>

            <CardContent sx={{ p: 3 }}>
              <Box sx={{ mb: 3, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                  Çizelgeleme Özeti
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Son çizelgeleme işlemi başarıyla tamamlandı. Tüm departmanlar için minimum personel gereksinimleri karşılandı ve çalışan tercihleri maksimum düzeyde dikkate alındı.
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight="bold" color={theme.palette.primary.main}>
                      2.45s
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      İşlem Süresi
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight="bold" color={theme.palette.primary.main}>
                      125.5
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Hedef Değeri
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight="bold" color={theme.palette.primary.main}>
                      42
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Atama Sayısı
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight="bold" color={theme.palette.primary.main}>
                      07.05
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Tarih
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<ReportIcon />}
                  onClick={() => navigate('/results')}
                  sx={{
                    borderRadius: 2,
                    py: 1,
                    bgcolor: theme.palette.primary.main,
                    '&:hover': {
                      bgcolor: theme.palette.primary.dark
                    }
                  }}
                  fullWidth
                >
                  Detaylı Raporu Görüntüle
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CalendarIcon />}
                  onClick={() => navigate('/schedule-view')}
                  sx={{
                    borderRadius: 2,
                    py: 1,
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main,
                    '&:hover': {
                      borderColor: theme.palette.primary.dark,
                      bgcolor: alpha(theme.palette.primary.main, 0.05)
                    }
                  }}
                  fullWidth
                >
                  Çizelgeyi Görüntüle
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Sistem Durumu */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            borderRadius: 3,
            height: '100%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            overflow: 'hidden'
          }}>
            <Box sx={{
              p: 3,
              background: `linear-gradient(45deg, ${alpha(theme.palette.info.main, 0.8)}, ${alpha(theme.palette.info.main, 0.6)})`,
              color: 'white'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{
                  bgcolor: 'white',
                  color: theme.palette.info.main,
                  mr: 2
                }}>
                  <SettingsIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="bold">Sistem Durumu</Typography>
              </Box>
            </Box>

            <CardContent sx={{ p: 3 }}>
              <Box sx={{ mb: 3, p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 2 }}>
                <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                  Genel Durum
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Tüm sistemler normal şekilde çalışıyor. Veri seti ve konfigürasyon dosyaları güncel durumda. Son güncelleme 07.05.2025 tarihinde yapıldı.
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    mb: 2
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleIcon sx={{ color: theme.palette.success.main, mr: 1 }} />
                      <Typography variant="subtitle2">API Durumu</Typography>
                    </Box>
                    <Chip
                      label="Çalışıyor"
                      color="success"
                      size="small"
                      sx={{ fontWeight: 'medium', borderRadius: 2 }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    mb: 2
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleIcon sx={{ color: theme.palette.success.main, mr: 1 }} />
                      <Typography variant="subtitle2">n8n Durumu</Typography>
                    </Box>
                    <Chip
                      label="Çalışıyor"
                      color="success"
                      size="small"
                      sx={{ fontWeight: 'medium', borderRadius: 2 }}
                    />
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.info.main, 0.05),
                    mb: 2
                  }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Aktif Veri Seti</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          Hastane
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Aktif Konfigürasyon</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          hospital_test_config.yaml
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/dataset-config')}
                  sx={{
                    borderRadius: 2,
                    py: 1,
                    borderColor: theme.palette.info.main,
                    color: theme.palette.info.main,
                    '&:hover': {
                      borderColor: theme.palette.info.dark,
                      bgcolor: alpha(theme.palette.info.main, 0.05)
                    }
                  }}
                >
                  Veri Seti ve Konfigürasyon Yönetimi
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Son Aktiviteler */}
        <Grid item xs={12}>
          <Card sx={{
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            overflow: 'hidden'
          }}>
            <Box sx={{
              p: 3,
              background: `linear-gradient(45deg, ${alpha(theme.palette.secondary.main, 0.8)}, ${alpha(theme.palette.secondary.main, 0.6)})`,
              color: 'white'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{
                  bgcolor: 'white',
                  color: theme.palette.secondary.main,
                  mr: 2
                }}>
                  <ReportIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="bold">Son İşlemler</Typography>
              </Box>
            </Box>

            <CardContent sx={{ p: 0 }}>
              <List sx={{ py: 0 }}>
                {[
                  { date: '07.05.2025 14:30', action: 'Çizelgeleme tamamlandı', detail: 'Hastane veri seti için başarılı optimizasyon', color: theme.palette.primary.main },
                  { date: '07.05.2025 13:15', action: 'Konfigürasyon güncellendi', detail: 'Hastane konfigürasyon dosyası güncellendi', color: theme.palette.warning.main },
                  { date: '07.05.2025 10:45', action: 'Çizelgeleme tamamlandı', detail: 'Çağrı Merkezi veri seti için başarılı optimizasyon', color: theme.palette.primary.main },
                  { date: '06.05.2025 16:20', action: 'Yeni veri seti eklendi', detail: 'Çağrı Merkezi veri seti sisteme yüklendi', color: theme.palette.success.main }
                ].map((activity, index) => (
                  <Box key={index} sx={{
                    p: 3,
                    borderBottom: index < 3 ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    transition: 'background-color 0.2s',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.secondary.main, 0.03)
                    }
                  }}>
                    <Avatar sx={{
                      bgcolor: alpha(activity.color, 0.1),
                      color: activity.color,
                      width: 48,
                      height: 48,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                      {index === 0 || index === 2 ? <BoltIcon /> :
                       index === 1 ? <SettingsIcon /> : <DatasetIcon />}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="subtitle1" fontWeight="600">
                          {activity.action}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>
                          {activity.date}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {activity.detail}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
