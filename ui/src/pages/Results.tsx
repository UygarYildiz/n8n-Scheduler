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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import { 
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon
} from '@mui/icons-material';

// Chart.js için gerekli bileşenler
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

// Chart.js bileşenlerini kaydet
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

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

const Results = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Örnek veri - Metrikler
  const metrics = {
    total_understaffing: 0,
    total_overstaffing: 2,
    min_staffing_coverage_ratio: 1.0,
    skill_coverage_ratio: 0.95,
    positive_preferences_met_count: 5,
    negative_preferences_assigned_count: 1,
    total_preference_score_achieved: 4,
    workload_distribution_std_dev: 0.5
  };
  
  // Örnek veri - Atamalar
  const assignments = [
    { employee_id: "E001", employee_name: "Ahmet Yılmaz", shift_id: "S001", shift_name: "Acil Gündüz", date: "2023-05-01", start_time: "08:00", end_time: "16:00" },
    { employee_id: "E002", employee_name: "Ayşe Demir", shift_id: "S002", shift_name: "Kardiyoloji Gündüz", date: "2023-05-01", start_time: "08:00", end_time: "16:00" },
    { employee_id: "E003", employee_name: "Mehmet Kaya", shift_id: "S003", shift_name: "Acil Akşam", date: "2023-05-01", start_time: "16:00", end_time: "00:00" },
    { employee_id: "E004", employee_name: "Zeynep Çelik", shift_id: "S004", shift_name: "Kardiyoloji Akşam", date: "2023-05-01", start_time: "16:00", end_time: "00:00" },
    { employee_id: "E005", employee_name: "Ali Öztürk", shift_id: "S005", shift_name: "Acil Gece", date: "2023-05-01", start_time: "00:00", end_time: "08:00" }
  ];
  
  // Grafik verileri - Departman bazlı atama dağılımı
  const departmentChartData = {
    labels: ['Acil', 'Kardiyoloji', 'Cerrahi', 'Pediatri', 'Yoğun Bakım'],
    datasets: [
      {
        label: 'Atama Sayısı',
        data: [12, 8, 6, 5, 4],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Grafik verileri - Rol bazlı atama dağılımı
  const roleChartData = {
    labels: ['Doktor', 'Hemşire', 'Teknisyen', 'İdari'],
    datasets: [
      {
        label: 'Atama Sayısı',
        data: [15, 20, 8, 5],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Grafik verileri - Tercih karşılama oranları
  const preferenceChartData = {
    labels: ['Karşılanan Pozitif Tercihler', 'Atanan Negatif Tercihler', 'Nötr'],
    datasets: [
      {
        data: [metrics.positive_preferences_met_count, metrics.negative_preferences_assigned_count, 10],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(201, 203, 207, 0.6)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(201, 203, 207, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Optimizasyon Sonuçları
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Chip 
            label="OPTIMAL" 
            color="success" 
            sx={{ mr: 1, fontWeight: 'bold' }} 
          />
          <Typography variant="body1" component="span">
            Çalışma Süresi: 2.45 saniye | Hedef Değeri: 125.5
          </Typography>
        </Box>
        
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />}
            sx={{ mr: 1 }}
          >
            Excel
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />}
            sx={{ mr: 1 }}
          >
            PDF
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<PrintIcon />}
          >
            Yazdır
          </Button>
        </Box>
      </Box>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="sonuç sekmeleri">
          <Tab label="Özet" />
          <Tab label="Metrikler" />
          <Tab label="Atamalar" />
          <Tab label="Grafikler" />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Optimizasyon Bilgileri
              </Typography>
              <Typography variant="body1">
                Veri Seti: <strong>Hastane</strong>
              </Typography>
              <Typography variant="body1">
                Konfigürasyon: <strong>hospital_test_config.yaml</strong>
              </Typography>
              <Typography variant="body1">
                Çalışan Sayısı: <strong>20</strong>
              </Typography>
              <Typography variant="body1">
                Vardiya Sayısı: <strong>35</strong>
              </Typography>
              <Typography variant="body1">
                Toplam Atama Sayısı: <strong>42</strong>
              </Typography>
              <Typography variant="body1">
                Çözücü Durumu: <strong style={{ color: 'green' }}>OPTIMAL</strong>
              </Typography>
              <Typography variant="body1">
                Çalışma Süresi: <strong>2.45 saniye</strong>
              </Typography>
              <Typography variant="body1">
                Hedef Değeri: <strong>125.5</strong>
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Temel Metrikler
              </Typography>
              <Typography variant="body1">
                Eksik Personel: <strong>{metrics.total_understaffing}</strong>
              </Typography>
              <Typography variant="body1">
                Fazla Personel: <strong>{metrics.total_overstaffing}</strong>
              </Typography>
              <Typography variant="body1">
                Minimum Personel Karşılama Oranı: <strong>{metrics.min_staffing_coverage_ratio * 100}%</strong>
              </Typography>
              <Typography variant="body1">
                Yetenek Karşılama Oranı: <strong>{metrics.skill_coverage_ratio * 100}%</strong>
              </Typography>
              <Typography variant="body1">
                Karşılanan Pozitif Tercih Sayısı: <strong>{metrics.positive_preferences_met_count}</strong>
              </Typography>
              <Typography variant="body1">
                Atanan Negatif Tercih Sayısı: <strong>{metrics.negative_preferences_assigned_count}</strong>
              </Typography>
              <Typography variant="body1">
                Toplam Tercih Skoru: <strong>{metrics.total_preference_score_achieved}</strong>
              </Typography>
              <Typography variant="body1">
                İş Yükü Dağılımı Std. Sapma: <strong>{metrics.workload_distribution_std_dev}</strong>
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Departman Bazlı Atama Dağılımı
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar 
                  data={departmentChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                      title: {
                        display: true,
                        text: 'Departman Bazlı Atama Dağılımı'
                      }
                    }
                  }}
                />
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Tercih Karşılama Oranları
              </Typography>
              <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                <Pie 
                  data={preferenceChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                      title: {
                        display: true,
                        text: 'Tercih Karşılama Oranları'
                      }
                    }
                  }}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Detaylı Metrikler
              </Typography>
              
              <Typography variant="subtitle1" sx={{ mt: 2 }}>
                Operasyonel Metrikler
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Metrik</TableCell>
                      <TableCell>Değer</TableCell>
                      <TableCell>Açıklama</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Eksik Personel</TableCell>
                      <TableCell>{metrics.total_understaffing}</TableCell>
                      <TableCell>Minimum personel gereksinimlerini karşılamayan vardiya sayısı</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Fazla Personel</TableCell>
                      <TableCell>{metrics.total_overstaffing}</TableCell>
                      <TableCell>Gerekenden fazla personel atanan vardiya sayısı</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Minimum Personel Karşılama Oranı</TableCell>
                      <TableCell>{metrics.min_staffing_coverage_ratio * 100}%</TableCell>
                      <TableCell>Minimum personel gereksinimlerinin karşılanma oranı</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Yetenek Karşılama Oranı</TableCell>
                      <TableCell>{metrics.skill_coverage_ratio * 100}%</TableCell>
                      <TableCell>Yetenek gereksinimlerinin karşılanma oranı</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Typography variant="subtitle1" sx={{ mt: 4 }}>
                Çalışan Memnuniyeti Metrikleri
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Metrik</TableCell>
                      <TableCell>Değer</TableCell>
                      <TableCell>Açıklama</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Karşılanan Pozitif Tercih Sayısı</TableCell>
                      <TableCell>{metrics.positive_preferences_met_count}</TableCell>
                      <TableCell>Çalışanların pozitif tercihlerinin karşılanma sayısı</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Atanan Negatif Tercih Sayısı</TableCell>
                      <TableCell>{metrics.negative_preferences_assigned_count}</TableCell>
                      <TableCell>Çalışanların negatif tercihlerine rağmen atanma sayısı</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Toplam Tercih Skoru</TableCell>
                      <TableCell>{metrics.total_preference_score_achieved}</TableCell>
                      <TableCell>Tüm tercihlerin toplam skoru (pozitif - negatif)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>İş Yükü Dağılımı Std. Sapma</TableCell>
                      <TableCell>{metrics.workload_distribution_std_dev}</TableCell>
                      <TableCell>Çalışanlar arasındaki iş yükü dağılımının standart sapması (düşük değer daha adil dağılım)</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Vardiya Atamaları
              </Typography>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Çalışan ID</TableCell>
                      <TableCell>Çalışan Adı</TableCell>
                      <TableCell>Vardiya ID</TableCell>
                      <TableCell>Vardiya Adı</TableCell>
                      <TableCell>Tarih</TableCell>
                      <TableCell>Başlangıç</TableCell>
                      <TableCell>Bitiş</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {assignments.map((assignment) => (
                      <TableRow key={`${assignment.employee_id}-${assignment.shift_id}`}>
                        <TableCell>{assignment.employee_id}</TableCell>
                        <TableCell>{assignment.employee_name}</TableCell>
                        <TableCell>{assignment.shift_id}</TableCell>
                        <TableCell>{assignment.shift_name}</TableCell>
                        <TableCell>{assignment.date}</TableCell>
                        <TableCell>{assignment.start_time}</TableCell>
                        <TableCell>{assignment.end_time}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
      
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Departman Bazlı Atama Dağılımı
              </Typography>
              <Box sx={{ height: 400 }}>
                <Bar 
                  data={departmentChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                      title: {
                        display: true,
                        text: 'Departman Bazlı Atama Dağılımı'
                      }
                    }
                  }}
                />
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Rol Bazlı Atama Dağılımı
              </Typography>
              <Box sx={{ height: 400 }}>
                <Bar 
                  data={roleChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                      title: {
                        display: true,
                        text: 'Rol Bazlı Atama Dağılımı'
                      }
                    }
                  }}
                />
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Tercih Karşılama Oranları
              </Typography>
              <Box sx={{ height: 400, display: 'flex', justifyContent: 'center' }}>
                <Pie 
                  data={preferenceChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                      title: {
                        display: true,
                        text: 'Tercih Karşılama Oranları'
                      }
                    }
                  }}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default Results;
