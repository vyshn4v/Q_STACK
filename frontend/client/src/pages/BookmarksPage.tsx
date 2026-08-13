import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Question } from '../types';
import { api } from '../api/client';
import { AppShell } from '../components/layout/AppShell';
import { QuestionCard } from '../components/qa/QuestionCard';
import { Bookmark, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const BookmarksPage: React.FC = () => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    api.getUserBookmarks(1, 30)
      .then((res) => {
        setQuestions(res.questions);
        setTotal(res.total);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <AppShell>
        <div style={styles.authLockCard}>
          <Bookmark size={36} color="#2563eb" />
          <h2 style={styles.authLockTitle}>Sign in to view saved questions</h2>
          <p style={styles.authLockDesc}>
            Bookmark insightful questions and solutions to quickly find them whenever you need them.
          </p>
          <button onClick={() => openAuthModal('login')} style={styles.signInBtn}>
            Sign In to Access Bookmarks
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.headerTitleRow}>
            <Bookmark size={22} color="#2563eb" />
            <h1 style={styles.title}>Saved Bookmarks</h1>
          </div>
          <p style={styles.subtitle}>
            {total > 0
              ? `You have saved ${total} ${total === 1 ? 'question' : 'questions'}`
              : 'Questions you bookmark will appear here for easy access'}
          </p>
        </div>

        {isLoading ? (
          <div style={styles.loadingContainer}>
            <Loader2 size={28} style={styles.spinner} />
            <span>Loading your saved bookmarks...</span>
          </div>
        ) : questions.length === 0 ? (
          <div style={styles.emptyState}>
            <Bookmark size={40} color="#94a3b8" />
            <h3 style={styles.emptyTitle}>No saved bookmarks yet</h3>
            <p style={styles.emptySubtitle}>
              When browsing questions, click the "Save" button to keep track of useful discussions and code examples.
            </p>
            <Link to="/questions" style={styles.browseBtn}>
              <span>Browse Questions</span>
              <ArrowRight size={16} />
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
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '0.875rem',
  },
  headerTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#0f172a',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#64748b',
    marginTop: '0.25rem',
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
    padding: '4rem 1.5rem',
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
    maxWidth: '400px',
  },
  browseBtn: {
    marginTop: '0.5rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.625rem 1.25rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600,
    textDecoration: 'none',
  },
  authLockCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '4rem 1.5rem',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    gap: '1rem',
    maxWidth: '520px',
    margin: '2rem auto',
  },
  authLockTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  authLockDesc: {
    fontSize: '0.875rem',
    color: '#64748b',
    lineHeight: 1.5,
  },
  signInBtn: {
    padding: '0.625rem 1.5rem',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  },
};
