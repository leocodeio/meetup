'use client'

import { UploadButton } from '@/utils/uploadthing'
import { useState } from 'react'
import { toast } from 'sonner'

interface RichTextImageUploadProps {
  onImageInsert: (url: string, name: string) => void
  disabled?: boolean
}

/**
 * Image upload component specifically for rich text editors
 * Uploads image and immediately inserts into editor
 */
export function RichTextImageUpload({
  onImageInsert,
  disabled = false,
}: RichTextImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)

  return (
    <div className="relative">
      <UploadButton
        endpoint="commentAttachment"
        onClientUploadComplete={(res) => {
          if (!res || res.length === 0) return
          
          setIsUploading(false)
          
          // Filter only images and insert them
          res.forEach((file) => {
            const isImage = file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
            if (isImage) {
              onImageInsert(file.ufsUrl, file.name)
              toast.success(`Image "${file.name}" inserted`)
            }
          })
        }}
        onUploadError={(error: Error) => {
          setIsUploading(false)
          toast.error(error.message || 'Image upload failed')
        }}
        onUploadBegin={() => {
          setIsUploading(true)
        }}
        disabled={disabled || isUploading}
        appearance={{
          button: `h-8 px-3 text-xs bg-secondary text-secondary-foreground hover:bg-secondary/80 ${
            isUploading ? 'opacity-50 cursor-not-allowed' : ''
          }`,
          allowedContent: 'hidden',
        }}
        content={{ button: isUploading ? 'Uploading...' : 'Upload Image' }}
      />
    </div>
  )
}

