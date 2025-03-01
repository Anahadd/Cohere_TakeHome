"use client"

import { useState } from "react"
import { Info } from "lucide-react"

export function InfoTooltip({ content }: { content: string }) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        className="text-gray-400 hover:text-white transition-colors"
      >
        <Info size={20} />
      </button>
      {isVisible && (
        <div className="absolute z-10 w-64 p-4 mt-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg">{content}</div>
      )}
    </div>
  )
}

