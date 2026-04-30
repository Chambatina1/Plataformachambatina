'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card, CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Plus, Pencil, Trash2, Loader2, Sparkles, Save, Star, Eye, EyeOff, GripVertical,
} from 'lucide-react';
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
  createdAt: string;
  updatedAt: string;
}

interface ServiceForm {
  nombre: string;
  descripcion: string;
  precio: string;
  precioAntes: string;
  categoria: string;
  icono: string;
  activo: boolean;
  popular: boolean;
  orden: string;
}

const EMPTY_FORM: ServiceForm = {
  nombre: '',
  descripcion: '',
  precio: '',
  precioAntes: '',
  categoria: 'general',
  icono: '',
  activo: true,
  popular: false,
  orden: '0',
};

const CATEGORIAS = [
  { value: 'recargas', label: 'Recargas' },
  { value: 'envios', label: 'Envíos' },
  { value: 'pagos', label: 'Pagos' },
  { value: 'tienda', label: 'Tienda' },
  { value: 'otros', label: 'Otros' },
  { value: 'general', label: 'General' },
];

const CATEGORIA_COLORS: Record<string, string> = {
  recargas: 'bg-blue-100 text-blue-700',
  envios: 'bg-amber-100 text-amber-700',
  pagos: 'bg-emerald-100 text-emerald-700',
  tienda: 'bg-purple-100 text-purple-700',
  otros: 'bg-zinc-100 text-zinc-700',
  general: 'bg-zinc-100 text-zinc-700',
};

const EMOJI_OPTIONS = [
  '💬', '📱', '💡', '🛒', '📦', '💸', '💰', '🏦', '📲', '🖥️',
  '🎮', '🎵', '📺', '📸', '🎫', '🏠', '🚗', '✈️', '🎁', '⭐',
  '🔥', '💎', '🔔', '📡', '💳', '🌐', '📊', '🎯', '🛡️', '⚡',
];

function safeErrorMessage(err: unknown): string {
  if (typeof err === 'string') return err;
  if (typeof err === 'object' && err !== null) {
    try { return Object.values(err as Record<string, unknown>).flat().map(String).join(', '); } catch { /* fall through */ }
  }
  return 'Error desconocido';
}

// ---- MAIN COMPONENT ----
export function ServiciosDigitalesAdmin() {
  const [services, setServices] = useState<DigitalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const loadServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/servicios-digitales?all=true');
      const json = await res.json();
      if (json.ok) setServices(json.data || []);
      else toast.error(safeErrorMessage(json.error || 'Error al cargar servicios'));
    } catch {
      toast.error('Error de conexion');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowEmojiPicker(false);
    setDialogOpen(true);
  };

  const openEdit = (service: DigitalService) => {
    setEditingId(service.id);
    setForm({
      nombre: service.nombre,
      descripcion: service.descripcion || '',
      precio: String(service.precio),
      precioAntes: service.precioAntes ? String(service.precioAntes) : '',
      categoria: service.categoria,
      icono: service.icono || '',
      activo: service.activo,
      popular: service.popular,
      orden: String(service.orden),
    });
    setShowEmojiPicker(false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    const precio = parseFloat(form.precio);
    if (isNaN(precio) || precio < 0) {
      toast.error('Precio no valido');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        precio,
        precioAntes: form.precioAntes ? parseFloat(form.precioAntes) : null,
        categoria: form.categoria,
        icono: form.icono || null,
        activo: form.activo,
        popular: form.popular,
        orden: parseInt(form.orden) || 0,
      };

      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch('/api/servicios-digitales', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(editingId ? 'Servicio actualizado' : 'Servicio creado');
        setDialogOpen(false);
        loadServices();
      } else {
        toast.error(safeErrorMessage(json.error || 'Error al guardar'));
      }
    } catch {
      toast.error('Error de conexion');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/servicios-digitales?id=${deleteId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.ok) {
        toast.success('Servicio eliminado');
        setDeleteId(null);
        loadServices();
      } else {
        toast.error(safeErrorMessage(json.error || 'Error al eliminar'));
      }
    } catch {
      toast.error('Error de conexion');
    } finally {
      setDeleting(false);
    }
  };

  const toggleActive = async (service: DigitalService) => {
    try {
      const res = await fetch('/api/servicios-digitales', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: service.id, activo: !service.activo }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(service.activo ? 'Servicio desactivado' : 'Servicio activado');
        loadServices();
      }
    } catch {
      toast.error('Error de conexion');
    }
  };

  const togglePopular = async (service: DigitalService) => {
    try {
      const res = await fetch('/api/servicios-digitales', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: service.id, popular: !service.popular }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(service.popular ? 'Quitado de populares' : 'Marcado como popular');
        loadServices();
      }
    } catch {
      toast.error('Error de conexion');
    }
  };

  const filtered = filterCat === 'all'
    ? services
    : services.filter((s) => s.categoria === filterCat);

  const getCategoriaLabel = (val: string) =>
    CATEGORIAS.find((c) => c.value === val)?.label || val;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-amber-500" />
            Servicios Digitales
          </h2>
          <p className="text-sm text-muted-foreground">
            Gestiona los servicios digitales disponibles para los clientes
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-amber-500 hover:bg-amber-600 text-white font-semibold"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Servicio
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: services.length, bg: 'bg-amber-50' },
          { label: 'Activos', value: services.filter((s) => s.activo).length, bg: 'bg-emerald-50' },
          { label: 'Inactivos', value: services.filter((s) => !s.activo).length, bg: 'bg-zinc-50' },
          { label: 'Populares', value: services.filter((s) => s.popular).length, bg: 'bg-amber-50' },
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className={`p-3 sm:p-4 ${stat.bg} rounded-xl`}>
              <p className="text-xl sm:text-2xl font-bold text-zinc-900">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium">Filtrar:</span>
        <Button
          size="sm"
          variant={filterCat === 'all' ? 'default' : 'outline'}
          className={filterCat === 'all' ? 'bg-amber-500 hover:bg-amber-600 text-white text-xs' : 'text-xs'}
          onClick={() => setFilterCat('all')}
        >
          Todos
        </Button>
        {CATEGORIAS.map((cat) => (
          <Button
            key={cat.value}
            size="sm"
            variant={filterCat === cat.value ? 'default' : 'outline'}
            className={filterCat === cat.value ? 'bg-amber-500 hover:bg-amber-600 text-white text-xs' : 'text-xs'}
            onClick={() => setFilterCat(cat.value)}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Table */}
      <Card className="border-0 shadow-md overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-zinc-400">
              <Sparkles className="h-10 w-10 mx-auto mb-3 text-zinc-300" />
              <p className="text-sm">
                No hay servicios {filterCat !== 'all' ? 'en esta categoria' : ''}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-50">
                    <TableHead className="w-12">Orden</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                    <TableHead className="hidden md:table-cell">Precio</TableHead>
                    <TableHead className="hidden lg:table-cell">Icono</TableHead>
                    <TableHead>Popular</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filtered.map((service) => (
                      <motion.tr
                        key={service.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-b hover:bg-zinc-50 transition-colors"
                      >
                        <TableCell className="font-mono text-xs text-zinc-400">
                          <div className="flex items-center gap-1">
                            <GripVertical className="h-3 w-3 text-zinc-300" />
                            {service.orden}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-lg shrink-0 border border-amber-100">
                              {service.icono || '✨'}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-zinc-900">{service.nombre}</p>
                              {service.descripcion && (
                                <p className="text-xs text-zinc-400 max-w-[200px] truncate hidden sm:block">
                                  {service.descripcion}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${CATEGORIA_COLORS[service.categoria] || 'bg-zinc-100 text-zinc-700'}`}
                          >
                            {getCategoriaLabel(service.categoria)}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-zinc-900">
                              ${service.precio.toFixed(2)}
                            </span>
                            {service.precioAntes && (
                              <span className="text-xs text-zinc-400 line-through">
                                ${service.precioAntes.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-lg">
                          {service.icono || '—'}
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => togglePopular(service)}
                            className="p-1.5 rounded-lg hover:bg-amber-50 transition-colors"
                            title={service.popular ? 'Quitar de populares' : 'Marcar como popular'}
                          >
                            <Star
                              className={`h-4 w-4 transition-colors ${
                                service.popular
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-zinc-300'
                              }`}
                            />
                          </button>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => toggleActive(service)}
                            className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
                            title={service.activo ? 'Desactivar' : 'Activar'}
                          >
                            {service.activo ? (
                              <Eye className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-zinc-400" />
                            )}
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-zinc-500 hover:text-amber-600"
                              onClick={() => openEdit(service)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-zinc-500 hover:text-red-600"
                              onClick={() => setDeleteId(service.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-zinc-900">
              {editingId ? 'Editar Servicio Digital' : 'Nuevo Servicio Digital'}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Modifica los datos del servicio digital'
                : 'Completa los datos para crear un nuevo servicio digital'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Nombre */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-zinc-700">Nombre *</Label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Recarga Telegram"
                className="h-11"
              />
            </div>

            {/* Descripcion */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-zinc-700">Descripcion</Label>
              <Textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Describe el servicio..."
                rows={3}
              />
            </div>

            {/* Precio + Precio Antes */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-zinc-700">Precio (USD) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.precio}
                  onChange={(e) => setForm({ ...form, precio: e.target.value })}
                  placeholder="5.00"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-zinc-700">Precio Antes (tachado)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.precioAntes}
                  onChange={(e) => setForm({ ...form, precioAntes: e.target.value })}
                  placeholder="7.00 (opcional)"
                  className="h-11"
                />
              </div>
            </div>

            {/* Categoria + Orden */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-zinc-700">Categoria</Label>
                <Select
                  value={form.categoria}
                  onValueChange={(val) => setForm({ ...form, categoria: val })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-zinc-700">Orden</Label>
                <Input
                  type="number"
                  value={form.orden}
                  onChange={(e) => setForm({ ...form, orden: e.target.value })}
                  placeholder="0"
                  className="h-11"
                />
              </div>
            </div>

            {/* Icono (Emoji Picker) */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-zinc-700">Icono (Emoji)</Label>
              <div className="relative">
                <div
                  className="flex items-center gap-3 h-11 px-3 rounded-lg border border-zinc-200 bg-white cursor-pointer hover:border-zinc-300 transition-colors"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <span className="text-xl">{form.icono || '✨'}</span>
                  <span className="text-sm text-zinc-400">
                    {form.icono ? form.icono : 'Haz clic para seleccionar'}
                  </span>
                </div>
                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -5, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -5, height: 0 }}
                      className="absolute z-10 mt-1 p-3 bg-white border border-zinc-200 rounded-xl shadow-lg w-full"
                    >
                      <div className="grid grid-cols-10 gap-1.5">
                        {EMOJI_OPTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setForm({ ...form, icono: emoji });
                              setShowEmojiPicker(false);
                            }}
                            className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg hover:bg-amber-50 transition-colors ${
                              form.icono === emoji
                                ? 'bg-amber-100 ring-2 ring-amber-400'
                                : ''
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t border-zinc-100">
                        <Input
                          value={form.icono}
                          onChange={(e) => setForm({ ...form, icono: e.target.value })}
                          placeholder="O escribe un emoji directamente..."
                          className="h-8 text-sm"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50">
                <Switch
                  checked={form.activo}
                  onCheckedChange={(val) => setForm({ ...form, activo: val })}
                />
                <div>
                  <Label className="text-sm font-medium text-zinc-900 cursor-pointer">
                    Servicio activo
                  </Label>
                  <p className="text-xs text-zinc-500">
                    Los servicios inactivos no se muestran al publico
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50">
                <Switch
                  checked={form.popular}
                  onCheckedChange={(val) => setForm({ ...form, popular: val })}
                />
                <div>
                  <Label className="text-sm font-medium text-zinc-900 cursor-pointer flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-500" />
                    Marcar como popular
                  </Label>
                  <p className="text-xs text-zinc-500">
                    Los populares se muestran destacados en la pagina publica
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-zinc-100">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.nombre.trim()}
              className="bg-amber-500 hover:bg-amber-600 text-white font-medium"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {editingId ? 'Actualizar' : 'Crear'}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={() => !deleting && setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-zinc-900">Eliminar Servicio</DialogTitle>
            <DialogDescription>
              Esta accion no se puede deshacer. El servicio sera eliminado permanentemente.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile bottom spacing */}
      <div className="md:hidden h-20" />
    </motion.div>
  );
}
