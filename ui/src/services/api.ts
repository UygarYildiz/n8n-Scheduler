import axios from 'axios';

// API temel URL'si (Python FastAPI backend için)
const API_URL = 'http://localhost:8000'; // Bu Vite proxy'de /api için kullanılacak

// Axios instance oluşturma (Python API için)
const apiClient = axios.create({
  baseURL: API_URL, // Bu artık kullanılmayacak, çünkü /api proxy'si ile adres belirtilecek
  headers: {
    'Content-Type': 'application/json',
  },
});

// API fonksiyonları
export const api = {
  // Dashboard verilerini alma
  getDashboardData: async () => {
    try {
      // Backend'den dashboard verilerini çek
      const response = await axios.get('/api/dashboard');
      return response.data;
    } catch (error) {
      console.error('Dashboard verilerini alma hatası:', error);
      throw error;
    }
  },

  // Optimizasyon çalıştırma (Doğrudan Python API'sine, bu muhtemelen artık kullanılmayacak)
  runOptimization: async (data: any) => {
    try {
      // Doğrudan Python API'sine /optimize endpoint'ine istek
      // Vite proxy ayarı '/api' -> 'http://localhost:8000' olduğu için
      // istek '/api/optimize' olarak yapılmalı.
      const response = await axios.post('/api/optimize', data);
      return response.data;
    } catch (error) {
      console.error('Optimizasyon çalıştırma hatası:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Hata Detayları:', error.response.data);
        throw new Error(error.response.data?.message || 'Optimizasyon API\'sine bağlanırken bir hata oluştu.');
      }
      throw error;
    }
  },

  // n8n webhook'unu tetikleme (Bu genel bir tetikleyici, startOptimization daha spesifik)
  triggerWebhook: async (webhookPath: string, queryParamsData: any, bodyData?: any) => {
    try {
      // Vite proxy'si /webhook ile başlayan istekleri n8n'e (http://localhost:5678) yönlendirecek.
      // webhookPath örn: '/optimization' veya '/analiz-baslat'
      const queryParams = new URLSearchParams(queryParamsData).toString();
      const fullWebhookUrl = `/webhook${webhookPath}?${queryParams}`;

      console.log('N8N Webhook URL:', fullWebhookUrl);
      if (bodyData) {
        console.log('N8N Webhook Gövdesi:', bodyData);
        const response = await axios.post(fullWebhookUrl, bodyData);
        return response.data;
      } else {
        const response = await axios.get(fullWebhookUrl);
      return response.data;
      }
    } catch (error) {
      console.error('Webhook tetikleme hatası:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Hata Detayları:', error.response.data);
        throw new Error(error.response.data?.message || 'N8N Webhook\'una bağlanırken bir hata oluştu.');
      }
      throw error;
    }
  },

  // Optimizasyon işlemini başlatan fonksiyon (n8n webhook üzerinden)
  startOptimization: async (
    datasetId: string,    // Örn: 'hastane'
    configId: string,     // Örn: 'hospital_test_config.yaml'
    optimizationGoal: string,   // Örn: 'balanced'
    weights: {                  // Hedef ağırlıkları
      minimize_understaffing: number;
      minimize_overstaffing: number;
      maximize_preferences: number;
      balance_workload: number;
      maximize_shift_coverage: number;
    },
    solverParams: {             // Çözücü parametreleri
      time_limit: number;
      use_mip: boolean;
    }
  ) => {
    // Webhook query parametreleri (URL'e eklenecek)
    const queryParamsForN8N = {
        veriSeti: datasetId,
      kurallar: configId, // Bu, n8n'in hangi temel konfigürasyonu (YAML) kullanacağını belirler
    };

    // Webhook request body (POST isteğinin gövdesine eklenecek)
    // Bu bilgiler n8n iş akışının Python API'sine göndereceği 'configuration' nesnesini
    // dinamik olarak güncellemek/oluşturmak için kullanılır.
    const requestBodyForN8N = {
      optimization_goal: optimizationGoal, // Bu bilgi n8n tarafından loglanabilir veya işlenebilir
        objective_weights: weights,
      // Python API'si 'time_limit_seconds' ve 'use_mip_solver' bekliyorsa bu şekilde gönderilmeli
        solver_params: {
          time_limit_seconds: solverParams.time_limit,
          use_mip_solver: solverParams.use_mip
        }
      };

    try {
      // triggerWebhook fonksiyonunu kullanarak n8n'deki /optimization endpoint'ine POST yapalım
      return await api.triggerWebhook('/optimization', queryParamsForN8N, requestBodyForN8N);
    } catch (error) {
      // Hata zaten triggerWebhook içinde loglandı ve yeniden fırlatıldı.
      // İsterseniz burada ek bir işlem yapabilirsiniz.
      throw error;
    }
  },

  // Optimizasyon sonuçlarını alma
  getOptimizationResults: async () => {
    try {
      // Bu örnek için, sonuçları doğrudan API'den almak yerine
      // public klasöründeki optimization_result.json dosyasını okuyoruz
      // Geliştirme için public klasörüne örnek bir optimization_result.json koyabilirsiniz.
      // Gerçek senaryoda bu, /api/results gibi bir backend endpoint'i olmalı.
      const response = await axios.get('/optimization_result.json');
      return response.data;
    } catch (error) {
      console.error('Optimizasyon sonuçlarını alma hatası:', error);
      throw error;
    }
  },

  // Veri setlerini listeleme
  getDatasets: async () => {
    try {
      const response = await axios.get('/api/datasets');
      return response.data;
    } catch (error) {
      console.error('Veri setlerini alma hatası:', error);
      throw error;
    }
  },

  // Konfigürasyon dosyalarını listeleme
  getConfigurations: async () => {
    try {
      const response = await axios.get('/api/configurations');
      return response.data;
    } catch (error) {
      console.error('Konfigürasyon dosyalarını alma hatası:', error);
      throw error;
    }
  },

  // Konfigürasyon dosyasını okuma
  getConfigurationContent: async (configId: string) => {
    try {
      const response = await axios.get(`/api/configuration-content?configId=${configId}`);
      return response.data.content;
    } catch (error) {
      console.error('Konfigürasyon içeriğini alma hatası:', error);
      throw error;
    }
  }
};

export default api;
