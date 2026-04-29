'use client';

import { useState, useEffect } from 'react';
import { Mail, TrendingUp, Users, Copy, Check, Download, Gift, ExternalLink } from 'lucide-react';
import { useAppStore } from './store';
import { toast } from 'sonner';

export function EmailLeadsPanel() {
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, hoy: 0, estaSemana: 0, cuponesUsados: 0 });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadLeads = async () => {
    try {
      const res = await fetch('/api/leads');
      const json = await res.json();
      if (json.ok) {
        setLeads(json.data.leads);
        setStats(json.data.stats);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadLeads(); }, []);

  const exportCSV = () => {
    if (leads.length === 0) {
      toast.error('No hay emails para exportar');
      return;
    }
    const headers = 'Email,Nombre,Fecha,Cupon,Usado,Fuente';
    const rows = leads.map((l: any) =>
      `"${l.email}","${l.nombre || ''}","${new Date(l.createdAt).toLocaleDateString('es')}","${l.cupon || ''}","${l.usado ? 'Si' : 'No'}","${l.source || 'popup'}"`
    ).join('\n');
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chambatina-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Archivo descargado');
  };

  const copyAllEmails = () => {
    const emails = leads.map((l: any) => l.email).join(', ');
    navigator.clipboard.writeText(emails);
    setCopied(true);
    toast.success(`${leads.length} emails copiados`);
    setTimeout(() => setCopied(false), 2500);
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: '#18181b' }}>
            <Mail className="h-5 w-5 text-orange-500" />
            Email Leads
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Emails capturados por el popup de bienvenida</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyAllEmails}
            className="h-9 px-3 rounded-lg border border-zinc-200 text-xs flex items-center gap-1.5 hover:bg-zinc-50 transition-colors"
            style={{ color: '#18181b' }}
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copiados!' : 'Copiar emails'}
          </button>
          <button
            onClick={exportCSV}
            className="h-9 px-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-zinc-100 p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
              <Users className="h-3.5 w-3.5 text-orange-600" />
            </div>
          </div>
          <p className="text-xl font-bold" style={{ color: '#18181b' }}>{stats.total}</p>
          <p className="text-[10px] text-zinc-500">Total capturados</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-100 p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-3.5 w-3.5 text-green-600" />
            </div>
          </div>
          <p className="text-xl font-bold" style={{ color: '#18181b' }}>{stats.hoy}</p>
          <p className="text-[10px] text-zinc-500">Hoy</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-100 p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
              <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
            </div>
          </div>
          <p className="text-xl font-bold" style={{ color: '#18181b' }}>{stats.estaSemana}</p>
          <p className="text-[10px] text-zinc-500">Esta semana</p>
        </div>
        <div className="bg-white rounded-xl border border-zinc-100 p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
              <Gift className="h-3.5 w-3.5 text-amber-600" />
            </div>
          </div>
          <p className="text-xl font-bold" style={{ color: '#18181b' }}>{stats.cuponesUsados}</p>
          <p className="text-[10px] text-zinc-500">Cupones usados</p>
        </div>
      </div>

      {/* Coupon info */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift className="h-4 w-4 text-amber-600" />
          <span className="text-xs text-amber-800 font-medium">Cupon activo:</span>
          <span className="font-mono font-bold text-orange-700">CHAMBA10</span>
          <span className="text-[10px] text-amber-600">= 10% descuento</span>
        </div>
        <span className="text-[10px] text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Activo</span>
      </div>

      {/* Leads list */}
      <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
        <div className="p-3 border-b border-zinc-100 flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: '#18181b' }}>
            Emails capturados ({leads.length})
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-zinc-400 text-sm">Cargando...</div>
        ) : leads.length === 0 ? (
          <div className="p-8 text-center">
            <Mail className="h-8 w-8 text-zinc-200 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">Aun no hay emails capturados</p>
            <p className="text-xs text-zinc-300 mt-1">Los emails apareceran aqui cuando los visitantes usen el popup</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {leads.map((lead: any) => (
              <div key={lead.id} className="px-4 py-3 flex items-center gap-3 hover:bg-zinc-50/50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate" style={{ color: '#18181b' }}>{lead.email}</span>
                    {lead.nombre && (
                      <span className="text-[10px] text-zinc-400">({lead.nombre})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-zinc-400">{formatDate(lead.createdAt)}</span>
                    <span className="text-[10px] font-mono bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">{lead.cupon || 'CHAMBA10'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {lead.usado ? (
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Usado</span>
                  ) : (
                    <span className="text-[10px] bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">Nuevo</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
