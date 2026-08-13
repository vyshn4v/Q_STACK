import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Flame, Clock, HelpCircle, ThumbsUp, Loader2 } from 'lucide-react';
import type { Question } from '../types';
import { api } from '../api/client';
import { AppShell } from '../components/layout/AppShell';
import { QuestionCard } from '../components/qa/QuestionCard';

export const HomePage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState<'newest' | 'trending' | 'unanswered' | 'votes'>('newest');
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const data = await api.getQuestions({ sort: activeTab, limit: 15 });
      setQuestions(data.questions);
      setTotal(data.total);
    } catch {
      // Offline fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [activeTab]);

  return (
    <AppShell>
      <div style={styles.container}>
        {/* Page Top Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>All Questions</h1>
            <p style={styles.subtitle}>
              {total > 0 ? `${total} questions asked by developers` : 'Explore questions and knowledge'}
            </p>
          </div>
          <Link to="/ask" style={styles.askBtn}>
            <Plus size={16} strokeWidth={2.5} />
            <span>Ask Question</span>
          </Link>
        </div>

        {/* Filter Tabs */}
        <div style={styles.tabsRow}>
          <div style={styles.tabsList}>
            <button
              onClick={() => setActiveTab('newest')}
              style={{
                ...styles.tabBtn,
                ...(activeTab === 'newest' ? styles.activeTabBtn : {}),
              }}
            >
              <Clock size={15} />
              <span>Newest</span>
            </button>
            <button
              onClick={() => setActiveTab('trending')}
              style={{
                ...styles.tabBtn,
                ...(activeTab === 'trending' ? styles.activeTabBtn : {}),
              }}
            >
              <Flame size={15} />
              <span>Trending</span>
            </button>
            <button
              onClick={() => setActiveTab('unanswered')}
              style={{
                ...styles.tabBtn,
                ...(activeTab === 'unanswered' ? styles.activeTabBtn : {}),
              }}
            >
              <HelpCircle size={15} />
              <span>Unanswered</span>
            </button>
            <button
              onClick={() => setActiveTab('votes')}
              style={{
                ...styles.tabBtn,
                ...(activeTab === 'votes' ? styles.activeTabBtn : {}),
              }}
            >
              <ThumbsUp size={15} />
              <span>Most Voted</span>
            </button>
          </div>
        </div>

        {/* Questions Feed */}
        {isLoading ? (
          <div style={styles.loadingContainer}>
            <Loader2 size={24} style={styles.spinner} />
            <span>Loading community questions...</span>
          </div>
        ) : questions.length === 0 ? (
          <div style={styles.emptyState}>
            <HelpCircle size={40} color="#94a3b8" />
            <h3 style={styles.emptyTitle}>No questions found</h3>
            <p style={styles.emptySubtitle}>
              Be the first developer to ask a question in this category!
            </p>
            <Link to="/ask" style={styles.emptyAction}>
              Ask the First Question
            </Link>
          </div>
        ) : (
          <div style={styles.questionsList}>
            {questions.map((q) => (
              <QuestionCard key={q.id} question={q} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#64748b',
    marginTop: '0.125rem',
  },
  askBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.625rem 1.125rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600,
    textDecoration: 'none',
  },
  tabsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '0.75rem',
  },
  tabsList: {
    display: 'flex',
    gap: '0.375rem',
    backgroundColor: '#f1f5f9',
    padding: '0.25rem',
    borderRadius: '8px',
  },
  tabBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.375rem 0.75rem',
    borderRadius: '6px',
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: '#64748b',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  activeTabBtn: {
    backgroundColor: '#ffffff',
    color: '#2563eb',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  },
  questionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.875rem',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    padding: '4rem 1rem',
    color: '#64748b',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
    color: '#2563eb',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '4rem 1rem',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px dashed #cbd5e1',
    gap: '0.75rem',
  },
  emptyTitle: {
    fontSize: '1.125rem',
    fontWeight: 700,
    color: '#1e293b',
  },
  emptySubtitle: {
    fontSize: '0.875rem',
    color: '#64748b',
    maxWidth: '360px',
  },
  emptyAction: {
    marginTop: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600,
    textDecoration: 'none',
  },
};
