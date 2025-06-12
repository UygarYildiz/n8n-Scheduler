"""
Migration script: JSON dosyasındaki optimization sonuçlarını database'e aktarır.
"""

import os
import json
import sys
from datetime import datetime

# Current directory'yi sys.path'e ekle
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

try:
    from database import OptimizationResult, get_db
    from sqlalchemy.orm import Session
    print("✅ Database modülleri yüklendi!")
except ImportError as e:
    print(f"❌ Database import hatası: {e}")
    sys.exit(1)

def get_project_root():
    """Proje kök dizinini döndürür."""
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def migrate_json_to_database():
    """
    optimization_result.json dosyasını database'e aktarır.
    """
    try:
        # JSON dosyasını bul
        result_path = os.path.join(get_project_root(), "optimization_result.json")
        
        if not os.path.exists(result_path):
            print(f"❌ JSON dosyası bulunamadı: {result_path}")
            return False
        
        # JSON dosyasını oku
        with open(result_path, 'r', encoding='utf-8') as f:
            json_data = json.load(f)
        
        print(f"✅ JSON dosyası okundu: {result_path}")
        print(f"   Status: {json_data.get('status')}")
        print(f"   Processing time: {json_data.get('processing_time_seconds')}s")
        
        # Database connection
        db = next(get_db())
        
        # Database'de zaten var mı kontrol et
        existing_result = db.query(OptimizationResult).order_by(
            OptimizationResult.created_at.desc()
        ).first()
        
        if existing_result:
            print(f"⚠️  Database'de zaten optimization sonucu var (ID: {existing_result.id})")
            print(f"   Existing status: {existing_result.status}")
            print(f"   Created at: {existing_result.created_at}")
            
            response = input("Yeni bir kayıt eklemek istiyor musunuz? (y/n): ")
            if response.lower() != 'y':
                print("Migration iptal edildi.")
                return False
        
        # Database'e kaydet
        DEFAULT_USER_ID = 1  # admin user
        
        # Custom JSON serializer for date/datetime/time objects
        def json_serializer(obj):
            """Custom JSON serializer for date/datetime/time objects"""
            from datetime import date, datetime, time
            if isinstance(obj, (date, datetime)):
                return obj.isoformat()
            elif isinstance(obj, time):
                return obj.strftime("%H:%M:%S")
            raise TypeError(f"Object of type {type(obj)} is not JSON serializable")
        
        # JSON'dan gelen solution ve metrics'i ayıkla ve serialize et
        solution_data = json_data.get('solution')
        metrics_data = json_data.get('metrics')
        
        # JSON-serializable hale getir
        if solution_data:
            solution_data = json.loads(json.dumps(solution_data, default=json_serializer))
        if metrics_data:
            metrics_data = json.loads(json.dumps(metrics_data, default=json_serializer))
        
        # Dummy input parameters (JSON'da yok)
        input_parameters = {
            "source": "migration_from_json",
            "migrated_at": datetime.now().isoformat(),
            "note": "Migrated from optimization_result.json"
        }
        
        db_result = OptimizationResult(
            user_id=DEFAULT_USER_ID,
            organization_id=1,  # Default organization
            input_parameters=input_parameters,
            solution_data=solution_data,
            metrics=metrics_data,
            status=json_data.get('status', 'UNKNOWN'),
            solver_status_message=json_data.get('solver_status_message'),
            processing_time_seconds=float(json_data.get('processing_time_seconds')) if json_data.get('processing_time_seconds') else None,
            objective_value=float(json_data.get('objective_value')) if json_data.get('objective_value') else None
        )
        
        db.add(db_result)
        db.commit()
        db.refresh(db_result)
        
        print(f"✅ JSON verisi database'e aktarıldı!")
        print(f"   Database ID: {db_result.id}")
        print(f"   Status: {db_result.status}")
        print(f"   Created at: {db_result.created_at}")
        
        # JSON dosyasını backup olarak yeniden adlandır
        backup_path = result_path + ".backup"
        try:
            os.rename(result_path, backup_path)
            print(f"✅ JSON dosyası backup olarak kaydedildi: {backup_path}")
        except Exception as e:
            print(f"⚠️  JSON backup oluşturulamadı: {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration hatası: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🔄 JSON to Database Migration Script")
    print("=====================================")
    
    success = migrate_json_to_database()
    
    if success:
        print("\n✅ Migration başarıyla tamamlandı!")
        print("   Artık tüm optimization sonuçları database'den okunacak.")
    else:
        print("\n❌ Migration başarısız oldu.")
    
    input("\nDevam etmek için Enter'a basın...") 