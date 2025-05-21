import os
import json
import logging
import time
from datetime import datetime
from typing import List, Dict, Any, Optional

# Logging
logger = logging.getLogger(__name__)

# Aktivite log dosyası
ACTIVITY_LOG_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "activity_log.json")

def get_activity_log() -> List[Dict[str, Any]]:
    """Aktivite log dosyasını okur ve aktiviteleri döndürür."""
    try:
        if os.path.exists(ACTIVITY_LOG_FILE):
            with open(ACTIVITY_LOG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        return []
    except Exception as e:
        logger.error(f"Aktivite log dosyası okunurken hata: {e}")
        return []

def save_activity_log(activities: List[Dict[str, Any]]) -> bool:
    """Aktivite log dosyasını kaydeder."""
    try:
        with open(ACTIVITY_LOG_FILE, 'w', encoding='utf-8') as f:
            json.dump(activities, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        logger.error(f"Aktivite log dosyası kaydedilirken hata: {e}")
        return False

def add_activity(action: str, detail: str, color: str, icon: str) -> bool:
    """Yeni bir aktivite ekler."""
    try:
        # Mevcut aktiviteleri oku
        activities = get_activity_log()

        # Yeni aktivite oluştur
        now = datetime.now()
        new_activity = {
            "id": f"act{len(activities) + 1}",
            "date": now.strftime("%d.%m.%Y %H:%M"),
            "action": action,
            "detail": detail,
            "color": color,
            "icon": icon,
            "timestamp": int(time.time())
        }

        # Aktiviteyi listeye ekle
        activities.insert(0, new_activity)

        # Maksimum 20 aktivite tut
        if len(activities) > 20:
            activities = activities[:20]

        # Aktiviteleri kaydet
        return save_activity_log(activities)
    except Exception as e:
        logger.error(f"Aktivite eklenirken hata: {e}")
        return False

def log_optimization_activity(dataset_type: str, status: str) -> bool:
    """Optimizasyon aktivitesi ekler."""
    # Durum detayını belirle
    if status == "WEBHOOK_RECEIVED":
        action = "Çizelgeleme başlatıldı"
        detail = "Çizelgeleme işlemi başlatıldı"
        color = "info.main"
        icon = "PlayArrowIcon"
    elif status == "OPTIMAL":
        action = "Çizelgeleme tamamlandı"
        detail = "Başarılı optimizasyon"
        color = "primary.main"
        icon = "BoltIcon"
    elif status == "FEASIBLE":
        action = "Çizelgeleme tamamlandı"
        detail = "Uygun çözüm bulundu"
        color = "primary.main"
        icon = "BoltIcon"
    elif status == "INFEASIBLE":
        action = "Çizelgeleme tamamlanamadı"
        detail = "Uygun çözüm bulunamadı"
        color = "error.main"
        icon = "ErrorIcon"
    else:
        action = "Çizelgeleme tamamlandı"
        detail = "Optimizasyon tamamlandı"
        color = "primary.main"
        icon = "BoltIcon"

    # Aktiviteyi ekle
    logger.info(f"Aktivite ekleniyor: {action} - {detail}")
    return add_activity(action, detail, color, icon)

def log_configuration_update(config_name: str) -> bool:
    """Konfigürasyon güncelleme aktivitesi ekler."""
    action = "Konfigürasyon güncellendi"
    detail = f"{config_name} konfigürasyon dosyası güncellendi"
    return add_activity(action, detail, "warning.main", "SettingsIcon")

def log_dataset_added(dataset_name: str) -> bool:
    """Veri seti ekleme aktivitesi ekler."""
    action = "Veri seti eklendi"
    detail = f"{dataset_name} veri seti sisteme yüklendi"
    return add_activity(action, detail, "success.main", "DatasetIcon")

def log_dataset_update(dataset_id: str, file_type: str) -> bool:
    """Veri seti güncelleme aktivitesi ekler."""
    action = "Veri dosyası güncellendi"
    detail = f"{dataset_id} veri setindeki {file_type} dosyası güncellendi"
    return add_activity(action, detail, "info.main", "CloudUploadIcon")

def log_configuration_update(config_name: str) -> bool:
    """Konfigürasyon güncelleme aktivitesi ekler."""
    action = "Konfigürasyon güncellendi"
    detail = f"{config_name} konfigürasyonu güncellendi"
    return add_activity(action, detail, "info.main", "SettingsIcon")

def get_recent_activities(limit: int = 10) -> List[Dict[str, Any]]:
    """Son aktiviteleri döndürür."""
    activities = get_activity_log()
    return activities[:limit]
