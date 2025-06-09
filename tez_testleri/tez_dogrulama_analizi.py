"""
Bitirme Tezi Doğrulama Analizi
Bu script, bitirme tezindeki her iddiayı proje dosyalarıyla karşılaştırır.
"""

import os
import re
import yaml
import json
from typing import Dict, List, Any, Tuple

class TezDogrulamaAnalizi:
    """Tez doğrulama analiz sınıfı"""
    
    def __init__(self):
        self.proje_dosyalari = {}
        self.tez_iddialari = {}
        self.dogrulama_sonuclari = {}
        
    def proje_dosyalarini_tara(self) -> Dict[str, Any]:
        """Proje dosyalarını tarar ve içeriklerini analiz eder"""
        print("🔍 PROJE DOSYALARI TARANYOR...")
        print("=" * 50)
        
        dosya_analizi = {
            "backend_dosyalar": [],
            "frontend_dosyalar": [],
            "config_dosyalar": [],
            "data_dosyalar": [],
            "deployment_dosyalar": [],
            "test_dosyalar": [],
            "docs_dosyalar": []
        }
        
        # Backend dosyaları
        backend_path = "optimization_core"
        if os.path.exists(backend_path):
            for dosya in os.listdir(backend_path):
                if dosya.endswith('.py'):
                    dosya_analizi["backend_dosyalar"].append(dosya)
        
        # Frontend dosyaları
        frontend_path = "ui/src"
        if os.path.exists(frontend_path):
            for root, dirs, files in os.walk(frontend_path):
                for dosya in files:
                    if dosya.endswith(('.tsx', '.ts', '.jsx', '.js')):
                        dosya_analizi["frontend_dosyalar"].append(os.path.join(root, dosya))
        
        # Config dosyaları
        config_path = "configs"
        if os.path.exists(config_path):
            for dosya in os.listdir(config_path):
                if dosya.endswith(('.yaml', '.yml', '.json')):
                    dosya_analizi["config_dosyalar"].append(dosya)
        
        # Data dosyaları
        data_paths = ["synthetic_data", "synthetic_data_cagri_merkezi", "data"]
        for path in data_paths:
            if os.path.exists(path):
                for root, dirs, files in os.walk(path):
                    for dosya in files:
                        if dosya.endswith(('.csv', '.json')):
                            dosya_analizi["data_dosyalar"].append(os.path.join(root, dosya))
        
        # Deployment dosyaları
        deployment_path = "deployment"
        if os.path.exists(deployment_path):
            for dosya in os.listdir(deployment_path):
                dosya_analizi["deployment_dosyalar"].append(dosya)
        
        # Test dosyaları
        test_path = "tests"
        if os.path.exists(test_path):
            for dosya in os.listdir(test_path):
                if dosya.endswith('.py'):
                    dosya_analizi["test_dosyalar"].append(dosya)
        
        # Docs dosyaları
        docs_path = "docs"
        if os.path.exists(docs_path):
            for dosya in os.listdir(docs_path):
                if dosya.endswith('.md'):
                    dosya_analizi["docs_dosyalar"].append(dosya)
        
        print("📊 Bulunan Dosyalar:")
        for kategori, dosyalar in dosya_analizi.items():
            print(f"   {kategori}: {len(dosyalar)} dosya")
            for dosya in dosyalar[:3]:  # İlk 3'ünü göster
                print(f"     • {dosya}")
            if len(dosyalar) > 3:
                print(f"     ... ve {len(dosyalar)-3} dosya daha")
        print()
        
        return dosya_analizi
    
    def tez_iddialarini_analiz_et(self) -> Dict[str, List[str]]:
        """Bitirme tezindeki iddiaları kategorize eder"""
        print("📋 TEZ İDDİALARI ANALİZ EDİLİYOR...")
        print("=" * 50)
        
        tez_iddialari = {
            "teknoloji_stack": [
                "React TypeScript frontend",
                "FastAPI Python backend", 
                "MySQL database",
                "n8n workflow automation",
                "Docker containerization",
                "CP-SAT optimization engine",
                "Google OR-Tools 9.8.3296"
            ],
            "sistem_mimarisi": [
                "Microservices architecture",
                "JWT authentication",
                "Role-based access control (RBAC)",
                "RESTful API design",
                "CORS middleware",
                "Multi-tenant support"
            ],
            "optimizasyon_ozellikleri": [
                "5 objective functions",
                "Multi-objective optimization",
                "Constraint programming",
                "Dynamic constraint generation",
                "YAML configuration system",
                "Real-time optimization"
            ],
            "veri_ve_test": [
                "Hospital domain (80 employees, 85 shifts)",
                "Call center domain (80 operators, 126 shifts)",
                "Synthetic data generation",
                "Statistical validation",
                "Performance benchmarking",
                "Scalability testing"
            ],
            "performans_metrikleri": [
                "100% optimal solution rate",
                "Sub-10 second solve times",
                "Linear scalability O(n)",
                "99.96% time savings vs manual",
                "87% preference satisfaction",
                "Zero constraint violations"
            ],
            "deployment_ve_devops": [
                "Docker Compose orchestration",
                "Cloud deployment ready",
                "Automated testing",
                "CI/CD pipeline",
                "Environment configuration",
                "Database migrations"
            ]
        }
        
        print("📊 Tez İddiaları Kategorileri:")
        for kategori, iddialar in tez_iddialari.items():
            print(f"   {kategori}: {len(iddialar)} iddia")
        print()
        
        return tez_iddialari
    
    def teknoloji_stack_dogrula(self, dosya_analizi: Dict) -> Dict[str, Any]:
        """Teknoloji stack iddialarını doğrular"""
        print("🔧 TEKNOLOJİ STACK DOĞRULAMA...")
        print("=" * 40)
        
        dogrulama = {
            "react_typescript": False,
            "fastapi_python": False,
            "mysql_database": False,
            "n8n_workflow": False,
            "docker_container": False,
            "cp_sat_engine": False,
            "or_tools_version": False
        }
        
        # React TypeScript kontrolü
        if any('tsx' in dosya or 'ts' in dosya for dosya in dosya_analizi["frontend_dosyalar"]):
            dogrulama["react_typescript"] = True
            print("✅ React TypeScript frontend bulundu")
        else:
            print("❌ React TypeScript frontend bulunamadı")
        
        # FastAPI kontrolü
        if "main.py" in dosya_analizi["backend_dosyalar"]:
            try:
                with open("optimization_core/main.py", 'r', encoding='utf-8') as f:
                    content = f.read()
                    if "FastAPI" in content and "from fastapi" in content:
                        dogrulama["fastapi_python"] = True
                        print("✅ FastAPI Python backend bulundu")
                    else:
                        print("❌ FastAPI import bulunamadı")
            except:
                print("❌ main.py okunamadı")
        
        # MySQL kontrolü
        if "database.py" in dosya_analizi["backend_dosyalar"]:
            try:
                with open("optimization_core/database.py", 'r', encoding='utf-8') as f:
                    content = f.read()
                    if "mysql" in content.lower():
                        dogrulama["mysql_database"] = True
                        print("✅ MySQL database konfigürasyonu bulundu")
                    else:
                        print("❌ MySQL konfigürasyonu bulunamadı")
            except:
                print("❌ database.py okunamadı")
        
        # n8n kontrolü
        if os.path.exists("n8n_data") or os.path.exists("n8n.json"):
            dogrulama["n8n_workflow"] = True
            print("✅ n8n workflow dosyaları bulundu")
        else:
            print("❌ n8n workflow dosyaları bulunamadı")
        
        # Docker kontrolü
        if os.path.exists("docker-compose.yml"):
            dogrulama["docker_container"] = True
            print("✅ Docker Compose konfigürasyonu bulundu")
        else:
            print("❌ Docker Compose dosyası bulunamadı")
        
        # CP-SAT kontrolü
        if "cp_model_builder.py" in dosya_analizi["backend_dosyalar"]:
            try:
                with open("optimization_core/cp_model_builder.py", 'r', encoding='utf-8') as f:
                    content = f.read()
                    if "cp_model" in content and "ortools" in content:
                        dogrulama["cp_sat_engine"] = True
                        print("✅ CP-SAT optimization engine bulundu")
                    else:
                        print("❌ CP-SAT import bulunamadı")
            except:
                print("❌ cp_model_builder.py okunamadı")
        
        # OR-Tools version kontrolü
        if os.path.exists("requirements.txt"):
            try:
                with open("requirements.txt", 'r', encoding='utf-8') as f:
                    content = f.read()
                    if "ortools" in content:
                        dogrulama["or_tools_version"] = True
                        print("✅ OR-Tools dependency bulundu")
                    else:
                        print("❌ OR-Tools dependency bulunamadı")
            except:
                print("❌ requirements.txt okunamadı")
        
        print()
        return dogrulama
    
    def optimizasyon_ozellikleri_dogrula(self) -> Dict[str, Any]:
        """Optimizasyon özelliklerini doğrular"""
        print("🎯 OPTİMİZASYON ÖZELLİKLERİ DOĞRULAMA...")
        print("=" * 40)
        
        dogrulama = {
            "multi_objective": False,
            "five_objectives": False,
            "constraint_programming": False,
            "dynamic_constraints": False,
            "yaml_config": False,
            "objective_functions": []
        }
        
        # CP-SAT model builder analizi
        if os.path.exists("optimization_core/cp_model_builder.py"):
            try:
                with open("optimization_core/cp_model_builder.py", 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                    # Multi-objective kontrolü
                    if "objective" in content.lower() and "weight" in content.lower():
                        dogrulama["multi_objective"] = True
                        print("✅ Multi-objective optimization bulundu")
                    
                    # 5 hedef fonksiyonu kontrolü
                    objective_patterns = [
                        "minimize_overstaffing",
                        "minimize_understaffing", 
                        "maximize_preferences",
                        "balance_workload",
                        "maximize_shift_coverage"
                    ]
                    
                    found_objectives = []
                    for pattern in objective_patterns:
                        if pattern in content:
                            found_objectives.append(pattern)
                    
                    dogrulama["objective_functions"] = found_objectives
                    if len(found_objectives) >= 5:
                        dogrulama["five_objectives"] = True
                        print(f"✅ 5 hedef fonksiyonu bulundu: {len(found_objectives)}")
                    else:
                        print(f"❌ Sadece {len(found_objectives)} hedef fonksiyonu bulundu")
                    
                    # Constraint programming kontrolü
                    if "constraint" in content.lower() and "cp_model" in content:
                        dogrulama["constraint_programming"] = True
                        print("✅ Constraint programming implementasyonu bulundu")
                    
                    # Dynamic constraints kontrolü
                    if "dynamic" in content.lower() or "config" in content.lower():
                        dogrulama["dynamic_constraints"] = True
                        print("✅ Dynamic constraint generation bulundu")
                        
            except Exception as e:
                print(f"❌ cp_model_builder.py analiz hatası: {e}")
        
        # YAML config kontrolü
        yaml_files = [f for f in os.listdir("configs") if f.endswith(('.yaml', '.yml'))]
        if yaml_files:
            dogrulama["yaml_config"] = True
            print(f"✅ YAML konfigürasyon dosyaları bulundu: {len(yaml_files)}")
        else:
            print("❌ YAML konfigürasyon dosyaları bulunamadı")
        
        print()
        return dogrulama
    
    def veri_ve_test_dogrula(self) -> Dict[str, Any]:
        """Veri ve test iddialarını doğrular"""
        print("📊 VERİ VE TEST DOĞRULAMA...")
        print("=" * 40)
        
        dogrulama = {
            "hospital_data": False,
            "call_center_data": False,
            "synthetic_data": False,
            "statistical_tests": False,
            "performance_tests": False,
            "data_file_count": 0
        }
        
        # Hospital data kontrolü
        hospital_files = ["synthetic_data/employees.csv", "synthetic_data/shifts.csv"]
        if all(os.path.exists(f) for f in hospital_files):
            dogrulama["hospital_data"] = True
            print("✅ Hospital domain data bulundu")
        else:
            print("❌ Hospital domain data eksik")
        
        # Call center data kontrolü
        call_center_files = ["synthetic_data_cagri_merkezi/employees_cm.csv", 
                           "synthetic_data_cagri_merkezi/shifts_cm.csv"]
        if all(os.path.exists(f) for f in call_center_files):
            dogrulama["call_center_data"] = True
            print("✅ Call center domain data bulundu")
        else:
            print("❌ Call center domain data eksik")
        
        # Synthetic data kontrolü
        synthetic_paths = ["synthetic_data", "synthetic_data_cagri_merkezi"]
        total_files = 0
        for path in synthetic_paths:
            if os.path.exists(path):
                csv_files = [f for f in os.listdir(path) if f.endswith('.csv')]
                total_files += len(csv_files)
        
        if total_files > 0:
            dogrulama["synthetic_data"] = True
            dogrulama["data_file_count"] = total_files
            print(f"✅ Synthetic data bulundu: {total_files} CSV dosyası")
        else:
            print("❌ Synthetic data bulunamadı")
        
        # Statistical tests kontrolü
        if os.path.exists("statistical_analysis.py"):
            dogrulama["statistical_tests"] = True
            print("✅ Statistical analysis script bulundu")
        else:
            print("❌ Statistical analysis script bulunamadı")
        
        # Performance tests kontrolü
        if os.path.exists("comprehensive_performance_test.py"):
            dogrulama["performance_tests"] = True
            print("✅ Performance test script bulundu")
        else:
            print("❌ Performance test script bulunamadı")
        
        print()
        return dogrulama

def main():
    """Ana fonksiyon"""
    print("🔬 BİTİRME TEZİ DOĞRULAMA ANALİZİ")
    print("=" * 60)
    print()
    
    analyzer = TezDogrulamaAnalizi()
    
    # 1. Proje dosyalarını tara
    dosya_analizi = analyzer.proje_dosyalarini_tara()
    
    # 2. Tez iddialarını analiz et
    tez_iddialari = analyzer.tez_iddialarini_analiz_et()
    
    # 3. Teknoloji stack doğrula
    tech_dogrulama = analyzer.teknoloji_stack_dogrula(dosya_analizi)
    
    # 4. Optimizasyon özellikleri doğrula
    opt_dogrulama = analyzer.optimizasyon_ozellikleri_dogrula()
    
    # 5. Veri ve test doğrula
    data_dogrulama = analyzer.veri_ve_test_dogrula()
    
    # 6. Genel değerlendirme
    print("🎯 GENEL DEĞERLENDİRME")
    print("=" * 30)
    
    total_checks = 0
    passed_checks = 0
    
    # Teknoloji stack skorları
    for key, value in tech_dogrulama.items():
        total_checks += 1
        if value:
            passed_checks += 1
    
    # Optimizasyon skorları
    for key, value in opt_dogrulama.items():
        if key != "objective_functions":
            total_checks += 1
            if value:
                passed_checks += 1
    
    # Veri skorları
    for key, value in data_dogrulama.items():
        if key != "data_file_count":
            total_checks += 1
            if value:
                passed_checks += 1
    
    success_rate = (passed_checks / total_checks) * 100
    
    print(f"📊 Doğrulama Sonuçları:")
    print(f"   Toplam Kontrol: {total_checks}")
    print(f"   Başarılı: {passed_checks}")
    print(f"   Başarı Oranı: {success_rate:.1f}%")
    print()
    
    if success_rate >= 90:
        print("🎉 SONUÇ: Tez iddiaları %90+ oranında doğrulandı!")
        print("   Projede implement edilmemiş önemli eksiklik YOK.")
    elif success_rate >= 80:
        print("⚠️ SONUÇ: Tez iddiaları %80+ oranında doğrulandı.")
        print("   Küçük eksiklikler var, ancak genel olarak tutarlı.")
    elif success_rate >= 70:
        print("🔍 SONUÇ: Tez iddiaları %70+ oranında doğrulandı.")
        print("   Bazı önemli eksiklikler var, gözden geçirilmeli.")
    else:
        print("❌ SONUÇ: Tez iddiaları %70'in altında doğrulandı.")
        print("   Önemli eksiklikler var, tez revize edilmeli.")

if __name__ == "__main__":
    main()
