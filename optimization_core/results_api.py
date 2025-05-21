"""
Optimizasyon sonuçları API modülü.

Bu modül, optimizasyon sonuçlarını döndüren endpoint'leri içerir.
"""

import os
import json
import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException

try:
    from optimization_core.utils import get_project_root, load_json_file, format_error_response
except ImportError:
    # Doğrudan çalıştırıldığında (development) farklı import yolu
    from utils import get_project_root, load_json_file, format_error_response

# Logging
logger = logging.getLogger(__name__)

# Router oluştur
router = APIRouter()

@router.get("/api/results")
async def get_results():
    """
    Optimizasyon sonuçlarını döndürür.
    
    Returns:
        Dict[str, Any]: Optimizasyon sonuçları
    """
    try:
        # Optimizasyon sonuçlarını yükle
        result_path = os.path.join(get_project_root(), "optimization_result.json")
        logger.info(f"Optimizasyon sonuçları okunuyor: {result_path}")

        if not os.path.exists(result_path):
            logger.error(f"Optimizasyon sonuç dosyası bulunamadı: {result_path}")
            raise HTTPException(
                status_code=404, 
                detail="Optimizasyon sonuçları bulunamadı. Lütfen önce bir optimizasyon çalıştırın."
            )

        # JSON dosyasını oku
        optimization_result = load_json_file(result_path)
        if not optimization_result:
            raise HTTPException(
                status_code=500, 
                detail="Optimizasyon sonuçları okunamadı veya boş."
            )

        # Çalışan isimlerini ekle
        if optimization_result.get("solution") and optimization_result["solution"].get("assignments"):
            # Veri setini belirle
            dataset_type = "cagri_merkezi" if optimization_result["solution"]["assignments"][0]["employee_id"].startswith("CM_") else "hastane"

            try:
                # Çalışan verilerini oku
                employees_path = os.path.join(
                    get_project_root(),
                    "synthetic_data_cagri_merkezi/employees_cm.csv" if dataset_type == "cagri_merkezi" else "synthetic_data/employees.csv"
                )

                if os.path.exists(employees_path):
                    import pandas as pd
                    employees_df = pd.read_csv(employees_path)
                    employees_dict = {row["employee_id"]: row["name"] for _, row in employees_df.iterrows()}

                    # Atamalara çalışan isimlerini ekle
                    for assignment in optimization_result["solution"]["assignments"]:
                        employee_id = assignment["employee_id"]
                        if employee_id in employees_dict:
                            assignment["employee_name"] = employees_dict[employee_id]
                        else:
                            # Eğer çalışan bulunamazsa, ID'den bir isim oluştur
                            assignment["employee_name"] = f"Çalışan {employee_id.replace('CM_E', '').replace('E', '')}"
                else:
                    logger.warning(f"Çalışan verileri dosyası bulunamadı: {employees_path}")
            except Exception as e:
                logger.error(f"Çalışan isimleri eklenirken hata: {e}")

        return optimization_result
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"Optimizasyon sonuçlarını okurken hata: {e}")
        error_response = format_error_response(e)
        raise HTTPException(status_code=500, detail=error_response)
