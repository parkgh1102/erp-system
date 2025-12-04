# 가비아 도메인 Azure 연결 가이드

Azure 배포가 완료된 후 가비아 도메인을 연결하는 상세한 단계입니다.

---

## 📋 목차
1. [준비 사항](#준비-사항)
2. [Azure에서 도메인 유효성 검사 정보 가져오기](#1단계-azure에서-도메인-유효성-검사-정보-가져오기)
3. [가비아 DNS 설정](#2단계-가비아-dns-설정)
4. [DNS 전파 확인](#3단계-dns-전파-확인)
5. [Azure에서 도메인 유효성 검사 완료](#4단계-azure에서-도메인-유효성-검사-완료)
6. [SSL 인증서 설정](#5단계-ssl-인증서-설정)
7. [환경 변수 업데이트](#6단계-환경-변수-업데이트)
8. [최종 테스트](#7단계-최종-테스트)

---

## 준비 사항

### 필요한 정보
- ✅ 가비아에서 구매한 도메인 (예: `yourdomain.com`)
- ✅ Azure 백엔드 App Service URL (예: `erp-backend-app.azurewebsites.net`)
- ✅ Azure 프론트엔드 URL (Static Web App 또는 App Service)
- ✅ 가비아 계정 로그인 정보

### 도메인 구조 계획
일반적인 설정:
- **프론트엔드**: `https://www.yourdomain.com` 또는 `https://yourdomain.com`
- **백엔드 API**: `https://api.yourdomain.com`

---

## 1단계: Azure에서 도메인 유효성 검사 정보 가져오기

### A. 백엔드 API 도메인 (api.yourdomain.com)

#### 1. Azure Portal 접속
```
https://portal.azure.com
```

#### 2. App Service 찾기
- 좌측 메뉴에서 **"App Services"** 클릭
- 백엔드 앱 선택 (예: `erp-backend-app`)

#### 3. 사용자 지정 도메인 메뉴 열기
- 좌측 사이드바 → **"설정"** → **"사용자 지정 도메인"**

#### 4. 도메인 추가 시작
- **"+ 사용자 지정 도메인 추가"** 클릭

#### 5. 도메인 정보 입력
- **호스트 이름**: `api.yourdomain.com` 입력
  - `yourdomain.com` 부분을 본인의 실제 도메인으로 변경하세요
- **도메인 공급자**: `다른 모든 도메인 서비스` 선택

#### 6. 유효성 검사 정보 확인 ⚠️
화면에 표시되는 정보를 메모하세요:

```
CNAME 레코드:
호스트: api
값: erp-backend-app.azurewebsites.net

TXT 레코드:
호스트: asuid.api
값: 1234567890ABCDEF1234567890ABCDEF... (긴 영숫자 문자열)
```

**📝 메모장에 복사해두세요!** (아직 "추가" 버튼은 누르지 마세요)

---

### B. 프론트엔드 도메인 (www.yourdomain.com)

#### Static Web App 사용하는 경우:

1. Azure Portal → **"Static Web Apps"**
2. 프론트엔드 앱 선택 (예: `erp-frontend`)
3. **"사용자 지정 도메인"** 클릭
4. **"+ 추가"** 클릭
5. **호스트 이름**: `www.yourdomain.com` 입력

화면에 표시되는 정보 메모:
```
CNAME 레코드:
호스트: www
값: nice-hill-0123abc.azurestaticapps.net (실제 URL 확인)

TXT 레코드:
호스트: _dnsauth.www
값: 0987654321ABCDEF... (긴 문자열)
```

#### App Service 사용하는 경우:

1. **"App Services"** → 프론트엔드 앱 선택
2. **"사용자 지정 도메인"** 클릭
3. **"+ 사용자 지정 도메인 추가"** 클릭
4. **호스트 이름**: `www.yourdomain.com` 입력

화면에 표시되는 정보 메모:
```
CNAME 레코드:
호스트: www
값: erp-frontend-app.azurewebsites.net

TXT 레코드:
호스트: asuid.www
값: 0987654321ABCDEF... (긴 문자열)
```

**📝 이 정보도 메모장에 복사해두세요!**

---

## 2단계: 가비아 DNS 설정

### 1. 가비아 로그인
```
https://www.gabia.com
```
우측 상단 **"로그인"** 클릭 → 계정 정보 입력

### 2. 도메인 관리 페이지 이동
1. 로그인 후 우측 상단 **"My가비아"** 클릭
2. 좌측 메뉴에서 **"서비스 관리"** 클릭
3. **"도메인"** 탭 클릭
4. 본인의 도메인 목록에서 연결할 도메인 찾기

### 3. DNS 관리 화면 열기
- 도메인 오른쪽에 있는 **"관리"** 버튼 클릭
- 또는 **"DNS 정보"** 버튼 클릭
- **"DNS 관리"** 또는 **"DNS 설정"** 메뉴 선택

> ⚠️ **주의**: 네임서버가 가비아 기본 네임서버로 설정되어 있어야 합니다.
> 확인: `ns.gabia.co.kr`, `ns1.gabia.co.kr` 등

### 4. DNS 레코드 추가하기

#### ✅ 백엔드 API용 DNS 레코드

**레코드 1: CNAME 레코드 (백엔드)**

1. **"레코드 추가"** 또는 **"+ 추가"** 버튼 클릭
2. 다음과 같이 입력:

```
┌─────────────────────────────────────────┐
│ 레코드 타입: CNAME                      │
│ 호스트(Host): api                       │
│ 값(Value/Points to):                    │
│   erp-backend-app.azurewebsites.net     │
│   (본인의 백엔드 URL)                   │
│ TTL: 3600 (1시간, 기본값)               │
└─────────────────────────────────────────┘
```

3. **"확인"** 또는 **"저장"** 클릭

**레코드 2: TXT 레코드 (백엔드 유효성 검사용)**

1. **"레코드 추가"** 버튼 다시 클릭
2. 다음과 같이 입력:

```
┌─────────────────────────────────────────┐
│ 레코드 타입: TXT                        │
│ 호스트(Host): asuid.api                 │
│ 값(Value):                              │
│   [Azure에서 복사한 긴 문자열 붙여넣기] │
│   (예: 1A2B3C4D5E6F7G8H9I0J...)        │
│ TTL: 3600                               │
└─────────────────────────────────────────┘
```

3. **"확인"** 클릭

---

#### ✅ 프론트엔드용 DNS 레코드

**레코드 3: CNAME 레코드 (프론트엔드)**

1. **"레코드 추가"** 클릭
2. 다음과 같이 입력:

**Static Web App 사용 시:**
```
┌─────────────────────────────────────────┐
│ 레코드 타입: CNAME                      │
│ 호스트(Host): www                       │
│ 값(Value):                              │
│   [본인의 Static Web App URL]           │
│   (예: nice-hill-123.azurestaticapps.net)│
│ TTL: 3600                               │
└─────────────────────────────────────────┘
```

**App Service 사용 시:**
```
┌─────────────────────────────────────────┐
│ 레코드 타입: CNAME                      │
│ 호스트(Host): www                       │
│ 값(Value):                              │
│   erp-frontend-app.azurewebsites.net    │
│ TTL: 3600                               │
└─────────────────────────────────────────┘
```

3. **"확인"** 클릭

**레코드 4: TXT 레코드 (프론트엔드 유효성 검사용)**

1. **"레코드 추가"** 클릭
2. 다음과 같이 입력:

**Static Web App 사용 시:**
```
┌─────────────────────────────────────────┐
│ 레코드 타입: TXT                        │
│ 호스트(Host): _dnsauth.www              │
│ 값(Value):                              │
│   [Azure에서 복사한 값]                 │
│ TTL: 3600                               │
└─────────────────────────────────────────┘
```

**App Service 사용 시:**
```
┌─────────────────────────────────────────┐
│ 레코드 타입: TXT                        │
│ 호스트(Host): asuid.www                 │
│ 값(Value):                              │
│   [Azure에서 복사한 값]                 │
│ TTL: 3600                               │
└─────────────────────────────────────────┘
```

3. **"확인"** 클릭

---

### 5. 루트 도메인 (yourdomain.com) 설정 (선택사항)

`www.yourdomain.com` 대신 `yourdomain.com`을 사용하려는 경우:

#### 옵션 A: ALIAS 레코드 사용 (가비아가 지원하는 경우)

```
┌─────────────────────────────────────────┐
│ 레코드 타입: ALIAS (또는 ANAME)         │
│ 호스트(Host): @ (또는 비워둠)           │
│ 값(Value): [Azure URL]                  │
│ TTL: 3600                               │
└─────────────────────────────────────────┘
```

#### 옵션 B: A 레코드 사용 (Static Web App만 가능)

1. Azure Static Web App → 사용자 지정 도메인 → IP 주소 확인
2. 가비아에서:

```
┌─────────────────────────────────────────┐
│ 레코드 타입: A                          │
│ 호스트(Host): @ (또는 비워둠)           │
│ 값(Value): [Azure 제공 IP 주소]         │
│   (예: 20.41.123.45)                    │
│ TTL: 3600                               │
└─────────────────────────────────────────┘
```

TXT 레코드도 추가:
```
┌─────────────────────────────────────────┐
│ 레코드 타입: TXT                        │
│ 호스트(Host): _dnsauth (또는 asuid)     │
│ 값(Value): [Azure 제공 값]              │
│ TTL: 3600                               │
└─────────────────────────────────────────┘
```

#### 옵션 C: URL 전달 사용 (가장 간단)

1. `www.yourdomain.com` 설정 (위 단계 완료)
2. 가비아에서 **"부가서비스"** → **"URL 전달"** 메뉴 선택
3. `yourdomain.com` → `https://www.yourdomain.com` 리디렉션 설정

---

### 6. DNS 설정 확인 및 저장

모든 레코드 추가 후 설정 화면에서 다음과 같이 표시되어야 합니다:

```
┌──────────┬────────────────┬────────────────────────────────────┐
│ 타입     │ 호스트         │ 값/위치                            │
├──────────┼────────────────┼────────────────────────────────────┤
│ CNAME    │ api            │ erp-backend-app.azurewebsites.net  │
│ TXT      │ asuid.api      │ 1A2B3C4D5E6F...                    │
│ CNAME    │ www            │ [프론트엔드 URL]                   │
│ TXT      │ _dnsauth.www   │ 9I8H7G6F5E4D...                    │
└──────────┴────────────────┴────────────────────────────────────┘
```

**"적용"** 또는 **"확인"** 버튼을 눌러 변경사항을 저장합니다.

---

## 3단계: DNS 전파 확인

### 1. 대기 시간
- DNS 변경사항이 전파되는 시간: **5분 ~ 48시간**
- 일반적으로 **10분 ~ 2시간** 정도 소요됩니다
- 가비아는 비교적 빠른 편입니다 (보통 10-30분)

### 2. Windows에서 DNS 확인

명령 프롬프트(CMD) 또는 PowerShell을 열고:

#### 백엔드 API 도메인 확인
```bash
nslookup api.yourdomain.com
```

**정상 응답 예시:**
```
서버:  dns.google
Address:  8.8.8.8

권한 없는 응답:
이름:    api.yourdomain.com
Address:  20.41.123.45
```

#### 프론트엔드 도메인 확인
```bash
nslookup www.yourdomain.com
```

**정상 응답 예시:**
```
서버:  dns.google
Address:  8.8.8.8

권한 없는 응답:
이름:    www.yourdomain.com
Address:  20.194.66.77
```

### 3. 온라인 도구로 확인

다음 사이트에서 DNS 전파 상태를 확인할 수 있습니다:

```
https://www.whatsmydns.net/
```

1. 사이트 접속
2. 도메인 입력: `api.yourdomain.com`
3. 레코드 타입 선택: `CNAME`
4. **"Search"** 클릭
5. 전 세계 DNS 서버에서 전파 상태 확인 (녹색 체크 = 전파 완료)

`www.yourdomain.com`도 동일하게 확인하세요.

### 4. DNS 캐시 초기화 (선택사항)

DNS가 전파되었는데도 접속이 안 되는 경우:

```bash
# Windows
ipconfig /flushdns

# 출력: Windows IP 구성이 DNS 확인 프로그램 캐시를 플러시했습니다.
```

---

## 4단계: Azure에서 도메인 유효성 검사 완료

DNS 전파가 완료되면 (10-30분 후), Azure로 돌아가서 도메인을 추가합니다.

### A. 백엔드 도메인 유효성 검사

1. Azure Portal → **App Service (백엔드)** → **"사용자 지정 도메인"**
2. 이전에 열어둔 **"사용자 지정 도메인 추가"** 화면으로 이동
   - 화면을 닫았다면 다시 **"+ 사용자 지정 도메인 추가"** 클릭
   - 호스트 이름: `api.yourdomain.com` 입력
3. **"유효성 검사"** 버튼 클릭

**성공 시:**
- ✅ 녹색 체크 마크와 "도메인 소유권 확인됨" 메시지
- **"추가"** 버튼이 활성화됨

**실패 시:**
- ❌ 빨간색 X 또는 오류 메시지
- DNS 설정을 다시 확인하거나 10분 더 기다렸다가 재시도

4. **"추가"** 버튼 클릭하여 도메인 추가 완료

---

### B. 프론트엔드 도메인 유효성 검사

1. Azure Portal → **Static Web App 또는 App Service (프론트엔드)** → **"사용자 지정 도메인"**
2. **"+ 추가"** 클릭 (또는 이전 화면)
3. 호스트 이름: `www.yourdomain.com` 입력
4. **"유효성 검사"** 클릭
5. 성공하면 **"추가"** 클릭

---

## 5단계: SSL 인증서 설정

도메인 추가가 완료되면 HTTPS(SSL)를 활성화합니다.

### A. 백엔드 SSL 설정

1. **App Service (백엔드)** → **"사용자 지정 도메인"**
2. 방금 추가한 도메인 `api.yourdomain.com` 옆에 **"바인딩 추가"** 또는 **"TLS/SSL 바인딩 추가"** 클릭
3. 설정:
   ```
   사용자 지정 도메인: api.yourdomain.com
   TLS/SSL 유형: SNI SSL (권장)
   인증서: "새 App Service 관리형 인증서 만들기" 선택
   ```
4. **"추가"** 또는 **"유효성 검사"** → **"추가"** 클릭
5. 인증서 발급 대기 (2-5분)

### B. 프론트엔드 SSL 설정

**Static Web App의 경우:**
- Static Web App은 자동으로 무료 SSL 인증서를 발급합니다
- 추가 작업 필요 없음

**App Service의 경우:**
- 백엔드와 동일하게 TLS/SSL 바인딩 추가

### C. HTTPS 리디렉션 활성화

#### 백엔드:
1. **App Service (백엔드)** → **"TLS/SSL 설정"**
2. **"HTTPS만"** 토글을 **켜기(On)**로 설정
3. 변경사항 자동 저장

#### 프론트엔드:
- Static Web App은 기본적으로 HTTPS 리디렉션 활성화됨
- App Service 사용 시 동일하게 **"HTTPS만"** 활성화

---

## 6단계: 환경 변수 업데이트

커스텀 도메인 설정이 완료되면 환경 변수를 업데이트해야 합니다.

### A. 백엔드 환경 변수 업데이트

1. **App Service (백엔드)** → **"구성"** → **"애플리케이션 설정"**
2. `FRONTEND_URL` 찾기 → **"편집"** 클릭
3. 값 변경:
   ```
   기존: https://erp-frontend-app.azurewebsites.net
   변경: https://www.yourdomain.com
   ```
   (또는 `https://yourdomain.com` 사용하는 경우 해당 URL)
4. **"확인"** 클릭
5. 상단의 **"저장"** 버튼 클릭
6. **"계속"** 클릭 (앱 재시작 확인)

### B. 프론트엔드 환경 변수 업데이트

#### Static Web App의 경우:
1. **Static Web App** → **"구성"** → **"애플리케이션 설정"**
2. `VITE_API_URL` 찾기 → **"편집"** 클릭
3. 값 변경:
   ```
   기존: https://erp-backend-app.azurewebsites.net/api
   변경: https://api.yourdomain.com/api
   ```
4. **"저장"** 클릭

#### App Service의 경우:
- 동일한 방법으로 업데이트

### C. 프론트엔드 재배포 (중요!)

프론트엔드는 환경 변수를 빌드 타임에 포함시키므로 **반드시 재배포**해야 합니다.

#### 로컬에서 재배포하는 경우:

1. 프로젝트 루트 디렉토리에서:
```bash
cd frontend

# .env.production 파일 생성/수정
echo "VITE_API_URL=https://api.yourdomain.com/api" > .env.production
echo "VITE_APP_ENV=production" >> .env.production
echo "VITE_ENABLE_LOGGING=false" >> .env.production
echo "VITE_ENFORCE_HTTPS=true" >> .env.production

# 재빌드
npm install
npm run build

# Azure Static Web App에 배포 (Azure CLI)
# (또는 Azure Portal에서 수동 업로드)
```

#### GitHub Actions 사용하는 경우:

1. `.env.production` 파일 업데이트 (위와 동일)
2. Git에 커밋 및 푸시:
```bash
git add .
git commit -m "Update production API URL to custom domain"
git push origin main
```
3. GitHub Actions가 자동으로 배포 실행
4. GitHub 리포지토리 → **"Actions"** 탭에서 진행 상황 확인

---

## 7단계: 최종 테스트

모든 설정이 완료되었습니다! 이제 테스트해봅시다.

### 1. 백엔드 API 테스트

브라우저 또는 명령 프롬프트에서:

```bash
curl https://api.yourdomain.com/api/health
```

**예상 응답:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-04T..."
}
```

또는 브라우저에서:
```
https://api.yourdomain.com/api/health
```

### 2. 프론트엔드 접속 테스트

브라우저에서:
```
https://www.yourdomain.com
```

또는

```
https://yourdomain.com
```

**확인 사항:**
- ✅ 로그인 페이지가 정상적으로 로드되는지
- ✅ 주소창에 자물쇠 아이콘(HTTPS)이 표시되는지
- ✅ 브라우저 개발자 도구(F12) → Console 탭에 CORS 에러가 없는지

### 3. HTTPS 리디렉션 테스트

HTTP로 접속 시 자동으로 HTTPS로 리디렉션되는지 확인:

```
http://www.yourdomain.com
→ https://www.yourdomain.com (자동 전환)

http://api.yourdomain.com
→ https://api.yourdomain.com (자동 전환)
```

### 4. 로그인 및 기능 테스트

1. 프론트엔드에서 로그인 시도
2. 대시보드 접속
3. 주요 기능 (거래처 조회, 매출 등록 등) 정상 동작 확인

### 5. 브라우저 개발자 도구로 API 호출 확인

1. 프론트엔드 페이지에서 **F12** (개발자 도구)
2. **"Network"** 탭 선택
3. 페이지 새로고침 (F5)
4. API 요청들이 `https://api.yourdomain.com/api/...`로 전송되는지 확인
5. 상태 코드가 200 OK인지 확인

---

## 🎉 완료!

축하합니다! 가비아 도메인이 Azure 서비스에 성공적으로 연결되었습니다.

### 최종 확인 체크리스트

- [ ] `https://api.yourdomain.com/api/health` → 200 OK 응답
- [ ] `https://www.yourdomain.com` → 프론트엔드 정상 로드
- [ ] HTTPS 리디렉션 동작 (HTTP → HTTPS)
- [ ] SSL 인증서 유효 (자물쇠 아이콘)
- [ ] 로그인 기능 정상 작동
- [ ] API 호출 성공 (CORS 에러 없음)
- [ ] 브라우저에서 모든 기능 테스트 완료

---

## 🔧 문제 해결

### 문제 1: DNS가 전파되지 않음

**증상:**
```
nslookup api.yourdomain.com
서버를 찾을 수 없음: Non-existent domain
```

**해결:**
1. 가비아 DNS 설정 재확인
2. 호스트명 정확한지 확인 (`api`, `www` 등)
3. 값(Value)에 마침표(`.`)가 끝에 없는지 확인
4. 30분 더 대기 후 재확인

---

### 문제 2: Azure 도메인 유효성 검사 실패

**증상:**
Azure에서 "도메인 소유권을 확인할 수 없습니다" 오류

**해결:**
1. TXT 레코드가 정확히 입력되었는지 확인
2. 호스트명: `asuid.api` (백엔드) 또는 `_dnsauth.www` (Static Web App)
3. 값을 복사할 때 공백이나 줄바꿈이 포함되지 않았는지 확인
4. DNS 캐시 초기화: `ipconfig /flushdns`
5. 10분 대기 후 재시도

---

### 문제 3: SSL 인증서 발급 실패

**증상:**
"인증서를 발급할 수 없습니다" 오류

**해결:**
1. 도메인 유효성 검사가 완료되었는지 확인
2. CNAME 레코드가 정확한지 재확인
3. Azure Portal에서 도메인 다시 추가 시도
4. 최대 24시간 대기 (보통 5-10분이면 발급)

---

### 문제 4: 프론트엔드에서 API 호출 실패 (CORS 오류)

**증상:**
브라우저 Console에 다음과 같은 오류:
```
Access to XMLHttpRequest at 'https://api.yourdomain.com/api/...'
from origin 'https://www.yourdomain.com' has been blocked by CORS policy
```

**해결:**
1. 백엔드 환경 변수 `FRONTEND_URL` 확인
   - 정확한 프론트엔드 URL인지 (https 포함)
   - `https://www.yourdomain.com` (www 포함 여부 주의)
2. 백엔드 재시작:
   - Azure Portal → App Service → **"다시 시작"**
3. 10분 대기 후 재확인

---

### 문제 5: 프론트엔드가 여전히 Azure URL로 API 호출

**증상:**
브라우저 Network 탭에서 여전히 `erp-backend-app.azurewebsites.net`로 요청

**해결:**
1. 프론트엔드 환경 변수 `VITE_API_URL` 업데이트 확인
2. **프론트엔드를 반드시 재빌드 및 재배포**해야 함
3. 브라우저 캐시 완전 삭제 (Ctrl+Shift+Delete)
4. 시크릿/비공개 모드로 테스트

---

### 문제 6: HTTP로 접속 시 HTTPS로 리디렉션 안 됨

**해결:**
1. Azure Portal → App Service → **"TLS/SSL 설정"**
2. **"HTTPS만"** 토글 활성화 확인
3. 앱 재시작

---

### 문제 7: "이 사이트에 연결할 수 없음" (ERR_NAME_NOT_RESOLVED)

**해결:**
1. DNS 전파 대기 (최대 48시간, 보통 1-2시간)
2. `nslookup` 명령으로 DNS 전파 확인
3. 다른 네트워크(모바일 데이터 등)에서 테스트
4. https://www.whatsmydns.net/ 에서 전 세계 전파 상태 확인

---

## 📞 추가 지원

### 유용한 명령어

```bash
# DNS 확인
nslookup api.yourdomain.com
nslookup www.yourdomain.com

# DNS 캐시 초기화
ipconfig /flushdns

# 백엔드 상태 확인
curl https://api.yourdomain.com/api/health

# Azure 앱 재시작 (Azure CLI)
az webapp restart --name erp-backend-app --resource-group erp-system-rg

# 백엔드 로그 확인
az webapp log tail --name erp-backend-app --resource-group erp-system-rg
```

### 참고 링크

- [Azure App Service 커스텀 도메인 문서](https://learn.microsoft.com/ko-kr/azure/app-service/app-service-web-tutorial-custom-domain)
- [Azure Static Web Apps 커스텀 도메인 문서](https://learn.microsoft.com/ko-kr/azure/static-web-apps/custom-domain)
- [가비아 DNS 설정 가이드](https://customer.gabia.com/)

---

**설정 완료를 축하합니다! 🎊**

이제 본인의 도메인으로 ERP 시스템을 사용할 수 있습니다.
