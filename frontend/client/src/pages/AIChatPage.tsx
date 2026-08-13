import React, { useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Bot, Sparkles, Send, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AIChatPage: React.FC = () => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text: 'Hello! I am QStack AI. I can answer developer questions using knowledge and verified solutions from across the QStack platform. What are you building today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI synthesis response for Phase 1 / ready for Phase 4 Pinecone RAG stream
    setTimeout(() => {
      const aiReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: `Regarding "${userMessage.text}":\n\nIn QStack's knowledge base, questions on this topic generally recommend modular architectural separation, parameterized queries for security, and event-driven background processing.\n\nCheck out the relevant questions and answers in our Questions directory for detailed community-verified code examples!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiReply]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <AppShell showRightRail={false}>
      <div style={styles.chatContainer}>
        {/* Chat Header */}
        <div style={styles.header}>
          <div style={styles.headerTitleRow}>
            <div style={styles.botIcon}>
              <Bot size={20} color="#ffffff" />
            </div>
            <div>
              <h1 style={styles.title}>QStack AI Assistant</h1>
              <div style={styles.subtitleRow}>
                <Sparkles size={13} color="#2563eb" />
                <span style={styles.subtitle}>Pinecone Vector RAG + Gemini Knowledge Search</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div style={styles.messagesBox}>
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                ...styles.messageRow,
                justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              {m.sender === 'assistant' && (
                <div style={styles.botAvatar}>
                  <Bot size={16} color="#2563eb" />
                </div>
              )}
              <div
                style={{
                  ...styles.bubble,
                  backgroundColor: m.sender === 'user' ? '#2563eb' : '#ffffff',
                  color: m.sender === 'user' ? '#ffffff' : '#1e293b',
                  border: m.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                }}
              >
                {m.text.split('\n\n').map((p, i) => (
                  <p key={i} style={{ marginBottom: i < m.text.split('\n\n').length - 1 ? '0.75rem' : 0 }}>
                    {p}
                  </p>
                ))}
                <span
                  style={{
                    ...styles.timestamp,
                    color: m.sender === 'user' ? '#bfdbfe' : '#94a3b8',
                  }}
                >
                  {m.timestamp}
                </span>
              </div>
              {m.sender === 'user' && (
                <div style={styles.userAvatar}>
                  <User size={16} color="#ffffff" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div style={styles.messageRow}>
              <div style={styles.botAvatar}>
                <Bot size={16} color="#2563eb" />
              </div>
              <div style={styles.typingBubble}>
                <Sparkles size={14} color="#2563eb" style={{ animation: 'spin 1.5s linear infinite' }} />
                <span>Searching vector database & synthesizing response...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} style={styles.inputForm}>
          <input
            type="text"
            placeholder={isAuthenticated ? "Ask any programming question or concept..." : "Sign in to chat with QStack AI..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            style={styles.chatInput}
          />
          <button type="submit" disabled={isTyping || !input.trim()} style={styles.sendBtn}>
            <Send size={16} />
            <span>Send</span>
          </button>
        </form>
      </div>
    </AppShell>
  );
};

const styles: Record<string, React.CSSProperties> = {
  chatContainer: {
    maxWidth: '900px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 120px)',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
  },
  header: {
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
  },
  headerTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.875rem',
  },
  botIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: '#2563eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: '1.125rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  subtitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    marginTop: '0.125rem',
  },
  subtitle: {
    fontSize: '0.75rem',
    color: '#2563eb',
    fontWeight: 600,
  },
  messagesBox: {
    flexGrow: 1,
    padding: '1.5rem',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    backgroundColor: '#f8fafc',
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '0.625rem',
  },
  botAvatar: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userAvatar: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    backgroundColor: '#2563eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bubble: {
    maxWidth: '75%',
    padding: '1rem',
    borderRadius: '14px',
    fontSize: '0.9375rem',
    lineHeight: 1.6,
  },
  typingBubble: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    fontSize: '0.8125rem',
    color: '#64748b',
  },
  timestamp: {
    display: 'block',
    fontSize: '0.6875rem',
    marginTop: '0.5rem',
    textAlign: 'right',
  },
  inputForm: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem 1.5rem',
    borderTop: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
  },
  chatInput: {
    flexGrow: 1,
    padding: '0.75rem 1rem',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '0.9375rem',
    outline: 'none',
  },
  sendBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.75rem 1.25rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  },
};
