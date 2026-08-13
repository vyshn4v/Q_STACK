import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Award } from 'lucide-react';
import type { Question } from '../../types';

interface QuestionCardProps {
  question: Question;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question }) => {
  const formattedDate = new Date(question.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="question-card-inner" style={styles.card}>
      {/* Left Metrics Column */}
      <div className="question-card-stats" style={styles.metricsColumn}>
        <div style={styles.metricItem}>
          <span style={styles.metricValue}>{question.score}</span>
          <span style={styles.metricLabel}>votes</span>
        </div>

        <div
          style={{
            ...styles.metricItem,
            ...(question.answers_count > 0
              ? question.has_accepted_answer
                ? styles.metricAnswerAccepted
                : styles.metricAnswerHas
              : {}),
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {question.has_accepted_answer && <Check size={13} strokeWidth={3} />}
            <span style={styles.metricValue}>{question.answers_count}</span>
          </div>
          <span style={styles.metricLabel}>answers</span>
        </div>

        <div style={styles.metricItemViews}>
          <span style={styles.metricValueViews}>{question.views_count}</span>
          <span style={styles.metricLabel}>views</span>
        </div>
      </div>

      {/* Right Content Column */}
      <div style={styles.contentColumn}>
        <h3 style={styles.title}>
          <Link to={`/questions/${question.id}`} style={styles.titleLink}>
            {question.title}
          </Link>
        </h3>

        <p style={styles.bodySnippet}>
          {question.body.replace(/[#*`_\[\]]/g, '').slice(0, 180)}
          {question.body.length > 180 ? '...' : ''}
        </p>

        <div style={styles.footerRow}>
          {/* Tags */}
          <div style={styles.tagsContainer}>
            {question.tags &&
              question.tags.map((tag) => (
                <Link key={tag.id || tag.name} to={`/questions?tag=${tag.name}`} style={styles.tagChip}>
                  #{tag.name}
                </Link>
              ))}
            {question.medals_count > 0 && (
              <span style={styles.medalBadge}>
                <Award size={13} color="#eab308" />
                <span>{question.medals_count}</span>
              </span>
            )}
          </div>

          {/* Author Mini Card */}
          <div style={styles.authorMiniCard}>
            <div style={styles.avatar}>
              {question.author_avatar ? (
                <img src={question.author_avatar} alt={question.author_name} style={styles.avatarImg} />
              ) : (
                <span style={styles.avatarFallback}>
                  {question.author_name ? question.author_name[0].toUpperCase() : 'U'}
                </span>
              )}
            </div>
            <div style={styles.authorInfo}>
              <span style={styles.authorName}>{question.author_name}</span>
              <div style={styles.authorMeta}>
                <span style={styles.reputation}>{question.author_reputation} rep</span>
                <span>•</span>
                <span>asked {formattedDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    display: 'flex',
    gap: '1.25rem',
    padding: '1.25rem',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  },
  metricsColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '0.5rem',
    minWidth: '85px',
    flexShrink: 0,
  },
  metricItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '0.375rem',
    padding: '0.125rem 0.375rem',
    borderRadius: '6px',
    fontSize: '0.8125rem',
    color: '#64748b',
  },
  metricAnswerHas: {
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    border: '1px solid #bfdbfe',
    fontWeight: 600,
  },
  metricAnswerAccepted: {
    backgroundColor: '#ecfdf5',
    color: '#059669',
    border: '1px solid #a7f3d0',
    fontWeight: 600,
  },
  metricItemViews: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  metricValue: {
    fontWeight: 700,
  },
  metricValueViews: {
    fontWeight: 500,
  },
  metricLabel: {
    fontSize: '0.75rem',
  },
  contentColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flexGrow: 1,
    minWidth: 0,
  },
  title: {
    fontSize: '1.0625rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  titleLink: {
    color: '#1e293b',
  },
  bodySnippet: {
    fontSize: '0.875rem',
    color: '#64748b',
    lineHeight: 1.5,
  },
  footerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '0.75rem',
    marginTop: '0.5rem',
  },
  tagsContainer: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.375rem',
  },
  tagChip: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.25rem 0.625rem',
    backgroundColor: '#f1f5f9',
    color: '#334155',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
    transition: 'background-color 0.15s ease',
  },
  medalBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem 0.5rem',
    backgroundColor: '#fefce8',
    color: '#854d0e',
    border: '1px solid #fef08a',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  authorMiniCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginLeft: 'auto',
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarFallback: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#475569',
  },
  authorInfo: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '0.75rem',
  },
  authorName: {
    fontWeight: 600,
    color: '#334155',
  },
  authorMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    color: '#94a3b8',
  },
  reputation: {
    fontWeight: 600,
    color: '#2563eb',
  },
};
