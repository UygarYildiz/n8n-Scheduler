# Kurulum Rehberi (Başlangıç)

Bu belge, projenin geliştirme ortamını kurmak için gereken temel adımları özetlemektedir.

## Ön Gereksinimler

*   **Python:** Sürüm 3.8 veya üstü önerilir.
*   **pip:** Python paket yöneticisi.
*   **Git:** Versiyon kontrol sistemi.
*   **Docker (Önerilen):** n8n'i çalıştırmak için en kolay yöntemlerden biridir. Alternatif olarak Node.js ile de kurulum yapılabilir.

## Adımlar

1.  **Projeyi Klonlama (Eğer Git deposu varsa):
    ```bash
    git clone <proje_repo_url>
    cd <proje_klasoru>
    ```

2.  **Python Ortamı ve Bağımlılıklar:**
    *   Bir sanal ortam (virtual environment) oluşturmak ve aktive etmek şiddetle tavsiye edilir:
      ```bash
      python -m venv venv
      # Windows
      .\venv\Scripts\activate
      # MacOS/Linux
      source venv/bin/activate
      ```
    *   Gerekli Python kütüphanelerini (başlangıçta OR-Tools ve API için Flask/FastAPI) kurun:
      ```bash
      pip install ortools
      pip install Flask # veya pip install fastapi uvicorn[standard]
      pip install PyYAML # Konfigürasyon dosyaları için
      # İleride eklenecek diğer bağımlılıklar...
      ```
    *   (İyi Pratik) Bağımlılıkları bir `requirements.txt` dosyasına kaydedin:
      ```bash
      pip freeze > requirements.txt
      ```
      Daha sonra kurulum için: `pip install -r requirements.txt`

3.  **n8n Kurulumu:**
    *   **Docker ile (Önerilen):**
      ```bash
      docker run -it --rm --name n8n -p 5678:5678 -v ~/.n8n:/home/node/.n8n n8nio/n8n
      ```
      n8n arayüzüne tarayıcıdan `http://localhost:5678` adresinden erişebilirsiniz.
    *   **npm ile (Alternatif):** Node.js (LTS sürümü önerilir) ve npm kurulu olmalıdır.
      ```bash
      npm install n8n -g
      n8n
      ```

4.  **Konfigürasyon Dosyaları:**
    *   `docs/configuration.md` belgesinde açıklandığı gibi, test veya geliştirme için örnek konfigürasyon dosyalarını (örn. `configs/hospital_test_config.yaml`) oluşturun.

5.  **Yapay Veri Üretici:**
    *   2. Hafta hedeflerinde belirtildiği gibi, yapay veri üretecek Python betiğini veya n8n akışını hazırlayın.

Bu adımlar, projenin geliştirilmesine başlamak için gerekli temel ortamı sağlar. Proje ilerledikçe ek kurulum veya konfigürasyon adımları gerekebilir. 