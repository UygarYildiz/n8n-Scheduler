import pandas as pd

print("=== ÇAĞRI MERKEZİ ===")
df_cm = pd.read_csv('veri_kaynaklari/cagri_merkezi/employees_cm.csv')
print('Çalışan Departman Dağılımı:')
print(df_cm['department'].value_counts())
print(f'\nToplam çalışan: {len(df_cm)}')

print("\nVardiya Departman Dağılımı:")
shifts_cm = pd.read_csv('veri_kaynaklari/cagri_merkezi/shifts_cm.csv')
print(shifts_cm['department'].value_counts())
print(f'Toplam vardiya: {len(shifts_cm)}')

print("\n" + "="*50)
print("=== HASTANE ===")
df_h = pd.read_csv('veri_kaynaklari/hastane/employees.csv')
print('Çalışan Departman Dağılımı:')
print(df_h['department'].value_counts())
print(f'\nToplam çalışan: {len(df_h)}')

print("\nVardiya Departman Dağılımı:")
shifts_h = pd.read_csv('veri_kaynaklari/hastane/shifts.csv')
print(shifts_h['department'].value_counts())
print(f'Toplam vardiya: {len(shifts_h)}') 