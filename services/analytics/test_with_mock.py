"""
Mock 데이터로 Analytics Engine 테스트
"""

from datetime import datetime, timedelta
import numpy as np
from loguru import logger

from calculator import calculate_indicator_analytics


def generate_mock_data(days: int = 365, base_value: float = 5000, volatility: float = 0.02):
    """
    Mock 데이터 생성 (랜덤 워크)

    Args:
        days: 생성할 데이터 일수
        base_value: 시작 값
        volatility: 변동성 (일별 표준편차)

    Returns:
        List[Dict]: [{'timestamp': datetime, 'value': float}, ...]
    """
    np.random.seed(42)  # 재현 가능하도록

    data = []
    current_value = base_value
    start_date = datetime.now() - timedelta(days=days)

    for i in range(days):
        # 랜덤 워크: 전일 대비 ±변동
        daily_return = np.random.normal(0.001, volatility)  # 평균 0.1% 상승, 변동성 2%
        current_value *= (1 + daily_return)

        data.append({
            'timestamp': start_date + timedelta(days=i),
            'value': current_value
        })

    return data


def test_with_mock_data():
    """
    Mock 데이터로 테스트
    """
    logger.info("="*60)
    logger.info("Testing Analytics Engine with Mock Data")
    logger.info("="*60)

    # Mock 데이터 생성 (1년치)
    logger.info("\n📊 Generating mock SPX data (365 days)...")
    data = generate_mock_data(days=365, base_value=5000, volatility=0.02)
    logger.info(f"  Generated {len(data)} data points")
    logger.info(f"  Start: {data[0]['timestamp'].date()} = {data[0]['value']:.2f}")
    logger.info(f"  End:   {data[-1]['timestamp'].date()} = {data[-1]['value']:.2f}")

    # Analytics 계산
    logger.info("\n⚙️  Calculating analytics...")
    analytics = calculate_indicator_analytics(
        data,
        ma_windows=[20, 50, 200],
        zscore_window=252,
        volatility_window=20,
        change_windows=[5, 20]
    )

    # 결과 출력
    logger.success("\n✅ Analytics Results:")
    logger.info(f"\n📈 Current State:")
    logger.info(f"  Current Value: {analytics['current_value']:.2f}")
    logger.info(f"  Data Points: {analytics['data_points']}")
    logger.info(f"  Latest Date: {analytics['latest_date'][:10]}")

    logger.info(f"\n📊 Moving Averages:")
    for key in ['ma_20', 'ma_50', 'ma_200']:
        if analytics.get(key) is not None:
            ma_value = analytics[key]
            diff = analytics['current_value'] - ma_value
            pct = (diff / ma_value) * 100
            status = "🟢 Above" if diff > 0 else "🔴 Below"
            logger.info(f"  {key.upper():8s}: {ma_value:,.2f}  ({status} by {abs(pct):5.2f}%)")
        else:
            logger.info(f"  {key.upper():8s}: N/A")

    logger.info(f"\n📐 Z-Score Analysis:")
    if analytics.get('zscore') is not None:
        z = analytics['zscore']
        logger.info(f"  Z-Score: {z:.2f}σ")
        logger.info(f"  Window: {analytics['zscore_window']} days")

        # Z-Score 해석
        if z > 2:
            interpretation = "🔴 극단적으로 높음 (상위 2.5%)"
            signal = "OVERBOUGHT - 조정 가능성"
        elif z > 1:
            interpretation = "🟡 평균보다 높음 (상위 16%)"
            signal = "ELEVATED - 주의 필요"
        elif z > -1:
            interpretation = "🟢 정상 범위"
            signal = "NORMAL - 안정적"
        elif z > -2:
            interpretation = "🟡 평균보다 낮음 (하위 16%)"
            signal = "DEPRESSED - 반등 가능성"
        else:
            interpretation = "🔴 극단적으로 낮음 (하위 2.5%)"
            signal = "OVERSOLD - 강한 반등 가능성"

        logger.info(f"  Level: {interpretation}")
        logger.info(f"  Signal: {signal}")
    else:
        logger.info(f"  Z-Score: N/A")

    if analytics.get('percentile') is not None:
        pct = analytics['percentile']
        logger.info(f"  Percentile: {pct:.1f}%")
        logger.info(f"  → 역사적으로 상위 {100-pct:.1f}% 수준")

    logger.info(f"\n📊 Volatility:")
    if analytics.get('volatility_20d') is not None:
        vol = analytics['volatility_20d']
        logger.info(f"  20-Day Volatility: {vol:.2f}%")
        if vol > 3:
            vol_signal = "🔴 HIGH - 변동성 큼"
        elif vol > 1.5:
            vol_signal = "🟡 MODERATE - 보통"
        else:
            vol_signal = "🟢 LOW - 안정적"
        logger.info(f"  Assessment: {vol_signal}")
    else:
        logger.info(f"  20-Day Volatility: N/A")

    logger.info(f"\n📉 Recent Changes:")
    for key in ['change_5d', 'change_20d']:
        if analytics.get(key) is not None:
            change = analytics[key]
            arrow = "▲" if change >= 0 else "▼"
            color_emoji = "🔴" if change >= 0 else "🔵"
            logger.info(f"  {key.upper():12s}: {color_emoji} {arrow} {abs(change):5.2f}%")
        else:
            logger.info(f"  {key.upper():12s}: N/A")

    logger.success("\n🎉 Test completed successfully!")


if __name__ == '__main__':
    test_with_mock_data()
