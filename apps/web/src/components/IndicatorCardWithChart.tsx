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
  description: string
  latestValue: number
  latestDate: string
  source: string
  days?: number
  color?: string
}

export default function IndicatorCardWithChart({
  symbol,
  name,
  description,
  latestValue,
  latestDate,
  source,
  days = 180,
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

  // 상승=빨간색, 하락=파란색
  const isPositive = change !== null && change >= 0

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-2xl transition-shadow duration-300">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex justify-between items-start mb-2">
          {/* 지표 이름 - 버튼식 디자인 + 툴팁 */}
          <div className="group relative">
            <button className="text-lg font-semibold text-gray-900 dark:text-white bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 px-3 py-1.5 rounded-lg hover:from-blue-100 hover:to-purple-100 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-200 cursor-help border-2 border-transparent hover:border-blue-300 dark:hover:border-blue-500 shadow-sm hover:shadow-md">
              {name}
              <span className="ml-1 text-blue-500 dark:text-blue-400">ⓘ</span>
            </button>

            {/* 툴팁 */}
            <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-gray-900 dark:bg-gray-950 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 border border-gray-700">
              <div className="font-semibold mb-1 text-blue-300">{name}</div>
              <div className="text-gray-200 leading-relaxed">{description}</div>
              <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 dark:bg-gray-950 border-l border-t border-gray-700 transform rotate-45"></div>
            </div>
          </div>

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

        {/* Change - 상승=빨간색, 하락=파란색 */}
        {changePercent !== null && (
          <div className={`text-sm font-medium ${isPositive ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
            {isPositive ? '▲' : '▼'} {Math.abs(changePercent).toFixed(2)}% (180일)
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

      {/* Footer - 날짜만 표시 */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(latestDate).toLocaleDateString('ko-KR')}
        </div>
      </div>
    </div>
  )
}
