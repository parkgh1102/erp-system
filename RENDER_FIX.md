# Render 배포 문제 해결 가이드

## 현재 상황
- render.yaml의 startCommand가 "node dist/index.js"로 설정되어 있음
- 하지만 Render가 여전히 "npm start" (→ "node start.js")를 실행
- 캐시 또는 웹 UI 설정이 render.yaml을 오버라이드하고 있음

## 수동 해결 방법

### 1. Render 대시보드에서 직접 수정
1. https://dashboard.render.com/ 접속
2. "erp-backend-gaee" 서비스 클릭
3. "Settings" 탭으로 이동
4. "Build & Deploy" 섹션에서:
   - **Build Command**: `npm install --no-workspaces --ignore-scripts && npm run build`
   - **Start Command**: `node dist/index.js`
5. "Save Changes" 클릭
6. "Manual Deploy" → "Deploy latest commit" 클릭

### 2. Blueprint 재적용 (권장)
1. Render 대시보드에서 서비스 삭제
2. "New +" → "Blueprint" 선택
3. GitHub 저장소 `parkgh1102/erp-system` 연결
4. render.yaml 자동 감지 및 적용

## 올바른 설정값

```yaml
# render.yaml
services:
  - type: web
    name: erp-backend
    rootDir: backend
    buildCommand: |
      npm install --no-workspaces --ignore-scripts
      npm run build
    startCommand: node dist/index.js  # 이것이 핵심!
```

## 확인 방법
배포 로그에서 다음을 확인:
```
Starting service with command: node dist/index.js
```

이 줄이 보여야 성공입니다!
