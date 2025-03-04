"use client"

import { useState, useRef } from "react"
import { Upload, X, FileText, File as FileIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FileUploadProps {
  onFileUpload: (file: File) => Promise<void>
  allowedFileTypes?: string
  maxFileSizeMB?: number
}

interface UploadedFile {
  file: File
  progress: number
  error?: string
  preview?: string
}

export default function FileUpload({
  onFileUpload,
  allowedFileTypes = ".txt,.pdf,.docx,.md",
  maxFileSizeMB = 10
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<UploadedFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const maxSizeBytes = maxFileSizeMB * 1024 * 1024

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      addFiles(files)
    }
  }

  const addFiles = async (fileList: FileList) => {
    const filesArray = Array.from(fileList)
    const newFiles = filesArray.map(file => ({
      file,
      progress: 0,
      error: validateFile(file)
    }))
    
    setUploadingFiles([...uploadingFiles, ...newFiles])
    
    // Auto-upload valid files
    for (const fileObj of newFiles) {
      if (!fileObj.error) {
        await uploadFile(fileObj)
      }
    }
  }

  const validateFile = (file: File): string | undefined => {
    // Check file type
    const fileType = file.name.split('.').pop()?.toLowerCase()
    const isTypeAllowed = allowedFileTypes.includes(fileType || '')
    
    if (!isTypeAllowed) {
      return `File type not allowed. Allowed types: ${allowedFileTypes}`
    }
    
    // Check file size
    if (file.size > maxSizeBytes) {
      return `File size exceeds the maximum allowed size (${maxFileSizeMB}MB)`
    }
    
    return undefined
  }

  const uploadFile = async (fileObj: UploadedFile) => {
    try {
      // Update progress
      setUploadingFiles(prev => 
        prev.map(item => 
          item.file === fileObj.file ? { ...item, progress: 10 } : item
        )
      )
      
      // Simulate progress for better UX
      const interval = setInterval(() => {
        setUploadingFiles(prev => 
          prev.map(item => 
            item.file === fileObj.file && item.progress < 90 
              ? { ...item, progress: item.progress + 10 } 
              : item
          )
        )
      }, 200)
      
      // Call the actual upload function
      await onFileUpload(fileObj.file)
      
      clearInterval(interval)
      
      // Mark as complete
      setUploadingFiles(prev => 
        prev.map(item => 
          item.file === fileObj.file 
            ? { ...item, progress: 100 } 
            : item
        )
      )
      
      // Remove the file from the list after a delay
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(item => item.file !== fileObj.file))
      }, 1500)
      
    } catch (error) {
      console.error('Error uploading file:', error)
      setUploadingFiles(prev => 
        prev.map(item => 
          item.file === fileObj.file 
            ? { ...item, error: 'Failed to upload file', progress: 0 } 
            : item
        )
      )
    }
  }

  const removeFile = (fileToRemove: UploadedFile) => {
    setUploadingFiles(prev => prev.filter(file => file !== fileToRemove))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          isDragging ? "border-purple-500 bg-purple-500/10" : "border-gray-600 hover:border-gray-500"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          className="hidden"
          accept={allowedFileTypes}
          multiple
        />
        <div className="flex flex-col items-center justify-center py-4">
          <Upload className="h-8 w-8 mb-2 text-gray-400" />
          <p className="text-sm font-medium">
            Drop files here or click to upload
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: {allowedFileTypes}
          </p>
          <p className="text-xs text-gray-500">
            Max size: {maxFileSizeMB}MB
          </p>
        </div>
      </div>

      {/* File list */}
      {uploadingFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploadingFiles.map((fileObj, index) => (
            <div
              key={`${fileObj.file.name}-${index}`}
              className="flex items-center bg-gray-800 rounded-lg p-2"
            >
              <div className="mr-2">
                {fileObj.file.type.includes('pdf') ? (
                  <FileText className="h-5 w-5 text-red-400" />
                ) : (
                  <FileIcon className="h-5 w-5 text-blue-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{fileObj.file.name}</p>
                {fileObj.error ? (
                  <p className="text-xs text-red-400">{fileObj.error}</p>
                ) : (
                  <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-purple-600 h-1.5 rounded-full"
                      style={{ width: `${fileObj.progress}%` }}
                    ></div>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-400 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile(fileObj)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 