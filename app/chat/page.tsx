"use client"

import { useState, useEffect } from "react"
import { Mic, Send, Settings, RefreshCw, Paperclip, X, BarChart2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import ChatMessage from "@/components/chat-message"
import Image from "next/image"
import AdvancedFeedbackPanel from "@/components/AdvancedFeedbackPanel"
import { useSearchParams } from "next/navigation"
import FileUpload from "@/components/file-upload"
import FileAttachment from "@/components/file-attachment"

interface ChatEntry {
  role: "user" | "assistant"
  content: string
  id: string
  isImproving?: boolean
  stats?: {
    cosineSimilarity: number
    responseTimeMs: number
    tokensUsed: number
    promptTokens: number
    completionTokens: number
    processingTimeMs: number
  }
}

interface FeedbackItem {
  highlightedText: string
  emoji: string
  comment: string
  color: string
  aiResponses: string[]
  userResponse: string
  isConversationComplete: boolean
}

interface Persona {
  _id: string
  name: string
  description: string
  personality: string
  avatar: string
}

interface FileInfo {
  _id: string
  fileName: string
  fileType: string
  preview?: string
}

export default function ChatPage() {
  const [message, setMessage] = useState("")
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [feedbackItem, setFeedbackItem] = useState<ChatEntry | null>(null)
  const [improvingEntryId, setImprovingEntryId] = useState<string | null>(null)
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [loadingPersona, setLoadingPersona] = useState(false)
  const [isFileUploadOpen, setIsFileUploadOpen] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([])
  const [chatId, setChatId] = useState<string | null>(null)
  const [showStats, setShowStats] = useState(true)
  
  const searchParams = useSearchParams()
  const personaId = searchParams.get('personaId')
  const chatIdParam = searchParams.get('chatId')

  useEffect(() => {
    setMounted(true)
    
    // If there's a chatId in the URL, fetch that chat
    if (chatIdParam) {
      fetchChat(chatIdParam)
    }
    // Otherwise, if there's a personaId, initialize with that persona
    else if (personaId) {
      fetchPersona(personaId)
    } else {
      // Set default welcome message if no persona selected
      setChatHistory([
        {
          role: "assistant",
          content: "Hello! I'm your personalized AI assistant. How can I help you today?",
          id: Date.now().toString(),
        },
      ])
    }
    
    // Fetch any previously uploaded files
    fetchFiles()
  }, [personaId, chatIdParam])

  const fetchPersona = async (id: string) => {
    try {
      setLoadingPersona(true)
      const response = await fetch(`/api/personas/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch persona')
      }
      
      const data = await response.json()
      setSelectedPersona(data)
      
      // Set a personalized welcome message
      setChatHistory([
        {
          role: "assistant",
          content: `Hello! I'm ${data.name}. ${data.description} How can I help you today?`,
          id: Date.now().toString(),
        },
      ])
    } catch (error) {
      console.error('Error fetching persona:', error)
      // Fallback to default message
      setChatHistory([
        {
          role: "assistant",
          content: "Hello! I'm your personalized AI assistant. How can I help you today?",
          id: Date.now().toString(),
        },
      ])
    } finally {
      setLoadingPersona(false)
    }
  }
  
  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/files')
      if (!response.ok) throw new Error('Failed to fetch files')
      
      const files = await response.json()
      // For this demo, we'll show all files
      // In a real app, you might filter by chatId
      setUploadedFiles(files)
    } catch (error) {
      console.error('Error fetching files:', error)
    }
  }

  const handleFileUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (personaId) {
        formData.append('chatId', personaId)
      }
      
      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) throw new Error('Failed to upload file')
      
      const data = await response.json()
      
      // Add the new file to the list
      setUploadedFiles(prev => [
        {
          _id: data.fileId,
          fileName: data.fileName,
          fileType: file.type,
          preview: data.extractedText
        },
        ...prev
      ])
      
      // Add a system message to the chat
      setChatHistory(prev => [
        ...prev,
        {
          role: "assistant",
          content: `File "${file.name}" has been added as context. I'll use its content to inform my responses.`,
          id: Date.now().toString(),
        }
      ])
      
      // Close the uploader
      setIsFileUploadOpen(false)
      
    } catch (error) {
      console.error('Error uploading file:', error)
    }
  }
  
  const removeFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete file')
      
      // Remove from state
      setUploadedFiles(prev => prev.filter(file => file._id !== fileId))
      
      // Notify in chat
      const fileToRemove = uploadedFiles.find(file => file._id === fileId)
      if (fileToRemove) {
        setChatHistory(prev => [
          ...prev,
          {
            role: "assistant",
            content: `File "${fileToRemove.fileName}" has been removed from context.`,
            id: Date.now().toString(),
          }
        ])
      }
      
    } catch (error) {
      console.error('Error removing file:', error)
    }
  }

  const fetchChat = async (id: string) => {
    try {
      const response = await fetch(`/api/chats/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch chat')
      }
      
      const chat = await response.json()
      setChatId(chat._id)
      
      // If the chat has a persona, fetch and set it
      if (chat.personaId) {
        if (typeof chat.personaId === 'object') {
          setSelectedPersona(chat.personaId)
        } else {
          fetchPersona(chat.personaId)
        }
      }
      
      // Convert the chat messages to ChatEntry format
      const formattedHistory = chat.messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        id: msg._id || Date.now().toString(),
        stats: msg.stats,
      }))
      
      setChatHistory(formattedHistory)
    } catch (error) {
      console.error('Error fetching chat:', error)
      // Fallback to welcome message
      setChatHistory([
        {
          role: "assistant",
          content: "Hello! I'm your personalized AI assistant. How can I help you today?",
          id: Date.now().toString(),
        },
      ])
    }
  }

  if (!mounted) return null

  // Handle sending a new user message
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    const userEntry: ChatEntry = { 
      role: "user", 
      content: message, 
      id: Date.now().toString()
    }
    
    setChatHistory((prev) => [...prev, userEntry])
    setMessage("")
    
    // Check if we need to create a new chat
    if (!chatId && selectedPersona) {
      // Create a new chat
      try {
        const response = await fetch('/api/chats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personaId: selectedPersona._id,
            title: message.length > 30 ? message.substring(0, 30) + '...' : message,
            messages: [{
              role: 'user',
              content: message,
              timestamp: new Date()
            }]
          })
        })
        
        if (response.ok) {
          const newChat = await response.json()
          setChatId(newChat._id)
          await generateResponse(userEntry.content, newChat._id)
        } else {
          // If creating a chat fails, still generate response but don't save
          await generateResponse(userEntry.content)
        }
      } catch (error) {
        console.error('Error creating chat:', error)
        await generateResponse(userEntry.content)
      }
    } else if (chatId) {
      // Add message to existing chat
      try {
        const response = await fetch(`/api/chats/${chatId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role: 'user',
            content: message,
            timestamp: new Date()
          })
        })
        
        if (response.ok) {
          const updatedChat = await response.json()
          // The messages API automatically generates an AI response
          // Extract it and add to our chat history
          if (updatedChat.messages && updatedChat.messages.length > 0) {
            const aiMessage = updatedChat.messages[updatedChat.messages.length - 1]
            
            if (aiMessage && aiMessage.role === 'assistant') {
              const aiEntry: ChatEntry = {
                role: 'assistant',
                content: aiMessage.content,
                id: aiMessage._id || Date.now().toString(),
                stats: aiMessage.stats
              }
              
              setChatHistory((prev) => [...prev, aiEntry])
            }
          }
        } else {
          // If API fails, fall back to client-side generation
          await generateResponse(userEntry.content)
        }
      } catch (error) {
        console.error('Error adding message to chat:', error)
        await generateResponse(userEntry.content)
      }
    } else {
      // No persona or chat ID, just generate a response locally
      await generateResponse(userEntry.content)
    }
  }

  // Generate a response (client-side fallback if API fails)
  const generateResponse = async (userMessage: string, newChatId: string | null = null) => {
    setIsLoading(true)
    const responseStartTime = Date.now()
    
    try {
      // Collect context from files
      const fileContextPromises = uploadedFiles.map(async (file) => {
        try {
          const response = await fetch(`/api/files/${file._id}`)
          if (!response.ok) return null
          const data = await response.json()
          return {
            fileName: data.fileName,
            fileType: data.fileType,
            content: data.extractedText || '',
            id: data._id
          }
        } catch (error) {
          console.error(`Error fetching file content for ${file._id}:`, error)
          return null
        }
      })
      
      const fileContexts = await Promise.all(fileContextPromises)
      const validFileContexts = fileContexts.filter(Boolean)
      
      // Format file contexts in a structured way that's clear for the model
      const formattedContext = validFileContexts.length > 0 
        ? `CONTEXT FROM UPLOADED FILES:\n\n${validFileContexts.map(file => 
            `===== FILE: ${file.fileName} (${file.fileType}) =====\n${file.content}\n=====END OF FILE=====\n\n`
          ).join('')}`
        : '';

      const requestBody = {
        preferences: selectedPersona ? {
          personaId: selectedPersona._id,
          personaName: selectedPersona.name,
          personality: selectedPersona.personality
        } : {}, // Pass the persona information if available
        input: userMessage,
        context: formattedContext, // Add the formatted file context
        useContext: validFileContexts.length > 0 // Explicit flag to use context
      }

      console.log("Sending context to model:", formattedContext.substring(0, 200) + "..."); // Debug log

      const processingStartTime = Date.now()
      const response = await fetch("http://localhost:5000/generate-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })
      const processingEndTime = Date.now()
      const processingTimeMs = processingEndTime - processingStartTime

      const data = await response.json()
      if (data.success) {
        const responseEndTime = Date.now()
        const responseTimeMs = responseEndTime - responseStartTime
        
        // Calculate cosine similarity
        const cosineSimilarity = calculateCosineSimilarity(userMessage, data.feedback)
        
        // Estimate tokens
        const promptTokens = estimateTokens(userMessage)
        const completionTokens = estimateTokens(data.feedback)
        const totalTokens = promptTokens + completionTokens
        
        const aiEntry: ChatEntry = {
          role: "assistant",
          content: data.feedback,
          id: Date.now().toString(),
          stats: {
            cosineSimilarity,
            responseTimeMs,
            tokensUsed: totalTokens,
            promptTokens,
            completionTokens,
            processingTimeMs
          }
        }
        
        setChatHistory((prev) => [...prev, aiEntry])
        setFeedbackItem(aiEntry)
        
        // If we have a chat ID, save this response too
        if (chatId || newChatId) {
          const chatIdToUse = chatId || newChatId
          try {
            await fetch(`/api/chats/${chatIdToUse}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                messages: [
                  ...chatHistory.map(entry => ({
                    role: entry.role,
                    content: entry.content,
                    timestamp: new Date(),
                    stats: entry.stats
                  })),
                  {
                    role: 'assistant',
                    content: data.feedback,
                    timestamp: new Date(),
                    stats: {
                      cosineSimilarity,
                      responseTimeMs,
                      tokensUsed: totalTokens,
                      promptTokens,
                      completionTokens,
                      processingTimeMs
                    }
                  }
                ]
              })
            })
          } catch (error) {
            console.error('Error saving response to chat:', error)
          }
        }
      } else {
        console.error("Error from backend:", data.error)
        // Add an error message to the chat
        setChatHistory((prev) => [
          ...prev, 
          {
            role: "assistant",
            content: `I'm having trouble processing your request with the provided context. Error: ${data.error || 'Unknown error'}`,
            id: Date.now().toString(),
          }
        ])
      }
    } catch (error) {
      console.error("Fetch error:", error)
      // Add an error message to the chat
      setChatHistory((prev) => [
        ...prev, 
        {
          role: "assistant",
          content: "I'm having trouble processing your request with the provided context. Please try again later.",
          id: Date.now().toString(),
        }
      ])
    }
    setIsLoading(false)
  }

  // Helper function to calculate cosine similarity (simplified version)
  const calculateCosineSimilarity = (text1: string, text2: string): number => {
    // Convert texts to lowercase and split into words
    const words1 = text1.toLowerCase().split(/\W+/).filter(Boolean);
    const words2 = text2.toLowerCase().split(/\W+/).filter(Boolean);
    
    // Create word frequency maps
    const freqMap1: Record<string, number> = {};
    const freqMap2: Record<string, number> = {};
    
    words1.forEach(word => {
      freqMap1[word] = (freqMap1[word] || 0) + 1;
    });
    
    words2.forEach(word => {
      freqMap2[word] = (freqMap2[word] || 0) + 1;
    });
    
    // Get unique words from both texts
    const uniqueWords = new Set([...Object.keys(freqMap1), ...Object.keys(freqMap2)]);
    
    // Calculate dot product and magnitudes
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    
    uniqueWords.forEach(word => {
      const freq1 = freqMap1[word] || 0;
      const freq2 = freqMap2[word] || 0;
      
      dotProduct += freq1 * freq2;
      magnitude1 += freq1 * freq1;
      magnitude2 += freq2 * freq2;
    });
    
    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);
    
    // Avoid division by zero
    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }
    
    // Return cosine similarity
    return dotProduct / (magnitude1 * magnitude2);
  }
  
  // Helper function to estimate tokens (simplified)
  const estimateTokens = (text: string): number => {
    // A rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  // Regenerate uses the previous user message; if missing, fallback to current assistant content
  const handleRegenerate = async (entryId: string) => {
    const entryIndex = chatHistory.findIndex((entry) => entry.id === entryId)
    // If there's no previous user message, use the current assistant's content
    let userMessage = chatHistory[entryIndex - 1]?.content
    if (!userMessage || !userMessage.trim()) {
      userMessage = chatHistory[entryIndex].content
    }
    setIsLoading(true)
    try {
      // Collect context from files
      const fileContextPromises = uploadedFiles.map(async (file) => {
        try {
          const response = await fetch(`/api/files/${file._id}`)
          if (!response.ok) return null
          const data = await response.json()
          return {
            fileName: data.fileName,
            fileType: data.fileType,
            content: data.extractedText || '',
            id: data._id
          }
        } catch (error) {
          console.error(`Error fetching file content for ${file._id}:`, error)
          return null
        }
      })
      
      const fileContexts = await Promise.all(fileContextPromises)
      const validFileContexts = fileContexts.filter(Boolean)
      
      // Format file contexts in a structured way that's clear for the model
      const formattedContext = validFileContexts.length > 0 
        ? `CONTEXT FROM UPLOADED FILES:\n\n${validFileContexts.map(file => 
            `===== FILE: ${file.fileName} (${file.fileType}) =====\n${file.content}\n=====END OF FILE=====\n\n`
          ).join('')}`
        : '';
      
      const response = await fetch("http://localhost:5000/regenerate-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences: selectedPersona ? {
            personaId: selectedPersona._id,
            personaName: selectedPersona.name,
            personality: selectedPersona.personality
          } : {}, // Pass the persona information if available
          input: userMessage,
          feedback: "", // No feedback provided for a simple regeneration
          context: formattedContext, // Add the formatted file context
          useContext: validFileContexts.length > 0 // Explicit flag to use context
        }),
      })
      const data = await response.json()
      if (data.success) {
        const newAiEntry: ChatEntry = {
          role: "assistant",
          content: data.feedback,
          id: Date.now().toString(),
        }
        setChatHistory((prev) => [...prev, newAiEntry])
      } else {
        console.error("Error from backend:", data.error)
        // Add error message
        setChatHistory((prev) => [
          ...prev, 
          {
            role: "assistant",
            content: `I'm having trouble regenerating with the provided context. Error: ${data.error || 'Unknown error'}`,
            id: Date.now().toString(),
          }
        ])
      }
    } catch (error) {
      console.error("Error regenerating response:", error)
      // Add error message
      setChatHistory((prev) => [
        ...prev, 
        {
          role: "assistant",
          content: "I'm having trouble generating a response with the provided context. Please try again later.",
          id: Date.now().toString(),
        }
      ])
    }
    setIsLoading(false)
  }

  // Fine-tune simply opens the feedback panel for the selected assistant message
  const handleFineTune = (entry: ChatEntry) => {
    setFeedbackItem(entry)
  }

  // Handle submission of feedback from AdvancedFeedbackPanel
  const handleFeedbackSubmit = async (feedbackItems: FeedbackItem[]) => {
    if (!feedbackItem) return
    setIsLoading(true)

    // Combine feedback items into one string, including userResponse
    const feedbackString = feedbackItems
      .map((item) => {
        return `Annotation: ${item.highlightedText}\nComment: ${item.comment}\nUser Response: ${item.userResponse}`
      })
      .join("\n\n")

    // Fallback: use the previous user message, or if empty, use the current assistant's content
    const entryIndex = chatHistory.findIndex((entry) => entry.id === feedbackItem.id)
    let userMessage = chatHistory[entryIndex - 1]?.content
    if (!userMessage || !userMessage.trim()) {
      userMessage = feedbackItem.content
    }

    try {
      // Collect context from files
      const fileContextPromises = uploadedFiles.map(async (file) => {
        try {
          const response = await fetch(`/api/files/${file._id}`)
          if (!response.ok) return null
          const data = await response.json()
          return {
            fileName: data.fileName,
            fileType: data.fileType,
            content: data.extractedText || '',
            id: data._id
          }
        } catch (error) {
          console.error(`Error fetching file content for ${file._id}:`, error)
          return null
        }
      })
      
      const fileContexts = await Promise.all(fileContextPromises)
      const validFileContexts = fileContexts.filter(Boolean)
      
      // Format file contexts in a structured way that's clear for the model
      const formattedContext = validFileContexts.length > 0 
        ? `CONTEXT FROM UPLOADED FILES:\n\n${validFileContexts.map(file => 
            `===== FILE: ${file.fileName} (${file.fileType}) =====\n${file.content}\n=====END OF FILE=====\n\n`
          ).join('')}`
        : '';
      
      const response = await fetch("http://localhost:5000/regenerate-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences: selectedPersona ? {
            personaId: selectedPersona._id,
            personaName: selectedPersona.name,
            personality: selectedPersona.personality
          } : {}, // Pass the persona information if available
          input: userMessage,
          feedback: feedbackString,
          context: formattedContext, // Add the formatted file context
          useContext: validFileContexts.length > 0 // Explicit flag to use context
        }),
      })
      const data = await response.json()
      if (data.success) {
        const improvedResponse = data.feedback
        // Update the assistant message with the improved response
        setChatHistory((prev) =>
          prev.map((entry) =>
            entry.id === feedbackItem.id ? { ...entry, content: improvedResponse, isImproving: false } : entry
          )
        )
      } else {
        console.error("Error from backend:", data.error)
        // Add error message
        setChatHistory((prev) => [
          ...prev, 
          {
            role: "assistant",
            content: `I'm having trouble improving the response with the provided context. Error: ${data.error || 'Unknown error'}`,
            id: Date.now().toString(),
          }
        ])
      }
    } catch (error) {
      console.error("Error submitting feedback:", error)
      // Add error message
      setChatHistory((prev) => [
        ...prev, 
        {
          role: "assistant",
          content: "I'm having trouble processing your feedback with the provided context. Please try again later.",
          id: Date.now().toString(),
        }
      ])
    } finally {
      setIsLoading(false)
      setFeedbackItem(null)
    }
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className={`flex flex-col flex-grow ${feedbackItem ? "w-[60%]" : "w-full"}`}>
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
              {selectedPersona && selectedPersona.avatar ? (
                <Image 
                  src={selectedPersona.avatar} 
                  alt={`${selectedPersona.name} Avatar`} 
                  width={40} 
                  height={40} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-purple-700 flex items-center justify-center text-white">
                  {selectedPersona ? selectedPersona.name.charAt(0).toUpperCase() : (
                    <Image src="/avatar.svg" alt="AI Avatar" width={40} height={40} className="w-full h-full object-cover" />
                  )}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-semibold">
                {selectedPersona ? selectedPersona.name : "Your Personalized AI Assistant"}
              </h1>
              {selectedPersona && (
                <p className="text-xs text-gray-400">{selectedPersona.description}</p>
              )}
            </div>
          </div>
          
          {/* Stats toggle button */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-xs"
              onClick={() => setShowStats(!showStats)}
            >
              <BarChart2 className="h-4 w-4" />
              {showStats ? "Hide Stats" : "Show Stats"}
            </Button>
          </div>
        </div>

        {/* Uploaded Files Section */}
        {uploadedFiles.length > 0 && (
          <div className="p-4 border-b border-gray-800 bg-gray-900/30">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Context Files ({uploadedFiles.length})
            </h3>
            <p className="text-xs text-gray-400 mb-3">Files are being used as context for AI responses</p>
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto pr-2">
              {uploadedFiles.map(file => (
                <FileAttachment
                  key={file._id}
                  fileId={file._id}
                  fileName={file.fileName}
                  fileType={file.fileType}
                  preview={file.preview}
                  onRemove={removeFile}
                  isRemovable={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {chatHistory.map((entry) => (
            <div key={entry.id} className="space-y-2">
              <ChatMessage 
                role={entry.role} 
                content={entry.content} 
                stats={entry.stats}
                showStats={showStats}
              />
              {entry.role === "assistant" && !entry.isImproving && (
                <div className="flex space-x-2 ml-12">
                  <Button onClick={() => handleFineTune(entry)} variant="outline" size="sm" className="text-xs">
                    <Settings className="w-3 h-3 mr-1" />
                    Fine-tune
                  </Button>
                  <Button onClick={() => handleRegenerate(entry.id)} variant="outline" size="sm" className="text-xs">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Regenerate
                  </Button>
                </div>
              )}
              {entry.isImproving && <div className="ml-12 text-yellow-500">Improving response...</div>}
            </div>
          ))}
          {isLoading && (
            <div className="animate-pulse flex gap-2 text-gray-400">
              <div className="w-4 h-4 rounded-full bg-current" />
              <div className="w-4 h-4 rounded-full bg-current" />
              <div className="w-4 h-4 rounded-full bg-current" />
            </div>
          )}
        </div>

        {/* File Upload Area */}
        {isFileUploadOpen && (
          <div className="p-4 border-t border-gray-800 bg-gray-900/30">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium">Upload Files for Context</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFileUploadOpen(false)}
              >
                <X className="h-4 w-4 mr-1" />
                Close
              </Button>
            </div>
            
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mb-3">
              <p className="text-xs text-purple-200">
                <strong>How context works:</strong> Files you upload will be analyzed and their content will be used as reference 
                material for the AI. The AI will be able to read and understand the text from these files to provide more 
                informed responses to your questions.
              </p>
            </div>
            
            <FileUpload onFileUpload={handleFileUpload} />
          </div>
        )}

        {/* Chat Input */}
        <div className="p-4 border-t border-gray-800">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl py-4 pl-6 pr-24 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 text-gray-400 hover:text-white"
                onClick={() => setIsFileUploadOpen(!isFileUploadOpen)}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-gray-400 hover:text-white">
                <Mic className="h-5 w-5" />
              </Button>
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-gray-400 hover:text-white"
                disabled={!message.trim()}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Advanced Feedback Panel */}
      {feedbackItem && (
        <div className="w-[40%] border-l border-gray-700">
          <AdvancedFeedbackPanel content={feedbackItem.content} onSubmit={handleFeedbackSubmit} />
        </div>
      )}
    </div>
  )
}
