'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from './store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Save, Loader2, Check, Building2, Phone, Clock, Mail, Globe, Bot, Eye, EyeOff, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ConfigData {
  nombre_negocio: string;
  direccion: string;
  telefono1: string;
  nombre_contacto1: string;
  telefono2: string;
  nombre_contacto2: string;
  telefono3: string;
  nombre_contacto3: string;
  email: string;
  horario: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  // AI Config
  ai_provider: string;
  ai_api_key: string;
  ai_model: string;
}

const DEFAULT_CONFIG: ConfigData = {
  nombre_negocio: 'Chambatina',
  direccion: '2234 A Winter Woods Blvd, Winter Park, Unit 1000, FL 32792',
  telefono1: '786-942-6904',
  nombre_contacto1: 'Geo',
  telefono2: '786-784-6421',
  nombre_contacto2: 'Adriana',
  telefono3: '',
  nombre_contacto3: '',
  email: '',
  horario: 'Lunes a Viernes 9:00 AM - 6:00 PM',
  whatsapp: '',
  instagram: '',
  facebook: '',
  ai_provider: 'deepseek',
  ai_api_key: '',
  ai_model: '',
};

export function ConfigPanel() {
  const [config, setConfig] = useState<ConfigData>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiStatus, setAiStatus] = useState<'unknown' | 'configured' | 'not_configured'>('unknown');

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config');
      const json = await res.json();
      if (json.ok) {
        setConfig({ ...DEFAULT_CONFIG, ...json.data });
      }
    } catch {
      toast.error('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Check AI status
  useEffect(() => {
    if (config.ai_api_key) {
      setAiStatus('configured');
    } else if (loading) {
      setAiStatus('unknown');
    } else {
      setAiStatus('not_configured');
    }
  }, [config.ai_api_key, loading]);

  const handleChange = (key: keyof ConfigData, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs: config }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success('Configuración guardada');
        setSaved(true);
        // Reload public site data
        window.dispatchEvent(new CustomEvent('config-updated'));
      } else {
        toast.error(json.error || 'Error al guardar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof ConfigData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    handleChange(field, e.target.value);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Configuración</h2>
          <p className="text-sm text-muted-foreground">Administra la información de tu negocio</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className={`bg-amber-500 hover:bg-amber-600 text-black font-semibold min-w-[140px] ${
            saved ? '!bg-green-500 hover:!bg-green-500' : ''
          }`}
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Guardando...</>
          ) : saved ? (
            <><Check className="h-4 w-4 mr-2" /> Guardado</>
          ) : (
            <><Save className="h-4 w-4 mr-2" /> Guardar</>
          )}
        </Button>
      </div>

      {/* AI Configuration - MOST IMPORTANT */}
      <Card className={`border-2 ${aiStatus === 'configured' ? 'border-emerald-200 bg-emerald-50/30' : aiStatus === 'not_configured' ? 'border-amber-200 bg-amber-50/30' : 'border-zinc-200'}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                Configuración de IA
              </CardTitle>
              <CardDescription className="mt-1.5">
                Conecta tu API key para que el chat asistente funcione
              </CardDescription>
            </div>
            {aiStatus === 'configured' && (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                <Sparkles className="h-3 w-3 mr-1" /> Activa
              </Badge>
            )}
            {aiStatus === 'not_configured' && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                <AlertCircle className="h-3 w-3 mr-1" /> Sin configurar
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {aiStatus === 'not_configured' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              <p className="font-semibold mb-1">La IA del chat no está conectada</p>
              <p>Agrega tu API key de DeepSeek o OpenAI para que el asistente virtual pueda responder a tus clientes.</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Proveedor de IA</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { handleChange('ai_provider', 'deepseek'); handleChange('ai_model', ''); }}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  config.ai_provider === 'deepseek'
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-zinc-200 hover:border-zinc-300'
                }`}
              >
                <p className="font-semibold text-sm">DeepSeek</p>
                <p className="text-xs text-muted-foreground mt-0.5">Recomendado - muy económico</p>
                {config.ai_provider === 'deepseek' && (
                  <Badge className="mt-1.5 text-[10px] bg-violet-100 text-violet-700">Seleccionado</Badge>
                )}
              </button>
              <button
                type="button"
                onClick={() => { handleChange('ai_provider', 'openai'); handleChange('ai_model', ''); }}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  config.ai_provider === 'openai'
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-zinc-200 hover:border-zinc-300'
                }`}
              >
                <p className="font-semibold text-sm">OpenAI</p>
                <p className="text-xs text-muted-foreground mt-0.5">ChatGPT - alta calidad</p>
                {config.ai_provider === 'openai' && (
                  <Badge className="mt-1.5 text-[10px] bg-violet-100 text-violet-700">Seleccionado</Badge>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai_api_key">API Key</Label>
            <div className="relative">
              <Input
                id="ai_api_key"
                type={showApiKey ? 'text' : 'password'}
                value={config.ai_api_key}
                onChange={updateField('ai_api_key')}
                placeholder={
                  config.ai_provider === 'deepseek'
                    ? 'sk-xxxxxxxxxxxxxxxxxxxxxxxx'
                    : 'sk-xxxxxxxxxxxxxxxxxxxxxxxx'
                }
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {config.ai_provider === 'deepseek' ? (
                <>Obtén tu key gratis en <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer" className="text-violet-600 underline">platform.deepseek.com</a></>
              ) : (
                <>Obtén tu key en <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-violet-600 underline">platform.openai.com</a></>
              )}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai_model">Modelo (opcional)</Label>
            <Input
              id="ai_model"
              value={config.ai_model}
              onChange={updateField('ai_model')}
              placeholder={
                config.ai_provider === 'deepseek'
                  ? 'deepseek-chat (default)'
                  : 'gpt-4o-mini (default)'
              }
            />
            <p className="text-xs text-muted-foreground">
              Deja vacío para usar el modelo por defecto ({config.ai_provider === 'deepseek' ? 'deepseek-chat' : 'gpt-4o-mini'})
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Business Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-amber-500" />
            Información del Negocio
          </CardTitle>
          <CardDescription>Nombre, dirección y datos generales</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre_negocio">Nombre del Negocio</Label>
              <Input
                id="nombre_negocio"
                value={config.nombre_negocio}
                onChange={updateField('nombre_negocio')}
                placeholder="Chambatina"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={config.email}
                onChange={updateField('email')}
                placeholder="info@chambatina.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección de la Oficina</Label>
            <Textarea
              id="direccion"
              value={config.direccion}
              onChange={updateField('direccion')}
              placeholder="Dirección completa"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="horario">Horario de Atención</Label>
            <Input
              id="horario"
              value={config.horario}
              onChange={updateField('horario')}
              placeholder="Lunes a Viernes 9:00 AM - 6:00 PM"
            />
          </div>
        </CardContent>
      </Card>

      {/* Phones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Phone className="h-5 w-5 text-amber-500" />
            Teléfonos de Contacto
          </CardTitle>
          <CardDescription>Puedes agregar hasta 3 números</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((n) => {
            const telefono = config[`telefono${n}` as keyof ConfigData];
            const nombre = config[`nombre_contacto${n}` as keyof ConfigData];
            return (
              <div key={n} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Nombre Contacto {n}</Label>
                  <Input
                    value={nombre}
                    onChange={updateField(`nombre_contacto${n}` as keyof ConfigData)}
                    placeholder={`Nombre ${n}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono {n}</Label>
                  <Input
                    value={telefono}
                    onChange={updateField(`telefono${n}` as keyof ConfigData)}
                    placeholder="000-000-0000"
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-amber-500" />
            Redes Sociales y Mensajería
          </CardTitle>
          <CardDescription>WhatsApp, Instagram, Facebook</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={config.whatsapp}
                onChange={updateField('whatsapp')}
                placeholder="+17869426904"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={config.instagram}
                onChange={updateField('instagram')}
                placeholder="@chambatina"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="facebook">Facebook</Label>
            <Input
              id="facebook"
              value={config.facebook}
              onChange={updateField('facebook')}
              placeholder="facebook.com/chambatina"
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Info */}
      <p className="text-xs text-muted-foreground text-center pb-20">
        Los cambios se reflejan inmediatamente en todas las secciones del sitio.
      </p>
    </div>
  );
}
