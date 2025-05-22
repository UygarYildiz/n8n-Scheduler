import os
import json
import logging
import yaml
import shutil
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, BackgroundTasks
from datetime import datetime
import glob

try:
    from optimization_core.dashboard_models import (
        Dataset,
        Configuration,
        ConfigurationContent
    )
    from optimization_core.activity_logger import log_dataset_update, log_configuration_update
except ImportError:
    # Doğrudan çalıştırıldığında (development) farklı import yolu
    from dashboard_models import (
        Dataset,
        Configuration,
        ConfigurationContent
    )
    from activity_logger import log_dataset_update, log_configuration_update

# Logging
logger = logging.getLogger(__name__)

# Router oluştur
router = APIRouter()

# Yardımcı fonksiyonlar
def get_project_root():
    """Proje kök dizinini döndürür."""
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def get_datasets() -> List[Dataset]:
    """Mevcut veri setlerini listeler."""
    try:
        datasets = [
            Dataset(id="hastane", name="Hastane Veri Seti", path="/veri_kaynaklari/hastane"),
            Dataset(id="cagri_merkezi", name="Çağrı Merkezi Veri Seti", path="/veri_kaynaklari/cagri_merkezi")
        ]
        return datasets
    except Exception as e:
        logger.error(f"Veri setleri listelenirken hata: {e}")
        return []

def get_configurations() -> List[Configuration]:
    """Mevcut konfigürasyon dosyalarını listeler."""
    try:
        configs_dir = os.path.join(get_project_root(), "configs")
        config_files = glob.glob(os.path.join(configs_dir, "*.yaml"))

        configurations = []
        for config_file in config_files:
            config_id = os.path.basename(config_file)

            # Konfigürasyon adını belirle
            if "hospital" in config_id:
                name = "Hastane Konfigürasyonu"
            elif "cagri_merkezi" in config_id:
                name = "Çağrı Merkezi Konfigürasyonu"
            else:
                name = config_id.replace(".yaml", "").replace("_", " ").title()

            configurations.append(Configuration(
                id=config_id,
                name=name,
                path=f"/configs/{config_id}"
            ))

        return configurations
    except Exception as e:
        logger.error(f"Konfigürasyon dosyaları listelenirken hata: {e}")
        return []

def get_configuration_content(config_id: str) -> str:
    """Belirtilen konfigürasyon dosyasının içeriğini döndürür."""
    try:
        config_path = os.path.join(get_project_root(), "configs", config_id)
        if not os.path.exists(config_path):
            raise HTTPException(status_code=404, detail=f"Configuration file not found: {config_id}")

        with open(config_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        logger.error(f"Konfigürasyon içeriği okunurken hata: {e}")
        raise HTTPException(status_code=500, detail=f"Error reading configuration file: {str(e)}")

# API Endpoint'leri
@router.get("/api/datasets", response_model=List[Dataset])
async def get_datasets_endpoint():
    """Mevcut veri setlerini listeler."""
    return get_datasets()

@router.get("/api/configurations", response_model=List[Configuration])
async def get_configurations_endpoint():
    """Mevcut konfigürasyon dosyalarını listeler."""
    return get_configurations()

@router.get("/api/configuration-content")
async def get_configuration_content_endpoint(configId: str):
    """Belirtilen konfigürasyon dosyasının içeriğini döndürür."""
    content = get_configuration_content(configId)
    return ConfigurationContent(content=content)

@router.post("/api/upload-file")
async def upload_file_endpoint(
    file: UploadFile = File(...),
    datasetId: str = Form(...),
    fileType: str = Form(...)
):
    """CSV dosyasını belirtilen veri setine yükler."""
    try:
        # Dosya türünü kontrol et (genellikle dosya adı zaten .csv ile gelir UI'dan)
        filename = fileType if fileType.endswith(".csv") else f"{fileType}.csv"

        # Veri seti için temel yolu belirle
        # Proje dizininden relative path kullan
        base_data_path = os.path.join(get_project_root(), "veri_kaynaklari")
        
        # Veri setine özel klasör yolunu oluştur
        dataset_specific_path = os.path.join(base_data_path, datasetId)
        
        # Klasör yoksa oluştur
        os.makedirs(dataset_specific_path, exist_ok=True)
        
        # Tam dosya yolunu oluştur
        file_path = os.path.join(dataset_specific_path, filename)

        # Dosyayı kaydet
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Aktivite logla
        log_dataset_update(datasetId, filename) # fileType yerine filename kullanmak daha doğru

        return {"status": "success", "message": f"{filename} dosyası başarıyla yüklendi", "path": file_path}
    except HTTPException as http_exc: # FastAPI HTTPException'larını tekrar yükselt
        raise http_exc
    except Exception as e:
        logger.error(f"Dosya yükleme hatası: {e}")
        raise HTTPException(status_code=500, detail=f"Dosya yükleme hatası: {str(e)}")
    finally:
        if file: # Dosyanın varlığını kontrol et
            await file.close() # Dosyayı her zaman kapat

@router.post("/api/configuration-content")
async def save_configuration_content_endpoint(configId: str = Form(...), content: str = Form(...)):
    """Belirtilen konfigürasyon dosyasının içeriğini günceller."""
    try:
        # Konfigürasyon dosyasının yolunu belirle
        config_path = os.path.join(get_project_root(), "configs", configId)

        # Dosyayı kaydet
        with open(config_path, "w", encoding="utf-8") as f:
            f.write(content)

        # Aktivite logla
        log_configuration_update(configId)

        return {"status": "success", "message": f"{configId} konfigürasyonu başarıyla güncellendi"}
    except Exception as e:
        logger.error(f"Konfigürasyon güncelleme hatası: {e}")
        raise HTTPException(status_code=500, detail=f"Konfigürasyon güncelleme hatası: {str(e)}")
