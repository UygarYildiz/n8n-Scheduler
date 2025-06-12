# Database connection ve SQLAlchemy modelleri
import os
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON, Enum, DECIMAL, BigInteger
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum

# Database URL
DATABASE_URL = "mysql+mysqlconnector://optimization_user:optimization_pass_2024@localhost:3306/optimization_db?charset=utf8mb4"

# SQLAlchemy setup
engine = create_engine(
    DATABASE_URL, 
    echo=False,
    connect_args={
        "charset": "utf8mb4",
        "use_unicode": True
    }
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Enum'lar
class OrganizationType(str, enum.Enum):
    hastane = "hastane"
    cagri_merkezi = "cagri_merkezi"
    diger = "diger"

class AuditAction(str, enum.Enum):
    # Authentication actions
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILED = "login_failed"
    LOGOUT = "logout"
    LOGOUT_ALL = "logout_all"
    SESSION_REVOKED = "session_revoked"
    
    # User management actions
    USER_CREATED = "user_created"
    USER_UPDATED = "user_updated"
    USER_DELETED = "user_deleted"
    USER_STATUS_CHANGED = "user_status_changed"
    
    # System actions
    PASSWORD_CHANGED = "password_changed"
    PROFILE_UPDATED = "profile_updated"
    ADMIN_ACCESS = "admin_access"

# SQLAlchemy Modelleri
class Organization(Base):
    __tablename__ = "organizations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, nullable=False)
    type = Column(Enum(OrganizationType), nullable=False)
    description = Column(Text)
    config_file = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # İlişkiler
    users = relationship("User", back_populates="organization")
    optimization_results = relationship("OptimizationResult", back_populates="organization")
    uploaded_datasets = relationship("UploadedDataset", back_populates="organization")
    optimization_comparisons = relationship("OptimizationComparison", back_populates="organization")

class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    display_name = Column(String(255), nullable=False)
    description = Column(Text)
    permissions = Column(JSON)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # İlişkiler
    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    role_id = Column(Integer, ForeignKey("roles.id"))
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # İlişkiler
    organization = relationship("Organization", back_populates="users")
    role = relationship("Role", back_populates="users")
    sessions = relationship("UserSession", back_populates="user")
    optimization_results = relationship("OptimizationResult", back_populates="user")
    uploaded_datasets = relationship("UploadedDataset", back_populates="user")
    optimization_comparisons = relationship("OptimizationComparison", back_populates="user")

class UserSession(Base):
    __tablename__ = "user_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token_jti = Column(String(255), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_revoked = Column(Boolean, default=False)
    
    # İlişkiler
    user = relationship("User", back_populates="sessions")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    action = Column(Enum(AuditAction), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Nullable for failed logins
    target_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # For admin actions on other users
    description = Column(Text, nullable=False)
    details = Column(JSON, nullable=True)  # Additional structured data
    ip_address = Column(String(45), nullable=True)  # IPv4/IPv6 support
    user_agent = Column(Text, nullable=True)
    success = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # İlişkiler
    user = relationship("User", foreign_keys=[user_id])
    target_user = relationship("User", foreign_keys=[target_user_id])

# Optimization Results Model
class OptimizationResult(Base):
    __tablename__ = "optimization_results"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"))
    input_parameters = Column(JSON, comment="Optimization giriş parametreleri")
    solution_data = Column(JSON, comment="Çözüm atamaları ve detayları")
    metrics = Column(JSON, comment="Performans metrikleri")
    status = Column(Enum("RUNNING", "OPTIMAL", "INFEASIBLE", "ERROR", "TIMEOUT", name="optimization_status"), 
                   default="RUNNING")
    solver_status_message = Column(Text, comment="Solver durum mesajı")
    processing_time_seconds = Column(DECIMAL(10, 6), comment="İşlem süresi saniye")
    objective_value = Column(DECIMAL(15, 6), comment="Amaç fonksiyonu değeri")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # İlişkiler
    user = relationship("User", back_populates="optimization_results")
    organization = relationship("Organization", back_populates="optimization_results")

# Dataset Upload Tracking Model
class UploadedDataset(Base):
    __tablename__ = "uploaded_datasets"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"))
    filename = Column(String(255), nullable=False, comment="Yüklenen dosya adı")
    file_path = Column(String(500), comment="Dosya saklama yolu")
    file_type = Column(Enum("employees", "shifts", "preferences", "rules", "skills", "other", 
                           name="dataset_file_type"), nullable=False)
    file_size = Column(BigInteger, comment="Dosya boyutu byte")
    mime_type = Column(String(100), comment="MIME tipi")
    validation_results = Column(JSON, comment="Dosya doğrulama sonuçları")
    status = Column(Enum("UPLOADED", "VALIDATED", "PROCESSING", "READY", "ERROR", 
                        name="dataset_status"), default="UPLOADED")
    error_message = Column(Text, comment="Hata durumunda detay mesaj")
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), comment="İşlenme zamanı")
    
    # İlişkiler
    user = relationship("User", back_populates="uploaded_datasets")
    organization = relationship("Organization", back_populates="uploaded_datasets")

# Optimization Comparison Model
class OptimizationComparison(Base):
    __tablename__ = "optimization_comparisons"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id", ondelete="SET NULL"))
    comparison_name = Column(String(255), comment="Karşılaştırma başlığı")
    algorithm_results = Column(JSON, comment="Farklı algoritma sonuçları")
    comparison_metrics = Column(JSON, comment="Algoritma karşılaştırma metrikleri")
    test_configuration = Column(JSON, comment="Test konfigürasyonu ve parametreler")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # İlişkiler
    user = relationship("User", back_populates="optimization_comparisons")
    organization = relationship("Organization", back_populates="optimization_comparisons")

# Database session dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Database connection test
def test_connection():
    try:
        from sqlalchemy import text
        db = SessionLocal()
        result = db.execute(text("SELECT 1"))
        db.close()
        return True
    except Exception as e:
        print(f"Database connection error: {e}")
        return False 