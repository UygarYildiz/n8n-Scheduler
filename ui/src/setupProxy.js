const { createProxyMiddleware } = require('http-proxy-middleware');
const fs = require('fs');
const path = require('path');

module.exports = function(app) {
  // API proxy
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: true,
    })
  );

  // Eski API endpoint'lerini desteklemek için yönlendirme
  app.use(
    '/employees',
    createProxyMiddleware({
      target: 'http://localhost:8000/api',
      changeOrigin: true,
      pathRewrite: {
        '^/employees': '/employees'
      }
    })
  );

  // Kök dizindeki optimization_result.json dosyasını UI'a proxy'le
  app.use('/optimization_result.json', (req, res) => {
    try {
      // Proje kök dizinindeki dosyayı oku
      const rootPath = path.resolve(__dirname, '../../optimization_result.json');

      if (fs.existsSync(rootPath)) {
        const data = fs.readFileSync(rootPath, 'utf8');
        res.setHeader('Content-Type', 'application/json');
        res.send(data);
      } else {
        res.status(404).send('Optimizasyon sonuçları bulunamadı');
      }
    } catch (error) {
      console.error('Optimizasyon sonuçları okunurken hata:', error);
      res.status(500).send('Optimizasyon sonuçları okunurken bir hata oluştu');
    }
  });
};
