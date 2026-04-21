'use client';

import { usePedidosStore, type ViewType } from '@/components/pedidos/pedidos-provider';
import { Dashboard } from '@/components/pedidos/dashboard';
import { PedidosList } from '@/components/pedidos/pedidos-list';
import { PedidoForm } from '@/components/pedidos/pedido-form';
import { PedidoDetail } from '@/components/pedidos/pedido-detail';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  Package,
} from 'lucide-react';

const navItems: { view: ViewType; label: string; icon: typeof LayoutDashboard }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'lista', label: 'Pedidos', icon: ClipboardList },
  { view: 'crear', label: 'Nuevo Pedido', icon: PlusCircle },
];

export default function Home() {
  const { currentView, setCurrentView } = usePedidosStore();

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'lista':
        return <PedidosList />;
      case 'crear':
        return <PedidoForm mode="create" />;
      case 'editar':
        return <PedidoForm mode="edit" />;
      case 'detalle':
        return <PedidoDetail />;
      default:
        return <Dashboard />;
    }
  };

  // Check if we're in a "sub-view" that should show a back indicator
  const isSubView = ['detalle', 'editar'].includes(currentView);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* App Name */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground">
                <Package className="h-5 w-5" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold leading-tight">
                  Gestión de Pedidos
                </h1>
                <p className="text-xs text-muted-foreground leading-tight">
                  Sistema de administración
                </p>
              </div>
              <h1 className="sm:hidden text-lg font-bold">Pedidos</h1>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.view === currentView ||
                  (item.view === 'lista' && (currentView === 'detalle' || currentView === 'editar')) ||
                  (item.view === 'crear' && currentView === 'crear');
                return (
                  <button
                    key={item.view}
                    onClick={() => setCurrentView(item.view)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.view === currentView ||
              (item.view === 'lista' && (currentView === 'detalle' || currentView === 'editar')) ||
              (item.view === 'crear' && currentView === 'crear');
            return (
              <button
                key={item.view}
                onClick={() => setCurrentView(item.view)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors min-w-[64px] ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Bottom padding for mobile nav */}
      <div className="md:hidden h-16" />
    </div>
  );
}
