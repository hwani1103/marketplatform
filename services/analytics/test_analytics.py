"""
Analytics Engine 테스트 스크립트
DB에서 데이터를 가져와서 통계 계산
"""

import sys
import os
from datetime import datetime

# 상위 디렉토리의 모듈 import를 위한 경로 추가
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from loguru import logger
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

from analytics.calculator import calculate_indicator_analytics

# .env 파일 로드
load_dotenv()


def fetch_indicator_data(symbol: str, days: int = 365):
    """
    DB에서 지표 데이터 가져오기

    Args:
        symbol: 지표 심볼 (e.g., 'SPX')
        days: 조회 기간 (일)

    Returns:
        List[Dict]: [{'timestamp': datetime, 'value': float}, ...]
    """
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        logger.error("DATABASE_URL not found in environment variables!")
        return []

    engine = create_engine(database_url)

    query = text("""
        SELECT timestamp, value
        FROM indicators
        WHERE symbol = :symbol
          AND timestamp >= NOW() - INTERVAL ':days days'
        ORDER BY timestamp ASC
    """)

    try:
        with engine.connect() as conn:
            result = conn.execute(query, {'symbol': symbol, 'days': days})
            data = [
                {
                    'timestamp': row[0],
                    'value': float(row[1])
                }
                for row in result
            ]
            logger.info(f"Fetched {len(data)} data points for {symbol}")
            return data
    except Exception as e:
        logger.error(f"Error fetching data for {symbol}: {e}")
        return []
    finally:
        engine.dispose()


def test_single_indicator(symbol: str):
    """
    단일 지표 테스트

    Args:
        symbol: 지표 심볼
    """
    logger.info(f"\n{'='*60}")
    logger.info(f"Testing analytics for: {symbol}")
    logger.info(f"{'='*60}\n")

    # 데이터 가져오기
    data = fetch_indicator_data(symbol, days=365)

    if not data:
        logger.warning(f"No data available for {symbol}")
        return

    # 통계 계산
    analytics = calculate_indicator_analytics(
        data,
        ma_windows=[20, 50, 200],
        zscore_window=252,
        volatility_window=20,
        change_windows=[5, 20]
    )

    # 결과 출력
    logger.success(f"\nAnalytics Results for {symbol}:")
    logger.info(f"  Current Value: {analytics['current_value']:.2f}")
    logger.info(f"  Data Points: {analytics['data_points']}")
    logger.info(f"  Latest Date: {analytics['latest_date']}")

    logger.info(f"\n  Moving Averages:")
    for key in ['ma_20', 'ma_50', 'ma_200']:
        if analytics.get(key) is not None:
            logger.info(f"    {key.upper()}: {analytics[key]:.2f}")
        else:
            logger.info(f"    {key.upper()}: N/A")

    logger.info(f"\n  Z-Score Analysis:")
    if analytics.get('zscore') is not None:
        logger.info(f"    Z-Score: {analytics['zscore']:.2f}σ")
        logger.info(f"    Window: {analytics['zscore_window']} days")

        # Z-Score 해석
        z = analytics['zscore']
        if z > 2:
            interpretation = "🔴 매우 높음 (상위 2.5%)"
        elif z > 1:
            interpretation = "🟡 높음 (상위 16%)"
        elif z > -1:
            interpretation = "🟢 정상 범위"
        elif z > -2:
            interpretation = "🟡 낮음 (하위 16%)"
        else:
            interpretation = "🔴 매우 낮음 (하위 2.5%)"

        logger.info(f"    Interpretation: {interpretation}")
    else:
        logger.info(f"    Z-Score: N/A")

    if analytics.get('percentile') is not None:
        logger.info(f"    Percentile: {analytics['percentile']:.1f}% (역사적 상위 {100-analytics['percentile']:.1f}%)")

    logger.info(f"\n  Volatility:")
    if analytics.get('volatility_20d') is not None:
        logger.info(f"    20-Day Volatility: {analytics['volatility_20d']:.2f}%")
    else:
        logger.info(f"    20-Day Volatility: N/A")

    logger.info(f"\n  Recent Changes:")
    for key in ['change_5d', 'change_20d']:
        if analytics.get(key) is not None:
            change = analytics[key]
            arrow = "▲" if change >= 0 else "▼"
            color = "red" if change >= 0 else "blue"
            logger.info(f"    {key.upper()}: {arrow} {abs(change):.2f}%")
        else:
            logger.info(f"    {key.upper()}: N/A")


def test_all_indicators():
    """
    모든 지표 테스트
    """
    symbols = [
        'SPX', 'NASDAQ', 'RUSSELL_2000', 'VIX',
        'GOLD', 'WTI', 'DXY', 'USD_KRW',
        'US_10Y', 'US_2Y', 'SPREAD_10Y_2Y', 'US_10Y_REAL',
        'CPI_YOY', 'CORE_CPI_YOY', 'PCE_YOY', 'INFLATION_EXP_5Y'
    ]

    for symbol in symbols:
        test_single_indicator(symbol)
        logger.info("\n")


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Test Analytics Engine')
    parser.add_argument('--symbol', type=str, help='Test single indicator symbol')
    parser.add_argument('--all', action='store_true', help='Test all indicators')

    args = parser.parse_args()

    if args.all:
        test_all_indicators()
    elif args.symbol:
        test_single_indicator(args.symbol)
    else:
        # 기본: SPX 테스트
        test_single_indicator('SPX')
