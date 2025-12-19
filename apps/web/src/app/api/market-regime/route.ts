import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { calculateZScore } from '@/lib/analytics'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const days = 365
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Layer 2: Risk Environment (주식 과중복 방지 위해 S&P만 사용)
    const riskSymbols = ['SPX', 'VIX', 'USD_KRW']
    const riskDataPromises = riskSymbols.map(async (symbol) => {
      const data = await prisma.indicatorRaw.findMany({
        where: { symbol, timestamp: { gte: startDate } },
        orderBy: { timestamp: 'asc' },
        select: { value: true, timestamp: true },
      })
      return { symbol, data }
    })

    const riskData = await Promise.all(riskDataPromises)

    // 각 지표의 Z-Score 계산 (252거래일 = 약 1년 rolling window)
    const riskZScores = riskData.map(({ symbol, data }) => {
      if (data.length === 0) return { symbol, zscore: 0, originalZScore: 0, isInverse: false }
      const values = data.map(d => Number(d.value))
      const originalZScore = calculateZScore(values, 252) ?? 0
      const isInverse = symbol === 'VIX' || symbol === 'USD_KRW'
      // VIX, USD_KRW는 역방향 (높을수록 Risk-Off)
      return {
        symbol,
        zscore: isInverse ? -originalZScore : originalZScore,
        originalZScore,
        isInverse
      }
    })

    const riskAvg = riskZScores.reduce((sum, r) => sum + r.zscore, 0) / riskZScores.length

    // Layer 3: Liquidity Environment
    const liquiditySymbols = ['US_10Y', 'US_2Y', 'US_10Y_REAL']
    const liquidityDataPromises = liquiditySymbols.map(async (symbol) => {
      const data = await prisma.indicatorRaw.findMany({
        where: { symbol, timestamp: { gte: startDate } },
        orderBy: { timestamp: 'asc' },
        select: { value: true, timestamp: true },
      })
      return { symbol, data }
    })

    const liquidityData = await Promise.all(liquidityDataPromises)
    const liquidityZScores = liquidityData.map(({ symbol, data }) => {
      if (data.length === 0) return { symbol, zscore: 0 }
      const values = data.map(d => Number(d.value))
      return { symbol, zscore: calculateZScore(values, 252) ?? 0 }
    })

    const liquidityAvg = liquidityZScores.reduce((sum, l) => sum + l.zscore, 0) / liquidityZScores.length

    // Layer 4: Inflation Environment
    const inflationSymbols = ['CPI_YOY', 'CORE_CPI_YOY', 'PCE_YOY', 'INFLATION_EXP_5Y', 'WTI', 'GOLD']
    const inflationDataPromises = inflationSymbols.map(async (symbol) => {
      const data = await prisma.indicatorRaw.findMany({
        where: { symbol, timestamp: { gte: startDate } },
        orderBy: { timestamp: 'asc' },
        select: { value: true, timestamp: true },
      })
      return { symbol, data }
    })

    const inflationData = await Promise.all(inflationDataPromises)
    const inflationZScores = inflationData.map(({ symbol, data }) => {
      if (data.length === 0) return { symbol, zscore: 0 }
      const values = data.map(d => Number(d.value))
      return { symbol, zscore: calculateZScore(values, 252) ?? 0 }
    })

    // 인플레이션은 Max Logic 사용 (하나라도 튀면 위험)
    // CPI 지표 중 최대값 + 원자재 평균의 가중 평균
    const cpiSymbols = ['CPI_YOY', 'CORE_CPI_YOY', 'PCE_YOY']
    const cpiZScores = inflationZScores.filter(z => cpiSymbols.includes(z.symbol)).map(z => z.zscore)
    const maxCPI = cpiZScores.length > 0 ? Math.max(...cpiZScores) : 0

    // 금은 안전자산 수요가 섞여있으므로 가중치 절반 적용
    const inflationExpZScore = inflationZScores.find(z => z.symbol === 'INFLATION_EXP_5Y')?.zscore ?? 0
    const wtiZScore = inflationZScores.find(z => z.symbol === 'WTI')?.zscore ?? 0
    const goldZScore = inflationZScores.find(z => z.symbol === 'GOLD')?.zscore ?? 0
    const commodityAvg = (inflationExpZScore + wtiZScore + goldZScore * 0.5) / 2.5

    // 최종: CPI Max 60% + 원자재 평균 40%
    const inflationAvg = (maxCPI * 0.6) + (commodityAvg * 0.4)

    // 금 과매수 + 실물 인플레 안정 = 안전자산 수요 (지정학/금융 불안)
    const goldWarning = goldZScore > 2 && maxCPI < 0

    // Final Market Regime 판단
    let regime = 'NEUTRAL'
    let regimeKo = '중립'
    let description = ''
    let color = 'gray'

    // 골디락스: 주가 강세 + 금리 적당히 낮음 + 물가 안정 (극단값 배제)
    if (riskAvg > 1 && liquidityAvg < 0 && liquidityAvg > -1.2 && inflationAvg < 0.5 && inflationAvg > -1.5) {
      regime = 'GOLDILOCKS'
      regimeKo = '골디락스 (이상적 환경)'
      description = '주가 강세 + 금리 안정 + 물가 안정 → 가장 이상적인 투자 환경입니다. 위험자산을 적극 매수하기 좋은 시기입니다.'
      color = 'green'
    } else if (riskAvg > 0.5) {
      regime = 'RISK_ON'
      regimeKo = 'Risk-On (위험자산 선호)'
      if (inflationAvg > 1) {
        description = '주가 강세이지만 인플레이션 압력이 높습니다. 긴축 우려가 있어 주의가 필요합니다.'
      } else if (liquidityAvg > 1) {
        description = '주가 강세이지만 금리가 상승 중입니다. 긴축 국면에서 변동성이 클 수 있습니다.'
      } else {
        description = '주가 강세 + 경기 회복 기대. 위험자산 투자에 유리한 환경입니다.'
      }
      color = 'blue'
    } else if (riskAvg < -0.5) {
      regime = 'RISK_OFF'
      regimeKo = 'Risk-Off (안전자산 선호)'
      if (liquidityAvg < -0.5) {
        description = '주가 약세 + 금리 하락 → 경기 침체 우려가 큽니다. 현금 및 채권 보유를 고려하세요.'
      } else {
        description = '주가 약세 환경입니다. 안전자산(채권, 금) 비중을 늘리는 것이 좋습니다.'
      }
      color = 'red'
    } else {
      regime = 'MIXED'
      regimeKo = '혼조 (방향성 불명확)'
      description = '지표들이 엇갈리고 있어 시장 방향성이 불명확합니다. 관망하거나 분산 투자가 적절합니다.'
      color = 'yellow'
    }

    // 금 과매수 경고 추가
    if (goldWarning) {
      description += ' (주의: 금 가격이 극단적으로 상승 중입니다. 지정학적 리스크 또는 금융시장 불안 요인이 있을 수 있습니다.)'
    }

    // 가장 최근 데이터의 timestamp 찾기
    const latestTimestamp = Math.max(
      ...riskData.flatMap(d => d.data.map(p => p.timestamp.getTime())),
      ...liquidityData.flatMap(d => d.data.map(p => p.timestamp.getTime())),
      ...inflationData.flatMap(d => d.data.map(p => p.timestamp.getTime()))
    )

    return NextResponse.json({
      regime,
      regimeKo,
      description,
      color,
      layers: {
        risk: {
          avgZScore: riskAvg,
          state: riskAvg > 0.5 ? 'RISK_ON' : riskAvg < -0.5 ? 'RISK_OFF' : 'NEUTRAL',
          stateKo: riskAvg > 0.5 ? 'Risk-On' : riskAvg < -0.5 ? 'Risk-Off' : '중립',
          indicators: riskZScores,
        },
        liquidity: {
          avgZScore: liquidityAvg,
          state: liquidityAvg > 0.5 ? 'TIGHTENING' : liquidityAvg < -0.5 ? 'EASING' : 'NEUTRAL',
          stateKo: liquidityAvg > 0.5 ? '긴축' : liquidityAvg < -0.5 ? '완화' : '중립',
          indicators: liquidityZScores,
        },
        inflation: {
          avgZScore: inflationAvg,
          state: inflationAvg > 1 ? 'HIGH' : inflationAvg < -1 ? 'LOW' : 'NORMAL',
          stateKo: inflationAvg > 1 ? '높음' : inflationAvg < -1 ? '낮음' : '보통',
          indicators: inflationZScores,
        },
      },
      calculatedAt: new Date(latestTimestamp).toISOString(),
      metadata: {
        zscoreWindow: '252거래일 (약 1년)',
        thresholds: '±0.5σ (시장 변화에 민감하게 반응). 보수적 판단은 ±1σ 이상 권장',
        riskWeighting: 'S&P 500 단독 사용 (주식 지수 과중복 방지)',
        inflationLogic: 'CPI Max 60% + 원자재 평균 40% (금 가중치 50% 축소)',
        notes: '골디락스 조건: 주가 강세 + 금리 적당히 낮음 (극단값 배제) + 물가 안정'
      }
    })
  } catch (error) {
    console.error('Error calculating market regime:', error)
    return NextResponse.json(
      { error: 'Failed to calculate market regime' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
