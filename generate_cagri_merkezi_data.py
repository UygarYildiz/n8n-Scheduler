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
NUM_EMPLOYEES = 60 # Çağrı merkezi için personel sayısı
NUM_DAYS = 7  # Bir haftalık çizelge için
START_DATE = date.today()
OUTPUT_DIR = "synthetic_data_cagri_merkezi" # Çıktı klasörü güncellendi
CONFIG_FILE_PATH = "configs/cagri_merkezi_config.yaml" # Konfigürasyon dosyası güncellendi

# Çalışan Rolleri ve Dağılımları (Çağrı Merkezi Örneği)
ROLES = {
    "Çağrı Alıcı": 0.5,
    "Yönlendirici": 0.3, # Farklı masalara dağılacak
    "Vardiya Amiri": 0.1,
    "Teknik Destek": 0.1
}

# Departman Tanımları (Çağrı Merkezi Masaları/Fonksiyonları)
DEPARTMENTS = {
    "Genel Çağrı": 0.4, # Çağrı alıcılar için ana havuz
    "Polis Yönlendirme": 0.15,
    "Sağlık Yönlendirme": 0.15,
    "İtfaiye Yönlendirme": 0.15,
    "Teknik Operasyonlar": 0.1, # Teknik destek için
    "Yönetim": 0.05 # Vardiya amirleri için
}

# Yetenekler (Rol Bazlı - Çağrı Merkezi)
ROLE_SKILLS = {
    "Çağrı Alıcı": {
        "zorunlu": ["Hızlı Klavye Kullanımı", "Etkili İletişim", "Problem Çözme"],
        "secmeli": [
            "Yabancı Dil (İngilizce)", "Yabancı Dil (Almanca)", "Stres Yönetimi Teknikleri",
            "Kriz Yönetimi Temel Bilgisi", "Coğrafi Bilgi Sistemleri Kullanımı"
        ],
        "max_secmeli": 2
    },
    "Yönlendirici": { # Yönlendiricinin yetenekleri atandığı masaya göre değişecek
        "zorunlu": ["Acil Durum Kodları Bilgisi", "Karar Verme Yeteneği", "Harita Okuma"],
        "secmeli_desk_specific": {
            "Polis Yönlendirme": ["Polis Telsiz Prosedürleri", "Güvenlik Protokolleri"],
            "Sağlık Yönlendirme": ["Temel Tıbbi Terminoloji", "Ambulans Yönetim Sistemi Kullanımı"],
            "İtfaiye Yönlendirme": ["Yangın Güvenliği Bilgisi", "Afet Yönetimi Temel Bilgileri"]
        },
        "max_secmeli_desk_specific": 1, # Masaya özel en fazla 1 ek yetenek
        "secmeli_genel": ["Çoklu Görev Yönetimi", "Detay Odaklılık"],
        "max_secmeli_genel": 1
    },
    "Vardiya Amiri": {
        "zorunlu": ["Liderlik ve Motivasyon", "Operasyonel Planlama", "Raporlama Teknikleri"],
        "secmeli": ["Performans Değerlendirme", "Ekip Yönetimi Yazılımları", "Üst Düzey Kriz Yönetimi"],
        "max_secmeli": 2
    },
    "Teknik Destek": {
        "zorunlu": ["Sistem Arıza Tespiti", "Ağ Temelleri", "Yazılım Güncelleme"],
        "secmeli": ["Veritabanı Yönetimi (Temel)", "Siber Güvenlik Farkındalığı", "Çağrı Merkezi Donanımları"],
        "max_secmeli": 2
    }
}

# Vardiya Tanımları (Çağrı Merkezi - 7/24 - Masalara göre)
SHIFT_DEFINITIONS = [
    # Sabah Vardiyaları (08:00 - 16:00) - Hafta İçi
    {"id_prefix": "Sabah_Hici", "name_template": "Sabah Hafta İçi {department_name_suffix}", "start": time(8, 0), "end": time(16, 0), "days": range(0, 5),
     "departments": ["Genel Çağrı", "Polis Yönlendirme", "Sağlık Yönlendirme", "İtfaiye Yönlendirme", "Teknik Operasyonlar", "Yönetim"]},

    # Öğleden Sonra Vardiyaları (16:00 - 00:00) - Hafta İçi
    {"id_prefix": "Aksam_Hici", "name_template": "Akşam Hafta İçi {department_name_suffix}", "start": time(16, 0), "end": time(0, 0), "days": range(0, 5),
     "departments": ["Genel Çağrı", "Polis Yönlendirme", "Sağlık Yönlendirme", "İtfaiye Yönlendirme", "Teknik Operasyonlar", "Yönetim"]},

    # Gece Vardiyaları (00:00 - 08:00) - Haftanın Her Günü (Ertesi günün sabahına sarkar)
    {"id_prefix": "Gece", "name_template": "Gece {department_name_suffix}", "start": time(0, 0), "end": time(8, 0), "days": range(0, 7), # days: [1,2,3,4,5,6,0] şeklinde de olabilir
     "departments": ["Genel Çağrı", "Polis Yönlendirme", "Sağlık Yönlendirme", "İtfaiye Yönlendirme", "Teknik Operasyonlar", "Yönetim"]},

    # Hafta Sonu Gündüz (08:00 - 20:00)
    {"id_prefix": "Gunduz_Hsonu", "name_template": "Gündüz Hafta Sonu {department_name_suffix}", "start": time(8, 0), "end": time(20, 0), "days": [5, 6],
     "departments": ["Genel Çağrı", "Polis Yönlendirme", "Sağlık Yönlendirme", "İtfaiye Yönlendirme", "Teknik Operasyonlar", "Yönetim"]},

    # Hafta Sonu Gece (20:00 - 08:00 ertesi gün)
    {"id_prefix": "Gece_Hsonu", "name_template": "Gece Hafta Sonu {department_name_suffix}", "start": time(20, 0), "end": time(8, 0), "days": [5, 6], # day 6 -> 0 (Pazar -> Pazartesi) gibi durumlar için kontrol
     "departments": ["Genel Çağrı", "Polis Yönlendirme", "Sağlık Yönlendirme", "İtfaiye Yönlendirme", "Teknik Operasyonlar", "Yönetim"]},
]

# Diğer Parametreler
AVG_DAYS_OFF_PER_PERIOD = 2 # Çağrı merkezi çalışanları için ortalama izin
PREFERENCE_PROBABILITY = 0.3

# --- Logging Kurulumu ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Yardımcı Fonksiyonlar (generate_synthetic_data.py'den alındı, gerekirse düzenlenecek) ---
def add_skill_with_limit_check(employee_id, skill, skills_list, employees_df, role_skills_config, strategy="warn"):
    employee_role = employees_df[employees_df['employee_id'] == employee_id]['role'].iloc[0]
    current_skills_for_employee = [s for s in skills_list if s['employee_id'] == employee_id]
    
    role_config = role_skills_config.get(employee_role, {})
    
    # Maksimum yetenek sayısı hesaplaması (basitleştirilmiş)
    # Her rol için toplam maksimum yetenek (zorunlu + max_secmeli + max_secmeli_desk_specific + max_secmeli_genel)
    max_total_skills = len(role_config.get("zorunlu", []))
    max_total_skills += role_config.get("max_secmeli", 0)
    max_total_skills += role_config.get("max_secmeli_desk_specific", 0) # Yönlendirici için eklendi
    max_total_skills += role_config.get("max_secmeli_genel", 0) # Yönlendirici için eklendi
    if max_total_skills == 0 and employee_role in role_config : max_total_skills = 5 # Rol tanımlı ama max belirtilmemişse varsayılan

    if len(current_skills_for_employee) < max_total_skills or max_total_skills == 0 :
        skills_list.append({"employee_id": employee_id, "skill": skill})
        return True
    
    if strategy == "warn":
        logging.warning(f"Çalışan {employee_id} ({employee_role}) için maksimum yetenek sınırı ({max_total_skills}) aşılacağı için '{skill}' yeteneği atanmadı.")
        return False
    elif strategy == "force":
        skills_list.append({"employee_id": employee_id, "skill": skill})
        logging.info(f"Çalışan {employee_id} ({employee_role}) için maksimum yetenek sınırı aşıldı. Yeni toplam: {len(current_skills_for_employee) + 1}, Maksimum: {max_total_skills}")
        return True
    elif strategy == "replace":
        mandatory_skills = set(role_config.get("zorunlu", []))
        # Yönlendiriciler için masaya özel zorunlu yetenekler (eğer varsa) eklenebilir
        # Bu örnekte zorunlu olanlar genel "zorunlu" listesinde.

        removable_skills = [s for s in current_skills_for_employee if s['skill'] not in mandatory_skills]
        if not removable_skills:
            logging.warning(f"Çalışan {employee_id} ({employee_role}) için maks. yetenek sınırı aşılacak ve silinebilecek yetenek yok. Eklenmek istenen: {skill}")
            return False
        
        skill_to_remove = random.choice(removable_skills)
        # skills_list'ten objeyi doğru bulup silmek için index veya filter kullanmak daha güvenli olabilir
        # Bu basit implementasyonda, eşleşen ilkini siler.
        for i, s_obj in enumerate(skills_list):
            if s_obj['employee_id'] == skill_to_remove['employee_id'] and s_obj['skill'] == skill_to_remove['skill']:
                skills_list.pop(i)
                break
        
        logging.info(f"Çalışan {employee_id} ({employee_role}) için maks. yetenek sınırını korumak için '{skill_to_remove['skill']}' yeteneği silindi. Yeni eklenen: {skill}")
        skills_list.append({"employee_id": employee_id, "skill": skill})
        return True
    
    logging.warning(f"Geçersiz strateji: {strategy}. Yetenek ataması yapılamadı.")
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

def generate_skills_structured(employees_df, role_skills_definition):
    """Çalışanlara rollerine ve departmanlarına göre yapılandırılmış yetenekler atar (Çağrı Merkezi)."""
    skills_list = []
    for _, emp in employees_df.iterrows():
        employee_id = emp["employee_id"]
        employee_role = emp["role"]
        employee_dept = emp["department"]

        if employee_role in role_skills_definition:
            role_info = role_skills_definition[employee_role]

            # 1. Zorunlu yetenekleri ata
            for skill in role_info.get("zorunlu", []):
                add_skill_with_limit_check(employee_id, skill, skills_list, employees_df, role_skills_definition, strategy="force")

            # 2. Yönlendirici için Masaya Özel Seçmeli Yetenekler
            if employee_role == "Yönlendirici" and "secmeli_desk_specific" in role_info:
                desk_skills_options = role_info["secmeli_desk_specific"].get(employee_dept, [])
                if desk_skills_options:
                    max_assign = role_info.get("max_secmeli_desk_specific", len(desk_skills_options))
                    num_to_assign = random.randint(0, min(max_assign, len(desk_skills_options)))
                    if num_to_assign > 0:
                        assigned_desk_skills = random.sample(desk_skills_options, num_to_assign)
                        for skill in assigned_desk_skills:
                            add_skill_with_limit_check(employee_id, skill, skills_list, employees_df, role_skills_definition, strategy="force")
            
            # 3. Yönlendirici için Genel Seçmeli Yetenekler
            if employee_role == "Yönlendirici" and "secmeli_genel" in role_info:
                general_skills_options = role_info.get("secmeli_genel", [])
                if general_skills_options:
                    max_assign = role_info.get("max_secmeli_genel", len(general_skills_options))
                    num_to_assign = random.randint(0, min(max_assign, len(general_skills_options)))
                    if num_to_assign > 0:
                        assigned_general_skills = random.sample(general_skills_options, num_to_assign)
                        for skill in assigned_general_skills:
                             add_skill_with_limit_check(employee_id, skill, skills_list, employees_df, role_skills_definition, strategy="force")

            # 4. Diğer Roller İçin Genel Seçmeli Yetenekler
            elif employee_role != "Yönlendirici" and "secmeli" in role_info:
                secmeli_skills = role_info.get("secmeli", [])
                if secmeli_skills:
                    max_secmeli_count = role_info.get("max_secmeli", len(secmeli_skills))
                    num_secmeli_to_assign = random.randint(0, max_secmeli_count)
                    if num_secmeli_to_assign > 0:
                        assigned_secmeli = random.sample(secmeli_skills, min(num_secmeli_to_assign, len(secmeli_skills)))
                        for skill in assigned_secmeli:
                            add_skill_with_limit_check(employee_id, skill, skills_list, employees_df, role_skills_definition, strategy="force")
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

                    # Bitiş saati başlangıçtan küçükse (örn: 00:00 - 08:00), bitiş tarihi bir sonraki gün olabilir
                    # Bu durum, çakışma ve dinlenme süresi kısıtlarında doğru ele alınmalı
                    # Şimdilik sadece vardiya tanımını oluşturuyoruz.
                    
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
    availability = []
    all_dates = [start_date + timedelta(days=i) for i in range(num_days)]
    for _, emp in employees_df.iterrows():
        num_off_days = max(0, round(random.gauss(avg_days_off, avg_days_off / 2)))
        off_dates_indices = random.sample(range(len(all_dates)), min(num_off_days, len(all_dates)))
        off_dates = [all_dates[i] for i in off_dates_indices]
        for d_idx, d_val in enumerate(all_dates):
            is_available = 0 if d_val in off_dates else 1
            availability.append({
                "employee_id": emp["employee_id"],
                "date": d_val.isoformat(),
                "is_available": is_available
            })
    return pd.DataFrame(availability)

def generate_preferences(employees_df, shifts_df, preference_probability):
    preferences = []
    if shifts_df.empty: return pd.DataFrame(preferences)
    shift_ids = shifts_df['shift_id'].tolist()
    
    for _, emp in employees_df.iterrows():
        if random.random() < preference_probability:
            num_prefs = random.randint(1, 3)
            if not shift_ids: continue # Eğer hiç vardiya yoksa tercih de olmaz
            pref_shifts = random.sample(shift_ids, min(num_prefs, len(shift_ids)))
            for shift_id in pref_shifts:
                score = random.choice([-1, 1]) # Basit tercih skoru
                preferences.append({
                    "employee_id": emp["employee_id"],
                    "shift_id": shift_id,
                    "preference_score": score
                })
    return pd.DataFrame(preferences)

# --- Veri İyileştirme Fonksiyonları (generate_synthetic_data.py'den alındı, çağrı merkezine uyarlandı) ---
def ensure_min_staffing_requirements(employees_df, shifts_df, skills_list, min_staffing_reqs, role_skills_config):
    logging.info("Minimum personel gereksinimleri kontrol ediliyor ve iyileştiriliyor (Çağrı Merkezi)...")
    newly_added_employees_info = []

    for req in min_staffing_reqs:
        role_req = req.get('role')
        dept_req = req.get('department')
        min_count_req = req.get('min_count', 1)

        if not role_req or not dept_req: # Çağrı merkezi için departman (masa) önemli
            logging.warning(f"Eksik rol veya departman: {req}. Bu gereksinim atlanıyor.")
            continue

        current_employees_in_dept_role = employees_df[
            (employees_df['department'] == dept_req) & (employees_df['role'] == role_req)
        ]
        current_count = len(current_employees_in_dept_role)

        if current_count < min_count_req:
            num_to_add = min_count_req - current_count
            logging.info(f"Departman '{dept_req}', rol '{role_req}' için {num_to_add} yeni çalışan eklenecek.")

            for i in range(num_to_add):
                new_emp_id = f"CM_E_cfg_{len(employees_df) + len(newly_added_employees_info) + 1:03d}"
                new_employee_data = {
                    "employee_id": new_emp_id,
                    "name": f"CfgEmp_{new_emp_id}",
                    "role": role_req,
                    "department": dept_req
                }
                newly_added_employees_info.append(new_employee_data)
                
                # Yeni çalışana temel yetenekleri ata
                role_info_new_emp = role_skills_config.get(role_req, {})
                temp_employees_df_for_skill = pd.DataFrame([new_employee_data]) # add_skill için df gerekli
                for skill in role_info_new_emp.get("zorunlu", []):
                     add_skill_with_limit_check(new_emp_id, skill, skills_list, temp_employees_df_for_skill, role_skills_config, strategy="force")
                
                # Yönlendirici ise masaya özel yeteneklerden de eklenebilir (basitçe bir tane)
                if role_req == "Yönlendirici" and "secmeli_desk_specific" in role_info_new_emp:
                    desk_skills = role_info_new_emp["secmeli_desk_specific"].get(dept_req, [])
                    if desk_skills:
                        add_skill_with_limit_check(new_emp_id, random.choice(desk_skills), skills_list, temp_employees_df_for_skill, role_skills_config, strategy="force")


    if newly_added_employees_info:
        new_employees_df_from_list = pd.DataFrame(newly_added_employees_info)
        employees_df = pd.concat([employees_df, new_employees_df_from_list], ignore_index=True)
        logging.info(f"{len(newly_added_employees_info)} yeni çalışan DataFrame'e eklendi (Çağrı Merkezi).")
    
    return employees_df, skills_list

def ensure_minimum_skills(employees_df, skills_list, config_reqs, role_skills_config):
    logging.info("Minimum yetenek gereksinimleri kontrol ediliyor ve iyileştiriliyor (Çağrı Merkezi)...")
    for req in config_reqs:
        skill_req = req.get('skill')
        dept_req = req.get('department') # Masa/departman
        role_req = req.get('role') 
        min_count_req = req.get('min_count', 1)

        if not skill_req or not dept_req:
            logging.warning(f"Eksik yetenek veya departman (masa): {req}. Bu gereksinim atlanıyor.")
            continue

        eligible_employees = employees_df[employees_df['department'] == dept_req]
        if role_req:
            eligible_employees = eligible_employees[eligible_employees['role'] == role_req]

        if eligible_employees.empty:
            logging.warning(f"Masa '{dept_req}'{(f', rol \'{role_req}\'' if role_req else '')} için çalışan bulunamadı. Yetenek kontrolü yapılamıyor.")
            continue

        current_skilled_count = 0
        for _, emp in eligible_employees.iterrows():
            if any(s['employee_id'] == emp['employee_id'] and s['skill'] == skill_req for s in skills_list):
                current_skilled_count += 1

        if current_skilled_count < min_count_req:
            num_to_assign = min_count_req - current_skilled_count
            potential_assignees = [emp['employee_id'] for _, emp in eligible_employees.iterrows() if not any(s['employee_id'] == emp['employee_id'] and s['skill'] == skill_req for s in skills_list)]

            if not potential_assignees:
                logging.warning(f"Masa '{dept_req}'{(f', rol \'{role_req}\'' if role_req else '')} için '{skill_req}' yeteneğini alabilecek yeni çalışan yok.")
                continue
            
            actual_assignments = 0
            for i in range(min(num_to_assign, len(potential_assignees))):
                emp_id_to_assign = potential_assignees[i]
                if add_skill_with_limit_check(emp_id_to_assign, skill_req, skills_list, employees_df, role_skills_config, strategy="replace"):
                    actual_assignments +=1
            
            if actual_assignments > 0:
                 logging.info(f"{actual_assignments} çalışana '{skill_req}' yeteneği eklendi (Masa: {dept_req}{(f', Rol: {role_req}' if role_req else '')}).")
            if actual_assignments < num_to_assign:
                 logging.warning(f"'{skill_req}' için yeterli atama yapılamadı. Hedef: {num_to_assign}, Yapılan: {actual_assignments}")
    return skills_list

def distribute_skills_by_shifts(employees_df, shifts_df, skills_list, config_skill_reqs, role_skills_config):
    logging.info("Vardiya bazlı yetenek gereksinimleri dağıtılıyor (Çağrı Merkezi)...")
    if shifts_df.empty:
        logging.warning("Vardiya bilgisi yok, vardiya bazlı yetenek dağıtımı atlanıyor.")
        return skills_list

    for req in config_skill_reqs:
        pattern = req.get('shift_pattern')
        skill_needed = req.get('skill')
        dept_filter = req.get('department') # Kural belirli bir masa/departman için mi?
        role_filter = req.get('role')
        min_needed_on_shift = req.get('min_count', 1)

        if not pattern or not skill_needed:
            logging.warning(f"Eksik shift_pattern veya skill: {req}. Bu gereksinim atlanıyor.")
            continue

        matching_shifts_indices = []
        for index, shift_row in shifts_df.iterrows():
            if fnmatch.fnmatch(shift_row['name'], pattern): # fnmatch kullanılıyor
                if dept_filter and shift_row['department'] != dept_filter:
                    continue
                matching_shifts_indices.append(index)
        
        if not matching_shifts_indices:
            continue

        for shift_idx in matching_shifts_indices:
            current_shift = shifts_df.loc[shift_idx]
            shift_department = current_shift['department']

            eligible_employees_for_shift = employees_df[employees_df['department'] == shift_department]
            if role_filter:
                eligible_employees_for_shift = eligible_employees_for_shift[eligible_employees_for_shift['role'] == role_filter]

            if eligible_employees_for_shift.empty:
                logging.warning(f"Vardiya '{current_shift['name']}' için uygun çalışan yok (Masa: {shift_department}, Rol: {role_filter or 'Tüm Roller'}).")
                continue
            
            count_skilled_for_shift = 0
            potential_assignees_for_skill = []
            for _, emp_row in eligible_employees_for_shift.iterrows():
                emp_id = emp_row['employee_id']
                has_skill = any(s['employee_id'] == emp_id and s['skill'] == skill_needed for s in skills_list)
                if has_skill:
                    count_skilled_for_shift += 1
                else:
                    potential_assignees_for_skill.append(emp_id)

            if count_skilled_for_shift < min_needed_on_shift:
                num_to_acquire_skill = min_needed_on_shift - count_skilled_for_shift
                assignments_done = 0
                for i in range(min(num_to_acquire_skill, len(potential_assignees_for_skill))):
                    emp_to_get_skill = potential_assignees_for_skill[i]
                    if add_skill_with_limit_check(emp_to_get_skill, skill_needed, skills_list, employees_df, role_skills_config, strategy="replace"):
                        assignments_done +=1
                
                if assignments_done > 0:
                    logging.info(f"Vardiya '{current_shift['name']}' için {assignments_done} çalışana '{skill_needed}' yeteneği eklendi.")
                if assignments_done < num_to_acquire_skill:
                     logging.warning(f"Vardiya '{current_shift['name']}' için '{skill_needed}' yeteneği {num_to_acquire_skill - assignments_done} adet eksik kaldı.")
    return skills_list


def enhance_data_based_on_config(employees_df, shifts_df, skills_list, config_file_path, role_skills_config_param):
    logging.info(f"Konfigürasyon dosyası ({config_file_path}) bazlı veri iyileştirmesi başlıyor (Çağrı Merkezi)...")
    try:
        with open(config_file_path, 'r', encoding='utf-8') as file:
            config = yaml.safe_load(file)
    except FileNotFoundError:
        logging.error(f"Konfigürasyon dosyası bulunamadı: {config_file_path}. İyileştirme atlanıyor.")
        return employees_df, skills_list
    except Exception as e:
        logging.error(f"Konfigürasyon dosyası okunurken hata: {e}. İyileştirme atlanıyor.")
        return employees_df, skills_list

    min_staff_reqs = config.get('rules', {}).get('min_staffing_requirements', [])
    skill_reqs_config = config.get('rules', {}).get('skill_requirements', [])

    employees_df, skills_list = ensure_min_staffing_requirements(employees_df, shifts_df, skills_list, min_staff_reqs, role_skills_config_param)
    skills_list = ensure_minimum_skills(employees_df, skills_list, skill_reqs_config, role_skills_config_param)
    skills_list = distribute_skills_by_shifts(employees_df, shifts_df, skills_list, skill_reqs_config, role_skills_config_param)

    logging.info("Veri iyileştirme tamamlandı (Çağrı Merkezi).")
    return employees_df, skills_list

# --- Ana Veri Üretim Fonksiyonu ---
def generate_data():
    """Ana yapay veri üretme fonksiyonu (Çağrı Merkezi)."""
    logging.info("Çağrı Merkezi için yapay veri üretimi başlıyor...")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 1. Çalışanları Oluştur
    employees_list_raw = generate_employees(NUM_EMPLOYEES, ROLES, DEPARTMENTS)
    employees_df = pd.DataFrame(employees_list_raw)

    # 2. Vardiyaları Oluştur
    shifts_df = generate_shifts(START_DATE, NUM_DAYS, SHIFT_DEFINITIONS)

    # 3. Temel Yetenekleri Oluştur
    skills_list_raw = generate_skills_structured(employees_df, ROLE_SKILLS)

    # 4. Konfigürasyon bazlı veri iyileştirmesi
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
