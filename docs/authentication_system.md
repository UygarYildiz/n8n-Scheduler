# Authentication ve Authorization Sistemi

Bu dokümantasyon, Kurumsal Optimizasyon ve Otomasyon Çözümü'nün kimlik doğrulama ve yetkilendirme sisteminin nasıl çalıştığını ve nasıl oluşturulduğunu açıklar. Sistem, modern web uygulamalarında kullanılan JWT token tabanlı kimlik doğrulama ile rol bazlı yetkilendirme (RBAC) modelini birleştirerek güvenli ve ölçeklenebilir bir çözüm sunar.

Bu sistem, hastane ve çağrı merkezi gibi kurumsal ortamlarda çalışan personelin güvenli bir şekilde sisteme erişmesini ve yetkilerine göre farklı işlemler yapabilmesini sağlar. Multi-tenant mimari ile farklı kurumların aynı sistem üzerinde güvenli bir şekilde çalışabilmesini mümkün kılar.

## İçindekiler

1. [Sistem Genel Bakış](#sistem-genel-bakış)
2. [Mimari Genel Bakış](#mimari-genel-bakış)
3. [Veritabanı Yapısı](#veritabanı-yapısı)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Rol ve Yetki Sistemi](#rol-ve-yetki-sistemi)
7. [Multi-Tenant Güvenlik](#multi-tenant-güvenlik)
8. [Session Management](#session-management)
9. [Audit Logging](#audit-logging)
10. [API Endpoint Güvenliği](#api-endpoint-güvenliği)
11. [Güvenlik Özellikleri](#güvenlik-özellikleri)
12. [Teknik Sorunlar ve Çözümler](#teknik-sorunlar-ve-çözümler)
13. [Kullanım Kılavuzu](#kullanım-kılavuzu)

## Sistem Genel Bakış

Bu bölüm, authentication (kimlik doğrulama) sisteminin temel işleyişini ve mimarisini açıklar. Authentication, kullanıcıların kim olduklarını doğrulama sürecidir, authorization ise bu kullanıcıların hangi işlemleri yapabileceğini belirleme sürecidir. Sistemimiz, kullanıcıların kimlik doğrulaması ve yetkilendirmesi için modern, güvenli ve kullanıcı dostu bir yaklaşım benimser.

### Ne Yapar?

Authentication sistemi, kullanıcıların sisteme güvenli bir şekilde giriş yapmasını ve yetkilerine göre farklı sayfalara/işlemlere erişmesini sağlar. Bu sistem, özellikle çok kullanıcılı kurumsal ortamlarda farklı yetki seviyelerine sahip personelin aynı platform üzerinde güvenli bir şekilde çalışabilmesini mümkün kılar.

Örneğin, bir hastanede doktor, hemşire, yönetici ve sistem yöneticisi gibi farklı rollerdeki kişiler aynı sistemi kullanabilir, ancak her biri sadece kendi yetkilerine uygun sayfalara ve işlemlere erişebilir. Bu sayede hem güvenlik sağlanır hem de kullanıcılar gereksiz karmaşıklıkla karşılaşmaz.

## Mimari Genel Bakış

Sistemin authentication mimarisi, modern web uygulaması standartlarında tasarlanmış olup aşağıdaki ana bileşenlerden oluşur:

### Sistem Bileşenleri

```
┌─────────────────────────────────────────────────────────┐
│                  REACT FRONTEND                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │ AuthContext │ │ProtectedRoute│ │ usePermissions  │   │
│  │             │ │             │ │     Hook        │   │
│  └─────────────┘ └─────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP/HTTPS (JWT Bearer Token)
┌─────────────────────────────────────────────────────────┐
│                 FASTAPI BACKEND                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │  auth_api   │ │auth_middleware│ │  auth_utils     │   │
│  │             │ │             │ │                 │   │
│  └─────────────┘ └─────────────┘ └─────────────────┘   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │audit_utils  │ │ database.py │ │  JWT + bcrypt   │   │
│  │             │ │             │ │                 │   │
│  └─────────────┘ └─────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼ MySQL Connection
┌─────────────────────────────────────────────────────────┐
│                   MYSQL DATABASE                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │Organizations│ │    Users    │ │     Roles       │   │
│  │             │ │             │ │                 │   │
│  └─────────────┘ └─────────────┘ └─────────────────┘   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │UserSessions │ │ AuditLogs   │ │  Multi-tenant   │   │
│  │             │ │             │ │   Data Model    │   │
│  └─────────────┘ └─────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
1. Login Request → FastAPI auth_api.py
2. Credential Validation → auth_utils.py (bcrypt)
3. JWT Token Generation → auth_utils.py (JWT + JTI)
4. Session Creation → database.py (UserSessions)
5. Audit Logging → audit_utils.py (AuditLogs)
6. Frontend Token Storage → AuthContext (localStorage)
7. API Request Authorization → auth_middleware.py
8. Role-based Access Control → usePermissions hook
9. Organization Data Isolation → Multi-tenant filtering
```

### Temel Özellikler

Sistemin sunduğu ana özellikler şunlardır:

#### 🔐 JWT Token Tabanlı Kimlik Doğrulama
- **Modern JWT Implementation**: HS256 algoritması ile güvenli token oluşturma
- **JTI (JWT ID) Sistemi**: Her token için benzersiz ID ile session tracking
- **24 Saat Geçerlilik**: Otomatik token expiration ve refresh mekanizması
- **Bearer Token Authentication**: HTTP Authorization header ile güvenli iletim

#### 👥 Rol Bazlı Yetki Sistemi (RBAC)
Sistemimizde hiyerarşik rol yapısı bulunur:

```
Rol Hiyerarşisi (Seviye 5 → 1):
├── super_admin (5) - Sistem geneli yönetim
├── org_admin (4) - Kurum yönetimi
├── manager (3) - Departman yönetimi
├── planner (2) - Optimizasyon işlemleri
└── staff (1) - Temel kullanım
```

Her rol, belirli endpoint'lere ve sayfalara erişim yetkisine sahiptir. Üst seviyedeki roller, alt seviyelerin tüm yetkilerine de sahip olur.

#### 🏢 Multi-Tenant Mimari
- **Organization-based Data Isolation**: Her kurum sadece kendi verilerine erişir
- **Secure Data Separation**: Veritabanı seviyesinde organization_id kontrolü
- **Scalable Architecture**: Tek sistem ile çoklu kurum desteği
- **Independent Configuration**: Kuruma özel ayarlar ve konfigürasyonlar

#### 🔄 Gelişmiş Session Yönetimi
- **Dual-Layer Validation**: JWT + Database session kontrolü
- **Concurrent Session Limit**: Kullanıcı başına maksimum 2 aktif session
- **Automatic Cleanup**: Süresi dolmuş session'ların otomatik temizlenmesi
- **Admin Session Control**: Yönetici tarafından session sonlandırma

#### 📊 Kapsamlı Audit Logging
Sistem şu işlemleri detaylı olarak loglar:
- **Authentication Events**: Login/logout, başarılı/başarısız girişler
- **User Management**: Kullanıcı CRUD işlemleri, rol değişiklikleri
- **Session Events**: Session oluşturma/sonlandırma
- **Security Events**: Yetkisiz erişim denemeleri, şifre değişiklikleri

Her log kaydı şu bilgileri içerir:
- İşlemi yapan kullanıcı ve hedef kullanıcı
- İşlem zamanı (UTC + Turkey timezone)
- IP adresi ve User Agent bilgisi
- İşlem detayları (JSON format)

#### 🌍 Timezone ve Karakter Desteği
- **Turkey Timezone**: Europe/Istanbul saat dilimi desteği
- **UTF-8 Full Support**: Türkçe karakterlerin tam desteği
- **Consistent Encoding**: Backend'den frontend'e kadar UTF-8
- **Locale Support**: Türkçe tarih/saat formatları

### Nasıl Çalışır?

Sistemin çalışma akışı şu adımları takip eder ve her adım kullanıcı güvenliği için optimize edilmiştir:

#### 🔑 Authentication Flow (Detaylı)

```
1. Frontend Login Request
   ├── React LoginPage component
   ├── AuthContext.login() method
   └── POST /auth/login

2. Backend Credential Validation
   ├── auth_api.py login endpoint
   ├── auth_utils.authenticate_user()
   ├── bcrypt.checkpw() password verification
   └── User.is_active check

3. JWT Token Generation
   ├── auth_utils.create_access_token()
   ├── JWT claims: user_id, username, org_id, role_id
   ├── JTI (unique token ID) generation
   └── 24-hour expiration setting

4. Session Management
   ├── database.py UserSession model
   ├── Maximum 2 concurrent sessions check
   ├── Old session cleanup (if limit exceeded)
   └── New session record creation

5. Audit Logging
   ├── audit_utils.log_login_success()
   ├── IP address and User Agent capture
   ├── AuditLog database record
   └── Security event tracking

6. Frontend Token Storage
   ├── localStorage.setItem('auth_token', token)
   ├── axios.defaults.headers.Authorization
   ├── AuthContext state update
   └── Redirect to dashboard

7. Subsequent API Requests
   ├── auth_middleware.get_current_user()
   ├── JWT token validation
   ├── Session database verification
   ├── Role-based access control
   └── Organization data isolation
```

#### 🛡️ Authorization Flow

```
1. Route Protection (Frontend)
   ├── ProtectedRoute component
   ├── useAuth() hook validation
   ├── usePermissions() role check
   └── Page access control

2. API Endpoint Protection (Backend)
   ├── auth_middleware.py decorators
   ├── ENDPOINT_PERMISSIONS mapping
   ├── Role hierarchy validation
   └── Organization access control

3. Data Isolation (Multi-tenant)
   ├── organization_id filtering
   ├── User.organization_id check
   ├── Database query restrictions
   └── Secure data separation
```

## Veritabanı Yapısı

Bu bölüm, authentication sisteminin temelini oluşturan veritabanı tablolarını ve aralarındaki ilişkileri açıklar. Sistem, MySQL 8.0 veritabanı kullanarak kullanıcı bilgilerini, rolleri, kurumları, oturum bilgilerini ve audit loglarını güvenli bir şekilde saklar.

### Database Schema Overview

```sql
-- Multi-tenant authentication database schema
-- Character set: utf8mb4_unicode_ci for Turkish character support
-- Engine: InnoDB for ACID compliance and foreign key support
```

### Organizations Tablosu

Bu tablo, sistemde kayıtlı olan kurumları (hastane, çağrı merkezi vb.) saklar. Multi-tenant mimarinin temelini oluşturur.

```sql
CREATE TABLE organizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    type ENUM('hastane', 'cagri_merkezi', 'diger') NOT NULL,
    description TEXT,
    config_file VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_organizations_type (type),
    INDEX idx_organizations_active (is_active)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Tablo Alanları:**
- `id`: Primary key, auto increment
- `name`: Kurum adı (unique constraint)
- `type`: Kurum tipi (hastane, çağrı merkezi, diğer)
- `description`: Kurum açıklaması
- `config_file`: Kuruma özel konfigürasyon dosyası referansı
- `is_active`: Kurum aktiflik durumu
- `created_at/updated_at`: Zaman damgaları

### Roles Tablosu

Bu tablo, sistemdeki tüm rolleri ve bunların yetkilerini saklar. RBAC (Role-Based Access Control) modelinin temelini oluşturur.

```sql
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    permissions JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_roles_name (name),
    INDEX idx_roles_active (is_active)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Rol Hiyerarşisi ve Seviyeler:**
```sql
-- Varsayılan roller (hierarchy level 5 → 1)
INSERT INTO roles (name, display_name, description, permissions) VALUES
('super_admin', 'Sistem Yöneticisi', 'Tüm sistem yetkilerine sahip', '{"level": 5, "pages": ["*"], "endpoints": ["*"]}'),
('org_admin', 'Kurum Yöneticisi', 'Kurum içi tam yetki', '{"level": 4, "pages": ["admin", "users", "settings"], "endpoints": ["/auth/*", "/api/users/*"]}'),
('manager', 'Departman Müdürü', 'Departman yönetimi yetkisi', '{"level": 3, "pages": ["dashboard", "optimization-params", "results"], "endpoints": ["/api/dashboard/*", "/optimize"]}'),
('planner', 'Vardiya Planlayıcısı', 'Planlama işlemleri yetkisi', '{"level": 2, "pages": ["dashboard", "results", "schedule-view"], "endpoints": ["/api/dashboard/*", "/api/results/*"]}'),
('staff', 'Personel', 'Temel kullanıcı yetkisi', '{"level": 1, "pages": ["dashboard", "results"], "endpoints": ["/api/dashboard/*"]}');
```

### Users Tablosu

Bu tablo, sistemdeki tüm kullanıcıların bilgilerini saklar. Her kullanıcı bir kuruma ve bir role bağlıdır. Multi-tenant güvenlik modelinin temelini oluşturur.

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

    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL,

    INDEX idx_users_username (username),
    INDEX idx_users_email (email),
    INDEX idx_users_organization (organization_id),
    INDEX idx_users_role (role_id),
    INDEX idx_users_active (is_active),
    INDEX idx_users_last_login (last_login)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Güvenlik Özellikleri:**
- `password_hash`: bcrypt algoritması ile hash'lenerek saklanır (cost factor: 12)
- `organization_id`: Multi-tenant veri izolasyonu için kritik
- `role_id`: RBAC sistemi için rol referansı
- `last_login`: Güvenlik audit için son giriş takibi
- `is_active`: Kullanıcı hesap durumu kontrolü

### UserSessions Tablosu

Bu tablo, aktif kullanıcı oturumlarını takip eder. JWT token'ların geçerliliğini kontrol etmek ve güvenlik ihlali durumunda oturumları sonlandırmak için kullanılır.

```sql
CREATE TABLE user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_jti VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP NULL,
    revoked_by INT NULL,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (revoked_by) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_user_sessions_user_id (user_id),
    INDEX idx_user_sessions_jti (token_jti),
    INDEX idx_user_sessions_expires (expires_at),
    INDEX idx_user_sessions_active (is_revoked, expires_at)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Session Management Özellikleri:**
- `token_jti`: JWT Token ID - her token için benzersiz tanımlayıcı
- `expires_at`: Token'ın geçerlilik süresi (24 saat)
- `is_revoked`: Oturumun iptal edilip edilmediğini belirler
- `revoked_by`: Oturumu sonlandıran admin kullanıcı
- **Concurrent Session Limit**: Kullanıcı başına maksimum 2 aktif session
- **Automatic Cleanup**: Süresi dolmuş session'ların otomatik temizlenmesi

### AuditLogs Tablosu

Bu tablo, sistemdeki tüm önemli işlemleri takip eder. Güvenlik ve uyumluluk amaçlı kapsamlı audit trail sağlar.

```sql
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action ENUM(
        'login_success', 'login_failed', 'logout', 'logout_all', 'session_revoked',
        'user_created', 'user_updated', 'user_deleted', 'user_status_changed',
        'password_changed', 'password_change_failed', 'profile_updated',
        'admin_access', 'unauthorized_access', 'role_changed'
    ) NOT NULL,
    user_id INT NULL,
    target_user_id INT NULL,
    description TEXT NOT NULL,
    details JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    success BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_audit_logs_action (action),
    INDEX idx_audit_logs_user_id (user_id),
    INDEX idx_audit_logs_target_user (target_user_id),
    INDEX idx_audit_logs_created_at (created_at),
    INDEX idx_audit_logs_success (success),
    INDEX idx_audit_logs_ip (ip_address)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Audit Actions Enum Açıklaması:**
- **Authentication**: `login_success`, `login_failed`, `logout`, `logout_all`
- **Session Management**: `session_revoked`
- **User Management**: `user_created`, `user_updated`, `user_deleted`, `user_status_changed`, `role_changed`
- **Security Events**: `password_changed`, `password_change_failed`, `unauthorized_access`
- **System Access**: `admin_access`, `profile_updated`

**Audit Log Detayları:**
- `user_id`: İşlemi yapan kullanıcı (NULL = sistem veya başarısız giriş)
- `target_user_id`: İşlem yapılan kullanıcı (admin işlemleri için)
- `description`: İşlem açıklaması (Türkçe)
- `details`: JSON formatında ek detaylar (request data, changes, etc.)
- `ip_address`: IPv4/IPv6 adresi (45 karakter limit)
- `user_agent`: Tarayıcı ve işletim sistemi bilgisi
- `success`: İşlem başarı durumu

### Database İlişkileri ve Constraints

```sql
-- Foreign Key İlişkileri
users.organization_id → organizations.id (SET NULL on delete)
users.role_id → roles.id (SET NULL on delete)
user_sessions.user_id → users.id (CASCADE on delete)
user_sessions.revoked_by → users.id (SET NULL on delete)
audit_logs.user_id → users.id (SET NULL on delete)
audit_logs.target_user_id → users.id (SET NULL on delete)

-- Unique Constraints
organizations.name (UNIQUE)
roles.name (UNIQUE)
users.username (UNIQUE)
users.email (UNIQUE)
user_sessions.token_jti (UNIQUE)

-- Performance Indexes
- Multi-column indexes for common queries
- Covering indexes for audit log searches
- Partial indexes for active sessions
```

## Backend Implementation

Bu bölüm, authentication sisteminin backend tarafındaki implementasyonunu detaylı olarak açıklar. Backend, FastAPI framework'ü kullanılarak geliştirilmiş olup, modern Python web geliştirme standartlarını takip eder.

### Teknoloji Stack'i

- **FastAPI 0.2.0**: Modern Python web framework
- **SQLAlchemy**: ORM ve database abstraction
- **MySQL Connector**: MySQL database driver
- **Pydantic**: Data validation ve serialization
- **PyJWT**: JWT token implementation
- **bcrypt**: Password hashing
- **python-jose**: JWT utilities

### Dosya Yapısı ve Modüler Mimari

Backend authentication sistemi modüler bir yapıda organize edilmiştir:

```
optimization_core/
├── main.py                 # FastAPI uygulaması ve router registration
├── database.py             # SQLAlchemy modelleri ve DB bağlantısı
├── auth_api.py            # Authentication API endpoints
├── auth_utils.py          # JWT ve password utilities
├── auth_middleware.py     # RBAC ve yetki kontrol middleware
├── audit_utils.py         # Audit logging utilities
├── dashboard_api.py       # Dashboard endpoints
├── management_api.py      # User/Organization management
├── results_api.py         # Optimization results endpoints
└── webhook_api.py         # n8n webhook entegrasyonu
```

### Core Authentication Modules

Bu modül, JWT token yönetimi ve password güvenliği için temel fonksiyonları sağlar.

**Temel Konfigürasyon:**
```python
# JWT ayarları
SECRET_KEY = "bitirme_projesi_jwt_secret_key_2024_very_secure"  # Production'da env variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 saat
```

**JWT Token Oluşturma:**
```python
def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """JWT access token oluşturur"""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    # JWT claims
    jti = str(uuid.uuid4())  # Unique token ID
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "jti": jti
    })

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt, jti, expire
```

**Password Güvenliği:**
```python
def hash_password(password: str) -> str:
    """Şifreyi bcrypt ile hash'ler"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Şifreyi doğrular"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
```

**Kullanıcı Authentication:**
```python
def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """Kullanıcı kimlik doğrulaması yapar"""
    user = db.query(User).filter(User.username == username, User.is_active == True).first()
    if not user:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user
```

#### 2. auth_middleware.py - RBAC ve Yetki Kontrolü

Bu modül, FastAPI middleware sistemi ile rol bazlı erişim kontrolü sağlar.

**Rol Hiyerarşisi:**
```python
ROLE_HIERARCHY = {
    'super_admin': 5,
    'org_admin': 4,
    'manager': 3,
    'planner': 2,
    'staff': 1
}
```

**Endpoint Permissions Mapping:**
```python
ENDPOINT_PERMISSIONS = {
    # Authentication endpoints
    '/auth/login': [],  # Public
    '/auth/logout': ['staff', 'planner', 'manager', 'org_admin', 'super_admin'],
    '/auth/profile': ['staff', 'planner', 'manager', 'org_admin', 'super_admin'],
    '/auth/register': ['org_admin', 'super_admin'],

    # Dashboard endpoints
    '/dashboard': ['staff', 'planner', 'manager', 'org_admin', 'super_admin'],
    '/health': [],  # Public

    # User management
    '/users': ['org_admin', 'super_admin'],
    '/users/create': ['org_admin', 'super_admin'],
    '/users/update': ['org_admin', 'super_admin'],
    '/users/delete': ['org_admin', 'super_admin'],

    # Admin operations
    '/admin': ['org_admin', 'super_admin'],
    '/audit-logs': ['org_admin', 'super_admin'],
    '/session-management': ['org_admin', 'super_admin'],

    # System settings
    '/settings': ['manager', 'org_admin', 'super_admin'],
    '/settings/system': ['org_admin', 'super_admin'],
}
```

**FastAPI Dependencies ve Middleware:**
```python
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """JWT token'dan mevcut kullanıcıyı al"""
    try:
        token = credentials.credentials
        payload = verify_token(token)

        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Geçersiz token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token'da kullanıcı ID'si bulunamadı",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Kullanıcıyı veritabanından al
        db = next(get_db())
        user = get_user_by_token(db, token)

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Kullanıcı bulunamadı",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Kullanıcı hesabı deaktif",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return user

    except JWTError as e:
        logger.error(f"JWT doğrulama hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token doğrulanamadı",
            headers={"WWW-Authenticate": "Bearer"},
        )
```

**Organization Access Control:**
```python
def check_organization_access(user, target_org_id: Optional[int] = None) -> bool:
    """Kullanıcının organizasyona erişim yetkisi var mı kontrol et"""
    # Super admin her organizasyona erişebilir
    if user.role.name == 'super_admin':
        return True

    # Diğer kullanıcılar sadece kendi organizasyonlarına erişebilir
    if target_org_id is None:
        return True  # Kendi organizasyonu

    return user.organization_id == target_org_id
```

#### 3. auth_api.py - Authentication Endpoints

Bu modül, authentication ile ilgili tüm API endpoint'lerini içerir.

**Login Endpoint:**
```python
@router.post("/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Kullanıcı girişi"""
    ip_address, user_agent = get_client_info(request)

    user = authenticate_user(db, login_data.username, login_data.password)

    if not user:
        # Başarısız giriş kaydı
        log_login_failed(
            db=db,
            username=login_data.username,
            reason="Invalid credentials",
            ip_address=ip_address,
            user_agent=user_agent
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Token oluştur
    token_data = {"sub": str(user.id)}
    access_token, jti, expires_at = create_access_token(token_data)

    # Yeni session kaydet
    create_user_session(db, user.id, jti, expires_at)

    # Last login güncelle
    user.last_login = datetime.now(timezone.utc)
    db.commit()

    # Başarılı giriş kaydı
    log_login_success(
        db=db,
        user_id=user.id,
        ip_address=ip_address,
        user_agent=user_agent
    )

    return LoginResponse(
        access_token=access_token,
        expires_in=60 * 24 * 60,  # 24 saat (saniye cinsinden)
        user=get_user_info(user)
    )
```

**Logout Endpoint:**
```python
@router.post("/logout")
async def logout(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Kullanıcı çıkışı"""
    ip_address, user_agent = get_client_info(request)

    # Mevcut session'ı iptal et
    revoke_user_session(db, current_user.id)

    # Audit log
    log_logout(
        db=db,
        user_id=current_user.id,
        ip_address=ip_address,
        user_agent=user_agent
    )

    return {"message": "Successfully logged out"}
```

## Frontend Implementation

Bu bölüm, React.js tabanlı frontend uygulamasındaki authentication sistemini açıklar. Modern React pattern'leri, TypeScript ve Material UI kullanılarak geliştirilmiştir.

### Teknoloji Stack'i

- **React 18.2.0**: Modern React hooks ve functional components
- **TypeScript**: Tip güvenliği ve geliştirici deneyimi
- **Material UI (MUI) 5.15.12**: Modern UI bileşenleri ve tema sistemi
- **React Router 6.22.3**: Client-side routing ve navigation
- **Axios 1.6.7**: HTTP client ve API entegrasyonu
- **Vite**: Hızlı build tool ve development server

### Frontend Authentication Mimarisi

```
ui/src/
├── contexts/
│   └── AuthContext.tsx          # Global authentication state
├── components/
│   └── ProtectedRoute.tsx       # Route-level protection
├── hooks/
│   └── usePermissions.ts        # Role-based permissions
├── pages/
│   ├── LoginPage.tsx           # Login interface
│   ├── AdminPage.tsx           # Admin panel
│   └── SessionManagement.tsx   # Session management
└── services/
    └── api.ts                  # API client configuration
```

### 1. AuthContext - Global Authentication State

AuthContext, uygulamanın global authentication state'ini yönetir:

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

**AuthProvider Implementation:**
```typescript
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedToken = localStorage.getItem('auth_token');
        if (savedToken) {
          setToken(savedToken);
          // Set axios default header
          axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;

          // Verify token and get user profile
          await refreshProfile();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear invalid token
        localStorage.removeItem('auth_token');
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setIsLoading(true);

      const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
      const { access_token, user: userData } = response.data;

      if (access_token && userData) {
        // Save token
        setToken(access_token);
        localStorage.setItem('auth_token', access_token);

        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

        // Set user data
        setUser(userData);

        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
};
```

### 2. ProtectedRoute - Route-Level Protection

ProtectedRoute component'i, sayfa seviyesinde authentication ve authorization kontrolü sağlar:

```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredPage?: keyof typeof PAGE_PERMISSIONS;
  showAccessDenied?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPage,
  showAccessDenied = false
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { hasRole, canAccessPage, getUserRoleDisplayName } = usePermissions();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  let hasAccess = true;

  if (requiredRole && !hasRole(requiredRole)) {
    hasAccess = false;
  }

  if (requiredPage && !canAccessPage(requiredPage)) {
    hasAccess = false;
  }

  // Show access denied page or redirect
  if (!hasAccess) {
    if (showAccessDenied) {
      return (
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="100vh" p={3}>
          <Alert severity="error" sx={{ mb: 3, maxWidth: 500, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Erişim Reddedildi</Typography>
            <Typography variant="body2" paragraph>Bu sayfaya erişim yetkiniz bulunmamaktadır.</Typography>
            <Typography variant="body2" color="text.secondary">
              Mevcut rolünüz: <strong>{getUserRoleDisplayName()}</strong>
            </Typography>
          </Alert>
          <Button variant="contained" onClick={() => window.history.back()} sx={{ borderRadius: 2 }}>
            Geri Dön
          </Button>
        </Box>
      );
    }

    // Redirect to dashboard by default
    return <Navigate to="/dashboard" replace />;
  }

  // Render children if authenticated and authorized
  return <>{children}</>;
};
```

### 3. usePermissions Hook - Role-Based Access Control

Bu hook, frontend'de rol bazlı erişim kontrolü sağlar:

```typescript
export const PAGE_PERMISSIONS = {
  DASHBOARD: ['staff', 'planner', 'manager', 'org_admin', 'super_admin'],
  ADMIN_PANEL: ['org_admin', 'super_admin'],
  DATASET_CONFIG: ['manager', 'org_admin', 'super_admin'],
  OPTIMIZATION_PARAMS: ['manager', 'org_admin', 'super_admin'],
  RESULTS: ['staff', 'planner', 'manager', 'org_admin', 'super_admin'],
  SCHEDULE_VIEW: ['staff', 'planner', 'manager', 'org_admin', 'super_admin'],
  SETTINGS: ['manager', 'org_admin', 'super_admin'],
  SESSION_MANAGEMENT: ['org_admin', 'super_admin'],
  AUDIT_LOGS: ['org_admin', 'super_admin'],
} as const;

export const usePermissions = () => {
  const { user } = useAuth();

  const hasRole = (requiredRole: string): boolean => {
    if (!user?.role?.name) return false;

    const userRoleLevel = ROLE_HIERARCHY[user.role.name] || 0;
    const requiredRoleLevel = ROLE_HIERARCHY[requiredRole] || 0;

    return userRoleLevel >= requiredRoleLevel;
  };

  const canAccessPage = (page: keyof typeof PAGE_PERMISSIONS): boolean => {
    if (!user?.role?.name) return false;

    const allowedRoles = PAGE_PERMISSIONS[page];
    return allowedRoles.includes(user.role.name);
  };

  const getUserRoleDisplayName = (): string => {
    return user?.role?.display_name || 'Bilinmiyor';
  };

  return {
    hasRole,
    canAccessPage,
    getUserRoleDisplayName,
    userRole: user?.role?.name,
    userRoleLevel: user?.role?.name ? ROLE_HIERARCHY[user.role.name] : 0,
  };
};
```

## Rol ve Yetki Sistemi

### RBAC (Role-Based Access Control) Modeli

Sistem, hiyerarşik rol yapısı ile kapsamlı yetki yönetimi sağlar:

```
Rol Hiyerarşisi (Seviye 5 → 1):
├── super_admin (5) - Sistem geneli yönetim
│   ├── Tüm sistem yetkilerine sahip
│   ├── Organizasyon yönetimi
│   └── Sistem konfigürasyonu
├── org_admin (4) - Kurum yönetimi
│   ├── Kurum içi tam yetki
│   ├── Kullanıcı yönetimi
│   └── Audit log erişimi
├── manager (3) - Departman yönetimi
│   ├── Optimizasyon parametreleri
│   ├── Sonuç analizi
│   └── Sistem ayarları
├── planner (2) - Optimizasyon işlemleri
│   ├── Vardiya planlama
│   ├── Sonuç görüntüleme
│   └── Dashboard erişimi
└── staff (1) - Temel kullanım
    ├── Dashboard görüntüleme
    ├── Sonuç görüntüleme
    └── Profil yönetimi
```

### Sayfa Erişim Matrisi

| Sayfa/İşlem | staff | planner | manager | org_admin | super_admin |
|-------------|-------|---------|---------|-----------|-------------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Results | ✅ | ✅ | ✅ | ✅ | ✅ |
| Schedule View | ✅ | ✅ | ✅ | ✅ | ✅ |
| Optimization Params | ❌ | ❌ | ✅ | ✅ | ✅ |
| Dataset Config | ❌ | ❌ | ✅ | ✅ | ✅ |
| Settings | ❌ | ❌ | ✅ | ✅ | ✅ |
| Admin Panel | ❌ | ❌ | ❌ | ✅ | ✅ |
| User Management | ❌ | ❌ | ❌ | ✅ | ✅ |
| Session Management | ❌ | ❌ | ❌ | ✅ | ✅ |
| Audit Logs | ❌ | ❌ | ❌ | ✅ | ✅ |
| System Settings | ❌ | ❌ | ❌ | ❌ | ✅ |

## Multi-Tenant Güvenlik

### Organization-Based Data Isolation

Sistem, multi-tenant mimari ile kurumlar arası veri izolasyonu sağlar:

**Veritabanı Seviyesi:**
- Her kullanıcı bir `organization_id` ile ilişkilendirilir
- Tüm veri sorguları organization_id ile filtrelenir
- Foreign key constraints ile veri bütünlüğü sağlanır

**API Seviyesi:**
- Middleware seviyesinde organization kontrolü
- Kullanıcı sadece kendi kurumunun verilerine erişebilir
- Cross-organization veri sızıntısı önlenir

**Frontend Seviyesi:**
- AuthContext'te organization bilgisi saklanır
- UI bileşenleri organization'a göre filtrelenir
- Navigation menüleri role göre dinamik olarak oluşturulur

### Güvenlik Kontrolleri

```python
# Backend organization access control
def check_organization_access(user, target_org_id: Optional[int] = None) -> bool:
    # Super admin her organizasyona erişebilir
    if user.role.name == 'super_admin':
        return True

    # Diğer kullanıcılar sadece kendi organizasyonlarına erişebilir
    if target_org_id is None:
        return True  # Kendi organizasyonu

    return user.organization_id == target_org_id
```

## API Endpoint Güvenliği

### Authentication Gereksinimleri

**Public Endpoints (Authentication gerektirmez):**
- `POST /auth/login` - Kullanıcı girişi
- `GET /health` - Sistem sağlık kontrolü

**Protected Endpoints (JWT token gerektirir):**
- Tüm diğer endpoint'ler authentication gerektirir
- Bearer token HTTP header'ında gönderilmelidir
- Token geçerliliği middleware seviyesinde kontrol edilir

### Role-Based Endpoint Access

```python
# Endpoint permissions mapping
ENDPOINT_PERMISSIONS = {
    # Authentication endpoints
    '/auth/logout': ['staff', 'planner', 'manager', 'org_admin', 'super_admin'],
    '/auth/profile': ['staff', 'planner', 'manager', 'org_admin', 'super_admin'],
    '/auth/register': ['org_admin', 'super_admin'],

    # Dashboard endpoints
    '/dashboard': ['staff', 'planner', 'manager', 'org_admin', 'super_admin'],

    # User management
    '/users': ['org_admin', 'super_admin'],
    '/users/create': ['org_admin', 'super_admin'],
    '/users/update': ['org_admin', 'super_admin'],
    '/users/delete': ['org_admin', 'super_admin'],

    # Admin operations
    '/admin': ['org_admin', 'super_admin'],
    '/audit-logs': ['org_admin', 'super_admin'],
    '/session-management': ['org_admin', 'super_admin'],

    # System settings
    '/settings': ['manager', 'org_admin', 'super_admin'],
    '/settings/system': ['org_admin', 'super_admin'],
}
```

## Session Management

### Özellikler

- **Dual-Layer Validation**: JWT + Database session kontrolü
- **Concurrent Session Limit**: Kullanıcı başına maksimum 2 aktif session
- **Automatic Cleanup**: Süresi dolmuş session'ların otomatik temizlenmesi
- **Admin Session Control**: Yönetici tarafından session sonlandırma
- **Real-time Session Tracking**: Aktif session'ların anlık takibi

### Session Lifecycle

```
1. Login Request → JWT Token Generation
2. Session Creation → Database record (UserSessions table)
3. Concurrent Check → Maximum 2 sessions per user
4. Old Session Cleanup → Revoke oldest sessions if limit exceeded
5. Session Validation → Every API request validates both JWT and DB session
6. Session Expiration → 24-hour automatic expiration
7. Manual Revocation → Admin or user logout
8. Automatic Cleanup → Periodic cleanup of expired sessions
```

## Audit Logging

### Loglanan İşlemler

**Authentication Events:**
- `login_success`, `login_failed` - Giriş işlemleri
- `logout`, `logout_all` - Çıkış işlemleri
- `session_revoked` - Session sonlandırma

**User Management Events:**
- `user_created`, `user_updated`, `user_deleted` - Kullanıcı CRUD işlemleri
- `user_status_changed`, `role_changed` - Durum ve rol değişiklikleri

**Security Events:**
- `password_changed`, `password_change_failed` - Şifre işlemleri
- `unauthorized_access` - Yetkisiz erişim denemeleri
- `admin_access` - Admin panel erişimleri

### Audit Log Yapısı

Her audit log şu bilgileri içerir:
- **Action**: İşlem türü (enum)
- **User**: İşlemi yapan kullanıcı
- **Target User**: İşlem yapılan kullanıcı (varsa)
- **Description**: İşlem açıklaması (Türkçe)
- **Details**: JSON formatında ek detaylar
- **IP Address**: İstek yapılan IP adresi
- **User Agent**: Tarayıcı bilgisi
- **Timestamp**: İşlem zamanı (UTC + Turkey timezone)
- **Success**: İşlem başarı durumu

## Güvenlik Özellikleri

### Token Güvenliği

- **JWT Secret Key**: 256-bit güçlü secret key
- **Token Expiration**: 24 saat geçerlilik süresi
- **JTI (JWT ID)**: Her token için benzersiz ID
- **Session Tracking**: Çift katmanlı doğrulama (JWT + DB)

### Password Güvenliği

- **bcrypt Hashing**: Endüstri standardı hash algoritması
- **Salt**: Her şifre için benzersiz salt
- **Cost Factor**: 12 round (4096 iterasyon)
- **UTF-8 Support**: Türkçe karakter desteği

### API Güvenliği

- **CORS Configuration**: Güvenli cross-origin yapılandırması
- **Input Validation**: Pydantic ile veri doğrulama
- **Error Handling**: Güvenli hata mesajları
- **Rate Limiting**: Brute force koruması (gelecek)

## Kullanım Kılavuzu

### Demo Kullanıcıları

```sql
-- Demo kullanıcılar (şifre: admin123)
INSERT INTO users (username, email, password_hash, first_name, last_name, organization_id, role_id) VALUES
('admin', 'admin@system.com', '$2b$12$...', 'Sistem', 'Yöneticisi', 1, 1),
('hastane_admin', 'admin@hastane.gov.tr', '$2b$12$...', 'Hastane', 'Müdürü', 1, 2),
('doktor1', 'doktor@hastane.gov.tr', '$2b$12$...', 'Dr. Ayşe', 'Kaya', 1, 5);
```

### API Endpoints

**Authentication:**
- `POST /auth/login` - Kullanıcı girişi
- `POST /auth/logout` - Çıkış
- `GET /auth/profile` - Profil bilgileri
- `POST /auth/register` - Yeni kullanıcı (admin only)
- `POST /auth/change-password` - Şifre değiştirme

**User Management:**
- `GET /api/users` - Kullanıcı listesi
- `POST /api/users` - Yeni kullanıcı
- `PUT /api/users/{id}` - Kullanıcı güncelleme
- `DELETE /api/users/{id}` - Kullanıcı silme

**Session Management:**
- `GET /auth/sessions` - Kullanıcı session'ları
- `GET /auth/sessions/all` - Tüm session'lar (admin)
- `DELETE /auth/sessions/{id}` - Session sonlandırma

**Audit Logs:**
- `GET /auth/audit-logs` - Audit log listesi
- `GET /auth/audit-logs/actions` - Action türleri
- `GET /auth/audit-logs/stats` - İstatistikler

### Troubleshooting

**401 Unauthorized:**
- Token geçersiz, yeniden giriş yapın
- localStorage'da `auth_token` anahtarını kontrol edin

**403 Forbidden:**
- Yetkiniz yok, rolünüzü kontrol edin

**Session Sorunları:**
- Maksimum 2 aktif session sınırı vardır
- Eski session'lar otomatik temizlenir

Bu authentication sistemi, modern web uygulaması standartlarında güvenli, ölçeklenebilir ve kullanıcı dostu bir çözüm sunmaktadır.

## Audit Logging

Bu bölüm, sistemin kapsamlı audit logging özelliklerini açıklar.

### Loglanan İşlemler

- **Authentication**: Login success/failed, logout, session revoked
- **User Management**: User created/updated/deleted/status changed
- **System Access**: Admin panel access, unauthorized attempts
- **Security Events**: Password changes, profile updates

### Audit Log Yapısı

Her audit log şu bilgileri içerir:
- **Action**: İşlem türü (enum)
- **User**: İşlemi yapan kullanıcı
- **Target User**: İşlem yapılan kullanıcı (varsa)
- **Description**: İşlem açıklaması
- **Details**: JSON formatında ek detaylar
- **IP Address**: İstek yapılan IP adresi
- **User Agent**: Tarayıcı bilgisi
- **Timestamp**: İşlem zamanı (UTC)
- **Success**: İşlem başarı durumu

### Frontend Audit Logs

```typescript
const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [filters, setFilters] = useState({
    action: '',
    success: '',
    user_id: '',
    days: 7
  });

  const formatDateTime = (dateString: string) => {
    try {
      const utcDate = parseISO(dateString + (dateString.includes('Z') ? '' : 'Z'));
      const turkeyTime = toZonedTime(utcDate, 'Europe/Istanbul');

      return formatTz(turkeyTime, 'dd.MM.yyyy HH:mm:ss', {
        timeZone: 'Europe/Istanbul',
        locale: tr
      });
    } catch {
      return 'Bilinmiyor';
    }
  };

  // İşlem türüne göre renk belirle
  const getActionColor = (action: string) => {
    const colorMap = {
      'login_success': 'success',
      'login_failed': 'error',
      'user_created': 'success',
      'user_deleted': 'error',
      'session_revoked': 'warning'
    };
    return colorMap[action] || 'default';
  };
};
```

**Frontend Audit Logs Özellikleri:**
- **Filtreleme**: İşlem türü, kullanıcı, başarı durumuna göre filtreleme
- **Sayfalama**: Büyük log dosyalarının sayfalama ile yönetimi
- **Timezone Desteği**: Türkiye saat dilimine göre tarih gösterimi
- **Renk Kodlaması**: İşlem türlerine göre görsel ayrım

## Güvenlik Özellikleri

### Token Güvenliği

- **JWT Secret Key**: 256-bit güçlü secret key
- **Token Expiration**: 24 saat geçerlilik süresi
- **JTI (JWT ID)**: Her token için benzersiz ID
- **Session Tracking**: Çift katmanlı doğrulama

### Password Güvenliği

- **bcrypt Hashing**: Endüstri standardı hash algoritması
- **Salt**: Her şifre için benzersiz salt
- **Cost Factor**: 12 round (4096 iterasyon)
- **Şifre Politikası**: Minimum uzunluk gereksinimleri

### Session Güvenliği

- **Session Invalidation**: Logout sırasında session deaktivasyonu
- **Automatic Cleanup**: Süresi dolmuş session'ların otomatik temizlenmesi
- **Concurrent Sessions**: Maksimum 2 aktif session sınırı
- **Session Hijacking Protection**: JTI kontrolü ile koruma

### API Güvenliği

- **CORS Configuration**: Güvenli cross-origin yapılandırması
- **Input Validation**: Pydantic ile veri doğrulama
- **Error Handling**: Güvenli hata mesajları
- **Rate Limiting**: Brute force koruması

## Teknik Sorunlar ve Çözümler

Bu bölüm, geliştirme sürecinde karşılaşılan teknik sorunları ve bunların çözümlerini açıklar.

### 1. Türkçe Karakter Sorunu

**Sorun**: Türkçe karakterler bozuk görünüyordu (ğ → Ã¤)

**Çözüm**:
- Backend: UTF-8 middleware eklendi
- Database: utf8mb4_unicode_ci charset'e çevrildi
- Frontend: Axios header'larına charset=utf-8 eklendi

```python
# Backend middleware
@app.middleware("http")
async def add_utf8_header(request: Request, call_next):
    response = await call_next(request)
    response.headers["Content-Type"] = "application/json; charset=utf-8"
    return response
```

### 2. Token Authentication Sorunu

**Sorun**: Frontend'de 401 Unauthorized hatası

**Çözüm**: localStorage anahtar uyumsuzluğu düzeltildi
- AuthContext: `auth_token` anahtarı kullanıyor
- auditService: `token` anahtarı kullanıyordu
- Tüm service'ler `auth_token` anahtarını kullanacak şekilde güncellendi

### 3. Timezone Sorunu

**Sorun**: 3 saat zaman farkı (UTC vs Turkey time)

**Çözüm**:
- Backend: UTC timezone bilgisi eklendi
- Frontend: date-fns-tz ile Turkey timezone desteği
- Tüm tarih gösterimleri Europe/Istanbul timezone'u kullanıyor

### 4. Session Yönetimi Sorunları

**Sorun**: Çoklu session'lar ve yanlış süre gösterimi

**Çözüm**:
- Maksimum 2 aktif session sınırı
- Otomatik eski session temizleme
- Doğru süre formatlaması (duration vs relative time)

### 5. JWT Error Handling

**Sorun**: `jwt.JWTError` yerine `jwt.PyJWTError` kullanılmalı

**Çözüm**: Exception handling güncellendi
```python
except jwt.PyJWTError:  # jwt.JWTError yerine
    return None
```

## Kullanım Kılavuzu

### Demo Kullanıcıları

```sql
-- Demo kullanıcılar (şifre: admin123)
INSERT INTO users (username, email, password_hash, first_name, last_name, organization_id, role_id) VALUES
('admin', 'admin@system.com', '$2b$12$...', 'Sistem', 'Yöneticisi', 1, 1),
('hastane_admin', 'admin@hastane.gov.tr', '$2b$12$...', 'Hastane', 'Müdürü', 1, 2),
('doktor1', 'doktor@hastane.gov.tr', '$2b$12$...', 'Dr. Ayşe', 'Kaya', 1, 5);
```

### Giriş Yapma

1. `http://localhost:5173/login` adresine gidin
2. Username ve password girin
3. Başarılı girişte dashboard'a yönlendirilirsiniz
4. Token otomatik olarak localStorage'a kaydedilir

### Admin Panel Özellikleri

**Kullanıcı Yönetimi**:
- Yeni kullanıcı ekleme
- Kullanıcı bilgilerini düzenleme
- Kullanıcı durumunu değiştirme (aktif/pasif)
- Kullanıcı silme

**Session Yönetimi**:
- Aktif session'ları görüntüleme
- Session'ları sonlandırma
- Session istatistikleri
- Kullanıcı bazlı session takibi

**Audit Logs**:
- Tüm sistem işlemlerini görüntüleme
- Filtreleme (action, user, success, time range)
- Detaylı log bilgileri
- İstatistiksel raporlar

### Troubleshooting

**Token Süresi Doldu**:
- Sayfa yenileyin, otomatik login'e yönlendirilirsiniz

**401 Unauthorized**:
- Token geçersiz, yeniden giriş yapın
- localStorage'da `auth_token` anahtarını kontrol edin

**403 Forbidden**:
- Yetkiniz yok, rolünüzü kontrol edin

**Türkçe Karakter Sorunu**:
- Tarayıcı cache'ini temizleyin
- UTF-8 encoding kontrol edin

**Session Sorunları**:
- Maksimum 2 aktif session sınırı vardır
- Eski session'lar otomatik temizlenir

### API Endpoints

**Authentication**:
- `POST /auth/login` - Kullanıcı girişi
- `POST /auth/logout` - Çıkış
- `GET /auth/profile` - Profil bilgileri

**Session Management**:
- `GET /auth/sessions` - Kullanıcı session'ları
- `GET /auth/sessions/all` - Tüm session'lar (admin)
- `DELETE /auth/sessions/{id}` - Session sonlandırma

**Audit Logs**:
- `GET /auth/audit-logs` - Audit log listesi
- `GET /auth/audit-logs/actions` - Action türleri
- `GET /auth/audit-logs/stats` - İstatistikler

**User Management**:
- `GET /auth/users` - Kullanıcı listesi
- `POST /auth/register` - Yeni kullanıcı
- `PUT /auth/users/{id}` - Kullanıcı güncelleme
- `DELETE /auth/users/{id}` - Kullanıcı silme