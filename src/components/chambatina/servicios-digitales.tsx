'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, MessageCircle, Star, Zap } from 'lucide-react';

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
  { value: 'recargas', label: 'Recargas', emoji: '📱' },
  { value: 'envios', label: 'Envíos', emoji: '📦' },
  { value: 'pagos', label: 'Pagos', emoji: '💳' },
  { value: 'tienda', label: 'Tienda', emoji: '🛒' },
  { value: 'otros', label: 'Otros', emoji: '✨' },
];

const WHATSAPP_NUMBER = '17863110000';

// ---- MAIN COMPONENT ----
export function ServiciosDigitales() {
  const [services, setServices] = useState<DigitalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');

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

  const handleBuy = (service: DigitalService) => {
    const message = encodeURIComponent(
      `Hola! Quiero contratar: ${service.nombre} - $${service.precio.toFixed(2)}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
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
            Soluciones digitales rapidas y seguras
          </p>
        </div>
      </div>

      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 p-6 sm:p-8 relative overflow-hidden shadow-lg"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-5 w-5 text-amber-100" />
            <span className="text-amber-100 text-xs font-semibold tracking-wide uppercase">
              Rapido y Seguro
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
            Servicios Digitales para Cuba
          </h2>
          <p className="text-amber-100 text-sm sm:text-base leading-relaxed max-w-xl">
            Recargas, pagos de servicios, envios de dinero, compras en tiendas online y mas.
            Todo desde la comodidad de tu telefono, con entrega rapida garantizada.
          </p>
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur rounded-full px-3 py-1.5">
              <MessageCircle className="h-3.5 w-3.5 text-white" />
              <span className="text-white text-xs font-medium">Atencion por WhatsApp</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur rounded-full px-3 py-1.5">
              <Zap className="h-3.5 w-3.5 text-white" />
              <span className="text-white text-xs font-medium">Entrega inmediata</span>
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
            Estamos trabajando para ofrecerle mas servicios digitales.
            Mientras tanto, contactenos por WhatsApp.
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
                      onBuy={handleBuy}
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
                      onBuy={handleBuy}
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
      {!loading && filtered.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-8 p-6 rounded-2xl bg-gradient-to-br from-zinc-50 to-amber-50 border border-amber-100"
        >
          <h3 className="text-zinc-900 font-bold text-base mb-2">
            No encuentras lo que buscas?
          </h3>
          <p className="text-sm text-zinc-500 mb-4">
            Escribenos por WhatsApp y te ayudamos con cualquier servicio digital que necesites.
          </p>
          <Button
            onClick={() => {
              const msg = encodeURIComponent('Hola! Quiero informacion sobre sus servicios digitales');
              window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
            }}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold shadow-md"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Escribenos por WhatsApp
          </Button>
        </motion.div>
      )}
    </div>
  );
}

// ---- SERVICE CARD COMPONENT ----
function ServiceCard({
  service,
  index,
  onBuy,
  getDiscountPercent,
}: {
  service: DigitalService;
  index: number;
  onBuy: (s: DigitalService) => void;
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

            {/* Buy Button */}
            <Button
              onClick={() => onBuy(service)}
              className="w-full h-11 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Comprar por WhatsApp
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
