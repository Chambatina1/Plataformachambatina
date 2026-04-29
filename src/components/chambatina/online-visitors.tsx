'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Eye,
  Monitor,
  Globe,
  Clock,
  Wifi,
  WifiOff,
  MapPin,
  Phone,
  Smartphone,
  Laptop,
} from 'lucide-react';

interface OnlineUser {
  id: number;
  userId: number;
  sessionId: string;
  page: string | null;
  userAgent: string | null;
  ip: string | null;
  lastSeen: string;
  user: {
    id: number;
    nombre: string;
    email: string;
    telefono: string | null;
    ciudad: string | null;
  };
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 10) return 'ahora';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h`;
}

function detectDevice(ua: string | null): { icon: typeof Smartphone; label: string } {
  if (!ua) return { icon: Monitor, label: 'Desconocido' };
  if (/iPhone|Android.*Mobile/i.test(ua)) return { icon: Smartphone, label: 'Mobile' };
  if (/iPad|Android(?!.*Mobile)/i.test(ua)) return { icon: Smartphone, label: 'Tablet' };
  return { icon: Laptop, label: 'Desktop' };
}

const PAGE_LABELS: Record<string, string> = {
  '/': 'Inicio',
  '/tienda': 'Tienda',
  '/rastreador': 'Rastreador',
  '/chat': 'Chat IA',
  '/servicios': 'Servicios',
  '/compra-plataforma': 'Compra',
};

function getPageLabel(page: string | null): string {
  if (!page) return 'Inicio';
  return PAGE_LABELS[page] || page.replace(/^\//, '');
}

export function OnlineVisitorsPanel() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOnline = useCallback(async () => {
    try {
      const res = await fetch('/api/presence');
      const json = await res.json();
      if (json.ok) {
        setOnlineUsers(json.data || []);
        setError(false);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOnline();
    intervalRef.current = setInterval(fetchOnline, 10000); // Refresh every 10s
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchOnline]);

  return (
    <Card className="border-0 shadow-md overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Eye className="h-4 w-4 text-emerald-600" />
            </div>
            Visitantes en Linea
          </CardTitle>
          {!loading && !error && (
            <Badge className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5">
              {onlineUsers.length} {onlineUsers.length === 1 ? 'persona' : 'personas'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-3.5 w-28 mb-1.5" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <WifiOff className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-xs text-zinc-400">No se pudo cargar datos de presencia</p>
          </div>
        ) : onlineUsers.length === 0 ? (
          <div className="p-6 text-center">
            <Users className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">Nadie esta viendo la plataforma ahora</p>
            <p className="text-xs text-zinc-300 mt-1">Los visitantes aparecen aqui en tiempo real</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {onlineUsers.map((ou) => {
              const device = detectDevice(ou.userAgent);
              const DeviceIcon = device.icon;
              const pageLabel = getPageLabel(ou.page);

              return (
                <div
                  key={ou.sessionId}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors"
                >
                  {/* Online indicator */}
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                      {ou.user.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-zinc-900 truncate">
                        {ou.user.nombre}
                      </p>
                      <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-600 px-1.5 shrink-0">
                        {pageLabel}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <DeviceIcon className="h-3 w-3" />
                        {device.label}
                      </span>
                      {ou.user.telefono && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {ou.user.telefono}
                        </span>
                      )}
                      {ou.user.ciudad && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {ou.user.ciudad}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Last seen */}
                  <div className="flex flex-col items-end shrink-0">
                    <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                      <Wifi className="h-3 w-3" />
                      Activo
                    </span>
                    <span className="text-[10px] text-zinc-400 mt-0.5">
                      {timeAgo(ou.lastSeen)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && onlineUsers.length > 0 && (
          <div className="px-4 py-2 bg-zinc-50 border-t border-zinc-100">
            <p className="text-[10px] text-zinc-400 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Se actualiza cada 10 segundos. Los usuarios se marcan inactivos tras 2 min de inactividad.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
