import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { personaId: string } }
) {
  // Replace with actual database queries
  const analyticsData = Array.from({ length: 30 }, (_, i) => ({
    timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    cosineSimilarity: 0.7 + Math.random() * 0.3,
    responseTime: 100 + Math.random() * 200,
    userSatisfaction: 0.6 + Math.random() * 0.4,
  }))

  return NextResponse.json(analyticsData)
} 