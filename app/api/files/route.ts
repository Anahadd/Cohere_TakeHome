import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import File from '@/lib/models/File';

// Helper to extract text from various file types
const extractTextFromFile = async (fileBuffer: Buffer, fileType: string, fileName: string): Promise<string> => {
  try {
    // For text files
    if (fileType.includes('text/plain') || fileName.endsWith('.txt')) {
      return Buffer.from(fileBuffer).toString('utf-8');
    }
    
    // For markdown files
    if (fileType.includes('text/markdown') || fileName.endsWith('.md')) {
      return Buffer.from(fileBuffer).toString('utf-8');
    }
    
    // For JSON files
    if (fileType.includes('application/json') || fileName.endsWith('.json')) {
      const jsonContent = Buffer.from(fileBuffer).toString('utf-8');
      try {
        // Try to format it nicely
        const parsed = JSON.parse(jsonContent);
        return JSON.stringify(parsed, null, 2);
      } catch {
        // If parsing fails, return as is
        return jsonContent;
      }
    }
    
    // For CSV files
    if (fileType.includes('text/csv') || fileName.endsWith('.csv')) {
      return Buffer.from(fileBuffer).toString('utf-8');
    }
    
    // For PDF files (in real implementation, you would use a PDF parsing library)
    if (fileType.includes('application/pdf') || fileName.endsWith('.pdf')) {
      // Simulate PDF extraction with a placeholder
      return `[Content extracted from PDF file: ${fileName}]\n\nThis is a simulated extraction of PDF content. In a real implementation, a library like pdf-parse would be used to extract actual text content from the PDF document.`;
    }
    
    // For docx files (in real implementation, you would use a DOCX parsing library)
    if (fileType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') || 
        fileName.endsWith('.docx')) {
      // Simulate DOCX extraction
      return `[Content extracted from DOCX file: ${fileName}]\n\nThis is a simulated extraction of DOCX content. In a real implementation, a library like mammoth or docx-parser would be used to extract actual text content from the document.`;
    }
    
    // For HTML files
    if (fileType.includes('text/html') || fileName.endsWith('.html') || fileName.endsWith('.htm')) {
      // In a real implementation, you might use a library to strip HTML tags
      return Buffer.from(fileBuffer).toString('utf-8');
    }

    // For JavaScript/TypeScript files
    if (fileType.includes('text/javascript') || 
        fileName.endsWith('.js') || 
        fileName.endsWith('.ts') ||
        fileName.endsWith('.jsx') ||
        fileName.endsWith('.tsx')) {
      return Buffer.from(fileBuffer).toString('utf-8');
    }
    
    // Default case for other file types
    return `[File content from ${fileName} (${fileType})]\n\nThis file type doesn't support direct text extraction in this demo. In a production environment, specialized libraries would be used to extract content from this file type.`;
  } catch (error) {
    console.error('Error extracting text from file:', error);
    return `Error extracting text from ${fileName}: ${error.message}`;
  }
};

export async function POST(request: Request) {
  try {
    await connectDB();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const chatId = formData.get('chatId') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    
    // Convert file to buffer for processing
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Extract text from the file
    const extractedText = await extractTextFromFile(buffer, file.type, file.name);
    
    // For demo purposes, we'll store the text directly in the DB
    // In production, you might want to store files in a storage service
    const fileModel = await File.create({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      content: buffer.toString('base64').substring(0, 1000), // Limited for demo
      extractedText,
      chatId: chatId || undefined
    });
    
    return NextResponse.json({ 
      fileId: fileModel._id,
      fileName: fileModel.fileName,
      extractedText: extractedText.substring(0, 200) + '...' // Preview
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const files = await File.find({}).sort({ uploadedAt: -1 });
    
    // Return simplified list without full content
    const fileList = files.map(file => ({
      _id: file._id,
      fileName: file.fileName,
      fileType: file.fileType,
      fileSize: file.fileSize,
      uploadedAt: file.uploadedAt,
      chatId: file.chatId
    }));
    
    return NextResponse.json(fileList);
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
  }
} 