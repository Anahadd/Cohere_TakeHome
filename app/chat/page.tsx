"use client"

import type React from "react"

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

export default function ChatPage() {
  const [message, setMessage] = useState("")
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [feedbackItem, setFeedbackItem] = useState<ChatEntry | null>(null)
  const [improvingEntryId, setImprovingEntryId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    // Add welcome message
    setChatHistory([
      {
        role: "assistant",
        content: "Hello! I'm your personalized AI assistant. How can I help you today?",
        id: Date.now().toString(),
      },
    ])
  }, [])

  if (!mounted) return null

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
    // Simulate AI response
    setTimeout(() => {
      const aiResponse = `Thank you for your message about "${userMessage}". I'm your personalized AI assistant, configured with your preferences. How else can I assist you?`
      const aiEntry: ChatEntry = { role: "assistant", content: aiResponse, id: Date.now().toString() }
      setChatHistory((prev) => [...prev, aiEntry])
      setIsLoading(false)
    }, 1000)
  }

  const handleRegenerate = async (entryId: string) => {
    const entryIndex = chatHistory.findIndex((entry) => entry.id === entryId)
    if (entryIndex < 1 || chatHistory[entryIndex - 1].role !== "user") return

    const userMessage = chatHistory[entryIndex - 1].content
    setChatHistory((prev) => prev.filter((_, index) => index !== entryIndex))
    await generateResponse(userMessage)
  }

  const handleFineTune = (entry: ChatEntry) => {
    setFeedbackItem(entry)
  }

  const handleFeedbackSubmit = (feedbackItems: FeedbackItem[]) => {
    if (!feedbackItem) return

    let updatedContent = feedbackItem.content

    feedbackItems.forEach((item) => {
      if (item.emoji === "😕" || item.emoji === "😞") {
        updatedContent = updatedContent.replace(item.highlightedText, "[Changing this part...]")
      }
    })

    setChatHistory((prev) =>
      prev.map((entry) =>
        entry.id === feedbackItem.id ? { ...entry, content: updatedContent, isImproving: true } : entry,
      ),
    )

    setImprovingEntryId(feedbackItem.id)
    setFeedbackItem(null)

    // Simulate AI improving the response
    setTimeout(() => {
      const improvedContent = generateImprovedContent(feedbackItem.content, feedbackItems)
      setChatHistory((prev) =>
        prev.map((entry) =>
          entry.id === feedbackItem.id
            ? { ...entry, content: improvedContent, isImproving: false, needsApproval: true }
            : entry,
        ),
      )
    }, 2000)
  }

  const generateImprovedContent = (originalContent: string, feedbackItems: FeedbackItem[]) => {
    let improvedContent = originalContent
    feedbackItems.forEach((item) => {
      const improvedText = generateImprovedText(item.highlightedText, item.emoji, item.comment)
      improvedContent = improvedContent.replace(item.highlightedText, improvedText)
    })
    return improvedContent
  }

  const generateImprovedText = (originalText: string, emoji: string, comment: string) => {
    // This is a placeholder function. In a real implementation, you would use more sophisticated
    // natural language processing techniques to improve the text based on the feedback.
    let improvement = originalText
    switch (emoji) {
      case "😊":
        improvement += " (This part was well-received!)"
        break
      case "🤔":
        improvement += " (This part was clarified based on feedback.)"
        break
      case "😕":
        improvement += " (This part was revised for better understanding.)"
        break
      case "😞":
        improvement += " (This part was significantly improved based on feedback.)"
        break
      default:
        improvement += " (This part was updated based on feedback.)"
    }
    return improvement
  }

  const handleApproval = (entryId: string, isApproved: boolean) => {
    if (isApproved) {
      setChatHistory((prev) => prev.map((entry) => (entry.id === entryId ? { ...entry, needsApproval: false } : entry)))
    } else {
      handleRegenerate(entryId)
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
              {entry.role === "assistant" && !entry.isImproving && !entry.needsApproval && (
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
              {entry.needsApproval && (
                <div className="flex items-center space-x-4 ml-12 mt-2">
                  <span className="text-yellow-500 font-medium">Do you like the new output?</span>
                  <div className="flex space-x-2">
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
                    >
                      No
                    </Button>
                  </div>
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

