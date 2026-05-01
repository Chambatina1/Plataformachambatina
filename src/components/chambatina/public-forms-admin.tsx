'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Copy,
  Trash2,
  Edit3,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  FileText,
  Send,
  ArrowRight,
  X,
  Shield,
  AlertTriangle,
  Package,
  Link2,
} from 'lucide-react';

// ==========================================
// Types
// ==========================================
interface FormFieldDef {
  nombre: string;
  etiqueta: string;
  tipo: 'texto' | 'email' | 'telefono' | 'textarea' | 'select' | 'numero' | 'url';
  requerido: boolean;
  placeholder?: string;
  opciones?: string[];
}

interface PublicForm {
  id: number;
  nombre: string;
  descripcion: string | null;
  campos: string; // JSON string
  activo: boolean;
  codigo: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    submissions: number;
  };
}

interface Submission {
  id: number;
  formId: number;
  datos: string; // JSON string
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  motivoRechazo: string | null;
  adminNotas: string | null;
  pedidoCreado: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Templates predefinidos
// ==========================================
const TEMPLATES: Record<string, { nombre: string; descripcion: string; campos: FormFieldDef[] }> = {
  envio: {
    nombre: 'Solicitud de Envío',
    descripcion: 'Formulario para que los clientes soliciten envíos internacionales. Incluye datos del comprador y destinatario.',
    campos: [
      { nombre: 'nombre', etiqueta: 'Tu nombre completo', tipo: 'texto', requerido: true, placeholder: 'Ej: María García' },
      { nombre: 'email', etiqueta: 'Correo electrónico', tipo: 'email', requerido: true, placeholder: 'tucorreo@ejemplo.com' },
      { nombre: 'telefono', etiqueta: 'Teléfono / WhatsApp', tipo: 'telefono', requerido: true, placeholder: '+53 5 1234567' },
      { nombre: 'nombre_destinatario', etiqueta: 'Nombre del destinatario', tipo: 'texto', requerido: true, placeholder: 'Nombre de quien recibe' },
      { nombre: 'telefono_destinatario', etiqueta: 'Teléfono destinatario', tipo: 'telefono', requerido: true, placeholder: 'Teléfono del destinatario' },
      { nombre: 'carnet', etiqueta: 'Carnet de identidad', tipo: 'numero', requerido: true, placeholder: 'Número de carnet' },
      { nombre: 'direccion', etiqueta: 'Dirección de entrega', tipo: 'textarea', requerido: true, placeholder: 'Dirección completa' },
      { nombre: 'producto', etiqueta: 'Descripción del producto', tipo: 'textarea', requerido: true, placeholder: '¿Qué quieres enviar?' },
      { nombre: 'link', etiqueta: 'Link del producto (opcional)', tipo: 'url', requerido: false, placeholder: 'https://www.ejemplo.com/producto' },
      { nombre: 'plataforma', etiqueta: 'Plataforma', tipo: 'select', requerido: false, placeholder: '¿Dónde lo viste?', opciones: ['TikTok Shop', 'Amazon', 'AliExpress', 'Shein', 'MercadoLibre', 'Otra'] },
      { nombre: 'notas', etiqueta: 'Notas adicionales', tipo: 'textarea', requerido: false, placeholder: '¿Algo más que debamos saber?' },
    ],
  },
  cotizacion: {
    nombre: 'Solicitud de Cotización',
    descripcion: 'Para que los clientes pidan una cotización rápida de envío.',
    campos: [
      { nombre: 'nombre', etiqueta: 'Tu nombre', tipo: 'texto', requerido: true, placeholder: 'Nombre completo' },
      { nombre: 'email', etiqueta: 'Correo electrónico', tipo: 'email', requerido: true, placeholder: 'tucorreo@ejemplo.com' },
      { nombre: 'telefono', etiqueta: 'WhatsApp', tipo: 'telefono', requerido: true, placeholder: '+53 5 1234567' },
      { nombre: 'producto', etiqueta: '¿Qué quieres enviar?', tipo: 'textarea', requerido: true, placeholder: 'Describe los productos' },
      { nombre: 'ubicacion', etiqueta: '¿Dónde te encuentras?', tipo: 'select', requerido: true, opciones: ['La Habana', 'Santiago de Cuba', 'Camagüey', 'Holguín', 'Santa Clara', 'Otra provincia'] },
      { nombre: 'link', etiqueta: 'Link del producto (opcional)', tipo: 'url', requerido: false, placeholder: 'https://...' },
    ],
  },
  contacto: {
    nombre: 'Formulario de Contacto General',
    descripcion: 'Formulario genérico de contacto para captar leads.',
    campos: [
      { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, placeholder: 'Tu nombre' },
      { nombre: 'email', etiqueta: 'Email', tipo: 'email', requerido: true, placeholder: 'tucorreo@ejemplo.com' },
      { nombre: 'telefono', etiqueta: 'Teléfono / WhatsApp', tipo: 'telefono', requerido: false, placeholder: 'Opcional' },
      { nombre: 'asunto', etiqueta: 'Asunto', tipo: 'select', requerido: true, opciones: ['Envío internacional', 'Rastreo de paquete', 'Tienda', 'Marketplace', 'Servicios digitales', 'Otro'] },
      { nombre: 'mensaje', etiqueta: 'Mensaje', tipo: 'textarea', requerido: true, placeholder: '¿En qué podemos ayudarte?' },
    ],
  },
};

const TIPO_LABELS: Record<string, string> = {
  texto: 'Texto',
  email: 'Email',
  telefono: 'Teléfono',
  textarea: 'Texto largo',
  select: 'Selección',
  numero: 'Número',
  url: 'URL / Link',
};

const ESTADO_COLORS: Record<string, string> = {
  pendiente: 'bg-amber-100 text-amber-800 border-amber-200',
  aprobado: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rechazado: 'bg-red-100 text-red-800 border-red-200',
};

const ESTADO_ICONS: Record<string, typeof Clock> = {
  pendiente: Clock,
  aprobado: CheckCircle2,
  rechazado: XCircle,
};

// ==========================================
// Main Component
// ==========================================
export function PublicFormsAdmin() {
  const [activeTab, setActiveTab] = useState<'formularios' | 'solicitudes'>('formularios');
  const [forms, setForms] = useState<PublicForm[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFormId, setSelectedFormId] = useState<number | null>(null);
  const [expandedSubId, setExpandedSubId] = useState<number | null>(null);
  const [filterEstado, setFilterEstado] = useState('todos');

  // Create form modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editForm, setEditForm] = useState<PublicForm | null>(null);

  // Reject modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectSubId, setRejectSubId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Load forms
  const fetchForms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/public-forms?estado=todos');
      const json = await res.json();
      if (json.ok) setForms(json.data);
    } catch (err) {
      console.error('Error fetching forms:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load submissions for a form
  const fetchSubmissions = useCallback(async (formId: number) => {
    try {
      const res = await fetch(`/api/public-forms/submissions?formId=${formId}&estado=${filterEstado}`);
      const json = await res.json();
      if (json.ok) {
        setSubmissions(json.data);
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
    }
  }, [filterEstado]);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  useEffect(() => {
    if (selectedFormId) fetchSubmissions(selectedFormId);
  }, [selectedFormId, fetchSubmissions]);

  function getFormLink(codigo: string) {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/f/${codigo}`;
    }
    return `/f/${codigo}`;
  }

  async function copyLink(codigo: string) {
    const link = getFormLink(codigo);
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = link;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    alert(`Link copiado: ${link}`);
  }

  async function toggleFormActive(form: PublicForm) {
    try {
      await fetch('/api/public-forms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: form.id, activo: !form.activo }),
      });
      fetchForms();
    } catch {}
  }

  async function deleteForm(id: number) {
    if (!confirm('¿Eliminar este formulario y todas sus solicitudes? Esta acción es irreversible.')) return;
    try {
      await fetch(`/api/public-forms?id=${id}`, { method: 'DELETE' });
      if (selectedFormId === id) setSelectedFormId(null);
      fetchForms();
    } catch {}
  }

  async function handleApprove(subId: number, crearPedido: boolean) {
    try {
      const res = await fetch(`/api/public-forms/submissions/${subId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'aprobar', crearPedido }),
      });
      const json = await res.json();
      if (json.ok) {
        if (selectedFormId) fetchSubmissions(selectedFormId);
        fetchForms(); // Update pending count
      } else {
        alert(json.error || 'Error al aprobar');
      }
    } catch {}
  }

  function openRejectModal(subId: number) {
    setRejectSubId(subId);
    setRejectReason('');
    setShowRejectModal(true);
  }

  async function handleReject() {
    if (!rejectSubId) return;
    try {
      const res = await fetch(`/api/public-forms/submissions/${rejectSubId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'rechazar', motivoRechazo: rejectReason }),
      });
      const json = await res.json();
      if (json.ok) {
        setShowRejectModal(false);
        if (selectedFormId) fetchSubmissions(selectedFormId);
        fetchForms();
      } else {
        alert(json.error || 'Error al rechazar');
      }
    } catch {}
  }

  // Count pending
  const totalPendientes = forms.reduce((sum, f) => sum + (f._count?.submissions || 0), 0);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: '#18181b' }}>Formularios Públicos</h2>
            <p className="text-xs text-zinc-400">Crea links compartibles para captar clientes</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-zinc-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('formularios')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'formularios' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          Mis Formularios
          {totalPendientes > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
              {totalPendientes}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('solicitudes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'solicitudes' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <Inbox className="h-3.5 w-3.5" />
          Solicitudes
        </button>
      </div>

      {/* ===== FORMULARIOS TAB ===== */}
      {activeTab === 'formularios' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Templates Quick Create */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Crear desde plantilla</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(TEMPLATES).map(([key, tpl]) => (
                <button
                  key={key}
                  onClick={() => {
                    setEditForm(null);
                    setShowCreateModal(true);
                    // Pass template data via sessionStorage
                    sessionStorage.setItem('pf_template', key);
                  }}
                  className="flex items-start gap-3 p-4 bg-white rounded-xl border border-zinc-200 hover:border-blue-300 hover:shadow-md transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                    <Plus className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-800 group-hover:text-blue-700 transition-colors">{tpl.nombre}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">{tpl.descripcion}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Existing Forms */}
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Formularios creados</h3>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
            </div>
          ) : forms.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-zinc-100">
              <FileText className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">No tienes formularios todavía</p>
              <p className="text-xs text-zinc-400 mt-1">Crea uno desde las plantillas de arriba</p>
            </div>
          ) : (
            <div className="space-y-3">
              {forms.map((form) => {
                const campos = JSON.parse(form.campos || '[]');
                const link = getFormLink(form.codigo);
                const pending = form._count?.submissions || 0;

                return (
                  <motion.div
                    key={form.id}
                    layout
                    className="bg-white rounded-xl border border-zinc-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm truncate" style={{ color: '#18181b' }}>{form.nombre}</h4>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              form.activo ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                            }`}>
                              {form.activo ? 'Activo' : 'Inactivo'}
                            </span>
                            {pending > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                                <Clock className="h-2.5 w-2.5" />
                                {pending} pendiente{pending > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          {form.descripcion && (
                            <p className="text-xs text-zinc-400 mb-2 line-clamp-1">{form.descripcion}</p>
                          )}
                          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                            <span>{campos.length} campo{campos.length !== 1 ? 's' : ''}</span>
                            <span>|</span>
                            <span className="font-mono">{form.codigo}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-zinc-50">
                        {/* Link */}
                        <button
                          onClick={() => copyLink(form.codigo)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-semibold hover:bg-blue-100 transition-colors"
                        >
                          <Copy className="h-3 w-3" />
                          Copiar link
                        </button>
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-50 text-zinc-600 text-[11px] font-semibold hover:bg-zinc-100 transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Ver
                        </a>
                        <button
                          onClick={() => setSelectedFormId(selectedFormId === form.id ? null : form.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-[11px] font-semibold hover:bg-amber-100 transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          Solicitudes
                        </button>
                        <button
                          onClick={() => toggleFormActive(form)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-zinc-500 hover:bg-zinc-50 transition-colors"
                        >
                          {form.activo ? <ToggleRight className="h-4 w-4 text-emerald-500" /> : <ToggleLeft className="h-4 w-4" />}
                          {form.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => deleteForm(form.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* ===== SOLICITUDES TAB ===== */}
      {activeTab === 'solicitudes' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {!selectedFormId ? (
            <div className="text-center py-12 bg-white rounded-xl border border-zinc-100">
              <FileText className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">Selecciona un formulario para ver sus solicitudes</p>
              <p className="text-xs text-zinc-400 mt-1">Ve a la pestaña "Mis Formularios" y haz clic en "Solicitudes"</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setSelectedFormId(null)}
                  className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
                >
                  ← Volver a formularios
                </button>
                <div className="flex gap-2">
                  {['todos', 'pendiente', 'aprobado', 'rechazado'].map((est) => (
                    <button
                      key={est}
                      onClick={() => setFilterEstado(est)}
                      className={`px-3 py-1 rounded-full text-[10px] font-semibold capitalize transition-all ${
                        filterEstado === est
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                      }`}
                    >
                      {est === 'todos' ? 'Todos' : est === 'pendiente' ? 'Pendientes' : est === 'aprobado' ? 'Aprobados' : 'Rechazados'}
                    </button>
                  ))}
                </div>
              </div>

              {submissions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-zinc-100">
                  <CheckCircle2 className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500">No hay solicitudes con este filtro</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((sub) => {
                    const datos = JSON.parse(sub.datos || '{}');
                    const formDef = forms.find(f => f.id === sub.formId);
                    const camposDef: FormFieldDef[] = formDef ? JSON.parse(formDef.campos || '[]') : [];
                    const isExpanded = expandedSubId === sub.id;
                    const EstadoIcon = ESTADO_ICONS[sub.estado] || Clock;

                    return (
                      <motion.div
                        key={sub.id}
                        layout
                        className="bg-white rounded-xl border border-zinc-100 shadow-sm overflow-hidden"
                      >
                        <div
                          className="p-4 cursor-pointer hover:bg-zinc-50/50 transition-colors"
                          onClick={() => setExpandedSubId(isExpanded ? null : sub.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${ESTADO_COLORS[sub.estado]}`}>
                                <EstadoIcon className="h-3 w-3" />
                                {sub.estado.toUpperCase()}
                              </span>
                              <span className="text-sm font-medium text-zinc-700">
                                {datos.nombre || datos.email || `Solicitud #${sub.id}`}
                              </span>
                              {sub.pedidoCreado && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold">
                                  <Package className="h-2.5 w-2.5" />
                                  Pedido creado
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-zinc-400">
                                {new Date(sub.createdAt).toLocaleDateString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isExpanded ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
                            </div>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 border-t border-zinc-50 pt-3">
                                {/* Data fields */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                                  {camposDef.map((campo) => {
                                    const val = datos[campo.nombre];
                                    if (!val) return null;
                                    return (
                                      <div key={campo.nombre} className="bg-zinc-50 rounded-lg p-2.5">
                                        <p className="text-[10px] text-zinc-400 font-medium uppercase mb-0.5">{campo.etiqueta}</p>
                                        <p className="text-xs text-zinc-800 break-all">{val}</p>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Reject reason */}
                                {sub.estado === 'rechazado' && sub.motivoRechazo && (
                                  <div className="flex items-start gap-2 p-2.5 bg-red-50 rounded-lg mb-3">
                                    <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                                    <div>
                                      <p className="text-[10px] text-red-600 font-semibold">Motivo de rechazo:</p>
                                      <p className="text-xs text-red-700">{sub.motivoRechazo}</p>
                                    </div>
                                  </div>
                                )}

                                {/* Admin notes */}
                                {sub.adminNotas && (
                                  <div className="flex items-start gap-2 p-2.5 bg-blue-50 rounded-lg mb-3">
                                    <FileText className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                                    <div>
                                      <p className="text-[10px] text-blue-600 font-semibold">Notas admin:</p>
                                      <p className="text-xs text-blue-700">{sub.adminNotas}</p>
                                    </div>
                                  </div>
                                )}

                                {/* Actions for pending */}
                                {sub.estado === 'pendiente' && (
                                  <div className="flex flex-wrap gap-2 pt-3 border-t border-zinc-100">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleApprove(sub.id, false); }}
                                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors shadow-sm"
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      Aprobar
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleApprove(sub.id, true); }}
                                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition-colors shadow-sm"
                                    >
                                      <Package className="h-3.5 w-3.5" />
                                      Aprobar + Crear Pedido
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); openRejectModal(sub.id); }}
                                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors border border-red-200"
                                    >
                                      <XCircle className="h-3.5 w-3.5" />
                                      Rechazar
                                    </button>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </motion.div>
      )}

      {/* ===== CREATE/EDIT FORM MODAL ===== */}
      <AnimatePresence>
        {showCreateModal && (
          <FormCreateEditModal
            form={editForm}
            onClose={() => {
              setShowCreateModal(false);
              setEditForm(null);
              sessionStorage.removeItem('pf_template');
            }}
            onSaved={() => {
              setShowCreateModal(false);
              setEditForm(null);
              sessionStorage.removeItem('pf_template');
              fetchForms();
            }}
          />
        )}
      </AnimatePresence>

      {/* ===== REJECT MODAL ===== */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowRejectModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold text-sm" style={{ color: '#18181b' }}>Rechazar solicitud</h3>
                  <p className="text-xs text-zinc-400">Indica el motivo</p>
                </div>
              </div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Motivo del rechazo (opcional)..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm outline-none resize-none focus:border-red-300 focus:ring-2 focus:ring-red-100 mb-4"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:bg-zinc-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
                >
                  Rechazar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// Form Create/Edit Modal Component
// ==========================================
function FormCreateEditModal({
  form,
  onClose,
  onSaved,
}: {
  form: PublicForm | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nombre, setNombre] = useState(form?.nombre || '');
  const [descripcion, setDescripcion] = useState(form?.descripcion || '');
  const [campos, setCampos] = useState<FormFieldDef[]>(
    form ? JSON.parse(form.campos || '[]') : []
  );
  const [saving, setSaving] = useState(false);

  // Load template if coming from template quick-create
  useEffect(() => {
    if (form) return; // Don't override if editing
    const tplKey = sessionStorage.getItem('pf_template');
    if (tplKey && TEMPLATES[tplKey]) {
      const tpl = TEMPLATES[tplKey];
      setNombre(tpl.nombre);
      setDescripcion(tpl.descripcion);
      setCampos(tpl.campos);
    }
  }, [form]);

  function addCampo() {
    setCampos((prev) => [
      ...prev,
      {
        nombre: `campo_${prev.length + 1}`,
        etiqueta: `Campo ${prev.length + 1}`,
        tipo: 'texto',
        requerido: false,
      },
    ]);
  }

  function removeCampo(index: number) {
    setCampos((prev) => prev.filter((_, i) => i !== index));
  }

  function updateCampo(index: number, field: keyof FormFieldDef, value: any) {
    setCampos((prev) => {
      const next = [...prev];
      (next[index] as any)[field] = value;
      return next;
    });
  }

  function addOpcion(campoIndex: number) {
    setCampos((prev) => {
      const next = [...prev];
      if (!next[campoIndex].opciones) next[campoIndex].opciones = [];
      next[campoIndex].opciones!.push(`Opción ${next[campoIndex].opciones!.length + 1}`);
      return next;
    });
  }

  function removeOpcion(campoIndex: number, optIndex: number) {
    setCampos((prev) => {
      const next = [...prev];
      next[campoIndex].opciones = next[campoIndex].opciones?.filter((_, i) => i !== optIndex);
      return next;
    });
  }

  function updateOpcion(campoIndex: number, optIndex: number, value: string) {
    setCampos((prev) => {
      const next = [...prev];
      if (next[campoIndex].opciones) {
        next[campoIndex].opciones![optIndex] = value;
      }
      return next;
    });
  }

  async function handleSave() {
    if (!nombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    if (campos.length === 0) {
      alert('Agrega al menos un campo');
      return;
    }

    setSaving(true);
    try {
      const url = form ? '/api/public-forms' : '/api/public-forms';
      const method = form ? 'PUT' : 'POST';
      const body = form
        ? { id: form.id, nombre, descripcion, campos }
        : { nombre, descripcion, campos };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.ok) {
        onSaved();
      } else {
        alert(json.error || 'Error al guardar');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                {form ? <Edit3 className="h-5 w-5 text-white" /> : <Plus className="h-5 w-5 text-white" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{form ? 'Editar Formulario' : 'Nuevo Formulario'}</h3>
                <p className="text-blue-200 text-xs">Configura los campos que verá el cliente</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[65vh] overflow-y-auto space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-1">
              Nombre del formulario <span className="text-red-500">*</span>
            </label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Solicitud de Envío"
              className="w-full h-10 px-3 rounded-lg border border-zinc-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-1">Descripción (opcional)</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Texto que verá el cliente al abrir el formulario..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm outline-none resize-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Fields */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-zinc-700">
                Campos del formulario ({campos.length})
              </label>
              <button
                onClick={addCampo}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors"
              >
                <Plus className="h-3 w-3" />
                Agregar campo
              </button>
            </div>

            {campos.length === 0 && (
              <div className="text-center py-6 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                <p className="text-xs text-zinc-400">No hay campos. Agrega al menos uno.</p>
              </div>
            )}

            <div className="space-y-3">
              {campos.map((campo, idx) => (
                <motion.div
                  key={idx}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-zinc-50 rounded-xl p-3 border border-zinc-100"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] text-zinc-400 font-medium">Campo #{idx + 1}</span>
                    <button
                      onClick={() => removeCampo(idx)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={campo.etiqueta}
                      onChange={(e) => updateCampo(idx, 'etiqueta', e.target.value)}
                      placeholder="Etiqueta visible"
                      className="h-9 px-2.5 rounded-lg border border-zinc-200 text-xs outline-none focus:border-blue-400 bg-white"
                    />
                    <input
                      value={campo.nombre}
                      onChange={(e) => updateCampo(idx, 'nombre', e.target.value.replace(/\s+/g, '_').toLowerCase())}
                      placeholder="nombre_interno"
                      className="h-9 px-2.5 rounded-lg border border-zinc-200 text-xs outline-none focus:border-blue-400 bg-white font-mono"
                    />
                    <select
                      value={campo.tipo}
                      onChange={(e) => updateCampo(idx, 'tipo', e.target.value)}
                      className="h-9 px-2.5 rounded-lg border border-zinc-200 text-xs outline-none focus:border-blue-400 bg-white"
                    >
                      {Object.entries(TIPO_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2 h-9 px-2.5 bg-white rounded-lg border border-zinc-200">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={campo.requerido}
                          onChange={(e) => updateCampo(idx, 'requerido', e.target.checked)}
                          className="rounded border-zinc-300 text-blue-600"
                        />
                        <span className="text-xs text-zinc-600">Requerido</span>
                      </label>
                    </div>
                  </div>

                  <input
                    value={campo.placeholder || ''}
                    onChange={(e) => updateCampo(idx, 'placeholder', e.target.value)}
                    placeholder="Placeholder (texto de ayuda)"
                    className="w-full h-9 mt-2 px-2.5 rounded-lg border border-zinc-200 text-xs outline-none focus:border-blue-400 bg-white"
                  />

                  {/* Options for select type */}
                  {campo.tipo === 'select' && (
                    <div className="mt-2 space-y-1">
                      <p className="text-[10px] text-zinc-500 font-medium">Opciones:</p>
                      {(campo.opciones || []).map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-1">
                          <input
                            value={opt}
                            onChange={(e) => updateOpcion(idx, optIdx, e.target.value)}
                            className="flex-1 h-8 px-2 rounded-lg border border-zinc-200 text-xs outline-none focus:border-blue-400 bg-white"
                          />
                          <button onClick={() => removeOpcion(idx, optIdx)} className="text-red-400 hover:text-red-600">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addOpcion(idx)}
                        className="flex items-center gap-1 text-[10px] text-blue-600 font-medium hover:text-blue-800"
                      >
                        <Plus className="h-3 w-3" />
                        Agregar opción
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-zinc-100 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:bg-zinc-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
            ) : (
              <>{form ? 'Actualizar' : 'Crear formulario'} <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Inbox icon (not in lucide-react default, use FileText as alias)
function Inbox(props: any) {
  return <FileText {...props} />;
}
