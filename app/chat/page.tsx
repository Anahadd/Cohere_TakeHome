"use client"

import { useState, useEffect } from "react"
import { Mic, Send, Settings, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import ChatMessage from "@/components/chat-message"
import Image from "next/image"
import AdvancedFeedbackPanel from "@/components/AdvancedFeedbackPanel"

interface ChatEntry {
  role: "user" | "assistant"
  content: string
  id: string
  isImproving?: boolean
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

export default function ChatPage() {
  const [message, setMessage] = useState("")
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [feedbackItem, setFeedbackItem] = useState<ChatEntry | null>(null)
  const [improvingEntryId, setImprovingEntryId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    // Set an initial welcome message
    setChatHistory([
      {
        role: "assistant",
        content: "Hello! I'm your personalized AI assistant. How can I help you today?",
        id: Date.now().toString(),
      },
    ])
  }, [])

  if (!mounted) return null

  // Handle sending a new user message
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    const userEntry: ChatEntry = { role: "user", content: message, id: Date.now().toString() }
    setChatHistory((prev) => [...prev, userEntry])
    setMessage("")
    await generateResponse(userEntry.content)
  }

  // Simulate generating a response (replace with your actual API call if needed)
  const generateResponse = async (userMessage: string) => {
    setIsLoading(true)
    try {
      const requestBody = {
        preferences: {}, // Optionally pass preferences here
        input: userMessage,
      }

      const response = await fetch("http://localhost:5000/generate-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()
      if (data.success) {
        const aiEntry: ChatEntry = {
          role: "assistant",
          content: data.feedback,
          id: Date.now().toString(),
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

  // Regenerate uses the previous user message; if missing, fallback to current assistant content
  const handleRegenerate = async (entryId: string) => {
    const entryIndex = chatHistory.findIndex((entry) => entry.id === entryId)
    // If there's no previous user message, use the current assistant's content
    let userMessage = chatHistory[entryIndex - 1]?.content
    if (!userMessage || !userMessage.trim()) {
      userMessage = chatHistory[entryIndex].content
    }
    setIsLoading(true)
    try {
      const response = await fetch("http://localhost:5000/regenerate-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences: {}, // Optionally pass preferences here
          input: userMessage,
          feedback: "", // No feedback provided for a simple regeneration
        }),
      })
      const data = await response.json()
      if (data.success) {
        const newAiEntry: ChatEntry = {
          role: "assistant",
          content: data.feedback,
          id: Date.now().toString(),
        }
        setChatHistory((prev) => [...prev, newAiEntry])
      } else {
        console.error("Error from backend:", data.error)
      }
    } catch (error) {
      console.error("Error regenerating response:", error)
    }
    setIsLoading(false)
  }

  // Fine-tune simply opens the feedback panel for the selected assistant message
  const handleFineTune = (entry: ChatEntry) => {
    setFeedbackItem(entry)
  }

  // Handle submission of feedback from AdvancedFeedbackPanel
  const handleFeedbackSubmit = async (feedbackItems: FeedbackItem[]) => {
    if (!feedbackItem) return
    setIsLoading(true)

    // Combine feedback items into one string, including userResponse
    const feedbackString = feedbackItems
      .map((item) => {
        return `Annotation: ${item.highlightedText}\nComment: ${item.comment}\nUser Response: ${item.userResponse}`
      })
      .join("\n\n")

    // Fallback: use the previous user message, or if empty, use the current assistant's content
    const entryIndex = chatHistory.findIndex((entry) => entry.id === feedbackItem.id)
    let userMessage = chatHistory[entryIndex - 1]?.content
    if (!userMessage || !userMessage.trim()) {
      userMessage = feedbackItem.content
    }

    try {
      const response = await fetch("http://localhost:5000/regenerate-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences: {}, // Pass preferences here if needed
          input: userMessage,
          feedback: feedbackString,
        }),
      })
      const data = await response.json()
      if (data.success) {
        const improvedResponse = data.feedback
        // Update the assistant message with the improved response
        setChatHistory((prev) =>
          prev.map((entry) =>
            entry.id === feedbackItem.id ? { ...entry, content: improvedResponse, isImproving: false } : entry
          )
        )
      } else {
        console.error("Error from backend:", data.error)
      }
    } catch (error) {
      console.error("Error submitting feedback:", error)
    } finally {
      setIsLoading(false)
      setFeedbackItem(null)
    }
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className={`flex flex-col flex-grow ${feedbackItem ? "w-[60%]" : "w-full"}`}>
        <div className="flex items-center p-4 border-b border-gray-800">
          <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
            <Image src="/avatar.svg" alt="AI Avatar" width={40} height={40} className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl font-semibold">Your Personalized AI Assistant</h1>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {chatHistory.map((entry) => (
            <div key={entry.id} className="space-y-2">
              <ChatMessage role={entry.role} content={entry.content} />
              {entry.role === "assistant" && !entry.isImproving && (
                <div className="flex space-x-2 ml-12">
                  <Button onClick={() => handleFineTune(entry)} variant="outline" size="sm" className="text-xs">
                    <Settings className="w-3 h-3 mr-1" />
                    Fine-tune
                  </Button>
                  <Button onClick={() => handleRegenerate(entry.id)} variant="outline" size="sm" className="text-xs">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Regenerate
                  </Button>
                </div>
              )}
              {entry.isImproving && <div className="ml-12 text-yellow-500">Improving response...</div>}
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

        {/* Chat Input */}
        <div className="p-4 border-t border-gray-800">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-4 pl-6 pr-24 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
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
        <div className="w-[40%] border-l border-gray-700">
          <AdvancedFeedbackPanel content={feedbackItem.content} onSubmit={handleFeedbackSubmit} />
        </div>
      )}
    </div>
  )
}
