import { Metadata } from "next"
import { PersonaList } from "@/components/admin/PersonaList"

export const metadata: Metadata = {
  title: "AI Personas Dashboard",
  description: "Manage your AI personas and view chat history",
}

export default function AdminPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-indigo-600 bg-clip-text text-transparent">Admin Dashboard</h1>
        <p className="text-lg text-gray-400 mt-2">Manage your AI personas and analyze chat performance</p>
      </div>
      <PersonaList />
    </div>
  )
} 