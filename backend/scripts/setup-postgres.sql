-- PostgreSQL 데이터베이스 및 사용자 설정 스크립트

-- 1. 데이터베이스 생성
CREATE DATABASE erp_system
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'ko_KR.UTF-8'
    LC_CTYPE = 'ko_KR.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- 2. 사용자 생성
CREATE USER erp_user WITH
    PASSWORD 'erp_secure_password_2024'
    CREATEDB
    NOSUPERUSER
    NOREPLICATION;

-- 3. 권한 부여
GRANT ALL PRIVILEGES ON DATABASE erp_system TO erp_user;

-- 4. 데이터베이스 연결
\c erp_system;

-- 5. 스키마 권한 부여
GRANT ALL ON SCHEMA public TO erp_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO erp_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO erp_user;

-- 6. 기본 권한 설정 (향후 생성될 객체에 대한 권한)
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON TABLES TO erp_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON SEQUENCES TO erp_user;

-- 7. 확장 모듈 설치 (필요한 경우)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 8. 연결 정보 확인
SELECT
    current_database() as database_name,
    current_user as current_user,
    session_user as session_user;

COMMENT ON DATABASE erp_system IS 'ERP 통합시스템 데이터베이스';