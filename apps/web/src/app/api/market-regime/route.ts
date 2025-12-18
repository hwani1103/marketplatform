import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 간단한 Z-Score 계산 함수
function calculateSimpleZScore(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const std = Math.sqrt(
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  )
  return std > 0 ? (values[values.length - 1] - mean) / std : 0
}

export async function GET() {
  try {
    const days = 365
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Layer 2: Risk Environment
    const riskSymbols = ['SPX', 'NASDAQ', 'RUSSELL_2000', 'VIX']
    const riskDataPromises = riskSymbols.map(async (symbol) => {
      const data = await prisma.indicatorRaw.findMany({
        where: { symbol, timestamp: { gte: startDate } },
        orderBy: { timestamp: 'asc' },
        select: { value: true, timestamp: true },
      })
      return { symbol, data }
    })

    const riskData = await Promise.all(riskDataPromises)

    // 각 지표의 Z-Score 계산
    const riskZScores = riskData.map(({ symbol, data }) => {
      if (data.length === 0) return { symbol, zscore: 0 }
      const values = data.map(d => Number(d.value))
      const zscore = calculateSimpleZScore(values)
      // VIX는 역방향
      return { symbol, zscore: symbol === 'VIX' ? -zscore : zscore }
    })

    const riskAvg = riskZScores.reduce((sum, r) => sum + r.zscore, 0) / riskZScores.length

    // Layer 3: Liquidity Environment
    const liquiditySymbols = ['US_10Y', 'US_2Y', 'US_10Y_REAL']
    const liquidityDataPromises = liquiditySymbols.map(async (symbol) => {
      const data = await prisma.indicatorRaw.findMany({
        where: { symbol, timestamp: { gte: startDate } },
        orderBy: { timestamp: 'asc' },
        select: { value: true },
      })
      return { symbol, data }
    })

    const liquidityData = await Promise.all(liquidityDataPromises)
    const liquidityZScores = liquidityData.map(({ symbol, data }) => {
      if (data.length === 0) return { symbol, zscore: 0 }
      const values = data.map(d => Number(d.value))
      return { symbol, zscore: calculateSimpleZScore(values) }
    })

    const liquidityAvg = liquidityZScores.reduce((sum, l) => sum + l.zscore, 0) / liquidityZScores.length

    // Layer 4: Inflation Environment
    const inflationSymbols = ['CPI_YOY', 'CORE_CPI_YOY', 'PCE_YOY', 'WTI', 'GOLD']
    const inflationDataPromises = inflationSymbols.map(async (symbol) => {
      const data = await prisma.indicatorRaw.findMany({
        where: { symbol, timestamp: { gte: startDate } },
        orderBy: { timestamp: 'asc' },
        select: { value: true },
      })
      return { symbol, data }
    })

    const inflationData = await Promise.all(inflationDataPromises)
    const inflationZScores = inflationData.map(({ symbol, data }) => {
      if (data.length === 0) return { symbol, zscore: 0 }
      const values = data.map(d => Number(d.value))
      return { symbol, zscore: calculateSimpleZScore(values) }
    })

    const inflationAvg = inflationZScores.reduce((sum, i) => sum + i.zscore, 0) / inflationZScores.length

    // Final Market Regime 판단
    let regime = 'NEUTRAL'
    let regimeKo = '중립'
    let description = ''
    let color = 'gray'

    if (riskAvg > 1 && liquidityAvg < 0 && inflationAvg < 0) {
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
