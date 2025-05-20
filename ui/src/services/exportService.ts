import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';

// Türkçe karakter desteği için font
import 'jspdf-autotable';

/**
 * Optimizasyon sonuçlarını Excel formatında dışa aktarır
 * @param data Optimizasyon sonuçları
 * @param fileName Dosya adı
 */
export const exportToExcel = (data: any, fileName: string = 'optimizasyon_sonuclari') => {
  try {
    // Veri setini hazırla
    const workbook = XLSX.utils.book_new();
    
    // Özet sayfası
    const summaryData = [
      ['Optimizasyon Bilgileri', ''],
      ['Veri Seti', data.dataset_type === 'hastane' ? 'Hastane' : 'Çağrı Merkezi'],
      ['Çözücü Durumu', data.status || ''],
      ['Çalışma Süresi (saniye)', data.processing_time_seconds || 0],
      ['Hedef Değeri', data.objective_value || 0],
      ['Toplam Atama Sayısı', data.total_assignments || 0],
      ['', ''],
      ['Metrikler', ''],
      ['Eksik Personel', data.metrics?.total_understaffing || 0],
      ['Fazla Personel', data.metrics?.total_overstaffing || 0],
      ['Minimum Personel Karşılama Oranı', `${(data.metrics?.min_staffing_coverage_ratio * 100 || 0).toFixed(1)}%`],
      ['Yetenek Karşılama Oranı', `${(data.metrics?.skill_coverage_ratio * 100 || 0).toFixed(1)}%`],
      ['Karşılanan Pozitif Tercih Sayısı', data.metrics?.positive_preferences_met_count || 0],
      ['Atanan Negatif Tercih Sayısı', data.metrics?.negative_preferences_assigned_count || 0],
      ['Toplam Tercih Skoru', data.metrics?.total_preference_score_achieved || 0],
      ['İş Yükü Dağılımı Std. Sapma', data.metrics?.workload_distribution_std_dev?.toFixed(3) || 0]
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Özet');
    
    // Atamalar sayfası
    if (data.assignments && data.assignments.length > 0) {
      // Başlık satırı
      const assignmentsHeaders = [
        'Çalışan ID', 
        'Çalışan Adı', 
        'Çalışan Rolü', 
        'Vardiya ID', 
        'Vardiya Adı', 
        'Departman', 
        'Tarih', 
        'Başlangıç', 
        'Bitiş'
      ];
      
      // Veri satırları
      const assignmentsData = data.assignments.map((assignment: any) => [
        assignment.employee_id || '',
        assignment.employee_name || '',
        assignment.employee_role || '',
        assignment.shift_id || '',
        assignment.shift_name || '',
        assignment.shift_department || '',
        assignment.date || '',
        assignment.start_time || '',
        assignment.end_time || ''
      ]);
      
      // Başlık satırını ekle
      assignmentsData.unshift(assignmentsHeaders);
      
      const assignmentsSheet = XLSX.utils.aoa_to_sheet(assignmentsData);
      XLSX.utils.book_append_sheet(workbook, assignmentsSheet, 'Atamalar');
    }
    
    // Departman İstatistikleri sayfası
    if (data.department_statistics && data.department_statistics.length > 0) {
      const deptHeaders = ['Departman', 'Atama Sayısı'];
      const deptData = data.department_statistics.map((dept: any) => [
        dept.name || '',
        dept.count || 0
      ]);
      
      deptData.unshift(deptHeaders);
      
      const deptSheet = XLSX.utils.aoa_to_sheet(deptData);
      XLSX.utils.book_append_sheet(workbook, deptSheet, 'Departman İstatistikleri');
    }
    
    // Rol İstatistikleri sayfası
    if (data.role_statistics && data.role_statistics.length > 0) {
      const roleHeaders = ['Rol', 'Atama Sayısı'];
      const roleData = data.role_statistics.map((role: any) => [
        role.name || '',
        role.count || 0
      ]);
      
      roleData.unshift(roleHeaders);
      
      const roleSheet = XLSX.utils.aoa_to_sheet(roleData);
      XLSX.utils.book_append_sheet(workbook, roleSheet, 'Rol İstatistikleri');
    }
    
    // Excel dosyasını oluştur ve indir
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Excel dışa aktarma hatası:', error);
    return false;
  }
};

/**
 * Optimizasyon sonuçlarını PDF formatında dışa aktarır
 * @param data Optimizasyon sonuçları
 * @param fileName Dosya adı
 */
export const exportToPDF = (data: any, fileName: string = 'optimizasyon_sonuclari') => {
  try {
    // PDF oluştur (A4 boyutu, yatay)
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    // Başlık
    doc.setFontSize(18);
    doc.text('Optimizasyon Sonuçları', 14, 20);
    
    // Tarih
    doc.setFontSize(10);
    doc.text(`Oluşturulma Tarihi: ${new Date().toLocaleString('tr-TR')}`, 14, 26);
    
    // Özet Bilgiler
    doc.setFontSize(14);
    doc.text('Özet Bilgiler', 14, 35);
    
    const summaryData = [
      ['Veri Seti', data.dataset_type === 'hastane' ? 'Hastane' : 'Çağrı Merkezi'],
      ['Çözücü Durumu', data.status || ''],
      ['Çalışma Süresi (saniye)', (data.processing_time_seconds || 0).toString()],
      ['Hedef Değeri', (data.objective_value || 0).toString()],
      ['Toplam Atama Sayısı', (data.total_assignments || 0).toString()]
    ];
    
    autoTable(doc, {
      startY: 38,
      head: [['Bilgi', 'Değer']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 10 }
    });
    
    // Metrikler
    const metricsData = [
      ['Eksik Personel', (data.metrics?.total_understaffing || 0).toString()],
      ['Fazla Personel', (data.metrics?.total_overstaffing || 0).toString()],
      ['Minimum Personel Karşılama Oranı', `${(data.metrics?.min_staffing_coverage_ratio * 100 || 0).toFixed(1)}%`],
      ['Yetenek Karşılama Oranı', `${(data.metrics?.skill_coverage_ratio * 100 || 0).toFixed(1)}%`],
      ['Karşılanan Pozitif Tercih Sayısı', (data.metrics?.positive_preferences_met_count || 0).toString()],
      ['Atanan Negatif Tercih Sayısı', (data.metrics?.negative_preferences_assigned_count || 0).toString()],
      ['Toplam Tercih Skoru', (data.metrics?.total_preference_score_achieved || 0).toString()],
      ['İş Yükü Dağılımı Std. Sapma', (data.metrics?.workload_distribution_std_dev?.toFixed(3) || 0).toString()]
    ];
    
    doc.setFontSize(14);
    doc.text('Metrikler', 14, doc.lastAutoTable.finalY + 10);
    
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 13,
      head: [['Metrik', 'Değer']],
      body: metricsData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 10 }
    });
    
    // Atamalar
    if (data.assignments && data.assignments.length > 0) {
      // Yeni sayfa
      doc.addPage();
      
      doc.setFontSize(16);
      doc.text('Vardiya Atamaları', 14, 20);
      
      const assignmentsHeaders = [
        'Çalışan ID', 
        'Çalışan Adı', 
        'Vardiya ID', 
        'Vardiya Adı', 
        'Departman', 
        'Tarih', 
        'Başlangıç', 
        'Bitiş'
      ];
      
      const assignmentsData = data.assignments.map((assignment: any) => [
        assignment.employee_id || '',
        assignment.employee_name || '',
        assignment.shift_id || '',
        assignment.shift_name || '',
        assignment.shift_department || '',
        assignment.date || '',
        assignment.start_time || '',
        assignment.end_time || ''
      ]);
      
      autoTable(doc, {
        startY: 25,
        head: [assignmentsHeaders],
        body: assignmentsData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 30 },
          2: { cellWidth: 20 },
          3: { cellWidth: 30 },
          4: { cellWidth: 25 },
          5: { cellWidth: 20 },
          6: { cellWidth: 15 },
          7: { cellWidth: 15 }
        }
      });
    }
    
    // PDF'i indir
    doc.save(`${fileName}.pdf`);
    
    return true;
  } catch (error) {
    console.error('PDF dışa aktarma hatası:', error);
    return false;
  }
};

/**
 * Sayfayı yazdırır
 */
export const printPage = () => {
  try {
    window.print();
    return true;
  } catch (error) {
    console.error('Yazdırma hatası:', error);
    return false;
  }
};
