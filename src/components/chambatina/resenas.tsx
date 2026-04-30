'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Send, CheckCircle, MessageSquare } from 'lucide-react';
import { useAppStore } from './store';

// Star Rating Component
function StarRating({ value, onChange, size = 32, readonly = false }: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readonly?: boolean;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={`transition-transform ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          onClick={() => onChange?.(star)}
        >
          <Star
            size={size}
            className={
              star <= (hover || value)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-zinc-200 text-zinc-200'
            }
          />
        </button>
      ))}
    </div>
  );
}

// Form to submit a review
function ResenaForm({ initialNombre = '', initialServicio = '', onSuccess }: {
  initialNombre?: string;
  initialServicio?: string;
  onSuccess?: () => void;
}) {
  const [nombre, setNombre] = useState(initialNombre);
  const [estrellas, setEstrellas] = useState(5);
  const [comentario, setComentario] = useState('');
  const [servicio, setServicio] = useState(initialServicio);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !comentario.trim()) return;

    setEnviando(true);
    try {
      const res = await fetch('/api/resenas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, estrellas, comentario, servicio }),
      });
      const json = await res.json();
      if (json.ok) {
        setEnviado(true);
        onSuccess?.();
      } else {
        alert(json.error || 'Error al enviar');
      }
    } catch {
      alert('Error de conexion');
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-zinc-900 mb-2">Gracias por tu opinion!</h3>
        <p className="text-sm text-zinc-500">Tu resena sera revisada y publicada pronto.</p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Tu nombre *</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Maria Gonzalez"
          maxLength={60}
          required
          className="w-full px-4 py-3 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
        />
      </div>

      {/* Estrellas */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Tu calificacion *</label>
        <StarRating value={estrellas} onChange={setEstrellas} size={36} />
      </div>

      {/* Servicio */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Que servicio usaste? (opcional)</label>
        <select
          value={servicio}
          onChange={(e) => setServicio(e.target.value)}
          className="w-full px-4 py-3 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
        >
          <option value="">Seleccionar...</option>
          <option value="Envio Internacional">Envio Internacional</option>
          <option value="Rastreo de Paquetes">Rastreo de Paquetes</option>
          <option value="Marketplace">Marketplace</option>
          <option value="Tienda">Tienda</option>
          <option value="Servicios Digitales">Servicios Digitales</option>
          <option value="Otro">Otro</option>
        </select>
      </div>

      {/* Comentario */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Tu comentario * <span className="text-zinc-400">({comentario.length}/500)</span></label>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value.slice(0, 500))}
          placeholder="Cuenta tu experiencia con Chambatina..."
          rows={4}
          required
          minLength={10}
          className="w-full px-4 py-3 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white resize-none"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={enviando || !nombre.trim() || comentario.trim().length < 10}
        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-zinc-300 disabled:to-zinc-300 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
      >
        {enviando ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Send size={16} />
            Enviar Resena
          </>
        )}
      </button>
    </form>
  );
}

// Display a single review card
function ResenaCard({ resena }: { resena: any }) {
  const fecha = new Date(resena.createdAt).toLocaleDateString('es-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  const iniciales = resena.nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-zinc-100 rounded-xl p-5 shadow-sm"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {iniciales}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-zinc-900 text-sm truncate">{resena.nombre}</h4>
            <span className="text-xs text-zinc-400 flex-shrink-0 ml-2">{fecha}</span>
          </div>
          <StarRating value={resena.estrellas} size={14} readonly />
        </div>
      </div>
      {resena.servicio && (
        <span className="inline-block text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full mb-2 font-medium">
          {resena.servicio}
        </span>
      )}
      <p className="text-sm text-zinc-600 leading-relaxed">{resena.comentario}</p>
    </motion.div>
  );
}

// Main Component
export function Resenas() {
  const [tab, setTab] = useState<'escribir' | 'ver'>('escribir');
  const [resenas, setResenas] = useState<any[]>([]);
  const [promedio, setPromedio] = useState(0);
  const [totalActivas, setTotalActivas] = useState(0);
  const [cargando, setCargando] = useState(false);

  // Read URL params for pre-filled data
  const [initialNombre, setInitialNombre] = useState('');
  const [initialServicio, setInitialServicio] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nombre = params.get('cliente') || params.get('nombre') || '';
    const servicio = params.get('servicio') || '';
    if (nombre) setInitialNombre(nombre);
    if (servicio) setInitialServicio(servicio);

    // If they come from a link with params, auto-switch to write tab
    if (nombre || servicio) setTab('escribir');

    // Clean URL
    if (nombre || servicio) {
      window.history.replaceState({}, '', '/resenas');
    }
  }, []);

  const loadResenas = async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/resenas?activas=true');
      const json = await res.json();
      if (json.ok) {
        setResenas(json.data.resenas);
        setPromedio(json.data.promedio);
        setTotalActivas(json.data.totalActivas);
      }
    } catch {}
    setCargando(false);
  };

  useEffect(() => {
    if (tab === 'ver') loadResenas();
  }, [tab]);

  const onResenaEnviada = () => {
    setTab('ver');
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <MessageSquare className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900">Opiniones de Clientes</h1>
        <p className="text-sm text-zinc-500 mt-1">Tu experiencia nos importa</p>
      </div>

      {/* Tab buttons */}
      <div className="flex bg-zinc-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => setTab('escribir')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'escribir'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          Escribir Resena
        </button>
        <button
          onClick={() => setTab('ver')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'ver'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          Ver Opiniones {totalActivas > 0 && `(${totalActivas})`}
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {tab === 'escribir' ? (
          <motion.div
            key="escribir"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100"
          >
            <ResenaForm
              initialNombre={initialNombre}
              initialServicio={initialServicio}
              onSuccess={onResenaEnviada}
            />
          </motion.div>
        ) : (
          <motion.div
            key="ver"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            {/* Stats */}
            {totalActivas > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 mb-5 border border-amber-100">
                <div className="text-center">
                  <div className="text-3xl font-bold text-zinc-900">{promedio}</div>
                  <StarRating value={Math.round(promedio)} size={18} readonly />
                  <p className="text-xs text-zinc-500 mt-1">{totalActivas} opinion{totalActivas !== 1 ? 'es' : ''}</p>
                </div>
              </div>
            )}

            {/* Reviews list */}
            {cargando ? (
              <div className="text-center py-8 text-zinc-400">
                <div className="w-6 h-6 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin mx-auto mb-2" />
                Cargando...
              </div>
            ) : resenas.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-zinc-100">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-zinc-500 text-sm">Aun no hay opiniones publicadas.</p>
                <p className="text-zinc-400 text-xs mt-1">Se el primero en compartir tu experiencia!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {resenas.map((r) => (
                  <ResenaCard key={r.id} resena={r} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
