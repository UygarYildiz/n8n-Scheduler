import pandas as pd

print("=== YENİ ÇAĞRI MERKEZİ VERİSİ - ROL DAĞILIMI ===")
df_new = pd.read_csv('synthetic_data_cagri_merkezi/employees_cm.csv')
print('Rol Dağılımı:')
print(df_new['role'].value_counts())
print(f'\nToplam çalışan: {len(df_new)}')

print("\n=== ROL-DEPARTMAN DAĞILIMI ===")
print(df_new.groupby(['role', 'department']).size().unstack(fill_value=0)) 