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

          // 평균 Z-Score 계산 (역방향 지표 처리)
          // VIX는 역방향: 높을수록 Risk-Off이므로 Z-Score를 반전
          // 그룹별로 역방향 지표가 다름
          const inverseSymbols = group.id === 'risk_environment' ? ['VIX'] : []

          const avgZScore =
            analytics.reduce((sum, a) => {
              const zscore = a.zscore || 0
              // 역방향 지표는 부호 반전
              const adjustedZScore = inverseSymbols.includes(a.symbol) ? -zscore : zscore
              return sum + adjustedZScore
            }, 0) / analytics.length

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
        <p className="text-gray-600 mb-3">각 환경별 종합 분석 (평균 Z-Score 기준)</p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-900">
            <strong>💡 평균 Z-Score란?</strong> 각 그룹 내 지표들의 Z-Score 평균값입니다.
            예: <strong>+1.00σ</strong> = 역사적으로 평균보다 1 표준편차 높음 (상위 16% 수준),
            <strong>-0.86σ</strong> = 평균보다 약간 낮음 (하위 약 20% 수준)
          </p>
        </div>
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
              <div className="relative">
                {/* 배경 그라데이션 */}
                <div className="w-full h-3 rounded-full bg-gradient-to-r from-blue-500 via-green-500 to-red-500 opacity-20"></div>

                {/* 중앙선 (0) */}
                <div className="absolute top-0 left-1/2 w-0.5 h-3 bg-gray-400"></div>

                {/* 값 마커 */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md"
                  style={{
                    left: `${Math.max(0, Math.min(100, ((summary.avgZScore + 3) / 6) * 100))}%`,
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: summary.color.replace('bg-', '').split('-').reduce((acc, part) => {
                      const colors: Record<string, string> = {
                        'red': '#ef4444',
                        'orange': '#f97316',
                        'green': '#22c55e',
                        'blue': '#3b82f6',
                        'purple': '#a855f7',
                      }
                      return colors[part] || acc
                    }, '#6b7280')
                  }}
                ></div>
              </div>

              <div className="flex justify-between text-xs text-gray-500 mt-1">
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
            {summaries.find((s) => s.group.id === 'currency') && (
              <p>
                <span className="font-semibold">달러 강도:</span>{' '}
                {summaries.find((s) => s.group.id === 'currency')?.avgZScore! > 0
                  ? '달러 강세 (안전자산 선호, 신흥국 부담)'
                  : '달러 약세 (위험자산 선호, 신흥국 유리)'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
