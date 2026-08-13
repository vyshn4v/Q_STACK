import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Tag } from '../types';
import { api } from '../api/client';
import { AppShell } from '../components/layout/AppShell';
import { Search, Tag as TagIcon, Loader2 } from 'lucide-react';

export const TagsPage: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api.getTags(searchTerm)
      .then((data) => setTags(data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [searchTerm]);

  return (
    <AppShell>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Tags Directory</h1>
          <p style={styles.subtitle}>
            A tag is a keyword or label that categorizes your question with other similar questions.
          </p>
        </div>

        {/* Search Bar */}
        <div style={styles.searchBox}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Filter by tag name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {/* Tags Grid */}
        {isLoading ? (
          <div style={styles.loadingContainer}>
            <Loader2 size={24} style={styles.spinner} />
            <span>Loading tags...</span>
          </div>
        ) : tags.length === 0 ? (
          <div style={styles.emptyState}>
            <TagIcon size={32} color="#94a3b8" />
            <p>No tags found matching "{searchTerm}"</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {tags.map((tag) => (
              <div key={tag.id || tag.name} style={styles.tagCard}>
                <Link to={`/questions?tag=${tag.name}`} style={styles.tagName}>
                  #{tag.name}
                </Link>
                <p style={styles.tagDesc}>
                  {tag.description || `Questions and answers related to ${tag.name}.`}
                </p>
                <div style={styles.tagMeta}>
                  <span>{tag.questions_count || 0} questions</span>
                </div>
              </div>
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
    marginBottom: '0.25rem',
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
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#ffffff',
    padding: '0.625rem 0.875rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    maxWidth: '320px',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    fontSize: '0.875rem',
    color: '#0f172a',
    width: '100%',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '1rem',
  },
  tagCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  tagName: {
    fontSize: '0.875rem',
    fontWeight: 700,
    color: '#2563eb',
    textDecoration: 'none',
    backgroundColor: '#eff6ff',
    padding: '0.25rem 0.5rem',
    borderRadius: '6px',
    width: 'fit-content',
  },
  tagDesc: {
    fontSize: '0.8125rem',
    color: '#64748b',
    lineHeight: 1.4,
    flexGrow: 1,
  },
  tagMeta: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    marginTop: '0.25rem',
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
    textAlign: 'center',
    padding: '3rem',
    color: '#64748b',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  },
};
