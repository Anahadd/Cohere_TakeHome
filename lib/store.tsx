'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface PreferencesState {
  personaName: string
  selectedTones: string[]
  deliveryStyle: string | null
  additionalRequirements: string
  setPersonaName: (name: string) => void
  setSelectedTones: (tones: string[]) => void
  setDeliveryStyle: (style: string | null) => void
  setAdditionalRequirements: (requirements: string) => void
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      personaName: '',
      selectedTones: [],
      deliveryStyle: 'bullet',
      additionalRequirements: '',
      setPersonaName: (name) => set({ personaName: name }),
      setSelectedTones: (tones) => set({ selectedTones: tones }),
      setDeliveryStyle: (style) => set({ deliveryStyle: style }),
      setAdditionalRequirements: (requirements) => set({ additionalRequirements: requirements }),
    }),
    {
      name: 'preferences-storage',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
)
