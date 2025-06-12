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

// Request interceptor - Authorization header'ı otomatik ekler
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // UTF-8 desteği için header ekle
    config.headers['Accept'] = 'application/json; charset=utf-8';
    config.headers['Content-Type'] = 'application/json; charset=utf-8';
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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
      // Doğrudan database-based API'den sonuçları al
      const response = await axios.get('/api/results');
      console.log('Optimizasyon sonuçları database API\'den alındı');
      return response.data;
    } catch (error) {
      console.error('Database API\'den optimizasyon sonuçlarını alma hatası:', error);
      throw new Error('Optimizasyon sonuçları bulunamadı. Lütfen önce bir optimizasyon çalıştırın.');
    }
  },

  // Results sayfası için optimizasyon sonuçlarını alma
  getResults: async () => {
    try {
      // Doğrudan database-based API'den sonuçları al
      const response = await axios.get('/api/results');
      console.log('Results sayfası için optimizasyon sonuçları database API\'den alındı');
      return response.data;
    } catch (error) {
      console.error('Results sayfası için database API hatası:', error);
      throw new Error('Optimizasyon sonuçları bulunamadı. Lütfen önce bir optimizasyon çalıştırın.');
    }
  },



  // En son optimization sonucunu ID ile al
  getLatestOptimizationResult: async () => {
    try {
      const response = await axios.get('/api/results/latest');
      console.log('Latest optimization result database\'den alındı');
      return response.data;
    } catch (error) {
      console.error('Latest optimization result alma hatası:', error);
      throw new Error('En son optimization sonucu bulunamadı.');
    }
  },

  // Vardiya çizelgesi verilerini alma
  getScheduleData: async () => {
    try {
      // Optimizasyon sonuçlarını al
      const optimizationResult = await api.getOptimizationResults();

      // Veri setini belirle (Hastane veya Çağrı Merkezi)
      const datasetType = optimizationResult.solution?.assignments[0]?.employee_id?.startsWith('CM_')
        ? 'cagri_merkezi'
        : 'hastane';

      // Vardiya ve çalışan verilerini al
      const shiftsResponse = await axios.get(`/api/shifts?datasetType=${datasetType}`);
      const employeesResponse = await axios.get(`/api/employees?datasetType=${datasetType}`);

      // Tüm verileri birleştir
      return {
        assignments: optimizationResult.solution?.assignments || [],
        shifts: shiftsResponse.data || [],
        employees: employeesResponse.data || [],
        datasetType
      };
    } catch (error) {
      console.error('Vardiya çizelgesi verilerini alma hatası:', error);

      // API henüz hazır değilse, optimizasyon sonuçlarını doğrudan kullan
      try {
        const optimizationResult = await api.getOptimizationResults();
        return {
          assignments: optimizationResult.solution?.assignments || [],
          // Diğer veriler henüz mevcut değil, boş diziler döndür
          shifts: [],
          employees: [],
          datasetType: optimizationResult.solution?.assignments[0]?.employee_id?.startsWith('CM_')
            ? 'cagri_merkezi'
            : 'hastane'
        };
      } catch (fallbackError) {
        console.error('Yedek veri alma hatası:', fallbackError);
        throw error; // Orijinal hatayı fırlat
      }
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
  },

  // Konfigürasyon dosyasını kaydetme
  saveConfigurationContent: async (configId: string, content: string) => {
    try {
      const formData = new FormData();
      formData.append('configId', configId);
      formData.append('content', content);

      const response = await axios.post('/api/configuration-content', formData);
      return response.data;
    } catch (error) {
      console.error('Konfigürasyon içeriğini kaydetme hatası:', error);
      throw error;
    }
  },

  // Dosya yükleme
  uploadFile: async (datasetId: string, fileType: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('datasetId', datasetId);
      formData.append('fileType', fileType);

      const response = await axios.post('/api/upload-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Dosya yükleme hatası:', error);
      throw error;
    }
  }
};

export default api;
