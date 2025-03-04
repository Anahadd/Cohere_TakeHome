"use client"

import React from "react"
import { BarChart2, Clock, Zap, ChevronsUpDown } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface MessageStatsProps {
  stats: {
    cosineSimilarity?: number | null
    responseTimeMs?: number | null
    tokensUsed?: number | null
    promptTokens?: number | null
    completionTokens?: number | null
    processingTimeMs?: number | null
  }
}

export function MessageStats({ stats }: MessageStatsProps) {
  if (!stats) return null

  const {
    cosineSimilarity = null,
    responseTimeMs = null,
    tokensUsed = null,
    promptTokens = null,
    completionTokens = null,
    processingTimeMs = null
  } = stats

  // Format and helper functions
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(0)}%`
  }

  return (
    <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-400">
      {cosineSimilarity !== null && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 bg-gray-800/50 px-2 py-1 rounded-full">
                <ChevronsUpDown className="h-3 w-3" />
                <span>{formatPercentage(cosineSimilarity)}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Cosine Similarity: {formatPercentage(cosineSimilarity)}</p>
              <p className="text-xs opacity-70">Measures how related the response is to your query</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {responseTimeMs !== null && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 bg-gray-800/50 px-2 py-1 rounded-full">
                <Clock className="h-3 w-3" />
                <span>{formatTime(responseTimeMs)}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Response Time: {formatTime(responseTimeMs)}</p>
              <p className="text-xs opacity-70">Total time from sending your message to receiving a response</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {tokensUsed !== null && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 bg-gray-800/50 px-2 py-1 rounded-full">
                <Zap className="h-3 w-3" />
                <span>{tokensUsed} tokens</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Total Tokens: {tokensUsed}</p>
              {promptTokens !== null && completionTokens !== null && (
                <>
                  <p>Prompt: {promptTokens} | Completion: {completionTokens}</p>
                  <div className="w-full bg-gray-700 h-1.5 mt-1 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full" 
                      style={{ width: `${(promptTokens / tokensUsed) * 100}%` }}
                    />
                  </div>
                </>
              )}
              <p className="text-xs opacity-70">Tokens are units of text the AI processes</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {processingTimeMs !== null && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 bg-gray-800/50 px-2 py-1 rounded-full">
                <BarChart2 className="h-3 w-3" />
                <span>{formatTime(processingTimeMs)}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Processing Time: {formatTime(processingTimeMs)}</p>
              <p className="text-xs opacity-70">Time taken by the AI to generate this response</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
} 