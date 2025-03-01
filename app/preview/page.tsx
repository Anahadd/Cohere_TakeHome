"use client"

import { useState } from "react"
import { Mic, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import ChatMessage from "@/components/chat-message" // Uses the new Markdown version
import AdvancedFeedbackPanel from "@/components/AdvancedFeedbackPanel"
import LoadingTransition from "@/components/LoadingTransition"
import { usePreferencesStore } from "@/lib/store"

interface ChatEntry {
  role: "user" | "assistant"
  content: string
  id: string
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
  const [feedbackHistory, setFeedbackHistory] = useState("")

  const personaName = usePreferencesStore((state) => state.personaName)
  const selectedTones = usePreferencesStore((state) => state.selectedTones)
  const deliveryStyle = usePreferencesStore((state) => state.deliveryStyle)
  const additionalRequirements = usePreferencesStore((state) => state.additionalRequirements)

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
      const requestBody = {
        preferences: {
          personaName,
          tones: selectedTones,
          deliveryStyle,
          additionalRequirements,
        },
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

  const handleMessageClick = (entry: ChatEntry) => {
    if (entry.role === "assistant") {
      setFeedbackItem(entry)
    }
  }

  const handleFeedbackSubmit = async (feedbackItems: FeedbackItem[]) => {
    if (!feedbackItem) return
    setIsLoading(true)

    const newFeedback = feedbackItems
      .map((item) => {
        return `Annotation: ${item.highlightedText}
Comment: ${item.comment}
User Response: ${item.userResponse}`
      })
      .join("\n\n")

    const updatedFeedbackHistory = feedbackHistory
      ? feedbackHistory + "\n\n" + newFeedback
      : newFeedback
    setFeedbackHistory(updatedFeedbackHistory)

    try {
      const response = await fetch("http://localhost:5000/regenerate-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences: {
            personaName,
            tones: selectedTones,
            deliveryStyle,
            additionalRequirements,
          },
          input: chatHistory[chatHistory.length - 2]?.content || "",
          feedback: updatedFeedbackHistory,
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
      }
    } catch (error) {
      console.error("Error submitting feedback:", error)
    } finally {
      setIsLoading(false)
      setFeedbackItem(null)
    }
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
              <div
                key={entry.id}
                onClick={() => handleMessageClick(entry)}
                className={entry.role === "assistant" ? "cursor-pointer hover:opacity-90" : ""}
              >
                <ChatMessage role={entry.role} content={entry.content} />
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
