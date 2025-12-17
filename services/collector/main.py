"""
Market Regime Data Collector

거시 경제 지표 및 시장 데이터 수집 메인 스크립트
"""
from datetime import datetime, timedelta
from loguru import logger
import sys

from config import DATABASE_URL, FRED_API_KEY, LOOKBACK_DAYS
from data_sources.fred_client import FREDClient
from data_sources.yahoo_client import YahooFinanceClient
from database import DatabaseManager


def main():
    """메인 수집 로직"""
    logger.info("=" * 60)
    logger.info("Market Regime Data Collector Started")
    logger.info("=" * 60)

    # 수집 기간 설정
    start_date = datetime.now() - timedelta(days=LOOKBACK_DAYS)
    logger.info(f"Collection period: {start_date.date()} to {datetime.now().date()}")

    # API 키 확인
    if not FRED_API_KEY:
        logger.error("FRED_API_KEY not found in environment variables!")
        logger.info("Please set FRED_API_KEY in .env file")
        sys.exit(1)

    # 클라이언트 초기화
    fred_client = FREDClient(FRED_API_KEY)
    yahoo_client = YahooFinanceClient()
    db_manager = DatabaseManager(DATABASE_URL)

    # 1. FRED 데이터 수집
    logger.info("\n[1/3] Collecting data from FRED...")
    fred_data = fred_client.fetch_all_indicators(start_date)

    # 10Y-2Y Spread 계산
    if 'US_10Y' in fred_data and 'US_2Y' in fred_data:
        logger.info("Calculating 10Y-2Y Spread...")
        spread_data = fred_client.calculate_spread(
            fred_data['US_10Y'],
            fred_data['US_2Y']
        )
        fred_data['SPREAD_10Y_2Y'] = spread_data

    # 2. Yahoo Finance 데이터 수집
    logger.info("\n[2/3] Collecting data from Yahoo Finance...")
    yahoo_data = yahoo_client.fetch_all_indicators(start_date)

    # 3. 데이터베이스 저장
    logger.info("\n[3/3] Saving data to database...")

    fred_results = db_manager.save_all_indicators(fred_data, 'FRED')
    yahoo_results = db_manager.save_all_indicators(yahoo_data, 'Yahoo Finance')

    # 결과 요약
    logger.info("\n" + "=" * 60)
    logger.success("Data Collection Complete!")
    logger.info("=" * 60)

    logger.info("\nFRED Indicators:")
    for symbol, count in fred_results.items():
        logger.info(f"  {symbol}: {count} new records")

    logger.info("\nYahoo Finance Indicators:")
    for symbol, count in yahoo_results.items():
        logger.info(f"  {symbol}: {count} new records")

    total_indicators = len(fred_results) + len(yahoo_results)
    total_records = sum(fred_results.values()) + sum(yahoo_results.values())

    logger.info(f"\nTotal: {total_indicators} indicators, {total_records} new records")
    logger.info("=" * 60)


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        logger.warning("\nCollection interrupted by user")
        sys.exit(0)
    except Exception as e:
        logger.exception(f"Unexpected error: {e}")
        sys.exit(1)
