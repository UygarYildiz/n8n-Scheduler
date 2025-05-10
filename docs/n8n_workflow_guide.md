# n8n İş Akışı Kullanım Kılavuzu

Bu belge, n8n platformunda oluşturulan "Vardiya" iş akışının nasıl kullanılacağını ve yapılandırılacağını açıklar. Bu iş akışı, farklı veri kaynaklarından (CSV dosyaları) veri okuyarak, bunları işleyip Optimizasyon API'sine göndermek için tasarlanmıştır.

## İş Akışı Genel Bakış

"Vardiya" iş akışı, aşağıdaki temel adımlardan oluşur:

1. **Webhook ile Tetikleme**: İş akışı bir webhook aracılığıyla tetiklenir ve dinamik parametreler alır.
2. **Read/Write Files from Disk**: Sistemdeki aktif ayarlar dosyasından varsayılan değerler okunur.
3. **Edit Fields**: Webhook parametrelerine göre temel ayarlar belirlenir.
4. **Ayarların Belirlenmesi**: Webhook parametreleri ve aktif ayarlar kullanılarak hangi veri seti ve konfigürasyon dosyasının kullanılacağı belirlenir.
5. **Temel Konfigürasyon Okuma**: Belirlenen veri setine ait YAML konfigürasyon dosyası okunur.
6. **Dosya Okuma**: Belirlenen veri setine ait CSV dosyaları (çalışanlar, vardiyalar, yetenekler, uygunluklar, tercihler) okunur.
7. **Veri Çıkarma**: CSV dosyalarından veriler çıkarılır ve işlenir.
8. **Veri Birleştirme**: Tüm veriler birleştirilir ve API'ye gönderilecek formata dönüştürülür.
9. **Veri İşleme ve Departman Kontrolü**: Veriler işlenir, departman istatistikleri oluşturulur ve vardiyası olan ancak çalışanı olmayan departmanlar tespit edilir.
10. **API Çağrısı**: Hazırlanan veriler Optimizasyon API'sine gönderilir.
11. **Sonuç İşleme**: API'den dönen sonuçlar işlenir ve gerekirse raporlanır.

## Webhook Kullanımı

İş akışı, aşağıdaki parametreleri alan bir webhook ile tetiklenir:

- **veriSeti**: Hangi veri setinin kullanılacağını belirtir (örn. "hastane", "cagri_merkezi").
- **kurallar**: Hangi kural setinin kullanılacağını belirtir (örn. "temel_kurallar").
- **objective_weights**: (Opsiyonel) Optimizasyon hedef ağırlıklarını belirtir.
- **solver_params**: (Opsiyonel) Çözücü parametrelerini belirtir (time_limit_seconds, use_mip_solver).

### Webhook URL ve Body Formatı

```
POST http://localhost:5678/webhook/[webhook-id]/optimization
```

Body:
```json
{
  "veriSeti": "hastane",
  "objective_weights": {
    "minimize_unfilled_shifts": 100,
    "minimize_preference_violations": 10,
    "minimize_consecutive_shifts": 5
  },
  "solver_params": {
    "time_limit_seconds": 300,
    "use_mip_solver": true
  }
}
```

### Örnek Kullanımlar

1. **Hastane Veri Seti ile Temel Ayarlar**:
   ```
   POST http://localhost:5678/webhook/[webhook-id]/optimization

   {
     "veriSeti": "hastane"
   }
   ```

2. **Çağrı Merkezi Veri Seti ile Özel Hedef Ağırlıkları**:
   ```
   POST http://localhost:5678/webhook/[webhook-id]/optimization

   {
     "veriSeti": "cagri_merkezi",
     "objective_weights": {
       "minimize_unfilled_shifts": 200,
       "minimize_preference_violations": 5
     }
   }
   ```

## İş Akışı Düğümleri ve Yapılandırma

### 1. Webhook Düğümü

- **Amaç**: İş akışını HTTP isteği ile tetiklemek.
- **Yapılandırma**:
  - HTTP Method: POST
  - Path: optimization
  - Authentication: None
  - Response Mode: Last Node

### 2. Read/Write Files from Disk Düğümü

- **Amaç**: Sistemdeki aktif ayarlar dosyasını okumak.
- **Yapılandırma**:
  - File Selector: /mnt/workflow_configs/aktif_ayarlar.json
  - Options: fileName: aktifAyarlar
  - Always Output Data: true

### 3. Edit Fields Düğümü

- **Amaç**: Webhook parametrelerine göre temel ayarları belirlemek.
- **Yapılandırma**:
  - Mode: Raw
  - JSON Output:
    ```json
    {
      "kullanilacakVeriSeti": "{{ $node[\"Webhook\"].json.query.veriSeti || 'hastane' }}",
      "basePath": "{{ ($node[\"Webhook\"].json.query.veriSeti || 'hastane') === 'cagri_merkezi' ? '/veri_kaynaklari/cagri_merkezi/' : '/veri_kaynaklari/hastane/' }}",
      "employeesFile": "{{ ($node[\"Webhook\"].json.query.veriSeti || 'hastane') === 'cagri_merkezi' ? 'employees_cm.csv' : 'employees.csv' }}",
      "shiftsFile": "{{ ($node[\"Webhook\"].json.query.veriSeti || 'hastane') === 'cagri_merkezi' ? 'shifts_cm.csv' : 'shifts.csv' }}",
      "skillsFile": "{{ ($node[\"Webhook\"].json.query.veriSeti || 'hastane') === 'cagri_merkezi' ? 'skills_cm.csv' : 'skills.csv' }}",
      "availabilityFile": "{{ ($node[\"Webhook\"].json.query.veriSeti || 'hastane') === 'cagri_merkezi' ? 'availability_cm.csv' : 'availability.csv' }}",
      "preferencesFile": "{{ ($node[\"Webhook\"].json.query.veriSeti || 'hastane') === 'cagri_merkezi' ? 'preferences_cm.csv' : 'preferences.csv' }}"
    }
    ```

### 4. Ayar Düğümü

- **Amaç**: Webhook parametreleri ve aktif ayarları kullanarak dosya yollarını belirlemek.
- **Yapılandırma**:
  - JavaScript Kodu:
    ```javascript
    // Girişleri al:
    // items[0].json -> Bir önceki "Set" (Edit Fields) düğümünün çıktısı
    // items[1].binary.data.data -> aktif_ayarlar.json dosyasının içeriği

    const upstreamNodeOutput = items[0].json; // Bir önceki düğümün çıktısı

    let aktifAyarlar;
    try {
      // items[1] 'aktif_ayarlar.json' dosyasını içeriyor olmalı
      const aktifAyarlarStr = Buffer.from(items[1].binary.data.data, 'base64').toString();
      aktifAyarlar = JSON.parse(aktifAyarlarStr);
    } catch (error) {
      aktifAyarlar = {
        varsayilan_veri_seti: "hastane",
        varsayilan_kural_seti_adi: "temel_kurallar" // kurallar için varsayılan
      };
    }

    let nihaiVeriSeti;
    let nihaiKurallar = aktifAyarlar.varsayilan_kural_seti_adi;

    // 1. 'nihaiVeriSeti'ni belirle:
    if (upstreamNodeOutput && upstreamNodeOutput.kullanilacakVeriSeti) {
      nihaiVeriSeti = upstreamNodeOutput.kullanilacakVeriSeti;
    } else {
      nihaiVeriSeti = aktifAyarlar.varsayilan_veri_seti;
    }

    // 2. 'nihaiKurallar'ı belirle:
    if (upstreamNodeOutput && upstreamNodeOutput.query && upstreamNodeOutput.query.kurallar) {
      nihaiKurallar = upstreamNodeOutput.query.kurallar;
    }

    // Dosya yollarını nihaiVeriSeti'ne göre oluştur
    const veriKlasoru = `/mnt/workflow_data/${nihaiVeriSeti}`;
    const filePrefix = nihaiVeriSeti === "cagri_merkezi" ? "_cm" : "";

    const employeesPath = `${veriKlasoru}/employees${filePrefix}.csv`;
    const shiftsPath = `${veriKlasoru}/shifts${filePrefix}.csv`;
    const skillsPath = `${veriKlasoru}/skills${filePrefix}.csv`;
    const availabilityPath = `${veriKlasoru}/availability${filePrefix}.csv`;
    const preferencesPath = `${veriKlasoru}/preferences${filePrefix}.csv`;

    const configPath = nihaiVeriSeti === "cagri_merkezi" ?
                      "/mnt/workflow_configs/cagri_merkezi_config.yaml" :
                      "/mnt/workflow_configs/hospital_test_config.yaml";

    // Sonuçları döndür
    return [
      {
        veriSeti: nihaiVeriSeti,
        kurallar: nihaiKurallar,
        veriKlasoru,
        employeesPath,
        shiftsPath,
        skillsPath,
        availabilityPath,
        preferencesPath,
        configPath
      }
    ];
    ```
  - **Örnek Çıktı**:
    ```json
    {
      "veriSeti": "hastane",
      "kurallar": "temel_kurallar",
      "veriKlasoru": "/mnt/workflow_data/hastane",
      "employeesPath": "/mnt/workflow_data/hastane/employees.csv",
      "shiftsPath": "/mnt/workflow_data/hastane/shifts.csv",
      "skillsPath": "/mnt/workflow_data/hastane/skills.csv",
      "availabilityPath": "/mnt/workflow_data/hastane/availability.csv",
      "preferencesPath": "/mnt/workflow_data/hastane/preferences.csv",
      "configPath": "/mnt/workflow_configs/hospital_test_config.yaml"
    }
    ```

### 5. Oku Temel Konfig Düğümü

- **Amaç**: Belirlenen veri setine ait YAML konfigürasyon dosyasını okumak.
- **Yapılandırma**:
  - File Selector: `={{ $node["Ayar"].json.configPath }}`
  - Options: fileName: baseConfigYamlContent

### 6. Dosya Okuma Düğümleri

- **Employees**: `{{ $node["Ayar"].json.employeesPath }}` yolundaki CSV dosyasını okur.
- **Shifts**: `{{ $node["Ayar"].json.shiftsPath }}` yolundaki CSV dosyasını okur.
- **Availability**: `{{ $node["Ayar"].json.availabilityPath }}` yolundaki CSV dosyasını okur.
- **Preferences**: `{{ $node["Ayar"].json.preferencesPath }}` yolundaki CSV dosyasını okur.
- **Skills**: `{{ $node["Ayar"].json.skillsPath }}` yolundaki CSV dosyasını okur.

### 7. CSV Çıkarma Düğümleri

- Her bir dosya okuma düğümünden sonra, okunan CSV verilerini JSON formatına dönüştürür.
- **Extract Employees CSV**, **Extract Shifts CSV**, **Extract Availability CSV**, **Extract Preferences CSV**, **Extract Skills CSV**

### 8. Merge Düğümü

- **Amaç**: Tüm CSV verilerini tek bir veri akışında birleştirmek.
- **Yapılandırma**:
  - Number Inputs: 5
  - Mode: Merge By Position (3.1 sürümü)

### 9. Code Düğümü

- **Amaç**: Verileri işleyip API'ye gönderilecek formata dönüştürmek.
- **Yapılandırma**:
  - JavaScript Kodu:
    ```javascript
    // Girdileri alalım:
    // items[0] -> Merge edilmiş CSV verileri (Merge düğümünden)
    // items[1] -> Temel konfigürasyon YAML içeriği (Oku Temel Konfig düğümünden)
    // Webhook verisine erişim: $node["Webhook"].json kullanacağız.

    const allMergedItems = $items("Merge"); // Tüm birleşmiş öğeleri al
    const baseConfigItem = $items("Oku Temel Konfig")[0]; // YAML içeriğini al
    const webhookData = $node["Webhook"].json; // Webhook verisini al (query ve body içerir)

    // 1. Webhook'tan UI parametrelerini al
    const uiObjectiveWeights = webhookData.body.objective_weights;
    const uiSolverParams = webhookData.body.solver_params; // { time_limit_seconds: X, use_mip_solver: Y }

    // 2. Temel konfigürasyon YAML'ını parse et (js-yaml gerektirir)
    const yaml = require('js-yaml');
    let baseConfigJson = {};
    try {
      // Read File düğümü çıktıyı 'data' property'si altında binary olarak verir
      const baseConfigYAML = Buffer.from(baseConfigItem.binary.data.data, 'base64').toString();
      baseConfigJson = yaml.load(baseConfigYAML);
      console.log("Temel Konfigürasyon başarıyla yüklendi.");
    } catch (e) {
      console.error("Temel YAML konfigürasyonu parse edilemedi:", e);
      // Hata durumunda varsayılan bir yapı oluşturabiliriz veya hata fırlatabiliriz
      // Şimdilik boş bir obje ile devam edelim, Python tarafı bunu yönetebilir
      baseConfigJson = { optimization_core: {} }; // Güvenlik için temel yapıyı oluşturalım
    }

    // 3. Temel konfigürasyonu UI parametreleriyle güncelle
    if (!baseConfigJson.optimization_core) {
      baseConfigJson.optimization_core = {};
    }
    // Eğer UI'dan gelen parametreler varsa, konfigürasyondakileri üzerine yaz
    if (uiObjectiveWeights) {
        baseConfigJson.optimization_core.objective_weights = uiObjectiveWeights;
        console.log("Hedef ağırlıkları UI'dan gelenle güncellendi.");
    } else {
        console.log("UI'dan hedef ağırlığı gelmedi, temel konfigürasyondaki kullanılacak.");
    }
    if (uiSolverParams && uiSolverParams.time_limit_seconds !== undefined) {
        baseConfigJson.optimization_core.solver_time_limit_seconds = uiSolverParams.time_limit_seconds;
        console.log("Çözücü zaman limiti UI'dan gelenle güncellendi.");
    } else {
         console.log("UI'dan çözücü zaman limiti gelmedi, temel konfigürasyondaki kullanılacak.");
    }
    if (uiSolverParams && uiSolverParams.use_mip_solver !== undefined) {
        // Python API'nizin beklediği alan adını kontrol edin (örn: use_mip_solver)
        baseConfigJson.optimization_core.use_mip_solver = uiSolverParams.use_mip_solver;
         console.log("Gelişmiş çözücü ayarı UI'dan gelenle güncellendi.");
    } else {
         console.log("UI'dan gelişmiş çözücü ayarı gelmedi, temel konfigürasyondaki kullanılacak.");
    }

    // 4. input_data'yı oluştur (Mevcut kodunuzdaki sınıflandırma mantığı)
    const employees = [];
    const skills = [];
    const shifts = [];
    const availability = [];
    const preferences = [];
    let unclassifiedCount = 0;

    // Birleştirilmiş tüm öğeleri döngüye al ve doğru dizilere ayır
    for (let i = 0; i < (allMergedItems ? allMergedItems.length : 0); i++) {
      const item = allMergedItems[i];

      if (!item || !item.json) {
          console.log(`UYARI: Geçersiz öğe yapısı atlanıyor (index ${i}):`, item);
          continue;
      }

      const data = item.json;
      let categorized = false;

      // Veri türünü ayırt etmek için anahtarları kontrol et (en spesifik önce)
      if (data.hasOwnProperty('preference_score')) {
        preferences.push(data);
        categorized = true;
      } else if (data.hasOwnProperty('shift_id') && data.hasOwnProperty('start_time') && !data.hasOwnProperty('employee_id') && !data.hasOwnProperty('role')) { // Employee'den ayırt etmek için ek kontrol
        shifts.push(data);
        categorized = true;
      } else if (data.hasOwnProperty('is_available') && data.hasOwnProperty('date') && data.hasOwnProperty('employee_id')) {
        availability.push(data);
        categorized = true;
      // Skill kontrolü - 'role' içermediğinden emin olalım
      } else if (data.hasOwnProperty('skill') && data.hasOwnProperty('employee_id') && !data.hasOwnProperty('role')) {
        skills.push(data);
        categorized = true;
      // Employee kontrolü - 'role' içermeli
      } else if (data.hasOwnProperty('role') && data.hasOwnProperty('employee_id')) {
        employees.push(data);
        categorized = true;
      }

      if (!categorized) {
        unclassifiedCount++;
        if (unclassifiedCount <= 5) {
            console.log(`UYARI: Öğe sınıflandırılamadı (index ${i}). Veri:`, JSON.stringify(data));
        } else if (unclassifiedCount === 6) {
            console.log("UYARI: Daha fazla sınıflandırılamayan öğe loglanmayacak...");
        }
      }
    }

    console.log(`DEBUG: Sınıflandırma tamamlandı. Sayılar - Employees: ${employees.length}, Skills: ${skills.length}, Shifts: ${shifts.length}, Availability: ${availability.length}, Preferences: ${preferences.length}, Unclassified: ${unclassifiedCount}`);

    // 5. Departman istatistiklerini oluştur
    const departmentStats = {};

    // Çalışan departmanlarını topla
    employees.forEach(emp => {
      if (emp.department) {
        if (!departmentStats[emp.department]) {
          departmentStats[emp.department] = { employeeCount: 0, shiftCount: 0 };
        }
        departmentStats[emp.department].employeeCount++;
      }
    });

    // Vardiya departmanlarını topla
    shifts.forEach(shift => {
      if (shift.department) {
        if (!departmentStats[shift.department]) {
          departmentStats[shift.department] = { employeeCount: 0, shiftCount: 0 };
        }
        departmentStats[shift.department].shiftCount++;
      }
    });

    // Vardiyası olan ancak çalışanı olmayan departmanları kontrol et
    const departmentsWithShiftsButNoEmployees = Object.keys(departmentStats)
      .filter(dept => departmentStats[dept].shiftCount > 0 && departmentStats[dept].employeeCount === 0);

    if (departmentsWithShiftsButNoEmployees.length > 0) {
      console.warn(`UYARI: Aşağıdaki departmanlarda vardiya var ancak çalışan yok: ${departmentsWithShiftsButNoEmployees.join(', ')}`);
    }

    const input_data = { employees, skills, shifts, availability, preferences };

    // Kontrol: Herhangi bir dizi hala boş mu? (Özellikle skills, shifts, availability önemlidir)
    if (employees.length === 0 || shifts.length === 0 || availability.length === 0) {
        console.error(`HATA: Employees(${employees.length}), Shifts(${shifts.length}) veya Availability(${availability.length}) dizilerinden en az biri boş! Sınıflandırma mantığı veya girdi verisi kontrol edilmeli.`);
    }

    // 6. Python API'sine gönderilecek nihai istek gövdesini oluştur
    const requestBodyForPython = {
      configuration: baseConfigJson, // Güncellenmiş tam konfigürasyon nesnesi
      input_data: input_data,
      department_stats: departmentStats // Departman istatistiklerini ekle
    };

    console.log("Python API'sine gönderilecek son istek gövdesi:", JSON.stringify(requestBodyForPython, null, 2));

    // Sonucu döndür
    return [ { json: requestBodyForPython } ];
    ```

### 10. HTTP Request Düğümü

- **Amaç**: Hazırlanan verileri Optimizasyon API'sine göndermek.
- **Yapılandırma**:
  - Method: POST
  - URL: http://host.docker.internal:8000/optimize veya üretim ortamında belirtilen URL
  - Send Headers: true
  - Header Parameters: Content-Type: application/json
  - Send Body: true
  - Specify Body: json
  - JSON Body: `={{ $json }}`

## Hata Ayıklama ve Sorun Giderme

### Yaygın Sorunlar ve Çözümleri

1. **Dosya Yolu Hataları**:
   - Hata: `[undefined]` değeri alınması veya dosya bulunamadı hatası.
   - Çözüm: Ayar düğümünün çıktısını kontrol edin ve dosya yollarının doğru oluşturulduğundan emin olun.
   - Çözüm: Docker volume bağlantılarını kontrol edin ve `/mnt/workflow_data/` ve `/mnt/workflow_configs/` yollarının doğru yapılandırıldığından emin olun.

2. **CSV Okuma Hataları**:
   - Hata: CSV dosyası okunamıyor veya içeriği boş.
   - Çözüm: Docker volume bağlantılarını kontrol edin ve dosyaların belirtilen yollarda mevcut olduğundan emin olun.
   - Çözüm: CSV dosyalarının doğru formatta olduğundan emin olun (UTF-8 kodlaması, doğru sütun başlıkları).

3. **API Bağlantı Hataları**:
   - Hata: API'ye bağlanılamıyor veya "Connection refused" hatası.
   - Çözüm: API'nin çalıştığından emin olun (`uvicorn optimization_core.main:app --reload --port 8000`).
   - Çözüm: Docker içinden API'ye erişim için `http://host.docker.internal:8000/optimize` URL'sini kullanın.
   - Çözüm: Üretim ortamında doğru API URL'sini yapılandırın ve webhook URL'sinin doğru yapılandırıldığından emin olun.

4. **YAML Konfigürasyon Hataları**:
   - Hata: "YAML konfigürasyonu parse edilemedi" hatası.
   - Çözüm: YAML dosyasının geçerli bir formatta olduğunu kontrol edin.
   - Çözüm: `NODE_FUNCTION_ALLOW_EXTERNAL=js-yaml,yaml,fs-extra` ortam değişkeninin Docker Compose dosyasında tanımlandığından emin olun.

5. **Veri Sınıflandırma Sorunları**:
   - Hata: Veriler doğru kategorilere ayrılamıyor veya bazı kategoriler boş.
   - Çözüm: Code düğümündeki sınıflandırma mantığını kontrol edin ve CSV dosyalarının beklenen alanları içerdiğinden emin olun.
   - Çözüm: Merge düğümünün tüm veri kaynaklarını doğru sırayla aldığından emin olun.
   - Çözüm: Departman istatistiklerini kontrol edin ve vardiyası olan ancak çalışanı olmayan departmanlar için gerekli düzenlemeleri yapın.

6. **Döngüsel Bağımlılık Hataları**:
   - Hata: İş akışı çalışmıyor veya beklenmedik şekilde davranıyor.
   - Çözüm: Düğümler arasında döngüsel bağımlılık olmadığından emin olun (örn. A düğümü B'ye bağlı, B düğümü de A'ya bağlı olmamalı).
   - Çözüm: Özellikle "Oku Temel Konfig" ve "Ayar" düğümleri arasındaki bağlantıları kontrol edin.

## Hastane ve Çağrı Merkezi Veri Setleri

İş akışı, hem hastane hem de çağrı merkezi veri setleri için kullanılabilir. Her iki veri seti için ayrı dosya yolları ve konfigürasyon dosyaları tanımlanmıştır.

### Hastane Veri Seti Kullanımı

Hastane veri seti, sağlık kurumlarına özgü vardiya çizelgeleme senaryoları için tasarlanmıştır.

1. **Webhook İsteği**:
   ```
   POST http://localhost:5678/webhook/[webhook-id]/optimization

   {
     "veriSeti": "hastane"
   }
   ```

2. **Kullanılan Dosyalar**:
   - Çalışanlar: `/mnt/workflow_data/hastane/employees.csv`
   - Vardiyalar: `/mnt/workflow_data/hastane/shifts.csv`
   - Yetenekler: `/mnt/workflow_data/hastane/skills.csv`
   - Uygunluklar: `/mnt/workflow_data/hastane/availability.csv`
   - Tercihler: `/mnt/workflow_data/hastane/preferences.csv`
   - Konfigürasyon: `/mnt/workflow_configs/hospital_test_config.yaml`

3. **Hastane Veri Seti Özellikleri**:
   - Departman bazlı vardiya planlaması (Acil, Kardiyoloji, Cerrahi, vb.)
   - Doktor, hemşire, teknisyen gibi farklı roller
   - Uzmanlık alanlarına göre yetenek gereksinimleri
   - Gece, gündüz ve akşam vardiyaları
   - Hafta içi ve hafta sonu vardiyaları

4. **Örnek Konfigürasyon Ayarları**:
   - Acil departmanı için minimum doktor sayısı
   - Gece vardiyaları için minimum hemşire sayısı
   - Kardiyoloji uzmanlığı gerektiren vardiyalar

### Çağrı Merkezi Veri Seti Kullanımı

Çağrı merkezi veri seti, müşteri hizmetleri operasyonları için vardiya çizelgeleme senaryolarına uygun tasarlanmıştır.

1. **Webhook İsteği**:
   ```
   POST http://localhost:5678/webhook/[webhook-id]/optimization

   {
     "veriSeti": "cagri_merkezi",
     "objective_weights": {
       "minimize_unfilled_shifts": 200,
       "minimize_preference_violations": 5
     }
   }
   ```

2. **Kullanılan Dosyalar**:
   - Çalışanlar: `/mnt/workflow_data/cagri_merkezi/employees_cm.csv`
   - Vardiyalar: `/mnt/workflow_data/cagri_merkezi/shifts_cm.csv`
   - Yetenekler: `/mnt/workflow_data/cagri_merkezi/skills_cm.csv`
   - Uygunluklar: `/mnt/workflow_data/cagri_merkezi/availability_cm.csv`
   - Tercihler: `/mnt/workflow_data/cagri_merkezi/preferences_cm.csv`
   - Konfigürasyon: `/mnt/workflow_configs/cagri_merkezi_config.yaml`

3. **Çağrı Merkezi Veri Seti Özellikleri**:
   - Yoğunluk bazlı vardiya planlaması (Sabah yoğunluğu, öğle yoğunluğu, vb.)
   - Müşteri temsilcisi, takım lideri, süpervizör gibi roller
   - Dil becerileri ve teknik yetenek gereksinimleri
   - Esnek başlangıç ve bitiş saatleri
   - 7/24 hizmet için vardiya dağılımı

4. **Örnek Konfigürasyon Ayarları**:
   - Yoğun saatler için minimum temsilci sayısı
   - Belirli dil becerilerine sahip minimum personel sayısı
   - Maksimum ardışık çalışma günü sınırlamaları

### Veri Setleri Arasında Geçiş

İki veri seti arasında geçiş yapmak için webhook isteğindeki `veriSeti` parametresini değiştirmeniz yeterlidir. İş akışı, bu parametreye göre doğru dosya yollarını ve konfigürasyonu otomatik olarak belirleyecektir. Ayrıca, `objective_weights` ve `solver_params` parametreleri ile optimizasyon davranışını özelleştirebilirsiniz.

## İş Akışını Özelleştirme

### Farklı Veri Setleri İçin Yapılandırma

1. Yeni bir veri seti eklemek için:
   - Veri dosyalarını uygun bir klasöre yerleştirin (örn. `/mnt/workflow_data/yeni_veri_seti/`).
   - Docker Compose dosyasında yeni volume bağlantısı ekleyin:
     ```yaml
     volumes:
       - ./yeni_veri_seti:/mnt/workflow_data/yeni_veri_seti
     ```
   - Ayar düğümündeki JavaScript kodunu güncelleyin:
     ```javascript
     // Dosya yollarını nihaiVeriSeti'ne göre oluştur
     const veriKlasoru = `/mnt/workflow_data/${nihaiVeriSeti}`;
     const filePrefix = nihaiVeriSeti === "cagri_merkezi" ? "_cm" :
                        nihaiVeriSeti === "yeni_veri_seti" ? "_yeni" : "";

     // ...

     const configPath = nihaiVeriSeti === "cagri_merkezi" ? "/mnt/workflow_configs/cagri_merkezi_config.yaml" :
                        nihaiVeriSeti === "yeni_veri_seti" ? "/mnt/workflow_configs/yeni_veri_seti_config.yaml" :
                        "/mnt/workflow_configs/hospital_test_config.yaml";
     ```

2. Yeni bir konfigürasyon dosyası eklemek için:
   - YAML formatında yeni bir konfigürasyon dosyası oluşturun (örn. `/mnt/workflow_configs/yeni_veri_seti_config.yaml`).
   - `aktif_ayarlar.json` dosyasını güncelleyerek varsayılan veri setini değiştirebilirsiniz:
     ```json
     {
       "varsayilan_veri_seti": "yeni_veri_seti",
       "varsayilan_kural_seti_adi": "temel_kurallar"
     }
     ```

### Webhook Parametrelerini Özelleştirme

İş akışını daha esnek hale getirmek için webhook parametrelerini genişletebilirsiniz:

1. **Özel Hedef Ağırlıkları**:
   ```json
   {
     "veriSeti": "hastane",
     "objective_weights": {
       "minimize_unfilled_shifts": 150,
       "minimize_preference_violations": 20,
       "minimize_consecutive_shifts": 10,
       "minimize_department_changes": 5
     }
   }
   ```

2. **Özel Çözücü Parametreleri**:
   ```json
   {
     "veriSeti": "cagri_merkezi",
     "solver_params": {
       "time_limit_seconds": 600,
       "use_mip_solver": true,
       "gap_limit": 0.05
     }
   }
   ```

## Güvenlik Notları

- Webhook'lar varsayılan olarak kimlik doğrulaması gerektirmez. Üretim ortamında, webhook güvenliğini artırmak için n8n'in kimlik doğrulama özelliklerini kullanmayı düşünün.
- Hassas verileri konfigürasyon dosyalarında saklamaktan kaçının. Gerekirse n8n'in Credentials özelliğini kullanın.
- Docker Compose dosyasında `NODE_FUNCTION_ALLOW_EXTERNAL` ortam değişkenini sadece gerekli kütüphanelerle sınırlayın.

## Performans İpuçları

- Büyük CSV dosyaları için, n8n'in bellek kullanımını artırmayı düşünün (`NODE_OPTIONS="--max-old-space-size=4096"`).
- Uzun süren optimizasyon işlemleri için, asenkron API çağrıları kullanmayı düşünün.
- Code düğümünde gereksiz log mesajlarını azaltarak performansı artırabilirsiniz.
- Webhook'un yanıt süresini azaltmak için, optimizasyon sonuçlarını ayrı bir endpoint üzerinden almayı düşünün.

## Sonuç

Bu iş akışı, farklı veri setleri ve konfigürasyonlar için dinamik olarak çalışacak şekilde tasarlanmıştır. Webhook parametreleri aracılığıyla, hangi veri seti ve kural setinin kullanılacağını belirleyebilir ve böylece farklı kurumsal senaryolar için aynı iş akışını yeniden kullanabilirsiniz.

### Üretim Ortamında Webhook URL'si

Üretim ortamında webhook URL'si doğru yapılandırılmalıdır. n8n ayarlarında webhook URL'si, dış erişime açık bir adres olarak yapılandırılabilir. Webhook URL'sinin doğru yapılandırılması, sistemin dış dünyadan erişilebilir olması için kritik öneme sahiptir.

### Hastane ve Çağrı Merkezi Senaryoları İçin Hızlı Başlangıç

1. **Hastane Senaryosu İçin**:
   - Docker Compose ile n8n ve API'yi başlatın: `docker-compose up -d`
   - Webhook'u çağırın:
     ```
     curl -X POST http://localhost:5678/webhook/[webhook-id]/optimization \
     -H "Content-Type: application/json" \
     -d '{"veriSeti": "hastane"}'
     ```
   - Sonuçları `optimization_result.json` dosyasında görüntüleyin

2. **Çağrı Merkezi Senaryosu İçin**:
   - Docker Compose ile n8n ve API'yi başlatın: `docker-compose up -d`
   - Webhook'u çağırın:
     ```
     curl -X POST http://localhost:5678/webhook/[webhook-id]/optimization \
     -H "Content-Type: application/json" \
     -d '{"veriSeti": "cagri_merkezi", "objective_weights": {"minimize_unfilled_shifts": 200}}'
     ```
   - Sonuçları `optimization_result.json` dosyasında görüntüleyin

Bu dinamik yapı sayesinde, farklı kurumlar için aynı optimizasyon altyapısını kullanabilir, sadece veri setlerini ve konfigürasyon dosyalarını değiştirerek farklı senaryolara uyarlayabilirsiniz. Ayrıca, webhook parametreleri ile optimizasyon davranışını anında özelleştirebilirsiniz.
