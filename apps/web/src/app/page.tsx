'use client'

import { useEffect, useState } from 'react'
import IndicatorCardWithChart from '@/components/IndicatorCardWithChart'

interface Indicator {
  id: string
  symbol: string
  value: number
  timestamp: string
  source: string
}

const SYMBOL_INFO: Record<string, { name: string; color: string; category: string }> = {
  // 주식 지수
  SPX: { name: 'S&P 500', color: '#3b82f6', category: '주식 지수' },
  NASDAQ: { name: 'NASDAQ', color: '#8b5cf6', category: '주식 지수' },
  RUSSELL_2000: { name: 'Russell 2000', color: '#06b6d4', category: '주식 지수' },

  // 변동성 & 리스크
  VIX: { name: 'VIX (변동성)', color: '#ef4444', category: '변동성' },

  // 원자재
  GOLD: { name: 'Gold', color: '#f59e0b', category: '원자재' },
  WTI: { name: 'WTI 원유', color: '#000000', category: '원자재' },

  // 통화
  DXY: { name: 'US Dollar Index', color: '#10b981', category: '통화' },

  // 금리
  US_10Y: { name: '미국 10년물 금리', color: '#6366f1', category: '금리' },
  US_2Y: { name: '미국 2년물 금리', color: '#8b5cf6', category: '금리' },
  SPREAD_10Y_2Y: { name: '10Y-2Y Spread', color: '#ec4899', category: '금리' },
  US_10Y_REAL: { name: '미국 10년물 실질금리', color: '#14b8a6', category: '금리' },

  // 인플레이션
  CPI_YOY: { name: 'CPI (전년비)', color: '#f97316', category: '인플레이션' },
  CORE_CPI_YOY: { name: 'Core CPI (전년비)', color: '#dc2626', category: '인플레이션' },
  PCE_YOY: { name: 'PCE (전년비)', color: '#ea580c', category: '인플레이션' },
  INFLATION_EXP_5Y: { name: '5년 인플레이션 기대', color: '#f59e0b', category: '인플레이션' },
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

  // 카테고리별로 그룹화
  const groupedIndicators = indicators.reduce((acc, indicator) => {
    const info = SYMBOL_INFO[indicator.symbol]
    const category = info?.category || '기타'
    if (!acc[category]) acc[category] = []
    acc[category].push(indicator)
    return acc
  }, {} as Record<string, Indicator[]>)

  const categoryOrder = ['주식 지수', '변동성', '금리', '원자재', '통화', '인플레이션']

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Market Regime Platform
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
            거시 시장 상태를 한눈에 확인하세요
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg">
              ✓ {indicators.length}개 지표 실시간 수집
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              마지막 업데이트: {new Date().toLocaleString('ko-KR')}
            </span>
          </div>
        </div>

        {/* Categories */}
        {categoryOrder.map((category) => {
          const categoryIndicators = groupedIndicators[category]
          if (!categoryIndicators || categoryIndicators.length === 0) return null

          return (
            <div key={category} className="mb-16">
              <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-3">
                <span className="text-4xl">
                  {category === '주식 지수' && '📈'}
                  {category === '변동성' && '⚡'}
                  {category === '금리' && '💰'}
                  {category === '원자재' && '🏆'}
                  {category === '통화' && '💵'}
                  {category === '인플레이션' && '📊'}
                </span>
                {category}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryIndicators.map((indicator) => {
                  const info = SYMBOL_INFO[indicator.symbol] || {
                    name: indicator.symbol,
                    color: '#3b82f6',
                    category: '기타',
                  }

                  return (
                    <IndicatorCardWithChart
                      key={indicator.id}
                      symbol={indicator.symbol}
                      name={info.name}
                      latestValue={indicator.value}
                      latestDate={indicator.timestamp}
                      source={indicator.source}
                      days={180}
                      color={info.color}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Info Banner */}
        <div className="mt-16 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl p-[2px] shadow-2xl">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8">
            <div className="flex items-start gap-4">
              <div className="text-5xl">🎉</div>
              <div>
                <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  모든 지표 차트로 확인 가능!
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-3 text-lg">
                  15개 거시경제 지표를 실시간으로 추적하고 있습니다.
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>✓ 180일간 추세를 미니 차트로 표시</li>
                  <li>✓ 차트에 마우스 올리면 날짜와 값 표시</li>
                  <li>✓ 변화율(%) 자동 계산</li>
                  <li>✓ FRED API + Yahoo Finance 데이터 통합</li>
                  <li>✓ 카테고리별 구분으로 쉬운 탐색</li>
                </ul>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    📌 다음 단계: Layer 1 계산 엔진 (MA, Z-score) 구현
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
