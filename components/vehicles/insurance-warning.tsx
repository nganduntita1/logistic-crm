'use client'

import { AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface InsuranceWarningProps {
  insuranceExpiry: string
}

/**
 * Insurance Warning Component
 * Validates: Requirements 7.4
 *
 * Displays a warning badge when insurance_expiry is within 30 days or already expired.
 */
export function InsuranceWarning({ insuranceExpiry }: InsuranceWarningProps) {
  const expiryDate = new Date(insuranceExpiry)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const diffMs = expiryDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1 w-fit">
        <AlertTriangle className="h-3 w-3" />
        Expired
      </Badge>
    )
  }

  if (diffDays <= 30) {
    return (
      <Badge variant="outline" className="flex items-center gap-1 w-fit border-orange-500 text-orange-600 bg-orange-50">
        <AlertTriangle className="h-3 w-3" />
        Expires in {diffDays}d
      </Badge>
    )
  }

  return null
}
