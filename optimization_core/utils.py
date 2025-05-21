"""
Ortak yardımcı fonksiyonlar modülü.

Bu modül, diğer modüller tarafından kullanılan ortak fonksiyonları içerir.
"""

import os
import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime

# Logging
logger = logging.getLogger(__name__)

def get_project_root() -> str:
    """
    Proje kök dizinini döndürür.

    Returns:
        str: Proje kök dizininin tam yolu
    """
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load_json_file(file_path: str, default_value: Any = None) -> Any:
    """
    JSON dosyasını yükler.

    Args:
        file_path (str): JSON dosyasının yolu
        default_value (Any, optional): Dosya bulunamazsa veya okunamazsa döndürülecek değer

    Returns:
        Any: JSON dosyasının içeriği veya default_value
    """
    try:
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return default_value
    except Exception as e:
        logger.error(f"JSON dosyası yüklenirken hata: {e}")
        return default_value

def save_json_file(file_path: str, data: Any, ensure_ascii: bool = False, indent: int = 2) -> bool:
    """
    Veriyi JSON dosyasına kaydeder.

    Args:
        file_path (str): JSON dosyasının yolu
        data (Any): Kaydedilecek veri
        ensure_ascii (bool, optional): ASCII olmayan karakterleri escape etme
        indent (int, optional): JSON dosyasının girintisi

    Returns:
        bool: İşlem başarılı ise True, değilse False
    """
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=ensure_ascii, indent=indent)
        return True
    except Exception as e:
        logger.error(f"JSON dosyası kaydedilirken hata: {e}")
        return False

def get_dataset_path(dataset_id: str) -> str:
    """
    Veri seti yolunu döndürür.

    Args:
        dataset_id (str): Veri seti ID'si (örn. "hastane", "cagri_merkezi")

    Returns:
        str: Veri seti klasörünün tam yolu
    """
    dataset_map = {
        "hastane": "synthetic_data",
        "cagri_merkezi": "synthetic_data_cagri_merkezi"
    }

    dataset_folder = dataset_map.get(dataset_id, "synthetic_data")
    return os.path.join(get_project_root(), dataset_folder)

def get_config_path(config_id: Optional[str] = None) -> str:
    """
    Konfigürasyon dosyasının yolunu döndürür.

    Args:
        config_id (str, optional): Konfigürasyon dosyasının ID'si

    Returns:
        str: Konfigürasyon dosyasının tam yolu veya configs klasörünün yolu
    """
    configs_dir = os.path.join(get_project_root(), "configs")

    if config_id:
        return os.path.join(configs_dir, config_id)

    return configs_dir

def format_error_response(error: Exception, status_code: int = 500) -> Dict[str, Any]:
    """
    Hata yanıtını formatlar.

    Args:
        error (Exception): Hata nesnesi
        status_code (int, optional): HTTP durum kodu

    Returns:
        Dict[str, Any]: Formatlanmış hata yanıtı
    """
    return {
        "status": "error",
        "status_code": status_code,
        "message": str(error),
        "error_type": error.__class__.__name__,
        "timestamp": datetime.now().isoformat()
    }

def handle_api_error(func):
    """
    API endpoint'leri için hata yönetimi decorator'ı.

    Args:
        func: Decore edilecek fonksiyon

    Returns:
        Wrapper fonksiyon
    """
    from functools import wraps
    from fastapi import HTTPException

    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except HTTPException:
            # FastAPI HTTPException'larını tekrar yükselt
            raise
        except Exception as e:
            # Diğer hataları logla ve formatla
            logger.error(f"{func.__name__} fonksiyonunda hata: {e}", exc_info=True)
            error_response = format_error_response(e, 500)
            raise HTTPException(status_code=500, detail=error_response)

    return wrapper
