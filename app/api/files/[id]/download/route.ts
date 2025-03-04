import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import File from '@/lib/models/File';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const file = await File.findById(params.id);
    
    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // For a real implementation, you'd handle serving the actual file content
    // Here, we'll just serve the text content for simplicity
    
    // For text-based files
    const textContent = file.extractedText || 'No content available';
    
    // Set appropriate headers based on file type
    let headers = {
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="${file.fileName}"`,
    };
    
    if (file.fileType.includes('pdf')) {
      headers['Content-Type'] = 'application/pdf';
    } else if (file.fileType.includes('docx')) {
      headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
    
    // In a real implementation, we'd return the actual file content
    // For this demo, we'll just return the extracted text
    return new NextResponse(textContent, {
      status: 200,
      headers: headers
    });
  } catch (error) {
    console.error('Error fetching file for download:', error);
    return NextResponse.json(
      { error: 'Failed to fetch file' },
      { status: 500 }
    );
  }
} 