# ⚡ 빠른 시작 가이드

## 지금 바로 따라하세요!

### 1️⃣ GitHub 저장소 만들기 (2분)

1. https://github.com/new 접속
2. 입력:
   - **Repository name:** `erp-system`
   - **Private** 선택
   - ❌ README, .gitignore, license 체크하지 마세요!
3. **Create repository** 클릭

---

### 2️⃣ 로컬 코드를 GitHub에 푸시 (3분)

**명령 프롬프트 (CMD)를 열고 다음 명령어를 순서대로 실행:**

```bash
# 1. 프로젝트 폴더로 이동
cd "C:\Users\black\Desktop\신erp1125 완성"

# 2. 기존 원격 저장소 제거 (있다면)
git remote remove origin

# 3. 새 GitHub 저장소 연결 (본인의 저장소 URL로 변경!)
git remote add origin https://github.com/본인아이디/erp-system.git

# 예시:
# git remote add origin https://github.com/parkgh1102/erp-system.git

# 4. 모든 변경사항 추가
git add .

# 5. 커밋
git commit -m "Initial commit: ERP System"

# 6. 브랜치 이름 확인/변경
git branch -M main

# 7. GitHub에 푸시
git push -u origin main
```

**⚠️ 인증 요청 시:**
- Username: GitHub 아이디
- Password: **Personal Access Token** (아래에서 생성)

---

### 🔑 Personal Access Token 만들기 (1분)

푸시 시 Password를 요구하면:

1. https://github.com/settings/tokens 접속
2. **Generate new token** → **Generate new token (classic)**
3. 입력:
   - Note: `erp-deploy`
   - Expiration: `90 days`
   - ✅ **repo** (전체 체크)
   - ✅ **workflow** 체크
4. **Generate token** 클릭
5. **토큰 복사** (한 번만 보임!)
6. 명령 프롬프트 Password에 붙여넣기

---

### 3️⃣ Render 배포 (5분)

1. **https://render.com** 접속
2. **Sign up with GitHub** (GitHub 계정으로 로그인)
3. 우측 상단 **New +** → **Blueprint**
4. 저장소 검색: **erp-system**
5. **Connect** 클릭
6. 설정 확인 후 **Apply** 클릭
7. ⏱️ 5-8분 대기

---

### ✅ 완료 확인

**배포 성공 확인:**
```
Status: 🟢 Live
URL: https://erp-backend-xxxx.onrender.com
```

**API 테스트:**
```
https://erp-backend-xxxx.onrender.com/api/health

응답:
{
  "status": "OK",
  "database": "connected"
}
```

**프론트엔드 테스트:**
```
https://webapperp.ai.kr
→ 로그인 성공! ✅
```

---

## 🎉 완료!

**이제부터:**
- 코드 수정 → `git add .` → `git commit -m "메시지"` → `git push`
- Render가 자동으로 배포!

---

## 📚 자세한 가이드

더 자세한 내용은 다음 파일 참조:
- **GITHUB_RENDER_COMPLETE_GUIDE.md** - 전체 과정 상세 설명
- **RENDER_DEPLOY_GUIDE.md** - Render 배포 가이드
- **RENDER_FIX.md** - 문제 해결 가이드
