import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Bot, Sparkles, Send, User, Lock, LogIn, Plus, Trash2, MessageSquare, ExternalLink, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { RichTextRenderer } from '../components/common/RichTextRenderer';
import type { ChatSession, ChatMessage } from '../types';

export const AIChatPage: React.FC = () => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch user sessions on load
  useEffect(() => {
    if (!isAuthenticated) return;
    setIsLoadingSessions(true);
    api.getChatSessions()
      .then((data) => {
        setSessions(data || []);
        if (data && data.length > 0) {
          setActiveSessionId(data[0].id);
        } else {
          handleCreateNewSession();
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to load chat history');
      })
      .finally(() => setIsLoadingSessions(false));
  }, [isAuthenticated]);

  // 2. Fetch messages when active session changes
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    api.getSessionMessages(activeSessionId)
      .then((msgs) => {
        setMessages(msgs || []);
      })
      .catch(() => {});
  }, [activeSessionId]);

  // 3. Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleCreateNewSession = async () => {
    try {
      const newSession = await api.createChatSession('New Conversation');
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setMessages([]);
    } catch (err: any) {
      setError(err.message || 'Could not create new session');
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      await api.deleteChatSession(sessionId);
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setSessions(remaining);
      if (activeSessionId === sessionId) {
        if (remaining.length > 0) {
          setActiveSessionId(remaining[0].id);
        } else {
          handleCreateNewSession();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete chat session');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isTyping) return;

    if (!activeSessionId) {
      const newSession = await api.createChatSession(text.slice(0, 30));
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      return;
    }

    const optimisticUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      session_id: activeSessionId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUserMsg]);
    setInput('');
    setIsTyping(true);
    setError(null);

    try {
      const result = await api.sendChatMessage(activeSessionId, text);
      // Replace optimistic message and append real assistant message
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticUserMsg.id),
        result.userMessage,
        result.assistantMessage,
      ]);

      // Update session title if first message
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId && s.title === 'New Conversation'
            ? { ...s, title: text.slice(0, 35) + (text.length > 35 ? '...' : '') }
            : s,
        ),
      );
    } catch (err: any) {
      setError(err.message || 'Failed to send message.');
    } finally {
      setIsTyping(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <AppShell showRightRail={false}>
        <div style={styles.lockedContainer}>
          <div style={styles.lockedCard}>
            <div style={styles.lockedIconWrapper}>
              <Lock size={32} color="#2563eb" />
            </div>
            <h2 style={styles.lockedTitle}>AI Chat is Exclusive to Members</h2>
            <p style={styles.lockedDesc}>
              Sign in to query QStack's vector RAG assistant, explore verified community solutions, and stream real-time code explanations.
            </p>
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              style={styles.lockedSignInBtn}
            >
              <LogIn size={16} />
              <span>Sign In to Access AI Chat</span>
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <AppShell showRightRail={false}>
      <div style={styles.chatWrapper}>
        {/* Left Sessions Sidebar */}
        <aside style={styles.sessionsSidebar}>
          <div style={styles.sidebarTop}>
            <button onClick={handleCreateNewSession} style={styles.newChatBtn}>
              <Plus size={16} />
              <span>New Chat</span>
            </button>
          </div>

          <div style={styles.sessionsList}>
            {isLoadingSessions ? (
              <div style={{ padding: '1rem', color: '#64748b', fontSize: '0.8125rem' }}>
                Loading sessions...
              </div>
            ) : sessions.length === 0 ? (
              <div style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.8125rem' }}>
                No active conversations
              </div>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setActiveSessionId(s.id)}
                  style={{
                    ...styles.sessionItem,
                    backgroundColor: s.id === activeSessionId ? '#eff6ff' : 'transparent',
                    borderColor: s.id === activeSessionId ? '#bfdbfe' : 'transparent',
                  }}
                >
                  <MessageSquare size={15} color={s.id === activeSessionId ? '#2563eb' : '#64748b'} />
                  <span style={styles.sessionTitle}>{s.title}</span>
                  <button
                    onClick={(e) => handleDeleteSession(e, s.id)}
                    style={styles.deleteSessionBtn}
                    aria-label="Delete chat session"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Main Chat Area */}
        <main style={styles.mainChat}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerTitleRow}>
              <div style={styles.botIcon}>
                <Bot size={20} color="#ffffff" />
              </div>
              <div>
                <h1 style={styles.title}>{activeSession?.title || 'QStack AI Assistant'}</h1>
                <div style={styles.subtitleRow}>
                  <Sparkles size={13} color="#2563eb" />
                  <span style={styles.subtitle}>Pinecone Vector RAG • Llama 3.1 8B</span>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div style={styles.errorAlert}>
              <span>{error}</span>
            </div>
          )}

          {/* Messages Box */}
          <div style={styles.messagesBox}>
            {messages.length === 0 && (
              <div style={styles.welcomeBox}>
                <div style={styles.welcomeIconWrapper}>
                  <Sparkles size={28} color="#2563eb" />
                </div>
                <h3 style={styles.welcomeTitle}>How can I help your engineering today?</h3>
                <p style={styles.welcomeDesc}>
                  Ask any programming question or debugging problem. I retrieve verified community solutions and code context across QStack.
                </p>
              </div>
            )}

            {messages.map((m) => {
              const isUser = m.role === 'user';
              const citations = m.metadata?.citations || [];

              return (
                <div
                  key={m.id}
                  style={{
                    ...styles.messageRow,
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                  }}
                >
                  {!isUser && (
                    <div style={styles.botAvatar}>
                      <Bot size={16} color="#2563eb" />
                    </div>
                  )}

                  <div
                    style={{
                      ...styles.bubble,
                      backgroundColor: isUser ? '#2563eb' : '#ffffff',
                      color: isUser ? '#ffffff' : '#1e293b',
                      border: isUser ? 'none' : '1px solid #e2e8f0',
                    }}
                  >
                    {isUser ? (
                      <p style={{ margin: 0 }}>{m.content}</p>
                    ) : (
                      <>
                        <RichTextRenderer
                          content={m.content
                            .replace(/\n\n/g, '<br/><br/>')
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
                        />

                        {citations.length > 0 && (
                          <div style={styles.citationsContainer}>
                            <span style={styles.citationLabel}>Referenced QStack Discussions:</span>
                            <div style={styles.citationsList}>
                              {citations.map((c) => (
                                <Link
                                  key={c.id}
                                  to={`/questions/${c.id}`}
                                  style={styles.citationChip}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <ExternalLink size={11} />
                                  <span>{c.title}</span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <span
                      style={{
                        ...styles.timestamp,
                        color: isUser ? '#bfdbfe' : '#94a3b8',
                      }}
                    >
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {isUser && (
                    <div style={styles.userAvatar}>
                      <User size={16} color="#ffffff" />
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div style={styles.messageRow}>
                <div style={styles.botAvatar}>
                  <Bot size={16} color="#2563eb" />
                </div>
                <div style={styles.typingBubble}>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Retrieving vector context & synthesizing technical solution...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Input Form */}
          <form onSubmit={handleSend} style={styles.inputForm}>
            <input
              type="text"
              placeholder="Ask a technical question, paste an error stack trace, or request an architecture pattern..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
              style={styles.chatInput}
            />
            <button
              type="submit"
              disabled={isTyping || !input.trim()}
              style={{
                ...styles.sendBtn,
                opacity: isTyping || !input.trim() ? 0.6 : 1,
              }}
            >
              <Send size={16} />
              <span>Send</span>
            </button>
          </form>
        </main>
      </div>
    </AppShell>
  );
};

const styles: Record<string, React.CSSProperties> = {
  chatWrapper: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    height: 'calc(100vh - 120px)',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
  },
  sessionsSidebar: {
    width: '260px',
    backgroundColor: '#f8fafc',
    borderRight: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  sidebarTop: {
    padding: '1rem',
    borderBottom: '1px solid #e2e8f0',
  },
  newChatBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1rem',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#0f172a',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  sessionsList: {
    flexGrow: 1,
    overflowY: 'auto',
    padding: '0.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  sessionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.625rem',
    padding: '0.625rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid transparent',
    cursor: 'pointer',
    fontSize: '0.8125rem',
    color: '#1e293b',
    transition: 'background-color 0.15s ease',
  },
  sessionTitle: {
    flexGrow: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: 500,
  },
  deleteSessionBtn: {
    background: 'none',
    border: 'none',
    padding: '2px',
    color: '#94a3b8',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  mainChat: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    height: '100%',
  },
  header: {
    padding: '1.125rem 1.5rem',
    borderBottom: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
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
  errorAlert: {
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    padding: '0.5rem 1rem',
    fontSize: '0.8125rem',
    borderBottom: '1px solid #fecaca',
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
  welcomeBox: {
    margin: 'auto',
    textAlign: 'center',
    maxWidth: '440px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '2rem',
  },
  welcomeIconWrapper: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  welcomeDesc: {
    fontSize: '0.875rem',
    color: '#64748b',
    lineHeight: 1.5,
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.625rem',
  },
  botAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '2px',
  },
  userAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#2563eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '2px',
  },
  bubble: {
    maxWidth: '80%',
    padding: '1rem 1.25rem',
    borderRadius: '14px',
    fontSize: '0.9375rem',
    lineHeight: 1.6,
  },
  citationsContainer: {
    marginTop: '0.875rem',
    paddingTop: '0.75rem',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  },
  citationLabel: {
    fontSize: '0.6875rem',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  citationsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.375rem',
  },
  citationChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem 0.5rem',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    fontSize: '0.75rem',
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: 500,
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
  lockedContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 1rem',
  },
  lockedCard: {
    maxWidth: '480px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '2.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '1rem',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
  },
  lockedIconWrapper: {
    width: '60px',
    height: '60px',
    borderRadius: '16px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.5rem',
  },
  lockedTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  lockedDesc: {
    fontSize: '0.875rem',
    color: '#64748b',
    lineHeight: 1.5,
  },
  lockedSignInBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '0.5rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  },
};
