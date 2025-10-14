# PostgreSQL 설정 가이드

## 1. PostgreSQL 설치 (Windows)

### PostgreSQL 다운로드 및 설치
1. [PostgreSQL 공식 사이트](https://www.postgresql.org/download/windows/)에서 설치 파일 다운로드
2. 설치 시 설정:
   - Port: 5432 (기본값)
   - Superuser 비밀번호 설정
   - Locale: Korean, South Korea

### pgAdmin 설치 (선택사항)
- PostgreSQL과 함께 설치되는 GUI 관리 도구

## 2. 데이터베이스 설정

### 방법 1: SQL 스크립트 실행
```bash
# PostgreSQL 서비스 시작
psql -U postgres

# 스크립트 실행
\i scripts/setup-postgres.sql
```

### 방법 2: 수동 설정
```sql
-- 1. 데이터베이스 생성
CREATE DATABASE erp_system
    WITH ENCODING 'UTF8'
    LC_COLLATE = 'ko_KR.UTF-8'
    LC_CTYPE = 'ko_KR.UTF-8';

-- 2. 사용자 생성
CREATE USER erp_user WITH
    PASSWORD 'erp_secure_password_2024'
    CREATEDB;

-- 3. 권한 부여
GRANT ALL PRIVILEGES ON DATABASE erp_system TO erp_user;
```

## 3. 환경 설정

### 개발 환경
```bash
# .env.postgres 파일을 .env로 복사
cp .env.postgres .env

# PostgreSQL 모드로 개발 서버 실행
npm run dev:postgres
```

### 운영 환경
```bash
# .env.postgres.production 파일 수정
# - 강력한 비밀번호 설정
# - 운영 데이터베이스 정보 입력
# - JWT 시크릿 새로 생성

cp .env.postgres.production .env
```

## 4. 마이그레이션 실행

### 초기 마이그레이션
```bash
# 빌드
npm run build

# 마이그레이션 실행
npm run migration:run
```

### 새 마이그레이션 생성
```bash
# 마이그레이션 파일 생성
npm run migration:generate -- -n MigrationName

# 마이그레이션 실행
npm run migration:run
```

## 5. 데이터베이스 연결 확인

### 연결 테스트
```bash
# 서버 시작
npm run start:postgres

# 헬스체크 확인
curl http://localhost:3001/health
```

### 로그 확인
- 로그 파일: `logs/app.log`
- 콘솔에서 데이터베이스 연결 상태 확인

## 6. 보안 설정

### 운영 환경 체크리스트
- [ ] 강력한 데이터베이스 비밀번호 설정
- [ ] SSL 연결 활성화
- [ ] 방화벽 설정 (5432 포트)
- [ ] 정기적인 백업 설정
- [ ] 연결 풀 크기 최적화

### 백업 명령어
```bash
# 백업 생성
pg_dump -U erp_user -h localhost -d erp_system > backup.sql

# 백업 복원
psql -U erp_user -h localhost -d erp_system < backup.sql
```

## 7. 문제 해결

### 일반적인 오류

#### 연결 실패
```
ECONNREFUSED: connection refused
```
**해결**: PostgreSQL 서비스 시작 확인

#### 인증 실패
```
password authentication failed
```
**해결**: 사용자명/비밀번호 확인, pg_hba.conf 설정 확인

#### 데이터베이스 없음
```
database "erp_system" does not exist
```
**해결**: setup-postgres.sql 스크립트 실행

### 로그 확인
```bash
# PostgreSQL 로그 확인 (Windows)
# C:\Program Files\PostgreSQL\15\data\log\

# 서비스 상태 확인
sc query postgresql-x64-15
```