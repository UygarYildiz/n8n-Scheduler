# n8n İş Akışı Kullanım Kılavuzu

Bu belge, n8n platformunda oluşturulan "Vardiya" iş akışının nasıl kurulacağını, yapılandırılacağını ve kullanılacağını açıklar. Bu iş akışı, farklı veri kaynaklarından (CSV dosyaları) veri okuyarak, bunları işleyip FastAPI Optimizasyon backend'ine göndermek için tasarlanmıştır.

## İş Akışı Genel Bakış

**Workflow ID:** `nEKfZ30L6vLyUMXe`
**Webhook ID:** `98a3eec5-cce7-4a93-b2e5-2275b192b265`
**Status:** Active
**Execution Order:** v1

"Vardiya" iş akışı, aşağıdaki temel adımlardan oluşur:

1. **Webhook ile Tetikleme**: İş akışı bir webhook aracılığıyla tetiklenir ve dinamik parametreler alır.
2. **Read/Write Files from Disk**: Sistemdeki aktif ayarlar dosyasından varsayılan değerler okunur.
3. **Edit Fields**: Webhook parametrelerine göre temel ayarlar belirlenir.
4. **Ayar (Code Node)**: Webhook parametreleri ve aktif ayarlar kullanılarak dinamik dosya yolları belirlenir.
5. **Temel Konfigürasyon Okuma**: Belirlenen veri setine ait YAML konfigürasyon dosyası okunur.
6. **Paralel CSV Dosya Okuma**: 5 farklı CSV dosyası (employees, shifts, availability, preferences, skills) paralel olarak okunur.
7. **CSV Extract Operations**: Binary data'dan JSON formatına dönüştürme işlemleri paralel olarak gerçekleştirilir.
8. **Merge**: Tüm CSV verileri ve YAML konfigürasyonu tek bir data stream'de birleştirilir.
9. **Code (Ana İşleme)**: Veriler sınıflandırılır, YAML parse edilir ve API request formatına dönüştürülür.
10. **HTTP Request**: Hazırlanan OptimizationRequest FastAPI backend'ine gönderilir.

## Workflow Architecture

```
Webhook → Read Files → Edit Fields → Ayar (Code)
                                      ↓
                    Oku Temel Konfig ← ┴ → Employees → Extract → ┐
                           ↓                Shifts → Extract → ┤
                           ↓              Avaibility → Extract → ┤ → Merge → Code → HTTP Request
                           ↓            Preferences → Extract → ┤
                           ↓                Skills → Extract → ┘
                           └─────────────────────────────────────┘
```

## Webhook Kullanımı

İş akışı, aşağıdaki parametreleri alan bir webhook ile tetiklenir:

- **veriSeti**: Hangi veri setinin kullanılacağını belirtir (örn. "hastane", "cagri_merkezi").
- **kurallar**: Hangi kural setinin kullanılacağını belirtir (örn. "temel_kurallar").
- **objective_weights**: (Opsiyonel) Optimizasyon hedef ağırlıklarını belirtir.
- **solver_params**: (Opsiyonel) Çözücü parametrelerini belirtir (time_limit_seconds, use_mip_solver).

### Webhook URL ve Body Formatı

**Gerçek Webhook URL:**
```
POST http://localhost:5678/webhook/98a3eec5-cce7-4a93-b2e5-2275b192b265
```

**Request Body Format:**
```json
{
  "veriSeti": "hastane",
  "objective_weights": {
    "understaffing_penalty": 100,
    "overstaffing_penalty": 50,
    "preference_weight": 10
  },
  "solver_params": {
    "time_limit_seconds": 300,
    "use_mip_solver": true
  }
}
```

### Örnek Kullanımlar

1. **Hastane Veri Seti ile Temel Ayarlar**:
   ```bash
   curl -X POST "http://localhost:5678/webhook/98a3eec5-cce7-4a93-b2e5-2275b192b265" \
     -H "Content-Type: application/json" \
     -d '{
       "veriSeti": "hastane"
     }'
   ```

2. **Çağrı Merkezi Veri Seti ile Özel Hedef Ağırlıkları**:
   ```bash
   curl -X POST "http://localhost:5678/webhook/98a3eec5-cce7-4a93-b2e5-2275b192b265" \
     -H "Content-Type: application/json" \
     -d '{
       "veriSeti": "cagri_merkezi",
       "objective_weights": {
         "understaffing_penalty": 200,
         "preference_weight": 5
       }
     }'
   ```

3. **Solver Parameters ile Kullanım**:
   ```bash
   curl -X POST "http://localhost:5678/webhook/98a3eec5-cce7-4a93-b2e5-2275b192b265" \
     -H "Content-Type: application/json" \
     -d '{
       "veriSeti": "hastane",
       "solver_params": {
         "time_limit_seconds": 600,
         "use_mip_solver": true
       }
     }'
   ```

## İş Akışı Düğümleri ve Yapılandırma

### 1. Webhook Düğümü

- **Node Type**: `n8n-nodes-base.webhook` (v2)
- **Node ID**: `4ac2dc4e-0e60-438d-bab2-a569d8dad838`
- **Position**: `[-700, 340]`
- **Webhook ID**: `98a3eec5-cce7-4a93-b2e5-2275b192b265`
- **Amaç**: İş akışını HTTP isteği ile tetiklemek.
- **Yapılandırma**:
  ```json
  {
    "httpMethod": "POST",
    "path": "optimization",
    "responseMode": "lastNode",
    "options": {}
  }
  ```

### 2. Read/Write Files from Disk Düğümü

- **Node Type**: `n8n-nodes-base.readWriteFile` (v1)
- **Node ID**: `20fc2f93-176d-41dd-9454-2e5eb414cf95`
- **Position**: `[-480, 340]`
- **Amaç**: Sistemdeki aktif ayarlar dosyasını okumak.
- **Yapılandırma**:
  ```json
  {
    "fileSelector": "/mnt/workflow_configs/aktif_ayarlar.json",
    "options": {
      "fileName": "aktifAyarlar"
    },
    "alwaysOutputData": true
  }
  ```

### 3. Edit Fields Düğümü

- **Node Type**: `n8n-nodes-base.set` (v3.4)
- **Node ID**: `cf5bab33-73ae-45b4-96f2-8eedebbaad9e`
- **Position**: `[-260, 340]`
- **Amaç**: Webhook parametrelerine göre temel ayarları belirlemek.
- **Yapılandırma**:
  ```json
  {
    "mode": "raw",
    "jsonOutput": "{\n  \"kullanilacakVeriSeti\": \"{{ $node[\"Webhook\"].json.query.veriSeti || 'hastane' }}\",\n  \"basePath\": \"{{ ($node[\"Webhook\"].json.query.veriSeti || 'hastane') === 'cagri_merkezi' ? '/veri_kaynaklari/cagri_merkezi/' : '/veri_kaynaklari/hastane/' }}\",\n  \"employeesFile\": \"{{ ($node[\"Webhook\"].json.query.veriSeti || 'hastane') === 'cagri_merkezi' ? 'employees_cm.csv' : 'employees.csv' }}\",\n  \"shiftsFile\": \"{{ ($node[\"Webhook\"].json.query.veriSeti || 'hastane') === 'cagri_merkezi' ? 'shifts_cm.csv' : 'shifts.csv' }}\",\n  \"skillsFile\": \"{{ ($node[\"Webhook\"].json.query.veriSeti || 'hastane') === 'cagri_merkezi' ? 'skills_cm.csv' : 'skills.csv' }}\",\n  \"availabilityFile\": \"{{ ($node[\"Webhook\"].json.query.veriSeti || 'hastane') === 'cagri_merkezi' ? 'availability_cm.csv' : 'availability.csv' }}\",\n  \"preferencesFile\": \"{{ ($node[\"Webhook\"].json.query.veriSeti || 'hastane') === 'cagri_merkezi' ? 'preferences_cm.csv' : 'preferences.csv' }}\"\n}"
  }
  ```

### 4. Ayar Düğümü (JavaScript Code)

- **Node Type**: `n8n-nodes-base.code` (v2)
- **Node ID**: `2b6092a1-e49d-4f2d-81b0-202ecbddea55`
- **Position**: `[-40, 340]`
- **Amaç**: Webhook parametreleri ve aktif ayarları kullanarak dinamik dosya yollarını belirlemek.
- **Girdi**:
  - `items[0].json` - Edit Fields düğümünden gelen webhook parametreleri
  - `items[1].binary.data.data` - aktif_ayarlar.json dosyasının binary içeriği
- **JavaScript Kodu** (Gerçek kod):
  ```javascript
  // Girişleri al:
  // items[0].json -> Bir önceki "Set" (Edit Fields) düğümünün çıktısı
  // items[1].binary.data.data -> aktif_ayarlar.json dosyasının içeriği

  const upstreamNodeOutput = items[0].json; // Bir önceki düğümün çıktısı
  console.log("Bir önceki 'Set' (Edit Fields) düğümünden gelen veri:", JSON.stringify(upstreamNodeOutput, null, 2));

  let aktifAyarlar;
  try {
    // items[1] 'aktif_ayarlar.json' dosyasını içeriyor olmalı
    const aktifAyarlarStr = Buffer.from(items[1].binary.data.data, 'base64').toString();
    aktifAyarlar = JSON.parse(aktifAyarlarStr);
    console.log("Okunan aktif ayarlar:", aktifAyarlar);
  } catch (error) {
    console.warn("Aktif ayarlar dosyası okunamadı veya ayrıştırılamadı:", error);
    aktifAyarlar = {
      varsayilan_veri_seti: "hastane",
      varsayilan_kural_seti_adi: "temel_kurallar" // kurallar için varsayılan
    };
    console.log("Varsayılan aktif ayarlar kullanılıyor:", aktifAyarlar);
  }

  let nihaiVeriSeti;
  let nihaiKurallar = aktifAyarlar.varsayilan_kural_seti_adi; // 'kurallar' için başlangıç değeri

  // 1. 'nihaiVeriSeti'ni belirle:
  // Öncelik, bir önceki "Set" (Edit Fields) düğümünden gelen 'kullanilacakVeriSeti' değerinde.
  if (upstreamNodeOutput && upstreamNodeOutput.kullanilacakVeriSeti) {
    nihaiVeriSeti = upstreamNodeOutput.kullanilacakVeriSeti;
    console.log(`'kullanilacakVeriSeti' bir önceki düğümden alındı: ${nihaiVeriSeti}`);
  } else {
    // Eğer bir önceki düğümden gelmiyorsa, aktif ayarlardaki varsayılana dön.
    console.warn("'kullanilacakVeriSeti' bir önceki düğümde bulunamadı. Aktif ayarlardaki varsayılan kullanılacak.");
    nihaiVeriSeti = aktifAyarlar.varsayilan_veri_seti;
  }

  // 2. 'nihaiKurallar'ı belirle:
  if (upstreamNodeOutput && upstreamNodeOutput.query && upstreamNodeOutput.query.kurallar) {
    nihaiKurallar = upstreamNodeOutput.query.kurallar;
    console.log(`'kurallar' upstreamNodeOutput.query içinden alındı: ${nihaiKurallar}`);
  } else {
    console.log(`'kurallar' için dinamik bir kaynak bulunamadı. Aktif ayarlardaki varsayılan ('${nihaiKurallar}') kullanılacak.`);
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

- **Node Type**: `n8n-nodes-base.readWriteFile` (v1)
- **Node ID**: `205714c3-3e34-4dec-9c92-09d5e7785e3f`
- **Position**: `[400, 440]`
- **Amaç**: Belirlenen veri setine ait YAML konfigürasyon dosyasını okumak.
- **Yapılandırma**:
  ```json
  {
    "fileSelector": "={{ $node[\"Ayar\"].json.configPath }}",
    "options": {
      "fileName": "baseConfigYamlContent"
    }
  }
  ```

### 6. CSV Dosya Okuma Düğümleri

Her CSV dosyası için ayrı bir Read/Write Files node'u:

#### 6.1 Employees Node
- **Node Type**: `n8n-nodes-base.readWriteFile` (v1)
- **Node ID**: `370cc3fd-506a-4a55-8c1d-b936cf05ac3c`
- **Position**: `[180, -160]`
- **File Selector**: `={{ $node["Ayar"].json.employeesPath }}`
- **Binary Property**: `employeesData`

#### 6.2 Shifts Node
- **Node Type**: `n8n-nodes-base.readWriteFile` (v1)
- **Position**: `[180, 40]`
- **File Selector**: `={{ $node["Ayar"].json.shiftsPath }}`
- **Binary Property**: `shiftData`

#### 6.3 Avaibility Node (Yazım hatası mevcut)
- **Node Type**: `n8n-nodes-base.readWriteFile` (v1)
- **Position**: `[180, 240]`
- **File Selector**: `={{ $node["Ayar"].json.availabilityPath }}`
- **Binary Property**: `availabilityData`

#### 6.4 Preferences Node
- **Node Type**: `n8n-nodes-base.readWriteFile` (v1)
- **Position**: `[180, 640]`
- **File Selector**: `={{ $node["Ayar"].json.preferencesPath }}`
- **Binary Property**: `preferenceData`

#### 6.5 Skills Node
- **Node Type**: `n8n-nodes-base.readWriteFile` (v1)
- **Node ID**: `a2c70ed9-bd77-4e1c-8b75-2be8a88e53d5`
- **Position**: `[180, 840]`
- **File Selector**: `={{ $node["Ayar"].json.skillsPath }}`
- **Binary Property**: `skillData`

### 7. CSV Extract Düğümleri

Her CSV dosyası için binary data'yı JSON'a dönüştüren extract node'ları:

#### 7.1 Extract Employees CSV
- **Node Type**: `n8n-nodes-base.extractFromFile` (v1)
- **Node ID**: `4f6ab5db-df0f-464c-98f0-2db83e05d146`
- **Position**: `[400, -160]`
- **Binary Property**: `employeesData`
- **Header Row**: true

#### 7.2 Extract Shifts CSV
- **Node Type**: `n8n-nodes-base.extractFromFile` (v1)
- **Node ID**: `bd4a1703-a404-4f63-a585-a0acc4076742`
- **Position**: `[400, 40]`
- **Binary Property**: `shiftData`
- **Header Row**: true

#### 7.3 Extract Availability CSV
- **Node Type**: `n8n-nodes-base.extractFromFile` (v1)
- **Node ID**: `86e262c6-b1c3-4895-8aae-bd3d66da9de3`
- **Position**: `[400, 240]`
- **Binary Property**: `availabilityData`
- **Header Row**: true

#### 7.4 Extract Preferences CSV
- **Node Type**: `n8n-nodes-base.extractFromFile` (v1)
- **Node ID**: `8b2f572a-5fb8-40f8-8c69-220161154ba4`
- **Position**: `[400, 640]`
- **Binary Property**: `preferenceData`
- **Header Row**: true

#### 7.5 Extract Skills CSV
- **Node Type**: `n8n-nodes-base.extractFromFile` (v1)
- **Node ID**: `9fb16afb-c533-4297-bec5-400848a0e8c4`
- **Position**: `[400, 840]`
- **Binary Property**: `skillData`
- **Header Row**: true

### 8. Merge Düğümü

- **Node Type**: `n8n-nodes-base.merge` (v3.1)
- **Node ID**: `902db380-4074-4072-8bee-93db4ba910d5`
- **Position**: `[620, 277]`
- **Amaç**: Tüm CSV verilerini ve YAML konfigürasyonunu tek bir veri akışında birleştirmek.
- **Yapılandırma**:
  ```json
  {
    "numberInputs": 6,
    "mode": "mergeByPosition"
  }
  ```
- **Input Connections**:
  1. Extract Employees CSV (index 0)
  2. Extract Shifts CSV (index 1)
  3. Extract Availability CSV (index 2)
  4. Extract Preferences CSV (index 3)
  5. Extract Skills CSV (index 4)
  6. Oku Temel Konfig (index 5) - YAML konfigürasyonu

### 9. Code Düğümü (Ana Veri İşleme)

- **Node Type**: `n8n-nodes-base.code` (v2)
- **Node ID**: `d0ecc543-c0f3-4e46-993f-5e0728ebe767`
- **Position**: `[840, 340]`
- **Amaç**: Tüm verileri işleyip FastAPI'ye gönderilecek OptimizationRequest formatına dönüştürmek.
- **Girdi**: Merge node'undan gelen 6 input (5 CSV + 1 YAML)
- **JavaScript Kodu** (Gerçek kod):
  ```javascript
  // Girdileri alalım:
  // allMergedItems -> Merge edilmiş CSV verileri VE YAML içeriğini içerir
  // Webhook verisine erişim.
  const allMergedItems = $items("Merge"); // Tüm birleşmiş öğeleri al (CSV'ler + YAML)
  const webhookData = $items("Webhook")[0].json; // Webhook verisini al

  // 1. Webhook'tan UI parametrelerini al
  const uiObjectiveWeights = webhookData.body.objective_weights;
  const uiSolverParams = webhookData.body.solver_params;

  // 2. Temel konfigürasyon YAML'ını parse et
  // YAML verisi 'allMergedItems' dizisinin son elemanı olmalı.
  // DİKKAT: Eğer Merge düğümüne 6 giriş varsa, YAML verisi allMergedItems[5] olmalı.
  const baseConfigItem = allMergedItems[allMergedItems.length - 1]; // Son öğeyi YAML olarak varsay
  let baseConfigJson = {};
  const yaml = require('js-yaml');

  try {
    if (baseConfigItem && baseConfigItem.binary && baseConfigItem.binary.data) {
      const baseConfigYAML = Buffer.from(baseConfigItem.binary.data.data, 'base64').toString();
      baseConfigJson = yaml.load(baseConfigYAML);
      console.log("Temel Konfigürasyon başarıyla yüklendi.");
    } else {
      console.error("Merge'den gelen YAML konfigürasyon öğesi beklenen formatta değil:", baseConfigItem);
      baseConfigJson = { error: "YAML item missing or malformed", optimization_core: {} };
    }
  } catch (e) {
    console.error("Temel YAML konfigürasyonu parse edilemedi:", e);
    baseConfigJson = { error: "YAML parse error", optimization_core: {} };
  }

  // 3. Temel konfigürasyonu UI parametreleriyle güncelle
  if (!baseConfigJson.optimization_core) {
    baseConfigJson.optimization_core = {}; // Hata durumunda bile bu alanın var olmasını sağla
  }
  if (uiObjectiveWeights) {
      baseConfigJson.optimization_core.objective_weights = uiObjectiveWeights;
      console.log("Hedef ağırlıkları UI'dan gelenle güncellendi.");
  }
  if (uiSolverParams && uiSolverParams.time_limit_seconds !== undefined) {
      baseConfigJson.optimization_core.solver_time_limit_seconds = uiSolverParams.time_limit_seconds;
      console.log("Çözücü zaman limiti UI'dan gelenle güncellendi.");
  }
  if (uiSolverParams && uiSolverParams.use_mip_solver !== undefined) {
      baseConfigJson.optimization_core.use_mip_solver = uiSolverParams.use_mip_solver;
       console.log("Gelişmiş çözücü ayarı UI'dan gelenle güncellendi.");
  }

  // 4. input_data'yı oluştur
  const employees = [];
  const skills = [];
  const shifts = [];
  const availability = [];
  const preferences = [];
  let unclassifiedCount = 0;

  // Birleştirilmiş öğeleri döngüye al, AMA SONUNCUYU (YAML) ATLA
  // Bu yüzden döngü allMergedItems.length - 1'e kadar gitmeli.
  for (let i = 0; i < allMergedItems.length - 1; i++) { // SON ÖĞEYİ HARİÇ TUT
    const item = allMergedItems[i];

    if (!item || !item.json) {
        console.warn(`UYARI: Geçersiz CSV öğe yapısı atlanıyor (index ${i}):`, item);
        continue;
    }

    const data = item.json;
    let categorized = false;

    if (data.hasOwnProperty('preference_score')) {
      preferences.push(data);
      categorized = true;
    } else if (data.hasOwnProperty('shift_id') && data.hasOwnProperty('start_time') && !data.hasOwnProperty('employee_id') && !data.hasOwnProperty('role')) {
      shifts.push(data);
      categorized = true;
    } else if (data.hasOwnProperty('is_available') && data.hasOwnProperty('date') && data.hasOwnProperty('employee_id')) {
      availability.push(data);
      categorized = true;
    } else if (data.hasOwnProperty('skill') && data.hasOwnProperty('employee_id') && !data.hasOwnProperty('role')) {
      skills.push(data);
      categorized = true;
    } else if (data.hasOwnProperty('role') && data.hasOwnProperty('employee_id')) {
      employees.push(data);
      categorized = true;
    }

    if (!categorized) {
      unclassifiedCount++;
      if (unclassifiedCount <= 5) {
          console.warn(`UYARI: CSV Öğesi sınıflandırılamadı (index ${i}). Veri:`, JSON.stringify(data));
      } else if (unclassifiedCount === 6) {
          console.warn("UYARI: Daha fazla sınıflandırılamayan CSV öğesi loglanmayacak...");
      }
    }
  }

  console.log(`DEBUG: CSV Sınıflandırma tamamlandı. Sayılar - Employees: ${employees.length}, Skills: ${skills.length}, Shifts: ${shifts.length}, Availability: ${availability.length}, Preferences: ${preferences.length}, Unclassified: ${unclassifiedCount}`);

  const input_data = { employees, skills, shifts, availability, preferences };

  if (employees.length === 0 || shifts.length === 0 || availability.length === 0) {
      console.error(`HATA: Employees(${employees.length}), Shifts(${shifts.length}) veya Availability(${availability.length}) CSV dizilerinden en az biri boş! Sınıflandırma mantığı veya girdi verisi kontrol edilmeli.`);
  }

  // 5. Python API'sine gönderilecek nihai istek gövdesini oluştur
  const requestBodyForPython = {
    configuration: baseConfigJson,
    input_data: input_data
  };

  console.log("Python API'sine gönderilecek son istek gövdesi:", JSON.stringify(requestBodyForPython, null, 2));

  return [ { json: requestBodyForPython } ];
  ```

### 10. HTTP Request Düğümü

- **Node Type**: `n8n-nodes-base.httpRequest` (v4.2)
- **Node ID**: `f483ae1d-4053-4f1e-8877-374900e3a770`
- **Position**: `[1060, 340]`
- **Amaç**: Hazırlanan OptimizationRequest'i FastAPI backend'ine göndermek.
- **Yapılandırma**:
  ```json
  {
    "method": "POST",
    "url": "http://host.docker.internal:8000/optimize",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={{ $json }}",
    "options": {}
  }
  ```
- **Response Mode**: Workflow'un son node'u olarak response döndürür

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

## Environment Variables ve Docker Konfigürasyonu

### n8n Environment Variables
```yaml
# docker-compose.yml
n8n:
  environment:
    - GENERIC_TIMEZONE=Europe/Istanbul
    - N8N_EDITOR_BASE_URL=http://localhost:5678
    - NODE_FUNCTION_ALLOW_EXTERNAL=js-yaml,yaml,fs-extra
```

### Docker Volume Mappings
```yaml
# docker-compose.yml
n8n:
  volumes:
    - ./n8n_data:/home/node/.n8n                    # n8n workflow ve ayar dosyaları
    - ./configs:/mnt/workflow_configs                # YAML konfigürasyon dosyaları
    - ./veri_kaynaklari:/mnt/workflow_data          # CSV veri dosyaları
```

## Step-by-Step Kurulum Rehberi

### 1. Ön Gereksinimler
- Docker ve Docker Compose kurulu olmalı
- n8n container'ı çalışır durumda olmalı
- FastAPI backend servisi aktif olmalı

### 2. Workflow Import Etme
1. n8n arayüzünde (http://localhost:5678) "Import from file" seçeneğini kullanın
2. `Vardiya.json` dosyasını seçin ve import edin
3. Workflow otomatik olarak aktif hale gelecektir

### 3. Dosya Yapısını Hazırlama
```
project_root/
├── configs/
│   ├── aktif_ayarlar.json
│   ├── hospital_test_config.yaml
│   └── cagri_merkezi_config.yaml
└── veri_kaynaklari/
    ├── hastane/
    │   ├── employees.csv
    │   ├── shifts.csv
    │   ├── availability.csv
    │   ├── preferences.csv
    │   └── skills.csv
    └── cagri_merkezi/
        ├── employees_cm.csv
        ├── shifts_cm.csv
        ├── availability_cm.csv
        ├── preferences_cm.csv
        └── skills_cm.csv
```

### 4. aktif_ayarlar.json Konfigürasyonu
```json
{
  "varsayilan_veri_seti": "hastane",
  "varsayilan_kural_seti_adi": "temel_kurallar"
}
```

### 5. Webhook Test Etme
```bash
curl -X POST "http://localhost:5678/webhook/98a3eec5-cce7-4a93-b2e5-2275b192b265" \
  -H "Content-Type: application/json" \
  -d '{"veriSeti": "hastane"}'
```

## Gelişmiş Hata Ayıklama Teknikleri

### Debug Teknikleri

#### 1. **Console Log İnceleme**
```javascript
// Code node'larında debug için
console.log("Debug: Webhook data:", JSON.stringify(webhookData, null, 2));
console.log("Debug: Merged items count:", allMergedItems.length);
```

#### 2. **Node Output İnceleme**
- n8n arayüzünde her node'a tıklayın
- "Executions" sekmesinden son çalıştırmaları görüntüleyin
- Input/Output data'yı JSON formatında inceleyin

#### 3. **Webhook Test Etme**
```bash
# Minimal test
curl -X POST "http://localhost:5678/webhook/98a3eec5-cce7-4a93-b2e5-2275b192b265" \
  -H "Content-Type: application/json" \
  -d '{}'

# Detaylı test
curl -X POST "http://localhost:5678/webhook/98a3eec5-cce7-4a93-b2e5-2275b192b265" \
  -H "Content-Type: application/json" \
  -d '{
    "veriSeti": "hastane",
    "objective_weights": {"understaffing_penalty": 100}
  }' -v
```

### Spesifik Hata Senaryoları

#### 1. **JavaScript Runtime Hatası**
**Semptom**: "ReferenceError" veya "TypeError" hataları
**Çözüm**:
- `NODE_FUNCTION_ALLOW_EXTERNAL=js-yaml` environment variable'ının set olduğunu kontrol edin
- n8n container'ını restart edin
- JavaScript kodundaki syntax hatalarını kontrol edin

#### 2. **Binary Data Processing Hatası**
**Semptom**: "Cannot read property 'data' of undefined"
**Çözüm**:
- Binary property names'lerin doğru olduğunu kontrol edin
- Extract CSV node'larının "Header Row: true" ayarını kontrol edin
- File read node'larının output'unu inceleyin

#### 3. **Merge Node Input Hatası**
**Semptom**: "Expected 6 inputs but got X"
**Çözüm**:
- Merge node'unun `numberInputs: 6` ayarını kontrol edin
- Tüm CSV extract node'larının Merge'e bağlı olduğunu kontrol edin
- YAML config node'unun da Merge'e bağlı olduğunu kontrol edin

### Performance Monitoring

#### 1. **Execution Time Tracking**
- n8n arayüzünde execution time'ları izleyin
- Yavaş node'ları tespit edin
- Büyük CSV dosyaları için timeout ayarlarını artırın

#### 2. **Memory Usage**
- Docker container memory usage'ını izleyin
- Büyük dosyalar için memory limit'lerini artırın

#### 3. **Error Rate Monitoring**
- Failed execution'ları düzenli olarak kontrol edin
- Retry mekanizmalarının çalıştığından emin olun

## Güvenlik Best Practices

### 1. **Webhook Security**
- Webhook URL'lerini güvenli tutun
- Production'da authentication ekleyin
- Rate limiting uygulayın

### 2. **File System Security**
- Dosya yollarında directory traversal saldırılarına karşı dikkatli olun
- Dosya izinlerini minimum gerekli seviyede tutun
- Input validation uygulayın

### 3. **API Security**
- FastAPI endpoint'lerini uygun authentication ile koruyun
- HTTPS kullanın (production'da)
- Request size limit'leri uygulayın
