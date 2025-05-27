# Kurumsal Optimizasyon ve Otomasyon Çözümü (CP-SAT & n8n Destekli)

## Proje Hedefi

Farklı kurumların (örneğin hastaneler, üretim tesisleri, lojistik firmaları) operasyonel süreçlerindeki karmaşık optimizasyon problemlerini (çizelgeleme, rotalama vb.), güçlü bir Kısıt Programlama çözücüsü olan Google OR-Tools CP-SAT kullanarak otomatik ve esnek bir şekilde çözmek. Çözüm sürecini n8n platformu ile uçtan uca otomatikleştirmek ve projenin farklı kurumlara kolayca adapte edilebilirliğini maksimize etmek.

## Ana Bileşenler ve Mimari

Proje, üç ana bileşenden oluşan modüler bir yapıya sahiptir:

1.  **Veri Toplama ve Ön İşleme (n8n):** Kuruma özel kaynaklardan (Veritabanı, API, Dosya vb.) veri toplar, doğrular ve standart bir formata dönüştürür.
2.  **Optimizasyon Çekirdeği (Python/CP-SAT):** Standart veriyi alır, kuruma özel konfigürasyonları yükler, CP-SAT modelini dinamik olarak kurar, çözümü bulur ve standart bir sonuç formatı döner. Bu çekirdek, bir API (örn. Flask/FastAPI) aracılığıyla veya komut satırı arayüzü ile n8n tarafından tetiklenebilir.
3.  **Sonuç İşleme ve Dağıtım (n8n):** Optimizasyon sonuçlarını alır, kuruma özel raporlar oluşturur veya ilgili sistemlere (Veritabanı, API, E-posta vb.) iletir.

Detaylı mimari açıklaması için [`docs/architecture.md`](docs/architecture.md) dosyasına bakınız.

## Uyarlanabilirlik ve Esneklik

Projenin farklı kurumlara uyarlanabilirliği şu prensiplerle sağlanır:

*   **Modülerlik:** Bileşenlerin bağımsızlığı.
*   **Konfigürasyon:** Kuruma özel parametrelerin (örn. minimum personel sayısı, hedef fonksiyon ağırlıkları) dışarıdan (dosya veya API) tanımlanması.
*   **Standart Arayüzler:** Bileşenler arası tutarlı veri formatları (JSON).
*   **Dinamik Model Oluşturma:** CP-SAT modelinin konfigürasyona göre dinamik olarak kısıtlar eklemesi.
*   **n8n Esnekliği:** Farklı veri kaynakları ve hedef sistemlerle kolay entegrasyon.

Detaylar için [`docs/adaptability.md`](docs/adaptability.md) ve [`docs/configuration.md`](docs/configuration.md) dosyalarına bakınız.

## Teknoloji Yığını

*   **Otomasyon:** n8n (1.91.2)
*   **Optimizasyon:** Python, Google OR-Tools (CP-SAT)
*   **API (Opt. Çekirdek):** FastAPI
*   **Veri Formatı:** JSON
*   **Kullanıcı Arayüzü:** React.js
*   **Konteynerizasyon:** Docker

## Yol Haritası

Proje 7 haftalık bir yol haritası ile ilerlemektedir. Detaylar için [`docs/roadmap.md`](docs/roadmap.md) dosyasına bakınız.

## Kurulum ve Başlangıç

Geliştirme ortamı kurulumu için [`docs/setup.md`](docs/setup.md) dosyasına bakınız.

## Kullanıcı Arayüzü

Projenin ilk 4 haftası, çekirdek optimizasyon motorunun (Python/CP-SAT) ve otomasyon akışlarının (n8n) geliştirilmesine odaklanmıştır. Sonraki 5. ve 6. haftalarda ise, son kullanıcılar (yöneticiler, planlamacılar, personel vb.) için özel bir web tabanlı **kullanıcı arayüzü (UI)** geliştirilmektedir.

Kullanıcı arayüzü, aşağıdaki temel özellikleri içermektedir:
- Kurum seçimi (hastane, çağrı merkezi vb.)
- Çizelgeleme hedefi seçimi (dengeli, çalışan odaklı, verimlilik odaklı vb.)
- Sonuçları görselleştirme ve raporlama paneli
- Vardiya çizelgesi görüntüleme arayüzü
- Başarılı/başarısız çizelgeleme geri bildirimi
- Temel metrik görselleştirmeleri ve grafikler

Tamamlanan özellikler:
- ✅ **Rapor oluşturma ve dışa aktarma araçları** (Excel, PDF, yazdırma desteği)
- ✅ **Kapsamlı kullanıcı yetkilendirme ve kimlik doğrulama sistemi** (JWT, rol tabanlı erişim, session yönetimi)
- ✅ **Responsive tasarım ve çoklu cihaz desteği** (masaüstü, tablet, mobil)
- ✅ **TypeScript ile tip güvenliği ve performans optimizasyonları**

Kullanıcı arayüzü, n8n webhook'ları ile entegre çalışmakta ve optimizasyon sonuçlarını kullanıcı dostu bir şekilde sunmaktadır. Arayüz tasarımı ve gereksinimleri [`docs/ui_design.md`](docs/ui_design.md) dosyasında detaylandırılmıştır.

## Dokümantasyon

Proje ile ilgili detaylı dokümantasyon `docs` klasöründe bulunmaktadır:

*   [`docs/architecture.md`](docs/architecture.md): Sistem Mimarisi
*   [`docs/data_model.md`](docs/data_model.md): Veri Modeli ve Arayüzler
*   [`docs/configuration.md`](docs/configuration.md): Konfigürasyon Yönetimi
*   [`docs/adaptability.md`](docs/adaptability.md): Uyarlanabilirlik Stratejileri
*   [`docs/roadmap.md`](docs/roadmap.md): Proje Yol Haritası
*   [`docs/setup.md`](docs/setup.md): Kurulum Rehberi
*   [`docs/n8n_workflow_guide.md`](docs/n8n_workflow_guide.md): n8n İş Akışı Kullanım Kılavuzu
*   [`docs/n8n_workflow_design.md`](docs/n8n_workflow_design.md): n8n İş Akışı Tasarımı
*   [`docs/metrics.md`](docs/metrics.md): Metrik Tanımları ve Hesaplama Yöntemleri
*   [`docs/ui_design.md`](docs/ui_design.md): Kullanıcı Arayüzü Tasarımı ve Gereksinimleri

## Proje Durumu

Proje, 7 haftalık yol haritasının 6. haftasını başarıyla tamamlamıştır:

- ✅ **1. Hafta**: Temelleri Atma ve Problem Alanını Anlama
- ✅ **2. Hafta**: Veri Entegrasyonu ve Modelleme Başlangıcı
- ✅ **3. Hafta**: CP-SAT ile Çekirdek Optimizasyon Mantığı ve Soyutlama
- ✅ **4. Hafta**: n8n ile Uçtan Uca Otomasyon Akışları
- ✅ **5. Hafta**: Kullanıcı Arayüzü Tasarımı ve Geliştirme
- ✅ **6. Hafta**: Kullanıcı Arayüzü Tamamlama, Test ve İyileştirme
- 🔄 **7. Hafta**: Veri Modeli Zenginleştirme ve Esneklik İyileştirmeleri (Devam Ediyor)

### Güncel Durum ve Gelişmeler

- **n8n İş Akışı**:
  * ✅ Webhook tabanlı dinamik parametre alma sistemi
  * ✅ Departman istatistikleri oluşturma
  * ✅ Eksik personel tespiti

- **Optimizasyon API'si**:
  * ✅ Farklı veri setleri için dinamik dosya yolu yapılandırması
  * ✅ Konfigürasyon dosyası referansının dinamik iletimi

- **Veri Modeli**:
  * ✅ Hastane ve çağrı merkezi veri setleri desteği
  * ✅ Departman bazlı personel ve yetenek gereksinimleri

- **Üretim Ortamı**:
  * ✅ Webhook ve API bağlantıları yapılandırması
  * ✅ Docker entegrasyonu (n8n 1.91.2)

- **Kullanıcı Arayüzü**:
  * ✅ Tam fonksiyonel React + TypeScript + Material UI arayüzü
  * ✅ Kapsamlı metrik görselleştirmeleri ve interaktif grafikler
  * ✅ Gelişmiş vardiya çizelgesi görüntüleme ve düzenleme
  * ✅ Tam özellikli rapor oluşturma ve dışa aktarma (Excel, PDF, yazdırma)
  * ✅ Güvenli kullanıcı yetkilendirme ve session yönetimi (JWT, rol tabanlı erişim)
  * ✅ Responsive tasarım ve çoklu cihaz desteği
  * ✅ Performans optimizasyonları ve hata yönetimi

- **Veri Modeli İyileştirmeleri (7. Hafta)**:
  * 📅 Çalışan profili ve vardiya tanımları zenginleştirme (Planlandı)
  * 📅 İzin/tercih sisteminin geliştirilmesi (Planlandı)