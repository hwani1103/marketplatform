'use client'

import React, { useEffect, useState } from 'react'

interface MarketRegimeData {
  regime: string
  regimeKo: string
  description: string
  color: string
  calculatedAt: string
  layers: {
    risk: {
      avgZScore: number
      state: string
      stateKo: string
      indicators: { symbol: string; zscore: number }[]
    }
    liquidity: {
      avgZScore: number
      state: string
      stateKo: string
      indicators: { symbol: string; zscore: number }[]
    }
    inflation: {
      avgZScore: number
      state: string
      stateKo: string
      indicators: { symbol: string; zscore: number }[]
    }
  }
}

export default function FinalMarketRegime() {
  const [regime, setRegime] = useState<MarketRegimeData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRegime() {
      try {
        const res = await fetch('/api/market-regime')
        const data = await res.json()
        setRegime(data)
      } catch (error) {
        console.error('Failed to fetch market regime:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRegime()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    )
  }

  if (!regime) {
    return null
  }

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return 'from-green-500 to-emerald-600 border-green-300'
      case 'blue':
        return 'from-blue-500 to-cyan-600 border-blue-300'
      case 'red':
        return 'from-red-500 to-rose-600 border-red-300'
      case 'yellow':
        return 'from-yellow-500 to-amber-600 border-yellow-300'
      default:
        return 'from-gray-500 to-slate-600 border-gray-300'
    }
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-2xl border-2 border-gray-200 overflow-hidden">
      {/* 메인 Regime 표시 */}
      <div className={`bg-gradient-to-r ${getColorClasses(regime.color)} p-8 text-white`}>
        <div className="text-sm font-medium opacity-90 mb-2">
          🎯 현재 시장 국면 (업데이트: {new Date(regime.calculatedAt).toLocaleString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })})
        </div>
        <h2 className="text-4xl font-bold mb-3">{regime.regimeKo}</h2>
        <p className="text-lg opacity-95 leading-relaxed">{regime.description}</p>
      </div>

      {/* Layer별 상세 분석 */}
      <div className="p-8">
        <h3 className="text-xl font-bold mb-6 text-gray-900">📊 환경별 상세 분석</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Risk Environment */}
          <div className="bg-white rounded-lg border-2 border-gray-200 p-5">
            <div className="text-sm font-semibold text-gray-500 mb-2">위험자산 선호도</div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {regime.layers.risk.stateKo}
            </div>
            <div className="text-sm text-gray-600 mb-3">
              평균 Z-Score: {regime.layers.risk.avgZScore >= 0 ? '+' : ''}
              {regime.layers.risk.avgZScore.toFixed(2)}σ
            </div>
            <div className="space-y-1">
              {regime.layers.risk.indicators.map((ind) => (
                <div key={ind.symbol} className="flex justify-between text-xs">
                  <span className="text-gray-600">{ind.symbol}</span>
                  <span className={ind.zscore > 0 ? 'text-green-600' : 'text-red-600'}>
                    {ind.zscore >= 0 ? '+' : ''}{ind.zscore.toFixed(2)}σ
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Liquidity Environment */}
          <div className="bg-white rounded-lg border-2 border-gray-200 p-5">
            <div className="text-sm font-semibold text-gray-500 mb-2">금리 환경</div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {regime.layers.liquidity.stateKo}
            </div>
            <div className="text-sm text-gray-600 mb-3">
              평균 Z-Score: {regime.layers.liquidity.avgZScore >= 0 ? '+' : ''}
              {regime.layers.liquidity.avgZScore.toFixed(2)}σ
            </div>
            <div className="space-y-1">
              {regime.layers.liquidity.indicators.map((ind) => (
                <div key={ind.symbol} className="flex justify-between text-xs">
                  <span className="text-gray-600">{ind.symbol}</span>
                  <span className={ind.zscore > 0 ? 'text-green-600' : 'text-red-600'}>
                    {ind.zscore >= 0 ? '+' : ''}{ind.zscore.toFixed(2)}σ
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Inflation Environment */}
          <div className="bg-white rounded-lg border-2 border-gray-200 p-5">
            <div className="text-sm font-semibold text-gray-500 mb-2">인플레이션 압력</div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {regime.layers.inflation.stateKo}
            </div>
            <div className="text-sm text-gray-600 mb-3">
              평균 Z-Score: {regime.layers.inflation.avgZScore >= 0 ? '+' : ''}
              {regime.layers.inflation.avgZScore.toFixed(2)}σ
            </div>
            <div className="space-y-1">
              {regime.layers.inflation.indicators.map((ind) => (
                <div key={ind.symbol} className="flex justify-between text-xs">
                  <span className="text-gray-600">{ind.symbol}</span>
                  <span className={ind.zscore > 0 ? 'text-green-600' : 'text-red-600'}>
                    {ind.zscore >= 0 ? '+' : ''}{ind.zscore.toFixed(2)}σ
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 추가 설명 */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-900">
            <strong>💡 시장 국면(Market Regime)이란?</strong>
            <p className="mt-2">
              위험자산 선호도, 금리 환경, 인플레이션 압력 등 여러 거시경제 지표를 종합하여
              현재 시장이 어떤 상태인지를 판단한 결과입니다. 이를 통해 어떤 자산에 투자하는 것이
              유리한지 가늠할 수 있습니다.
            </p>
            <ul className="mt-3 space-y-1 ml-4">
              <li>• <strong>골디락스</strong>: 모든 조건이 이상적. 주식 적극 매수</li>
              <li>• <strong>Risk-On</strong>: 위험자산 선호. 주식/신흥국 투자 유리</li>
              <li>• <strong>Risk-Off</strong>: 안전자산 선호. 채권/금 투자 유리</li>
              <li>• <strong>혼조</strong>: 방향성 불명확. 관망 또는 분산 투자</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
