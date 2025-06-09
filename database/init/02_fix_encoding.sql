-- Karakter kodlaması sorunlarını düzeltme scripti
-- Bu script, veritabanındaki Türkçe karakterlerin doğru şekilde saklandığından emin olur.

-- Mevcut role display_name değerlerini güncelle (Türkçe karakterlerle)
UPDATE roles SET display_name = 'Süper Yönetici' WHERE name = 'super_admin';
UPDATE roles SET display_name = 'Kurum Yöneticisi' WHERE name = 'org_admin';  
UPDATE roles SET display_name = 'Vardiya Yöneticisi' WHERE name = 'manager';
UPDATE roles SET display_name = 'Planlamacı' WHERE name = 'planner';
UPDATE roles SET display_name = 'Personel' WHERE name = 'staff';

-- Role açıklamalarını da güncelle
UPDATE roles SET description = 'Tüm sistem yetkilerine sahip süper yönetici' WHERE name = 'super_admin';
UPDATE roles SET description = 'Kurum içi tüm yetkilere sahip yönetici' WHERE name = 'org_admin';
UPDATE roles SET description = 'Vardiya planlama ve yönetim yetkilerine sahip' WHERE name = 'manager';
UPDATE roles SET description = 'Vardiya planlama yetkilerine sahip' WHERE name = 'planner';
UPDATE roles SET description = 'Sadece kendi bilgilerini görüntüleme yetkisine sahip' WHERE name = 'staff';

-- Organization name'lerini güncelle
UPDATE organizations SET name = 'Demo Hastane' WHERE type = 'hastane';
UPDATE organizations SET name = 'Demo Çağrı Merkezi' WHERE type = 'cagri_merkezi';

-- Kullanıcı adlarını güncelle
UPDATE users SET first_name = 'Sistem', last_name = 'Yöneticisi' WHERE username = 'admin';

-- UTF-8 karakter kontrolü için test verisi
SELECT id, name, display_name, CHAR_LENGTH(display_name) as char_length, LENGTH(display_name) as byte_length 
FROM roles 
WHERE is_active = TRUE; 