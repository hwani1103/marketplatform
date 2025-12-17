"""
Database operations for storing collected data
"""
from datetime import datetime
from typing import List, Dict
from sqlalchemy import create_engine, Column, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from loguru import logger
import os

Base = declarative_base()


class IndicatorRaw(Base):
    """Raw indicator data model (matches Prisma schema)"""
    __tablename__ = 'indicators_raw'

    id = Column(String, primary_key=True)
    symbol = Column(String, nullable=False)
    value = Column(Float, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    source = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class DatabaseManager:
    """데이터베이스 관리 클래스"""

    def __init__(self, database_url: str):
        """
        Args:
            database_url: PostgreSQL 연결 URL
        """
        self.engine = create_engine(database_url)
        self.SessionLocal = sessionmaker(bind=self.engine)

    def save_indicators(
        self,
        symbol: str,
        data: List[Dict],
        source: str
    ) -> int:
        """
        지표 데이터를 DB에 저장

        Args:
            symbol: 지표 심볼 (e.g., 'SPX', 'US_10Y')
            data: List of {date, value} dictionaries
            source: 데이터 소스 ('FRED' or 'Yahoo Finance')

        Returns:
            저장된 레코드 수
        """
        session = self.SessionLocal()
        saved_count = 0

        try:
            for item in data:
                # 중복 체크를 위한 ID 생성 (symbol + timestamp)
                timestamp = item['date']
                record_id = f"{symbol}_{timestamp.strftime('%Y%m%d')}"

                # 기존 레코드 확인
                existing = session.query(IndicatorRaw).filter_by(id=record_id).first()

                if existing:
                    # 업데이트
                    existing.value = item['value']
                    existing.source = source
                else:
                    # 새로 삽입
                    indicator = IndicatorRaw(
                        id=record_id,
                        symbol=symbol,
                        value=item['value'],
                        timestamp=timestamp,
                        source=source
                    )
                    session.add(indicator)
                    saved_count += 1

            session.commit()
            logger.info(f"Saved {saved_count} new records for {symbol}")
            return saved_count

        except Exception as e:
            session.rollback()
            logger.error(f"Error saving {symbol} to database: {e}")
            return 0

        finally:
            session.close()

    def save_all_indicators(
        self,
        data_dict: Dict[str, List[Dict]],
        source: str
    ) -> Dict[str, int]:
        """
        여러 지표를 한 번에 저장

        Args:
            data_dict: Dict[symbol, List[{date, value}]]
            source: 데이터 소스

        Returns:
            Dict[symbol, saved_count]
        """
        results = {}

        for symbol, data in data_dict.items():
            count = self.save_indicators(symbol, data, source)
            results[symbol] = count

        total = sum(results.values())
        logger.success(f"Total {total} records saved to database")
        return results
