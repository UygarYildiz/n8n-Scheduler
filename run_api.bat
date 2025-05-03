@echo off
echo Optimizasyon API'si başlatılıyor...
cd %~dp0
uvicorn optimization_core.main:app --reload --port 8000
