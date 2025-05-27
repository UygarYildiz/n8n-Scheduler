# n8n İş Akışı Tasarımı: Veri Hazırlama ve Optimizasyon Tetikleme

Bu belge, farklı veri kaynaklarından (CSV dosyaları) veri okuyup işleyerek standart JSON formatına dönüştüren ve Python Optimizasyon Çekirdeği API'sini tetikleyen n8n iş akışının tasarımını açıklar.

**Ana Hedefler:**

*   Farklı veri dosyalarını (CSV) okumak ve binary data olarak işlemek.
*   Verileri birleştirmek ve `docs/data_model.md`'de tanımlanan `OptimizationRequest` JSON formatına dönüştürmek.
*   Kuruma özel YAML konfigürasyonu dahil etmek ve dinamik olarak güncellemek.
*   Webhook parametreleriyle dinamik yapılandırma sağlamak.
*   Python Optimizasyon Çekirdeği API'sine isteği göndermek.
*   Farklı kurum senaryolarına uyarlanabilir olmak.
*   Hata yönetimi ve retry mekanizmaları sağlamak.

## Workflow Genel Bakış

**Workflow ID:** `nEKfZ30L6vLyUMXe`
**Webhook ID:** `98a3eec5-cce7-4a93-b2e5-2275b192b265`
**Execution Order:** v1
**Status:** Active

## Node Yapısı ve Bağlantıları

İş akışı, aşağıdaki 12 ana node'dan oluşur:

### Node Listesi:
1. **Webhook** - HTTP trigger
2. **Read/Write Files from Disk** - Aktif ayarlar okuma
3. **Edit Fields** - Webhook parametrelerini işleme
4. **Ayar** - Dinamik konfigürasyon oluşturma
5. **Oku Temel Konfig** - YAML konfigürasyon okuma
6. **Employees** - CSV dosya okuma
7. **Shifts** - CSV dosya okuma
8. **Avaibility** - CSV dosya okuma (yazım hatası mevcut)
9. **Preferences** - CSV dosya okuma
10. **Skills** - CSV dosya okuma
11. **Extract CSV Nodes** (5 adet) - Binary data'yı JSON'a dönüştürme
12. **Merge** - Tüm verileri birleştirme
13. **Code** - Veri işleme ve API request hazırlama
14. **HTTP Request** - FastAPI'ye optimizasyon isteği gönderme

## Detaylı Node Konfigürasyonları

### 1. Webhook Node
* **Node Type:** `n8n-nodes-base.webhook` (v2)
* **Node ID:** `c8b8b5b1-8b1a-4b1a-8b1a-8b1a8b1a8b1a`
* **Position:** `[240, 300]`
* **Amaç:** İş akışını HTTP isteği ile tetiklemek ve dinamik parametreleri almak.
* **Yapılandırma:**
  ```json
  {
    "httpMethod": "POST",
    "path": "optimization",
    "responseMode": "lastNode",
    "options": {}
  }
  ```
* **Webhook URL:** `http://localhost:5678/webhook/98a3eec5-cce7-4a93-b2e5-2275b192b265`
* **Parametreler:** `veriSeti`, `objective_weights`, `solver_params`

### 2. Read/Write Files from Disk Node
* **Node Type:** `n8n-nodes-base.readWriteFile` (v1)
* **Node ID:** `4b8b5b1a-8b1a-4b1a-8b1a-8b1a8b1a8b1a`
* **Position:** `[460, 300]`
* **Amaç:** Sistemdeki aktif ayarlar dosyasını okumak.
* **Yapılandırma:**
  ```json
  {
    "operation": "read",
    "fileSelector": "/mnt/workflow_configs/aktif_ayarlar.json",
    "options": {
      "fileName": "aktifAyarlar"
    },
    "alwaysOutputData": true
  }
  ```

### 3. Edit Fields Node
* **Node Type:** `n8n-nodes-base.set` (v3.3)
* **Node ID:** `8b1a8b1a-8b1a-4b1a-8b1a-8b1a8b1a8b1a`
* **Position:** `[680, 300]`
* **Amaç:** Webhook parametrelerini işlemek ve temel ayarları belirlemek.
* **Yapılandırma:**
  ```json
  {
    "mode": "raw",
    "jsonOutput": "{{ $json }}"
  }
  ```

### 4. Ayar Node (JavaScript Code)
* **Node Type:** `n8n-nodes-base.code` (v2)
* **Node ID:** `ayar-node-id`
* **Position:** `[900, 300]`
* **Amaç:** Webhook parametreleri ve aktif ayarları kullanarak dinamik dosya yollarını belirlemek.
* **Girdi:**
  - `items[0].json` - Edit Fields düğümünden gelen webhook parametreleri
  - `items[1].binary.data.data` - aktif_ayarlar.json dosyasının binary içeriği
* **JavaScript Kodu:**
  ```javascript
  const upstreamNodeOutput = items[0].json;

  let aktifAyarlar;
  try {
    const aktifAyarlarStr = Buffer.from(items[1].binary.data.data, 'base64').toString();
    aktifAyarlar = JSON.parse(aktifAyarlarStr);
  } catch (error) {
    aktifAyarlar = {
      varsayilan_veri_seti: "hastane",
      varsayilan_kural_seti_adi: "temel_kurallar"
    };
  }

  const nihaiVeriSeti = upstreamNodeOutput.veriSeti || aktifAyarlar.varsayilan_veri_seti;
  const nihaiKuralSeti = upstreamNodeOutput.kurallar || aktifAyarlar.varsayilan_kural_seti_adi;

  // Dinamik dosya yolları oluşturma
  const configPath = nihaiVeriSeti === "cagri_merkezi" ?
    "/mnt/workflow_configs/cagri_merkezi_config.yaml" :
    "/mnt/workflow_configs/hospital_test_config.yaml";

  const basePath = `/mnt/workflow_data/${nihaiVeriSeti}`;

  return [{
    json: {
      veriSeti: nihaiVeriSeti,
      kuralSeti: nihaiKuralSeti,
      configPath: configPath,
      employeesPath: `${basePath}/employees.csv`,
      shiftsPath: `${basePath}/shifts.csv`,
      availabilityPath: `${basePath}/availability.csv`,
      preferencesPath: `${basePath}/preferences.csv`,
      skillsPath: `${basePath}/skills.csv`,
      objective_weights: upstreamNodeOutput.objective_weights,
      solver_params: upstreamNodeOutput.solver_params
    }
  }];
  ```

### 5. Oku Temel Konfig Node
* **Node Type:** `n8n-nodes-base.readWriteFile` (v1)
* **Node ID:** `oku-temel-konfig-id`
* **Position:** `[1120, 300]`
* **Amaç:** Belirlenen veri setine ait YAML konfigürasyon dosyasını okumak.
* **Yapılandırma:**
  ```json
  {
    "operation": "read",
    "fileSelector": "={{ $node[\"Ayar\"].json.configPath }}",
    "options": {
      "fileName": "baseConfigYamlContent"
    }
  }
  ```

### 6. CSV Dosya Okuma Node'ları
Her CSV dosyası için ayrı bir Read/Write Files node'u bulunur:

#### 6.1 Employees Node
* **Node Type:** `n8n-nodes-base.readWriteFile` (v1)
* **Position:** `[1120, 180]`
* **Yapılandırma:**
  ```json
  {
    "operation": "read",
    "fileSelector": "={{ $node[\"Ayar\"].json.employeesPath }}",
    "options": {
      "fileName": "employeesData"
    }
  }
  ```

#### 6.2 Shifts Node
* **Node Type:** `n8n-nodes-base.readWriteFile` (v1)
* **Position:** `[1120, 240]`
* **Yapılandırma:**
  ```json
  {
    "operation": "read",
    "fileSelector": "={{ $node[\"Ayar\"].json.shiftsPath }}",
    "options": {
      "fileName": "shiftsData"
    }
  }
  ```

#### 6.3 Avaibility Node (Yazım hatası mevcut)
* **Node Type:** `n8n-nodes-base.readWriteFile` (v1)
* **Position:** `[1120, 360]`
* **Yapılandırma:**
  ```json
  {
    "operation": "read",
    "fileSelector": "={{ $node[\"Ayar\"].json.availabilityPath }}",
    "options": {
      "fileName": "availabilityData"
    }
  }
  ```

#### 6.4 Preferences Node
* **Node Type:** `n8n-nodes-base.readWriteFile` (v1)
* **Position:** `[1120, 420]`
* **Yapılandırma:**
  ```json
  {
    "operation": "read",
    "fileSelector": "={{ $node[\"Ayar\"].json.preferencesPath }}",
    "options": {
      "fileName": "preferencesData"
    }
  }
  ```

#### 6.5 Skills Node
* **Node Type:** `n8n-nodes-base.readWriteFile` (v1)
* **Position:** `[1120, 480]`
* **Yapılandırma:**
  ```json
  {
    "operation": "read",
    "fileSelector": "={{ $node[\"Ayar\"].json.skillsPath }}",
    "options": {
      "fileName": "skillsData"
    }
  }
  ```

### 7. CSV Extract Node'ları
Binary data'yı JSON formatına dönüştüren 5 adet Extract CSV node'u:

#### 7.1 Extract Employees CSV
* **Node Type:** `n8n-nodes-base.extractFromFile` (v1)
* **Position:** `[1340, 180]`
* **Yapılandırma:**
  ```json
  {
    "operation": "extractFromCSV",
    "binaryPropertyName": "employeesData",
    "options": {
      "headerRow": true
    }
  }
  ```

#### 7.2 Extract Shifts CSV
* **Node Type:** `n8n-nodes-base.extractFromFile` (v1)
* **Position:** `[1340, 240]`
* **Yapılandırma:**
  ```json
  {
    "operation": "extractFromCSV",
    "binaryPropertyName": "shiftsData",
    "options": {
      "headerRow": true
    }
  }
  ```

#### 7.3 Extract Availability CSV
* **Node Type:** `n8n-nodes-base.extractFromFile` (v1)
* **Position:** `[1340, 360]`
* **Yapılandırma:**
  ```json
  {
    "operation": "extractFromCSV",
    "binaryPropertyName": "availabilityData",
    "options": {
      "headerRow": true
    }
  }
  ```

#### 7.4 Extract Preferences CSV
* **Node Type:** `n8n-nodes-base.extractFromFile` (v1)
* **Position:** `[1340, 420]`
* **Yapılandırma:**
  ```json
  {
    "operation": "extractFromCSV",
    "binaryPropertyName": "preferencesData",
    "options": {
      "headerRow": true
    }
  }
  ```

#### 7.5 Extract Skills CSV
* **Node Type:** `n8n-nodes-base.extractFromFile` (v1)
* **Position:** `[1340, 480]`
* **Yapılandırma:**
  ```json
  {
    "operation": "extractFromCSV",
    "binaryPropertyName": "skillsData",
    "options": {
      "headerRow": true
    }
  }
  ```

### 8. Merge Node
* **Node Type:** `n8n-nodes-base.merge` (v3.1)
* **Node ID:** `merge-node-id`
* **Position:** `[1560, 300]`
* **Amaç:** Tüm CSV verilerini ve YAML konfigürasyonunu tek bir veri akışında birleştirmek.
* **Yapılandırma:**
  ```json
  {
    "mode": "mergeByPosition",
    "numberInputs": 6,
    "options": {}
  }
  ```
* **Input Connections:**
  1. Extract Employees CSV
  2. Extract Shifts CSV
  3. Extract Availability CSV
  4. Extract Preferences CSV
  5. Extract Skills CSV
  6. Oku Temel Konfig (YAML)

### 9. Code Node (Ana Veri İşleme)
* **Node Type:** `n8n-nodes-base.code` (v2)
* **Node ID:** `code-main-processing`
* **Position:** `[1780, 300]`
* **Amaç:** Tüm verileri işleyip FastAPI'ye gönderilecek OptimizationRequest formatına dönüştürmek.
* **Girdi:** Merge node'undan gelen 6 input (5 CSV + 1 YAML)
* **JavaScript Kodu (87 satır):**
  ```javascript
  // YAML kütüphanesini yükle
  const yaml = require('js-yaml');

  // Merge edilen verileri al
  const mergedData = items;

  // YAML konfigürasyonunu parse et
  let baseConfig;
  try {
    const yamlContent = Buffer.from(mergedData[5].binary.baseConfigYamlContent.data, 'base64').toString();
    baseConfig = yaml.load(yamlContent);
  } catch (error) {
    console.error('YAML parse hatası:', error);
    throw new Error('YAML konfigürasyon dosyası okunamadı');
  }

  // Webhook parametrelerini al (Ayar node'undan gelen)
  const webhookParams = $node["Ayar"].json;

  // Objective weights'i güncelle (eğer webhook'tan geliyorsa)
  if (webhookParams.objective_weights) {
    baseConfig.objective_weights = {
      ...baseConfig.objective_weights,
      ...webhookParams.objective_weights
    };
  }

  // Solver params'ı güncelle (eğer webhook'tan geliyorsa)
  if (webhookParams.solver_params) {
    baseConfig.solver_params = {
      ...baseConfig.solver_params,
      ...webhookParams.solver_params
    };
  }

  // CSV verilerini kategorilere ayır
  const employees = mergedData[0].json || [];
  const shifts = mergedData[1].json || [];
  const availability = mergedData[2].json || [];
  const preferences = mergedData[3].json || [];
  const skills = mergedData[4].json || [];

  // Veri doğrulama
  if (!employees.length) throw new Error('Employees verisi bulunamadı');
  if (!shifts.length) throw new Error('Shifts verisi bulunamadı');

  // Departman analizi
  const employeeDepartments = new Set(employees.map(e => e.department).filter(d => d));
  const shiftDepartments = new Set(shifts.map(s => s.department).filter(d => d));

  // Vardiyası olan ama çalışanı olmayan departmanları tespit et
  const orphanDepartments = [...shiftDepartments].filter(dept => !employeeDepartments.has(dept));

  if (orphanDepartments.length > 0) {
    console.warn('Uyarı: Şu departmanlarda vardiya var ama çalışan yok:', orphanDepartments);
  }

  // Departman istatistikleri
  const departmentStats = {};
  employeeDepartments.forEach(dept => {
    const deptEmployees = employees.filter(e => e.department === dept);
    const deptShifts = shifts.filter(s => s.department === dept);

    departmentStats[dept] = {
      employee_count: deptEmployees.length,
      shift_count: deptShifts.length,
      employees: deptEmployees.map(e => e.employee_id || e.id)
    };
  });

  // API request formatını oluştur
  const optimizationRequest = {
    employees: employees,
    shifts: shifts,
    availability: availability,
    preferences: preferences,
    skills: skills,
    config: baseConfig,
    metadata: {
      veri_seti: webhookParams.veriSeti,
      kural_seti: webhookParams.kuralSeti,
      config_file: webhookParams.configPath,
      department_stats: departmentStats,
      orphan_departments: orphanDepartments,
      processing_timestamp: new Date().toISOString()
    }
  };

  return [{ json: optimizationRequest }];
  ```

### 10. HTTP Request Node
* **Node Type:** `n8n-nodes-base.httpRequest` (v4.2)
* **Node ID:** `http-request-optimize`
* **Position:** `[2000, 300]`
* **Amaç:** Hazırlanan OptimizationRequest'i FastAPI backend'ine göndermek.
* **Yapılandırma:**
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
        },
        {
          "name": "Accept",
          "value": "application/json"
        }
      ]
    },
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={{ $json }}",
    "options": {
      "timeout": 300000,
      "retry": {
        "enabled": true,
        "maxRetries": 2,
        "retryDelay": 5000
      }
    }
  }
  ```
* **Timeout:** 5 dakika (300000ms)
* **Retry Logic:** 2 deneme, 5 saniye aralık
* **Response Mode:** Workflow'un son node'u olarak response döndürür

## Node Bağlantıları (Connections)

Workflow'daki node'lar arasındaki bağlantı yapısı:

```
Webhook → Read/Write Files from Disk (aktif_ayarlar.json)
       ↓
Edit Fields → Ayar (Code)
           ↓
Ayar → Oku Temel Konfig (YAML)
    ↓
    → Employees → Extract Employees CSV
    → Shifts → Extract Shifts CSV
    → Avaibility → Extract Availability CSV  } → Merge → Code → HTTP Request
    → Preferences → Extract Preferences CSV
    → Skills → Extract Skills CSV
```

## Environment Variables ve Docker Integration

### n8n Environment Variables
```yaml
# docker-compose.yml
n8n:
  environment:
    - GENERIC_TIMEZONE=Europe/Istanbul
    - N8N_EDITOR_BASE_URL=http://localhost:5678
    - NODE_FUNCTION_ALLOW_EXTERNAL=js-yaml,yaml,fs-extra
```

**Açıklamalar:**
- `GENERIC_TIMEZONE`: Türkiye saat dilimi
- `N8N_EDITOR_BASE_URL`: Webhook URL'leri için base URL
- `NODE_FUNCTION_ALLOW_EXTERNAL`: JavaScript Code node'larında kullanılacak external kütüphaneler

### Docker Volume Mappings
```yaml
# docker-compose.yml
n8n:
  volumes:
    - ./n8n_data:/home/node/.n8n                    # n8n workflow ve ayar dosyaları
    - ./configs:/mnt/workflow_configs                # YAML konfigürasyon dosyaları
    - ./veri_kaynaklari:/mnt/workflow_data          # CSV veri dosyaları
    - ./configs/kurallar:/configs/kurallar          # Kural dosyaları (opsiyonel)
```

**Volume Açıklamaları:**
- `/mnt/workflow_configs`: YAML konfigürasyon dosyalarına erişim
- `/mnt/workflow_data`: CSV veri dosyalarına erişim
- `/home/node/.n8n`: n8n workflow ve credential dosyaları
- `/configs/kurallar`: Ek kural dosyaları için

## Hata Yönetimi ve Retry Mekanizmaları

### 1. JavaScript Code Node'larında Hata Yönetimi

**Ayar Node'unda:**
```javascript
let aktifAyarlar;
try {
  const aktifAyarlarStr = Buffer.from(items[1].binary.data.data, 'base64').toString();
  aktifAyarlar = JSON.parse(aktifAyarlarStr);
} catch (error) {
  // Varsayılan değerlerle devam et
  aktifAyarlar = {
    varsayilan_veri_seti: "hastane",
    varsayilan_kural_seti_adi: "temel_kurallar"
  };
}
```

**Ana Code Node'unda:**
```javascript
// YAML parse hatası
try {
  const yamlContent = Buffer.from(mergedData[5].binary.baseConfigYamlContent.data, 'base64').toString();
  baseConfig = yaml.load(yamlContent);
} catch (error) {
  console.error('YAML parse hatası:', error);
  throw new Error('YAML konfigürasyon dosyası okunamadı');
}

// Veri doğrulama
if (!employees.length) throw new Error('Employees verisi bulunamadı');
if (!shifts.length) throw new Error('Shifts verisi bulunamadı');
```

### 2. HTTP Request Node Retry Logic

```json
{
  "options": {
    "timeout": 300000,
    "retry": {
      "enabled": true,
      "maxRetries": 2,
      "retryDelay": 5000
    }
  }
}
```

**Retry Stratejisi:**
- **Timeout:** 5 dakika (300000ms)
- **Max Retries:** 2 deneme
- **Retry Delay:** 5 saniye aralık
- **Retry Conditions:** Network errors, timeouts, 5xx HTTP errors

### 3. File Read Error Handling

Dosya okuma node'larında `alwaysOutputData: true` ayarı ile dosya bulunamadığında bile workflow devam eder:

```json
{
  "alwaysOutputData": true,
  "options": {
    "fileName": "employeesData"
  }
}
```

## Performance Optimizations

### 1. Binary Data Processing
- CSV dosyaları binary data olarak işlenir
- Memory efficient processing
- Large file support

### 2. Parallel Processing
- 5 CSV dosyası paralel olarak okunur
- Extract operations paralel çalışır
- Merge node'unda birleştirilir

### 3. Caching Strategy
- `aktif_ayarlar.json` bir kez okunur
- YAML konfigürasyon cache'lenir
- Webhook parametreleri override eder

## Webhook Kullanım Örnekleri

### 1. Temel Kullanım
```bash
curl -X POST "http://localhost:5678/webhook/98a3eec5-cce7-4a93-b2e5-2275b192b265" \
  -H "Content-Type: application/json" \
  -d '{
    "veriSeti": "hastane"
  }'
```

### 2. Objective Weights ile Kullanım
```bash
curl -X POST "http://localhost:5678/webhook/98a3eec5-cce7-4a93-b2e5-2275b192b265" \
  -H "Content-Type: application/json" \
  -d '{
    "veriSeti": "cagri_merkezi",
    "objective_weights": {
      "understaffing_penalty": 100,
      "overstaffing_penalty": 50,
      "preference_weight": 10
    }
  }'
```

### 3. Solver Parameters ile Kullanım
```bash
curl -X POST "http://localhost:5678/webhook/98a3eec5-cce7-4a93-b2e5-2275b192b265" \
  -H "Content-Type: application/json" \
  -d '{
    "veriSeti": "hastane",
    "solver_params": {
      "max_time_in_seconds": 300,
      "num_search_workers": 4
    }
  }'
```

## Esneklik ve Uyarlanabilirlik

### 1. Dinamik Konfigürasyon
- **Webhook Parametreleri:** Runtime'da konfigürasyon değişikliği
- **Aktif Ayarlar:** Varsayılan değerlerin merkezi yönetimi
- **YAML Override:** Base konfigürasyonun dinamik güncellenmesi

### 2. Multi-Dataset Support
- **Veri Seti Seçimi:** `veriSeti` parametresi ile
- **Dinamik Dosya Yolları:** Otomatik path resolution
- **Konfigürasyon Mapping:** Her veri seti için özel YAML

### 3. Extensibility
- **Yeni Veri Seti Ekleme:** Sadece Ayar node'unda path ekleme
- **Yeni CSV Türü:** Extract node'u ekleme
- **Yeni Konfigürasyon:** YAML dosyası ekleme

### 4. Error Recovery
- **Graceful Degradation:** Eksik dosyalarda varsayılan değerler
- **Retry Mechanisms:** Network ve timeout hatalarında yeniden deneme
- **Validation:** Veri doğrulama ve early error detection

Bu workflow, production-ready bir n8n implementasyonu olarak tasarlanmış olup, hem development hem de production ortamlarında güvenilir şekilde çalışacak şekilde optimize edilmiştir.