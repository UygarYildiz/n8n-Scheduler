# CP-SAT Temelleri (Google OR-Tools)

Bu belge, Google OR-Tools kütüphanesindeki CP-SAT çözücüsünün temel kavramlarını ve kullanımını özetlemektedir.

## CP-SAT Nedir?

CP-SAT (Constraint Programming - Satisfiability), Google OR-Tools'un güçlü bir **Kısıt Programlama (CP)** çözücüsüdür. Özellikle çizelgeleme, atama, rotalama gibi **mantıksal kısıtların** yoğun olduğu ve genellikle **tam sayı (integer)** veya **Boolean (doğru/yanlış)** kararların verildiği optimizasyon problemlerini çözmek için tasarlanmıştır.

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

Bu temel bilgiler, CP-SAT ile modellemeye başlamak için bir referans noktası sunar. 