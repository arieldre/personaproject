-- 004_create_admin_user.sql
-- Migration to insert a new admin user

INSERT INTO users (
    email,
    password_hash,
    first_name,
    last_name,
    role,
    is_active,
    email_verified,
    created_at,
    updated_at
) VALUES (
    'admin@persona.local',
    -- Valid bcrypt hash for password: admin123
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.emWrHhOECWQy.G',
    'Admin',
    'User',
    'super_admin',
    true,
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;
-- Login: admin@persona.local / admin123