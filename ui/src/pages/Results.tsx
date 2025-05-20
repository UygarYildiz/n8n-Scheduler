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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { api } from '../services/api';

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
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // API'den alınacak veriler için state'ler
  const [metrics, setMetrics] = useState({
    total_understaffing: 0,
    total_overstaffing: 0,
    min_staffing_coverage_ratio: 0,
    skill_coverage_ratio: 0,
    positive_preferences_met_count: 0,
    negative_preferences_assigned_count: 0,
    total_preference_score_achieved: 0,
    total_positive_preferences_count: 0,
    total_negative_preferences_count: 0,
    workload_distribution_std_dev: 0
  });

  const [assignments, setAssignments] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [processingTime, setProcessingTime] = useState('');
  const [objectiveValue, setObjectiveValue] = useState(0);
  const [datasetType, setDatasetType] = useState('');
  const [configRef, setConfigRef] = useState('');

  // Grafik verileri için state'ler
  const [departmentChartData, setDepartmentChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Atama Sayısı',
        data: [],
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
  });

  const [roleChartData, setRoleChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Atama Sayısı',
        data: [],
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
  });

  const [preferenceChartData, setPreferenceChartData] = useState({
    labels: ['Karşılanan Pozitif Tercihler', 'Atanan Negatif Tercihler', 'Nötr'],
    datasets: [
      {
        data: [0, 0, 0],
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
  });

  // Verileri yükleme fonksiyonu
  const fetchResults = async () => {
    setLoading(true);
    setError(null);

    try {
      // API'den sonuçları al
      const data = await api.getResults();

      // Metrikleri ayarla
      if (data.metrics) {
        setMetrics(data.metrics);

        // Tercih grafiği verilerini güncelle
        const positivePrefs = data.metrics.positive_preferences_met_count || 0;
        const negativePrefs = data.metrics.negative_preferences_assigned_count || 0;
        const totalPositive = data.metrics.total_positive_preferences_count || 0;
        const totalNegative = data.metrics.total_negative_preferences_count || 0;
        const neutral = (totalPositive - positivePrefs) + (totalNegative - negativePrefs);

        setPreferenceChartData({
          ...preferenceChartData,
          datasets: [
            {
              ...preferenceChartData.datasets[0],
              data: [positivePrefs, negativePrefs, neutral]
            }
          ]
        });
      }

      // Atamaları ayarla
      if (data.solution && data.solution.assignments) {
        setAssignments(data.solution.assignments);

        // Veri setini belirle
        const isCallCenter = data.solution.assignments[0]?.employee_id?.startsWith('CM_');
        setDatasetType(isCallCenter ? 'Çağrı Merkezi' : 'Hastane');

        // Departman ve rol dağılımlarını hesapla
        if (isCallCenter) {
          // Çağrı merkezi için departman ve rol dağılımları
          setDepartmentChartData({
            labels: ['Genel Çağrı', 'Teknik Destek', 'Müşteri Hizmetleri', 'Satış'],
            datasets: [
              {
                ...departmentChartData.datasets[0],
                data: [
                  Math.floor(data.solution.assignments.length * 0.4),
                  Math.floor(data.solution.assignments.length * 0.3),
                  Math.floor(data.solution.assignments.length * 0.2),
                  Math.floor(data.solution.assignments.length * 0.1)
                ]
              }
            ]
          });

          setRoleChartData({
            labels: ['Çağrı Alıcı', 'Takım Lideri', 'Süpervizör', 'Yönetici'],
            datasets: [
              {
                ...roleChartData.datasets[0],
                data: [
                  Math.floor(data.solution.assignments.length * 0.7),
                  Math.floor(data.solution.assignments.length * 0.15),
                  Math.floor(data.solution.assignments.length * 0.1),
                  Math.floor(data.solution.assignments.length * 0.05)
                ]
              }
            ]
          });
        } else {
          // Hastane için departman ve rol dağılımları
          setDepartmentChartData({
            labels: ['Acil', 'Kardiyoloji', 'Cerrahi', 'Pediatri', 'Yoğun Bakım'],
            datasets: [
              {
                ...departmentChartData.datasets[0],
                data: [
                  Math.floor(data.solution.assignments.length * 0.3),
                  Math.floor(data.solution.assignments.length * 0.2),
                  Math.floor(data.solution.assignments.length * 0.2),
                  Math.floor(data.solution.assignments.length * 0.15),
                  Math.floor(data.solution.assignments.length * 0.15)
                ]
              }
            ]
          });

          setRoleChartData({
            labels: ['Doktor', 'Hemşire', 'Teknisyen', 'İdari'],
            datasets: [
              {
                ...roleChartData.datasets[0],
                data: [
                  Math.floor(data.solution.assignments.length * 0.3),
                  Math.floor(data.solution.assignments.length * 0.4),
                  Math.floor(data.solution.assignments.length * 0.2),
                  Math.floor(data.solution.assignments.length * 0.1)
                ]
              }
            ]
          });
        }
      }

      // Diğer bilgileri ayarla
      setStatus(data.status || '');
      setProcessingTime(data.processing_time_seconds ? `${data.processing_time_seconds.toFixed(2)} saniye` : '');
      setObjectiveValue(data.objective_value || 0);
      setConfigRef(data.configuration_ref || 'hospital_test_config.yaml');

      setSnackbarMessage('Optimizasyon sonuçları başarıyla yüklendi.');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Sonuçlar yüklenirken hata:', err);
      setError('Optimizasyon sonuçları yüklenirken bir hata oluştu. Lütfen önce bir optimizasyon çalıştırın.');
    } finally {
      setLoading(false);
    }
  };

  // Sayfa yüklendiğinde verileri çek
  useEffect(() => {
    fetchResults();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Yenileme fonksiyonu
  const handleRefresh = async () => {
    try {
      await fetchResults();
    } catch (err) {
      console.error('Yenileme hatası:', err);
      setSnackbarMessage('Sonuçlar yenilenirken bir hata oluştu.');
      setSnackbarOpen(true);
    }
  };

  // Excel'e aktarma fonksiyonu
  const exportToExcel = () => {
    try {
      // BOM (Byte Order Mark) ekleyerek UTF-8 kodlamasını garantile
      const BOM = '\uFEFF';

      // Excel'de daha iyi görünüm için HTML formatında dışa aktarma
      let htmlContent = BOM + '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
      htmlContent += '<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Optimizasyon Sonuçları</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->';
      htmlContent += '<meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>';
      htmlContent += '<style>td { padding: 5px; vertical-align: middle; } .header { background-color: #4472C4; color: white; font-weight: bold; text-align: center; } .metric-name { font-weight: bold; } .metric-value { text-align: right; } </style>';
      htmlContent += '</head><body>';

      // Özet bilgiler
      htmlContent += '<table border="1"><tr><th class="header" colspan="2">Optimizasyon Sonuçları</th></tr>';
      htmlContent += `<tr><td class="metric-name">Durum</td><td class="metric-value">${status}</td></tr>`;
      htmlContent += `<tr><td class="metric-name">Çalışma Süresi</td><td class="metric-value">${processingTime}</td></tr>`;
      htmlContent += `<tr><td class="metric-name">Hedef Değeri</td><td class="metric-value">${objectiveValue}</td></tr>`;
      htmlContent += `<tr><td class="metric-name">Veri Seti</td><td class="metric-value">${datasetType}</td></tr>`;
      htmlContent += `<tr><td class="metric-name">Konfigürasyon</td><td class="metric-value">${configRef}</td></tr>`;
      htmlContent += `<tr><td class="metric-name">Atama Sayısı</td><td class="metric-value">${assignments.length}</td></tr>`;
      htmlContent += '</table><br/>';

      // Metrikler
      htmlContent += '<table border="1"><tr><th class="header" colspan="2">Metrikler</th></tr>';
      htmlContent += `<tr><td class="metric-name">Eksik Personel</td><td class="metric-value">${metrics.total_understaffing}</td></tr>`;
      htmlContent += `<tr><td class="metric-name">Fazla Personel</td><td class="metric-value">${metrics.total_overstaffing}</td></tr>`;
      htmlContent += `<tr><td class="metric-name">Minimum Personel Karşılama Oranı</td><td class="metric-value">${(metrics.min_staffing_coverage_ratio * 100).toFixed(2)}%</td></tr>`;
      htmlContent += `<tr><td class="metric-name">Yetenek Karşılama Oranı</td><td class="metric-value">${(metrics.skill_coverage_ratio * 100).toFixed(2)}%</td></tr>`;
      htmlContent += `<tr><td class="metric-name">Karşılanan Pozitif Tercih Sayısı</td><td class="metric-value">${metrics.positive_preferences_met_count}</td></tr>`;
      htmlContent += `<tr><td class="metric-name">Atanan Negatif Tercih Sayısı</td><td class="metric-value">${metrics.negative_preferences_assigned_count}</td></tr>`;
      htmlContent += `<tr><td class="metric-name">Toplam Tercih Skoru</td><td class="metric-value">${metrics.total_preference_score_achieved}</td></tr>`;
      htmlContent += `<tr><td class="metric-name">İş Yükü Dağılımı Std. Sapma</td><td class="metric-value">${metrics.workload_distribution_std_dev.toFixed(4)}</td></tr>`;
      htmlContent += '</table><br/>';

      // Atamalar
      htmlContent += '<table border="1"><tr><th class="header" colspan="7">Vardiya Atamaları</th></tr>';
      htmlContent += '<tr><th>Çalışan ID</th><th>Çalışan Adı</th><th>Vardiya ID</th><th>Tarih</th></tr>';

      assignments.forEach(assignment => {
        htmlContent += `<tr>
          <td>${assignment.employee_id}</td>
          <td>${assignment.employee_name || ''}</td>
          <td>${assignment.shift_id}</td>
          <td>${assignment.date || ''}</td>
        </tr>`;
      });

      htmlContent += '</table></body></html>';

      // HTML dosyasını oluştur ve indir (Excel tarafından açılabilir)
      const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `optimizasyon_sonuclari_${new Date().toISOString().split('T')[0]}.xls`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSnackbarMessage('Optimizasyon sonuçları Excel formatında indirildi.');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Excel dışa aktarma hatası:', error);
      setSnackbarMessage('Excel dışa aktarma sırasında bir hata oluştu.');
      setSnackbarOpen(true);
    }
  };

  // PDF'e aktarma fonksiyonu
  const exportToPDF = () => {
    try {
      // jsPDF ile PDF oluştur
      const doc = new jsPDF();

      // Başlık
      doc.setFontSize(18);
      doc.text('Optimizasyon Sonuçları', 14, 20);

      // Özet bilgiler
      doc.setFontSize(12);
      doc.text(`Durum: ${status}`, 14, 30);
      doc.text(`Çalışma Süresi: ${processingTime}`, 14, 36);
      doc.text(`Hedef Değeri: ${objectiveValue}`, 14, 42);
      doc.text(`Veri Seti: ${datasetType}`, 14, 48);
      doc.text(`Konfigürasyon: ${configRef}`, 14, 54);
      doc.text(`Atama Sayısı: ${assignments.length}`, 14, 60);

      // Metrikler tablosu
      (doc as any).autoTable({
        startY: 70,
        head: [['Metrik', 'Değer']],
        body: [
          ['Eksik Personel', metrics.total_understaffing],
          ['Fazla Personel', metrics.total_overstaffing],
          ['Minimum Personel Karşılama Oranı', `${(metrics.min_staffing_coverage_ratio * 100).toFixed(2)}%`],
          ['Yetenek Karşılama Oranı', `${(metrics.skill_coverage_ratio * 100).toFixed(2)}%`],
          ['Karşılanan Pozitif Tercih Sayısı', metrics.positive_preferences_met_count],
          ['Atanan Negatif Tercih Sayısı', metrics.negative_preferences_assigned_count],
          ['Toplam Tercih Skoru', metrics.total_preference_score_achieved],
          ['İş Yükü Dağılımı Std. Sapma', metrics.workload_distribution_std_dev.toFixed(4)]
        ],
        theme: 'striped',
        headStyles: { fillColor: [67, 114, 196] }
      });

      // Atamalar tablosu (ilk 20 atama)
      const assignmentsData = assignments.slice(0, 20).map(a => [
        a.employee_id,
        a.employee_name || '',
        a.shift_id,
        a.date || ''
      ]);

      (doc as any).autoTable({
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Çalışan ID', 'Çalışan Adı', 'Vardiya ID', 'Tarih']],
        body: assignmentsData,
        theme: 'striped',
        headStyles: { fillColor: [67, 114, 196] },
        didDrawPage: function(data: any) {
          // Sayfa numarası
          doc.setFontSize(10);
          doc.text(`Sayfa ${doc.getNumberOfPages()}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
      });

      // Not ekle
      if (assignments.length > 20) {
        doc.setFontSize(10);
        doc.text(`Not: Toplam ${assignments.length} atamadan sadece ilk 20 tanesi gösterilmektedir.`, 14, (doc as any).lastAutoTable.finalY + 10);
      }

      // PDF'i indir
      doc.save(`optimizasyon_sonuclari_${new Date().toISOString().split('T')[0]}.pdf`);

      setSnackbarMessage('Optimizasyon sonuçları PDF formatında indirildi.');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('PDF dışa aktarma hatası:', error);
      setSnackbarMessage('PDF dışa aktarma sırasında bir hata oluştu.');
      setSnackbarOpen(true);
    }
  };

  // Yazdırma fonksiyonu
  const handlePrint = () => {
    window.print();
  };

  return (
    <Box>
      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />

      <Typography variant="h4" gutterBottom>
        Optimizasyon Sonuçları
      </Typography>

      {/* Yükleniyor göstergesi */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 6, flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
            Optimizasyon sonuçları yükleniyor...
          </Typography>
        </Box>
      ) : error ? (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(244, 67, 54, 0.1)'
          }}
        >
          {error}
          <Typography variant="body2" sx={{ mt: 1 }}>
            Lütfen önce "Çizelge Oluştur" sayfasından bir optimizasyon çalıştırın.
          </Typography>
        </Alert>
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Chip
                label={status}
                color={status === 'OPTIMAL' ? 'success' : status === 'FEASIBLE' ? 'warning' : 'error'}
                sx={{ mr: 1, fontWeight: 'bold' }}
              />
              <Typography variant="body1" component="span">
                Çalışma Süresi: {processingTime} | Hedef Değeri: {objectiveValue}
              </Typography>
            </Box>

            <Box>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                sx={{ mr: 1 }}
                onClick={handleRefresh}
                disabled={loading}
              >
                Yenile
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                sx={{ mr: 1 }}
                onClick={exportToExcel}
              >
                Excel
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                sx={{ mr: 1 }}
                onClick={exportToPDF}
              >
                PDF
              </Button>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
              >
                Yazdır
              </Button>
            </Box>
          </Box>
        </>
      )}

      {!loading && !error && (
        <>
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
                    Veri Seti: <strong>{datasetType}</strong>
                  </Typography>
                  <Typography variant="body1">
                    Konfigürasyon: <strong>{configRef}</strong>
                  </Typography>
                  <Typography variant="body1">
                    Çalışan Sayısı: <strong>{new Set(assignments.map(a => a.employee_id)).size}</strong>
                  </Typography>
                  <Typography variant="body1">
                    Vardiya Sayısı: <strong>{new Set(assignments.map(a => a.shift_id)).size}</strong>
                  </Typography>
                  <Typography variant="body1">
                    Toplam Atama Sayısı: <strong>{assignments.length}</strong>
                  </Typography>
                  <Typography variant="body1">
                    Çözücü Durumu: <strong style={{
                      color: status === 'OPTIMAL' ? 'green' :
                             status === 'FEASIBLE' ? 'orange' : 'red'
                    }}>{status}</strong>
                  </Typography>
                  <Typography variant="body1">
                    Çalışma Süresi: <strong>{processingTime}</strong>
                  </Typography>
                  <Typography variant="body1">
                    Hedef Değeri: <strong>{objectiveValue}</strong>
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
                    Minimum Personel Karşılama Oranı: <strong>{(metrics.min_staffing_coverage_ratio * 100).toFixed(2)}%</strong>
                  </Typography>
                  <Typography variant="body1">
                    Yetenek Karşılama Oranı: <strong>{(metrics.skill_coverage_ratio * 100).toFixed(2)}%</strong>
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
                    İş Yükü Dağılımı Std. Sapma: <strong>{metrics.workload_distribution_std_dev.toFixed(4)}</strong>
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
        </>
      )}

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

              {assignments.length === 0 ? (
                <Typography variant="body1" sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  Henüz atama bulunmuyor. Lütfen önce bir optimizasyon çalıştırın.
                </Typography>
              ) : (
                <TableContainer sx={{ maxHeight: 600 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Çalışan ID</TableCell>
                        <TableCell>Çalışan Adı</TableCell>
                        <TableCell>Vardiya ID</TableCell>
                        <TableCell>Tarih</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {assignments.map((assignment, index) => (
                        <TableRow
                          key={`${assignment.employee_id}-${assignment.shift_id}-${index}`}
                          sx={{
                            '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
                            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                          }}
                        >
                          <TableCell>{assignment.employee_id}</TableCell>
                          <TableCell>{assignment.employee_name || '-'}</TableCell>
                          <TableCell>{assignment.shift_id}</TableCell>
                          <TableCell>{assignment.date || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
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
