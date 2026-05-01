'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Plus,
  Star,
  Eye,
  Loader2,
  X,
  Sparkles,
  Users,
  Zap,
  Shield,
  TrendingUp,
  Filter,
  Home,
} from 'lucide-react';

// ==========================================
// Types
// ==========================================
interface ServiceItem {
  id: number;
  tipo: 'oferta' | 'necesidad';
  titulo: string;
  descripcion: string | null;
  categoria: string;
  ciudad: string | null;
  precio: string | null;
  contacto: string | null;
  imagenUrl: string | null;
  activo: boolean;
  createdAt: string;
  user: {
    id: number;
    nombre: string;
    ciudad: string | null;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ==========================================
// Constants
// ==========================================
const CATEGORIAS = [
  { key: 'general', label: 'General', icon: '📦' },
  { key: 'hogar', label: 'Hogar', icon: '🏠' },
  { key: 'tecnologia', label: 'Tecnologia', icon: '💻' },
  { key: 'belleza', label: 'Belleza', icon: '💅' },
  { key: 'educacion', label: 'Educacion', icon: '📚' },
  { key: 'transporte', label: 'Transporte', icon: '🚗' },
  { key: 'alimentos', label: 'Alimentos', icon: '🍔' },
  { key: 'construccion', label: 'Construccion', icon: '🏗️' },
  { key: 'arte', label: 'Arte', icon: '🎨' },
  { key: 'salud', label: 'Salud', icon: '🏥' },
  { key: 'legal', label: 'Legal', icon: '⚖️' },
  { key: 'otros', label: 'Otros', icon: '📌' },
];

const CATEGORIA_MAP: Record<string, string> = {};
CATEGORIAS.forEach((c) => { CATEGORIA_MAP[c.key] = c.label; });

const TIPO_LABELS: Record<string, string> = {
  oferta: 'Ofrezco',
  necesidad: 'Necesito',
};

// ==========================================
// Main Page Component
// ==========================================
export default function MarketplacePage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showPublicar, setShowPublicar] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch services
  const fetchServices = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (selectedCategoria) params.set('categoria', selectedCategoria);
      if (selectedTipo) params.set('tipo', selectedTipo);

      const res = await fetch(`/api/servicios?${params.toString()}`);
      const json = await res.json();
      if (json.ok) {
        setServices(json.data);
        setPagination(json.pagination);
      }
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategoria, selectedTipo]);

  useEffect(() => {
    const timeout = setTimeout(() => fetchServices(1), 300);
    return () => clearTimeout(timeout);
  }, [fetchServices]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchServices(1);
  };

  const handlePageChange = (newPage: number) => {
    fetchServices(newPage);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategoria('');
    setSelectedTipo('');
  };

  const hasActiveFilters = searchQuery.trim() || selectedCategoria || selectedTipo;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-white">
      {/* ========== HEADER ========== */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-orange-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo / Back link */}
          <a
            href="/"
            className="flex items-center gap-2 text-zinc-600 hover:text-orange-600 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <ArrowLeft className="h-4 w-4 text-white" />
            </div>
            <span className="hidden sm:inline text-sm font-medium">Chambatina</span>
          </a>

          {/* Title */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-sm" style={{ color: '#18181b' }}>
              Marketplace
            </span>
          </div>

          {/* Publicar button */}
          <button
            onClick={() => setShowPublicar(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-semibold shadow-md shadow-orange-500/20 transition-all hover:scale-[1.03] active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Publicar</span>
          </button>
        </div>
      </header>

      {/* ========== HERO SECTION ========== */}
      <section className="relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600" />
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 pt-12 pb-14 sm:pt-16 sm:pb-18 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium mb-5">
              <Zap className="h-3 w-3" />
              100% Gratuito
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight">
              Encuentra y ofrece
              <br />
              <span className="text-orange-100">servicios en tu ciudad</span>
            </h1>

            <p className="text-orange-100/80 text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">
              El marketplace de Chambatina conecta personas que ofrecen y necesitan servicios. Publica gratis!
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="max-w-xl mx-auto relative">
              <div className="flex items-center bg-white rounded-2xl shadow-xl shadow-orange-900/20 p-1.5 gap-1.5">
                <div className="flex-1 flex items-center gap-2 px-3">
                  <Search className="h-5 w-5 text-zinc-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar servicios, productos, profesionales..."
                    className="w-full h-10 bg-transparent text-sm outline-none placeholder:text-zinc-400"
                    style={{ color: '#18181b' }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
                >
                  Buscar
                </button>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 60V30C240 0 480 0 720 30C960 60 1200 60 1440 30V60H0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* ========== FILTERS SECTION ========== */}
      <section className="max-w-5xl mx-auto px-4 -mt-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {/* Filter toggle (mobile) */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700 transition-colors sm:hidden"
              >
                <Filter className="h-3.5 w-3.5" />
                Filtros
                {hasActiveFilters && (
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                )}
              </button>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
            {pagination && (
              <span className="text-xs text-zinc-400">
                {pagination.total} {pagination.total === 1 ? 'resultado' : 'resultados'}
              </span>
            )}
          </div>

          {/* Type filter pills */}
          <div className={`space-y-3 ${showFilters ? 'block' : 'hidden sm:block'}`}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedTipo('')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  !selectedTipo
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setSelectedTipo('oferta')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  selectedTipo === 'oferta'
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Ofrezco
              </button>
              <button
                onClick={() => setSelectedTipo('necesidad')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  selectedTipo === 'necesidad'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                Necesito
              </button>
            </div>

            {/* Category pills - scrollable */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIAS.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategoria(selectedCategoria === cat.key ? '' : cat.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                    selectedCategoria === cat.key
                      ? 'bg-orange-100 text-orange-700 border border-orange-200 shadow-sm'
                      : 'bg-white text-zinc-600 border border-zinc-200 hover:border-orange-200 hover:bg-orange-50'
                  }`}
                >
                  <span className="text-sm">{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ========== SERVICE LISTINGS ========== */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-orange-500 animate-spin mb-3" />
            <p className="text-sm text-zinc-400">Cargando servicios...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-orange-400" />
            </div>
            <h3 className="font-bold text-lg mb-2" style={{ color: '#18181b' }}>
              No se encontraron servicios
            </h3>
            <p className="text-sm text-zinc-400 mb-4 max-w-sm">
              Intenta con otros filtros o se el primero en publicar un servicio en tu ciudad.
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 rounded-lg text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {services.map((service, idx) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  isExpanded={expandedId === service.id}
                  onToggle={() => toggleExpand(service.id)}
                  index={idx}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="w-9 h-9 rounded-lg border border-zinc-200 flex items-center justify-center text-sm text-zinc-500 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ←
            </button>
            {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
              let pageNum: number;
              if (pagination.pages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.pages - 2) {
                pageNum = pagination.pages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                    pagination.page === pageNum
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
                      : 'border border-zinc-200 text-zinc-500 hover:bg-zinc-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="w-9 h-9 rounded-lg border border-zinc-200 flex items-center justify-center text-sm text-zinc-500 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              →
            </button>
          </div>
        )}
      </section>

      {/* ========== CTA SECTION ========== */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 p-8 sm:p-12"
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium mb-5">
              <Star className="h-3 w-3" />
              Registrate gratis
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 leading-tight">
              Unete a Chambatina
            </h2>
            <p className="text-orange-100/80 text-sm sm:text-base max-w-lg mx-auto mb-8 leading-relaxed">
              Crea una cuenta para publicar servicios, gestionar tus anuncios, chatear con
              otros usuarios, rastrear envios y mucho mas. Todo en un solo lugar.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-orange-600 font-bold text-sm shadow-lg hover:shadow-xl transition-all hover:scale-[1.03] active:scale-[0.98]"
              >
                <Home className="h-4 w-4" />
                Ir a Chambatina
              </a>
              <button
                onClick={() => setShowPublicar(true)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/15 backdrop-blur-sm text-white font-bold text-sm border border-white/25 hover:bg-white/25 transition-all"
              >
                <Plus className="h-4 w-4" />
                Publicar un servicio
              </button>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10">
              {[
                { icon: Shield, label: 'Seguro' },
                { icon: Zap, label: 'Rapido' },
                { icon: Users, label: 'Comunidad' },
                { icon: TrendingUp, label: 'Crecimiento' },
              ].map((feature) => (
                <div key={feature.label} className="text-center">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mx-auto mb-2">
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-medium text-white/80">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="border-t border-zinc-100 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: '#18181b' }}>Chambatina Marketplace</p>
                <p className="text-xs text-zinc-400">Servicios y oportunidades en tu ciudad</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-zinc-400">
              <a href="/" className="hover:text-orange-500 transition-colors">
                Inicio
              </a>
              <span>|</span>
              <span>&copy; {new Date().getFullYear()} Chambatina</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ========== PUBLICAR MODAL ========== */}
      <AnimatePresence>
        {showPublicar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
            onClick={() => setShowPublicar(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-5 text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
                  <Plus className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">Publicar un servicio</h3>
                <p className="text-orange-100/80 text-xs mt-1">
                  Registrate en la plataforma para publicar
                </p>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <p className="text-sm text-zinc-600 text-center leading-relaxed">
                  Para publicar un servicio en el marketplace, necesitas una cuenta de Chambatina.
                  Es gratis y toma solo unos segundos.
                </p>

                <div className="space-y-2">
                  {[
                    'Publica ofertas y necesidades',
                    'Recibe mensajes de interesados',
                    'Gestiona tus anuncios',
                    'Accede a envios y mas',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-zinc-600">
                      <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                        <Zap className="h-3 w-3 text-orange-500" />
                      </div>
                      {item}
                    </div>
                  ))}
                </div>

                <a
                  href="/"
                  className="block w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm text-center shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Ir a Chambatina y registrarme
                </a>

                <button
                  onClick={() => setShowPublicar(false)}
                  className="block w-full py-3 rounded-xl text-sm font-medium text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  Despues
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// Service Card Component
// ==========================================
function ServiceCard({
  service,
  isExpanded,
  onToggle,
  index,
}: {
  service: ServiceItem;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}) {
  const isOferta = service.tipo === 'oferta';
  const catLabel = CATEGORIA_MAP[service.categoria] || service.categoria;
  const catEmoji = CATEGORIAS.find((c) => c.key === service.categoria)?.icon || '📌';

  const timeAgo = getTimeAgo(service.createdAt);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-white rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md transition-all overflow-hidden group"
    >
      {/* Image */}
      {service.imagenUrl ? (
        <div className="relative h-40 bg-zinc-100 overflow-hidden">
          <img
            src={service.imagenUrl}
            alt={service.titulo}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Badges on image */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md ${
                isOferta
                  ? 'bg-emerald-500/90 text-white'
                  : 'bg-rose-500/90 text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              {TIPO_LABELS[service.tipo]}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-medium text-zinc-700">
              {catEmoji} {catLabel}
            </span>
          </div>
        </div>
      ) : (
        <div className="relative h-28 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
          <span className="text-4xl">{catEmoji}</span>
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isOferta
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {TIPO_LABELS[service.tipo]}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white text-[10px] font-medium text-zinc-600 border border-zinc-200">
              {catLabel}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <h3
          className="font-bold text-sm mb-1.5 line-clamp-2 leading-snug"
          style={{ color: '#18181b' }}
        >
          {service.titulo}
        </h3>

        {/* Price */}
        {service.precio && (
          <div className="mb-2">
            <span className="inline-flex items-center gap-1 text-sm font-bold text-orange-600">
              <span className="text-xs text-zinc-400">$</span>
              {service.precio}
            </span>
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 text-[11px] text-zinc-400 mb-3">
          {service.user?.nombre && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {service.user.nombre}
            </span>
          )}
          {service.ciudad && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {service.ciudad}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo}
          </span>
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-3 border-t border-zinc-100">
                {service.descripcion && (
                  <p className="text-xs text-zinc-600 leading-relaxed mb-3">
                    {service.descripcion}
                  </p>
                )}
                {service.contacto && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-400">Contacto:</span>
                    <span className="font-medium text-zinc-700">{service.contacto}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expand button */}
        <button
          onClick={onToggle}
          className="mt-2 w-full flex items-center justify-center gap-1 text-xs text-orange-500 hover:text-orange-600 font-medium py-1 transition-colors"
        >
          {isExpanded ? (
            <>
              Ver menos <ChevronUp className="h-3 w-3" />
            </>
          ) : (
            <>
              <Eye className="h-3 w-3" /> Ver detalles <ChevronDown className="h-3 w-3" />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

// ==========================================
// Utility: Relative time
// ==========================================
function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Ahora';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}sem`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mes`;
  return `${Math.floor(months / 12)}a`;
}
