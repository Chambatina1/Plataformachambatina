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

// ---- Tracking Stages ----

export interface EtapaTracking {
  estado: string;
  diasMin: number;
  diasMax: number;
  descripcion: string;
  color: string;
}

export const ETAPAS: EtapaTracking[] = [
  { estado: 'EN AGENCIA', diasMin: 0, diasMax: 3, descripcion: 'El paquete está en nuestra agencia siendo procesado', color: '#f59e0b' },
  { estado: 'EN TRANSITO HACIA CUBA', diasMin: 3, diasMax: 7, descripcion: 'El paquete está en camino hacia Cuba', color: '#3b82f6' },
  { estado: 'EN ADUANA CUBA', diasMin: 7, diasMax: 14, descripcion: 'El paquete está siendo procesado por la aduana cubana', color: '#8b5cf6' },
  { estado: 'EN DISTRIBUCION', diasMin: 14, diasMax: 21, descripcion: 'El paquete está en distribución hacia su destino final', color: '#06b6d4' },
  { estado: 'ENTREGADO', diasMin: 21, diasMax: 999, descripcion: 'El paquete fue entregado exitosamente', color: '#22c55e' },
];

export function estadoPorTiempo(fechaTexto: string): EtapaTracking {
  if (!fechaTexto) return ETAPAS[0];
  
  const fecha = new Date(fechaTexto);
  if (isNaN(fecha.getTime())) return ETAPAS[0];
  
  const hoy = new Date();
  const diffMs = hoy.getTime() - fecha.getTime();
  const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  for (const etapa of ETAPAS) {
    if (dias >= etapa.diasMin && dias < etapa.diasMax) {
      return etapa;
    }
  }
  return ETAPAS[ETAPAS.length - 1];
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

  for (const linea of lineas) {
    const columnas = linea.split('\t').map(c => c.trim());
    if (columnas.length < 5) continue;

    let cpk = '';
    let fecha: string | null = null;
    let estado = 'EMBARCADO';
    let descripcion: string | null = null;
    let embarcador: string | null = null;
    let consignatario: string | null = null;
    let carnetPrincipal: string | null = null;

    // Find CPK number
    const cpkMatch = linea.match(/CPK[-\s]?(\d+)/i);
    if (cpkMatch) {
      cpk = `CPK-${cpkMatch[1]}`;
    } else {
      // Try column 2 or 3 for CPK
      for (let i = 2; i < Math.min(columnas.length, 5); i++) {
        if (/CPK/i.test(columnas[i])) {
          const numMatch = columnas[i].match(/(\d+)/);
          cpk = numMatch ? `CPK-${numMatch[1]}` : columnas[i];
          break;
        }
      }
    }

    if (!cpk) continue;

    // Find date
    const fechaMatch = linea.match(/(\d{4}-\d{2}-\d{2})/);
    if (fechaMatch) {
      fecha = fechaMatch[1];
    }

    // Find carnet (8-12 digit number)
    const carnetRegex = /(?<!\d)(\d{8,12})(?!\d)/g;
    let carnetMatch: RegExpExecArray | null;
    while ((carnetMatch = carnetRegex.exec(linea)) !== null) {
      // Skip if it looks like a phone number (starts with 5 or 7 and has specific length)
      const num = carnetMatch[1];
      if (!num.startsWith('54357818')) {
        carnetPrincipal = num;
        break;
      }
    }

    // Find estado keywords
    if (/EMBARCADO/i.test(linea)) estado = 'EMBARCADO';
    else if (/EN AGENCIA|RECIBIDO/i.test(linea)) estado = 'EN AGENCIA';
    else if (/TRANSITO|TRANSITO HACIA CUBA/i.test(linea)) estado = 'EN TRANSITO HACIA CUBA';
    else if (/ADUANA/i.test(linea)) estado = 'EN ADUANA CUBA';
    else if (/DISTRIBUCION|REPARTO/i.test(linea)) estado = 'EN DISTRIBUCION';
    else if (/ENTREGADO/i.test(linea)) estado = 'ENTREGADO';

    // Find description (long text fields - usually product description)
    for (let i = 0; i < columnas.length; i++) {
      const col = columnas[i];
      if (col.length > 10 && /[a-zA-Z]{3,}/.test(col) && !/CPK/i.test(col) && !/\d{4}-\d{2}-\d{2}/.test(col)) {
        if (!descripcion || col.length > descripcion.length) {
          descripcion = col;
        }
      }
    }

    // Find consignatario (name after date column)
    if (fecha) {
      const fechaIndex = columnas.findIndex(c => c.includes(fecha!));
      if (fechaIndex >= 0 && fechaIndex + 1 < columnas.length) {
        consignatario = columnas[fechaIndex + 1];
      }
    }

    // Embarcador is usually the first company-like column
    for (const col of columnas) {
      if (/CHAMBATINA|MIAMI|GEO/i.test(col) && !cpk.includes(col)) {
        embarcador = col;
        break;
      }
    }

    resultados.push({
      cpk: normalizarCPK(cpk),
      fecha,
      embarque: estado,
      estado: estadoPorTiempo(fecha || new Date().toISOString().split('T')[0]).estado,
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

export function buscarPorCPK(cpk: string, entries: TrackingEntry[]): TrackingEntry | null {
  const normalized = normalizarCPK(cpk);
  return entries.find(e => normalizarCPK(e.cpk) === normalized) || null;
}

export function buscarPorCarnet(carnet: string, entries: TrackingEntry[]): TrackingEntry[] {
  const normalized = carnet.replace(/\s/g, '');
  return entries.filter(e => e.carnetPrincipal && e.carnetPrincipal.replace(/\s/g, '').includes(normalized));
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
        data: { peso, tipo, ...calculo },
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

  // Location query
  if (/donde estan|ubicacion|direccion|oficina|como llegar|horario|telefono|contacto|contactar/i.test(msg)) {
    return {
      intent: 'contacto',
      data: {
        direccion: '7523 Aloma Ave, Winter Park, FL 32792, Suite 112',
        telefonos: ['786-942-6904 (Geo)', '786-784-6421 (Adriana)'],
      },
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

export const BUSINESS_CONTEXT = `Eres un asistente virtual de Chambatina, una empresa de logística especializada en envíos a Cuba y sistemas de energía solar.

INFORMACIÓN DE LA EMPRESA:
- Nombre: Chambatina
- Oficina: 7523 Aloma Ave, Winter Park, FL 32792, Suite 112
- Teléfonos: 786-942-6904 (Geo), 786-784-6421 (Adriana)
- Servicios: Envíos a Cuba, Sistemas Solares, Rastreo de Paquetes (CPK)

PRECIOS DE ENVÍO:
- Precio por libra (equipo): $1.99
- Cargo por equipo: $25
- Recogida a domicilio: $2.30/libra
- Compras TikTok: $1.80/libra
- Fórmula general: (Peso × 1.99) + 25

BICICLETAS:
- Bicicleta infantil desarmada: $25
- Bicicleta infantil armada: $15
- Bicicleta adulta desarmada: $45
- Bicicleta adulta armada: $25
- Bicicleta eléctrica en caja: $35
- Bicicleta eléctrica sin caja: $50

CAJAS:
- 12×12×12" hasta 60 lb: $45
- 15×15×15" hasta 100 lb: $65
- 16×16×16" hasta 100 lb: $85

RASTREO:
- Los paquetes se rastrean con número CPK (ejemplo: CPK-0266228)
- También se puede buscar por número de carnet de identidad del destinatario
- Los estados incluyen: EN AGENCIA, EN TRANSITO HACIA CUBA, EN ADUANA CUBA, EN DISTRIBUCION, ENTREGADO

ENERGÍA SOLAR:
- Chambatina ofrece orientación sobre sistemas de energía solar
- Productos EcoFlow disponibles

REGLAS:
1. Responde SIEMPRE en español
2. Sé amable y profesional
3. Si no sabes algo, sugiere llamar a la oficina
4. Para cálculos de precio, muestra la fórmula usada
5. Si preguntan por rastreo, pide el número CPK o carnet
6. Mantén las respuestas concisas pero completas`;
