# 빠른 시작 가이드

## 목표
최소한의 설정으로 로컬 개발 환경을 구축하고 첫 데이터를 수집합니다.

## Step 1: API 키 발급 (5분)

### FRED API Key
1. https://fred.stlouisfed.org/ 방문
2. 계정 생성 (무료)
3. API Key 발급: https://fred.stlouisfed.org/docs/api/api_key.html

### OpenAI API Key (선택)
1. https://platform.openai.com/ 방문
2. API Keys 메뉴에서 발급
3. GPT-3.5-turbo 권장 (저렴)

## Step 2: 환경 설정 (2분)

```bash
# 1. 저장소 클론
git clone <repository-url>
cd market-regime-platform

# 2. 환경 변수 설정
cp .env.example .env
nano .env  # API 키 입력

# 3. Docker 시작
docker-compose up -d
```

## Step 3: 의존성 설치 (5분)

```bash
# Node.js 패키지
pnpm install

# Python 패키지
cd services/collector
pip install -r requirements.txt
cd ../..
```

## Step 4: 데이터베이스 초기화 (2분)

```bash
# Prisma 클라이언트 생성
pnpm db:generate

# 마이그레이션
pnpm db:migrate

# (선택) DB 확인
pnpm db:studio
# → http://localhost:5555
```

## Step 5: 첫 데이터 수집 (10분)

```bash
cd services/collector

# 수집 스크립트 실행
python main.py

# 로그 확인
# → "✓ Collected 12 indicators"
```

## Step 6: API 서버 실행 (2분)

```bash
cd apps/api
pnpm dev

# → http://localhost:3001
# 브라우저에서 http://localhost:3001/health 확인
```

## Step 7: 웹 클라이언트 실행 (2분)

```bash
cd apps/web
pnpm dev

# → http://localhost:3000
```

## 트러블슈팅

### Docker 연결 실패
```bash
docker-compose ps
# PostgreSQL, Redis 모두 "Up" 상태 확인
```

### Prisma 오류
```bash
# 클라이언트 재생성
pnpm db:generate

# DB 초기화
docker-compose down -v
docker-compose up -d
pnpm db:migrate
```

### API 키 오류
- `.env` 파일이 루트 디렉토리에 있는지 확인
- API 키에 따옴표 없이 입력했는지 확인

## 다음 단계

1. **데이터 수집 확인**: `pnpm db:studio`에서 `indicators_raw` 테이블 확인
2. **Layer 엔진 개발**: `services/layer-engine` 구현 시작
3. **UI 개발**: `apps/web` 페이지 구현

## 도움말

- 문서: `/docs` 폴더 참고
- 이슈: GitHub Issues
