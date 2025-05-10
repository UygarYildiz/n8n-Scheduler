import os
import json
import logging
import yaml
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from datetime import datetime
import glob

from .dashboard_models import (
    DashboardData,
    PerformanceMetrics,
    LastOptimizationReport,
    SystemStatus,
    RecentActivity,
    Dataset,
    Configuration,
    ConfigurationContent
)

from .activity_logger import get_recent_activities

# Logging
logger = logging.getLogger(__name__)

# Router oluştur
router = APIRouter()

# Yardımcı fonksiyonlar
def get_project_root():
    """Proje kök dizinini döndürür."""
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def load_optimization_result():
    """Son optimizasyon sonucunu yükler."""
    try:
        result_path = os.path.join(get_project_root(), "optimization_result.json")
        if os.path.exists(result_path):
            with open(result_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return None
    except Exception as e:
        logger.error(f"Optimizasyon sonucu yüklenirken hata: {e}")
        return None

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
@router.get("/dashboard", response_model=DashboardData)
async def get_dashboard_data():
    """Dashboard verilerini döndürür."""
    try:
        # Son optimizasyon sonucunu yükle
        optimization_result = load_optimization_result()

        # Performans metriklerini hazırla
        metrics = PerformanceMetrics()
        if optimization_result and optimization_result.get("metrics"):
            result_metrics = optimization_result["metrics"]

            # Understaffing ve overstaffing
            metrics.understaffing = result_metrics.get("total_understaffing", 0)
            metrics.overstaffing = result_metrics.get("total_overstaffing", 0)

            # Kapsama oranları
            if result_metrics.get("min_staffing_coverage_ratio") is not None:
                metrics.coverageRatio = int(result_metrics["min_staffing_coverage_ratio"] * 100)

            if result_metrics.get("skill_coverage_ratio") is not None:
                metrics.skillCoverage = int(result_metrics["skill_coverage_ratio"] * 100)

            # Tercih skoru
            if result_metrics.get("total_preference_score_achieved") is not None:
                # Normalize et (0-100 arası)
                metrics.preferenceScore = min(100, max(0, int(result_metrics["total_preference_score_achieved"])))

            # İş yükü dengesi
            if result_metrics.get("workload_distribution_std_dev") is not None:
                # Standart sapma düşükse denge yüksektir (ters orantı)
                std_dev = result_metrics["workload_distribution_std_dev"]
                if std_dev <= 0.1:
                    metrics.workloadBalance = 95
                elif std_dev <= 0.5:
                    metrics.workloadBalance = 90
                elif std_dev <= 1.0:
                    metrics.workloadBalance = 80
                elif std_dev <= 1.5:
                    metrics.workloadBalance = 70
                else:
                    metrics.workloadBalance = 60

        # Son optimizasyon raporunu hazırla
        last_report = LastOptimizationReport()
        if optimization_result:
            # Durum
            status = optimization_result.get("status", "")
            if status == "OPTIMAL":
                last_report.status = "BAŞARILI"
                last_report.statusColor = "success.main"
            elif status == "FEASIBLE":
                last_report.status = "UYGUN"
                last_report.statusColor = "warning.main"
            elif status == "INFEASIBLE":
                last_report.status = "UYGUNSUZ"
                last_report.statusColor = "error.main"
            else:
                last_report.status = status
                last_report.statusColor = "info.main"

            # Özet metin
            if status == "OPTIMAL":
                last_report.summaryText = "Son çizelgeleme işlemi başarıyla tamamlandı. Tüm departmanlar için minimum personel gereksinimleri karşılandı ve çalışan tercihleri maksimum düzeyde dikkate alındı."
            elif status == "FEASIBLE":
                last_report.summaryText = "Çizelgeleme işlemi tamamlandı, ancak optimal çözüm bulunamadı. Bazı kısıtlar tam olarak karşılanamadı."
            elif status == "INFEASIBLE":
                last_report.summaryText = "Çizelgeleme işlemi tamamlanamadı. Verilen kısıtlar altında uygun bir çözüm bulunamadı."
            else:
                last_report.summaryText = "Çizelgeleme işlemi sırasında bir sorun oluştu."

            # İşlem süresi
            if optimization_result.get("processing_time_seconds") is not None:
                last_report.processingTime = f"{optimization_result['processing_time_seconds']:.2f}s"

            # Hedef değeri
            if optimization_result.get("objective_value") is not None:
                last_report.objectiveValue = optimization_result["objective_value"]

            # Atama sayısı
            if optimization_result.get("solution") and optimization_result["solution"].get("assignments"):
                last_report.assignmentsCount = len(optimization_result["solution"]["assignments"])

            # Tarih
            last_report.date = datetime.now().strftime("%d.%m")

        # Sistem durumunu hazırla
        system_status = SystemStatus(
            overallStatusText="Tüm sistemler normal şekilde çalışıyor. Veri seti ve konfigürasyon dosyaları güncel durumda.",
            apiStatus="Çalışıyor",
            n8nStatus="Çalışıyor",
            activeDataset="Hastane" if optimization_result else "",
            activeConfig="hospital_test_config.yaml" if optimization_result else "",
            lastUpdate=datetime.now().strftime("%d.%m.%Y")
        )

        # Son aktiviteleri hazırla
        # Aktivite log dosyasından son aktiviteleri oku
        activity_logs = get_recent_activities(limit=10)

        # Aktivite nesnelerini oluştur
        recent_activities = []
        for activity in activity_logs:
            recent_activities.append(
                RecentActivity(
                    id=activity["id"],
                    date=activity["date"],
                    action=activity["action"],
                    detail=activity["detail"],
                    color=activity["color"],
                    icon=activity["icon"]
                )
            )

        # Dashboard verilerini döndür
        return DashboardData(
            performanceMetrics=metrics,
            lastOptimizationReport=last_report,
            systemStatus=system_status,
            recentActivities=recent_activities
        )
    except Exception as e:
        logger.error(f"Dashboard verileri hazırlanırken hata: {e}")
        raise HTTPException(status_code=500, detail=f"Error preparing dashboard data: {str(e)}")

@router.get("/datasets", response_model=List[Dataset])
async def get_datasets_endpoint():
    """Mevcut veri setlerini listeler."""
    return get_datasets()

@router.get("/configurations", response_model=List[Configuration])
async def get_configurations_endpoint():
    """Mevcut konfigürasyon dosyalarını listeler."""
    return get_configurations()

@router.get("/configuration-content")
async def get_configuration_content_endpoint(configId: str):
    """Belirtilen konfigürasyon dosyasının içeriğini döndürür."""
    content = get_configuration_content(configId)
    return ConfigurationContent(content=content)
