import React from 'react'

interface HighlightTextProps {
  text: string
  highlight: string
}

/**
 * HighlightText Component
 * Validates: Requirements 12.6
 *
 * Wraps matching substrings in a styled <mark> element.
 * Case-insensitive. Returns text unchanged if highlight is empty.
 */
export function HighlightText({ text, highlight }: HighlightTextProps) {
  if (!highlight.trim()) {
    return <>{text}</>
  }

  const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}
