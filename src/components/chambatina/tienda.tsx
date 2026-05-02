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
  Truck, Bike, Box, Sun, Zap, ShoppingCart, ImageIcon, ExternalLink,
  MapPin, ShieldCheck, ChevronRight, ShoppingBag, Link2, Sparkles,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  categoria: string;
  imagenUrl: string | null;
  tiktokUrl: string | null;
  amazonUrl: string | null;
  aliexpressUrl: string | null;
  sheinUrl: string | null;
  mercadoLibreUrl: string | null;
}
interface GroupedProducts { [category: string]: Product[]; }

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof Truck; color: string; bgColor: string }> = {
  envios: { label: 'Envíos', icon: Truck, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  bicicletas: { label: 'Bicicletas', icon: Bike, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  cajas: { label: 'Cajas', icon: Box, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  solar: { label: 'Solar', icon: Sun, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  tiktok: { label: 'TikTok', icon: Zap, color: 'text-pink-600', bgColor: 'bg-pink-100' },
  general: { label: 'General', icon: ShoppingCart, color: 'text-zinc-600', bgColor: 'bg-zinc-100' },
};
const DEFAULT_CONFIG = { label: 'General', icon: ShoppingCart, color: 'text-zinc-600', bgColor: 'bg-zinc-100' };
const fadeIn = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

interface PlatformLink {
  url: string;
  nombre: string;
  icon: string;
  gradient: string;
}

function getPlatformLinks(product: Product): PlatformLink[] {
  const links: PlatformLink[] = [];
  if (product.tiktokUrl) links.push({ url: product.tiktokUrl, nombre: 'TikTok Shop', icon: 'TT', gradient: 'from-zinc-800 via-zinc-900 to-black' });
  if (product.amazonUrl) links.push({ url: product.amazonUrl, nombre: 'Amazon', icon: 'AZ', gradient: 'from-orange-500 to-amber-600' });
  if (product.aliexpressUrl) links.push({ url: product.aliexpressUrl, nombre: 'AliExpress', icon: 'AL', gradient: 'from-red-500 to-red-700' });
  if (product.sheinUrl) links.push({ url: product.sheinUrl, nombre: 'SHEIN', icon: 'SH', gradient: 'from-zinc-800 to-black' });
  if (product.mercadoLibreUrl) links.push({ url: product.mercadoLibreUrl, nombre: 'MercadoLibre', icon: 'ML', gradient: 'from-yellow-400 to-yellow-500' });
  return links;
}

export function Tienda() {
  const { goToNuevoPedido, goToComprar, setCurrentView } = useAppStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [grouped, setGrouped] = useState<GroupedProducts>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('envios');
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/tienda');
        const json = await res.json();
        if (json.ok) {
          setProducts(json.data.products || []);
          setGrouped(json.data.grouped || {});
          const categories = Object.keys(json.data.grouped || {});
          if (categories.length > 0) setActiveTab(categories[0]);
        }
      } catch { toast.error('Error al cargar productos'); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const handleImageError = (productId: number) => { setImgErrors((prev) => new Set(prev).add(productId)); };

  const handleComprar = (product: Product) => {
    goToComprar({
      nombre: product.nombre,
      precio: product.precio,
      categoria: product.categoria,
    });
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}</div>
    </div>
  );

  const categories = Object.keys(grouped);
  const tabConfigs = categories.map((cat) => ({ value: cat, config: CATEGORY_CONFIG[cat] || DEFAULT_CONFIG }));
  const hasProducts = products.length > 0;

  return (
    <motion.div {...fadeIn} transition={{ duration: 0.4 }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">Tienda</h1>
        <p className="text-zinc-500 mt-1">Nuestros productos y servicios con precios actualizados</p>
      </div>

      {/* USA info banner */}
      <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <MapPin className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-900">Chambatina - Winter Park, FL, USA</p>
          <p className="text-xs text-amber-700 mt-0.5">Selecciona <strong>&quot;Lo compramos por ti&quot;</strong> y nosotros nos encargamos. Tu pedido llega directo a nuestra oficina en USA.</p>
        </div>
      </div>

      {/* Hacer Envio - Boton */}
      <div className="mb-6">
        <button
          onClick={() => window.open('https://chambatina-forms.onrender.com', '_blank')}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl p-4 flex items-center gap-3 shadow-lg shadow-orange-500/20 transition-all duration-200 hover:shadow-xl"
        >
          <Package className="h-6 w-6" />
          <div className="text-left">
            <p className="font-bold text-sm">Hacer un Envío</p>
            <p className="text-orange-100 text-xs">Registra tu paquete con SolvedCargo</p>
          </div>
          <ExternalLink className="h-4 w-4 ml-auto opacity-70" />
        </button>
      </div>

      {/* ===== COMPRAR POR PLATAFORMA - SIEMPRE VISIBLE ===== */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <Card className="border-0 shadow-lg overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-black text-white">
          <CardContent className="p-0">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20">
                    <ShoppingBag className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold mb-1">
                      Compra de Cualquier Plataforma
                    </h2>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      Encuentra lo que buscas en TikTok, Amazon, AliExpress, SHEIN, MercadoLibre o cualquier tienda online. Solo pega el link y nosotros compramos por ti.
                    </p>
                    {/* Platform badges */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {['TikTok', 'Amazon', 'AliExpress', 'SHEIN', 'MercadoLibre', 'Temu', 'eBay'].map((name) => (
                        <span
                          key={name}
                          className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-white/10 text-white/80 border border-white/10"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => setCurrentView('compra-plataforma')}
                  className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold px-6 py-5 sm:py-6 text-base shadow-lg shadow-orange-500/30 shrink-0 flex items-center gap-2 min-h-[48px] sm:min-h-[56px] touch-manipulation"
                >
                  <Link2 className="h-5 w-5" />
                  Comprar Ahora
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
            {/* Trust indicators bar */}
            <div className="border-t border-white/10 bg-white/5 px-6 sm:px-8 py-3">
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs text-zinc-400">Compra segura</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-blue-400" />
                  <span className="text-xs text-zinc-400">Envio rastreable</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span className="text-xs text-zinc-400">Proceso facil</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ===== PRODUCTOS DE LA TIENDA ===== */}
      {hasProducts ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-zinc-100 p-1 flex-wrap h-auto gap-1">
            {tabConfigs.map(({ value, config }) => {
              const Icon = config.icon;
              return <TabsTrigger key={value} value={value} className="gap-1.5 data-[state=active]:bg-amber-500 data-[state=active]:text-white"><Icon className="h-4 w-4" />{config.label}</TabsTrigger>;
            })}
          </TabsList>
          {tabConfigs.map(({ value }) => {
            const catProducts = grouped[value] || [];
            return (
              <TabsContent key={value} value={value}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {catProducts.map((product) => {
                    const hasImage = product.imagenUrl && !imgErrors.has(product.id);
                    const platformLinks = getPlatformLinks(product);
                    return (
                      <Card key={product.id} className="border-0 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                        {hasImage ? (
                          <div className="w-full h-44 relative bg-zinc-100"><img src={product.imagenUrl!} alt={product.nombre} className="w-full h-full object-cover" onError={() => handleImageError(product.id)} /></div>
                        ) : (
                          <div className="w-full h-32 flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100"><div className="w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center"><ImageIcon className="h-7 w-7 text-zinc-300" /></div></div>
                        )}
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-lg leading-tight">{product.nombre}</CardTitle>
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs shrink-0">${product.precio.toFixed(2)}</Badge>
                          </div>
                          {product.descripcion && <CardDescription className="text-xs line-clamp-2">{product.descripcion}</CardDescription>}
                        </CardHeader>
                        <CardContent className="pt-0 space-y-2">
                          {/* Primary: Lo compramos por ti */}
                          <button
                            onClick={() => handleComprar(product)}
                            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg text-sm font-semibold transition-colors bg-amber-500 hover:bg-amber-600 text-white min-h-[44px] touch-manipulation"
                          >
                            <ShoppingCart className="h-4 w-4 mr-1.5" />
                            Lo compramos por ti
                          </button>

                          {/* Platform-specific links */}
                          {platformLinks.length > 0 && (
                            <div className="space-y-1.5">
                              {platformLinks.slice(0, 2).map((link) => (
                                <a
                                  key={link.url}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-xs font-semibold transition-all text-white shadow-sm bg-gradient-to-r ${link.gradient} hover:opacity-90 min-h-[40px] touch-manipulation`}
                                >
                                  <span className="font-bold text-[10px]">{link.icon}</span>
                                  Ver en {link.nombre}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ))}
                              {platformLinks.length > 2 && (
                                <button
                                  onClick={() => handleComprar(product)}
                                  className="flex items-center justify-center gap-1 w-full py-1.5 rounded-lg text-xs text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 transition-colors"
                                >
                                  +{platformLinks.length - 2} plataformas mas
                                </button>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      ) : (
        /* ===== SIN PRODUCTOS - Seccion "Proximamente" ===== */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center py-8"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 flex items-center justify-center mx-auto mb-5 shadow-sm">
            <ShoppingBag className="h-10 w-10 text-amber-400" />
          </div>
          <h3 className="text-xl font-bold text-zinc-800">Productos disponibles muy pronto</h3>
          <p className="text-zinc-500 mt-2 max-w-md mx-auto leading-relaxed">
            Estamos preparando nuestra tienda con los mejores productos y precios.
            Mientras tanto, puedes comprar cualquier producto de tu plataforma favorita usando el boton de arriba.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {[
              { icon: Zap, label: 'Envios', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
              { icon: Bike, label: 'Bicicletas', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
              { icon: Box, label: 'Cajas', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
              { icon: Sun, label: 'Solar', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
            ].map(({ icon: Icon, label, color, bg }) => (
              <span key={label} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${color} ${bg} border`}>
                <Icon className="h-3.5 w-3.5" />
                {label}
              </span>
            ))}
          </div>
          <Button
            onClick={() => setCurrentView('compra-plataforma')}
            className="mt-6 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold px-8 py-5 text-sm shadow-lg shadow-orange-500/20 min-h-[48px] touch-manipulation"
          >
            <Link2 className="h-4 w-4 mr-2" />
            Comprar algo ahora desde cualquier plataforma
          </Button>
        </motion.div>
      )}

      <div className="md:hidden h-20" />
    </motion.div>
  );
}
