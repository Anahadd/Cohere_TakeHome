"use client"

import type React from "react"

import { useState } from "react"
import { Mic, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import ChatMessage from "@/components/chat-message"
import AdvancedFeedbackPanel from "@/components/AdvancedFeedbackPanel"
import LoadingTransition from "@/components/LoadingTransition"

interface ChatEntry {
  role: "user" | "assistant"
  content: string
  id: string
  needsApproval?: boolean
}

interface FeedbackItem {
  highlightedText: string
  emoji: string
  comment: string
  color: string
  aiResponses: string[]
  userResponse: string
  isConversationComplete: boolean
}

export default function PreviewPage() {
  const [message, setMessage] = useState("")
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [feedbackItem, setFeedbackItem] = useState<ChatEntry | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    const userEntry: ChatEntry = { role: "user", content: message, id: Date.now().toString() }
    setChatHistory((prev) => [...prev, userEntry])
    setMessage("")
    await generateResponse(userEntry.content)
  }

  const generateResponse = async (userMessage: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:5000/generate-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: userMessage, preferences: {} }),
      })
      const data = await response.json()
      if (data.success) {
        const aiResponse = data.feedback
        const aiEntry: ChatEntry = {
          role: "assistant",
          content: aiResponse,
          id: Date.now().toString(),
          needsApproval: true,
        }
        setChatHistory((prev) => [...prev, aiEntry])
        setFeedbackItem(aiEntry)
      } else {
        console.error("Error from backend:", data.error)
      }
    } catch (error) {
      console.error("Fetch error:", error)
    }
    setIsLoading(false)
  }

  
  const handleApproval = (entryId: string, isApproved: boolean) => {
    if (isApproved) {
      setChatHistory((prev) => prev.map((entry) => (entry.id === entryId ? { ...entry, needsApproval: false } : entry)))
    } else {
      const entry = chatHistory.find((entry) => entry.id === entryId)
      if (entry) {
        setFeedbackItem(entry)
      }
    }
  }

  const handleFeedbackSubmit = async (feedbackItems: FeedbackItem[]) => {
    if (!feedbackItem) return

    setIsLoading(true)

    // TODO: Replace with actual API call to AI service for feedback processing
    // const updatedContent = await processAIFeedback(feedbackItem.content, feedbackItems)

    // Simulating API call with setTimeout
    setTimeout(() => {
      // TODO: Remove this placeholder and use the actual AI-generated response
      const regeneratedResponse = `This is a regenerated response based on your feedback. We've taken into account your comments and suggestions to improve this response.`

      const newAiEntry: ChatEntry = {
        role: "assistant",
        content: regeneratedResponse,
        id: Date.now().toString(),
      }

      setChatHistory((prev) => [...prev, newAiEntry])
      setIsLoading(false)
      setFeedbackItem(null)
    }, 1500)

    // TODO: Remove this log in production
    console.log("Feedback items:", feedbackItems)
  }

  return (
    <div className="flex flex-col h-full gap-6 overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-semibold">Preview Your AI Persona</h1>
        <LoadingTransition destination="/chat" />
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Chat Section */}
        <div className={`flex-1 flex flex-col overflow-hidden ${feedbackItem ? "w-[60%]" : "w-full"}`}>
          {/* Chat Messages */}
          <div className="flex-1 overflow-auto space-y-6 text-xl pr-4 mb-6">
            {chatHistory.map((entry) => (
              <div key={entry.id}>
                <ChatMessage role={entry.role} content={entry.content} />
                {entry.needsApproval && entry.role === "assistant" && (
                  <div className="flex justify-end gap-2 mt-2">
                    <Button
                      onClick={() => handleApproval(entry.id, true)}
                      variant="outline"
                      size="sm"
                      className="text-sm font-medium bg-green-600 hover:bg-green-700 text-white border-none px-4 py-2 rounded-md transition-colors duration-200"
                    >
                      Yes
                    </Button>
                    <Button
                      onClick={() => handleApproval(entry.id, false)}
                      variant="outline"
                      size="sm"
                      className="text-sm font-medium bg-red-600 hover:bg-red-700 text-white border-none px-4 py-2 rounded-md transition-colors duration-200"
                      data-feedback="open"
                    >
                      No
                    </Button>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="animate-pulse flex gap-2 text-gray-400">
                <div className="w-4 h-4 rounded-full bg-current" />
                <div className="w-4 h-4 rounded-full bg-current" />
                <div className="w-4 h-4 rounded-full bg-current" />
              </div>
            )}
          </div>

          {/* Chat Input - Slightly higher from the bottom */}
          <div className="mb-4 px-[1px]">
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Test your customized model by asking it something!"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-4 pl-6 pr-24 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent text-xl"
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 flex gap-2">
                <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-gray-400 hover:text-white">
                  <Mic className="h-5 w-5" />
                </Button>
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-gray-400 hover:text-white"
                  disabled={!message.trim()}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Advanced Feedback Panel */}
        {feedbackItem && (
          <div className="w-[40%] overflow-hidden">
            <AdvancedFeedbackPanel content={feedbackItem.content} onSubmit={handleFeedbackSubmit} />
          </div>
        )}
      </div>
    </div>
  )
}

