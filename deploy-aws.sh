#!/bin/bash

# AWS ERP 시스템 배포 스크립트
# 사용법: ./deploy-aws.sh [backend|frontend|all]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  AWS ERP 시스템 배포 스크립트${NC}"
echo -e "${GREEN}================================================${NC}"

# 배포 타입 확인
DEPLOY_TYPE=${1:-all}

deploy_backend() {
  echo -e "\n${YELLOW}📦 백엔드 배포 시작...${NC}"

  cd backend

  # 환경 확인
  if [ ! -f ".elasticbeanstalk/config.yml" ]; then
    echo -e "${RED}❌ Elastic Beanstalk 설정이 없습니다. 먼저 'eb init'을 실행하세요.${NC}"
    exit 1
  fi

  # 빌드
  echo -e "${YELLOW}🔨 TypeScript 빌드 중...${NC}"
  npm run build

  # 배포
  echo -e "${YELLOW}🚀 Elastic Beanstalk에 배포 중...${NC}"
  eb deploy

  # Health Check
  echo -e "${YELLOW}🏥 Health Check 중...${NC}"
  sleep 10
  eb health

  cd ..
  echo -e "${GREEN}✅ 백엔드 배포 완료!${NC}"
}

deploy_frontend() {
  echo -e "\n${YELLOW}📦 프론트엔드 배포 시작...${NC}"

  cd frontend

  # 빌드
  echo -e "${YELLOW}🔨 Vite 빌드 중...${NC}"
  npm run build

  cd ..

  echo -e "${GREEN}✅ 프론트엔드 빌드 완료!${NC}"
  echo -e "${YELLOW}💡 Amplify는 GitHub push 시 자동 배포됩니다.${NC}"
  echo -e "${YELLOW}   또는 Amplify Console에서 수동 배포하세요.${NC}"
}

check_aws_cli() {
  if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI가 설치되어 있지 않습니다.${NC}"
    echo -e "${YELLOW}설치: https://aws.amazon.com/cli/${NC}"
    exit 1
  fi

  if ! command -v eb &> /dev/null; then
    echo -e "${RED}❌ EB CLI가 설치되어 있지 않습니다.${NC}"
    echo -e "${YELLOW}설치: pip install awsebcli${NC}"
    exit 1
  fi

  echo -e "${GREEN}✅ AWS CLI 및 EB CLI 설치 확인${NC}"
}

# 메인 로직
case $DEPLOY_TYPE in
  backend)
    check_aws_cli
    deploy_backend
    ;;
  frontend)
    deploy_frontend
    ;;
  all)
    check_aws_cli
    deploy_backend
    deploy_frontend
    ;;
  *)
    echo -e "${RED}❌ 잘못된 인자입니다. backend, frontend, all 중 하나를 선택하세요.${NC}"
    exit 1
    ;;
esac

echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}  🎉 배포 완료!${NC}"
echo -e "${GREEN}================================================${NC}"
echo -e "Frontend: ${YELLOW}https://webapperp.ai.kr${NC}"
echo -e "Backend:  ${YELLOW}https://api.webapperp.ai.kr/api/health${NC}"
