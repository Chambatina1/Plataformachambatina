'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAppStore, type ViewType } from './store';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Home,
  ShoppingBag,
  ClipboardList,
  Search,
  MessageCircle,
  Menu,
} from 'lucide-react';

const navItems: { view: ViewType; label: string; icon: typeof Home }[] = [
  { view: 'home', label: 'Inicio', icon: Home },
  { view: 'tienda', label: 'Tienda', icon: ShoppingBag },
  { view: 'pedidos', label: 'Pedidos', icon: ClipboardList },
  { view: 'rastreador', label: 'Rastreador', icon: Search },
  { view: 'chat', label: 'Chat', icon: MessageCircle },
];

export function Navbar() {
  const { currentView, setCurrentView, sidebarOpen, setSidebarOpen } = useAppStore();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleNav = (view: ViewType) => {
    setCurrentView(view);
    setSheetOpen(false);
  };

  const isActive = (view: ViewType) => {
    if (view === currentView) return true;
    if (view === 'pedidos' && ['pedido-detail', 'pedido-form', 'pedido-edit'].includes(currentView)) return true;
    return false;
  };

  return (
    <>
      {/* Desktop Header */}
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
                  Envíos a Cuba
                </p>
              </div>
            </button>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
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
                          Envíos a Cuba
                        </p>
                      </div>
                    </div>
                  </div>
                  <nav className="flex-1 p-2">
                    {navItems.map((item) => {
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
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-800 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-1">
          {navItems.map((item) => {
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
        </div>
      </nav>
    </>
  );
}
