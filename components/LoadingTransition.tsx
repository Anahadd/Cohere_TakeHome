"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MessageCircle } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

interface LoadingTransitionProps {
  destination?: string
}

export default function LoadingTransition({ destination = "/chat" }: LoadingTransitionProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        router.push(destination)
      }, 3000) // 3 seconds loading animation before redirect

      return () => clearTimeout(timer)
    }
  }, [isLoading, router, destination])

  const handleClick = () => {
    setIsLoading(true)
  }

  return (
    <div className="relative">
      {!isLoading ? (
        <Button
          onClick={handleClick}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 transform hover:-translate-y-1 shadow-md shadow-purple-900/30 flex items-center justify-center gap-2"
        >
          <MessageCircle className="h-5 w-5" />
          Start Chatting
        </Button>
      ) : (
        <div className="bg-gray-800/50 rounded-lg p-4 flex items-center space-x-3">
          <div className="flex space-x-1">
            <motion.div
              className="w-2 h-2 rounded-full bg-purple-500"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="w-2 h-2 rounded-full bg-indigo-500"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: 0.2,
              }}
            />
            <motion.div
              className="w-2 h-2 rounded-full bg-purple-500"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: 0.4,
              }}
            />
          </div>
          <span className="text-sm text-gray-300">Preparing chat...</span>
        </div>
      )}
    </div>
  )
}

