'use client'

import { useEffect, useState } from 'react'
import MiniChart from './MiniChart'

interface IndicatorData {
  timestamp: string
  value: number
}

interface IndicatorCardWithChartProps {
  symbol: string
  name: string
  latestValue: number
  latestDate: string
  source: string
  days?: number
  color?: string
}

export default function IndicatorCardWithChart({
  symbol,
  name,
  latestValue,
  latestDate,
  source,
  days = 30,
  color = '#3b82f6',
}: IndicatorCardWithChartProps) {
  const [data, setData] = useState<IndicatorData[]>([])
  const [loading, setLoading] = useState(true)
  const [change, setChange] = useState<number | null>(null)
  const [changePercent, setChangePercent] = useState<number | null>(null)

  useEffect(() => {
    fetch(`/api/indicators/${symbol}?days=${days}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.data && result.data.length > 0) {
          setData(result.data)

          // 변화율 계산
          const oldValue = result.data[0].value
          const newValue = result.data[result.data.length - 1].value
          const diff = newValue - oldValue
          const percent = ((diff / oldValue) * 100)

          setChange(diff)
          setChangePercent(percent)
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [symbol, days])

  const chartData = data.map((d) => ({
    time: new Date(d.timestamp).toISOString().split('T')[0],
    value: d.value,
  }))

  const isPositive = change !== null && change >= 0

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {name}
          </h3>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded">
            {source}
          </span>
        </div>

        {/* Latest Value */}
        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
          {latestValue.toLocaleString('ko-KR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>

        {/* Change */}
        {changePercent !== null && (
          <div className={`text-sm font-medium ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {isPositive ? '▲' : '▼'} {Math.abs(changePercent).toFixed(2)}% ({days}일)
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="px-6 pb-6">
        {loading ? (
          <div className="w-full h-[120px] bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
        ) : chartData.length > 0 ? (
          <MiniChart data={chartData} color={color} height={120} type="area" />
        ) : (
          <div className="w-full h-[120px] bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center text-gray-400 text-sm">
            차트 없음
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{new Date(latestDate).toLocaleDateString('ko-KR')}</span>
          <span className="font-mono">{symbol}</span>
        </div>
      </div>
    </div>
  )
}
