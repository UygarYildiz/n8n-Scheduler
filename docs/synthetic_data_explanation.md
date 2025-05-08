# Yapay Veri Açıklaması (`synthetic_data` Klasörü)

Bu belge, `generate_synthetic_data.py` betiği tarafından `synthetic_data` klasörü içinde oluşturulan CSV dosyalarının yapısını ve içeriğini açıklar. Bu veriler, optimizasyon modelini test etmek ve n8n iş akışlarını geliştirmek için kullanılır.

## Dosyalar ve İçerikleri

### 1. `employees.csv`

*   **Amaç:** Sistemdeki çalışanları, ana rollerini ve departmanlarını listeler.
*   **Sütunlar:**
    *   `employee_id`: Çalışan için benzersiz kimlik (Örn: "E001", "E050" hastane veri seti için; "CM_E001", "CM_E080" çağrı merkezi veri seti için).
    *   `role`: Çalışanın ana rolü (Örn: Hastane için "Hemşire", "Doktor", "Teknisyen", "İdari"; Çağrı merkezi için "Çağrı Alıcı", "Yönlendirici", "Vardiya Amiri"). Roller ve dağılımları betikteki `ROLES` sözlüğünden gelir.
    *   `department`: Çalışanın bağlı olduğu departman (Örn: Hastane için "Acil", "Kardiyoloji", "Cerrahi"; Çağrı merkezi için "Genel Çağrı", "Polis Yönlendirme", "Sağlık Yönlendirme"). Departmanlar betikteki `DEPARTMENTS` sözlüğünden gelir.
    *   `name`: Çalışanın adı (Çağrı merkezi veri setinde bulunur, hastane veri setinde bulunmayabilir).

### 2. `skills.csv`

*   **Amaç:** Çalışanların sahip olduğu yetenekleri listeler. Bir çalışanın birden fazla yeteneği olabilir, bu nedenle her satır bir çalışan-yetenek eşleşmesidir.
*   **Sütunlar:**
    *   `employee_id`: Yeteneğe sahip olan çalışanın kimliği (`employees.csv`'deki ID'lere referans verir).
    *   `skill`: Çalışanın sahip olduğu yetenek (Örn: "Temel Hasta Bakımı", "Kardiyoloji Uzmanlığı", "Radyoloji Cihazı Kullanımı"). Yetenekler ve atanma mantığı betikteki `ROLE_SKILLS` yapısına göre belirlenir (zorunlu yetenekler + rolüne uygun rastgele seçmeli yetenekler).

### 3. `shifts.csv`

*   **Amaç:** Çizelgeleme periyodu içindeki tüm olası vardiyaları listeler.
*   **Sütunlar:**
    *   `shift_id`: Vardiya için benzersiz kimlik (Örn: "S0001", "S0025" hastane veri seti için; "CM_S0001", "CM_S0125" çağrı merkezi veri seti için).
    *   `name`: Vardiyanın adı (Örn: Hastane için "Gündüz Hafta İçi Acil", "Gece Hafta Sonu Kardiyoloji"; Çağrı merkezi için "Sabah Hafta İçi Genel Çağrı", "Akşam Hafta Sonu Polis Yönlendirme"). Betikteki `SHIFT_DEFINITIONS`'dan gelir.
    *   `date`: Vardiyanın gerçekleştiği tarih (ISO formatı, Örn: "YYYY-MM-DD").
    *   `start_time`: Vardiyanın başlangıç saati (ISO formatı, Örn: "HH:MM:SS").
    *   `end_time`: Vardiyanın bitiş saati (ISO formatı, Örn: "HH:MM:SS"). Vardiya gece yarısını aşıyorsa, bitiş saati bir sonraki güne ait olabilir (örn. başlangıç 20:00, bitiş 08:00).
    *   `department`: Vardiyanın ilgili olduğu departman (Örn: Hastane için "Acil", "Kardiyoloji", "Cerrahi"; Çağrı merkezi için "Genel Çağrı", "Polis Yönlendirme", "Sağlık Yönlendirme").

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

## Veri Setleri

Sistem iki farklı veri seti ile çalışabilir:

1. **Hastane Veri Seti** (`synthetic_data` klasörü):
   * `employees.csv`, `skills.csv`, `shifts.csv`, `availability.csv`, `preferences.csv`
   * Hastane departmanları ve rolleri içerir (Acil, Kardiyoloji, Cerrahi, vb.)
   * Dosya önekleri kullanılmaz (Örn: "E001", "S0001")

2. **Çağrı Merkezi Veri Seti** (`synthetic_data_cagri_merkezi` klasörü):
   * `employees_cm.csv`, `skills_cm.csv`, `shifts_cm.csv`, `availability_cm.csv`, `preferences_cm.csv`
   * Çağrı merkezi departmanları ve rolleri içerir (Genel Çağrı, Polis Yönlendirme, vb.)
   * Dosya önekleri "CM_" ile başlar (Örn: "CM_E001", "CM_S0001")

Her iki veri seti de aynı temel yapıyı kullanır, ancak içerik ve alan değerleri kuruma özgüdür. n8n iş akışı, seçilen veri setine göre doğru dosyaları okuyarak API'ye gönderilecek JSON yapısını oluşturur.