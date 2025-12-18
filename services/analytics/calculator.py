"""
Statistical Calculator for Market Indicators
Layer 1 변환 엔진 - 원시 데이터를 분석 가능한 형태로 변환
"""

from typing import List, Dict, Optional
from datetime import datetime
import numpy as np
from scipy import stats


def calculate_moving_averages(
    data: List[Dict],
    windows: List[int] = [20, 50, 200]
) -> Dict[str, Optional[float]]:
    """
    이동평균 계산

    Args:
        data: [{'timestamp': datetime, 'value': float}, ...]
        windows: 이동평균 기간 (일)

    Returns:
        {'ma_20': 5850.2, 'ma_50': 5800.1, 'ma_200': 5600.5}
    """
    if not data:
        return {f'ma_{w}': None for w in windows}

    # 시간순 정렬 (오래된 것부터)
    sorted_data = sorted(data, key=lambda x: x['timestamp'])
    values = np.array([d['value'] for d in sorted_data])

    result = {}
    for window in windows:
        if len(values) >= window:
            ma = np.mean(values[-window:])
            result[f'ma_{window}'] = float(ma)
        else:
            result[f'ma_{window}'] = None

    return result


def calculate_zscore(
    data: List[Dict],
    window: int = 252
) -> Dict[str, Optional[float]]:
    """
    Z-Score 계산 (역사적 상대적 위치)

    Z-Score = (현재값 - 평균) / 표준편차

    Args:
        data: [{'timestamp': datetime, 'value': float}, ...]
        window: 계산 기간 (기본 252일 = 약 1년 거래일)

    Returns:
        {'zscore': 1.2, 'zscore_window': 252}
    """
    if not data or len(data) < 2:
        return {'zscore': None, 'zscore_window': window}

    sorted_data = sorted(data, key=lambda x: x['timestamp'])
    values = np.array([d['value'] for d in sorted_data])

    # window 기간 데이터 사용
    window_values = values[-min(window, len(values)):]

    if len(window_values) < 2:
        return {'zscore': None, 'zscore_window': window}

    mean = np.mean(window_values)
    std = np.std(window_values, ddof=1)

    if std == 0:
        return {'zscore': 0.0, 'zscore_window': window}

    current_value = values[-1]
    zscore = (current_value - mean) / std

    return {
        'zscore': float(zscore),
        'zscore_window': window
    }


def calculate_percentile(data: List[Dict]) -> Dict[str, Optional[float]]:
    """
    현재 값의 역사적 백분위 계산

    85.5 = 역사적으로 상위 14.5%

    Args:
        data: [{'timestamp': datetime, 'value': float}, ...]

    Returns:
        {'percentile': 85.5}
    """
    if not data or len(data) < 2:
        return {'percentile': None}

    sorted_data = sorted(data, key=lambda x: x['timestamp'])
    values = np.array([d['value'] for d in sorted_data])

    current_value = values[-1]
    percentile = stats.percentileofscore(values, current_value, kind='rank')

    return {'percentile': float(percentile)}


def calculate_volatility(
    data: List[Dict],
    window: int = 20
) -> Dict[str, Optional[float]]:
    """
    롤링 변동성 계산 (표준편차)

    Args:
        data: [{'timestamp': datetime, 'value': float}, ...]
        window: 계산 기간 (기본 20일)

    Returns:
        {'volatility_20d': 15.2}
    """
    if not data or len(data) < window:
        return {f'volatility_{window}d': None}

    sorted_data = sorted(data, key=lambda x: x['timestamp'])
    values = np.array([d['value'] for d in sorted_data])

    # 일별 수익률 계산
    returns = np.diff(values) / values[:-1] * 100

    # 최근 window 기간의 변동성
    recent_returns = returns[-window:]
    volatility = np.std(recent_returns, ddof=1)

    return {f'volatility_{window}d': float(volatility)}


def calculate_changes(
    data: List[Dict],
    windows: List[int] = [5, 20]
) -> Dict[str, Optional[float]]:
    """
    변화율 계산 (%)

    Args:
        data: [{'timestamp': datetime, 'value': float}, ...]
        windows: 변화율 계산 기간 (일)

    Returns:
        {'change_5d': 2.3, 'change_20d': 5.1}
    """
    if not data or len(data) < 2:
        return {f'change_{w}d': None for w in windows}

    sorted_data = sorted(data, key=lambda x: x['timestamp'])
    values = np.array([d['value'] for d in sorted_data])

    current_value = values[-1]
    result = {}

    for window in windows:
        if len(values) > window:
            old_value = values[-(window + 1)]
            if old_value != 0:
                change = ((current_value - old_value) / old_value) * 100
                result[f'change_{window}d'] = float(change)
            else:
                result[f'change_{window}d'] = None
        else:
            result[f'change_{window}d'] = None

    return result


def calculate_indicator_analytics(
    data: List[Dict],
    ma_windows: List[int] = [20, 50, 200],
    zscore_window: int = 252,
    volatility_window: int = 20,
    change_windows: List[int] = [5, 20]
) -> Dict:
    """
    전체 통계 지표 계산 (올인원)

    Args:
        data: [{'timestamp': datetime, 'value': float}, ...]
        ma_windows: 이동평균 기간
        zscore_window: Z-Score 계산 기간
        volatility_window: 변동성 계산 기간
        change_windows: 변화율 계산 기간

    Returns:
        {
            'current_value': 5900.5,
            'data_points': 250,
            'latest_date': '2025-12-18',
            'ma_20': 5850.2,
            'ma_50': 5800.1,
            'ma_200': 5600.5,
            'zscore': 1.2,
            'zscore_window': 252,
            'percentile': 85.5,
            'volatility_20d': 15.2,
            'change_5d': 2.3,
            'change_20d': 5.1,
        }
    """
    if not data:
        return {
            'error': 'No data available',
            'current_value': None,
            'data_points': 0,
        }

    sorted_data = sorted(data, key=lambda x: x['timestamp'])

    # 기본 정보
    result = {
        'current_value': float(sorted_data[-1]['value']),
        'data_points': len(sorted_data),
        'latest_date': sorted_data[-1]['timestamp'].isoformat() if isinstance(sorted_data[-1]['timestamp'], datetime) else str(sorted_data[-1]['timestamp']),
    }

    # 각 통계 계산
    result.update(calculate_moving_averages(sorted_data, ma_windows))
    result.update(calculate_zscore(sorted_data, zscore_window))
    result.update(calculate_percentile(sorted_data))
    result.update(calculate_volatility(sorted_data, volatility_window))
    result.update(calculate_changes(sorted_data, change_windows))

    return result
