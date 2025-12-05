# DNS 설정 가이드 - www.webapperp.ai.kr

## 🚨 현재 문제

**오류:** `ERR_CERT_COMMON_NAME_INVALID`
**원인:** DNS 레코드가 CNAME이 아닌 A 레코드로 설정되어 있음

## ✅ 올바른 DNS 설정

### Azure Static Web Apps에 필요한 CNAME 레코드

```
레코드 타입: CNAME
호스트(이름): www
값(대상): white-ocean-03a1f7000.3.azurestaticapps.net
TTL: 3600 (1시간)
```

## 📝 도메인 등록 업체별 설정 방법

### 가비아 (gabia.com)

1. [My가비아](https://my.gabia.com) 로그인
2. **도메인** → **DNS 관리** 클릭
3. **webapperp.ai.kr** 선택
4. **레코드 수정** 클릭
5. 기존 `www` A 레코드 삭제
   - 호스트: www
   - 값: 121.254.178.230 (삭제)
6. **레코드 추가** 클릭
   - 타입: CNAME
   - 호스트: www
   - 값/위치: white-ocean-03a1f7000.3.azurestaticapps.net
   - TTL: 3600
7. **저장** 클릭

### 후이즈 (whois.co.kr)

1. [후이즈](https://www.whois.co.kr) 로그인
2. **도메인 관리** → **네임서버/DNS 설정**
3. **webapperp.ai.kr** 선택
4. **DNS 레코드 관리**
5. 기존 `www` A 레코드 삭제
6. **레코드 추가**
   - 타입: CNAME
   - 호스트: www
   - 값: white-ocean-03a1f7000.3.azurestaticapps.net
   - TTL: 3600
7. **적용**

### Cloudflare

1. [Cloudflare Dashboard](https://dash.cloudflare.com) 로그인
2. **webapperp.ai.kr** 도메인 선택
3. **DNS** 메뉴 클릭
4. 기존 `www` A 레코드 삭제
5. **Add record** 클릭
   - Type: CNAME
   - Name: www
   - Target: white-ocean-03a1f7000.3.azurestaticapps.net
   - Proxy status: DNS only (프록시 비활성화 - 회색 구름)
   - TTL: Auto
6. **Save**

### Route53 (AWS)

1. [AWS Route53 Console](https://console.aws.amazon.com/route53) 로그인
2. **Hosted zones** → **webapperp.ai.kr** 선택
3. 기존 `www` A 레코드 삭제
4. **Create record** 클릭
   - Record name: www
   - Record type: CNAME
   - Value: white-ocean-03a1f7000.3.azurestaticapps.net
   - TTL: 300
5. **Create records**

## 🔍 DNS 변경 확인 방법

### Windows (명령 프롬프트 또는 PowerShell)
```bash
nslookup www.webapperp.ai.kr
```

**올바른 결과 예시:**
```
이름:    white-ocean-03a1f7000.3.azurestaticapps.net
Address:  13.75.93.156
Aliases:  www.webapperp.ai.kr
```

### 온라인 DNS 체크 도구
- https://www.whatsmydns.net/#CNAME/www.webapperp.ai.kr
- https://mxtoolbox.com/SuperTool.aspx?action=cname%3awww.webapperp.ai.kr

## ⏱️ DNS 전파 시간

- **최소:** 10분
- **일반:** 1-2시간
- **최대:** 24-48시간 (드물게)

## 🔄 DNS 변경 후 다음 단계

### 1. DNS 전파 확인 (10분 후)
```bash
nslookup www.webapperp.ai.kr
```

### 2. Azure에 커스텀 도메인 추가
```bash
az staticwebapp hostname set \
  --name erp-frontend \
  --resource-group erp-system-rg \
  --hostname www.webapperp.ai.kr
```

### 3. SSL 인증서 자동 발급 대기 (30분~2시간)

### 4. 접속 테스트
```
https://www.webapperp.ai.kr
```

## ✅ 최종 확인 체크리스트

- [ ] DNS 레코드를 CNAME으로 변경
- [ ] `nslookup`으로 CNAME 레코드 확인
- [ ] Azure에 커스텀 도메인 추가
- [ ] SSL 인증서 발급 확인
- [ ] 브라우저에서 정상 접속 확인

## 🆘 여전히 문제가 있다면

### 브라우저 캐시 삭제
- **Chrome:** Ctrl + Shift + Delete → 캐시된 이미지 및 파일 삭제
- **Edge:** Ctrl + Shift + Delete → 캐시된 데이터 및 파일 삭제

### DNS 캐시 삭제 (Windows)
```bash
ipconfig /flushdns
```

### 시크릿 모드로 테스트
- Chrome: Ctrl + Shift + N
- Edge: Ctrl + Shift + P

## 📞 추가 도움

DNS 설정 변경 후에도 문제가 계속되면 알려주세요.
