'use client';

import { useAppStore } from './store';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, ExternalLink } from 'lucide-react';

export function EnvioForm() {
  const setCurrentView = useAppStore((s) => s.setCurrentView);
  const selectedProduct = useAppStore((s) => s.selectedProduct);

  const handleBack = () => {
    if (selectedProduct) {
      setCurrentView('tienda');
    } else {
      setCurrentView('home');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-zinc-200 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-1.5 text-zinc-600 hover:text-zinc-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Volver</span>
          </Button>
          <div className="h-4 w-px bg-zinc-200" />
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-zinc-900">
              {selectedProduct ? `Envío - ${selectedProduct.nombre}` : 'Formulario de Envío'}
            </h2>
          </div>
        </div>
        <a
          href="https://chambatina-forms.onrender.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Abrir en nueva pestaña
        </a>
      </div>

      {/* iframe with the shipment form */}
      <div className="flex-1 bg-white">
        <iframe
          src="https://chambatina-forms.onrender.com"
          className="w-full h-full border-0"
          title="Formulario de Envío - SolvedCargo"
          allow="clipboard-write"
        />
      </div>
    </div>
  );
}
