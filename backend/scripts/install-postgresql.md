# PostgreSQL 설치 가이드 (Windows)

## 1. PostgreSQL 다운로드

1. [PostgreSQL 공식 사이트](https://www.postgresql.org/download/windows/) 접속
2. "Download the installer" 클릭
3. 최신 버전 (15.x 또는 16.x) 다운로드

## 2. PostgreSQL 설치

### 설치 과정
1. 다운로드한 설치 파일 실행
2. 설치 옵션 선택:
   - Components: PostgreSQL Server, pgAdmin 4, Stack Builder 모두 선택
   - Data Directory: 기본값 유지
   - Password: **강력한 비밀번호 설정** (기억해야 함!)
   - Port: 5432 (기본값)
   - Locale: [Default locale] 선택

### 환경변수 설정
1. 시스템 환경변수 편집 열기
2. Path에 PostgreSQL bin 디렉토리 추가:
   ```
   C:\Program Files\PostgreSQL\15\bin
   ```

## 3. 설치 확인

### CMD/PowerShell에서 확인
```bash
# PostgreSQL 버전 확인
psql --version

# PostgreSQL 서비스 확인
sc query postgresql-x64-15
```

## 4. 데이터베이스 설정

### psql 접속
```bash
# postgres 사용자로 접속
psql -U postgres
```

### 비밀번호 입력 후 다음 명령어 실행:
```sql
-- 데이터베이스 생성
CREATE DATABASE erp_system
    WITH ENCODING 'UTF8';

-- 사용자 생성
CREATE USER erp_user WITH
    PASSWORD 'erp_secure_password_2024'
    CREATEDB;

-- 권한 부여
GRANT ALL PRIVILEGES ON DATABASE erp_system TO erp_user;

-- 연결 확인
\c erp_system
\q
```

## 5. 연결 테스트

```bash
# 새 사용자로 연결 테스트
psql -U erp_user -d erp_system -h localhost
```

## 설치 후 다음 단계

1. PostgreSQL 설치 완료 후 다시 스크립트 실행
2. `npm run dev:postgres` 명령어로 서버 시작
3. 마이그레이션 자동 실행 확인

## 문제 해결

### 일반적인 오류
- **psql 명령어를 찾을 수 없음**: PATH 환경변수에 PostgreSQL bin 디렉토리 추가
- **포트 충돌**: 5432 포트가 사용 중인지 확인
- **권한 오류**: 관리자 권한으로 설치 재시도