'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/components/chambatina/store';
import { Navbar } from '@/components/chambatina/navbar';
import { LoginDialog } from '@/components/chambatina/login-dialog';
import { Home } from '@/components/chambatina/home';
import { Tienda } from '@/components/chambatina/tienda';
import { PedidosList } from '@/components/chambatina/pedidos-list';
import { PedidoForm } from '@/components/chambatina/pedido-form';
import { PedidoDetail } from '@/components/chambatina/pedido-detail';
import { AdminDashboard } from '@/components/chambatina/admin-dashboard';
import { TrackingUpload } from '@/components/chambatina/tracking-upload';
import { Rastreador } from '@/components/chambatina/rastreador';
import { ChatIA } from '@/components/chambatina/chat-ia';

export default function Page() {
  const mode = useAppStore((s) => s.mode);
  const currentView = useAppStore((s) => s.currentView);
  const adminView = useAppStore((s) => s.adminView);

  const viewKey = mode === 'admin' ? `admin-${adminView}` : `public-${currentView}`;

  const renderView = () => {
    if (mode === 'public') {
      switch (currentView) {
        case 'home':
          return <Home />;
        case 'tienda':
          return <Tienda />;
        case 'rastreador':
          return <Rastreador />;
        case 'chat':
          return <ChatIA />;
        default:
          return <Home />;
      }
    } else {
      switch (adminView) {
        case 'dashboard':
          return <AdminDashboard />;
        case 'pedidos':
          return <PedidosList />;
        case 'pedido-form':
          return <PedidoForm />;
        case 'pedido-detail':
          return <PedidoDetail />;
        case 'pedido-edit':
          return <PedidoForm />;
        case 'tracking':
          return <TrackingUpload />;
        default:
          return <AdminDashboard />;
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={viewKey}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>
      <LoginDialog />
    </div>
  );
}
