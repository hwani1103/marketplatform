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
  detailedExplanation?: string // 각 지표의 역할을 상세히 설명
  interpretation: {
    positive: string // 평균 Z-Score 양수일 때
    negative: string // 평균 Z-Score 음수일 때
  }
}

export const INDICATOR_GROUPS: IndicatorGroup[] = [
  {
    id: 'risk_environment',
    name: '위험자산 선호도',
    nameEn: 'Risk Environment',
    description: '주식시장, 변동성, 환율 지표를 통해 투자자들의 위험 선호 성향을 파악',
    symbols: ['SPX', 'VIX', 'USD_KRW'],
    detailedExplanation: '• SPX: S&P 500 지수 (미국 대표 주가, 상승 = Risk-On)\n• VIX: 변동성 지수 (상승 = Risk-Off, 역방향 처리)\n• USD_KRW: 원/달러 환율 (상승 = 자금 이탈, Risk-Off, 역방향 처리)\n* 주식 지수 과중복 방지를 위해 S&P 500만 사용',
    interpretation: {
      positive: 'S&P 500 강세 + VIX 하락 + 원/달러 하락 → Risk-On 국면 (위험자산 선호, 신흥국 자금 유입)',
      negative: 'S&P 500 약세 + VIX 상승 + 원/달러 상승 → Risk-Off 국면 (안전자산 선호, 신흥국 자금 이탈)',
    },
  },
  {
    id: 'liquidity_rates',
    name: '금리 환경',
    nameEn: 'Interest Rate Environment',
    description: '장단기 금리와 실질금리로 통화정책 기조를 측정',
    symbols: ['US_10Y', 'US_2Y', 'US_10Y_REAL'],
    detailedExplanation: '• US_10Y: 10년물 국채 금리 (장기 금리 수준, 채권/주식 밸류에이션 기준)\n• US_2Y: 2년물 국채 금리 (연준 정책금리 기대치 반영)\n• US_10Y_REAL: 10년물 실질금리 (인플레 조정 후 실제 수익률, 성장주/금 밸류에이션에 영향)\n• 금리차(10Y-2Y): Steepening(확대) = 경기 회복 기대, Flattening(축소) = 경기 둔화 우려',
    interpretation: {
      positive: '장단기 금리 + 실질금리 상승 → 긴축 국면 (연준의 인플레 억제 의지 반영). 단, 금리차 확대 시 경기 회복 기대 반영.',
      negative: '장단기 금리 + 실질금리 하락 → 완화 국면 (경기 부양 또는 침체 우려). 단, 금리차 축소/역전 시 경기 둔화 신호.',
    },
  },
  {
    id: 'inflation_commodity',
    name: '인플레이션 압력',
    nameEn: 'Inflation Pressure',
    description: '실제 물가, 기대 인플레, 원자재 가격을 종합하여 인플레이션 압력 측정',
    symbols: ['CPI_YOY', 'CORE_CPI_YOY', 'PCE_YOY', 'INFLATION_EXP_5Y', 'WTI', 'GOLD'],
    detailedExplanation: '• CPI, Core CPI, PCE: 실제 소비자 물가 상승률 (연준이 직접 관찰하는 인플레 지표)\n• INFLATION_EXP_5Y: 시장이 예상하는 향후 5년간 평균 인플레율 (기대 인플레가 높으면 실제 인플레로 이어질 위험)\n• WTI: 원유 가격 (에너지는 모든 생산비용에 영향, 인플레의 선행지표)\n• GOLD: 인플레 헤지 자산 (인플레 압력이 높을 때 수요 증가)',
    interpretation: {
      positive: '물가 상승 + 기대 인플레 상승 + 원자재 강세 → 인플레 압력 ↑ (연준 긴축 불가피)',
      negative: '물가 안정 + 기대 인플레 하락 + 원자재 약세 → 인플레 압력 ↓ (연준 완화 여력)',
    },
  },
  {
    id: 'currency',
    name: '달러 강도',
    nameEn: 'Dollar Strength',
    description: '글로벌 달러 지수와 원화 환율로 달러 강도 측정',
    symbols: ['DXY', 'USD_KRW'],
    detailedExplanation: '• DXY: 달러 인덱스 (주요 6개 통화 대비 달러 가치, 상승 = 글로벌 달러 수요 증가)\n• USD_KRW: 원/달러 환율 (원화는 대표적인 신흥국 통화, 상승 = 신흥국 자금 이탈)',
    interpretation: {
      positive: 'DXY ↑ + 원/달러 ↑ → 달러 강세 국면 (미국 금리 우위, 안전자산 선호, 또는 신흥국 리스크)',
      negative: 'DXY ↓ + 원/달러 ↓ → 달러 약세 국면 (글로벌 유동성 확대, 위험자산 선호, 신흥국 자금 유입)',
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
