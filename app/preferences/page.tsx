"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Check, Loader2 } from "lucide-react"
import { InfoTooltip } from "@/components/InfoTooltip"
import { useRouter } from "next/navigation"
import { usePreferencesStore } from "@/lib/store"
import { toast } from "sonner"

export default function PreferencesPage() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  
  // Get values and update functions from the global store
  const personaName = usePreferencesStore((state) => state.personaName)
  const selectedTones = usePreferencesStore((state) => state.selectedTones)
  const deliveryStyle = usePreferencesStore((state) => state.deliveryStyle)
  const additionalRequirements = usePreferencesStore((state) => state.additionalRequirements)
  
  const setPersonaName = usePreferencesStore((state) => state.setPersonaName)
  const setSelectedTones = usePreferencesStore((state) => state.setSelectedTones)
  const setDeliveryStyle = usePreferencesStore((state) => state.setDeliveryStyle)
  const setAdditionalRequirements = usePreferencesStore((state) => state.setAdditionalRequirements)

  // Local state for form inputs
  const [localPersonaName, setLocalPersonaName] = useState(personaName || "")
  const [localSelectedTones, setLocalSelectedTones] = useState<string[]>(selectedTones || [])
  const [localDeliveryStyle, setLocalDeliveryStyle] = useState<string | null>(deliveryStyle || "bullet")
  const [localAdditionalRequirements, setLocalAdditionalRequirements] = useState(additionalRequirements || "")

  // Load values from store when component mounts
  useEffect(() => {
    setLocalPersonaName(personaName || "")
    setLocalSelectedTones(selectedTones || [])
    setLocalDeliveryStyle(deliveryStyle || "bullet")
    setLocalAdditionalRequirements(additionalRequirements || "")
  }, [personaName, selectedTones, deliveryStyle, additionalRequirements])

  const toggleTone = (tone: string) => {
    setLocalSelectedTones((prev) =>
      prev.includes(tone) ? prev.filter((t) => t !== tone) : [...prev, tone]
    )
  }

  const toggleDeliveryStyle = (style: string) => {
    setLocalDeliveryStyle((prev) => (prev === style ? null : style))
  }

  const handleUpdate = async () => {
    if (!localPersonaName.trim()) {
      toast.error("Please enter a name for your AI persona")
      return
    }
    
    setIsSaving(true)
    
    try {
      // Update the global store with local form values
      setPersonaName(localPersonaName)
      setSelectedTones(localSelectedTones)
      setDeliveryStyle(localDeliveryStyle)
      setAdditionalRequirements(localAdditionalRequirements)
      
      // Sync with MongoDB
      const response = await fetch('/api/sync-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personaName: localPersonaName,
          selectedTones: localSelectedTones,
          deliveryStyle: localDeliveryStyle,
          additionalRequirements: localAdditionalRequirements,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to sync preferences with database');
      }
      
      toast.success("Preferences updated and saved to database")
      
      // Navigate to the preview page
      router.push("/preview")
    } catch (error) {
      console.error("Error updating preferences:", error)
      toast.error("Failed to save preferences to database")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-16 px-4">
      {/* AI Persona Name */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Label htmlFor="persona-name" className="text-2xl text-white font-semibold">
            AI Persona Name
          </Label>
          <InfoTooltip content="Giving your AI a name helps personalize the experience and sets the tone for your interactions." />
        </div>
        <Input
          id="persona-name"
          placeholder="Enter your AI Persona's Name"
          className="bg-gray-800/50 border-gray-700 text-white text-lg h-16 px-4"
          value={localPersonaName}
          onChange={(e) => setLocalPersonaName(e.target.value)}
        />
      </div>

      {/* Tone/Lens Section */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Label className="text-2xl text-white font-semibold">Tone / Lens</Label>
          <InfoTooltip content="Selecting tones helps shape your AI's personality and communication style. Mix and match to create a unique voice that suits your needs." />
        </div>
        <p className="text-lg text-gray-300">Please select all that apply</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <ToneButton
            tone="Concise"
            selected={localSelectedTones.includes("Concise")}
            onClick={() => toggleTone("Concise")}
            className="bg-teal-500/20 text-teal-300 hover:bg-teal-500/30"
          />
          <ToneButton
            tone="Educational"
            selected={localSelectedTones.includes("Educational")}
            onClick={() => toggleTone("Educational")}
            className="bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
          />
          <ToneButton
            tone="Conversational"
            selected={localSelectedTones.includes("Conversational")}
            onClick={() => toggleTone("Conversational")}
            className="bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
          />
          <ToneButton
            tone="Professional"
            selected={localSelectedTones.includes("Professional")}
            onClick={() => toggleTone("Professional")}
            className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
          />
          <ToneButton
            tone="Friendly"
            selected={localSelectedTones.includes("Friendly")}
            onClick={() => toggleTone("Friendly")}
            className="bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30"
          />
          <ToneButton
            tone="Technical"
            selected={localSelectedTones.includes("Technical")}
            onClick={() => toggleTone("Technical")}
            className="bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30"
          />
          <ToneButton
            tone="Casual"
            selected={localSelectedTones.includes("Casual")}
            onClick={() => toggleTone("Casual")}
            className="bg-green-500/20 text-green-300 hover:bg-green-500/30"
          />
          <ToneButton
            tone="Formal"
            selected={localSelectedTones.includes("Formal")}
            onClick={() => toggleTone("Formal")}
            className="bg-pink-500/20 text-pink-300 hover:bg-pink-500/30"
          />
        </div>
      </div>

      {/* Delivery Style Options */}
      <div className="space-y-6">
        <div className="flex items-center">
          <Label className="text-2xl text-white font-semibold mr-2">Delivery Style Options</Label>
          <div className="mt-1">
            <InfoTooltip
              content="Choose how you want information presented. This affects how the AI structures its responses to best suit your preferences."
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DeliveryStyleButton
            value="bullet"
            label="Bullet Points"
            description="For lists and quick facts"
            selected={localDeliveryStyle === "bullet"}
            onClick={() => toggleDeliveryStyle("bullet")}
          />
          <DeliveryStyleButton
            value="narrative"
            label="Narrative Style"
            description="For more detailed explanations"
            selected={localDeliveryStyle === "narrative"}
            onClick={() => toggleDeliveryStyle("narrative")}
          />
          <DeliveryStyleButton
            value="hybrid"
            label="Hybrid"
            description="A mix of both"
            selected={localDeliveryStyle === "hybrid"}
            onClick={() => toggleDeliveryStyle("hybrid")}
          />
        </div>
      </div>

      {/* Additional Requirements */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Label htmlFor="requirements" className="text-2xl text-white font-semibold">
            Additional Requirements
          </Label>
          <InfoTooltip content="Use this space to provide any specific instructions, preferences, or context that will help tailor the AI to your unique needs." />
        </div>
        <Textarea
          id="requirements"
          className="min-h-[250px] bg-gray-800/50 border-gray-700 text-white text-lg resize-none p-4"
          placeholder="Add any additional requirements or preferences..."
          value={localAdditionalRequirements}
          onChange={(e) => setLocalAdditionalRequirements(e.target.value)}
        />
      </div>

      {/* Update Button */}
      <div className="pt-8">
        <Button
          onClick={handleUpdate}
          disabled={isSaving}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xl font-semibold py-6 rounded-xl transition-colors disabled:opacity-70"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : (
            "Update Preferences"
          )}
        </Button>
      </div>
    </div>
  )
}

function DeliveryStyleButton({ value, label, description, selected, onClick }: { value: string; label: string; description: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`flex flex-col items-start p-6 rounded-xl transition-all duration-200 ${
        selected
          ? "bg-purple-600 text-white shadow-lg shadow-purple-600/50"
          : "bg-gray-800/50 text-gray-300 hover:bg-gray-800/70"
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between w-full mb-3">
        <span className="text-xl font-medium">{label}</span>
        {selected && <Check size={24} />}
      </div>
      <span className="text-base opacity-80">{description}</span>
    </button>
  )
}

function ToneButton({ tone, selected, onClick, className }: { tone: string; selected: boolean; onClick: () => void; className: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-6 py-4 rounded-xl text-lg font-medium transition-all ${
        selected ? `${className} ring-2 ring-white/20` : "bg-gray-800/50 text-gray-400 hover:bg-gray-800/70"
      }`}
    >
      {tone}
    </button>
  )
}
