'use client'

import React, { useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js'
import { IndicatorGroup } from '@/lib/indicator-groups'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface IndicatorDataPoint {
  timestamp: Date
  value: number
  zscore?: number
}

interface GroupChartData {
  [symbol: string]: IndicatorDataPoint[]
}

interface Props {
  group: IndicatorGroup
  days?: number
}

// Symbol 한글 이름 매핑
const SYMBOL_NAMES_KO: Record<string, string> = {
  SPX: 'S&P 500',
  NASDAQ: '나스닥',
  RUSSELL_2000: '러셀 2000',
  VIX: 'VIX',
  US_10Y: '미국 10년물',
  US_2Y: '미국 2년물',
  US_10Y_REAL: '미국 10년 실질금리',
  CPI_YOY: 'CPI',
  CORE_CPI_YOY: '근원 CPI',
  PCE_YOY: 'PCE',
  INFLATION_EXP_5Y: '5년 인플레 기대',
  WTI: 'WTI 원유',
  GOLD: '금',
  DXY: '달러인덱스',
  USD_KRW: '원/달러',
}

export default function IndicatorGroupChart({ group, days = 365 }: Props) {
  const [data, setData] = useState<GroupChartData>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchGroupData() {
      setLoading(true)
      setError(null)

      try {
        // 각 심볼별로 히스토리 데이터 가져오기 (365일)
        const results = await Promise.all(
          group.symbols.map(async (symbol) => {
            const res = await fetch(`/api/indicators/${symbol}?days=365`)
            if (!res.ok) throw new Error(`Failed to fetch ${symbol}`)
            const json = await res.json()
            return { symbol, data: json.data }
          })
        )

        // 데이터 구조 변환 (Number() 변환 필수!)
        const groupData: GroupChartData = {}
        results.forEach(({ symbol, data }) => {
          groupData[symbol] = data.map((d: any) => ({
            timestamp: new Date(d.timestamp),
            value: Number(d.value),  // Prisma Float/Decimal을 number로 변환
          }))
        })

        // Z-Score 계산 (252일 rolling window 기준 - /lib/analytics.ts와 동일)
        Object.keys(groupData).forEach((symbol) => {
          const values = groupData[symbol].map(d => d.value)

          // 252일 window 사용 (최근 252일치 데이터로 mean/std 계산)
          const window = 252
          const windowValues = values.slice(-Math.min(window, values.length))

          if (windowValues.length < 2) {
            groupData[symbol].forEach((point) => {
              point.zscore = 0
            })
            return
          }

          // 최근 252일 데이터의 mean과 std 계산 (lib/analytics.ts와 동일)
          const mean = windowValues.reduce((a, b) => a + b, 0) / windowValues.length
          const squaredDiffs = windowValues.map(val => Math.pow(val - mean, 2))
          const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (windowValues.length - 1)
          const std = Math.sqrt(variance)

          // 각 포인트의 Z-Score를 계산 (동일한 mean/std 기준 사용)
          groupData[symbol].forEach((point) => {
            point.zscore = std > 0 ? (point.value - mean) / std : 0
          })
        })

        setData(groupData)
      } catch (err) {
        console.error('Error fetching group data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchGroupData()
  }, [group.symbols, days])

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Error: {error}</p>
      </div>
    )
  }

  // Chart.js 데이터 구성
  const symbols = Object.keys(data)
  if (symbols.length === 0) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data available</p>
      </div>
    )
  }

  // 가장 많은 데이터를 가진 심볼을 찾아 labels로 사용
  // (월별 데이터와 일별 데이터 혼재 시 일별 데이터 기준)
  const longestSymbol = symbols.reduce((prev, curr) =>
    data[curr].length > data[prev].length ? curr : prev
  )
  const labels = data[longestSymbol].map(d =>
    d.timestamp.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  )

  // 색상 팔레트
  const colors = [
    'rgb(59, 130, 246)',   // blue
    'rgb(239, 68, 68)',    // red
    'rgb(34, 197, 94)',    // green
    'rgb(251, 146, 60)',   // orange
    'rgb(168, 85, 247)',   // purple
    'rgb(236, 72, 153)',   // pink
  ]

  // 역방향 지표 처리 (그룹별로 다름)
  // Risk Environment 그룹에서만 VIX를 역방향 처리
  const inverseSymbols = group.id === 'risk_environment' ? ['VIX'] : []

  // 평균 Z-Score 계산 및 각 지표 상태
  const indicatorStates = symbols.map(symbol => {
    const latestData = data[symbol]?.[data[symbol].length - 1]
    const zscore = latestData?.zscore || 0
    const adjustedZScore = inverseSymbols.includes(symbol) ? -zscore : zscore
    return {
      symbol,
      originalZScore: zscore,
      adjustedZScore,
      direction: adjustedZScore > 0.5 ? '↑' : adjustedZScore < -0.5 ? '↓' : '→'
    }
  })

  const avgZScore = indicatorStates.reduce((sum, s) => sum + s.adjustedZScore, 0) / symbols.length

  // 동적 해석 생성
  const generateDynamicInterpretation = () => {
    const summary = indicatorStates.map(s => `${SYMBOL_NAMES_KO[s.symbol] || s.symbol} ${s.direction}`).join(', ')

    if (avgZScore > 0) {
      return `${summary} → ${group.interpretation.positive}`
    } else {
      return `${summary} → ${group.interpretation.negative}`
    }
  }

  const chartData = {
    labels,
    datasets: symbols.map((symbol, index) => {
      const isInverse = inverseSymbols.includes(symbol)
      const symbolName = SYMBOL_NAMES_KO[symbol] || symbol

      // 데이터 길이 맞추기: longestSymbol 기준으로 매핑
      const referenceTimestamps = data[longestSymbol].map(d => d.timestamp.getTime())
      const symbolData = referenceTimestamps.map(refTime => {
        const point = data[symbol].find(d => d.timestamp.getTime() === refTime)
        if (point) {
          const zscore = point.zscore || 0
          return isInverse ? -zscore : zscore
        }
        return null  // 해당 날짜에 데이터 없으면 null
      })

      return {
        label: isInverse ? `${symbolName} (역)` : symbolName,
        data: symbolData,
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length].replace('rgb', 'rgba').replace(')', ', 0.1)'),
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
        spanGaps: true,  // null 값 건너뛰고 선 연결
      }
    }),
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || ''
            const value = context.parsed.y
            return `${label}: ${value >= 0 ? '+' : ''}${value.toFixed(2)}σ`
          },
        },
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Z-Score (표준편차)',
        },
        grid: {
          color: (context) => {
            if (context.tick.value === 0) return 'rgba(0, 0, 0, 0.3)'
            if (context.tick.value === 2 || context.tick.value === -2) return 'rgba(239, 68, 68, 0.3)'
            if (context.tick.value === 1 || context.tick.value === -1) return 'rgba(251, 146, 60, 0.2)'
            return 'rgba(0, 0, 0, 0.05)'
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  }

  // Z-Score에 따른 색상 결정
  const getZScoreColor = (zscore: number) => {
    if (zscore > 2) return 'bg-red-500'
    if (zscore > 1) return 'bg-orange-500'
    if (zscore > -1) return 'bg-green-500'
    if (zscore > -2) return 'bg-blue-500'
    return 'bg-purple-500'
  }

  const getZScoreTextColor = (zscore: number) => {
    if (zscore > 2) return 'text-red-700'
    if (zscore > 1) return 'text-orange-700'
    if (zscore > -1) return 'text-green-700'
    if (zscore > -2) return 'text-blue-700'
    return 'text-purple-700'
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900">{group.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{group.description}</p>
        </div>
        <div className="ml-4">
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">평균 Z-Score</div>
            <div className={`inline-flex items-center px-4 py-2 rounded-lg text-white font-bold text-lg ${getZScoreColor(avgZScore)}`}>
              {avgZScore >= 0 ? '+' : ''}{avgZScore.toFixed(2)}σ
            </div>
          </div>
        </div>
      </div>

      {/* 차트 */}
      <div className="h-80 mb-4">
        <Line data={chartData} options={options} />
      </div>

      {/* 해석 박스 */}
      <div className="mt-4 space-y-3">
        {/* 각 지표 설명 */}
        {group.detailedExplanation && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-xs font-semibold text-gray-700 mb-2">📊 각 지표의 의미</div>
            <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
              {group.detailedExplanation}
            </div>
          </div>
        )}

        {/* 종합 해석 */}
        <div className={`p-4 rounded-lg border-2 ${
          avgZScore > 0
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className={`text-xs font-semibold mb-2 ${getZScoreTextColor(avgZScore)}`}>
            💡 현재 상황 (평균 Z-Score {avgZScore >= 0 ? '+' : ''}{avgZScore.toFixed(2)}σ)
          </div>
          <div className="text-sm text-gray-800 font-medium whitespace-pre-wrap">
            {generateDynamicInterpretation()}
          </div>
        </div>

        {/* 역방향 지표 경고 */}
        {inverseSymbols.length > 0 && (
          <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded border border-blue-200">
            ⚠️ <strong>{inverseSymbols.join(', ')}</strong>는 역방향 지표로 처리됩니다
            (높을수록 Risk-Off이므로 Z-Score 부호를 반전하여 계산)
          </div>
        )}
      </div>
    </div>
  )
}
