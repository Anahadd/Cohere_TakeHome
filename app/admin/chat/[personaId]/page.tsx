'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Loader2 } from "lucide-react";
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
  updatedAt: string;
}

interface Persona {
  _id: string;
  name: string;
  description: string;
  personality: string;
  avatar: string;
}

export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const personaId = params.personaId as string;
  const chatIdFromUrl = searchParams.get('chatId');
  
  const [message, setMessage] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (personaId) {
      fetchPersona();
      fetchChats();
    }
  }, [personaId]);

  useEffect(() => {
    // Scroll to bottom of messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat?.messages]);

  // Set current chat when chats are loaded or chatId is provided in URL
  useEffect(() => {
    if (chats.length > 0) {
      // If there's a chatId in the URL, try to find that chat
      if (chatIdFromUrl) {
        const foundChat = chats.find(chat => chat._id === chatIdFromUrl);
        if (foundChat) {
          setCurrentChat(foundChat);
          return;
        }
      }
      
      // Otherwise, select the most recent chat or create a new one if none exist
      if (!currentChat) {
        // Sort by updated date
        const sortedChats = [...chats].sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        setCurrentChat(sortedChats[0]);
      }
    } else if (chats.length === 0 && !loading) {
      // If no chats exist and we're done loading, create a new chat
      createNewChat();
    }
  }, [chats, chatIdFromUrl, loading]);

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

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/chats?personaId=${personaId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }
      const data = await response.json();
      setChats(data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewChat = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personaId,
          title: 'New Chat',
          messages: [],
        }),
      });
      
      if (response.ok) {
        const newChat = await response.json();
        setChats(prev => [newChat, ...prev]);
        setCurrentChat(newChat);
        // Update URL to include this chat ID
        router.push(`/admin/chat/${personaId}?chatId=${newChat._id}`);
      }
    } catch (error) {
      console.error('Error creating chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentChat || sending) return;

    const userMessage = message;
    setMessage(''); // Clear input right away for better UX
    setSending(true);

    try {
      const newMessage: Message = {
        content: userMessage,
        role: 'user',
        timestamp: new Date(),
      };

      const response = await fetch(`/api/chats/${currentChat._id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMessage),
      });

      if (response.ok) {
        const updatedChat = await response.json();
        setCurrentChat(updatedChat);
        // Update chat in the list
        setChats(prev => prev.map(chat => 
          chat._id === updatedChat._id ? updatedChat : chat
        ));
        
        // Update URL to include this chat ID
        if (!chatIdFromUrl || chatIdFromUrl !== currentChat._id) {
          router.push(`/admin/chat/${personaId}?chatId=${currentChat._id}`);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleChatSelect = (chat: Chat) => {
    setCurrentChat(chat);
    router.push(`/admin/chat/${personaId}?chatId=${chat._id}`);
  };

  const formatTimestamp = (timestamp: Date | string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="container mx-auto py-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          {persona && (
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-indigo-600 bg-clip-text text-transparent">
              Chat with {persona.name}
            </h1>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-6 h-[750px]">
        {/* Chat List Sidebar */}
        <Card className="col-span-1">
          <CardContent className="p-4">
            <Button
              className="w-full mb-4"
              onClick={createNewChat}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "New Chat"
              )}
            </Button>
            <ScrollArea className="h-[670px]">
              <div className="space-y-2">
                {chats.map((chat) => (
                  <div
                    key={chat._id}
                    className={`p-3 rounded-lg cursor-pointer ${
                      currentChat?._id === chat._id
                        ? 'bg-purple-900/30 border border-purple-500/30'
                        : 'hover:bg-gray-800/50 border border-transparent'
                    }`}
                    onClick={() => handleChatSelect(chat)}
                  >
                    <p className="font-medium line-clamp-1">{chat.title}</p>
                    <div className="flex justify-between items-center text-xs text-gray-400 mt-1">
                      <span>{chat.messages.length} messages</span>
                      <span>{new Date(chat.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                
                {chats.length === 0 && !loading && (
                  <div className="text-center p-6 text-gray-400">
                    No chat history found
                  </div>
                )}
                
                {loading && chats.length === 0 && (
                  <div className="flex justify-center p-6">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="col-span-3">
          <CardContent className="p-6 h-full flex flex-col">
            {persona && (
              <div className="flex items-center gap-4 mb-6 border-b border-gray-800 pb-4">
                <img
                  src={persona.avatar || '/default-avatar.png'}
                  alt={persona.name}
                  className="w-12 h-12 rounded-full bg-purple-700"
                />
                <div>
                  <h2 className="text-xl font-bold">{persona.name}</h2>
                  <p className="text-sm text-gray-400">
                    {persona.description}
                  </p>
                </div>
              </div>
            )}

            <ScrollArea className="flex-1 mb-4">
              <div className="space-y-4">
                {currentChat?.messages.length === 0 && (
                  <div className="text-center py-8 text-gray-400 italic">
                    Start a conversation with {persona?.name || 'this AI persona'}
                  </div>
                )}
                
                {currentChat?.messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-800'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-xs mt-1 opacity-70 text-right">
                        {formatTimestamp(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <form onSubmit={sendMessage} className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Message ${persona?.name || 'AI persona'}...`}
                className="flex-1"
                disabled={!currentChat || sending}
              />
              <Button 
                type="submit"
                disabled={!message.trim() || !currentChat || sending}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Send"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 