import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // 각 지표별 최신 데이터 가져오기
    const symbols = [
      'SPX',
      'NASDAQ',
      'RUSSELL_2000',
      'VIX',
      'GOLD',
      'WTI',
      'DXY',
      'US_10Y',
      'US_2Y',
      'SPREAD_10Y_2Y',
      'US_10Y_REAL',
      'CPI_YOY',
      'CORE_CPI_YOY',
      'PCE_YOY',
      'INFLATION_EXP_5Y',
    ]

    const indicators = await Promise.all(
      symbols.map(async (symbol) => {
        const latest = await prisma.indicatorRaw.findFirst({
          where: { symbol },
          orderBy: { timestamp: 'desc' },
        })
        return latest
      })
    )

    // null 제거
    const validIndicators = indicators.filter((ind) => ind !== null)

    return NextResponse.json({
      indicators: validIndicators,
      count: validIndicators.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching indicators:', error)
    return NextResponse.json({ error: 'Failed to fetch indicators' }, { status: 500 })
  }
}
