import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Tag as TagType } from '../../types';
import { api } from '../../api/client';
import { TrendingUp, HelpCircle, Sparkles } from 'lucide-react';

export const RightRail: React.FC = () => {
  const [popularTags, setPopularTags] = useState<TagType[]>([]);

  useEffect(() => {
    api.getPopularTags()
      .then((data) => setPopularTags(data.slice(0, 10)))
      .catch(() => {});
  }, []);

  return (
    <aside style={styles.rail}>
      {/* Tips / Guidelines Card */}
      <div style={styles.widgetCard}>
        <div style={styles.widgetHeader}>
          <HelpCircle size={16} color="#2563eb" />
          <span style={styles.widgetTitle}>The Art of Asking</span>
        </div>
        <ul style={styles.tipsList}>
          <li>Summarize the specific problem clearly in the title</li>
          <li>Include relevant code snippets and error logs</li>
          <li>Describe what you tried and what you expected</li>
        </ul>
      </div>

      {/* Popular Tags */}
      <div style={styles.widgetCard}>
        <div style={styles.widgetHeader}>
          <TrendingUp size={16} color="#f97316" />
          <span style={styles.widgetTitle}>Trending Tags</span>
        </div>
        <div style={styles.tagsGrid}>
          {popularTags.length > 0 ? (
            popularTags.map((tag) => (
              <Link
                key={tag.id || tag.name}
                to={`/questions?tag=${tag.name}`}
                style={styles.tagItem}
              >
                <span style={styles.tagName}>#{tag.name}</span>
                <span style={styles.tagCount}>{tag.questions_count || 0}</span>
              </Link>
            ))
          ) : (
            <div style={styles.tagLoading}>Loading tags...</div>
          )}
        </div>
        <Link to="/tags" style={styles.viewAllLink}>
          View all tags →
        </Link>
      </div>

      {/* AI Features Notice */}
      <div style={styles.aiNoticeCard}>
        <div style={styles.aiNoticeHeader}>
          <Sparkles size={16} color="#2563eb" />
          <span style={styles.aiNoticeTitle}>Dual AI Architecture</span>
        </div>
        <p style={styles.aiNoticeText}>
          Every question receives an instant cached AI overview powered by Gemini, alongside conversational Pinecone vector RAG search.
        </p>
      </div>
    </aside>
  );
};

const styles: Record<string, React.CSSProperties> = {
  rail: {
    width: '280px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  widgetCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '1.25rem',
  },
  widgetHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.875rem',
  },
  widgetTitle: {
    fontSize: '0.875rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  tipsList: {
    paddingLeft: '1.125rem',
    fontSize: '0.8125rem',
    color: '#475569',
    lineHeight: 1.5,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.375rem',
  },
  tagsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.375rem',
  },
  tagItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.25rem 0.5rem',
    backgroundColor: '#f1f5f9',
    borderRadius: '6px',
    fontSize: '0.75rem',
    textDecoration: 'none',
  },
  tagName: {
    color: '#2563eb',
    fontWeight: 600,
  },
  tagCount: {
    color: '#94a3b8',
    fontSize: '0.6875rem',
  },
  tagLoading: {
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  viewAllLink: {
    display: 'inline-block',
    marginTop: '0.75rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#2563eb',
    textDecoration: 'none',
  },
  aiNoticeCard: {
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '12px',
    padding: '1.25rem',
  },
  aiNoticeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
  },
  aiNoticeTitle: {
    fontSize: '0.8125rem',
    fontWeight: 700,
    color: '#1e40af',
  },
  aiNoticeText: {
    fontSize: '0.75rem',
    color: '#3b82f6',
    lineHeight: 1.45,
  },
};
