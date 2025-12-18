import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    const symbol = params.symbol
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '90')

    // N일 이전부터의 모든 데이터 가져오기 (다른 API들과 동일한 방식)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const data = await prisma.indicatorRaw.findMany({
      where: {
        symbol,
        timestamp: { gte: startDate }
      },
      orderBy: { timestamp: 'asc' },
    })

    // 이미 시간순 정렬되어 있음
    const sortedData = data

    return NextResponse.json({
      symbol,
      data: sortedData,
      count: sortedData.length,
    })
  } catch (error) {
    console.error('Error fetching indicator history:', error)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}
