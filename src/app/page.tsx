'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/components/chambatina/store';
import { Navbar } from '@/components/chambatina/navbar';
import { LoginDialog } from '@/components/chambatina/login-dialog';
import { RegisterDialog } from '@/components/chambatina/register-dialog';
import { Home } from '@/components/chambatina/home';
import { Tienda } from '@/components/chambatina/tienda';
import { PedidosList } from '@/components/chambatina/pedidos-list';
import { PedidoForm } from '@/components/chambatina/pedido-form';
import { PedidoDetail } from '@/components/chambatina/pedido-detail';
import { AdminDashboard } from '@/components/chambatina/admin-dashboard';
import { TrackingUpload } from '@/components/chambatina/tracking-upload';
import { ConfigPanel } from '@/components/chambatina/config-panel';
import { Rastreador } from '@/components/chambatina/rastreador';
import { ChatIA } from '@/components/chambatina/chat-ia';
import { TiendaAdmin } from '@/components/chambatina/tienda-admin';
import { AITrainingPanel } from '@/components/chambatina/ai-training-panel';
import { AparienciaPanel } from '@/components/chambatina/apariencia-panel';
import { UsersPanel } from '@/components/chambatina/users-panel';

function ThemeInjector() {
  const [themeOverride, setThemeOverride] = useState('');
  const [customCss, setCustomCss] = useState('');
  const [customJs, setCustomJs] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/config');
        const json = await res.json();
        if (json.ok && json.data) {
          const d = json.data;
          const primary = d.theme_primary || '#f59e0b';
          const secondary = d.theme_secondary || '#d97706';
          const accent = d.theme_accent || '#b45309';

          // Helper: generate rgba from hex
          const hexToRgba = (hex: string, alpha: number) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
          };

          // Darken a hex color
          const darken = (hex: string, amount: number) => {
            let r = parseInt(hex.slice(1, 3), 16);
            let g = parseInt(hex.slice(3, 5), 16);
            let b = parseInt(hex.slice(5, 7), 16);
            r = Math.max(0, Math.floor(r * (1 - amount)));
            g = Math.max(0, Math.floor(g * (1 - amount)));
            b = Math.max(0, Math.floor(b * (1 - amount)));
            return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
          };

          // Build comprehensive theme overrides for public pages
          // Only override when NOT in admin mode (admin keeps cream/orange)
          let cssOverrides = `:root {
  --ch-primary: ${primary};
  --ch-secondary: ${secondary};
  --ch-accent: ${accent};
  --ch-primary-dark: ${darken(primary, 0.15)};
  --ch-primary-light: ${hexToRgba(primary, 0.05)};
  --ch-primary-medium: ${hexToRgba(primary, 0.1)};
  --ch-primary-shadow: ${hexToRgba(primary, 0.2)};
  --ch-primary-border: ${hexToRgba(primary, 0.2)};
}\n`;

          // Override common orange Tailwind classes on public pages
          cssOverrides += `
/* Theme color overrides - public pages only */
.ch-public .bg-orange-500 { background-color: ${primary} !important; }
.ch-public .from-orange-500 { --tw-gradient-from: ${primary} !important; }
.ch-public .to-amber-500 { --tw-gradient-to: ${secondary} !important; }
.ch-public .hover\\:bg-orange-600:hover { background-color: ${darken(primary, 0.15)} !important; }
.ch-public .hover\\:from-orange-600:hover { --tw-gradient-from: ${darken(primary, 0.15)} !important; }
.ch-public .hover\\:to-amber-600:hover { --tw-gradient-to: ${darken(secondary, 0.15)} !important; }
.ch-public .hover\\:bg-orange-50:hover { background-color: ${hexToRgba(primary, 0.05)} !important; }
.ch-public .text-orange-500 { color: ${primary} !important; }
.ch-public .text-orange-600 { color: ${darken(primary, 0.1)} !important; }
.ch-public .text-orange-700 { color: ${darken(primary, 0.2)} !important; }
.ch-public .text-orange-400 { color: ${hexToRgba(primary, 0.7)} !important; }
.ch-public .bg-orange-50 { background-color: ${hexToRgba(primary, 0.05)} !important; }
.ch-public .bg-orange-100 { background-color: ${hexToRgba(primary, 0.1)} !important; }
.ch-public .border-orange-200 { border-color: ${hexToRgba(primary, 0.2)} !important; }
.ch-public .border-orange-100 { border-color: ${hexToRgba(primary, 0.1)} !important; }
.ch-public .focus\\:border-orange-400:focus { border-color: ${primary} !important; }
.ch-public .shadow-orange-500\\/20 { --tw-shadow-color: ${hexToRgba(primary, 0.2)} !important; }
.ch-public .shadow-orange-500\\/10 { --tw-shadow-color: ${hexToRgba(primary, 0.1)} !important; }
.ch-public .shadow-orange-500\\/5 { --tw-shadow-color: ${hexToRgba(primary, 0.05)} !important; }
.ch-public .ring-orange-400 { --tw-ring-color: ${primary} !important; }
.ch-public .ring-2 { --tw-ring-color: ${primary} !important; }
.ch-public .data\\[state=active\\]\\:bg-amber-500[data-state=active] { background-color: ${primary} !important; }
.ch-public .data\\[state=active\\]\\:bg-amber-400[data-state=active] { background-color: ${primary} !important; }
\n/* Navbar active state */
.ch-public .bg-orange-50.text-orange-700,
.ch-public nav button[class*=bg-orange-50] {
  background-color: ${hexToRgba(primary, 0.05)} !important;
  color: ${darken(primary, 0.2)} !important;
}
\n/* Bottom tab bar active */
.ch-public .text-orange-600 {
  color: ${primary} !important;
}
\n/* Amber accent overrides (secondary color) */
.ch-public .bg-amber-50 { background-color: ${hexToRgba(secondary, 0.05)} !important; }
.ch-public .bg-amber-100 { background-color: ${hexToRgba(secondary, 0.1)} !important; }
.ch-public .bg-amber-500 { background-color: ${secondary} !important; }
.ch-public .hover\\:bg-amber-600:hover { background-color: ${darken(secondary, 0.15)} !important; }
.ch-public .text-amber-500 { color: ${secondary} !important; }
.ch-public .text-amber-600 { color: ${darken(secondary, 0.1)} !important; }
.ch-public .from-amber-400 { --tw-gradient-from: ${secondary} !important; }
.ch-public .to-amber-500 { --tw-gradient-to: ${secondary} !important; }
\n/* Orange-50 background variants */
.ch-public .bg-gradient-to-b { }
.ch-public .via-orange-50\\/30 { --tw-gradient-via: ${hexToRgba(primary, 0.03)} !important; }
`;

          setThemeOverride(cssOverrides);
          if (d.custom_css) setCustomCss(d.custom_css);
          if (d.custom_js) setCustomJs(d.custom_js);
        }
      } catch {}
    }
    load();
    function onConfigUpdated() { load(); }
    window.addEventListener('config-updated', onConfigUpdated);
    return () => window.removeEventListener('config-updated', onConfigUpdated);
  }, []);

  useEffect(() => {
    if (customJs) {
      try { const fn = new Function(customJs); fn(); } catch {}
    }
  }, [customJs]);

  return (
    <>
      {themeOverride && <style>{themeOverride}</style>}
      {customCss && <style>{customCss}</style>}
    </>
  );
}

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
        case 'pedido-public':
          return <PedidoForm />;
        case 'registro':
          return null; // Handled by dialog
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
        case 'config':
          return <ConfigPanel />;
        case 'tienda-admin':
          return <TiendaAdmin />;
        case 'ai-training':
          return <AITrainingPanel />;
        case 'apariencia':
          return <AparienciaPanel />;
        case 'users':
          return <UsersPanel />;
        case 'emails':
          return <ConfigPanel />; // Email config is part of config panel
        default:
          return <AdminDashboard />;
      }
    }
  };

  return (
    <>
      <ThemeInjector />
      <div className={`min-h-screen flex flex-col bg-background ${mode === 'public' ? 'ch-public' : ''}`}>
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
      <RegisterDialog />
    </div>
    </>
  );
}
