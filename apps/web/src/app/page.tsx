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

const SYMBOL_INFO: Record<string, { name: string; color: string; category: string; description: string }> = {
  // 주식 지수
  SPX: {
    name: 'S&P 500',
    color: '#3b82f6',
    category: '주식 지수',
    description: '미국 대형주 500개 기업의 시가총액 가중 지수. 미국 주식 시장 전체의 건강도를 나타내는 가장 중요한 지표입니다.'
  },
  NASDAQ: {
    name: 'NASDAQ',
    color: '#8b5cf6',
    category: '주식 지수',
    description: '나스닥 거래소의 모든 상장 주식을 포함한 지수. 기술주 중심으로 성장주의 흐름을 파악할 수 있습니다.'
  },
  RUSSELL_2000: {
    name: 'Russell 2000',
    color: '#06b6d4',
    category: '주식 지수',
    description: '미국 소형주 2000개 기업의 지수. 경기 민감도가 높아 경기 사이클 판단에 유용합니다.'
  },

  // 변동성 & 리스크
  VIX: {
    name: 'VIX (변동성)',
    color: '#ef4444',
    category: '변동성',
    description: 'S&P 500 옵션 가격에서 산출된 변동성 지수. 시장의 공포와 불확실성을 측정하는 "공포 지수"입니다.'
  },

  // 원자재
  GOLD: {
    name: 'Gold',
    color: '#f59e0b',
    category: '원자재',
    description: '금 선물 가격. 인플레이션 헤지 자산이자 안전자산으로, 불확실성이 높을 때 상승합니다.'
  },
  WTI: {
    name: 'WTI 원유',
    color: '#000000',
    category: '원자재',
    description: '서부 텍사스산 원유 선물 가격. 글로벌 경기와 인플레이션의 선행지표로 활용됩니다.'
  },

  // 통화
  DXY: {
    name: 'US Dollar Index',
    color: '#10b981',
    category: '통화',
    description: '주요 6개 통화 대비 달러 가치 지수. 달러 강세는 글로벌 유동성 축소 신호일 수 있습니다.'
  },
  USD_KRW: {
    name: '원/달러 환율',
    color: '#3b82f6',
    category: '통화',
    description: '1달러당 원화 가격. 한국 투자자에게 환율 리스크와 해외 자산 투자 타이밍을 판단하는 지표입니다.'
  },

  // 금리
  US_10Y: {
    name: '미국 10년물 금리',
    color: '#6366f1',
    category: '금리',
    description: '미국 10년 만기 국채 수익률. 장기 금리 수준을 나타내며 주식과 채권 밸류에이션의 기준이 됩니다.'
  },
  US_2Y: {
    name: '미국 2년물 금리',
    color: '#8b5cf6',
    category: '금리',
    description: '미국 2년 만기 국채 수익률. 연준 정책금리 변화를 반영하는 단기 금리 지표입니다.'
  },
  SPREAD_10Y_2Y: {
    name: '10Y-2Y Spread',
    color: '#ec4899',
    category: '금리',
    description: '10년물과 2년물 금리 차이. 마이너스일 때(역전) 경기 침체 가능성을 시사하는 중요한 신호입니다.'
  },
  US_10Y_REAL: {
    name: '미국 10년물 실질금리',
    color: '#14b8a6',
    category: '금리',
    description: '인플레이션을 제외한 실질 금리. 금과 성장주 밸류에이션에 큰 영향을 미칩니다.'
  },

  // 인플레이션
  CPI_YOY: {
    name: 'CPI (전년비)',
    color: '#f97316',
    category: '인플레이션',
    description: '소비자물가지수 전년 대비 변화율. 일반적인 인플레이션 수준을 가장 직관적으로 나타냅니다.'
  },
  CORE_CPI_YOY: {
    name: 'Core CPI (전년비)',
    color: '#dc2626',
    category: '인플레이션',
    description: '식품과 에너지를 제외한 근원 소비자물가지수. 기저 인플레이션 추세를 파악하는 데 사용됩니다.'
  },
  PCE_YOY: {
    name: 'PCE (전년비)',
    color: '#ea580c',
    category: '인플레이션',
    description: '개인소비지출 물가지수. 연준이 정책 결정 시 가장 중요하게 보는 인플레이션 지표입니다.'
  },
  INFLATION_EXP_5Y: {
    name: '5년 인플레이션 기대',
    color: '#f59e0b',
    category: '인플레이션',
    description: '시장이 예상하는 향후 5년간 평균 인플레이션율. 인플레이션 기대가 고착화되는지 판단할 수 있습니다.'
  },
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
                    description: '이 지표에 대한 설명이 준비 중입니다.',
                  }

                  return (
                    <IndicatorCardWithChart
                      key={indicator.id}
                      symbol={indicator.symbol}
                      name={info.name}
                      description={info.description}
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
                  16개 거시경제 지표를 실시간으로 추적하고 있습니다.
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
