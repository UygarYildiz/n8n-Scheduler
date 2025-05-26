# Audit Logging Utilities
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import json

try:
    from database import AuditLog, AuditAction, User
except ImportError:
    # Fallback for testing
    class AuditLog:
        pass
    class AuditAction:
        pass
    class User:
        pass

def create_audit_log(
    db: Session,
    action: AuditAction,
    description: str,
    user_id: Optional[int] = None,
    target_user_id: Optional[int] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    success: bool = True
) -> Optional[AuditLog]:
    """
    Audit log kaydı oluşturur
    
    Args:
        db: Database session
        action: İşlem türü (AuditAction enum)
        description: İşlem açıklaması
        user_id: İşlemi yapan kullanıcı ID'si
        target_user_id: İşlem yapılan kullanıcı ID'si (admin işlemleri için)
        details: Ek detaylar (JSON)
        ip_address: IP adresi
        user_agent: User agent string
        success: İşlem başarılı mı
    
    Returns:
        Oluşturulan AuditLog kaydı
    """
    try:
        audit_log = AuditLog(
            action=action,
            user_id=user_id,
            target_user_id=target_user_id,
            description=description,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
            success=success
        )
        
        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)
        
        return audit_log
        
    except Exception as e:
        print(f"Audit log creation error: {e}")
        db.rollback()
        return None

def log_login_success(
    db: Session,
    user_id: int,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Başarılı giriş kaydı"""
    user = db.query(User).filter(User.id == user_id).first()
    username = user.username if user else "Unknown"
    
    return create_audit_log(
        db=db,
        action=AuditAction.LOGIN_SUCCESS,
        description=f"Kullanıcı {username} başarıyla giriş yaptı",
        user_id=user_id,
        details={
            "username": username,
            "login_time": datetime.now(timezone.utc).isoformat()
        },
        ip_address=ip_address,
        user_agent=user_agent,
        success=True
    )

def log_login_failed(
    db: Session,
    username: str,
    reason: str = "Invalid credentials",
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Başarısız giriş kaydı"""
    return create_audit_log(
        db=db,
        action=AuditAction.LOGIN_FAILED,
        description=f"Kullanıcı {username} için başarısız giriş denemesi: {reason}",
        user_id=None,  # Başarısız giriş için user_id yok
        details={
            "username": username,
            "reason": reason,
            "attempt_time": datetime.now(timezone.utc).isoformat()
        },
        ip_address=ip_address,
        user_agent=user_agent,
        success=False
    )

def log_logout(
    db: Session,
    user_id: int,
    logout_type: str = "single",
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Çıkış kaydı"""
    user = db.query(User).filter(User.id == user_id).first()
    username = user.username if user else "Unknown"
    
    action = AuditAction.LOGOUT_ALL if logout_type == "all" else AuditAction.LOGOUT
    description = f"Kullanıcı {username} {'tüm oturumlardan' if logout_type == 'all' else ''} çıkış yaptı"
    
    return create_audit_log(
        db=db,
        action=action,
        description=description,
        user_id=user_id,
        details={
            "username": username,
            "logout_type": logout_type,
            "logout_time": datetime.now(timezone.utc).isoformat()
        },
        ip_address=ip_address,
        user_agent=user_agent
    )

def log_session_revoked(
    db: Session,
    admin_user_id: int,
    target_user_id: int,
    session_id: int,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Oturum sonlandırma kaydı"""
    admin_user = db.query(User).filter(User.id == admin_user_id).first()
    target_user = db.query(User).filter(User.id == target_user_id).first()
    
    admin_username = admin_user.username if admin_user else "Unknown"
    target_username = target_user.username if target_user else "Unknown"
    
    return create_audit_log(
        db=db,
        action=AuditAction.SESSION_REVOKED,
        description=f"Admin {admin_username}, kullanıcı {target_username}'nin oturumunu sonlandırdı",
        user_id=admin_user_id,
        target_user_id=target_user_id,
        details={
            "admin_username": admin_username,
            "target_username": target_username,
            "session_id": session_id,
            "revoke_time": datetime.now(timezone.utc).isoformat()
        },
        ip_address=ip_address,
        user_agent=user_agent
    )

def log_user_created(
    db: Session,
    admin_user_id: int,
    new_user_id: int,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Kullanıcı oluşturma kaydı"""
    admin_user = db.query(User).filter(User.id == admin_user_id).first()
    new_user = db.query(User).filter(User.id == new_user_id).first()
    
    admin_username = admin_user.username if admin_user else "Unknown"
    new_username = new_user.username if new_user else "Unknown"
    
    return create_audit_log(
        db=db,
        action=AuditAction.USER_CREATED,
        description=f"Admin {admin_username}, yeni kullanıcı {new_username} oluşturdu",
        user_id=admin_user_id,
        target_user_id=new_user_id,
        details={
            "admin_username": admin_username,
            "new_username": new_username,
            "new_user_email": new_user.email if new_user else None,
            "creation_time": datetime.now(timezone.utc).isoformat()
        },
        ip_address=ip_address,
        user_agent=user_agent
    )

def log_user_updated(
    db: Session,
    admin_user_id: int,
    target_user_id: int,
    changes: Dict[str, Any],
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Kullanıcı güncelleme kaydı"""
    admin_user = db.query(User).filter(User.id == admin_user_id).first()
    target_user = db.query(User).filter(User.id == target_user_id).first()
    
    admin_username = admin_user.username if admin_user else "Unknown"
    target_username = target_user.username if target_user else "Unknown"
    
    return create_audit_log(
        db=db,
        action=AuditAction.USER_UPDATED,
        description=f"Admin {admin_username}, kullanıcı {target_username}'nin bilgilerini güncelledi",
        user_id=admin_user_id,
        target_user_id=target_user_id,
        details={
            "admin_username": admin_username,
            "target_username": target_username,
            "changes": changes,
            "update_time": datetime.now(timezone.utc).isoformat()
        },
        ip_address=ip_address,
        user_agent=user_agent
    )

def log_user_deleted(
    db: Session,
    admin_user_id: int,
    deleted_username: str,
    deleted_email: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Kullanıcı silme kaydı"""
    admin_user = db.query(User).filter(User.id == admin_user_id).first()
    admin_username = admin_user.username if admin_user else "Unknown"
    
    return create_audit_log(
        db=db,
        action=AuditAction.USER_DELETED,
        description=f"Admin {admin_username}, kullanıcı {deleted_username} sildi",
        user_id=admin_user_id,
        target_user_id=None,  # Kullanıcı silindiği için ID yok
        details={
            "admin_username": admin_username,
            "deleted_username": deleted_username,
            "deleted_email": deleted_email,
            "deletion_time": datetime.now(timezone.utc).isoformat()
        },
        ip_address=ip_address,
        user_agent=user_agent
    )

def log_user_status_changed(
    db: Session,
    admin_user_id: int,
    target_user_id: int,
    new_status: bool,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Kullanıcı durum değişikliği kaydı"""
    admin_user = db.query(User).filter(User.id == admin_user_id).first()
    target_user = db.query(User).filter(User.id == target_user_id).first()
    
    admin_username = admin_user.username if admin_user else "Unknown"
    target_username = target_user.username if target_user else "Unknown"
    
    status_text = "aktif" if new_status else "pasif"
    
    return create_audit_log(
        db=db,
        action=AuditAction.USER_STATUS_CHANGED,
        description=f"Admin {admin_username}, kullanıcı {target_username}'yi {status_text} yaptı",
        user_id=admin_user_id,
        target_user_id=target_user_id,
        details={
            "admin_username": admin_username,
            "target_username": target_username,
            "old_status": not new_status,
            "new_status": new_status,
            "change_time": datetime.now(timezone.utc).isoformat()
        },
        ip_address=ip_address,
        user_agent=user_agent
    )

def log_password_change_success(
    db: Session,
    user_id: int,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Başarılı şifre değiştirme kaydı"""
    user = db.query(User).filter(User.id == user_id).first()
    username = user.username if user else "Unknown"
    
    return create_audit_log(
        db=db,
        action=AuditAction.PASSWORD_CHANGED,
        description=f"Kullanıcı {username} şifresini başarıyla değiştirdi",
        user_id=user_id,
        details={
            "username": username,
            "change_time": datetime.now(timezone.utc).isoformat()
        },
        ip_address=ip_address,
        user_agent=user_agent,
        success=True
    )

def log_password_change_failed(
    db: Session,
    user_id: int,
    reason: str = "Invalid current password",
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Başarısız şifre değiştirme kaydı"""
    user = db.query(User).filter(User.id == user_id).first()
    username = user.username if user else "Unknown"
    
    return create_audit_log(
        db=db,
        action=AuditAction.PASSWORD_CHANGED,
        description=f"Kullanıcı {username} için başarısız şifre değiştirme denemesi: {reason}",
        user_id=user_id,
        details={
            "username": username,
            "reason": reason,
            "attempt_time": datetime.now(timezone.utc).isoformat()
        },
        ip_address=ip_address,
        user_agent=user_agent,
        success=False
    )

def get_audit_logs(
    db: Session,
    limit: int = 100,
    offset: int = 0,
    user_id: Optional[int] = None,
    action: Optional[AuditAction] = None,
    success: Optional[bool] = None
) -> Dict[str, Any]:
    """
    Audit logları getirir
    
    Args:
        db: Database session
        limit: Maksimum kayıt sayısı
        offset: Başlangıç offset'i
        user_id: Belirli kullanıcının logları
        action: Belirli işlem türü
        success: Başarılı/başarısız filtresi
    
    Returns:
        Audit log listesi ve toplam sayı
    """
    try:
        query = db.query(AuditLog)
        
        # Filtreler
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        if action:
            query = query.filter(AuditLog.action == action)
        if success is not None:
            query = query.filter(AuditLog.success == success)
        
        # Toplam sayı
        total_count = query.count()
        
        # Sayfalama ve sıralama
        logs = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()
        
        # Sonuçları formatla
        log_list = []
        for log in logs:
            log_data = {
                "id": log.id,
                "action": log.action.value,
                "description": log.description,
                "user_id": log.user_id,
                "target_user_id": log.target_user_id,
                "details": log.details,
                "ip_address": log.ip_address,
                "user_agent": log.user_agent,
                "success": log.success,
                "created_at": log.created_at.replace(tzinfo=timezone.utc).isoformat(),
                "user": {
                    "username": log.user.username,
                    "full_name": f"{log.user.first_name} {log.user.last_name}"
                } if log.user else None,
                "target_user": {
                    "username": log.target_user.username,
                    "full_name": f"{log.target_user.first_name} {log.target_user.last_name}"
                } if log.target_user else None
            }
            log_list.append(log_data)
        
        return {
            "logs": log_list,
            "total_count": total_count,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        print(f"Error fetching audit logs: {e}")
        return {
            "logs": [],
            "total_count": 0,
            "limit": limit,
            "offset": offset
        } 