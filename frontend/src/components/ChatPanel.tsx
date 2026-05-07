import { useState, useEffect, useRef } from 'react';
import { Send, X } from 'lucide-react';
import { socket } from '../api/socket';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

interface Message {
  _id: string;
  senderId: {
    _id: string;
    fullName: string;
  };
  text: string;
  createdAt: string;
}

interface ChatPanelProps {
  roomId: string;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onClose: () => void;
}

export const ChatPanel = ({ roomId, messages, setMessages, onClose }: ChatPanelProps) => {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const response = await api.get(`/messages/${roomId}`);
        setMessages(response.data);
      } catch (error) {
        console.error('Failed to fetch chat history', error);
      }
    };

    fetchChatHistory();

    socket.on('new-message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off('new-message');
    };
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    socket.emit('send-message', roomId, user.id, newMessage);
    setNewMessage('');
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h3>In-call messages</h3>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div 
            key={msg._id} 
            className={`chat-message ${msg.senderId._id === user?.id ? 'message-own' : 'message-other'}`}
          >
            <div className="message-sender">{msg.senderId.fullName}</div>
            <div className="message-text">{msg.text}</div>
            <div className="message-time">{format(new Date(msg.createdAt), 'h:mm a')}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-area" onSubmit={handleSendMessage}>
        <div className="chat-input-wrapper">
          <input
            type="text"
            className="chat-input"
            placeholder="Send a message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button type="submit" className="btn-primary" style={{ padding: '0.5rem' }} disabled={!newMessage.trim()}>
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};
