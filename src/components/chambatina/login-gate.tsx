'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAppStore } from './store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, User, Phone, ArrowRight, Truck, ShoppingBag, MessageCircle, Shield } from 'lucide-react';

interface LoginForm {
  nombre: string;
  email: string;
  telefono: string;
}

const INITIAL_FORM: LoginForm = {
  nombre: '',
  email: '',
  telefono: '',
};

export function LoginGate() {
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const [form, setForm] = useState<LoginForm>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'email' | 'details'>('email');
  const emailRef = useRef<HTMLInputElement>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = form.email.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Ingresa un correo electronico valido');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();

      if (json.ok) {
        const user = json.data;
        // If user has no name or it's auto-generated, ask for details
        if (!user.nombre || user.nombre === user.email.split('@')[0]) {
          setStep('details');
        } else {
          completeLogin(user);
        }
      } else {
        setError(json.error || 'Error al iniciar sesion');
      }
    } catch {
      setError('Error de conexion');
    } finally {
      setLoading(false);
    }
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError('Ingresa tu nombre');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          nombre: form.nombre.trim(),
          telefono: form.telefono.trim(),
        }),
      });
      const json = await res.json();

      if (json.ok) {
        completeLogin(json.data);
      } else {
        setError(json.error || 'Error al guardar datos');
      }
    } catch {
      setError('Error de conexion');
    } finally {
      setLoading(false);
    }
  };

  const completeLogin = async (user: any) => {
    setCurrentUser({ id: user.id, nombre: user.nombre, email: user.email, telefono: user.telefono });

    // Register visit
    try {
      await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, page: '/' }),
      });
    } catch { /* silent */ }
  };

  const updateField = (field: keyof LoginForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo & Welcome */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-20 h-20 rounded-2xl bg-white shadow-lg shadow-orange-200/50 flex items-center justify-center mx-auto mb-4 overflow-hidden"
          >
            <Image src="/logo.png" alt="Chambatina" width={72} height={72} className="object-contain" />
          </motion.div>
          <h1 className="text-2xl font-bold text-zinc-900">CHAMBATINA</h1>
          <p className="text-sm text-orange-500 font-medium tracking-widest uppercase">
            Envios Internacionales
          </p>
          <p className="text-sm text-zinc-500 mt-2">
            Ingresa tu correo para acceder a la plataforma
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-orange-100/50 border border-orange-100 p-6 sm:p-8">
          {step === 'email' ? (
            <>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email" className="text-xs font-medium">
                    Correo electronico
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                      id="login-email"
                      type="email"
                      ref={emailRef}
                      placeholder="tu@correo.com"
                      value={form.email}
                      onChange={updateField('email')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleEmailSubmit(e);
                        }
                      }}
                      className="pl-10 h-12 text-base"
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-500"
                  >
                    {error}
                  </motion.p>
                )}

                <Button
                  type="submit"
                  disabled={loading || !form.email.trim()}
                  className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-base"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Acceder
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <p className="text-xs text-center text-zinc-400 mt-4">
                Si es tu primera vez, se creara una cuenta automaticamente
              </p>
            </>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm text-zinc-500">Bienvenido a Chambatina. Completamos tu perfil:</p>
              </div>
              <form onSubmit={handleDetailsSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="login-nombre" className="text-xs font-medium">
                    Tu nombre *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                      id="login-nombre"
                      placeholder="Tu nombre completo"
                      value={form.nombre}
                      onChange={updateField('nombre')}
                      className="pl-10 h-12 text-base"
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="login-telefono" className="text-xs font-medium">
                    Telefono <span className="text-zinc-400">(opcional)</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                      id="login-telefono"
                      placeholder="+53 0000 0000"
                      value={form.telefono}
                      onChange={updateField('telefono')}
                      className="pl-10 h-12 text-base"
                      disabled={loading}
                    />
                  </div>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-500"
                  >
                    {error}
                  </motion.p>
                )}

                <Button
                  type="submit"
                  disabled={loading || !form.nombre.trim()}
                  className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-base"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Entrar
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </>
          )}
        </div>

        {/* Features */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { icon: Truck, label: 'Rastrea envios' },
            { icon: ShoppingBag, label: 'Tienda online' },
            { icon: MessageCircle, label: 'Chat IA' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 text-center">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <Icon className="h-5 w-5 text-orange-600" />
              </div>
              <span className="text-[11px] text-zinc-500 font-medium">{label}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-[11px] text-zinc-400 mt-4 flex items-center justify-center gap-1">
          <Shield className="h-3 w-3" />
          Tus datos estan seguros con nosotros
        </p>
      </motion.div>
    </div>
  );
}
