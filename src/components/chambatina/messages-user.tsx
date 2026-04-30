'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from './store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Check, CheckCheck } from 'lucide-react';

interface Message {
  id: number;
  senderId: number;
  receiverId: number | null;
  senderName: string;
  content: string;
  isRead: boolean;
  isAdmin: boolean;
  createdAt: string;
}

export function MessagesUser() {
  const currentUser = useAppStore((s) => s.currentUser);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch messages for current user
  const fetchMessages = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/messages?receiverId=${currentUser.id}`);
      const json = await res.json();
      if (json.ok) {
        setMessages(json.data || []);
      }
    } catch {}
  }, [currentUser]);

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!currentUser) return;
    try {
      await fetch('/api/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
    } catch {}
  }, [currentUser]);

  // Initial load + polling
  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    const load = async () => {
      if (cancelled) return;
      await fetchMessages();
      if (cancelled) return;
      await markAsRead();
    };
    load();
    const interval = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [currentUser, fetchMessages, markAsRead]);

  // Auto-scroll
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser || sending) return;
    setSending(true);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          senderName: currentUser.nombre,
          receiverId: 0, // admin
          content: newMessage.trim(),
          isAdmin: false,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setNewMessage('');
        fetchMessages();
      }
    } catch {}

    setSending(false);
    inputRef.current?.focus();
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;

    if (diffHours < 24) {
      return date.toLocaleTimeString('es', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    return date.toLocaleDateString('es', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-8">
        <div className="text-center">
          <p className="text-sm text-zinc-500">Inicia sesion para ver tus mensajes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)] flex flex-col p-2 md:p-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex-1 flex flex-col"
      >
        <Card className="flex-1 flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="flex items-center gap-3 p-4 border-b border-zinc-100">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-sm font-bold text-orange-600">CH</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Chambatina</h3>
              <p className="text-xs text-green-600 font-medium">Soporte</p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50/30">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-3">
                    <Send className="h-5 w-5 text-orange-400" />
                  </div>
                  <p className="text-sm text-zinc-500 mb-1">
                    Bienvenido a tu bandeja de mensajes
                  </p>
                  <p className="text-xs text-zinc-400">
                    Aqui puedes comunicarte directamente con el equipo de Chambatina
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isFromAdmin = msg.isAdmin;
                const showAvatar =
                  idx === 0 ||
                  messages[idx - 1].isAdmin !== isFromAdmin;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`flex ${isFromAdmin ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`flex gap-2 max-w-[80%] ${
                        isFromAdmin ? 'flex-row' : 'flex-row-reverse'
                      }`}
                    >
                      {/* Avatar */}
                      {showAvatar ? (
                        <div
                          className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-auto ${
                            isFromAdmin
                              ? 'bg-orange-100'
                              : 'bg-zinc-200'
                          }`}
                        >
                          <span
                            className={`text-[10px] font-bold ${
                              isFromAdmin
                                ? 'text-orange-600'
                                : 'text-zinc-600'
                            }`}
                          >
                            {isFromAdmin
                              ? 'CH'
                              : currentUser.nombre.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                      ) : (
                        <div className="w-7 flex-shrink-0" />
                      )}

                      {/* Bubble */}
                      <div className="flex flex-col gap-0.5">
                        {showAvatar && (
                          <span
                            className={`text-[10px] px-2 ${
                              isFromAdmin ? 'text-left' : 'text-right'
                            } text-zinc-400`}
                          >
                            {isFromAdmin ? 'Chambatina' : 'Tu'}
                          </span>
                        )}
                        <div className="relative">
                          <div
                            className={`px-3.5 py-2.5 rounded-2xl text-sm text-zinc-900 ${
                              isFromAdmin
                                ? 'bg-white border border-zinc-200 rounded-bl-md shadow-sm'
                                : 'bg-orange-500 text-white rounded-br-md'
                            }`}
                          >
                            <p className="break-words whitespace-pre-wrap">
                              {msg.content}
                            </p>
                          </div>
                          {/* Unread badge for admin messages */}
                          {isFromAdmin && !msg.isRead && showAvatar && (
                            <Badge className="absolute -top-1 -right-1 w-2.5 h-2.5 p-0 bg-orange-500 border-2 border-zinc-50" />
                          )}
                        </div>
                        <div
                          className={`flex items-center gap-1 px-2 ${
                            isFromAdmin ? 'justify-start' : 'justify-end'
                          }`}
                        >
                          <span className="text-[10px] text-zinc-400">
                            {formatTime(msg.createdAt)}
                          </span>
                          {!isFromAdmin && (
                            msg.isRead ? (
                              <CheckCheck className="h-3 w-3 text-orange-400" />
                            ) : (
                              <Check className="h-3 w-3 text-zinc-300" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-3 border-t border-zinc-100 bg-white">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Escribe un mensaje..."
                className="flex-1 text-sm text-zinc-900"
                disabled={sending}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                size="icon"
                className="bg-orange-500 hover:bg-orange-600 text-white flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
