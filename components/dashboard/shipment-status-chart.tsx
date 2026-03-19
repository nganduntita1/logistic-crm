'use client'

import { useEffect, useState } from 'react'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getShipmentsByStatus, type ShipmentStatusData } from '@/app/actions/dashboard'
import { LoadingSpinner } from '@/components/shared/loading-spinner'

ChartJS.register(ArcElement, Tooltip, Legend)

export function ShipmentStatusChart() {
  const [data, setData] = useState<ShipmentStatusData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true)
        const result = await getShipmentsByStatus()
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
  if (!data) return null

  const chartData = {
    labels: ['Pending', 'In Transit', 'Delivered', 'Cancelled'],
    datasets: [
      {
        data: [data.pending, data.in_transit, data.delivered, data.cancelled],
        backgroundColor: [
          '#f59e0b',
          '#3b82f6',
          '#10b981',
          '#ef4444',
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          font: { size: 12 },
        },
      },
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipments by Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: '300px', position: 'relative' }}>
          <Doughnut data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  )
}
