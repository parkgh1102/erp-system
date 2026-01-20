# Azure 배포 상태 확인 방법

## 1️⃣ Azure Portal - Deployment Center (가장 확실)

### 접속 방법:
```
1. https://portal.azure.com 접속
2. App Service 선택
3. 왼쪽 메뉴 → "Deployment" → "Deployment Center"
```

### 확인 사항:
- **Latest Commit**: `dbdb66d` (최신)
- **Status**: "Success" (초록색)
- **Deployment Time**: 최근 시각 (2-3분 전)

✅ 위 조건이 모두 맞으면 **최신 코드 배포 완료**

---

## 2️⃣ Log Stream - 서버 시작 메시지 확인

### 접속 방법:
```
Azure Portal → App Service → Monitoring → Log stream
```

### 확인할 메시지:
```
✅ Database connected successfully
🚀 Server running on port 3001
📊 Health: http://localhost:3001/health
✅ Server is ready to accept requests
```

**중요:** 재시작하지 않았다면 이 메시지가 안 보일 수 있습니다.

---

## 3️⃣ 현재 커밋 vs 배포된 커밋

### 로컬 최신 커밋:
```bash
git log -1 --oneline
# 출력: dbdb66d Revert: 성능 로깅 제거, 최적화만 유지
```

### Azure에 배포된 커밋:
```
Deployment Center에서 "Latest Commit" 확인
```

**일치해야 함:** `dbdb66d`

---

## 4️⃣ 빠른 확인 - Health Endpoint

### 브라우저에서 접속:
```
https://www.webapperp.ai.kr/api/health
```

### 정상 응답:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-19T...",
  "uptime": "XXX seconds"
}
```

**uptime이 짧으면** (< 5분) → 최근 재시작됨 (최신 코드 가능성 높음)

---

## 5️⃣ 배포 안 됐을 때 강제 배포

### 방법 A: Deployment Center에서 Sync
```
Deployment Center → "Sync" 버튼 클릭
```

### 방법 B: 빈 커밋 푸시
```bash
git commit --allow-empty -m "Force deploy"
git push
```

### 방법 C: 재시작 후 Sync
```
1. App Service 상단 "Restart" 클릭
2. 완료 후 Deployment Center → "Sync"
```

---

## 현재 배포 상태 체크리스트

- [ ] Deployment Center에서 최신 커밋 `dbdb66d` 확인
- [ ] Status가 "Success"인지 확인
- [ ] App Service 재시작 완료
- [ ] Log Stream에서 서버 시작 메시지 확인
- [ ] 로그인 속도 테스트 (3개 계정)

모두 체크되면 **배포 완료!**
