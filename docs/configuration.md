# Konfigürasyon Yönetimi

Bu belge, Kurumsal Optimizasyon ve Otomasyon Çözümü'nün hibrit konfigürasyon yönetimi sistemini açıklar. Sistem, farklı kurumlara ve problem senaryolarına uyarlanabilirlik sağlamak için çoklu katmanlı bir konfigürasyon yaklaşımı kullanır.

## İçindekiler

1. [Hibrit Konfigürasyon Sistemi](#hibrit-konfigürasyon-sistemi)
2. [Konfigürasyon Öncelik Hiyerarşisi](#konfigürasyon-öncelik-hiyerarşisi)
3. [YAML Dosya Tabanlı Konfigürasyon](#yaml-dosya-tabanlı-konfigürasyon)
4. [Database Tabanlı Konfigürasyon](#database-tabanlı-konfigürasyon)
5. [API Tabanlı Konfigürasyon](#api-tabanlı-konfigürasyon)
6. [Environment Variables](#environment-variables)
7. [n8n Entegrasyonu](#n8n-entegrasyonu)
8. [Multi-Tenant Konfigürasyon](#multi-tenant-konfigürasyon)
9. [Deployment Konfigürasyonları](#deployment-konfigürasyonları)
10. [Kullanım Kılavuzu](#kullanım-kılavuzu)

## Hibrit Konfigürasyon Sistemi

Sistem, esneklik ve yönetilebilirlik sağlamak için hibrit bir konfigürasyon yaklaşımı kullanır. Bu yaklaşım, farklı konfigürasyon katmanlarını birleştirerek hem statik hem de dinamik konfigürasyon yönetimi sağlar.

### Konfigürasyon Katmanları

```
┌─────────────────────────────────────────────────────────┐
│                API PARAMETRELERI                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │ Webhook     │ │ REST API    │ │ Real-time       │   │
│  │ Parameters  │ │ Updates     │ │ Configuration   │   │
│  └─────────────┘ └─────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼ (En yüksek öncelik)
┌─────────────────────────────────────────────────────────┐
│                DATABASE AYARLARI                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │Organizations│ │ User Prefs  │ │ Runtime Config  │   │
│  │ config_file │ │             │ │                 │   │
│  └─────────────┘ └─────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│              YAML DOSYA KONFIGÜRASYONLARI               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │ hospital_   │ │ cagri_      │ │ aktif_ayarlar   │   │
│  │ test_config │ │ merkezi_    │ │ .json           │   │
│  │ .yaml       │ │ config.yaml │ │                 │   │
│  └─────────────┘ └─────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼ (En düşük öncelik)
┌─────────────────────────────────────────────────────────┐
│                 VARSAYILAN DEĞERLER                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │ Application │ │ Framework   │ │ System          │   │
│  │ Defaults    │ │ Defaults    │ │ Defaults        │   │
│  └─────────────┘ └─────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Temel Prensipler

- **Separation of Concerns**: Her katman farklı sorumluluklara sahiptir
- **Override Capability**: Üst katmanlar alt katmanları geçersiz kılar
- **Fallback Mechanism**: Bir katmanda değer yoksa alt katmana düşer
- **Multi-Tenant Support**: Kuruma özel konfigürasyon izolasyonu
- **Runtime Flexibility**: Çalışma zamanında konfigürasyon güncellemeleri

## Konfigürasyon Öncelik Hiyerarşisi

Sistem, aşağıdaki öncelik sırasına göre konfigürasyon değerlerini belirler:

```
1. API Parametreleri (En yüksek öncelik)
   ├── Webhook query parameters (?veriSeti=hastane&kurallar=temel_kurallar)
   ├── REST API configuration updates
   └── Real-time parameter overrides

2. Database Ayarları
   ├── Organizations.config_file referansı
   ├── User preferences ve settings
   └── Runtime configuration cache

3. YAML Dosya Konfigürasyonları
   ├── Kuruma özel config dosyaları (hospital_test_config.yaml)
   ├── aktif_ayarlar.json varsayılan ayarları
   └── Template konfigürasyon dosyaları

4. Varsayılan Değerler (En düşük öncelik)
   ├── Application default values
   ├── Framework default settings
   └── System fallback values
```

### Konfigürasyon Çözümleme Algoritması

```python
def resolve_configuration(api_params=None, user_org_id=None, config_ref=None):
    """Hibrit konfigürasyon çözümleme algoritması"""

    # 1. API parametreleri (en yüksek öncelik)
    if api_params and 'configuration' in api_params:
        return merge_configs(base_config, api_params['configuration'])

    # 2. Database ayarları
    if user_org_id:
        org_config = get_organization_config(user_org_id)
        if org_config and org_config.config_file:
            config_ref = org_config.config_file

    # 3. YAML dosya konfigürasyonu
    if config_ref:
        yaml_config = load_yaml_config(config_ref)
        return merge_configs(default_config, yaml_config)

    # 4. Varsayılan değerler
    return default_config
```

## YAML Dosya Tabanlı Konfigürasyon

### Mevcut Konfigürasyon Dosyaları

Sistem şu anda aşağıdaki YAML konfigürasyon dosyalarını kullanmaktadır:

#### 1. hospital_test_config.yaml

```yaml
institution_id: "hospital_test"
institution_name: "Test Hastanesi"
problem_type: "shift_scheduling"

# Optimizasyon Çekirdeği Parametreleri
optimization_core:
  solver_time_limit_seconds: 60
  objective_weights:
    minimize_overstaffing: 1
    minimize_understaffing: 10  # Eksik personelin cezası daha yüksek
    maximize_preferences: 2
    balance_workload: 0.5       # İş yükünü eşit dağıtma
    maximize_shift_coverage: 1  # Vardiya doluluğunu maksimize etme

# Modele Eklenecek Dinamik Kısıtlar ve Kurallar
rules:
  min_staffing_requirements:
    # Acil Servis Gereksinimleri
    - shift_pattern: "*Gece*Hafta*İçi*"
      role: "Hemşire"
      department: "Acil"
      min_count: 1
      penalty_if_violated: 100
    - shift_pattern: "*Gündüz*Hafta*İçi*"
      role: "Doktor"
      department: "Acil"
      min_count: 1

    # Yoğun Bakım Gereksinimleri
    - shift_pattern: "*Gece*Hafta*İçi*"
      role: "Hemşire"
      department: "Yoğun Bakım"
      min_count: 2
      penalty_if_violated: 100

    # Kardiyoloji Gereksinimleri
    - shift_pattern: "*Gündüz*Hafta*İçi*"
      role: "Doktor"
      department: "Kardiyoloji"
      min_count: 1
      penalty_if_violated: 100

  max_consecutive_shifts: 3
  min_rest_time_hours: 10

  # Yetenek/Sertifika Gereksinimleri
  skill_requirements:
    - shift_pattern: "*Gündüz*Hafta*Sonu*"
      skill: "Acil Servis Deneyimi"
      department: "Acil"
      min_count: 1
    - shift_pattern: "*Gece*Hafta*İçi*"
      skill: "Yoğun Bakım Sertifikası"
      department: "Yoğun Bakım"
      min_count: 1
      penalty_if_violated: 100

# n8n Parametreleri
n8n_parameters:
  notification_emails:
    - "test@testhastanesi.com"
  report_template: "hospital_report.tpl"
```

#### 2. cagri_merkezi_config.yaml

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

rules:
  min_staffing_requirements:
    # Müşteri Hizmetleri Gereksinimleri
    - shift_pattern: "*Gündüz*Hafta*İçi*"
      role: "Temsilci"
      department: "Müşteri Hizmetleri"
      min_count: 2
      penalty_if_violated: 100
    - shift_pattern: "*Gece*Hafta*İçi*"
      role: "Temsilci"
      department: "Müşteri Hizmetleri"
      min_count: 1
      penalty_if_violated: 150

    # Teknik Destek Gereksinimleri
    - shift_pattern: "*Gündüz*Hafta*İçi*"
      role: "Uzman Temsilci"
      department: "Teknik Destek"
      min_count: 1
      penalty_if_violated: 120

    # Yönetim Gözetimi
    - shift_pattern: "*Gündüz*Hafta*İçi*"
      role: "Süpervizör"
      department: "Yönetim"
      min_count: 1
      penalty_if_violated: 200

  max_consecutive_shifts: 3
  min_rest_time_hours: 10

  # Yetenek/Sertifika Gereksinimleri
  skill_requirements:
    - shift_pattern: "*Gündüz*Hafta*İçi*"
      skill: "Çoklu Dil"
      department: "Müşteri Hizmetleri"
      min_count: 1
      penalty_if_violated: 80
    - shift_pattern: "*Gündüz*Hafta*İçi*"
      skill: "Teknik Bilgi"
      department: "Teknik Destek"
      min_count: 1
      penalty_if_violated: 100

n8n_parameters:
  notification_emails:
    - "admin@cagrimerkezi.com"
  report_template: "call_center_report.tpl"
```

#### 3. aktif_ayarlar.json

Bu dosya, n8n workflow'unda varsayılan konfigürasyon seçimini belirler:

```json
{
  "varsayilan_veri_seti": "hastane",
  "varsayilan_kural_seti_adi": "temel_kurallar"
}
```

### YAML Konfigürasyon Yapısı

**Temel Bölümler:**

- **Institution Info**: `institution_id`, `institution_name`, `problem_type`
- **Optimization Core**: Çözücü parametreleri ve hedef fonksiyon ağırlıkları
- **Rules**: Dinamik kısıtlar ve kurallar
  - `min_staffing_requirements`: Minimum personel gereksinimleri
  - `max_consecutive_shifts`: Maksimum ardışık vardiya sayısı
  - `min_rest_time_hours`: Minimum dinlenme süresi
  - `skill_requirements`: Yetenek/sertifika gereksinimleri
- **n8n Parameters**: Workflow parametreleri ve bildirim ayarları

**Shift Pattern Syntax:**
- Joker karakterler desteklenir: `*Gece*Hafta*İçi*`
- Esnek eşleştirme: `*Gündüz*`, `*Hafta*Sonu*`
- Departman ve rol bazlı filtreleme
- Penalty-based soft constraints

## Database Tabanlı Konfigürasyon

### Organizations Tablosu

Database'de kuruma özel konfigürasyon yönetimi `organizations` tablosu üzerinden yapılır:

```sql
CREATE TABLE organizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    type ENUM('hastane', 'cagri_merkezi', 'diger') NOT NULL,
    description TEXT,
    config_file VARCHAR(255),  -- YAML dosya referansı
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**config_file Alanı:**
- YAML konfigürasyon dosyasının adını saklar
- Örnek: `hospital_test_config.yaml`, `cagri_merkezi_config.yaml`
- Multi-tenant konfigürasyon izolasyonu sağlar
- Runtime'da dinamik konfigürasyon seçimi için kullanılır

### Varsayılan Kurum Konfigürasyonları

```sql
-- Demo kurumları ve konfigürasyon dosyaları
INSERT INTO organizations (name, type, description, config_file) VALUES
('Demo Hastane', 'hastane', 'Demo hastane kurumu', 'hospital_test_config.yaml'),
('Demo Çağrı Merkezi', 'cagri_merkezi', 'Demo çağrı merkezi kurumu', 'cagri_merkezi_config.yaml');
```

## API Tabanlı Konfigürasyon

### Configuration Management API

Sistem, runtime'da konfigürasyon yönetimi için RESTful API endpoint'leri sağlar:

#### Konfigürasyon Listeleme

```http
GET /api/configurations
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "configurations": [
    {
      "id": "hospital_test_config.yaml",
      "name": "Hastane Konfigürasyonu",
      "path": "/configs/hospital_test_config.yaml"
    },
    {
      "id": "cagri_merkezi_config.yaml",
      "name": "Çağrı Merkezi Konfigürasyonu",
      "path": "/configs/cagri_merkezi_config.yaml"
    }
  ]
}
```

#### Konfigürasyon İçeriği Okuma

```http
GET /api/configuration-content?configId=hospital_test_config.yaml
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "configId": "hospital_test_config.yaml",
  "content": "institution_id: \"hospital_test\"\ninstitution_name: \"Test Hastanesi\"...",
  "lastModified": "2024-01-15T10:30:00Z"
}
```

#### Konfigürasyon Güncelleme

```http
POST /api/configuration-content
Authorization: Bearer <jwt_token>
Content-Type: application/x-www-form-urlencoded

configId=hospital_test_config.yaml&content=<yaml_content>
```

**Response:**
```json
{
  "status": "success",
  "message": "hospital_test_config.yaml konfigürasyonu başarıyla güncellendi"
}
```

### Dynamic Configuration Loading

FastAPI backend'de dinamik konfigürasyon yükleme:

```python
def load_config(config_ref: Optional[str], config_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Konfigürasyon verisini yükler (öncelik: doğrudan veri, sonra dosya)."""

    # 1. Doğrudan gönderilen konfigürasyon (en yüksek öncelik)
    if config_data:
        logger.info("Doğrudan gönderilen konfigürasyon kullanılıyor.")
        return config_data

    # 2. Dosya referansı ile konfigürasyon
    elif config_ref:
        script_dir = os.path.dirname(os.path.dirname(__file__))
        config_path = os.path.join(script_dir, CONFIG_DIR, config_ref)

        if not os.path.exists(config_path):
            raise HTTPException(status_code=404, detail=f"Configuration file not found: {config_ref}")

        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                loaded_config = yaml.safe_load(f)
                return loaded_config if loaded_config else {}
        except yaml.YAMLError as e:
            raise HTTPException(status_code=500, detail=f"Error parsing configuration file YAML: {e}")

    # 3. Varsayılan konfigürasyon
    else:
        logger.warning("Konfigürasyon bilgisi sağlanmadı. Varsayılanlar kullanılacak.")
        return {}
```

## Environment Variables

### Docker Compose Environment Variables

Sistem, Docker Compose ile aşağıdaki environment variable'ları kullanır:

#### MySQL Database

```yaml
# docker-compose.yml
mysql:
  environment:
    MYSQL_ROOT_PASSWORD: bitirme_root_2024
    MYSQL_DATABASE: optimization_db
    MYSQL_USER: optimization_user
    MYSQL_PASSWORD: optimization_pass_2024
    MYSQL_CHARSET: utf8mb4
    MYSQL_COLLATION: utf8mb4_unicode_ci
```

#### n8n Platform

```yaml
# docker-compose.yml
n8n:
  environment:
    - GENERIC_TIMEZONE=Europe/Istanbul
    - N8N_EDITOR_BASE_URL=http://localhost:5678
    - NODE_FUNCTION_ALLOW_EXTERNAL=js-yaml,yaml,fs-extra
```

#### FastAPI Backend

```python
# Environment variables for FastAPI
JWT_SECRET_KEY = "bitirme_projesi_jwt_secret_key_2024_very_secure"
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 saat

# Database connection
DATABASE_URL = "mysql://optimization_user:optimization_pass_2024@localhost:3306/optimization_db"

# Configuration paths
CONFIG_DIR = "configs"
DATA_DIR = "veri_kaynaklari"
```

### Production Environment Variables

Production deployment için environment variable'lar:

```bash
# .env.production
# Database
MYSQL_ROOT_PASSWORD=<strong_password>
MYSQL_DATABASE=optimization_prod
MYSQL_USER=optimization_prod_user
MYSQL_PASSWORD=<strong_password>

# JWT Authentication
JWT_SECRET_KEY=<256_bit_secret_key>
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440

# n8n Configuration
N8N_EDITOR_BASE_URL=https://your-domain.com
GENERIC_TIMEZONE=Europe/Istanbul

# SSL/TLS
SSL_CERT_PATH=/etc/ssl/certs/your-cert.pem
SSL_KEY_PATH=/etc/ssl/private/your-key.pem
```

## n8n Entegrasyonu

### Webhook Parametreleri ile Dinamik Konfigürasyon

n8n workflow'u, webhook parametreleri aracılığıyla dinamik konfigürasyon seçimi yapar:

#### Webhook URL Formatı

```
http://localhost:5678/webhook/[webhook-id]?veriSeti=hastane&kurallar=temel_kurallar
http://localhost:5678/webhook/[webhook-id]?veriSeti=cagri_merkezi&kurallar=temel_kurallar
```

**Parametreler:**
- `veriSeti`: Kullanılacak veri seti (`hastane`, `cagri_merkezi`)
- `kurallar`: Kural seti adı (`temel_kurallar`)

#### n8n Konfigürasyon Seçim Algoritması

```javascript
// n8n Code düğümünde konfigürasyon seçimi
const upstreamNodeOutput = items[0].json;

// aktif_ayarlar.json dosyasından varsayılan değerleri al
let aktifAyarlar;
try {
  const aktifAyarlarStr = Buffer.from(items[1].binary.data.data, 'base64').toString();
  aktifAyarlar = JSON.parse(aktifAyarlarStr);
} catch (error) {
  aktifAyarlar = {
    varsayilan_veri_seti: "hastane",
    varsayilan_kural_seti_adi: "temel_kurallar"
  };
}

// Webhook parametrelerinden veya varsayılan değerlerden veri seti belirle
const nihaiVeriSeti = upstreamNodeOutput.veriSeti || aktifAyarlar.varsayilan_veri_seti;
const nihaiKurallar = upstreamNodeOutput.kurallar || aktifAyarlar.varsayilan_kural_seti_adi;

// Konfigürasyon dosyası yolunu belirle
const configPath = nihaiVeriSeti === "cagri_merkezi" ?
                   "/mnt/workflow_configs/cagri_merkezi_config.yaml" :
                   nihaiVeriSeti === "yeni_veri_seti" ?
                   "/mnt/workflow_configs/yeni_veri_seti_config.yaml" :
                   "/mnt/workflow_configs/hospital_test_config.yaml";
```

### Volume Mappings

Docker Compose'da n8n için volume mappings:

```yaml
# docker-compose.yml
n8n:
  volumes:
    - ./n8n_data:/home/node/.n8n
    - ./configs:/mnt/workflow_configs      # Konfigürasyon dosyaları
    - ./veri_kaynaklari:/mnt/workflow_data # Veri dosyaları
```

**Volume Açıklamaları:**
- `/mnt/workflow_configs`: YAML konfigürasyon dosyalarına erişim
- `/mnt/workflow_data`: CSV veri dosyalarına erişim
- `/home/node/.n8n`: n8n workflow ve ayar dosyaları

## Multi-Tenant Konfigürasyon

### Organization-Based Configuration Isolation

Her kurum kendi konfigürasyon dosyasına sahiptir ve diğer kurumların konfigürasyonlarına erişemez:

#### Konfigürasyon İzolasyonu

```python
def get_organization_config(user_org_id: int) -> Optional[str]:
    """Kullanıcının kurumuna göre konfigürasyon dosyası referansını al"""

    org = db.query(Organization).filter(
        Organization.id == user_org_id,
        Organization.is_active == True
    ).first()

    if org and org.config_file:
        return org.config_file

    # Varsayılan konfigürasyon
    return "default_config.yaml"
```

#### API Seviyesinde İzolasyon

```python
@router.get("/api/configuration-content")
async def get_configuration_content(
    configId: str,
    current_user: User = Depends(get_current_active_user)
):
    """Kullanıcının kurumuna ait konfigürasyon dosyasını getir"""

    # Kullanıcının kurumunun konfigürasyon dosyasını kontrol et
    user_org_config = get_organization_config(current_user.organization_id)

    # Güvenlik kontrolü: Kullanıcı sadece kendi kurumunun config'ine erişebilir
    if configId != user_org_config and current_user.role.name != 'super_admin':
        raise HTTPException(
            status_code=403,
            detail="Bu konfigürasyon dosyasına erişim yetkiniz yok"
        )

    # Konfigürasyon dosyasını oku ve döndür
    return read_configuration_file(configId)
```

### Kurum Bazlı Veri Setleri

Her kurum kendi veri setine sahiptir:

```
veri_kaynaklari/
├── hastane/
│   ├── employees.csv
│   ├── shifts.csv
│   ├── availability.csv
│   ├── preferences.csv
│   └── skills.csv
├── cagri_merkezi/
│   ├── employees_cm.csv
│   ├── shifts_cm.csv
│   ├── availability_cm.csv
│   ├── preferences_cm.csv
│   └── skills_cm.csv
└── organization_3/
    ├── employees_org3.csv
    └── ...
```

## Deployment Konfigürasyonları

### Docker Compose Volume Yapısı

```yaml
# docker-compose.yml
version: '3.7'

services:
  mysql:
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database/init:/docker-entrypoint-initdb.d

  n8n:
    volumes:
      - ./n8n_data:/home/node/.n8n
      - ./configs:/mnt/workflow_configs
      - ./veri_kaynaklari:/mnt/workflow_data

volumes:
  mysql_data:

networks:
  optimization_network:
    driver: bridge
```

### Konfigürasyon Dosyası Yönetimi

**Development Environment:**
```bash
# Konfigürasyon dosyalarını kopyala
cp configs/hospital_test_config.yaml.example configs/hospital_test_config.yaml
cp configs/cagri_merkezi_config.yaml.example configs/cagri_merkezi_config.yaml

# Aktif ayarları düzenle
nano configs/aktif_ayarlar.json
```

**Production Environment:**
```bash
# Güvenli konfigürasyon dosyaları
chmod 600 configs/*.yaml
chown optimization:optimization configs/*.yaml

# Backup konfigürasyonları
cp configs/ /backup/configs-$(date +%Y%m%d)/
```

## Kullanım Kılavuzu

### Yeni Kurum Ekleme

1. **Database'de kurum oluştur:**
```sql
INSERT INTO organizations (name, type, description, config_file) VALUES
('Yeni Hastane', 'hastane', 'Yeni hastane kurumu', 'yeni_hastane_config.yaml');
```

2. **Konfigürasyon dosyası oluştur:**
```bash
# Template'den kopyala
cp configs/hospital_test_config.yaml configs/yeni_hastane_config.yaml

# Kuruma özel ayarları düzenle
nano configs/yeni_hastane_config.yaml
```

3. **Veri klasörü oluştur:**
```bash
mkdir veri_kaynaklari/yeni_hastane
# CSV dosyalarını kopyala ve düzenle
```

### Konfigürasyon Güncelleme

#### Web UI Üzerinden:
1. Admin paneline giriş yap
2. "Konfigürasyon Yönetimi" sayfasına git
3. İlgili konfigürasyon dosyasını seç
4. YAML içeriğini düzenle
5. "Kaydet" butonuna tıkla

#### API Üzerinden:
```bash
curl -X POST http://localhost:8000/api/configuration-content \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "configId=hospital_test_config.yaml&content=<yaml_content>"
```

#### Dosya Sistemi Üzerinden:
```bash
# Konfigürasyon dosyasını düzenle
nano configs/hospital_test_config.yaml

# n8n workflow'unu yeniden tetikle
curl -X POST "http://localhost:5678/webhook/[webhook-id]?veriSeti=hastane&kurallar=temel_kurallar"
```

### Troubleshooting

**Konfigürasyon dosyası bulunamıyor:**
- Dosya yolunu kontrol edin: `configs/` klasöründe olmalı
- Dosya izinlerini kontrol edin: readable olmalı
- Docker volume mapping'i kontrol edin

**YAML parse hatası:**
- YAML syntax'ını kontrol edin (indentation, quotes)
- Online YAML validator kullanın
- Log dosyalarını inceleyin: `docker-compose logs optimization_api`

**Webhook parametreleri çalışmıyor:**
- URL formatını kontrol edin
- aktif_ayarlar.json dosyasını kontrol edin
- n8n workflow'unda Code düğümünü kontrol edin

Bu hibrit konfigürasyon sistemi, hem esneklik hem de güvenlik sağlayarak farklı kurumların ihtiyaçlarına uygun çözümler sunar.
```