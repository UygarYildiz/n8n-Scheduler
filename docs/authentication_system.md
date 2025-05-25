# Authentication ve Authorization Sistemi

Bu dokümantasyon, Kurumsal Optimizasyon ve Otomasyon Çözümü'nün kimlik doğrulama ve yetkilendirme sisteminin nasıl çalıştığını ve nasıl oluşturulduğunu açıklar. Sistem, modern web uygulamalarında kullanılan JWT token tabanlı kimlik doğrulama ile rol bazlı yetkilendirme (RBAC) modelini birleştirerek güvenli ve ölçeklenebilir bir çözüm sunar.

Bu sistem, hastane ve çağrı merkezi gibi kurumsal ortamlarda çalışan personelin güvenli bir şekilde sisteme erişmesini ve yetkilerine göre farklı işlemler yapabilmesini sağlar. Sistem, hem güvenlik hem de kullanım kolaylığı açısından optimize edilmiştir.

## İçindekiler

1. [Sistem Genel Bakış](#sistem-genel-bakış)
2. [Veritabanı Yapısı](#veritabanı-yapısı)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Rol ve Yetki Sistemi](#rol-ve-yetki-sistemi)
6. [Session Management](#session-management)
7. [Audit Logging](#audit-logging)
8. [Güvenlik Özellikleri](#güvenlik-özellikleri)
9. [Teknik Sorunlar ve Çözümler](#teknik-sorunlar-ve-çözümler)
10. [Kullanım Kılavuzu](#kullanım-kılavuzu)

## Sistem Genel Bakış

Bu bölüm, authentication (kimlik doğrulama) sisteminin temel işleyişini ve mimarisini açıklar. Authentication, kullanıcıların kim olduklarını doğrulama sürecidir, authorization ise bu kullanıcıların hangi işlemleri yapabileceğini belirleme sürecidir. Sistemimiz, kullanıcıların kimlik doğrulaması ve yetkilendirmesi için modern, güvenli ve kullanıcı dostu bir yaklaşım benimser.

### Ne Yapar?

Authentication sistemi, kullanıcıların sisteme güvenli bir şekilde giriş yapmasını ve yetkilerine göre farklı sayfalara/işlemlere erişmesini sağlar. Bu sistem, özellikle çok kullanıcılı kurumsal ortamlarda farklı yetki seviyelerine sahip personelin aynı platform üzerinde güvenli bir şekilde çalışabilmesini mümkün kılar.

Örneğin, bir hastanede doktor, hemşire, yönetici ve sistem yöneticisi gibi farklı rollerdeki kişiler aynı sistemi kullanabilir, ancak her biri sadece kendi yetkilerine uygun sayfalara ve işlemlere erişebilir. Bu sayede hem güvenlik sağlanır hem de kullanıcılar gereksiz karmaşıklıkla karşılaşmaz.

### Temel Özellikler

Sistemin sunduğu ana özellikler şunlardır:

#### JWT Token Tabanlı Kimlik Doğrulama
JWT (JSON Web Token), kullanıcı bilgilerini güvenli bir şekilde taşıyan dijital bir kimlik kartı gibi düşünülebilir. Kullanıcı giriş yaptığında güvenli bir JWT token alır. Bu token, kullanıcının kimliğini ve yetkilerini içerir ve her API isteğinde kullanılır. Token'ın avantajı, sunucunun her istekte kullanıcı bilgilerini veritabanından sorgulamasına gerek kalmamasıdır.

#### Rol Bazlı Yetki Sistemi (RBAC)
RBAC (Role-Based Access Control), kullanıcıları rollerine göre gruplandıran ve her role belirli yetkiler veren bir sistemdir. Sistemimizde 5 farklı rol seviyesi bulunur:
- **Super Admin (Sistem Yöneticisi)**: Tüm sistem yetkilerine sahip
- **Org Admin (Kurum Yöneticisi)**: Kurum içi tam yetki
- **Manager (Departman Müdürü)**: Departman yönetimi yetkisi
- **Planner (Vardiya Planlayıcısı)**: Planlama işlemleri yetkisi
- **Staff (Personel)**: Temel kullanıcı yetkisi

Her rol, belirli sayfalara ve işlemlere erişim yetkisine sahiptir. Bu hiyerarşik yapı sayesinde, üst seviyedeki roller alt seviyelerin tüm yetkilerine de sahip olur.

#### Çok Kiracılı (Multi-Tenant) Yapı
Multi-tenancy, farklı kurumların (hastane, çağrı merkezi) aynı sistem üzerinde çalışabilmesi anlamına gelir. Her kurum kendi verilerine erişir ve diğer kurumların verilerini göremez. Bu sayede tek bir sistem kurulumu ile birden fazla kuruma hizmet verilebilir. Örneğin, İstanbul'daki bir hastane ile Ankara'daki bir çağrı merkezi aynı sistemi kullanabilir, ancak birbirlerinin verilerine erişemez.

#### Gelişmiş Session Yönetimi
Session (oturum), kullanıcının sisteme giriş yaptığı andan çıkış yaptığı ana kadar geçen süreyi ifade eder. Sistemimizde token'ların geçerliliği sadece JWT içindeki süre ile değil, aynı zamanda veritabanındaki session kayıtları ile de kontrol edilir. Kullanıcı başına maksimum 2 aktif session sınırı vardır.

#### Kapsamlı Audit Logging
Audit logging, sistemde yapılan tüm önemli işlemlerin kayıt altına alınması anlamına gelir ve güvenlik ve uyumluluk açısından kritiktir. Sistem şu işlemleri detaylı olarak loglar:
- Kullanıcı giriş/çıkış işlemleri (başarılı ve başarısız)
- Kullanıcı yönetimi işlemleri (ekleme, düzenleme, silme)
- Session işlemleri (oturum sonlandırma)
- Sistem erişim denemeleri

Her log kaydı, işlemi yapan kullanıcı, işlem zamanı, IP adresi, tarayıcı bilgisi gibi detayları içerir. Bu sayede herhangi bir güvenlik ihlali durumunda kim, ne zaman, nereden, hangi işlemi yaptığı tespit edilebilir.

#### Timezone Desteği
Sistem, Türkiye saat dilimi (Europe/Istanbul) desteği ile doğru zaman gösterimi sağlar. Bu özellik, özellikle farklı saat dilimlerinde çalışan kullanıcılar için önemlidir. Tüm zaman bilgileri UTC (Coordinated Universal Time) formatında veritabanında saklanır, ancak kullanıcıya gösterilirken Türkiye saatine çevrilir.

#### UTF-8 Karakter Desteği
UTF-8, Türkçe karakterlerin (ğ, ü, ş, ı, ö, ç) doğru görüntülenmesi için gerekli karakter kodlamasıdır. Sistem, backend'den frontend'e kadar tüm katmanlarda UTF-8 desteği sağlar. Bu sayede kullanıcı adları, açıklamalar ve diğer metinlerde Türkçe karakterler sorunsuz kullanılabilir.

#### Otomatik Session Temizleme
Sistem, süresi dolmuş ve kullanılmayan session'ları otomatik olarak temizler. Bu özellik hem veritabanının gereksiz kayıtlarla dolmasını önler hem de güvenlik açısından önemlidir. Eski session'lar düzenli olarak silinir ve sistem performansı optimize edilir.

### Nasıl Çalışır?

Sistemin çalışma akışı şu adımları takip eder ve her adım kullanıcı güvenliği için optimize edilmiştir:

1. **Giriş Süreci**: Kullanıcı username ve password ile giriş yapar. Backend bu bilgileri doğrular.

2. **Token Oluşturma**: Başarılı girişte backend bir JWT token oluşturur ve veritabanına session kaydı yapar. Bu token kullanıcının kimlik bilgilerini ve yetkilerini içerir.

3. **Session Kontrolü**: Yeni giriş sırasında kullanıcının mevcut session'ları kontrol edilir. 2'den fazla aktif session varsa eski olanlar otomatik olarak sonlandırılır.

4. **Token Saklama**: Frontend bu token'ı tarayıcının localStorage'ında `auth_token` anahtarıyla güvenli bir şekilde saklar.

5. **API İstekleri**: Her API isteğinde token HTTP header'ında gönderilir ve backend tarafından doğrulanır.

6. **Yetki Kontrolü**: Sayfa erişimleri ve işlem yetkileri kullanıcının rolüne göre kontrol edilir. Yetkisiz erişim denemeleri engellenir.

7. **Audit Logging**: Tüm önemli işlemler (giriş, çıkış, kullanıcı işlemleri) IP adresi ve User Agent bilgileriyle birlikte loglanır.

## Veritabanı Yapısı

Bu bölüm, authentication sisteminin temelini oluşturan veritabanı tablolarını ve aralarındaki ilişkileri açıklar. Sistem, MySQL 8.0 veritabanı kullanarak kullanıcı bilgilerini, rolleri, kurumları, oturum bilgilerini ve audit loglarını güvenli bir şekilde saklar.

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
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
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
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
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
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
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
    token_jti VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_sessions_user_id (user_id),
    INDEX idx_user_sessions_jti (token_jti),
    INDEX idx_user_sessions_expires (expires_at)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Session Tablosu Alanları:**
- `token_jti`: JWT Token ID - her token için benzersiz tanımlayıcı
- `expires_at`: Token'ın geçerlilik süresi
- `is_revoked`: Oturumun iptal edilip edilmediğini belirler (logout durumunda true yapılır)
- `created_at`: Session'ın oluşturulma tarihi

**Session Yönetimi Özellikleri:**
- Kullanıcı başına maksimum 2 aktif session sınırı
- Yeni giriş sırasında eski session'lar otomatik olarak temizlenir
- Admin tarafından session'lar manuel olarak sonlandırılabilir

### Audit Logs Tablosu

Bu tablo, sistemdeki tüm önemli işlemleri takip eder. Güvenlik ve uyumluluk amaçlı kapsamlı audit trail sağlar.

```sql
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    action ENUM(
        'login_success', 'login_failed', 'logout', 'logout_all', 'session_revoked',
        'user_created', 'user_updated', 'user_deleted', 'user_status_changed',
        'password_changed', 'profile_updated', 'admin_access'
    ) NOT NULL,
    user_id INT NULL,
    target_user_id INT NULL,
    description TEXT NOT NULL,
    details JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    success BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (target_user_id) REFERENCES users(id),
    INDEX idx_audit_logs_action (action),
    INDEX idx_audit_logs_user_id (user_id),
    INDEX idx_audit_logs_created_at (created_at)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Audit Log Alanları:**
- `action`: İşlem türü (enum değeri)
- `user_id`: İşlemi yapan kullanıcı (nullable - başarısız girişler için)
- `target_user_id`: İşlem yapılan kullanıcı (admin işlemleri için)
- `description`: İşlem açıklaması
- `details`: JSON formatında ek detaylar
- `ip_address`: İstek yapılan IP adresi
- `user_agent`: Tarayıcı bilgisi
- `success`: İşlem başarı durumu

## Backend Implementation

Bu bölüm, authentication sisteminin backend tarafındaki implementasyonunu detaylı olarak açıklar. Backend, FastAPI framework'ü kullanılarak geliştirilmiş olup, modern Python web geliştirme standartlarını takip eder.

### Dosya Yapısı

Backend authentication sistemi modüler bir yapıda organize edilmiştir:

```
optimization_core/
├── auth_api.py          # Authentication API endpoints
├── auth_utils.py        # JWT ve password utilities
├── auth_middleware.py   # Yetki kontrol middleware
├── audit_utils.py       # Audit logging utilities
├── database.py          # Database modelleri ve bağlantı
└── main.py             # FastAPI uygulaması
```

### JWT Token Sistemi (`auth_utils.py`)

Bu dosya, JWT token'ların oluşturulması, doğrulanması ve password güvenliği ile ilgili tüm utility fonksiyonlarını içerir.

#### Token Oluşturma

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

#### Session Yönetimi

```python
def create_user_session(db: Session, user_id: int, token_jti: str, expires_at: datetime):
    """Kullanıcı oturumu oluşturur ve eski oturumları temizler"""
    # Mevcut aktif session'ları kontrol et
    active_sessions = db.query(UserSession).filter(
        UserSession.user_id == user_id,
        UserSession.is_revoked == False,
        UserSession.expires_at > datetime.now(timezone.utc)
    ).order_by(UserSession.created_at.desc()).all()
    
    # Maksimum 2 aktif session sınırı
    if len(active_sessions) >= 2:
        # En eski session'ları iptal et
        for session in active_sessions[1:]:
            session.is_revoked = True
    
    # Yeni session oluştur
    session = UserSession(
        user_id=user_id,
        token_jti=token_jti,
        expires_at=expires_at
    )
    db.add(session)
    db.commit()
    return session
```

### API Endpoints (`auth_api.py`)

#### Login Endpoint (Geliştirilmiş)

```python
@router.post("/auth/login")
async def login(
    login_data: LoginRequest, 
    request: Request,
    db: Session = Depends(get_db)
):
    """Kullanıcı girişi - audit logging ve session yönetimi ile"""
    ip_address, user_agent = get_client_info(request)
    
    try:
        # Kullanıcı doğrulama
        user = authenticate_user(db, login_data.username, login_data.password)
        
        if not user:
            # Başarısız giriş logla
            log_login_failed(
                db=db,
                username=login_data.username,
                reason="Geçersiz kullanıcı adı veya şifre",
                ip_address=ip_address,
                user_agent=user_agent
            )
            raise HTTPException(status_code=401, detail="Geçersiz kullanıcı adı veya şifre")
        
        # Token oluştur
        token_data = {
            "user_id": user.id,
            "username": user.username,
            "organization_id": user.organization_id,
            "role_id": user.role_id
        }
        
        access_token, jti, expires_at = create_access_token(token_data)
        
        # Session oluştur (eski session'ları temizler)
        create_user_session(db, user.id, jti, expires_at)
        
        # Son giriş zamanını güncelle
        user.last_login = datetime.now(timezone.utc)
        db.commit()
        
        # Başarılı giriş logla
        log_login_success(
            db=db,
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": get_user_info(user)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        log_login_failed(
            db=db,
            username=login_data.username,
            reason=f"Sistem hatası: {str(e)}",
            ip_address=ip_address,
            user_agent=user_agent
        )
        raise HTTPException(status_code=500, detail="Giriş sırasında hata oluştu")
```

### Session Management Endpoints

```python
@router.get("/auth/sessions")
async def get_user_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Kullanıcının aktif session'larını listele"""
    sessions = db.query(UserSession).filter(
        UserSession.user_id == current_user.id,
        UserSession.is_revoked == False,
        UserSession.expires_at > datetime.now(timezone.utc)
    ).order_by(UserSession.created_at.desc()).all()
    
    return {
        "sessions": [format_session_info(session) for session in sessions],
        "total_count": len(sessions)
    }

@router.delete("/auth/sessions/{session_id}")
async def revoke_session(
    session_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Session'ı sonlandır (admin yetkisi gerekli)"""
    ip_address, user_agent = get_client_info(request)
    
    session = db.query(UserSession).filter(UserSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session bulunamadı")
    
    session.is_revoked = True
    db.commit()
    
    # Audit log
    log_session_revoked(
        db=db,
        admin_user_id=current_user.id,
        target_user_id=session.user_id,
        session_id=session_id,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return {"message": "Session başarıyla sonlandırıldı"}
```

### Audit Logging (`audit_utils.py`)

Kapsamlı audit logging sistemi tüm önemli işlemleri takip eder:

```python
def log_login_success(
    db: Session,
    user_id: int,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Başarılı giriş kaydı"""
    user = db.query(User).filter(User.id == user_id).first()
    username = user.username if user else "Unknown"
    
    return create_audit_log(
        db=db,
        action=AuditAction.LOGIN_SUCCESS,
        description=f"Kullanıcı {username} başarıyla giriş yaptı",
        user_id=user_id,
        details={
            "username": username,
            "login_time": datetime.now(timezone.utc).isoformat()
        },
        ip_address=ip_address,
        user_agent=user_agent,
        success=True
    )

def get_audit_logs(
    db: Session,
    limit: int = 100,
    offset: int = 0,
    user_id: Optional[int] = None,
    action: Optional[AuditAction] = None,
    success: Optional[bool] = None
) -> Dict[str, Any]:
    """Audit logları getirir - filtreleme ve sayfalama ile"""
    query = db.query(AuditLog)
    
    # Filtreler
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if action:
        query = query.filter(AuditLog.action == action)
    if success is not None:
        query = query.filter(AuditLog.success == success)
    
    # Toplam sayı
    total_count = query.count()
    
    # Sayfalama ve sıralama
    logs = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()
    
    return {
        "logs": [format_audit_log(log) for log in logs],
        "total_count": total_count,
        "limit": limit,
        "offset": offset
    }
```

## Frontend Implementation

Bu bölüm, React.js tabanlı frontend uygulamasındaki authentication sistemini açıklar. Modern React pattern'leri ve TypeScript kullanılarak geliştirilmiştir.

### AuthContext (`contexts/AuthContext.tsx`)

AuthContext, uygulamanın global authentication state'ini yönetir ve UTF-8 karakter desteği sağlar:

```typescript
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // UTF-8 desteği için axios default headers
  useEffect(() => {
    axios.defaults.headers.common['Accept'] = 'application/json; charset=utf-8';
    axios.defaults.headers.common['Content-Type'] = 'application/json; charset=utf-8';
  }, []);

  // Token'ı localStorage'dan al ve axios header'ına ekle
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedToken = localStorage.getItem('auth_token'); // Doğru anahtar
        if (savedToken) {
          setToken(savedToken);
          axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
          await refreshProfile();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('auth_token');
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
      const { access_token, user: userData } = response.data;

      if (access_token && userData) {
        setToken(access_token);
        localStorage.setItem('auth_token', access_token); // Doğru anahtar
        axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
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

### Service Layer

#### auditService.ts

Audit logs için service katmanı:

```typescript
class AuditService {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token'); // Doğru anahtar kullanımı
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
      'Accept': 'application/json; charset=utf-8'
    };
  }

  async getAuditLogs(params: {
    limit?: number;
    offset?: number;
    user_id?: number;
    action?: string;
    success?: boolean;
  } = {}): Promise<AuditLogResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    if (params.user_id) queryParams.append('user_id', params.user_id.toString());
    if (params.action) queryParams.append('action', params.action);
    if (params.success !== undefined) queryParams.append('success', params.success.toString());

    const response = await axios.get(
      `${API_BASE_URL}/auth/audit-logs?${queryParams.toString()}`,
      { headers: this.getAuthHeaders() }
    );
    
    return response.data;
  }
}
```

**Service Layer'ın Faydaları:**
- **Merkezi API Yönetimi**: Tüm API çağrıları tek yerden yönetilir
- **Tip Güvenliği**: TypeScript ile tip kontrolü sağlanır
- **Hata Yönetimi**: API hatalarının merkezi yönetimi
- **Yeniden Kullanılabilirlik**: Servisler farklı component'lerde kullanılabilir

## Session Management

Bu bölüm, sistemin gelişmiş session yönetimi özelliklerini açıklar.

### Özellikler

- **Kullanıcı başına maksimum 2 aktif session**
- **Otomatik session temizleme**
- **Real-time session takibi**
- **Admin session yönetimi**
- **Session istatistikleri**

### Session Lifecycle

1. **Session Oluşturma**: Login sırasında yeni session oluşturulur
2. **Session Kontrolü**: Maksimum session sayısı kontrol edilir
3. **Eski Session Temizleme**: Limit aşılırsa eski session'lar iptal edilir
4. **Session Takibi**: Aktif session'lar real-time takip edilir
5. **Session Sonlandırma**: Logout veya admin müdahalesi ile sonlandırılır

### Frontend Session Management

```typescript
const SessionManagement: React.FC = () => {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);

  const loadSessions = async () => {
    try {
      const [sessionsData, statsData] = await Promise.all([
        sessionService.getAllSessions(),
        sessionService.getSessionStats()
      ]);
      
      setSessions(sessionsData.sessions);
      setStats(statsData);
    } catch (error) {
      console.error('Session loading error:', error);
    }
  };

  const handleRevokeSession = async (sessionId: number) => {
    try {
      await sessionService.revokeSession(sessionId);
      loadSessions(); // Refresh data
    } catch (error) {
      console.error('Session revoke error:', error);
    }
  };
};
```

**Frontend Session Management Özellikleri:**
- **Real-time Güncelleme**: Veriler düzenli olarak yenilenir
- **Kullanıcı Dostu Arayüz**: Anlaşılır tablolar ve kartlar
- **Onay Mekanizması**: Kritik işlemler için kullanıcı onayı
- **Hata Yönetimi**: Hataların kullanıcı dostu gösterimi
- **Loading States**: Yükleme durumlarının gösterimi

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