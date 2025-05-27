# CP-SAT Temelleri ve Vardiya Çizelgeleme Uygulaması

Bu belge, Google OR-Tools kütüphanesindeki CP-SAT çözücüsünün temel kavramlarını ve projemizdeki gerçek vardiya çizelgeleme implementasyonunu detaylandırmaktadır.

## CP-SAT Nedir?

CP-SAT (Constraint Programming - Satisfiability), Google OR-Tools'un güçlü bir **Kısıt Programlama (CP)** çözücüsüdür. Özellikle çizelgeleme, atama, rotalama gibi **mantıksal kısıtların** yoğun olduğu ve genellikle **tam sayı (integer)** veya **Boolean (doğru/yanlış)** kararların verildiği optimizasyon problemlerini çözmek için tasarlanmıştır.

### Projemizdeki CP-SAT Kullanımı

Bu projede CP-SAT, **vardiya çizelgeleme optimizasyonu** için kullanılmaktadır:
- **Çalışan-Vardiya Atama Problemi**: Her çalışanın hangi vardiyalara atanacağının belirlenmesi
- **Karmaşık Kısıtlar**: Availability, skill requirements, minimum staffing, rest time constraints
- **Multi-Objective Optimization**: 5 farklı hedefin ağırlıklı optimizasyonu
- **Dynamic Configuration**: YAML dosyalarından okunan dinamik kısıt sistemi

## Temel Bileşenler

Bir CP-SAT problemi tipik olarak şu bileşenlerden oluşur:

1.  **Model (`cp_model.CpModel`)**
    *   Problemin tüm değişkenlerini, kısıtlarını ve hedefini içeren ana kapsayıcıdır.
    *   Oluşturma: `model = cp_model.CpModel()`

2.  **Değişkenler (Variables)**
    *   Çözücünün değerini bulması gereken bilinmeyenlerdir. Her değişkenin bir değer aralığı (domain) vardır.
    *   **Tamsayı Değişkenler (`model.NewIntVar(min_val, max_val, name)`):** Belirli bir tamsayı aralığında değer alırlar.
      ```python
      # Örnek: 0 ile 10 arasında bir hemşire sayısı
      num_nurses = model.NewIntVar(0, 10, 'num_nurses')
      ```
    *   **Boolean Değişkenler (`model.NewBoolVar(name)`):** Sadece 0 (yanlış) veya 1 (doğru) değerini alırlar. Genellikle "evet/hayır" kararlarını temsil ederler.
      ```python
      # Örnek: Vardiya atandı mı?
      shift_assigned = model.NewBoolVar('shift_assigned')
      ```

3.  **Kısıtlar (Constraints)**
    *   Değişkenler arasındaki sağlanması gereken mantıksal veya matematiksel ilişkilerdir. Problemin kurallarını tanımlarlar.
    *   **Genel Kısıt (`model.Add(boolean_expression)`)**: En yaygın yöntem. İfadenin `True` olmasını zorunlu kılar.
      ```python
      # x + y <= 5
      model.Add(x + y <= 5)
      # İki boolean değişkenin toplamı en fazla 1 olabilir (örn. XOR gibi)
      model.Add(b1 + b2 <= 1)
      ```
    *   **Eğer-İse Kuralı (`model.AddImplication(b1, b2)`)**: Eğer `b1` doğru ise, `b2` de doğru olmalıdır.
      ```python
      # Eğer vardiya atanmışsa (shift_assigned=True), hemşire sayısı > 0 olmalı
      model.AddImplication(shift_assigned, num_nurses > 0)
      ```
    *   **Veya Kuralı (`model.AddBoolOr([b1, b2, ...])`)**: Listelenen Boolean ifadelerden en az biri doğru olmalıdır.
      ```python
      # Görev A yapıldı VEYA Görev B yapıldı
      model.AddBoolOr([task_A_done, task_B_done])
      ```
    *   **Hepsi Farklı (`model.AddAllDifferent([var1, var2, ...])`)**: Listdeki değişkenlerin hepsi birbirinden farklı değerler almalıdır.

4.  **Hedef Fonksiyonu (Objective Function - İsteğe Bağlı)**
    *   Optimize etmek (maksimize veya minimize etmek) istediğimiz ifadedir.
    *   **Minimizasyon (`model.Minimize(expression)`)**: İfadenin değerini en aza indirir.
      ```python
      # Toplam maliyeti minimize et
      model.Minimize(total_cost_variable)
      ```
    *   **Maksimizasyon (`model.Maximize(expression)`)**: İfadenin değerini en üst düzeye çıkarır.
      ```python
      # Toplam memnuniyeti maksimize et
      model.Maximize(sum(preferences[i] * assignment[i] for i in ...))
      ```
    *   Hedef belirtilmezse, çözücü sadece tüm kısıtları sağlayan herhangi bir geçerli çözümü (feasible solution) bulur.

## Çözüm Süreci

1.  **Modeli Oluştur:** `model = cp_model.CpModel()`
2.  **Değişkenleri Tanımla:** `model.NewIntVar(...)`, `model.NewBoolVar(...)`
3.  **Kısıtları Ekle:** `model.Add(...)`, `model.AddImplication(...)` vb.
4.  **Hedefi Tanımla (İsteğe Bağlı):** `model.Minimize(...)` veya `model.Maximize(...)`
5.  **Çözücüyü Oluştur:** `solver = cp_model.CpSolver()`
6.  **(İsteğe Bağlı) Çözücü Parametrelerini Ayarla:** Örn. `solver.parameters.max_time_in_seconds = 60.0`
7.  **Çöz:** `status = solver.Solve(model)`
8.  **Sonuçları Yorumla:**
    *   Çözüm durumunu kontrol et: `status == cp_model.OPTIMAL` veya `status == cp_model.FEASIBLE`
    *   Değişken değerlerini al: `solver.Value(variable_name)`
    *   Hedef fonksiyon değerini al: `solver.ObjectiveValue()`

## ShiftSchedulingModelBuilder Class Implementasyonu

### Class Yapısı ve Temel Özellikler

```python
class ShiftSchedulingModelBuilder:
    """
    Vardiya çizelgeleme problemi için CP-SAT modeli oluşturan sınıf.
    Konfigürasyon dosyasından okunan parametrelere göre dinamik olarak kısıt ekler.
    """

    def __init__(self, config: Dict[str, Any], input_data: Dict[str, Any]):
        self.config = config
        self.input_data = input_data
        self.model = cp_model.CpModel()
        self.solver = cp_model.CpSolver()

        # Vardiya bilgilerini daha kolay erişim için işle
        self.shifts_dict = {s['shift_id']: s for s in self.input_data.get('shifts', [])}

        # Çözücü parametrelerini ayarla
        solver_time_limit = config.get('optimization_core', {}).get('solver_time_limit_seconds', 30.0)
        self.solver.parameters.max_time_in_seconds = float(solver_time_limit)

        # Değişkenleri ve kısıtları saklamak için sözlükler
        self.assignment_vars = {}  # (employee_id, shift_id) -> BoolVar
        self.employee_shift_counts = {}  # employee_id -> IntVar
        self.shift_employee_counts = {}  # shift_id -> IntVar
```

### Model Oluşturma Süreci (4 Aşama)

```python
def build_model(self) -> cp_model.CpModel:
    """
    Konfigürasyon ve girdi verilerine göre CP-SAT modelini oluşturur.
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
```

## Değişken Tanımlamaları

### Assignment Variables (Boolean)

```python
def _create_assignment_variables(self):
    """Her çalışan-vardiya çifti için boolean değişken oluşturur."""
    employees = self.input_data.get('employees', [])
    shifts = self.input_data.get('shifts', [])

    for employee in employees:
        employee_id = employee.get('employee_id')
        for shift in shifts:
            shift_id = shift.get('shift_id')
            # Bu çalışanın bu vardiyaya atanıp atanmayacağını belirten boolean değişken
            var_name = f"assign_{employee_id}_{shift_id}"
            self.assignment_vars[(employee_id, shift_id)] = self.model.NewBoolVar(var_name)
```

### Count Variables (Integer)

```python
# Çalışan başına toplam vardiya sayısı
for employee_id in employee_ids:
    self.employee_shift_counts[employee_id] = self.model.NewIntVar(
        0, len(shifts), f"total_shifts_{employee_id}"
    )

# Vardiya başına atanan çalışan sayısı
for shift_id in shift_ids:
    self.shift_employee_counts[shift_id] = self.model.NewIntVar(
        0, len(employees), f"staff_count_{shift_id}"
    )
```

## Kısıt Türleri ve Implementasyonları

### 1. Temel Kısıtlar (Hard Constraints)

#### Availability Constraints
```python
def _add_availability_constraints(self):
    """Çalışanların uygunluk durumlarına göre kısıt ekler."""
    availability_data = self.input_data.get('availability', [])
    unavailable_assignments = set()

    for avail in availability_data:
        if not avail.get('is_available', True):
            employee_id = avail.get('employee_id')
            date_str = avail.get('date')

            # Bu tarihteki tüm vardiyalar için atama yasağı
            for shift in self.input_data.get('shifts', []):
                if shift.get('date') == date_str:
                    shift_id = shift.get('shift_id')
                    assignment_var = self.assignment_vars.get((employee_id, shift_id))
                    if assignment_var is not None:
                        self.model.Add(assignment_var == 0)
                        unavailable_assignments.add((employee_id, shift_id))
```

#### Daily Overlap Constraints
```python
def _add_daily_overlap_constraints(self):
    """Aynı gün çakışan vardiyalara atama kısıtı."""
    # Vardiyaları tarihe göre grupla
    shifts_by_date = {}
    for shift in self.input_data.get('shifts', []):
        date_str = shift.get('date')
        if date_str not in shifts_by_date:
            shifts_by_date[date_str] = []
        shifts_by_date[date_str].append(shift.get('shift_id'))

    # Her çalışan için aynı gün en fazla 1 vardiya
    for employee in self.input_data.get('employees', []):
        employee_id = employee.get('employee_id')
        for date_str, shift_ids_on_date in shifts_by_date.items():
            date_vars = []
            for s_id in shift_ids_on_date:
                var = self.assignment_vars.get((employee_id, s_id))
                if var is not None:
                    date_vars.append(var)

            if len(date_vars) > 1:
                self.model.Add(sum(date_vars) <= 1)
```

### 2. Dinamik Kısıtlar (YAML Konfigürasyondan)

#### Minimum Staffing Requirements
```python
def _add_min_staffing_constraints(self, min_staffing_rules):
    """Minimum personel gereksinimlerini ekler."""
    for rule in min_staffing_rules:
        pattern = rule.get('pattern', '*')
        min_count = rule.get('min_staff', 1)
        penalty = rule.get('penalty')  # None ise hard constraint

        # Pattern'e uyan vardiyaları bul
        matching_shifts = []
        for shift in self.input_data.get('shifts', []):
            shift_name = shift.get('name', '')
            if fnmatch.fnmatch(shift_name, pattern):
                matching_shifts.append(shift)

        for shift in matching_shifts:
            shift_id = shift.get('shift_id')
            # Bu vardiyaya atanan toplam çalışan sayısı
            total_assigned = sum(
                self.assignment_vars.get((emp['employee_id'], shift_id), 0)
                for emp in self.input_data.get('employees', [])
            )

            if penalty is None or penalty <= 0:  # Hard constraint
                self.model.Add(total_assigned >= min_count)
            else:  # Soft constraint
                shortfall = self.model.NewIntVar(0, min_count, f"shortfall_{shift_id}")
                self.model.Add(total_assigned + shortfall >= min_count)
                self._add_objective_term(penalty * shortfall)
```

#### Maximum Consecutive Shifts
```python
def _add_max_consecutive_shifts_constraint(self, max_consecutive):
    """Maksimum ardışık vardiya kısıtı."""
    employees = self.input_data.get('employees', [])
    shifts = self.input_data.get('shifts', [])

    # Vardiyaları tarihe göre sırala
    sorted_shifts = sorted(shifts, key=lambda s: s.get('date', ''))

    for employee in employees:
        employee_id = employee.get('employee_id')

        # Sliding window ile ardışık vardiya kontrolü
        for i in range(len(sorted_shifts) - max_consecutive):
            consecutive_vars = []
            for j in range(i, i + max_consecutive + 1):
                shift_id = sorted_shifts[j].get('shift_id')
                var = self.assignment_vars.get((employee_id, shift_id))
                if var is not None:
                    consecutive_vars.append(var)

            if len(consecutive_vars) == max_consecutive + 1:
                # En fazla max_consecutive kadar ardışık atama
                self.model.Add(sum(consecutive_vars) <= max_consecutive)
```

#### Minimum Rest Time
```python
def _add_min_rest_time_constraint(self, min_rest_hours):
    """Minimum dinlenme süresi kısıtı."""
    total_min_rest_minutes = min_rest_hours * 60

    for employee in self.input_data.get('employees', []):
        employee_id = employee.get('employee_id')

        # Vardiyaları datetime'a çevir ve sırala
        sorted_shifts = []
        for shift in self.input_data.get('shifts', []):
            # Shift datetime hesaplama
            shift_date = datetime.strptime(shift.get('date'), '%Y-%m-%d').date()
            start_time = shift.get('start_time')  # time object
            end_time = shift.get('end_time')    # time object

            start_dt = datetime.combine(shift_date, start_time)
            end_dt = datetime.combine(shift_date, end_time)

            # Gece vardiyası kontrolü (ertesi güne geçiyor)
            if end_time < start_time:
                end_dt += timedelta(days=1)

            sorted_shifts.append({
                'shift_id': shift.get('shift_id'),
                '_start_datetime': start_dt,
                '_end_datetime': end_dt
            })

        sorted_shifts.sort(key=lambda s: s['_start_datetime'])

        # Ardışık vardiya çiftleri için rest time kontrolü
        for i in range(len(sorted_shifts)):
            for j in range(i + 1, len(sorted_shifts)):
                shift1 = sorted_shifts[i]
                shift2 = sorted_shifts[j]

                time_diff_minutes = (shift2['_start_datetime'] - shift1['_end_datetime']).total_seconds() / 60

                # Yetersiz dinlenme süresi varsa, ikisi birden atanamaz
                if 0 <= time_diff_minutes < total_min_rest_minutes:
                    var1 = self.assignment_vars.get((employee_id, shift1['shift_id']))
                    var2 = self.assignment_vars.get((employee_id, shift2['shift_id']))
                    if var1 is not None and var2 is not None:
                        self.model.Add(var1 + var2 <= 1)
```

## Hedef Fonksiyonu (Multi-Objective Optimization)

### 5 Bileşenli Ağırlıklı Hedef Fonksiyonu

```python
def _define_objective_function(self):
    """Ağırlıklı hedef fonksiyonunu tanımlar."""
    self._objective_terms_list = []
    objective_config = self.config.get('optimization_core', {}).get('objective_weights', {})

    # 1. Minimize Overstaffing (Fazla Personel)
    weight = objective_config.get('minimize_overstaffing', 1)
    if weight > 0:
        overstaffing_terms = []
        for shift in self.input_data.get('shifts', []):
            shift_id = shift.get('shift_id')
            required_staff = shift.get('required_staff', 1)

            # Bu vardiyaya atanan toplam çalışan sayısı
            total_assigned = sum(
                self.assignment_vars.get((emp['employee_id'], shift_id), 0)
                for emp in self.input_data.get('employees', [])
            )

            # Fazla personel = max(0, atanan - gerekli)
            overstaffing = self.model.NewIntVar(0, len(employees), f"overstaffing_{shift_id}")
            self.model.Add(overstaffing >= total_assigned - required_staff)
            overstaffing_terms.append(overstaffing)

        if overstaffing_terms:
            self._add_objective_term(weight * sum(overstaffing_terms))

    # 2. Minimize Understaffing (Eksik Personel) - En Yüksek Öncelik
    weight = objective_config.get('minimize_understaffing', 10)
    if weight > 0:
        understaffing_terms = []
        for shift in self.input_data.get('shifts', []):
            shift_id = shift.get('shift_id')
            required_staff = shift.get('required_staff', 1)

            total_assigned = sum(
                self.assignment_vars.get((emp['employee_id'], shift_id), 0)
                for emp in self.input_data.get('employees', [])
            )

            # Eksik personel = max(0, gerekli - atanan)
            understaffing = self.model.NewIntVar(0, required_staff, f"understaffing_{shift_id}")
            self.model.Add(understaffing >= required_staff - total_assigned)
            understaffing_terms.append(understaffing)

        if understaffing_terms:
            self._add_objective_term(weight * sum(understaffing_terms))

    # 3. Maximize Preferences (Tercih Memnuniyeti)
    weight = objective_config.get('maximize_preferences', 2)
    if weight > 0:
        preference_terms = []
        for pref in self.input_data.get('preferences', []):
            emp_id = pref.get('employee_id')
            shift_id = pref.get('shift_id')
            score = pref.get('preference_score', 0)

            assignment_var = self.assignment_vars.get((emp_id, shift_id))
            if assignment_var is not None and score != 0:
                # Minimizasyon hedefi olduğu için -score ile çarparız
                preference_terms.append(-score * assignment_var)

        if preference_terms:
            self._add_objective_term(weight * sum(preference_terms))

    # 4. Balance Workload (İş Yükü Dengesi)
    weight = objective_config.get('balance_workload', 0.5)
    if weight > 0:
        employees = self.input_data.get('employees', [])
        if len(employees) > 1:
            # Min ve max iş yükü değişkenleri
            min_workload = self.model.NewIntVar(0, len(shifts), "min_workload")
            max_workload = self.model.NewIntVar(0, len(shifts), "max_workload")

            # Her çalışanın iş yükü
            for employee in employees:
                employee_id = employee.get('employee_id')
                total_shifts = sum(
                    self.assignment_vars.get((employee_id, s['shift_id']), 0)
                    for s in self.input_data.get('shifts', [])
                )
                self.model.Add(min_workload <= total_shifts)
                self.model.Add(max_workload >= total_shifts)

            # İş yükü farkını minimize et
            workload_difference = max_workload - min_workload
            self._add_objective_term(weight * workload_difference)

    # 5. Maximize Shift Coverage (Vardiya Doluluğu)
    weight = objective_config.get('maximize_shift_coverage', 1)
    if weight > 0:
        empty_shift_terms = []
        for shift in self.input_data.get('shifts', []):
            shift_id = shift.get('shift_id')

            total_assigned = sum(
                self.assignment_vars.get((emp['employee_id'], shift_id), 0)
                for emp in self.input_data.get('employees', [])
            )

            # Boş vardiya = 1 if total_assigned == 0, else 0
            is_empty = self.model.NewBoolVar(f"empty_{shift_id}")
            self.model.Add(total_assigned >= 1).OnlyEnforceIf(is_empty.Not())
            self.model.Add(total_assigned == 0).OnlyEnforceIf(is_empty)
            empty_shift_terms.append(is_empty)

        if empty_shift_terms:
            self._add_objective_term(weight * sum(empty_shift_terms))

    # Hedef fonksiyonunu modele ekle
    if self._objective_terms_list:
        total_objective = sum(self._objective_terms_list)
        self.model.Minimize(total_objective)
        logger.info(f"Hedef fonksiyonu {len(self._objective_terms_list)} terimle tanımlandı.")
```

### Varsayılan Ağırlıklar (YAML Konfigürasyonu)

```yaml
optimization_core:
  objective_weights:
    minimize_overstaffing: 1      # Fazla personel cezası
    minimize_understaffing: 10    # Eksik personel cezası (en yüksek)
    maximize_preferences: 2       # Tercih memnuniyeti
    balance_workload: 0.5         # İş yükü dengesi
    maximize_shift_coverage: 1    # Vardiya doluluğu
```

## Solver Konfigürasyonu ve Parametreleri

### Temel Solver Ayarları

```python
def __init__(self, config: Dict[str, Any], input_data: Dict[str, Any]):
    # ... diğer init kodları ...

    # Çözücü parametrelerini konfigürasyondan al
    solver_config = config.get('optimization_core', {})

    # Zaman limiti
    time_limit = solver_config.get('solver_time_limit_seconds', 60.0)
    self.solver.parameters.max_time_in_seconds = float(time_limit)

    # Diğer CP-SAT parametreleri (isteğe bağlı)
    if 'num_search_workers' in solver_config:
        self.solver.parameters.num_search_workers = solver_config['num_search_workers']

    if 'log_search_progress' in solver_config:
        self.solver.parameters.log_search_progress = solver_config['log_search_progress']

    logger.info(f"Çözücü parametreleri ayarlandı: zaman_limiti={time_limit}s")
```

### Model Çözme ve Status Handling

```python
def solve_model(self) -> Tuple[str, Dict[str, Any]]:
    """Oluşturulan modeli çözer ve sonuçları döndürür."""
    logger.info(f"Model çözülüyor (zaman limiti: {self.solver.parameters.max_time_in_seconds}s)...")
    start_time = time.time()
    status = self.solver.Solve(self.model)
    end_time = time.time()

    processing_time = end_time - start_time
    logger.info(f"Model çözme işlemi {processing_time:.2f} saniye sürdü.")

    # Status değerlendirmesi
    if status == cp_model.OPTIMAL:
        status_str = "OPTIMAL"
        status_message = "Optimal çözüm bulundu"
        logger.info("✅ Optimal çözüm bulundu!")
    elif status == cp_model.FEASIBLE:
        status_str = "FEASIBLE"
        status_message = "Geçerli çözüm bulundu (optimal olmayabilir)"
        logger.info("✅ Geçerli çözüm bulundu (zaman limiti nedeniyle optimal olmayabilir)")
    elif status == cp_model.INFEASIBLE:
        status_str = "INFEASIBLE"
        status_message = "Çözüm bulunamadı (kısıtlar çelişkili)"
        logger.error("❌ Çözüm bulunamadı - kısıtlar çelişkili olabilir")
        return status_str, {
            "status": status_str,
            "solver_status_message": status_message,
            "processing_time_seconds": processing_time,
            "error": "Model infeasible - kısıtları gözden geçirin"
        }
    elif status == cp_model.MODEL_INVALID:
        status_str = "MODEL_INVALID"
        status_message = "Model geçersiz"
        logger.error("❌ Model geçersiz")
        return status_str, {
            "status": status_str,
            "solver_status_message": status_message,
            "processing_time_seconds": processing_time,
            "error": "Model validation failed"
        }
    else:
        status_str = "UNKNOWN"
        status_message = f"Bilinmeyen durum: {status}"
        logger.warning(f"⚠️ Bilinmeyen çözüm durumu: {status}")

    # Çözüm varsa assignment'ları çıkar
    solution = None
    objective_value = None

    if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
        objective_value = self.solver.ObjectiveValue()
        logger.info(f"Hedef fonksiyon değeri: {objective_value}")

        # Assignment'ları çıkar
        assignments = []
        for (employee_id, shift_id), var in self.assignment_vars.items():
            if self.solver.Value(var) == 1:  # Atama yapıldı
                shift_data = self.shifts_dict.get(shift_id, {})
                assignments.append({
                    "employee_id": employee_id,
                    "shift_id": shift_id,
                    "date": shift_data.get('date')
                })

        solution = {"assignments": assignments}
        logger.info(f"Toplam {len(assignments)} atama yapıldı.")

    return status_str, {
        "status": status_str,
        "solver_status_message": status_message,
        "processing_time_seconds": processing_time,
        "objective_value": objective_value,
        "solution": solution
    }
```

## Performance Optimization Teknikleri

### 1. Model Boyutu Optimizasyonu

```python
def _optimize_model_size(self):
    """Model boyutunu optimize etmek için teknikler."""

    # Gereksiz değişkenleri filtrele
    employees = self.input_data.get('employees', [])
    shifts = self.input_data.get('shifts', [])

    # Availability kontrolü ile impossible assignments'ları önceden filtrele
    valid_assignments = set()
    for employee in employees:
        employee_id = employee.get('employee_id')
        for shift in shifts:
            shift_id = shift.get('shift_id')
            shift_date = shift.get('date')

            # Bu çalışan bu tarihte uygun mu?
            is_available = self._check_availability(employee_id, shift_date)
            if is_available:
                valid_assignments.add((employee_id, shift_id))

    logger.info(f"Model optimizasyonu: {len(valid_assignments)} geçerli atama, "
                f"{len(employees) * len(shifts) - len(valid_assignments)} geçersiz atama filtrelendi")

    return valid_assignments

def _check_availability(self, employee_id: str, date_str: str) -> bool:
    """Çalışanın belirli bir tarihte uygun olup olmadığını kontrol eder."""
    availability_data = self.input_data.get('availability', [])
    for avail in availability_data:
        if (avail.get('employee_id') == employee_id and
            avail.get('date') == date_str):
            return avail.get('is_available', True)
    return True  # Varsayılan olarak uygun
```

### 2. Constraint Ordering ve Preprocessing

```python
def _add_constraints_optimized(self):
    """Kısıtları performans için optimize edilmiş sırada ekler."""

    # 1. Önce hard constraints (hızlı fail için)
    self._add_availability_constraints()
    self._add_daily_overlap_constraints()

    # 2. Sonra soft constraints
    self._add_dynamic_constraints_from_config()

    # 3. Constraint propagation için hint'ler
    self._add_constraint_hints()

def _add_constraint_hints(self):
    """CP-SAT solver'a performans hint'leri verir."""

    # Yüksek öncelikli vardiyalar için hint'ler
    high_priority_shifts = []
    for shift in self.input_data.get('shifts', []):
        if 'Acil' in shift.get('name', '') or 'Yoğun Bakım' in shift.get('name', ''):
            high_priority_shifts.append(shift.get('shift_id'))

    # Bu vardiyalar için daha agresif assignment hint'i
    for shift_id in high_priority_shifts:
        for employee in self.input_data.get('employees', []):
            employee_id = employee.get('employee_id')
            var = self.assignment_vars.get((employee_id, shift_id))
            if var is not None:
                # Hint: Bu vardiyalara atama yapılması tercih edilir
                self.model.AddHint(var, 1)
```

### 3. Solver Parametreleri Tuning

```python
def _configure_solver_for_performance(self):
    """Solver'ı performans için optimize eder."""

    # Paralel arama
    self.solver.parameters.num_search_workers = 4

    # Search strategy
    self.solver.parameters.search_branching = cp_model.FIXED_SEARCH

    # Presolve seviyesi
    self.solver.parameters.cp_model_presolve = True

    # Log seviyesi (production'da kapatılabilir)
    self.solver.parameters.log_search_progress = True

    # Memory limit
    self.solver.parameters.max_memory_in_mb = 2048

    logger.info("Solver performans parametreleri ayarlandı")
```

## Debugging ve Troubleshooting

### 1. Model Validation

```python
def validate_model(self) -> List[str]:
    """Model tutarlılığını kontrol eder ve sorunları raporlar."""
    issues = []

    # Veri tutarlılığı kontrolleri
    employees = self.input_data.get('employees', [])
    shifts = self.input_data.get('shifts', [])

    if not employees:
        issues.append("Hiç çalışan verisi bulunamadı")

    if not shifts:
        issues.append("Hiç vardiya verisi bulunamadı")

    # Availability veri tutarlılığı
    availability_data = self.input_data.get('availability', [])
    employee_ids = {emp.get('employee_id') for emp in employees}
    shift_dates = {shift.get('date') for shift in shifts}

    for avail in availability_data:
        emp_id = avail.get('employee_id')
        date_str = avail.get('date')

        if emp_id not in employee_ids:
            issues.append(f"Availability'de bilinmeyen çalışan: {emp_id}")

        if date_str not in shift_dates:
            issues.append(f"Availability'de bilinmeyen tarih: {date_str}")

    # Preference veri tutarlılığı
    preferences = self.input_data.get('preferences', [])
    shift_ids = {shift.get('shift_id') for shift in shifts}

    for pref in preferences:
        emp_id = pref.get('employee_id')
        shift_id = pref.get('shift_id')

        if emp_id not in employee_ids:
            issues.append(f"Preference'da bilinmeyen çalışan: {emp_id}")

        if shift_id not in shift_ids:
            issues.append(f"Preference'da bilinmeyen vardiya: {shift_id}")

    # Konfigürasyon tutarlılığı
    config_issues = self._validate_config()
    issues.extend(config_issues)

    return issues

def _validate_config(self) -> List[str]:
    """Konfigürasyon tutarlılığını kontrol eder."""
    issues = []

    # Objective weights kontrolü
    obj_weights = self.config.get('optimization_core', {}).get('objective_weights', {})
    required_weights = ['minimize_overstaffing', 'minimize_understaffing',
                       'maximize_preferences', 'balance_workload', 'maximize_shift_coverage']

    for weight_name in required_weights:
        if weight_name not in obj_weights:
            issues.append(f"Eksik objective weight: {weight_name}")
        elif not isinstance(obj_weights[weight_name], (int, float)):
            issues.append(f"Geçersiz objective weight tipi: {weight_name}")

    # Rules kontrolü
    rules = self.config.get('rules', {})
    if 'min_staffing_requirements' in rules:
        for i, rule in enumerate(rules['min_staffing_requirements']):
            if 'pattern' not in rule:
                issues.append(f"min_staffing_requirements[{i}]: 'pattern' eksik")
            if 'min_staff' not in rule:
                issues.append(f"min_staffing_requirements[{i}]: 'min_staff' eksik")

    return issues
```

### 2. Infeasibility Debugging

```python
def debug_infeasibility(self) -> Dict[str, Any]:
    """Model infeasible olduğunda debug bilgisi sağlar."""
    debug_info = {
        "constraint_analysis": {},
        "data_analysis": {},
        "suggestions": []
    }

    # Constraint analizi
    employees = self.input_data.get('employees', [])
    shifts = self.input_data.get('shifts', [])

    # Availability analizi
    total_employee_days = 0
    total_shift_requirements = 0

    for employee in employees:
        employee_id = employee.get('employee_id')
        available_days = 0
        for shift in shifts:
            if self._check_availability(employee_id, shift.get('date')):
                available_days += 1
        total_employee_days += available_days

    for shift in shifts:
        total_shift_requirements += shift.get('required_staff', 1)

    debug_info["data_analysis"] = {
        "total_employees": len(employees),
        "total_shifts": len(shifts),
        "total_employee_days": total_employee_days,
        "total_shift_requirements": total_shift_requirements,
        "capacity_ratio": total_employee_days / max(total_shift_requirements, 1)
    }

    # Öneriler
    if total_employee_days < total_shift_requirements:
        debug_info["suggestions"].append(
            f"Yetersiz kapasite: {total_shift_requirements} gereksinim, "
            f"{total_employee_days} uygun çalışan-gün. "
            f"Daha fazla çalışan ekleyin veya vardiya gereksinimlerini azaltın."
        )

    # Minimum staffing analizi
    rules = self.config.get('rules', {})
    if 'min_staffing_requirements' in rules:
        for rule in rules['min_staffing_requirements']:
            pattern = rule.get('pattern', '*')
            min_staff = rule.get('min_staff', 1)

            matching_shifts = [s for s in shifts
                             if fnmatch.fnmatch(s.get('name', ''), pattern)]

            if len(matching_shifts) * min_staff > total_employee_days:
                debug_info["suggestions"].append(
                    f"Pattern '{pattern}' için minimum staffing ({min_staff}) "
                    f"çok yüksek olabilir. {len(matching_shifts)} vardiya bulundu."
                )

    return debug_info
```

### 3. Performance Monitoring

```python
def get_performance_stats(self) -> Dict[str, Any]:
    """Model performans istatistiklerini döndürür."""
    stats = {
        "model_stats": {
            "num_variables": self.model.Proto().variables,
            "num_constraints": len(self.model.Proto().constraints),
            "num_assignment_vars": len(self.assignment_vars)
        },
        "solver_stats": {
            "solve_time": getattr(self.solver, 'WallTime', lambda: 0)(),
            "num_branches": getattr(self.solver, 'NumBranches', lambda: 0)(),
            "num_conflicts": getattr(self.solver, 'NumConflicts', lambda: 0)()
        },
        "data_stats": {
            "num_employees": len(self.input_data.get('employees', [])),
            "num_shifts": len(self.input_data.get('shifts', [])),
            "num_preferences": len(self.input_data.get('preferences', [])),
            "num_availability_records": len(self.input_data.get('availability', []))
        }
    }

    return stats
```

## CP-SAT vs Diğer Solver Karşılaştırması

### CP-SAT Avantajları

1. **Constraint Modeling**: Karmaşık mantıksal kısıtları doğal olarak ifade edebilme
2. **Mixed Integer Programming**: Boolean ve integer değişkenleri aynı modelde kullanma
3. **Presolve**: Güçlü ön işleme ve model simplification
4. **Parallelization**: Multi-core desteği ile hızlı çözüm
5. **Memory Efficiency**: Büyük problemler için optimize edilmiş memory kullanımı

### Alternatif Solver'lar

| Solver | Avantajlar | Dezavantajlar | Kullanım Alanı |
|--------|------------|---------------|----------------|
| **Gurobi** | Çok hızlı, güçlü MIP | Ticari lisans gerekli | Büyük ölçekli MIP problemleri |
| **CPLEX** | Endüstri standardı | Pahalı lisans | Enterprise çözümler |
| **SCIP** | Açık kaynak, esnek | CP-SAT'tan yavaş | Akademik araştırma |
| **OR-Tools LP** | Hızlı LP çözümü | Sadece linear | Basit optimizasyon |

### Projemizde CP-SAT Seçim Nedenleri

1. **Ücretsiz**: Google OR-Tools açık kaynak
2. **Constraint Support**: Vardiya çizelgeleme için ideal constraint türleri
3. **Performance**: Orta ölçekli problemler için yeterli hız
4. **Integration**: Python ile kolay entegrasyon
5. **Maintenance**: Google tarafından aktif geliştirme

Bu kapsamlı rehber, CP-SAT ile vardiya çizelgeleme optimizasyonu geliştirmek için gereken tüm temel bilgileri ve gerçek implementasyon örneklerini sağlar.