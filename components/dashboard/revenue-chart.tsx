'use client'

import { useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getRevenueChart, type RevenueChartData } from '@/app/actions/dashboard'
import { LoadingSpinner } from '@/components/shared/loading-spinner'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export function RevenueChart() {
  const [data, setData] = useState<RevenueChartData[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true)
        const result = await getRevenueChart()
        if (result.error) {
          setError(result.error)
        } else {
          setData(result.data || null)
        }
      } catch (err) {
        setError('Failed to load chart data')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <p className="text-sm text-destructive">{error}</p>
  if (!data || data.length === 0) return <p className="text-sm text-muted-foreground">No revenue data available</p>

  const chartData = {
    labels: data.map((d) => d.date),
    datasets: [
      {
        label: 'Revenue (ZAR)',
        data: data.map((d) => d.revenue),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        labels: { font: { size: 12 } },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return `R${Number(value).toLocaleString()}`
          },
        },
      },
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue - Last 30 Days</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: '300px', position: 'relative' }}>
          <Line data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  )
}
