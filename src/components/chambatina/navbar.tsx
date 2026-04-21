'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAppStore, type PublicView, type AdminView } from './store';
import { LoginDialog } from './login-dialog';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Home,
  ShoppingBag,
  Search,
  MessageCircle,
  Menu,
  Lock,
  LogOut,
  Globe,
  BarChart3,
  ClipboardList,
  Database,
  Settings,
} from 'lucide-react';

// ---- PUBLIC NAV ----

const publicNavItems: { view: PublicView; label: string; icon: typeof Home }[] = [
  { view: 'home', label: 'Inicio', icon: Home },
  { view: 'tienda', label: 'Tienda', icon: ShoppingBag },
  { view: 'rastreador', label: 'Rastreador', icon: Search },
  { view: 'chat', label: 'Chat IA', icon: MessageCircle },
];

function PublicNavbar() {
  const { currentView, setCurrentView, goToAdmin } = useAppStore();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleNav = (view: PublicView) => {
    setCurrentView(view);
    setSheetOpen(false);
  };

  const isActive = (view: PublicView) => currentView === view;

  return (
    <>
      <header className="sticky top-0 z-50 bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={() => handleNav('home')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center overflow-hidden">
                <Image src="/logo.png" alt="Chambatina" width={36} height={36} className="object-contain" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-wide">CHAMBATINA</h1>
                <p className="text-[10px] text-amber-400 font-medium tracking-widest uppercase -mt-0.5">
                  Envíos Internacionales
                </p>
              </div>
            </button>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {publicNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.view);
                return (
                  <button
                    key={item.view}
                    onClick={() => handleNav(item.view)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
              <Button
                variant="ghost"
                size="sm"
                onClick={goToAdmin}
                className="ml-2 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10"
              >
                <Lock className="h-4 w-4" />
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-zinc-400 hover:text-white">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-zinc-900 border-zinc-800 p-0">
                <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center overflow-hidden">
                        <Image src="/logo.png" alt="Chambatina" width={36} height={36} className="object-contain" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">CHAMBATINA</h2>
                        <p className="text-[10px] text-amber-400 font-medium tracking-widest uppercase">
                          Envíos Internacionales
                        </p>
                      </div>
                    </div>
                  </div>
                  <nav className="flex-1 p-2">
                    {publicNavItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.view);
                      return (
                        <button
                          key={item.view}
                          onClick={() => handleNav(item.view)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                            active
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          {item.label}
                        </button>
                      );
                    })}
                  </nav>
                  <div className="p-2 border-t border-zinc-800">
                    <button
                      onClick={() => { goToAdmin(); setSheetOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-zinc-500 hover:text-amber-400 hover:bg-zinc-800 transition-all duration-200"
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-800 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-1">
          {publicNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.view);
            return (
              <button
                key={item.view}
                onClick={() => handleNav(item.view)}
                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-[10px] font-medium transition-all duration-200 min-w-[56px] ${
                  active
                    ? 'text-amber-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={goToAdmin}
            className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-[10px] font-medium transition-all duration-200 min-w-[56px] text-zinc-600 hover:text-amber-400"
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

const adminNavItems: { view: AdminView; label: string; icon: typeof BarChart3 }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { view: 'pedidos', label: 'Pedidos', icon: ClipboardList },
  { view: 'tracking', label: 'Tracking', icon: Database },
  { view: 'config', label: 'Config', icon: Settings },
];

function AdminNavbar() {
  const { adminView, setAdminView, logout, goBackToPublic } = useAppStore();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleNav = (view: AdminView) => {
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
      <header className="sticky top-0 z-50 bg-zinc-900 border-b border-amber-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Admin Badge */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center overflow-hidden">
                <Image src="/logo.png" alt="Chambatina" width={36} height={36} className="object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-white tracking-wide">CHAMBATINA</h1>
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-semibold tracking-wide">
                    ADMIN
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 font-medium tracking-widest uppercase -mt-0.5">
                  Panel de Administración
                </p>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.view);
                return (
                  <button
                    key={item.view}
                    onClick={() => handleNav(item.view)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
              <div className="w-px h-6 bg-zinc-700 mx-2" />
              <button
                onClick={goBackToPublic}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:text-emerald-400 hover:bg-zinc-800 transition-all duration-200"
              >
                <Globe className="h-4 w-4" />
                <span className="hidden lg:inline">Ir al Sitio</span>
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:inline">Cerrar Sesión</span>
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-zinc-400 hover:text-white">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-zinc-900 border-zinc-800 p-0">
                <SheetTitle className="sr-only">Menú de administración</SheetTitle>
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center overflow-hidden">
                        <Image src="/logo.png" alt="Chambatina" width={32} height={32} className="object-contain" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-white">Admin Panel</h2>
                          <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-semibold">
                            ADMIN
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <nav className="flex-1 p-2">
                    {adminNavItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.view);
                      return (
                        <button
                          key={item.view}
                          onClick={() => handleNav(item.view)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                            active
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          {item.label}
                        </button>
                      );
                    })}
                  </nav>
                  <div className="p-2 border-t border-zinc-800 space-y-1">
                    <button
                      onClick={() => { goBackToPublic(); setSheetOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-zinc-500 hover:text-emerald-400 hover:bg-zinc-800 transition-all duration-200"
                    >
                      <Globe className="h-5 w-5" />
                      Ir al Sitio Público
                    </button>
                    <button
                      onClick={() => { logout(); setSheetOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-all duration-200"
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

      {/* Mobile Admin Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-amber-500/30 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.view);
            return (
              <button
                key={item.view}
                onClick={() => handleNav(item.view)}
                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-[10px] font-medium transition-all duration-200 min-w-[64px] ${
                  active
                    ? 'text-amber-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
          <button
            onClick={goBackToPublic}
            className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-[10px] font-medium transition-all duration-200 min-w-[48px] text-zinc-600 hover:text-emerald-400"
          >
            <Globe className="h-5 w-5" />
            <span>Sitio</span>
          </button>
          <button
            onClick={logout}
            className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-[10px] font-medium transition-all duration-200 min-w-[48px] text-zinc-600 hover:text-red-400"
          >
            <LogOut className="h-5 w-5" />
            <span>Salir</span>
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
