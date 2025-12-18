'use client'

import { useEffect, useRef } from 'react'
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts'

interface ChartData {
  time: string
  value: number
}

interface MiniChartProps {
  data: ChartData[]
  color?: string
  height?: number
  type?: 'line' | 'area'
}

export default function MiniChart({
  data,
  color = '#3b82f6',
  height = 120,
  type = 'line'
}: MiniChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#d1d5db',
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      timeScale: {
        visible: false,
        borderVisible: false,
      },
      rightPriceScale: {
        visible: false,
        borderVisible: false,
      },
      leftPriceScale: {
        visible: false,
        borderVisible: false,
      },
      crosshair: {
        vertLine: {
          visible: true,
          labelVisible: false,
          color: color + '40',
          width: 1,
          style: 2,
        },
        horzLine: {
          visible: true,
          labelVisible: false,
          color: color + '40',
          width: 1,
          style: 2,
        },
      },
      watermark: {
        visible: false,
      },
      handleScroll: false,
      handleScale: false,
    })

    chartRef.current = chart

    const formattedData = data.map((d) => ({
      time: d.time,
      value: d.value,
    }))

    let series: ISeriesApi<'Area'> | ISeriesApi<'Line'>

    if (type === 'area') {
      series = chart.addAreaSeries({
        lineColor: color,
        topColor: color + '40',
        bottomColor: color + '00',
        lineWidth: 2,
      })
    } else {
      series = chart.addLineSeries({
        color: color,
        lineWidth: 2,
      })
    }

    series.setData(formattedData)
    chart.timeScale().fitContent()

    // Tooltip handler
    chart.subscribeCrosshairMove((param) => {
      if (!tooltipRef.current || !chartContainerRef.current) return

      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > chartContainerRef.current.clientWidth ||
        param.point.y < 0 ||
        param.point.y > height
      ) {
        tooltipRef.current.style.display = 'none'
      } else {
        const data = param.seriesData.get(series)
        if (data) {
          const dateStr = new Date(param.time as string).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
          const value = (data as any).value || (data as any).close

          tooltipRef.current.style.display = 'block'
          tooltipRef.current.innerHTML = `
            <div style="font-size: 12px; font-weight: 600; margin-bottom: 2px;">${dateStr}</div>
            <div style="font-size: 14px; font-weight: 700; color: ${color};">${value.toLocaleString('ko-KR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}</div>
          `

          const y = param.point.y
          let left = param.point.x + 15

          // 오른쪽 끝에서는 왼쪽에 표시
          if (left + 120 > chartContainerRef.current.clientWidth) {
            left = param.point.x - 135
          }

          tooltipRef.current.style.left = left + 'px'
          tooltipRef.current.style.top = Math.max(5, Math.min(y - 40, height - 60)) + 'px'
        }
      }
    })

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (chartRef.current) {
        chartRef.current.remove()
      }
    }
  }, [data, color, height, type])

  return (
    <div ref={chartContainerRef} className="w-full relative" style={{ position: 'relative' }}>
      <style jsx>{`
        div :global(.tv-lightweight-charts) :global([class*='watermark']) {
          display: none !important;
          visibility: hidden !important;
        }
      `}</style>
      <div
        ref={tooltipRef}
        style={{
          position: 'absolute',
          display: 'none',
          padding: '8px 12px',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          color: 'white',
          borderRadius: '6px',
          fontSize: '12px',
          pointerEvents: 'none',
          zIndex: 1000,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(4px)',
        }}
      />
    </div>
  )
}
