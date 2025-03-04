"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { usePreferencesStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { ExternalLink, ArrowLeft, Copy } from "lucide-react"

interface Citation {
  title: string
  url: string
  relevance: number
}

interface Interaction {
  timestamp: string
  input: string
  response: string
  response_time: number
  similarity: number
  similarity_with_previous?: number
  citations?: Citation[]
}

interface AnalyticsData {
  totalInteractions: number
  averageResponseTime: number
  averageSimilarity: number
  interactions: Interaction[]
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedInteraction, setSelectedInteraction] = useState<Interaction | null>(null)
  const router = useRouter()
  const personaName = usePreferencesStore((state) => state.personaName)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const response = await fetch("http://localhost:5000/persona-analytics")
        const data = await response.json()
        
        // Find the current persona data
        const currentPersona = data.find((p: any) => p.name === personaName)
        
        if (currentPersona) {
          // Transform data for our UI
          const transformedData = {
            totalInteractions: currentPersona.metrics.totalInteractions,
            averageResponseTime: currentPersona.metrics.averageResponseTime,
            averageSimilarity: currentPersona.metrics.averageSimilarity,
            interactions: currentPersona.metrics.history.timestamps.map((timestamp: string, i: number) => ({
              timestamp,
              input: currentPersona.metrics.interactions?.[i]?.input || "Unknown",
              response: currentPersona.metrics.interactions?.[i]?.response || "Unknown",
              response_time: currentPersona.metrics.history.responseTimes[i],
              similarity: currentPersona.metrics.history.similarities[i],
              similarity_with_previous: currentPersona.metrics.history.similarities_with_previous[i],
              // Parse citations if they exist in the response
              citations: extractCitationsFromResponse(currentPersona.metrics.interactions?.[i]?.response)
            }))
          }
          setAnalyticsData(transformedData)
        }
      } catch (error) {
        console.error("Error fetching analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    if (personaName) {
      fetchAnalytics()
    }
  }, [personaName])

  // Function to extract citations from response text
  const extractCitationsFromResponse = (response: string) => {
    if (!response) return []
    
    // Look for citation patterns in the response
    // Example patterns: [1]: http://example.com or Source: http://example.com
    const citations: Citation[] = []
    
    // Regular expressions to match different citation formats
    const citationRegexes = [
      /\[(\d+)\]:\s*(https?:\/\/[^\s]+)/g,
      /Source:\s*(https?:\/\/[^\s]+)/gi,
      /Reference:\s*(https?:\/\/[^\s]+)/gi,
      /(https?:\/\/[^\s]+)/g
    ]
    
    for (const regex of citationRegexes) {
      let match
      while ((match = regex.exec(response)) !== null) {
        citations.push({
          title: `Citation ${citations.length + 1}`,
          url: match[1],
          relevance: 0.8 // Default relevance score
        })
      }
    }
    
    return citations
  }

  const chartData = analyticsData?.interactions.map((interaction, index) => ({
    timestamp: new Date(interaction.timestamp).toLocaleString(),
    responseTime: interaction.response_time,
    similarity: interaction.similarity * 100,
    consistencyWithPrevious: interaction.similarity_with_previous * 100
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse flex gap-2 text-gray-400">
          <div className="w-4 h-4 rounded-full bg-current" />
          <div className="w-4 h-4 rounded-full bg-current" />
          <div className="w-4 h-4 rounded-full bg-current" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">{personaName} Analytics</h1>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.totalInteractions || 0}</div>
            <p className="text-xs text-muted-foreground">Total number of user interactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(analyticsData?.averageResponseTime || 0).toFixed(2)}ms</div>
            <p className="text-xs text-muted-foreground">Average time to generate response</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Similarity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{((analyticsData?.averageSimilarity || 0) * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Cosine similarity with expected responses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Response Consistency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((analyticsData?.interactions.reduce((acc, curr) => acc + (curr.similarity_with_previous || 0), 0) / 
                analyticsData?.interactions.filter(i => i.similarity_with_previous > 0).length) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Average similarity between consecutive responses</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance">
        <TabsList>
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
          <TabsTrigger value="interactions">User Interactions</TabsTrigger>
          <TabsTrigger value="citations">Citations & Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Over Time</CardTitle>
              <CardDescription>Response time and similarity over your interactions</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="responseTime"
                    stroke="#8884d8"
                    name="Response Time (ms)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="similarity"
                    stroke="#82ca9d"
                    name="Similarity (%)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="consistencyWithPrevious"
                    stroke="#ffa726"
                    name="Consistency with Previous (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Interactions</CardTitle>
              <CardDescription>Click on an interaction to view details</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[400px] overflow-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-gray-900">
                    <tr>
                      <th className="p-3 text-left">Time</th>
                      <th className="p-3 text-left">User Input</th>
                      <th className="p-3 text-left">Response Time</th>
                      <th className="p-3 text-left">Similarity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData?.interactions.map((interaction, i) => (
                      <tr 
                        key={i} 
                        className="border-t border-gray-800 hover:bg-gray-800/40 cursor-pointer transition-colors"
                        onClick={() => setSelectedInteraction(interaction)}
                      >
                        <td className="p-3">{new Date(interaction.timestamp).toLocaleString()}</td>
                        <td className="p-3 truncate max-w-[200px]">{interaction.input}</td>
                        <td className="p-3">{interaction.response_time.toFixed(2)}ms</td>
                        <td className="p-3">{(interaction.similarity * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {selectedInteraction && (
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Interaction Details</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedInteraction(null)}
                  >
                    Close
                  </Button>
                </CardTitle>
                <CardDescription>
                  {new Date(selectedInteraction.timestamp).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">User Input:</h4>
                  <div className="bg-gray-800 p-3 rounded">{selectedInteraction.input}</div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 flex justify-between">
                    <span>Model Response:</span>
                    <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(selectedInteraction.response)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </h4>
                  <div className="bg-gray-800 p-3 rounded whitespace-pre-wrap">{selectedInteraction.response}</div>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="bg-purple-900/20 p-3 rounded-lg">
                    <div className="text-sm text-gray-400">Response Time</div>
                    <div className="text-lg font-semibold">{selectedInteraction.response_time.toFixed(2)}ms</div>
                  </div>
                  <div className="bg-green-900/20 p-3 rounded-lg">
                    <div className="text-sm text-gray-400">Similarity</div>
                    <div className="text-lg font-semibold">{(selectedInteraction.similarity * 100).toFixed(1)}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="citations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sources & Citations</CardTitle>
              <CardDescription>References used by the AI in responses</CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData?.interactions.some(i => i.citations && i.citations.length > 0) ? (
                <div className="space-y-4">
                  {analyticsData.interactions
                    .filter(i => i.citations && i.citations.length > 0)
                    .map((interaction, i) => (
                      <Card key={i} className="bg-gray-800/50">
                        <CardHeader className="py-3">
                          <CardTitle className="text-sm font-medium">
                            {new Date(interaction.timestamp).toLocaleString()}
                          </CardTitle>
                          <CardDescription className="truncate">
                            Query: {interaction.input}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {interaction.citations?.map((citation, j) => (
                              <div key={j} className="flex justify-between items-center p-2 bg-gray-900 rounded">
                                <span className="truncate mr-2">{citation.title}</span>
                                <a 
                                  href={citation.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 flex items-center"
                                >
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  View Source
                                </a>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <div className="text-center p-6 text-gray-500">
                  No citations found in any responses
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 