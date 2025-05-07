# generate_cagri_merkezi_data.py
# Bu dosya, bir Acil Çağrı Merkezi senaryosu için sentetik veri üretecektir.
# Daha sonra detaylı içerik eklenecektir.

import pandas as pd
import random
import os
import logging
import yaml
from datetime import date, timedelta, time
import fnmatch

print("generate_cagri_merkezi_data.py dosyası başarıyla oluşturuldu ve çalıştırılmaya hazır.")

# --- Parametreler ---
NUM_EMPLOYEES = 80 # Çağrı merkezi için personel sayısı (60'tan 80'e artırıldı)
NUM_DAYS = 7  # Bir haftalık çizelge için
START_DATE = date.today()
OUTPUT_DIR = "synthetic_data_cagri_merkezi" # Çıktı klasörü güncellendi
CONFIG_FILE_PATH = "configs/cagri_merkezi_config.yaml" # Konfigürasyon dosyası güncellendi

# Global olarak konfigürasyon dosyasını yükleyebiliriz, böylece her fonksiyon tekrar yüklemek zorunda kalmaz.
# Ancak, bu dosyanın varlığına ve geçerliliğine bağlı olacağından, ana generate_data içinde yüklemek daha güvenli olabilir.
# Şimdilik, enhance_data_based_on_config içinde yüklenmeye devam etsin.

# Çalışan Rolleri ve Dağılımları (Çağrı Merkezi Örneği)
# Vardiya Amiri oranı artırıldı (0.1 -> 0.15) - Liderlik ve Koordinasyon yeteneği için
ROLES = {
    "Çağrı Alıcı": 0.45,  # 0.5'ten düşürüldü
    "Yönlendirici": 0.3,  # Farklı masalara dağılacak
    "Vardiya Amiri": 0.15, # 0.1'den artırıldı - Liderlik ve Koordinasyon yeteneği için
    "Teknik Destek": 0.1
}

# Departman Tanımları (Çağrı Merkezi Masaları/Fonksiyonları)
# Konfigürasyon dosyasındaki gereksinimlere göre departman dağılımları ayarlandı
DEPARTMENTS = {
    "Genel Çağrı": 0.35,  # 0.4'ten düşürüldü
    "Polis Yönlendirme": 0.18,  # 0.15'ten artırıldı - Polis Kriz Protokolleri için
    "Sağlık Yönlendirme": 0.18,  # 0.15'ten artırıldı - Temel Tıbbi Triyaj Bilgisi için
    "İtfaiye Yönlendirme": 0.15,
    "Teknik Operasyonlar": 0.08,  # 0.1'den düşürüldü
    "Yönetim": 0.06  # 0.05'ten artırıldı - Vardiya Amiri sayısını artırmak için
}

# Yetenekler (Rol Bazlı - Çağrı Merkezi)
ROLE_SKILLS = {
    "Çağrı Alıcı": {
        "zorunlu": ["Hızlı Klavye Kullanımı", "Etkili İletişim", "Problem Çözme"],
        "secmeli": [
            "Yabancı Dil (İngilizce)", "Yabancı Dil (Almanca)", "Stres Yönetimi Teknikleri",
            "Kriz Yönetimi Temel Bilgisi", "Coğrafi Bilgi Sistemleri Kullanımı",
            "İleri Düzey Stres Yönetimi"  # Konfigürasyon dosyasında istenen yetenek eklendi
        ],
        "max_secmeli": 3  # 2'den 3'e artırıldı - Daha fazla yetenek atanabilmesi için
    },
    "Yönlendirici": { # Yönlendiricinin yetenekleri atandığı masaya göre değişecek
        "zorunlu": ["Acil Durum Kodları Bilgisi", "Karar Verme Yeteneği", "Harita Okuma"],
        "secmeli_desk_specific": {
            "Polis Yönlendirme": ["Polis Telsiz Prosedürleri", "Güvenlik Protokolleri", "Polis Kriz Protokolleri"],  # Konfigürasyon dosyasında istenen yetenek eklendi
            "Sağlık Yönlendirme": ["Temel Tıbbi Terminoloji", "Ambulans Yönetim Sistemi Kullanımı", "Temel Tıbbi Triyaj Bilgisi"],  # Konfigürasyon dosyasında istenen yetenek eklendi
            "İtfaiye Yönlendirme": ["Yangın Güvenliği Bilgisi", "Afet Yönetimi Temel Bilgileri"]
        },
        "max_secmeli_desk_specific": 2,  # 1'den 2'ye artırıldı - Masaya özel daha fazla yetenek
        "secmeli_genel": ["Çoklu Görev Yönetimi", "Detay Odaklılık"],
        "max_secmeli_genel": 2  # 1'den 2'ye artırıldı - Daha fazla genel yetenek
    },
    "Vardiya Amiri": {
        "zorunlu": ["Liderlik ve Motivasyon", "Operasyonel Planlama", "Raporlama Teknikleri", "Liderlik ve Koordinasyon"],  # Konfigürasyon dosyasında istenen yetenek eklendi
        "secmeli": ["Performans Değerlendirme", "Ekip Yönetimi Yazılımları", "Üst Düzey Kriz Yönetimi"],
        "max_secmeli": 3  # 2'den 3'e artırıldı - Daha fazla yetenek atanabilmesi için
    },
    "Teknik Destek": {
        "zorunlu": ["Sistem Arıza Tespiti", "Ağ Temelleri", "Yazılım Güncelleme"],
        "secmeli": ["Veritabanı Yönetimi (Temel)", "Siber Güvenlik Farkındalığı", "Çağrı Merkezi Donanımları"],
        "max_secmeli": 3  # 2'den 3'e artırıldı - Daha fazla yetenek atanabilmesi için
    }
}

# Vardiya Tanımları (Çağrı Merkezi - 7/24 - Masalara göre)
SHIFT_DEFINITIONS = [
    # Sabah Vardiyaları (08:00 - 15:00) - Hafta İçi (1 saat kısaltıldı)
    {"id_prefix": "Sabah_Hici", "name_template": "Sabah Hafta İçi {department_name_suffix}", "start": time(8, 0), "end": time(15, 0), "days": range(0, 5),
     "departments": ["Genel Çağrı", "Polis Yönlendirme", "Sağlık Yönlendirme", "İtfaiye Yönlendirme", "Teknik Operasyonlar", "Yönetim"]},

    # Öğleden Sonra Vardiyaları (16:00 - 23:00) - Hafta İçi (1 saat kısaltıldı)
    {"id_prefix": "Aksam_Hici", "name_template": "Akşam Hafta İçi {department_name_suffix}", "start": time(16, 0), "end": time(23, 0), "days": range(0, 5),
     "departments": ["Genel Çağrı", "Polis Yönlendirme", "Sağlık Yönlendirme", "İtfaiye Yönlendirme", "Teknik Operasyonlar", "Yönetim"]},

    # Gece Vardiyaları (00:00 - 08:00) - Haftanın Her Günü (Ertesi günün sabahına sarkar) - Şimdilik aynı
    {"id_prefix": "Gece", "name_template": "Gece {department_name_suffix}", "start": time(0, 0), "end": time(8, 0), "days": range(0, 7),
     "departments": ["Genel Çağrı", "Polis Yönlendirme", "Sağlık Yönlendirme", "İtfaiye Yönlendirme", "Teknik Operasyonlar", "Yönetim"]},

    # Hafta Sonu Gündüz (08:00 - 19:00) (1 saat kısaltıldı)
    {"id_prefix": "Gunduz_Hsonu", "name_template": "Gündüz Hafta Sonu {department_name_suffix}", "start": time(8, 0), "end": time(19, 0), "days": [5, 6],
     "departments": ["Genel Çağrı", "Polis Yönlendirme", "Sağlık Yönlendirme", "İtfaiye Yönlendirme", "Teknik Operasyonlar", "Yönetim"]},

    # Hafta Sonu Gece (20:00 - 08:00 ertesi gün) - Şimdilik aynı
    {"id_prefix": "Gece_Hsonu", "name_template": "Gece Hafta Sonu {department_name_suffix}", "start": time(20, 0), "end": time(8, 0), "days": [5, 6],
     "departments": ["Genel Çağrı", "Polis Yönlendirme", "Sağlık Yönlendirme", "İtfaiye Yönlendirme", "Teknik Operasyonlar", "Yönetim"]},
]

# Diğer Parametreler
AVG_DAYS_OFF_PER_PERIOD = 1 # Çağrı merkezi çalışanları için ortalama izin (2'den 1'e düşürüldü)
PREFERENCE_PROBABILITY = 0.3

# --- Logging Kurulumu ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Yardımcı Fonksiyonlar (generate_synthetic_data.py'den alındı, gerekirse düzenlenecek) ---
def add_skill_with_limit_check(employee_id, skill, skills_list, employees_df, role_skills_config, strategy="warn", is_config_requirement: bool = False):
    """
    Bir çalışana yetenek ekler, maksimum sınırları kontrol eder.

    Stratejiler:
    - "warn": Sınır aşılacaksa uyarı logla ve atama yapma
    - "force": Sınır aşılsa bile atama yap
    - "replace": Sınır aşılacaksa başka bir yeteneği sil ve atama yap
    - "smart_replace": Konfigürasyon dosyasında istenen yeteneklere öncelik vererek değiştirme yap
    - "aggressive_replace": Kritik yetenekler için daha agresif bir değiştirme stratejisi
    Args:
        is_config_requirement (bool): Eğer True ise, bu yetenek konfigürasyon dosyasındaki
                                      bir kural gereği atanıyor demektir ve daha öncelikli olmalıdır.
    """
    # Çalışanın rolünü ve departmanını bul
    employee_data = employees_df[employees_df['employee_id'] == employee_id]
    if employee_data.empty:
        logging.warning(f"Çalışan {employee_id} bulunamadı. Yetenek ataması yapılamıyor.")
        return False

    employee_role = employee_data['role'].iloc[0]
    employee_dept = employee_data['department'].iloc[0] if 'department' in employee_data.columns else None

    # Çalışanın mevcut yeteneklerini bul
    current_skills_for_employee = [s for s in skills_list if s['employee_id'] == employee_id]
    current_skill_names = [s['skill'] for s in current_skills_for_employee]

    # Eğer yetenek zaten varsa, tekrar eklemeye gerek yok
    if skill in current_skill_names:
        return True

    role_config = role_skills_config.get(employee_role, {})

    # Maksimum yetenek sayısı hesaplaması (geliştirilmiş)
    max_total_skills_base = len(role_config.get("zorunlu", []))
    max_total_skills_base += role_config.get("max_secmeli", 0)
    max_total_skills_base += role_config.get("max_secmeli_desk_specific", 0) # Yönlendirici için eklendi
    max_total_skills_base += role_config.get("max_secmeli_genel", 0) # Yönlendirici için eklendi

    # Rol tanımlı ama max belirtilmemişse varsayılan değer kullan
    if max_total_skills_base == 0 and employee_role in role_skills_config:
        max_total_skills_base = 5 # Varsayılan bir sınır

    max_total_skills = max_total_skills_base

    # Kritik yetenekler listesi ve öncelik sıralaması (öncelik değeri düşük = daha önemli)
    # Bu liste, genel "önemli olabilecek" yetenekleri belirtir.
    # is_config_requirement=True durumu, bundan daha yüksek bir önceliğe sahiptir.
    critical_skills_priority = {
        "Liderlik ve Koordinasyon": 1,
        "Polis Kriz Protokolleri": 2,
        "Temel Tıbbi Triyaj Bilgisi": 2,
        "İleri Düzey Stres Yönetimi": 3
    }
    general_critical_skills = list(critical_skills_priority.keys())


    # Eğer atanmak istenen yetenek bir konfigürasyon gereksinimiyse, sınırı daha da artır
    # veya mevcut stratejilerin daha agresif çalışmasını sağla.
    if is_config_requirement:
        max_total_skills = max_total_skills_base + 2 # Konfig gereksinimi için ekstra 2 slot
        logging.info(f"Konfigürasyon gereksinimi '{skill}' için maksimum yetenek sınırı {max_total_skills}'e çıkarıldı (Çalışan: {employee_id}).")
        # Stratejiyi de en agresife çekebiliriz, eğer zaten agresif değilse.
        if strategy not in ["aggressive_replace", "force"]:
            strategy = "aggressive_replace" # Konfig gereksinimleri için daha güçlü strateji
            logging.info(f"Konfigürasyon gereksinimi '{skill}' için strateji 'aggressive_replace' olarak ayarlandı.")
    elif skill in general_critical_skills: # Genel kritik yetenekler için de bir miktar esneklik
        max_total_skills = max(max_total_skills, max_total_skills_base + 1)


    # Yetenek sınırı aşılmıyorsa doğrudan ekle
    if len(current_skills_for_employee) < max_total_skills or max_total_skills == 0: # max_total_skills == 0 durumu (sınırsız gibi)
        skills_list.append({"employee_id": employee_id, "skill": skill})
        return True

    # Stratejiye göre işlem yap
    if strategy == "warn":
        logging.warning(f"Çalışan {employee_id} ({employee_role}) için maksimum yetenek sınırı ({max_total_skills}) aşılacağı için '{skill}' yeteneği atanmadı (strateji: warn).")
        return False

    elif strategy == "force":
        skills_list.append({"employee_id": employee_id, "skill": skill})
        logging.info(f"Çalışan {employee_id} ({employee_role}) için maksimum yetenek sınırı ({max_total_skills}) aşıldı ancak 'force' stratejisi ile '{skill}' atandı. Yeni toplam: {len(current_skill_names) + 1}")
        return True

    elif strategy in ["replace", "smart_replace", "aggressive_replace"]:
        mandatory_skills = set(role_config.get("zorunlu", []))
        desk_specific_mandatory_skills = set() # Yönlendirici için masaya özel zorunlu yetenekler
        if employee_role == "Yönlendirici" and employee_dept and "secmeli_desk_specific" in role_config:
            # Masaya özel yeteneklerin hepsi "çıkarılabilir" olmamalı, bazıları kritik olabilir.
            # Şimdilik bu ayrımı yapmıyoruz, ama gelecekte düşünülebilir.
            pass


        # Silinebilecek yetenekler: Zorunlu olmayanlar VE şu an atanmak istenen yetenek olmayanlar
        removable_skills = [s_obj for s_obj in current_skills_for_employee
                            if s_obj['skill'] not in mandatory_skills and s_obj['skill'] != skill]

        # is_config_requirement True ise, silinecek yetenekleri seçerken daha dikkatli olmalıyız.
        # Atanmak istenen 'skill', diğer 'general_critical_skills' veya 'konfigürasyondan gelen başka bir yetenek'ten daha öncelikli olabilir.
        # smart_replace ve aggressive_replace stratejileri zaten bir miktar önceliklendirme yapıyor.
        # is_config_requirement durumunda, silinecek yeteneklerin "konfigürasyonla çakışmamasına" özen gösterilmeli.
        # Ancak bu, hangi yeteneklerin konfigürasyonla geldiğini bilmeyi gerektirir, bu da bu fonksiyonun kapsamını aşar.
        # Şimdilik mevcut replace mantığına güveniyoruz, is_config_requirement için artırılmış max_total_skills bir miktar yardımcı olacaktır.

        skill_to_be_added_priority = critical_skills_priority.get(skill, 999)

        if strategy == "smart_replace" or strategy == "aggressive_replace":
            # Öncelik: Konfigürasyon gereksinimi olmayan ve genel kritik olmayanları sil.
            non_truly_critical_removable = [s for s in removable_skills if s['skill'] not in general_critical_skills]

            if is_config_requirement: # Eğer eklenen config gereksinimiyse, her şeyi silmeye çalışabiliriz (zorunlular hariç)
                 pass # removable_skills zaten zorunluları dışlıyor
            elif non_truly_critical_removable: # Eğer eklenen config değil ama genel kritik ise ve silinecek non-truly-critical varsa
                removable_skills = non_truly_critical_removable


            # Agresif strateji ve eklenen yetenek (genel) kritik ise, daha düşük öncelikli (genel) kritik yetenekleri silmeye çalış.
            # Eğer is_config_requirement True ise, bu zaten en yüksek öncelik olmalı.
            if strategy == "aggressive_replace" and (skill in general_critical_skills or is_config_requirement):
                lower_priority_general_critical = [
                    s for s in removable_skills
                    if s['skill'] in general_critical_skills and
                       critical_skills_priority.get(s['skill'], 0) > skill_to_be_added_priority
                ]
                # Eğer atanmak istenen yetenek bir config gereksinimi değilse VE
                # silinebilecek daha düşük öncelikli genel kritik yetenekler varsa, onları hedefle.
                # Eğer atanmak istenen yetenek bir config gereksinimi ise,
                # o zaman genel kritik yetenekler de dahil her şey (zorunlu hariç) silinebilir.
                if not is_config_requirement and lower_priority_general_critical:
                    removable_skills = lower_priority_general_critical
                elif is_config_requirement and removable_skills: # Herhangi bir (zorunlu olmayan) yeteneği sil
                    pass


        if not removable_skills:
            # Eğer is_config_requirement True ise ve hala yer yoksa, bu durum çözümsüzlüğe işaret edebilir.
            # Artırılmış max_total_skills'e rağmen.
            log_message = f"Çalışan {employee_id} ({employee_role}) için maks. yetenek sınırı ({max_total_skills}) aşılacak ve silinebilecek uygun yetenek yok. Eklenmek istenen: '{skill}' (Konfig Gereksinimi: {is_config_requirement})."
            if is_config_requirement:
                logging.error(log_message + " Bu durum optimizasyonda INFEASIBLE sonuca yol açabilir.")
            else:
                logging.warning(log_message)
            return False

        # Silinecek yeteneği seç (en az öncelikli olanı seçmek daha iyi olabilir ama şimdilik rastgele)
        # TODO: Silinecek yeteneği, önceliği en düşük olandan başlayarak seçmek (eğer is_config_requirement ise daha da önemli)
        skill_to_remove_obj = random.choice(removable_skills)
        skill_to_remove_name = skill_to_remove_obj['skill']


        # Yeteneği sil
        # skills_list'ten doğru objeyi bulup silmek önemli
        original_skills_list_count = len(skills_list)
        temp_skills_list = [s for s in skills_list if not (s['employee_id'] == employee_id and s['skill'] == skill_to_remove_name)]

        if len(temp_skills_list) < original_skills_list_count :
             skills_list.clear()
             skills_list.extend(temp_skills_list)
             logging.info(f"Çalışan {employee_id} ({employee_role}) için maks. yetenek sınırını ({max_total_skills}) korumak amacıyla '{skill_to_remove_name}' yeteneği silindi. Yeni eklenen: '{skill}'. (Konfig Gereksinimi: {is_config_requirement})")
             skills_list.append({"employee_id": employee_id, "skill": skill})
             return True
        else:
             logging.error(f"Kritik Hata: Çalışan {employee_id}'nin '{skill_to_remove_name}' yeteneği silinemedi! Liste güncellenmedi.")
             return False


    logging.error(f"Geçersiz strateji: {strategy} veya yetenek atamada beklenmedik durum (Çalışan: {employee_id}, Yetenek: {skill}).")
    return False

def generate_employees(num_employees, roles_distribution, departments_distribution):
    """Çalışan listesini, rollerini ve departmanlarını oluşturur (Çağrı Merkezi'ne göre)."""
    employees = []
    roles_list = list(roles_distribution.keys())
    role_probabilities = list(roles_distribution.values())

    dept_list = list(departments_distribution.keys())
    dept_probabilities = list(departments_distribution.values())

    # Her departman/masa için en az bir ilgili rol atamaya çalışalım (basitleştirilmiş)
    # Örneğin, her yönlendirme masasına en az bir yönlendirici.
    # Bu kısım daha karmaşık senaryolar için detaylandırılabilir.

    for i in range(1, num_employees + 1):
        emp_id = f"CM_E{str(i).zfill(3)}" # CM: Çağrı Merkezi
        role = random.choices(roles_list, role_probabilities, k=1)[0]

        department = ""
        if role == "Çağrı Alıcı":
            department = "Genel Çağrı"
        elif role == "Yönlendirici":
            # Yönlendiricileri belirli masalara ata
            possible_desks = ["Polis Yönlendirme", "Sağlık Yönlendirme", "İtfaiye Yönlendirme"]
            department = random.choice(possible_desks)
        elif role == "Vardiya Amiri":
            department = "Yönetim"
        elif role == "Teknik Destek":
            department = "Teknik Operasyonlar"
        else: # Diğer roller için genel bir atama
            department = random.choices(dept_list, dept_probabilities, k=1)[0]

        employees.append({
            "employee_id": emp_id,
            "name": f"{role} {i}", # Basit isimlendirme
            "role": role,
            "department": department
        })
    return employees

def generate_skills_structured(employees_df, role_skills_definition, app_config=None):
    """Çalışanlara rollerine ve departmanlarına göre yapılandırılmış yetenekler atar (Çağrı Merkezi)."""
    skills_list = []

    # Konfigürasyondan gelen zorunlu skill_requirements'ları belirle (hızlı erişim için set)
    config_skill_rules = []
    if app_config and 'rules' in app_config and 'skill_requirements' in app_config['rules']:
        config_skill_rules = app_config['rules']['skill_requirements']

    # Kritik yetenekler listesi (genel ve konfigürasyondan gelenler)
    # Genel kritik yetenekler (veri üretici kendi içinde tanımlar)
    general_critical_skills = [
        "Liderlik ve Koordinasyon",
        "Polis Kriz Protokolleri",
        "İleri Düzey Stres Yönetimi",
        "Temel Tıbbi Triyaj Bilgisi"
    ]

    # Konfigürasyon dosyasından gelen ve kritik olarak işaretlenmesi gereken yetenekler
    # (Bu, veri üreticinin kendi kritik yetenek tanımını genişletir)
    config_defined_critical_skills = {rule['skill'] for rule in config_skill_rules if rule.get('penalty_if_violated', 0) > 150} # Yüksek ceza = kritik

    # Kritik yeteneklerin atanma oranları (rol ve departman bazlı)
    # Bu, veri üreticinin kendi atama mantığıdır, konfigürasyon kuralları daha sonra ayrıca zorlanır.
    critical_skill_assignment_rates = {
        "Liderlik ve Koordinasyon": {"role": "Vardiya Amiri", "department": "Yönetim", "rate": 1.0},
        "Polis Kriz Protokolleri": {"role": "Yönlendirici", "department": "Polis Yönlendirme", "rate": 0.9},
        "İleri Düzey Stres Yönetimi": {"role": "Çağrı Alıcı", "department": "Genel Çağrı", "rate": 0.8},
        "Temel Tıbbi Triyaj Bilgisi": {"role": "Yönlendirici", "department": "Sağlık Yönlendirme", "rate": 0.9}
    }

    # 1. Önce normal yetenek atama işlemini yap
    for _, emp in employees_df.iterrows():
        employee_id = emp["employee_id"]
        employee_role = emp["role"]
        employee_dept = emp["department"]

        if employee_role in role_skills_definition:
            role_info = role_skills_definition[employee_role]

            # 1.1. Zorunlu yetenekleri ata (ROLE_SKILLS'den gelenler)
            for skill in role_info.get("zorunlu", []):
                # Bu yetenek aynı zamanda config'de de zorunluysa, is_config_requirement=True olabilir.
                # Ancak burada ROLE_SKILLS zorunluluğunu uyguluyoruz.
                is_conf_req = any(cr['skill'] == skill and cr.get('role') == employee_role and cr.get('department') == employee_dept for cr in config_skill_rules)
                add_skill_with_limit_check(employee_id, skill, skills_list, employees_df, role_skills_definition, strategy="force", is_config_requirement=is_conf_req)

            # 1.2. Yönlendirici için Masaya Özel Seçmeli Yetenekler
            if employee_role == "Yönlendirici" and "secmeli_desk_specific" in role_info:
                desk_skills_options = role_info["secmeli_desk_specific"].get(employee_dept, [])
                if desk_skills_options:
                    max_assign = role_info.get("max_secmeli_desk_specific", len(desk_skills_options))
                    num_to_assign = random.randint(0, min(max_assign, len(desk_skills_options)))
                    if num_to_assign > 0:
                        assigned_desk_skills = random.sample(desk_skills_options, min(num_to_assign, len(desk_skills_options)))
                        for skill in assigned_desk_skills:
                            is_conf_req = any(cr['skill'] == skill and cr.get('role') == employee_role and cr.get('department') == employee_dept for cr in config_skill_rules)
                            add_skill_with_limit_check(employee_id, skill, skills_list, employees_df, role_skills_definition, strategy="replace", is_config_requirement=is_conf_req)

            # 1.3. Yönlendirici için Genel Seçmeli Yetenekler
            if employee_role == "Yönlendirici" and "secmeli_genel" in role_info:
                general_skills_options = role_info.get("secmeli_genel", [])
                if general_skills_options:
                    max_assign = role_info.get("max_secmeli_genel", len(general_skills_options))
                    num_to_assign = random.randint(0, min(max_assign, len(general_skills_options)))
                    if num_to_assign > 0:
                        assigned_general_skills = random.sample(general_skills_options, min(num_to_assign, len(general_skills_options)))
                        for skill in assigned_general_skills:
                             is_conf_req = any(cr['skill'] == skill and cr.get('role') == employee_role and cr.get('department') == employee_dept for cr in config_skill_rules)
                             add_skill_with_limit_check(employee_id, skill, skills_list, employees_df, role_skills_definition, strategy="replace", is_config_requirement=is_conf_req)

            # 1.4. Diğer Roller İçin Genel Seçmeli Yetenekler
            elif employee_role != "Yönlendirici" and "secmeli" in role_info:
                secmeli_skills = role_info.get("secmeli", [])
                if secmeli_skills:
                    max_secmeli_count = role_info.get("max_secmeli", len(secmeli_skills))
                    num_secmeli_to_assign = random.randint(0, max_secmeli_count)
                    if num_secmeli_to_assign > 0:
                        assigned_secmeli = random.sample(secmeli_skills, min(num_secmeli_to_assign, len(secmeli_skills)))
                        for skill in assigned_secmeli:
                            is_conf_req = any(cr['skill'] == skill and cr.get('role') == employee_role and cr.get('department') == employee_dept for cr in config_skill_rules)
                            add_skill_with_limit_check(employee_id, skill, skills_list, employees_df, role_skills_definition, strategy="replace", is_config_requirement=is_conf_req)

    # 2. "critical_skill_assignment_rates" ile tanımlı kritik yetenekleri belirli oranlarda ata
    # Bu atamalar, konfigürasyonun zorunlu kıldığı yeteneklerse daha da önemli hale gelir.
    logging.info("Veri üretici tanımlı kritik yetenekler için deterministik atama yapılıyor...")
    for critical_skill_name, assignment_config in critical_skill_assignment_rates.items():
        target_role = assignment_config["role"]
        target_dept = assignment_config["department"]
        assignment_rate = assignment_config["rate"]

        eligible_employees = employees_df[
            (employees_df['role'] == target_role) &
            (employees_df['department'] == target_dept)
        ]

        if eligible_employees.empty:
            # logging.warning(f"Kritik yetenek (üretici tanımlı) '{critical_skill_name}' için uygun çalışan bulunamadı (Rol: {target_role}, Departman: {target_dept}).")
            continue

        num_employees_eligible = len(eligible_employees)
        num_to_assign_this_skill = max(1, int(num_employees_eligible * assignment_rate))

        employees_without_this_skill = []
        for _, emp in eligible_employees.iterrows():
            emp_id = emp['employee_id']
            has_skill = any(s['employee_id'] == emp_id and s['skill'] == critical_skill_name for s in skills_list)
            if not has_skill:
                employees_without_this_skill.append(emp_id)

        assignments_done_count = 0
        if employees_without_this_skill:
            # Bu yetenek konfigürasyonda da zorunlu mu?
            is_conf_req_for_this_critical = any(cr['skill'] == critical_skill_name and cr.get('role') == target_role and cr.get('department') == target_dept for cr in config_skill_rules)

            actual_num_to_assign = min(num_to_assign_this_skill, len(employees_without_this_skill))

            for i in range(actual_num_to_assign):
                emp_id_to_assign = employees_without_this_skill[i]
                # Bu bir konfigürasyon gereksinimi olduğu için is_config_requirement=True
                if add_skill_with_limit_check(emp_id_to_assign, critical_skill_name, skills_list, employees_df, role_skills_definition, strategy="aggressive_replace", is_config_requirement=True):
                    assignments_done_count += 1

            if assignments_done_count > 0:
                 logging.info(f"Kritik yetenek (üretici tanımlı) '{critical_skill_name}' için {assignments_done_count} çalışana atama yapıldı.")
            if assignments_done_count < num_to_assign_this_skill:
                 logging.warning(f"Kritik yetenek (üretici tanımlı) '{critical_skill_name}' için {num_to_assign_this_skill - assignments_done_count} adet eksik kaldı. Hedef: {num_to_assign_this_skill}, Yapılan: {assignments_done_count}. Optimizasyon INFEASIBLE olabilir.")

    return skills_list

def generate_shifts(start_date, num_days, shift_definitions):
    """Belirtilen tarih aralığı ve tanımlara göre vardiyaları oluşturur (Çağrı Merkezi)."""
    shifts = []
    all_dates = [start_date + timedelta(days=i) for i in range(num_days)]
    shift_counter = 1

    for shift_def_template in shift_definitions:
        for d in all_dates:
            if d.weekday() in shift_def_template["days"]:
                for dept in shift_def_template.get("departments", [None]): # Her departman/masa için
                    shift_id = f"CM_S{str(shift_counter).zfill(4)}"

                    # Vardiya adını departman/masa ismiyle formatla
                    shift_name = shift_def_template["name_template"].format(department_name_suffix=dept)

                    shifts.append({
                        "shift_id": shift_id,
                        "name": shift_name,
                        "date": d.isoformat(),
                        "start_time": shift_def_template["start"].isoformat(),
                        "end_time": shift_def_template["end"].isoformat(),
                        "department": dept # Vardiyanın hangi masa/departman için olduğu
                    })
                    shift_counter += 1
    return pd.DataFrame(shifts)

def generate_availability(employees_df, start_date, num_days, avg_days_off):
    """
    Çalışanların uygunluk durumlarını oluşturur.
    Güncellenmiş versiyon: Daha dengeli bir uygunluk dağılımı sağlar ve kritik rollerin her zaman yeterli sayıda mevcut olmasını garantiler.
    """
    availability = []
    all_dates = [start_date + timedelta(days=i) for i in range(num_days)]

    critical_roles_depts = [
        {"role": "Vardiya Amiri", "department": "Yönetim"},
        {"role": "Yönlendirici", "department": "Polis Yönlendirme"},
        {"role": "Yönlendirici", "department": "Sağlık Yönlendirme"},
        {"role": "Çağrı Alıcı", "department": "Genel Çağrı"}
    ]

    daily_off_counts = {d.isoformat(): 0 for d in all_dates}
    max_daily_off_percentage = 0.25

    non_critical_employees = []
    critical_employees = []

    for _, emp in employees_df.iterrows():
        is_critical = False
        for critical in critical_roles_depts:
            if emp["role"] == critical["role"] and emp["department"] == critical["department"]:
                is_critical = True
                critical_employees.append(emp)
                break
        if not is_critical:
            non_critical_employees.append(emp)

    for emp_series in non_critical_employees:
        emp = emp_series.to_dict() # DataFrame satırını dict'e çevir
        num_off_days = max(0, round(random.gauss(avg_days_off, avg_days_off / 3)))
        off_dates = []
        potential_off_dates = random.sample(all_dates, min(num_days, num_off_days * 2))
        for d in sorted(potential_off_dates):
            d_str = d.isoformat()
            if len(off_dates) >= num_off_days: break
            if daily_off_counts[d_str] < max_daily_off_percentage * len(employees_df):
                off_dates.append(d)
                daily_off_counts[d_str] += 1
        for d in all_dates:
            is_available = 0 if d in off_dates else 1
            availability.append({
                "employee_id": emp["employee_id"],
                "date": d.isoformat(),
                "is_available": is_available
            })

    for critical_type in critical_roles_depts:
        critical_role = critical_type["role"]
        critical_dept = critical_type["department"]
        role_dept_employees = [e_series.to_dict() for e_series in critical_employees # DataFrame satırlarını dict'e çevir
                              if e_series["role"] == critical_role and e_series["department"] == critical_dept]
        if not role_dept_employees: continue
        max_off_per_day = max(0, int(len(role_dept_employees) * 0.4))
        daily_role_dept_off = {d.isoformat(): 0 for d in all_dates}
        for emp in role_dept_employees:
            num_off_days = max(0, round(random.gauss(avg_days_off, avg_days_off / 4)))
            off_dates = []
            potential_off_dates = random.sample(all_dates, min(num_days, num_off_days * 2))
            for d in sorted(potential_off_dates):
                d_str = d.isoformat()
                if len(off_dates) >= num_off_days: break
                if (daily_off_counts[d_str] < max_daily_off_percentage * len(employees_df) and
                    daily_role_dept_off[d_str] < max_off_per_day):
                    off_dates.append(d)
                    daily_off_counts[d_str] += 1
                    daily_role_dept_off[d_str] += 1
            for d in all_dates:
                is_available = 0 if d in off_dates else 1
                availability.append({
                    "employee_id": emp["employee_id"],
                    "date": d.isoformat(),
                    "is_available": is_available
                })

    logging.info(f"Uygunluk durumları oluşturuldu. Ortalama izin günü: {avg_days_off}, Maksimum günlük izin oranı: %{max_daily_off_percentage*100}")
    return pd.DataFrame(availability)

def generate_preferences(employees_df, shifts_df, preference_probability):
    preferences = []
    if shifts_df.empty: return pd.DataFrame(preferences)
    shift_ids = shifts_df['shift_id'].tolist()

    for _, emp_row in employees_df.iterrows(): # emp_row olarak değiştirdim, emp zaten bir modül
        emp = emp_row.to_dict() # DataFrame satırını dict'e çevir
        if random.random() < preference_probability:
            num_prefs = random.randint(1, 3)
            if not shift_ids: continue
            pref_shifts = random.sample(shift_ids, min(num_prefs, len(shift_ids)))
            for shift_id in pref_shifts:
                score = random.choice([-1, 1])
                preferences.append({
                    "employee_id": emp["employee_id"],
                    "shift_id": shift_id,
                    "preference_score": score
                })
    return pd.DataFrame(preferences)


# --- Veri İyileştirme Fonksiyonları (generate_synthetic_data.py'den alındı, çağrı merkezine uyarlandı) ---
def ensure_min_staffing_requirements(employees_df, shifts_df, skills_list, min_staffing_rules_from_config, role_skills_config, app_config):
    """
    Minimum personel gereksinimlerini kontrol eder ve gerekirse yeni çalışanlar ekler.
    İyileştirilmiş versiyon: Yeni eklenen çalışanlara konfigürasyondan gelen zorunlu yetenekleri agresifçe atar.
    """
    logging.info("Minimum personel gereksinimleri kontrol ediliyor ve iyileştiriliyor (Çağrı Merkezi)...")
    newly_added_employees_info = [] # eklenecek yeni çalışanların listesi
    # skills_list'i doğrudan değiştireceğimiz için kopyasını alalım ya da dikkatli olalım.

    # Konfigürasyondan gelen tüm skill_requirements kurallarını alalım (kolay erişim için)
    config_skill_rules = app_config.get('rules', {}).get('skill_requirements', [])

    for req_rule in min_staffing_rules_from_config:
        role_req = req_rule.get('role')
        dept_req = req_rule.get('department')
        min_count_req = req_rule.get('min_count', 1)

        if not role_req or not dept_req or min_count_req <= 0:
            logging.warning(f"Eksik veya geçersiz min_staffing kuralı: {req_rule}. Atlanıyor.")
            continue

        current_employees_in_dept_role = employees_df[
            (employees_df['department'] == dept_req) & (employees_df['role'] == role_req)
        ]
        current_count = len(current_employees_in_dept_role)

        if current_count < min_count_req:
            num_to_add = min_count_req - current_count
            logging.info(f"Departman '{dept_req}', rol '{role_req}' için {num_to_add} yeni çalışan eklenecek (min_staffing). Min: {min_count_req}, Mevcut: {current_count}")

            for i in range(num_to_add):
                new_emp_id = f"CM_E_cfg_minstaff_{len(employees_df) + len(newly_added_employees_info) + 1:03d}"
                new_employee_data = {
                    "employee_id": new_emp_id,
                    "name": f"CfgMinStaff_{new_emp_id}_{role_req[:3]}_{dept_req[:3]}",
                    "role": role_req,
                    "department": dept_req
                }
                newly_added_employees_info.append(new_employee_data)

                # Bu yeni çalışana ROLE_SKILLS içindeki zorunlu yetenekleri ata
                role_definition = role_skills_config.get(role_req, {})
                temp_new_employee_df = pd.DataFrame([new_employee_data]) # add_skill için geçici df

                for skill_to_assign in role_definition.get("zorunlu", []):
                    add_skill_with_limit_check(new_emp_id, skill_to_assign, skills_list, temp_new_employee_df, role_skills_config, strategy="force", is_config_requirement=False) # Bunlar ROLE_SKILLS zorunlusu

                # Şimdi bu rol/departman için config_skill_rules'dan gelen ZORUNLU yetenekleri ata
                # Bu yetenekler is_config_requirement=True ile atanmalı
                for skill_rule in config_skill_rules:
                    if skill_rule.get('role') == role_req and skill_rule.get('department') == dept_req:
                        skill_name_from_config = skill_rule.get('skill')
                        if skill_name_from_config:
                            logging.info(f"Yeni eklenen çalışan {new_emp_id} için konfigürasyon gereksinimi '{skill_name_from_config}' (rol: {role_req}, dep: {dept_req}) atanıyor.")
                            add_skill_with_limit_check(new_emp_id, skill_name_from_config, skills_list, temp_new_employee_df, role_skills_config, strategy="aggressive_replace", is_config_requirement=True)

    if newly_added_employees_info:
        new_employees_df_from_list = pd.DataFrame(newly_added_employees_info)
        employees_df = pd.concat([employees_df, new_employees_df_from_list], ignore_index=True)
        logging.info(f"{len(newly_added_employees_info)} yeni çalışan DataFrame'e eklendi (min_staffing gereksinimleri için). Toplam çalışan: {len(employees_df)}")
        # Yeni eklenen çalışanların yeteneklerini loglayabiliriz (debug için)
        # for new_emp_info in newly_added_employees_info:
        #     emp_skills = [s['skill'] for s in skills_list if s['employee_id'] == new_emp_info['employee_id']]
        #     logging.info(f"Yeni eklenen {new_emp_info['employee_id']} yetenekleri: {emp_skills}")

    return employees_df, skills_list # skills_list de güncellenmiş olabilir

def ensure_minimum_skills(employees_df, skills_list, skill_rules_from_config, role_skills_config):
    logging.info("Minimum yetenek gereksinimleri (config'den) kontrol ediliyor ve iyileştiriliyor (Çağrı Merkezi)...")
    for req_rule in skill_rules_from_config: # skill_rules_from_config artık doğrudan config'den gelen liste
        skill_req = req_rule.get('skill')
        dept_req = req_rule.get('department')
        role_req = req_rule.get('role')
        min_count_req = req_rule.get('min_count', 1)

        if not skill_req or min_count_req <= 0:
            logging.warning(f"Eksik veya geçersiz skill_requirement kuralı: {req_rule}. Atlanıyor.")
            continue

        eligible_employees = employees_df.copy() # Filtreleme için kopya alalım
        log_filter_parts = []
        if dept_req:
            eligible_employees = eligible_employees[eligible_employees['department'] == dept_req]
            log_filter_parts.append(f"Departman: {dept_req}")
        if role_req:
            eligible_employees = eligible_employees[eligible_employees['role'] == role_req]
            log_filter_parts.append(f"Rol: {role_req}")
        filter_log_str = ", ".join(log_filter_parts) if log_filter_parts else "Tüm Çalışanlar"

        if eligible_employees.empty:
            logging.warning(f"'{skill_req}' yeteneği için uygun çalışan bulunamadı ({filter_log_str}). Gereksinim karşılanamıyor.")
            continue

        current_skilled_count = 0
        for _, emp_row in eligible_employees.iterrows():
            if any(s['employee_id'] == emp_row['employee_id'] and s['skill'] == skill_req for s in skills_list):
                current_skilled_count += 1

        if current_skilled_count < min_count_req:
            num_to_assign = min_count_req - current_skilled_count
            logging.info(f"'{skill_req}' yeteneği için {num_to_assign} yeni atama gerekiyor ({filter_log_str}). Min: {min_count_req}, Mevcut: {current_skilled_count}")

            potential_assignees_ids = [
                emp_row['employee_id'] for _, emp_row in eligible_employees.iterrows()
                if not any(s['employee_id'] == emp_row['employee_id'] and s['skill'] == skill_req for s in skills_list)
            ]

            if not potential_assignees_ids:
                logging.warning(f"'{skill_req}' yeteneğini alabilecek yeni aday çalışan yok ({filter_log_str}). Gereksinim karşılanamıyor.")
                continue

            # Konfigürasyon gereksinimi olduğu için strategy='aggressive_replace' ve is_config_requirement=True kullanalım
            assignments_done_count = 0
            # Atama yapılacak çalışanları karıştırarak daha dengeli bir dağılım sağlamaya çalışabiliriz
            random.shuffle(potential_assignees_ids)

            for i in range(min(num_to_assign, len(potential_assignees_ids))):
                emp_id_to_assign = potential_assignees_ids[i]
                # Bu bir konfigürasyon gereksinimi olduğu için is_config_requirement=True
                if add_skill_with_limit_check(emp_id_to_assign, skill_req, skills_list, employees_df, role_skills_config, strategy="aggressive_replace", is_config_requirement=True):
                    assignments_done_count += 1

            if assignments_done_count > 0:
                 logging.info(f"Kritik yetenek (üretici tanımlı) '{skill_req}' için {assignments_done_count} çalışana atama yapıldı.")
            if assignments_done_count < num_to_assign:
                 logging.warning(f"Kritik yetenek (üretici tanımlı) '{skill_req}' için {num_to_assign - assignments_done_count} adet eksik kaldı. Hedef: {num_to_assign}, Yapılan: {assignments_done_count}. Optimizasyon INFEASIBLE olabilir.")

    return skills_list

def distribute_skills_by_shifts(employees_df, shifts_df, skills_list, skill_rules_from_config, role_skills_config):
    logging.info("Vardiya bazlı yetenek gereksinimleri (config'den) dağıtılıyor (Çağrı Merkezi)...")
    if shifts_df.empty:
        logging.warning("Vardiya bilgisi yok, vardiya bazlı yetenek dağıtımı atlanıyor.")
        return skills_list

    for req_rule in skill_rules_from_config:
        pattern = req_rule.get('shift_pattern')
        skill_needed = req_rule.get('skill')
        dept_filter_for_rule = req_rule.get('department')
        role_filter_for_rule = req_rule.get('role')
        min_needed_on_shift = req_rule.get('min_count', 1)

        if not pattern or not skill_needed or min_needed_on_shift <=0:
            logging.warning(f"Eksik veya geçersiz skill_requirement (vardiya bazlı): {req_rule}. Atlanıyor.")
            continue

        matching_shifts_indices = []
        for index, shift_row in shifts_df.iterrows():
            # Vardiya adı ve departmanına göre eşleştirme
            name_match = fnmatch.fnmatch(shift_row['name'], pattern)
            department_of_shift = shift_row['department']

            # Kural departman filtresi varsa, vardiyanın departmanı da eşleşmeli
            dept_match_for_shift = True
            if dept_filter_for_rule:
                dept_match_for_shift = (department_of_shift == dept_filter_for_rule)

            if name_match and dept_match_for_shift:
                matching_shifts_indices.append(index)

        if not matching_shifts_indices:
            # logging.warning(f"'{pattern}' (Dep: {dept_filter_for_rule or 'Yok'}) desenine uyan vardiya bulunamadı. Yetenek '{skill_needed}' için bu kural atlanıyor.")
            continue

        # logging.info(f"'{pattern}' (Dep: {dept_filter_for_rule or 'Yok'}) desenine uyan {len(matching_shifts_indices)} vardiya bulundu. Yetenek: {skill_needed}, Min. Gerekli: {min_needed_on_shift}")

        for shift_idx in matching_shifts_indices:
            current_shift = shifts_df.loc[shift_idx]
            shift_department = current_shift['department'] # Vardiyanın departmanı önemli

            # Bu vardiyaya atanabilecek çalışanları filtrele
            # 1. Vardiyanın departmanıyla eşleşenler
            eligible_employees_for_shift = employees_df[employees_df['department'] == shift_department].copy()
            # 2. Kuralda rol filtresi varsa, onu da uygula
            if role_filter_for_rule:
                eligible_employees_for_shift = eligible_employees_for_shift[eligible_employees_for_shift['role'] == role_filter_for_rule]

            if eligible_employees_for_shift.empty:
                # logging.warning(f"Vardiya '{current_shift['name']}' (Dep: {shift_department}) için kurala uygun (Rol: {role_filter_for_rule or 'Tüm Roller'}) çalışan yok. Yetenek '{skill_needed}' atanamıyor.")
                continue

            count_skilled_for_shift = 0
            potential_assignees_for_skill_ids = []
            for _, emp_row in eligible_employees_for_shift.iterrows():
                emp_id = emp_row['employee_id']
                has_skill = any(s['employee_id'] == emp_id and s['skill'] == skill_needed for s in skills_list)
                if has_skill:
                    count_skilled_for_shift += 1
                else:
                    potential_assignees_for_skill_ids.append(emp_id)

            if count_skilled_for_shift < min_needed_on_shift:
                num_to_acquire_skill = min_needed_on_shift - count_skilled_for_shift
                logging.info(f"Vardiya '{current_shift['name']}' (Dep: {shift_department}) için {num_to_acquire_skill} adet konfigürasyon gereği '{skill_needed}' yeteneği gerekiyor (Rol: {role_filter_for_rule or '-'}). Min: {min_needed_on_shift}, Mevcut: {count_skilled_for_shift}")

                if not potential_assignees_for_skill_ids:
                    logging.warning(f"Vardiya '{current_shift['name']}' için '{skill_needed}' yeteneğini alabilecek aday yok. Gereksinim karşılanamıyor. Optimizasyon INFEASIBLE olabilir.")
                    continue

                assignments_done_count = 0
                random.shuffle(potential_assignees_for_skill_ids)
                for i in range(min(num_to_acquire_skill, len(potential_assignees_for_skill_ids))):
                    emp_to_get_skill = potential_assignees_for_skill_ids[i]
                    # Bu bir konfigürasyon gereksinimi olduğu için is_config_requirement=True
                    if add_skill_with_limit_check(emp_to_get_skill, skill_needed, skills_list, employees_df, role_skills_config, strategy="aggressive_replace", is_config_requirement=True):
                        assignments_done_count += 1

                if assignments_done_count > 0:
                    logging.info(f"Vardiya '{current_shift['name']}' için {assignments_done_count} çalışana konfigürasyon gereği '{skill_needed}' yeteneği eklendi.")
                if assignments_done_count < num_to_acquire_skill:
                    logging.warning(f"Vardiya '{current_shift['name']}' için '{skill_needed}' yeteneği {num_to_acquire_skill - assignments_done_count} adet eksik kaldı. Hedef: {num_to_acquire_skill}, Yapılan: {assignments_done_count}. Optimizasyon INFEASIBLE olabilir.")
    return skills_list


def enhance_data_based_on_config(employees_df, shifts_df, skills_list, config_file_path, role_skills_config_param):
    logging.info(f"Konfigürasyon dosyası ({config_file_path}) bazlı veri iyileştirmesi başlıyor (Çağrı Merkezi)...")
    app_config = None
    try:
        with open(config_file_path, 'r', encoding='utf-8') as file:
            app_config = yaml.safe_load(file)
        if not app_config:
            logging.error(f"Konfigürasyon dosyası boş veya yüklenemedi: {config_file_path}. İyileştirme atlanıyor.")
            return employees_df, skills_list
    except FileNotFoundError:
        logging.error(f"Konfigürasyon dosyası bulunamadı: {config_file_path}. İyileştirme atlanıyor.")
        return employees_df, skills_list
    except Exception as e:
        logging.error(f"Konfigürasyon dosyası okunurken hata: {e}. İyileştirme atlanıyor.")
        return employees_df, skills_list

    min_staff_rules = app_config.get('rules', {}).get('min_staffing_requirements', [])
    skill_rules = app_config.get('rules', {}).get('skill_requirements', [])

    # 1. Minimum personel sayısını (rol/departman bazlı) sağla ve bu sırada eksikse yeni çalışanlara config'den gelen yetenekleri ata
    employees_df, skills_list = ensure_min_staffing_requirements(employees_df, shifts_df, skills_list, min_staff_rules, role_skills_config_param, app_config)

    # 2. Genel yetenek gereksinimlerini (config'den gelen) sağla
    # Bu aşamada çalışan sayısı sabit, sadece mevcut çalışanlara yetenek atanıyor.
    skills_list = ensure_minimum_skills(employees_df, skills_list, skill_rules, role_skills_config_param)

    # 3. Vardiya bazlı yetenek gereksinimlerini (config'den gelen) dağıt
    skills_list = distribute_skills_by_shifts(employees_df, shifts_df, skills_list, skill_rules, role_skills_config_param)

    logging.info("Veri iyileştirme tamamlandı (Çağrı Merkezi).")
    return employees_df, skills_list

# --- Ana Veri Üretim Fonksiyonu ---
def generate_data():
    """Ana yapay veri üretme fonksiyonu (Çağrı Merkezi)."""
    logging.info("Çağrı Merkezi için yapay veri üretimi başlıyor...")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Konfigürasyon dosyasını bir kere yükleyelim (generate_skills_structured için)
    app_config_for_generator = None
    try:
        with open(CONFIG_FILE_PATH, 'r', encoding='utf-8') as file:
            app_config_for_generator = yaml.safe_load(file)
    except Exception as e:
        logging.warning(f"Ana veri üretiminde konfigürasyon dosyası ({CONFIG_FILE_PATH}) yüklenirken hata: {e}. Bazı özellikler kısıtlı olabilir.")

    # 1. Çalışanları Oluştur
    employees_list_raw = generate_employees(NUM_EMPLOYEES, ROLES, DEPARTMENTS)
    employees_df = pd.DataFrame(employees_list_raw)

    # 2. Vardiyaları Oluştur
    shifts_df = generate_shifts(START_DATE, NUM_DAYS, SHIFT_DEFINITIONS)

    # 3. Temel Yetenekleri Oluştur (artık app_config alıyor)
    skills_list_raw = generate_skills_structured(employees_df, ROLE_SKILLS, app_config_for_generator)

    # 4. Konfigürasyon bazlı veri iyileştirmesi
    # enhance_data_based_on_config kendi içinde config'i tekrar yüklüyor, bu iyi.
    employees_df, skills_list_enhanced = enhance_data_based_on_config(employees_df, shifts_df, skills_list_raw, CONFIG_FILE_PATH, ROLE_SKILLS)

    # 5. Uygunluk Durumunu Oluştur
    availability_df = generate_availability(employees_df, START_DATE, NUM_DAYS, AVG_DAYS_OFF_PER_PERIOD)

    # 6. Tercihleri Oluştur
    preferences_df = generate_preferences(employees_df, shifts_df, PREFERENCE_PROBABILITY)

    # Veri dosyalarını kaydet
    employees_df.to_csv(os.path.join(OUTPUT_DIR, "employees_cm.csv"), index=False, encoding='utf-8')
    logging.info(f"- {len(employees_df)} çalışan oluşturuldu: employees_cm.csv")

    skills_df_final = pd.DataFrame(skills_list_enhanced)
    skills_df_final.to_csv(os.path.join(OUTPUT_DIR, "skills_cm.csv"), index=False, encoding='utf-8')
    logging.info(f"- {len(skills_df_final)} yetenek ataması oluşturuldu: skills_cm.csv")

    shifts_df.to_csv(os.path.join(OUTPUT_DIR, "shifts_cm.csv"), index=False, encoding='utf-8')
    logging.info(f"- {len(shifts_df)} vardiya oluşturuldu: shifts_cm.csv")

    availability_df.to_csv(os.path.join(OUTPUT_DIR, "availability_cm.csv"), index=False, encoding='utf-8')
    logging.info(f"- {len(availability_df)} uygunluk kaydı oluşturuldu: availability_cm.csv")

    preferences_df.to_csv(os.path.join(OUTPUT_DIR, "preferences_cm.csv"), index=False, encoding='utf-8')
    logging.info(f"- {len(preferences_df)} tercih kaydı oluşturuldu: preferences_cm.csv")

    logging.info(f"Çağrı Merkezi yapay verisi başarıyla '{OUTPUT_DIR}' klasörüne oluşturuldu.")

# Betiği çalıştır
if __name__ == "__main__":
    generate_data()
    print("generate_cagri_merkezi_data.py başarıyla çalıştı ve veriler oluşturuldu.")
