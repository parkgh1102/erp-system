# Azure 강제 배포 방법

## 방법 1: Deployment Center에서 Sync

1. Azure Portal 접속
2. App Service 선택
3. 왼쪽 메뉴 → **Deployment** → **Deployment Center**
4. **"Sync"** 또는 **"Redeploy"** 버튼 클릭
5. 배포 로그 확인

## 방법 2: 빈 커밋으로 강제 푸시

```bash
git commit --allow-empty -m "Force redeploy"
git push
```

## 방법 3: App Service 재시작 + 재배포

1. App Service 상단 **"Restart"** 클릭
2. 재시작 완료 후 Deployment Center에서 **"Sync"** 클릭

## 배포 확인

Log Stream에서 다음 확인:
- ✅ Server is ready to accept requests
- 📅 Deployment time: 2026-01-19T... (현재 시각)
- 🔍 로그인 성능 모니터링 활성화됨 ← 이게 있어야 최신 버전

## 로그 확인

로그인 시 다음 형식으로 출력:
```
[INFO] ⚡ 로그인 성능: XXXms {
  ...
}
```
