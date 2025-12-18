import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { calculateIndicatorAnalytics } from '@/lib/analytics'

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = params
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '365', 10)

    // Prisma로 데이터 가져오기
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const indicators = await prisma.indicator.findMany({
      where: {
        symbol,
        timestamp: {
          gte: startDate,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
      select: {
        timestamp: true,
        value: true,
      },
    })

    if (indicators.length === 0) {
      return NextResponse.json(
        { error: 'No data found for this symbol' },
        { status: 404 }
      )
    }

    // Analytics 계산
    const analytics = calculateIndicatorAnalytics(
      indicators.map(ind => ({
        timestamp: ind.timestamp,
        value: Number(ind.value),
      })),
      {
        ma_windows: [20, 50, 200],
        zscore_window: 252,
        volatility_window: 20,
        change_windows: [5, 20],
      }
    )

    // Z-Score 해석 추가
    const zscore = analytics.zscore
    let interpretation = 'NORMAL'
    let signal = 'Neutral'

    if (zscore !== undefined) {
      if (zscore > 2) {
        interpretation = 'EXTREME_HIGH'
        signal = 'Overbought - 조정 가능성'
      } else if (zscore > 1) {
        interpretation = 'ELEVATED'
        signal = 'Above Average - 주의 필요'
      } else if (zscore > -1) {
        interpretation = 'NORMAL'
        signal = 'Normal Range - 안정적'
      } else if (zscore > -2) {
        interpretation = 'DEPRESSED'
        signal = 'Below Average - 반등 가능성'
      } else {
        interpretation = 'EXTREME_LOW'
        signal = 'Oversold - 강한 반등 가능성'
      }
    }

    return NextResponse.json({
      symbol,
      ...analytics,
      interpretation,
      signal,
      calculated_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error calculating analytics:', error)
    return NextResponse.json(
      { error: 'Failed to calculate analytics' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
