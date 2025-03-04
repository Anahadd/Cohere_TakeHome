"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import AnalyticsPage from "../analytics/page"

export default function PersonaAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  
  // This page will just load the analytics component
  // It's useful for consistent routing with personaId parameters
  
  return <AnalyticsPage />
} 