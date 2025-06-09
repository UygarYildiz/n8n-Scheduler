"""
Optimized Configuration Test
Bu script, iyileştirilmiş konfigürasyonu test eder.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from optimization_core.cp_model_builder import ShiftSchedulingModelBuilder
import yaml
import time
import json

def load_test_data():
    """Test verilerini yükle"""
    # Basit test verisi
    input_data = {
        'employees': [
            {'employee_id': f'E{i:03d}', 'role': 'Hemşire', 'department': 'Acil'} 
            for i in range(20)
        ],
        'shifts': [
            {'shift_id': f'S{i:03d}', 'date': '2024-01-01', 'required_staff': 2, 
             'shift_type': 'Gündüz', 'day_type': 'Hafta İçi'} 
            for i in range(30)
        ],
        'availability': [
            {'employee_id': f'E{i:03d}', 'date': '2024-01-01', 'is_available': 1}
            for i in range(20)
        ],
        'preferences': [
            {'employee_id': f'E{i:03d}', 'shift_id': f'S{j:03d}', 'preference_score': 
             3 if (i + j) % 3 == 0 else 1}
            for i in range(20) for j in range(30) if (i + j) % 4 == 0
        ],
        'skills': []
    }
    return input_data

def test_configuration(config_file, config_name):
    """Konfigürasyonu test et"""
    print(f"\n🧪 Testing {config_name} Configuration")
    print("=" * 50)
    
    # Konfigürasyonu yükle
    with open(config_file, 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)
    
    # Test verilerini yükle
    input_data = load_test_data()
    
    # Model oluştur ve çöz
    try:
        start_time = time.time()
        
        model_builder = ShiftSchedulingModelBuilder(input_data, config)
        model_builder.build_model()
        status, result = model_builder.solve_model()
        
        end_time = time.time()
        
        # Sonuçları analiz et
        if result.get('solution') and result['solution'].get('assignments'):
            assignments = result['solution']['assignments']
            metrics = result.get('metrics', {})
            
            # Tercih memnuniyeti hesapla
            total_preferences = len(input_data['preferences'])
            satisfied_preferences = 0
            
            for assignment in assignments:
                for pref in input_data['preferences']:
                    if (assignment['employee_id'] == pref['employee_id'] and 
                        assignment['shift_id'] == pref['shift_id'] and
                        pref['preference_score'] > 2):
                        satisfied_preferences += 1
            
            preference_satisfaction = satisfied_preferences / max(total_preferences, 1) * 100
            
            print(f"✅ Çözüm Bulundu!")
            print(f"   Status: {status}")
            print(f"   Çözüm Süresi: {end_time - start_time:.2f}s")
            print(f"   Atama Sayısı: {len(assignments)}")
            print(f"   Objective Value: {result.get('objective_value', 'N/A')}")
            print(f"   Tercih Memnuniyeti: {preference_satisfaction:.1f}%")
            
            if metrics:
                print(f"   Metrics:")
                for key, value in metrics.items():
                    if isinstance(value, (int, float)):
                        print(f"     {key}: {value}")
            
            return {
                'success': True,
                'solve_time': end_time - start_time,
                'assignments': len(assignments),
                'objective_value': result.get('objective_value'),
                'preference_satisfaction': preference_satisfaction,
                'metrics': metrics
            }
        else:
            print(f"❌ Çözüm Bulunamadı!")
            print(f"   Status: {status}")
            return {
                'success': False,
                'status': status
            }
            
    except Exception as e:
        print(f"❌ Hata: {e}")
        return {
            'success': False,
            'error': str(e)
        }

def main():
    """Ana fonksiyon"""
    print("🔬 OPTİMİZE EDİLMİŞ KONFİGÜRASYON TESTİ")
    print("=" * 60)
    
    # Test edilecek konfigürasyonlar
    configs = [
        ('configs/hospital_test_config.yaml', 'Original'),
        ('configs/optimized_hospital_config.yaml', 'Optimized')
    ]
    
    results = {}
    
    for config_file, config_name in configs:
        if os.path.exists(config_file):
            result = test_configuration(config_file, config_name)
            results[config_name] = result
        else:
            print(f"⚠️ Konfigürasyon dosyası bulunamadı: {config_file}")
    
    # Karşılaştırma
    print(f"\n📊 KARŞILAŞTIRMA SONUÇLARI")
    print("=" * 40)
    
    if 'Original' in results and 'Optimized' in results:
        orig = results['Original']
        opt = results['Optimized']
        
        if orig['success'] and opt['success']:
            print(f"Tercih Memnuniyeti:")
            print(f"   Original: {orig['preference_satisfaction']:.1f}%")
            print(f"   Optimized: {opt['preference_satisfaction']:.1f}%")
            
            improvement = ((opt['preference_satisfaction'] - orig['preference_satisfaction']) / 
                          orig['preference_satisfaction'] * 100)
            print(f"   İyileştirme: {improvement:.1f}%")
            
            print(f"\nÇözüm Süresi:")
            print(f"   Original: {orig['solve_time']:.2f}s")
            print(f"   Optimized: {opt['solve_time']:.2f}s")
            
            if improvement >= 60:
                print(f"\n🎯 SONUÇ: ✅ H2 Hipotezi KABUL EDİLDİ!")
                print(f"   İyileştirme oranı %60'ı aştı: {improvement:.1f}%")
            else:
                print(f"\n🎯 SONUÇ: ⚠️ Daha fazla optimizasyon gerekli")
                print(f"   Mevcut iyileştirme: {improvement:.1f}%")
        else:
            print("❌ Karşılaştırma yapılamadı - çözüm hataları")
    
    # Sonuçları kaydet
    with open('optimization_comparison_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Sonuçlar 'optimization_comparison_results.json' dosyasına kaydedildi.")

if __name__ == "__main__":
    main()
