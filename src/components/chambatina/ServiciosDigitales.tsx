'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Globe,
  LayoutDashboard,
  Bot,
  FileText,
  GraduationCap,
  Truck,
  MessageCircle,
  DollarSign,
  Star,
  Sparkles,
  ShoppingCart,
  BarChart3,
  Code,
} from 'lucide-react';

// Fallback services in case API fails
const fallbackServices = [
  { id: '1', title: 'Tienda Online', description: 'E-commerce completo con carrito, pagos y panel de administración. Ideal para vender productos físicos o digitales.', category: 'ecommerce', price: 499, tech: 'Next.js, Stripe, Tailwind', featured: true },
  { id: '2', title: 'Dashboard Admin', description: 'Panel de control personalizado con gráficas, reportes y gestión de datos en tiempo real.', category: 'dashboard', price: 399, tech: 'React, Recharts, Prisma', featured: true },
  { id: '3', title: 'Chatbot IA', description: 'Asistente virtual inteligente integrado con tu negocio. Responde preguntas, genera leads y mejora la atención al cliente.', category: 'ai', price: 599, tech: 'OpenAI, Next.js, WebSocket', featured: true },
  { id: '4', title: 'Landing Page', description: 'Página de aterrizaje profesional optimizada para conversiones. Diseño responsivo y moderna.', category: 'landing', price: 199, tech: 'Next.js, Framer Motion', featured: false },
  { id: '5', title: 'Plataforma Clases', description: 'Plataforma educativa con videollamadas, sistema de pagos y gestión de cursos.', category: 'education', price: 699, tech: 'Next.js, WebRTC, Stripe', featured: true },
  { id: '6', title: 'App Delivery', description: 'Aplicación de delivery con tracking en tiempo real, notificaciones y gestión de pedidos.', category: 'delivery', price: 799, tech: 'Next.js, Socket.io, Maps', featured: false },
];

const categoryLabels: Record<string, string> = {
  all: 'Todos',
  ecommerce: 'E-Commerce',
  dashboard: 'Dashboards',
  ai: 'Inteligencia Artificial',
  landing: 'Landing Pages',
  education: 'Educación',
  delivery: 'Delivery',
  web: 'Web',
};

const serviceIcons: Record<string, typeof Globe> = {
  ecommerce: ShoppingCart,
  dashboard: LayoutDashboard,
  ai: Bot,
  landing: FileText,
  education: GraduationCap,
  delivery: Truck,
  web: Globe,
};

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

export default function ServiciosDigitales() {
  const [services, setServices] = useState(fallbackServices);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [calcPages, setCalcPages] = useState('5');
  const [calcType, setCalcType] = useState('landing');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/servicios-web');
        const json = await res.json();
        if (json.ok && json.data && json.data.length > 0) {
          setServices(json.data);
        }
      } catch {
        // Use fallback services
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(services.map((s) => s.category || 'web'));
    return ['all', ...Array.from(cats)];
  }, [services]);

  const filteredServices = useMemo(() => {
    if (activeFilter === 'all') return services;
    return services.filter((s) => s.category === activeFilter);
  }, [services, activeFilter]);

  // Simple price calculator
  const estimatedPrice = useMemo(() => {
    const pages = parseInt(calcPages) || 1;
    const basePrices: Record<string, number> = {
      landing: 199,
      tienda: 499,
      dashboard: 399,
      chatbot: 599,
      plataforma: 699,
    };
    const base = basePrices[calcType] || 199;
    return pages <= 1 ? base : base + (pages - 1) * 99;
  }, [calcPages, calcType]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { window.location.href = '/'; }}
              className="text-zinc-500 hover:text-zinc-900"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-emerald-500" />
              <h1 className="text-lg font-bold text-zinc-900">Servicios Digitales</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            Soluciones Web Profesionales
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 mb-3">
            Transforma tu negocio digital
          </h2>
          <p className="text-zinc-500 max-w-2xl mx-auto">
            Creamos tiendas online, dashboards, chatbots IA, landing pages y más. 
            Soluciones a medida con tecnología moderna.
          </p>
        </motion.div>
      </section>

      {/* Services Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={activeFilter === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter(cat)}
              className={
                activeFilter === cat
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-0'
                  : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }
            >
              {categoryLabels[cat] || cat}
            </Button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service, i) => {
            const IconComp = serviceIcons[service.category || 'web'] || Globe;
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="h-full border border-zinc-100 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <IconComp className="h-6 w-6 text-emerald-500" />
                      </div>
                      {service.featured && (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                          <Star className="h-3 w-3 mr-1" />
                          Destacado
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg text-zinc-900">{service.title}</CardTitle>
                    <CardDescription className="text-sm text-zinc-500 line-clamp-2">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {service.tech && (
                      <div className="flex flex-wrap gap-1">
                        {service.tech.split(',').slice(0, 3).map((t) => (
                          <Badge key={t} variant="secondary" className="text-xs bg-zinc-100 text-zinc-600">
                            {t.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      <div>
                        {service.price ? (
                          <div>
                            <span className="text-2xl font-bold text-emerald-600">${service.price}</span>
                            <span className="text-xs text-zinc-400 ml-1">USD</span>
                          </div>
                        ) : (
                          <span className="text-sm text-zinc-500">Cotizar</span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                        onClick={() => {
                          window.open('https://wa.me/14075550124?text=' + encodeURIComponent(
                            `Hola, me interesa el servicio de ${service.title}`
                          ), '_blank');
                        }}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Consultar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      <Separator className="max-w-7xl mx-auto" />

      {/* Price Calculator */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-2xl font-bold text-zinc-900 mb-6 text-center">Cotizador Rápido</h2>
          <Card className="max-w-xl mx-auto border border-zinc-100 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5 text-emerald-500" />
                Calcula tu presupuesto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Tipo de proyecto</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { value: 'landing', label: 'Landing Page', icon: FileText },
                    { value: 'tienda', label: 'Tienda Online', icon: ShoppingCart },
                    { value: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                    { value: 'chatbot', label: 'Chatbot IA', icon: Bot },
                    { value: 'plataforma', label: 'Plataforma', icon: GraduationCap },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <Button
                        key={opt.value}
                        variant={calcType === opt.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCalcType(opt.value)}
                        className={
                          calcType === opt.value
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-0'
                            : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                        }
                      >
                        <Icon className="h-4 w-4 mr-1" />
                        {opt.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Número de páginas/secciones</label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={calcPages}
                  onChange={(e) => setCalcPages(e.target.value)}
                  className="border-zinc-200 max-w-[200px]"
                />
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600">Presupuesto estimado:</span>
                  <span className="text-2xl font-bold text-emerald-600">${estimatedPrice}</span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">*Precio base. El costo final puede variar según requerimientos.</p>
              </div>
              <Button
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
                onClick={() => {
                  window.open('https://wa.me/14075550124?text=' + encodeURIComponent(
                    `Hola, quiero cotizar un proyecto de tipo ${calcType} con ${calcPages} páginas. Presupuesto estimado: $${estimatedPrice}`
                  ), '_blank');
                }}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Solicitar Cotización por WhatsApp
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Portfolio Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-2xl font-bold text-zinc-900 mb-6 text-center">Portafolio</h2>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="justify-center mb-6">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="ecommerce">E-Commerce</TabsTrigger>
              <TabsTrigger value="saas">SaaS</TabsTrigger>
              <TabsTrigger value="landing">Landing</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Tienda de Ropa Online', type: 'E-Commerce', color: 'from-pink-400 to-rose-400' },
                  { name: 'Dashboard Financiero', type: 'SaaS', color: 'from-blue-400 to-indigo-400' },
                  { name: 'Landing Restaurante', type: 'Landing', color: 'from-amber-400 to-orange-400' },
                  { name: 'Marketplace Digital', type: 'E-Commerce', color: 'from-emerald-400 to-teal-400' },
                  { name: 'CRM Empresarial', type: 'SaaS', color: 'from-violet-400 to-purple-400' },
                  { name: 'Landing Tech Startup', type: 'Landing', color: 'from-cyan-400 to-sky-400' },
                ].map((project, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="overflow-hidden border border-zinc-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                      <div className={`h-40 bg-gradient-to-br ${project.color} flex items-center justify-center`}>
                        <Globe className="h-12 w-12 text-white/60" />
                      </div>
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-zinc-900">{project.name}</h4>
                        <Badge variant="secondary" className="mt-2 text-xs">{project.type}</Badge>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="ecommerce">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Tienda de Ropa Online', color: 'from-pink-400 to-rose-400' },
                  { name: 'Marketplace Digital', color: 'from-emerald-400 to-teal-400' },
                ].map((project, i) => (
                  <Card key={i} className="overflow-hidden border border-zinc-100 shadow-sm">
                    <div className={`h-40 bg-gradient-to-br ${project.color} flex items-center justify-center`}>
                      <ShoppingCart className="h-12 w-12 text-white/60" />
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-zinc-900">{project.name}</h4>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="saas">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Dashboard Financiero', color: 'from-blue-400 to-indigo-400' },
                  { name: 'CRM Empresarial', color: 'from-violet-400 to-purple-400' },
                ].map((project, i) => (
                  <Card key={i} className="overflow-hidden border border-zinc-100 shadow-sm">
                    <div className={`h-40 bg-gradient-to-br ${project.color} flex items-center justify-center`}>
                      <BarChart3 className="h-12 w-12 text-white/60" />
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-zinc-900">{project.name}</h4>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="landing">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Landing Restaurante', color: 'from-amber-400 to-orange-400' },
                  { name: 'Landing Tech Startup', color: 'from-cyan-400 to-sky-400' },
                ].map((project, i) => (
                  <Card key={i} className="overflow-hidden border border-zinc-100 shadow-sm">
                    <div className={`h-40 bg-gradient-to-br ${project.color} flex items-center justify-center`}>
                      <FileText className="h-12 w-12 text-white/60" />
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-zinc-900">{project.name}</h4>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </section>

      {/* WhatsApp CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-8 text-white text-center">
            <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-80" />
            <h3 className="text-2xl font-bold mb-2">¿Tienes un proyecto en mente?</h3>
            <p className="text-emerald-100 mb-6 max-w-md mx-auto">
              Escríbenos por WhatsApp y te ayudamos a hacer realidad tu idea digital.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="font-semibold px-8"
              onClick={() => {
                window.open('https://wa.me/14075550124?text=' + encodeURIComponent(
                  'Hola, quiero información sobre sus servicios digitales'
                ), '_blank');
              }}
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Escribir por WhatsApp
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Mobile Bottom Spacer */}
      <div className="md:hidden h-20" />
    </div>
  );
}
