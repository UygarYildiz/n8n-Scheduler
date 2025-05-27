# Sistem Mimarisi

Bu belge, Kurumsal Optimizasyon ve Otomasyon Çözümü'nün sistem mimarisini detaylı olarak açıklamaktadır. Belge, sistemin bileşenlerini, veri akışını, entegrasyon noktalarını, güvenlik katmanını ve çalışma prensiplerini kapsamlı bir şekilde ele almaktadır.

## Genel Bakış

Proje, modern web uygulaması standartlarında, esneklik ve uyarlanabilirlik sağlamak amacıyla **beş ana bileşenli** modüler bir mimari üzerine kurulmuştur:

### Ana Sistem Bileşenleri

1.  **React Frontend (UI Katmanı):** TypeScript ve Material UI kullanılarak geliştirilmiş modern web arayüzü. Kullanıcı kimlik doğrulama, dashboard, konfigürasyon yönetimi ve sonuç görselleştirme işlevlerini sağlar.

2.  **FastAPI Backend (API Katmanı):** Python tabanlı RESTful API servisi. Authentication, user management, optimization core entegrasyonu ve database işlemlerini yönetir. JWT tabanlı güvenlik ve role-based access control sağlar.

3.  **MySQL Veritabanı:** Multi-tenant yapıda kullanıcı yönetimi, kurum bilgileri, session yönetimi ve audit logging için kullanılır. Organizations, Users, Roles ve AuditLogs tablolarını içerir.

4.  **n8n Otomasyon Platformu:** Veri toplama, ön işleme, optimizasyon çekirdeğini tetikleme ve sonuçların işlenip dağıtılmasından sorumludur. Webhook tabanlı dinamik parametre alma mekanizması ile farklı veri setleri ve konfigürasyonlar arasında geçiş yapabilme esnekliği sağlar.

5.  **Optimizasyon Çekirdeği (Python/CP-SAT):** Google OR-Tools CP-SAT çözücüsünü kullanarak karmaşık vardiya çizelgeleme problemini çözer. FastAPI ile entegre çalışır ve konfigürasyon dosyalarından okunan parametrelere göre dinamik olarak kısıtlar ekleyebilir.

### Destekleyici Bileşenler

- **Nginx Reverse Proxy:** Production ortamında load balancing ve routing (opsiyonel)
- **Docker Compose:** Konteynerizasyon ve orchestration
- **Hibrit Konfigürasyon Sistemi:** YAML dosyaları + Database tabanlı ayarlar

## Bileşen Detayları

### 1. React Frontend (UI Katmanı)

React Frontend, kullanıcıların sistemle etkileşim kurduğu modern web arayüzüdür. TypeScript, Material UI ve Vite kullanılarak geliştirilmiştir.

#### 1.1. Teknoloji Stack'i

- **React 18.2.0:** Modern React hooks ve functional components
- **TypeScript:** Tip güvenliği ve geliştirici deneyimi
- **Material UI (MUI) 5.15.12:** Modern UI bileşenleri ve tema sistemi
- **React Router 6.22.3:** Client-side routing ve navigation
- **Vite:** Hızlı build tool ve development server
- **Axios 1.6.7:** HTTP client ve API entegrasyonu
- **Chart.js 4.4.2:** Veri görselleştirme ve raporlama

#### 1.2. Uygulama Yapısı

```
ui/
├── src/
│   ├── components/          # Yeniden kullanılabilir UI bileşenleri
│   ├── contexts/           # React Context (AuthContext)
│   ├── hooks/              # Custom React hooks
│   ├── layouts/            # Sayfa düzenleri (MainLayout)
│   ├── pages/              # Sayfa bileşenleri
│   │   ├── LoginPage.tsx   # Giriş sayfası
│   │   ├── Dashboard.tsx   # Ana dashboard
│   │   ├── AdminPage.tsx   # Yönetici paneli
│   │   ├── DatasetConfig.tsx # Veri seti konfigürasyonu
│   │   ├── OptimizationParams.tsx # Optimizasyon parametreleri
│   │   ├── Results.tsx     # Sonuçlar ve raporlar
│   │   ├── ScheduleView.tsx # Vardiya çizelgesi
│   │   └── Settings.tsx    # Sistem ayarları
│   ├── services/           # API servisleri (api.ts)
│   ├── types/              # TypeScript tip tanımları
│   └── utils/              # Yardımcı fonksiyonlar
├── public/                 # Statik dosyalar
└── index.html             # HTML şablonu
```

#### 1.3. Routing ve Navigation

Uygulama, React Router kullanarak aşağıdaki sayfa yapısını destekler:

- **Public Routes:**
  - `/login` - Kullanıcı giriş sayfası

- **Protected Routes:** (Authentication gerektirir)
  - `/dashboard` - Ana dashboard (tüm kullanıcılar)
  - `/admin` - Yönetici paneli (admin+ roller)
  - `/dataset-config` - Veri seti konfigürasyonu (manager+ roller)
  - `/optimization-params` - Optimizasyon parametreleri (manager+ roller)
  - `/results` - Sonuçlar ve raporlar (tüm kullanıcılar)
  - `/schedule-view` - Vardiya çizelgesi (tüm kullanıcılar)
  - `/settings` - Sistem ayarları (manager+ roller)
  - `/session-management` - Session yönetimi (admin+ roller)
  - `/audit-logs` - Audit logları (admin+ roller)

#### 1.4. Authentication ve State Management

- **AuthContext:** JWT token yönetimi ve kullanıcı durumu
- **ProtectedRoute:** Route-level yetkilendirme kontrolü
- **Role-based Access:** Sayfa ve bileşen seviyesinde erişim kontrolü

#### 1.5. API Entegrasyonu

- **Vite Proxy:** Development ortamında API proxy konfigürasyonu
  - `/api/*` → `http://localhost:8000` (FastAPI Backend)
  - `/webhook/*` → `http://localhost:5678` (n8n)
- **Axios Client:** HTTP istekleri ve error handling
- **Token Management:** JWT token'ların otomatik eklenmesi

### 2. FastAPI Backend (API Katmanı)

FastAPI Backend, sistemin ana API katmanını oluşturur ve tüm business logic'i yönetir.

#### 2.1. Teknoloji Stack'i

- **FastAPI 0.2.0:** Modern Python web framework
- **SQLAlchemy:** ORM ve database abstraction
- **MySQL Connector:** MySQL database driver
- **Pydantic:** Data validation ve serialization
- **JWT (PyJWT):** Token-based authentication
- **Bcrypt:** Password hashing
- **Uvicorn:** ASGI server

#### 2.2. API Modül Yapısı

```
optimization_core/
├── main.py                 # Ana FastAPI uygulaması
├── auth_api.py            # Authentication endpoints
├── auth_middleware.py     # JWT middleware ve yetkilendirme
├── auth_utils.py          # Authentication yardımcı fonksiyonlar
├── database.py            # SQLAlchemy modelleri ve DB bağlantısı
├── dashboard_api.py       # Dashboard endpoints
├── management_api.py      # User/Organization management
├── results_api.py         # Optimization results endpoints
├── webhook_api.py         # n8n webhook entegrasyonu
└── audit_utils.py         # Audit logging utilities
```

#### 2.3. API Endpoint Kategorileri

**Authentication Endpoints (`/auth/*`):**
- `POST /auth/login` - Kullanıcı girişi
- `POST /auth/logout` - Kullanıcı çıkışı
- `POST /auth/register` - Yeni kullanıcı kaydı (admin only)
- `GET /auth/profile` - Kullanıcı profil bilgileri
- `PUT /auth/profile` - Profil güncelleme
- `POST /auth/change-password` - Şifre değiştirme

**Dashboard Endpoints (`/api/dashboard/*`):**
- `GET /api/dashboard` - Dashboard verileri
- `GET /api/dashboard/stats` - İstatistiksel veriler

**User Management (`/api/users/*`):**
- `GET /api/users` - Kullanıcı listesi
- `POST /api/users` - Yeni kullanıcı oluşturma
- `PUT /api/users/{user_id}` - Kullanıcı güncelleme
- `DELETE /api/users/{user_id}` - Kullanıcı silme

**Organization Management (`/api/organizations/*`):**
- `GET /api/organizations` - Kurum listesi
- `POST /api/organizations` - Yeni kurum oluşturma
- `PUT /api/organizations/{org_id}` - Kurum güncelleme

**Optimization Endpoints:**
- `POST /optimize` - Optimizasyon işlemi
- `GET /api/results` - Optimizasyon sonuçları
- `GET /health` - API sağlık kontrolü

### 3. MySQL Veritabanı

MySQL veritabanı, multi-tenant yapıda kullanıcı yönetimi ve sistem verilerini saklar.

#### 3.1. Database Schema

**Organizations Tablosu:**
```sql
CREATE TABLE organizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    type ENUM('hastane', 'cagri_merkezi', 'diger') NOT NULL,
    description TEXT,
    config_file VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Roles Tablosu:**
```sql
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    permissions JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Users Tablosu:**
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    organization_id INT,
    role_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);
```

#### 3.2. Multi-Tenant Veri İzolasyonu

- Her kullanıcı sadece kendi kurumunun (`organization_id`) verilerine erişebilir
- API seviyesinde organization_id kontrolü
- Foreign key kısıtları ile veri bütünlüğü
- Audit logging ile erişim takibi

### 4. n8n Otomasyon Platformu

n8n, projenin otomasyon ve veri işleme katmanını oluşturur. Webhook tabanlı dinamik parametre alma mekanizması ile farklı veri setleri ve konfigürasyonlar arasında geçiş yapabilme esnekliği sağlar.

#### 4.1. İş Akışı Bileşenleri ve Çalışma Mantığı

İş akışı aşağıdaki temel adımlardan oluşur:

1. **Webhook Tetikleyici:**
   * Dışarıdan HTTP isteği ile tetiklenir (`http://localhost:5678/webhook/[webhook-id]?veriSeti=hastane&kurallar=temel_kurallar`)
   * URL parametreleri ile hangi veri seti (`veriSeti`) ve kural setinin (`kurallar`) kullanılacağı dinamik olarak belirlenir
   * Varsayılan değerler `configs/aktif_ayarlar.json` dosyasından alınır

2. **Read/Write Files from Disk:**
   * Webhook'tan gelen verileri işlemek için dosya okuma/yazma işlemlerini yönetir
   * Veri setine göre dosya yollarını belirler

3. **Edit Fields:**
   * Webhook'tan gelen parametreleri düzenler ve iş akışı için hazırlar

4. **Ayar Düğümü:**
   * Webhook parametrelerine göre dosya yollarını belirler
   * Örnek: `veriSeti=hastane` için `/veri_kaynaklari/hastane/employees.csv` yolunu oluşturur
   * Örnek: `veriSeti=cagri_merkezi` için `/veri_kaynaklari/cagri_merkezi/employees_cm.csv` yolunu oluşturur
   * Konfigürasyon dosyası referansını belirler (örn. `hospital_test_config.yaml` veya `cagri_merkezi_config.yaml`)

5. **Veri Okuma Düğümleri:**
   * Dinamik olarak belirlenen dosya yollarından CSV dosyalarını okur:
     * Çalışanlar (Employees)
     * Vardiyalar (Shifts)
     * Uygunluk durumu (Availability)
     * Tercihler (Preferences)
     * Yetenekler (Skills)
     * Özel Temel Konfigürasyon (Oku Temel Konfig)

6. **CSV Çıkarma Düğümleri:**
   * Her veri kaynağı için ayrı bir CSV çıkarma düğümü bulunur
   * Okunan CSV verilerini JSON formatına dönüştürür
   * Veri temizleme ve doğrulama işlemleri gerçekleştirir

7. **Merge Düğümü:**
   * Tüm veri kaynaklarından gelen JSON verilerini tek bir veri akışında birleştirir
   * Farklı veri tiplerini (çalışanlar, vardiyalar, yetenekler vb.) tek bir veri paketi haline getirir

8. **Code Düğümü (Veri İşleme ve Hazırlama):**
   * Verileri işleyip API'ye gönderilecek formata dönüştürür
   * Departman bilgilerini kontrol eder ve gerekli düzenlemeleri yapar
   * Optimizasyon API'sine gönderilecek JSON formatını oluşturur
   * Konfigürasyon dosyası referansını dinamik olarak ekler
   * Departman istatistiklerini oluşturur ve vardiyası olan ancak çalışanı olmayan departmanları kontrol eder

9. **HTTP Request Düğümü (API Çağrısı):**
   * Hazırlanan verileri Optimizasyon API'sine gönderir (POST isteği)
   * URL: `http://localhost:8000/optimize` veya üretim ortamında belirtilen URL
   * İstek gövdesi: Code düğümünden gelen işlenmiş veri

10. **Sonuç İşleme:**
    * API'den dönen sonuçları işler ve raporlar
    * Sonuçları ilgili sistemlere (Veritabanı, E-posta, Slack vb.) gönderebilir
    * Gerekirse onay veya bildirim adımlarını içerebilir

#### 4.2. Veri Setleri ve Dinamik Yapılandırma

İş akışı, farklı veri setleri için dinamik olarak çalışacak şekilde tasarlanmıştır:

* **Hastane Veri Seti:**
  * Webhook URL: `http://localhost:5678/webhook/[webhook-id]?veriSeti=hastane&kurallar=temel_kurallar`
  * Dosya yolları: `/veri_kaynaklari/hastane/` altındaki CSV dosyaları
  * Konfigürasyon: `/configs/hospital_test_config.yaml`
  * Roller: Doktor, Hemşire, Teknisyen, İdari
  * Departmanlar: Acil, Kardiyoloji, Cerrahi, Pediatri, Yoğun Bakım, Radyoloji, Laboratuvar

* **Çağrı Merkezi Veri Seti:**
  * Webhook URL: `http://localhost:5678/webhook/[webhook-id]?veriSeti=cagri_merkezi&kurallar=temel_kurallar`
  * Dosya yolları: `/veri_kaynaklari/cagri_merkezi/` altındaki CSV dosyaları
  * Konfigürasyon: `/configs/cagri_merkezi_config.yaml`
  * Roller: Çağrı Alıcı, Yönlendirici, Vardiya Amiri, Teknik Destek
  * Departmanlar: Genel Çağrı, Polis Yönlendirme, Sağlık Yönlendirme, İtfaiye Yönlendirme, Yönetim, Teknik Operasyonlar

### 5. Optimizasyon Çekirdeği (Python/CP-SAT)

Optimizasyon Çekirdeği, Google OR-Tools CP-SAT çözücüsünü kullanarak karmaşık vardiya çizelgeleme problemini çözen Python tabanlı bir servistir. FastAPI backend ile entegre çalışır.

#### 5.1. Mimari Yapı ve Bileşenler

Optimizasyon Çekirdeği aşağıdaki ana bileşenlerden oluşur:

1. **CP-SAT Model Builder:**
   * `ShiftSchedulingModelBuilder` sınıfı, CP-SAT modelini dinamik olarak oluşturur
   * Gelen veri ve konfigürasyona göre değişkenler, kısıtlar ve hedef fonksiyonu tanımlar
   * Konfigürasyondaki parametrelere göre (örn. `min_staffing_requirements`) ilgili kısıtları modele ekler
   * Hedef fonksiyonunu (`Minimize`) ve ağırlıkları konfigürasyondan alır

2. **CP-SAT Çözücü Entegrasyonu:**
   * `cp_model.CpSolver()` kullanarak modeli çözer
   * Çözüm süresi sınırı (`solver_time_limit_seconds`) gibi çözücü parametrelerini konfigürasyondan alır
   * Çözüm durumunu (OPTIMAL, FEASIBLE, INFEASIBLE vb.) yakalar ve raporlar

3. **Metrik Hesaplayıcı:**
   * Optimizasyon sonuçlarına göre çeşitli performans metriklerini hesaplar
   * Operasyonel metrikler (understaffing, overstaffing, coverage ratios)
   * Çalışan memnuniyeti metrikleri (preferences met, workload distribution)
   * Sistem esnekliği ve uyarlanabilirlik metrikleri

4. **Sonuç Formatlayıcı:**
   * Çözücüden gelen sonucu ve hesaplanan metrikleri standart bir JSON formatına dönüştürür
   * Pydantic modelleri ile yanıt formatını doğrular
   * FastAPI'nin kolayca işleyebileceği tutarlı bir yanıt yapısı sağlar

#### 5.2. Optimizasyon Modeli Detayları

Vardiya çizelgeleme problemi için oluşturulan CP-SAT modeli şu temel bileşenleri içerir:

1. **Karar Değişkenleri:**
   * `assignment_vars[(employee_id, shift_id)]`: Boolean değişken, çalışanın vardiyaya atanıp atanmadığını belirtir
   * `employee_shift_counts[employee_id]`: Integer değişken, çalışanın toplam atanan vardiya sayısını tutar
   * `shift_employee_counts[shift_id]`: Integer değişken, vardiyaya atanan toplam çalışan sayısını tutar

2. **Temel Kısıtlar:**
   * Bir çalışan aynı anda tek vardiyada olabilir
   * Çalışanlar sadece uygun oldukları günlerde vardiyalara atanabilir
   * Vardiya gereksinimleri (minimum personel sayısı) karşılanmalıdır

3. **Dinamik Kısıtlar (Konfigürasyondan):**
   * Rol ve departmana göre minimum personel gereksinimleri
   * Vardiya desenlerine göre yetenek gereksinimleri
   * Maksimum ardışık vardiya sayısı
   * Vardiyalar arası minimum dinlenme süresi

4. **Hedef Fonksiyonu:**
   * Ağırlıklı toplam minimizasyonu:
     * Eksik personel cezası
     * Fazla personel maliyeti
     * Karşılanmayan tercih cezası
     * İş yükü dengesizliği cezası
     * Boş vardiya cezası

## Güvenlik ve Yetkilendirme Mimarisi

### JWT Authentication Sistemi

Sistem, modern web uygulaması standartlarında JWT (JSON Web Token) tabanlı authentication kullanır:

#### Authentication Flow:
1. **Login:** Kullanıcı credentials → JWT token + refresh token
2. **Authorization:** Her API isteğinde JWT token header'da gönderilir
3. **Validation:** Middleware seviyesinde token doğrulama
4. **Session Management:** Database'de session tracking
5. **Logout:** Token invalidation ve session cleanup

#### Role-Based Access Control (RBAC):

```
Rol Hiyerarşisi:
├── super_admin (Sistem geneli yönetim)
├── org_admin (Kurum yönetimi)
├── manager (Departman yönetimi)
├── planner (Optimizasyon işlemleri)
├── staff (Temel kullanım)
└── viewer (Sadece görüntüleme)
```

#### Endpoint Yetkilendirme:
- **Public:** `/auth/login`, `/health`
- **Authenticated:** `/dashboard`, `/results`, `/schedule-view`
- **Manager+:** `/dataset-config`, `/optimization-params`, `/settings`
- **Admin+:** `/admin`, `/users`, `/session-management`, `/audit-logs`
- **Super Admin:** `/organizations`, `/system-settings`

### 6. Hibrit Konfigürasyon Yönetimi

Sistem, hibrit bir konfigürasyon yaklaşımı kullanarak hem esneklik hem de yönetilebilirlik sağlar.

#### 6.1. Çoklu Konfigürasyon Katmanları

**YAML Dosya Tabanlı Konfigürasyon:**
- Kuruma özel optimizasyon parametreleri (`configs/` klasörü)
- Minimum personel gereksinimleri, yetenek gereksinimleri
- Hedef fonksiyon ağırlıkları ve çözücü ayarları

**Veritabanı Tabanlı Konfigürasyon:**
- Kullanıcı yönetimi ve kurum bilgileri
- Runtime konfigürasyonları ve ayarlar
- Session management ve audit logging

**API Tabanlı Konfigürasyon:**
- Dinamik parametre güncellemeleri
- Webhook entegrasyonları ve real-time ayarlar

#### 6.2. Konfigürasyon Öncelik Hiyerarşisi

```
1. API Parametreleri (En yüksek öncelik)
2. Veritabanı Ayarları
3. YAML Dosya Konfigürasyonları
4. Varsayılan Değerler (En düşük öncelik)
```

#### 6.3. Örnek Konfigürasyon Dosyaları

**Hastane Konfigürasyonu (`hospital_test_config.yaml`):**
- Acil, Kardiyoloji, Cerrahi gibi departmanlar için minimum personel gereksinimleri
- Doktor, Hemşire, Teknisyen rolleri için yetenek gereksinimleri
- Gece vardiyaları için özel kurallar
- Kardiyoloji uzmanlığı gibi özel yetenek gereksinimleri

**Çağrı Merkezi Konfigürasyonu (`cagri_merkezi_config.yaml`):**
- Genel Çağrı, Polis Yönlendirme, Sağlık Yönlendirme departmanları için minimum personel gereksinimleri
- Çağrı Alıcı, Yönlendirici, Vardiya Amiri rolleri için yetenek gereksinimleri
- Yoğun saatler için özel personel gereksinimleri
- Dil becerileri ve teknik yetenek gereksinimleri

## Kapsam Notu: Departmanların Modellenmesi

Bu projenin ilk fazında, **departmanlar** (örn. Kardiyoloji, Acil Servis, Üretim Hattı B) sistemde **ayrı bir varlık olarak açıkça modellenmeyecektir**. Bunun yerine, departman veya alan bazlı gereksinimler ve kısıtlamalar aşağıdaki yöntemlerle dolaylı olarak ele alınacaktır:

1.  **Özelleştirilmiş Vardiya Tanımları:** Vardiyalar (`shifts.csv` ve konfigürasyon) belirli bir departmanı veya alanı temsil edecek şekilde adlandırılabilir (örn. `Acil_Gunduz`, `YogunBakim_Gece`).
2.  **Konfigürasyon Bazlı Gereksinimler:** Her bir özelleştirilmiş vardiya için gerekli minimum personel sayısı, rol ve **spesifik yetenekler** (`skills.csv` ve `.yaml` konfigürasyonu) aracılığıyla tanımlanacaktır.

**Bu Yaklaşımın Nedenleri:**

*   **Başlangıç Karmaşıklığını Azaltma:** Departmanları ayrı bir varlık olarak eklemek; veri modelini, yapay veri üretimini, konfigürasyon yapısını ve optimizasyon mantığını ekstradan karmaşıklaştıracaktır. Projenin ilk aşamalarında çekirdek optimizasyon ve otomasyon akışına odaklanmak hedeflenmektedir.
*   **Esneklik:** Rol/yetenek bazlı yaklaşım, birçok departman benzeri ihtiyacı karşılamak için yeterli esnekliği sunmaktadır.

**Gelecek Değerlendirmesi:**
Eğer test aşamasında veya gerçek kurum entegrasyonlarında, departmanları açıkça modellemenin (personel aidiyeti, departmanlar arası geçiş kısıtları, doğrudan departman bazlı raporlama için) kesinlikle gerekli olduğu ortaya çıkarsa, bu özellik **gelecek bir geliştirme fazı** olarak eklenebilir. Mevcut modüler mimari bu tür bir genişlemeye izin vermektedir.

## Sistem Veri Akışı ve Entegrasyon

### Genel Sistem Mimarisi

Aşağıdaki şema, güncellenmiş sistem mimarisini ve bileşenler arası veri akışını göstermektedir:

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                    KULLANICI KATMANI                    │
                    └─────────────────────────────────────────────────────────┘
                                              │
                                              ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │                  REACT FRONTEND                         │
                    │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
                    │  │   Login     │ │  Dashboard  │ │  Admin Panel    │   │
                    │  │   Page      │ │             │ │                 │   │
                    │  └─────────────┘ └─────────────┘ └─────────────────┘   │
                    │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
                    │  │ Optimization│ │   Results   │ │  Schedule View  │   │
                    │  │   Params    │ │             │ │                 │   │
                    │  └─────────────┘ └─────────────┘ └─────────────────┘   │
                    └─────────────────────────────────────────────────────────┘
                                              │
                                              ▼ HTTP/HTTPS (JWT Auth)
                    ┌─────────────────────────────────────────────────────────┐
                    │                   FASTAPI BACKEND                      │
                    │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
                    │  │    Auth     │ │  Dashboard  │ │   User Mgmt     │   │
                    │  │     API     │ │     API     │ │      API        │   │
                    │  └─────────────┘ └─────────────┘ └─────────────────┘   │
                    │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
                    │  │  Webhook    │ │ Optimization│ │   Results       │   │
                    │  │     API     │ │     Core    │ │     API         │   │
                    │  └─────────────┘ └─────────────┘ └─────────────────┘   │
                    └─────────────────────────────────────────────────────────┘
                              │                              │
                              ▼ MySQL                       ▼ HTTP
                    ┌─────────────────────┐    ┌─────────────────────────────┐
                    │   MYSQL DATABASE    │    │        n8n PLATFORM        │
                    │  ┌───────────────┐  │    │  ┌───────────────────────┐  │
                    │  │ Organizations │  │    │  │    Webhook Trigger    │  │
                    │  │     Users     │  │    │  │   Data Processing     │  │
                    │  │     Roles     │  │    │  │   CSV Operations      │  │
                    │  │  AuditLogs    │  │    │  │   HTTP Requests       │  │
                    │  │   Sessions    │  │    │  │  Result Processing    │  │
                    │  └───────────────┘  │    │  └───────────────────────┘  │
                    └─────────────────────┘    └─────────────────────────────┘
                                                              │
                                                              ▼ File System
                                              ┌─────────────────────────────┐
                                              │     VERI KAYNAKLARI         │
                                              │  ┌───────────────────────┐  │
                                              │  │   CSV Files           │  │
                                              │  │   YAML Configs        │  │
                                              │  │   Synthetic Data      │  │
                                              │  └───────────────────────┘  │
                                              └─────────────────────────────┘
```

### Multi-Tenant Veri Akışı

```
Kullanıcı Girişi → JWT Token → Organization ID → Veri İzolasyonu
     │                │              │                │
     ▼                ▼              ▼                ▼
┌─────────┐    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Login   │    │ Token       │  │ Org Check   │  │ Filtered    │
│ Request │    │ Validation  │  │ Middleware  │  │ Data Access │
└─────────┘    └─────────────┘  └─────────────┘  └─────────────┘
```

### 4.2. n8n İş Akışı Detaylı Şeması

Aşağıdaki şema, n8n iş akışının güncellenmiş detaylı yapısını göstermektedir:

```
                                  +------------------+
                                  |                  |
                                  |     Webhook      |
                                  | (URL Parametreli)|
                                  |                  |
                                  +--------+---------+
                                           |
                                           | veriSeti, kurallar
                                           v
                                  +--------+---------+
                                  |                  |
                                  | Read/Write Files |
                                  |    from Disk     |
                                  |                  |
                                  +--------+---------+
                                           |
                                           v
                                  +--------+---------+
                                  |                  |
                                  |   Edit Fields    |
                                  |                  |
                                  +--------+---------+
                                           |
                                           v
                                  +--------+---------+
                                  |                  |
                                  |   Ayar Düğümü    |
                                  | (Dosya Yolları)  |
                                  |                  |
                                  +--------+---------+
                                           |
         +---------------------+---+---+---+---+---------------------+
         |                     |       |       |                     |
         v                     v       v       v                     v
+--------+---------+  +--------+---+ +---+--+ +--+--------+  +------+-------+
|                  |  |            | |      | |           |  |              |
| Employees        |  | Shifts     | | Avai-| | Preferen- |  | Skills       |
| (CSV Okuma)      |  | (CSV Okuma)| | labi-| | ces       |  | (CSV Okuma)  |
|                  |  |            | | lity | | (CSV)     |  |              |
+--------+---------+  +--------+---+ +---+--+ +--+--------+  +------+-------+
         |                     |         |        |                  |
         v                     v         v        v                  v
+--------+---------+  +--------+---+ +---+--+ +--+--------+  +------+-------+
|                  |  |            | |      | |           |  |              |
| Extract          |  | Extract    | | Extr-| | Extract   |  | Extract      |
| Employees CSV    |  | Shifts CSV | | act  | | Preferen- |  | Skills CSV   |
|                  |  |            | | Avai-| | ces CSV   |  |              |
+--------+---------+  +--------+---+ +---+--+ +--+--------+  +------+-------+
         |                     |         |        |                  |
         |                     |         |        |                  |
         |                     |         |        |                  |
         |                     |         |        |                  |
         |                     |         |        |                  |
         |                     |         |        |                  |
         |                     |         |        |                  |
         |                     |         |        |                  |
         |                     |         |        |                  |
         |                     |         |        |                  |
         |                     |         |        |                  |
         |                     |         |        |                  v
         |                     |         |        |          +------+-------+
         |                     |         |        |          |              |
         |                     |         |        |          | Oku Temel    |
         |                     |         |        |          | Konfig       |
         |                     |         |        |          |              |
         |                     |         |        |          +------+-------+
         |                     |         |        |                 |
         |                     |         |        |                 |
         |                     |         |        |                 |
         |                     v         |        |                 |
         |            +--------+---------+--------+-----------------+
         +----------->+                                            |
                      |                 Merge                      |
                      |                                            |
                      +--------+---------------------------------------+
                               |
                               v
                      +--------+---------------------------------------+
                      |                                                |
                      |  Code: Veri İşleme                             |
                      |  - Departman Kontrolü                          |
                      |  - JSON Formatı                                |
                      |                                                |
                      +--------+---------------------------------------+
                               |
                               | JSON Veri
                               v
                      +--------+---------------------------------------+
                      |                                                |
                      |  HTTP Request:                                 |
                      |  API Çağrısı                                   |
                      |  (POST /optimize)                              |
                      |                                                |
                      +--------+---------------------------------------+
                               |
                               | Optimizasyon Sonuçları
                               v
                      +--------+---------------------------------------+
                      |                                                |
                      |  Sonuç İşleme                                  |
                      |                                                |
                      +------------------------------------------------+
```

### 4.3. Optimizasyon Çekirdeği İç Yapısı

Aşağıdaki şema, Optimizasyon Çekirdeği'nin iç yapısını ve veri akışını göstermektedir:

```
                      +----------------------------------+
                      |                                  |
                      |  FastAPI Endpoint: /optimize     |
                      |  (POST İsteği Alımı)             |
                      |                                  |
                      +---------------+------------------+
                                      |
                                      | JSON İstek
                                      v
                      +---------------+------------------+
                      |                                  |
                      |  Veri Doğrulama                  |
                      |  (Pydantic Modelleri)            |
                      |                                  |
                      +---------------+------------------+
                                      |
                                      | Geçerli Veri
                                      v
                      +---------------+------------------+
                      |                                  |
                      |  Konfigürasyon Yükleme           |
                      |  (YAML Dosyası veya JSON)        |
                      |                                  |
                      +---------------+------------------+
                                      |
                                      | Konfigürasyon
                                      v
                      +---------------+------------------+
                      |                                  |
                      |  ShiftSchedulingModelBuilder    |
                      |  (CP-SAT Model Oluşturucu)       |
                      |                                  |
                      +---------------+------------------+
                                      |
                                      v
                      +---------------+------------------+
                      |                                  |
                      |  Değişken Oluşturma              |
                      |  - assignment_vars               |
                      |  - employee_shift_counts         |
                      |  - shift_employee_counts         |
                      |                                  |
                      +---------------+------------------+
                                      |
                                      v
                      +---------------+------------------+
                      |                                  |
                      |  Temel Kısıtlar Ekleme           |
                      |  - Bir çalışan aynı anda tek     |
                      |    vardiyada olabilir            |
                      |  - Uygunluk durumu kontrolü      |
                      |                                  |
                      +---------------+------------------+
                                      |
                                      v
                      +---------------+------------------+
                      |                                  |
                      |  Dinamik Kısıtlar Ekleme         |
                      |  - Minimum personel gereksinimleri|
                      |  - Yetenek gereksinimleri        |
                      |  - Maksimum ardışık vardiya      |
                      |  - Minimum dinlenme süresi       |
                      |                                  |
                      +---------------+------------------+
                                      |
                                      v
                      +---------------+------------------+
                      |                                  |
                      |  Hedef Fonksiyon Tanımlama       |
                      |  - Eksik personel minimizasyonu  |
                      |  - Fazla personel minimizasyonu  |
                      |  - Tercih maksimizasyonu         |
                      |  - İş yükü dengeleme             |
                      |                                  |
                      +---------------+------------------+
                                      |
                                      v
                      +---------------+------------------+
                      |                                  |
                      |  CP-SAT Çözücü                   |
                      |  - Model çözme                   |
                      |  - Çözüm durumu yakalama         |
                      |                                  |
                      +---------------+------------------+
                                      |
                                      | Çözüm
                                      v
                      +---------------+------------------+
                      |                                  |
                      |  Sonuç İşleme                    |
                      |  - Atama kararları çıkarma       |
                      |                                  |
                      +---------------+------------------+
                                      |
                                      v
                      +---------------+------------------+
                      |                                  |
                      |  Metrik Hesaplama                |
                      |  - Operasyonel metrikler         |
                      |  - Çalışan memnuniyeti metrikleri|
                      |  - Adalet metrikleri             |
                      |                                  |
                      +---------------+------------------+
                                      |
                                      v
                      +---------------+------------------+
                      |                                  |
                      |  Yanıt Oluşturma                 |
                      |  - JSON formatında sonuç         |
                      |                                  |
                      +---------------+------------------+
                                      |
                                      | JSON Yanıt
                                      v
                      +---------------+------------------+
                      |                                  |
                      |  FastAPI Endpoint: /optimize     |
                      |  (Yanıt Gönderimi)               |
                      |                                  |
                      +----------------------------------+
```

## 5. Veri Modeli ve Arayüzler

### 5.1. Veri Giriş Formatı (n8n -> Optimizasyon Çekirdeği)

Optimizasyon Çekirdeği'ne gönderilen veri formatı aşağıdaki yapıdadır:

```json
{
  "configuration_ref": "hospital_test_config.yaml",
  "input_data": {
    "employees": [
      {"employee_id": "E001", "role": "Doktor", "department": "Acil"},
      {"employee_id": "E002", "role": "Hemşire", "department": "Kardiyoloji"}
    ],
    "shifts": [
      {"shift_id": "S001", "date": "2023-05-01", "start_time": "08:00:00", "end_time": "16:00:00", "department": "Acil"},
      {"shift_id": "S002", "date": "2023-05-01", "start_time": "16:00:00", "end_time": "00:00:00", "department": "Acil"}
    ],
    "skills": [
      {"employee_id": "E001", "skill": "Kardiyoloji Uzmanlığı"},
      {"employee_id": "E002", "skill": "Temel Hasta Bakımı"}
    ],
    "availability": [
      {"employee_id": "E001", "date": "2023-05-01", "is_available": 1},
      {"employee_id": "E002", "date": "2023-05-01", "is_available": 0}
    ],
    "preferences": [
      {"employee_id": "E001", "shift_id": "S001", "preference_score": 1},
      {"employee_id": "E002", "shift_id": "S002", "preference_score": -1}
    ]
  }
}
```

### 5.2. Veri Çıkış Formatı (Optimizasyon Çekirdeği -> n8n)

Optimizasyon Çekirdeği'nden dönen yanıt formatı aşağıdaki yapıdadır:

```json
{
  "status": "OPTIMAL",
  "solver_status_message": "Optimal solution found.",
  "processing_time_seconds": 2.45,
  "objective_value": 125.5,
  "solution": {
    "assignments": [
      {"employee_id": "E001", "shift_id": "S001"},
      {"employee_id": "E003", "shift_id": "S002"}
    ]
  },
  "metrics": {
    "total_understaffing": 0,
    "total_overstaffing": 2,
    "min_staffing_coverage_ratio": 1.0,
    "skill_coverage_ratio": 0.95,
    "positive_preferences_met_count": 5,
    "negative_preferences_assigned_count": 1,
    "total_preference_score_achieved": 4,
    "workload_distribution_std_dev": 0.5
  }
}
```

## Docker Compose ve Sistem Entegrasyonu

### Docker Compose Yapısı

Sistem, Docker Compose kullanılarak aşağıdaki servisleri orchestrate eder:

```yaml
version: '3.7'

services:
  # MySQL Veritabanı Servisi
  mysql:
    image: mysql:8.0
    restart: unless-stopped
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: bitirme_root_2024
      MYSQL_DATABASE: optimization_db
      MYSQL_USER: optimization_user
      MYSQL_PASSWORD: optimization_pass_2024
      MYSQL_CHARSET: utf8mb4
      MYSQL_COLLATION: utf8mb4_unicode_ci
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database/init:/docker-entrypoint-initdb.d
    networks:
      - optimization_network

  # n8n Otomasyon Platformu
  n8n:
    image: n8nio/n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - GENERIC_TIMEZONE=Europe/Istanbul
      - N8N_EDITOR_BASE_URL=http://localhost:5678
      - NODE_FUNCTION_ALLOW_EXTERNAL=js-yaml,yaml,fs-extra
    volumes:
      - ./n8n_data:/home/node/.n8n
      - ./configs:/mnt/workflow_configs
      - ./veri_kaynaklari:/mnt/workflow_data
    depends_on:
      - mysql
    networks:
      - optimization_network

volumes:
  mysql_data:

networks:
  optimization_network:
    driver: bridge
```

### Sistem Başlatma Sırası

1. **MySQL Database:**
   ```bash
   docker-compose up -d mysql
   ```

2. **n8n Platform:**
   ```bash
   docker-compose up -d n8n
   ```

3. **FastAPI Backend:**
   ```bash
   uvicorn optimization_core.main:app --reload --port 8000
   ```
   veya
   ```bash
   ./run_api.bat
   ```

4. **React Frontend (Development):**
   ```bash
   cd ui
   npm run dev
   ```

### Production Deployment

**Geleneksel Deployment (Docker Compose):**
- Windows batch dosyaları ile otomatik kurulum
- Docker Desktop gerektirmeyen paketlenmiş çözümler
- Kuruma özel konfigürasyon şablonları

**Cloud-First Deployment (Render Platform):**
- React UI, FastAPI Backend, PostgreSQL Database
- Background service olarak n8n
- Otomatik scaling ve backup

### Environment Variables

```bash
# Database
MYSQL_ROOT_PASSWORD=bitirme_root_2024
MYSQL_DATABASE=optimization_db
MYSQL_USER=optimization_user
MYSQL_PASSWORD=optimization_pass_2024

# JWT Authentication
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# n8n Configuration
N8N_EDITOR_BASE_URL=http://localhost:5678
GENERIC_TIMEZONE=Europe/Istanbul
```

## Gelecek Geliştirmeler ve Roadmap

### Mevcut Durum (✅ Tamamlanan)

- ✅ React Frontend (TypeScript + Material UI)
- ✅ FastAPI Backend (Authentication + API)
- ✅ MySQL Database (Multi-tenant)
- ✅ n8n Otomasyon Platformu
- ✅ JWT Authentication Sistemi
- ✅ Role-based Access Control
- ✅ Docker Compose Entegrasyonu
- ✅ Optimizasyon Çekirdeği (CP-SAT)

### Kısa Vadeli Geliştirmeler (1-2 Ay)

**Frontend İyileştirmeleri:**
- 🔄 Dashboard görselleştirme geliştirmeleri
- 🔄 Real-time optimizasyon sonuç takibi
- 🔄 Gelişmiş kullanıcı profil yönetimi
- 🔄 Mobile responsive tasarım iyileştirmeleri

**Backend Optimizasyonları:**
- 🔄 Asenkron optimizasyon işlemleri
- 🔄 API rate limiting ve caching
- 🔄 Gelişmiş audit logging
- 🔄 Email notification sistemi

**Deployment İyileştirmeleri:**
- 🔄 Production Docker konfigürasyonu
- 🔄 CI/CD pipeline kurulumu
- 🔄 Monitoring ve logging sistemi

### Orta Vadeli Geliştirmeler (3-6 Ay)

**Ölçeklendirme:**
- 📋 Mikroservis mimarisine geçiş
- 📋 Redis cache entegrasyonu
- 📋 Load balancer konfigürasyonu
- 📋 Database sharding stratejisi

**Yeni Özellikler:**
- 📋 Multi-factor authentication (MFA)
- 📋 Advanced reporting ve analytics
- 📋 API versioning sistemi
- 📋 Webhook notification sistemi

**Performans:**
- 📋 Database query optimizasyonu
- 📋 Frontend bundle optimization
- 📋 CDN entegrasyonu
- 📋 Background job processing

### Uzun Vadeli Geliştirmeler (6+ Ay)

**Gelişmiş Özellikler:**
- 📋 Machine learning entegrasyonu
- 📋 Predictive analytics
- 📋 Advanced optimization algorithms
- 📋 Multi-language support

**Enterprise Özellikler:**
- 📋 SSO (Single Sign-On) entegrasyonu
- 📋 Advanced security compliance
- 📋 Custom branding options
- 📋 API marketplace

**Platform Genişletmeleri:**
- 📋 Mobile app development
- 📋 Third-party integrations
- 📋 Plugin architecture
- 📋 White-label solutions

## Sonuç

Bu mimari dokümantasyonu, Kurumsal Optimizasyon ve Otomasyon Çözümü'nün güncel durumunu yansıtmaktadır. Sistem:

### ✅ **Teknik Başarılar:**
- Modern web uygulaması standartlarında 5-katmanlı mimari
- JWT tabanlı güvenli authentication sistemi
- Multi-tenant database yapısı ile kurum izolasyonu
- RESTful API standardizasyonu
- Docker Compose ile kolay deployment

### ✅ **İş Değeri:**
- Hızlı kurum adaptasyonu (1-2 gün)
- Role-based access control ile güvenlik
- Hibrit konfigürasyon sistemi ile esneklik
- Çoklu deployment seçenekleri
- Ölçeklenebilir mimari tasarımı

### 🎯 **Gelecek Vizyonu:**
Bu mimari, hem mevcut ihtiyaçları karşılayan hem de gelecekteki değişikliklere ve yeni gereksinimlere kolayca uyum sağlayabilen, endüstri standardlarında bir optimizasyon çözümü sunmaktadır. Modüler yapısı sayesinde bileşenlerin bağımsız olarak geliştirilmesi, test edilmesi ve farklı kurumsal ihtiyaçlara göre kolayca uyarlanması mümkündür.
