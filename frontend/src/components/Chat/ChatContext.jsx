/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../Auth/AuthContext';
import ChatController from '../../controllers/ChatController';

const POLL_INTERVAL_MS = 5000;

const ChatContext = createContext(null);

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.15);
  } catch {
    // Web Audio indisponible (navigateur sans support) — on ignore
  }
}

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const lastReadAtRef = useRef(null);
  const lastMessageIdRef = useRef(null);
  const hasPolledOnceRef = useRef(false);
  const chatOpenRef = useRef(false);

  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'default') return;
    Notification.requestPermission();
  }, []);

  useEffect(() => {
    lastReadAtRef.current = user ? localStorage.getItem(`chatLastReadAt_${user.id}`) : null;
  }, [user]);

  const markAsRead = useCallback((msgs) => {
    const list = msgs ?? messages;
    const newest = list[list.length - 1];
    if (newest && user) {
      lastReadAtRef.current = newest.createdAt;
      localStorage.setItem(`chatLastReadAt_${user.id}`, newest.createdAt);
    }
    setUnreadCount(0);
  }, [messages, user]);

  const setChatOpen = useCallback((open) => {
    chatOpenRef.current = open;
    if (open) markAsRead();
  }, [markAsRead]);

  const appendMessage = useCallback((message) => {
    lastMessageIdRef.current = message.id;
    setMessages((prev) => [...prev, message]);
  }, []);

  useEffect(() => {
    if (!user) return;

    const loadMessages = async () => {
      try {
        const data = await ChatController.getMessages();
        const newest = data[data.length - 1];
        const isChatVisible = chatOpenRef.current && document.visibilityState === 'visible';

        if (
          newest &&
          hasPolledOnceRef.current &&
          newest.id !== lastMessageIdRef.current &&
          newest.senderId !== user.id &&
          !isChatVisible
        ) {
          playNotificationSound();
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(newest.senderName, { body: newest.text, tag: 'caisse-chat' });
          }
        }
        lastMessageIdRef.current = newest ? newest.id : lastMessageIdRef.current;
        hasPolledOnceRef.current = true;

        setMessages(data);
        if (isChatVisible) {
          markAsRead(data);
        } else {
          const lastReadAt = lastReadAtRef.current;
          setUnreadCount(
            data.filter(
              (m) => m.senderId !== user.id && (!lastReadAt || new Date(m.createdAt) > new Date(lastReadAt))
            ).length
          );
        }
      } catch (err) {
        console.error('Erreur chargement messages', err);
      } finally {
        setLoaded(true);
      }
    };

    loadMessages();
    const interval = setInterval(loadMessages, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // markAsRead est stable (useCallback) mais dépend de `messages` ; on ne
    // veut relancer l'intervalle que si l'utilisateur change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const value = { messages, unreadCount, loaded, setChatOpen, markAsRead, appendMessage };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat doit être utilisé à l\'intérieur de <ChatProvider>');
  }
  return context;
}
