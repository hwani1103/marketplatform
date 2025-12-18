'use client'

import { useRef } from 'react'
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

interface LineChartProps {
  data: ChartData[]
  color?: string
  height?: number
}

export default function LineChart({ data, color = '#2563eb', height = 300 }: LineChartProps) {
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
        backgroundColor: `${color}80`,
        fill: true,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
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
        display: true,
        grid: {
          color: '#374151',
        },
        ticks: {
          color: '#d1d5db',
        },
        border: {
          color: '#374151',
        },
      },
      y: {
        display: true,
        grid: {
          color: '#374151',
        },
        ticks: {
          color: '#d1d5db',
        },
        border: {
          color: '#374151',
        },
      },
    },
  }

  return (
    <div style={{ width: '100%', height: `${height}px` }}>
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  )
}
