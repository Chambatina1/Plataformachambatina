import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { BUSINESS_CONTEXT, calcularEnvio } from '@/lib/chambatina';
import { chatCompletion, getAIConfig, isAIConfigured } from '@/lib/ai';

// Config defaults
const CONFIG_DEFAULTS: Record<string, string> = {
  direccion: '7523 Aloma Ave, Winter Park, FL 32792, Suite 112',
  telefono1: '786-942-6904',
  nombre_contacto1: 'Geo',
  telefono2: '786-784-6421',
  nombre_contacto2: 'Adriana',
  telefono3: '',
  nombre_contacto3: '',
  horario: 'Lunes a Viernes 9:00 AM - 6:00 PM',
  email: '',
  whatsapp: '',
  instagram: '',
  facebook: '',
  ai_provider: 'deepseek',
  ai_api_key: '',
  ai_model: '',
};

async function getConfig(keys: string[]): Promise<Record<string, string>> {
  try {
    const entries = await db.config.findMany({
      where: { clave: { in: keys } },
    });
    const result: Record<string, string> = {};
    for (const k of keys) {
      const entry = entries.find(e => e.clave === k);
      result[k] = entry?.valor || CONFIG_DEFAULTS[k] || '';
    }
    return result;
  } catch {
    const result: Record<string, string> = {};
    for (const k of keys) result[k] = CONFIG_DEFAULTS[k] || '';
    return result;
  }
}

// Extract structured data from user message
function extractStructuredData(mensaje: string) {
  const data: Record<string, any> = {};

  // Extract weight for price calculation
  const pesoMatch = mensaje.match(/(\d+(?:\.\d+)?)\s*(?:lb|libras|libra|pounds?|lbs?)/i);
  if (pesoMatch) {
    data.peso = parseFloat(pesoMatch[1]);
    let tipo: 'equipo' | 'recogida' | 'tiktok' = 'equipo';
    if (/recogida|domicilio|casa|home/i.test(mensaje)) tipo = 'recogida';
    else if (/tiktok|redes sociales/i.test(mensaje)) tipo = 'tiktok';
    data.calculo = calcularEnvio(data.peso, tipo);
  }

  // Extract CPK number
  const cpkMatch = mensaje.match(/CPK[-\s]?(\d+)/i);
  if (cpkMatch) data.cpk = `CPK-${cpkMatch[1]}`;

  // Extract carnet number (8-12 digits, not part of a CPK)
  const carnetMatch = mensaje.match(/(\d{8,12})/);
  if (carnetMatch && !/CPK/i.test(mensaje)) data.carnet = carnetMatch[1];

  return data;
}

// Build knowledge context from ALL active entries
async function buildKnowledgeContext(): Promise<string> {
  const entries = await db.aIKnowledge.findMany({
    where: { activa: true },
    orderBy: [{ prioridad: 'desc' }, { createdAt: 'desc' }],
  });

  if (entries.length === 0) return '';

  return entries.map((entry, i) => {
    return `[${i + 1}] Categoría: ${entry.categoria}\nPregunta frecuente: ${entry.pregunta}\nRespuesta: ${entry.respuesta}\nKeywords: ${entry.keywords.join(', ')}`;
  }).join('\n\n---\n\n');
}

// Build dynamic system prompt
async function buildSystemPrompt(structuredData: Record<string, any>): Promise<string> {
  const config = await getConfig(Object.keys(CONFIG_DEFAULTS));
  const knowledgeContext = await buildKnowledgeContext();

  let prompt = BUSINESS_CONTEXT;

  // Add current config
  prompt += `\n\nINFORMACIÓN ACTUALIZADA DE CONTACTO:
- Dirección: ${config.direccion || CONFIG_DEFAULTS.direccion}
- Teléfono 1: ${config.telefono1 || CONFIG_DEFAULTS.telefono1} (${config.nombre_contacto1 || CONFIG_DEFAULTS.nombre_contacto1})
- Teléfono 2: ${config.telefono2 || CONFIG_DEFAULTS.telefono2} (${config.nombre_contacto2 || CONFIG_DEFAULTS.nombre_contacto2})`;
  if (config.telefono3) prompt += `\n- Teléfono 3: ${config.telefono3} (${config.nombre_contacto3})`;
  if (config.whatsapp) prompt += `\n- WhatsApp: ${config.whatsapp}`;
  if (config.email) prompt += `\n- Email: ${config.email}`;
  if (config.instagram) prompt += `\n- Instagram: ${config.instagram}`;
  if (config.facebook) prompt += `\n- Facebook: ${config.facebook}`;
  if (config.horario) prompt += `\n- Horario: ${config.horario}`;

  // Add structured data context (price calculations, tracking info)
  if (structuredData.peso && structuredData.calculo) {
    const c = structuredData.calculo;
    prompt += `\n\nCÁLCULO DE PRECIO SOLICITADO POR EL USUARIO:
- Peso: ${c.peso} lb
- Tipo: ${c.tipo}
- Precio por libra: $${c.precioPorLibra.toFixed(2)}
- Subtotal: $${c.subtotal.toFixed(2)}
${c.cargoEquipo > 0 ? `- Cargo por equipo: $${c.cargoEquipo.toFixed(2)}\n` : ''}- TOTAL: $${c.total.toFixed(2)}
Fórmula: ${c.tipo === 'equipo' ? `(${c.peso} × $${c.precioPorLibra}) + $${c.cargoEquipo}` : `${c.peso} × $${c.precioPorLibra}`}
Responde con el cálculo detallado de forma natural y amable.`;
  }

  if (structuredData.cpk) {
    prompt += `\n\nINFORMACIÓN DE RASTREO SOLICITADA:
- Número CPK: ${structuredData.cpk}
Informa al usuario que puede rastrear su paquete usando el Rastreador en el menú principal con el número ${structuredData.cpk}.`;
  }

  if (structuredData.carnet) {
    prompt += `\n\nINFORMACIÓN DE RASTREO SOLICITADA:
- Número de carnet: ${structuredData.carnet}
Informa al usuario que puede buscar sus paquetes usando el Rastreador en el menú principal con el número de carnet ${structuredData.carnet}.`;
  }

  // Add knowledge base
  if (knowledgeContext) {
    prompt += `\n\nBASE DE CONOCIMIENTO DE LA EMPRESA:
La siguiente información ha sido aprendida por el administrador y DEBES usarla para responder preguntas relevantes:

${knowledgeContext}

IMPORTANTE: Usa la información anterior para responder preguntas relacionadas. Si la base de conocimiento tiene información relevante, dale prioridad y responde de forma natural, no copies textualmente.`;
  }

  // Enhanced conversational rules
  prompt += `\n\nREGLAS DE CONVERSACIÓN:
1. Responde SIEMPRE en español de forma natural y conversacional
2. Sé amable, cálido y profesional - como un amigo que trabaja en Chambatina
3. NO uses respuestas robóticas ni con demasiados emojis
4. Adapta tu respuesta al tono del usuario
5. Si te preguntan por algo que no sabes, sé honesto y sugiere contactar a la oficina
6. Para cálculos de precio, muestra la información clara y detalladamente
7. Si preguntan por rastreo, guíalos al Rastreador con el número correspondiente
8. Mantén las respuestas completas pero no excesivamente largas
9. Puedes usar formato Markdown básico (**negrita**, listas con -)
10. NUNCA inventes información que no esté en tu base de conocimiento o contexto`;

  return prompt;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mensaje, sessionId } = body;

    if (!mensaje || !sessionId) {
      return NextResponse.json({ ok: false, error: 'Mensaje y sessionId son requeridos' }, { status: 400 });
    }

    // Load AI config from database and apply it
    const aiConfig = await getConfig(['ai_provider', 'ai_api_key', 'ai_model']);
    if (aiConfig.ai_provider || aiConfig.ai_api_key) {
      const { setAIConfig } = await import('@/lib/ai');
      const configOverride: Record<string, any> = {};
      if (aiConfig.ai_provider) configOverride.provider = aiConfig.ai_provider;
      if (aiConfig.ai_api_key) configOverride.apiKey = aiConfig.ai_api_key;
      if (aiConfig.ai_model) configOverride.model = aiConfig.ai_model;
      setAIConfig(configOverride);
    }

    // Check if AI is configured
    if (!isAIConfigured()) {
      // Save a helpful message and return
      await db.chatMessage.create({
        data: { sessionId, role: 'user', content: mensaje },
      });

      const errorMsg = 'La IA no está configurada aún. El administrador necesita agregar una API key en **Config** del panel de administración.\n\nPuedes usar:\n- **DeepSeek** (recomendado, muy económico): Obtén tu key en platform.deepseek.com\n- **OpenAI** (ChatGPT): Obtén tu key en platform.openai.com\n\nMientras tanto, si necesitas información urgente, puedes llamarnos al **786-942-6904** (Geo) o **786-784-6421** (Adriana).';

      await db.chatMessage.create({
        data: { sessionId, role: 'assistant', content: errorMsg },
      });

      return NextResponse.json({ ok: true, respuesta: errorMsg });
    }

    // Save user message
    await db.chatMessage.create({
      data: { sessionId, role: 'user', content: mensaje },
    });

    // Extract structured data from message
    const structuredData = extractStructuredData(mensaje);

    // Build AI system prompt with all context
    const systemPrompt = await buildSystemPrompt(structuredData);

    // Get conversation history
    const chatHistory = await db.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...chatHistory.map(m => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    // Call AI
    let respuesta = '';
    try {
      respuesta = await chatCompletion({
        messages,
        temperature: 0.7,
      });
    } catch (aiError: any) {
      console.error('[Chat AI] Error:', aiError.message);

      // Fallback: use structured data if available
      if (structuredData.peso && structuredData.calculo) {
        const c = structuredData.calculo;
        respuesta = `**Cálculo de envío:**\n\n- Peso: ${c.peso} lb\n- Tipo: ${c.tipo}\n- Total: **$${c.total.toFixed(2)}**\n\n¿Necesitas más información? Llámanos al **786-942-6904** (Geo) o **786-784-6421** (Adriana).`;
      } else if (aiError.message.includes('SALDO_INSUFICIENTE')) {
        respuesta = `Lo siento, el servicio de IA está temporalmente no disponible por un problema de saldo. El administrador ya fue notificado para recargar la cuenta.\n\nSi necesitas información urgente, puedes llamarnos al **786-942-6904** (Geo) o **786-784-6421** (Adriana).`;
      } else {
        respuesta = `Lo siento, tuve un problema temporal. Por favor intenta de nuevo en unos segundos.\n\nSi necesitas información urgente, puedes llamarnos al **786-942-6904** (Geo) o **786-784-6421** (Adriana).`;
      }
    }

    // Save assistant response
    await db.chatMessage.create({
      data: { sessionId, role: 'assistant', content: respuesta },
    });

    return NextResponse.json({ ok: true, respuesta });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ ok: false, error: 'Error en el chat' }, { status: 500 });
  }
}
