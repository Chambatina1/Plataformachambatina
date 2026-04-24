import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, copyFile } from 'fs/promises';
import path from 'path';

// POST /api/upload - Uploads an image file to data/uploads/
// Files are served via /api/uploads/[filename] to work with standalone output mode
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

    // Save to data/uploads/ (persistent directory, works with standalone mode)
    const dataDir = path.join(process.cwd(), 'data', 'uploads');
    await mkdir(dataDir, { recursive: true });
    const dataPath = path.join(dataDir, uniqueName);
    await writeFile(dataPath, buffer);

    // Also save to public/uploads/ for development mode and fallback
    try {
      const publicDir = path.join(process.cwd(), 'public', 'uploads');
      await mkdir(publicDir, { recursive: true });
      await writeFile(path.join(publicDir, uniqueName), buffer);
    } catch {
      // public/ might be read-only in some deployments, that's fine
    }

    // Return URL via our API route (works in both standalone and dev mode)
    const url = `/api/uploads/${uniqueName}`;

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
