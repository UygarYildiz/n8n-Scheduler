import os
import json
import logging
import re
from typing import List
from fastapi import APIRouter, HTTPException
from datetime import datetime

try:
    from optimization_core.dashboard_models import (
        DashboardData,
        PerformanceMetrics,
        LastOptimizationReport,
        SystemStatus,
        RecentActivity
    )
    from optimization_core.activity_logger import get_recent_activities
except ImportError:
    # Doğrudan çalıştırıldığında (development) farklı import yolu
    from dashboard_models import (
        DashboardData,
        PerformanceMetrics,
        LastOptimizationReport,
        SystemStatus,
        RecentActivity
    )
    from activity_logger import get_recent_activities

# Logging
logger = logging.getLogger(__name__)

# Router oluştur
router = APIRouter()

# Yardımcı fonksiyonlar
def get_project_root():
    """Proje kök dizinini döndürür."""
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def calculate_workload_balance_score(std_dev):
    """
    Standart sapmayı iş yükü dengesi puanına dönüştürür.

    Args:
        std_dev (float): İş yükü dağılımının standart sapması

    Returns:
        int: 0-100 arasında iş yükü dengesi puanı
    """
    # Parametreler
    max_expected_std_dev = 2.0  # Beklenen maksimum standart sapma
    min_score = 50  # Minimum puan
    max_score = 100  # Maksimum puan

    # Doğrusal dönüşüm formülü
    if std_dev <= 0:
        return max_score  # Mükemmel denge durumu
    elif std_dev >= max_expected_std_dev:
        return min_score  # En kötü denge durumu
    else:
        # Doğrusal interpolasyon
        score = max_score - ((std_dev / max_expected_std_dev) * (max_score - min_score))
        return int(round(score))  # Tam sayıya yuvarla

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

# API Endpoint'leri
@router.get("/api/dashboard", response_model=DashboardData)
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
            if result_metrics.get("positive_preferences_met_count") is not None:
                # Tercih sayılarını al
                positive_preferences_met = result_metrics.get("positive_preferences_met_count", 0)

                # Log mesajlarını kontrol et
                import re
                import os

                # Log dosyasını bul
                log_file_path = os.path.join(get_project_root(), "optimization_core", "logs", "app.log")
                total_positive_preferences = 37  # Varsayılan değer

                try:
                    if os.path.exists(log_file_path):
                        with open(log_file_path, 'r') as log_file:
                            log_content = log_file.read()
                            # Log mesajlarından toplam pozitif tercih sayısını bul
                            match = re.search(r'Toplam Pozitif Tercih Sayısı=(\d+)', log_content)
                            if match:
                                total_positive_preferences = int(match.group(1))
                                logger.info(f"Log dosyasından toplam pozitif tercih sayısı bulundu: {total_positive_preferences}")
                except Exception as e:
                    logger.warning(f"Log dosyası okunamadı: {e}")

                # Tercih karşılama oranını hesapla (yüzde olarak)
                if total_positive_preferences > 0:
                    # Pozitif tercihlerin karşılanma oranı
                    preference_percentage = (positive_preferences_met / total_positive_preferences) * 100
                    metrics.preferenceScore = min(100, max(0, int(preference_percentage)))
                    logger.info(f"Çalışan memnuniyeti hesaplaması: {positive_preferences_met} / {total_positive_preferences} = {preference_percentage:.2f}% -> {metrics.preferenceScore}%")
                else:
                    # Eğer pozitif tercih yoksa, %100 göster
                    metrics.preferenceScore = 100
                    logger.info("Pozitif tercih bulunamadı, memnuniyet %100 olarak ayarlandı")
            else:
                # Eğer pozitif tercih sayısı yoksa, varsayılan değer kullan
                metrics.preferenceScore = 0
                logger.warning("Pozitif tercih sayısı bulunamadı, memnuniyet %0 olarak ayarlandı")

            # İş yükü dengesi
            if result_metrics.get("workload_distribution_std_dev") is not None:
                # Standart sapma değerini al
                std_dev = result_metrics["workload_distribution_std_dev"]

                # Doğrusal dönüşüm formülü ile iş yükü dengesi puanını hesapla
                metrics.workloadBalance = calculate_workload_balance_score(std_dev)

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


