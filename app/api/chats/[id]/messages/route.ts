import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Chat from '@/lib/models/Chat';
import Persona from '@/lib/models/Persona';

// Function to calculate cosine similarity between two strings
function calculateCosineSimilarity(text1: string, text2: string): number {
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

// Function to estimate tokens (simplified version)
function estimateTokens(text: string): number {
  // A rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const message = await request.json();
    const userMessageTimestamp = new Date();
    
    // Add timestamp if not provided
    if (!message.timestamp) {
      message.timestamp = userMessageTimestamp;
    }
    
    // Get the chat and include the persona reference
    const chat = await Chat.findById(params.id);
    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    // Add the user's message
    chat.messages.push(message);

    // Get the persona details for a more personalized response
    const persona = await Persona.findById(chat.personaId);
    if (!persona) {
      return NextResponse.json(
        { error: 'Persona not found' },
        { status: 404 }
      );
    }

    // Start timing the response generation
    const startTime = Date.now();

    // Generate a personalized AI response based on persona characteristics
    let responseContent = '';
    const userMessage = message.content.toLowerCase();
    
    // Simple persona-based response generation
    if (userMessage.includes('hello') || userMessage.includes('hi')) {
      responseContent = `Hello! I'm ${persona.name}. ${persona.personality.split('.')[0]}. How can I assist you today?`;
    } else if (userMessage.includes('who are you') || userMessage.includes('tell me about yourself')) {
      responseContent = `I'm ${persona.name}. ${persona.description} ${persona.personality}`;
    } else if (userMessage.includes('thank')) {
      responseContent = `You're welcome! Happy to help. Is there anything else you'd like to discuss?`;
    } else if (userMessage.includes('bye') || userMessage.includes('goodbye')) {
      responseContent = `Goodbye! Feel free to chat again whenever you'd like.`;
    } else {
      // Default response with persona's personality reflected
      responseContent = `As ${persona.name}, I'd like to respond to that. ${persona.personality.split('.')[0]}. Based on your message, I think we could explore this topic further. What specific aspects would you like to know more about?`;
    }

    // End timing the response generation
    const endTime = Date.now();
    const processingTimeMs = endTime - startTime;
    
    // Calculate response time (from user message timestamp to now)
    const responseTimeMs = endTime - new Date(message.timestamp).getTime();
    
    // Calculate cosine similarity
    const cosineSimilarity = calculateCosineSimilarity(message.content, responseContent);
    
    // Estimate tokens
    const promptTokens = estimateTokens(message.content);
    const completionTokens = estimateTokens(responseContent);
    const totalTokens = promptTokens + completionTokens;

    // Create a more structured AI response with statistics
    const aiResponse = {
      content: responseContent,
      role: 'assistant',
      timestamp: new Date(),
      stats: {
        cosineSimilarity,
        responseTimeMs,
        tokensUsed: totalTokens,
        promptTokens,
        completionTokens,
        processingTimeMs
      }
    };
    
    chat.messages.push(aiResponse);

    // Update the chat title if it's the first message
    if (chat.messages.length === 2) {
      // Use first 30 chars of user message as chat title
      chat.title = message.content.length > 30 
        ? message.content.slice(0, 30) + '...'
        : message.content;
    }

    // Update chat statistics
    chat.totalMessages = chat.messages.length;
    
    // Calculate average cosine similarity for the chat
    const assistantMessages = chat.messages.filter(m => 
      m.role === 'assistant' && m.stats && m.stats.cosineSimilarity !== null
    );
    
    if (assistantMessages.length > 0) {
      const totalCosineSimilarity = assistantMessages.reduce(
        (sum, msg) => sum + (msg.stats.cosineSimilarity || 0), 0
      );
      chat.avgCosineSimilarity = totalCosineSimilarity / assistantMessages.length;
      
      const totalResponseTime = assistantMessages.reduce(
        (sum, msg) => sum + (msg.stats.responseTimeMs || 0), 0
      );
      chat.avgResponseTimeMs = totalResponseTime / assistantMessages.length;
    }

    // Update timestamps for sorting
    chat.updatedAt = new Date();
    
    // Save to MongoDB
    await chat.save();
    
    return NextResponse.json(chat);
  } catch (error) {
    console.error('Error adding message:', error);
    return NextResponse.json(
      { error: 'Failed to add message' },
      { status: 500 }
    );
  }
} 