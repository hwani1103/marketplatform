# Database Package

Prisma 기반 데이터베이스 스키마 및 클라이언트

## 기술 스택
- Prisma
- PostgreSQL

## 주요 테이블
- `users` - 사용자 (V2)
- `indicators_raw` - 원본 지표 데이터
- `indicators_processed` - 처리된 지표 (Layer 1)
- `layer_states` - Layer 2-4 상태
- `market_regimes` - 최종 시장 국면
- `comments` - 댓글 (V2)
