# Optimizasyon Metrik Sistemi

Bu belge, Kurumsal Optimizasyon ve Otomasyon Çözümü'nün kapsamlı metrik sistemini açıklar. Sistem, operasyonel performans, çalışan memnuniyeti, teknik performans ve sistem sağlığını ölçen 12 ana metrik ile dashboard entegrasyonu sağlar.

## İçindekiler

1. [Metrik Sistemi Genel Bakış](#metrik-sistemi-genel-bakış)
2. [Backend Metrik Modelleri](#backend-metrik-modelleri)
3. [Frontend Dashboard Metrikleri](#frontend-dashboard-metrikleri)
4. [Metrik Hesaplama Algoritmaları](#metrik-hesaplama-algoritmaları)
5. [Real-time Metrik Güncellemeleri](#real-time-metrik-güncellemeleri)
6. [Multi-tenant Metrik İzolasyonu](#multi-tenant-metrik-izolasyonu)
7. [Metrik Görselleştirme ve Export](#metrik-görselleştirme-ve-export)
8. [Performance Monitoring](#performance-monitoring)
9. [Kullanım Kılavuzu](#kullanım-kılavuzu)

## Metrik Sistemi Genel Bakış

Sistem, hibrit bir metrik yaklaşımı kullanarak hem operasyonel hem de teknik performansı ölçer:

```
┌─────────────────────────────────────────────────────────┐
│                FRONTEND DASHBOARD                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │ Personel    │ │ Yetkinlik   │ │ Çalışan         │   │
│  │ Verimliliği │ │ Uyumu       │ │ Memnuniyeti     │   │
│  │ (Coverage)  │ │ (Skills)    │ │ (Preferences)   │   │
│  └─────────────┘ └─────────────┘ └─────────────────┘   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │ İş Yükü     │ │ Eksik       │ │ Fazla           │   │
│  │ Dengesi     │ │ Personel    │ │ Personel        │   │
│  │ (Balance)   │ │ (Under)     │ │ (Over)          │   │
│  └─────────────┘ └─────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼ API Integration
┌─────────────────────────────────────────────────────────┐
│              BACKEND METRICS ENGINE                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │ Optimization│ │ Dashboard   │ │ System Health   │   │
│  │ Metrics     │ │ API         │ │ Monitoring      │   │
│  │ (12 fields) │ │ (6 fields)  │ │ (Real-time)     │   │
│  └─────────────┘ └─────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼ Data Processing
┌─────────────────────────────────────────────────────────┐
│            OPTIMIZATION CORE RESULTS                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │ CP-SAT      │ │ Assignment  │ │ Configuration   │   │
│  │ Solver      │ │ Solution    │ │ Analysis        │   │
│  │ Metrics     │ │ Metrics     │ │ Metrics         │   │
│  └─────────────┘ └─────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Metrik Kategorileri

**Operasyonel Metrikler (6):**
- `total_understaffing` - Eksik personel sayısı
- `total_overstaffing` - Fazla personel sayısı
- `min_staffing_coverage_ratio` - Minimum personel karşılama oranı
- `skill_coverage_ratio` - Yetenek karşılama oranı
- `positive_preferences_met_count` - Karşılanan pozitif tercih sayısı
- `negative_preferences_assigned_count` - Atanan negatif tercih sayısı

**Performans Metrikleri (4):**
- `total_preference_score_achieved` - Toplam tercih skoru
- `workload_distribution_std_dev` - İş yükü dağılım standart sapması
- `bad_shift_distribution_std_dev` - Kötü vardiya dağılım standart sapması
- `total_positive_preferences_count` - Toplam pozitif tercih sayısı

**Sistem Metrikleri (2):**
- `system_adaptability_score` - Sistem uyarlanabilirlik skoru (0-10)
- `config_complexity_score` - Konfigürasyon karmaşıklık skoru (0-10)

## Backend Metrik Modelleri

### MetricsOutput Pydantic Modeli

Optimizasyon çekirdeğinden dönen ana metrik modeli:

```python
class MetricsOutput(BaseModel):
    # Operasyonel Metrikler
    total_understaffing: Optional[int] = None
    total_overstaffing: Optional[int] = None
    min_staffing_coverage_ratio: Optional[float] = None  # 0.0-1.0 arası
    skill_coverage_ratio: Optional[float] = None  # 0.0-1.0 arası

    # Çalışan Memnuniyeti Metrikleri
    positive_preferences_met_count: Optional[int] = None
    negative_preferences_assigned_count: Optional[int] = None
    total_preference_score_achieved: Optional[int] = None
    total_positive_preferences_count: Optional[int] = None
    total_negative_preferences_count: Optional[int] = None

    # İş Yükü ve Dağılım Metrikleri
    workload_distribution_std_dev: Optional[float] = None
    bad_shift_distribution_std_dev: Optional[float] = None

    # Sistem Analiz Metrikleri
    system_adaptability_score: Optional[float] = None  # 0.0-10.0 arası
    config_complexity_score: Optional[float] = None  # 0.0-10.0 arası
    rule_count: Optional[int] = None
```

### Dashboard PerformanceMetrics Modeli

Frontend dashboard için optimize edilmiş metrik modeli:

```python
class PerformanceMetrics(BaseModel):
    understaffing: int = 0  # Ham sayı
    overstaffing: int = 0   # Ham sayı
    coverageRatio: int = 0  # Yüzde (0-100)
    skillCoverage: int = 0  # Yüzde (0-100)
    preferenceScore: int = 0  # Yüzde (0-100)
    workloadBalance: int = 0  # Yüzde (0-100)

    # Trend göstergeleri (opsiyonel)
    coverageRatioChange: Optional[str] = None  # "+5%" veya "-2%"
    skillCoverageChange: Optional[str] = None
    preferenceScoreChange: Optional[str] = None
    workloadBalanceChange: Optional[str] = None
```

### Metrik Dönüşüm Algoritması

Backend'de MetricsOutput'tan PerformanceMetrics'e dönüşüm:

```python
def convert_to_dashboard_metrics(optimization_result: Dict[str, Any]) -> PerformanceMetrics:
    """Optimizasyon sonucunu dashboard metriklerine dönüştürür"""

    metrics = PerformanceMetrics()
    if optimization_result and optimization_result.get("metrics"):
        result_metrics = optimization_result["metrics"]

        # Ham sayılar (doğrudan kopyala)
        metrics.understaffing = result_metrics.get("total_understaffing", 0)
        metrics.overstaffing = result_metrics.get("total_overstaffing", 0)

        # Yüzdelik dönüşümler (0.0-1.0 → 0-100)
        if result_metrics.get("min_staffing_coverage_ratio") is not None:
            metrics.coverageRatio = int(result_metrics["min_staffing_coverage_ratio"] * 100)

        if result_metrics.get("skill_coverage_ratio") is not None:
            metrics.skillCoverage = int(result_metrics["skill_coverage_ratio"] * 100)

        # Çalışan memnuniyeti hesaplaması
        positive_preferences_met = result_metrics.get("positive_preferences_met_count", 0)
        total_positive_preferences = result_metrics.get("total_positive_preferences_count", 0)

        if total_positive_preferences > 0:
            preference_percentage = (positive_preferences_met / total_positive_preferences) * 100
            metrics.preferenceScore = min(100, max(0, int(preference_percentage)))
        else:
            metrics.preferenceScore = 0

        # İş yükü dengesi hesaplaması
        if result_metrics.get("workload_distribution_std_dev") is not None:
            std_dev = result_metrics["workload_distribution_std_dev"]
            metrics.workloadBalance = calculate_workload_balance_score(std_dev)

    return metrics
```

### İş Yükü Dengesi Hesaplama Algoritması

```python
def calculate_workload_balance_score(std_dev: float) -> int:
    """
    Standart sapmayı iş yükü dengesi puanına dönüştürür.

    Args:
        std_dev (float): İş yükü dağılımının standart sapması

    Returns:
        int: 0-100 arasında iş yükü dengesi puanı
    """
    # Parametreler
    max_expected_std_dev = 2.0  # Beklenen maksimum standart sapma
    min_score = 50  # Minimum puan
    max_score = 100  # Maksimum puan

    # Doğrusal dönüşüm formülü
    if std_dev <= 0:
        return max_score  # Mükemmel denge durumu
    elif std_dev >= max_expected_std_dev:
        return min_score  # En kötü denge durumu
    else:
        # Doğrusal interpolasyon
        score = max_score - ((std_dev / max_expected_std_dev) * (max_score - min_score))
        return int(round(score))  # Tam sayıya yuvarla
```

## Frontend Dashboard Metrikleri

### TypeScript Interface Tanımları

```typescript
// ui/src/types/index.ts

// Optimizasyon metrik tipi (backend'den gelen)
export interface MetricsOutput {
  total_understaffing?: number;
  total_overstaffing?: number;
  min_staffing_coverage_ratio?: number;
  skill_coverage_ratio?: number;
  positive_preferences_met_count?: number;
  negative_preferences_assigned_count?: number;
  total_preference_score_achieved?: number;
  total_positive_preferences_count?: number;
  total_negative_preferences_count?: number;
  workload_distribution_std_dev?: number;
  bad_shift_distribution_std_dev?: number;
  system_adaptability_score?: number;
  config_complexity_score?: number;
  rule_count?: number;
}

// Dashboard metrik tipi (frontend'de kullanılan)
export interface DashboardMetrics {
  understaffing: number;
  overstaffing: number;
  coverageRatio: number;
  skillCoverage: number;
  preferenceScore: number;
  workloadBalance: number;
}
```

### Dashboard Metrik Kartları

Frontend'de 6 ana metrik kartı Material UI ile görselleştirilir:

#### 1. Personel Verimliliği Kartı (Coverage Ratio)

```typescript
// Dashboard.tsx - Personel Verimliliği Kartı
<Card sx={{ borderRadius: 3, height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
  <CardContent sx={{ p: 3 }}>
    <Box sx={{ textAlign: 'center', mb: 2 }}>
      <Avatar sx={{
        bgcolor: alpha(theme.palette.success.main, 0.1),
        color: theme.palette.success.main,
        width: 56, height: 56, mx: 'auto', mb: 2
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
        height: 8, borderRadius: 4,
        bgcolor: alpha(theme.palette.success.main, 0.1),
        '& .MuiLinearProgress-bar': { bgcolor: theme.palette.success.main }
      }}
    />
  </CardContent>
</Card>
```

#### 2. Çalışan Memnuniyeti Kartı (Preference Score)

```typescript
// Dashboard.tsx - Çalışan Memnuniyeti Kartı
<Typography variant="h3" fontWeight="bold" color={theme.palette.warning.main}>
  {metrics.preferenceScore}%
</Typography>
<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
  Çalışan tercihlerinin karşılanma oranı
</Typography>
<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontStyle: 'italic' }}>
  (Karşılanan pozitif tercihler / Toplam pozitif tercihler)
</Typography>
```

**Hesaplama Formülü:**
```typescript
// Frontend'de çalışan memnuniyeti hesaplaması
const calculatePreferenceScore = (metrics: MetricsOutput): number => {
  if (!metrics.total_positive_preferences_count || metrics.total_positive_preferences_count === 0) {
    return 0;
  }

  const positivePrefs = metrics.positive_preferences_met_count || 0;
  const totalPositive = metrics.total_positive_preferences_count;

  return Math.min(100, Math.max(0, Math.round((positivePrefs / totalPositive) * 100)));
};
```

### Frontend Metrik State Yönetimi

```typescript
// Dashboard.tsx - State tanımlamaları
const [metrics, setMetrics] = useState({
  understaffing: 0,
  overstaffing: 0,
  coverageRatio: 0,
  skillCoverage: 0,
  preferenceScore: 0,
  workloadBalance: 0
});

// API'den veri çekme ve state güncelleme
const loadDashboardData = async () => {
  try {
    setLoading(true);
    const dashboardData = await api.getDashboardData();

    if (dashboardData?.performanceMetrics) {
      setMetrics({
        understaffing: dashboardData.performanceMetrics.understaffing || 0,
        overstaffing: dashboardData.performanceMetrics.overstaffing || 0,
        coverageRatio: dashboardData.performanceMetrics.coverageRatio || 0,
        skillCoverage: dashboardData.performanceMetrics.skillCoverage || 0,
        preferenceScore: dashboardData.performanceMetrics.preferenceScore || 0,
        workloadBalance: dashboardData.performanceMetrics.workloadBalance || 0
      });
    }
  } catch (error) {
    console.error('Dashboard verilerini çekerken hata:', error);
    // Hata durumunda varsayılan değerler
    setMetrics({
      understaffing: 0, overstaffing: 0, coverageRatio: 0,
      skillCoverage: 0, preferenceScore: 0, workloadBalance: 0
    });
  } finally {
    setLoading(false);
  }
};
```

## Metrik Hesaplama Algoritmaları

### 1. Minimum Personel Karşılama Oranı

```python
def calculate_min_staffing_coverage_ratio(assignments, shifts, min_staffing_rules):
    """Minimum personel gereksinimlerinin karşılanma oranını hesaplar"""

    total_shifts_with_requirements = 0
    satisfied_shifts = 0

    for shift in shifts:
        # Bu vardiya için minimum personel kuralı var mı?
        applicable_rules = [rule for rule in min_staffing_rules
                          if matches_shift_pattern(shift, rule)]

        if applicable_rules:
            total_shifts_with_requirements += 1

            # Bu vardiyaya atanan personel sayısı
            assigned_count = len([a for a in assignments
                                if a['shift_id'] == shift['shift_id']])

            # Minimum gereksinim
            min_required = max(rule['min_count'] for rule in applicable_rules)

            if assigned_count >= min_required:
                satisfied_shifts += 1

    return satisfied_shifts / total_shifts_with_requirements if total_shifts_with_requirements > 0 else 1.0
```

### 2. Yetenek Karşılama Oranı

```python
def calculate_skill_coverage_ratio(assignments, shifts, skills, skill_requirements):
    """Yetenek gereksinimlerinin karşılanma oranını hesaplar"""

    total_skill_requirements = 0
    satisfied_skill_requirements = 0

    for shift in shifts:
        applicable_skill_rules = [rule for rule in skill_requirements
                                if matches_shift_pattern(shift, rule)]

        for rule in applicable_skill_rules:
            total_skill_requirements += 1

            # Bu vardiyaya atanan ve gerekli yeteneğe sahip personel sayısı
            assigned_with_skill = 0
            for assignment in assignments:
                if assignment['shift_id'] == shift['shift_id']:
                    employee_skills = [s['skill'] for s in skills
                                     if s['employee_id'] == assignment['employee_id']]
                    if rule['skill'] in employee_skills:
                        assigned_with_skill += 1

            if assigned_with_skill >= rule['min_count']:
                satisfied_skill_requirements += 1

    return satisfied_skill_requirements / total_skill_requirements if total_skill_requirements > 0 else 1.0
```

### 3. İş Yükü Dağılım Standart Sapması

```python
def calculate_workload_distribution_std_dev(assignments, employees):
    """Çalışanlar arası iş yükü dağılımının standart sapmasını hesaplar"""

    # Her çalışanın toplam vardiya sayısını hesapla
    workload_counts = {}
    for employee in employees:
        employee_id = employee['employee_id']
        workload_counts[employee_id] = len([a for a in assignments
                                          if a['employee_id'] == employee_id])

    # Standart sapma hesaplama
    workloads = list(workload_counts.values())
    if len(workloads) <= 1:
        return 0.0

    mean_workload = sum(workloads) / len(workloads)
    variance = sum((w - mean_workload) ** 2 for w in workloads) / len(workloads)

    return math.sqrt(variance)
```

## Real-time Metrik Güncellemeleri

### Dashboard API Entegrasyonu

```python
# optimization_core/dashboard_api.py
@router.get("/dashboard")
async def get_dashboard_data():
    """Dashboard için real-time metrik verilerini döndürür"""

    try:
        # Son optimizasyon sonucunu oku
        optimization_result = load_latest_optimization_result()

        # Performans metriklerini hazırla
        metrics = PerformanceMetrics()
        if optimization_result and optimization_result.get("metrics"):
            metrics = convert_to_dashboard_metrics(optimization_result)

        # Son optimizasyon raporu
        last_report = LastOptimizationReport()
        if optimization_result:
            last_report = create_optimization_report(optimization_result)

        # Sistem durumu
        system_status = SystemStatus(
            apiStatus="Çevrimiçi",
            apiStatusColor="success.main",
            databaseStatus="Bağlı",
            databaseStatusColor="success.main",
            n8nStatus="Aktif",
            n8nStatusColor="success.main",
            lastHealthCheck=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )

        # Son aktiviteler
        recent_activities = get_recent_activities()

        return DashboardData(
            performanceMetrics=metrics,
            lastOptimizationReport=last_report,
            systemStatus=system_status,
            recentActivities=recent_activities
        )

    except Exception as e:
        logger.error(f"Dashboard verilerini hazırlarken hata: {e}")
        return create_default_dashboard_data()
```

### Frontend Auto-refresh Mekanizması

```typescript
// Dashboard.tsx - Otomatik yenileme
useEffect(() => {
  // İlk yükleme
  loadDashboardData();

  // 30 saniyede bir otomatik yenileme
  const interval = setInterval(() => {
    loadDashboardData();
  }, 30000);

  // Cleanup
  return () => clearInterval(interval);
}, []);

// Manuel yenileme butonu
const handleRefresh = async () => {
  setLoading(true);
  await loadDashboardData();
  setLoading(false);
};
```

## Multi-tenant Metrik İzolasyonu

### Organization-Based Metrik Filtreleme

Sistem, multi-tenant mimari ile kurumlar arası metrik izolasyonu sağlar:

```python
# optimization_core/dashboard_api.py
def get_organization_metrics(user_org_id: int, optimization_result: Dict[str, Any]) -> PerformanceMetrics:
    """Kuruma özel metrik verilerini filtreler ve döndürür"""

    # Kullanıcının kurumuna ait optimizasyon sonucu mu kontrol et
    if not is_organization_authorized(user_org_id, optimization_result):
        logger.warning(f"Unauthorized metric access attempt for org {user_org_id}")
        return PerformanceMetrics()  # Boş metrikler döndür

    # Kuruma özel metrik hesaplaması
    metrics = PerformanceMetrics()
    if optimization_result and optimization_result.get("metrics"):
        result_metrics = optimization_result["metrics"]

        # Organization-specific metric calculations
        metrics = convert_to_dashboard_metrics(optimization_result)

        # Audit log - metrik erişimi
        log_metric_access(
            user_org_id=user_org_id,
            metric_type="dashboard_performance",
            access_time=datetime.now(timezone.utc)
        )

    return metrics

def is_organization_authorized(user_org_id: int, optimization_result: Dict[str, Any]) -> bool:
    """Kullanıcının kurumunun bu optimizasyon sonucuna erişim yetkisi var mı kontrol eder"""

    # Optimizasyon sonucunda organization bilgisi varsa kontrol et
    if "organization_id" in optimization_result:
        return optimization_result["organization_id"] == user_org_id

    # Varsayılan olarak erişime izin ver (backward compatibility)
    return True
```

### User Role-Based Metrik Erişimi

```python
def get_filtered_metrics_by_role(user_role: str, metrics: MetricsOutput) -> Dict[str, Any]:
    """Kullanıcı rolüne göre metrik erişimini filtreler"""

    # Rol bazlı metrik erişim matrisi
    ROLE_METRIC_ACCESS = {
        'staff': [
            'total_understaffing', 'total_overstaffing',
            'min_staffing_coverage_ratio', 'positive_preferences_met_count'
        ],
        'planner': [
            'total_understaffing', 'total_overstaffing', 'min_staffing_coverage_ratio',
            'skill_coverage_ratio', 'positive_preferences_met_count',
            'negative_preferences_assigned_count', 'workload_distribution_std_dev'
        ],
        'manager': [
            'total_understaffing', 'total_overstaffing', 'min_staffing_coverage_ratio',
            'skill_coverage_ratio', 'positive_preferences_met_count',
            'negative_preferences_assigned_count', 'total_preference_score_achieved',
            'workload_distribution_std_dev', 'bad_shift_distribution_std_dev'
        ],
        'org_admin': '*',  # Tüm metriklere erişim
        'super_admin': '*'  # Tüm metriklere erişim
    }

    allowed_metrics = ROLE_METRIC_ACCESS.get(user_role, [])

    if allowed_metrics == '*':
        return metrics.dict()

    # Sadece izin verilen metrikleri döndür
    filtered_metrics = {}
    for metric_name in allowed_metrics:
        if hasattr(metrics, metric_name):
            filtered_metrics[metric_name] = getattr(metrics, metric_name)

    return filtered_metrics
```

### Audit Logging ile Metrik Takibi

```python
def log_metric_access(user_org_id: int, metric_type: str, access_time: datetime):
    """Metrik erişimlerini audit log'a kaydeder"""

    audit_entry = {
        "action": "metric_access",
        "organization_id": user_org_id,
        "metric_type": metric_type,
        "access_time": access_time.isoformat(),
        "details": {
            "endpoint": "/api/dashboard",
            "metric_categories": ["performance", "operational", "system"]
        }
    }

    # Audit log'a kaydet
    create_audit_log(audit_entry)
```

## Metrik Görselleştirme ve Export

### CSV Export Functionality

```typescript
// ui/src/services/exportService.ts
export const exportMetricsToCSV = (data: OptimizationResponse): void => {
  if (!data.metrics) {
    throw new Error('Metrik verisi bulunamadı');
  }

  const metrics = data.metrics;

  // Metrik verileri hazırla
  const metricsData = [
    ['Metrik Adı', 'Değer', 'Açıklama'],
    ['Eksik Personel', (metrics.total_understaffing || 0).toString(), 'Minimum gereksinimin altında kalan vardiya sayısı'],
    ['Fazla Personel', (metrics.total_overstaffing || 0).toString(), 'Minimum gereksinimin üzerinde atanan personel sayısı'],
    ['Minimum Personel Karşılama Oranı', `${((metrics.min_staffing_coverage_ratio || 0) * 100).toFixed(1)}%`, 'Minimum personel gereksinimlerinin karşılanma oranı'],
    ['Yetenek Karşılama Oranı', `${((metrics.skill_coverage_ratio || 0) * 100).toFixed(1)}%`, 'Yetenek gereksinimlerinin karşılanma oranı'],
    ['Karşılanan Pozitif Tercih Sayısı', (metrics.positive_preferences_met_count || 0).toString(), 'Çalışanların olumlu tercihlerinin karşılanma sayısı'],
    ['Atanan Negatif Tercih Sayısı', (metrics.negative_preferences_assigned_count || 0).toString(), 'Çalışanların olumsuz tercihlerine yapılan atama sayısı'],
    ['Toplam Tercih Skoru', (metrics.total_preference_score_achieved || 0).toString(), 'Tüm atamaların toplam tercih skoru'],
    ['İş Yükü Dağılım Std. Sapması', (metrics.workload_distribution_std_dev || 0).toFixed(3), 'Çalışanlar arası iş yükü dağılımının standart sapması'],
    ['Kötü Vardiya Dağılım Std. Sapması', (metrics.bad_shift_distribution_std_dev || 0).toFixed(3), 'Kötü vardiyaların dağılım standart sapması'],
    ['Sistem Uyarlanabilirlik Skoru', (metrics.system_adaptability_score || 0).toFixed(1), 'Sistemin farklı kurumlara uyarlanabilirlik skoru (0-10)'],
    ['Konfigürasyon Karmaşıklık Skoru', (metrics.config_complexity_score || 0).toFixed(1), 'Konfigürasyonun karmaşıklık skoru (0-10)'],
    ['Kural Sayısı', (metrics.rule_count || 0).toString(), 'Sistemde tanımlı toplam kural sayısı']
  ];

  // CSV formatına dönüştür
  const csvContent = metricsData.map(row =>
    row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')
  ).join('\n');

  // UTF-8 BOM ekle (Türkçe karakterler için)
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });

  // Dosyayı indir
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `optimizasyon_metrikleri_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
```

### Excel Export with Formatting

```typescript
// Excel export with advanced formatting
export const exportMetricsToExcel = (data: OptimizationResponse): void => {
  const workbook = XLSX.utils.book_new();

  // Metrik özeti sayfası
  const metricsSheet = [
    ['Optimizasyon Metrikleri Raporu', '', ''],
    ['Rapor Tarihi:', new Date().toLocaleDateString('tr-TR'), ''],
    ['', '', ''],
    ['Metrik Kategorisi', 'Metrik Adı', 'Değer', 'Açıklama'],

    // Operasyonel Metrikler
    ['Operasyonel', 'Eksik Personel', data.metrics?.total_understaffing || 0, 'Minimum gereksinimin altında kalan vardiya sayısı'],
    ['Operasyonel', 'Fazla Personel', data.metrics?.total_overstaffing || 0, 'Minimum gereksinimin üzerinde atanan personel sayısı'],
    ['Operasyonel', 'Personel Karşılama Oranı', `${((data.metrics?.min_staffing_coverage_ratio || 0) * 100).toFixed(1)}%`, 'Minimum personel gereksinimlerinin karşılanma oranı'],
    ['Operasyonel', 'Yetenek Karşılama Oranı', `${((data.metrics?.skill_coverage_ratio || 0) * 100).toFixed(1)}%`, 'Yetenek gereksinimlerinin karşılanma oranı'],

    // Çalışan Memnuniyeti Metrikleri
    ['Çalışan Memnuniyeti', 'Karşılanan Pozitif Tercih', data.metrics?.positive_preferences_met_count || 0, 'Çalışanların olumlu tercihlerinin karşılanma sayısı'],
    ['Çalışan Memnuniyeti', 'Atanan Negatif Tercih', data.metrics?.negative_preferences_assigned_count || 0, 'Çalışanların olumsuz tercihlerine yapılan atama sayısı'],
    ['Çalışan Memnuniyeti', 'Toplam Tercih Skoru', data.metrics?.total_preference_score_achieved || 0, 'Tüm atamaların toplam tercih skoru'],

    // Sistem Metrikleri
    ['Sistem', 'Uyarlanabilirlik Skoru', (data.metrics?.system_adaptability_score || 0).toFixed(1), 'Sistemin farklı kurumlara uyarlanabilirlik skoru (0-10)'],
    ['Sistem', 'Karmaşıklık Skoru', (data.metrics?.config_complexity_score || 0).toFixed(1), 'Konfigürasyonun karmaşıklık skoru (0-10)'],
    ['Sistem', 'Kural Sayısı', data.metrics?.rule_count || 0, 'Sistemde tanımlı toplam kural sayısı']
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(metricsSheet);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Metrikler');

  // Dosyayı indir
  XLSX.writeFile(workbook, `optimizasyon_metrikleri_${new Date().toISOString().split('T')[0]}.xlsx`);
};
```

### Metrik Görselleştirme Guidelines

**Dashboard Metrik Kartları:**
- **Renk Kodlaması**: Yeşil (başarılı), Turuncu (uyarı), Kırmızı (kritik)
- **Progress Bar'lar**: 0-100% değerler için LinearProgress component
- **Icon'lar**: Material UI icon'ları (PeopleIcon, CheckCircleIcon, FavoriteIcon)
- **Typography**: h3 (ana değer), body2 (açıklama), caption (formül)

**Trend Göstergeleri:**
```typescript
// Trend hesaplama örneği
const calculateTrend = (current: number, previous: number): string => {
  if (previous === 0) return '';

  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? '+' : '';

  return `${sign}${change.toFixed(1)}%`;
};
```

**Responsive Design:**
- Mobile: Tek sütun metrik kartları
- Tablet: 2x3 grid layout
- Desktop: 3x2 grid layout

## Performance Monitoring

### System Health Metrics

Sistem, real-time performance monitoring ile sağlık durumunu izler:

```python
# optimization_core/dashboard_api.py
class SystemStatus(BaseModel):
    apiStatus: str = "Çevrimiçi"
    apiStatusColor: str = "success.main"
    databaseStatus: str = "Bağlı"
    databaseStatusColor: str = "success.main"
    n8nStatus: str = "Aktif"
    n8nStatusColor: str = "success.main"
    lastHealthCheck: str = ""

def get_system_health() -> SystemStatus:
    """Sistem sağlık durumunu kontrol eder"""

    status = SystemStatus()

    try:
        # Database bağlantı kontrolü
        db_status = check_database_connection()
        status.databaseStatus = "Bağlı" if db_status else "Bağlantı Sorunu"
        status.databaseStatusColor = "success.main" if db_status else "error.main"

        # n8n servis kontrolü
        n8n_status = check_n8n_service()
        status.n8nStatus = "Aktif" if n8n_status else "Pasif"
        status.n8nStatusColor = "success.main" if n8n_status else "warning.main"

        # API durumu (her zaman aktif çünkü bu endpoint çalışıyor)
        status.apiStatus = "Çevrimiçi"
        status.apiStatusColor = "success.main"

        # Son kontrol zamanı
        status.lastHealthCheck = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    except Exception as e:
        logger.error(f"System health check error: {e}")
        status.apiStatus = "Hata"
        status.apiStatusColor = "error.main"

    return status

def check_database_connection() -> bool:
    """Database bağlantısını kontrol eder"""
    try:
        # Basit bir query ile bağlantıyı test et
        db.execute("SELECT 1")
        return True
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        return False

def check_n8n_service() -> bool:
    """n8n servisinin durumunu kontrol eder"""
    try:
        # n8n health endpoint'ini kontrol et
        response = requests.get("http://localhost:5678/healthz", timeout=5)
        return response.status_code == 200
    except Exception as e:
        logger.error(f"n8n service check error: {e}")
        return False
```

### Performance Metrics Tracking

```python
class PerformanceTracker:
    """Sistem performans metriklerini takip eder"""

    def __init__(self):
        self.metrics_history = []
        self.max_history_size = 100

    def track_optimization_performance(self,
                                     processing_time: float,
                                     solution_status: str,
                                     metrics: MetricsOutput):
        """Optimizasyon performansını kaydet"""

        performance_entry = {
            "timestamp": datetime.now(timezone.utc),
            "processing_time_seconds": processing_time,
            "solution_status": solution_status,
            "understaffing": metrics.total_understaffing,
            "overstaffing": metrics.total_overstaffing,
            "coverage_ratio": metrics.min_staffing_coverage_ratio,
            "skill_coverage": metrics.skill_coverage_ratio,
            "preference_score": self.calculate_preference_percentage(metrics),
            "workload_balance": self.calculate_workload_balance(metrics.workload_distribution_std_dev)
        }

        self.metrics_history.append(performance_entry)

        # History boyutunu sınırla
        if len(self.metrics_history) > self.max_history_size:
            self.metrics_history.pop(0)

    def get_performance_trends(self) -> Dict[str, Any]:
        """Performance trend'lerini hesapla"""

        if len(self.metrics_history) < 2:
            return {}

        current = self.metrics_history[-1]
        previous = self.metrics_history[-2]

        trends = {}
        for metric in ['coverage_ratio', 'skill_coverage', 'preference_score', 'workload_balance']:
            if current[metric] is not None and previous[metric] is not None:
                change = current[metric] - previous[metric]
                change_percent = (change / previous[metric]) * 100 if previous[metric] != 0 else 0
                trends[f"{metric}_change"] = f"{'+' if change_percent >= 0 else ''}{change_percent:.1f}%"

        return trends
```

### Metrik Caching Sistemi

```python
from functools import lru_cache
from datetime import datetime, timedelta

class MetricCache:
    """Metrik verilerini cache'ler ve performance optimize eder"""

    def __init__(self):
        self.cache = {}
        self.cache_ttl = timedelta(minutes=5)  # 5 dakika cache süresi

    def get_cached_metrics(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Cache'den metrik verilerini al"""

        if cache_key in self.cache:
            cached_data, timestamp = self.cache[cache_key]

            # Cache süresi dolmuş mu kontrol et
            if datetime.now() - timestamp < self.cache_ttl:
                return cached_data
            else:
                # Süresi dolmuş cache'i temizle
                del self.cache[cache_key]

        return None

    def set_cached_metrics(self, cache_key: str, metrics_data: Dict[str, Any]):
        """Metrik verilerini cache'e kaydet"""

        self.cache[cache_key] = (metrics_data, datetime.now())

        # Cache boyutunu sınırla (max 50 entry)
        if len(self.cache) > 50:
            # En eski entry'yi sil
            oldest_key = min(self.cache.keys(), key=lambda k: self.cache[k][1])
            del self.cache[oldest_key]

# Global cache instance
metric_cache = MetricCache()

@lru_cache(maxsize=32)
def get_dashboard_metrics_cached(user_org_id: int, last_update_time: str) -> PerformanceMetrics:
    """Cache'lenmiş dashboard metrikleri"""

    cache_key = f"dashboard_metrics_{user_org_id}_{last_update_time}"

    # Cache'den kontrol et
    cached_metrics = metric_cache.get_cached_metrics(cache_key)
    if cached_metrics:
        return PerformanceMetrics(**cached_metrics)

    # Cache'de yoksa hesapla
    optimization_result = load_latest_optimization_result()
    metrics = convert_to_dashboard_metrics(optimization_result)

    # Cache'e kaydet
    metric_cache.set_cached_metrics(cache_key, metrics.dict())

    return metrics
```

## Kullanım Kılavuzu

### Dashboard Metriklerini Görüntüleme

1. **Dashboard Sayfasına Erişim:**
   ```
   http://localhost:3000/dashboard
   ```

2. **Metrik Kartları:**
   - **Personel Verimliliği**: Minimum personel gereksinimlerinin karşılanma oranı (%)
   - **Yetkinlik Uyumu**: Yetenek gereksinimlerinin karşılanma oranı (%)
   - **Çalışan Memnuniyeti**: Pozitif tercihlerin karşılanma oranı (%)
   - **İş Yükü Dengesi**: İş yükü dağılımının dengeli olma oranı (%)
   - **Eksik Personel**: Minimum gereksinimin altında kalan vardiya sayısı
   - **Fazla Personel**: Minimum gereksinimin üzerinde atanan personel sayısı

3. **Otomatik Yenileme:**
   - Dashboard 30 saniyede bir otomatik olarak yenilenir
   - Manuel yenileme için "Yenile" butonunu kullanın

### API Üzerinden Metrik Erişimi

```bash
# Dashboard metriklerini al
curl -X GET "http://localhost:8000/api/dashboard" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json"

# Detaylı optimizasyon sonuçlarını al
curl -X GET "http://localhost:8000/api/results" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json"
```

### Metrik Export İşlemleri

1. **CSV Export:**
   ```typescript
   // Results sayfasından CSV export
   import { exportMetricsToCSV } from '../services/exportService';

   const handleExportCSV = () => {
     exportMetricsToCSV(optimizationData);
   };
   ```

2. **Excel Export:**
   ```typescript
   // Results sayfasından Excel export
   import { exportMetricsToExcel } from '../services/exportService';

   const handleExportExcel = () => {
     exportMetricsToExcel(optimizationData);
   };
   ```

### Metrik Yorumlama Rehberi

**Personel Verimliliği (Coverage Ratio):**
- **100%**: Tüm vardiyalar minimum personel gereksinimini karşılıyor
- **90-99%**: Çok iyi, birkaç vardiyada eksiklik olabilir
- **80-89%**: İyi, bazı vardiyalarda personel eksikliği var
- **<80%**: Kritik, çok sayıda vardiyada personel eksikliği

**Çalışan Memnuniyeti (Preference Score):**
- **80-100%**: Mükemmel, çalışanların çoğu tercihine uygun atama
- **60-79%**: İyi, çalışanların büyük kısmı memnun
- **40-59%**: Orta, iyileştirme gerekli
- **<40%**: Düşük, çalışan memnuniyetsizliği riski

**İş Yükü Dengesi (Workload Balance):**
- **90-100%**: Mükemmel denge, tüm çalışanlar eşit iş yükü
- **70-89%**: İyi denge, küçük farklılıklar var
- **50-69%**: Orta denge, bazı çalışanlar daha fazla çalışıyor
- **<50%**: Dengesiz, büyük iş yükü farklılıkları var

