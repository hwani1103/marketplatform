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

    // 최근 N일치 데이터 가져오기
    const data = await prisma.indicatorRaw.findMany({
      where: { symbol },
      orderBy: { timestamp: 'desc' },
      take: days,
    })

    // 시간순 정렬 (차트용)
    const sortedData = data.reverse()

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
