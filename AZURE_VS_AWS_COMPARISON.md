# ☁️ Azure vs AWS 배포 비교 가이드

## 📊 한눈에 보는 비교

| 항목 | Azure | AWS |
|------|-------|-----|
| **한국 리전** | ✅ Korea Central (서울) | ✅ ap-northeast-2 (서울) |
| **프론트엔드** | Static Web Apps (무료) | Amplify (무료 빌드 1000분) |
| **백엔드** | App Service (₩20,000/월) | Elastic Beanstalk (₩15,000/월) |
| **데이터베이스** | PostgreSQL Flexible (₩15,000/월) | RDS PostgreSQL (₩20,000/월) |
| **SSL 인증서** | 무료 자동 제공 | 무료 자동 제공 |
| **자동 배포** | GitHub Actions 기본 지원 | CodePipeline 또는 Amplify |
| **모니터링** | Application Insights | CloudWatch |
| **월 예상 비용** | ~₩35,000-50,000 | ~₩35,000-60,000 |
| **배포 난이도** | ⭐⭐⭐ (중간) | ⭐⭐⭐⭐ (어려움) |
| **한글 지원** | ✅ 우수 | ⚠️ 보통 |
| **커뮤니티** | 보통 | 많음 |

---

## 🔵 Azure 상세

### 장점

1. **한국 사용자에게 최적화**
   - Korea Central 리전 (서울)
   - 낮은 네트워크 레이턴시
   - 한글 문서 및 지원

2. **간편한 배포**
   - Static Web Apps: GitHub 연동 후 자동 배포
   - App Service: ZIP 파일 업로드 또는 GitHub Actions
   - Portal UI가 직관적

3. **비용 효율적인 프론트엔드**
   - Static Web Apps Free 티어
   - 월 100GB 대역폭 무료
   - SSL 인증서 무료

4. **강력한 통합**
   - Visual Studio/VS Code 완벽 통합
   - Azure DevOps 기본 지원
   - Microsoft 생태계 (Office 365, Teams 등)

5. **보안 및 컴플라이언스**
   - Azure Active Directory 통합
   - 한국 데이터 주권 준수
   - ISO, SOC 인증

### 단점

1. **생태계 크기**
   - AWS보다 작은 서드파티 생태계
   - 일부 서비스 AWS보다 늦게 출시

2. **학습 곡선**
   - Azure 특유의 용어와 개념
   - Portal 인터페이스 복잡도

3. **가격 예측성**
   - 일부 서비스 요금제가 복잡
   - 숨겨진 비용 가능성

### 추천 대상

✅ **Azure를 선택하면 좋은 경우:**
- 한국 사용자 위주의 서비스
- Microsoft 생태계 사용 중 (Office 365, Teams)
- .NET 또는 Windows 기반 애플리케이션
- 빠른 배포와 간편한 관리 선호
- 중소기업 또는 스타트업

---

## 🟠 AWS 상세

### 장점

1. **가장 큰 클라우드 생태계**
   - 압도적으로 많은 서비스 (200+)
   - 풍부한 서드파티 통합
   - 방대한 커뮤니티와 자료

2. **유연한 확장성**
   - Auto Scaling 정교한 설정
   - Lambda 등 서버리스 옵션 다양
   - 글로벌 네트워크 (CloudFront CDN)

3. **프리티어 혜택**
   - 12개월 무료 EC2, RDS 등
   - 영구 무료 Lambda 100만 요청/월
   - DynamoDB 무료 티어

4. **성숙한 서비스**
   - 오랜 운영 경험
   - 안정적인 서비스 품질
   - 다양한 사례 연구

5. **개발자 도구**
   - CodePipeline, CodeBuild
   - CloudFormation (IaC)
   - 다양한 SDK 지원

### 단점

1. **복잡한 설정**
   - IAM 권한 설정 복잡
   - 네트워킹 설정 (VPC, Security Group)
   - 많은 옵션으로 인한 선택 피로

2. **비용 관리**
   - 복잡한 요금제
   - 예상치 못한 비용 발생 가능
   - 세밀한 모니터링 필요

3. **한글 지원**
   - 일부 서비스만 한글 지원
   - 주로 영문 문서

### 추천 대상

✅ **AWS를 선택하면 좋은 경우:**
- 글로벌 서비스 (다국적 사용자)
- 복잡한 인프라 요구사항
- 서버리스 아키텍처 선호
- AWS 경험이 있는 팀
- 대규모 엔터프라이즈

---

## 🏗️ 아키텍처 비교

### Azure 아키텍처
```
사용자
  │
  ├─→ Azure Static Web Apps (Frontend)
  │     - React + Vite
  │     - GitHub Actions 자동 배포
  │     - 무료 SSL
  │
  └─→ Azure App Service (Backend)
        - Node.js + Express
        - Linux Container
        - 자동 스케일링
        │
        └─→ Azure Database for PostgreSQL
              - Flexible Server
              - 자동 백업
              - 고가용성 옵션
```

### AWS 아키텍처
```
사용자
  │
  ├─→ AWS Amplify (Frontend)
  │     - React + Vite
  │     - Git 푸시로 자동 배포
  │     - CloudFront CDN
  │
  └─→ Elastic Beanstalk (Backend)
        - Node.js 플랫폼
        - Load Balancer
        - Auto Scaling
        │
        └─→ RDS PostgreSQL
              - Multi-AZ 옵션
              - 자동 백업
              - Read Replica
```

---

## 💰 비용 상세 비교 (월간 기준)

### Azure (한화)
```
📦 Static Web Apps (Frontend)
   - Free 티어: ₩0/월
   - 대역폭 100GB 포함

🖥️  App Service B1 (Backend)
   - 1 vCore, 1.75GB RAM: ₩20,000/월

🗄️  PostgreSQL Flexible B1ms
   - 1 vCore, 2GB RAM: ₩15,000/월
   - 스토리지 32GB: ₩5,000/월

📊 Application Insights
   - 5GB까지 무료: ₩0/월

━━━━━━━━━━━━━━━━━━━━━━━━━━━
총합: 약 ₩40,000/월 (~$30)
```

### AWS (한화)
```
🎨 AWS Amplify (Frontend)
   - 호스팅: ₩2,000/월
   - 빌드 1000분 무료 포함

🖥️  Elastic Beanstalk t3.small (Backend)
   - 2 vCore, 2GB RAM: ₩15,000/월
   - Load Balancer: ₩15,000/월

🗄️  RDS PostgreSQL db.t3.micro
   - 2 vCore, 1GB RAM: ₩20,000/월
   - 스토리지 20GB: ₩3,000/월

📊 CloudWatch
   - 기본 모니터링: ₩0/월
   - 로그 5GB: ₩3,000/월

━━━━━━━━━━━━━━━━━━━━━━━━━━━
총합: 약 ₩58,000/월 (~$45)
```

### 비용 절감 팁

**Azure:**
- Dev/Test 환경: 업무 시간만 실행 (50% 절감)
- Reserved Instances: 1년 예약 시 30% 할인
- Azure Hybrid Benefit: Windows 라이선스 재사용

**AWS:**
- Reserved Instances: 1년 예약 시 40% 할인
- Savings Plans: 유연한 예약 옵션
- Spot Instances: 최대 90% 저렴 (비프로덕션)

---

## 🚀 배포 속도 비교

### 초기 설정 시간

| 단계 | Azure | AWS |
|------|-------|-----|
| 계정 생성 | 5분 | 5분 |
| CLI 설치 | 2분 | 2분 |
| 데이터베이스 생성 | 5분 | 10분 |
| 백엔드 배포 | 3분 | 8분 (EB 환경 생성) |
| 프론트엔드 배포 | 2분 (Portal) | 5분 (Amplify) |
| **총 시간** | **~15분** | **~30분** |

### 지속적 배포 시간

| 작업 | Azure | AWS |
|------|-------|-----|
| 코드 푸시 → 배포 | 3-5분 | 5-10분 |
| 환경 변수 변경 | 즉시 | 즉시 |
| 재시작 | 30초 | 1-2분 |

---

## 🛠️ 개발 경험 비교

### Azure

**CLI 명령어:**
```bash
# 로그인
az login

# 배포
az webapp deployment source config-zip --src deploy.zip

# 로그 확인
az webapp log tail --name erp-backend
```

**장점:**
- 직관적인 명령어 구조
- VS Code 확장 프로그램 우수
- Portal UI 사용하기 쉬움

**단점:**
- 일부 작업은 Portal에서만 가능
- CLI 문서가 AWS보다 부족

### AWS

**CLI 명령어:**
```bash
# 로그인 (프로필 설정)
aws configure

# Elastic Beanstalk 배포
eb init && eb create && eb deploy

# 로그 확인
eb logs -f
```

**장점:**
- 모든 작업 CLI로 가능
- Terraform, Pulumi 등 IaC 도구 풍부
- 방대한 문서와 예제

**단점:**
- IAM 설정 복잡
- 초보자에게 진입 장벽 높음

---

## 📈 확장성 비교

### Azure

**수평 확장:**
- App Service: 최대 100 인스턴스
- Auto Scale 규칙 설정 가능
- Application Gateway로 트래픽 분산

**수직 확장:**
- 실시간 스케일 업/다운 가능
- 다운타임 없음

**글로벌 배포:**
- Azure Front Door (CDN + WAF)
- Traffic Manager (DNS 기반 라우팅)

### AWS

**수평 확장:**
- Elastic Beanstalk: 무제한 인스턴스
- 정교한 Auto Scaling 정책
- Application Load Balancer

**수직 확장:**
- 인스턴스 타입 변경 (일시 중단)
- Blue/Green 배포 권장

**글로벌 배포:**
- CloudFront CDN (전 세계 400+ 엣지)
- Route 53 (Geo-routing, Latency-routing)

---

## 🔐 보안 비교

| 기능 | Azure | AWS |
|------|-------|-----|
| **인증** | Azure AD | IAM, Cognito |
| **방화벽** | Network Security Groups | Security Groups |
| **DDoS 방어** | Azure DDoS Protection | AWS Shield |
| **WAF** | Azure WAF | AWS WAF |
| **비밀 관리** | Key Vault | Secrets Manager |
| **컴플라이언스** | ISO, SOC, GDPR | ISO, SOC, HIPAA |

---

## 🎯 최종 추천

### Azure를 선택하세요 (이 프로젝트 권장)
- ✅ **한국 사용자 대상** 서비스
- ✅ **빠른 배포**가 필요한 경우
- ✅ **중소기업/스타트업** 프로젝트
- ✅ **간단한 인프라** 요구사항
- ✅ **Microsoft 생태계** 사용 중
- ✅ **비용 예측** 가능한 구조 선호

### AWS를 선택하세요
- ✅ **글로벌 서비스** (다국적)
- ✅ **복잡한 인프라** 요구사항
- ✅ **서버리스** 아키텍처 필요
- ✅ **AWS 경험**이 있는 팀
- ✅ **대규모 확장**이 예상되는 경우
- ✅ **다양한 서비스** 통합 필요

---

## 💡 혼합 전략 (하이브리드)

비용 최적화를 위한 혼합 전략도 가능합니다:

### 옵션 1: 멀티 클라우드
```
Frontend → Vercel (무료, 글로벌 CDN)
Backend → Azure App Service (한국 리전)
Database → Azure PostgreSQL (한국 리전)
```

### 옵션 2: 서비스별 최적화
```
Frontend → AWS Amplify (무료 빌드)
Backend → Render (저렴)
Database → Supabase (무료 PostgreSQL)
```

---

## 📚 참고 자료

### Azure
- [Azure 공식 문서](https://docs.microsoft.com/azure)
- [Azure 가격 계산기](https://azure.microsoft.com/pricing/calculator/)
- [Azure 프리티어](https://azure.microsoft.com/free/)

### AWS
- [AWS 공식 문서](https://docs.aws.amazon.com)
- [AWS 요금 계산기](https://calculator.aws/)
- [AWS 프리티어](https://aws.amazon.com/free/)

---

## ✅ 결론

**이 ERP 프로젝트에는 Azure를 권장합니다:**

1. **한국 사용자** 타겟 → 낮은 레이턴시
2. **빠른 배포** → Static Web Apps + App Service
3. **비용 효율** → 월 ₩40,000 정도로 예측 가능
4. **간편한 관리** → Portal UI 직관적
5. **완벽한 가이드** → 위에서 제공한 배포 스크립트 활용

배포를 시작하려면:
- ⚡ [AZURE_QUICK_START.md](./AZURE_QUICK_START.md) - 10분 배포
- 🔵 [AZURE_DEPLOYMENT_GUIDE.md](./AZURE_DEPLOYMENT_GUIDE.md) - 상세 가이드
