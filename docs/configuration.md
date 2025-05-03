# Konfigürasyon Yönetimi

Bu belge, projenin farklı kurumlara ve problem senaryolarına uyarlanabilirliğini sağlamak için kullanılacak konfigürasyon yönetimi yaklaşımını açıklar.

## Yaklaşım

Temel prensip, kuruma veya probleme özgü davranışları ve parametreleri kod içerisine gömmek yerine dışsal konfigürasyon kaynaklarından okumaktır. Bu, kod değişikliği yapmadan farklı senaryolara uyum sağlamayı kolaylaştırır.

Önerilen yöntem, her kurum veya ana problem tipi için ayrı **JSON** veya **YAML** formatında konfigürasyon dosyaları kullanmaktır. YAML, okunabilirliği nedeniyle tercih edilebilir.

## Konfigürasyon Dosyası Yapısı (Örnek)

Aşağıda bir hastane vardiya çizelgeleme senaryosu için örnek bir YAML konfigürasyon dosyası (`hospital_config_example.yaml`) gösterilmiştir:

```yaml
institution_id: "hospital_A"
institution_name: "Şifa Hastanesi"
problem_type: "shift_scheduling"

# Optimizasyon Çekirdeği Parametreleri
optimization_core:
  solver_time_limit_seconds: 300
  # Önceliklendirme için hedef fonksiyonu ağırlıkları
  objective_weights:
    minimize_overstaffing: 1
    minimize_understaffing: 10 # Eksik personelin cezası daha yüksek
    maximize_preferences: 2
    # ...diğer hedef bileşenleri

# Modele Eklenecek Dinamik Kısıtlar ve Kurallar
rules:
  min_staffing_requirements:
    - shift_pattern: "Gece*" # Gece ile başlayan tüm vardiyalar
      role: "Hemşire"
      min_count: 3
      penalty_if_violated: 100 # Yumuşak kısıt ise ihlal cezası
    - shift_pattern: "Gündüz*"
      role: "Doktor"
      department: "Acil"
      min_count: 2
    - shift_pattern: "Haftasonu*"
      role: "Uzman"
      specialty: "Kardiyoloji"
      min_count: 1

  max_consecutive_shifts: 5
  min_rest_time_hours: 10

  # Yetenek/Sertifika Gereksinimleri
  skill_requirements:
    - shift_pattern: "*_YoğunBakım"
      skill: "Yoğun Bakım Sertifikası"
      min_count: 1

# (İsteğe Bağlı) n8n Tarafından Kullanılabilecek Parametreler
n8n_parameters:
  notification_emails:
    - "yonetici@sifahastanesi.com"
  report_template: "hospital_monthly_report.tpl"
```

**Açıklamalar:**

*   **Temel Bilgiler:** `institution_id`, `institution_name`, `problem_type` gibi tanımlayıcı alanlar.
*   **Optimizasyon Çekirdeği Parametreleri:** `solver_time_limit_seconds`, hedef fonksiyonu ağırlıkları gibi çözücü ve model davranışını etkileyen genel ayarlar.
*   **Kurallar (`rules`):** Modele dinamik olarak eklenecek kısıtları tanımlar.
    *   `min_staffing_requirements`: Minimum personel sayıları. `shift_pattern` ile belirli vardiyalara (joker karakterler * kullanılabilir), rollere, departmanlara veya uzmanlıklara göre tanımlanabilir. `penalty_if_violated` eklenerek bazıları yumuşak kısıt (soft constraint) haline getirilebilir.
    *   Diğer kurallar (maksimum ardışık vardiya, minimum dinlenme süresi, yetenek gereksinimleri vb.) probleme göre eklenir.
*   **n8n Parametreleri:** İsteğe bağlı olarak, n8n iş akışlarının ihtiyaç duyabileceği (bildirim e-postaları, rapor şablonları vb.) parametreler de burada merkezi olarak yönetilebilir.

## Konfigürasyonun Kullanımı

1.  **n8n Akışı:**
    *   İlgili kurumun konfigürasyon dosyasını (veya içeriğini) belirler.
    *   `configuration_ref` (dosya yolu) veya `configuration` (doğrudan içerik) olarak Optimizasyon Çekirdeği'ne gönderir.
2.  **Optimizasyon Çekirdeği (Python):**
    *   Gelen referans veya içerikten konfigürasyonu yükler (örn. PyYAML kütüphanesi ile).
    *   Modeli kurarken `rules` altındaki tanımlamalara göre CP-SAT kısıtlarını (`Add`, `AddBoolOr`, `AddImplication` vb.) dinamik olarak oluşturur.
    *   `optimization_core` altındaki parametreleri çözücüye ve hedef fonksiyonuna uygular.

Bu yaklaşım, her kurum için ayrı ve okunabilir konfigürasyonlar oluşturmayı, kod tekrarını azaltmayı ve yeni kuralların veya kurumların sisteme eklenmesini kolaylaştırmayı hedefler.
``` 