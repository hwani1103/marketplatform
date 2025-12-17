"""
FRED API Client
Federal Reserve Economic Data에서 거시경제 지표 수집
"""
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import requests
from loguru import logger


class FREDClient:
    """FRED API 클라이언트"""

    BASE_URL = "https://api.stlouisfed.org/fred/series/observations"

    # FRED 지표 매핑
    SERIES_MAP = {
        # 금리
        'US_10Y': 'DGS10',          # 10-Year Treasury Constant Maturity Rate
        'US_2Y': 'DGS2',            # 2-Year Treasury Constant Maturity Rate
        'US_10Y_REAL': 'DFII10',    # 10-Year Treasury Inflation-Indexed Security

        # 인플레이션
        'CPI_YOY': 'CPIAUCSL',      # Consumer Price Index
        'CORE_CPI_YOY': 'CPILFESL', # Core CPI (less food & energy)
        'PCE_YOY': 'PCEPI',         # Personal Consumption Expenditures

        # 기타
        'INFLATION_EXP_5Y': 'T5YIE', # 5-Year Breakeven Inflation Rate
    }

    def __init__(self, api_key: str):
        """
        Args:
            api_key: FRED API 키
        """
        self.api_key = api_key

    def fetch_series(
        self,
        series_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict]:
        """
        FRED에서 시계열 데이터 가져오기

        Args:
            series_id: FRED series ID (e.g., 'DGS10')
            start_date: 시작일 (기본값: 1년 전)
            end_date: 종료일 (기본값: 오늘)

        Returns:
            List of {date, value} dictionaries
        """
        if start_date is None:
            start_date = datetime.now() - timedelta(days=365)
        if end_date is None:
            end_date = datetime.now()

        params = {
            'series_id': series_id,
            'api_key': self.api_key,
            'file_type': 'json',
            'observation_start': start_date.strftime('%Y-%m-%d'),
            'observation_end': end_date.strftime('%Y-%m-%d'),
            'sort_order': 'desc',  # 최신 데이터부터
            'limit': 1000
        }

        try:
            response = requests.get(self.BASE_URL, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()

            observations = data.get('observations', [])
            results = []

            for obs in observations:
                # '.' 값은 데이터 없음을 의미
                if obs['value'] != '.':
                    results.append({
                        'date': datetime.strptime(obs['date'], '%Y-%m-%d'),
                        'value': float(obs['value'])
                    })

            logger.info(f"Fetched {len(results)} observations for {series_id}")
            return results

        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching {series_id} from FRED: {e}")
            return []

    def fetch_all_indicators(
        self,
        start_date: Optional[datetime] = None
    ) -> Dict[str, List[Dict]]:
        """
        모든 FRED 지표 수집

        Returns:
            Dict[symbol, List[{date, value}]]
        """
        results = {}

        for symbol, series_id in self.SERIES_MAP.items():
            logger.info(f"Fetching {symbol} ({series_id})...")
            data = self.fetch_series(series_id, start_date)
            if data:
                results[symbol] = data

        logger.success(f"Collected {len(results)} indicators from FRED")
        return results

    def calculate_spread(
        self,
        ten_year_data: List[Dict],
        two_year_data: List[Dict]
    ) -> List[Dict]:
        """
        10Y-2Y Spread 계산

        Args:
            ten_year_data: 10Y Treasury 데이터
            two_year_data: 2Y Treasury 데이터

        Returns:
            List of {date, value} for spread
        """
        # 날짜별로 데이터 매핑
        ten_year_map = {d['date'].date(): d['value'] for d in ten_year_data}
        two_year_map = {d['date'].date(): d['value'] for d in two_year_data}

        # 공통 날짜에 대해 spread 계산
        spread_data = []
        for date in ten_year_map.keys():
            if date in two_year_map:
                spread = ten_year_map[date] - two_year_map[date]
                spread_data.append({
                    'date': datetime.combine(date, datetime.min.time()),
                    'value': spread
                })

        logger.info(f"Calculated {len(spread_data)} spread observations")
        return spread_data
