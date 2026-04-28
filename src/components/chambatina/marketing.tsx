'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from './store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  X,
  Share2,
  Gift,
  Star,
  Copy,
  Check,
  Users,
  ChevronRight,
  Loader2,
  Send,
  Sparkles,
  Zap,
  Award,
  Quote,
  ExternalLink,
  ShoppingBag,
  Music2,
} from 'lucide-react';
import { toast } from 'sonner';

// =========================================
// 1. WHATSAPP FLOATING BUTTON
// =========================================
const CHAMBATINA_WHATSAPP = '0000000000'; // Replace with real number

export function WhatsAppFloat() {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSend = () => {
    const text = encodeURIComponent(msg || 'Hola, quiero informacion sobre Chambatina');
    window.open(`https://wa.me/${CHAMBATINA_WHATSAPP}?text=${text}`, '_blank');
    setOpen(false);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-24 right-4 z-[90] w-72 bg-white rounded-2xl shadow-2xl border border-green-100 overflow-hidden"
          >
            <div className="bg-green-500 p-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Chambatina</p>
                <p className="text-green-100 text-[10px]">En linea - Responde rapido</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="ml-auto text-white/70 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3">
              <p className="text-xs text-zinc-500 mb-2">Escribe tu mensaje:</p>
              <div className="flex gap-2">
                <input
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  placeholder="Hola, necesito..."
                  className="flex-1 h-9 px-3 rounded-lg border border-zinc-200 text-xs"
                  style={{ color: '#18181b' }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button
                  onClick={handleSend}
                  className="h-9 w-9 rounded-lg bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: 'spring' }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-4 z-[90] w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </motion.button>
    </>
  );
}

// =========================================
// 2. TIKTOK SHOP FLOATING BUTTON
// =========================================
const TIKTOK_SHOP_URL = 'https://www.tiktok.com/t/ZP9NxemkP7Q78-uOgm6/';

export function TikTokFloat() {
  const [open, setOpen] = useState(false);

  const handleGoToShop = () => {
    if (TIKTOK_SHOP_URL) {
      window.open(TIKTOK_SHOP_URL, '_blank');
    }
    setOpen(false);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-24 left-4 z-[90] w-72 bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden"
          >
            {/* TikTok-style header */}
            <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 p-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 via-pink-500 to-rose-500 flex items-center justify-center">
                <Music2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">TikTok Shop</p>
                <p className="text-zinc-400 text-[10px]">Encuentra nuestros productos</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="ml-auto text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-3">
              <div className="bg-gradient-to-br from-zinc-50 to-pink-50 rounded-xl p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingBag className="h-4 w-4 text-pink-500" />
                  <span className="text-xs font-semibold" style={{ color: '#18181b' }}>Showcase Chambatina</span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Explora nuestro catalogo completo en TikTok Shop. Productos exclusivos con envio directo a tu puerta.
                </p>
              </div>

              <button
                onClick={handleGoToShop}
                className="w-full h-10 rounded-xl bg-gradient-to-r from-cyan-400 via-pink-500 to-rose-500 hover:from-cyan-500 hover:via-pink-600 hover:to-rose-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-pink-500/25"
              >
                <ExternalLink className="h-4 w-4" />
                Ir a TikTok Shop
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button - TikTok style with cyan/pink gradient */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.2, type: 'spring' }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 left-4 z-[90] w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-400 via-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95 hover:shadow-pink-500/50"
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <Music2 className="h-6 w-6" />
        )}
      </motion.button>
    </>
  );
}

// =========================================
// 3. SOCIAL SHARE BUTTONS
// =========================================
export function ShareButtons({ title, text, url }: { title: string; text: string; url?: string }) {
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareText = `${text} - Chambatina Envios`;

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`, '_blank');
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copiado');
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-400 mr-1">Compartir:</span>
      <button
        onClick={shareWhatsApp}
        className="w-8 h-8 rounded-full bg-green-100 hover:bg-green-200 text-green-600 flex items-center justify-center transition-colors"
        title="Compartir en WhatsApp"
      >
        <MessageCircle className="h-4 w-4" />
      </button>
      <button
        onClick={shareFacebook}
        className="w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 flex items-center justify-center transition-colors"
        title="Compartir en Facebook"
      >
        <Share2 className="h-4 w-4" />
      </button>
      <button
        onClick={shareTelegram}
        className="w-8 h-8 rounded-full bg-sky-100 hover:bg-sky-200 text-sky-600 flex items-center justify-center transition-colors"
        title="Compartir en Telegram"
      >
        <Send className="h-4 w-4" />
      </button>
      <button
        onClick={copyLink}
        className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center transition-colors"
        title="Copiar link"
      >
        <Copy className="h-4 w-4" />
      </button>
    </div>
  );
}

// =========================================
// 3. REFERRAL CARD (shown in user profile area)
// =========================================
export function ReferralCard() {
  const currentUser = useAppStore((s) => s.currentUser);
  const [code, setCode] = useState('');
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    fetch(`/api/referrals?userId=${currentUser.id}`)
      .then(r => r.json())
      .then(json => {
        if (json.ok) {
          setCode(json.data.code || '');
          setTotalReferrals(json.data.totalReferrals || 0);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser]);

  const copyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Codigo copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = () => {
    const text = `Usa mi codigo ${code} en Chambatina y obten un 5% de descuento en tu primer envio!`;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`, '_blank');
  };

  if (!currentUser || loading) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-purple-50 via-amber-50 to-orange-50 border border-purple-100 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-amber-500 flex items-center justify-center">
          <Gift className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-sm" style={{ color: '#18181b' }}>Invita y Gana</h3>
          <p className="text-[10px] text-zinc-500">Comparte tu codigo y ambos ganan 5%</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 bg-white rounded-lg border border-purple-200 px-3 py-2 text-center">
          <span className="text-lg font-mono font-bold text-purple-700 tracking-wider">{code || '---'}</span>
        </div>
        <button
          onClick={copyCode}
          className="h-10 w-10 rounded-lg bg-purple-500 hover:bg-purple-600 text-white flex items-center justify-center transition-colors"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
        <button
          onClick={shareReferral}
          className="h-10 w-10 rounded-lg bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-500">
          <Users className="h-3 w-3 inline mr-1" />
          {totalReferrals} persona{totalReferrals !== 1 ? 's' : ''} invitada{totalReferrals !== 1 ? 's' : ''}
        </span>
        <span className="text-purple-600 font-medium flex items-center gap-1">
          <Award className="h-3 w-3" />
          5% descuento por invitacion
        </span>
      </div>
    </div>
  );
}

// =========================================
// 4. PROMO BANNER (rotating messages)
// =========================================
const PROMO_MESSAGES = [
  {
    icon: Zap,
    title: 'Envio Express',
    text: 'Entrega en 5-10 dias desde USA',
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
  },
  {
    icon: Gift,
    title: 'Invita y Gana',
    text: 'Comparte tu codigo y ambos obtienen 5% de descuento',
    color: 'from-purple-500 to-pink-500',
    bg: 'bg-purple-50',
  },
  {
    icon: Star,
    title: 'Marketplace de Servicios',
    text: 'Publica lo que ofreces o necesitas - Gratis!',
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50',
  },
  {
    icon: Sparkles,
    title: 'Chat Inteligente',
    text: 'Preguntale a nuestra IA sobre envios y servicios',
    color: 'from-blue-500 to-indigo-500',
    bg: 'bg-blue-50',
  },
];

export function PromoBanner() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % PROMO_MESSAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const promo = PROMO_MESSAGES[current];
  const Icon = promo.icon;

  return (
    <div className={`${promo.bg} rounded-2xl border border-zinc-100 overflow-hidden`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3 p-4"
        >
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${promo.color} flex items-center justify-center shrink-0`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm" style={{ color: '#18181b' }}>{promo.title}</h3>
            <p className="text-xs text-zinc-500">{promo.text}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-300 shrink-0" />
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 pb-3">
        {PROMO_MESSAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              i === current ? 'bg-amber-500 w-4' : 'bg-zinc-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// =========================================
// 5. TESTIMONIALS SECTION
// =========================================
export function TestimoniosSection() {
  const currentUser = useAppStore((s) => s.currentUser);
  const [testimonios, setTestimonios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [texto, setTexto] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/testimonios?limit=10')
      .then(r => r.json())
      .then(json => {
        if (json.ok) setTestimonios(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!currentUser) {
      toast.error('Debes iniciar sesion');
      return;
    }
    if (texto.trim().length < 10) {
      toast.error('Escribe al menos 10 caracteres');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/testimonios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, texto: texto.trim(), rating }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success('Gracias por tu testimonio!');
        setTexto('');
        setRating(5);
        setShowForm(false);
        setTestimonios(prev => [json.data, ...prev]);
      } else {
        toast.error(json.error || 'Error');
      }
    } catch {
      toast.error('Error de conexion');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white border border-zinc-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
            <Star className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-bold text-sm" style={{ color: '#18181b' }}>Opiniones de Clientes</h3>
            <p className="text-[10px] text-zinc-400">Lo que dicen de Chambatina</p>
          </div>
        </div>
        {currentUser && !showForm && (
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={() => setShowForm(true)}
          >
            Dejar opinion
          </Button>
        )}
      </div>

      {/* Testimonial form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-zinc-100"
          >
            <div className="p-4 space-y-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Cuenta tu experiencia con Chambatina..."
                className="w-full h-20 px-3 py-2 rounded-lg border border-zinc-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
                style={{ color: '#18181b' }}
                maxLength={500}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={submitting || texto.trim().length < 10}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-xs"
                >
                  {submitting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                  Publicar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowForm(false)} className="text-xs">
                  Cancelar
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Testimonials list */}
      <div className="divide-y divide-zinc-50">
        {loading ? (
          <div className="p-8 text-center text-zinc-400 text-sm">Cargando...</div>
        ) : testimonios.length === 0 ? (
          <div className="p-8 text-center">
            <Quote className="h-8 w-8 text-zinc-200 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">Aun no hay opiniones. Se el primero!</p>
          </div>
        ) : (
          testimonios.slice(0, 5).map((t) => (
            <div key={t.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-amber-600">
                    {t.nombre?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium" style={{ color: '#18181b' }}>{t.nombre}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3 w-3 ${s <= t.rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-zinc-600 leading-relaxed">{t.texto}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// =========================================
// 6. COMBINED MARKETING WIDGET (for home page)
// =========================================
export function MarketingWidget() {
  return (
    <div className="space-y-4">
      <PromoBanner />
      <ReferralCard />
      <TestimoniosSection />
    </div>
  );
}
