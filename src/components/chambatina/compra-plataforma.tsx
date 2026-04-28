'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from './store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Truck,
  ShoppingBag,
  MapPin,
  Link as LinkIcon,
  CheckCircle2,
  User,
  Package,
  ChevronRight,
  ExternalLink,
  AlertCircle,
  Sparkles,
  Clipboard,
  ScanSearch,
  Lock,
  BadgeCheck,
  Timer,
} from 'lucide-react';
import { toast } from 'sonner';

interface PlataformaConfig {
  id: string;
  nombre: string;
  icon: string;
  bgGradient: string;
  borderColor: string;
  hoverBg: string;
  placeholder: string;
  example: string;
  domains: string[];
}

const PLATAFORMAS: PlataformaConfig[] = [
  {
    id: 'tiktok',
    nombre: 'TikTok Shop',
    icon: 'TT',
    bgGradient: 'from-zinc-800 via-zinc-900 to-black',
    borderColor: 'border-zinc-700',
    hoverBg: 'hover:from-zinc-700 hover:via-zinc-800 hover:to-zinc-900',
    placeholder: 'Pega el link del producto de TikTok Shop',
    example: 'https://www.tiktok.com/...',
    domains: ['tiktok.com', 'tiktok.shop'],
  },
  {
    id: 'amazon',
    nombre: 'Amazon',
    icon: 'AZ',
    bgGradient: 'from-orange-500 to-amber-600',
    borderColor: 'border-orange-400',
    hoverBg: 'hover:from-orange-600 hover:to-amber-700',
    placeholder: 'Pega el link del producto de Amazon',
    example: 'https://www.amazon.com/dp/...',
    domains: ['amazon.com', 'amazon.es', 'amazon.mx', 'amzn.to'],
  },
  {
    id: 'aliexpress',
    nombre: 'AliExpress',
    icon: 'AL',
    bgGradient: 'from-red-500 to-red-700',
    borderColor: 'border-red-400',
    hoverBg: 'hover:from-red-600 hover:to-red-800',
    placeholder: 'Pega el link del producto de AliExpress',
    example: 'https://www.aliexpress.com/item/...',
    domains: ['aliexpress.com', 'aliexpress.us'],
  },
  {
    id: 'shein',
    nombre: 'SHEIN',
    icon: 'SH',
    bgGradient: 'from-zinc-800 to-black',
    borderColor: 'border-zinc-600',
    hoverBg: 'hover:from-zinc-700 hover:to-zinc-900',
    placeholder: 'Pega el link del producto de SHEIN',
    example: 'https://www.shein.com/...',
    domains: ['shein.com', 'shein.us'],
  },
  {
    id: 'mercadolibre',
    nombre: 'MercadoLibre',
    icon: 'ML',
    bgGradient: 'from-yellow-400 to-yellow-500',
    borderColor: 'border-yellow-300',
    hoverBg: 'hover:from-yellow-500 hover:to-yellow-600',
    placeholder: 'Pega el link del producto de MercadoLibre',
    example: 'https://www.mercadolibre.com/...',
    domains: ['mercadolibre.com', 'mercadolivre.com.br'],
  },
  {
    id: 'temu',
    nombre: 'Temu',
    icon: 'TM',
    bgGradient: 'from-orange-400 to-orange-600',
    borderColor: 'border-orange-300',
    hoverBg: 'hover:from-orange-500 hover:to-orange-700',
    placeholder: 'Pega el link del producto de Temu',
    example: 'https://www.temu.com/...',
    domains: ['temu.com'],
  },
  {
    id: 'ebay',
    nombre: 'eBay',
    icon: 'EB',
    bgGradient: 'from-blue-500 to-blue-700',
    borderColor: 'border-blue-400',
    hoverBg: 'hover:from-blue-600 hover:to-blue-800',
    placeholder: 'Pega el link del producto de eBay',
    example: 'https://www.ebay.com/itm/...',
    domains: ['ebay.com', 'ebay.es'],
  },
  {
    id: 'otro',
    nombre: 'Otra Plataforma',
    icon: '+',
    bgGradient: 'from-zinc-400 to-zinc-500',
    borderColor: 'border-zinc-300',
    hoverBg: 'hover:from-zinc-500 hover:to-zinc-600',
    placeholder: 'Pega el link del producto',
    example: 'https://...',
    domains: [],
  },
];

// Auto-detect platform from a URL
function detectPlatformFromUrl(url: string): PlataformaConfig | null {
  try {
    const lower = url.toLowerCase().trim();
    if (!lower.startsWith('http')) return null;
    const hostname = new URL(lower).hostname.replace('www.', '');
    for (const p of PLATAFORMAS) {
      if (p.id === 'otro') continue;
      for (const domain of p.domains) {
        if (hostname === domain || hostname.endsWith('.' + domain)) return p;
      }
    }
    return PLATAFORMAS.find(p => p.id === 'otro') || null;
  } catch {
    return null;
  }
}

interface FormData {
  plataforma: string;
  linkProducto: string;
  descripcionProducto: string;
  precioProducto: string;
  nombreSolicitante: string;
  emailSolicitante: string;
  telefonoSolicitante: string;
  nombreDestinatario: string;
  telefonoDestinatario: string;
  carnetDestinatario: string;
  direccionDestinatario: string;
  notas: string;
}

interface DestinatarioFrecuente {
  nombre: string;
  telefono: string;
  carnet: string;
  direccion: string;
  veces: number;
  ultimoUso: string;
}

const DEST_KEY = 'chambatina-destinatarios';

function loadDestinatarios(): DestinatarioFrecuente[] {
  try {
    const raw = localStorage.getItem(DEST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveDestinatarios(list: DestinatarioFrecuente[]) {
  try { localStorage.setItem(DEST_KEY, JSON.stringify(list)); } catch {}
}

function addDestinatario(d: { nombre: string; telefono: string; carnet: string; direccion: string }) {
  const list = loadDestinatarios();
  const idx = list.findIndex(x => x.nombre.toLowerCase() === d.nombre.toLowerCase());
  if (idx >= 0) {
    list[idx].telefono = d.telefono || list[idx].telefono;
    list[idx].carnet = d.carnet || list[idx].carnet;
    list[idx].direccion = d.direccion || list[idx].direccion;
    list[idx].veces += 1;
    list[idx].ultimoUso = new Date().toISOString();
  } else {
    list.unshift({ ...d, veces: 1, ultimoUso: new Date().toISOString() });
  }
  // Keep max 10
  const sorted = list.sort((a, b) => b.veces - a.veces).slice(0, 10);
  saveDestinatarios(sorted);
  return sorted;
}

export function CompraPlataforma() {
  const { setCurrentView, currentUser } = useAppStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPlataforma, setSelectedPlataforma] = useState<PlataformaConfig | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [pedidoId, setPedidoId] = useState<number | null>(null);
  const [quickLink, setQuickLink] = useState('');
  const [pasting, setPasting] = useState(false);
  const [detectedPlatform, setDetectedPlatform] = useState<PlataformaConfig | null>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const [destinatarios, setDestinatarios] = useState<DestinatarioFrecuente[]>([]);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  const [form, setForm] = useState<FormData>({
    plataforma: '',
    linkProducto: '',
    descripcionProducto: '',
    precioProducto: '',
    nombreSolicitante: currentUser?.nombre || '',
    emailSolicitante: currentUser?.email || '',
    telefonoSolicitante: currentUser?.telefono || '',
    nombreDestinatario: '',
    telefonoDestinatario: '',
    carnetDestinatario: '',
    direccionDestinatario: '',
    notas: '',
  });

  useEffect(() => {
    if (currentUser) {
      setForm((prev) => ({
        ...prev,
        nombreSolicitante: currentUser.nombre || '',
        emailSolicitante: currentUser.email || '',
        telefonoSolicitante: currentUser.telefono || '',
      }));
    }
  }, [currentUser]);

  // Load frequent recipients when step 3 starts
  // If only 1 frequent recipient exists, auto-fill to save user effort
  useEffect(() => {
    if (step === 3) {
      const dests = loadDestinatarios();
      setDestinatarios(dests);

      // Auto-fill when there's exactly 1 frequent recipient and form fields are empty
      if (dests.length === 1) {
        const dest = dests[0];
        const currentDest = form.nombreDestinatario.trim();
        if (!currentDest) {
          setForm((prev) => ({
            ...prev,
            nombreDestinatario: dest.nombre,
            telefonoDestinatario: dest.telefono,
            carnetDestinatario: dest.carnet || '',
            direccionDestinatario: dest.direccion,
          }));
          setErrors((prev) => ({
            ...prev,
            nombreDestinatario: undefined,
            telefonoDestinatario: undefined,
            carnetDestinatario: undefined,
            direccionDestinatario: undefined,
          }));
          toast.success(`Datos de ${dest.nombre} cargados automaticamente`);
        }
      }
    }
  }, [step]);

  // Auto-fill from frequent recipient
  const handleSelectDestinatario = (dest: DestinatarioFrecuente) => {
    setForm((prev) => ({
      ...prev,
      nombreDestinatario: dest.nombre,
      telefonoDestinatario: dest.telefono,
      carnetDestinatario: dest.carnet || '',
      direccionDestinatario: dest.direccion,
    }));
    setShowDestDropdown(false);
    // Clear errors
    setErrors((prev) => ({
      ...prev,
      nombreDestinatario: undefined,
      telefonoDestinatario: undefined,
      direccionDestinatario: undefined,
    }));
    toast.success(`Datos de ${dest.nombre} cargados`);
  };

  // Filter destinatarios as user types name
  const filteredDests = showDestDropdown
    ? destinatarios.filter(d =>
        d.nombre.toLowerCase().includes((form.nombreDestinatario || '').toLowerCase())
      )
    : [];

  const handleSelectPlataforma = (plataforma: PlataformaConfig) => {
    setSelectedPlataforma(plataforma);
    setForm((prev) => ({ ...prev, plataforma: plataforma.id }));
    setStep(2);
  };

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // Quick link handler - detect platform and auto-advance
  const handleQuickLinkSubmit = useCallback(() => {
    const url = quickLink.trim();
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      toast.error('El link debe comenzar con http:// o https://');
      return;
    }
    const detected = detectPlatformFromUrl(url);
    if (detected) {
      setSelectedPlataforma(detected);
      setForm((prev) => ({
        ...prev,
        plataforma: detected.id,
        linkProducto: url,
      }));
      setStep(2);
      toast.success(`Plataforma detectada: ${detected.nombre}`);
    } else {
      toast.error('No se pudo detectar la plataforma. Selecciona una manualmente.');
    }
  }, [quickLink]);

  // Clipboard paste
  const handlePasteFromClipboard = async () => {
    setPasting(true);
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.startsWith('http')) {
          setQuickLink(text);
          const detected = detectPlatformFromUrl(text);
          if (detected) {
            setDetectedPlatform(detected);
          }
          toast.success('Link pegado del portapapeles');
        } else {
          toast.error('No se encontro un link valido en el portapapeles');
        }
      } else {
        toast.error('Tu navegador no permite acceso al portapapeles. Pega el link manualmente.');
      }
    } catch {
      toast.error('No se pudo acceder al portapapeles. Pega el link manualmente.');
    } finally {
      setPasting(false);
    }
  };

  // Watch quickLink for auto-detection
  useEffect(() => {
    if (quickLink.trim().startsWith('http')) {
      const detected = detectPlatformFromUrl(quickLink);
      setDetectedPlatform(detected);
    } else {
      setDetectedPlatform(null);
    }
  }, [quickLink]);

  const validateStep2 = (): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.linkProducto.trim()) errs.linkProducto = 'Pega el link del producto';
    if (form.linkProducto.trim() && !form.linkProducto.startsWith('http')) errs.linkProducto = 'El link debe comenzar con http:// o https://';
    if (!form.descripcionProducto.trim()) errs.descripcionProducto = 'Describe el producto que quieres';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = (): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.nombreSolicitante.trim()) errs.nombreSolicitante = 'Requerido';
    if (!form.telefonoSolicitante.trim()) errs.telefonoSolicitante = 'Requerido';
    if (!form.nombreDestinatario.trim()) errs.nombreDestinatario = 'Requerido';
    if (!form.telefonoDestinatario.trim()) errs.telefonoDestinatario = 'Requerido';
    if (!form.carnetDestinatario.trim()) errs.carnetDestinatario = 'Requerido';
    if (!form.direccionDestinatario.trim()) errs.direccionDestinatario = 'Requerido';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/compras-plataforma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          precioProducto: parseFloat(form.precioProducto) || 0,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        // Save this recipient as frequent
        addDestinatario({
          nombre: form.nombreDestinatario,
          telefono: form.telefonoDestinatario,
          carnet: form.carnetDestinatario,
          direccion: form.direccionDestinatario,
        });
        setPedidoId(json.data.id);
        setSubmitted(true);
        toast.success('Solicitud enviada correctamente');
      } else {
        if (json.error && typeof json.error === 'object') {
          setErrors(json.error);
        } else {
          toast.error(json.error || 'Error al enviar solicitud');
        }
      }
    } catch {
      toast.error('Error de conexion. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoBack = () => {
    if (step === 1) setCurrentView('tienda');
    else if (step === 2) { setStep(1); setSelectedPlataforma(null); }
    else setStep(2);
  };

  // Success Screen
  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        <div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto"
          >
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">
              Solicitud Recibida
            </h1>
            <p className="text-zinc-500 text-lg">
              Tu pedido #{pedidoId} ha sido registrado exitosamente.
            </p>
          </div>
          <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-amber-50">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selectedPlataforma?.bgGradient} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                  {selectedPlataforma?.icon}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-zinc-900">{selectedPlataforma?.nombre}</p>
                  <p className="text-xs text-zinc-500 truncate max-w-[250px]">{form.descripcionProducto}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-zinc-600">
                  <User className="h-4 w-4 text-zinc-400" />
                  <span>Destinatario: {form.nombreDestinatario}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-600">
                  <MapPin className="h-4 w-4 text-zinc-400" />
                  <span className="truncate">{form.direccionDestinatario}</span>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-2 bg-blue-50 rounded-lg p-3">
                <Truck className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  Chambatina procesara tu compra y te informara el estado por WhatsApp.
                  Puedes rastrear tu pedido desde la seccion &quot;Rastreador&quot;.
                </p>
              </div>
            </CardContent>
          </Card>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => setCurrentView('rastreador')}
              className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-8 min-h-[48px]"
            >
              <Truck className="h-4 w-4 mr-2" />
              Rastrear Pedido
            </Button>
            <Button variant="outline" onClick={() => setCurrentView('tienda')} className="min-h-[48px]">
              Volver a la Tienda
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={handleGoBack} className="touch-manipulation">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-zinc-900">
            Compra por Plataforma
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Chambatina compra por ti en cualquier tienda online
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { num: 1, label: 'Plataforma' },
          { num: 2, label: 'Producto' },
          { num: 3, label: 'Datos' },
        ].map((s, i) => (
          <div key={s.num} className="flex items-center gap-2 flex-1">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  step >= s.num
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'bg-zinc-100 text-zinc-400'
                }`}
              >
                {step > s.num ? <CheckCircle2 className="h-4 w-4" /> : s.num}
              </div>
              <span className={`text-xs font-medium hidden sm:inline transition-colors ${step >= s.num ? 'text-amber-700' : 'text-zinc-400'}`}>
                {s.label}
              </span>
            </div>
            {i < 2 && (
              <div className={`flex-1 h-0.5 rounded-full transition-colors ${step > s.num ? 'bg-amber-400' : 'bg-zinc-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Trust Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <ShieldCheck className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-900 text-sm">Compra Segura y Facil</p>
          <p className="text-xs text-amber-700 leading-relaxed mt-1">
            Solo pega el link del producto que deseas. Chambatina se encarga de la compra, el pago y el envio directo a tu puerta.
          </p>
        </div>
      </div>

      {/* Step 1: Platform Selection */}
      {step === 1 && (
        <AnimatePresence mode="wait">
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Quick Paste Link - Hero Section */}
            <Card className="border-0 shadow-lg mb-6 overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-black">
              <CardContent className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20">
                    <LinkIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Pega tu link y listo</h2>
                    <p className="text-zinc-400 text-xs">Detectamos la plataforma automaticamente</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <ScanSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                      <Input
                        ref={linkInputRef}
                        value={quickLink}
                        onChange={(e) => setQuickLink(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleQuickLinkSubmit(); }}
                        placeholder="Pega aqui el link del producto..."
                        className="pl-10 pr-4 bg-white/10 border-white/20 text-white placeholder:text-zinc-500 focus:border-amber-400 h-12 text-sm"
                        type="url"
                        enterKeyHint="go"
                      />
                    </div>
                    <Button
                      onClick={handlePasteFromClipboard}
                      disabled={pasting}
                      variant="outline"
                      className="h-12 px-4 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white shrink-0 touch-manipulation"
                    >
                      {pasting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Clipboard className="h-5 w-5" />
                      )}
                    </Button>
                  </div>

                  {/* Auto-detected platform indicator */}
                  {detectedPlatform && quickLink.trim().startsWith('http') && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2"
                    >
                      <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${detectedPlatform.bgGradient} flex items-center justify-center text-white font-bold text-[9px]`}>
                        {detectedPlatform.icon}
                      </div>
                      <span className="text-xs text-emerald-400 font-medium">
                        Detectado: {detectedPlatform.nombre}
                      </span>
                      <BadgeCheck className="h-4 w-4 text-emerald-400" />
                    </motion.div>
                  )}

                  <Button
                    onClick={handleQuickLinkSubmit}
                    disabled={!quickLink.trim() || !quickLink.trim().startsWith('http')}
                    className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold text-base h-12 shadow-lg shadow-orange-500/20 touch-manipulation"
                  >
                    <ShoppingBag className="h-5 w-5 mr-2" />
                    Continuar con este link
                    <ChevronRight className="h-5 w-5 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-zinc-200" />
              <span className="text-xs text-zinc-400 font-medium">o selecciona la plataforma</span>
              <div className="flex-1 h-px bg-zinc-200" />
            </div>

            <p className="text-sm font-medium text-zinc-700 mb-4">
              Selecciona la plataforma donde encontraste el producto:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PLATAFORMAS.map((plataforma) => (
                <motion.button
                  key={plataforma.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSelectPlataforma(plataforma)}
                  className={`relative overflow-hidden rounded-xl border-2 ${plataforma.borderColor} transition-all duration-200 group touch-manipulation`}
                >
                  <div className={`bg-gradient-to-br ${plataforma.bgGradient} ${plataforma.hoverBg} p-4 sm:p-5 flex flex-col items-center gap-2 transition-all min-h-[72px] justify-center`}>
                    <span className="text-white font-black text-xl tracking-tight">
                      {plataforma.icon}
                    </span>
                    <span className="text-xs font-semibold text-white">
                      {plataforma.nombre}
                    </span>
                  </div>
                  <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="h-4 w-4 text-white/50" />
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Security badges */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                <span>Datos protegidos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Pago seguro</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Timer className="h-3.5 w-3.5" />
                <span>Confirmacion rapida</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Step 2: Product Link & Description */}
      {step === 2 && selectedPlataforma && (
        <AnimatePresence mode="wait">
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Selected Platform Badge */}
            <div className={`flex items-center gap-3 mb-6 p-3 rounded-xl bg-gradient-to-r ${selectedPlataforma.bgGradient} text-white`}>
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center font-bold text-sm">
                {selectedPlataforma.icon}
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">{selectedPlataforma.nombre}</p>
                <p className="text-white/70 text-xs">Paso 2: Describe el producto</p>
              </div>
              {form.linkProducto && (
                <BadgeCheck className="h-5 w-5 text-emerald-400" />
              )}
            </div>

            <Card className="border-0 shadow-md mb-4">
              <CardContent className="p-5 sm:p-6 space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-amber-500" />
                    Link del Producto *
                  </Label>
                  <div className="relative">
                    <Input
                      value={form.linkProducto}
                      onChange={(e) => updateField('linkProducto', e.target.value)}
                      placeholder={selectedPlataforma.placeholder}
                      className={errors.linkProducto ? 'border-red-500 pl-10 h-12 text-sm' : 'pl-10 h-12 text-sm'}
                      type="url"
                      enterKeyHint="next"
                      autoComplete="off"
                    />
                    <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  </div>
                  {errors.linkProducto && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.linkProducto}
                    </p>
                  )}
                  {form.linkProducto && (
                    <a
                      href={form.linkProducto}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Abrir link en nueva pestana <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Package className="h-4 w-4 text-amber-500" />
                    Describe el producto *
                  </Label>
                  <Textarea
                    value={form.descripcionProducto}
                    onChange={(e) => updateField('descripcionProducto', e.target.value)}
                    placeholder="Ej: iPhone 15 Pro Max 256GB Negro, Zapatillas Nike Air Max 90 talla 42..."
                    rows={3}
                    className={errors.descripcionProducto ? 'border-red-500 text-sm' : 'text-sm'}
                  />
                  {errors.descripcionProducto && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.descripcionProducto}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Precio en la plataforma (opcional)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">$</span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={form.precioProducto}
                      onChange={(e) => updateField('precioProducto', e.target.value)}
                      placeholder="0.00"
                      className="pl-7 h-12 text-sm"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Esto nos ayuda a calcular el costo total con envio.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => { setStep(1); setSelectedPlataforma(null); }}
                className="flex-none min-h-[48px] touch-manipulation"
              >
                Atras
              </Button>
              <Button
                onClick={() => { if (validateStep2()) setStep(3); }}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold min-h-[48px] touch-manipulation"
              >
                Continuar
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Step 3: User & Destination Info */}
      {step === 3 && selectedPlataforma && (
        <AnimatePresence mode="wait">
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Product Summary */}
            <Card className="border-0 shadow-sm mb-4 bg-zinc-50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${selectedPlataforma.bgGradient} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                  {selectedPlataforma.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-zinc-900 truncate">
                    {form.descripcionProducto || 'Sin descripcion'}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {form.linkProducto || selectedPlataforma.nombre}
                  </p>
                </div>
                {form.precioProducto && (
                  <Badge className="bg-emerald-100 text-emerald-700 shrink-0">
                    ${parseFloat(form.precioProducto).toFixed(2)}
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Buyer Info */}
            <Card className="border-0 shadow-md mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-amber-600" />
                  </div>
                  Datos del Solicitante
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombreSol" className="text-xs font-medium">Nombre completo *</Label>
                  <Input
                    id="nombreSol"
                    value={form.nombreSolicitante}
                    onChange={(e) => updateField('nombreSolicitante', e.target.value)}
                    placeholder="Tu nombre"
                    className={`h-12 text-sm ${errors.nombreSolicitante ? 'border-red-500' : ''}`}
                    autoComplete="name"
                    enterKeyHint="next"
                  />
                  {errors.nombreSolicitante && <p className="text-xs text-red-500">{errors.nombreSolicitante}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emailSol" className="text-xs font-medium">Email (opcional)</Label>
                    <Input
                      id="emailSol"
                      type="email"
                      value={form.emailSolicitante}
                      onChange={(e) => updateField('emailSolicitante', e.target.value)}
                      placeholder="email@ejemplo.com"
                      className="h-12 text-sm"
                      autoComplete="email"
                      enterKeyHint="next"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telSol" className="text-xs font-medium">Telefono *</Label>
                    <Input
                      id="telSol"
                      value={form.telefonoSolicitante}
                      onChange={(e) => updateField('telefonoSolicitante', e.target.value)}
                      placeholder="+53 0000-0000"
                      className={`h-12 text-sm ${errors.telefonoSolicitante ? 'border-red-500' : ''}`}
                      autoComplete="tel"
                      inputMode="tel"
                      enterKeyHint="next"
                    />
                    {errors.telefonoSolicitante && <p className="text-xs text-red-500">{errors.telefonoSolicitante}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Destination Info */}
            <Card className="border-0 shadow-md mb-4">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-emerald-600" />
                    </div>
                    Datos del Destinatario
                  </CardTitle>
                  {destinatarios.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowDestDropdown(!showDestDropdown)}
                      className="text-xs font-medium text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 touch-manipulation"
                    >
                      <User className="h-3.5 w-3.5" />
                      Destinatarios frecuentes
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                {/* Frequent Recipients Quick Select */}
                {showDestDropdown && destinatarios.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2"
                  >
                    <p className="text-xs font-semibold text-amber-800 mb-2">Selecciona un destinatario anterior:</p>
                    <div className="space-y-1.5">
                      {(filteredDests.length > 0 ? filteredDests : destinatarios).map((dest, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSelectDestinatario(dest)}
                          className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-white hover:bg-amber-50 border border-amber-100 transition-colors text-left touch-manipulation"
                        >
                          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-zinc-900 truncate">{dest.nombre}</p>
                              <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0 shrink-0">{dest.veces}x</Badge>
                            </div>
                            <p className="text-[11px] text-zinc-500 truncate">{dest.direccion}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-zinc-300 shrink-0" />
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDestDropdown(false)}
                      className="w-full text-xs text-amber-600 font-medium pt-1 touch-manipulation"
                    >
                      Cerrar lista
                    </button>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombreDest" className="text-xs font-medium">Nombre del destinatario *</Label>
                    <Input
                      id="nombreDest"
                      value={form.nombreDestinatario}
                      onChange={(e) => updateField('nombreDestinatario', e.target.value)}
                      onFocus={() => { if (destinatarios.length > 0) setShowDestDropdown(true); }}
                      placeholder="Nombre de quien recibe"
                      className={`h-12 text-sm ${errors.nombreDestinatario ? 'border-red-500' : ''}`}
                      autoComplete="name"
                      enterKeyHint="next"
                    />
                    {errors.nombreDestinatario && <p className="text-xs text-red-500">{errors.nombreDestinatario}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telDest" className="text-xs font-medium">Telefono del destinatario *</Label>
                    <Input
                      id="telDest"
                      value={form.telefonoDestinatario}
                      onChange={(e) => updateField('telefonoDestinatario', e.target.value)}
                      placeholder="+53 0000-0000"
                      className={`h-12 text-sm ${errors.telefonoDestinatario ? 'border-red-500' : ''}`}
                      autoComplete="tel"
                      inputMode="tel"
                      enterKeyHint="next"
                    />
                    {errors.telefonoDestinatario && <p className="text-xs text-red-500">{errors.telefonoDestinatario}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carnetDest" className="text-xs font-medium">Carnet de identidad *</Label>
                  <Input
                    id="carnetDest"
                    value={form.carnetDestinatario}
                    onChange={(e) => updateField('carnetDestinatario', e.target.value)}
                    placeholder="Numero de carnet"
                    className={`h-12 text-sm ${errors.carnetDestinatario ? 'border-red-500' : ''}`}
                    enterKeyHint="next"
                  />
                  {errors.carnetDestinatario && <p className="text-xs text-red-500">{errors.carnetDestinatario}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dirDest" className="text-xs font-medium">Direccion completa *</Label>
                  <Input
                    id="dirDest"
                    value={form.direccionDestinatario}
                    onChange={(e) => updateField('direccionDestinatario', e.target.value)}
                    placeholder="Calle, municipio, provincia"
                    className={`h-12 text-sm ${errors.direccionDestinatario ? 'border-red-500' : ''}`}
                    autoComplete="street-address"
                    enterKeyHint="next"
                  />
                  {errors.direccionDestinatario && <p className="text-xs text-red-500">{errors.direccionDestinatario}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notasDest" className="text-xs font-medium">Notas adicionales</Label>
                  <Textarea
                    id="notasDest"
                    value={form.notas}
                    onChange={(e) => updateField('notas', e.target.value)}
                    placeholder="Instrucciones especiales, color, talla, etc."
                    rows={2}
                    className="text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* How it works */}
            <Card className="border border-blue-100 bg-blue-50/50 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <p className="font-semibold text-sm text-blue-900">Como funciona?</p>
                </div>
                <div className="space-y-2 text-xs text-blue-700 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center text-blue-800 font-bold shrink-0 mt-0.5">1</span>
                    <span>Envias la solicitud con el link del producto.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center text-blue-800 font-bold shrink-0 mt-0.5">2</span>
                    <span>Chambatina confirma precio total y te contacta por WhatsApp.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center text-blue-800 font-bold shrink-0 mt-0.5">3</span>
                    <span>Compramos el producto y lo enviamos a nuestra oficina en USA.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center text-blue-800 font-bold shrink-0 mt-0.5">4</span>
                    <span>Realizamos el envio internacional y tu recibes el paquete en tu puerta.</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security footer */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-4 text-xs text-zinc-400">
              <div className="flex items-center gap-1">
                <Lock className="h-3.5 w-3.5" />
                <span>Tus datos estan protegidos</span>
              </div>
              <div className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Compra 100% segura</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-none min-h-[48px] touch-manipulation"
              >
                Atras
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-base min-h-[52px] shadow-lg shadow-amber-500/20 touch-manipulation"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Enviando solicitud...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-5 w-5 mr-2" />
                    Solicitar Compra
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      <div className="md:hidden h-20" />
    </motion.div>
  );
}
