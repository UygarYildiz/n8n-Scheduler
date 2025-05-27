# React TypeScript Frontend - Uygulama Dokümantasyonu

Bu belge, Kurumsal Optimizasyon ve Otomasyon Çözümü'nün React TypeScript tabanlı frontend uygulamasını detaylandırmaktadır. Gerçek uygulama detayları, bileşen yapısı, kimlik doğrulama sistemi ve API entegrasyonlarını kapsar.

## 1. Teknoloji Yığını ve Mimari

### 1.1. Temel Teknolojiler

**Frontend Çerçevesi:**
- **React 18.2.0** - Modern React hooks ve fonksiyonel bileşenler
- **TypeScript** - Tip güvenliği ve geliştirici deneyimi
- **Vite** - Hızlı derleme aracı ve geliştirme sunucusu

**UI Çerçevesi:**
- **Material UI (MUI) 5.15.12** - Modern UI bileşenleri ve tema sistemi
- **Material Icons** - Tutarlı ikon seti
- **CssBaseline** - CSS normalleştirme ve sıfırlama

**Yönlendirme ve Navigasyon:**
- **React Router 6.22.3** - İstemci tarafı yönlendirme ve navigasyon
- **Korumalı Rotalar** - Rol tabanlı erişim kontrolü
- **İç İçe Yönlendirme** - Düzen tabanlı rota organizasyonu

**HTTP İstemcisi ve API:**
- **Axios 1.6.7** - HTTP istemcisi ve API entegrasyonu
- **Vite Proxy** - Geliştirme ortamı API proxy'si
- **Interceptors** - İstek/yanıt işleme

**Durum Yönetimi:**
- **React Context API** - Global durum yönetimi
- **Özel Hook'lar** - Yeniden kullanılabilir durum mantığı
- **localStorage** - İstemci tarafı kalıcılık

### 1.2. Proje Yapısı

```
ui/
├── public/                 # Statik varlıklar
├── src/
│   ├── components/         # Yeniden kullanılabilir UI bileşenleri
│   │   ├── ProtectedRoute.tsx
│   │   └── [diğer bileşenler]
│   ├── contexts/          # React Context sağlayıcıları
│   │   └── AuthContext.tsx
│   ├── hooks/             # Özel React hook'ları
│   │   └── usePermissions.ts
│   ├── layouts/           # Sayfa düzenleri
│   │   └── MainLayout.tsx
│   ├── pages/             # Sayfa bileşenleri
│   │   ├── LoginPage.tsx
│   │   ├── Dashboard.tsx
│   │   ├── AdminPage.tsx
│   │   ├── DatasetConfig.tsx
│   │   ├── OptimizationParams.tsx
│   │   ├── Results.tsx
│   │   ├── ScheduleView.tsx
│   │   ├── Settings.tsx
│   │   ├── SessionManagement.tsx
│   │   └── AuditLogs.tsx
│   ├── services/          # API servis katmanı
│   │   ├── api.ts
│   │   └── adminService.ts
│   ├── types/             # TypeScript tip tanımları
│   ├── utils/             # Yardımcı fonksiyonlar
│   ├── theme.ts           # Material UI tema konfigürasyonu
│   ├── App.tsx            # Ana uygulama bileşeni
│   ├── main.tsx           # Uygulama giriş noktası
│   └── index.css          # Global stiller
├── index.html             # HTML şablonu
├── package.json           # Bağımlılıklar ve scriptler
├── tsconfig.json          # TypeScript konfigürasyonu
└── vite.config.ts         # Vite konfigürasyonu
```

### 1.3. Derleme ve Geliştirme Konfigürasyonu

**Vite Konfigürasyonu:**
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',  // FastAPI backend
        changeOrigin: true
      },
      '/webhook': {
        target: 'http://localhost:5678',  // n8n webhook'ları
        changeOrigin: true,
        secure: false
      }
    }
  }
})
```

**TypeScript Konfigürasyonu:**
- **Hedef:** ES2020
- **Modül:** ESNext
- **JSX:** react-jsx
- **Katı mod:** Etkin
- **Yol eşleme:** `@/*` → `src/*`

## 2. Kimlik Doğrulama Sistemi Uygulaması

### 2.1. AuthContext Mimarisi

**Kullanıcı Arayüzü:**
```typescript
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_active: boolean;
  organization: {
    id: number;
    name: string;
    type: string;
  };
  role: {
    id: number;
    name: string;
    display_name: string;
  };
}
```

**AuthContext Arayüzü:**
```typescript
export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
```

### 2.2. Kimlik Doğrulama Akışı

**Giriş Süreci:**
1. Kullanıcı LoginPage üzerinden kimlik bilgilerini gönderir
2. AuthContext.login() `/auth/login` endpoint'ini çağırır
3. JWT token localStorage'da saklanır
4. Axios varsayılan Authorization header'ı ayarlanır
5. Kullanıcı profil verisi context'te saklanır
6. Hedeflenen sayfaya veya dashboard'a yönlendirme

**Token Kalıcılığı:**
- JWT token localStorage'da saklanır
- Uygulama başlangıcında otomatik başlatma
- Profil yenileme ile token doğrulama
- Çıkış/hata durumunda otomatik temizlik

**Çıkış Süreci:**
- localStorage token'ını temizle
- Axios Authorization header'ını kaldır
- Kullanıcı durumunu null'a sıfırla
- Giriş sayfasına yönlendir

## 3. Rol Tabanlı Erişim Kontrolü (RBAC)

### 3.1. Rol Hiyerarşisi

**Rol Tanımları:**
```typescript
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ORG_ADMIN: 'org_admin',
  MANAGER: 'manager',
  PLANNER: 'planner',
  STAFF: 'staff'
} as const;
```

**Rol Renkleri:**
- **SUPER_ADMIN:** #d32f2f (Kırmızı)
- **ORG_ADMIN:** #f57c00 (Turuncu)
- **MANAGER:** #1976d2 (Mavi)
- **PLANNER:** #388e3c (Yeşil)
- **STAFF:** #7b1fa2 (Mor)

### 3.2. Sayfa Erişim Kontrolü

**Sayfa İzinleri:**
```typescript
export const PAGE_PERMISSIONS = {
  DASHBOARD: ['super_admin', 'org_admin', 'manager', 'planner', 'staff'],
  ADMIN_PANEL: ['super_admin', 'org_admin'],
  DATASET_CONFIG: ['super_admin', 'org_admin', 'manager'],
  OPTIMIZATION_PARAMS: ['super_admin', 'org_admin', 'manager', 'planner'],
  RESULTS: ['super_admin', 'org_admin', 'manager', 'planner', 'staff'],
  SCHEDULE_VIEW: ['super_admin', 'org_admin', 'manager', 'planner', 'staff'],
  SETTINGS: ['super_admin', 'org_admin']
};
```

### 3.3. usePermissions Hook'u

**İzin Kontrol Fonksiyonları:**
```typescript
export const usePermissions = () => {
  const { user } = useAuth();

  const hasRole = (role: string): boolean => {
    return user?.role?.name === role;
  };

  const canAccessPage = (page: keyof typeof PAGE_PERMISSIONS): boolean => {
    if (!user?.role?.name) return false;
    return PAGE_PERMISSIONS[page].includes(user.role.name);
  };

  const canPerformAction = (action: keyof typeof ACTION_PERMISSIONS): boolean => {
    if (!user?.role?.name) return false;
    return ACTION_PERMISSIONS[action].includes(user.role.name);
  };

  // Kolaylık metodları
  const isAdmin = hasRole(ROLES.SUPER_ADMIN) || hasRole(ROLES.ORG_ADMIN);
  const canManageUsers = canPerformAction('MANAGE_USERS');
  const canRunOptimization = canPerformAction('RUN_OPTIMIZATION');

  return {
    hasRole,
    canAccessPage,
    canPerformAction,
    isAdmin,
    canManageUsers,
    canRunOptimization
  };
};
```

## 4. Yönlendirme Mimarisi

### 4.1. Rota Yapısı

**App.tsx Rota Konfigürasyonu:**
```typescript
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Routes>
          {/* Genel Rotalar */}
          <Route path="/login" element={<LoginPage />} />

          {/* Korumalı Rotalar */}
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={
              <ProtectedRoute requiredPage="DASHBOARD">
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="admin" element={
              <ProtectedRoute requiredPage="ADMIN_PANEL" showAccessDenied={true}>
                <AdminPage />
              </ProtectedRoute>
            } />
            {/* ... diğer rotalar */}
          </Route>

          {/* Tüm rotaları yakala */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}
```

### 4.2. ProtectedRoute Bileşeni

**Erişim Kontrol Mantığı:**
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPage?: keyof typeof PAGE_PERMISSIONS;
  showAccessDenied?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPage,
  showAccessDenied = false
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { canAccessPage } = usePermissions();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredPage && !canAccessPage(requiredPage)) {
    return showAccessDenied ? <AccessDeniedPage /> : <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
```

### 4.3. MainLayout Navigasyonu

**Menü Öğesi Konfigürasyonu:**
```typescript
const allMenuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', requiredPage: 'DASHBOARD' as const },
  { text: 'Yönetici Paneli', icon: <PersonIcon />, path: '/admin', requiredPage: 'ADMIN_PANEL' as const },
  { text: 'Veri Seti ve Konfigürasyon', icon: <DatasetIcon />, path: '/dataset-config', requiredPage: 'DATASET_CONFIG' as const },
  { text: 'Vardiya Optimizasyonu', icon: <TuneIcon />, path: '/optimization-params', requiredPage: 'OPTIMIZATION_PARAMS' as const },
  { text: 'Sonuçlar ve Raporlar', icon: <AssessmentIcon />, path: '/results', requiredPage: 'RESULTS' as const },
  { text: 'Vardiya Çizelgesi', icon: <CalendarIcon />, path: '/schedule-view', requiredPage: 'SCHEDULE_VIEW' as const },
  { text: 'Ayarlar', icon: <SettingsIcon />, path: '/settings', requiredPage: 'SETTINGS' as const }
];

// Kullanıcı izinlerine göre menü öğelerini filtrele
const visibleMenuItems = allMenuItems.filter(item =>
  canAccessPage(item.requiredPage)
);
```

## 5. API Entegrasyon Mimarisi

### 5.1. Servis Katmanı Deseni

**API Servis Yapısı:**
```typescript
// services/api.ts
export const api = {
  // Dashboard verisi
  getDashboardData: async () => {
    const response = await axios.get('/api/dashboard');
    return response.data;
  },

  // Doğrudan FastAPI optimizasyonu (eski)
  runOptimization: async (data: any) => {
    const response = await axios.post('/api/optimize', data);
    return response.data;
  },

  // n8n webhook entegrasyonu
  triggerWebhook: async (webhookPath: string, queryParams: any, bodyData?: any) => {
    const queryString = new URLSearchParams(queryParams).toString();
    const fullWebhookUrl = `/webhook${webhookPath}?${queryString}`;

    if (bodyData) {
      const response = await axios.post(fullWebhookUrl, bodyData);
      return response.data;
    } else {
      const response = await axios.get(fullWebhookUrl);
      return response.data;
    }
  },

  // n8n iş akışı ile optimizasyon
  startOptimization: async (params: OptimizationParams) => {
    const queryParams = {
      veriSeti: params.datasetId,
      kurallar: params.configId
    };

    const bodyData = {
      objective_weights: params.weights,
      solver_params: params.solverParams
    };

    return await api.triggerWebhook('/optimization', queryParams, bodyData);
  }
};
```

### 5.2. Hata İşleme Deseni

**Global Hata İşleme:**
```typescript
// Hata işleme için Axios interceptor
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token süresi doldu, giriş sayfasına yönlendir
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }

    if (error.response?.status >= 500) {
      // Sunucu hatası, kullanıcı dostu mesaj göster
      console.error('Sunucu hatası:', error);
    }

    return Promise.reject(error);
  }
);
```

**Bileşen Seviyesi Hata İşleme:**
```typescript
const [error, setError] = useState<string>('');
const [loading, setLoading] = useState(false);

const handleApiCall = async () => {
  try {
    setLoading(true);
    setError('');
    const result = await api.someApiCall();
    // Başarı durumunu işle
  } catch (err) {
    console.error('API çağrısı başarısız:', err);
    setError('İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.');
  } finally {
    setLoading(false);
  }
};
```

### 5.3. Vite Proxy Konfigürasyonu

**Geliştirme Proxy Kurulumu:**
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',  // FastAPI backend
        changeOrigin: true
      },
      '/webhook': {
        target: 'http://localhost:5678',  // n8n webhook'ları
        changeOrigin: true,
        secure: false
      }
    }
  }
})
```

## 6. Sayfa Uygulamaları

### 6.1. LoginPage Bileşeni

**Özellikler:**
- Material UI form bileşenleri
- Form doğrulama
- Yükleme durumları
- Hata işleme
- Demo kimlik bilgileri yardımcısı
- Şifre görünürlük değiştirme

**Ana Uygulama:**
```typescript
const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const success = await login({ username, password });
      if (success) {
        navigate(from, { replace: true });
      } else {
        setError('Kullanıcı adı veya şifre hatalı');
      }
    } catch (err) {
      setError('Giriş sırasında bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };
};
```

### 6.2. Dashboard Bileşeni

**Özellikler:**
- Gerçek zamanlı metrik gösterimi
- Son optimizasyon raporu
- Sistem durum göstergeleri
- Hızlı eylem düğmeleri
- Yedek veri ile hata işleme

**Ana Metrikler:**
- Eksik/Fazla personel sayıları
- Kapsama oranı
- Yetenek kapsamı
- Tercih skoru
- İş yükü dengesi

### 6.3. AdminPage Bileşeni

**Özellikler:**
- Kullanıcı yönetimi
- Organizasyon yönetimi
- Rol yönetimi
- Yönetici istatistikleri
- Toplu işlemler

**Veri Yükleme Deseni:**
```typescript
const loadData = async () => {
  setLoading(true);
  try {
    const [usersData, statsData, orgsData, rolesData] = await Promise.all([
      adminService.getAllUsers(),
      adminService.getAdminStats(),
      adminService.getOrganizations(),
      adminService.getRoles()
    ]);

    setUsers(usersData.users);
    setStats(statsData);
    setOrganizations(orgsData);
    setRoles(rolesData);
  } catch (error) {
    console.error('Veri yükleme hatası:', error);
    setSnackbar({
      open: true,
      message: 'Veriler yüklenirken hata oluştu',
      severity: 'error'
    });
  } finally {
    setLoading(false);
  }
};
```

### 6.4. OptimizationParams Bileşeni

**Özellikler:**
- Veri seti seçimi
- Konfigürasyon dosyası seçimi
- Hedef ağırlık ayarlaması
- Çözücü parametre konfigürasyonu
- Gerçek zamanlı optimizasyon yürütme
- İlerleme takibi

**Form İşleme:**
```typescript
const handleOptimizationSubmit = async () => {
  try {
    setLoading(true);
    setError('');

    const result = await api.startOptimization({
      datasetId: selectedDataset,
      configId: selectedConfig,
      weights: objectiveWeights,
      solverParams: solverParameters
    });

    // Sonuçları sakla ve yönlendir
    localStorage.setItem('optimizationResults', JSON.stringify(result));
    setSuccess(true);
    setResultMessage('Optimizasyon başarıyla tamamlandı!');
    setShowSuccessDialog(true);

  } catch (error) {
    console.error('Optimizasyon hatası:', error);
    setError('Optimizasyon sırasında bir hata oluştu');
  } finally {
    setLoading(false);
  }
};
```

### 6.5. Results Bileşeni

**Özellikler:**
- Optimizasyon sonuçları görselleştirme
- Performans metrik grafikleri
- Atama detayları tablosu
- Dışa aktarma işlevselliği
- Geçmiş karşılaştırma

### 6.6. ScheduleView Bileşeni

**Özellikler:**
- Takvim görünümü (günlük, haftalık, aylık)
- Atama filtreleme ve sıralama
- Manuel düzenleme yetenekleri
- Çakışma tespiti
- Kaydetme ve yeniden optimizasyon işlevselliği

## 7. UI/UX Tasarım Sistemi

### 7.1. Material UI Tema Konfigürasyonu

**Tema Özelleştirmesi:**
```typescript
// theme.ts
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});
```

### 7.2. Tasarım İlkeleri

**Temel İlkeler:**
- **Basitlik:** Karmaşık optimizasyon süreçlerinin sezgisel arayüzlerle sunumu
- **Tutarlılık:** Tüm ekranlarda birleşik tasarım dili
- **Geri Bildirim:** Eylemler ve sistem durumu için açık kullanıcı geri bildirimi
- **Erişilebilirlik:** Farklı yeteneklerdeki kullanıcılar için erişilebilir tasarım
- **Duyarlılık:** Mobil öncelikli duyarlı tasarım yaklaşımı

**Bileşen Desenleri:**
- Material UI Skeleton bileşenleri ile yükleme durumları
- Kullanıcı dostu hata mesajları ile hata sınırları
- Kullanıcı geri bildirimi için Snackbar bildirimleri
- Yıkıcı eylemler için onay diyalogları
- Karmaşık formlar için aşamalı açıklama

### 7.3. Kullanıcı Akışları

#### 7.3.1. Kimlik Doğrulama Akışı
1. Kullanıcı korumalı rotaya erişir
2. Kimlik doğrulanmamışsa giriş sayfasına yönlendir
3. Kimlik bilgilerini gönder
4. JWT token saklanır ve axios başlıkları ayarlanır
5. Hedeflenen sayfaya veya dashboard'a yönlendir

#### 7.3.2. Optimizasyon İş Akışı
1. Optimizasyon Parametreleri sayfasına git
2. Veri seti ve konfigürasyon seç
3. Hedef ağırlıkları ve çözücü parametrelerini ayarla
4. n8n webhook'una optimizasyon isteği gönder
5. İlerlemeyi izle (varsa)
6. Sonuçları Results sayfasında görüntüle
7. İsteğe bağlı olarak çizelgeyi ScheduleView sayfasında görüntüle

#### 7.3.3. Yönetici Yönetim Akışı
1. Yönetici Paneline erişim (rol tabanlı erişim)
2. Sistem istatistiklerini görüntüle
3. Kullanıcıları, organizasyonları, rolleri yönet
4. Toplu işlemler gerçekleştir
5. Sistem sağlığını izle

## 8. Performans Optimizasyonu

### 8.1. Kod Bölme ve Tembel Yükleme

**Rota Tabanlı Kod Bölme:**
```typescript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const OptimizationParams = lazy(() => import('./pages/OptimizationParams'));

// Yükleme geri dönüşü ile Suspense'e sar
<Suspense fallback={<CircularProgress />}>
  <Dashboard />
</Suspense>
```

### 8.2. Durum Yönetimi Optimizasyonu

**Context Optimizasyonu:**
- Farklı endişeler için ayrı context'ler (Auth, Theme, vb.)
- Gereksiz yeniden render'ları önlemek için context değerlerinin memoization'ı
- Context tüketimi için özel hook'lar

**Bileşen Optimizasyonu:**
```typescript
// Pahalı hesaplamaları memoize et
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Callback fonksiyonlarını memoize et
const handleClick = useCallback(() => {
  // Tıklamayı işle
}, [dependency]);

// Bileşenleri memoize et
const MemoizedComponent = React.memo(Component);
```

### 8.3. API Optimizasyonu

**İstek Optimizasyonu:**
- Debounced arama girdileri
- Eski istekler için istek iptali
- Statik veri için önbellekleme stratejileri
- Büyük veri setleri için sayfalama

**Bundle Optimizasyonu:**
- Kullanılmayan kod eliminasyonu için tree shaking
- Büyük kütüphaneler için dinamik import'lar
- Vite'ın yerleşik optimizasyonları

## 9. Hata İşleme ve Kullanıcı Geri Bildirimi

### 9.1. Hata Sınırı Uygulaması

**Global Hata Sınırı:**
```typescript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Sınır tarafından yakalanan hata:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallbackComponent />;
    }

    return this.props.children;
  }
}
```

### 9.2. Kullanıcı Geri Bildirim Desenleri

**Snackbar Bildirimleri:**
```typescript
const [snackbar, setSnackbar] = useState({
  open: false,
  message: '',
  severity: 'info' as 'success' | 'error' | 'warning' | 'info'
});

const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
  setSnackbar({ open: true, message, severity });
};
```

**Yükleme Durumları:**
- İçerik yükleme için iskelet yükleyiciler
- Uzun işlemler için ilerleme göstergeleri
- Form gönderimler için devre dışı durumlar

**Doğrulama Geri Bildirimi:**
- Gerçek zamanlı form doğrulama
- Açık hata mesajları
- Alan seviyesi doğrulama göstergeleri

## 10. Test Stratejisi

### 10.1. Test Yaklaşımı

**Birim Testleri:**
- Test çalıştırıcısı için Jest
- Bileşen testleri için React Testing Library
- API mocking için Mock Service Worker (MSW)

**Entegrasyon Testleri:**
- Uçtan uca kullanıcı akışları
- API entegrasyon testleri
- Kimlik doğrulama akış testleri

**Bileşen Testleri:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginPage } from './LoginPage';

test('başarısız girişte hata mesajı göstermeli', async () => {
  render(<LoginPage />);

  fireEvent.change(screen.getByLabelText(/kullanıcı adı/i), {
    target: { value: 'invalid' }
  });

  fireEvent.change(screen.getByLabelText(/şifre/i), {
    target: { value: 'invalid' }
  });

  fireEvent.click(screen.getByRole('button', { name: /giriş yap/i }));

  expect(await screen.findByText(/kullanıcı adı veya şifre hatalı/i)).toBeInTheDocument();
});
```

### 10.2. Erişilebilirlik Testleri

**Erişilebilirlik Standartları:**
- WCAG 2.1 AA uyumluluğu
- Klavye navigasyon desteği
- Ekran okuyucu uyumluluğu
- Renk kontrastı doğrulaması

**Test Araçları:**
- Otomatik erişilebilirlik testleri için axe-core
- Manuel klavye navigasyon testleri
- NVDA/JAWS ile ekran okuyucu testleri

## 11. Geliştirme Rehberleri

### 11.1. Kod Standartları

**TypeScript En İyi Uygulamaları:**
```typescript
// Katı tipleme kullan
interface ComponentProps {
  title: string;
  onSubmit: (data: FormData) => Promise<void>;
  isLoading?: boolean;
}

// Uygun hata işleme kullan
const handleAsyncOperation = async (): Promise<Result | null> => {
  try {
    const result = await api.someOperation();
    return result;
  } catch (error) {
    console.error('İşlem başarısız:', error);
    return null;
  }
};

// Uygun bileşen desenleri kullan
const MyComponent: React.FC<ComponentProps> = ({ title, onSubmit, isLoading = false }) => {
  // Bileşen uygulaması
};
```

**Dosya Organizasyonu:**
```
src/
├── components/
│   ├── common/          # Yeniden kullanılabilir bileşenler
│   ├── forms/           # Form özel bileşenleri
│   └── layout/          # Düzen bileşenleri
├── pages/               # Sayfa bileşenleri
├── hooks/               # Özel hook'lar
├── services/            # API servisleri
├── types/               # TypeScript tipleri
├── utils/               # Yardımcı fonksiyonlar
└── constants/           # Uygulama sabitleri
```

### 11.2. Bileşen Geliştirme Desenleri

**Özel Hook Deseni:**
```typescript
// hooks/useApiData.ts
export const useApiData = <T>(endpoint: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const result = await api.get<T>(endpoint);
        setData(result);
      } catch (err) {
        setError('Veri yükleme başarısız');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [endpoint]);

  return { data, loading, error, refetch: fetchData };
};
```

**Form İşleme Deseni:**
```typescript
// hooks/useForm.ts
export const useForm = <T>(initialValues: T, validationSchema?: any) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<T>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const handleChange = (field: keyof T) => (value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      validateField(field, value);
    }
  };

  const validateField = (field: keyof T, value: any) => {
    // Doğrulama mantığı
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    validate: () => validateForm(),
    reset: () => setValues(initialValues)
  };
};
```

### 11.3. Derleme ve Dağıtım

**Geliştirme Komutları:**
```bash
# Geliştirme sunucusunu başlat
npm run dev

# Üretim için derle
npm run build

# Üretim derlemesini önizle
npm run preview

# Tip kontrolü
npm run type-check

# Linting
npm run lint

# Test
npm run test
```

**Ortam Konfigürasyonu:**
```typescript
// .env.development
VITE_API_BASE_URL=http://localhost:8000
VITE_N8N_BASE_URL=http://localhost:5678
VITE_APP_TITLE=Optimizasyon Sistemi (Dev)

// .env.production
VITE_API_BASE_URL=https://api.production.com
VITE_N8N_BASE_URL=https://n8n.production.com
VITE_APP_TITLE=Optimizasyon Sistemi
```

## 12. Güvenlik Değerlendirmeleri

### 12.1. Frontend Güvenliği

**Kimlik Doğrulama Güvenliği:**
- JWT token localStorage'da saklanır (üretim için httpOnly cookies düşünülebilir)
- Otomatik token yenileme mekanizması
- Token temizliği ile güvenli çıkış
- Durum değiştiren işlemler için CSRF koruması

**Veri Koruması:**
- Kullanıcı girdileri için girdi temizleme
- React'ın yerleşik kaçış özelliği ile XSS koruması
- İçerik Güvenlik Politikası (CSP) başlıkları
- HTTPS üzerinden güvenli API iletişimi

**Erişim Kontrolü:**
- Rol tabanlı rota koruması
- Bileşen seviyesi izin kontrolleri
- API endpoint yetkilendirmesi
- UI'da hassas veri maskeleme

### 12.2. Üretim Değerlendirmeleri

**Performans Güvenliği:**
- Hassas veri maruziyeti için bundle analizi
- Üretimde kaynak harita koruması
- Ortam değişkeni güvenliği
- Üçüncü taraf bağımlılık denetimi

## 13. İzleme ve Analitik

### 13.1. Hata İzleme

**Hata Takibi:**
```typescript
// utils/errorTracking.ts
export const trackError = (error: Error, context?: any) => {
  console.error('Uygulama hatası:', error, context);

  // İzleme servisine gönder (örn: Sentry)
  if (process.env.NODE_ENV === 'production') {
    // Sentry.captureException(error, { extra: context });
  }
};
```

### 13.2. Performans İzleme

**Performans Metrikleri:**
- Core Web Vitals takibi
- API yanıt süresi izleme
- Bileşen render performansı
- Bundle boyutu izleme

**Kullanıcı Analitikleri:**
- Kullanıcı etkileşim takibi
- Özellik kullanım analitikleri
- Hata oranı izleme
- Performans darboğazı tanımlama

## 14. Gelecek Yol Haritası

### 14.1. Kısa Vadeli Geliştirmeler (Sonraki 3 ay)

**Teknik İyileştirmeler:**
- Progressive Web App (PWA) yetenekleri
- Kritik özellikler için çevrimdışı işlevsellik
- WebSocket ile gerçek zamanlı güncellemeler
- Gelişmiş önbellekleme stratejileri

**Özellik Geliştirmeleri:**
- D3.js ile gelişmiş veri görselleştirme
- Dışa aktarma işlevselliği (PDF, Excel, CSV)
- Veri yönetimi için toplu işlemler
- Gelişmiş filtreleme ve arama yetenekleri

### 14.2. Orta Vadeli Hedefler (3-6 ay)

**Ölçeklenebilirlik:**
- Mikro-frontend mimari değerlendirmesi
- Bileşen kütüphanesi çıkarımı
- Çok kiracılı destek
- Uluslararasılaştırma (i18n) uygulaması

**Kullanıcı Deneyimi:**
- Karanlık mod tema desteği
- Özelleştirilebilir dashboard düzenleri
- Gelişmiş kullanıcı tercihleri
- Mobil uygulama geliştirme

### 14.3. Uzun Vadeli Vizyon (6+ ay)

**Kurumsal Özellikler:**
- Tek Oturum Açma (SSO) entegrasyonu
- Gelişmiş denetim günlüğü
- Uyumluluk raporlaması
- API hız sınırlama ve izleme

**İnovasyon:**
- AI destekli optimizasyon önerileri
- Makine öğrenmesi entegrasyonu
- Tahmine dayalı analitik
- Gerçek zamanlı işbirliği özellikleri

## 15. Dokümantasyon ve Bilgi Transferi

### 15.1. Kod Dokümantasyonu

**Bileşen Dokümantasyonu:**
```typescript
/**
 * Optimizasyon parametrelerini yapılandırmak için OptimizationParams bileşeni
 *
 * @param onSubmit - Optimizasyon gönderildiğinde çağrılan callback fonksiyonu
 * @param initialValues - Form için başlangıç değerleri
 * @param isLoading - Yükleme durumu göstergesi
 *
 * @example
 * <OptimizationParams
 *   onSubmit={handleOptimization}
 *   initialValues={defaultParams}
 *   isLoading={false}
 * />
 */
```

**API Dokümantasyonu:**
- Kapsamlı API endpoint dokümantasyonu
- İstek/yanıt örnekleri
- Hata işleme dokümantasyonu
- Kimlik doğrulama gereksinimleri

### 15.2. Kullanıcı Dokümantasyonu

**Kullanıcı Rehberleri:**
- Adım adım optimizasyon iş akışı
- Rol tabanlı özellik dokümantasyonu
- Sorun giderme rehberleri
- SSS bölümü

**Eğitim Materyalleri:**
- Ana özellikler için video eğitimleri
- Etkileşimli onboarding akışı
- En iyi uygulamalar dokümantasyonu
- Kullanım durumu örnekleri

Bu kapsamlı frontend uygulama dokümantasyonu, projenin gerçek React TypeScript uygulamasını detaylı olarak yansıtmaktadır ve gelecekteki geliştirmeler için sağlam bir temel sağlamaktadır.
