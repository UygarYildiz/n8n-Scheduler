# Sistem Mimarisi

Bu belge, Kurumsal Optimizasyon ve Otomasyon Çözümü'nün sistem mimarisini detaylı olarak açıklamaktadır. Belge, sistemin bileşenlerini, veri akışını, entegrasyon noktalarını ve çalışma prensiplerini kapsamlı bir şekilde ele almaktadır.

## Genel Bakış

Proje, esneklik ve uyarlanabilirlik sağlamak amacıyla üç ana bileşenli modüler bir mimari üzerine kurulmuştur:

1.  **n8n (Veri Katmanı ve Otomasyon Platformu):** Veri toplama, ön işleme, optimizasyon çekirdeğini tetikleme ve sonuçların işlenip dağıtılmasından sorumludur. Webhook tabanlı dinamik parametre alma mekanizması ile farklı veri setleri ve konfigürasyonlar arasında geçiş yapabilme esnekliği sağlar.

2.  **Optimizasyon Çekirdeği (Python/FastAPI Servisi):** Google OR-Tools CP-SAT çözücüsünü kullanarak karmaşık vardiya çizelgeleme problemini çözer. n8n ile RESTful API üzerinden iletişim kurar. Konfigürasyon dosyalarından okunan parametrelere göre dinamik olarak kısıtlar ekleyebilir.

3.  **Konfigürasyon Yönetimi:** YAML formatında kuruma özel parametreleri ve ayarları yönetir. Farklı kurumlar (hastane, çağrı merkezi vb.) için ayrı konfigürasyon dosyaları kullanılarak sistemin uyarlanabilirliği sağlanır.

## Bileşen Detayları

### 1. n8n İş Akışları

n8n, projenin otomasyon ve veri işleme katmanını oluşturur. Webhook tabanlı dinamik parametre alma mekanizması ile farklı veri setleri ve konfigürasyonlar arasında geçiş yapabilme esnekliği sağlar.

#### 1.1. İş Akışı Bileşenleri ve Çalışma Mantığı

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

#### 1.2. Veri Setleri ve Dinamik Yapılandırma

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

### 2. Optimizasyon Çekirdeği (Python/FastAPI)

Optimizasyon Çekirdeği, Google OR-Tools CP-SAT çözücüsünü kullanarak karmaşık vardiya çizelgeleme problemini çözen Python tabanlı bir servistir. FastAPI ile oluşturulan RESTful API aracılığıyla n8n ile iletişim kurar.

#### 2.1. Mimari Yapı ve Bileşenler

Optimizasyon Çekirdeği aşağıdaki ana bileşenlerden oluşur:

1. **FastAPI Uygulaması (`main.py`):**
   * RESTful API arayüzünü sağlar
   * `/optimize` endpoint'i üzerinden POST isteklerini kabul eder
   * Pydantic modelleri ile veri doğrulama ve validasyon gerçekleştirir
   * Asenkron işlem desteği ile uzun süren optimizasyonları yönetir
   * Hata yönetimi ve loglama mekanizmaları içerir

2. **Konfigürasyon Yöneticisi:**
   * API isteğinden gelen `configuration_ref` parametresi ile belirtilen YAML dosyasını okur (örn. `hospital_test_config.yaml`)
   * Alternatif olarak, doğrudan API isteğinde gönderilen `configuration` nesnesini kullanabilir
   * Konfigürasyon doğrulama ve varsayılan değer atama işlemlerini gerçekleştirir

3. **Model Oluşturucu (`cp_model_builder.py`):**
   * `ShiftSchedulingModelBuilder` sınıfı, CP-SAT modelini dinamik olarak oluşturur
   * Gelen veri ve konfigürasyona göre değişkenler, kısıtlar ve hedef fonksiyonu tanımlar
   * Konfigürasyondaki parametrelere göre (örn. `min_staffing_requirements`) ilgili kısıtları modele ekler
   * Hedef fonksiyonunu (`Minimize`) ve ağırlıkları konfigürasyondan alır

4. **CP-SAT Çözücü Entegrasyonu:**
   * `cp_model.CpSolver()` kullanarak modeli çözer
   * Çözüm süresi sınırı (`solver_time_limit_seconds`) gibi çözücü parametrelerini konfigürasyondan alır
   * Çözüm durumunu (OPTIMAL, FEASIBLE, INFEASIBLE vb.) yakalar ve raporlar

5. **Metrik Hesaplayıcı:**
   * Optimizasyon sonuçlarına göre çeşitli performans metriklerini hesaplar
   * Operasyonel metrikler (understaffing, overstaffing, coverage ratios)
   * Çalışan memnuniyeti metrikleri (preferences met, workload distribution)
   * Sistem esnekliği ve uyarlanabilirlik metrikleri

6. **Sonuç Formatlayıcı:**
   * Çözücüden gelen sonucu ve hesaplanan metrikleri standart bir JSON formatına dönüştürür
   * Pydantic modelleri ile yanıt formatını doğrular
   * n8n'in kolayca işleyebileceği tutarlı bir yanıt yapısı sağlar

#### 2.2. Veri Akışı ve İşlem Adımları

Optimizasyon Çekirdeği'nin çalışma akışı şu şekildedir:

1. **API İsteği Alımı:**
   * n8n'den gelen POST isteği `/optimize` endpoint'ine ulaşır
   * İstek gövdesi, `OptimizationRequest` Pydantic modeli ile doğrulanır
   * İstek, `input_data` (çalışanlar, vardiyalar, yetenekler vb.) ve `configuration_ref` veya `configuration` içerir

2. **Konfigürasyon Yükleme:**
   * `configuration_ref` belirtilmişse, ilgili YAML dosyası okunur
   * Konfigürasyon parametreleri doğrulanır ve işlenir

3. **Model Oluşturma:**
   * `ShiftSchedulingModelBuilder` sınıfı başlatılır
   * Temel atama değişkenleri oluşturulur (`assignment_vars`)
   * Temel kısıtlar eklenir (bir çalışan aynı anda tek vardiyada olabilir vb.)
   * Konfigürasyondan okunan dinamik kısıtlar eklenir:
     * Minimum personel gereksinimleri (`min_staffing_requirements`)
     * Yetenek gereksinimleri (`skill_requirements`)
     * Maksimum ardışık vardiya sayısı (`max_consecutive_shifts`)
     * Minimum dinlenme süresi (`min_rest_time_hours`)
   * Hedef fonksiyon tanımlanır (ağırlıklar konfigürasyondan alınır):
     * Eksik personel minimizasyonu
     * Fazla personel minimizasyonu
     * Tercih maksimizasyonu
     * İş yükü dengeleme
     * Vardiya doluluğu maksimizasyonu

4. **Model Çözme:**
   * CP-SAT çözücüsü çağrılır
   * Çözüm durumu (OPTIMAL, FEASIBLE, INFEASIBLE vb.) yakalanır
   * Çözüm süresi ölçülür

5. **Sonuç İşleme:**
   * Çözüm durumuna göre atama kararları çıkarılır
   * Metrikler hesaplanır
   * Sonuçlar standart JSON formatına dönüştürülür
   * API yanıtı oluşturulur ve n8n'e gönderilir

#### 2.3. Optimizasyon Modeli Detayları

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

### 3. Konfigürasyon Yönetimi

Konfigürasyon Yönetimi, sistemin farklı kurumlara ve senaryolara uyarlanabilirliğini sağlayan kritik bir bileşendir. YAML formatında kuruma özel parametreleri ve ayarları yönetir.

#### 3.1. Konfigürasyon Dosya Yapısı

Her kurum veya problem tipi için ayrı konfigürasyon dosyaları (YAML formatında) kullanılır. Bu dosyalar şu bölümleri içerir:

1. **Kurum Bilgileri:**
   * `institution_id`: Kurumu tanımlayan benzersiz kimlik
   * `institution_name`: Kurumun tam adı
   * `problem_type`: Problem tipi (örn. "shift_scheduling")

2. **Optimizasyon Çekirdeği Parametreleri:**
   * `solver_time_limit_seconds`: Çözücünün maksimum çalışma süresi
   * `objective_weights`: Hedef fonksiyon ağırlıkları
     * `minimize_understaffing`: Eksik personel cezası ağırlığı
     * `minimize_overstaffing`: Fazla personel maliyeti ağırlığı
     * `maximize_preferences`: Tercih maksimizasyonu ağırlığı
     * `balance_workload`: İş yükü dengeleme ağırlığı
     * `maximize_shift_coverage`: Vardiya doluluğu maksimizasyonu ağırlığı

3. **Dinamik Kısıtlar ve Kurallar:**
   * `min_staffing_requirements`: Minimum personel gereksinimleri listesi
     * `shift_pattern`: Vardiya deseni (wildcard destekli)
     * `role`: Gerekli rol
     * `department`: Gerekli departman
     * `min_count`: Minimum personel sayısı
     * `penalty_if_violated`: İhlal cezası (yumuşak kısıt için)
   * `max_consecutive_shifts`: Maksimum ardışık vardiya sayısı
   * `min_rest_time_hours`: Vardiyalar arası minimum dinlenme süresi
   * `skill_requirements`: Yetenek gereksinimleri listesi
     * `shift_pattern`: Vardiya deseni
     * `skill`: Gerekli yetenek
     * `department`: İlgili departman
     * `role`: İlgili rol
     * `min_count`: Minimum yetenek sahibi personel sayısı
     * `penalty_if_violated`: İhlal cezası

4. **n8n Parametreleri:**
   * `notification_emails`: Bildirim gönderilecek e-posta adresleri
   * `report_template`: Rapor şablonu dosya adı

#### 3.2. Örnek Konfigürasyon Dosyaları

Sistem, farklı kurumlar için özelleştirilmiş konfigürasyon dosyaları kullanır:

1. **Hastane Konfigürasyonu (`hospital_test_config.yaml`):**
   * Acil, Kardiyoloji, Cerrahi gibi departmanlar için minimum personel gereksinimleri
   * Doktor, Hemşire, Teknisyen rolleri için yetenek gereksinimleri
   * Gece vardiyaları için özel kurallar
   * Kardiyoloji uzmanlığı gibi özel yetenek gereksinimleri

2. **Çağrı Merkezi Konfigürasyonu (`cagri_merkezi_config.yaml`):**
   * Genel Çağrı, Polis Yönlendirme, Sağlık Yönlendirme departmanları için minimum personel gereksinimleri
   * Çağrı Alıcı, Yönlendirici, Vardiya Amiri rolleri için yetenek gereksinimleri
   * Yoğun saatler için özel personel gereksinimleri
   * Dil becerileri ve teknik yetenek gereksinimleri

#### 3.3. Konfigürasyon Yönetimi Akışı

Konfigürasyon yönetimi şu şekilde çalışır:

1. **Konfigürasyon Seçimi:**
   * n8n webhook'u aracılığıyla hangi konfigürasyon dosyasının kullanılacağı belirlenir
   * Webhook parametresi (`veriSeti`) ile ilgili konfigürasyon dosyası referansı oluşturulur

2. **Konfigürasyon Yükleme:**
   * Optimizasyon Çekirdeği, API isteğinde belirtilen konfigürasyon dosyasını yükler
   * YAML dosyası Python nesnelerine dönüştürülür

3. **Konfigürasyon Kullanımı:**
   * Yüklenen konfigürasyon, CP-SAT modelinin dinamik olarak oluşturulmasında kullanılır
   * Kısıtlar, hedef fonksiyon ağırlıkları ve çözücü parametreleri konfigürasyondan alınır

4. **Konfigürasyon Güncellemesi:**
   * Konfigürasyon dosyaları manuel olarak düzenlenebilir
   * Gelecekte, kullanıcı arayüzü üzerinden konfigürasyon düzenleme imkanı eklenecektir

## Kapsam Notu: Departmanların Modellenmesi

Bu projenin ilk fazında, **departmanlar** (örn. Kardiyoloji, Acil Servis, Üretim Hattı B) sistemde **ayrı bir varlık olarak açıkça modellenmeyecektir**. Bunun yerine, departman veya alan bazlı gereksinimler ve kısıtlamalar aşağıdaki yöntemlerle dolaylı olarak ele alınacaktır:

1.  **Özelleştirilmiş Vardiya Tanımları:** Vardiyalar (`shifts.csv` ve konfigürasyon) belirli bir departmanı veya alanı temsil edecek şekilde adlandırılabilir (örn. `Acil_Gunduz`, `YogunBakim_Gece`).
2.  **Konfigürasyon Bazlı Gereksinimler:** Her bir özelleştirilmiş vardiya için gerekli minimum personel sayısı, rol ve **spesifik yetenekler** (`skills.csv` ve `.yaml` konfigürasyonu) aracılığıyla tanımlanacaktır.

**Bu Yaklaşımın Nedenleri:**

*   **Başlangıç Karmaşıklığını Azaltma:** Departmanları ayrı bir varlık olarak eklemek; veri modelini, yapay veri üretimini, konfigürasyon yapısını ve optimizasyon mantığını ekstradan karmaşıklaştıracaktır. Projenin ilk aşamalarında çekirdek optimizasyon ve otomasyon akışına odaklanmak hedeflenmektedir.
*   **Esneklik:** Rol/yetenek bazlı yaklaşım, birçok departman benzeri ihtiyacı karşılamak için yeterli esnekliği sunmaktadır.

**Gelecek Değerlendirmesi:**
Eğer test aşamasında veya gerçek kurum entegrasyonlarında, departmanları açıkça modellemenin (personel aidiyeti, departmanlar arası geçiş kısıtları, doğrudan departman bazlı raporlama için) kesinlikle gerekli olduğu ortaya çıkarsa, bu özellik **gelecek bir geliştirme fazı** olarak eklenebilir. Mevcut modüler mimari bu tür bir genişlemeye izin vermektedir.

## 4. Veri Akış ve Entegrasyon Şemaları

### 4.1. Genel Sistem Veri Akışı

Aşağıdaki şema, sistemin ana bileşenleri arasındaki veri akışını göstermektedir:

```
+---------------------+     +---------------------------+     +---------------------------+
|                     |     |                           |     |                           |
| Kurum Veri          +---->+ n8n                      +---->+ Optimizasyon Çekirdeği    |
| Kaynakları          |     | (Veri Toplama/Ön İşleme) |     | (FastAPI)                 |
|                     |     |                           |     |                           |
+---------------------+     +---------------------------+     +------------+--------------+
                                                                           |
                                                                           |
+---------------------+     +---------------------------+                  |
|                     |     |                           |                  |
| Konfigürasyon       +---->+ Konfigürasyon Yükleme    +------------------+
| Dosyaları (YAML)    |     |                           |
|                     |     |                           |
+---------------------+     +---------------------------+
                                                                           |
                                                                           v
                                                              +------------+--------------+
                                                              |                           |
                                                              | CP-SAT Model Oluşturma    |
                                                              | - Değişkenler             |
                                                              | - Kısıtlar                |
                                                              | - Hedef Fonksiyon         |
                                                              |                           |
                                                              +------------+--------------+
                                                                           |
                                                                           v
                                                              +------------+--------------+
                                                              |                           |
                                                              | CP-SAT Çözücü             |
                                                              | - Model Çözme             |
                                                              | - Sonuç Yakalama          |
                                                              |                           |
                                                              +------------+--------------+
                                                                           |
                                                                           v
                                                              +------------+--------------+
                                                              |                           |
                                                              | Sonuç İşleme              |
                                                              | - Atama Kararları         |
                                                              | - Metrik Hesaplama        |
                                                              |                           |
                                                              +------------+--------------+
                                                                           |
                                                                           v
+---------------------+     +---------------------------+     +------------+--------------+
|                     |     |                           |     |                           |
| Hedef Sistemler     <-----+ n8n                      <-----+ API Yanıtı (JSON)         |
| (Raporlar, E-posta) |     | (Sonuç İşleme/Dağıtım)   |     |                           |
|                     |     |                           |     |                           |
+---------------------+     +---------------------------+     +---------------------------+
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

## 6. Sistem Entegrasyonu ve Dağıtım

### 6.1. Docker Entegrasyonu

Sistem, Docker konteynerları kullanılarak dağıtılabilir. `docker-compose.yml` dosyası aşağıdaki servisleri içerir:

- **n8n:** Otomasyon platformu
  - Port: 5678
  - Volume bağlantıları:
    - `./n8n_data:/home/node/.n8n`
    - `./synthetic_data:/veri_kaynaklari/hastane`
    - `./synthetic_data_cagri_merkezi:/veri_kaynaklari/cagri_merkezi`
    - `./configs:/configs`
  - Sürüm: 1.91.2 (güncel sürüm)

- **Optimizasyon API:** FastAPI servisi (ayrı bir Dockerfile ile)
  - Port: 8000
  - Volume bağlantıları:
    - `./configs:/app/configs`

### 6.2. Çalıştırma ve Başlatma

Sistem, aşağıdaki adımlarla başlatılır:

1. **Optimizasyon API'sini Başlatma:**
   ```bash
   uvicorn optimization_core.main:app --reload --port 8000
   ```
   veya
   ```bash
   ./run_api.bat
   ```

2. **n8n'i Başlatma:**
   ```bash
   docker-compose up -d n8n
   ```

3. **Webhook'u Tetikleme:**
   ```
   http://localhost:5678/webhook/[webhook-id]?veriSeti=hastane&kurallar=temel_kurallar
   ```
   veya
   ```
   http://localhost:5678/webhook/[webhook-id]?veriSeti=cagri_merkezi&kurallar=temel_kurallar
   ```

4. **Üretim Ortamında Webhook URL'si:**
   Üretim ortamında webhook URL'si doğru yapılandırılmalıdır. n8n ayarlarında webhook URL'si, dış erişime açık bir adres olarak yapılandırılabilir.

## 7. Gelecek Geliştirmeler

### 7.1. Kullanıcı Arayüzü Entegrasyonu

5. ve 6. haftalarda geliştirilecek kullanıcı arayüzü, mevcut mimariye şu şekilde entegre edilecektir:

```
+-------------+     +----------------+     +----------------+     +----------------+
|             |     |                |     |                |     |                |
|  Kullanıcı  +---->+  Web Arayüzü   +---->+  Backend API   +---->+  n8n Webhook   |
|             |     |  (React.js)    |     |                |     |                |
|             |     |                |     |                |     |                |
+------+------+     +-------+--------+     +-------+--------+     +-------+--------+
       ^                    ^                      ^                      |
       |                    |                      |                      |
       |                    |                      |                      v
       |                    |                      |              +-------+--------+
       |                    |                      |              |                |
       |                    |                      |              |  n8n İş Akışı  |
       |                    |                      |              |                |
       |                    |                      |              |                |
       |                    |                      |              +-------+--------+
       |                    |                      |                      |
       |                    |                      |                      |
       |                    |                      |                      v
       |                    |                      |              +-------+--------+
       |                    |                      |              |                |
       |                    |                      |              | Optimizasyon   |
       |                    |                      |              | API (FastAPI)  |
       |                    |                      |              |                |
       |                    |                      |              +-------+--------+
       |                    |                      |                      |
       |                    |                      |                      |
       |                    |                      |                      |
       |                    |                      +----------------------+
       |                    |                      |
       |                    +----------------------+
       |                    |
       +--------------------+
```

### 7.2. Ölçeklendirme ve Performans İyileştirmeleri

Gelecek geliştirmeler arasında şunlar yer alabilir:

- Asenkron optimizasyon işlemleri için kuyruk sistemi
- Büyük veri setleri için bellek optimizasyonları
- Çoklu çözücü desteği ve paralel işleme
- Sonuçların önbelleğe alınması ve yeniden kullanımı

Bu mimari, bileşenlerin bağımsız olarak geliştirilmesini, test edilmesini ve farklı kurumsal ihtiyaçlara göre kolayca uyarlanmasını sağlar.
