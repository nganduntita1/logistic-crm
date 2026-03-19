'use client'

import { useEffect, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getTopRoutes, type RouteData } from '@/app/actions/dashboard'
import { LoadingSpinner } from '@/components/shared/loading-spinner'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export function TopRoutesChart() {
  const [data, setData] = useState<RouteData[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true)
        const result = await getTopRoutes()
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
  if (!data || data.length === 0) return <p className="text-sm text-muted-foreground">No route data available</p>

  const chartData = {
    labels: data.map((d) => d.route),
    datasets: [
      {
        label: 'Shipment Count',
        data: data.map((d) => d.count),
        backgroundColor: '#3b82f6',
        borderColor: '#1e40af',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Routes by Shipment Count</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: '250px', position: 'relative' }}>
          <Bar data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  )
}
