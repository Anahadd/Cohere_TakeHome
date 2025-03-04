"use client"

import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import Image from "next/image"
import { MessageStats } from "./message-stats"

interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
  stats?: {
    cosineSimilarity?: number | null
    responseTimeMs?: number | null
    tokensUsed?: number | null
    promptTokens?: number | null
    completionTokens?: number | null
    processingTimeMs?: number | null
  }
  showStats?: boolean
}

export default function ChatMessage({ 
  role, 
  content, 
  stats,
  showStats = true 
}: ChatMessageProps) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-purple-600/20 text-white rounded-2xl rounded-tr-none px-6 py-4 max-w-[85%] text-xl">
          {content}
        </div>
      </div>
    )
  }

  // Assistant messages get rendered with Markdown
  return (
    <div className="flex gap-4">
      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
        <Image src="/avatar.svg" alt="AI Avatar" width={48} height={48} className="w-full h-full object-cover" />
      </div>
      <div className="bg-gray-800/50 text-white rounded-2xl rounded-tl-none px-6 py-4 max-w-[85%]">
        <div className="text-xl">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
        {/* Show message statistics if available and enabled */}
        {showStats && stats && <MessageStats stats={stats} />}
      </div>
    </div>
  )
}
