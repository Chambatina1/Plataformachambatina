'use client';

import dynamic from 'next/dynamic';

const DashboardCliente = dynamic(
  () => import('@/components/chambatina/DashboardCliente'),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-zinc-500">Cargando...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
);

export default function DashboardClientePage() {
  return <DashboardCliente />;
}
