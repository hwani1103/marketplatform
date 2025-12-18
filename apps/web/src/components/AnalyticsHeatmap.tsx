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
  // Mock 데이터 모드 (DB 연결 확인 후 false로)
  const [useMockData, setUseMockData] = useState(false)

  const symbols = [
    { symbol: 'SPX', name: 'S&P 500', nameKo: 'S&P 500', description: '미국 대형주 500개 기업의 시가총액 가중 지수. 미국 주식 시장 전체의 건강도를 나타내는 가장 중요한 지표입니다.' },
    { symbol: 'NASDAQ', name: 'NASDAQ', nameKo: '나스닥', description: '나스닥 거래소의 모든 상장 주식을 포함한 지수. 기술주 중심으로 성장주의 흐름을 파악할 수 있습니다.' },
    { symbol: 'RUSSELL_2000', name: 'Russell 2000', nameKo: '러셀 2000', description: '미국 소형주 2000개 기업의 지수. 경기 민감도가 높아 경기 사이클 판단에 유용합니다.' },
    { symbol: 'VIX', name: 'VIX', nameKo: 'VIX (변동성)', description: 'S&P 500 옵션 가격에서 산출된 변동성 지수. 시장의 공포와 불확실성을 측정하는 "공포 지수"입니다.' },
    { symbol: 'GOLD', name: 'Gold', nameKo: '금 (Gold)', description: '금 현물 가격. 인플레이션 헤지, 안전자산으로 경기 불확실성 시 수요가 증가합니다.' },
    { symbol: 'WTI', name: 'WTI Oil', nameKo: 'WTI 원유', description: '서부텍사스유(WTI) 원유 가격. 글로벌 경기와 인플레이션을 반영하는 에너지 가격 지표입니다.' },
    { symbol: 'DXY', name: 'Dollar Index', nameKo: '달러 인덱스', description: '주요 6개 통화 대비 미국 달러 가치를 측정하는 지수. 글로벌 자금 흐름과 위험 선호도를 반영합니다.' },
    { symbol: 'USD_KRW', name: 'USD/KRW', nameKo: '원/달러 환율', description: '달러당 원화 환율. 한국 투자자에게 매우 중요한 지표로, 환노출과 자산 배분 전략에 핵심적입니다.' },
    { symbol: 'US_10Y', name: 'US 10Y', nameKo: '미국 10년물', description: '미국 10년 만기 국채 수익률. 장기 금리 수준으로 주식/부동산 밸류에이션의 기준이 됩니다.' },
    { symbol: 'US_2Y', name: 'US 2Y', nameKo: '미국 2년물', description: '미국 2년 만기 국채 수익률. 연준 기준금리 변화 기대를 가장 잘 반영합니다.' },
    { symbol: 'SPREAD_10Y_2Y', name: '10Y-2Y Spread', nameKo: '장단기 금리차', description: '10년물과 2년물 수익률 차이. 마이너스면 경기 침체 신호로 해석됩니다.' },
    { symbol: 'US_10Y_REAL', name: 'US 10Y Real', nameKo: '10년물 실질금리', description: '10년물 명목금리에서 기대 인플레이션을 뺀 실질 수익률. 금/성장주 밸류에이션에 직접 영향을 줍니다.' },
    { symbol: 'CPI_YOY', name: 'CPI', nameKo: 'CPI (소비자물가)', description: '소비자물가지수 전년 대비 상승률. 연준 통화정책의 가장 중요한 목표 지표입니다.' },
    { symbol: 'CORE_CPI_YOY', name: 'Core CPI', nameKo: '근원 CPI', description: '식품/에너지를 제외한 근원 소비자물가 상승률. 변동성이 적어 구조적 인플레 추세를 파악하는 데 유용합니다.' },
    { symbol: 'PCE_YOY', name: 'PCE', nameKo: 'PCE (개인소비지출)', description: '개인소비지출 물가지수. 연준이 공식 목표로 사용하는 인플레이션 지표입니다.' },
    { symbol: 'INFLATION_EXP_5Y', name: '5Y Inflation Exp', nameKo: '5년 인플레 기대', description: '5년 기대 인플레이션율. 시장이 향후 5년간 예상하는 평균 인플레이션 수준입니다.' },
  ]

  // Mock 데이터 생성
  const generateMockData = (): IndicatorAnalytics[] => {
    return symbols.map(({ symbol, name, nameKo }) => {
      // 랜덤 Z-Score (-2.5 ~ +2.5)
      const zscore = (Math.random() - 0.5) * 5
      const percentile = Math.random() * 100

      let interpretation = 'NORMAL'
      let signal = '정상 범위 - 안정적'

      if (zscore > 2) {
        interpretation = 'EXTREME_HIGH'
        signal = '과매수 - 조정 가능성'
      } else if (zscore > 1) {
        interpretation = 'ELEVATED'
        signal = '평균 이상 - 주의 필요'
      } else if (zscore > -1) {
        interpretation = 'NORMAL'
        signal = '정상 범위 - 안정적'
      } else if (zscore > -2) {
        interpretation = 'DEPRESSED'
        signal = '평균 이하 - 반등 가능성'
      } else {
        interpretation = 'EXTREME_LOW'
        signal = '과매도 - 강한 반등 가능성'
      }

      return {
        symbol,
        name: nameKo,
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
        symbols.map(async ({ symbol, name, nameKo }) => {
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

            return { ...data, symbol, name: nameKo }
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
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          💡 지표 이름에 마우스를 올리면 상세 설명을 확인할 수 있습니다
        </p>
      </div>

      <div className="space-y-3">
        {analytics
          .sort((a, b) => (b.zscore || 0) - (a.zscore || 0))
          .map((item) => {
            const symbolInfo = symbols.find(s => s.symbol === item.symbol)
            return (
              <div key={item.symbol} className="flex items-center gap-4">
                {/* 지표 이름 */}
                <div className="w-32 text-sm font-medium text-gray-900 dark:text-white group relative cursor-help">
                  <span className="border-b border-dotted border-gray-400 dark:border-gray-500">
                    {item.name}
                  </span>
                  {/* Tooltip */}
                  {symbolInfo?.description && (
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 w-64 p-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg shadow-xl">
                      <div className="font-semibold mb-1">{symbolInfo.nameKo}</div>
                      <div className="text-gray-200 dark:text-gray-700">{symbolInfo.description}</div>
                      {/* Arrow */}
                      <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                    </div>
                  )}
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
          )
        })}
      </div>

      {/* 범례 */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-6 text-xs text-gray-600 dark:text-gray-400 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span>🔴 과매수 - 조정 가능성 (&gt;+2σ)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-400"></div>
            <span>🟡 평균 이상 - 주의 필요 (+1σ~+2σ)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span>🟢 정상 범위 - 안정적 (-1σ~+1σ)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-400"></div>
            <span>🔵 평균 이하 - 반등 가능성 (-2σ~-1σ)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-600"></div>
            <span>🔵 과매도 - 강한 반등 가능성 (&lt;-2σ)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
