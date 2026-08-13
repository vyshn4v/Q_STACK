import React, { useState } from 'react';
import { Sparkles, Bot, RotateCcw, Copy, Check, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { RichTextRenderer } from '../common/RichTextRenderer';

interface AIAnswerBlockProps {
  questionId: string;
  authorId: string;
  initialAiResponse?: {
    status: 'pending' | 'ready' | 'failed';
    response_text?: string | null;
    model?: string | null;
    generated_at?: string | null;
  } | null;
}

export const AIAnswerBlock: React.FC<AIAnswerBlockProps> = ({
  questionId,
  authorId,
  initialAiResponse,
}) => {
  const { user } = useAuth();
  const [aiData, setAiData] = useState(initialAiResponse);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthor = user?.id === authorId;
  const isPrivileged = user?.role && ['moderator', 'admin', 'super_admin'].includes(user.role);
  const canRegenerate = isAuthor || isPrivileged;

  const handleRegenerate = async () => {
    if (isRegenerating) return;
    setIsRegenerating(true);
    setError(null);

    try {
      const res = await api.regenerateQuestionAiAnswer(questionId);
      setAiData({
        status: 'ready',
        response_text: res.response_text,
        model: res.model,
        generated_at: new Date().toISOString(),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate AI summary.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopy = () => {
    if (!aiData?.response_text) return;
    navigator.clipboard.writeText(aiData.response_text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!aiData || aiData.status === 'pending') {
    return (
      <div style={styles.containerPending}>
        <div style={styles.header}>
          <div style={styles.headerTitle}>
            <div style={styles.iconCircle}>
              <Sparkles size={16} color="#2563eb" />
            </div>
            <strong>QStack AI Architecture Analysis</strong>
            <span style={styles.badgePending}>Processing</span>
          </div>
        </div>
        <div style={styles.skeletonBody}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '0.875rem' }}>
              Synthesizing root-cause diagnosis and code solution in the background...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (aiData.status === 'failed') {
    return (
      <div style={styles.containerFailed}>
        <div style={styles.header}>
          <div style={styles.headerTitle}>
            <AlertCircle size={18} color="#dc2626" />
            <strong>QStack AI Analysis Unavailable</strong>
          </div>
          {canRegenerate && (
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              style={styles.actionBtn}
            >
              <RotateCcw size={14} />
              <span>Retry Generation</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const modelName = aiData.model?.split('/')?.pop() || 'Llama-3.1 8B';

  return (
    <div style={styles.container}>
      {/* Header Bar */}
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          <div style={styles.iconCircle}>
            <Sparkles size={16} color="#2563eb" />
          </div>
          <div>
            <strong style={styles.titleText}>QStack AI Technical Summary</strong>
            <div style={styles.metaRow}>
              <span style={styles.modelPill}>
                <Bot size={12} />
                <span>{modelName}</span>
              </span>
              <span style={styles.cachedPill}>Cached Answer</span>
            </div>
          </div>
        </div>

        <div style={styles.actionsRow}>
          <button
            onClick={handleCopy}
            style={styles.actionBtn}
            aria-label="Copy AI solution"
          >
            {isCopied ? <Check size={14} color="#059669" /> : <Copy size={14} />}
            <span>{isCopied ? 'Copied' : 'Copy'}</span>
          </button>

          {canRegenerate && (
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              style={styles.actionBtn}
              title="Regenerate cached AI response"
            >
              <RotateCcw size={14} style={{ animation: isRegenerating ? 'spin 1s linear infinite' : 'none' }} />
              <span>{isRegenerating ? 'Analyzing...' : 'Regenerate'}</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={styles.errorBanner}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Solution Body */}
      <div style={styles.contentBody}>
        {aiData.response_text && (
          <RichTextRenderer
            content={aiData.response_text
              .replace(/\n\n/g, '<br/><br/>')
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
          />
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#f8faff',
    border: '1px solid #dbeafe',
    borderRadius: '14px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    boxShadow: '0 2px 4px rgba(37,99,235,0.03)',
  },
  containerPending: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  containerFailed: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '14px',
    padding: '1rem 1.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '0.75rem',
    borderBottom: '1px solid #e0e7ff',
    paddingBottom: '0.75rem',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  iconCircle: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: '0.9375rem',
    fontWeight: 700,
    color: '#1e3a8a',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '0.125rem',
  },
  modelPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.6875rem',
    fontWeight: 600,
    color: '#475569',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    padding: '0.125rem 0.375rem',
    borderRadius: '4px',
  },
  cachedPill: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    color: '#059669',
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    padding: '0.125rem 0.375rem',
    borderRadius: '4px',
  },
  badgePending: {
    fontSize: '0.6875rem',
    fontWeight: 600,
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    padding: '0.125rem 0.5rem',
    borderRadius: '12px',
  },
  actionsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  actionBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.375rem 0.625rem',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#475569',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  skeletonBody: {
    padding: '0.75rem 0',
  },
  contentBody: {
    fontSize: '0.875rem',
    lineHeight: 1.6,
    color: '#1e293b',
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontSize: '0.75rem',
    color: '#b91c1c',
    backgroundColor: '#fee2e2',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
  },
};
