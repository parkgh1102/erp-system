# Azure ERP 시스템 배포 스크립트
# PowerShell 7 이상 권장

param(
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = "erp-system-rg",

    [Parameter(Mandatory=$false)]
    [string]$Location = "koreacentral",

    [Parameter(Mandatory=$false)]
    [string]$DBPassword = "",

    [Parameter(Mandatory=$false)]
    [switch]$SkipDatabase = $false,

    [Parameter(Mandatory=$false)]
    [switch]$SkipBackend = $false,

    [Parameter(Mandatory=$false)]
    [switch]$SkipFrontend = $false
)

# 색상 출력 함수
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Step {
    param([string]$Message)
    Write-ColorOutput "`n[단계] $Message" "Cyan"
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✅ $Message" "Green"
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "❌ $Message" "Red"
}

function Write-Info {
    param([string]$Message)
    Write-ColorOutput "ℹ️  $Message" "Yellow"
}

# 스크립트 시작
Write-ColorOutput "`n================================" "Magenta"
Write-ColorOutput "   Azure ERP 시스템 배포" "Magenta"
Write-ColorOutput "================================`n" "Magenta"

# Azure CLI 확인
Write-Step "Azure CLI 확인 중..."
try {
    $azVersion = az version --output json 2>$null | ConvertFrom-Json
    Write-Success "Azure CLI 설치됨: $($azVersion.'azure-cli')"
} catch {
    Write-Error "Azure CLI가 설치되지 않았습니다."
    Write-Info "설치: winget install Microsoft.AzureCLI"
    exit 1
}

# Azure 로그인 확인
Write-Step "Azure 로그인 확인 중..."
$accountInfo = az account show 2>$null
if (!$accountInfo) {
    Write-Info "Azure 로그인이 필요합니다."
    az login
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Azure 로그인 실패"
        exit 1
    }
}

$account = az account show | ConvertFrom-Json
Write-Success "로그인됨: $($account.user.name)"
Write-Info "구독: $($account.name)"

# 리소스 그룹 생성
Write-Step "리소스 그룹 생성 중..."
$rgExists = az group exists --name $ResourceGroup
if ($rgExists -eq "true") {
    Write-Info "리소스 그룹이 이미 존재합니다: $ResourceGroup"
} else {
    az group create --name $ResourceGroup --location $Location --output none
    if ($LASTEXITCODE -eq 0) {
        Write-Success "리소스 그룹 생성됨: $ResourceGroup"
    } else {
        Write-Error "리소스 그룹 생성 실패"
        exit 1
    }
}

# 고유한 이름 생성
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$uniqueSuffix = $timestamp.Substring($timestamp.Length - 8)

# ======================
# 데이터베이스 배포
# ======================
$dbServerName = ""
$dbHost = ""

if (-not $SkipDatabase) {
    Write-Step "PostgreSQL 데이터베이스 생성 중..."

    # DB 암호 확인
    if ([string]::IsNullOrEmpty($DBPassword)) {
        $DBPassword = Read-Host "PostgreSQL 관리자 암호 입력 (8자 이상, 영문+숫자+특수문자)" -AsSecureString
        $DBPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($DBPassword)
        )
    }

    $dbServerName = "erp-postgres-$uniqueSuffix"
    $dbHost = "$dbServerName.postgres.database.azure.com"

    Write-Info "서버 이름: $dbServerName"
    Write-Info "위치: $Location"
    Write-Info "이 작업은 5-10분 정도 걸립니다..."

    # PostgreSQL Flexible Server 생성
    az postgres flexible-server create `
        --resource-group $ResourceGroup `
        --name $dbServerName `
        --location $Location `
        --admin-user erpadmin `
        --admin-password $DBPassword `
        --sku-name Standard_B1ms `
        --tier Burstable `
        --version 16 `
        --storage-size 32 `
        --public-access 0.0.0.0-255.255.255.255 `
        --output none

    if ($LASTEXITCODE -eq 0) {
        Write-Success "PostgreSQL 서버 생성됨: $dbHost"

        # 데이터베이스 생성
        Write-Info "데이터베이스 생성 중..."
        az postgres flexible-server db create `
            --resource-group $ResourceGroup `
            --server-name $dbServerName `
            --database-name erp_system `
            --output none

        if ($LASTEXITCODE -eq 0) {
            Write-Success "데이터베이스 생성됨: erp_system"
        }

        # 방화벽 규칙 (Azure 서비스 허용)
        az postgres flexible-server firewall-rule create `
            --resource-group $ResourceGroup `
            --name $dbServerName `
            --rule-name AllowAzureServices `
            --start-ip-address 0.0.0.0 `
            --end-ip-address 0.0.0.0 `
            --output none

    } else {
        Write-Error "PostgreSQL 서버 생성 실패"
        exit 1
    }
} else {
    Write-Info "데이터베이스 생성 건너뛰기 (기존 DB 사용)"
    $dbHost = Read-Host "기존 PostgreSQL 호스트 입력 (예: erp-postgres-xxx.postgres.database.azure.com)"
    $DBPassword = Read-Host "PostgreSQL 암호 입력" -AsSecureString
    $DBPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($DBPassword)
    )
}

# ======================
# 백엔드 배포
# ======================
$backendUrl = ""

if (-not $SkipBackend) {
    Write-Step "백엔드 빌드 중..."

    Push-Location backend

    # 의존성 설치
    Write-Info "npm install 실행 중..."
    npm install --silent

    if ($LASTEXITCODE -ne 0) {
        Write-Error "npm install 실패"
        Pop-Location
        exit 1
    }

    # TypeScript 빌드
    Write-Info "TypeScript 빌드 중..."
    npm run build --silent

    if ($LASTEXITCODE -ne 0) {
        Write-Error "빌드 실패"
        Pop-Location
        exit 1
    }

    Write-Success "백엔드 빌드 완료"
    Pop-Location

    # App Service 플랜 생성
    Write-Step "App Service 플랜 생성 중..."
    $planName = "erp-service-plan"

    $planExists = az appservice plan show --name $planName --resource-group $ResourceGroup 2>$null
    if (!$planExists) {
        az appservice plan create `
            --name $planName `
            --resource-group $ResourceGroup `
            --location $Location `
            --sku B1 `
            --is-linux `
            --output none

        if ($LASTEXITCODE -eq 0) {
            Write-Success "App Service 플랜 생성됨"
        } else {
            Write-Error "App Service 플랜 생성 실패"
            exit 1
        }
    } else {
        Write-Info "기존 App Service 플랜 사용: $planName"
    }

    # App Service 생성
    Write-Step "백엔드 App Service 생성 중..."
    $backendName = "erp-backend-$uniqueSuffix"
    $backendUrl = "https://$backendName.azurewebsites.net"

    az webapp create `
        --resource-group $ResourceGroup `
        --plan $planName `
        --name $backendName `
        --runtime "NODE:20-lts" `
        --output none

    if ($LASTEXITCODE -ne 0) {
        Write-Error "App Service 생성 실패"
        exit 1
    }

    Write-Success "App Service 생성됨: $backendName"

    # 환경 변수 설정
    Write-Step "환경 변수 설정 중..."

    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

    az webapp config appsettings set `
        --resource-group $ResourceGroup `
        --name $backendName `
        --settings `
            NODE_ENV=production `
            PORT=8080 `
            JWT_SECRET=$jwtSecret `
            DB_TYPE=postgres `
            DB_HOST=$dbHost `
            DB_PORT=5432 `
            DB_USERNAME=erpadmin `
            DB_PASSWORD=$DBPassword `
            DB_DATABASE=erp_system `
            DB_SSL=true `
            CLIENT_URL="https://your-frontend-url.azurestaticapps.net" `
        --output none

    Write-Success "환경 변수 설정 완료"

    # 시작 명령 설정
    az webapp config set `
        --resource-group $ResourceGroup `
        --name $backendName `
        --startup-file "node dist/index.js" `
        --output none

    # ZIP 배포
    Write-Step "백엔드 배포 중..."

    $zipPath = "backend-deploy-$uniqueSuffix.zip"

    if (Test-Path $zipPath) {
        Remove-Item $zipPath -Force
    }

    Compress-Archive -Path "backend\*" -DestinationPath $zipPath -Force

    az webapp deployment source config-zip `
        --resource-group $ResourceGroup `
        --name $backendName `
        --src $zipPath `
        --output none

    if ($LASTEXITCODE -eq 0) {
        Write-Success "백엔드 배포 완료!"
        Write-Info "Backend URL: $backendUrl"

        # 로그 스트리밍 활성화
        az webapp log config `
            --resource-group $ResourceGroup `
            --name $backendName `
            --application-logging filesystem `
            --level information `
            --output none
    } else {
        Write-Error "배포 실패"
        exit 1
    }

    # ZIP 파일 정리
    Remove-Item $zipPath -Force

} else {
    Write-Info "백엔드 배포 건너뛰기"
    $backendUrl = Read-Host "기존 백엔드 URL 입력"
}

# ======================
# 프론트엔드 배포 안내
# ======================
if (-not $SkipFrontend) {
    Write-Step "프론트엔드 배포 안내"

    Write-ColorOutput "`n프론트엔드는 Azure Portal에서 배포하는 것을 권장합니다:`n" "Yellow"
    Write-ColorOutput "1. Azure Portal 접속: https://portal.azure.com" "White"
    Write-ColorOutput "2. '리소스 만들기' → 'Static Web App' 검색" "White"
    Write-ColorOutput "3. 기본 정보 입력:" "White"
    Write-ColorOutput "   - 리소스 그룹: $ResourceGroup" "Gray"
    Write-ColorOutput "   - 이름: erp-frontend" "Gray"
    Write-ColorOutput "   - 지역: East Asia" "Gray"
    Write-ColorOutput "4. GitHub 연결 및 빌드 설정:" "White"
    Write-ColorOutput "   - 앱 위치: /frontend" "Gray"
    Write-ColorOutput "   - 출력 위치: dist" "Gray"
    Write-ColorOutput "5. 환경 변수 추가 (구성 → 애플리케이션 설정):" "White"
    Write-ColorOutput "   - VITE_API_URL=$backendUrl/api" "Gray"
    Write-ColorOutput ""

    Write-Info "또는 frontend/.env.production 파일에 다음 내용 추가:"
    Write-ColorOutput "VITE_API_URL=$backendUrl/api" "Gray"
}

# ======================
# 배포 완료
# ======================
Write-ColorOutput "`n================================" "Green"
Write-ColorOutput "   배포 완료!" "Green"
Write-ColorOutput "================================`n" "Green"

Write-ColorOutput "📊 배포 정보:" "Cyan"
Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Cyan"

if (-not $SkipDatabase) {
    Write-ColorOutput "`n🗄️  데이터베이스:" "Yellow"
    Write-ColorOutput "   호스트: $dbHost" "White"
    Write-ColorOutput "   사용자: erpadmin" "White"
    Write-ColorOutput "   데이터베이스: erp_system" "White"
}

if (-not $SkipBackend) {
    Write-ColorOutput "`n🖥️  백엔드:" "Yellow"
    Write-ColorOutput "   URL: $backendUrl" "White"
    Write-ColorOutput "   API: $backendUrl/api" "White"
}

Write-ColorOutput "`n📚 다음 단계:" "Cyan"
Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Cyan"
Write-ColorOutput "1. 프론트엔드 배포 (위 안내 참고)" "White"
Write-ColorOutput "2. 환경 변수 VITE_API_URL 설정" "White"
Write-ColorOutput "3. 배포 확인: $backendUrl/health" "White"
Write-ColorOutput "4. 로그 확인: az webapp log tail --resource-group $ResourceGroup --name $backendName" "White"

Write-ColorOutput "`n🔗 유용한 링크:" "Cyan"
Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Cyan"
Write-ColorOutput "Azure Portal: https://portal.azure.com" "White"
Write-ColorOutput "리소스 그룹: https://portal.azure.com/#@/resource/subscriptions/$($account.id)/resourceGroups/$ResourceGroup" "White"

Write-ColorOutput "`n✅ 배포 스크립트 완료!`n" "Green"
