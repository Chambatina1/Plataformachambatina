import { NextRequest, NextResponse } from 'next/server';

// POST /api/upload - Converts uploaded image to base64 data URL
// Works on Vercel (serverless) since it doesn't use the filesystem
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
        { ok: false, error: `Tipo no permitido: ${file.type}. Solo JPG, PNG, GIF o WebP.` },
        { status: 400 }
      );
    }

    // Validate file size (4MB max on Vercel Hobby, safe limit)
    const maxSize = 4 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { ok: false, error: `Imagen demasiado grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo 4MB.` },
        { status: 400 }
      );
    }

    // Convert file to base64 data URL
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    console.log(`[Upload] Image converted to base64: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);

    return NextResponse.json({
      ok: true,
      data: {
        url: dataUrl,
        filename: file.name,
        size: file.size,
        type: file.type,
      },
    });
  } catch (error) {
    console.error('[Upload] Error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('body') || errorMessage.includes('size') || errorMessage.includes('too large')) {
      return NextResponse.json(
        { ok: false, error: 'Imagen demasiado grande para el servidor. Usa una imagen más pequeña (máximo 4MB).' },
        { status: 413 }
      );
    }

    return NextResponse.json(
      { ok: false, error: 'Error al subir la imagen: ' + errorMessage },
      { status: 500 }
    );
  }
}
