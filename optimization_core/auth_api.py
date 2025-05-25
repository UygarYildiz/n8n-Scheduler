# Authentication API endpoints
from fastapi import APIRouter, Depends, HTTPException, status, Form, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime, timezone, timedelta

import os
import sys

# Current directory'yi sys.path'e ekle
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

try:
    from database import get_db, User, Role, Organization, UserSession
    from auth_utils import (
        authenticate_user, create_access_token, get_user_by_token, 
        create_user_session, revoke_user_session, revoke_all_user_sessions,
        check_permission, get_user_info, hash_password, verify_token
    )
    from auth_middleware import get_current_active_user, get_admin_user, get_super_admin_user
    print("✅ Auth modülü bağımlılıkları başarıyla yüklendi!")
except ImportError as e:
    print(f"❌ Auth modülü bağımlılık hatası: {e}")
    # Minimal dummy implementations
    def get_db():
        yield None
    
    class User:
        pass
    
    class Role:
        pass
    
    class Organization:
        pass
    
    def authenticate_user(*args, **kwargs):
        return None
    
    def create_access_token(*args, **kwargs):
        return "dummy_token", "dummy_jti", None
    
    def get_user_by_token(*args, **kwargs):
        return None
    
    def create_user_session(*args, **kwargs):
        pass
    
    def revoke_user_session(*args, **kwargs):
        pass
    
    def revoke_all_user_sessions(*args, **kwargs):
        return 0
    
    def check_permission(*args, **kwargs):
        return False
    
    def get_user_info(*args, **kwargs):
        return {}
    
    def hash_password(*args, **kwargs):
        return "dummy_hash"
    
    def verify_token(*args, **kwargs):
        return None

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()

# Pydantic modelleri
class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Dict[str, Any]

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    organization_id: Optional[int] = None
    role_id: Optional[int] = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    first_name: str
    last_name: str
    full_name: str
    organization: Optional[Dict[str, Any]] = None
    role: Optional[Dict[str, Any]] = None
    is_active: bool
    last_login: Optional[str] = None
    created_at: Optional[str] = None

class MessageResponse(BaseModel):
    message: str
    success: bool = True

# Dependency: Current user
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Mevcut kullanıcıyı token'dan getirir"""
    token = credentials.credentials
    user = get_user_by_token(db, token)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

# Dependency: Active user check
async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Aktif kullanıcıyı getirir"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user

# Dependency: Admin user check
async def get_admin_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Admin yetkisi olan kullanıcıyı getirir"""
    if not current_user.role or current_user.role.name not in ['super_admin', 'org_admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user

# Dependency: Permission check
def require_permission(permission: str):
    """Belirli bir yetki gerektiren endpoint'ler için decorator"""
    def permission_checker(current_user: User = Depends(get_current_user)):
        if not check_permission(current_user, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required: {permission}"
            )
        return current_user
    return permission_checker

# Authentication endpoints
@router.post("/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """Kullanıcı girişi"""
    user = authenticate_user(db, login_data.username, login_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Token oluştur
    token_data = {
        "user_id": user.id,
        "username": user.username,
        "organization_id": user.organization_id,
        "role_id": user.role_id
    }
    
    access_token, jti, expires_at = create_access_token(token_data)
    
    # Eski session'ları temizle (kullanıcı başına max 2 session)
    existing_sessions = db.query(UserSession).filter(
        UserSession.user_id == user.id,
        UserSession.is_revoked == False,
        UserSession.expires_at > datetime.now(timezone.utc)
    ).order_by(UserSession.created_at.desc()).all()
    
    # 2'den fazla aktif session varsa eski olanları revoke et
    if len(existing_sessions) >= 2:
        for old_session in existing_sessions[1:]:  # İlk 1'i bırak, geri kalanını sil
            old_session.is_revoked = True
        db.commit()
    
    # Yeni session kaydet
    create_user_session(db, user.id, jti, expires_at)
    
    # Last login güncelle
    user.last_login = datetime.now(timezone.utc)
    db.commit()
    
    return LoginResponse(
        access_token=access_token,
        expires_in=60 * 24 * 60,  # 24 saat (saniye cinsinden)
        user=get_user_info(user)
    )

@router.post("/logout", response_model=MessageResponse)
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Kullanıcı çıkışı"""
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload and payload.get("jti"):
        revoke_user_session(db, payload["jti"])
    
    return MessageResponse(message="Successfully logged out")

@router.post("/logout-all", response_model=MessageResponse)
async def logout_all(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Kullanıcının tüm oturumlarını sonlandır"""
    revoked_count = revoke_all_user_sessions(db, current_user.id)
    
    return MessageResponse(
        message=f"Successfully logged out from {revoked_count} sessions"
    )

@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_active_user)):
    """Mevcut kullanıcının profil bilgileri"""
    return UserResponse(**get_user_info(current_user))

@router.post("/register", response_model=UserResponse)
async def register(
    register_data: RegisterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Yeni kullanıcı kaydı (sadece yetkili kullanıcılar)"""
    
    # Username ve email kontrolü
    existing_user = db.query(User).filter(
        (User.username == register_data.username) | 
        (User.email == register_data.email)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )
    
    # Organization kontrolü
    if register_data.organization_id:
        org = db.query(Organization).filter(Organization.id == register_data.organization_id).first()
        if not org:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organization not found"
            )
    
    # Role kontrolü
    if register_data.role_id:
        role = db.query(Role).filter(Role.id == register_data.role_id).first()
        if not role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role not found"
            )
    
    # Yeni kullanıcı oluştur
    hashed_password = hash_password(register_data.password)
    
    new_user = User(
        username=register_data.username,
        email=register_data.email,
        password_hash=hashed_password,
        first_name=register_data.first_name,
        last_name=register_data.last_name,
        organization_id=register_data.organization_id,
        role_id=register_data.role_id
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return UserResponse(**get_user_info(new_user))

@router.get("/organizations")
async def get_organizations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Organizasyonları listele"""
    organizations = db.query(Organization).filter(Organization.is_active == True).all()
    
    return [
        {
            "id": org.id,
            "name": org.name,
            "type": org.type,
            "description": org.description
        }
        for org in organizations
    ]

@router.get("/roles")
async def get_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Rolleri listele"""
    roles = db.query(Role).filter(Role.is_active == True).all()
    
    return [
        {
            "id": role.id,
            "name": role.name,
            "display_name": role.display_name,
            "description": role.description,
            "permissions": role.permissions
        }
        for role in roles
    ]

# Session Management Endpoints
@router.get("/sessions")
async def get_user_sessions(
    user_id: Optional[int] = Query(None, description="Specific user ID (admin only)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Kullanıcı oturumlarını listele"""
    
    # Eğer user_id belirtilmişse, admin yetkisi gerekli
    if user_id and user_id != current_user.id:
        if not current_user.role or current_user.role.name not in ['super_admin', 'org_admin']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin privileges required to view other users' sessions"
            )
        target_user_id = user_id
    else:
        target_user_id = current_user.id
    
    # Aktif oturumları getir
    sessions = db.query(UserSession).filter(
        UserSession.user_id == target_user_id,
        UserSession.is_revoked == False,
        UserSession.expires_at > datetime.now(timezone.utc)
    ).order_by(UserSession.created_at.desc()).all()
    
    session_list = []
    for session in sessions:
        # Token payload'ını decode et
        try:
            # Session'ın user bilgilerini al
            user = db.query(User).filter(User.id == session.user_id).first()
            
            session_info = {
                "id": session.id,
                "token_jti": session.token_jti,
                "user_id": session.user_id,
                "username": user.username if user else "Unknown",
                "created_at": session.created_at.replace(tzinfo=timezone.utc).isoformat(),
                "expires_at": session.expires_at.replace(tzinfo=timezone.utc).isoformat(),
                "is_current": False,  # Bu bilgiyi token'dan alacağız
                "user_agent": None,  # Gelecekte eklenebilir
                "ip_address": None   # Gelecekte eklenebilir
            }
            session_list.append(session_info)
        except Exception as e:
            continue
    
    return {
        "sessions": session_list,
        "total_count": len(session_list),
        "user_id": target_user_id
    }

@router.get("/sessions/all")
async def get_all_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Tüm aktif oturumları listele (sadece admin)"""
    
    # Tüm aktif oturumları getir
    sessions = db.query(UserSession).join(User).filter(
        UserSession.is_revoked == False,
        UserSession.expires_at > datetime.now(timezone.utc),
        User.is_active == True
    ).order_by(UserSession.created_at.desc()).all()
    
    session_list = []
    for session in sessions:
        user = session.user
        session_info = {
            "id": session.id,
            "token_jti": session.token_jti,
            "user_id": session.user_id,
            "username": user.username,
            "full_name": f"{user.first_name} {user.last_name}",
            "organization": user.organization.name if user.organization else None,
            "role": user.role.display_name if user.role else None,
            "created_at": session.created_at.replace(tzinfo=timezone.utc).isoformat(),
            "expires_at": session.expires_at.replace(tzinfo=timezone.utc).isoformat(),
            "duration": str(datetime.now(timezone.utc) - session.created_at.replace(tzinfo=timezone.utc)),
            "user_agent": None,  # Gelecekte eklenebilir
            "ip_address": None   # Gelecekte eklenebilir
        }
        session_list.append(session_info)
    
    return {
        "sessions": session_list,
        "total_count": len(session_list),
        "active_users": len(set(s["user_id"] for s in session_list))
    }

@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Belirli bir oturumu sonlandır"""
    
    # Session'ı bul
    session = db.query(UserSession).filter(UserSession.id == session_id).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Yetki kontrolü: Kullanıcı kendi oturumunu veya admin başkasının oturumunu sonlandırabilir
    if session.user_id != current_user.id:
        if not current_user.role or current_user.role.name not in ['super_admin', 'org_admin']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only revoke your own sessions"
            )
    
    # Session'ı iptal et
    session.is_revoked = True
    db.commit()
    
    return MessageResponse(
        message=f"Session {session_id} successfully revoked"
    )

@router.delete("/sessions/user/{user_id}/all")
async def revoke_all_user_sessions_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Belirli bir kullanıcının tüm oturumlarını sonlandır (sadece admin)"""
    
    # Hedef kullanıcıyı kontrol et
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Tüm oturumları iptal et
    revoked_count = revoke_all_user_sessions(db, user_id)
    
    return MessageResponse(
        message=f"Successfully revoked {revoked_count} sessions for user {target_user.username}"
    )

@router.get("/sessions/stats")
async def get_session_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Oturum istatistikleri (sadece admin)"""
    
    # Aktif oturum sayısı
    active_sessions = db.query(UserSession).filter(
        UserSession.is_revoked == False,
        UserSession.expires_at > datetime.now(timezone.utc)
    ).count()
    
    # Aktif kullanıcı sayısı (benzersiz kullanıcı ID'leri)
    active_user_ids = db.query(UserSession.user_id).join(User).filter(
        UserSession.is_revoked == False,
        UserSession.expires_at > datetime.now(timezone.utc),
        User.is_active == True
    ).distinct().all()
    active_users = len(active_user_ids)
    
    # Bugün oluşturulan oturum sayısı
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_sessions = db.query(UserSession).filter(
        UserSession.created_at >= today_start
    ).count()
    
    # Süresi dolmuş oturum sayısı
    expired_sessions = db.query(UserSession).filter(
        UserSession.is_revoked == False,
        UserSession.expires_at <= datetime.now(timezone.utc)
    ).count()
    
    return {
        "active_sessions": active_sessions,
        "active_users": active_users,
        "today_sessions": today_sessions,
        "expired_sessions": expired_sessions,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# User Management Endpoints
@router.get("/users")
async def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Tüm kullanıcıları listele (sadece admin)"""
    
    users = db.query(User).options(
        joinedload(User.organization),
        joinedload(User.role)
    ).order_by(User.created_at.desc()).all()
    
    user_list = []
    for user in users:
        user_info = get_user_info(user)
        # Son giriş bilgisini ekle
        last_session = db.query(UserSession).filter(
            UserSession.user_id == user.id
        ).order_by(UserSession.created_at.desc()).first()
        
        user_info["last_session"] = last_session.created_at.isoformat() if last_session else None
        user_list.append(user_info)
    
    return {
        "users": user_list,
        "total_count": len(user_list),
        "active_count": len([u for u in user_list if u["is_active"]])
    }

@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    update_data: RegisterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Kullanıcı bilgilerini güncelle (sadece admin)"""
    
    # Kullanıcıyı bul
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Username ve email kontrolü (kendisi hariç)
    existing_user = db.query(User).filter(
        User.id != user_id,
        (User.username == update_data.username) | (User.email == update_data.email)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already exists"
        )
    
    # Organization kontrolü
    if update_data.organization_id:
        org = db.query(Organization).filter(Organization.id == update_data.organization_id).first()
        if not org:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organization not found"
            )
    
    # Role kontrolü
    if update_data.role_id:
        role = db.query(Role).filter(Role.id == update_data.role_id).first()
        if not role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role not found"
            )
    
    # Kullanıcı bilgilerini güncelle
    user.username = update_data.username
    user.email = update_data.email
    user.first_name = update_data.first_name
    user.last_name = update_data.last_name
    user.organization_id = update_data.organization_id
    user.role_id = update_data.role_id
    
    # Şifre güncellenecekse
    if update_data.password:
        user.password_hash = hash_password(update_data.password)
    
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    
    return UserResponse(**get_user_info(user))

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Kullanıcıyı sil (sadece admin)"""
    
    # Kullanıcıyı bul
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Kendi kendini silmeyi engelle
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    # Kullanıcının tüm oturumlarını iptal et
    revoke_all_user_sessions(db, user_id)
    
    # Kullanıcıyı sil (soft delete yerine hard delete)
    db.delete(user)
    db.commit()
    
    return MessageResponse(
        message=f"User {user.username} successfully deleted"
    )

@router.patch("/users/{user_id}/toggle-status")
async def toggle_user_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Kullanıcı durumunu aktif/pasif yap (sadece admin)"""
    
    # Kullanıcıyı bul
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Kendi kendini deaktive etmeyi engelle
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )
    
    # Durumu değiştir
    user.is_active = not user.is_active
    user.updated_at = datetime.now(timezone.utc)
    
    # Eğer deaktive ediliyorsa tüm oturumları iptal et
    if not user.is_active:
        revoke_all_user_sessions(db, user_id)
    
    db.commit()
    
    status_text = "activated" if user.is_active else "deactivated"
    return MessageResponse(
        message=f"User {user.username} successfully {status_text}"
    )

@router.get("/admin/stats")
async def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Admin dashboard istatistikleri"""
    
    # Kullanıcı istatistikleri
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    admin_users = db.query(User).join(Role).filter(
        Role.name.in_(['super_admin', 'org_admin'])
    ).count()
    
    # Rol dağılımı
    role_distribution = db.query(Role.display_name, func.count(User.id)).join(
        User, Role.id == User.role_id
    ).group_by(Role.id, Role.display_name).all()
    
    # Kurum dağılımı
    org_distribution = db.query(Organization.name, func.count(User.id)).join(
        User, Organization.id == User.organization_id
    ).group_by(Organization.id, Organization.name).all()
    
    # Son 7 günde kayıt olan kullanıcılar
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent_users = db.query(User).filter(User.created_at >= week_ago).count()
    
    # Aktif oturum sayısı
    active_sessions = db.query(UserSession).filter(
        UserSession.is_revoked == False,
        UserSession.expires_at > datetime.now(timezone.utc)
    ).count()
    
    return {
        "user_stats": {
            "total_users": total_users,
            "active_users": active_users,
            "admin_users": admin_users,
            "recent_users": recent_users
        },
        "role_distribution": [
            {"role": role, "count": count} for role, count in role_distribution
        ],
        "organization_distribution": [
            {"organization": org, "count": count} for org, count in org_distribution
        ],
        "active_sessions": active_sessions,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# verify_token function zaten yukarıda import edildi 