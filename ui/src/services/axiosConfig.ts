import axios from 'axios';

// İstek zaman aşımı
axios.defaults.timeout = 10000;

// İstek başarısız olduğunda yeniden deneme
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Orijinal istek yapılandırması
    const originalRequest = error.config;

    // Eğer istek zaten yeniden denendiyse veya 404 hatası ise, hatayı fırlat
    if (originalRequest._retry || error.response?.status === 404) {
      return Promise.reject(error);
    }

    // İstek zaman aşımı veya ağ hatası durumunda yeniden dene
    if (error.code === 'ECONNABORTED' || !error.response) {
      originalRequest._retry = true;
      return axios(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default axios;
