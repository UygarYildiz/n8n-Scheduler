"""
CP-SAT Model Oluşturucu

Bu modül, konfigürasyon ve girdi verilerine göre dinamik olarak CP-SAT modeli oluşturur.
"""

from ortools.sat.python import cp_model
import time
import logging
import fnmatch
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime, timedelta, date, time as dt_time

logger = logging.getLogger(__name__)

class ShiftSchedulingModelBuilder:
    """
    Vardiya çizelgeleme problemi için CP-SAT modeli oluşturan sınıf.
    Konfigürasyon dosyasından okunan parametrelere göre dinamik olarak kısıt ekler.
    """

    def __init__(self, config: Dict[str, Any], input_data: Dict[str, Any]):
        """
        Args:
            config: Konfigürasyon dosyasından okunan parametreler
            input_data: Optimizasyon için girdi verileri (çalışanlar, vardiyalar, vb.)
                      (main.py'den dict olarak gelir, Pydantic modelleri buraya gelmez)
        """
        self.config = config
        self.input_data = input_data
        self.model = cp_model.CpModel()
        self.solver = cp_model.CpSolver()

        # Vardiya bilgilerini daha kolay erişim için işle (örneğin ID ile arama için)
        self.shifts_dict = {s['shift_id']: s for s in self.input_data.get('shifts', [])}

        # Çözücü parametrelerini ayarla
        solver_time_limit = config.get('optimization_core', {}).get('solver_time_limit_seconds', 30.0)
        self.solver.parameters.max_time_in_seconds = float(solver_time_limit)
        logger.info(f"Çözücü zaman limiti {self.solver.parameters.max_time_in_seconds} saniye olarak ayarlandı.")

        # Değişkenleri ve kısıtları saklamak için sözlükler
        self.assignment_vars = {}  # (employee_id, shift_id) -> BoolVar
        self.employee_shift_counts = {}  # employee_id -> IntVar (toplam atanan vardiya sayısı)
        self.shift_employee_counts = {}  # shift_id -> IntVar (vardiyaya atanan çalışan sayısı)

    def build_model(self) -> cp_model.CpModel:
        """
        Konfigürasyon ve girdi verilerine göre CP-SAT modelini oluşturur.

        Returns:
            Oluşturulan CP-SAT modeli
        """
        logger.info("CP-SAT modeli oluşturuluyor...")
        # 1. Temel atama değişkenlerini oluştur
        self._create_assignment_variables()

        # 2. Temel kısıtları ekle
        self._add_basic_constraints()

        # 3. Konfigürasyondan okunan dinamik kısıtları ekle
        self._add_dynamic_constraints_from_config()

        # 4. Hedef fonksiyonunu tanımla
        self._define_objective_function()

        logger.info("CP-SAT modeli oluşturuldu.")
        return self.model

    def solve_model(self) -> Tuple[str, Dict[str, Any]]:
        """
        Oluşturulan modeli çözer ve sonuçları döndürür.

        Returns:
            Tuple[str, Dict]: Çözüm durumu ve sonuçlar
        """
        logger.info(f"Model çözülüyor (zaman limiti: {self.solver.parameters.max_time_in_seconds}s)...")
        start_time = time.time()
        status = self.solver.Solve(self.model)
        end_time = time.time()

        processing_time = end_time - start_time
        logger.info(f"Model çözme işlemi {processing_time:.2f} saniye sürdü.")

        # Çözüm durumunu belirle
        status_map = {
            cp_model.OPTIMAL: ("OPTIMAL", "Optimal çözüm bulundu."),
            cp_model.FEASIBLE: ("FEASIBLE", "Uygun bir çözüm bulundu (optimal olmayabilir)."),
            cp_model.INFEASIBLE: ("INFEASIBLE", "Problem çözülemez (kısıtlar karşılanamıyor)."),
            cp_model.MODEL_INVALID: ("MODEL_INVALID", "Model geçersiz."),
            cp_model.UNKNOWN: ("UNKNOWN", "Çözüm durumu bilinmiyor (muhtemelen zaman aşımı).")
        }
        status_str, status_message = status_map.get(status, ("ERROR", "Bilinmeyen çözüm durumu."))

        logger.info(f"Çözüm durumu: {status_str} - {status_message}")

        # Sonuçları hazırla
        solution = None
        objective_value = None
        calculated_metrics = None

        if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
            # Atama sonuçlarını topla
            assignments = []
            assigned_count = 0
            for (employee_id, shift_id), var in self.assignment_vars.items():
                if self.solver.Value(var) == 1:  # Eğer atama yapıldıysa
                    assignments.append({
                        "employee_id": employee_id,
                        "shift_id": shift_id
                    })
                    assigned_count += 1
            logger.info(f"Toplam {assigned_count} atama yapıldı.")

            # Hedef fonksiyon değerini al (eğer tanımlandıysa)
            if self.model.HasObjective():
                objective_value = self.solver.ObjectiveValue()
                logger.info(f"Hedef fonksiyon değeri: {objective_value}")
            else:
                 logger.info("Modelde hedef fonksiyonu tanımlanmamış.")

            solution = {
                "assignments": assignments
            }

            # Metrikleri Hesapla
            try:
                # --- Understaffing/Overstaffing Hesaplaması ---
                total_understaffing = 0
                total_overstaffing = 0
                for shift_id, assigned_var in self.shift_employee_counts.items():
                    shift_info = self.shifts_dict.get(shift_id)
                    if not shift_info:
                        logger.warning(f"Metrik hesaplama için vardiya bilgisi bulunamadı: {shift_id}")
                        continue

                    required_staff = int(shift_info.get('required_staff', 1)) # Varsayılan 1
                    if required_staff < 0: continue # Geçersiz veri

                    assigned_staff = self.solver.Value(assigned_var)

                    understaffing = max(0, required_staff - assigned_staff)
                    overstaffing = max(0, assigned_staff - required_staff)

                    total_understaffing += understaffing
                    total_overstaffing += overstaffing

                # --- Tercih Metrikleri Hesaplaması ---
                positive_prefs_met = 0
                negative_prefs_assigned = 0
                total_pref_score_achieved = 0
                # Tercih verisini kolay erişim için işle (employee_id, shift_id) -> score
                prefs_map = {(p.get('employee_id'), p.get('shift_id')): p.get('preference_score', 0)
                             for p in self.input_data.get('preferences', [])
                             if p.get('employee_id') and p.get('shift_id')}

                for (employee_id, shift_id), var in self.assignment_vars.items():
                    if self.solver.Value(var) == 1:
                        pref_score = prefs_map.get((employee_id, shift_id), 0) # Eşleşen tercih yoksa skor 0
                        if pref_score > 0:
                            positive_prefs_met += 1
                        elif pref_score < 0:
                            negative_prefs_assigned += 1
                        total_pref_score_achieved += pref_score # Atanan tüm vardiyaların skorlarını topla

                # --- Minimum Personel Karşılama Oranı Hesaplaması ---
                total_shifts = len(self.shifts_dict)
                shifts_meeting_min_staff = 0

                for shift_id, assigned_var in self.shift_employee_counts.items():
                    shift_info = self.shifts_dict.get(shift_id)
                    if not shift_info:
                        continue

                    required_staff = int(shift_info.get('required_staff', 1))
                    if required_staff <= 0:
                        continue

                    assigned_staff = self.solver.Value(assigned_var)
                    if assigned_staff >= required_staff:
                        shifts_meeting_min_staff += 1

                min_staffing_coverage_ratio = shifts_meeting_min_staff / total_shifts if total_shifts > 0 else 1.0

                # --- Yetenek Gereksinimi Karşılama Oranı Hesaplaması ---
                skill_requirements = self.config.get('rules', {}).get('skill_requirements', [])
                total_skill_requirements = 0
                met_skill_requirements = 0

                for rule in skill_requirements:
                    shift_pattern = rule.get('shift_pattern', '*')
                    skill_name = rule.get('skill')
                    min_count = rule.get('min_count', 0)

                    if not skill_name or min_count <= 0:
                        continue

                    # Kural ile eşleşen vardiyaları bul
                    import fnmatch
                    matching_shift_ids = [s_id for s_id, s_info in self.shifts_dict.items()
                                         if fnmatch.fnmatch(s_info.get('name', ''), shift_pattern)]

                    for shift_id in matching_shift_ids:
                        total_skill_requirements += 1

                        # Bu vardiyaya atanan ve bu yeteneğe sahip çalışanları bul
                        skilled_employees_assigned = 0
                        for (emp_id, s_id), var in self.assignment_vars.items():
                            if s_id != shift_id or self.solver.Value(var) != 1:
                                continue

                            # Çalışanın bu yeteneğe sahip olup olmadığını kontrol et
                            has_skill = False
                            for skill_data in self.input_data.get('skills', []):
                                if skill_data.get('employee_id') == emp_id and skill_data.get('skill') == skill_name:
                                    has_skill = True
                                    break

                            if has_skill:
                                skilled_employees_assigned += 1

                        if skilled_employees_assigned >= min_count:
                            met_skill_requirements += 1

                skill_coverage_ratio = met_skill_requirements / total_skill_requirements if total_skill_requirements > 0 else 1.0

                # --- İş Yükü Dağılımı Adaleti Hesaplaması ---
                workload_by_employee = {}
                for employee_id, count_var in self.employee_shift_counts.items():
                    workload_by_employee[employee_id] = self.solver.Value(count_var)

                # Standart sapma hesapla
                if workload_by_employee:
                    workload_values = list(workload_by_employee.values())
                    mean_workload = sum(workload_values) / len(workload_values)
                    variance = sum((x - mean_workload) ** 2 for x in workload_values) / len(workload_values)
                    workload_distribution_std_dev = variance ** 0.5
                else:
                    workload_distribution_std_dev = 0.0

                # --- "Kötü" Vardiya Dağılımı Adaleti Hesaplaması ---
                # "Kötü" vardiyaları tanımla (örn: gece vardiyaları, hafta sonu vardiyaları)
                bad_shifts = []
                for shift_id, shift_info in self.shifts_dict.items():
                    shift_name = shift_info.get('name', '').lower()
                    start_time = shift_info.get('start_time', '')

                    # Gece vardiyaları
                    is_night_shift = False
                    if 'gece' in shift_name:
                        is_night_shift = True
                    elif start_time:
                        # start_time bir string veya datetime.time nesnesi olabilir
                        if isinstance(start_time, str):
                            # String ise startswith kullan
                            if start_time.startswith(('20:', '21:', '22:', '23:', '00:', '01:', '02:', '03:', '04:', '05:')):
                                is_night_shift = True
                        elif isinstance(start_time, dt_time):
                            # datetime.time nesnesi ise saat değerini kontrol et
                            if start_time.hour >= 20 or start_time.hour <= 5:
                                is_night_shift = True

                    if is_night_shift:
                        bad_shifts.append(shift_id)

                    # Hafta sonu vardiyaları
                    date_str = shift_info.get('date')
                    if date_str:
                        try:
                            shift_date = date.fromisoformat(str(date_str))
                            if shift_date.weekday() >= 5:  # 5=Cumartesi, 6=Pazar
                                bad_shifts.append(shift_id)
                        except (ValueError, TypeError):
                            pass

                # Her çalışan için "kötü" vardiya sayısını hesapla
                bad_shifts_by_employee = {emp_id: 0 for emp_id in self.employee_shift_counts.keys()}

                for (emp_id, shift_id), var in self.assignment_vars.items():
                    if self.solver.Value(var) == 1 and shift_id in bad_shifts:
                        bad_shifts_by_employee[emp_id] += 1

                # Standart sapma hesapla
                if bad_shifts_by_employee:
                    bad_shift_values = list(bad_shifts_by_employee.values())
                    mean_bad_shifts = sum(bad_shift_values) / len(bad_shift_values)
                    variance = sum((x - mean_bad_shifts) ** 2 for x in bad_shift_values) / len(bad_shift_values)
                    bad_shift_distribution_std_dev = variance ** 0.5
                else:
                    bad_shift_distribution_std_dev = 0.0

                # --- Sistem Esnekliği ve Uyarlanabilirlik Metrikleri Hesaplaması ---
                # Kural sayısını hesapla
                rule_count = 0

                # min_staffing_requirements kuralları
                min_staffing_rules = self.config.get('rules', {}).get('min_staffing_requirements', [])
                rule_count += len(min_staffing_rules)

                # skill_requirements kuralları
                skill_rules = self.config.get('rules', {}).get('skill_requirements', [])
                rule_count += len(skill_rules)

                # Diğer kurallar
                if 'max_consecutive_shifts' in self.config.get('rules', {}):
                    rule_count += 1
                if 'min_rest_time_hours' in self.config.get('rules', {}) or 'min_rest_time_minutes' in self.config.get('rules', {}):
                    rule_count += 1

                # Konfigürasyon karmaşıklık skoru hesapla
                # (0-10 arası bir skor, 10 en karmaşık)
                config_complexity = 0

                # Kural sayısına göre karmaşıklık
                if rule_count <= 2:
                    config_complexity += 2
                elif rule_count <= 5:
                    config_complexity += 4
                elif rule_count <= 10:
                    config_complexity += 6
                else:
                    config_complexity += 8

                # Kural türlerine göre karmaşıklık
                if 'min_staffing_requirements' in self.config.get('rules', {}):
                    config_complexity += 1
                if 'skill_requirements' in self.config.get('rules', {}):
                    config_complexity += 1
                if 'min_rest_time_hours' in self.config.get('rules', {}) or 'min_rest_time_minutes' in self.config.get('rules', {}):
                    config_complexity += 1
                if 'max_consecutive_shifts' in self.config.get('rules', {}):
                    config_complexity += 1

                # Maksimum 10 olacak şekilde normalize et
                config_complexity_score = min(10, config_complexity)

                # Sistem uyarlanabilirlik skoru hesapla
                # (0-10 arası bir skor, 10 en uyarlanabilir)
                # Uyarlanabilirlik, konfigürasyon karmaşıklığı ile ters orantılıdır
                # Ancak sıfır kuralın olması da düşük uyarlanabilirlik anlamına gelir
                if rule_count == 0:
                    system_adaptability_score = 3.0  # Çok az kural = düşük uyarlanabilirlik
                else:
                    # Karmaşıklık arttıkça uyarlanabilirlik azalır
                    system_adaptability_score = 10.0 - (config_complexity_score * 0.5)

                    # Ancak belirli bir kural sayısı uyarlanabilirliği artırır
                    if 2 <= rule_count <= 8:
                        system_adaptability_score += 2.0

                    # 0-10 aralığında sınırla
                    system_adaptability_score = max(0, min(10, system_adaptability_score))

                # Tüm metrikleri birleştir
                calculated_metrics = {
                    "total_understaffing": total_understaffing,
                    "total_overstaffing": total_overstaffing,
                    "min_staffing_coverage_ratio": min_staffing_coverage_ratio,
                    "skill_coverage_ratio": skill_coverage_ratio,
                    "positive_preferences_met_count": positive_prefs_met,
                    "negative_preferences_assigned_count": negative_prefs_assigned,
                    "total_preference_score_achieved": total_pref_score_achieved,
                    "workload_distribution_std_dev": workload_distribution_std_dev,
                    "bad_shift_distribution_std_dev": bad_shift_distribution_std_dev,
                    "system_adaptability_score": system_adaptability_score,
                    "config_complexity_score": config_complexity_score,
                    "rule_count": rule_count
                }

                # Log mesajını da güncelleyelim
                metric_log_parts = [
                    f"Understaffing={total_understaffing}",
                    f"Overstaffing={total_overstaffing}",
                    f"Min Personel Karşılama Oranı={min_staffing_coverage_ratio:.2f}",
                    f"Yetenek Karşılama Oranı={skill_coverage_ratio:.2f}",
                    f"Pozitif Tercih Sayısı={positive_prefs_met}",
                    f"Negatif Tercih Sayısı={negative_prefs_assigned}",
                    f"Toplam Tercih Skoru={total_pref_score_achieved}",
                    f"İş Yükü Dağılımı StdDev={workload_distribution_std_dev:.2f}",
                    f"Kötü Vardiya Dağılımı StdDev={bad_shift_distribution_std_dev:.2f}",
                    f"Sistem Uyarlanabilirlik Skoru={system_adaptability_score:.2f}",
                    f"Konfigürasyon Karmaşıklık Skoru={config_complexity_score:.2f}",
                    f"Kural Sayısı={rule_count}"
                ]
                logger.info(f"Metrik hesaplama tamamlandı: {', '.join(part for part in metric_log_parts if part is not None)}")

            except Exception as e:
                logger.error(f"Metrik hesaplaması sırasında hata: {e}", exc_info=True)
                calculated_metrics = None # Hata durumunda boş bırak

        result = {
            "status": status_str,
            "solver_status_message": status_message,
            "processing_time_seconds": processing_time,
            "objective_value": objective_value,
            "solution": solution,
            "metrics": calculated_metrics
        }

        return status_str, result

    def _create_assignment_variables(self):
        """Temel atama değişkenlerini oluşturur."""
        logger.info("Atama değişkenleri oluşturuluyor...")
        employees = self.input_data.get('employees', [])
        shifts = self.input_data.get('shifts', [])

        if not employees or not shifts:
            logger.warning("Çalışan veya vardiya listesi boş, atama değişkeni oluşturulmayacak.")
            return

        # Her çalışan-vardiya çifti için bir boolean değişken oluştur
        for employee in employees:
            employee_id = employee.get('employee_id')
            if not employee_id:
                logger.warning(f"Geçersiz çalışan verisi (ID eksik): {employee}")
                continue

            for shift in shifts:
                shift_id = shift.get('shift_id')
                if not shift_id:
                    logger.warning(f"Geçersiz vardiya verisi (ID eksik): {shift}")
                    continue

                # Bu çalışanın bu vardiyaya atanıp atanmayacağını belirten boolean değişken
                var_name = f"assign_{employee_id}_{shift_id}"
                self.assignment_vars[(employee_id, shift_id)] = self.model.NewBoolVar(var_name)

        logger.info(f"{len(self.assignment_vars)} adet atama değişkeni oluşturuldu.")

        # Her çalışan için toplam atanan vardiya sayısını tutan değişkenler
        for employee in employees:
            employee_id = employee.get('employee_id')
            if not employee_id: continue
            employee_vars = [var for (emp_id, _), var in self.assignment_vars.items() if emp_id == employee_id]

            # Çalışanın toplam vardiya sayısı
            self.employee_shift_counts[employee_id] = self.model.NewIntVar(
                0, len(shifts), f"total_shifts_{employee_id}")

            # Toplam vardiya sayısı = atama değişkenlerinin toplamı
            self.model.Add(self.employee_shift_counts[employee_id] == sum(employee_vars))

        # Her vardiya için toplam atanan çalışan sayısını tutan değişkenler
        for shift in shifts:
            shift_id = shift.get('shift_id')
            if not shift_id: continue
            shift_vars = [var for (_, s_id), var in self.assignment_vars.items() if s_id == shift_id]

            # Vardiyaya atanan toplam çalışan sayısı
            self.shift_employee_counts[shift_id] = self.model.NewIntVar(
                0, len(employees), f"total_employees_{shift_id}")

            # Toplam çalışan sayısı = atama değişkenlerinin toplamı
            self.model.Add(self.shift_employee_counts[shift_id] == sum(shift_vars))

        logger.info("Çalışan ve vardiya toplam sayı değişkenleri oluşturuldu.")

    def _add_basic_constraints(self):
        """Temel kısıtları ekler."""
        logger.info("Temel kısıtlar ekleniyor (uygunluk, çakışma)...")
        employees = self.input_data.get('employees', [])
        shifts = self.input_data.get('shifts', [])
        availability = self.input_data.get('availability', [])

        if not employees or not shifts:
            logger.warning("Çalışan veya vardiya yok, temel kısıtlar eklenemiyor.")
            return

        # 1. Uygunluk kısıtları: Çalışan müsait değilse atama yapılamaz
        if availability:
            # Uygunluk verilerini işle (dict olarak tutmak daha verimli)
            availability_map = {}
            for avail in availability:
                emp_id = avail.get('employee_id')
                # Tarihleri str olarak alıp date objesine çevirelim (Pydantic bunu yapmalıydı ama dict geliyor)
                date_str = avail.get('date')
                if not emp_id or not date_str:
                    logger.warning(f"Geçersiz uygunluk verisi: {avail}")
                    continue
                try:
                    avail_date = date.fromisoformat(str(date_str))
                except (ValueError, TypeError):
                     logger.warning(f"Geçersiz tarih formatı ({date_str}), uygunluk kaydı atlanıyor: {avail}")
                     continue

                is_available = avail.get('is_available', True) # Artık bool

                if emp_id not in availability_map:
                    availability_map[emp_id] = {}

                availability_map[emp_id][avail_date] = is_available
            logger.info(f"{len(availability)} uygunluk kaydı işlendi.")

            # Uygunluk kısıtlarını ekle
            applied_avail_constraints = 0
            for employee in employees:
                employee_id = employee.get('employee_id')
                if not employee_id or employee_id not in availability_map:
                    continue

                for shift in shifts:
                    shift_id = shift.get('shift_id')
                    if not shift_id:
                         continue

                    # Vardiya tarihini al
                    shift_date_str = shift.get('date')
                    if not shift_date_str:
                         continue # Tarihsiz vardiya atlanıyor
                    try:
                         shift_date_obj = date.fromisoformat(str(shift_date_str))
                    except (ValueError, TypeError):
                         continue # Geçersiz formatlı vardiya atlanıyor

                    # Eğer çalışan bu tarihte uygun değilse (kayıt varsa ve False ise), atama yapılamaz
                    if shift_date_obj in availability_map[employee_id] and not availability_map[employee_id][shift_date_obj]:
                        assignment_var = self.assignment_vars.get((employee_id, shift_id))
                        if assignment_var is not None:  # None kontrolü ile değiştirildi
                            self.model.Add(assignment_var == 0)
                            applied_avail_constraints += 1
            logger.info(f"{applied_avail_constraints} adet uygunluk kısıtı eklendi.")

        # 2. Çakışma kısıtları: Aynı çalışan aynı gün içinde çakışan vardiyalara atanamaz
        # Not: Bu, aynı gün içindeki farklı vardiyaları engeller. Aynı anda başlayanları değil.
        # Daha hassas çakışma kontrolü için start/end time kullanılabilir.
        shifts_by_date = {}
        for shift in shifts:
            shift_id = shift.get('shift_id')
            shift_date_str = shift.get('date')
            if not shift_id or not shift_date_str:
                 continue
            try:
                 shift_date_obj = date.fromisoformat(str(shift_date_str))
            except (ValueError, TypeError):
                 continue

            if shift_date_obj not in shifts_by_date:
                shifts_by_date[shift_date_obj] = []

            shifts_by_date[shift_date_obj].append(shift_id)

        applied_overlap_constraints = 0
        for employee in employees:
            employee_id = employee.get('employee_id')
            if not employee_id: continue

            for shift_date_obj, shift_ids_on_date in shifts_by_date.items():
                # Bu tarihteki vardiyalara atanma değişkenleri
                date_vars = []
                for s_id in shift_ids_on_date:
                    var = self.assignment_vars.get((employee_id, s_id))
                    if var is not None:  # None kontrolü ile değiştirildi
                        date_vars.append(var)

                # Toplamları en fazla 1 olmalı (aynı gün en fazla bir vardiya)
                if len(date_vars) > 1:
                    self.model.Add(sum(date_vars) <= 1)
                    applied_overlap_constraints += 1
        logger.info(f"{applied_overlap_constraints} adet günlük çakışma kısıtı eklendi.")

    def _add_dynamic_constraints_from_config(self):
        """Konfigürasyondan okunan dinamik kısıtları ekler."""
        rules = self.config.get('rules')
        if not rules:
            logger.info("Konfigürasyonda 'rules' bulunamadı, dinamik kısıt eklenmiyor.")
            return
        logger.info(f"Dinamik kısıtlar konfigürasyondan ekleniyor: {list(rules.keys())}")

        # 1. Minimum personel gereksinimleri
        if 'min_staffing_requirements' in rules:
            self._add_min_staffing_constraints(rules['min_staffing_requirements'])

        # 2. Maksimum ardışık vardiya kısıtı
        if 'max_consecutive_shifts' in rules:
            self._add_max_consecutive_shifts_constraint(rules['max_consecutive_shifts'])

        # 3. Minimum dinlenme süresi kısıtı (İyileştirildi)
        if 'min_rest_time_hours' in rules:
            self._add_min_rest_time_constraint(rules['min_rest_time_hours'])
        elif 'min_rest_time_minutes' in rules: # Dakika cinsinden de destekleyelim
            self._add_min_rest_time_constraint(None, rules['min_rest_time_minutes'])

        # 4. Yetenek gereksinimleri
        if 'skill_requirements' in rules:
            self._add_skill_requirements_constraints(rules['skill_requirements'])

        # TODO: Diğer potansiyel kurallar buraya eklenebilir
        # Örn: Maksimum haftalık çalışma saati, belirli vardiya desenlerinden kaçınma vb.

    def _add_min_staffing_constraints(self, min_staffing_rules):
        """Minimum personel gereksinimi kısıtlarını ekler."""
        logger.info(f"Minimum personel ({len(min_staffing_rules)} kural) kısıtları ekleniyor...")
        employees = self.input_data.get('employees', [])
        shifts = self.input_data.get('shifts', [])
        # skills verisi burada doğrudan kullanılmıyor, _add_skill_requirements_constraints içinde kullanılıyor

        # Çalışanların rollerini vb. hazırla (performans için ön işleme)
        employee_details = {emp.get('employee_id'): emp for emp in employees if emp.get('employee_id')}

        total_constraints_added = 0
        total_soft_constraints = 0

        # Her kural için kısıtları ekle
        for i, rule in enumerate(min_staffing_rules):
            shift_pattern = rule.get('shift_pattern', '*')
            role = rule.get('role')
            department = rule.get('department')
            specialty = rule.get('specialty')
            min_count = rule.get('min_count', 0)
            penalty = rule.get('penalty_if_violated') # Yumuşak kısıt için ceza

            if min_count <= 0:
                continue # Geçersiz kural

            # Kural ile eşleşen vardiyaları bul
            matching_shift_ids = [s['shift_id'] for s in shifts
                                  if s.get('shift_id') and
                                  fnmatch.fnmatch(s.get('name', ''), shift_pattern)]

            if not matching_shift_ids:
                logger.warning(f"Min personel kuralı #{i} için eşleşen vardiya bulunamadı (pattern: {shift_pattern})")
                continue

            # Her eşleşen vardiya için kısıt ekle
            for shift_id in matching_shift_ids:
                # Bu vardiyaya atanabilecek uygun çalışanları bul
                eligible_employee_ids = []
                for emp_id, emp_details in employee_details.items():
                    # Rol, departman veya uzmanlık kısıtlarını kontrol et
                    role_match = role is None or emp_details.get('role') == role
                    dept_match = department is None or emp_details.get('department') == department
                    spec_match = specialty is None or emp_details.get('specialty') == specialty

                    if role_match and dept_match and spec_match:
                        eligible_employee_ids.append(emp_id)

                if not eligible_employee_ids:
                    # logger.warning(f"Vardiya {shift_id} için uygun çalışan bulunamadı (kural: {rule})")
                    # Uygun çalışan yoksa ve min_count > 0 ise bu zaten çözümsüzlüğe yol açabilir.
                    # Eğer sert kısıtsa Add(0 >= min_count) ekleyebiliriz ama infeasible yapar.
                    # Şimdilik atlayalım veya loglayalım.
                    if min_count > 0 and penalty is None:
                         logger.error(f"SERT KISIT İHLALİ MÜMKÜN: Vardiya {shift_id} için min {min_count} personel gerekli ama kurala ({rule}) uygun hiç çalışan yok!")
                    continue

                # Bu vardiyaya atanan uygun çalışanların sayısını hesapla
                assignment_vars_for_shift = [self.assignment_vars[(emp_id, shift_id)]
                                           for emp_id in eligible_employee_ids
                                           if (emp_id, shift_id) in self.assignment_vars]

                if assignment_vars_for_shift:
                    # Toplam atanan uygun çalışan sayısı
                    total_assigned = sum(assignment_vars_for_shift)

                    # Minimum sayı kısıtını ekle
                    if penalty is None or penalty <= 0:  # Sert kısıt (veya geçersiz ceza)
                        self.model.Add(total_assigned >= min_count)
                        total_constraints_added += 1
                    else:  # Yumuşak kısıt
                        # Kısıtın ne kadar ihlal edildiğini gösteren değişken (0 veya pozitif)
                        # shortfall = max(0, min_count - total_assigned)
                        shortfall = self.model.NewIntVar(0, min_count, f"shortfall_{shift_id}_rule{i}")
                        # total_assigned + shortfall >= min_count
                        self.model.Add(total_assigned + shortfall >= min_count)
                        # Hedef fonksiyonuna ceza ekle (minimizasyon olduğu için pozitif ceza)
                        self._add_objective_term(penalty * shortfall)
                        total_soft_constraints += 1
                        total_constraints_added += 1 # Teknik olarak bir kısıt eklendi

        logger.info(f"Minimum personel: {total_constraints_added} kısıt eklendi ({total_soft_constraints} tanesi yumuşak)." )

    def _add_max_consecutive_shifts_constraint(self, max_consecutive):
        """Maksimum ardışık vardiya kısıtını ekler (gün bazında)."""
        logger.info(f"Maksimum {max_consecutive} ardışık gün çalışma kısıtı ekleniyor...")
        employees = self.input_data.get('employees', [])
        shifts = self.input_data.get('shifts', [])

        if max_consecutive <= 0:
             logger.warning("max_consecutive_shifts <= 0, kısıt eklenmiyor.")
             return

        # Vardiyaları tarihe göre grupla ve sırala
        shifts_by_date = {}
        valid_dates = set()
        for shift in shifts:
            shift_id = shift.get('shift_id')
            date_str = shift.get('date')
            if not shift_id or not date_str: continue
            try:
                shift_date = date.fromisoformat(str(date_str))
                valid_dates.add(shift_date)
                if shift_date not in shifts_by_date:
                    shifts_by_date[shift_date] = []
                shifts_by_date[shift_date].append(shift_id)
            except (ValueError, TypeError):
                continue # Geçersiz tarihli vardiyalar atlanıyor

        sorted_dates = sorted(list(valid_dates))

        if len(sorted_dates) <= max_consecutive:
            logger.info("Tarih sayısı <= max_consecutive, ardışık gün kısıtı uygulanmayacak.")
            return # Yeterli gün yoksa kısıta gerek yok

        total_constraints_added = 0
        for employee in employees:
            employee_id = employee.get('employee_id')
            if not employee_id: continue

            # Her olası ardışık tarih penceresi için kontrol et
            for i in range(len(sorted_dates) - max_consecutive):
                # max_consecutive + 1 günlük pencere
                window_dates = sorted_dates[i : i + max_consecutive + 1]

                # Bu penceredeki tüm vardiyalara atanma değişkenleri
                assignments_in_window = []
                for d in window_dates:
                    if d in shifts_by_date:
                        for shift_id in shifts_by_date[d]:
                            var = self.assignment_vars.get((employee_id, shift_id))
                            if var is not None:  # None kontrolü ile değiştirildi
                                assignments_in_window.append(var)

                # Penceredeki toplam atama sayısı max_consecutive'den fazla olmamalı
                if len(assignments_in_window) > 0:  # Boş liste kontrolü
                    self.model.Add(sum(assignments_in_window) <= max_consecutive)
                    total_constraints_added += 1
        logger.info(f"Maksimum ardışık gün: {total_constraints_added} kısıt eklendi.")

    def _add_min_rest_time_constraint(self, min_rest_hours: Optional[float] = None, min_rest_minutes: Optional[int] = None):
        """(İyileştirilmiş) İki vardiya arasında minimum dinlenme süresi kısıtını ekler."""
        if min_rest_hours is None and min_rest_minutes is None:
            return

        if min_rest_hours is not None:
             total_min_rest_minutes = int(min_rest_hours * 60)
        else:
             total_min_rest_minutes = min_rest_minutes

        if total_min_rest_minutes <= 0:
             logger.warning(f"Geçersiz minimum dinlenme süresi ({total_min_rest_minutes} dakika), kısıt eklenmiyor.")
             return

        logger.info(f"Minimum {total_min_rest_minutes} dakika dinlenme süresi kısıtı ekleniyor...")
        employees = self.input_data.get('employees', [])

        # Vardiyaları başlangıç zamanına göre sırala (ön işleme)
        sorted_shifts = []
        for shift_data in self.shifts_dict.values():
            try:
                s_date = date.fromisoformat(str(shift_data.get('date')))
                s_time = dt_time.fromisoformat(str(shift_data.get('start_time')))
                e_time = dt_time.fromisoformat(str(shift_data.get('end_time')))
                start_dt = datetime.combine(s_date, s_time)
                end_dt = datetime.combine(s_date, e_time)
                # Eğer bitiş saati başlangıçtan küçükse, sonraki güne taşmıştır
                if end_dt <= start_dt:
                    end_dt += timedelta(days=1)

                shift_data['_start_datetime'] = start_dt
                shift_data['_end_datetime'] = end_dt
                shift_data['_duration_minutes'] = (end_dt - start_dt).total_seconds() / 60
                sorted_shifts.append(shift_data)
            except (ValueError, TypeError, KeyError) as e:
                logger.warning(f"Dinlenme süresi için geçersiz vardiya verisi ({e}), atlanıyor: {shift_data.get('shift_id')}")
                continue

        sorted_shifts.sort(key=lambda s: s['_start_datetime'])

        total_constraints_added = 0
        for employee in employees:
            employee_id = employee.get('employee_id')
            if not employee_id: continue

            # Her olası vardiya çiftini kontrol et
            for i in range(len(sorted_shifts)):
                shift1_data = sorted_shifts[i]
                shift1_id = shift1_data['shift_id']
                shift1_end_dt = shift1_data['_end_datetime']
                assign1_var = self.assignment_vars.get((employee_id, shift1_id))
                if assign1_var is None: continue  # None kontrolü ile değiştirildi

                for j in range(i + 1, len(sorted_shifts)):
                    shift2_data = sorted_shifts[j]
                    shift2_id = shift2_data['shift_id']
                    shift2_start_dt = shift2_data['_start_datetime']
                    assign2_var = self.assignment_vars.get((employee_id, shift2_id))
                    if assign2_var is None: continue  # None kontrolü ile değiştirildi

                    # İki vardiya arasındaki süre (dakika)
                    time_diff_minutes = (shift2_start_dt - shift1_end_dt).total_seconds() / 60

                    # Eğer dinlenme süresi yetersizse, bu iki vardiyaya aynı anda atanamaz
                    if 0 <= time_diff_minutes < total_min_rest_minutes:
                        # assign1 + assign2 <= 1 (yani ikisi birden 1 olamaz)
                        self.model.Add(assign1_var + assign2_var <= 1)
                        total_constraints_added += 1

                    # Eğer zaman farkı çok büyükse, iç döngüden çıkabiliriz (optimizasyon)
                    # Ancak farklı günlerdeki vardiyaları da yakalamak için devam etmeli
                    # if time_diff_minutes >= total_min_rest_minutes * BÜYÜK_BİR_SAYI: break

        logger.info(f"Minimum dinlenme süresi: {total_constraints_added} kısıt eklendi.")

    def _add_skill_requirements_constraints(self, skill_requirements):
        """Yetenek gereksinimleri kısıtlarını ekler."""
        logger.info(f"Yetenek ({len(skill_requirements)} kural) gereksinim kısıtları ekleniyor...")
        employees = self.input_data.get('employees', [])
        shifts = self.input_data.get('shifts', [])
        skills_data = self.input_data.get('skills', [])

        # Çalışanların yeteneklerini hazırla (dict: emp_id -> set(skills))
        employee_skills_map = {}
        for skill_entry in skills_data:
            emp_id = skill_entry.get('employee_id')
            skill = skill_entry.get('skill')
            if not emp_id or not skill: continue
            if emp_id not in employee_skills_map:
                employee_skills_map[emp_id] = set()
            employee_skills_map[emp_id].add(skill)

        total_constraints_added = 0
        # Her yetenek gereksinimi için kısıtları ekle
        for i, requirement in enumerate(skill_requirements):
            shift_pattern = requirement.get('shift_pattern', '*')
            required_skill = requirement.get('skill')
            min_count = requirement.get('min_count', 1)
            # penalty = requirement.get('penalty_if_violated') # Yetenek için yumuşak kısıt? Şimdilik sert.

            if not required_skill or min_count <= 0:
                logger.warning(f"Geçersiz yetenek kuralı #{i}: {requirement}")
                continue

            # Kural ile eşleşen vardiyaları bul
            matching_shift_ids = [s['shift_id'] for s in shifts
                                  if s.get('shift_id') and
                                  fnmatch.fnmatch(s.get('name', ''), shift_pattern)]

            if not matching_shift_ids:
                logger.warning(f"Yetenek kuralı #{i} ({required_skill}) için eşleşen vardiya bulunamadı (pattern: {shift_pattern})")
                continue

            # Gerekli yeteneğe sahip çalışanları bul
            skilled_employee_ids = {emp_id for emp_id, emp_skills in employee_skills_map.items()
                                    if required_skill in emp_skills}

            if not skilled_employee_ids:
                 logger.error(f"SERT KISIT İHLALİ MÜMKÜN: Kural #{i} için gerekli '{required_skill}' yeteneğine sahip hiç çalışan yok!")
                 # Eşleşen vardiyalara 0 >= min_count ekleyerek çözümsüzlüğü garantileyebiliriz.
                 for shift_id in matching_shift_ids:
                      self.model.Add(0 >= min_count)
                 total_constraints_added += len(matching_shift_ids)
                 continue

            # Her eşleşen vardiya için kısıt ekle
            for shift_id in matching_shift_ids:
                # Bu vardiyaya atanan YETENEKLİ çalışanların sayısını hesapla
                skilled_assignment_vars = [self.assignment_vars[(emp_id, shift_id)]
                                         for emp_id in skilled_employee_ids
                                         if (emp_id, shift_id) in self.assignment_vars]

                if len(skilled_assignment_vars) > 0:  # Boş liste kontrolü
                    # Toplam atanan yetenekli çalışan sayısı
                    total_skilled_assigned = sum(skilled_assignment_vars)

                    # Minimum sayı kısıtını ekle (şimdilik sert)
                    self.model.Add(total_skilled_assigned >= min_count)
                    total_constraints_added += 1
                elif min_count > 0: # Yetenekli çalışan yok ama atanması gerekiyor
                     # Bu durumda vardiyaya kimse atanmasa bile kısıt ihlal edilir.
                     # Modeli infeasible yapmak için 0 >= min_count ekleyebiliriz.
                     logger.warning(f"Vardiya {shift_id} için '{required_skill}' yetenekli çalışan gerekli ({min_count}) ama uygun çalışan yok veya atanmamış.")
                     self.model.Add(0 >= min_count)
                     total_constraints_added += 1
        logger.info(f"Yetenek gereksinimleri: {total_constraints_added} kısıt eklendi.")

    # Hedef terimlerini toplamak için yardımcı bir yapı
    _objective_terms_list = []
    def _add_objective_term(self, term):
         """Hedef fonksiyonuna bir terim ekler (minimizasyon için)."""
         self._objective_terms_list.append(term)

    def _define_objective_function(self):
        """(İyileştirilmiş) Hedef fonksiyonunu tanımlar."""
        self._objective_terms_list = [] # Her çalıştırmada sıfırla
        objective_config = self.config.get('optimization_core', {}).get('objective_weights', {})
        if not objective_config:
            logger.info("Konfigürasyonda 'objective_weights' bulunamadı, hedef fonksiyonu tanımlanmıyor.")
            return

        logger.info(f"Hedef fonksiyonu tanımlanıyor. Ağırlıklar: {objective_config}")
        employees = self.input_data.get('employees', [])

        # 1. Fazla personel minimizasyonu
        if 'minimize_overstaffing' in objective_config:
            weight = float(objective_config['minimize_overstaffing'])
            if weight > 0:
                overstaffing_terms = []
                for shift_id, count_var in self.shift_employee_counts.items():
                    shift_info = self.shifts_dict.get(shift_id)
                    if not shift_info:
                         logger.warning(f"Hedef için vardiya bilgisi bulunamadı: {shift_id}")
                         continue
                    # Gerekli personel sayısını vardiya bilgisinden al (iyileştirme)
                    optimal_count = int(shift_info.get('required_staff', 1)) # Varsayılan 1

                    if optimal_count < 0: continue # Geçersiz veri

                    # Fazla personel = max(0, atanan_sayısı - optimal_sayı)
                    overstaffing = self.model.NewIntVar(0, len(employees), f"overstaffing_{shift_id}")
                    # count_var - optimal_count <= overstaffing
                    self.model.Add(count_var - optimal_count <= overstaffing)
                    # overstaffing >= 0 (IntVar tanımında var)
                    # Alternatif: self.model.AddMaxEquality(overstaffing, [0, count_var - optimal_count]) # Bu daha net olabilir

                    overstaffing_terms.append(overstaffing)

                if len(overstaffing_terms) > 0:  # Boş liste kontrolü
                    self._add_objective_term(weight * sum(overstaffing_terms))
                    logger.info(f"Hedef: Fazla personel minimizasyonu eklendi (ağırlık: {weight}).")

        # 2. Eksik personel minimizasyonu
        if 'minimize_understaffing' in objective_config:
            weight = float(objective_config['minimize_understaffing'])
            if weight > 0:
                understaffing_terms = []
                for shift_id, count_var in self.shift_employee_counts.items():
                    shift_info = self.shifts_dict.get(shift_id)
                    if not shift_info: continue
                    optimal_count = int(shift_info.get('required_staff', 1))
                    if optimal_count <= 0: continue # Eksik personel olmaz

                    # Eksik personel = max(0, optimal_sayı - atanan_sayısı)
                    understaffing = self.model.NewIntVar(0, optimal_count, f"understaffing_{shift_id}")
                    # optimal_count - count_var <= understaffing
                    self.model.Add(optimal_count - count_var <= understaffing)
                    # understaffing >= 0 (IntVar tanımında var)
                    # Alternatif: self.model.AddMaxEquality(understaffing, [0, optimal_count - count_var])

                    understaffing_terms.append(understaffing)

                if len(understaffing_terms) > 0:  # Boş liste kontrolü
                    self._add_objective_term(weight * sum(understaffing_terms))
                    logger.info(f"Hedef: Eksik personel minimizasyonu eklendi (ağırlık: {weight}).")

        # 3. Tercihlerin maksimizasyonu (negatif skorları minimize ederek)
        if 'maximize_preferences' in objective_config:
            weight = float(objective_config['maximize_preferences'])
            if weight != 0: # Negatif ağırlık da olabilir (tercihleri cezalandırmak için?)
                preferences = self.input_data.get('preferences', [])
                preference_terms = []
                for pref in preferences:
                    emp_id = pref.get('employee_id')
                    shift_id = pref.get('shift_id')
                    score = int(pref.get('preference_score', 0))

                    assignment_var = self.assignment_vars.get((emp_id, shift_id))
                    if assignment_var is not None and score != 0:  # None kontrolü ile değiştirildi
                        # Tercihin katkısı = atama * skor
                        # Minimizasyon hedefi olduğu için, skoru maksimize etmek için -score ile çarparız.
                        # Eğer weight negatifse, -score * weight pozitif olur ve yüksek skorlu tercihleri cezalandırırız.
                        preference_terms.append(-score * assignment_var)

                if len(preference_terms) > 0:  # Boş liste kontrolü
                    # Ağırlıkla çarparken dikkat: weight * sum(...) = sum(weight * term)
                    self._add_objective_term(weight * sum(preference_terms))
                    logger.info(f"Hedef: Tercih maksimizasyonu (veya ağırlığa göre minimizasyonu) eklendi (ağırlık: {weight}).")

        # 4. İş Yükünü Eşit Dağıtmak (YENİ)
        if 'balance_workload' in objective_config:
            weight = float(objective_config['balance_workload'])
            if weight > 0:
                # Çalışanların vardiya sayılarını al
                employee_shift_counts_list = list(self.employee_shift_counts.values())
                if len(employee_shift_counts_list) > 1:  # En az 2 çalışan olmalı
                    # Maksimum ve minimum vardiya sayısı arasındaki farkı minimize et
                    max_shifts = self.model.NewIntVar(0, len(self.shifts_dict), "max_shifts")
                    min_shifts = self.model.NewIntVar(0, len(self.shifts_dict), "min_shifts")

                    # Maksimum vardiya sayısını bul
                    self.model.AddMaxEquality(max_shifts, employee_shift_counts_list)

                    # Minimum vardiya sayısını bul
                    self.model.AddMinEquality(min_shifts, employee_shift_counts_list)

                    # Farkı hesapla
                    workload_range = self.model.NewIntVar(0, len(self.shifts_dict), "workload_range")
                    self.model.Add(workload_range == max_shifts - min_shifts)

                    # Farkı minimize et
                    self._add_objective_term(weight * workload_range)
                    logger.info(f"Hedef: İş yükü dengeleme eklendi (ağırlık: {weight}).")
                else:
                    logger.info("İş yükü dengeleme için yeterli çalışan yok.")

        # 5. Vardiya Doluluğunu Maksimize Etmek (YENİ)
        if 'maximize_shift_coverage' in objective_config:
            weight = float(objective_config['maximize_shift_coverage'])
            if weight > 0:
                # Boş vardiyaları minimize et
                empty_shift_terms = []
                for shift_id, count_var in self.shift_employee_counts.items():
                    # Vardiya boş mu? (0 çalışan atanmış)
                    is_empty = self.model.NewBoolVar(f"is_empty_{shift_id}")
                    self.model.Add(count_var == 0).OnlyEnforceIf(is_empty)
                    self.model.Add(count_var > 0).OnlyEnforceIf(is_empty.Not())

                    empty_shift_terms.append(is_empty)

                if len(empty_shift_terms) > 0:  # Boş liste kontrolü
                    # Boş vardiya sayısını minimize et
                    self._add_objective_term(weight * sum(empty_shift_terms))
                    logger.info(f"Hedef: Vardiya doluluğu maksimizasyonu eklendi (ağırlık: {weight}).")

        # Eklenen tüm yumuşak kısıt cezaları ve diğer hedef terimlerini birleştir
        if len(self._objective_terms_list) > 0:  # Boş liste kontrolü
            logger.info(f"Toplam {len(self._objective_terms_list)} hedef terimi minimize edilecek.")
            self.model.Minimize(sum(self._objective_terms_list))
        else:
            logger.info("Hedef fonksiyonu için tanımlı terim bulunamadı.")
