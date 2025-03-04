import { NextResponse } from 'next/server';

interface TextPair {
  text1: string;
  text2: string;
}

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pairs } = body as { pairs: TextPair[] };
    
    if (!Array.isArray(pairs)) {
      return NextResponse.json({ error: 'Pairs must be an array' }, { status: 400 });
    }
    
    const similarities = pairs.map(pair => {
      return calculateCosineSimilarity(pair.text1, pair.text2);
    });
    
    return NextResponse.json(similarities);
  } catch (error) {
    console.error('Error calculating cosine similarities:', error);
    return NextResponse.json({ error: 'Failed to calculate cosine similarities' }, { status: 500 });
  }
} 