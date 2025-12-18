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
  const chartRef = useRef<IChartApi | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'transparent',
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
          visible: false,
        },
        horzLine: {
          visible: false,
        },
      },
      handleScroll: false,
      handleScale: false,
    })

    chartRef.current = chart

    const formattedData = data.map((d) => ({
      time: d.time,
      value: d.value,
    }))

    if (type === 'area') {
      const areaSeries = chart.addAreaSeries({
        lineColor: color,
        topColor: color + '40',
        bottomColor: color + '00',
        lineWidth: 2,
      })
      areaSeries.setData(formattedData)
    } else {
      const lineSeries = chart.addLineSeries({
        color: color,
        lineWidth: 2,
      })
      lineSeries.setData(formattedData)
    }

    chart.timeScale().fitContent()

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

  return <div ref={chartContainerRef} className="w-full" />
}
