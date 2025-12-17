# Layer Engine

시장 국면 계산 엔진 (Layer 1-4 + Regime Selection)

## 기술 스택
- Python 3.11+
- pandas, numpy
- FastAPI

## Layer 구조
- **Layer 1**: 개별 지표 정규화 (MA, Z-score)
- **Layer 2**: 단기 리스크 환경 (RISK_ON/OFF/NEUTRAL)
- **Layer 3**: 유동성/정책 환경 (EASING/TIGHTENING/NEUTRAL)
- **Layer 4**: 구조 종합 (ALIGNED/CONFLICT, STABILITY)

## Regime Enum
1. STABLE_RISK_ON
2. SUPPORTIVE
3. NEUTRAL
4. DEFENSIVE
5. TIGHT_RISK_OFF
6. LIQUIDITY_DRIVEN_RALLY
7. TRANSITION
