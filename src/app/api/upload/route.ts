import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// POST /api/upload - Uploads an image file to public/uploads/
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { ok: false, error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { ok: false, error: 'Tipo de archivo no permitido. Solo JPG, PNG, GIF o WebP.' },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { ok: false, error: 'El archivo es demasiado grande. Máximo 5MB.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop() || 'jpg';
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    // Write file
    const filePath = path.join(uploadsDir, uniqueName);
    await writeFile(filePath, buffer);

    // Return the public URL
    const url = `/uploads/${uniqueName}`;

    return NextResponse.json({
      ok: true,
      data: { url, filename: uniqueName },
    });
  } catch (error) {
    console.error('[Upload] Error al subir imagen:', error);
    return NextResponse.json(
      { ok: false, error: 'Error al subir la imagen' },
      { status: 500 }
    );
  }
}
