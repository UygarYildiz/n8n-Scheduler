-- Optimizasyon Sistemi - Kullanıcı Yetkilendirme Tabloları
-- UTF-8 desteği için utf8mb4 kullanıyoruz

-- Kurumlar tablosu
CREATE TABLE IF NOT EXISTS organizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    type ENUM('hastane', 'cagri_merkezi', 'diger') NOT NULL,
    description TEXT,
    config_file VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Roller tablosu
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    permissions JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Kullanıcılar tablosu
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    organization_id INT,
    role_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_organization (organization_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Kullanıcı oturumları tablosu (JWT token takibi için)
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_jti VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_revoked BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token_jti (token_jti),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit log tablosu (güvenlik izleme için)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action ENUM(
        'LOGIN_SUCCESS',
        'LOGIN_FAILED', 
        'LOGOUT',
        'LOGOUT_ALL',
        'SESSION_REVOKED',
        'USER_CREATED',
        'USER_UPDATED',
        'USER_DELETED',
        'USER_STATUS_CHANGED',
        'PASSWORD_CHANGED',
        'PROFILE_UPDATED',
        'ADMIN_ACCESS'
    ) NOT NULL,
    user_id INT,
    target_user_id INT,
    description TEXT NOT NULL,
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    success BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_action (action),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Varsayılan rolleri ekle
INSERT INTO roles (name, display_name, description, permissions) VALUES
('super_admin', 'Super Yonetici', 'Tum sistem yetkilerine sahip', JSON_ARRAY('*')),
('org_admin', 'Kurum Yoneticisi', 'Kurum ici tum yetkiler', JSON_ARRAY('org.*', 'users.read', 'users.create', 'users.update', 'optimization.*')),
('manager', 'Vardiya Yoneticisi', 'Vardiya planlama ve yonetim', JSON_ARRAY('optimization.*', 'schedules.*', 'reports.read')),
('planner', 'Planlamaci', 'Vardiya planlama', JSON_ARRAY('optimization.read', 'optimization.create', 'schedules.read', 'schedules.create')),
('staff', 'Personel', 'Sadece kendi bilgilerini goruntuleme', JSON_ARRAY('profile.read', 'schedules.read.own'));

-- Varsayılan kurumları ekle
INSERT INTO organizations (name, type, description, config_file) VALUES
('Demo Hastane', 'hastane', 'Demo hastane kurumu', 'hospital_test_config.yaml'),
('Demo Çağrı Merkezi', 'cagri_merkezi', 'Demo çağrı merkezi kurumu', 'cagri_merkezi_config.yaml');

-- Varsayılan süper admin kullanıcısı (şifre: admin123)
-- Şifre hash'i bcrypt ile oluşturulmuş
INSERT INTO users (username, email, password_hash, first_name, last_name, organization_id, role_id) VALUES
('admin', 'admin@optimization.local', '$2b$12$z2JYJMYiU9J.iQRsgTE4s.vJd8fVhzA3ciXNx8u7lEJrEx/UN2KXC', 'Sistem', 'Yoneticisi', 1, 1); 