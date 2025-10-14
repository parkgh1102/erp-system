-- ERP 시스템 데이터베이스 및 사용자 설정

-- 1. 데이터베이스 생성
CREATE DATABASE erp_system
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    CONNECTION LIMIT = -1;

-- 2. 사용자 생성
CREATE USER erp_user WITH
    PASSWORD 'erp_secure_password_2024'
    CREATEDB
    NOSUPERUSER;

-- 3. 데이터베이스 권한 부여
GRANT ALL PRIVILEGES ON DATABASE erp_system TO erp_user;

-- 연결 확인 메시지
SELECT 'ERP 데이터베이스 설정이 완료되었습니다!' as message;