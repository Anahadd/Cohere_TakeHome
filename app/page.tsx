"use client"

import { useEffect, useState } from "react"
import Sidebar from "@/components/sidebar"
import PreferencesPrompt from "@/components/preferences-prompt"
import { usePreferencesStore } from "@/lib/store"

export default function Home() {
  console.log('Home component rendered')

  const [mounted, setMounted] = useState(false)
  const preferences = usePreferencesStore()

  useEffect(() => {
    console.log('Current preferences:', preferences)
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex items-center justify-center p-4 relative">
        {/* Background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] left-[15%] w-64 h-64 rounded-full bg-purple-900/10 blur-3xl animate-pulse-slow"></div>
          <div
            className="absolute bottom-[20%] right-[10%] w-80 h-80 rounded-full bg-indigo-900/10 blur-3xl animate-pulse-slow"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        <div className="animate-scale-in">
          <PreferencesPrompt />
        </div>
      </main>
    </div>
  )
}

