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

## Teknoloji Yığını (Önerilen)

*   **Otomasyon:** n8n
*   **Optimizasyon:** Python, Google OR-Tools (CP-SAT)
*   **API (Opt. Çekirdek):** Flask veya FastAPI (önerilen)
*   **Veri Formatı:** JSON

## Yol Haritası

Proje 5 haftalık bir yol haritası ile ilerleyecektir. Detaylar için [`docs/roadmap.md`](docs/roadmap.md) dosyasına bakınız.

## Kurulum ve Başlangıç

Geliştirme ortamı kurulumu için [`docs/setup.md`](docs/setup.md) dosyasına bakınız.

## Kapsam Notu: Kullanıcı Arayüzü

Bu projenin ilk fazı (5 haftalık yol haritası), çekirdek optimizasyon motorunun (Python/CP-SAT) ve otomasyon akışlarının (n8n) geliştirilmesine odaklanmaktadır. Son kullanıcılar (planlamacılar, personel vb.) için özel bir web tabanlı **kullanıcı arayüzü (UI)** geliştirilmesi bu ilk fazın **kapsamı dışındadır**. Veri girişi ve sonuçların sunumu için mevcut kurumsal sistemler, dosya tabanlı yöntemler veya n8n'in temel yetenekleri kullanılacaktır.

Kullanıcı arayüzü ihtiyacı ve gereksinimleri, projenin test ve değerlendirme aşamasında (5. Hafta) daha detaylı analiz edilecek ve potansiyel olarak **gelecek bir geliştirme fazı** olarak planlanacaktır.

## Dokümantasyon

Proje ile ilgili detaylı dokümantasyon `docs` klasöründe bulunmaktadır:

*   [`docs/architecture.md`](docs/architecture.md): Sistem Mimarisi
*   [`docs/data_model.md`](docs/data_model.md): Veri Modeli ve Arayüzler
*   [`docs/configuration.md`](docs/configuration.md): Konfigürasyon Yönetimi
*   [`docs/adaptability.md`](docs/adaptability.md): Uyarlanabilirlik Stratejileri
*   [`docs/roadmap.md`](docs/roadmap.md): Proje Yol Haritası
*   [`docs/setup.md`](docs/setup.md): Kurulum Rehberi 