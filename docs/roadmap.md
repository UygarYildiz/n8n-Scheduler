# Proje Yol Haritası (6 Hafta)

Bu belge, projenin 6 haftalık geliştirme sürecini ve her haftanın hedeflerini özetlemektedir.

## 1. Hafta: Temelleri Atma ve Problem Alanını Anlama (✅ Tamamlandı)

*   **Odak Alanı:** Proje kapsamını netleştirme, teknoloji seçimi, geliştirme ortamı kurulumu, optimizasyon problem(ler)ini ve kurumsal varyasyonları anlama.
*   **Hedefler:**
    *   ✅ **(Tamamlandı)** Geliştirme ortamının kurulumu (n8n, Python, OR-Tools/CP-SAT, Git).
    *   ✅ **(Tamamlandı)** CP-SAT temelleri üzerine araştırma ve öğrenme.
    *   ✅ **(Tamamlandı)** Çözülecek ana optimizasyon problemi(lerinin) (örn. vardiya çizelgeleme) detaylı tanımı.
    *   ✅ **(Tamamlandı)** Farklı kurumlardaki (örn. hastane, çağrı merkezi) olası kısıt ve hedef farklılıklarının belirlenmesi (Konfigürasyon ile yönetilecek şekilde planlandı).
    *   ✅ **(Tamamlandı)** [Sistem Mimarisi](architecture.md)'nin netleştirilmesi ve onaylanması.
    *   ✅ **(Tamamlandı)** [Veri Modeli](data_model.md) ve [Konfigürasyon](configuration.md) yaklaşımlarının belirlenmesi.
*   **Çıktılar:** Kurulumu yapılmış geliştirme ortamı, problem tanımı dokümanı (`docs/problem_definition.md`), onaylanmış mimari (`docs/architecture.md`), onaylanmış veri modeli (`docs/data_model.md`) ve konfigürasyon (`docs/configuration.md`) belgeleri, CP-SAT temelleri özeti (`docs/cp_sat_basics.md`), dinamik güncelleme notları (`docs/dynamic_updates.md`). **(✅ Tamamlandı)**

## 2. Hafta: Veri Entegrasyonu ve Modelleme Başlangıcı

*   **Odak Alanı:** Yapay veri oluşturma, n8n ile temel veri akışı, CP-SAT ile basit model kodlama.
*   **Hedefler:**
    *   ✅ **(Tamamlandı)** Test ve geliştirme için yapay veri üreten bir mekanizma (Python script) oluşturma (`generate_synthetic_data.py`).
    *   ✅ **(Tamamlandı)** n8n'de yapay veriyi okuyup standart [Veri Modeli](data_model.md) formatına dönüştüren temel bir iş akışı oluşturma.
    *   ✅ **(Tamamlandı)** Optimizasyon Çekirdeği için temel Python proje yapısının (API iskeleti) oluşturulması (`optimization_core/main.py`).
    *   ✅ **(Tamamlandı)** Basit bir senaryo (az sayıda kısıt ile) için CP-SAT modelinin ilk kodlaması (Python) (`optimization_core/cp_model_builder.py`).
    *   ✅ **(Tamamlandı)** n8n'in Optimizasyon Çekirdeği'ni (API/CLI) tetikleyebilmesi ve basit bir "başarılı/başarısız" yanıt alabilmesi.
*   **Çıktılar:** Yapay veri üretici betiği, Python optimizasyon projesi iskeleti, n8n veri hazırlama akışı, temel CP-SAT model kodu, n8n-Python tetikleme mekanizması. **(✅ Tamamlandı)**

## 3. Hafta: CP-SAT ile Çekirdek Optimizasyon Mantığı ve Soyutlama

*   **Odak Alanı:** CP-SAT modelini tamamlama, konfigürasyon entegrasyonu, sonuç işleme.
*   **Hedefler:**
    *   ✅ **(Tamamlandı)** 1. Hafta'da belirlenen temel kısıtların ve hedef fonksiyonlarının CP-SAT modeline eklenmesi.
    *   ✅ **(Tamamlandı)** [Konfigürasyon](configuration.md) dosyasından okunan parametrelere göre modelin dinamik olarak kısıt ekleyebilmesi (örn. minimum personel sayısı).
    *   ✅ **(Tamamlandı)** CP-SAT çözücüsünü çağıran ve çözüm durumunu (OPTIMAL, FEASIBLE vb.) yakalayan kodun yazılması.
    *   ✅ **(Tamamlandı)** Çözümün (örn. atamaların) [Veri Modeli](data_model.md)'nde tanımlanan standart JSON formatında dışarı aktarılması.
    *   ✅ **(Tamamlandı)** Farklı model varyasyonlarını yönetmek için basit bir soyutlama yapısının (örn. fonksiyonlar veya sınıflar) implementasyonu (`ShiftSchedulingModelBuilder` sınıfı).
    *   ✅ **(Tamamlandı)** Temel metrik hesaplama mantığının eklenmesi (`MetricsOutput` sınıfı).
*   **Çıktılar:** Tamamlanmış (temel set için) CP-SAT modeli kodu, konfigürasyon okuma ve dinamik kısıt ekleme mantığı, standart formatta sonuç üreten kod, soyutlama yapısının ilk versiyonu. **(✅ Tamamlandı)**

## 4. Hafta: n8n ile Uçtan Uca Otomasyon Akışları (✅ Tamamlandı)

*   **Odak Alanı:** n8n iş akışlarını tamamlama, veri almadan sonuç dağıtımına kadar tüm süreci otomatikleştirme.
*   **Hedefler:**
    *   ✅ **(Tamamlandı)** n8n veri toplama/hazırlama akışının tamamlanması.
    *   ✅ **(Tamamlandı)** Optimizasyon Çekirdeği'ni tetikleyen ve dönen standart sonucu yakalayan n8n adımlarının tamamlanması.
    *   ✅ **(Tamamlandı)** Optimizasyon sonuçlarını işleyen (örn. basit raporlama veya belirli alanları ayıklama) n8n akışının oluşturulması.
    *   ✅ **(Tamamlandı)** Webhook tabanlı dinamik parametre alma mekanizmasının eklenmesi.
    *   ✅ **(Tamamlandı)** Farklı veri setleri (hastane, çağrı merkezi) için dinamik dosya yolu yapılandırması.
    *   ✅ **(Tamamlandı)** Uçtan uca akışın yapay veri ile test edilmesi.
*   **Çıktılar:** Tamamlanmış n8n iş akışları (veri al → optimize et → sonuç dağıt), webhook tabanlı dinamik parametre alma, test edilmiş otomasyon akışı. **(✅ Tamamlandı)**

## 5. Hafta: Kullanıcı Arayüzü Tasarımı ve Geliştirme

*   **Odak Alanı:** Son kullanıcılar için web tabanlı kullanıcı arayüzü tasarımı ve geliştirme.
*   **Hedefler:**
    *   **Aşama 1: Tasarım ve Prototipleme (İlk Yarı)**
        *   UI/UX tasarım şablonlarının oluşturulması.
        *   Temel bileşenlerin prototiplenmesi.
        *   Kullanıcı akışlarının doğrulanması.
    *   **Aşama 2: Temel Bileşenlerin Geliştirilmesi (İkinci Yarı)**
        *   Temel sayfa yapısı ve gezinme (Navbar, Sidebar, Ana İçerik Alanı).
        *   Veri seti ve konfigürasyon seçim ekranı.
        *   Optimizasyon parametreleri ayarlama formu.
        *   Kullanıcı arayüzünün n8n webhook'ları ile temel entegrasyonu.
*   **Çıktılar:**
    *   Kullanıcı arayüzü tasarım dokümanı ve prototipleri.
    *   Temel sayfa yapısı ve gezinme bileşenleri.
    *   Veri seti ve konfigürasyon yönetimi ekranları.
    *   Optimizasyon parametreleri formu.
    *   n8n webhook entegrasyonu için temel altyapı.

## 6. Hafta: Kullanıcı Arayüzü Tamamlama, Test ve İyileştirme

*   **Odak Alanı:** Kullanıcı arayüzünün tamamlanması, görselleştirme, entegrasyon, test ve iyileştirmeler.
*   **Hedefler:**
    *   **Aşama 3: Görselleştirme ve Raporlama (İlk Yarı)**
        *   Metrik görselleştirmeleri ve grafikler.
        *   Vardiya çizelgesi takvim görünümü.
        *   Sonuç görselleştirme ve raporlama paneli.
        *   Rapor oluşturma ve dışa aktarma araçları.
    *   **Aşama 4: Entegrasyon ve Test (İkinci Yarı)**
        *   API entegrasyonunun tamamlanması.
        *   n8n webhook bağlantılarının iyileştirilmesi.
        *   Temel kullanıcı yetkilendirme ve kimlik doğrulama mekanizması.
        *   Kullanıcı testleri ve geri bildirim.
        *   Farklı cihazlarda (masaüstü, tablet) test edilmesi.
        *   Hata düzeltmeleri ve performans iyileştirmeleri.
        *   Kullanıcı arayüzü ile entegre edilmiş tam sistemin kapsamlı testi.
*   **Çıktılar:**
    *   Tamamlanmış web tabanlı kullanıcı arayüzü.
    *   Metrik görselleştirmeleri ve grafikler.
    *   Vardiya çizelgesi görüntüleme ve düzenleme arayüzü.
    *   Rapor oluşturma ve dışa aktarma araçları.
    *   Kullanıcı kılavuzu ve dokümantasyon.
    *   Test raporları ve iyileştirme belgeleri.
    *   Tam entegre ve test edilmiş sistem.