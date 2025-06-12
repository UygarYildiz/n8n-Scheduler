import pandas as pd

print("=== YENİ ÇAĞRI MERKEZİ VERİSİ ===")
df_new = pd.read_csv('synthetic_data_cagri_merkezi/employees_cm.csv')
print('Yeni Çalışan Departman Dağılımı:')
print(df_new['department'].value_counts())
print(f'\nToplam çalışan: {len(df_new)}')

print("\n=== ESKİ ÇAĞRI MERKEZİ VERİSİ ===")
df_old = pd.read_csv('veri_kaynaklari/cagri_merkezi/employees_cm.csv')
print('Eski Çalışan Departman Dağılımı:')
print(df_old['department'].value_counts())
print(f'\nToplam çalışan: {len(df_old)}') 