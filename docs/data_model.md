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
      {"id": "emp001", "name": "Ayşe Yılmaz", "role": "Hemşire", "specialties": ["Yoğun Bakım"], "availability": [...]},
      {"id": "emp002", "name": "Mehmet Öztürk", "role": "Doktor", "specialty": "Kardiyoloji", "availability": [...]}
      // ... diğer çalışanlar
    ],
    "shifts": [
      {"id": "shift01", "name": "Gündüz", "start_time": "08:00", "end_time": "16:00", "day": "Pazartesi"},
      {"id": "shift02", "name": "Gece", "start_time": "16:00", "end_time": "00:00", "day": "Pazartesi"}
      // ... diğer vardiyalar
    ],
    "required_skills": [
      {"shift_id": "shift01", "role": "Hemşire", "min_count": 5},
      {"shift_id": "shift01", "specialty": "Kardiyoloji", "min_count": 1}
      // ... diğer gereksinimler (Bu kısım konfigürasyondan da gelebilir)
    ]
    // ... probleme özel diğer veri alanları (izinler, tercihler vb.)
  }
}
```

**Açıklamalar:**

*   `configuration_ref` veya `configuration`: Kuruma özel parametreleri ve kısıtları içerir. İkisinden biri veya ikisi birden kullanılabilir (doğrudan gönderilen değerler dosyadakileri geçersiz kılabilir).
*   `input_data`: Optimizasyon modelinin ihtiyaç duyduğu asıl veriyi içerir. Yapısı çözülecek probleme göre (çizelgeleme, rotalama vb.) değişiklik gösterir. Yukarıdaki örnek hastane çizelgeleme içindir.
*   `input_data` içindeki alanlar (örn. `employees`, `shifts`, `required_skills`) projenin çözdüğü probleme göre detaylandırılmalıdır.
*   **Önemli:** `input_data` içindeki yapının, farklı kurumların benzer problemlerini (örn. farklı hastanelerin çizelgeleme ihtiyacı) karşılayacak kadar genel ve esnek olması hedeflenmelidir.

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
      {"employee_id": "emp001", "shift_id": "shift01"},
      {"employee_id": "emp002", "shift_id": "shift01"}
      // ... diğer atamalar
    ],
    "unassigned_shifts": ["shift05"],
    "violated_soft_constraints": [
      {"constraint_type": "preference", "employee_id": "emp003", "details": "İstenmeyen vardiya atandı"}
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