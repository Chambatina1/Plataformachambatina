'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, Star, Zap, X, Send, MessageCircle, Mail, ChevronRight } from 'lucide-react';
import { useAppStore } from './store';
import { toast } from 'sonner';

// ---- TYPES ----
interface DigitalService {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  precioAntes: number | null;
  categoria: string;
  icono: string | null;
  activo: boolean;
  popular: boolean;
  orden: number;
}

// ---- CONSTANTS ----
const CATEGORIAS = [
  { value: '', label: 'Todos', emoji: '🌐' },
  { value: 'paginas-web', label: 'Paginas Web', emoji: '🖥️' },
  { value: 'rastreadores', label: 'Rastreadores', emoji: '📦' },
  { value: 'tiendas', label: 'Tiendas Online', emoji: '🛒' },
  { value: 'automatizacion', label: 'Automatizacion', emoji: '🤖' },
  { value: 'otros', label: 'Otros', emoji: '✨' },
];

const CHAMBATINA_EMAIL = 'info@chambatina.com';

// ---- MAIN COMPONENT ----
export function ServiciosDigitales() {
  const currentUser = useAppStore((s) => s.currentUser);
  const setCurrentView = useAppStore((s) => s.setCurrentView);
  const [services, setServices] = useState<DigitalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [contactModal, setContactModal] = useState<DigitalService | null>(null);
  const [sending, setSending] = useState(false);

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/servicios-digitales');
      const json = await res.json();
      if (json.ok) {
        setServices(json.data || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const filtered = activeCategory
    ? services.filter((s) => s.categoria === activeCategory)
    : services;

  const popularServices = filtered.filter((s) => s.popular);
  const regularServices = filtered.filter((s) => !s.popular);

  const handleContact = (service: DigitalService) => {
    setContactModal(service);
  };

  const handleSendContact = async (formData: { nombre: string; email: string; telefono: string; mensaje: string }) => {
    setSending(true);
    try {
      const res = await fetch('/api/servicios-digitales/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          servicio: contactModal?.nombre,
          precio: contactModal?.precio,
          ...formData,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success('Solicitud enviada correctamente. Te contactaremos pronto.');
        setContactModal(null);
      } else {
        toast.error(json.error || 'Error al enviar. Intenta de nuevo.');
      }
    } catch {
      toast.error('Error de conexion. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  const getDiscountPercent = (service: DigitalService) => {
    if (!service.precioAntes || service.precioAntes <= service.precio) return 0;
    return Math.round(((service.precioAntes - service.precio) / service.precioAntes) * 100);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
            Servicios Digitales
          </h1>
          <p className="text-xs text-zinc-500">
            Paginas web, rastreadores y soluciones digitales
          </p>
        </div>
      </div>

      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 p-6 sm:p-8 relative overflow-hidden shadow-lg"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-amber-100" />
            <span className="text-amber-100 text-xs font-semibold tracking-wide uppercase">
              Profesional y Rapido
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
            Paginas Web, Rastreadores y Mas
          </h2>
          <p className="text-amber-100 text-sm sm:text-base leading-relaxed max-w-xl">
            Desarrollamos tu pagina web profesional, sistemas de rastreo de paquetes,
            tiendas online y soluciones digitales a medida para tu negocio.
            Presupuesto sin compromiso.
          </p>
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur rounded-full px-3 py-1.5">
              <Mail className="h-3.5 w-3.5 text-white" />
              <span className="text-white text-xs font-medium">Respuesta por correo</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur rounded-full px-3 py-1.5">
              <MessageCircle className="h-3.5 w-3.5 text-white" />
              <span className="text-white text-xs font-medium">Chat interno disponible</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur rounded-full px-3 py-1.5">
              <Zap className="h-3.5 w-3.5 text-white" />
              <span className="text-white text-xs font-medium">Entrega rapida</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 no-scrollbar">
        {CATEGORIAS.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border shrink-0 ${
              activeCategory === cat.value
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent shadow-md'
                : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'
            }`}
          >
            <span>{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-amber-500 animate-spin mb-3" />
          <p className="text-sm text-zinc-400">Cargando servicios...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-amber-400" />
          </div>
          <h3 className="font-semibold text-zinc-700 mb-1">
            {activeCategory ? 'Sin servicios en esta categoria' : 'Proximamente mas servicios'}
          </h3>
          <p className="text-sm text-zinc-400 max-w-sm">
            Estamos trabajando para ofrecerte mas soluciones digitales.
            Contactanos y cuéntanos que necesitas.
          </p>
        </div>
      ) : (
        <>
          {/* Popular Section */}
          {popularServices.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-bold text-zinc-900">Mas Populares</h2>
                <Badge className="bg-amber-100 text-amber-700 text-xs font-medium border-0">
                  {popularServices.length}
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {popularServices.map((service, i) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      index={i}
                      onContact={handleContact}
                      onChat={() => setCurrentView('chat')}
                      getDiscountPercent={getDiscountPercent}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Regular Services */}
          {regularServices.length > 0 && (
            <div className="mb-8">
              {popularServices.length > 0 && (
                <h2 className="text-lg font-bold text-zinc-900 mb-4">
                  Todos los Servicios
                </h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {regularServices.map((service, i) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      index={i}
                      onContact={handleContact}
                      onChat={() => setCurrentView('chat')}
                      getDiscountPercent={getDiscountPercent}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </>
      )}

      {/* Bottom CTA */}
      {!loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-8 p-6 rounded-2xl bg-gradient-to-br from-zinc-50 to-amber-50 border border-amber-100"
        >
          <h3 className="text-zinc-900 font-bold text-base mb-2">
            Necesitas algo personalizado?
          </h3>
          <p className="text-sm text-zinc-500 mb-4">
            Contactanos y te hacemos un presupuesto sin compromiso. Tambien puedes escribirnos por el chat interno.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button
              onClick={() => setContactModal({ id: 0, nombre: 'Consulta personalizada', descripcion: null, precio: 0, precioAntes: null, categoria: 'otros', icono: '💬', activo: true, popular: false, orden: 999 })}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-md"
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar Consulta
            </Button>
            <Button
              onClick={() => setCurrentView('chat')}
              variant="outline"
              className="border-zinc-300 text-zinc-700 hover:bg-zinc-50 font-medium"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat Interno
            </Button>
          </div>
        </motion.div>
      )}

      {/* ========= CONTACT MODAL ========= */}
      <AnimatePresence>
        {contactModal && (
          <ContactFormModal
            service={contactModal}
            currentUser={currentUser}
            sending={sending}
            onClose={() => setContactModal(null)}
            onSubmit={handleSendContact}
            onGoToChat={() => { setContactModal(null); setCurrentView('chat'); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- CONTACT FORM MODAL ----
function ContactFormModal({
  service,
  currentUser,
  sending,
  onClose,
  onSubmit,
  onGoToChat,
}: {
  service: DigitalService;
  currentUser: any;
  sending: boolean;
  onClose: () => void;
  onSubmit: (data: { nombre: string; email: string; telefono: string; mensaje: string }) => void;
  onGoToChat: () => void;
}) {
  const [nombre, setNombre] = useState(currentUser?.nombre || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [telefono, setTelefono] = useState(currentUser?.telefono || '');
  const [mensaje, setMensaje] = useState(
    service.id > 0
      ? `Hola, estoy interesado/a en el servicio "${service.nombre}" ($${service.precio.toFixed(2)}). Me gustaria recibir mas informacion.`
      : ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim() || !mensaje.trim()) {
      toast.error('Completa nombre, email y mensaje');
      return;
    }
    onSubmit({ nombre: nombre.trim(), email: email.trim(), telefono: telefono.trim(), mensaje: mensaje.trim() });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 300, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 300, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-zinc-100 px-5 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="font-bold text-lg text-zinc-900">
              Solicitar Servicio
            </h2>
            {service.id > 0 && (
              <p className="text-xs text-zinc-500">
                {service.nombre} - ${service.precio.toFixed(2)}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Nombre */}
          <div>
            <Label className="text-xs font-medium text-zinc-600 mb-1.5 block">
              Tu nombre *
            </Label>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre completo"
              className="h-11 text-zinc-900"
              required
            />
          </div>

          {/* Email */}
          <div>
            <Label className="text-xs font-medium text-zinc-600 mb-1.5 block">
              Correo electronico *
            </Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="h-11 text-zinc-900"
              required
            />
          </div>

          {/* Telefono */}
          <div>
            <Label className="text-xs font-medium text-zinc-600 mb-1.5 block">
              Telefono
            </Label>
            <Input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="h-11 text-zinc-900"
            />
          </div>

          {/* Mensaje */}
          <div>
            <Label className="text-xs font-medium text-zinc-600 mb-1.5 block">
              Mensaje *
            </Label>
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Describe lo que necesitas, tu negocio, cualquier detalle..."
              className="w-full h-28 px-3 py-2.5 rounded-lg border border-zinc-200 text-sm text-zinc-900 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              required
              maxLength={1000}
            />
            <p className="text-[10px] text-zinc-400 mt-1 text-right">{mensaje.length}/1000</p>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={sending || !nombre.trim() || !email.trim() || !mensaje.trim()}
            className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-sm"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {sending ? 'Enviando...' : 'Enviar Solicitud'}
          </Button>

          {/* Divider */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-zinc-400">o tambien puedes</span>
            </div>
          </div>

          {/* Chat option */}
          <Button
            type="button"
            variant="outline"
            onClick={onGoToChat}
            className="w-full h-11 border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-medium"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Escribir por Chat Interno
            <ChevronRight className="h-4 w-4 ml-auto" />
          </Button>

          <p className="text-[10px] text-center text-zinc-400 mt-1">
            Te responderemos lo antes posible por correo o chat.
          </p>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ---- SERVICE CARD COMPONENT ----
function ServiceCard({
  service,
  index,
  onContact,
  onChat,
  getDiscountPercent,
}: {
  service: DigitalService;
  index: number;
  onContact: (s: DigitalService) => void;
  onChat: () => void;
  getDiscountPercent: (s: DigitalService) => number;
}) {
  const discount = getDiscountPercent(service);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card className="border border-zinc-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group h-full flex flex-col">
        {/* Top colored stripe */}
        <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />

        <div className="p-5 flex-1 flex flex-col">
          {/* Icon + Popular Badge */}
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center text-2xl border border-amber-100">
              {service.icono || '✨'}
            </div>
            <div className="flex items-center gap-1.5">
              {service.popular && (
                <Badge className="bg-amber-100 text-amber-700 text-[10px] font-semibold border-0 px-2 py-0.5">
                  <Star className="h-2.5 w-2.5 mr-0.5" />
                  Popular
                </Badge>
              )}
              {discount > 0 && (
                <Badge className="bg-emerald-100 text-emerald-700 text-[10px] font-bold border-0 px-2 py-0.5">
                  -{discount}%
                </Badge>
              )}
            </div>
          </div>

          {/* Name */}
          <h3 className="text-zinc-900 font-bold text-base mb-1.5 leading-tight group-hover:text-amber-700 transition-colors">
            {service.nombre}
          </h3>

          {/* Description */}
          {service.descripcion && (
            <p className="text-zinc-500 text-sm leading-relaxed mb-4 flex-1">
              {service.descripcion}
            </p>
          )}

          {/* Price Section */}
          <div className="mt-auto">
            <div className="flex items-end gap-2 mb-4">
              <span className="text-2xl font-bold text-zinc-900">
                ${service.precio.toFixed(2)}
              </span>
              {service.precioAntes && service.precioAntes > service.precio && (
                <span className="text-sm text-zinc-400 line-through mb-0.5">
                  ${service.precioAntes.toFixed(2)}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => onContact(service)}
                className="flex-1 h-11 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-sm shadow-md"
              >
                <Send className="h-4 w-4 mr-2" />
                Solicitar
              </Button>
              <Button
                onClick={onChat}
                variant="outline"
                className="h-11 border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
