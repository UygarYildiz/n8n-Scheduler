# n8n İş Akışı Tasarımı: Veri Hazırlama ve Optimizasyon Tetikleme

Bu belge, `synthetic_data` klasöründeki CSV dosyalarını okuyup işleyerek standart JSON formatına dönüştüren ve Python Optimizasyon Çekirdeği API'sini tetikleyen n8n iş akışının önerilen tasarımını açıklar.

**Ana Hedefler:**

*   Farklı veri dosyalarını (CSV) okumak.
*   Verileri birleştirmek ve `docs/data_model.md`'de tanımlanan `OptimizationRequest` JSON formatına dönüştürmek.
*   Kuruma özel konfigürasyonu dahil etmek.
*   Python Optimizasyon Çekirdeği API'sine isteği göndermek.
*   Farklı kurum senaryolarına uyarlanabilir olmak.

## Önerilen İş Akışı Adımları ve Nodeları

```mermaid
graph LR
    A[Start] --> B(Set: Kurum Bilgileri);
    B --> C{Read Config File (.yaml)};
    C --> D(Code: Parse YAML);
    B --> E(Read employees.csv);
    B --> F(Read skills.csv);
    B --> G(Read shifts.csv);
    B --> H(Read availability.csv);
    B --> I(Read preferences.csv);
    E --> J(Spreadsheet File: Parse Emp);
    F --> K(Spreadsheet File: Parse Skills);
    G --> L(Spreadsheet File: Parse Shifts);
    H --> M(Spreadsheet File: Parse Avail);
    I --> N(Spreadsheet File: Parse Prefs);
    D --> O(Code: Veri Birleştirme ve input_data Oluşturma);
    J --> O;
    K --> O;
    L --> O;
    M --> O;
    N --> O;
    O --> P(Set: API Request Body Oluşturma);
    P --> Q(HTTP Request: /optimize Çağır);
    Q --> R[End: Sonucu İşle];

    style C fill:#f9f,stroke:#333,stroke-width:1px
    style E fill:#f9f,stroke:#333,stroke-width:1px
    style F fill:#f9f,stroke:#333,stroke-width:1px
    style G fill:#f9f,stroke:#333,stroke-width:1px
    style H fill:#f9f,stroke:#333,stroke-width:1px
    style I fill:#f9f,stroke:#333,stroke-width:1px
    style J fill:#ccf,stroke:#333,stroke-width:1px
    style K fill:#ccf,stroke:#333,stroke-width:1px
    style L fill:#ccf,stroke:#333,stroke-width:1px
    style M fill:#ccf,stroke:#333,stroke-width:1px
    style N fill:#ccf,stroke:#333,stroke-width:1px
    style D fill:#ccf,stroke:#333,stroke-width:1px
    style O fill:#ccf,stroke:#333,stroke-width:2px
    style P fill:#ccf,stroke:#333,stroke-width:1px
    style Q fill:#9cf,stroke:#333,stroke-width:2px
```

1.  **Start:** Akışı başlatır (Manuel, Zamanlanmış vb.).
2.  **Set: Kurum Bilgileri (Esneklik için):**
    *   **Node:** `Set`
    *   **Amaç:** Hangi kurum için çalışılacağını belirler. Bu, akışın farklı kurumlar için yeniden kullanılmasını sağlar.
    *   **Örnek:** `institution_id` = "hospital_A", `config_file_path` = "configs/hospital_A_config.yaml", `data_folder_path` = "synthetic_data" gibi değerler ayarlanabilir. Bu değerler akışın başında manuel olarak veya bir üst akıştan/tetikleyiciden alınabilir.
3.  **Read Config File (.yaml):**
    *   **Node:** `Read File` veya `Read Binary File`
    *   **Amaç:** 2. adımda belirlenen `config_file_path`'daki YAML konfigürasyon dosyasını okur.
    *   **Output:** Dosya içeriğini bir property'ye (örn. `yamlConfigContent`) atar.
4.  **Code: Parse YAML:**
    *   **Node:** `Code` (JavaScript)
    *   **Amaç:** Okunan YAML metnini JSON nesnesine dönüştürür. (n8n'de yerleşik YAML parse nodu yoksa bu gerekli olabilir).
    *   **Girdi:** `yamlConfigContent`.
    *   **Kütüphane:** `yaml` npm kütüphanesi kullanılabilir (n8n ortam değişkenlerine eklenmesi gerekebilir: `NODE_FUNCTION_ALLOW_EXTERNAL=yaml`).
    *   **Output:** Parsed edilmiş konfigürasyon nesnesini (örn. `parsedConfig`) bir property'ye atar.
5.  **CSV Dosyalarını Oku (Paralel):**
    *   **Nodes:** Her CSV için ayrı `Read Binary File` nodları.
    *   **Amaç:** `employees.csv`, `skills.csv`, `shifts.csv`, `availability.csv`, `preferences.csv` dosyalarını okur. Dosya yolları 2. adımda belirlenen `data_folder_path` kullanılarak dinamik hale getirilebilir.
    *   **Output:** Her dosyanın içeriği ayrı property'lere (örn. `employeesCsv`, `skillsCsv` vb.) atanır.
6.  **CSV Verilerini Ayrıştır (Paralel):**
    *   **Nodes:** Her okuma nodundan sonra `Spreadsheet File` nodları.
    *   **Amaç:** CSV metinlerini JSON dizilerine dönüştürür.
    *   **Input:** İlgili CSV içeriği (örn. `{{ $json.employeesCsv }}`).
    *   **Output:** Ayrıştırılmış veriler (örn. `parsedEmployees`, `parsedSkills` vb.).
7.  **Code: Veri Birleştirme ve `input_data` Oluşturma:**
    *   **Node:** `Code` (JavaScript)
    *   **Amaç:** Bu akışın kalbidir. Farklı CSV'lerden gelen ayrıştırılmış verileri alır ve `docs/data_model.md`'deki `input_data` yapısına uygun tek bir JSON nesnesi oluşturur.
    *   **Girdi:** `parsedEmployees`, `parsedSkills`, `parsedShifts`, `parsedAvailability`, `parsedPreferences`.
    *   **Mantık:** Yetenekleri, uygunlukları, tercihleri `employee_id` bazında gruplayıp ana çalışan nesnelerine ekler. Vardiya verilerini formatlar.
    *   **Output:** `input_data` JSON nesnesi.
8.  **Set: API Request Body Oluşturma:**
    *   **Node:** `Set`
    *   **Amaç:** Python API'sinin beklediği tam `OptimizationRequest` JSON gövdesini oluşturur.
    *   **Girdi:** `parsedConfig` (Adım 4'ten) ve `input_data` (Adım 7'den).
    *   **Mantık:** `configuration` (veya `configuration_ref`) ve `input_data` alanlarını içeren bir nesne oluşturur.
    *   **Output:** Tam istek gövdesi (örn. `apiRequestPayload`).
9.  **HTTP Request: /optimize Çağır:**
    *   **Node:** `HTTP Request`
    *   **Amaç:** Hazırlanan JSON isteğini Python Optimizasyon Çekirdeği API'sine gönderir.
    *   **URL:** `http://localhost:8000/optimize` (veya ortamınıza uygun adres).
    *   **Method:** `POST`
    *   **Body:** `{{ JSON.stringify($json.apiRequestPayload) }}`.
    *   **Options:** Gerekli header'ları (örn. `Content-Type: application/json`) ayarlar.
10. **End: Sonucu İşle:**
    *   **Node(lar):** `Set`, `If`, `NoOp` vb.
    *   **Amaç:** API'den dönen yanıtı (`OptimizationResponse`) alır. Başlangıçta sadece yanıtı loglayabilir veya görüntüleyebilir. İleride, yanıttaki `status`'e göre farklı işlemler (başarılı ise raporlama, başarısız ise hata bildirimi) yapılabilir.

## Esneklik ve Uyarlanabilirlik Notları

*   **Parametrik Başlangıç:** Akışın başındaki `Set` nodu (Adım 2), farklı kurumlar için farklı konfigürasyon dosyalarını veya veri klasörlerini kolayca belirtmeyi sağlar.
*   **Standart Çıktı:** Veri Birleştirme nodu (Adım 7) her zaman standart `input_data` formatını hedefler. Eğer bir kurumun ham veri yapısı çok farklıysa (örn. CSV yerine veritabanı), sadece o kuruma özel veri okuma (Adım 5) ve ayrıştırma (Adım 6) nodları değiştirilir, akışın geri kalanı büyük ölçüde aynı kalır.
*   **Ayrı Akışlar:** Çok farklı optimizasyon problemleri (örn. çizelgeleme vs. rotalama) için bu akış kopyalanıp, özellikle Veri Birleştirme (Adım 7) ve API Çağrısı (Adım 9) kısımları probleme göre özelleştirilebilir.

Bu taslak, hem mevcut yapay verilerle çalışacak hem de gelecekte farklı veri kaynaklarına ve kurallara uyum sağlayabilecek esnek bir yapı sunmayı hedeflemektedir. 