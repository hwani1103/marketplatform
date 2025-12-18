/**
 * Analytics Calculator - Layer 1
 * TypeScript implementation of statistical calculations
 */

interface DataPoint {
  timestamp: Date
  value: number
}

interface AnalyticsResult {
  current_value: number
  data_points: number
  latest_date: string
  ma_20?: number
  ma_50?: number
  ma_200?: number
  zscore?: number
  zscore_window: number
  percentile?: number
  volatility_20d?: number
  change_5d?: number
  change_20d?: number
}

/**
 * 이동평균 계산
 */
function calculateMovingAverage(values: number[], window: number): number | null {
  if (values.length < window) return null
  const slice = values.slice(-window)
  const sum = slice.reduce((acc, val) => acc + val, 0)
  return sum / slice.length
}

/**
 * Z-Score 계산 (exported for reuse across the app)
 * @param values - 시계열 데이터 배열
 * @param window - rolling window 크기 (기본값: 252일)
 * @returns Z-Score 값 또는 null
 */
export function calculateZScore(values: number[], window: number = 252): number | null {
  if (values.length < 2) return null

  const windowValues = values.slice(-Math.min(window, values.length))
  if (windowValues.length < 2) return null

  const mean = windowValues.reduce((acc, val) => acc + val, 0) / windowValues.length
  const squaredDiffs = windowValues.map(val => Math.pow(val - mean, 2))
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / (windowValues.length - 1)
  const std = Math.sqrt(variance)

  if (std === 0) return 0

  const currentValue = values[values.length - 1]
  return (currentValue - mean) / std
}

/**
 * 백분위 계산
 */
function calculatePercentile(values: number[]): number | null {
  if (values.length < 2) return null

  const currentValue = values[values.length - 1]
  const below = values.filter(v => v < currentValue).length
  const equal = values.filter(v => v === currentValue).length

  // Rank percentile
  return ((below + 0.5 * equal) / values.length) * 100
}

/**
 * 변동성 계산 (일별 수익률의 표준편차)
 */
function calculateVolatility(values: number[], window: number = 20): number | null {
  if (values.length < window + 1) return null

  // 일별 수익률 계산
  const returns: number[] = []
  for (let i = 1; i < values.length; i++) {
    const ret = ((values[i] - values[i - 1]) / values[i - 1]) * 100
    returns.push(ret)
  }

  // 최근 window 기간의 변동성
  const recentReturns = returns.slice(-window)
  const mean = recentReturns.reduce((acc, val) => acc + val, 0) / recentReturns.length
  const squaredDiffs = recentReturns.map(val => Math.pow(val - mean, 2))
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / (recentReturns.length - 1)

  return Math.sqrt(variance)
}

/**
 * 변화율 계산 (%)
 */
function calculateChange(values: number[], window: number): number | null {
  if (values.length <= window) return null

  const currentValue = values[values.length - 1]
  const oldValue = values[values.length - window - 1]

  if (oldValue === 0) return null

  return ((currentValue - oldValue) / oldValue) * 100
}

/**
 * 전체 통계 계산
 */
export function calculateIndicatorAnalytics(
  data: DataPoint[],
  options: {
    ma_windows?: number[]
    zscore_window?: number
    volatility_window?: number
    change_windows?: number[]
  } = {}
): AnalyticsResult {
  const {
    ma_windows = [20, 50, 200],
    zscore_window = 252,
    volatility_window = 20,
    change_windows = [5, 20],
  } = options

  if (!data || data.length === 0) {
    return {
      current_value: 0,
      data_points: 0,
      latest_date: new Date().toISOString(),
      zscore_window,
    }
  }

  // 시간순 정렬
  const sortedData = [...data].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  const values = sortedData.map(d => d.value)

  const result: AnalyticsResult = {
    current_value: values[values.length - 1],
    data_points: values.length,
    latest_date: sortedData[sortedData.length - 1].timestamp.toISOString(),
    zscore_window,
  }

  // 이동평균
  ma_windows.forEach(window => {
    const ma = calculateMovingAverage(values, window)
    if (ma !== null) {
      result[`ma_${window}` as keyof AnalyticsResult] = ma as any
    }
  })

  // Z-Score
  const zscore = calculateZScore(values, zscore_window)
  if (zscore !== null) {
    result.zscore = zscore
  }

  // Percentile
  const percentile = calculatePercentile(values)
  if (percentile !== null) {
    result.percentile = percentile
  }

  // Volatility
  const volatility = calculateVolatility(values, volatility_window)
  if (volatility !== null) {
    result.volatility_20d = volatility
  }

  // Changes
  change_windows.forEach(window => {
    const change = calculateChange(values, window)
    if (change !== null) {
      result[`change_${window}d` as keyof AnalyticsResult] = change as any
    }
  })

  return result
}
