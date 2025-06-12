"""
Optimizasyon sonuçları API modülü.

Bu modül, optimizasyon sonuçlarını database'den döndüren endpoint'leri içerir.
"""

import os
import json
import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

try:
    from optimization_core.utils import get_project_root, load_json_file, format_error_response
    from optimization_core.database import OptimizationResult, get_db
except ImportError:
    # Doğrudan çalıştırıldığında (development) farklı import yolu
    from utils import get_project_root, load_json_file, format_error_response
    from database import OptimizationResult, get_db

# Logging
logger = logging.getLogger(__name__)

# Router oluştur
router = APIRouter()

@router.get("/api/results")
async def get_results(db: Session = Depends(get_db)):
    """
    En son optimizasyon sonucunu database'den döndürür.
    
    Returns:
        Dict[str, Any]: En son optimizasyon sonuçları
    """
    try:
        # Database'den en son optimization sonucunu al
        latest_result = db.query(OptimizationResult).order_by(
            OptimizationResult.created_at.desc()
        ).first()

        if not latest_result:
            logger.warning("Database'de optimizasyon sonucu bulunamadı, JSON fallback deneniyor")
            
            # Fallback: JSON dosyasından oku (backward compatibility)
            result_path = os.path.join(get_project_root(), "optimization_result.json")
            if os.path.exists(result_path):
                logger.info(f"JSON fallback: {result_path}")
                optimization_result = load_json_file(result_path)
                if optimization_result:
                    return optimization_result
            
            raise HTTPException(
                status_code=404, 
                detail="Optimizasyon sonuçları bulunamadı. Lütfen önce bir optimizasyon çalıştırın."
            )

        # Database sonucunu response formatına dönüştür
        response_data = {
            "status": latest_result.status,
            "solver_status_message": latest_result.solver_status_message,
            "processing_time_seconds": float(latest_result.processing_time_seconds) if latest_result.processing_time_seconds else None,
            "objective_value": float(latest_result.objective_value) if latest_result.objective_value else None,
            "solution": latest_result.solution_data,
            "metrics": latest_result.metrics,
            "error_details": None
        }

        # Çalışan isimlerini ekle (mevcut logic korunuyor)
        if response_data.get("solution") and response_data["solution"].get("assignments"):
            try:
                assignments = response_data["solution"]["assignments"]
                if assignments:
                    # Veri setini belirle
                    dataset_type = "cagri_merkezi" if assignments[0]["employee_id"].startswith("CM_") else "hastane"

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
                        for assignment in assignments:
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

        logger.info(f"Database'den optimization sonucu döndürüldü (ID: {latest_result.id}, Status: {latest_result.status})")
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Database'den optimizasyon sonuçlarını okurken hata: {e}")
        error_response = format_error_response(e)
        raise HTTPException(status_code=500, detail=error_response)

@router.get("/api/results/latest")
async def get_latest_result(db: Session = Depends(get_db)):
    """
    En son optimizasyon sonucunu ID ile birlikte döndürür.
    """
    try:
        latest_result = db.query(OptimizationResult).order_by(
            OptimizationResult.created_at.desc()
        ).first()

        if not latest_result:
            raise HTTPException(
                status_code=404, 
                detail="Database'de optimizasyon sonucu bulunamadı."
            )

        return {
            "id": latest_result.id,
            "user_id": latest_result.user_id,
            "organization_id": latest_result.organization_id,
            "status": latest_result.status,
            "solver_status_message": latest_result.solver_status_message,
            "processing_time_seconds": float(latest_result.processing_time_seconds) if latest_result.processing_time_seconds else None,
            "objective_value": float(latest_result.objective_value) if latest_result.objective_value else None,
            "solution": latest_result.solution_data,
            "metrics": latest_result.metrics,
            "input_parameters": latest_result.input_parameters,
            "created_at": latest_result.created_at.isoformat(),
            "updated_at": latest_result.updated_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"En son optimization sonucunu alırken hata: {e}")
        raise HTTPException(status_code=500, detail="Database result could not be retrieved")
