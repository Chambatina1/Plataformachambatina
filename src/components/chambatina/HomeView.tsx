'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Package,
  Sun,
  MapPin,
  Phone,
  Calculator,
  Truck,
  ChevronRight,
  Weight,
  DollarSign,
  Sparkles,
  Monitor,
  ShoppingCart,
  Star,
  Quote,
  Zap,
  MessageCircle,
} from 'lucide-react';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const preciosPorLibra: Record<string, number> = {
  recogida: 2.30,
  equipo: 1.99,
  tiktok: 1.80,
};
const cargoEquipo = 25;

function calcularEnvio(peso: number, tipo: string) {
  const precioPorLibra = preciosPorLibra[tipo] || 1.99;
  const subtotal = peso * precioPorLibra;
  const cargo = tipo === 'equipo' ? cargoEquipo : 0;
  return {
    peso,
    tipo,
    precioPorLibra,
    subtotal: Math.round(subtotal * 100) / 100,
    cargoEquipo: cargo,
    total: Math.round((subtotal + cargo) * 100) / 100,
  };
}

const testimonials = [
  { nombre: 'María G.', texto: 'Excelente servicio. Mi paquete llegó a Cuba en menos de 30 días. Muy recomendados.', rating: 5 },
  { nombre: 'Carlos R.', texto: 'La mejor empresa de envíos. Siempre atentos y con precios justos.', rating: 5 },
  { nombre: 'Ana L.', texto: 'Uso Chambatina para todas mis compras de TikTok. Rápido y confiable.', rating: 5 },
];

export default function HomeView() {
  const [calcPeso, setCalcPeso] = useState('');
  const [calcTipo, setCalcTipo] = useState('equipo');

  const calcResult = useMemo(() => {
    const peso = parseFloat(calcPeso);
    if (!peso || peso <= 0) return null;
    return calcularEnvio(peso, calcTipo);
  }, [calcPeso, calcTipo]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute top-10 left-10 w-72 h-72 bg-emerald-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-emerald-50 border border-emerald-100 shadow-lg shadow-emerald-500/5 mb-6 overflow-hidden">
              <Image src="/logo.png" alt="Chambatina" width={96} height={96} className="object-contain" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-zinc-900 tracking-tight mb-4">
              CHAMBATINA
            </h1>
            <p className="text-lg sm:text-xl text-emerald-600 font-semibold tracking-wide mb-2">
              Envíos Internacionales & Sistemas Solares
            </p>
            <p className="text-zinc-500 max-w-2xl mx-auto text-sm sm:text-base mb-8">
              Tu empresa de logística confiable entre Estados Unidos y Latinoamérica.
              Enviamos paquetes, bicicletas, electrodomésticos y ofrecemos soluciones de energía solar.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={() => { window.location.href = '/dashboard-cliente'; }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 shadow-lg shadow-emerald-500/20"
              >
                <Package className="h-5 w-5 mr-2" />
                Mi Panel de Envíos
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => { window.location.href = '/servicios-digitales'; }}
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 px-8"
              >
                <Monitor className="h-5 w-5 mr-2" />
                Servicios Digitales
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 relative z-10">
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6"
        >
          <motion.div variants={fadeIn}>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow border border-zinc-100 shadow-sm bg-white">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-2">
                  <Truck className="h-6 w-6 text-emerald-500" />
                </div>
                <CardTitle className="text-lg text-zinc-900">Envíos Internacionales</CardTitle>
                <CardDescription className="text-sm text-zinc-500">
                  Desde $1.80/libra. Recogemos en tu casa o trae a nuestra oficina.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center text-emerald-600 text-sm font-medium">
                  Ver precios <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeIn}>
            <Card className="cursor-pointer hover:shadow-lg transition-shadow border border-zinc-100 shadow-sm bg-white">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-2">
                  <Sun className="h-6 w-6 text-amber-500" />
                </div>
                <CardTitle className="text-lg text-zinc-900">Sistemas Solares</CardTitle>
                <CardDescription className="text-sm text-zinc-500">
                  Asesoría y productos EcoFlow para energía solar.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center text-amber-600 text-sm font-medium">
                  Más información <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeIn}>
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border border-zinc-100 shadow-sm bg-white"
              onClick={() => { window.location.href = '/servicios-digitales'; }}
            >
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center mb-2">
                  <Monitor className="h-6 w-6 text-cyan-500" />
                </div>
                <CardTitle className="text-lg text-zinc-900">Servicios Digitales</CardTitle>
                <CardDescription className="text-sm text-zinc-500">
                  Tiendas online, dashboards, chatbots IA y más soluciones web.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center text-cyan-600 text-sm font-medium">
                  Explorar servicios <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* Shipping Calculator */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="border border-zinc-100 shadow-md overflow-hidden bg-white">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white">
              <div className="flex items-center gap-3">
                <Calculator className="h-6 w-6" />
                <div>
                  <h2 className="text-xl font-bold">Calculadora de Envío</h2>
                  <p className="text-emerald-100 text-sm">Calcula el costo de tu envío al instante</p>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1.5 block">
                    Peso (libras)
                  </label>
                  <div className="relative">
                    <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                    <Input
                      type="number"
                      placeholder="Ej: 10"
                      value={calcPeso}
                      onChange={(e) => setCalcPeso(e.target.value)}
                      className="pl-10 border-emerald-200 focus:border-emerald-400"
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1.5 block">
                    Tipo de envío
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { value: 'equipo', label: 'Equipo', price: '$1.99/lb + $25' },
                      { value: 'recogida', label: 'Recogida', price: '$2.30/lb' },
                      { value: 'tiktok', label: 'TikTok', price: '$1.80/lb' },
                    ].map((opt) => (
                      <Button
                        key={opt.value}
                        variant={calcTipo === opt.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCalcTipo(opt.value)}
                        className={
                          calcTipo === opt.value
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    {calcTipo === 'equipo' && 'Equipo: $1.99/lb + $25 cargo fijo'}
                    {calcTipo === 'recogida' && 'Recogida a domicilio: $2.30/lb'}
                    {calcTipo === 'tiktok' && 'Compras TikTok: $1.80/lb'}
                  </p>
                </div>
              </div>

              {calcResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-50 border border-emerald-200 rounded-lg p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                    <span className="font-semibold text-emerald-900">Resultado del Cálculo</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-zinc-500">Precio/lb:</span>
                      <p className="font-semibold">${calcResult.precioPorLibra.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500">Subtotal:</span>
                      <p className="font-semibold">${calcResult.subtotal.toFixed(2)}</p>
                    </div>
                    {calcResult.cargoEquipo > 0 && (
                      <div>
                        <span className="text-zinc-500">Cargo equipo:</span>
                        <p className="font-semibold">${calcResult.cargoEquipo.toFixed(2)}</p>
                      </div>
                    )}
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-zinc-500">Total:</span>
                      <p className="text-xl font-bold text-emerald-600">${calcResult.total.toFixed(2)}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-zinc-900 mb-6 text-center">Lo que dicen nuestros clientes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <Card className="h-full border border-zinc-100 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <Quote className="h-5 w-5 text-zinc-200 mb-2" />
                    <p className="text-sm text-zinc-600 mb-4 italic">&ldquo;{t.texto}&rdquo;</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span className="text-emerald-700 text-sm font-semibold">
                          {t.nombre.charAt(0)}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-zinc-700">{t.nombre}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <Separator className="max-w-7xl mx-auto" />

      {/* Contact / CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="border border-zinc-100 shadow-md bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-zinc-900">
                <MapPin className="h-5 w-5 text-emerald-500" />
                Información de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Oficina</p>
                    <p className="text-sm text-zinc-500">7523 Aloma Ave, Winter Park, FL 32792, Suite 112</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Teléfonos</p>
                    <p className="text-sm text-zinc-500">
                      Geo: <a href="tel:7869426904" className="text-emerald-600 hover:underline">786-942-6904</a>
                    </p>
                    <p className="text-sm text-zinc-500">
                      Adriana: <a href="tel:7867846421" className="text-emerald-600 hover:underline">786-784-6421</a>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="mt-6"
          >
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-6 sm:p-8 text-white text-center">
              <Zap className="h-8 w-8 mx-auto mb-3 opacity-80" />
              <h3 className="text-xl sm:text-2xl font-bold mb-2">¿Listo para enviar?</h3>
              <p className="text-emerald-100 text-sm sm:text-base mb-4 max-w-md mx-auto">
                Crea tu envío en minutos y rastrea en tiempo real. Primera envío con descuento especial.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => { window.location.href = '/dashboard-cliente'; }}
                  className="font-semibold px-8"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Comenzar Ahora
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 px-8"
                  onClick={() => { window.location.href = 'https://wa.me/17869426904'; }}
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  WhatsApp
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Mobile Bottom Spacer */}
      <div className="md:hidden h-20" />
    </div>
  );
}
