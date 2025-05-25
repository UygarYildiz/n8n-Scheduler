from functools import wraps
from typing import List, Optional
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
import logging

try:
    from .auth_utils import verify_token, get_user_by_token
    from .database import get_db
except ImportError:
    from auth_utils import verify_token, get_user_by_token
    from database import get_db

logger = logging.getLogger(__name__)
security = HTTPBearer()

# Rol hiyerarşisi
ROLE_HIERARCHY = {
    'super_admin': 5,
    'org_admin': 4,
    'manager': 3,
    'planner': 2,
    'staff': 1
}

# Endpoint yetkileri
ENDPOINT_PERMISSIONS = {
    # Authentication endpoints
    '/auth/login': [],  # Public
    '/auth/logout': ['staff', 'planner', 'manager', 'org_admin', 'super_admin'],
    '/auth/profile': ['staff', 'planner', 'manager', 'org_admin', 'super_admin'],
    '/auth/register': ['org_admin', 'super_admin'],
    
    # Dashboard endpoints
    '/dashboard': ['staff', 'planner', 'manager', 'org_admin', 'super_admin'],
    '/health': [],  # Public
    
    # User management
    '/users': ['org_admin', 'super_admin'],
    '/users/create': ['org_admin', 'super_admin'],
    '/users/update': ['org_admin', 'super_admin'],
    '/users/delete': ['org_admin', 'super_admin'],
    
    # Optimization endpoints
    '/optimize': ['planner', 'manager', 'org_admin', 'super_admin'],
    '/optimization/results': ['staff', 'planner', 'manager', 'org_admin', 'super_admin'],
    '/optimization/history': ['planner', 'manager', 'org_admin', 'super_admin'],
    
    # Dataset management
    '/datasets': ['manager', 'org_admin', 'super_admin'],
    '/datasets/upload': ['manager', 'org_admin', 'super_admin'],
    '/datasets/delete': ['org_admin', 'super_admin'],
    
    # Schedule management
    '/schedules': ['staff', 'planner', 'manager', 'org_admin', 'super_admin'],
    '/schedules/edit': ['planner', 'manager', 'org_admin', 'super_admin'],
    '/schedules/export': ['planner', 'manager', 'org_admin', 'super_admin'],
    
    # System settings
    '/settings': ['manager', 'org_admin', 'super_admin'],
    '/settings/system': ['org_admin', 'super_admin'],
}

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    JWT token'dan mevcut kullanıcıyı al
    """
    try:
        token = credentials.credentials
        payload = verify_token(token)
        
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Geçersiz token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token'da kullanıcı ID'si bulunamadı",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Kullanıcıyı veritabanından al
        db = next(get_db())
        user = get_user_by_token(db, token)
        
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Kullanıcı bulunamadı",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Kullanıcı hesabı deaktif",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user
        
    except JWTError as e:
        logger.error(f"JWT doğrulama hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token doğrulanamadı",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Kullanıcı doğrulama hatası: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Kimlik doğrulama sırasında hata oluştu"
        )

def require_roles(required_roles: List[str]):
    """
    Belirli rolleri gerektiren decorator
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # FastAPI dependency injection için current_user'ı al
            current_user = kwargs.get('current_user')
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Kimlik doğrulaması gerekli"
                )
            
            user_role = current_user.role.name if current_user.role else None
            
            if user_role not in required_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Bu işlem için gerekli yetki: {', '.join(required_roles)}. Mevcut rol: {user_role}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def require_minimum_role(minimum_role: str):
    """
    Minimum rol seviyesi gerektiren decorator
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user')
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Kimlik doğrulaması gerekli"
                )
            
            user_role = current_user.role.name if current_user.role else None
            user_level = ROLE_HIERARCHY.get(user_role, 0)
            required_level = ROLE_HIERARCHY.get(minimum_role, 0)
            
            if user_level < required_level:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Bu işlem için minimum {minimum_role} yetkisi gerekli. Mevcut rol: {user_role}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def check_organization_access(user, target_org_id: Optional[int] = None):
    """
    Kullanıcının organizasyon erişimini kontrol et
    """
    # Super admin her organizasyona erişebilir
    if user.role.name == 'super_admin':
        return True
    
    # Diğer kullanıcılar sadece kendi organizasyonlarına erişebilir
    if target_org_id and user.organization_id != target_org_id:
        return False
    
    return True

def require_organization_access(target_org_id: Optional[int] = None):
    """
    Organizasyon erişimi gerektiren decorator
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user')
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Kimlik doğrulaması gerekli"
                )
            
            if not check_organization_access(current_user, target_org_id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Bu organizasyona erişim yetkiniz yok"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def get_endpoint_permissions(endpoint_path: str) -> List[str]:
    """
    Endpoint için gerekli yetkileri al
    """
    return ENDPOINT_PERMISSIONS.get(endpoint_path, ['super_admin'])

def check_endpoint_permission(user, endpoint_path: str) -> bool:
    """
    Kullanıcının endpoint'e erişim yetkisi var mı kontrol et
    """
    required_roles = get_endpoint_permissions(endpoint_path)
    
    # Public endpoint
    if not required_roles:
        return True
    
    user_role = user.role.name if user.role else None
    return user_role in required_roles

# FastAPI dependency olarak kullanılabilir
async def get_current_active_user(current_user = Depends(get_current_user)):
    """
    Aktif kullanıcıyı al (FastAPI dependency)
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kullanıcı hesabı deaktif"
        )
    return current_user

async def get_admin_user(current_user = Depends(get_current_active_user)):
    """
    Admin yetkisi olan kullanıcıyı al (FastAPI dependency)
    """
    if current_user.role.name not in ['org_admin', 'super_admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin yetkisi gerekli"
        )
    return current_user

async def get_super_admin_user(current_user = Depends(get_current_active_user)):
    """
    Super admin yetkisi olan kullanıcıyı al (FastAPI dependency)
    """
    if current_user.role.name != 'super_admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin yetkisi gerekli"
        )
    return current_user 