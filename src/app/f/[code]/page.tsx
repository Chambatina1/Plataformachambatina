'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
  Shield,
  Clock,
  ArrowRight,
} from 'lucide-react';

// ==========================================
// Types
// ==========================================
interface FormField {
  nombre: string;
  etiqueta: string;
  tipo: 'texto' | 'email' | 'telefono' | 'textarea' | 'select' | 'numero' | 'url';
  requerido: boolean;
  placeholder?: string;
  opciones?: string[];
}

interface FormData {
  nombre: string;
  descripcion: string | null;
  campos: FormField[];
}

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

// ==========================================
// Main Page Component
// ==========================================
export default function PublicFormPage({ params }: { params: Promise<{ code: string }> }) {
  const [code, setCode] = useState('');
  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    params.then((p) => {
      setCode(p.code);
      loadForm(p.code);
    });
  }, []);

  async function loadForm(c: string) {
    try {
      const res = await fetch(`/api/public-forms/${c}`);
      const json = await res.json();
      if (json.ok) {
        setForm(json.data);
      } else {
        setError(json.error || 'Formulario no encontrado');
      }
    } catch {
      setError('Error al cargar el formulario');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(nombre: string, value: string) {
    setValues((prev) => ({ ...prev, [nombre]: value }));
    // Clear field error on change
    if (fieldErrors[nombre]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[nombre];
        return next;
      });
    }
  }

  function validate(): boolean {
    if (!form) return false;
    const errors: Record<string, string> = {};
    for (const campo of form.campos) {
      if (campo.requerido) {
        const val = values[campo.nombre];
        if (!val || val.trim() === '') {
          errors[campo.nombre] = `${campo.etiqueta} es obligatorio`;
        }
      }
      // Email validation
      if (campo.tipo === 'email' && values[campo.nombre]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(values[campo.nombre])) {
          errors[campo.nombre] = 'Email no válido';
        }
      }
      // URL validation
      if (campo.tipo === 'url' && values[campo.nombre]) {
        try {
          new URL(values[campo.nombre]);
        } catch {
          errors[campo.nombre] = 'URL no válida (debe incluir https://)';
        }
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitState('loading');
    setSubmitError('');

    try {
      const res = await fetch('/api/public-forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: code, datos: values }),
      });
      const json = await res.json();
      if (json.ok) {
        setSubmitState('success');
      } else {
        setSubmitError(json.error || 'Error al enviar');
        setSubmitState('error');
      }
    } catch {
      setSubmitError('Error de conexión. Intenta de nuevo.');
      setSubmitState('error');
    }
  }

  // ==========================================
  // Loading State
  // ==========================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Cargando formulario...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // Error State
  // ==========================================
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 mb-2">Formulario no disponible</h1>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <p className="text-xs text-slate-400">
            Si crees que esto es un error, contacta al administrador.
          </p>
        </motion.div>
      </div>
    );
  }

  // ==========================================
  // Success State
  // ==========================================
  if (submitState === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Solicitud enviada</h1>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            Tu solicitud fue recibida correctamente. El administrador la revisará y te contactará lo antes posible.
          </p>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl text-left">
              <Clock className="h-5 w-5 text-blue-500 shrink-0" />
              <span className="text-xs text-blue-700">Revisión aproximada: 24 horas</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl text-left">
              <Shield className="h-5 w-5 text-emerald-500 shrink-0" />
              <span className="text-xs text-emerald-700">Tu información está protegida</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ==========================================
  // Form State
  // ==========================================
  if (!form) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Header */}
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Package className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">{form.nombre}</h1>
            <p className="text-[11px] text-slate-400">Formulario oficial</p>
          </div>
        </div>
      </header>

      {/* Form Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Description */}
          {form.descripcion && (
            <div className="mb-6 p-4 bg-blue-50/60 rounded-xl border border-blue-100/60">
              <p className="text-sm text-blue-800 leading-relaxed">{form.descripcion}</p>
            </div>
          )}

          {/* Info badges */}
          <div className="flex flex-wrap gap-2 mb-6">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg text-[11px] font-medium text-emerald-700">
              <Shield className="h-3.5 w-3.5" />
              Datos seguros
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-lg text-[11px] font-medium text-amber-700">
              <Clock className="h-3.5 w-3.5" />
              Revisión en 24h
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg text-[11px] font-medium text-blue-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              100% Gratuito
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {form.campos.map((campo) => (
              <div key={campo.nombre}>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  {campo.etiqueta}
                  {campo.requerido && <span className="text-red-500 ml-1">*</span>}
                </label>

                {campo.tipo === 'select' && campo.opciones ? (
                  <select
                    value={values[campo.nombre] || ''}
                    onChange={(e) => handleChange(campo.nombre, e.target.value)}
                    className={`w-full h-11 px-3 rounded-xl border bg-white text-sm outline-none transition-all ${
                      fieldErrors[campo.nombre]
                        ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                        : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
                    }`}
                  >
                    <option value="">{campo.placeholder || 'Selecciona una opción...'}</option>
                    {campo.opciones.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : campo.tipo === 'textarea' ? (
                  <textarea
                    value={values[campo.nombre] || ''}
                    onChange={(e) => handleChange(campo.nombre, e.target.value)}
                    placeholder={campo.placeholder}
                    rows={3}
                    className={`w-full px-3 py-2.5 rounded-xl border bg-white text-sm outline-none resize-none transition-all ${
                      fieldErrors[campo.nombre]
                        ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                        : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
                    }`}
                  />
                ) : (
                  <input
                    type={campo.tipo === 'email' ? 'email' : campo.tipo === 'url' ? 'url' : campo.tipo === 'numero' ? 'tel' : 'text'}
                    value={values[campo.nombre] || ''}
                    onChange={(e) => handleChange(campo.nombre, e.target.value)}
                    placeholder={campo.placeholder}
                    className={`w-full h-11 px-3 rounded-xl border bg-white text-sm outline-none transition-all ${
                      fieldErrors[campo.nombre]
                        ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                        : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
                    }`}
                  />
                )}

                {fieldErrors[campo.nombre] && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors[campo.nombre]}</p>
                )}
              </div>
            ))}

            {/* Submit Error */}
            <AnimatePresence>
              {submitError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 bg-red-50 border border-red-100 rounded-xl"
                >
                  <p className="text-xs text-red-600">{submitError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitState === 'loading'}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/30 flex items-center justify-center gap-2"
            >
              {submitState === 'loading' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  Enviar solicitud
                  <Send className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              Al enviar, aceptas que tu información sea procesada para atender tu solicitud.
            </p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <ArrowRight className="h-3 w-3 text-blue-400" />
              <span className="text-[11px] text-blue-500 font-medium">Powered by Chambatina</span>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
