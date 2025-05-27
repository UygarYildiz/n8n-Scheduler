# Veri Modeli ve Arayüzler

Bu belge, Kurumsal Optimizasyon ve Otomasyon Çözümü'nün kapsamlı veri modelini açıklar. Sistem, multi-tenant mimari ile SQLAlchemy database modelleri, Pydantic API schemas, React TypeScript interfaces ve CSV veri formatlarını kullanır.

## İçindekiler

1. [Database Veri Modelleri](#database-veri-modelleri)
2. [API Veri Modelleri (Pydantic)](#api-veri-modelleri-pydantic)
3. [Frontend Type Definitions (TypeScript)](#frontend-type-definitions-typescript)
4. [CSV Veri Formatları](#csv-veri-formatları)
5. [n8n Webhook Formatları](#n8n-webhook-formatları)
6. [JSON API Request/Response Formatları](#json-api-requestresponse-formatları)
7. [Optimizasyon Input/Output Modelleri](#optimizasyon-inputoutput-modelleri)
8. [Multi-Tenant Veri Yapısı](#multi-tenant-veri-yapısı)

## Database Veri Modelleri

### SQLAlchemy Modelleri

Sistem, MySQL veritabanında aşağıdaki ana tabloları kullanır:

#### Organizations Tablosu

```python
class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    type = Column(Enum(OrganizationType), nullable=False)  # hastane, cagri_merkezi, diger
    description = Column(Text)
    config_file = Column(String(255))  # YAML konfigürasyon dosyası referansı
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # İlişkiler
    users = relationship("User", back_populates="organization")
```

**SQL Schema:**
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

#### Roles Tablosu

```python
class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)  # super_admin, org_admin, manager, planner, staff
    display_name = Column(String(255), nullable=False)
    description = Column(Text)
    permissions = Column(JSON)  # JSON array of permissions
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # İlişkiler
    users = relationship("User", back_populates="role")
```

**Varsayılan Roller:**
```sql
INSERT INTO roles (name, display_name, description, permissions) VALUES
('super_admin', 'Süper Yönetici', 'Tüm sistem yetkilerine sahip', JSON_ARRAY('*')),
('org_admin', 'Kurum Yöneticisi', 'Kurum içi tüm yetkiler', JSON_ARRAY('org.*', 'users.*', 'optimization.*')),
('manager', 'Vardiya Yöneticisi', 'Vardiya planlama ve yönetim', JSON_ARRAY('optimization.*', 'schedules.*')),
('planner', 'Planlamacı', 'Vardiya planlama', JSON_ARRAY('optimization.read', 'optimization.create')),
('staff', 'Personel', 'Sadece kendi bilgilerini görüntüleme', JSON_ARRAY('profile.read', 'schedules.read.own'));
```

#### Users Tablosu

```python
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)  # bcrypt hash
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    role_id = Column(Integer, ForeignKey("roles.id"))
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # İlişkiler
    organization = relationship("Organization", back_populates="users")
    role = relationship("Role", back_populates="users")
    sessions = relationship("UserSession", back_populates="user")
```

**SQL Schema:**
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
    INDEX idx_users_active (is_active)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### UserSessions Tablosu

```python
class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token_jti = Column(String(255), unique=True, nullable=False, index=True)  # JWT ID
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_revoked = Column(Boolean, default=False)

    # İlişkiler
    user = relationship("User", back_populates="sessions")
```

**SQL Schema:**
```sql
CREATE TABLE user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_jti VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_revoked BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_user_sessions_token_jti (token_jti),
    INDEX idx_user_sessions_user_id (user_id),
    INDEX idx_user_sessions_expires_at (expires_at),
    INDEX idx_user_sessions_active (is_revoked, expires_at)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### AuditLogs Tablosu

```python
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(Enum(AuditAction), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Nullable for failed logins
    target_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # For admin actions
    description = Column(Text, nullable=False)
    details = Column(JSON, nullable=True)  # Additional structured data
    ip_address = Column(String(45), nullable=True)  # IPv4/IPv6 support
    user_agent = Column(Text, nullable=True)
    success = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
```

**Audit Actions Enum:**
```python
class AuditAction(str, enum.Enum):
    # Authentication actions
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILED = "login_failed"
    LOGOUT = "logout"
    LOGOUT_ALL = "logout_all"
    SESSION_REVOKED = "session_revoked"

    # User management actions
    USER_CREATED = "user_created"
    USER_UPDATED = "user_updated"
    USER_DELETED = "user_deleted"
    USER_STATUS_CHANGED = "user_status_changed"

    # System actions
    PASSWORD_CHANGED = "password_changed"
    PROFILE_UPDATED = "profile_updated"
    ADMIN_ACCESS = "admin_access"
```

### Database Relationships

```
Organizations (1) ←→ (N) Users
Roles (1) ←→ (N) Users
Users (1) ←→ (N) UserSessions
Users (1) ←→ (N) AuditLogs (as user_id)
Users (1) ←→ (N) AuditLogs (as target_user_id)
```

## API Veri Modelleri (Pydantic)

### Authentication API Models

#### Login Models

```python
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Dict[str, Any]

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    first_name: str
    last_name: str
    full_name: str
    organization: Optional[Dict[str, Any]] = None
    role: Optional[Dict[str, Any]] = None
    is_active: bool
    last_login: Optional[str] = None
    created_at: Optional[str] = None
```

#### User Management Models

```python
class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    organization_id: Optional[int] = None
    role_id: Optional[int] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class MessageResponse(BaseModel):
    message: str
    success: bool = True
```

### Dashboard API Models

```python
class PerformanceMetrics(BaseModel):
    understaffing: int = 0
    overstaffing: int = 0
    coverageRatio: int = 0
    skillCoverage: int = 0
    preferenceScore: int = 0
    workloadBalance: int = 0
    coverageRatioChange: Optional[str] = None  # "+5%" veya "-2%"
    skillCoverageChange: Optional[str] = None
    preferenceScoreChange: Optional[str] = None
    workloadBalanceChange: Optional[str] = None

class LastOptimizationReport(BaseModel):
    status: str = ""
    statusColor: str = "success.main"
    summaryText: str = ""
    processingTime: str = ""
    objectiveValue: float = 0
    assignmentsCount: int = 0
    date: str = ""

class SystemStatus(BaseModel):
    apiStatus: str = "Çevrimiçi"
    apiStatusColor: str = "success.main"
    databaseStatus: str = "Bağlı"
    databaseStatusColor: str = "success.main"
    n8nStatus: str = "Aktif"
    n8nStatusColor: str = "success.main"
    lastHealthCheck: str = ""

class RecentActivity(BaseModel):
    id: str
    type: str
    description: str
    timestamp: str
    status: str = "success"

class DashboardData(BaseModel):
    performanceMetrics: PerformanceMetrics = Field(default_factory=PerformanceMetrics)
    lastOptimizationReport: LastOptimizationReport = Field(default_factory=LastOptimizationReport)
    systemStatus: SystemStatus = Field(default_factory=SystemStatus)
    recentActivities: List[RecentActivity] = Field(default_factory=list)
```

### Configuration Management Models

```python
class Dataset(BaseModel):
    id: str
    name: str
    path: Optional[str] = None

class Configuration(BaseModel):
    id: str
    name: str
    path: Optional[str] = None

class ConfigurationContent(BaseModel):
    content: str
```

### Optimization API Models

```python
class Employee(BaseModel):
    employee_id: str
    name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    specialty: Optional[str] = None

class Shift(BaseModel):
    shift_id: str
    name: Optional[str] = None
    date: date
    start_time: dt_time  # "08:00:00"
    end_time: dt_time    # "16:00:00"
    required_staff: int = Field(default=1, ge=0)
    department: Optional[str] = None

class Skill(BaseModel):
    employee_id: str
    skill: str

class Availability(BaseModel):
    employee_id: str
    date: date
    is_available: bool = True

class Preference(BaseModel):
    employee_id: str
    shift_id: str
    preference_score: int = Field(default=0)

class InputData(BaseModel):
    employees: List[Employee] = Field(default_factory=list)
    shifts: List[Shift] = Field(default_factory=list)
    skills: List[Skill] = Field(default_factory=list)
    availability: List[Availability] = Field(default_factory=list)
    preferences: List[Preference] = Field(default_factory=list)

class OptimizationRequest(BaseModel):
    configuration_ref: Optional[str] = None  # "hospital_test_config.yaml"
    configuration: Optional[Dict[str, Any]] = None
    input_data: InputData

class Assignment(BaseModel):
    employee_id: str
    shift_id: str
    date: Optional[str] = None

class OptimizationSolution(BaseModel):
    assignments: List[Assignment] = Field(default_factory=list)

class MetricsOutput(BaseModel):
    total_understaffing: Optional[int] = None
    total_overstaffing: Optional[int] = None
    min_staffing_coverage_ratio: Optional[float] = None
    skill_coverage_ratio: Optional[float] = None
    positive_preferences_met_count: Optional[int] = None
    negative_preferences_assigned_count: Optional[int] = None
    total_preference_score_achieved: Optional[int] = None
    workload_distribution_std_dev: Optional[float] = None
    bad_shift_distribution_std_dev: Optional[float] = None
    system_adaptability_score: Optional[float] = None
    config_complexity_score: Optional[float] = None
    rule_count: Optional[int] = None

class OptimizationResponse(BaseModel):
    status: str  # "OPTIMAL", "FEASIBLE", "INFEASIBLE", "MODEL_INVALID", "ERROR"
    solver_status_message: Optional[str] = None
    processing_time_seconds: Optional[float] = None
    objective_value: Optional[float] = None
    solution: Optional[OptimizationSolution] = None
    metrics: Optional[MetricsOutput] = None
    error_details: Optional[str] = None
```

## Frontend Type Definitions (TypeScript)

### Core Data Types

```typescript
// ui/src/types/index.ts

// Çalışan tipi
export interface Employee {
  employee_id: string;
  name?: string;
  role?: string;
  department?: string;
  specialty?: string;
}

// Vardiya tipi
export interface Shift {
  shift_id: string;
  name?: string;
  date: string;
  start_time: string;
  end_time: string;
  required_staff?: number;
  department?: string;
}

// Yetenek tipi
export interface Skill {
  employee_id: string;
  skill: string;
}

// Uygunluk tipi
export interface Availability {
  employee_id: string;
  date: string;
  is_available: boolean;
}

// Tercih tipi
export interface Preference {
  employee_id: string;
  shift_id: string;
  preference_score: number;
}

// Girdi verisi tipi
export interface InputData {
  employees: Employee[];
  shifts: Shift[];
  skills: Skill[];
  availability: Availability[];
  preferences: Preference[];
}
```

### Authentication Types

```typescript
// Authentication interfaces
export interface LoginCredentials {
  username: string;
  password: string;
}

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

### Optimization Types

```typescript
// Optimizasyon isteği tipi
export interface OptimizationRequest {
  configuration_ref?: string;
  configuration?: Record<string, any>;
  input_data: InputData;
}

// Atama tipi
export interface Assignment {
  employee_id: string;
  shift_id: string;
  date?: string;
}

// Optimizasyon çözümü tipi
export interface OptimizationSolution {
  assignments: Assignment[];
}

// Metrikler tipi
export interface MetricsOutput {
  total_understaffing?: number;
  total_overstaffing?: number;
  min_staffing_coverage_ratio?: number;
  skill_coverage_ratio?: number;
  positive_preferences_met_count?: number;
  negative_preferences_assigned_count?: number;
  total_preference_score_achieved?: number;
  workload_distribution_std_dev?: number;
  bad_shift_distribution_std_dev?: number;
  system_adaptability_score?: number;
  config_complexity_score?: number;
  rule_count?: number;
}

// Optimizasyon yanıtı tipi
export interface OptimizationResponse {
  status: string;
  solver_status_message?: string;
  processing_time_seconds?: number;
  objective_value?: number;
  solution?: OptimizationSolution;
  metrics?: MetricsOutput;
  error_details?: string;
}
```

### Configuration Types

```typescript
// Veri seti tipi
export interface Dataset {
  id: string;
  name: string;
  path: string;
}

// Konfigürasyon dosyası tipi
export interface ConfigurationFile {
  id: string;
  name: string;
  path: string;
}

// API ayarları tipi
export interface ApiSettings {
  apiUrl: string;
  n8nUrl: string;
  webhookId: string;
}
```

## CSV Veri Formatları

### Hastane Veri Seti

Sistem iki farklı veri seti kullanır: Hastane ve Çağrı Merkezi. Her ikisi de aynı CSV yapısını kullanır ancak içerik kuruma özgüdür.

#### employees.csv (Hastane)

```csv
employee_id,name,role,department,specialty
E001,Dr. Ayşe Kaya,Doktor,Acil,Acil Tıp
E002,Hemşire Mehmet Yılmaz,Hemşire,Acil,
E003,Dr. Fatma Demir,Doktor,Kardiyoloji,Kardiyoloji
E004,Teknisyen Ali Özkan,Teknisyen,Radyoloji,
E005,Hemşire Zeynep Şahin,Hemşire,Yoğun Bakım,Yoğun Bakım
```

#### shifts.csv (Hastane)

```csv
shift_id,name,date,start_time,end_time,required_staff,department
S0001,Gündüz Hafta İçi Acil,2025-01-20,08:00:00,16:00:00,3,Acil
S0002,Gece Hafta İçi Acil,2025-01-20,00:00:00,08:00:00,2,Acil
S0003,Gündüz Hafta İçi Kardiyoloji,2025-01-20,08:00:00,16:00:00,2,Kardiyoloji
S0004,Gündüz Hafta Sonu Acil,2025-01-25,08:00:00,16:00:00,2,Acil
S0005,Gece Hafta İçi Yoğun Bakım,2025-01-20,00:00:00,08:00:00,3,Yoğun Bakım
```

#### skills.csv (Hastane)

```csv
employee_id,skill
E001,Acil Servis Deneyimi
E001,İlk Yardım Sertifikası
E002,Temel Hasta Bakımı
E003,Kardiyoloji Uzmanlığı
E005,Yoğun Bakım Sertifikası
E005,Entübasyon Yeteneği
```

#### availability.csv (Hastane)

```csv
employee_id,date,is_available
E001,2025-01-20,true
E001,2025-01-21,false
E002,2025-01-20,true
E003,2025-01-20,true
E004,2025-01-20,false
E005,2025-01-20,true
```

#### preferences.csv (Hastane)

```csv
employee_id,shift_id,preference_score
E001,S0001,1
E001,S0002,-1
E002,S0001,1
E003,S0003,2
E005,S0005,1
```

### Çağrı Merkezi Veri Seti

Çağrı merkezi veri seti aynı yapıyı kullanır ancak dosya adları `_cm` suffix'i ile biter:

#### employees_cm.csv (Çağrı Merkezi)

```csv
employee_id,name,role,department,specialty
CM_E001,Ahmet Yılmaz,Temsilci,Müşteri Hizmetleri,
CM_E002,Ayşe Demir,Uzman Temsilci,Teknik Destek,Teknik Bilgi
CM_E003,Mehmet Kaya,Süpervizör,Yönetim,Liderlik
CM_E004,Fatma Özkan,Temsilci,Müşteri Hizmetleri,Çoklu Dil
CM_E005,Ali Şahin,Uzman Temsilci,Satış,Satış Deneyimi
```

**Dosya Adlandırma Kuralları:**
- Hastane: `employees.csv`, `shifts.csv`, `skills.csv`, `availability.csv`, `preferences.csv`
- Çağrı Merkezi: `employees_cm.csv`, `shifts_cm.csv`, `skills_cm.csv`, `availability_cm.csv`, `preferences_cm.csv`

**Dosya Konumları:**
```
veri_kaynaklari/
├── hastane/
│   ├── employees.csv
│   ├── shifts.csv
│   ├── availability.csv
│   ├── preferences.csv
│   └── skills.csv
└── cagri_merkezi/
    ├── employees_cm.csv
    ├── shifts_cm.csv
    ├── availability_cm.csv
    ├── preferences_cm.csv
    └── skills_cm.csv
```

## n8n Webhook Formatları

### Webhook Request Format

n8n workflow'u, webhook parametreleri ile dinamik konfigürasyon seçimi yapar:

#### Webhook URL

```
http://localhost:5678/webhook/[webhook-id]?veriSeti=hastane&kurallar=temel_kurallar
```

**Query Parameters:**
- `veriSeti`: Veri seti seçimi (`hastane`, `cagri_merkezi`)
- `kurallar`: Kural seti adı (`temel_kurallar`)

#### n8n Internal Data Structure

```javascript
// n8n Code düğümünde kullanılan veri yapısı
const upstreamNodeOutput = {
  veriSeti: "hastane",  // veya "cagri_merkezi"
  kurallar: "temel_kurallar"
};

// aktif_ayarlar.json dosyasından okunan varsayılan değerler
const aktifAyarlar = {
  varsayilan_veri_seti: "hastane",
  varsayilan_kural_seti_adi: "temel_kurallar"
};

// Nihai konfigürasyon seçimi
const nihaiVeriSeti = upstreamNodeOutput.veriSeti || aktifAyarlar.varsayilan_veri_seti;
const nihaiKurallar = upstreamNodeOutput.kurallar || aktifAyarlar.varsayilan_kural_seti_adi;
```

### Optimization API Request (n8n → FastAPI)

```json
{
  "configuration_ref": "hospital_test_config.yaml",
  "input_data": {
    "employees": [
      {
        "employee_id": "E001",
        "name": "Dr. Ayşe Kaya",
        "role": "Doktor",
        "department": "Acil",
        "specialty": "Acil Tıp"
      }
    ],
    "shifts": [
      {
        "shift_id": "S0001",
        "name": "Gündüz Hafta İçi Acil",
        "date": "2025-01-20",
        "start_time": "08:00:00",
        "end_time": "16:00:00",
        "required_staff": 3,
        "department": "Acil"
      }
    ],
    "skills": [
      {
        "employee_id": "E001",
        "skill": "Acil Servis Deneyimi"
      }
    ],
    "availability": [
      {
        "employee_id": "E001",
        "date": "2025-01-20",
        "is_available": true
      }
    ],
    "preferences": [
      {
        "employee_id": "E001",
        "shift_id": "S0001",
        "preference_score": 1
      }
    ]
  }
}
```

### Optimization API Response (FastAPI → n8n)

```json
{
  "status": "OPTIMAL",
  "solver_status_message": "Optimal solution found",
  "processing_time_seconds": 2.45,
  "objective_value": 15.0,
  "solution": {
    "assignments": [
      {
        "employee_id": "E001",
        "shift_id": "S0001",
        "date": "2025-01-20"
      },
      {
        "employee_id": "E002",
        "shift_id": "S0002",
        "date": "2025-01-20"
      }
    ]
  },
  "metrics": {
    "total_understaffing": 0,
    "total_overstaffing": 1,
    "min_staffing_coverage_ratio": 1.0,
    "skill_coverage_ratio": 0.95,
    "positive_preferences_met_count": 8,
    "negative_preferences_assigned_count": 1,
    "total_preference_score_achieved": 12,
    "workload_distribution_std_dev": 0.5,
    "bad_shift_distribution_std_dev": 0.3,
    "system_adaptability_score": 0.85,
    "config_complexity_score": 0.7,
    "rule_count": 15
  }
}
```

## JSON API Request/Response Formatları

### Authentication API

#### Login Request

```json
POST /auth/login
{
  "username": "admin",
  "password": "admin123"
}
```

#### Login Response

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400,
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@system.com",
    "first_name": "Sistem",
    "last_name": "Yöneticisi",
    "full_name": "Sistem Yöneticisi",
    "is_active": true,
    "organization": {
      "id": 1,
      "name": "Demo Hastane",
      "type": "hastane"
    },
    "role": {
      "id": 1,
      "name": "super_admin",
      "display_name": "Süper Yönetici"
    }
  }
}
```

### Dashboard API

#### Dashboard Data Request

```json
GET /api/dashboard
Authorization: Bearer <jwt_token>
```

#### Dashboard Data Response

```json
{
  "performanceMetrics": {
    "understaffing": 2,
    "overstaffing": 1,
    "coverageRatio": 95,
    "skillCoverage": 88,
    "preferenceScore": 75,
    "workloadBalance": 82,
    "coverageRatioChange": "+5%",
    "skillCoverageChange": "-2%",
    "preferenceScoreChange": "+8%",
    "workloadBalanceChange": "+3%"
  },
  "lastOptimizationReport": {
    "status": "Başarılı",
    "statusColor": "success.main",
    "summaryText": "Son optimizasyon 15 çalışan için 42 vardiya ataması gerçekleştirdi.",
    "processingTime": "2.45 saniye",
    "objectiveValue": 15.0,
    "assignmentsCount": 42,
    "date": "2025-01-20 14:30:00"
  },
  "systemStatus": {
    "apiStatus": "Çevrimiçi",
    "apiStatusColor": "success.main",
    "databaseStatus": "Bağlı",
    "databaseStatusColor": "success.main",
    "n8nStatus": "Aktif",
    "n8nStatusColor": "success.main",
    "lastHealthCheck": "2025-01-20 14:35:00"
  },
  "recentActivities": [
    {
      "id": "1",
      "type": "optimization",
      "description": "Hastane vardiya optimizasyonu tamamlandı",
      "timestamp": "2025-01-20 14:30:00",
      "status": "success"
    }
  ]
}
```

### Configuration Management API

#### Get Configurations

```json
GET /api/configurations
Authorization: Bearer <jwt_token>

Response:
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

#### Update Configuration

```json
POST /api/configuration-content
Authorization: Bearer <jwt_token>
Content-Type: application/x-www-form-urlencoded

configId=hospital_test_config.yaml&content=<yaml_content>

Response:
{
  "status": "success",
  "message": "hospital_test_config.yaml konfigürasyonu başarıyla güncellendi"
}
```

## Multi-Tenant Veri Yapısı

### Organization-Based Data Isolation

Sistem, multi-tenant mimari ile kurumlar arası veri izolasyonu sağlar:

```sql
-- Her kullanıcı bir organization_id ile ilişkilendirilir
SELECT u.*, o.name as organization_name, r.display_name as role_name
FROM users u
JOIN organizations o ON u.organization_id = o.id
JOIN roles r ON u.role_id = r.id
WHERE u.organization_id = ? AND u.is_active = TRUE;

-- Audit loglar organization bazında filtrelenir
SELECT al.*, u.username, tu.username as target_username
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
LEFT JOIN users tu ON al.target_user_id = tu.id
WHERE u.organization_id = ? OR tu.organization_id = ?
ORDER BY al.created_at DESC;
```

### Data Access Patterns

**Organization Scoped Queries:**
- Kullanıcılar sadece kendi kurumlarının verilerine erişebilir
- Super admin tüm kurumlara erişim hakkına sahiptir
- API endpoint'leri organization_id ile filtrelenir

**Configuration Isolation:**
- Her kurum kendi YAML konfigürasyon dosyasına sahiptir
- Database'de Organizations.config_file alanı ile referans edilir
- CSV veri dosyaları kurum bazında ayrı klasörlerde saklanır

Bu kapsamlı veri modeli, sistemin tüm katmanlarında tutarlı ve güvenli veri yönetimi sağlar.