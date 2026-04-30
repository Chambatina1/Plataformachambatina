'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from './store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Radio, Users, ArrowLeft, Check, CheckCheck, Circle, Search } from 'lucide-react';

interface Conversation {
  userId: number;
  userName: string;
  lastMessage: string;
  lastMessageTime: string;
  lastSenderName: string;
  unreadCount: number;
}

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

interface OnlineUser {
  id: number;
  nombre: string;
  email: string;
  ciudad: string | null;
  lastSeen: string;
}

export function MessagesAdmin() {
  const currentUser = useAppStore((s) => s.currentUser);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/messages?all=true');
      const json = await res.json();
      if (json.ok) {
        setConversations(json.data || []);
      }
    } catch {}
  }, []);

  // Fetch messages for selected user
  const fetchMessages = useCallback(async (userId: number) => {
    try {
      const res = await fetch(`/api/messages?userId=${userId}`);
      const json = await res.json();
      if (json.ok) {
        setMessages(json.data || []);
      }
    } catch {}
  }, []);

  // Fetch online users
  const fetchOnlineUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/presence?online=true');
      const json = await res.json();
      if (json.ok) {
        setOnlineUsers(json.data || []);
      }
    } catch {}
  }, []);

  // Initial load and polling
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (cancelled) return;
      await fetchConversations();
      if (cancelled) return;
      await fetchOnlineUsers();
    };
    load();
    const interval = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [fetchConversations, fetchOnlineUsers]);

  // Poll messages when a conversation is selected
  useEffect(() => {
    if (!selectedUserId) return;
    let cancelled = false;
    const load = async () => {
      if (cancelled) return;
      await fetchMessages(selectedUserId);
    };
    load();
    const interval = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [selectedUserId, fetchMessages]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const isOnline = (userId: number) => onlineUsers.some((u) => u.id === userId);

  const handleSelectConversation = (userId: number) => {
    setSelectedUserId(userId);
    setShowBroadcast(false);
    setMessages([]);
    fetchMessages(userId);
    // Mark messages from this user as read
    fetch('/api/messages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 0 }), // admin userId is 0
    }).catch(() => {});
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId || sending) return;
    setSending(true);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: 0,
          senderName: 'Chambatina',
          receiverId: selectedUserId,
          content: newMessage.trim(),
          isAdmin: true,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setNewMessage('');
        fetchMessages(selectedUserId);
        fetchConversations();
      }
    } catch {}

    setSending(false);
    inputRef.current?.focus();
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim() || sending) return;
    setSending(true);

    try {
      // Send broadcast (receiverId = null)
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: 0,
          senderName: 'Chambatina',
          receiverId: null,
          content: broadcastMessage.trim(),
          isAdmin: true,
        }),
      });
      setBroadcastMessage('');
      setShowBroadcast(false);
      fetchConversations();
    } catch {}

    setSending(false);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `hace ${diffMins}m`;
    if (diffHours < 24) return `hace ${diffHours}h`;

    return date.toLocaleDateString('es', { day: '2-digit', month: '2-digit' });
  };

  const filteredConversations = conversations.filter((c) =>
    c.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedConversation = conversations.find((c) => c.userId === selectedUserId);

  // --- RENDER ---

  // Broadcast mode
  if (showBroadcast) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setShowBroadcast(false)}
                className="p-2 rounded-lg hover:bg-orange-50 text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Radio className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900">Enviar a todos</h2>
                  <p className="text-xs text-zinc-500">Mensaje de difusion a todos los usuarios</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Escribe tu mensaje para todos los usuarios..."
                className="w-full min-h-[120px] p-4 rounded-xl border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                rows={4}
              />

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowBroadcast(false)}
                  className="text-zinc-600 hover:text-zinc-900"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleBroadcast}
                  disabled={!broadcastMessage.trim() || sending}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {sending ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enviando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Radio className="h-4 w-4" />
                      Difundir
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-0 md:gap-4 p-2 md:p-4">
      {/* Left Panel - Conversations List */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className={`w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col ${
          selectedUserId ? 'hidden md:flex' : 'flex'
        }`}
      >
        <Card className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-zinc-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-zinc-900">Mensajes</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowBroadcast(true)}
                className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700 text-xs"
              >
                <Radio className="h-3.5 w-3.5 mr-1.5" />
                Enviar a todos
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Buscar conversacion..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-sm text-zinc-900"
              />
            </div>
          </div>

          {/* Online Users Count */}
          <div className="px-4 py-2 bg-green-50/50 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500" />
              <span className="text-xs font-medium text-zinc-600">
                {onlineUsers.length} usuario{onlineUsers.length !== 1 ? 's' : ''} en linea
              </span>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 p-4">
                <Users className="h-8 w-8 text-zinc-300 mb-2" />
                <p className="text-sm text-zinc-400 text-center">No hay conversaciones aun</p>
                <p className="text-xs text-zinc-300 text-center mt-1">
                  Los mensajes de usuarios aparecen aqui
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredConversations.map((conv) => (
                  <motion.button
                    key={conv.userId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => handleSelectConversation(conv.userId)}
                    className={`w-full flex items-start gap-3 px-4 py-3 border-b border-zinc-50 text-left transition-colors hover:bg-orange-50/50 ${
                      selectedUserId === conv.userId ? 'bg-orange-50' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center">
                        <span className="text-xs font-bold text-zinc-600">
                          {conv.userName.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      {isOnline(conv.userId) && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-zinc-900 truncate">
                          {conv.userName}
                        </span>
                        <span className="text-[10px] text-zinc-400 flex-shrink-0">
                          {formatTime(conv.lastMessageTime)}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 truncate mt-0.5">{conv.lastMessage}</p>
                    </div>

                    {/* Unread Badge */}
                    {conv.unreadCount > 0 && (
                      <Badge className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 flex-shrink-0 h-5 min-w-[20px] flex items-center justify-center">
                        {conv.unreadCount}
                      </Badge>
                    )}
                  </motion.button>
                ))}
              </AnimatePresence>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Right Panel - Conversation View */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className={`flex-1 flex flex-col ${
          !selectedUserId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {selectedUserId && selectedConversation ? (
          <Card className="flex-1 flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="flex items-center gap-3 p-4 border-b border-zinc-100">
              <button
                onClick={() => setSelectedUserId(null)}
                className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors md:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-zinc-200 flex items-center justify-center">
                  <span className="text-xs font-bold text-zinc-600">
                    {selectedConversation.userName.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                {isOnline(selectedUserId) && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-zinc-900 truncate">
                  {selectedConversation.userName}
                </h3>
                {isOnline(selectedUserId) ? (
                  <p className="text-xs text-green-600 font-medium">En linea</p>
                ) : (
                  <p className="text-xs text-zinc-400">Desconectado</p>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50/30">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-zinc-400">
                    Inicia la conversacion con este usuario
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isAdminMsg = msg.isAdmin;
                  const showAvatar =
                    idx === 0 ||
                    messages[idx - 1].isAdmin !== isAdminMsg;

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className={`flex ${isAdminMsg ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-2 max-w-[80%] ${isAdminMsg ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar */}
                        {showAvatar ? (
                          <div
                            className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-auto ${
                              isAdminMsg
                                ? 'bg-orange-100'
                                : 'bg-zinc-200'
                            }`}
                          >
                            <span
                              className={`text-[10px] font-bold ${
                                isAdminMsg
                                  ? 'text-orange-600'
                                  : 'text-zinc-600'
                              }`}
                            >
                              {isAdminMsg ? 'CH' : msg.senderName.substring(0, 2).toUpperCase()}
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
                                isAdminMsg ? 'text-right' : 'text-left'
                              } text-zinc-400`}
                            >
                              {isAdminMsg ? 'Chambatina' : msg.senderName}
                            </span>
                          )}
                          <div
                            className={`px-3.5 py-2.5 rounded-2xl text-sm text-zinc-900 ${
                              isAdminMsg
                                ? 'bg-orange-500 text-white rounded-br-md'
                                : 'bg-white border border-zinc-200 rounded-bl-md shadow-sm'
                            }`}
                          >
                            <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <div
                            className={`flex items-center gap-1 px-2 ${
                              isAdminMsg ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <span className="text-[10px] text-zinc-400">
                              {formatTime(msg.createdAt)}
                            </span>
                            {isAdminMsg && (
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
        ) : (
          <Card className="flex-1 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-4">
                <Send className="h-7 w-7 text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-1">Selecciona una conversacion</h3>
              <p className="text-sm text-zinc-400">
                Elige un usuario para ver y enviar mensajes
              </p>
            </div>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
