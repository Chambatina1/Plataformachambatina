import { create } from 'zustand';

export type PublicView = 'home' | 'tienda' | 'rastreador' | 'chat';
export type AdminView = 'dashboard' | 'pedidos' | 'tracking' | 'pedido-detail' | 'pedido-form' | 'pedido-edit';
export type AppMode = 'public' | 'admin';

interface AppState {
  // Auth
  isAdmin: boolean;
  isLoggedIn: boolean;
  login: (password: string) => boolean;
  logout: () => void;

  // Mode
  mode: AppMode;
  setMode: (mode: AppMode) => void;

  // Navigation - public
  currentView: PublicView;
  setCurrentView: (view: PublicView) => void;

  // Navigation - admin
  adminView: AdminView;
  setAdminView: (view: AdminView) => void;

  // Login dialog
  showLoginDialog: boolean;
  setShowLoginDialog: (show: boolean) => void;
  pendingAdminView: AdminView | null;
  setPendingAdminView: (view: AdminView | null) => void;

  // Shared state
  selectedPedidoId: number | null;
  setSelectedPedidoId: (id: number | null) => void;

  // Actions
  goToPedidoDetail: (id: number) => void;
  goToPedidoEdit: (id: number) => void;
  goToNuevoPedido: () => void;
  goBackToPublic: () => void;
  goToAdmin: () => void;
}

const ADMIN_PASSWORD = 'chambatina2024';

export const useAppStore = create<AppState>((set, get) => ({
  // Auth
  isAdmin: false,
  isLoggedIn: false,
  login: (password: string) => {
    if (password === ADMIN_PASSWORD) {
      const pending = get().pendingAdminView;
      set({
        isLoggedIn: true,
        isAdmin: true,
        mode: 'admin',
        adminView: pending || 'dashboard',
        showLoginDialog: false,
        pendingAdminView: null,
      });
      return true;
    }
    return false;
  },
  logout: () => {
    set({
      isLoggedIn: false,
      isAdmin: false,
      mode: 'public',
      adminView: 'dashboard',
      pendingAdminView: null,
      showLoginDialog: false,
    });
  },

  // Mode
  mode: 'public',
  setMode: (mode) => set({ mode }),

  // Public navigation
  currentView: 'home',
  setCurrentView: (view) => set({ currentView: view }),

  // Admin navigation
  adminView: 'dashboard',
  setAdminView: (view) => set({ adminView: view }),

  // Login dialog
  showLoginDialog: false,
  setShowLoginDialog: (show) => set({ showLoginDialog: show }),
  pendingAdminView: null,
  setPendingAdminView: (view) => set({ pendingAdminView: view }),

  // Shared state
  selectedPedidoId: null,
  setSelectedPedidoId: (id) => set({ selectedPedidoId: id }),

  // Actions
  goToPedidoDetail: (id) =>
    set({ adminView: 'pedido-detail', selectedPedidoId: id }),
  goToPedidoEdit: (id) =>
    set({ adminView: 'pedido-edit', selectedPedidoId: id }),
  goToNuevoPedido: () => {
    const { isLoggedIn } = get();
    if (isLoggedIn) {
      set({ mode: 'admin', adminView: 'pedido-form', selectedPedidoId: null });
    } else {
      set({ showLoginDialog: true, pendingAdminView: 'pedido-form' });
    }
  },
  goBackToPublic: () =>
    set({ mode: 'public', adminView: 'dashboard' }),
  goToAdmin: () => {
    const { isLoggedIn } = get();
    if (isLoggedIn) {
      set({ mode: 'admin', adminView: 'dashboard' });
    } else {
      set({ showLoginDialog: true, pendingAdminView: 'dashboard' });
    }
  },
}));
