import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import type { Question } from '../types';
import { api } from '../api/client';
import { AppShell } from '../components/layout/AppShell';
import { QuestionCard } from '../components/qa/QuestionCard';
import { Plus, Search, Tag, X, Loader2 } from 'lucide-react';

export const QuestionsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tagParam = searchParams.get('tag') || '';
  const searchParam = searchParams.get('search') || '';
  const sortParam = searchParams.get('sort') || 'newest';

  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParam);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const data = await api.getQuestions({
        tag: tagParam || undefined,
        search: searchParam || undefined,
        sort: sortParam,
        limit: 20,
      });
      setQuestions(data.questions);
      setTotal(data.total);
    } catch {
      // Handle gracefully
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setSearchInput(searchParam);
    fetchQuestions();
  }, [tagParam, searchParam, sortParam]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      newParams.set('search', searchInput.trim());
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  const removeTagFilter = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('tag');
    setSearchParams(newParams);
  };

  const removeSearchFilter = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('search');
    setSearchInput('');
    setSearchParams(newParams);
  };

  return (
    <AppShell>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              {tagParam ? `Questions tagged [${tagParam}]` : searchParam ? `Search: "${searchParam}"` : 'Explore Questions'}
            </h1>
            <p style={styles.subtitle}>{total} questions found</p>
          </div>
          <Link to="/ask" style={styles.askBtn}>
            <Plus size={16} strokeWidth={2.5} />
            <span>Ask Question</span>
          </Link>
        </div>

        {/* Filter Bar */}
        <div style={styles.filterBar}>
          <form onSubmit={handleSearchSubmit} style={styles.searchBox}>
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Filter by keyword..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={styles.filterInput}
            />
          </form>

          {/* Active Filter Badges */}
          <div style={styles.activeFilters}>
            {tagParam && (
              <span style={styles.filterBadge}>
                <Tag size={13} />
                <span>#{tagParam}</span>
                <button onClick={removeTagFilter} style={styles.removeFilterBtn}>
                  <X size={12} />
                </button>
              </span>
            )}
            {searchParam && (
              <span style={styles.filterBadge}>
                <span>"{searchParam}"</span>
                <button onClick={removeSearchFilter} style={styles.removeFilterBtn}>
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Results List */}
        {isLoading ? (
          <div style={styles.loadingContainer}>
            <Loader2 size={24} style={styles.spinner} />
            <span>Finding matching questions...</span>
          </div>
        ) : questions.length === 0 ? (
          <div style={styles.emptyState}>
            <h3>No questions matched your search criteria</h3>
            <p>Try searching for different keywords or asking your own question.</p>
            <Link to="/ask" style={styles.askBtn}>
              Ask a Question
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
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#64748b',
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
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
    backgroundColor: '#ffffff',
    padding: '0.75rem',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexGrow: 1,
  },
  filterInput: {
    width: '100%',
    border: 'none',
    outline: 'none',
    fontSize: '0.875rem',
    color: '#0f172a',
  },
  activeFilters: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  filterBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    padding: '0.25rem 0.5rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
    border: '1px solid #bfdbfe',
  },
  removeFilterBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#2563eb',
    padding: 0,
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
    padding: '3rem',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px dashed #cbd5e1',
    textAlign: 'center',
    gap: '0.75rem',
    color: '#64748b',
  },
};
