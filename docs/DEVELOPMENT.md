# 개발 가이드

## 프로젝트 아키텍처

```
[External APIs]
      ↓
[Data Collector] ──→ [PostgreSQL]
      ↓                    ↓
[Layer Engine] ←─────────┘
      ↓
[Regime Selector]
      ↓
[LLM Generator] ──→ [Redis Cache]
      ↓
[API Server] ←──────┘
      ↓
[Web Client]
```

## 데이터 플로우

### 1. 수집 (Collector)
- 외부 API에서 원본 데이터 가져오기
- `indicators_raw` 테이블에 저장
- 일일 1회 실행 (cron)

### 2. 정규화 (Layer 1)
- 20MA, 60MA 계산
- Z-score 계산
- Trend/Position 판단
- `indicators_processed` 테이블에 저장

### 3. 환경 판단 (Layer 2-3)
- Layer 2: Risk 환경 (VIX, S&P, Gold, DXY)
- Layer 3: Liquidity 환경 (금리, Spread, Real Yield)
- `layer_states` 테이블에 저장

### 4. 국면 선택 (Layer 4)
- Risk + Liquidity 조합
- 안정성 평가
- 규칙 기반 로직으로 7개 Enum 중 선택

### 5. 문장화 (LLM)
- Layer 출력 → 자연어 문장
- 주간 단위 캐싱
- `market_regimes` 테이블에 저장

## API 엔드포인트 설계

### `GET /api/regime/current`
현재 시장 국면

```json
{
  "regime": "TIGHT_RISK_OFF",
  "description": "유동성은 긴축적인 가운데, 단기 리스크 회피 심리가 지속되는 불안정한 국면",
  "durationDays": 12,
  "riskState": "RISK_OFF",
  "liquidityState": "TIGHTENING",
  "stabilityLevel": "LOW",
  "updatedAt": "2024-01-15T09:00:00Z"
}
```

### `GET /api/indicators`
모든 지표 목록

```json
{
  "indicators": [
    {
      "symbol": "SPX",
      "value": 4783.45,
      "ma20": 4750.23,
      "ma60": 4680.12,
      "zScore": 1.23,
      "trendShort": "UP",
      "positionMid": "ABOVE_MA"
    }
  ],
  "timestamp": "2024-01-15T09:00:00Z"
}
```

### `GET /api/regime/history`
국면 히스토리

```json
{
  "regimes": [
    {
      "regime": "TIGHT_RISK_OFF",
      "startDate": "2024-01-03",
      "endDate": "2024-01-15",
      "durationDays": 12
    }
  ],
  "total": 45
}
```

## 코딩 컨벤션

### TypeScript
- ESLint + Prettier
- Functional components (React)
- Named exports 선호

### Python
- PEP 8
- Type hints 필수
- Docstrings 작성

## 테스트 전략

### Unit Tests
- Layer 계산 로직
- Regime 선택 로직

### Integration Tests
- API 엔드포인트
- DB 쿼리

### E2E Tests
- 웹 UI 주요 플로우

## 모니터링

- API 응답 시간
- DB 쿼리 성능
- 외부 API 실패율
- 캐시 히트율

## 보안

- API 키는 환경 변수로 관리
- CORS 설정
- Rate limiting
- Input validation

## 다음 단계 (V2)

- [ ] OAuth 로그인
- [ ] 국면별 커뮤니티
- [ ] 알림 구독
- [ ] 모바일 앱
