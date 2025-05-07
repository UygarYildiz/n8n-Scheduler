import axios from 'axios';

// API temel URL'si
const API_URL = 'http://localhost:8000';
const N8N_URL = 'http://localhost:5678';

// Axios instance oluşturma
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API fonksiyonları
export const api = {
  // Optimizasyon çalıştırma
  runOptimization: async (data: any) => {
    try {
      const response = await apiClient.post('/optimize', data);
      return response.data;
    } catch (error) {
      console.error('Optimizasyon çalıştırma hatası:', error);
      throw error;
    }
  },
  
  // n8n webhook'unu tetikleme
  triggerWebhook: async (webhookId: string, params: any) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await axios.get(`${N8N_URL}/webhook/${webhookId}?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Webhook tetikleme hatası:', error);
      throw error;
    }
  },
  
  // Optimizasyon sonuçlarını alma
  getOptimizationResults: async () => {
    try {
      // Bu örnek için, sonuçları doğrudan API'den almak yerine
      // optimization_result.json dosyasını okuyormuş gibi simüle ediyoruz
      const response = await axios.get('/optimization_result.json');
      return response.data;
    } catch (error) {
      console.error('Optimizasyon sonuçlarını alma hatası:', error);
      throw error;
    }
  },
  
  // Veri setlerini listeleme
  getDatasets: async () => {
    // Simüle edilmiş veri
    return [
      { id: 'hastane', name: 'Hastane Veri Seti', path: '/veri_kaynaklari/hastane' },
      { id: 'cagri_merkezi', name: 'Çağrı Merkezi Veri Seti', path: '/veri_kaynaklari/cagri_merkezi' }
    ];
  },
  
  // Konfigürasyon dosyalarını listeleme
  getConfigurations: async () => {
    // Simüle edilmiş veri
    return [
      { id: 'hospital_test_config.yaml', name: 'Hastane Konfigürasyonu', path: '/configs/hospital_test_config.yaml' },
      { id: 'cagri_merkezi_config.yaml', name: 'Çağrı Merkezi Konfigürasyonu', path: '/configs/cagri_merkezi_config.yaml' }
    ];
  },
  
  // Konfigürasyon dosyasını okuma
  getConfigurationContent: async (configId: string) => {
    try {
      // Simüle edilmiş veri
      if (configId === 'hospital_test_config.yaml') {
        return `institution_id: "hospital_a"
institution_name: "Hastane A"
problem_type: "shift_scheduling"

optimization_core:
  solver_time_limit_seconds: 60
  objective_weights:
    minimize_understaffing: 100
    minimize_overstaffing: 1
    maximize_preferences: 2
    balance_workload: 3
    maximize_shift_coverage: 50

rules:
  min_staffing_requirements:
    - shift_pattern: "*Acil*"
      role: "Doktor"
      department: "Acil"
      min_count: 2
      penalty_if_violated: 500`;
      } else {
        return `institution_id: "112_cagri_merkezi_bolge_x"
institution_name: "Bölge X - 112 Acil Çağrı Merkezi"
problem_type: "shift_scheduling"

optimization_core:
  solver_time_limit_seconds: 120
  objective_weights:
    minimize_overstaffing: 1.5
    minimize_understaffing: 100
    maximize_preferences: 1
    balance_workload: 3.0
    maximize_shift_coverage: 50`;
      }
    } catch (error) {
      console.error('Konfigürasyon içeriğini alma hatası:', error);
      throw error;
    }
  }
};

export default api;
