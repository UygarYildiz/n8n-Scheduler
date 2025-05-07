# n8n İş Akışı Kullanım Kılavuzu

Bu belge, n8n platformunda oluşturulan "Vardiya Deneme" iş akışının nasıl kullanılacağını ve yapılandırılacağını açıklar. Bu iş akış, farklı veri kaynaklarından (CSV dosyaları) veri okuyarak, bunları işleyip Optimizasyon API'sine göndermek için tasarlanmıştır.

## İş Akışı Genel Bakış

"Vardiya Deneme" iş akışı, aşağıdaki temel adımlardan oluşur:

1. **Webhook ile Tetikleme**: İş akışı bir webhook aracılığıyla tetiklenir ve dinamik parametreler alır.
2. **Ayarların Belirlenmesi**: Webhook parametrelerine göre hangi veri seti ve konfigürasyon dosyasının kullanılacağı belirlenir.
3. **Dosya Okuma**: Belirlenen veri setine ait CSV dosyaları (çalışanlar, vardiyalar, yetenekler, uygunluklar, tercihler) okunur.
4. **Veri Çıkarma**: CSV dosyalarından veriler çıkarılır ve işlenir.
5. **Veri Birleştirme**: Tüm veriler birleştirilir ve API'ye gönderilecek formata dönüştürülür.
6. **API Çağrısı**: Hazırlanan veriler Optimizasyon API'sine gönderilir.
7. **Sonuç İşleme**: API'den dönen sonuçlar işlenir ve gerekirse raporlanır.

## Webhook Kullanımı

İş akışı, aşağıdaki parametreleri alan bir webhook ile tetiklenir:

- **veriSeti**: Hangi veri setinin kullanılacağını belirtir (örn. "hastane", "cagri_merkezi").
- **kurallar**: Hangi kural setinin kullanılacağını belirtir (örn. "temel_kurallar").

### Webhook URL Formatı

```
http://localhost:5678/webhook/[webhook-id]?veriSeti=hastane&kurallar=temel_kurallar
```

### Örnek Kullanımlar

1. **Hastane Veri Seti ile Temel Kurallar**:
   ```
   http://localhost:5678/webhook/[webhook-id]?veriSeti=hastane&kurallar=temel_kurallar
   ```

2. **Çağrı Merkezi Veri Seti ile Alternatif Kurallar**:
   ```
   http://localhost:5678/webhook/[webhook-id]?veriSeti=cagri_merkezi&kurallar=alternatif_kurallar
   ```

## İş Akışı Düğümleri ve Yapılandırma

### 1. Webhook Düğümü

- **Amaç**: İş akışını HTTP isteği ile tetiklemek.
- **Yapılandırma**:
  - HTTP Method: GET
  - Authentication: None
  - Response Mode: Last Node

### 2. Ayar Düğümü

- **Amaç**: Webhook parametrelerine göre dosya yollarını belirlemek.
- **Yapılandırma**:
  - Webhook'tan gelen `veriSeti` ve `kurallar` parametrelerini kullanarak dosya yollarını oluşturur.
  - **JavaScript Kodu**:
    ```javascript
    // Webhook'tan gelen parametreleri al
    const veriSeti = $node["Webhook"].json.query.veriSeti || "hastane"; // Varsayılan: hastane
    const kurallar = $node["Webhook"].json.query.kurallar || "temel_kurallar"; // Varsayılan: temel_kurallar

    // Veri setine göre dosya yollarını belirle
    if (veriSeti === "hastane") {
      return {
        json: {
          employeesPath: "/veri_kaynaklari/hastane/employees.csv",
          shiftsPath: "/veri_kaynaklari/hastane/shifts.csv",
          skillsPath: "/veri_kaynaklari/hastane/skills.csv",
          availabilityPath: "/veri_kaynaklari/hastane/availability.csv",
          preferencesPath: "/veri_kaynaklari/hastane/preferences.csv",
          configPath: "/configs/hospital_test_config.yaml"
        }
      };
    } else if (veriSeti === "cagri_merkezi") {
      return {
        json: {
          employeesPath: "/veri_kaynaklari/cagri_merkezi/employees.csv",
          shiftsPath: "/veri_kaynaklari/cagri_merkezi/shifts.csv",
          skillsPath: "/veri_kaynaklari/cagri_merkezi/skills.csv",
          availabilityPath: "/veri_kaynaklari/cagri_merkezi/availability.csv",
          preferencesPath: "/veri_kaynaklari/cagri_merkezi/preferences.csv",
          configPath: "/configs/cagri_merkezi_config.yaml"
        }
      };
    } else {
      // Bilinmeyen veri seti için hata mesajı
      throw new Error(`Bilinmeyen veri seti: ${veriSeti}`);
    }
    ```
  - **Örnek Çıktı (Hastane)**:
    ```json
    {
      "employeesPath": "/veri_kaynaklari/hastane/employees.csv",
      "shiftsPath": "/veri_kaynaklari/hastane/shifts.csv",
      "skillsPath": "/veri_kaynaklari/hastane/skills.csv",
      "availabilityPath": "/veri_kaynaklari/hastane/availability.csv",
      "preferencesPath": "/veri_kaynaklari/hastane/preferences.csv",
      "configPath": "/configs/hospital_test_config.yaml"
    }
    ```
  - **Örnek Çıktı (Çağrı Merkezi)**:
    ```json
    {
      "employeesPath": "/veri_kaynaklari/cagri_merkezi/employees.csv",
      "shiftsPath": "/veri_kaynaklari/cagri_merkezi/shifts.csv",
      "skillsPath": "/veri_kaynaklari/cagri_merkezi/skills.csv",
      "availabilityPath": "/veri_kaynaklari/cagri_merkezi/availability.csv",
      "preferencesPath": "/veri_kaynaklari/cagri_merkezi/preferences.csv",
      "configPath": "/configs/cagri_merkezi_config.yaml"
    }
    ```

### 3. Dosya Okuma Düğümleri

- **Employees**: `{{ $node["Ayar"].json.employeesPath }}` yolundaki CSV dosyasını okur.
- **Shifts**: `{{ $node["Ayar"].json.shiftsPath }}` yolundaki CSV dosyasını okur.
- **Skills**: `{{ $node["Ayar"].json.skillsPath }}` yolundaki CSV dosyasını okur.
- **Availability**: `{{ $node["Ayar"].json.availabilityPath }}` yolundaki CSV dosyasını okur.
- **Preferences**: `{{ $node["Ayar"].json.preferencesPath }}` yolundaki CSV dosyasını okur.

### 4. CSV Çıkarma Düğümleri

- Her bir dosya okuma düğümünden sonra, okunan CSV verilerini JSON formatına dönüştürür.
- **Extract Employees CSV**, **Extract Shifts CSV**, **Extract Skills CSV**, **Extract Availability CSV**, **Extract Preferences CSV**

### 5. Merge Düğümü

- **Amaç**: Tüm CSV verilerini tek bir veri akışında birleştirmek.
- **Yapılandırma**:
  - Mode: Merge By Position
  - Merge All Branches: Yes

### 6. Code Düğümü

- **Amaç**: Verileri işleyip API'ye gönderilecek formata dönüştürmek.
- **Yapılandırma**:
  - Çalışan ve vardiya verilerini işler.
  - Departman bilgilerini kontrol eder.
  - API'ye gönderilecek JSON formatını oluşturur.
  - Konfigürasyon dosyası referansını ekler.

### 7. HTTP Request Düğümü

- **Amaç**: Hazırlanan verileri Optimizasyon API'sine göndermek.
- **Yapılandırma**:
  - Method: POST
  - URL: http://localhost:8000/optimize
  - Body Type: JSON
  - JSON/RAW: Code düğümünden gelen işlenmiş veri

## Hata Ayıklama ve Sorun Giderme

### Yaygın Sorunlar ve Çözümleri

1. **Dosya Yolu Hataları**:
   - Hata: `[undefined]` değeri alınması.
   - Çözüm: Ayar düğümünün çıktısını kontrol edin ve dosya yollarının doğru oluşturulduğundan emin olun.

2. **CSV Okuma Hataları**:
   - Hata: CSV dosyası okunamıyor.
   - Çözüm: Docker volume bağlantılarını kontrol edin ve dosyaların belirtilen yollarda mevcut olduğundan emin olun.

3. **API Bağlantı Hataları**:
   - Hata: API'ye bağlanılamıyor.
   - Çözüm: API'nin çalıştığından emin olun (`uvicorn optimization_core.main:app --reload --port 8000`).

4. **Departman Bilgisi Sorunları**:
   - Hata: Vardiyaların departman bilgisi boş görünüyor.
   - Çözüm: Code düğümünde departman bilgilerinin doğru şekilde işlendiğinden emin olun.

## Hastane ve Çağrı Merkezi Veri Setleri

İş akışı, hem hastane hem de çağrı merkezi veri setleri için kullanılabilir. Her iki veri seti için ayrı dosya yolları ve konfigürasyon dosyaları tanımlanmıştır.

### Hastane Veri Seti Kullanımı

Hastane veri seti, sağlık kurumlarına özgü vardiya çizelgeleme senaryoları için tasarlanmıştır.

1. **Webhook URL**:
   ```
   http://localhost:5678/webhook/[webhook-id]?veriSeti=hastane&kurallar=temel_kurallar
   ```

2. **Kullanılan Dosyalar**:
   - Çalışanlar: `/veri_kaynaklari/hastane/employees.csv`
   - Vardiyalar: `/veri_kaynaklari/hastane/shifts.csv`
   - Yetenekler: `/veri_kaynaklari/hastane/skills.csv`
   - Uygunluklar: `/veri_kaynaklari/hastane/availability.csv`
   - Tercihler: `/veri_kaynaklari/hastane/preferences.csv`
   - Konfigürasyon: `/configs/hospital_test_config.yaml`

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

1. **Webhook URL**:
   ```
   http://localhost:5678/webhook/[webhook-id]?veriSeti=cagri_merkezi&kurallar=temel_kurallar
   ```

2. **Kullanılan Dosyalar**:
   - Çalışanlar: `/veri_kaynaklari/cagri_merkezi/employees.csv`
   - Vardiyalar: `/veri_kaynaklari/cagri_merkezi/shifts.csv`
   - Yetenekler: `/veri_kaynaklari/cagri_merkezi/skills.csv`
   - Uygunluklar: `/veri_kaynaklari/cagri_merkezi/availability.csv`
   - Tercihler: `/veri_kaynaklari/cagri_merkezi/preferences.csv`
   - Konfigürasyon: `/configs/cagri_merkezi_config.yaml`

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

İki veri seti arasında geçiş yapmak için webhook URL'sindeki `veriSeti` parametresini değiştirmeniz yeterlidir. İş akışı, bu parametreye göre doğru dosya yollarını ve konfigürasyonu otomatik olarak belirleyecektir.

## İş Akışını Özelleştirme

### Farklı Veri Setleri İçin Yapılandırma

1. Yeni bir veri seti eklemek için:
   - Veri dosyalarını uygun bir klasöre yerleştirin (örn. `/veri_kaynaklari/yeni_veri_seti/`).
   - Docker Compose dosyasında yeni volume bağlantısı ekleyin:
     ```yaml
     volumes:
       - ./yeni_veri_seti:/veri_kaynaklari/yeni_veri_seti
     ```
   - Ayar düğümünde yeni veri seti için koşullu mantık ekleyin:
     ```javascript
     if (veriSeti === 'yeni_veri_seti') {
       return {
         json: {
           employeesPath: "/veri_kaynaklari/yeni_veri_seti/employees.csv",
           shiftsPath: "/veri_kaynaklari/yeni_veri_seti/shifts.csv",
           // Diğer dosya yolları...
           configPath: "/configs/yeni_veri_seti_config.yaml"
         }
       };
     }
     ```

2. Yeni bir konfigürasyon dosyası eklemek için:
   - YAML formatında yeni bir konfigürasyon dosyası oluşturun (örn. `/configs/yeni_config.yaml`).
   - Ayar düğümünde yeni konfigürasyon için koşullu mantık ekleyin.

## Güvenlik Notları

- Webhook'lar varsayılan olarak kimlik doğrulaması gerektirmez. Üretim ortamında, webhook güvenliğini artırmak için n8n'in kimlik doğrulama özelliklerini kullanmayı düşünün.
- Hassas verileri konfigürasyon dosyalarında saklamaktan kaçının. Gerekirse n8n'in Credentials özelliğini kullanın.

## Performans İpuçları

- Büyük CSV dosyaları için, n8n'in bellek kullanımını artırmayı düşünün.
- Uzun süren optimizasyon işlemleri için, asenkron API çağrıları kullanmayı düşünün.

## Sonuç

Bu iş akışı, farklı veri setleri ve konfigürasyonlar için dinamik olarak çalışacak şekilde tasarlanmıştır. Webhook parametreleri aracılığıyla, hangi veri seti ve kural setinin kullanılacağını belirleyebilir ve böylece farklı kurumsal senaryolar için aynı iş akışını yeniden kullanabilirsiniz.

### Hastane ve Çağrı Merkezi Senaryoları İçin Hızlı Başlangıç

1. **Hastane Senaryosu İçin**:
   - API'yi başlatın: `uvicorn optimization_core.main:app --reload --port 8000`
   - Webhook URL'sini çağırın: `http://localhost:5678/webhook/[webhook-id]?veriSeti=hastane&kurallar=temel_kurallar`
   - Sonuçları `optimization_result.json` dosyasında görüntüleyin

2. **Çağrı Merkezi Senaryosu İçin**:
   - API'yi başlatın: `uvicorn optimization_core.main:app --reload --port 8000`
   - Webhook URL'sini çağırın: `http://localhost:5678/webhook/[webhook-id]?veriSeti=cagri_merkezi&kurallar=temel_kurallar`
   - Sonuçları `optimization_result.json` dosyasında görüntüleyin

Bu dinamik yapı sayesinde, farklı kurumlar için aynı optimizasyon altyapısını kullanabilir, sadece veri setlerini ve konfigürasyon dosyalarını değiştirerek farklı senaryolara uyarlayabilirsiniz.
