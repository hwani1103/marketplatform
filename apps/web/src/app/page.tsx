'use client'

import { useEffect, useState } from 'react'

interface Indicator {
  id: string
  symbol: string
  value: number
  timestamp: string
  source: string
}

const SYMBOL_NAMES: Record<string, string> = {
  SPX: 'S&P 500',
  NASDAQ: 'NASDAQ',
  RUSSELL_2000: 'Russell 2000',
  VIX: 'VIX (변동성)',
  GOLD: 'Gold',
  WTI: 'WTI 원유',
  DXY: 'US Dollar Index',
  US_10Y: '미국 10년물 금리',
  US_2Y: '미국 2년물 금리',
  SPREAD_10Y_2Y: '10Y-2Y Spread',
  US_10Y_REAL: '미국 10년물 실질금리',
  CPI_YOY: 'CPI (전년비)',
  CORE_CPI_YOY: 'Core CPI (전년비)',
  PCE_YOY: 'PCE (전년비)',
  INFLATION_EXP_5Y: '5년 인플레이션 기대',
}

export default function Home() {
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/indicators')
      .then((res) => res.json())
      .then((data) => {
        setIndicators(data.indicators || [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">데이터 로딩 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-500">에러: {error}</div>
      </div>
    )
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Market Regime Platform</h1>
          <p className="text-gray-600 dark:text-gray-400">
            거시 시장 상태 요약 플랫폼 - 수집된 지표 확인
          </p>
          <p className="text-sm text-gray-500 mt-2">
            총 {indicators.length}개 지표 수집 완료
          </p>
        </div>

        {/* Indicators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {indicators.map((indicator) => (
            <div
              key={indicator.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold">
                  {SYMBOL_NAMES[indicator.symbol] || indicator.symbol}
                </h3>
                <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {indicator.source}
                </span>
              </div>

              <div className="text-3xl font-bold mb-2 text-blue-600 dark:text-blue-400">
                {indicator.value.toLocaleString('ko-KR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>

              <div className="text-sm text-gray-500">
                {new Date(indicator.timestamp).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>

              <div className="text-xs text-gray-400 mt-1">{indicator.symbol}</div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h2 className="text-xl font-bold mb-2">✅ 데이터 수집 완료!</h2>
          <p className="text-gray-700 dark:text-gray-300">
            FRED API와 Yahoo Finance에서 거시경제 지표를 성공적으로 수집했습니다.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            다음 단계: Layer 1 계산 엔진 (MA, Z-score) 구현
          </p>
        </div>
      </div>
    </main>
  )
}
