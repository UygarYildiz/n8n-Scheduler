# Authentication utilities
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import uuid
import os
import sys

# Current directory'yi sys.path'e ekle
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from sqlalchemy.orm import Session
try:
    from database import User, UserSession, Role, Organization
    print("✅ Auth utils database modülü yüklendi!")
except ImportError as e:
    print(f"❌ Auth utils database import hatası: {e}")
    # Dummy classes
    class User:
        pass
    class UserSession:
        pass
    class Role:
        pass
    class Organization:
        pass

# JWT ayarları
SECRET_KEY = "bitirme_projesi_jwt_secret_key_2024_very_secure"  # Üretimde environment variable olmalı
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 saat

def hash_password(password: str) -> str:
    """Şifreyi hash'ler"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Şifreyi doğrular"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """JWT access token oluşturur"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # JWT claims
    jti = str(uuid.uuid4())  # Unique token ID
    to_encode.update({
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "jti": jti
    })
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt, jti, expire

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """JWT token'ı doğrular ve payload'ı döner"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.PyJWTError:
        return None

def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """Kullanıcı kimlik doğrulaması yapar"""
    user = db.query(User).filter(User.username == username, User.is_active == True).first()
    if not user:
        return None
    
    if not verify_password(password, user.password_hash):
        return None
    
    return user

def get_user_by_token(db: Session, token: str) -> Optional[User]:
    """Token'dan kullanıcıyı getirir"""
    payload = verify_token(token)
    if not payload:
        return None
    
    user_id = payload.get("user_id")
    jti = payload.get("jti")
    
    if not user_id or not jti:
        return None
    
    # Token'ın revoke edilip edilmediğini kontrol et
    session = db.query(UserSession).filter(
        UserSession.token_jti == jti,
        UserSession.is_revoked == False,
        UserSession.expires_at > datetime.now(timezone.utc)
    ).first()
    
    if not session:
        return None
    
    # Kullanıcıyı getir
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    return user

def create_user_session(db: Session, user_id: int, token_jti: str, expires_at: datetime):
    """Kullanıcı oturumu oluşturur"""
    session = UserSession(
        user_id=user_id,
        token_jti=token_jti,
        expires_at=expires_at
    )
    db.add(session)
    db.commit()
    return session

def revoke_user_session(db: Session, token_jti: str):
    """Kullanıcı oturumunu iptal eder"""
    session = db.query(UserSession).filter(UserSession.token_jti == token_jti).first()
    if session:
        session.is_revoked = True
        db.commit()
    return session

def revoke_all_user_sessions(db: Session, user_id: int):
    """Kullanıcının tüm oturumlarını iptal eder"""
    sessions = db.query(UserSession).filter(
        UserSession.user_id == user_id,
        UserSession.is_revoked == False
    ).all()
    
    for session in sessions:
        session.is_revoked = True
    
    db.commit()
    return len(sessions)

def check_permission(user: User, required_permission: str) -> bool:
    """Kullanıcının belirli bir yetkiye sahip olup olmadığını kontrol eder"""
    if not user or not user.role:
        return False
    
    permissions = user.role.permissions or []
    
    # Süper admin her şeyi yapabilir
    if "*" in permissions:
        return True
    
    # Tam eşleşme
    if required_permission in permissions:
        return True
    
    # Wildcard eşleşme (örn: "org.*" -> "org.read")
    for perm in permissions:
        if perm.endswith(".*"):
            prefix = perm[:-2]
            if required_permission.startswith(prefix + "."):
                return True
    
    return False

def get_user_info(user: User) -> Dict[str, Any]:
    """Kullanıcı bilgilerini döner (şifre hariç)"""
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "full_name": f"{user.first_name} {user.last_name}",
        "organization": {
            "id": user.organization.id,
            "name": user.organization.name,
            "type": user.organization.type,
            "config_file": user.organization.config_file
        } if user.organization else None,
        "role": {
            "id": user.role.id,
            "name": user.role.name,
            "display_name": user.role.display_name,
            "permissions": user.role.permissions
        } if user.role else None,
        "is_active": user.is_active,
        "last_login": user.last_login.isoformat() if user.last_login else None,
        "created_at": user.created_at.isoformat() if user.created_at else None
    } 