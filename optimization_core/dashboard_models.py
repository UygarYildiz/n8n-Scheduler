from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

# Dashboard veri modelleri
class PerformanceMetrics(BaseModel):
    understaffing: int = 0
    overstaffing: int = 0
    coverageRatio: int = 0
    skillCoverage: int = 0
    preferenceScore: int = 0
    workloadBalance: int = 0
    coverageRatioChange: Optional[str] = None  # Örn: "+5%" veya "-2%"
    skillCoverageChange: Optional[str] = None
    preferenceScoreChange: Optional[str] = None
    workloadBalanceChange: Optional[str] = None

class LastOptimizationReport(BaseModel):
    status: str = ""
    statusColor: str = "success.main"
    summaryText: str = ""
    processingTime: str = ""
    objectiveValue: float = 0
    assignmentsCount: int = 0
    date: str = ""

class SystemStatus(BaseModel):
    overallStatusText: str = ""
    apiStatus: str = "Çalışıyor"  # 'Çalışıyor' | 'Sorun Var' | 'Bilinmiyor'
    n8nStatus: str = "Çalışıyor"  # 'Çalışıyor' | 'Sorun Var' | 'Bilinmiyor'
    activeDataset: str = ""
    activeConfig: str = ""
    lastUpdate: str = ""

class RecentActivity(BaseModel):
    id: str
    date: str
    action: str
    detail: str
    color: str  # MUI theme color string, örn: 'primary.main' veya '#1976d2'
    icon: str  # Icon adları: 'BoltIcon' | 'SettingsIcon' | 'DatasetIcon' | 'ReportIcon'

class DashboardData(BaseModel):
    performanceMetrics: PerformanceMetrics = Field(default_factory=PerformanceMetrics)
    lastOptimizationReport: LastOptimizationReport = Field(default_factory=LastOptimizationReport)
    systemStatus: SystemStatus = Field(default_factory=SystemStatus)
    recentActivities: List[RecentActivity] = Field(default_factory=list)

class Dataset(BaseModel):
    id: str
    name: str
    path: Optional[str] = None

class Configuration(BaseModel):
    id: str
    name: str
    path: Optional[str] = None

class ConfigurationContent(BaseModel):
    content: str
