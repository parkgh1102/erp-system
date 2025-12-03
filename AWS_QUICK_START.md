# ⚡ AWS 배포 빠른 시작 가이드

## 🎯 5분 만에 AWS 배포하기

### 1️⃣ 사전 준비 (한 번만 설정)

```bash
# AWS CLI 설치
choco install awscli  # Windows
# 또는 https://aws.amazon.com/cli/

# EB CLI 설치
pip install awsebcli --upgrade

# AWS 자격증명 설정
aws configure
# AWS Access Key ID: [IAM에서 발급]
# AWS Secret Access Key: [IAM에서 발급]
# Region: ap-northeast-2 (서울)
```

---

## 2️⃣ RDS PostgreSQL 데이터베이스 생성

**AWS Console → RDS → Create database**

```yaml
엔진: PostgreSQL 15.x
템플릿: Free tier
식별자: erp-database
사용자명: erp_admin
비밀번호: [강력한 비밀번호]
인스턴스: db.t3.micro
스토리지: 20GB
퍼블릭 액세스: Yes
데이터베이스 이름: erp_system
```

**완료 후 Endpoint 복사:**
```
erp-database.xxxxxx.ap-northeast-2.rds.amazonaws.com
```

---

## 3️⃣ 백엔드 배포 (Elastic Beanstalk)

```bash
cd backend

# EB 초기화
eb init

# 설정:
# - Region: ap-northeast-2
# - Application: erp-backend
# - Platform: Node.js 18
# - SSH: Yes

# 환경 생성 및 배포
eb create erp-backend-prod --instance-type t3.micro --single

# 환경변수 설정
eb setenv \
  NODE_ENV=production \
  PORT=8080 \
  DB_TYPE=postgres \
  DB_HOST=erp-database.xxxxxx.ap-northeast-2.rds.amazonaws.com \
  DB_PORT=5432 \
  DB_USERNAME=erp_admin \
  DB_PASSWORD=your-password \
  DB_DATABASE=erp_system \
  JWT_SECRET=$(openssl rand -hex 32) \
  JWT_REFRESH_SECRET=$(openssl rand -hex 32) \
  SESSION_SECRET=$(openssl rand -hex 32) \
  JWT_EXPIRES_IN=15m \
  JWT_REFRESH_EXPIRES_IN=7d \
  BCRYPT_ROUNDS=12 \
  FRONTEND_URL=https://main.xxxxxx.amplifyapp.com

# 배포 확인
eb health
eb open
```

**RDS 보안 그룹 업데이트:**
1. RDS → erp-database → Connectivity
2. Security group 클릭
3. Inbound rules → Edit
4. Add rule: PostgreSQL (5432), Source: EB 보안 그룹

---

## 4️⃣ 프론트엔드 배포 (Amplify)

**AWS Console → Amplify → New app → Host web app**

1. **GitHub 연결**
   - Repository 선택
   - Branch: main

2. **Build settings**
   - 자동 감지된 `amplify.yml` 사용

3. **Environment variables**
   ```
   VITE_API_URL=http://erp-backend-prod.xxxxxx.elasticbeanstalk.com/api
   VITE_ENFORCE_HTTPS=true
   VITE_APP_ENV=production
   ```

4. **Save and deploy** 클릭

5. **배포 URL 확인**
   ```
   https://main.xxxxxx.amplifyapp.com
   ```

---

## 5️⃣ 최종 환경변수 업데이트

**Elastic Beanstalk 환경변수 업데이트:**
```bash
cd backend
eb setenv FRONTEND_URL=https://main.xxxxxx.amplifyapp.com
```

**또는 EB Console에서:**
- Configuration → Software → Environment properties
- `FRONTEND_URL` 수정 → Apply

---

## ✅ 배포 확인

```bash
# Backend Health Check
curl http://erp-backend-prod.xxxxxx.elasticbeanstalk.com/api/health

# Frontend 접속
# https://main.xxxxxx.amplifyapp.com
```

**로그인 테스트:**
- 기본 계정이 있다면 로그인
- 데이터 CRUD 동작 확인

---

## 🌐 커스텀 도메인 연결 (선택사항)

### Route 53 설정

**1. Hosted Zone 생성**
```bash
aws route53 create-hosted-zone --name webapperp.ai.kr --caller-reference $(date +%s)
```

**2. 가비아에서 네임서버 변경**
- Route 53의 NS 레코드 4개 복사
- 가비아 → 도메인 관리 → 네임서버 설정
- AWS 네임서버 입력

**3. Amplify 커스텀 도메인**
- Amplify Console → Domain management
- Add domain: `webapperp.ai.kr`
- SSL 자동 발급 (10-20분)

**4. Elastic Beanstalk 커스텀 도메인**
- EB Console → Configuration → Load balancer
- Add listener: HTTPS:443
- SSL certificate: ACM에서 `api.webapperp.ai.kr` 요청
- Route 53에 CNAME 추가:
  ```
  api.webapperp.ai.kr → erp-backend-prod.xxxxxx.elasticbeanstalk.com
  ```

**5. 환경변수 최종 업데이트**
```bash
# Backend
eb setenv FRONTEND_URL=https://webapperp.ai.kr

# Frontend (Amplify Console)
VITE_API_URL=https://api.webapperp.ai.kr/api
```

---

## 🔄 지속적 배포 (CI/CD)

**GitHub Secrets 설정:**
1. GitHub Repository → Settings → Secrets
2. Add secrets:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

**이제 `main` 브랜치에 push하면 자동 배포됩니다!**

```bash
git add .
git commit -m "Deploy to AWS"
git push origin main

# GitHub Actions에서 자동 배포 진행
# Amplify는 자동으로 프론트엔드 배포
```

---

## 🛠️ 유용한 명령어

```bash
# 백엔드 로그 확인
eb logs
eb logs --stream

# 백엔드 SSH 접속
eb ssh

# 백엔드 상태 확인
eb health
eb status

# 백엔드 환경변수 확인
eb printenv

# 백엔드 재배포
eb deploy

# 백엔드 환경 재시작
eb restart

# 백엔드 환경 종료
eb terminate erp-backend-prod

# RDS 연결 테스트 (로컬에서)
psql -h erp-database.xxxxxx.rds.amazonaws.com -U erp_admin -d erp_system
```

---

## 🔧 문제 해결

### Backend 502 Bad Gateway
```bash
# 로그 확인
eb logs

# 환경변수 확인
eb printenv

# 재배포
eb deploy
```

### RDS 연결 실패
```bash
# 보안 그룹 확인
aws ec2 describe-security-groups --group-ids sg-xxxxxx

# 또는 EB 인스턴스에서 직접 테스트
eb ssh
psql -h $DB_HOST -U $DB_USERNAME -d $DB_DATABASE
```

### Amplify 빌드 실패
- Amplify Console → Build logs 확인
- `amplify.yml` 경로 확인
- 환경변수 확인

### CORS 에러
```bash
# FRONTEND_URL 확인
eb printenv | grep FRONTEND_URL

# 정확한 URL로 업데이트 (슬래시 없이)
eb setenv FRONTEND_URL=https://webapperp.ai.kr
```

---

## 💰 예상 비용

### 프리티어 (12개월)
- **RDS**: $0 (750시간/월)
- **EC2**: $0 (750시간/월)
- **Amplify**: $0 (무료 티어 내)
- **Route 53**: $0.50/월
- **총계**: ~$0.50/월

### 프리티어 이후
- **RDS db.t3.micro**: ~$15/월
- **EC2 t3.small**: ~$15/월
- **Amplify**: ~$5/월
- **Route 53**: ~$1/월
- **데이터 전송**: ~$9/월
- **총계**: ~$45/월

---

## 📞 도움이 필요하신가요?

자세한 내용은 `AWS_DEPLOYMENT_GUIDE.md`를 참고하세요!

**주요 문서:**
- [AWS_DEPLOYMENT_GUIDE.md](./AWS_DEPLOYMENT_GUIDE.md) - 전체 가이드
- [.env.aws.example](./.env.aws.example) - 환경변수 템플릿
- [deploy-aws.sh](./deploy-aws.sh) - 배포 스크립트
