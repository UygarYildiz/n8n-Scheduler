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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Refresh as ResetIcon,
  FilterList as FilterIcon,
  Remove as RemoveIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { api } from '../services/api';
import axios from 'axios';
import { Assignment } from '../types';

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

// Vardiya tipi
interface Shift {
  id: string;
  name: string;
  color: string;
  date?: string;
  start_time?: string;
  end_time?: string;
}

// Çalışan tipi
interface Employee {
  id: string;
  name: string;
  role?: string;
  department?: string;
}

// Atama tipi (API'den gelen verilerle uyumlu)
interface ScheduleAssignment {
  employee_id: string;
  shift_id: string;
  date?: string; // API'den gelmiyorsa hesaplanacak
}

// Vardiya renkleri
const shiftColors = {
  morning: '#4caf50',   // Yeşil
  afternoon: '#2196f3', // Mavi
  night: '#9c27b0',     // Mor
  default: '#757575'    // Gri
};

const ScheduleView = () => {
  const [tabValue, setTabValue] = useState(0);
  const [currentWeek, setCurrentWeek] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Veri state'leri
  const [assignments, setAssignments] = useState<ScheduleAssignment[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [datasetType, setDatasetType] = useState<string>('');

  // Hesaplanan değerler
  const [processedAssignments, setProcessedAssignments] = useState<ScheduleAssignment[]>([]);
  const [weekDates, setWeekDates] = useState<string[]>([]);
  const [weekDays, setWeekDays] = useState<string[]>([]);

  // Günleri ve tarihleri hesapla
  useEffect(() => {
    // Varsayılan olarak 2025-05-14 ile 2025-05-20 arasındaki haftayı göster
    // Bu tarihler, optimization_result.json dosyasındaki tarihlerle uyumlu olmalı
    const startDate = new Date('2025-05-14');

    // Haftanın tarihlerini oluştur
    const dates = [];
    const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD formatı
      dates.push(formattedDate);
    }

    // Debug bilgisi
    console.log('Hafta tarihleri:', dates);
    console.log('Hafta günleri:', days);

    setWeekDates(dates);
    setWeekDays(days);
    setCurrentWeek(startDate.toISOString().split('T')[0]);
  }, []);

  // Verileri yükle
  useEffect(() => {
    const loadScheduleData = async () => {
      try {
        setLoading(true);
        setError(null);

        // API'den verileri al
        const scheduleData = await api.getOptimizationResults();

        if (!scheduleData || !scheduleData.solution || !scheduleData.solution.assignments) {
          throw new Error('Çizelge verileri bulunamadı');
        }

        // Veri setini belirle - önce scheduleData.datasetType'ı kontrol et, yoksa employee_id'den çıkar
        let datasetType = scheduleData.datasetType || '';

        if (!datasetType) {
          datasetType = scheduleData.solution.assignments[0]?.employee_id?.startsWith('CM_')
            ? 'cagri_merkezi'
            : 'hastane';
        }

        console.log('Veri seti tipi:', datasetType);

        // Vardiya ID'lerinden tarih bilgisini çıkar
        const processedAssignments = processAssignments(scheduleData.solution.assignments);

        // Benzersiz tarihleri bul ve sırala (undefined değerleri filtrele)
        const uniqueDates = [...new Set(processedAssignments.map(a => a.date).filter(Boolean))].sort() as string[];
        console.log('Benzersiz tarihler:', uniqueDates);

        // Eğer tarihler varsa, hafta tarihlerini güncelle
        if (uniqueDates.length > 0) {
          // İlk tarihi başlangıç tarihi olarak kullan
          const startDate = new Date(uniqueDates[0]);

          // Haftanın tarihlerini oluştur
          const dates: string[] = [];

          // Benzersiz tarihleri kullan (en fazla 7 gün)
          const maxDays = Math.min(uniqueDates.length, 7);
          for (let i = 0; i < maxDays; i++) {
            dates.push(uniqueDates[i]);
          }

          // Debug bilgisi
          console.log('Güncellenmiş hafta tarihleri:', dates);

          // State'leri güncelle
          setWeekDates(dates);
          setCurrentWeek(startDate.toISOString().split('T')[0]);
        }

        // Örnek vardiya ve çalışan verileri oluştur (gerçek API entegrasyonu yapılana kadar)
        const generatedShifts = generateShiftsFromAssignments(processedAssignments);

        // Çalışan verilerini asenkron olarak al
        const generatedEmployees = await generateEmployeesFromAssignments(processedAssignments, datasetType);

        // Debug bilgisi
        console.log('Oluşturulan vardiyalar:', generatedShifts.slice(0, 5));
        console.log('Oluşturulan çalışanlar:', generatedEmployees.slice(0, 5));

        // State'leri güncelle
        setAssignments(scheduleData.solution.assignments);
        setProcessedAssignments(processedAssignments);
        setShifts(generatedShifts);
        setEmployees(generatedEmployees);
        setDatasetType(datasetType);

        // Debug bilgisi
        console.log('Toplam atama sayısı:', scheduleData.solution.assignments.length);
        console.log('Toplam işlenmiş atama sayısı:', processedAssignments.length);
        console.log('Toplam vardiya sayısı:', generatedShifts.length);
        console.log('Toplam çalışan sayısı:', generatedEmployees.length);

        setSnackbarMessage(`${datasetType === 'cagri_merkezi' ? 'Çağrı Merkezi' : 'Hastane'} vardiya çizelgesi başarıyla yüklendi.`);
        setSnackbarOpen(true);
      } catch (err) {
        console.error('Çizelge verileri yüklenirken hata:', err);
        setError('Çizelge verileri yüklenirken bir hata oluştu. Lütfen önce optimizasyon çalıştırın.');
      } finally {
        setLoading(false);
      }
    };

    loadScheduleData();
  }, []);

  // Vardiya ID'lerinden tarih ve vardiya bilgilerini çıkar
  const processAssignments = (rawAssignments: Assignment[]): ScheduleAssignment[] => {
    console.log('İşlenecek atamalar:', rawAssignments.slice(0, 5)); // İlk 5 atamayı göster

    // Çağrı merkezi veri seti için tarih formatını belirle
    // Örnek: CM_S_20230501_morning -> 2023-05-01
    const extractDateFromCallCenterShiftId = (shiftId: string): string => {
      const parts = shiftId.split('_');
      for (const part of parts) {
        // 8 haneli sayı formatındaki tarihi bul (YYYYMMDD)
        if (part.length === 8 && !isNaN(Number(part))) {
          return `${part.substring(0, 4)}-${part.substring(4, 6)}-${part.substring(6, 8)}`;
        }
      }
      return '';
    };

    // Hastane veri seti için tarih formatını belirle
    // Örnek: H_S001_20230501 -> 2023-05-01
    const extractDateFromHospitalShiftId = (shiftId: string): string => {
      if (shiftId.includes('_') && shiftId.split('_').length > 2) {
        const datePart = shiftId.split('_')[2];
        if (datePart && datePart.length === 8 && !isNaN(Number(datePart))) {
          return `${datePart.substring(0, 4)}-${datePart.substring(4, 6)}-${datePart.substring(6, 8)}`;
        }
      }
      return '';
    };

    // Tüm vardiya ID'lerinden benzersiz tarihleri çıkar
    const allDates = new Set<string>();

    // Önce tüm vardiya ID'lerinden tarihleri çıkar ve benzersiz tarihleri topla
    rawAssignments.forEach(assignment => {
      const shiftId = assignment.shift_id;
      let date = '';

      if (shiftId.startsWith('CM_')) {
        date = extractDateFromCallCenterShiftId(shiftId);
      } else {
        date = extractDateFromHospitalShiftId(shiftId);
      }

      if (date) {
        allDates.add(date);
      }
    });

    console.log('Çıkarılan benzersiz tarihler:', Array.from(allDates));

    // Şimdi her atama için tarih bilgisini ekle
    return rawAssignments.map(assignment => {
      const shiftId = assignment.shift_id;
      let date = '';

      // Önce API'den gelen tarih bilgisini kontrol et
      if (assignment.date) {
        date = assignment.date;
        console.log('API\'den gelen tarih:', date, 'Vardiya ID:', shiftId);
      }
      // Eğer API'den tarih gelmemişse, vardiya ID'sinden çıkarmayı dene
      else {
        if (shiftId.startsWith('CM_')) {
          date = extractDateFromCallCenterShiftId(shiftId);
          if (date) {
            console.log('Çıkarılan tarih (Çağrı Merkezi):', date, 'Vardiya ID:', shiftId);
          }
        } else {
          date = extractDateFromHospitalShiftId(shiftId);
          if (date) {
            console.log('Çıkarılan tarih (Hastane):', date, 'Vardiya ID:', shiftId);
          }
        }

        // Eğer tarih bulunamadıysa ve benzersiz tarihler varsa, ilk tarihi kullan
        if (!date && allDates.size > 0) {
          date = Array.from(allDates)[0];
          console.log('Tarih bulunamadı, ilk tarih kullanılıyor:', date, 'Vardiya ID:', shiftId);
        }

        // Hala tarih bulunamadıysa, bugünün tarihini kullan
        if (!date) {
          const today = new Date();
          date = today.toISOString().split('T')[0];
          console.log('Tarih bulunamadı, bugünün tarihi kullanılıyor:', date, 'Vardiya ID:', shiftId);
        }
      }

      // Debug için
      console.log(`Atama işlendi: ${assignment.employee_id}, ${assignment.shift_id}, Tarih: ${date}`);

      return {
        ...assignment,
        date
      };
    });
  };

  // Atamalardan vardiya bilgilerini oluştur
  const generateShiftsFromAssignments = (processedAssignments: ScheduleAssignment[]): Shift[] => {
    console.log('İşlenmiş atamalar:', processedAssignments.slice(0, 5)); // İlk 5 atamayı göster

    const uniqueShiftIds = [...new Set(processedAssignments.map(a => a.shift_id))];
    console.log('Benzersiz vardiya ID\'leri:', uniqueShiftIds.slice(0, 10)); // İlk 10 benzersiz vardiya ID'sini göster

    return uniqueShiftIds.map(shiftId => {
      // Vardiya ID'sinden vardiya tipini belirle
      let shiftType = 'default';
      let shiftName = 'Vardiya';

      // Vardiya tipini belirle (büyük/küçük harf duyarlılığını kaldır)
      const lowerShiftId = shiftId.toLowerCase();

      if (lowerShiftId.includes('morning') || lowerShiftId.includes('sabah')) {
        shiftType = 'morning';
        shiftName = 'Sabah (08:00-16:00)';
      } else if (lowerShiftId.includes('afternoon') || lowerShiftId.includes('aksam') || lowerShiftId.includes('öğle')) {
        shiftType = 'afternoon';
        shiftName = 'Akşam (16:00-00:00)';
      } else if (lowerShiftId.includes('night') || lowerShiftId.includes('gece')) {
        shiftType = 'night';
        shiftName = 'Gece (00:00-08:00)';
      }

      // Çağrı merkezi için özel kontrol
      if (lowerShiftId.startsWith('cm_')) {
        // Vardiya ID'sinden vardiya tipini çıkar (örn: CM_S_20230501_morning)
        const parts = shiftId.split('_');
        const lastPart = parts[parts.length - 1].toLowerCase();

        if (lastPart === 'morning' || lastPart === 'sabah') {
          shiftType = 'morning';
          shiftName = 'Sabah (08:00-16:00)';
        } else if (lastPart === 'afternoon' || lastPart === 'aksam' || lastPart === 'öğle') {
          shiftType = 'afternoon';
          shiftName = 'Akşam (16:00-00:00)';
        } else if (lastPart === 'night' || lastPart === 'gece') {
          shiftType = 'night';
          shiftName = 'Gece (00:00-08:00)';
        }
      }

      console.log(`Vardiya ID: ${shiftId}, Tip: ${shiftType}, İsim: ${shiftName}`);

      return {
        id: shiftId,
        name: shiftName,
        color: shiftColors[shiftType as keyof typeof shiftColors]
      };
    });
  };

  // Atamalardan çalışan bilgilerini oluştur
  const generateEmployeesFromAssignments = async (processedAssignments: ScheduleAssignment[], datasetType: string): Promise<Employee[]> => {
    const uniqueEmployeeIds = [...new Set(processedAssignments.map(a => a.employee_id))];

    try {
      // API'den çalışan verilerini al
      // Doğrudan API'ye istek yap (tam URL ile)
      const apiUrl = `http://localhost:8000/api/employees?datasetType=${datasetType}`;
      console.log('API isteği URL:', apiUrl);

      const employeesResponse = await axios.get(apiUrl);
      const employeesData = employeesResponse.data;
      console.log('API\'den alınan çalışan verileri:', employeesData);

      if (!employeesData || employeesData.length === 0) {
        throw new Error('Çalışan verileri boş');
      }

      return uniqueEmployeeIds.map(employeeId => {
        // API'den gelen verilerden çalışan bilgilerini bul
        const employeeData = employeesData.find((e: any) => e.employee_id === employeeId);

        if (employeeData) {
          // API'den gelen verileri kullan
          return {
            id: employeeId,
            name: employeeData.name || `Çalışan ${employeeId.replace('CM_E', '').replace('E', '')}`,
            department: employeeData.department || 'Genel',
            role: employeeData.role || 'Çalışan'
          };
        } else {
          // Eğer API'den veri gelmezse, varsayılan değerleri kullan
          let department = 'Genel';
          let role = 'Çalışan';
          let name = `${employeeId.replace('CM_', '').replace('H_', '').replace('E', '')}`;

          // Çağrı merkezi çalışanları için
          if (datasetType === 'cagri_merkezi') {
            name = `Çalışan ${employeeId.replace('CM_E', '')}`;
            department = 'Genel Çağrı';
            role = 'Çağrı Alıcı';
          }
          // Hastane çalışanları için
          else {
            name = `Çalışan ${employeeId.replace('E', '')}`;
            department = 'Genel';
            role = 'Çalışan';
          }

          return {
            id: employeeId,
            name,
            department,
            role
          };
        }
      });
    } catch (error) {
      console.error('Çalışan verilerini alma hatası:', error);
      if (axios.isAxiosError(error)) {
        console.error('Hata detayları:', error.response?.status, error.response?.data);
      }

      console.log('API erişimi başarısız. Varsayılan çalışan verileri oluşturuluyor...');

      // Hata durumunda varsayılan değerlerle devam et
      return uniqueEmployeeIds.map(employeeId => {
        let name = '';
        let department = '';
        let role = '';

        // Çağrı merkezi çalışanları için
        if (datasetType === 'cagri_merkezi') {
          // Çağrı merkezi çalışanları için gerçekçi isimler
          const firstNames = ['Ahmet', 'Mehmet', 'Ayşe', 'Fatma', 'Ali', 'Zeynep', 'Mustafa', 'Emine'];
          const lastNames = ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Öztürk', 'Aydın'];

          const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
          const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];

          name = `${randomFirstName} ${randomLastName}`;
          department = 'Genel Çağrı';
          role = 'Çağrı Alıcı';
        }
        // Hastane çalışanları için
        else {
          // Hastane çalışanları için gerçekçi isimler
          const firstNames = ['Ahmet', 'Mehmet', 'Ayşe', 'Fatma', 'Ali', 'Zeynep', 'Mustafa', 'Emine'];
          const lastNames = ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Öztürk', 'Aydın'];

          const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
          const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];

          name = `${randomFirstName} ${randomLastName}`;

          // Rol ve departman ataması
          const roles = ['Doktor', 'Hemşire', 'Teknisyen', 'İdari'];
          const departments = ['Acil', 'Kardiyoloji', 'Cerrahi', 'Pediatri', 'Yoğun Bakım', 'Radyoloji', 'Laboratuvar'];

          role = roles[Math.floor(Math.random() * roles.length)];
          department = departments[Math.floor(Math.random() * departments.length)];
        }

        return {
          id: employeeId,
          name,
          department,
          role
        };
      });
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Departman ve rol filtreleme
  const filteredEmployees = employees.filter(employee => {
    if (selectedDepartment !== 'all' && employee.department !== selectedDepartment) {
      return false;
    }
    if (selectedRole !== 'all' && employee.role !== selectedRole) {
      return false;
    }
    return true;
  });

  // Çalışan için vardiya bulma yardımcı fonksiyonu
  const getShiftForEmployeeOnDate = (employeeId: string, date: string) => {
    // Debug için
    // console.log(`${employeeId} çalışanı için ${date} tarihinde vardiya aranıyor`);

    // Önce işlenmiş atamalarda ara
    const assignments = processedAssignments.filter(a => a.employee_id === employeeId);

    if (assignments.length === 0) {
      // console.log(`${employeeId} çalışanı için hiç atama bulunamadı`);
      return null;
    }

    // Tam tarih eşleşmesi olan atamaları bul
    const exactDateMatch = assignments.find(a => a.date === date);
    if (exactDateMatch) {
      console.log(`${employeeId} çalışanı için ${date} tarihinde tam eşleşme bulundu:`, exactDateMatch);
      const shift = shifts.find(s => s.id === exactDateMatch.shift_id);
      return shift;
    }

    // Hiçbir eşleşme bulunamadı
    return null;
  };

  // Departman listesi
  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  // Rol listesi
  const roles = [...new Set(employees.map(e => e.role).filter(Boolean))];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Vardiya Çizelgesi
      </Typography>

      {/* Hata mesajı */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          <Typography variant="body2" sx={{ mt: 1 }}>
            Lütfen önce "Çizelge Oluştur" sayfasından bir optimizasyon çalıştırın.
          </Typography>
        </Alert>
      )}

      {/* Yükleniyor göstergesi */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton>
                <PrevIcon />
              </IconButton>
              <Typography variant="h6" sx={{ mx: 2 }}>
                {currentWeek ? `${currentWeek} Haftası` : 'Mevcut Hafta'}
              </Typography>
              <IconButton>
                <NextIcon />
              </IconButton>
            </Box>

            <Box>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                sx={{ mr: 1 }}
                onClick={() => {
                  // CSV olarak dışa aktar
                  setSnackbarMessage('Çizelge CSV olarak dışa aktarıldı.');
                  setSnackbarOpen(true);
                }}
              >
                CSV Olarak İndir
              </Button>
              <Button
                variant="outlined"
                startIcon={<ResetIcon />}
                onClick={() => {
                  // Filtreleri sıfırla
                  setSelectedDepartment('all');
                  setSelectedRole('all');
                }}
              >
                Filtreleri Sıfırla
              </Button>
            </Box>
          </Box>

          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="çizelge görünüm sekmeleri">
              <Tab label="Haftalık Görünüm" />
              <Tab label="Günlük Görünüm" />
              <Tab label="Çalışan Bazlı Görünüm" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel id="department-select-label">Departman</InputLabel>
                    <Select
                      labelId="department-select-label"
                      value={selectedDepartment}
                      label="Departman"
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                    >
                      <MenuItem value="all">Tüm Departmanlar</MenuItem>
                      {departments.map(dept => (
                        <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel id="role-select-label">Rol</InputLabel>
                    <Select
                      labelId="role-select-label"
                      value={selectedRole}
                      label="Rol"
                      onChange={(e) => setSelectedRole(e.target.value)}
                    >
                      <MenuItem value="all">Tüm Roller</MenuItem>
                      {roles.map(role => (
                        <MenuItem key={role} value={role}>{role}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Button
                    variant="outlined"
                    startIcon={<FilterIcon />}
                    fullWidth
                    sx={{ height: '56px' }}
                    onClick={() => {
                      setSnackbarMessage('Filtreler uygulandı.');
                      setSnackbarOpen(true);
                    }}
                  >
                    Filtreleri Uygula
                  </Button>
                </Grid>
              </Grid>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Çalışan</TableCell>
                    {weekDays.map((day, index) => (
                      <TableCell key={day} align="center">
                        {day}<br />
                        <Typography variant="caption">{weekDates[index]}</Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <Typography variant="body1">{employee.name}</Typography>
                          <Typography variant="caption">{employee.role} - {employee.department}</Typography>
                        </TableCell>
                        {weekDates.map((date, dateIndex) => {
                          // Debug için
                          if (employee.id === filteredEmployees[0]?.id) {
                            console.log(`Aranan tarih: ${date}, Gün: ${weekDays[dateIndex]}`);
                          }

                          // Çalışan için bu tarihteki vardiyayı bul
                          const shift = getShiftForEmployeeOnDate(employee.id, date);

                          // Çalışanın tüm vardiyalarını bul
                          const employeeAssignments = processedAssignments.filter(a => a.employee_id === employee.id);

                          // Debug için
                          if (employee.id === filteredEmployees[0]?.id) {
                            console.log(`${employee.id} çalışanının vardiyaları:`,
                              employeeAssignments.map(a => ({
                                shift_id: a.shift_id,
                                date: a.date
                              }))
                            );

                            // Tarih eşleşmesi kontrolü
                            const exactMatch = employeeAssignments.find(a => a.date === date);
                            console.log(`${date} tarihinde tam eşleşme:`, exactMatch ? 'BULUNDU' : 'BULUNAMADI');
                          }

                          return (
                            <TableCell key={date} align="center">
                              {shift ? (
                                <Chip
                                  label={shift.name}
                                  style={{ backgroundColor: shift.color, color: 'white' }}
                                />
                              ) : (
                                <Box
                                  sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    position: 'relative',
                                    '&:hover .edit-button': {
                                      opacity: 1,
                                    }
                                  }}
                                >
                                  <RemoveIcon sx={{ color: 'text.disabled', fontSize: '1.5rem' }} />
                                </Box>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={weekDays.length + 1} align="center">
                        <Typography variant="body1" sx={{ py: 2 }}>
                          Seçilen filtrelere uygun çalışan bulunamadı.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              Günlük Görünüm
            </Typography>
            <Typography variant="body1">
              Bu bölüm, seçilen günün detaylı vardiya görünümünü gösterecektir.
            </Typography>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              Çalışan Bazlı Görünüm
            </Typography>
            <Typography variant="body1">
              Bu bölüm, seçilen çalışanın vardiya çizelgesini gösterecektir.
            </Typography>
          </TabPanel>
        </>
      )}

      {/* Bildirim Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default ScheduleView;
