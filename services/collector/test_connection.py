"""
간단한 연결 테스트 스크립트
DB 연결과 API 키를 확인합니다
"""
from loguru import logger
import sys

from config import DATABASE_URL, FRED_API_KEY
from data_sources.fred_client import FREDClient
from data_sources.yahoo_client import YahooFinanceClient
from datetime import datetime, timedelta


def test_fred_connection():
    """FRED API 연결 테스트"""
    logger.info("Testing FRED API connection...")

    if not FRED_API_KEY:
        logger.error("❌ FRED_API_KEY not found!")
        return False

    try:
        client = FREDClient(FRED_API_KEY)
        # 10Y Treasury 데이터 1개월치만 가져와보기
        start_date = datetime.now() - timedelta(days=30)
        data = client.fetch_series('DGS10', start_date)

        if data:
            logger.success(f"✅ FRED API working! Fetched {len(data)} records")
            logger.info(f"   Latest: {data[0]['date'].date()} = {data[0]['value']}%")
            return True
        else:
            logger.error("❌ No data received from FRED")
            return False

    except Exception as e:
        logger.error(f"❌ FRED API error: {e}")
        return False


def test_yahoo_connection():
    """Yahoo Finance 연결 테스트"""
    logger.info("Testing Yahoo Finance connection...")

    try:
        client = YahooFinanceClient()
        # S&P 500 데이터 1개월치만 가져와보기
        start_date = datetime.now() - timedelta(days=30)
        data = client.fetch_ticker('^GSPC', start_date)

        if data:
            logger.success(f"✅ Yahoo Finance working! Fetched {len(data)} records")
            logger.info(f"   Latest: {data[0]['date'].date()} = {data[0]['value']:.2f}")
            return True
        else:
            logger.error("❌ No data received from Yahoo Finance")
            return False

    except Exception as e:
        logger.error(f"❌ Yahoo Finance error: {e}")
        return False


def test_database_connection():
    """데이터베이스 연결 테스트"""
    logger.info("Testing database connection...")

    try:
        from sqlalchemy import create_engine, text

        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            result.fetchone()

        logger.success("✅ Database connection successful!")
        return True

    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        logger.info("   Make sure PostgreSQL is running: docker-compose up -d")
        return False


def main():
    """모든 연결 테스트 실행"""
    logger.info("=" * 60)
    logger.info("Connection Test Suite")
    logger.info("=" * 60)

    results = {
        'FRED API': test_fred_connection(),
        'Yahoo Finance': test_yahoo_connection(),
        'Database': test_database_connection()
    }

    logger.info("\n" + "=" * 60)
    logger.info("Test Results:")
    logger.info("=" * 60)

    for name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        logger.info(f"{name}: {status}")

    all_passed = all(results.values())

    if all_passed:
        logger.success("\n🎉 All tests passed! Ready to collect data.")
        logger.info("Run: python main.py")
    else:
        logger.error("\n⚠️  Some tests failed. Please fix the issues above.")

    sys.exit(0 if all_passed else 1)


if __name__ == '__main__':
    main()
