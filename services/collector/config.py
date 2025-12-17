import os
from dotenv import load_dotenv

load_dotenv()

# Database
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://market_regime:dev_password@localhost:5432/market_regime_db')

# External APIs
FRED_API_KEY = os.getenv('FRED_API_KEY', '')

# Collection settings
COLLECTION_SCHEDULE = '09:00'  # Daily at 9 AM
LOOKBACK_DAYS = 365  # How many days of historical data to collect initially
