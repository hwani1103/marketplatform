"""
Yahoo Finance Client
주식 지수, VIX, 원자재 데이터 수집
"""
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import yfinance as yf
from loguru import logger


class YahooFinanceClient:
    """Yahoo Finance 클라이언트"""

    # Yahoo Finance 티커 매핑
    TICKER_MAP = {
        # 주식 지수
        'SPX': '^GSPC',        # S&P 500
        'NASDAQ': '^IXIC',     # NASDAQ Composite
        'RUSSELL_2000': '^RUT', # Russell 2000

        # 변동성
        'VIX': '^VIX',         # CBOE Volatility Index

        # 원자재
        'GOLD': 'GC=F',        # Gold Futures
        'WTI': 'CL=F',         # WTI Crude Oil Futures

        # 통화
        'DXY': 'DX-Y.NYB',     # US Dollar Index
    }

    def fetch_ticker(
        self,
        ticker: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict]:
        """
        Yahoo Finance에서 티커 데이터 가져오기

        Args:
            ticker: Yahoo Finance 티커 (e.g., '^GSPC')
            start_date: 시작일 (기본값: 1년 전)
            end_date: 종료일 (기본값: 오늘)

        Returns:
            List of {date, value} dictionaries (종가 기준)
        """
        if start_date is None:
            start_date = datetime.now() - timedelta(days=365)
        if end_date is None:
            end_date = datetime.now()

        try:
            # yfinance로 데이터 다운로드
            data = yf.download(
                ticker,
                start=start_date.strftime('%Y-%m-%d'),
                end=end_date.strftime('%Y-%m-%d'),
                progress=False,
                auto_adjust=True
            )

            if data.empty:
                logger.warning(f"No data found for {ticker}")
                return []

            results = []
            for date, row in data.iterrows():
                # 종가(Close) 사용
                try:
                    close_price = float(row['Close'])
                    if not pd.isna(close_price):
                        results.append({
                            'date': date.to_pydatetime(),
                            'value': close_price
                        })
                except (ValueError, KeyError, TypeError):
                    continue

            # 최신순 정렬
            results.sort(key=lambda x: x['date'], reverse=True)

            logger.info(f"Fetched {len(results)} observations for {ticker}")
            return results

        except Exception as e:
            logger.error(f"Error fetching {ticker} from Yahoo Finance: {e}")
            return []

    def fetch_all_indicators(
        self,
        start_date: Optional[datetime] = None
    ) -> Dict[str, List[Dict]]:
        """
        모든 Yahoo Finance 지표 수집

        Returns:
            Dict[symbol, List[{date, value}]]
        """
        results = {}

        for symbol, ticker in self.TICKER_MAP.items():
            logger.info(f"Fetching {symbol} ({ticker})...")
            data = self.fetch_ticker(ticker, start_date)
            if data:
                results[symbol] = data

        logger.success(f"Collected {len(results)} indicators from Yahoo Finance")
        return results


# pandas import for isna check
import pandas as pd
