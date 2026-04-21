import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { detectarIntencion, BUSINESS_CONTEXT, calcularEnvio, BICICLETAS, CAJAS } from '@/lib/chambatina';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mensaje, sessionId } = body;

    if (!mensaje || !sessionId) {
      return NextResponse.json({ ok: false, error: 'Mensaje y sessionId son requeridos' }, { status: 400 });
    }

    // Save user message
    await db.chatMessage.create({
      data: { sessionId, role: 'user', content: mensaje },
    });

    // Detect intent
    const intent = detectarIntencion(mensaje);
    let respuesta = '';

    switch (intent.intent) {
      case 'saludo':
        respuesta = '¡Hola! 👋 Soy el asistente virtual de **Chambatina**. ¿En qué puedo ayudarte?\n\nPuedes preguntarme sobre:\n- 📦 Precios de envío\n- 🚲 Precios de bicicletas\n- 📋 Rastreo de paquetes (CPK)\n- ☀️ Sistemas solares\n- 📍 Información de contacto';
        break;

      case 'precio_peso': {
        const { peso, tipo, total, subtotal, cargoEquipo } = intent.data;
        const tipoLabel = tipo === 'recogida' ? 'recogida a domicilio' : tipo === 'tiktok' ? 'compras TikTok' : 'equipo';
        respuesta = `💰 **Cálculo de envío:**\n\n- **Peso:** ${peso} lb\n- **Tipo:** ${tipoLabel}\n- **Precio por libra:** $${intent.data.precioPorLibra.toFixed(2)}\n- **Subtotal:** $${subtotal.toFixed(2)}\n${cargoEquipo > 0 ? `- **Cargo por equipo:** $${cargoEquipo.toFixed(2)}\n` : ''}- **Total: $${total.toFixed(2)}**\n\n${tipo === 'equipo' ? 'Fórmula: (Peso × $1.99) + $25 cargo de equipo' : `Fórmula: Peso × $${intent.data.precioPorLibra.toFixed(2)}`}`;
        break;
      }

      case 'precio_bicicleta':
        respuesta = `🚲 **Precios de Bicicletas:**\n\n${intent.data.bicicletas.map((b: { descripcion: string; precio: number }) => `- **${b.descripcion}**: $${b.precio}`).join('\n')}\n\n¿Necesitas más información sobre algún tipo en particular?`;
        break;

      case 'precio_caja':
        respuesta = `📦 **Precios de Cajas:**\n\n${intent.data.cajas.map((c: { nombre: string; dimensiones: string; pesoMaximo: number; precio: number }) => `- **${c.nombre}** (${c.dimensiones}, hasta ${c.pesoMaximo} lb): $${c.precio}`).join('\n')}`;
        break;

      case 'precio_general':
        respuesta = `💰 **Lista de Precios Chambatina:**\n\n**Envíos:**\n- Por libra (equipo): **$1.99** + $25 cargo\n- Recogida a domicilio: **$2.30/lb**\n- Compras TikTok: **$1.80/lb**\n\n**Bicicletas:**\n${intent.data.bicicletas.map((b: { descripcion: string; precio: number }) => `- ${b.descripcion}: $${b.precio}`).join('\n')}\n\n**Cajas:**\n${intent.data.cajas.map((c: { nombre: string; dimensiones: string; precio: number }) => `- ${c.nombre} (${c.dimensiones}): $${c.precio}`).join('\n')}\n\n¿Quieres que calcule el precio de un envío específico? Solo dime el peso.`;
        break;

      case 'tracking_cpk':
        respuesta = `📋 Buscando el paquete **${intent.data.cpk}**...\n\nPor favor usa el **Rastreador** en el menú principal para buscar tu paquete con el número CPK para obtener información en tiempo real.`;
        break;

      case 'tracking_carnet':
        respuesta = `📋 Buscando por carnet **${intent.data.carnet}**...\n\nPor favor usa el **Rastreador** en el menú principal para buscar por número de carnet.`;
        break;

      case 'tracking_info':
        respuesta = `📋 **Rastreo de Paquetes:**\n\nPuedes rastrear tu paquete usando:\n- **Número CPK** (ejemplo: CPK-0266228)\n- **Carnet de identidad** del destinatario\n\nUsa el **Rastreador** en el menú principal para buscar. ¿Tienes tu número CPK o carnet?`;
        break;

      case 'contacto':
        respuesta = `📍 **Información de Contacto:**\n\n🏢 **Oficina:** 7523 Aloma Ave, Winter Park, FL 32792, Suite 112\n\n📞 **Teléfonos:**\n- Geo: **786-942-6904**\n- Adriana: **786-784-6421**\n\n⏰ Te recomendamos llamar para confirmar horarios de atención.`;
        break;

      case 'bicicletas':
        respuesta = `🚲 **Servicio de Envío de Bicicletas:**\n\n${BICICLETAS.map(b => `- **${b.descripcion}**: $${b.precio}`).join('\n')}\n\n¿Te interesa enviar una bicicleta?`;
        break;

      case 'solar':
        respuesta = `☀️ **Sistemas de Energía Solar:**\n\nChambatina ofrece orientación y productos de energía solar, incluyendo sistemas **EcoFlow**.\n\nPara más información sobre productos y precios, te recomendamos contactar directamente a la oficina:\n📞 **786-942-6904** (Geo)\n📞 **786-784-6421** (Adriana)`;
        break;

      default: {
        // For general chat, use AI
        try {
          const chatHistory = await db.chatMessage.findMany({
            where: { sessionId },
            orderBy: { createdAt: 'asc' },
            take: 20,
          });

          const messages = chatHistory.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }));

          const zai = await ZAI.create();
          const completion = await zai.chat.completions.create({
            messages: [
              { role: 'system', content: BUSINESS_CONTEXT },
              ...messages,
            ],
          });

          respuesta = completion.choices?.[0]?.message?.content || 'Lo siento, no pude generar una respuesta.';
        } catch (aiError) {
          console.error('AI Error:', aiError);
          respuesta = 'Lo siento, tuve un problema al procesar tu mensaje. ¿Podrías reformular tu pregunta? Si necesitas información específica sobre precios o rastreo, puedo ayudarte directamente.';
        }
        break;
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
