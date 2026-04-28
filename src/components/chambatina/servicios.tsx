'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from './store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Briefcase,
  Search,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Send,
  Heart,
  Wrench,
  GraduationCap,
  Truck,
  Palette,
  Home as HomeIcon,
  Sparkles,
  Handshake,
  Phone,
  MapPin,
  Clock,
  Filter,
  Loader2,
  Tag,
  Eye,
  Edit3,
  Trash2,
  ImagePlus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

// ---- CONSTANTS ----
const CATEGORIAS = [
  { value: '', label: 'Todas', icon: Search },
  { value: 'hogar', label: 'Hogar', icon: HomeIcon },
  { value: 'tecnologia', label: 'Tecnologia', icon: Sparkles },
  { value: 'belleza', label: 'Belleza', icon: Heart },
  { value: 'educacion', label: 'Educacion', icon: GraduationCap },
  { value: 'transporte', label: 'Transporte', icon: Truck },
  { value: 'alimentos', label: 'Alimentos', icon: Sparkles },
  { value: 'construccion', label: 'Construccion', icon: Wrench },
  { value: 'arte', label: 'Arte', icon: Palette },
  { value: 'salud', label: 'Salud', icon: Heart },
  { value: 'legal', label: 'Legal', icon: Briefcase },
  { value: 'otros', label: 'Otros', icon: Filter },
];

const TIPO_OPTIONS = [
  { value: '', label: 'Todo', color: 'zinc' },
  { value: 'oferta', label: 'Ofrezco', color: 'emerald' },
  { value: 'necesidad', label: 'Necesito', color: 'blue' },
];

interface ServiceItem {
  id: number;
  tipo: string;
  titulo: string;
  descripcion: string | null;
  categoria: string;
  ciudad: string | null;
  precio: string | null;
  contacto: string | null;
  imagenUrl: string | null;
  activo: boolean;
  createdAt: string;
  user: { id: number; nombre: string; ciudad: string | null };
}

const CATEGORIA_LABELS: Record<string, string> = {};
CATEGORIAS.forEach(c => { CATEGORIA_LABELS[c.value] = c.label; });
CATEGORIA_LABELS['general'] = 'General';
CATEGORIA_LABELS['alimentos'] = 'Alimentos';

// ---- MAIN COMPONENT ----
export function Servicios() {
  const currentUser = useAppStore((s) => s.currentUser);
  const [listings, setListings] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null);

  // Form state
  const [formTipo, setFormTipo] = useState<'oferta' | 'necesidad'>('oferta');
  const [formTitulo, setFormTitulo] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategoria, setFormCategoria] = useState('general');
  const [formCiudad, setFormCiudad] = useState('');
  const [formPrecio, setFormPrecio] = useState('');
  const [formContacto, setFormContacto] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formDeleting, setFormDeleting] = useState<number | null>(null);

  // Pagination
  const LIMIT = 20;
  const totalPages = Math.ceil(total / LIMIT);

  const loadListings = useCallback(async (p: number = 1, append: boolean = false) => {
    setLoading(true);
    try {
      let url = `/api/servicios?page=${p}&limit=${LIMIT}`;
      if (filterTipo) url += `&tipo=${filterTipo}`;
      if (filterCat) url += `&categoria=${filterCat}`;
      if (searchTerm) url += `&q=${encodeURIComponent(searchTerm)}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.ok) {
        setListings(append ? (prev) => [...prev, ...json.data] : json.data);
        setTotal(json.pagination.total);
        setPage(p);
      }
    } catch {
      toast.error('Error de conexion');
    } finally {
      setLoading(false);
    }
  }, [filterTipo, filterCat, searchTerm]);

  useEffect(() => {
    loadListings(1);
  }, [filterTipo, filterCat, loadListings]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadListings(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const resetForm = () => {
    setFormTipo('oferta');
    setFormTitulo('');
    setFormDesc('');
    setFormCategoria('general');
    setFormCiudad('');
    setFormPrecio('');
    setFormContacto('');
    setEditingItem(null);
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      toast.error('Debes iniciar sesion para publicar');
      return;
    }
    if (!formTitulo.trim() || formTitulo.trim().length < 3) {
      toast.error('Escribe un titulo (minimo 3 caracteres)');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        tipo: formTipo,
        titulo: formTitulo.trim(),
        descripcion: formDesc.trim() || null,
        categoria: formCategoria,
        ciudad: formCiudad.trim() || null,
        precio: formPrecio.trim() || null,
        contacto: formContacto.trim() || null,
        userId: currentUser.id,
      };

      if (editingItem) {
        // Update
        const res = await fetch('/api/servicios', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingItem.id, userId: currentUser.id, ...payload }),
        });
        const json = await res.json();
        if (json.ok) {
          toast.success('Publicacion actualizada');
          setShowForm(false);
          resetForm();
          loadListings(1);
        } else {
          toast.error(json.error || 'Error al actualizar');
        }
      } else {
        // Create
        const res = await fetch('/api/servicios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.ok) {
          toast.success('Publicado con exito');
          setShowForm(false);
          resetForm();
          loadListings(1);
        } else {
          toast.error(json.error || 'Error al publicar');
        }
      }
    } catch {
      toast.error('Error de conexion');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!currentUser) return;
    setFormDeleting(id);
    try {
      const res = await fetch(`/api/servicios?id=${id}&userId=${currentUser.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.ok) {
        toast.success('Publicacion eliminada');
        loadListings(1);
      } else {
        toast.error(json.error || 'Error al eliminar');
      }
    } catch {
      toast.error('Error de conexion');
    } finally {
      setFormDeleting(null);
    }
  };

  const startEdit = (item: ServiceItem) => {
    setEditingItem(item);
    setFormTipo(item.tipo as 'oferta' | 'necesidad');
    setFormTitulo(item.titulo);
    setFormDesc(item.descripcion || '');
    setFormCategoria(item.categoria);
    setFormCiudad(item.ciudad || '');
    setFormPrecio(item.precio || '');
    setFormContacto(item.contacto || '');
    setShowForm(true);
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const min = Math.floor(diff / 60000);
    const hr = Math.floor(diff / 3600000);
    const day = Math.floor(diff / 86400000);
    if (min < 1) return 'Ahora';
    if (min < 60) return `Hace ${min}m`;
    if (hr < 24) return `Hace ${hr}h`;
    if (day < 30) return `Hace ${day}d`;
    return new Date(dateStr).toLocaleDateString('es-CU', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Handshake className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#18181b' }}>
              Servicios Chambatina
            </h1>
            <p className="text-xs text-zinc-500">
              Encuentra y ofrece servicios en tu comunidad
            </p>
          </div>
        </div>
        <Button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-sm shadow-md"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Publicar
        </Button>
      </div>

      {/* Intro Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-100 p-4 sm:p-5"
      >
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex-1">
            <h2 className="font-bold text-base mb-1" style={{ color: '#18181b' }}>
              Marketplace de Servicios
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Publica lo que ofreces o lo que necesitas. Pintores, electricistas, profesores, 
              manicuristas, transportistas... cualquier servicio. Es gratis y todos pueden verlo.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 rounded-full px-3 py-1.5 text-xs font-medium">
              <Send className="h-3 w-3" />
              Ofrezco
            </div>
            <div className="flex items-center gap-1.5 bg-blue-100 text-blue-700 rounded-full px-3 py-1.5 text-xs font-medium">
              <Search className="h-3 w-3" />
              Necesito
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar servicios... (pintor, electricista, profesor...)"
          className="pl-10 h-11 bg-white border-zinc-200 text-zinc-900"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filters: Tipo + Categoria */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Tipo filter */}
        <div className="flex gap-1 bg-zinc-100 rounded-lg p-1">
          {TIPO_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterTipo(opt.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filterTipo === opt.value
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Category pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIAS.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.value}
                onClick={() => { setFilterCat(filterCat === cat.value ? '' : cat.value); setPage(1); }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                  filterCat === cat.value
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300'
                }`}
              >
                <Icon className="h-3 w-3" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-zinc-400">
          {total} publicacion{total !== 1 ? 'es' : ''}
          {(filterTipo || filterCat || searchTerm) && (
            <button
              onClick={() => { setFilterTipo(''); setFilterCat(''); setSearchTerm(''); }}
              className="ml-2 text-amber-600 hover:text-amber-700 font-medium"
            >
              Limpiar filtros
            </button>
          )}
        </p>
      </div>

      {/* Listings */}
      {loading && listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 text-amber-500 animate-spin mb-3" />
          <p className="text-sm text-zinc-400">Cargando servicios...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
            <Briefcase className="h-8 w-8 text-amber-400" />
          </div>
          <h3 className="font-semibold text-zinc-700 mb-1">
            {searchTerm || filterTipo || filterCat ? 'Sin resultados' : 'Aun no hay publicaciones'}
          </h3>
          <p className="text-sm text-zinc-400 max-w-sm mb-4">
            {searchTerm || filterTipo || filterCat
              ? 'Intenta con otros filtros o terminos de busqueda'
              : 'Sé el primero en publicar un servicio o necesidad'
            }
          </p>
          {!searchTerm && !filterTipo && !filterCat && (
            <Button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="bg-amber-500 hover:bg-amber-600 text-white font-medium"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Crear primera publicacion
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {listings.map((item, i) => {
              const isExpanded = expandedId === item.id;
              const isMine = currentUser && item.user.id === currentUser.id;
              const isOferta = item.tipo === 'oferta';

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card
                    className="border border-zinc-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    <div className="p-4">
                      <div className="flex gap-3">
                        {/* Tipo badge */}
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isOferta
                              ? 'bg-emerald-100 text-emerald-600'
                              : 'bg-blue-100 text-blue-600'
                          }`}
                        >
                          {isOferta ? (
                            <Send className="h-4.5 w-4.5" />
                          ) : (
                            <Search className="h-4.5 w-4.5" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                <Badge
                                  variant="secondary"
                                  className={`text-[10px] font-medium ${
                                    isOferta
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}
                                >
                                  {isOferta ? 'OFREZCO' : 'NECESITO'}
                                </Badge>
                                {item.precio && (
                                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-[10px] font-medium">
                                    <Tag className="h-2.5 w-2.5 mr-0.5" />
                                    {item.precio}
                                  </Badge>
                                )}
                                <Badge variant="secondary" className="bg-zinc-100 text-zinc-500 text-[10px]">
                                  {CATEGORIA_LABELS[item.categoria] || item.categoria}
                                </Badge>
                              </div>
                              <h3
                                className="font-semibold text-sm leading-snug"
                                style={{ color: '#18181b' }}
                              >
                                {item.titulo}
                              </h3>
                            </div>
                            <div className="text-zinc-300 shrink-0 mt-1">
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                          </div>

                          {/* Meta info row */}
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                              <span className="font-medium text-zinc-500">{item.user.nombre}</span>
                            </span>
                            {item.ciudad && (
                              <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                                <MapPin className="h-3 w-3" />
                                {item.ciudad}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                              <Clock className="h-3 w-3" />
                              {formatTimeAgo(item.createdAt)}
                            </span>
                          </div>

                          {/* Expanded details */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-3 pt-3 border-t border-zinc-100">
                                  {item.descripcion && (
                                    <p className="text-sm text-zinc-600 leading-relaxed mb-3">
                                      {item.descripcion}
                                    </p>
                                  )}

                                  <div className="flex flex-wrap gap-3 text-xs">
                                    {item.contacto && (
                                      <div className="flex items-center gap-1.5 text-zinc-500 bg-zinc-50 rounded-lg px-3 py-1.5">
                                        <Phone className="h-3.5 w-3.5 text-zinc-400" />
                                        {item.contacto}
                                      </div>
                                    )}
                                    {item.precio && (
                                      <div className="flex items-center gap-1.5 text-zinc-500 bg-zinc-50 rounded-lg px-3 py-1.5">
                                        <Tag className="h-3.5 w-3.5 text-zinc-400" />
                                        {item.precio}
                                      </div>
                                    )}
                                    {item.user.ciudad && (
                                      <div className="flex items-center gap-1.5 text-zinc-500 bg-zinc-50 rounded-lg px-3 py-1.5">
                                        <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                                        {item.user.ciudad}
                                      </div>
                                    )}
                                  </div>

                                  {/* Owner actions */}
                                  {isMine && (
                                    <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-100">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs h-8"
                                        onClick={(e) => { e.stopPropagation(); startEdit(item); }}
                                      >
                                        <Edit3 className="h-3 w-3 mr-1" />
                                        Editar
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs h-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                        disabled={formDeleting === item.id}
                                      >
                                        {formDeleting === item.id ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <Trash2 className="h-3 w-3 mr-1" />
                                        )}
                                        Eliminar
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Load more / Pagination */}
          {total > LIMIT && (
            <div className="flex items-center justify-center gap-2 pt-4">
              {page < totalPages && (
                <Button
                  variant="outline"
                  onClick={() => loadListings(page + 1, true)}
                  disabled={loading}
                  className="text-sm font-medium"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : null}
                  Ver mas ({total - page * LIMIT} restantes)
                </Button>
              )}
              <p className="text-xs text-zinc-400">
                {Math.min(page * LIMIT, total)} de {total}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========= PUBLISH FORM MODAL ========= */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
            onClick={() => !formSubmitting && setShowForm(false)}
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
                <h2 className="font-bold text-lg" style={{ color: '#18181b' }}>
                  {editingItem ? 'Editar publicacion' : 'Publicar servicio'}
                </h2>
                <button
                  onClick={() => !formSubmitting && setShowForm(false)}
                  className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Tipo selector */}
                <div>
                  <label className="text-xs font-medium text-zinc-600 mb-2 block">
                    Que quieres publicar?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormTipo('oferta')}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        formTipo === 'oferta'
                          ? 'border-emerald-400 bg-emerald-50'
                          : 'border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      <Send className={`h-5 w-5 mx-auto mb-1 ${formTipo === 'oferta' ? 'text-emerald-600' : 'text-zinc-400'}`} />
                      <p className={`text-sm font-medium ${formTipo === 'oferta' ? 'text-emerald-700' : 'text-zinc-500'}`}>
                        Ofrezco
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Publico un servicio</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormTipo('necesidad')}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        formTipo === 'necesidad'
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      <Search className={`h-5 w-5 mx-auto mb-1 ${formTipo === 'necesidad' ? 'text-blue-600' : 'text-zinc-400'}`} />
                      <p className={`text-sm font-medium ${formTipo === 'necesidad' ? 'text-blue-700' : 'text-zinc-500'}`}>
                        Necesito
                      </p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Busco un servicio</p>
                    </button>
                  </div>
                </div>

                {/* Titulo */}
                <div>
                  <label className="text-xs font-medium text-zinc-600 mb-1.5 block">
                    Titulo *
                  </label>
                  <Input
                    value={formTitulo}
                    onChange={(e) => setFormTitulo(e.target.value)}
                    placeholder={formTipo === 'oferta' ? 'Ej: Pintura de interiores y exteriores' : 'Ej: Necesito un electricista'}
                    className="h-11"
                    maxLength={120}
                  />
                  <p className="text-[10px] text-zinc-400 mt-1 text-right">
                    {formTitulo.length}/120
                  </p>
                </div>

                {/* Descripcion */}
                <div>
                  <label className="text-xs font-medium text-zinc-600 mb-1.5 block">
                    Descripcion
                  </label>
                  <textarea
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder={formTipo === 'oferta'
                      ? 'Describe tu servicio, experiencia, que incluye...'
                      : 'Describe lo que necesitas, cuando, donde...'}
                    className="w-full h-28 px-3 py-2.5 rounded-lg border border-zinc-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    maxLength={1000}
                  />
                  <p className="text-[10px] text-zinc-400 mt-1 text-right">
                    {formDesc.length}/1000
                  </p>
                </div>

                {/* Categoria + Ciudad */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-600 mb-1.5 block">
                      Categoria
                    </label>
                    <select
                      value={formCategoria}
                      onChange={(e) => setFormCategoria(e.target.value)}
                      className="w-full h-11 px-3 rounded-lg border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    >
                      {CATEGORIAS.filter(c => c.value).map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-600 mb-1.5 block">
                      Ciudad
                    </label>
                    <Input
                      value={formCiudad}
                      onChange={(e) => setFormCiudad(e.target.value)}
                      placeholder="Ej: La Habana"
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Precio + Contacto */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-600 mb-1.5 block">
                      Precio
                    </label>
                    <Input
                      value={formPrecio}
                      onChange={(e) => setFormPrecio(e.target.value)}
                      placeholder="$20, Negociable, Gratis..."
                      className="h-11"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-600 mb-1.5 block">
                      Contacto
                    </label>
                    <Input
                      value={formContacto}
                      onChange={(e) => setFormContacto(e.target.value)}
                      placeholder="+53 5555 0000"
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-2">
                  <Button
                    onClick={handleSubmit}
                    disabled={formSubmitting || !formTitulo.trim()}
                    className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-sm"
                  >
                    {formSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {editingItem ? 'Guardar cambios' : 'Publicar ahora'}
                  </Button>
                  <p className="text-[10px] text-center text-zinc-400 mt-2">
                    Al publicar, tu nombre sera visible para otros usuarios
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
