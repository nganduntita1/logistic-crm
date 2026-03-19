'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export interface SearchInputProps {
  placeholder?: string
  onSearch: (query: string) => void
  debounceMs?: number
  defaultValue?: string
  className?: string
}

export function SearchInput({
  placeholder = 'Search...',
  onSearch,
  debounceMs = 300,
  defaultValue = '',
  className,
}: SearchInputProps) {
  const [value, setValue] = React.useState(defaultValue)
  const timeoutRef = React.useRef<NodeJS.Timeout>()

  React.useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout for debounced search
    timeoutRef.current = setTimeout(() => {
      onSearch(value)
    }, debounceMs)

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, debounceMs, onSearch])

  return (
    <div className={`relative ${className || ''}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-9"
      />
    </div>
  )
}
