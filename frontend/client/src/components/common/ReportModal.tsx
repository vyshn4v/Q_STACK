import React, { useState } from 'react';
import { Flag, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'question' | 'answer' | 'comment' | 'user';
  targetId: string;
  targetTitle?: string;
}

const REPORT_CATEGORIES = [
  { id: 'spam', label: 'Spam or Advertising', desc: 'Promotional content, repeated links, or automated bots.' },
  { id: 'harassment', label: 'Harassment or Offensive Language', desc: 'Hostile, discriminatory, or abusive tone towards community members.' },
  { id: 'misleading', label: 'Misleading or Harmful Code', desc: 'Code patterns that cause security vulnerabilities or intentional damage.' },
  { id: 'low_quality', label: 'Very Low Quality / Off-Topic', desc: 'Not a technical question, lacks minimum context, or gibberish.' },
  { id: 'other', label: 'Other Policy Violation', desc: 'Explain details in the reason box below.' },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
}) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [category, setCategory] = useState('spam');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onClose();
      openAuthModal('login');
      return;
    }

    const selectedCategory = REPORT_CATEGORIES.find((c) => c.id === category)?.label || category;
    const fullReason = details.trim()
      ? `[${selectedCategory}] ${details.trim()}`
      : `[${selectedCategory}] Standard policy violation reported.`;

    setIsSubmitting(true);
    setError(null);

    try {
      await api.createReport({
        targetType,
        targetId,
        reason: fullReason,
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setDetails('');
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerTitle}>
            <div style={styles.iconCircle}>
              <Flag size={18} color="#dc2626" />
            </div>
            <div>
              <h3 style={styles.title}>Report {targetType.toUpperCase()}</h3>
              <p style={styles.subtitle}>
                Help keep QStack a respectful and high-quality engineering community.
              </p>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {isSuccess ? (
          <div style={styles.successState}>
            <CheckCircle size={40} color="#059669" />
            <h4 style={styles.successHeading}>Report Submitted</h4>
            <p style={styles.successText}>
              Thank you for flagging this content. Our moderation team has been dispatched to review it.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.body}>
            {targetTitle && (
              <div style={styles.targetPreview}>
                <span style={styles.targetLabel}>Target:</span>
                <span style={styles.targetName}>"{targetTitle}"</span>
              </div>
            )}

            {error && (
              <div style={styles.errorBanner}>
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <div style={styles.sectionLabel}>Select Reason:</div>
            <div style={styles.categoriesList}>
              {REPORT_CATEGORIES.map((cat) => (
                <label
                  key={cat.id}
                  style={{
                    ...styles.categoryCard,
                    borderColor: category === cat.id ? '#2563eb' : '#e2e8f0',
                    backgroundColor: category === cat.id ? '#eff6ff' : '#ffffff',
                  }}
                >
                  <input
                    type="radio"
                    name="reportCategory"
                    value={cat.id}
                    checked={category === cat.id}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ marginTop: '3px' }}
                  />
                  <div style={styles.categoryInfo}>
                    <strong style={styles.categoryTitle}>{cat.label}</strong>
                    <span style={styles.categoryDesc}>{cat.desc}</span>
                  </div>
                </label>
              ))}
            </div>

            <div style={{ marginTop: '0.75rem' }}>
              <label style={styles.sectionLabel}>Additional Details (Optional):</label>
              <textarea
                placeholder="Provide additional context or specific timestamps/links..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                style={styles.textArea}
              />
            </div>

            <div style={styles.footer}>
              <button type="button" onClick={onClose} style={styles.cancelBtn}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  ...styles.submitBtn,
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Filing Report...</span>
                  </>
                ) : (
                  <span>Submit Report</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '540px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  iconCircle: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: '#fef2f2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: '1.125rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  subtitle: {
    fontSize: '0.75rem',
    color: '#64748b',
    marginTop: '0.125rem',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
  },
  body: {
    padding: '1.25rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  targetPreview: {
    padding: '0.625rem 0.875rem',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '0.8125rem',
    color: '#475569',
    display: 'flex',
    gap: '0.375rem',
  },
  targetLabel: {
    fontWeight: 600,
    color: '#64748b',
  },
  targetName: {
    fontWeight: 500,
    color: '#0f172a',
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    border: '1px solid #fecaca',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    fontSize: '0.8125rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  sectionLabel: {
    fontSize: '0.8125rem',
    fontWeight: 700,
    color: '#334155',
    display: 'block',
    marginBottom: '0.375rem',
  },
  categoriesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  categoryCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.625rem',
    padding: '0.625rem 0.875rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  categoryInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
  },
  categoryTitle: {
    fontSize: '0.875rem',
    color: '#0f172a',
  },
  categoryDesc: {
    fontSize: '0.75rem',
    color: '#64748b',
  },
  textArea: {
    width: '100%',
    padding: '0.625rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.875rem',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '0.75rem',
    paddingTop: '0.75rem',
    borderTop: '1px solid #f1f5f9',
  },
  cancelBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#64748b',
    cursor: 'pointer',
  },
  submitBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.5rem 1.25rem',
    backgroundColor: '#dc2626',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#ffffff',
    cursor: 'pointer',
  },
  successState: {
    padding: '3rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '0.75rem',
  },
  successHeading: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  successText: {
    fontSize: '0.875rem',
    color: '#64748b',
    maxWidth: '380px',
  },
};
