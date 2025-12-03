# AWS Elastic Beanstalk 배포 패키지 생성 스크립트
# PowerShell에서 실행하세요

Write-Host "=====================================" -ForegroundColor Green
Write-Host "  AWS 배포 패키지 생성 중..." -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# 현재 위치를 backend 폴더로
Set-Location -Path "C:\Users\Administrator\Desktop\신erp1203\backend"

# 임시 배포 폴더 생성
$deployDir = ".\deploy-temp"
if (Test-Path $deployDir) {
    Remove-Item -Path $deployDir -Recurse -Force
}
New-Item -Path $deployDir -ItemType Directory | Out-Null

Write-Host "`n[1/4] 필수 파일 복사 중..." -ForegroundColor Yellow

# dist 폴더 복사
Copy-Item -Path ".\dist" -Destination "$deployDir\dist" -Recurse
Write-Host "  ✓ dist 폴더 복사 완료" -ForegroundColor Cyan

# package.json 복사
Copy-Item -Path ".\package.json" -Destination "$deployDir\package.json"
Write-Host "  ✓ package.json 복사 완료" -ForegroundColor Cyan

# package-lock.json 복사 (있으면)
if (Test-Path ".\package-lock.json") {
    Copy-Item -Path ".\package-lock.json" -Destination "$deployDir\package-lock.json"
    Write-Host "  ✓ package-lock.json 복사 완료" -ForegroundColor Cyan
}

# .ebextensions 폴더 복사
if (Test-Path ".\.ebextensions") {
    Copy-Item -Path ".\.ebextensions" -Destination "$deployDir\.ebextensions" -Recurse
    Write-Host "  ✓ .ebextensions 폴더 복사 완료" -ForegroundColor Cyan
}

# .npmrc 파일 복사 (있으면)
if (Test-Path ".\.npmrc") {
    Copy-Item -Path ".\.npmrc" -Destination "$deployDir\.npmrc"
    Write-Host "  ✓ .npmrc 복사 완료" -ForegroundColor Cyan
}

Write-Host "`n[2/4] ZIP 파일 생성 중..." -ForegroundColor Yellow

# ZIP 파일 경로
$zipPath = "..\backend-deploy.zip"
if (Test-Path $zipPath) {
    Remove-Item -Path $zipPath -Force
}

# ZIP 생성
Compress-Archive -Path "$deployDir\*" -DestinationPath $zipPath -CompressionLevel Optimal

Write-Host "  ✓ ZIP 파일 생성 완료" -ForegroundColor Cyan

Write-Host "`n[3/4] 임시 폴더 정리 중..." -ForegroundColor Yellow

# 임시 폴더 삭제
Remove-Item -Path $deployDir -Recurse -Force
Write-Host "  ✓ 정리 완료" -ForegroundColor Cyan

Write-Host "`n[4/4] 완료!" -ForegroundColor Yellow

# ZIP 파일 정보
$zipFile = Get-Item $zipPath
$sizeInMB = [math]::Round($zipFile.Length / 1MB, 2)

Write-Host "`n=====================================" -ForegroundColor Green
Write-Host "  배포 패키지 생성 완료!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host "`n파일 위치: $($zipFile.FullName)" -ForegroundColor White
Write-Host "파일 크기: ${sizeInMB} MB" -ForegroundColor White
Write-Host "`n다음 단계:" -ForegroundColor Yellow
Write-Host "1. AWS Console에 로그인" -ForegroundColor White
Write-Host "2. Elastic Beanstalk으로 이동" -ForegroundColor White
Write-Host "3. 이 ZIP 파일을 업로드" -ForegroundColor White
Write-Host "`n" -ForegroundColor White
