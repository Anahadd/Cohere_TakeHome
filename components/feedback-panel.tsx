"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { motion } from "framer-motion"

const FEEDBACK_OPTIONS = [
  { value: 1, label: "Worst", emoji: "😠", color: "bg-red-500" },
  { value: 2, label: "Not Good", emoji: "🙁", color: "bg-orange-500" },
  { value: 3, label: "Fine", emoji: "😐", color: "bg-yellow-500" },
  { value: 4, label: "Looks Good", emoji: "🙂", color: "bg-lime-500" },
  { value: 5, label: "Very Good", emoji: "😊", color: "bg-green-500" },
]

interface FeedbackPanelProps {
  aiResponse: string | null
}

export default function FeedbackPanel({ aiResponse }: FeedbackPanelProps) {
  const [selectedText, setSelectedText] = useState("")
  const [rating, setRating] = useState<number | null>(null)
  const [comments, setComments] = useState("")

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection()
      if (selection && selection.toString().trim()) {
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

  const handleSubmit = () => {
    console.log({
      selectedText,
      rating,
      comments,
    })
    // Reset form
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
          Please select the part of the text that you want to change or improve. The model will continue to perfect
          itself until you are satisfied.
        </p>

        <div className="space-y-3">
          <label className="text-lg font-medium">AI Response</label>
          <div className="min-h-[100px] p-4 bg-gray-800/50 rounded-lg text-xl">{aiResponse}</div>
        </div>

        <div className="space-y-3">
          <label className="text-lg font-medium">Selected Text</label>
          <div className="min-h-[80px] p-4 bg-gray-800/50 rounded-lg text-xl">
            {selectedText || "Select text from the AI response above"}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-lg font-medium">How do you feel about the text?</label>
          <div className="flex justify-between">
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

        <div className="space-y-3">
          <label className="text-lg font-medium">
            Add your comments on why you feel the way you do and how we can improve.
          </label>
          <div className="px-5">
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="min-h-[200px] w-full bg-gray-800/50 border-gray-700 text-white resize-none text-lg p-6"
            />
          </div>
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 text-xl mt-6"
      >
        Submit Feedback
      </Button>
    </div>
  )
}

