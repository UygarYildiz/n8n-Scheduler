# Authentication ve Authorization Sistemi

Bu dokümantasyon, Kurumsal Optimizasyon ve Otomasyon Çözümü'nün kimlik doğrulama ve yetkilendirme sisteminin nasıl çalıştığını ve nasıl oluşturulduğunu açıklar. Sistem, modern web uygulamalarında kullanılan JWT token tabanlı kimlik doğrulama ile rol bazlı yetkilendirme (RBAC) modelini birleştirerek güvenli ve ölçeklenebilir bir çözüm sunar.

## İçindekiler

1. [Sistem Genel Bakış](#sistem-genel-bakış)
2. [Veritabanı Yapısı](#veritabanı-yapısı)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Rol ve Yetki Sistemi](#rol-ve-yetki-sistemi)
6. [Güvenlik Özellikleri](#güvenlik-özellikleri)
7. [Kullanım Kılavuzu](#kullanım-kılavuzu)

## Sistem Genel Bakış

Bu bölüm, authentication sisteminin temel işleyişini ve mimarisini açıklar. Sistem, kullanıcıların kimlik doğrulaması ve yetkilendirmesi için modern, güvenli ve kullanıcı dostu bir yaklaşım benimser.

### Ne Yapar?

Authentication sistemi, kullanıcıların sisteme güvenli bir şekilde giriş yapmasını ve yetkilerine göre farklı sayfalara/işlemlere erişmesini sağlar. Bu sistem, özellikle çok kullanıcılı kurumsal ortamlarda farklı yetki seviyelerine sahip personelin aynı platform üzerinde güvenli bir şekilde çalışabilmesini mümkün kılar.

### Temel Özellikler

Sistemin sunduğu ana özellikler şunlardır:

- **JWT Token Tabanlı Kimlik Doğrulama**: Kullanıcı giriş yaptığında güvenli bir JWT token alır. Bu token, kullanıcının kimliğini ve yetkilerini içerir ve her API isteğinde kullanılır.

- **Rol Bazlı Yetki Sistemi (RBAC)**: 5 farklı rol seviyesi bulunur (Super Admin, Org Admin, Manager, Planner, Staff). Her rol, belirli sayfalara ve işlemlere erişim yetkisine sahiptir.

- **Çok Kiracılı (Multi-Tenant) Yapı**: Farklı kurumlar (hastane, çağrı merkezi) aynı sistem üzerinde çalışabilir. Her kurum kendi verilerine erişir ve diğer kurumların verilerini göremez.

- **Session Takibi**: Token'ların geçerliliği sadece JWT içindeki süre ile değil, aynı zamanda veritabanındaki session kayıtları ile de kontrol edilir. Bu, güvenlik açısından çift katmanlı koruma sağlar.

- **Otomatik Logout**: Token süresi dolduğunda veya güvenlik ihlali durumunda kullanıcı otomatik olarak sistemden çıkarılır.

### Nasıl Çalışır?

Sistemin çalışma akışı şu adımları takip eder:

1. **Giriş Süreci**: Kullanıcı username ve password ile giriş yapar. Backend bu bilgileri doğrular.

2. **Token Oluşturma**: Başarılı girişte backend bir JWT token oluşturur ve veritabanına session kaydı yapar. Bu token kullanıcının kimlik bilgilerini ve yetkilerini içerir.

3. **Token Saklama**: Frontend bu token'ı tarayıcının localStorage'ında güvenli bir şekilde saklar.

4. **API İstekleri**: Her API isteğinde token HTTP header'ında gönderilir ve backend tarafından doğrulanır.

5. **Yetki Kontrolü**: Sayfa erişimleri ve işlem yetkileri kullanıcının rolüne göre kontrol edilir. Yetkisiz erişim denemeleri engellenir.

## Veritabanı Yapısı

Bu bölüm, authentication sisteminin temelini oluşturan veritabanı tablolarını ve aralarındaki ilişkileri açıklar. Sistem, MySQL 8.0 veritabanı kullanarak kullanıcı bilgilerini, rolleri, kurumları ve oturum bilgilerini güvenli bir şekilde saklar.

### Organizations Tablosu

Bu tablo, sistemde kayıtlı olan kurumları (hastane, çağrı merkezi vb.) saklar. Çok kiracılı yapının temelini oluşturur ve her kullanıcının hangi kuruma ait olduğunu belirler.

```sql
CREATE TABLE organizations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    type ENUM('hastane', 'cagri_merkezi') NOT NULL,
    description TEXT,
    config_file VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Roles Tablosu

Bu tablo, sistemdeki tüm rolleri ve bunların yetkilerini saklar. RBAC (Role-Based Access Control) modelinin temelini oluşturur. Her rol, belirli sayfalara ve işlemlere erişim yetkisine sahiptir.

```sql
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Tablo Alanları Açıklaması:**
- `name`: Sistemde kullanılan rol adı (örn: super_admin)
- `display_name`: Kullanıcı arayüzünde gösterilen rol adı (örn: Sistem Yöneticisi)
- `permissions`: JSON formatında rol yetkilerini saklar
- `is_active`: Rolün aktif olup olmadığını belirler

**Varsayılan Roller:**
- `super_admin` - Sistem Yöneticisi (Seviye 5): Tüm sistem yetkilerine sahip
- `org_admin` - Kurum Yöneticisi (Seviye 4): Kurum içi tam yetki
- `manager` - Departman Müdürü (Seviye 3): Departman yönetimi yetkisi
- `planner` - Vardiya Planlayıcısı (Seviye 2): Planlama işlemleri yetkisi
- `staff` - Personel (Seviye 1): Temel kullanıcı yetkisi

### Users Tablosu

Bu tablo, sistemdeki tüm kullanıcıların bilgilerini saklar. Her kullanıcı bir kuruma ve bir role bağlıdır. Şifreler güvenli bir şekilde hash'lenerek saklanır.

```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    organization_id INT,
    role_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);
```

**Önemli Alanlar:**
- `password_hash`: Şifre bcrypt algoritması ile hash'lenerek saklanır, asla düz metin olarak tutulmaz
- `organization_id`: Kullanıcının hangi kuruma ait olduğunu belirler (çok kiracılı yapı için)
- `role_id`: Kullanıcının rolünü ve yetkilerini belirler
- `last_login`: Güvenlik takibi için son giriş zamanını saklar
- `is_active`: Kullanıcının aktif olup olmadığını kontrol eder

### User Sessions Tablosu

Bu tablo, aktif kullanıcı oturumlarını takip eder. JWT token'ların geçerliliğini kontrol etmek ve güvenlik ihlali durumunda oturumları sonlandırmak için kullanılır.

```sql
CREATE TABLE user_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    jti VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Session Tablosu Alanları:**
- `jti`: JWT Token ID - her token için benzersiz tanımlayıcı
- `expires_at`: Token'ın geçerlilik süresi
- `is_active`: Oturumun aktif olup olmadığını belirler (logout durumunda false yapılır)

Bu tablo sayesinde, bir kullanıcının token'ı çalınsa bile, admin tarafından o kullanıcının tüm oturumları sonlandırılabilir.

## Backend Implementation

Bu bölüm, authentication sisteminin backend tarafındaki implementasyonunu detaylı olarak açıklar. Backend, FastAPI framework'ü kullanılarak geliştirilmiş olup, modern Python web geliştirme standartlarını takip eder.

### Dosya Yapısı

Backend authentication sistemi modüler bir yapıda organize edilmiştir:

```
optimization_core/
├── auth_api.py          # Authentication API endpoints (giriş, çıkış, profil)
├── auth_utils.py        # JWT ve password utilities (token oluşturma, doğrulama)
├── auth_middleware.py   # Yetki kontrol middleware (route koruması)
└── models.py           # Database modelleri (SQLAlchemy ORM)
```

Her dosya belirli bir sorumluluğa sahiptir ve sistem genelinde yeniden kullanılabilir fonksiyonlar sunar.

### JWT Token Sistemi (`auth_utils.py`)

Bu dosya, JWT token'ların oluşturulması, doğrulanması ve password güvenliği ile ilgili tüm utility fonksiyonlarını içerir. JWT (JSON Web Token), kullanıcı kimlik bilgilerini güvenli bir şekilde taşımak için kullanılan endüstri standardı bir yöntemdir.

#### Token Oluşturma

Bu fonksiyon, kullanıcı başarılı giriş yaptığında çağrılır ve güvenli bir JWT token oluşturur:

```python
def create_access_token(data: dict) -> Tuple[str, str, datetime]:
    """JWT access token oluşturur"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    jti = str(uuid.uuid4())  # Benzersiz token ID
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "jti": jti
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt, jti, expire
```

**Fonksiyon Açıklaması:**
- `data`: Kullanıcı bilgilerini içeren dictionary (user_id, username, role vb.)
- `expire`: Token'ın geçerlilik süresi (varsayılan 24 saat)
- `jti`: JWT ID - her token için benzersiz tanımlayıcı, session takibi için kullanılır
- `iat`: Token'ın oluşturulma zamanı
- Fonksiyon, token string'i, jti ve expire zamanını döndürür

#### Token Doğrulama

Bu fonksiyon, her API isteğinde gelen token'ın geçerliliğini kontrol eder:

```python
def verify_token(token: str) -> Optional[dict]:
    """JWT token'ı doğrular"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except ExpiredSignatureError:
        return None
    except InvalidTokenError:
        return None
```

**Doğrulama Süreci:**
- Token'ın imzası SECRET_KEY ile kontrol edilir
- Token'ın süresi dolmuş mu kontrol edilir
- Token formatı geçerli mi kontrol edilir
- Başarılı durumda token içindeki payload döndürülür
- Hata durumunda None döndürülür ve kullanıcı yeniden giriş yapmaya yönlendirilir

#### Password Güvenliği

Sistem, şifre güvenliği için endüstri standardı bcrypt algoritmasını kullanır:

```python
def hash_password(password: str) -> str:
    """Şifreyi bcrypt ile hash'ler"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Şifreyi doğrular"""
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )
```

**Password Güvenlik Özellikleri:**
- **bcrypt Algoritması**: Şifreleri güvenli bir şekilde hash'ler
- **Salt**: Her şifre için benzersiz salt oluşturur, rainbow table saldırılarını önler
- **Cost Factor**: Varsayılan olarak 12 round kullanır (güvenli seviye)
- **Tek Yönlü**: Hash'lenmiş şifreden orijinal şifre geri çıkarılamaz
- Şifreler asla düz metin olarak veritabanında saklanmaz

### API Endpoints (`auth_api.py`)

Bu dosya, authentication ile ilgili tüm API endpoint'lerini içerir. FastAPI'nin otomatik dokümantasyon özelliği sayesinde, bu endpoint'ler Swagger UI üzerinden test edilebilir.

#### Login Endpoint

Kullanıcı giriş işlemini gerçekleştiren ana endpoint'tir. Kullanıcı adı ve şifre doğrulaması yaparak JWT token döndürür:

```python
@router.post("/auth/login")
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Kullanıcı girişi"""
    # Kullanıcıyı bul
    user = db.query(User).filter(User.username == login_data.username).first()
    
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Geçersiz kullanıcı adı veya şifre")
    
    # Token oluştur
    token_data = {
        "sub": str(user.id),
        "username": user.username,
        "organization_id": user.organization_id,
        "role_id": user.role_id
    }
    
    access_token, jti, expires_at = create_access_token(token_data)
    
    # Session kaydet
    create_user_session(db, user.id, jti, expires_at)
    
    # Son giriş zamanını güncelle
    user.last_login = datetime.utcnow()
    db.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": get_user_info(user)
    }
```

**Login Endpoint İşleyişi:**
1. Gelen username ile veritabanında kullanıcı aranır
2. Şifre bcrypt ile doğrulanır
3. Başarılı durumda JWT token oluşturulur
4. Session kaydı veritabanına eklenir
5. Kullanıcının son giriş zamanı güncellenir
6. Token ve kullanıcı bilgileri frontend'e döndürülür

#### Profile Endpoint

Mevcut kullanıcının profil bilgilerini döndüren endpoint'tir. Token doğrulaması gerektirir:

```python
@router.get("/auth/profile")
async def get_profile(current_user: User = Depends(get_current_active_user)):
    """Mevcut kullanıcının profil bilgileri"""
    return get_user_info(current_user)
```

Bu endpoint, frontend'in kullanıcı bilgilerini güncellemesi veya sayfa yenilendiğinde kullanıcı durumunu kontrol etmesi için kullanılır.

#### Logout Endpoint

Kullanıcı oturumunu güvenli bir şekilde sonlandıran endpoint'tir:

```python
@router.post("/auth/logout")
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Oturumu sonlandır"""
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload and payload.get('jti'):
        # Session'ı deaktive et
        db.query(UserSession).filter(
            UserSession.jti == payload['jti']
        ).update({"is_active": False})
        db.commit()
    
    return {"message": "Başarıyla çıkış yapıldı"}
```

**Logout Endpoint Özellikleri:**
- Token'dan jti (JWT ID) çıkarılır
- Veritabanındaki ilgili session kaydı deaktive edilir
- Bu sayede token hala geçerli olsa bile kullanılamaz hale gelir
- Güvenlik açısından önemli: çalınan token'lar logout ile geçersiz kılınabilir

### Middleware ve Yetki Kontrolü (`auth_middleware.py`)

Bu dosya, API endpoint'lerini korumak ve kullanıcı yetkilerini kontrol etmek için kullanılan middleware fonksiyonlarını içerir. FastAPI'nin dependency injection sistemi ile entegre çalışır.

#### Kullanıcı Doğrulama

Her korumalı API isteğinde çağrılan ana doğrulama fonksiyonudur:

```python
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """JWT token'dan mevcut kullanıcıyı al"""
    token = credentials.credentials
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Geçersiz token")
    
    # Session kontrolü
    jti = payload.get('jti')
    if not is_session_valid(db, jti):
        raise HTTPException(status_code=401, detail="Oturum geçersiz")
    
    # Kullanıcıyı getir
    user_id = payload.get('sub')
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı")
    
    return user
```

**Doğrulama Adımları:**
1. HTTP Authorization header'ından token alınır
2. Token'ın geçerliliği JWT ile kontrol edilir
3. Token'ın jti'si ile session kontrolü yapılır
4. Kullanıcı veritabanından çekilir ve aktiflik durumu kontrol edilir
5. Tüm kontroller başarılıysa kullanıcı objesi döndürülür

#### Rol Kontrolü

Belirli rollere sahip kullanıcıların erişebileceği endpoint'ler için kullanılan decorator:

```python
def require_role(required_roles: List[str]):
    """Belirli rolleri gerektiren decorator"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user')
            if not current_user or current_user.role.name not in required_roles:
                raise HTTPException(status_code=403, detail="Yetkisiz erişim")
            return await func(*args, **kwargs)
        return wrapper
    return decorator
```

**Kullanım Örneği:**
```python
@require_role(['super_admin', 'org_admin'])
async def admin_only_endpoint():
    # Sadece admin'ler erişebilir
```

## Frontend Implementation

Bu bölüm, React.js tabanlı frontend uygulamasındaki authentication sistemini açıklar. Modern React pattern'leri ve TypeScript kullanılarak geliştirilmiştir.

### Dosya Yapısı

Frontend authentication sistemi şu şekilde organize edilmiştir:

```
ui/src/
├── contexts/
│   └── AuthContext.tsx      # Global auth state (React Context)
├── hooks/
│   └── usePermissions.ts    # Yetki kontrol hook'u (custom hook)
├── components/
│   └── ProtectedRoute.tsx   # Route koruması (HOC component)
└── pages/
    └── LoginPage.tsx        # Giriş sayfası (login formu)
```

Her dosya belirli bir sorumluluğa sahiptir ve React'in best practice'lerini takip eder.

### AuthContext (`contexts/AuthContext.tsx`)

AuthContext, uygulamanın global authentication state'ini yönetir. React Context API kullanarak tüm component'lerin kullanıcı bilgilerine erişmesini sağlar. Bu yaklaşım, prop drilling'i önler ve state yönetimini merkezileştirir.

```typescript
interface User {
  id: number;
  username: string;
  full_name: string;
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

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Token'ı localStorage'dan al ve axios header'ına ekle
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      refreshProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await axios.post('/auth/login', { username, password });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('access_token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(userData);
    } catch (error) {
      throw new Error('Giriş başarısız');
    }
  };

  const logout = async () => {
    try {
      await axios.post('/auth/logout');
    } catch (error) {
      // Logout hatası önemli değil
    } finally {
      localStorage.removeItem('access_token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    }
  };

  const refreshProfile = async () => {
    try {
      const response = await axios.get('/auth/profile');
      setUser(response.data);
    } catch (error) {
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**AuthContext Özellikleri:**
- **Otomatik Token Yükleme**: Sayfa yenilendiğinde localStorage'dan token'ı otomatik yükler
- **Global State**: Tüm component'ler kullanıcı durumuna erişebilir
- **Axios Entegrasyonu**: Token'ı otomatik olarak HTTP header'larına ekler
- **Error Handling**: Token geçersizse otomatik logout yapar
- **Loading State**: Uygulama başlangıcında loading durumunu yönetir

### usePermissions Hook (`hooks/usePermissions.ts`)

Bu custom hook, kullanıcının rolüne göre yetki kontrolü yapmak için kullanılır. Component'lerin UI elementlerini kullanıcının yetkilerine göre göstermesi/gizlemesi için tasarlanmıştır:

```typescript
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ORG_ADMIN: 'org_admin',
  MANAGER: 'manager',
  PLANNER: 'planner',
  STAFF: 'staff'
} as const;

export const PAGE_PERMISSIONS = {
  DASHBOARD: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.MANAGER, ROLES.PLANNER, ROLES.STAFF],
  ADMIN_PANEL: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN],
  USER_MANAGEMENT: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN],
  OPTIMIZATION_PARAMS: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.MANAGER, ROLES.PLANNER],
  RESULTS: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.MANAGER, ROLES.PLANNER, ROLES.STAFF],
  SETTINGS: [ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.MANAGER]
} as const;

export const usePermissions = () => {
  const { user } = useAuth();

  const hasRole = (role: string): boolean => {
    return user?.role?.name === role;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return user?.role ? roles.includes(user.role.name) : false;
  };

  const canAccessPage = (page: keyof typeof PAGE_PERMISSIONS): boolean => {
    return hasAnyRole(PAGE_PERMISSIONS[page]);
  };

  const isAdmin = (): boolean => {
    return hasAnyRole([ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN]);
  };

  const isManager = (): boolean => {
    return hasAnyRole([ROLES.SUPER_ADMIN, ROLES.ORG_ADMIN, ROLES.MANAGER]);
  };

  return {
    hasRole,
    hasAnyRole,
    canAccessPage,
    isAdmin,
    isManager
  };
};
```

**Hook Fonksiyonları:**
- `hasRole(role)`: Kullanıcının belirli bir role sahip olup olmadığını kontrol eder
- `hasAnyRole(roles)`: Kullanıcının verilen rollerden herhangi birine sahip olup olmadığını kontrol eder
- `canAccessPage(page)`: Kullanıcının belirli bir sayfaya erişip erişemeyeceğini kontrol eder
- `isAdmin()`: Kullanıcının admin yetkisine sahip olup olmadığını kontrol eder
- `isManager()`: Kullanıcının yönetici yetkisine sahip olup olmadığını kontrol eder

**Kullanım Örneği:**
```typescript
const { isAdmin, canAccessPage } = usePermissions();

return (
  <div>
    {isAdmin() && <AdminButton />}
    {canAccessPage('USER_MANAGEMENT') && <UserManagementLink />}
  </div>
);
```

### ProtectedRoute Component (`components/ProtectedRoute.tsx`)

Bu component, React Router ile entegre çalışarak route seviyesinde erişim kontrolü sağlar. Yetkisiz kullanıcıları otomatik olarak yönlendirir:

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

  if (isLoading) {
    return <CircularProgress />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPage && !canAccessPage(requiredPage)) {
    return showAccessDenied ? 
      <AccessDeniedPage /> : 
      <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
```

**ProtectedRoute Özellikleri:**
- **Loading State**: Kullanıcı bilgileri yüklenirken loading gösterir
- **Authentication Check**: Giriş yapmamış kullanıcıları login sayfasına yönlendirir
- **Authorization Check**: Yetkisiz kullanıcıları dashboard'a veya erişim reddedildi sayfasına yönlendirir
- **Flexible Handling**: showAccessDenied prop'u ile farklı error handling stratejileri

**Kullanım Örneği:**
```typescript
<ProtectedRoute requiredPage="ADMIN_PANEL">
  <AdminPanel />
</ProtectedRoute>
```

## Rol ve Yetki Sistemi

Bu bölüm, sistemin RBAC (Role-Based Access Control) modelini detaylı olarak açıklar. Sistem, hiyerarşik rol yapısı ile granüler yetki kontrolü sağlar.

### Rol Hiyerarşisi

Sistem 5 seviyeli hiyerarşik rol yapısına sahiptir. Her üst seviye, alt seviyelerin tüm yetkilerine sahiptir:

| Rol | Seviye | Açıklama | Yetkiler |
|-----|--------|----------|----------|
| **Super Admin** | 5 | Sistem Yöneticisi | Tüm sistem erişimi, tüm kurumları yönetebilir |
| **Org Admin** | 4 | Kurum Yöneticisi | Kurum içi tam yetki, kullanıcı yönetimi |
| **Manager** | 3 | Departman Müdürü | Departman yönetimi, ayarlar erişimi |
| **Planner** | 2 | Vardiya Planlayıcısı | Planlama işlemleri, optimizasyon parametreleri |
| **Staff** | 1 | Personel | Kendi bilgileri, sonuçları görüntüleme |

### Sayfa Erişim Matrisi

Bu tablo, hangi rolün hangi sayfalara erişebileceğini gösterir:

| Sayfa | Super Admin | Org Admin | Manager | Planner | Staff |
|-------|-------------|-----------|---------|---------|-------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin Panel | ✅ | ✅ | ❌ | ❌ | ❌ |
| User Management | ✅ | ✅ | ❌ | ❌ | ❌ |
| Optimization | ✅ | ✅ | ✅ | ✅ | ❌ |
| Results | ✅ | ✅ | ✅ | ✅ | ✅ |
| Settings | ✅ | ✅ | ✅ | ❌ | ❌ |

### Kurum Bazlı İzolasyon (Multi-Tenancy)

Sistem çok kiracılı yapıya sahiptir, bu da farklı kurumların aynı sistem üzerinde izole bir şekilde çalışabilmesi anlamına gelir:

- **Her kullanıcı sadece kendi kurumunun verilerine erişebilir**
- **Super Admin tüm kurumlara erişebilir** (sistem yönetimi için)
- **Org Admin sadece kendi kurumuna erişebilir**
- **Veri izolasyonu**: Bir kurumun kullanıcıları diğer kurumların verilerini göremez

## Güvenlik Özellikleri

Bu bölüm, sistemin güvenlik katmanlarını ve koruma mekanizmalarını detaylı olarak açıklar. Sistem, çok katmanlı güvenlik yaklaşımı benimser.

### Token Güvenliği

JWT token'lar için uygulanan güvenlik önlemleri:

- **JWT Secret Key**: Güçlü, rastgele oluşturulmuş 256-bit secret key kullanılır. Bu key, token'ların imzalanması ve doğrulanması için kritiktir.

- **Token Expiration**: 24 saat geçerlilik süresi ile token'ların uzun süre geçerli kalması önlenir. Bu, çalınan token'ların zarar verme süresini sınırlar.

- **JTI (JWT ID)**: Her token için benzersiz ID oluşturulur. Bu, token'ların takip edilmesi ve gerektiğinde geçersiz kılınması için kullanılır.

- **Session Tracking**: Token'ların sadece JWT içindeki bilgilerle değil, aynı zamanda veritabanındaki session kayıtları ile de doğrulanması çift katmanlı güvenlik sağlar.

### Password Güvenliği

Şifre güvenliği için endüstri standartları uygulanır:

- **bcrypt Hashing**: Şifreler bcrypt algoritması ile hash'lenir. Bu algoritma, brute force saldırılarına karşı dirençlidir.

- **Salt**: Her şifre için benzersiz salt oluşturulur. Bu, rainbow table saldırılarını önler ve aynı şifreye sahip kullanıcıların farklı hash'lere sahip olmasını sağlar.

- **Cost Factor**: 12 round kullanılır (2^12 = 4096 iterasyon). Bu, güvenlik ve performans arasında optimal dengeyi sağlar.

- **Şifre Politikası**: Minimum uzunluk ve karmaşıklık gereksinimleri uygulanabilir.

### Session Güvenliği

Oturum yönetimi için güvenlik önlemleri:

- **Session Invalidation**: Logout sırasında session veritabanında deaktive edilir. Bu, logout sonrası token kullanımını önler.

- **Automatic Cleanup**: Süresi dolmuş session'lar otomatik olarak temizlenir. Bu, veritabanının gereksiz kayıtlarla dolmasını önler.

- **Concurrent Sessions**: Aynı kullanıcı için birden fazla oturum desteklenir, ancak her oturum ayrı ayrı takip edilir.

- **Session Hijacking Protection**: JTI kontrolü ile session hijacking saldırıları önlenir.

### API Güvenliği

API katmanında uygulanan güvenlik önlemleri:

- **CORS Configuration**: Cross-origin istekleri için güvenli yapılandırma. Sadece izin verilen domain'lerden isteklere izin verilir.

- **Input Validation**: Pydantic modelleri ile tüm gelen veriler doğrulanır. SQL injection ve XSS saldırıları önlenir.

- **Error Handling**: Güvenli hata mesajları döndürülür. Sistem hakkında hassas bilgiler sızdırılmaz.

- **Rate Limiting**: Brute force saldırılarını önlemek için rate limiting uygulanabilir.

## Kullanım Kılavuzu

Bu bölüm, sistemin nasıl kullanılacağını ve yaygın sorunların nasıl çözüleceğini açıklar. Hem son kullanıcılar hem de sistem yöneticileri için pratik bilgiler içerir.

### Demo Kullanıcıları

Sistem, test ve demo amaçlı önceden tanımlanmış kullanıcılarla gelir. Bu kullanıcılar farklı rollere sahiptir ve sistemin özelliklerini test etmek için kullanılabilir:

```sql
-- Demo kullanıcılar (şifre: admin123)
INSERT INTO users (username, email, password_hash, first_name, last_name, organization_id, role_id) VALUES
('admin', 'admin@system.com', '$2b$12$...', 'Sistem', 'Yöneticisi', 1, 1),
('hastane_admin', 'admin@hastane.gov.tr', '$2b$12$...', 'Hastane', 'Müdürü', 1, 2),
('doktor1', 'doktor@hastane.gov.tr', '$2b$12$...', 'Dr. Ayşe', 'Kaya', 1, 5);
```

**Demo Kullanıcı Rolleri:**
- `admin`: Super Admin - tüm sistem yetkilerine sahip
- `hastane_admin`: Org Admin - hastane yönetimi yetkilerine sahip
- `doktor1`: Staff - temel kullanıcı yetkilerine sahip

### Giriş Yapma

Sisteme giriş yapmak için şu adımları takip edin:

1. **Login Sayfasına Git**: `http://localhost:3000/login` adresine gidin
2. **Bilgileri Gir**: Username ve password alanlarını doldurun
3. **Giriş Yap**: "Giriş Yap" butonuna tıklayın
4. **Yönlendirme**: Başarılı girişte otomatik olarak dashboard sayfasına yönlendirilirsiniz

**Giriş Sonrası:**
- Token otomatik olarak localStorage'a kaydedilir
- Kullanıcı bilgileri global state'e yüklenir
- Menü ve sayfa erişimleri rolünüze göre düzenlenir

### Yeni Kullanıcı Ekleme (Admin Yetkisi Gerekli)

Sadece Super Admin ve Org Admin rolleri yeni kullanıcı ekleyebilir:

1. **Admin Panel'e Erişim**: Sol menüden "Admin Panel" seçeneğine tıklayın
2. **Kullanıcı Yönetimi**: "Kullanıcı Yönetimi" sekmesine geçin
3. **Yeni Kullanıcı**: "Yeni Kullanıcı Ekle" butonuna tıklayın
4. **Form Doldurma**: Gerekli alanları doldurun:
   - Username (benzersiz olmalı)
   - Email (benzersiz olmalı)
   - Ad ve Soyad
   - Kurum (mevcut kullanıcının kurumu veya Super Admin için tüm kurumlar)
   - Rol (yetkiye göre seçenekler değişir)
5. **Kaydet**: Formu kaydedin

### Rol Değiştirme (Admin Yetkisi Gerekli)

Mevcut kullanıcıların rollerini değiştirmek için:

1. **Kullanıcı Listesi**: Kullanıcı yönetimi sayfasında kullanıcı listesini görüntüleyin
2. **Düzenle**: İlgili kullanıcının yanındaki "Düzenle" butonuna tıklayın
3. **Rol Seçimi**: Rol dropdown menüsünden yeni rolü seçin
4. **Kaydet**: Değişiklikleri kaydedin

**Önemli Notlar:**
- Org Admin sadece kendi kurumundaki kullanıcıların rollerini değiştirebilir
- Super Admin tüm kullanıcıların rollerini değiştirebilir
- Kullanıcı aktif oturumu varsa, rol değişikliği sonraki girişinde etkili olur

### Çıkış Yapma

Güvenli çıkış için şu adımları takip edin:

1. **Kullanıcı Menüsü**: Sağ üst köşedeki kullanıcı adınıza tıklayın
2. **Çıkış Seçeneği**: Açılan menüden "Çıkış Yap" seçeneğine tıklayın
3. **Otomatik Yönlendirme**: Sistem sizi otomatik olarak login sayfasına yönlendirir

**Çıkış Sonrası:**
- Token localStorage'dan silinir
- Session veritabanında deaktive edilir
- Tüm kullanıcı bilgileri temizlenir

### Troubleshooting (Sorun Giderme)

Yaygın sorunlar ve çözümleri:

**Token Süresi Doldu Hatası:**
- **Sebep**: JWT token'ın 24 saatlik süresi dolmuş
- **Çözüm**: Sayfayı yenileyin, otomatik olarak login sayfasına yönlendirileceksiniz
- **Önlem**: Uzun süre aktif olmayacaksanız çıkış yapın

**Yetkisiz Erişim Hatası (403 Forbidden):**
- **Sebep**: Erişmeye çalıştığınız sayfaya rolünüz yetmiyor
- **Çözüm**: Rolünüzü kontrol edin ve yetkili olduğunuz sayfalara erişin
- **Bilgi**: Yetki matrisi tablosunu kontrol ederek hangi sayfalara erişebileceğinizi öğrenin

**Giriş Yapamıyorum:**
- **Username/Password Hatası**: Bilgilerinizi kontrol edin
- **Hesap Deaktif**: Admin'den hesabınızın aktif olduğunu kontrol ettirin
- **Sistem Hatası**: Backend servisinin çalıştığından emin olun

**API Hataları:**
- **Network Hatası**: İnternet bağlantınızı kontrol edin
- **401 Unauthorized**: Token geçersiz, yeniden giriş yapın
- **403 Forbidden**: Yetkiniz yok, admin ile iletişime geçin
- **500 Server Error**: Backend servisinde sorun var, teknik destek alın

**Genel Debugging:**
- Tarayıcının Developer Tools > Network sekmesinde API isteklerini kontrol edin
- Console sekmesinde JavaScript hatalarını kontrol edin
- localStorage'da 'access_token' anahtarının varlığını kontrol edin 