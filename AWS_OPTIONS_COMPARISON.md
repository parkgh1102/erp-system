# 🔍 AWS 배포 옵션 상세 비교

## 📊 배포 방법별 비교표

| 항목 | EC2 | Elastic Beanstalk | ECS/Fargate | Lambda + API Gateway | Amplify + AppRunner |
|------|-----|-------------------|-------------|---------------------|---------------------|
| **난이도** | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ |
| **제어권** | 완전 | 중간 | 높음 | 낮음 | 낮음 |
| **관리 부담** | 높음 | 낮음 | 중간 | 매우 낮음 | 매우 낮음 |
| **확장성** | 수동 | 자동 | 자동 | 자동 | 자동 |
| **비용 (월)** | $15-40 | $15-40 | $20-60 | $5-20 | $10-30 |
| **Cold Start** | 없음 | 없음 | 없음 | 있음 (2-5초) | 없음 |
| **적합한 경우** | 완전한 제어 필요 | 쉬운 배포 원함 | Docker 사용 | 트래픽 변동 큼 | 최소 설정 원함 |

---

## 1️⃣ EC2 인스턴스 (전통적인 방법)

### 장점
- ✅ 완전한 서버 제어
- ✅ 모든 소프트웨어 설치 가능
- ✅ 복잡한 설정 가능
- ✅ SSH 직접 접근

### 단점
- ❌ 수동 설정 및 관리 필요
- ❌ 보안 패치 직접 관리
- ❌ 스케일링 복잡
- ❌ 모니터링 설정 필요

### 비용
```
EC2 t3.small (2 vCPU, 2GB RAM): ~$15/월
RDS db.t3.micro: ~$15/월
총: ~$30/월
```

### 배포 방법
```bash
# 1. EC2 인스턴스 생성
aws ec2 run-instances \
  --image-id ami-0c9c942bd7bf113a2 \
  --instance-type t3.small \
  --key-name your-keypair \
  --security-group-ids sg-xxxxxx

# 2. SSH 접속
ssh -i your-key.pem ec2-user@ec2-xx-xx-xx-xx.compute.amazonaws.com

# 3. Node.js 설치
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs git

# 4. 애플리케이션 배포
git clone https://github.com/your-repo/erp-system.git
cd erp-system/backend
npm install
npm run build

# 5. PM2로 프로세스 관리
sudo npm install -g pm2
pm2 start dist/index.js --name erp-backend
pm2 startup
pm2 save

# 6. Nginx 리버스 프록시
sudo yum install -y nginx
# nginx 설정...
```

---

## 2️⃣ Elastic Beanstalk (권장 ⭐)

### 장점
- ✅ 쉬운 배포 및 관리
- ✅ 자동 스케일링
- ✅ 로드 밸런싱 자동 설정
- ✅ 롤링 배포 지원
- ✅ CloudWatch 통합

### 단점
- ❌ EC2보다 제어권 적음
- ❌ 복잡한 커스터마이징 어려움

### 비용
```
EC2 (EB managed): ~$15/월
Application Load Balancer: ~$20/월 (옵션)
RDS: ~$15/월
총: ~$30-50/월
```

### 배포 방법
```bash
cd backend
eb init -p node.js-18 -r ap-northeast-2 erp-backend
eb create erp-backend-prod --instance-type t3.micro --single
eb setenv NODE_ENV=production DB_HOST=...
eb deploy
```

**자세한 내용:** `AWS_DEPLOYMENT_GUIDE.md` 참고

---

## 3️⃣ ECS + Fargate (컨테이너)

### 장점
- ✅ Docker 기반, 이식성 높음
- ✅ 마이크로서비스 아키텍처 적합
- ✅ 자동 스케일링
- ✅ 서버 관리 불필요 (Fargate)

### 단점
- ❌ Dockerfile 작성 필요
- ❌ 설정 복잡
- ❌ Cold start 있음 (Fargate)
- ❌ EC2보다 비쌈

### 비용
```
Fargate vCPU (0.25): $10/월
Fargate Memory (0.5GB): $5/월
ALB: ~$20/월
RDS: ~$15/월
총: ~$50/월
```

### 배포 방법
```bash
# 1. Dockerfile 작성
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["npm", "start"]

# 2. ECR에 이미지 푸시
aws ecr create-repository --repository-name erp-backend
docker build -t erp-backend .
docker tag erp-backend:latest xxx.dkr.ecr.ap-northeast-2.amazonaws.com/erp-backend:latest
aws ecr get-login-password | docker login --username AWS --password-stdin xxx.dkr.ecr...
docker push xxx.dkr.ecr.ap-northeast-2.amazonaws.com/erp-backend:latest

# 3. ECS 클러스터 생성
aws ecs create-cluster --cluster-name erp-cluster

# 4. Task Definition 작성
# ecs-task-definition.json
{
  "family": "erp-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [{
    "name": "erp-backend",
    "image": "xxx.dkr.ecr.ap-northeast-2.amazonaws.com/erp-backend:latest",
    "portMappings": [{"containerPort": 8080}],
    "environment": [
      {"name": "NODE_ENV", "value": "production"},
      {"name": "DB_HOST", "value": "..."}
    ]
  }]
}

# 5. Service 생성
aws ecs create-service \
  --cluster erp-cluster \
  --service-name erp-backend-service \
  --task-definition erp-backend \
  --desired-count 1 \
  --launch-type FARGATE
```

---

## 4️⃣ Lambda + API Gateway (서버리스)

### 장점
- ✅ 사용량 기반 과금 (비용 절감)
- ✅ 자동 확장
- ✅ 서버 관리 불필요
- ✅ 낮은 트래픽 시 매우 저렴

### 단점
- ❌ Cold start 문제 (2-5초)
- ❌ 실행 시간 제한 (15분)
- ❌ TypeORM 같은 ORM 문제
- ❌ Express 앱 구조 변경 필요
- ❌ WebSocket 제한적

### 비용
```
Lambda 호출 (100만 요청): $0.20
Lambda 실행 시간 (400,000 GB-초): $6.67
API Gateway (100만 요청): $3.50
RDS Proxy (필요시): ~$15/월
총: ~$10-25/월 (트래픽에 따라 다름)
```

### 배포 방법
```bash
# 1. Serverless Framework 설치
npm install -g serverless

# 2. serverless.yml 작성
service: erp-backend
provider:
  name: aws
  runtime: nodejs18.x
  region: ap-northeast-2
functions:
  api:
    handler: dist/lambda.handler
    events:
      - httpApi: '*'

# 3. Lambda 핸들러 작성
# backend/src/lambda.ts
import serverlessExpress from '@vendia/serverless-express';
import app from './app';

export const handler = serverlessExpress({ app });

# 4. 배포
sls deploy
```

**⚠️ 주의:** Express 앱을 Lambda에 맞게 수정 필요

---

## 5️⃣ Amplify + App Runner

### 장점
- ✅ 가장 쉬운 배포
- ✅ GitHub 연동 자동 배포
- ✅ SSL 자동 발급
- ✅ CDN 자동 설정

### 단점
- ❌ 제어권 제한적
- ❌ 복잡한 커스터마이징 어려움
- ❌ App Runner는 Docker 필요

### 비용
```
Amplify (빌드 + 호스팅): ~$5/월
App Runner (1 vCPU, 2GB): ~$20/월
RDS: ~$15/월
총: ~$40/월
```

### 배포 방법

**Frontend (Amplify):**
- AWS Console → Amplify → GitHub 연결
- 자동 배포

**Backend (App Runner):**
```bash
# 1. Dockerfile 작성 (위 ECS 섹션 참고)

# 2. ECR에 푸시 (위 ECS 섹션 참고)

# 3. App Runner 서비스 생성
aws apprunner create-service \
  --service-name erp-backend \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "xxx.dkr.ecr...amazonaws.com/erp-backend:latest",
      "ImageRepositoryType": "ECR"
    },
    "AutoDeploymentsEnabled": true
  }' \
  --instance-configuration '{
    "Cpu": "1 vCPU",
    "Memory": "2 GB"
  }'
```

---

## 🎯 어떤 방법을 선택해야 할까?

### 초보자 / 빠른 배포 원함
→ **Elastic Beanstalk** ⭐ (권장)

### 완전한 제어 / DevOps 경험 있음
→ **EC2 직접 설정**

### Docker 사용 / 마이크로서비스
→ **ECS + Fargate**

### 트래픽 변동 큼 / 비용 최소화
→ **Lambda + API Gateway** (구조 변경 필요)

### 최소한의 설정 / 스타트업
→ **Amplify + App Runner**

---

## 📋 결론 및 추천

현재 ERP 시스템에는 **Elastic Beanstalk + RDS + Amplify** 조합을 추천합니다.

**이유:**
1. ✅ 설정이 간단함
2. ✅ 자동 스케일링 지원
3. ✅ 프리티어 1년 무료
4. ✅ Express 앱 그대로 배포 가능
5. ✅ 모니터링 및 로깅 자동 설정

**다음 단계:**
- `AWS_DEPLOYMENT_GUIDE.md` - 전체 배포 가이드
- `AWS_QUICK_START.md` - 5분 만에 배포하기

---

## 💡 추가 질문

- Docker 컨테이너로 배포하고 싶으신가요? → ECS 가이드 작성 가능
- 서버리스로 전환하고 싶으신가요? → Lambda 마이그레이션 가이드 작성 가능
- EC2 직접 설정하고 싶으신가요? → 상세 EC2 가이드 작성 가능
