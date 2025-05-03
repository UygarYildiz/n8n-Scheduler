# Dinamik Güncelleme Senaryoları ve Yaklaşımları

Bu belge, otomatik vardiya çizelgeleme sürecinde karşılaşılabilecek dinamik güncelleme ihtiyaçlarını ve bunlara yönelik potansiyel çözüm yaklaşımlarını özetlemektedir. Bu konular, projenin ilerleyen aşamalarında (özellikle 4. ve 5. haftalarda) detaylandırılacaktır.

## Senaryo 1: Planlama Öncesi Kural/Gereksinim Güncellemesi

*   **Durum:** Bir sonraki çizelgeleme dönemi (örn. gelecek ay) başlamadan önce, vardiya tanımları, personel gereksinimleri veya genel kurallar değişir.
    *   Örnek: Pazartesi gündüz vardiyası için minimum hemşire sayısı 2'den 3'e çıkar.
    *   Örnek: Yeni bir "Uzaktan Destek" vardiyası eklenir.
    *   Örnek: Maksimum ardışık çalışma günü 6'dan 5'e düşürülür.
*   **Yaklaşım:**
    1.  İlgili kurumun **konfigürasyon dosyası (`.yaml`/`.json`)** güncellenir.
    2.  Bir sonraki planlama dönemi için n8n iş akışı tetiklendiğinde, bu güncel konfigürasyon okunur.
    3.  Python Optimizasyon Çekirdeği, yeni kurallara/gereksinimlere göre modeli kurar ve çizelgeyi oluşturur.
*   **Not:** Bu yaklaşım, mevcut yayınlanmış çizelgeyi etkilemez, sadece gelecekteki planlamaları etkiler.

## Senaryo 2: Yayınlanmış Çizelgede Ani Değişiklik İhtiyacı

*   **Durum:** Çizelge oluşturulup yayınlandıktan sonra beklenmedik durumlar ortaya çıkar.
    *   Örnek: Bir personel hastalanır, vardiyası boş kalır.
    *   Örnek: Beklenmedik yoğunluk nedeniyle acil ek personele ihtiyaç duyulur.
    *   Örnek: İki personel kendi aralarında vardiya değiştirmek ister.
*   **Potansiyel Çözüm Yaklaşımları:**

    *   **A. Odaklanmış Tekrar Optimizasyon (Re-Optimization):**
        *   **Ne Yapar:** Mevcut çizelge durumu ve yeni değişiklik (personel eksikliği, ek talep) girdi olarak alınır. Python Çekirdeği, *tüm kuralları* (maks saat, min dinlenme, yetenek vb.) dikkate alarak, mevcut çizelgeye **en az değişiklikle** yeni durumu karşılayacak şekilde odaklanmış bir optimizasyon çalıştırır. Boş vardiyayı dolduracak veya ek talebi karşılayacak en uygun kişiyi/atamayı bulur.
        *   **Avantajları:** Kurallara en uygun, optimize edilmiş çözümü bulur.
        *   **Dezavantajları:** Anlık ihtiyaçlar için biraz yavaş olabilir (çözücü süresine bağlı). Uygulaması diğerlerine göre daha karmaşıktır.
        *   **Uygunluk:** Kapsamlı ve katı kuralların olduğu, optimal çözümün önemli olduğu durumlar.

    *   **B. Öneri Motoru:**
        *   **Ne Yapar:** Değişiklik (örn. boş kalan vardiya) algılanır. Sistem (n8n veya basit Python betiği), mevcut çizelgeyi ve personel uygunluğunu kontrol eder. Boş kalan vardiyanın gereksinimlerini karşılayan, o an müsait olan ve temel kuralları (çalışma limiti, dinlenme süresi) ihlal etmeyecek **potansiyel adayların listesini** oluşturur.
        *   **Avantajları:** Çok hızlıdır. Karar vericiye (yöneticiye) seçenekler sunar.
        *   **Dezavantajları:** Tamamen otomatik değildir, son karar ve iletişim yöneticiye aittir. En optimize çözümü garanti etmez.
        *   **Uygunluk:** Acil durumlarda hızlı reaksiyon gereken veya yöneticinin son kararı vermesinin istendiği durumlar.

    *   **C. Vardiya Değişim Doğrulaması:**
        *   **Ne Yapar:** İki personel arasındaki değişim talebi alınır. Sistem (n8n veya basit Python betiği), bu değişimin önceden tanımlanmış **katı kurallara** (yetenek uygunluğu, çalışma limiti ihlali, dinlenme süresi ihlali vb.) uyup uymadığını **doğrular**.
        *   **Avantajları:** Basit ve hızlıdır. Personel arası değişimler gibi net kurallara bağlı istekler için etkilidir.
        *   **Dezavantajları:** Sadece belirli bir senaryoyu (değişim talebi) ele alır. Karmaşık durumları çözmez.
        *   **Uygunluk:** Personelin kendi arasındaki vardiya değişim taleplerini yönetmek.

*   **Uygulama Notu:** Gerçek dünyada, bu yaklaşımların bir kombinasyonu kullanılabilir. Hangi yaklaşımın seçileceği, değişikliğin aciliyetine, karmaşıklığına ve kurumun iş akışlarına bağlı olacaktır. Bu özellikler geliştirilirken kullanıcı arayüzü ve bildirim mekanizmaları da dikkatlice tasarlanmalıdır. 