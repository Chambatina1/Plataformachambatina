'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  StickyNote,
  FileEdit,
  Pin,
  PinOff,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  MapPin,
  User,
  Link2,
  Filter,
  X,
  CalendarDays,
  ListTodo,
  Trophy,
  AlertTriangle,
  Lock,
  BookOpen,
  Tag,
  Timer,
  CircleDot,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

// ==================== TYPES ====================
interface Appointment {
  id: number;
  titulo: string;
  descripcion?: string;
  fecha: string;
  hora?: string;
  duracion?: number;
  prioridad: string;
  estado: string;
  tipo: string;
  ubicacion?: string;
  contacto?: string;
  link?: string;
  createdAt: string;
  updatedAt: string;
}

interface Note {
  id: number;
  titulo: string;
  contenido?: string;
  color: string;
  categoria?: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DayRecord {
  id: number;
  fecha: string;
  resumen?: string;
  logros: string[];
  pendientes: string[];
  notas?: string;
  estado: string;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  citasHoy: number;
  citasSemana: number;
  pendientes: number;
  completadasSemana: number;
  notasActivas: number;
  registroHoy: boolean;
}

// ==================== HELPERS ====================
const formatDate = (d: string) => {
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateLong = (d: string) => {
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const todayStr = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

const prioridadBadge = (p: string) => {
  const colors: Record<string, string> = {
    alta: 'bg-red-100 text-red-700',
    media: 'bg-amber-100 text-amber-700',
    baja: 'bg-green-100 text-green-700',
  };
  return colors[p] || colors.media;
};

const prioridadDot = (p: string) => {
  const colors: Record<string, string> = {
    alta: 'bg-red-500',
    media: 'bg-amber-500',
    baja: 'bg-green-500',
  };
  return colors[p] || colors.media;
};

const estadoBadge = (e: string) => {
  const colors: Record<string, string> = {
    pendiente: 'bg-blue-50 text-blue-700 border-blue-200',
    completada: 'bg-green-50 text-green-700 border-green-200',
    cancelada: 'bg-zinc-50 text-zinc-500 border-zinc-200',
  };
  const labels: Record<string, string> = {
    pendiente: 'Pendiente',
    completada: 'Completada',
    cancelada: 'Cancelada',
  };
  return { color: colors[e] || colors.pendiente, label: labels[e] || e };
};

const tipoIcon = (t: string) => {
  const icons: Record<string, typeof CalendarDays> = {
    cita: CalendarDays,
    tarea: ListTodo,
    recordatorio: Timer,
    reunion: User,
  };
  return icons[t] || CalendarDays;
};

const tipoLabel = (t: string) => {
  const labels: Record<string, string> = {
    cita: 'Cita',
    tarea: 'Tarea',
    recordatorio: 'Recordatorio',
    reunion: 'Reunion',
  };
  return labels[t] || t;
};

const noteBorderColor: Record<string, string> = {
  amber: 'border-l-amber-400',
  blue: 'border-l-blue-400',
  green: 'border-l-green-400',
  rose: 'border-l-rose-400',
  purple: 'border-l-purple-400',
  zinc: 'border-l-zinc-400',
};

const noteBgColor: Record<string, string> = {
  amber: 'bg-amber-50/50',
  blue: 'bg-blue-50/50',
  green: 'bg-green-50/50',
  rose: 'bg-rose-50/50',
  purple: 'bg-purple-50/50',
  zinc: 'bg-zinc-50/50',
};

const noteColorDot: Record<string, string> = {
  amber: 'bg-amber-400',
  blue: 'bg-blue-400',
  green: 'bg-green-400',
  rose: 'bg-rose-400',
  purple: 'bg-purple-400',
  zinc: 'bg-zinc-400',
};

const categoriaBadge = (c: string) => {
  const colors: Record<string, string> = {
    general: 'bg-zinc-100 text-zinc-600',
    importante: 'bg-red-50 text-red-600',
    idea: 'bg-purple-50 text-purple-600',
    cliente: 'bg-blue-50 text-blue-600',
    seguimiento: 'bg-amber-50 text-amber-600',
  };
  return colors[c] || colors.general;
};

// ==================== CALENDAR HELPER ====================
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAY_NAMES = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

// ==================== MAIN COMPONENT ====================
export function ElTati() {
  // Active tab
  const [tab, setTab] = useState<'agenda' | 'citas' | 'apuntes' | 'registro'>('agenda');

  // Calendar state
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(todayStr());

  // Data
  const [stats, setStats] = useState<Stats | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [dayAppointments, setDayAppointments] = useState<Appointment[]>([]);
  const [monthAppointmentDates, setMonthAppointmentDates] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<Note[]>([]);
  const [dayRecord, setDayRecord] = useState<DayRecord | null>(null);
  const [recentRecords, setRecentRecords] = useState<DayRecord[]>([]);

  // Loading
  const [loading, setLoading] = useState(true);

  // Filters for citas tab
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [filterPrioridad, setFilterPrioridad] = useState<string>('all');
  const [filterTipo, setFilterTipo] = useState<string>('all');

  // Search for notes
  const [noteSearch, setNoteSearch] = useState('');

  // Expanded appointment
  const [expandedAppt, setExpandedAppt] = useState<number | null>(null);

  // Dialogs
  const [showApptDialog, setShowApptDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Form states
  const [apptForm, setApptForm] = useState({
    titulo: '',
    descripcion: '',
    fecha: todayStr(),
    hora: '09:00',
    duracion: 30,
    prioridad: 'media',
    tipo: 'cita',
    ubicacion: '',
    contacto: '',
    link: '',
  });

  const [noteForm, setNoteForm] = useState({
    titulo: '',
    contenido: '',
    color: 'amber',
    categoria: 'general',
  });

  const [recordForm, setRecordForm] = useState({
    resumen: '',
    logros: [] as string[],
    pendientes: [] as string[],
    notas: '',
  });

  const [newLogro, setNewLogro] = useState('');
  const [newPendiente, setNewPendiente] = useState('');

  // ==================== DATA FETCHING ====================
  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/el-tati?type=stats');
      const json = await res.json();
      if (json.ok) setStats(json.data);
    } catch {}
  }, []);

  const loadDayAppointments = useCallback(async (date: string) => {
    try {
      const res = await fetch(`/api/el-tati?type=appointments&fecha=${date}`);
      const json = await res.json();
      if (json.ok) setDayAppointments(json.data);
    } catch {}
  }, []);

  const loadMonthAppointments = useCallback(async (year: number, month: number) => {
    try {
      const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(getDaysInMonth(year, month)).padStart(2, '0')}`;
      const res = await fetch(`/api/el-tati?type=appointments&from=${from}&to=${to}`);
      const json = await res.json();
      if (json.ok) {
        const dates = new Set(json.data.map((a: Appointment) => a.fecha));
        setMonthAppointmentDates(dates);
      }
    } catch {}
  }, []);

  const loadAllAppointments = useCallback(async () => {
    try {
      const today = new Date();
      const from = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
      const to = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
      const res = await fetch(`/api/el-tati?type=appointments&from=${from}&to=${to}`);
      const json = await res.json();
      if (json.ok) setAppointments(json.data);
    } catch {}
  }, []);

  const loadNotes = useCallback(async () => {
    try {
      const res = await fetch('/api/el-tati?type=notes');
      const json = await res.json();
      if (json.ok) setNotes(json.data);
    } catch {}
  }, []);

  const loadDayRecord = useCallback(async (date: string) => {
    try {
      const res = await fetch(`/api/el-tati?type=day-record&fecha=${date}`);
      const json = await res.json();
      if (json.ok) {
        setDayRecord(json.data);
        if (json.data) {
          setRecordForm({
            resumen: json.data.resumen || '',
            logros: json.data.logros || [],
            pendientes: json.data.pendientes || [],
            notas: json.data.notas || '',
          });
        } else {
          setRecordForm({ resumen: '', logros: [], pendientes: [], notas: '' });
        }
      }
    } catch {}
  }, []);

  const loadRecentRecords = useCallback(async () => {
    try {
      const today = new Date();
      const from = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
      const to = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
      const res = await fetch(`/api/el-tati?type=day-records&from=${from}&to=${to}`);
      const json = await res.json();
      if (json.ok) setRecentRecords(json.data);
    } catch {}
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      loadStats(),
      loadDayAppointments(selectedDate),
      loadMonthAppointments(calYear, calMonth),
      loadNotes(),
      loadDayRecord(selectedDate),
      loadRecentRecords(),
    ]);
    setLoading(false);
  }, [loadStats, loadDayAppointments, loadMonthAppointments, loadNotes, loadDayRecord, loadRecentRecords, selectedDate, calYear, calMonth]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Load appointments list when switching to citas tab
  useEffect(() => {
    if (tab === 'citas') loadAllAppointments();
  }, [tab, loadAllAppointments]);

  // ==================== ACTIONS ====================
  const handleSaveAppointment = async () => {
    if (!apptForm.titulo.trim()) {
      toast.error('El titulo es requerido');
      return;
    }

    try {
      const url = editingAppt
        ? '/api/el-tati'
        : '/api/el-tati';
      const method = editingAppt ? 'PUT' : 'POST';
      const body = editingAppt
        ? { type: 'appointment', id: editingAppt.id, ...apptForm }
        : { type: 'appointment', ...apptForm };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (json.ok) {
        toast.success(editingAppt ? 'Cita actualizada' : 'Cita creada');
        setShowApptDialog(false);
        setEditingAppt(null);
        setApptForm({ titulo: '', descripcion: '', fecha: todayStr(), hora: '09:00', duracion: 30, prioridad: 'media', tipo: 'cita', ubicacion: '', contacto: '', link: '' });
        loadAll();
      } else {
        toast.error(json.error || 'Error al guardar');
      }
    } catch {
      toast.error('Error de conexion');
    }
  };

  const handleToggleAppointment = async (id: number, action: 'completar' | 'cancelar') => {
    try {
      const res = await fetch('/api/el-tati', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'appointment', id, action }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(action === 'completar' ? 'Marcada como completada' : 'Marcada como cancelada');
        loadAll();
      }
    } catch {
      toast.error('Error de conexion');
    }
  };

  const handleDeleteAppointment = async (id: number) => {
    try {
      const res = await fetch(`/api/el-tati?type=appointment&id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.ok) {
        toast.success('Cita eliminada');
        loadAll();
      }
    } catch {
      toast.error('Error de conexion');
    }
  };

  const handleSaveNote = async () => {
    if (!noteForm.titulo.trim()) {
      toast.error('El titulo es requerido');
      return;
    }

    try {
      const method = editingNote ? 'PUT' : 'POST';
      const body = editingNote
        ? { type: 'note', id: editingNote.id, ...noteForm }
        : { type: 'note', ...noteForm };

      const res = await fetch('/api/el-tati', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (json.ok) {
        toast.success(editingNote ? 'Nota actualizada' : 'Nota creada');
        setShowNoteDialog(false);
        setEditingNote(null);
        setNoteForm({ titulo: '', contenido: '', color: 'amber', categoria: 'general' });
        loadNotes();
      } else {
        toast.error(json.error || 'Error al guardar');
      }
    } catch {
      toast.error('Error de conexion');
    }
  };

  const handleTogglePin = async (note: Note) => {
    try {
      const res = await fetch('/api/el-tati', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'note', id: note.id, pinned: !note.pinned }),
      });
      const json = await res.json();
      if (json.ok) loadNotes();
    } catch {
      toast.error('Error de conexion');
    }
  };

  const handleDeleteNote = async (id: number) => {
    try {
      const res = await fetch(`/api/el-tati?type=note&id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.ok) {
        toast.success('Nota eliminada');
        loadNotes();
      }
    } catch {
      toast.error('Error de conexion');
    }
  };

  const handleSaveRecord = async () => {
    try {
      const res = await fetch('/api/el-tati', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'day-record',
          fecha: selectedDate,
          ...recordForm,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success('Registro guardado');
        setShowRecordDialog(false);
        loadDayRecord(selectedDate);
        loadRecentRecords();
        loadStats();
      }
    } catch {
      toast.error('Error de conexion');
    }
  };

  const handleCloseRecord = async () => {
    if (!dayRecord) return;
    try {
      const res = await fetch('/api/el-tati', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'day-record', id: dayRecord.id, estado: 'cerrado' }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success('Registro cerrado');
        loadDayRecord(selectedDate);
        loadRecentRecords();
      }
    } catch {
      toast.error('Error de conexion');
    }
  };

  // ==================== CALENDAR NAV ====================
  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  const selectDay = (day: number) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    loadDayAppointments(dateStr);
    if (tab === 'registro') loadDayRecord(dateStr);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return calYear === today.getFullYear() && calMonth === today.getMonth() && day === today.getDate();
  };

  const isSelected = (day: number) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return dateStr === selectedDate;
  };

  const openNewAppt = (date?: string) => {
    setEditingAppt(null);
    setApptForm({ titulo: '', descripcion: '', fecha: date || selectedDate, hora: '09:00', duracion: 30, prioridad: 'media', tipo: 'cita', ubicacion: '', contacto: '', link: '' });
    setShowApptDialog(true);
  };

  const openEditAppt = (appt: Appointment) => {
    setEditingAppt(appt);
    setApptForm({
      titulo: appt.titulo,
      descripcion: appt.descripcion || '',
      fecha: appt.fecha,
      hora: appt.hora || '09:00',
      duracion: appt.duracion || 30,
      prioridad: appt.prioridad,
      tipo: appt.tipo,
      ubicacion: appt.ubicacion || '',
      contacto: appt.contacto || '',
      link: appt.link || '',
    });
    setShowApptDialog(true);
  };

  const openNewNote = () => {
    setEditingNote(null);
    setNoteForm({ titulo: '', contenido: '', color: 'amber', categoria: 'general' });
    setShowNoteDialog(true);
  };

  const openEditNote = (note: Note) => {
    setEditingNote(note);
    setNoteForm({ titulo: note.titulo, contenido: note.contenido || '', color: note.color, categoria: note.categoria || 'general' });
    setShowNoteDialog(true);
  };

  // ==================== FILTERED DATA ====================
  const filteredAppointments = appointments.filter((a) => {
    if (filterEstado !== 'all' && a.estado !== filterEstado) return false;
    if (filterPrioridad !== 'all' && a.prioridad !== filterPrioridad) return false;
    if (filterTipo !== 'all' && a.tipo !== filterTipo) return false;
    return true;
  });

  const filteredNotes = notes.filter((n) => {
    if (!noteSearch.trim()) return true;
    const q = noteSearch.toLowerCase();
    return n.titulo.toLowerCase().includes(q) || (n.contenido && n.contenido.toLowerCase().includes(q));
  });

  // ==================== RENDER ====================
  if (loading) {
    return (
      <div className="p-4 max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Sparkles className="h-8 w-8 text-orange-400 animate-pulse mx-auto mb-3" />
          <p className="text-sm text-zinc-400">Cargando El Tati...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-200">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: '#18181b' }}>
              El Tati
              <Sparkles className="h-4 w-4 text-orange-400" />
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">Planificador inteligente de trabajo</p>
          </div>
        </div>
        <button
          onClick={openNewAppt}
          className="h-9 px-4 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-orange-200 transition-all"
        >
          <Plus className="h-4 w-4" />
          Nueva Cita
        </button>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { icon: CalendarDays, label: 'Citas hoy', value: stats.citasHoy, color: 'bg-orange-100', iconColor: 'text-orange-600' },
            { icon: Clock, label: 'Pendientes', value: stats.pendientes, color: 'bg-blue-100', iconColor: 'text-blue-600' },
            { icon: CheckCircle2, label: 'Completadas semana', value: stats.completadasSemana, color: 'bg-green-100', iconColor: 'text-green-600' },
            { icon: StickyNote, label: 'Notas activas', value: stats.notasActivas, color: 'bg-amber-100', iconColor: 'text-amber-600' },
            { icon: FileEdit, label: 'Registro hoy', value: stats.registroHoy ? 'Si' : 'No', color: 'bg-purple-100', iconColor: 'text-purple-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-zinc-100 p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-7 h-7 rounded-lg ${s.color} flex items-center justify-center`}>
                  <s.icon className={`h-3.5 w-3.5 ${s.iconColor}`} />
                </div>
              </div>
              <p className="text-xl font-bold" style={{ color: '#18181b' }}>{s.value}</p>
              <p className="text-[10px] text-zinc-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-100 rounded-xl p-1">
        {[
          { key: 'agenda' as const, label: 'Agenda', icon: Calendar },
          { key: 'citas' as const, label: 'Citas', icon: ListTodo },
          { key: 'apuntes' as const, label: 'Apuntes', icon: StickyNote },
          { key: 'registro' as const, label: 'Registro del Dia', icon: FileEdit },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                active
                  ? 'bg-white text-orange-700 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============ AGENDA TAB ============ */}
      {tab === 'agenda' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-100 p-4">
            {/* Calendar header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: '#18181b' }}>
                {MONTH_NAMES[calMonth]} {calYear}
              </h2>
              <div className="flex items-center gap-1">
                <button onClick={prevMonth} className="w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center transition-colors">
                  <ChevronLeft className="h-4 w-4 text-zinc-500" />
                </button>
                <button
                  onClick={() => { setCalMonth(new Date().getMonth()); setCalYear(new Date().getFullYear()); }}
                  className="h-8 px-2 rounded-lg hover:bg-zinc-100 text-[10px] text-zinc-500 font-medium transition-colors"
                >
                  Hoy
                </button>
                <button onClick={nextMonth} className="w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center transition-colors">
                  <ChevronRight className="h-4 w-4 text-zinc-500" />
                </button>
              </div>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAY_NAMES.map((d) => (
                <div key={d} className="text-center text-[10px] text-zinc-400 font-medium py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells */}
              {Array.from({ length: getFirstDayOfMonth(calYear, calMonth) }).map((_, i) => (
                <div key={`empty-${i}`} className="h-10" />
              ))}
              {/* Days */}
              {Array.from({ length: getDaysInMonth(calYear, calMonth) }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const hasAppointments = monthAppointmentDates.has(dateStr);
                const today = isToday(day);
                const selected = isSelected(day);
                const isPast = new Date(dateStr) < new Date(todayStr());

                return (
                  <button
                    key={day}
                    onClick={() => selectDay(day)}
                    className={`h-10 rounded-lg flex flex-col items-center justify-center text-sm relative transition-all duration-200 ${
                      selected
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                        : today
                        ? 'bg-orange-50 text-orange-700 font-semibold'
                        : isPast
                        ? 'text-zinc-300 hover:bg-zinc-50'
                        : 'text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    <span className="text-xs">{day}</span>
                    {hasAppointments && (
                      <div className="absolute bottom-1 flex gap-0.5">
                        <div className={`w-1 h-1 rounded-full ${selected ? 'bg-white' : 'bg-orange-400'}`} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected day panel */}
          <div className="space-y-4">
            {/* Day info */}
            <div className="bg-white rounded-xl border border-zinc-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold capitalize" style={{ color: '#18181b' }}>
                    {formatDateLong(selectedDate)}
                  </h3>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    {dayAppointments.length} {dayAppointments.length === 1 ? 'cita' : 'citas'}
                  </p>
                </div>
                <button
                  onClick={() => openNewAppt(selectedDate)}
                  className="w-8 h-8 rounded-lg bg-orange-50 hover:bg-orange-100 flex items-center justify-center transition-colors"
                >
                  <Plus className="h-4 w-4 text-orange-600" />
                </button>
              </div>

              {dayAppointments.length === 0 ? (
                <div className="text-center py-6">
                  <CalendarDays className="h-8 w-8 text-zinc-200 mx-auto mb-2" />
                  <p className="text-xs text-zinc-400">Sin citas para este dia</p>
                  <button
                    onClick={() => openNewAppt(selectedDate)}
                    className="text-[10px] text-orange-600 hover:text-orange-700 font-medium mt-1"
                  >
                    + Agregar cita
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {dayAppointments.map((appt) => {
                    const TipoIcon = tipoIcon(appt.tipo);
                    const expanded = expandedAppt === appt.id;
                    return (
                      <motion.div
                        key={appt.id}
                        layout
                        className={`rounded-lg border transition-all duration-200 cursor-pointer ${
                          expanded ? 'border-orange-200 bg-orange-50/30' : 'border-zinc-100 hover:border-zinc-200 bg-white'
                        }`}
                        onClick={() => setExpandedAppt(expanded ? null : appt.id)}
                      >
                        <div className="p-3 flex items-start gap-2.5">
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${prioridadDot(appt.prioridad)}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <TipoIcon className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                              <span className={`text-sm font-medium truncate ${appt.estado === 'completada' ? 'line-through text-zinc-400' : ''}`} style={{ color: appt.estado === 'completada' ? undefined : '#18181b' }}>
                                {appt.titulo}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {appt.hora && (
                                <span className="text-[10px] text-zinc-500 flex items-center gap-0.5">
                                  <Clock className="h-3 w-3" /> {appt.hora}
                                </span>
                              )}
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${prioridadBadge(appt.prioridad)}`}>
                                {appt.prioridad}
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${estadoBadge(appt.estado).color}`}>
                                {estadoBadge(appt.estado).label}
                              </span>
                            </div>
                          </div>
                        </div>

                        <AnimatePresence>
                          {expanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-3 pb-3 pt-0 space-y-2 border-t border-zinc-100 mt-0">
                                <div className="pt-2">
                                  {appt.descripcion && (
                                    <p className="text-xs text-zinc-600 mb-2">{appt.descripcion}</p>
                                  )}
                                  <div className="flex flex-wrap gap-3 text-[10px] text-zinc-500">
                                    {appt.ubicacion && (
                                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {appt.ubicacion}</span>
                                    )}
                                    {appt.contacto && (
                                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> {appt.contacto}</span>
                                    )}
                                    {appt.link && (
                                      <a href={appt.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-orange-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                                        <Link2 className="h-3 w-3" /> Link
                                      </a>
                                    )}
                                    {appt.duracion && (
                                      <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> {appt.duracion} min</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 pt-1">
                                  {appt.estado === 'pendiente' && (
                                    <>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleToggleAppointment(appt.id, 'completar'); }}
                                        className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                      >
                                        <CheckCircle2 className="h-3 w-3" /> Completar
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleToggleAppointment(appt.id, 'cancelar'); }}
                                        className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-zinc-50 text-zinc-500 hover:bg-zinc-100 transition-colors"
                                      >
                                        <XCircle className="h-3 w-3" /> Cancelar
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openEditAppt(appt); }}
                                    className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                  >
                                    <FileEdit className="h-3 w-3" /> Editar
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteAppointment(appt.id); }}
                                    className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Today's quick summary */}
            {selectedDate === todayStr() && (
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200 p-4">
                <h3 className="text-xs font-semibold text-orange-800 mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Resumen del dia
                </h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-orange-700">{dayAppointments.filter(a => a.estado === 'pendiente').length}</p>
                    <p className="text-[10px] text-orange-600">Pendientes</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-600">{dayAppointments.filter(a => a.estado === 'completada').length}</p>
                    <p className="text-[10px] text-green-600">Completadas</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-zinc-400">{dayAppointments.filter(a => a.estado === 'cancelada').length}</p>
                    <p className="text-[10px] text-zinc-400">Canceladas</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ CITAS TAB ============ */}
      {tab === 'citas' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-xl border border-zinc-100 p-3 flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-zinc-400" />
            <span className="text-[10px] text-zinc-500 font-medium">Filtrar:</span>
            {[
              { label: 'Todos', value: 'all', state: filterEstado, setter: setFilterEstado },
              { label: 'Pendiente', value: 'pendiente', state: filterEstado, setter: setFilterEstado },
              { label: 'Completada', value: 'completada', state: filterEstado, setter: setFilterEstado },
              { label: 'Cancelada', value: 'cancelada', state: filterEstado, setter: setFilterEstado },
            ].map((f) => (
              <button
                key={`estado-${f.value}`}
                onClick={() => f.setter(f.value)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                  f.state === f.value
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                }`}
              >
                {f.label}
              </button>
            ))}
            <div className="w-px h-4 bg-zinc-200 mx-1" />
            {[
              { label: 'Alta', value: 'alta' },
              { label: 'Media', value: 'media' },
              { label: 'Baja', value: 'baja' },
            ].map((f) => (
              <button
                key={`prior-${f.value}`}
                onClick={() => setFilterPrioridad(filterPrioridad === f.value ? 'all' : f.value)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                  filterPrioridad === f.value
                    ? prioridadBadge(f.value)
                    : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                }`}
              >
                {f.label}
              </button>
            ))}
            <div className="w-px h-4 bg-zinc-200 mx-1" />
            {[
              { label: 'Cita', value: 'cita' },
              { label: 'Tarea', value: 'tarea' },
              { label: 'Recordatorio', value: 'recordatorio' },
              { label: 'Reunion', value: 'reunion' },
            ].map((f) => (
              <button
                key={`tipo-${f.value}`}
                onClick={() => setFilterTipo(filterTipo === f.value ? 'all' : f.value)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                  filterTipo === f.value
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Appointment list */}
          <div className="bg-white rounded-xl border border-zinc-100 overflow-hidden">
            <div className="p-3 border-b border-zinc-100">
              <span className="text-xs font-medium" style={{ color: '#18181b' }}>
                Citas del mes ({filteredAppointments.length})
              </span>
            </div>

            {filteredAppointments.length === 0 ? (
              <div className="p-8 text-center">
                <ListTodo className="h-8 w-8 text-zinc-200 mx-auto mb-2" />
                <p className="text-sm text-zinc-400">No hay citas que coincidan con los filtros</p>
                <button onClick={() => { setFilterEstado('all'); setFilterPrioridad('all'); setFilterTipo('all'); }} className="text-[10px] text-orange-600 hover:text-orange-700 font-medium mt-1">
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className="divide-y divide-zinc-50 max-h-[500px] overflow-y-auto">
                {filteredAppointments.map((appt) => {
                  const TipoIcon = tipoIcon(appt.tipo);
                  const expanded = expandedAppt === appt.id;
                  return (
                    <motion.div
                      key={appt.id}
                      layout
                      className={`transition-all duration-200 cursor-pointer ${
                        expanded ? 'bg-orange-50/20' : 'hover:bg-zinc-50/50'
                      }`}
                      onClick={() => setExpandedAppt(expanded ? null : appt.id)}
                    >
                      <div className="p-4 flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${prioridadDot(appt.prioridad)}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <TipoIcon className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                            <span className={`text-sm font-medium truncate ${appt.estado === 'completada' ? 'line-through text-zinc-400' : ''}`} style={{ color: appt.estado === 'completada' ? undefined : '#18181b' }}>
                              {appt.titulo}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[10px] text-zinc-500">{formatDate(appt.fecha)}</span>
                            {appt.hora && (
                              <span className="text-[10px] text-zinc-500 flex items-center gap-0.5">
                                <Clock className="h-3 w-3" /> {appt.hora}
                              </span>
                            )}
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600">
                              {tipoLabel(appt.tipo)}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${prioridadBadge(appt.prioridad)}`}>
                              {appt.prioridad}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${estadoBadge(appt.estado).color}`}>
                              {estadoBadge(appt.estado).label}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className={`h-4 w-4 text-zinc-300 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                      </div>

                      <AnimatePresence>
                        {expanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 pt-0 space-y-3 border-t border-zinc-100 mt-0">
                              <div className="pt-3">
                                {appt.descripcion && (
                                  <p className="text-xs text-zinc-600 mb-2">{appt.descripcion}</p>
                                )}
                                <div className="flex flex-wrap gap-3 text-[10px] text-zinc-500">
                                  {appt.ubicacion && (
                                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {appt.ubicacion}</span>
                                  )}
                                  {appt.contacto && (
                                    <span className="flex items-center gap-1"><User className="h-3 w-3" /> {appt.contacto}</span>
                                  )}
                                  {appt.link && (
                                    <a href={appt.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-orange-600 hover:underline" onClick={(e) => e.stopPropagation()}>
                                      <Link2 className="h-3 w-3" /> Abrir link
                                    </a>
                                  )}
                                  {appt.duracion && (
                                    <span className="flex items-center gap-1"><Timer className="h-3 w-3" /> {appt.duracion} min</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 flex-wrap">
                                {appt.estado === 'pendiente' && (
                                  <>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleToggleAppointment(appt.id, 'completar'); }}
                                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] bg-green-50 text-green-600 hover:bg-green-100 transition-colors font-medium"
                                    >
                                      <CheckCircle2 className="h-3 w-3" /> Completar
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleToggleAppointment(appt.id, 'cancelar'); }}
                                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] bg-zinc-50 text-zinc-500 hover:bg-zinc-100 transition-colors font-medium"
                                    >
                                      <XCircle className="h-3 w-3" /> Cancelar
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); openEditAppt(appt); }}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium"
                                >
                                  <FileEdit className="h-3 w-3" /> Editar
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteAppointment(appt.id); }}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-medium"
                                >
                                  <Trash2 className="h-3 w-3" /> Eliminar
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ APUNTES TAB ============ */}
      {tab === 'apuntes' && (
        <div className="space-y-4">
          {/* Search + add */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar notas..."
                value={noteSearch}
                onChange={(e) => setNoteSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-lg border border-zinc-200 text-sm bg-white focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-colors"
                style={{ color: '#18181b' }}
              />
            </div>
            <button
              onClick={openNewNote}
              className="h-10 px-4 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-orange-200 transition-all"
            >
              <Plus className="h-4 w-4" />
              Nueva Nota
            </button>
          </div>

          {/* Notes grid */}
          {filteredNotes.length === 0 ? (
            <div className="bg-white rounded-xl border border-zinc-100 p-8 text-center">
              <StickyNote className="h-10 w-10 text-zinc-200 mx-auto mb-3" />
              <p className="text-sm text-zinc-400">{noteSearch ? 'No se encontraron notas' : 'Aun no tienes notas'}</p>
              <p className="text-xs text-zinc-300 mt-1">
                {noteSearch ? 'Intenta con otra busqueda' : 'Crea tu primera nota para empezar'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredNotes.map((note) => (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-xl border border-zinc-100 border-l-4 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer ${noteBorderColor[note.color] || 'border-l-amber-400'}`}
                  onClick={() => openEditNote(note)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {note.pinned && <Pin className="h-3.5 w-3.5 text-orange-500 shrink-0" />}
                        <h3 className="text-sm font-semibold truncate" style={{ color: '#18181b' }}>{note.titulo}</h3>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleTogglePin(note); }}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${note.pinned ? 'bg-orange-50 text-orange-600' : 'text-zinc-300 hover:bg-zinc-50'}`}
                        >
                          {note.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {note.contenido && (
                      <p className="text-xs text-zinc-500 mt-2 line-clamp-3">{note.contenido}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <div className={`w-2 h-2 rounded-full ${noteColorDot[note.color] || 'bg-amber-400'}`} />
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${categoriaBadge(note.categoria || 'general')}`}>
                        {note.categoria || 'general'}
                      </span>
                      <span className="text-[10px] text-zinc-400 ml-auto">
                        {new Date(note.createdAt).toLocaleDateString('es', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============ REGISTRO DEL DIA TAB ============ */}
      {tab === 'registro' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Today's record */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold" style={{ color: '#18181b' }}>
                Registro de {formatDateLong(selectedDate)}
              </h2>
              <div className="flex items-center gap-2">
                {dayRecord && dayRecord.estado === 'cerrado' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Cerrado
                  </span>
                )}
                <button
                  onClick={() => setShowRecordDialog(true)}
                  className="h-8 px-3 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <FileEdit className="h-3.5 w-3.5" />
                  {dayRecord ? 'Editar' : 'Crear'} registro
                </button>
              </div>
            </div>

            {dayRecord ? (
              <div className="bg-white rounded-xl border border-zinc-100 p-4 space-y-4">
                {dayRecord.resumen && (
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" /> Resumen
                    </h3>
                    <p className="text-sm text-zinc-600">{dayRecord.resumen}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1.5">
                    <Trophy className="h-3.5 w-3.5" /> Logros ({dayRecord.logros?.length || 0})
                  </h3>
                  {dayRecord.logros && dayRecord.logros.length > 0 ? (
                    <div className="space-y-1">
                      {dayRecord.logros.map((logro, i) => (
                        <div key={i} className="flex items-start gap-2 bg-green-50/50 rounded-lg p-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                          <span className="text-xs text-green-700">{logro}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400">Sin logros registrados</p>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> Pendientes ({dayRecord.pendientes?.length || 0})
                  </h3>
                  {dayRecord.pendientes && dayRecord.pendientes.length > 0 ? (
                    <div className="space-y-1">
                      {dayRecord.pendientes.map((p, i) => (
                        <div key={i} className="flex items-start gap-2 bg-amber-50/50 rounded-lg p-2">
                          <CircleDot className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                          <span className="text-xs text-amber-700">{p}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400">Sin pendientes</p>
                  )}
                </div>

                {dayRecord.notas && (
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-500 mb-1 flex items-center gap-1.5">
                      <StickyNote className="h-3.5 w-3.5" /> Notas adicionales
                    </h3>
                    <p className="text-xs text-zinc-600 bg-zinc-50 rounded-lg p-3">{dayRecord.notas}</p>
                  </div>
                )}

                {dayRecord.estado === 'activo' && (
                  <button
                    onClick={handleCloseRecord}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-zinc-200 text-xs text-zinc-500 hover:bg-zinc-50 transition-colors"
                  >
                    <Lock className="h-3.5 w-3.5" /> Cerrar registro del dia
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-zinc-100 p-8 text-center">
                <FileEdit className="h-10 w-10 text-zinc-200 mx-auto mb-3" />
                <p className="text-sm text-zinc-400">Sin registro para este dia</p>
                <p className="text-xs text-zinc-300 mt-1">Crea un registro para documentar tu dia</p>
                <button
                  onClick={() => setShowRecordDialog(true)}
                  className="mt-3 px-4 py-2 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-medium transition-colors"
                >
                  Crear registro
                </button>
              </div>
            )}
          </div>

          {/* Recent records */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold" style={{ color: '#18181b' }}>
              Registros recientes
            </h2>

            {recentRecords.length === 0 ? (
              <div className="bg-white rounded-xl border border-zinc-100 p-8 text-center">
                <BookOpen className="h-10 w-10 text-zinc-200 mx-auto mb-3" />
                <p className="text-sm text-zinc-400">Sin registros este mes</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {recentRecords.map((record) => (
                  <button
                    key={record.id}
                    onClick={() => { setSelectedDate(record.fecha); loadDayRecord(record.fecha); loadDayAppointments(record.fecha); }}
                    className="w-full bg-white rounded-xl border border-zinc-100 p-3 hover:border-orange-200 hover:bg-orange-50/30 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium capitalize" style={{ color: '#18181b' }}>
                        {formatDateLong(record.fecha)}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${record.estado === 'cerrado' ? 'bg-zinc-100 text-zinc-500' : 'bg-green-50 text-green-600'}`}>
                        {record.estado === 'cerrado' ? 'Cerrado' : 'Activo'}
                      </span>
                    </div>
                    {record.resumen && (
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{record.resumen}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-green-600 flex items-center gap-0.5">
                        <Trophy className="h-3 w-3" /> {record.logros?.length || 0}
                      </span>
                      <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
                        <AlertTriangle className="h-3 w-3" /> {record.pendientes?.length || 0}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ APPOINTMENT DIALOG ============ */}
      <AnimatePresence>
        {showApptDialog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => setShowApptDialog(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
                  <h2 className="text-sm font-semibold" style={{ color: '#18181b' }}>
                    {editingAppt ? 'Editar Cita' : 'Nueva Cita'}
                  </h2>
                  <button onClick={() => setShowApptDialog(false)} className="w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center">
                    <X className="h-4 w-4 text-zinc-400" />
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="text-[10px] text-zinc-500 font-medium block mb-1">Titulo *</label>
                    <input
                      type="text"
                      value={apptForm.titulo}
                      onChange={(e) => setApptForm(f => ({ ...f, titulo: e.target.value }))}
                      className="w-full h-9 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                      placeholder="Titulo de la cita"
                      style={{ color: '#18181b' }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-zinc-500 font-medium block mb-1">Fecha *</label>
                      <input
                        type="date"
                        value={apptForm.fecha}
                        onChange={(e) => setApptForm(f => ({ ...f, fecha: e.target.value }))}
                        className="w-full h-9 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                        style={{ color: '#18181b' }}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 font-medium block mb-1">Hora</label>
                      <input
                        type="time"
                        value={apptForm.hora}
                        onChange={(e) => setApptForm(f => ({ ...f, hora: e.target.value }))}
                        className="w-full h-9 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                        style={{ color: '#18181b' }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] text-zinc-500 font-medium block mb-1">Duracion (min)</label>
                      <input
                        type="number"
                        value={apptForm.duracion}
                        onChange={(e) => setApptForm(f => ({ ...f, duracion: parseInt(e.target.value) || 30 }))}
                        className="w-full h-9 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                        style={{ color: '#18181b' }}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 font-medium block mb-1">Prioridad</label>
                      <select
                        value={apptForm.prioridad}
                        onChange={(e) => setApptForm(f => ({ ...f, prioridad: e.target.value }))}
                        className="w-full h-9 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                        style={{ color: '#18181b' }}
                      >
                        <option value="alta">Alta</option>
                        <option value="media">Media</option>
                        <option value="baja">Baja</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 font-medium block mb-1">Tipo</label>
                      <select
                        value={apptForm.tipo}
                        onChange={(e) => setApptForm(f => ({ ...f, tipo: e.target.value }))}
                        className="w-full h-9 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                        style={{ color: '#18181b' }}
                      >
                        <option value="cita">Cita</option>
                        <option value="tarea">Tarea</option>
                        <option value="recordatorio">Recordatorio</option>
                        <option value="reunion">Reunion</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 font-medium block mb-1">Descripcion</label>
                    <textarea
                      value={apptForm.descripcion}
                      onChange={(e) => setApptForm(f => ({ ...f, descripcion: e.target.value }))}
                      className="w-full h-20 px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 resize-none"
                      placeholder="Descripcion de la cita..."
                      style={{ color: '#18181b' }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 font-medium block mb-1">Ubicacion</label>
                    <input
                      type="text"
                      value={apptForm.ubicacion}
                      onChange={(e) => setApptForm(f => ({ ...f, ubicacion: e.target.value }))}
                      className="w-full h-9 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                      placeholder="Ubicacion"
                      style={{ color: '#18181b' }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-zinc-500 font-medium block mb-1">Contacto</label>
                      <input
                        type="text"
                        value={apptForm.contacto}
                        onChange={(e) => setApptForm(f => ({ ...f, contacto: e.target.value }))}
                        className="w-full h-9 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                        placeholder="Nombre o telefono"
                        style={{ color: '#18181b' }}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 font-medium block mb-1">Link</label>
                      <input
                        type="url"
                        value={apptForm.link}
                        onChange={(e) => setApptForm(f => ({ ...f, link: e.target.value }))}
                        className="w-full h-9 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                        placeholder="https://..."
                        style={{ color: '#18181b' }}
                      />
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-zinc-100 flex justify-end gap-2">
                  <button
                    onClick={() => setShowApptDialog(false)}
                    className="h-9 px-4 rounded-lg border border-zinc-200 text-xs text-zinc-600 hover:bg-zinc-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveAppointment}
                    className="h-9 px-4 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-medium transition-all shadow-md shadow-orange-200"
                  >
                    {editingAppt ? 'Guardar cambios' : 'Crear cita'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ============ NOTE DIALOG ============ */}
      <AnimatePresence>
        {showNoteDialog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => setShowNoteDialog(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
                  <h2 className="text-sm font-semibold" style={{ color: '#18181b' }}>
                    {editingNote ? 'Editar Nota' : 'Nueva Nota'}
                  </h2>
                  <button onClick={() => setShowNoteDialog(false)} className="w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center">
                    <X className="h-4 w-4 text-zinc-400" />
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="text-[10px] text-zinc-500 font-medium block mb-1">Titulo *</label>
                    <input
                      type="text"
                      value={noteForm.titulo}
                      onChange={(e) => setNoteForm(f => ({ ...f, titulo: e.target.value }))}
                      className="w-full h-9 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                      placeholder="Titulo de la nota"
                      style={{ color: '#18181b' }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 font-medium block mb-1">Contenido</label>
                    <textarea
                      value={noteForm.contenido}
                      onChange={(e) => setNoteForm(f => ({ ...f, contenido: e.target.value }))}
                      className="w-full h-32 px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 resize-none"
                      placeholder="Contenido de la nota..."
                      style={{ color: '#18181b' }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-zinc-500 font-medium block mb-1">Color</label>
                      <div className="flex gap-2">
                        {['amber', 'blue', 'green', 'rose', 'purple', 'zinc'].map((c) => (
                          <button
                            key={c}
                            onClick={() => setNoteForm(f => ({ ...f, color: c }))}
                            className={`w-7 h-7 rounded-full border-2 transition-all ${noteColorDot[c]} ${noteForm.color === c ? 'border-zinc-800 scale-110' : 'border-transparent'}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 font-medium block mb-1">Categoria</label>
                      <select
                        value={noteForm.categoria}
                        onChange={(e) => setNoteForm(f => ({ ...f, categoria: e.target.value }))}
                        className="w-full h-9 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                        style={{ color: '#18181b' }}
                      >
                        <option value="general">General</option>
                        <option value="importante">Importante</option>
                        <option value="idea">Idea</option>
                        <option value="cliente">Cliente</option>
                        <option value="seguimiento">Seguimiento</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-zinc-100 flex justify-end gap-2">
                  <button
                    onClick={() => setShowNoteDialog(false)}
                    className="h-9 px-4 rounded-lg border border-zinc-200 text-xs text-zinc-600 hover:bg-zinc-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveNote}
                    className="h-9 px-4 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-medium transition-all shadow-md shadow-orange-200"
                  >
                    {editingNote ? 'Guardar cambios' : 'Crear nota'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ============ RECORD DIALOG ============ */}
      <AnimatePresence>
        {showRecordDialog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => setShowRecordDialog(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
                  <h2 className="text-sm font-semibold" style={{ color: '#18181b' }}>
                    {dayRecord ? 'Editar Registro' : 'Nuevo Registro'} - {formatDate(selectedDate)}
                  </h2>
                  <button onClick={() => setShowRecordDialog(false)} className="w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center">
                    <X className="h-4 w-4 text-zinc-400" />
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="text-[10px] text-zinc-500 font-medium block mb-1">Resumen del dia</label>
                    <textarea
                      value={recordForm.resumen}
                      onChange={(e) => setRecordForm(f => ({ ...f, resumen: e.target.value }))}
                      className="w-full h-20 px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 resize-none"
                      placeholder="Breve resumen de como fue tu dia..."
                      style={{ color: '#18181b' }}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-green-600 font-medium block mb-2 flex items-center gap-1">
                      <Trophy className="h-3.5 w-3.5" /> Logros ({recordForm.logros.length})
                    </label>
                    <div className="space-y-1 mb-2">
                      {recordForm.logros.map((logro, i) => (
                        <div key={i} className="flex items-center gap-2 bg-green-50/50 rounded-lg p-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          <span className="text-xs text-green-700 flex-1">{logro}</span>
                          <button
                            onClick={() => setRecordForm(f => ({ ...f, logros: f.logros.filter((_, j) => j !== i) }))}
                            className="text-green-400 hover:text-green-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newLogro}
                        onChange={(e) => setNewLogro(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newLogro.trim()) {
                            setRecordForm(f => ({ ...f, logros: [...f.logros, newLogro.trim()] }));
                            setNewLogro('');
                          }
                        }}
                        className="flex-1 h-9 px-3 rounded-lg border border-green-200 text-sm focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400"
                        placeholder="Agregar logro..."
                        style={{ color: '#18181b' }}
                      />
                      <button
                        onClick={() => {
                          if (newLogro.trim()) {
                            setRecordForm(f => ({ ...f, logros: [...f.logros, newLogro.trim()] }));
                            setNewLogro('');
                          }
                        }}
                        className="h-9 px-3 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 text-xs font-medium transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-amber-600 font-medium block mb-2 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Pendientes ({recordForm.pendientes.length})
                    </label>
                    <div className="space-y-1 mb-2">
                      {recordForm.pendientes.map((p, i) => (
                        <div key={i} className="flex items-center gap-2 bg-amber-50/50 rounded-lg p-2">
                          <CircleDot className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <span className="text-xs text-amber-700 flex-1">{p}</span>
                          <button
                            onClick={() => setRecordForm(f => ({ ...f, pendientes: f.pendientes.filter((_, j) => j !== i) }))}
                            className="text-amber-400 hover:text-amber-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newPendiente}
                        onChange={(e) => setNewPendiente(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newPendiente.trim()) {
                            setRecordForm(f => ({ ...f, pendientes: [...f.pendientes, newPendiente.trim()] }));
                            setNewPendiente('');
                          }
                        }}
                        className="flex-1 h-9 px-3 rounded-lg border border-amber-200 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                        placeholder="Agregar pendiente..."
                        style={{ color: '#18181b' }}
                      />
                      <button
                        onClick={() => {
                          if (newPendiente.trim()) {
                            setRecordForm(f => ({ ...f, pendientes: [...f.pendientes, newPendiente.trim()] }));
                            setNewPendiente('');
                          }
                        }}
                        className="h-9 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 text-xs font-medium transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 font-medium block mb-1">Notas adicionales</label>
                    <textarea
                      value={recordForm.notas}
                      onChange={(e) => setRecordForm(f => ({ ...f, notas: e.target.value }))}
                      className="w-full h-20 px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 resize-none"
                      placeholder="Notas generales del dia..."
                      style={{ color: '#18181b' }}
                    />
                  </div>
                </div>
                <div className="p-4 border-t border-zinc-100 flex justify-end gap-2">
                  <button
                    onClick={() => setShowRecordDialog(false)}
                    className="h-9 px-4 rounded-lg border border-zinc-200 text-xs text-zinc-600 hover:bg-zinc-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveRecord}
                    className="h-9 px-4 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-medium transition-all shadow-md shadow-orange-200"
                  >
                    Guardar registro
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
