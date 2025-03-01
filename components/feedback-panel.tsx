"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"

const FEEDBACK_OPTIONS = [
  { value: 1, label: "Worst", emoji: "😠", color: "bg-red-500" },
  { value: 2, label: "Not Good", emoji: "🙁", color: "bg-orange-500" },
  { value: 3, label: "Fine", emoji: "😐", color: "bg-yellow-500" },
  { value: 4, label: "Looks Good", emoji: "🙂", color: "bg-lime-500" },
  { value: 5, label: "Very Good", emoji: "😊", color: "bg-green-500" },
]

export interface FeedbackItem {
  highlightedText: string
  emoji: string
  comment: string
  color: string
  aiResponses: string[]
  userResponse: string
  isConversationComplete: boolean
}

interface FeedbackPanelProps {
  aiResponse: string | null
}

/**
 * FeedbackPanel displays the AI response, allows the user to highlight text,
 * select a rating, and leave comments. When the user clicks "Submit Feedback & Regenerate",
 * we call our backend's /regenerate-feedback endpoint, then display each AI follow-up response in a list.
 */
export default function FeedbackPanel({ aiResponse }: FeedbackPanelProps) {
  const [selectedText, setSelectedText] = useState("")
  const [rating, setRating] = useState<number | null>(null)
  const [comments, setComments] = useState("")
  // We'll store multiple follow-up responses in this array:
  const [aiFollowUps, setAiFollowUps] = useState<string[]>([])

  const contentRef = useRef<HTMLDivElement>(null)

  // Insert the AI response HTML into the div
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.innerHTML = aiResponse || ""
    }
  }, [aiResponse])

  // Capture highlighted text from the AI response
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection()
      if (selection && !selection.isCollapsed) {
        setSelectedText(selection.toString().trim())
      }
    }
    document.addEventListener("mouseup", handleSelection)
    document.addEventListener("touchend", handleSelection)
    return () => {
      document.removeEventListener("mouseup", handleSelection)
      document.removeEventListener("touchend", handleSelection)
    }
  }, [])

  /**
   * Submits feedback to the /regenerate-feedback endpoint
   * and saves the AI's follow-up in the aiFollowUps array.
   */
  const handleSubmitAndGetFollowUp = async () => {
    if (!selectedText || !rating) return

    const feedbackString = `Annotation: ${selectedText}\nRating: ${rating}\nComment: ${comments}`

    try {
      const response = await fetch("http://localhost:5000/regenerate-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: aiResponse || "",
          feedback: feedbackString,
          preferences: {}, // if you need to pass user preferences, do so here
        }),
      })

      const data = await response.json()
      if (data.success) {
        // Append this new follow-up response to the array
        setAiFollowUps((prev) => [...prev, data.feedback])
      } else {
        console.error("Error from backend:", data.error)
      }
    } catch (error: any) {
      console.error("Error submitting feedback:", error)
    }
  }

  /**
   * Handles the local submission event:
   * - Logs the feedback for debugging
   * - Calls handleSubmitAndGetFollowUp to actually contact the backend
   * - Resets local fields
   */
  const handleLocalSubmit = () => {
    console.log("Feedback submitted:", { selectedText, rating, comments })
    handleSubmitAndGetFollowUp()
    setSelectedText("")
    setRating(null)
    setComments("")
  }

  if (!aiResponse) return null

  return (
    <div className="h-full bg-gray-800/30 rounded-xl p-8 flex flex-col overflow-hidden">
      <h2 className="text-2xl font-semibold mb-6">Feedback Panel</h2>

      <div className="space-y-6 flex-grow overflow-y-auto pr-4">
        <p className="text-lg text-gray-300">
          Please select the part of the text that you want to change or improve. The model will use your feedback
          to ask a follow-up question to clarify your suggestions.
        </p>

        {/* AI Response Display */}
        <div className="space-y-3">
          <Label className="text-lg font-medium">AI Response</Label>
          <div
            ref={contentRef}
            className="min-h-[100px] p-4 bg-gray-800/50 rounded-lg text-xl leading-relaxed"
          />
        </div>

        {/* Selected Text */}
        <div className="space-y-3">
          <Label className="text-lg font-medium">Selected Text</Label>
          <div className="min-h-[80px] p-4 bg-gray-800/50 rounded-lg text-xl">
            {selectedText || "Select text from the AI response above"}
          </div>
        </div>

        {/* Rating */}
        <div className="space-y-3">
          <Label className="text-lg font-medium">How do you feel about the text?</Label>
          <div className="grid grid-cols-2 gap-3">
            {FEEDBACK_OPTIONS.map((option) => (
              <motion.button
                key={option.value}
                onClick={() => setRating(option.value)}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-colors ${
                  rating === option.value ? option.color : "hover:bg-gray-800/50"
                }`}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                animate={
                  rating === option.value
                    ? { y: [-10, 0, -10], transition: { repeat: Number.POSITIVE_INFINITY, duration: 1.5 } }
                    : { y: 0 }
                }
              >
                <span className="text-3xl">{option.emoji}</span>
                <span className="text-sm text-gray-300">{option.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Additional Comments */}
        <div className="space-y-3">
          <Label className="text-lg font-medium">Additional Comments (optional)</Label>
          <Textarea
            placeholder="Explain your reasoning or suggest improvements..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="min-h-[200px] w-full bg-gray-800/50 border-gray-700 text-white resize-none text-lg p-6"
          />
        </div>
      </div>

      {/* Submit & Regenerate */}
      <Button
        onClick={handleLocalSubmit}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 text-xl mt-6"
      >
        Submit Feedback & Regenerate
      </Button>

      {/* Display All Follow-Up AI Responses */}
      {aiFollowUps.length > 0 && (
        <div className="mt-6 space-y-4">
          {aiFollowUps.map((resp, i) => (
            <div key={i} className="p-4 bg-gray-700 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">AI Follow-Up #{i + 1}:</h3>
              <p className="text-lg">{resp}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
