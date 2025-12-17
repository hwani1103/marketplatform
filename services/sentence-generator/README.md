# Sentence Generator

LLM 기반 시장 국면 문장 생성기

## 기술 스택
- Python 3.11+
- OpenAI API
- FastAPI

## 역할
- 계산/판단 ❌
- 자연어 문장화 ⭕

## 입력
```json
{
  "regime_enum": "TIGHT_RISK_OFF",
  "risk_state": "RISK_OFF",
  "liquidity_state": "TIGHTENING",
  "stability": "LOW"
}
```

## 출력 예시
"유동성은 긴축적인 가운데, 단기 리스크 회피 심리가 지속되는 불안정한 국면"
