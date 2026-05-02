'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bell, BellOff } from 'lucide-react';
import { ref, push, onValue, serverTimestamp, set } from 'firebase/database';
import { db } from '../lib/firebase';
import { subscribeToPush } from '../lib/pwa';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'system' | 'other';
  timestamp: Date;
}

export default function ChatSystem() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'system-1',
      text: 'Welcome to the Transport Chat! Connect with other passengers here.',
      sender: 'system',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [userId, setUserId] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const notifsEnabledRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
      notifsEnabledRef.current = Notification.permission === 'granted';
    }
  }, []);

  useEffect(() => {
    let id = localStorage.getItem('mit_chat_uid');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('mit_chat_uid', id);
    }
    setUserId(id);

    const chatRef = ref(db, 'transport_chat/messages');
    let isInitialLoad = true;
    let initialCount = 0;

    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsedMessages: Message[] = Object.entries(data).map(([key, val]: [string, any]) => ({
          id: key,
          text: val.text,
          sender: val.senderId === id ? 'user' : 'other',
          timestamp: val.timestamp ? new Date(val.timestamp) : new Date()
        }));
        
        parsedMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        
        setMessages([
          {
            id: 'system-1',
            text: 'Welcome to the Transport Chat! Connect with other passengers here.',
            sender: 'system',
            timestamp: new Date(Date.now() - 10000)
          },
          ...parsedMessages
        ]);

        if (!isInitialLoad && parsedMessages.length > initialCount) {
           const lastMsg = parsedMessages[parsedMessages.length - 1];
           if (lastMsg.sender === 'other' && notifsEnabledRef.current && 'Notification' in window && Notification.permission === 'granted') {
             new Notification('Transport Chat', {
               body: lastMsg.text,
               icon: '/favicon.png'
             });
           }
        }
        initialCount = parsedMessages.length;
      }
      isInitialLoad = false;
    });

    return () => unsubscribe();
  }, []);

  const toggleNotifications = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications.');
      return;
    }

    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      notifsEnabledRef.current = false;
    } else {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setNotificationsEnabled(granted);
      notifsEnabledRef.current = granted;
      
      if (granted) {
        // Automatically subscribe them to Web Push for offline background notifications
        const sub = await subscribeToPush();
        if (sub && userId) {
          const subRef = ref(db, `push_subscriptions/${userId}`);
          await set(subRef, JSON.parse(JSON.stringify(sub)));
        }
      }
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || !userId) return;

    const textToSend = inputValue.trim();
    setInputValue('');

    const chatRef = ref(db, 'transport_chat/messages');
    await push(chatRef, {
      text: textToSend,
      senderId: userId,
      timestamp: serverTimestamp()
    });

    // Trigger backend to send Web Push notifications to offline PWA users
    fetch('/api/chat-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: textToSend, senderId: userId })
    }).catch(err => console.error('Failed to trigger push notify:', err));
  };

  return (
    <motion.div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-dark)'
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ type: 'tween', ease: 'easeOut', duration: 0.3 }}
    >
      {/* Floating Header Actions */}
      <div style={{
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      }}>
        <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--primary-accent)', margin: 0 }}>Transport Chat</h2>
        <button
          onClick={toggleNotifications}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            background: notificationsEnabled ? 'rgba(246, 148, 35, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${notificationsEnabled ? 'rgba(246, 148, 35, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
            color: notificationsEnabled ? 'var(--primary-accent)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          title={notificationsEnabled ? 'Mute Notifications' : 'Unmute Notifications'}
        >
          {notificationsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
        </button>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        paddingBottom: '20px'
      }} className="hide-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                style={{
                  alignSelf: isUser ? 'flex-end' : msg.sender === 'system' ? 'center' : 'flex-start',
                  maxWidth: '85%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{
                  padding: '14px 18px',
                  borderRadius: '20px',
                  borderBottomRightRadius: isUser ? '4px' : '20px',
                  borderBottomLeftRadius: !isUser ? '4px' : '20px',
                  backgroundColor: isUser ? 'var(--primary-accent)' : msg.sender === 'system' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.1)',
                  color: isUser ? '#000' : msg.sender === 'system' ? 'var(--text-muted)' : 'var(--text-primary)',
                  fontSize: msg.sender === 'system' ? '13px' : '15px',
                  fontStyle: msg.sender === 'system' ? 'italic' : 'normal',
                  textAlign: msg.sender === 'system' ? 'center' : 'left',
                  lineHeight: '1.5',
                  boxShadow: isUser ? '0 4px 15px rgba(246, 148, 35, 0.2)' : msg.sender === 'system' ? 'none' : '0 4px 15px rgba(0, 0, 0, 0.1)',
                  fontWeight: isUser ? '600' : '500',
                  wordBreak: 'break-word',
                  alignSelf: msg.sender === 'system' ? 'center' : 'inherit'
                }}>
                  {msg.text}
                </div>
                <span suppressHydrationWarning style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  padding: '0 4px',
                  fontWeight: '600'
                }}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} style={{ height: '1px' }} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: '16px 20px',
        backgroundColor: 'rgba(10, 10, 10, 0.9)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        zIndex: 10,
        paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 96px)'
      }}>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            style={{
              flex: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              padding: '14px 20px',
              color: 'var(--text-primary)',
              fontSize: '15px',
              outline: 'none',
              transition: 'border-color 0.2s ease',
              fontFamily: 'inherit'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary-accent)'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '24px',
              backgroundColor: inputValue.trim() ? 'var(--primary-accent)' : 'rgba(255, 255, 255, 0.05)',
              color: inputValue.trim() ? '#000' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              transition: 'all 0.2s ease',
              boxShadow: inputValue.trim() ? '0 4px 15px rgba(246, 148, 35, 0.3)' : 'none',
              cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
              flexShrink: 0
            }}
          >
            <Send size={20} style={{ transform: inputValue.trim() ? 'translateX(2px) translateY(-1px)' : 'none' }} />
          </button>
        </form>
      </div>
    </motion.div>
  );
}
