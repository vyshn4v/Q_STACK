import React from 'react';
import { Sparkles, Loader2, Bot } from 'lucide-react';

interface AIAnswerBlockProps {
  status?: 'pending' | 'ready' | 'failed';
  responseText?: string | null;
  model?: string | null;
}

export const AIAnswerBlock: React.FC<AIAnswerBlockProps> = ({
  status = 'pending',
  responseText,
  model = 'Gemini',
}) => {
  if (status === 'failed') {
    return null; // Per 03-ai-systems.md: don't surface a broken state to the user
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <div style={styles.iconWrapper}>
            <Sparkles size={16} color="#2563eb" />
          </div>
          <span style={styles.title}>AI-Generated Summary</span>
          <span style={styles.badge}>Cached</span>
        </div>
        <span style={styles.modelTag}>{model || 'Gemini'}</span>
      </div>

      <div style={styles.content}>
        {status === 'pending' || !responseText ? (
          <div style={styles.loadingState}>
            <Loader2 size={18} style={styles.spinner} />
            <span>AI is synthesizing an overview from question context...</span>
          </div>
        ) : (
          <div style={styles.responseBody}>
            {responseText.split('\n\n').map((paragraph, index) => (
              <p key={index} style={{ marginBottom: '0.75rem' }}>
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </div>

      <div style={styles.footer}>
        <Bot size={13} color="#94a3b8" />
        <span>Generated once on question creation to save resources. Community answers below remain the primary source of truth.</span>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '1.25rem',
    margin: '1.5rem 0',
    borderLeft: '4px solid #2563eb',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.75rem',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  iconWrapper: {
    width: '24px',
    height: '24px',
    borderRadius: '6px',
    backgroundColor: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: '0.9375rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  badge: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    padding: '0.125rem 0.375rem',
    borderRadius: '4px',
    border: '1px solid #bfdbfe',
  },
  modelTag: {
    fontSize: '0.75rem',
    color: '#64748b',
    fontWeight: 500,
  },
  content: {
    fontSize: '0.9375rem',
    color: '#334155',
    lineHeight: 1.6,
  },
  loadingState: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    color: '#64748b',
    padding: '0.5rem 0',
    fontSize: '0.875rem',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
    color: '#2563eb',
  },
  responseBody: {
    color: '#334155',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    marginTop: '0.75rem',
    paddingTop: '0.75rem',
    borderTop: '1px dashed #e2e8f0',
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
};
