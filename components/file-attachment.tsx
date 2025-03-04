"use client"

import { FileText, Download, X, File as FileIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FileAttachmentProps {
  fileId: string
  fileName: string
  fileType: string
  preview?: string
  onRemove?: (fileId: string) => void
  isRemovable?: boolean
}

export default function FileAttachment({
  fileId,
  fileName,
  fileType,
  preview,
  onRemove,
  isRemovable = false
}: FileAttachmentProps) {
  // Convert file size to readable format
  const getFileTypeIcon = () => {
    if (fileType.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-400" />
    } else if (fileType.includes('word') || fileType.includes('docx')) {
      return <FileText className="h-5 w-5 text-blue-400" />
    } else if (fileType.includes('text')) {
      return <FileText className="h-5 w-5 text-gray-400" />
    } else {
      return <FileIcon className="h-5 w-5 text-purple-400" />
    }
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/files/${fileId}`)
      if (!response.ok) throw new Error('Failed to fetch file')
      const data = await response.json()
      
      // Implement actual download
      // For simplicity, this just opens a new tab with content preview
      window.open(`/api/files/${fileId}/download`, '_blank')
    } catch (error) {
      console.error('Error downloading file:', error)
    }
  }

  const handleRemove = () => {
    if (onRemove) {
      onRemove(fileId)
    }
  }

  return (
    <div className="flex flex-col bg-gray-800/50 border border-gray-700 rounded-lg p-3 w-full">
      <div className="flex items-center">
        <div className="mr-3">
          {getFileTypeIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{fileName}</p>
          <span className="text-xs text-gray-500">{fileType.split('/')[1] || fileType}</span>
        </div>
        <div className="flex items-center gap-2 ml-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
          
          {isRemovable && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-gray-700"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {preview && (
        <div className="mt-2 text-xs text-gray-400 bg-gray-900/50 p-2 rounded border border-gray-800 max-h-20 overflow-y-auto">
          <pre className="whitespace-pre-wrap font-mono text-xs">{preview}</pre>
        </div>
      )}
    </div>
  )
} 