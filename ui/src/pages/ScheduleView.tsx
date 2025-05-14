import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  Refresh as ResetIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon
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

// Vardiya renkleri - daha canlı ve modern renkler
const shiftColors = {
  morning: '#00c853',   // Canlı Yeşil
  afternoon: '#2979ff', // Canlı Mavi
  night: '#aa00ff',     // Canlı Mor
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
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');

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

    // İlk günü seçili olarak ayarla
    if (dates.length > 0) {
      setSelectedDate(dates[0]);
    }
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

        // Vardiya ve çalışan verilerini API'den al
        const generatedShifts = await generateShiftsFromAssignments(processedAssignments, datasetType);

        // Çalışan verilerini asenkron olarak al
        const generatedEmployees = await generateEmployeesFromAssignments(processedAssignments, datasetType);

        // Debug bilgisi
        console.log('Oluşturulan vardiyalar:', generatedShifts.slice(0, 5));
        console.log('Oluşturulan çalışanlar:', generatedEmployees.slice(0, 5));

        // State'leri güncelle
        setProcessedAssignments(processedAssignments);
        setShifts(generatedShifts);
        setEmployees(generatedEmployees);

        // İlk çalışanı seçili olarak ayarla
        if (generatedEmployees.length > 0) {
          setSelectedEmployeeId(generatedEmployees[0].id);
        }

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
  const generateShiftsFromAssignments = async (processedAssignments: ScheduleAssignment[], datasetType: string): Promise<Shift[]> => {
    console.log('İşlenmiş atamalar:', processedAssignments.slice(0, 5)); // İlk 5 atamayı göster

    const uniqueShiftIds = [...new Set(processedAssignments.map(a => a.shift_id))];
    console.log('Benzersiz vardiya ID\'leri:', uniqueShiftIds.slice(0, 10)); // İlk 10 benzersiz vardiya ID'sini göster

    try {
      // API'den vardiya verilerini al
      const apiUrl = `http://localhost:8000/api/shifts?datasetType=${datasetType}`;
      console.log('Vardiya API isteği URL:', apiUrl);

      const shiftsResponse = await axios.get(apiUrl);
      const shiftsData = shiftsResponse.data;
      console.log('API\'den alınan vardiya verileri:', shiftsData.slice(0, 5));

      return uniqueShiftIds.map(shiftId => {
        // API'den gelen verilerden vardiya bilgilerini bul
        const shiftData = shiftsData.find((s: any) => s.shift_id === shiftId);

        // Varsayılan değerler
        let shiftType = 'default';
        let shiftName = 'Vardiya';
        let shiftStartTime = '';
        let shiftEndTime = '';

        if (shiftData) {
          // API'den gelen verileri kullan
          shiftName = shiftData.name || 'Vardiya';
          shiftStartTime = shiftData.start_time || '';
          shiftEndTime = shiftData.end_time || '';

          // Vardiya tipini belirle
          const lowerShiftName = shiftName.toLowerCase();

          if (lowerShiftName.includes('sabah') || lowerShiftName.includes('morning') || lowerShiftName.includes('gündüz')) {
            shiftType = 'morning';
          } else if (lowerShiftName.includes('akşam') || lowerShiftName.includes('afternoon') || lowerShiftName.includes('öğle')) {
            shiftType = 'afternoon';
          } else if (lowerShiftName.includes('gece') || lowerShiftName.includes('night')) {
            shiftType = 'night';
          }

          // Saat bilgilerini formatla
          if (shiftStartTime && shiftEndTime) {
            const formattedStartTime = shiftStartTime.substring(0, 5); // "08:00:00" -> "08:00"
            const formattedEndTime = shiftEndTime.substring(0, 5);     // "16:00:00" -> "16:00"

            // Vardiya adını saat bilgisiyle birlikte göster
            if (shiftType === 'morning') {
              shiftName = `Sabah (${formattedStartTime}-${formattedEndTime})`;
            } else if (shiftType === 'afternoon') {
              shiftName = `Akşam (${formattedStartTime}-${formattedEndTime})`;
            } else if (shiftType === 'night') {
              shiftName = `Gece (${formattedStartTime}-${formattedEndTime})`;
            } else {
              shiftName = `Vardiya (${formattedStartTime}-${formattedEndTime})`;
            }
          }
        } else {
          // API'den veri gelmezse, vardiya ID'sinden çıkarım yap
          const lowerShiftId = shiftId.toLowerCase();

          if (lowerShiftId.includes('morning') || lowerShiftId.includes('sabah') || lowerShiftId.includes('gunduz')) {
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
        }

        console.log(`Vardiya ID: ${shiftId}, Tip: ${shiftType}, İsim: ${shiftName}`);

        return {
          id: shiftId,
          name: shiftName,
          color: shiftColors[shiftType as keyof typeof shiftColors]
        };
      });
    } catch (error) {
      console.error('Vardiya verilerini alma hatası:', error);
      if (axios.isAxiosError(error)) {
        console.error('Hata detayları:', error.response?.status, error.response?.data);
      }

      // Hata durumunda varsayılan değerlerle devam et
      return uniqueShiftIds.map(shiftId => {
        // Vardiya ID'sinden vardiya tipini belirle
        let shiftType = 'default';
        let shiftName = 'Vardiya';

        // Vardiya tipini belirle (büyük/küçük harf duyarlılığını kaldır)
        const lowerShiftId = shiftId.toLowerCase();

        if (lowerShiftId.includes('morning') || lowerShiftId.includes('sabah') || lowerShiftId.includes('gunduz')) {
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
    }
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

  // Çizelgeyi CSV formatına dönüştür ve indir
  const exportToCSV = () => {
    try {
      // BOM (Byte Order Mark) ekleyerek UTF-8 kodlamasını garantile
      const BOM = '\uFEFF';

      // Excel'de daha iyi görünüm için HTML formatında dışa aktarma
      let htmlContent = BOM + '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
      htmlContent += '<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Vardiya Çizelgesi</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->';
      htmlContent += '<meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>';
      htmlContent += '<style>td { padding: 5px; vertical-align: middle; } .shift-cell { font-weight: bold; text-align: center; } .header { background-color: #4472C4; color: white; font-weight: bold; text-align: center; } .employee-name { font-weight: bold; } .employee-info { color: #666; font-size: 0.9em; } .morning-shift { background-color: #FFEB9C; } .afternoon-shift { background-color: #C6E0B4; } .night-shift { background-color: #BDD7EE; } </style>';
      htmlContent += '</head><body><table border="1">';

      // Tablo başlığı
      htmlContent += '<tr><th class="header" colspan="3" style="text-align: left;">Vardiya Çizelgesi</th>';
      weekDates.forEach((date, index) => {
        htmlContent += `<th class="header">${weekDays[index]}<br/>(${date})</th>`;
      });
      htmlContent += '</tr>';

      // Çalışan satırları
      filteredEmployees.forEach(employee => {
        htmlContent += '<tr>';

        // Çalışan bilgileri
        htmlContent += `<td class="employee-name">${employee.name || ''}</td>`;
        htmlContent += `<td class="employee-info">${employee.department || ''}</td>`;
        htmlContent += `<td class="employee-info">${employee.role || ''}</td>`;

        // Her gün için vardiya bilgisi
        weekDates.forEach(date => {
          const shift = getShiftForEmployeeOnDate(employee.id, date);

          if (shift && shift.name) {
            // Vardiya tipine göre CSS sınıfı belirle
            let cssClass = 'shift-cell';
            const shiftName = shift.name.toLowerCase();

            if (shiftName.includes('sabah')) {
              cssClass += ' morning-shift';
            } else if (shiftName.includes('akşam')) {
              cssClass += ' afternoon-shift';
            } else if (shiftName.includes('gece')) {
              cssClass += ' night-shift';
            }

            // Vardiya adı ve saati
            let shiftLabel = '';
            let shiftTime = '';

            if (shift.name) {
              // Vardiya tipini belirle (Sabah, Akşam, Gece)
              if (shift.name.toLowerCase().includes('sabah') || shift.name.toLowerCase().includes('gündüz')) {
                shiftLabel = 'Sabah';
              } else if (shift.name.toLowerCase().includes('akşam')) {
                shiftLabel = 'Akşam';
              } else if (shift.name.toLowerCase().includes('gece')) {
                shiftLabel = 'Gece';
              } else {
                // Eğer özel bir tip yoksa ilk kelimeyi kullan
                shiftLabel = shift.name.split(' ')[0];
              }

              // Vardiya saatini çıkar
              shiftTime = shift.name.includes('(') ? shift.name.split('(')[1].replace(')', '') : '';
            }

            htmlContent += `<td class="${cssClass}">
              <div style="font-weight: bold;">${shiftLabel}</div>
              <div style="font-size: 0.9em;">${shiftTime}</div>
            </td>`;
          } else {
            htmlContent += '<td style="text-align: center;">-</td>';
          }
        });

        htmlContent += '</tr>';
      });

      htmlContent += '</table></body></html>';

      // HTML dosyasını oluştur ve indir (Excel tarafından açılabilir)
      const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `vardiya_cizelgesi_${currentWeek || 'mevcut_hafta'}.xls`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Bildirim göster
      setSnackbarMessage('Vardiya çizelgesi Excel formatında indirildi.');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Excel dışa aktarma hatası:', error);
      setSnackbarMessage('Excel dışa aktarma sırasında bir hata oluştu.');
      setSnackbarOpen(true);
    }
  };

  // Departman listesi
  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  // Rol listesi
  const roles = [...new Set(employees.map(e => e.role).filter(Boolean))];

  return (
    <Box sx={{ maxWidth: '1400px', mx: 'auto', px: 2 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
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
          Vardiya Çizelgesi
        </Typography>

        <Box>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
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
            onClick={exportToCSV}
          >
            Excel Olarak İndir
          </Button>
          <Button
            variant="outlined"
            startIcon={<ResetIcon />}
            sx={{
              borderRadius: 2,
              px: 2,
              py: 1,
              borderColor: 'primary.main',
              '&:hover': {
                borderColor: 'primary.dark',
                backgroundColor: 'rgba(58, 123, 213, 0.05)'
              }
            }}
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

      {/* Hata mesajı */}
      {error && (
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
      )}

      {/* Yükleniyor göstergesi */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 6, flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="body1" sx={{ mt: 2, color: 'text.secondary' }}>
            Vardiya çizelgesi yükleniyor...
          </Typography>
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
              backgroundColor: 'rgba(58, 123, 213, 0.05)',
              borderRadius: 2,
              p: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                sx={{
                  backgroundColor: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  '&:hover': {
                    backgroundColor: 'white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }
                }}
              >
                <PrevIcon />
              </IconButton>
              <Typography
                variant="h6"
                sx={{
                  mx: 2,
                  fontWeight: 'bold',
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  backgroundColor: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                {currentWeek ? `${currentWeek} Haftası` : 'Mevcut Hafta'}
              </Typography>
              <IconButton
                sx={{
                  backgroundColor: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  '&:hover': {
                    backgroundColor: 'white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }
                }}
              >
                <NextIcon />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="çizelge görünüm sekmeleri"
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
              <Tab label="Haftalık Görünüm" />
              <Tab label="Günlük Görünüm" />
              <Tab label="Çalışan Bazlı Görünüm" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Box
              sx={{
                mb: 4,
                p: 3,
                borderRadius: 2,
                backgroundColor: 'white',
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)'
              }}
            >
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: 'text.primary' }}>
                Filtreleme Seçenekleri
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="department-select-label">Departman</InputLabel>
                    <Select
                      labelId="department-select-label"
                      value={selectedDepartment}
                      label="Departman"
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      sx={{
                        borderRadius: 2,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(0, 0, 0, 0.1)'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.light'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main'
                        }
                      }}
                    >
                      <MenuItem value="all">Tüm Departmanlar</MenuItem>
                      {departments.map(dept => (
                        <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="role-select-label">Rol</InputLabel>
                    <Select
                      labelId="role-select-label"
                      value={selectedRole}
                      label="Rol"
                      onChange={(e) => setSelectedRole(e.target.value)}
                      sx={{
                        borderRadius: 2,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(0, 0, 0, 0.1)'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.light'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main'
                        }
                      }}
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
                    variant="contained"
                    startIcon={<FilterIcon />}
                    fullWidth
                    sx={{
                      height: '56px',
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #3a7bd5, #00d2ff)',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                      '&:hover': {
                        boxShadow: '0 6px 15px rgba(0,0,0,0.15)',
                        background: 'linear-gradient(45deg, #3a7bd5, #00d2ff)',
                        transform: 'translateY(-2px)',
                        transition: 'all 0.2s ease'
                      }
                    }}
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

            <TableContainer
              component={Paper}
              sx={{
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                overflow: 'hidden'
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'primary.light', '& th': { color: 'white' } }}>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        width: '180px',
                        py: 1.5
                      }}
                    >
                      Çalışan
                    </TableCell>
                    {weekDays.map((day, index) => (
                      <TableCell
                        key={day}
                        align="center"
                        sx={{
                          fontWeight: 'bold',
                          py: 1,
                          px: 1,
                          minWidth: '100px',
                          maxWidth: '120px'
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'white' }}>
                          {day}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'white', opacity: 0.9, fontSize: '0.7rem' }}>
                          {weekDates[index]}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((employee) => (
                      <TableRow
                        key={employee.id}
                        sx={{
                          '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
                          '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                        }}
                      >
                        <TableCell
                          sx={{
                            borderLeft: '3px solid',
                            borderLeftColor: 'primary.main',
                            pl: 1.5,
                            py: 1
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 'medium',
                              mb: 0.3,
                              fontSize: '0.85rem'
                            }}
                          >
                            {employee.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'inline-block',
                              backgroundColor: 'rgba(0, 0, 0, 0.05)',
                              px: 0.8,
                              py: 0.3,
                              borderRadius: 0.8,
                              color: 'text.secondary',
                              fontSize: '0.7rem'
                            }}
                          >
                            {employee.role} - {employee.department}
                          </Typography>
                        </TableCell>
                        {weekDates.map((date) => {
                          // Çalışan için bu tarihteki vardiyayı bul
                          const shift = getShiftForEmployeeOnDate(employee.id, date);

                          return (
                            <TableCell
                              key={date}
                              align="center"
                              sx={{
                                py: 1,
                                px: 1,
                                position: 'relative',
                                '&:hover': {
                                  backgroundColor: 'rgba(0, 0, 0, 0.02)'
                                }
                              }}
                            >
                              {shift ? (
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: shift.color,
                                    color: 'white',
                                    borderRadius: 2,
                                    py: 0.5,
                                    px: 0.5,
                                    width: '100%',
                                    maxWidth: '90px',
                                    height: '40px',
                                    margin: '0 auto',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                    '&:hover': {
                                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                      transform: 'translateY(-2px)',
                                      transition: 'all 0.2s ease'
                                    }
                                  }}
                                >
                                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Typography
                                      variant="subtitle2"
                                      sx={{
                                        fontWeight: 'bold',
                                        fontSize: '0.75rem',
                                        textAlign: 'center',
                                        lineHeight: 1.2
                                      }}
                                    >
                                      {/* Vardiya adını göster */}
                                      {shift.name.toLowerCase().includes('sabah') || shift.name.toLowerCase().includes('gündüz') ? 'Sabah' :
                                       shift.name.toLowerCase().includes('akşam') ? 'Akşam' :
                                       shift.name.toLowerCase().includes('gece') ? 'Gece' :
                                       shift.name.split(' ')[0]}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontSize: '0.65rem',
                                        opacity: 0.9,
                                        mt: 0.2
                                      }}
                                    >
                                      {/* Vardiya saatlerini göster (parantez içindeki kısım) */}
                                      {shift.name.includes('(') ? shift.name.split('(')[1].replace(')', '') : ''}
                                    </Typography>
                                  </Box>
                                </Box>
                              ) : (
                                <Box
                                  sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    height: '32px',
                                    width: '100%',
                                    maxWidth: '100px',
                                    margin: '0 auto',
                                    borderRadius: 2,
                                    backgroundColor: 'rgba(0, 0, 0, 0.03)',
                                    border: '1px dashed rgba(0, 0, 0, 0.08)',
                                    '&:hover': {
                                      backgroundColor: 'rgba(0, 0, 0, 0.05)'
                                    }
                                  }}
                                >
                                  <Typography
                                    sx={{
                                      color: 'text.disabled',
                                      fontWeight: 'medium',
                                      fontSize: '0.75rem'
                                    }}
                                  >
                                    —
                                  </Typography>
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
                        <Typography variant="body1" sx={{ py: 3, color: 'text.secondary' }}>
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
            <Box
              sx={{
                mb: 4,
                p: 3,
                borderRadius: 2,
                backgroundColor: 'white',
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)'
              }}
            >
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: 'text.primary' }}>
                Gün Seçimi
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="day-select-label">Gün</InputLabel>
                    <Select
                      labelId="day-select-label"
                      value={selectedDate}
                      label="Gün"
                      onChange={(e) => {
                        // Seçilen günü state'e kaydet
                        setSelectedDate(e.target.value);
                        console.log('Seçilen gün:', e.target.value);
                      }}
                      sx={{
                        borderRadius: 2,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(0, 0, 0, 0.1)'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.light'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main'
                        }
                      }}
                    >
                      {weekDates.map((date, index) => (
                        <MenuItem key={date} value={date}>
                          {weekDays[index]} ({date})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Button
                    variant="contained"
                    startIcon={<FilterIcon />}
                    fullWidth
                    sx={{
                      height: '56px',
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #3a7bd5, #00d2ff)',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                      '&:hover': {
                        boxShadow: '0 6px 15px rgba(0,0,0,0.15)',
                        background: 'linear-gradient(45deg, #3a7bd5, #00d2ff)',
                        transform: 'translateY(-2px)',
                        transition: 'all 0.2s ease'
                      }
                    }}
                    onClick={() => {
                      setSnackbarMessage('Seçilen gün için vardiyalar gösteriliyor.');
                      setSnackbarOpen(true);
                    }}
                  >
                    Günü Göster
                  </Button>
                </Grid>
              </Grid>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <CalendarIcon sx={{ mr: 1, color: 'primary.main' }} />
                {selectedDate ? `${weekDays[weekDates.indexOf(selectedDate)]} (${selectedDate})` : 'Seçilen Gün'} Vardiyaları
              </Typography>
            </Box>

            <TableContainer
              component={Paper}
              sx={{
                borderRadius: 2,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                overflow: 'hidden',
                mb: 4
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'primary.light', '& th': { color: 'white' } }}>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        width: '180px',
                        py: 1.5
                      }}
                    >
                      Çalışan
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        py: 1.5,
                        px: 2
                      }}
                    >
                      Vardiya
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        py: 1.5,
                        px: 2
                      }}
                    >
                      Saat
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        py: 1.5,
                        px: 2
                      }}
                    >
                      Departman
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((employee) => {
                      // Seçilen gün için vardiya bul
                      const shift = getShiftForEmployeeOnDate(employee.id, selectedDate);

                      // Vardiya yoksa gösterme
                      if (!shift) return null;

                      return (
                        <TableRow
                          key={employee.id}
                          sx={{
                            '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
                            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                          }}
                        >
                          <TableCell
                            sx={{
                              borderLeft: '3px solid',
                              borderLeftColor: 'primary.main',
                              pl: 1.5,
                              py: 1
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 'medium',
                                mb: 0.3,
                                fontSize: '0.85rem'
                              }}
                            >
                              {employee.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'inline-block',
                                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                                px: 0.8,
                                py: 0.3,
                                borderRadius: 0.8,
                                color: 'text.secondary',
                                fontSize: '0.7rem'
                              }}
                            >
                              {employee.role} - {employee.department}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: shift.color,
                                color: 'white',
                                borderRadius: 2,
                                py: 0.7,
                                px: 1.5,
                                minWidth: '80px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                              }}
                            >
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {shift.name.toLowerCase().includes('sabah') || shift.name.toLowerCase().includes('gündüz') ? 'Sabah' :
                                 shift.name.toLowerCase().includes('akşam') ? 'Akşam' :
                                 shift.name.toLowerCase().includes('gece') ? 'Gece' :
                                 shift.name.split(' ')[0]}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {shift.name.includes('(') ? shift.name.split('(')[1].replace(')', '') : ''}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {employee.department}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    }).filter(Boolean) // null değerleri filtrele
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography variant="body1" sx={{ py: 3, color: 'text.secondary' }}>
                          Seçilen gün için vardiya bulunamadı veya filtrelere uygun çalışan yok.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Box
              sx={{
                p: 3,
                borderRadius: 2,
                backgroundColor: 'rgba(58, 123, 213, 0.05)',
                border: '1px dashed rgba(58, 123, 213, 0.2)',
                mb: 4
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                Günlük Vardiya Özeti
              </Typography>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: 'white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}
                  >
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {filteredEmployees.filter(e => getShiftForEmployeeOnDate(e.id, selectedDate)).length}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Toplam Vardiya
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: 'white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}
                  >
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: shiftColors.morning }}>
                      {filteredEmployees.filter(e => {
                        const shift = getShiftForEmployeeOnDate(e.id, selectedDate);
                        return shift && shift.name.toLowerCase().includes('sabah');
                      }).length}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Sabah Vardiyası
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: 'white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}
                  >
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: shiftColors.afternoon }}>
                      {filteredEmployees.filter(e => {
                        const shift = getShiftForEmployeeOnDate(e.id, selectedDate);
                        return shift && shift.name.toLowerCase().includes('akşam');
                      }).length}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Akşam Vardiyası
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: 'white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center'
                    }}
                  >
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: shiftColors.night }}>
                      {filteredEmployees.filter(e => {
                        const shift = getShiftForEmployeeOnDate(e.id, selectedDate);
                        return shift && shift.name.toLowerCase().includes('gece');
                      }).length}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Gece Vardiyası
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box
              sx={{
                mb: 4,
                p: 3,
                borderRadius: 2,
                backgroundColor: 'white',
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)'
              }}
            >
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold', color: 'text.primary' }}>
                Çalışan Seçimi
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="employee-select-label">Çalışan</InputLabel>
                    <Select
                      labelId="employee-select-label"
                      value={selectedEmployeeId}
                      label="Çalışan"
                      onChange={(e) => {
                        // Seçilen çalışanı state'e kaydet
                        setSelectedEmployeeId(e.target.value);
                        console.log('Seçilen çalışan:', e.target.value);
                      }}
                      sx={{
                        borderRadius: 2,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(0, 0, 0, 0.1)'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.light'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main'
                        }
                      }}
                    >
                      {employees.map((employee) => (
                        <MenuItem key={employee.id} value={employee.id}>
                          {employee.name} ({employee.role})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Button
                    variant="contained"
                    startIcon={<FilterIcon />}
                    fullWidth
                    sx={{
                      height: '56px',
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #3a7bd5, #00d2ff)',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                      '&:hover': {
                        boxShadow: '0 6px 15px rgba(0,0,0,0.15)',
                        background: 'linear-gradient(45deg, #3a7bd5, #00d2ff)',
                        transform: 'translateY(-2px)',
                        transition: 'all 0.2s ease'
                      }
                    }}
                    onClick={() => {
                      setSnackbarMessage('Seçilen çalışanın vardiyaları gösteriliyor.');
                      setSnackbarOpen(true);
                    }}
                  >
                    Çalışanı Göster
                  </Button>
                </Grid>
              </Grid>
            </Box>

            {employees.length > 0 && selectedEmployeeId && (
              <>
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                    {employees.find(e => e.id === selectedEmployeeId)?.name || 'Seçilen Çalışan'} Vardiya Çizelgesi
                  </Typography>

                  <Box
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      backgroundColor: 'white',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                      mb: 3
                    }}
                  >
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                          Departman
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {employees.find(e => e.id === selectedEmployeeId)?.department || 'Belirtilmemiş'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                          Rol
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {employees.find(e => e.id === selectedEmployeeId)?.role || 'Belirtilmemiş'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                          Toplam Vardiya
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {processedAssignments.filter(a => a.employee_id === selectedEmployeeId).length} vardiya
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>

                <TableContainer
                  component={Paper}
                  sx={{
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                    mb: 4
                  }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'primary.light', '& th': { color: 'white' } }}>
                        <TableCell
                          sx={{
                            fontWeight: 'bold',
                            py: 1.5,
                            px: 2
                          }}
                        >
                          Tarih
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 'bold',
                            py: 1.5,
                            px: 2
                          }}
                        >
                          Gün
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 'bold',
                            py: 1.5,
                            px: 2
                          }}
                        >
                          Vardiya
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 'bold',
                            py: 1.5,
                            px: 2
                          }}
                        >
                          Saat
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {processedAssignments
                        .filter(a => a.employee_id === selectedEmployeeId)
                        .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
                        .map((assignment, index) => {
                          const shift = shifts.find(s => s.id === assignment.shift_id);
                          if (!shift || !assignment.date) return null;

                          // Tarihten gün adını bul
                          const date = new Date(assignment.date);
                          const dayIndex = date.getDay();
                          const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
                          const dayName = dayNames[dayIndex];

                          return (
                            <TableRow
                              key={index}
                              sx={{
                                '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.02)' },
                                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                              }}
                            >
                              <TableCell>
                                <Typography variant="body2">
                                  {assignment.date}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {dayName}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Box
                                  sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: shift.color,
                                    color: 'white',
                                    borderRadius: 2,
                                    py: 0.7,
                                    px: 1.5,
                                    minWidth: '80px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                  }}
                                >
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {shift.name.toLowerCase().includes('sabah') || shift.name.toLowerCase().includes('gündüz') ? 'Sabah' :
                                     shift.name.toLowerCase().includes('akşam') ? 'Akşam' :
                                     shift.name.toLowerCase().includes('gece') ? 'Gece' :
                                     shift.name.split(' ')[0]}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {shift.name.includes('(') ? shift.name.split('(')[1].replace(')', '') : ''}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          );
                        }).filter(Boolean)}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </TabPanel>
        </>
      )}

      {/* Bildirim Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        sx={{
          '& .MuiSnackbarContent-root': {
            backgroundColor: 'primary.main',
            color: 'white',
            fontWeight: 'medium',
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }
        }}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default ScheduleView;
