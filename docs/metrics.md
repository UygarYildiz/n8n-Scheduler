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

### 2.1. Karşılanan Tercih Oranı/Skoru

*   **Ne Ölçer:** Çalışanların belirttiği pozitif vardiya tercihlerinin ne kadarının yerine getirildiğini.
*   **Nasıl Hesaplanır:** `(Atanan ve pozitif tercih edilen vardiya sayısı / Toplam pozitif tercih sayısı) * 100` veya optimizasyon sonucundaki hedef fonksiyonunun tercihlerle ilgili bileşeninin değeri.
*   **Neden Önemli:** Çalışan memnuniyetini, motivasyonu ve bağlılığı artırmaya yardımcı olur. Modelin sadece operasyonel değil, insan odaklı olduğunu gösterir.
*   **Sunum Notu:** Modelin çalışanları ne ölçüde dikkate aldığını gösterir. Tercihlerin ağırlığının değiştirildiği senaryolarla karşılaştırma yapmak etkili olabilir.
*   **Görselleştirme:** Pasta grafik kullanılarak karşılanan ve karşılanmayan tercihler gösterilebilir. Ayrıca, çalışan gruplarına (rol, departman vb.) göre tercih karşılama oranları çubuk grafik ile karşılaştırılabilir.
*   **Kullanıcı Deneyimi Etkisi:** Bu metrik, çalışan memnuniyet anketleriyle ilişkilendirilebilir. Örneğin: "Tercih karşılama oranındaki %10'luk artış, çalışan memnuniyetinde %X'lik artışa karşılık gelmektedir."

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

### n8n Entegrasyonu ve Kullanıcı Deneyimi Metrikleri

Bu bölüm, n8n entegrasyonunun etkinliğini ve kullanıcı deneyimini değerlendiren ek metrikler içerir.

#### n8n İş Akışı Tamamlanma Süresi

*   **Ne Ölçer:** n8n iş akışının veri hazırlama, API çağrısı ve sonuçların işlenmesi dahil toplam çalışma süresini.
*   **Nasıl Hesaplanır:** n8n iş akışı çalışma loglarından alınır.
*   **Neden Önemli:** Entegrasyonun verimliliğini ve kullanıcı deneyimini doğrudan etkiler.
*   **Görselleştirme:** Çizgi grafik kullanılarak farklı veri boyutları için iş akışı tamamlanma süreleri gösterilebilir.
*   **Kullanıcı Deneyimi Etkisi:** Manuel süreçle karşılaştırmalı zaman tasarrufu hesaplanabilir.

#### Sistem Esnekliği ve Uyarlanabilirlik

*   **Ne Ölçer:** Sistemin farklı kurumlara ve veri yapılarına ne kadar kolay uyarlanabildiğini.
*   **Nasıl Hesaplanır:** Yeni bir kuruma veya veri yapısına uyarlama için gereken konfigürasyon değişikliği sayısı ve süresi.
*   **Neden Önemli:** Çözümün farklı sektörlerde ve kurumlarda kullanılabilirliğini gösterir.
*   **Görselleştirme:** Farklı kurumlar için uyarlama süreçlerini karşılaştıran çubuk grafik kullanılabilir.
*   **Vaka Çalışması:** Farklı sektörlerden (sağlık, eğitim, perakende vb.) kurumlar için uyarlama örnekleri sunulabilir.

### 3.1. Çözüm Süresi (Solver Time)

*   **Ne Ölçer:** Optimizasyon motorunun (CP-SAT) bir çözüm bulmak için harcadığı süre.
*   **Nasıl Hesaplanır:** API loglarından alınır.
*   **Neden Önemli:** Modelin pratik kullanım için ne kadar hızlı olduğunu gösterir. Özellikle sık yeniden planlama gereken durumlar için kritiktir.
*   **Sunum Notu:** Farklı veri boyutları veya kural setleriyle sürelerin nasıl değiştiğini gösteren bir grafik, modelin ölçeklenebilirliği hakkında fikir verir.
*   **Görselleştirme:** Çizgi grafik kullanılarak farklı problem boyutları (çalışan sayısı, vardiya sayısı) için çözüm süresinin değişimi gösterilebilir.
*   **Kullanıcı Deneyimi Etkisi:** Manuel planlamaya göre zaman tasarrufu hesaplanabilir. Örneğin: "Manuel planlama süreci ortalama X saat sürerken, optimizasyon çözümü Y saniyede sonuç üretmektedir."

### 3.2. Çözüm Durumu (OPTIMAL, FEASIBLE, INFEASIBLE)

*   **Ne Ölçer:** Modelin verilen kısıtlar altında matematiksel olarak en iyi (OPTIMAL), geçerli (FEASIBLE) veya çözümsüz (INFEASIBLE) bir durum bulup bulmadığını belirtir.
*   **Neden Önemli:** Modelin sağlamlığını ve kısıtları karşılama yeteneğini gösterir.
*   **Sunum Notu:** Çoğu senaryoda OPTIMAL/FEASIBLE sonuç alındığını göstermek önemlidir. INFEASIBLE durumların nedenleri açıklanmalıdır.
*   **Görselleştirme:** Farklı senaryolarda çözüm durumlarının dağılımını gösteren pasta grafik kullanılabilir.
*   **Vaka Çalışması:** Çeşitli kısıt kombinasyonları altında modelin çözüm durumlarının analizi yapılabilir. Örneğin: "Hangi kısıt kombinasyonları INFEASIBLE sonuçlara yol açıyor?"

### 3.3. Hedef Fonksiyon Değeri

*   **Ne Ölçer:** Bulunan çözümün genel kalitesini, tanımlanan ağırlıklara göre sayısal olarak ifade eder.
*   **Nasıl Hesaplanır:** API sonucundan alınır (`objective_value`).
*   **Neden Önemli:** Farklı çözümlerin veya senaryoların kalitesini karşılaştırmak için kullanılır.
*   **Sunum Notu:** Tek başına mutlak değeri yerine, farklı senaryolarda (örn. ağırlık değişiklikleri) nasıl değiştiğini veya manuel plana göre ne kadar iyileştiğini göstermek daha anlamlıdır. Negatif değerlerin nasıl yorumlanacağı (tercihlerin ağır basması) açıklanabilir.
*   **Görselleştirme:** Radar grafik kullanılarak farklı hedef ağırlıkları altında çözüm kalitesinin çeşitli boyutları (eksik personel, fazla personel, tercih karşılama) gösterilebilir.
*   **Ekonomik Etki:** Hedef fonksiyon değerindeki iyileşmenin ekonomik karşılığı hesaplanabilir. Örneğin: "Hedef fonksiyon değerindeki X birimlik iyileşme, yaklaşık Y TL'lik maliyet tasarrufu ve Z TL'lik hizmet kalitesi artışına karşılık gelmektedir."