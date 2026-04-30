'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  Package,
  Loader2,
  Calendar,
  Truck,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Building,
  Ship,
  Container,
  Warehouse,
  MapPin,
  ClipboardCheck,
  ArrowRightLeft,
  FileCheck,
  RefreshCw,
  Clock,
  Info,
  Globe,
  Zap,
} from 'lucide-react';
import { ETAPAS, calcularProgreso, estimarFechaEtapa } from '@/lib/chambatina';
import { toast } from 'sonner';

interface TrackingResult {
  id: number;
  cpk: string;
  fecha: string | null;
  estado: string;
  descripcion: string | null;
  embarcador: string | null;
  consignatario: string | null;
  carnetPrincipal: string | null;
  rawData: string | null;
  estadoCalculado: string;
  etapaInfo: {
    estado: string;
    descripcion: string;
    color: string;
    diasMin: number;
    diasMax: number;
  };
  _source?: string;
  _isNew?: boolean;
}

interface SearchMeta {
  solvedcargoSource: boolean;
  solvedcargoResults: number;
  totalResults: number;
}

const SEARCH_HINTS = [
  { label: 'Solo número CPK', example: '266228' },
  { label: 'CPK completo', example: 'CPK-0266228' },
  { label: 'Carnet destinatario', example: '88010123456' },
  { label: 'Carnet familiar', example: '90010234567' },
];

// Icons for each stage
const ETAPA_ICONS: Record<string, React.ReactNode> = {
  'EN AGENCIA': <Building className="h-4 w-4" />,
  'TRANSPORTE A NAVIERA': <Truck className="h-4 w-4" />,
  'EN CONTENEDOR': <Container className="h-4 w-4" />,
  'EN TRANSITO': <Ship className="h-4 w-4" />,
  'EN NAVIERA': <Ship className="h-4 w-4" />,
  'DESGRUPE': <Warehouse className="h-4 w-4" />,
  'EN ADUANA': <FileCheck className="h-4 w-4" />,
  'CLASIFICACION': <ClipboardCheck className="h-4 w-4" />,
  'ALMACEN CENTRAL': <Warehouse className="h-4 w-4" />,
  'TRASLADO PROVINCIA': <ArrowRightLeft className="h-4 w-4" />,
  'ALMACEN PROVINCIAL': <Warehouse className="h-4 w-4" />,
  'EN DISTRIBUCION': <Truck className="h-4 w-4" />,
  'ENTREGADO': <CheckCircle2 className="h-4 w-4" />,
};

export function Rastreador() {
  const [searchInput, setSearchInput] = useState('');
  const [results, setResults] = useState<TrackingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchMeta, setSearchMeta] = useState<SearchMeta | null>(null);
  const [searchPhase, setSearchPhase] = useState<'idle' | 'local' | 'solvedcargo'>('idle');

  const handleSearch = useCallback(async () => {
    if (!searchInput.trim()) return;
    setLoading(true);
    setSearched(true);
    setSearchMeta(null);
    setSearchPhase('local');
    try {
      const params = new URLSearchParams({ q: searchInput.trim() });
      const res = await fetch(`/api/tracking/buscar?${params}`);
      const json = await res.json();
      if (json.ok) {
        setResults(json.data || []);
        setSearchMeta(json.meta || null);
        if ((json.data || []).length === 0) {
          toast.info('No se encontraron resultados. Intenta con otro número.');
        } else if (json.meta?.solvedcargoSource) {
          toast.success(`Encontrado en SolvedCargo: ${json.meta.solvedcargoResults} resultado(s)`, {
            description: 'El envío se guardó automáticamente en tu base de datos.',
          });
        }
      } else {
        toast.error(json.error || 'Error en la búsqueda');
        setResults([]);
      }
    } catch {
      toast.error('Error de conexión');
      setResults([]);
    } finally {
      setLoading(false);
      setSearchPhase('idle');
    }
  }, [searchInput]);

  const handleSyncSolvedCargo = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/solvedcargo', { method: 'POST' });
      const json = await res.json();
      if (json.ok) {
        toast.success(`Sincronizado: ${json.synced} envíos (${json.created} nuevos, ${json.updated} actualizados)`);
        // Re-search after sync
        if (searchInput.trim()) {
          handleSearch();
        }
      } else {
        toast.error(json.error || 'Error al sincronizar con SolvedCargo');
      }
    } catch {
      toast.error('Error de conexión con SolvedCargo');
    } finally {
      setSyncing(false);
    }
  }, [searchInput, handleSearch]);

  const getStageForEstado = (estado: string) => {
    const index = ETAPAS.findIndex(e => {
      const eUpper = e.estado.toUpperCase();
      const sUpper = estado.toUpperCase().trim();
      return eUpper === sUpper || sUpper.includes(eUpper) || eUpper.includes(sUpper);
    });
    return index >= 0 ? index : 0;
  };

  // Auto-detect search type hint
  const getSearchTypeHint = (value: string): string => {
    if (!value.trim()) return '';
    const trimmed = value.trim();
    if (/CPK/i.test(trimmed)) return 'CPK';
    const digitsOnly = trimmed.replace(/[^0-9]/g, '');
    if (/^\d{9,12}$/.test(digitsOnly)) return 'Carnet';
    if (/^\d{1,8}$/.test(digitsOnly)) return 'CPK';
    return 'Búsqueda inteligente';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">Rastreador de Paquetes</h1>
        <p className="text-zinc-500 mt-1">
          Busca por número CPK, solo el número, o carnet de identidad del destinatario o familiar.
          Si no está en nuestra base, busca automáticamente en SolvedCargo.
        </p>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-md mb-6 bg-gradient-to-br from-white to-orange-50">
        <CardContent className="p-4 sm:p-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-400" />
              <Input
                placeholder="Número CPK, carnet de identidad..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 border-orange-200 focus:border-orange-400 text-zinc-900"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              {searchInput.trim() && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Badge variant="secondary" className="text-[10px] bg-orange-100 text-orange-600 border-0">
                    {getSearchTypeHint(searchInput)}
                  </Badge>
                </div>
              )}
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
              Buscar
            </Button>
          </div>

          {/* Search hints */}
          <div className="flex flex-wrap gap-2 mt-3">
            {SEARCH_HINTS.map((hint) => (
              <button
                key={hint.label}
                onClick={() => { setSearchInput(hint.example); }}
                className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors"
              >
                {hint.label}: {hint.example}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Loading state - shows search phases */}
      {loading && (
        <div className="space-y-4 mb-6">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-500 ${
                    searchPhase === 'solvedcargo'
                      ? 'bg-blue-100'
                      : 'bg-orange-100'
                  }`}>
                    {searchPhase === 'solvedcargo' ? (
                      <Globe className="h-5 w-5 text-blue-500 animate-pulse" />
                    ) : (
                      <Search className="h-5 w-5 text-orange-500 animate-pulse" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-700">
                    {searchPhase === 'solvedcargo'
                      ? 'Buscando en SolvedCargo...'
                      : 'Buscando en base de datos...'}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {searchPhase === 'solvedcargo'
                      ? 'Consultando el sistema de SolvedCargo directamente'
                      : 'Buscando coincidencias locales por CPK o carnet'}
                  </p>
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-32 w-full rounded-xl" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* No results */}
      {!loading && searched && results.length === 0 && (
        <Card className="border-0 shadow-md mb-6">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-orange-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-zinc-700 mb-1">Sin resultados</h3>
            <p className="text-sm text-zinc-400 mb-4">
              No se encontraron paquetes con ese número ni en nuestra base de datos ni en SolvedCargo.
              Puedes intentar con:
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 mb-4">
              <Badge variant="outline" className="text-xs">Solo los dígitos del CPK</Badge>
              <Badge variant="outline" className="text-xs">Carnet del destinatario</Badge>
              <Badge variant="outline" className="text-xs">Carnet de un familiar</Badge>
              <Badge variant="outline" className="text-xs">CPK con formato completo</Badge>
            </div>
            <p className="text-xs text-zinc-400">
              Si el envío es reciente, puede tardar unas horas en aparecer en el sistema.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <p className="text-sm text-zinc-500">{results.length} resultado(s) encontrado(s)</p>
              {searchMeta?.solvedcargoSource && (
                <Badge className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 border border-blue-200 gap-1">
                  <Globe className="h-3 w-3" />
                  Desde SolvedCargo
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncSolvedCargo}
              disabled={syncing}
              className="text-xs gap-1 border-orange-200 text-orange-700 hover:bg-orange-50"
            >
              <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sync SolvedCargo'}
            </Button>
          </div>
          {results.map((result) => {
            const currentStage = getStageForEstado(result.etapaInfo?.estado || result.estado);
            const progreso = result.fecha ? calcularProgreso(result.fecha) : null;
            const fromSolvedCargo = result._source === 'solvedcargo';
            return (
              <Card key={result.id} className="border-0 shadow-md overflow-hidden">
                {/* SolvedCargo badge in header */}
                <CardHeader className={`pb-3 ${fromSolvedCargo ? 'bg-gradient-to-r from-blue-50 to-indigo-50' : 'bg-gradient-to-r from-orange-50 to-amber-50'}`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Package className="h-5 w-5 text-orange-600" />
                        {result.cpk}
                        {fromSolvedCargo && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-600 border border-blue-200 gap-1">
                            <Zap className="h-3 w-3" />
                            Encontrado en SolvedCargo
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {result.consignatario && `Destinatario: ${result.consignatario}`}
                      </CardDescription>
                    </div>
                    <Badge className="text-sm font-medium px-3 py-1" style={{ backgroundColor: result.etapaInfo?.color || '#f59e0b', color: 'white' }}>
                      {result.estado}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {/* Progress bar */}
                  {progreso && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-zinc-500 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Progreso del envío
                        </span>
                        <span className="font-semibold text-zinc-700">{progreso.porcentaje}%</span>
                      </div>
                      <Progress value={progreso.porcentaje} className="h-2.5" />
                      <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1.5">
                        <span>Día {progreso.diasTranscurridos} de {progreso.diasTotales}</span>
                        <span className="flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          Etapa: {progreso.etapaActual.estado}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {result.fecha && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-orange-400 shrink-0" />
                        <div>
                          <p className="text-xs text-zinc-400">Fecha registro</p>
                          <p className="font-medium">{result.fecha}</p>
                        </div>
                      </div>
                    )}
                    {result.embarcador && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="h-4 w-4 text-orange-400 shrink-0" />
                        <div>
                          <p className="text-xs text-zinc-400">Embarcador</p>
                          <p className="font-medium text-xs">{result.embarcador}</p>
                        </div>
                      </div>
                    )}
                    {result.carnetPrincipal && (
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="h-4 w-4 text-orange-400 shrink-0" />
                        <div>
                          <p className="text-xs text-zinc-400">Carnet</p>
                          <p className="font-mono text-xs">{result.carnetPrincipal}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {result.descripcion && (
                    <div className="bg-orange-50 rounded-lg p-3 mb-6">
                      <p className="text-sm text-zinc-600">
                        <span className="font-medium text-zinc-800">Contenido:</span> {result.descripcion}
                      </p>
                    </div>
                  )}

                  {/* Timeline with 13 stages */}
                  <div>
                    <p className="text-sm font-semibold text-zinc-700 mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-orange-500" />
                      Estado del envío — 13 fases logísticas
                    </p>
                    <div className="space-y-0">
                      {ETAPAS.map((etapa, idx) => {
                        const isCompleted = idx < currentStage;
                        const isCurrent = idx === currentStage;
                        const icon = ETAPA_ICONS[etapa.estado] || <CircleDot className="h-4 w-4" />;

                        return (
                          <motion.div
                            key={etapa.estado}
                            initial={isCurrent ? { scale: 1.02 } : false}
                            animate={isCurrent ? { scale: 1 } : false}
                            transition={{ duration: 0.3 }}
                            className="flex gap-3"
                          >
                            {/* Line & dot */}
                            <div className="flex flex-col items-center">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                                  isCompleted
                                    ? 'bg-emerald-100'
                                    : isCurrent
                                    ? 'bg-orange-100 ring-2 ring-orange-400 shadow-sm shadow-orange-200'
                                    : 'bg-zinc-100'
                                }`}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                ) : isCurrent ? (
                                  <div className="text-orange-600">{icon}</div>
                                ) : (
                                  <div className="text-zinc-300">{icon}</div>
                                )}
                              </div>
                              {idx < ETAPAS.length - 1 && (
                                <div className={`w-0.5 h-8 transition-colors duration-300 ${
                                  isCompleted ? 'bg-emerald-200' : 'bg-zinc-200'
                                }`} />
                              )}
                            </div>
                            {/* Content */}
                            <div className="pb-5 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className={`text-sm font-medium ${isCurrent ? 'text-orange-700' : isCompleted ? 'text-emerald-700' : 'text-zinc-400'}`}>
                                  {etapa.estado}
                                </p>
                                {isCurrent && (
                                  <Badge className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-600 border-0">
                                    Actual
                                  </Badge>
                                )}
                              </div>
                              <p className={`text-xs mt-0.5 leading-relaxed ${isCurrent ? 'text-orange-600' : 'text-zinc-400'}`}>
                                {etapa.descripcion}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                <p className="text-[10px] text-zinc-300">
                                  Días {etapa.diasMin}–{etapa.diasMax < 999 ? etapa.diasMax : '∞'}
                                </p>
                                {result.fecha && (
                                  <p className="text-[10px] text-zinc-300">
                                    ~{estimarFechaEtapa(result.fecha, etapa.diasMin)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="md:hidden h-20" />
    </motion.div>
  );
}

function CircleDot({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}
