import type React from "react"
import Sidebar from "@/components/sidebar"

export default function PreferencesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  )
}

