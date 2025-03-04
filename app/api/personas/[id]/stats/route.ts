import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Persona from '@/lib/models/Persona';
import Chat from '@/lib/models/Chat';

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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    // Check if persona exists
    const persona = await Persona.findById(params.id);
    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }
    
    // Fetch all chats for this persona
    const chats = await Chat.find({ personaId: params.id });
    
    // Calculate statistics
    const totalChats = chats.length;
    let totalMessages = 0;
    let cosineSimilaritySum = 0;
    let cosineSimilarityCount = 0;
    let totalResponseTime = 0;
    let responseTimeCount = 0;
    let lastActive = persona.updatedAt || new Date();
    
    // Process messages for statistics
    chats.forEach(chat => {
      totalMessages += chat.messages.length;
      
      if (chat.updatedAt && new Date(chat.updatedAt) > new Date(lastActive)) {
        lastActive = chat.updatedAt;
      }
      
      // Calculate response times and cosine similarities between user messages and AI responses
      if (chat.messages.length >= 2) {
        for (let i = 0; i < chat.messages.length - 1; i++) {
          const currentMsg = chat.messages[i];
          const nextMsg = chat.messages[i + 1];
          
          // If current is user and next is assistant, calculate response time
          if (currentMsg.role === 'user' && nextMsg.role === 'assistant') {
            const currentTime = new Date(currentMsg.timestamp).getTime();
            const nextTime = new Date(nextMsg.timestamp).getTime();
            const responseTime = nextTime - currentTime;
            
            if (responseTime > 0) {
              totalResponseTime += responseTime;
              responseTimeCount++;
            }
            
            // Calculate cosine similarity
            const similarity = calculateCosineSimilarity(currentMsg.content, nextMsg.content);
            cosineSimilaritySum += similarity;
            cosineSimilarityCount++;
          }
        }
      }
    });
    
    // Calculate averages
    const avgCosineSimilarity = cosineSimilarityCount > 0 ? cosineSimilaritySum / cosineSimilarityCount : 0;
    const avgResponseTime = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0;
    
    // Return statistics
    return NextResponse.json({
      totalChats,
      totalMessages,
      avgCosineSimilarity,
      avgResponseTime,
      lastActive
    });
  } catch (error) {
    console.error('Error fetching persona statistics:', error);
    return NextResponse.json({ error: 'Failed to fetch persona statistics' }, { status: 500 });
  }
} 