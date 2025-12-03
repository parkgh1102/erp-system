# 🚀 ERP 시스템 AWS 배포 가이드

## 📋 배포 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                        Route 53                              │
│              webapperp.ai.kr (프론트엔드)                     │
│              api.webapperp.ai.kr (백엔드)                     │
└───────────────┬─────────────────────┬───────────────────────┘
                │                     │
       ┌────────▼────────┐   ┌────────▼─────────────┐
       │  AWS Amplify    │   │  Elastic Beanstalk   │
       │   (Frontend)    │   │      (Backend)       │
       │  React + Vite   │   │    Express + API     │
       └─────────────────┘   └──────────┬───────────┘
                                        │
                               ┌────────▼────────┐
                               │    AWS RDS      │
                               │   PostgreSQL    │
                               └─────────────────┘
```

---

## 📦 사전 준비

### 1. AWS 계정 생성
1. https://aws.amazon.com 접속
2. "Create an AWS Account" 클릭
3. 신용카드 등록 (프리티어 1년 무료)
4. IAM 사용자 생성 권장

### 2. AWS CLI 설치 (Windows)
```powershell
# Chocolatey로 설치
choco install awscli

# 또는 직접 다운로드
# https://aws.amazon.com/cli/
```

### 3. AWS CLI 구성
```bash
aws configure
# AWS Access Key ID: (IAM에서 생성)
# AWS Secret Access Key: (IAM에서 생성)
# Default region: ap-northeast-2 (서울)
# Default output format: json
```

### 4. Elastic Beanstalk CLI 설치
```bash
pip install awsebcli --upgrade
```

---

## 🗄️ STEP 1: RDS PostgreSQL 데이터베이스 생성

### 1-1. RDS 콘솔 접속
1. AWS Console → **RDS** 검색
2. **Create database** 클릭

### 1-2. 데이터베이스 설정

**Engine options:**
- Engine type: `PostgreSQL`
- Version: `PostgreSQL 15.x` (최신 안정 버전)

**Templates:**
- ✅ **Free tier** (프리티어 사용 시)
- 또는 **Production** (실제 운영 시)

**Settings:**
```
DB instance identifier: erp-database
Master username: erp_admin
Master password: [강력한 비밀번호 - 최소 16자]
```

**Instance configuration:**
- DB instance class: `db.t3.micro` (프리티어)
- 또는 `db.t3.small` (실제 운영)

**Storage:**
- Storage type: `General Purpose SSD (gp3)`
- Allocated storage: `20 GB`
- ✅ Enable storage autoscaling
- Maximum storage threshold: `100 GB`

**Connectivity:**
- VPC: `Default VPC`
- Public access: `Yes` (나중에 보안 그룹으로 제한)
- VPC security group: `Create new` → `erp-db-sg`

**Database authentication:**
- ✅ Password authentication

**Additional configuration:**
- Initial database name: `erp_system`
- Backup retention period: `7 days`
- ✅ Enable automated backups
- ✅ Enable Enhanced monitoring (선택사항)

### 1-3. 생성 완료 대기
- 약 5-10분 소요
- **Endpoint** 주소 복사 (예: `erp-database.xxxxxx.ap-northeast-2.rds.amazonaws.com`)

### 1-4. 보안 그룹 설정
1. RDS 인스턴스 선택 → **Connectivity & security**
2. Security groups 클릭
3. **Inbound rules** → **Edit inbound rules**
4. 규칙 추가:
   ```
   Type: PostgreSQL
   Protocol: TCP
   Port: 5432
   Source: Elastic Beanstalk 보안 그룹 (나중에 추가)
   ```

---

## 🖥️ STEP 2: Elastic Beanstalk 백엔드 배포

### 2-1. 백엔드 준비

#### .ebextensions 설정 파일 생성
백엔드 폴더에 `.ebextensions` 디렉토리 생성:

```bash
mkdir backend/.ebextensions
```

**backend/.ebextensions/nodecommand.config:**
```yaml
option_settings:
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "npm start"
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    NPM_USE_PRODUCTION: false
```

**backend/.ebextensions/environment.config:**
```yaml
option_settings:
  aws:elasticbeanstalk:application:environment:
    PORT: 8080
```

#### backend/.elasticbeanstalk/config.yml 생성
```yaml
branch-defaults:
  main:
    environment: erp-backend-prod
global:
  application_name: erp-backend
  default_region: ap-northeast-2
  default_platform: Node.js 18 running on 64bit Amazon Linux 2023
  sc: git
```

#### package.json 확인
`backend/package.json` scripts에 다음이 있는지 확인:
```json
{
  "scripts": {
    "start": "node dist/index.js",
    "build": "tsc",
    "postinstall": "npm run build"
  }
}
```

### 2-2. Elastic Beanstalk 애플리케이션 초기화

```bash
cd backend
eb init

# 설정:
# - Region: 10) ap-northeast-2 (서울)
# - Application name: erp-backend
# - Platform: Node.js
# - Platform version: Node.js 18 (latest)
# - SSH: Yes (나중에 디버깅용)
```

### 2-3. 환경 생성 및 배포

```bash
eb create erp-backend-prod --instance-type t3.micro --single

# 약 5-10분 소요
```

또는 웹 콘솔에서:
1. Elastic Beanstalk → **Create application**
2. Application name: `erp-backend`
3. Platform: `Node.js`
4. Application code: `Upload your code` → backend 폴더 zip 업로드
5. Presets: `Single instance (free tier eligible)`

### 2-4. 환경변수 설정

**방법 1: CLI로 설정**
```bash
eb setenv \
  NODE_ENV=production \
  PORT=8080 \
  DB_TYPE=postgres \
  DB_HOST=erp-database.xxxxxx.ap-northeast-2.rds.amazonaws.com \
  DB_PORT=5432 \
  DB_USERNAME=erp_admin \
  DB_PASSWORD=your-strong-password \
  DB_DATABASE=erp_system \
  JWT_SECRET=$(openssl rand -hex 32) \
  JWT_REFRESH_SECRET=$(openssl rand -hex 32) \
  SESSION_SECRET=$(openssl rand -hex 32) \
  JWT_EXPIRES_IN=15m \
  JWT_REFRESH_EXPIRES_IN=7d \
  BCRYPT_ROUNDS=12 \
  FRONTEND_URL=https://webapperp.ai.kr
```

**방법 2: 웹 콘솔에서 설정**
1. Elastic Beanstalk → `erp-backend-prod` → **Configuration**
2. **Software** → **Edit**
3. **Environment properties**에 위 환경변수 추가

### 2-5. RDS 보안 그룹 업데이트
1. RDS 보안 그룹(`erp-db-sg`)으로 이동
2. Inbound rules에 Elastic Beanstalk 보안 그룹 추가
   - Source: `Elastic Beanstalk 인스턴스 보안 그룹`

### 2-6. Health Check 확인
```bash
eb health
# 또는 브라우저에서
# http://erp-backend-prod.xxxxxx.ap-northeast-2.elasticbeanstalk.com/api/health
```

### 2-7. 로그 확인
```bash
eb logs
# 실시간 로그 스트리밍
eb logs --stream
```

---

## ⚡ STEP 3: AWS Amplify 프론트엔드 배포

### 3-1. GitHub 저장소 연결

1. AWS Console → **Amplify** 검색
2. **Get Started** → **Amplify Hosting**
3. **GitHub** 선택 → 저장소 연결

### 3-2. 빌드 설정

**Repository:** 프로젝트 저장소 선택
**Branch:** `main`

**App name:** `erp-frontend`

**Build and test settings:**
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/dist
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
```

### 3-3. 환경변수 설정

**Environment variables** 섹션에 추가:
```
VITE_API_URL=http://erp-backend-prod.xxxxxx.ap-northeast-2.elasticbeanstalk.com/api
VITE_ENFORCE_HTTPS=true
VITE_APP_ENV=production
```

> ⚠️ 나중에 커스텀 도메인 설정 후 `https://api.webapperp.ai.kr/api`로 변경

### 3-4. 배포 시작
- **Save and deploy** 클릭
- 약 3-5분 소요
- 배포 URL: `https://main.xxxxxx.amplifyapp.com`

---

## 🌐 STEP 4: Route 53 커스텀 도메인 연결

### 4-1. Route 53 호스팅 영역 생성

1. AWS Console → **Route 53**
2. **Hosted zones** → **Create hosted zone**
3. Domain name: `webapperp.ai.kr`
4. Type: `Public hosted zone`
5. **Create hosted zone**

### 4-2. 가비아에서 네임서버 변경

Route 53에서 생성된 4개의 네임서버(NS) 복사:
```
ns-xxxx.awsdns-xx.org
ns-xxxx.awsdns-xx.com
ns-xxxx.awsdns-xx.net
ns-xxxx.awsdns-xx.co.uk
```

**가비아 설정:**
1. 가비아 로그인 → **My가비아** → **도메인 관리**
2. `webapperp.ai.kr` 선택 → **네임서버 설정**
3. AWS Route 53 네임서버 4개 입력
4. 저장 (전파까지 최대 48시간, 보통 10-30분)

### 4-3. Amplify에 커스텀 도메인 추가 (프론트엔드)

1. Amplify Console → `erp-frontend` → **Domain management**
2. **Add domain** 클릭
3. Domain: `webapperp.ai.kr` 입력
4. **Configure domain**:
   - `webapperp.ai.kr` → main 브랜치
   - `www.webapperp.ai.kr` → main 브랜치 (리다이렉트)
5. **Save**

Amplify가 자동으로 Route 53에 레코드 생성:
- SSL 인증서 자동 발급 (AWS Certificate Manager)
- 약 10-20분 소요

### 4-4. Elastic Beanstalk 커스텀 도메인 추가 (백엔드)

#### Option A: Application Load Balancer 사용 (권장)

1. Elastic Beanstalk → `erp-backend-prod` → **Configuration**
2. **Capacity** → **Edit**
3. Environment type: `Load balanced`
4. Instances: Min `1`, Max `4`
5. **Save** → **Apply**

6. **Load balancer** 섹션:
   - Listener 추가: `HTTPS:443`
   - SSL certificate: **Request certificate** (ACM에서 자동)
   - Domain: `api.webapperp.ai.kr`

7. Route 53 레코드 생성:
   ```
   Name: api.webapperp.ai.kr
   Type: A (Alias)
   Alias target: Elastic Beanstalk Load Balancer
   ```

#### Option B: Single Instance (더 간단하지만 HTTPS 없음)

1. Route 53 → Hosted zone: `webapperp.ai.kr`
2. **Create record**:
   ```
   Record name: api
   Record type: CNAME
   Value: erp-backend-prod.xxxxxx.ap-northeast-2.elasticbeanstalk.com
   TTL: 300
   ```

> ⚠️ 이 방법은 HTTPS가 없으므로 프로덕션에 비추천

---

## ⚙️ STEP 5: 환경변수 최종 업데이트

### Elastic Beanstalk (Backend)
```bash
eb setenv FRONTEND_URL=https://webapperp.ai.kr
```

### Amplify (Frontend)
1. Amplify Console → **Environment variables**
2. `VITE_API_URL` 업데이트:
   ```
   https://api.webapperp.ai.kr/api
   ```
3. **Save** → 자동 재배포

---

## 🔒 STEP 6: 보안 강화

### 6-1. RDS 보안 그룹 강화
```
Inbound rules:
- Type: PostgreSQL (5432)
- Source: Elastic Beanstalk 보안 그룹만 허용
- 개인 IP 제거 (필요시 VPN 또는 Bastion Host 사용)
```

### 6-2. Elastic Beanstalk HTTPS 강제
`backend/.ebextensions/https-redirect.config`:
```yaml
files:
  "/etc/nginx/conf.d/https_redirect.conf":
    mode: "000644"
    owner: root
    group: root
    content: |
      server {
        listen 8080;
        if ($http_x_forwarded_proto != 'https') {
          return 301 https://$host$request_uri;
        }
      }
```

### 6-3. AWS WAF 추가 (선택사항)
- SQL Injection, XSS 공격 방어
- Rate limiting
- 월 $5 + 트래픽 비용

### 6-4. CloudWatch 알람 설정
1. CloudWatch → **Alarms** → **Create alarm**
2. 모니터링 지표:
   - CPU Utilization > 80%
   - Database Connections > 90%
   - HTTP 5xx errors > 10

---

## ✅ STEP 7: 배포 확인 체크리스트

```bash
# Backend Health Check
curl https://api.webapperp.ai.kr/api/health

# Frontend 접속
curl https://webapperp.ai.kr

# Database 연결 테스트 (로컬에서)
psql -h erp-database.xxxxxx.ap-northeast-2.rds.amazonaws.com -U erp_admin -d erp_system
```

- [ ] Backend API 응답 확인
- [ ] Frontend 페이지 로드 확인
- [ ] 로그인 테스트
- [ ] 데이터 CRUD 테스트
- [ ] HTTPS 적용 확인 (자물쇠 아이콘)
- [ ] CORS 에러 없는지 확인
- [ ] 콘솔 에러 없는지 확인

---

## 💰 AWS 비용 예상 (월 기준)

### 프리티어 (첫 12개월)
| 서비스 | 스펙 | 월 비용 |
|--------|------|---------|
| **RDS PostgreSQL** | db.t3.micro, 20GB | **$0** (750시간 무료) |
| **Elastic Beanstalk** | t3.micro EC2 | **$0** (750시간 무료) |
| **Amplify Hosting** | 빌드 1000분, 15GB 전송 | **$0** (무료 티어 내) |
| **Route 53** | 호스팅 영역 1개 | **$0.50** |
| **데이터 전송** | 첫 100GB | **$0** |
| **총계** | | **~$0.50/월** |

### 프리티어 이후
| 서비스 | 스펙 | 월 비용 |
|--------|------|---------|
| **RDS PostgreSQL** | db.t3.micro, 20GB | **~$15** |
| **Elastic Beanstalk** | t3.small EC2 | **~$15** |
| **Amplify Hosting** | 빌드 1000분, 15GB 전송 | **~$5** |
| **Route 53** | 호스팅 영역 + 쿼리 | **~$1** |
| **데이터 전송** | ~100GB/월 | **~$9** |
| **총계** | | **~$45/월** |

### 비용 절감 팁
1. **Reserved Instances**: 1년 약정 시 최대 40% 할인
2. **RDS 대신 Aurora Serverless**: 사용량 기반 과금
3. **CloudFront CDN**: 정적 파일 캐싱으로 데이터 전송 비용 절감
4. **Auto Scaling**: 트래픽 낮을 때 인스턴스 수 감소

---

## 🔧 문제 해결

### 1. Elastic Beanstalk 배포 실패
```bash
# 로그 확인
eb logs

# SSH 접속하여 디버깅
eb ssh

# 환경 재생성
eb terminate erp-backend-prod
eb create erp-backend-prod
```

### 2. RDS 연결 실패
- 보안 그룹 확인: Elastic Beanstalk 보안 그룹 허용되었는지
- 환경변수 확인: `DB_HOST`, `DB_PASSWORD` 정확한지
- VPC 확인: RDS와 EB가 같은 VPC에 있는지

```bash
# EB 인스턴스에서 RDS 연결 테스트
eb ssh
psql -h $DB_HOST -U $DB_USERNAME -d $DB_DATABASE
```

### 3. CORS 에러
- Backend 환경변수 `FRONTEND_URL` 확인
- `https://webapperp.ai.kr` (슬래시 없음)
- EB 재시작: `eb deploy`

### 4. Amplify 빌드 실패
- Build logs 확인
- `amplify.yml` 경로 확인 (`frontend/` 폴더)
- 환경변수 `VITE_*` 정확한지 확인

### 5. SSL 인증서 에러
- ACM에서 인증서 상태 확인 (Issued)
- DNS 레코드 전파 대기 (최대 48시간)
- `nslookup api.webapperp.ai.kr`로 DNS 확인

---

## 🚀 지속적 배포 (CI/CD)

### GitHub Actions으로 자동 배포

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Deploy to Elastic Beanstalk
        uses: einaregilsson/beanstalk-deploy@v21
        with:
          aws_access_key: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws_secret_key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          application_name: erp-backend
          environment_name: erp-backend-prod
          version_label: ${{ github.sha }}
          region: ap-northeast-2
          deployment_package: backend.zip

      - name: Create deployment package
        run: |
          cd backend
          npm ci
          npm run build
          zip -r ../backend.zip . -x "*.git*" "node_modules/*" "src/*"

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # Amplify는 자동으로 GitHub 연동하여 배포됨
      # 별도 스텝 불필요
```

---

## 📊 모니터링 및 로깅

### CloudWatch 대시보드 설정
1. CloudWatch → **Dashboards** → **Create dashboard**
2. 위젯 추가:
   - **EC2 CPU Utilization**
   - **RDS Database Connections**
   - **Elastic Beanstalk Health**
   - **Application Load Balancer Request Count**

### 로그 수집
- **Elastic Beanstalk Logs**: CloudWatch Logs로 자동 수집
- **RDS Logs**: 슬로우 쿼리 로그 활성화
- **Amplify Logs**: 빌드 및 액세스 로그

---

## 🎯 다음 단계

1. **백업 자동화**
   - RDS 자동 백업 (매일)
   - S3에 백업 저장

2. **CDN 추가**
   - CloudFront를 통한 정적 파일 캐싱
   - 전 세계 엣지 로케이션 활용

3. **CI/CD 구축**
   - GitHub Actions 또는 AWS CodePipeline
   - 자동 테스트 + 배포

4. **보안 강화**
   - AWS WAF 적용
   - AWS Shield (DDoS 방어)
   - VPN/Bastion Host로 DB 접근 제한

---

## 📞 빠른 배포 명령어 요약

```bash
# 1. RDS 생성 (웹 콘솔)

# 2. Backend 배포
cd backend
eb init -p node.js-18 -r ap-northeast-2 erp-backend
eb create erp-backend-prod --instance-type t3.micro --single
eb setenv NODE_ENV=production DB_HOST=... DB_PASSWORD=... JWT_SECRET=...
eb deploy

# 3. Frontend 배포 (Amplify 웹 콘솔)

# 4. Route 53 도메인 연결 (웹 콘솔)

# 5. 최종 확인
curl https://api.webapperp.ai.kr/api/health
curl https://webapperp.ai.kr
```

---

## 📚 참고 자료

- [AWS Elastic Beanstalk 공식 문서](https://docs.aws.amazon.com/elasticbeanstalk/)
- [AWS Amplify 공식 문서](https://docs.amplify.aws/)
- [AWS RDS PostgreSQL 공식 문서](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/)
- [Route 53 공식 문서](https://docs.aws.amazon.com/route53/)

---

## 💡 추가 질문이 있으시면 언제든지 물어보세요!

- Elastic Beanstalk 대신 ECS/Fargate 사용하고 싶으신가요?
- Docker 컨테이너로 배포하고 싶으신가요?
- Lambda 서버리스 배포를 원하시나요?
