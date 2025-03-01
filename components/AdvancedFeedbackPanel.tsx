"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, ChevronLeft, ChevronRight, X } from "lucide-react"

interface AdvancedFeedbackPanelProps {
  content: string
  onSubmit: (feedbackItems: FeedbackItem[]) => void
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

const emojiConfig = [
  { emoji: "😊", label: "Happy", color: "bg-green-500" },
  { emoji: "🤔", label: "Confused", color: "bg-yellow-500" },
  { emoji: "😕", label: "Unsure", color: "bg-orange-500" },
  { emoji: "😞", label: "Disappointed", color: "bg-red-500" },
]

const AdvancedFeedbackPanel: React.FC<AdvancedFeedbackPanelProps> = ({ content, onSubmit }) => {
  const contentRef = useRef<HTMLDivElement>(null)
  const [currentHighlight, setCurrentHighlight] = useState("")
  const [currentEmoji, setCurrentEmoji] = useState<string | null>(null)
  const [currentComment, setCurrentComment] = useState("")
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([])
  const [currentFeedbackIndex, setCurrentFeedbackIndex] = useState(0)

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.innerHTML = content
    }
  }, [content])

  const handleHighlight = () => {
    const selection = window.getSelection()
    if (selection && !selection.isCollapsed) {
      setCurrentHighlight(selection.toString())
    }
  }

  const handleAddFeedback = () => {
    if (!currentHighlight || !currentEmoji) return

    const newFeedbackItem: FeedbackItem = {
      highlightedText: currentHighlight,
      emoji: currentEmoji,
      comment: currentComment,
      color: `hsl(${Math.random() * 360}, 100%, 75%)`,
      aiResponses: [],
      userResponse: "",
      isConversationComplete: false,
    }

    setFeedbackItems((prev) => [...prev, newFeedbackItem])
    setCurrentHighlight("")
    setCurrentEmoji(null)
    setCurrentComment("")
    setCurrentFeedbackIndex(feedbackItems.length)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = `Here's an AI response to your feedback: "${currentComment}". How would you like me to improve this further?`
      setFeedbackItems((prev) => {
        const updatedItems = [...prev]
        updatedItems[updatedItems.length - 1].aiResponses.push(aiResponse)
        return updatedItems
      })
    }, 1000)
  }

  const handlePrevFeedback = () => {
    setCurrentFeedbackIndex((prev) => Math.max(0, prev - 1))
  }

  const handleNextFeedback = () => {
    setCurrentFeedbackIndex((prev) => Math.min(feedbackItems.length - 1, prev + 1))
  }

  const handleDeleteFeedback = (index: number) => {
    setFeedbackItems((prev) => prev.filter((_, i) => i !== index))
    if (index <= currentFeedbackIndex && currentFeedbackIndex > 0) {
      setCurrentFeedbackIndex((prev) => prev - 1)
    }
  }

  const handleUserResponse = (index: number, response: string) => {
    setFeedbackItems((prev) => {
      const newItems = prev.map((item, i) => (i === index ? { ...item, userResponse: response } : item))
      return newItems
    })
  }

  const handleSubmitAllFeedback = () => {
    onSubmit(feedbackItems)
  }

  return (
    <div className="h-full flex flex-col overflow-hidden border-l border-gray-700">
      <div className="p-6 space-y-6 flex-grow overflow-y-auto">
        <h2 className="text-2xl font-semibold sticky top-0 bg-gray-900 py-4 -mt-4 -mx-6 px-6 border-b border-gray-800">
          Feedback Panel
        </h2>

        <div className="space-y-6">
          <div
            ref={contentRef}
            className="p-4 border border-gray-700 rounded-lg bg-gray-800/50 text-lg leading-relaxed"
            onMouseUp={handleHighlight}
          />

          <div className="space-y-3">
            <Label htmlFor="highlighted-text" className="text-lg font-medium block">
              Highlighted text:
            </Label>
            <Input
              id="highlighted-text"
              value={currentHighlight}
              onChange={(e) => setCurrentHighlight(e.target.value)}
              placeholder="Selected text will appear here"
              className="text-base p-3 h-auto bg-gray-800/50 border-gray-700"
              readOnly
            />
          </div>

          <div className="space-y-3">
            <Label className="text-lg font-medium block">How do you feel about this text?</Label>
            <div className="grid grid-cols-2 gap-3">
              {emojiConfig.map(({ emoji, label, color }) => (
                <Button
                  key={emoji}
                  variant={currentEmoji === emoji ? "default" : "outline"}
                  onClick={() => setCurrentEmoji(emoji)}
                  className={`text-base p-3 h-auto ${currentEmoji === emoji ? color : ""} flex items-center justify-center`}
                >
                  <span className="text-2xl mr-2">{emoji}</span>
                  <span>{label}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="comment" className="text-lg font-medium block">
              Additional comments (optional):
            </Label>
            <Textarea
              id="comment"
              placeholder="Explain your reasoning or suggest improvements..."
              value={currentComment}
              onChange={(e) => setCurrentComment(e.target.value)}
              className="min-h-[100px] text-base p-3 bg-gray-800/50 border-gray-700"
            />
          </div>

          <Button
            onClick={handleAddFeedback}
            disabled={!currentHighlight || !currentEmoji}
            className="w-full text-base p-4 h-auto bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Feedback Item
          </Button>

          {feedbackItems.length > 0 && (
            <div className="space-y-6 mt-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-medium">
                  Feedback Item {currentFeedbackIndex + 1} of {feedbackItems.length}:
                </h3>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevFeedback}
                    disabled={currentFeedbackIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextFeedback}
                    disabled={currentFeedbackIndex === feedbackItems.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <FeedbackItemCard
                item={feedbackItems[currentFeedbackIndex]}
                index={currentFeedbackIndex}
                handleDeleteFeedback={handleDeleteFeedback}
                handleUserResponse={handleUserResponse}
              />
            </div>
          )}
        </div>
      </div>

      {feedbackItems.length > 0 && (
        <div className="p-4 border-t border-gray-800">
          <Button
            onClick={handleSubmitAllFeedback}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 text-xl"
          >
            Submit All Feedback & Regenerate
          </Button>
        </div>
      )}
    </div>
  )
}

interface FeedbackItemCardProps {
  item: FeedbackItem
  index: number
  handleDeleteFeedback: (index: number) => void
  handleUserResponse: (index: number, response: string) => void
}

const FeedbackItemCard: React.FC<FeedbackItemCardProps> = ({
  item,
  index,
  handleDeleteFeedback,
  handleUserResponse,
}) => (
  <Card className="p-4 mb-4 bg-gray-800/50 border-gray-700">
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{item.emoji}</span>
          <span className="text-lg font-medium text-gray-300">Feedback #{index + 1}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => handleDeleteFeedback(index)} className="h-7 w-7 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div>
        <Label className="text-base font-medium block mb-1">Highlighted Text:</Label>
        <p className="text-base p-3 rounded-md text-black" style={{ backgroundColor: item.color }}>
          {item.highlightedText}
        </p>
      </div>

      {item.comment && (
        <div>
          <Label className="text-base font-medium block mb-1">Your Comment:</Label>
          <p className="text-base p-3 bg-gray-700/50 rounded-md">{item.comment}</p>
        </div>
      )}

      {item.aiResponses.length > 0 && (
        <div>
          <Label className="text-base font-medium block mb-1">AI Responses:</Label>
          <div className="space-y-2">
            {item.aiResponses.map((response, responseIndex) => (
              <p key={responseIndex} className="text-base p-3 bg-purple-900/30 rounded-md">
                {response}
              </p>
            ))}
          </div>
        </div>
      )}

      <div>
        <Label htmlFor={`user-response-${index}`} className="text-base font-medium block mb-1">
          Your Response:
        </Label>
        <Textarea
          id={`user-response-${index}`}
          placeholder="Add any additional thoughts or clarifications..."
          className="text-base p-3 min-h-[80px] bg-gray-800/50 border-gray-700"
          value={item.userResponse}
          onChange={(e) => handleUserResponse(index, e.target.value)}
        />
      </div>
    </div>
  </Card>
)

export default AdvancedFeedbackPanel

