# Problem Tanımı: Otomatik Vardiya Çizelgeleme Sistemi

## Genel Bakış

**Amaç:** Belirli bir zaman periyodu (örn. bir hafta) için, mevcut personel ve tanımlanmış kurallar/kısıtlar çerçevesinde, operasyonel gereksinimleri karşılayan ve belirlenen hedefleri (maliyet, verimlilik, personel memnuniyeti vb.) optimize eden bir vardiya çizelgesi oluşturmak.

Bu sistem, iki spesifik kullanım senaryosu için geliştirilmiştir:
1. **Hastane Vardiya Yönetimi** - Acil, Kardiyoloji, Cerrahi, Pediatri, Yoğun Bakım, Radyoloji, Laboratuvar ve İdari departmanları
2. **112 Acil Çağrı Merkezi** - Genel Çağrı, Polis Yönlendirme, Sağlık Yönlendirme, İtfaiye Yönlendirme, Teknik Operasyonlar ve Yönetim departmanları

## Teknik Mimari

**Technology Stack:**
- **Backend:** FastAPI (Python) + CP-SAT Optimizer (Google OR-Tools)
- **Workflow Automation:** n8n (CSV processing, data transformation)
- **Database:** MySQL (authentication, audit logs)
- **Deployment:** Docker + Docker Compose
- **Frontend:** React TypeScript (optimization parameters UI)

**System Architecture:**
```
CSV Files → n8n Workflow → FastAPI Backend → CP-SAT Solver → Optimized Schedule
    ↓              ↓              ↓              ↓              ↓
 Data Input   Processing    API Request   Optimization   JSON Response
```

## 1. Girdiler (Inputs)

Sistem, CSV dosyaları ve YAML konfigürasyon dosyaları aracılığıyla veri alır. n8n workflow bu dosyaları işleyerek FastAPI backend'ine JSON formatında gönderir.

### 1.1. CSV Veri Dosyaları

#### **employees.csv / employees_cm.csv**
```csv
employee_id,name,role,department,specialty
E001,Dr. Ayşe Kaya,Doktor,Acil,Acil Tıp
E002,Hemşire Mehmet Yılmaz,Hemşire,Acil,
E003,Dr. Fatma Demir,Doktor,Kardiyoloji,Kardiyoloji
```

**Hastane Rolleri:** Doktor, Hemşire, Teknisyen
**Çağrı Merkezi Rolleri:** Vardiya Amiri, Yönlendirici, Çağrı Alıcı, Teknik Destek

#### **shifts.csv / shifts_cm.csv**
```csv
shift_id,name,date,start_time,end_time,department
S0001,Gündüz Hafta İçi Acil,2025-05-21,08:00:00,16:00:00,Acil
S0002,Gece Hafta İçi Acil,2025-05-21,00:00:00,08:00:00,Acil
```

**Hastane Departmanları:** Acil, Kardiyoloji, Cerrahi, Pediatri, Yoğun Bakım, Radyoloji, Laboratuvar, İdari
**Çağrı Merkezi Departmanları:** Genel Çağrı, Polis Yönlendirme, Sağlık Yönlendirme, İtfaiye Yönlendirme, Teknik Operasyonlar, Yönetim

#### **skills.csv / skills_cm.csv**
```csv
employee_id,skill
E001,Acil Servis Deneyimi
E001,İlk Yardım Sertifikası
E003,Kardiyoloji Uzmanlığı
```

**Hastane Yetenekleri:** Acil Servis Deneyimi, İlk Yardım Sertifikası, Kardiyoloji Uzmanlığı, Yoğun Bakım Sertifikası
**Çağrı Merkezi Yetenekleri:** Liderlik ve Motivasyon, Acil Durum Kodları Bilgisi, Hızlı Klavye Kullanımı, Yabancı Dil

#### **availability.csv / availability_cm.csv**
```csv
employee_id,date,is_available
E001,2025-05-21,1
E001,2025-05-22,0
E002,2025-05-21,1
```

**Format:** `1` = Uygun, `0` = Uygun değil

#### **preferences.csv / preferences_cm.csv**
```csv
employee_id,shift_id,preference_score
E001,S0001,1
E001,S0002,-1
E002,S0001,1
```

**Skor Sistemi:** `1` = Tercih ediyor, `-1` = Tercih etmiyor, `0` = Nötr

### 1.2. YAML Konfigürasyon Dosyaları

#### **hospital_test_config.yaml**
```yaml
institution_id: "hospital_test"
institution_name: "Test Hastanesi"
problem_type: "shift_scheduling"

optimization_core:
  solver_time_limit_seconds: 60
  objective_weights:
    minimize_overstaffing: 1
    minimize_understaffing: 10
    maximize_preferences: 2
    balance_workload: 0.5
    maximize_shift_coverage: 1
```

#### **cagri_merkezi_config.yaml**
```yaml
institution_id: "cagri_merkezi_config"
institution_name: "Test Çağrı Merkezi"
problem_type: "shift_scheduling"

optimization_core:
  solver_time_limit_seconds: 60
  objective_weights:
    minimize_overstaffing: 1
    minimize_understaffing: 10
    maximize_preferences: 2
    balance_workload: 0.5
    maximize_shift_coverage: 1
```

## 2. Çıktılar (Outputs)

FastAPI backend, optimizasyon sonuçlarını JSON formatında döndürür.

### 2.1. OptimizationResponse Formatı

```json
{
  "status": "OPTIMAL",
  "solver_status_message": "OPTIMAL solution found",
  "processing_time_seconds": 12.45,
  "objective_value": 23.5,
  "solution": {
    "assignments": [
      {
        "employee_id": "E001",
        "shift_id": "S0001",
        "assignment_date": "2025-05-21",
        "confidence_score": 0.95
      },
      {
        "employee_id": "E002",
        "shift_id": "S0003",
        "assignment_date": "2025-05-21",
        "confidence_score": 0.87
      }
    ]
  },
  "metrics": {
    "total_assignments": 15,
    "coverage_percentage": 92.3,
    "preference_satisfaction": 78.5,
    "understaffed_shifts": 2,
    "overstaffed_shifts": 1,
    "unassigned_employees": 3
  },
  "error_details": null
}
```

### 2.2. Çıktı Bileşenleri

#### **Status Değerleri:**
- `OPTIMAL` - En iyi çözüm bulundu
- `FEASIBLE` - Uygun çözüm bulundu (optimal olmayabilir)
- `INFEASIBLE` - Kısıtları sağlayan çözüm bulunamadı
- `UNKNOWN` - Zaman aşımı veya diğer nedenlerle çözüm bulunamadı

#### **Assignment Detayları:**
- `employee_id` - Çalışan kimliği
- `shift_id` - Vardiya kimliği
- `assignment_date` - Atama tarihi
- `confidence_score` - Atamanın güvenilirlik skoru (0-1)

#### **Performance Metrics:**
- `total_assignments` - Toplam atama sayısı
- `coverage_percentage` - Vardiya kapsama oranı
- `preference_satisfaction` - Tercih memnuniyet oranı
- `understaffed_shifts` - Eksik personelli vardiya sayısı
- `overstaffed_shifts` - Fazla personelli vardiya sayısı
- `unassigned_employees` - Atanmamış çalışan sayısı

## 3. Kısıtlamalar (Constraints)

### 3.1. Temel Kısıtlar (Hard Constraints)

CP-SAT modeli tarafından mutlaka sağlanması gereken kısıtlar:

#### **Atama Kısıtları:**
- Bir çalışan aynı anda sadece bir vardiyaya atanabilir
- Çalışanlar sadece uygun oldukları tarihlerde vardiyaya atanabilir
- Aynı gün içinde çakışan vardiyalara atama yapılamaz

#### **Availability Kısıtları:**
```python
# availability.csv'de is_available=0 olan tarihler için atama yapılamaz
for employee_id, date in unavailable_dates:
    for shift_id in shifts_on_date[date]:
        model.Add(assignment_vars[(employee_id, shift_id)] == 0)
```

#### **Günlük Çakışma Kısıtları:**
```python
# Aynı gün en fazla bir vardiya
for employee_id in employees:
    for date in dates:
        shifts_on_date = get_shifts_on_date(date)
        model.Add(sum(assignment_vars[(employee_id, s)] for s in shifts_on_date) <= 1)
```

### 3.2. Dinamik Kısıtlar (YAML Konfigürasyondan)

#### **Minimum Personel Gereksinimleri:**
```yaml
rules:
  min_staffing_requirements:
    - pattern: "Acil*"
      min_staff: 2
      penalty: 100  # Yumuşak kısıt ise
```

#### **Maksimum Ardışık Vardiya:**
```yaml
rules:
  max_consecutive_shifts: 3  # En fazla 3 gün üst üste
```

#### **Minimum Dinlenme Süresi:**
```yaml
rules:
  min_rest_time_hours: 8  # Vardiyalar arası minimum 8 saat dinlenme
```

#### **Yetenek Gereksinimleri:**
```yaml
rules:
  skill_requirements:
    - shift_pattern: "*Kardiyoloji*"
      required_skills: ["Kardiyoloji Uzmanlığı"]
      min_skilled_staff: 1
```

## 4. Optimizasyon Hedefleri (Objective Functions)

CP-SAT çözücüsü tarafından minimize edilen ağırlıklı hedef fonksiyonu:

### 4.1. Hedef Bileşenleri

#### **1. Fazla Personel Minimizasyonu (minimize_overstaffing)**
```python
# Ağırlık: 1 (varsayılan)
# Hedef: Vardiyalarda gerekenden fazla personel atanmasını minimize et
overstaffing = max(0, assigned_count - required_staff)
objective += weight * sum(overstaffing_per_shift)
```

#### **2. Eksik Personel Minimizasyonu (minimize_understaffing)**
```python
# Ağırlık: 10 (yüksek öncelik)
# Hedef: Vardiyalarda eksik personel durumunu minimize et
understaffing = max(0, required_staff - assigned_count)
objective += weight * sum(understaffing_per_shift)
```

#### **3. Tercih Maksimizasyonu (maximize_preferences)**
```python
# Ağırlık: 2
# Hedef: Çalışan tercihlerini maksimize et (negatif skorları minimize et)
preference_score = sum(assignment * preference_score)
objective += weight * (-preference_score)  # Minimizasyon için negatif
```

#### **4. İş Yükü Dengeleme (balance_workload)**
```python
# Ağırlık: 0.5
# Hedef: Çalışanlar arasında vardiya sayısını eşit dağıt
workload_difference = max_shifts_per_employee - min_shifts_per_employee
objective += weight * workload_difference
```

#### **5. Vardiya Kapsama Maksimizasyonu (maximize_shift_coverage)**
```python
# Ağırlık: 1
# Hedef: Boş kalan vardiya sayısını minimize et
empty_shifts = sum(is_shift_empty)
objective += weight * empty_shifts
```

### 4.2. Hedef Fonksiyon Formülü

```
Total_Objective =
  w1 * Σ(overstaffing_i) +
  w2 * Σ(understaffing_i) +
  w3 * Σ(-preference_score_ij * assignment_ij) +
  w4 * (max_workload - min_workload) +
  w5 * Σ(empty_shift_i)
```

**Varsayılan Ağırlıklar:**
- w1 (minimize_overstaffing) = 1
- w2 (minimize_understaffing) = 10
- w3 (maximize_preferences) = 2
- w4 (balance_workload) = 0.5
- w5 (maximize_shift_coverage) = 1

## 5. Algoritma ve Çözüm Yaklaşımı

### 5.1. CP-SAT (Constraint Programming - Satisfiability)

**Seçim Nedeni:**
- Karmaşık kısıtları doğal olarak ifade edebilme
- Hem hard hem soft constraint desteği
- Google OR-Tools'un güçlü optimizasyon motoru
- Integer programming problemleri için optimize edilmiş

### 5.2. Model Oluşturma Süreci

```python
class ShiftSchedulingModelBuilder:
    def build_model(self):
        # 1. Boolean değişkenler: assignment[employee][shift]
        self._create_assignment_variables()

        # 2. Temel kısıtlar (availability, overlap)
        self._add_basic_constraints()

        # 3. YAML'dan dinamik kısıtlar
        self._add_dynamic_constraints_from_config()

        # 4. Ağırlıklı hedef fonksiyonu
        self._define_objective_function()
```

### 5.3. Çözüm Parametreleri

```yaml
optimization_core:
  solver_time_limit_seconds: 60  # Maksimum çözüm süresi
  # Diğer CP-SAT parametreleri...
```

## 6. Performans Metrikleri ve Başarı Kriterleri

### 6.1. Çözüm Kalitesi Metrikleri

#### **Coverage Metrics:**
- **Shift Coverage:** Doldurulmuş vardiya oranı (%)
- **Employee Utilization:** Atanmış çalışan oranı (%)
- **Preference Satisfaction:** Karşılanan tercih oranı (%)

#### **Constraint Satisfaction:**
- **Hard Constraint Violations:** 0 olmalı (FEASIBLE çözüm için)
- **Soft Constraint Penalties:** Minimize edilmeli
- **Understaffing Count:** Eksik personelli vardiya sayısı
- **Overstaffing Count:** Fazla personelli vardiya sayısı

### 6.2. Performans Kriterleri

#### **Çözüm Süresi:**
- **Hedef:** < 60 saniye (varsayılan timeout)
- **Kabul Edilebilir:** < 120 saniye
- **Kritik:** > 300 saniye

#### **Çözüm Kalitesi:**
- **OPTIMAL:** En iyi sonuç
- **FEASIBLE:** Kabul edilebilir sonuç
- **INFEASIBLE:** Çözüm bulunamadı (kısıt gevşetme gerekli)

### 6.3. Business Success Metrics

#### **Hastane Senaryosu:**
- Acil departmanında minimum 2 doktor coverage
- Gece vardiyalarında minimum 1 hemşire
- Uzmanlık gerektiren vardiyalarda uygun personel

#### **Çağrı Merkezi Senaryosu:**
- 7/24 kesintisiz hizmet coverage
- Yoğun saatlerde yeterli operatör sayısı
- Dil becerisi gerektiren çağrılarda uygun personel

## 7. Deployment ve Operasyonel Gereksinimler

### 7.1. Sistem Mimarisi

#### **Container Architecture:**
```yaml
# docker-compose.yml
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: optimization_db

  n8n:
    image: n8nio/n8n
    ports:
      - "5678:5678"
    environment:
      - NODE_FUNCTION_ALLOW_EXTERNAL=js-yaml,yaml,fs-extra
    volumes:
      - ./configs:/mnt/workflow_configs
      - ./veri_kaynaklari:/mnt/workflow_data

  fastapi:
    build: ./optimization_core
    ports:
      - "8000:8000"
    depends_on:
      - mysql
```

#### **Volume Mappings:**
- `./configs` → `/mnt/workflow_configs` (YAML konfigürasyonları)
- `./veri_kaynaklari` → `/mnt/workflow_data` (CSV veri dosyaları)
- `./n8n_data` → `/home/node/.n8n` (n8n workflow'ları)

### 7.2. API Integration

#### **n8n Webhook Trigger:**
```bash
curl -X POST "http://localhost:5678/webhook/98a3eec5-cce7-4a93-b2e5-2275b192b265" \
  -H "Content-Type: application/json" \
  -d '{
    "veriSeti": "hastane",
    "objective_weights": {
      "minimize_understaffing": 15,
      "maximize_preferences": 3
    }
  }'
```

#### **FastAPI Optimization Endpoint:**
```
POST http://localhost:8000/optimize
Content-Type: application/json

{
  "configuration": { ... },
  "input_data": {
    "employees": [...],
    "shifts": [...],
    "availability": [...],
    "preferences": [...],
    "skills": [...]
  }
}
```

### 7.3. Data Flow Pipeline

```
1. CSV Files (Local Storage)
   ↓
2. n8n Workflow (Data Processing)
   ├── Read CSV files as binary data
   ├── Extract to JSON format
   ├── Merge with YAML configuration
   └── Transform to OptimizationRequest
   ↓
3. FastAPI Backend (Optimization)
   ├── Validate input data (Pydantic)
   ├── Build CP-SAT model
   ├── Solve optimization problem
   └── Return OptimizationResponse
   ↓
4. Results (JSON Response)
```

### 7.4. Monitoring ve Logging

#### **Application Logs:**
- **n8n:** Workflow execution logs, data processing errors
- **FastAPI:** API request/response logs, optimization metrics
- **CP-SAT:** Solver status, constraint violations, objective values

#### **Performance Monitoring:**
- Optimization solve time (target: <60s)
- Memory usage during large dataset processing
- API response times
- Success/failure rates

## 8. Kısıtlamalar ve Varsayımlar

### 8.1. Teknik Kısıtlamalar

#### **Veri Boyutu Limitleri:**
- **Çalışan Sayısı:** Maksimum ~100 çalışan (memory constraints)
- **Vardiya Sayısı:** Maksimum ~200 vardiya per week
- **Zaman Periyodu:** 1 hafta (7 gün) optimizasyon penceresi

#### **Çözüm Süresi Limitleri:**
- **Varsayılan Timeout:** 60 saniye
- **Maksimum Timeout:** 300 saniye
- **Memory Limit:** 4GB (Docker container)

#### **Dosya Format Kısıtlamaları:**
- CSV dosyaları UTF-8 encoding olmalı
- Header row zorunlu
- Date format: YYYY-MM-DD
- Time format: HH:MM:SS

### 8.2. Business Kısıtlamaları

#### **Hastane Senaryosu:**
- Acil departmanı 7/24 minimum 1 doktor gerektirir
- Gece vardiyalarında minimum 1 hemşire bulunmalı
- Uzmanlık gerektiren vardiyalarda sertifikalı personel şart

#### **Çağrı Merkezi Senaryosu:**
- 112 hattı kesintisiz hizmet vermeli
- Yoğun saatlerde (08:00-18:00) minimum 3 operatör
- Dil becerisi gerektiren çağrılarda uygun personel

### 8.3. Varsayımlar

#### **Veri Kalitesi:**
- CSV dosyalarında eksik/hatalı veri minimal
- Employee ID'ler unique ve consistent
- Shift ID'ler unique ve consistent
- Date/time formatları standardize

#### **Operasyonel Varsayımlar:**
- Çalışanlar availability bilgilerini doğru sağlar
- Preference skorları gerçek tercihleri yansıtır
- Departman bilgileri güncel ve doğru
- Skill bilgileri güncel sertifikasyonları yansıtır

#### **Optimizasyon Varsayımları:**
- Haftalık optimizasyon penceresi yeterli
- Objective weight'ler business önceliklerini doğru yansıtır
- CP-SAT solver optimal/near-optimal çözüm bulabilir
- Hard constraint'ler her zaman sağlanabilir (feasible problem)

## 9. Kullanım Senaryoları

### 9.1. Hastane Vardiya Planlaması

#### **Senaryo:** Haftalık doktor/hemşire vardiya çizelgesi
**Girdi:**
- 25 çalışan (15 hemşire, 8 doktor, 2 teknisyen)
- 56 vardiya (7 gün × 8 departman)
- Availability constraints (izinler, tatiller)
- Preference data (tercih edilen/edilmeyen vardiyalar)

**Beklenen Çıktı:**
- %95+ shift coverage
- Acil departmanında 7/24 coverage
- Preference satisfaction >70%
- Çözüm süresi <45 saniye

### 9.2. 112 Çağrı Merkezi Planlaması

#### **Senaryo:** Haftalık operatör vardiya çizelgesi
**Girdi:**
- 40 operatör (5 farklı departman)
- 84 vardiya (7 gün × 12 saat × 6 departman)
- Skill requirements (dil becerileri, uzmanlık)
- 7/24 kesintisiz hizmet gereksinimi

**Beklenen Çıktı:**
- %100 critical shift coverage
- Balanced workload distribution
- Skill-based assignment accuracy >90%
- Çözüm süresi <60 saniye

## 10. Başarı Kriterleri ve KPI'lar

### 10.1. Teknik KPI'lar

#### **Performance Metrics:**
- **Solve Time:** Ortalama <45 saniye, maksimum <120 saniye
- **Success Rate:** >95% OPTIMAL/FEASIBLE çözüm
- **Memory Usage:** <2GB peak memory consumption
- **API Uptime:** >99.5% availability

#### **Quality Metrics:**
- **Shift Coverage:** >90% filled shifts
- **Constraint Satisfaction:** 100% hard constraints, >80% soft constraints
- **Preference Satisfaction:** >70% positive preferences honored

### 10.2. Business KPI'lar

#### **Operational Efficiency:**
- **Schedule Generation Time:** Manual 4-6 saat → Automated <2 dakika
- **Planning Accuracy:** %85+ first-time-right schedules
- **Employee Satisfaction:** Preference fulfillment >70%
- **Coverage Quality:** Critical shifts %100 covered

#### **Cost Optimization:**
- **Overstaffing Reduction:** %20 azalma
- **Understaffing Incidents:** %50 azalma
- **Administrative Time:** %80 azalma (manual planning vs automated)

Bu problem tanımı, gerçek hastane ve çağrı merkezi senaryoları için geliştirilmiş, CP-SAT tabanlı optimizasyon sisteminin kapsamlı bir açıklamasını sunmaktadır.