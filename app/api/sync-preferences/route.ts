import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Persona from '@/lib/models/Persona';

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    
    const { personaName, selectedTones, deliveryStyle, additionalRequirements } = body;
    
    if (!personaName) {
      return NextResponse.json({ error: 'Persona name is required' }, { status: 400 });
    }

    // Check if a persona with this name already exists
    let persona = await Persona.findOne({ name: personaName });
    
    // Generate a description based on the preferences
    const toneDescription = selectedTones.length > 0 
      ? `Uses ${selectedTones.join(', ')} tones.` 
      : 'No specific tones selected.';
    
    const styleDescription = deliveryStyle 
      ? `Prefers ${deliveryStyle} style delivery.` 
      : 'No specific delivery style.';
    
    const description = `${toneDescription} ${styleDescription}`;

    // Generate a personality description
    const personality = additionalRequirements || 'Standard AI assistant personality.';

    if (persona) {
      // Update existing persona
      persona.description = description;
      persona.personality = personality;
      persona.updatedAt = new Date();
      await persona.save();
    } else {
      // Create a new persona
      persona = await Persona.create({
        name: personaName,
        description,
        personality,
        avatar: '/default-avatar.png',
      });
    }

    return NextResponse.json(persona);
  } catch (error) {
    console.error('Error syncing preferences:', error);
    return NextResponse.json({ error: 'Failed to sync preferences' }, { status: 500 });
  }
} 