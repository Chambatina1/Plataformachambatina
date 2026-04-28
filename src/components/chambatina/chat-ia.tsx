'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from './store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Send, Loader2, MessageCircle, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function generateSessionId(): string {
  return 'session-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
}

export function ChatIA() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(generateSessionId);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change or loading starts/stops
  useEffect(() => {
    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ block: 'end' });
    }, 50);
    return () => clearTimeout(timer);
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: text.trim(), sessionId }),
      });
      const json = await res.json();
      if (json.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: json.respuesta }]);
      } else {
        toast.error('Error en el chat');
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Lo siento, tuve un problema de conexion. Por favor intenta de nuevo.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
      if (processed.startsWith('# ')) {
        return <h3 key={i} className="font-bold text-base mt-2 mb-1 text-zinc-900">{processed.replace('# ', '')}</h3>;
      }
      return (
        <p
          key={i}
          className={`${line.trim() === '' ? 'h-3' : 'text-zinc-800'}`}
          dangerouslySetInnerHTML={{ __html: processed || '&nbsp;' }}
        />
      );
    });
  };

  return (
    <div
      className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-20 flex flex-col"
      style={{ height: 'calc(100dvh - 64px - 64px)', minHeight: '400px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-amber-500" />
          <h1 className="text-xl font-bold text-zinc-900">Chat Asistente</h1>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-600" onClick={clearChat}>
            <Trash2 className="h-4 w-4 mr-1" /> Limpiar
          </Button>
        )}
      </div>

      {/* Chat container */}
      <Card className="flex-1 flex flex-col border shadow-sm overflow-hidden min-h-0">
        {/* Messages - scrollable area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4"
          style={{ scrollBehavior: 'smooth' }}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mb-3">
                <MessageCircle className="h-7 w-7 text-amber-500" />
              </div>
              <h3 className="text-base font-semibold text-zinc-700 mb-1">Hola, en que te ayudo?</h3>
              <p className="text-sm text-zinc-400 max-w-xs">
                Escribe tu pregunta abajo o prueba una sugerencia
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      msg.role === 'user'
                        ? 'bg-zinc-800 text-white'
                        : 'bg-amber-100 text-amber-600'
                    }`}
                  >
                    {msg.role === 'user' ? 'Tu' : <Sparkles className="h-3.5 w-3.5" />}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-zinc-800 text-white rounded-tr-sm'
                        : 'bg-zinc-100 text-zinc-800 rounded-tl-sm'
                    }`}
                  >
                    {msg.role === 'assistant' ? renderContent(msg.content) : msg.content}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {loading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <div className="bg-zinc-100 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Scroll anchor */}
          <div ref={bottomRef} />
        </div>

        {/* Input area - fixed at bottom of card, always visible */}
        <div className="p-3 border-t border-zinc-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu pregunta..."
              disabled={loading}
              autoFocus
              className="flex-1 h-10 px-3 rounded-lg border border-zinc-300 bg-white text-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-amber-500 hover:bg-amber-600 text-white h-10 px-4"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
