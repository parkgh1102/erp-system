# AWS CLI 및 EB CLI 설치 스크립트 (Windows PowerShell)
# 관리자 권한으로 실행하세요

Write-Host "==================================" -ForegroundColor Green
Write-Host "AWS CLI 및 EB CLI 설치 시작" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

# 1. AWS CLI 설치
Write-Host "`n[1/4] AWS CLI 다운로드 및 설치 중..." -ForegroundColor Yellow

$awsCliUrl = "https://awscli.amazonaws.com/AWSCLIV2.msi"
$awsCliInstaller = "$env:TEMP\AWSCLIV2.msi"

try {
    # AWS CLI 다운로드
    Write-Host "AWS CLI 다운로드 중..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri $awsCliUrl -OutFile $awsCliInstaller

    # AWS CLI 설치
    Write-Host "AWS CLI 설치 중... (잠시 기다려주세요)" -ForegroundColor Cyan
    Start-Process msiexec.exe -Wait -ArgumentList "/i $awsCliInstaller /quiet /norestart"

    Write-Host "✓ AWS CLI 설치 완료!" -ForegroundColor Green
} catch {
    Write-Host "✗ AWS CLI 설치 실패: $_" -ForegroundColor Red
    Write-Host "수동 설치: https://awscli.amazonaws.com/AWSCLIV2.msi" -ForegroundColor Yellow
}

# 2. Python 확인 및 설치
Write-Host "`n[2/4] Python 확인 중..." -ForegroundColor Yellow

try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python이 이미 설치되어 있습니다: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "Python이 설치되어 있지 않습니다." -ForegroundColor Red
    Write-Host "Python 다운로드: https://www.python.org/downloads/" -ForegroundColor Yellow
    Write-Host "설치 시 'Add Python to PATH' 옵션을 체크하세요!" -ForegroundColor Yellow

    # Python 다운로드 페이지 열기
    Start-Process "https://www.python.org/downloads/"

    Write-Host "`nPython 설치 후 이 스크립트를 다시 실행하세요." -ForegroundColor Yellow
    exit
}

# 3. pip 업그레이드
Write-Host "`n[3/4] pip 업그레이드 중..." -ForegroundColor Yellow

try {
    python -m pip install --upgrade pip
    Write-Host "✓ pip 업그레이드 완료!" -ForegroundColor Green
} catch {
    Write-Host "✗ pip 업그레이드 실패: $_" -ForegroundColor Red
}

# 4. EB CLI 설치
Write-Host "`n[4/4] EB CLI 설치 중..." -ForegroundColor Yellow

try {
    pip install awsebcli --upgrade
    Write-Host "✓ EB CLI 설치 완료!" -ForegroundColor Green
} catch {
    Write-Host "✗ EB CLI 설치 실패: $_" -ForegroundColor Red
}

# 설치 확인
Write-Host "`n==================================" -ForegroundColor Green
Write-Host "설치 확인" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

Write-Host "`nPowerShell을 재시작한 후 다음 명령어로 확인하세요:" -ForegroundColor Yellow
Write-Host "aws --version" -ForegroundColor Cyan
Write-Host "eb --version" -ForegroundColor Cyan

Write-Host "`n다음 단계:" -ForegroundColor Yellow
Write-Host "1. PowerShell 재시작" -ForegroundColor White
Write-Host "2. aws configure 실행하여 자격증명 설정" -ForegroundColor White

Write-Host "`n설치가 완료되었습니다!" -ForegroundColor Green
