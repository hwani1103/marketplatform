# Market Regime Platform

> 복잡한 거시 지표를 계산해, 현재 시장이 어떤 국면인지 한 문장으로 보여주는 무료 시장 상태 플랫폼

## 프로젝트 구조

```
market-regime-platform/
├── apps/
│   ├── web/              # Next.js 웹 클라이언트
│   └── api/              # NestJS API 서버
├── services/
│   ├── collector/        # 데이터 수집기 (Python)
│   ├── layer-engine/     # Layer 계산 엔진 (Python)
│   └── sentence-generator/ # LLM 문장 생성기 (Python)
└── packages/
    ├── database/         # Prisma 스키마 & 클라이언트
    ├── types/            # 공통 TypeScript 타입
    ├── ui/               # 공통 UI 컴포넌트
    └── charts/           # 차트 컴포넌트
```

## 기술 스택

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Lightweight Charts**

### Backend
- **NestJS** (API Server)
- **Python** (Data Processing)
- **FastAPI** (Calculation APIs)
- **PostgreSQL** (Database)
- **Redis** (Cache)
- **Prisma** (ORM)

## 시작하기

### 1. 사전 요구사항

- Node.js 18+
- Python 3.11+
- pnpm 8+
- Docker & Docker Compose

### 2. 환경 설정

```bash
# 환경 변수 파일 생성
cp .env.example .env

# API 키 설정 (필수)
# - FRED_API_KEY: https://fred.stlouisfed.org/docs/api/api_key.html
# - OPENAI_API_KEY: https://platform.openai.com/api-keys
```

### 3. Docker 컨테이너 시작

```bash
# PostgreSQL + Redis 시작
docker-compose up -d

# 상태 확인
docker-compose ps
```

### 4. 의존성 설치

```bash
# Node.js 패키지 설치
pnpm install

# Python 서비스 의존성 설치
cd services/collector && pip install -r requirements.txt && cd ../..
cd services/layer-engine && pip install -r requirements.txt && cd ../..
cd services/sentence-generator && pip install -r requirements.txt && cd ../..
```

### 5. 데이터베이스 초기화

```bash
# Prisma 클라이언트 생성
pnpm db:generate

# 마이그레이션 실행
pnpm db:migrate
```

### 6. 개발 서버 실행

```bash
# 모든 서비스 동시 실행
pnpm dev

# 또는 개별 실행
cd apps/web && pnpm dev        # http://localhost:3000
cd apps/api && pnpm dev        # http://localhost:3001
```

## 개발 워크플로우

### Phase 1: 데이터 수집 (진행중)

```bash
cd services/collector
python main.py
```

수집 대상:
- S&P 500, NASDAQ, Russell 2000
- VIX, Gold, WTI
- US 10Y/2Y Treasury, Spread
- Real Yield, DXY
- CPI, Core CPI, PCE

### Phase 2: Layer 계산 엔진

```bash
cd services/layer-engine
uvicorn main:app --reload
```

- Layer 1: 지표 정규화 (MA, Z-score)
- Layer 2: 리스크 환경 판단
- Layer 3: 유동성 환경 판단
- Layer 4: 구조 종합 & Regime 선택

### Phase 3: 문장 생성

```bash
cd services/sentence-generator
uvicorn main:app --reload
```

LLM을 통한 자연어 문장화

## 시장 국면 (Regime) 정의

7개의 국면으로 시장 상태를 표현:

| Regime | 설명 |
|--------|------|
| `STABLE_RISK_ON` | 완화 + Risk-on |
| `SUPPORTIVE` | 완화 + 중립 |
| `NEUTRAL` | 중립 |
| `DEFENSIVE` | 중립 + Risk-off |
| `TIGHT_RISK_OFF` | 긴축 + Risk-off |
| `LIQUIDITY_DRIVEN_RALLY` | 긴축 + Risk-on |
| `TRANSITION` | 신호 충돌 / 전환 |

## 유용한 명령어

```bash
# 포맷팅
pnpm format

# 린트
pnpm lint

# 빌드
pnpm build

# 클린
pnpm clean

# DB 스튜디오
pnpm db:studio
```

## 배포

- **Frontend**: Vercel
- **Backend API**: AWS / Fly.io
- **Database**: AWS RDS (PostgreSQL)
- **Cache**: AWS ElastiCache (Redis)

## 서비스 원칙

✅ 정량 계산 + 상태 정의
❌ 예측 없음
❌ 추천 없음
❌ 뉴스 없음

## 라이선스

MIT
