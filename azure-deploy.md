# Azure App Service 배포 및 재시작 방법

## 방법 1: Azure Portal에서 재시작 (가장 쉬움)

1. [Azure Portal](https://portal.azure.com) 접속
2. App Service 선택
3. 상단 메뉴에서 **"Restart"** 클릭
4. 2-3분 대기 후 로그 확인

## 방법 2: Azure CLI로 재시작

```bash
# Azure CLI 로그인
az login

# App Service 재시작
az webapp restart --name <your-app-name> --resource-group <your-resource-group>

# 로그 실시간 확인
az webapp log tail --name <your-app-name> --resource-group <your-resource-group>
```

## 방법 3: Git Push 후 자동 배포 확인

```bash
# Deployment Center에서 확인
# Azure Portal > App Service > Deployment > Deployment Center
# 최근 배포 상태 확인
```

## 배포 후 로그 확인

### Azure Portal Log Stream
1. Azure Portal > App Service
2. 왼쪽 메뉴 > **Monitoring** > **Log stream**
3. 실시간 로그 확인

### SSH로 확인
```bash
# Kudu Console 접속 (더 쉬움)
https://<your-app-name>.scm.azurewebsites.net

# 또는 SSH
ssh <username>@<your-app-name>.azurewebsites.net

# 로그 확인
tail -f /home/LogFiles/stdout*.log
```

## 현재 문제 해결

성능 로그가 안 보이는 이유:
1. ✅ 코드는 푸시됨 (2ba97a9 커밋)
2. ❌ Azure가 아직 최신 코드를 pull 하지 않음

**해결 방법:**
- Azure Portal에서 **Restart** 버튼 클릭
- 또는 Deployment Center에서 수동 배포 트리거
