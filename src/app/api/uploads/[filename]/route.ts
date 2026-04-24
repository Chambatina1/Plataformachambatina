import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';

// GET /api/uploads/[filename] - Serves uploaded images from data/uploads/
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Security: prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    // Only allow image extensions
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(filename).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }

    // Look in data/uploads/ first, then fallback to public/uploads/
    const dataDir = path.join(process.cwd(), 'data', 'uploads', filename);
    const publicDir = path.join(process.cwd(), 'public', 'uploads', filename);

    let filePath: string | null = null;
    try {
      await stat(dataDir);
      filePath = dataDir;
    } catch {
      // data/uploads/ not found, try public/uploads/
    }

    if (!filePath) {
      try {
        await stat(publicDir);
        filePath = publicDir;
      } catch {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
    }

    const fileBuffer = await readFile(filePath);

    // Set correct content type
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('[Uploads] Error serving file:', error);
    return NextResponse.json({ error: 'Error serving file' }, { status: 500 });
  }
}
