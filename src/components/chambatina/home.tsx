'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAppStore } from './store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Package,
  Sun,
  Search,
  MapPin,
  Phone,
  Calculator,
  Truck,
  ChevronRight,
  Weight,
  DollarSign,
} from 'lucide-react';
import { calcularEnvio, type EnvioTipo } from '@/lib/chambatina';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

export function Home() {
  const { setCurrentView, goToNuevoPedido } = useAppStore();
  const [calcPeso, setCalcPeso] = useState('');
  const [calcTipo, setCalcTipo] = useState<EnvioTipo>('equipo');

  const calcResult = useMemo(() => {
    const peso = parseFloat(calcPeso);
    if (!peso || peso <= 0) return null;
    return calcularEnvio(peso, calcTipo);
  }, [calcPeso, calcTipo]);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-amber-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-500 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-amber-500 shadow-lg shadow-amber-500/20 mb-6 overflow-hidden">
              <Image src="/logo.png" alt="Chambatina" width={96} height={96} className="object-contain" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-4">
              CHAMBATINA
            </h1>
            <p className="text-lg sm:text-xl text-amber-400 font-medium tracking-wide mb-2">
              Envíos a Cuba & Sistemas Solares
            </p>
            <p className="text-zinc-400 max-w-2xl mx-auto text-sm sm:text-base mb-8">
              Tu puente confiable entre Estados Unidos y Cuba. Enviamos paquetes, bicicletas, 
              electrodomésticos y ofrecemos soluciones de energía solar.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={() => goToNuevoPedido()}
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-8"
              >
                <Package className="h-5 w-5 mr-2" />
                Hacer un Envío
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setCurrentView('rastreador')}
                className="border-zinc-600 text-white hover:bg-zinc-800 px-8"
              >
                <Search className="h-5 w-5 mr-2" />
                Rastrear Paquete
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <motion.div
          variants={stagger}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6"
        >
          <motion.div variants={fadeIn}>
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-0 shadow-md"
              onClick={() => setCurrentView('tienda')}
            >
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-2">
                  <Truck className="h-6 w-6 text-amber-600" />
                </div>
                <CardTitle className="text-lg">Envíos a Cuba</CardTitle>
                <CardDescription className="text-sm">
                  Desde $1.80/libra. Recogemos en tu casa o trae a nuestra oficina.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center text-amber-600 text-sm font-medium">
                  Ver precios <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeIn}>
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-0 shadow-md"
              onClick={() => setCurrentView('tienda')}
            >
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-2">
                  <Sun className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-lg">Sistemas Solares</CardTitle>
                <CardDescription className="text-sm">
                  Asesoría y productos EcoFlow para energía solar en Cuba.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center text-orange-600 text-sm font-medium">
                  Más información <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeIn}>
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border-0 shadow-md"
              onClick={() => setCurrentView('rastreador')}
            >
              <CardHeader className="pb-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-2">
                  <Search className="h-6 w-6 text-emerald-600" />
                </div>
                <CardTitle className="text-lg">Rastreo de Paquetes</CardTitle>
                <CardDescription className="text-sm">
                  Busca por número CPK o carnet de identidad del destinatario.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center text-emerald-600 text-sm font-medium">
                  Rastrear ahora <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* Quick Calculator */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
              <div className="flex items-center gap-3">
                <Calculator className="h-6 w-6" />
                <div>
                  <h2 className="text-xl font-bold">Calculadora de Envío</h2>
                  <p className="text-amber-100 text-sm">Calcula el costo de tu envío al instante</p>
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
                    <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                      type="number"
                      placeholder="Ej: 10"
                      value={calcPeso}
                      onChange={(e) => setCalcPeso(e.target.value)}
                      className="pl-10"
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1.5 block">
                    Tipo de envío
                  </label>
                  <div className="flex gap-2">
                    {([
                      { value: 'equipo' as EnvioTipo, label: 'Equipo' },
                      { value: 'recogida' as EnvioTipo, label: 'Recogida' },
                      { value: 'tiktok' as EnvioTipo, label: 'TikTok' },
                    ]).map((opt) => (
                      <Button
                        key={opt.value}
                        variant={calcTipo === opt.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCalcTipo(opt.value)}
                        className={calcTipo === opt.value ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {calcResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-amber-50 border border-amber-200 rounded-lg p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-amber-600" />
                    <span className="font-semibold text-amber-900">Resultado del Cálculo</span>
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
                      <p className="text-xl font-bold text-amber-600">${calcResult.total.toFixed(2)}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Contact Info */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-amber-500" />
                Información de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-zinc-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Oficina</p>
                    <p className="text-sm text-zinc-500">7523 Aloma Ave, Winter Park, FL 32792, Suite 112</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-zinc-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Teléfonos</p>
                    <p className="text-sm text-zinc-500">Geo: <a href="tel:7869426904" className="text-amber-600 hover:underline">786-942-6904</a></p>
                    <p className="text-sm text-zinc-500">Adriana: <a href="tel:7867846421" className="text-amber-600 hover:underline">786-784-6421</a></p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Mobile Bottom Spacer */}
      <div className="md:hidden h-20" />
    </div>
  );
}
