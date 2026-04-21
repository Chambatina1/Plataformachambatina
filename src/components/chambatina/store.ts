import { create } from 'zustand';

export type ViewType =
  | 'home'
  | 'tienda'
  | 'pedidos'
  | 'rastreador'
  | 'chat'
  | 'pedido-detail'
  | 'pedido-form'
  | 'pedido-edit';

interface AppState {
  currentView: ViewType;
  selectedPedidoId: number | null;
  sidebarOpen: boolean;

  setCurrentView: (view: ViewType) => void;
  setSelectedPedidoId: (id: number | null) => void;
  setSidebarOpen: (open: boolean) => void;
  goToPedidoDetail: (id: number) => void;
  goToPedidoEdit: (id: number) => void;
  goToNuevoPedido: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'home',
  selectedPedidoId: null,
  sidebarOpen: false,

  setCurrentView: (view) => set({ currentView: view, sidebarOpen: false }),
  setSelectedPedidoId: (id) => set({ selectedPedidoId: id }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  goToPedidoDetail: (id) =>
    set({ currentView: 'pedido-detail', selectedPedidoId: id, sidebarOpen: false }),
  goToPedidoEdit: (id) =>
    set({ currentView: 'pedido-edit', selectedPedidoId: id, sidebarOpen: false }),
  goToNuevoPedido: () =>
    set({ currentView: 'pedido-form', selectedPedidoId: null, sidebarOpen: false }),
}));
