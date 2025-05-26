# 🖥️ Geleneksel Deployment Planı
## On-Premise Kurulum Stratejisi

### 📋 Genel Bakış
Bu plan, müşterilerin kendi bilgisayarlarında/sunucularında sistemi çalıştırması için tasarlanmıştır. Docker containerization kullanarak izole ve taşınabilir bir çözüm sunar.

---

## 🎯 Hedef Müşteri Profili

### **Birincil Hedef:**
- **Büyük hastaneler** (veri güvenliği öncelikli)
- **Kamu kurumları** (internet kısıtlamaları)
- **Finans sektörü** (compliance gereksinimleri)

### **Müşteri Gereksinimleri:**
- Veri kontrolü (kendi sunucularında)
- İnternet bağımsızlığı
- Özelleştirilebilir konfigürasyon
- Yüksek güvenlik standartları

---

## 🛠️ Teknik Mimari

### **Sistem Bileşenleri:**
```
Müşteri Sunucusu/PC:
├── Docker Desktop/Engine
├── MySQL Container (Veritabanı)
├── n8n Container (Otomasyon)
├── FastAPI Container (Optimizasyon)
├── React UI Container (Arayüz)
└── Nginx Container (Reverse Proxy)
```

### **Network Yapısı:**
```
Internet ←→ [Nginx:80/443] ←→ [React UI:3000]
                ↓
            [FastAPI:8000] ←→ [MySQL:3306]
                ↓
            [n8n:5678]
```

---

## 📦 Paketleme Stratejisi

### **1. Installer Paketi (Windows)**
```
OptimizasyonCozumu_v1.0_Setup.exe
├── embedded_docker/
│   ├── docker-desktop-installer.exe
│   └── docker-compose.yml
├── application/
│   ├── containers/
│   ├── configs/
│   ├── database/
│   └── scripts/
├── documentation/
│   ├── kurulum-kilavuzu.pdf
│   ├── kullanici-kilavuzu.pdf
│   └── teknik-dokumantasyon.pdf
└── tools/
    ├── install.bat
    ├── start.bat
    ├── stop.bat
    ├── backup.bat
    └── uninstall.bat
```

### **2. Linux Paketi**
```
optimization-solution-1.0.tar.gz
├── docker-compose.yml
├── .env.template
├── scripts/
│   ├── install.sh
│   ├── start.sh
│   ├── stop.sh
│   └── backup.sh
├── configs/
├── database/
└── docs/
```

---

## 🚀 Kurulum Süreci

### **Otomatik Kurulum (Windows)**

#### **Adım 1: Sistem Kontrolü**
- Windows sürümü (Windows 10/11)
- RAM (minimum 8GB)
- Disk alanı (minimum 10GB)
- İnternet bağlantısı (kurulum için)

#### **Adım 2: Docker Kurulumu**
```batch
# Docker Desktop otomatik kurulum
if not exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
    echo Docker Desktop kuruluyor...
    start /wait docker-desktop-installer.exe --quiet
)
```

#### **Adım 3: Uygulama Kurulumu**
```batch
# Uygulama dosyalarını kopyala
xcopy /E /I "application" "C:\OptimizasyonCozumu\"

# Docker imajlarını yükle
docker-compose -f C:\OptimizasyonCozumu\docker-compose.yml pull

# Servisleri başlat
docker-compose -f C:\OptimizasyonCozumu\docker-compose.yml up -d
```

#### **Adım 4: Konfigürasyon**
- Veritabanı şifrelerini ayarla
- SSL sertifikalarını kur
- Kullanıcı hesaplarını oluştur

### **Manuel Kurulum Adımları**

#### **Ön Gereksinimler:**
1. Docker Desktop kurulumu
2. Git kurulumu (opsiyonel)
3. Yönetici hakları

#### **Kurulum Komutları:**
```bash
# Repository'yi klonla
git clone https://github.com/yourcompany/optimization-solution.git
cd optimization-solution

# Environment dosyasını kopyala
cp .env.example .env

# Konfigürasyonu düzenle
notepad .env

# Servisleri başlat
docker-compose up -d

# Veritabanını başlat
docker-compose exec mysql mysql -u root -p < database/init.sql
```

---

## 🔧 Müşteri Özelleştirmeleri

### **1. Multi-Tenant Konfigürasyonu**
```yaml
# docker-compose.override.yml
services:
  mysql:
    environment:
      - MYSQL_DATABASE=${TENANT_DB_NAME}
      - MYSQL_USER=${TENANT_DB_USER}
      - MYSQL_PASSWORD=${TENANT_DB_PASS}
  
  api:
    environment:
      - TENANT_ID=${TENANT_ID}
      - DATABASE_URL=mysql://${TENANT_DB_USER}:${TENANT_DB_PASS}@mysql:3306/${TENANT_DB_NAME}
```

### **2. Güvenlik Konfigürasyonu**
```yaml
# security.yml
services:
  nginx:
    volumes:
      - ./ssl:/etc/nginx/ssl
    environment:
      - SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
      - SSL_KEY_PATH=/etc/nginx/ssl/key.pem
```

### **3. Performans Ayarları**
```yaml
# performance.yml
services:
  mysql:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
  
  api:
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 1G
```

---

## 🔄 Bakım ve Güncelleme

### **Otomatik Güncelleme Sistemi**
```batch
# update.bat
@echo off
echo Güncelleme kontrol ediliyor...

# Mevcut sürümü kontrol et
docker exec optimization_api python -c "import version; print(version.__version__)" > current_version.txt

# Yeni sürüm var mı kontrol et
curl -s https://api.github.com/repos/yourcompany/optimization-solution/releases/latest > latest_release.json

# Güncelleme gerekiyorsa
if %UPDATE_AVAILABLE% == true (
    echo Yeni sürüm bulundu. Güncelleme başlatılıyor...
    call backup.bat
    docker-compose pull
    docker-compose up -d
    echo Güncelleme tamamlandı.
)
```

### **Backup Stratejisi**
```batch
# backup.bat
@echo off
set BACKUP_DATE=%date:~-4,4%%date:~-10,2%%date:~-7,2%
set BACKUP_DIR=C:\OptimizasyonCozumu\backups\%BACKUP_DATE%

# Veritabanı backup
docker exec mysql mysqldump -u root -p%MYSQL_ROOT_PASSWORD% optimization_db > %BACKUP_DIR%\database.sql

# Konfigürasyon backup
xcopy /E /I "C:\OptimizasyonCozumu\configs" "%BACKUP_DIR%\configs"

# n8n workflow backup
xcopy /E /I "C:\OptimizasyonCozumu\n8n_data" "%BACKUP_DIR%\n8n_data"
```

---

## 📊 Monitoring ve Logging

### **Sistem Monitoring**
```yaml
# monitoring.yml
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
  
  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
```

### **Log Management**
```yaml
# logging.yml
services:
  api:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
  
  mysql:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

## 💰 Maliyet Analizi

### **Müşteri Maliyetleri:**
- **Donanım:** Mevcut sunucu/PC (ek maliyet yok)
- **Yazılım:** Docker Desktop (büyük şirketler için ücretli)
- **Lisans:** Yıllık $2,000-10,000 (kullanıcı sayısına göre)
- **Destek:** Yıllık $500-2,000

### **Avantajlar:**
- Tam veri kontrolü
- İnternet bağımsızlığı
- Özelleştirilebilir
- Compliance uyumlu

### **Dezavantajlar:**
- Yüksek başlangıç maliyeti
- Teknik bilgi gereksinimi
- Bakım sorumluluğu
- Güncelleme karmaşıklığı

---

## 🎯 Bitirme Sunumu İçin Demo Senaryosu

### **Demo Akışı (10 dakika):**

1. **Kurulum Gösterimi (3 dk)**
   - install.bat çalıştır
   - Otomatik kurulum sürecini göster
   - "2 dakikada hazır sistem"

2. **Multi-Tenant Demo (4 dk)**
   - Hastane A için giriş
   - Çağrı merkezi B için giriş
   - Veri izolasyonu göster

3. **Yönetim Özellikleri (3 dk)**
   - Backup alma
   - Sistem durumu kontrolü
   - Güncelleme süreci

### **Jüriyi Etkileyecek Noktalar:**
- ✅ "Tek tık kurulum"
- ✅ "Kurumsal güvenlik"
- ✅ "Veri kontrolü"
- ✅ "Offline çalışabilir"
- ✅ "Profesyonel paketleme"

---

## 📝 Sonraki Adımlar

### **Geliştirme Öncelikleri:**
1. Docker Compose optimizasyonu
2. Windows installer geliştirme
3. Otomatik backup sistemi
4. Monitoring dashboard
5. Güncelleme mekanizması

### **Test Senaryoları:**
- Farklı Windows sürümlerinde test
- Düşük kaynaklı sistemlerde test
- Network izolasyonu testleri
- Felaket kurtarma testleri
