'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from './store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Truck,
  Bike,
  Box,
  Sun,
  Zap,
  Phone,
  ShoppingCart,
} from 'lucide-react';
import { toast } from 'sonner';

interface TiendaProduct {
  envios: {
    nombre: string;
    items: {
      id: string;
      nombre: string;
      descripcion: string;
      precio: number;
      unidad: string;
      cargoAdicional: string | null;
      formula: string | null;
    }[];
  };
  bicicletas: {
    nombre: string;
    items: {
      id: string;
      nombre: string;
      descripcion: string;
      precio: number;
    }[];
  };
  cajas: {
    nombre: string;
    items: {
      id: string;
      nombre: string;
      descripcion: string;
      precio: number;
    }[];
  };
  solar: {
    nombre: string;
    items: {
      id: string;
      nombre: string;
      descripcion: string;
      precio: number;
      unidad: string;
    }[];
  };
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export function Tienda() {
  const { goToNuevoPedido, setCurrentView } = useAppStore();
  const [data, setData] = useState<TiendaProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/tienda');
        const json = await res.json();
        if (json.ok) setData(json.data);
      } catch {
        toast.error('Error al cargar productos');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const handleSolicitar = (productName: string) => {
    toast.info(`Contacta a la oficina para ${productName}`);
    setCurrentView('chat');
  };

  return (
    <motion.div
      {...fadeIn}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">Tienda de Servicios</h1>
        <p className="text-zinc-500 mt-1">Todos nuestros productos y servicios con precios actualizados</p>
      </div>

      <Tabs defaultValue="envios" className="space-y-6">
        <TabsList className="bg-zinc-100 p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="envios" className="gap-1.5 data-[state=active]:bg-amber-500 data-[state=active]:text-white">
            <Truck className="h-4 w-4" /> Envíos
          </TabsTrigger>
          <TabsTrigger value="bicicletas" className="gap-1.5 data-[state=active]:bg-amber-500 data-[state=active]:text-white">
            <Bike className="h-4 w-4" /> Bicicletas
          </TabsTrigger>
          <TabsTrigger value="cajas" className="gap-1.5 data-[state=active]:bg-amber-500 data-[state=active]:text-white">
            <Box className="h-4 w-4" /> Cajas
          </TabsTrigger>
          <TabsTrigger value="solar" className="gap-1.5 data-[state=active]:bg-amber-500 data-[state=active]:text-white">
            <Sun className="h-4 w-4" /> Solar
          </TabsTrigger>
        </TabsList>

        {/* Envíos Tab */}
        <TabsContent value="envios">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.envios.items.map((item) => (
              <Card key={item.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Truck className="h-5 w-5 text-amber-600" />
                    </div>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
                      ${item.precio.toFixed(2)}/{item.unidad}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mt-2">{item.nombre}</CardTitle>
                  <CardDescription>{item.descripcion}</CardDescription>
                </CardHeader>
                <CardContent>
                  {item.cargoAdicional && (
                    <p className="text-xs text-amber-600 mb-2 font-medium">{item.cargoAdicional}</p>
                  )}
                  {item.formula && (
                    <p className="text-xs text-zinc-400 mb-3 italic">Fórmula: {item.formula}</p>
                  )}
                  <Button
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={() => goToNuevoPedido()}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Solicitar Envío
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Bicicletas Tab */}
        <TabsContent value="bicicletas">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.bicicletas.items.map((item) => (
              <Card key={item.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Bike className="h-5 w-5 text-orange-600" />
                    </div>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
                      ${item.precio}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mt-2">{item.nombre}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={() => handleSolicitar(item.nombre)}
                  >
                    Solicitar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Cajas Tab */}
        <TabsContent value="cajas">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.cajas.items.map((item) => (
              <Card key={item.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Box className="h-5 w-5 text-blue-600" />
                    </div>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
                      ${item.precio}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mt-2">{item.nombre}</CardTitle>
                  <CardDescription>{item.descripcion}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={() => goToNuevoPedido()}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Solicitar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Solar Tab */}
        <TabsContent value="solar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.solar.items.map((item) => (
              <Card key={item.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                      {item.id === 'ecoflow' ? (
                        <Zap className="h-5 w-5 text-yellow-600" />
                      ) : (
                        <Sun className="h-5 w-5 text-yellow-600" />
                      )}
                    </div>
                    {item.precio === 0 && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs">
                        {item.unidad}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg mt-2">{item.nombre}</CardTitle>
                  <CardDescription>{item.descripcion}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={() => setCurrentView('chat')}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Consultar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="md:hidden h-20" />
    </motion.div>
  );
}
