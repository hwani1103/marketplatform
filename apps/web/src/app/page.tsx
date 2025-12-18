'use client'

import { useEffect, useState } from 'react'
import IndicatorChart from '@/components/IndicatorChart'

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-xl font-medium">데이터 로딩 중...</div>
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
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Market Regime Platform
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
            거시 시장 상태 요약 플랫폼
          </p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              총 {indicators.length}개 지표 수집 완료
            </span>
            <span className="text-sm text-gray-500">
              마지막 업데이트: {new Date().toLocaleDateString('ko-KR')}
            </span>
          </div>
        </div>

        {/* Featured Charts */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            📊 주요 지표 차트
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <IndicatorChart symbol="SPX" name="S&P 500" days={90} />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <IndicatorChart symbol="VIX" name="VIX (변동성 지수)" days={90} />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <IndicatorChart symbol="US_10Y" name="미국 10년물 금리" days={90} />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <IndicatorChart symbol="GOLD" name="Gold" days={90} />
            </div>
          </div>
        </div>

        {/* All Indicators Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            📈 모든 지표
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {indicators.map((indicator) => (
              <div
                key={indicator.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {SYMBOL_NAMES[indicator.symbol] || indicator.symbol}
                  </h3>
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-3 py-1 rounded-full">
                    {indicator.source}
                  </span>
                </div>

                <div className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {indicator.value.toLocaleString('ko-KR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(indicator.timestamp).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                    {indicator.symbol}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-4">
            <div className="text-4xl">✅</div>
            <div>
              <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                데이터 수집 완료!
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                FRED API와 Yahoo Finance에서 거시경제 지표를 성공적으로 수집했습니다.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                📌 다음 단계: Layer 1 계산 엔진 (MA, Z-score) 구현
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
