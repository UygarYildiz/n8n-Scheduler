#!/usr/bin/env python3
"""
Kapsamlı Akademik Performans Testi
"""
import json
import time
import sys
import os
import pandas as pd
import numpy as np
from statistics import mean, stdev
import random
from typing import Dict, List, Any

# Ana dizini path'e ekle
sys.path.append('optimization_core')

from cp_model_builder import ShiftSchedulingModelBuilder

class ComprehensivePerformanceTest:
    def __init__(self):
        self.results = {}
        
    def load_test_data(self, dataset_type="hastane"):
        """Test verilerini yükle"""
        base_path = f"veri_kaynaklari/{dataset_type}"
        
        # CSV verilerini yükle
        employees = pd.read_csv(f"{base_path}/employees.csv").to_dict('records')
        shifts = pd.read_csv(f"{base_path}/shifts.csv").to_dict('records')
        availability = pd.read_csv(f"{base_path}/availability.csv").to_dict('records')
        preferences = pd.read_csv(f"{base_path}/preferences.csv").to_dict('records')
        skills = pd.read_csv(f"{base_path}/skills.csv").to_dict('records')
        
        # Config dosyasını yükle
        import yaml
        config_path = f"configs/hospital_test_config.yaml" if dataset_type == "hastane" else "configs/cagri_merkezi_config.yaml"
        with open(config_path, 'r', encoding='utf-8') as f:
            config = yaml.safe_load(f)
        
        input_data = {
            'employees': employees,
            'shifts': shifts,
            'availability': availability,
            'preferences': preferences,
            'skills': skills
        }
        
        return config, input_data
    
    def create_scaled_dataset(self, original_data, scale_factor=0.5):
        """Veri setini ölçekle (küçültme/büyütme)"""
        config, input_data = original_data
        
        # Çalışan sayısını ölçekle
        employees = input_data['employees']
        target_emp_count = max(5, int(len(employees) * scale_factor))
        scaled_employees = employees[:target_emp_count]
        
        # Vardiya sayısını ölçekle
        shifts = input_data['shifts']
        target_shift_count = max(5, int(len(shifts) * scale_factor))
        scaled_shifts = shifts[:target_shift_count]
        
        # İlişkili verileri filtrele
        emp_ids = set(e['employee_id'] for e in scaled_employees)
        shift_ids = set(s['shift_id'] for s in scaled_shifts)
        
        scaled_availability = [a for a in input_data['availability'] if a['employee_id'] in emp_ids]
        scaled_preferences = [p for p in input_data['preferences'] 
                            if p['employee_id'] in emp_ids and p['shift_id'] in shift_ids]
        scaled_skills = [s for s in input_data['skills'] if s['employee_id'] in emp_ids]
        
        scaled_input = {
            'employees': scaled_employees,
            'shifts': scaled_shifts,
            'availability': scaled_availability,
            'preferences': scaled_preferences,
            'skills': scaled_skills
        }
        
        return config, scaled_input
    
    def run_single_optimization(self, config, input_data, test_name=""):
        """Tek optimizasyon çalıştır"""
        try:
            start_time = time.time()
            
            builder = ShiftSchedulingModelBuilder(config, input_data)
            model = builder.build_model()
            
            build_time = time.time() - start_time
            
            solve_start = time.time()
            status, result = builder.solve_model()
            solve_time = time.time() - solve_start
            total_time = time.time() - start_time
            
            assignment_count = 0
            if result.get('solution') and result['solution'].get('assignments'):
                assignment_count = len(result['solution']['assignments'])
            
            return {
                'status': status,
                'build_time': build_time,
                'solve_time': solve_time,
                'total_time': total_time,
                'assignment_count': assignment_count,
                'objective_value': result.get('objective_value'),
                'metrics': result.get('metrics'),
                'num_employees': len(input_data['employees']),
                'num_shifts': len(input_data['shifts']),
                'success': status == 'OPTIMAL'
            }
        except Exception as e:
            return {
                'status': 'ERROR',
                'error': str(e),
                'success': False
            }
    
    def run_scalability_test(self):
        """Ölçeklenebilirlik testi"""
        print("🔍 Ölçeklenebilirlik Testi Başlıyor...")
        
        scale_factors = [0.3, 0.5, 0.7, 1.0]  # %30, %50, %70, %100
        datasets = ["hastane", "cagri_merkezi"]
        
        scalability_results = {}
        
        for dataset in datasets:
            print(f"\n📊 {dataset.upper()} ölçeklenebilirlik testi:")
            original_data = self.load_test_data(dataset)
            dataset_results = []
            
            for scale in scale_factors:
                config, scaled_input = self.create_scaled_dataset(original_data, scale)
                
                result = self.run_single_optimization(config, scaled_input, f"{dataset}_scale_{scale}")
                result['scale_factor'] = scale
                dataset_results.append(result)
                
                if result['success']:
                    print(f"  Scale {scale:.1f}: {result['num_employees']}emp, {result['num_shifts']}shifts -> {result['total_time']:.2f}s")
                else:
                    print(f"  Scale {scale:.1f}: FAILED - {result.get('error', 'Unknown error')}")
            
            scalability_results[dataset] = dataset_results
        
        self.results['scalability'] = scalability_results
        return scalability_results
    
    def run_repeatability_test(self, runs=10):
        """Tekrarlanabilirlik testi"""
        print(f"\n📈 Tekrarlanabilirlik Testi ({runs} kez çalıştırma)...")
        
        datasets = ["hastane", "cagri_merkezi"]
        repeatability_results = {}
        
        for dataset in datasets:
            print(f"\n📊 {dataset.upper()} tekrarlanabilirlik:")
            config, input_data = self.load_test_data(dataset)
            
            run_results = []
            for i in range(runs):
                result = self.run_single_optimization(config, input_data, f"{dataset}_run_{i}")
                run_results.append(result)
                if result['success']:
                    print(f"  Run {i+1:2d}: {result['total_time']:.3f}s (obj: {result['objective_value']:.1f})")
                else:
                    print(f"  Run {i+1:2d}: FAILED")
            
            # İstatistikleri hesapla
            successful_runs = [r for r in run_results if r['success']]
            if successful_runs:
                times = [r['total_time'] for r in successful_runs]
                objectives = [r['objective_value'] for r in successful_runs]
                
                stats = {
                    'success_rate': len(successful_runs) / runs,
                    'time_mean': mean(times),
                    'time_std': stdev(times) if len(times) > 1 else 0,
                    'time_min': min(times),
                    'time_max': max(times),
                    'objective_mean': mean(objectives),
                    'objective_std': stdev(objectives) if len(objectives) > 1 else 0,
                    'runs': run_results
                }
                
                print(f"  📊 İstatistikler:")
                print(f"     Başarı Oranı: {stats['success_rate']:.1%}")
                print(f"     Süre: {stats['time_mean']:.3f}±{stats['time_std']:.3f}s")
                print(f"     Hedef: {stats['objective_mean']:.2f}±{stats['objective_std']:.2f}")
            else:
                stats = {'success_rate': 0, 'runs': run_results}
            
            repeatability_results[dataset] = stats
        
        self.results['repeatability'] = repeatability_results
        return repeatability_results
    
    def run_baseline_comparison(self):
        """Baseline algoritma karşılaştırmaları"""
        print(f"\n⚖️  Baseline Karşılaştırma Testi...")
        
        datasets = ["hastane", "cagri_merkezi"]
        comparison_results = {}
        
        for dataset in datasets:
            print(f"\n📊 {dataset.upper()} baseline karşılaştırma:")
            config, input_data = self.load_test_data(dataset)
            
            # CP-SAT sonucu
            cp_sat_result = self.run_single_optimization(config, input_data, f"{dataset}_cpsat")
            
            # Random assignment baseline
            random_result = self.run_random_assignment(input_data)
            
            # Greedy assignment baseline  
            greedy_result = self.run_greedy_assignment(input_data)
            
            comparison = {
                'cp_sat': cp_sat_result,
                'random': random_result,
                'greedy': greedy_result
            }
            
            # Karşılaştırma raporla
            if cp_sat_result['success']:
                print(f"  CP-SAT: {cp_sat_result['total_time']:.2f}s, obj: {cp_sat_result['objective_value']:.1f}")
                if random_result['success']:
                    improvement = abs(cp_sat_result['objective_value']) - abs(random_result['objective_value'])
                    print(f"  Random: {random_result['total_time']:.2f}s, obj: {random_result['objective_value']:.1f}")
                    print(f"  Improvement vs Random: {improvement:.1f} ({improvement/abs(random_result['objective_value'])*100:.1f}%)")
                
                if greedy_result['success']:
                    improvement = abs(cp_sat_result['objective_value']) - abs(greedy_result['objective_value'])
                    print(f"  Greedy: {greedy_result['total_time']:.2f}s, obj: {greedy_result['objective_value']:.1f}")
                    print(f"  Improvement vs Greedy: {improvement:.1f} ({improvement/abs(greedy_result['objective_value'])*100:.1f}%)")
            
            comparison_results[dataset] = comparison
        
        self.results['baseline_comparison'] = comparison_results
        return comparison_results
    
    def run_random_assignment(self, input_data):
        """Random atama baseline"""
        try:
            start_time = time.time()
            
            employees = input_data['employees']
            shifts = input_data['shifts']
            
            # Random atamaları yap
            assignments = []
            for shift in shifts:
                # Her vardiya için random çalışan seç
                available_employees = random.sample(employees, min(len(employees), 2))
                for emp in available_employees:
                    assignments.append({
                        'employee_id': emp['employee_id'],
                        'shift_id': shift['shift_id']
                    })
            
            total_time = time.time() - start_time
            
            # Basit objective hesapla (negatif = tercih puanı yok)
            objective_value = -len(assignments) * 2  # Penalty for assignments
            
            return {
                'status': 'RANDOM',
                'total_time': total_time,
                'assignment_count': len(assignments),
                'objective_value': objective_value,
                'success': True
            }
        except Exception as e:
            return {'status': 'ERROR', 'error': str(e), 'success': False}
    
    def run_greedy_assignment(self, input_data):
        """Greedy atama baseline"""
        try:
            start_time = time.time()
            
            employees = input_data['employees']
            shifts = input_data['shifts']
            preferences = input_data.get('preferences', [])
            
            # Tercih haritası oluştur
            pref_map = {}
            for pref in preferences:
                key = (pref['employee_id'], pref['shift_id'])
                pref_map[key] = pref.get('preference_score', 0)
            
            # Greedy: En yüksek tercihleri önce ata
            assignments = []
            assigned_employees = set()
            assigned_shifts = set()
            
            # Tercihleri puana göre sırala
            preference_list = []
            for emp in employees:
                for shift in shifts:
                    key = (emp['employee_id'], shift['shift_id'])
                    score = pref_map.get(key, 0)
                    preference_list.append((score, emp['employee_id'], shift['shift_id']))
            
            preference_list.sort(reverse=True)  # En yüksek puan önce
            
            # Greedy atama yap
            for score, emp_id, shift_id in preference_list:
                if emp_id not in assigned_employees and shift_id not in assigned_shifts:
                    assignments.append({
                        'employee_id': emp_id,
                        'shift_id': shift_id
                    })
                    assigned_employees.add(emp_id)
                    assigned_shifts.add(shift_id)
            
            total_time = time.time() - start_time
            
            # Objective hesapla
            total_preference_score = sum(pref_map.get((a['employee_id'], a['shift_id']), 0) 
                                       for a in assignments)
            objective_value = -total_preference_score  # Negatif çünkü maksimizasyon
            
            return {
                'status': 'GREEDY',
                'total_time': total_time,
                'assignment_count': len(assignments),
                'objective_value': objective_value,
                'success': True
            }
        except Exception as e:
            return {'status': 'ERROR', 'error': str(e), 'success': False}
    
    def run_comprehensive_test(self):
        """Tüm testleri çalıştır"""
        print("🚀 Kapsamlı Akademik Performans Testi Başlıyor...\n")
        
        # 1. Ölçeklenebilirlik testi
        self.run_scalability_test()
        
        # 2. Tekrarlanabilirlik testi
        self.run_repeatability_test(runs=5)  # 5 kez hızlı test için
        
        # 3. Baseline karşılaştırma
        self.run_baseline_comparison()
        
        # Sonuçları kaydet
        with open('comprehensive_performance_results.json', 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=2, ensure_ascii=False)
        
        print("\n📄 Kapsamlı sonuçlar 'comprehensive_performance_results.json' dosyasına kaydedildi.")
        
        # Özet rapor
        self.generate_summary_report()
        
        return self.results
    
    def generate_summary_report(self):
        """Özet rapor oluştur"""
        print("\n" + "="*60)
        print("📋 KAPSAMLI PERFORMANS TESTİ ÖZETİ")
        print("="*60)
        
        # Ölçeklenebilirlik özeti
        if 'scalability' in self.results:
            print("\n🔍 ÖLÇEKLENEBİLİRLİK:")
            for dataset, results in self.results['scalability'].items():
                print(f"\n  {dataset.upper()}:")
                for result in results:
                    if result['success']:
                        scale = result['scale_factor']
                        emp_count = result['num_employees']
                        shift_count = result['num_shifts']
                        time_taken = result['total_time']
                        print(f"    Scale {scale:.1f}: {emp_count}emp/{shift_count}shifts -> {time_taken:.2f}s")
        
        # Tekrarlanabilirlik özeti
        if 'repeatability' in self.results:
            print("\n📈 TEKRARLANABİLİRLİK:")
            for dataset, stats in self.results['repeatability'].items():
                if stats['success_rate'] > 0:
                    print(f"\n  {dataset.upper()}:")
                    print(f"    Başarı Oranı: {stats['success_rate']:.1%}")
                    print(f"    Ortalama Süre: {stats['time_mean']:.3f}±{stats['time_std']:.3f}s")
                    print(f"    Süre Aralığı: {stats['time_min']:.3f}s - {stats['time_max']:.3f}s")
        
        # Baseline karşılaştırma özeti
        if 'baseline_comparison' in self.results:
            print("\n⚖️  BASELINE KARŞILAŞTIRMA:")
            for dataset, comparison in self.results['baseline_comparison'].items():
                print(f"\n  {dataset.upper()}:")
                cp_sat = comparison['cp_sat']
                random_baseline = comparison['random']
                greedy_baseline = comparison['greedy']
                
                if cp_sat['success']:
                    print(f"    CP-SAT: {cp_sat['total_time']:.2f}s, obj: {cp_sat['objective_value']:.1f}")
                    
                    if random_baseline['success']:
                        improvement = (abs(random_baseline['objective_value']) - abs(cp_sat['objective_value'])) / abs(random_baseline['objective_value']) * 100
                        print(f"    vs Random: {improvement:.1f}% daha iyi")
                    
                    if greedy_baseline['success']:
                        improvement = (abs(greedy_baseline['objective_value']) - abs(cp_sat['objective_value'])) / abs(greedy_baseline['objective_value']) * 100
                        print(f"    vs Greedy: {improvement:.1f}% daha iyi")

if __name__ == "__main__":
    test_suite = ComprehensivePerformanceTest()
    test_suite.run_comprehensive_test() 