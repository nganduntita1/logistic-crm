'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PhotoUploadProps {
  /** Called with the selected File when the user picks one */
  onFileChange: (file: File | null) => void
  /** Whether an upload is in progress (shows progress indicator) */
  isUploading?: boolean
  /** Error message to display below the input */
  error?: string
}

/**
 * PhotoUpload Component
 * Validates: Requirements 8.4, 11.1
 *
 * Provides a file input restricted to jpg/png/webp images with:
 * - Inline image preview after selection
 * - Upload progress indicator
 * - Error message display
 */
export function PhotoUpload({ onFileChange, isUploading = false, error }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null

    if (!file) {
      setPreview(null)
      setFileName(null)
      onFileChange(null)
      return
    }

    setFileName(file.name)
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    onFileChange(file)
  }

  const handleClear = () => {
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setFileName(null)
    onFileChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
        aria-label="Upload delivery photo"
      />

      {preview ? (
        <div className="relative w-full rounded-md border overflow-hidden">
          <div className="relative w-full h-48">
            <Image
              src={preview}
              alt="Delivery photo preview"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          {!isUploading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-gray-100"
              aria-label="Remove photo"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Uploading…</span>
            </div>
          )}
          {fileName && !isUploading && (
            <p className="px-3 py-1 text-xs text-muted-foreground truncate border-t">{fileName}</p>
          )}
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full h-32 flex flex-col gap-2 border-dashed"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
        >
          <ImagePlus className="h-6 w-6 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Click to select a photo</span>
          <span className="text-xs text-muted-foreground">JPG, PNG or WebP · max 10 MB</span>
        </Button>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
