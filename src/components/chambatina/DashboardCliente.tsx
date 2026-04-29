'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  DollarSign,
  User,
  Mail,
  Phone,
  MapPin,
  Edit3,
  BarChart3,
  CircleDot,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface UserData {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
}

interface PedidoItem {
  id: number;
  nombreComprador: string;
  nombreDestinatario: string;
  producto: string;
  estado: string;
  plataforma?: string;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  totalEnvios: number;
  enTransito: number;
  entregados: number;
  gastoTotal: number;
}

interface MonthlyData {
  month: string;
  total: number;
  count: number;
}

const estadoColors: Record<string, string> = {
  pendiente: 'bg-amber-100 text-amber-700',
  procesando: 'bg-blue-100 text-blue-700',
  en_almacen: 'bg-purple-100 text-purple-700',
  en_transito: 'bg-cyan-100 text-cyan-700',
  entregado: 'bg-green-100 text-green-700',
};

const estadoLabels: Record<string, string> = {
  pendiente: 'Pendiente',
  procesando: 'Procesando',
  en_almacen: 'En Almacén',
  en_transito: 'En Tránsito',
  entregado: 'Entregado',
};

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

export default function DashboardCliente() {
  const [userId, setUserId] = useState('');
  const [user, setUser] = useState<UserData | null>(null);
  const [pedidos, setPedidos] = useState<PedidoItem[]>([]);
  const [stats, setStats] = useState<Stats>({ totalEnvios: 0, enTransito: 0, entregados: 0, gastoTotal: 0 });
  const [monthlySpending, setMonthlySpending] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPedido, setSelectedPedido] = useState<PedidoItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ nombre: '', telefono: '', direccion: '' });

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch('/api/init');
        const json = await res.json();
        if (json.userId) {
          setUserId(json.userId);
        }
      } catch {
        // Error fetching init
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/dashboard?userId=${userId}`);
        const json = await res.json();
        if (json.ok && !cancelled) {
          setUser(json.data.user);
          setPedidos(json.data.pedidos);
          setStats(json.data.stats);
          setMonthlySpending(json.data.monthlySpending);
          setEditForm({
            nombre: json.data.user.nombre,
            telefono: json.data.user.telefono || '',
            direccion: json.data.user.direccion || '',
          });
        }
      } catch {
        // Error loading dashboard
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const handlePedidoClick = (pedido: PedidoItem) => {
    setSelectedPedido(pedido);
    setSheetOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-zinc-500">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
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
              <BarChart3 className="h-5 w-5 text-emerald-500" />
              <h1 className="text-lg font-bold text-zinc-900">Mi Panel de Envíos</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Profile Card */}
        {user && (
          <motion.div {...fadeIn}>
            <Card className="border border-zinc-100 shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                      <span className="text-emerald-700 text-xl font-bold">
                        {user.nombre.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-zinc-900">{user.nombre}</h2>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </span>
                        {user.telefono && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {user.telefono}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="border-zinc-200">
                        <Edit3 className="h-4 w-4 mr-1" />
                        Editar Perfil
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Perfil</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-2">
                        <div>
                          <Label className="text-sm font-medium">Nombre</Label>
                          <Input
                            value={editForm.nombre}
                            onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Teléfono</Label>
                          <Input
                            value={editForm.telefono}
                            onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Dirección</Label>
                          <Input
                            value={editForm.direccion}
                            onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <Button
                          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                          onClick={() => {
                            setUser({ ...user, ...editForm });
                            setEditDialogOpen(false);
                          }}
                        >
                          Guardar Cambios
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Envíos', value: stats.totalEnvios, icon: Package, color: 'text-emerald-500', bg: 'bg-emerald-50' },
            { label: 'En Tránsito', value: stats.enTransito, icon: Truck, color: 'text-cyan-500', bg: 'bg-cyan-50' },
            { label: 'Entregados', value: stats.entregados, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
            { label: 'Gasto Total', value: `$${stats.gastoTotal}`, icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-50' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="border border-zinc-100 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                        <Icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">{stat.label}</p>
                        <p className="text-xl font-bold text-zinc-900">{stat.value}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Monthly Chart */}
        {monthlySpending.length > 0 && (
          <motion.div {...fadeIn}>
            <Card className="border border-zinc-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-500" />
                  Envíos por Mes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlySpending}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#a1a1aa" />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #e4e4e7',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Bar dataKey="total" name="Envíos" radius={[4, 4, 0, 0]}>
                        {monthlySpending.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={index === monthlySpending.length - 1 ? '#10b981' : '#d1fae5'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Orders Table */}
        <motion.div {...fadeIn}>
          <Card className="border border-zinc-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Mis Envíos</CardTitle>
              <CardDescription>{pedidos.length} envíos registrados</CardDescription>
            </CardHeader>
            <CardContent>
              {pedidos.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-zinc-200 mx-auto mb-3" />
                  <p className="text-zinc-500">No tienes envíos registrados aún</p>
                  <Button
                    className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white"
                    onClick={() => { window.location.href = '/'; }}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Hacer un Envío
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-white">
                        <tr className="border-b border-zinc-100">
                          <th className="text-left py-3 px-3 font-medium text-zinc-500">ID</th>
                          <th className="text-left py-3 px-3 font-medium text-zinc-500">Destinatario</th>
                          <th className="text-left py-3 px-3 font-medium text-zinc-500">Producto</th>
                          <th className="text-left py-3 px-3 font-medium text-zinc-500">Estado</th>
                          <th className="text-left py-3 px-3 font-medium text-zinc-500">Fecha</th>
                          <th className="text-left py-3 px-3 font-medium text-zinc-500"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {pedidos.map((pedido) => (
                          <tr
                            key={pedido.id}
                            className="border-b border-zinc-50 hover:bg-zinc-50 cursor-pointer transition-colors"
                            onClick={() => handlePedidoClick(pedido)}
                          >
                            <td className="py-3 px-3 text-zinc-400">#{pedido.id}</td>
                            <td className="py-3 px-3 text-zinc-700 font-medium">{pedido.nombreDestinatario}</td>
                            <td className="py-3 px-3 text-zinc-500 max-w-[200px] truncate">{pedido.producto}</td>
                            <td className="py-3 px-3">
                              <Badge
                                className={
                                  estadoColors[pedido.estado.toLowerCase().replace(/\s/g, '_')] ||
                                  'bg-zinc-100 text-zinc-600'
                                }
                              >
                                {estadoLabels[pedido.estado.toLowerCase().replace(/\s/g, '_')] || pedido.estado}
                              </Badge>
                            </td>
                            <td className="py-3 px-3 text-zinc-400">
                              {format(parseISO(pedido.createdAt), "d MMM yy", { locale: es })}
                            </td>
                            <td className="py-3 px-3">
                              <ArrowLeft className="h-4 w-4 text-zinc-300 rotate-180" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Order Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md bg-white">
          <SheetHeader>
            <SheetTitle>Detalle del Envío #{selectedPedido?.id}</SheetTitle>
          </SheetHeader>
          {selectedPedido && (
            <div className="space-y-6 mt-4">
              {/* Status Timeline */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-700">Estado del Envío</h3>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-zinc-100" />
                  {[
                    { label: 'Pedido Recibido', done: true },
                    { label: 'En Procesamiento', done: ['pendiente'].includes(selectedPedido.estado.toLowerCase()) },
                    { label: 'En Tránsito', done: ['en_transito', 'entregado'].includes(selectedPedido.estado.toLowerCase().replace(/\s/g, '_')) },
                    { label: 'Entregado', done: selectedPedido.estado.toLowerCase().replace(/\s/g, '_') === 'entregado' },
                  ].map((step, i) => (
                    <div key={i} className="relative flex items-start gap-3 pb-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                        step.done ? 'bg-emerald-500' : 'bg-zinc-100'
                      }`}>
                        {step.done ? (
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        ) : (
                          <CircleDot className="h-4 w-4 text-zinc-300" />
                        )}
                      </div>
                      <div className="pt-1">
                        <p className={`text-sm font-medium ${step.done ? 'text-zinc-900' : 'text-zinc-400'}`}>
                          {step.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Order Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-700">Información del Envío</h3>
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-zinc-500">Destinatario</span>
                    <span className="text-sm font-medium text-zinc-900">{selectedPedido.nombreDestinatario}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-zinc-500">Producto</span>
                    <span className="text-sm font-medium text-zinc-900 max-w-[200px] text-right truncate">{selectedPedido.producto}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-zinc-500">Estado</span>
                    <Badge
                      className={
                        estadoColors[selectedPedido.estado.toLowerCase().replace(/\s/g, '_')] ||
                        'bg-zinc-100 text-zinc-600'
                      }
                    >
                      {estadoLabels[selectedPedido.estado.toLowerCase().replace(/\s/g, '_')] || selectedPedido.estado}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-zinc-500">Fecha</span>
                    <span className="text-sm font-medium text-zinc-900">
                      {format(parseISO(selectedPedido.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Mobile Bottom Spacer */}
      <div className="md:hidden h-20" />
    </div>
  );
}
