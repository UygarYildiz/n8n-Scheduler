# Problem Tanımı: Otomatik Vardiya Çizelgeleme

**Amaç:** Belirli bir zaman periyodu (örn. bir hafta veya bir ay) için, mevcut personel ve tanımlanmış kurallar/kısıtlar çerçevesinde, operasyonel gereksinimleri karşılayan ve belirlenen hedefleri (maliyet, verimlilik, personel memnuniyeti vb.) optimize eden bir vardiya çizelgesi oluşturmak.

Bu tanım, farklı kurumlara (hastane, çağrı merkezi, üretim hattı vb.) uyarlanabilecek genel bir çerçeve sunmaktadır. Kuruma özel detaylar (roller, yetenekler, özel kurallar) büyük ölçüde konfigürasyon dosyaları ([docs/configuration.md](mdc:docs/configuration.md)) aracılığıyla yönetilecektir.

## 1. Girdiler (Inputs)

Optimizasyon modelinin ihtiyaç duyacağı temel bilgiler. Bu bilgiler genellikle standart bir JSON formatında ([docs/data_model.md](mdc:docs/data_model.md) - `input_data`) ve kuruma özel konfigürasyon dosyalarında ([docs/configuration.md](mdc:docs/configuration.md)) sağlanır.

*   **Personel (Employees/Staff):**
    *   Benzersiz ID (`employee_id`)
    *   Rol(ler)
    *   Yetenekler/Uzmanlıklar/Sertifikalar
    *   Uygunluk Durumu (Availability):
        *   Çalışılamayacak zamanlar (izinler, tatiller)
        *   Maksimum çalışma limitleri (saat/vardiya, gün/hafta/ay)
        *   Minimum/Maksimum ardışık çalışma
        *   Minimum dinlenme süresi
    *   Tercihler (Preferences - Yumuşak Kısıtlar):
        *   Tercih edilen/edilmeyen vardiyalar/günler
    *   Maliyet (opsiyonel, hedef için)

*   **Vardiyalar (Shifts):**
    *   Benzersiz ID (`shift_id`)
    *   Başlangıç ve Bitiş Zamanı
    *   Gün(ler)/Tarih(ler)
    *   Gereksinimler (Requirements - Genellikle Konfigürasyondan):
        *   Minimum/Tam/Maksimum personel sayısı (role/yeteneğe göre ayrıştırılmış)

*   **Kurallar ve Parametreler (Rules & Parameters - Genellikle Konfigürasyondan):**
    *   Genel Kurallar (örn. maks ardışık çalışma)
    *   Optimizasyon Parametreleri (örn. süre sınırı, hedef ağırlıkları)

## 2. Çıktılar (Outputs)

Optimizasyon süreci sonunda beklenen bilgiler ([docs/data_model.md](mdc:docs/data_model.md) - `solution`):

*   **Atama Kararları (Assignments):** `employee_id` ↔ `shift_id` eşleşmeleri.
*   **Çözüm Durumu (Status):** `OPTIMAL`, `FEASIBLE`, `INFEASIBLE` vb.
*   **Hedef Fonksiyon Değeri (Objective Value):** Optimize edilen değer.
*   **(İsteğe Bağlı) Karşılanamayan Yumuşak Kısıtlar:** İhlal edilen tercihler/kurallar.
*   **(İsteğe Bağlı) İstatistikler:** Raporlama için özet bilgiler.

## 3. Temel Kısıtlar (Hard Constraints - Mutlaka Sağlanmalı)

*   Vardiya gereksinimleri (min/tam personel) karşılanmalı.
*   Bir personel aynı anda tek vardiyada olabilir.
*   Uygun olmayan zamanlarda atama yapılamaz.
*   Çalışma limitleri (maks saat/vardiya, maks ardışık, min dinlenme) aşılamaz.

## 4. Hedefler (Objectives - Optimize Edilecekler)

Genellikle bir veya daha fazlası:

*   Maliyeti Minimize Etmek (fazla mesai, overstaffing vb.)
*   Personel Tercihlerini Maksimize Etmek
*   Karşılanamayan (yumuşak) Gereksinimleri Minimize Etmek
*   İş Yükünü Eşit Dağıtmak
*   Vardiya Doluluğunu Maksimize Etmek

Bu detaylı tanım, 2. ve 3. haftalardaki modelleme ve implementasyon çalışmaları için temel oluşturacaktır. 