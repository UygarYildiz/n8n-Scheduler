# Veri Modeli ve Arayüzler

Bu belge, n8n ve Optimizasyon Çekirdeği arasındaki veri alışverişi için kullanılacak standart JSON formatlarını ve arayüzleri tanımlar.

## 1. n8n -> Optimizasyon Çekirdeği (İstek Formatı)

n8n tarafından Optimizasyon Çekirdeği'ne gönderilecek verinin (API isteği gövdesi veya CLI için girdi dosyası) önerilen temel yapısı:

```json
{
  "configuration_ref": "path/to/hastane_A_config.json", // İsteğe bağlı: Konfig dosyası referansı
  "configuration": { ... }, // İsteğe bağlı: Konfig doğrudan gönderilirse
  "input_data": {
    // Probleme özgü veri yapısı burada tanımlanır.
    // Örnek: Hastane Vardiya Çizelgeleme
    "employees": [
      {"employee_id": "E001", "role": "Doktor", "department": "Acil", "name": "Çalışan 1"},
      {"employee_id": "E002", "role": "Hemşire", "department": "Acil", "name": "Çalışan 2"}
      // ... diğer çalışanlar
    ],
    "skills": [
      {"employee_id": "E001", "skill": "Teşhis ve Tedavi"},
      {"employee_id": "E001", "skill": "İlk Yardım Sertifikası"},
      {"employee_id": "E002", "skill": "Temel Hasta Bakımı"}
      // ... diğer yetenekler
    ],
    "shifts": [
      {"shift_id": "S0001", "name": "Gündüz Hafta İçi Acil", "date": "2025-05-06", "start_time": "08:00:00", "end_time": "16:00:00", "department": "Acil"},
      {"shift_id": "S0002", "name": "Gündüz Hafta İçi Kardiyoloji", "date": "2025-05-06", "start_time": "08:00:00", "end_time": "16:00:00", "department": "Kardiyoloji"}
      // ... diğer vardiyalar
    ],
    "availability": [
      {"employee_id": "E001", "date": "2025-05-06", "is_available": 1},
      {"employee_id": "E001", "date": "2025-05-07", "is_available": 0}
      // ... diğer uygunluk bilgileri
    ],
    "preferences": [
      {"employee_id": "E001", "shift_id": "S0065", "preference_score": -1},
      {"employee_id": "E001", "shift_id": "S0004", "preference_score": 1}
      // ... diğer tercihler
    ],
    "required_skills": [
      {"shift_id": "S0001", "role": "Hemşire", "min_count": 5},
      {"shift_id": "S0001", "skill": "Kardiyoloji", "min_count": 1}
      // ... diğer gereksinimler (Bu kısım konfigürasyondan da gelebilir)
    ]
    // ... probleme özel diğer veri alanları
  }
}
```

**Açıklamalar:**

*   `configuration_ref` veya `configuration`: Kuruma özel parametreleri ve kısıtları içerir. İkisinden biri veya ikisi birden kullanılabilir (doğrudan gönderilen değerler dosyadakileri geçersiz kılabilir).
*   `input_data`: Optimizasyon modelinin ihtiyaç duyduğu asıl veriyi içerir. Yapısı çözülecek probleme göre (çizelgeleme, rotalama vb.) değişiklik gösterir. Yukarıdaki örnek hastane çizelgeleme içindir.
*   `input_data` içindeki alanlar şunları içerir:
    * `employees`: Çalışanların temel bilgilerini içerir (kimlik, rol, departman, isim).
    * `skills`: Çalışanların sahip olduğu yetenekleri listeler. Bir çalışanın birden fazla yeteneği olabilir.
    * `shifts`: Çizelgeleme periyodu içindeki tüm vardiyaları listeler (kimlik, isim, tarih, başlangıç/bitiş saati, departman).
    * `availability`: Her çalışanın, çizelgeleme periyodundaki her gün için çalışıp çalışamayacağını belirtir.
    * `preferences`: Çalışanların belirli vardiyalara yönelik tercihlerini listeler.
    * `required_skills`: Vardiyalar için gerekli minimum yetenek ve rol gereksinimlerini belirtir.
*   **Önemli:** `input_data` içindeki yapı, farklı kurumların benzer problemlerini (örn. hastane ve çağrı merkezi çizelgeleme ihtiyacı) karşılayacak kadar genel ve esnek olmalıdır. Örneğin, departman isimleri ve roller kuruma göre değişebilir.

## 2. Optimizasyon Çekirdeği -> n8n (Yanıt Formatı)

Optimizasyon Çekirdeği'nin n8n'e döndüreceği standart JSON yanıt formatı:

```json
{
  "status": "OPTIMAL", // "FEASIBLE", "INFEASIBLE", "MODEL_INVALID", "ERROR"
  "solver_status_message": "Optimal solution found.", // Çözücüden gelen mesaj
  "processing_time_seconds": 125.6,
  "objective_value": 45.7, // Hedef fonksiyon değeri (eğer varsa)
  "solution": {
    // Probleme özgü çözüm yapısı
    // Örnek: Hastane Vardiya Çizelgeleme
    "assignments": [
      {"employee_id": "E001", "shift_id": "S0001"},
      {"employee_id": "E002", "shift_id": "S0001"}
      // ... diğer atamalar
    ],
    "unassigned_shifts": ["S0005"],
    "violated_soft_constraints": [
      {"constraint_type": "preference", "employee_id": "E003", "details": "İstenmeyen vardiya atandı"}
    ]
    // ... probleme özel diğer sonuç detayları
  },
  "error_details": null // Hata durumunda detaylar
}
```

**Açıklamalar:**

*   `status`: Optimizasyon sürecinin genel durumunu belirtir.
*   `solver_status_message`: CP-SAT çözücüsünün döndüğü durum hakkında daha detaylı bilgi verir.
*   `processing_time_seconds`: Çözümün ne kadar sürdüğü.
*   `objective_value`: Modelin optimize ettiği değer (örn. minimize edilen maliyet, maksimize edilen karşılama oranı).
*   `solution`: Çözümün kendisi. Yapısı probleme özeldir. Yukarıdaki örnek, hangi çalışanın hangi vardiyaya atandığını gösterir.
*   `error_details`: Eğer `status` "ERROR" veya "INFEASIBLE" gibi bir durumsa, hatanın nedenini açıklayan bilgiler içerebilir.

Bu standart formatlar, n8n ve Optimizasyon Çekirdeği arasındaki iletişimi tutarlı hale getirerek entegrasyonu kolaylaştırır ve sistemin farklı modüllerle genişletilmesine olanak tanır.