# Kullanıcı Arayüzü Planlama Dokümanı

Bu belge, Kurumsal Optimizasyon ve Otomasyon Çözümü için kullanıcı arayüzü (UI) geliştirme planını detaylandırmaktadır. 5. hafta kapsamında gerçekleştirilecek kullanıcı arayüzü tasarımı ve geliştirme çalışmalarının yol haritasını içerir.

## 1. Kullanıcı Arayüzü Hedefleri ve Kapsamı

### 1.1. Temel Hedefler

- Optimizasyon sürecini teknik bilgisi olmayan son kullanıcılar için erişilebilir kılmak
- n8n webhook'ları ile entegre çalışarak veri seti ve konfigürasyon seçimini kolaylaştırmak
- Optimizasyon sonuçlarını görsel ve anlaşılır bir şekilde sunmak
- Vardiya çizelgelerini görüntüleme ve düzenleme imkanı sağlamak
- Farklı kurumsal senaryolar (hastane, çağrı merkezi vb.) için uyarlanabilir olmak

### 1.2. Hedef Kullanıcılar

1. **Planlamacılar:** Vardiya çizelgelerini oluşturan ve yöneten personel
2. **Departman Yöneticileri:** Kendi departmanlarının çizelgelerini inceleyecek yöneticiler
3. **İnsan Kaynakları Personeli:** Çalışan verilerini yönetecek personel
4. **Üst Düzey Yöneticiler:** Optimizasyon sonuçlarını ve metrikleri inceleyecek karar vericiler

### 1.3. Kapsam

- Veri seti ve konfigürasyon seçim ekranı
- Optimizasyon parametrelerini ayarlama formu
- Sonuçları görselleştirme ve raporlama paneli
- Vardiya çizelgesi görüntüleme ve düzenleme arayüzü
- Temel kullanıcı yetkilendirme ve kimlik doğrulama mekanizması

## 2. Teknoloji Seçimi ve Mimari





#### Backend (API Entegrasyonu)
- **Mevcut API:** FastAPI (Optimizasyon Çekirdeği)
- **n8n Entegrasyonu:** Webhook tabanlı iletişim

### 2.1. Mimari Yaklaşım

```
+-------------------+      +-------------------+      +-------------------+
|                   |      |                   |      |                   |
|  React Frontend   +----->+  FastAPI Backend  +----->+  n8n Workflows    |
|                   |      |                   |      |                   |
+-------------------+      +-------------------+      +-------------------+
        ^                          ^                          ^
        |                          |                          |
        v                          v                          v
+-------------------+      +-------------------+      +-------------------+
|                   |      |                   |      |                   |
|  UI State Store   |      |  Optimizasyon     |      |  Veri Kaynakları  |
|  (Context/Redux)  |      |  Çekirdeği        |      |  ve Konfigürasyon |
|                   |      |                   |      |                   |
+-------------------+      +-------------------+      +-------------------+
```

## 3. Kullanıcı Arayüzü Bileşenleri ve Ekranlar

### 3.1. Ana Bileşenler

1. **Üst Gezinme Çubuğu (Navbar)**
   - Kullanıcı bilgisi ve oturum yönetimi
   - Ana bölümler arası gezinme
   - Sistem durumu göstergeleri

2. **Yan Menü (Sidebar)**
   - Veri Seti Yönetimi
   - Konfigürasyon Yönetimi
   - Optimizasyon İşlemleri
   - Sonuçlar ve Raporlar
   - Ayarlar

3. **Ana İçerik Alanı**
   - Seçilen bölüme göre dinamik içerik
   - Responsive tasarım (masaüstü, tablet ve mobil uyumlu)

### 3.2. Ekranlar ve Sayfalar

#### 3.2.1. Giriş Sayfası / Dashboard
- Özet metrikler ve KPI'lar
- Son çalıştırılan optimizasyonların durumu
- Hızlı erişim bağlantıları
- Sistem bildirimleri

#### 3.2.2. Veri Seti ve Konfigürasyon Seçim Ekranı
- Mevcut veri setlerinin listesi (hastane, çağrı merkezi vb.)
- Konfigürasyon dosyalarının listesi
- Yeni veri seti yükleme veya oluşturma seçenekleri
- Konfigürasyon parametrelerini düzenleme arayüzü

#### 3.2.3. Optimizasyon Parametreleri Ayarlama Formu
- Hedef fonksiyon ağırlıklarını ayarlama
- Kısıt parametrelerini düzenleme
- Çözücü ayarlarını yapılandırma
- Optimizasyon çalıştırma ve izleme

#### 3.2.4. Sonuç Görselleştirme ve Raporlama Paneli
- Optimizasyon durumu ve özet bilgiler
- Metrik grafikleri ve göstergeleri
- Karşılaştırmalı analiz görünümleri
- Rapor oluşturma ve dışa aktarma seçenekleri

#### 3.2.5. Vardiya Çizelgesi Görüntüleme ve Düzenleme
- Takvim görünümü (günlük, haftalık, aylık)
- Vardiya atamalarını filtreleme ve sıralama
- Manuel düzenleme ve ayarlama araçları
- Değişiklikleri kaydetme ve optimizasyonu yeniden çalıştırma

#### 3.2.6. Ayarlar ve Yönetim
- Kullanıcı yönetimi
- Sistem ayarları
- API entegrasyon yapılandırması
- Log ve aktivite izleme

## 4. Kullanıcı Deneyimi (UX) Tasarımı

### 4.1. Tasarım Prensipleri
- **Basitlik:** Karmaşık optimizasyon süreçlerini basit ve anlaşılır arayüzlerle sunma
- **Tutarlılık:** Tüm ekranlarda tutarlı tasarım dili ve etkileşim modelleri
- **Geri Bildirim:** Kullanıcı eylemlerine ve sistem durumuna dair açık geri bildirimler
- **Erişilebilirlik:** Farklı yetenek seviyelerindeki kullanıcılar için erişilebilir tasarım
- **Esneklik:** Farklı kurumsal senaryolara uyarlanabilir arayüz bileşenleri

### 4.2. Kullanıcı Akışları

#### 4.2.1. Temel Optimizasyon Akışı
1. Kullanıcı giriş yapar
2. Veri seti ve konfigürasyon seçer
3. Optimizasyon parametrelerini ayarlar
4. Optimizasyonu başlatır
5. Sonuçları görüntüler ve analiz eder
6. Gerekirse manuel düzenlemeler yapar
7. Sonuçları kaydeder veya dışa aktarır

#### 4.2.2. Konfigürasyon Düzenleme Akışı
1. Mevcut konfigürasyonu seçer veya yeni oluşturur
2. Parametreleri düzenler (minimum personel, yetenek gereksinimleri vb.)
3. Değişiklikleri kaydeder
4. Yeni konfigürasyonla optimizasyon çalıştırır

#### 4.2.3. Rapor Oluşturma Akışı
1. Optimizasyon sonuçlarını görüntüler
2. Rapor parametrelerini ve içeriğini seçer
3. Raporu oluşturur
4. PDF, Excel veya diğer formatlarda dışa aktarır

## 5. API Entegrasyonu

### 5.1. Frontend-Backend İletişimi
- RESTful API çağrıları
- Asenkron optimizasyon işlemleri için WebSocket desteği
- Hata yönetimi ve yeniden deneme mekanizmaları

### 5.2. n8n Webhook Entegrasyonu
- Frontend'den n8n webhook'larını tetikleme
- Webhook parametrelerini dinamik olarak oluşturma
- Webhook yanıtlarını işleme ve görselleştirme

## 6. Geliştirme Planı ve Zaman Çizelgesi

### 6.1. Aşamalar

#### Aşama 1: Tasarım ve Prototipleme (5. Hafta - İlk Yarı)
- UI/UX tasarım şablonlarının oluşturulması
- Temel bileşenlerin prototiplenmesi
- Kullanıcı akışlarının doğrulanması

#### Aşama 2: Temel Bileşenlerin Geliştirilmesi (5. Hafta - İkinci Yarı)
- Temel sayfa yapısı ve gezinme
- Veri seti ve konfigürasyon seçim ekranı
- Optimizasyon parametreleri formu

#### Aşama 3: Görselleştirme ve Raporlama (6. Hafta - İlk Yarı)
- Metrik görselleştirmeleri
- Vardiya çizelgesi görünümü
- Rapor oluşturma araçları

#### Aşama 4: Entegrasyon ve Test (6. Hafta - İkinci Yarı)
- API entegrasyonu
- n8n webhook bağlantıları
- Kullanıcı testleri ve geri bildirim
- Hata düzeltmeleri ve iyileştirmeler

### 6.2. Öncelikli Görevler
1. Teknoloji stack'inin kesinleştirilmesi
2. Temel sayfa yapısının oluşturulması
3. Veri seti ve konfigürasyon seçim ekranının geliştirilmesi
4. Optimizasyon API entegrasyonunun tamamlanması
5. Vardiya çizelgesi görünümünün oluşturulması
6. Metrik görselleştirmelerinin uygulanması

## 7. Test Stratejisi

### 7.1. Test Türleri
- **Birim Testleri:** Temel UI bileşenlerinin işlevselliği
- **Entegrasyon Testleri:** API ve n8n webhook entegrasyonları
- **Kullanıcı Arayüzü Testleri:** Kullanıcı akışları ve etkileşimler
- **Uyumluluk Testleri:** Farklı tarayıcılar ve cihazlarda çalışma

### 7.2. Test Senaryoları
- Farklı veri setleri ve konfigürasyonlarla optimizasyon çalıştırma
- Büyük veri setleriyle performans testi
- Kullanıcı yetkilendirme ve erişim kontrolü
- Hata durumlarında kullanıcı deneyimi

## 8. Güvenlik ve Erişim Kontrolü

### 8.1. Kullanıcı Yetkilendirme
- Rol tabanlı erişim kontrolü (RBAC)
- Farklı kullanıcı rolleri (Admin, Planlamacı, Görüntüleyici)
- Departman bazlı erişim kısıtlamaları

### 8.2. Veri Güvenliği
- Hassas verilerin korunması
- API isteklerinin güvenliği
- Oturum yönetimi ve kimlik doğrulama

## 9. Gelecek Geliştirmeler ve Yol Haritası

### 9.1. İlk Sürüm Sonrası Planlanan Özellikler
- Gelişmiş veri içe/dışa aktarma seçenekleri
- Mobil uygulama desteği
- Gerçek zamanlı işbirliği araçları
- Yapay zeka destekli öneri sistemi

### 9.2. Uzun Vadeli Vizyon
- Tam entegre kurumsal çözüm
- Çoklu kurum desteği
- Bulut tabanlı SaaS modeli
- Açık API ekosistemi

## 10. Ekler

### 10.1. Mockup ve Wireframe Örnekleri
(Bu bölüm, tasarım aşamasında ekran mockup'ları ile güncellenecektir)

### 10.2. API Referansı
(Bu bölüm, mevcut API dokümantasyonuna referanslar içerecektir)
