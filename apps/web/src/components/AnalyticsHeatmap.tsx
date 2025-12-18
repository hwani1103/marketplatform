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

  useEffect(() => {
    const fetchAllAnalytics = async () => {
      const results = await Promise.all(
        symbols.map(async ({ symbol, name }) => {
          try {
            const res = await fetch(`/api/analytics/${symbol}?days=365`)
            const data = await res.json()
            return { ...data, symbol, name }
          } catch {
            return null
          }
        })
      )

      setAnalytics(results.filter(Boolean) as IndicatorAnalytics[])
      setLoading(false)
    }

    fetchAllAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-4">📊 Analytics Heatmap</h2>
        <div className="text-gray-500">Loading analytics...</div>
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
