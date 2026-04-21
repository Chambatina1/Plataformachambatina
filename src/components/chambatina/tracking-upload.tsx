'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from './store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Upload,
  Loader2,
  Trash2,
  Search,
  Package,
  CheckCircle2,
  AlertCircle,
  Database,
} from 'lucide-react';
import { toast } from 'sonner';

interface TrackingEntry {
  id: number;
  cpk: string;
  fecha: string | null;
  estado: string;
  descripcion: string | null;
  embarcador: string | null;
  consignatario: string | null;
  carnetPrincipal: string | null;
  createdAt: string;
}

export function TrackingUpload() {
  const [tsvData, setTsvData] = useState('');
  const [uploading, setUploading] = useState(false);
  const [entries, setEntries] = useState<TrackingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [clearDialog, setClearDialog] = useState(false);
  const [clearing, setClearing] = useState(false);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tracking');
      const json = await res.json();
      if (json.ok) setEntries(json.data);
    } catch {
      toast.error('Error al cargar tracking');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleUpload = async () => {
    if (!tsvData.trim()) return;
    setUploading(true);
    try {
      const res = await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bloque: tsvData }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(`${json.count} CPK(s) cargados exitosamente`);
        setTsvData('');
        fetchEntries();
      } else {
        toast.error(json.error || 'Error al procesar datos');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setUploading(false);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      const res = await fetch('/api/tracking', { method: 'DELETE' });
      const json = await res.json();
      if (json.ok) {
        toast.success('Todos los datos de tracking eliminados');
        setEntries([]);
        setClearDialog(false);
      } else {
        toast.error(json.error || 'Error al eliminar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setClearing(false);
    }
  };

  const filteredEntries = entries.filter(
    (e) =>
      e.cpk.toLowerCase().includes(filter.toLowerCase()) ||
      (e.consignatario && e.consignatario.toLowerCase().includes(filter.toLowerCase())) ||
      (e.estado && e.estado.toLowerCase().includes(filter.toLowerCase()))
  );

  const getEstadoColor = (estado: string) => {
    const e = estado.toUpperCase();
    if (e.includes('ENTREGADO')) return 'bg-emerald-100 text-emerald-700';
    if (e.includes('TRANSITO') || e.includes('TRÁNSITO')) return 'bg-blue-100 text-blue-700';
    if (e.includes('ADUANA')) return 'bg-purple-100 text-purple-700';
    if (e.includes('PENDIENTE') || e.includes('DESGRUPE')) return 'bg-amber-100 text-amber-700';
    if (e.includes('DISTRIBUCION')) return 'bg-cyan-100 text-cyan-700';
    return 'bg-zinc-100 text-zinc-700';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 flex items-center gap-2">
          <Database className="h-7 w-7 text-amber-500" />
          Cargar Tracking
        </h1>
        <p className="text-zinc-500 mt-1">Pega datos TSV para actualizar el rastreo de paquetes</p>
      </div>

      {/* Upload Section */}
      <Card className="border-0 shadow-md mb-6">
        <CardHeader>
          <CardTitle className="text-base">Pegar Datos de Rastreo</CardTitle>
          <CardDescription>
            Pega los datos TSV directamente desde la hoja de cálculo. Los datos se analizarán automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder={`CHAMBATINA MIAMI\tGEO MIA\t\tCPK-0264397\tPENDIENTE DESAGRUPE\t...\nCHAMBATINA MIAMI\tGEO MIA\t\tCPK-0255247\tENTREGADO\t...`}
            value={tsvData}
            onChange={(e) => setTsvData(e.target.value)}
            rows={6}
            className="font-mono text-xs"
          />
          <div className="flex flex-col sm:flex-row gap-2 mt-3">
            <Button
              onClick={handleUpload}
              disabled={uploading || !tsvData.trim()}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Cargar Datos
            </Button>
            {entries.length > 0 && (
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => setClearDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpiar Datos ({entries.length})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status message */}
      {entries.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 mb-4 px-1">
          <CheckCircle2 className="h-4 w-4" />
          <span className="font-medium">{entries.length} CPK(s) en la base de datos</span>
        </div>
      )}

      {/* Filter */}
      {entries.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Filtrar por CPK, nombre o estado..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Entries Table */}
      <Card className="border-0 shadow-md overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filteredEntries.length > 0 ? (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow className="bg-zinc-50">
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>CPK</TableHead>
                    <TableHead className="hidden sm:table-cell">Estado</TableHead>
                    <TableHead className="hidden md:table-cell">Consignatario</TableHead>
                    <TableHead className="hidden lg:table-cell">Carnet</TableHead>
                    <TableHead className="hidden sm:table-cell">Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry, idx) => (
                    <TableRow key={entry.id} className="hover:bg-zinc-50">
                      <TableCell className="text-xs text-zinc-400">{idx + 1}</TableCell>
                      <TableCell className="font-mono text-sm font-medium text-amber-700">
                        {entry.cpk}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge className={`${getEstadoColor(entry.estado)} text-xs font-medium`}>
                          {entry.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-zinc-600 max-w-[200px] truncate">
                        {entry.consignatario || '-'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-zinc-500 font-mono">
                        {entry.carnetPrincipal || '-'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-zinc-400">
                        {entry.fecha || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : entries.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="h-12 w-12 text-zinc-200 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">No hay datos de tracking cargados</p>
              <p className="text-zinc-400 text-xs mt-1">
                Pega los datos TSV arriba para comenzar
              </p>
            </div>
          ) : (
            <div className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-zinc-200 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">No hay resultados para el filtro</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clear Dialog */}
      <Dialog open={clearDialog} onOpenChange={setClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar todos los datos de tracking?</DialogTitle>
            <DialogDescription>
              Se eliminarán {entries.length} entrada(s) de tracking de forma permanente. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleClear} disabled={clearing}>
              {clearing ? 'Eliminando...' : 'Eliminar Todo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="md:hidden h-20" />
    </motion.div>
  );
}
