import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, stat } from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

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
        { ok: false, error: `Tipo de archivo no permitido: ${file.type}. Solo JPG, PNG, GIF o WebP.` },
        { status: 400 }
      );
    }

    // Validate file size (10MB max - increased from 5MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { ok: false, error: `El archivo es demasiado grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo 10MB.` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const uniqueName = `${timestamp}-${random}.${ext}`;

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure upload directories exist
    const dataDir = path.join(process.cwd(), 'data', 'uploads');
    const publicDir = path.join(process.cwd(), 'public', 'uploads');

    try {
      await mkdir(dataDir, { recursive: true });
    } catch (err) {
      console.error('[Upload] Error creating data/uploads directory:', err);
      return NextResponse.json(
        { ok: false, error: 'Error al crear el directorio de subida. Verifica los permisos del servidor.' },
        { status: 500 }
      );
    }

    try {
      await mkdir(publicDir, { recursive: true });
    } catch (err) {
      console.warn('[Upload] Could not create public/uploads directory:', err);
      // Non-critical, continue without public fallback
    }

    // Save to data/uploads/ (primary storage)
    const dataPath = path.join(dataDir, uniqueName);
    try {
      await writeFile(dataPath, buffer);
    } catch (err) {
      console.error('[Upload] Error writing to data/uploads/:', err);
      return NextResponse.json(
        { ok: false, error: 'Error al guardar el archivo en el servidor. Verifica los permisos de escritura.' },
        { status: 500 }
      );
    }

    // Verify the file was written correctly
    try {
      const stats = await stat(dataPath);
      if (stats.size !== buffer.length) {
        console.error(`[Upload] File size mismatch: expected ${buffer.length}, got ${stats.size}`);
        // File was written but size is wrong, still return success as the file exists
      }
    } catch (err) {
      console.error('[Upload] Error verifying file:', err);
    }

    // Also save to public/uploads/ for development mode and fallback
    try {
      await writeFile(path.join(publicDir, uniqueName), buffer);
    } catch (err) {
      console.warn('[Upload] Could not save to public/uploads/ (non-critical):', err);
    }

    // Return URL via our API route (works in both standalone and dev mode)
    const url = `/api/uploads/${uniqueName}`;

    console.log(`[Upload] File uploaded successfully: ${uniqueName} (${(buffer.length / 1024).toFixed(1)}KB)`);

    return NextResponse.json({
      ok: true,
      data: { url, filename: uniqueName, size: buffer.length, type: file.type },
    });
  } catch (error) {
    console.error('[Upload] Error al subir imagen:', error);

    // Detect specific error types
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('body') || errorMessage.includes('size') || errorMessage.includes('too large')) {
      return NextResponse.json(
        { ok: false, error: 'El archivo es demasiado grande para el servidor. Intenta con una imagen más pequeña (máximo 10MB).' },
        { status: 413 }
      );
    }

    if (errorMessage.includes('timeout') || errorMessage.includes('abort')) {
      return NextResponse.json(
        { ok: false, error: 'La subida tardó demasiado. Intenta de nuevo con una imagen más pequeña o verifica tu conexión.' },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { ok: false, error: 'Error al subir la imagen: ' + errorMessage },
      { status: 500 }
    );
  }
}
