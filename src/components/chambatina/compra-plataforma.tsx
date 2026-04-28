'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';

interface PlataformaConfig {
  id: string;
  nombre: string;
  icon: string;
  color: string;
  bgGradient: string;
  borderColor: string;
  hoverBg: string;
  placeholder: string;
  example: string;
}

const PLATAFORMAS: PlataformaConfig[] = [
  {
    id: 'tiktok',
    nombre: 'TikTok Shop',
    icon: 'TT',
    color: 'text-zinc-900',
    bgGradient: 'from-zinc-800 via-zinc-900 to-black',
    borderColor: 'border-zinc-700',
    hoverBg: 'hover:from-zinc-700 hover:via-zinc-800 hover:to-zinc-900',
    placeholder: 'Pega el link del producto de TikTok Shop',
    example: 'https://www.tiktok.com/...',
  },
  {
    id: 'amazon',
    nombre: 'Amazon',
    icon: 'AZ',
    color: 'text-orange-900',
    bgGradient: 'from-orange-500 to-amber-600',
    borderColor: 'border-orange-400',
    hoverBg: 'hover:from-orange-600 hover:to-amber-700',
    placeholder: 'Pega el link del producto de Amazon',
    example: 'https://www.amazon.com/dp/...',
  },
  {
    id: 'aliexpress',
    nombre: 'AliExpress',
    icon: 'AL',
    color: 'text-red-800',
    bgGradient: 'from-red-500 to-red-700',
    borderColor: 'border-red-400',
    hoverBg: 'hover:from-red-600 hover:to-red-800',
    placeholder: 'Pega el link del producto de AliExpress',
    example: 'https://www.aliexpress.com/item/...',
  },
  {
    id: 'shein',
    nombre: 'SHEIN',
    icon: 'SH',
    color: 'text-zinc-900',
    bgGradient: 'from-zinc-800 to-black',
    borderColor: 'border-zinc-600',
    hoverBg: 'hover:from-zinc-700 hover:to-zinc-900',
    placeholder: 'Pega el link del producto de SHEIN',
    example: 'https://www.shein.com/...',
  },
  {
    id: 'mercadolibre',
    nombre: 'MercadoLibre',
    icon: 'ML',
    color: 'text-yellow-700',
    bgGradient: 'from-yellow-400 to-yellow-500',
    borderColor: 'border-yellow-300',
    hoverBg: 'hover:from-yellow-500 hover:to-yellow-600',
    placeholder: 'Pega el link del producto de MercadoLibre',
    example: 'https://www.mercadolibre.com/...',
  },
  {
    id: 'temu',
    nombre: 'Temu',
    icon: 'TM',
    color: 'text-orange-800',
    bgGradient: 'from-orange-400 to-orange-600',
    borderColor: 'border-orange-300',
    hoverBg: 'hover:from-orange-500 hover:to-orange-700',
    placeholder: 'Pega el link del producto de Temu',
    example: 'https://www.temu.com/...',
  },
  {
    id: 'ebay',
    nombre: 'eBay',
    icon: 'EB',
    color: 'text-blue-800',
    bgGradient: 'from-blue-500 to-blue-700',
    borderColor: 'border-blue-400',
    hoverBg: 'hover:from-blue-600 hover:to-blue-800',
    placeholder: 'Pega el link del producto de eBay',
    example: 'https://www.ebay.com/itm/...',
  },
  {
    id: 'otro',
    nombre: 'Otra Plataforma',
    icon: '...',
    color: 'text-zinc-700',
    bgGradient: 'from-zinc-400 to-zinc-500',
    borderColor: 'border-zinc-300',
    hoverBg: 'hover:from-zinc-500 hover:to-zinc-600',
    placeholder: 'Pega el link del producto',
    example: 'https://...',
  },
];

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

const CHAMBATINA_ADDRESS = '2234 A Winter Woods Blvd, Winter Park, Unit 1000, FL 32792';

export function CompraPlataforma() {
  const { setCurrentView, currentUser } = useAppStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPlataforma, setSelectedPlataforma] = useState<PlataformaConfig | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [pedidoId, setPedidoId] = useState<number | null>(null);

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

  const handleSelectPlataforma = (plataforma: PlataformaConfig) => {
    setSelectedPlataforma(plataforma);
    setForm((prev) => ({ ...prev, plataforma: plataforma.id }));
    setStep(2);
  };

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

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
                  Puedes rastrear tu pedido desde la seccion "Rastreador".
                </p>
              </div>
            </CardContent>
          </Card>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => setCurrentView('rastreador')}
              className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-8"
            >
              <Truck className="h-4 w-4 mr-2" />
              Rastrear Pedido
            </Button>
            <Button variant="outline" onClick={() => setCurrentView('tienda')}>
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
        <Button variant="ghost" size="icon" onClick={handleGoBack}>
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
      <div className="flex items-center gap-2 mb-8">
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
                  className={`relative overflow-hidden rounded-xl border-2 ${plataforma.borderColor} transition-all duration-200 group`}
                >
                  <div className={`bg-gradient-to-br ${plataforma.bgGradient} ${plataforma.hoverBg} p-4 flex flex-col items-center gap-2 transition-all`}>
                    <span className="text-white font-black text-lg tracking-tight">
                      {plataforma.icon}
                    </span>
                    <span className={`text-xs font-semibold ${plataforma.color === 'text-zinc-900' && plataforma.id === 'shein' ? 'text-white' : plataforma.id === 'shein' ? 'text-white' : ''} ${plataforma.id === 'tiktok' || plataforma.id === 'shein' ? 'text-white' : ''} ${plataforma.color} ${plataforma.id === 'tiktok' ? '!text-white' : ''} ${plataforma.id === 'shein' ? '!text-white' : ''} ${plataforma.id === 'otro' ? '!text-white' : ''}`}>
                      {plataforma.nombre}
                    </span>
                  </div>
                  <div className="absolute bottom-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="h-5 w-5 text-white/60" />
                  </div>
                </motion.button>
              ))}
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
              <div>
                <p className="font-bold text-sm">{selectedPlataforma.nombre}</p>
                <p className="text-white/70 text-xs">Paso 2: Describe el producto</p>
              </div>
            </div>

            <Card className="border-0 shadow-md mb-4">
              <CardContent className="p-6 space-y-5">
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
                      className={errors.linkProducto ? 'border-red-500 pl-10' : 'pl-10'}
                      type="url"
                    />
                    <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  </div>
                  {errors.linkProducto && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.linkProducto}
                    </p>
                  )}
                  <p className="text-[11px] text-zinc-400">
                    Ejemplo: {selectedPlataforma.example}
                  </p>
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
                    className={errors.descripcionProducto ? 'border-red-500' : ''}
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
                      step="0.01"
                      min="0"
                      value={form.precioProducto}
                      onChange={(e) => updateField('precioProducto', e.target.value)}
                      placeholder="0.00"
                      className="pl-7"
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
                className="flex-none"
              >
                Atras
              </Button>
              <Button
                onClick={() => { if (validateStep2()) setStep(3); }}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold"
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
                    className={errors.nombreSolicitante ? 'border-red-500' : ''}
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telSol" className="text-xs font-medium">Telefono *</Label>
                    <Input
                      id="telSol"
                      value={form.telefonoSolicitante}
                      onChange={(e) => updateField('telefonoSolicitante', e.target.value)}
                      placeholder="+53 0000-0000"
                      className={errors.telefonoSolicitante ? 'border-red-500' : ''}
                    />
                    {errors.telefonoSolicitante && <p className="text-xs text-red-500">{errors.telefonoSolicitante}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Destination Info */}
            <Card className="border-0 shadow-md mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                  </div>
                  Datos del Destinatario
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombreDest" className="text-xs font-medium">Nombre del destinatario *</Label>
                    <Input
                      id="nombreDest"
                      value={form.nombreDestinatario}
                      onChange={(e) => updateField('nombreDestinatario', e.target.value)}
                      placeholder="Nombre de quien recibe"
                      className={errors.nombreDestinatario ? 'border-red-500' : ''}
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
                      className={errors.telefonoDestinatario ? 'border-red-500' : ''}
                    />
                    {errors.telefonoDestinatario && <p className="text-xs text-red-500">{errors.telefonoDestinatario}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carnetDest" className="text-xs font-medium">Carnet de identidad</Label>
                  <Input
                    id="carnetDest"
                    value={form.carnetDestinatario}
                    onChange={(e) => updateField('carnetDestinatario', e.target.value)}
                    placeholder="Numero de carnet (opcional)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dirDest" className="text-xs font-medium">Direccion completa *</Label>
                  <Input
                    id="dirDest"
                    value={form.direccionDestinatario}
                    onChange={(e) => updateField('direccionDestinatario', e.target.value)}
                    placeholder="Calle, municipio, provincia"
                    className={errors.direccionDestinatario ? 'border-red-500' : ''}
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

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-none"
              >
                Atras
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-base py-6 shadow-lg shadow-amber-500/20"
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
