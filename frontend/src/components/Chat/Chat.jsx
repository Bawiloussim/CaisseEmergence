import { useState, useEffect, useRef } from 'react';
import { Send, Circle } from 'lucide-react';
import { useAuth } from '../Auth/AuthContext';
import { useChat } from './ChatContext';
import ChatController from '../../controllers/ChatController';
import LoadingSpinner from '../UI/LoadingSpinner';

const POLL_ONLINE_INTERVAL_MS = 5000;
const HEARTBEAT_INTERVAL_MS = 20000;

const Chat = () => {
  const { user } = useAuth();
  const { messages, loaded, setChatOpen, appendMessage } = useChat();
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setChatOpen(true);
    return () => setChatOpen(false);
  }, [setChatOpen]);

  useEffect(() => {
    const loadOnlineMembers = async () => {
      try {
        const data = await ChatController.getOnlineMembers();
        setOnlineMembers(data);
      } catch (err) {
        console.error('Erreur chargement membres en ligne', err);
      }
    };

    loadOnlineMembers();
    ChatController.heartbeat().catch(() => {});

    const pollInterval = setInterval(loadOnlineMembers, POLL_ONLINE_INTERVAL_MS);
    const heartbeatInterval = setInterval(() => {
      ChatController.heartbeat().catch(() => {});
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      clearInterval(pollInterval);
      clearInterval(heartbeatInterval);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    setSending(true);
    try {
      const message = await ChatController.sendMessage(trimmed);
      appendMessage(message);
      setText('');
      const data = await ChatController.getOnlineMembers();
      setOnlineMembers(data);
    } catch (err) {
      alert(`Erreur lors de l'envoi : ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  if (!loaded) {
    return <LoadingSpinner label="Chargement du chat…" />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in">
      <div className="lg:col-span-3 card flex flex-col h-[70vh]">
        <h2 className="font-playfair text-xl font-bold text-navy mb-4">Chat de la caisse</h2>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {messages.length === 0 && (
            <p className="text-center text-gray-400 py-12">Aucun message pour le moment — lancez la discussion !</p>
          )}
          {messages.map((msg) => {
            const isMine = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 ${
                    isMine ? 'bg-navy text-white' : 'bg-gray-100 text-navy'
                  }`}
                >
                  {!isMine && <p className="text-xs font-semibold text-gold mb-0.5">{msg.senderName}</p>}
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? 'text-white/60' : 'text-gray-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="flex gap-2 mt-4 pt-4 border-t">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Écrivez un message..."
            className="input flex-1"
            maxLength={2000}
            disabled={sending}
          />
          <button type="submit" className="btn-gold flex items-center gap-2" disabled={sending || !text.trim()}>
            <Send size={16} />
          </button>
        </form>
      </div>

      <div className="card">
        <h3 className="font-playfair text-lg font-bold text-navy mb-4">
          Membres en ligne ({onlineMembers.length})
        </h3>
        {onlineMembers.length === 0 ? (
          <p className="text-sm text-gray-400">Personne n'est en ligne pour le moment</p>
        ) : (
          <ul className="space-y-2">
            {onlineMembers.map((m) => (
              <li key={m.id} className="flex items-center gap-2 text-sm">
                <Circle size={10} className="text-green-500 fill-green-500" />
                <span className={m.id === user?.id ? 'font-semibold text-navy' : 'text-gray-700'}>
                  {m.name}
                  {m.id === user?.id && ' (vous)'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Chat;
