'use client'

import { useEffect, useRef } from 'react'
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts'

interface ChartData {
  time: string
  value: number
}

interface LineChartProps {
  data: ChartData[]
  color?: string
  height?: number
}

export default function LineChart({ data, color = '#2563eb', height = 300 }: LineChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#d1d5db',
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      grid: {
        vertLines: { color: '#374151' },
        horzLines: { color: '#374151' },
      },
      timeScale: {
        borderColor: '#374151',
      },
      rightPriceScale: {
        borderColor: '#374151',
      },
    })

    chartRef.current = chart

    // Add area series
    const areaSeries = chart.addAreaSeries({
      lineColor: color,
      topColor: color + '80',
      bottomColor: color + '00',
      lineWidth: 2,
    })

    seriesRef.current = areaSeries

    // Set data
    const formattedData = data.map((d) => ({
      time: d.time,
      value: d.value,
    }))

    areaSeries.setData(formattedData)
    chart.timeScale().fitContent()

    // Handle resize
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
  }, [data, color, height])

  return <div ref={chartContainerRef} className="w-full" />
}
