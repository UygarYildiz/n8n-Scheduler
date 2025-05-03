# Yapay Veri Açıklaması (`synthetic_data` Klasörü)

Bu belge, `generate_synthetic_data.py` betiği tarafından `synthetic_data` klasörü içinde oluşturulan CSV dosyalarının yapısını ve içeriğini açıklar. Bu veriler, optimizasyon modelini test etmek ve n8n iş akışlarını geliştirmek için kullanılır.

## Dosyalar ve İçerikleri

### 1. `employees.csv`

*   **Amaç:** Sistemdeki çalışanları ve ana rollerini listeler.
*   **Sütunlar:**
    *   `employee_id`: Çalışan için benzersiz kimlik (Örn: "E001", "E050").
    *   `role`: Çalışanın ana rolü (Örn: "Hemşire", "Doktor", "Teknisyen", "İdari"). Roller ve dağılımları betikteki `ROLES` sözlüğünden gelir.

### 2. `skills.csv`

*   **Amaç:** Çalışanların sahip olduğu yetenekleri listeler. Bir çalışanın birden fazla yeteneği olabilir, bu nedenle her satır bir çalışan-yetenek eşleşmesidir.
*   **Sütunlar:**
    *   `employee_id`: Yeteneğe sahip olan çalışanın kimliği (`employees.csv`'deki ID'lere referans verir).
    *   `skill`: Çalışanın sahip olduğu yetenek (Örn: "Temel Hasta Bakımı", "Kardiyoloji Uzmanlığı", "Radyoloji Cihazı Kullanımı"). Yetenekler ve atanma mantığı betikteki `ROLE_SKILLS` yapısına göre belirlenir (zorunlu yetenekler + rolüne uygun rastgele seçmeli yetenekler).

### 3. `shifts.csv`

*   **Amaç:** Çizelgeleme periyodu içindeki tüm olası vardiyaları listeler.
*   **Sütunlar:**
    *   `shift_id`: Vardiya için benzersiz kimlik (Örn: "S0001", "S0025").
    *   `name`: Vardiyanın adı (Örn: "Gündüz Hafta İçi", "Gece Hafta Sonu"). Betikteki `SHIFT_DEFINITIONS`'dan gelir.
    *   `date`: Vardiyanın gerçekleştiği tarih (ISO formatı, Örn: "YYYY-MM-DD").
    *   `start_time`: Vardiyanın başlangıç saati (ISO formatı, Örn: "HH:MM:SS").
    *   `end_time`: Vardiyanın bitiş saati (ISO formatı, Örn: "HH:MM:SS"). Vardiya gece yarısını aşıyorsa, bitiş saati bir sonraki güne ait olabilir (örn. başlangıç 20:00, bitiş 08:00).

### 4. `availability.csv`

*   **Amaç:** Her çalışanın, çizelgeleme periyodundaki her gün için çalışıp çalışamayacağını belirtir.
*   **Sütunlar:**
    *   `employee_id`: Çalışanın kimliği.
    *   `date`: İlgili günün tarihi (ISO formatı).
    *   `is_available`: Çalışanın o gün çalışıp çalışamayacağını gösteren değer (1: Müsait, 0: Müsait Değil - İzinli/Raporlu vb.). İzinli günler betikteki `AVG_DAYS_OFF_PER_PERIOD` parametresine göre rastgele atanır.

### 5. `preferences.csv`

*   **Amaç:** Çalışanların belirli vardiyalara yönelik tercihlerini listeler. Tüm çalışanların tercihi olmayabilir.
*   **Sütunlar:**
    *   `employee_id`: Tercihi belirten çalışanın kimliği.
    *   `shift_id`: Tercihin ilgili olduğu vardiyanın kimliği (`shifts.csv`'deki ID'lere referans verir).
    *   `preference_score`: Tercihin gücünü veya yönünü belirten sayısal değer (Örn: 1 = Bu vardiyayı istiyor, -1 = Bu vardiyayı istemiyor). Tercih belirtme olasılığı ve skorları betikteki `PREFERENCE_PROBABILITY` ve ilgili mantıkla belirlenir.

## Kullanım

Bu CSV dosyaları, n8n iş akışları tarafından okunacak ve `docs/data_model.md`'de tanımlanan standart JSON formatındaki `input_data` yapısını oluşturmak için birleştirilecektir. Bu JSON verisi daha sonra Python Optimizasyon Çekirdeği'ne gönderilecektir. 