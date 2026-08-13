import React, { useState, useEffect } from 'react';
import { Award, Check, Sparkles, X } from 'lucide-react';
import type { MedalSummary } from '../../types';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

interface MedalControlProps {
  questionId: string;
  isAuthor: boolean;
}

export const MedalControl: React.FC<MedalControlProps> = ({ questionId, isAuthor }) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [summary, setSummary] = useState<MedalSummary>({
    gold: 0,
    silver: 0,
    bronze: 0,
    total: 0,
    userMedal: null,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api.getQuestionMedals(questionId)
      .then((data) => setSummary(data))
      .catch(() => {});
  }, [questionId]);

  const handleSelectMedal = async (tier: 'gold' | 'silver' | 'bronze') => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (isAuthor) {
      alert('You cannot give a medal to your own question.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (summary.userMedal === tier) {
        // Toggle off
        const updated = await api.removeMedal(questionId);
        setSummary(updated);
      } else {
        const res = await api.giveMedal(questionId, tier);
        setSummary(res.summary);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to award medal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <button
        type="button"
        onClick={() => {
          if (!isAuthenticated) {
            openAuthModal('login');
            return;
          }
          if (isAuthor) {
            alert('You cannot give a medal to your own question.');
            return;
          }
          setIsModalOpen(true);
        }}
        style={{
          ...styles.medalBtn,
          ...(summary.userMedal ? styles.medalBtnActive : {}),
        }}
        title="Award a community medal for high quality"
      >
        <Award size={16} color={summary.userMedal ? '#eab308' : '#64748b'} />
        <span>Medal</span>
        {summary.total > 0 && <span style={styles.counter}>{summary.total}</span>}
      </button>

      {/* Modal / Popover */}
      {isModalOpen && (
        <div style={styles.overlay} onClick={() => setIsModalOpen(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitleRow}>
                <Sparkles size={18} color="#eab308" />
                <h3 style={styles.modalTitle}>Endorse with a Medal</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={styles.closeBtn}
              >
                <X size={18} />
              </button>
            </div>

            <p style={styles.modalSubtitle}>
              Give a medal to acknowledge well-structured, insightful, or exceptionally helpful questions.
            </p>

            <div style={styles.tiersList}>
              {/* Gold */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSelectMedal('gold')}
                style={{
                  ...styles.tierCard,
                  borderColor: summary.userMedal === 'gold' ? '#eab308' : '#e2e8f0',
                  backgroundColor: summary.userMedal === 'gold' ? '#fefce8' : '#ffffff',
                }}
              >
                <div style={{ ...styles.tierBadge, backgroundColor: '#fef08a', color: '#854d0e' }}>
                  <Award size={20} />
                </div>
                <div style={styles.tierInfo}>
                  <div style={styles.tierNameRow}>
                    <strong style={{ color: '#854d0e' }}>Gold Medal</strong>
                    {summary.userMedal === 'gold' && <Check size={16} color="#854d0e" />}
                  </div>
                  <p style={styles.tierDesc}>Masterful problem statement with minimal reproducible examples.</p>
                </div>
              </button>

              {/* Silver */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSelectMedal('silver')}
                style={{
                  ...styles.tierCard,
                  borderColor: summary.userMedal === 'silver' ? '#94a3b8' : '#e2e8f0',
                  backgroundColor: summary.userMedal === 'silver' ? '#f8fafc' : '#ffffff',
                }}
              >
                <div style={{ ...styles.tierBadge, backgroundColor: '#e2e8f0', color: '#334155' }}>
                  <Award size={20} />
                </div>
                <div style={styles.tierInfo}>
                  <div style={styles.tierNameRow}>
                    <strong style={{ color: '#334155' }}>Silver Medal</strong>
                    {summary.userMedal === 'silver' && <Check size={16} color="#334155" />}
                  </div>
                  <p style={styles.tierDesc}>Great technical depth, thorough explanations and logs.</p>
                </div>
              </button>

              {/* Bronze */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSelectMedal('bronze')}
                style={{
                  ...styles.tierCard,
                  borderColor: summary.userMedal === 'bronze' ? '#d97706' : '#e2e8f0',
                  backgroundColor: summary.userMedal === 'bronze' ? '#fffbeb' : '#ffffff',
                }}
              >
                <div style={{ ...styles.tierBadge, backgroundColor: '#fed7aa', color: '#9a3412' }}>
                  <Award size={20} />
                </div>
                <div style={styles.tierInfo}>
                  <div style={styles.tierNameRow}>
                    <strong style={{ color: '#9a3412' }}>Bronze Medal</strong>
                    {summary.userMedal === 'bronze' && <Check size={16} color="#9a3412" />}
                  </div>
                  <p style={styles.tierDesc}>Helpful, clear, and relevant programming question.</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    display: 'inline-block',
  },
  medalBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.375rem 0.625rem',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#64748b',
    cursor: 'pointer',
  },
  medalBtnActive: {
    backgroundColor: '#fefce8',
    borderColor: '#fef08a',
    color: '#854d0e',
  },
  counter: {
    backgroundColor: '#f1f5f9',
    padding: '0.125rem 0.375rem',
    borderRadius: '4px',
    fontSize: '0.6875rem',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1100,
    padding: '1rem',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '420px',
    padding: '1.5rem',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
  },
  modalTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  modalTitle: {
    fontSize: '1.125rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '2px',
  },
  modalSubtitle: {
    fontSize: '0.8125rem',
    color: '#64748b',
    lineHeight: 1.45,
    marginBottom: '1.25rem',
  },
  tiersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  tierCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.875rem',
    padding: '0.875rem',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    transition: 'all 0.15s ease',
  },
  tierBadge: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tierInfo: {
    flexGrow: 1,
  },
  tierNameRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '0.875rem',
  },
  tierDesc: {
    fontSize: '0.75rem',
    color: '#64748b',
    marginTop: '0.125rem',
  },
};
