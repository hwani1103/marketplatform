'use client'

import { useEffect, useState } from 'react'
import IndicatorCardWithChart from '@/components/IndicatorCardWithChart'
import AnalyticsHeatmap from '@/components/AnalyticsHeatmap'
import FinalMarketRegime from '@/components/FinalMarketRegime'
import IndicatorGroupChart from '@/components/IndicatorGroupChart'
import StickyNav from '@/components/StickyNav'
import { INDICATOR_GROUPS } from '@/lib/indicator-groups'

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
    description: 'S&P 500 옵션 가격에서 산출된 변동성 지수. 시장의 공포와 불확실성을 측정하는 "공포 지수"입니다. 높을수록: 시장 불안과 공포 확대, 주가 하락 가능성. 낮을수록: 시장 안정, 투자자 낙관론 우세. 보통 20 이하면 안정, 30 이상이면 불안한 시장 상태입니다. 단기 방향성보다는 시장의 불확실성 수준을 보여주는 지표입니다.'
  },

  // 원자재
  GOLD: {
    name: 'Gold',
    color: '#f59e0b',
    category: '원자재',
    description: '금 선물 가격. 인플레이션 헤지 자산이자 대표적인 안전자산입니다. 높을수록: 경기 불확실성 증가, 인플레이션 우려, 달러 약세 신호. 낮을수록: 시장 안정, 위험자산(주식) 선호 경향. 특히 실질금리가 상승하면 금에는 부담으로 작용하는 경향이 있습니다.'
  },
  WTI: {
    name: 'WTI 원유',
    color: '#000000',
    category: '원자재',
    description: '서부 텍사스산 원유 선물 가격. 글로벌 경기와 인플레이션의 선행지표입니다. 높을수록: 인플레이션 압력 증가, 글로벌 수요 강세 신호. 낮을수록: 경기 둔화 우려, 수요 감소 예상. 급등 시 소비자 물가 부담이 커지고 기업 비용도 상승합니다. 수요 요인뿐 아니라 지정학·공급 이슈(OPEC 정책 등)에도 크게 영향을 받습니다.'
  },

  // 통화
  DXY: {
    name: 'US Dollar Index',
    color: '#10b981',
    category: '통화',
    description: '주요 6개 통화(유로, 엔, 파운드 등) 대비 달러 가치 지수입니다. 높을수록: 달러 강세, 글로벌 유동성 축소, 신흥국 부담 증가, 금/원자재 약세. 낮을수록: 달러 약세, 위험자산 선호, 신흥국 자산 강세. 연준 정책뿐 아니라 글로벌 위험 선호도(리스크 온/오프)에 따라 변동합니다.'
  },
  USD_KRW: {
    name: '원/달러 환율',
    color: '#3b82f6',
    category: '통화',
    description: '1달러를 사는데 필요한 원화 금액입니다. 높을수록(환율 상승): 원화 약세, 수출 유리하지만 수입 물가 상승, 해외 투자 시 환율 리스크가 커집니다. 낮을수록(환율 하락): 원화 강세, 수입 물가 안정, 해외 여행/투자 유리. 한국 투자자는 해외 주식 투자 타이밍을 잡는 중요한 지표입니다.'
  },

  // 금리
  US_10Y: {
    name: '미국 10년물 금리',
    color: '#6366f1',
    category: '금리',
    description: '미국 10년 만기 국채 수익률. 장기 금리 수준을 나타내며 주식과 채권 밸류에이션의 기준이 됩니다. 높을수록: 채권 가격 하락, 주식(특히 성장주) 부담 증가, 차입 비용 상승. 낮을수록: 경기 둔화 우려, 안전자산 선호, 채권 가격 상승. 주식 밸류에이션에 직접적인 영향을 미칩니다.'
  },
  US_2Y: {
    name: '미국 2년물 금리',
    color: '#8b5cf6',
    category: '금리',
    description: '미국 2년 만기 국채 수익률. 연준의 정책금리 변화를 가장 민감하게 반영하는 지표입니다. 높을수록: 연준 긴축 기대 확대, 단기 자금 비용 상승. 낮을수록: 금리 인하 기대 또는 경기 둔화 우려가 반영될 수 있습니다. 연준 회의 전후로 크게 변동하며 정책 방향을 예측하는 핵심 지표입니다.'
  },
  SPREAD_10Y_2Y: {
    name: '10Y-2Y Spread',
    color: '#ec4899',
    category: '금리',
    description: '10년물과 2년물 금리 차이. 정상적으로는 장기 금리가 단기 금리보다 높아 양수입니다. 양수(정상): 정상적인 경기 사이클, 장기 성장 기대. 음수(역전): 단기 금리가 장기 금리보다 높은 비정상 상태로, 과거 경기 침체 전에 반복적으로 발생한 신호입니다. 역전 자체보다, 이후 다시 정상화되는 과정이 더 중요하게 해석됩니다.'
  },
  US_10Y_REAL: {
    name: '미국 10년물 실질금리',
    color: '#14b8a6',
    category: '금리',
    description: '10년 국채 금리에서 기대 인플레이션을 뺀 실질 수익률입니다. 높을수록: 채권을 보유했을 때 실제 구매력 기준 수익이 커지며, 금/성장주 약세(대체 투자처 매력 하락). 낮을수록(특히 마이너스): 금과 성장주 강세, 실물자산 선호. 실질금리가 너무 높으면 주식 밸류에이션에 부담을 주고, 마이너스면 금 같은 무이자 자산의 매력이 커집니다.'
  },

  // 인플레이션
  CPI_YOY: {
    name: 'CPI (전년비)',
    color: '#f97316',
    category: '인플레이션',
    description: '소비자물가지수의 전년 대비 상승률. 일반인이 체감하는 물가 수준을 나타냅니다. 높을수록: 물가 상승, 구매력 저하, 연준 긴축 압력 증가(금리 인상 가능성). 낮을수록: 물가 안정 또는 디플레이션 우려, 완화적 정책 가능. 보통 연준은 2% 목표를 두고 있으며, 3~4% 이상이 지속되면 긴축 압력이 커집니다.'
  },
  CORE_CPI_YOY: {
    name: 'Core CPI (전년비)',
    color: '#dc2626',
    category: '인플레이션',
    description: '식품과 에너지를 제외한 근원 소비자물가지수. 단기 변동성이 큰 항목을 제외해 기저 인플레이션 추세를 봅니다. 높을수록: 구조적 인플레이션 압력 존재, 임금/서비스 물가 상승. 낮을수록: 근본적인 물가 압력 완화. 연준은 Core CPI가 지속적으로 높으면 긴축을 유지하고, 낮아지면 완화를 고려합니다.'
  },
  PCE_YOY: {
    name: 'PCE (전년비)',
    color: '#ea580c',
    category: '인플레이션',
    description: '개인소비지출 물가지수. 연준이 정책 결정 시 가장 중요하게 보는 인플레이션 지표입니다. 높을수록: 연준의 긴축 기조 유지 또는 강화 가능성 증가, 소비자 부담 확대. 낮을수록: 완화적 정책 기조 유지 가능, 물가 안정 신호. CPI보다 소비 패턴 변화를 잘 반영하며, 연준의 2% 목표 달성 여부를 판단하는 핵심 지표입니다.'
  },
  INFLATION_EXP_5Y: {
    name: '5년 인플레이션 기대',
    color: '#f59e0b',
    category: '인플레이션',
    description: '시장 참여자들이 예상하는 향후 5년간 평균 인플레이션율입니다. 높을수록: 인플레이션이 고착화(anchoring)될 우려, 물가 상승 심리 확산, 연준의 긴축 압력 증가. 낮을수록: 물가 안정 기대, 연준 정책 신뢰도 유지. 인플레이션 기대가 실제 인플레이션을 만들기 때문에 급등할 경우 연준의 긴축 부담이 커질 수 있습니다.'
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

  const navSections = [
    { id: 'market-regime', label: '최종 시장 국면 판단' },
    { id: 'indicators-overview', label: '전체 지표 현황' },
    { id: 'environment-analysis', label: '환경별 심층 분석' },
    { id: 'individual-indicators', label: '개별 지표 상세' },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
      {/* Sticky Navigation */}
      <StickyNav sections={navSections} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 1. 최종 시장 국면 판단 */}
        <section id="market-regime" className="mb-16 scroll-mt-32">
          <FinalMarketRegime />
        </section>

        {/* 2. 전체 지표 현황 */}
        <section id="indicators-overview" className="mb-16 scroll-mt-32">
          <div className="mb-6">
            <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
              📊 전체 지표 현황
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              16개 주요 거시경제 지표의 Z-Score 기반 분석
            </p>
          </div>
          <AnalyticsHeatmap />
        </section>

        {/* 3. 환경별 심층 분석 */}
        <section id="environment-analysis" className="mb-16 scroll-mt-32">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
              📈 환경별 심층 분석
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              연관 지표 그룹별 시계열 추이 및 동적 해석
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {INDICATOR_GROUPS.map((group) => (
              <IndicatorGroupChart key={group.id} group={group} days={90} />
            ))}
          </div>
        </section>

        {/* 4. 개별 지표 상세 차트 */}
        <section id="individual-indicators" className="mb-16 scroll-mt-32">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
              📉 개별 지표 상세
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              카테고리별 개별 지표의 상세 시계열 차트
            </p>
          </div>

          {categoryOrder.map((category) => {
            const categoryIndicators = groupedIndicators[category]
            if (!categoryIndicators || categoryIndicators.length === 0) return null

            return (
              <div key={category} className="mb-12">
                <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200 flex items-center gap-3">
                <span className="text-4xl">
                  {category === '주식 지수' && '📈'}
                  {category === '변동성' && '⚡'}
                  {category === '금리' && '💰'}
                  {category === '원자재' && '🏆'}
                  {category === '통화' && '💵'}
                  {category === '인플레이션' && '📊'}
                </span>
                {category}
              </h3>

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
        </section>
      </div>
    </main>
  )
}
