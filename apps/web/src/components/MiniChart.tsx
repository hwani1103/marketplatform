'use client'

import { useRef, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
)

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
  const chartRef = useRef<ChartJS<'line'>>(null)

  const labels = data.map((d) => {
    const date = new Date(d.time)
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  })

  const values = data.map((d) => d.value)

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        borderColor: color,
        backgroundColor: type === 'area' ? `${color}40` : 'transparent',
        fill: type === 'area',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: color,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        tension: 0.1,
      },
    ],
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        displayColors: false,
        callbacks: {
          title: (context) => {
            const index = context[0].dataIndex
            const date = new Date(data[index].time)
            return date.toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          },
          label: (context) => {
            const value = context.parsed.y
            return value.toLocaleString('ko-KR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          },
        },
      },
    },
    scales: {
      x: {
        display: false,
        grid: {
          display: false,
        },
      },
      y: {
        display: false,
        grid: {
          display: false,
        },
      },
    },
    elements: {
      line: {
        borderWidth: 2,
      },
      point: {
        radius: 0,
      },
    },
  }

  return (
    <div style={{ width: '100%', height: `${height}px` }}>
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  )
}
