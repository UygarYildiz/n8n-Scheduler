import pandas as pd
import random
from datetime import date, timedelta, time
import os
import logging
import yaml
import re
import fnmatch

# --- Parametreler ---
NUM_EMPLOYEES = 50
NUM_DAYS = 7  # Bir haftalık çizelge için
START_DATE = date.today()
OUTPUT_DIR = "synthetic_data"
CONFIG_FILE_PATH = "configs/hospital_test_config.yaml"

# Çalışan Rolleri ve Dağılımları (Örnek)
ROLES = {
    "Hemşire": 0.6,
    "Doktor": 0.2,
    "Teknisyen": 0.15,
    "İdari": 0.05
}

# Departman Tanımları
DEPARTMENTS = {
    "Acil": 0.2,
    "Kardiyoloji": 0.15,
    "Cerrahi": 0.15,
    "Pediatri": 0.15,
    "Yoğun Bakım": 0.15,
    "Radyoloji": 0.1,
    "Laboratuvar": 0.1
}

# --- Yetenekler (Rol Bazlı - Zorunlu, Ana Uzmanlık, Ek Yetkinlikler - Daha Detaylı Doktor) ---
ROLE_SKILLS = {
    "Hemşire": {
        "zorunlu": ["Temel Hasta Bakımı", "İlk Yardım Sertifikası", "İlaç Yönetimi"],
        "secmeli": [
            "Yoğun Bakım Sertifikası", "Ameliyathane Deneyimi", "Pediatri Yetkinliği",
            "Acil Servis Deneyimi", "Kan Alma Yetkinliği", "Diyabet Hemşireliği",
            "Yara Bakım Uzmanlığı", "Onkoloji Hemşireliği", "Triyaj Yetkinliği"
        ],
        "max_secmeli": 3 # Bir hemşire en fazla kaç seçmeli yetenek alabilsin?
    },
    "Doktor": {
        "zorunlu": ["Teşhis ve Tedavi", "İlk Yardım Sertifikası", "Reçete Yazma"],
        # "ana_uzmanlik" alanı kaldırıldı - artık DEPARTMENT_TO_SPECIALTY kullanılıyor
        "ek_yetkinlikler": { # Ana uzmanlığa ek sahip olabileceği yetkinlikler ve olasılıkları
            "Ultrasonografi Yetkinliği": 0.25,
            "Endoskopi Yetkinliği": 0.15,  # Genellikle Dahiliye, Cerrahi vb.
            "Laparoskopi Yetkinliği": 0.10,  # Genellikle Cerrahi branşlar
            "Yoğun Bakım Sertifikası": 0.20,      # YENİ (Konfig ile aynı)
            "Acil Servis Deneyimi": 0.30         # YENİ (Konfig ile aynı)
        },
        "max_ek_yetkinlik": 2 # En fazla kaç ek yetkinlik atanacağı
    },
    "Teknisyen": {
        "zorunlu": ["Ekipman Kullanımı", "Temel İlk Yardım"],
        "secmeli": [
            "Radyoloji Cihazı Kullanımı", "Laboratuvar Test Yetkinliği", "EKG Çekme",
            "Kan Alma Yetkinliği", "MR Teknisyenliği", "Tomografi Teknisyenliği",
            "Solunum Terapisti Yetkinliği"
        ],
        "max_secmeli": 2
    },
    "İdari": {
        "zorunlu": ["Ofis Yönetimi", "Temel Bilgisayar Kullanımı"],
        "secmeli": ["Randevu Planlama", "Hasta Kayıt", "Tıbbi Sekreterlik",
                    "Faturalandırma ve Kodlama", "İngilizce Dil Yetkinliği"],
        "max_secmeli": 2
    }
}

# Vardiya Tanımları (Departman bilgisi ile)
SHIFT_DEFINITIONS = [
    # Gündüz Hafta İçi vardiyaları - Tüm departmanlar
    {"id": "Gunduz_Hici", "name": "Gündüz Hafta İçi", "start": time(8, 0), "end": time(16, 0), "days": range(0, 5),
     "departments": ["Acil", "Kardiyoloji", "Cerrahi", "Pediatri", "Yoğun Bakım", "Radyoloji", "Laboratuvar", "İdari"]},

    # Akşam Hafta İçi vardiyaları - Tüm klinik departmanlar
    {"id": "Aksam_Hici", "name": "Akşam Hafta İçi", "start": time(16, 0), "end": time(0, 0), "days": range(0, 5),
     "departments": ["Acil", "Kardiyoloji", "Cerrahi", "Pediatri", "Yoğun Bakım"]},

    # Gece Hafta İçi vardiyaları - Sadece acil ve kritik departmanlar
    {"id": "Gece_Hici", "name": "Gece Hafta İçi", "start": time(0, 0), "end": time(8, 0), "days": range(1, 6),
     "departments": ["Acil", "Yoğun Bakım"]},

    # Hafta sonu vardiyaları - Sadece acil ve kritik departmanlar
    {"id": "Gunduz_Hsonu", "name": "Gündüz Hafta Sonu", "start": time(8, 0), "end": time(20, 0), "days": [5, 6],
     "departments": ["Acil", "Yoğun Bakım", "Pediatri"]},

    {"id": "Gece_Hsonu", "name": "Gece Hafta Sonu", "start": time(20, 0), "end": time(8, 0), "days": [6, 0],
     "departments": ["Acil", "Yoğun Bakım"]}
]

# Diğer Parametreler
AVG_DAYS_OFF_PER_PERIOD = 1 # Ortalama izin günü sayısı
PREFERENCE_PROBABILITY = 0.4 # Bir çalışanın tercih belirtme olasılığı

# Departman-Uzmanlık eşlemesi
DEPARTMENT_TO_SPECIALTY = {
    "Acil": "Acil Tıp",
    "Kardiyoloji": "Kardiyoloji",
    "Cerrahi": "Genel Cerrahi",
    "Pediatri": "Pediatri",
    "Yoğun Bakım": "Anesteziyoloji",  # Yoğun Bakım için uygun bir uzmanlık
    "Radyoloji": "Radyoloji",
    "Laboratuvar": "Patoloji"
}

# --- Logging Kurulumu ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def get_specialty_for_department(department, role):
    """Departman ve role göre uygun uzmanlık alanını döndürür."""
    if role == "Doktor":
        # Öncelikle DEPARTMENT_TO_SPECIALTY sözlüğüne bak
        if department in DEPARTMENT_TO_SPECIALTY:
            return DEPARTMENT_TO_SPECIALTY[department]

        # Eğer bulunamazsa, departman adına göre mantıklı bir uzmanlık seç
        if "Cerrahi" in department:
            return "Genel Cerrahi"
        elif "Acil" in department:
            return "Acil Tıp"
        elif "Kardiyoloji" in department or "Kalp" in department:
            return "Kardiyoloji"
        elif "Pediatri" in department or "Çocuk" in department:
            return "Pediatri"
        elif "Yoğun Bakım" in department:
            return "Anesteziyoloji"
        # ... diğer departman-uzmanlık eşleştirmeleri

        # Son çare olarak "Genel Tıp" döndür
        logging.warning(f"'{department}' departmanı için spesifik uzmanlık bulunamadı. 'Genel Tıp' atanıyor.")
        return "Genel Tıp"
    return None

def generate_data():
    """Ana yapay veri üretme fonksiyonu."""
    logging.info("Yapay veri üretimi başlıyor...") # Logging kullanımı daha iyi
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 1. Çalışanları Oluştur
    employees_list = generate_employees(NUM_EMPLOYEES, ROLES, DEPARTMENTS) # Liste döndürüyor
    employees_df = pd.DataFrame(employees_list) # Liste'yi DataFrame'e dönüştür

    # 2. Vardiyaları Oluştur
    shifts_df = generate_shifts(START_DATE, NUM_DAYS, SHIFT_DEFINITIONS) # DataFrame döndürüyor

    # 3. Temel Yetenekleri Oluştur
    skills_list = generate_skills_structured(employees_df, ROLE_SKILLS) # Liste döndürüyor

    # 4. Konfigürasyon bazlı veri iyileştirmesi (yeni çalışan ekleyebilir)
    # employees_df ve skills_list burada güncellenecek
    employees_df, skills_list = enhance_data_based_on_config(employees_df, shifts_df, skills_list, CONFIG_FILE_PATH, ROLE_SKILLS)

    # 5. Uygunluk Durumunu Oluştur (iyileştirmeden SONRA, tüm çalışanlar için)
    availability_df = generate_availability(employees_df, START_DATE, NUM_DAYS, AVG_DAYS_OFF_PER_PERIOD) # DataFrame döndürüyor

    # 6. Tercihleri Oluştur (iyileştirmeden SONRA, tüm çalışanlar için)
    preferences_df = generate_preferences(employees_df, shifts_df, PREFERENCE_PROBABILITY) # DataFrame döndürüyor

    # Veri dosyalarını kaydet
    employees_df.to_csv(os.path.join(OUTPUT_DIR, "employees.csv"), index=False, encoding='utf-8')
    logging.info(f"- {len(employees_df)} çalışan oluşturuldu ve kaydedildi: employees.csv")

    # skills_list'i DataFrame'e çevirip kaydet
    skills_df_final = pd.DataFrame(skills_list)
    skills_df_final.to_csv(os.path.join(OUTPUT_DIR, "skills.csv"), index=False, encoding='utf-8')
    logging.info(f"- {len(skills_df_final)} yetenek ataması oluşturuldu ve kaydedildi: skills.csv")

    shifts_df.to_csv(os.path.join(OUTPUT_DIR, "shifts.csv"), index=False, encoding='utf-8')
    logging.info(f"- {len(shifts_df)} vardiya oluşturuldu ve kaydedildi: shifts.csv")

    availability_df.to_csv(os.path.join(OUTPUT_DIR, "availability.csv"), index=False, encoding='utf-8')
    logging.info(f"- {len(availability_df)} uygunluk kaydı oluşturuldu ve kaydedildi: availability.csv")

    preferences_df.to_csv(os.path.join(OUTPUT_DIR, "preferences.csv"), index=False, encoding='utf-8')
    logging.info(f"- {len(preferences_df)} tercih kaydı oluşturuldu ve kaydedildi: preferences.csv")

    logging.info(f"Yapay veri başarıyla '{OUTPUT_DIR}' klasörüne oluşturuldu.")

def generate_data_based_on_config(config_file="configs/hospital_test_config.yaml"):
    """Konfigürasyon dosyasına göre sentetik veri üretir."""
    # Konfigürasyon dosyasını oku
    with open(config_file, 'r') as file:
        config = yaml.safe_load(file)

    # Minimum personel gereksinimlerini analiz et
    min_staffing_reqs = config.get('rules', {}).get('min_staffing_requirements', [])

    # Yetenek gereksinimlerini analiz et
    skill_reqs = config.get('rules', {}).get('skill_requirements', [])

    # Gereksinimlere göre personel ve yetenek atamaları yap
    # ...

# --- Yardımcı Fonksiyonlar ---

def add_skill_with_limit_check(employee_id, skill, skills_list, employees_df, role_skills_config, strategy="warn"):
    """
    Bir çalışana yetenek ekler, maksimum sınırları kontrol eder.

    Stratejiler:
    - "warn": Sınır aşılacaksa uyarı logla ve atama yapma
    - "force": Sınır aşılsa bile atama yap
    - "replace": Sınır aşılacaksa başka bir yeteneği sil ve atama yap
    """
    # Çalışanın rolünü bul
    employee_role = None
    for _, emp in employees_df.iterrows():
        if emp['employee_id'] == employee_id:
            employee_role = emp['role']
            break

    if not employee_role:
        logging.warning(f"Çalışan {employee_id} bulunamadı. Yetenek ataması yapılamıyor.")
        return False

    # Çalışanın mevcut yeteneklerini bul
    current_skills = [s for s in skills_list if s['employee_id'] == employee_id]

    # Rolün maksimum yetenek sınırını bul
    max_skills = 0
    if employee_role == "Hemşire":
        max_skills = role_skills_config["Hemşire"].get("max_secmeli", 3) + len(role_skills_config["Hemşire"].get("zorunlu", []))
    elif employee_role == "Doktor":
        max_skills = role_skills_config["Doktor"].get("max_ek_yetkinlik", 2) + len(role_skills_config["Doktor"].get("zorunlu", [])) + 1  # +1 for specialty
    elif employee_role in role_skills_config and "max_secmeli" in role_skills_config[employee_role]:
        max_skills = role_skills_config[employee_role].get("max_secmeli", 0) + len(role_skills_config[employee_role].get("zorunlu", []))
    else:
        # Rol için maksimum yetenek sınırı tanımlanmamış, varsayılan olarak 10 kullan
        max_skills = 10

    # Eğer sınır aşılmayacaksa, yeteneği ekle ve True döndür
    if len(current_skills) < max_skills:
        skills_list.append({"employee_id": employee_id, "skill": skill})
        return True

    # Sınır aşılacaksa, stratejiye göre işlem yap
    if strategy == "warn":
        logging.warning(f"Çalışan {employee_id} ({employee_role}) için maksimum yetenek sınırı aşılacağı için " +
                      f"'{skill}' yeteneği atanmadı.")
        return False

    elif strategy == "force":
        skills_list.append({"employee_id": employee_id, "skill": skill})
        logging.info(f"Çalışan {employee_id} ({employee_role}) için maksimum yetenek sınırı aşıldı. " +
                   f"Yeni toplam: {len(current_skills) + 1}, Maksimum: {max_skills}")
        return True

    elif strategy == "replace":
        # Zorunlu yetenekleri ve ana uzmanlığı belirleme
        mandatory_skills = []
        if employee_role == "Hemşire":
            mandatory_skills = role_skills_config["Hemşire"].get("zorunlu", [])
        elif employee_role == "Doktor":
            mandatory_skills = role_skills_config["Doktor"].get("zorunlu", [])
            # Ana uzmanlığı bul
            for _, emp in employees_df.iterrows():
                if emp['employee_id'] == employee_id:
                    specialty = get_specialty_for_department(emp['department'], employee_role)
                    if specialty:
                        mandatory_skills.append(specialty)
                    break
        elif employee_role in role_skills_config:
            mandatory_skills = role_skills_config[employee_role].get("zorunlu", [])

        # Silinebilecek yetenekleri bul (zorunlu olmayanlar)
        removable_skills = [s for s in current_skills if s['skill'] not in mandatory_skills]

        # Eğer silinebilecek yetenek yoksa, uyarı logla ve False döndür
        if not removable_skills:
            logging.warning(f"Çalışan {employee_id} ({employee_role}) için maksimum yetenek sınırı aşılacak " +
                          f"ve silinebilecek yetenek yok. Eklenmek istenen: {skill}")
            return False

        # Rastgele bir yeteneği sil
        skill_to_remove = random.choice(removable_skills)
        skills_list.remove(skill_to_remove)

        logging.info(f"Çalışan {employee_id} ({employee_role}) için maksimum yetenek sınırını korumak için " +
                   f"'{skill_to_remove['skill']}' yeteneği silindi. Yeni eklenen: {skill}")

        # Yeni yeteneği ekle
        skills_list.append({"employee_id": employee_id, "skill": skill})
        return True

    # Geçersiz strateji
    logging.warning(f"Geçersiz strateji: {strategy}. Yetenek ataması yapılamadı.")
    return False

def generate_employees(num_employees, roles_distribution, departments_distribution):
    """Çalışan listesini, rollerini ve departmanlarını oluşturur."""
    employees = []
    roles_list = list(roles_distribution.keys())
    probabilities = list(roles_distribution.values())
    dept_list = list(departments_distribution.keys())
    dept_probabilities = list(departments_distribution.values())

    # Önce her departmanda en az bir doktor ve bir hemşire olmasını sağla
    required_assignments = []

    # Klinik departmanlar için doktor ve hemşire ataması
    clinical_depts = ["Acil", "Kardiyoloji", "Cerrahi", "Pediatri", "Yoğun Bakım"]
    for dept in clinical_depts:
        required_assignments.append({"role": "Doktor", "department": dept})
        required_assignments.append({"role": "Hemşire", "department": dept})

    # Diğer departmanlar için rol ataması
    required_assignments.append({"role": "Teknisyen", "department": "Radyoloji"})
    required_assignments.append({"role": "Teknisyen", "department": "Laboratuvar"})
    required_assignments.append({"role": "İdari", "department": "İdari"})

    # Zorunlu atamaları yap
    emp_counter = 1
    for assignment in required_assignments:
        if emp_counter > num_employees:
            break  # Çalışan sayısı sınırını aşma

        emp_id = f"E{str(emp_counter).zfill(3)}"  # Örn: E001, E002
        employees.append({
            "employee_id": emp_id,
            "role": assignment["role"],
            "department": assignment["department"]
        })
        emp_counter += 1

    # Kalan çalışanları rastgele ata
    for i in range(emp_counter, num_employees + 1):
        emp_id = f"E{str(i).zfill(3)}"  # Örn: E001, E002
        role = random.choices(roles_list, probabilities, k=1)[0]

        # Rol bazlı departman ataması
        if role == "İdari":
            department = "İdari"
        elif role == "Teknisyen":
            # Teknisyenler genellikle Radyoloji veya Laboratuvar'da çalışır
            department = random.choice(["Radyoloji", "Laboratuvar"])
        else:  # Hemşire ve Doktor
            # Ağırlıklı olasılıklara göre departman seç
            department = random.choices(dept_list, dept_probabilities, k=1)[0]

        employees.append({
            "employee_id": emp_id,
            "role": role,
            "department": department
        })

    return employees

def generate_skills_structured(employees_df, role_skills_definition):
    """Çalışanlara rollerine göre yapılandırılmış yetenekler atar."""
    skills_list = []
    for _, emp in employees_df.iterrows():
        employee_id = emp["employee_id"]
        employee_role = emp["role"]
        employee_dept = emp["department"]

        # Rol tanımı var mı kontrol et
        if employee_role in role_skills_definition:
            role_info = role_skills_definition[employee_role]

            # 1. Zorunlu yetenekleri ata
            for skill in role_info["zorunlu"]:
                add_skill_with_limit_check(employee_id, skill, skills_list, employees_df, role_skills_definition, strategy="force")

            # == Doktor Rolü Özel Mantığı ==
            if employee_role == "Doktor":
                specialty = get_specialty_for_department(employee_dept, employee_role)
                if specialty: # Eğer bir uzmanlık döndüyse (None değilse)
                    add_skill_with_limit_check(employee_id, specialty, skills_list, employees_df, role_skills_definition, strategy="force")
                else:
                    # Bu durumun olmaması gerekir ama bir güvenlik önlemi olarak loglama yapılabilir
                    logging.error(f"Doktor {employee_id} için ({employee_dept} departmanında) uzmanlık atanamadı!")

                # 2b. Ek yetkinliklerden olasılığa göre ata
                if "ek_yetkinlikler" in role_info:
                    assigned_ek_count = 0
                    max_ek = role_info.get("max_ek_yetkinlik", 0)

                    # Acil departmanındaki doktorlara Acil Servis Deneyimi ekle
                    if employee_dept == "Acil":
                        add_skill_with_limit_check(employee_id, "Acil Servis Deneyimi", skills_list, employees_df, role_skills_definition, strategy="force")
                        assigned_ek_count += 1

                    # Yoğun Bakım departmanındaki doktorlara Yoğun Bakım Sertifikası ekle
                    if employee_dept == "Yoğun Bakım":
                        add_skill_with_limit_check(employee_id, "Yoğun Bakım Sertifikası", skills_list, employees_df, role_skills_definition, strategy="force")
                        assigned_ek_count += 1

                    # Olasılıkları olan yetenekleri karıştırıp denemek daha adil olabilir
                    ek_items = list(role_info["ek_yetkinlikler"].items())
                    random.shuffle(ek_items)
                    for skill, prob in ek_items:
                        if assigned_ek_count < max_ek and random.random() < prob:
                            # Zaten eklenmiş yeteneği tekrar ekleme
                            if not any(s["employee_id"] == employee_id and s["skill"] == skill for s in skills_list):
                                add_skill_with_limit_check(employee_id, skill, skills_list, employees_df, role_skills_definition, strategy="force")
                                assigned_ek_count += 1

            # == Hemşire Rolü Özel Mantığı ==
            elif employee_role == "Hemşire":
                secmeli_skills = role_info.get("secmeli", [])
                max_secmeli_count = role_info.get("max_secmeli", len(secmeli_skills))
                assigned_secmeli = []

                # Acil departmanındaki hemşirelere Acil Servis Deneyimi ekle
                if employee_dept == "Acil":
                    add_skill_with_limit_check(employee_id, "Acil Servis Deneyimi", skills_list, employees_df, role_skills_definition, strategy="force")
                    assigned_secmeli.append("Acil Servis Deneyimi")

                # Yoğun Bakım departmanındaki hemşirelere Yoğun Bakım Sertifikası ekle
                if employee_dept == "Yoğun Bakım":
                    add_skill_with_limit_check(employee_id, "Yoğun Bakım Sertifikası", skills_list, employees_df, role_skills_definition, strategy="force")
                    assigned_secmeli.append("Yoğun Bakım Sertifikası")

                # Pediatri departmanındaki hemşirelere Pediatri Yetkinliği ekle
                if employee_dept == "Pediatri":
                    add_skill_with_limit_check(employee_id, "Pediatri Yetkinliği", skills_list, employees_df, role_skills_definition, strategy="force")
                    assigned_secmeli.append("Pediatri Yetkinliği")

                # Kalan seçmeli yetenekleri rastgele ata
                remaining_skills = [s for s in secmeli_skills if s not in assigned_secmeli]
                num_remaining_to_assign = random.randint(0, max_secmeli_count - len(assigned_secmeli))
                if num_remaining_to_assign > 0 and remaining_skills:
                    additional_skills = random.sample(remaining_skills, min(num_remaining_to_assign, len(remaining_skills)))
                    for skill in additional_skills:
                        add_skill_with_limit_check(employee_id, skill, skills_list, employees_df, role_skills_definition, strategy="force")

            # == Diğer Roller İçin Seçmeli Yetenek Mantığı ==
            elif "secmeli" in role_info and role_info["secmeli"]:
                secmeli_skills = role_info["secmeli"]
                max_secmeli_count = role_info.get("max_secmeli", len(secmeli_skills))
                num_secmeli_to_assign = random.randint(0, max_secmeli_count)
                assigned_secmeli = random.sample(secmeli_skills, min(num_secmeli_to_assign, len(secmeli_skills)))
                for skill in assigned_secmeli:
                    add_skill_with_limit_check(employee_id, skill, skills_list, employees_df, role_skills_definition, strategy="force")

    return skills_list

def generate_shifts(start_date, num_days, shift_definitions):
    """Belirtilen tarih aralığı ve tanımlara göre vardiyaları oluşturur. Departman bilgisini vardiya adına ekler."""
    shifts = []
    all_dates = [start_date + timedelta(days=i) for i in range(num_days)]
    shift_counter = 1

    for shift_def in shift_definitions:
        for d in all_dates:
            # Haftanın gününü kontrol et (Pzt=0, Paz=6)
            if d.weekday() in shift_def["days"]:
                # Her departman için ayrı vardiya oluştur
                for dept in shift_def.get("departments", [None]):
                    shift_id = f"S{str(shift_counter).zfill(4)}" # Örn: S0001

                    # Departman bilgisini vardiya adına ekle
                    if dept:
                        shift_name = f"{shift_def['name']} {dept}"
                    else:
                        shift_name = shift_def["name"]

                    shifts.append({
                        "shift_id": shift_id,
                        "name": shift_name,
                        "date": d.isoformat(),
                        "start_time": shift_def["start"].isoformat(),
                        "end_time": shift_def["end"].isoformat(),
                        "department": dept
                    })
                    shift_counter += 1
    return pd.DataFrame(shifts)

def generate_availability(employees_df, start_date, num_days, avg_days_off):
    """Çalışanların uygunluk durumunu (izin vb.) oluşturur."""
    availability = []
    all_dates = [start_date + timedelta(days=i) for i in range(num_days)]
    for _, emp in employees_df.iterrows():
        # Her çalışan için rastgele sayıda izin günü ata
        num_off_days = max(0, round(random.gauss(avg_days_off, avg_days_off / 2))) # Gauss dağılıımı
        off_dates = random.sample(all_dates, min(num_off_days, len(all_dates)))
        for d in all_dates:
            is_available = 0 if d in off_dates else 1
            availability.append({
                "employee_id": emp["employee_id"],
                "date": d.isoformat(),
                "is_available": is_available # 1: Müsait, 0: Müsait Değil
            })
    return pd.DataFrame(availability)

def generate_preferences(employees_df, shifts_df, preference_probability):
    """Çalışanlar için rastgele vardiya tercihleri oluşturur."""
    preferences = []
    shift_ids = shifts_df['shift_id'].tolist()
    if not shift_ids: return pd.DataFrame(preferences)

    for _, emp in employees_df.iterrows():
        if random.random() < preference_probability:
            # Rastgele bir veya birkaç vardiya seçip tercih ata
            num_prefs = random.randint(1, 3) # Örnek: 1-3 tercih
            pref_shifts = random.sample(shift_ids, min(num_prefs, len(shift_ids)))
            for shift_id in pref_shifts:
                # Örnek: -1 (istemiyor) veya 1 (istiyor)
                score = random.choice([-1, 1])
                preferences.append({
                    "employee_id": emp["employee_id"],
                    "shift_id": shift_id,
                    "preference_score": score
                })
    return pd.DataFrame(preferences)

def validate_department_specialty_mapping():
    """Departman-uzmanlık eşlemelerinin tutarlılığını kontrol eder."""
    # DEPARTMENT_TO_SPECIALTY artık get_specialty_for_department içinde tanımlandığı için
    # burada doğrudan get_specialty_for_department fonksiyonunu kullanıyoruz
    for dept in DEPARTMENTS:
        if dept != "İdari":  # İdari hariç
            specialty = get_specialty_for_department(dept, "Doktor")
            if specialty == "Genel Tıp" and "Genel" not in dept:
                logging.warning(f"'{dept}' departmanı için özel uzmanlık eşlemesi bulunamadı, 'Genel Tıp' kullanılıyor.")

def ensure_min_staffing_requirements(employees_df, shifts_df, skills_list, min_staffing_reqs, role_skills_config):
    logging.info("Minimum personel gereksinimleri kontrol ediliyor ve iyileştiriliyor...")
    newly_added_employees_info = [] # DataFrame'e eklemek için liste

    for req in min_staffing_reqs:
        role_req = req.get('role')
        dept_req = req.get('department')
        min_count_req = req.get('min_count', 1)
        # shift_pattern_req = req.get('shift_pattern') # Şimdilik genel departman/rol sayısına odaklanıyoruz

        if not role_req or not dept_req:
            logging.warning(f"Eksik rol veya departman bilgisi: {req}. Bu gereksinim atlanıyor.")
            continue

        # Belirli departman ve roldeki mevcut çalışan sayısı
        current_employees_in_dept_role = employees_df[
            (employees_df['department'] == dept_req) & (employees_df['role'] == role_req)
        ]
        current_count = len(current_employees_in_dept_role)

        if current_count < min_count_req:
            num_to_add = min_count_req - current_count
            logging.info(f"Departman '{dept_req}', rol '{role_req}' için {num_to_add} yeni çalışan eklenecek. "
                         f"(Gereken: {min_count_req}, Mevcut: {current_count})")

            for i in range(num_to_add):
                new_emp_id = f"E_cfg_{len(employees_df) + len(newly_added_employees_info) + 1:03d}"
                new_employee_data = {
                    "employee_id": new_emp_id,
                    "name": f"CfgEmp_{new_emp_id}",
                    "role": role_req,
                    "department": dept_req
                    # Diğer özellikler (kıdem vb.) daha sonra eklenebilir veya varsayılan bırakılabilir
                }
                newly_added_employees_info.append(new_employee_data)
                logging.info(f"Yeni çalışan {new_emp_id} ({role_req} @ {dept_req}) eklendi (henüz DataFrame'de değil).")

                # Yeni eklenen çalışana temel/zorunlu/uzmanlık yeteneklerini ata
                role_info_new_emp = role_skills_config.get(role_req, {})
                for skill in role_info_new_emp.get("zorunlu", []):
                     add_skill_with_limit_check(new_emp_id, skill, skills_list, pd.DataFrame([new_employee_data]), role_skills_config, strategy="force")

                if role_req == "Doktor":
                    specialty = get_specialty_for_department(dept_req, role_req)
                    if specialty:
                        add_skill_with_limit_check(new_emp_id, specialty, skills_list, pd.DataFrame([new_employee_data]), role_skills_config, strategy="force")


    if newly_added_employees_info:
        new_employees_df = pd.DataFrame(newly_added_employees_info)
        employees_df = pd.concat([employees_df, new_employees_df], ignore_index=True)
        logging.info(f"{len(newly_added_employees_info)} yeni çalışan DataFrame'e eklendi.")
        # Yeni eklenenler için temel yetenekler zaten yukarıda skills_list'e eklendi.

    return employees_df, skills_list

def ensure_minimum_skills(employees_df, skills_list, config_reqs, role_skills_config):
    logging.info("Minimum yetenek gereksinimleri kontrol ediliyor ve iyileştiriliyor...")
    for req in config_reqs:
        skill_req = req.get('skill')
        dept_req = req.get('department')
        role_req = req.get('role') # Rol bilgisi de kullanılacak
        min_count_req = req.get('min_count', 1)

        if not skill_req or not dept_req: # Rol zorunlu olmayabilir
            logging.warning(f"Eksik yetenek veya departman: {req}. Bu gereksinim atlanıyor.")
            continue

        # İlgili departman ve (varsa) roldeki çalışanlar
        eligible_employees = employees_df[employees_df['department'] == dept_req]
        if role_req:
            eligible_employees = eligible_employees[eligible_employees['role'] == role_req]

        if eligible_employees.empty:
            logging.warning(f"Departman '{dept_req}'{(f', rol \'{role_req}\'' if role_req else '')} için çalışan bulunamadı. "
                          f"'{skill_req}' yeteneği için kontrol yapılamıyor.")
            continue

        # Bu çalışanlar arasında belirtilen yeteneğe sahip olanların sayısı
        current_skilled_count = 0
        for _, emp in eligible_employees.iterrows():
            if any(s['employee_id'] == emp['employee_id'] and s['skill'] == skill_req for s in skills_list):
                current_skilled_count += 1

        if current_skilled_count < min_count_req:
            num_to_assign = min_count_req - current_skilled_count
            # Bu yeteneğe sahip olmayan potansiyel çalışanlar
            potential_assignees = []
            for _, emp in eligible_employees.iterrows():
                if not any(s['employee_id'] == emp['employee_id'] and s['skill'] == skill_req for s in skills_list):
                    potential_assignees.append(emp['employee_id'])

            if not potential_assignees:
                logging.warning(f"Departman '{dept_req}'{(f', rol \'{role_req}\'' if role_req else '')} için '{skill_req}' yeteneğini alabilecek yeni çalışan yok. "
                              f"Gereken: {min_count_req}, Mevcut Yetenekli: {current_skilled_count}")
                continue

            actual_assignments = 0
            for i in range(min(num_to_assign, len(potential_assignees))):
                emp_id_to_assign = potential_assignees[i]
                if add_skill_with_limit_check(emp_id_to_assign, skill_req, skills_list, employees_df, role_skills_config, strategy="replace"): # Strateji "replace" olabilir
                    actual_assignments +=1

            if actual_assignments > 0:
                 logging.info(f"{actual_assignments} çalışana '{skill_req}' yeteneği eklendi (Departman: {dept_req}{(f', Rol: {role_req}' if role_req else '')}).")
            if actual_assignments < num_to_assign:
                 logging.warning(f"'{skill_req}' yeteneği için yeterli sayıda atama yapılamadı. Hedef: {num_to_assign}, Yapılan: {actual_assignments}")

    return skills_list

def distribute_skills_by_shifts(employees_df, shifts_df, skills_list, config_skill_reqs, role_skills_config):
    logging.info("Vardiya bazlı yetenek gereksinimleri dağıtılıyor...")
    if shifts_df.empty:
        logging.warning("Vardiya bilgisi yok, vardiya bazlı yetenek dağıtımı atlanıyor.")
        return skills_list

    for req in config_skill_reqs:
        pattern = req.get('shift_pattern')
        skill_needed = req.get('skill')
        dept_filter = req.get('department') # Kural belirli bir departman için mi?
        role_filter = req.get('role')       # Kural belirli bir rol için mi?
        min_needed_on_shift = req.get('min_count', 1)

        if not pattern or not skill_needed:
            logging.warning(f"Eksik shift_pattern veya skill: {req}. Bu gereksinim atlanıyor.")
            continue

        # Desenle eşleşen vardiyaları bul
        matching_shifts_indices = []
        for index, shift_row in shifts_df.iterrows():
            # fnmatch ile joker karakterli eşleşme
            if fnmatch.fnmatch(shift_row['name'], pattern):
                # Eğer kuralda departman filtresi varsa ve vardiya departmanıyla eşleşmiyorsa atla
                if dept_filter and shift_row['department'] != dept_filter:
                    continue
                matching_shifts_indices.append(index)

        if not matching_shifts_indices:
            # logging.debug(f"'{pattern}' desenine ve '{dept_filter}' departmanına uygun vardiya bulunamadı.") # Çok fazla log üretebilir
            continue

        logging.info(f"'{pattern}' ({dept_filter or 'Tüm Dep.'}) için '{skill_needed}' yeteneği {min_needed_on_shift} adet/vardiya gerekiyor.")

        for shift_idx in matching_shifts_indices:
            current_shift = shifts_df.loc[shift_idx]
            shift_department = current_shift['department'] # Vardiyanın kendi departmanı

            # Bu vardiyada çalışabilecek (departman ve rol uyumlu) çalışanlar
            eligible_employees_for_shift = employees_df[employees_df['department'] == shift_department]
            if role_filter:
                eligible_employees_for_shift = eligible_employees_for_shift[eligible_employees_for_shift['role'] == role_filter]

            if eligible_employees_for_shift.empty:
                logging.warning(f"Vardiya '{current_shift['name']}' için (Departman: {shift_department}, Rol: {role_filter or 'Tüm Roller'}) uygun çalışan yok.")
                continue

            # Bu vardiyada, bu yeteneğe sahip kaç kişi var?
            # (Not: Bu, o kişilerin o an o vardiyaya atanıp atanmadığını değil, potansiyelini kontrol eder)
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
                     logging.warning(f"Vardiya '{current_shift['name']}' için '{skill_needed}' yeteneği {num_to_acquire_skill - assignments_done} adet eksik kaldı (yeterli potansiyel çalışan yok veya sınır aşıldı).")
    return skills_list

def enhance_data_based_on_config(employees_df, shifts_df, skills_list, config_file_path, role_skills_config):
    logging.info(f"Konfigürasyon dosyası ({config_file_path}) bazlı veri iyileştirmesi başlıyor...")
    try:
        with open(config_file_path, 'r', encoding='utf-8') as file: # encoding eklendi
            config = yaml.safe_load(file)
    except FileNotFoundError:
        logging.error(f"Konfigürasyon dosyası bulunamadı: {config_file_path}. İyileştirme atlanıyor.")
        return employees_df, skills_list
    except Exception as e:
        logging.error(f"Konfigürasyon dosyası okunurken hata: {e}. İyileştirme atlanıyor.")
        return employees_df, skills_list

    min_staff_reqs = config.get('rules', {}).get('min_staffing_requirements', [])
    skill_reqs_config = config.get('rules', {}).get('skill_requirements', [])

    # 1. Adım: Minimum personel sayısını garanti et (yeni çalışan ekleyebilir)
    employees_df, skills_list = ensure_min_staffing_requirements(employees_df, shifts_df, skills_list, min_staff_reqs, role_skills_config)

    # 2. Adım: Genel minimum yetenekleri garanti et (departman/rol bazlı)
    skills_list = ensure_minimum_skills(employees_df, skills_list, skill_reqs_config, role_skills_config)

    # 3. Adım: Vardiya bazlı yetenekleri dağıt
    skills_list = distribute_skills_by_shifts(employees_df, shifts_df, skills_list, skill_reqs_config, role_skills_config)

    logging.info("Veri iyileştirme tamamlandı.")
    return employees_df, skills_list

# Betiği çalıştır
if __name__ == "__main__":
    generate_data()
    validate_department_specialty_mapping()
