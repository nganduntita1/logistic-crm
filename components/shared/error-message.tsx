import { AlertCircle } from 'lucide-react'

interface ErrorMessageProps {
  message: string
  title?: string
}

/**
 * ErrorMessage Component
 * Validates: Requirements 15.5
 *
 * Displays a user-friendly error with an icon and message text.
 */
export function ErrorMessage({ message, title = 'Something went wrong' }: ErrorMessageProps) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm opacity-90">{message}</p>
      </div>
    </div>
  )
}
