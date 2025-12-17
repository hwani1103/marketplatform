# 로컬 환경 설정 가이드

## 📋 체크리스트

- [x] FRED API 키 발급
- [ ] Docker 실행
- [ ] 데이터베이스 마이그레이션
- [ ] Python 의존성 설치
- [ ] 연결 테스트
- [ ] 데이터 수집 실행

---

## Step 1: Docker 컨테이너 시작

PostgreSQL과 Redis를 실행합니다.

```bash
# 프로젝트 루트 디렉토리에서
docker-compose up -d

# 상태 확인
docker-compose ps
```

**예상 결과:**
```
NAME                  STATUS
market-regime-db      Up
market-regime-redis   Up
```

---

## Step 2: 데이터베이스 마이그레이션

Prisma로 데이터베이스 스키마를 생성합니다.

```bash
# Node.js 의존성 설치 (처음 한 번만)
pnpm install

# Prisma 클라이언트 생성
pnpm db:generate

# 마이그레이션 실행
pnpm db:migrate
```

**입력 프롬프트가 나오면:**
- Migration name: `init` (또는 원하는 이름)
- Enter 눌러 진행

---

## Step 3: Python 의존성 설치

Collector 서비스의 Python 패키지를 설치합니다.

```bash
cd services/collector

# 가상환경 생성 (선택사항, 권장)
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt
```

---

## Step 4: 연결 테스트

모든 것이 정상 작동하는지 확인합니다.

```bash
# services/collector 디렉토리에서
python test_connection.py
```

**예상 결과:**
```
✅ FRED API working! Fetched 30 records
✅ Yahoo Finance working! Fetched 22 records
✅ Database connection successful!

🎉 All tests passed! Ready to collect data.
```

**실패하는 경우:**
- ❌ FRED API: `.env` 파일의 API 키 확인
- ❌ Database: `docker-compose ps`로 PostgreSQL 실행 확인
- ❌ Yahoo Finance: 인터넷 연결 확인

---

## Step 5: 데이터 수집 실행

실제 데이터를 수집합니다.

```bash
# services/collector 디렉토리에서
python main.py
```

**예상 소요 시간:** 2-3분

**예상 결과:**
```
[1/3] Collecting data from FRED...
Fetched 365 observations for US_10Y
Fetched 365 observations for US_2Y
...

[2/3] Collecting data from Yahoo Finance...
Fetched 252 observations for SPX
Fetched 252 observations for VIX
...

[3/3] Saving data to database...
Saved 365 new records for US_10Y
...

✓ Total: 14 indicators, 3,500+ new records
```

---

## Step 6: 데이터 확인

Prisma Studio로 수집된 데이터를 확인합니다.

```bash
# 프로젝트 루트로 돌아가기
cd ../..

# Prisma Studio 실행
pnpm db:studio
```

브라우저에서 http://localhost:5555 열림
- `indicators_raw` 테이블 클릭
- 데이터 확인

---

## 트러블슈팅

### Docker 연결 실패
```bash
# Docker 재시작
docker-compose down
docker-compose up -d

# 로그 확인
docker-compose logs postgres
```

### Prisma 마이그레이션 오류
```bash
# DB 완전 초기화
docker-compose down -v  # 볼륨 삭제 주의!
docker-compose up -d
pnpm db:migrate
```

### Python 모듈 오류
```bash
# 가상환경 재생성
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 다음 단계

데이터 수집이 성공하면:
1. Layer 1 계산 엔진 구현 (MA, Z-score)
2. API 서버 구현
3. 웹 UI 구현

---

## 유용한 명령어

```bash
# Docker 중지
docker-compose stop

# Docker 완전 삭제 (데이터 포함)
docker-compose down -v

# 수집기 로그 레벨 변경
# config.py에서 LOG_LEVEL 설정

# 특정 기간만 수집
# config.py에서 LOOKBACK_DAYS 변경 (기본: 365일)
```
