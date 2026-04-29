'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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

  // NUCLEAR FIX: Force input text color using CSSOM API (equivalent to inline !important)
  // This cannot be overridden by any external CSS
  const forceInputStyle = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.setProperty('color', '#18181b', 'important');
    el.style.setProperty('-webkit-text-fill-color', '#18181b', 'important');
    el.style.setProperty('background-color', '#ffffff', 'important');
    el.style.setProperty('caret-color', '#18181b', 'important');
    el.style.setProperty('opacity', '1', 'important');
    el.style.setProperty('visibility', 'visible', 'important');
    el.style.setProperty('filter', 'none', 'important');
  }, []);

  // Apply forced styles on mount, on focus, and on every render
  useEffect(() => {
    forceInputStyle();
  }, [forceInputStyle]);

  // Re-apply on input change (covers any dynamic style injection)
  useEffect(() => {
    if (input || loading) {
      forceInputStyle();
    }
  }, [input, loading, forceInputStyle]);

  // Also apply via MutationObserver to catch ThemeInjector re-injections
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    const observer = new MutationObserver(() => {
      forceInputStyle();
    });

    observer.observe(el, {
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    return () => observer.disconnect();
  }, [forceInputStyle]);

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
    // Re-force style after clearing input
    setTimeout(forceInputStyle, 0);

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
      // Re-focus and re-force style after response
      setTimeout(() => {
        inputRef.current?.focus();
        forceInputStyle();
      }, 100);
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
    setTimeout(() => {
      inputRef.current?.focus();
      forceInputStyle();
    }, 100);
  };

  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
      if (processed.startsWith('# ')) {
        return <h3 key={i} className="font-bold text-base mt-2 mb-1" style={{ color: '#18181b' }}>{processed.replace('# ', '')}</h3>;
      }
      return (
        <p
          key={i}
          className={`${line.trim() === '' ? 'h-3' : ''}`}
          style={{ color: '#18181b' }}
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
          <h1 className="text-xl font-bold" style={{ color: '#18181b' }}>Chat Asistente</h1>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearChat}>
            <Trash2 className="h-4 w-4 mr-1" /> Limpiar
          </Button>
        )}
      </div>

      {/* Chat container */}
      <Card className="flex-1 flex flex-col border shadow-sm overflow-hidden min-h-0" style={{ backgroundColor: '#ffffff' }}>
        {/* Messages - scrollable area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4"
          style={{ scrollBehavior: 'smooth', backgroundColor: '#ffffff' }}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mb-3">
                <MessageCircle className="h-7 w-7 text-amber-500" />
              </div>
              <h3 className="text-base font-semibold mb-1" style={{ color: '#18181b' }}>Hola, en que te ayudo?</h3>
              <p style={{ color: '#71717a' }}>
                Escribe tu pregunta abajo
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
                    className="max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed"
                    style={
                      msg.role === 'user'
                        ? { backgroundColor: '#27272a', color: '#ffffff', borderTopRightRadius: '4px' }
                        : { backgroundColor: '#f4f4f5', color: '#27272a', borderTopLeftRadius: '4px' }
                    }
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
                  <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: '#f4f4f5', borderTopLeftRadius: '4px' }}>
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

        {/* Input area - fixed at bottom of card */}
        <div className="p-3 border-t border-zinc-200" style={{ backgroundColor: '#ffffff' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex gap-2"
          >
            <input
              ref={inputRef}
              id="ch-chat-msg-input"
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                forceInputStyle();
              }}
              onKeyDown={handleKeyDown}
              onFocus={forceInputStyle}
              placeholder="Escribe tu pregunta..."
              disabled={loading}
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="flex-1 h-10 px-3 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              style={{
                color: '#18181b',
                backgroundColor: '#ffffff',
                WebkitTextFillColor: '#18181b',
                caretColor: '#18181b',
                fontFamily: 'inherit',
                fontSize: '0.875rem',
                lineHeight: '1.25rem',
              }}
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
