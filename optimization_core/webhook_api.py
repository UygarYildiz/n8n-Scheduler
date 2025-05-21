"""
Webhook API modülü.

Bu modül, n8n'den gelen webhook isteklerini işleyen endpoint'leri içerir.
"""

import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Request

try:
    from optimization_core.activity_logger import log_optimization_activity
    from optimization_core.utils import format_error_response
except ImportError:
    # Doğrudan çalıştırıldığında (development) farklı import yolu
    from activity_logger import log_optimization_activity
    from utils import format_error_response

# Logging
logger = logging.getLogger(__name__)

# Router oluştur
router = APIRouter()

@router.post("/webhook/optimization")
async def webhook_handler(request: Request):
    """
    n8n'den gelen webhook isteklerini işler.
    
    URL parametreleri:
    - veriSeti: Hangi veri setinin kullanılacağı (hastane, cagri_merkezi)
    - kurallar: Hangi konfigürasyon dosyasının kullanılacağı
    
    Args:
        request (Request): FastAPI istek nesnesi
        
    Returns:
        Dict[str, Any]: İşlem durumu ve mesaj
    """
    try:
        # URL parametrelerini al
        params = dict(request.query_params)
        logger.info(f"Webhook isteği alındı. Parametreler: {params}")

        # Body'yi al
        body = await request.json()
        logger.info(f"Webhook body: {body}")

        # Veri seti tipini belirle
        veri_seti = params.get("veriSeti", "")
        dataset_type = "Hastane" if veri_seti.lower() == "hastane" else "Çağrı Merkezi"

        # Aktivite log dosyasına kayıt ekle
        log_optimization_activity(dataset_type, "WEBHOOK_RECEIVED")

        # İşlem başarılı mesajı döndür
        return {
            "status": "success", 
            "message": f"{dataset_type} veri seti için webhook isteği alındı",
            "parameters": params,
            "body_summary": {k: type(v).__name__ for k, v in body.items()} if body else {}
        }
    except Exception as e:
        logger.error(f"Webhook işlenirken hata: {e}", exc_info=True)
        error_response = format_error_response(e)
        return {"status": "error", "message": str(e), "details": error_response}
