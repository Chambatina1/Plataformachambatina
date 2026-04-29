// ============================================================
// CHAMBATINA - Business Logic Utilities
// ============================================================

// ---- Pricing Calculator ----

export type EnvioTipo = 'equipo' | 'recogida' | 'tiktok';

export const PRECIOS_POR_LIBRA: Record<EnvioTipo, number> = {
  equipo: 1.99,
  recogida: 2.30,
  tiktok: 1.80,
};

export const CARGO_EQUIPO = 25;

export function calcularEnvio(peso: number, tipo: EnvioTipo = 'equipo') {
  const precioPorLibra = PRECIOS_POR_LIBRA[tipo];
  const subtotal = peso * precioPorLibra;
  const cargoEquipo = tipo === 'equipo' ? CARGO_EQUIPO : 0;
  const total = subtotal + cargoEquipo;
  return {
    peso,
    tipo,
    precioPorLibra,
    subtotal: Math.round(subtotal * 100) / 100,
    cargoEquipo,
    total: Math.round(total * 100) / 100,
  };
}

// ---- Bicycle Pricing ----

export interface BicicletaItem {
  tipo: string;
  descripcion: string;
  precio: number;
}

export const BICICLETAS: BicicletaItem[] = [
  { tipo: 'ninos_desarmada', descripcion: 'Bicicleta infantil desarmada', precio: 25 },
  { tipo: 'ninos_armada', descripcion: 'Bicicleta infantil armada', precio: 15 },
  { tipo: 'adulto_desarmada', descripcion: 'Bicicleta adulta desarmada', precio: 45 },
  { tipo: 'adulto_armada', descripcion: 'Bicicleta adulta armada', precio: 25 },
  { tipo: 'electrica_caja', descripcion: 'Bicicleta eléctrica en caja', precio: 35 },
  { tipo: 'electrica_sin_caja', descripcion: 'Bicicleta eléctrica sin caja', precio: 50 },
];

export function calcularBicicleta(tipo: string): BicicletaItem | undefined {
  return BICICLETAS.find(b => b.tipo === tipo);
}

// ---- Box Pricing ----

export interface CajaItem {
  nombre: string;
  dimensiones: string;
  pesoMaximo: number;
  precio: number;
}

export const CAJAS: CajaItem[] = [
  { nombre: 'Caja Pequeña', dimensiones: '12×12×12"', pesoMaximo: 60, precio: 45 },
  { nombre: 'Caja Mediana', dimensiones: '15×15×15"', pesoMaximo: 100, precio: 65 },
  { nombre: 'Caja Grande', dimensiones: '16×16×16"', pesoMaximo: 100, precio: 85 },
];

// ---- Tracking Stages (13 phases - 35 day logistics cycle) ----

export interface EtapaTracking {
  estado: string;
  diasMin: number;
  diasMax: number;
  descripcion: string;
  color: string;
  icono?: string;
  detalle?: string;
}

export const ETAPAS: EtapaTracking[] = [
  { estado: 'EN AGENCIA', diasMin: 0, diasMax: 3, descripcion: 'Tu paquete fue recibido en nuestra agencia. Estamos preparando toda la documentación (facturas, packing list, certificados) para el embarque.', color: '#f59e0b' },
  { estado: 'TRANSPORTE A NAVIERA', diasMin: 3, diasMax: 6, descripcion: 'Tu paquete viaja por tierra hacia el puerto de salida con nuestra flota trackerizada. Coordinamos la entrega prioritaria con la naviera.', color: '#3b82f6' },
  { estado: 'EN CONTENEDOR', diasMin: 6, diasMax: 8, descripcion: 'Tu paquete está siendo estibado en el contenedor con plan de carga optimizado. Se instalan sensores de humedad y temperatura para proteger tu mercancía.', color: '#6366f1' },
  { estado: 'EN TRANSITO', diasMin: 8, diasMax: 11, descripcion: 'El contenedor zarpó hacia Cuba. Recibimos actualizaciones de posición y clima para mantener un seguimiento preciso de tu envío.', color: '#0ea5e9' },
  { estado: 'EN NAVIERA', diasMin: 11, diasMax: 13, descripcion: 'El buque llegó al puerto de Cuba. Tu paquete pasa por el proceso portuario de descarga y verificación de integridad.', color: '#8b5cf6' },
  { estado: 'DESGRUPE', diasMin: 13, diasMax: 15, descripcion: 'El contenedor se está vaciando en el depósito fiscal. Cada bulto se escanea y verifica para asegurar que llega completo.', color: '#a855f7' },
  { estado: 'EN ADUANA', diasMin: 15, diasMax: 20, descripcion: 'Tu paquete está en proceso de despacho aduanero. Se realiza la revisión documental y, si aplica, inspección física para su liberación.', color: '#ec4899' },
  { estado: 'CLASIFICACION', diasMin: 20, diasMax: 22, descripcion: 'La mercancía se clasifica por provincia, urgencia y tipo de producto para preparar su distribución eficiente.', color: '#f97316' },
  { estado: 'ALMACEN CENTRAL', diasMin: 22, diasMax: 24, descripcion: 'Tu paquete está en el almacén central (La Habana). Se arman pallets por provincia y se transfiere directamente para salida rápida.', color: '#ef4444' },
  { estado: 'TRASLADO PROVINCIA', diasMin: 24, diasMax: 26, descripcion: 'Tu paquete viaja en camión hacia tu provincia. Cada vehículo tiene doble conductor para garantizar una entrega rápida y segura.', color: '#14b8a6' },
  { estado: 'ALMACEN PROVINCIAL', diasMin: 26, diasMax: 28, descripcion: 'Tu paquete llegó al almacén de tu provincia. Se registra digitalmente y se prepara para la última fase de distribución.', color: '#06b6d4' },
  { estado: 'EN DISTRIBUCION', diasMin: 28, diasMax: 35, descripcion: 'Tu paquete está en ruta de reparto hacia tu dirección final. El repartidor lo llevará directamente a tu puerta.', color: '#0d9488' },
  { estado: 'ENTREGADO', diasMin: 35, diasMax: 999, descripcion: 'Tu paquete fue entregado exitosamente. Gracias por confiar en Chambatina.', color: '#22c55e' },
];

export function estadoPorTiempo(fechaTexto: string): EtapaTracking {
  if (!fechaTexto) return ETAPAS[0];
  
  const fecha = new Date(fechaTexto);
  if (isNaN(fecha.getTime())) return ETAPAS[0];
  
  const hoy = new Date();
  const diffMs = hoy.getTime() - fecha.getTime();
  const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  // Find the stage that matches the current day range
  for (let i = 0; i < ETAPAS.length; i++) {
    if (dias >= ETAPAS[i].diasMin && dias < ETAPAS[i].diasMax) {
      return ETAPAS[i];
    }
  }
  return ETAPAS[ETAPAS.length - 1];
}

export function calcularProgreso(fechaTexto: string): { porcentaje: number; diasTranscurridos: number; diasTotales: number; etapaActual: EtapaTracking; etapaIndex: number } {
  if (!fechaTexto) return { porcentaje: 0, diasTranscurridos: 0, diasTotales: 35, etapaActual: ETAPAS[0], etapaIndex: 0 };
  
  const fecha = new Date(fechaTexto);
  if (isNaN(fecha.getTime())) return { porcentaje: 0, diasTranscurridos: 0, diasTotales: 35, etapaActual: ETAPAS[0], etapaIndex: 0 };
  
  const hoy = new Date();
  const diasTranscurridos = Math.max(0, Math.floor((hoy.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24)));
  const diasTotales = 35;
  const porcentaje = Math.min(100, Math.round((diasTranscurridos / diasTotales) * 100));
  
  const etapaActual = estadoPorTiempo(fechaTexto);
  const etapaIndex = ETAPAS.findIndex(e => e.estado === etapaActual.estado);
  
  return { porcentaje, diasTranscurridos, diasTotales, etapaActual, etapaIndex: Math.max(0, etapaIndex) };
}

export function estimarFechaEtapa(fechaRegistro: string, diasDesdeRegistro: number): string {
  if (!fechaRegistro) return '';
  const fecha = new Date(fechaRegistro);
  if (isNaN(fecha.getTime())) return '';
  fecha.setDate(fecha.getDate() + diasDesdeRegistro);
  return fecha.toLocaleDateString('es-CU', { day: 'numeric', month: 'short' });
}

// ---- TSV Parser for Tracking Data ----

export interface TrackingParsed {
  cpk: string;
  fecha: string | null;
  embarque: string;
  estado: string;
  descripcion: string | null;
  embarcador: string | null;
  consignatario: string | null;
  carnetPrincipal: string | null;
  rawData: string;
}

export function parsearTrackingTSV(texto: string): TrackingParsed[] {
  const lineas = texto.trim().split('\n').filter(line => line.trim().length > 0);
  const resultados: TrackingParsed[] = [];

  // Estado keywords - mapped to 13 logistics stages (synced with solvedcargo.ts)
  const ESTADO_KEYWORDS = [
    { regex: /ENTREGADO/i, estado: 'ENTREGADO' },
    { regex: /EN DISTRIBUCION|EN DISTRIBUCIÓN|EN DISTRIBUCION [A-Z]|REPARTO/i, estado: 'EN DISTRIBUCION' },
    { regex: /EN ALMACEN (PINAR|ARTEMISA|MAYABEQUE|MATANZAS|VILLA|CIENFUEGOS|SANCTI|CIEGO|CAMAGÜEY|CAMAGUEY|LAS TUNAS|HOLGUIN|GRANMA|SANTIAGO|GUANTANAMO)/i, estado: 'ALMACEN PROVINCIAL' },
    { regex: /ALMACEN PROVINCIAL/i, estado: 'ALMACEN PROVINCIAL' },
    { regex: /EN TRANSITO (PINAR|ARTEMISA|MAYABEQUE|MATANZAS|VILLA|CIENFUEGOS|SANCTI|CIEGO|CAMAGÜEY|CAMAGUEY|LAS TUNAS|HOLGUIN|GRANMA|SANTIAGO|GUANTANAMO)/i, estado: 'TRASLADO PROVINCIA' },
    { regex: /TRASLADO PROVINCIA|TRASLADO A PROVINCIA/i, estado: 'TRASLADO PROVINCIA' },
    { regex: /EN ALMACEN/i, estado: 'ALMACEN CENTRAL' },
    { regex: /ALMACEN CENTRAL/i, estado: 'ALMACEN CENTRAL' },
    { regex: /CLASIFICACION|CLASIFICACIÓN|CLASIFICADO/i, estado: 'CLASIFICACION' },
    { regex: /EN ESPERA DE TRANSITO|EN ESPERA DE TRÁNSITO/i, estado: 'CLASIFICACION' },
    { regex: /DESPACHADO/i, estado: 'EN ADUANA' },
    { regex: /EN ADUANA|ADUANA/i, estado: 'EN ADUANA' },
    { regex: /DESAGRUPADO|PENDIENTE DESGRUPE|DESGRUPE|DESTUFFING/i, estado: 'DESGRUPE' },
    { regex: /ARRIBO/i, estado: 'EN NAVIERA' },
    { regex: /EN NAVIERA|NAVIERA|PUERTO/i, estado: 'EN NAVIERA' },
    { regex: /EN TRANSITO|EN TRÁNSITO|RUMBO|NAVEGACION|NAVEGACIÓN/i, estado: 'EN TRANSITO' },
    { regex: /^EMBARCADO$/i, estado: 'EN TRANSITO' },
    { regex: /CONTENEDOR|ESTIBA/i, estado: 'EN CONTENEDOR' },
    { regex: /TRANSPORTE A NAVIERA|TRANSPORTE/i, estado: 'TRANSPORTE A NAVIERA' },
    { regex: /EN AGENCIA|RECIBIDO|AGENCIA/i, estado: 'EN AGENCIA' },
    { regex: /FALTANTE|PERDIDA/i, estado: 'EN AGENCIA' },
  ];

  // Helper: check if a column looks like a person name (2+ words, mostly letters)
  function looksLikeName(text: string): boolean {
    if (!text || text.length < 5) return false;
    // Names typically have 2+ words, mostly uppercase letters with spaces
    const words = text.split(/\s+/);
    if (words.length < 2) return false;
    const letterRatio = (text.replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑüÜ]/g, '').length) / text.length;
    return letterRatio > 0.7 && !/CPK/i.test(text) && !/\d{4}-\d{2}-\d{2}/.test(text);
  }

  // Helper: check if a column is an estado keyword
  function isEstadoKeyword(text: string): boolean {
    return ESTADO_KEYWORDS.some(e => e.regex.test(text));
  }

  for (const linea of lineas) {
    const columnas = linea.split('\t').map(c => c.trim()).filter(c => c.length > 0);
    if (columnas.length < 4) continue;

    let cpk = '';
    let fecha: string | null = null;
    let estado = '';
    let descripcion: string | null = null;
    let embarcador: string | null = null;
    let consignatario: string | null = null;
    let carnetPrincipal: string | null = null;

    // Find CPK number
    const cpkMatch = linea.match(/CPK[-\s]?(\d+)/i);
    if (cpkMatch) {
      cpk = `CPK-${cpkMatch[1]}`;
    } else {
      for (let i = 0; i < Math.min(columnas.length, 6); i++) {
        if (/CPK/i.test(columnas[i])) {
          const numMatch = columnas[i].match(/(\d+)/);
          cpk = numMatch ? `CPK-${numMatch[1]}` : columnas[i];
          break;
        }
      }
    }

    if (!cpk) continue;

    // Find date (YYYY-MM-DD format)
    const fechaMatch = linea.match(/(\d{4}-\d{2}-\d{2})/);
    if (fechaMatch) {
      fecha = fechaMatch[1];
    }

    // Find carnet (8-12 digit number, skip dates and phone-like numbers)
    const carnetRegex = /(?<!\d)(\d{8,12})(?!\d)/g;
    let carnetMatch: RegExpExecArray | null;
    while ((carnetMatch = carnetRegex.exec(linea)) !== null) {
      const num = carnetMatch[1];
      // Skip if it's part of a date
      if (/\d{4}-\d{2}-\d{2}/.test(carnetMatch.input.substring(Math.max(0, carnetMatch.index - 2), carnetMatch.index + num.length + 2))) continue;
      // Skip known non-carnet numbers
      if (num.startsWith('54357818')) continue;
      carnetPrincipal = num;
      break;
    }

    // Find estado from each column (not the whole line, to be more precise)
    for (const col of columnas) {
      if (isEstadoKeyword(col)) {
        for (const ek of ESTADO_KEYWORDS) {
          if (ek.regex.test(col)) {
            estado = ek.estado;
            break;
          }
        }
        break;
      }
    }
    // Fallback: check whole line if no column matched
    if (!estado) {
      for (const ek of ESTADO_KEYWORDS) {
        if (ek.regex.test(linea)) {
          estado = ek.estado;
          break;
        }
      }
    }
    if (!estado) estado = 'EN AGENCIA';

    // Find date column index to help with relative positioning
    const fechaIndex = fecha ? columnas.findIndex(c => c.includes(fecha!)) : -1;
    const cpkColIndex = columnas.findIndex(c => /CPK/i.test(c));

    // Identify columns after CPK: date → estado → descripcion → consignatario → carnet
    // Start from the column after CPK
    const afterCPK = cpkColIndex >= 0 ? columnas.slice(cpkColIndex + 1) : columnas;

    // Find embarcador (first company-like column)
    for (const col of columnas) {
      if (/CHAMBATINA|MIAMI|GEO/i.test(col) && !/CPK/i.test(col)) {
        embarcador = col;
        break;
      }
    }

    // Now identify descripcion and consignatario from columns after CPK
    // Skip: date column, estado column, carnet column, embarcador column, empty columns
    const usedIndices = new Set<number>();
    if (fechaIndex >= 0) usedIndices.add(fechaIndex);
    if (cpkColIndex >= 0) usedIndices.add(cpkColIndex);

    // Find estado column index
    let estadoColIndex = -1;
    for (let i = 0; i < columnas.length; i++) {
      if (isEstadoKeyword(columnas[i])) { estadoColIndex = i; usedIndices.add(i); break; }
    }

    // Find carnet column index
    let carnetColIndex = -1;
    for (let i = 0; i < columnas.length; i++) {
      if (carnetPrincipal && columnas[i].includes(carnetPrincipal)) { carnetColIndex = i; usedIndices.add(i); break; }
    }

    // Find embarcador column index
    let embarcadorColIndex = -1;
    for (let i = 0; i < columnas.length; i++) {
      if (embarcador && columnas[i] === embarcador) { embarcadorColIndex = i; usedIndices.add(i); break; }
    }

    // Remaining columns after CPK that aren't used are candidates for descripcion and consignatario
    const candidates: { index: number; text: string }[] = [];
    for (let i = cpkColIndex + 1; i < columnas.length; i++) {
      if (!usedIndices.has(i) && columnas[i].length > 0) {
        candidates.push({ index: i, text: columnas[i] });
      }
    }

    // Separate: names go to consignatario, other text goes to descripcion
    const names: string[] = [];
    const descs: string[] = [];
    for (const c of candidates) {
      if (looksLikeName(c.text)) {
        names.push(c.text);
      } else {
        descs.push(c.text);
      }
    }

    // Last name-like candidate is likely the consignatario
    if (names.length > 0) {
      consignatario = names[names.length - 1];
    }

    // First non-name candidate is likely the descripcion
    if (descs.length > 0) {
      descripcion = descs[0];
    } else if (names.length > 1) {
      // If no descripcion candidates, first name might be a description
      descripcion = names[0];
      consignatario = names[names.length - 1];
    }

    resultados.push({
      cpk: normalizarCPK(cpk),
      fecha,
      embarque: estado,
      estado, // Keep the real parsed estado, NOT the calculated one
      descripcion,
      embarcador,
      consignatario,
      carnetPrincipal,
      rawData: linea,
    });
  }

  return resultados;
}

export function normalizarCPK(texto: string): string {
  const match = texto.match(/CPK[-\s]?(\d+)/i);
  if (match) return `CPK-${match[1].padStart(7, '0')}`;
  return texto.trim();
}

export function buscarPorCPK(cpk: string, entries: any[]): any {
  const normalized = normalizarCPK(cpk);
  return entries.find((e: any) => normalizarCPK(e.cpk) === normalized) || null;
}

export function buscarPorCarnet(carnet: string, entries: any[]): any[] {
  const normalized = carnet.replace(/\s/g, '');
  return entries.filter((e: any) => e.carnetPrincipal && e.carnetPrincipal.replace(/\s/g, '').includes(normalized));
}

// ---- Intent Detection for Chat ----

export interface DetectedIntent {
  intent: string;
  data: Record<string, any>;
}

export function detectarIntencion(mensaje: string): DetectedIntent {
  const msg = mensaje.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Price query
  if (/cuanto cuesta|precio|costo|valor|tarifa/.test(msg)) {
    const pesoMatch = mensaje.match(/(\d+(?:\.\d+)?)\s*(?:lb|libras|libra|pounds?|lbs?)/i);
    if (pesoMatch) {
      const peso = parseFloat(pesoMatch[1]);
      let tipo: EnvioTipo = 'equipo';
      if (/recogida|domicilio|casa|home/i.test(msg)) tipo = 'recogida';
      else if (/tiktok|redes sociales/i.test(msg)) tipo = 'tiktok';
      const calculo = calcularEnvio(peso, tipo);
      return {
        intent: 'precio_peso',
        data: { ...calculo },
      };
    }
    if (/bicicleta|bici|bike/i.test(msg)) {
      return { intent: 'precio_bicicleta', data: { bicicletas: BICICLETAS } };
    }
    if (/caja|box/i.test(msg)) {
      return { intent: 'precio_caja', data: { cajas: CAJAS } };
    }
    return {
      intent: 'precio_general',
      data: {
        porLibra: 1.99,
        cargoEquipo: 25,
        recogida: 2.30,
        tiktok: 1.80,
        bicicletas: BICICLETAS,
        cajas: CAJAS,
      },
    };
  }

  // Tracking query
  if (/rastrear|rastreo|track|buscar|donde esta|ubicacion|estatus/.test(msg)) {
    const cpkMatch = mensaje.match(/CPK[-\s]?(\d+)/i);
    if (cpkMatch) {
      return { intent: 'tracking_cpk', data: { cpk: `CPK-${cpkMatch[1]}` } };
    }
    const carnetMatch = mensaje.match(/(\d{8,12})/);
    if (carnetMatch) {
      return { intent: 'tracking_carnet', data: { carnet: carnetMatch[1] } };
    }
    return { intent: 'tracking_info', data: {} };
  }

  // Contact/Location query - return empty data, API will fill from config
  if (/donde estan|ubicacion|direccion|oficina|como llegar|horario|telefono|contacto|contactar/i.test(msg)) {
    return {
      intent: 'contacto',
      data: {},
    };
  }

  // Bicycles
  if (/bicicleta|bici|bike/i.test(msg)) {
    return { intent: 'bicicletas', data: { bicicletas: BICICLETAS } };
  }

  // Solar
  if (/solar|panel|energia|ecoflow|bateria/i.test(msg)) {
    return { intent: 'solar', data: {} };
  }

  // General greeting
  if (/hola|hello|hi|buenos|buenas|saludos/i.test(msg)) {
    return { intent: 'saludo', data: {} };
  }

  return { intent: 'general', data: {} };
}

// ---- Business Context for AI Chat ----

export const BUSINESS_CONTEXT = `Eres el asistente virtual inteligente de Chambatina, una empresa de logística internacional con sede en Winter Park, Florida. Eres como un empleado más de la empresa — amable, conocedor del negocio y siempre dispuesto a ayudar.

ACERCA DE CHAMBATINA:
Chambatina es una empresa familiar especializada en envíos internacionales desde Estados Unidos hacia Cuba y otros destinos. Con años de experiencia en el mercado, se han ganado la confianza de miles de clientes gracias a su servicio confiable, transparente y personalizado. Además de envíos, ofrecen soluciones de energía solar para hogares y negocios.

UBICACIÓN Y CONTACTO:
- Oficina principal: 7523 Aloma Ave, Winter Park, FL 32792, Suite 112
- Contactos principales: Geo (786-942-6904) y Adriana (786-784-6421)

SERVICIOS PRINCIPALES:

1. ENVÍOS INTERNACIONALES:
   - Envío de paquetes por peso (equipo, recogida a domicilio, compras TikTok)
   - Envío de bicicletas (infantiles, adultas, eléctricas)
   - Venta de cajas de embalaje en diferentes tamaños
   - Rastreo de paquetes en tiempo real con número CPK

2. SISTEMAS DE ENERGÍA SOLAR:
   - Asesoría personalizada sobre energía solar
   - Productos EcoFlow para uso residencial y comercial

3. TIENDA ONLINE:
   - Productos relacionados con envíos y energía solar
   - Compras con pickup en oficina

TABLA DE PRECIOS DE ENVÍO:
┌─────────────────────┬────────────┬──────────┐
│ Tipo de servicio    │ $ por libra│ Extra    │
├─────────────────────┼────────────┼──────────┤
│ Equipo (oficina)    │ $1.99      │ +$25     │
│ Recogida a domicilio│ $2.30      │ Ninguno  │
│ Compras TikTok      │ $1.80      │ Ninguno  │
└─────────────────────┴────────────┴──────────┘
Fórmula equipo: (Peso × $1.99) + $25 cargo fijo

PRECIOS DE BICICLETAS:
- Bicicleta infantil desarmada: $25
- Bicicleta infantil armada: $15
- Bicicleta adulta desarmada: $45
- Bicicleta adulta armada: $25
- Bicicleta eléctrica en caja: $35
- Bicicleta eléctrica sin caja: $50

CAJAS DE ENVÍO:
- Pequeña (12×12×12", hasta 60 lb): $45
- Mediana (15×15×15", hasta 100 lb): $65
- Grande (16×16×16", hasta 100 lb): $85

RASTREO DE PAQUETES:
- Cada paquete tiene un número CPK único (ejemplo: CPK-0266228)
- Se puede rastrear por número CPK o por carnet de identidad del destinatario
- 13 fases de rastreo: EN AGENCIA → TRANSPORTE A NAVIERA → EN CONTENEDOR → EN TRANSITO → EN NAVIERA → DESGRUPE → EN ADUANA → CLASIFICACION → ALMACEN CENTRAL → TRASLADO PROVINCIA → ALMACEN PROVINCIAL → EN DISTRIBUCION → ENTREGADO
- Tiempo estimado total: 35 días`;
