'use client'

import { useEffect, useState } from 'react'

interface DebugData {
  rawData: {
    symbol: string
    nameKo: string
    value: number
    timestamp: string
  }[]
  marketRegime: any
  indicators: any[]
}

export default function DebugPanel() {
  const [data, setData] = useState<DebugData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDebugData() {
      try {
        // 1. Raw indicator data
        const indicatorsRes = await fetch('/api/indicators')
        const indicators = await indicatorsRes.json()

        // 2. Market regime (includes Z-Scores)
        const regimeRes = await fetch('/api/market-regime')
        const marketRegime = await regimeRes.json()

        // 3. Analytics for each indicator
        const analyticsPromises = indicators.map((ind: any) =>
          fetch(`/api/analytics/${ind.symbol}`).then(r => r.json())
        )
        const analytics = await Promise.all(analyticsPromises)

        const symbolNames: Record<string, string> = {
          SPX: 'S&P 500',
          NASDAQ: '나스닥',
          RUSSELL_2000: '러셀 2000',
          VIX: 'VIX (변동성)',
          GOLD: '금',
          WTI: 'WTI 원유',
          DXY: '달러 인덱스',
          USD_KRW: '원/달러 환율',
          US_10Y: '미국 10년물',
          US_2Y: '미국 2년물',
          SPREAD_10Y_2Y: '장단기 금리차',
          US_10Y_REAL: '10년물 실질금리',
          CPI_YOY: 'CPI',
          CORE_CPI_YOY: '근원 CPI',
          PCE_YOY: 'PCE',
          INFLATION_EXP_5Y: '5년 인플레 기대',
        }

        const rawData = indicators.map((ind: any) => ({
          symbol: ind.symbol,
          nameKo: symbolNames[ind.symbol] || ind.symbol,
          value: ind.value,
          timestamp: ind.timestamp,
        }))

        setData({ rawData, marketRegime, indicators: analytics })
      } catch (error) {
        console.error('Failed to fetch debug data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDebugData()
  }, [])

  if (loading) {
    return (
      <div className="bg-gray-900 text-green-400 font-mono text-xs p-8 rounded-lg">
        Loading debug data...
      </div>
    )
  }

  if (!data) return null

  const { rawData, marketRegime, indicators } = data

  return (
    <div className="bg-gray-900 text-green-400 font-mono text-xs p-8 rounded-lg space-y-6">
      <h2 className="text-xl font-bold text-yellow-400 mb-4">
        🔍 DEBUG PANEL - 데이터 검증용
      </h2>

      {/* 1. Raw Data from DB */}
      <section className="border-t border-gray-700 pt-4">
        <h3 className="text-lg font-bold text-cyan-400 mb-2">
          📦 1. 원본 데이터 (python main.py 결과)
        </h3>
        <div className="bg-gray-800 p-4 rounded space-y-1">
          <p className="text-yellow-300">
            업데이트 기준 날짜:{' '}
            {rawData[0] ? new Date(rawData[0].timestamp).toLocaleString('ko-KR') : 'N/A'}
          </p>
          {rawData.map((item) => (
            <p key={item.symbol}>
              {item.nameKo.padEnd(20, ' ')} : {item.value.toFixed(4)}
            </p>
          ))}
        </div>
      </section>

      {/* 2. Z-Score Calculations */}
      <section className="border-t border-gray-700 pt-4">
        <h3 className="text-lg font-bold text-cyan-400 mb-2">
          📊 2. Z-Score 계산 결과 (전체 지표)
        </h3>
        <div className="bg-gray-800 p-4 rounded space-y-1">
          {indicators.map((item) => {
            const rawItem = rawData.find((r) => r.symbol === item.symbol)
            return (
              <p key={item.symbol}>
                {rawItem?.nameKo.padEnd(20, ' ')} : Z-Score{' '}
                {item.zscore !== undefined
                  ? `${item.zscore >= 0 ? '+' : ''}${item.zscore.toFixed(2)}σ`
                  : 'N/A'}{' '}
                → {item.signal}
              </p>
            )
          })}
        </div>
      </section>

      {/* 3. Layer 2: Risk Environment */}
      <section className="border-t border-gray-700 pt-4">
        <h3 className="text-lg font-bold text-cyan-400 mb-2">
          🎲 3. Layer 2: 위험자산 선호도 분석
        </h3>
        <div className="bg-gray-800 p-4 rounded space-y-2">
          <p className="text-yellow-300 font-bold">개별 지표:</p>
          {marketRegime.layers.risk.indicators.map((ind: any) => {
            const nameKo =
              {
                SPX: 'S&P 500',
                NASDAQ: '나스닥',
                RUSSELL_2000: '러셀 2000',
                VIX: 'VIX',
              }[ind.symbol] || ind.symbol
            const direction = ind.zscore > 0.5 ? '↑' : ind.zscore < -0.5 ? '↓' : '→'
            return (
              <p key={ind.symbol}>
                {nameKo.padEnd(15, ' ')} : {direction} (Z-Score:{' '}
                {ind.zscore >= 0 ? '+' : ''}
                {ind.zscore.toFixed(2)}σ)
              </p>
            )
          })}
          <p className="text-yellow-300 font-bold mt-2">평균 Z-Score:</p>
          <p>
            {marketRegime.layers.risk.avgZScore >= 0 ? '+' : ''}
            {marketRegime.layers.risk.avgZScore.toFixed(2)}σ
          </p>
          <p className="text-yellow-300 font-bold mt-2">판단:</p>
          <p>{marketRegime.layers.risk.stateKo}</p>
          <p className="text-yellow-300 font-bold mt-2">동적 해석:</p>
          <p>
            {marketRegime.layers.risk.indicators
              .map((ind: any) => {
                const nameKo =
                  {
                    SPX: 'S&P 500',
                    NASDAQ: '나스닥',
                    RUSSELL_2000: '러셀 2000',
                    VIX: 'VIX',
                  }[ind.symbol] || ind.symbol
                const direction = ind.zscore > 0.5 ? '↑' : ind.zscore < -0.5 ? '↓' : '→'
                return `${nameKo} ${direction}`
              })
              .join(', ')}{' '}
            →{' '}
            {marketRegime.layers.risk.avgZScore > 0
              ? '주가 3개 지수 강세 + VIX 하락 → Risk-On 국면 (위험자산 선호)'
              : '주가 3개 지수 약세 + VIX 상승 → Risk-Off 국면 (안전자산 선호)'}
          </p>
        </div>
      </section>

      {/* 4. Layer 3: Liquidity/Interest Rate */}
      <section className="border-t border-gray-700 pt-4">
        <h3 className="text-lg font-bold text-cyan-400 mb-2">
          💰 4. Layer 3: 금리 환경 분석
        </h3>
        <div className="bg-gray-800 p-4 rounded space-y-2">
          <p className="text-yellow-300 font-bold">개별 지표:</p>
          {marketRegime.layers.liquidity.indicators.map((ind: any) => {
            const nameKo =
              {
                US_10Y: '미국 10년물',
                US_2Y: '미국 2년물',
                US_10Y_REAL: '실질금리 10년',
              }[ind.symbol] || ind.symbol
            const direction = ind.zscore > 0.5 ? '↑' : ind.zscore < -0.5 ? '↓' : '→'
            return (
              <p key={ind.symbol}>
                {nameKo.padEnd(15, ' ')} : {direction} (Z-Score:{' '}
                {ind.zscore >= 0 ? '+' : ''}
                {ind.zscore.toFixed(2)}σ)
              </p>
            )
          })}
          <p className="text-yellow-300 font-bold mt-2">평균 Z-Score:</p>
          <p>
            {marketRegime.layers.liquidity.avgZScore >= 0 ? '+' : ''}
            {marketRegime.layers.liquidity.avgZScore.toFixed(2)}σ
          </p>
          <p className="text-yellow-300 font-bold mt-2">판단:</p>
          <p>{marketRegime.layers.liquidity.stateKo}</p>
          <p className="text-yellow-300 font-bold mt-2">동적 해석:</p>
          <p>
            {marketRegime.layers.liquidity.indicators
              .map((ind: any) => {
                const nameKo =
                  {
                    US_10Y: '미국 10년물',
                    US_2Y: '미국 2년물',
                    US_10Y_REAL: '실질금리 10년',
                  }[ind.symbol] || ind.symbol
                const direction = ind.zscore > 0.5 ? '↑' : ind.zscore < -0.5 ? '↓' : '→'
                return `${nameKo} ${direction}`
              })
              .join(', ')}{' '}
            →{' '}
            {marketRegime.layers.liquidity.avgZScore > 0
              ? '장단기 금리 + 실질금리 상승 → 긴축 국면 (연준의 인플레 억제 의지 반영)'
              : '장단기 금리 + 실질금리 하락 → 완화 국면 (경기 부양 기대)'}
          </p>
        </div>
      </section>

      {/* 5. Layer 4: Inflation */}
      <section className="border-t border-gray-700 pt-4">
        <h3 className="text-lg font-bold text-cyan-400 mb-2">
          🔥 5. Layer 4: 인플레이션 압력 분석
        </h3>
        <div className="bg-gray-800 p-4 rounded space-y-2">
          <p className="text-yellow-300 font-bold">개별 지표:</p>
          {marketRegime.layers.inflation.indicators.map((ind: any) => {
            const nameKo =
              {
                CPI_YOY: 'CPI',
                CORE_CPI_YOY: '근원 CPI',
                PCE_YOY: 'PCE',
                INFLATION_EXP: '인플레 기대',
                WTI: 'WTI 원유',
                GOLD: '금',
              }[ind.symbol] || ind.symbol
            const direction = ind.zscore > 0.5 ? '↑' : ind.zscore < -0.5 ? '↓' : '→'
            return (
              <p key={ind.symbol}>
                {nameKo.padEnd(15, ' ')} : {direction} (Z-Score:{' '}
                {ind.zscore >= 0 ? '+' : ''}
                {ind.zscore.toFixed(2)}σ)
              </p>
            )
          })}
          <p className="text-yellow-300 font-bold mt-2">평균 Z-Score:</p>
          <p>
            {marketRegime.layers.inflation.avgZScore >= 0 ? '+' : ''}
            {marketRegime.layers.inflation.avgZScore.toFixed(2)}σ
          </p>
          <p className="text-yellow-300 font-bold mt-2">판단:</p>
          <p>{marketRegime.layers.inflation.stateKo}</p>
          <p className="text-yellow-300 font-bold mt-2">동적 해석:</p>
          <p>
            {marketRegime.layers.inflation.indicators
              .map((ind: any) => {
                const nameKo =
                  {
                    CPI_YOY: 'CPI',
                    CORE_CPI_YOY: '근원 CPI',
                    PCE_YOY: 'PCE',
                    INFLATION_EXP: '인플레 기대',
                    WTI: 'WTI 원유',
                    GOLD: '금',
                  }[ind.symbol] || ind.symbol
                const direction = ind.zscore > 0.5 ? '↑' : ind.zscore < -0.5 ? '↓' : '→'
                return `${nameKo} ${direction}`
              })
              .join(', ')}{' '}
            →{' '}
            {marketRegime.layers.inflation.avgZScore > 1
              ? '물가 지표 + 원자재 강세 → 인플레 압력 높음'
              : marketRegime.layers.inflation.avgZScore < -1
                ? '물가 지표 + 원자재 약세 → 인플레 압력 낮음 (디플레 우려)'
                : '물가 안정 국면'}
          </p>
        </div>
      </section>

      {/* 6. Final Market Regime */}
      <section className="border-t border-gray-700 pt-4">
        <h3 className="text-lg font-bold text-cyan-400 mb-2">
          🎯 6. 최종 시장 국면 판단
        </h3>
        <div className="bg-gray-800 p-4 rounded space-y-2">
          <p className="text-yellow-300 font-bold">종합 분석:</p>
          <p>
            위험자산 선호도: {marketRegime.layers.risk.stateKo} (평균 Z-Score:{' '}
            {marketRegime.layers.risk.avgZScore >= 0 ? '+' : ''}
            {marketRegime.layers.risk.avgZScore.toFixed(2)}σ)
          </p>
          <p>
            금리 환경: {marketRegime.layers.liquidity.stateKo} (평균 Z-Score:{' '}
            {marketRegime.layers.liquidity.avgZScore >= 0 ? '+' : ''}
            {marketRegime.layers.liquidity.avgZScore.toFixed(2)}σ)
          </p>
          <p>
            인플레이션 압력: {marketRegime.layers.inflation.stateKo} (평균 Z-Score:{' '}
            {marketRegime.layers.inflation.avgZScore >= 0 ? '+' : ''}
            {marketRegime.layers.inflation.avgZScore.toFixed(2)}σ)
          </p>

          <p className="text-yellow-300 font-bold mt-4">최종 판단:</p>
          <p className="text-2xl font-bold text-white">{marketRegime.regimeKo}</p>

          <p className="text-yellow-300 font-bold mt-2">설명:</p>
          <p>{marketRegime.description}</p>

          <p className="text-yellow-300 font-bold mt-2">판단 로직:</p>
          <div className="text-xs text-gray-400 space-y-1">
            <p>
              if (riskAvg {'>'} 1 && liquidityAvg {'<'} 0 && inflationAvg {'<'} 0) → 골디락스
            </p>
            <p>
              else if (riskAvg {'>'} 0.5) → Risk-On{' '}
              {marketRegime.regime === 'RISK_ON' && '← 현재 여기'}
            </p>
            <p>
              else if (riskAvg {'<'} -0.5) → Risk-Off{' '}
              {marketRegime.regime === 'RISK_OFF' && '← 현재 여기'}
            </p>
            <p>
              else → 혼조 {marketRegime.regime === 'MIXED' && '← 현재 여기'}
            </p>
          </div>

          <p className="text-yellow-300 font-bold mt-4">업데이트 시간:</p>
          <p>{new Date(marketRegime.calculatedAt).toLocaleString('ko-KR')}</p>
        </div>
      </section>

      <div className="text-center text-gray-500 pt-4 border-t border-gray-700">
        이 패널은 테스트/검증용입니다. 프로덕션에서는 제거하세요.
      </div>
    </div>
  )
}
