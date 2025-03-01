"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"

export default function PreferencesPrompt() {
  const router = useRouter()

  const handleYesClick = () => {
    router.push("/preferences")
  }

  return (
    <div className="max-w-3xl w-full flex flex-col items-center text-center space-y-10">
      <div className="relative w-32 h-32 md:w-40 md:h-40 animate-float">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-700 to-indigo-900 transform -translate-x-1 -translate-y-1 animate-pulse-slow" />
        <div className="absolute inset-0 rounded-full bg-indigo-950 overflow-hidden flex items-center justify-center shadow-2xl shadow-purple-900/30">
          <Image
            src="/avatar.svg"
            alt="Avatar"
            width={160}
            height={160}
            className="w-full h-full object-cover"
            priority
          />
        </div>
      </div>

      <div className="space-y-5 animate-fade-in w-full">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent px-4 md:px-8 lg:px-16">
          Do you want to customize the chat experience based on your preferences?
        </h1>
        <p className="text-gray-400 text-sm md:text-base font-light max-w-xl mx-auto">
          Personalize your own AI Persona and provide feedback to enhance its capabilities and understanding
        </p>
      </div>

      <div className="flex gap-4 w-full max-w-xs mx-auto pt-4 animate-fade-in animate-delay-200">
        <button
          className="flex-1 btn-gradient rounded-xl py-4 px-6 text-white font-medium text-lg shadow-lg shadow-purple-900/30"
          onClick={handleYesClick}
        >
          Yes
        </button>
        <button className="flex-1 btn-secondary rounded-xl py-4 px-6 text-white font-medium text-lg">No</button>
      </div>
    </div>
  )
}

