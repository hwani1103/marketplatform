'use client'

import { useEffect, useState } from 'react'
import LineChart from './LineChart'

interface IndicatorData {
  timestamp: string
  value: number
}

interface IndicatorChartProps {
  symbol: string
  name: string
  days?: number
}

export default function IndicatorChart({ symbol, name, days = 90 }: IndicatorChartProps) {
  const [data, setData] = useState<IndicatorData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/indicators/${symbol}?days=${days}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.data) {
          setData(result.data)
        }
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [symbol, days])

  if (loading) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  if (error || data.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-gray-500">데이터 없음</div>
      </div>
    )
  }

  // Format data for chart
  const chartData = data.map((d) => ({
    time: new Date(d.timestamp).toISOString().split('T')[0],
    value: d.value,
  }))

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4">{name}</h3>
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <LineChart data={chartData} />
      </div>
      <div className="mt-2 text-sm text-gray-500">
        최근 {days}일간 데이터 ({data.length}개 포인트)
      </div>
    </div>
  )
}
