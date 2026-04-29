'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Copy, Check, Mail, Sparkles } from 'lucide-react';

const COUPON_CODE = 'CHAMBA10';
const STORAGE_KEY = 'chambatina-popup-shown';

export function WelcomePopup() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  useEffect(() => {
    // Don't show popup in admin mode
    const storage = localStorage.getItem('chambatina-storage-v2');
    if (storage) {
      try {
        const data = JSON.parse(storage);
        if (data?.state?.isAdmin) return;
      } catch {}
    }

    // Check if popup was already shown
    const popupShown = localStorage.getItem(STORAGE_KEY);
    if (popupShown) return;

    // Show popup after 4 seconds
    const timer = setTimeout(() => {
      setShow(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async () => {
    if (!email || !email.includes('@') || !email.includes('.')) return;

    setLoading(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, cupon: COUPON_CODE }),
      });
      const json = await res.json();

      if (json.ok) {
        setSuccess(true);
        if (json.data.yaRegistrado) {
          setAlreadyRegistered(true);
        }
        // Mark popup as shown
        localStorage.setItem(STORAGE_KEY, 'true');
      }
    } catch {
      // Still show success on network error to not frustrate user
      setSuccess(true);
      localStorage.setItem(STORAGE_KEY, 'true');
    } finally {
      setLoading(false);
    }
  };

  const copyCoupon = () => {
    navigator.clipboard.writeText(COUPON_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClose = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  return (
    <AnimatePresence>
      {show && !dismissed && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            onClick={handleClose}
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          >
            <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4 text-zinc-600" />
              </button>

              {/* Top gradient decoration */}
              <div className="relative h-32 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute -top-8 -left-8 w-24 h-24 bg-white/10 rounded-full" />
                <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-white/10 rounded-full" />
                <div className="absolute top-2 right-12 w-8 h-8 bg-white/15 rounded-full" />

                <div className="relative text-center">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  >
                    <Gift className="h-12 w-12 text-white mx-auto drop-shadow-lg" />
                  </motion.div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 -mt-8">
                <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-5">
                  {!success ? (
                    <>
                      {/* Title */}
                      <div className="text-center mb-4">
                        <h2 className="text-xl font-bold" style={{ color: '#18181b' }}>
                          Bienvenido a Chambatina!
                        </h2>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                          <p className="text-sm text-zinc-500">
                            Obten <span className="font-bold text-orange-600">10% de descuento</span> en tu primera compra
                          </p>
                          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        </div>
                      </div>

                      {/* Email input */}
                      <div className="space-y-3">
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                            className="w-full h-11 pl-10 pr-4 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                            style={{ color: '#18181b' }}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                          />
                        </div>

                        <button
                          onClick={handleSubmit}
                          disabled={loading || !email.includes('@')}
                          className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/25"
                        >
                          {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <Gift className="h-4 w-4" />
                              Quiero mi 10% OFF
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-[10px] text-zinc-400 text-center mt-3 flex items-center justify-center gap-1">
                        🔒 Solo usamos tu email para tu cupon. Sin spam.
                      </p>
                    </>
                  ) : (
                    <>
                      {/* Success state */}
                      <div className="text-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', delay: 0.1 }}
                          className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3"
                        >
                          <Check className="h-8 w-8 text-green-600" />
                        </motion.div>

                        <h3 className="text-lg font-bold mb-1" style={{ color: '#18181b' }}>
                          {alreadyRegistered ? 'Ya estas registrado!' : 'Cupon activado!'}
                        </h3>
                        <p className="text-xs text-zinc-500 mb-4">
                          {alreadyRegistered
                            ? 'Ya tienes acceso a tu cupon de descuento'
                            : 'Usa este codigo en tu proxima compra'}
                        </p>

                        {/* Coupon code display */}
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-dashed border-amber-300 rounded-xl p-4 mb-4">
                          <p className="text-[10px] text-amber-600 font-medium uppercase tracking-wider mb-1">Tu codigo de descuento</p>
                          <p className="text-2xl font-mono font-bold text-orange-700 tracking-widest">
                            {COUPON_CODE}
                          </p>
                          <p className="text-xs text-zinc-500 mt-1">10% de descuento</p>
                        </div>

                        <button
                          onClick={copyCoupon}
                          className="w-full h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                        >
                          {copied ? (
                            <>
                              <Check className="h-4 w-4" />
                              Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              Copiar codigo
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
