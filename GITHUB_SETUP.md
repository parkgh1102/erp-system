# GitHub 저장소 연결 가이드

## ✅ Git 초기화 완료!

로컬 Git 저장소가 생성되고 첫 커밋이 완료되었습니다.

---

## 📝 다음 단계

### 1. GitHub에서 새 저장소 만들기

1. https://github.com 접속 및 로그인
2. 오른쪽 상단 **+** 클릭 → **New repository** 선택
3. 저장소 정보 입력:
   - **Repository name**: `erp-system` (또는 원하는 이름)
   - **Description**: `ERP 통합 시스템`
   - **Public** 또는 **Private** 선택 (추천: Private)
   - ❌ **Initialize this repository with a README** 체크 해제 (이미 로컬에 파일이 있음)
4. **Create repository** 클릭

---

### 2. 로컬 저장소를 GitHub에 연결

GitHub에서 저장소를 만들면 나오는 URL을 복사하세요.
예: `https://github.com/your-username/erp-system.git`

#### Windows PowerShell 또는 CMD에서 실행:

```bash
cd "C:\Users\black\Desktop\신erp1013"

# GitHub 저장소 연결 (URL을 본인의 것으로 변경)
git remote add origin https://github.com/your-username/erp-system.git

# 확인
git remote -v

# GitHub에 푸시
git push -u origin master
```

#### Git Bash 사용 시:

```bash
cd "/c/Users/black/Desktop/신erp1013"
git remote add origin https://github.com/your-username/erp-system.git
git push -u origin master
```

---

### 3. GitHub 인증

푸시할 때 인증이 필요할 수 있습니다:

#### 방법 1: Personal Access Token (추천)
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. **Generate new token (classic)** 클릭
3. 권한 선택:
   - ✅ `repo` (전체 선택)
4. **Generate token** 클릭
5. **토큰을 복사**하여 안전한 곳에 보관

푸시할 때:
- Username: GitHub 사용자명
- Password: 위에서 생성한 토큰 입력

#### 방법 2: GitHub CLI (gh)
```bash
# GitHub CLI 설치 (Windows)
winget install GitHub.cli

# 로그인
gh auth login

# 푸시
git push -u origin master
```

---

### 4. 푸시 확인

```bash
git push -u origin master
```

성공 메시지 예시:
```
Enumerating objects: 328, done.
Counting objects: 100% (328/328), done.
...
To https://github.com/your-username/erp-system.git
 * [new branch]      master -> master
Branch 'master' set up to track remote branch 'master' from 'origin'.
```

---

## 🚀 Railway 배포

GitHub에 푸시가 완료되면 Railway 배포를 진행하세요!

### Railway 배포 단계:

1. **https://railway.app** 접속
2. GitHub 계정으로 로그인
3. **New Project** 클릭
4. **Provision PostgreSQL** 클릭
5. **New Service** → **Deploy from GitHub repo** 선택
6. 방금 생성한 저장소 선택

자세한 내용은 `DEPLOYMENT.md` 파일을 참고하세요.

---

## 🔄 향후 업데이트 방법

코드를 수정한 후:

```bash
cd "C:\Users\black\Desktop\신erp1013"
git add .
git commit -m "업데이트 내용 설명"
git push
```

Railway가 자동으로 변경사항을 감지하고 재배포합니다.

---

## 🆘 문제 해결

### remote origin이 이미 존재하는 경우
```bash
git remote remove origin
git remote add origin https://github.com/your-username/erp-system.git
```

### 브랜치 이름이 다른 경우 (main vs master)
```bash
git branch -M main
git push -u origin main
```

### 403 에러 (인증 실패)
- Personal Access Token을 다시 확인
- 토큰 권한이 `repo`를 포함하는지 확인

---

## ✅ 체크리스트

- [ ] GitHub에서 새 저장소 생성
- [ ] 로컬 저장소를 GitHub에 연결 (`git remote add origin`)
- [ ] GitHub에 푸시 (`git push -u origin master`)
- [ ] Railway에서 저장소 연결
- [ ] 배포 완료!

완료! 🎉
