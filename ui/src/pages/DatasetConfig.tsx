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
  CheckCircle as CheckCircleIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  School as SchoolIcon,
  TuneSharp as TuneIcon,
  Visibility as PreviewIcon,
  Code as CodeIcon,
  AddCircle as AddCircleIcon,
  RemoveCircle as RemoveCircleIcon,
  Warning as WarningIcon
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

// Kural yönetimi için tipler
interface StaffingRule {
  id?: string;
  department: string;
  role: string;
  shift: string;
  weekType: string;
  minCount: number;
  penalty: number;
}

interface SkillRule {
  id?: string;
  department: string;
  skill: string;
  shift: string;
  weekType: string;
  minCount: number;
  penalty: number;
}

interface OptimizationWeights {
  minimize_overstaffing: number;
  minimize_understaffing: number;
  maximize_preferences: number;
  balance_workload: number;
  maximize_shift_coverage: number;
}

interface GeneralRules {
  max_consecutive_shifts: number;
  min_rest_time_hours: number;
  solver_time_limit_seconds: number;
}

interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
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
        
        // Mevcut kuralları parse et
        if (content) {
          parseConfigToRules(content);
        }
        
        // Mevcut kuralları parse et
        if (content) {
          parseConfigToRules(content);
        }
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

  // Kural yönetimi için state'ler
  const [ruleMode, setRuleMode] = useState<'visual' | 'yaml'>('visual');
  const [ruleCategory, setRuleCategory] = useState(0);
  const [staffingRules, setStaffingRules] = useState<StaffingRule[]>([]);
  const [skillRules, setSkillRules] = useState<SkillRule[]>([]);
  const [optimizationWeights, setOptimizationWeights] = useState<OptimizationWeights>({
    minimize_overstaffing: 1,
    minimize_understaffing: 10,
    maximize_preferences: 2,
    balance_workload: 0.5,
    maximize_shift_coverage: 1
  });
  const [generalRules, setGeneralRules] = useState<GeneralRules>({
    max_consecutive_shifts: 3,
    min_rest_time_hours: 10,
    solver_time_limit_seconds: 60
  });

  // Yardım sistemi için state'ler
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Kural kategorileri
  const ruleCategories = [
    { id: 'staffing', label: 'Personel Gereksinimleri', icon: <PeopleIcon />, color: '#1976d2' },
    { id: 'skills', label: 'Yetenek Gereksinimleri', icon: <SchoolIcon />, color: '#388e3c' },
    { id: 'optimization', label: 'Optimizasyon Hedefleri', icon: <TuneIcon />, color: '#f57c00' },
    { id: 'general', label: 'Genel Kurallar', icon: <ScheduleIcon />, color: '#7b1fa2' }
  ];

  // Hazır şablonlar
  const ruleTemplates: RuleTemplate[] = [
    {
      id: 'hospital_standard',
      name: 'Hastane Standard Kuralları',
      description: 'Genel hastane vardiya çizelgeleme kuralları',
      category: 'Hastane'
    },
    {
      id: 'emergency_rules',
      name: 'Acil Servis Kuralları',
      description: 'Acil servis özel gereksinimleri',
      category: 'Hastane'
    },
    {
      id: 'callcenter_standard',
      name: 'Çağrı Merkezi Standard Kuralları',
      description: 'Çağrı merkezi vardiya kuralları',
      category: 'Çağrı Merkezi'
    }
  ];

  // Dropdown seçenekleri
  const departments = selectedConfig.includes("hospital") 
    ? ['Acil', 'Yoğun Bakım', 'Kardiyoloji', 'Pediatri', 'Dahiliye', 'Cerrahi']
    : ['Müşteri Hizmetleri', 'Teknik Destek', 'Satış', 'Yönetim'];

  const roles = selectedConfig.includes("hospital")
    ? ['Doktor', 'Hemşire', 'Teknisyen', 'Temizlik Personeli', 'Güvenlik']
    : ['Temsilci', 'Uzman Temsilci', 'Takım Lideri', 'Süpervizör'];

  const shifts = ['Gündüz', 'Gece', 'Mesai'];
  const weekTypes = ['Hafta İçi', 'Hafta Sonu', 'Tümü'];

  const skills = selectedConfig.includes("hospital")
    ? ['Acil Servis Deneyimi', 'Yoğun Bakım Sertifikası', 'Pediatri Deneyimi', 'Kardiyoloji Deneyimi']
    : ['Satış Deneyimi', 'Teknik Bilgi', 'Çoklu Dil', 'Müşteri İlişkileri'];

  // Örnek senaryolar
  const exampleScenarios = {
    hospital: {
      emergency: [
        {
          name: "Acilde gece 2 hemşire",
          description: "Gece vardiyasında acil serviste minimum 2 hemşire bulunması",
          rule: {
            department: 'Acil',
            role: 'Hemşire', 
            shift: 'Gece',
            weekType: 'Hafta İçi',
            minCount: 2,
            penalty: 100
          },
          type: 'staffing'
        },
        {
          name: "24 saat doktor bulunması",
          description: "Acil serviste her zaman en az 1 doktor bulunması",
          rule: {
            department: 'Acil',
            role: 'Doktor',
            shift: 'Gündüz',
            weekType: 'Tümü',
            minCount: 1,
            penalty: 200
          },
          type: 'staffing'
        },
        {
          name: "Travma deneyimi olan personel",
          description: "Acil serviste travma deneyimi olan personel bulunması",
          rule: {
            department: 'Acil',
            skill: 'Acil Servis Deneyimi',
            shift: 'Gündüz',
            weekType: 'Tümü',
            minCount: 1,
            penalty: 150
          },
          type: 'skill'
        }
      ],
      icu: [
        {
          name: "BLS sertifikalı hemşire",
          description: "Yoğun bakımda BLS sertifikası olan hemşire",
          rule: {
            department: 'Yoğun Bakım',
            skill: 'Yoğun Bakım Sertifikası',
            shift: 'Gece',
            weekType: 'Hafta İçi',
            minCount: 1,
            penalty: 100
          },
          type: 'skill'
        },
        {
          name: "Gece en az 3 personel",
          description: "Yoğun bakımda gece vardiyasında minimum 3 personel",
          rule: {
            department: 'Yoğun Bakım',
            role: 'Hemşire',
            shift: 'Gece',
            weekType: 'Tümü',
            minCount: 3,
            penalty: 200
          },
          type: 'staffing'
        }
      ],
      cardiology: [
        {
          name: "EKG okuma bilgisi",
          description: "Kardiyolojide EKG okuma bilgisi olan personel",
          rule: {
            department: 'Kardiyoloji',
            skill: 'Kardiyoloji Deneyimi',
            shift: 'Gündüz',
            weekType: 'Hafta İçi',
            minCount: 1,
            penalty: 100
          },
          type: 'skill'
        }
      ]
    },
    callcenter: {
      customer_service: [
        {
          name: "Müşteri hizmetlerinde uzman",
          description: "Müşteri hizmetlerinde deneyimli temsilci bulunması",
          rule: {
            department: 'Müşteri Hizmetleri',
            role: 'Uzman Temsilci',
            shift: 'Gündüz',
            weekType: 'Hafta İçi',
            minCount: 2,
            penalty: 100
          },
          type: 'staffing'
        },
        {
          name: "Çoklu dil bilen personel",
          description: "Müşteri hizmetlerinde yabancı dil bilen personel",
          rule: {
            department: 'Müşteri Hizmetleri',
            skill: 'Çoklu Dil',
            shift: 'Gündüz',
            weekType: 'Tümü',
            minCount: 1,
            penalty: 80
          },
          type: 'skill'
        }
      ],
      technical: [
        {
          name: "Teknik uzman bulunması",
          description: "Teknik destek vardiyasında uzman personel",
          rule: {
            department: 'Teknik Destek',
            role: 'Uzman Temsilci',
            shift: 'Gündüz',
            weekType: 'Hafta İçi',
            minCount: 1,
            penalty: 120
          },
          type: 'staffing'
        }
      ]
    }
  };

  // Tooltip açıklamaları
  const tooltipTexts = {
    department: {
      title: "🏥 Departman Nedir?",
      content: "Kurumunuzun bölümleri. Hastane için: Acil Servis, Yoğun Bakım, Kardiyoloji vb. Çağrı merkezi için: Müşteri Hizmetleri, Teknik Destek vb. Yeni bölüm eklemek için sistem yöneticinizi arayın."
    },
    role: {
      title: "👤 Rol Nedir?",
      content: "Çalışanın pozisyonu. Hastane için: Doktor, Hemşire, Teknisyen vb. Çağrı merkezi için: Temsilci, Uzman Temsilci, Süpervizör vb."
    },
    shift: {
      title: "🕐 Vardiya Nedir?",
      content: "Çalışma saatleri. Gündüz (08:00-16:00), Gece (00:00-08:00), Mesai (16:00-00:00) gibi. Vardiya saatleri sistem yöneticisi tarafından ayarlanır."
    },
    weekType: {
      title: "📅 Hafta Türü",
      content: "Kuralın hangi günlerde geçerli olacağı. Hafta İçi (Pzt-Cum), Hafta Sonu (Cmt-Paz), Tümü (7 gün)"
    },
    minCount: {
      title: "👥 Minimum Personel Sayısı",
      content: "Bu vardiyada EN AZ kaç kişi olması gerektiğini belirler. Örnek: Acil için → En az 2, Yoğun bakım → En az 3, Genel servis → En az 1"
    },
    penalty: {
      title: "⚠️ Ceza Değeri",
      content: "Kural ihlal edildiğinde optimizasyona verilen ceza puanı. Yüksek değer = daha önemli kural. Genelde 50-200 arası kullanılır."
    },
    skill: {
      title: "🎓 Yetenek/Sertifika",
      content: "Özel bilgi veya sertifika gerektiren durumlar. BLS Sertifikası, Acil Servis Deneyimi, Çoklu Dil gibi."
    }
  };

  // YAML'dan form verilerine parse etme
  const parseConfigToRules = (yamlContent: string) => {
    if (!yamlContent) return;
    
    try {
      console.log('YAML parsing başlıyor...', yamlContent.substring(0, 200));
      
      // Mevcut kuralları temizle
      setStaffingRules([]);
      setSkillRules([]);
      
      // Personel gereksinimlerini parse et  
      const staffingSection = yamlContent.match(/min_staffing_requirements:\s*([\s\S]*?)(?=\s+max_consecutive_shifts|\s+skill_requirements|\s+min_rest_time|$)/);
      console.log('Staffing section found:', !!staffingSection);
      if (staffingSection) {
        console.log('Staffing content:', staffingSection[1].substring(0, 300));
        const staffingContent = staffingSection[1].trim();
        
        // Eğer content sadece max_consecutive_shifts gibi başka bir field içeriyorsa, staffing rules yok demektir
        if (!staffingContent || staffingContent.startsWith('max_consecutive_shifts') || staffingContent.startsWith('min_rest_time') || staffingContent.startsWith('skill_requirements')) {
          console.log('⚠️ min_staffing_requirements bölümü boş - henüz kural tanımlanmamış');
          setStaffingRules([]); // Boş array set et
        } else {
          // Daha flexible regex - her field ayrı parse edelim
          const ruleBlocks = staffingContent.split(/(?=\s*-\s+shift_pattern:)/).filter(block => block.trim() && block.includes('shift_pattern'));
          console.log('Rule blocks found:', ruleBlocks.length);
          ruleBlocks.forEach((block, i) => console.log(`Block ${i}:`, block.substring(0, 100)));
          
          if (ruleBlocks.length > 0) {
          const parsedStaffingRules: StaffingRule[] = [];
          ruleBlocks.forEach((block, index) => {
            const shiftPatternMatch = block.match(/shift_pattern:\s*"([^"]+)"/);
            const roleMatch = block.match(/role:\s*"([^"]+)"/);
            const departmentMatch = block.match(/department:\s*"([^"]+)"/);
            const minCountMatch = block.match(/min_count:\s*(\d+)/);
            const penaltyMatch = block.match(/penalty_if_violated:\s*(\d+)/);
            
            if (shiftPatternMatch && roleMatch && departmentMatch && minCountMatch) {
              const shiftPattern = shiftPatternMatch[1];
              const role = roleMatch[1];
              const department = departmentMatch[1];
              const minCount = minCountMatch[1];
              const penalty = penaltyMatch ? penaltyMatch[1] : '100';
              
              // Shift pattern'i parse et (örn: "*Gece*Hafta*İçi*")
              let shift = 'Gündüz';
              let weekType = 'Hafta İçi';
              
              if (shiftPattern.includes('Gece')) shift = 'Gece';
              else if (shiftPattern.includes('Mesai')) shift = 'Mesai';
              
              if (shiftPattern.includes('Hafta*Sonu')) weekType = 'Hafta Sonu';
              else if (shiftPattern.includes('Tümü')) weekType = 'Tümü';
              
              parsedStaffingRules.push({
                id: `existing-${index}`,
                department,
                role,
                shift,
                weekType,
                minCount: parseInt(minCount),
                penalty: parseInt(penalty)
              });
            }
          });
            setStaffingRules(parsedStaffingRules);
            console.log(`✅ ${parsedStaffingRules.length} personel kuralı yüklendi:`, parsedStaffingRules);
          } else {
            console.log('❌ Personel kuralları parse edilemedi');
          }
        }
      } else {
        console.log('❌ Staffing section bulunamadı');
      }
      
      // Yetenek gereksinimlerini parse et
      const skillSection = yamlContent.match(/skill_requirements:\s*([\s\S]*?)(?=\s+n8n_parameters|\s*$)/);
      if (skillSection) {
        const skillContent = skillSection[1];
        // Daha flexible regex - her field ayrı parse edelim  
        const skillRuleBlocks = skillContent.split(/(?=\s*-\s+shift_pattern:)/).filter(block => block.trim() && block.includes('shift_pattern'));
        
        if (skillRuleBlocks.length > 0) {
          const parsedSkillRules: SkillRule[] = [];
          skillRuleBlocks.forEach((block, index) => {
            const shiftPatternMatch = block.match(/shift_pattern:\s*"([^"]+)"/);
            const skillMatch = block.match(/skill:\s*"([^"]+)"/);
            const departmentMatch = block.match(/department:\s*"([^"]+)"/);
            const minCountMatch = block.match(/min_count:\s*(\d+)/);
            const penaltyMatch = block.match(/penalty_if_violated:\s*(\d+)/);
            
            if (shiftPatternMatch && skillMatch && departmentMatch && minCountMatch) {
              const shiftPattern = shiftPatternMatch[1];
              const skill = skillMatch[1];
              const department = departmentMatch[1];
              const minCount = minCountMatch[1];
              const penalty = penaltyMatch ? penaltyMatch[1] : '100';
              
              // Shift pattern'i parse et
              let shift = 'Gündüz';
              let weekType = 'Hafta İçi';
              
              if (shiftPattern.includes('Gece')) shift = 'Gece';
              else if (shiftPattern.includes('Mesai')) shift = 'Mesai';
              
              if (shiftPattern.includes('Hafta*Sonu')) weekType = 'Hafta Sonu';
              else if (shiftPattern.includes('Tümü')) weekType = 'Tümü';
              
              parsedSkillRules.push({
                id: `existing-skill-${index}`,
                department,
                skill,
                shift,
                weekType,
                minCount: parseInt(minCount),
                penalty: parseInt(penalty)
              });
            }
          });
          setSkillRules(parsedSkillRules);
        }
      }
      
      // Optimizasyon ağırlıklarını parse et
      const objectiveSection = yamlContent.match(/objective_weights:\s*([\s\S]*?)(?=\n\s*\w+:|$)/);
      if (objectiveSection) {
        const objectiveContent = objectiveSection[1];
        
        const minimizeOverstaffing = objectiveContent.match(/minimize_overstaffing:\s*(\d+\.?\d*)/)?.[1];
        const minimizeUnderstaffing = objectiveContent.match(/minimize_understaffing:\s*(\d+\.?\d*)/)?.[1];
        const maximizePreferences = objectiveContent.match(/maximize_preferences:\s*(\d+\.?\d*)/)?.[1];
        const balanceWorkload = objectiveContent.match(/balance_workload:\s*(\d+\.?\d*)/)?.[1];
        const maximizeShiftCoverage = objectiveContent.match(/maximize_shift_coverage:\s*(\d+\.?\d*)/)?.[1];
        
        if (minimizeOverstaffing || minimizeUnderstaffing || maximizePreferences || balanceWorkload || maximizeShiftCoverage) {
          setOptimizationWeights({
            minimize_overstaffing: parseFloat(minimizeOverstaffing || '1'),
            minimize_understaffing: parseFloat(minimizeUnderstaffing || '10'),
            maximize_preferences: parseFloat(maximizePreferences || '2'),
            balance_workload: parseFloat(balanceWorkload || '0.5'),
            maximize_shift_coverage: parseFloat(maximizeShiftCoverage || '1')
          });
        }
      }
      
      // Genel kuralları parse et
      const maxConsecutive = yamlContent.match(/max_consecutive_shifts:\s*(\d+)/)?.[1];
      const minRest = yamlContent.match(/min_rest_time_hours:\s*(\d+)/)?.[1];
      const solverTime = yamlContent.match(/solver_time_limit_seconds:\s*(\d+)/)?.[1];
      
      if (maxConsecutive || minRest || solverTime) {
        setGeneralRules({
          max_consecutive_shifts: parseInt(maxConsecutive || '3'),
          min_rest_time_hours: parseInt(minRest || '10'),
          solver_time_limit_seconds: parseInt(solverTime || '60')
        });
      }
      
      console.log('YAML parsing tamamlandı');
      
    } catch (error) {
      console.error('YAML parsing hatası:', error);
      setSnackbar({
        open: true,
        message: 'Mevcut kurallar yüklenirken bir hata oluştu. YAML formatını kontrol edin.',
        severity: 'warning'
      });
    }
  };

  // Form verilerini YAML'a dönüştürme
  const generateYamlFromRules = () => {
    let yaml = `institution_id: "${selectedConfig.split('.')[0]}"\n`;
    yaml += `institution_name: "Test ${selectedConfig.includes('hospital') ? 'Hastanesi' : 'Çağrı Merkezi'}"\n`;
    yaml += `problem_type: "shift_scheduling"\n\n`;
    
    yaml += `optimization_core:\n`;
    yaml += `  solver_time_limit_seconds: ${generalRules.solver_time_limit_seconds}\n`;
    yaml += `  objective_weights:\n`;
    yaml += `    minimize_overstaffing: ${optimizationWeights.minimize_overstaffing}\n`;
    yaml += `    minimize_understaffing: ${optimizationWeights.minimize_understaffing}\n`;
    yaml += `    maximize_preferences: ${optimizationWeights.maximize_preferences}\n`;
    yaml += `    balance_workload: ${optimizationWeights.balance_workload}\n`;
    yaml += `    maximize_shift_coverage: ${optimizationWeights.maximize_shift_coverage}\n\n`;
    
    yaml += `rules:\n`;
    yaml += `  min_staffing_requirements:\n`;
    
    staffingRules.forEach(rule => {
      yaml += `    - shift_pattern: "*${rule.shift}*${rule.weekType.replace(' ', '*')}*"\n`;
      yaml += `      role: "${rule.role}"\n`;
      yaml += `      department: "${rule.department}"\n`;
      yaml += `      min_count: ${rule.minCount}\n`;
      yaml += `      penalty_if_violated: ${rule.penalty}\n`;
    });
    
    yaml += `  max_consecutive_shifts: ${generalRules.max_consecutive_shifts}\n`;
    yaml += `  min_rest_time_hours: ${generalRules.min_rest_time_hours}\n\n`;
    
    if (skillRules.length > 0) {
      yaml += `  skill_requirements:\n`;
      skillRules.forEach(rule => {
        yaml += `    - shift_pattern: "*${rule.shift}*${rule.weekType.replace(' ', '*')}*"\n`;
        yaml += `      skill: "${rule.skill}"\n`;
        yaml += `      department: "${rule.department}"\n`;
        yaml += `      min_count: ${rule.minCount}\n`;
        yaml += `      penalty_if_violated: ${rule.penalty}\n`;
      });
    }
    
    return yaml;
  };

  // Yeni personel kuralı ekleme
  const addStaffingRule = () => {
    const newRule: StaffingRule = {
      id: Date.now().toString(),
      department: departments[0],
      role: roles[0],
      shift: shifts[0],
      weekType: weekTypes[0],
      minCount: 1,
      penalty: 100
    };
    setStaffingRules([...staffingRules, newRule]);
  };

  // Personel kuralını güncelleme
  const updateStaffingRule = (id: string, updates: Partial<StaffingRule>) => {
    setStaffingRules(staffingRules.map(rule => 
      rule.id === id ? { ...rule, ...updates } : rule
    ));
  };

  // Personel kuralını silme
  const removeStaffingRule = (id: string) => {
    setStaffingRules(staffingRules.filter(rule => rule.id !== id));
  };

  // Yetenek kuralı ekleme
  const addSkillRule = () => {
    const newRule: SkillRule = {
      id: Date.now().toString(),
      department: departments[0],
      skill: skills[0],
      shift: shifts[0],
      weekType: weekTypes[0],
      minCount: 1,
      penalty: 100
    };
    setSkillRules([...skillRules, newRule]);
  };

  // Yetenek kuralını güncelleme
  const updateSkillRule = (id: string, updates: Partial<SkillRule>) => {
    setSkillRules(skillRules.map(rule => 
      rule.id === id ? { ...rule, ...updates } : rule
    ));
  };

  // Yetenek kuralını silme
  const removeSkillRule = (id: string) => {
    setSkillRules(skillRules.filter(rule => rule.id !== id));
  };

  // Kural doğrulama
  const validateRules = () => {
    const errors: string[] = [];
    
    staffingRules.forEach((rule, index) => {
      if (rule.minCount < 1) {
        errors.push(`Personel Kuralı ${index + 1}: Minimum personel sayısı 1'den az olamaz`);
      }
      if (rule.penalty < 0) {
        errors.push(`Personel Kuralı ${index + 1}: Ceza değeri negatif olamaz`);
      }
    });

    skillRules.forEach((rule, index) => {
      if (rule.minCount < 1) {
        errors.push(`Yetenek Kuralı ${index + 1}: Minimum kişi sayısı 1'den az olamaz`);
      }
    });

    if (generalRules.max_consecutive_shifts < 1) {
      errors.push('Maksimum ardışık vardiya sayısı 1\'den az olamaz');
    }

    if (generalRules.min_rest_time_hours < 8) {
      errors.push('Minimum dinlenme süresi 8 saatten az olamaz');
    }

    return errors;
  };

  // Gelişmiş konfigürasyon kaydetme
  const handleAdvancedSaveConfig = async () => {
    const errors = validateRules();
    
    if (errors.length > 0) {
      setSnackbar({
        open: true,
        message: `Doğrulama hataları: ${errors.join(', ')}`,
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      const yamlContent = ruleMode === 'visual' ? generateYamlFromRules() : configContent;
      await api.saveConfigurationContent(selectedConfig, yamlContent);

      setSnackbar({
        open: true,
        message: 'Çizelgeleme kuralları başarıyla güncellendi',
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

  // Örnek senaryo uygulama
  const applyExampleScenario = (scenario: any) => {
    if (scenario.type === 'staffing') {
      const newRule: StaffingRule = {
        id: Date.now().toString(),
        ...scenario.rule
      };
      setStaffingRules([...staffingRules, newRule]);
      setRuleCategory(0); // Personel Gereksinimleri sekmesine geç
    } else if (scenario.type === 'skill') {
      const newRule: SkillRule = {
        id: Date.now().toString(),
        ...scenario.rule
      };
      setSkillRules([...skillRules, newRule]);
      setRuleCategory(1); // Yetenek Gereksinimleri sekmesine geç
    }

    setRuleMode('visual'); // Görsel editöre geç
    setShowHelpCenter(false); // Yardım merkezini kapat
    
    setSnackbar({
      open: true,
      message: `✅ "${scenario.name}" kuralı eklendi! Ayarları kontrol edip kaydedin.`,
      severity: 'success'
    });
  };

  // Smart Tooltip komponenti
  const SmartTooltip = ({ field, label, children }: { field: string; label: string; children: React.ReactNode }) => {
    const tooltip = tooltipTexts[field as keyof typeof tooltipTexts];

    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Typography variant="body2" fontWeight="600" sx={{ color: '#1976d2' }}>
            {label}
          </Typography>
          {tooltip && (
            <Tooltip
              title={
                <Box sx={{ p: 1 }}>
                  <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                    {tooltip.title}
                  </Typography>
                  <Typography variant="body2">
                    {tooltip.content}
                  </Typography>
                </Box>
              }
              arrow
              placement="top"
            >
              <IconButton size="small" sx={{ color: 'primary.main' }}>
                <HelpIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        {children}
      </Box>
    );
  };

  // Yardım Merkezi komponenti
  const HelpCenter = () => {
    const isHospital = selectedConfig.includes("hospital");
    const currentScenarios = isHospital 
      ? exampleScenarios.hospital 
      : exampleScenarios.callcenter;

    return (
      <Card sx={{
        p: 3,
        borderRadius: 2,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        border: '2px solid #1976d2',
        bgcolor: 'rgba(25, 118, 210, 0.02)'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="600" sx={{ color: '#1976d2' }}>
            📚 Hızlı Başlangıç Örnekleri
          </Typography>
          <IconButton onClick={() => setShowHelpCenter(false)}>
            <RemoveCircleIcon />
          </IconButton>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Aşağıdaki örneklerden birini seçin, otomatik olarak form doldurulsun ve kuralınızı hızlıca oluşturun!
          </Typography>
        </Alert>

        {isHospital ? (
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" fontWeight="600" sx={{ color: '#d32f2f', mb: 2 }}>
                🚨 ACİL SERVİS
              </Typography>
              {(currentScenarios as any).emergency?.map((scenario: any, index: number) => (
                <Card key={index} sx={{ p: 2, mb: 2, border: '1px solid rgba(211, 47, 47, 0.2)' }}>
                  <Typography variant="body2" fontWeight="600" gutterBottom>
                    {scenario.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" paragraph>
                    {scenario.description}
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    fullWidth
                    sx={{ bgcolor: '#d32f2f' }}
                    onClick={() => applyExampleScenario(scenario)}
                  >
                    Bu Kuralı Oluştur
                  </Button>
                </Card>
              ))}
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" fontWeight="600" sx={{ color: '#388e3c', mb: 2 }}>
                🏥 YOĞUN BAKIM
              </Typography>
              {(currentScenarios as any).icu?.map((scenario: any, index: number) => (
                <Card key={index} sx={{ p: 2, mb: 2, border: '1px solid rgba(56, 142, 60, 0.2)' }}>
                  <Typography variant="body2" fontWeight="600" gutterBottom>
                    {scenario.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" paragraph>
                    {scenario.description}
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    fullWidth
                    sx={{ bgcolor: '#388e3c' }}
                    onClick={() => applyExampleScenario(scenario)}
                  >
                    Bu Kuralı Oluştur
                  </Button>
                </Card>
              ))}
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" fontWeight="600" sx={{ color: '#f57c00', mb: 2 }}>
                ❤️ KARDİYOLOJİ
              </Typography>
              {(currentScenarios as any).cardiology?.map((scenario: any, index: number) => (
                <Card key={index} sx={{ p: 2, mb: 2, border: '1px solid rgba(245, 124, 0, 0.2)' }}>
                  <Typography variant="body2" fontWeight="600" gutterBottom>
                    {scenario.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" paragraph>
                    {scenario.description}
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    fullWidth
                    sx={{ bgcolor: '#f57c00' }}
                    onClick={() => applyExampleScenario(scenario)}
                  >
                    Bu Kuralı Oluştur
                  </Button>
                </Card>
              ))}
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" fontWeight="600" sx={{ color: '#1976d2', mb: 2 }}>
                👥 MÜŞTERİ HİZMETLERİ
              </Typography>
              {(currentScenarios as any).customer_service?.map((scenario: any, index: number) => (
                <Card key={index} sx={{ p: 2, mb: 2, border: '1px solid rgba(25, 118, 210, 0.2)' }}>
                  <Typography variant="body2" fontWeight="600" gutterBottom>
                    {scenario.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" paragraph>
                    {scenario.description}
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    fullWidth
                    sx={{ bgcolor: '#1976d2' }}
                    onClick={() => applyExampleScenario(scenario)}
                  >
                    Bu Kuralı Oluştur
                  </Button>
                </Card>
              ))}
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" fontWeight="600" sx={{ color: '#7b1fa2', mb: 2 }}>
                🔧 TEKNİK DESTEK
              </Typography>
              {(currentScenarios as any).technical?.map((scenario: any, index: number) => (
                <Card key={index} sx={{ p: 2, mb: 2, border: '1px solid rgba(123, 31, 162, 0.2)' }}>
                  <Typography variant="body2" fontWeight="600" gutterBottom>
                    {scenario.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" paragraph>
                    {scenario.description}
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    fullWidth
                    sx={{ bgcolor: '#7b1fa2' }}
                    onClick={() => applyExampleScenario(scenario)}
                  >
                    Bu Kuralı Oluştur
                  </Button>
                </Card>
              ))}
            </Grid>
          </Grid>
        )}

        <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(76, 175, 80, 0.1)', borderRadius: 1 }}>
          <Typography variant="body2" color="success.main" fontWeight="600">
            💡 İpucu: Örnek kuralı seçtikten sonra, form otomatik doldurulacak. İhtiyaçlarınıza göre ayarlayıp kaydedebilirsiniz.
          </Typography>
        </Box>
      </Card>
    );
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
            <Grid item xs={12} md={3}>
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
                  <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                    Düzenleme Modu
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Button
                      variant={ruleMode === 'visual' ? 'contained' : 'outlined'}
                      size="small"
                      startIcon={<PreviewIcon />}
                      onClick={() => setRuleMode('visual')}
                      sx={{ 
                        flex: 1, 
                        fontSize: '0.75rem',
                        bgcolor: ruleMode === 'visual' ? '#673ab7' : 'transparent',
                        borderColor: '#673ab7',
                        color: ruleMode === 'visual' ? 'white' : '#673ab7'
                      }}
                    >
                      Görsel
                    </Button>
                    <Button
                      variant={ruleMode === 'yaml' ? 'contained' : 'outlined'}
                      size="small"
                      startIcon={<CodeIcon />}
                      onClick={() => setRuleMode('yaml')}
                      sx={{ 
                        flex: 1, 
                        fontSize: '0.75rem',
                        bgcolor: ruleMode === 'yaml' ? '#673ab7' : 'transparent',
                        borderColor: '#673ab7',
                        color: ruleMode === 'yaml' ? 'white' : '#673ab7'
                      }}
                    >
                      YAML
                    </Button>
                  </Box>
                  
                  <Button
                    variant="contained"
                    startIcon={<InfoIcon />}
                    fullWidth
                    size="small"
                    sx={{
                      borderRadius: 2,
                      py: 1,
                      bgcolor: '#673ab7',
                      '&:hover': {
                        bgcolor: '#5e35b1'
                      },
                      boxShadow: '0 4px 10px rgba(103, 58, 183, 0.3)'
                    }}
                    onClick={() => setShowHelpCenter(!showHelpCenter)}
                  >
                    {showHelpCenter ? 'Yardımı Kapat' : 'Hızlı Örnekler'}
                  </Button>
                </Box>
              </Card>
            </Grid>

            <Grid item xs={12} md={9}>
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {configs.find(c => c.id === selectedConfig)?.name || 'Konfigürasyon'} Kuralları
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {ruleMode === 'visual' ? 'Görsel editör ile kuralları yönetin' : 'YAML editör ile kuralları düzenleyin'}
                      </Typography>
                    </Box>
                    <Chip
                      label={selectedConfig.includes("hospital") ? "Sağlık Kurumu" : "Çağrı Merkezi"}
                      color={selectedConfig.includes("hospital") ? "success" : "info"}
                    />
                  </Box>
                </Box>

                <Box sx={{ p: 3 }}>
                  {/* Yardım Merkezi */}
                  {showHelpCenter && <HelpCenter />}
                  
                  {ruleMode === 'visual' ? (
                    <>
                      {/* Görsel Editör */}
                      <Alert severity="info" sx={{ mb: 4 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          Görsel Kural Editörü
                        </Typography>
                        <Typography variant="body2">
                          Formları doldurarak çizelgeleme kurallarını kolayca oluşturun ve düzenleyin.
                          Tüm kurallar otomatik olarak doğrulanır ve YAML formatına dönüştürülür.
                        </Typography>
                      </Alert>

                      {/* Kural Kategorileri */}
                      <Box sx={{
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                        mb: 4
                      }}>
                        <Tabs
                          value={ruleCategory}
                          onChange={(e, newValue) => setRuleCategory(newValue)}
                          variant="fullWidth"
                          sx={{
                            '& .MuiTab-root': {
                              py: 2,
                              fontWeight: 600,
                              fontSize: '0.9rem',
                              minHeight: 'auto'
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
                          {ruleCategories.map((category, index) => (
                            <Tab
                              key={category.id}
                              icon={category.icon}
                              label={category.label}
                              iconPosition="start"
                              sx={{ 
                                color: category.color,
                                '&.Mui-selected': { color: category.color }
                              }}
                            />
                          ))}
                        </Tabs>
                      </Box>

                      {/* Personel Gereksinimleri */}
                      {ruleCategory === 0 && (
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6" fontWeight="600" sx={{ color: '#1976d2' }}>
                              Personel Gereksinimleri
                            </Typography>
                            <Button
                              variant="contained"
                              startIcon={<AddCircleIcon />}
                              onClick={addStaffingRule}
                              sx={{ bgcolor: '#1976d2' }}
                            >
                              Yeni Kural Ekle
                            </Button>
                          </Box>

                          {staffingRules.length === 0 ? (
                            <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'rgba(25, 118, 210, 0.05)' }}>
                              <PeopleIcon sx={{ fontSize: 48, color: '#1976d2', mb: 2 }} />
                              <Typography variant="h6" gutterBottom>
                                Henüz personel kuralı tanımlanmamış
                              </Typography>
                              <Typography variant="body2" color="text.secondary" paragraph>
                                Çizelgeleme için minimum personel gereksinimlerini tanımlayın
                              </Typography>
                              <Button
                                variant="contained"
                                startIcon={<AddCircleIcon />}
                                onClick={addStaffingRule}
                                sx={{ bgcolor: '#1976d2' }}
                              >
                                İlk Kuralı Ekle
                              </Button>
                            </Card>
                          ) : (
                            <Grid container spacing={3}>
                              {staffingRules.map((rule, index) => (
                                <Grid item xs={12} key={rule.id}>
                                  <Card sx={{ p: 3, border: '1px solid rgba(25, 118, 210, 0.2)' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                      <Typography variant="subtitle1" fontWeight="600">
                                        Personel Kuralı #{index + 1}
                                      </Typography>
                                      <IconButton
                                        color="error"
                                        onClick={() => removeStaffingRule(rule.id!)}
                                        size="small"
                                      >
                                        <RemoveCircleIcon />
                                      </IconButton>
                                    </Box>
                                    
                                    <Grid container spacing={3}>
                                      <Grid item xs={12} sm={6} md={3}>
                                        <SmartTooltip field="department" label="Departman">
                                          <FormControl fullWidth size="small">
                                            <Select
                                              value={rule.department}
                                              onChange={(e) => updateStaffingRule(rule.id!, { department: e.target.value })}
                                              placeholder="Seçiniz"
                                            >
                                              {departments.map(dept => (
                                                <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                                              ))}
                                            </Select>
                                          </FormControl>
                                        </SmartTooltip>
                                      </Grid>
                                      <Grid item xs={12} sm={6} md={3}>
                                        <SmartTooltip field="role" label="Rol">
                                          <FormControl fullWidth size="small">
                                            <Select
                                              value={rule.role}
                                              onChange={(e) => updateStaffingRule(rule.id!, { role: e.target.value })}
                                              placeholder="Seçiniz"
                                            >
                                              {roles.map(role => (
                                                <MenuItem key={role} value={role}>{role}</MenuItem>
                                              ))}
                                            </Select>
                                          </FormControl>
                                        </SmartTooltip>
                                      </Grid>
                                      <Grid item xs={12} sm={6} md={2}>
                                        <SmartTooltip field="shift" label="Vardiya">
                                          <FormControl fullWidth size="small">
                                            <Select
                                              value={rule.shift}
                                              onChange={(e) => updateStaffingRule(rule.id!, { shift: e.target.value })}
                                              placeholder="Seçiniz"
                                            >
                                              {shifts.map(shift => (
                                                <MenuItem key={shift} value={shift}>{shift}</MenuItem>
                                              ))}
                                            </Select>
                                          </FormControl>
                                        </SmartTooltip>
                                      </Grid>
                                      <Grid item xs={12} sm={6} md={2}>
                                        <SmartTooltip field="weekType" label="Hafta">
                                          <FormControl fullWidth size="small">
                                            <Select
                                              value={rule.weekType}
                                              onChange={(e) => updateStaffingRule(rule.id!, { weekType: e.target.value })}
                                              placeholder="Seçiniz"
                                            >
                                              {weekTypes.map(week => (
                                                <MenuItem key={week} value={week}>{week}</MenuItem>
                                              ))}
                                            </Select>
                                          </FormControl>
                                        </SmartTooltip>
                                      </Grid>
                                      <Grid item xs={6} sm={3} md={1.5}>
                                        <SmartTooltip field="minCount" label="Min">
                                          <TextField
                                            type="number"
                                            size="small"
                                            fullWidth
                                            value={rule.minCount}
                                            onChange={(e) => updateStaffingRule(rule.id!, { minCount: parseInt(e.target.value) || 1 })}
                                            inputProps={{ min: 1, style: { textAlign: 'center' } }}
                                            sx={{ 
                                              '& .MuiInputBase-input': { 
                                                textAlign: 'center',
                                                fontSize: '0.9rem',
                                                fontWeight: '600'
                                              }
                                            }}
                                          />
                                        </SmartTooltip>
                                      </Grid>
                                      <Grid item xs={6} sm={3} md={1.5}>
                                        <SmartTooltip field="penalty" label="Ceza">
                                          <TextField
                                            type="number"
                                            size="small"
                                            fullWidth
                                            value={rule.penalty}
                                            onChange={(e) => updateStaffingRule(rule.id!, { penalty: parseInt(e.target.value) || 100 })}
                                            inputProps={{ min: 0, style: { textAlign: 'center' } }}
                                            sx={{ 
                                              '& .MuiInputBase-input': { 
                                                textAlign: 'center',
                                                fontSize: '0.9rem',
                                                fontWeight: '600'
                                              }
                                            }}
                                          />
                                        </SmartTooltip>
                                      </Grid>
                                    </Grid>
                                    
                                    <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(25, 118, 210, 0.05)', borderRadius: 1 }}>
                                      <Typography variant="body2" color="text.secondary">
                                        <strong>Kural Özeti:</strong> {rule.department} departmanında {rule.shift.toLowerCase()} vardiyasında 
                                        ({rule.weekType.toLowerCase()}) minimum {rule.minCount} {rule.role.toLowerCase()} bulunmalıdır.
                                      </Typography>
                                    </Box>
                                  </Card>
                                </Grid>
                              ))}
                            </Grid>
                          )}
                        </Box>
                      )}

                      {/* Yetenek Gereksinimleri */}
                      {ruleCategory === 1 && (
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6" fontWeight="600" sx={{ color: '#388e3c' }}>
                              Yetenek Gereksinimleri
                            </Typography>
                            <Button
                              variant="contained"
                              startIcon={<AddCircleIcon />}
                              onClick={addSkillRule}
                              sx={{ bgcolor: '#388e3c' }}
                            >
                              Yeni Yetenek Kuralı
                            </Button>
                          </Box>

                          {skillRules.length === 0 ? (
                            <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'rgba(56, 142, 60, 0.05)' }}>
                              <SchoolIcon sx={{ fontSize: 48, color: '#388e3c', mb: 2 }} />
                              <Typography variant="h6" gutterBottom>
                                Henüz yetenek kuralı tanımlanmamış
                              </Typography>
                              <Typography variant="body2" color="text.secondary" paragraph>
                                Belirli vardiyalar için özel yetenek gereksinimleri tanımlayın
                              </Typography>
                              <Button
                                variant="contained"
                                startIcon={<AddCircleIcon />}
                                onClick={addSkillRule}
                                sx={{ bgcolor: '#388e3c' }}
                              >
                                İlk Yetenek Kuralını Ekle
                              </Button>
                            </Card>
                          ) : (
                            <Grid container spacing={3}>
                              {skillRules.map((rule, index) => (
                                <Grid item xs={12} key={rule.id}>
                                  <Card sx={{ p: 3, border: '1px solid rgba(56, 142, 60, 0.2)' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                      <Typography variant="subtitle1" fontWeight="600">
                                        Yetenek Kuralı #{index + 1}
                                      </Typography>
                                      <IconButton
                                        color="error"
                                        onClick={() => removeSkillRule(rule.id!)}
                                        size="small"
                                      >
                                        <RemoveCircleIcon />
                                      </IconButton>
                                    </Box>
                                    
                                    <Grid container spacing={3}>
                                      <Grid item xs={12} sm={6} md={3}>
                                        <SmartTooltip field="department" label="Departman">
                                          <FormControl fullWidth size="small">
                                            <Select
                                              value={rule.department}
                                              onChange={(e) => updateSkillRule(rule.id!, { department: e.target.value })}
                                              placeholder="Seçiniz"
                                            >
                                              {departments.map(dept => (
                                                <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                                              ))}
                                            </Select>
                                          </FormControl>
                                        </SmartTooltip>
                                      </Grid>
                                      <Grid item xs={12} sm={6} md={3}>
                                        <SmartTooltip field="skill" label="Yetenek">
                                          <FormControl fullWidth size="small">
                                            <Select
                                              value={rule.skill}
                                              onChange={(e) => updateSkillRule(rule.id!, { skill: e.target.value })}
                                              placeholder="Seçiniz"
                                            >
                                              {skills.map(skill => (
                                                <MenuItem key={skill} value={skill}>{skill}</MenuItem>
                                              ))}
                                            </Select>
                                          </FormControl>
                                        </SmartTooltip>
                                      </Grid>
                                      <Grid item xs={12} sm={6} md={2}>
                                        <Box>
                                          <Typography variant="body2" fontWeight="600" sx={{ mb: 1.5, color: '#388e3c' }}>
                                            Vardiya
                                          </Typography>
                                          <FormControl fullWidth size="small">
                                            <Select
                                              value={rule.shift}
                                              onChange={(e) => updateSkillRule(rule.id!, { shift: e.target.value })}
                                              placeholder="Seçiniz"
                                            >
                                              {shifts.map(shift => (
                                                <MenuItem key={shift} value={shift}>{shift}</MenuItem>
                                              ))}
                                            </Select>
                                          </FormControl>
                                        </Box>
                                      </Grid>
                                      <Grid item xs={12} sm={6} md={2}>
                                        <Box>
                                          <Typography variant="body2" fontWeight="600" sx={{ mb: 1.5, color: '#388e3c' }}>
                                            Hafta
                                          </Typography>
                                          <FormControl fullWidth size="small">
                                            <Select
                                              value={rule.weekType}
                                              onChange={(e) => updateSkillRule(rule.id!, { weekType: e.target.value })}
                                              placeholder="Seçiniz"
                                            >
                                              {weekTypes.map(week => (
                                                <MenuItem key={week} value={week}>{week}</MenuItem>
                                              ))}
                                            </Select>
                                          </FormControl>
                                        </Box>
                                      </Grid>
                                      <Grid item xs={6} sm={3} md={1.5}>
                                        <Box>
                                          <Typography variant="body2" fontWeight="600" sx={{ mb: 1.5, color: '#388e3c' }}>
                                            Min
                                          </Typography>
                                          <TextField
                                            type="number"
                                            size="small"
                                            fullWidth
                                            value={rule.minCount}
                                            onChange={(e) => updateSkillRule(rule.id!, { minCount: parseInt(e.target.value) || 1 })}
                                            inputProps={{ min: 1, style: { textAlign: 'center' } }}
                                            sx={{ 
                                              '& .MuiInputBase-input': { 
                                                textAlign: 'center',
                                                fontSize: '0.9rem',
                                                fontWeight: '600'
                                              }
                                            }}
                                          />
                                        </Box>
                                      </Grid>
                                      <Grid item xs={6} sm={3} md={1.5}>
                                        <Box>
                                          <Typography variant="body2" fontWeight="600" sx={{ mb: 1.5, color: '#388e3c' }}>
                                            Ceza
                                          </Typography>
                                          <TextField
                                            type="number"
                                            size="small"
                                            fullWidth
                                            value={rule.penalty}
                                            onChange={(e) => updateSkillRule(rule.id!, { penalty: parseInt(e.target.value) || 100 })}
                                            inputProps={{ min: 0, style: { textAlign: 'center' } }}
                                            sx={{ 
                                              '& .MuiInputBase-input': { 
                                                textAlign: 'center',
                                                fontSize: '0.9rem',
                                                fontWeight: '600'
                                              }
                                            }}
                                          />
                                        </Box>
                                      </Grid>
                                    </Grid>
                                    
                                    <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(56, 142, 60, 0.05)', borderRadius: 1 }}>
                                      <Typography variant="body2" color="text.secondary">
                                        <strong>Kural Özeti:</strong> {rule.department} departmanında {rule.shift.toLowerCase()} vardiyasında 
                                        ({rule.weekType.toLowerCase()}) {rule.skill} yeteneğine sahip minimum {rule.minCount} kişi bulunmalıdır.
                                      </Typography>
                                    </Box>
                                  </Card>
                                </Grid>
                              ))}
                            </Grid>
                          )}
                        </Box>
                      )}

                      {/* Optimizasyon Hedefleri */}
                      {ruleCategory === 2 && (
                        <Box>
                          <Typography variant="h6" fontWeight="600" sx={{ color: '#f57c00', mb: 3 }}>
                            Optimizasyon Hedefleri
                          </Typography>
                          
                          <Card sx={{ p: 3, border: '1px solid rgba(245, 124, 0, 0.2)' }}>
                            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                              Hedef Ağırlıkları
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                              Optimizasyon algoritmasının hangi hedeflere ne kadar önem vereceğini belirleyin (0-10 arası)
                            </Typography>
                            
                            <Grid container spacing={3}>
                              <Grid item xs={12} md={6}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="body2" fontWeight="600" gutterBottom>
                                    Fazla Personeli Minimize Et
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <TextField
                                      type="number"
                                      size="small"
                                      value={optimizationWeights.minimize_overstaffing}
                                      onChange={(e) => setOptimizationWeights({
                                        ...optimizationWeights,
                                        minimize_overstaffing: parseFloat(e.target.value) || 0
                                      })}
                                      inputProps={{ min: 0, max: 10, step: 0.1 }}
                                      sx={{ width: 100 }}
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                      Gereksiz personel atamalarını azaltır
                                    </Typography>
                                  </Box>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12} md={6}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="body2" fontWeight="600" gutterBottom>
                                    Eksik Personeli Minimize Et
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <TextField
                                      type="number"
                                      size="small"
                                      value={optimizationWeights.minimize_understaffing}
                                      onChange={(e) => setOptimizationWeights({
                                        ...optimizationWeights,
                                        minimize_understaffing: parseFloat(e.target.value) || 0
                                      })}
                                      inputProps={{ min: 0, max: 10, step: 0.1 }}
                                      sx={{ width: 100 }}
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                      Personel eksikliklerini önler (yüksek öncelik)
                                    </Typography>
                                  </Box>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12} md={6}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="body2" fontWeight="600" gutterBottom>
                                    Tercihleri Maksimize Et
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <TextField
                                      type="number"
                                      size="small"
                                      value={optimizationWeights.maximize_preferences}
                                      onChange={(e) => setOptimizationWeights({
                                        ...optimizationWeights,
                                        maximize_preferences: parseFloat(e.target.value) || 0
                                      })}
                                      inputProps={{ min: 0, max: 10, step: 0.1 }}
                                      sx={{ width: 100 }}
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                      Çalışan tercihlerini dikkate alır
                                    </Typography>
                                  </Box>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12} md={6}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="body2" fontWeight="600" gutterBottom>
                                    İş Yükünü Dengele
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <TextField
                                      type="number"
                                      size="small"
                                      value={optimizationWeights.balance_workload}
                                      onChange={(e) => setOptimizationWeights({
                                        ...optimizationWeights,
                                        balance_workload: parseFloat(e.target.value) || 0
                                      })}
                                      inputProps={{ min: 0, max: 10, step: 0.1 }}
                                      sx={{ width: 100 }}
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                      Çalışanlar arası iş yükü adaleti
                                    </Typography>
                                  </Box>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12}>
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="body2" fontWeight="600" gutterBottom>
                                    Vardiya Kapsamını Maksimize Et
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <TextField
                                      type="number"
                                      size="small"
                                      value={optimizationWeights.maximize_shift_coverage}
                                      onChange={(e) => setOptimizationWeights({
                                        ...optimizationWeights,
                                        maximize_shift_coverage: parseFloat(e.target.value) || 0
                                      })}
                                      inputProps={{ min: 0, max: 10, step: 0.1 }}
                                      sx={{ width: 100 }}
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                      Tüm vardiyaların etkin şekilde doldurulması
                                    </Typography>
                                  </Box>
                                </Box>
                              </Grid>
                            </Grid>
                          </Card>
                        </Box>
                      )}

                      {/* Genel Kurallar */}
                      {ruleCategory === 3 && (
                        <Box>
                          <Typography variant="h6" fontWeight="600" sx={{ color: '#7b1fa2', mb: 3 }}>
                            Genel Kurallar
                          </Typography>
                          
                          <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                              <Card sx={{ p: 3, border: '1px solid rgba(123, 31, 162, 0.2)' }}>
                                <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                                  Maksimum Ardışık Vardiya
                                </Typography>
                                <TextField
                                  type="number"
                                  value={generalRules.max_consecutive_shifts}
                                  onChange={(e) => setGeneralRules({
                                    ...generalRules,
                                    max_consecutive_shifts: parseInt(e.target.value) || 1
                                  })}
                                  inputProps={{ min: 1, max: 7 }}
                                  fullWidth
                                  helperText="Bir çalışanın üst üste kaç vardiya çalışabileceği"
                                />
                              </Card>
                            </Grid>
                            
                            <Grid item xs={12} md={4}>
                              <Card sx={{ p: 3, border: '1px solid rgba(123, 31, 162, 0.2)' }}>
                                <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                                  Minimum Dinlenme Süresi (Saat)
                                </Typography>
                                <TextField
                                  type="number"
                                  value={generalRules.min_rest_time_hours}
                                  onChange={(e) => setGeneralRules({
                                    ...generalRules,
                                    min_rest_time_hours: parseInt(e.target.value) || 8
                                  })}
                                  inputProps={{ min: 8, max: 24 }}
                                  fullWidth
                                  helperText="Vardiyalar arası minimum dinlenme süresi"
                                />
                              </Card>
                            </Grid>
                            
                            <Grid item xs={12} md={4}>
                              <Card sx={{ p: 3, border: '1px solid rgba(123, 31, 162, 0.2)' }}>
                                <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                                  Çözüm Süresi Limiti (Saniye)
                                </Typography>
                                <TextField
                                  type="number"
                                  value={generalRules.solver_time_limit_seconds}
                                  onChange={(e) => setGeneralRules({
                                    ...generalRules,
                                    solver_time_limit_seconds: parseInt(e.target.value) || 60
                                  })}
                                  inputProps={{ min: 30, max: 300 }}
                                  fullWidth
                                  helperText="Optimizasyon algoritmasının maksimum çalışma süresi"
                                />
                              </Card>
                            </Grid>
                          </Grid>
                        </Box>
                      )}

                      {/* Kaydet butonu ve validasyon */}
                      <Box sx={{ mt: 4, p: 3, bgcolor: 'rgba(76, 175, 80, 0.05)', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="600" color="success.main">
                              Kurallar Hazır
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {staffingRules.length} personel kuralı, {skillRules.length} yetenek kuralı tanımlandı
                            </Typography>
                          </Box>
                          <Button
                            variant="contained"
                            color="success"
                            startIcon={<SaveIcon />}
                            onClick={handleAdvancedSaveConfig}
                            disabled={loading}
                            sx={{ px: 4, py: 1.5 }}
                          >
                            {loading ? 'Kaydediliyor...' : 'Kuralları Kaydet'}
                          </Button>
                        </Box>
                      </Box>
                    </>
                  ) : (
                    <>
                      {/* YAML Editör */}
                      <Alert severity="warning" sx={{ mb: 4 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          Gelişmiş YAML Editörü
                        </Typography>
                        <Typography variant="body2">
                          YAML formatında doğrudan düzenleme yapıyorsunuz. Syntax hatalarından kaçınmak için dikkatli olun.
                          Görsel editöre geçmek için yukarıdan "Görsel" sekmesini seçin.
                        </Typography>
                      </Alert>

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
                          rows={20}
                          value={configContent || 'Konfigürasyon yükleniyor...'}
                          onChange={(e) => setConfigContent(e.target.value)}
                          variant="outlined"
                          InputProps={{
                            sx: {
                              borderRadius: 2,
                              fontFamily: 'monospace',
                              fontSize: '0.875rem'
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
                            disabled={loading}
                          >
                            {loading ? 'Kaydediliyor...' : 'YAML Kuralları Kaydet'}
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<PreviewIcon />}
                            sx={{
                              borderRadius: 2,
                              py: 1.2,
                              px: 3,
                              color: '#673ab7',
                              borderColor: '#673ab7'
                            }}
                            onClick={() => setRuleMode('visual')}
                          >
                            Görsel Editöre Geç
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
                            YAML Formatı Hakkında Bilgi
                          </Typography>
                        </Box>
                        <Typography variant="body2" paragraph>
                          YAML formatında düzenleme yaparken indentasyon (girinti) önemlidir. Boşluk karakteri kullanın, tab karakteri kullanmayın.
                          Kural tanımları hakkında daha fazla bilgi için sistem yöneticinize başvurun.
                        </Typography>
                      </Card>
                    </>
                  )}
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
