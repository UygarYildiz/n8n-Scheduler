import logging
import yaml
import os
import time
import json
from typing import Any, Dict, List, Optional, Tuple
from fastapi import FastAPI, HTTPException, Body, Request, Query
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator, ValidationError
from datetime import date, datetime, time as dt_time # time ile çakışmaması için dt_time

# Dashboard API'sini içe aktar
try:
    from optimization_core.dashboard_api import router as dashboard_router
    from optimization_core.activity_logger import log_optimization_activity, log_configuration_update, log_dataset_added
    from optimization_core.cp_model_builder import ShiftSchedulingModelBuilder
except ImportError:
    # Doğrudan çalıştırıldığında (development) farklı import yolu
    from dashboard_api import router as dashboard_router
    from activity_logger import log_optimization_activity, log_configuration_update, log_dataset_added
    from cp_model_builder import ShiftSchedulingModelBuilder

# --- Logging Kurulumu ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Detaylı Pydantic Modelleri ---

class Employee(BaseModel):
    employee_id: str
    name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    specialty: Optional[str] = None
    # ... diğer çalışan özellikleri

class Shift(BaseModel):
    shift_id: str
    name: Optional[str] = None
    date: date
    start_time: dt_time # Örnek: "08:00:00"
    end_time: dt_time   # Örnek: "16:00:00"
    required_staff: int = Field(default=1, ge=0) # Varsayılan 1, negatif olamaz
    department: Optional[str] = None # Departman bilgisi eklendi
    # ... diğer vardiya özellikleri

class Skill(BaseModel):
    employee_id: str
    skill: str

class Availability(BaseModel):
    employee_id: str
    date: date
    is_available: bool = True # Varsayılan True (1 yerine bool kullanalım)

class Preference(BaseModel):
    employee_id: str
    shift_id: str
    preference_score: int = Field(default=0) # Pozitif veya negatif olabilir

class InputData(BaseModel):
    employees: List[Employee] = Field(default_factory=list)
    shifts: List[Shift] = Field(default_factory=list)
    skills: List[Skill] = Field(default_factory=list)
    availability: List[Availability] = Field(default_factory=list)
    preferences: List[Preference] = Field(default_factory=list)

class OptimizationRequest(BaseModel):
    configuration_ref: Optional[str] = None # Örn: "hospital_config.yaml"
    configuration: Optional[Dict[str, Any]] = None
    input_data: InputData

class Assignment(BaseModel):
    employee_id: str
    shift_id: str
    date: Optional[str] = None  # Tarih alanını ekle (string olarak)

class OptimizationSolution(BaseModel):
    assignments: List[Assignment] = Field(default_factory=list)

# +++ Yeni Metrik Modeli +++
class MetricsOutput(BaseModel):
    # Operasyonel Metrikler
    total_understaffing: Optional[int] = None
    total_overstaffing: Optional[int] = None
    min_staffing_coverage_ratio: Optional[float] = None  # Yeni: Minimum personel karşılama oranı
    skill_coverage_ratio: Optional[float] = None  # Yeni: Yetenek gereksinimi karşılama oranı

    # Çalışan Memnuniyeti Metrikleri
    positive_preferences_met_count: Optional[int] = None
    negative_preferences_assigned_count: Optional[int] = None
    total_preference_score_achieved: Optional[int] = None
    total_positive_preferences_count: Optional[int] = None  # Yeni: Toplam pozitif tercih sayısı
    total_negative_preferences_count: Optional[int] = None  # Yeni: Toplam negatif tercih sayısı

    # Adalet Metrikleri
    workload_distribution_std_dev: Optional[float] = None  # Yeni: İş yükü dağılımı adaleti
    bad_shift_distribution_std_dev: Optional[float] = None  # Yeni: "Kötü" vardiya dağılımı adaleti

    # Sistem Esnekliği ve Uyarlanabilirlik Metrikleri
    system_adaptability_score: Optional[float] = None  # Yeni: Sistem esnekliği ve uyarlanabilirlik skoru
    config_complexity_score: Optional[float] = None  # Yeni: Konfigürasyon karmaşıklık skoru
    rule_count: Optional[int] = None  # Yeni: Toplam kural sayısı

    # Gelecekteki metrikler buraya eklenecek

class OptimizationResponse(BaseModel):
    status: str
    solver_status_message: Optional[str] = None
    processing_time_seconds: Optional[float] = None
    objective_value: Optional[float] = None
    solution: Optional[OptimizationSolution] = None
    metrics: Optional[MetricsOutput] = None # +++ Metrikler alanı eklendi +++
    error_details: Optional[str] = None

# --- FastAPI Uygulaması ---
app = FastAPI(
    title="Optimizasyon Çekirdeği API",
    description="n8n ile entegre çalışacak CP-SAT optimizasyon servisi.",
    version="0.2.0" # Versiyon güncellendi
)

# CORS middleware ekle
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*", "http://localhost:3000"],  # Tüm originlere ve frontend'e özel olarak izin ver
    allow_credentials=True,
    allow_methods=["*"],  # Tüm HTTP metodlarına izin ver
    allow_headers=["*"],  # Tüm headerlara izin ver
)

# Dashboard API router'ını ekle
app.include_router(dashboard_router, tags=["Dashboard"])

# --- Webhook Handler ---
@app.post("/webhook/optimization")
async def webhook_handler(request: Request):
    """
    n8n'den gelen webhook isteklerini işler.
    URL parametreleri:
    - veriSeti: Hangi veri setinin kullanılacağı (hastane, cagri_merkezi)
    - kurallar: Hangi konfigürasyon dosyasının kullanılacağı
    """
    try:
        # URL parametrelerini al
        params = dict(request.query_params)
        logger.info(f"Webhook isteği alındı. Parametreler: {params}")

        # Body'yi al
        body = await request.json()
        logger.info(f"Webhook body: {body}")

        # Veri seti tipini belirle
        veri_seti = params.get("veriSeti", "")
        dataset_type = "Hastane" if veri_seti.lower() == "hastane" else "Çağrı Merkezi"

        # Aktivite log dosyasına kayıt ekle
        log_optimization_activity(dataset_type, "WEBHOOK_RECEIVED")

        # İşlem başarılı mesajı döndür
        return {"status": "success", "message": f"{dataset_type} veri seti için webhook isteği alındı"}
    except Exception as e:
        logger.error(f"Webhook işlenirken hata: {e}", exc_info=True)
        return {"status": "error", "message": str(e)}

# --- Hata Yönetimi (Validation Errors için) ---
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Girdi verisi validasyon hatası: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )

# --- Konfigürasyon Yükleme (İyileştirilmiş) ---
CONFIG_DIR = "configs" # Proje kök dizinindeki konfig klasörü

def load_config(config_ref: Optional[str], config_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Konfigürasyon verisini yükler (öncelik: doğrudan veri, sonra dosya)."""
    if config_data:
        logger.info("Doğrudan gönderilen konfigürasyon kullanılıyor.")
        return config_data
    elif config_ref:
        # Proje kök dizinine göre yolu oluştur
        # Not: Bu API'nin proje kök dizininden çalıştırıldığı varsayılır.
        script_dir = os.path.dirname(os.path.dirname(__file__)) # optimization_core -> proje_koku
        if not script_dir: # Eğer doğrudan çalıştırılıyorsa (örn. main.py)
             script_dir = "." # Geçerli dizin proje kökü olsun
        config_path = os.path.join(script_dir, CONFIG_DIR, config_ref)
        logger.info(f"Konfigürasyon dosyası yükleniyor: {config_path}")
        if not os.path.exists(config_path):
             # Alternatif olarak sadece config_ref'i dene (eğer mutlak yol ise)
             if os.path.exists(config_ref):
                  config_path = config_ref
             else:
                  logger.error(f"Konfigürasyon dosyası bulunamadı: {config_path} veya {config_ref}")
                  raise HTTPException(status_code=400, detail=f"Configuration file not found: {config_ref}")

        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                loaded_config = yaml.safe_load(f)
                if loaded_config is None: # Boş dosya durumu
                     logger.warning(f"Konfigürasyon dosyası boş: {config_path}")
                     return {}
                return loaded_config
        except yaml.YAMLError as e:
            logger.error(f"Konfigürasyon dosyası YAML format hatası: {e}")
            raise HTTPException(status_code=500, detail=f"Error parsing configuration file YAML: {e}")
        except Exception as e:
            logger.error(f"Konfigürasyon dosyası okunurken hata: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Error reading configuration file: {e}")
    else:
        logger.warning("Konfigürasyon bilgisi sağlanmadı. Varsayılanlar kullanılacak (eğer modelde tanımlıysa).")
        return {} # Veya varsayılan bir konfig dön

# --- Ana Optimizasyon Endpoint'i ---
@app.post("/optimize", response_model=OptimizationResponse)
async def run_optimization(request_data: OptimizationRequest = Body(...)):
    """
    Gelen veriyi ve konfigürasyonu alır, optimizasyonu çalıştırır
    ve sonucu döner.
    """
    start_time = time.time()
    logger.info("Optimizasyon isteği alındı.")

    # 1. Konfigürasyonu Yükle
    try:
        config = load_config(request_data.configuration_ref, request_data.configuration)
        logger.info(f"Yüklenen konfigürasyon anahtarları: {list(config.keys())}")
    except HTTPException as http_exc:
        logger.error(f"Konfigürasyon yükleme hatası: {http_exc.detail}")
        raise http_exc # Hatayı tekrar yükselt FastAPI halletsin
    except Exception as e:
        logger.error(f"Konfigürasyon yüklenirken beklenmedik hata: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal error loading configuration.")

    # 2. Girdi Verisini Al (Pydantic zaten doğruladı)
    input_data = request_data.input_data
    logger.info(f"Alınan çalışan sayısı: {len(input_data.employees)}")
    logger.info(f"Alınan vardiya sayısı: {len(input_data.shifts)}")
    logger.info(f"Alınan yetenek kaydı sayısı: {len(input_data.skills)}")
    logger.info(f"Alınan uygunluk kaydı sayısı: {len(input_data.availability)}")
    logger.info(f"Alınan tercih kaydı sayısı: {len(input_data.preferences)}")


    # 3. Optimizasyon Mantığını Çalıştır
    logger.info("CP-SAT modeli oluşturuluyor ve çözülüyor...")
    try:
        # ShiftSchedulingModelBuilder sınıfını kullanarak modeli oluştur
        # input_data'yı dict olarak gönderelim, builder tarafı daha kolay işler
        model_builder = ShiftSchedulingModelBuilder(
            config=config,
            input_data=input_data.model_dump() # Pydantic modellerini dict'e çevir
        )

        # Modeli oluştur
        model_builder.build_model()

        # Modeli çöz (thread havuzunda)
        status, result = await run_in_threadpool(model_builder.solve_model)

        # Sonuçları API yanıtına dönüştür
        solution_data = None
        if result.get('solution') and result['solution'].get('assignments'):
            try:
                 # Gelen assignments listesini Pydantic modeli ile doğrula/dönüştür
                 validated_assignments = [Assignment(**a) for a in result['solution']['assignments']]
                 solution_data = OptimizationSolution(assignments=validated_assignments)
            except ValidationError as e:
                 logger.error(f"Çözüm (assignments) validasyon hatası: {e}")
                 # Çözümü gönderme ama hata verme, log yeterli
                 solution_data = None

        # +++ Metrikleri Ayıkla ve Hazırla +++
        metrics_data = None
        if status in ["OPTIMAL", "FEASIBLE"] and result.get('metrics'):
            try:
                # Hesaplanan metrikleri alıp Pydantic modeline dönüştür
                metrics_data = MetricsOutput(
                    # Operasyonel Metrikler
                    total_understaffing=result['metrics'].get('total_understaffing'),
                    total_overstaffing=result['metrics'].get('total_overstaffing'),
                    min_staffing_coverage_ratio=result['metrics'].get('min_staffing_coverage_ratio'),
                    skill_coverage_ratio=result['metrics'].get('skill_coverage_ratio'),

                    # Çalışan Memnuniyeti Metrikleri
                    positive_preferences_met_count=result['metrics'].get('positive_preferences_met_count'),
                    negative_preferences_assigned_count=result['metrics'].get('negative_preferences_assigned_count'),
                    total_preference_score_achieved=result['metrics'].get('total_preference_score_achieved'),
                    total_positive_preferences_count=result['metrics'].get('total_positive_preferences_count'),
                    total_negative_preferences_count=result['metrics'].get('total_negative_preferences_count'),

                    # Adalet Metrikleri
                    workload_distribution_std_dev=result['metrics'].get('workload_distribution_std_dev'),
                    bad_shift_distribution_std_dev=result['metrics'].get('bad_shift_distribution_std_dev'),

                    # Sistem Esnekliği ve Uyarlanabilirlik Metrikleri
                    system_adaptability_score=result['metrics'].get('system_adaptability_score'),
                    config_complexity_score=result['metrics'].get('config_complexity_score'),
                    rule_count=result['metrics'].get('rule_count')
                )
                # Log mesajını da güncelleyelim
                metric_log_parts = [
                    f"Understaffing={metrics_data.total_understaffing}",
                    f"Overstaffing={metrics_data.total_overstaffing}",
                    f"Min Personel Karşılama Oranı={metrics_data.min_staffing_coverage_ratio:.2f}" if metrics_data.min_staffing_coverage_ratio is not None else None,
                    f"Yetenek Karşılama Oranı={metrics_data.skill_coverage_ratio:.2f}" if metrics_data.skill_coverage_ratio is not None else None,
                    f"Pozitif Tercih Sayısı={metrics_data.positive_preferences_met_count}",
                    f"Toplam Pozitif Tercih Sayısı={metrics_data.total_positive_preferences_count}",
                    f"Negatif Tercih Sayısı={metrics_data.negative_preferences_assigned_count}",
                    f"Toplam Negatif Tercih Sayısı={metrics_data.total_negative_preferences_count}",
                    f"Toplam Tercih Skoru={metrics_data.total_preference_score_achieved}",
                    f"İş Yükü Dağılımı StdDev={metrics_data.workload_distribution_std_dev:.2f}" if metrics_data.workload_distribution_std_dev is not None else None,
                    f"Kötü Vardiya Dağılımı StdDev={metrics_data.bad_shift_distribution_std_dev:.2f}" if metrics_data.bad_shift_distribution_std_dev is not None else None,
                    f"Sistem Uyarlanabilirlik Skoru={metrics_data.system_adaptability_score:.2f}" if metrics_data.system_adaptability_score is not None else None,
                    f"Konfigürasyon Karmaşıklık Skoru={metrics_data.config_complexity_score:.2f}" if metrics_data.config_complexity_score is not None else None,
                    f"Kural Sayısı={metrics_data.rule_count}" if metrics_data.rule_count is not None else None
                ]
                logger.info(f"Hesaplanan Metrikler: {', '.join(part for part in metric_log_parts if part)}")
            except Exception as e:
                logger.error(f"Metrikler işlenirken hata: {e}", exc_info=True)
                metrics_data = None # Hata durumunda metrikleri gönderme


        response = OptimizationResponse(
            status=status,
            solver_status_message=result.get('solver_status_message'),
            processing_time_seconds=result.get('processing_time_seconds'),
            objective_value=result.get('objective_value'),
            solution=solution_data,
            metrics=metrics_data # +++ Metrikleri yanıta ekle +++
        )

        # Sonuçları optimization_result.json dosyasına kaydet
        try:
            script_dir = os.path.dirname(os.path.dirname(__file__))
            result_path = os.path.join(script_dir, "optimization_result.json")
            with open(result_path, 'w', encoding='utf-8') as f:
                json.dump(response.model_dump(), f, indent=2, ensure_ascii=False)
            logger.info(f"Optimizasyon sonuçları {result_path} dosyasına kaydedildi.")

            # Aktivite log dosyasına kayıt ekle
            try:
                # Veri seti tipini belirle
                dataset_type = ""

                # Webhook parametrelerinden veri seti tipini belirle
                # request değişkeni tanımlı olmadığı için bu kısmı atlıyoruz

                # Eğer bulunamadıysa, input_data'dan kontrol et
                if not dataset_type and isinstance(input_data, dict):
                    # Önce veriSeti parametresini kontrol et
                    if "veriSeti" in input_data:
                        veri_seti = input_data.get("veriSeti", "")
                        if veri_seti:
                            dataset_type = "Hastane" if veri_seti.lower() == "hastane" else "Çağrı Merkezi"
                            logger.info(f"Input data'dan veriSeti parametresi ile veri seti tipi belirlendi: {dataset_type}")

                    # Eğer hala bulunamadıysa, institution_id parametresini kontrol et
                    elif "institution_id" in input_data:
                        institution_id = input_data.get("institution_id", "")
                        if institution_id:
                            dataset_type = "Hastane" if "hospital" in institution_id.lower() else "Çağrı Merkezi"
                            logger.info(f"Input data'dan institution_id parametresi ile veri seti tipi belirlendi: {dataset_type}")

                # Eğer hala bulunamadıysa, response'dan kontrol et
                if not dataset_type:
                    response_dict = response.model_dump()
                    if "institution_id" in response_dict:
                        institution_id = response_dict.get("institution_id", "")
                        if institution_id:
                            dataset_type = "Hastane" if "hospital" in institution_id.lower() else "Çağrı Merkezi"
                            logger.info(f"Response'dan institution_id parametresi ile veri seti tipi belirlendi: {dataset_type}")

                # Eğer hala bulunamadıysa, konfigürasyon dosyasından tahmin et
                if not dataset_type and "configuration_ref" in response_dict:
                    config_ref = response_dict.get("configuration_ref", "")
                    if config_ref:
                        dataset_type = "Hastane" if "hospital" in config_ref.lower() else "Çağrı Merkezi"
                        logger.info(f"Konfigürasyon dosyasından veri seti tipi tahmin edildi: {dataset_type}")

                # Eğer hala bulunamadıysa, varsayılan olarak "Bilinmeyen" kullan
                if not dataset_type:
                    dataset_type = "Bilinmeyen"
                    logger.warning("Veri seti tipi belirlenemedi, varsayılan olarak 'Bilinmeyen' kullanılıyor.")

                logger.info(f"Aktivite kaydı için veri seti tipi: {dataset_type}")
                log_optimization_activity(dataset_type, status)
            except Exception as log_error:
                logger.error(f"Aktivite log kaydı oluşturulurken hata: {log_error}", exc_info=True)
        except Exception as e:
            logger.error(f"Sonuçlar dosyaya kaydedilirken hata: {e}", exc_info=True)

        logger.info(f"Optimizasyon tamamlandı. Durum: {status}, İşlem Süresi: {result.get('processing_time_seconds'):.2f}s")

    except Exception as e:
        logger.error(f"Optimizasyon sırasında kritik hata: {e}", exc_info=True)

        # Hata durumunda da sonuçları dosyaya kaydet
        try:
            error_response = OptimizationResponse(
                status="ERROR",
                solver_status_message=None,
                processing_time_seconds=None,
                objective_value=None,
                solution=None,
                metrics=None,
                error_details=str(e)
            )
            script_dir = os.path.dirname(os.path.dirname(__file__))
            result_path = os.path.join(script_dir, "optimization_result.json")
            with open(result_path, 'w', encoding='utf-8') as f:
                json.dump(error_response.model_dump(), f, indent=2, ensure_ascii=False)
            logger.info(f"Hata durumu optimization_result.json dosyasına kaydedildi.")
        except Exception as save_error:
            logger.error(f"Hata durumu dosyaya kaydedilirken ikincil hata: {save_error}", exc_info=True)

        # Hata durumunda istemciye detaylı hata mesajı gönderme (güvenlik)
        # Sadece genel bir hata mesajı ve loglarda detay kalsın
        raise HTTPException(status_code=500, detail="An internal error occurred during optimization.")


    end_time = time.time()
    total_api_time = end_time - start_time
    logger.info(f"Optimizasyon isteği tamamlandı. Toplam API süresi: {total_api_time:.2f}s")
    return response

# --- API Endpoints ---
@app.get("/api/results")
async def get_results():
    """Optimizasyon sonuçlarını döndürür."""
    try:
        # Optimizasyon sonuçlarını yükle
        result_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "optimization_result.json")
        logger.info(f"Optimizasyon sonuçları okunuyor: {result_path}")

        if not os.path.exists(result_path):
            logger.error(f"Optimizasyon sonuç dosyası bulunamadı: {result_path}")
            raise HTTPException(status_code=404, detail="Optimizasyon sonuçları bulunamadı. Lütfen önce bir optimizasyon çalıştırın.")

        # JSON dosyasını oku
        with open(result_path, 'r', encoding='utf-8') as f:
            optimization_result = json.load(f)

        # Çalışan isimlerini ekle
        if optimization_result.get("solution") and optimization_result["solution"].get("assignments"):
            # Veri setini belirle
            dataset_type = "cagri_merkezi" if optimization_result["solution"]["assignments"][0]["employee_id"].startswith("CM_") else "hastane"

            try:
                # Çalışan verilerini oku
                employees_path = os.path.join(os.path.dirname(os.path.dirname(__file__)),
                                             "synthetic_data_cagri_merkezi/employees_cm.csv" if dataset_type == "cagri_merkezi" else "synthetic_data/employees.csv")

                if os.path.exists(employees_path):
                    import pandas as pd
                    employees_df = pd.read_csv(employees_path)
                    employees_dict = {row["employee_id"]: row["name"] for _, row in employees_df.iterrows()}

                    # Atamalara çalışan isimlerini ekle
                    for assignment in optimization_result["solution"]["assignments"]:
                        employee_id = assignment["employee_id"]
                        if employee_id in employees_dict:
                            assignment["employee_name"] = employees_dict[employee_id]
                        else:
                            # Eğer çalışan bulunamazsa, ID'den bir isim oluştur
                            assignment["employee_name"] = f"Çalışan {employee_id.replace('CM_E', '').replace('E', '')}"
                else:
                    logger.warning(f"Çalışan verileri dosyası bulunamadı: {employees_path}")
            except Exception as e:
                logger.error(f"Çalışan isimleri eklenirken hata: {e}")

        return optimization_result
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"Optimizasyon sonuçlarını okurken hata: {e}")
        raise HTTPException(status_code=500, detail=f"Optimizasyon sonuçlarını okurken hata: {str(e)}")

@app.get("/api/shifts")
async def get_shifts(datasetType: str = Query(..., description="Veri seti tipi (hastane veya cagri_merkezi)")):
    """Vardiya verilerini döndürür."""
    try:
        # Veri setine göre dosya yolunu belirle
        file_path = "synthetic_data/shifts.csv" if datasetType == "hastane" else "synthetic_data_cagri_merkezi/shifts_cm.csv"

        # CSV dosyasını oku
        import pandas as pd
        shifts_df = pd.read_csv(file_path)

        # JSON formatına dönüştür
        shifts_list = shifts_df.to_dict(orient="records")

        return shifts_list
    except Exception as e:
        logger.error(f"Vardiya verilerini okurken hata: {e}")
        raise HTTPException(status_code=500, detail=f"Vardiya verilerini okurken hata: {str(e)}")

@app.get("/api/employees")
async def get_employees(datasetType: str = Query(..., description="Veri seti tipi (hastane veya cagri_merkezi)")):
    """Çalışan verilerini döndürür."""
    try:
        # Veri setine göre dosya yolunu belirle
        file_path = "synthetic_data/employees.csv" if datasetType == "hastane" else "synthetic_data_cagri_merkezi/employees_cm.csv"

        logger.info(f"Çalışan verileri okunuyor: {file_path}")

        # Dosyanın varlığını kontrol et
        if not os.path.exists(file_path):
            logger.error(f"Dosya bulunamadı: {file_path}")
            # Proje kök dizinine göre yolu oluştur
            script_dir = os.path.dirname(os.path.dirname(__file__))
            file_path = os.path.join(script_dir, file_path)
            logger.info(f"Alternatif dosya yolu deneniyor: {file_path}")

            if not os.path.exists(file_path):
                logger.error(f"Alternatif dosya yolu da bulunamadı: {file_path}")
                raise HTTPException(status_code=404, detail=f"Çalışan verileri dosyası bulunamadı: {file_path}")

        # CSV dosyasını oku
        import pandas as pd
        employees_df = pd.read_csv(file_path)

        # JSON formatına dönüştür
        employees_list = employees_df.to_dict(orient="records")

        logger.info(f"Toplam {len(employees_list)} çalışan verisi okundu.")
        return employees_list
    except Exception as e:
        logger.error(f"Çalışan verilerini okurken hata: {e}")
        raise HTTPException(status_code=500, detail=f"Çalışan verilerini okurken hata: {str(e)}")

# Uygulamayı çalıştırmak için (terminalden):
# uvicorn optimization_core.main:app --reload --port 8000

if __name__ == "__main__":
    # Bu kısım genellikle doğrudan çalıştırılmaz, uvicorn kullanılır.
    import uvicorn
    logger.info("API'yi başlatmak için terminalde şunu çalıştırın:")
    logger.info("uvicorn optimization_core.main:app --reload --port 8000")
    # Örnek çalıştırma (debug için):
    # uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)