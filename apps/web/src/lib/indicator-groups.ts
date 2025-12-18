/**
 * 연관성 있는 지표들을 그룹으로 정의
 * 각 그룹은 특정 시장 환경(국면)을 나타냄
 */

export interface IndicatorGroup {
  id: string
  name: string
  nameEn: string
  description: string
  symbols: string[]
  interpretation: {
    positive: string // 값이 상승할 때 의미
    negative: string // 값이 하락할 때 의미
  }
}

export const INDICATOR_GROUPS: IndicatorGroup[] = [
  {
    id: 'risk_environment',
    name: '위험자산 선호도',
    nameEn: 'Risk Environment',
    description: '주식시장과 변동성 지표를 통해 투자자들의 위험 선호 성향을 파악 (VIX는 역방향 처리)',
    symbols: ['SPX', 'NASDAQ', 'RUSSELL_2000', 'VIX'],
    interpretation: {
      positive: 'Risk-On: 주가 3개 지수 강세 + VIX 하락 → 투자자들이 위험자산 선호',
      negative: 'Risk-Off: 주가 3개 지수 약세 + VIX 상승 → 투자자들이 안전자산 선호',
    },
  },
  {
    id: 'liquidity_rates',
    name: '유동성 및 금리',
    nameEn: 'Liquidity & Rates',
    description: '국채 금리와 스프레드를 통해 시장 유동성과 경기 전망을 파악',
    symbols: ['US_10Y', 'US_2Y', 'SPREAD_10Y_2Y', 'US_10Y_REAL'],
    interpretation: {
      positive: '금리 상승: 경기 회복 기대 또는 긴축 우려, 장단기 스프레드 확대시 경기 회복 신호',
      negative: '금리 하락: 경기 둔화 우려 또는 완화 기대, 장단기 스프레드 축소시 경기 둔화 신호',
    },
  },
  {
    id: 'inflation_commodity',
    name: '인플레이션 및 원자재',
    nameEn: 'Inflation & Commodities',
    description: '물가 지표와 원자재 가격으로 인플레이션 압력 측정',
    symbols: ['CPI_YOY', 'CORE_CPI_YOY', 'PCE_YOY', 'INFLATION_EXP_5Y', 'WTI', 'GOLD'],
    interpretation: {
      positive: '인플레 압력 증가: 원자재 가격 상승, 소비자물가 상승, 긴축 가능성',
      negative: '인플레 압력 감소: 원자재 가격 하락, 소비자물가 안정, 완화 가능성',
    },
  },
  {
    id: 'currency_safe_haven',
    name: '통화 및 안전자산',
    nameEn: 'Currency & Safe Haven',
    description: '달러, 원화, 금 등 안전자산 흐름 파악',
    symbols: ['DXY', 'USD_KRW', 'GOLD'],
    interpretation: {
      positive: '달러 강세: 안전자산 선호, 신흥국 통화 약세, 금 가격 상승 가능',
      negative: '달러 약세: 위험자산 선호, 신흥국 통화 강세, 금 가격 하락 가능',
    },
  },
]

/**
 * 특정 심볼이 속한 그룹들을 찾기
 */
export function getGroupsForSymbol(symbol: string): IndicatorGroup[] {
  return INDICATOR_GROUPS.filter(group => group.symbols.includes(symbol))
}

/**
 * 그룹 ID로 그룹 찾기
 */
export function getGroupById(id: string): IndicatorGroup | undefined {
  return INDICATOR_GROUPS.find(group => group.id === id)
}
