# Optimizasyon Başarı Metrikleri

Bu belge, vardiya çizelgeleme optimizasyon projesinin başarısını ölçmek ve değerlendirmek için kullanılacak temel metrikleri tanımlar. Metrikler, operasyonel ihtiyaçların karşılanması, çalışan memnuniyeti/adaleti ve teknik performans başlıkları altında gruplandırılmıştır. Özellikle bitirme projesi sunumu için önemli olan noktalar ayrıca belirtilmiştir.

## Metrik Görselleştirme Rehberi

Aşağıdaki metrikler, bitirme projesi sunumunda etkili bir şekilde görselleştirilebilir:

* **Çubuk ve Sütun Grafikler**: Karşılanan tercih oranları, minimum personel karşılama oranları gibi yüzdesel metrikleri göstermek için.
* **Çizgi Grafikler**: Farklı parametre ayarları altında hedef fonksiyon değerinin veya çözüm süresinin değişimini göstermek için.
* **Isı Haritaları**: İş yükü dağılımını veya vardiya atamalarını görselleştirmek için.
* **Pasta Grafikler**: Karşılanan/karşılanmayan tercihlerin oranını göstermek için.
* **Radar Grafikler**: Farklı senaryolarda birden fazla metriğin performansını karşılaştırmak için.
* **Kutu Grafikleri (Box Plots)**: Çalışanlar arasındaki iş yükü dağılımını göstermek için.

Her metrik için önerilen görselleştirme yöntemi ilgili bölümlerde belirtilmiştir.

## Karşılaştırmalı Analiz Yaklaşımı

Metriklerin değerlendirilmesinde aşağıdaki karşılaştırma yaklaşımları kullanılacaktır:

* **Manuel vs. Otomatik Planlama**: Mevcut manuel planlama süreciyle optimizasyon çözümünün karşılaştırılması.
* **Farklı Parametre Ayarları**: Çeşitli hedef ağırlıkları ve kısıt kombinasyonları altında sonuçların karşılaştırılması.
* **Farklı Senaryolar**: Yüksek iş yükü dönemleri, tatil sezonu, salgın dönemi gibi farklı senaryolarda sistemin performansının karşılaştırılması.
* **Sektörler Arası Karşılaştırma**: Sağlık, eğitim, perakende gibi farklı sektörlerde sistemin uyarlanabilirliğinin karşılaştırılması.

## Ekonomik Etki Analizi

Optimizasyon çözümünün ekonomik etkisi aşağıdaki boyutlarda değerlendirilecektir:

* **Personel Maliyeti Tasarrufu**: Fazla personel atamalarının azaltılmasıyla elde edilen tasarruf.
* **Operasyonel Verimlilik Artışı**: Daha iyi personel dağılımı ve yetenek eşleştirmesi sayesinde hizmet kalitesindeki artışın ekonomik değeri.
* **Planlama Süreci Tasarrufu**: Manuel planlama sürecinde harcanan zamanın azaltılmasıyla elde edilen tasarruf.
* **Çalışan Memnuniyeti Etkisi**: Tercih karşılama oranındaki artışın çalışan devir hızı ve verimlilik üzerindeki ekonomik etkisi.

## 1. Operasyonel İhtiyaçların Karşılanması Metrikleri

Bu metrikler, modelin kurumun temel operasyonel gereksinimlerini ne ölçüde karşıladığını gösterir.

### 1.1. Minimum Personel Karşılama Oranı

*   **Ne Ölçer:** Konfigürasyonda tanımlanan vardiya bazlı minimum personel (ve gerekirse rol/departman/uzmanlık bazında) gereksinimlerinin ne kadarının karşılandığını.
*   **Nasıl Hesaplanır:** `(Minimum gereksinimi karşılayan vardiya sayısı / Toplam vardiya sayısı) * 100`
*   **Neden Önemli:** Kurumun temel operasyonel devamlılığını ve güvenliğini sağlar. Modelin geçerli bir çözüm üretip üretmediğinin temel göstergesidir.
*   **Sunum Notu:** Çözüm OPTIMAL/FEASIBLE ve kural sert ise "%100 Karşılandı" olarak sunulur. Modelin temel görevi yerine getirdiğini vurgular. Farklı senaryolarda oranın değişimi (varsa) gösterilebilir.
*   **Görselleştirme:** Sütun grafik kullanılarak manuel planlama ile optimizasyon sonuçları karşılaştırılabilir. Farklı departmanlar veya vardiya türleri için ayrı ayrı gösterilebilir.

### 1.2. Yetenek Gereksinimi Karşılama Oranı

*   **Ne Ölçer:** Konfigürasyonda tanımlanan özel yetenek (örn: "Acil Tıp") gereksinimlerinin ne kadarının karşılandığını.
*   **Nasıl Hesaplanır:** `(Minimum yetenek gereksinimini karşılayan vardiya sayısı / Yetenek gereksinimi olan toplam vardiya sayısı) * 100`
*   **Neden Önemli:** Özel uzmanlık gerektiren görevlerin aksamamasını sağlar.
*   **Sunum Notu:** Minimum personel metriği gibi, sert kısıtlar için %100 hedeflenir ve modelin geçerliliğini destekler.
*   **Görselleştirme:** Yetenek türlerine göre gruplandırılmış yatay çubuk grafik kullanılabilir. Her yetenek için karşılanma oranı gösterilebilir.

### 1.3. Toplam Eksik Personel Saati/Vardiyası (Understaffing)

*   **Ne Ölçer:** Vardiyalardaki toplam personel eksikliğini (saat veya vardiya sayısı olarak).
*   **Nasıl Hesaplanır:** Her vardiya için `max(0, gerekli_personel - atanan_personel)` değerlerinin toplamı.
*   **Neden Önemli:** Operasyonel riskleri, hizmet kalitesindeki düşüşü ve potansiyel kural ihlallerini gösterir. Hedef fonksiyonu ile doğrudan ilişkilidir.
*   **Sunum Notu:** Düşük olması hedeflenir. Farklı hedef ağırlıkları veya senaryolar altında nasıl değiştiği gösterilerek modelin verimlilik optimizasyonu vurgulanır.
*   **Görselleştirme:** Zaman serisi grafiği kullanılarak günlere veya haftalara göre eksik personel saati gösterilebilir. Ayrıca, farklı hedef ağırlıkları için karşılaştırmalı çizgi grafik kullanılabilir.
*   **Ekonomik Etki:** Bu metrik, eksik personelin operasyonel maliyetini hesaplamak için kullanılabilir. Örneğin: `Toplam eksik personel saati * Ortalama hizmet aksaması maliyeti/saat`.

### 1.4. Toplam Fazla Personel Saati/Vardiyası (Overstaffing)

*   **Ne Ölçer:** Vardiyalardaki toplam personel fazlalığını.
*   **Nasıl Hesaplanır:** Her vardiya için `max(0, atanan_personel - gerekli_personel)` değerlerinin toplamı.
*   **Neden Önemli:** Gereksiz maliyetleri ve kaynak israfını gösterir. Hedef fonksiyonu ile ilişkilidir.
*   **Sunum Notu:** Düşük olması hedeflenir. Eksik personel metriği gibi, farklı ayarlarla nasıl optimize edildiği gösterilebilir.
*   **Görselleştirme:** Eksik personel metriğiyle birlikte gösterilen çift eksenli grafik kullanılabilir. Ayrıca, departman veya vardiya türüne göre ısı haritası oluşturulabilir.
*   **Ekonomik Etki:** Bu metrik, fazla personelin maliyet etkisini hesaplamak için kullanılabilir. Örneğin: `Toplam fazla personel saati * Ortalama personel saatlik maliyeti`. Optimizasyon sonucunda elde edilen tasarruf: `(Manuel planlamadaki fazla personel saati - Optimizasyon sonrası fazla personel saati) * Ortalama personel saatlik maliyeti`.

## 2. Çalışan Memnuniyeti ve Adalet Metrikleri

Bu metrikler, optimizasyonun çalışanlar üzerindeki etkisini ve adalet algısını değerlendirir.

### 2.1. Tercih Karşılama Metrikleri

#### 2.1.1. Karşılanan Tercih Oranı

*   **Ne Ölçer:** Çalışanların belirttiği pozitif vardiya tercihlerinin ne kadarının yerine getirildiğini.
*   **Nasıl Hesaplanır:** `(Atanan ve pozitif tercih edilen vardiya sayısı / Toplam pozitif tercih sayısı) * 100`
*   **Neden Önemli:** Çalışan memnuniyetini, motivasyonu ve bağlılığı artırmaya yardımcı olur. Modelin sadece operasyonel değil, insan odaklı olduğunu gösterir.
*   **Sunum Notu:** Modelin çalışanları ne ölçüde dikkate aldığını gösterir. Tercihlerin ağırlığının değiştirildiği senaryolarla karşılaştırma yapmak etkili olabilir.
*   **Görselleştirme:** Pasta grafik kullanılarak karşılanan ve karşılanmayan tercihler gösterilebilir. Ayrıca, çalışan gruplarına (rol, departman vb.) göre tercih karşılama oranları çubuk grafik ile karşılaştırılabilir.
*   **Kullanıcı Deneyimi Etkisi:** Bu metrik, çalışan memnuniyet anketleriyle ilişkilendirilebilir. Örneğin: "Tercih karşılama oranındaki %10'luk artış, çalışan memnuniyetinde %X'lik artışa karşılık gelmektedir."

#### 2.1.2. Pozitif Tercih Sayısı

*   **Ne Ölçer:** Çalışanların pozitif tercih belirttiği vardiyalardan kaç tanesine atama yapıldığını.
*   **Nasıl Hesaplanır:** Pozitif tercih skoruna sahip olup atama yapılan `(çalışan, vardiya)` çiftlerinin sayısı.
*   **Neden Önemli:** Çalışan memnuniyetini doğrudan etkiler ve modelin çalışan tercihlerini ne kadar dikkate aldığını gösterir.
*   **Sunum Notu:** Toplam pozitif tercih sayısıyla birlikte sunularak karşılama oranı hesaplanabilir. Yüksek olması hedeflenir.
*   **Görselleştirme:** Çubuk grafik kullanılarak farklı parametre ayarları altında karşılanan pozitif tercih sayıları karşılaştırılabilir.

#### 2.1.3. Negatif Tercih Sayısı

*   **Ne Ölçer:** Çalışanların negatif tercih belirttiği vardiyalardan kaç tanesine atama yapıldığını.
*   **Nasıl Hesaplanır:** Negatif tercih skoruna sahip olup atama yapılan `(çalışan, vardiya)` çiftlerinin sayısı.
*   **Neden Önemli:** Çalışan memnuniyetsizliğini ve potansiyel tükenmişliği gösterir. Modelin istenmeyen atamaları ne kadar minimize ettiğini ölçer.
*   **Sunum Notu:** Düşük olması hedeflenir, ideal olarak sıfır. Operasyonel kısıtlar nedeniyle bazen istenmeyen vardiyalara atama yapılması gerekebileceği, ancak modelin bunu minimize etmeye çalıştığı vurgulanabilir.
*   **Görselleştirme:** Çubuk grafik kullanılarak farklı parametre ayarları altında atanan negatif tercih sayıları karşılaştırılabilir.

#### 2.1.4. Toplam Tercih Skoru

*   **Ne Ölçer:** Tüm atamaların toplam tercih skorunu.
*   **Nasıl Hesaplanır:** Atama yapılan tüm `(çalışan, vardiya)` çiftleri için tercih skorlarının toplamı.
*   **Neden Önemli:** Çözümün genel çalışan memnuniyeti üzerindeki etkisini tek bir sayıyla ifade eder. Hedef fonksiyonunun tercihlerle ilgili bileşenini doğrudan yansıtır.
*   **Sunum Notu:** Yüksek olması hedeflenir. Farklı hedef ağırlıkları altında nasıl değiştiği gösterilerek, tercih ağırlığının etkisi vurgulanabilir.
*   **Görselleştirme:** Çizgi grafik kullanılarak tercih ağırlığının değişimine göre toplam tercih skorunun nasıl değiştiği gösterilebilir.

### 2.2. Atanan İstenmeyen Vardiya Sayısı

*   **Ne Ölçer:** Çalışanların istemediğini belirttiği (negatif skorlu) vardiyalara kaç atama yapıldığını.
*   **Nasıl Hesaplanır:** Negatif tercih skoruna sahip olup atama yapılan `(çalışan, vardiya)` çiftlerinin sayısı.
*   **Neden Önemli:** Çalışan memnuniyetsizliğini ve tükenmişliği azaltma çabasını gösterir.
*   **Sunum Notu:** Karşılanan tercihlerle birlikte sunularak dengeli bir resim çizilebilir. Düşük olması hedeflenir.
*   **Görselleştirme:** Çalışan bazında istenmeyen vardiya atama sayılarını gösteren yatay çubuk grafik kullanılabilir. Ayrıca, manuel planlama ile optimizasyon sonuçları karşılaştırılabilir.
*   **Vaka Çalışması:** Yüksek iş yükü dönemlerinde (örn. tatil sezonu) ve normal dönemlerde istenmeyen vardiya atamalarının karşılaştırması yapılabilir.

### 2.3. İş Yükü Dağılımı Adaleti (Vardiya/Saat Standart Sapması)

*   **Ne Ölçer:** Toplam atanan vardiya sayısı veya toplam çalışma saatinin çalışanlar arasında ne kadar adil dağıldığını.
*   **Nasıl Hesaplanır:** Çalışan başına düşen toplam vardiya/saat sayılarının standart sapması. (Düşük standart sapma = Daha adil dağılım).
*   **Neden Önemli:** Çalışanlar arasında algılanan adaletsizliği ve potansiyel tükenmişliği azaltır.
*   **Sunum Notu:** Optimizasyonun sadece toplam ihtiyacı değil, dağılımı da iyileştirdiğini göstermek için kullanılabilir. Manuel planlamayla (varsa) karşılaştırma yapılabilir.
*   **Görselleştirme:** Çalışan bazında toplam vardiya/saat dağılımını gösteren kutu grafiği (box plot) kullanılabilir. Ayrıca, manuel planlama ve optimizasyon sonuçlarının standart sapmalarını karşılaştıran çubuk grafik eklenebilir.
*   **Karşılaştırmalı Analiz:** Farklı optimizasyon parametreleri (örn. adalet ağırlığı değiştirildiğinde) altında standart sapmanın nasıl değiştiğini gösteren bir analiz yapılabilir.

### 2.4. "Kötü" Vardiya Dağılımı Adaleti

*   **Ne Ölçer:** Gece vardiyaları, hafta sonu vardiyaları gibi genellikle daha az istenen vardiyaların çalışanlar arasında adil dağılıp dağılmadığını.
*   **Nasıl Hesaplanır:** Her çalışan için atanan "kötü" vardiya sayılarının standart sapması.
*   **Neden Önemli:** Tükenmişliği önler ve adalet hissini güçlendirir.
*   **Sunum Notu:** İş yükü dağılımı metriğiyle benzer şekilde, modelin zorlu koşulları da adil dağıtmaya çalıştığını (eğer hedeflenmişse) gösterir.
*   **Görselleştirme:** Isı haritası kullanılarak çalışanlar ve "kötü" vardiya türleri arasındaki dağılım gösterilebilir. Ayrıca, manuel planlama ve optimizasyon sonuçlarının karşılaştırması yapılabilir.
*   **Vaka Çalışması:** Farklı departmanlar veya rol grupları için "kötü" vardiya dağılımının karşılaştırması yapılabilir.

## 3. Teknik Performans ve Sağlamlık Metrikleri

Bu metrikler, çözümün teknik kalitesini, hızını ve esnekliğini değerlendirir.

### 3.1. n8n Entegrasyonu ve Kullanıcı Deneyimi Metrikleri

Bu bölüm, n8n entegrasyonunun etkinliğini ve kullanıcı deneyimini değerlendiren ek metrikler içerir.

#### 3.1.1. n8n İş Akışı Tamamlanma Süresi

*   **Ne Ölçer:** n8n iş akışının veri hazırlama, API çağrısı ve sonuçların işlenmesi dahil toplam çalışma süresini.
*   **Nasıl Hesaplanır:** n8n iş akışı çalışma loglarından alınır.
*   **Neden Önemli:** Entegrasyonun verimliliğini ve kullanıcı deneyimini doğrudan etkiler.
*   **Görselleştirme:** Çizgi grafik kullanılarak farklı veri boyutları için iş akışı tamamlanma süreleri gösterilebilir.
*   **Kullanıcı Deneyimi Etkisi:** Manuel süreçle karşılaştırmalı zaman tasarrufu hesaplanabilir.

### 3.2. Sistem Esnekliği ve Uyarlanabilirlik Metrikleri

Bu metrikler, sistemin farklı kurumlara ve veri yapılarına ne kadar kolay uyarlanabildiğini ölçer.

#### 3.2.1. Sistem Uyarlanabilirlik Skoru

*   **Ne Ölçer:** Sistemin farklı kurumlara ve veri yapılarına ne kadar kolay uyarlanabildiğini.
*   **Nasıl Hesaplanır:** 0-10 arası bir skor (10 en uyarlanabilir). Konfigürasyon karmaşıklığı ve kural sayısına dayalı bir formül kullanılır:
    ```
    Eğer kural_sayısı == 0:
        skor = 3.0  # Çok az kural = düşük uyarlanabilirlik
    Değilse:
        skor = 10.0 - (konfigürasyon_karmaşıklık_skoru * 0.5)

        # Belirli bir kural sayısı uyarlanabilirliği artırır
        Eğer 2 <= kural_sayısı <= 8:
            skor += 2.0

        # 0-10 aralığında sınırla
        skor = max(0, min(10, skor))
    ```
*   **Neden Önemli:** Çözümün farklı sektörlerde ve kurumlarda kullanılabilirliğini gösterir. Yüksek uyarlanabilirlik, sistemin daha geniş bir kullanıcı tabanına hitap edebileceği anlamına gelir.
*   **Sunum Notu:** Yüksek skor (7-10), sistemin farklı kurumlara kolayca uyarlanabileceğini gösterir. Orta skor (4-6), bazı özelleştirmeler gerekebileceğini, düşük skor (0-3) ise önemli değişiklikler gerekebileceğini gösterir.
*   **Görselleştirme:** Farklı konfigürasyonlar için uyarlanabilirlik skorlarını gösteren radar grafik kullanılabilir.
*   **Vaka Çalışması:** Farklı sektörlerden (sağlık, eğitim, perakende vb.) kurumlar için uyarlanabilirlik skorlarının karşılaştırması yapılabilir.

#### 3.2.2. Konfigürasyon Karmaşıklık Skoru

*   **Ne Ölçer:** Konfigürasyonun ne kadar karmaşık olduğunu.
*   **Nasıl Hesaplanır:** 0-10 arası bir skor (10 en karmaşık). Kural sayısı ve kural türlerine göre hesaplanır:
    ```
    # Kural sayısına göre karmaşıklık
    Eğer kural_sayısı <= 2:
        karmaşıklık += 2
    Eğer 2 < kural_sayısı <= 5:
        karmaşıklık += 4
    Eğer 5 < kural_sayısı <= 10:
        karmaşıklık += 6
    Eğer kural_sayısı > 10:
        karmaşıklık += 8

    # Kural türlerine göre karmaşıklık
    Eğer 'min_staffing_requirements' varsa: karmaşıklık += 1
    Eğer 'skill_requirements' varsa: karmaşıklık += 1
    Eğer 'min_rest_time_hours' veya 'min_rest_time_minutes' varsa: karmaşıklık += 1
    Eğer 'max_consecutive_shifts' varsa: karmaşıklık += 1

    # Maksimum 10 olacak şekilde normalize et
    karmaşıklık_skoru = min(10, karmaşıklık)
    ```
*   **Neden Önemli:** Konfigürasyonun karmaşıklığı, sistemin anlaşılabilirliğini ve bakım kolaylığını etkiler. Daha karmaşık konfigürasyonlar, daha fazla uzmanlık gerektirir ve hata riski daha yüksektir.
*   **Sunum Notu:** Düşük skor (0-3), basit ve anlaşılır bir konfigürasyon olduğunu gösterir. Orta skor (4-6), makul bir karmaşıklık seviyesini, yüksek skor (7-10) ise karmaşık ve potansiyel olarak bakımı zor bir konfigürasyon olduğunu gösterir.
*   **Görselleştirme:** Farklı konfigürasyonların karmaşıklık skorlarını karşılaştıran çubuk grafik kullanılabilir.
*   **Vaka Çalışması:** Farklı kural kombinasyonlarının karmaşıklık skorları üzerindeki etkisi analiz edilebilir.

#### 3.2.3. Kural Sayısı

*   **Ne Ölçer:** Sistemde tanımlı toplam kural sayısını.
*   **Nasıl Hesaplanır:** Konfigürasyonda tanımlı tüm kuralların sayısı:
    ```
    kural_sayısı = len(min_staffing_rules) + len(skill_rules)

    # Diğer kurallar
    Eğer 'max_consecutive_shifts' varsa: kural_sayısı += 1
    Eğer 'min_rest_time_hours' veya 'min_rest_time_minutes' varsa: kural_sayısı += 1
    ```
*   **Neden Önemli:** Kural sayısı, sistemin karmaşıklığını ve esnekliğini etkiler. Çok az kural, sistemin yetersiz kısıtlara sahip olabileceğini, çok fazla kural ise sistemin çok katı olabileceğini gösterir.
*   **Sunum Notu:** Optimal kural sayısı (2-8 arası), sistemin hem esnek hem de güçlü olduğunu gösterir. Çok az kural (0-1), sistemin çok basit olabileceğini, çok fazla kural (>10) ise sistemin çok karmaşık olabileceğini gösterir.
*   **Görselleştirme:** Farklı konfigürasyonların kural sayılarını karşılaştıran çubuk grafik kullanılabilir.
*   **Vaka Çalışması:** Farklı sektörlerde optimal kural sayısının nasıl değiştiği analiz edilebilir.

### 3.3. Çözüm Süresi (Solver Time)

*   **Ne Ölçer:** Optimizasyon motorunun (CP-SAT) bir çözüm bulmak için harcadığı süre.
*   **Nasıl Hesaplanır:** API loglarından alınır.
*   **Neden Önemli:** Modelin pratik kullanım için ne kadar hızlı olduğunu gösterir. Özellikle sık yeniden planlama gereken durumlar için kritiktir.
*   **Sunum Notu:** Farklı veri boyutları veya kural setleriyle sürelerin nasıl değiştiğini gösteren bir grafik, modelin ölçeklenebilirliği hakkında fikir verir.
*   **Görselleştirme:** Çizgi grafik kullanılarak farklı problem boyutları (çalışan sayısı, vardiya sayısı) için çözüm süresinin değişimi gösterilebilir.
*   **Kullanıcı Deneyimi Etkisi:** Manuel planlamaya göre zaman tasarrufu hesaplanabilir. Örneğin: "Manuel planlama süreci ortalama X saat sürerken, optimizasyon çözümü Y saniyede sonuç üretmektedir."

### 3.4. Çözüm Durumu (OPTIMAL, FEASIBLE, INFEASIBLE)

*   **Ne Ölçer:** Modelin verilen kısıtlar altında matematiksel olarak en iyi (OPTIMAL), geçerli (FEASIBLE) veya çözümsüz (INFEASIBLE) bir durum bulup bulmadığını belirtir.
*   **Neden Önemli:** Modelin sağlamlığını ve kısıtları karşılama yeteneğini gösterir.
*   **Sunum Notu:** Çoğu senaryoda OPTIMAL/FEASIBLE sonuç alındığını göstermek önemlidir. INFEASIBLE durumların nedenleri açıklanmalıdır.
*   **Görselleştirme:** Farklı senaryolarda çözüm durumlarının dağılımını gösteren pasta grafik kullanılabilir.
*   **Vaka Çalışması:** Çeşitli kısıt kombinasyonları altında modelin çözüm durumlarının analizi yapılabilir. Örneğin: "Hangi kısıt kombinasyonları INFEASIBLE sonuçlara yol açıyor?"

### 3.5. Hedef Fonksiyon Değeri

*   **Ne Ölçer:** Bulunan çözümün genel kalitesini, tanımlanan ağırlıklara göre sayısal olarak ifade eder.
*   **Nasıl Hesaplanır:** API sonucundan alınır (`objective_value`).
*   **Neden Önemli:** Farklı çözümlerin veya senaryoların kalitesini karşılaştırmak için kullanılır.
*   **Sunum Notu:** Tek başına mutlak değeri yerine, farklı senaryolarda (örn. ağırlık değişiklikleri) nasıl değiştiğini veya manuel plana göre ne kadar iyileştiğini göstermek daha anlamlıdır. Negatif değerlerin nasıl yorumlanacağı (tercihlerin ağır basması) açıklanabilir.
*   **Görselleştirme:** Radar grafik kullanılarak farklı hedef ağırlıkları altında çözüm kalitesinin çeşitli boyutları (eksik personel, fazla personel, tercih karşılama) gösterilebilir.
*   **Ekonomik Etki:** Hedef fonksiyon değerindeki iyileşmenin ekonomik karşılığı hesaplanabilir. Örneğin: "Hedef fonksiyon değerindeki X birimlik iyileşme, yaklaşık Y TL'lik maliyet tasarrufu ve Z TL'lik hizmet kalitesi artışına karşılık gelmektedir."

## 4. Gelecek Çalışmalar: Ekonomik Etki Analizi Metrikleri

Bu bölüm, projenin ilerleyen aşamalarında uygulanması planlanan ekonomik etki analizi metriklerini içermektedir. Bu metrikler, optimizasyon çözümünün kuruma sağladığı ekonomik faydaları somut olarak ölçmeyi amaçlamaktadır.

### 4.1. Manuel Plan Olmadan Ekonomik Etki Analizi Yaklaşımları

Manuel planlama verisi olmadığı durumlarda ekonomik etki analizini gerçekleştirmek için aşağıdaki yaklaşımlar kullanılabilir:

#### 4.1.1. Doğrudan Ölçülebilen Ekonomik Metrikler

*   **Planlama Süreci Tasarrufu**: Optimizasyon çözümünün planlama sürecinde sağladığı zaman tasarrufu.
    *   **Hesaplama**: `(Tahmini manuel planlama süresi - Optimizasyon çözüm süresi) * Planlayıcı saatlik ücreti`
    *   **Veri Kaynağı**: Optimizasyon çözüm süresi doğrudan ölçülebilir, manuel planlama için sektör ortalamaları kullanılabilir.

*   **Fazla Personel Maliyeti Optimizasyonu**: Optimizasyon çözümünün fazla personel atamalarını minimize ederek sağladığı tasarruf.
    *   **Hesaplama**: `Toplam fazla personel saati * Ortalama personel saatlik maliyeti`
    *   **Veri Kaynağı**: Optimizasyon sonucunda hesaplanan `total_overstaffing` değeri.

*   **Eksik Personel Maliyeti Optimizasyonu**: Eksik personelin neden olduğu hizmet aksaması maliyetlerinin azaltılması.
    *   **Hesaplama**: `Toplam eksik personel saati * Tahmini hizmet aksaması maliyeti/saat`
    *   **Veri Kaynağı**: Optimizasyon sonucunda hesaplanan `total_understaffing` değeri.

#### 4.1.2. Dolaylı Ekonomik Etki Metrikleri

*   **Yetenek Eşleştirme Ekonomik Değeri**: Doğru yeteneklere sahip çalışanların doğru vardiyalara atanmasının ekonomik değeri.
    *   **Hesaplama**: `Yetenek karşılama oranı * Tahmini hizmet kalitesi ekonomik değeri`
    *   **Veri Kaynağı**: Optimizasyon sonucunda hesaplanan `skill_coverage_ratio` değeri.

*   **Çalışan Memnuniyeti Ekonomik Değeri**: Tercih karşılama oranının çalışan memnuniyeti ve verimliliği üzerindeki ekonomik etkisi.
    *   **Hesaplama**: `Karşılanan pozitif tercih sayısı * Tahmini çalışan memnuniyeti birim değeri`
    *   **Veri Kaynağı**: Optimizasyon sonucunda hesaplanan `positive_preferences_met_count` değeri.

*   **İş Yükü Dengesi Ekonomik Değeri**: Dengeli iş yükü dağılımının çalışan tükenmişliği ve devir hızı üzerindeki ekonomik etkisi.
    *   **Hesaplama**: `(1 - Normalize edilmiş iş yükü standart sapması) * Tahmini iş yükü dengesi ekonomik değeri`
    *   **Veri Kaynağı**: Optimizasyon sonucunda hesaplanan `workload_distribution_std_dev` değeri.

### 4.2. Uygulama Planı

Ekonomik etki analizi metriklerinin uygulanması için aşağıdaki adımlar izlenecektir:

1. **Ekonomik Parametre Tanımları**: Kuruma özgü ekonomik parametrelerin (ortalama saatlik maliyet, hizmet aksaması maliyeti vb.) belirlenmesi ve konfigürasyon dosyasına eklenmesi.

2. **Metrik Hesaplama Modülü**: Ekonomik etki metriklerini hesaplayan bir Python modülünün geliştirilmesi ve `cp_model_builder.py` dosyasına entegre edilmesi.

3. **Sonuç Raporlama**: Ekonomik etki metriklerinin API yanıtına ve raporlara dahil edilmesi.

4. **Görselleştirme**: Ekonomik etki metriklerini görselleştiren grafiklerin oluşturulması.

Bu gelecek çalışma, optimizasyon çözümünün kuruma sağladığı ekonomik faydaları somut olarak göstermeyi ve karar vericilere daha kapsamlı bilgi sunmayı amaçlamaktadır.

### 4.3. Diğer Gelecek Metrik Geliştirmeleri

#### 4.3.1. Karşılanan Tercih Oranı Metriği

Mevcut sistemde pozitif tercih sayısı (`positive_preferences_met_count`) hesaplanmaktadır, ancak toplam pozitif tercih sayısına oranı hesaplanmamaktadır. Bu metriğin geliştirilmesi planlanmaktadır:

*   **Ne Ölçer:** Çalışanların belirttiği pozitif vardiya tercihlerinin ne kadarının yerine getirildiğini.
*   **Nasıl Hesaplanır:** `(Atanan ve pozitif tercih edilen vardiya sayısı / Toplam pozitif tercih sayısı) * 100`
*   **Uygulama Planı:**
    1. Toplam pozitif tercih sayısını hesaplayan kod eklenecek: `total_positive_prefs = sum(1 for p in preferences if p.get('preference_score', 0) > 0)`
    2. Oran hesaplanacak: `preference_ratio = positive_prefs_met / total_positive_prefs if total_positive_prefs > 0 else 0`
    3. Sonuç metriklerine eklenecek: `"preference_satisfaction_ratio": preference_ratio`

#### 4.3.2. n8n İş Akışı Tamamlanma Süresi Metriği

n8n entegrasyonu tamamlandığında, iş akışı performansını ölçmek için bu metriğin uygulanması planlanmaktadır:

*   **Ne Ölçer:** n8n iş akışının veri hazırlama, API çağrısı ve sonuçların işlenmesi dahil toplam çalışma süresini.
*   **Nasıl Hesaplanır:** n8n iş akışı çalışma loglarından alınır.
*   **Uygulama Planı:**
    1. n8n iş akışına başlangıç ve bitiş zamanlarını kaydeden adımlar eklenecek
    2. Bu zamanlar arasındaki fark hesaplanacak
    3. Sonuçlar raporlara dahil edilecek