import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Chat from '@/lib/models/Chat';

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const personaId = searchParams.get('personaId');
    
    const query = personaId ? { personaId } : {};
    const chats = await Chat.find(query).sort({ updatedAt: -1 }).populate('personaId');
    
    return NextResponse.json(chats);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const chat = await Chat.create(body);
    return NextResponse.json(chat);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
  }
} 