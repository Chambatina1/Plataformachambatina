'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Clock,
  AlertTriangle,
  Gift,
  Truck,
  Info,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  userId?: number;
  type: string;
  title: string;
  message: string;
  pedidoId?: number;
  cpk?: string;
  read: boolean;
  createdAt: string;
}

const typeConfig: Record<string, { color: string; bg: string; icon: typeof Bell; label: string }> = {
  status: { color: 'text-cyan-600', bg: 'bg-cyan-50', icon: Info, label: 'Estado' },
  promo: { color: 'text-amber-600', bg: 'bg-amber-50', icon: Gift, label: 'Promo' },
  entrega: { color: 'text-green-600', bg: 'bg-green-50', icon: Truck, label: 'Entrega' },
  alerta: { color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle, label: 'Alerta' },
};

function getTypeConfig(type: string) {
  return typeConfig[type] || typeConfig.status;
}

function formatTimeAgo(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return format(date, "d MMM", { locale: es });
  } catch {
    return '';
  }
}

// ---- Compact Bell Icon Component ----
export function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userId, setUserId] = useState('');

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch('/api/init');
        const json = await res.json();
        if (json.userId) setUserId(json.userId);
      } catch { /* silent */ }
    }
    init();
  }, []);

  // Load notifications when userId changes
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/notificaciones?userId=${userId}`);
        const json = await res.json();
        if (json.ok && !cancelled) {
          setNotifications(json.data.notifications);
          setUnreadCount(json.data.unreadCount);
        }
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const markAsRead = async (notifId: string) => {
    try {
      await fetch('/api/notificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, notificationId: notifId }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/notificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  const recentNotifs = notifications.slice(0, 5);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative text-zinc-500 hover:text-zinc-900"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {dropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setDropdownOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-80 bg-white border border-zinc-200 rounded-xl shadow-lg z-50 overflow-hidden"
            >
              <div className="p-3 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900">Notificaciones</h3>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-zinc-500 hover:text-zinc-900 h-auto py-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAllRead();
                    }}
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Leer todo
                  </Button>
                )}
              </div>
              <ScrollArea className="max-h-80">
                {recentNotifs.length === 0 ? (
                  <div className="p-6 text-center">
                    <BellOff className="h-8 w-8 text-zinc-200 mx-auto mb-2" />
                    <p className="text-sm text-zinc-400">Sin notificaciones</p>
                  </div>
                ) : (
                  <div>
                    {recentNotifs.map((notif) => {
                      const config = getTypeConfig(notif.type);
                      const Icon = config.icon;
                      return (
                        <button
                          key={notif.id}
                          className={`w-full flex items-start gap-3 p-3 text-left hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0 ${
                            !notif.read ? 'bg-emerald-50/30' : ''
                          }`}
                          onClick={() => {
                            if (!notif.read) markAsRead(notif.id);
                          }}
                        >
                          <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                            <Icon className={`h-4 w-4 ${config.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!notif.read ? 'font-semibold text-zinc-900' : 'text-zinc-700'}`}>
                              {notif.title}
                            </p>
                            <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{notif.message}</p>
                            <p className="text-[10px] text-zinc-400 mt-1">{formatTimeAgo(notif.createdAt)}</p>
                          </div>
                          {!notif.read && (
                            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- Full View Component ----
export default function Notificaciones() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'nuevas' | 'leidas'>('nuevas');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const res = await fetch('/api/init');
        const json = await res.json();
        if (json.userId && !cancelled) {
          setUserId(json.userId);
        }
      } catch { /* silent */ }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  // Load notifications when userId changes
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/notificaciones?userId=${userId}`);
        const json = await res.json();
        if (json.ok && !cancelled) {
          setNotifications(json.data.notifications);
        }
      } catch { /* silent */ }
      finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const markAsRead = async (notifId: string) => {
    try {
      await fetch('/api/notificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, notificationId: notifId }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
      );
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/notificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch { /* silent */ }
  };

  const unreadNotifs = notifications.filter((n) => !n.read);
  const readNotifs = notifications.filter((n) => n.read);
  const displayNotifs = tab === 'nuevas' ? unreadNotifs : readNotifs;

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-emerald-500" />
              <h1 className="text-lg font-bold text-zinc-900">Notificaciones</h1>
              {unreadNotifs.length > 0 && (
                <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                  {unreadNotifs.length} nuevas
                </Badge>
              )}
            </div>
            {unreadNotifs.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-sm text-zinc-500 hover:text-zinc-900"
                onClick={markAllRead}
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Leer todo
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={tab === 'nuevas' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('nuevas')}
            className={
              tab === 'nuevas'
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-0'
                : 'border-zinc-200 text-zinc-600'
            }
          >
            Nuevas ({unreadNotifs.length})
          </Button>
          <Button
            variant={tab === 'leidas' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('leidas')}
            className={
              tab === 'leidas'
                ? 'bg-zinc-800 hover:bg-zinc-900 text-white border-0'
                : 'border-zinc-200 text-zinc-600'
            }
          >
            Leídas ({readNotifs.length})
          </Button>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : displayNotifs.length === 0 ? (
          <div className="text-center py-12">
            <BellOff className="h-12 w-12 text-zinc-200 mx-auto mb-3" />
            <p className="text-zinc-500">
              {tab === 'nuevas' ? 'No hay notificaciones nuevas' : 'No hay notificaciones leídas'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayNotifs.map((notif, i) => {
              const config = getTypeConfig(notif.type);
              const Icon = config.icon;
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={`border border-zinc-100 shadow-sm ${!notif.read ? 'bg-emerald-50/30' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                          <Icon className={`h-5 w-5 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className={`text-sm ${!notif.read ? 'font-semibold text-zinc-900' : 'font-medium text-zinc-700'}`}>
                                {notif.title}
                              </h3>
                              <p className="text-sm text-zinc-500 mt-0.5">{notif.message}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant="secondary" className="text-[10px] bg-zinc-100 text-zinc-500">
                                {config.label}
                              </Badge>
                              {!notif.read && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-zinc-400 hover:text-zinc-600"
                                  onClick={() => markAsRead(notif.id)}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="h-3 w-3 text-zinc-300" />
                            <span className="text-xs text-zinc-400">
                              {format(parseISO(notif.createdAt), "d 'de' MMMM, yyyy HH:mm", { locale: es })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
