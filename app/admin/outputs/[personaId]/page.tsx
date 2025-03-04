'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from 'next/link';

interface Message {
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface Chat {
  _id: string;
  title: string;
  messages: Message[];
  personaId: string;
  createdAt: string;
}

interface Persona {
  _id: string;
  name: string;
  description: string;
}

interface OutputAnalysis {
  userInput: string;
  aiOutput: string;
  similarity: number;
  timestamp: string;
  chatId: string;
}

export default function PersonaOutputsPage() {
  const params = useParams();
  const personaId = params.personaId as string;
  const [persona, setPersona] = useState<Persona | null>(null);
  const [outputs, setOutputs] = useState<OutputAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  useEffect(() => {
    fetchPersona();
    fetchOutputs();
  }, [personaId]);

  const fetchPersona = async () => {
    try {
      const response = await fetch(`/api/personas/${personaId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch persona');
      }
      const data = await response.json();
      setPersona(data);
    } catch (error) {
      console.error('Error fetching persona:', error);
    }
  };

  const fetchOutputs = async () => {
    try {
      setLoading(true);
      // Fetch all chats for this persona
      const chatsResponse = await fetch(`/api/chats?personaId=${personaId}`);
      if (!chatsResponse.ok) {
        throw new Error('Failed to fetch chats');
      }
      
      const chats: Chat[] = await chatsResponse.json();
      
      // Extract user-assistant message pairs with similarity
      const outputAnalytics: OutputAnalysis[] = [];
      
      chats.forEach(chat => {
        for (let i = 0; i < chat.messages.length - 1; i++) {
          const currentMsg = chat.messages[i];
          const nextMsg = chat.messages[i + 1];
          
          if (currentMsg.role === 'user' && nextMsg.role === 'assistant') {
            // Fetch similarity from API
            outputAnalytics.push({
              userInput: currentMsg.content,
              aiOutput: nextMsg.content,
              similarity: 0, // Will be populated below
              timestamp: new Date(nextMsg.timestamp).toISOString(),
              chatId: chat._id
            });
          }
        }
      });
      
      // Batch fetch similarity scores
      if (outputAnalytics.length > 0) {
        const similarityResponse = await fetch('/api/cosine-similarity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pairs: outputAnalytics.map(output => ({
              text1: output.userInput,
              text2: output.aiOutput
            }))
          })
        });
        
        if (similarityResponse.ok) {
          const similarities = await similarityResponse.json();
          
          // Update output analytics with similarities
          similarities.forEach((similarity: number, index: number) => {
            if (index < outputAnalytics.length) {
              outputAnalytics[index].similarity = similarity;
            }
          });
        }
      }
      
      // Sort by timestamp (newest first)
      outputAnalytics.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setOutputs(outputAnalytics);
    } catch (error) {
      console.error('Error fetching outputs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOutputs = outputs.filter(output => {
    if (filter === 'all') return true;
    if (filter === 'high') return output.similarity >= 0.7;
    if (filter === 'medium') return output.similarity >= 0.4 && output.similarity < 0.7;
    if (filter === 'low') return output.similarity < 0.4;
    return true;
  });

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.7) return 'bg-green-500/20 text-green-300';
    if (similarity >= 0.4) return 'bg-yellow-500/20 text-yellow-300';
    return 'bg-red-500/20 text-red-300';
  };

  const getSimilarityLabel = (similarity: number) => {
    if (similarity >= 0.7) return 'High Similarity';
    if (similarity >= 0.4) return 'Medium Similarity';
    return 'Low Similarity';
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-indigo-600 bg-clip-text text-transparent">
            {persona ? persona.name : 'AI Persona'} Outputs
          </h1>
        </div>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Output Similarity Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 mb-4">
            {persona?.description || ''}
          </p>
          
          <div className="flex gap-2 mb-6">
            <Button 
              variant={filter === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('all')}
            >
              All ({outputs.length})
            </Button>
            <Button 
              variant={filter === 'high' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('high')}
              className="bg-green-500/20 text-green-300 hover:text-green-200 border-green-800"
            >
              High Similarity ({outputs.filter(o => o.similarity >= 0.7).length})
            </Button>
            <Button 
              variant={filter === 'medium' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('medium')}
              className="bg-yellow-500/20 text-yellow-300 hover:text-yellow-200 border-yellow-800"
            >
              Medium Similarity ({outputs.filter(o => o.similarity >= 0.4 && o.similarity < 0.7).length})
            </Button>
            <Button 
              variant={filter === 'low' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('low')}
              className="bg-red-500/20 text-red-300 hover:text-red-200 border-red-800"
            >
              Low Similarity ({outputs.filter(o => o.similarity < 0.4).length})
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-pulse text-lg">Loading outputs...</div>
        </div>
      ) : filteredOutputs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-400">No outputs available for this persona yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredOutputs.map((output, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <Badge className={getSimilarityColor(output.similarity)}>
                    {getSimilarityLabel(output.similarity)} ({(output.similarity * 100).toFixed(0)}%)
                  </Badge>
                  <span className="text-xs text-gray-400">
                    {new Date(output.timestamp).toLocaleString()}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-400 mb-2">User Input</h3>
                    <ScrollArea className="max-h-36">
                      <p className="text-sm whitespace-pre-wrap">{output.userInput}</p>
                    </ScrollArea>
                  </div>
                  
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-400 mb-2">AI Output</h3>
                    <ScrollArea className="max-h-48">
                      <p className="text-sm whitespace-pre-wrap">{output.aiOutput}</p>
                    </ScrollArea>
                  </div>
                  
                  <div className="flex justify-end">
                    <Link href={`/admin/chat/${personaId}?chatId=${output.chatId}`}>
                      <Button variant="ghost" size="sm">
                        View in Chat
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 