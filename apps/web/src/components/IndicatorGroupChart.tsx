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

export default function IndicatorGroupChart({ group, days = 90 }: Props) {
  const [data, setData] = useState<GroupChartData>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchGroupData() {
      setLoading(true)
      setError(null)

      try {
        // 각 심볼별로 히스토리 데이터 가져오기
        const results = await Promise.all(
          group.symbols.map(async (symbol) => {
            const res = await fetch(`/api/indicators/${symbol}?days=${days}`)
            if (!res.ok) throw new Error(`Failed to fetch ${symbol}`)
            const json = await res.json()
            return { symbol, data: json.data }
          })
        )

        // 데이터 구조 변환
        const groupData: GroupChartData = {}
        results.forEach(({ symbol, data }) => {
          groupData[symbol] = data.map((d: any) => ({
            timestamp: new Date(d.timestamp),
            value: d.value,
          }))
        })

        // Z-Score 계산
        Object.keys(groupData).forEach((symbol) => {
          const values = groupData[symbol].map(d => d.value)
          const mean = values.reduce((a, b) => a + b, 0) / values.length
          const std = Math.sqrt(
            values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
          )

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

  // 첫 번째 심볼의 타임스탬프를 labels로 사용
  const firstSymbol = symbols[0]
  const labels = data[firstSymbol].map(d =>
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

  const chartData = {
    labels,
    datasets: symbols.map((symbol, index) => ({
      label: symbol,
      data: data[symbol].map(d => d.zscore || 0),
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length].replace('rgb', 'rgba').replace(')', ', 0.1)'),
      borderWidth: 2,
      tension: 0.3,
      pointRadius: 0,
      pointHoverRadius: 4,
    })),
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

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900">{group.name}</h3>
        <p className="text-sm text-gray-600 mt-1">{group.description}</p>
      </div>

      <div className="h-80 mb-4">
        <Line data={chartData} options={options} />
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-xs font-semibold text-green-700 mb-1">상승 시 의미</p>
          <p className="text-sm text-gray-700">{group.interpretation.positive}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-red-700 mb-1">하락 시 의미</p>
          <p className="text-sm text-gray-700">{group.interpretation.negative}</p>
        </div>
      </div>
    </div>
  )
}
