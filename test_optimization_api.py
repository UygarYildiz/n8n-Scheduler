"""
Optimizasyon API'sini test etmek için basit bir betik.
Yapay veri üretir ve API'ye gönderir.
"""

import requests
import json
import os
import sys
from datetime import date, timedelta

# Yapay veri oluştur
def generate_test_data():
    # Basit test verisi
    employees = [
        {"employee_id": "E001", "role": "Hemşire"},
        {"employee_id": "E002", "role": "Hemşire"},
        {"employee_id": "E003", "role": "Doktor"},
        {"employee_id": "E004", "role": "Doktor"}
    ]
    
    # Vardiyalar
    today = date.today()
    shifts = [
        {"shift_id": "S001", "name": "Gündüz Hafta İçi", "date": today.isoformat(), "start_time": "08:00", "end_time": "16:00"},
        {"shift_id": "S002", "name": "Gece Hafta İçi", "date": today.isoformat(), "start_time": "16:00", "end_time": "00:00"},
        {"shift_id": "S003", "name": "Gündüz Hafta Sonu", "date": (today + timedelta(days=1)).isoformat(), "start_time": "08:00", "end_time": "20:00"},
        {"shift_id": "S004", "name": "Gece Hafta Sonu", "date": (today + timedelta(days=1)).isoformat(), "start_time": "20:00", "end_time": "08:00"}
    ]
    
    # Yetenekler
    skills = [
        {"employee_id": "E001", "skill": "Acil Tıp"},
        {"employee_id": "E003", "skill": "Acil Tıp"},
        {"employee_id": "E004", "skill": "Kardiyoloji"}
    ]
    
    # Uygunluk
    availability = [
        {"employee_id": "E001", "date": today.isoformat(), "is_available": 1},
        {"employee_id": "E001", "date": (today + timedelta(days=1)).isoformat(), "is_available": 1},
        {"employee_id": "E002", "date": today.isoformat(), "is_available": 1},
        {"employee_id": "E002", "date": (today + timedelta(days=1)).isoformat(), "is_available": 0},  # E002 yarın müsait değil
        {"employee_id": "E003", "date": today.isoformat(), "is_available": 1},
        {"employee_id": "E003", "date": (today + timedelta(days=1)).isoformat(), "is_available": 1},
        {"employee_id": "E004", "date": today.isoformat(), "is_available": 0},  # E004 bugün müsait değil
        {"employee_id": "E004", "date": (today + timedelta(days=1)).isoformat(), "is_available": 1}
    ]
    
    # Tercihler
    preferences = [
        {"employee_id": "E001", "shift_id": "S001", "preference_score": 1},  # E001 gündüz vardiyasını tercih ediyor
        {"employee_id": "E002", "shift_id": "S002", "preference_score": 1},  # E002 gece vardiyasını tercih ediyor
        {"employee_id": "E003", "shift_id": "S003", "preference_score": 1},  # E003 hafta sonu gündüz vardiyasını tercih ediyor
        {"employee_id": "E004", "shift_id": "S004", "preference_score": -1}  # E004 hafta sonu gece vardiyasını istemiyor
    ]
    
    return {
        "employees": employees,
        "shifts": shifts,
        "skills": skills,
        "availability": availability,
        "preferences": preferences
    }

def main():
    # API URL
    api_url = "http://localhost:8000/optimize"
    
    # Test verisi oluştur
    input_data = generate_test_data()
    
    # İstek verisi
    request_data = {
        "configuration_ref": "configs/hospital_test_config.yaml",
        "input_data": input_data
    }
    
    print("API'ye istek gönderiliyor...")
    try:
        response = requests.post(api_url, json=request_data)
        
        if response.status_code == 200:
            result = response.json()
            print("\nOptimizasyon başarılı!")
            print(f"Durum: {result['status']}")
            print(f"Çözücü mesajı: {result['solver_status_message']}")
            print(f"İşlem süresi: {result['processing_time_seconds']:.2f} saniye")
            
            if result['objective_value'] is not None:
                print(f"Hedef fonksiyon değeri: {result['objective_value']}")
            
            if result['solution'] and 'assignments' in result['solution']:
                print("\nAtamalar:")
                for assignment in result['solution']['assignments']:
                    print(f"  {assignment['employee_id']} -> {assignment['shift_id']}")
            
            # Tam sonucu dosyaya kaydet
            with open("optimization_result.json", "w") as f:
                json.dump(result, f, indent=2)
                print("\nTam sonuç 'optimization_result.json' dosyasına kaydedildi.")
        else:
            print(f"Hata: {response.status_code}")
            print(response.text)
    
    except Exception as e:
        print(f"İstek gönderilirken hata oluştu: {e}")

if __name__ == "__main__":
    main()
