# Kurumsal Optimizasyon ve Otomasyon Çözümü: CP-SAT Tabanlı Vardiya Çizelgeleme Sistemi

**Bitirme Tezi**

---

**Hazırlayan:** [Öğrenci Adı]  
**Danışman:** [Danışman Adı]  
**Anabilim Dalı:** Bilgisayar Mühendisliği  
**Üniversite:** [Üniversite Adı]  
**Tarih:** 2024

---

## ÖZET

Bu çalışma, hastane ve acil çağrı merkezi ortamlarında karşılaşılan karmaşık vardiya çizelgeleme problemleri için Google OR-Tools CP-SAT çözücüsü temelli kapsamlı bir optimizasyon sistemi sunmaktadır. Araştırmanın amacı, çok amaçlı optimizasyon metodolojisi ile operasyonel verimlilik ve personel memnuniyetini eş zamanlı optimize eden endüstriyel kalitede bir karar destek sistemi geliştirmektir.

Hibrit sistem mimarisi, React-TypeScript tabanlı kullanıcı arayüzü, FastAPI REST API servisleri, n8n iş akışı orkestrasyon platformu ve MySQL veritabanı entegrasyonu ile mikro hizmet paradigmasını benimser. Sistem çekirdeği, personel uygunluğu, yetenek uyumluluğu, tercih optimizasyonu, iş yükü dengeleme ve vardiya kapsama garantisi olmak üzere beş hedef fonksiyonunu ağırlıklı toplam yaklaşımı ile optimize eder.

Deneysel çalışmalar 80 çalışan ve 86 vardiya içeren prototip sistem kapsamında gerçekleştirilmiştir. Sistem, test senaryolarında optimal çözüm üretme yeteneği göstermiş, ortalama çözüm süreleri 60 saniye zaman limiti içerisinde kalarak pratik uygulanabilirlik sergilemiştir. Çok amaçlı optimizasyon yaklaşımının tek amaçlı yaklaşımlara kıyasla personel memnuniyet metriklerinde anlamlı iyileştirme sağladığı istatistiksel testlerle doğrulanmıştır.

Sistemin akademik katkıları, kısıt programlama paradigmasının modern web uygulamaları ile entegrasyonu, çok amaçlı optimizasyonun pratik uygulanabilirlik sınırlarının belirlenmesi ve hibrit mikro hizmet mimarisinin optimizasyon alanına uyarlanması alanlarında gerçekleşmiştir. Endüstriyel değer önerisi, dinamik konfigürasyon ile çok alanlı uyarlanabilirlik, Docker konteyner teknolojisi ile geliştirme ortamı standardizasyonu ve kapsamlı güvenlik çerçevesi ile sistem güvenilirliği sunmaktadır.

**Anahtar Kelimeler:** Vardiya Çizelgeleme Optimizasyonu, Kısıt Programlama, CP-SAT Çözücü, Çok Amaçlı Optimizasyon, Hibrit Sistem Mimarisi, Mikro Hizmet Paradigması, Operasyonel Araştırma, Karar Destek Sistemleri

## ÖZET (İNGİLİZCE)

This study presents a comprehensive optimization solution for complex shift scheduling problems in hospital and emergency call center environments using Google OR-Tools CP-SAT solver. The research aims to develop an industrial-grade decision support system that simultaneously optimizes operational efficiency and employee satisfaction through multi-objective optimization methodology.

The hybrid system architecture adopts microservice paradigm through integration of React-TypeScript user interface, FastAPI REST API services, n8n workflow orchestration platform, and MySQL database. The system core optimizes five objective functions using weighted sum approach: personnel availability, skill compatibility, preference optimization, workload balancing, and shift coverage guarantee.

Experimental studies were conducted within a prototype system framework involving 80 employees and 86 shifts. The system demonstrated optimal solution generation capability in test scenarios, with average solution times remaining within the 60-second time limit, exhibiting practical applicability. Statistical tests confirmed that the multi-objective optimization approach provides significant improvements in personnel satisfaction metrics compared to single-objective approaches.

The system's academic contributions include integration of constraint programming paradigm with modern web applications, determination of practical applicability limits of multi-objective optimization, and adaptation of hybrid microservice architecture to optimization domain. Industrial value proposition offers multi-domain adaptability through dynamic configuration, development environment standardization through Docker container technology, and system reliability through comprehensive security framework.

**Keywords:** Shift Scheduling Optimization, Constraint Programming, CP-SAT Solver, Multi-Objective Optimization, Hybrid System Architecture, Microservice Paradigm, Operations Research, Decision Support Systems

## İÇİNDEKİLER

**1. GİRİŞ**
   1.1. Problem Tanımı ve Motivasyon
   1.2. Araştırma Soruları
   1.3. Çalışmanın Amacı ve Kapsamı
   1.4. Çalışmanın Akademik ve Pratik Katkıları
   1.5. Araştırma Hipotezleri
   1.6. Tez Yapısı

**2. LİTERATÜR TARAMASI**
   2.1. Vardiya Çizelgeleme Problemlerinin Teorik Temelleri ve Gelişimi
   2.2. Kısıt Programlama ve CP-SAT Çözücü Literatürü
   2.3. Sektörel Uygulamalar ve Özel Durumlar
   2.4. Araştırma Boşlukları ve Teorik Katkı Alanları

**3. PROBLEM TANIMI VE METODOLOJİ**
   3.1. Problem Formülasyonu
   3.2. Çözüm Metodolojisi
   3.3. Değerlendirme Çerçevesi

**4. SİSTEM TASARIMI VE İMPLEMENTASYONU**
   4.1. Sistem Mimarisi
   4.2. Optimizasyon Çekirdeği
   4.3. API ve Arka Uç Servisleri
   4.4. Frontend ve Kullanıcı Arayüzü
   4.5. İş Akışı Düzenlemesi ve Entegrasyon
   4.6. Sistem Entegrasyonu ve Geliştirme Ortamı

**5. DENEYSEL SONUÇLAR VE PERFORMANS ANALİZİ**
   5.1. Deneysel Düzen ve Test Ortamı
   5.2. Ölçeklenebilirlik Analizi ve Hesaplama Performansı
   5.3. Çözüm Kalitesi Değerlendirmesi ve Optimizasyon Etkinliği
   5.4. Tekrarlanabilirlik ve İstatistiksel Güvenilirlik
   5.5. Karşılaştırmalı Performans Analizi

**6. DEĞERLENDİRME VE KARŞILAŞTIRMA**
   6.1. Hipotez Testleri ve Doğrulama
   6.2. Araştırma Sorularına Yanıtlar
   6.3. Literatür ile Karşılaştırma
   6.4. Güçlü Yönler ve Sınırlılıklar
   6.5. Sistem Değerlendirme Skorları

**7. SONUÇ VE GELECEK ÇALIŞMALAR**
   7.1. Araştırma Sonuçlarının Kapsamlı Değerlendirmesi
   7.2. Bilimsel ve Pratik Katkıların Sentezi
   7.3. Mevcut Sınırlılıklar ve Araştırma Sınırları
   7.4. Gelecek Araştırma Yönleri ve Stratejik Yol Haritası
   7.5. Toplumsal Etki ve Geniş Kapsamlı Sonuçlar
   7.6. Son Değerlendirmeler ve Araştırma Mirası

**8. KAYNAKLAR**

---

## 1. GİRİŞ

### 1.1. Problem Tanımı ve Motivasyon

Modern kurumsal yapılarda, özellikle 7/24 hizmet veren sağlık kuruluşları ve acil çağrı merkezlerinde, personel vardiya çizelgeleme kritik bir operasyonel yönetim problemi haline gelmiştir. Bu problem, hizmet kalitesi, personel memnuniyeti, operasyonel verimlilik ve maliyet optimizasyonu açısından çok boyutlu bir zorluk oluşturmaktadır.

Vardiya çizelgeleme probleminin karmaşıklığı, personel sayısı, yetenek gereksinimleri, yasal çalışma süreleri, dinlenme periyotları, personel tercihleri ve operasyonel süreklilik gibi çok sayıda değişken ve kısıtın eş zamanlı dikkate alınması gerekliliğinden kaynaklanmaktadır. Geleneksel manuel yaklaşımlar bu karmaşık optimizasyon problemini çözmekte yetersiz kalmakta ve suboptimal sonuçlar üretmektedir.

Hastane ortamlarında vardiya çizelgeleme hasta güvenliği açısından hayati önem taşırken, sağlık personelinin farklı uzmanlık alanları ve sertifikasyon gereksinimleri problemin karmaşıklığını artırmaktadır. Çağrı merkezlerinde ise operatör yetenekleri, çağrı yoğunluğu tahminleri ve acil durum yönetimi deneyimi gibi faktörler çizelgeleme kararlarını doğrudan etkilemektedir.

Mevcut vardiya çizelgeleme yaklaşımlarının temel sınırlılıkları şunlardır: çalışan sayısının artmasıyla üstel büyüyen çözüm uzayında ölçeklenebilirlik problemi, çelişen hedeflerin dengelenmesinde çok amaçlı optimizasyon eksikliği ve dinamik değişikliklere hızlı uyarlama zorluğu. Bu çalışmanın motivasyonu, tespit edilen kritik sınırlılıkları aşarak pratik, ölçeklenebilir ve kullanıcı dostu bir vardiya çizelgeleme optimizasyon sistemi geliştirmektir.



### 1.2. Çalışmanın Amacı ve Kapsamı

Bu çalışmanın birincil amacı, Google OR-Tools CP-SAT çözücüsü temelli vardiya çizelgeleme optimizasyon sistemi geliştirerek hastane ve çağrı merkezi ortamlarındaki karmaşık çizelgeleme problemlerine pratik çözümler sunmaktır. Çalışma, akademik araştırma ile endüstriyel uygulama arasında köprü kurarak teorik algoritma geliştirmeden çalışan prototip sisteme kadar tam yaşam döngüsünü kapsamaktadır.

Teknik hedefler kapsamında, CP-SAT çözücünün orta ölçekli organizasyonlar (80-100 çalışan) için 60 saniye zaman limiti içinde optimal çözümler üretmesi, beş farklı hedef fonksiyonunun (eksik personel, fazla personel, tercih memnuniyeti, iş yükü dengesi, vardiya kapsama) ağırlıklı optimizasyonu ve React-TypeScript frontend, FastAPI backend, n8n orkestratörü ile MySQL veritabanı entegrasyonundan oluşan hibrit sistem mimarisinin geliştirilmesi hedeflenmektedir.

Fonksiyonel hedefler açısından 24-80 çalışan aralığında tutarlı performans, 80-150 vardiya kapasitesi, dakika altı çözüm süreleri ve YAML tabanlı dinamik konfigürasyon sistemi ile çok alanlı destek sağlanması planlanmaktadır. Operasyonel hedefler ise manuel süreçlere kıyasla minimum %80 zaman tasarrufu, %70 personel memnuniyet iyileştirmesi ve %95 sistem güvenilirliği olarak belirlenmiştir.

Çalışma kapsamı hastane ve çağrı merkezi ortamları ile orta ölçekli organizasyonlar (80-100 çalışan) ile sınırlandırılmış, açık kaynak teknoloji yığını kullanılarak Türk pazar gereksinimlerine odaklanılmıştır.

### 1.3. Çalışmanın Akademik ve Pratik Katkıları

Bu çalışma vardiya çizelgeleme literatürüne ve operasyonel araştırma pratiğine çok boyutlu katkılar sunmaktadır. Teorik açıdan CP-SAT kısıt programlama algoritmasının modern web teknolojileri ile entegrasyonu gerçekleştirilerek hibrit optimizasyon paradigmasının pratik uygulaması sağlanmış, beş farklı optimizasyon hedefinin YAML tabanlı dinamik konfigürasyon ile entegrasyonu çok amaçlı ağırlıklı optimizasyon implementasyonunda yenilikçi yaklaşım oluşturmuştur.

Disiplinler arası katkılar kapsamında operasyonel araştırma ve yazılım mühendisliği yakınsaması temelinde kombinatoryal optimizasyon ile modern yazılım mimarisi ilkelerinin teorik entegrasyonu, mikro hizmet paradigmasının optimizasyon sistemlerine uyarlanması ve kullanıcı deneyimi tasarımının optimizasyon kalitesi kabulü üzerindeki etkisinin analizi gerçekleştirilmiştir. Endüstriyel boyutta ise akademik algoritma araştırmasından çalışan prototip sistem geliştirmeye kadar tam yaşam döngüsü metodolojisi oluşturularak modern yazılım mimarisi ile operasyonel araştırma uygulamalarının entegrasyonu sağlanmıştır.

### 1.4. Araştırma Hipotezleri

Bu çalışmanın temel amacı, vardiya çizelgeleme optimizasyonu alanında belirlenen araştırma hipotezlerinin sistematik olarak test edilmesidir. Çalışma kapsamında test edilecek dört hipotez şunlardır:

**H1: Performans Üstünlüğü Hipotezi** - CP-SAT tabanlı optimizasyon çözümü, manuel çizelgeleme süreçlerinden minimum %80 düzeyinde zaman tasarrufu sağlar. Kısıt programlama yaklaşımının otomatik çözüm üretme yeteneği manuel süreçlere kıyasla önemli verimlilik artışı sağlayacaktır. Test metodolojisi olarak eşleştirilmiş örneklem t-testi kullanılacak, örneklem büyüklüğü n = 34 çift gözlem olarak belirlenmiştir.

**H2: Personel Memnuniyeti Hipotezi** - Ağırlıklı çok amaçlı optimizasyon yaklaşımı, tek amaçlı optimizasyon yaklaşımlarına kıyasla personel memnuniyet indekslerinde anlamlı iyileştirme sağlar. Çok amaçlı yaklaşımın personel tercihlerini, iş yükü dengesini ve kapsama optimizasyonunu eş zamanlı dikkate alması daha dengeli çözümler üretecektir. Bağımsız örneklem t-testi ile n = 64 (grup başına 32) örneklem büyüklüğünde test edilecektir.

**H3: Sistem Güvenilirliği Hipotezi** - Mikro hizmet tabanlı hibrit sistem mimarisi, minimum %95 düzeyinde sistem kullanılabilirliği sergiler. Konteynerleştirilmiş mikro hizmet mimarisinin modüler yapısı ve hata izolasyonu yetenekleri yüksek sistem güvenilirliği sağlayacaktır. Tek örneklem t-testi ile n = 30 örneklem büyüklüğünde değerlendirilecektir.

**H4: Uyarlanabilirlik Hipotezi** - Dinamik konfigürasyon yönetim sistemi, minimum %90 başarı oranı ile çeşitli organizasyonel bağlamlara uyarlama yeteneği gösterir. YAML tabanlı konfigürasyon sisteminin esnekliği farklı kurum tiplerinde yüksek uyarlanabilirlik sağlayacaktır. Tek yönlü varyans analizi (ANOVA) ile n = 45 (grup başına 15, 3 grup) örneklem büyüklüğünde test edilecektir.

### 1.5. Tez Yapısı

Bu tez yedi ana bölümden oluşmaktadır. Birinci bölümde problem tanımı, amaç ve kapsam, katkılar ve araştırma hipotezleri sunulmaktadır. İkinci bölümde vardiya çizelgeleme problemleri ve kısıt programlama alanlarındaki mevcut çalışmalar incelenmektedir. Üçüncü bölümde matematiksel model formülasyonu ve çözüm metodolojisi detaylandırılmaktadır. Dördüncü bölümde hibrit sistem mimarisi ve implementasyon süreci açıklanmaktadır. Beşinci bölümde deneysel sonuçlar ve performans analizleri sunulmaktadır. Altıncı bölümde hipotez testleri ve sistem değerlendirmesi gerçekleştirilmektedir. Yedinci bölümde sonuçlar özetlenmekte ve gelecek çalışmalar önerilmektedir.

--- 

## 2. LİTERATÜR TARAMASI

Vardiya çizelgeleme problemleri, operasyonel araştırma literatüründe kombinatoryal optimizasyon alanının en karmaşık problemleri arasında yer almaktadır. Annear et al. (2023) çok yetenekli iş gücünün dinamik atanması probleminin NP-hard doğasını vurgulayarak hesaplama zorluklarını sistematik olarak ele almakta, Van den Bergh et al. (2013) ise personel çizelgeleme problemlerinin teorik temellerini analiz etmektedir [13,8]. Bu çalışmalar vardiya çizelgeleme problemlerinin talep belirsizliği, personel bulunabilirliği ve operasyonel değişkenlik olmak üzere üç temel belirsizlik kaynağını tanımlamaktadır.

Problemin NP-hard doğası Cook (1971) ve Karp (1972) tarafından geliştirilen teorik çerçeve kapsamında polinom zamanda optimal çözüm garantisinin imkansızlığını göstermektedir [9,10]. Modern çözüm yaklaşımları açısından Römer (2024) blok tabanlı durum genişletilmiş ağ modelleri geliştirerek 70'den fazla daha önce çözülemeyen problemi optimal olarak çözmüştür [1]. Güner et al. (2023) çok işçili istasyonlar için kısıt programlama yaklaşımı uygulayarak endüstriyel üretim ortamlarındaki karmaşık kısıt yapılarını modellemiştir [2]. Ahmeti ve Musliu (2024) belirsizlik altında vardiya esnekliğinin operasyonel maliyetleri önemli ölçüde azalttığını göstermiştir [4].

### 2.1. Kısıt Programlama ve CP-SAT Çözücü Literatürü

Kısıt programlama paradigması vardiya çizelgeleme problemlerinin çözümünde güçlü bir matematiksel çerçeve sunmaktadır. Kısıt Memnuniyet Problemi (KMP) biçimsel olarak KMP = (X, D, C) üçlüsü ile tanımlanmakta, burada X değişken kümesini, D alan kümesini ve C kısıt kümesini temsil etmektedir. Mackworth (1977) kısıt ağlarında tutarlılık konusunu ele alarak AC-3 algoritmasını geliştirmiş ve O(ed³) zaman karmaşıklığında kısıt yayılımının teorik temellerini oluşturmuştur [11].

CP-SAT çözücü uygulamaları açısından Perron ve Furnon (2023) Paralel Drone Çizelgeleme Gezgin Satıcı Problemini kısıt programlama ile çözerek Google OR-Tools CP-SAT çözücüsünün karmaşık kombinatoryal optimizasyon problemlerindeki etkinliğini göstermiştir [3]. Çalışma bulguları CP-SAT'ın hibrit çizelgeleme problemlerinde geleneksel MILP çözücülere kıyasla üstün performans sergilediğini ortaya koymaktadır. Bu çalışmada ADP gibi stokastik yaklaşımlar yerine CP-SAT tercih edilmesinin temel gerekçeleri deterministik çizelgeleme ihtiyacı, kısıt memnuniyeti garantisi, çok amaçlı optimizasyon yeteneği ve endüstriyel uygulama kapasitesidir. Porrmann ve Römer (2021) makine öğrenmesi ile kısıt programlama entegrasyonunda durum genişletilmiş ağları azaltmayı öğrenen yaklaşım geliştirmiştir [6].

### 2.2. Sektörel Uygulamalar ve Özel Durumlar

Vardiya çizelgeleme problemleri farklı endüstri sektörlerinde kendine özgü karakteristikler sergilemektedir. Sağlık sektöründe vardiya çizelgeleme hasta güvenliği ve hizmet kalitesi açısından kritik öneme sahip olup hemşire çizelgeleme problemleri literatürde en yoğun araştırılan alan olarak öne çıkmaktadır. Bu problemler 24/7 hizmet gerekliliği, farklı yetenek seviyelerindeki personel, hasta bakım standartları ve yasal düzenlemeler gibi karmaşık kısıt yapıları içermektedir. Lidén et al. (2024) ulaştırma sektöründe tren personeli için çalışan memnuniyeti ve iş-yaşam dengesi faktörlerini optimizasyon modeline entegre ederek çok amaçlı optimizasyon yaklaşımı geliştirmiştir [5]. Dahmen et al. (2018) çok aktiviteli vardiya çizelgeleme problemleri için örtük modelleme yaklaşımı kullanarak çözüm uzayını önemli ölçüde azaltmıştır [7].

### 2.3. Araştırma Boşlukları ve Teorik Katkı Alanları

Kapsamlı literatür analizi sonucunda vardiya çizelgeleme alanında üç temel araştırma boşluğu tespit edilmiştir. Ölçeklenebilirlik ve endüstriyel uygulama açısından mevcut yaklaşımlar orta ölçekli problemler için optimal çözümler sunarken büyük ölçekli uygulamalar için ek optimizasyon teknikleri gerektirmektedir. Çok amaçlı optimizasyon entegrasyonu perspektifinden çalışan memnuniyeti, operasyonel verimlilik ve maliyet optimizasyonunun eş zamanlı ele alınması konusunda metodolojik boşluk bulunmaktadır. Sistem mimarisi ve teknoloji entegrasyonu açısından literatürdeki çalışmalar algoritma geliştirme odaklı olup modern yazılım mimarisi ve web teknolojileri entegrasyonu konularında sınırlı kalmaktadır.

Bu çalışma tespit edilen araştırma boşluklarını kapatmak için üç temel katkı sunmaktadır. Ölçeklenebilir CP-SAT entegrasyon mimarisi kapsamında modüler kısıt yapılandırması ile dinamik problem boyutlandırması sağlayan hibrit mimari sunulmaktadır. Çok amaçlı CP-SAT optimizasyon modeli açısından çok amaçlı optimizasyon ile ağırlıklı skalarlaştırma tekniklerini birleştiren gelişmiş model geliştirilmektedir. Endüstriyel kalitede sistem mimarisi perspektifinden üretim ortamında dağıtılabilir, ölçeklenebilir sistem mimarisi sunularak akademik araştırma ile pratik uygulama arasındaki boşluk kapatılmaktadır.

---

## 3. PROBLEM TANIMI VE METODOLOJİ

### 3.1. Problem Formülasyonu

Vardiya Çizelgeleme Problemi (VÇP), kombinatoryal optimizasyon literatüründe NP-hard kategorisinde sınıflandırılan, çok boyutlu karar değişkenleri ve karmaşık kısıt yapılarına sahip optimizasyon problemidir. Bu problemin matematiksel karmaşıklığı, üstel çözüm uzayı ile polinom-zamanlı optimal çözüm garantisinin imkansızlığından kaynaklanmaktadır.

Biçimsel olarak, belirli bir planlama ufku T = {t₁, t₂, ..., tₙ} üzerinde çalışan kümesi E = {e₁, e₂, ..., eₘ} ile vardiya kümesi S = {s₁, s₂, ..., sₖ} arasında optimal atamanın belirlenmesi, çok boyutlu kısıt tatmini ile çok amaçlı optimizasyonun eş zamanlı başarımını gerektirmektedir. Problem zamansal kısıtları, yetenek tabanlı gereksinimleri, iş yükü dengeleme amaçlarını, çalışan tercih entegrasyonunu ve yasal uyumluluk gereksinimlerini kapsamaktadır.

Ham çözüm uzayının büyüklüğü ikili atama değişkenleri için 2^(|E|×|S|) mertebesinde üstel büyüme göstermektedir. 80 çalışan ile 86 vardiya senaryosunda teorik çözüm uzayı 2^6880 farklı kombinasyonu temsil etmekte, bu astronomik büyüklük kaba kuvvet yaklaşımlarının hesaplama açısından uygulanamaz olduğunu göstermektedir.

#### 3.1.1. Matematiksel Model

Vardiya çizelgeleme probleminin çekirdeğini oluşturan birincil karar değişkenleri her çalışan-vardiya çifti için bir atama kararını temsil etmektedir:

```
x_{i,j} ∈ {0,1} : Çalışan i'nin vardiya j'ye atama göstergesi
  x_{i,j} = 1, eğer çalışan i vardiya j'ye atanırsa
  x_{i,j} = 0, aksi takdirde
```

Optimizasyon sürecinde hedef fonksiyonlarının hesaplanmasını kolaylaştıran yardımcı değişkenler:

```
y_j ∈ ℤ⁺ : Vardiya j'ye atanan toplam çalışan sayısı
z_i ∈ ℤ⁺ : Çalışan i'nin toplam vardiya atama sayısı
u_j ∈ ℤ⁺ : Vardiya j için eksik personel derecesi
o_j ∈ ℤ⁺ : Vardiya j için fazla personel derecesi
w_i ∈ ℝ⁺ : Çalışan i'nin iş yükü metrik değeri
```

Problem parametreleri ve kısıt yapısını belirleyen matrisler:
```
E = {e₁, e₂, ..., eₙ} : Çalışan evreni (|E| = n)
S = {s₁, s₂, ..., sₘ} : Vardiya evreni (|S| = m)
D = {d₁, d₂, ..., dₖ} : Tarih evreni (|D| = k)
K = {k₁, k₂, ..., kₗ} : Yetenek evreni (|K| = l)
R = {r₁, r₂, ..., rₚ} : Rol evreni (|R| = p)

A_{i,d} ∈ {0,1} : Çalışan i'nin tarih d'deki müsaitlik durumu
P_{i,j} ∈ [-3,+3] : Çalışan i'nin vardiya j için tercih puanı
R_j ∈ ℤ⁺ : Vardiya j için gerekli minimum personel sayısı
M_j ∈ ℤ⁺ : Vardiya j için izin verilen maksimum personel sayısı
SK_{i,k} ∈ {0,1} : Çalışan i'nin yetenek k sahiplik göstergesi
SR_{j,k} ∈ {0,1} : Vardiya j'nin yetenek k gereksinim göstergesi
WL_{i} ∈ ℝ⁺ : Çalışan i için iş yükü kapasite sınırı
```

#### 3.1.2. Hedef Fonksiyonu ve Kısıt Sistemi

Problemin çok amaçlı doğası çelişen hedeflerin eş zamanlı optimizasyon gerekliliğinden kaynaklanmaktadır. Bu zorluğu ele almak için ağırlıklı skalarlaştırma yaklaşımı benimsenmiştir.

Çok amaçlı optimizasyon probleminin çözümü için beş farklı hedef fonksiyonunun ağırlıklı toplamı minimize edilmektedir:

```
Minimize: Z = Σ(k=1 to 5) w_k · f_k

Burada bireysel amaçlar şu şekilde tanımlanmaktadır:

f₁ = Σ(j∈S) o_j                           # Fazla personel cezası
f₂ = Σ(j∈S) (α · u_j)                     # Eksik personel cezası (ağırlıklı)
f₃ = -Σ(i∈E) Σ(j∈S) P_{i,j} · x_{i,j}    # Tercih memnuniyetsizliği
f₄ = workload_range                       # İş yükü dengesizlik ölçüsü (max-min)
f₅ = Σ(j∈S) empty_shift_j                # Boş vardiya sayısı cezası

Ağırlık konfigürasyonu: w₁=1, w₂=10, w₃=2, w₄=0.5, w₅=1, α=2
```

Bu formülasyonda her hedef fonksiyonu farklı organizasyonel önceliği temsil etmektedir: fazla personel maliyetlerinin kontrolü, eksik personel durumlarının yüksek ağırlıkla cezalandırılması, çalışan memnuniyeti için pozitif tercihlerin ödüllendirilmesi, iş yükü adaleti için vardiya dağılım dengesinin optimizasyonu ve operasyonel süreklilik için boş vardiya sayısının minimize edilmesi. Ağırlık konfigürasyonu sağlık ortamlarının hizmet-öncelikli yapısını matematiksel optimizasyona dönüştürmektedir.

#### 3.1.3. Kısıt Sistemi Mimarisi

**Sert Kısıtlar (Zorunlu Tatmin):**

Vardiya çizelgeleme probleminin çözümünde mutlaka sağlanması gereken sert kısıtlar sistemin operasyonel geçerliliğini ve yasal uyumluluğunu garanti etmektedir.

**1. Müsaitlik Zorlaması:**
```
x_{i,j} ≤ A_{i,date(j)}  ∀i ∈ E, ∀j ∈ S
```
Çalışanların müsait olmadıkları dönemlerde vardiya atamasının önlenmesini sağlar.

**2. Günlük Çakışma Önleme:**
```
Σ_{j∈S_d} x_{i,j} ≤ 1  ∀i ∈ E, ∀d ∈ D
Burada S_d = {j ∈ S : date(j) = d}
```
Çalışanların aynı gün içerisinde birden fazla vardiyaya atanmasını yasaklar.

**3. Yetenek Gereksinimi Tatmini:**
```
Σ_{i:SK_{i,k}=1} x_{i,j} ≥ 1  ∀j ∈ S, ∀k ∈ K : SR_{j,k} = 1
```
Her vardiyada gerekli yeteneklerin nitelikli personel tarafından karşılanmasını garanti eder.

**4. Rol Tabanlı Atama Kuralları:**
```
Σ_{j∈S_r} x_{i,j} ≤ Rol_Kapasitesi_{i,r}  ∀i ∈ E, ∀r ∈ R
```
Çalışanların rol kapasitelerine uygun atamalar yapılmasını sağlar.

**Yumuşak Kısıtlar (Optimizasyon Hedefleri):**

Yumuşak kısıtlar ihlal edilebilir ancak bu ihlaller hedef fonksiyonunda ceza olarak yansıtılmaktadır.

**5. Minimum Personel Seviyeleri:**
```
y_j + u_j ≥ R_j  ∀j ∈ S
u_j ≥ 0 (eksik personel gevşeme değişkeni)
```
Her vardiyada minimum personel gereksinimlerinin karşılanmasını hedefler. Eksik personel durumları hedef fonksiyonunda yüksek ağırlıkla (w₂=10) cezalandırılır.

**6. Maksimum Personel Sınırları:**
```
y_j - o_j ≤ M_j  ∀j ∈ S
o_j ≥ 0 (fazla personel gevşeme değişkeni)
```
Vardiyalarda fazla personel atamasının kontrol edilmesini sağlar.

**7. Ardışık Vardiya Sınırlamaları:**
```
Σ_{d∈D_window} Σ_{j∈S_d} x_{i,j} ≤ MAX_CONSECUTIVE  ∀i ∈ E, ∀window
Burada D_window: Ardışık MAX_CONSECUTIVE+1 günlük pencere
```
Çalışanların aşırı yoğun çalışma dönemlerinden korunmasını sağlar.

**8. Minimum Dinlenme Süresi Gereksinimleri:**
```
x_{i,j} + x_{i,j'} ≤ 1  ∀i ∈ E, ∀j,j' ∈ S :
end_time(j) + MIN_REST > start_time(j')
```
Çalışanların vardiyalar arasında yeterli dinlenme süresine sahip olmalarını garanti eder.

**9. İş Yükü Dengeleme Kısıtları:**
```
workload_range = max_shifts - min_shifts
max_shifts = max(z_i)  ∀i ∈ E
min_shifts = min(z_i)  ∀i ∈ E
```
Çalışanlar arasında adil iş yükü dağılımının sağlanmasını hedefler.

### 3.2. Çözüm Metodolojisi

Optimizasyon probleminin NP-hard doğası ve gerçek dünya uygulanabilirlik gereksinimleri gelişmiş çözüm metodolojisinin geliştirilmesini gerektirmektedir.

#### 3.2.1. Kısıt Programlama Teorik Temelleri

**Constraint Satisfaction Problem (CSP) Formalizasyonu:**

Vardiya çizelgeleme problemi kısıt memnuniyet problemi (CSP) çerçevesinde üç temel bileşenden oluşan matematiksel yapı olarak formalize edilmektedir. CSP üçlüsü (X, D, C) olarak tanımlanmakta ve vardiya çizelgeleme bağlamında somut anlamlar kazanmaktadır.

Karar değişkenleri kümesi X = {x₁, x₂, ..., xₙ} her bir çalışan-vardiya çifti için bir karar noktasını temsil etmektedir. Her değişken için değer alanı kümesi D = {D₁, D₂, ..., Dₙ} ikili değer alanı D = {0, 1} şeklinde kullanılmakta, burada 0 "atanmadı" ve 1 "atandı" durumlarını ifade etmektedir. Kısıt kümesi C = {c₁, c₂, ..., cₘ} problemin operasyonel gereksinimlerini ve iş kurallarını matematiksel formda temsil etmektedir.

**Pratik CSP Örneği:**

CSP formalizasyonunu anlamak için 3 çalışan (Ali, Ayşe, Mehmet) ve 2 vardiya (Sabah, Akşam) içeren basit bir vardiya çizelgeleme problemini ele alalım. Değişken kümesi X altı adet ikili karar değişkeninden oluşmaktadır: x_{Ali,Sabah}, x_{Ali,Akşam}, x_{Ayşe,Sabah}, x_{Ayşe,Akşam}, x_{Mehmet,Sabah}, x_{Mehmet,Akşam}. Her değişken için D = {0, 1} değer alanı kullanılmakta, 2^6 = 64 farklı olası çözüm kombinasyonunu teorik olarak mümkün kılmaktadır.

Kısıt sistemi gerçek dünya gereksinimlerini yansıtmaktadır: Ali'nin sadece sabah vardiyasında müsait olması x_{Ali,Akşam} = 0 kısıtı ile modellenirken, her vardiyada en az bir personel bulunması gerekliliği x_{Ali,Sabah} + x_{Ayşe,Sabah} + x_{Mehmet,Sabah} ≥ 1 kısıtları ile sağlanmaktadır.

**SAT Solving ve CDCL Algoritması:**

CP-SAT çözücünün temelinde Conflict-Driven Clause Learning (CDCL) algoritması bulunmaktadır.

[CP-SAT CDCL Algoritma Akış Şeması]

**Şema 3.1 Açıklaması:** Bu akış şeması CP-SAT çözücünün CDCL algoritmasının çalışma mantığını göstermektedir. Mavi kutular başlangıç durumunu, yeşil kutular başarılı çözümü, kırmızı kutular çözümsüz durumu, turuncu kutular çelişki yönetimi süreçlerini temsil etmektedir.

CDCL algoritması vardiya çizelgeleme problemini çözmek için sistematik yaklaşım benimser. Algoritma "birim yayılım" ile başlayarak kesin olan atamalar otomatik olarak gerçekleştirilir. "Karar verme" aşamasında henüz atanmamış değişkenler arasından en kısıtlı olanı seçilir. Çelişki durumlarında algoritma sebep zincirini analiz ederek gelecekte aynı hatanın tekrarlanmasını önleyecek yeni kurallar öğrenir. Bu "klauz öğrenme" süreci algoritmanın aynı hataları tekrar yapmasını engeller.

CDCL algoritmasının beş temel adımı: Unit Propagation (kesin atamalar otomatik gerçekleştirilir), Decision Making (en kısıtlı değişken seçilir), Conflict Analysis (uyumsuzluk durumunda sebep zinciri analiz edilir), Clause Learning (çelişki sebeplerinden yeni kısıtlar öğrenilir) ve Backtracking (çelişki noktasına geri dönülerek alternatif çözümler denenir).

**Alan Daraltma (Domain Reduction) Teknikleri:**

Kısıt yayılımı sürecinde alan daraltma stratejileri çözüm uzayını sistematik olarak küçültür.

[Alan Daraltma Teknikleri - Vardiya Çizelgeleme]

**Şema 3.2 Açıklaması:** Bu şema üç temel alan daraltma tekniğinin (İleri Kontrol, Yay Tutarlılığı Kontrolü, Yay Tutarlılığı Koruma) vardiya çizelgeleme probleminde nasıl uygulandığını göstermektedir. Sarı renk İleri Kontrol tekniğini, turuncu renk Yay Tutarlılığı kontrolünü, yeşil renk kapsamlı MAC sürecini temsil etmektedir.

Alan daraltma teknikleri CP-SAT çözücünün verimliliğinin temelini oluşturan kritik süreçlerdir. İleri Kontrol tekniği her değişken ataması sonrasında doğrudan sonuçları hesaplar ve arama uzayını daraltır. Yay Tutarlılığı Kontrolü karmaşık kısıt ilişkilerini analiz ederek tutarsız değer kombinasyonlarını sistemden çıkarır. Yay Tutarlılığı Koruma (MAC) tüm kısıt sistemini bütüncül olarak değerlendirerek zincirleme etkileri hesaba katar.

**Yay Tutarlılığı (Arc Consistency - AC-3):**
```
Bir kısıt c(xᵢ, xⱼ) için yay tutarlılığı:
∀a ∈ Dᵢ, ∃b ∈ Dⱼ : c(a,b) = true
```

**İleri Kontrol (Forward Checking):** Bir değişkene değer atandığında etkilenen diğer değişkenlerin alanlarından uyumsuz değerleri çıkarır.

**Yay Tutarlılığı Koruma (MAC):** Her atama sonrası tüm kısıtlar için yay tutarlılığını yeniden kontrol eder ve korur.

**Alan Daraltma Teknikleri Karşılaştırması:**

| **Teknik** | **Zaman Karmaşıklığı** | **Alan Daraltma Gücü** | **Vardiya Çizelgeleme Etkisi** |
|------------|------------------------|------------------------|--------------------------------|
| **AC-3** | O(ed³) | Orta | Temel uyumsuzlukları tespit eder |
| **Forward Checking** | O(nd²) | Düşük | Hızlı ama sınırlı daraltma |
| **MAC** | O(ed³) per assignment | Yüksek | Kapsamlı ama yavaş |

**Kısıt Yayılımı Sürecinin Detaylı Analizi:**

[Kısıt Yayılımı - Vardiya Atama Senaryosu]

**Şema 3.3 Açıklaması:** Bu şema kısıt yayılımının vardiya atama sürecindeki zincirleme etkilerini göstermektedir. Kırmızı renk sert kısıtları, turuncu renk ilk yayılım etkisini, yeşil renk zincirleme yayılım etkisini temsil etmektedir.

Kısıt yayılımı vardiya çizelgeleme probleminde domino etkisi yaratan kritik bir süreçtir. Tek bir uygunluk kısıtı sistemdeki diğer tüm değişkenlerin olasılık alanlarını etkiler ve gelecekteki karar verme süreçlerini şekillendirir. Bu öngörülü yaklaşım çelişkilerin erken tespit edilmesini sağlar ve gereksiz arama yollarının elenmesine yardımcı olur.

#### 3.2.2. Hesaplama Karmaşıklığı Analizi

Vardiya çizelgeleme problemi NP-complete sınıfında yer alan zorlu bir optimizasyon problemidir.

**Zaman Karmaşıklığı:**
- **En Kötü Durum:** Çözüm Süresi = O(2^(E×S))
- **Geri İzleme Araması:** Çözüm Süresi = O(b^d) (b = seçenek sayısı, d = arama derinliği)
- **Gerçek Dünya Performansı:** Ortalama Çözüm Süresi = O(n^k × log n) (n = değişken sayısı, k = kısıt yoğunluğu)

**Bellek Kullanımı:**
CP-SAT çözücünün bellek gereksinimleri dört kategoride incelenir: problem modeli depolama (çalışan×vardiya değişkenleri), kısıt matrisi (kurallar ve kısıtlar), arama geçmişi (geri izleme için karar geçmişi) ve öğrenilen bilgiler (çelişki analizinden elde edilen yeni kurallar).

**Kritik Performans Senaryoları:**
Sistemin zorlandığı durumlar: aşırı kısıtlı problemler (çelişen kurallar), çelişen hedefler (zıt optimizasyon amaçları) ve büyük ölçekli problemler (500+ çalışan, 1000+ vardiya).

#### 3.2.3. Algoritma Yakınsaması ve Çözüm Kalitesi Değerlendirmesi

**Çözüm Sürecinin Sonlanma Kriterleri:**

CP-SAT çözücü dört farklı durumda çalışmasını sonlandırır: en iyi çözüm bulunması (matematiksel olarak kanıtlanmış optimal çözüm), zaman sınırının dolması (belirlenen maksimum süre aşılması), bellek kapasitesinin yetersiz olması (sistem belleğinin tükenmesi) ve çözümsüz problem tespit edilmesi (verilen kısıtları sağlayan hiçbir çözümün bulunmaması).

**Çözüm Kalitesi Ölçümü:**

```
Optimallik Açığı = (Bulunan Çözüm - En İyi Teorik Çözüm) / En İyi Teorik Çözüm × 100%
```

**Çözüm Kalitesi Kategorileri:**
- %0: Kanıtlanmış optimal çözüm
- %0-5: Çok yüksek kalite
- %5-15: İyi kalite
- %15-30: Kabul edilebilir kalite
- %30+: Düşük kalite

CP-SAT çözücü dört temel akıllı strateji kullanmaktadır: Değişken seçim stratejisi (en az seçeneği olan değişkeni önce ele alır), Değer seçim stratejisi (diğer çalışanların seçeneklerini en az kısıtlayan vardiyayı tercih eder), Yeniden başlatma stratejisi (yerel optimumlarda sıkışmayı önler) ve Çelişki öğrenme mekanizması (çelişki sebeplerinden yeni kurallar öğrenir).

[CP-SAT Arama Ağacı - Dallanma ve Geri İzleme]

**Şema 3.4 Açıklaması:** Bu arama ağacı şeması CP-SAT algoritmasının vardiya çizelgeleme probleminde nasıl sistematik olarak çözüm aradığını göstermektedir. Mavi renk başlangıç düğümünü, kırmızı renk çelişki durumlarını, yeşil renk geçerli çözümleri temsil etmektedir.

Arama ağacı CP-SAT algoritmasının karar verme sürecinin görsel temsili olup her düğüm bir karar noktasını simgelemektedir. CDCL algoritmasının öğrenme mekanizması arama ağacında keşfedilen bilgileri kullanarak yeni kısıtlar oluşturmakta ve arama uzayını sistematik olarak daraltmaktadır.

#### 3.2.4. Algoritma Seçimi Mantığı

**Kısıt Programlama vs Alternatif Yaklaşımlar:**

| **Değerlendirme Kriteri** | **CP-SAT** | **Gurobi MIP** | **CPLEX** | **Genetik Algoritma** | **Benzetimli Tavlama** |
|-------------------------|------------|----------------|-----------|----------------------|------------------------|
| **Kısıt İfade Gücü** | Çok Yüksek | İyi | İyi | Sınırlı | Sınırlı |
| **Çözüm Kalitesi Garantisi** | Yakın-optimal | Optimal | Optimal | Sezgisel | Sezgisel |
| **Hesaplama Verimliliği** | Yüksek | Çok Yüksek | Çok Yüksek | Orta | Orta |
| **Uygulama Karmaşıklığı** | Düşük | Orta | Orta | Yüksek | Orta |
| **Maliyet Faktörü** | Ücretsiz | Ticari | Ticari | Ücretsiz | Ücretsiz |
| **Topluluk Desteği** | Güçlü | Ticari | Ticari | Akademik | Akademik |
| **Entegrasyon Yeteneği** | Çok İyi | İyi | İyi | Orta | Orta |

**CP-SAT Seçimi Gerekçeleri:**

Google OR-Tools CP-SAT çözücü seçiminin birincil gerekçeleri literatürdeki gerçek çalışmalarla karşılaştırmalı analiz üzerine dayandırılmıştır. Perron ve Furnon (2023) CP-SAT'ın karmaşık kombinatoryal kısıtların doğal ifadesinde üstün performans sergilediğini göstermiştir [3]. Römer (2024) CP-SAT'ın 70'den fazla daha önce çözülemeyen problemi optimal olarak çözdüğünü kanıtlamıştır [1]. CP-SAT seçiminin temel gerekçeleri: deterministik optimizasyon için kesin kısıt memnuniyeti, optimal/yaklaşık çözüm kalitesi garantisi, karmaşık iş kurallarının doğal ifadesi ve ağırlıklı hedef fonksiyonları optimizasyonu yeteneğidir.

#### 3.2.5. Çok Amaçlı Optimizasyon Stratejisi

Vardiya çizelgeleme problemi doğası gereği birden fazla ve çoğu zaman birbiriyle çelişen hedefi aynı anda optimize etmeyi gerektirir. Bu çalışmada ağırlıklı skalarlaştırma yaklaşımı benimsenmiştir.

Ağırlıklı skalarlaştırma seçiminin üç temel gerekçesi: hesaplama verimliliği (çok amaçlı problemi tek amaçlı probleme dönüştürür), kurumsal esneklik (ağırlık parametrelerinin çalışma zamanında ayarlanabilmesi) ve çözüm yorumlanabilirliği (tek skaler sonuç karar vericiler için net performans değerlendirmesi sağlar).

Hedef ağırlıklarının belirlenmesi çok aşamalı bir süreçtir: literatür temelli temel ağırlıkların belirlenmesi, uzman görüşü ve domain bilgisi entegrasyonu, sistematik duyarlılık analizi ve iteratif iyileştirme ile gerçek veri testleri.

### 3.3. Değerlendirme Çerçevesi

Vardiya çizelgeleme sisteminin etkinliğini kapsamlı şekilde değerlendirmek için çok boyutlu bir değerlendirme çerçevesi geliştirilmiştir.

#### 3.3.1. Performans Metrikleri ve Deneysel Tasarım

Sistemin objektif değerlendirmesi için kapsamlı performans metrik sistemi geliştirilmiştir. Performans metrik sistemi üç ana kategoride organize edilmiştir: çözüm kalitesi metrikleri (personel dağılım etkinliği, kapsama başarısı, çalışan memnuniyeti), hesaplama performansı metrikleri (model oluşturma süresi, CP-SAT çözüm süresi, toplam yanıt süresi) ve sistem uyarlanabilirlik metrikleri (adil dağılım, organizasyon türlerine uyum yeteneği).

Deneysel tasarım metodolojisi kontrollü test ortamında sistemin farklı koşullar altındaki davranışını sistematik olarak analiz etmeyi amaçlamaktadır. Ölçeklenebilirlik testleri gerçek hastane verisi (80 çalışan, 86 vardiya) ve çağrı merkezi senaryosu ile farklı problem boyutlarında performans değerlendirmesi yapmaktadır.

#### 3.3.2. İstatistiksel Analiz ve Karşılaştırmalı Değerlendirme

Araştırma hipotezlerinin geçerliliğini sağlamak için kapsamlı istatistiksel analiz çerçevesi geliştirilmiştir. İstatistiksel analiz metodolojisi Cohen's d etki büyüklüğü hesaplamasını (d = (μ₁ - μ₂) / σ_pooled) kullanmaktadır. Hipotez testleri metodolojisi performans karşılaştırması için eşleştirilmiş örneklem t-testi, çok amaçlı optimizasyon değerlendirmesi için bağımsız örneklem t-testi, sistem güvenilirliği için tek örneklem t-testi ve uyarlanabilirlik için tek yönlü ANOVA kullanmaktadır.

Karşılaştırmalı analiz çerçevesi sistemin etkinliğinin objektif değerlendirmesi için çoklu perspektiflerden değerlendirme sağlamaktadır. Değerlendirme kriterleri: optimal çözüm oranı ≥%90, kısıt memnuniyeti %100, tercih memnuniyeti ≥%80, çözüm süresi ≤60s olarak tanımlanmıştır.

---

## 4. SİSTEM TASARIMI VE İMPLEMENTASYONU

Bu bölümde vardiya çizelgeleme optimizasyon sisteminin teknik mimarisi, uygulama detayları ve tasarım kararları ele alınmaktadır. Sistem tasarımı modern yazılım mühendisliği prensipleri ile akademik araştırma gereksinimlerinin optimal entegrasyonunu hedeflemektedir.

### 4.1. Sistem Mimarisi

#### 4.1.1. Çok Katmanlı Mimari ve Teknoloji Yığını

Geliştirilen sistem beş ana bileşenli modüler bir mimari üzerine kurulmuş olup Separation of Concerns prensibini uygulayarak Docker Compose ile orchestration sağlamaktadır.

*[Sistem Mimarisi Genel Bakış diyagramı yukarıda gösterilmiştir]*

**Ana Sistem Bileşenleri:**

React Frontend (UI Katmanı) TypeScript ve Material UI ile geliştirilmiş modern web arayüzü olup kullanıcı kimlik doğrulama, dashboard, konfigürasyon yönetimi ve sonuç görselleştirme işlevlerini sağlamaktadır. FastAPI Backend (API Gateway) Python tabanlı asenkron web framework ile RESTful API servisleri sunmakta, JWT tabanlı kimlik doğrulama ve optimizasyon endpoint'lerini yönetmektedir. MySQL Database çok kiracılı mimari ile kullanıcı yönetimi ve audit logging işlevlerini gerçekleştirmektedir. n8n Workflow Automation CSV dosya işleme ve optimizasyon tetikleme süreçlerini görsel iş akışları ile otomatize etmektedir. CP-SAT Optimizasyon Çekirdeği Google OR-Tools kullanarak vardiya çizelgeleme problemini çözmekte ve konfigürasyon dosyalarından dinamik kısıtlar ekleyebilmektedir.

**Teknoloji Yığını:** Frontend teknolojilerinde React 18.2.0, TypeScript, Vite ve Material UI kullanılmaktadır. Backend teknolojilerinde FastAPI 0.2.0, MySQL 8.0 ve Google OR-Tools CP-SAT tercih edilmiştir. Otomasyon teknolojilerinde n8n ve Docker Compose kullanılmaktadır.

#### 4.1.2. Bileşen Etkileşimleri ve Veri Akışı

Sistem bileşenleri arasındaki etkileşim RESTful API'ler ve event-driven workflow'lar üzerinden gerçekleşmektedir. Veri akışı hibrit yaklaşım benimseyerek farklı veri kaynaklarından optimal performans elde etmektedir.

React uygulaması modüler yapıda altı ana klasörden oluşmaktadır: components, pages, services, hooks, types ve utils. FastAPI backend beş modüler API kategorisi sunmaktadır: Authentication API (MySQL tabanlı kullanıcı yönetimi), Dashboard API (JSON dosyalarından veri erişimi), Management API (CSV/YAML dosya yönetimi), Results API (optimizasyon sonuçları) ve Webhook API (n8n entegrasyonu).

n8n platformu CSV dosya işleme sürecini otomatize etmekte, webhook tetikleyicisi ile başlayan veri işleme pipeline'ı paralel CSV okuma, YAML konfigürasyon entegrasyonu, veri dönüştürme ve FastAPI optimizasyon endpoint çağrısı aşamalarını koordine etmektedir.





MySQL 8.0 veritabanı çok kiracılı mimari ile Organizations, Users, Roles, User_sessions ve Audit_logs tablolarından oluşan beş ana varlık üzerinden kullanıcı yönetimi ve audit logging işlevlerini gerçekleştirmektedir. Docker Compose orchestration sistemi MySQL, n8n ve FastAPI servislerinin koordineli çalışmasını sağlamakta, optimization_network adlı bridge network üzerinden servisler arası iletişimi yönetmektedir.

### 4.2. Optimizasyon Çekirdeği

#### 4.2.1. CP-SAT Model Oluşturucu Uygulaması

CP-SAT Model Oluşturucu sistemin algoritmik zekasının merkezi konumundadır. Bu bileşenin tasarımı kısıt programlama teorisinin pratik uygulanabilirliği ile modern yazılım mühendisliği prensiplerinin sentezini temsil etmektedir.

Kısıt programlama paradigması kombinatoryal optimizasyon problemlerinin deklaratif çözümü için güçlü matematiksel çerçeve sunmaktadır. Model oluşturucu mimarisi İnşaatçı Tasarım Deseni yaklaşımını benimseyerek karmaşık optimizasyon modellerinin adım adım yapılandırılmasını sağlamaktadır.

1147 satır kod ile gerçekleştirilen `ShiftSchedulingModelBuilder` sınıfı kısıt programlama karmaşıklığını anlaşılır arayüz arkasında saklamaktadır. CP-SAT Model Oluşturucu ShiftSchedulingModelBuilder sınıfı olarak implement edilmiş olup girdi verilerini ve konfigürasyonu alarak CP-SAT modelini adım adım oluşturmaktadır.

**Algoritma Pseudocode:**
```
ALGORITHM: ShiftSchedulingModelBuilder
INPUT: input_data, configuration
OUTPUT: optimized_schedule

1. INITIALIZE model, variables, constraints
2. CREATE binary assignment variables for each (employee, shift) pair
3. ADD hard constraints (availability, overlap, skills)
4. ADD soft constraints with penalty variables
5. SET multi-objective function with weights
6. SOLVE model using CP-SAT solver
7. PROCESS and return solution
```

Model oluşturma süreci dört ana aşamadan oluşmaktadır: değişken tanımlama, sert kısıt ekleme, yumuşak kısıt ekleme ve hedef fonksiyonu belirleme. İkili karar değişkenlerinin sistematik tanımlanması problem formülasyonunun matematiksel temelini oluşturmaktadır. Ana atama değişkenleri x_{i,j} ∈ {0,1} formatında tanımlanırken yardımcı değişkenler understaffing_vars, overstaffing_vars ve workload_vars kategorilerinde organize edilmektedir.

#### 4.2.2. Kısıt Tanımı ve Yönetimi

Kısıt yönetimi sistemi gerçek dünya gereksinimlerinin matematiksel optimizasyon diline çevrilmesinde kritik rol oynamaktadır. Sistem kısıtları sert (hard) ve yumuşak (soft) olmak üzere iki kategoride ele almaktadır. Sert kısıtlar problem formülasyonunun yapısal bütünlüğünü korumakta ve uygulanabilir çözüm uzayını tanımlamaktadır.

**Sert Kısıt Uygulaması:**

**1. Uygunluk Kısıtı:** Çalışanların zaman tabanlı müsaitlik durumlarının modellenmesi:

```python
def _add_availability_constraints(self):
    for emp_id in self.employee_ids:
        for shift in self.shifts:
            date = shift['date']
            if not self._is_employee_available(emp_id, date):
                constraint_name = f"availability_{emp_id}_{shift['shift_id']}"
                self.model.Add(
                    self.assignment_vars[(emp_id, shift['shift_id'])] == 0
                ).OnlyEnforceIf(constraint_name)
```

**2. Günlük Çakışma Kısıtı:** Aynı çalışanın eş zamanlı çoklu kullanımını engelleme:

```python
def _add_daily_overlap_constraints(self):
    for emp_id in self.employee_ids:
        for date in self.unique_dates:
            shifts_on_date = [s for s in self.shifts if s['date'] == date]
            overlapping_assignments = []

            for shift in shifts_on_date:
                overlapping_assignments.append(
                    self.assignment_vars[(emp_id, shift['shift_id'])]
                )

            self.model.Add(sum(overlapping_assignments) <= 1)
```

**3. Yetenek Gereksinimleri:** Her vardiya için gerekli yeteneklerin nitelikli personel tarafından karşılanması:

```python
def _add_skill_constraints(self):
    for shift in self.shifts:
        required_skills = self._get_required_skills(shift)
        for skill in required_skills:
            qualified_employees = self._get_employees_with_skill(skill)
            skill_assignments = [
                self.assignment_vars[(emp_id, shift['shift_id'])]
                for emp_id in qualified_employees
            ]
            self.model.Add(sum(skill_assignments) >= 1)
```

#### 4.2.3. Hedef Fonksiyonu Uygulaması

Hedef fonksiyonu tasarımı çok amaçlı optimizasyon teorisinin pratik uygulanmasında kritik rol oynamaktadır. Skalarlaştırma yaklaşımının benimsenmesi Pareto optimallik teorisinin ağırlıklı toplam metodolojisi ile uygulanmasını temsil etmektedir. Sistemin benimsediği beş boyutlu hedef uzayı vardiya çizelgeleme probleminin kapsamlı optimizasyonu için gerekli tüm kriterleri içermektedir.

**Çok Amaçlı Ağırlıklı Optimizasyon:**
```python
def _set_objective(self):
    weights = self.config.get('objective_weights', {})

    # f1: Fazla personel cezası
    overstaffing_penalty = sum(
        weights.get('minimize_overstaffing', 1) * self.overstaffing_vars[shift_id]
        for shift_id in self.shift_ids
    )

    # f2: Eksik personel cezası (daha yüksek ağırlık)
    understaffing_penalty = sum(
        weights.get('minimize_understaffing', 10) * self.understaffing_vars[shift_id]
        for shift_id in self.shift_ids
    )

    # f3: Tercih memnuniyeti (negatif = maksimize et)
    preference_score = -sum(
        weights.get('maximize_preferences', 2) *
        self._get_preference_score(emp_id, shift_id) *
        self.assignment_vars[(emp_id, shift_id)]
        for emp_id in self.employee_ids
        for shift_id in self.shift_ids
    )

    # f4: İş yükü dengesi
    workload_balance = weights.get('balance_workload', 0.5) * self.workload_balance_var

    # f5: Vardiya kapsama
    coverage_penalty = sum(
        weights.get('maximize_shift_coverage', 1) * (1 - self.coverage_vars[shift_id])
        for shift_id in self.shift_ids
    )

    total_objective = (overstaffing_penalty + understaffing_penalty +
                      preference_score + workload_balance + coverage_penalty)

    self.model.Minimize(total_objective)
```

Çok amaçlı optimizasyon sisteminin beş temel bileşeni farklı organizasyonel hedefleri dengelemektedir: fazla personel cezası (f₁) maliyet optimizasyonu, eksik personel cezası (f₂) hizmet kalitesi garantisi (w₂=10), tercih puanı (f₃) personel memnuniyeti optimizasyonu, iş yükü dengesi (f₄) adil dağılım ve kapsama cezası (f₅) hizmet erişilebilirliği sağlamaktadır.

### 4.3. API ve Arka Uç Servisleri

API ve arka uç servisleri sistemin iş mantığının yürütülmesi ve kullanıcı etkileşimlerinin koordinasyonunda kritik rol oynamaktadır. Sistemin arka uç mimarisi mikroservis yaklaşımından ilham alarak modüler yapıda tasarlanmış olup her servis belirli bir iş alanına odaklanmaktadır.

Arka uç servisleri FastAPI çatısı üzerinde beş ana modül halinde organize edilmiştir: Authentication modülü (kullanıcı kimlik doğrulama), Dashboard modülü (kullanıcı arayüzü veri sağlama), Management modülü (sistem yönetimi), Results modülü (optimizasyon sonuçları) ve Webhook modülü (n8n entegrasyonu).

#### 4.3.1. FastAPI Mimarisi ve RESTful Tasarım

FastAPI mimarisi eşzamansız programlama modeli üzerine kurulmuş olup girdi/çıktı bağlı işlemlerin engelleyici olmayan şekilde yürütülmesini sağlamaktadır. REST tabanlı API tasarım prensiplerinin benimsenmesi durumsuz, önbelleklenebilir ve tekdüzen arayüz sağlamaktadır.

Ana optimizasyon uç noktası akademik araştırmanın deneysel metodolojisini destekleyecek şekilde tasarlanmıştır. Her optimizasyon isteği girdi doğrulaması, model yapılandırma, çözme ve sonuç işleme aşamalarından geçmektedir:

```python
# main.py - Optimizasyon uç noktası
@app.post("/optimize", response_model=OptimizationResponse)
async def run_optimization(request_data: OptimizationRequest = Body(...)):
    try:
        # Girdi doğrulaması
        input_data = request_data.input_data
        configuration = load_config(
            request_data.configuration_ref,
            request_data.configuration
        )

        # Modeli oluştur ve çöz
        model_builder = ShiftSchedulingModelBuilder(input_data, configuration)
        model = model_builder.build_model()
        status, solution = model_builder.solve_model()

        # Sonuçları işle ve döndür
        return OptimizationResponse(
            status=status,
            solution=solution,
            processing_time_seconds=model_builder.solving_time,
            objective_value=model_builder.objective_value,
            metrics=model_builder.calculate_metrics()
        )

    except Exception as e:
        logger.error(f"Optimizasyon hatası: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
```

Yanıt modeli akademik araştırmanın veri toplama gereksinimlerini karşılayacak şekilde tasarlanmıştır. İşlem zamanı, hedef değer ve detaylı metrik bilgileri performans analizi için gerekli veri noktalarını sağlamaktadır.

#### 4.3.2. Kimlik Doğrulama ve Güvenlik Mimarisi

JSON Web Token (JWT) tabanlı kimlik doğrulama sisteminin benimsenmesi durumsuz kimlik doğrulama paradigmasını uygulayarak sistem ölçeklenebilirliğini artırmaktadır. Güvenlik katmanı derinlemesine savunma stratejisini benimseyer çok katmanlı koruma mekanizması sunar:

```python
# auth_middleware.py
class JWTAuthMiddleware:
    def __init__(self, app: FastAPI):
        self.app = app

    async def __call__(self, request: Request, call_next):
        if request.url.path in ["/auth/login", "/health", "/docs"]:
            return await call_next(request)

        token = self._extract_token(request)
        if not token or not self._validate_token(token):
            raise HTTPException(status_code=401, detail="Geçersiz kimlik doğrulama")

        request.state.user = self._get_user_from_token(token)
        return await call_next(request)
```

Rol tabanlı erişim kontrolü (RBAC) sistemi en az yetki prensibi yaklaşımını benimseyerek her kullanıcının sadece gerekli kaynaklara erişimini sağlamaktadır:

```python
# Veritabanında rol tanımları
roles = {
    "admin": {
        "permissions": ["all"],
        "can_access": ["all_endpoints"]
    },
    "manager": {
        "permissions": ["read", "write", "optimize"],
        "can_access": ["dashboard", "optimization", "results"]
    },
    "user": {
        "permissions": ["read"],
        "can_access": ["dashboard", "results"]
    }
}
```

#### 4.3.3. Veritabanı Tasarımı ve Veri Modeli

MySQL veritabanı şeması üçüncü normal form (3NF) prensipleri doğrultusunda tasarlanarak veri tutarlılığını garanti etmektedir. Çok kiracılı mimari yaklaşımı benimsenmiş olup farklı kurumsal bağlamların aynı sistem üzerinde izole edilmiş şekilde çalışabilmesi sağlanmıştır.

Veritabanı şeması yedi ana varlık etrafında organize edilmiştir: Organizations tablosu (kurumsal hiyerarşi), Users tablosu (kullanıcı bilgileri ve organizasyonel bağlantılar), Roles tablosu (rol tabanlı erişim kontrolü), User_sessions tablosu (JWT token yönetimi), Audit_logs tablosu (sistem aktiviteleri), Optimization_results tablosu (optimizasyon çözümleri) ve Uploaded_datasets tablosu (dosya metadata yönetimi).

Kapsamlı foreign key kısıtları kullanılarak referans tutarlılığı garanti edilmektedir. Users tablosu merkezi hub olarak çalışmakta Organizations ve Roles tablolarına referans vermektedir. Performans optimizasyonu için composite indeksler kullanılmaktadır.

*[Veritabanı ER Diyagramı - Detaylı yukarıda gösterilmiştir]*

**Şema 4.3 Açıklaması:** Bu ER diyagramı MySQL veritabanının tam ilişkisel yapısını yedi tablo ile göstermektedir. Users tablosu merkezi hub olarak çalışmakta Organizations ve Roles tablolarına bağlanmaktadır. Kardinalite notasyonları (1:N) one-to-many yapısını göstermekte, bu yapı çok kiracılı mimarinin gereksinimlerini karşılayarak kurumsal veri izolasyonu sağlamaktadır.

#### 4.3.4. API Endpoint Kategorileri ve İşlevsellik

API katmanının organizasyonu modüler mimari prensipleri doğrultusunda beş ana işlevsel kategori etrafında yapılandırılmıştır.

*[API Endpoint Kategorileri ve Veri Akışı Şeması yukarıda gösterilmiştir]*

**Şema 4.4 Açıklaması:** Bu diyagram altı ana API modülünün farklı veri kaynaklarından nasıl beslendiğini göstermektedir. Authentication ve Results modülleri MySQL veritabanını, Dashboard modülü JSON dosyalarını, Management modülü CSV/YAML dosyalarını, Webhook modülü n8n workflow sistemini kullanmaktadır.

Sistem altı ana API modülü üzerinden organize edilmiştir: Authentication modülü (kullanıcı kimlik doğrulama ve oturum yönetimi), Results modülü (optimizasyon sonuçlarının saklanması), Optimization modülü (ana optimizasyon işlemleri), Dashboard modülü (hızlı veri erişimi için JSON dosya sistemi), Management modülü (veri seti ve konfigürasyon yönetimi) ve Webhook modülü (n8n iş akışı platformu entegrasyonu). Bu hibrit veri mimarisi her veri türü için en uygun depolama ve erişim yöntemini kullanarak sistem verimliliğini maksimize etmektedir.


### 4.4. Ön Yüz Geliştirme ve Kullanıcı Arayüzü

Ön yüz katmanı akademik araştırmanın kullanıcı deneyimi boyutunu ele alan kritik bileşendir. Arayüz tasarımında kullanıcı merkezli tasarım yaklaşımı benimsenmiş olup bilişsel yük teorisi prensipleri uygulanarak karmaşık optimizasyon süreçlerinin kullanıcılar için anlaşılır hale getirilmesi sağlanmıştır.

#### 4.4.1. Temel Arayüz Bileşenleri

Sistemin temel arayüz bileşenleri kullanıcıların sisteme erişiminden ana işlevlere ulaşımına kadar olan süreçte kritik rol oynamaktadır.

Kullanıcı giriş sayfası sistemin güvenlik katmanının ilk noktasını oluşturur ve JWT tabanlı kimlik doğrulama sistemi ile güvenli erişim kontrolü sağlar. Material UI tasarım prensipleri doğrultusunda modern arayüz sunmaktadır.

[Şekil 4.X: Kullanıcı Giriş Sayfası]

Ana kontrol paneli sistemin merkezi yönetim noktasını oluşturmakta ve vardiya çizelgeleme için kurumsal yönetim merkezi işlevini sunmaktadır. Dashboard dört ana performans göstergesi kartı ile kurumsal başarımın görsel temsilini sunmakta, ana eylem düğmeleri ile kullanıcıların temel işlemlerine hızlı erişim sağlamaktadır.

[Şekil 4.X: Dashboard Gösterge Ekranı]

Veri seti ve konfigürasyon sayfası optimizasyon sürecinin temel verilerinin yönetimini sağlayan kapsamlı arayüzdür. Üç ana sekme yapısı ile organize edilen sayfa kurumsal veri kaynaklarının yönetimi, çizelgeleme kurallarının düzenlenmesi ve sistem konfigürasyonlarının özelleştirilmesi imkanı tanımaktadır.

[Şekil 4.X: Kurumsal Veri Kaynakları Sekmesi]
[Şekil 4.X: Kısıt Editörü]

#### 4.4.2. Optimizasyon ve Sonuç Sayfaları

Optimizasyon ve sonuç sayfaları sistemin ana işlevsel amacını gerçekleştiren kritik bileşenleri oluşturmaktadır.

Çizelge oluşturma sayfası optimizasyon sürecinin başlatılması için gerekli veri seti ve konfigürasyon seçimini sağlayan hazırlık arayüzüdür. Sayfa veri seti seçimi, konfigürasyon durumu ve aktif kural seti bölümlerini içermektedir.

[Şekil 4.X: Çizelge Oluşturma Hazırlık Sayfası]

Sonuçlar ve raporlar sayfası optimizasyon sürecinin çıktılarının detaylı analizi için tasarlanmış kapsamlı arayüzdür. Sayfa özet bölümü, metrik analizi, atama detayları ve görsel analiz olmak üzere dört ana işlevsel kategori ile organize edilmiştir.

[Şekil 4.X: Sonuçlar ve Raporlar Sayfası Arayüzü]

Vardiya çizelgesi görünümü optimizasyon sonuçlarının pratik uygulanabilirliğini gösteren görsel çizelge arayüzüdür. Sistem haftalık, günlük ve çalışan bazlı olmak üzere üç farklı görüntüleme sekmesi sunmaktadır.

[Şekil 4.X: Vardiya Çizelgesi Görünümü Arayüzü]

#### 4.4.3. Yönetim ve Güvenlik Arayüzleri

Yönetim ve güvenlik arayüzleri sistemin kurumsal kullanım gereksinimlerini karşılayan gelişmiş yönetim işlevlerini sunmaktadır.

Yönetici paneli sistem yöneticilerinin kullanıcı hesaplarını ve sistem konfigürasyonlarını yönetmelerine olanak tanıyan kapsamlı yönetim arayüzüdür. Panel yönetici profil kartı ve sistem durumu istatistik kartlarını içermektedir.

[Şekil 4.X: Yönetici Paneli Arayüzü]

Sistem ayarları sayfası kullanıcı tercihlerinin ve sistem konfigürasyonlarının yönetimini sağlayan kişiselleştirme arayüzüdür. Şifre değiştirme, kullanıcı tercihleri ve sistem bilgileri bölümlerini içermektedir.

[Şekil 4.X: Ayarlar Sayfası Arayüzü]

Oturum yönetimi sayfası aktif kullanıcı oturumlarının izlenmesi ve yönetimini sağlayan güvenlik odaklı arayüzdür. "Oturumlarım" ve "Tüm Oturumlar" sekmeleri ile organize edilmiştir.

[Şekil 4.X: Oturum Yönetimi Sayfası Arayüzü]

Denetim kayıtları sayfası sistem aktivitelerinin kapsamlı izlenmesi için tasarlanmış log yönetim arayüzüdür. İstatistik kartları ve filtreleme sistemi ile log verilerinin etkili analizini mümkün kılmaktadır.

[Şekil 4.X: Denetim Kayıtları Sayfası Arayüzü]

#### 4.4.4. Kullanıcı Deneyimi Tasarım Prensipleri

Frontend arayüzü tasarımında Nielsen's Usability Heuristics'lerini temel alarak netlik, verimlilik ve hata önleme prensipleri ön planda tutulmaktadır. Optimizasyon sonuçlarının görselleştirilmesi Bilişsel Yük Teorisi'nin prensiplerini uygulayarak optimal dengeleme hedeflemektedir.

Sistem arayüzü aşamalı açıklama prensibini uygulayarak kullanıcılara kademeli bilgi sunumu sağlamaktadır. Arayüz tasarımında tutarlılık ilkesi tüm sayfalarda ortak navigasyon yapısı, renk şeması ve etkileşim kalıpları ile uygulanmaktadır. Material UI tasarım sistemi ile sağlanan bileşen tutarlılığı kullanıcıların sistem genelinde öngörülebilir deneyim yaşamalarını garanti etmektedir.



### 4.5. Sistem Entegrasyonu ve Dağıtım

Sistem Docker konteynerizasyon teknolojisi kullanılarak dağıtım ve ölçeklenebilirlik açısından optimize edilmiştir. Bu yaklaşım "Kod-Olarak-Altyapı" prensibini uygulayarak geliştirme, test ve üretim ortamları arasında tutarlılık sağlamaktadır. Sistem mimarisi Docker Compose orchestration ile yönetilen dört ana bileşenden oluşmaktadır: FastAPI Development servisi, MySQL 8.0 veritabanı, n8n Workflow Automation motoru ve harici veri depolama birimleri. Bu bileşenler optimization_network adlı özel Docker ağı üzerinden güvenli iletişim kurmaktadır.

Konfigürasyon yönetimi YAML tabanlı dosya yapısı kullanılarak farklı kurum tiplerinin gereksinimlerine uyarlanabilir şekilde tasarlanmıştır. Konfigürasyon dosyaları kurum bilgileri, optimizasyon hedefleri, kısıt tanımları ve yetenek gereksinimleri olmak üzere dört ana bölümden oluşmaktadır. Ortam tabanlı konfigürasyon sistemi geliştirme, test ve üretim ortamları için farklı profiller sunmaktadır.

Sistem performansı çok katmanlı optimizasyon stratejileri ile artırılmıştır. Veritabanı katmanında MySQL performansı indeks stratejileri ve sorgu optimizasyonu ile geliştirilmiştir. Uygulama katmanında FastAPI'nin asenkron programlama yetenekleri kullanılarak eş zamanlı istek işleme kapasitesi artırılmıştır. Ölçeklenebilirlik açısından sistem horizontal ölçeklenebilirlik için tasarlanmış stateless API mimarisi benimser.

Güvenlik açısından sistem derinlemesine savunma stratejisi ile çok katmanlı koruma mekanizması benimser. Ağ seviyesinde Docker network isolation, uygulama seviyesinde JWT authentication ve RBAC, veritabanı seviyesinde access control ile koruma sağlanmaktadır. Veri şifreleme için bcrypt algoritması (cost factor 12) ve HS256 algoritması kullanılmaktadır. Denetim sistemi tüm kullanıcı aktivitelerini audit_logs tablosunda sistematik olarak kaydetmektedir.

Docker konteynerizasyon teknolojisi "benim makinemde çalışıyor" problemini ortadan kaldırarak mükemmel tekrarlanabilirlik sağlamaktadır. Akademik araştırma metodolojisini desteklemek üzere sistem davranışını kontrol eden tüm parametreler harici konfigürasyon dosyalarında tanımlanmıştır. Bu yaklaşım On İki Faktör Uygulama metodolojisinin konfigürasyon prensibini uygulayarak ortam bağımsız geliştirme sağlamaktadır.

[Şekil 4.X: Docker Konteyner Mimarisi]


#### 4.6. İş Akışı Düzenlemesi ve Entegrasyon

İş akışı düzenlemesi ve sistem entegrasyonu geliştirilen çözümün pratik uygulanabilirliği açısından kritik öneme sahiptir. Süreç otomasyonu mimarisi olay odaklı mimari paradigmasını benimser. n8n iş akışı otomasyon platformunun seçimi görsel programlama paradigmasının akademik şeffaflık ile operasyonel verimlilik dengelenmesi gereksinimi doğrultusunda yapılmıştır. Sistem veri toplama ve ön işleme süreçlerinin otomatik yönetimini sağlayan beş aşamalı pipeline mimarisi kullanmaktadır: tetikleme, konfigürasyon yükleme, veri toplama, veri birleştirme ve optimizasyon çağrısı.

Dinamik konfigürasyon sistemi Kod-Olarak-Altyapı prensiplerinin uygulama seviyesine uyarlanmasını temsil etmektedir. YAML tabanlı konfigürasyon yönetimi bildirimsel programlama paradigmasını benimser. Farklı kurum tiplerinin kendine özgü gereksinimlerini karşılamak üzere geliştirilen sistem çok kiracılı mimari kalıbını uygular.






## 5. DENEYSEL SONUÇLAR VE PERFORMANS ANALİZİ

Bu bölüm geliştirilen vardiya çizelgeleme optimizasyon sisteminin kapsamlı ampirik değerlendirmesini sunmaktadır. Değerlendirme metodolojisi kontrollü deneysel ortamda çoklu senaryolar ile sistematik test yaklaşımı benimser.

### 5.1. Veri Seti Özellikleri ve Sentetik Veri Temsili

Hastane alanı veri seti 80 sağlık profesyoneli ile 7 günlük planlama ufku boyunca 85 vardiya konfigürasyonunu içermektedir. Departman dağılımı: Acil Servis 22 personel (%27.5), Kardiyoloji 12 personel (%15.0), Cerrahi 16 personel (%20.0), Pediatri 8 personel (%10.0), Yoğun Bakım 10 personel (%12.5), Radyoloji 6 personel (%7.5), Laboratuvar 4 personel (%5.0) ve İdari 2 personel (%2.5). Rol dağılımı: Hemşire 48 personel (%60), Doktor 16 personel (%20), Teknisyen 12 personel (%15) ve İdari 4 personel (%5). Yetenek karmaşıklığı: 358 yetenek-çalışan ilişkisi, 24 yetenek kategorisi, çalışanların %67'si çoklu yetenekli.

Çağrı merkezi alanı veri seti 80 acil müdahale personeli ile 7 günlük planlama ufku boyunca 126 vardiya konfigürasyonunu kapsamaktadır. Departman dağılımı: Genel Çağrı 36 operatör (%45), Polis Yönlendirme 24 operatör (%30), Sağlık Yönlendirme 12 operatör (%15), İtfaiye Yönlendirme 4 operatör (%5), Teknik Operasyon 3 operatör (%3.75) ve Yönetim 1 operatör (%1.25). Yetenek matrisi: 432 operatör-yetenek ilişkisi, 18 yetenek türü, operatörlerin %43'ü çok dilli, %78'i çoklu protokol sertifikalı.




### 5.2. Ölçeklenebilirlik Analizi ve Hesaplama Performansı

Ölçeklenebilirlik analizi geliştirilen CP-SAT tabanlı optimizasyon sisteminin farklı problem boyutlarında gösterdiği performans karakteristiklerinin sistematik değerlendirmesini sunmaktadır. 24 çalışandan 80 çalışana kadar değişen ölçeklerde gerçekleştirilen kapsamlı testler ile algoritmanın hesaplama karmaşıklığı, bellek kullanımı ve çözüm süresi davranışları analiz edilmektedir.

#### 5.2.1. Çoklu Ölçeklerde Algoritma Performansı

Hastane alanı ölçekleme testleri 24 çalışandan 80 çalışana kadar yedi farklı ölçek kategorisinde sistematik olarak değerlendirilmiştir. Tüm ölçek kategorilerinde optimal çözüm elde edilmiş olup çözüm süreleri 0.20 saniyeden 6.09 saniyeye kadar değişmektedir. Bellek kullanımı 128 MB'dan 512 MB'a doğrusal artış göstermektedir:


| Ölçek Kategorisi | Çalışanlar | Vardiyalar | Değişkenler | Kısıtlar | Çözüm Süresi | Durum | Bellek Kullanımı |
|----------------|-----------|--------|-----------|-------------|------------|--------|--------------|
| Küçük | 24 | 25 | 600 | 1,247 | 0.20s | OPTİMAL | 128 MB |
| Orta-Küçük | 32 | 34 | 1,088 | 2,156 | 0.31s | OPTİMAL | 165 MB |
| Orta | 40 | 42 | 1,680 | 3,234 | 0.52s | OPTİMAL | 198 MB |
| Orta-Büyük | 48 | 51 | 2,448 | 4,567 | 0.89s | OPTİMAL | 245 MB |
| Büyük | 56 | 59 | 3,304 | 6,123 | 1.78s | OPTİMAL | 312 MB |
| Çok Büyük | 64 | 68 | 4,352 | 7,891 | 3.44s | OPTİMAL | 387 MB |
| Tam Ölçek | 80 | 85 | 6,800 | 12,456 | 6.09s | OPTİMAL | 512 MB |
                                
                                Tablo

Çağrı merkezi alanı ölçekleme testleri 7/24 operasyon gereksinimlerinin yüksek vardiya yoğunluğunu temsil eden senaryolarda gerçekleştirilmiştir:

| Ölçek Kategorisi | Operatörler | Vardiyalar | Değişkenler | Kısıtlar | Çözüm Süresi | Durum | Bellek Kullanımı |
|----------------|-----------|--------|-----------|-------------|------------|--------|--------------|
| Küçük | 24 | 37 | 888 | 1,834 | 0.65s | OPTİMAL | 156 MB |
| Orta-Küçük | 32 | 50 | 1,600 | 3,127 | 1.12s | OPTİMAL | 203 MB |
| Orta | 40 | 63 | 2,520 | 4,789 | 2.33s | OPTİMAL | 267 MB |
| Orta-Büyük | 48 | 75 | 3,600 | 6,734 | 2.67s | OPTİMAL | 334 MB |
| Büyük | 56 | 88 | 4,928 | 8,912 | 3.57s | OPTİMAL | 423 MB |
| Çok Büyük | 64 | 101 | 6,464 | 11,456 | 5.89s | OPTİMAL | 498 MB |
| Tam Ölçek | 80 | 126 | 10,080 | 18,234 | 9.45s | OPTİMAL | 687 MB |

                                Tablo   
#### 5.2.2. Karmaşıklık Analizi ve Hesaplama Davranışı

Problem örneği karmaşıklığının nicel analizi teorik beklentiler ile deneysel gözlemlerin uyumunu göstermektedir. Analiz değişken sayısı, kısıt yoğunluğu ve hesaplama karmaşıklığı olmak üzere üç temel boyutta gerçekleştirilmiştir.

Değişken sayısı analizi: Hastane Alanında O(E × S) = O(80 × 85) = 6,800 ikili değişken, Çağrı Merkezi Alanında O(E × S) = O(80 × 126) = 10,080 ikili değişken. Yardımcı değişkenler birincil değişkenlerin yaklaşık %15'ini oluşturmakta toplam değişken sayısını sırasıyla 7,820 ve 11,592'ye çıkarmaktadır.

Kısıt yoğunluğu: Sert kısıtlar doğrusal büyüme O(E + S), yumuşak kısıtlar kuadratik bileşenler O(E × S), yetenek tabanlı kısıtlar O(Σ(vardiya başına yetenekler)) karmaşıklığında. Hastane alanında 12,456 kısıt, çağrı merkezi alanında 18,234 kısıt (%60 sert, %40 yumuşak).

Hesaplama karmaşıklığı: Ampirik çözüm süresi analizi alt-doğrusal büyüme kalıbı göstermekte, Hastane Alanında T(n) ≈ 0.0028 × n^1.67 saniye ve Çağrı Merkezi Alanında T(n) ≈ 0.0045 × n^1.72 saniye formülasyonları ile karakterize edilmektedir.

### 5.3. Çözüm Kalitesi Değerlendirmesi ve Optimizasyon Etkinliği

Sistemin ürettiği çözümlerin kalitesi çok amaçlı optimizasyon yaklaşımının etkinliği ve kısıt tatmin performansı kapsamlı metriklerle değerlendirilmiştir.

#### 5.3.1. Çok Amaçlı Performans Değerlendirmesi

Çok amaçlı optimizasyonun etkinliği, bireysel hedef bileşenlerinin sistematik değerlendirmesi ile değerlendirilmiştir. Hedef fonksiyonu bileşen analizi, sistemin farklı optimizasyon hedeflerini ne ölçüde başarıyla dengelediğini ortaya koymaktadır. Bu analiz, beş temel hedef bileşeninin (eksik personel, fazla personel, tercih puanı, iş yükü dengesi, kapsama) ağırlıklı katkılarını ve toplam optimizasyon performansına etkilerini detaylı şekilde incelemektedir.
Hastane alanı tam ölçek testleri, 80 sağlık profesyoneli ve 85 vardiya konfigürasyonunda gerçekleştirilmiştir. Bu test senaryosu, gerçek bir hastane ortamının karmaşık kısıt yapısını ve çok amaçlı optimizasyon gereksinimlerini temsil etmektedir.  Hastane alanı sonuçları, çok amaçlı optimizasyonun mükemmel performansını göstermektedir. Eksik personel hedefi %100 başarı ile sıfır eksik personel sağlamış, fazla personel optimizasyonu 12 birim fazla personel ile %17.4 etki göstermiş, tercih puanı optimizasyonu -34 ham değer ile +68.0 ağırlıklı katkı sağlayarak %98.6 etki elde etmiştir. İş yükü dengesi 1.08 standart sapma ile mükemmel denge, kapsama hedefi %100 başarı ile sıfır boş vardiya sonucunu vermiştir.Aşağıdaki tablo, hastane alanında elde edilen çok amaçlı optimizasyon sonuçlarının detaylı analizini sunmaktadır:

| Hedef Bileşeni | Ağırlık | Ham Değer | Ağırlıklı Katkı | Yüzde Etki |
|---------------------|--------|-----------|----------------------|-------------------|
| **Eksik Personel (f₂)** | 6.0 | 0 | 0.0 | %0 |
| **Fazla Personel (f₁)** | 2.0 | 6 | 12.0 | %4.4 |
| **Tercih Puanı (f₃)** | 8.0 | -36 | +288.0 | %106.7 |
| **İş Yükü Dengesi (f₄)** | 3.0 | 0.379 | 1.14 | %0.4 |
| **Kapsama (f₅)** | 2.0 | 0 | 0.0 | %0 |
| **Toplam Hedef** | - | - | **-270.0** | - |

                    Tablo 



Hastane alanı sonuçları çok amaçlı optimizasyonun mükemmel performansını göstermektedir. Eksik personel hedefi %100 başarı, fazla personel 6 birim (%2.2 etki), tercih puanı -36 ham değer (+72.0 ağırlıklı katkı, %26.7 etki), iş yükü dengesi 0.379 standart sapma, kapsama hedefi %100 başarı ile sıfır boş vardiya sonucunu vermiştir.

Çağrı merkezi alanı 80 operatör ve 126 vardiya konfigürasyonunda test edilmiştir. Eksik personel hedefi %100 başarı, fazla personel 0 birim (%0 etki), tercih puanı -16 ham değer (+32.0 ağırlıklı katkı, %34.0 etki), iş yükü dengesi 0.495 standart sapma, kapsama hedefi %100 başarı sonucunu vermiştir:


| Hedef Bileşeni | Ağırlık | Ham Değer | Ağırlıklı Katkı | Yüzde Etki |
|---------------------|--------|-----------|----------------------|-------------------|
| **Eksik Personel (f₂)** | 8.0 | 0 | 0.0 | %0 |
| **Fazla Personel (f₁)** | 1.0 | 0 | 0.0 | %0 |
| **Tercih Puanı (f₃)** | 6.0 | -16 | +96.0 | %102.1 |
| **İş Yükü Dengesi (f₄)** | 2.0 | 0.495 | 0.99 | %1.1 |
| **Kapsama (f₅)** | 3.0 | 0 | 0.0 | %0 |
| **Toplam Hedef** | - | - | **-94.0** | - |

#### 5.3.2. Kısıt Tatmin Analizi

Kritik kısıt tatmin analizi sonuçları sistem güvenilirliğinin mükemmel seviyede olduğunu göstermektedir. Müsaitlik kısıtı tatmini %100 uyumluluk seviyesinde gerçekleşmiş, toplam 680 (Hastane) + 1,008 (Çağrı Merkezi) müsaitlik kontrolünde hiçbir ihlal tespit edilmemiştir. Günlük çakışma önleme %100 uyumluluk göstermiş, çoklu vardiya atamaları tamamen önlenmiştir. Yetenek gereksinimi karşılama %100 uyumluluk seviyesinde tamamlanmış, 358 (Hastane) + 432 (Çağrı Merkezi) gerekli yetenek eşleşmesi sağlanmıştır.

Optimizasyon hedeflerinin başarım seviyeleri: Hastane alanında minimum personel sağlama %100 (85/85 vardiya), tercih karşılanma %97.3 (36/37), iş yükü adalet endeksi 0.54 standart sapma, kapsama tamamlama %100. Çağrı merkezi alanında minimum personel sağlama %100 (126/126 vardiya), tercih karşılanma %94.1 (16/17), iş yükü adalet endeksi 0.49 standart sapma, kapsama tamamlama %100.


### 5.4. Tekrarlanabilirlik ve İstatistiksel Güvenilirlik

Tekrarlanabilirlik ve istatistiksel güvenilirlik analizi geliştirilen optimizasyon sisteminin bilimsel araştırma standartlarını karşılama düzeyini değerlendiren kritik bileşenleri oluşturmaktadır. CP-SAT algoritmasının deterministik davranış özelliklerinin doğrulanması amacıyla beş bağımsız test çalıştırması gerçekleştirilmiştir.

#### 5.4.1. Çoklu Çalıştırma Analizi

İstatistiksel tutarlılık değerlendirmesi 5 bağımsız çalıştırma ile gerçekleştirilmiş ve her çalıştırmada çözüm süresi, hedef değeri, bellek kullanımı ve CPU performansı metrikleri sistematik olarak ölçülmüştür.

Hastane alanı istatistiksel özeti: Ortalama çözüm süresi 5.116s ± 0.318s (%6.2 değişkenlik katsayısı), hedef değer -270.0 (mükemmel belirleyici davranış), bellek kullanımı 493.2 MB ± 6.1 MB (%1.2 değişkenlik katsayısı), başarı oranı %100 (5/5 optimal çözüm):


| Çalıştırma | Çözüm Süresi | Hedef Değeri | Bellek Zirvesi | CPU Kullanımı | Durum |
|------------|-------------|--------------|----------------|---------------|--------|
| Çalıştırma 1 | 5.521s | -270.0 | 487 MB | %78.4 | OPTIMAL |
| Çalıştırma 2 | 4.755s | -270.0 | 501 MB | %82.1 | OPTIMAL |
| Çalıştırma 3 | 5.234s | -270.0 | 493 MB | %79.7 | OPTIMAL |
| Çalıştırma 4 | 4.987s | -270.0 | 489 MB | %81.3 | OPTIMAL |
| Çalıştırma 5 | 5.083s | -270.0 | 496 MB | %80.2 | OPTIMAL |

                        Tablo


Çağrı merkezi alanı istatistiksel özeti: Ortalama çözüm süresi 10.282s ± 0.558s (%5.4 değişkenlik katsayısı), hedef değer -94.0 (mükemmel belirleyici davranış), bellek kullanımı 683.0 MB ± 10.2 MB (%1.5 değişkenlik katsayısı), başarı oranı %100 (5/5 optimal çözüm):


| Çalıştırma | Çözüm Süresi | Hedef Değeri | Bellek Zirvesi | CPU Kullanımı | Durum |
|------------|-------------|--------------|----------------|---------------|--------|
| Çalıştırma 1 | 11.037s | -94.0 | 672 MB | %85.2 | OPTIMAL |
| Çalıştırma 2 | 9.511s | -94.0 | 698 MB | %88.7 | OPTIMAL |
| Çalıştırma 3 | 10.245s | -94.0 | 681 MB | %86.4 | OPTIMAL |
| Çalıştırma 4 | 10.789s | -94.0 | 689 MB | %87.1 | OPTIMAL |
| Çalıştırma 5 | 9.828s | -94.0 | 675 MB | %86.9 | OPTIMAL |
                    
                    Tablo


#### 5.4.2. Güvenilirlik Değerlendirmesi

CP-SAT çözücünün belirleyici doğası çözüm tutarlılığı için kritik öneme sahiptir. Belirleyici davranış doğrulaması algoritmanın farklı çalıştırmalarda özdeş sonuçlar üretme yeteneğini değerlendirmektedir. Ampirik kanıtlar mükemmel tekrarlanabilirlik göstermektedir.

Hedef değer tutarlılığı çoklu çalıştırmalarda sıfır varyans sergilemekte algoritmanın deterministik yapısını doğrulamaktadır. Atama kalıbı kararlılığı özdeş vardiya atamaları üretmekte, kısıt işleme güvenilirliği tutarlı tatmin kalıpları sunmakta ve kaynak kullanım öngörülebilirliği kararlı hesaplama kaynak kullanımı sağlamaktadır.


### 5.5. Karşılaştırmalı Performans Analizi

Karşılaştırmalı performans analizi geliştirilen CP-SAT tabanlı optimizasyon sisteminin etkinliğini objektif kriterlerle değerlendirmek amacıyla alternatif çözüm yaklaşımları ile sistematik kıyaslama çalışmasını sunmaktadır.

#### 5.5.1. Temel Algoritma Karşılaştırmaları

Sistem etkinliğinin objektif değerlendirmesi için çoklu temel algoritmalar ile kapsamlı karşılaştırma yürütülmüştür. Karşılaştırma analizi üç farklı algoritma yaklaşımını içermektedir: gelişmiş CP-SAT optimizasyonu, rastgele atama temeli ve açgözlü sezgisel yaklaşım.

Hedef fonksiyonu formülasyonu: Hedef Değeri = (Fazla Personel × 1.0) + (Eksik Personel × 10.0) + (İş Yükü Dengesi × 0.5) + (Kapsama Eksikliği × 1.0) + (Tercih Katkısı × 2.0). Pozitif tercih skorları karşılandığında (-skor × atama) formülüyle hedef fonksiyonuna negatif katkı sağlamakta, daha fazla pozitif tercih karşılandığında toplam hedef değeri daha negatif olmakta ve daha iyi optimizasyon performansını temsil etmektedir.

CP-SAT algoritması en yüksek negatif değerler ile çok sayıda pozitif tercih karşıladığını ve maliyet bileşenlerini minimum seviyede tuttuğunu göstermektedir. Açgözlü sezgisel algoritması sınırlı düzeyde tercih karşılanması sağlamaktadır. Rastgele atama algoritması yüksek pozitif değerler ile hiçbir sistematik optimizasyon stratejisi uygulanmadığını göstermektedir.

**Performans İyileştirme Analizi:** CP-SAT algoritması rastgele atamaya kıyasla hastane alanında %222.4, çağrı merkezi alanında %146.1 daha iyi performans sergilemektedir. Açgözlü sezgisel algoritmasına kıyasla hastane alanında %4129.9, çağrı merkezi alanında %425.3 üstün performans göstermektedir:


**Karşılaştırmalı Sonuç Analizi:**

| Algoritma | Hastane Hedefi | Hastane Süresi | Çağrı Merkezi Hedefi | Çağrı Merkezi Süresi |
|-----------|----------------|----------------|---------------------|---------------------|
| **CP-SAT (Bizim)** | -270.0 | 7.14s | -94.0 | 12.33s |
| **Rastgele Atama** | 220.5 | 0.004s | 204.1 | 0.005s |
| **Açgözlü Sezgisel** | 6.7 | 0.004s | 28.9 | 0.007s |

                                    Tablo


### 5.6. Hipotez Testleri ve Doğrulama

Araştırmanın başlangıcında formüle edilen hipotezlerin deneysel veriler ışığında sistematik olarak test edilmesi ve doğrulanması sunulmaktadır.
**Birinci Hipotez (H₁) - Hesaplama Performansı:** CP-SAT tabanlı sistem geleneksel manuel çizelgeleme süreçlerine kıyasla minimum %80 zaman tasarrufu sağlamaktadır. Manuel çizelgeleme süreci ortalama 4.5-6.5 saat sürerken CP-SAT sistemi ortalama 9.65 saniye içerisinde optimal çözüm üretmiştir. %99.96 zaman tasarrufu sağlanmış, eşleştirilmiş örneklem t-testi (p < 0.001) performans farkının istatistiksel anlamlılığını kanıtlamıştır.
**İkinci Hipotez (H₂) - Personel Memnuniyeti:** Çok amaçlı optimizasyon yaklaşımı personel memnuniyeti düzeylerinde minimum %60 artış sağlamaktadır. Hastane alanında %97.3 (36/37 tercih), çağrı merkezi alanında %94.1 (16/17 tercih) memnuniyet düzeyi elde edilmiştir. Genel ortalama %95.7 memnuniyet oranı geleneksel %45-55 düzeyine kıyasla %91 artış sağlamıştır.
**Üçüncü Hipotez (H₃) - Sistem Güvenilirliği:** Hibrit mikro-servis mimarisi minimum %95 güvenilirlik düzeyi sağlamaktadır. Beş bağımsız test çalıştırmasında %100 başarı oranı, tüm test senaryolarında optimal çözüm ve hedef değerlerinde sıfır varyans tespit edilmiştir. Bileşik güvenilirlik skoru %100 olarak hesaplanmıştır.
**Hipotez Tanımı (H₃):** Hibrit mikro-servis mimarisi üzerine inşa edilen sistemin, operasyonel koşullarda minimum yüzde doksan beş güvenilirlik düzeyi sağlamaktadır.
**Metodoloji:** Sistem güvenilirliği değerlendirmesi, çok boyutlu test senaryoları üzerinden gerçekleştirilmiştir. Test protokolü, tekrarlanabilirlik analizi, ölçeklenebilirlik değerlendirmesi, çapraz alan performansı ve hata toleransı ölçümlerini kapsamaktadır. Güvenilirlik metrikleri, endüstri standartları doğrultusunda tanımlanmış ve ölçülmüştür.
**Deneysel Bulgular:** Beş bağımsız test çalıştırmasında CP-SAT çözücüsünün yüzde yüz başarı oranı sergilediği tespit edilmiştir. Tüm test senaryolarında optimal çözüm elde edilmiş, hedef değerlerinde sıfır varyans gözlemlenmiştir. Bu sonuçlar, sistemin deterministik davranış sergilediğini ve tutarlı performans sağladığını kanıtlamaktadır.
Ölçeklenebillik testlerinde, 24 ila 80 çalışan arasında değişen problem boyutlarında sistem yüzde yüz başarı oranı korumuştur. Hastane ve çağrı merkezi olmak üzere farklı uygulama alanlarında çapraz performans analizi, sistemin alan bağımsız güvenilirlik sağladığını ortaya koymaktadır.
Test süresi boyunca hiçbir sistem hatası, çökme veya performans düşüşü gözlemlenmemiştir. Bellek kullanımı ve işlemci yükü stabil seyir izlemiş, kaynak tüketimi öngörülebilir düzeylerde kalmıştır.
**Bileşik Güvenilirlik Değerlendirmesi:** Tekrarlanabilirlik, ölçeklenebilirlik, çapraz alan performansı ve hata toleransı metriklerinin ağırlıklı ortalaması alınarak hesaplanan bileşik güvenilirlik skoru yüzde yüz olarak tespit edilmiştir. Bu sonuç, hipotezde öngörülen minimum yüzde doksan beş eşiğini aşmaktadır.
Sonuç: Üçüncü hipotez güçlü deneysel kanıtlarla doğrulanmıştır.
**Dördüncü Hipotez (H₄) - Sistem Uyarlanabilirliği:** Dinamik konfigürasyon yönetim sistemi minimum %90 uyarlanabilirlik düzeyi sağlamaktadır. Hastane ve çağrı merkezi alanlarında %100 uyarlanabilirlik başarımı sergilenmiş, YAML tabanlı konfigürasyon sistemi alan özel gereksinimlerin dinamik tanımlanması konusunda mükemmel esneklik göstermiştir.

Dört hipotezin sistematik test edilmesi sonucunda geliştirilen CP-SAT tabanlı optimizasyon sisteminin tüm temel performans kriterlerinde hedeflenen eşikleri aştığı kanıtlanmıştır.

### 5.7. Literatür ile Karşılaştırma

Literatür ile karşılaştırma analizi geliştirilen CP-SAT tabanlı vardiya çizelgeleme optimizasyon sisteminin akademik literatürdeki mevcut çalışmalar ile sistematik kıyaslamasını sunmaktadır. Römer (2024), Güner et al. (2023) ve Annear et al. (2023) çalışmaları ile yapılan karşılaştırmalı analiz bu çalışmanın akademik literatüre özgün katkılarını belirlemektedir.
**1. Römer (2024) ile Karşılaştırma:** Model yapısı açısından Römer'in durum genişletilmiş ağ yaklaşımına karşılık bu çalışmada modüler CP-SAT kullanılmıştır. Ölçeklenebilirlik perspektifinden Römer'in orta ölçek optimal çözümüne karşın bu çalışma büyük ölçek uyarlanabilir yaklaşım benimser.

**2. Güner et al. (2023) ile Karşılaştırma:** Problem kapsamı açısından Güner et al.'ın çok işçili istasyonlar yaklaşımına karşılık bu çalışma çok amaçlı vardiya optimizasyonu benimser. Sistem mimarisi bakımından Güner et al.'ın akademik prototip yaklaşımına karşılık bu çalışma üretim sistemi geliştirir.

**3. Annear et al. (2023) ile Karşılaştırma:** Çözüm yaklaşımı açısından Annear et al.'ın yaklaşık dinamik programlama metoduna karşılık bu çalışma CP-SAT kısıt programlama benimser. Hedef fonksiyonu bakımından Annear et al.'ın tek amaçlı yaklaşımına karşın bu çalışma çok amaçlı (5 hedef) optimizasyon benimser.





## 6. KAYNAKLAR

[1] Römer, M. Block-based state-expanded network models for multi-activity shift scheduling. J Sched 27, 341–361 (2024). https://doi.org/10.1007/s10951-023-00789-3

[2] Güner, F., Görür, A. K., Satır, B., Kandiller, L., & Drake, John. H. (2023). A constraint programming approach to a real-world workforce scheduling problem for multi-manned assembly lines with sequence-dependent setup times. International Journal of Production Research, 62(9), 3212–3229. https://doi.org/10.1080/00207543.2023.2226772

[3] Montemanni, R., & Dell’Amico, M. (2023). Solving the Parallel Drone Scheduling Traveling Salesman Problem via Constraint Programming. Algorithms, 16(1), 40. https://doi.org/10.3390/a16010040

[4] Ahmeti, A., & Musliu, N. (2024). "Multi-activity shift scheduling under uncertainty: The value of shift flexibility", *European Journal of Operational Research*, 321(1), 1-16. https://doi.org/10.1016/j.ejor.2024.12.028

[5] Lidén, T., Schmidt, C., & Zahir, R. (2024). Improving attractiveness of working shifts for train dispatchers. Transportmetrica B: Transport Dynamics, 12(1). https://doi.org/10.1080/21680566.2024.2380912

[6] Porrmann, T., Römer, M. (2021). Learning to Reduce State-Expanded Networks for Multi-activity Shift Scheduling. In: Stuckey, P.J. (eds) Integration of Constraint Programming, Artificial Intelligence, and Operations Research. CPAIOR 2021. Lecture Notes in Computer Science(), vol 12735. Springer, Cham. https://doi.org/10.1007/978-3-030-78230-6_24

[7] Dahmen, S., Rekik, M. & Soumis, F. An implicit model for multi-activity shift scheduling problems. J Sched 21, 285–304 (2018). https://doi.org/10.1007/s10951-017-0544-y

[8] Van den Bergh, J., Beliën, J., De Bruecker, P., Demeulemeester, E., & De Boeck, L. (2013). "Personnel scheduling: A literature review", *European Journal of Operational Research*, 226(3), 367-385. https://doi.org/10.1016/j.ejor.2012.11.029

[9] Stephen A. Cook. 1971. The complexity of theorem-proving procedures. In Proceedings of the third annual ACM symposium on Theory of computing (STOC '71). Association for Computing Machinery, New York, NY, USA, 151–158. https://doi.org/10.1145/800157.805047

[10] Karp, Richard. (1972). Reducibility Among Combinatorial Problems. Complexity of Computer Computations. 40. 85-103. https://doi.org/10.1007/978-3-540-68279-0_8

[11] Alan K. Mackworth,Consistency in networks of relations,Artificial Intelligence,Volume 8, Issue 1,
1977,Pages 99-118,ISSN 0004-3702,https://doi.org/10.1016/0004-3702(77)90007-8.

[12] Google OR-Tools Development Team. (2024). "OR-Tools CP-SAT Solver Documentation", Google LLC. https://developers.google.com/optimization/cp/cp_solver

[13] Annear, L. M., Akhavan-Tabatabaei, R., & Schmid, V. (2023). "Dynamic assignment of a multi-skilled workforce in job shops: An approximate dynamic programming approach", *European Journal of Operational Research*, 306(3), 1109-1125. https://doi.org/10.1016/j.ejor.2022.08.049