'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useAppStore, type PublicView, type AdminView } from './store';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Home,
  ShoppingBag,
  Search,
  MessageCircle,
  MessageSquare,
  Menu,
  Lock,
  Handshake,
  LogOut,
  Globe,
  BarChart3,
  ClipboardList,
  Database,
  Settings,
  Brain,
  Palette,
  Store,
  Package,
  Users,
  UserPlus,
  Mail,
  Sparkles,
  Calendar,
  ExternalLink,
} from 'lucide-react';

// ---- PUBLIC NAV ----

const MARKETPLACE_URL = 'https://chambatina-marketplace.onrender.com';

const publicNavItems: { view: PublicView; label: string; icon: typeof Home; external?: string }[] = [
  { view: 'home', label: 'Inicio', icon: Home },
  { view: 'tienda', label: 'Tienda', icon: ShoppingBag },
  { view: 'servicios', label: 'Marketplace', icon: Handshake, external: MARKETPLACE_URL },
  { view: 'rastreador', label: 'Rastreador', icon: Search },
  { view: 'chat', label: 'Chat IA', icon: MessageCircle },
  { view: 'servicios-digitales', label: 'Digitales', icon: Sparkles },
  { view: 'messages', label: 'Mensajes', icon: MessageSquare },
];

function PublicNavbar() {
  const { currentView, setCurrentView, goToAdmin, currentUser, setCurrentUser, setShowRegisterDialog } = useAppStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll unread message count
  useEffect(() => {
    if (!currentUser) return;

    async function fetchUnread() {
      try {
        const res = await fetch(`/api/messages?unread=true&userId=${currentUser.id}`);
        const json = await res.json();
        if (json.ok) setUnreadCount(json.data?.count || 0);
      } catch {}
    }

    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleNav = (view: PublicView) => {
    const item = publicNavItems.find(n => n.view === view);
    if (item?.external) {
      window.open(item.external, '_blank');
      setSheetOpen(false);
      return;
    }
    setCurrentView(view);
    setSheetOpen(false);
  };

  const isActive = (view: PublicView) => currentView === view;

  const handleUserLogout = () => {
    setCurrentUser(null);
  };

  const registerVisit = useCallback((page: string) => {
    if (!currentUser) return;
    try {
      fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, page }),
      });
    } catch { /* silent */ }
  }, [currentUser]);

  // Track page visits
  useEffect(() => {
    if (currentUser) {
      registerVisit('/' + currentView);
    }
  }, [currentView, currentUser, registerVisit]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={() => handleNav('home')}
              className="flex items-center gap-3 hover:opacity-90 transition-opacity"
            >
              <div className="w-11 h-11 rounded-lg bg-orange-50 flex items-center justify-center overflow-hidden">
                <Image src="/logo.png" alt="Chambatina" width={44} height={44} className="object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-zinc-900 tracking-wide">CHAMBATINA</h1>
                <p className="text-[10px] text-orange-500 font-semibold tracking-widest uppercase -mt-0.5">
                  Envíos Internacionales
                </p>
              </div>
            </button>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {publicNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.view);
                const isMessages = item.view === 'messages';
                return (
                  <button
                    key={item.view}
                    onClick={() => handleNav(item.view)}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-orange-50 text-orange-700'
                        : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                    {isMessages && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
              {currentUser ? (
                <div className="ml-2 flex items-center gap-2">
                  <span className="text-sm text-zinc-500 hidden lg:inline">
                    {currentUser.nombre}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUserLogout}
                    className="text-zinc-400 hover:text-red-500 hover:bg-red-50"
                    title="Cerrar sesion"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                onClick={goToAdmin}
                className="text-zinc-300 hover:text-zinc-500 hover:bg-zinc-50"
              >
                <Lock className="h-4 w-4" />
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-zinc-500 hover:text-zinc-900">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-white border-zinc-100 p-0">
                <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg bg-orange-50 flex items-center justify-center overflow-hidden">
                        <Image src="/logo.png" alt="Chambatina" width={44} height={44} className="object-contain" />
                      </div>
                      <div>
                        <h2 className="text-xl font-extrabold text-zinc-900">CHAMBATINA</h2>
                        <p className="text-[10px] text-orange-500 font-semibold tracking-widest uppercase">
                          Envíos Internacionales
                        </p>
                      </div>
                    </div>
                  </div>
                  <nav className="flex-1 p-2">
                    {publicNavItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.view);
                      const isMessages = item.view === 'messages';
                      return (
                        <button
                          key={item.view}
                          onClick={() => handleNav(item.view)}
                          className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                            active
                              ? 'bg-orange-50 text-orange-700'
                              : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          {item.label}
                          {isMessages && unreadCount > 0 && (
                            <span className="absolute top-2 right-3 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                  <div className="p-2 border-t border-zinc-100 space-y-1">
                    {currentUser && (
                      <button
                        onClick={() => { handleUserLogout(); setSheetOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-all duration-200"
                      >
                        <LogOut className="h-5 w-5" />
                        Cerrar Sesion ({currentUser.nombre})
                      </button>
                    )}
                    <button
                      onClick={() => { goToAdmin(); setSheetOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-zinc-300 hover:text-zinc-500 hover:bg-zinc-50 transition-all duration-200"
                      >
                        <Lock className="h-5 w-5" />
                        Administración
                      </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-zinc-100 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-1">
          {publicNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.view);
            const isMessages = item.view === 'messages';
            return (
              <button
                key={item.view}
                onClick={() => handleNav(item.view)}
                className={`relative flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-[10px] font-medium transition-all duration-200 min-w-[56px] ${
                  active
                    ? 'text-orange-600'
                    : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
                {isMessages && unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            );
          })}
          <button
            onClick={goToAdmin}
            className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-[10px] font-medium transition-all duration-200 min-w-[56px] text-zinc-300 hover:text-zinc-500"
          >
            <Lock className="h-5 w-5" />
            <span>Admin</span>
          </button>
        </div>
      </nav>
    </>
  );
}

// ---- ADMIN NAV ----

const adminNavItems: { view: AdminView; label: string; icon: typeof BarChart3; external?: string }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { view: 'pedidos', label: 'Pedidos', icon: ClipboardList },
  { view: 'tracking', label: 'Tracking', icon: Database },
  { view: 'tienda-admin', label: 'Tienda', icon: Store },
  { view: 'servicios-admin', label: 'Marketplace', icon: Handshake, external: 'https://chambatina-marketplace-admin.onrender.com' },
  { view: 'ai-training', label: 'IA Chat', icon: Brain },
  { view: 'apariencia', label: 'Apariencia', icon: Palette },
  { view: 'users', label: 'Usuarios', icon: Users },
  { view: 'leads', label: 'Leads', icon: Mail },
  { view: 'el-tati', label: 'El Tati', icon: Calendar },
  { view: 'servicios-digitales-admin', label: 'Digitales', icon: Sparkles },
  { view: 'messages-admin', label: 'Mensajes', icon: MessageSquare },
  { view: 'config', label: 'Config', icon: Settings },
  { view: 'dashboard', label: 'Envíos CPK', icon: Package, external: 'https://chambatina-forms.onrender.com/admin' },
];

function AdminNavbar() {
  const { adminView, setAdminView, logout, goBackToPublic } = useAppStore();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleNav = (view: AdminView) => {
    const item = adminNavItems.find(n => n.view === view);
    if (item?.external) {
      window.open(item.external, '_blank');
      setSheetOpen(false);
      return;
    }
    setAdminView(view);
    setSheetOpen(false);
  };

  const isActive = (view: AdminView) => {
    if (view === adminView) return true;
    if (view === 'pedidos' && ['pedido-detail', 'pedido-form', 'pedido-edit'].includes(adminView)) return true;
    return false;
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-gradient-to-r from-orange-800 via-orange-700 to-amber-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Admin Badge */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center overflow-hidden">
                <Image src="/logo.png" alt="Chambatina" width={44} height={44} className="object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold text-white tracking-wide">CHAMBATINA</h1>
                  <span className="text-[10px] bg-white/20 text-amber-100 px-2 py-0.5 rounded font-semibold tracking-wide">
                    ADMIN
                  </span>
                </div>
                <p className="text-[10px] text-white/50 font-medium tracking-widest uppercase -mt-0.5">
                  Panel de Administración
                </p>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.view);
                if (item.external) {
                  return (
                    <a
                      key={item.label}
                      href={item.external}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-amber-200 hover:text-white hover:bg-white/10 transition-all duration-200"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden xl:inline">{item.label}</span>
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  );
                }
                return (
                  <button
                    key={item.view}
                    onClick={() => handleNav(item.view)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      active
                        ? 'bg-white/25 text-white'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
              <div className="w-px h-6 bg-white/20 mx-1" />
              <button
                onClick={goBackToPublic}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                <Globe className="h-4 w-4" />
                <span className="hidden xl:inline">Ir al Sitio</span>
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white/50 hover:text-red-300 hover:bg-white/10 transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden xl:inline">Cerrar Sesión</span>
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-white/70 hover:text-white">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-gradient-to-b from-orange-800 to-orange-900 border-orange-700 p-0">
                <SheetTitle className="sr-only">Menú de administración</SheetTitle>
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center overflow-hidden">
                        <Image src="/logo.png" alt="Chambatina" width={40} height={40} className="object-contain" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-extrabold text-white">Admin Panel</h2>
                          <span className="text-[9px] bg-white/20 text-amber-100 px-1.5 py-0.5 rounded font-semibold">
                            ADMIN
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <nav className="flex-1 p-2 overflow-y-auto">
                    {adminNavItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.view);
                      if (item.external) {
                        return (
                          <a
                            key={item.label}
                            href={item.external}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setSheetOpen(false)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-amber-200 hover:text-white hover:bg-white/10 transition-all duration-200"
                          >
                            <Icon className="h-5 w-5" />
                            {item.label}
                            <ExternalLink className="h-4 w-4 ml-auto opacity-60" />
                          </a>
                        );
                      }
                      return (
                        <button
                          key={item.view}
                          onClick={() => handleNav(item.view)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                            active
                              ? 'bg-white/25 text-white'
                              : 'text-white/60 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          {item.label}
                        </button>
                      );
                    })}
                  </nav>
                  <div className="p-2 border-t border-white/10 space-y-1">
                    <button
                      onClick={() => { goBackToPublic(); setSheetOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200"
                    >
                      <Globe className="h-5 w-5" />
                      Ir al Sitio Público
                    </button>
                    <button
                      onClick={() => { logout(); setSheetOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/50 hover:text-red-300 hover:bg-white/10 transition-all duration-200"
                    >
                      <LogOut className="h-5 w-5" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Mobile Admin Bottom Tab Bar - Show first 5 nav items */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-800 to-amber-700 border-t border-orange-600/30 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-1 overflow-x-auto">
          {adminNavItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.view);
            return (
              <button
                key={item.view}
                onClick={() => handleNav(item.view)}
                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-[10px] font-medium transition-all duration-200 min-w-[56px] ${
                  active
                    ? 'text-white'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={goBackToPublic}
            className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-[10px] font-medium transition-all duration-200 min-w-[48px] text-white/30 hover:text-white"
          >
            <Globe className="h-5 w-5" />
            <span>Sitio</span>
          </button>
        </div>
      </nav>
    </>
  );
}

// ---- EXPORTED NAVBAR (switches based on mode) ----

export function Navbar() {
  const mode = useAppStore((s) => s.mode);
  return mode === 'admin' ? <AdminNavbar /> : <PublicNavbar />;
}
