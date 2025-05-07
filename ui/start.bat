@echo off
echo Kurumsal Optimizasyon ve Otomasyon Çözümü - UI Başlatma
echo ======================================================
echo.

echo Bağımlılıklar yükleniyor...
call npm install

echo.
echo Geliştirme sunucusu başlatılıyor...
call npm run dev

pause
