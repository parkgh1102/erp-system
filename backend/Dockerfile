# Node.js 18 LTS 사용
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사 및 의존성 설치
COPY package*.json ./
RUN npm ci --only=production

# TypeScript 빌드를 위해 devDependencies도 임시 설치
COPY package*.json ./
RUN npm install

# 소스 코드 복사
COPY . .

# TypeScript 빌드
RUN npm run build

# devDependencies 제거하고 production만 재설치
RUN npm ci --only=production

# 포트 노출
EXPOSE 3001

# 프로덕션 모드로 실행
CMD ["npm", "start"]
