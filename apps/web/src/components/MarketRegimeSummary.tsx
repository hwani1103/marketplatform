'use client'

import React, { useEffect, useState } from 'react'
import { INDICATOR_GROUPS, IndicatorGroup } from '@/lib/indicator-groups'

interface IndicatorAnalytics {
  symbol: string
  zscore?: number
  current_value?: number
  ma_20?: number
  percentile?: number
}

interface GroupSummary {
  group: IndicatorGroup
  avgZScore: number
  state: 'extreme_high' | 'elevated' | 'normal' | 'depressed' | 'extreme_low'
  signal: string
  color: string
}

export default function MarketRegimeSummary() {
  const [summaries, setSummaries] = useState<GroupSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSummaries() {
      setLoading(true)

      try {
        const groupSummaries: GroupSummary[] = []

        for (const group of INDICATOR_GROUPS) {
          // 그룹 내 모든 심볼의 analytics 가져오기
          const analyticsPromises = group.symbols.map(async (symbol) => {
            try {
              const res = await fetch(`/api/analytics/${symbol}?days=365`)
              if (!res.ok) return null
              const data = await res.json()
              return { symbol, ...data }
            } catch {
              return null
            }
          })

          const analytics = (await Promise.all(analyticsPromises)).filter(
            (a): a is IndicatorAnalytics => a !== null && a.zscore !== undefined
          )

          if (analytics.length === 0) continue

          // 평균 Z-Score 계산
          const avgZScore =
            analytics.reduce((sum, a) => sum + (a.zscore || 0), 0) / analytics.length

          // 상태 판단
          let state: GroupSummary['state']
          let signal: string
          let color: string

          if (avgZScore > 2) {
            state = 'extreme_high'
            signal = group.interpretation.positive + ' (극단 상승)'
            color = 'bg-red-500'
          } else if (avgZScore > 1) {
            state = 'elevated'
            signal = group.interpretation.positive
            color = 'bg-orange-500'
          } else if (avgZScore > -1) {
            state = 'normal'
            signal = '정상 범위 - 균형 상태'
            color = 'bg-green-500'
          } else if (avgZScore > -2) {
            state = 'depressed'
            signal = group.interpretation.negative
            color = 'bg-blue-500'
          } else {
            state = 'extreme_low'
            signal = group.interpretation.negative + ' (극단 하락)'
            color = 'bg-purple-500'
          }

          groupSummaries.push({
            group,
            avgZScore,
            state,
            signal,
            color,
          })
        }

        setSummaries(groupSummaries)
      } catch (error) {
        console.error('Error fetching summaries:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSummaries()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-200 p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          현재 시장 국면 요약
        </h2>
        <p className="text-gray-600">각 환경별 종합 분석</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {summaries.map((summary) => (
          <div
            key={summary.group.id}
            className="bg-white rounded-lg border-2 border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {summary.group.name}
                </h3>
                <p className="text-sm text-gray-500">{summary.group.nameEn}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-white text-sm font-semibold ${summary.color}`}
                >
                  {summary.avgZScore >= 0 ? '+' : ''}
                  {summary.avgZScore.toFixed(2)}σ
                </span>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${summary.color}`}
                    style={{
                      width: `${Math.min(Math.abs(summary.avgZScore) * 25, 100)}%`,
                      marginLeft: summary.avgZScore < 0 ? 'auto' : '0',
                    }}
                  ></div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>-3σ</span>
                <span>0</span>
                <span>+3σ</span>
              </div>
            </div>

            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
              {summary.signal}
            </p>

            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                포함 지표: {summary.group.symbols.join(', ')}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 전체 시장 판단 */}
      {summaries.length > 0 && (
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
          <h3 className="text-xl font-bold mb-3 text-gray-900">
            📊 종합 시장 판단
          </h3>
          <div className="space-y-2 text-sm text-gray-700">
            {summaries.find((s) => s.group.id === 'risk_environment') && (
              <p>
                <span className="font-semibold">위험자산 선호도:</span>{' '}
                {summaries.find((s) => s.group.id === 'risk_environment')?.avgZScore! > 0
                  ? 'Risk-On 국면 (주가 강세)'
                  : 'Risk-Off 국면 (주가 약세)'}
              </p>
            )}
            {summaries.find((s) => s.group.id === 'liquidity_rates') && (
              <p>
                <span className="font-semibold">유동성 환경:</span>{' '}
                {summaries.find((s) => s.group.id === 'liquidity_rates')?.avgZScore! > 0
                  ? '금리 상승 국면 (긴축 압력)'
                  : '금리 하락 국면 (완화 압력)'}
              </p>
            )}
            {summaries.find((s) => s.group.id === 'inflation_commodity') && (
              <p>
                <span className="font-semibold">인플레이션 압력:</span>{' '}
                {summaries.find((s) => s.group.id === 'inflation_commodity')?.avgZScore! > 1
                  ? '높음 (긴축 우려)'
                  : summaries.find((s) => s.group.id === 'inflation_commodity')?.avgZScore! < -1
                  ? '낮음 (완화 가능)'
                  : '보통 수준'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
