'use client'

import { useEffect, useState } from 'react'

interface IndicatorAnalytics {
  symbol: string
  name: string
  current_value: number
  zscore?: number
  percentile?: number
  interpretation: string
  signal: string
  ma_20?: number
  ma_50?: number
  ma_200?: number
}

export default function AnalyticsHeatmap() {
  const [analytics, setAnalytics] = useState<IndicatorAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [useMockData, setUseMockData] = useState(false)

  const symbols = [
    { symbol: 'SPX', name: 'S&P 500' },
    { symbol: 'NASDAQ', name: 'NASDAQ' },
    { symbol: 'RUSSELL_2000', name: 'Russell 2000' },
    { symbol: 'VIX', name: 'VIX' },
    { symbol: 'GOLD', name: 'Gold' },
    { symbol: 'WTI', name: 'WTI Oil' },
    { symbol: 'DXY', name: 'Dollar Index' },
    { symbol: 'USD_KRW', name: 'USD/KRW' },
    { symbol: 'US_10Y', name: 'US 10Y' },
    { symbol: 'US_2Y', name: 'US 2Y' },
    { symbol: 'SPREAD_10Y_2Y', name: '10Y-2Y Spread' },
    { symbol: 'US_10Y_REAL', name: 'US 10Y Real' },
    { symbol: 'CPI_YOY', name: 'CPI' },
    { symbol: 'CORE_CPI_YOY', name: 'Core CPI' },
    { symbol: 'PCE_YOY', name: 'PCE' },
    { symbol: 'INFLATION_EXP_5Y', name: '5Y Inflation Exp' },
  ]

  // Mock 데이터 생성
  const generateMockData = (): IndicatorAnalytics[] => {
    return symbols.map(({ symbol, name }) => {
      // 랜덤 Z-Score (-2.5 ~ +2.5)
      const zscore = (Math.random() - 0.5) * 5
      const percentile = Math.random() * 100

      let interpretation = 'NORMAL'
      let signal = 'Normal Range'

      if (zscore > 2) {
        interpretation = 'EXTREME_HIGH'
        signal = 'Overbought - 조정 가능성'
      } else if (zscore > 1) {
        interpretation = 'ELEVATED'
        signal = 'Above Average - 주의 필요'
      } else if (zscore > -1) {
        interpretation = 'NORMAL'
        signal = 'Normal Range - 안정적'
      } else if (zscore > -2) {
        interpretation = 'DEPRESSED'
        signal = 'Below Average - 반등 가능성'
      } else {
        interpretation = 'EXTREME_LOW'
        signal = 'Oversold - 강한 반등 가능성'
      }

      return {
        symbol,
        name,
        current_value: 5000 + Math.random() * 2000,
        zscore,
        percentile,
        interpretation,
        signal,
        ma_20: 5000,
        ma_50: 4900,
        ma_200: 4700,
      }
    })
  }

  useEffect(() => {
    const fetchAllAnalytics = async () => {
      // Mock 모드면 가짜 데이터 사용
      if (useMockData) {
        console.log('🎭 Using mock data for development')
        setAnalytics(generateMockData())
        setLoading(false)
        return
      }

      const results = await Promise.all(
        symbols.map(async ({ symbol, name }) => {
          try {
            const res = await fetch(`/api/analytics/${symbol}?days=365`)

            if (!res.ok) {
              console.warn(`Analytics API error for ${symbol}: ${res.status}`)
              return null
            }

            const data = await res.json()

            // API 에러 체크
            if (data.error) {
              console.warn(`Analytics error for ${symbol}:`, data.error)
              return null
            }

            return { ...data, symbol, name }
          } catch (error) {
            console.error(`Failed to fetch analytics for ${symbol}:`, error)
            return null
          }
        })
      )

      const validResults = results.filter(Boolean) as IndicatorAnalytics[]

      // 디버깅: 결과 확인
      console.log(`✅ Analytics loaded: ${validResults.length}/${symbols.length} indicators`)
      if (validResults.length > 0) {
        console.log('Sample data:', validResults[0])
      }

      setAnalytics(validResults)
      setLoading(false)
    }

    fetchAllAnalytics()
  }, [useMockData])

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-4">📊 Analytics Heatmap</h2>
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    )
  }

  // 데이터가 없을 때
  if (analytics.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
        <h2 className="text-2xl font-bold mb-4">📊 Analytics Heatmap</h2>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div>
              <div className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                Analytics 데이터를 불러올 수 없습니다
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                • 데이터베이스 연결을 확인하세요<br />
                • 브라우저 콘솔에서 에러 로그를 확인하세요<br />
                • 데이터 수집기가 실행되어 있는지 확인하세요
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const getZScoreColor = (zscore: number | undefined) => {
    if (zscore === undefined) return 'bg-gray-200 dark:bg-gray-700'
    if (zscore > 2) return 'bg-red-500'
    if (zscore > 1) return 'bg-orange-400'
    if (zscore > -1) return 'bg-green-500'
    if (zscore > -2) return 'bg-blue-400'
    return 'bg-blue-600'
  }

  const getZScoreEmoji = (zscore: number | undefined) => {
    if (zscore === undefined) return '❔'
    if (zscore > 2) return '🔴'
    if (zscore > 1) return '🟡'
    if (zscore > -1) return '🟢'
    if (zscore > -2) return '🔵'
    return '🔵'
  }

  const getZScorePosition = (zscore: number | undefined) => {
    if (zscore === undefined) return 50
    // -3σ ~ +3σ를 0% ~ 100%로 변환
    const clamped = Math.max(-3, Math.min(3, zscore))
    return ((clamped + 3) / 6) * 100
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          📊 Layer 1: Analytics Heatmap
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          모든 지표의 역사적 상대적 위치 (Z-Score)
        </p>
      </div>

      <div className="space-y-3">
        {analytics
          .sort((a, b) => (b.zscore || 0) - (a.zscore || 0))
          .map((item) => (
            <div key={item.symbol} className="flex items-center gap-4">
              {/* 지표 이름 */}
              <div className="w-32 text-sm font-medium text-gray-900 dark:text-white">
                {item.name}
              </div>

              {/* Z-Score 바 */}
              <div className="flex-1 relative h-8 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                {/* 중앙선 (0σ) */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-400 dark:bg-gray-500 z-10"></div>

                {/* Z-Score 표시 */}
                {item.zscore !== undefined && (
                  <div
                    className={`absolute top-0 bottom-0 w-2 ${getZScoreColor(item.zscore)} opacity-80`}
                    style={{
                      left: `${getZScorePosition(item.zscore)}%`,
                      transform: 'translateX(-50%)',
                    }}
                  ></div>
                )}

                {/* 그리드 라인 */}
                <div className="absolute inset-0 flex justify-between px-1">
                  <div className="text-[10px] text-gray-400 dark:text-gray-500">-3σ</div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500">-2σ</div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500">-1σ</div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">0</div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500">+1σ</div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500">+2σ</div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500">+3σ</div>
                </div>
              </div>

              {/* Z-Score 값 */}
              <div className="w-24 text-right">
                {item.zscore !== undefined ? (
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {item.zscore >= 0 ? '+' : ''}
                    {item.zscore.toFixed(2)}σ
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">N/A</span>
                )}
              </div>

              {/* 상태 이모지 */}
              <div className="w-8 text-center text-xl">{getZScoreEmoji(item.zscore)}</div>

              {/* 해석 */}
              <div className="w-40 text-xs text-gray-600 dark:text-gray-400 truncate">
                {item.signal}
              </div>
            </div>
          ))}
      </div>

      {/* 범례 */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-6 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span>🔴 Overbought (&gt;+2σ)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-400"></div>
            <span>🟡 Elevated (+1σ~+2σ)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span>🟢 Normal (-1σ~+1σ)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-400"></div>
            <span>🔵 Depressed (-2σ~-1σ)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-600"></div>
            <span>🔵 Oversold (&lt;-2σ)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
