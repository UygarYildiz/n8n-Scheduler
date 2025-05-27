# Synthetic Data Generation Sistemi

Bu belge, `data_generators/` klasöründeki synthetic data generation scriptlerinin yapısını, algoritmalarını ve ürettikleri CSV dosyalarının detaylarını açıklar. Bu veriler, optimizasyon modelini test etmek, n8n iş akışlarını geliştirmek ve sistem performansını değerlendirmek için kullanılır.

## Genel Bakış

**Data Generation Scripts:**
- `generate_hospital_data.py` - Hastane senaryosu için synthetic data
- `generate_cagri_merkezi_data.py` - 112 Çağrı Merkezi senaryosu için synthetic data

**Output Directories:**
- `synthetic_data/` - Hastane veri seti
- `synthetic_data_cagri_merkezi/` - Çağrı merkezi veri seti

**Key Features:**
- Configuration-based data enhancement
- Critical skill assignment algorithms
- Availability balancing mechanisms
- Realistic preference generation
- Data quality validation

## Script Parametreleri ve Konfigürasyon

### Hastane Data Generator (`generate_hospital_data.py`)

#### **Temel Parametreler:**
```python
NUM_EMPLOYEES = 80          # Toplam çalışan sayısı
NUM_DAYS = 7               # Çizelgeleme periyodu (hafta)
START_DATE = date.today()  # Başlangıç tarihi
OUTPUT_DIR = "synthetic_data"
CONFIG_FILE_PATH = "configs/hospital_test_config.yaml"
AVG_DAYS_OFF_PER_PERIOD = 1.5  # Ortalama izin günü sayısı
PREFERENCE_PROBABILITY = 0.4    # Tercih belirtme olasılığı
```

#### **Rol Dağılımları:**
```python
ROLES = {
    "Hemşire": 0.6,      # %60 hemşire
    "Doktor": 0.2,       # %20 doktor
    "Teknisyen": 0.15,   # %15 teknisyen
    "İdari": 0.05        # %5 idari personel
}
```

#### **Departman Dağılımları:**
```python
DEPARTMENTS = {
    "Acil": 0.2,           # %20
    "Kardiyoloji": 0.15,   # %15
    "Cerrahi": 0.15,       # %15
    "Pediatri": 0.15,      # %15
    "Yoğun Bakım": 0.15,   # %15
    "Radyoloji": 0.1,      # %10
    "Laboratuvar": 0.1     # %10
}
```

### Çağrı Merkezi Data Generator (`generate_cagri_merkezi_data.py`)

#### **Temel Parametreler:**
```python
NUM_EMPLOYEES = 80          # Toplam operatör sayısı
NUM_DAYS = 7               # Çizelgeleme periyodu (hafta)
OUTPUT_DIR = "synthetic_data_cagri_merkezi"
CONFIG_FILE_PATH = "configs/cagri_merkezi_config.yaml"
AVG_DAYS_OFF_PER_PERIOD = 1.2  # Daha az izin (7/24 hizmet)
PREFERENCE_PROBABILITY = 0.35   # Tercih belirtme olasılığı
```

#### **Rol Dağılımları:**
```python
ROLES = {
    "Çağrı Alıcı": 0.45,      # %45
    "Yönlendirici": 0.3,      # %30
    "Vardiya Amiri": 0.15,    # %15
    "Teknik Destek": 0.1      # %10
}
```

#### **Departman Dağılımları:**
```python
DEPARTMENTS = {
    "Genel Çağrı": 0.25,           # %25
    "Polis Yönlendirme": 0.2,      # %20
    "Sağlık Yönlendirme": 0.2,     # %20
    "İtfaiye Yönlendirme": 0.15,   # %15
    "Teknik Operasyonlar": 0.1,    # %10
    "Yönetim": 0.1                 # %10
}
```

## CSV Dosya Yapıları ve İçerikleri

### 1. `employees.csv` / `employees_cm.csv`

**Amaç:** Sistemdeki çalışanları, ana rollerini ve departmanlarını listeler.

**Sütunlar:**
- `employee_id`: Çalışan için benzersiz kimlik
  - **Hastane:** "E001", "E002", ..., "E080"
  - **Çağrı Merkezi:** "CM_E001", "CM_E002", ..., "CM_E080"
- `name`: Çalışanın tam adı (rastgele Türkçe isimler)
  - **Örnek:** "Dr. Ayşe Kaya", "Hemşire Mehmet Yılmaz"
- `role`: Çalışanın ana rolü
  - **Hastane:** "Hemşire", "Doktor", "Teknisyen", "İdari"
  - **Çağrı Merkezi:** "Çağrı Alıcı", "Yönlendirici", "Vardiya Amiri", "Teknik Destek"
- `department`: Çalışanın bağlı olduğu departman
  - **Hastane:** "Acil", "Kardiyoloji", "Cerrahi", "Pediatri", "Yoğun Bakım", "Radyoloji", "Laboratuvar", "İdari"
  - **Çağrı Merkezi:** "Genel Çağrı", "Polis Yönlendirme", "Sağlık Yönlendirme", "İtfaiye Yönlendirme", "Teknik Operasyonlar", "Yönetim"

**Generation Logic:**
- Zorunlu atamalar önce yapılır (her departmanda minimum personel)
- Kalan çalışanlar ağırlıklı rastgele dağılımla atanır
- Rol-departman uyumluluğu kontrol edilir (örn: Teknisyen → Radyoloji/Laboratuvar)

### 2. `skills.csv` / `skills_cm.csv`

**Amaç:** Çalışanların sahip olduğu yetenekleri listeler. Her satır bir çalışan-yetenek eşleşmesidir.

**Sütunlar:**
- `employee_id`: Yeteneğe sahip olan çalışanın kimliği
- `skill`: Çalışanın sahip olduğu yetenek

**Hastane Yetenekleri (ROLE_SKILLS):**

#### **Hemşire Yetenekleri:**
- **Zorunlu:** "Temel Hasta Bakımı", "İlk Yardım Sertifikası", "İlaç Yönetimi"
- **Seçmeli (max 3):** "Yoğun Bakım Sertifikası", "Ameliyathane Deneyimi", "Pediatri Yetkinliği", "Acil Servis Deneyimi", "Kan Alma Yetkinliği", "Diyabet Hemşireliği", "Yara Bakım Uzmanlığı", "Onkoloji Hemşireliği", "Triyaj Yetkinliği"

#### **Doktor Yetenekleri:**
- **Zorunlu:** "Tıp Lisansı", "Hasta Muayenesi", "Tanı Koyma"
- **Uzmanlık (1 adet):** "Acil Tıp", "Kardiyoloji Uzmanlığı", "Cerrahi Uzmanlığı", "Pediatri Uzmanlığı", "Yoğun Bakım Uzmanlığı", "Radyoloji Uzmanlığı"
- **Ek Yetkinlik (max 2):** "Ultrason Kullanımı", "EKG Yorumlama", "Entübasyon", "Sutur Atma", "Girişimsel İşlemler"

#### **Teknisyen Yetenekleri:**
- **Zorunlu:** "Cihaz Kullanımı", "Güvenlik Protokolleri", "Kalite Kontrol"
- **Seçmeli (max 2):** "Radyoloji Cihazı Kullanımı", "Laboratuvar Analizi", "Kan Bankası İşlemleri", "Görüntüleme Teknikleri"

**Çağrı Merkezi Yetenekleri (ROLE_SKILLS):**

#### **Çağrı Alıcı Yetenekleri:**
- **Zorunlu:** "Hızlı Klavye Kullanımı", "Etkili İletişim", "Problem Çözme"
- **Seçmeli (max 3):** "Yabancı Dil (İngilizce)", "Yabancı Dil (Almanca)", "Stres Yönetimi Teknikleri", "Kriz Yönetimi Temel Bilgisi", "Coğrafi Bilgi Sistemleri Kullanımı", "İleri Düzey Stres Yönetimi"

#### **Yönlendirici Yetenekleri:**
- **Zorunlu:** "Acil Durum Kodları Bilgisi", "Hızlı Karar Verme", "Koordinasyon Yeteneği"
- **Masa Spesifik (max 2):** "Polis Kriz Protokolleri", "Temel Tıbbi Triyaj Bilgisi", "İtfaiye Operasyon Bilgisi"
- **Genel (max 2):** "Yabancı Dil", "Coğrafi Bilgi Sistemleri", "Stres Yönetimi"

#### **Vardiya Amiri Yetenekleri:**
- **Zorunlu:** "Liderlik ve Koordinasyon", "Ekip Yönetimi", "Kriz Yönetimi"
- **Seçmeli (max 3):** "Performans Değerlendirme", "Çatışma Çözümü", "Eğitim ve Mentorluk", "Stratejik Planlama"

**Skill Assignment Algorithm:**
1. **Zorunlu yetenekler** otomatik atanır
2. **Seçmeli yetenekler** rastgele seçilir (max_secmeli limiti dahilinde)
3. **Kritik yetenekler** belirli oranlarda atanır (critical_skill_assignment_rates)
4. **Configuration-based enhancement** YAML'dan gelen skill requirements'ları zorlar
5. **Limit kontrolü** yapılır (add_skill_with_limit_check)

### 3. `shifts.csv` / `shifts_cm.csv`

**Amaç:** Çizelgeleme periyodu içindeki tüm olası vardiyaları listeler.

**Sütunlar:**
- `shift_id`: Vardiya için benzersiz kimlik
  - **Hastane:** "S0001", "S0002", ..., "S0XXX"
  - **Çağrı Merkezi:** "CM_S0001", "CM_S0002", ..., "CM_S0XXX"
- `name`: Vardiyanın adı (departman bilgisi dahil)
  - **Hastane Örnek:** "Gündüz Hafta İçi Acil", "Gece Hafta Sonu Kardiyoloji"
  - **Çağrı Merkezi Örnek:** "Sabah Hafta İçi Genel Çağrı", "Akşam Hafta Sonu Polis Yönlendirme"
- `date`: Vardiyanın gerçekleştiği tarih (ISO formatı: "YYYY-MM-DD")
- `start_time`: Vardiyanın başlangıç saati (ISO formatı: "HH:MM:SS")
- `end_time`: Vardiyanın bitiş saati (ISO formatı: "HH:MM:SS")
- `department`: Vardiyanın ilgili olduğu departman

**Hastane Shift Definitions:**
```python
SHIFT_DEFINITIONS = [
    # Gündüz Hafta İçi (08:00-16:00) - Tüm departmanlar
    {"id": "Gunduz_Hici", "start": time(8,0), "end": time(16,0), "days": range(0,5),
     "departments": ["Acil", "Kardiyoloji", "Cerrahi", "Pediatri", "Yoğun Bakım", "Radyoloji", "Laboratuvar", "İdari"]},

    # Akşam Hafta İçi (16:00-00:00) - Klinik departmanlar
    {"id": "Aksam_Hici", "start": time(16,0), "end": time(0,0), "days": range(0,5),
     "departments": ["Acil", "Kardiyoloji", "Cerrahi", "Pediatri", "Yoğun Bakım"]},

    # Gece Hafta İçi (00:00-08:00) - Kritik departmanlar
    {"id": "Gece_Hici", "start": time(0,0), "end": time(8,0), "days": range(1,6),
     "departments": ["Acil", "Yoğun Bakım"]},

    # Hafta sonu vardiyaları - Acil ve kritik departmanlar
    {"id": "Gunduz_Hsonu", "start": time(8,0), "end": time(20,0), "days": [5,6],
     "departments": ["Acil", "Yoğun Bakım", "Pediatri"]},

    {"id": "Gece_Hsonu", "start": time(20,0), "end": time(8,0), "days": [6,0],
     "departments": ["Acil", "Yoğun Bakım"]}
]
```

**Çağrı Merkezi Shift Definitions:**
```python
SHIFT_DEFINITIONS = [
    # Sabah (08:00-15:00) - Tüm departmanlar
    {"id_prefix": "Sabah_Hici", "start": time(8,0), "end": time(15,0), "days": range(0,5),
     "departments": ["Genel Çağrı", "Polis Yönlendirme", "Sağlık Yönlendirme", "İtfaiye Yönlendirme", "Teknik Operasyonlar", "Yönetim"]},

    # Öğle (15:00-22:00) - Operasyonel departmanlar
    {"id_prefix": "Ogle_Hici", "start": time(15,0), "end": time(22,0), "days": range(0,5),
     "departments": ["Genel Çağrı", "Polis Yönlendirme", "Sağlık Yönlendirme", "İtfaiye Yönlendirme"]},

    # Gece (22:00-08:00) - 7/24 departmanlar
    {"id_prefix": "Gece_Hici", "start": time(22,0), "end": time(8,0), "days": range(1,6),
     "departments": ["Genel Çağrı", "Polis Yönlendirme", "Sağlık Yönlendirme"]}
]
```

### 4. `availability.csv` / `availability_cm.csv`

**Amaç:** Her çalışanın çizelgeleme periyodundaki her gün için uygunluk durumunu belirtir.

**Sütunlar:**
- `employee_id`: Çalışanın kimliği
- `date`: İlgili günün tarihi (ISO formatı: "YYYY-MM-DD")
- `is_available`: Uygunluk durumu (1: Müsait, 0: Müsait Değil)

**Availability Generation Algorithm:**
```python
def generate_availability(employees_df, start_date, num_days, avg_days_off):
    # Gauss dağılımı ile izin günü sayısı belirlenir
    num_off_days = max(0, round(random.gauss(avg_days_off, avg_days_off / 2)))

    # Rastgele izin günleri seçilir
    off_dates = random.sample(all_dates, min(num_off_days, len(all_dates)))
```

**Çağrı Merkezi Özel Mantığı:**
- **Kritik roller** için minimum uygunluk garantisi
- **Vardiya Amiri** her gün en az 1 kişi uygun
- **Yönlendirici** departmanlarında minimum coverage
- **Balanced distribution** algoritması ile eşit dağılım

### 5. `preferences.csv` / `preferences_cm.csv`

**Amaç:** Çalışanların belirli vardiyalara yönelik tercihlerini listeler.

**Sütunlar:**
- `employee_id`: Tercihi belirten çalışanın kimliği
- `shift_id`: Tercihin ilgili olduğu vardiyanın kimliği
- `preference_score`: Tercih skoru
  - `1`: Bu vardiyayı tercih ediyor
  - `-1`: Bu vardiyayı tercih etmiyor
  - `0`: Nötr (genellikle kullanılmaz)

**Preference Generation Algorithm:**
```python
def generate_preferences(employees_df, shifts_df, preference_probability):
    for employee in employees:
        if random.random() < preference_probability:  # %40 (hastane) / %35 (çağrı merkezi)
            num_prefs = random.randint(1, 3)  # 1-3 tercih
            pref_shifts = random.sample(shift_ids, min(num_prefs, len(shift_ids)))
            for shift_id in pref_shifts:
                score = random.choice([-1, 1])  # Pozitif veya negatif tercih
```

**Tercih Belirtme Oranları:**
- **Hastane:** %40 çalışan tercih belirtir
- **Çağrı Merkezi:** %35 çalışan tercih belirtir
- **Tercih Sayısı:** Çalışan başına 1-3 vardiya
- **Tercih Dağılımı:** %50 pozitif, %50 negatif

## Data Quality ve Enhancement Algoritmaları

### Configuration-Based Enhancement

**enhance_data_based_on_config() Fonksiyonu:**
```python
def enhance_data_based_on_config(employees_df, shifts_df, skills_list, config_file, role_skills):
    # 1. YAML konfigürasyonunu oku
    with open(config_file, 'r') as file:
        config = yaml.safe_load(file)

    # 2. Minimum staffing requirements'ları analiz et
    min_staffing_reqs = config.get('rules', {}).get('min_staffing_requirements', [])

    # 3. Skill requirements'ları analiz et
    skill_reqs = config.get('rules', {}).get('skill_requirements', [])

    # 4. Eksik personel/yetenek varsa yeni çalışan ekle
    # 5. Kritik yetenekleri belirli oranlarda ata
```

### Critical Skill Assignment (Çağrı Merkezi)

**Kritik Yetenekler ve Atama Oranları:**
```python
critical_skill_assignment_rates = {
    "Liderlik ve Koordinasyon": {"role": "Vardiya Amiri", "department": "Yönetim", "rate": 1.0},
    "Polis Kriz Protokolleri": {"role": "Yönlendirici", "department": "Polis Yönlendirme", "rate": 0.9},
    "İleri Düzey Stres Yönetimi": {"role": "Çağrı Alıcı", "department": "Genel Çağrı", "rate": 0.8},
    "Temel Tıbbi Triyaj Bilgisi": {"role": "Yönlendirici", "department": "Sağlık Yönlendirme", "rate": 0.9}
}
```

### Availability Balancing (Çağrı Merkezi)

**Kritik Rol Minimum Uygunluk Garantisi:**
```python
critical_roles_depts = [
    {"role": "Vardiya Amiri", "department": "Yönetim"},
    {"role": "Yönlendirici", "department": "Polis Yönlendirme"},
    {"role": "Yönlendirici", "department": "Sağlık Yönlendirme"},
    {"role": "Çağrı Alıcı", "department": "Genel Çağrı"}
]

# Her gün için minimum 1 kişi uygun olacak şekilde ayarlama
```

## Performance Metrics ve Data Volume

### Hastane Data Generator

**Typical Output Volumes:**
- **Employees:** 80 çalışan
- **Skills:** ~240-320 skill assignment (çalışan başına 3-4 yetenek)
- **Shifts:** ~200-250 vardiya (7 gün × 8 departman × 3-5 vardiya türü)
- **Availability:** 560 kayıt (80 çalışan × 7 gün)
- **Preferences:** ~150-200 tercih kaydı (%40 participation rate)

**Generation Time:** ~2-5 saniye

### Çağrı Merkezi Data Generator

**Typical Output Volumes:**
- **Employees:** 80 operatör
- **Skills:** ~280-350 skill assignment (daha fazla kritik yetenek)
- **Shifts:** ~300-400 vardiya (7 gün × 6 departman × 7-9 vardiya türü)
- **Availability:** 560 kayıt (80 operatör × 7 gün)
- **Preferences:** ~120-180 tercih kaydı (%35 participation rate)

**Generation Time:** ~3-7 saniye (kritik skill assignment nedeniyle daha uzun)

## Usage Instructions

### Hastane Data Generation

```bash
# Hastane veri seti oluşturma
cd data_generators
python generate_hospital_data.py

# Output: synthetic_data/ klasörü
# - employees.csv
# - skills.csv
# - shifts.csv
# - availability.csv
# - preferences.csv
```

### Çağrı Merkezi Data Generation

```bash
# Çağrı merkezi veri seti oluşturma
cd data_generators
python generate_cagri_merkezi_data.py

# Output: synthetic_data_cagri_merkezi/ klasörü
# - employees_cm.csv
# - skills_cm.csv
# - shifts_cm.csv
# - availability_cm.csv
# - preferences_cm.csv
```

### n8n Integration

**Veri Seti Seçimi:**
```json
{
  "veriSeti": "hastane"        // synthetic_data/ klasörünü kullanır
}
```

```json
{
  "veriSeti": "cagri_merkezi"  // synthetic_data_cagri_merkezi/ klasörünü kullanır
}
```

**n8n Workflow Data Flow:**
```
1. CSV Files (synthetic_data/)
   ↓
2. n8n Read/Extract Nodes
   ↓
3. JSON Transformation
   ↓
4. OptimizationRequest Format
   ↓
5. FastAPI Backend
```

## Data Validation ve Quality Checks

### Automatic Validations

**Employee Data:**
- Unique employee_id kontrolü
- Rol-departman uyumluluğu
- Minimum personel gereksinimleri

**Skill Data:**
- Zorunlu yeteneklerin atanması
- Maksimum yetenek limitleri
- Kritik yetenek coverage

**Shift Data:**
- Unique shift_id kontrolü
- Tarih-saat formatı doğruluğu
- Departman-vardiya uyumluluğu

**Availability Data:**
- Tüm çalışan-tarih kombinasyonları
- Kritik roller için minimum uygunluk
- Balanced distribution

**Preference Data:**
- Valid employee_id ve shift_id referansları
- Preference score format (-1, 0, 1)
- Realistic participation rates

### Manual Quality Checks

```python
# Veri kalitesi kontrol scriptleri
def validate_data_quality(data_dir):
    # 1. Referential integrity kontrolü
    # 2. Data distribution analizi
    # 3. Business rule validation
    # 4. Performance impact assessment
```

## Customization ve Extension

### Yeni Rol Ekleme

```python
# ROLES dictionary'sine yeni rol ekle
ROLES["Yeni Rol"] = 0.05

# ROLE_SKILLS'e yetenek tanımları ekle
ROLE_SKILLS["Yeni Rol"] = {
    "zorunlu": ["Temel Yetenek"],
    "secmeli": ["Ek Yetenek 1", "Ek Yetenek 2"],
    "max_secmeli": 2
}
```

### Yeni Departman Ekleme

```python
# DEPARTMENTS dictionary'sine yeni departman ekle
DEPARTMENTS["Yeni Departman"] = 0.05

# SHIFT_DEFINITIONS'a yeni departman ekle
{"departments": [..., "Yeni Departman"]}
```

### Yeni Vardiya Türü Ekleme

```python
# SHIFT_DEFINITIONS'a yeni vardiya ekle
{
    "id": "Yeni_Vardiya",
    "name": "Yeni Vardiya Türü",
    "start": time(10, 0),
    "end": time(18, 0),
    "days": range(0, 7),
    "departments": ["İlgili Departmanlar"]
}
```

Bu synthetic data generation sistemi, gerçekçi ve tutarlı test verisi üretmek için gelişmiş algoritmalar kullanır ve optimizasyon sisteminin performansını değerlendirmek için ideal bir test ortamı sağlar.