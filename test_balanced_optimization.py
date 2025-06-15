#!/usr/bin/env python3
"""
Dengeli objektif fonksiyon ağırlıklarını test etmek için optimizasyon çalıştırma scripti
"""

import requests
import json
import time
import pandas as pd
from datetime import datetime

def load_csv_data():
    """CSV dosyalarından veri yükle"""
    base_path = "synthetic_data"

    # CSV dosyalarını oku
    employees_df = pd.read_csv(f"{base_path}/employees.csv")
    shifts_df = pd.read_csv(f"{base_path}/shifts.csv")
    availability_df = pd.read_csv(f"{base_path}/availability.csv")
    preferences_df = pd.read_csv(f"{base_path}/preferences.csv")
    skills_df = pd.read_csv(f"{base_path}/skills.csv")

    # API formatına dönüştür
    employees = []
    for _, emp in employees_df.iterrows():
        employees.append({
            'employee_id': emp['employee_id'],
            'name': emp['name'],
            'role': emp['role'],
            'department': emp['department'],
            'specialty': emp.get('specialty', '')
        })

    shifts = []
    for _, shift in shifts_df.iterrows():
        shifts.append({
            'shift_id': shift['shift_id'],
            'name': shift['name'],
            'date': shift['date'],
            'start_time': shift['start_time'],
            'end_time': shift['end_time'],
            'required_staff': 1,  # Varsayılan değer
            'department': shift['department']
        })

    availability = []
    for _, avail in availability_df.iterrows():
        availability.append({
            'employee_id': avail['employee_id'],
            'date': avail['date'],
            'is_available': bool(avail['is_available'])
        })

    preferences = []
    for _, pref in preferences_df.iterrows():
        preferences.append({
            'employee_id': pref['employee_id'],
            'shift_id': pref['shift_id'],
            'preference_score': int(pref['preference_score'])
        })

    skills = []
    for _, skill in skills_df.iterrows():
        skills.append({
            'employee_id': skill['employee_id'],
            'skill': skill['skill']
        })

    return {
        'employees': employees,
        'shifts': shifts,
        'availability': availability,
        'preferences': preferences,
        'skills': skills
    }

def test_balanced_optimization():
    """Dengeli ağırlıklarla optimizasyon testi"""

    # API endpoint
    url = "http://localhost:8000/optimize"

    # CSV verilerini yükle
    input_data = load_csv_data()

    # Test verisi
    payload = {
        "configuration_ref": "optimized_hospital_config.yaml",
        "input_data": input_data
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    print("🚀 Dengeli objektif fonksiyon ağırlıklarıyla optimizasyon başlatılıyor...")
    print(f"📊 Yeni ağırlıklar:")
    print(f"   - minimize_understaffing: 10 (hasta güvenliği)")
    print(f"   - maximize_shift_coverage: 5 (operasyonel süreklilik)")
    print(f"   - maximize_preferences: 4 (çalışan memnuniyeti)")
    print(f"   - minimize_overstaffing: 3 (maliyet kontrolü)")
    print(f"   - balance_workload: 2 (sürdürülebilirlik)")
    print()
    
    try:
        start_time = time.time()
        response = requests.post(url, json=payload, headers=headers, timeout=120)
        end_time = time.time()
        
        if response.status_code == 200:
            result = response.json()
            
            print("✅ Optimizasyon başarıyla tamamlandı!")
            print(f"⏱️  İşlem süresi: {end_time - start_time:.2f} saniye")
            print()
            
            # Sonuçları analiz et
            print("📈 SONUÇ ANALİZİ:")
            print(f"   Status: {result.get('status', 'N/A')}")
            print(f"   Objektif Değer: {result.get('objective_value', 'N/A')}")
            print(f"   İşlem Süresi: {result.get('processing_time_seconds', 'N/A')} saniye")
            print()
            
            # Metrikleri göster
            if 'metrics' in result and result['metrics']:
                metrics = result['metrics']
                print("📊 DETAYLI METRİKLER:")
                print(f"   Eksik Personel: {metrics.get('total_understaffing', 'N/A')}")
                print(f"   Fazla Personel: {metrics.get('total_overstaffing', 'N/A')}")
                print(f"   Personel Kapsama Oranı: {metrics.get('min_staffing_coverage_ratio', 'N/A')}")
                print(f"   Yetenek Kapsama Oranı: {metrics.get('skill_coverage_ratio', 'N/A')}")
                print(f"   Karşılanan Pozitif Tercihler: {metrics.get('positive_preferences_met_count', 'N/A')}")
                print(f"   Toplam Pozitif Tercih: {metrics.get('total_positive_preferences_count', 'N/A')}")
                print(f"   Tercih Skoru: {metrics.get('total_preference_score_achieved', 'N/A')}")
                print(f"   İş Yükü Std Sapma: {metrics.get('workload_distribution_std_dev', 'N/A')}")
                print()
                
                # Tercih memnuniyeti oranı hesapla
                pos_met = metrics.get('positive_preferences_met_count', 0)
                total_pos = metrics.get('total_positive_preferences_count', 0)
                if total_pos > 0:
                    pref_ratio = (pos_met / total_pos) * 100
                    print(f"   Tercih Memnuniyet Oranı: %{pref_ratio:.1f}")
                print()
            
            # Atama sayısını göster
            if 'solution' in result and result['solution'] and 'assignments' in result['solution']:
                assignment_count = len(result['solution']['assignments'])
                print(f"   Toplam Atama Sayısı: {assignment_count}")
                print()
            
            # Sonucu dosyaya kaydet
            with open('balanced_optimization_result.json', 'w', encoding='utf-8') as f:
                json.dump(result, f, indent=2, ensure_ascii=False)
            print("💾 Sonuçlar 'balanced_optimization_result.json' dosyasına kaydedildi.")
            
            return result
            
        else:
            print(f"❌ API hatası: {response.status_code}")
            print(f"Hata mesajı: {response.text}")
            return None
            
    except requests.exceptions.Timeout:
        print("⏰ İstek zaman aşımına uğradı (120 saniye)")
        return None
    except requests.exceptions.ConnectionError:
        print("🔌 API'ye bağlanılamadı. API'nin çalıştığından emin olun.")
        return None
    except Exception as e:
        print(f"❌ Beklenmeyen hata: {e}")
        return None

if __name__ == "__main__":
    test_balanced_optimization()
