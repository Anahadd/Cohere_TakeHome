import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Persona from '@/lib/models/Persona';

export async function GET() {
  try {
    await connectDB();
    const personas = await Persona.find({}).sort({ createdAt: -1 });
    return NextResponse.json(personas);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch personas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const persona = await Persona.create(body);
    return NextResponse.json(persona);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create persona' }, { status: 500 });
  }
} 