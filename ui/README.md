# Kurumsal Optimizasyon ve Otomasyon Çözümü - Kullanıcı Arayüzü

Bu proje, Kurumsal Optimizasyon ve Otomasyon Çözümü'nün web tabanlı kullanıcı arayüzünü içerir. React, TypeScript ve Material UI kullanılarak geliştirilmiştir.

## Özellikler

- Veri seti ve konfigürasyon seçimi
- Optimizasyon parametrelerini ayarlama
- Sonuçları görselleştirme ve raporlama
- Vardiya çizelgesi görüntüleme ve düzenleme
- n8n webhook entegrasyonu

## Başlangıç

### Gereksinimler

- Node.js (v14 veya üzeri)
- npm (v6 veya üzeri)

### Kurulum

1. Bağımlılıkları yükleyin:

```bash
npm install
```

2. Geliştirme sunucusunu başlatın:

```bash
npm run dev
```

3. Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

## Proje Yapısı

```
ui/
├── public/             # Statik dosyalar
├── src/                # Kaynak kodları
│   ├── assets/         # Resimler, fontlar vb.
│   ├── components/     # Yeniden kullanılabilir bileşenler
│   ├── hooks/          # Özel React hooks
│   ├── layouts/        # Sayfa düzenleri
│   ├── pages/          # Sayfa bileşenleri
│   ├── services/       # API servisleri
│   ├── types/          # TypeScript tipleri
│   ├── utils/          # Yardımcı fonksiyonlar
│   ├── App.tsx         # Ana uygulama bileşeni
│   ├── main.tsx        # Uygulama giriş noktası
│   └── index.css       # Global CSS
├── index.html          # HTML şablonu
├── package.json        # Proje bağımlılıkları
├── tsconfig.json       # TypeScript yapılandırması
└── vite.config.ts      # Vite yapılandırması
```

## Kullanılan Teknolojiler

- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Material UI](https://mui.com/)
- [React Router](https://reactrouter.com/)
- [Axios](https://axios-http.com/)
- [Chart.js](https://www.chartjs.org/)

## API Entegrasyonu

Kullanıcı arayüzü, aşağıdaki API'ler ile entegre çalışır:

- **Optimizasyon API (FastAPI)**: `http://localhost:8000`
- **n8n Webhook**: `http://localhost:5678/webhook/[webhook-id]`

## Ekran Görüntüleri

(Ekran görüntüleri burada listelenecek)

## Geliştirme

### Yeni Sayfa Ekleme

1. `src/pages` klasöründe yeni bir sayfa bileşeni oluşturun.
2. `src/App.tsx` dosyasında yeni bir rota ekleyin.
3. Gerekirse `src/layouts/MainLayout.tsx` dosyasında yan menüye yeni bir öğe ekleyin.

### API Entegrasyonu

Yeni API çağrıları eklemek için `src/services/api.ts` dosyasını düzenleyin.

## Dağıtım

Üretim sürümünü oluşturmak için:

```bash
npm run build
```

Oluşturulan dosyalar `dist` klasöründe bulunacaktır.

## Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.
