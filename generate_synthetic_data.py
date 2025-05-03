import pandas as pd
import random
from datetime import date, timedelta, time
import os

# --- Parametreler ---
NUM_EMPLOYEES = 50
NUM_DAYS = 7  # Bir haftalık çizelge için
START_DATE = date.today()
OUTPUT_DIR = "synthetic_data"

# Çalışan Rolleri ve Dağılımları (Örnek)
ROLES = {
    "Hemşire": 0.6,
    "Doktor": 0.2,
    "Teknisyen": 0.15,
    "İdari": 0.05
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
        "ana_uzmanlik": [ # Doktorun ana uzmanlık alanı (Bir adet seçilecek)
            "Kardiyoloji", "Dahiliye", "Genel Cerrahi", "Pediatri", "Acil Tıp",
            "Nöroloji", "Onkoloji", "Ortopedi", "Kadın Doğum", "Göz Hastalıkları", "KBB",
            "Psikiyatri", "Anesteziyoloji", "Enfeksiyon Hastalıkları", "Radyoloji (Uzman)",
            "Fizik Tedavi ve Rehabilitasyon", "Dermatoloji", "Üroloji", "Göğüs Hastalıkları"
            # ... (Gerektiği kadar uzmanlık eklenebilir)
        ],
        "ek_yetkinlikler": { # Ana uzmanlığa ek sahip olabileceği yetkinlikler ve olasılıkları
            "Ultrasonografi Yetkinliği": 0.25,
            "Endoskopi Yetkinliği": 0.15,  # Genellikle Dahiliye, Cerrahi vb.
            "Laparoskopi Yetkinliği": 0.10,  # Genellikle Cerrahi branşlar
            "Yoğun Bakım Deneyimi (Doktor)": 0.20, # Farklı uzmanlıklar yoğun bakımda görev alabilir
            "Acil Servis Rotasyon Deneyimi": 0.30 # Uzman olsa bile acilde destek olabilir
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

# Vardiya Tanımları (Örnek)
SHIFT_DEFINITIONS = [
    {"id": "Gunduz_Hici", "name": "Gündüz Hafta İçi", "start": time(8, 0), "end": time(16, 0), "days": range(0, 5)}, # Pzt-Cum
    {"id": "Aksam_Hici", "name": "Akşam Hafta İçi", "start": time(16, 0), "end": time(0, 0), "days": range(0, 5)},
    {"id": "Gece_Hici", "name": "Gece Hafta İçi", "start": time(0, 0), "end": time(8, 0), "days": range(1, 6)}, # Salı Sab-Cmt Sab
    {"id": "Gunduz_Hsonu", "name": "Gündüz Hafta Sonu", "start": time(8, 0), "end": time(20, 0), "days": [5, 6]}, # Cmt, Paz
    {"id": "Gece_Hsonu", "name": "Gece Hafta Sonu", "start": time(20, 0), "end": time(8, 0), "days": [6, 0]}  # Pazar Akş-Pzt Sab
]

# Diğer Parametreler
AVG_DAYS_OFF_PER_PERIOD = 1 # Ortalama izin günü sayısı
PREFERENCE_PROBABILITY = 0.4 # Bir çalışanın tercih belirtme olasılığı


def generate_data():
    """Ana yapay veri üretme fonksiyonu."""
    print("Yapay veri üretimi başlıyor...")
    # Çıktı dizinini oluştur
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 1. Çalışanları Oluştur (`employees.csv`)
    employees_data = generate_employees(NUM_EMPLOYEES, ROLES)
    employees_df = pd.DataFrame(employees_data)
    employees_df.to_csv(os.path.join(OUTPUT_DIR, "employees.csv"), index=False)
    print(f"- {len(employees_df)} çalışan oluşturuldu: employees.csv")

    # 2. Yetenekleri Oluştur (`skills.csv`) - ROLE_SKILLS kullanılır
    skills_data = generate_skills_structured(employees_df, ROLE_SKILLS)
    skills_df = pd.DataFrame(skills_data)
    skills_df.to_csv(os.path.join(OUTPUT_DIR, "skills.csv"), index=False)
    print(f"- {len(skills_df)} yetenek ataması oluşturuldu: skills.csv")

    # 3. Vardiyaları Oluştur (`shifts.csv`)
    shifts_data = generate_shifts(START_DATE, NUM_DAYS, SHIFT_DEFINITIONS)
    shifts_df = pd.DataFrame(shifts_data)
    shifts_df.to_csv(os.path.join(OUTPUT_DIR, "shifts.csv"), index=False)
    print(f"- {len(shifts_df)} vardiya oluşturuldu: shifts.csv")

    # 4. Uygunluk Durumunu Oluştur (`availability.csv`)
    availability_data = generate_availability(employees_df, START_DATE, NUM_DAYS, AVG_DAYS_OFF_PER_PERIOD)
    availability_df = pd.DataFrame(availability_data)
    availability_df.to_csv(os.path.join(OUTPUT_DIR, "availability.csv"), index=False)
    print(f"- {len(availability_df)} uygunluk kaydı oluşturuldu: availability.csv")

    # 5. Tercihleri Oluştur (`preferences.csv`)
    preferences_data = generate_preferences(employees_df, shifts_df, PREFERENCE_PROBABILITY)
    preferences_df = pd.DataFrame(preferences_data)
    preferences_df.to_csv(os.path.join(OUTPUT_DIR, "preferences.csv"), index=False)
    print(f"- {len(preferences_df)} tercih kaydı oluşturuldu: preferences.csv")

    print(f"Yapay veri başarıyla '{OUTPUT_DIR}' klasörüne oluşturuldu.")

# --- Yardımcı Fonksiyonlar (İskeletler) ---

def generate_employees(num_employees, roles_distribution):
    """Çalışan listesini ve rollerini oluşturur."""
    employees = []
    roles_list = list(roles_distribution.keys())
    probabilities = list(roles_distribution.values())
    for i in range(num_employees):
        emp_id = f"E{str(i+1).zfill(3)}" # Örn: E001, E002
        role = random.choices(roles_list, probabilities, k=1)[0]
        employees.append({"employee_id": emp_id, "role": role})
    return employees

def generate_skills_structured(employees_df, role_skills_definition):
    """Çalışanlara rollerine göre yapılandırılmış yetenekler atar."""
    skills_list = []
    for _, emp in employees_df.iterrows():
        employee_id = emp["employee_id"]
        employee_role = emp["role"]

        # Rol tanımı var mı kontrol et
        if employee_role in role_skills_definition:
            role_info = role_skills_definition[employee_role]

            # 1. Zorunlu yetenekleri ata
            if "zorunlu" in role_info:
                for skill in role_info["zorunlu"]:
                    skills_list.append({"employee_id": employee_id, "skill": skill})

            # == Doktor Rolü Özel Mantığı ==
            if employee_role == "Doktor":
                # 2a. Ana uzmanlıklardan birini seç ve ata
                if "ana_uzmanlik" in role_info and role_info["ana_uzmanlik"]:
                    main_specialty = random.choice(role_info["ana_uzmanlik"])
                    skills_list.append({"employee_id": employee_id, "skill": main_specialty})
                
                # 2b. Ek yetkinliklerden olasılığa göre ata
                if "ek_yetkinlikler" in role_info:
                    assigned_ek_count = 0
                    max_ek = role_info.get("max_ek_yetkinlik", 0)
                    # Olasılıkları olan yetenekleri karıştırıp denemek daha adil olabilir
                    ek_items = list(role_info["ek_yetkinlikler"].items())
                    random.shuffle(ek_items)
                    for skill, prob in ek_items:
                        if assigned_ek_count < max_ek and random.random() < prob:
                            skills_list.append({"employee_id": employee_id, "skill": skill})
                            assigned_ek_count += 1
            
            # == Diğer Roller İçin Seçmeli Yetenek Mantığı ==
            elif "secmeli" in role_info and role_info["secmeli"]:
                secmeli_skills = role_info["secmeli"]
                max_secmeli_count = role_info.get("max_secmeli", len(secmeli_skills))
                num_secmeli_to_assign = random.randint(0, max_secmeli_count)
                assigned_secmeli = random.sample(secmeli_skills, min(num_secmeli_to_assign, len(secmeli_skills)))
                for skill in assigned_secmeli:
                    skills_list.append({"employee_id": employee_id, "skill": skill})

    return skills_list

def generate_shifts(start_date, num_days, shift_definitions):
    """Belirtilen tarih aralığı ve tanımlara göre vardiyaları oluşturur."""
    shifts = []
    all_dates = [start_date + timedelta(days=i) for i in range(num_days)]
    shift_counter = 1
    for shift_def in shift_definitions:
        for d in all_dates:
            # Haftanın gününü kontrol et (Pzt=0, Paz=6)
            if d.weekday() in shift_def["days"]:
                shift_id = f"S{str(shift_counter).zfill(4)}" # Örn: S0001
                shifts.append({
                    "shift_id": shift_id,
                    "name": shift_def["name"],
                    "date": d.isoformat(),
                    "start_time": shift_def["start"].isoformat(),
                    "end_time": shift_def["end"].isoformat()
                })
                shift_counter += 1
    return shifts

def generate_availability(employees_df, start_date, num_days, avg_days_off):
    """Çalışanların uygunluk durumunu (izin vb.) oluşturur."""
    availability = []
    all_dates = [start_date + timedelta(days=i) for i in range(num_days)]
    for _, emp in employees_df.iterrows():
        # Her çalışan için rastgele sayıda izin günü ata
        num_off_days = max(0, round(random.gauss(avg_days_off, avg_days_off / 2))) # Gauss dağılımı
        off_dates = random.sample(all_dates, min(num_off_days, len(all_dates)))
        for d in all_dates:
            is_available = 0 if d in off_dates else 1
            availability.append({
                "employee_id": emp["employee_id"],
                "date": d.isoformat(),
                "is_available": is_available # 1: Müsait, 0: Müsait Değil
            })
    return availability

def generate_preferences(employees_df, shifts_df, preference_probability):
    """Çalışanlar için rastgele vardiya tercihleri oluşturur."""
    preferences = []
    shift_ids = shifts_df['shift_id'].tolist()
    if not shift_ids: return [] # Vardiya yoksa tercih de olmaz

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
    return preferences

# Betiği çalıştır
if __name__ == "__main__":
    generate_data() 