import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chatCompletion, isAIConfigured, getAIConfig, setAIConfig } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, categoria = 'articulo' } = body;

    if (!url) {
      return NextResponse.json({ ok: false, error: 'URL es requerida' }, { status: 400 });
    }

    // Load AI config from database
    try {
      const configs = await db.config.findMany({
        where: { clave: { in: ['ai_provider', 'ai_api_key', 'ai_model'] } },
      });
      const configMap: Record<string, string> = {};
      for (const c of configs) configMap[c.clave] = c.valor;
      if (configMap.ai_provider || configMap.ai_api_key) {
        const override: Record<string, any> = {};
        if (configMap.ai_provider) override.provider = configMap.ai_provider;
        if (configMap.ai_api_key) override.apiKey = configMap.ai_api_key;
        if (configMap.ai_model) override.model = configMap.ai_model;
        setAIConfig(override);
      }
    } catch { /* ignore */ }

    if (!isAIConfigured()) {
      return NextResponse.json(
        { ok: false, error: 'La IA no está configurada. Agrega una API key de DeepSeek u OpenAI en Config.' },
        { status: 400 }
      );
    }

    // Fetch the URL content
    let html = '';
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ChambatinaBot/1.0)' },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      html = await response.text();
    } catch (fetchError: any) {
      return NextResponse.json({ ok: false, error: `No se pudo acceder a la URL: ${fetchError.message}` }, { status: 400 });
    }

    // Extract text content from HTML (basic extraction)
    const textContent = extractTextFromHTML(html, url);

    if (!textContent || textContent.length < 50) {
      return NextResponse.json({ ok: false, error: 'No se pudo extraer contenido útil de la URL' }, { status: 400 });
    }

    // Use AI to generate knowledge entries from the content
    const knowledgeEntries = await generateKnowledgeFromContent(textContent, url, categoria);

    // Save to database
    const created = [];
    for (const entry of knowledgeEntries) {
      const saved = await db.aIKnowledge.create({ data: entry });
      created.push(saved);
    }

    return NextResponse.json({
      ok: true,
      data: {
        url,
        entriesCreated: created.length,
        entries: created,
      },
    });
  } catch (error: any) {
    console.error('[AI Scrape] Error:', error);
    return NextResponse.json({ ok: false, error: error.message || 'Error al procesar la URL' }, { status: 500 });
  }
}

function extractTextFromHTML(html: string, _url: string): string {
  // Remove script and style tags
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
  text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');

  // Convert br and block elements to newlines
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<\/li>/gi, '\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&nbsp;/g, ' ');

  // Normalize whitespace
  text = text.replace(/\t/g, ' ');
  text = text.replace(/  +/g, ' ');
  text = text.replace(/\n /g, '\n');
  text = text.replace(/ \n/g, '\n');

  // Split into lines, filter empty ones
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 20);

  return lines.join('\n');
}

async function generateKnowledgeFromContent(content: string, sourceUrl: string, categoria: string) {
  const aiResponse = await chatCompletion({
    messages: [
      {
        role: 'system',
        content: `Eres un asistente que extrae información útil de contenido web para una empresa de logística llamada Chambatina.
Tu trabajo es leer el contenido y crear entradas de conocimiento (pregunta-respuesta) útiles.

REGLAS:
1. Crea entre 3 y 8 entradas de pregunta-respuesta
2. Las preguntas deben ser lo que un cliente preguntaría naturalmente
3. Las respuestas deben ser informativas y útiles
4. Cada entrada debe tener keywords relevantes
5. Las keywords deben estar en español
6. Si el contenido no es relevante para Chambatina, crea entradas de información general útil
7. Incluye la fuente (URL) en las respuestas cuando sea relevante

Responde SOLO en formato JSON array, sin markdown, sin texto adicional. Cada objeto debe tener:
{"pregunta": "...", "respuesta": "...", "keywords": ["...", "..."], "prioridad": 5}`
      },
      {
        role: 'user',
        content: `Fuente: ${sourceUrl}\n\nContenido:\n${content.substring(0, 8000)}`
      }
    ],
    temperature: 0.3,
  });

  try {
    // Try to parse JSON from response
    let jsonStr = aiResponse.trim();
    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const entries = JSON.parse(jsonStr);
    if (!Array.isArray(entries)) throw new Error('Not an array');

    return entries.map((e: any) => ({
      categoria,
      pregunta: String(e.pregunta || '').substring(0, 1000),
      respuesta: String(e.respuesta || '').substring(0, 5000),
      keywords: Array.isArray(e.keywords) ? e.keywords.map((k: any) => String(k).substring(0, 100)) : [],
      activa: true,
      prioridad: typeof e.prioridad === 'number' ? Math.min(Math.max(e.prioridad, 0), 10) : 5,
    }));
  } catch {
    // Fallback: create a single entry with the content summary
    return [{
      categoria,
      pregunta: `Información de ${new URL(sourceUrl).hostname}`,
      respuesta: content.substring(0, 2000),
      keywords: extractKeywords(content),
      activa: true,
      prioridad: 3,
    }];
  }
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'en', 'con', 'por', 'para', 'que', 'es', 'son', 'ser', 'estar', 'hay', 'como', 'donde', 'cuando', 'y', 'a', 'no', 'se', 'al', 'lo', 'este', 'esta', 'su', 'más', 'pero', 'todo', 'sobre', 'entre', 'hasta', 'desde', 'hacia', 'sin', 'también', 'puede', 'tiene', 'fue', 'ha', 'han', 'o', 'ni']);
  return text.toLowerCase()
    .replace(/[^a-záéíóúñü\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w))
    .slice(0, 10);
}
