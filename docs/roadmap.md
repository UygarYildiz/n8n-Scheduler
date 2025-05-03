# Proje Yol Haritası (5 Hafta)

Bu belge, projenin 5 haftalık geliştirme sürecini ve her haftanın hedeflerini özetlemektedir.

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
    *   ⏳ **(Beklemede)** n8n'de yapay veriyi okuyup standart [Veri Modeli](data_model.md) formatına dönüştüren temel bir iş akışı oluşturma.
    *   ✅ **(Tamamlandı)** Optimizasyon Çekirdeği için temel Python proje yapısının (API iskeleti) oluşturulması (`optimization_core/main.py`).
    *   ⏳ **(Beklemede)** Basit bir senaryo (az sayıda kısıt ile) için CP-SAT modelinin ilk kodlaması (Python).
    *   ⏳ **(Beklemede)** n8n'in Optimizasyon Çekirdeği'ni (API/CLI) tetikleyebilmesi ve basit bir "başarılı/başarısız" yanıt alabilmesi.
*   **Çıktılar:** Yapay veri üretici betiği, Python optimizasyon projesi iskeleti, n8n veri hazırlama akışı (taslak), temel CP-SAT model kodu (taslak), n8n-Python tetikleme mekanizması (taslak). **(Kısmen Tamamlandı ⏳)**

## 3. Hafta: CP-SAT ile Çekirdek Optimizasyon Mantığı ve Soyutlama

*   **Odak Alanı:** CP-SAT modelini tamamlama, konfigürasyon entegrasyonu, sonuç işleme.
*   **Hedefler:**
    *   1. Hafta'da belirlenen temel kısıtların ve hedef fonksiyonlarının CP-SAT modeline eklenmesi.
    *   [Konfigürasyon](configuration.md) dosyasından okunan parametrelere göre modelin dinamik olarak kısıt ekleyebilmesi (örn. minimum personel sayısı).
    *   CP-SAT çözücüsünü çağıran ve çözüm durumunu (OPTIMAL, FEASIBLE vb.) yakalayan kodun yazılması.
    *   Çözümün (örn. atamaların) [Veri Modeli](data_model.md)'nde tanımlanan standart JSON formatında dışarı aktarılması.
    *   Gerekliyse, farklı model varyasyonlarını yönetmek için basit bir soyutlama yapısının (örn. fonksiyonlar veya sınıflar) implementasyonu.
*   **Çıktılar:** Tamamlanmış (temel set için) CP-SAT modeli kodu, konfigürasyon okuma ve dinamik kısıt ekleme mantığı, standart formatta sonuç üreten kod, (varsa) soyutlama yapısının ilk versiyonu.

## 4. Hafta: n8n ile Uçtan Uca Otomasyon Akışları

*   **Odak Alanı:** n8n iş akışlarını tamamlama, veri almadan sonuç dağıtımına kadar tüm süreci otomatikleştirme.
*   **Hedefler:**
    *   n8n veri toplama/hazırlama akışının tamamlanması.
    *   Optimizasyon Çekirdeği'ni tetikleyen ve dönen standart sonucu yakalayan n8n adımlarının tamamlanması.
    *   Optimizasyon sonuçlarını işleyen (örn. basit raporlama veya belirli alanları ayıklama) n8n akışının oluşturulması.
    *   Sonuçların örnek hedef sistemlere (örn. bir veritabanı tablosuna yazma, e-posta ile gönderme) n8n aracılığıyla iletilmesi.
    *   Temel hata yönetimi mekanizmalarının (örn. optimizasyon başarısız olursa bildirim) n8n akışına eklenmesi.
    *   Uçtan uca akışın yapay veri ile test edilmesi.
*   **Çıktılar:** Tamamlanmış n8n iş akışları (veri al → optimize et → sonuç dağıt), örnek sistem entegrasyonları, test edilmiş otomasyon akışı.

## 5. Hafta: Test, İyileştirme ve Kurumsal Uyarlanabilirlik

*   **Odak Alanı:** Kapsamlı test, performans değerlendirme, iyileştirmeler ve dokümantasyon.
*   **Hedefler:**
    *   Farklı konfigürasyonlar ve yapay veri setleri (farklı kurumları/zorlukları simüle eden) ile sistemin kapsamlı test edilmesi.
    *   Optimizasyon süresi, çözüm kalitesi ve otomasyon akışının güvenilirliği açısından performansı değerlendirme.
    *   Test sonuçlarına göre CP-SAT modelinde, Python kodunda veya n8n akışlarında gerekli iyileştirmeleri (performans, doğruluk) yapma.
    *   Hata ayıklama ve kod temizliği.
    *   Projenin farklı kurumlara nasıl kurulacağı, nasıl konfigüre edileceği ve veri entegrasyonunun nasıl yapılacağına dair detaylı bir "Kurumsal Uyarlanabilirlik Rehberi" veya dokümantasyon hazırlama.
    *   Projenin esneklik avantajlarını (açık kaynak CP-SAT kullanımı, modüler yapı, konfigüre edilebilirlik) vurgulama.
*   **Çıktılar:** Kapsamlı test raporları, iyileştirilmiş proje kodu ve n8n akışları, detaylı kurumsal uyarlanabilirlik dokümantasyonu. 