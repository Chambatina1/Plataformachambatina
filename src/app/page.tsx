'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/components/chambatina/store';
import { Navbar } from '@/components/chambatina/navbar';
import { Home } from '@/components/chambatina/home';
import { Tienda } from '@/components/chambatina/tienda';
import { PedidosList } from '@/components/chambatina/pedidos-list';
import { PedidoForm } from '@/components/chambatina/pedido-form';
import { PedidoDetail } from '@/components/chambatina/pedido-detail';
import { Rastreador } from '@/components/chambatina/rastreador';
import { ChatIA } from '@/components/chambatina/chat-ia';

export default function Page() {
  const { currentView } = useAppStore();

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <Home />;
      case 'tienda':
        return <Tienda />;
      case 'pedidos':
        return <PedidosList />;
      case 'pedido-form':
        return <PedidoForm />;
      case 'pedido-detail':
        return <PedidoDetail />;
      case 'pedido-edit':
        return <PedidoForm />;
      case 'rastreador':
        return <Rastreador />;
      case 'chat':
        return <ChatIA />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
