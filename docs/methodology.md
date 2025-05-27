# Metodoloji ve Yaklaşım

Bu belge, Kurumsal Optimizasyon ve Otomasyon Çözümü projesinin metodolojik yaklaşımını, problem formülasyonunu, sistem tasarım metodolojisini ve değerlendirme çerçevesini detaylandırmaktadır.

## 1. Problem Formülasyonu

### 1.1. Matematiksel Model Tanımı

**Vardiya Çizelgeleme Problemi (VSP) Formülasyonu:**

**Karar Değişkenleri:**
```
x_{i,j} ∈ {0,1} : Çalışan i'nin vardiya j'ye atanıp atanmadığını belirten binary değişken
  x_{i,j} = 1, eğer çalışan i vardiya j'ye atanırsa
  x_{i,j} = 0, aksi takdirde

y_j ∈ ℤ⁺ : Vardiya j'ye atanan toplam çalışan sayısı
z_i ∈ ℤ⁺ : Çalışan i'nin toplam vardiya sayısı
```

**Parametre Setleri:**
```
E = {e₁, e₂, ..., eₙ} : Çalışanlar kümesi (|E| = n)
S = {s₁, s₂, ..., sₘ} : Vardiyalar kümesi (|S| = m)
D = {d₁, d₂, ..., dₖ} : Tarihler kümesi (|D| = k)
K = {k₁, k₂, ..., kₗ} : Yetenekler kümesi (|K| = l)
```

**Parametre Matrisleri:**
```
A_{i,d} ∈ {0,1} : Çalışan i'nin tarih d'de uygunluk durumu
P_{i,j} ∈ {-1,0,1} : Çalışan i'nin vardiya j için tercih skoru
R_j ∈ ℤ⁺ : Vardiya j için gerekli minimum personel sayısı
SK_{i,k} ∈ {0,1} : Çalışan i'nin yetenek k'ye sahip olup olmadığı
SR_{j,k} ∈ {0,1} : Vardiya j'nin yetenek k gerektirip gerektirmediği
```

### 1.2. Hedef Fonksiyonu (Multi-Objective)

**Ağırlıklı Toplam Yaklaşımı:**
```
Minimize: Z = w₁·f₁ + w₂·f₂ + w₃·f₃ + w₄·f₄ + w₅·f₅

Burada:
f₁ = Σⱼ max(0, yⱼ - Rⱼ)                    # Fazla personel cezası
f₂ = Σⱼ max(0, Rⱼ - yⱼ)                    # Eksik personel cezası  
f₃ = -Σᵢ Σⱼ Pᵢⱼ · xᵢⱼ                      # Tercih memnuniyetsizliği
f₄ = max(zᵢ) - min(zᵢ)                     # İş yükü dengesizliği
f₅ = Σⱼ (1 - min(1, yⱼ))                   # Boş vardiya sayısı

Ağırlıklar: w₁=1, w₂=10, w₃=2, w₄=0.5, w₅=1
```

### 1.3. Kısıt Sistemi

**Hard Constraints (Kesin Kısıtlar):**

1. **Uygunluk Kısıtı:**
   ```
   xᵢⱼ ≤ Aᵢ,date(j)  ∀i ∈ E, ∀j ∈ S
   ```

2. **Günlük Çakışma Kısıtı:**
   ```
   Σⱼ∈Sₐ xᵢⱼ ≤ 1  ∀i ∈ E, ∀d ∈ D
   Burada Sₐ = {j ∈ S : date(j) = d}
   ```

3. **Yetenek Gereksinimleri:**
   ```
   Σᵢ:SKᵢₖ=1 xᵢⱼ ≥ 1  ∀j ∈ S, ∀k ∈ K : SRⱼₖ = 1
   ```

**Soft Constraints (Esnek Kısıtlar):**

4. **Minimum Personel Gereksinimi:**
   ```
   yⱼ + sⱼ⁻ ≥ Rⱼ  ∀j ∈ S
   Burada sⱼ⁻ ≥ 0 (eksik personel slack değişkeni)
   ```

5. **Maksimum Ardışık Vardiya:**
   ```
   Σₜ=ᵢⁱ⁺ᴹᴬˣ⁻¹ xᵢ,shift(t) ≤ MAX  ∀i ∈ E, ∀i ∈ {1,...,|D|-MAX+1}
   ```

6. **Minimum Dinlenme Süresi:**
   ```
   xᵢⱼ + xᵢⱼ' ≤ 1  ∀i ∈ E, ∀j,j' ∈ S : rest_time(j,j') < MIN_REST
   ```

### 1.4. Karmaşıklık Analizi

**Problem Sınıflandırması:**
- **NP-Hard:** Vardiya çizelgeleme problemi, set covering probleminin genelleştirilmiş halidir
- **Karmaşıklık:** O(2^(n×m)) brute force, O(n×m×k) CP-SAT ile polynomial time approximation
- **Boyut:** n=80 çalışan, m=200-400 vardiya, k=7 gün için pratik çözüm süresi <60 saniye

## 2. Sistem Tasarım Metodolojisi

### 2.1. Çevik Geliştirme Yaklaşımı

**Sprint Organizasyonu:**
```
Sprint 1 (Hafta 1-2): Problem analizi ve veri modeli tasarımı
Sprint 2 (Hafta 3-4): CP-SAT optimizasyon çekirdeği geliştirme
Sprint 3 (Hafta 5-6): FastAPI backend ve API tasarımı
Sprint 4 (Hafta 7-8): React frontend ve kullanıcı arayüzü
Sprint 5 (Hafta 9-10): n8n workflow entegrasyonu
Sprint 6 (Hafta 11-12): Test, deployment ve dokümantasyon
```

**Iterative Development Cycle:**
1. **Requirements Analysis** → User stories ve acceptance criteria
2. **Design & Architecture** → System design ve component specification
3. **Implementation** → Code development ve unit testing
4. **Integration Testing** → Component integration ve system testing
5. **User Feedback** → Stakeholder review ve requirement refinement
6. **Refactoring** → Code optimization ve architecture improvement

### 2.2. Kullanıcı Merkezli Tasarım İlkeleri

**Design Thinking Approach:**
1. **Empathize:** Hastane ve çağrı merkezi personeli ile görüşmeler
2. **Define:** Problem statement ve user personas tanımı
3. **Ideate:** Çözüm alternatifleri ve brainstorming sessions
4. **Prototype:** Wireframes, mockups ve interactive prototypes
5. **Test:** Usability testing ve user acceptance validation

**User Experience (UX) Metodolojisi:**
- **User Journey Mapping:** End-to-end kullanıcı deneyimi haritalama
- **Information Architecture:** Navigasyon ve içerik organizasyonu
- **Responsive Design:** Mobile-first yaklaşım ile çoklu cihaz desteği
- **Accessibility:** WCAG 2.1 AA standartlarına uygunluk

### 2.3. Mimari Tasarım Yaklaşımı

**Microservices Architecture Principles:**
```
Frontend Layer (React + TypeScript)
├── Authentication Service
├── Data Visualization Components  
├── Form Management System
└── Real-time Notification System

API Gateway Layer (FastAPI)
├── Authentication & Authorization
├── Request Validation & Routing
├── Rate Limiting & Caching
└── Error Handling & Logging

Business Logic Layer
├── Optimization Core (CP-SAT)
├── Data Processing Pipeline
├── Configuration Management
└── Workflow Orchestration (n8n)

Data Layer
├── Relational Database (MySQL)
├── Configuration Files (YAML)
├── Synthetic Data Generation
└── Backup & Recovery System
```

**Design Patterns:**
- **Repository Pattern:** Data access abstraction
- **Factory Pattern:** Optimization model creation
- **Observer Pattern:** Real-time updates ve notifications
- **Strategy Pattern:** Multiple optimization algorithms support
- **Dependency Injection:** Loose coupling ve testability

## 3. Algoritma Seçimi ve Gerekçelendirme

### 3.1. CP-SAT Seçim Kriterleri

**Karşılaştırmalı Analiz:**

| Kriter | CP-SAT | Gurobi | CPLEX | Genetic Algorithm |
|--------|--------|--------|-------|-------------------|
| **Maliyet** | Ücretsiz | Ticari | Ticari | Ücretsiz |
| **Constraint Support** | Mükemmel | İyi | İyi | Zayıf |
| **Performance** | İyi | Mükemmel | Mükemmel | Orta |
| **Integration** | Kolay | Orta | Orta | Kolay |
| **Maintenance** | Google Support | Ticari Support | Ticari Support | Community |

**Seçim Gerekçeleri:**
1. **Maliyet Etkinliği:** Açık kaynak ve ücretsiz kullanım
2. **Constraint Modeling:** Boolean ve integer constraints için ideal
3. **Performance:** Orta ölçekli problemler için yeterli hız
4. **Python Integration:** Kolay entegrasyon ve development
5. **Community Support:** Aktif geliştirme ve dokümantasyon

### 3.2. Hibrit Optimizasyon Yaklaşımı

**Multi-Level Optimization Strategy:**
```
Level 1: Preprocessing
├── Data validation ve cleaning
├── Infeasible assignment elimination
├── Constraint preprocessing
└── Variable reduction

Level 2: Core Optimization (CP-SAT)
├── Model building (4-phase approach)
├── Constraint addition (hard → soft)
├── Objective function definition
└── Solver execution

Level 3: Post-processing
├── Solution validation
├── Quality metrics calculation
├── User preference adjustment
└── Manual override support
```

## 4. Değerlendirme Çerçevesi

### 4.1. Performans Metrikleri

**Teknik Performans:**
```
Solve Time: T_solve ≤ 60 seconds
Memory Usage: M_usage ≤ 2 GB
Success Rate: S_rate ≥ 95%
Scalability: Linear growth O(n×m)
```

**Çözüm Kalitesi:**
```
Shift Coverage: C_shift ≥ 90%
Preference Satisfaction: P_sat ≥ 70%
Workload Balance: W_balance = 1 - (max_load - min_load)/avg_load
Constraint Violation: V_hard = 0, V_soft ≤ 5%
```

**Kullanıcı Deneyimi:**
```
Task Completion Rate: T_completion ≥ 95%
User Satisfaction Score: U_satisfaction ≥ 4.0/5.0
Learning Curve: L_curve ≤ 2 hours
Error Rate: E_rate ≤ 2%
```

### 4.2. Test Metodolojisi

**Test Piramidi:**
```
Unit Tests (70%)
├── Algorithm correctness
├── Data validation
├── API endpoint testing
└── Component functionality

Integration Tests (20%)
├── API-Database integration
├── Frontend-Backend communication
├── n8n workflow execution
└── End-to-end data flow

System Tests (10%)
├── Performance testing
├── Load testing
├── Security testing
└── User acceptance testing
```

**Benchmark Scenarios:**
1. **Small Scale:** 25 çalışan, 56 vardiya (hastane)
2. **Medium Scale:** 40 çalışan, 84 vardiya (çağrı merkezi)
3. **Large Scale:** 80 çalışan, 200+ vardiya (stress test)
4. **Edge Cases:** Minimal availability, conflicting constraints

### 4.3. Başarı Kriterleri

**Quantitative Metrics:**
- Optimizasyon süresi: Manuel (4-6 saat) → Otomatik (<2 dakika)
- Çözüm kalitesi: %85+ constraint satisfaction
- Kullanıcı memnuniyeti: 4.0+/5.0 rating
- System uptime: %99.5+ availability

**Qualitative Assessments:**
- Kullanım kolaylığı ve öğrenme eğrisi
- Sistem güvenilirliği ve hata toleransı
- Esneklik ve konfigürasyon kolaylığı
- Gelecek geliştirmeler için genişletilebilirlik

Bu metodolojik yaklaşım, projenin bilimsel rigor ile pratik uygulanabilirlik arasında denge kurmasını sağlamakta ve akademik standartlarda bir çözüm geliştirme sürecini garanti etmektedir.
