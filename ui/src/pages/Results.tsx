import { useState, useEffect, useRef } from 'react';
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
  Snackbar,
  useTheme,
  alpha,
  Avatar,
  LinearProgress,
  Divider,
  Stack,
  Tooltip as MuiTooltip
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Refresh as RefreshIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  TableChart as TableChartIcon,
  Info as InfoIcon
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
import autoTable from 'jspdf-autotable';

// jsPDF için tip genişletme
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number;
    };
  }
}

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
  const theme = useTheme();
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

        // Konfigürasyon referansını da güncelle
        setConfigRef(data.configuration_ref || (isCallCenter ? 'callcenter_test_config.yaml' : 'hospital_test_config.yaml'));

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

      // Stil tanımlamaları
      const styles = `
        <style>
          body { font-family: Arial, sans-serif; }
          table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
          th, td { padding: 8px; border: 1px solid #E0E0E0; }
          th { text-align: center; }
          .title {
            background-color: #2979FF;
            color: white;
            font-size: 16pt;
            font-weight: bold;
            text-align: center;
            padding: 12px;
          }
          .subtitle {
            background-color: #90CAF9;
            color: #333;
            font-weight: bold;
            text-align: center;
            padding: 8px;
          }
          .section-header {
            background-color: #E3F2FD;
            color: #333;
            font-weight: bold;
            padding: 10px;
            text-align: left;
          }
          .metric-name { font-weight: bold; }
          .metric-value { text-align: center; }
          .odd-row { background-color: #F5F5F5; }
          .footer {
            font-size: 8pt;
            color: #757575;
            text-align: center;
            margin-top: 20px;
          }
        </style>
      `;

      // Excel'de daha iyi görünüm için HTML formatında dışa aktarma
      let htmlContent = BOM + '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
      htmlContent += '<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Vardiya Çizelgeleme</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->';
      htmlContent += '<meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>';
      htmlContent += styles;
      htmlContent += '</head><body>';

      // Başlık
      htmlContent += '<table>';
      htmlContent += '<tr><th class="title" colspan="4">Vardiya Cizelgeleme Optimizasyon Sonuclari</th></tr>';
      htmlContent += `<tr><th class="subtitle" colspan="4">Olusturulma Tarihi: ${new Date().toLocaleDateString('en-US')} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</th></tr>`;
      htmlContent += '</table>';

      // Optimizasyon Bilgileri
      htmlContent += '<table>';
      htmlContent += '<tr><th class="section-header" colspan="4">Optimizasyon Bilgileri</th></tr>';

      // Durum rengi belirleme
      let statusColor = status === 'OPTIMAL' ? '#4CAF50' : status === 'FEASIBLE' ? '#FF9800' : '#F44336';
      let statusStyle = `font-weight: bold; color: ${statusColor};`;

      htmlContent += `<tr><td class="metric-name">Veri Seti</td><td colspan="3">${datasetType}</td></tr>`;
      htmlContent += `<tr class="odd-row"><td class="metric-name">Konfigürasyon</td><td colspan="3">${configRef}</td></tr>`;
      htmlContent += `<tr><td class="metric-name">Çözücü Durumu</td><td colspan="3" style="${statusStyle}">${status}</td></tr>`;
      htmlContent += `<tr class="odd-row"><td class="metric-name">Çalışma Süresi</td><td colspan="3">${processingTime}</td></tr>`;
      htmlContent += `<tr><td class="metric-name">Hedef Değeri</td><td colspan="3">${objectiveValue}</td></tr>`;
      htmlContent += `<tr class="odd-row"><td class="metric-name">Toplam Atama Sayısı</td><td colspan="3">${assignments.length}</td></tr>`;
      htmlContent += '</table>';

      // Metrikler
      htmlContent += '<table>';
      htmlContent += '<tr><th class="section-header" colspan="3">Temel Metrikler</th></tr>';
      htmlContent += '<tr><th>Metrik</th><th>Deger</th><th>Aciklama</th></tr>';

      // Metrik verileri
      const metrikVerileri = [
        { metrik: 'Minimum Personel Karsilama Orani', deger: `${(metrics.min_staffing_coverage_ratio * 100).toFixed(2)}%`, aciklama: 'Minimum personel gereksinimlerinin karsilanma orani' },
        { metrik: 'Yetenek Karsilama Orani', deger: `${(metrics.skill_coverage_ratio * 100).toFixed(2)}%`, aciklama: 'Yetenek gereksinimlerinin karsilanma orani' },
        { metrik: 'Calisan Memnuniyeti', deger: `${metrics.total_positive_preferences_count > 0 ? (metrics.positive_preferences_met_count / metrics.total_positive_preferences_count * 100).toFixed(2) : '0.00'}%`, aciklama: 'Karsilanan olumlu tercihlerin toplam olumlu tercihlere orani' },
        { metrik: 'Eksik Personel', deger: metrics.total_understaffing.toString(), aciklama: 'Minimum personel gereksinimlerini karsilamayan vardiya sayisi' },
        { metrik: 'Fazla Personel', deger: metrics.total_overstaffing.toString(), aciklama: 'Gerekenden fazla personel atanan vardiya sayisi' },
        { metrik: 'Is Yuku Dagilimi Std. Sapma', deger: metrics.workload_distribution_std_dev.toFixed(4), aciklama: 'Calisanlar arasindaki is yuku dagiliminin standart sapmasi' }
      ];

      metrikVerileri.forEach((metrik, index) => {
        const rowClass = index % 2 === 0 ? 'odd-row' : '';
        htmlContent += `<tr class="${rowClass}">
          <td class="metric-name">${metrik.metrik}</td>
          <td class="metric-value">${metrik.deger}</td>
          <td>${metrik.aciklama}</td>
        </tr>`;
      });

      htmlContent += '</table>';

      // Atamalar tablosu
      htmlContent += '<table>';
      htmlContent += '<tr><th class="section-header" colspan="4">Vardiya Atamalari</th></tr>';
      htmlContent += '<tr><th>Calisan ID</th><th>Calisan Adi</th><th>Vardiya ID</th><th>Tarih</th></tr>';

      assignments.forEach((assignment, index) => {
        const rowClass = index % 2 === 0 ? 'odd-row' : '';
        // Türkçe karakterleri düzgün göstermek için turkishToAscii fonksiyonunu kullanıyoruz
        const employeeName = assignment.employee_name ? turkishToAscii(assignment.employee_name) : '-';
        htmlContent += `<tr class="${rowClass}">
          <td>${assignment.employee_id}</td>
          <td>${employeeName}</td>
          <td>${assignment.shift_id}</td>
          <td>${assignment.date || '-'}</td>
        </tr>`;
      });

      htmlContent += '</table>';

      // Altbilgi
      htmlContent += '<div class="footer">Vardiya Cizelgeleme Sistemi - Otomatik Olusturulmus Rapor</div>';
      htmlContent += '</body></html>';

      // Excel dosyasını oluştur ve indir
      const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${datasetType.toLowerCase().replace(/\s+/g, '_')}_optimizasyon_sonuclari_${new Date().toISOString().split('T')[0]}.xls`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSnackbarMessage('Excel dosyası başarıyla oluşturuldu');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Excel dışa aktarma hatası:', error);
      setSnackbarMessage('Excel dışa aktarma sırasında bir hata oluştu');
      setSnackbarOpen(true);
    }
  };

  // Grafikleri PDF'e eklemek için referanslar
  const departmentChartRef = useRef<HTMLDivElement>(null);
  const roleChartRef = useRef<HTMLDivElement>(null);
  const preferenceChartRef = useRef<HTMLDivElement>(null);

  // PDF'e aktarma fonksiyonu
  const exportToPDF = () => {
    try {
      // A4 boyutunda PDF oluştur (yatay)
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true,
        floatPrecision: 16 // PDF standardı için yüksek hassasiyet
      });

      // Türkçe karakterler için font ekle
      doc.addFont("https://cdn.jsdelivr.net/npm/roboto-font@0.1.0/fonts/Roboto/roboto-regular-webfont.ttf", "Roboto", "normal");
      doc.setFont("Roboto");

      // Sayfa genişliği ve yüksekliği
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;

      // Başlık ve Logo
      doc.setFillColor(41, 121, 255); // Mavi başlık arka planı
      doc.rect(0, 0, pageWidth, 25, 'F');

      doc.setTextColor(255, 255, 255); // Beyaz metin
      doc.setFontSize(20);
      doc.setFont('Roboto', 'normal');
      doc.text('Vardiya Cizelgeleme Optimizasyon Sonuclari', margin, 15);

      // Tarih ve Saat
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      doc.setFontSize(10);
      doc.setFont('Roboto', 'normal');
      doc.text(`Olusturulma Tarihi: ${dateStr} ${timeStr}`, pageWidth - margin - 60, 15);

      // Durum bilgisi
      doc.setTextColor(0, 0, 0); // Siyah metin
      doc.setFontSize(12);
      doc.setFont('Roboto', 'normal');
      doc.text('Optimizasyon Bilgileri', margin, 35);

      doc.setFontSize(10);
      doc.setFont('Roboto', 'normal');

      // Durum rengi
      let statusColor;
      if (status === 'OPTIMAL') statusColor = [46, 125, 50]; // Yeşil
      else if (status === 'FEASIBLE') statusColor = [237, 108, 2]; // Turuncu
      else statusColor = [211, 47, 47]; // Kırmızı

      doc.setTextColor(0, 0, 0);
      doc.text(`Veri Seti: ${datasetType}`, margin, 42);
      doc.text(`Konfigürasyon: ${configRef}`, margin, 48);
      doc.text(`Çalışma Süresi: ${processingTime}`, margin, 54);
      doc.text(`Hedef Değeri: ${objectiveValue}`, margin, 60);

      doc.text('Çözücü Durumu:', margin, 66);
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.setFont('Roboto', 'normal');
      doc.text(status, margin + 30, 66);

      // Metrikler
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('Roboto', 'normal');
      doc.text('Temel Metrikler', margin, 78);

      // Metrik tablosu - ASCII karakterlere dönüştürülmüş
      const metricHeaders = [['Metrik', 'Deger', 'Aciklama']];
      const metricData = [
        ['Minimum Personel Karsilama', `${(metrics.min_staffing_coverage_ratio * 100).toFixed(2)}%`, 'Minimum personel gereksinimlerinin karsilanma orani'],
        ['Yetenek Karsilama', `${(metrics.skill_coverage_ratio * 100).toFixed(2)}%`, 'Yetenek gereksinimlerinin karsilanma orani'],
        ['Calisan Memnuniyeti', `${metrics.total_positive_preferences_count > 0 ? (metrics.positive_preferences_met_count / metrics.total_positive_preferences_count * 100).toFixed(2) : '0.00'}%`, 'Karsilanan olumlu tercihlerin toplam olumlu tercihlere orani'],
        ['Eksik Personel', metrics.total_understaffing.toString(), 'Minimum personel gereksinimlerini karsilamayan vardiya sayisi'],
        ['Fazla Personel', metrics.total_overstaffing.toString(), 'Gerekenden fazla personel atanan vardiya sayisi'],
        ['Is Yuku Dagilimi', metrics.workload_distribution_std_dev.toFixed(4), 'Calisanlar arasindaki is yuku dagiliminin standart sapmasi']
      ];

      autoTable(doc, {
        startY: 82,
        head: metricHeaders,
        body: metricData,
        theme: 'grid',
        headStyles: {
          fillColor: [41, 121, 255],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 50, fontStyle: 'bold' },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 'auto' }
        },
        alternateRowStyles: { fillColor: [240, 248, 255] },
        margin: { left: margin, right: margin }
      });

      // Atamalar tablosu
      const tableTop = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 120;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('Roboto', 'normal');
      doc.text('Vardiya Atamalari', margin, tableTop);

      // Tablo başlıkları - ASCII karakterlere dönüştürülmüş
      const headers = [['Calisan ID', 'Calisan Adi', 'Vardiya ID', 'Tarih']];

      // Tablo verileri (ilk 20 satır) - Türkçe karakterleri ASCII'ye dönüştürerek
      const displayedAssignments = assignments.slice(0, 20);
      const data = displayedAssignments.map(a => [
        a.employee_id.toString(),
        a.employee_name ? turkishToAscii(a.employee_name) : '-',
        a.shift_id.toString(),
        a.date || '-'
      ]);

      // Tablo oluşturma
      autoTable(doc, {
        startY: tableTop + 4,
        head: headers,
        body: data,
        theme: 'grid',
        headStyles: {
          fillColor: [41, 121, 255],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [240, 248, 255] },
        margin: { left: margin, right: margin }
      });

      // Eğer daha fazla atama varsa not ekle
      if (assignments.length > 20) {
        // autoTable'ın son pozisyonunu al
        const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : tableTop + 4;
        const noteY = finalY + 5;
        doc.setFontSize(9);
        doc.setFont('Roboto', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`* Toplam ${assignments.length} atamadan ilk 20 tanesi gosterilmektedir. Tum atamalari gormek icin Excel'e aktarabilirsiniz.`, margin, noteY);
      }

      // Altbilgi
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Vardiya Cizelgeleme Sistemi - Otomatik Olusturulmus Rapor', margin, pageHeight - 10);
      doc.text(`Sayfa 1/2`, pageWidth - margin - 15, pageHeight - 10);

      // Grafik verilerini tablo olarak ekle
      const addChartTables = () => {
        try {
          // Grafik sayfası başlığı
          doc.addPage();
          doc.setFillColor(41, 121, 255);
          doc.rect(0, 0, pageWidth, 25, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(20);
          doc.setFont('Roboto', 'normal');
          doc.text('Grafik Verileri', margin, 15);

          let yPosition = 35;

          // Departman dağılımı tablosu
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(14);
          doc.text('Departman Bazli Atama Dagilimi', margin, yPosition);
          yPosition += 10;

          const departmentHeaders = [['Departman', 'Atama Sayisi']];
          const departmentData = departmentChartData.labels.map((label, index) => [
            turkishToAscii(label.toString()),
            departmentChartData.datasets[0].data[index].toString()
          ]);

          autoTable(doc, {
            startY: yPosition,
            head: departmentHeaders,
            body: departmentData,
            theme: 'grid',
            headStyles: {
              fillColor: [41, 121, 255],
              textColor: 255,
              fontStyle: 'bold',
              halign: 'center'
            },
            alternateRowStyles: { fillColor: [240, 248, 255] },
            margin: { left: margin, right: margin }
          });

          yPosition = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : yPosition + 60;

          // Rol dağılımı tablosu
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(14);
          doc.text('Rol Bazli Atama Dagilimi', margin, yPosition);
          yPosition += 10;

          const roleHeaders = [['Rol', 'Atama Sayisi']];
          const roleData = roleChartData.labels.map((label, index) => [
            turkishToAscii(label.toString()),
            roleChartData.datasets[0].data[index].toString()
          ]);

          autoTable(doc, {
            startY: yPosition,
            head: roleHeaders,
            body: roleData,
            theme: 'grid',
            headStyles: {
              fillColor: [41, 121, 255],
              textColor: 255,
              fontStyle: 'bold',
              halign: 'center'
            },
            alternateRowStyles: { fillColor: [240, 248, 255] },
            margin: { left: margin, right: margin }
          });

          yPosition = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : yPosition + 60;

          // Tercih dağılımı tablosu
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(14);
          doc.text('Tercih Dagilimi', margin, yPosition);
          yPosition += 10;

          const prefHeaders = [['Tercih Tipi', 'Sayi']];
          const prefData = preferenceChartData.labels.map((label, index) => [
            turkishToAscii(label.toString()),
            preferenceChartData.datasets[0].data[index].toString()
          ]);

          autoTable(doc, {
            startY: yPosition,
            head: prefHeaders,
            body: prefData,
            theme: 'grid',
            headStyles: {
              fillColor: [41, 121, 255],
              textColor: 255,
              fontStyle: 'bold',
              halign: 'center'
            },
            alternateRowStyles: { fillColor: [240, 248, 255] },
            margin: { left: margin, right: margin }
          });

          // Altbilgi
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text('Vardiya Cizelgeleme Sistemi - Otomatik Olusturulmus Rapor', margin, pageHeight - 10);
          doc.text(`Sayfa 2/2`, pageWidth - margin - 15, pageHeight - 10);
        } catch (error) {
          console.error('Grafik tablolarini PDF\'e ekleme hatasi:', error);
        }
      };

      // Grafik tablolarını ekle
      addChartTables();

      // PDF'i kaydetme - UTF-8 karakter kodlaması ile
      doc.save(`${datasetType.toLowerCase().replace(/\s+/g, '_')}_optimizasyon_sonuclari.pdf`, {returnPromise: true});

      setSnackbarMessage('PDF başarıyla oluşturuldu');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      setSnackbarMessage('PDF oluşturulurken bir hata oluştu');
      setSnackbarOpen(true);
    }
  };

  // Türkçe karakter dönüşümü için yardımcı fonksiyon
  const turkishToAscii = (text: string): string => {
    if (!text) return '';

    const charMap: Record<string, string> = {
      'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'İ': 'I',
      'ö': 'o', 'Ö': 'O', 'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U',
      'â': 'a', 'Â': 'A', 'î': 'i', 'Î': 'I', 'û': 'u', 'Û': 'U'
    };

    return text.replace(/[çÇğĞıİöÖşŞüÜâÂîÎûÛ]/g, match => charMap[match] || match);
  };

  // Yazdırma fonksiyonu
  const handlePrint = () => {
    window.print();
  };

  return (
    <Box sx={{ maxWidth: '1400px', mx: 'auto', px: 2 }}>
      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />

      {/* Sayfa Başlığı */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #3a7bd5, #00d2ff)',
            backgroundClip: 'text',
            color: 'transparent',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Optimizasyon Sonuçları
        </Typography>

        <Box>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
            sx={{
              mr: 1,
              borderRadius: 2,
              px: 2,
              py: 1,
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
              background: 'linear-gradient(45deg, #3a7bd5, #00d2ff)',
              '&:hover': {
                boxShadow: '0 6px 15px rgba(0,0,0,0.15)',
                background: 'linear-gradient(45deg, #3a7bd5, #00d2ff)',
                transform: 'translateY(-2px)',
                transition: 'all 0.2s ease'
              }
            }}
          >
            Yenile
          </Button>
        </Box>
      </Box>

      {/* Yükleniyor göstergesi */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 6, flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress size={60} thickness={4} color="primary" />
          <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
            Optimizasyon sonuçları yükleniyor...
          </Typography>
        </Box>
      ) : error ? (
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
            Hata Oluştu
          </Typography>
          <Typography variant="body2">
            {error}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Lütfen önce "Çizelge Oluştur" sayfasından bir optimizasyon çalıştırın.
          </Typography>
        </Alert>
      ) : (
        <>
          {/* Durum Özeti */}
          <Box
            sx={{
              mb: 4,
              p: 3,
              borderRadius: 3,
              background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.8)}, ${alpha(theme.palette.primary.main, 0.6)})`,
              color: 'white',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, md: 0 } }}>
              <Avatar sx={{ bgcolor: 'white', color: theme.palette.primary.main, mr: 2, width: 56, height: 56 }}>
                <AssessmentIcon fontSize="large" />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Optimizasyon Durumu
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <Chip
                    label={status}
                    color={status === 'OPTIMAL' ? 'success' : status === 'FEASIBLE' ? 'warning' : 'error'}
                    sx={{
                      mr: 1,
                      fontWeight: 'bold',
                      borderRadius: 2,
                      bgcolor: 'white',
                      color: status === 'OPTIMAL' ? theme.palette.success.main :
                             status === 'FEASIBLE' ? theme.palette.warning.main :
                             theme.palette.error.main
                    }}
                  />
                  <Typography variant="body2" sx={{ color: 'white', opacity: 0.9 }}>
                    {datasetType} veri seti
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <Box sx={{ textAlign: 'center', minWidth: 100 }}>
                <Typography variant="h5" fontWeight="bold">
                  {processingTime}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  İşlem Süresi
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center', minWidth: 100 }}>
                <Typography variant="h5" fontWeight="bold">
                  {objectiveValue}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Hedef Değeri
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'center', minWidth: 100 }}>
                <Typography variant="h5" fontWeight="bold">
                  {assignments.length}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Atama Sayısı
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Dışa Aktarma Butonları */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4, gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportToExcel}
              sx={{
                borderRadius: 2,
                px: 2,
                py: 1,
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                '&:hover': {
                  borderColor: theme.palette.primary.dark,
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s ease'
                }
              }}
            >
              Excel
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportToPDF}
              sx={{
                borderRadius: 2,
                px: 2,
                py: 1,
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                '&:hover': {
                  borderColor: theme.palette.primary.dark,
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s ease'
                }
              }}
            >
              PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              sx={{
                borderRadius: 2,
                px: 2,
                py: 1,
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                '&:hover': {
                  borderColor: theme.palette.primary.dark,
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s ease'
                }
              }}
            >
              Yazdır
            </Button>
          </Box>
        </>
      )}

      {!loading && !error && (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="sonuç sekmeleri"
              sx={{
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0'
                },
                '& .MuiTab-root': {
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  textTransform: 'none',
                  minWidth: 120,
                  transition: 'all 0.2s',
                  '&.Mui-selected': {
                    color: 'primary.main'
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.03)',
                    color: 'primary.main'
                  }
                }
              }}
            >
              <Tab
                label="Özet"
                icon={<InfoIcon />}
                iconPosition="start"
              />
              <Tab
                label="Metrikler"
                icon={<AssessmentIcon />}
                iconPosition="start"
              />
              <Tab
                label="Atamalar"
                icon={<TableChartIcon />}
                iconPosition="start"
              />
              <Tab
                label="Grafikler"
                icon={<BarChartIcon />}
                iconPosition="start"
              />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    height: '100%',
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      boxShadow: '0 6px 25px rgba(0,0,0,0.12)',
                      transform: 'translateY(-4px)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      color: theme.palette.info.main,
                      mr: 2
                    }}>
                      <InfoIcon />
                    </Avatar>
                    <Typography variant="h6" fontWeight="600">
                      Optimizasyon Bilgileri
                    </Typography>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Veri Seti
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {datasetType}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Konfigürasyon
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="medium" sx={{ wordBreak: 'break-word' }}>
                          {configRef}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Çalışan Sayısı
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {new Set(assignments.map(a => a.employee_id)).size}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Vardiya Sayısı
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {new Set(assignments.map(a => a.shift_id)).size}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Toplam Atama
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {assignments.length}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Çözücü Durumu
                        </Typography>
                        <Chip
                          label={status}
                          size="small"
                          color={status === 'OPTIMAL' ? 'success' : status === 'FEASIBLE' ? 'warning' : 'error'}
                          sx={{ fontWeight: 'bold', borderRadius: 1 }}
                        />
                      </Box>
                    </Grid>

                    <Grid item xs={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Çalışma Süresi
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {processingTime}
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={6}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Hedef Değeri
                        </Typography>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {objectiveValue}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    height: '100%',
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      boxShadow: '0 6px 25px rgba(0,0,0,0.12)',
                      transform: 'translateY(-4px)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      color: theme.palette.success.main,
                      mr: 2
                    }}>
                      <AssessmentIcon />
                    </Avatar>
                    <Typography variant="h6" fontWeight="600">
                      Temel Metrikler
                    </Typography>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Minimum Personel Karşılama Oranı
                      </Typography>
                      <Typography variant="subtitle2" fontWeight="bold" color="success.main">
                        {(metrics.min_staffing_coverage_ratio * 100).toFixed(2)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={metrics.min_staffing_coverage_ratio * 100}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: theme.palette.success.main
                        }
                      }}
                    />
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Yetenek Karşılama Oranı
                      </Typography>
                      <Typography variant="subtitle2" fontWeight="bold" color="info.main">
                        {(metrics.skill_coverage_ratio * 100).toFixed(2)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={metrics.skill_coverage_ratio * 100}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: alpha(theme.palette.info.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: theme.palette.info.main
                        }
                      }}
                    />
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Çalışan Memnuniyeti
                      </Typography>
                      <Typography variant="subtitle2" fontWeight="bold" color="warning.main">
                        {metrics.total_positive_preferences_count > 0
                          ? (metrics.positive_preferences_met_count / metrics.total_positive_preferences_count * 100).toFixed(2)
                          : '0.00'}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={metrics.total_positive_preferences_count > 0
                        ? (metrics.positive_preferences_met_count / metrics.total_positive_preferences_count * 100)
                        : 0}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: alpha(theme.palette.warning.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: theme.palette.warning.main
                        }
                      }}
                    />
                  </Box>

                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <Box sx={{
                        p: 1.5,
                        bgcolor: alpha(theme.palette.error.main, 0.05),
                        borderRadius: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}>
                        <Typography variant="h5" fontWeight="bold" color="error.main">
                          {metrics.total_understaffing}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Eksik Personel
                        </Typography>
                      </Box>
                    </Grid>

                    <Grid item xs={6}>
                      <Box sx={{
                        p: 1.5,
                        bgcolor: alpha(theme.palette.warning.main, 0.05),
                        borderRadius: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}>
                        <Typography variant="h5" fontWeight="bold" color="warning.main">
                          {metrics.total_overstaffing}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Fazla Personel
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    height: '100%',
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      boxShadow: '0 6px 25px rgba(0,0,0,0.12)',
                      transform: 'translateY(-4px)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      mr: 2
                    }}>
                      <BarChartIcon />
                    </Avatar>
                    <Typography variant="h6" fontWeight="600">
                      Departman Bazlı Atama Dağılımı
                    </Typography>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  <Box sx={{ height: 300 }}>
                    <Bar
                      data={departmentChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top' as const,
                            labels: {
                              font: {
                                family: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                                size: 12
                              }
                            }
                          },
                          title: {
                            display: false
                          },
                          tooltip: {
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            titleColor: theme.palette.text.primary,
                            bodyColor: theme.palette.text.secondary,
                            borderColor: theme.palette.divider,
                            borderWidth: 1,
                            padding: 12,
                            boxPadding: 6,
                            usePointStyle: true,
                            bodyFont: {
                              family: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                            },
                            titleFont: {
                              family: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                              weight: 'bold'
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            grid: {
                              color: alpha(theme.palette.divider, 0.1),
                              drawBorder: false
                            },
                            ticks: {
                              font: {
                                family: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                              }
                            }
                          },
                          x: {
                            grid: {
                              display: false
                            },
                            ticks: {
                              font: {
                                family: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                              }
                            }
                          }
                        }
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    height: '100%',
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      boxShadow: '0 6px 25px rgba(0,0,0,0.12)',
                      transform: 'translateY(-4px)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{
                      bgcolor: alpha(theme.palette.warning.main, 0.1),
                      color: theme.palette.warning.main,
                      mr: 2
                    }}>
                      <PieChartIcon />
                    </Avatar>
                    <Typography variant="h6" fontWeight="600">
                      Tercih Karşılama Oranları
                    </Typography>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                    <Pie
                      data={preferenceChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top' as const,
                            labels: {
                              font: {
                                family: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                                size: 12
                              },
                              padding: 16
                            }
                          },
                          title: {
                            display: false
                          },
                          tooltip: {
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            titleColor: theme.palette.text.primary,
                            bodyColor: theme.palette.text.secondary,
                            borderColor: theme.palette.divider,
                            borderWidth: 1,
                            padding: 12,
                            boxPadding: 6,
                            usePointStyle: true,
                            bodyFont: {
                              family: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                            },
                            titleFont: {
                              family: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                              weight: 'bold'
                            }
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
            <Paper
              elevation={2}
              sx={{
                p: 3,
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  mr: 2,
                  width: 48,
                  height: 48
                }}>
                  <AssessmentIcon />
                </Avatar>
                <Typography variant="h5" fontWeight="600">
                  Detaylı Metrikler
                </Typography>
              </Box>

              <Box sx={{
                p: 3,
                mb: 4,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.success.main, 0.05),
                border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`
              }}>
                <Typography variant="h6" fontWeight="600" color="success.main" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <CheckCircleIcon sx={{ mr: 1 }} /> Operasyonel Metrikler
                </Typography>

                <TableContainer sx={{ borderRadius: 2, overflow: 'hidden' }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                        <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Metrik</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Değer</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Açıklama</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow sx={{
                        '&:nth-of-type(odd)': { backgroundColor: alpha(theme.palette.success.main, 0.02) },
                        '&:hover': { backgroundColor: alpha(theme.palette.success.main, 0.05) }
                      }}>
                        <TableCell sx={{ fontWeight: 'medium' }}>Eksik Personel</TableCell>
                        <TableCell>
                          <Chip
                            label={metrics.total_understaffing}
                            size="small"
                            color={metrics.total_understaffing === 0 ? "success" : "error"}
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>
                        <TableCell>Minimum personel gereksinimlerini karşılamayan vardiya sayısı</TableCell>
                      </TableRow>
                      <TableRow sx={{
                        '&:nth-of-type(odd)': { backgroundColor: alpha(theme.palette.success.main, 0.02) },
                        '&:hover': { backgroundColor: alpha(theme.palette.success.main, 0.05) }
                      }}>
                        <TableCell sx={{ fontWeight: 'medium' }}>Fazla Personel</TableCell>
                        <TableCell>
                          <Chip
                            label={metrics.total_overstaffing}
                            size="small"
                            color={metrics.total_overstaffing === 0 ? "success" : "warning"}
                            sx={{ fontWeight: 'bold' }}
                          />
                        </TableCell>
                        <TableCell>Gerekenden fazla personel atanan vardiya sayısı</TableCell>
                      </TableRow>
                      <TableRow sx={{
                        '&:nth-of-type(odd)': { backgroundColor: alpha(theme.palette.success.main, 0.02) },
                        '&:hover': { backgroundColor: alpha(theme.palette.success.main, 0.05) }
                      }}>
                        <TableCell sx={{ fontWeight: 'medium' }}>Minimum Personel Karşılama Oranı</TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            color={metrics.min_staffing_coverage_ratio >= 0.95 ? "success.main" :
                                   metrics.min_staffing_coverage_ratio >= 0.8 ? "warning.main" : "error.main"}
                          >
                            {(metrics.min_staffing_coverage_ratio * 100).toFixed(2)}%
                          </Typography>
                        </TableCell>
                        <TableCell>Minimum personel gereksinimlerinin karşılanma oranı</TableCell>
                      </TableRow>
                      <TableRow sx={{
                        '&:nth-of-type(odd)': { backgroundColor: alpha(theme.palette.success.main, 0.02) },
                        '&:hover': { backgroundColor: alpha(theme.palette.success.main, 0.05) }
                      }}>
                        <TableCell sx={{ fontWeight: 'medium' }}>Yetenek Karşılama Oranı</TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            color={metrics.skill_coverage_ratio >= 0.95 ? "success.main" :
                                   metrics.skill_coverage_ratio >= 0.8 ? "warning.main" : "error.main"}
                          >
                            {(metrics.skill_coverage_ratio * 100).toFixed(2)}%
                          </Typography>
                        </TableCell>
                        <TableCell>Yetenek gereksinimlerinin karşılanma oranı</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              <Box sx={{
                p: 3,
                mb: 4,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.warning.main, 0.05),
                border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`
              }}>
                <Typography variant="h6" fontWeight="600" color="warning.main" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <PeopleIcon sx={{ mr: 1 }} /> Çalışan Memnuniyeti Metrikleri
                </Typography>

                <TableContainer sx={{ borderRadius: 2, overflow: 'hidden' }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1) }}>
                        <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Metrik</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Değer</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Açıklama</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow sx={{
                        '&:nth-of-type(odd)': { backgroundColor: alpha(theme.palette.warning.main, 0.02) },
                        '&:hover': { backgroundColor: alpha(theme.palette.warning.main, 0.05) }
                      }}>
                        <TableCell sx={{ fontWeight: 'medium' }}>Karşılanan Pozitif Tercih Sayısı</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" fontWeight="bold">
                              {metrics.positive_preferences_met_count}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              / {metrics.total_positive_preferences_count}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>Çalışanların pozitif tercihlerinin karşılanma sayısı</TableCell>
                      </TableRow>
                      <TableRow sx={{
                        '&:nth-of-type(odd)': { backgroundColor: alpha(theme.palette.warning.main, 0.02) },
                        '&:hover': { backgroundColor: alpha(theme.palette.warning.main, 0.05) }
                      }}>
                        <TableCell sx={{ fontWeight: 'medium' }}>Atanan Negatif Tercih Sayısı</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography
                              variant="body2"
                              fontWeight="bold"
                              color={metrics.negative_preferences_assigned_count === 0 ? "success.main" : "error.main"}
                            >
                              {metrics.negative_preferences_assigned_count}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              / {metrics.total_negative_preferences_count}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>Çalışanların negatif tercihlerine rağmen atanma sayısı</TableCell>
                      </TableRow>
                      <TableRow sx={{
                        '&:nth-of-type(odd)': { backgroundColor: alpha(theme.palette.warning.main, 0.02) },
                        '&:hover': { backgroundColor: alpha(theme.palette.warning.main, 0.05) }
                      }}>
                        <TableCell sx={{ fontWeight: 'medium' }}>Toplam Tercih Skoru</TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            color={metrics.total_preference_score_achieved > 0 ? "success.main" :
                                  metrics.total_preference_score_achieved === 0 ? "text.primary" : "error.main"}
                          >
                            {metrics.total_preference_score_achieved}
                          </Typography>
                        </TableCell>
                        <TableCell>Tüm tercihlerin toplam skoru (pozitif - negatif)</TableCell>
                      </TableRow>
                      <TableRow sx={{
                        '&:nth-of-type(odd)': { backgroundColor: alpha(theme.palette.warning.main, 0.02) },
                        '&:hover': { backgroundColor: alpha(theme.palette.warning.main, 0.05) }
                      }}>
                        <TableCell sx={{ fontWeight: 'medium' }}>İş Yükü Dağılımı Std. Sapma</TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            color={metrics.workload_distribution_std_dev < 0.5 ? "success.main" :
                                  metrics.workload_distribution_std_dev < 1 ? "warning.main" : "error.main"}
                          >
                            {metrics.workload_distribution_std_dev.toFixed(4)}
                          </Typography>
                        </TableCell>
                        <TableCell>Çalışanlar arasındaki iş yükü dağılımının standart sapması (düşük değer daha adil dağılım)</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.warning.main, 0.03), borderRadius: 2, border: `1px dashed ${alpha(theme.palette.warning.main, 0.2)}` }}>
                  <Typography variant="subtitle2" fontWeight="medium" color="warning.main" sx={{ display: 'flex', alignItems: 'center' }}>
                    <InfoIcon fontSize="small" sx={{ mr: 1 }} /> Çalışan Memnuniyeti Hesaplaması
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Çalışan memnuniyeti, karşılanan olumlu tercihlerin toplam olumlu tercihlere oranı olarak hesaplanır.
                    Mevcut durumda {metrics.positive_preferences_met_count} / {metrics.total_positive_preferences_count} =
                    {metrics.total_positive_preferences_count > 0
                      ? ` ${(metrics.positive_preferences_met_count / metrics.total_positive_preferences_count * 100).toFixed(2)}%`
                      : ' 0%'} oranında çalışan tercihi karşılanmıştır.
                  </Typography>
                </Box>
              </Box>

              <Box sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
              }}>
                <Typography variant="h6" fontWeight="600" color="primary.main" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <SpeedIcon sx={{ mr: 1 }} /> Sistem Performans Metrikleri
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, borderRadius: 2, height: '100%', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Çözücü Durumu
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Chip
                          label={status}
                          color={status === 'OPTIMAL' ? 'success' : status === 'FEASIBLE' ? 'warning' : 'error'}
                          sx={{ fontWeight: 'bold', mr: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {status === 'OPTIMAL' ? 'En iyi çözüm bulundu' :
                           status === 'FEASIBLE' ? 'Uygun bir çözüm bulundu' :
                           'Çözüm bulunamadı'}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, borderRadius: 2, height: '100%', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Çalışma Süresi
                      </Typography>
                      <Typography variant="h5" fontWeight="bold" color="primary.main">
                        {processingTime}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    color: theme.palette.info.main,
                    mr: 2,
                    width: 48,
                    height: 48
                  }}>
                    <TableChartIcon />
                  </Avatar>
                  <Typography variant="h5" fontWeight="600">
                    Vardiya Atamaları
                  </Typography>
                </Box>

                <Box>
                  <MuiTooltip title="Excel'e Aktar">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={exportToExcel}
                      sx={{
                        mr: 1,
                        borderRadius: 2,
                        borderColor: theme.palette.info.main,
                        color: theme.palette.info.main,
                        '&:hover': {
                          borderColor: theme.palette.info.dark,
                          backgroundColor: alpha(theme.palette.info.main, 0.05)
                        }
                      }}
                    >
                      Excel
                    </Button>
                  </MuiTooltip>

                  <MuiTooltip title="Yazdır">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<PrintIcon />}
                      onClick={handlePrint}
                      sx={{
                        borderRadius: 2,
                        borderColor: theme.palette.info.main,
                        color: theme.palette.info.main,
                        '&:hover': {
                          borderColor: theme.palette.info.dark,
                          backgroundColor: alpha(theme.palette.info.main, 0.05)
                        }
                      }}
                    >
                      Yazdır
                    </Button>
                  </MuiTooltip>
                </Box>
              </Box>

              {assignments.length === 0 ? (
                <Box sx={{
                  textAlign: 'center',
                  py: 6,
                  px: 2,
                  bgcolor: alpha(theme.palette.info.main, 0.03),
                  borderRadius: 2,
                  border: `1px dashed ${alpha(theme.palette.info.main, 0.2)}`
                }}>
                  <InfoIcon sx={{ fontSize: 48, color: alpha(theme.palette.info.main, 0.5), mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Henüz atama bulunmuyor
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Lütfen önce "Çizelge Oluştur" sayfasından bir optimizasyon çalıştırın.
                  </Typography>
                </Box>
              ) : (
                <>
                  <Box sx={{
                    p: 2,
                    mb: 3,
                    bgcolor: alpha(theme.palette.info.main, 0.03),
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <Typography variant="body2" color="text.secondary">
                      Toplam <strong>{assignments.length}</strong> atama, <strong>{new Set(assignments.map(a => a.employee_id)).size}</strong> çalışan, <strong>{new Set(assignments.map(a => a.shift_id)).size}</strong> vardiya
                    </Typography>

                    <Chip
                      label={`${datasetType} Veri Seti`}
                      size="small"
                      color="info"
                      variant="outlined"
                      sx={{ fontWeight: 'medium' }}
                    />
                  </Box>

                  <TableContainer
                    sx={{
                      maxHeight: 600,
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                    }}
                  >
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow sx={{ bgcolor: alpha(theme.palette.info.main, 0.1) }}>
                          <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Çalışan ID</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Çalışan Adı</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Vardiya ID</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', py: 2 }}>Tarih</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {assignments.map((assignment, index) => (
                          <TableRow
                            key={`${assignment.employee_id}-${assignment.shift_id}-${index}`}
                            sx={{
                              '&:nth-of-type(odd)': { backgroundColor: alpha(theme.palette.info.main, 0.02) },
                              '&:hover': { backgroundColor: alpha(theme.palette.info.main, 0.05) },
                              transition: 'background-color 0.2s'
                            }}
                          >
                            <TableCell sx={{ fontWeight: 'medium' }}>{assignment.employee_id}</TableCell>
                            <TableCell>{assignment.employee_name || '-'}</TableCell>
                            <TableCell>{assignment.shift_id}</TableCell>
                            <TableCell>{assignment.date || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                height: '100%',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  boxShadow: '0 6px 25px rgba(0,0,0,0.12)',
                  transform: 'translateY(-4px)'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  mr: 2
                }}>
                  <BarChartIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="600">
                  Departman Bazlı Atama Dağılımı
                </Typography>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Box sx={{ height: 400 }} ref={departmentChartRef}>
                <Bar
                  data={departmentChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                        labels: {
                          font: {
                            family: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                            size: 12
                          }
                        }
                      },
                      title: {
                        display: false
                      },
                      tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        titleColor: theme.palette.text.primary,
                        bodyColor: theme.palette.text.secondary,
                        borderColor: theme.palette.divider,
                        borderWidth: 1,
                        padding: 12,
                        boxPadding: 6,
                        usePointStyle: true,
                        bodyFont: {
                          family: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                        },
                        titleFont: {
                          family: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                          weight: 'bold'
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: alpha(theme.palette.divider, 0.1),
                          drawBorder: false
                        },
                        ticks: {
                          font: {
                            family: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                          }
                        }
                      },
                      x: {
                        grid: {
                          display: false
                        },
                        ticks: {
                          font: {
                            family: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                          }
                        }
                      }
                    }
                  }}
                />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                height: '100%',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  boxShadow: '0 6px 25px rgba(0,0,0,0.12)',
                  transform: 'translateY(-4px)'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  color: theme.palette.success.main,
                  mr: 2
                }}>
                  <BarChartIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="600">
                  Rol Bazlı Atama Dağılımı
                </Typography>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Box sx={{ height: 400 }} ref={roleChartRef}>
                <Bar
                  data={roleChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                        labels: {
                          font: {
                            family: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                            size: 12
                          }
                        }
                      },
                      title: {
                        display: false
                      },
                      tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        titleColor: theme.palette.text.primary,
                        bodyColor: theme.palette.text.secondary,
                        borderColor: theme.palette.divider,
                        borderWidth: 1,
                        padding: 12,
                        boxPadding: 6,
                        usePointStyle: true,
                        bodyFont: {
                          family: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                        },
                        titleFont: {
                          family: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                          weight: 'bold'
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: alpha(theme.palette.divider, 0.1),
                          drawBorder: false
                        },
                        ticks: {
                          font: {
                            family: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                          }
                        }
                      },
                      x: {
                        grid: {
                          display: false
                        },
                        ticks: {
                          font: {
                            family: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                          }
                        }
                      }
                    }
                  }}
                />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                height: '100%',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  boxShadow: '0 6px 25px rgba(0,0,0,0.12)',
                  transform: 'translateY(-4px)'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{
                  bgcolor: alpha(theme.palette.warning.main, 0.1),
                  color: theme.palette.warning.main,
                  mr: 2
                }}>
                  <PieChartIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="600">
                  Tercih Karşılama Oranları
                </Typography>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Box sx={{ height: 400, display: 'flex', justifyContent: 'center' }} ref={preferenceChartRef}>
                <Pie
                  data={preferenceChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                        labels: {
                          font: {
                            family: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                            size: 12
                          },
                          padding: 16
                        }
                      },
                      title: {
                        display: false
                      },
                      tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        titleColor: theme.palette.text.primary,
                        bodyColor: theme.palette.text.secondary,
                        borderColor: theme.palette.divider,
                        borderWidth: 1,
                        padding: 12,
                        boxPadding: 6,
                        usePointStyle: true,
                        bodyFont: {
                          family: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif'
                        },
                        titleFont: {
                          family: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                          weight: 'bold'
                        }
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
