# Uyarlanabilirlik Stratejileri

Projenin farklı kurumlara ve optimizasyon senaryolarına kolayca adapte edilebilmesi, tasarımın temel hedeflerinden biridir. Bu hedefe ulaşmak için aşağıdaki stratejiler izlenecektir:

## 1. Modüler ve API-First Mimari

### 1.1 Sistem Bileşenleri
Sistem, [Sistem Mimarisi](architecture.md) belgesinde detaylandırıldığı gibi, aşağıdaki ana bileşenlerden oluşur:

*   **React Frontend (UI Katmanı):** Kullanıcı arayüzü ve etkileşim katmanı
*   **FastAPI Backend (API Katmanı):** RESTful API servisleri ve iş mantığı
*   **MySQL Veritabanı:** Kullanıcı yönetimi, konfigürasyon ve sonuç depolama
*   **n8n Otomasyon Platformu:** Veri toplama, işleme ve workflow yönetimi
*   **Optimizasyon Çekirdeği (Python/CP-SAT):** Google OR-Tools ile optimizasyon hesaplamaları
*   **Nginx Reverse Proxy:** Load balancing ve routing (production ortamında)

### 1.2 Modüler Avantajlar
*   Bu ayrım, bir bileşende yapılan değişikliğin diğerlerini minimum düzeyde etkilemesini sağlar
*   Yeni bir veri kaynağı eklemek sadece ilgili n8n akışını etkiler
*   UI değişiklikleri backend'i etkilemez
*   Optimizasyon algoritması değişiklikleri API katmanını etkilemez

## 2. Hibrit Konfigürasyon Yönetimi

### 2.1 Çoklu Konfigürasyon Katmanları
Sistem, esneklik sağlamak için hibrit bir konfigürasyon yaklaşımı kullanır:

*   **YAML Dosya Tabanlı:** Kuruma özel optimizasyon parametreleri (`configs/` klasörü)
*   **Veritabanı Tabanlı:** Kullanıcı yönetimi, kurum bilgileri ve runtime konfigürasyonları
*   **API Tabanlı:** Dinamik parametre güncellemeleri ve webhook entegrasyonları

### 2.2 Konfigürasyon Hiyerarşisi
```
Konfigürasyon Öncelik Sırası:
1. API Parametreleri (En yüksek öncelik)
2. Veritabanı Ayarları
3. YAML Dosya Konfigürasyonları
4. Varsayılan Değerler (En düşük öncelik)
```

### 2.3 Kuruma Özel Ayarlar
*   Minimum personel sayısı, vardiya kuralları, hedef fonksiyonu ağırlıkları
*   Çözücü ayarları ve optimizasyon parametreleri
*   Veri kaynağı bağlantı bilgileri ve entegrasyon ayarları
*   Kullanıcı rolleri ve yetkilendirme kuralları

## 3. Standartlaştırılmış API ve Veri Modelleri

### 3.1 RESTful API Standardizasyonu
*   Tüm bileşenler arası iletişim RESTful API'ler üzerinden yapılır
*   FastAPI ile otomatik OpenAPI/Swagger dokümantasyonu
*   Standart HTTP status kodları ve hata yönetimi
*   JSON tabanlı veri alışverişi

### 3.2 Veri Modeli Standardizasyonu
*   Bileşenler arasındaki iletişim [Veri Modeli ve Arayüzler](data_model.md) belgesinde tanımlanan standart JSON formatları üzerinden yapılır
*   Pydantic modelleri ile veri validasyonu ve tip güvenliği
*   Farklı kurumların veri yapılarının ortak formata dönüştürülmesi
*   Optimizasyon sonuçlarının tutarlı işlenmesi

### 3.3 API Endpoint Kategorileri
```
/api/auth/*          - Kimlik doğrulama ve yetkilendirme
/api/organizations/* - Kurum yönetimi
/api/users/*         - Kullanıcı yönetimi
/api/optimization/*  - Optimizasyon işlemleri
/api/results/*       - Sonuç yönetimi
/api/dashboard/*     - Dashboard verileri
/api/webhook/*       - n8n entegrasyonu
```

## 4. Dinamik Model Oluşturma ve Çoklu Kurum Desteği

### 4.1 Multi-Tenant Mimari
*   Veritabanı seviyesinde kurum izolasyonu (`organizations` tablosu)
*   Kullanıcı bazlı erişim kontrolü (`users`, `roles` tabloları)
*   Kuruma özel konfigürasyon dosyaları
*   Ayrı veri setleri ve workflow'lar

### 4.2 Dinamik Optimizasyon Modeli
*   Optimizasyon Çekirdeği, gelen konfigürasyona göre CP-SAT modelini dinamik olarak inşa eder
*   Konfigürasyonda belirtilen kurallar programatik olarak modele eklenir
*   Farklı kısıt setlerine sahip kurumlar için ayrı kod yazmaya gerek yok
*   Runtime'da model parametrelerinin değiştirilmesi

## 5. n8n Otomasyon ve Entegrasyon Esnekliği

### 5.1 Geniş Entegrasyon Desteği
*   n8n, çok çeşitli veri kaynaklarına (veritabanları, API'ler, dosya sistemleri) bağlanabilir
*   Yerleşik nodlar ile hızlı entegrasyon (MySQL, HTTP Request, Webhook, vb.)
*   Kuruma özel veri entegrasyonu senaryoları
*   Görsel workflow editörü ile kolay konfigürasyon

### 5.2 Özelleştirilebilir Workflow'lar
*   Kuruma özel veri dönüşümleri
*   Dinamik parametre yönetimi (webhook ile)
*   Karmaşık iş mantığı için `Function` ve `Function Item` nodları
*   Sonuç dağıtım senaryolarının özelleştirilmesi

### 5.3 Webhook Tabanlı Dinamik Kontrol
```
Webhook URL Formatı:
http://localhost:5678/webhook/[webhook-id]?veriSeti=hastane&kurallar=temel_kurallar
http://localhost:5678/webhook/[webhook-id]?veriSeti=cagri_merkezi&kurallar=temel_kurallar
```

## 6. Güvenlik ve Yetkilendirme Stratejileri

### 6.1 Kimlik Doğrulama Sistemi
*   JWT tabanlı token authentication
*   Bcrypt ile şifre hashleme
*   Session yönetimi ve token refresh
*   Multi-factor authentication desteği (gelecek)

### 6.2 Role-Based Access Control (RBAC)
```sql
Roller Hiyerarşisi:
- super_admin: Sistem geneli yönetim
- admin: Kurum yönetimi
- manager: Departman yönetimi
- user: Temel kullanım
- viewer: Sadece görüntüleme
```

### 6.3 Kurum Bazlı Veri İzolasyonu
*   Her kullanıcı sadece kendi kurumunun verilerine erişebilir
*   API seviyesinde organization_id kontrolü
*   Veritabanı seviyesinde foreign key kısıtları
*   Audit logging ve erişim takibi

## 7. Deployment ve Dağıtım Esnekliği

### 7.1 Çoklu Deployment Stratejileri
*   **Geleneksel Deployment:** Docker Compose ile on-premise kurulum
*   **Cloud-First Deployment:** Render platform ile cloud-native çözüm
*   **Hibrit Deployment:** Hem cloud hem on-premise desteği

### 7.2 Konteynerizasyon Avantajları
*   Platform bağımsızlığı (Windows, Linux, macOS)
*   Kolay ölçeklendirme ve yönetim
*   Tutarlı geliştirme ve production ortamları
*   Mikroservis mimarisine geçiş hazırlığı

### 7.3 Müşteri Dağıtım Kolaylığı
*   Windows batch dosyaları ile otomatik kurulum
*   Docker Desktop gerektirmeyen paketlenmiş çözümler
*   Kuruma özel konfigürasyon şablonları
*   Uzaktan güncelleme ve bakım desteği

## 8. Soyutlama Katmanları ve Gelecek Genişlemeler

### 8.1 Mevcut Soyutlama Katmanları
*   FastAPI ile API katmanı soyutlaması
*   SQLAlchemy ile veritabanı soyutlaması
*   Pydantic ile veri modeli soyutlaması
*   Docker ile deployment soyutlaması

### 8.2 Gelecek Genişleme Noktaları
*   Farklı optimizasyon problem tipleri (rotalama, kaynak tahsisi)
*   Alternatif çözücüler (CP-SAT dışında)
*   Farklı veritabanı sistemleri (PostgreSQL, MongoDB)
*   Mikroservis mimarisine geçiş

## 9. Kapsamlı Dokümantasyon ve Destek

### 9.1 Dokümantasyon Yapısı
```
docs/
├── setup.md              - Kurulum rehberi
├── architecture.md       - Sistem mimarisi
├── configuration.md      - Konfigürasyon yönetimi
├── data_model.md         - Veri modelleri
├── adaptability.md       - Bu belge
├── roadmap.md            - Proje yol haritası
└── deployment/
    ├── geleneksel-deployment-plani.md
    └── cloud-first-deployment-plani.md
```

### 9.2 Otomatik Dokümantasyon
*   FastAPI ile otomatik API dokümantasyonu
*   Swagger/OpenAPI entegrasyonu
*   Kod içi dokümantasyon ve type hints
*   Database schema dokümantasyonu

## 10. Sonuç ve Hedefler

Bu stratejilerin birleşimi, aşağıdaki hedefleri gerçekleştiren esnek bir çözüm oluşturur:

### 10.1 Teknik Hedefler
*   ✅ Modüler ve ölçeklenebilir mimari
*   ✅ Multi-tenant kurum desteği
*   ✅ RESTful API standardizasyonu
*   ✅ Güvenli kimlik doğrulama sistemi
*   ✅ Esnek deployment seçenekleri

### 10.2 İş Hedefleri
*   ✅ Hızlı kurum adaptasyonu (1-2 gün)
*   ✅ Minimum teknik bilgi gerektiren kurulum
*   ✅ Ölçeklenebilir çözüm mimarisi
*   ✅ Gelecek gereksinimlere uyum
*   ✅ Kurumsal güvenlik standartları

Bu yaklaşım, hem mevcut ihtiyaçları karşılayan hem de gelecekteki değişikliklere ve yeni gereksinimlere kolayca uyum sağlayabilen, endüstri standardlarında bir optimizasyon çözümü sunar.